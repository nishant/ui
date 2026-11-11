import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginHandler } from './hono';
import { parseInboxActionCall } from './inbox/action';
import { createInboxClient } from './inbox/client';
import { createLimiter } from './limiter';
import { jsonRevocationStore } from './service-tokens';
import { createSessionAuth } from './session';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('loginHandler body cap (UI-284)', () => {
  const app = new Hono();
  const auth = createSessionAuth({ cookieName: 's', secret: 'a-session-secret-that-is-32-bytes!' });
  app.post('/login', loginHandler({ auth, password: 'pw', limiter: createLimiter({ max: 100 }), secure: false }));
  const post = (body: string, headers: Record<string, string> = {}) =>
    app.request('/login', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body }, { incoming: { socket: { remoteAddress: '198.51.100.7' } } });

  it('answers 413 for a body over 16 KB', async () => {
    expect((await post(JSON.stringify({ password: 'x'.repeat(20_000) }))).status).toBe(413);
  });
  it('still logs in with a small body', async () => {
    expect((await post('{"password":"pw"}')).status).toBe(200);
    expect((await post('{"password":"no"}')).status).toBe(401);
  });
});

describe('parseInboxActionCall data (UI-285)', () => {
  const call = { itemId: 1, actionId: 'ok', source: 'app', kind: 'k', dedupeKey: null };
  it('accepts data: null as an empty object and still refuses non-objects', () => {
    expect(parseInboxActionCall({ ...call, data: null }, 'app')?.data).toEqual({});
    expect(parseInboxActionCall({ ...call, data: { a: 1 } }, 'app')?.data).toEqual({ a: 1 });
    expect(parseInboxActionCall({ ...call, data: [] }, 'app')).toBeNull();
    expect(parseInboxActionCall({ ...call, data: 'x' }, 'app')).toBeNull();
  });
});

describe('jsonRevocationStore load twice (UI-369)', () => {
  it('writes each invalid record back once', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const file = join(mkdtempSync(join(tmpdir(), 'rev-')), 'r.json');
    writeFileSync(file, JSON.stringify({ version: 1, revoked: [{ nonsense: true }] }));
    const store = jsonRevocationStore(file);
    store.load();
    store.save(store.load());
    expect(JSON.parse(readFileSync(file, 'utf8')).revoked).toEqual([{ nonsense: true }]);
  });
});

describe('inbox client rejected queued event (UI-286)', () => {
  it('logs a queued event the inbox rejects with a 4xx', async () => {
    vi.useFakeTimers();
    const log = vi.fn();
    let calls = 0;
    const fetchStub = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('down');
      return new Response(JSON.stringify({ error: 'bad title' }), { status: 400 });
    });
    const client = createInboxClient({ source: 'app', url: 'http://127.0.0.1:1', fetch: fetchStub as unknown as typeof fetch, log });
    const r = await client.send({ kind: 'k', title: 'hello' });
    expect(r).toMatchObject({ ok: false, queued: true });
    await client.flush();
    expect(client.pending).toBe(0);
    expect(log).toHaveBeenCalledWith('queued event dropped: bad title');
  });
});
