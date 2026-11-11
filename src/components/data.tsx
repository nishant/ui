'use client';
import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SVGProps,
} from 'react';
import { cn } from '../cn';
import { safeUrl } from '../url';
import { useIsoLayoutEffect } from './client';
import {
  FAVICON_HUES,
  getFaviconResolver,
  hashString,
  hostnameOf,
  mergeRefs,
  sortRows,
  tableInternals,
  warnOnce,
  type FaviconResolver,
} from './data-classes';
import { useMediaQuery } from './hooks';
import { StatusDot, type StatusTone } from './display';
import { CardListSkeleton, EmptyState, ErrorState, SkeletonRows } from './feedback';
import { useLatest } from './latest';
import { useStrings } from './provider';
import { STATUS_STRINGS, TABLE_STRINGS } from './strings';
import { Table, TableWrap, Td, Th, Tr } from './table';
import { cardClass, IconButton, Select } from './primitives';

export { configureFavicons, googleFavicon } from './data-classes';
export type { FaviconResolver } from './data-classes';

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

// The chevron points the way a row leads, so it flips in right-to-left layouts.
const ChevronRight = (p: IconProps) => (
  <Glyph {...p} className={cn('rtl:-scale-x-100', p.className)}>
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

const subscribeNever = () => () => {};

const TABLE_SHOW: Record<CardsBelow, string> = { sm: 'hidden sm:block', md: 'hidden md:block', lg: 'hidden lg:block' };
const BP_PX: Record<CardsBelow, number> = { sm: 640, md: 768, lg: 1024 };
const CARDS_SHOW: Record<CardsBelow, string> = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' };
const { HIDE_BELOW } = tableInternals;
const TONE_EDGE = {
  ok: 'border-s-[3px] border-s-[var(--nish-ok-fill)]',
  warn: 'border-s-[3px] border-s-[var(--nish-warn-fill)]',
  loss: 'border-s-[3px] border-s-[var(--nish-loss-fill)]',
} as const;

type RowToneName = keyof typeof TONE_EDGE;

/** Words a ResponsiveTable says about sorting. English by default. */
export interface SortText {
  /** The live-region message after the sort changes (dir is null when it is cleared). */
  announce?: (header: string, dir: 'asc' | 'desc' | null) => string;
  /** The label of the card-mode direction button, given the current direction. */
  toggle?: (dir: 'asc' | 'desc' | null) => string;
}

export interface ResponsiveTableProps<T> extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The data. */
  rows: T[];
  /** The columns, in table order. Keep the array stable (module level or useMemo): rows only
   *  skip re-rendering while it is the same array. Sorting does not depend on it. */
  columns: Column<T>[];
  /** A stable key for a row. */
  rowKey: (row: T) => string;
  /** Below this breakpoint the rows become cards. Default 'md'. */
  cardsBelow?: CardsBelow;
  /** Called when a row (or card) is activated by click, Enter or Space. */
  onRowClick?: (row: T) => void;
  /** Makes each row a link to this URL (cards become real anchors). A URL that is not safe
   *  (javascript:, data:) is ignored: the row does not navigate. */
  rowHref?: (row: T) => string;
  /** Called with the URL when a row is activated by click or key, so a router can navigate
   *  without a page reload. Without it the table assigns `location`. Card links stay real
   *  anchors. */
  onNavigate?: (href: string) => void;
  /** A 3px edge at the start of a row: ok, warn or loss. Say the status in a cell too. */
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
  /** Shown when there are no rows. Default: the "nothingHere" string. */
  empty?: ReactNode;
  /** Shows an ErrorState instead of the data. */
  error?: { message: string; onRetry?: () => void } | null;
  /** The accessible name of the table and the card list. */
  label: string;
  /** Renders a whole card yourself (inside the card's button or link). */
  renderCard?: (row: T) => ReactNode;
  /** Replaces the English sort announcement and direction-button label. */
  sortText?: SortText;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

interface BodyRowProps<T> {
  row: T;
  columns: Column<T>[];
  tone: RowToneName | undefined;
  interactive: boolean;
  onGo: (row: T, e: MouseEvent | KeyboardEvent) => void;
}

// One body row. Its props are stable between renders (the row object, the columns array, a
// tone name, a boolean and a callback that never changes), so a parent re-render skips it.
const BodyRow = /* @__PURE__ */ memo(function BodyRow<T>({ row, columns, tone, interactive, onGo }: BodyRowProps<T>) {
  return (
    <Tr
      tone={tone}
      interactive={interactive}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive
          ? (e) => {
              if (!fromInteractive(e)) onGo(row, e);
            }
          : undefined
      }
      onAuxClick={
        interactive
          ? (e) => {
              // The middle button fires auxclick, not click: open the row's link in a new tab.
              if (e.button === 1 && !fromInteractive(e)) onGo(row, e);
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onGo(row, e);
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
  );
}) as <T>(props: BodyRowProps<T>) => ReactElement;

/**
 * A table on wide screens and a list of cards on phones, from one column definition.
 * Sortable headers (and a sort menu in card mode), clickable or linked rows, a status
 * edge per row, loading, empty and error states built in. A sort change is announced to
 * screen readers.
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
  sortText,
  className,
  ref,
  ...rest
}: ResponsiveTableProps<T>) {
  const t = useStrings(STATUS_STRINGS, TABLE_STRINGS);
  // The announcement comes from the provider's strings; sortText wins per instance.
  const text = { announce: sortText?.announce ?? t.sortAnnounce, toggle: sortText?.toggle ?? t.sortToggle };
  const [innerSort, setInnerSort] = useState<Sort>(null);
  const [announcement, setAnnouncement] = useState('');
  const sortId = useId();
  const wide = useMediaQuery(`(min-width: ${BP_PX[cardsBelow]}px)`);
  // False on the server and while hydrating, true on every later render. Until then both
  // layouts are built and the CSS classes show the right one, so the first paint is not empty.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const showTable = wide || !hydrated;
  const showCards = !wide || !hydrated;
  const external = sort !== undefined || onSortChange !== undefined;
  const current: Sort = sort !== undefined ? sort : innerSort;
  const sortKey = current?.key;
  const sortDir = current?.dir;

  const changeSort = (next: Sort) => {
    setInnerSort(next);
    onSortChange?.(next);
    const header = columns.find((c) => c.key === next?.key)?.header ?? '';
    setAnnouncement(text.announce(header, next ? next.dir : null));
  };

  // Keyed on the data and the sort, not on `columns`: an inline columns array (a new identity
  // on every render) must not sort again. The column is looked up when the sort is computed.
  const sorted = useMemo(() => {
    if (external || !sortKey || !sortDir) return rows;
    const get = columns.find((c) => c.key === sortKey)?.sortValue;
    return get ? sortRows(rows, get, sortDir) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columns are read on purpose, not keyed on
  }, [rows, sortKey, sortDir, external]);

  const sortable = columns.filter((c) => c.sortValue);
  const toggle = (key: string) => changeSort(current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  const interactive = !!(onRowClick || rowHref);

  const latest = useLatest({ onRowClick, rowHref, onNavigate });
  const go = useCallback((row: T, e: MouseEvent | KeyboardEvent) => {
    const { onRowClick: click, rowHref: hrefOf, onNavigate: navigate } = latest.current;
    if (!hrefOf) return click?.(row);
    const raw = hrefOf(row);
    const href = safeUrl(raw);
    if (href === null) {
      warnOnce('table-href', `ResponsiveTable ignored an unsafe rowHref (${JSON.stringify(raw)}).`);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || ('button' in e && e.button === 1)) window.open(href, '_blank', 'noopener');
    else if (navigate) navigate(href);
    else window.location.assign(href);
  }, [latest]);

  if (error) {
    return (
      <div {...rest} ref={ref} className={className}>
        <ErrorState message={error.message} onRetry={error.onRetry} />
      </div>
    );
  }

  const emptyNode = empty ?? <EmptyState title={t.nothingHere} />;
  const hasRows = sorted.length > 0;

  // Only the active layout is built: the other one would call every cell renderer for nothing.
  const table = !showTable ? null : loading ? (
    <SkeletonRows rows={5} height={44} label={t.loadingNamed(label)} />
  ) : !hasRows ? (
    emptyNode
  ) : (
    <TableWrap minWidth={minWidth} stickyHeader={stickyHeader} maxHeight={maxHeight} stickyFirstColumn={stickyFirstColumn} label={label}>
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
            <BodyRow<T> key={rowKey(row)} row={row} columns={columns} tone={rowTone?.(row)} interactive={interactive} onGo={go} />
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.find((c) => c.secondary && c !== primary);
  const rest2 = columns.filter((c) => c !== primary && c !== secondary);

  const cardBody = (row: T) =>
    renderCard ? (
      renderCard(row)
    ) : (
      <>
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-th-hi">{primary?.cell(row)}</span>
          {secondary ? <span className="mt-0.5 block text-sm text-th-hi3">{secondary.cell(row)}</span> : null}
        </span>
        {rest2.length > 0 ? (
          <span className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {rest2.map((c) => (
              <span key={c.key} className="flex min-w-0 items-baseline justify-between gap-2">
                <span className="shrink-0 text-xs text-th-hi3">{c.header}</span>
                <span className={cn('min-w-0 text-th-hi2', c.numeric && 'whitespace-nowrap text-end tabular-nums')}>{c.cell(row)}</span>
              </span>
            ))}
          </span>
        ) : null}
      </>
    );

  const cardClassFor = (tone: RowToneName | undefined, live: boolean) =>
    cardClass({
      padding: 'sm',
      interactive: live,
      className: cn('block min-h-11 w-full text-start', tone && TONE_EDGE[tone]),
    });

  const cardItem = (row: T) => {
    const tone = rowTone?.(row);
    const href = rowHref ? safeUrl(rowHref(row)) : null;
    if (rowHref && href === null) warnOnce('table-href', `ResponsiveTable ignored an unsafe rowHref (${JSON.stringify(rowHref(row))}).`);
    if (href !== null) {
      return (
        <a href={href} className={cardClassFor(tone, true)}>
          {cardBody(row)}
        </a>
      );
    }
    if (onRowClick) {
      return (
        <button type="button" onClick={() => onRowClick(row)} className={cardClassFor(tone, true)}>
          {cardBody(row)}
        </button>
      );
    }
    return <div className={cardClassFor(tone, false)}>{cardBody(row)}</div>;
  };

  const cards = !showCards ? null : loading ? (
    <CardListSkeleton count={3} lines={2} />
  ) : !hasRows ? (
    emptyNode
  ) : (
    <>
      {sortable.length > 0 ? (
        <div className="mb-2 flex items-center gap-2">
          <label className="shrink-0 text-xs text-th-hi3" htmlFor={sortId}>
            {t.sortBy}
          </label>
          <Select
            id={sortId}
            size="sm"
            className="min-w-0 flex-1"
            value={current?.key ?? ''}
            onChange={(e) => changeSort(e.target.value ? { key: e.target.value, dir: current?.dir ?? 'asc' } : null)}
          >
            <option value="">{t.sortDefault}</option>
            {sortable.map((c) => (
              <option key={c.key} value={c.key}>
                {c.header}
              </option>
            ))}
          </Select>
          <IconButton
            label={text.toggle(current ? current.dir : null)}
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
          <li key={rowKey(row)}>{cardItem(row)}</li>
        ))}
      </ul>
    </>
  );

  return (
    <div {...rest} ref={ref} className={className}>
      {/* Only the active layout is rendered. Before hydration (server render) both are, and
          the CSS classes show the right one. */}
      {showTable ? <div className={TABLE_SHOW[cardsBelow]}>{table}</div> : null}
      {showCards ? <div className={CARDS_SHOW[cardsBelow]}>{cards}</div> : null}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

// =====================================================================================
// ListRow
// =====================================================================================

export interface ListRowProps extends Omit<ComponentPropsWithoutRef<'li'>, 'title' | 'onClick' | 'children' | 'className'> {
  /** A leading icon or avatar (kept at its size). */
  icon?: ReactNode;
  /** The main line; truncates, or wraps to two lines with `titleLines={2}`. */
  title: ReactNode;
  /** How many lines the title may use before it is cut off. Default 1 (truncates). */
  titleLines?: 1 | 2;
  /** A quieter line under the title; up to two lines. */
  subtitle?: ReactNode;
  /** A right-aligned detail: a date, an amount. */
  meta?: ReactNode;
  /** A control or badge at the far right (outside the meta). */
  trailing?: ReactNode;
  /** Makes the whole row a link. A URL that is not safe (javascript:, data:) makes it a plain row. */
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
  /** Dense, with an 11px title and 10px subtitle and meta: for small widget tiles. Keeps the 44px target. */
  compact?: boolean;
  /** Opens the link in a new tab with an external icon. */
  external?: boolean;
  /** Classes for the row itself (the link, button or box inside the wrapper). */
  className?: string;
  /** The wrapper element. Default 'li'; pass 'div' outside a list. */
  as?: 'li' | 'div';
  /** The wrapper element. */
  ref?: Ref<HTMLElement>;
}

/** A list row: icon, title, subtitle, meta and a chevron, where the whole row is the link or button. */
export function ListRow({
  icon,
  title,
  titleLines = 1,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  active = false,
  tone,
  chevron,
  dense = false,
  compact = false,
  external = false,
  className,
  as: wrapperTag = 'li',
  ref,
  ...rest
}: ListRowProps) {
  const Wrapper = wrapperTag as 'li';
  const url = href === undefined ? null : safeUrl(href);
  const interactive = !!(url || onClick);
  const showChevron = chevron ?? !!url;
  const rowClass = cn(
    'flex w-full items-center rounded-[var(--nish-radius-sm)] px-3 text-start',
    compact ? 'gap-2.5' : 'gap-3',
    dense || compact ? 'min-h-11' : 'min-h-[52px]',
    !subtitle && 'py-1',
    subtitle && (compact ? 'py-1.5' : 'py-2'),
    interactive &&
      'transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-th-accent',
    // The active row is shown by a tint; forced colors drop it, so it gets an outline.
    active && 'bg-th-accent-soft forced-colors:outline forced-colors:outline-2 forced-colors:outline-[color:Highlight]',
    className,
  );
  const body = (
    <>
      {icon ? <span className="flex shrink-0 items-center text-th-hi3 [&>svg]:size-5">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block',
            titleLines === 2 ? 'line-clamp-2 break-words' : 'truncate',
            compact && 'text-2xs font-medium leading-snug',
            tone === 'danger' ? 'text-th-loss' : 'text-th-hi',
          )}
        >
          {title}
        </span>
        {/* On the active row's accent tint, hi3 falls under 4.5:1 in light themes; hi2 holds it. */}
        {subtitle ? (
          <span className={cn('line-clamp-2 block', compact ? 'mt-0.5 text-3xs' : 'text-sm', active ? 'text-th-hi2' : 'text-th-hi3')}>{subtitle}</span>
        ) : null}
      </span>
      {meta ? (
        <span className={cn('shrink-0 text-end tabular-nums', compact ? 'text-3xs' : 'text-xs', active ? 'text-th-hi2' : 'text-th-hi3')}>{meta}</span>
      ) : null}
      {trailing ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
      {external ? <ExternalGlyph size={14} className="shrink-0 text-th-hi3" /> : null}
      {showChevron && !external ? <ChevronRight size={compact ? 13 : 16} className="shrink-0 text-th-ghost" /> : null}
    </>
  );
  let inner: ReactNode;
  if (url) {
    inner = (
      <a
        href={url}
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
  return (
    <Wrapper {...rest} ref={ref as Ref<HTMLLIElement>} className="min-w-0">
      {inner}
    </Wrapper>
  );
}

// =====================================================================================
// Favicon
// =====================================================================================

export interface FaviconProps
  extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'width' | 'height' | 'alt' | 'children' | 'loading' | 'referrerPolicy' | 'onLoad' | 'onError'> {
  /** The site's address; only the host is used. */
  url: string;
  /** Width and height in px. Default 16. */
  size?: number;
  /** The text whose first letter fills the fallback avatar. Default: the host name. */
  label?: string;
  /** An image to show for this site, used as is (https, http or relative; unsafe URLs are ignored). */
  src?: string;
  /** Turns the host and size into an image URL, or null for the letter avatar. Wins over
   *  configureFavicons. Without a `src`, a `resolve` or a configured resolver, no request is made. */
  resolve?: FaviconResolver;
  ref?: Ref<HTMLElement>;
}

/** A site's favicon, or a colored letter avatar while it loads or when it cannot. Decorative.
 *  Out of the box it makes no network request and shows the letter avatar: pass `src` or
 *  `resolve`, or call `configureFavicons({ resolve: googleFavicon })` once. */
export function Favicon({ url, size = 16, label, src, resolve, className, style, ref, ...rest }: FaviconProps) {
  const host = hostnameOf(url);
  const imgSrc = useMemo(() => {
    const own = src !== undefined ? safeUrl(src) : host ? (resolve ?? getFaviconResolver())(host, size) : null;
    return own === null ? null : safeUrl(own);
  }, [src, host, resolve, size]);
  const [seen, setSeen] = useState<{ src: string; status: 'loaded' | 'failed' } | null>(null);
  const status = imgSrc && seen?.src === imgSrc ? seen.status : 'loading';
  const box: CSSProperties = { width: size, height: size };
  if (!imgSrc || status === 'failed') {
    const seed = label ?? host ?? url;
    const n = (hashString(seed) % FAVICON_HUES) + 1;
    const letter = (seed.replace(/^www\./, '').match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();
    return (
      <span
        aria-hidden="true"
        {...(rest as ComponentPropsWithoutRef<'span'>)}
        ref={ref as Ref<HTMLSpanElement>}
        className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-sm font-semibold leading-none', className)}
        style={{
          ...box,
          fontSize: Math.round(size * 0.6),
          color: `var(--nish-chart-${n})`,
          background: `color-mix(in srgb, var(--nish-chart-${n}) 20%, transparent)`,
          ...style,
        }}
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      aria-hidden="true"
      {...rest}
      ref={ref as Ref<HTMLImageElement>}
      src={imgSrc}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setSeen({ src: imgSrc, status: 'loaded' })}
      onError={() => setSeen({ src: imgSrc, status: 'failed' })}
      className={cn('inline-block shrink-0 rounded-sm transition-opacity duration-150 motion-reduce:transition-none', status === 'loaded' ? 'opacity-100' : 'opacity-0', className)}
      style={{ ...box, ...style }}
    />
  );
}

// =====================================================================================
// LinkCard
// =====================================================================================

export type LinkCardAccent = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` | 'accent';

export interface LinkCardProps extends Omit<ComponentPropsWithoutRef<'a'>, 'title' | 'href' | 'children'> {
  /** Where the card goes. A URL that is not safe (javascript:, data:) makes the card
   *  unavailable, like `disabled`. */
  href: string;
  /** The name. */
  title: string;
  /** A short description. */
  blurb?: string;
  /** A 20px icon or a Favicon, shown in a tinted tile. */
  icon?: ReactNode;
  /** With no `icon`, shows the site's Favicon (from the page's configureFavicons resolver,
   *  else a letter avatar) in the tile. */
  favicon?: boolean;
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
  ref?: Ref<HTMLElement>;
}

const AUTO_BREAK = 600;

type WidthWatch = { ro: ResizeObserver; subs: Set<(w: number) => void> };
const widthWatches = /* @__PURE__ */ new WeakMap<Element, WidthWatch>();

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
  favicon = false,
  accent = 'accent',
  meta,
  status,
  badge,
  disabled = false,
  layout = 'auto',
  external = false,
  className,
  ref: forwardedRef,
  ...rest
}: LinkCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(false);
  const url = safeUrl(href);
  const dead = disabled || url === null;
  if (!disabled && url === null) warnOnce('linkcard-href', `LinkCard ignored an unsafe href (${JSON.stringify(href)}).`);
  // Layout effect: the first paint already has the right layout. One observer per parent.
  useIsoLayoutEffect(() => {
    if (layout !== 'auto') return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    return watchWidth(parent, (w) => setWide(w >= AUTO_BREAK));
  }, [layout]);

  const isCard = layout === 'card' || (layout === 'auto' && wide);
  const color = accent === 'accent' ? 'var(--nish-accent)' : `var(--nish-${accent})`;
  const glyph = icon ?? (favicon ? <Favicon url={href} size={20} label={title} /> : null);
  const tile = glyph ? (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-[var(--nish-radius-sm)] [&>svg]:size-5', isCard ? 'size-10' : 'size-9')}
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {glyph}
    </span>
  ) : null;
  const statusEl = status ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-th-hi3">
      <StatusDot tone={status.tone} size="xs" />
      {status.label}
    </span>
  ) : null;

  const base = cn(
    'group/link @container flex min-h-11 rounded-xl border bg-th-surface text-start',
    dead ? 'border-dashed border-th-line-strong text-th-hi3' : 'border-th-line shadow-card',
    !dead &&
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
        <span className={cn('block font-semibold', dead ? 'text-th-hi2' : 'text-th-hi')}>{title}</span>
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
          <span className={cn('truncate font-semibold', dead ? 'text-th-hi2' : 'text-th-hi')}>{title}</span>
          {status ? <StatusDot tone={status.tone} size="xs" label={status.label} /> : null}
        </span>
        {blurb ? <span className="line-clamp-1 block text-sm text-th-hi3">{blurb}</span> : null}
      </span>
      {badge}
      {external ? <ExternalGlyph size={14} className="shrink-0 text-th-hi3" /> : <ChevronRight size={16} className="shrink-0 text-th-ghost" />}
    </>
  );

  if (dead) {
    return (
      <span {...(rest as ComponentPropsWithoutRef<'span'>)} ref={mergeRefs(ref, forwardedRef) as Ref<HTMLSpanElement>} aria-disabled="true" className={base}>
        {content}
      </span>
    );
  }
  return (
    <a
      {...rest}
      ref={mergeRefs(ref, forwardedRef) as Ref<HTMLAnchorElement>}
      href={url}
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

export interface AsyncPanelProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
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
  ref?: Ref<HTMLDivElement>;
}

/** Shows a skeleton, an error, an empty state or its children, from one status value. */
export function AsyncPanel({ status, skeleton, error, empty, children, className, ref, ...rest }: AsyncPanelProps) {
  const t = useStrings(STATUS_STRINGS, TABLE_STRINGS);
  let body: ReactNode;
  if (status === 'loading') body = skeleton ?? <SkeletonRows />;
  else if (status === 'error')
    body = (
      <ErrorState
        message={error?.title ? `${error.title}: ${error.message}` : (error?.message ?? t.failedToLoad)}
        onRetry={error?.onRetry}
      />
    );
  else if (status === 'empty')
    body = <EmptyState title={empty?.title ?? t.nothingHere} detail={empty?.description} action={empty?.action} />;
  else body = children;
  return (
    <div {...rest} ref={ref} aria-busy={status === 'loading' || undefined} className={className}>
      {body}
    </div>
  );
}
