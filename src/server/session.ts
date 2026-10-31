// Session tokens, cookies and password checks shared by every app. Node only, no framework types.
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_DAYS = 30;

const COOKIE_NAME_RE = /^[A-Za-z0-9_-]+$/;
const NONCE_RE = /^[0-9a-f]{24}$/;
const HEX_RE = /^[0-9a-f]+$/;

function equalStrings(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** `v1.<expires s>.<24 hex nonce>.<base64url hmac-sha256 of the first three parts>` */
export function createSessionToken(secret: string, now: number = Date.now(), days: number = SESSION_DAYS): string {
  if (secret === '') throw new Error('session secret is empty');
  const expires = Math.floor(now / 1000) + Math.round(days * 86400);
  const body = `v1.${expires}.${randomBytes(12).toString('hex')}`;
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export interface VerifyOptions {
  now?: number;
  legacyHex?: boolean;
}

/** v1 as above. With legacyHex also job-apps' `v1.<exp>.<hex hmac>` (3 parts) and
 *  `v2.<exp>.<nonce>.<hex hmac>`; hex hmac is over every part but the last joined by '.'.
 *  False for: empty secret, missing token, wrong part count or prefix, non-finite or past expiry,
 *  signature length mismatch. Constant-time compare (timingSafeEqual on equal-length buffers). */
export function verifySessionToken(secret: string, token: string | null | undefined, opts: VerifyOptions = {}): boolean {
  if (!secret || !token || typeof token !== 'string') return false;
  const now = opts.now ?? Date.now();
  const parts = token.split('.');
  let signed: string;
  let sig: string;
  let encoding: 'base64url' | 'hex';
  if (parts.length === 4 && parts[0] === 'v1' && NONCE_RE.test(parts[2])) {
    signed = parts.slice(0, 3).join('.');
    sig = parts[3];
    encoding = 'base64url';
  } else if (opts.legacyHex && ((parts.length === 3 && parts[0] === 'v1') || (parts.length === 4 && parts[0] === 'v2'))) {
    signed = parts.slice(0, -1).join('.');
    sig = parts[parts.length - 1];
    encoding = 'hex';
    if (!HEX_RE.test(sig)) return false;
  } else {
    return false;
  }
  const expires = Number(parts[1]);
  if (!parts[1] || !Number.isFinite(expires) || expires * 1000 <= now) return false;
  const expected = createHmac('sha256', secret).update(signed).digest(encoding);
  return equalStrings(expected, sig);
}

/** sha256 both sides, timingSafeEqual. caseInsensitive (default true) trims and lowercases both.
 *  Always false when expected is ''. */
export function passwordMatches(expected: string, provided: string, opts: { caseInsensitive?: boolean } = {}): boolean {
  if (typeof expected !== 'string' || typeof provided !== 'string' || expected === '') return false;
  const fold = opts.caseInsensitive ?? true;
  const a = fold ? expected.trim().toLowerCase() : expected;
  const b = fold ? provided.trim().toLowerCase() : provided;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Value of cookie `name` in a Cookie header, or undefined. Splits on ';', trims, first match wins,
 *  decodeURIComponent in try/catch (raw value on failure). */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const piece of header.split(';')) {
    const part = piece.trim();
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export interface SessionAuth {
  readonly cookieName: string;
  readonly days: number;
  issue(now?: number): string;
  verify(token: string | null | undefined, now?: number): boolean;
  /** Reads the cookie from a Cookie header and verifies it. */
  isAuthed(cookieHeader: string | null | undefined, now?: number): boolean;
  /** A full Set-Cookie value with a fresh token:
   *  `<name>=<token>; Max-Age=<days*86400>; Path=/; HttpOnly; SameSite=Lax` plus `; Secure` when secure. */
  setCookie(secure: boolean, now?: number): string;
  /** `<name>=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax` */
  clearCookie(): string;
}

export function createSessionAuth(o: { cookieName: string; secret: string | (() => string); days?: number; legacyHex?: boolean }): SessionAuth {
  if (!COOKIE_NAME_RE.test(o.cookieName)) throw new Error(`invalid cookie name: ${o.cookieName}`);
  const days = o.days ?? SESSION_DAYS;
  const secret = (): string => (typeof o.secret === 'function' ? o.secret() : o.secret);
  const auth: SessionAuth = {
    cookieName: o.cookieName,
    days,
    issue: (now) => createSessionToken(secret(), now, days),
    verify: (token, now) => verifySessionToken(secret(), token, { now, legacyHex: o.legacyHex }),
    isAuthed: (header, now) => auth.verify(readCookie(header, o.cookieName), now),
    setCookie: (secure, now) =>
      `${o.cookieName}=${auth.issue(now)}; Max-Age=${Math.round(days * 86400)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
    clearCookie: () => `${o.cookieName}=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
  };
  return auth;
}
