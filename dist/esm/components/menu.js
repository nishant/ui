"use client";

// src/components/menu.tsx
import { cloneElement, createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { isRtl } from "./client.js";
import { useMediaQuery } from "./hooks.js";
import { useLatest } from "./latest.js";
import { lazyModule, useLazyModule } from "./lazy-module.js";
import { useStrings, useNishContext } from "./provider.js";
import { OVERLAY_STRINGS } from "./strings.js";
import { MENU_ROW, PHONE_QUERY, menuItemClass } from "./overlay-classes.js";
import { layerHost, setRef, useMergedRef } from "./overlay-core.js";
import { useAnchoredPosition, floatingStyle, useDismiss, useReturnFocus } from "./overlay-position.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var InlineMenuItemContext = /* @__PURE__ */ createContext(false);
var MenuContext = /* @__PURE__ */ createContext(null);
var drawerModule = /* @__PURE__ */ lazyModule(() => import("./drawer.js"));
var ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
function menuItems(menu) {
  return menu ? Array.from(menu.querySelectorAll(ITEM_SELECTOR)) : [];
}
function usePhoneViewport(enabled) {
  const phone = useMediaQuery(PHONE_QUERY);
  return enabled && phone;
}
function Cloned({ element, ...props }) {
  return cloneElement(element, props);
}
function DropdownMenu({
  trigger,
  align = "start",
  side = "bottom",
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  "aria-label": ariaLabel,
  sheetBelow = false,
  sheetTitle,
  className,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}) {
  const strings = useStrings(OVERLAY_STRINGS);
  const config = useNishContext();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const triggerRef = useRef(null);
  const [triggerNode, setTriggerNode] = useState(null);
  const triggerPropRef = trigger.props.ref;
  const attachTrigger = useCallback(
    (node) => {
      triggerRef.current = node;
      setTriggerNode(node);
      setRef(triggerPropRef, node);
    },
    [triggerPropRef]
  );
  const shown = open && triggerNode != null;
  const [menuRef, setMenuRef] = useMergedRef(ref);
  const menuId = useId();
  const triggerId = useId();
  const initial = useRef("first");
  const wantSheet = usePhoneViewport(sheetBelow === "sm");
  const drawer = useLazyModule(drawerModule, wantSheet);
  const asSheet = wantSheet && drawer != null;
  const pos = useAnchoredPosition(triggerRef, menuRef, shown && !asSheet, side, align, 4);
  const onOpenChangeRef = useLatest(onOpenChange);
  const setOpen = useCallback(
    (next, reason) => {
      if (openProp === void 0) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [onOpenChangeRef, openProp]
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const dismiss = useCallback((reason) => setOpen(false, reason), [setOpen]);
  useDismiss(shown && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(shown, menuRef, triggerRef);
  useEffect(() => {
    if (!shown) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusInitial = () => {
      const items = menuItems(menu);
      const target = initial.current === "last" ? items[items.length - 1] : initial.current === "menu" ? menu : items[0];
      (target ?? menu).focus();
    };
    const t = window.setTimeout(focusInitial, 0);
    const mo = new MutationObserver(() => {
      if (!menu.contains(document.activeElement) && (document.activeElement === document.body || !document.activeElement)) {
        initial.current = "first";
        focusInitial();
      }
    });
    mo.observe(menu, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [shown, asSheet, menuRef]);
  function openWith(where) {
    initial.current = where;
    setOpen(true);
  }
  function onMenuKeyDown(e) {
    userKeyDown?.(e);
    const items = menuItems(menuRef.current);
    const i = items.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        return go(i + 1);
      case "ArrowUp":
        return go(i < 0 ? items.length - 1 : i - 1);
      case "Home":
        return go(0);
      case "End":
        return go(items.length - 1);
      case "Tab":
        e.preventDefault();
        dismiss("tab");
        return;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          const hit = order.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(k));
          if (hit) {
            e.preventDefault();
            hit.focus();
          }
        }
    }
  }
  const tp = trigger.props;
  const triggerEl = /* @__PURE__ */ jsx(
    Cloned,
    {
      element: trigger,
      ref: attachTrigger,
      id: tp.id ?? triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId : void 0,
      onClick: (e) => {
        tp.onClick?.(e);
        if (e.defaultPrevented) return;
        if (open) close();
        else openWith(e.detail === 0 ? "first" : "menu");
      },
      onKeyDown: (e) => {
        tp.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          openWith(e.key === "ArrowDown" ? "first" : "last");
        }
      }
    }
  );
  const menuProps = {
    ...rest,
    ref: setMenuRef,
    id: menuId,
    role: "menu",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabel ? void 0 : tp.id ?? triggerId,
    "aria-orientation": "vertical",
    "data-state": "open",
    tabIndex: -1,
    onKeyDown: onMenuKeyDown
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    triggerEl,
    open && asSheet ? /* @__PURE__ */ jsx(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx(drawer.Drawer, { side: "bottom", size: "md", title: sheetTitle ?? strings.menu, onClose: close, children: /* @__PURE__ */ jsx(
      "div",
      {
        ...menuProps,
        style,
        className: cn(
          "-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm",
          className
        ),
        children
      }
    ) }) }) : shown ? createPortal(
      /* @__PURE__ */ jsx(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx(
        "div",
        {
          ...menuProps,
          "data-side": pos?.side,
          style: floatingStyle(pos, {
            ...style,
            maxHeight: pos ? Math.min(pos.maxHeight, 384) : void 0,
            zIndex: "var(--nish-z-dropdown, 40)"
          }),
          className: cn(
            "max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain",
            "rounded-lg border border-th-line bg-th-elevated py-1 shadow-pop outline-none animate-[nish-fade-in_120ms_ease-out]",
            className
          ),
          children
        }
      ) }),
      layerHost(triggerNode, config.portalContainer)
    ) : null
  ] });
}
function MenuItem({
  icon,
  trailing,
  danger = false,
  active = false,
  disabled = false,
  onSelect,
  className,
  children,
  ref,
  onClick,
  onMouseMove,
  ...rest
}) {
  const ctx = useContext(MenuContext);
  const inline = useContext(InlineMenuItemContext);
  function select() {
    if (disabled) return;
    const ev = new Event("nish-menu-select", { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      role: inline ? void 0 : "menuitem",
      tabIndex: inline ? void 0 : -1,
      "aria-disabled": disabled || void 0,
      "aria-current": active || void 0,
      "data-disabled": disabled ? "" : void 0,
      onClick: (e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
        if (!e.defaultPrevented) select();
      },
      onMouseMove: (e) => {
        onMouseMove?.(e);
        if (!inline && !disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      },
      className: menuItemClass({
        active,
        danger,
        disabled,
        className: cn(!inline && !disabled && (danger ? "focus:bg-th-loss-soft" : "focus:bg-th-overlay focus:text-th-hi"), className)
      }),
      children: [
        icon ? /* @__PURE__ */ jsx("span", { className: cn("inline-flex shrink-0", danger || disabled ? "" : "text-th-hi3"), children: icon }) : null,
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children }),
        trailing ? /* @__PURE__ */ jsx("span", { className: cn("ms-auto inline-flex shrink-0 items-center", disabled ? "" : "text-th-hi2"), children: trailing }) : null
      ]
    }
  );
}
function MenuLabel({
  children,
  className,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref,
      role: "presentation",
      className: cn("px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2", className),
      children
    }
  );
}
function MenuSeparator({
  className,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsx("div", { ...rest, ref, role: "separator", className: cn("my-1 h-px bg-th-line forced-colors:bg-[CanvasText]", className) });
}
function MenuSubHeader({ onBack, children, className, ref, onKeyDown, ...rest }) {
  const strings = useStrings(OVERLAY_STRINGS);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      onClick: onBack,
      onKeyDown: (e) => {
        onKeyDown?.(e);
        if (e.key === (isRtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft")) {
          e.preventDefault();
          onBack();
        }
      },
      className: cn(MENU_ROW, "mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay", className),
      children: [
        /* @__PURE__ */ jsx(
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
            className: "shrink-0 text-th-hi3 rtl:-scale-x-100",
            children: /* @__PURE__ */ jsx("path", { d: "m15 18-6-6 6-6" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: strings.back }),
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children })
      ]
    }
  );
}
export {
  DropdownMenu,
  ITEM_SELECTOR,
  InlineMenuItemContext,
  MenuContext,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSubHeader,
  menuItems
};
