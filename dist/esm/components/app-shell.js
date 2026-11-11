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
import { warnDev } from "./display-classes.js";
import { Skeleton } from "./feedback.js";
import { MoreIcon } from "./icons.js";
import { lazyModule, preloadWhenIdle, useLazyModule } from "./lazy-module.js";
import { BottomNav, NavRail, NavSidebar } from "./nav.js";
import { visibleNavItems } from "./nav-items.js";
import { NavBadge } from "./nav-items.js";
import { DropdownMenu, MenuItem } from "./menu.js";
import { IconButton } from "./primitives.js";
import { useStrings } from "./provider.js";
import { SHELL_STRINGS, STATUS_STRINGS } from "./strings.js";
import { tabClass } from "./tabs-classes.js";
import { ThemeToggle } from "./theme-toggle.js";
import { Toaster } from "./toast.js";
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
var MAIN_ID = "nish-main";
var sheetModule = /* @__PURE__ */ lazyModule(() => import("./more-sheet.js"));
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
  navMode = "adaptive",
  tabs = "underline",
  bottomNav,
  moreMenu: moreMenuProp = true,
  headerInnerClassName,
  containerClassName,
  footer,
  fullHeight = false,
  navPending = 0,
  children
}) {
  const strings = useStrings(SHELL_STRINGS, STATUS_STRINGS);
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
  const headerMode = navMode === "header";
  if (headerMode && sidebar !== false) warnDev('nish-ui: AppShell navMode="header" ignores sidebar.');
  const side = headerMode || sidebar === false ? null : sidebar === true ? {} : sidebar;
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
  const brandMode = hasNav && side?.brand != null;
  const brandNode = (isCollapsed) => typeof side?.brand === "function" ? side.brand({ collapsed: isCollapsed }) : side?.brand;
  let bottomItems;
  let overflow;
  if (headerMode) {
    bottomItems = [];
    overflow = [];
  } else if (bottomNav) {
    bottomItems = [];
    for (const key of bottomNav) {
      const found = nav.find((i) => i.key === key);
      if (found) bottomItems.push(found);
      else warnDev(`nish-ui: AppShell bottomNav key "${key}" is not in nav.`);
    }
    if (bottomNav.length > 5) warnDev("nish-ui: AppShell bottomNav has more than 5 items; they do not fit a 360px screen.");
    overflow = nav.filter((i) => !bottomItems.includes(i));
  } else {
    const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
    bottomItems = nav.slice(0, n);
    overflow = nav.slice(n);
  }
  const sheetItems = hasNav && !headerMode ? [...overflow, ...moreItems] : [];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);
  const sheetMod = useLazyModule(sheetModule, sheet, () => setSheet(false));
  useEffect(() => hasSheet ? preloadWhenIdle(sheetModule) : void 0, [hasSheet]);
  const showMoreMenu = moreItems.length > 0 && moreMenuProp !== false;
  if (headerMode && moreMenuProp === false && moreItems.length > 0) warnDev('nish-ui: AppShell moreMenu={false} with navMode="header" hides moreItems.');
  if (fullHeight && footer != null) warnDev("nish-ui: AppShell fullHeight does not render footer.");
  const stickTop = "sticky top-[calc(var(--nish-header-h,0px)+var(--nish-banners-h,0px))] h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] self-start";
  const toggle = themeToggle === false ? false : hasSheet ? /* @__PURE__ */ jsx("span", { className: "max-md:hidden", children: themeToggle ?? /* @__PURE__ */ jsx(ThemeToggle, {}) }) : themeToggle;
  const tabNodes = (variant) => /* @__PURE__ */ jsx(Fragment2, { children: nav.map((item) => {
    const className = cn(tabClass({ active: !!item.active, variant }), "inline-flex", variant === "pill" && "items-center");
    const current = item.active ? "page" : void 0;
    const children2 = /* @__PURE__ */ jsxs(Fragment2, { children: [
      item.label,
      /* @__PURE__ */ jsx(NavBadge, { value: item.badge })
    ] });
    if (renderLink && item.href != null) {
      return /* @__PURE__ */ jsx(Fragment, { children: renderLink(item, { className, children: children2, "aria-current": current, onClick: item.onSelect }) }, item.key);
    }
    return item.href != null ? /* @__PURE__ */ jsx("a", { href: item.href, className, "aria-current": current, onClick: item.onSelect, children: children2 }, item.key) : /* @__PURE__ */ jsx("button", { type: "button", className, "aria-current": current, onClick: item.onSelect, children: children2 }, item.key);
  }) });
  const showHeaderTabs = hasNav && !side && (headerMode || tabs !== "pill");
  const showPills = hasNav && !side && !headerMode && tabs === "pill";
  const headerNav = !hasNav && navPending > 0 ? [
    // Skeleton is already aria-hidden; this keeps the placeholder landmark from being empty.
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: strings.loading }, "loading"),
    ...Array.from({ length: navPending }, (_, i) => /* @__PURE__ */ jsx(Skeleton, { className: cn("w-24 rounded-lg pointer-coarse:h-11", tabs === "pill" ? "h-8" : "h-10") }, i))
  ] : showHeaderTabs ? tabNodes(tabs === "pill" ? "pill" : "underline") : void 0;
  const moreMenuNode = (menuSide) => /* @__PURE__ */ jsx(
    DropdownMenu,
    {
      align: "end",
      side: menuSide,
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
  );
  const moreMenu = showMoreMenu ? /* @__PURE__ */ jsx("div", { className: hasNav && !headerMode ? "hidden md:inline-flex" : "inline-flex", children: moreMenuNode() }) : null;
  const hubHref = hub ? safeUrl(hub.href) : null;
  const hubPill = hub && hubHref != null ? /* @__PURE__ */ jsxs("a", { className: "nish-pill-link", href: hubHref, title: hub.title ?? strings.hubTitle, children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "inline-block rtl:-scale-x-100", children: "\u2190" }),
    " ",
    /* @__PURE__ */ jsx("span", { className: "nish-pill-link-label", children: hub.label })
  ] }) : null;
  const sidebarToggle = themeToggle === false ? null : themeToggle ?? /* @__PURE__ */ jsx(ThemeToggle, { compact: collapsed });
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
          showPills ? /* @__PURE__ */ jsx("nav", { "aria-label": navLabel, className: "hidden items-center gap-1 lg:flex", children: tabNodes("pill") }) : null,
          hasNav && side?.tools != null ? /* @__PURE__ */ jsx("span", { className: "flex items-center gap-2 lg:hidden", children: side.tools }) : null,
          actions,
          moreMenu
        ] }),
        themeToggle: toggle,
        className: cn(!headerMode && "max-lg:[&>nav]:hidden", brandMode && "lg:hidden"),
        innerClassName: headerInnerClassName,
        nav: headerNav,
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
      hasNav && !headerMode ? /* @__PURE__ */ jsx("div", { className: cn(stickTop, "hidden md:block lg:hidden"), children: /* @__PURE__ */ jsx(NavRail, { items: nav, showFrom: "md", hideFrom: "lg", footer: railFooter, renderLink, label: navLabel, className: "h-full" }) }) : null,
      hasNav && side ? /* @__PURE__ */ jsx("div", { className: cn(stickTop, "hidden lg:block"), children: /* @__PURE__ */ jsx(
        NavSidebar,
        {
          items: nav,
          collapsed,
          onCollapsedChange: setCollapsed,
          header: brandMode && !collapsed ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            hubPill,
            brandNode(false)
          ] }) : void 0,
          tools: brandMode ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            side.tools,
            actions
          ] }) : side.tools,
          footer: brandMode ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            sidebarToggle,
            side.footer,
            showMoreMenu ? moreMenuNode("top") : null
          ] }) : side.footer,
          renderLink,
          label: navLabel
        }
      ) }) : null,
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        brandMode && collapsed ? /* @__PURE__ */ jsxs("div", { className: "hidden h-14 items-center gap-3 border-b border-th-line px-[var(--nish-page-gutter,1rem)] py-[5px] lg:flex", children: [
          hubPill,
          brandNode(true)
        ] }) : null,
        fullHeight ? /* @__PURE__ */ jsx(
          "main",
          {
            id: mainId,
            tabIndex: -1,
            className: cn(
              "flex min-h-0 flex-col overflow-hidden focus:outline-none h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] pb-[var(--nish-bottom-inset,0px)]",
              brandMode && collapsed && "lg:h-[calc(100dvh-var(--nish-banners-h,0px)-3.5rem)]"
            ),
            children: page
          }
        ) : container === false ? /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx("main", { id: mainId, tabIndex: -1, className: "focus:outline-none", children: page }),
          footer
        ] }) : /* @__PURE__ */ jsxs(PageContainer, { as: "div", size: container, className: containerClassName, children: [
          /* @__PURE__ */ jsx("main", { id: mainId, tabIndex: -1, className: "focus:outline-none", children: page }),
          footer
        ] })
      ] })
    ] }),
    hasNav && !headerMode ? /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx(
        BottomNav,
        {
          items: bottomItems,
          more: hasSheet ? {
            active: moreActive,
            expanded: sheet,
            onToggle: () => {
              void sheetModule.load().catch(() => void 0);
              setSheet((s) => !s);
            }
          } : void 0,
          renderLink,
          label: navLabel
        }
      ),
      sheetMod ? /* @__PURE__ */ jsx(sheetMod.MoreSheet, { open: sheet, onClose: () => setSheet(false), items: sheetItems, renderLink }) : null
    ] }) : null,
    toaster !== false ? /* @__PURE__ */ jsx(Toaster, { ...toaster }) : null
  ] });
}
export {
  AppShell
};
