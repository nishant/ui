'use client';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import { mergeRefs, tableClass, tableInternals } from './data-classes';
import { useScrollEdges } from './layout-vars';

// Table primitives: plain <table> markup with the shared look. No table library; for
// TanStack (or any renderer that wants strings) use tableClass, the same recipes.

export { tableClass } from './data-classes';

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';

const { ALIGN, STICKY_COL, WRAP, STICKY, TABLE, ZEBRA, TH, TD, PAD, TR, TR_INTERACTIVE } = tableInternals;
const ROW_TONE = tableClass.tone;

const TableCtx = /* @__PURE__ */ createContext<{ dense: boolean }>({ dense: false });

export interface TableWrapProps extends ComponentProps<'div'> {
  /** The table's minimum width (e.g. 640 or '40rem'); narrower screens scroll sideways
   *  inside the box instead of squeezing columns. */
  minWidth?: number | string;
  /** Caps the height (e.g. 480 or '60vh'); the body scrolls inside. */
  maxHeight?: number | string;
  /** Keeps the header row visible while the body scrolls. Pair it with maxHeight. */
  stickyHeader?: boolean;
  /** Fades the left and right edges while there is more to scroll sideways. Default true. */
  fade?: boolean;
  /** Pins the first column (header and body cells) to the start edge while the table
   *  scrolls sideways, with an edge shadow once it has scrolled. */
  stickyFirstColumn?: boolean;
  /** The accessible name of the scroll box. While the table overflows, the box is a
   *  focusable region with this name, so keyboard users can scroll it. */
  label?: string;
}

/** The bordered scroll box a table sits in. Use it instead of a Card for tables. While the
 *  table is wider or taller than the box, the box takes focus (Tab, then arrow keys scroll). */
export function TableWrap({
  minWidth,
  maxHeight,
  stickyHeader = false,
  fade = true,
  stickyFirstColumn = false,
  label,
  className,
  style,
  children,
  ref: forwardedRef,
  ...rest
}: TableWrapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useScrollEdges(ref);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setOverflows(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    // Children can be replaced (a skeleton swapped for the table): watch the new ones too.
    const watch = () => {
      ro.disconnect();
      ro.observe(el);
      for (const c of Array.from(el.children)) ro.observe(c);
    };
    watch();
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => { watch(); update(); });
    mo?.observe(el, { childList: true });
    return () => {
      ro.disconnect();
      mo?.disconnect();
    };
  }, []);
  const name = label ?? rest['aria-label'];
  const css = {
    // With a pinned first column the left fade would wash it out, so only the right edge fades.
    ...(fade && stickyFirstColumn ? { '--nish-fade-start': '#000' } : null),
    ...style,
    ...(maxHeight !== undefined ? { maxHeight } : null),
    ...(minWidth !== undefined ? { '--nish-table-min': typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : null),
  } as CSSProperties;
  return (
    <div
      ref={mergeRefs(ref, forwardedRef)}
      tabIndex={overflows ? 0 : undefined}
      role={overflows && name ? 'region' : undefined}
      {...rest}
      aria-label={name}
      className={cn(
        WRAP,
        fade && 'nish-scroll-fade',
        minWidth !== undefined && '[&>table]:min-w-[var(--nish-table-min)]',
        stickyHeader && STICKY,
        stickyFirstColumn && STICKY_COL,
        className,
      )}
      style={css}
    >
      {children}
    </div>
  );
}

export interface TableProps extends ComponentProps<'table'> {
  /** Tighter rows (6px vertical padding instead of 10px) for dense data. */
  dense?: boolean;
  /** Striped body rows. */
  zebra?: boolean;
}

/** A full-width table with tabular numbers. Put it in a TableWrap. */
export function Table({ dense = false, zebra = false, className, ...rest }: TableProps) {
  const value = useMemo(() => ({ dense }), [dense]);
  return (
    <TableCtx.Provider value={value}>
      <table className={cn(TABLE, zebra && ZEBRA, className)} {...rest} />
    </TableCtx.Provider>
  );
}

const SORT_LABEL = { asc: 'ascending', desc: 'descending' } as const;

export interface ThProps extends Omit<ComponentProps<'th'>, 'align'> {
  /** Text alignment: the start edge, the end edge (both mirror in RTL) or centered.
   *  Default left (right when numeric). */
  align?: Align;
  /** A number column: right-aligned with tabular figures. */
  numeric?: boolean;
  /** The column's current sort, or false when it is sortable but not sorted. Leave it
   *  undefined for a column that does not sort. Sets aria-sort. */
  sort?: 'asc' | 'desc' | false;
  /** Makes the header a button that asks to sort (cycle the order in your state). */
  onSort?: () => void;
}

/** A header cell. With onSort it holds a sort button and reports aria-sort. */
export function Th({ align, numeric = false, sort, onSort, className, children, scope = 'col', ...rest }: ThProps) {
  const { dense } = useContext(TableCtx);
  const a = align ?? (numeric ? 'right' : 'left');
  const sortable = onSort !== undefined || sort !== undefined;
  return (
    <th
      scope={scope}
      aria-sort={sortable ? (sort ? SORT_LABEL[sort] : 'none') : undefined}
      className={cn(TH, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && 'tabular-nums', className)}
      {...rest}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            '-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wider transition-colors hover:text-th-hi pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:outline-th-accent',
            sort && 'text-th-hi',
            a === 'right' && 'flex-row-reverse',
          )}
        >
          {children}
          <SortMark sort={sort || false} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function SortMark({ sort }: { sort: 'asc' | 'desc' | false }) {
  return (
    <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true" focusable="false" className="shrink-0">
      <path d="M2 4 5 1l3 3" fill="none" stroke="currentColor" strokeWidth={1.5} opacity={sort === 'asc' ? 1 : 0.35} />
      <path d="M2 6l3 3 3-3" fill="none" stroke="currentColor" strokeWidth={1.5} opacity={sort === 'desc' ? 1 : 0.35} />
    </svg>
  );
}

export interface TdProps extends Omit<ComponentProps<'td'>, 'align'> {
  /** Text alignment: the start edge, the end edge (both mirror in RTL) or centered.
   *  Default left (right when numeric). */
  align?: Align;
  /** A number column: right-aligned with tabular figures, never wrapping. */
  numeric?: boolean;
  /** Keeps the cell's text on one line. */
  nowrap?: boolean;
}

/** A body cell. */
export function Td({ align, numeric = false, nowrap = false, className, ...rest }: TdProps) {
  const { dense } = useContext(TableCtx);
  const a = align ?? (numeric ? 'right' : 'left');
  return (
    <td
      className={cn(TD, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && 'whitespace-nowrap tabular-nums', nowrap && 'whitespace-nowrap', className)}
      {...rest}
    />
  );
}

export interface TrProps extends ComponentProps<'tr'> {
  /** A 3px status edge at the start (ok, warn, loss). Say the status in a cell too. */
  tone?: RowTone;
  /** Hover and focus-within highlight for a clickable row. Put a real link or button
   *  in the row as well, so keyboard users can reach it. */
  interactive?: boolean;
  /** Quieter text for inactive or archived rows. */
  muted?: boolean;
  /** Children are cells. */
  children?: ReactNode;
}

/** A body row with a divider. */
export function Tr({ tone, interactive = false, muted = false, className, ...rest }: TrProps) {
  return (
    <tr
      className={cn(TR, interactive && TR_INTERACTIVE, muted && 'text-th-hi3', tone && ROW_TONE[tone], className)}
      {...rest}
    />
  );
}
