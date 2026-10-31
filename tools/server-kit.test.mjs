// Tests for @nish/ui/server (dist/server/index.js). Run after `npm run build`:
// node --test tools/server-kit.test.mjs
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import * as kit from '../dist/server/index.js';

const {
  createSessionToken, verifySessionToken, passwordMatches, readCookie, createSessionAuth, clientIp, isLoopback, createLimiter,
  loadAppEnv, envNumber, installProcessHandlers, errorResponse, createSpaHandler, isInboxCall, parseInboxActionCall,
  newActionToken, hashActionToken, actionTokenMatches, inboxAction, inboxActionTarget, INBOX_ACTION_PATH,
} = kit;

const SECRET = 'test-secret';
const NOW = 1_800_000_000_000;

test('tokens: round trip, format, expiry, tamper, wrong secret', () => {
  const t = createSessionToken(SECRET, NOW);
  assert.match(t, /^v1\.\d+\.[0-9a-f]{24}\.[A-Za-z0-9_-]+$/);
  assert.equal(t.split('.')[1], String(Math.floor(NOW / 1000) + 30 * 86400));
  assert.equal(verifySessionToken(SECRET, t, { now: NOW }), true);
  assert.equal(verifySessionToken(SECRET, t, { now: NOW + 29 * 86400_000 }), true);
  assert.equal(verifySessionToken(SECRET, t, { now: NOW + 31 * 86400_000 }), false);
  assert.equal(verifySessionToken('other', t, { now: NOW }), false);
  const parts = t.split('.');
  parts[1] = String(Number(parts[1]) + 1000);
  assert.equal(verifySessionToken(SECRET, parts.join('.'), { now: NOW }), false);
  const sigTampered = t.slice(0, -2) + (t.endsWith('AA') ? 'BB' : 'AA');
  assert.equal(verifySessionToken(SECRET, sigTampered, { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, t + 'x', { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, t.split('.').slice(0, 3).join('.'), { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, 'v3.1.2.3', { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, `v1.NaN.${'a'.repeat(24)}.x`, { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, null), false);
  assert.equal(verifySessionToken(SECRET, undefined), false);
  assert.equal(verifySessionToken(SECRET, ''), false);
});

test('tokens: a cookie built the way the live v1 apps build it verifies', () => {
  const exp = Math.floor(NOW / 1000) + 1000;
  const body = `v1.${exp}.${'0123456789abcdef01234567'}`;
  const tok = `${body}.${createHmac('sha256', SECRET).update(body).digest('base64url')}`;
  assert.equal(verifySessionToken(SECRET, tok, { now: NOW }), true);
  assert.equal(createSessionAuth({ cookieName: 'status_session', secret: SECRET }).isAuthed(`status_session=${tok}`, NOW), true);
});

test('tokens: days option and empty secret', () => {
  const t = createSessionToken(SECRET, NOW, 1);
  assert.equal(t.split('.')[1], String(Math.floor(NOW / 1000) + 86400));
  assert.throws(() => createSessionToken('', NOW));
  assert.equal(verifySessionToken('', createSessionToken(SECRET, NOW), { now: NOW }), false);
  assert.equal(verifySessionToken('', 'v1.9999999999.aaaaaaaaaaaaaaaaaaaaaaaa.x'), false);
});

test('tokens: legacy hex v1 and v2 only with legacyHex', () => {
  const exp = Math.floor(NOW / 1000) + 1000;
  const hex = (s) => createHmac('sha256', SECRET).update(s).digest('hex');
  const v1 = `v1.${exp}.${hex(`v1.${exp}`)}`;
  const nonce = 'abcdef0123456789abcdef01';
  const v2 = `v2.${exp}.${nonce}.${hex(`v2.${exp}.${nonce}`)}`;
  assert.equal(verifySessionToken(SECRET, v1, { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, v2, { now: NOW }), false);
  assert.equal(verifySessionToken(SECRET, v1, { now: NOW, legacyHex: true }), true);
  assert.equal(verifySessionToken(SECRET, v2, { now: NOW, legacyHex: true }), true);
  assert.equal(verifySessionToken(SECRET, v1, { now: NOW + 2_000_000, legacyHex: true }), false);
  assert.equal(verifySessionToken('nope', v2, { now: NOW, legacyHex: true }), false);
  assert.equal(verifySessionToken(SECRET, v2.slice(0, -1) + (v2.endsWith('0') ? '1' : '0'), { now: NOW, legacyHex: true }), false);
  assert.equal(verifySessionToken(SECRET, v1 + '00', { now: NOW, legacyHex: true }), false);
  // New v1 tokens still verify with the flag.
  assert.equal(verifySessionToken(SECRET, createSessionToken(SECRET, NOW), { now: NOW, legacyHex: true }), true);
});

test('passwordMatches', () => {
  assert.equal(passwordMatches('Secret', 'secret'), true);
  assert.equal(passwordMatches('Secret', '  SECRET  '), true);
  assert.equal(passwordMatches('secret', 'secre'), false);
  assert.equal(passwordMatches('Secret', 'secret', { caseInsensitive: false }), false);
  assert.equal(passwordMatches('Secret', 'Secret', { caseInsensitive: false }), true);
  assert.equal(passwordMatches('Secret', ' Secret', { caseInsensitive: false }), false);
  assert.equal(passwordMatches('', ''), false);
  assert.equal(passwordMatches('', 'x'), false);
});

test('readCookie, setCookie and clearCookie', () => {
  assert.equal(readCookie('a=1; b=two; a=3', 'a'), '1');
  assert.equal(readCookie('a=1;  b = two ', 'b'), 'two');
  assert.equal(readCookie('a=%E0%A4%A', 'a'), '%E0%A4%A');
  assert.equal(readCookie('a=x%20y', 'a'), 'x y');
  assert.equal(readCookie('a=1', 'b'), undefined);
  assert.equal(readCookie(undefined, 'a'), undefined);
  assert.equal(readCookie(null, 'a'), undefined);

  const auth = createSessionAuth({ cookieName: 'status_session', secret: SECRET });
  assert.equal(auth.cookieName, 'status_session');
  assert.equal(auth.days, 30);
  const set = auth.setCookie(true, NOW);
  assert.match(set, /^status_session=v1\.\d+\.[0-9a-f]{24}\.[A-Za-z0-9_-]+; Max-Age=2592000; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
  assert.ok(!auth.setCookie(false, NOW).includes('Secure'));
  assert.equal(auth.clearCookie(), 'status_session=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
  const token = set.split(';')[0].split('=')[1];
  assert.equal(auth.isAuthed(`x=1; status_session=${token}`, NOW), true);
  assert.equal(auth.isAuthed('x=1', NOW), false);
  assert.equal(auth.isAuthed(undefined, NOW), false);
  assert.equal(auth.verify(token, NOW), true);
  assert.throws(() => createSessionAuth({ cookieName: 'bad name', secret: SECRET }));
  assert.throws(() => createSessionAuth({ cookieName: 'a;b', secret: SECRET }));
});

test('createSessionAuth: function secret is read on every call', () => {
  let secret = 's1';
  const auth = createSessionAuth({ cookieName: 'x', secret: () => secret, days: 1 });
  const t = auth.issue(NOW);
  assert.equal(auth.verify(t, NOW), true);
  secret = 's2';
  assert.equal(auth.verify(t, NOW), false);
  secret = '';
  assert.equal(auth.verify(t, NOW), false);
  assert.throws(() => auth.issue(NOW));
  assert.match(auth.clearCookie(), /^x=;/);
});

test('createSessionAuth: legacyHex', () => {
  const exp = Math.floor(NOW / 1000) + 1000;
  const sig = createHmac('sha256', SECRET).update(`v1.${exp}`).digest('hex');
  const legacy = `v1.${exp}.${sig}`;
  assert.equal(createSessionAuth({ cookieName: 'ja_session', secret: SECRET }).verify(legacy, NOW), false);
  assert.equal(createSessionAuth({ cookieName: 'ja_session', secret: SECRET, legacyHex: true }).verify(legacy, NOW), true);
});

test('clientIp', () => {
  const h = (o) => (name) => o[name];
  assert.equal(clientIp(h({ 'cf-connecting-ip': ' 1.2.3.4 ', 'x-forwarded-for': '9.9.9.9' }), '5.5.5.5'), '1.2.3.4');
  assert.equal(clientIp(h({ 'cf-connecting-ip': 'a,b', 'x-forwarded-for': '9.9.9.9' })), '9.9.9.9');
  assert.equal(clientIp(h({ 'cf-connecting-ip': 'x'.repeat(65), 'x-forwarded-for': '9.9.9.9' })), '9.9.9.9');
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 127.0.0.1' })), '7.7.7.7');
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, ::1, ::ffff:127.0.0.1, ' })), '7.7.7.7');
  assert.equal(clientIp(h({ 'x-forwarded-for': '127.0.0.1, ::1' }), '8.8.8.8'), '8.8.8.8');
  assert.equal(clientIp(h({ 'x-forwarded-for': '127.0.0.1' }), '127.0.0.1'), 'local');
  assert.equal(clientIp(h({}), '::ffff:127.0.0.1'), 'local');
  assert.equal(clientIp(h({}), null), 'local');
  assert.equal(clientIp(h({})), 'local');
  assert.equal(clientIp(h({}), '100.64.0.5'), '100.64.0.5');
});

test('isLoopback', () => {
  for (const a of ['127.0.0.1', '127.9.9.9', '::1', '::ffff:127.0.0.1']) assert.equal(isLoopback(a), true, a);
  for (const a of ['128.0.0.1', '10.0.0.1', '', null, undefined, '::2']) assert.equal(isLoopback(a), false, String(a));
});

test('limiter: max, window expiry, reset, size', () => {
  const l = createLimiter({ max: 3, windowMs: 1000 });
  assert.equal(l.allowed('a', 0), true);
  l.fail('a', 0);
  l.fail('a', 10);
  assert.equal(l.allowed('a', 20), true);
  l.fail('a', 20);
  assert.equal(l.allowed('a', 30), false);
  assert.equal(l.allowed('b', 30), true);
  assert.equal(l.allowed('a', 999), false);
  assert.equal(l.allowed('a', 1000), true);
  l.fail('a', 1000);
  assert.equal(l.allowed('a', 1001), true);
  assert.equal(l.size, 1);
  l.fail('a', 1001);
  l.fail('a', 1002);
  assert.equal(l.allowed('a', 1003), false);
  l.reset('a');
  assert.equal(l.allowed('a', 1003), true);
  assert.equal(l.size, 0);
  l.reset('missing');
});

test('limiter: defaults are 10 failures per minute', () => {
  const l = createLimiter();
  for (let i = 0; i < 9; i++) l.fail('k', 0);
  assert.equal(l.allowed('k', 1), true);
  l.fail('k', 0);
  assert.equal(l.allowed('k', 1), false);
  assert.equal(l.allowed('k', 60_000), true);
});

test('limiter: the cap evicts the oldest entries, not everything', () => {
  const l = createLimiter({ max: 2, windowMs: 100_000, cap: 3 });
  l.fail('a', 0);
  l.fail('b', 1);
  l.fail('c', 2);
  assert.equal(l.size, 3);
  l.fail('d', 3);
  assert.equal(l.size, 3);
  l.fail('d', 4);
  assert.equal(l.allowed('d', 5), false);
  l.fail('e', 5);
  assert.equal(l.size, 3);
  // a and b are gone (oldest); c, d, e remain.
  l.fail('c', 6);
  assert.equal(l.allowed('c', 7), false);
  assert.equal(l.allowed('a', 7), true);
});

test('limiter: the cap drops expired entries first', () => {
  const l = createLimiter({ max: 2, windowMs: 10, cap: 3 });
  l.fail('old1', 0);
  l.fail('old2', 0);
  l.fail('keep', 100);
  l.fail('new', 100);
  // old1 and old2 expired at 10; only keep and new remain after the cleanup.
  assert.equal(l.size, 2);
});

test('limiter: a restarted entry counts as the newest', () => {
  const l = createLimiter({ max: 1, windowMs: 10, cap: 2 });
  l.fail('a', 0);
  l.fail('b', 1);
  l.fail('a', 50); // restarts, moves behind b
  l.fail('c', 51); // over cap: expired b goes first
  assert.equal(l.allowed('a', 52), false);
  assert.equal(l.allowed('c', 52), false);
});

test('loadAppEnv and envNumber', () => {
  const root = mkdtempSync(join(tmpdir(), 'kit-env-'));
  try {
    writeFileSync(join(root, '.env'), 'KIT_A=from-file\nKIT_B=also-file\nKIT_EMPTY=\n');
    writeFileSync(join(root, 'other.env'), 'KIT_C=other\n');
    process.env.KIT_A = 'from-env';
    delete process.env.KIT_B;
    delete process.env.KIT_C;
    assert.equal(loadAppEnv({ root }), join(root, '.env'));
    assert.equal(process.env.KIT_A, 'from-env');
    assert.equal(process.env.KIT_B, 'also-file');
    assert.equal(loadAppEnv({ root, file: 'other.env' }), join(root, 'other.env'));
    assert.equal(process.env.KIT_C, 'other');
    assert.throws(() => loadAppEnv({ root, required: ['KIT_A', 'KIT_EMPTY', 'KIT_NOPE'] }), {
      message: 'KIT_EMPTY and KIT_NOPE must be set - see .env.example',
    });
    assert.throws(() => loadAppEnv({ root, required: ['KIT_NOPE'] }), { message: 'KIT_NOPE must be set - see .env.example' });
    assert.equal(loadAppEnv({ root, required: ['KIT_A'] }), join(root, '.env'));
    // A missing file is fine unless a key is required.
    const empty = mkdtempSync(join(tmpdir(), 'kit-env-empty-'));
    try {
      assert.equal(loadAppEnv({ root: empty }), null);
      assert.throws(() => loadAppEnv({ root: empty, required: ['KIT_NOPE'] }), /KIT_NOPE must be set/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
    for (const k of ['KIT_A', 'KIT_B', 'KIT_C', 'KIT_EMPTY']) delete process.env[k];
  }
});

test('appRoot', () => {
  const p = process.platform === 'win32' ? 'file:///C:/app/dist/server/env.js' : 'file:///app/dist/server/env.js';
  assert.match(kit.appRoot(p).replace(/\\/g, '/'), /\/app$/);
  assert.match(kit.appRoot(p, 1).replace(/\\/g, '/'), /\/app\/dist$/);
});

test('envNumber', () => {
  assert.equal(envNumber('42', 1), 42);
  assert.equal(envNumber('1.5', 1), 1.5);
  assert.equal(envNumber(undefined, 7), 7);
  assert.equal(envNumber('', 7), 7);
  assert.equal(envNumber('abc', 7), 7);
  assert.equal(envNumber('0', 7), 7);
  assert.equal(envNumber('-3', 7), 7);
  assert.equal(envNumber('Infinity', 7), 7);
});

test('installProcessHandlers: shutdown, grace timer, second install', async () => {
  const before = { rej: process.listenerCount('unhandledRejection'), exc: process.listenerCount('uncaughtException') };
  const lines = [];
  const exits = [];
  const calls = [];
  const server = { close: () => calls.push('close'), closeAllConnections: () => calls.push('closeAll') };
  const handle = installProcessHandlers({
    name: 'test',
    log: (l) => lines.push(l),
    server,
    onShutdown: async () => {
      calls.push('hook');
    },
    exit: (c) => exits.push(c),
    graceMs: 50,
  });
  assert.equal(process.listenerCount('unhandledRejection'), before.rej + 1);
  assert.equal(process.listenerCount('uncaughtException'), before.exc + 1);
  assert.equal(process.listeners('SIGBREAK').some((f) => String(f).includes('shutdown')), false);
  assert.equal(installProcessHandlers({ name: 'again', exit: () => assert.fail('second install must not act') }), handle);
  assert.equal(process.listenerCount('unhandledRejection'), before.rej + 1);

  await handle.shutdown('SIGTERM');
  assert.deepEqual(calls, ['close', 'closeAll', 'hook']);
  assert.deepEqual(exits, [0]);
  assert.deepEqual(lines, ['got SIGTERM, shutting down']);
  await handle.shutdown('SIGINT');
  assert.deepEqual(exits, [0]);
  assert.equal(lines.length, 1);

  for (const type of ['SIGINT', 'SIGTERM']) assert.ok(process.listenerCount(type) >= 1);
});

test('installProcessHandlers: graceMs forces the exit and hook errors are logged', async () => {
  // Fresh module instance, so the once-per-process state is new.
  const fresh = await import(`../dist/server/index.js?fresh=${Date.now()}`);
  const lines = [];
  const exits = [];
  const handle = fresh.installProcessHandlers({
    name: 'slow',
    log: (l) => lines.push(l),
    onShutdown: () => new Promise(() => {}),
    exit: (c) => exits.push(c),
    graceMs: 30,
  });
  void handle.shutdown('SIGTERM');
  await new Promise((r) => setTimeout(r, 120));
  assert.deepEqual(exits, [0]);
  assert.ok(lines.includes('forced exit after 30 ms'), lines.join('|'));

  const fresh2 = await import(`../dist/server/index.js?fresh2=${Date.now()}`);
  const lines2 = [];
  const exits2 = [];
  const h2 = fresh2.installProcessHandlers({
    name: 'bad-hook',
    log: (l) => lines2.push(l),
    onShutdown: () => {
      throw new Error('boom');
    },
    exit: (c) => exits2.push(c),
  });
  await h2.shutdown('SIGINT');
  assert.deepEqual(lines2, ['got SIGINT, shutting down', 'shutdown hook failed: boom']);
  assert.deepEqual(exits2, [0]);
});

test('errorResponse hides the message', () => {
  const lines = [];
  const r = errorResponse(new Error('secret detail'), { method: 'GET', path: '/api/x' }, (l) => lines.push(l));
  assert.deepEqual(r, { status: 500, body: { error: 'Something went wrong.' } });
  assert.ok(!JSON.stringify(r).includes('secret detail'));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^GET \/api\/x failed: Error: secret detail/);
  const r2 = errorResponse('plain', { method: 'POST', path: '/p' }, (l) => lines.push(l));
  assert.equal(r2.body.error, 'Something went wrong.');
  assert.equal(lines[1], 'POST /p failed: plain');
});

test('SPA handler', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kit-spa-'));
  try {
    const dir = join(root, 'public');
    mkdirSync(join(dir, 'assets'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>app</title>');
    writeFileSync(join(dir, 'assets', 'a.js'), 'console.log(1)');
    writeFileSync(join(dir, '.env'), 'SECRET=1');
    writeFileSync(join(dir, 'x.png'), 'png');
    writeFileSync(join(root, 'outside.txt'), 'outside');
    const spa = createSpaHandler({ dir, immutable: ['/assets/'] });
    const get = (path, init) => spa(new Request(`http://127.0.0.1:8803${path}`, init));

    let r = await get('/assets/a.js');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(r.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.equal(await r.text(), 'console.log(1)');

    r = await get('/x.png');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'image/png');
    assert.equal(r.headers.get('cache-control'), 'public, max-age=3600');

    r = await get('/');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-cache');
    assert.equal(r.headers.get('content-type'), 'text/html; charset=utf-8');

    r = await get('/index.html');
    assert.equal(r.headers.get('cache-control'), 'no-cache');

    r = await get('/some/deep/link');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-cache');
    assert.match(await r.text(), /<title>app<\/title>/);

    r = await get('/missing.png');
    assert.equal(r.status, 404);
    assert.equal(await r.text(), 'Not found.');
    assert.equal((await get('/assets/missing.js')).status, 404);

    assert.equal((await get('/.env')).status, 404);
    assert.equal((await get('/ENV~1')).status, 404);
    assert.equal((await get('/index.html:$DATA')).status, 404);
    assert.equal((await get('/assets/../.env')).status, 404);
    assert.equal((await get('/%2e/.env')).status, 404);
    assert.equal((await get('/.git/config')).status, 404);
    assert.equal((await get('/%2e%2e/outside.txt')).status, 404);
    // The URL parser folds '/%2e%2e/' into '/', so a bare traversal lands on the index and cannot leave dir.
    assert.equal((await get('/%2e%2e/%2e%2e/outside.txt')).status, 404);
    assert.equal((await get('/..%2foutside.txt')).status, 404);
    assert.equal((await get('/..%5coutside.txt')).status, 404);
    assert.equal((await get('/a%00b')).status, 404);
    assert.equal((await get('/a%5Cb')).status, 404);

    r = await get('/%E0%A4%A');
    assert.equal(r.status, 400);
    assert.equal(await r.text(), 'Bad request.');

    r = await get('/', { method: 'POST' });
    assert.equal(r.status, 404);
    assert.equal(await r.text(), 'Not found.');

    r = await get('/assets/a.js', { method: 'HEAD' });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(await r.text(), '');

    const none = createSpaHandler({ dir: join(root, 'nope') });
    r = await none(new Request('http://127.0.0.1/deep'));
    assert.equal(r.status, 503);
    assert.equal(await r.text(), 'UI not built: run npm run build');
    const custom = createSpaHandler({ dir: join(root, 'nope'), notBuilt: 'Build me.' });
    assert.equal(await (await custom(new Request('http://127.0.0.1/'))).text(), 'Build me.');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('SPA handler: .well-known is allowed, content types, directory requests', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kit-spa2-'));
  try {
    mkdirSync(join(root, '.well-known'), { recursive: true });
    mkdirSync(join(root, 'sub'), { recursive: true });
    writeFileSync(join(root, 'index.html'), 'idx');
    writeFileSync(join(root, '.well-known', 'security.txt'), 'hi');
    writeFileSync(join(root, 'm.webmanifest'), '{}');
    writeFileSync(join(root, 'f.woff2'), 'f');
    writeFileSync(join(root, 'blob.bin'), 'b');
    const spa = createSpaHandler({ dir: root, maxAge: 60 });
    const get = (p) => spa(new Request(`http://x${p}`));
    let r = await get('/.well-known/security.txt');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal((await get('/m.webmanifest')).headers.get('content-type'), 'application/manifest+json');
    assert.equal((await get('/f.woff2')).headers.get('content-type'), 'font/woff2');
    r = await get('/blob.bin');
    assert.equal(r.headers.get('content-type'), 'application/octet-stream');
    assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
    // A folder is not a file and has no extension, so it falls back to the index.
    r = await get('/sub');
    assert.equal(await r.text(), 'idx');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const goodHeaders = { host: '127.0.0.1:8805', 'x-inbox-action': '1', 'content-type': 'application/json' };
const call = (headers, over = {}) => isInboxCall({ headers, remoteAddress: '127.0.0.1', port: 8805, ...over });

test('isInboxCall: plain object headers', () => {
  assert.equal(call(goodHeaders), true);
  assert.equal(call({ ...goodHeaders, Host: undefined, HOST: '127.0.0.1:8805' }), true);
  assert.equal(call(goodHeaders, { remoteAddress: '::1' }), true);
  assert.equal(call(goodHeaders, { remoteAddress: '::ffff:127.0.0.1' }), true);
  for (const bad of ['10.0.0.5', '127.0.0.2', '', null, undefined]) assert.equal(call(goodHeaders, { remoteAddress: bad }), false, String(bad));
  assert.equal(call({ ...goodHeaders, host: '127.0.0.1:9999' }), false);
  assert.equal(call({ ...goodHeaders, host: 'localhost:8805' }), false);
  assert.equal(call({ ...goodHeaders, host: undefined }), false);
  const { 'x-inbox-action': _drop, ...noAction } = goodHeaders;
  assert.equal(call(noAction), false);
  assert.equal(call({ ...goodHeaders, 'x-inbox-action': '0' }), false);
  assert.equal(call({ ...goodHeaders, 'x-inbox-action': 'true' }), false);
  for (const name of [
    'forwarded', 'via', 'x-real-ip', 'true-client-ip', 'origin', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto',
    'sec-fetch-site', 'sec-fetch-mode', 'cf-connecting-ip', 'cf-ray', 'CF-Visitor', 'X-Forwarded-For',
  ]) {
    assert.equal(call({ ...goodHeaders, [name]: 'x' }), false, name);
  }
  // An undefined header value is the same as absent.
  assert.equal(call({ ...goodHeaders, origin: undefined }), true);
  // Array values from Node are fine.
  assert.equal(call({ ...goodHeaders, 'x-inbox-action': ['1'] }), true);
});

test('isInboxCall: Headers object', () => {
  const mk = (extra = {}) => new Headers({ ...goodHeaders, ...extra });
  assert.equal(call(mk()), true);
  assert.equal(call(mk({ 'X-Forwarded-For': '1.2.3.4' })), false);
  assert.equal(call(mk({ Origin: 'https://evil.example' })), false);
  assert.equal(call(mk({ 'Sec-Fetch-Mode': 'cors' })), false);
  assert.equal(call(mk({ 'CF-Connecting-IP': '1.2.3.4' })), false);
  assert.equal(call(mk({ Via: '1.1 proxy' })), false);
  assert.equal(call(mk({ host: '127.0.0.1:1' })), false);
  const h = mk();
  h.delete('x-inbox-action');
  assert.equal(call(h), false);
  assert.equal(call(mk(), { remoteAddress: '192.168.1.5' }), false);
});

test('parseInboxActionCall', () => {
  const ok = { itemId: 5, actionId: 'retry', source: 'status', kind: 'down', dedupeKey: 'k', data: { a: 1 } };
  assert.deepEqual(parseInboxActionCall(ok, 'status'), ok);
  assert.deepEqual(parseInboxActionCall({ ...ok, dedupeKey: null }, 'status'), { ...ok, dedupeKey: null });
  assert.deepEqual(parseInboxActionCall({ ...ok, extra: 'dropped' }, 'status'), ok);
  assert.equal(parseInboxActionCall(ok, 'trackers'), null);
  for (const bad of [null, undefined, 'x', 5, [], [ok]]) assert.equal(parseInboxActionCall(bad, 'status'), null);
  for (const itemId of [0, -1, 1.5, '5', null, NaN, Number.MAX_SAFE_INTEGER + 2]) {
    assert.equal(parseInboxActionCall({ ...ok, itemId }, 'status'), null, String(itemId));
  }
  for (const actionId of ['', 'Retry', '-x', 'a'.repeat(33), 'a b', 5, null]) {
    assert.equal(parseInboxActionCall({ ...ok, actionId }, 'status'), null, String(actionId));
  }
  assert.ok(parseInboxActionCall({ ...ok, actionId: 'a'.repeat(32) }, 'status'));
  assert.equal(parseInboxActionCall({ ...ok, kind: 5 }, 'status'), null);
  assert.equal(parseInboxActionCall({ ...ok, dedupeKey: 5 }, 'status'), null);
  const { dedupeKey: _d, ...noKey } = ok;
  assert.equal(parseInboxActionCall(noKey, 'status'), null);
  for (const data of [null, undefined, [], 'x', 3]) assert.equal(parseInboxActionCall({ ...ok, data }, 'status'), null);
  assert.deepEqual(parseInboxActionCall({ ...ok, data: {} }, 'status').data, {});
});

test('action tokens', () => {
  const t = newActionToken();
  assert.match(t, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(newActionToken(), t);
  const h = hashActionToken(t);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashActionToken(t));
  assert.equal(actionTokenMatches(t, h), true);
  assert.equal(actionTokenMatches(t + 'x', h), false);
  assert.equal(actionTokenMatches(newActionToken(), h), false);
  assert.equal(actionTokenMatches(t, 'abc'), false);
  assert.equal(actionTokenMatches(t, h.toUpperCase()), false);
  assert.equal(actionTokenMatches(t, null), false);
  assert.equal(actionTokenMatches(t, undefined), false);
  assert.equal(actionTokenMatches('', h), false);
  assert.equal(actionTokenMatches('a'.repeat(129), hashActionToken('a'.repeat(129))), false);
  assert.equal(actionTokenMatches('a'.repeat(128), hashActionToken('a'.repeat(128))), true);
  assert.equal(actionTokenMatches(123, h), false);
  assert.equal(actionTokenMatches(null, h), false);
  assert.equal(actionTokenMatches({ toString: () => t }, h), false);
});

test('inboxAction and the target helpers', () => {
  assert.equal(INBOX_ACTION_PATH, '/api/inbox/action');
  assert.equal(inboxActionTarget(8803), 'http://127.0.0.1:8803/api/inbox/action');
  assert.equal(inboxActionTarget(8803, '/x'), 'http://127.0.0.1:8803/x');
  assert.deepEqual(inboxAction('retry', 'Retry', inboxActionTarget(8803)), {
    id: 'retry', label: 'Retry', method: 'POST', target: 'http://127.0.0.1:8803/api/inbox/action',
  });
  for (const bad of ['http://example.com/x', 'http://127.0.0.1/x', 'https://127.0.0.1:1/x', 'nope']) {
    assert.throws(() => inboxAction('a', 'A', bad), { message: `not an inbox action target: ${bad}` });
  }
});

test('the core entry re-exports the inbox client and types', () => {
  assert.equal(typeof kit.createInboxClient, 'function');
  assert.equal(typeof kit.parseInboxEvent, 'function');
  assert.equal(typeof kit.isInboxActionTarget, 'function');
  assert.equal(kit.INBOX_ACTION_HEADER, 'X-Inbox-Action');
});
