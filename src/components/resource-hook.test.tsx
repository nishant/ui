import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApi, useResource } from './resource';

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });
}

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useResource: sharing, back-off and mutate', () => {
  const fetchMock = vi.fn();
  const flush = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
  const advance = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    configureApi({ baseUrl: '', onUnauthorized: undefined, headers: undefined, headersFor: undefined });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('two hooks with the same key share one request', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({ n: 1 })));
    const a = renderHook(() => useResource<{ n: number }>('/api/same'));
    const b = renderHook(() => useResource<{ n: number }>('/api/same'));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.result.current.data).toEqual({ n: 1 });
    expect(b.result.current.data).toEqual({ n: 1 });
  });

  it('stops loading when the response is a 204 with no body', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const a = renderHook(() => useResource('/api/empty'));
    expect(a.result.current.loading).toBe(true);
    await flush();
    expect(a.result.current.data).toBeUndefined();
    expect(a.result.current.loading).toBe(false);
  });

  it('different keys do not share', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    renderHook(() => useResource('/api/one'));
    renderHook(() => useResource('/api/two'));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('the same fetcher function is shared; different fetchers are not', async () => {
    const f = vi.fn().mockResolvedValue('x');
    const g = vi.fn().mockResolvedValue('y');
    renderHook(() => useResource('k', f));
    renderHook(() => useResource('k', f));
    renderHook(() => useResource('k', g));
    await flush();
    expect(f).toHaveBeenCalledTimes(1);
    expect(g).toHaveBeenCalledTimes(1);
  });

  it('a shared request is aborted only when the last hook lets go', async () => {
    let signal!: AbortSignal;
    const f = vi.fn((s: AbortSignal) => {
      signal = s;
      return new Promise<string>(() => undefined);
    });
    const a = renderHook(() => useResource('k', f));
    const b = renderHook(() => useResource('k', f));
    await flush();
    a.unmount();
    expect(signal.aborted).toBe(false);
    b.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('reload starts its own request even when one is running', async () => {
    let n = 0;
    const f = vi.fn(() => Promise.resolve(`v${++n}`));
    const { result } = renderHook(() => useResource('k', f));
    await flush();
    await act(async () => {
      await result.current.reload();
    });
    expect(f).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe('v2');
  });

  it('a failed shared request fails every hook that joined it', async () => {
    const f = vi.fn().mockRejectedValue(new Error('down'));
    const a = renderHook(() => useResource('k', f));
    const b = renderHook(() => useResource('k', f));
    await flush();
    expect(f).toHaveBeenCalledTimes(1);
    expect(a.result.current.error?.message).toBe('down');
    expect(b.result.current.error?.message).toBe('down');
  });

  it('polling backs off x2 per failure with jitter and returns to the interval after a success', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor 1.0
    const f = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValueOnce('ok')
      .mockResolvedValue('ok');
    renderHook(() => useResource('k', f, { intervalMs: 1000 }));
    await flush();
    expect(f).toHaveBeenCalledTimes(1); // failed once: next poll in 2000
    await advance(1999);
    expect(f).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(f).toHaveBeenCalledTimes(2); // failed twice: next poll in 4000
    await advance(3999);
    expect(f).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(f).toHaveBeenCalledTimes(3); // succeeded: back to 1000
    await advance(1000);
    expect(f).toHaveBeenCalledTimes(4);
  });

  it('the back-off never waits more than 5 minutes, and jitter stays within 10%', async () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const f = vi.fn().mockRejectedValue(new Error('down'));
    renderHook(() => useResource('k', f, { intervalMs: 200_000 }));
    await flush();
    expect(f).toHaveBeenCalledTimes(1); // 200000 * 2 is capped to 300000; jitter cannot pass the cap
    await advance(299_999);
    expect(f).toHaveBeenCalledTimes(1);
    rnd.mockReturnValue(0);
    await advance(1);
    expect(f).toHaveBeenCalledTimes(2);
    f.mockClear();
    // After the second failure the wait is 300000 * 0.9 = 270000 at the lowest jitter.
    await advance(269_999);
    expect(f).toHaveBeenCalledTimes(0);
    await advance(1);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('mutate is not overwritten by a response requested before it', async () => {
    let release!: (v: string) => void;
    const f = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(() => new Promise<string>((r) => (release = r)));
    const { result } = renderHook(() => useResource<string>('k', f));
    await flush();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.reload();
    });
    act(() => result.current.mutate('optimistic'));
    await act(async () => {
      release('stale-from-server');
      await pending;
    });
    expect(result.current.data).toBe('optimistic');
    expect(result.current.refreshing).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('a reload after a mutate does replace the data', async () => {
    const f = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    const { result } = renderHook(() => useResource<string>('k', f));
    await flush();
    act(() => result.current.mutate((p) => `${p}!`));
    expect(result.current.data).toBe('a!');
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.data).toBe('b');
  });

  it('ignores a slow response for an old key', async () => {
    const resolvers: Record<string, (v: string) => void> = {};
    const byKey = (k: string) => () => new Promise<string>((r) => (resolvers[k] = r));
    const { result, rerender } = renderHook(({ k }) => useResource<string>(k, byKey(k), { keepPrevious: false }), {
      initialProps: { k: 'a' },
    });
    await flush();
    rerender({ k: 'b' });
    await flush();
    await act(async () => {
      resolvers.a('from-a');
      resolvers.b('from-b');
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data).toBe('from-b');
  });

  it('refetchOnVisible: the away boundary, 0 means always, false means never', async () => {
    const f = vi.fn().mockResolvedValue('x');
    const first = renderHook(() => useResource('k', f, { refetchOnVisible: 5000 }));
    await flush();
    setHidden(true);
    await advance(4999);
    setHidden(false);
    await flush();
    expect(f).toHaveBeenCalledTimes(1);
    setHidden(true);
    await advance(5000);
    setHidden(false);
    await flush();
    expect(f).toHaveBeenCalledTimes(2);
    first.unmount();

    const g = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k2', g, { refetchOnVisible: 0 }));
    await flush();
    setHidden(true);
    setHidden(false);
    await flush();
    expect(g).toHaveBeenCalledTimes(2);

    const h = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k3', h, { refetchOnVisible: false }));
    await flush();
    setHidden(true);
    await advance(600_000);
    setHidden(false);
    await flush();
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('refetchOnReconnect: false ignores the online event', async () => {
    const f = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k', f, { refetchOnReconnect: false }));
    await flush();
    window.dispatchEvent(new Event('online'));
    await flush();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('a poll that fires while the tab is hidden is made up when it shows again', async () => {
    const f = vi.fn().mockResolvedValue('x');
    renderHook(() => useResource('k', f, { intervalMs: 1000, refetchOnVisible: false }));
    await flush();
    setHidden(true);
    await advance(1500);
    expect(f).toHaveBeenCalledTimes(1);
    setHidden(false);
    await flush();
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('stale is false without an interval, however long ago the data loaded', async () => {
    const f = vi.fn().mockResolvedValue('x');
    const { result } = renderHook(() => useResource('k', f));
    await flush();
    await advance(10 * 60_000);
    expect(result.current.stale).toBe(false);
  });

  it('stale turns on after more than three intervals without a new success', async () => {
    const f = vi.fn().mockResolvedValue('x');
    const { result } = renderHook(() => useResource('k', f, { intervalMs: 1000 }));
    await flush();
    expect(result.current.stale).toBe(false);
    f.mockImplementation(() => new Promise(() => undefined));
    await advance(3000);
    expect(result.current.stale).toBe(false);
    await advance(2000);
    expect(result.current.stale).toBe(true);
  });

  it('initialData is shown before the first load', async () => {
    const f = vi.fn().mockResolvedValue('loaded');
    const { result } = renderHook(() => useResource('k', f, { initialData: 'seed' }));
    expect(result.current.data).toBe('seed');
    expect(result.current.loading).toBe(false);
    await flush();
    expect(result.current.data).toBe('loaded');
  });

  it('a null key never fetches and is not loading', async () => {
    const f = vi.fn().mockResolvedValue('x');
    const { result } = renderHook(() => useResource(null, f));
    await flush();
    expect(f).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
