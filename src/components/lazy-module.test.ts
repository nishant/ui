import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyModule, preloadWhenIdle, useLazyModule } from './lazy-module';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('lazyModule', () => {
  it('has no module before load and the module after', async () => {
    const m = lazyModule(() => Promise.resolve({ x: 1 }));
    expect(m.current()).toBeNull();
    const loaded = await m.load();
    expect(loaded).toEqual({ x: 1 });
    expect(m.current()).toBe(loaded);
  });

  it('shares one import between two load calls', async () => {
    const importer = vi.fn(() => Promise.resolve({ x: 1 }));
    const m = lazyModule(importer);
    const [a, b] = await Promise.all([m.load(), m.load()]);
    expect(a).toBe(b);
    await m.load();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('rejects when the import fails and imports again on the next load', async () => {
    const importer = vi.fn<() => Promise<{ x: number }>>().mockRejectedValueOnce(new Error('chunk')).mockResolvedValue({ x: 2 });
    const m = lazyModule(importer);
    await expect(m.load()).rejects.toThrow('chunk');
    expect(m.current()).toBeNull();
    await expect(m.load()).resolves.toEqual({ x: 2 });
    expect(importer).toHaveBeenCalledTimes(2);
  });
});

describe('useLazyModule', () => {
  it('returns null, then the module once it has loaded', async () => {
    const m = lazyModule(() => Promise.resolve({ x: 3 }));
    const { result } = renderHook(() => useLazyModule(m, true));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual({ x: 3 }));
  });

  it('does not load while when is false', async () => {
    const importer = vi.fn(() => Promise.resolve({ x: 3 }));
    const m = lazyModule(importer);
    const { result, rerender } = renderHook(({ when }) => useLazyModule(m, when), { initialProps: { when: false } });
    expect(importer).not.toHaveBeenCalled();
    rerender({ when: true });
    await waitFor(() => expect(result.current).toEqual({ x: 3 }));
  });

  it('calls onError when the load fails', async () => {
    const m = lazyModule(() => Promise.reject(new Error('offline')));
    const onError = vi.fn();
    const { result } = renderHook(() => useLazyModule(m, true, onError));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(result.current).toBeNull();
  });
});

describe('preloadWhenIdle', () => {
  it('calls the importer after 1.5 s without requestIdleCallback', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const importer = vi.fn(() => Promise.resolve({}));
    preloadWhenIdle(lazyModule(importer));
    vi.advanceTimersByTime(1499);
    expect(importer).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('cancels the wait with the returned cleanup', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const importer = vi.fn(() => Promise.resolve({}));
    const cancel = preloadWhenIdle(lazyModule(importer));
    cancel();
    vi.advanceTimersByTime(5000);
    expect(importer).not.toHaveBeenCalled();
  });

  it('uses requestIdleCallback when it exists, and does nothing once loaded', async () => {
    const idle = vi.fn((cb: () => void) => {
      cb();
      return 7;
    });
    const cancelIdle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const importer = vi.fn(() => Promise.resolve({}));
    const m = lazyModule(importer);
    const cancel = preloadWhenIdle(m);
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    expect(importer).toHaveBeenCalledTimes(1);
    cancel();
    expect(cancelIdle).toHaveBeenCalledWith(7);
    await m.load();
    preloadWhenIdle(m)();
    expect(idle).toHaveBeenCalledTimes(1);
  });
});
