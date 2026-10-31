// Moved from src/inbox-types.ts: now part of @nish/ui/server (src/server/inbox/types.ts).
// Shared inbox event types and defaults. No React and no runtime dependencies, so servers,
// workers and browsers can all import them (re-exported by @nish/ui/inbox-client).

/** How loud an event is: `info` is listed only, `normal` is pushed, `urgent` is pushed even in quiet hours. */
export type InboxSeverity = 'info' | 'normal' | 'urgent';
/** Which list the Inbox page shows. */
export type InboxView = 'open' | 'snoozed' | 'handled';
/** Flat extra data attached to an event. */
export type InboxData = Record<string, string | number | boolean | null>;

/** A button on an inbox item. Tapping it makes the inbox service POST an {@link InboxActionCall} to `target`,
 *  server to server, and records the outcome on the item. */
export interface InboxAction {
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
export interface InboxActionResult {
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
export interface InboxActionCall {
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
export const INBOX_ACTION_HEADER = 'X-Inbox-Action';
/** How long the inbox service waits for an action's target before recording a timeout. */
export const INBOX_ACTION_TIMEOUT_MS = 8000;

/** What a producer sends. `source` is filled in by the client. */
export interface InboxEventInput {
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
  actions?: Array<Omit<InboxAction, 'method'> & { method?: 'POST' }>;
}

/** A validated event (defaults applied). */
export interface InboxEvent extends Required<Pick<InboxEventInput, 'source' | 'kind' | 'title' | 'severity' | 'occurredAt'>> {
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
export type InboxIngestAction = 'created' | 'updated' | 'resolved' | 'ignored';

/** What the service returns to the page. Times are ISO strings. */
export interface InboxItem {
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
export interface InboxSettings {
  /** IANA time zone used for quiet hours and the digest. */
  timezone: string;
  /** Normal pushes are held between start and end; urgent ones still go. Times are 'HH:MM' 24h. */
  quietHours: { enabled: boolean; start: string; end: string };
  /** One summary push a day at `time` ('HH:MM' 24h). */
  digest: { enabled: boolean; time: string };
  /** Sources that never push. */
  mutedSources: string[];
}

/** Settings used until they are changed on the Inbox page. */
export const INBOX_DEFAULT_SETTINGS: InboxSettings = {
  timezone: 'America/Chicago',
  quietHours: { enabled: true, start: '22:00', end: '07:00' },
  digest: { enabled: true, time: '08:00' },
  mutedSources: [],
};

/** Display names for known sources; unknown ids show as-is. */
export const INBOX_SOURCE_LABELS: Record<string, string> = {
  trading: 'Trading', trackers: 'Trackers', 'job-apps': 'Jobs', status: 'Status', ci: 'CI', 'mc-packs': 'Packs',
};

/** One page of the item list plus counts for the tabs and source filter. */
export interface InboxListResponse {
  /** Items in the requested view, newest first. */
  items: InboxItem[];
  /** Pass back to fetch the next page, or null at the end. */
  nextCursor: string | null;
  /** Item counts per view, and open items that are urgent. */
  counts: { open: number; snoozed: number; handled: number; urgent: number };
  /** Every source with any item in the last 30 days, with its open count for the current view filter. */
  sources: Array<{ id: string; open: number }>;
}
