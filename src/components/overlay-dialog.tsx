'use client';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { cn } from '../cn';
import { useLatest } from './latest';
import { useNishStrings } from './provider';
import { SHEET_EXIT_MS } from './overlay-classes';
import { ov, isTop, syncLayerAttr, pushInert, popInert, acquireGuard, releaseGuard, prefersReducedMotion, closeVetoes, focusables, lockScroll, queueHistoryPush, cancelHistoryPush } from './overlay-core';

/** @internal The internals every modal surface shares (Modal, Drawer, ConfirmDialog): stack
 *  membership, focus in, Tab trap, Escape, focus return and the html + body lock. */
export function useDialog(panelRef: RefObject<HTMLElement | null>, onClose: () => void, closeOnBackProp = false) {
  // Inside an iframe (the docs previews) pushState would add to the top-level history.
  const closeOnBack = closeOnBackProp && (typeof window === 'undefined' || window.self === window.top);
  const onCloseRef = useLatest(onClose);

  useEffect(() => {
    const s = ov();
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const self = {};
    s.layerStack.push(self);
    s.dialogCount++;
    syncLayerAttr();
    const scrim = panel?.closest<HTMLElement>('[data-nish-layer]') ?? null;
    if (scrim) pushInert(scrim);

    // Android back / browser back closes the top layer: the layer owns one history
    // entry. The push is deferred a tick so a Strict Mode mount-unmount-mount does not
    // push and pop an entry.
    const layerId = `nish-layer-${++s.layerSeq}`;
    let pushed = false;
    let rePushTimer = 0;
    const pushEntry = () => {
      const prev = history.state && typeof history.state === 'object' ? (history.state as object) : {};
      history.pushState({ ...prev, nishLayer: layerId }, '');
      pushed = true;
    };
    // pushState waits until every history.back() this module issued has landed.
    const queuedPush = () => queueHistoryPush(pushEntry);
    // The guard goes on before this layer's own popstate listener, so swallowed events
    // never reach it.
    if (closeOnBack) acquireGuard();
    const pushTimer = closeOnBack ? window.setTimeout(queuedPush, 0) : 0;
    function onPop() {
      if (!pushed) return;
      if ((history.state as { nishLayer?: string } | null)?.nishLayer === layerId) return;
      pushed = false;
      if (!isTop(self)) {
        // A popover or menu is on top of this dialog: back only used up its entry, so
        // push it again and leave the dialog open.
        pushEntry();
        return;
      }
      onCloseRef.current();
      // The close may be vetoed (ConfirmDialog while pending) or the parent may keep the
      // layer mounted: once the exit animation would have finished, take an entry again.
      window.clearTimeout(rePushTimer);
      rePushTimer = window.setTimeout(() => {
        if (!pushed) queuedPush();
      }, SHEET_EXIT_MS + 60);
    }
    if (closeOnBack) window.addEventListener('popstate', onPop);
    // React's autoFocus focuses the element itself and writes no attribute, so let it
    // run first; only if focus is still outside the panel, pick [data-autofocus] /
    // [autofocus], else the panel.
    const focusTimer = window.setTimeout(() => {
      if (panel && !panel.contains(document.activeElement)) {
        (panel.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ?? panel).focus();
      }
    }, 0);
    const unlock = lockScroll();

    function onKey(e: KeyboardEvent) {
      if (!isTop(self)) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = focusables(panel);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(pushTimer);
      window.clearTimeout(rePushTimer);
      cancelHistoryPush(pushEntry);
      window.removeEventListener('popstate', onPop);
      const at = s.layerStack.indexOf(self);
      if (at >= 0) s.layerStack.splice(at, 1);
      s.dialogCount--;
      syncLayerAttr();
      if (scrim) popInert(scrim);
      document.removeEventListener('keydown', onKey);
      unlock();
      opener?.focus?.();
      // Closed by anything but back: drop the entry this layer pushed.
      if (pushed && (history.state as { nishLayer?: string } | null)?.nishLayer === layerId) {
        s.pendingBacks++;
        history.back();
      }
      // After the back above, so the guard stays until its popstate has landed.
      if (closeOnBack) releaseGuard();
    };
  }, [panelRef, closeOnBack, onCloseRef]);
}

/** @internal Keeps a sheet mounted while it plays its exit animation. The parent unmounts it (or
 *  sets `open` to false) in `onClose` / `onOpenChange`, so the exit runs between the close
 *  request and those calls. */
export function useSheetExit(onClose: (() => void) | undefined, canClose?: () => boolean, onOpenChange?: (open: boolean) => void) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timer = useRef(0);
  const onCloseRef = useLatest(onClose);
  const openChangeRef = useLatest(onOpenChange);
  const canCloseRef = useLatest(canClose);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const fire = useCallback(() => {
    onCloseRef.current?.();
    openChangeRef.current?.(false);
  }, [onCloseRef, openChangeRef]);
  /** Plays the exit animation, then calls `onClose` and `onOpenChange(false)`. */
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    const handler = onCloseRef.current;
    if (handler && closeVetoes.get(handler)?.()) return;
    if (canCloseRef.current && !canCloseRef.current()) return;
    if (prefersReducedMotion()) {
      fire();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      fire();
      // Still mounted (the parent kept it): show it again.
      closingRef.current = false;
      setClosing(false);
    }, SHEET_EXIT_MS);
  }, [canCloseRef, fire, onCloseRef]);
  /** Calls the close callbacks at once, for a swipe that already animated the sheet away. */
  const closeNow = useCallback(() => {
    fire();
  }, [fire]);
  const isClosing = useCallback(() => closingRef.current, []);
  /** False when the app's canClose refuses: a swipe springs back instead of dismissing. */
  const allowClose = useCallback(() => !canCloseRef.current || canCloseRef.current(), [canCloseRef]);
  return { closing, requestClose, closeNow, isClosing, allowClose };
}

/** @internal Pointer-driven swipe down on a bottom sheet. Spread the result on the drag handle and
 *  the header. The sheet follows the finger (rubber-banded upward), then closes past 30%
 *  of its height or at 0.5 px/ms, and otherwise springs back over 180ms. */
export function useSheetSwipe(
  panelRef: RefObject<HTMLElement | null>,
  scrimRef: RefObject<HTMLElement | null>,
  enabled: () => boolean,
  onDismiss: () => void,
  allow: () => boolean = () => true,
) {
  const drag = useRef<{
    startY: number;
    dy: number;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);
  const timer = useRef(0);
  const enabledRef = useLatest(enabled);
  const dismissRef = useLatest(onDismiss);
  const allowRef = useLatest(allow);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (drag.current || !enabledRef.current()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const hit = (e.target as HTMLElement).closest('button,a,input,select,textarea,[role="button"]');
      if (hit && hit !== e.currentTarget) return;
      const panel = panelRef.current;
      if (!panel) return;
      window.clearTimeout(timer.current);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      panel.style.transition = 'none';
      if (scrimRef.current) scrimRef.current.style.transition = 'none';
      drag.current = {
        startY: e.clientY,
        dy: 0,
        lastY: e.clientY,
        lastT: e.timeStamp,
        v: 0,
      };
    },
    [enabledRef, panelRef, scrimRef],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current;
      const panel = panelRef.current;
      if (!d || !panel) return;
      d.dy = e.clientY - d.startY;
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
      panel.style.transform = `translateY(${d.dy < 0 ? d.dy * 0.3 : d.dy}px)`;
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, d.dy) / Math.max(1, panel.offsetHeight)));
      }
    },
    [panelRef, scrimRef],
  );

  const end = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
      const d = drag.current;
      const panel = panelRef.current;
      drag.current = null;
      if (!d || !panel) return;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      const scrim = scrimRef.current;
      const velocity = e.timeStamp - d.lastT > 100 ? 0 : d.v;
      // allow() runs only for a gesture that would dismiss: it may show the app's reason.
      const dismiss = !cancelled && (d.dy > panel.offsetHeight * 0.3 || velocity > 0.5) && allowRef.current();
      const ms = SHEET_EXIT_MS - 20;
      panel.style.transition = `transform ${ms}ms ease-out`;
      if (scrim) scrim.style.transition = `opacity ${ms}ms ease-out`;
      if (dismiss) {
        panel.style.transform = 'translateY(100%)';
        if (scrim) scrim.style.opacity = '0';
        timer.current = window.setTimeout(() => dismissRef.current(), ms);
      } else {
        panel.style.transform = 'translateY(0)';
        if (scrim) scrim.style.opacity = '1';
        timer.current = window.setTimeout(() => {
          panel.style.transform = '';
          panel.style.transition = '';
          if (scrim) {
            scrim.style.opacity = '';
            scrim.style.transition = '';
          }
        }, ms);
      }
    },
    [allowRef, dismissRef, panelRef, scrimRef],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => end(e, false),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => end(e, true),
  };
}

/** @internal */
export type SheetSwipe = ReturnType<typeof useSheetSwipe>;

/** @internal The grab bar on top of a bottom sheet: drag it down to dismiss, or press Enter or
 *  Space when it has focus. */
export function SheetHandle({ onClose, swipe, className }: { onClose: () => void; swipe: SheetSwipe; className?: string }) {
  const strings = useNishStrings();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={strings.close}
      {...swipe}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      className={cn(
        'flex h-5 min-h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-none focus-visible:bg-th-overlay forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-2',
        className,
      )}
    >
      <span className="h-1 w-10 rounded-full bg-th-line-strong forced-colors:bg-[ButtonText]" aria-hidden="true" />
    </div>
  );
}

