import { I as InboxEventInput, a as InboxIngestAction, b as InboxEvent } from './types-DfjiFlv2.js';
export { c as INBOX_ACTION_HEADER, d as INBOX_ACTION_TIMEOUT_MS, e as INBOX_DEFAULT_SETTINGS, f as INBOX_SOURCE_LABELS, g as InboxAction, h as InboxActionCall, i as InboxActionResult, j as InboxData, k as InboxItem, l as InboxListResponse, m as InboxSettings, n as InboxSeverity, o as InboxView } from './types-DfjiFlv2.js';

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

export { InboxEvent, InboxEventInput, InboxIngestAction, createInboxClient, isInboxActionTarget, parseInboxEvent };
export type { InboxClient, InboxClientOptions, InboxSendResult };
