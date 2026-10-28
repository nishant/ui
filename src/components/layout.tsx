import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import { Callout } from './display';
import { useHeightVar, useStuck } from './layout-vars';
import { Button } from './primitives';

// Page-level layout pieces: sticky bars, the bottom action bar, the top loading bar, the
// page container and the connection banner. They read and write the layout contract
// variables on <html> (see layout-vars.ts and base.css).

// =====================================================================================
// StickyBar
// =====================================================================================

export interface StickyBarProps {
  /** The bar's content: a filter row, a toolbar, a SectionNav. */
  children?: ReactNode;
  /** CSS `top` offset. Defaults to just under the app header (`var(--nish-header-h, 0px)`). */
  top?: string;
  /** Adds a bottom border and a soft shadow once the bar is stuck. Default true. */
  elevate?: boolean;
  /** The element to render. Default `div`. */
  as?: ElementType;
  className?: string;
}

/**
 * A bar that sticks under the app header while the page scrolls. Opaque, and its
 * background reaches the screen edges (it bleeds through the page gutter). Publishes its
 * height as `--nish-sticky-extra` while mounted, so anchor links scroll clear of it.
 */
export function StickyBar({ children, top = 'var(--nish-header-h, 0px)', elevate = true, as = 'div', className }: StickyBarProps) {
  const ref = useRef<HTMLElement | null>(null);
  const stuck = useStuck(ref);
  useHeightVar(ref, '--nish-sticky-extra');
  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref}
      style={{ top } satisfies CSSProperties}
      className={cn(
        'sticky z-20 -mx-[var(--nish-page-gutter)] border-b bg-th-bg px-[var(--nish-page-gutter)]',
        elevate && stuck ? 'border-th-line shadow-card' : 'border-transparent',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// =====================================================================================
// StickyActionBar
// =====================================================================================

export interface StickyActionBarProps {
  /** Shows the bar. Closed, it renders nothing and publishes no height. */
  open: boolean;
  /** Short text on the left, e.g. "3 changes". Truncates to one line. */
  message?: ReactNode;
  /** The main action, usually a primary Button. */
  primary: ReactNode;
  /** A second action, usually a ghost or secondary Button (Discard, Cancel). */
  secondary?: ReactNode;
  /** Accessible name of the region. Default "Actions". */
  label?: string;
  className?: string;
}

/**
 * A bar fixed to the bottom of the screen for the actions of an unsaved form or a
 * selection. Sits above a BottomNav when there is one, and publishes `--nish-bottom-bar-h`
 * while open so page padding and toasts clear it. From sm it floats as a pill at the
 * bottom right.
 */
export function StickyActionBar({ open, message, primary, secondary, label = 'Actions', className }: StickyActionBarProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useHeightVar(ref, '--nish-bottom-bar-h', open);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className={cn(
        'fixed inset-x-0 bottom-[var(--nish-bottom-nav-h,0px)] z-30 flex items-center gap-3 border-t border-th-line bg-th-elevated px-4 pt-3 shadow-[var(--nish-shadow-pop)]',
        // The nav already covers the home-indicator inset; only pad for what it leaves.
        'pb-[max(0.75rem,calc(env(safe-area-inset-bottom)_-_var(--nish-bottom-nav-h,0px)))]',
        'animate-[nish-bar-in_220ms_var(--nish-ease-out)] motion-reduce:animate-none',
        'sm:inset-x-auto sm:right-6 sm:bottom-[calc(var(--nish-bottom-nav-h,0px)_+_1.5rem)] sm:rounded-[var(--nish-radius-lg)] sm:border sm:pb-3',
        className,
      )}
    >
      {message ? <div className="min-w-0 flex-1 truncate text-sm text-th-hi2">{message}</div> : <div className="flex-1" />}
      <div className="flex shrink-0 items-center gap-2">
        {secondary}
        {primary}
      </div>
    </div>
  );
}

// =====================================================================================
// LoadingBar
// =====================================================================================

export interface LoadingBarProps {
  /** True while something loads (a route change, a refetch). */
  active: boolean;
  /** Waits this long before showing, so quick loads never flash a bar. Default 200. */
  delayMs?: number;
  /** CSS `top`. Defaults to just under the app header. */
  top?: string;
  className?: string;
}

/**
 * A thin indeterminate progress bar fixed under the app header. Appears only after
 * `delayMs` of being active. With reduced motion it is a static partial bar.
 */
export function LoadingBar({ active, delayMs = 200, top = 'var(--nish-header-h, 0px)', className }: LoadingBarProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  if (!active || !shown) return null;
  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
      style={{ top } satisfies CSSProperties}
      className={cn('pointer-events-none fixed inset-x-0 z-40 h-0.5 overflow-hidden', className)}
    >
      <div className="h-full w-2/5 bg-th-accent animate-[nish-loading-bar_1.2s_linear_infinite] motion-reduce:animate-none" />
    </div>
  );
}

// =====================================================================================
// PageContainer
// =====================================================================================

const CONTAINER_SIZE = {
  narrow: 'max-w-2xl',
  default: 'max-w-4xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
} as const;

export interface PageContainerProps {
  /** Max width: narrow 42rem, default 56rem, wide 80rem, full none. */
  size?: keyof typeof CONTAINER_SIZE;
  children?: ReactNode;
  /** Adds bottom padding that clears a BottomNav and StickyActionBar. Default true. */
  padBottom?: boolean;
  /** The element to render. Default `main`. */
  as?: ElementType;
  className?: string;
}

/**
 * The page's content column: centered, with the shared side gutter and vertical padding,
 * and bottom padding that keeps the last row clear of fixed bottom bars.
 */
export function PageContainer({ size = 'default', children, padBottom = true, as = 'main', className }: PageContainerProps) {
  const Tag = as as ElementType;
  return (
    <Tag className={cn('mx-auto w-full px-[var(--nish-page-gutter)] py-6', CONTAINER_SIZE[size], padBottom && 'nish-pad-bottom-inset', className)}>
      {children}
    </Tag>
  );
}

// =====================================================================================
// useOnline and ConnectionBanner
// =====================================================================================

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** Whether the browser reports a network connection (`navigator.onLine`). True on the server. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

export interface ConnectionBannerProps {
  /** A URL to probe with `fetch` (cache: no-store). When it fails or returns a non-2xx
   *  status the banner shows. Leave out to react to the browser's online/offline state only. */
  healthUrl?: string;
  /** Base interval between probes. After failures it doubles up to 4x. Default 30000. */
  intervalMs?: number;
  /** Shown when the probe fails. Default "Can't reach the server". */
  message?: string;
  /** Shown when the browser is offline. Default "You're offline". */
  offlineMessage?: string;
  /** Called after the Retry button re-probes. */
  onRetry?: () => void;
}

/**
 * A sticky warning bar for lost connectivity. Watches `navigator.onLine` and, with
 * `healthUrl`, probes the server with backoff (and right away when the browser comes back
 * online or the tab becomes visible). Renders nothing while everything is reachable.
 */
export function ConnectionBanner({
  healthUrl,
  intervalMs = 30000,
  message = "Can't reach the server",
  offlineMessage = "You're offline",
  onRetry,
}: ConnectionBannerProps) {
  const online = useOnline();
  const [reachable, setReachable] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const probeRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!healthUrl) {
      probeRef.current = null;
      setReachable(true);
      return;
    }
    let disposed = false;
    let runId = 0;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ctrl: AbortController | undefined;

    const schedule = () => {
      clearTimeout(timer);
      const delay = Math.min(intervalMs * 2 ** failures, intervalMs * 4);
      timer = setTimeout(() => void run(), delay);
    };
    const run = async () => {
      clearTimeout(timer);
      ctrl?.abort();
      const mine = ++runId;
      const c = new AbortController();
      ctrl = c;
      const cut = setTimeout(() => c.abort(), 10000);
      let ok = false;
      try {
        const res = await fetch(healthUrl, { cache: 'no-store', signal: c.signal });
        ok = res.ok;
      } catch {
        ok = false;
      } finally {
        clearTimeout(cut);
      }
      if (disposed || mine !== runId) return;
      failures = ok ? 0 : failures + 1;
      setReachable(ok);
      schedule();
    };
    probeRef.current = run;

    const onOnline = () => void run();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      ctrl?.abort();
      probeRef.current = null;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [healthUrl, intervalMs]);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      await probeRef.current?.();
    } finally {
      setRetrying(false);
    }
    onRetry?.();
  }, [onRetry]);

  if (online && reachable) return null;
  return (
    <Callout
      variant="bar"
      tone="warn"
      sticky
      live
      compact
      action={
        <Button size="sm" variant="secondary" loading={retrying} onClick={() => void retry()}>
          Retry
        </Button>
      }
    >
      {online ? message : offlineMessage}
    </Callout>
  );
}
