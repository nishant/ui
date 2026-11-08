"use client";

// src/components/breadcrumbs.tsx
import { Children, Fragment, cloneElement, isValidElement, useCallback, useRef, useState } from "react";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { useIsoLayoutEffect } from "./client.js";
import { DropdownMenu, MenuItem } from "./menu.js";
import { useStrings } from "./provider.js";
import { SHELL_STRINGS, PAGING_STRINGS } from "./strings.js";
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
var LINK = cn(
  "inline-flex items-center rounded text-th-hi3 transition-colors duration-150 hover:text-th-hi hover:underline",
  "pointer-coarse:min-h-11"
);
var CURRENT = "inline-flex items-center font-medium text-th-hi pointer-coarse:min-h-11";
function Chevron() {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: 14,
      height: 14,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      className: "shrink-0 text-th-ghost rtl:-scale-x-100",
      children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function Crumb({
  item,
  current,
  renderLink
}) {
  const href = item.href !== void 0 ? safeUrl(item.href) : null;
  if (current) {
    return /* @__PURE__ */ jsx("span", { "aria-current": "page", className: cn(CURRENT, "min-w-0 truncate"), children: item.label });
  }
  if (href !== null) {
    const props = { className: cn(LINK, "min-w-0"), href, children: item.label, onClick: item.onClick };
    if (renderLink) return /* @__PURE__ */ jsx(Fragment2, { children: renderLink(item, props) });
    return /* @__PURE__ */ jsx("a", { ...props });
  }
  if (item.onClick) {
    return /* @__PURE__ */ jsx("button", { type: "button", className: cn(LINK, "min-w-0"), onClick: item.onClick, children: item.label });
  }
  return /* @__PURE__ */ jsx("span", { className: "inline-flex min-w-0 items-center text-th-hi3 pointer-coarse:min-h-11", children: item.label });
}
function Breadcrumbs({
  items,
  children,
  renderLink,
  separator,
  maxItems = 4,
  collapse = "auto",
  label,
  moreLabel,
  className,
  ref,
  ...rest
}) {
  const strings = useStrings(SHELL_STRINGS, PAGING_STRINGS);
  const navRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
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
    if (collapse !== "auto" || !el || typeof ResizeObserver === "undefined") return;
    const measure = (w) => setNarrow(w > 0 && w < 640);
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== void 0) measure(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapse]);
  const sep = separator ?? /* @__PURE__ */ jsx(Chevron, {});
  const nodes = [];
  if (items) {
    const limit = Math.max(2, Math.floor(maxItems));
    const shouldCollapse = items.length > limit && (collapse === "always" || collapse === "auto" && narrow);
    const tail = Math.max(1, limit - 2);
    const hidden = shouldCollapse ? items.slice(1, items.length - tail) : [];
    const shown = shouldCollapse ? [items[0], null, ...items.slice(items.length - tail)] : items;
    shown.forEach((item, i) => {
      if (item === null) {
        nodes.push(
          /* @__PURE__ */ jsx(
            DropdownMenu,
            {
              "aria-label": moreLabel ?? strings.more,
              trigger: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": moreLabel ?? strings.more,
                  className: cn(LINK, "min-h-8 min-w-8 justify-center px-1 pointer-coarse:min-w-11"),
                  children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2026" })
                }
              ),
              children: hidden.map((h, j) => /* @__PURE__ */ jsx(
                MenuItem,
                {
                  onSelect: (e) => {
                    if (h.onClick) h.onClick(e);
                    else {
                      const href = h.href !== void 0 ? safeUrl(h.href) : null;
                      if (href !== null && typeof window !== "undefined") window.location.assign(href);
                    }
                  },
                  children: h.label
                },
                j
              ))
            },
            "more"
          )
        );
      } else {
        nodes.push(/* @__PURE__ */ jsx(Crumb, { item, current: i === shown.length - 1, renderLink }, `i${i}`));
      }
    });
  } else {
    const kids = Children.toArray(children);
    kids.forEach((k, i) => {
      const last = i === kids.length - 1;
      let node = k;
      if (last) {
        node = isValidElement(k) ? cloneElement(k, { "aria-current": "page" }) : /* @__PURE__ */ jsx("span", { "aria-current": "page", className: CURRENT, children: k });
      }
      nodes.push(/* @__PURE__ */ jsx(Fragment, { children: node }, i));
    });
  }
  return /* @__PURE__ */ jsx("nav", { "aria-label": label ?? strings.breadcrumbs, ...rest, ref: setRefs, className: cn("min-w-0 text-sm", className), children: /* @__PURE__ */ jsx("ol", { className: "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5", children: nodes.map((node, i) => /* @__PURE__ */ jsxs("li", { className: "flex min-w-0 items-center gap-1.5", children: [
    i > 0 && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", "data-separator": "", className: "flex shrink-0 items-center text-th-ghost", children: sep }),
    node
  ] }, i)) }) });
}
export {
  Breadcrumbs
};
