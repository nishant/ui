// @nish/ui/server/hono: Hono adapters over the framework-free @nish/ui/server code.
// Imports only types from 'hono', so there is no runtime dependency on it.
import type { Context, Env, ErrorHandler, Handler, Hono, MiddlewareHandler } from 'hono';
import { clientIp, type TrustProxy } from './client-ip';
import { isCrossSiteWrite, type CrossSiteOptions } from './cross-site';
import { INBOX_ACTION_PATH, isInboxCall, parseInboxActionCall } from './inbox/action';
import type { InboxActionCall, InboxData } from './inbox/types';
import type { Limiter } from './limiter';
import { errorResponse } from './process';
import type { ManagedServiceTokens } from './service-tokens';
import type { SessionAuth } from './session';
import { passwordMatches } from './session';
import { createSpaHandler, type SpaOptions } from './spa';

/** Node socket peer from @hono/node-server's c.env.incoming, else undefined. */
export function remoteAddressOf(c: Context): string | undefined {
  const env = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
  const address = env?.incoming?.socket?.remoteAddress;
  return typeof address === 'string' ? address : undefined;
}

/** The client address for c (see clientIp), or null when there is none. `trust` defaults to 'none':
 *  forwarding headers are ignored and the socket address is used. */
export function clientIpOf(c: Context, trust: TrustProxy = 'none'): string | null {
  return clientIp((name) => c.req.header(name), remoteAddressOf(c), { trust });
}

/** The limiter key of every request that has no address at all (no socket, nothing trusted). */
export const NO_ADDRESS_KEY = 'no-address';

export function isAuthed(c: Context, auth: SessionAuth): boolean {
  return auth.isAuthed(c.req.header('cookie'));
}

export function startSession(c: Context, auth: SessionAuth, secure: boolean): void {
  c.header('Set-Cookie', auth.setCookie(secure), { append: true });
}

export function endSession(c: Context, auth: SessionAuth): void {
  c.header('Set-Cookie', auth.clearCookie(), { append: true });
}

/** 401 `{ error: message }` (default 'Log in to see this.') unless authed. */
export function requireSession(auth: SessionAuth, opts?: { message?: string }): MiddlewareHandler {
  const message = opts?.message ?? 'Log in to see this.';
  return async (c, next) => {
    if (!isAuthed(c, auth)) return c.json({ error: message }, 401);
    await next();
  };
}

export interface LoginOptions {
  auth: SessionAuth;
  password: string | (() => string);
  limiter: Limiter;
  secure: boolean | ((c: Context) => boolean);
  /** Trims and lowercases both sides before comparing. Default false: an exact match. */
  caseInsensitive?: boolean;
  /** Which forwarding headers name the client for rate limiting. Default 'none': only the socket. */
  trustProxy?: TrustProxy;
  failDelayMs?: number; // 0
  messages?: { tooMany?: string; wrong?: string }; // 'Too many tries. Wait a minute and try again.' / 'That password is not right.'
  /** Body of the 429 and 401 answers. Default (kind, message) => ({ error: message }). */
  errorBody?: (kind: 'tooMany' | 'wrong', message: string) => Record<string, unknown>;
  /** Default c.json({ authed: true }). */
  onSuccess?: (c: Context) => Response | Promise<Response>;
}

/** POST handler: limiter key clientIpOf(c, trustProxy), or NO_ADDRESS_KEY (one shared bucket) when the
 *  request has no address; limiter.hit(key) first, before any await, false -> 429; body via
 *  c.req.json() (failure = {}); password must be a string of at most 1024 chars and match (exact
 *  unless caseInsensitive), else wait failDelayMs, 401; success -> limiter.reset, startSession,
 *  onSuccess. */
export function loginHandler(o: LoginOptions): Handler {
  const tooMany = o.messages?.tooMany ?? 'Too many tries. Wait a minute and try again.';
  const wrong = o.messages?.wrong ?? 'That password is not right.';
  const errorBody = o.errorBody ?? ((_kind, message) => ({ error: message }));
  return async (c) => {
    const key = clientIpOf(c, o.trustProxy) ?? NO_ADDRESS_KEY;
    if (!o.limiter.hit(key)) return c.json(errorBody('tooMany', tooMany), 429);
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const provided = body && typeof body === 'object' ? (body as { password?: unknown }).password : undefined;
    const expected = typeof o.password === 'function' ? o.password() : o.password;
    const ok =
      typeof provided === 'string' &&
      provided.length <= 1024 &&
      passwordMatches(expected, provided, { caseInsensitive: o.caseInsensitive ?? false });
    if (!ok) {
      const delay = o.failDelayMs ?? 0;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      return c.json(errorBody('wrong', wrong), 401);
    }
    o.limiter.reset(key);
    startSession(c, o.auth, typeof o.secure === 'function' ? o.secure(c) : o.secure);
    return o.onSuccess ? o.onSuccess(c) : c.json({ authed: true });
  };
}

/** GET <base>/me -> { authed }, POST <base>/login -> loginHandler, POST <base>/logout -> endSession + { authed: false }. base default '/api'. */
export function mountSessionRoutes<E extends Env>(app: Hono<E>, o: LoginOptions & { base?: string }): void {
  const base = o.base ?? '/api';
  app.get(`${base}/me`, (c) => c.json({ authed: isAuthed(c, o.auth) }));
  app.post(`${base}/login`, loginHandler(o));
  app.post(`${base}/logout`, (c) => {
    endSession(c, o.auth);
    return c.json({ authed: false });
  });
}

/** app.use('*', crossSiteGuard()): isCrossSiteWrite -> 403 { error: message } (default
 *  'Cross-site request refused.'), before any route or login runs; everything else goes on. */
export function crossSiteGuard(opts?: CrossSiteOptions & { message?: string }): MiddlewareHandler {
  const message = opts?.message ?? 'Cross-site request refused.';
  return async (c, next) => {
    if (isCrossSiteWrite(c.req.method, (name) => c.req.header(name), opts)) return c.json({ error: message }, 403);
    await next();
  };
}

/** app.get('*', serveSpa(...)): createSpaHandler(o) on c.req.raw. */
export function serveSpa(o: SpaOptions): Handler {
  const handle = createSpaHandler(o);
  return (c) => handle(c.req.raw);
}

/** app.onError(...): an error with a getResponse() function (HTTPException) returns that response;
 *  anything else -> errorResponse(...) as JSON 500. */
export function onErrorHandler(log?: (line: string) => void): ErrorHandler {
  return (err, c) => {
    const withResponse = err as { getResponse?: unknown };
    if (typeof withResponse.getResponse === 'function') return (withResponse.getResponse as () => Response).call(err);
    const out = errorResponse(err, { method: c.req.method, path: c.req.path }, log);
    return c.json(out.body, out.status);
  };
}

export interface InboxActionRouteOptions {
  port: number;
  source: string;
  path?: string; // INBOX_ACTION_PATH
  verify(call: InboxActionCall & { data: InboxData }): boolean | Promise<boolean>;
  run(call: InboxActionCall & { data: InboxData }): { status: number; body: unknown } | Promise<{ status: number; body: unknown }>;
  log(line: string): void;
  refused?: Record<string, unknown>; // { error: 'Log in to see this.' }
}

/** POST <path>: not isInboxCall -> 401 refused (body unread); parseInboxActionCall null -> 400
 *  { error: `Not an inbox action from ${source}.` }; verify false -> log
 *  `inbox action <actionId> on <dedupeKey>: refused (no current action token)` and 401 refused;
 *  else run, log `inbox action <actionId> on <dedupeKey>: <status>`, answer c.json(body, status).
 *  Mount before any login middleware covering the path. */
export function mountInboxAction<E extends Env>(app: Hono<E>, o: InboxActionRouteOptions): void {
  const refused = o.refused ?? { error: 'Log in to see this.' };
  app.post(o.path ?? INBOX_ACTION_PATH, async (c) => {
    if (!isInboxCall({ headers: c.req.raw.headers, remoteAddress: remoteAddressOf(c), port: o.port })) {
      return c.json(refused, 401);
    }
    let body: unknown = null;
    try {
      body = await c.req.json();
    } catch {
      body = null;
    }
    const call = parseInboxActionCall(body, o.source);
    if (!call) return c.json({ error: `Not an inbox action from ${o.source}.` }, 400);
    if (!(await o.verify(call))) {
      o.log(`inbox action ${call.actionId} on ${call.dedupeKey}: refused (no current action token)`);
      return c.json(refused, 401);
    }
    const result = await o.run(call);
    o.log(`inbox action ${call.actionId} on ${call.dedupeKey}: ${result.status}`);
    return c.json(result.body as never, result.status as never);
  });
}

export interface ServiceTokenRouteOptions {
  tokens: ManagedServiceTokens;
  base?: string; // '/api/service-tokens'
  log?: (line: string) => void; // console.log
}

/** GET <base> -> 200 { tokens: views() } with Cache-Control: no-store.
 *  POST <base>/:id/revoke -> 200 { tokens: views() } after revoke, logs
 *  `service token <id> revoked`; 404 { error: 'No service token with that id.' } when unknown.
 *  Mount behind the app's login (requireSession) and its cross-site write guard. */
export function mountServiceTokenRoutes<E extends Env>(app: Hono<E>, o: ServiceTokenRouteOptions): void {
  const base = (o.base ?? '/api/service-tokens').replace(/\/+$/, '');
  const log = o.log ?? ((line: string) => console.log(line));
  app.get(base, (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({ tokens: o.tokens.views() });
  });
  app.post(`${base}/:id/revoke`, (c) => {
    const id = c.req.param('id');
    c.header('Cache-Control', 'no-store');
    if (!o.tokens.revoke(id)) return c.json({ error: 'No service token with that id.' }, 404);
    log(`service token ${id} revoked`);
    return c.json({ tokens: o.tokens.views() });
  });
}
