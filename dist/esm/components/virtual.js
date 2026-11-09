"use client";

// src/components/virtual.tsx
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { flushSync } from "react-dom";
import { cn } from "../cn.js";
import {
  buildOffsets,
  extendRange,
  sameRange,
  scrollDelta,
  visibleRange,
  withPinned
} from "../virtual-range.js";
import { useIsoLayoutEffect } from "./client.js";
import { mergeRefs, warnOnce } from "./data-classes.js";
import { useLatest } from "./latest.js";
import { jsx } from "react/jsx-runtime";
var PIN_REACH = 100;
function rootPx(style, name) {
  const n = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(n) ? n : 0;
}
function windowInsets() {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") return { top: 0, bottom: 0 };
  const style = getComputedStyle(document.documentElement);
  const top = rootPx(style, "--nish-header-h") + rootPx(style, "--nish-sticky-extra");
  const raw = style.getPropertyValue("--nish-bottom-inset");
  const bottom = Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : rootPx(style, "--nish-bottom-nav-h") + rootPx(style, "--nish-bottom-bar-h");
  return { top, bottom };
}
var byIndex = (i) => i;
function useVirtualRows(options) {
  const { count, itemSize, getKey, measure, gap, overscan, initialCount, scrollRef, listRef, coverTop, pinMode, onRangeChange } = options;
  const [range, setRange] = useState(() => ({ start: 0, end: Math.min(count, initialCount) }));
  const [measured, setMeasured] = useState(() => /* @__PURE__ */ new Map());
  const [pinned, setPinned] = useState(null);
  const [observer, setObserver] = useState(null);
  const offsets = useMemo(
    () => buildOffsets(
      count,
      (i) => (measured.size === 0 ? void 0 : measured.get(getKey(i))) ?? (typeof itemSize === "number" ? itemSize : itemSize(i)),
      gap
    ),
    // getKey only matters once something is measured, so an unstable getKey must not rebuild fixed-size offsets
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, itemSize, measure ? getKey : null, gap, measured]
  );
  const total = offsets[count];
  const offsetOf = useCallback((i) => offsets[i], [offsets]);
  const sizeOf = useCallback((i) => offsets[i + 1] - offsets[i] - (i < count - 1 ? gap : 0), [offsets, count, gap]);
  const latest = useLatest({ offsets, range, getKey, coverTop, onRangeChange, count, overscan, gap });
  const view = useCallback(() => {
    const list = listRef.current;
    if (!list) return null;
    const listTop = list.getBoundingClientRect().top;
    const cover = latest.current.coverTop?.() ?? 0;
    let viewTop;
    let viewBottom;
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
  const update = useCallback(() => {
    const v = view();
    if (!v) return;
    const { offsets: o, count: n, overscan: os } = latest.current;
    const raw = visibleRange(o, v.top, v.bottom, os);
    const next = { start: Math.min(raw.start, n), end: Math.min(raw.end, n) };
    setRange((prev) => sameRange(prev, next) ? prev : next);
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
    const target = scroller ?? window;
    target.addEventListener("scroll", schedule, { passive: true });
    if (!scrollRef) window.addEventListener("resize", schedule);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(schedule);
      if (scroller) ro.observe(scroller);
      if (listRef.current) ro.observe(listRef.current);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule);
      if (!scrollRef) window.removeEventListener("resize", schedule);
      ro?.disconnect();
    };
  }, [scrollRef, listRef, update, hasList]);
  useEffect(() => {
    latest.current.onRangeChange?.(range.start, range.end);
  }, [range.start, range.end, latest]);
  useEffect(() => {
    if (!measure || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const v = view();
      const { offsets: o, getKey: keyOf, count: n, gap: g } = latest.current;
      const changes = /* @__PURE__ */ new Map();
      let delta = 0;
      for (const entry of entries) {
        const el = entry.target;
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
      flushSync(() => {
        setMeasured((prev) => {
          let next = null;
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
    (el) => {
      if (!el || !observer) return void 0;
      observer.observe(el);
      return () => observer.unobserve(el);
    },
    [observer]
  );
  useEffect(() => {
    if (pinned !== null && pinned >= count) setPinned(null);
  }, [pinned, count]);
  const indices = useMemo(() => {
    const clamped = { start: Math.min(range.start, count), end: Math.min(range.end, count) };
    if (pinMode === "separate") return withPinned(clamped, pinned, count);
    const r = extendRange(clamped, pinned, PIN_REACH, count);
    return Array.from({ length: Math.max(0, r.end - r.start) }, (_, k) => r.start + k);
  }, [range, pinned, count, pinMode]);
  const pin = useCallback((index) => setPinned(index), []);
  const scrollToIndex = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- reads the latest-value ref on purpose; the callback must stay stable
    (index, { align = "auto", behavior = "auto" } = {}) => {
      const jump = (minMove) => {
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
      if (measure && behavior === "auto") requestAnimationFrame(() => jump(1));
    },
    [latest, view, scrollRef, measure]
  );
  return { indices, range, total, offsetOf, sizeOf, measureRef, pin, scrollToIndex };
}
function VirtualList({
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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  itemClassName,
  ref,
  style,
  ...rest
}) {
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const self = height !== void 0;
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
    pinMode: "separate",
    onRangeChange
  });
  const { pin, scrollToIndex } = rows;
  useImperativeHandle(apiRef, () => ({ scrollToIndex }), [scrollToIndex]);
  const labelled = !!(ariaLabel || ariaLabelledBy);
  useEffect(() => {
    if (typeof itemSize === "number" && !(itemSize > 0)) warnOnce("virtual-size", "VirtualList: itemSize must be a positive number of pixels.");
    if (!labelled) warnOnce("virtual-label", "VirtualList: give the list an aria-label or aria-labelledby.");
  }, [itemSize, labelled]);
  const onFocus = (e) => {
    const list = listRef.current;
    const row = e.target.closest("[data-index]");
    if (list && row && list.contains(row)) pin(Number(row.dataset.index));
  };
  const onBlur = (e) => {
    const next = e.relatedTarget;
    if (!next && (!document.hasFocus() || document.activeElement === e.target)) return;
    if (!next || !listRef.current?.contains(next)) pin(null);
  };
  const rootStyle = self ? { ...style, height, overflowY: "auto", overflowAnchor: "none", overscrollBehavior: "contain" } : style;
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref: mergeRefs(ref, rootRef),
      style: rootStyle,
      tabIndex: self ? count > 0 ? 0 : void 0 : rest.tabIndex,
      className: cn("relative", self && "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent", className),
      children: count === 0 && empty != null ? empty : /* @__PURE__ */ jsx(
        "div",
        {
          ref: listRef,
          role: "list",
          "aria-label": ariaLabel,
          "aria-labelledby": ariaLabelledBy,
          onFocus,
          onBlur,
          style: { position: "relative", height: rows.total },
          children: rows.indices.map((i) => /* @__PURE__ */ jsx(
            "div",
            {
              ref: measure ? rows.measureRef : void 0,
              role: "listitem",
              "data-index": i,
              "aria-posinset": i + 1,
              "aria-setsize": count,
              className: itemClassName,
              style: {
                position: "absolute",
                top: 0,
                insetInlineStart: 0,
                width: "100%",
                transform: `translateY(${rows.offsetOf(i)}px)`,
                height: measure ? void 0 : rows.sizeOf(i)
              },
              children: renderItem(i)
            },
            itemKey(i)
          ))
        }
      )
    }
  );
}
export {
  VirtualList,
  useVirtualRows
};
