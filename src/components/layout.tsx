'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { mergeRefs } from './data-classes';
import { Callout } from './display';
import { useHeightVar, useStuck } from './layout-vars';
import { Button } from './primitives';
import { useStrings } from './provider';
import { STATUS_STRINGS } from './strings';

// Page-level layout pieces: sticky bars, the bottom action bar, the top loading bar, the
// page container and the connection banner. They read and write the layout contract
// variables on <html> (see layout-vars.ts and base.css).

// =====================================================================================
// StickyBar
// =====================================================================================

export interface StickyBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The bar element. */
  ref?: Ref<HTMLElement>;
  /** The bar's content: a filter row, a toolbar, a SectionNav. */
  children?: ReactNode;
  /** CSS `top` offset. Defaults to just under the app header (`var(--nish-header-h, 0px)`). */
  top?: string;
  /** Adds a bottom border and a soft shadow once the bar is stuck. Default true. */
  elevate?: boolean;
  /** The element to render. Default `div`. */
  as?: ElementType;
}

/**
 * A bar that sticks under the app header while the page scrolls. Opaque, and its
 * background reaches the screen edges (it bleeds through the page gutter). Publishes its
 * height as `--nish-sticky-extra` while mounted, so anchor links scroll clear of it.
 */
export function StickyBar({
  children,
  top = 'var(--nish-header-h, 0px)',
  elevate = true,
  as = 'div',
  className,
  style,
  ref: refProp,
  ...rest
}: StickyBarProps) {
  const ref = useRef<HTMLElement | null>(null);
  const stuck = useStuck(ref);
  useHeightVar(ref, '--nish-sticky-extra');
  // One merged callback per ref pair: an inline one is a new ref every render, so React would detach and re-attach it each time.
  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, refProp), [refProp]);
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      ref={mergedRef}
      data-nish-bar=""
      style={{ top, ...style } satisfies CSSProperties}
      className={cn(
        'sticky z-[var(--nish-z-sticky,20)] -mx-[var(--nish-page-gutter)] border-b bg-th-bg px-[var(--nish-page-gutter)]',
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

export interface StickyActionBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The bar element. */
  ref?: Ref<HTMLDivElement>;
  /** Shows the bar. Closed, it renders nothing and publishes no height. */
  open: boolean;
  /** Short text at the start, e.g. "3 changes". Truncates to one line. */
  message?: ReactNode;
  /** The main action, usually a primary Button. */
  primary: ReactNode;
  /** A second action, usually a ghost or secondary Button (Discard, Cancel). */
  secondary?: ReactNode;
  /** Accessible name of the region. Default: the provider's `actions` string. */
  label?: string;
}

/**
 * A bar fixed to the bottom of the screen for the actions of an unsaved form or a
 * selection. Sits above a BottomNav when there is one, and publishes `--nish-bottom-bar-h`
 * while open so page padding and toasts clear it. From sm it floats as a pill at the
 * bottom end.
 */
export function StickyActionBar({
  open,
  message,
  primary,
  secondary,
  label,
  className,
  ref: refProp,
  ...rest
}: StickyActionBarProps) {
  const strings = useStrings(STATUS_STRINGS);
  const ref = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, refProp), [refProp]);
  useHeightVar(ref, '--nish-bottom-bar-h', open);
  if (!open) return null;
  return (
    <div
      {...rest}
      ref={mergedRef}
      role="region"
      aria-label={label ?? strings.actions}
      data-state="open"
      data-nish-bar=""
      data-nish-print="hide"
      className={cn(
        'fixed inset-x-0 bottom-[var(--nish-bottom-nav-h,0px)] z-[calc(var(--nish-z-sticky,20)+10)] flex items-center gap-3 border-t border-th-line bg-th-elevated px-4 pt-3 shadow-[var(--nish-shadow-pop)]',
        // The nav already covers the home-indicator inset; only pad for what it leaves.
        'pb-[max(0.75rem,calc(env(safe-area-inset-bottom)_-_var(--nish-bottom-nav-h,0px)))]',
        'animate-[nish-bar-in_220ms_var(--nish-ease-out)] motion-reduce:animate-none',
        'sm:inset-x-auto sm:end-6 sm:bottom-[calc(var(--nish-bottom-nav-h,0px)_+_1.5rem)] sm:rounded-[var(--nish-radius-lg)] sm:border sm:pb-3',
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

export interface LoadingBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The bar element (rendered after the delay). */
  ref?: Ref<HTMLDivElement>;
  /** True while something loads (a route change, a refetch). */
  active: boolean;
  /** Waits this long before showing, so quick loads never flash a bar. Default 200. */
  delayMs?: number;
  /** CSS `top`. Defaults to just under the app header. */
  top?: string;
  /** Text for screen readers ("Loading page…"). With it set, the bar renders a persistent
   *  polite live region that holds the text while the bar shows (after `delayMs`) and is
   *  emptied when loading ends, so the start is announced. Without it nothing is announced. */
  announce?: string;
}

/**
 * A thin indeterminate progress bar fixed under the app header. Appears only after
 * `delayMs` of being active. With reduced motion it is a static partial bar.
 */
export function LoadingBar({
  active,
  delayMs = 200,
  top = 'var(--nish-header-h, 0px)',
  announce,
  className,
  style,
  ref,
  ...rest
}: LoadingBarProps) {
  const strings = useStrings(STATUS_STRINGS);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  const visible = active && shown;
  return (
    <>
      {announce !== undefined ? (
        <div role="status" aria-live="polite" className="sr-only" data-nish-loading-announce="">
          {visible ? announce : ''}
        </div>
      ) : null}
      {visible ? (
        <div
          aria-label={strings.loading}
          {...rest}
          ref={ref}
          role="progressbar"
          aria-busy="true"
          data-state="active"
          data-nish-bar=""
          data-nish-print="hide"
          style={{ top, ...style } satisfies CSSProperties}
          className={cn('pointer-events-none fixed inset-x-0 z-[var(--nish-z-dropdown,40)] h-0.5 overflow-hidden', className)}
        >
          <div className="h-full w-2/5 bg-th-accent animate-[nish-loading-bar_1.2s_linear_infinite] motion-reduce:animate-none forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]" />
        </div>
      ) : null}
    </>
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

export interface PageContainerProps extends Omit<ComponentPropsWithoutRef<'main'>, 'children'> {
  /** The container element. */
  ref?: Ref<HTMLElement>;
  /** Max width: narrow 42rem, default 56rem, wide 80rem, full none. */
  size?: keyof typeof CONTAINER_SIZE;
  children?: ReactNode;
  /** Adds bottom padding that clears a BottomNav and StickyActionBar. Default true. */
  padBottom?: boolean;
  /** The element to render. Default `main`. */
  as?: ElementType;
}

/**
 * The page's content column: centered, with the shared side gutter and vertical padding,
 * and bottom padding that keeps the last row clear of fixed bottom bars.
 */
export function PageContainer({
  size = 'default',
  children,
  padBottom = true,
  as = 'main',
  className,
  ref,
  ...rest
}: PageContainerProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref}
      className={cn(
        'mx-auto w-full px-[var(--nish-page-gutter)]',
        CONTAINER_SIZE[size],
        // The bottom padding is a utility, not only .nish-pad-bottom-inset: that class is in the
        // base layer, so a py-6 utility here used to beat it and the page ended under the BottomNav.
        padBottom
          ? 'nish-pad-bottom-inset pt-6 pb-[max(calc(var(--nish-bottom-inset,0px)+1rem),calc(1rem+env(safe-area-inset-bottom)))]'
          : 'py-6',
        className,
      )}
      {...rest}
    >
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

/** Whether the browser reports a network connection (`navigator.onLine`). True on the server
 *  and in the first client render. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

export interface ConnectionBannerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title' | 'onClick'> {
  /** The banner's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A URL to probe with `fetch` (cache: no-store). When it fails or returns a non-2xx
   *  status the banner shows. Leave out to react to the browser's online/offline state only. */
  healthUrl?: string;
  /** Base interval between probes. After failures it doubles up to 4x. Default 30000. */
  intervalMs?: number;
  /** Shown when the probe fails. Default: the `serverUnreachable` string ("Can't reach the server"). */
  message?: string;
  /** Shown when the browser is offline. Default: the provider's `offline` string. */
  offlineMessage?: string;
  /** Retry button text. Default: the provider's `retry` string. */
  retryLabel?: string;
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
  message,
  offlineMessage,
  retryLabel,
  onRetry,
  ...rest
}: ConnectionBannerProps) {
  const strings = useStrings(STATUS_STRINGS);
  const online = useOnline();
  const [reachable, setReachable] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const probeRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!healthUrl) {
      probeRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
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
      if (document.visibilityState === 'hidden') return;
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
      {...rest}
      action={
        <Button size="sm" variant="secondary" loading={retrying} onClick={() => void retry()}>
          {retryLabel ?? strings.retry}
        </Button>
      }
    >
      {online ? (message ?? strings.serverUnreachable) : (offlineMessage ?? strings.offline)}
    </Callout>
  );
}
