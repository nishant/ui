import { Context, Handler, Env, Hono, ErrorHandler, MiddlewareHandler } from 'hono';
import { InboxActionCall, InboxData, SessionAuth, Limiter, SpaOptions } from './index.js';

/** Node socket peer from @hono/node-server's c.env.incoming, else undefined. */
declare function remoteAddressOf(c: Context): string | undefined;
declare function clientIpOf(c: Context): string;
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
    caseInsensitive?: boolean;
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
/** POST handler: limiter key clientIpOf(c); not allowed -> 429; body via c.req.json() (failure = {});
 *  password must be a string of at most 1024 chars and match, else limiter.fail, wait failDelayMs, 401;
 *  success -> limiter.reset, startSession, onSuccess. */
declare function loginHandler(o: LoginOptions): Handler;
/** GET <base>/me -> { authed }, POST <base>/login -> loginHandler, POST <base>/logout -> endSession + { authed: false }. base default '/api'. */
declare function mountSessionRoutes<E extends Env>(app: Hono<E>, o: LoginOptions & {
    base?: string;
}): void;
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

export { clientIpOf, endSession, isAuthed, loginHandler, mountInboxAction, mountSessionRoutes, onErrorHandler, remoteAddressOf, requireSession, serveSpa, startSession };
export type { InboxActionRouteOptions, LoginOptions };
