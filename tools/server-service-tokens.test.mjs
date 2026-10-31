import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkServiceRequest, createServiceTokens, isDirectLoopback, loadServiceTokens, mintServiceToken } from '../dist/server/index.js';

const headers = (h) => (n) => h[n];

test('mint, verify, scope', () => {
  const { token, sha256 } = mintServiceToken('inbox');
  assert.match(token, /^nish_inbox_[A-Za-z0-9_-]{43}$/);
  const t = createServiceTokens([{ id: 'a', name: 'A', scopes: ['read'], sha256, created: '2026-10-31' }]);
  assert.equal(t.verify(`Bearer ${token}`, 'read').ok, true);
  assert.deepEqual(t.verify(`Bearer ${token}`, 'inbox:handle'), { ok: false, status: 403 });
  assert.deepEqual(t.verify(undefined, 'read'), { ok: false, status: 401 });
  assert.deepEqual(t.verify(`Bearer ${mintServiceToken('inbox').token}`, 'read'), { ok: false, status: 401 });
  assert.deepEqual(t.verify(`Basic ${token}`, 'read'), { ok: false, status: 401 });
  assert.equal(JSON.stringify(t.list()).includes(sha256), false);
});

test('load from file and env, skipping bad entries', () => {
  const a = mintServiceToken('jobs');
  const b = mintServiceToken('jobs');
  const dir = mkdtempSync(join(tmpdir(), 'st-'));
  const file = join(dir, 'service-tokens.json');
  writeFileSync(file, JSON.stringify([{ id: 'f', name: 'F', scopes: ['read'], sha256: a.sha256, created: 'x' }, { id: 'bad' }]));
  const t = loadServiceTokens({ file, env: JSON.stringify([{ id: 'e', name: 'E', scopes: ['read'], sha256: b.sha256, created: 'x' }]) });
  assert.equal(t.verify(`Bearer ${a.token}`, 'read').ok, true);
  assert.equal(t.verify(`Bearer ${b.token}`, 'read').ok, true);
  assert.equal(t.list().length, 2);
  assert.equal(loadServiceTokens({ file: join(dir, 'missing.json') }).list().length, 0);
  assert.equal(loadServiceTokens({ env: 'not json' }).list().length, 0);
});

test('direct loopback only', () => {
  assert.equal(isDirectLoopback(headers({ host: '127.0.0.1:8805' }), 8805), true);
  assert.equal(isDirectLoopback(headers({ host: 'localhost:8805' }), 8805), true);
  assert.equal(isDirectLoopback(headers({ host: '127.0.0.1:8804' }), 8805), false);
  assert.equal(isDirectLoopback(headers({ host: 'trackers.nish.software' }), 8804), false);
  assert.equal(isDirectLoopback(headers({ host: '127.0.0.1:8804', 'x-forwarded-for': '1.2.3.4' }), 8804), false);
  assert.equal(isDirectLoopback(headers({ host: '127.0.0.1:8804', 'cf-connecting-ip': '1.2.3.4' }), 8804), false);
  assert.equal(isDirectLoopback(headers({ host: '127.0.0.1:8804', origin: 'http://127.0.0.1:8804' }), 8804), false);
});

test('checkServiceRequest', () => {
  const { token, sha256 } = mintServiceToken('status');
  const tokens = createServiceTokens([{ id: 'a', name: 'A', scopes: ['read'], sha256, created: 'x' }]);
  const o = { tokens, scope: 'read', port: 8803 };
  assert.equal(checkServiceRequest(headers({ host: '127.0.0.1:8803', authorization: `Bearer ${token}` }), o), null);
  assert.deepEqual(checkServiceRequest(headers({ host: 'status.nish.software', authorization: `Bearer ${token}` }), o), { status: 403, error: 'Forbidden' });
  assert.deepEqual(checkServiceRequest(headers({ host: '127.0.0.1:8803' }), o), { status: 401, error: 'Unauthorized' });
});
