// Guards every dist/elements*.js: within the size budget, self-contained, and Lit stays out of the
// React entry. Run after `npm run build` (part of `npm run check`).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const dist = 'dist';
const BUDGET = 20480;

const fail = (msg) => {
  console.error(`elements-check: ${msg}`);
  process.exit(1);
};

const entries = readdirSync(dist).filter((n) => /^elements(-[a-z]+)?\.js$/.test(n));
if (!entries.includes('elements.js')) fail('dist/elements.js is missing (did the build run?)');
const ok = [];
for (const entry of entries) {
  const base = entry.replace(/\.js$/, '');
  const code = readFileSync(join(dist, entry), 'utf8');

  const gz = gzipSync(code).length;
  if (gz > BUDGET) fail(`dist/${entry} is ${gz} bytes gzipped, over the ${BUDGET} byte budget`);

  // A static import or export-from means a second file has to load. Dynamic import() is also out:
  // the bundle must work as one vendored file.
  if (/(^|[;}\s])(import|export)\s*[^;(]*?\bfrom\s*["']/.test(code) || /(^|[;}\s])import\s*["']/.test(code) || /\bimport\s*\(/.test(code)) {
    fail(`dist/${entry} has an import statement; it must be self-contained`);
  }

  // The public types must not import lit (a devDependency): consumers would lose HTMLElement typing.
  let dts;
  try {
    dts = readFileSync(join(dist, `${base}.d.ts`), 'utf8');
  } catch {
    fail(`dist/${base}.d.ts is missing`);
  }
  if (/from\s*['"](lit|@lit\/|lit-html|lit-element)/.test(dts) || /import\s*['"]lit/.test(dts)) fail(`dist/${base}.d.ts imports 'lit'; bundle its declarations`);

  // The shipped declarations must compile on their own, strictly, with no skipLibCheck.
  const tsc = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--ignoreConfig', '--strict', '--skipLibCheck', 'false', '--lib', 'es2022,dom', join(dist, `${base}.d.ts`)], { encoding: 'utf8' });
  if (tsc.status !== 0) fail(`dist/${base}.d.ts does not compile on its own:
${tsc.stdout}${tsc.stderr}`);
  ok.push([entry, gz]);
}

for (const name of readdirSync(dist)) {
  if (name !== 'index.js' && !/^chunk-.*\.js$/.test(name)) continue;
  const text = readFileSync(join(dist, name), 'utf8');
  if (text.includes('lit-html') || text.includes('LitElement')) fail(`dist/${name} contains Lit; React apps must never load it`);
}

// A bare side-effect import of an element entry must survive a bundler: package.json "sideEffects"
// has to list the element files, or the import is dropped and no tag registers.
{
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const listed = Array.isArray(pkg.sideEffects) ? pkg.sideEffects : [];
  for (const entry of entries) {
    if (!listed.some((p) => p === `./dist/${entry}` || (p.endsWith('*.js') && entry.startsWith(p.replace(/^\.\/dist\//, '').replace('*.js', ''))))) {
      fail(`package.json sideEffects does not list dist/${entry}; a bundler would drop 'import "nish-ui/elements..."'`);
    }
  }
}

for (const [entry, gz] of ok) console.log(`elements-check ok: dist/${entry} ${gz} bytes gzipped (budget ${BUDGET})`);
