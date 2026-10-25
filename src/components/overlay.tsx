import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { XIcon } from './icons';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** md: compact dialogs (default). lg / xl: wide content like guides and editors. */
  size?: 'md' | 'lg' | 'xl';
  /** Buttons row pinned to the bottom of the panel. */
  footer?: ReactNode;
  className?: string;
}

const SIZE = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' };

/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll while open. */
export function Modal({ title, onClose, children, size = 'md', footer, className }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('[autofocus]') ?? panel)?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 animate-[nish-fade-in_160ms_ease-out] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none',
          'rounded-t-2xl animate-[nish-sheet-in_240ms_var(--nish-ease-out)] pb-[env(safe-area-inset-bottom)]',
          'sm:max-h-[85vh] sm:rounded-2xl sm:pb-0 sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]',
          SIZE[size],
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4">
          <h2 id={titleId} className="min-w-0 truncate text-base font-semibold text-th-hi">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 shrink-0 rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:p-2.5"
          >
            <XIcon size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2">{children}</div>
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

interface TooltipProps {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
  /** Element used for the trigger. Pass `tr` inside tables, where a span would be
   *  invalid markup and get hoisted out of the table by the parser. */
  as?: 'span' | 'tr';
}

interface Coords {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const GAP = 8;
const MAX_WIDTH = 320;

/** Hover/focus tooltip rendered through a portal to <body>, so `overflow:hidden`
 *  ancestors (truncated labels, scrolling tables) can never clip it. Positioned
 *  from the trigger's viewport rect, flipped and clamped to stay on screen. */
export function Tooltip({ tip, children, className, side = 'top', as = 'span' }: TooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const id = useId();

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    // First pass on a rough room estimate; the layout effect re-judges with the
    // tooltip's measured height.
    const roomAbove = r.top;
    const roomBelow = vh - r.bottom;
    const placement: 'top' | 'bottom' =
      side === 'top'
        ? roomAbove < 90 && roomBelow > roomAbove
          ? 'bottom'
          : 'top'
        : roomBelow < 90 && roomAbove > roomBelow
          ? 'top'
          : 'bottom';

    // Keep the center-anchored tooltip inside the viewport. When the viewport is
    // narrower than the tooltip, min/max would invert, so fall back to dead center.
    const half = MAX_WIDTH / 2;
    const center = r.left + r.width / 2;
    const left =
      vw > MAX_WIDTH + 2 * GAP ? Math.min(Math.max(center, half + GAP), vw - half - GAP) : vw > 0 ? vw / 2 : center;

    setCoords({ top: placement === 'top' ? r.top - GAP : r.bottom + GAP, left, placement });
  }, [side]);

  const hide = useCallback(() => setCoords(null), []);

  // Second pass: flip if the chosen side cannot hold the measured tooltip, clamp
  // when neither can. The equality guard ends the loop.
  useLayoutEffect(() => {
    if (!coords) return;
    const tipEl = tipRef.current;
    const el = triggerRef.current;
    if (!tipEl || !el) return;
    const h = tipEl.getBoundingClientRect().height;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const need = h + 2 * GAP;

    let placement = coords.placement;
    if (placement === 'top' && r.top < need && vh - r.bottom > r.top) placement = 'bottom';
    else if (placement === 'bottom' && vh - r.bottom < need && r.top > vh - r.bottom) placement = 'top';

    let top = placement === 'top' ? r.top - GAP : r.bottom + GAP;
    // translate(-100%) makes `top` the tooltip's bottom edge when above.
    if (placement === 'top') top = Math.max(top, Math.min(h + GAP, vh - GAP));
    else top = Math.min(top, Math.max(vh - GAP - h, GAP));

    if (top !== coords.top || placement !== coords.placement) setCoords({ ...coords, top, placement });
  }, [coords]);

  // Native listeners: React's synthetic onMouseEnter never fires for a `tr` trigger.
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focus', show);
      el.removeEventListener('blur', hide);
    };
  }, [show, hide]);

  const a11y = { tabIndex: 0, 'aria-describedby': coords ? id : undefined };

  return (
    <>
      {as === 'tr' ? (
        <tr ref={triggerRef as Ref<HTMLTableRowElement>} className={className} {...a11y}>
          {children}
        </tr>
      ) : (
        <span ref={triggerRef as Ref<HTMLSpanElement>} className={cn('inline-flex items-center', className)} {...a11y}>
          {children}
        </span>
      )}
      {coords
        ? createPortal(
            <span
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                maxWidth: Math.min(MAX_WIDTH, (window.innerWidth || MAX_WIDTH) - 2 * GAP),
                transform: `translate(-50%, ${coords.placement === 'top' ? '-100%' : '0'})`,
              }}
              className="pointer-events-none z-[100] block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop"
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
