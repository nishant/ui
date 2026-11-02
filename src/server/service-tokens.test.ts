import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountServiceTokenRoutes } from './hono';
import {
  checkServiceRequest,
  jsonRevocationStore,
  loadManagedServiceTokens,
  loadServiceTokens,
  mintServiceToken,
  type ServiceTokenEntry,
} from './service-tokens';

const dir = () => mkdtempSync(join(tmpdir(), 'svc-tokens-'));
const mcp = mintServiceToken('mcp');
const handle = mintServiceToken('mcp');
const envTok = mintServiceToken('env');
const entry = (id: string, name: string, m: { sha256: string }, scopes = ['read']): ServiceTokenEntry => ({
  id,
  name,
  scopes,
  sha256: m.sha256,
  created: '2026-11-01',
});
const seedFile = (d: string, entries: ServiceTokenEntry[]) => {
  const f = join(d, 'service-tokens.json');
  writeFileSync(f, JSON.stringify(entries));
  return f;
};
const bearer = (t: string) => `Bearer ${t}`;

afterEach(() => vi.restoreAllMocks());

describe('loadManagedServiceTokens', () => {
  it('revoke makes verify and checkServiceRequest answer 401', () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({ file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]), revocations: join(d, 'r.json') });
    expect(tokens.verify(bearer(mcp.token), 'read').ok).toBe(true);
    expect(tokens.revoke('mcp')).toBe(true);
    expect(tokens.verify(bearer(mcp.token), 'read')).toEqual({ ok: false, status: 401 });
    const headers: Record<string, string> = { host: '127.0.0.1:3000', authorization: bearer(mcp.token) };
    expect(checkServiceRequest((n) => headers[n], { tokens, scope: 'read', port: 3000 })).toEqual({ status: 401, error: 'Unauthorized' });
  });

  it('persists across a reload from the same file', () => {
    const d = dir();
    const file = seedFile(d, [entry('mcp', 'nish MCP', mcp)]);
    const rev = join(d, 'sub', 'r.json');
    loadManagedServiceTokens({ file, revocations: rev, now: () => new Date('2026-11-02T10:00:00Z') }).revoke('mcp');
    const again = loadManagedServiceTokens({ file, revocations: rev });
    expect(again.verify(bearer(mcp.token), 'read')).toEqual({ ok: false, status: 401 });
    expect(again.views()[0]).toMatchObject({ revoked: true, revokedAt: '2026-11-02T10:00:00.000Z' });
    expect(JSON.parse(readFileSync(rev, 'utf8')).version).toBe(1);
  });

  it('keeps a re-minted token under the same id active', () => {
    const d = dir();
    const rev = join(d, 'r.json');
    loadManagedServiceTokens({ file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]), revocations: rev }).revoke('mcp');
    const file2 = seedFile(d, [entry('mcp', 'nish MCP', handle)]);
    const again = loadManagedServiceTokens({ file: file2, revocations: rev });
    expect(again.verify(bearer(handle.token), 'read').ok).toBe(true);
    expect(again.views()[0].revoked).toBe(false);
  });

  it('returns false for an unknown id and does not write', () => {
    const d = dir();
    const rev = join(d, 'r.json');
    const tokens = loadManagedServiceTokens({ file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]), revocations: rev });
    expect(tokens.revoke('nope')).toBe(false);
    expect(() => readFileSync(rev, 'utf8')).toThrow();
  });

  it('is idempotent and keeps the first at', () => {
    const d = dir();
    let t = new Date('2026-11-02T10:00:00Z');
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]),
      revocations: join(d, 'r.json'),
      now: () => t,
    });
    tokens.revoke('mcp');
    t = new Date('2026-11-03T10:00:00Z');
    expect(tokens.revoke('mcp')).toBe(true);
    expect(tokens.views()[0].revokedAt).toBe('2026-11-02T10:00:00.000Z');
  });

  it('revokes every entry with the same id', () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'a', mcp), entry('mcp', 'b', handle)]),
      revocations: join(d, 'r.json'),
    });
    tokens.revoke('mcp');
    expect(tokens.views().every((v) => v.revoked)).toBe(true);
  });

  it('survives a missing or invalid revocation file', () => {
    const d = dir();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = seedFile(d, [entry('mcp', 'nish MCP', mcp)]);
    expect(loadManagedServiceTokens({ file, revocations: join(d, 'missing.json') }).verify(bearer(mcp.token), 'read').ok).toBe(true);
    for (const body of ['not json', '{"version":1}', '[]']) {
      const bad = join(d, 'bad.json');
      writeFileSync(bad, body);
      expect(loadManagedServiceTokens({ file, revocations: bad }).verify(bearer(mcp.token), 'read').ok).toBe(true);
    }
    expect(warn).toHaveBeenCalled();
  });

  it('answers 401, not 403, for a revoked token asking for a scope it never had', () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({ file: seedFile(d, [entry('mcp', 'nish MCP', mcp, ['read'])]), revocations: join(d, 'r.json') });
    tokens.revoke('mcp');
    expect(tokens.verify(bearer(mcp.token), 'inbox:handle')).toEqual({ ok: false, status: 401 });
  });

  it('a failed save leaves the token active, and a retry saves again', () => {
    const d = dir();
    let fail = true;
    const save = vi.fn(() => {
      if (fail) throw new Error('disk full');
    });
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]),
      revocations: { load: () => [], save },
    });
    expect(() => tokens.revoke('mcp')).toThrow('disk full');
    expect(tokens.verify(bearer(mcp.token), 'read').ok).toBe(true);
    expect(tokens.views()[0].revoked).toBe(false);
    fail = false;
    expect(tokens.revoke('mcp')).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(tokens.views()[0].revoked).toBe(true);
  });

  it('throws on an unreadable revocation file instead of starting without revocations', () => {
    const d = dir();
    // A directory where the file should be: readFileSync fails with EISDIR, not ENOENT.
    expect(() => jsonRevocationStore(d).load()).toThrow();
  });

  it('sets an invalid file aside and keeps unreadable records on save', () => {
    const d = dir();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = join(d, 'bad.json');
    writeFileSync(bad, 'nope');
    jsonRevocationStore(bad).load();
    expect(readdirSync(d).some((f) => f.startsWith('bad.json.bad-'))).toBe(true);
    const odd = join(d, 'odd.json');
    writeFileSync(odd, JSON.stringify({ version: 1, revoked: [{ nonsense: true }] }));
    const store = jsonRevocationStore(odd);
    expect(store.load()).toEqual([]);
    store.save([{ sha256: 'a'.repeat(64), id: 'x', at: 't' }]);
    expect(JSON.parse(readFileSync(odd, 'utf8')).revoked).toHaveLength(2);
  });

  it('throws and leaves the invalid file in place when it cannot be set aside', () => {
    const d = dir();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = join(d, 'bad.json');
    writeFileSync(bad, 'nope');
    // A non-empty directory at the set-aside name makes the rename fail.
    vi.spyOn(Date, 'now').mockReturnValue(123);
    mkdirSync(join(d, 'bad.json.bad-123'));
    writeFileSync(join(d, 'bad.json.bad-123', 'x'), 'x');
    expect(() => jsonRevocationStore(bad).load()).toThrow();
    expect(readFileSync(bad, 'utf8')).toBe('nope');
  });

  it('warns once per store', () => {
    const d = dir();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = join(d, 'bad.json');
    writeFileSync(bad, 'nope');
    const store = jsonRevocationStore(bad);
    store.load();
    store.load();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('marks sources file and env, file first', () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]),
      env: JSON.stringify([entry('env', 'Env one', envTok)]),
      revocations: join(d, 'r.json'),
    });
    expect(tokens.views().map((v) => [v.id, v.source])).toEqual([
      ['mcp', 'file'],
      ['env', 'env'],
    ]);
    expect(tokens.views()[0]).not.toHaveProperty('sha256');
    expect(tokens.list()).toHaveLength(2);
  });

  it('accepts a RevocationStore object', () => {
    const d = dir();
    const saved: unknown[] = [];
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]),
      revocations: { load: () => [], save: (l) => saved.push(l) },
    });
    tokens.revoke('mcp');
    expect(saved).toHaveLength(1);
  });
});

describe('loadServiceTokens', () => {
  it('is unchanged: merges file then env, no revocation', () => {
    const d = dir();
    const t = loadServiceTokens({ file: seedFile(d, [entry('mcp', 'nish MCP', mcp)]), env: JSON.stringify([entry('env', 'E', envTok)]) });
    expect(t.list().map((e) => e.id)).toEqual(['mcp', 'env']);
    expect(t.verify(bearer(envTok.token), 'read').ok).toBe(true);
    expect(loadServiceTokens().list()).toEqual([]);
  });
});

describe('mountServiceTokenRoutes', () => {
  const setup = () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({
      file: seedFile(d, [entry('mcp', 'nish MCP', mcp), entry('mcp handle', 'Handle', handle, ['read', 'inbox:handle'])]),
      revocations: join(d, 'r.json'),
    });
    const log = vi.fn();
    const app = new Hono();
    mountServiceTokenRoutes(app, { tokens, log });
    return { app, tokens, log };
  };

  it('GET lists views with no-store', async () => {
    const { app } = setup();
    const res = await app.request('/api/service-tokens');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { tokens: Array<{ id: string; revoked: boolean }> };
    expect(body.tokens.map((t) => t.id)).toEqual(['mcp', 'mcp handle']);
    expect(JSON.stringify(body)).not.toContain(mcp.sha256);
  });

  it('POST revoke returns the new list, logs, and revokes', async () => {
    const { app, tokens, log } = setup();
    const res = await app.request('/api/service-tokens/mcp/revoke', { method: 'POST' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: Array<{ id: string; revoked: boolean }> };
    expect(body.tokens.find((t) => t.id === 'mcp')?.revoked).toBe(true);
    expect(log).toHaveBeenCalledWith('service token mcp revoked');
    expect(tokens.verify(bearer(mcp.token), 'read').ok).toBe(false);
  });

  it('decodes the id', async () => {
    const { app } = setup();
    const res = await app.request(`/api/service-tokens/${encodeURIComponent('mcp handle')}/revoke`, { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('POST unknown id is 404', async () => {
    const { app, log } = setup();
    const res = await app.request('/api/service-tokens/nope/revoke', { method: 'POST' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No service token with that id.' });
    expect(log).not.toHaveBeenCalled();
  });

  it('honors a custom base', async () => {
    const d = dir();
    const tokens = loadManagedServiceTokens({ file: seedFile(d, [entry('mcp', 'n', mcp)]), revocations: join(d, 'r.json') });
    const app = new Hono();
    mountServiceTokenRoutes(app, { tokens, base: '/x/tokens/' });
    expect((await app.request('/x/tokens')).status).toBe(200);
  });
});
