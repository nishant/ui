"use client";

// src/components/overlay-position.ts
import { useEffect, useRef, useState } from "react";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { useLatest } from "./latest.js";
import { ov, isTop } from "./overlay-core.js";
var GAP = 8;
var EDGE = 8;
var OPPOSITE = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
function viewport() {
  return {
    vw: window.innerWidth || document.documentElement.clientWidth || 0,
    vh: window.innerHeight || document.documentElement.clientHeight || 0
  };
}
function clamp(v, size, limit) {
  return Math.max(EDGE, Math.min(v, limit - size - EDGE));
}
function place(r, w, h, side, align, gap, rtl = false) {
  const { vw, vh } = viewport();
  const room = {
    top: r.top,
    bottom: vh - r.bottom,
    left: r.left,
    right: vw - r.right
  };
  const need = side === "top" || side === "bottom" ? h + gap + EDGE : w + gap + EDGE;
  const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
  if (chosen === "top" || chosen === "bottom") {
    const top2 = chosen === "top" ? r.top - gap - h : r.bottom + gap;
    const edge = rtl && align !== "center" ? align === "start" ? "end" : "start" : align;
    const left2 = edge === "start" ? r.left : edge === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    return {
      side: chosen,
      top: clamp(top2, h, vh),
      left: clamp(left2, w, vw),
      maxHeight: Math.max(0, room[chosen] - gap - EDGE)
    };
  }
  const left = chosen === "left" ? r.left - gap - w : r.right + gap;
  const top = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return {
    side: chosen,
    top: clamp(top, h, vh),
    left: clamp(left, w, vw),
    maxHeight: Math.max(0, vh - 2 * EDGE)
  };
}
function useAnchoredPosition(anchor, floating, open, side, align, gap = GAP) {
  const [pos, setPos] = useState(null);
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = floating.current;
      if (!a || !f) return;
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, gap, isRtl(a));
      setPos(
        (prev) => prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (floating.current) ro?.observe(floating.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [anchor, floating, open, side, align, gap]);
  return open ? pos : null;
}
function floatingStyle(pos, extra) {
  return {
    position: "fixed",
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    visibility: pos ? void 0 : "hidden",
    ...extra
  };
}
function useDismiss(open, panel, anchor, close) {
  const closeRef = useLatest(close);
  useEffect(() => {
    if (!open) return;
    const { layerStack } = ov();
    const self = {};
    layerStack.push(self);
    const onKey = (e) => {
      if (e.key === "Escape" && isTop(self)) {
        e.stopPropagation();
        closeRef.current("escape");
      }
    };
    const onDown = (e) => {
      const t = e.target;
      if (!t || panel.current?.contains(t) || anchor.current?.contains(t)) return;
      if (!isTop(self)) return;
      closeRef.current("outside");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      const at = layerStack.indexOf(self);
      if (at >= 0) layerStack.splice(at, 1);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, panel, anchor, closeRef]);
}
function useReturnFocus(open, panel, anchor) {
  const wasOpen = useRef(false);
  const focusWasInside = useRef(false);
  useEffect(() => {
    if (!open) return;
    const p = panel.current;
    const track = () => {
      focusWasInside.current = !!p && p.contains(document.activeElement);
    };
    p?.addEventListener("focusin", track);
    p?.addEventListener("focusout", track);
    return () => {
      p?.removeEventListener("focusin", track);
      p?.removeEventListener("focusout", track);
    };
  }, [open, panel]);
  useIsoLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const active = document.activeElement;
    if (focusWasInside.current || !active || active === document.body) anchor.current?.focus();
    focusWasInside.current = false;
  }, [open, anchor]);
}
export {
  EDGE,
  GAP,
  OPPOSITE,
  clamp,
  floatingStyle,
  place,
  useAnchoredPosition,
  useDismiss,
  useReturnFocus,
  viewport
};
