"use client";

// src/components/tooltip.tsx
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { shared } from "../runtime.js";
import { useIsoLayoutEffect } from "./client.js";
import { useNishContext } from "./provider.js";
import { keyboardFocused, touchTracker } from "./overlay-classes.js";
import { FOCUSABLE, layerHost, useMergedRef } from "./overlay-core.js";
import { EDGE, useAnchoredPosition, floatingStyle } from "./overlay-position.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var TIP_MAX_WIDTH = 320;
var TIP_GRACE_MS = 100;
var openTip = () => shared("tooltip", () => ({ close: null }));
var FOCUSABLE_HOST_TAGS = /* @__PURE__ */ new Set(["button", "a", "input", "select", "textarea", "summary"]);
function Tooltip({ tip, children, className, side = "top", as = "span", focusable, variant = "default", ref, ...rest }) {
  const [triggerRef, setTriggerRef] = useMergedRef(ref);
  const [open, setOpen] = useState(false);
  const id = useId();
  const graceTimer = useRef(0);
  const only = isValidElement(children) ? children : null;
  const staticInner = only !== null && typeof only.type === "string" && FOCUSABLE_HOST_TAGS.has(only.type);
  const [measuredInner, setMeasuredInner] = useState(false);
  useIsoLayoutEffect(() => {
    const el = triggerRef.current;
    const found = only !== null && !!el && el.querySelector(FOCUSABLE) !== null;
    setMeasuredInner(found);
  });
  const inner = only !== null && (staticInner || measuredInner);
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const touch = touchTracker();
    const show = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(true);
    };
    const hide = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(false);
    };
    const hideSoon = () => {
      window.clearTimeout(graceTimer.current);
      graceTimer.current = window.setTimeout(() => setOpen(false), TIP_GRACE_MS);
    };
    const onMouseEnter = () => {
      if (!touch.recent()) show();
    };
    const onFocusIn = (e) => {
      if (e.target === el || e.target instanceof Element && keyboardFocused(e.target)) show();
    };
    const onPointerDown = (e) => {
      if (e.target !== el) hide();
    };
    el.addEventListener("pointerenter", touch.onPointer);
    el.addEventListener("pointerdown", touch.onPointer);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", hideSoon);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", hide);
    return () => {
      window.clearTimeout(graceTimer.current);
      el.removeEventListener("pointerenter", touch.onPointer);
      el.removeEventListener("pointerdown", touch.onPointer);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", hideSoon);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", hide);
    };
  }, [triggerRef]);
  useEffect(() => {
    if (!open) return;
    const slot = openTip();
    const close = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(false);
    };
    if (slot.close && slot.close !== close) slot.close();
    slot.close = close;
    return () => {
      if (slot.close === close) slot.close = null;
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);
  const onTipPointer = useCallback((over) => {
    window.clearTimeout(graceTimer.current);
    if (!over) graceTimer.current = window.setTimeout(() => setOpen(false), TIP_GRACE_MS);
  }, []);
  const wrapperFocusable = focusable ?? !inner;
  const a11y = {
    tabIndex: wrapperFocusable ? 0 : void 0,
    "aria-describedby": open && !inner ? id : void 0,
    "data-state": open ? "open" : "closed"
  };
  const hint = variant === "hint" && "cursor-help underline decoration-th-hi3 decoration-dotted underline-offset-2";
  let content = children;
  if (inner && only) {
    const existing = only.props["aria-describedby"];
    const describedby = open ? [typeof existing === "string" ? existing : "", id].filter(Boolean).join(" ") : existing;
    content = cloneElement(only, {
      "aria-describedby": describedby || void 0
    });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    as === "tr" ? /* @__PURE__ */ jsx("tr", { ...rest, ref: setTriggerRef, className: cn(hint, className), ...a11y, children: content }) : /* @__PURE__ */ jsx(
      "span",
      {
        ...rest,
        ref: setTriggerRef,
        className: cn(hint ? "inline" : "inline-flex items-center", hint, className),
        ...a11y,
        children: content
      }
    ),
    open ? /* @__PURE__ */ jsx(
      FloatingTip,
      {
        anchor: triggerRef,
        id,
        tip,
        side,
        onPointerEnter: () => onTipPointer(true),
        onPointerLeave: () => onTipPointer(false)
      }
    ) : null
  ] });
}
function FloatingTip({
  anchor,
  id,
  tip,
  side = "top",
  onPointerEnter,
  onPointerLeave
}) {
  const config = useNishContext();
  const tipRef = useRef(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, "center");
  return createPortal(
    /* @__PURE__ */ jsx(
      "span",
      {
        ref: tipRef,
        id,
        role: "tooltip",
        "data-side": pos?.side,
        "data-state": "open",
        onPointerEnter,
        onPointerLeave,
        style: floatingStyle(pos, {
          maxWidth: Math.min(TIP_MAX_WIDTH, (window.innerWidth || TIP_MAX_WIDTH) - 2 * EDGE),
          zIndex: "var(--nish-z-tooltip, 100)"
        }),
        className: "block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop",
        children: tip
      }
    ),
    layerHost(anchor.current, config.portalContainer)
  );
}
export {
  FloatingTip,
  Tooltip
};
