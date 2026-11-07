"use client";

// src/components/virtual-table.tsx
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { useIsoLayoutEffect } from "./client.js";
import { sortRows } from "./data-classes.js";
import { useNishStrings } from "./provider.js";
import { useLatest } from "./latest.js";
import { Table, TableWrap, Td, Th, Tr } from "./table.js";
import { useVirtualRows } from "./virtual.js";
import { jsx, jsxs } from "react/jsx-runtime";
var HIDE_BELOW = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };
var ROW_FOCUS = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-th-accent";
var INTERACTIVE_CHILD = "a,button,input,select,textarea,[role=button]";
function VirtualTable({
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
}) {
  const t = useNishStrings();
  const size = rowHeight ?? (onRowClick ? 44 : dense ? 33 : 41);
  const [innerSort, setInnerSort] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const external = sort !== void 0 || onSortChange !== void 0;
  const current = sort !== void 0 ? sort : innerSort;
  const sortKey = current?.key;
  const sortDir = current?.dir;
  const changeSort = (next) => {
    setInnerSort(next);
    onSortChange?.(next);
    const header = columns.find((c) => c.key === next?.key)?.header ?? "";
    setAnnouncement(t.sortAnnounce(header, next ? next.dir : null));
  };
  const toggle = (key) => changeSort(current?.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const sorted = useMemo(() => {
    if (external || !sortKey || !sortDir) return rows;
    const get = columns.find((c) => c.key === sortKey)?.sortValue;
    return get ? sortRows(rows, get, sortDir) : rows;
  }, [rows, sortKey, sortDir, external]);
  const showTable = !error && !loading && sorted.length > 0;
  const count = showTable ? sorted.length : 0;
  const scrollRef = useRef(null);
  const headRef = useRef(null);
  const bodyRef = useRef(null);
  const pendingFocus = useRef(null);
  const hadFocus = useRef(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const keyRef = useLatest(rowKey);
  const getKey = useCallback((i) => keyRef.current(sorted[i]), [sorted, keyRef]);
  const coverTop = useCallback(() => headRef.current?.offsetHeight ?? 0, []);
  const initialCount = Math.min(40, Math.ceil((typeof height === "number" ? height : 480) / size));
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
    pinMode: "contiguous",
    onRangeChange
  });
  const { indices, total, offsetOf, sizeOf, measureRef, pin, scrollToIndex } = virtual;
  useImperativeHandle(apiRef, () => ({ scrollToIndex }), [scrollToIndex]);
  const first = indices[0] ?? 0;
  const last = indices[indices.length - 1] ?? -1;
  const topSpace = indices.length > 0 ? offsetOf(first) : 0;
  const bottomSpace = Math.max(0, total - (last >= 0 ? offsetOf(last) + sizeOf(last) : 0));
  const interactive = !!onRowClick;
  const tabbable = indices.includes(focusIndex) ? focusIndex : first;
  useEffect(() => {
    if (count > 0 && focusIndex > count - 1) setFocusIndex(count - 1);
  }, [count, focusIndex]);
  useIsoLayoutEffect(() => {
    const body = bodyRef.current;
    if (pendingFocus.current !== null) {
      const row = body?.querySelector(`tr[data-index="${pendingFocus.current}"]`);
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
  const onBodyFocus = (e) => {
    hadFocus.current = true;
    const row = e.target.closest("tr[data-index]");
    if (row && bodyRef.current?.contains(row)) pin(Number(row.dataset.index));
  };
  const onBodyBlur = (e) => {
    const next = e.relatedTarget;
    if (next ? !bodyRef.current?.contains(next) : e.target.isConnected) {
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
  const goTo = (next) => {
    const n = Math.min(count - 1, Math.max(0, next));
    pendingFocus.current = n;
    setFocusIndex(n);
    pin(n);
    scrollToIndex(n);
  };
  const onRowKeyDown = (e, row, i) => {
    if (e.target !== e.currentTarget) return;
    const key = e.key;
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      onRowClick?.(row, i);
      return;
    }
    const page = key === "PageDown" || key === "PageUp" ? pageSize() : 1;
    const target = key === "ArrowDown" || key === "PageDown" ? i + page : key === "ArrowUp" || key === "PageUp" ? i - page : key === "Home" ? 0 : key === "End" ? count - 1 : null;
    if (target === null) return;
    e.preventDefault();
    goTo(target);
  };
  const onRowClickEvent = (e, row, i) => {
    const inner = e.target.closest(INTERACTIVE_CHILD);
    if (inner && inner !== e.currentTarget && e.currentTarget.contains(inner)) return;
    setFocusIndex(i);
    onRowClick?.(row, i);
  };
  let content;
  if (error) {
    content = /* @__PURE__ */ jsxs("div", { role: "alert", className: "grid justify-items-center gap-2 rounded-xl bg-th-loss-soft p-8", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: error.message }),
      error.onRetry ? /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: error.onRetry,
          className: "rounded-full border border-th-line-strong px-3 py-1 pointer-coarse:min-h-11",
          children: t.retry
        }
      ) : null
    ] });
  } else if (loading) {
    content = /* @__PURE__ */ jsxs("div", { role: "status", children: [
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: t.loadingNamed(label) }),
      /* @__PURE__ */ jsx("div", { className: "nish-skeleton h-56 rounded-xl" })
    ] });
  } else if (sorted.length === 0) {
    content = empty ?? /* @__PURE__ */ jsx("p", { className: "rounded-xl border border-dashed border-th-line p-8 text-center text-sm", children: t.nothingHere });
  } else {
    const spacer = (px) => px > 0 ? /* @__PURE__ */ jsx("tr", { "aria-hidden": "true", "data-virtual-spacer": "", children: /* @__PURE__ */ jsx("td", { colSpan: columns.length, style: { height: px, padding: 0, border: 0 } }) }) : null;
    content = /* @__PURE__ */ jsx(TableWrap, { ref: scrollRef, style: { overflowAnchor: "none" }, maxHeight: height, stickyHeader: true, minWidth, stickyFirstColumn, label, children: /* @__PURE__ */ jsxs(Table, { dense, "aria-label": label, "aria-rowcount": sorted.length + 1, className: "table-fixed", children: [
      /* @__PURE__ */ jsx("thead", { ref: headRef, children: /* @__PURE__ */ jsx("tr", { "aria-rowindex": 1, children: columns.map((c) => /* @__PURE__ */ jsx(
        Th,
        {
          numeric: c.numeric,
          sort: c.sortValue ? current?.key === c.key ? current.dir : false : void 0,
          onSort: c.sortValue ? () => toggle(c.key) : void 0,
          className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow]),
          style: c.width ? { width: c.width } : void 0,
          children: c.header
        },
        c.key
      )) }) }),
      /* @__PURE__ */ jsxs("tbody", { ref: bodyRef, onFocus: interactive ? onBodyFocus : void 0, onBlur: interactive ? onBodyBlur : void 0, children: [
        spacer(topSpace),
        indices.map((i) => {
          const row = sorted[i];
          if (row === void 0) return null;
          return /* @__PURE__ */ jsx(
            Tr,
            {
              ref: measure ? measureRef : void 0,
              tone: rowTone?.(row),
              interactive,
              "data-index": i,
              style: measure ? void 0 : { height: size },
              "aria-rowindex": i + 2,
              tabIndex: interactive ? i === tabbable ? 0 : -1 : void 0,
              className: cn(zebra && i % 2 === 1 && "bg-th-elevated/50", interactive && ROW_FOCUS),
              onClick: interactive ? (e) => onRowClickEvent(e, row, i) : void 0,
              onKeyDown: interactive ? (e) => onRowKeyDown(e, row, i) : void 0,
              children: columns.map((c) => /* @__PURE__ */ jsx(
                Td,
                {
                  numeric: c.numeric,
                  className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow], !measure && "truncate"),
                  children: c.cell(row)
                },
                c.key
              ))
            },
            rowKey(row)
          );
        }),
        spacer(bottomSpace)
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, className, children: [
    content,
    /* @__PURE__ */ jsx("div", { role: "status", className: "sr-only", children: announcement })
  ] });
}
export {
  VirtualTable
};
