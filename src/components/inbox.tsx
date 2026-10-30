import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../cn';
import { ago, dateTime, time } from '../format';
import { INBOX_SOURCE_LABELS, type InboxActionResult, type InboxItem, type InboxSeverity, type InboxView } from '../inbox-types';
import { ChipGroup, Chip } from './forms';
import { StatusDot, type StatusTone } from './display';
import { EmptyState, ErrorState, SkeletonRows } from './feedback';
import { RelativeTime, useMediaQuery } from './hooks';
import { CheckIcon, ClockIcon, MoreIcon } from './icons';
import { ConfirmDialog, DropdownMenu, MenuItem, MenuLabel, MenuSeparator } from './overlay';
import { Button, Card, IconButton } from './primitives';
import { Tabs, type TabItem } from './tabs';

export interface InboxProps {
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
  /** Classes for the card. */
  className?: string;
}

const DOT: Record<InboxSeverity, { tone: StatusTone; label: string }> = {
  urgent: { tone: 'loss', label: 'Urgent' },
  normal: { tone: 'accent', label: 'Normal' },
  info: { tone: 'neutral', label: 'Info' },
};

interface SnoozeOption {
  label: string;
  until: (now: Date) => Date;
}

/** The next 08:00 local, `days` ahead of today. */
function at8(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(8, 0, 0, 0);
  return d;
}

const SNOOZE_OPTIONS: SnoozeOption[] = [
  { label: '1 hour', until: (now) => new Date(now.getTime() + 3_600_000) },
  { label: '4 hours', until: (now) => new Date(now.getTime() + 4 * 3_600_000) },
  { label: 'Tomorrow 8 AM', until: (now) => at8(now, 1) },
  // The next Monday; a week ahead when today is Monday.
  { label: 'Monday 8 AM', until: (now) => at8(now, (8 - now.getDay()) % 7 || 7) },
];

/** Whether a body is long enough that three lines will probably clamp it. */
function looksClamped(body: string): boolean {
  return body.length > 100 || body.split('\n').length > 3;
}

/** The url when it is http or https, otherwise null, so a stored `javascript:` url never becomes a link. */
function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

const FALLBACK_COUNT = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface RowProps {
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
function lastActionText(result: InboxActionResult, item: InboxItem): string {
  const label = item.actions?.find((a) => a.id === result.actionId)?.label ?? result.actionId;
  const ms = Date.parse(result.at);
  const at = new Date(ms).toDateString() === new Date().toDateString() ? time(ms) : dateTime(ms);
  if (result.ok) return `${label} ran ${at}`;
  const why = result.error ?? (result.status != null ? `HTTP ${result.status}` : null);
  return `${label} failed ${at}${why ? ` · ${why}` : ''}`;
}

function Row({ item, view, label, wide, selected, expanded, domId, onToggle, onHandle, onUnhandle, onSnooze, onUnsnooze, running, onAction }: RowProps) {
  const dot = DOT[item.severity] ?? DOT.normal;
  const long = item.body != null && looksClamped(item.body);
  const href = item.url ? safeHref(item.url) : null;
  const actions = onAction && view !== 'handled' ? (item.actions ?? []) : [];
  const last = item.lastAction ?? null;
  const snoozeItems = SNOOZE_OPTIONS.map((o) => (
    <MenuItem key={o.label} icon={wide ? undefined : <ClockIcon size={14} />} onSelect={() => onSnooze(item.id, o.until(new Date()))}>
      {o.label}
    </MenuItem>
  ));

  return (
    <li id={domId} className={cn('flex items-start gap-3 px-4 py-3', selected && 'bg-th-accent-soft')}>
      <StatusDot tone={dot.tone} label={dot.label} className="mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className={cn('flex flex-wrap items-center gap-x-2 text-xs', selected ? 'text-th-hi2' : 'text-th-hi3')}>
          <span>{label}</span>
          <RelativeTime value={item.updatedAt} style="short" />
          {item.count > 1 ? (
            <span role="img" aria-label={`Happened ${item.count} times`} className="tabular-nums">
              ×{item.count}
            </span>
          ) : null}
        </div>
        <p className="m-0 line-clamp-2 break-words text-sm font-medium text-th-hi">
          {href ? (
            <a href={href}target="_blank" rel="noopener noreferrer" className="break-words hover:underline">
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
                {expanded ? 'Less' : 'More'}
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
          <p className={cn('m-0 mt-1 text-xs', last.ok ? 'text-th-hi3' : 'text-th-loss')}>{lastActionText(last, item)}</p>
        ) : null}
        {view === 'snoozed' && item.snoozedUntil ? <p className="m-0 mt-0.5 text-xs text-th-hi3">Until {dateTime(item.snoozedUntil)}</p> : null}
        {view === 'handled' && item.handledAt ? (
          <p className="m-0 mt-0.5 text-xs text-th-hi3">
            Handled {ago(item.handledAt)}
            {item.handledBy === 'source' ? ' by the app' : item.handledBy === 'expired' ? ' automatically' : ''}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {view === 'open' && wide ? (
          <>
            <IconButton label="Mark handled" onClick={() => onHandle(item.id)}>
              <CheckIcon size={18} />
            </IconButton>
            <DropdownMenu align="end" trigger={<IconButton label="Snooze"><ClockIcon size={18} /></IconButton>}>
              {snoozeItems}
            </DropdownMenu>
          </>
        ) : null}
        {view === 'open' && !wide ? (
          <DropdownMenu align="end" sheetBelow="sm" sheetTitle="Actions" trigger={<IconButton label="Actions"><MoreIcon size={18} /></IconButton>}>
            <MenuItem icon={<CheckIcon size={14} />} onSelect={() => onHandle(item.id)}>
              Mark handled
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Snooze</MenuLabel>
            {snoozeItems}
          </DropdownMenu>
        ) : null}
        {view === 'snoozed' ? (
          <Button size="sm" onClick={() => onUnsnooze(item.id)}>
            Unsnooze
          </Button>
        ) : null}
        {view === 'handled' ? (
          <Button size="sm" onClick={() => onUnhandle(item.id)}>
            Move back
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
  className,
}: InboxProps) {
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
    { value: 'open', label: 'Open', count: counts.open },
    { value: 'snoozed', label: 'Snoozed', count: counts.snoozed },
    { value: 'handled', label: 'Handled' },
  ];

  const handleAllCount = source ? (sources.find((s) => s.id === source)?.open ?? items.length) : counts.open;
  const showHandleAll = view === 'open' && !!onHandleAll && items.length > 0 && !loading && !error;

  let body;
  if (loading) {
    body = <SkeletonRows rows={4} height={64} className="p-4" />;
  } else if (error) {
    body = <ErrorState message={error} onRetry={onRetry} compact className="py-8" />;
  } else if (items.length === 0) {
    const from = source ? ` from ${labelOf(source)}` : '';
    const title = view === 'open' ? `Nothing open${from}` : view === 'snoozed' ? `Nothing snoozed${from}` : `Nothing handled${from} in the last 30 days`;
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
    <Card padding="none" className={cn('min-w-0 overflow-hidden', className)}>
      <Tabs label="Inbox views" value={view} onChange={(v) => onViewChange(v as InboxView)} items={tabs} className="px-4" />
      {sources.length > 1 ? (
        <div className="min-w-0 border-b border-th-line py-2">
          <ChipGroup label="Filter by source" scroll className="px-4">
            <Chip size="sm" pressed={source === null} onClick={() => onSourceChange(null)}>
              All
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
            Mark all handled
          </Button>
        </div>
      ) : null}
      {body}
      {hasMore && !loading && !error ? (
        <div className="flex justify-center border-t border-th-line p-2">
          <Button variant="ghost" loading={loadingMore} onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      ) : null}
      {confirmAll ? (
        <ConfirmDialog
          title={`Mark ${FALLBACK_COUNT(handleAllCount, 'item', 'items')} handled?`}
          confirmLabel="Mark handled"
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
