// Fails when a docs route loads more JavaScript than its budget. Reads .site-stats.json, which the
// site build (site/vite.config.ts, nish-site-stats) writes at the repo root: the gzip size and the
// links of every chunk. A route's JS is the entry chunk, the shell or frame chunk, the page chunk
// and the doc's chunk, each with everything they import statically (each chunk counted once).
// The docgen data is a static import of the component page, so it is in that page's closure.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const statsFile = join(root, '.site-stats.json');

// gzip KB per route: the measured size rounded up to the next 5 KB, never above the caps in the
// ui-leftovers spec (/overview 200, /components/button 300, /frame/modal 160). Lower, never raise.
const BUDGETS = {
  '/overview': 155,
  '/components/button': 225,
  '/frame/modal': 130,
};

if (!existsSync(statsFile)) {
  console.error('site-bundle-check: run the site build first (.site-stats.json is missing)');
  process.exit(1);
}
const stats = JSON.parse(readFileSync(statsFile, 'utf8'));

/** The chunk whose entry module is `facade` (a repo-relative path). */
function chunkOf(facade) {
  const hit = Object.entries(stats.chunks).find(([, c]) => c.facade === facade);
  if (!hit) {
    console.error(`site-bundle-check: no chunk has ${facade} as its entry module (was it merged into another chunk?)`);
    process.exit(1);
  }
  return hit[0];
}

/** A chunk plus everything it imports statically, recursively. */
function closure(name, into = new Set()) {
  if (into.has(name)) return into;
  into.add(name);
  for (const dep of stats.chunks[name]?.imports ?? []) closure(dep, into);
  return into;
}

const ROUTES = {
  '/overview': ['site/shell.tsx', 'site/pages/overview.tsx'],
  '/components/button': ['site/shell.tsx', 'site/pages/component.tsx', 'site/components/button.tsx'],
  '/frame/modal': ['site/pages/frame.tsx', 'site/components/modal.tsx'],
};

let failed = false;
const rows = [];
for (const [route, facades] of Object.entries(ROUTES)) {
  const set = closure(stats.entry);
  for (const f of facades) closure(chunkOf(f), set);
  const bytes = [...set].reduce((n, c) => n + stats.chunks[c].gzip, 0);
  const kb = bytes / 1024;
  const over = kb > BUDGETS[route];
  if (over) failed = true;
  rows.push([route, kb.toFixed(1), String(BUDGETS[route]), over ? 'OVER' : 'ok', String(set.size)]);
}

const head = ['route', 'gzip KB', 'budget', '', 'chunks'];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r) => r.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
console.log(line(head));
for (const r of rows) console.log(line(r));

// The biggest single chunk (raw bytes are not in the stats, so this reads the built file).
let biggest = { name: '', size: 0 };
for (const name of Object.keys(stats.chunks)) {
  const f = join(root, 'site-dist', name);
  if (!existsSync(f)) continue;
  const size = readFileSync(f).length;
  if (size > biggest.size) biggest = { name, size };
}
if (biggest.name) console.log(`largest chunk: ${biggest.name}, ${(biggest.size / 1024).toFixed(1)} KB raw`);

if (failed) {
  console.error('site-bundle-check: a route is over its budget');
  process.exit(1);
}
console.log('site-bundle-check: ok');
