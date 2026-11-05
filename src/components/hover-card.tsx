'use client';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { shared } from '../runtime';
import { isRtl, useIsClient, useIsoLayoutEffect } from './client';
import { mergeRefs, warnOnce } from './data-classes';
import { useLatest } from './latest';
import { place } from './overlay';
import { keyboardFocused, touchTracker } from './overlay-classes';
import { useNishConfig } from './provider';

export interface HoverCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'content' | 'className'> {
  /** The trigger: one element, usually a link. It keeps its own click and keyboard behavior. */
  children: ReactElement;
  /** What the card shows: a preview of where the link goes. Touch screens never open it, so show the same thing there. */
  content: ReactNode;
  /** Preferred side; flips when there is no room. Default bottom. */
  side?: 'top' | 'bottom';
  /** Which edge of the trigger the card lines up with (mirrored in right-to-left layouts). Default center. */
  align?: 'start' | 'center' | 'end';
  /** Milliseconds the pointer rests on the trigger (or keyboard focus stays) before the card opens. Default 500. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves the trigger and the card before it closes. Default 300. */
  closeDelay?: number;
  /** Controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Open on mount when uncontrolled (previews, tests). */
  defaultOpen?: boolean;
  /** Called when the card opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Card width: px or any CSS length. Default 320, never wider than the screen minus 16px. */
  width?: number | string;
  /** Classes for the card. */
  className?: string;
  /** The card element. */
  ref?: Ref<HTMLDivElement>;
}

interface CardPosition {
  top: number;
  left: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  maxHeight: number;
}

/** At most one card is open on a page: opening one closes the one before it at once. */
const openCard = (): { close: (() => void) | null } => shared('hoverCard', () => ({ close: null as (() => void) | null }));

/** Positions `card` next to `anchor` while `open`: measured before paint, flipped and clamped,
 *  and kept in place on scroll, resize and content changes. Null until the first measurement. */
function useCardPosition(
  anchor: RefObject<HTMLElement | null>,
  card: RefObject<HTMLElement | null>,
  open: boolean,
  side: 'top' | 'bottom',
  align: 'start' | 'center' | 'end',
): CardPosition | null {
  const [pos, setPos] = useState<CardPosition | null>(null);

  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = card.current;
      if (!a || !f) return;
      // The natural height, not the clamped one, so the flip decision does not change
      // once the card has been given a max-height.
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, 8, isRtl(a));
      setPos((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next,
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (card.current) ro?.observe(card.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro?.disconnect();
    };
  }, [anchor, card, open, side, align]);

  return open ? pos : null;
}

/** A preview card that opens after the pointer rests on a link or keyboard focus stays on it.
 *  Dismissible (Escape), hoverable (the pointer can move onto the card) and persistent (it stays
 *  until the pointer or focus leaves). Touch never opens it. Portaled like Tooltip. */
export function HoverCard({
  children,
  content,
  side = 'bottom',
  align = 'center',
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
}: HoverCardProps) {
  const [openState, setOpenState] = useState(defaultOpen ?? false);
  const open = openProp ?? openState;
  const config = useNishConfig();
  const isClient = useIsClient();
  const autoId = useId();
  const id = rest.id ?? autoId;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const latest = useLatest({ open, onOpenChange, controlled: openProp !== undefined });

  const child = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const valid = child !== null;

  useEffect(() => {
    if (!valid) warnOnce('hovercard-child', 'HoverCard: children must be one element, such as a link.');
  }, [valid]);

  const apply = useCallback(
    (next: boolean) => {
      const cur = latest.current;
      if (next === cur.open) return;
      if (!cur.controlled) setOpenState(next);
      cur.onOpenChange?.(next);
    },
    [latest],
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

  // Native listeners on the trigger wrapper, like Tooltip.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const touch = touchTracker();
    const onPointerEnterTrigger = (e: PointerEvent) => touch.onPointer(e);
    const onPointerDown = (e: PointerEvent) => {
      touch.onPointer(e);
      if (e.pointerType === 'touch') closeNow();
    };
    const onMouseEnter = () => {
      if (!touch.recent()) show();
    };
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Element && keyboardFocused(e.target)) show();
    };
    el.addEventListener('pointerenter', onPointerEnterTrigger);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', hide);
    return () => {
      window.clearTimeout(timer.current);
      el.removeEventListener('pointerenter', onPointerEnterTrigger);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', hide);
    };
  }, [valid, show, hide, closeNow]);

  // Escape dismisses the card however it opened (WCAG 1.4.13), without also closing a dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeNow();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, closeNow]);

  // One card at a time: close the open one, and be the one the next card closes.
  useEffect(() => {
    if (!open) return;
    const slot = openCard();
    if (slot.close && slot.close !== closeNow) slot.close();
    slot.close = closeNow;
    return () => {
      if (slot.close === closeNow) slot.close = null;
    };
  }, [open, closeNow]);

  // The portal target depends on where the trigger sits (inside a dialog layer or not), known only after mount.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useIsoLayoutEffect(() => {
    setHost(open ? (wrapperRef.current?.closest<HTMLElement>('[data-nish-layer]') ?? config.portalContainer ?? document.body) : null);
  }, [open, config.portalContainer]);
  const cardRefs = useMemo(() => mergeRefs(cardRef, ref), [ref]);

  const pos = useCardPosition(wrapperRef, cardRef, open && isClient && valid && host !== null, side, align);

  if (!child) return <>{children}</>;

  const existing = child.props['aria-describedby'];
  const describedby = open ? [typeof existing === 'string' ? existing : '', id].filter(Boolean).join(' ') : existing;
  const trigger = cloneElement(child, { 'aria-describedby': describedby || undefined });

  return (
    <>
      <span ref={wrapperRef} className="inline-flex" data-state={open ? 'open' : 'closed'}>
        {trigger}
      </span>
      {open && isClient && host
        ? createPortal(
            <div
              {...rest}
              ref={cardRefs}
              id={id}
              data-side={pos?.side}
              data-state="open"
              onPointerEnter={(e) => {
                stay();
                onPointerEnter?.(e);
              }}
              onPointerLeave={(e) => {
                hide();
                onPointerLeave?.(e);
              }}
              style={{
                ...style,
                position: 'fixed',
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                visibility: pos ? undefined : 'hidden',
                width,
                maxWidth: 'calc(100vw - 1rem)',
                maxHeight: pos?.maxHeight,
                zIndex: 'var(--nish-z-tooltip, 100)',
              }}
              className={cn(
                'overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop animate-[nish-fade-in_120ms_ease-out] motion-reduce:animate-none',
                className,
              )}
            >
              {content}
            </div>,
            host,
          )
        : null}
    </>
  );
}
