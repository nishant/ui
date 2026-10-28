import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
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
import { XIcon } from './icons';
import { Button, IconButton } from './primitives';

// ---------------------------------------------------------------------------------
// Shared layer plumbing: one stack for everything that answers Escape (dialogs,
// drawers, popovers, menus), one scroll lock for <html> and <body>, one focus trap.
// ---------------------------------------------------------------------------------

// Open layers, oldest first. Only the top one answers Escape and traps Tab, so a
// confirm dialog over an editor (or a menu inside a drawer) closes alone.
const layerStack: object[] = [];
const isTop = (self: object) => layerStack[layerStack.length - 1] === self;

// Dialog layers (Modal, Drawer, ConfirmDialog; not popovers or menus) mark <html> with
// data-nish-layer-open, so CSS elsewhere (the Toaster moving to the top of a phone) can
// react without React state.
let dialogCount = 0;

function syncLayerAttr() {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (dialogCount > 0) html.setAttribute('data-nish-layer-open', '');
  else html.removeAttribute('data-nish-layer-open');
}

const SHEET_EXIT_MS = 200;
const PHONE_QUERY = '(max-width: 639px)';

function isPhoneViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Close handlers that can refuse to close (ConfirmDialog while its action runs), so
// the exit animation is not played for a close that is then ignored.
const closeVetoes = new WeakMap<() => void, () => boolean>();

let layerSeq = 0;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
}

// Scroll lock, counted so stacked dialogs restore the page only when the last closes.
// Both <html> and <body>: some apps scroll the root element, some the body.
let lockCount = 0;
let savedOverflow: { html: string; body: string } | null = null;

function lockScroll(): () => void {
  if (lockCount++ === 0) {
    const html = document.documentElement;
    savedOverflow = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0 && savedOverflow) {
      document.documentElement.style.overflow = savedOverflow.html;
      document.body.style.overflow = savedOverflow.body;
      savedOverflow = null;
    }
  };
}

/** Floating panels opened from inside a dialog portal into that dialog's layer, so
 *  they stack above it instead of under its scrim. */
function layerHost(anchor: HTMLElement | null | undefined): HTMLElement {
  return anchor?.closest<HTMLElement>('[data-nish-layer]') ?? document.body;
}

// history.back() is asynchronous. A layer that closes while another opens in the same
// tick must not push its entry before that traversal lands, or the pending back would pop
// the new entry and close the new layer at once. So: count the backs this module issued,
// swallow their popstate events (the first listener on window), and hold pushes until the
// count is back to zero.
let pendingBacks = 0;
const queuedPushes: Array<() => void> = [];

function queueHistoryPush(push: () => void) {
  if (pendingBacks > 0) queuedPushes.push(push);
  else push();
}

function cancelHistoryPush(push: () => void) {
  const i = queuedPushes.indexOf(push);
  if (i >= 0) queuedPushes.splice(i, 1);
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    if (pendingBacks <= 0) return;
    pendingBacks--;
    e.stopImmediatePropagation();
    if (pendingBacks === 0) {
      for (const push of queuedPushes.splice(0)) push();
    }
  });
}

/** The internals every modal surface shares (Modal, Drawer, ConfirmDialog): stack
 *  membership, focus in, Tab trap, Escape, focus return and the html + body lock. */
function useDialog(panelRef: RefObject<HTMLElement | null>, onClose: () => void, closeOnBackProp = false) {
  // Inside an iframe (the docs previews) pushState would add to the top-level history.
  const closeOnBack = closeOnBackProp && (typeof window === 'undefined' || window.self === window.top);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const self = {};
    layerStack.push(self);
    dialogCount++;
    syncLayerAttr();

    // Android back / browser back closes the top layer: the layer owns one history
    // entry. The push is deferred a tick so a Strict Mode mount-unmount-mount does not
    // push and pop an entry.
    const layerId = `nish-layer-${++layerSeq}`;
    let pushed = false;
    let rePushTimer = 0;
    const pushEntry = () => {
      const prev = history.state && typeof history.state === 'object' ? (history.state as object) : {};
      history.pushState({ ...prev, nishLayer: layerId }, '');
      pushed = true;
    };
    // pushState waits until every history.back() this module issued has landed.
    const queuedPush = () => queueHistoryPush(pushEntry);
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
      layerStack.splice(layerStack.indexOf(self), 1);
      dialogCount--;
      syncLayerAttr();
      document.removeEventListener('keydown', onKey);
      unlock();
      opener?.focus?.();
      // Closed by anything but back: drop the entry this layer pushed.
      if (pushed && (history.state as { nishLayer?: string } | null)?.nishLayer === layerId) {
        pendingBacks++;
        history.back();
      }
    };
  }, [panelRef, closeOnBack]);
}

/** Keeps a sheet mounted while it plays its exit animation. Modal and Drawer have no
 *  `open` prop (the parent unmounts them in `onClose`), so the exit runs between the
 *  close request and the `onClose` call. */
function useSheetExit(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timer = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  /** Plays the exit animation, then calls `onClose`. */
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    if (closeVetoes.get(onCloseRef.current)?.()) return;
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      onCloseRef.current();
      // Still mounted (the parent kept it): show it again.
      closingRef.current = false;
      setClosing(false);
    }, SHEET_EXIT_MS);
  }, []);
  /** Calls `onClose` at once, for a swipe that already animated the sheet away. */
  const closeNow = useCallback(() => {
    onCloseRef.current();
  }, []);
  const isClosing = useCallback(() => closingRef.current, []);
  return { closing, requestClose, closeNow, isClosing };
}

/** Pointer-driven swipe down on a bottom sheet. Spread the result on the drag handle and
 *  the header. The sheet follows the finger (rubber-banded upward), then closes past 30%
 *  of its height or at 0.5 px/ms, and otherwise springs back over 180ms. */
function useSheetSwipe(
  panelRef: RefObject<HTMLElement | null>,
  scrimRef: RefObject<HTMLElement | null>,
  enabled: () => boolean,
  onDismiss: () => void,
) {
  const drag = useRef<{ startY: number; dy: number; lastY: number; lastT: number; v: number } | null>(null);
  const timer = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
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
      drag.current = { startY: e.clientY, dy: 0, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    },
    [panelRef, scrimRef],
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
      const dismiss = !cancelled && (d.dy > panel.offsetHeight * 0.3 || velocity > 0.5);
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
    [panelRef, scrimRef],
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
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close"
      {...swipe}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      className={cn(
        'flex h-5 min-h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-none focus-visible:bg-th-overlay',
        className,
      )}
    >
      <span className="h-1 w-10 rounded-full bg-th-line-strong" aria-hidden="true" />
    </div>
  );
}

const CLOSE_BUTTON =
  '-mr-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:min-w-11';

// ---------------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------------

export interface ModalProps {
  /** Heading of the dialog; also its accessible name. Optional only when `header`
   *  replaces the title row (then pass `aria-label`). */
  title?: ReactNode;
  /** Called on Escape, a backdrop click and the close button. Unmount the modal here. */
  onClose: () => void;
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
  className?: string;
}

const SHEET_HEIGHT_CLASS = {
  auto: 'max-h-[92dvh]',
  tall: 'max-h-[92dvh] max-sm:h-[92dvh]',
  full: 'max-h-dvh max-sm:h-dvh max-sm:rounded-t-none max-sm:pt-[env(safe-area-inset-top)]',
};

const SIZE = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-3xl',
  '2xl': 'sm:max-w-6xl',
  full: 'sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]',
};

/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll (on both <html> and <body>) while open. */
export function Modal({
  title,
  onClose,
  children,
  size = 'md',
  footer,
  subtitle,
  placement = 'center',
  header,
  hideClose = false,
  'aria-label': ariaLabel,
  sheetHeight = 'auto',
  dismissible = true,
  closeOnBack = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const { closing, requestClose, closeNow, isClosing } = useSheetExit(onClose);
  useDialog(panelRef, requestClose, closeOnBack);
  const swipe = useSheetSwipe(panelRef, scrimRef, () => dismissible && !isClosing() && isPhoneViewport(), closeNow);
  const showTitle = header === undefined && title !== undefined && title !== null;

  return createPortal(
    <div
      ref={scrimRef}
      data-nish-layer=""
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 sm:p-4',
        closing ? 'pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]' : 'animate-[nish-fade-in_160ms_ease-out]',
        placement === 'top' ? 'sm:items-start sm:pt-[12vh]' : 'sm:items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={showTitle && !ariaLabel ? titleId : undefined}
        aria-label={ariaLabel}
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
          SIZE[size],
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
              <button type="button" onClick={requestClose} aria-label="Close" className={CLOSE_BUTTON}>
                <XIcon size={16} />
              </button>
            )}
          </div>
        )}
        {subtitle ? <div className="shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2">{subtitle}</div> : null}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2',
            header !== undefined && 'pt-3',
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------------

export interface DrawerProps {
  /** Heading of the drawer; also its accessible name unless `aria-label` is set. */
  title: ReactNode;
  /** A line under the title (counts, status, timestamps). */
  subtitle?: ReactNode;
  /** Called on Escape, a scrim click and the close button. Unmount the drawer here. */
  onClose: () => void;
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
  /** Accessible name, when the title alone does not say enough. */
  'aria-label'?: string;
  /** The body. It scrolls on its own; header and footer stay put. */
  children: ReactNode;
  /** Classes for the panel. */
  className?: string;
}

const DRAWER_WIDTH = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' };
const SHEET_HEIGHT = { sm: 'max-h-[50dvh]', md: 'max-h-[70dvh]', lg: 'max-h-[92dvh]' };

/** A panel that slides in from an edge: notifications, an assistant, filters, a phone
 *  "More" sheet. It is a modal dialog: it traps Tab, closes on Escape and a scrim
 *  click, returns focus to the opener and locks page scroll. */
export function Drawer({
  title,
  subtitle,
  onClose,
  side = 'right',
  size = 'md',
  actions,
  footer,
  bottomOffset,
  dismissible = true,
  closeOnBack = true,
  'aria-label': ariaLabel,
  children,
  className,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const { closing, requestClose, closeNow, isClosing } = useSheetExit(onClose);
  useDialog(panelRef, requestClose, closeOnBack);
  const bottom = side === 'bottom';
  const swipe = useSheetSwipe(panelRef, scrimRef, () => bottom && dismissible && !isClosing(), closeNow);
  const swipeHeader = bottom && dismissible;

  return createPortal(
    <div
      ref={scrimRef}
      data-nish-layer=""
      className={cn(
        'fixed inset-0 z-50 bg-th-scrim/50',
        closing ? 'pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]' : 'animate-[nish-fade-in_160ms_ease-out]',
      )}
      style={bottom && bottomOffset ? { bottom: bottomOffset } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col border-th-line bg-th-surface shadow-modal outline-none',
          bottom
            ? cn(
                'inset-x-0 bottom-0 rounded-t-2xl border-t',
                closing
                  ? 'animate-[nish-sheet-out_200ms_ease-in_forwards]'
                  : 'animate-[nish-sheet-in_240ms_var(--nish-ease-out)]',
                bottomOffset ? '' : 'pb-[env(safe-area-inset-bottom)]',
                SHEET_HEIGHT[size],
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
        {swipeHeader ? (
          <SheetHandle onClose={requestClose} swipe={swipe} />
        ) : bottom ? (
          <div className="h-3 shrink-0" aria-hidden="true" />
        ) : null}
        <div
          className={cn('flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3', swipeHeader && 'touch-pan-x')}
          {...(swipeHeader ? swipe : {})}
        >
          <div className="min-w-0 pt-1">
            <h2 id={titleId} className="line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi">
              {title}
            </h2>
            {subtitle ? <div className="mt-0.5 text-xs text-th-hi3">{subtitle}</div> : null}
          </div>
          <div className="-mr-1.5 flex shrink-0 items-center gap-1">
            {actions}
            <IconButton label="Close" onClick={requestClose}>
              <XIcon size={16} />
            </IconButton>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------------

export interface ConfirmDialogProps {
  /** The question, e.g. "Delete this tracker?". Also the dialog's name. */
  title: ReactNode;
  /** What happens if they confirm. Keep it to a sentence or two. */
  body?: ReactNode;
  /** The confirm button's label: a verb that names the action ("Delete", "Archive"). */
  confirmLabel: string;
  /** The cancel button's label. Default "Cancel". */
  cancelLabel?: string;
  /** danger (default): a red confirm button, and focus starts on Cancel. primary: an
   *  accent confirm button that takes the first focus. */
  tone?: 'danger' | 'primary';
  /** The action is running: the confirm button shows a spinner, and Cancel, Escape and
   *  the backdrop are held off until it finishes. */
  pending?: boolean;
  /** Runs the action. Close the dialog (unmount it) when it is done. */
  onConfirm: () => void;
  /** Called on Cancel, Escape and a backdrop click. Unmount the dialog here. */
  onCancel: () => void;
}

/** A yes-or-no question before an action, in place of `window.confirm`: a small
 *  Modal with Cancel and a confirm button. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const cancel = useCallback(() => {
    if (!pendingRef.current) onCancel();
  }, [onCancel]);
  closeVetoes.set(cancel, () => pendingRef.current);
  const danger = tone === 'danger';
  return (
    <Modal
      title={title}
      onClose={cancel}
      size="md"
      footer={
        <>
          <Button onClick={cancel} disabled={pending} data-autofocus={danger ? '' : undefined}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={pending}
            onClick={onConfirm}
            data-autofocus={danger ? undefined : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body ?? null}
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

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

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
 *  else on the opposite side when that has more room, then clamped into the viewport. */
function place(r: DOMRect, w: number, h: number, side: Side, align: Align, gap: number): AnchoredPosition {
  const { vw, vh } = viewport();
  const room: Record<Side, number> = { top: r.top, bottom: vh - r.bottom, left: r.left, right: vw - r.right };
  const need = side === 'top' || side === 'bottom' ? h + gap + EDGE : w + gap + EDGE;
  const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;

  if (chosen === 'top' || chosen === 'bottom') {
    const top = chosen === 'top' ? r.top - gap - h : r.bottom + gap;
    const left = align === 'start' ? r.left : align === 'end' ? r.right - w : r.left + r.width / 2 - w / 2;
    return {
      side: chosen,
      top: clamp(top, h, vh),
      left: clamp(left, w, vw),
      maxHeight: Math.max(0, room[chosen] - gap - EDGE),
    };
  }
  const left = chosen === 'left' ? r.left - gap - w : r.right + gap;
  const top = align === 'start' ? r.top : align === 'end' ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return { side: chosen, top: clamp(top, h, vh), left: clamp(left, w, vw), maxHeight: Math.max(0, vh - 2 * EDGE) };
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

  useLayoutEffect(() => {
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
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, gap);
      setPos((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight
          ? prev
          : next,
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

export interface TooltipProps {
  /** What the tooltip says. Keep it to a sentence or two. */
  tip: ReactNode;
  /** The trigger. It becomes focusable (unless `focusable` is false), so keyboard
   *  users can read the tip. */
  children: ReactNode;
  className?: string;
  /** Preferred side; flips to the opposite one when there is no room. `right` suits
   *  a collapsed sidebar. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Element used for the trigger. Pass `tr` inside tables, where a span would be
   *  invalid markup and get hoisted out of the table by the parser. */
  as?: 'span' | 'tr';
  /** Adds the trigger to the Tab order (default true). Set false for dense marks such
   *  as 60 chart bars, and make the value reachable another way. */
  focusable?: boolean;
  /** default: the trigger keeps its own look. hint: a dotted underline and a help
   *  cursor, for a term whose meaning the tip explains. */
  variant?: 'default' | 'hint';
}

const TIP_MAX_WIDTH = 320;

/** True when focus on `el` came from the keyboard (`:focus-visible`), false when a
 *  pointer put it there. A focus event on an element that is not actually focused
 *  (a synthetic event in a test) counts as keyboard. Internal to the package. */
export function keyboardFocused(el: Element): boolean {
  if (typeof document !== 'undefined' && document.activeElement !== el) return true;
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** Phones fire mouseenter after a tap, which would pin a hover tip open with no
 *  mouseleave ever coming. Feed pointerenter/pointerdown to `onPointer`; `recent()`
 *  says whether the last pointer was a finger. Internal to the package. */
export function touchTracker(): { onPointer: (e: { pointerType: string }) => void; recent: () => boolean } {
  let touch = false;
  return {
    onPointer: (e) => {
      touch = e.pointerType === 'touch';
    },
    recent: () => touch,
  };
}

/** Hover/focus tooltip rendered through a portal to <body>, so `overflow:hidden`
 *  ancestors (truncated labels, scrolling tables) can never clip it. Positioned
 *  from the trigger's viewport rect, flipped and clamped to stay on screen. */
export function Tooltip({ tip, children, className, side = 'top', as = 'span', focusable = true, variant = 'default' }: TooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();

  // Native listeners: React's synthetic onMouseEnter never fires for a `tr` trigger.
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const touch = touchTracker();
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    el.addEventListener('pointerenter', touch.onPointer);
    el.addEventListener('pointerdown', touch.onPointer);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', hide);
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('pointerenter', touch.onPointer);
      el.removeEventListener('pointerdown', touch.onPointer);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', hide);
      el.removeEventListener('keydown', onKey);
    };
  }, []);

  const a11y = { tabIndex: focusable ? 0 : undefined, 'aria-describedby': open ? id : undefined };
  const hint = variant === 'hint' && 'cursor-help underline decoration-th-hi3 decoration-dotted underline-offset-2';

  return (
    <>
      {as === 'tr' ? (
        <tr ref={triggerRef as Ref<HTMLTableRowElement>} className={cn(hint, className)} {...a11y}>
          {children}
        </tr>
      ) : (
        <span
          ref={triggerRef as Ref<HTMLSpanElement>}
          // inline-flex would stop the hint underline reaching the text, so hints stay inline.
          className={cn(hint ? 'inline' : 'inline-flex items-center', hint, className)}
          {...a11y}
        >
          {children}
        </span>
      )}
      {open ? <FloatingTip anchor={triggerRef} id={id} tip={tip} side={side} /> : null}
    </>
  );
}

/** The tooltip bubble on its own, for components that are their own trigger (a
 *  Segmented option): portaled to <body>, placed next to `anchor` while mounted.
 *  Internal to the package; mount it only while the tip shows, keyed by the anchor. */
export function FloatingTip({
  anchor,
  id,
  tip,
  side = 'top',
}: {
  anchor: RefObject<HTMLElement | null>;
  id: string;
  tip: ReactNode;
  side?: Side;
}) {
  const tipRef = useRef<HTMLSpanElement>(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, 'center');
  return createPortal(
    <span
      ref={tipRef}
      id={id}
      role="tooltip"
      data-side={pos?.side}
      style={floatingStyle(pos, {
        maxWidth: Math.min(TIP_MAX_WIDTH, (window.innerWidth || TIP_MAX_WIDTH) - 2 * EDGE),
        zIndex: 'var(--nish-z-tooltip, 100)',
      })}
      className="pointer-events-none block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop"
    >
      {tip}
    </span>,
    document.body,
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
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
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
      layerStack.splice(layerStack.indexOf(self), 1);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, panel, anchor]);
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
  useLayoutEffect(() => {
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

export interface PopoverProps {
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
  /** Which edge of the anchor the panel lines up with. Default start. */
  align?: 'start' | 'center' | 'end';
  /** Panel width: a number of pixels or any CSS length. Default: fits the content. */
  width?: number | string;
  /** Accessible name of the panel (it has role="dialog"). */
  'aria-label'?: string;
  /** Classes for the panel (e.g. `p-0`, or `app-region-no-drag` in Electron apps). */
  className?: string;
  children: ReactNode;
}

/** A non-modal floating panel anchored to an element: filters, a color picker, a
 *  details card. Portaled (so no parent clips it), flipped and clamped to the screen.
 *  Escape and a press outside close it; focus returns to the anchor. */
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
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const outsideRef = useRef(dismissOnOutside);
  outsideRef.current = dismissOnOutside;
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
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
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
      ref={panelRef}
      role="dialog"
      aria-label={ariaLabel}
      tabIndex={-1}
      data-side={pos?.side}
      onKeyDown={onKeyDown}
      style={floatingStyle(pos, { width, maxHeight: pos?.maxHeight, zIndex: 'var(--nish-z-dropdown, 40)' })}
      className={cn(
        'max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none',
        'animate-[nish-fade-in_120ms_ease-out]',
        className,
      )}
    >
      {children}
    </div>,
    layerHost(anchor.current),
  );
}

// ---------------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------------

interface MenuContextValue {
  close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T }).current = value;
}

export interface DropdownMenuProps {
  /** The button that opens the menu (a Button or IconButton). It gets aria-haspopup,
   *  aria-expanded and aria-controls, opens on click, and on ArrowDown / ArrowUp. */
  trigger: ReactElement;
  /** Which edge of the trigger the menu lines up with. Default start. */
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
  /** Title of the bottom sheet when `sheetBelow` is set. Default "Menu". */
  sheetTitle?: string;
  /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
  className?: string;
}

/** True while the viewport is under 640px (live). */
function usePhoneViewport(enabled: boolean): boolean {
  const [phone, setPhone] = useState(() => enabled && isPhoneViewport());
  useEffect(() => {
    if (!enabled || typeof window.matchMedia !== 'function') {
      setPhone(false);
      return;
    }
    const mq = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [enabled]);
  return phone;
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
}: DropdownMenuProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();
  // Which item takes focus when the menu opens.
  const initial = useRef<'first' | 'last' | 'menu'>('first');
  const asSheet = usePhoneViewport(sheetBelow === 'sm');
  const pos = useAnchoredPosition(triggerRef, menuRef, open && !asSheet, side, align, 4);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const setOpen = useCallback(
    (next: boolean, reason?: PopoverCloseReason) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [openProp],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const dismiss = useCallback((reason: PopoverCloseReason) => setOpen(false, reason), [setOpen]);
  // As a sheet, the Drawer owns Escape, the scrim and the back gesture.
  useDismiss(open && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(open, menuRef, triggerRef);

  // Focus in on open, and again whenever the focused row disappears (a submenu view
  // replaced the rows), so focus is never lost to <body>.
  useEffect(() => {
    if (!open) return;
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
  }, [open, asSheet]);

  function openWith(where: 'first' | 'last' | 'menu') {
    initial.current = where;
    setOpen(true);
  }

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
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
  const triggerEl = cloneElement(trigger as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      setRef(tp.ref, node);
    },
    id: tp.id ?? triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: (e: ReactMouseEvent<HTMLElement>) => {
      tp.onClick?.(e);
      if (e.defaultPrevented) return;
      if (open) close();
      // A pointer click focuses the menu itself, so arrow keys start from the top.
      else openWith(e.detail === 0 ? 'first' : 'menu');
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => {
      tp.onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openWith(e.key === 'ArrowDown' ? 'first' : 'last');
      }
    },
  });

  const menuProps = {
    ref: menuRef,
    id: menuId,
    role: 'menu',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabel ? undefined : (tp.id ?? triggerId),
    'aria-orientation': 'vertical' as const,
    tabIndex: -1,
    onKeyDown: onMenuKeyDown,
  };

  return (
    <>
      {triggerEl}
      {open && asSheet ? (
        <MenuContext.Provider value={{ close }}>
          <Drawer side="bottom" size="md" title={sheetTitle ?? 'Menu'} onClose={close}>
            <div
              {...menuProps}
              className={cn(
                '-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm',
                className,
              )}
            >
              {children}
            </div>
          </Drawer>
        </MenuContext.Provider>
      ) : open ? (
        createPortal(
          <MenuContext.Provider value={{ close }}>
            <div
              {...menuProps}
              data-side={pos?.side}
              style={floatingStyle(pos, {
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
          layerHost(triggerRef.current),
        )
      ) : null}
    </>
  );
}

const ROW =
  'flex w-full select-none items-center gap-2 px-3 py-1.5 text-left text-xs outline-none transition-colors pointer-coarse:min-h-11 pointer-coarse:gap-3 pointer-coarse:text-sm';

export interface MenuItemClassOptions {
  /** The current choice: the highlighted look (set aria-current on the row too). */
  active?: boolean;
  /** A destructive action: loss-colored text and hover. */
  danger?: boolean;
  /** The disabled look (set disabled or aria-disabled on the row too). */
  disabled?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<MenuItem>` renders, for menu-looking rows that are not in a
 *  DropdownMenu: tabbable buttons in a Popover panel that also holds IconButtons,
 *  inputs or color pickers. The rows keep their own roles (plain buttons, Tab order);
 *  hover and keyboard focus get the same highlight as MenuItem. */
export function menuItemClass({ active = false, danger = false, disabled = false, className }: MenuItemClassOptions = {}): string {
  return cn(
    ROW,
    disabled
      ? 'cursor-default text-th-ghost'
      : danger
        ? 'text-th-loss hover:bg-th-loss-soft focus-visible:bg-th-loss-soft'
        : 'text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus-visible:bg-th-overlay focus-visible:text-th-hi',
    active && !disabled && !danger && 'bg-th-overlay font-medium text-th-hi',
    className,
  );
}

export interface MenuItemProps {
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
}

/** One action in a DropdownMenu. */
export function MenuItem({ icon, trailing, danger = false, active = false, disabled = false, onSelect, className, children }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event('nish-menu-select', { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-current={active || undefined}
      onClick={select}
      onMouseMove={(e) => {
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
      {trailing ? <span className={cn('ml-auto inline-flex shrink-0 items-center', disabled ? '' : 'text-th-hi2')}>{trailing}</span> : null}
    </button>
  );
}

/** A small heading over a group of MenuItems. Not focusable. */
export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="presentation" className={cn('px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2', className)}>
      {children}
    </div>
  );
}

/** A thin line between groups of MenuItems. */
export function MenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-th-line', className)} />;
}

export interface MenuSubHeaderProps {
  /** Goes back to the parent view (also on ArrowLeft). The menu stays open. */
  onBack: () => void;
  /** The submenu's title. */
  children: ReactNode;
  className?: string;
}

/** The first row of a submenu view shown in place: a back arrow and the view's title. */
export function MenuSubHeader({ onBack, children, className }: MenuSubHeaderProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onBack}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onBack();
        }
      }}
      className={cn(
        ROW,
        'mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay',
        className,
      )}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-th-hi3">
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="sr-only">Back: </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

