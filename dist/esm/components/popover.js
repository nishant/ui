"use client";

// src/components/popover.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { useIsClient } from "./client.js";
import { useLatest } from "./latest.js";
import { useNishContext } from "./provider.js";
import { focusables, layerHost, useMergedRef } from "./overlay-core.js";
import { useAnchoredPosition, floatingStyle, useDismiss, useReturnFocus } from "./overlay-position.js";
import { jsx } from "react/jsx-runtime";
function Popover({
  open,
  onOpenChange,
  dismissOnOutside = true,
  anchor,
  side = "bottom",
  align = "start",
  width,
  "aria-label": ariaLabel,
  className,
  children,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}) {
  const config = useNishContext();
  const isClient = useIsClient();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useLatest(onOpenChange);
  const outsideRef = useLatest(dismissOnOutside);
  useDismiss(open, panelRef, anchor, (reason) => {
    if (reason === "outside" && !outsideRef.current) return;
    onOpenChangeRef.current(false, reason);
  });
  useReturnFocus(open, panelRef, anchor);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const p = panelRef.current;
      if (p && !p.contains(document.activeElement)) (p.querySelector("[data-autofocus],[autofocus]") ?? p).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, panelRef]);
  if (!open || !isClient) return null;
  function onKeyDown(e) {
    userKeyDown?.(e);
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = focusables(panelRef.current);
    const active = document.activeElement;
    const atStart = nodes.length === 0 || active === nodes[0] || active === panelRef.current;
    const atEnd = nodes.length === 0 || active === nodes[nodes.length - 1];
    if (e.shiftKey && atStart || !e.shiftKey && atEnd) {
      e.preventDefault();
      onOpenChangeRef.current(false, "tab");
    }
  }
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        ...rest,
        ref: setPanelRef,
        role: "dialog",
        "aria-label": ariaLabel,
        tabIndex: -1,
        "data-side": pos?.side,
        "data-state": "open",
        onKeyDown,
        style: floatingStyle(pos, {
          ...style,
          width,
          maxHeight: pos?.maxHeight,
          zIndex: "var(--nish-z-dropdown, 40)"
        }),
        className: cn(
          "max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none",
          "animate-[nish-fade-in_120ms_ease-out]",
          className
        ),
        children
      }
    ),
    layerHost(anchor.current, config.portalContainer)
  );
}
export {
  Popover
};
