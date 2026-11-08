'use client';
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode, type Ref, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { shared } from '../runtime';
import { useIsoLayoutEffect } from './client';
import { useNishContext } from './provider';
import { keyboardFocused, touchTracker } from './overlay-classes';
import { FOCUSABLE, layerHost, useMergedRef } from './overlay-core';
import { type Side, EDGE, useAnchoredPosition, floatingStyle } from './overlay-position';

// ---------------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------------

export interface TooltipProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'> {
  /** What the tooltip says. Keep it to a sentence or two. */
  tip: ReactNode;
  /** The trigger. When it is a single focusable element (a button, a link, an IconButton)
   *  it gets `aria-describedby` and no extra Tab stop; any other content is wrapped in a
   *  focusable span so keyboard users can read the tip. */
  children: ReactNode;
  className?: string;
  /** Preferred side; flips to the opposite one when there is no room. `right` suits
   *  a collapsed sidebar. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Element used for the trigger. Pass `tr` inside tables, where a span would be
   *  invalid markup and get hoisted out of the table by the parser. */
  as?: 'span' | 'tr';
  /** Adds the wrapper to the Tab order. Default: true, except when the child is a single
   *  focusable element (that element is the tab stop). Set false for dense marks such
   *  as 60 chart bars, and make the value reachable another way. */
  focusable?: boolean;
  /** default: the trigger keeps its own look. hint: a dotted underline and a help
   *  cursor, for a term whose meaning the tip explains. */
  variant?: 'default' | 'hint';
  /** The trigger wrapper. */
  ref?: Ref<HTMLElement>;
}

const TIP_MAX_WIDTH = 320;
const TIP_GRACE_MS = 100;

/** At most one tip is open on a page: opening one closes the one before it at once, so the
 *  grace period that lets the pointer reach a tip never leaves two on screen. */
const openTip = (): { close: (() => void) | null } => shared('tooltip', () => ({ close: null }));
const FOCUSABLE_HOST_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

/** Hover/focus tooltip rendered through a portal (into the dialog it sits in, else the
 *  configured container, else <body>), so `overflow:hidden` ancestors (truncated labels,
 *  scrolling tables) can never clip it. Positioned from the trigger's viewport rect,
 *  flipped and clamped to stay on screen. Escape dismisses it, and the pointer can move
 *  onto it (WCAG 1.4.13). */
export function Tooltip({ tip, children, className, side = 'top', as = 'span', focusable, variant = 'default', ref, ...rest }: TooltipProps) {
  const [triggerRef, setTriggerRef] = useMergedRef<HTMLElement>(ref);
  const [open, setOpen] = useState(false);
  const id = useId();
  const graceTimer = useRef(0);

  // A single element child may already be the tab stop: a native control, or (measured
  // before paint) a component that renders one.
  const only = isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const staticInner = only !== null && typeof only.type === 'string' && FOCUSABLE_HOST_TAGS.has(only.type);
  const [measuredInner, setMeasuredInner] = useState(false);
  useIsoLayoutEffect(() => {
    const el = triggerRef.current;
    const found = only !== null && !!el && el.querySelector(FOCUSABLE) !== null;
    setMeasuredInner(found);
  });
  const inner = only !== null && (staticInner || measuredInner);

  // Native listeners: React's synthetic onMouseEnter never fires for a `tr` trigger.
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
    // focusin, so a focusable child (a button inside the trigger) shows it too, but only
    // from the keyboard: a tap on that child does its job and must not pin the tip open.
    // The trigger itself (a hint term) still opens on a tap, the only way to read it on a phone.
    const onFocusIn = (e: FocusEvent) => {
      if (e.target === el || (e.target instanceof Element && keyboardFocused(e.target))) show();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== el) hide();
    };
    el.addEventListener('pointerenter', touch.onPointer);
    el.addEventListener('pointerdown', touch.onPointer);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', hideSoon);
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', hide);
    return () => {
      window.clearTimeout(graceTimer.current);
      el.removeEventListener('pointerenter', touch.onPointer);
      el.removeEventListener('pointerdown', touch.onPointer);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', hideSoon);
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', hide);
    };
  }, [triggerRef]);

  // One tip at a time: close the open one, and be the one the next tip closes.
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

  // Escape dismisses a tip however it opened (WCAG 1.4.13), without also closing a dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const onTipPointer = useCallback((over: boolean) => {
    window.clearTimeout(graceTimer.current);
    if (!over) graceTimer.current = window.setTimeout(() => setOpen(false), TIP_GRACE_MS);
  }, []);

  const wrapperFocusable = focusable ?? !inner;
  const a11y = {
    tabIndex: wrapperFocusable ? 0 : undefined,
    'aria-describedby': open && !inner ? id : undefined,
    'data-state': open ? 'open' : 'closed',
  };
  const hint = variant === 'hint' && 'cursor-help underline decoration-th-hi3 decoration-dotted underline-offset-2';

  let content = children;
  if (inner && only) {
    const existing = only.props['aria-describedby'];
    const describedby = open ? [typeof existing === 'string' ? existing : '', id].filter(Boolean).join(' ') : existing;
    content = cloneElement(only, {
      'aria-describedby': describedby || undefined,
    });
  }

  return (
    <>
      {as === 'tr' ? (
        <tr {...(rest as ComponentPropsWithoutRef<'tr'>)} ref={setTriggerRef as Ref<HTMLTableRowElement>} className={cn(hint, className)} {...a11y}>
          {content}
        </tr>
      ) : (
        <span
          {...rest}
          ref={setTriggerRef as Ref<HTMLSpanElement>}
          // inline-flex would stop the hint underline reaching the text, so hints stay inline.
          className={cn(hint ? 'inline' : 'inline-flex items-center', hint, className)}
          {...a11y}
        >
          {content}
        </span>
      )}
      {open ? (
        <FloatingTip
          anchor={triggerRef}
          id={id}
          tip={tip}
          side={side}
          onPointerEnter={() => onTipPointer(true)}
          onPointerLeave={() => onTipPointer(false)}
        />
      ) : null}
    </>
  );
}

/** The tooltip bubble on its own, for components that are their own trigger (a
 *  Segmented option): portaled next to the anchor's dialog or the configured container,
 *  placed next to `anchor` while mounted. Internal to the package; mount it only while
 *  the tip shows, keyed by the anchor. `onPointerEnter` / `onPointerLeave` let the
 *  trigger keep the tip open while the pointer is on it. */
export function FloatingTip({
  anchor,
  id,
  tip,
  side = 'top',
  onPointerEnter,
  onPointerLeave,
}: {
  anchor: RefObject<HTMLElement | null>;
  id: string;
  tip: ReactNode;
  side?: Side;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const config = useNishContext();
  const tipRef = useRef<HTMLSpanElement>(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, 'center');
  return createPortal(
    <span
      ref={tipRef}
      id={id}
      role="tooltip"
      data-side={pos?.side}
      data-state="open"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={floatingStyle(pos, {
        maxWidth: Math.min(TIP_MAX_WIDTH, (window.innerWidth || TIP_MAX_WIDTH) - 2 * EDGE),
        zIndex: 'var(--nish-z-tooltip, 100)',
      })}
      className="block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop"
    >
      {tip}
    </span>,
    layerHost(anchor.current, config.portalContainer),
  );
}

