// Pure math of VirtualList and VirtualTable: row offsets, the visible range and scroll targets. No directive, no React.

/** A half-open range of row indices: start included, end excluded. */
export interface VirtualRange {
  start: number;
  end: number;
}

/** Row tops: out[i] is the top of row i in px, out[count] the total height. `gap` px sits between
 *  rows, not after the last one. Negative sizes count as 0. */
export function buildOffsets(count: number, sizeOf: (index: number) => number, gap = 0): Float64Array {
  const n = Math.max(0, Math.floor(count));
  const out = new Float64Array(n + 1);
  let y = 0;
  for (let i = 0; i < n; i++) {
    out[i] = y;
    const size = sizeOf(i);
    y += (size > 0 ? size : 0) + (i < n - 1 ? gap : 0);
  }
  out[n] = y;
  return out;
}

/** The last index i with offsets[i] <= y, clamped to [0, count - 1]; -1 when count is 0. Binary search. */
export function indexAt(offsets: Float64Array, y: number): number {
  const count = offsets.length - 1;
  if (count <= 0) return -1;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Rows that intersect [top, bottom) (px from the list top), widened by `overscan` rows on each side.
 *  count 0: {0,0}. Window entirely above the list (bottom <= 0): {0, min(count, overscan)}.
 *  Entirely below (top >= total): {max(0, count - overscan), count}. */
export function visibleRange(offsets: Float64Array, top: number, bottom: number, overscan: number): VirtualRange {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: 0 };
  const total = offsets[count];
  if (bottom <= 0) return { start: 0, end: Math.min(count, overscan) };
  if (top >= total) return { start: Math.max(0, count - overscan), end: count };
  const first = indexAt(offsets, Math.max(0, top));
  const last = indexAt(offsets, Math.max(0, Math.min(total, bottom) - 0.5));
  return { start: Math.max(0, first - overscan), end: Math.min(count, last + 1 + overscan) };
}

/** Indices to render, ascending, no duplicates: the range plus `pinned` when it is a valid index
 *  outside the range (VirtualList). */
export function withPinned(range: VirtualRange, pinned: number | null, count: number): number[] {
  const out: number[] = [];
  const end = Math.min(range.end, count);
  const valid = pinned !== null && Number.isInteger(pinned) && pinned >= 0 && pinned < count;
  const outside = valid && (pinned < range.start || pinned >= end);
  if (outside && pinned < range.start) out.push(pinned);
  for (let i = Math.max(0, range.start); i < end; i++) out.push(i);
  if (outside && pinned >= end) out.push(pinned);
  return out;
}

/** The range widened to include `index` when index is within `maxGap` rows of it; otherwise the range
 *  unchanged (VirtualTable keeps rows contiguous). */
export function extendRange(range: VirtualRange, index: number | null, maxGap: number, count: number): VirtualRange {
  if (index === null || !Number.isInteger(index) || index < 0 || index >= count) return range;
  if (index >= range.start && index < range.end) return range;
  if (index < range.start) return range.start - index <= maxGap ? { start: index, end: range.end } : range;
  return index - range.end + 1 <= maxGap ? { start: range.start, end: index + 1 } : range;
}

export type ScrollAlign = 'auto' | 'start' | 'center' | 'end';

/** Px to scroll (positive = down) so the row [itemTop, itemTop + itemSize) sits at `align` in the view
 *  [viewTop, viewBottom), all in the same coordinates. 'auto': 0 when the row is fully visible, else
 *  the smaller move that shows it ('start' if it is above, 'end' if below; a row taller than the view
 *  aligns its start). */
export function scrollDelta(itemTop: number, itemSize: number, viewTop: number, viewBottom: number, align: ScrollAlign): number {
  let mode = align;
  if (mode === 'auto') {
    if (itemTop >= viewTop && itemTop + itemSize <= viewBottom) return 0;
    mode = itemTop < viewTop || itemSize > viewBottom - viewTop ? 'start' : 'end';
  }
  if (mode === 'start') return itemTop - viewTop;
  if (mode === 'end') return itemTop + itemSize - viewBottom;
  return itemTop + itemSize / 2 - (viewTop + viewBottom) / 2;
}

/** True when both ranges have the same start and end. */
export function sameRange(a: VirtualRange, b: VirtualRange): boolean {
  return a.start === b.start && a.end === b.end;
}
