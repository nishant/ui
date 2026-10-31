import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  /** HTTP status; 0 = network failure or abort-by-timeout. */
  readonly status: number;
  /** Parsed JSON body when the response had one, else the text, else null. */
  readonly body: unknown;
  readonly url: string;
  constructor(message: string, o: { status: number; body?: unknown; url: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = o.status;
    this.body = o.body ?? null;
    this.url = o.url;
  }
  /** True for 0 (network) and 5xx: worth retrying. */
  get retryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Serialized as JSON with content-type application/json. A string/FormData/Blob is sent as is. */
  body?: unknown;
  /** Aborts and throws ApiError(status 0, message "Request timed out") after this many ms (covers the body read too). Default 15000. */
  timeoutMs?: number;
  /** Resolve null instead of throwing on 404. */
  nullOn404?: boolean;
}

export interface ApiConfig {
  /** Prefixed to relative paths that start with "/". Default "". */
  baseUrl?: string;
  /** Called (once per response) for any 401 before the error is thrown. */
  onUnauthorized?: (err: ApiError) => void;
  /** Extra headers on every request (an auth token for an Electron app). */
  headers?: () => Record<string, string>;
}

let config: ApiConfig = {};

/** Merges into the module-level config used by every apiFetch call. */
export function configureApi(c: ApiConfig): void {
  config = { ...config, ...c };
}

function isRawBody(b: unknown): boolean {
  return (
    typeof b === 'string' ||
    (typeof FormData !== 'undefined' && b instanceof FormData) ||
    (typeof Blob !== 'undefined' && b instanceof Blob) ||
    (typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams) ||
    b instanceof ArrayBuffer ||
    ArrayBuffer.isView(b)
  );
}

function errorMessage(body: unknown, res: Response): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.error === 'string' && o.error) return o.error;
    if (typeof o.message === 'string' && o.message) return o.message;
  }
  const line = `${res.status} ${res.statusText}`.trim();
  return line || 'Request failed';
}

/** fetch with JSON in and out, a timeout, and a typed ApiError for every failure. */
export async function apiFetch<T = unknown>(path: string, o: ApiFetchOptions = {}): Promise<T> {
  const { body, timeoutMs = 15000, nullOn404, signal: callerSignal, headers: extraHeaders, ...init } = o;
  const url = path.startsWith('/') && config.baseUrl ? config.baseUrl + path : path;

  const headers = new Headers({ accept: 'application/json' });
  if (config.headers) for (const [k, v] of Object.entries(config.headers())) headers.set(k, v);
  if (extraHeaders) new Headers(extraHeaders).forEach((v, k) => headers.set(k, v));

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isRawBody(body)) payload = body as BodyInit;
    else {
      payload = JSON.stringify(body);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    }
  }

  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, timeoutMs);
  const onCallerAbort = () => ctl.abort();
  if (callerSignal) {
    if (callerSignal.aborted) ctl.abort();
    else callerSignal.addEventListener('abort', onCallerAbort, { once: true });
  }

  try {
    let res: Response;
    let text: string;
    try {
      res = await fetch(url, { credentials: 'same-origin', ...init, headers, body: payload, signal: ctl.signal });
      text = await res.text();
    } catch (e) {
      if (timedOut) throw new ApiError('Request timed out', { status: 0, url });
      if (e instanceof Error && e.name === 'AbortError') throw e;
      throw new ApiError("Can't reach the server", { status: 0, url });
    }

    const type = res.headers.get('content-type') ?? '';
    let parsed: unknown = text === '' ? null : text;
    if (text !== '' && /json/i.test(type)) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      if (res.status === 404 && nullOn404) return null as T;
      const err = new ApiError(errorMessage(parsed, res), { status: res.status, body: parsed, url });
      if (res.status === 401) config.onUnauthorized?.(err);
      throw err;
    }
    if (res.status === 204 || text === '') return undefined as T;
    return parsed as T;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}

export interface UseResourceOptions<T> {
  /** Poll every N ms while the tab is visible. Off by default. */
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
  /** Refetch now. Resolves when done; never rejects. */
  reload: () => Promise<void>;
  /** Replace data locally (optimistic update). A function gets the previous data. */
  mutate: (next: T | ((prev: T | undefined) => T)) => void;
}

interface State<T> {
  key: string | null;
  data: T | undefined;
  error: ApiError | Error | undefined;
  updatedAt: number | undefined;
  fetching: boolean;
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
  }));

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef(key);
  keyRef.current = key;
  const ctlRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const pollSkippedRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (): Promise<void> => {
    const k = keyRef.current;
    if (k === null) return;
    ctlRef.current?.abort();
    const ctl = new AbortController();
    ctlRef.current = ctl;
    const run = ++runRef.current;
    pollSkippedRef.current = false;
    setState((s) => ({ ...s, key: k, fetching: true }));
    try {
      const fn = fetcherRef.current;
      const data = await (fn ? fn(ctl.signal) : apiFetch<T>(k, { signal: ctl.signal }));
      if (run !== runRef.current || ctl.signal.aborted) return;
      setState({ key: k, data, error: undefined, updatedAt: Date.now(), fetching: false });
    } catch (e) {
      if (run !== runRef.current || ctl.signal.aborted) return;
      const error = e instanceof Error ? e : new Error(String(e));
      setState((s) => ({ ...s, key: k, error, fetching: false }));
    }
  }, []);

  // Fetch on key change or enable. Aborts on change and on unmount.
  useEffect(() => {
    if (!active) return;
    void load();
    return () => {
      runRef.current++;
      ctlRef.current?.abort();
      ctlRef.current = null;
    };
  }, [active, key, load]);

  // Polling: a timeout chain that schedules the next tick after the previous fetch settles.
  const fetching = state.fetching;
  const updatedAt = state.updatedAt;
  useEffect(() => {
    if (!active || !intervalMs || fetching) return;
    const id = setTimeout(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        pollSkippedRef.current = true;
        return;
      }
      void load();
    }, intervalMs);
    return () => clearTimeout(id);
  }, [active, intervalMs, fetching, load]);

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
    setState((s) => ({
      ...s,
      data: typeof next === 'function' ? (next as (prev: T | undefined) => T)(s.data) : next,
    }));
  }, []);

  const reload = useCallback(() => load(), [load]);

  const sameKey = state.key === key;
  const data = sameKey || keepPrevious ? state.data : o.initialData;
  const error = sameKey ? state.error : undefined;
  const stale = !!intervalMs && updatedAt !== undefined && Math.max(now, updatedAt) - updatedAt > intervalMs * 3;

  return {
    data,
    error,
    loading: active && data === undefined && error === undefined,
    refreshing: state.fetching || (active && !sameKey),
    updatedAt,
    stale,
    reload,
    mutate,
  };
}
