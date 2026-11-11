// Tests for the loginHandler failBudget option (dist/server/hono.js). Run after `npm run build`:
// node --test tools/server-login-budget.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Hono } from 'hono';
import { createLimiter, createSessionAuth } from '../dist/server/index.js';
import { mountSessionRoutes } from '../dist/server/hono.js';

const SECRET = 'a-session-secret-that-is-32-bytes!';
const env = (remoteAddress) => ({ incoming: { socket: { remoteAddress } } });
const post = (password) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });

function loginApp(extra = {}) {
  const auth = createSessionAuth({ cookieName: 'bud_session', secret: SECRET });
  const app = new Hono();
  mountSessionRoutes(app, { auth, password: 'Hunter2', secure: false, limiter: createLimiter({ max: 1000 }), ...extra });
  return app;
}

async function timed(app, password, ip) {
  const t = performance.now();
  const r = await app.request('/api/login', post(password), env(ip));
  return { status: r.status, ms: performance.now() - t };
}

test('failBudget: failures past max across different clients wait, still 401, and a right password is not delayed', async () => {
  const app = loginApp({ failBudget: { max: 2, windowMs: 60_000, delayMs: 300 } });
  const a = await timed(app, 'nope', '198.51.100.1');
  const b = await timed(app, 'nope', '198.51.100.2');
  const c = await timed(app, 'nope', '198.51.100.3');
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.ok(a.ms < 150 && b.ms < 150, `first two fast (${a.ms}, ${b.ms})`);
  assert.equal(c.status, 401);
  assert.ok(c.ms >= 250, `third waits (${c.ms})`);
  const ok = await timed(app, 'Hunter2', '198.51.100.4');
  assert.equal(ok.status, 200);
  assert.ok(ok.ms < 150, `right password fast (${ok.ms})`);
});

test('failBudget: off by default, the third wrong login is fast', async () => {
  const app = loginApp();
  const rs = [];
  for (const ip of ['198.51.100.1', '198.51.100.2', '198.51.100.3']) rs.push(await timed(app, 'nope', ip));
  assert.ok(rs.every((r) => r.status === 401 && r.ms < 150), JSON.stringify(rs));
});
