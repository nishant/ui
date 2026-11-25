import * as react from 'react';
import { ComponentPropsWithoutRef, Ref } from 'react';

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

/** Text the Inbox shows that has no key in `NishStrings`. Give any of them to `Inbox` as `labels`;
 *  each one wins over its English default. */
interface InboxLabels {
    /** Names of the severity dots. */
    urgent: string;
    normal: string;
    info: string;
    /** Snooze menu entries. */
    snooze1h: string;
    snooze4h: string;
    snoozeTomorrow: string;
    snoozeMonday: string;
    /** Button of a snoozed item. */
    unsnooze: string;
    /** Button of a handled item. */
    moveBack: string;
    /** "Mark all handled" button, and the confirm dialog's title. */
    markAllHandled: string;
    markAllTitle: (count: number) => string;
    /** The "All" chip of the source filter. */
    all: string;
    loadMore: string;
    /** Collapses a long body. The expand button is the `more` string. */
    less: string;
    /** "Until 14:00" under a snoozed item. */
    until: (when: string) => string;
    /** "Handled 2 hours ago" under a handled item, then optionally the suffix for who handled it. */
    handledAgo: (when: string) => string;
    handledByApp: string;
    handledAutomatically: string;
    /** "Retry ran 14:02" and "Retry failed 14:02 · HTTP 500". `why` is null when nothing is known. */
    actionRan: (label: string, at: string) => string;
    actionFailed: (label: string, at: string, why: string | null) => string;
    /** The empty list of each view; `source` is the name of the filtered source, or null. */
    emptyOpen: (source: string | null) => string;
    emptySnoozed: (source: string | null) => string;
    emptyHandled: (source: string | null) => string;
}
declare const DEFAULT_INBOX_LABELS: InboxLabels;

interface InboxProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> {
    ref?: Ref<HTMLElement>;
    /** The items of the current view, newest activity first. */
    items: InboxItem[];
    /** Which list is showing: open, snoozed or handled. */
    view: InboxView;
    /** Called when a tab is picked. */
    onViewChange: (view: InboxView) => void;
    /** Totals for the tabs. Open and snoozed show as counts on their tabs. */
    counts: {
        open: number;
        snoozed: number;
        handled: number;
    };
    /** Sources for the filter chips, each with its open count. The filter row is hidden with one source or fewer. */
    sources: Array<{
        id: string;
        open: number;
    }>;
    /** The source the list is filtered to, or null for all. */
    source: string | null;
    /** Called when a source chip is picked; null means "All". */
    onSourceChange: (source: string | null) => void;
    /** Marks an item handled. */
    onHandle: (id: number) => void;
    /** Moves a handled item back to open. */
    onUnhandle: (id: number) => void;
    /** Snoozes an item until the given time. */
    onSnooze: (id: number, until: Date) => void;
    /** Brings a snoozed item back now. */
    onUnsnooze: (id: number) => void;
    /** Runs one of an item's actions (the inbox service's POST /api/items/:id/actions/:actionId). When given,
     *  each item's actions show as buttons in the open and snoozed views. While the promise is pending that
     *  button shows a spinner and the item's other actions are disabled. A rejection is ignored here; toast it. */
    onAction?: (itemId: number, actionId: string) => Promise<void>;
    /** Shows "Mark all handled" in the open view when given and there are items. A confirmation comes first. */
    onHandleAll?: () => void;
    /** First load: shows skeleton rows in place of the list. */
    loading?: boolean;
    /** A failed load: shows an ErrorState with this text as the body. */
    error?: string | null;
    /** Shows a Retry button on the error state. */
    onRetry?: () => void;
    /** More items exist after the last one: shows "Load more". */
    hasMore?: boolean;
    /** Called by "Load more". */
    onLoadMore?: () => void;
    /** "Load more" shows a spinner and is disabled while the next page loads. */
    loadingMore?: boolean;
    /** The item to highlight and scroll into view once (a link from a notification). */
    selectedId?: number | null;
    /** Display names per source id. Default INBOX_SOURCE_LABELS; unknown ids show as they are. */
    sourceLabels?: Record<string, string>;
    /** Text that has no key in the provider's strings (snooze options, messages). Each wins over its English default. */
    labels?: Partial<InboxLabels>;
    /** Classes for the card. */
    className?: string;
}
/** One inbox for events from every app: Open, Snoozed and Handled views, a source filter, and per-item
 *  handle, snooze and undo actions. The page owns the data and the calls; this component only renders
 *  and reports what was picked. Rows wrap at phone widths and the actions collapse into one menu under 480px. */
declare function Inbox({ items, view, onViewChange, counts, sources, source, onSourceChange, onHandle, onUnhandle, onSnooze, onUnsnooze, onHandleAll, onAction, loading, error, onRetry, hasMore, onLoadMore, loadingMore, selectedId, sourceLabels, labels: labelOverrides, className, ref, ...rest }: InboxProps): react.JSX.Element;

export { DEFAULT_INBOX_LABELS, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS, INBOX_DEFAULT_SETTINGS, INBOX_SOURCE_LABELS, Inbox };
export type { InboxAction, InboxActionCall, InboxActionResult, InboxItem, InboxLabels, InboxListResponse, InboxProps, InboxSettings, InboxSeverity, InboxView };
