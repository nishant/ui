// Guards dist/elements.js: within the size budget, self-contained, and Lit stays out of the
// React entry. Run after `npm run build` (part of `npm run check`).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = 'dist';
const BUDGET = 20480;

const fail = (msg) => {
  console.error(`elements-check: ${msg}`);
  process.exit(1);
};

const file = join(dist, 'elements.js');
let code;
try {
  code = readFileSync(file, 'utf8');
} catch {
  fail('dist/elements.js is missing (did the build run?)');
}

const gz = gzipSync(code).length;
if (gz > BUDGET) fail(`dist/elements.js is ${gz} bytes gzipped, over the ${BUDGET} byte budget`);

// A static import or export-from means a second file has to load. Dynamic import() is also out:
// the bundle must work as one vendored file.
if (/(^|[;}\s])(import|export)\s*[^;(]*?\bfrom\s*["']/.test(code) || /(^|[;}\s])import\s*["']/.test(code) || /\bimport\s*\(/.test(code)) {
  fail('dist/elements.js has an import statement; it must be self-contained');
}

// The public types must not import lit (a devDependency): consumers would lose HTMLElement typing.
const dts = readFileSync(join(dist, 'elements.d.ts'), 'utf8');
if (/from\s*['"](lit|@lit\/|lit-html|lit-element)/.test(dts) || /import\s*['"]lit/.test(dts)) fail("dist/elements.d.ts imports 'lit'; bundle its declarations");

for (const name of readdirSync(dist)) {
  if (name !== 'index.js' && !/^chunk-.*\.js$/.test(name)) continue;
  const text = readFileSync(join(dist, name), 'utf8');
  if (text.includes('lit-html') || text.includes('LitElement')) fail(`dist/${name} contains Lit; React apps must never load it`);
}

console.log(`elements-check ok: dist/elements.js ${gz} bytes gzipped (budget ${BUDGET})`);
