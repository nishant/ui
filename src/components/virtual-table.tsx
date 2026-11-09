'use client';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { useIsoLayoutEffect } from './client';
import type { Column, Sort } from './data';
import { sortRows } from './data-classes';
import { useStrings } from './provider';
import { TABLE_STRINGS, STATUS_STRINGS } from './strings';
import { useLatest } from './latest';
import { Table, TableWrap, Td, Th, Tr } from './table';
import { useVirtualRows, type VirtualListHandle } from './virtual';

const HIDE_BELOW = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' } as const;

const ROW_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-th-accent';

const INTERACTIVE_CHILD = 'a,button,input,select,textarea,label,summary,[role="button"],[role="link"]';

export interface VirtualTableProps<T> extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** The data. */
  rows: T[];
  /** The columns, in order (the ResponsiveTable Column type; primary and secondary are ignored). Keep the array stable. */
  columns: Column<T>[];
  /** A key for a row. Keep it stable (module-level or useCallback); it is read through a ref, so a new function each render does not rebuild the row offsets. */
  rowKey: (row: T) => string;
  /** The accessible name of the table and its scroll box. */
  label: string;
  /** Height of the scroll box (px or CSS length). Default 480. The box shrinks to fit fewer rows. */
  height?: number | string;
  /** Row height in px. Default 41 (33 when dense), or 44 when onRowClick is set so rows are touch targets. Fixed-height rows stay on one line and truncate; use measure for wrapping cells. */
  rowHeight?: number;
  /** Measures rendered rows and uses their real height (cells that wrap). rowHeight is then the estimate. */
  measure?: boolean;
  /** Tighter rows (6px vertical padding instead of 10px). */
  dense?: boolean;
  /** Striped rows (by row position, so they stay right while scrolling). */
  zebra?: boolean;
  /** The table's minimum width before it scrolls sideways. Default 640. */
  minWidth?: number | string;
  /** Pins the first column while the table scrolls sideways. */
  stickyFirstColumn?: boolean;
  /** The current sort, when you control it. */
  sort?: Sort;
  /** Called with the next sort. With sort or onSortChange given you sort the rows yourself; without
   *  them the table sorts by each column's sortValue. */
  onSortChange?: (sort: Sort) => void;
  /** Called with the row and its index on click, Enter or Space. Makes rows focusable with arrow-key navigation. */
  onRowClick?: (row: T, index: number) => void;
  /** A 3px edge at the start of a row: ok, warn or loss. Say the status in a cell too. */
  rowTone?: (row: T) => 'ok' | 'warn' | 'loss' | undefined;
  /** Shows skeleton rows instead of the data. */
  loading?: boolean;
  /** Shown when there are no rows. Default: the "nothingHere" string. */
  empty?: ReactNode;
  /** Shows an ErrorState instead of the data. */
  error?: { message: string; onRetry?: () => void } | null;
  /** Rows rendered above and below the visible ones. Default 8. */
  overscan?: number;
  /** Called with the rendered range when it changes. */
  onRangeChange?: (start: number, end: number) => void;
  /** Receives { scrollToIndex }. */
  apiRef?: Ref<VirtualListHandle>;
  /** Classes for the root. */
  className?: string;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A table of thousands of rows that renders only what is on screen. The columns are the
 * ResponsiveTable ones: a sticky header, sorting, row tones, a pinned first column, and arrow-key
 * navigation between rows when they are clickable.
 */
export function VirtualTable<T>({
  rows,
  columns,
  rowKey,
  label,
  height = 480,
  rowHeight,
  measure = false,
  dense = false,
  zebra = false,
  minWidth = 640,
  stickyFirstColumn,
  sort,
  onSortChange,
  onRowClick,
  rowTone,
  loading = false,
  empty,
  error,
  overscan = 8,
  onRangeChange,
  apiRef,
  className,
  ref,
  ...rest
}: VirtualTableProps<T>) {
  const t = useStrings(TABLE_STRINGS, STATUS_STRINGS);
  const size = rowHeight ?? (onRowClick ? 44 : dense ? 33 : 41);
  const [innerSort, setInnerSort] = useState<Sort>(null);
  const [announcement, setAnnouncement] = useState('');
  const external = sort !== undefined || onSortChange !== undefined;
  const current: Sort = sort !== undefined ? sort : innerSort;
  const sortKey = current?.key;
  const sortDir = current?.dir;

  const changeSort = (next: Sort) => {
    setInnerSort(next);
    onSortChange?.(next);
    const header = columns.find((c) => c.key === next?.key)?.header ?? '';
    setAnnouncement(t.sortAnnounce(header, next ? next.dir : null));
  };
  const toggle = (key: string) => changeSort(current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  // Keyed on the data and the sort, not on `columns`: an inline columns array must not sort again.
  const sorted = useMemo(() => {
    if (external || !sortKey || !sortDir) return rows;
    const get = columns.find((c) => c.key === sortKey)?.sortValue;
    return get ? sortRows(rows, get, sortDir) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columns are read on purpose, not keyed on
  }, [rows, sortKey, sortDir, external]);

  const showTable = !error && !loading && sorted.length > 0;
  const count = showTable ? sorted.length : 0;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLTableSectionElement | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement | null>(null);
  const pendingFocus = useRef<number | null>(null);
  const hadFocus = useRef(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const keyRef = useLatest(rowKey);
  const getKey = useCallback((i: number) => keyRef.current(sorted[i]!), [sorted, keyRef]);
  const coverTop = useCallback(() => headRef.current?.offsetHeight ?? 0, []);
  const initialCount = Math.min(40, Math.ceil((typeof height === 'number' ? height : 480) / size));

  const virtual = useVirtualRows({
    count,
    itemSize: size,
    getKey,
    measure,
    gap: 0,
    overscan,
    initialCount,
    scrollRef,
    listRef: bodyRef,
    coverTop,
    pinMode: 'contiguous',
    onRangeChange,
  });
  const { indices, total, offsetOf, sizeOf, measureRef, pin, scrollToIndex } = virtual;
  useImperativeHandle(apiRef, () => ({ scrollToIndex }), [scrollToIndex]);

  const first = indices[0] ?? 0;
  const last = indices[indices.length - 1] ?? -1;
  const topSpace = indices.length > 0 ? offsetOf(first) : 0;
  const bottomSpace = Math.max(0, total - (last >= 0 ? offsetOf(last) + sizeOf(last) : 0));

  const interactive = !!onRowClick;
  // Without a remembered row, Tab lands on the first row in view (not an overscan row above it, which would scroll under the sticky header).
  const firstInView = virtual.range.start === 0 ? first : (indices.find((i) => i >= virtual.range.start + overscan) ?? first);
  const tabbable = indices.includes(focusIndex) ? focusIndex : firstInView;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the roving row inside the rows that exist
    if (count > 0 && focusIndex > count - 1) setFocusIndex(count - 1);
  }, [count, focusIndex]);

  // A browser focus scroll must clear the sticky header.
  useIsoLayoutEffect(() => {
    const h = headRef.current?.offsetHeight ?? 0;
    if (scrollRef.current) scrollRef.current.style.scrollPaddingTop = h ? `${h}px` : '';
  });

  // Moves DOM focus to the row a key press chose once it is rendered; recovers focus when its row unmounted.
  useIsoLayoutEffect(() => {
    const body = bodyRef.current;
    if (pendingFocus.current !== null) {
      const row = body?.querySelector<HTMLElement>(`tr[data-index="${pendingFocus.current}"]`);
      if (row) {
        pendingFocus.current = null;
        row.focus({ preventScroll: true });
        return;
      }
    }
    if (hadFocus.current && document.activeElement === document.body && pendingFocus.current === null) {
      hadFocus.current = false;
      pin(null);
      scrollRef.current?.focus({ preventScroll: true });
    }
  });

  const onBodyFocus = (e: FocusEvent<HTMLTableSectionElement>) => {
    hadFocus.current = true;
    const row = (e.target as Element).closest<HTMLElement>('tr[data-index]');
    if (row && bodyRef.current?.contains(row)) pin(Number(row.dataset.index));
  };
  const onBodyBlur = (e: FocusEvent<HTMLTableSectionElement>) => {
    const next = e.relatedTarget as Node | null;
    // A window or tab switch blurs with no relatedTarget while the element stays active: keep the row pinned.
    if (!next && (!document.hasFocus() || document.activeElement === e.target)) return;
    if (next ? !bodyRef.current?.contains(next) : (e.target as Element).isConnected) {
      hadFocus.current = false;
      pin(null);
    }
  };

  const pageSize = () => {
    const scroller = scrollRef.current;
    const head = headRef.current;
    const room = scroller ? scroller.clientHeight - (head?.offsetHeight ?? 0) : 0;
    return Math.max(1, Math.floor((room || size) / size));
  };

  const goTo = (next: number) => {
    const n = Math.min(count - 1, Math.max(0, next));
    pendingFocus.current = n;
    setFocusIndex(n);
    pin(n);
    scrollToIndex(n);
  };

  const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: T, i: number) => {
    if (e.target !== e.currentTarget) return;
    const key = e.key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      onRowClick?.(row, i);
      return;
    }
    const page = key === 'PageDown' || key === 'PageUp' ? pageSize() : 1;
    const target =
      key === 'ArrowDown' || key === 'PageDown' ? i + page : key === 'ArrowUp' || key === 'PageUp' ? i - page : key === 'Home' ? 0 : key === 'End' ? count - 1 : null;
    if (target === null) return;
    e.preventDefault();
    goTo(target);
  };

  const onRowClickEvent = (e: MouseEvent<HTMLTableRowElement>, row: T, i: number) => {
    const inner = (e.target as Element).closest(INTERACTIVE_CHILD);
    if (inner && inner !== e.currentTarget && e.currentTarget.contains(inner)) return;
    setFocusIndex(i);
    onRowClick?.(row, i);
  };

  let content: ReactNode;
  if (error) {
    // Lean local markup instead of ./feedback (icons, buttons), to keep the VirtualTable import under its size ceiling.
    content = (
      <div role="alert" className="grid justify-items-center gap-2 rounded-xl bg-th-loss-soft p-8">
        <p className="text-sm">{error.message}</p>
        {error.onRetry ? (
          <button
            type="button"
            onClick={error.onRetry}
            className="rounded-full border border-th-line-strong px-3 py-1 pointer-coarse:min-h-11"
          >
            {t.retry}
          </button>
        ) : null}
      </div>
    );
  } else if (loading) {
    content = (
      <div role="status">
        <span className="sr-only">{t.loadingNamed(label)}</span>
        <div className="nish-skeleton h-56 rounded-xl" />
      </div>
    );
  } else if (sorted.length === 0) {
    content = empty ?? (
      <p className="rounded-xl border border-dashed border-th-line p-8 text-center text-sm">{t.nothingHere}</p>
    );
  } else {
    const spacer = (px: number) =>
      px > 0 ? (
        <tr aria-hidden="true" data-virtual-spacer="">
          <td colSpan={columns.length} style={{ height: px, padding: 0, border: 0 }} />
        </tr>
      ) : null;
    content = (
      <TableWrap ref={scrollRef} style={{ overflowAnchor: 'none' }} maxHeight={height} stickyHeader minWidth={minWidth} stickyFirstColumn={stickyFirstColumn} label={label}>
        <Table dense={dense} aria-label={label} aria-rowcount={sorted.length + 1} className="table-fixed">
          <thead ref={headRef}>
            <tr aria-rowindex={1}>
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
          <tbody ref={bodyRef} onFocus={interactive ? onBodyFocus : undefined} onBlur={interactive ? onBodyBlur : undefined}>
            {spacer(topSpace)}
            {indices.map((i) => {
              const row = sorted[i];
              if (row === undefined) return null;
              return (
                <Tr
                  key={rowKey(row)}
                  ref={measure ? measureRef : undefined}
                  tone={rowTone?.(row)}
                  interactive={interactive}
                  data-index={i}
                  style={measure ? undefined : { height: size }}
                  aria-rowindex={i + 2}
                  tabIndex={interactive ? (i === tabbable ? 0 : -1) : undefined}
                  className={cn(zebra && i % 2 === 1 && 'bg-th-elevated/50', interactive && ROW_FOCUS)}
                  onClick={interactive ? (e) => onRowClickEvent(e, row, i) : undefined}
                  onKeyDown={interactive ? (e) => onRowKeyDown(e, row, i) : undefined}
                >
                  {columns.map((c) => (
                    <Td
                      key={c.key}
                      numeric={c.numeric}
                      className={cn(c.hideBelow && HIDE_BELOW[c.hideBelow], !measure && 'truncate')}
                    >
                      {c.cell(row)}
                    </Td>
                  ))}
                </Tr>
              );
            })}
            {spacer(bottomSpace)}
          </tbody>
        </Table>
      </TableWrap>
    );
  }

  return (
    <div {...rest} ref={ref} className={className}>
      {content}
      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
