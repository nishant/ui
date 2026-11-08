"use client";

// src/components/more-sheet.tsx
import { cn } from "../cn.js";
import { FORCED_MARK } from "./display-classes.js";
import { Drawer } from "./drawer.js";
import { FOCUS, NavBadge, renderItem, visibleNavItems } from "./nav-items.js";
import { useStrings } from "./provider.js";
import { SHELL_STRINGS, THEME_STRINGS } from "./strings.js";
import { ThemeToggle } from "./theme-toggle.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function MoreSheet({ open, onClose, items, title, footer, renderLink }) {
  const strings = useStrings(SHELL_STRINGS, THEME_STRINGS);
  if (!open) return null;
  const shown = visibleNavItems(items);
  const row = (active) => cn(
    "flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 text-start transition-colors",
    active ? cn("bg-th-accent-soft text-th-accent", FORCED_MARK) : "text-th-hi hover:bg-th-elevated",
    FOCUS
  );
  return /* @__PURE__ */ jsx(
    Drawer,
    {
      side: "bottom",
      title: title ?? strings.more,
      onClose,
      bottomOffset: "var(--nish-bottom-nav-h, 0px)",
      footer: footer ?? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 px-5 py-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-th-hi", children: strings.theme }),
        /* @__PURE__ */ jsx(ThemeToggle, { phone: "segmented" })
      ] }),
      children: /* @__PURE__ */ jsx("ul", { className: "m-0 list-none p-2", children: shown.map((item) => /* @__PURE__ */ jsx("li", { children: renderItem(
        item,
        row(!!item.active),
        /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("span", { className: "relative inline-flex size-6 shrink-0 items-center justify-center", children: [
            item.icon,
            /* @__PURE__ */ jsx(NavBadge, { value: item.badge })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("span", { className: "block truncate text-sm font-medium", children: item.label }),
            item.hint ? /* @__PURE__ */ jsx("span", { className: cn("block truncate text-xs", item.active ? "text-th-accent/80" : "text-th-hi3"), children: item.hint }) : null
          ] })
        ] }),
        renderLink,
        onClose
      ) }, item.key)) })
    }
  );
}
export {
  MoreSheet
};
