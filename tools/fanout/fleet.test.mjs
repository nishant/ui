import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseFleet } from './fleet.mjs';

test('defaults for a minimal entry', () => {
  const [e] = parseFleet('- repo: nishant/status\n');
  assert.deepEqual(e, {
    repo: 'nishant/status',
    name: 'status',
    base: 'master',
    ui: 'none',
    uiDir: '.',
    bump: null,
    live: null,
    checkout: 'status',
    hosts: [],
    deploy: 'deploy.yml',
    fold: false,
  });
});

test('comments, full entry, none, hosts list, quotes', () => {
  const text = `# header comment
- repo: nishant/hosting   # trailing comment
  name: Hosting
  ui: vendored
  bump: node scripts/sync-ui.mjs && cd minecraft && npm ci
  live: C:\\Apps\\hosting
  hosts: minecraft.nish.software, trips.nish.software ,design.nish.software
  deploy: deploy.yml
  fold: yes

- repo: nishant/nishboard
  ui: pnpm
  uiDir: apps/renderer
  live: none
  hosts:
  deploy: release.yml
  fold: no
- repo: nishant/nishant.github.io
  checkout: "startpage"
`;
  const [h, n, s] = parseFleet(text);
  assert.equal(h.name, 'Hosting');
  assert.equal(h.bump, 'node scripts/sync-ui.mjs && cd minecraft && npm ci');
  assert.equal(h.live, 'C:\\Apps\\hosting');
  assert.deepEqual(h.hosts, ['minecraft.nish.software', 'trips.nish.software', 'design.nish.software']);
  assert.equal(h.fold, true);
  assert.equal(n.live, null);
  assert.deepEqual(n.hosts, []);
  assert.equal(n.fold, false);
  assert.equal(n.uiDir, 'apps/renderer');
  assert.equal(n.deploy, 'release.yml');
  assert.equal(s.checkout, 'startpage');
});

test('ui none and unknown ui values', () => {
  assert.equal(parseFleet('- repo: a/b\n  ui: none\n')[0].ui, 'none');
  assert.equal(parseFleet('- repo: a/b\n  ui: yarn\n')[0].ui, 'none');
});

test('unknown keys are ignored and entries without repo are dropped', () => {
  const list = parseFleet('- name: orphan\n  ui: npm\n- repo: a/b\n  colour: red\n');
  assert.equal(list.length, 1);
  assert.equal(list[0].repo, 'a/b');
  assert.equal('colour' in list[0], false);
});

test('a # inside a value without leading whitespace is kept', () => {
  assert.equal(parseFleet('- repo: a/b\n  bump: echo a#b\n')[0].bump, 'echo a#b');
});

test('CLI --matrix prints the matrix and handles an unknown repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-test-'));
  const file = join(dir, 'fleet.yaml');
  writeFileSync(file, '- repo: a/b\n  ui: npm\n- repo: a/c\n  ui: pnpm\n');
  const cli = new URL('./fleet.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const all = spawnSync(process.execPath, [cli, file, '--matrix'], { encoding: 'utf8' });
  assert.equal(all.stdout.trim(), 'matrix=[{"repo":"a/b"},{"repo":"a/c"}]');
  const one = spawnSync(process.execPath, [cli, file, '--matrix', '--repo', 'a/c'], { encoding: 'utf8' });
  assert.equal(one.stdout.trim(), 'matrix=[{"repo":"a/c"}]');
  const none = spawnSync(process.execPath, [cli, file, '--matrix', '--repo', 'x/y'], { encoding: 'utf8' });
  assert.equal(none.stdout.trim(), 'matrix=[]');
  assert.match(none.stderr, /Unknown repo x\/y/);
});
