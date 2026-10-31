// The guard and tokens for inbox action targets: what an app's POST /api/inbox/action route checks
// before it runs anything. Framework-free; the Hono route is in @nish/ui/server/hono.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isInboxActionTarget } from './client';
import type { InboxAction, InboxActionCall, InboxData } from './types';

export const INBOX_ACTION_PATH = '/api/inbox/action';
export const ACTION_TOKEN_FIELD = 'actionToken';
export const inboxActionTarget = (port: number, path?: string) => `http://127.0.0.1:${port}${path ?? INBOX_ACTION_PATH}`;

export type HeaderBag = Headers | Record<string, string | string[] | undefined>;

const LOOPBACK_PEERS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FORBIDDEN_HEADERS = ['forwarded', 'via', 'x-real-ip', 'true-client-ip', 'cdn-loop', 'origin'];
const FORBIDDEN_PREFIXES = ['x-forwarded-', 'cf-'];
const ACTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const HASH_RE = /^[0-9a-f]{64}$/;

function headerNames(headers: HeaderBag): string[] {
  if (typeof (headers as Headers).forEach === 'function' && typeof (headers as Headers).get === 'function') {
    const names: string[] = [];
    (headers as Headers).forEach((_v, k) => names.push(k.toLowerCase()));
    return names;
  }
  return Object.entries(headers as Record<string, string | string[] | undefined>)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k.toLowerCase());
}

function headerValue(headers: HeaderBag, name: string): string | undefined {
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined;
  for (const [k, v] of Object.entries(headers as Record<string, string | string[] | undefined>)) {
    if (k.toLowerCase() === name) return Array.isArray(v) ? v[0] : v;
  }
  return undefined;
}

/** True only when every rule holds:
 *  remoteAddress is 127.0.0.1, ::1 or ::ffff:127.0.0.1; header host === `127.0.0.1:${port}`;
 *  none of these headers is present: forwarded, via, x-real-ip, true-client-ip, cdn-loop, origin, and any name
 *  starting with x-forwarded- or cf-; no sec-fetch-* header (site, dest, user: browsers only) except
 *  sec-fetch-mode with the exact value 'cors', which Node's own fetch (undici) always sends;
 *  header x-inbox-action === '1'.
 *  Header names compared lowercase; Headers and Node IncomingHttpHeaders both accepted. */
export function isInboxCall(req: { headers: HeaderBag; remoteAddress: string | null | undefined; port: number }): boolean {
  if (!req.remoteAddress || !LOOPBACK_PEERS.has(req.remoteAddress)) return false;
  if (headerValue(req.headers, 'host') !== `127.0.0.1:${req.port}`) return false;
  for (const name of headerNames(req.headers)) {
    if (FORBIDDEN_HEADERS.includes(name)) return false;
    if (FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) return false;
    if (name.startsWith('sec-fetch-') && !(name === 'sec-fetch-mode' && headerValue(req.headers, name) === 'cors')) return false;
  }
  return headerValue(req.headers, 'x-inbox-action') === '1';
}

/** The body as an InboxActionCall for `source`, or null: itemId a positive safe integer, actionId
 *  matching /^[a-z0-9][a-z0-9-]{0,31}$/, source === `source`, kind a string, dedupeKey string or null,
 *  data a plain object. */
export function parseInboxActionCall(body: unknown, source: string): (InboxActionCall & { data: InboxData }) | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.itemId !== 'number' || !Number.isSafeInteger(b.itemId) || b.itemId <= 0) return null;
  if (typeof b.actionId !== 'string' || !ACTION_ID_RE.test(b.actionId)) return null;
  if (b.source !== source) return null;
  if (typeof b.kind !== 'string') return null;
  if (b.dedupeKey !== null && typeof b.dedupeKey !== 'string') return null;
  const data = b.data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  return {
    itemId: b.itemId,
    actionId: b.actionId,
    source,
    kind: b.kind,
    dedupeKey: b.dedupeKey as string | null,
    data: data as InboxData,
  };
}

/** 32 random bytes, base64url. */
export function newActionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** sha256 hex (utf8). */
export function hashActionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Constant time. False when token is not a string of 1..128 chars, or storedHash is not 64 lowercase hex. */
export function actionTokenMatches(token: unknown, storedHash: string | null | undefined): boolean {
  if (typeof token !== 'string' || token.length < 1 || token.length > 128) return false;
  if (typeof storedHash !== 'string' || !HASH_RE.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashActionToken(token), 'hex'), Buffer.from(storedHash, 'hex'));
}

/** An action button; throws Error(`not an inbox action target: ${target}`) when isInboxActionTarget fails. */
export function inboxAction(id: string, label: string, target: string): InboxAction {
  if (!isInboxActionTarget(target)) throw new Error(`not an inbox action target: ${target}`);
  return { id, label, method: 'POST', target };
}
