'use client';
import { useCallback, useEffect, useRef, useState, type Ref, type RefObject } from 'react';
import { shared } from '../runtime';
import { PHONE_QUERY } from './overlay-classes';

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
/** @internal */
export function ov(): OverlayState {
  return (cachedState ??= shared('overlay', createState));
}

function removeGuardIfIdle(s: OverlayState): void {
  if (s.guardOn && s.backDialogs === 0 && s.pendingBacks === 0) {
    window.removeEventListener('popstate', s.guard, true);
    s.guardOn = false;
  }
}

/** @internal Installs the popstate guard when the first closeOnBack dialog opens. Capture phase, so it
 *  runs before listeners (a router's) that were added earlier. */
export function acquireGuard(): void {
  const s = ov();
  s.backDialogs++;
  if (!s.guardOn) {
    window.addEventListener('popstate', s.guard, true);
    s.guardOn = true;
  }
}

/** @internal */
export function releaseGuard(): void {
  const s = ov();
  s.backDialogs--;
  removeGuardIfIdle(s);
}

/** @internal */
export const isTop = (self: object) => {
  const stack = ov().layerStack;
  return stack[stack.length - 1] === self;
};

/** @internal */
export function syncLayerAttr() {
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

/** @internal */
export function pushInert(scrim: HTMLElement) {
  const { dialogPortals } = ov();
  if (!dialogPortals.includes(scrim)) dialogPortals.push(scrim);
  syncInert();
}

/** @internal */
export function popInert(scrim: HTMLElement) {
  const { dialogPortals } = ov();
  const i = dialogPortals.indexOf(scrim);
  if (i >= 0) dialogPortals.splice(i, 1);
  syncInert();
}

/** @internal */
export function isPhoneViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;
}

/** @internal */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Close handlers that can refuse to close (ConfirmDialog while its action runs), so
// the exit animation is not played for a close that is then ignored.
/** @internal */
export const closeVetoes = /* @__PURE__ */ new WeakMap<() => void, () => boolean>();

/** @internal */
export const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** @internal */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
}

// Scroll lock, counted so stacked dialogs restore the page only when the last closes.
// Both <html> and <body>: some apps scroll the root element, some the body.
/** @internal */
export function lockScroll(): () => void {
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

/** @internal Floating panels opened from inside a dialog portal into that dialog's layer, so
 *  they stack above it instead of under its scrim; otherwise into the configured
 *  container (the provider's portalContainer, default document.body). */
export function layerHost(anchor: HTMLElement | null | undefined, container?: HTMLElement | null): HTMLElement {
  return anchor?.closest<HTMLElement>('[data-nish-layer]') ?? container ?? document.body;
}

// history.back() is asynchronous. A layer that closes while another opens in the same
// tick must not push its entry before that traversal lands, or the pending back would pop
// the new entry and close the new layer at once. So: count the backs this module issued,
// swallow their popstate events (the guard, a capture listener on window), and hold pushes
// until the count is back to zero.
/** @internal */
export function queueHistoryPush(push: () => void) {
  const s = ov();
  if (s.pendingBacks > 0) s.queuedPushes.push(push);
  else push();
}

/** Runs `cb` once every history.back() this module issued has landed: immediately when none
 *  is pending, otherwise after the last one (queued with the held pushes). */
export function whenHistorySettled(cb: () => void): void {
  queueHistoryPush(cb);
}

/** @internal */
export function cancelHistoryPush(push: () => void) {
  const q = ov().queuedPushes;
  const i = q.indexOf(push);
  if (i >= 0) q.splice(i, 1);
}

const warnedDev = /* @__PURE__ */ new Set<string>();

/** @internal Dev-only console warning, once per message. Bundlers replace `process.env.NODE_ENV`;
 *  where nothing does, the ReferenceError is caught and nothing is printed. */
export function warnDev(message: string): void {
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

/** @internal */
export function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

/** @internal An internal ref object plus a callback ref that fills it and the `ref` prop a caller passed. */
export function useMergedRef<T>(external: Ref<T> | undefined) {
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

/** @internal True when the element's content is taller than the element (so a keyboard user needs to
 *  be able to focus it to scroll). Re-checked when it resizes or its content changes. */
export function useScrollable(ref: RefObject<HTMLElement | null>): boolean {
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
