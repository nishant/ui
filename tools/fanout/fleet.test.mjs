import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fleetFromCatalog } from './fleet.mjs';

const cat = (...repos) => ({ sites: [], repos });

test('defaults for a minimal entry', () => {
  const [e] = fleetFromCatalog(cat({ repo: 'nishant/status', fleet: true }));
  assert.deepEqual(e, {
    repo: 'nishant/status',
    name: 'status',
    base: 'master',
    ui: 'none',
    uiDir: '.',
    uiExtraDirs: [],
    bump: null,
    live: null,
    checkout: 'status',
    hosts: [],
    deploy: 'deploy.yml',
    fold: false,
  });
});

test('full entries: name, bump, live, hosts, id as checkout, none', () => {
  const [h, n, s] = fleetFromCatalog(
    cat(
      {
        repo: 'nishant/hosting',
        id: 'hosting',
        name: 'Hosting',
        fleet: true,
        ui: 'vendored',
        bump: 'node scripts/sync-ui.mjs && cd minecraft && npm ci',
        live: 'C:\Apps\hosting',
        hosts: ['minecraft.nish.software', 'trips.nish.software', 'design.nish.software'],
        deploy: 'deploy.yml',
        fold: true,
      },
      { repo: 'nishant/nishboard', fleet: true, ui: 'pnpm', uiDir: 'apps/renderer', live: 'none', hosts: [], deploy: 'release.yml', fold: false },
      { repo: 'nishant/nishant.github.io', id: 'startpage', fleet: true },
    ),
  );
  assert.equal(h.name, 'Hosting');
  assert.equal(h.bump, 'node scripts/sync-ui.mjs && cd minecraft && npm ci');
  assert.equal(h.live, 'C:\Apps\hosting');
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
  assert.equal(fleetFromCatalog(cat({ repo: 'a/b', fleet: true, ui: 'none' }))[0].ui, 'none');
  assert.equal(fleetFromCatalog(cat({ repo: 'a/b', fleet: true, ui: 'yarn' }))[0].ui, 'none');
});

test('only fleet: true repos with a repo name; unknown keys are ignored', () => {
  const list = fleetFromCatalog(
    cat(
      { name: 'orphan', fleet: true, ui: 'npm' },
      { repo: 'a/nofleet', ui: 'npm' },
      { repo: 'a/off', fleet: false, ui: 'npm' },
      { repo: 'a/b', fleet: true, colour: 'red' },
    ),
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].repo, 'a/b');
  assert.equal('colour' in list[0], false);
});

test('accepts catalog text and tolerates a missing repos list', () => {
  assert.equal(fleetFromCatalog(JSON.stringify(cat({ repo: 'a/b', fleet: true })))[0].repo, 'a/b');
  assert.deepEqual(fleetFromCatalog({}), []);
});

test('CLI --matrix prints the matrix and handles an unknown repo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-test-'));
  const file = join(dir, 'catalog.json');
  writeFileSync(file, JSON.stringify(cat({ repo: 'a/b', fleet: true, ui: 'npm' }, { repo: 'a/c', fleet: true, ui: 'pnpm' }, { repo: 'a/d', ui: 'npm' })));
  const cli = new URL('./fleet.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const all = spawnSync(process.execPath, [cli, file, '--matrix'], { encoding: 'utf8' });
  assert.equal(all.stdout.trim(), 'matrix=[{"repo":"a/b"},{"repo":"a/c"}]');
  const one = spawnSync(process.execPath, [cli, file, '--matrix', '--repo', 'a/c'], { encoding: 'utf8' });
  assert.equal(one.stdout.trim(), 'matrix=[{"repo":"a/c"}]');
  const none = spawnSync(process.execPath, [cli, file, '--matrix', '--repo', 'x/y'], { encoding: 'utf8' });
  assert.equal(none.stdout.trim(), 'matrix=[]');
  assert.match(none.stderr, /Unknown repo x\/y/);
});

test('uiExtraDirs: string array, default empty', () => {
  const [j, t, d] = fleetFromCatalog(
    cat(
      { repo: 'nishant/job-apps', fleet: true, ui: 'npm', uiDir: 'apps/web', uiExtraDirs: ['packages/worker'] },
      { repo: 'nishant/trading', fleet: true, ui: 'pnpm', uiDir: 'apps/web', uiExtraDirs: ['packages/server', 'packages/cli'] },
      { repo: 'a/b', fleet: true, ui: 'npm' },
    ),
  );
  assert.deepEqual(j.uiExtraDirs, ['packages/worker']);
  assert.deepEqual(t.uiExtraDirs, ['packages/server', 'packages/cli']);
  assert.deepEqual(d.uiExtraDirs, []);
});
