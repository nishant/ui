'use client';
import { useCallback, useEffect, useId, useRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { XIcon } from './icons';
import { Button } from './primitives';
import { useLatest } from './latest';
import { Portal } from './portal';
import { useStrings } from './provider';
import { OVERLAY_STRINGS } from './strings';
import { CLOSE_BUTTON, MODAL_SIZE, SHEET_HEIGHT_CLASS } from './overlay-classes';
import { isPhoneViewport, closeVetoes, warnDev, useMergedRef, useScrollable } from './overlay-core';
import { useDialog, useSheetExit, useSheetSwipe, SheetHandle } from './overlay-dialog';

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
  const strings = useStrings(OVERLAY_STRINGS);
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
  const strings = useStrings(OVERLAY_STRINGS);
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

