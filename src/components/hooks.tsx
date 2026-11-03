'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { ago, dateTime } from '../format';
import { BREAKPOINTS, NARROW_QUERY, PHONE_QUERY, type Breakpoint } from './hooks-classes';
import { useNishConfig } from './provider';

export { BREAKPOINTS, NARROW_QUERY, PHONE_QUERY };
export type { Breakpoint };

// One MediaQueryList and one listener per query string, shared by every component that asks.
// An entry exists only while something is subscribed, so nothing runs at import time and
// matchMedia is never called during render (the snapshot is the cached `matches`).
interface QueryEntry {
  mql: MediaQueryList;
  matches: boolean;
  subs: Set<() => void>;
  onChange: () => void;
}
const queries = new Map<string, QueryEntry>();

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function subscribeQuery(query: string, cb: () => void): () => void {
  if (!hasMatchMedia()) return () => {};
  let entry = queries.get(query);
  if (!entry) {
    const mql = window.matchMedia(query);
    const created: QueryEntry = {
      mql,
      matches: mql.matches,
      subs: new Set(),
      onChange: () => {
        created.matches = mql.matches;
        created.subs.forEach((fn) => fn());
      },
    };
    mql.addEventListener('change', created.onChange);
    queries.set(query, created);
    entry = created;
  }
  const owner = entry;
  owner.subs.add(cb);
  return () => {
    owner.subs.delete(cb);
    if (owner.subs.size === 0) {
      owner.mql.removeEventListener('change', owner.onChange);
      if (queries.get(query) === owner) queries.delete(query);
    }
  };
}

function queryMatches(query: string): boolean {
  return queries.get(query)?.matches ?? false;
}

/** True while the CSS media query matches. False on the server and in the first client render, then follows the query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => subscribeQuery(query, onChange), [query]);
  const get = useCallback(() => queryMatches(query), [query]);
  return useSyncExternalStore(subscribe, get, () => false);
}

const BREAKPOINT_QUERIES: [Exclude<Breakpoint, 'base'>, string][] = (['xl', 'lg', 'md', 'sm'] as const).map((name) => [
  name,
  `(min-width: ${BREAKPOINTS[name]}px)`,
]);

/** True below 640px (the Fold's cover screen, any phone held upright). */
export function usePhone(): boolean {
  return useMediaQuery(PHONE_QUERY);
}

/** True below 768px: where BottomNav shows and NavRail hides. */
export function useNarrow(): boolean {
  return useMediaQuery(NARROW_QUERY);
}

function currentBreakpoint(): Breakpoint {
  for (const [name, q] of BREAKPOINT_QUERIES) if (queryMatches(q)) return name;
  return 'base';
}

function subscribeBreakpoint(onChange: () => void): () => void {
  const stops = BREAKPOINT_QUERIES.map(([, q]) => subscribeQuery(q, onChange));
  return () => stops.forEach((stop) => stop());
}

/** The largest Tailwind breakpoint the viewport has reached: base, sm (640), md (768), lg (1024) or xl (1280). */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribeBreakpoint, currentBreakpoint, () => 'base');
}

/**
 * Sets document.title to "title · app" (or just the app, or just the title) and restores
 * the previous title on unmount. An undefined title with no app leaves the title alone.
 */
export function useDocumentTitle(title: string | undefined, o: { app?: string } = {}): void {
  const app = o.app;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const next = title && app ? `${title} · ${app}` : title || app;
    if (!next) return;
    const previous = document.title;
    document.title = next;
    return () => {
      document.title = previous;
    };
  }, [title, app]);
}

/** Date.now() that updates every intervalMs, paused while the tab is hidden. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (id === undefined) id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id !== undefined) clearInterval(id);
      id = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
        start();
      } else stop();
    };
    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
  return now;
}

// localStorage as an external store. The snapshot is the stored text (a string or null), so it
// is stable between renders; the parsed value is memoized from it. A write that storage
// refuses (private mode, quota) is kept in `memory` so the value still lives for this page.
const storeSubs = new Map<string, Set<() => void>>();
const memory = new Map<string, string>();
const warned = new Set<string>();
let storageListening = false;

function notify(key: string | null): void {
  if (key === null) storeSubs.forEach((set) => set.forEach((fn) => fn()));
  else storeSubs.get(key)?.forEach((fn) => fn());
}

function onStorageEvent(e: StorageEvent): void {
  if (e.key !== null) memory.delete(e.key);
  else memory.clear();
  notify(e.key);
}

function subscribeKey(key: string, cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let set = storeSubs.get(key);
  if (!set) storeSubs.set(key, (set = new Set()));
  const subs = set;
  subs.add(cb);
  if (!storageListening) {
    storageListening = true;
    window.addEventListener('storage', onStorageEvent);
  }
  return () => {
    subs.delete(cb);
    if (subs.size === 0 && storeSubs.get(key) === subs) storeSubs.delete(key);
    if (storeSubs.size === 0 && storageListening) {
      storageListening = false;
      window.removeEventListener('storage', onStorageEvent);
    }
  };
}

function readText(key: string): string | null {
  const kept = memory.get(key);
  if (kept !== undefined) return kept;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseStored<T>(key: string, text: string | null, initial: T, raw: boolean): T {
  if (text === null) return initial;
  if (raw) return text as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    const id = key + '\0' + text;
    if (globalThis.process?.env?.NODE_ENV !== 'production' && !warned.has(id)) {
      warned.add(id);
      console.warn(`nish-ui: useLocalStorage("${key}") found text that is not valid JSON; using the initial value.`);
    }
    return initial;
  }
}

/**
 * State kept in localStorage. JSON by default, the raw string with { raw: true }. Never
 * throws (private mode, quota and bad JSON fall back to the initial value) and follows
 * changes from other tabs (`storage` events) and from other hooks on the same key. The
 * server and the first client render return `initial`.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  o: { raw?: boolean } = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = !!o.raw;
  const [first] = useState(() => initial);
  const subscribe = useCallback((onChange: () => void) => subscribeKey(key, onChange), [key]);
  const get = useCallback(() => readText(key), [key]);
  const text = useSyncExternalStore(subscribe, get, () => null);
  const value = useMemo(() => parseStored(key, text, first, raw), [key, text, first, raw]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(parseStored(key, readText(key), first, raw)) : next;
      const out = raw ? String(resolved) : JSON.stringify(resolved);
      try {
        window.localStorage.setItem(key, out);
        memory.delete(key);
      } catch {
        // Storage unavailable: the value still lives in memory.
        memory.set(key, out);
      }
      notify(key);
    },
    [key, raw, first],
  );

  return [value, setValue];
}

export interface RelativeTimeProps extends Omit<ComponentPropsWithoutRef<'time'>, 'children' | 'dateTime' | 'style'> {
  /** The moment: a Date, epoch milliseconds or a date string. */
  value: Date | number | string;
  /** "3m ago" (short, default) or "3 minutes ago" (long). This is the text style, so the inline `style` attribute is not accepted: use className. */
  style?: 'short' | 'long';
  /** How often the text refreshes, in milliseconds. Default 30000. */
  refreshMs?: number;
  /** Language of the words. Default NishProvider locale, then setDefaultLocale() (en-US). */
  locale?: string;
  /** Classes for the time element. */
  className?: string;
  ref?: Ref<HTMLTimeElement>;
}

/** A self-updating "3m ago". The full date and time show on hover and in the dateTime attribute. */
export function RelativeTime({
  value,
  style: textStyle = 'short',
  refreshMs = 30000,
  locale,
  className,
  ref,
  ...rest
}: RelativeTimeProps) {
  const now = useNow(refreshMs);
  const config = useNishConfig();
  const loc = locale ?? config.locale;
  const d = new Date(value);
  const iso = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  return (
    <time
      {...rest}
      ref={ref}
      dateTime={iso}
      title={dateTime(value, { locale: loc })}
      className={cn('tabular-nums', className)}
      suppressHydrationWarning
    >
      {ago(value, { now, style: textStyle, locale: loc })}
    </time>
  );
}
