import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '../cn';
import { ago, dateTime } from '../format';

/** True while the CSS media query matches. False on the server and before hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, get, () => false);
}

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS: [Exclude<Breakpoint, 'base'>, string][] = [
  ['xl', '(min-width: 1280px)'],
  ['lg', '(min-width: 1024px)'],
  ['md', '(min-width: 768px)'],
  ['sm', '(min-width: 640px)'],
];

function currentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined' || !window.matchMedia) return 'base';
  for (const [name, q] of BREAKPOINTS) if (window.matchMedia(q).matches) return name;
  return 'base';
}

function subscribeBreakpoint(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const lists = BREAKPOINTS.map(([, q]) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener('change', onChange));
  return () => lists.forEach((l) => l.removeEventListener('change', onChange));
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

const LOCAL_EVENT = 'nish-local-storage';

function readStored<T>(key: string, initial: T, raw: boolean): T {
  try {
    const text = window.localStorage.getItem(key);
    if (text === null) return initial;
    return raw ? (text as T) : (JSON.parse(text) as T);
  } catch {
    return initial;
  }
}

/**
 * State kept in localStorage. JSON by default, the raw string with { raw: true }. Never
 * throws (private mode, quota and bad JSON fall back to the initial value) and follows
 * changes from other tabs and from other hooks on the same key.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  o: { raw?: boolean } = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = !!o.raw;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const [value, setValueState] = useState<T>(() =>
    typeof window === 'undefined' ? initial : readStored(key, initial, raw),
  );
  const valueRef = useRef(value);
  valueRef.current = value;
  const instanceRef = useRef<object>({});

  useEffect(() => {
    const sync = () => setValueState(readStored(key, initialRef.current, raw));
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key) sync();
    };
    const onLocal = (e: Event) => {
      const d = (e as CustomEvent<{ key: string; source: object }>).detail;
      if (d && d.key === key && d.source !== instanceRef.current) sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_EVENT, onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_EVENT, onLocal);
    };
  }, [key, raw]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValueState(resolved);
      try {
        window.localStorage.setItem(key, raw ? String(resolved) : JSON.stringify(resolved));
      } catch {
        // Storage unavailable: the value still lives in memory.
      }
      try {
        window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key, source: instanceRef.current } }));
      } catch {
        // No window events.
      }
    },
    [key, raw],
  );

  return [value, setValue];
}

export interface RelativeTimeProps {
  /** The moment: a Date, epoch milliseconds or a date string. */
  value: Date | number | string;
  /** "3m ago" (short, default) or "3 minutes ago" (long). */
  style?: 'short' | 'long';
  /** How often the text refreshes, in milliseconds. Default 30000. */
  refreshMs?: number;
  /** Classes for the time element. */
  className?: string;
}

/** A self-updating "3m ago". The full date and time show on hover and in the dateTime attribute. */
export function RelativeTime({ value, style = 'short', refreshMs = 30000, className }: RelativeTimeProps) {
  const now = useNow(refreshMs);
  const d = new Date(value);
  const iso = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  return (
    <time dateTime={iso} title={dateTime(value)} className={cn('tabular-nums', className)}>
      {ago(value, { now, style })}
    </time>
  );
}
