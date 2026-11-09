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
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { cn } from '../cn';
import {
  buildOffsets,
  extendRange,
  sameRange,
  scrollDelta,
  visibleRange,
  withPinned,
  type ScrollAlign,
  type VirtualRange,
} from '../virtual-range';
import { useIsoLayoutEffect } from './client';
import { mergeRefs, warnOnce } from './data-classes';
import { useLatest } from './latest';

export interface ScrollToIndexOptions {
  /** Where the row lands: 'auto' (default) scrolls only as far as needed, or 'start', 'center', 'end'. */
  align?: ScrollAlign;
  /** 'auto' (default) jumps; 'smooth' animates. */
  behavior?: 'auto' | 'smooth';
}

export interface VirtualListHandle {
  /** Scrolls so row `index` (clamped into range) shows. */
  scrollToIndex(index: number, options?: ScrollToIndexOptions): void;
}

/** @internal Shared by VirtualList and VirtualTable; not exported from the package root. */
export interface VirtualRowsOptions {
  count: number;
  /** Fixed px, or an estimate per index (the real height replaces it when `measure`). */
  itemSize: number | ((index: number) => number);
  getKey: (index: number) => string | number;
  measure: boolean;
  gap: number;
  overscan: number;
  initialCount: number;
  /** The scrolling element; null follows the window. */
  scrollRef: RefObject<HTMLElement | null> | null;
  /** The element whose top edge is offset 0 (the list, or the tbody). */
  listRef: RefObject<HTMLElement | null>;
  /** Px at the top of the scroll box hidden under a sticky header. Default () => 0. */
  coverTop?: () => number;
  /** 'separate' (VirtualList): pinned row rendered on its own. 'contiguous' (VirtualTable): range
   *  extended to the pinned row when within 100 rows. */
  pinMode: 'separate' | 'contiguous';
  onRangeChange?: (start: number, end: number) => void;
}

/** @internal */
export interface VirtualRows {
  /** Ascending indices to render. */
  indices: number[];
  range: VirtualRange;
  total: number;
  offsetOf: (index: number) => number;
  sizeOf: (index: number) => number;
  /** Ref callback for each rendered row when `measure` (reads `data-index`; returns a cleanup). */
  measureRef: (el: HTMLElement | null) => (() => void) | undefined;
  pin: (index: number | null) => void;
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;
}

const PIN_REACH = 100;

/** A px length published on <html> by a bar (`--nish-header-h`); 0 when unset or not a plain px value. */
function rootPx(style: CSSStyleDeclaration, name: string): number {
  const n = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(n) ? n : 0;
}

/** Px of the window hidden under the sticky app header and under the bottom nav, as the layout contract publishes them. */
function windowInsets(): { top: number; bottom: number } {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return { top: 0, bottom: 0 };
  const style = getComputedStyle(document.documentElement);
  const top = rootPx(style, '--nish-header-h') + rootPx(style, '--nish-sticky-extra');
  const raw = style.getPropertyValue('--nish-bottom-inset');
  const bottom = Number.isFinite(parseFloat(raw))
    ? parseFloat(raw)
    : rootPx(style, '--nish-bottom-nav-h') + rootPx(style, '--nish-bottom-bar-h');
  return { top, bottom };
}
const byIndex = (i: number) => i;

/** @internal Windowing state for a list of rows: which rows to render, where they sit and how to scroll to one. */
export function useVirtualRows(options: VirtualRowsOptions): VirtualRows {
  const { count, itemSize, getKey, measure, gap, overscan, initialCount, scrollRef, listRef, coverTop, pinMode, onRangeChange } = options;
  const [range, setRange] = useState<VirtualRange>(() => ({ start: 0, end: Math.min(count, initialCount) }));
  const [measured, setMeasured] = useState<ReadonlyMap<string | number, number>>(() => new Map());
  const [pinned, setPinned] = useState<number | null>(null);
  const [observer, setObserver] = useState<ResizeObserver | null>(null);

  const offsets = useMemo(
    () =>
      buildOffsets(
        count,
        (i) => (measured.size === 0 ? undefined : measured.get(getKey(i))) ?? (typeof itemSize === 'number' ? itemSize : itemSize(i)),
        gap,
      ),
    // getKey only matters once something is measured, so an unstable getKey must not rebuild fixed-size offsets
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, itemSize, measure ? getKey : null, gap, measured],
  );
  const total = offsets[count];
  const offsetOf = useCallback((i: number) => offsets[i], [offsets]);
  const sizeOf = useCallback((i: number) => offsets[i + 1] - offsets[i] - (i < count - 1 ? gap : 0), [offsets, count, gap]);

  const latest = useLatest({ offsets, range, getKey, coverTop, onRangeChange, count, overscan, gap });

  /** The visible band in px from the list top, or null before the list exists. */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- reads the latest-value ref on purpose; the callback must stay stable
  const view = useCallback((): { top: number; bottom: number; listTop: number; viewTop: number; viewBottom: number } | null => {
    const list = listRef.current;
    if (!list) return null;
    const listTop = list.getBoundingClientRect().top;
    const cover = latest.current.coverTop?.() ?? 0;
    let viewTop: number;
    let viewBottom: number;
    if (scrollRef) {
      const scroller = scrollRef.current;
      if (!scroller) return null;
      const top = scroller.getBoundingClientRect().top;
      viewTop = top + cover;
      viewBottom = top + scroller.clientHeight;
    } else {
      const inset = windowInsets();
      viewTop = latest.current.coverTop ? cover : inset.top;
      viewBottom = window.innerHeight - inset.bottom;
    }
    return { top: viewTop - listTop, bottom: viewBottom - listTop, listTop, viewTop, viewBottom };
  }, [listRef, scrollRef, latest]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- reads the latest-value ref on purpose; the callback must stay stable
  const update = useCallback(() => {
    const v = view();
    if (!v) return;
    const { offsets: o, count: n, overscan: os } = latest.current;
    const raw = visibleRange(o, v.top, v.bottom, os);
    const next = { start: Math.min(raw.start, n), end: Math.min(raw.end, n) };
    setRange((prev) => (sameRange(prev, next) ? prev : next));
  }, [view, latest]);

  useIsoLayoutEffect(update, [update, offsets, overscan, count]);

  const hasList = count > 0;
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    const scroller = scrollRef ? scrollRef.current : null;
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener('scroll', schedule, { passive: true });
    if (!scrollRef) window.addEventListener('resize', schedule);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      if (scroller) ro.observe(scroller);
      if (listRef.current) ro.observe(listRef.current);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener('scroll', schedule);
      if (!scrollRef) window.removeEventListener('resize', schedule);
      ro?.disconnect();
    };
  }, [scrollRef, listRef, update, hasList]);

  useEffect(() => {
    latest.current.onRangeChange?.(range.start, range.end);
  }, [range.start, range.end, latest]);

  // One ResizeObserver per list measures every rendered row.
  useEffect(() => {
    if (!measure || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const v = view();
      const { offsets: o, getKey: keyOf, count: n, gap: g } = latest.current;
      const changes = new Map<string | number, number>();
      let delta = 0;
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const index = Number(el.dataset.index);
        if (Number.isNaN(index) || index < 0 || index >= n) continue;
        const size = entry.borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height;
        if (!(size > 0)) continue;
        const key = keyOf(index);
        const oldSize = o[index + 1] - o[index] - (index < n - 1 ? g : 0);
        changes.set(key, size);
        if (Math.abs(size - oldSize) >= 0.01 && v && o[index] + oldSize <= v.top) delta += size - oldSize;
      }
      if (changes.size === 0) return;
      // Commit the new heights before moving the scroll position, or one frame paints rows at their old offsets.
      flushSync(() => {
        setMeasured((prev) => {
          let next: Map<string | number, number> | null = null;
          for (const [k, s] of changes) {
            if (prev.get(k) !== s) {
              next ??= new Map(prev);
              next.set(k, s);
            }
          }
          return next ?? prev;
        });
      });
      if (delta !== 0) {
        const scroller = scrollRef?.current;
        if (scroller) scroller.scrollTop += delta;
        else if (!scrollRef) window.scrollBy(0, delta);
      }
    });
    setObserver(ro);
    return () => {
      ro.disconnect();
      setObserver(null);
    };
  }, [measure, view, latest, scrollRef]);

  const measureRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !observer) return undefined;
      observer.observe(el);
      return () => observer.unobserve(el);
    },
    [observer],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a pin whose row no longer exists
    if (pinned !== null && pinned >= count) setPinned(null);
  }, [pinned, count]);

  const indices = useMemo(() => {
    const clamped = { start: Math.min(range.start, count), end: Math.min(range.end, count) };
    if (pinMode === 'separate') return withPinned(clamped, pinned, count);
    const r = extendRange(clamped, pinned, PIN_REACH, count);
    return Array.from({ length: Math.max(0, r.end - r.start) }, (_, k) => r.start + k);
  }, [range, pinned, count, pinMode]);

  const pin = useCallback((index: number | null) => setPinned(index), []);

  const scrollToIndex = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- reads the latest-value ref on purpose; the callback must stay stable
    (index: number, { align = 'auto', behavior = 'auto' }: ScrollToIndexOptions = {}) => {
      /** Scrolls the remaining distance to the row, unless it is within minMove px. */
      const jump = (minMove: number): void => {
        const { offsets: o, count: n, gap: g } = latest.current;
        if (n === 0) return;
        const i = Math.min(n - 1, Math.max(0, Math.floor(index)));
        const v = view();
        if (!v) return;
        const size = o[i + 1] - o[i] - (i < n - 1 ? g : 0);
        const d = scrollDelta(v.listTop + o[i], size, v.viewTop, v.viewBottom, align);
        if (d === 0 || Math.abs(d) <= minMove) return;
        const scroller = scrollRef?.current;
        if (scroller) scroller.scrollBy({ top: d, behavior });
        else if (!scrollRef) window.scrollBy({ top: d, behavior });
      };
      jump(0);
      // Measured rows replace their estimates once rendered: correct the aim on the next frame.
      if (measure && behavior === 'auto') requestAnimationFrame(() => jump(1));
    },
    [latest, view, scrollRef, measure],
  );

  return { indices, range, total, offsetOf, sizeOf, measureRef, pin, scrollToIndex };
}

export interface VirtualListProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** How many rows there are. */
  count: number;
  /** Renders row `index`. Keep it stable (useCallback): only the rendered rows call it. */
  renderItem: (index: number) => ReactNode;
  /** A stable key for row `index` (the row's id). Default: the index. Measured heights are kept per key. */
  itemKey?: (index: number) => string | number;
  /** Row height in px: a number for rows that are all the same height, or a function returning each
   *  row's height (or estimate, with `measure`). Do not include `gap`. */
  itemSize: number | ((index: number) => number);
  /** Measures every rendered row and uses its real height (rows that wrap or expand). Default false. */
  measure?: boolean;
  /** Space between rows in px. Default 0. */
  gap?: number;
  /** Height of the list's own scroll box (px or any CSS length). Leave it out to scroll with the page. */
  height?: number | string;
  /** Rows rendered above and below the visible ones. Default 6. */
  overscan?: number;
  /** Rows rendered on the server and before the first measurement. Default 20. */
  initialCount?: number;
  /** Called with the rendered range (start included, end excluded) when it changes: load more when end nears count. */
  onRangeChange?: (start: number, end: number) => void;
  /** Shown instead of the list when count is 0. Default: nothing. */
  empty?: ReactNode;
  /** Receives { scrollToIndex }. */
  apiRef?: Ref<VirtualListHandle>;
  /** Accessible name of the list (role="list"). Give this or aria-labelledby. */
  'aria-label'?: string;
  /** Id of the element that names the list. */
  'aria-labelledby'?: string;
  /** Classes for the root (the scroll box when `height` is set). */
  className?: string;
  /** Classes for each row wrapper. */
  itemClassName?: string;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
}

/** A long list that renders only the rows near the viewport, in its own scroll box or with the page. */
export function VirtualList({
  count,
  renderItem,
  itemKey = byIndex,
  itemSize,
  measure = false,
  gap = 0,
  height,
  overscan = 6,
  initialCount = 20,
  onRangeChange,
  empty,
  apiRef,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  itemClassName,
  ref,
  style,
  ...rest
}: VirtualListProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const self = height !== undefined;
  const rows = useVirtualRows({
    count,
    itemSize,
    getKey: itemKey,
    measure,
    gap,
    overscan,
    initialCount,
    scrollRef: self ? rootRef : null,
    listRef,
    pinMode: 'separate',
    onRangeChange,
  });
  const { pin, scrollToIndex } = rows;
  useImperativeHandle(apiRef, () => ({ scrollToIndex }), [scrollToIndex]);

  const labelled = !!(ariaLabel || ariaLabelledBy);
  useEffect(() => {
    if (typeof itemSize === 'number' && !(itemSize > 0)) warnOnce('virtual-size', 'VirtualList: itemSize must be a positive number of pixels.');
    if (!labelled) warnOnce('virtual-label', 'VirtualList: give the list an aria-label or aria-labelledby.');
  }, [itemSize, labelled]);

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const list = listRef.current;
    const row = (e.target as Element).closest<HTMLElement>('[data-index]');
    if (list && row && list.contains(row)) pin(Number(row.dataset.index));
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    // A window or tab switch blurs with no relatedTarget while the element stays active: keep the row mounted.
    if (!next && (!document.hasFocus() || document.activeElement === e.target)) return;
    if (!next || !listRef.current?.contains(next)) pin(null);
  };

  const rootStyle = self ? { ...style, height, overflowY: 'auto' as const, overflowAnchor: 'none' as const, overscrollBehavior: 'contain' as const } : style;

  return (
    <div
      {...rest}
      ref={mergeRefs(ref, rootRef)}
      style={rootStyle}
      tabIndex={self ? (count > 0 ? 0 : undefined) : rest.tabIndex}
      className={cn('relative', self && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent', className)}
    >
      {count === 0 && empty != null ? (
        empty
      ) : (
        <div
          ref={listRef}
          role="list"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{ position: 'relative', height: rows.total }}
        >
          {rows.indices.map((i) => (
            <div
              key={itemKey(i)}
              ref={measure ? rows.measureRef : undefined}
              role="listitem"
              data-index={i}
              aria-posinset={i + 1}
              aria-setsize={count}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: 0,
                insetInlineStart: 0,
                width: '100%',
                transform: `translateY(${rows.offsetOf(i)}px)`,
                height: measure ? undefined : rows.sizeOf(i),
              }}
            >
              {renderItem(i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
