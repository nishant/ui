/** How loud an event is: `info` is listed only, `normal` is pushed, `urgent` is pushed even in quiet hours. */
type InboxSeverity = 'info' | 'normal' | 'urgent';
/** Which list the Inbox page shows. */
type InboxView = 'open' | 'snoozed' | 'handled';
/** Flat extra data attached to an event. */
type InboxData = Record<string, string | number | boolean | null>;
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

export { INBOX_DEFAULT_SETTINGS as c, INBOX_SOURCE_LABELS as d };
export type { InboxEventInput as I, InboxIngestAction as a, InboxEvent as b, InboxData as e, InboxItem as f, InboxListResponse as g, InboxSettings as h, InboxSeverity as i, InboxView as j };
