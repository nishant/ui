"use client";

// src/components/app-shell.tsx
import { Fragment, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hooks.js";
import { useHeightVar } from "./layout-vars.js";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { ConnectionBanner, LoadingBar, PageContainer } from "./layout.js";
import { AppErrorBoundary } from "./error-boundary.js";
import { AppHeader } from "./display.js";
import { MoreIcon } from "./icons.js";
import { BottomNav, MoreSheet, NavRail, NavSidebar, visibleNavItems } from "./nav.js";
import { DropdownMenu, MenuItem } from "./overlay.js";
import { IconButton } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { tabClass } from "./tabs-classes.js";
import { ThemeToggle } from "./theme-toggle.js";
import { Toaster } from "./toast.js";
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
var MAIN_ID = "nish-main";
function AppShell({
  name,
  icon,
  brand,
  homeHref = "/",
  hub = false,
  nav: navProp = [],
  primary = 4,
  moreItems: moreItemsProp = [],
  renderLink,
  navLabel: navLabelProp,
  mainId = MAIN_ID,
  actions,
  themeToggle,
  railFooter,
  loading = false,
  connection = {},
  banner,
  sidebar = false,
  container = "default",
  toaster = {},
  errorBoundary = true,
  resetKey,
  children
}) {
  const strings = useNishStrings();
  const navLabel = navLabelProp ?? strings.sections;
  const nav = visibleNavItems(navProp);
  const moreItems = visibleNavItems(moreItemsProp);
  const [sheet, setSheet] = useState(false);
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    setSheet(false);
  }, [resetKey]);
  const side = sidebar === false ? null : sidebar === true ? {} : sidebar;
  const storageKey = side?.storageKey === false ? null : side?.storageKey ?? "nish-sidebar-collapsed";
  const [storedCollapsed, setStoredCollapsed] = useLocalStorage(storageKey ?? "nish-sidebar-collapsed", side?.defaultCollapsed ?? false);
  const [memoryCollapsed, setMemoryCollapsed] = useState(side?.defaultCollapsed ?? false);
  const collapsed = side?.collapsed ?? (storageKey ? storedCollapsed : memoryCollapsed);
  const setCollapsed = (next) => {
    if (side?.collapsed === void 0) (storageKey ? setStoredCollapsed : setMemoryCollapsed)(next);
    side?.onCollapsedChange?.(next);
  };
  const bannersRef = useRef(null);
  useHeightVar(bannersRef, "--nish-banners-h");
  const hasNav = nav.length > 0;
  const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
  const bottomItems = nav.slice(0, n);
  const overflow = nav.slice(n);
  const sheetItems = hasNav ? [...overflow, ...moreItems] : [];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);
  const stickTop = "sticky top-[calc(var(--nish-header-h,0px)+var(--nish-banners-h,0px))] h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] self-start";
  const toggle = themeToggle === false ? false : hasSheet ? /* @__PURE__ */ jsx("span", { className: "max-md:hidden", children: themeToggle ?? /* @__PURE__ */ jsx(ThemeToggle, {}) }) : themeToggle;
  const desktopNav = /* @__PURE__ */ jsx(Fragment2, { children: nav.map((item) => {
    const className = cn(tabClass({ active: !!item.active }), "inline-flex");
    const current = item.active ? "page" : void 0;
    if (renderLink && item.href != null) {
      return /* @__PURE__ */ jsx(Fragment, { children: renderLink(item, { className, children: item.label, "aria-current": current, onClick: item.onSelect }) }, item.key);
    }
    return item.href != null ? /* @__PURE__ */ jsx("a", { href: item.href, className, "aria-current": current, onClick: item.onSelect, children: item.label }, item.key) : /* @__PURE__ */ jsx("button", { type: "button", className, "aria-current": current, onClick: item.onSelect, children: item.label }, item.key);
  }) });
  const moreMenu = moreItems.length > 0 ? (
    // With nav, under 768px these items live in the MoreSheet; signed out there is no sheet.
    /* @__PURE__ */ jsx("div", { className: hasNav ? "hidden md:inline-flex" : "inline-flex", children: /* @__PURE__ */ jsx(
      DropdownMenu,
      {
        align: "end",
        trigger: /* @__PURE__ */ jsx(IconButton, { label: strings.more, children: /* @__PURE__ */ jsx(MoreIcon, { size: 20 }) }),
        children: moreItems.map((item) => /* @__PURE__ */ jsx(
          MenuItem,
          {
            icon: item.icon,
            active: item.active,
            onSelect: () => {
              if (item.onSelect) item.onSelect();
              else if (item.href != null) {
                const href = safeUrl(item.href);
                if (href !== null) window.location.assign(href);
              }
            },
            children: item.label
          },
          item.key
        ))
      }
    ) })
  ) : null;
  const page = errorBoundary ? /* @__PURE__ */ jsx(AppErrorBoundary, { resetKeys: [resetKey], children }) : children;
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx(
      "a",
      {
        href: `#${mainId}`,
        className: "nish-skip-link",
        onClick: (e) => {
          const main = document.getElementById(mainId);
          if (!main) return;
          e.preventDefault();
          main.focus();
          main.scrollIntoView?.();
        },
        children: strings.skipToContent
      }
    ),
    /* @__PURE__ */ jsx(
      AppHeader,
      {
        name,
        icon,
        brand,
        homeHref,
        hub,
        hideNameBelow: icon != null ? "sm" : void 0,
        compactPill: true,
        actions: /* @__PURE__ */ jsxs(Fragment2, { children: [
          hasNav && side?.tools != null ? /* @__PURE__ */ jsx("span", { className: "flex items-center gap-2 lg:hidden", children: side.tools }) : null,
          actions,
          moreMenu
        ] }),
        themeToggle: toggle,
        className: "max-lg:[&>nav]:hidden",
        nav: hasNav && !side ? desktopNav : void 0,
        navLabel
      }
    ),
    /* @__PURE__ */ jsx(LoadingBar, { active: loading }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: bannersRef,
        "data-nish-bar": "",
        className: "sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] empty:hidden",
        children: [
          connection !== false ? /* @__PURE__ */ jsx(ConnectionBanner, { ...connection }) : null,
          banner
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "md:flex", children: [
      hasNav ? /* @__PURE__ */ jsx("div", { className: cn(stickTop, "hidden md:block lg:hidden"), children: /* @__PURE__ */ jsx(NavRail, { items: nav, showFrom: "md", hideFrom: "lg", footer: railFooter, renderLink, label: navLabel, className: "h-full" }) }) : null,
      hasNav && side ? /* @__PURE__ */ jsx("div", { className: cn(stickTop, "hidden lg:block"), children: /* @__PURE__ */ jsx(
        NavSidebar,
        {
          items: nav,
          collapsed,
          onCollapsedChange: setCollapsed,
          tools: side.tools,
          footer: side.footer,
          renderLink,
          label: navLabel
        }
      ) }) : null,
      /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsx("main", { id: mainId, tabIndex: -1, className: "focus:outline-none", children: container === false ? page : /* @__PURE__ */ jsx(PageContainer, { as: "div", size: container, children: page }) }) })
    ] }),
    hasNav ? /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx(
        BottomNav,
        {
          items: bottomItems,
          more: hasSheet ? { active: moreActive, expanded: sheet, onToggle: () => setSheet((s) => !s) } : void 0,
          renderLink,
          label: navLabel
        }
      ),
      /* @__PURE__ */ jsx(MoreSheet, { open: sheet, onClose: () => setSheet(false), items: sheetItems, renderLink })
    ] }) : null,
    toaster !== false ? /* @__PURE__ */ jsx(Toaster, { ...toaster }) : null
  ] });
}
export {
  AppShell
};
