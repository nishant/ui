"use client";

// src/components/hover-card.tsx
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { shared } from "../runtime.js";
import { isRtl, useIsClient, useIsoLayoutEffect } from "./client.js";
import { mergeRefs, warnOnce } from "./data-classes.js";
import { useLatest } from "./latest.js";
import { place } from "./overlay-position.js";
import { keyboardFocused, touchTracker } from "./overlay-classes.js";
import { useNishContext } from "./provider.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var openCard = () => shared("hoverCard", () => ({ close: null }));
function useCardPosition(anchor, card, open, side, align) {
  const [pos, setPos] = useState(null);
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = card.current;
      if (!a || !f) return;
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, 8, isRtl(a));
      setPos(
        (prev) => prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (card.current) ro?.observe(card.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [anchor, card, open, side, align]);
  return open ? pos : null;
}
function HoverCard({
  children,
  content,
  side = "bottom",
  align = "center",
  openDelay = 500,
  closeDelay = 300,
  open: openProp,
  defaultOpen,
  onOpenChange,
  width = 320,
  className,
  ref,
  style,
  onPointerEnter,
  onPointerLeave,
  ...rest
}) {
  const [openState, setOpenState] = useState(defaultOpen ?? false);
  const open = openProp ?? openState;
  const config = useNishContext();
  const isClient = useIsClient();
  const autoId = useId();
  const id = rest.id ?? autoId;
  const wrapperRef = useRef(null);
  const cardRef = useRef(null);
  const timer = useRef(0);
  const latest = useLatest({ open, onOpenChange, controlled: openProp !== void 0 });
  const child = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const valid = child !== null;
  useEffect(() => {
    if (!valid) warnOnce("hovercard-child", "HoverCard: children must be one element, such as a link.");
  }, [valid]);
  const apply = useCallback(
    (next) => {
      const cur = latest.current;
      if (next === cur.open) return;
      if (!cur.controlled) setOpenState(next);
      cur.onOpenChange?.(next);
    },
    [latest]
  );
  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => apply(true), openDelay);
  }, [apply, openDelay]);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => apply(false), closeDelay);
  }, [apply, closeDelay]);
  const stay = useCallback(() => window.clearTimeout(timer.current), []);
  const closeNow = useCallback(() => {
    window.clearTimeout(timer.current);
    apply(false);
  }, [apply]);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const touch = touchTracker();
    const onPointerEnterTrigger = (e) => touch.onPointer(e);
    const onPointerDown = (e) => {
      touch.onPointer(e);
      if (e.pointerType === "touch") closeNow();
    };
    const onMouseEnter = () => {
      if (!touch.recent()) show();
    };
    const onMouseLeave = (e) => {
      if (e.relatedTarget instanceof Node && cardRef.current?.contains(e.relatedTarget)) return;
      const active = document.activeElement;
      if (active && el.contains(active) && keyboardFocused(active)) return;
      hide();
    };
    const onFocusIn = (e) => {
      if (e.target instanceof Element && keyboardFocused(e.target)) show();
    };
    el.addEventListener("pointerenter", onPointerEnterTrigger);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", hide);
    return () => {
      window.clearTimeout(timer.current);
      el.removeEventListener("pointerenter", onPointerEnterTrigger);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", hide);
    };
  }, [valid, show, hide, closeNow]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeNow();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, closeNow]);
  useEffect(() => {
    if (!open) return;
    const slot = openCard();
    if (slot.close && slot.close !== closeNow) slot.close();
    slot.close = closeNow;
    return () => {
      if (slot.close === closeNow) slot.close = null;
    };
  }, [open, closeNow]);
  const [host, setHost] = useState(null);
  useIsoLayoutEffect(() => {
    setHost(open ? wrapperRef.current?.closest("[data-nish-layer]") ?? config.portalContainer ?? document.body : null);
  }, [open, config.portalContainer]);
  const cardRefs = useMemo(() => mergeRefs(cardRef, ref), [ref]);
  const pos = useCardPosition(wrapperRef, cardRef, open && isClient && valid && host !== null, side, align);
  if (!child) return /* @__PURE__ */ jsx(Fragment, { children });
  const existing = child.props["aria-describedby"];
  const describedby = open ? [typeof existing === "string" ? existing : "", id].filter(Boolean).join(" ") : existing;
  const trigger = cloneElement(child, { "aria-describedby": describedby || void 0 });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("span", { ref: wrapperRef, className: "inline-flex", "data-state": open ? "open" : "closed", children: trigger }),
    open && isClient && host ? createPortal(
      /* @__PURE__ */ jsx(
        "div",
        {
          ...rest,
          ref: cardRefs,
          id,
          "data-side": pos?.side,
          "data-state": "open",
          onPointerEnter: (e) => {
            stay();
            onPointerEnter?.(e);
          },
          onPointerLeave: (e) => {
            hide();
            onPointerLeave?.(e);
          },
          style: {
            ...style,
            position: "fixed",
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            visibility: pos ? void 0 : "hidden",
            width,
            maxWidth: "calc(100vw - 1rem)",
            maxHeight: pos?.maxHeight,
            zIndex: "var(--nish-z-tooltip, 100)"
          },
          className: cn(
            "overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop animate-[nish-fade-in_120ms_ease-out] motion-reduce:animate-none",
            className
          ),
          children: content
        }
      ),
      host
    ) : null
  ] });
}
export {
  HoverCard
};
