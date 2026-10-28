import { useRef, useSyncExternalStore, type CSSProperties, type FocusEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from './icons';

export type ToastTone = 'success' | 'error' | 'warn' | 'info';

/** A button inside a toast, such as Undo. */
export interface ToastAction {
  /** The button text: one or two words ("Undo", "View"). */
  label: string;
  /** Runs on click; the toast dismisses itself right after. */
  onClick: () => void;
}

export interface ToastOptions {
  /** Optional second line. */
  body?: string;
  /** One text button, e.g. { label: 'Undo', onClick: revert }. Clicking it runs
   *  onClick and then dismisses the toast. */
  action?: ToastAction;
  /** Milliseconds before it dismisses itself, or 'sticky' to stay until dismissed.
   *  Default 4000; errors default to 'sticky'. The timer pauses while the toast is
   *  hovered or holds focus. */
  duration?: number | 'sticky';
  /** A slot name. A new toast with the same id replaces the old one instead of
   *  stacking, so a stale Undo can never revert a newer change. */
  id?: string;
}

export interface ToastItem {
  /** Returned by toast(); pass it to dismissToast(). */
  id: number;
  tone: ToastTone;
  title: string;
  /** Optional second line. */
  body?: string;
  /** The toast's one text button, if any. */
  action?: ToastAction;
  /** The slot name from ToastOptions.id, if any. */
  slot?: string;
  /** How long it stays, as given or defaulted. */
  duration: number | 'sticky';
}

// A module-level store rather than a context: toast() works from anywhere (event
// handlers, query callbacks, non-React modules) and needs no provider. Mount
// <Toaster /> once.
let items: ToastItem[] = [];
let nextId = 1;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

const AUTO_DISMISS_MS = 4_000;
const MAX_VISIBLE = 4;

// Running dismissal timers, with what is left of each so hover and focus can pause them.
interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  started: number;
  paused: number;
}
const timers = new Map<number, Timer>();

function startTimer(id: number, ms: number): void {
  const t: Timer = { handle: null, remaining: ms, started: Date.now(), paused: 0 };
  t.handle = setTimeout(() => dismissToast(id), ms);
  timers.set(id, t);
}

function clearTimer(id: number): void {
  const t = timers.get(id);
  if (t?.handle != null) clearTimeout(t.handle);
  timers.delete(id);
}

// Hover and focus can overlap, so pauses are counted and the timer resumes at zero.
function pauseTimer(id: number): void {
  const t = timers.get(id);
  if (!t) return;
  t.paused += 1;
  if (t.paused > 1 || t.handle == null) return;
  clearTimeout(t.handle);
  t.handle = null;
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.started));
}

function resumeTimer(id: number): void {
  const t = timers.get(id);
  if (!t || t.paused === 0) return;
  t.paused -= 1;
  if (t.paused > 0) return;
  t.started = Date.now();
  // Give the reader a moment after they move away, even if the time had nearly run out.
  t.handle = setTimeout(() => dismissToast(id), Math.max(t.remaining, 1_000));
}

/** Remove a toast now, by the id toast() returned. */
export function dismissToast(id: number): void {
  clearTimer(id);
  const next = items.filter((t) => t.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}

function push(tone: ToastTone, title: string, bodyOrOptions?: string | ToastOptions): number {
  const o: ToastOptions = typeof bodyOrOptions === 'string' ? { body: bodyOrOptions } : (bodyOrOptions ?? {});
  const id = nextId++;
  // Errors stay until dismissed: a failure you didn't see is one you'll assume succeeded.
  const duration = o.duration ?? (tone === 'error' ? 'sticky' : AUTO_DISMISS_MS);
  const item: ToastItem = { id, tone, title, body: o.body, action: o.action, slot: o.id, duration };

  const old = o.id ? items.find((t) => t.slot === o.id) : undefined;
  if (old) {
    clearTimer(old.id);
    items = items.map((t) => (t === old ? item : t));
  } else {
    // Drop the oldest beyond the limit, and their timers with them.
    const kept = items.slice(-(MAX_VISIBLE - 1));
    items.filter((t) => !kept.includes(t)).forEach((t) => clearTimer(t.id));
    items = [...kept, item];
  }
  emit();
  if (duration !== 'sticky') startTimer(id, duration);
  return id;
}

type ToastCall = (title: string, bodyOrOptions?: string | ToastOptions) => number;
type ToastFn = ToastCall & {
  success: ToastCall;
  error: ToastCall;
  warn: ToastCall;
  info: ToastCall;
};

/** toast('Saved'), toast.error('Could not save', detail), or
 *  toast.success('Archived', { action: { label: 'Undo', onClick: undo }, id: 'undo' }). */
export const toast: ToastFn = Object.assign((title: string, o?: string | ToastOptions) => push('info', title, o), {
  success: (title: string, o?: string | ToastOptions) => push('success', title, o),
  error: (title: string, o?: string | ToastOptions) => push('error', title, o),
  warn: (title: string, o?: string | ToastOptions) => push('warn', title, o),
  info: (title: string, o?: string | ToastOptions) => push('info', title, o),
});

/** Same API as a hook, for code that prefers one. */
export function useToast(): ToastFn {
  return toast;
}

function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => items,
    () => items,
  );
}

const TONE: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: { icon: <CheckCircleIcon size={15} className="text-th-ok" />, className: 'border-th-ok/35' },
  error: { icon: <AlertTriangleIcon size={15} className="text-th-loss" />, className: 'border-th-loss/40' },
  warn: { icon: <AlertTriangleIcon size={15} className="text-th-warn" />, className: 'border-th-warn/40' },
  info: { icon: <InfoIcon size={15} className="text-th-accent" />, className: 'border-th-line-strong' },
};

export interface ToasterProps {
  /** Extra classes for the stack, e.g. to lift it above a bottom nav: sm:bottom-20. */
  className?: string;
  /** Distance from the bottom of the screen on phones (under 640px, or up to
   *  offsetUntil), e.g. 'calc(4.5rem + env(safe-area-inset-bottom))' to clear a bottom
   *  tab bar. Default: 8px above --nish-bottom-inset (published by BottomNav and
   *  StickyActionBar), or 12px above the safe area, whichever is larger. */
  offset?: string;
  /** The breakpoint where offset stops applying: sm 640px, md 768px (default, matching BottomNav's hideFrom) or lg
   *  1024px. Match it to where the app's bottom tab bar hides, so a toast never covers
   *  the bar. From sm the stack still moves to the bottom right; between sm and this
   *  breakpoint it keeps the offset. */
  offsetUntil?: 'sm' | 'md' | 'lg';
}

// Full literal class names, so Tailwind's scanner finds every one. From sm the stack sits
// 1.25rem above --nish-bottom-inset; while a StickyActionBar is open (it floats 1.5rem above
// the nav from sm) the min() term adds 1rem more, so the stack clears the pill by 0.75rem.
const DESKTOP_BOTTOM: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'sm:bottom-0 sm:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]',
  md: 'sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] md:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]',
  lg: 'sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] lg:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]',
};

/** The toast stack: bottom-center full width on phones, bottom-right on wider screens.
 *  It sits above any bottom bar through --nish-bottom-inset, and moves to the top of
 *  the screen on phones while a sheet or dialog is open (html[data-nish-layer-open]). */
export function Toaster({ className, offset, offsetUntil = 'md' }: ToasterProps) {
  const list = useToasts();
  if (typeof document === 'undefined') return null;
  const style = offset ? ({ '--nish-toast-offset': offset } as CSSProperties) : undefined;
  return createPortal(
    <div
      style={style}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3',
        'pb-[var(--nish-toast-offset,max(calc(var(--nish-bottom-inset,0px)+8px),calc(12px+env(safe-area-inset-bottom))))]',
        'max-sm:[html[data-nish-layer-open]_&]:bottom-auto max-sm:[html[data-nish-layer-open]_&]:top-[max(12px,env(safe-area-inset-top))] max-sm:[html[data-nish-layer-open]_&]:pb-0',
        'sm:inset-x-auto sm:right-5 sm:w-96 sm:items-stretch sm:px-0',
        DESKTOP_BOTTOM[offsetUntil],
        className,
      )}
    >
      {list.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>,
    document.body,
  );
}

const SWIPE_DISMISS_FRACTION = 0.35;
const SWIPE_DISMISS_VELOCITY = 0.5; // px per ms
const SWIPE_SLOP = 8; // px before a touch counts as a swipe rather than a tap

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  velocity: number;
  active: boolean;
}

function ToastCard({ t }: { t: ToastItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const setOffset = (dx: number, width: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = dx === 0 ? '' : `translateX(${dx}px)`;
    el.style.opacity = dx === 0 ? '' : String(Math.max(0, 1 - Math.abs(dx) / width));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: e.timeStamp, velocity: 0, active: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < SWIPE_SLOP || Math.abs(dx) < Math.abs(e.clientY - d.startY)) return;
      d.active = true;
      el.setPointerCapture(e.pointerId);
      pauseTimer(t.id);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    setOffset(dx, el.offsetWidth);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el || d.pointerId !== e.pointerId || !d.active) return;
    const dx = e.clientX - d.startX;
    const width = el.offsetWidth;
    const flung = Math.abs(d.velocity) > SWIPE_DISMISS_VELOCITY && Math.sign(d.velocity) === Math.sign(dx);
    if (Math.abs(dx) > width * SWIPE_DISMISS_FRACTION || flung) {
      dismissToast(t.id);
      return;
    }
    el.style.transition = 'transform 160ms var(--nish-ease-out), opacity 160ms var(--nish-ease-out)';
    setOffset(0, width);
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 180);
    resumeTimer(t.id);
  };
  const onCancel = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || d.pointerId !== e.pointerId) return;
    setOffset(0, ref.current?.offsetWidth || 1);
    resumeTimer(t.id);
  };

  const leave = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resumeTimer(t.id);
  };
  const enter = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pauseTimer(t.id);
  };
  return (
    <div
      ref={ref}
      role={t.tone === 'error' ? 'alert' : 'status'}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      // Mouse only: a tap fires enter with no leave, which would pin the toast forever.
      onPointerEnter={(e) => e.pointerType === 'mouse' && pauseTimer(t.id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && resumeTimer(t.id)}
      onFocus={enter}
      onBlur={leave}
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop',
        'touch-pan-y animate-[nish-rise-in_160ms_var(--nish-ease-out)]',
        'max-sm:[html[data-nish-layer-open]_&]:animate-[nish-toast-in-top_200ms_var(--nish-ease-out)]',
        TONE[t.tone].className,
      )}
    >
      <span className="mt-0.5 shrink-0">{TONE[t.tone].icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-th-hi">{t.title}</p>
        {t.body ? <p className="mt-0.5 break-words text-xs leading-snug text-th-hi2">{t.body}</p> : null}
      </div>
      {t.action ? (
        <button
          type="button"
          onClick={() => {
            t.action?.onClick();
            dismissToast(t.id);
          }}
          className="-my-1 inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-th-accent transition-colors hover:bg-th-accent-soft pointer-coarse:-my-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        >
          {t.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => dismissToast(t.id)}
        aria-label="Dismiss"
        className="-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
