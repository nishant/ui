import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { redact } from './gh.mjs';
import { bumpTree, latestTag, prBody, resultLine } from './fanout.mjs';

test('prBody: patch, no behavior changes', () => {
  const body = prBody({ pin: 'v0.7.0', tag: 'v0.7.1', behaviorChanges: false, markdown: '### [0.7.1]\n\nDocs.' });
  assert.equal(
    body,
    'Moves @nish/ui from v0.7.0 to v0.7.1. Opened by the ui fan-out.\n\n' +
      'It merges by itself when the checks pass, the Fold check finds no new problems and pages change less than 1% (patch update).\n\n' +
      '## Release notes\n\n### [0.7.1]\n\nDocs.',
  );
});

test('prBody: minor with behavior changes', () => {
  const body = prBody({ pin: 'v0.6.1', tag: 'v0.7.0', behaviorChanges: true, markdown: 'x' });
  assert.match(body, /\*\*Behavior changes:\*\* this release asks apps to change code, so it will not merge by itself\. Adopt it on this branch, then the fan-out merges it on its next run\./);
  assert.match(body, /less than 10% \(minor update\)/);
});

test('latestTag picks the highest version', () => {
  assert.equal(latestTag(['v0.9.0', 'v0.10.0', 'v0.2.1', 'junk', '']), 'v0.10.0');
  assert.equal(latestTag([]), null);
});

test('resultLine', () => {
  assert.equal(resultLine({ repo: 'a/b', result: 'merged', detail: 'deployed', pr: 4 }), '- **a/b**: merged, deployed (#4)');
  assert.equal(resultLine({ repo: 'a/b', result: 'current' }), '- **a/b**: current');
});

test('redact removes the token and clone credentials', () => {
  process.env.GH_TOKEN = 'ghp_secret123';
  assert.equal(redact('failed with ghp_secret123 here'), 'failed with *** here');
  assert.equal(redact('https://x-access-token:abc@github.com/a/b.git'), 'https://x-access-token:***@github.com/a/b.git');
});

test('CLI: missing GH_TOKEN exits 1 with a message', () => {
  const cli = new URL('./fanout.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const env = { ...process.env };
  delete env.GH_TOKEN;
  const r = spawnSync(process.execPath, [cli, '--fleet', 'nope.yaml', '--tag', 'latest'], { encoding: 'utf8', env });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /GH_TOKEN is not set/);
});

const URL_OF = (v) => `https://codeload.github.com/nishant/ui/tar.gz/refs/tags/${v}`;

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'fanout-test-'));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(join(dir, p, '..'), { recursive: true });
    writeFileSync(join(dir, p), text);
  }
  return dir;
}
const pkgWith = (v) => `{\n  "dependencies": {\n    "@nish/ui": "${URL_OF(v)}"\n  }\n}\n`;
const pinIn = (dir, p) => JSON.parse(readFileSync(join(dir, p), 'utf8')).dependencies['@nish/ui'];

test('bumpTree: moves uiDir and every uiExtraDirs folder, one lockfile run at the workspace root', () => {
  const dir = tree({
    'package-lock.json': '{}',
    'apps/web/package.json': pkgWith('v0.9.2'),
    'packages/worker/package.json': pkgWith('v0.8.0'),
  });
  try {
    const calls = [];
    const entry = { ui: 'npm', uiDir: 'apps/web', uiExtraDirs: ['packages/worker'], bump: null };
    const moved = bumpTree(entry, dir, 'v0.9.3', { run: (cmd, o) => calls.push([cmd, o.cwd]) });
    assert.deepEqual(moved, ['apps/web', 'packages/worker']);
    assert.equal(pinIn(dir, 'apps/web/package.json'), URL_OF('v0.9.3'));
    assert.equal(pinIn(dir, 'packages/worker/package.json'), URL_OF('v0.9.3'));
    assert.deepEqual(calls, [['npx -y npm@10 install --package-lock-only --ignore-scripts', dir]]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('bumpTree: uiDir already on the tag still moves the extra folder (pnpm, per-folder lockfiles, bump command)', () => {
  const dir = tree({
    'web/pnpm-lock.yaml': '',
    'web/package.json': pkgWith('v0.9.3'),
    'server/pnpm-lock.yaml': '',
    'server/package.json': pkgWith('v0.8.0'),
  });
  try {
    const calls = [];
    const entry = { ui: 'pnpm', uiDir: 'web', uiExtraDirs: ['server'], bump: 'node x.mjs' };
    const moved = bumpTree(entry, dir, 'v0.9.3', { run: (cmd, o) => calls.push([cmd, o.cwd]) });
    assert.deepEqual(moved, ['server']);
    assert.equal(pinIn(dir, 'server/package.json'), URL_OF('v0.9.3'));
    assert.deepEqual(calls, [
      ['corepack pnpm install --lockfile-only', join(dir, 'web')],
      ['corepack pnpm install --lockfile-only', join(dir, 'server')],
      ['node x.mjs', dir],
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('bumpTree: an entry without uiExtraDirs runs as before (one pin, lockfile at the root)', () => {
  const dir = tree({ 'package.json': pkgWith('v0.9.2'), 'package-lock.json': '{}' });
  try {
    const calls = [];
    const moved = bumpTree({ ui: 'npm', uiDir: '.', uiExtraDirs: [], bump: null }, dir, 'v0.9.3', {
      run: (cmd, o) => calls.push([cmd, o.cwd]),
    });
    assert.deepEqual(moved, ['.']);
    assert.deepEqual(calls, [['npx -y npm@10 install --package-lock-only --ignore-scripts', dir]]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('bumpTree: a folder without a pin throws, naming the file', () => {
  const dir = tree({ 'a/package.json': pkgWith('v0.9.2'), 'b/package.json': '{ "dependencies": {} }' });
  try {
    const at = {};
    assert.throws(
      () => bumpTree({ ui: 'npm', uiDir: 'a', uiExtraDirs: ['b'] }, dir, 'v0.9.3', { run: () => {}, at }),
      /No @nish\/ui pin in b\/package.json/,
    );
    assert.equal(at.step, 'pin rewrite (b/package.json)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
