import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';

test('gallery.mjs without --after prints usage and exits 2', () => {
  const r = spawnSync(process.execPath, [join(import.meta.dirname, 'gallery.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: gallery\.mjs --after/);
});
