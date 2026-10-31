// Tests for @nish/ui/server/hono (dist/server/hono.js). Run after `npm run build`:
// node --test tools/server-kit.test.mjs tools/server-hono.test.mjs
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createLimiter, createSessionAuth, hashActionToken, newActionToken } from '../dist/server/index.js';
import {
  clientIpOf, mountInboxAction, mountSessionRoutes, onErrorHandler, remoteAddressOf, requireSession, serveSpa,
} from '../dist/server/hono.js';

const env = (remoteAddress = '203.0.113.5') => ({ incoming: { socket: { remoteAddress } } });
const json = (body, headers = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

function sessionApp(extra = {}) {
  const auth = createSessionAuth({ cookieName: 'test_session', secret: 'test-secret' });
  const app = new Hono();
  mountSessionRoutes(app, { auth, password: 'Hunter2', limiter: createLimiter(), secure: false, ...extra });
  app.get('/api/private', requireSession(auth), (c) => c.json({ ok: true }));
  return { app, auth };
}
const cookieOf = (res) => res.headers.get('set-cookie').split(';')[0];

test('session routes: login, me, logout, wrong password', async () => {
  const { app } = sessionApp();
  const bad = await app.request('/api/login', json({ password: 'nope' }), env());
  assert.equal(bad.status, 401);
  assert.deepEqual(await bad.json(), { error: 'That password is not right.' });

  const ok = await app.request('/api/login', json({ password: 'hunter2' }), env());
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { authed: true });
  const set = ok.headers.get('set-cookie');
  assert.match(set, /^test_session=v1\./);
  assert.match(set, /HttpOnly/);
  assert.doesNotMatch(set, /Secure/);
  const cookie = cookieOf(ok);

  const me = await app.request('/api/me', { headers: { cookie } }, env());
  assert.deepEqual(await me.json(), { authed: true });
  const anon = await app.request('/api/me', {}, env());
  assert.deepEqual(await anon.json(), { authed: false });

  const out = await app.request('/api/logout', { method: 'POST', headers: { cookie } }, env());
  assert.deepEqual(await out.json(), { authed: false });
  assert.match(out.headers.get('set-cookie'), /^test_session=; Max-Age=0/);
});

test('session routes: the 11th failed try in a minute is 429', async () => {
  const { app } = sessionApp();
  for (let i = 0; i < 10; i++) {
    const r = await app.request('/api/login', json({ password: 'x' }), env('198.51.100.9'));
    assert.equal(r.status, 401);
  }
  const blocked = await app.request('/api/login', json({ password: 'hunter2' }), env('198.51.100.9'));
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), { error: 'Too many tries. Wait a minute and try again.' });
  const other = await app.request('/api/login', json({ password: 'hunter2' }), env('198.51.100.10'));
  assert.equal(other.status, 200);
});

test('session routes: errorBody and onSuccess overrides, secure function, bad body', async () => {
  const { app } = sessionApp({
    errorBody: (kind, message) => ({ ok: false, kind, message }),
    onSuccess: (c) => c.json({ ok: true, custom: 1 }),
    secure: () => true,
  });
  const bad = await app.request('/api/login', json({ password: 5 }), env());
  assert.deepEqual(await bad.json(), { ok: false, kind: 'wrong', message: 'That password is not right.' });
  const garbage = await app.request('/api/login', { method: 'POST', body: 'not json' }, env());
  assert.equal(garbage.status, 401);
  const ok = await app.request('/api/login', json({ password: 'Hunter2' }), env());
  assert.deepEqual(await ok.json(), { ok: true, custom: 1 });
  assert.match(ok.headers.get('set-cookie'), /; Secure/);
});

test('requireSession: 401 with the message, passes with a cookie', async () => {
  const auth = createSessionAuth({ cookieName: 'test_session', secret: 'test-secret' });
  const app = new Hono();
  app.get('/a', requireSession(auth), (c) => c.json({ ok: true }));
  app.get('/b', requireSession(auth, { message: 'unauthorized' }), (c) => c.json({ ok: true }));
  const a = await app.request('/a');
  assert.equal(a.status, 401);
  assert.deepEqual(await a.json(), { error: 'Log in to see this.' });
  const b = await app.request('/b');
  assert.deepEqual(await b.json(), { error: 'unauthorized' });
  const token = auth.setCookie(false).split(';')[0];
  const ok = await app.request('/a', { headers: { cookie: token } });
  assert.equal(ok.status, 200);
});

test('clientIpOf uses the rightmost non-loopback XFF; remoteAddressOf reads the socket', async () => {
  const app = new Hono();
  app.get('/ip', (c) => c.json({ ip: clientIpOf(c), peer: remoteAddressOf(c) ?? null }));
  const viaProxy = await app.request('/ip', { headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.7, 127.0.0.1' } }, env('127.0.0.1'));
  assert.deepEqual(await viaProxy.json(), { ip: '203.0.113.7', peer: '127.0.0.1' });
  const cf = await app.request('/ip', { headers: { 'cf-connecting-ip': '192.0.2.1', 'x-forwarded-for': '6.6.6.6' } }, env('127.0.0.1'));
  assert.equal((await cf.json()).ip, '192.0.2.1');
  const bare = await app.request('/ip');
  assert.deepEqual(await bare.json(), { ip: 'local', peer: null });
});

test('serveSpa serves a deep link and assets', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'spa-hono-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>app</title>');
  writeFileSync(join(dir, 'assets', 'a.js'), 'export {}');
  const app = new Hono();
  app.get('/api/x', (c) => c.json({ x: 1 }));
  app.get('*', serveSpa({ dir, immutable: ['/assets/'] }));
  const deep = await app.request('/trips/42');
  assert.equal(deep.status, 200);
  assert.match(await deep.text(), /<title>app<\/title>/);
  const asset = await app.request('/assets/a.js');
  assert.match(asset.headers.get('cache-control'), /immutable/);
  assert.equal((await app.request('/missing.png')).status, 404);
  assert.deepEqual(await (await app.request('/api/x')).json(), { x: 1 });
});

test('onErrorHandler hides the message and passes HTTPException through', async () => {
  const lines = [];
  const app = new Hono();
  app.onError(onErrorHandler((l) => lines.push(l)));
  app.get('/boom', () => {
    throw new Error('secret db detail');
  });
  app.get('/teapot', () => {
    throw new HTTPException(418, { message: 'short and stout' });
  });
  const boom = await app.request('/boom');
  assert.equal(boom.status, 500);
  const text = await boom.text();
  assert.deepEqual(JSON.parse(text), { error: 'Something went wrong.' });
  assert.doesNotMatch(text, /secret/);
  assert.match(lines.join('\n'), /GET \/boom failed: /);
  const tea = await app.request('/teapot');
  assert.equal(tea.status, 418);
  assert.equal(await tea.text(), 'short and stout');
});

test('mountInboxAction: guard, body, token and run result', async () => {
  const PORT = 8805;
  const token = newActionToken();
  const stored = hashActionToken(token);
  const lines = [];
  const runs = [];
  const app = new Hono();
  mountInboxAction(app, {
    port: PORT,
    source: 'trackers',
    verify: (call) => typeof call.data.actionToken === 'string' && hashActionToken(call.data.actionToken) === stored,
    run: (call) => {
      runs.push(call);
      return { status: 202, body: { done: call.actionId } };
    },
    log: (l) => lines.push(l),
  });
  const call = (data) => ({ itemId: 7, actionId: 'approve', source: 'trackers', kind: 'x', dedupeKey: 'k1', data });
  const good = { host: `127.0.0.1:${PORT}`, 'x-inbox-action': '1' };
  const post = (body, headers = good, peer = '127.0.0.1') => app.request('/api/inbox/action', json(body, headers), env(peer));

  const proxied = await post(call({ actionToken: token }), { ...good, 'x-forwarded-for': '1.2.3.4' });
  assert.equal(proxied.status, 401);
  assert.deepEqual(await proxied.json(), { error: 'Log in to see this.' });
  assert.equal((await post(call({ actionToken: token }), good, '203.0.113.5')).status, 401);
  assert.equal((await post(call({ actionToken: token }), { host: good.host })).status, 401);

  const badBody = await post({ nope: true });
  assert.equal(badBody.status, 400);
  assert.deepEqual(await badBody.json(), { error: 'Not an inbox action from trackers.' });

  const badToken = await post(call({ actionToken: 'wrong' }));
  assert.equal(badToken.status, 401);
  assert.match(lines.join('\n'), /inbox action approve on k1: refused \(no current action token\)/);
  assert.equal(runs.length, 0);

  const ok = await post(call({ actionToken: token }));
  assert.equal(ok.status, 202);
  assert.deepEqual(await ok.json(), { done: 'approve' });
  assert.equal(runs.length, 1);
  assert.match(lines.join('\n'), /inbox action approve on k1: 202/);
});
