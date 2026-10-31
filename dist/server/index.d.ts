import { c as InboxEventInput, d as InboxIngestAction, e as InboxEvent, f as InboxAction, I as InboxActionCall, a as InboxData } from '../spa-EPM1E0Va.js';
export { g as INBOX_ACTION_HEADER, h as INBOX_ACTION_TIMEOUT_MS, i as INBOX_DEFAULT_SETTINGS, j as INBOX_SOURCE_LABELS, k as InboxActionResult, l as InboxItem, m as InboxListResponse, n as InboxSettings, o as InboxSeverity, p as InboxView, L as Limiter, q as SESSION_DAYS, S as SessionAuth, b as SpaOptions, V as VerifyOptions, r as createLimiter, s as createSessionAuth, t as createSessionToken, u as createSpaHandler, v as passwordMatches, w as readCookie, x as verifySessionToken } from '../spa-EPM1E0Va.js';

/** 127.0.0.0/8, ::1 and ::ffff:127.x. */
declare function isLoopback(address: string | null | undefined): boolean;
/** The key a limiter should use for this request. cf-connecting-ip (trimmed, at most 64 chars,
 *  no comma) first; else the rightmost X-Forwarded-For entry that is not loopback (127.0.0.0/8,
 *  ::1, ::ffff:127.x) and not empty; else remoteAddress when it is not loopback; else 'local'. */
declare function clientIp(get: (name: string) => string | null | undefined, remoteAddress?: string | null): string;

/** Folder `up` levels above the directory of `importMetaUrl` (dist/server/env.js, up 2 = repo root). */
declare function appRoot(importMetaUrl: string, up?: number): string;
/** Reads <root>/<file> (default '.env') when it exists, parsed with node:util parseEnv; sets only keys
 *  not already in process.env (the environment wins). Then throws
 *  Error(`${missing.join(' and ')} must be set - see .env.example`) when any `required` key is
 *  empty or unset. Returns the absolute path it read, or null. */
declare function loadAppEnv(o: {
    root: string;
    file?: string;
    required?: string[];
}): string | null;
/** Positive finite number from an env string, else fallback. */
declare function envNumber(value: string | undefined, fallback: number): number;

interface ProcessHandlerOptions {
    name: string;
    log?: (line: string) => void;
    server?: {
        close(cb?: (err?: Error) => void): unknown;
        closeAllConnections?: () => void;
    };
    onShutdown?: () => void | Promise<void>;
    graceMs?: number;
    exit?: (code: number) => void;
}
type Handle = {
    shutdown(signal: string): Promise<void>;
};
/** Installs once per process (a second call returns the first handle):
 *  - unhandledRejection: log `unhandled rejection: <stack or String(reason)>`, keep running.
 *  - uncaughtException: log `uncaught exception: <stack>`, then exit(1) (the supervisor restarts).
 *  - SIGINT, SIGTERM: shutdown(signal). Not SIGBREAK: a task stop sends CTRL+BREAK and the
 *    supervisor reads the child's 0xC000013A exit as "stopping"; a graceful exit 0 would be restarted.
 *  shutdown: runs once; logs `got <signal>, shutting down`; server.close(); closeAllConnections?.();
 *  awaits onShutdown (errors logged as `shutdown hook failed: <msg>`); exit(0). A graceMs timer
 *  (unref'd) logs `forced exit after <graceMs> ms` and exits 0 if that has not finished. */
declare function installProcessHandlers(o: ProcessHandlerOptions): Handle;
/** For any framework's error hook: logs `<method> <path> failed: <stack>` and returns the generic
 *  body. Never puts err.message in the response. */
declare function errorResponse(err: unknown, req: {
    method: string;
    path: string;
}, log?: (line: string) => void): {
    status: 500;
    body: {
        error: string;
    };
};

/** Whether `target` is an allowed action target: http://127.0.0.1 with an explicit port, no credentials,
 *  no #hash, at most 2000 characters. The inbox service re-checks this before every call. */
declare function isInboxActionTarget(target: unknown): target is string;
/** Validates a producer's event and applies defaults. Error strings are shown to producers as is. */
declare function parseInboxEvent(input: unknown): {
    ok: true;
    value: InboxEvent;
} | {
    ok: false;
    error: string;
};
/** Options for {@link createInboxClient}. */
interface InboxClientOptions {
    /** Which app is sending, for example 'trackers'. Same rules as `InboxEventInput.source`. */
    source: string;
    /** Service address. Defaults to `process.env.INBOX_URL`, then 'http://127.0.0.1:8805'; 'off' disables the client.
     *  A dev checkout (started by an npm script, NODE_ENV not 'production', no url and no INBOX_URL) is off too,
     *  so local runs and tests never post to the live inbox. */
    url?: string;
    /** Request timeout in milliseconds. Default 3000. */
    timeoutMs?: number;
    /** Replacement for `fetch`, for tests. */
    fetch?: typeof fetch;
    /** Where messages go. Default `console.warn` with the prefix '[inbox] '. */
    log?: (message: string) => void;
}
/** The outcome of one send. The client never throws; check `ok`. */
type InboxSendResult = {
    ok: true;
    id: number | null;
    action: InboxIngestAction;
} | {
    ok: false;
    error: string;
    queued: boolean;
};
/** A client bound to one source. */
interface InboxClient {
    /** Sends an event. Resolves with the result; network failures are queued and retried. */
    send(event: Omit<InboxEventInput, 'source'>): Promise<InboxSendResult>;
    /** Marks the open item with this dedupeKey handled by the source. Sends `{ kind: 'resolve', title: 'resolve', dedupeKey, resolve: true }`. */
    resolve(dedupeKey: string): Promise<InboxSendResult>;
    /** Retries the queue now; resolves when done. */
    flush(): Promise<void>;
    /** Number of queued events. */
    readonly pending: number;
}
/** Creates a client that sends events to the inbox service without ever throwing or blocking the caller's work. */
declare function createInboxClient(options: InboxClientOptions): InboxClient;

declare const INBOX_ACTION_PATH = "/api/inbox/action";
declare const ACTION_TOKEN_FIELD = "actionToken";
declare const inboxActionTarget: (port: number, path?: string) => string;
type HeaderBag = Headers | Record<string, string | string[] | undefined>;
/** True only when every rule holds:
 *  remoteAddress is 127.0.0.1, ::1 or ::ffff:127.0.0.1; header host === `127.0.0.1:${port}`;
 *  none of these headers is present: forwarded, via, x-real-ip, true-client-ip, cdn-loop, origin, and any name
 *  starting with x-forwarded-, sec-fetch- or cf-; header x-inbox-action === '1'.
 *  Header names compared lowercase; Headers and Node IncomingHttpHeaders both accepted. */
declare function isInboxCall(req: {
    headers: HeaderBag;
    remoteAddress: string | null | undefined;
    port: number;
}): boolean;
/** The body as an InboxActionCall for `source`, or null: itemId a positive safe integer, actionId
 *  matching /^[a-z0-9][a-z0-9-]{0,31}$/, source === `source`, kind a string, dedupeKey string or null,
 *  data a plain object. */
declare function parseInboxActionCall(body: unknown, source: string): (InboxActionCall & {
    data: InboxData;
}) | null;
/** 32 random bytes, base64url. */
declare function newActionToken(): string;
/** sha256 hex (utf8). */
declare function hashActionToken(token: string): string;
/** Constant time. False when token is not a string of 1..128 chars, or storedHash is not 64 lowercase hex. */
declare function actionTokenMatches(token: unknown, storedHash: string | null | undefined): boolean;
/** An action button; throws Error(`not an inbox action target: ${target}`) when isInboxActionTarget fails. */
declare function inboxAction(id: string, label: string, target: string): InboxAction;

interface ServiceTokenEntry {
    id: string;
    name: string;
    scopes: string[];
    /** sha256 (hex) of the raw token. */
    sha256: string;
    created: string;
}
type VerifyResult = {
    ok: true;
    entry: ServiceTokenEntry;
} | {
    ok: false;
    status: 401 | 403;
};
interface ServiceTokens {
    verify(authorization: string | undefined, scope: string): VerifyResult;
    /** The entries without their hashes, for a settings page or a `whoami`. */
    list(): Array<Omit<ServiceTokenEntry, 'sha256'>>;
}
declare const hashServiceToken: (token: string) => string;
/** A new raw token for `app` (lowercase letters, digits, dashes). Store only its hash in the app. */
declare function mintServiceToken(app: string): {
    token: string;
    sha256: string;
};
/**
 * Loads entries from `file` (missing file = no entries) and from `env` (the SERVICE_TOKENS value).
 * Read once at startup; a deploy restarts the app, which is when the file changes.
 */
declare function loadServiceTokens(o?: {
    file?: string;
    env?: string;
}): ServiceTokens;
declare function createServiceTokens(entries: ServiceTokenEntry[]): ServiceTokens;
/**
 * True only for a request made straight to the app on loopback: Host is 127.0.0.1, localhost or
 * [::1] with the app's port, there are no proxy headers and no Origin (browsers never get in).
 */
declare function isDirectLoopback(get: (name: string) => string | undefined, port: number): boolean;
/** Framework-free check: the status and body a guard should answer with, or null to continue. */
declare function checkServiceRequest(get: (name: string) => string | undefined, o: {
    tokens: ServiceTokens;
    scope: string;
    port: number;
}): {
    status: 401 | 403;
    error: string;
} | null;

export { ACTION_TOKEN_FIELD, INBOX_ACTION_PATH, InboxAction, InboxActionCall, InboxData, InboxEvent, InboxEventInput, InboxIngestAction, actionTokenMatches, appRoot, checkServiceRequest, clientIp, createInboxClient, createServiceTokens, envNumber, errorResponse, hashActionToken, hashServiceToken, inboxAction, inboxActionTarget, installProcessHandlers, isDirectLoopback, isInboxActionTarget, isInboxCall, isLoopback, loadAppEnv, loadServiceTokens, mintServiceToken, newActionToken, parseInboxActionCall, parseInboxEvent };
export type { HeaderBag, InboxClient, InboxClientOptions, InboxSendResult, ProcessHandlerOptions, ServiceTokenEntry, ServiceTokens, VerifyResult };
