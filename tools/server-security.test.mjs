// Security tests for @nish/ui/server and @nish/ui/server/hono (dist/server/*.js). Run after `npm run build`:
// node --test tools/server-security.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { Hono } from 'hono';
import {
  clientIp, createLimiter, createSessionAuth, createSessionToken, createSpaHandler, errorResponse, passwordMatches, verifySessionToken,
} from '../dist/server/index.js';
import { clientIpOf, loginHandler, mountServiceTokenRoutes, mountSessionRoutes } from '../dist/server/hono.js';

const SECRET = 'a-session-secret-that-is-32-bytes!';
const env = (remoteAddress) => ({ incoming: { socket: { remoteAddress } } });
const post = (body, headers = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

function loginApp(extra = {}) {
  const auth = createSessionAuth({ cookieName: 'sec_session', secret: SECRET });
  const limiter = extra.limiter ?? createLimiter();
  const app = new Hono();
  mountSessionRoutes(app, { auth, password: 'Hunter2', secure: false, ...extra, limiter });
  return { app, limiter, auth };
}

// ---- Login limiter ---------------------------------------------------------------------------

test('login: 100 parallel bad logins give at most max 401s, the rest 429', async () => {
  for (const failDelayMs of [0, 5]) {
    const { app } = loginApp({ limiter: createLimiter({ max: 10 }), failDelayMs });
    const rs = await Promise.all(Array.from({ length: 100 }, () => app.request('/api/login', post({ password: 'nope' }), env('198.51.100.1'))));
    const codes = rs.map((r) => r.status);
    assert.equal(codes.filter((c) => c === 401).length, 10, `failDelayMs ${failDelayMs}`);
    assert.equal(codes.filter((c) => c === 429).length, 90);
  }
});

test('login: a parallel burst cannot be followed by a correct password inside the window', async () => {
  const { app } = loginApp({ limiter: createLimiter({ max: 3 }), failDelayMs: 5 });
  await Promise.all(Array.from({ length: 20 }, () => app.request('/api/login', post({ password: 'nope' }), env('198.51.100.2'))));
  const late = await app.request('/api/login', post({ password: 'Hunter2' }), env('198.51.100.2'));
  assert.equal(late.status, 429);
});

test('login: spoofed forwarding headers are ignored by default', async () => {
  const { app } = loginApp({ limiter: createLimiter({ max: 3 }) });
  const codes = [];
  for (let i = 0; i < 6; i++) {
    const r = await app.request(
      '/api/login',
      post({ password: 'nope' }, { 'x-forwarded-for': `10.0.0.${i}`, 'cf-connecting-ip': `192.0.2.${i}` }),
      env('198.51.100.3'),
    );
    codes.push(r.status);
  }
  assert.deepEqual(codes, [401, 401, 401, 429, 429, 429]);
});

test('login: trustProxy proxy keys on the rightmost hop, cloudflare on cf-connecting-ip', async () => {
  const proxied = loginApp({ limiter: createLimiter({ max: 1 }), trustProxy: 'proxy' });
  const hop = (ip) => post({ password: 'nope' }, { 'x-forwarded-for': `1.1.1.1, ${ip}` });
  assert.equal((await proxied.app.request('/api/login', hop('203.0.113.1'), env('127.0.0.1'))).status, 401);
  assert.equal((await proxied.app.request('/api/login', hop('203.0.113.1'), env('127.0.0.1'))).status, 429);
  assert.equal((await proxied.app.request('/api/login', hop('203.0.113.2'), env('127.0.0.1'))).status, 401);

  const cf = loginApp({ limiter: createLimiter({ max: 1 }), trustProxy: 'cloudflare' });
  const via = (ip) => post({ password: 'nope' }, { 'cf-connecting-ip': ip });
  assert.equal((await cf.app.request('/api/login', via('192.0.2.1'), env('127.0.0.1'))).status, 401);
  assert.equal((await cf.app.request('/api/login', via('192.0.2.1'), env('127.0.0.1'))).status, 429);
  assert.equal((await cf.app.request('/api/login', via('192.0.2.2'), env('127.0.0.1'))).status, 401);
});

test('login: requests with no address share one bucket instead of skipping the limiter', async () => {
  const { app } = loginApp({ limiter: createLimiter({ max: 2 }) });
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await app.request('/api/login', post({ password: 'nope' }))).status);
  assert.deepEqual(codes, [401, 401, 429, 429]);
});

test('login: a successful login resets the count for that address only', async () => {
  const limiter = createLimiter({ max: 3 });
  const { app } = loginApp({ limiter });
  await app.request('/api/login', post({ password: 'nope' }), env('198.51.100.4'));
  await app.request('/api/login', post({ password: 'nope' }), env('198.51.100.5'));
  assert.equal(limiter.size, 2);
  const ok = await app.request('/api/login', post({ password: 'Hunter2' }), env('198.51.100.4'));
  assert.equal(ok.status, 200);
  assert.equal(limiter.size, 1);
  for (let i = 0; i < 3; i++) assert.equal((await app.request('/api/login', post({ password: 'nope' }), env('198.51.100.4'))).status, 401);
  assert.equal((await app.request('/api/login', post({ password: 'nope' }), env('198.51.100.4'))).status, 429);
});

test('login: exact password by default, fold and trim only with caseInsensitive', async () => {
  const exact = loginApp();
  for (const pw of ['hunter2', ' Hunter2', 'Hunter2 ', 'HUNTER2']) {
    assert.equal((await exact.app.request('/api/login', post({ password: pw }), env('198.51.100.6'))).status, 401, JSON.stringify(pw));
  }
  assert.equal((await exact.app.request('/api/login', post({ password: 'Hunter2' }), env('198.51.100.6'))).status, 200);

  const loose = loginApp({ caseInsensitive: true });
  for (const pw of ['hunter2', '  HUNTER2 ', 'Hunter2']) {
    assert.equal((await loose.app.request('/api/login', post({ password: pw }), env('198.51.100.7'))).status, 200, JSON.stringify(pw));
  }
  assert.equal((await loose.app.request('/api/login', post({ password: 'hunter3' }), env('198.51.100.7'))).status, 401);
});

test('login: non-string and over-long passwords are refused, 1024 characters is the limit', async () => {
  const long = 'p'.repeat(1024);
  const { app } = loginApp({ password: long });
  for (const pw of [5, null, ['Hunter2'], { a: 1 }, true]) {
    assert.equal((await app.request('/api/login', post({ password: pw }), env('198.51.100.8'))).status, 401);
  }
  assert.equal((await app.request('/api/login', post({}), env('198.51.100.8'))).status, 401);
  assert.equal((await app.request('/api/login', post(null), env('198.51.100.8'))).status, 401);
  assert.equal((await app.request('/api/login', post({ password: long }), env('198.51.100.9'))).status, 200);
  const tooLong = loginApp({ password: long + 'x' });
  assert.equal((await tooLong.app.request('/api/login', post({ password: long + 'x' }), env('198.51.100.9'))).status, 401);
});

test('login: failDelayMs delays a wrong answer, password and secure may be functions', async () => {
  const { app } = loginApp({ failDelayMs: 400, password: () => 'Dyn1', secure: () => true });
  const t0 = Date.now();
  assert.equal((await app.request('/api/login', post({ password: 'x' }), env('198.51.100.10'))).status, 401);
  const failMs = Date.now() - t0;
  assert.ok(failMs >= 350, 'waited');
  const t1 = Date.now();
  const ok = await app.request('/api/login', post({ password: 'Dyn1' }), env('198.51.100.10'));
  assert.equal(ok.status, 200);
  assert.ok(Date.now() - t1 < 200, 'success is clearly faster than the failure delay');
  assert.match(ok.headers.get('set-cookie'), /; Secure$/);
});

test('login: the session cookie is appended, other cookies set earlier survive', async () => {
  const auth = createSessionAuth({ cookieName: 'sec_session', secret: SECRET });
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.header('Set-Cookie', 'other=1; Path=/', { append: true });
    await next();
  });
  app.post('/login', loginHandler({ auth, password: 'pw', limiter: createLimiter(), secure: false }));
  const res = await app.request('/login', post({ password: 'pw' }), env('198.51.100.11'));
  const cookies = res.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.equal(cookies[0], 'other=1; Path=/');
  assert.match(cookies[1], /^sec_session=v1\./);
});

test('clientIpOf: no socket address, or a malformed env, gives null', async () => {
  const app = new Hono();
  app.get('/ip', (c) => c.json({ ip: clientIpOf(c) }));
  for (const e of [{}, { incoming: {} }, { incoming: { socket: {} } }, { incoming: { socket: { remoteAddress: 5 } } }]) {
    assert.deepEqual(await (await app.request('/ip', {}, e)).json(), { ip: null });
  }
  assert.deepEqual(await (await app.request('/ip', {}, env('203.0.113.9'))).json(), { ip: '203.0.113.9' });
});

// ---- Limiter ---------------------------------------------------------------------------------

test('limiter.hit: counts the attempt and allows exactly max per window', () => {
  const l = createLimiter({ max: 3, windowMs: 1000 });
  assert.deepEqual([l.hit('a', 0), l.hit('a', 1), l.hit('a', 2), l.hit('a', 3), l.hit('a', 4)], [true, true, true, false, false]);
  assert.equal(l.allowed('a', 5), false);
  assert.equal(l.hit('b', 5), true);
  assert.equal(l.hit('a', 999), false);
  assert.equal(l.hit('a', 1000), true, 'window over at exactly reset');
  assert.equal(l.size, 2);
  l.reset('a');
  assert.equal(l.size, 1);
  assert.deepEqual([l.hit('a', 2000), l.hit('a', 2001), l.hit('a', 2002), l.hit('a', 2003)], [true, true, true, false]);
});

test('limiter.hit: defaults are 10 per minute', () => {
  const l = createLimiter();
  for (let i = 0; i < 10; i++) assert.equal(l.hit('k', 0), true);
  assert.equal(l.hit('k', 1), false);
  assert.equal(l.hit('k', 59_999), false);
  assert.equal(l.hit('k', 60_000), true);
});

test('limiter: expired entries are evicted before live ones', () => {
  const l = createLimiter({ max: 5, windowMs: 100, cap: 3 });
  l.hit('old1', 0);
  l.hit('live', 50);
  l.hit('old2', 60);
  assert.equal(l.size, 3);
  // old1 expired at 100; live (150) and old2 (160) have not. Only old1 goes.
  assert.equal(l.hit('new', 100), true);
  assert.equal(l.size, 3);
  for (let i = 0; i < 4; i++) l.hit('live', 101);
  assert.equal(l.allowed('live', 102), false, 'live kept its entry and its count (1 + 4 hits = max 5)');
  assert.equal(l.hit('old2', 102), true);
  assert.equal(l.size, 3);
});

test('limiter: a locked key is never evicted, a new key is refused when the limiter is full of locked keys', () => {
  const l = createLimiter({ max: 2, windowMs: 1000, cap: 2 });
  for (const k of ['a', 'b']) {
    assert.equal(l.hit(k, 0), true);
    assert.equal(l.hit(k, 1), true);
    assert.equal(l.hit(k, 2), false);
  }
  assert.equal(l.size, 2);
  assert.equal(l.hit('c', 3), false, 'full of locked keys');
  assert.equal(l.size, 2);
  assert.equal(l.allowed('a', 4), false);
  assert.equal(l.allowed('b', 4), false);
  l.fail('c', 4);
  assert.equal(l.size, 2, 'fail() does not evict a locked key either');
  assert.equal(l.allowed('c', 5), true);
  assert.equal(l.hit('c', 1000), true, 'once the locked keys expire there is room');
  assert.equal(l.size, 1);
});

test('limiter: the oldest unlocked live key is evicted before a locked one', () => {
  const l = createLimiter({ max: 2, windowMs: 1000, cap: 3 });
  l.hit('locked', 0);
  l.hit('locked', 0);
  l.hit('x', 1);
  l.hit('y', 2);
  assert.equal(l.hit('z', 3), true);
  assert.equal(l.size, 3);
  assert.equal(l.allowed('locked', 4), false, 'the locked key survived');
  l.fail('y', 4);
  assert.equal(l.allowed('y', 5), false, 'y was kept (and is now at 2)');
  assert.equal(l.allowed('x', 5), true, 'x, the oldest unlocked, was evicted');
});

test('limiter: reset boundary and an expired entry restarts', () => {
  const l = createLimiter({ max: 1, windowMs: 10, cap: 5 });
  l.fail('a', 0);
  assert.equal(l.allowed('a', 9), false);
  assert.equal(l.allowed('a', 10), true);
  l.fail('a', 10);
  assert.equal(l.size, 1);
  assert.equal(l.allowed('a', 19), false);
});

// ---- Session secret and cookies --------------------------------------------------------------

test('session secret: shorter than 32 bytes throws at setup with a clear message', () => {
  assert.throws(() => createSessionAuth({ cookieName: 'x', secret: 'short' }), /at least 32/);
  assert.throws(() => createSessionAuth({ cookieName: 'x', secret: 'a'.repeat(31) }), /31 bytes/);
  assert.doesNotThrow(() => createSessionAuth({ cookieName: 'x', secret: 'a'.repeat(32) }));
  // Bytes, not characters: 16 two-byte characters are 32 bytes, 15 are 30.
  assert.doesNotThrow(() => createSessionAuth({ cookieName: 'x', secret: 'é'.repeat(16) }));
  assert.throws(() => createSessionAuth({ cookieName: 'x', secret: 'é'.repeat(15) }), /30 bytes/);
  assert.throws(() => createSessionAuth({ cookieName: 'x', secret: '' }), /at least 32/);
  assert.throws(() => createSessionToken('a'.repeat(31)), /at least 32/);
  assert.throws(() => createSessionToken(''), /empty/);
  assert.match(createSessionToken('a'.repeat(32)), /^v1\./);
});

test('session secret: a function secret is checked when a token is issued', () => {
  let secret = 'short';
  const auth = createSessionAuth({ cookieName: 'x', secret: () => secret });
  assert.throws(() => auth.issue(), /at least 32/);
  secret = 'b'.repeat(40);
  assert.equal(auth.verify(auth.issue()), true);
});

test('session token: expires exactly at the expiry second', () => {
  const now = 1_800_000_000_000;
  const t = createSessionToken(SECRET, now, 1);
  const exp = Number(t.split('.')[1]) * 1000;
  assert.equal(verifySessionToken(SECRET, t, { now: exp - 1 }), true);
  assert.equal(verifySessionToken(SECRET, t, { now: exp }), false);
});

test('session token: odd shapes are refused', () => {
  const now = 1_800_000_000_000;
  assert.equal(verifySessionToken(SECRET, 5, { now }), false);
  assert.equal(verifySessionToken(SECRET, 'v1..aaaaaaaaaaaaaaaaaaaaaaaa.x', { now }), false);
  const t = createSessionToken(SECRET, now);
  const [v, exp, nonce, sig] = t.split('.');
  assert.equal(verifySessionToken(SECRET, [v, exp, nonce.toUpperCase(), sig].join('.'), { now }), false, 'nonce must be lowercase hex');
  assert.equal(verifySessionToken(SECRET, [v, exp, nonce + '0', sig].join('.'), { now }), false, 'nonce is exactly 24');
  assert.equal(verifySessionToken(SECRET, 'x' + t, { now }), false);
  assert.equal(verifySessionToken(SECRET, [v, exp, nonce, sig, 'extra'].join('.'), { now }), false);
  assert.equal(verifySessionToken(SECRET, [v, 'abc', nonce, sig].join('.'), { now }), false);
  assert.equal(verifySessionToken(SECRET, `v1.${Math.floor(now / 1000) + 100}.zz`, { now, legacyHex: true }), false, 'a legacy signature must be hex');
});

test('passwordMatches: exact by default, fold and trim only on request, non-strings never match', () => {
  assert.equal(passwordMatches('Abc', 'Abc'), true);
  assert.equal(passwordMatches('Abc', 'abc'), false);
  assert.equal(passwordMatches('Abc', ' Abc'), false);
  assert.equal(passwordMatches('Abc', 'abc', { caseInsensitive: true }), true);
  assert.equal(passwordMatches('abc', ' ABC ', { caseInsensitive: true }), true);
  assert.equal(passwordMatches(' ABC ', 'abc', { caseInsensitive: true }), true, 'the expected side is folded too');
  assert.equal(passwordMatches('Abc', 'abc', { caseInsensitive: false }), false);
  assert.equal(passwordMatches('Abc', 5), false);
  assert.equal(passwordMatches(5, 'Abc'), false);
  assert.equal(passwordMatches('', '', { caseInsensitive: true }), false);
});

// ---- clientIp --------------------------------------------------------------------------------

test('clientIp: the socket address is returned as is, cf-connecting-ip is capped at 64 characters', () => {
  const h = () => undefined;
  assert.equal(clientIp(h, '127.0.0.1x'), '127.0.0.1x');
  assert.equal(clientIp(h, '::1'), '::1');
  const cf = (v) => (n) => (n === 'cf-connecting-ip' ? v : undefined);
  assert.equal(clientIp(cf('x'.repeat(64)), '5.5.5.5', { trust: 'cloudflare' }), 'x'.repeat(64));
  assert.equal(clientIp(cf('x'.repeat(65)), '5.5.5.5', { trust: 'cloudflare' }), '5.5.5.5');
});

// ---- SPA headers -----------------------------------------------------------------------------

test('spa: nosniff, referrer policy and frame options on every answer', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sec-spa-'));
  try {
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html>');
    writeFileSync(join(dir, 'assets', 'a.js'), 'export {}');
    const spa = createSpaHandler({ dir, immutable: ['/assets/'] });
    const want = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'SAMEORIGIN' };
    for (const [path, init] of [['/', {}], ['/deep/link', {}], ['/assets/a.js', {}], ['/assets/a.js', { method: 'HEAD' }], ['/missing.png', {}], ['/.env', {}], ['/x', { method: 'POST' }]]) {
      const r = await spa(new Request(`http://x${path}`, init));
      for (const [k, v] of Object.entries(want)) assert.equal(r.headers.get(k), v, `${init.method ?? 'GET'} ${path} ${k}`);
    }
    const open = createSpaHandler({ dir, frameOptions: false });
    for (const path of ['/', '/assets/a.js', '/missing.png']) {
      const r = await open(new Request(`http://x${path}`));
      assert.equal(r.headers.get('x-frame-options'), null, path);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(r.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    }
    const unbuilt = createSpaHandler({ dir: join(dir, 'nope') });
    const r = await unbuilt(new Request('http://x/'));
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('spa: a file without an extension, text/plain, a directory request, the extension rule', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sec-spa2-'));
  try {
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'index.html'), 'INDEX');
    writeFileSync(join(dir, 'LICENSE'), 'text');
    writeFileSync(join(dir, 'robots.txt'), 'ok');
    const spa = createSpaHandler({ dir });
    assert.equal((await spa(new Request('http://x/LICENSE'))).headers.get('content-type'), 'application/octet-stream');
    assert.equal((await spa(new Request('http://x/robots.txt'))).headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(await (await spa(new Request('http://x/sub'))).text(), 'INDEX', 'a directory falls through to the app');
    assert.equal(await (await spa(new Request('http://x/sub/'))).text(), 'INDEX');
    assert.equal((await spa(new Request('http://x/a.b/c'))).status, 200, 'dots in a directory name are not an extension');
    assert.equal((await spa(new Request('http://x/page.abcdefghi'))).status, 200, 'a long suffix is not an extension');
    assert.equal((await spa(new Request('http://x/missing.js'))).status, 404);
    assert.equal(await (await spa(new Request('http://x/%2e%2e/etc/passwd'))).text(), 'INDEX', 'the URL parser resolves the dots; nothing outside dir is read');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Service token routes --------------------------------------------------------------------

test('mountServiceTokenRoutes: list, revoke, unknown id, custom base, log line', async () => {
  const revoked = [];
  const tokens = {
    views: () => [{ id: 'one', revoked: revoked.includes('one') }],
    revoke: (id) => (id === 'one' ? (revoked.push(id), true) : false),
  };
  const lines = [];
  const app = new Hono();
  mountServiceTokenRoutes(app, { tokens, log: (l) => lines.push(l) });
  const list = await app.request('/api/service-tokens');
  assert.equal(list.status, 200);
  assert.equal(list.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await list.json(), { tokens: [{ id: 'one', revoked: false }] });
  const bad = await app.request('/api/service-tokens/nope/revoke', { method: 'POST' });
  assert.equal(bad.status, 404);
  assert.equal(bad.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await bad.json(), { error: 'No service token with that id.' });
  assert.deepEqual(lines, []);
  const ok = await app.request('/api/service-tokens/one/revoke', { method: 'POST' });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await ok.json(), { tokens: [{ id: 'one', revoked: true }] });
  assert.deepEqual(lines, ['service token one revoked']);

  const custom = new Hono();
  mountServiceTokenRoutes(custom, { tokens, base: '/tok///', log: () => {} });
  assert.equal((await custom.request('/tok')).status, 200);
  assert.equal((await custom.request('/tok/one/revoke', { method: 'POST' })).status, 200);
  assert.equal((await custom.request('/api/service-tokens')).status, 404);
});

// ---- process.ts lifecycle (child processes: it installs real process handlers) ---------------

const INDEX_URL = pathToFileURL(join(import.meta.dirname, '..', 'dist', 'server', 'index.js')).href;
const IMPORT = `import { installProcessHandlers } from ${JSON.stringify(INDEX_URL)};`;

/** Runs `body` in a fresh node process with `installProcessHandlers`, `out` and `done()` in scope; returns the JSON `done()` printed. */
function inChild(body) {
  const script = `${IMPORT}
    const out = { lines: [], exits: [], calls: [] };
    const done = () => { process.stdout.write(JSON.stringify(out)); };
    ${body}`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', timeout: 20_000 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('process: SIGTERM and SIGINT run shutdown once: close, closeAllConnections, onShutdown awaited, then exit(0)', () => {
  for (const signal of ['SIGTERM', 'SIGINT']) {
    const out = inChild(`
      const server = { close: () => out.calls.push('close'), closeAllConnections: () => out.calls.push('closeAll') };
      installProcessHandlers({
        name: 'app', log: (l) => out.lines.push(l), server, graceMs: 5000,
        onShutdown: async () => { await new Promise((r) => setTimeout(r, 30)); out.calls.push('hook'); },
        exit: (c) => { out.exits.push([c, out.calls.slice()]); done(); process.exit(0); },
      });
      process.emit('${signal}', '${signal}');
      process.emit('${signal}', '${signal}');
    `);
    assert.deepEqual(out.lines, [`got ${signal}, shutting down`], signal);
    assert.deepEqual(out.exits, [[0, ['close', 'closeAll', 'hook']]], 'exit after the hook finished, only once');
  }
});

test('process: the grace timer is cleared on a clean shutdown, fires when the hook hangs, and is unref\'d', () => {
  const clean = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), graceMs: 100, exit: (c) => out.exits.push(c) });
    process.emit('SIGTERM', 'SIGTERM');
    setTimeout(done, 300);
  `);
  assert.deepEqual(clean.exits, [0], 'no second exit from the grace timer');
  assert.deepEqual(clean.lines, ['got SIGTERM, shutting down']);

  const forced = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), graceMs: 30, onShutdown: () => new Promise(() => {}), exit: (c) => { out.exits.push(c); done(); process.exit(0); } });
    process.emit('SIGTERM', 'SIGTERM');
    setTimeout(() => {}, 5000);
  `);
  assert.deepEqual(forced.lines, ['got SIGTERM, shutting down', 'forced exit after 30 ms']);
  assert.deepEqual(forced.exits, [0]);

  // Nothing else keeps this process alive; an unref'd 60 s timer must not hold it.
  const t0 = Date.now();
  const r = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `${IMPORT}
      installProcessHandlers({ name: 'a', log: () => {}, graceMs: 60000, onShutdown: () => new Promise(() => {}), exit: () => {} }).shutdown('SIGTERM');`],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(r.status, 0);
  assert.ok(Date.now() - t0 < 15_000, 'the process ended without waiting for the grace timer');
});

test('process: close and hook errors are logged and shutdown still exits 0', () => {
  const out = inChild(`
    installProcessHandlers({
      name: 'app', log: (l) => out.lines.push(l),
      server: { close: () => { throw new Error('close boom'); } },
      onShutdown: () => { throw new Error('hook boom'); },
      exit: (c) => { out.exits.push(c); done(); process.exit(0); },
    });
    process.emit('SIGINT', 'SIGINT');
  `);
  assert.deepEqual(out.lines, ['got SIGINT, shutting down', 'shutdown hook failed: close boom', 'shutdown hook failed: hook boom']);
  assert.deepEqual(out.exits, [0]);

  const bare = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), exit: (c) => { out.exits.push(c); done(); process.exit(0); } });
    process.emit('SIGTERM', 'SIGTERM');
  `);
  assert.deepEqual(bare.exits, [0]);

  const nonError = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), onShutdown: () => Promise.reject('plain string'), exit: (c) => { out.exits.push(c); done(); process.exit(0); } });
    process.emit('SIGTERM', 'SIGTERM');
  `);
  assert.deepEqual(nonError.lines, ['got SIGTERM, shutting down', 'shutdown hook failed: plain string']);
});

test('process: uncaughtException logs the stack and exits 1; unhandledRejection logs and keeps running', () => {
  const crash = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), exit: (c) => { out.exits.push(c); done(); process.exit(0); } });
    setTimeout(() => { throw new Error('boom'); }, 5);
  `);
  assert.equal(crash.lines.length, 1);
  assert.match(crash.lines[0], /^uncaught exception: Error: boom\n\s+at /);
  assert.deepEqual(crash.exits, [1]);

  const rej = inChild(`
    installProcessHandlers({ name: 'app', log: (l) => out.lines.push(l), exit: (c) => out.exits.push(c) });
    Promise.reject(new Error('nope'));
    Promise.reject('just text');
    setTimeout(done, 100);
  `);
  assert.equal(rej.lines.length, 2);
  assert.match(rej.lines[0], /^unhandled rejection: Error: nope\n\s+at /);
  assert.equal(rej.lines[1], 'unhandled rejection: just text');
  assert.deepEqual(rej.exits, [], 'still running');
});

test('process: default log line format and default exit', () => {
  const r = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `${IMPORT}
      installProcessHandlers({ name: 'myapp' }).shutdown('SIGTERM');
      setTimeout(() => {}, 20000);`],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(r.status, 0, 'the default exit is process.exit(0)');
  assert.match(r.stderr, /^\[\d{4}-\d\d-\d\dT[\d:.]+Z\] myapp: got SIGTERM, shutting down\r?\n$/);
  const crash = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `${IMPORT}
      installProcessHandlers({ name: 'myapp', log: () => {} });
      setTimeout(() => { throw new Error('x'); }, 5);
      setTimeout(() => {}, 20000);`],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(crash.status, 1, 'the default exit code for an uncaught exception is 1');
});

test('errorResponse: logs method, path and stack, answers a generic body', () => {
  const lines = [];
  const r = errorResponse(new Error('db password is hunter2'), { method: 'POST', path: '/api/x' }, (l) => lines.push(l));
  assert.deepEqual(r, { status: 500, body: { error: 'Something went wrong.' } });
  assert.match(lines[0], /^POST \/api\/x failed: Error: db password is hunter2\n/);
  assert.equal(errorResponse('plain', { method: 'GET', path: '/' }, (l) => lines.push(l)).status, 500);
  assert.equal(lines[1], 'GET / failed: plain');
});
