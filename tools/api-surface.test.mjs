// The public surface cannot shrink by accident. For every JS entry in package.json "exports" this lists
// the runtime exports of the built file, and for dist/nish-components.css the `.nish-*` class names, and
// compares them with tools/api-surface.snapshot.json. A name that is in the snapshot but gone from the
// build fails the test. A new name passes (and the test says so). To remove something on purpose, or to
// record new names, run:
//   npm run build && UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs
// and commit the snapshot with the change, so the removal shows up in review.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = join(root, 'tools/api-surface.snapshot.json');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const update = process.env.UPDATE_API_SURFACE === '1';

/** Entry subpath -> built file, for entries a bundler or Node imports as JavaScript. */
function jsEntries() {
  const out = {};
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    const file = typeof target === 'string' ? target : target.import ?? target.default;
    if (typeof file !== 'string' || !/\.m?js$/.test(file) || file.includes('*')) continue;
    // theme-init.js and theme.global.js are scripts for <script> tags, not modules.
    if (subpath === './theme-init.js' || subpath === './theme.global.js') continue;
    out[subpath] = file;
  }
  return out;
}

const built = existsSync(join(root, 'dist/esm/index.js')) && existsSync(join(root, 'dist/nish-components.css'));

async function current() {
  const entries = {};
  for (const [subpath, file] of Object.entries(jsEntries())) {
    const mod = await import(pathToFileURL(join(root, file)).href);
    entries[subpath] = Object.keys(mod).sort();
  }
  const css = readFileSync(join(root, 'dist/nish-components.css'), 'utf8');
  const classes = [...new Set([...css.matchAll(/\.(nish-[a-zA-Z0-9_-]*[a-zA-Z0-9_])/g)].map((m) => m[1]))].sort();
  return { entries, classes };
}

test('public exports and .nish-* classes only grow unless the snapshot is updated', { skip: !built && 'run npm run build first' }, async () => {
  const now = await current();
  if (update) {
    writeFileSync(snapshotPath, JSON.stringify(now, null, 2) + '\n');
    return;
  }
  const snap = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  const removed = [];
  const added = [];
  for (const [subpath, names] of Object.entries(snap.entries)) {
    const have = new Set(now.entries[subpath] ?? []);
    if (!(subpath in now.entries)) removed.push(`entry ${subpath}`);
    for (const n of names) if (!have.has(n)) removed.push(`${subpath}: ${n}`);
  }
  for (const [subpath, names] of Object.entries(now.entries)) {
    const had = new Set(snap.entries[subpath] ?? []);
    for (const n of names) if (!had.has(n)) added.push(`${subpath}: ${n}`);
  }
  const haveClasses = new Set(now.classes);
  for (const c of snap.classes) if (!haveClasses.has(c)) removed.push(`class .${c}`);
  const hadClasses = new Set(snap.classes);
  for (const c of now.classes) if (!hadClasses.has(c)) added.push(`class .${c}`);
  if (added.length) console.log(`api-surface: ${added.length} new name(s) not in the snapshot yet (UPDATE_API_SURFACE=1 records them): ${added.slice(0, 12).join(', ')}${added.length > 12 ? ', ...' : ''}`);
  assert.deepEqual(removed, [], 'these public names were removed; if on purpose, update tools/api-surface.snapshot.json in the same change');
});

test('every JS entry in package.json exports is listed in the snapshot', { skip: !built && 'run npm run build first' }, () => {
  if (update) return;
  const snap = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  const missing = Object.keys(jsEntries()).filter((s) => !(s in snap.entries));
  assert.deepEqual(missing, [], 'new entries must be recorded in the snapshot');
});
