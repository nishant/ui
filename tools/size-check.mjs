// Size budgets: bundles each listed import from dist/esm with esbuild and code splitting (minified; react, react-dom and
// the JSX runtime external, like an app that has them anyway), gzips the initial chunk (the entry plus its static imports;
// lazy chunks are printed, not budgeted) and fails when a budget in tools/size-budgets.json is exceeded or a
// `mustNotInclude` module is in the initial chunk. Also checks the unpacked size of `npm pack`. Run after `npm run build`: `npm run size`.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
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

const cacheDir = join(root, 'node_modules/.cache/nish-size');
const slash = (p) => p.split('\\').join('/');

/**
 * Builds `import { name } from from` (or `import * as ns`) with code splitting. The initial set is the entry output plus
 * everything it imports statically (what loads before first render); every other output is lazy. Returns gzip bytes of
 * each set and the `mustNotInclude` paths found among the initial set's inputs.
 */
async function measure({ from, import: name, mustNotInclude = [] }, i) {
  const file = subpath[from];
  if (!file) throw new Error(`size-budgets.json: unknown module ${from}`);
  const target = slash(join(esm, file));
  const contents = name === '*' ? `export * from ${JSON.stringify(target)};` : `export { ${name} } from ${JSON.stringify(target)};`;
  const entry = join(cacheDir, `entry-${i}.mjs`);
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(entry, contents);
  const res = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: join(cacheDir, 'out'),
    write: false,
    metafile: true,
    minify: true,
    target: 'es2022',
    platform: 'browser',
    treeShaking: true,
    absWorkingDir: root,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/*'],
    logLevel: 'error',
  });
  const outputs = res.metafile.outputs;
  const contentOf = new Map(res.outputFiles.map((f) => [slash(relative(root, f.path)), f.contents]));
  const entryKey = slash(relative(root, entry));
  const entryOut = Object.keys(outputs).find((k) => outputs[k].entryPoint && slash(outputs[k].entryPoint) === entryKey);
  if (!entryOut) throw new Error(`size-check: no output for entry ${i}`);
  const initial = [];
  const seen = new Set();
  const visit = (k) => {
    if (seen.has(k)) return;
    seen.add(k);
    initial.push(k);
    for (const imp of outputs[k].imports) if (imp.kind === 'import-statement' && !imp.external) visit(slash(imp.path));
  };
  visit(entryOut);
  const lazy = Object.keys(outputs).filter((k) => k.endsWith('.js') && !seen.has(k));
  const gz = (keys) => (keys.length ? gzipSync(Buffer.concat(keys.map((k) => Buffer.from(contentOf.get(k)))), { level: 9 }).length : 0);
  const inputs = initial.flatMap((k) => Object.keys(outputs[k].inputs).map(slash));
  const leaked = mustNotInclude.filter((p) => inputs.some((inp) => inp.endsWith(`dist/esm/${p}`)));
  return { initial: gz(initial), lazy: gz(lazy), leaked };
}

const rows = [];
let failed = false;
try {
  for (const [i, b] of budgets.imports.entries()) {
    const m = await measure(b, i);
    const kb = m.initial / 1024;
    const over = kb > b.maxKB;
    if (over || m.leaked.length) failed = true;
    rows.push({ name: b.name, kb, lazyKb: m.lazy / 1024, max: b.maxKB, over, leaked: m.leaked });
  }
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
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
console.log(`${'import'.padEnd(w)}  ${'initial KB'.padStart(10)}  ${'lazy KB'.padStart(8)}  ${'budget'.padStart(7)}`);
for (const r of rows) {
  console.log(`${r.name.padEnd(w)}  ${r.kb.toFixed(2).padStart(10)}  ${r.lazyKb.toFixed(2).padStart(8)}  ${String(r.max).padStart(7)}${r.over ? '  OVER BUDGET' : ''}`);
  for (const p of r.leaked) console.log(`${''.padEnd(w)}  NOT LAZY: ${p}`);
}
console.log(`${'tarball unpacked'.padEnd(w)}  ${(pack.unpackedSize / 1048576).toFixed(2).padStart(6)}MB  ${(budgets.tarballMaxBytes / 1048576).toFixed(2).padStart(5)}MB${tarOver ? '  OVER BUDGET' : ''}  (${pack.files.length} files)`);

if (failed) {
  console.error('size-check: failed');
  process.exit(1);
}
console.log('size-check ok');
