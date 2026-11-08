'use client';
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from 'react';
import { cn } from '../cn';
import { XIcon } from './icons';
import { lazyModule, preloadWhenIdle, useLazyModule } from './lazy-module';
import { Portal } from './portal';
import { useStrings } from './provider';
import { DISPLAY_STRINGS } from './strings';
import { dismissToast, useToasts, type ToastItem } from './toast-store';

export { toast, useToast, dismissToast } from './toast-store';
export type { ToastTone, ToastAction, ToastOptions, ToastItem, ToastPromiseMessages } from './toast-store';

const cardModule = /* @__PURE__ */ lazyModule(() => import('./toast-card'));

export interface ToasterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'> {
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
  /** The stack's root element. */
  ref?: Ref<HTMLDivElement>;
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
export function Toaster({ className, offset, offsetUntil = 'md', style: userStyle, ref, ...rest }: ToasterProps) {
  const list = useToasts();
  const [failed, setFailed] = useState(false);
  useEffect(() => preloadWhenIdle(cardModule), []);
  const card = useLazyModule(cardModule, list.length > 0 && !failed, () => setFailed(true));
  const Card = card?.ToastCard;
  const [polite, setPolite] = useState({ text: '', seq: 0 });
  const [assertive, setAssertive] = useState({ text: '', seq: 0 });
  const announced = useRef(new Set<number>());
  type Kind = 'polite' | 'assertive';
  const timers = useRef<{
    queue: Record<Kind, string[]>;
    flush: {
      polite?: ReturnType<typeof setTimeout>;
      assertive?: ReturnType<typeof setTimeout>;
    };
    clear: {
      polite?: ReturnType<typeof setTimeout>;
      assertive?: ReturnType<typeof setTimeout>;
    };
  }>({
    queue: { polite: [], assertive: [] },
    flush: {},
    clear: {},
  });

  // Visible cards carry no live role; these two always-mounted regions announce each new
  // toast once (a region that mounts with its text is often skipped by screen readers).
  useEffect(() => {
    const t = timers.current;
    for (const item of list) {
      if (announced.current.has(item.id)) continue;
      announced.current.add(item.id);
      const text = item.body ? `${item.title}. ${item.body}` : item.title;
      t.queue[item.tone === 'error' ? 'assertive' : 'polite'].push(text);
    }
    // Toasts that arrive within the same 100ms window, in one commit or several, share one
    // pending buffer per kind and are joined into a single write. Every write bumps seq so
    // the keyed node is replaced and repeats of the same text are announced again.
    for (const kind of ['polite', 'assertive'] as const) {
      if (t.queue[kind].length === 0 || t.flush[kind] !== undefined) continue;
      const write = kind === 'assertive' ? setAssertive : setPolite;
      t.flush[kind] = setTimeout(() => {
        t.flush[kind] = undefined;
        const text = t.queue[kind].join('. ');
        t.queue[kind] = [];
        write((p) => ({ text, seq: p.seq + 1 }));
        clearTimeout(t.clear[kind]);
        t.clear[kind] = setTimeout(() => write((p) => ({ text: '', seq: p.seq + 1 })), 5_000);
      }, 100);
    }
    const live = new Set(list.map((i) => i.id));
    announced.current.forEach((id) => {
      if (!live.has(id)) announced.current.delete(id);
    });
  }, [list]);
  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.flush.polite);
      clearTimeout(t.flush.assertive);
      t.flush = {};
      t.queue = { polite: [], assertive: [] };
      clearTimeout(t.clear.polite);
      clearTimeout(t.clear.assertive);
    };
  }, []);

  const style = offset ? ({ ...userStyle, '--nish-toast-offset': offset } as CSSProperties) : userStyle;
  // Portal renders nothing on the server and in the first client render, so hydration matches.
  return (
    <Portal>
      <div
        {...rest}
        ref={ref}
        style={style}
        data-nish-keep-active=""
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-[var(--nish-z-toast,60)] flex flex-col items-center gap-2 px-3',
          'pb-[var(--nish-toast-offset,max(calc(var(--nish-bottom-inset,0px)+8px),calc(12px+env(safe-area-inset-bottom))))]',
          'max-sm:[html[data-nish-layer-open]_&]:bottom-auto max-sm:[html[data-nish-layer-open]_&]:top-[max(12px,env(safe-area-inset-top))] max-sm:[html[data-nish-layer-open]_&]:pb-0',
          'sm:inset-x-auto sm:end-5 sm:w-96 sm:items-stretch sm:px-0',
          DESKTOP_BOTTOM[offsetUntil],
          className,
        )}
      >
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          <span key={polite.seq}>{polite.text}</span>
        </div>
        <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
          <span key={assertive.seq}>{assertive.text}</span>
        </div>
        {list.map((t) => (
          Card ? <Card key={t.id} t={t} /> : <ToastFallback key={t.id} t={t} />
        ))}
      </div>
    </Portal>
  );
}

// Shown while the card chunk loads, and for the page's life if it cannot load. The live regions
// announce every toast, so this only has to show the text and keep the action reachable.
function ToastFallback({ t }: { t: ToastItem }) {
  const strings = useStrings(DISPLAY_STRINGS);
  return (
    <div
      data-nish-toast-fallback=""
      className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border border-th-line-strong bg-th-elevated px-3.5 py-3 shadow-pop"
    >
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
        aria-label={strings.dismiss}
        className="-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
