// Service tokens: scoped bearer tokens for machine clients (the local nish MCP server), stored
// only as sha256 hashes. Entries come from a committed JSON file at the app root and/or the
// SERVICE_TOKENS env var (a JSON array of the same entries). Revoke a token by deleting its entry,
// or at once with loadManagedServiceTokens, whose revocations live in the app's own state.
//
// Phase 1 is direct-loopback only: Caddy proxies every public host to the same 127.0.0.1 port and
// keeps the public Host, so a v1 request must name a loopback Host and carry no proxy headers.
// "Arrived on loopback" alone proves nothing, so the token is still required.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ServiceTokenView } from '../service-token-types';

export type { ServiceTokenView } from '../service-token-types';

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

interface SeedEntry {
  entry: ServiceTokenEntry;
  source: 'file' | 'env';
}

/** Reads `file` (missing file = no entries) and `env`, file first, recording each entry's source. */
function readSeed(o: { file?: string; env?: string }): SeedEntry[] {
  const out: SeedEntry[] = [];
  if (o.file) {
    let text: string | null = null;
    try {
      text = readFileSync(o.file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`[service-tokens] ${o.file}: ${(err as Error).message}`);
    }
    if (text !== null) {
      try {
        for (const entry of parseEntries(JSON.parse(text), o.file)) out.push({ entry, source: 'file' });
      } catch {
        console.warn(`[service-tokens] ${o.file}: not valid JSON, ignored`);
      }
    }
  }
  if (o.env && o.env.trim()) {
    try {
      for (const entry of parseEntries(JSON.parse(o.env), 'SERVICE_TOKENS')) out.push({ entry, source: 'env' });
    } catch {
      console.warn('[service-tokens] SERVICE_TOKENS: not valid JSON, ignored');
    }
  }
  return out;
}

/**
 * Loads entries from `file` (missing file = no entries) and from `env` (the SERVICE_TOKENS value).
 * Read once at startup; a deploy restarts the app, which is when the file changes.
 */
export function loadServiceTokens(o: { file?: string; env?: string } = {}): ServiceTokens {
  return createServiceTokens(readSeed(o).map((s) => s.entry));
}

export interface RevokedToken {
  sha256: string;
  id: string;
  at: string;
}
export interface RevocationStore {
  load(): RevokedToken[];
  save(list: RevokedToken[]): void;
}

/** JSON file store: missing file = []; any other read error throws (fail closed); invalid JSON or
 *  shape = warn once, file renamed to `<file>.bad-<timestamp>`, and every 64-hex hash found in it stays
 *  revoked (a corrupt, unparseable file with none to find, or a failed rename, throws and the file stays);
 *  invalid records without a readable hash are kept and written back unchanged on save.
 *  save writes `<file>.tmp` then renames, creating the directory. File shape:
 *  { "version": 1, "revoked": RevokedToken[] }. */
export function jsonRevocationStore(file: string): RevocationStore {
  let warned = false;
  // Records that failed validation are written back unchanged on the next save, never dropped.
  const kept: unknown[] = [];
  const warn = (why: string) => {
    if (warned) return;
    warned = true;
    console.warn(`[service-tokens] ${file}: ${why}, ignored`);
  };
  return {
    load() {
      let text: string;
      try {
        text = readFileSync(file, 'utf8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
        // Fail closed: starting without the revocations would bring revoked tokens back to life.
        throw err;
      }
      // Fail closed here too: an unreadable file may hold revocations, and starting without them would
      // bring revoked tokens back to life. Every 64-hex hash we can still find stays revoked; a corrupt
      // file with none to find stops startup (left in place) until a person fixes it.
      const salvage = (source: string): RevokedToken[] =>
        [...new Set((source.match(/[0-9a-fA-F]{64}/g) ?? []).map((h) => h.toLowerCase()))].map((sha256) => ({
          sha256,
          id: 'unknown',
          at: '',
        }));
      // Set the unreadable file aside so the next save cannot destroy its old records.
      const setAside = (why: string, failIfNoHash = false): RevokedToken[] => {
        const found = salvage(text);
        // Only a corrupt (unparseable) file may hide revocations; valid JSON with no hashes holds none.
        if (failIfNoHash && found.length === 0 && text.trim() !== '') {
          throw new Error(`[service-tokens] ${file}: ${why} and no revoked token hash could be read; fix or remove the file`);
        }
        warn(why);
        // Not best effort: if the rename fails (EBUSY, EPERM, EACCES) let it throw so startup fails
        // closed, rather than a later save overwriting the invalid file and destroying its records.
        renameSync(file, `${file}.bad-${Date.now()}`);
        return found;
      };
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        return setAside('not valid JSON', true);
      }
      const list = (raw as { revoked?: unknown } | null)?.revoked;
      if (!raw || typeof raw !== 'object' || !Array.isArray(list)) return setAside('unexpected shape');
      const out: RevokedToken[] = [];
      for (const r of list as Array<Record<string, unknown>>) {
        if (r && typeof r === 'object' && typeof r.sha256 === 'string' && HEX_RE.test(r.sha256) && typeof r.id === 'string' && typeof r.at === 'string') {
          out.push({ sha256: r.sha256, id: r.id, at: r.at });
        } else {
          warn('unexpected shape');
          // A record with a readable hash is still enforced (and written back normalised).
          const hash = r && typeof r === 'object' && typeof r.sha256 === 'string' ? salvage(r.sha256)[0] : undefined;
          if (hash) {
            out.push({ sha256: hash.sha256, id: typeof r.id === 'string' ? r.id : 'unknown', at: typeof r.at === 'string' ? r.at : '' });
          } else {
            kept.push(r);
          }
        }
      }
      return out;
    },
    save(list) {
      mkdirSync(dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, `${JSON.stringify({ version: 1, revoked: [...list, ...kept] }, null, 2)}\n`, 'utf8');
      renameSync(tmp, file);
    },
  };
}

export interface ManagedServiceTokens extends ServiceTokens {
  /** Every entry (file first, then env) with its revoked state. */
  views(): ServiceTokenView[];
  /** Revokes every current entry with this id. Returns false when no entry has it.
   *  Idempotent: an already revoked entry keeps its first `at`. */
  revoke(id: string): boolean;
}

export function loadManagedServiceTokens(o: {
  file?: string;
  env?: string;
  revocations: RevocationStore | string; // a string is a path for jsonRevocationStore
  now?: () => Date;
}): ManagedServiceTokens {
  const seed = readSeed(o);
  const store = typeof o.revocations === 'string' ? jsonRevocationStore(o.revocations) : o.revocations;
  const now = o.now ?? (() => new Date());
  const revoked = new Map<string, RevokedToken>();
  for (const r of store.load()) if (!revoked.has(r.sha256)) revoked.set(r.sha256, r);
  const base = createServiceTokens(seed.map((s) => s.entry));
  return {
    verify(authorization, scope) {
      // A revoked token answers like an unknown one, whatever scope it asks for: do not leak
      // that it was ever valid. Checked before the scope check so the answer is never 403.
      const m = /^Bearer ([^\s]+)$/.exec(authorization ?? '');
      if (m && TOKEN_RE.test(m[1]) && revoked.has(hashServiceToken(m[1]))) return { ok: false, status: 401 };
      return base.verify(authorization, scope);
    },
    list: base.list,
    views() {
      return seed.map(({ entry, source }) => {
        const r = revoked.get(entry.sha256);
        const view: ServiceTokenView = { id: entry.id, name: entry.name, scopes: [...entry.scopes], created: entry.created, source, revoked: !!r };
        if (r) view.revokedAt = r.at;
        return view;
      });
    },
    revoke(id) {
      const matches = seed.filter((s) => s.entry.id === id);
      if (matches.length === 0) return false;
      const at = now().toISOString();
      const added: RevokedToken[] = [];
      for (const { entry } of matches) {
        if (revoked.has(entry.sha256) || added.some((a) => a.sha256 === entry.sha256)) continue;
        added.push({ sha256: entry.sha256, id: entry.id, at });
      }
      if (added.length > 0) {
        // Save first: a failed save leaves memory and disk in agreement, and a retry saves again.
        store.save([...revoked.values(), ...added]);
        for (const a of added) revoked.set(a.sha256, a);
      }
      return true;
    },
  };
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
