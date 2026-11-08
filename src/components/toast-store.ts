'use client';
import { useSyncExternalStore } from 'react';
import { shared } from '../runtime';

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
   *  Default 4000; errors default to 'sticky'; Infinity means 'sticky'. Sticky toasts and
   *  errors are never pushed out by newer toasts. The timer pauses while the toast is
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

// A shared store rather than a context: toast() works from anywhere (event handlers, query
// callbacks, non-React modules) and needs no provider. Mount <Toaster /> once. The store lives
// in shared('toast'), so every entry and every copy of the package on a page uses one list.
const AUTO_DISMISS_MS = 4_000;
const MAX_VISIBLE = 4;

// Running dismissal timers, with what is left of each so hover and focus can pause them.
interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  started: number;
  paused: number;
}

interface ToastState {
  items: ToastItem[];
  nextId: number;
  subs: Set<() => void>;
  timers: Map<number, Timer>;
}

let cachedStore: ToastState | undefined;
function store(): ToastState {
  return (cachedStore ??= shared<ToastState>('toast', () => ({
    items: [],
    nextId: 1,
    subs: new Set(),
    timers: new Map(),
  })));
}

const emit = () => store().subs.forEach((fn) => fn());

function startTimer(id: number, ms: number): void {
  const t: Timer = {
    handle: null,
    remaining: ms,
    started: Date.now(),
    paused: 0,
  };
  t.handle = setTimeout(() => dismissToast(id), ms);
  store().timers.set(id, t);
}

function clearTimer(id: number): void {
  const { timers } = store();
  const t = timers.get(id);
  if (t?.handle != null) clearTimeout(t.handle);
  timers.delete(id);
}

// Hover and focus can overlap, so pauses are counted and the timer resumes at zero.
/** @internal */
export function pauseTimer(id: number): void {
  const t = store().timers.get(id);
  if (!t) return;
  t.paused += 1;
  if (t.paused > 1 || t.handle == null) return;
  clearTimeout(t.handle);
  t.handle = null;
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.started));
}

/** @internal */
export function resumeTimer(id: number): void {
  const t = store().timers.get(id);
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
  const s = store();
  const next = s.items.filter((t) => t.id !== id);
  if (next.length === s.items.length) return;
  s.items = next;
  emit();
}

// Errors and sticky toasts are never pushed out by newer ones: a failure you didn't see is one
// you'll assume succeeded.
const isKept = (t: ToastItem) => t.duration === 'sticky' || t.tone === 'error';

function push(tone: ToastTone, title: string, bodyOrOptions?: string | ToastOptions): number {
  const o: ToastOptions = typeof bodyOrOptions === 'string' ? { body: bodyOrOptions } : (bodyOrOptions ?? {});
  const s = store();
  const id = s.nextId++;
  // Errors stay until dismissed. Infinity means the same as 'sticky'.
  const asked = o.duration === Infinity ? 'sticky' : o.duration;
  const duration = asked ?? (tone === 'error' ? 'sticky' : AUTO_DISMISS_MS);
  const item: ToastItem = {
    id,
    tone,
    title,
    body: o.body,
    action: o.action,
    slot: o.id,
    duration,
  };

  const old = o.id ? s.items.find((t) => t.slot === o.id) : undefined;
  if (old) {
    clearTimer(old.id);
    s.items = s.items.map((t) => (t === old ? item : t));
  } else {
    // Past the limit, drop the oldest toasts that are neither sticky nor errors, and their
    // timers with them. When everything on screen is kept, the stack grows instead.
    let excess = s.items.length + 1 - MAX_VISIBLE;
    const kept: ToastItem[] = [];
    for (const t of s.items) {
      if (excess > 0 && !isKept(t)) {
        excess--;
        clearTimer(t.id);
      } else {
        kept.push(t);
      }
    }
    s.items = [...kept, item];
  }
  emit();
  if (duration !== 'sticky') startTimer(id, duration);
  return id;
}

type ToastCall = (title: string, bodyOrOptions?: string | ToastOptions) => number;

/** What toast.promise shows: a sticky toast while the promise is pending, replaced by a
 *  success or an error toast. Each message may be a function of the result or the error. */
export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

type ToastFn = ToastCall & {
  success: ToastCall;
  error: ToastCall;
  warn: ToastCall;
  info: ToastCall;
  /** Shows the loading message until the promise settles, then swaps it for the success or
   *  error message in the same slot. Returns the promise itself, so a rejection still reaches the caller. */
  promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>;
};

/** toast('Saved'), toast.error('Could not save', detail), or
 *  toast.success('Archived', { action: { label: 'Undo', onClick: undo }, id: 'undo' }).
 *  Each call returns the toast's id for dismissToast(). */
export const toast: ToastFn = /* @__PURE__ */ Object.assign((title: string, o?: string | ToastOptions) => push('info', title, o), {
  success: (title: string, o?: string | ToastOptions) => push('success', title, o),
  error: (title: string, o?: string | ToastOptions) => push('error', title, o),
  warn: (title: string, o?: string | ToastOptions) => push('warn', title, o),
  info: (title: string, o?: string | ToastOptions) => push('info', title, o),
  promise: <T,>(promise: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T> => {
    const slot = 'nish-promise-' + store().nextId;
    push('info', messages.loading, { duration: 'sticky', id: slot });
    promise.then(
      (value) => {
        push('success', typeof messages.success === 'function' ? messages.success(value) : messages.success, { id: slot });
      },
      (error: unknown) => {
        push('error', typeof messages.error === 'function' ? messages.error(error) : messages.error, { id: slot });
      },
    );
    return promise;
  },
});

/** Same API as a hook, for code that prefers one. */
export function useToast(): ToastFn {
  return toast;
}

/** @internal */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (fn) => {
      const { subs } = store();
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => store().items,
    () => store().items,
  );
}
