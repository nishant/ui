import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { loginHandler } from './hono';
import { createLimiter } from './limiter';
import { createSessionAuth } from './session';

const env = (remoteAddress: string) => ({ incoming: { socket: { remoteAddress } } });

function status(max: number) {
  const app = new Hono();
  const auth = createSessionAuth({ cookieName: 's', secret: 'a-session-secret-that-is-32-bytes!' });
  app.post('/login', loginHandler({ auth, password: 'pw', limiter: createLimiter({ max }), secure: false }));
  return async (addr: string) =>
    (await app.request('/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"password":"x"}' }, env(addr))).status;
}

describe('loginHandler limiter key', () => {
  it('shares one bucket across an IPv6 /64', async () => {
    const hit = status(2);
    expect(await hit('2001:db8:1:2::1')).toBe(401);
    expect(await hit('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe(401);
    expect(await hit('2001:db8:1:2::9')).toBe(429);
    expect(await hit('2001:db8:1:3::1')).toBe(401);
  });

  it('keeps IPv4 separate and maps ::ffff:a.b.c.d to the IPv4', async () => {
    const hit = status(1);
    expect(await hit('198.51.100.1')).toBe(401);
    expect(await hit('::ffff:198.51.100.1')).toBe(429);
    expect(await hit('198.51.100.2')).toBe(401);
  });
});
