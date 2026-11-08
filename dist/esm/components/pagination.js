"use client";

// src/components/pagination.tsx
import { useCallback, useRef, useState } from "react";
import { cn } from "../cn.js";
import { useIsoLayoutEffect } from "./client.js";
import { useStrings } from "./provider.js";
import { PAGING_STRINGS } from "./strings.js";
import { paginationRange } from "./pagination-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var SIZE = { sm: "h-8 min-w-8 text-xs", md: "h-9 min-w-9 text-sm" };
function controlClass(size, current, disabled) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center rounded-lg px-2 font-medium tabular-nums transition-colors duration-150",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    SIZE[size],
    current ? "bg-th-accent text-th-on-accent forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]" : "text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
    disabled && "pointer-events-none cursor-not-allowed text-th-ghost"
  );
}
function Chevron({ dir }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      className: "rtl:-scale-x-100",
      children: /* @__PURE__ */ jsx("path", { d: dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6" })
    }
  );
}
function clampPage(p, count) {
  const n = Number.isFinite(p) ? Math.floor(p) : 1;
  return Math.min(Math.max(1, n), Math.max(1, count));
}
function Pagination({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageCount,
  siblings = 1,
  boundaries = 1,
  size = "md",
  renderLink,
  compact: compactProp,
  disabled = false,
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  compactLabel,
  className,
  ref,
  ...rest
}) {
  const strings = useStrings(PAGING_STRINGS);
  const [pageState, setPageState] = useState(defaultPage);
  const navRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
  const count = Math.max(0, Math.floor(pageCount));
  const page = clampPage(pageProp ?? pageState, count);
  const empty = count < 1;
  const setRefs = useCallback(
    (node) => {
      navRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );
  useIsoLayoutEffect(() => {
    const el = navRef.current;
    if (compactProp !== void 0 || !el || typeof ResizeObserver === "undefined") return;
    const measure = (w) => setNarrow(w > 0 && w < 400);
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== void 0) measure(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compactProp, empty]);
  if (empty) return null;
  const compact = compactProp ?? narrow;
  function go(next2) {
    if (disabled) return;
    const target = clampPage(next2, count);
    if (pageProp === void 0) setPageState(target);
    if (target !== page) onPageChange?.(target);
  }
  const pageName = pageLabel ?? strings.pageLabel;
  const prevName = previousLabel ?? strings.previousPage;
  const nextName = nextLabel ?? strings.nextPage;
  function control(target, name, current, off, children, key) {
    const cls = controlClass(size, current, off);
    const state = current ? "active" : "inactive";
    if (renderLink && !off) {
      const props = {
        className: cls,
        "aria-label": name,
        "aria-current": current ? "page" : void 0,
        "data-state": state,
        children,
        onClick: () => go(target)
      };
      return /* @__PURE__ */ jsx("li", { children: renderLink(target, props) }, key);
    }
    return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: cls,
        "aria-label": name,
        "aria-current": current ? "page" : void 0,
        "data-state": state,
        disabled: off,
        "data-disabled": off ? "" : void 0,
        onClick: () => go(target),
        children
      }
    ) }, key);
  }
  const prev = control(page - 1, prevName, false, page <= 1 || disabled, /* @__PURE__ */ jsx(Chevron, { dir: "prev" }), "prev");
  const next = control(page + 1, nextName, false, page >= count || disabled, /* @__PURE__ */ jsx(Chevron, { dir: "next" }), "next");
  return /* @__PURE__ */ jsx(
    "nav",
    {
      "aria-label": label ?? strings.paginationLabel,
      "data-state": compact ? "compact" : "full",
      "data-disabled": disabled ? "" : void 0,
      ...rest,
      ref: setRefs,
      className: cn("w-full min-w-0", className),
      children: /* @__PURE__ */ jsxs("ul", { className: cn("flex flex-wrap items-center gap-1", compact && "justify-between"), children: [
        prev,
        compact ? /* @__PURE__ */ jsx("li", { className: "px-2 text-sm tabular-nums text-th-hi2", children: (compactLabel ?? ((p, c) => `${strings.pageLabel(p)} of ${c}`))(page, count) }) : paginationRange(page, count, siblings, boundaries).map(
          (slot) => typeof slot === "number" ? control(slot, pageName(slot), slot === page, disabled, slot, `p${slot}`) : /* @__PURE__ */ jsx("li", { "aria-hidden": "true", className: cn("inline-flex items-center justify-center text-th-hi3", "min-w-6", SIZE[size].split(" ")[0]), children: "\u2026" }, slot)
        ),
        next
      ] })
    }
  );
}
export {
  Pagination,
  paginationRange
};
