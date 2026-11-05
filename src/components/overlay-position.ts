'use client';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { isRtl, useIsoLayoutEffect } from './client';
import { useLatest } from './latest';
import { ov, isTop } from './overlay-core';

// ---------------------------------------------------------------------------------
// Anchored positioning (Tooltip, Popover, DropdownMenu)
// ---------------------------------------------------------------------------------

/** @internal */
export type Side = 'top' | 'bottom' | 'left' | 'right';
/** @internal */
export type Align = 'start' | 'center' | 'end';

/** @internal */
export interface AnchoredPosition {
  top: number;
  left: number;
  side: Side;
  /** Room left on the chosen side (px), for the panel's max-height. */
  maxHeight: number;
}

/** @internal */
export const GAP = 8;
/** @internal */
export const EDGE = 8;

/** @internal */
export const OPPOSITE: Record<Side, Side> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** @internal */
export function viewport() {
  return {
    vw: window.innerWidth || document.documentElement.clientWidth || 0,
    vh: window.innerHeight || document.documentElement.clientHeight || 0,
  };
}

/** @internal */
export function clamp(v: number, size: number, limit: number): number {
  // When the panel is bigger than the room, pin it to the start edge.
  return Math.max(EDGE, Math.min(v, limit - size - EDGE));
}

/** @internal Where a floating panel of size w × h goes next to rect r: on `side` if it fits,
 *  else on the opposite side when that has more room, then clamped into the viewport.
 *  In a right-to-left layout `start` and `end` swap for top and bottom panels. */
export function place(r: DOMRect, w: number, h: number, side: Side, align: Align, gap: number, rtl = false): AnchoredPosition {
  const { vw, vh } = viewport();
  const room: Record<Side, number> = {
    top: r.top,
    bottom: vh - r.bottom,
    left: r.left,
    right: vw - r.right,
  };
  const need = side === 'top' || side === 'bottom' ? h + gap + EDGE : w + gap + EDGE;
  const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;

  if (chosen === 'top' || chosen === 'bottom') {
    const top = chosen === 'top' ? r.top - gap - h : r.bottom + gap;
    const edge = rtl && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align;
    const left = edge === 'start' ? r.left : edge === 'end' ? r.right - w : r.left + r.width / 2 - w / 2;
    return {
      side: chosen,
      top: clamp(top, h, vh),
      left: clamp(left, w, vw),
      maxHeight: Math.max(0, room[chosen] - gap - EDGE),
    };
  }
  const left = chosen === 'left' ? r.left - gap - w : r.right + gap;
  const top = align === 'start' ? r.top : align === 'end' ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return {
    side: chosen,
    top: clamp(top, h, vh),
    left: clamp(left, w, vw),
    maxHeight: Math.max(0, vh - 2 * EDGE),
  };
}

/** @internal Positions `floating` next to `anchor` while `open`: measured before paint, flipped
 *  and clamped, and kept in place on scroll, resize and content changes. Returns null
 *  until the first measurement (render the panel hidden until then). */
export function useAnchoredPosition(
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  open: boolean,
  side: Side,
  align: Align,
  gap = GAP,
): AnchoredPosition | null {
  const [pos, setPos] = useState<AnchoredPosition | null>(null);

  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = floating.current;
      if (!a || !f) return;
      // The natural height, not the clamped one, so the flip decision does not change
      // once the panel has been given a max-height.
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, gap, isRtl(a));
      setPos((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next,
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (floating.current) ro?.observe(floating.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro?.disconnect();
    };
  }, [anchor, floating, open, side, align, gap]);

  return open ? pos : null;
}

/** @internal */
export function floatingStyle(pos: AnchoredPosition | null, extra?: CSSProperties): CSSProperties {
  return {
    position: 'fixed',
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    visibility: pos ? undefined : 'hidden',
    ...extra,
  };
}

// ---------------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------------

/** @internal Escape (top layer only) and outside-press closing for non-modal floating panels. */
export function useDismiss(
  open: boolean,
  panel: RefObject<HTMLElement | null>,
  anchor: RefObject<HTMLElement | null>,
  close: (reason: 'escape' | 'outside') => void,
) {
  const closeRef = useLatest(close);
  useEffect(() => {
    if (!open) return;
    const { layerStack } = ov();
    const self = {};
    layerStack.push(self);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTop(self)) {
        e.stopPropagation();
        closeRef.current('escape');
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t || panel.current?.contains(t) || anchor.current?.contains(t)) return;
      // A press inside a layer opened on top of this one (a menu inside the popover)
      // is not outside.
      if (!isTop(self)) return;
      closeRef.current('outside');
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      const at = layerStack.indexOf(self);
      if (at >= 0) layerStack.splice(at, 1);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, panel, anchor, closeRef]);
}

/** @internal Puts focus back on the anchor when a panel closes while focus was inside it (or
 *  was lost to <body>). A press elsewhere that moved focus keeps it there. */
export function useReturnFocus(open: boolean, panel: RefObject<HTMLElement | null>, anchor: RefObject<HTMLElement | null>) {
  const wasOpen = useRef(false);
  const focusWasInside = useRef(false);
  useEffect(() => {
    if (!open) return;
    const p = panel.current;
    const track = () => {
      focusWasInside.current = !!p && p.contains(document.activeElement);
    };
    p?.addEventListener('focusin', track);
    p?.addEventListener('focusout', track);
    return () => {
      p?.removeEventListener('focusin', track);
      p?.removeEventListener('focusout', track);
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

/** Why a Popover or DropdownMenu closed itself: Escape, a press outside, or Tab out. */
export type PopoverCloseReason = 'escape' | 'outside' | 'tab';
