// Size budgets: bundles each listed import from dist/esm with esbuild (minified; react, react-dom and the JSX runtime
// external, like an app that has them anyway), gzips the result and fails when a budget in tools/size-budgets.json is
// exceeded. Also checks the unpacked size of `npm pack`. Run after `npm run build`: `npm run size`.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esm = join(root, 'dist/esm');
const budgets = JSON.parse(readFileSync(join(root, 'tools/size-budgets.json'), 'utf8'));

if (!existsSync(join(esm, 'index.js'))) {
  console.error('size-check: dist/esm is missing (run npm run build first)');
  process.exit(1);
}

const esbuild = await import('esbuild');

// nish-ui, nish-ui/theme and the other subpaths resolve to dist/esm like a bundler resolves the exports map.
const subpath = { 'nish-ui': 'index.js', 'nish-ui/theme': 'theme.js', 'nish-ui/format': 'format.js', 'nish-ui/chart': 'chart.js', 'nish-ui/system-canvas': 'system-canvas.js', 'nish-ui/split-layout': 'split-layout.js', 'nish-ui/inbox-client': 'inbox-client.js' };

/** Gzipped bytes of `import { name } from from` (or `import * as ns`) bundled and minified. */
async function measure({ from, import: name }) {
  const file = subpath[from];
  if (!file) throw new Error(`size-budgets.json: unknown module ${from}`);
  const target = join(esm, file).split('\\').join('/');
  const contents = name === '*' ? `export * from ${JSON.stringify(target)};` : `export { ${name} } from ${JSON.stringify(target)};`;
  const res = await esbuild.build({
    stdin: { contents, resolveDir: root, loader: 'js' },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    treeShaking: true,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/*'],
    logLevel: 'error',
  });
  return gzipSync(res.outputFiles[0].contents, { level: 9 }).length;
}

const rows = [];
let failed = false;
for (const b of budgets.imports) {
  const bytes = await measure(b);
  const kb = bytes / 1024;
  const over = kb > b.maxKB;
  if (over) failed = true;
  rows.push({ name: b.name, kb, max: b.maxKB, over });
}

// npm pack --dry-run --json: unpacked size and file list of the tarball.
let pack;
try {
  const out = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  pack = JSON.parse(out)[0];
} catch (e) {
  console.error('size-check: npm pack --dry-run failed\n' + (e.stderr || e.message));
  process.exit(1);
}
const maps = pack.files.filter((f) => /^dist\/esm\/.*\.map$/.test(f.path));
if (maps.length) {
  console.error(`size-check: the tarball contains ${maps.length} source map(s) under dist/esm`);
  failed = true;
}
const tarOver = pack.unpackedSize > budgets.tarballMaxBytes;
if (tarOver) failed = true;

const w = Math.max(...rows.map((r) => r.name.length), 'tarball unpacked'.length);
console.log(`${'import'.padEnd(w)}  ${'gzip KB'.padStart(8)}  ${'budget'.padStart(7)}`);
for (const r of rows) console.log(`${r.name.padEnd(w)}  ${r.kb.toFixed(2).padStart(8)}  ${String(r.max).padStart(7)}${r.over ? '  OVER BUDGET' : ''}`);
console.log(`${'tarball unpacked'.padEnd(w)}  ${(pack.unpackedSize / 1048576).toFixed(2).padStart(6)}MB  ${(budgets.tarballMaxBytes / 1048576).toFixed(2).padStart(5)}MB${tarOver ? '  OVER BUDGET' : ''}  (${pack.files.length} files)`);

if (failed) {
  console.error('size-check: failed');
  process.exit(1);
}
console.log('size-check ok');
