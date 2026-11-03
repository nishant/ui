'use client';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { shared } from '../runtime';
import { isRtl, useIsClient, useIsoLayoutEffect } from './client';
import { useMediaQuery } from './hooks';
import { XIcon } from './icons';
import { Button, IconButton } from './primitives';
import { useLatest } from './latest';
import { Portal } from './portal';
import { useNishConfig, useNishStrings } from './provider';
import {
  CLOSE_BUTTON,
  DRAWER_SHEET_HEIGHT,
  DRAWER_WIDTH,
  MENU_ROW,
  MODAL_SIZE,
  PHONE_QUERY,
  SHEET_EXIT_MS,
  SHEET_HEIGHT_CLASS,
  keyboardFocused,
  menuItemClass,
  touchTracker,
  type MenuItemClassOptions,
} from './overlay-classes';

// The pure helpers live in overlay-classes.ts; these re-exports keep the old import paths.
export { keyboardFocused, menuItemClass, touchTracker };
export type { MenuItemClassOptions };

// ---------------------------------------------------------------------------------
// Shared layer plumbing: one stack for everything that answers Escape (dialogs,
// drawers, popovers, menus), one scroll lock for <html> and <body>, one focus trap.
// All of it lives in shared('overlay'), so every entry and every copy of the package on a
// page uses the same stack, lock and inert bookkeeping.
// ---------------------------------------------------------------------------------

interface OverlayState {
  /** Open layers, oldest first. Only the top one answers Escape and traps Tab, so a
   *  confirm dialog over an editor (or a menu inside a drawer) closes alone. */
  layerStack: object[];
  /** Dialog layers (Modal, Drawer, ConfirmDialog; not popovers or menus) mark <html> with
   *  data-nish-layer-open, so CSS elsewhere (the Toaster moving to the top of a phone) can
   *  react without React state. */
  dialogCount: number;
  /** Dialog scrims, oldest first. While any is open, everything else on <body> is inert so
   *  focus, clicks and screen readers stay in the top dialog. Toasts opt out with
   *  data-nish-keep-active. */
  dialogPortals: HTMLElement[];
  inerted: Set<HTMLElement>;
  /** Scroll lock, counted so stacked dialogs restore the page only when the last closes. */
  lockCount: number;
  savedOverflow: { html: string; body: string } | null;
  /** history.back() calls this module issued whose popstate has not landed yet. */
  pendingBacks: number;
  queuedPushes: Array<() => void>;
  layerSeq: number;
  /** Open dialogs that use closeOnBack: the popstate guard is installed while there are any
   *  (or a back is still pending). */
  backDialogs: number;
  guardOn: boolean;
  guard: (e: PopStateEvent) => void;
}

function createState(): OverlayState {
  const s: OverlayState = {
    layerStack: [],
    dialogCount: 0,
    dialogPortals: [],
    inerted: new Set<HTMLElement>(),
    lockCount: 0,
    savedOverflow: null,
    pendingBacks: 0,
    queuedPushes: [],
    layerSeq: 0,
    backDialogs: 0,
    guardOn: false,
    guard: () => {},
  };
  s.guard = (e) => {
    if (s.pendingBacks <= 0) return;
    s.pendingBacks--;
    e.stopImmediatePropagation();
    if (s.pendingBacks === 0) {
      for (const push of s.queuedPushes.splice(0)) push();
      removeGuardIfIdle(s);
    }
  };
  return s;
}

let cachedState: OverlayState | undefined;
function ov(): OverlayState {
  return (cachedState ??= shared('overlay', createState));
}

function removeGuardIfIdle(s: OverlayState): void {
  if (s.guardOn && s.backDialogs === 0 && s.pendingBacks === 0) {
    window.removeEventListener('popstate', s.guard, true);
    s.guardOn = false;
  }
}

/** Installs the popstate guard when the first closeOnBack dialog opens. Capture phase, so it
 *  runs before listeners (a router's) that were added earlier. */
function acquireGuard(): void {
  const s = ov();
  s.backDialogs++;
  if (!s.guardOn) {
    window.addEventListener('popstate', s.guard, true);
    s.guardOn = true;
  }
}

function releaseGuard(): void {
  const s = ov();
  s.backDialogs--;
  removeGuardIfIdle(s);
}

const isTop = (self: object) => {
  const stack = ov().layerStack;
  return stack[stack.length - 1] === self;
};

function syncLayerAttr() {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (ov().dialogCount > 0) html.setAttribute('data-nish-layer-open', '');
  else html.removeAttribute('data-nish-layer-open');
}

function syncInert() {
  if (typeof document === 'undefined') return;
  const { dialogPortals, inerted } = ov();
  // React removes the DOM before passive cleanups run, so a scrim may already be detached.
  for (let i = dialogPortals.length - 1; i >= 0; i--) if (!dialogPortals[i].isConnected) dialogPortals.splice(i, 1);
  const top = dialogPortals[dialogPortals.length - 1];
  if (!top) {
    inerted.forEach((el) => {
      el.inert = false;
      el.removeAttribute('inert');
    });
    inerted.clear();
    return;
  }
  for (const el of Array.from(document.body.children) as HTMLElement[]) {
    const skip = el === top || el.contains(top) || el.hasAttribute('data-nish-keep-active');
    if (skip) {
      if (inerted.has(el)) {
        el.inert = false;
        el.removeAttribute('inert');
        inerted.delete(el);
      }
    } else if (!el.inert) {
      el.inert = true;
      el.setAttribute('inert', '');
      inerted.add(el);
    }
  }
}

function pushInert(scrim: HTMLElement) {
  const { dialogPortals } = ov();
  if (!dialogPortals.includes(scrim)) dialogPortals.push(scrim);
  syncInert();
}

function popInert(scrim: HTMLElement) {
  const { dialogPortals } = ov();
  const i = dialogPortals.indexOf(scrim);
  if (i >= 0) dialogPortals.splice(i, 1);
  syncInert();
}

function isPhoneViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Close handlers that can refuse to close (ConfirmDialog while its action runs), so
// the exit animation is not played for a close that is then ignored.
const closeVetoes = /* @__PURE__ */ new WeakMap<() => void, () => boolean>();

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
}

// Scroll lock, counted so stacked dialogs restore the page only when the last closes.
// Both <html> and <body>: some apps scroll the root element, some the body.
function lockScroll(): () => void {
  const s = ov();
  if (s.lockCount++ === 0) {
    const html = document.documentElement;
    s.savedOverflow = {
      html: html.style.overflow,
      body: document.body.style.overflow,
    };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--s.lockCount === 0 && s.savedOverflow) {
      document.documentElement.style.overflow = s.savedOverflow.html;
      document.body.style.overflow = s.savedOverflow.body;
      s.savedOverflow = null;
    }
  };
}

/** Floating panels opened from inside a dialog portal into that dialog's layer, so
 *  they stack above it instead of under its scrim; otherwise into the configured
 *  container (the provider's portalContainer, default document.body). */
function layerHost(anchor: HTMLElement | null | undefined, container?: HTMLElement | null): HTMLElement {
  return anchor?.closest<HTMLElement>('[data-nish-layer]') ?? container ?? document.body;
}

// history.back() is asynchronous. A layer that closes while another opens in the same
// tick must not push its entry before that traversal lands, or the pending back would pop
// the new entry and close the new layer at once. So: count the backs this module issued,
// swallow their popstate events (the guard, a capture listener on window), and hold pushes
// until the count is back to zero.
function queueHistoryPush(push: () => void) {
  const s = ov();
  if (s.pendingBacks > 0) s.queuedPushes.push(push);
  else push();
}

/** Runs `cb` once every history.back() this module issued has landed: immediately when none
 *  is pending, otherwise after the last one (queued with the held pushes). */
export function whenHistorySettled(cb: () => void): void {
  queueHistoryPush(cb);
}

function cancelHistoryPush(push: () => void) {
  const q = ov().queuedPushes;
  const i = q.indexOf(push);
  if (i >= 0) q.splice(i, 1);
}

const warnedDev = /* @__PURE__ */ new Set<string>();

/** Dev-only console warning, once per message. Bundlers replace `process.env.NODE_ENV`;
 *  where nothing does, the ReferenceError is caught and nothing is printed. */
function warnDev(message: string): void {
  if (warnedDev.has(message)) return;
  try {
    if (process.env.NODE_ENV !== 'production') {
      warnedDev.add(message);
      console.warn(message);
    }
  } catch {
    // No process or no console.
  }
}

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

/** An internal ref object plus a callback ref that fills it and the `ref` prop a caller passed. */
function useMergedRef<T>(external: Ref<T> | undefined) {
  const internalRef = useRef<T | null>(null);
  const callbackRef = useCallback(
    (node: T | null) => {
      internalRef.current = node;
      setRef(external, node);
    },
    [external],
  );
  return [internalRef, callbackRef] as const;
}

/** True when the element's content is taller than the element (so a keyboard user needs to
 *  be able to focus it to scroll). Re-checked when it resizes or its content changes. */
function useScrollable(ref: RefObject<HTMLElement | null>): boolean {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    ro?.observe(el);
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(check);
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [ref]);
  return scrollable;
}

/** The internals every modal surface shares (Modal, Drawer, ConfirmDialog): stack
 *  membership, focus in, Tab trap, Escape, focus return and the html + body lock. */
function useDialog(panelRef: RefObject<HTMLElement | null>, onClose: () => void, closeOnBackProp = false) {
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

/** Keeps a sheet mounted while it plays its exit animation. The parent unmounts it (or
 *  sets `open` to false) in `onClose` / `onOpenChange`, so the exit runs between the close
 *  request and those calls. */
function useSheetExit(onClose: (() => void) | undefined, canClose?: () => boolean, onOpenChange?: (open: boolean) => void) {
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

/** Pointer-driven swipe down on a bottom sheet. Spread the result on the drag handle and
 *  the header. The sheet follows the finger (rubber-banded upward), then closes past 30%
 *  of its height or at 0.5 px/ms, and otherwise springs back over 180ms. */
function useSheetSwipe(
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

type SheetSwipe = ReturnType<typeof useSheetSwipe>;

/** The grab bar on top of a bottom sheet: drag it down to dismiss, or press Enter or
 *  Space when it has focus. */
function SheetHandle({ onClose, swipe, className }: { onClose: () => void; swipe: SheetSwipe; className?: string }) {
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

// ---------------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------------

export interface ModalProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children' | 'className'> {
  /** Heading of the dialog; also its accessible name. Optional only when `header`
   *  replaces the title row (then pass `aria-label`). */
  title?: ReactNode;
  /** Called on Escape, a backdrop click and the close button. Unmount the modal here
   *  (or set `open` to false). Optional when `onOpenChange` is used. */
  onClose?: () => void;
  /** Controlled open state. When given, the modal renders only while it is true and
   *  `onOpenChange(false)` asks you to close it. When omitted, a mounted Modal is open
   *  (the parent unmounts it in `onClose`). */
  open?: boolean;
  /** Called with false on Escape, a backdrop click and the close button, together with
   *  `onClose`. */
  onOpenChange?: (open: boolean) => void;
  /** The body. It scrolls when taller than the screen. */
  children: ReactNode;
  /** md: compact dialogs (default). lg / xl: wide content like guides and editors.
   *  2xl: very wide panels (comparison tables, up to 1152px). full: the whole screen
   *  less a 1rem margin. Every size is a bottom sheet under 640px. */
  size?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Buttons row pinned to the bottom of the panel. */
  footer?: ReactNode;
  /** A summary pinned under the title while the body scrolls (price, status, timestamps). */
  subtitle?: ReactNode;
  /** center (default), or top: pinned near the top of wide screens, for command
   *  palettes and search dialogs whose height changes as results arrive. */
  placement?: 'center' | 'top';
  /** Replaces the whole title row (title and close button), e.g. with a search
   *  field. Pass `aria-label` so the dialog keeps a name. */
  header?: ReactNode;
  /** Hides the close button. Escape and a backdrop click still close. */
  hideClose?: boolean;
  /** Accessible name when there is no visible `title` (required with `header`). */
  'aria-label'?: string;
  /** Phone sheet height (under 640px). auto: as tall as the content, up to 92% of the
   *  screen (default). tall: always 92%. full: the whole screen, square at the top. */
  sheetHeight?: 'auto' | 'tall' | 'full';
  /** Phone sheet: draw the grab handle and let a swipe down on it or the header close
   *  the sheet (default true). false: no handle, no swipe. */
  dismissible?: boolean;
  /** Android back and the browser back button close the dialog instead of leaving the
   *  page (default true). Pass false for a dialog that must not touch history. */
  closeOnBack?: boolean;
  /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
   *  dialog open with no exit animation, e.g. while a form holds invalid input; show
   *  the reason yourself. */
  canClose?: () => boolean;
  /** Classes for the dialog panel. */
  className?: string;
  /** The dialog panel (role="dialog"). */
  ref?: Ref<HTMLDivElement>;
}

/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll (on both <html> and <body>) while open. Renders through a Portal:
 *  nothing on the server. */
export function Modal({ open, ...props }: ModalProps) {
  if (open === false) return null;
  return (
    <Portal>
      <ModalPanel {...props} />
    </Portal>
  );
}

function ModalPanel({
  title,
  onClose,
  onOpenChange,
  children,
  size = 'md',
  footer,
  subtitle,
  placement = 'center',
  header,
  hideClose = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  sheetHeight = 'auto',
  dismissible = true,
  closeOnBack = true,
  canClose,
  className,
  role,
  ref,
  ...rest
}: Omit<ModalProps, 'open'>) {
  const strings = useNishStrings();
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef<HTMLDivElement>(ref);
  const scrimRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const swipe = useSheetSwipe(panelRef, scrimRef, () => dismissible && !isClosing() && isPhoneViewport(), closeNow, allowClose);
  const showTitle = header === undefined && title !== undefined && title !== null;
  const named = showTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === 'string' ? title : ariaLabel;

  useEffect(() => {
    if (!named) warnDev('nish-ui: <Modal> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.');
  }, [named]);

  return (
    <div
      ref={scrimRef}
      data-nish-layer=""
      data-state={closing ? 'closed' : 'open'}
      className={cn(
        'fixed inset-0 z-[var(--nish-z-modal,50)] flex items-end justify-center bg-th-scrim/60 sm:p-4',
        closing ? 'pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]' : 'animate-[nish-fade-in_160ms_ease-out]',
        placement === 'top' ? 'sm:items-start sm:pt-[12vh]' : 'sm:items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        {...rest}
        ref={setPanelRef}
        role={role ?? 'dialog'}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy ?? (showTitle && !ariaLabel ? titleId : undefined)}
        aria-label={ariaLabel}
        data-state={closing ? 'closed' : 'open'}
        tabIndex={-1}
        className={cn(
          'flex w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none',
          'rounded-t-2xl pb-[env(safe-area-inset-bottom)]',
          closing
            ? 'max-sm:animate-[nish-sheet-out_200ms_ease-in_forwards] sm:animate-[nish-fade-out_200ms_ease-in_forwards]'
            : 'animate-[nish-sheet-in_240ms_var(--nish-ease-out)] sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]',
          'sm:max-h-[85dvh] sm:rounded-2xl sm:pb-0',
          placement === 'top' && 'sm:max-h-[76dvh]',
          SHEET_HEIGHT_CLASS[sheetHeight],
          MODAL_SIZE[size],
          className,
        )}
      >
        {dismissible ? <SheetHandle onClose={requestClose} swipe={swipe} className="sm:hidden" /> : null}
        {header !== undefined ? (
          <div className={cn('shrink-0', dismissible && 'max-sm:touch-pan-x')} {...(dismissible ? swipe : {})}>
            {header}
          </div>
        ) : (
          <div
            className={cn('flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4', dismissible && 'max-sm:touch-pan-x')}
            {...(dismissible ? swipe : {})}
          >
            {/* Long titles (product names) wrap to two lines rather than lose their end. */}
            <h2 id={titleId} className="min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi">
              {title}
            </h2>
            {hideClose ? null : (
              <button type="button" onClick={requestClose} aria-label={strings.close} className={CLOSE_BUTTON}>
                <XIcon size={16} />
              </button>
            )}
          </div>
        )}
        {subtitle ? <div className="shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2">{subtitle}</div> : null}
        <div
          ref={bodyRef}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable && bodyLabel ? 'region' : undefined}
          aria-label={scrollable ? bodyLabel : undefined}
          className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2', header !== undefined && 'pt-3')}
        >
          {children}
        </div>
        {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------------

export interface DrawerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children' | 'className'> {
  /** Heading of the drawer; also its accessible name unless `aria-label` is set. Optional
   *  only when you pass `aria-label` or `aria-labelledby`. */
  title?: ReactNode;
  /** A line under the title (counts, status, timestamps). */
  subtitle?: ReactNode;
  /** Called on Escape, a scrim click and the close button. Unmount the drawer here (or set
   *  `open` to false). Optional when `onOpenChange` is used. */
  onClose?: () => void;
  /** Controlled open state. When given, the drawer renders only while it is true and
   *  `onOpenChange(false)` asks you to close it. When omitted, a mounted Drawer is open. */
  open?: boolean;
  /** Called with false on Escape, a scrim click and the close button, together with `onClose`. */
  onOpenChange?: (open: boolean) => void;
  /** right (default) and left: a full-height panel from that edge. bottom: a sheet
   *  from the bottom edge at every width. */
  side?: 'right' | 'left' | 'bottom';
  /** Side drawers: the panel width on wide screens (sm 384px, md 448px, lg 672px);
   *  full width under 640px. Bottom sheets: the height cap (sm 50%, md 70%, lg 92%
   *  of the screen). Default md. */
  size?: 'sm' | 'md' | 'lg';
  /** Extra header controls, left of the close button (IconButtons, a filter). */
  actions?: ReactNode;
  /** A row pinned to the bottom of the panel. */
  footer?: ReactNode;
  /** Bottom sheets: lifts the sheet above an app's bottom tab bar, e.g.
   *  'calc(4rem + env(safe-area-inset-bottom))'. */
  bottomOffset?: string;
  /** Bottom sheets: draw the grab handle and let a swipe down on it or the header close
   *  the sheet (default true). false: no handle, no swipe. */
  dismissible?: boolean;
  /** Android back and the browser back button close the drawer instead of leaving the
   *  page (default true). Pass false for a drawer that must not touch history. */
  closeOnBack?: boolean;
  /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
   *  drawer open with no exit animation; show the reason yourself. */
  canClose?: () => boolean;
  /** Accessible name, when the title alone does not say enough. */
  'aria-label'?: string;
  /** The body. It scrolls on its own; header and footer stay put. */
  children: ReactNode;
  /** Classes for the panel. */
  className?: string;
  /** The drawer panel (role="dialog"). */
  ref?: Ref<HTMLDivElement>;
}

/** A panel that slides in from an edge: notifications, an assistant, filters, a phone
 *  "More" sheet. It is a modal dialog: it traps Tab, closes on Escape and a scrim
 *  click, returns focus to the opener and locks page scroll. Renders through a Portal:
 *  nothing on the server. */
export function Drawer({ open, ...props }: DrawerProps) {
  if (open === false) return null;
  return (
    <Portal>
      <DrawerPanel {...props} />
    </Portal>
  );
}

function DrawerPanel({
  title,
  subtitle,
  onClose,
  onOpenChange,
  side = 'right',
  size = 'md',
  actions,
  footer,
  bottomOffset,
  dismissible = true,
  closeOnBack = true,
  canClose,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  className,
  ref,
  ...rest
}: Omit<DrawerProps, 'open'>) {
  const strings = useNishStrings();
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef<HTMLDivElement>(ref);
  const scrimRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const bottom = side === 'bottom';
  const swipe = useSheetSwipe(panelRef, scrimRef, () => bottom && dismissible && !isClosing(), closeNow, allowClose);
  const swipeHeader = bottom && dismissible;
  const hasTitle = title !== undefined && title !== null;
  const named = hasTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === 'string' ? title : ariaLabel;

  useEffect(() => {
    if (!named) warnDev('nish-ui: <Drawer> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.');
  }, [named]);

  return (
    <div
      ref={scrimRef}
      data-nish-layer=""
      data-state={closing ? 'closed' : 'open'}
      className={cn(
        'fixed inset-0 z-[var(--nish-z-modal,50)] bg-th-scrim/50',
        closing ? 'pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]' : 'animate-[nish-fade-in_160ms_ease-out]',
      )}
      style={bottom && bottomOffset ? { bottom: bottomOffset } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        {...rest}
        ref={setPanelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy ?? (ariaLabel || !hasTitle ? undefined : titleId)}
        aria-label={ariaLabel}
        data-state={closing ? 'closed' : 'open'}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col border-th-line bg-th-surface shadow-modal outline-none',
          bottom
            ? cn(
                'inset-x-0 bottom-0 rounded-t-2xl border-t',
                closing ? 'animate-[nish-sheet-out_200ms_ease-in_forwards]' : 'animate-[nish-sheet-in_240ms_var(--nish-ease-out)]',
                bottomOffset ? '' : 'pb-[env(safe-area-inset-bottom)]',
                DRAWER_SHEET_HEIGHT[size],
              )
            : cn(
                'inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                DRAWER_WIDTH[size],
                side === 'right'
                  ? cn(
                      'right-0 border-l pr-[env(safe-area-inset-right)]',
                      closing
                        ? 'translate-x-full transition-transform duration-200 ease-in'
                        : 'animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]',
                    )
                  : cn(
                      'left-0 border-r pl-[env(safe-area-inset-left)]',
                      closing
                        ? '-translate-x-full transition-transform duration-200 ease-in'
                        : 'animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]',
                    ),
              ),
          className,
        )}
      >
        {swipeHeader ? <SheetHandle onClose={requestClose} swipe={swipe} /> : bottom ? <div className="h-3 shrink-0" aria-hidden="true" /> : null}
        <div
          className={cn('flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3', swipeHeader && 'touch-pan-x')}
          {...(swipeHeader ? swipe : {})}
        >
          <div className="min-w-0 pt-1">
            {hasTitle ? (
              <h2 id={titleId} className="line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi">
                {title}
              </h2>
            ) : null}
            {subtitle ? <div className="mt-0.5 text-xs text-th-hi3">{subtitle}</div> : null}
          </div>
          <div className="-me-1.5 flex shrink-0 items-center gap-1">
            {actions}
            <IconButton label={strings.close} onClick={requestClose}>
              <XIcon size={16} />
            </IconButton>
          </div>
        </div>
        <div
          ref={bodyRef}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable && bodyLabel ? 'region' : undefined}
          aria-label={scrollable ? bodyLabel : undefined}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2"
        >
          {children}
        </div>
        {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------------

export interface ConfirmDialogProps {
  /** The question, e.g. "Delete this tracker?". Also the dialog's name. */
  title: ReactNode;
  /** What happens if they confirm. Keep it to a sentence or two. The dialog's description. */
  body?: ReactNode;
  /** The confirm button's label: a verb that names the action ("Delete", "Archive"). */
  confirmLabel: string;
  /** The cancel button's label. Default "Cancel" (or the provider's `cancel` string). */
  cancelLabel?: string;
  /** danger (default): a red confirm button, and focus starts on Cancel. primary: an
   *  accent confirm button that takes the first focus. */
  tone?: 'danger' | 'primary';
  /** The action is running: the confirm button shows a spinner, and Cancel, Escape and
   *  the backdrop are held off until it finishes. */
  pending?: boolean;
  /** Runs the action. Close the dialog (unmount it) when it is done. */
  onConfirm: () => void;
  /** Called on Cancel, Escape and a backdrop click. Unmount the dialog here (or set
   *  `open` to false). Optional when `onOpenChange` is used. */
  onCancel?: () => void;
  /** Controlled open state. When given, the dialog renders only while it is true. When
   *  omitted, a mounted ConfirmDialog is open. */
  open?: boolean;
  /** Called with false on Cancel, Escape and a backdrop click, together with `onCancel`. */
  onOpenChange?: (open: boolean) => void;
}

/** A yes-or-no question before an action, in place of `window.confirm`: a small
 *  Modal (role="alertdialog") with Cancel and a confirm button. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  pending = false,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const strings = useNishStrings();
  const bodyId = useId();
  const pendingRef = useLatest(pending);
  const onOpenChangeRef = useLatest(onOpenChange);
  const onCancelRef = useLatest(onCancel);
  // One stable handler: Modal looks it up in closeVetoes to refuse a close while pending.
  const cancel = useCallback(() => {
    if (pendingRef.current) return;
    onCancelRef.current?.();
    onOpenChangeRef.current?.(false);
  }, [onCancelRef, onOpenChangeRef, pendingRef]);
  useEffect(() => {
    closeVetoes.set(cancel, () => pendingRef.current);
    return () => {
      closeVetoes.delete(cancel);
    };
  }, [cancel, pendingRef]);
  const danger = tone === 'danger';
  const hasBody = body !== undefined && body !== null && body !== false;
  return (
    <Modal
      open={open}
      title={title}
      onClose={cancel}
      size="md"
      role="alertdialog"
      aria-describedby={hasBody ? bodyId : undefined}
      footer={
        <>
          <Button onClick={cancel} disabled={pending} data-autofocus={danger ? '' : undefined}>
            {cancelLabel ?? strings.cancel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={pending} onClick={onConfirm} data-autofocus={danger ? undefined : ''}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {hasBody ? <div id={bodyId}>{body}</div> : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------------
// Anchored positioning (Tooltip, Popover, DropdownMenu)
// ---------------------------------------------------------------------------------

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

interface AnchoredPosition {
  top: number;
  left: number;
  side: Side;
  /** Room left on the chosen side (px), for the panel's max-height. */
  maxHeight: number;
}

const GAP = 8;
const EDGE = 8;

const OPPOSITE: Record<Side, Side> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function viewport() {
  return {
    vw: window.innerWidth || document.documentElement.clientWidth || 0,
    vh: window.innerHeight || document.documentElement.clientHeight || 0,
  };
}

function clamp(v: number, size: number, limit: number): number {
  // When the panel is bigger than the room, pin it to the start edge.
  return Math.max(EDGE, Math.min(v, limit - size - EDGE));
}

/** Where a floating panel of size w × h goes next to rect r: on `side` if it fits,
 *  else on the opposite side when that has more room, then clamped into the viewport.
 *  In a right-to-left layout `start` and `end` swap for top and bottom panels. */
function place(r: DOMRect, w: number, h: number, side: Side, align: Align, gap: number, rtl = false): AnchoredPosition {
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

/** Positions `floating` next to `anchor` while `open`: measured before paint, flipped
 *  and clamped, and kept in place on scroll, resize and content changes. Returns null
 *  until the first measurement (render the panel hidden until then). */
function useAnchoredPosition(
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

function floatingStyle(pos: AnchoredPosition | null, extra?: CSSProperties): CSSProperties {
  return {
    position: 'fixed',
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    visibility: pos ? undefined : 'hidden',
    ...extra,
  };
}

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
  const config = useNishConfig();
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

// ---------------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------------

/** Escape (top layer only) and outside-press closing for non-modal floating panels. */
function useDismiss(
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

/** Puts focus back on the anchor when a panel closes while focus was inside it (or
 *  was lost to <body>). A press elsewhere that moved focus keeps it there. */
function useReturnFocus(open: boolean, panel: RefObject<HTMLElement | null>, anchor: RefObject<HTMLElement | null>) {
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

// ---------------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------------

interface MenuContextValue {
  close: () => void;
}

const MenuContext = /* @__PURE__ */ createContext<MenuContextValue | null>(null);

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

export interface DropdownMenuProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'onChange'> {
  /** The button that opens the menu (a Button or IconButton). It gets aria-haspopup,
   *  aria-expanded and aria-controls, opens on click, and on ArrowDown / ArrowUp. */
  trigger: ReactElement;
  /** Which edge of the trigger the menu lines up with (mirrored in right-to-left
   *  layouts). Default start. */
  align?: 'start' | 'center' | 'end';
  /** Preferred side; flips when there is no room. Default bottom. */
  side?: 'top' | 'bottom';
  /** MenuItem, MenuLabel, MenuSeparator and MenuSubHeader rows. */
  children: ReactNode;
  /** Controlled open state (optional; the menu manages it otherwise). */
  open?: boolean;
  /** Called whenever the menu opens or closes. When the menu closed itself, the second
   *  argument says why: 'escape', 'outside' or 'tab' (undefined after a selection or a
   *  trigger click). */
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  /** Opens on mount when uncontrolled (previews, tests). */
  defaultOpen?: boolean;
  /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
  'aria-label'?: string;
  /** `'sm'`: under 640px the menu opens as a bottom sheet with 48px rows instead of a
   *  floating panel. Default false (always a floating panel). */
  sheetBelow?: 'sm' | false;
  /** Title of the bottom sheet when `sheetBelow` is set. Default "Menu" (the provider's
   *  `menu` string). */
  sheetTitle?: string;
  /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
  className?: string;
  /** The menu panel (role="menu"). */
  ref?: Ref<HTMLDivElement>;
}

/** True while the viewport is under 640px (live). False on the server and during hydration. */
function usePhoneViewport(enabled: boolean): boolean {
  const phone = useMediaQuery(PHONE_QUERY);
  return enabled && phone;
}

/** Renders `element` with `props` merged over its own. A component rather than a
 *  cloneElement call in the parent's render, so the handlers passed in stay event
 *  handlers (react-hooks/refs treats a function handed to a call in render as run there). */
function Cloned({ element, ...props }: { element: ReactNode } & Record<string, unknown>) {
  return cloneElement(element as ReactElement<Record<string, unknown>>, props);
}

/** A menu of actions behind a button: role="menu" with arrow keys, Home and End,
 *  Escape, Tab to leave, and focus back on the trigger when it closes. */
export function DropdownMenu({
  trigger,
  align = 'start',
  side = 'bottom',
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  'aria-label': ariaLabel,
  sheetBelow = false,
  sheetTitle,
  className,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}: DropdownMenuProps) {
  const strings = useNishStrings();
  const config = useNishConfig();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  // The trigger node is a ref for the positioning and focus hooks (set before their layout
  // effects run) and state for render, which picks the portal host from it.
  const triggerRef = useRef<HTMLElement | null>(null);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const triggerPropRef = (trigger.props as { ref?: Ref<HTMLElement> }).ref;
  const attachTrigger = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      setTriggerNode(node);
      setRef(triggerPropRef, node);
    },
    [triggerPropRef],
  );
  // The menu renders once the trigger is known, so a menu open on mount portals straight
  // into the trigger's layer instead of moving there (and remounting) a render later.
  const shown = open && triggerNode != null;
  const [menuRef, setMenuRef] = useMergedRef<HTMLDivElement>(ref);
  const menuId = useId();
  const triggerId = useId();
  // Which item takes focus when the menu opens.
  const initial = useRef<'first' | 'last' | 'menu'>('first');
  const asSheet = usePhoneViewport(sheetBelow === 'sm');
  const pos = useAnchoredPosition(triggerRef, menuRef, shown && !asSheet, side, align, 4);

  const onOpenChangeRef = useLatest(onOpenChange);
  const setOpen = useCallback(
    (next: boolean, reason?: PopoverCloseReason) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [onOpenChangeRef, openProp],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const dismiss = useCallback((reason: PopoverCloseReason) => setOpen(false, reason), [setOpen]);
  // As a sheet, the Drawer owns Escape, the scrim and the back gesture.
  useDismiss(shown && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(shown, menuRef, triggerRef);

  // Focus in on open, and again whenever the focused row disappears (a submenu view
  // replaced the rows), so focus is never lost to <body>.
  useEffect(() => {
    if (!shown) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusInitial = () => {
      const items = menuItems(menu);
      const target = initial.current === 'last' ? items[items.length - 1] : initial.current === 'menu' ? menu : items[0];
      (target ?? menu).focus();
    };
    const t = window.setTimeout(focusInitial, 0);
    const mo = new MutationObserver(() => {
      if (!menu.contains(document.activeElement) && (document.activeElement === document.body || !document.activeElement)) {
        initial.current = 'first';
        focusInitial();
      }
    });
    mo.observe(menu, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [shown, asSheet, menuRef]);

  function openWith(where: 'first' | 'last' | 'menu') {
    initial.current = where;
    setOpen(true);
  }

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    userKeyDown?.(e);
    const items = menuItems(menuRef.current);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case 'ArrowDown':
        return go(i + 1);
      case 'ArrowUp':
        return go(i < 0 ? items.length - 1 : i - 1);
      case 'Home':
        return go(0);
      case 'End':
        return go(items.length - 1);
      case 'Tab':
        e.preventDefault();
        dismiss('tab');
        return;
      default:
        // Typeahead: the first key jumps to the next row starting with that letter.
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          const hit = order.find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(k));
          if (hit) {
            e.preventDefault();
            hit.focus();
          }
        }
    }
  }

  const tp = trigger.props as {
    ref?: Ref<HTMLElement>;
    id?: string;
    onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
    onKeyDown?: (e: ReactKeyboardEvent<HTMLElement>) => void;
  };
  const triggerEl = (
    <Cloned
      element={trigger}
      ref={attachTrigger}
      id={tp.id ?? triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={(e: ReactMouseEvent<HTMLElement>) => {
        tp.onClick?.(e);
        if (e.defaultPrevented) return;
        if (open) close();
        // A pointer click focuses the menu itself, so arrow keys start from the top.
        else openWith(e.detail === 0 ? 'first' : 'menu');
      }}
      onKeyDown={(e: ReactKeyboardEvent<HTMLElement>) => {
        tp.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openWith(e.key === 'ArrowDown' ? 'first' : 'last');
        }
      }}
    />
  );

  const menuProps = {
    ...rest,
    ref: setMenuRef,
    id: menuId,
    role: 'menu',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabel ? undefined : (tp.id ?? triggerId),
    'aria-orientation': 'vertical' as const,
    'data-state': 'open',
    tabIndex: -1,
    onKeyDown: onMenuKeyDown,
  };

  return (
    <>
      {triggerEl}
      {open && asSheet ? (
        <MenuContext.Provider value={{ close }}>
          <Drawer side="bottom" size="md" title={sheetTitle ?? strings.menu} onClose={close}>
            <div
              {...menuProps}
              style={style}
              className={cn(
                '-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm',
                className,
              )}
            >
              {children}
            </div>
          </Drawer>
        </MenuContext.Provider>
      ) : shown ? (
        createPortal(
          <MenuContext.Provider value={{ close }}>
            <div
              {...menuProps}
              data-side={pos?.side}
              style={floatingStyle(pos, {
                ...style,
                maxHeight: pos ? Math.min(pos.maxHeight, 384) : undefined,
                zIndex: 'var(--nish-z-dropdown, 40)',
              })}
              className={cn(
                'max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain',
                'rounded-lg border border-th-line bg-th-elevated py-1 shadow-pop outline-none animate-[nish-fade-in_120ms_ease-out]',
                className,
              )}
            >
              {children}
            </div>
          </MenuContext.Provider>,
          layerHost(triggerNode, config.portalContainer),
        )
      ) : null}
    </>
  );
}

export interface MenuItemProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onSelect' | 'children' | 'className' | 'type' | 'role'> {
  /** Leading icon (14px reads best). */
  icon?: ReactNode;
  /** Right-aligned extra: a shortcut (Kbd), a count or a chevron. */
  trailing?: ReactNode;
  /** A destructive action: loss-colored text and hover. */
  danger?: boolean;
  /** Marks the current choice (the selected sort, the open board) with the
   *  highlighted look. */
  active?: boolean;
  /** Shown but not selectable; arrow keys skip it. */
  disabled?: boolean;
  /** Runs on click, Enter and Space, then the menu closes. Call
   *  `event.preventDefault()` to keep it open (e.g. to switch to a submenu view). */
  onSelect?: (event: Event) => void;
  /** Classes for the row. */
  className?: string;
  children: ReactNode;
  /** The row's button. */
  ref?: Ref<HTMLButtonElement>;
}

/** One action in a DropdownMenu. */
export function MenuItem({
  icon,
  trailing,
  danger = false,
  active = false,
  disabled = false,
  onSelect,
  className,
  children,
  ref,
  onClick,
  onMouseMove,
  ...rest
}: MenuItemProps) {
  const ctx = useContext(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event('nish-menu-select', { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-current={active || undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) select();
      }}
      onMouseMove={(e) => {
        onMouseMove?.(e);
        // Hover moves the keyboard position too, as in native menus.
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      }}
      // In a menu, focus follows the pointer and the arrow keys, so plain :focus (not
      // only :focus-visible) shows the highlight.
      className={menuItemClass({
        active,
        danger,
        disabled,
        className: cn(!disabled && (danger ? 'focus:bg-th-loss-soft' : 'focus:bg-th-overlay focus:text-th-hi'), className),
      })}
    >
      {icon ? <span className={cn('inline-flex shrink-0', danger || disabled ? '' : 'text-th-hi3')}>{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className={cn('ms-auto inline-flex shrink-0 items-center', disabled ? '' : 'text-th-hi2')}>{trailing}</span> : null}
    </button>
  );
}

/** A small heading over a group of MenuItems. Not focusable. */
export function MenuLabel({
  children,
  className,
  ref,
  ...rest
}: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role'> & {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...rest}
      ref={ref}
      role="presentation"
      className={cn('px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2', className)}
    >
      {children}
    </div>
  );
}

/** A thin line between groups of MenuItems. */
export function MenuSeparator({
  className,
  ref,
  ...rest
}: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role' | 'children'> & {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return <div {...rest} ref={ref} role="separator" className={cn('my-1 h-px bg-th-line forced-colors:bg-[CanvasText]', className)} />;
}

export interface MenuSubHeaderProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'className' | 'type' | 'role'> {
  /** Goes back to the parent view (also on ArrowLeft, ArrowRight in right-to-left
   *  layouts). The menu stays open. */
  onBack: () => void;
  /** The submenu's title. */
  children: ReactNode;
  className?: string;
  /** The header's button. */
  ref?: Ref<HTMLButtonElement>;
}

/** The first row of a submenu view shown in place: a back arrow and the view's title. */
export function MenuSubHeader({ onBack, children, className, ref, onKeyDown, ...rest }: MenuSubHeaderProps) {
  const strings = useNishStrings();
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onBack}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === (isRtl(e.currentTarget) ? 'ArrowRight' : 'ArrowLeft')) {
          e.preventDefault();
          onBack();
        }
      }}
      className={cn(MENU_ROW, 'mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay', className)}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-th-hi3 rtl:-scale-x-100"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="sr-only">{strings.back}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
