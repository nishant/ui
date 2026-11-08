// Checks the package.json exports map against the built package (run after `npm run build`): every JS subpath
// can be import()ed and require()d, every entry has `default` (and `types` for JS), the main entry loads in plain
// Node without a DOM, and every 'use client' source module keeps its directive in dist/esm.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);
const [major, minor] = process.versions.node.split('.').map(Number);
const hasRequireEsm = major > 20 || (major === 20 && minor >= 19);

/** [subpath, target] for every exports entry that resolves to a JS file. */
const jsEntries = Object.entries(pkg.exports).filter(([k, v]) => {
  const target = typeof v === 'string' ? v : (v.import ?? v.default);
  return !k.includes('*') && /\.m?js$/.test(target) && !['./theme-init.js', './theme.global.js'].includes(k);
});
const spec = (k) => (k === '.' ? pkg.name : `${pkg.name}/${k.slice(2)}`);

test('the build output exists', () => {
  assert.ok(existsSync(join(root, 'dist/esm/index.js')), 'run npm run build first');
});

test('every exports entry points at a file that exists', () => {
  for (const [k, v] of Object.entries(pkg.exports)) {
    if (k.includes('*')) continue;
    const targets = typeof v === 'string' ? [v] : Object.values(v);
    for (const t of targets) assert.ok(existsSync(join(root, t)), `${k} -> ${t} is missing`);
  }
});

test('every JS export has types and default, and import comes with default', () => {
  for (const [k, v] of jsEntries) {
    assert.equal(typeof v, 'object', `${k} must be a conditions object`);
    assert.ok(v.types, `${k} has no types`);
    assert.ok(v.default, `${k} has no default`);
    assert.ok(v.import, `${k} has no import`);
    assert.ok(Object.keys(v)[0] === 'types', `${k}: types must come first`);
    assert.ok(existsSync(join(root, v.types)), `${k}: ${v.types} is missing`);
  }
});

test('typesVersions covers every JS subpath', () => {
  const tv = pkg.typesVersions['*'];
  for (const [k, v] of jsEntries) {
    if (k === '.') continue;
    assert.deepEqual(tv[k.slice(2)], [v.types], `typesVersions is missing ${k}`);
  }
});

test('bundlers are pointed at dist/esm and sideEffects stays narrow', () => {
  for (const k of ['.', './theme', './chart', './format', './split-layout', './inbox-client', './system-canvas', './inbox', './service-tokens', './tokens']) {
    assert.match(pkg.exports[k].import, /^\.\/dist\/esm\//, `${k} import`);
    assert.match(pkg.exports[k].default, /^\.\/dist\/esm\//, `${k} default`);
  }
  assert.ok(Array.isArray(pkg.sideEffects));
  for (const s of pkg.sideEffects) assert.ok(/\.css$|elements|theme-init\.js|theme\.global\.js/.test(s), `unexpected sideEffects entry ${s}`);
  assert.ok(!pkg.sideEffects.some((s) => s.includes('esm')));
  assert.ok(pkg.files.includes('!dist/esm/**/*.map'));
  assert.equal(pkg.engines.node, '>=20.19');
});

test('import() works for every JS subpath', async () => {
  for (const [k] of jsEntries) {
    const mod = await import(spec(k));
    assert.ok(Object.keys(mod).length > 0 || k.startsWith('./elements'), `${spec(k)} exports nothing`);
  }
});

test('require() works for every JS subpath', { skip: !hasRequireEsm && 'needs Node 20.19+' }, () => {
  for (const [k] of jsEntries) {
    const mod = require(spec(k));
    assert.ok(mod && typeof mod === 'object', `require(${spec(k)}) gave ${typeof mod}`);
  }
  const { cn } = require(pkg.name);
  assert.equal(cn('a', false, 'b'), 'a b');
});

test("fleet-only names are only on their subpaths", async () => {
  const rootMod = await import(spec('.'));
  const expected = {
    './inbox': ['Inbox', 'INBOX_SOURCE_LABELS'],
    './service-tokens': ['ServiceTokensSection', 'useServiceTokens'],
    './system-canvas': ['DEFAULT_CANVAS_LABELS', 'SystemCanvas', 'layoutSystem', 'pickLayout', 'routeEdges'],
  };
  for (const [k, must] of Object.entries(expected)) {
    const mod = await import(spec(k));
    const names = Object.keys(mod);
    assert.ok(names.length > 0, `${spec(k)} exports nothing`);
    for (const name of must) assert.ok(name in mod, `${spec(k)} does not export ${name}`);
    for (const name of names) assert.ok(!(name in rootMod), `${spec(k)} exports ${name}, which is still on the root entry`);
  }
});

test('dist/esm/index.js loads in plain Node without window or document', () => {
  const code = `
    for (const k of ['window', 'document', 'navigator', 'localStorage', 'matchMedia', 'HTMLElement']) {
      if (k in globalThis && k !== 'navigator') throw new Error(k + ' exists in the test process');
    }
    const m = await import(${JSON.stringify(new URL('../dist/esm/index.js', import.meta.url).href)});
    if (typeof m.cn !== 'function' || typeof m.Button === 'undefined') throw new Error('index.js is missing exports');
    console.log(Object.keys(m).length);
  `;
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: root, encoding: 'utf8' });
  assert.ok(Number(out.trim()) > 50);
});

test("a 'use client' source module keeps its directive as the first line of its output", () => {
  const directive = /^(?:\s*(?:\/\/[^\n]*\n|\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/))*\s*(['"])use client\1/;
  const src = join(root, 'src');
  const clients = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (!['node', 'server', 'elements', 'css'].includes(e.name) || d !== src) walk(p);
      } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') && directive.test(readFileSync(p, 'utf8'))) clients.push(p);
    }
  })(src);
  // A module nothing imports yet (a new component before it is exported) has no output; the rest must keep it.
  let checked = 0;
  for (const f of clients) {
    const out = join(root, 'dist/esm', relative(src, f).replace(/\.tsx?$/, '.js'));
    if (!existsSync(out)) continue;
    checked++;
    assert.equal(readFileSync(out, 'utf8').split('\n')[0], '"use client";', `${relative(root, out)} must start with "use client";`);
  }
  assert.ok(checked > 0 || clients.length === 0, "no 'use client' module reached dist/esm");
});

test('dist/esm modules import each other with .js extensions and nothing outside the allowed externals', () => {
  const allowed = /^(react|react-dom|react\/jsx-runtime|react-dom\/[\w-]+|clsx|tailwind-merge)$/;
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) {
        const code = readFileSync(p, 'utf8');
        for (const m of code.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) {
          const s = m[1];
          if (s.startsWith('.')) assert.match(s, /\.m?js$/, `${relative(root, p)} imports ${s}`);
          else assert.ok(allowed.test(s) || s.startsWith('node:'), `${relative(root, p)} imports ${s}`);
        }
      }
    }
  })(join(root, 'dist/esm'));
});

test("a root export that resolves to a 'use client' module is a component or hook, or on the browser-only allow-list", () => {
  // In a server component every export of a 'use client' module is a client reference, so a plain function or
  // constant there cannot be called or read. Put such values in a *-classes.ts module instead.
  const allow = new Set(['toast', 'dismissToast', 'copyText', 'navigateFromLayer', 'isRtl', 'locationAdapter']);
  const esm = join(root, 'dist/esm');
  const index = readFileSync(join(esm, 'index.js'), 'utf8');
  const bad = [];
  for (const m of index.matchAll(/export\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["']/g)) {
    const file = join(esm, m[2]);
    if (!existsSync(file)) continue;
    if (!/^\s*["']use client["']/.test(readFileSync(file, 'utf8'))) continue;
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (!name || name === 'default') continue;
      if (/^[A-Z]/.test(name) || /^use[A-Z]/.test(name) || allow.has(name)) continue;
      bad.push(`${name} (${m[2]})`);
    }
  }
  assert.deepEqual(bad, [], `these exports live in 'use client' modules but are not components or hooks: ${bad.join(', ')}`);
});
