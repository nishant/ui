import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, configureApi, useResource } from './resource';

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });
}

function hangUntilAbort(_u: string, init: RequestInit) {
  return new Promise((_, reject) => {
    init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  });
}

describe('apiFetch', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    configureApi({ baseUrl: '', onUnauthorized: undefined, headers: undefined });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('parses JSON on 2xx', async () => {
    fetchMock.mockResolvedValue(json({ a: 1 }));
    expect(await apiFetch('/x')).toEqual({ a: 1 });
    const init = fetchMock.mock.calls[0][1];
    expect(init.credentials).toBe('same-origin');
    expect(new Headers(init.headers).get('accept')).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await apiFetch('/x')).toBeUndefined();
  });

  it('throws ApiError with body.error on non-2xx', async () => {
    fetchMock.mockResolvedValue(json({ error: 'Nope' }, { status: 400, statusText: 'Bad Request' }));
    const err = await apiFetch('/x').then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('Nope');
    expect(err.status).toBe(400);
    expect(err.body).toEqual({ error: 'Nope' });
    expect(err.retryable).toBe(false);
  });

  it('falls back to status text and marks 5xx retryable', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 503, statusText: 'Service Unavailable' }));
    const err = await apiFetch('/x').then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    expect(err.message).toBe('503 Service Unavailable');
    expect(err.body).toBe('oops');
    expect(err.retryable).toBe(true);
  });

  it('maps a network failure to status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await apiFetch('/x').then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe("Can't reach the server");
    expect(err.retryable).toBe(true);
  });

  it('times out with status 0', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(hangUntilAbort);
    const p = apiFetch('/x', { timeoutMs: 100 }).then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    await vi.advanceTimersByTimeAsync(150);
    const err = await p;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toBe('Request timed out');
  });

  it('rethrows the caller abort unchanged', async () => {
    const ctl = new AbortController();
    fetchMock.mockImplementation(hangUntilAbort);
    const p = apiFetch('/x', { signal: ctl.signal }).then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    ctl.abort();
    const err = await p;
    expect(err).not.toBeInstanceOf(ApiError);
    expect(err.name).toBe('AbortError');
  });

  it('calls onUnauthorized on 401 then throws', async () => {
    const onUnauthorized = vi.fn();
    configureApi({ onUnauthorized });
    fetchMock.mockResolvedValue(json({ error: 'Sign in' }, { status: 401 }));
    const err = await apiFetch('/x').then(() => { throw new Error("expected a rejection"); }, (e: unknown) => e as ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(err.status).toBe(401);
  });

  it('serializes a JSON body and resolves null on 404 with nullOn404', async () => {
    fetchMock.mockResolvedValue(json({ error: 'gone' }, { status: 404 }));
    expect(await apiFetch('/x', { method: 'POST', body: { a: 1 }, nullOn404: true })).toBeNull();
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
  });

  it('sends a string body as is and applies baseUrl', async () => {
    configureApi({ baseUrl: 'https://api.test' });
    fetchMock.mockResolvedValue(json({}));
    await apiFetch('/y', { method: 'POST', body: 'raw' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/y');
    expect(fetchMock.mock.calls[0][1].body).toBe('raw');
  });
});

describe('useResource', () => {
  const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  };
  const flush = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads: loading then data', async () => {
    const fetcher = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useResource('k', fetcher));
    expect(result.current.loading).toBe(true);
    expect(result.current.refreshing).toBe(true);
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('hello');
    expect(result.current.refreshing).toBe(false);
    expect(typeof result.current.updatedAt).toBe('number');
  });

  it('keeps old data when a refetch errors, and clears the error on success', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce('one').mockRejectedValueOnce(new Error('bad')).mockResolvedValueOnce('two');
    const { result } = renderHook(() => useResource('k', fetcher));
    await flush();
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.data).toBe('one');
    expect(result.current.error?.message).toBe('bad');
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.data).toBe('two');
    expect(result.current.error).toBeUndefined();
  });

  it('aborts the previous fetch on key change and keeps previous data', async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return Promise.resolve(`d${signals.length}`);
    });
    const { result, rerender } = renderHook(({ k }) => useResource(k, fetcher), { initialProps: { k: 'a' } });
    await flush();
    expect(result.current.data).toBe('d1');
    rerender({ k: 'b' });
    expect(signals[0].aborted).toBe(true);
    expect(result.current.data).toBe('d1');
    expect(result.current.loading).toBe(false);
    await flush();
    expect(result.current.data).toBe('d2');
  });

  it('keepPrevious: false drops the old data and error while the new key loads', async () => {
    let release: (v: string) => void = () => {};
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('a failed'))
      .mockImplementationOnce(() => new Promise<string>((r) => (release = r)));
    const { result, rerender } = renderHook(({ k }) => useResource<string>(k, fetcher, { keepPrevious: false }), { initialProps: { k: 'a' } });
    await flush();
    expect(result.current.error?.message).toBe('a failed');
    rerender({ k: 'b' });
    await flush();
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(true);
    await act(async () => {
      release('b-data');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toBe('b-data');
    expect(result.current.loading).toBe(false);
  });

  it('refreshing clears when disabled mid-fetch', async () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const { result, rerender } = renderHook(({ en }) => useResource('k', fetcher, { enabled: en }), { initialProps: { en: true } });
    await flush();
    expect(result.current.refreshing).toBe(true);
    rerender({ en: false });
    await flush();
    expect(result.current.refreshing).toBe(false);
  });

  it('polls on intervalMs and goes stale after 3 missed intervals', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce('a').mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useResource('k', fetcher, { intervalMs: 1000 }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.stale).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.stale).toBe(true);
  });

  it('does not poll while hidden and refetches when visible again', async () => {
    const fetcher = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k', fetcher, { intervalMs: 1000 }));
    await flush();
    act(() => setHidden(true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => {
      setHidden(false);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('refetches on the online event', async () => {
    const fetcher = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k', fetcher));
    await flush();
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reload resolves, and mutate replaces data', async () => {
    const fetcher = vi.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useResource<number>('k', fetcher));
    await flush();
    await act(async () => {
      await expect(result.current.reload()).resolves.toBeUndefined();
    });
    act(() => result.current.mutate((p) => (p ?? 0) + 10));
    expect(result.current.data).toBe(11);
  });

  it('aborts on unmount', async () => {
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((s: AbortSignal) => {
      signal = s;
      return new Promise<string>(() => {});
    });
    const { unmount } = renderHook(() => useResource('k', fetcher));
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('does not fetch when the key is null or enabled is false', async () => {
    const fetcher = vi.fn().mockResolvedValue('x');
    const a = renderHook(() => useResource(null, fetcher));
    const b = renderHook(() => useResource('k', fetcher, { enabled: false }));
    await flush();
    expect(fetcher).not.toHaveBeenCalled();
    expect(a.result.current.loading).toBe(false);
    expect(b.result.current.loading).toBe(false);
  });
});
