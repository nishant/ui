"use client";

// src/components/filters.tsx
import { useState } from "react";
import { cn } from "../cn.js";
import { SearchInput } from "./forms.js";
import { NARROW_QUERY, useMediaQuery } from "./hooks.js";
import { Drawer } from "./drawer.js";
import { Badge, Button } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var LG_QUERY = "(max-width: 1023.98px)";
function FunnelIcon({ size = 16, ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children: /* @__PURE__ */ jsx("path", { d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" })
    }
  );
}
function FilterSheet({ open, onClose, title, children, onClear, activeCount, resultLabel }) {
  const strings = useNishStrings();
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    Drawer,
    {
      side: "bottom",
      size: "lg",
      title: title ?? strings.filters,
      onClose,
      footer: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        onClear ? /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: onClear, disabled: activeCount === 0, children: strings.clear }) : null,
        /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: onClose, className: "ms-auto", children: resultLabel ?? strings.done })
      ] }),
      children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children })
    }
  );
}
function FilterBar({
  search,
  children,
  activeCount = 0,
  onClear,
  trailing,
  sticky = false,
  sheetTitle,
  sheetBelow = "md",
  summary,
  className,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const compact = useMediaQuery(sheetBelow === "lg" ? LG_QUERY : NARROW_QUERY);
  const [open, setOpen] = useState(false);
  const hasChildren = children != null && children !== false;
  const searchBox = search ? /* @__PURE__ */ jsx(
    SearchInput,
    {
      value: search.value,
      onChange: (v) => search.onChange(v),
      placeholder: search.placeholder,
      "aria-label": search.label ?? search.placeholder ?? strings.search,
      className: compact ? "min-w-[10rem] flex-1 basis-40" : "w-full max-w-xs"
    }
  ) : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      className: cn(sticky && "sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] border-b border-th-line bg-th-bg py-2", className),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          searchBox,
          compact ? /* @__PURE__ */ jsxs(Fragment, { children: [
            hasChildren ? /* @__PURE__ */ jsxs(Button, { variant: "secondary", size: "md", icon: /* @__PURE__ */ jsx(FunnelIcon, {}), onClick: () => setOpen(true), "aria-haspopup": "dialog", "aria-expanded": open, className: "min-h-11 shrink-0", children: [
              strings.filters,
              activeCount > 0 ? /* @__PURE__ */ jsx(Badge, { tone: "accent", "aria-label": strings.activeCount(activeCount), children: activeCount }) : null
            ] }) : null,
            trailing
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            children,
            activeCount > 0 && onClear ? /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: onClear, children: strings.clearFilters }) : null,
            trailing ? /* @__PURE__ */ jsx("div", { className: "ms-auto flex items-center gap-2", children: trailing }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { "aria-live": "polite", className: cn("text-sm text-th-hi3", summary ? "mt-2" : void 0), children: summary || null }),
        compact && hasChildren ? /* @__PURE__ */ jsx(FilterSheet, { open, onClose: () => setOpen(false), title: sheetTitle ?? strings.filters, onClear, activeCount, children }) : null
      ]
    }
  );
}
export {
  FilterBar,
  FilterSheet
};
