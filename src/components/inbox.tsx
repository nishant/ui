'use client';
import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref } from 'react';
import { cn } from '../cn';
import { ago, dateTime, time } from '../format';
import { INBOX_SOURCE_LABELS, type InboxActionResult, type InboxItem, type InboxSeverity, type InboxView } from '../inbox-types';
import { safeUrl } from '../url';
import { ChipGroup, Chip } from './forms';
import { StatusDot, type StatusTone } from './display';
import { EmptyState, ErrorState, SkeletonRows } from './feedback';
import { RelativeTime, useMediaQuery } from './hooks';
import { CheckIcon, ClockIcon, MoreIcon } from './icons';
import { ConfirmDialog, DropdownMenu, MenuItem, MenuLabel, MenuSeparator } from './overlay';
import { Button, Card, IconButton } from './primitives';
import { useNishStrings } from './provider';
import { Tabs, type TabItem } from './tabs';

/** Text the Inbox shows that has no key in `NishStrings`. Give any of them to `Inbox` as `labels`;
 *  each one wins over its English default. */
export interface InboxLabels {
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

export const DEFAULT_INBOX_LABELS: InboxLabels = {
  urgent: 'Urgent',
  normal: 'Normal',
  info: 'Info',
  snooze1h: '1 hour',
  snooze4h: '4 hours',
  snoozeTomorrow: 'Tomorrow 8 AM',
  snoozeMonday: 'Monday 8 AM',
  unsnooze: 'Unsnooze',
  moveBack: 'Move back',
  markAllHandled: 'Mark all handled',
  markAllTitle: (n) => `Mark ${n} ${n === 1 ? 'item' : 'items'} handled?`,
  all: 'All',
  loadMore: 'Load more',
  less: 'Less',
  until: (when) => `Until ${when}`,
  handledAgo: (when) => `Handled ${when}`,
  handledByApp: ' by the app',
  handledAutomatically: ' automatically',
  actionRan: (label, at) => `${label} ran ${at}`,
  actionFailed: (label, at, why) => `${label} failed ${at}${why ? ` · ${why}` : ''}`,
  emptyOpen: (src) => `Nothing open${src ? ` from ${src}` : ''}`,
  emptySnoozed: (src) => `Nothing snoozed${src ? ` from ${src}` : ''}`,
  emptyHandled: (src) => `Nothing handled${src ? ` from ${src}` : ''} in the last 30 days`,
};

export interface InboxProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> {
  ref?: Ref<HTMLElement>;
  /** The items of the current view, newest activity first. */
  items: InboxItem[];
  /** Which list is showing: open, snoozed or handled. */
  view: InboxView;
  /** Called when a tab is picked. */
  onViewChange: (view: InboxView) => void;
  /** Totals for the tabs. Open and snoozed show as counts on their tabs. */
  counts: { open: number; snoozed: number; handled: number };
  /** Sources for the filter chips, each with its open count. The filter row is hidden with one source or fewer. */
  sources: Array<{ id: string; open: number }>;
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

const DOT_TONE: Record<InboxSeverity, StatusTone> = {
  urgent: 'loss',
  normal: 'accent',
  info: 'neutral',
};

interface SnoozeOption {
  id: 'snooze1h' | 'snooze4h' | 'snoozeTomorrow' | 'snoozeMonday';
  until: (now: Date) => Date;
}

/** The next 08:00 local, `days` ahead of today. */
function at8(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(8, 0, 0, 0);
  return d;
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  { id: 'snooze1h', until: (now) => new Date(now.getTime() + 3_600_000) },
  { id: 'snooze4h', until: (now) => new Date(now.getTime() + 4 * 3_600_000) },
  { id: 'snoozeTomorrow', until: (now) => at8(now, 1) },
  // The next Monday; a week ahead when today is Monday.
  { id: 'snoozeMonday', until: (now) => at8(now, (8 - now.getDay()) % 7 || 7) },
];

/** Whether a body is long enough that three lines will probably clamp it. */
function looksClamped(body: string): boolean {
  return body.length > 100 || body.split('\n').length > 3;
}

interface RowProps {
  labels: InboxLabels;
  strings: ReturnType<typeof useNishStrings>;
  item: InboxItem;
  view: InboxView;
  label: string;
  wide: boolean;
  selected: boolean;
  expanded: boolean;
  domId: string;
  onToggle: (id: number) => void;
  onHandle: (id: number) => void;
  onUnhandle: (id: number) => void;
  onSnooze: (id: number, until: Date) => void;
  onUnsnooze: (id: number) => void;
  /** The running action's id on this item, or null. */
  running: string | null;
  onAction?: (itemId: number, actionId: string) => void;
}

/** "Retry ran 14:02" or "Retry failed 14:02 · HTTP 500". */
function lastActionText(result: InboxActionResult, item: InboxItem, labels: InboxLabels): string {
  const label = item.actions?.find((a) => a.id === result.actionId)?.label ?? result.actionId;
  const ms = Date.parse(result.at);
  const at = new Date(ms).toDateString() === new Date().toDateString() ? time(ms) : dateTime(ms);
  if (result.ok) return labels.actionRan(label, at);
  const why = result.error ?? (result.status != null ? `HTTP ${result.status}` : null);
  return labels.actionFailed(label, at, why);
}

function Row({ item, view, label, wide, selected, expanded, domId, onToggle, onHandle, onUnhandle, onSnooze, onUnsnooze, running, onAction, labels, strings }: RowProps) {
  const severity: InboxSeverity = item.severity in DOT_TONE ? item.severity : 'normal';
  const dot = { tone: DOT_TONE[severity], label: labels[severity] };
  const long = item.body != null && looksClamped(item.body);
  const href = item.url ? safeUrl(item.url) : null;
  const actions = onAction && view !== 'handled' ? (item.actions ?? []) : [];
  const last = item.lastAction ?? null;
  const snoozeItems = SNOOZE_OPTIONS.map((o) => (
    <MenuItem key={o.id} icon={wide ? undefined : <ClockIcon size={14} />} onSelect={() => onSnooze(item.id, o.until(new Date()))}>
      {labels[o.id]}
    </MenuItem>
  ));

  return (
    <li
      id={domId}
      data-selected={selected || undefined}
      className={cn('flex items-start gap-3 px-4 py-3', selected && 'bg-th-accent-soft forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]')}
    >
      <StatusDot tone={dot.tone} label={dot.label} className="mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className={cn('flex flex-wrap items-center gap-x-2 text-xs', selected ? 'text-th-hi2' : 'text-th-hi3')}>
          <span>{label}</span>
          <RelativeTime value={item.updatedAt} style="short" />
          {item.count > 1 ? (
            <span role="img" aria-label={strings.inboxHappened(item.count)} className="tabular-nums">
              ×{item.count}
            </span>
          ) : null}
        </div>
        <p className="m-0 line-clamp-2 break-words text-sm font-medium text-th-hi">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="break-words hover:underline">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </p>
        {item.body ? (
          <>
            <p className={cn('m-0 mt-0.5 whitespace-pre-line break-words text-sm text-th-hi2', !expanded && 'line-clamp-3')}>{item.body}</p>
            {long ? (
              <Button variant="link" size="sm" className="pointer-coarse:-mx-2 pointer-coarse:min-h-11 pointer-coarse:px-2" aria-expanded={expanded} onClick={() => onToggle(item.id)}>
                {expanded ? labels.less : strings.more}
              </Button>
            ) : null}
          </>
        ) : null}
        {actions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button
                key={a.id}
                size="sm"
                variant="secondary"
                loading={running === a.id}
                disabled={running !== null && running !== a.id}
                onClick={() => onAction?.(item.id, a.id)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
        {last && (actions.length > 0 || view === 'handled') ? (
          <p className={cn('m-0 mt-1 text-xs', last.ok ? 'text-th-hi3' : 'text-th-loss')}>{lastActionText(last, item, labels)}</p>
        ) : null}
        {view === 'snoozed' && item.snoozedUntil ? <p className="m-0 mt-0.5 text-xs text-th-hi3">{labels.until(dateTime(item.snoozedUntil))}</p> : null}
        {view === 'handled' && item.handledAt ? (
          <p className="m-0 mt-0.5 text-xs text-th-hi3">
            {labels.handledAgo(ago(item.handledAt))}
            {item.handledBy === 'source' ? labels.handledByApp : item.handledBy === 'expired' ? labels.handledAutomatically : ''}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {view === 'open' && wide ? (
          <>
            <IconButton label={strings.inboxMarkHandled} onClick={() => onHandle(item.id)}>
              <CheckIcon size={18} />
            </IconButton>
            <DropdownMenu align="end" trigger={<IconButton label={strings.inboxSnooze}><ClockIcon size={18} /></IconButton>}>
              {snoozeItems}
            </DropdownMenu>
          </>
        ) : null}
        {view === 'open' && !wide ? (
          <DropdownMenu align="end" sheetBelow="sm" sheetTitle={strings.inboxActions} trigger={<IconButton label={strings.inboxActions}><MoreIcon size={18} /></IconButton>}>
            <MenuItem icon={<CheckIcon size={14} />} onSelect={() => onHandle(item.id)}>
              {strings.inboxMarkHandled}
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>{strings.inboxSnooze}</MenuLabel>
            {snoozeItems}
          </DropdownMenu>
        ) : null}
        {view === 'snoozed' ? (
          <Button size="sm" onClick={() => onUnsnooze(item.id)}>
            {labels.unsnooze}
          </Button>
        ) : null}
        {view === 'handled' ? (
          <Button size="sm" onClick={() => onUnhandle(item.id)}>
            {labels.moveBack}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/** One inbox for events from every app: Open, Snoozed and Handled views, a source filter, and per-item
 *  handle, snooze and undo actions. The page owns the data and the calls; this component only renders
 *  and reports what was picked. Rows wrap at phone widths and the actions collapse into one menu under 480px. */
export function Inbox({
  items,
  view,
  onViewChange,
  counts,
  sources,
  source,
  onSourceChange,
  onHandle,
  onUnhandle,
  onSnooze,
  onUnsnooze,
  onHandleAll,
  onAction,
  loading = false,
  error = null,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  selectedId = null,
  sourceLabels = INBOX_SOURCE_LABELS,
  labels: labelOverrides,
  className,
  ref,
  ...rest
}: InboxProps) {
  const strings = useNishStrings();
  const labels: InboxLabels = { ...DEFAULT_INBOX_LABELS, ...labelOverrides };
  const idBase = useId().replace(/:/g, '');
  const wide = useMediaQuery('(min-width: 480px)');
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set());
  const [confirmAll, setConfirmAll] = useState(false);
  // Running action per item id. Only one action per item runs at a time.
  const [running, setRunning] = useState<ReadonlyMap<number, string>>(() => new Map());
  const scrolled = useRef<number | null>(null);

  const labelOf = (id: string) => sourceLabels[id] ?? id;
  const rowId = (id: number) => `${idBase}-item-${id}`;

  // The one effect: bring the linked item into view, once per selection.
  useEffect(() => {
    if (selectedId == null || scrolled.current === selectedId) return;
    const el = document.getElementById(rowId(selectedId));
    if (!el) return;
    scrolled.current = selectedId;
    el.scrollIntoView({ block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, items]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runAction = (itemId: number, actionId: string) => {
    if (!onAction || running.has(itemId)) return;
    setRunning((prev) => new Map(prev).set(itemId, actionId));
    const done = () =>
      setRunning((prev) => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    Promise.resolve()
      .then(() => onAction(itemId, actionId))
      .catch(() => undefined)
      .finally(done);
  };

  const tabs: TabItem[] = [
    { value: 'open', label: strings.inboxOpen, count: counts.open },
    { value: 'snoozed', label: strings.inboxSnoozed, count: counts.snoozed },
    { value: 'handled', label: strings.inboxHandled },
  ];

  const handleAllCount = source ? (sources.find((s) => s.id === source)?.open ?? items.length) : counts.open;
  const showHandleAll = view === 'open' && !!onHandleAll && items.length > 0 && !loading && !error;

  let body;
  if (loading) {
    body = <SkeletonRows rows={4} height={64} label={strings.loading} className="p-4" />;
  } else if (error) {
    body = <ErrorState message={error} onRetry={onRetry} retryLabel={strings.retry} compact className="py-8" />;
  } else if (items.length === 0) {
    const from = source ? labelOf(source) : null;
    const title = view === 'open' ? labels.emptyOpen(from) : view === 'snoozed' ? labels.emptySnoozed(from) : labels.emptyHandled(from);
    body = <EmptyState title={title} compact className="py-10" />;
  } else {
    body = (
      <ul className="m-0 list-none divide-y divide-th-line p-0">
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            view={view}
            label={labelOf(item.source)}
            wide={wide}
            labels={labels}
            strings={strings}
            selected={item.id === selectedId}
            expanded={expanded.has(item.id)}
            domId={rowId(item.id)}
            onToggle={toggle}
            onHandle={onHandle}
            onUnhandle={onUnhandle}
            onSnooze={onSnooze}
            onUnsnooze={onUnsnooze}
            running={running.get(item.id) ?? null}
            onAction={onAction ? runAction : undefined}
          />
        ))}
      </ul>
    );
  }

  return (
    <Card {...rest} ref={ref} padding="none" className={cn('min-w-0 overflow-hidden', className)}>
      <Tabs label={strings.inboxViews} value={view} onValueChange={(v) => onViewChange(v as InboxView)} items={tabs} className="px-4" />
      {sources.length > 1 ? (
        <div className="min-w-0 border-b border-th-line py-2">
          <ChipGroup label={strings.inboxFilterBySource} scroll className="px-4">
            <Chip size="sm" pressed={source === null} onClick={() => onSourceChange(null)}>
              {labels.all}
            </Chip>
            {sources.map((s) => (
              <Chip
                key={s.id}
                size="sm"
                pressed={source === s.id}
                onClick={() => onSourceChange(s.id)}
                trailing={<span className="tabular-nums text-th-hi3">{s.open}</span>}
                className="shrink-0"
              >
                {labelOf(s.id)}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      ) : null}
      {showHandleAll ? (
        <div className="flex justify-end px-4 pt-2">
          <Button size="sm" variant="ghost" onClick={() => setConfirmAll(true)}>
            {labels.markAllHandled}
          </Button>
        </div>
      ) : null}
      {body}
      {hasMore && !loading && !error ? (
        <div className="flex justify-center border-t border-th-line p-2">
          <Button variant="ghost" loading={loadingMore} onClick={onLoadMore}>
            {labels.loadMore}
          </Button>
        </div>
      ) : null}
      {confirmAll ? (
        <ConfirmDialog
          title={labels.markAllTitle(handleAllCount)}
          confirmLabel={strings.inboxMarkHandled}
          cancelLabel={strings.cancel}
          tone="primary"
          onCancel={() => setConfirmAll(false)}
          onConfirm={() => {
            setConfirmAll(false);
            onHandleAll?.();
          }}
        />
      ) : null}
    </Card>
  );
}
