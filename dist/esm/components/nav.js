"use client";

// src/components/nav.tsx
import {
  Fragment,
  useEffect,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { mergeRefs } from "./data-classes.js";
import { FORCED_MARK } from "./display-classes.js";
import { chipClass } from "./forms.js";
import { useMediaQuery } from "./hooks.js";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "./icons.js";
import { useHeightVar, useScrollEdges } from "./layout-vars.js";
import { navRailItemClass } from "./nav-classes.js";
import { NavBadge, FOCUS, renderItem, useEndSide, visibleNavItems } from "./nav-items.js";
import { IconButton } from "./primitives.js";
import { useStrings } from "./provider.js";
import { SHELL_STRINGS } from "./strings.js";
import { Tooltip } from "./tooltip.js";
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
var MAX_QUERY = {
  md: "(max-width: 767px)",
  lg: "(max-width: 1023px)"
};
var HIDE_FROM = { md: "md:hidden", lg: "lg:hidden" };
var RAIL_SHOW = { sm: "sm:flex", md: "md:flex", lg: "lg:flex" };
var RAIL_HIDE = { md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden" };
function MoreDots() {
  return /* @__PURE__ */ jsxs("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ jsx("circle", { cx: "5", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx("circle", { cx: "19", cy: "12", r: "1.8" })
  ] });
}
function BottomNav({
  items,
  more,
  trailing,
  hideFrom = "md",
  label,
  renderLink,
  className,
  ref: refProp,
  ...rest
}) {
  const strings = useStrings(SHELL_STRINGS);
  const ref = useRef(null);
  const visible = useMediaQuery(MAX_QUERY[hideFrom]);
  useHeightVar(ref, "--nish-bottom-nav-h", visible);
  const shown = visibleNavItems(items);
  const pill = (active) => cn(
    "flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-2xs leading-tight transition-colors",
    active ? cn("bg-th-accent-soft font-medium text-th-accent", FORCED_MARK) : "text-th-hi3"
  );
  const cell = cn("flex min-h-14 min-w-0 flex-1 items-center justify-center px-0.5 pointer-coarse:active:scale-[0.97] transition-transform", FOCUS);
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "aria-label": label ?? strings.sections,
      "data-nish-bar": "",
      "data-nish-print": "hide",
      className: cn(
        "fixed inset-x-0 bottom-0 z-[var(--nish-z-dropdown,40)] flex items-stretch border-t border-th-line bg-th-surface pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        HIDE_FROM[hideFrom],
        className
      ),
      children: [
        shown.map((item) => /* @__PURE__ */ jsx(Fragment, { children: renderItem(
          item,
          cell,
          /* @__PURE__ */ jsxs("span", { className: pill(!!item.active), children: [
            /* @__PURE__ */ jsxs("span", { className: "relative inline-flex size-6 items-center justify-center", children: [
              item.icon,
              /* @__PURE__ */ jsx(NavBadge, { value: item.badge })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "max-w-full truncate px-1", children: item.shortLabel ?? item.label })
          ] }),
          renderLink
        ) }, item.key)),
        more ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-expanded": more.expanded,
            "aria-haspopup": "dialog",
            "data-state": more.expanded ? "open" : "closed",
            onClick: more.onToggle,
            className: cell,
            children: /* @__PURE__ */ jsxs("span", { className: pill(more.active || more.expanded), children: [
              /* @__PURE__ */ jsx("span", { className: "inline-flex size-6 items-center justify-center", children: more.icon ?? /* @__PURE__ */ jsx(MoreDots, {}) }),
              /* @__PURE__ */ jsx("span", { className: "max-w-full truncate px-1", children: more.label ?? strings.more })
            ] })
          }
        ) : null,
        trailing ? /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "my-2 w-px shrink-0 bg-th-line" }),
          /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center justify-center px-1", children: trailing })
        ] }) : null
      ]
    }
  );
}
function NavRail({
  items,
  tools,
  footer,
  showFrom = "md",
  hideFrom = "lg",
  label,
  renderLink,
  className,
  ref: refProp,
  ...rest
}) {
  const strings = useStrings(SHELL_STRINGS);
  const ref = useRef(null);
  const side = useEndSide(ref);
  const shown = visibleNavItems(items);
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "aria-label": label ?? strings.sections,
      className: cn(
        "hidden w-[72px] shrink-0 flex-col items-center gap-1 border-e border-th-line bg-th-surface py-3 pl-[env(safe-area-inset-left)]",
        RAIL_SHOW[showFrom],
        hideFrom ? RAIL_HIDE[hideFrom] : null,
        className
      ),
      children: [
        shown.map((item) => {
          const node = renderItem(
            item,
            navRailItemClass(!!item.active),
            /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: cn(
                    "relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    item.active ? cn("bg-th-accent-soft", FORCED_MARK) : "group-hover:bg-th-elevated"
                  ),
                  children: [
                    item.icon,
                    /* @__PURE__ */ jsx(NavBadge, { value: item.badge })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "max-w-full truncate px-1", children: item.shortLabel ?? item.label })
            ] }),
            renderLink
          );
          const tip = item.hint ?? (item.shortLabel != null && item.shortLabel !== item.label ? item.label : void 0);
          return tip ? /* @__PURE__ */ jsx(Tooltip, { tip, side, focusable: false, className: "block w-full", children: node }, item.key) : /* @__PURE__ */ jsx("span", { className: "block w-full", children: node }, item.key);
        }),
        tools ? /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "my-1 h-px w-8 bg-th-line" }),
          tools
        ] }) : null,
        footer ? /* @__PURE__ */ jsx("div", { className: "mt-auto flex flex-col items-center gap-2 pt-3", children: footer }) : null
      ]
    }
  );
}
function NavSidebar({
  items,
  collapsed,
  onCollapsedChange,
  tools,
  footer,
  header,
  label,
  renderLink,
  className,
  ref: refProp,
  ...rest
}) {
  const strings = useStrings(SHELL_STRINGS);
  const ref = useRef(null);
  const side = useEndSide(ref);
  const shown = visibleNavItems(items);
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      "aria-label": strings.sidebar,
      ...rest,
      ref: mergeRefs(ref, refProp),
      "data-state": collapsed ? "closed" : "open",
      className: cn(
        "flex h-full shrink-0 flex-col border-e border-th-line bg-th-surface py-3 pl-[env(safe-area-inset-left)] transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-16" : "w-56",
        className
      ),
      children: [
        header != null && !collapsed ? /* @__PURE__ */ jsx("div", { className: "mb-3 flex flex-col items-start gap-2 px-3", children: header }) : null,
        tools ? /* @__PURE__ */ jsx("div", { className: cn("mb-2 flex gap-1 border-b border-th-line pb-2", collapsed ? "flex-col items-center" : "flex-wrap px-3"), children: tools }) : null,
        /* @__PURE__ */ jsx("nav", { "aria-label": label ?? strings.sections, className: cn("flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto", collapsed ? "items-center px-2" : "px-3"), children: shown.map((item) => {
          const node = renderItem(
            item,
            cn(
              "flex min-h-11 items-center gap-3 rounded-lg border-s-2 text-sm transition-colors",
              FOCUS,
              collapsed ? "w-11 justify-center" : "w-full px-3",
              item.active ? cn("border-th-accent bg-th-accent-soft font-medium text-th-accent", FORCED_MARK) : "border-transparent text-th-hi2 hover:bg-th-elevated hover:text-th-hi"
            ),
            /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsxs("span", { className: "relative inline-flex size-5 shrink-0 items-center justify-center [&>svg]:size-5", children: [
                item.icon,
                /* @__PURE__ */ jsx(NavBadge, { value: item.badge })
              ] }),
              /* @__PURE__ */ jsx("span", { className: collapsed ? "sr-only" : "min-w-0 truncate", children: item.label })
            ] }),
            renderLink
          );
          const tip = collapsed ? item.label : item.hint;
          return tip ? /* @__PURE__ */ jsx(Tooltip, { tip, side, focusable: false, className: collapsed ? "block" : "block w-full", children: node }, item.key) : /* @__PURE__ */ jsx("span", { className: "block w-full", children: node }, item.key);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: cn("mt-3 flex gap-2 border-t border-th-line pt-3", collapsed ? "flex-col items-center" : "items-center justify-between px-3"), children: [
          footer,
          /* @__PURE__ */ jsx(IconButton, { label: collapsed ? strings.expandSidebar : strings.collapseSidebar, onClick: () => onCollapsedChange(!collapsed), children: collapsed ? /* @__PURE__ */ jsx(PanelLeftOpenIcon, { size: 18, className: "rtl:-scale-x-100" }) : /* @__PURE__ */ jsx(PanelLeftCloseIcon, { size: 18, className: "rtl:-scale-x-100" }) })
        ] })
      ]
    }
  );
}
function revealInRow(scroller, child) {
  const s = scroller.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  const pad = 8;
  if (c.left < s.left + pad) scroller.scrollLeft += c.left - s.left - pad;
  else if (c.right > s.right - pad) scroller.scrollLeft += c.right - s.right + pad;
}
var ACTIVE_SELECTOR = '[aria-pressed="true"],[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-checked="true"]';
function ScrollRow({
  children,
  bleed = false,
  fade = true,
  snap = false,
  as = "div",
  label,
  className,
  ref: refProp,
  ...rest
}) {
  const ref = useRef(null);
  useScrollEdges(ref);
  const lastActive = useRef(null);
  useEffect(() => {
    const active = ref.current?.querySelector(ACTIVE_SELECTOR) ?? null;
    if (active && active !== lastActive.current) {
      revealInRow(ref.current, active);
    }
    lastActive.current = active;
  });
  const Tag = as;
  return /* @__PURE__ */ jsx(
    Tag,
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "aria-label": label ?? rest["aria-label"],
      className: cn(
        "flex gap-2 overflow-x-auto nish-no-scrollbar",
        fade && "nish-scroll-fade",
        bleed && "-mx-[var(--nish-page-gutter)] px-[var(--nish-page-gutter)]",
        snap && "snap-x snap-mandatory [&>*]:snap-start",
        className
      ),
      children
    }
  );
}
function useScrollSpy(ids, { rootMargin = "-45% 0px -50% 0px" } = {}) {
  const [active, setActive] = useState(ids[0] ?? null);
  const key = ids.join("\0");
  useEffect(() => {
    const list = key ? key.split("\0") : [];
    setActive((cur) => cur != null && list.includes(cur) ? cur : list[0] ?? null);
    if (!list.length || typeof IntersectionObserver === "undefined") return;
    const inBand = /* @__PURE__ */ new Set();
    const io = new IntersectionObserver(
      (entries) => {
        let entered = null;
        for (const e of entries) {
          const id = e.target.id;
          if (e.isIntersecting) {
            inBand.add(id);
            entered = id;
          } else {
            inBand.delete(id);
          }
        }
        if (entered) {
          setActive(entered);
        } else {
          setActive((cur) => {
            if (cur != null && inBand.has(cur)) return cur;
            const still = list.filter((id) => inBand.has(id));
            return still.length ? still[still.length - 1] : cur;
          });
        }
      },
      { rootMargin }
    );
    const seen = /* @__PURE__ */ new Set();
    let mo = null;
    const attach = () => {
      for (const id of list) {
        if (seen.has(id)) continue;
        const el = document.getElementById(id);
        if (el) {
          seen.add(id);
          io.observe(el);
        }
      }
      if (seen.size === list.length && mo) {
        mo.disconnect();
        mo = null;
      }
    };
    attach();
    if (seen.size < list.length && typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(attach);
      mo.observe(document.body, { childList: true, subtree: true });
    }
    const onScroll = () => {
      if (window.scrollY < 8) setActive(list[0]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key, rootMargin]);
  return active;
}
function SectionNav({
  items,
  sticky = true,
  onSelect,
  updateHash = true,
  label = "On this page",
  className,
  style,
  ref: refProp,
  ...rest
}) {
  const ref = useRef(null);
  const spy = useScrollSpy(items.map((i) => i.id));
  const [locked, setLocked] = useState(null);
  const active = locked ?? spy;
  useEffect(() => {
    if (locked == null) return;
    const release = () => setLocked(null);
    const onKey = (e) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) release();
    };
    let settled = false;
    const settle = () => {
      settled = true;
    };
    let t = setTimeout(settle, 400);
    const onScroll = () => {
      if (settled) {
        release();
        return;
      }
      clearTimeout(t);
      t = setTimeout(settle, 200);
    };
    const onScrollEnd = () => {
      clearTimeout(t);
      t = setTimeout(settle, 50);
    };
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      clearTimeout(t);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [locked]);
  useHeightVar(ref, "--nish-sticky-extra", sticky);
  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLocked(id);
    el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    if (updateHash) {
      try {
        history.replaceState(history.state, "", `#${id}`);
      } catch {
      }
    }
    onSelect?.(id);
  };
  return /* @__PURE__ */ jsx(
    "nav",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "aria-label": label,
      "data-nish-bar": sticky ? "" : void 0,
      style: sticky ? { top: "var(--nish-header-h, 0px)", ...style } : style,
      className: cn("z-[var(--nish-z-sticky,20)] border-b border-th-line bg-th-bg py-2", sticky && "sticky", className),
      children: /* @__PURE__ */ jsx(ScrollRow, { bleed: true, children: items.map((item) => {
        const on = item.id === active;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-current": on ? "true" : void 0,
            "data-state": on ? "active" : "inactive",
            onClick: () => go(item.id),
            className: chipClass({
              pressed: on,
              className: "shrink-0 whitespace-nowrap pointer-coarse:min-h-11 pointer-coarse:min-w-11"
            }),
            children: [
              item.icon,
              item.label,
              item.count != null ? /* @__PURE__ */ jsx("span", { className: "tabular-nums text-th-hi3", children: item.count }) : null
            ]
          },
          item.id
        );
      }) })
    }
  );
}
export {
  BottomNav,
  NavRail,
  NavSidebar,
  ScrollRow,
  SectionNav,
  revealInRow,
  useScrollEdges,
  useScrollSpy,
  visibleNavItems
};
