import {
  createContext,
  useContext,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '../cn';
import { useScrollEdges } from './layout-vars';

// Table primitives: plain <table> markup with the shared look. No table library; for
// TanStack (or any renderer that wants strings) use tableClass, the same recipes.

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';

const ALIGN: Record<Align, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };

// An inset 3px edge on the row's first cell (a box-shadow on <tr> is unreliable).
const ROW_TONE: Record<RowTone, string> = {
  ok: '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)]',
  warn: '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)]',
  loss: '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)]',
};

const WRAP = 'relative overflow-auto rounded-xl border border-th-line bg-th-surface';
const STICKY = '[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-th-surface';
const TABLE = 'w-full border-collapse text-sm tabular-nums text-th-hi2';
const ZEBRA = '[&_tbody>tr:nth-child(even)]:bg-th-elevated/50';
const TH = 'whitespace-nowrap border-b border-th-line px-3 text-left align-middle text-xs font-medium uppercase tracking-wider text-th-hi3';
const TD = 'px-3 align-middle';
const PAD = { normal: 'py-2.5', dense: 'py-1.5' } as const;
const TR = 'border-b border-th-line last:border-b-0';
const TR_INTERACTIVE = 'cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated';
const NUMERIC = 'whitespace-nowrap text-right tabular-nums';
// A pinned first column: opaque (bg-inherit takes the row's color, rows get a solid base),
// above the other cells, with a soft edge that shows once the table is scrolled sideways.
const STICKY_COL =
  '[&_thead_tr]:bg-th-surface [&_tbody_tr]:bg-th-surface [&_tr>:first-child]:sticky [&_tr>:first-child]:left-0 [&_tr>:first-child]:z-10 [&_tr>:first-child]:bg-inherit ' +
  '[&_tr>:first-child]:after:pointer-events-none [&_tr>:first-child]:after:absolute [&_tr>:first-child]:after:inset-y-0 [&_tr>:first-child]:after:left-full [&_tr>:first-child]:after:w-2.5 ' +
  '[&_tr>:first-child]:after:bg-gradient-to-r [&_tr>:first-child]:after:from-[color-mix(in_srgb,var(--nish-hi)_14%,transparent)] [&_tr>:first-child]:after:to-transparent ' +
  '[&_tr>:first-child]:after:opacity-0 [&_tr>:first-child]:after:transition-opacity [&[data-at-start=false]_tr>:first-child]:after:opacity-100';

/** The table recipes as strings, for renderers that take classes (TanStack Table cells,
 *  static markup). The components below use exactly these. */
export const tableClass = {
  /** The scroll box around the table. */
  wrap: WRAP,
  /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
  sticky: STICKY,
  /** The <table>. */
  table: TABLE,
  /** Add to table for striped rows. */
  zebra: ZEBRA,
  /** A header cell (add padY.normal or padY.dense). */
  th: TH,
  /** A body cell (add padY.normal or padY.dense). */
  td: TD,
  /** Vertical cell padding: normal or dense. */
  padY: PAD,
  /** A body row. */
  tr: TR,
  /** Add to tr for a clickable row. */
  trInteractive: TR_INTERACTIVE,
  /** Add to th or td for a right-aligned number column. */
  numeric: NUMERIC,
  /** Add to tr for a status edge. */
  tone: ROW_TONE,
} as const;

const TableCtx = createContext<{ dense: boolean }>({ dense: false });

export interface TableWrapProps extends HTMLAttributes<HTMLDivElement> {
  /** The table's minimum width (e.g. 640 or '40rem'); narrower screens scroll sideways
   *  inside the box instead of squeezing columns. */
  minWidth?: number | string;
  /** Caps the height (e.g. 480 or '60vh'); the body scrolls inside. */
  maxHeight?: number | string;
  /** Keeps the header row visible while the body scrolls. Pair it with maxHeight. */
  stickyHeader?: boolean;
  /** Fades the left and right edges while there is more to scroll sideways. Default true. */
  fade?: boolean;
  /** Pins the first column (header and body cells) to the left edge while the table
   *  scrolls sideways, with an edge shadow once it has scrolled. */
  stickyFirstColumn?: boolean;
}

/** The bordered scroll box a table sits in. Use it instead of a Card for tables. */
export function TableWrap({
  minWidth,
  maxHeight,
  stickyHeader = false,
  fade = true,
  stickyFirstColumn = false,
  className,
  style,
  children,
  ...rest
}: TableWrapProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollEdges(ref);
  const css = {
    // With a pinned first column the left fade would wash it out, so only the right edge fades.
    ...(fade && stickyFirstColumn ? { '--nish-fade-start': '#000' } : null),
    ...style,
    ...(maxHeight !== undefined ? { maxHeight } : null),
    ...(minWidth !== undefined ? { '--nish-table-min': typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : null),
  } as CSSProperties;
  return (
    <div
      ref={ref}
      className={cn(
        WRAP,
        fade && 'nish-scroll-fade',
        minWidth !== undefined && '[&>table]:min-w-[var(--nish-table-min)]',
        stickyHeader && STICKY,
        stickyFirstColumn && STICKY_COL,
        className,
      )}
      style={css}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Tighter rows (6px vertical padding instead of 10px) for dense data. */
  dense?: boolean;
  /** Striped body rows. */
  zebra?: boolean;
}

/** A full-width table with tabular numbers. Put it in a TableWrap. */
export function Table({ dense = false, zebra = false, className, ...rest }: TableProps) {
  return (
    <TableCtx.Provider value={{ dense }}>
      <table className={cn(TABLE, zebra && ZEBRA, className)} {...rest} />
    </TableCtx.Provider>
  );
}

const SORT_LABEL = { asc: 'ascending', desc: 'descending' } as const;

export interface ThProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** Text alignment. Default left (right when numeric). */
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
            '-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wider transition-colors hover:text-th-hi pointer-coarse:min-h-11',
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

export interface TdProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** Text alignment. Default left (right when numeric). */
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

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** A 3px status edge on the left (ok, warn, loss). Say the status in a cell too. */
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
