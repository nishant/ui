// Builds dist/: generated CSS from src/tokens.mjs, the copied fonts, theme-init.js
// with the theme list baked in, the React-free tokens entry, and the JS/types via tsup.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import { COLOR_ROLES, DEFAULT_THEME, SCALE, SHADOWS, SOFT_ROLES, THEMES } from '../src/tokens.mjs';
import { TH_COLORS } from '../src/th-colors.mjs';
import { buildComponentsCss } from './build-components.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');
const HEADER = '/* Generated from src/tokens.mjs by scripts/build.mjs. Do not edit. */\n';

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

execSync('npx tsup', { cwd: root, stdio: 'inherit' });

// --- tokens.css ----------------------------------------------------------------
for (const [name, t] of Object.entries(THEMES)) {
  const missing = COLOR_ROLES.filter((r) => !t.colors[r]);
  if (missing.length) throw new Error(`theme ${name} is missing ${missing.join(', ')}`);
}

const colorBlock = (t) =>
  [`  color-scheme: ${t.scheme};`, ...COLOR_ROLES.map((r) => `  --nish-${r}: ${t.colors[r]};`)].join('\n');

const def = THEMES[DEFAULT_THEME];
const parts = [HEADER];

// Theme-independent tokens.
parts.push(
  ':root {',
  ...Object.entries(SCALE).map(([k, v]) => `  --nish-${k}: ${v};`),
  '}',
  '',
);
// Tokens derived from theme colors (soft tints, shadows, focus). A custom property
// that references another resolves where it is declared, so these are declared on
// every element that sets a theme, not only on html. That lets a nested
// <div data-theme="light"> (the docs site's all-themes view, a preview pane) get
// tints and shadows computed from its own colors.
parts.push(
  ':root,',
  '[data-theme] {',
  ...Object.entries(SHADOWS).map(([k, v]) => `  --nish-shadow-${k}: ${v};`),
  ...SOFT_ROLES.flatMap((r) => [
    `  --nish-${r}-soft: color-mix(in srgb, var(--nish-${r}) 14%, transparent);`,
    // Opaque twin of -soft (14% over the page bg) for sticky and fixed bars.
    `  --nish-${r}-soft-solid: color-mix(in srgb, var(--nish-${r}) 14%, var(--nish-bg));`,
  ]),
  '  --nish-focus: var(--nish-accent);',
  '}',
  '',
);

parts.push(`:root,\n[data-theme='${DEFAULT_THEME}'] {\n${colorBlock(def)}\n}\n`);
// Before any script runs (or with JS off), follow the OS.
parts.push(
  `@media (prefers-color-scheme: light) {\n  :root:not([data-theme]) {\n${colorBlock(THEMES.light)
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')}\n  }\n}\n`,
);
for (const [name, t] of Object.entries(THEMES)) {
  if (name === DEFAULT_THEME) continue;
  parts.push(`[data-theme='${name}'] {\n${colorBlock(t)}\n}\n`);
}
const tokensCss = parts.join('\n');
writeFileSync(join(dist, 'tokens.css'), tokensCss);

// --- fonts, base, nish.css (everything a static page links) -------------------
// Font files get content-hashed names (inter-latin-wght-normal.1a2b3c4d.woff2), so a
// static site can serve /assets with a one-year immutable cache.
const fontDir = join(root, 'node_modules/@fontsource-variable/inter/files');
let fontsCss = readFileSync(join(src, 'css/fonts.css'), 'utf8');
const fontFiles = [];
for (const f of ['inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2']) {
  const buf = readFileSync(join(fontDir, f));
  const hashed = f.replace(/\.woff2$/, `.${createHash('sha256').update(buf).digest('hex').slice(0, 8)}.woff2`);
  writeFileSync(join(dist, 'fonts', hashed), buf);
  const ref = `./fonts/${f}`;
  if (!fontsCss.includes(ref)) throw new Error(`src/css/fonts.css does not reference ${ref}`);
  fontsCss = fontsCss.replaceAll(ref, `./fonts/${hashed}`);
  fontFiles.push(`fonts/${hashed}`);
}
const baseCss = readFileSync(join(src, 'css/base.css'), 'utf8');
writeFileSync(join(dist, 'fonts.css'), fontsCss);
writeFileSync(join(dist, 'base.css'), baseCss);
writeFileSync(join(dist, 'nish.css'), [HEADER, tokensCss, fontsCss, baseCss].join('\n'));
// Opt-in component classes for static pages (not part of nish.css).
const componentsCss = buildComponentsCss(src, dist);

// --- tailwind.css ------------------------------------------------------------------
// Consumers: @import "tailwindcss"; @import "@nish/ui/tailwind.css";
const tailwindCss = [
  HEADER,
  '@import "./tokens.css";',
  '@import "./fonts.css";',
  '@import "./base.css" layer(base);',
  '',
  '/* Class names used by the components in this package. */',
  // Only the shipped component JS (dist/*.js, chunks included). Not .map, .d.ts, theme.global.js
  // or dist/node (the Vite plugin, ESLint preset and CLI). When dist sits in a gitignored
  // node_modules, an explicit @source scans the whole folder, so the exclusions are explicit.
  '@source "./*.js";',
  '@source not "./theme.global.js";',
  '@source not "./node";',
  '@source not "./*.map";',
  '@source not "./*.d.ts";',
  '@source not "./*/**";',
  '',
  '/* dark: follows the active theme, not the OS. */',
  "@custom-variant dark (&:where([data-scheme='dark'], [data-scheme='dark'] *));",
  "@custom-variant light (&:where([data-scheme='light'], [data-scheme='light'] *));",
  '',
  '@theme inline {',
  ...TH_COLORS.map(([name, role]) => `  --color-th-${name}: var(--nish-${role});`),
  // Dense type below text-xs (Nishboard widgets, table meta). cn() knows both sizes.
  ...['2xs', '3xs'].flatMap((s) => [`  --text-${s}: var(--nish-text-${s});`, `  --text-${s}--line-height: var(--nish-text-${s}-lh);`]),
  '  --font-sans: var(--nish-font-sans);',
  '  --font-mono: var(--nish-font-mono);',
  '  --shadow-card: var(--nish-shadow-card);',
  '  --shadow-pop: var(--nish-shadow-pop);',
  '  --shadow-modal: var(--nish-shadow-modal);',
  '  --ease-nish: var(--nish-ease-out);',
  '  --animate-fade-in: nish-fade-in var(--nish-dur-fast) ease-out;',
  '  --animate-rise-in: nish-rise-in var(--nish-dur-fast) var(--nish-ease-out);',
  '  --animate-slide-in-right: nish-slide-in-right var(--nish-dur-med) var(--nish-ease-out);',
  '  --animate-slide-in-left: nish-slide-in-left var(--nish-dur-med) var(--nish-ease-out);',
  '}',
  '',
  // Tailwind 4 dropped the gray default border color and the pointer cursor on buttons;
  // every app had put both back by hand. Base layer, so any utility still wins.
  '@layer base {',
  '  *, ::before, ::after, ::backdrop, ::file-selector-button {',
  '    border-color: var(--nish-line);',
  '  }',
  "  button:not(:disabled), [role='button']:not([aria-disabled='true']) {",
  '    cursor: pointer;',
  '  }',
  '}',
  '',
].join('\n');
writeFileSync(join(dist, 'tailwind.css'), tailwindCss);

// --- theme-init.js -----------------------------------------------------------------
const schemes = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.scheme]));
const bgs = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.colors.bg]));
const init = readFileSync(join(src, 'theme-init.js'), 'utf8')
  .replace('var THEMES = __THEMES__;', `var THEMES = ${JSON.stringify(schemes)};`)
  .replace('var BG = __BG__;', `var BG = ${JSON.stringify(bgs)};`)
  .replace('var DEFAULT = __DEFAULT__;', `var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};`);
testInit(init);
writeFileSync(join(dist, 'theme-init.js'), init);

testGlobal(readFileSync(join(dist, 'theme.global.js'), 'utf8'));
await testSourceScan();
await testVitePlugin();

// --- tokens.js: @nish/ui/tokens, plain data for Node scripts (no React) ------------
// src/tokens.mjs imports nothing, so it ships as is, with its hand-written types.
copyFileSync(join(src, 'tokens.mjs'), join(dist, 'tokens.js'));
copyFileSync(join(src, 'tokens.d.mts'), join(dist, 'tokens.d.ts'));
await testTokensEntry();
await testCn();

// What a static site vendors, with the hashed font names, so a sync script never has
// to guess them (hosting's scripts/sync-ui.mjs can read this instead of a fixed list).
writeFileSync(
  join(dist, 'files.json'),
  JSON.stringify({ static: ['nish.css', componentsCss, 'theme-init.js', 'theme.js', 'theme.global.js', ...fontFiles] }, null, 2) + '\n',
);

console.log('built dist/');

/** dist/tailwind.css must scan only the shipped component JS in dist's top level, never all of dist (that pulled in
 *  .map files with sourcesContent and .d.ts files, which minted classes nothing uses). Checked by a
 *  real Tailwind compile in a temp git project that ignores node_modules, like a consumer's. */
async function testSourceScan() {
  const css = readFileSync(join(dist, 'tailwind.css'), 'utf8');
  if (css.includes('@source "./";')) throw new Error('dist/tailwind.css must not scan all of dist (@source "./")');
  for (const line of ['@source "./*.js";', '@source not "./node";', '@source not "./*.map";', '@source not "./*.d.ts";', '@source not "./*/**";']) {
    if (!css.includes(line)) throw new Error(`dist/tailwind.css must contain ${line}`);
  }

  const { compile } = await import('@tailwindcss/node');
  const { Scanner } = await import('@tailwindcss/oxide');
  const tmp = mkdtempSync(join(tmpdir(), 'nish-scan-'));
  try {
    execSync('git init -q', { cwd: tmp });
    writeFileSync(join(tmp, '.gitignore'), 'node_modules\n');
    const pkg = join(tmp, 'node_modules/@nish/ui/dist');
    mkdirSync(join(pkg, 'node'), { recursive: true });
    mkdirSync(join(pkg, 'sub'), { recursive: true });
    for (const f of ['tokens.css', 'fonts.css', 'base.css', 'tailwind.css']) copyFileSync(join(dist, f), join(pkg, f));
    for (const f of readdirSync(join(dist, 'fonts'))) {
      mkdirSync(join(pkg, 'fonts'), { recursive: true });
      copyFileSync(join(dist, 'fonts', f), join(pkg, 'fonts', f));
    }
    writeFileSync(join(pkg, 'index.js'), 'export const a = "scan-keep-index flex";\n');
    for (const f of ['index.js.map', 'index.d.ts', 'node/x.js', 'theme.global.js', 'sub/x.js']) {
      writeFileSync(join(pkg, f), `x("scan-leak-${f.replace(/[^a-z]/gi, '-')}")`);
    }
    const twIndex = join(root, 'node_modules/tailwindcss/index.css').replaceAll('\\', '/');
    const input = `@import "${twIndex}";\n@import "./node_modules/@nish/ui/dist/tailwind.css";\n`;
    const compiler = await compile(input, { base: tmp, onDependency() {} });
    // Like @tailwindcss/vite and postcss: the auto-detect root (the whole project, which is what
    // reaches the gitignored dist folder) plus the @source entries the stylesheet declares.
    const sources = [...(compiler.root === 'none' ? [] : [{ base: tmp, pattern: '**/*', negated: false }]), ...compiler.sources];
    const scanner = new Scanner({ sources });
    const candidates = scanner.scan();
    const out = compiler.build(candidates);
    // Candidates are only minted into CSS when they are valid utilities; check the scanned strings instead.
    const seen = new Set(candidates);
    const leaked = [...seen].filter((c) => c.startsWith('scan-leak-'));
    if (!seen.has('flex') && !out.includes('.flex')) throw new Error('dist/tailwind.css no longer scans dist/index.js');
    if (leaked.length) throw new Error(`dist/tailwind.css scans files it must not (${leaked.join(', ')})`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** @nish/ui/vite must inject dist/theme-init.js as the first thing in <head>. */
async function testVitePlugin() {
  const { nishThemeInit } = await import(pathToFileURL(join(dist, 'node/vite.js')).href);
  const tags = nishThemeInit().transformIndexHtml.handler('<html><head></head></html>');
  const want = readFileSync(join(dist, 'theme-init.js'), 'utf8').trim();
  if (!Array.isArray(tags) || tags.length !== 1 || tags[0].children !== want || tags[0].injectTo !== 'head-prepend') {
    throw new Error('dist/node/vite.js: nishThemeInit() must inject dist/theme-init.js once, at head-prepend');
  }
}

/** @nish/ui/tokens must load in plain Node with nothing else installed: it may not
 *  import anything, and it must carry the documented exports. */
async function testTokensEntry() {
  const code = readFileSync(join(dist, 'tokens.js'), 'utf8');
  if (/^\s*import\s|\brequire\(/m.test(code)) throw new Error('dist/tokens.js must not import anything');
  const mod = await import(pathToFileURL(join(dist, 'tokens.js')).href);
  const want = ['THEMES', 'SCALE', 'COLOR_ROLES', 'SOFT_ROLES', 'HUE_ROLES', 'SHADOWS', 'DEFAULT_THEME'];
  const missing = want.filter((k) => mod[k] === undefined);
  if (missing.length) throw new Error(`dist/tokens.js is missing ${missing.join(', ')}`);
  if (mod.THEMES[mod.DEFAULT_THEME]?.colors.bg !== THEMES[DEFAULT_THEME].colors.bg) throw new Error('dist/tokens.js THEMES differ from src');
}

/** tailwind-merge must keep a th-* color next to the small type sizes and the custom
 *  shadows, and still resolve real conflicts. */
async function testCn() {
  const { cn } = await import(pathToFileURL(join(dist, 'index.js')).href);
  const cases = [
    [['text-th-hi', 'text-2xs'], 'text-th-hi text-2xs'],
    [['text-th-hi2', 'text-3xs'], 'text-th-hi2 text-3xs'],
    [['text-2xs text-th-hi', 'text-sm'], 'text-th-hi text-sm'],
    [['text-xs', 'text-2xs'], 'text-2xs'],
    [['text-th-hi', 'text-th-accent'], 'text-th-accent'],
    [['shadow-card', 'shadow-pop'], 'shadow-pop'],
    [['text-th-hi', 'text-sm'], 'text-th-hi text-sm'],
  ];
  for (const [input, want] of cases) {
    const got = cn(...input);
    if (got !== want) throw new Error(`cn(${input.map((x) => JSON.stringify(x)).join(', ')}) gave "${got}", expected "${want}"`);
  }
}

/** The classic-script build must define window.nishTheme with the documented API. */
function testGlobal(code) {
  let stored = 'light';
  const attrs = {};
  const el = {
    style: {},
    getAttribute: (k) => attrs[k] ?? null,
    setAttribute: (k, v) => (attrs[k] = v),
  };
  const ctx = {
    document: {
      cookie: '',
      documentElement: el,
      head: { appendChild() {} },
      querySelector: () => null,
      createElement: () => ({}),
      addEventListener() {},
    },
    localStorage: { getItem: () => stored, setItem: (k, v) => (stored = v) },
    location: { hostname: 'localhost', protocol: 'http:' },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '#f7f6f3' }),
    addEventListener() {},
  };
  ctx.window = ctx;
  vm.runInNewContext(code, ctx);
  const api = ctx.window.nishTheme;
  const want = ['initTheme', 'setThemeChoice', 'cycleTheme', 'onThemeChange', 'readToken', 'registerThemes', 'getThemeChoice', 'mountThemeToggle', 'showToast', 'confirmDialog', 'mountTooltips'];
  const missing = want.filter((k) => typeof api?.[k] !== 'function');
  if (missing.length) throw new Error(`theme.global.js: window.nishTheme is missing ${missing.join(', ')}`);
  if (api.initTheme() !== 'light' || attrs['data-theme'] !== 'light') {
    throw new Error(`theme.global.js: initTheme() gave ${attrs['data-theme']}, expected light`);
  }

  // mountThemeToggle: label, data-choice, icons, cycling and cleanup.
  const btnAttrs = {};
  const icons = ['system', 'light', 'dark'].map((id) => {
    const a = { 'data-icon': id };
    return { getAttribute: (k) => a[k] ?? null, setAttribute: (k, v) => (a[k] = v), removeAttribute: (k) => delete a[k], a };
  });
  const handlers = {};
  const word = { textContent: '' };
  const button = {
    tagName: 'BUTTON',
    innerHTML: '',
    getAttribute: (k) => btnAttrs[k] ?? null,
    setAttribute: (k, v) => (btnAttrs[k] = v),
    querySelector: (sel) => (sel === '[data-theme-word]' && button.innerHTML.includes('data-theme-word') ? word : null),
    querySelectorAll: () => icons,
    addEventListener: (t, fn) => (handlers[t] = fn),
    removeEventListener: (t, fn) => handlers[t] === fn && delete handlers[t],
  };
  const expectLabel = (want, step) => {
    if (btnAttrs['aria-label'] !== want || btnAttrs.title !== want) {
      throw new Error(`theme.global.js: mountThemeToggle ${step}: label "${btnAttrs['aria-label']}", expected "${want}"`);
    }
  };
  const stop = api.mountThemeToggle(button);
  if (btnAttrs.type !== 'button' || !button.innerHTML.includes('data-icon="dark"')) throw new Error('theme.global.js: mountThemeToggle did not fill the button');
  expectLabel('Theme: Light. Switch to Dark', 'on light');
  if (btnAttrs['data-choice'] !== 'light' || icons[1].a.display || icons[2].a.display !== 'none') {
    throw new Error('theme.global.js: mountThemeToggle shows the wrong icon');
  }
  handlers.click();
  if (stored !== 'dark') throw new Error(`theme.global.js: a click saved ${stored}, expected dark`);
  expectLabel('Theme: Dark. Switch to System', 'after a click');
  stored = 'mocha';
  api.initTheme();
  expectLabel('Theme: Mocha (set on another site). Switch to System', 'with a preset');
  if (icons[2].a.display) throw new Error('theme.global.js: a dark preset should show the dark icon');
  stop();
  if (handlers.click) throw new Error('theme.global.js: mountThemeToggle cleanup left the click handler');
  const labelled = api.mountThemeToggle(button, { labels: { system: 'Auto', dark: 'Night' } });
  expectLabel('Theme: Mocha (set on another site). Switch to Auto', 'with labels');
  labelled();
  // showLabel: the visible word follows the choice; the label is unchanged.
  const worded = api.mountThemeToggle(button, { showLabel: true });
  if (!button.innerHTML.includes('data-theme-word') || word.textContent !== 'Mocha') {
    throw new Error(`theme.global.js: mountThemeToggle showLabel word "${word.textContent}", expected "Mocha"`);
  }
  expectLabel('Theme: Mocha (set on another site). Switch to System', 'with showLabel');
  handlers.click();
  if (word.textContent !== 'System') throw new Error(`theme.global.js: showLabel word "${word.textContent}" after a click, expected "System"`);
  worded();
}

/** Run the pre-paint script against a stub document: v0.1.0 shipped one that threw. */
function testInit(code) {
  const cases = [
    { cookie: 'nish-theme=light', expect: 'light' },
    { cookie: 'a=1; nish-theme=mocha', expect: 'mocha' },
    { cookie: '', stored: 'slate', expect: 'slate' },
    { cookie: '', light: true, expect: 'light' },
    { cookie: '', expect: DEFAULT_THEME },
    { cookie: 'nish-theme=bogus', expect: DEFAULT_THEME },
    { cookie: 'nish-theme=mocha', allowed: 'dark light', expect: 'dark' },
    { cookie: 'nish-theme=rose', extra: { rose: 'light' }, expect: 'rose', scheme: 'light' },
    { cookie: 'nish-theme=rose', expect: DEFAULT_THEME },
    // <meta name="theme-color">: created when missing, updated when the page has one,
    // and left alone for an app's own theme (theme.ts sets it once the CSS is live).
    { cookie: 'nish-theme=light', expect: 'light', meta: THEMES.light.colors.bg },
    { cookie: '', light: true, expect: 'light', meta: THEMES.light.colors.bg, hasMeta: '#000000' },
    { cookie: 'nish-theme=mocha', expect: 'mocha', meta: THEMES.mocha.colors.bg, hasMeta: '#0a0b0f' },
    { cookie: 'nish-theme=mocha', allowed: 'dark light', expect: 'dark', meta: THEMES.dark.colors.bg },
    { cookie: 'nish-theme=rose', extra: { rose: 'light' }, expect: 'rose', scheme: 'light', meta: null },
    { cookie: 'nish-theme=rose', extra: { rose: 'light' }, expect: 'rose', scheme: 'light', meta: '#123456', hasMeta: '#123456' },
  ];
  for (const c of cases) {
    const attrs = { 'data-nish-themes': c.allowed ?? null };
    const root = {
      style: {},
      getAttribute: (k) => attrs[k] ?? null,
      setAttribute: (k, v) => (attrs[k] = v),
    };
    const makeMeta = (content) => {
      const a = { name: 'theme-color', content };
      return { setAttribute: (k, v) => (a[k] = v), get content() { return a.content ?? null; } };
    };
    let meta = c.hasMeta ? makeMeta(c.hasMeta) : null;
    const head = { appendChild: (el) => (meta = el) };
    const ctx = {
      document: {
        cookie: c.cookie,
        documentElement: root,
        head,
        querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? meta : null),
        createElement: () => makeMeta(undefined),
      },
      localStorage: { getItem: () => c.stored ?? null },
      window: { matchMedia: () => ({ matches: !!c.light }), __nishExtraThemes: c.extra },
    };
    new Function('document', 'localStorage', 'window', code)(ctx.document, ctx.localStorage, ctx.window);
    if (attrs['data-theme'] !== c.expect || attrs['data-scheme'] !== (c.scheme ?? THEMES[c.expect].scheme)) {
      throw new Error(`theme-init.js: ${JSON.stringify(c)} gave ${attrs['data-theme']}/${attrs['data-scheme']}`);
    }
    if ('meta' in c && (meta?.content ?? null) !== c.meta) {
      throw new Error(`theme-init.js: ${JSON.stringify(c)} set theme-color to ${meta?.content}, expected ${c.meta}`);
    }
  }
  // Without querySelector (an odd embed), the theme must still apply.
  const attrs = {};
  const bare = { style: {}, getAttribute: () => null, setAttribute: (k, v) => (attrs[k] = v) };
  new Function('document', 'localStorage', 'window', code)(
    { cookie: 'nish-theme=light', documentElement: bare },
    { getItem: () => null },
    { matchMedia: () => ({ matches: false }) },
  );
  if (attrs['data-theme'] !== 'light') throw new Error('theme-init.js threw without document.querySelector');
}
