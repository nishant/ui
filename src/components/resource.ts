'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatest } from './latest';
import { apiFetch, type ApiError } from './resource-classes';

export { ApiError, apiFetch, configureApi } from './resource-classes';
export type { ApiConfig, ApiFetchOptions } from './resource-classes';

export interface UseResourceOptions<T> {
  /** Poll every N ms while the tab is visible. Off by default. After a failed load the wait doubles per
   *  failure (with up to 10% jitter) up to 5 minutes, and returns to N ms after the next success. */
  intervalMs?: number;
  /** false skips fetching (dependent queries). Default true. */
  enabled?: boolean;
  /** Refetch when the tab becomes visible again after being hidden ≥ this many ms. Default 30000; 0 = always; false = never. */
  refetchOnVisible?: number | false;
  /** Refetch when the browser comes back online. Default true. */
  refetchOnReconnect?: boolean;
  /** Seed data shown before the first load finishes. */
  initialData?: T;
  /** Keep the previous key's data while a new key loads. Default true. */
  keepPrevious?: boolean;
}

export interface Resource<T> {
  data: T | undefined;
  /** Cleared by the next successful load. */
  error: ApiError | Error | undefined;
  /** True only while there is no data yet. */
  loading: boolean;
  /** True during any fetch, including background refreshes. */
  refreshing: boolean;
  /** When data last loaded successfully (ms epoch), or undefined. */
  updatedAt: number | undefined;
  /** With intervalMs: true when the last success is older than 3 intervals. Always false without intervalMs. */
  stale: boolean;
  /** Refetch now (never joins a request that is already running). Resolves when done; never rejects. */
  reload: () => Promise<void>;
  /** Replace data locally (optimistic update). A function gets the previous data. A response that was
   *  requested before the mutate and arrives after it does not overwrite it. */
  mutate: (next: T | ((prev: T | undefined) => T)) => void;
}

interface State<T> {
  key: string | null;
  data: T | undefined;
  error: ApiError | Error | undefined;
  updatedAt: number | undefined;
  fetching: boolean;
  /** How many loads have settled: the polling timer restarts on each, even when React batched
   *  the start and the end of a fast load into one render. */
  settled: number;
  /** True once a load of `key` has succeeded, even when it resolved undefined (a 204). */
  loaded?: boolean;
}

/** The longest wait between polls after failures. */
const MAX_BACKOFF_MS = 300_000;

interface Inflight {
  fetcher: unknown;
  promise: Promise<unknown>;
  ctl: AbortController;
  refs: number;
  /** Position in `clock` when the request started. */
  seq: number;
}

/** Requests running now, by key. Two hooks that ask for the same key (with the default fetcher, or
 *  the same fetcher function) share one request; it is aborted when the last of them lets go. */
const inflight = new Map<string, Inflight>();
/** Orders request starts against mutates, so a mutate can tell which responses are older than it. */
let clock = 0;

function sharedFetch<T>(key: string, fetcher: ((signal: AbortSignal) => Promise<T>) | undefined, signal: AbortSignal): Promise<T> {
  let entry = inflight.get(key);
  if (!entry || entry.fetcher !== fetcher) {
    const ctl = new AbortController();
    const made: Inflight = {
      fetcher,
      ctl,
      refs: 0,
      seq: ++clock,
      promise: fetcher ? fetcher(ctl.signal) : apiFetch<T>(key, { signal: ctl.signal }),
    };
    const forget = () => {
      if (inflight.get(key) === made) inflight.delete(key);
    };
    made.promise.then(forget, forget);
    inflight.set(key, made);
    entry = made;
  }
  const shared = entry;
  shared.refs++;
  return new Promise<T>((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      signal.removeEventListener('abort', onAbort);
      shared.refs--;
      if (shared.refs <= 0) {
        shared.ctl.abort();
        if (inflight.get(key) === shared) inflight.delete(key);
      }
    };
    function onAbort() {
      release();
      reject(new DOMException('The request was aborted.', 'AbortError'));
    }
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    // The abort listener stays after the request settles, so a key change or an unmount still
    // aborts the signal the fetcher was given, as it does without sharing.
    (shared.promise as Promise<T>).then(
      (v) => {
        if (!released) resolve(v);
      },
      (e: unknown) => {
        if (!released) reject(e);
      },
    );
  });
}

/** key: a string identifying the request (the URL); null disables. fetcher defaults to apiFetch(key, { signal }). */
export function useResource<T>(
  key: string | null,
  fetcher?: (signal: AbortSignal) => Promise<T>,
  o: UseResourceOptions<T> = {},
): Resource<T> {
  const { intervalMs, enabled = true, refetchOnVisible = 30000, refetchOnReconnect = true, keepPrevious = true } = o;
  const active = enabled && key !== null;

  const [state, setState] = useState<State<T>>(() => ({
    key,
    data: o.initialData,
    error: undefined,
    updatedAt: undefined,
    fetching: false,
    settled: 0,
  }));

  const fetcherRef = useLatest(fetcher);
  const keyRef = useLatest(key);
  const activeRef = useLatest(active);
  const keepPrevRef = useLatest(keepPrevious);
  const initialRef = useLatest(o.initialData);
  const ctlRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const pollSkippedRef = useRef(false);
  const failuresRef = useRef(0);
  const mutatedRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  /** `fresh`: start a request of its own even when another hook is fetching the same key. */
  const load = useCallback(
    async (fresh = false): Promise<void> => {
      const k = keyRef.current;
      if (k === null || !activeRef.current) return;
      ctlRef.current?.abort();
      const ctl = new AbortController();
      ctlRef.current = ctl;
      const run = ++runRef.current;
      let startedAt = 0;
      pollSkippedRef.current = false;
      setState((s) =>
        s.key === k
          ? { ...s, fetching: true }
          : {
              key: k,
              data: keepPrevRef.current ? s.data : initialRef.current,
              error: undefined,
              updatedAt: keepPrevRef.current ? s.updatedAt : undefined,
              fetching: true,
              settled: s.settled,
              loaded: false,
            },
      );
      try {
        const fn = fetcherRef.current;
        let pending: Promise<T>;
        if (fresh) {
          startedAt = ++clock;
          pending = fn ? fn(ctl.signal) : apiFetch<T>(k, { signal: ctl.signal });
        } else {
          pending = sharedFetch<T>(k, fn, ctl.signal);
          // A joined request started when its first asker made it, which may be before our mutate.
          startedAt = inflight.get(k)?.seq ?? ++clock;
        }
        const data = await pending;
        if (run !== runRef.current || ctl.signal.aborted) return;
        failuresRef.current = 0;
        if (mutatedRef.current > startedAt) {
          // The data was asked for before a local mutate: keep the mutated data.
          setState((s) => ({ ...s, key: k, error: undefined, fetching: false, settled: s.settled + 1, loaded: true }));
          return;
        }
        setState((s) => ({ key: k, data, error: undefined, updatedAt: Date.now(), fetching: false, settled: s.settled + 1, loaded: true }));
      } catch (e) {
        if (run !== runRef.current || ctl.signal.aborted) return;
        failuresRef.current++;
        const error = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, key: k, error, fetching: false, settled: s.settled + 1 }));
      }
    },
    [activeRef, fetcherRef, initialRef, keepPrevRef, keyRef],
  );

  // Fetch on key change or enable. Aborts on change and on unmount.
  useEffect(() => {
    if (!active) return;
    failuresRef.current = 0;
    void load();
    return () => {
      // A counter, not a DOM node: bumping it makes any response still in flight stale.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runRef.current++;
      ctlRef.current?.abort();
      ctlRef.current = null;
      setState((s) => (s.fetching ? { ...s, fetching: false } : s));
    };
  }, [active, key, load]);

  // Polling: a timeout chain that schedules the next tick after the previous fetch settles.
  const fetching = state.fetching;
  const updatedAt = state.updatedAt;
  const settled = state.settled;
  useEffect(() => {
    if (!active || !intervalMs || fetching) return;
    const failures = failuresRef.current;
    let wait = intervalMs;
    if (failures > 0) {
      const cap = Math.max(intervalMs, MAX_BACKOFF_MS);
      const base = Math.min(intervalMs * 2 ** Math.min(failures, 20), cap);
      wait = Math.min(cap, Math.round(base * (0.9 + Math.random() * 0.2)));
    }
    const id = setTimeout(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        pollSkippedRef.current = true;
        return;
      }
      void load();
    }, wait);
    return () => clearTimeout(id);
  }, [active, intervalMs, fetching, settled, load]);

  // Becoming visible again, and coming back online.
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    let hiddenAt: number | null = document.hidden ? Date.now() : null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      const skipped = pollSkippedRef.current;
      pollSkippedRef.current = false;
      if (skipped || (refetchOnVisible !== false && away >= refetchOnVisible)) void load();
    };
    const onOnline = () => {
      if (refetchOnReconnect) void load();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [active, refetchOnVisible, refetchOnReconnect, load]);

  // Re-evaluate staleness as time passes.
  useEffect(() => {
    if (!intervalMs || updatedAt === undefined) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, updatedAt]);

  const mutate = useCallback((next: T | ((prev: T | undefined) => T)) => {
    mutatedRef.current = ++clock;
    setState((s) => ({
      ...s,
      data: typeof next === 'function' ? (next as (prev: T | undefined) => T)(s.data) : next,
    }));
  }, []);

  const reload = useCallback(() => load(true), [load]);

  const sameKey = state.key === key;
  const data = sameKey || keepPrevious ? state.data : o.initialData;
  const error = sameKey ? state.error : undefined;
  const stale = !!intervalMs && updatedAt !== undefined && Math.max(now, updatedAt) - updatedAt > intervalMs * 3;

  return {
    data,
    error,
    loading: active && data === undefined && error === undefined && !(sameKey && state.loaded),
    refreshing: state.fetching || (active && !sameKey),
    updatedAt,
    stale,
    reload,
    mutate,
  };
}
