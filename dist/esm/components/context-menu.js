"use client";

// src/components/context-menu.tsx
import { useRef, useState } from "react";
import { cn } from "../cn.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { mergeRefs } from "./data-classes.js";
import { DropdownMenu } from "./menu.js";
import { useStrings } from "./provider.js";
import { OVERLAY_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
var NATIVE_MENU_TARGETS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
var MOVE_CANCELS_PRESS = 10;
var SWALLOW_CLICK_MS = 800;
var SWALLOW_NATIVE_MENU_MS = 1e3;
function ContextMenu({
  children,
  menu,
  open: openProp,
  onOpenChange,
  disabled,
  menuLabel,
  sheetBelow = "sm",
  sheetTitle,
  longPressMs = 500,
  menuClassName,
  className,
  ref,
  onContextMenu,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...rest
}) {
  const t = useStrings(OVERLAY_STRINGS);
  const [openState, setOpenState] = useState(false);
  const [point, setPoint] = useState(null);
  const [target, setTarget] = useState(null);
  const rootRef = useRef(null);
  const returnTo = useRef(null);
  const lastOpen = useRef(0);
  const suppressClickUntil = useRef(0);
  const pressTimer = useRef(void 0);
  const pressStart = useRef(null);
  const wasOpen = useRef(false);
  const open = openProp ?? openState;
  const setOpen = (next, reason) => {
    if (openProp === void 0) setOpenState(next);
    onOpenChange?.(next, reason);
  };
  const cancelPress = () => {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = void 0;
    pressStart.current = null;
  };
  const inside = (e) => e.currentTarget.contains(e.target);
  const openAt = (x, y, el, swallowNative) => {
    if (disabled) return false;
    const content2 = typeof menu === "function" ? menu(el) : menu;
    if (content2 == null || content2 === false) return false;
    const root = rootRef.current;
    const active = document.activeElement;
    const focusable = active && root?.contains(active) ? active : el.closest(FOCUSABLE);
    returnTo.current = focusable && root?.contains(focusable) ? focusable : null;
    setPoint({ x, y });
    setTarget(el);
    if (swallowNative) lastOpen.current = Date.now();
    setOpen(true);
    return true;
  };
  const handleContextMenu = (e) => {
    onContextMenu?.(e);
    if (disabled || e.defaultPrevented || !inside(e)) return;
    const el = e.target;
    if (e.shiftKey || el.closest(NATIVE_MENU_TARGETS)) return;
    e.preventDefault();
    if (Date.now() - lastOpen.current < SWALLOW_NATIVE_MENU_MS) return;
    openAt(e.clientX, e.clientY, el, false);
  };
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (disabled || e.defaultPrevented || !inside(e)) return;
    if (!(e.key === "F10" && e.shiftKey || e.key === "ContextMenu")) return;
    e.preventDefault();
    const root = e.currentTarget;
    const from = document.activeElement ?? root;
    const r = from.getBoundingClientRect();
    openAt(isRtl(root) ? r.right : r.left, r.bottom, from, true);
  };
  const handlePointerDown = (e) => {
    onPointerDown?.(e);
    if (disabled || !inside(e) || e.pointerType === "mouse" || e.button !== 0) return;
    cancelPress();
    const start = { x: e.clientX, y: e.clientY };
    const el = e.target;
    pressStart.current = start;
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = void 0;
      pressStart.current = null;
      if (openAt(start.x, start.y, el, true)) suppressClickUntil.current = Date.now() + SWALLOW_CLICK_MS;
    }, longPressMs);
  };
  const handlePointerMove = (e) => {
    onPointerMove?.(e);
    const start = pressStart.current;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_CANCELS_PRESS) cancelPress();
  };
  const handlePointerUp = (e) => {
    onPointerUp?.(e);
    cancelPress();
  };
  const handlePointerCancel = (e) => {
    onPointerCancel?.(e);
    cancelPress();
  };
  const handleClickCapture = (e) => {
    onClickCapture?.(e);
    if (Date.now() < suppressClickUntil.current && inside(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  useIsoLayoutEffect(() => () => window.clearTimeout(pressTimer.current), []);
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || point !== null || !root) return;
    const r = root.getBoundingClientRect();
    setPoint({ x: isRtl(root) ? r.right - 8 : r.left + 8, y: r.top + 8 });
  }, [open, point]);
  useIsoLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    setPoint(null);
    setTarget(null);
    const active = document.activeElement;
    if (!active || active === document.body || active.hasAttribute("data-nish-context-anchor")) returnTo.current?.focus({ preventScroll: true });
  }, [open]);
  const content = typeof menu === "function" ? target ? menu(target) : null : menu;
  const shown = open && content != null && content !== false;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref: mergeRefs(ref, rootRef),
      "data-state": open ? "open" : "closed",
      className: cn("[-webkit-touch-callout:none]", className),
      onContextMenu: handleContextMenu,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onClickCapture: handleClickCapture,
      children: [
        children,
        /* @__PURE__ */ jsx(
          DropdownMenu,
          {
            trigger: /* @__PURE__ */ jsx(
              "span",
              {
                "aria-hidden": "true",
                "data-nish-context-anchor": "",
                style: {
                  position: "fixed",
                  left: point?.x ?? 0,
                  top: point?.y ?? 0,
                  width: 0,
                  height: 0,
                  pointerEvents: "none"
                }
              }
            ),
            open: shown && point !== null,
            onOpenChange: (next, reason) => setOpen(next, reason),
            "aria-label": menuLabel ?? t.contextMenu,
            sheetBelow,
            sheetTitle,
            className: menuClassName,
            side: "bottom",
            align: "start",
            children: content
          },
          point ? `${point.x},${point.y}` : "none"
        )
      ]
    }
  );
}
export {
  ContextMenu
};
