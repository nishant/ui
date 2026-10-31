import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../cn';
import { useMediaQuery } from './hooks';
import { StatusDot, type StatusTone } from './display';
import { CardListSkeleton, EmptyState, ErrorState, SkeletonRows } from './feedback';
import { Table, TableWrap, Td, Th, Tr } from './table';
import { cardClass, IconButton, Select } from './primitives';

// Data display: a table that becomes cards on phones, list rows, link cards, favicons and
// the loading/error/empty wrapper. Inline icons keep icons.tsx untouched.

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Glyph({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

const ChevronRight = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m9 18 6-6-6-6" />
  </Glyph>
);
const ExternalGlyph = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Glyph>
);
const ArrowUp = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m5 12 7-7 7 7M12 19V5" />
  </Glyph>
);
const ArrowDown = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Glyph>
);

/** Starts a click on a row only when it did not land on something interactive inside it. */
function fromInteractive(e: { target: EventTarget; currentTarget: Element }): boolean {
  const el = (e.target as Element | null)?.closest?.('a,button,input,select,textarea,label,summary,[role="button"],[role="link"]');
  return !!el && el !== e.currentTarget && e.currentTarget.contains(el);
}

// =====================================================================================
// ResponsiveTable
// =====================================================================================

/** One column of a ResponsiveTable. */
export interface Column<T> {
  /** Stable id; also the key of the sort. */
  key: string;
  /** The header text (also the label in cards and in the sort menu). */
  header: string;
  /** Renders the cell for a row. */
  cell: (row: T) => ReactNode;
  /** Makes the column sortable: the comparable value of a row. null sorts last. */
  sortValue?: (row: T) => string | number | null;
  /** A number column: right-aligned, tabular, no wrapping. */
  numeric?: boolean;
  /** In cards, this column is the title. */
  primary?: boolean;
  /** In cards, this column is the subtitle under the title. */
  secondary?: boolean;
  /** Hides the column in the table below this breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** A CSS width for the header cell, e.g. '8rem'. */
  width?: string;
}

/** The sort of a ResponsiveTable: a column key and a direction, or null for none. */
export type Sort = { key: string; dir: 'asc' | 'desc' } | null;

type CardsBelow = 'sm' | 'md' | 'lg';

const TABLE_SHOW: Record<CardsBelow, string> = { sm: 'hidden sm:block', md: 'hidden md:block', lg: 'hidden lg:block' };
const BP_PX: Record<CardsBelow, number> = { sm: 640, md: 768, lg: 1024 };
const CARDS_SHOW: Record<CardsBelow, string> = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' };
const HIDE_BELOW: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};
const TONE_EDGE = {
  ok: 'border-l-[3px] border-l-[var(--nish-ok-fill)]',
  warn: 'border-l-[3px] border-l-[var(--nish-warn-fill)]',
  loss: 'border-l-[3px] border-l-[var(--nish-loss-fill)]',
} as const;

export interface ResponsiveTableProps<T> {
  /** The data. */
  rows: T[];
  /** The columns, in table order. */
  columns: Column<T>[];
  /** A stable key for a row. */
  rowKey: (row: T) => string;
  /** Below this breakpoint the rows become cards. Default 'md'. */
  cardsBelow?: CardsBelow;
  /** Called when a row (or card) is activated by click, Enter or Space. */
  onRowClick?: (row: T) => void;
  /** Makes each row a link to this URL (cards become real anchors). */
  rowHref?: (row: T) => string;
  /** Called with the URL when a row is activated by click or key, so a router can navigate
   *  without a page reload. Without it the table assigns `location`. Card links stay real
   *  anchors. */
  onNavigate?: (href: string) => void;
  /** A 3px left edge on a row: ok, warn or loss. Say the status in a cell too. */
  rowTone?: (row: T) => 'ok' | 'warn' | 'loss' | undefined;
  /** The current sort, when you control it. */
  sort?: Sort;
  /** Called with the next sort. With sort or onSortChange given you sort the rows
   *  yourself; without them the table sorts by each column's sortValue. */
  onSortChange?: (sort: Sort) => void;
  /** The table's minimum width before it scrolls sideways. Default 640. */
  minWidth?: number | string;
  /** Keeps the header visible while the body scrolls (give maxHeight too). */
  stickyHeader?: boolean;
  /** Caps the table's height; the body scrolls inside. */
  maxHeight?: number | string;
  /** Pins the first column while the table scrolls sideways. */
  stickyFirstColumn?: boolean;
  /** Shows skeleton rows (table) or skeleton cards instead of the data. */
  loading?: boolean;
  /** Shown when there are no rows. Default: "Nothing here yet". */
  empty?: ReactNode;
  /** Shows an ErrorState instead of the data. */
  error?: { message: string; onRetry?: () => void } | null;
  /** The accessible name of the table and the card list. */
  label: string;
  /** Renders a whole card yourself (inside the card's button or link). */
  renderCard?: (row: T) => ReactNode;
  className?: string;
}

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * A table on wide screens and a list of cards on phones, from one column definition.
 * Sortable headers (and a sort menu in card mode), clickable or linked rows, a status
 * edge per row, loading, empty and error states built in.
 */
export function ResponsiveTable<T>({
  rows,
  columns,
  rowKey,
  cardsBelow = 'md',
  onRowClick,
  rowHref,
  onNavigate,
  rowTone,
  sort,
  onSortChange,
  minWidth = 640,
  stickyHeader,
  maxHeight,
  stickyFirstColumn,
  loading = false,
  empty,
  error,
  label,
  renderCard,
  className,
}: ResponsiveTableProps<T>) {
  const [innerSort, setInnerSort] = useState<Sort>(null);
  const sortId = useId();
  const wide = useMediaQuery(`(min-width: ${BP_PX[cardsBelow]}px)`);
  const external = sort !== undefined || onSortChange !== undefined;
  const current: Sort = sort !== undefined ? sort : innerSort;

  const changeSort = (next: Sort) => {
    setInnerSort(next);
    onSortChange?.(next);
  };

  const sorted = useMemo(() => {
    if (external || !current) return rows;
    const col = columns.find((c) => c.key === current.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const sign = current.dir === 'asc' ? 1 : -1;
    // Nulls stay last in both directions, so only real values flip.
    return [...rows].sort((x, y) => {
      const a = get(x);
      const b = get(y);
      if (a === null || b === null) return compareValues(a, b);
      return sign * compareValues(a, b);
    });
  }, [rows, columns, current, external]);

  const sortable = columns.filter((c) => c.sortValue);
  const toggle = (key: string) => changeSort(current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  const interactive = !!(onRowClick || rowHref);

  const activate = (row: T) => {
    onRowClick?.(row);
  };
  const go = (row: T, e: MouseEvent | KeyboardEvent) => {
    if (!rowHref) return activate(row);
    const href = rowHref(row);
    if (e.metaKey || e.ctrlKey || e.shiftKey || ('button' in e && e.button === 1)) window.open(href, '_blank', 'noopener');
    else if (onNavigate) onNavigate(href);
    else window.location.assign(href);
  };

  if (error) return <ErrorState message={error.message} onRetry={error.onRetry} className={className} />;

  const emptyNode = empty ?? <EmptyState title="Nothing here yet" />;
  const hasRows = sorted.length > 0;

  const table = loading ? (
    <SkeletonRows rows={5} height={44} label={`Loading ${label}`} />
  ) : !hasRows ? (
    emptyNode
  ) : (
    <TableWrap minWidth={minWidth} stickyHeader={stickyHeader} maxHeight={maxHeight} stickyFirstColumn={stickyFirstColumn}>
      <Table aria-label={label}>
        <thead>
          <tr>
            {columns.map((c) => (
              <Th
                key={c.key}
                numeric={c.numeric}
                sort={c.sortValue ? (current?.key === c.key ? current.dir : false) : undefined}
                onSort={c.sortValue ? () => toggle(c.key) : undefined}
                className={cn(c.hideBelow && HIDE_BELOW[c.hideBelow])}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <Tr
              key={rowKey(row)}
              tone={rowTone?.(row)}
              interactive={interactive}
              tabIndex={interactive ? 0 : undefined}
              onClick={
                interactive
                  ? (e) => {
                      if (!fromInteractive(e)) go(row, e);
                    }
                  : undefined
              }
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        go(row, e);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((c) => (
                <Td key={c.key} numeric={c.numeric} className={cn(c.hideBelow && HIDE_BELOW[c.hideBelow])}>
                  {c.cell(row)}
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.find((c) => c.secondary && c !== primary);
  const rest = columns.filter((c) => c !== primary && c !== secondary);

  const cardBody = (row: T) =>
    renderCard ? (
      renderCard(row)
    ) : (
      <>
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-th-hi">{primary?.cell(row)}</span>
          {secondary ? <span className="mt-0.5 block text-sm text-th-hi3">{secondary.cell(row)}</span> : null}
        </span>
        {rest.length > 0 ? (
          <span className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {rest.map((c) => (
              <span key={c.key} className="flex min-w-0 items-baseline justify-between gap-2">
                <span className="shrink-0 text-xs text-th-hi3">{c.header}</span>
                <span className={cn('min-w-0 text-th-hi2', c.numeric && 'whitespace-nowrap text-right tabular-nums')}>{c.cell(row)}</span>
              </span>
            ))}
          </span>
        ) : null}
      </>
    );

  const cardClassFor = (row: T) =>
    cardClass({
      padding: 'sm',
      interactive,
      className: cn('block min-h-11 w-full text-left', rowTone?.(row) && TONE_EDGE[rowTone(row) as keyof typeof TONE_EDGE]),
    });

  const cards = loading ? (
    <CardListSkeleton count={3} lines={2} />
  ) : !hasRows ? (
    emptyNode
  ) : (
    <>
      {sortable.length > 0 ? (
        <div className="mb-2 flex items-center gap-2">
          <label className="shrink-0 text-xs text-th-hi3" htmlFor={sortId}>
            Sort by
          </label>
          <Select
            id={sortId}
            size="sm"
            className="min-w-0 flex-1"
            value={current?.key ?? ''}
            onChange={(e) => changeSort(e.target.value ? { key: e.target.value, dir: current?.dir ?? 'asc' } : null)}
          >
            <option value="">Default</option>
            {sortable.map((c) => (
              <option key={c.key} value={c.key}>
                {c.header}
              </option>
            ))}
          </Select>
          <IconButton
            label={current?.dir === 'desc' ? 'Sorted descending, switch to ascending' : 'Sorted ascending, switch to descending'}
            variant="subtle"
            disabled={!current}
            onClick={() => current && changeSort({ key: current.key, dir: current.dir === 'asc' ? 'desc' : 'asc' })}
          >
            {current?.dir === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
          </IconButton>
        </div>
      ) : null}
      <ul aria-label={label} className="grid gap-2">
        {sorted.map((row) => (
          <li key={rowKey(row)}>
            {rowHref ? (
              <a href={rowHref(row)} className={cardClassFor(row)}>
                {cardBody(row)}
              </a>
            ) : onRowClick ? (
              <button type="button" onClick={() => onRowClick(row)} className={cardClassFor(row)}>
                {cardBody(row)}
              </button>
            ) : (
              <div className={cardClassFor(row)}>{cardBody(row)}</div>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className={className}>
      {/* Only the active layout is rendered. Before the media query is known (server render,
          first paint) the CSS classes keep the wrong one hidden. */}
      {wide ? <div className={TABLE_SHOW[cardsBelow]}>{table}</div> : <div className={CARDS_SHOW[cardsBelow]}>{cards}</div>}
    </div>
  );
}

// =====================================================================================
// ListRow
// =====================================================================================

export interface ListRowProps {
  /** A leading icon or avatar (kept at its size). */
  icon?: ReactNode;
  /** The main line; truncates. */
  title: ReactNode;
  /** A quieter line under the title; up to two lines. */
  subtitle?: ReactNode;
  /** A right-aligned detail: a date, an amount. */
  meta?: ReactNode;
  /** A control or badge at the far right (outside the meta). */
  trailing?: ReactNode;
  /** Makes the whole row a link. */
  href?: string;
  /** Makes the whole row a button. */
  onClick?: () => void;
  /** The current item: accent tint and aria-current. */
  active?: boolean;
  /** danger: the title turns loss-red. */
  tone?: 'danger';
  /** Shows a chevron. On by default for a link. */
  chevron?: boolean;
  /** A 44px row instead of 52px. */
  dense?: boolean;
  /** Opens the link in a new tab with an external icon. */
  external?: boolean;
  className?: string;
  /** The wrapper element. Default 'li'; pass 'div' outside a list. */
  as?: 'li' | 'div';
}

/** A list row: icon, title, subtitle, meta and a chevron, where the whole row is the link or button. */
export function ListRow({
  icon,
  title,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  active = false,
  tone,
  chevron,
  dense = false,
  external = false,
  className,
  as: Wrapper = 'li',
}: ListRowProps) {
  const interactive = !!(href || onClick);
  const showChevron = chevron ?? !!href;
  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-[var(--nish-radius-sm)] px-3 text-left',
    dense ? 'min-h-11' : 'min-h-[52px]',
    !subtitle && 'py-1',
    subtitle && 'py-2',
    interactive &&
      'transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-th-accent',
    active && 'bg-th-accent-soft',
    className,
  );
  const body = (
    <>
      {icon ? <span className="flex shrink-0 items-center text-th-hi3 [&>svg]:size-5">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate', tone === 'danger' ? 'text-th-loss' : 'text-th-hi')}>{title}</span>
        {subtitle ? <span className="line-clamp-2 block text-sm text-th-hi3">{subtitle}</span> : null}
      </span>
      {meta ? <span className="shrink-0 text-right text-xs tabular-nums text-th-hi3">{meta}</span> : null}
      {trailing ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
      {external ? <ExternalGlyph size={14} className="shrink-0 text-th-hi3" /> : null}
      {showChevron && !external ? <ChevronRight size={16} className="shrink-0 text-th-ghost" /> : null}
    </>
  );
  let inner: ReactNode;
  if (href) {
    inner = (
      <a
        href={href}
        className={rowClass}
        aria-current={active ? 'true' : undefined}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      >
        {body}
      </a>
    );
  } else if (onClick) {
    inner = (
      <button type="button" onClick={onClick} className={rowClass} aria-current={active ? 'true' : undefined}>
        {body}
      </button>
    );
  } else {
    inner = <div className={rowClass}>{body}</div>;
  }
  return <Wrapper>{inner}</Wrapper>;
}

// =====================================================================================
// Favicon
// =====================================================================================

const FAVICON_HUES = 8;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hostnameOf(url: string): string | null {
  try {
    const u = new URL(url.includes('://') ? url : `https://${url}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}

export interface FaviconProps {
  /** The site's address; only the host is used. */
  url: string;
  /** Width and height in px. Default 16. */
  size?: number;
  /** The text whose first letter fills the fallback avatar. Default: the host name. */
  label?: string;
  className?: string;
}

/** A site's favicon, or a colored letter avatar while it loads or when it cannot. Decorative. */
export function Favicon({ url, size = 16, label, className }: FaviconProps) {
  const host = hostnameOf(url);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
    setFailed(false);
    setLoaded(false);
  }, [host]);
  const box: CSSProperties = { width: size, height: size };
  if (!host || failed) {
    const seed = label ?? host ?? url;
    const n = (hashString(seed) % FAVICON_HUES) + 1;
    const letter = (seed.replace(/^www\./, '').match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();
    return (
      <span
        aria-hidden="true"
        className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-sm font-semibold leading-none', className)}
        style={{
          ...box,
          fontSize: Math.round(size * 0.6),
          color: `var(--nish-chart-${n})`,
          background: `color-mix(in srgb, var(--nish-chart-${n}) 20%, transparent)`,
        }}
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=${size * 2 > 32 ? 64 : 32}&domain=${encodeURIComponent(host)}`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn('inline-block shrink-0 rounded-sm transition-opacity duration-150 motion-reduce:transition-none', loaded ? 'opacity-100' : 'opacity-0', className)}
      style={box}
    />
  );
}

// =====================================================================================
// LinkCard
// =====================================================================================

export type LinkCardAccent = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` | 'accent';

export interface LinkCardProps {
  /** Where the card goes. */
  href: string;
  /** The name. */
  title: string;
  /** A short description. */
  blurb?: string;
  /** A 20px icon or a Favicon, shown in a tinted tile. */
  icon?: ReactNode;
  /** The tile color. Default 'accent'. */
  accent?: LinkCardAccent;
  /** A small detail line (card layout only). */
  meta?: ReactNode;
  /** A status dot and label. */
  status?: { tone: StatusTone; label: string };
  /** Anything small at the top right: a Badge, a count. */
  badge?: ReactNode;
  /** Not available yet: dashed border, not a link. */
  disabled?: boolean;
  /** 'card' is a tile, 'row' a 64px row, 'auto' (default) a row until its parent is 600px wide. */
  layout?: 'auto' | 'card' | 'row';
  /** Opens in a new tab. */
  external?: boolean;
  className?: string;
}

const AUTO_BREAK = 600;

type WidthWatch = { ro: ResizeObserver; subs: Set<(w: number) => void> };
const widthWatches = new WeakMap<Element, WidthWatch>();

/** Calls `fn` with the element's width now and on every resize. Cards in one grid share
 *  a single ResizeObserver. Returns the unsubscribe function. */
function watchWidth(el: HTMLElement, fn: (w: number) => void): () => void {
  fn(el.clientWidth);
  if (typeof ResizeObserver === 'undefined') return () => {};
  let w = widthWatches.get(el);
  if (!w) {
    const subs = new Set<(width: number) => void>();
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      subs.forEach((f) => f(width));
    });
    ro.observe(el);
    w = { ro, subs };
    widthWatches.set(el, w);
  }
  w.subs.add(fn);
  const watch = w;
  return () => {
    watch.subs.delete(fn);
    if (!watch.subs.size) {
      watch.ro.disconnect();
      widthWatches.delete(el);
    }
  };
}

/** A big link to another page or app: icon tile, title and blurb. The whole card is the anchor. */
export function LinkCard({
  href,
  title,
  blurb,
  icon,
  accent = 'accent',
  meta,
  status,
  badge,
  disabled = false,
  layout = 'auto',
  external = false,
  className,
}: LinkCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(false);
  // Layout effect: the first paint already has the right layout. One observer per parent.
  useLayoutEffect(() => {
    if (layout !== 'auto') return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    return watchWidth(parent, (w) => setWide(w >= AUTO_BREAK));
  }, [layout]);

  const isCard = layout === 'card' || (layout === 'auto' && wide);
  const color = accent === 'accent' ? 'var(--nish-accent)' : `var(--nish-${accent})`;
  const tile = icon ? (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-[var(--nish-radius-sm)] [&>svg]:size-5', isCard ? 'size-10' : 'size-9')}
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {icon}
    </span>
  ) : null;
  const statusEl = status ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-th-hi3">
      <StatusDot tone={status.tone} size="xs" />
      {status.label}
    </span>
  ) : null;

  const base = cn(
    'group/link @container flex min-h-11 rounded-xl border bg-th-surface text-left',
    disabled ? 'border-dashed border-th-line-strong text-th-hi3' : 'border-th-line shadow-card',
    !disabled &&
      'transition-[transform,box-shadow,border-color,background-color] duration-150 hover:border-th-line-strong hover:bg-th-elevated/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-pop',
    isCard ? 'flex-col gap-3 p-4' : 'min-h-16 items-center gap-3 px-3 py-2',
    className,
  );

  const content = isCard ? (
    <>
      <span className="flex items-start justify-between gap-2">
        {tile ?? <span />}
        <span className="flex items-center gap-2">
          {badge}
          {external ? <ExternalGlyph size={14} className="text-th-hi3" /> : null}
        </span>
      </span>
      <span className="min-w-0">
        <span className={cn('block font-semibold', disabled ? 'text-th-hi2' : 'text-th-hi')}>{title}</span>
        {blurb ? <span className="mt-1 line-clamp-3 block text-sm text-th-hi3">{blurb}</span> : null}
      </span>
      {meta || statusEl ? (
        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-th-hi3">
          {statusEl}
          {meta}
        </span>
      ) : null}
    </>
  ) : (
    <>
      {tile}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate font-semibold', disabled ? 'text-th-hi2' : 'text-th-hi')}>{title}</span>
          {status ? <StatusDot tone={status.tone} size="xs" label={status.label} /> : null}
        </span>
        {blurb ? <span className="line-clamp-1 block text-sm text-th-hi3">{blurb}</span> : null}
      </span>
      {badge}
      {external ? <ExternalGlyph size={14} className="shrink-0 text-th-hi3" /> : <ChevronRight size={16} className="shrink-0 text-th-ghost" />}
    </>
  );

  if (disabled) {
    return (
      <span ref={ref} aria-disabled="true" className={base}>
        {content}
      </span>
    );
  }
  return (
    <a
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={href}
      className={base}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
    >
      {content}
    </a>
  );
}

// =====================================================================================
// AsyncPanel
// =====================================================================================

export interface AsyncPanelProps {
  /** Which state to show. */
  status: 'loading' | 'error' | 'empty' | 'ready';
  /** The loading body. Default: SkeletonRows. */
  skeleton?: ReactNode;
  /** The error body. */
  error?: { title?: string; message: string; onRetry?: () => void };
  /** The empty body. */
  empty?: { title: string; description?: string; action?: ReactNode };
  /** The content for status 'ready'. */
  children?: ReactNode;
  className?: string;
}

/** Shows a skeleton, an error, an empty state or its children, from one status value. */
export function AsyncPanel({ status, skeleton, error, empty, children, className }: AsyncPanelProps) {
  let body: ReactNode;
  if (status === 'loading') body = skeleton ?? <SkeletonRows />;
  else if (status === 'error')
    body = (
      <ErrorState
        message={error?.title ? `${error.title}: ${error.message}` : (error?.message ?? 'Failed to load')}
        onRetry={error?.onRetry}
      />
    );
  else if (status === 'empty')
    body = <EmptyState title={empty?.title ?? 'Nothing here yet'} detail={empty?.description} action={empty?.action} />;
  else body = children;
  return (
    <div aria-busy={status === 'loading' || undefined} className={className}>
      {body}
    </div>
  );
}
