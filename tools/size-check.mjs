// Size budgets: bundles each listed import from dist/esm with esbuild as one file with dynamic imports left external
// (minified; react, react-dom and the JSX runtime external, like an app that has them anyway), gzips it as the initial KB
// (lazy targets are measured separately, printed, not budgeted) and fails when a budget in tools/size-budgets.json is exceeded or a
// `mustNotInclude` module is in the initial bundle. Also checks the unpacked size of `npm pack`. Run after `npm run build`: `npm run size`.
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

const slash = (p) => p.split('\\').join('/');
const common = {
  bundle: true,
  splitting: false,
  format: 'esm',
  write: false,
  metafile: true,
  minify: true,
  target: 'es2022',
  platform: 'browser',
  treeShaking: true,
  absWorkingDir: root,
  outdir: join(root, 'node_modules/.cache/nish-size-unused'),
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/*'],
  logLevel: 'error',
};
const gz = (outputFiles) => (outputFiles.length ? gzipSync(Buffer.concat(outputFiles.map((f) => Buffer.from(f.contents))), { level: 9 }).length : 0);

/**
 * Builds `import { name } from from` (or `import * as ns`) as ONE bundle (no code splitting) in which every dynamic
 * import() is left external: exactly the entry plus its static imports, what loads before first render. (esbuild's
 * splitting puts a module that is both statically reachable and an import() target into a shared chunk the entry
 * imports statically, which inflates every row, so it is not used.) Lazy KB bundles the dynamic targets on their own.
 * `mustNotInclude` paths fail when they contribute bytes to the initial bundle.
 */
async function measure({ from, import: name, mustNotInclude = [] }) {
  const file = subpath[from];
  if (!file) throw new Error(`size-budgets.json: unknown module ${from}`);
  const target = slash(join(esm, file));
  const contents = name === '*' ? `export * from ${JSON.stringify(target)};` : `export { ${name} } from ${JSON.stringify(target)};`;
  const dynamic = new Map();
  const lazyPlugin = {
    name: 'lazy',
    setup(b) {
      b.onResolve({ filter: /.*/ }, (a) => {
        if (a.kind !== 'dynamic-import') return undefined;
        if (a.path.startsWith('.')) {
          const p = join(a.resolveDir, a.path);
          dynamic.set(a.path + '|' + a.resolveDir, p.endsWith('.js') ? p : `${p}.js`);
        }
        return { path: a.path, external: true };
      });
    },
  };
  const res = await esbuild.build({ ...common, stdin: { contents, resolveDir: root, loader: 'js' }, plugins: [lazyPlugin] });
  const out = Object.values(res.metafile.outputs)[0];
  const used = Object.entries(out.inputs).filter(([, v]) => v.bytesInOutput > 0).map(([k]) => slash(k));
  const leaked = mustNotInclude.filter((p) => used.some((inp) => inp.endsWith(`dist/esm/${p}`)));
  // Only targets whose import() survived tree shaking in the initial bundle count as lazy.
  const kept = new Set(out.imports.filter((i) => i.kind === 'dynamic-import').map((i) => i.path));
  const targets = [...new Set([...dynamic].filter(([k]) => kept.has(k.split('|')[0])).map(([, v]) => v))];
  let lazy = 0;
  if (targets.length) {
    const lz = await esbuild.build({ ...common, entryPoints: targets, outdir: join(root, 'node_modules/.cache/nish-size-unused'), outbase: root });
    lazy = gz(lz.outputFiles.filter((f) => f.path.endsWith('.js')));
  }
  return { initial: gz(res.outputFiles.filter((f) => f.path.endsWith('.js'))), lazy, leaked };
}

const rows = [];
let failed = false;
for (const b of budgets.imports) {
  const m = await measure(b);
  const kb = m.initial / 1024;
  const over = kb > b.maxKB;
  if (over || m.leaked.length) failed = true;
  rows.push({ name: b.name, kb, lazyKb: m.lazy / 1024, max: b.maxKB, over, leaked: m.leaked });
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
