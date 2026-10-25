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

/** The internals every modal surface shares (Modal, Drawer, ConfirmDialog): stack
 *  membership, focus in, Tab trap, Escape, focus return and the html + body lock. */
function useDialog(panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const self = {};
    layerStack.push(self);
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
      layerStack.splice(layerStack.indexOf(self), 1);
      document.removeEventListener('keydown', onKey);
      unlock();
      opener?.focus?.();
    };
  }, [panelRef]);
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
  className?: string;
}

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
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(panelRef, onClose);
  const showTitle = header === undefined && title !== undefined && title !== null;

  return createPortal(
    <div
      data-nish-layer=""
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 animate-[nish-fade-in_160ms_ease-out] sm:p-4',
        placement === 'top' ? 'sm:items-start sm:pt-[12vh]' : 'sm:items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          'flex max-h-[92dvh] w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none',
          'rounded-t-2xl animate-[nish-sheet-in_240ms_var(--nish-ease-out)] pb-[env(safe-area-inset-bottom)]',
          'sm:max-h-[85vh] sm:rounded-2xl sm:pb-0 sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]',
          placement === 'top' && 'sm:max-h-[76vh]',
          SIZE[size],
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong sm:hidden" aria-hidden="true" />
        {header !== undefined ? (
          <div className="shrink-0">{header}</div>
        ) : (
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4">
            {/* Long titles (product names) wrap to two lines rather than lose their end. */}
            <h2 id={titleId} className="min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi">
              {title}
            </h2>
            {hideClose ? null : (
              <button type="button" onClick={onClose} aria-label="Close" className={CLOSE_BUTTON}>
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
  'aria-label': ariaLabel,
  children,
  className,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(panelRef, onClose);
  const bottom = side === 'bottom';

  return createPortal(
    <div
      data-nish-layer=""
      className="fixed inset-0 z-50 bg-th-scrim/50 animate-[nish-fade-in_160ms_ease-out]"
      style={bottom && bottomOffset ? { bottom: bottomOffset } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
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
                'inset-x-0 bottom-0 rounded-t-2xl border-t animate-[nish-sheet-in_240ms_var(--nish-ease-out)]',
                bottomOffset ? '' : 'pb-[env(safe-area-inset-bottom)]',
                SHEET_HEIGHT[size],
              )
            : cn(
                'inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                DRAWER_WIDTH[size],
                side === 'right'
                  ? 'right-0 border-l pr-[env(safe-area-inset-right)] animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]'
                  : 'left-0 border-r pl-[env(safe-area-inset-left)] animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]',
              ),
          className,
        )}
      >
        {bottom ? <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong" aria-hidden="true" /> : null}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3">
          <div className="min-w-0 pt-1">
            <h2 id={titleId} className="line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi">
              {title}
            </h2>
            {subtitle ? <div className="mt-0.5 text-xs text-th-hi3">{subtitle}</div> : null}
          </div>
          <div className="-mr-1.5 flex shrink-0 items-center gap-1">
            {actions}
            <IconButton label="Close" onClick={onClose}>
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
    return { side: chosen, top: clamp(top, h, vh), left: clamp(left, w, vw) };
  }
  const left = chosen === 'left' ? r.left - gap - w : r.right + gap;
  const top = align === 'start' ? r.top : align === 'end' ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return { side: chosen, top: clamp(top, h, vh), left: clamp(left, w, vw) };
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
      const next = place(a.getBoundingClientRect(), f.offsetWidth, f.offsetHeight, side, align, gap);
      setPos((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.side === next.side ? prev : next,
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

/** Hover/focus tooltip rendered through a portal to <body>, so `overflow:hidden`
 *  ancestors (truncated labels, scrolling tables) can never clip it. Positioned
 *  from the trigger's viewport rect, flipped and clamped to stay on screen. */
export function Tooltip({ tip, children, className, side = 'top', as = 'span', focusable = true, variant = 'default' }: TooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const pos = useAnchoredPosition(triggerRef, tipRef, open, side, 'center');
  const id = useId();

  // Native listeners: React's synthetic onMouseEnter never fires for a `tr` trigger.
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    // focusin/focusout, so a focusable child (a button inside the trigger) shows it too.
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focusin', show);
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
      {open
        ? createPortal(
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
          )
        : null}
    </>
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

export interface PopoverProps {
  /** Whether the panel shows. The popover is controlled: pair it with `onOpenChange`. */
  open: boolean;
  /** Called with false on Escape, a press outside, and Tab out of the panel. */
  onOpenChange: (open: boolean) => void;
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
  useDismiss(open, panelRef, anchor, () => onOpenChangeRef.current(false));
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
      onOpenChangeRef.current(false);
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
      style={floatingStyle(pos, { width, zIndex: 'var(--nish-z-dropdown, 40)' })}
      className={cn(
        'max-w-[calc(100vw-1rem)] rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none',
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
  /** Called whenever the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Opens on mount when uncontrolled (previews, tests). */
  defaultOpen?: boolean;
  /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
  'aria-label'?: string;
  /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
  className?: string;
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
  const pos = useAnchoredPosition(triggerRef, menuRef, open, side, align, 4);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChangeRef.current?.(next);
    },
    [openProp],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(open, menuRef, triggerRef, close);
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
  }, [open]);

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
        close();
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

  return (
    <>
      {triggerEl}
      {open
        ? createPortal(
            <MenuContext.Provider value={{ close }}>
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabel ? undefined : (tp.id ?? triggerId)}
                aria-orientation="vertical"
                tabIndex={-1}
                data-side={pos?.side}
                onKeyDown={onMenuKeyDown}
                style={floatingStyle(pos, { zIndex: 'var(--nish-z-dropdown, 40)' })}
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
        : null}
    </>
  );
}

const ROW =
  'flex w-full select-none items-center gap-2 px-3 py-1.5 text-left text-xs outline-none transition-colors pointer-coarse:min-h-11';

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
      className={cn(
        ROW,
        disabled
          ? 'cursor-default text-th-ghost'
          : danger
            ? 'text-th-loss hover:bg-th-loss-soft focus:bg-th-loss-soft'
            : 'text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus:bg-th-overlay focus:text-th-hi',
        active && !disabled && !danger && 'bg-th-overlay font-medium text-th-hi',
        className,
      )}
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

