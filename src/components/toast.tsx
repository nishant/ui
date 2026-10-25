import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from './icons';

export type ToastTone = 'success' | 'error' | 'warn' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
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

export function dismissToast(id: number): void {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(tone: ToastTone, title: string, body?: string): number {
  const id = nextId++;
  items = [...items.slice(-(MAX_VISIBLE - 1)), { id, tone, title, body }];
  emit();
  // Errors stay until dismissed: a failure you didn't see is one you'll assume succeeded.
  if (tone !== 'error') setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  return id;
}

type ToastFn = ((title: string, body?: string) => number) & {
  success: (title: string, body?: string) => number;
  error: (title: string, body?: string) => number;
  warn: (title: string, body?: string) => number;
  info: (title: string, body?: string) => number;
};

/** toast('Saved') or toast.error('Could not save', detail). */
export const toast: ToastFn = Object.assign((title: string, body?: string) => push('info', title, body), {
  success: (title: string, body?: string) => push('success', title, body),
  error: (title: string, body?: string) => push('error', title, body),
  warn: (title: string, body?: string) => push('warn', title, body),
  info: (title: string, body?: string) => push('info', title, body),
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

/** The toast stack: bottom-center full width on phones, bottom-right on wider screens. */
export function Toaster({ className }: { className?: string }) {
  const list = useToasts();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))]',
        'sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 sm:items-stretch sm:px-0 sm:pb-0',
        className,
      )}
    >
      {list.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop',
            'animate-[nish-rise-in_160ms_var(--nish-ease-out)]',
            TONE[t.tone].className,
          )}
        >
          <span className="mt-0.5 shrink-0">{TONE[t.tone].icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-th-hi">{t.title}</p>
            {t.body ? <p className="mt-0.5 break-words text-xs leading-snug text-th-hi2">{t.body}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="-m-1 shrink-0 rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:p-2"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
