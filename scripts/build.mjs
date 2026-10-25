// Builds dist/: generated CSS from src/tokens.mjs, the copied fonts, theme-init.js
// with the theme list baked in, and the JS/types via tsup.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { COLOR_ROLES, DEFAULT_THEME, SCALE, SHADOWS, SOFT_ROLES, THEMES } from '../src/tokens.mjs';

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

// Theme-independent tokens and the derived soft tints. Soft tints live on the same
// element as the theme (html), so they resolve against the active theme's colors.
parts.push(
  ':root {',
  ...Object.entries(SCALE).map(([k, v]) => `  --nish-${k}: ${v};`),
  ...Object.entries(SHADOWS).map(([k, v]) => `  --nish-shadow-${k}: ${v};`),
  ...SOFT_ROLES.map((r) => `  --nish-${r}-soft: color-mix(in srgb, var(--nish-${r}) 14%, transparent);`),
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
const fontDir = join(root, 'node_modules/@fontsource-variable/inter/files');
for (const f of ['inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2']) {
  cpSync(join(fontDir, f), join(dist, 'fonts', f));
}
const fontsCss = readFileSync(join(src, 'css/fonts.css'), 'utf8');
const baseCss = readFileSync(join(src, 'css/base.css'), 'utf8');
writeFileSync(join(dist, 'fonts.css'), fontsCss);
writeFileSync(join(dist, 'base.css'), baseCss);
writeFileSync(join(dist, 'nish.css'), [HEADER, tokensCss, fontsCss, baseCss].join('\n'));

// --- tailwind.css ------------------------------------------------------------------
// Consumers: @import "tailwindcss"; @import "@nish/ui/tailwind.css";
const twColors = [
  ...COLOR_ROLES.filter((r) => !r.startsWith('chart-')).map((r) => [r, r]),
  ...COLOR_ROLES.filter((r) => r.startsWith('chart-')).map((r) => [r, r]),
  ...SOFT_ROLES.map((r) => [`${r}-soft`, `${r}-soft`]),
  // Aliases for the names trading and nishboard already use.
  ['gain', 'ok'],
  ['danger', 'loss'],
  ['2', 'hi2'],
  ['3', 'hi3'],
  ['bar', 'surface'],
  ['focus', 'focus'],
];
const tailwindCss = [
  HEADER,
  '@import "./tokens.css";',
  '@import "./fonts.css";',
  '@import "./base.css" layer(base);',
  '',
  '/* Class names used by the components in this package. */',
  '@source "./";',
  '',
  '/* dark: follows the active theme, not the OS. */',
  "@custom-variant dark (&:where([data-scheme='dark'], [data-scheme='dark'] *));",
  "@custom-variant light (&:where([data-scheme='light'], [data-scheme='light'] *));",
  '',
  '@theme inline {',
  ...twColors.map(([name, role]) => `  --color-th-${name}: var(--nish-${role});`),
  '  --font-sans: var(--nish-font-sans);',
  '  --font-mono: var(--nish-font-mono);',
  '  --shadow-card: var(--nish-shadow-card);',
  '  --shadow-pop: var(--nish-shadow-pop);',
  '  --shadow-modal: var(--nish-shadow-modal);',
  '  --ease-nish: var(--nish-ease-out);',
  '  --animate-fade-in: nish-fade-in var(--nish-dur-fast) ease-out;',
  '  --animate-rise-in: nish-rise-in var(--nish-dur-fast) var(--nish-ease-out);',
  '}',
  '',
].join('\n');
writeFileSync(join(dist, 'tailwind.css'), tailwindCss);

// --- theme-init.js -----------------------------------------------------------------
const schemes = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.scheme]));
const init = readFileSync(join(src, 'theme-init.js'), 'utf8')
  .replace('var THEMES = __THEMES__;', `var THEMES = ${JSON.stringify(schemes)};`)
  .replace('var DEFAULT = __DEFAULT__;', `var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};`);
testInit(init);
writeFileSync(join(dist, 'theme-init.js'), init);

console.log('built dist/');

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
  ];
  for (const c of cases) {
    const attrs = { 'data-nish-themes': c.allowed ?? null };
    const root = {
      style: {},
      getAttribute: (k) => attrs[k] ?? null,
      setAttribute: (k, v) => (attrs[k] = v),
    };
    const ctx = {
      document: { cookie: c.cookie, documentElement: root },
      localStorage: { getItem: () => c.stored ?? null },
      window: { matchMedia: () => ({ matches: !!c.light }) },
    };
    new Function('document', 'localStorage', 'window', code)(ctx.document, ctx.localStorage, ctx.window);
    if (attrs['data-theme'] !== c.expect || attrs['data-scheme'] !== THEMES[c.expect].scheme) {
      throw new Error(`theme-init.js: ${JSON.stringify(c)} gave ${attrs['data-theme']}/${attrs['data-scheme']}`);
    }
  }
}
