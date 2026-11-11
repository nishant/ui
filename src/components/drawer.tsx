'use client';
import { useEffect, useId, useRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { XIcon } from './icons';
import { IconButton } from './primitives';
import { Portal } from './portal';
import { useStrings } from './provider';
import { OVERLAY_STRINGS } from './strings';
import { DRAWER_SHEET_HEIGHT, DRAWER_WIDTH } from './overlay-classes';
import { warnDev, useMergedRef, useScrollable, ov, isTop } from './overlay-core';
import { useDialog, useSheetExit, useSheetSwipe, SheetHandle } from './overlay-dialog';

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
  const strings = useStrings(OVERLAY_STRINGS);
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
  const bodyLabelledBy = bodyLabel ? undefined : hasTitle ? titleId : ariaLabelledBy;
  const bodyNamed = !!bodyLabel || !!bodyLabelledBy;
  // A press that lands while a menu or popover is on top only dismisses that layer. The layer's own
  // pointerdown listener closes it before the scrim's mousedown fires, so capture "covered" first.
  const covered = useRef(false);
  useEffect(() => {
    const stack = ov().layerStack;
    const self = stack[stack.length - 1];
    const down = () => {
      covered.current = !!self && !isTop(self);
    };
    document.addEventListener('pointerdown', down, true);
    return () => document.removeEventListener('pointerdown', down, true);
  }, []);

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
        if (e.target === e.currentTarget && !covered.current) requestClose();
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
          tabIndex={scrollable && bodyNamed ? 0 : undefined}
          role={scrollable && bodyNamed ? 'region' : undefined}
          aria-label={scrollable ? bodyLabel : undefined}
          aria-labelledby={scrollable ? bodyLabelledBy : undefined}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2"
        >
          {children}
        </div>
        {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

