// The guard and tokens for inbox action targets: what an app's POST /api/inbox/action route checks
// before it runs anything. Framework-free; the Hono route is in @nish/ui/server/hono.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isInboxActionTarget } from './client';
import { isDirectCall, type HeaderBag } from '../direct-call';
import type { InboxAction, InboxActionCall, InboxData } from './types';

export const INBOX_ACTION_PATH = '/api/inbox/action';
export const ACTION_TOKEN_FIELD = 'actionToken';
export const inboxActionTarget = (port: number, path?: string) => `http://127.0.0.1:${port}${path ?? INBOX_ACTION_PATH}`;

const ACTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const HASH_RE = /^[0-9a-f]{64}$/;

export type { HeaderBag } from '../direct-call';

function inboxHeader(headers: HeaderBag): string | undefined {
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get('x-inbox-action') ?? undefined;
  for (const [k, v] of Object.entries(headers as Record<string, string | string[] | undefined>)) {
    if (k.toLowerCase() === 'x-inbox-action') return Array.isArray(v) ? v[0] : v;
  }
  return undefined;
}

/** True only when isDirectCall holds (loopback peer, Host 127.0.0.1:port, no proxy/Origin/browser fetch-metadata
 *  headers; see isDirectCall for the full rules) and header x-inbox-action === '1'. */
export function isInboxCall(req: { headers: HeaderBag; remoteAddress: string | null | undefined; port: number }): boolean {
  return isDirectCall(req) && inboxHeader(req.headers) === '1';
}

function validDedupeKey(k: unknown): k is string {
  if (typeof k !== 'string' || k.length < 1 || k.length > 200) return false;
  for (let i = 0; i < k.length; i++) {
    const c = k.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return false;
  }
  return true;
}

/** The body as an InboxActionCall for `source`, or null: itemId a positive safe integer, actionId
 *  matching /^[a-z0-9][a-z0-9-]{0,31}$/, source === `source`, kind a string, dedupeKey null or a string of 1..200 chars with no control characters (below 0x20 or 0x7f),
 *  data a plain object or null (null becomes {}). */
export function parseInboxActionCall(body: unknown, source: string): (InboxActionCall & { data: InboxData }) | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.itemId !== 'number' || !Number.isSafeInteger(b.itemId) || b.itemId <= 0) return null;
  if (typeof b.actionId !== 'string' || !ACTION_ID_RE.test(b.actionId)) return null;
  if (b.source !== source) return null;
  if (typeof b.kind !== 'string') return null;
  if (b.dedupeKey !== null && !validDedupeKey(b.dedupeKey)) return null;
  const data = b.data;
  if (data !== null && data !== undefined && (typeof data !== 'object' || Array.isArray(data))) return null;
  return {
    itemId: b.itemId,
    actionId: b.actionId,
    source,
    kind: b.kind,
    dedupeKey: b.dedupeKey as string | null,
    data: (data ?? {}) as InboxData,
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
