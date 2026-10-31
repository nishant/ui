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

export { INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS, INBOX_DEFAULT_SETTINGS, INBOX_SOURCE_LABELS, createInboxClient, isInboxActionTarget, parseInboxEvent };
export type { InboxAction, InboxActionCall, InboxActionResult, InboxClient, InboxClientOptions, InboxData, InboxEvent, InboxEventInput, InboxIngestAction, InboxItem, InboxListResponse, InboxSendResult, InboxSettings, InboxSeverity, InboxView };
