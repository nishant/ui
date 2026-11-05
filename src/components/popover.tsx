'use client';
import { useEffect, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { useIsClient } from './client';
import { useLatest } from './latest';
import { useNishConfig } from './provider';
import { focusables, layerHost, useMergedRef } from './overlay-core';
import { useAnchoredPosition, floatingStyle, useDismiss, useReturnFocus, type PopoverCloseReason } from './overlay-position';

export type { PopoverCloseReason } from './overlay-position';

export interface PopoverProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** Whether the panel shows. The popover is controlled: pair it with `onOpenChange`. */
  open: boolean;
  /** Called with false on Escape, a press outside, and Tab out of the panel. The second
   *  argument says which one: 'escape', 'outside' or 'tab'. */
  onOpenChange: (open: boolean, reason: PopoverCloseReason) => void;
  /** Close on a press outside the panel and its anchor (default true). Set false for
   *  an editor that must stay open while the user drags things outside it; Escape and
   *  Tab out still close it. */
  dismissOnOutside?: boolean;
  /** The element the panel sits next to (usually the button that opens it). Focus
   *  returns here when the panel closes. */
  anchor: RefObject<HTMLElement | null>;
  /** Preferred side; flips when there is no room. Default bottom. */
  side?: 'top' | 'bottom';
  /** Which edge of the anchor the panel lines up with (mirrored in right-to-left
   *  layouts). Default start. */
  align?: 'start' | 'center' | 'end';
  /** Panel width: a number of pixels or any CSS length. Default: fits the content. */
  width?: number | string;
  /** Accessible name of the panel (it has role="dialog"). */
  'aria-label'?: string;
  /** Classes for the panel (e.g. `p-0`, or `app-region-no-drag` in Electron apps). */
  className?: string;
  children: ReactNode;
  /** The popover panel (role="dialog"). */
  ref?: Ref<HTMLDivElement>;
}

/** A non-modal floating panel anchored to an element: filters, a color picker, a
 *  details card. Portaled (so no parent clips it), flipped and clamped to the screen.
 *  Escape and a press outside close it; focus returns to the anchor. Renders nothing on
 *  the server. */
export function Popover({
  open,
  onOpenChange,
  dismissOnOutside = true,
  anchor,
  side = 'bottom',
  align = 'start',
  width,
  'aria-label': ariaLabel,
  className,
  children,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}: PopoverProps) {
  const config = useNishConfig();
  const isClient = useIsClient();
  const [panelRef, setPanelRef] = useMergedRef<HTMLDivElement>(ref);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useLatest(onOpenChange);
  const outsideRef = useLatest(dismissOnOutside);
  useDismiss(open, panelRef, anchor, (reason) => {
    if (reason === 'outside' && !outsideRef.current) return;
    onOpenChangeRef.current(false, reason);
  });
  useReturnFocus(open, panelRef, anchor);

  // Focus in: [data-autofocus] or [autofocus], else the panel itself.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const p = panelRef.current;
      if (p && !p.contains(document.activeElement)) (p.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ?? p).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, panelRef]);

  if (!open || !isClient) return null;

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    userKeyDown?.(e);
    if (e.key !== 'Tab' || !panelRef.current) return;
    // The panel lives at the end of <body>, far from its anchor in the Tab order, so
    // tabbing past either end closes it and lands back on the anchor.
    const nodes = focusables(panelRef.current);
    const active = document.activeElement;
    const atStart = nodes.length === 0 || active === nodes[0] || active === panelRef.current;
    const atEnd = nodes.length === 0 || active === nodes[nodes.length - 1];
    if ((e.shiftKey && atStart) || (!e.shiftKey && atEnd)) {
      e.preventDefault();
      onOpenChangeRef.current(false, 'tab');
    }
  }

  return createPortal(
    <div
      {...rest}
      ref={setPanelRef}
      role="dialog"
      aria-label={ariaLabel}
      tabIndex={-1}
      data-side={pos?.side}
      data-state="open"
      onKeyDown={onKeyDown}
      style={floatingStyle(pos, {
        ...style,
        width,
        maxHeight: pos?.maxHeight,
        zIndex: 'var(--nish-z-dropdown, 40)',
      })}
      className={cn(
        'max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none',
        'animate-[nish-fade-in_120ms_ease-out]',
        className,
      )}
    >
      {children}
    </div>,
    layerHost(anchor.current, config.portalContainer),
  );
}

