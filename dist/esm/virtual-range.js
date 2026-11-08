// src/virtual-range.ts
function buildOffsets(count, sizeOf, gap = 0) {
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
function indexAt(offsets, y) {
  const count = offsets.length - 1;
  if (count <= 0) return -1;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = lo + hi + 1 >> 1;
    if (offsets[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function visibleRange(offsets, top, bottom, overscan) {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: 0 };
  const total = offsets[count];
  if (bottom <= 0) return { start: 0, end: Math.min(count, overscan) };
  if (top >= total) return { start: Math.max(0, count - overscan), end: count };
  const first = indexAt(offsets, Math.max(0, top));
  const last = indexAt(offsets, Math.max(0, Math.min(total, bottom) - 0.5));
  return { start: Math.max(0, first - overscan), end: Math.min(count, last + 1 + overscan) };
}
function withPinned(range, pinned, count) {
  const out = [];
  const end = Math.min(range.end, count);
  const valid = pinned !== null && Number.isInteger(pinned) && pinned >= 0 && pinned < count;
  const outside = valid && (pinned < range.start || pinned >= end);
  if (outside && pinned < range.start) out.push(pinned);
  for (let i = Math.max(0, range.start); i < end; i++) out.push(i);
  if (outside && pinned >= end) out.push(pinned);
  return out;
}
function extendRange(range, index, maxGap, count) {
  if (index === null || !Number.isInteger(index) || index < 0 || index >= count) return range;
  if (index >= range.start && index < range.end) return range;
  if (index < range.start) return range.start - index <= maxGap ? { start: index, end: range.end } : range;
  return index - range.end + 1 <= maxGap ? { start: range.start, end: index + 1 } : range;
}
function scrollDelta(itemTop, itemSize, viewTop, viewBottom, align) {
  let mode = align;
  if (mode === "auto") {
    if (itemTop >= viewTop && itemTop + itemSize <= viewBottom) return 0;
    mode = itemTop < viewTop || itemSize > viewBottom - viewTop ? "start" : "end";
  }
  if (mode === "start") return itemTop - viewTop;
  if (mode === "end") return itemTop + itemSize - viewBottom;
  return itemTop + itemSize / 2 - (viewTop + viewBottom) / 2;
}
function sameRange(a, b) {
  return a.start === b.start && a.end === b.end;
}
export {
  buildOffsets,
  extendRange,
  indexAt,
  sameRange,
  scrollDelta,
  visibleRange,
  withPinned
};
