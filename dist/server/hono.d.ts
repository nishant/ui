import { Context, MiddlewareHandler, Handler, Env, Hono, ErrorHandler } from 'hono';
import { InboxActionCall, InboxData, SessionAuth, Limiter, TrustProxy, ManagedServiceTokens, CrossSiteOptions, SpaOptions } from './index.js';

/** Node socket peer from @hono/node-server's c.env.incoming, else undefined. */
declare function remoteAddressOf(c: Context): string | undefined;
/** The client address for c (see clientIp), or null when there is none. `trust` defaults to 'none':
 *  forwarding headers are ignored and the socket address is used. */
declare function clientIpOf(c: Context, trust?: TrustProxy): string | null;
/** The limiter key of every request that has no address at all (no socket, nothing trusted). */
declare const NO_ADDRESS_KEY = "no-address";
declare function isAuthed(c: Context, auth: SessionAuth): boolean;
declare function startSession(c: Context, auth: SessionAuth, secure: boolean): void;
declare function endSession(c: Context, auth: SessionAuth): void;
/** 401 `{ error: message }` (default 'Log in to see this.') unless authed. */
declare function requireSession(auth: SessionAuth, opts?: {
    message?: string;
}): MiddlewareHandler;
interface LoginOptions {
    auth: SessionAuth;
    password: string | (() => string);
    limiter: Limiter;
    secure: boolean | ((c: Context) => boolean);
    /** Trims and lowercases both sides before comparing. Default false: an exact match. */
    caseInsensitive?: boolean;
    /** Which forwarding headers name the client for rate limiting. Default 'none': only the socket. */
    trustProxy?: TrustProxy;
    failDelayMs?: number;
    messages?: {
        tooMany?: string;
        wrong?: string;
    };
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
declare function loginHandler(o: LoginOptions): Handler;
/** GET <base>/me -> { authed }, POST <base>/login -> loginHandler, POST <base>/logout -> endSession + { authed: false }. base default '/api'. */
declare function mountSessionRoutes<E extends Env>(app: Hono<E>, o: LoginOptions & {
    base?: string;
}): void;
/** app.use('*', crossSiteGuard()): isCrossSiteWrite -> 403 { error: message } (default
 *  'Cross-site request refused.'), before any route or login runs; everything else goes on. */
declare function crossSiteGuard(opts?: CrossSiteOptions & {
    message?: string;
}): MiddlewareHandler;
/** app.get('*', serveSpa(...)): createSpaHandler(o) on c.req.raw. */
declare function serveSpa(o: SpaOptions): Handler;
/** app.onError(...): an error with a getResponse() function (HTTPException) returns that response;
 *  anything else -> errorResponse(...) as JSON 500. */
declare function onErrorHandler(log?: (line: string) => void): ErrorHandler;
interface InboxActionRouteOptions {
    port: number;
    source: string;
    path?: string;
    verify(call: InboxActionCall & {
        data: InboxData;
    }): boolean | Promise<boolean>;
    run(call: InboxActionCall & {
        data: InboxData;
    }): {
        status: number;
        body: unknown;
    } | Promise<{
        status: number;
        body: unknown;
    }>;
    log(line: string): void;
    refused?: Record<string, unknown>;
}
/** POST <path>: not isInboxCall -> 401 refused (body unread); parseInboxActionCall null -> 400
 *  { error: `Not an inbox action from ${source}.` }; verify false -> log
 *  `inbox action <actionId> on <dedupeKey>: refused (no current action token)` and 401 refused;
 *  else run, log `inbox action <actionId> on <dedupeKey>: <status>`, answer c.json(body, status).
 *  Mount before any login middleware covering the path. */
declare function mountInboxAction<E extends Env>(app: Hono<E>, o: InboxActionRouteOptions): void;
interface ServiceTokenRouteOptions {
    tokens: ManagedServiceTokens;
    base?: string;
    log?: (line: string) => void;
}
/** GET <base> -> 200 { tokens: views() } with Cache-Control: no-store.
 *  POST <base>/:id/revoke -> 200 { tokens: views() } after revoke, logs
 *  `service token <id> revoked`; 404 { error: 'No service token with that id.' } when unknown.
 *  Mount behind the app's login (requireSession) and its cross-site write guard. */
declare function mountServiceTokenRoutes<E extends Env>(app: Hono<E>, o: ServiceTokenRouteOptions): void;

export { NO_ADDRESS_KEY, clientIpOf, crossSiteGuard, endSession, isAuthed, loginHandler, mountInboxAction, mountServiceTokenRoutes, mountSessionRoutes, onErrorHandler, remoteAddressOf, requireSession, serveSpa, startSession };
export type { InboxActionRouteOptions, LoginOptions, ServiceTokenRouteOptions };
