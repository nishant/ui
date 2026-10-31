// Service tokens: scoped bearer tokens for machine clients (the local nish MCP server), stored
// only as sha256 hashes. Entries come from a committed JSON file at the app root and/or the
// SERVICE_TOKENS env var (a JSON array of the same entries). Revoke a token by deleting its entry.
//
// Phase 1 is direct-loopback only: Caddy proxies every public host to the same 127.0.0.1 port and
// keeps the public Host, so a v1 request must name a loopback Host and carry no proxy headers.
// "Arrived on loopback" alone proves nothing, so the token is still required.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface ServiceTokenEntry {
  id: string;
  name: string;
  scopes: string[];
  /** sha256 (hex) of the raw token. */
  sha256: string;
  created: string;
}

export type VerifyResult = { ok: true; entry: ServiceTokenEntry } | { ok: false; status: 401 | 403 };

export interface ServiceTokens {
  verify(authorization: string | undefined, scope: string): VerifyResult;
  /** The entries without their hashes, for a settings page or a `whoami`. */
  list(): Array<Omit<ServiceTokenEntry, 'sha256'>>;
}

const TOKEN_RE = /^nish_[a-z][a-z0-9-]*_[A-Za-z0-9_-]{43}$/;
const HEX_RE = /^[0-9a-f]{64}$/;

export const hashServiceToken = (token: string): string => createHash('sha256').update(token, 'utf8').digest('hex');

/** A new raw token for `app` (lowercase letters, digits, dashes). Store only its hash in the app. */
export function mintServiceToken(app: string): { token: string; sha256: string } {
  if (!/^[a-z][a-z0-9-]*$/.test(app)) throw new Error(`bad app name: ${app}`);
  const token = `nish_${app}_${randomBytes(32).toString('base64url')}`;
  return { token, sha256: hashServiceToken(token) };
}

function parseEntries(raw: unknown, where: string): ServiceTokenEntry[] {
  if (!Array.isArray(raw)) {
    console.warn(`[service-tokens] ${where}: expected a JSON array, ignored`);
    return [];
  }
  const out: ServiceTokenEntry[] = [];
  for (const e of raw as Array<Record<string, unknown>>) {
    const ok =
      e && typeof e === 'object' &&
      typeof e.id === 'string' && e.id.length > 0 &&
      typeof e.name === 'string' &&
      Array.isArray(e.scopes) && e.scopes.every((s) => typeof s === 'string') &&
      typeof e.sha256 === 'string' && HEX_RE.test(e.sha256) &&
      typeof e.created === 'string';
    if (!ok) {
      console.warn(`[service-tokens] ${where}: skipped an invalid entry${e && typeof e.id === 'string' ? ` (${e.id})` : ''}`);
      continue;
    }
    out.push({ id: e.id as string, name: e.name as string, scopes: [...(e.scopes as string[])], sha256: e.sha256 as string, created: e.created as string });
  }
  return out;
}

/**
 * Loads entries from `file` (missing file = no entries) and from `env` (the SERVICE_TOKENS value).
 * Read once at startup; a deploy restarts the app, which is when the file changes.
 */
export function loadServiceTokens(o: { file?: string; env?: string } = {}): ServiceTokens {
  const entries: ServiceTokenEntry[] = [];
  if (o.file) {
    let text: string | null = null;
    try {
      text = readFileSync(o.file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`[service-tokens] ${o.file}: ${(err as Error).message}`);
    }
    if (text !== null) {
      try {
        entries.push(...parseEntries(JSON.parse(text), o.file));
      } catch {
        console.warn(`[service-tokens] ${o.file}: not valid JSON, ignored`);
      }
    }
  }
  if (o.env && o.env.trim()) {
    try {
      entries.push(...parseEntries(JSON.parse(o.env), 'SERVICE_TOKENS'));
    } catch {
      console.warn('[service-tokens] SERVICE_TOKENS: not valid JSON, ignored');
    }
  }
  return createServiceTokens(entries);
}

export function createServiceTokens(entries: ServiceTokenEntry[]): ServiceTokens {
  const byHash = new Map<string, ServiceTokenEntry>();
  for (const e of entries) byHash.set(e.sha256, e);
  return {
    verify(authorization, scope) {
      const m = /^Bearer ([^\s]+)$/.exec(authorization ?? '');
      if (!m || !TOKEN_RE.test(m[1])) return { ok: false, status: 401 };
      const hash = hashServiceToken(m[1]);
      const entry = byHash.get(hash);
      if (!entry || !timingSafeEqual(Buffer.from(entry.sha256, 'hex'), Buffer.from(hash, 'hex'))) return { ok: false, status: 401 };
      if (!entry.scopes.includes(scope)) return { ok: false, status: 403 };
      return { ok: true, entry };
    },
    list: () => entries.map(({ sha256: _h, ...rest }) => rest),
  };
}

const PROXY_HEADERS = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'forwarded', 'cf-connecting-ip', 'cf-ray', 'x-real-ip'];

/**
 * True only for a request made straight to the app on loopback: Host is 127.0.0.1, localhost or
 * [::1] with the app's port, there are no proxy headers and no Origin (browsers never get in).
 */
export function isDirectLoopback(get: (name: string) => string | undefined, port: number): boolean {
  const host = (get('host') ?? '').toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}` && host !== `[::1]:${port}`) return false;
  if (get('origin') !== undefined) return false;
  return PROXY_HEADERS.every((h) => get(h) === undefined);
}

/** Framework-free check: the status and body a guard should answer with, or null to continue. */
export function checkServiceRequest(
  get: (name: string) => string | undefined,
  o: { tokens: ServiceTokens; scope: string; port: number },
): { status: 401 | 403; error: string } | null {
  if (!isDirectLoopback(get, o.port)) return { status: 403, error: 'Forbidden' };
  const r = o.tokens.verify(get('authorization'), o.scope);
  if (!r.ok) return { status: r.status, error: r.status === 401 ? 'Unauthorized' : 'Forbidden' };
  return null;
}
