// The fetch layer behind useResource: no React and no directive, so a server component can
// import ApiError or apiFetch. resource.ts ('use client') re-exports everything here.

import { shared } from '../runtime';

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
  /** Aborts and throws ApiError(status 0, message "The server took too long to answer.") after this many ms (covers the body read too). Default 15000. */
  timeoutMs?: number;
  /** Resolve null instead of throwing on 404. */
  nullOn404?: boolean;
}

export interface ApiConfig {
  /** Prefixed to relative paths that start with "/". Default "". */
  baseUrl?: string;
  /** Called (once per response) for any 401 before the error is thrown. */
  onUnauthorized?: (err: ApiError) => void;
  /** Extra headers on every request (an auth token for an Electron app). Sent only to
   *  same-origin URLs (and to `baseUrl`'s origin) unless `headersFor` allows the URL. */
  headers?: () => Record<string, string>;
  /** Return true to send the `headers()` to this (cross-origin) URL too. Called with the
   *  request URL; never called for a same-origin URL, which always gets them. */
  headersFor?: (url: string) => boolean;
}

// One record per page, so two copies of the package agree on the headers and baseUrl.
const store = shared<{ config: ApiConfig }>('api', () => ({ config: {} }));

/** Merges into the page-wide config used by every apiFetch call. */
export function configureApi(c: ApiConfig): void {
  store.config = { ...store.config, ...c };
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

/** A machine code such as "not_found" or "server_error", as opposed to a sentence. */
const ERROR_CODE = /^[a-z0-9_]+$/;

/** The message for a failed response, in the wording the apps share: the server's own
 *  `error` or `message` sentence when it sent one; otherwise a plain sentence for the status. */
function errorMessage(body: unknown, status: number): string {
  let raw = '';
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.error === 'string' && o.error) raw = o.error;
    else if (typeof o.message === 'string' && o.message) raw = o.message;
  }
  if (raw && !ERROR_CODE.test(raw)) return raw;
  if (status === 401) return 'Log in to continue.';
  if (raw && status === 404) return 'That was not found.';
  if (raw) return 'The server had a problem. Try again.';
  return `The server answered ${status}.`;
}

/** The first characters of a body on one line, for an error message. */
function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** True when `url` goes to the page's own origin or to the configured baseUrl's origin. The URL is
 *  resolved the way fetch resolves it (backslashes count as slashes, tabs and leading spaces are
 *  dropped), never classified by its string shape. */
function isTrustedOrigin(url: string): boolean {
  const here = typeof location !== 'undefined' ? location.href : undefined;
  const dummy = 'http://nish-ui.invalid/';
  try {
    const target = new URL(url, here ?? dummy);
    if (target.origin === new URL(here ?? dummy).origin) return true;
    if (store.config.baseUrl && SCHEME.test(store.config.baseUrl) && target.origin === new URL(store.config.baseUrl).origin) return true;
  } catch {
    return false;
  }
  return false;
}

/** fetch with JSON in and out, a timeout, and a typed ApiError for every failure. */
export async function apiFetch<T = unknown>(path: string, o: ApiFetchOptions = {}): Promise<T> {
  const { body, timeoutMs = 15000, nullOn404, signal: callerSignal, headers: extraHeaders, ...init } = o;
  const url = path.startsWith('/') && store.config.baseUrl ? store.config.baseUrl + path : path;

  const headers = new Headers({ accept: 'application/json' });
  if (store.config.headers && (isTrustedOrigin(url) || store.config.headersFor?.(url) === true)) {
    for (const [k, v] of Object.entries(store.config.headers())) headers.set(k, v);
  }
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
      if (timedOut) throw new ApiError('The server took too long to answer.', { status: 0, url });
      if (e instanceof Error && e.name === 'AbortError') throw e;
      throw new ApiError('Could not reach the server.', { status: 0, url });
    }

    const type = res.headers.get('content-type') ?? '';
    let parsed: unknown = text === '' ? null : text;
    let badJson = false;
    if (text !== '' && /json/i.test(type)) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
        badJson = true;
      }
    }

    if (!res.ok) {
      if (res.status === 404 && nullOn404) return null as T;
      const err = new ApiError(errorMessage(parsed, res.status), { status: res.status, body: parsed, url });
      if (res.status === 401) store.config.onUnauthorized?.(err);
      throw err;
    }
    if (res.status === 204 || text === '') return undefined as T;
    if (badJson) {
      const sample = excerpt(text);
      throw new ApiError(`The server answered ${res.status} with a body that is not valid JSON: ${sample}`, {
        status: res.status,
        body: sample,
        url,
      });
    }
    return parsed as T;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}
