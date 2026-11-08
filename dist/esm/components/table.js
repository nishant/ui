"use client";

// src/components/table.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { mergeRefs, tableClass, tableInternals } from "./data-classes.js";
import { useScrollEdges } from "./layout-vars.js";
import { tableClass as tableClass2 } from "./data-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var { ALIGN, STICKY_COL, WRAP, STICKY, TABLE, ZEBRA, TH, TD, PAD, TR, TR_INTERACTIVE } = tableInternals;
var ROW_TONE = tableClass.tone;
var TableCtx = /* @__PURE__ */ createContext({ dense: false });
function TableWrap({
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
}) {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useScrollEdges(ref);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setOverflows(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const name = label ?? rest["aria-label"];
  const css = {
    // With a pinned first column the left fade would wash it out, so only the right edge fades.
    ...fade && stickyFirstColumn ? { "--nish-fade-start": "#000" } : null,
    ...style,
    ...maxHeight !== void 0 ? { maxHeight } : null,
    ...minWidth !== void 0 ? { "--nish-table-min": typeof minWidth === "number" ? `${minWidth}px` : minWidth } : null
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: mergeRefs(ref, forwardedRef),
      tabIndex: overflows ? 0 : void 0,
      role: overflows && name ? "region" : void 0,
      ...rest,
      "aria-label": name,
      className: cn(
        WRAP,
        fade && "nish-scroll-fade",
        minWidth !== void 0 && "[&>table]:min-w-[var(--nish-table-min)]",
        stickyHeader && STICKY,
        stickyFirstColumn && STICKY_COL,
        className
      ),
      style: css,
      children
    }
  );
}
function Table({ dense = false, zebra = false, className, ...rest }) {
  const value = useMemo(() => ({ dense }), [dense]);
  return /* @__PURE__ */ jsx(TableCtx.Provider, { value, children: /* @__PURE__ */ jsx("table", { className: cn(TABLE, zebra && ZEBRA, className), ...rest }) });
}
var SORT_LABEL = { asc: "ascending", desc: "descending" };
function Th({ align, numeric = false, sort, onSort, className, children, scope = "col", ...rest }) {
  const { dense } = useContext(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  const sortable = onSort !== void 0 || sort !== void 0;
  return /* @__PURE__ */ jsx(
    "th",
    {
      scope,
      "aria-sort": sortable ? sort ? SORT_LABEL[sort] : "none" : void 0,
      className: cn(TH, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "tabular-nums", className),
      ...rest,
      children: onSort ? /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: onSort,
          className: cn(
            "-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wider transition-colors hover:text-th-hi pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:outline-th-accent",
            sort && "text-th-hi",
            a === "right" && "flex-row-reverse"
          ),
          children: [
            children,
            /* @__PURE__ */ jsx(SortMark, { sort: sort || false })
          ]
        }
      ) : children
    }
  );
}
function SortMark({ sort }) {
  return /* @__PURE__ */ jsxs("svg", { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false", className: "shrink-0", children: [
    /* @__PURE__ */ jsx("path", { d: "M2 4 5 1l3 3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "asc" ? 1 : 0.35 }),
    /* @__PURE__ */ jsx("path", { d: "M2 6l3 3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "desc" ? 1 : 0.35 })
  ] });
}
function Td({ align, numeric = false, nowrap = false, className, ...rest }) {
  const { dense } = useContext(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  return /* @__PURE__ */ jsx(
    "td",
    {
      className: cn(TD, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "whitespace-nowrap tabular-nums", nowrap && "whitespace-nowrap", className),
      ...rest
    }
  );
}
function Tr({ tone, interactive = false, muted = false, className, ...rest }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      className: cn(TR, interactive && TR_INTERACTIVE, muted && "text-th-hi3", tone && ROW_TONE[tone], className),
      ...rest
    }
  );
}
export {
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  tableClass2 as tableClass
};
