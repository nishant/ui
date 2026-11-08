/** 127.0.0.0/8, ::1 and ::ffff:127.x. */
declare function isLoopback(address: string | null | undefined): boolean;
/** Which forwarding headers `clientIp` believes.
 *  - 'none' (default): none. The socket address is the client. Right when the app is reached directly.
 *  - 'proxy': the rightmost `X-Forwarded-For` hop, which the nearest proxy appended itself. Use it
 *    when exactly one proxy you control sits in front of the app and no client can reach the app
 *    except through it.
 *  - 'cloudflare': `cf-connecting-ip`, then as 'proxy'. Use it only when every request really comes
 *    through Cloudflare (the origin refuses other traffic), or the header can be forged. */
type TrustProxy = 'none' | 'proxy' | 'cloudflare';
interface ClientIpOptions {
    trust?: TrustProxy;
}
/** The address a limiter should key on, or null when the request has none (no trusted header and
 *  no socket address). Callers that rate limit must still count a null request: the session
 *  routes in hono.ts put every address-less request into one shared bucket.
 *  'none' returns the socket address as is (a loopback peer too: behind a local proxy, set
 *  `trust`). 'proxy' returns the rightmost X-Forwarded-For hop, else the socket address.
 *  'cloudflare' returns cf-connecting-ip (trimmed, at most 64 chars, no comma), else as 'proxy'. */
declare function clientIp(get: (name: string) => string | null | undefined, remoteAddress?: string | null, opts?: ClientIpOptions): string | null;

interface CrossSiteOptions {
    /** Origins besides the request's own that may send writes, like 'https://start.nish.software'. */
    allowedOrigins?: Iterable<string>;
}
/** True when a POST, PUT, PATCH or DELETE (any method but GET, HEAD and OPTIONS) came from a page on
 *  another origin. Another *.nish.software subdomain counts: SameSite=Lax session cookies ride along
 *  from those, so the cookie alone does not stop them.
 *  - `Sec-Fetch-Site: same-origin` or `none` passes; `same-site` or `cross-site` passes only with an
 *    Origin in allowedOrigins.
 *  - No Sec-Fetch-Site (an older browser): an Origin must match the Host header or allowedOrigins.
 *  - Neither header: not a browser page (curl, a server, the inbox and MCP callers), so it passes. */
declare function isCrossSiteWrite(method: string, header: (name: string) => string | null | undefined, opts?: CrossSiteOptions): boolean;

/** How loud an event is: `info` is listed only, `normal` is pushed, `urgent` is pushed even in quiet hours. */
type InboxSeverity = 'info' | 'normal' | 'urgent';
/** Which list the Inbox page shows. */
type InboxView = 'open' | 'snoozed' | 'handled';
/** Flat extra data attached to an event. */
type InboxData = Record<string, string | number | boolean | null>;
/** A button on an inbox item. Tapping it makes the inbox service POST an {@link InboxActionCall} to `target`,
 *  server to server, and records the outcome on the item. */
interface InboxAction {
    /** Unique within the event, matching /^[a-z0-9][a-z0-9-]{0,31}$/, for example 'retry' or 'approve'. */
    id: string;
    /** Button text, trimmed, 1-40 characters. Longer text is cut to 39 plus an ellipsis. */
    label: string;
    /** Always 'POST'. May be left out when sending. */
    method: 'POST';
    /** Loopback only: `http://127.0.0.1:<port>/path`, with an explicit port, no credentials and no #hash. Up to 2000 characters. */
    target: string;
}
/** The outcome of the last action run on an item. */
interface InboxActionResult {
    /** Which action ran. */
    actionId: string;
    /** True when the target answered 2xx; the item is then handled by the user. */
    ok: boolean;
    /** The target's HTTP status, or null on a timeout or network error. */
    status: number | null;
    /** What went wrong, or null on success. */
    error: string | null;
    /** When it ran, ISO. */
    at: string;
}
/** The JSON body the inbox service POSTs to an action's target, with the header `X-Inbox-Action: 1`.
 *  Answer 2xx within {@link INBOX_ACTION_TIMEOUT_MS} for success; anything else is recorded as a failure. */
interface InboxActionCall {
    /** The inbox item's id. */
    itemId: number;
    /** Which action was tapped. */
    actionId: string;
    /** The item's source. */
    source: string;
    /** The item's kind. */
    kind: string;
    /** The item's dedupeKey, or null. */
    dedupeKey: string | null;
    /** The item's extra data, or null. */
    data: InboxData | null;
}
/** Header the inbox service sends on every action call, with the value '1'. */
declare const INBOX_ACTION_HEADER = "X-Inbox-Action";
/** How long the inbox service waits for an action's target before recording a timeout. */
declare const INBOX_ACTION_TIMEOUT_MS = 8000;
/** What a producer sends. `source` is filled in by the client. */
interface InboxEventInput {
    /** Which app sent it, matching /^[a-z0-9][a-z0-9-]{0,31}$/. */
    source: string;
    /** What happened, matching /^[a-z0-9][a-z0-9-]{0,47}$/, for example 'price-drop' or 'run-failed'. */
    kind: string;
    /** Headline, trimmed, 1-140 characters. Longer text is cut to 139 plus an ellipsis. */
    title: string;
    /** Details, trimmed, up to 2000 characters. Longer text is cut to 1999 plus an ellipsis; an empty string becomes undefined. */
    body?: string;
    /** Link opened when the notification or item is tapped. http: or https:, up to 2000 characters. */
    url?: string;
    /** Defaults to 'normal'. */
    severity?: InboxSeverity;
    /** Repeats with the same source and dedupeKey merge into the open item. 1-200 characters. */
    dedupeKey?: string;
    /** True marks the open item with this dedupeKey handled by the source. Needs dedupeKey. */
    resolve?: boolean;
    /** ISO 8601 time the event happened. Defaults to now; future times are clamped to now. */
    occurredAt?: string;
    /** Flat extra data, JSON-encoded at most 4096 bytes. */
    data?: InboxData;
    /** Up to 3 buttons shown on the item, ids unique. A repeat with the same dedupeKey replaces them. */
    actions?: Array<Omit<InboxAction, 'method'> & {
        method?: 'POST';
    }>;
}
/** A validated event (defaults applied). */
interface InboxEvent extends Required<Pick<InboxEventInput, 'source' | 'kind' | 'title' | 'severity' | 'occurredAt'>> {
    /** Details, or null when none. */
    body: string | null;
    /** Link, or null when none. */
    url: string | null;
    /** Merge key, or null when the event never merges. */
    dedupeKey: string | null;
    /** True when this event resolves the open item with the same dedupeKey. */
    resolve: boolean;
    /** Extra data, or null when none. */
    data: InboxData | null;
    /** Buttons, or null when none. */
    actions: InboxAction[] | null;
}
/** What the service did with an event. */
type InboxIngestAction = 'created' | 'updated' | 'resolved' | 'ignored';
/** What the service returns to the page. Times are ISO strings. */
interface InboxItem {
    /** Row id. */
    id: number;
    /** Which app sent it. */
    source: string;
    /** What happened. */
    kind: string;
    /** Headline. */
    title: string;
    /** Details, or null. */
    body: string | null;
    /** Link, or null. */
    url: string | null;
    /** Current severity (the highest seen while open). */
    severity: InboxSeverity;
    /** How many events merged into this item. */
    count: number;
    /** When the item was first created. */
    createdAt: string;
    /** When the item last changed. */
    updatedAt: string;
    /** When the latest event happened. */
    occurredAt: string;
    /** When the item was handled, or null while open. */
    handledAt: string | null;
    /** Who handled it, or null while open. */
    handledBy: 'user' | 'source' | 'expired' | null;
    /** When a snoozed item comes back, or null. */
    snoozedUntil: string | null;
    /** Extra data, or null. */
    data: InboxData | null;
    /** Buttons from the latest event. The service always sends this ([] when none); optional for older services. */
    actions?: InboxAction[];
    /** The last action run on this item, or null. */
    lastAction?: InboxActionResult | null;
}
/** Inbox settings, editable on the page. */
interface InboxSettings {
    /** IANA time zone used for quiet hours and the digest. */
    timezone: string;
    /** Normal pushes are held between start and end; urgent ones still go. Times are 'HH:MM' 24h. */
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    /** One summary push a day at `time` ('HH:MM' 24h). */
    digest: {
        enabled: boolean;
        time: string;
    };
    /** Sources that never push. */
    mutedSources: string[];
}
/** Settings used until they are changed on the Inbox page. */
declare const INBOX_DEFAULT_SETTINGS: InboxSettings;
/** Display names for known sources; unknown ids show as-is. */
declare const INBOX_SOURCE_LABELS: Record<string, string>;
/** One page of the item list plus counts for the tabs and source filter. */
interface InboxListResponse {
    /** Items in the requested view, newest first. */
    items: InboxItem[];
    /** Pass back to fetch the next page, or null at the end. */
    nextCursor: string | null;
    /** Item counts per view, and open items that are urgent. */
    counts: {
        open: number;
        snoozed: number;
        handled: number;
        urgent: number;
    };
    /** Every source with any item in the last 30 days, with its open count for the current view filter. */
    sources: Array<{
        id: string;
        open: number;
    }>;
}

interface Limiter {
    /** Counts one attempt for key and says whether it may go ahead: true for the first `max`
     *  attempts inside the current window, false after. Synchronous, so check it before any
     *  `await` and parallel requests cannot all pass. A new key when the limiter is full of locked
     *  keys gets false. */
    hit(key: string, now?: number): boolean;
    /** False once `max` failures happened inside the current window for key. */
    allowed(key: string, now?: number): boolean;
    /** Records a failure. A missing or expired entry restarts at 1 with reset = now + windowMs. */
    fail(key: string, now?: number): void;
    reset(key: string): void;
    readonly size: number;
}
declare function createLimiter(o?: {
    max?: number;
    windowMs?: number;
    cap?: number;
}): Limiter;

/** A service token as the settings page sees it: never the hash. */
interface ServiceTokenView {
    id: string;
    name: string;
    scopes: string[];
    created: string;
    source: 'file' | 'env';
    revoked: boolean;
    revokedAt?: string;
}

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
interface RevokedToken {
    sha256: string;
    id: string;
    at: string;
}
interface RevocationStore {
    load(): RevokedToken[];
    save(list: RevokedToken[]): void;
}
/** JSON file store: missing file = []; any other read error throws (fail closed); invalid JSON or
 *  shape = warn once, file renamed to `<file>.bad-<timestamp>`, [] (if that rename fails it throws);
 *  invalid records are kept and written back unchanged on save.
 *  save writes `<file>.tmp` then renames, creating the directory. File shape:
 *  { "version": 1, "revoked": RevokedToken[] }. */
declare function jsonRevocationStore(file: string): RevocationStore;
interface ManagedServiceTokens extends ServiceTokens {
    /** Every entry (file first, then env) with its revoked state. */
    views(): ServiceTokenView[];
    /** Revokes every current entry with this id. Returns false when no entry has it.
     *  Idempotent: an already revoked entry keeps its first `at`. */
    revoke(id: string): boolean;
}
declare function loadManagedServiceTokens(o: {
    file?: string;
    env?: string;
    revocations: RevocationStore | string;
    now?: () => Date;
}): ManagedServiceTokens;
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

declare const SESSION_DAYS = 30;
/** The shortest session secret accepted, in bytes. */
declare const MIN_SECRET_BYTES = 32;
/** Throws when the secret is empty or shorter than 32 bytes.
 *  `v1.<expires s>.<24 hex nonce>.<base64url hmac-sha256 of the first three parts>` */
declare function createSessionToken(secret: string, now?: number, days?: number): string;
interface VerifyOptions {
    now?: number;
    legacyHex?: boolean;
}
/** v1 as above. With legacyHex also job-apps' `v1.<exp>.<hex hmac>` (3 parts) and
 *  `v2.<exp>.<nonce>.<hex hmac>`; hex hmac is over every part but the last joined by '.'.
 *  False for: empty secret, missing token, wrong part count or prefix, non-finite or past expiry,
 *  signature length mismatch. Constant-time compare (timingSafeEqual on equal-length buffers). */
declare function verifySessionToken(secret: string, token: string | null | undefined, opts?: VerifyOptions): boolean;
/** sha256 both sides, timingSafeEqual. An exact match by default: no trimming, case matters.
 *  caseInsensitive: true trims and lowercases both sides first. Always false when expected is ''. */
declare function passwordMatches(expected: string, provided: string, opts?: {
    caseInsensitive?: boolean;
}): boolean;
/** Value of cookie `name` in a Cookie header, or undefined. Splits on ';', trims, first match wins,
 *  decodeURIComponent in try/catch (raw value on failure). */
declare function readCookie(header: string | null | undefined, name: string): string | undefined;
interface SessionAuth {
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
/** Throws at setup for a bad cookie name or, when `secret` is a string, one shorter than 32 bytes.
 *  A function secret is checked each time a token is issued. */
declare function createSessionAuth(o: {
    cookieName: string;
    secret: string | (() => string);
    days?: number;
    legacyHex?: boolean;
}): SessionAuth;

interface SpaOptions {
    dir: string;
    index?: string;
    immutable?: string[];
    maxAge?: number;
    notBuilt?: string;
    /** Sends `X-Frame-Options: SAMEORIGIN` unless false (for an app that is meant to be framed). */
    frameOptions?: false;
}
declare function createSpaHandler(o: SpaOptions): (req: Request) => Promise<Response>;

export { createLimiter as A, createServiceTokens as B, createSessionAuth as D, createSessionToken as E, createSpaHandler as F, hashServiceToken as G, isCrossSiteWrite as H, isDirectLoopback as J, isLoopback as K, jsonRevocationStore as N, loadManagedServiceTokens as O, loadServiceTokens as P, mintServiceToken as Q, passwordMatches as U, readCookie as W, verifySessionToken as X, INBOX_ACTION_HEADER as h, INBOX_ACTION_TIMEOUT_MS as i, INBOX_DEFAULT_SETTINGS as j, INBOX_SOURCE_LABELS as k, MIN_SECRET_BYTES as r, SESSION_DAYS as t, checkServiceRequest as y, clientIp as z };
export type { CrossSiteOptions as C, InboxActionCall as I, Limiter as L, ManagedServiceTokens as M, RevocationStore as R, SessionAuth as S, TrustProxy as T, VerifyOptions as V, InboxData as a, SpaOptions as b, InboxEventInput as c, InboxIngestAction as d, InboxEvent as e, InboxAction as f, ClientIpOptions as g, InboxActionResult as l, InboxItem as m, InboxListResponse as n, InboxSettings as o, InboxSeverity as p, InboxView as q, RevokedToken as s, ServiceTokenEntry as u, ServiceTokenView as v, ServiceTokens as w, VerifyResult as x };
