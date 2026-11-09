import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './resource-classes';
import { configureApi, useResource } from './resource';
import { useUrlState } from './url-state';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('UI-248: useUrlState with a class-based adapter', () => {
  it('subscribes through the adapter so `this` works', () => {
    class ClassAdapter {
      params = new URLSearchParams('q=hi');
      listeners = new Set<() => void>();
      get() {
        return new URLSearchParams(this.params);
      }
      set(next: URLSearchParams) {
        this.params = new URLSearchParams(next);
        this.listeners.forEach((l) => l());
      }
      subscribe(l: () => void) {
        this.listeners.add(l);
        return () => {
          this.listeners.delete(l);
        };
      }
    }
    const adapter = new ClassAdapter();
    const { result } = renderHook(() => useUrlState({ q: '' }, { adapter }));
    expect(result.current[0].q).toBe('hi');
    act(() => result.current[1]({ q: 'there' }));
    expect(result.current[0].q).toBe('there');
  });
});

describe('UI-225: reload while disabled', () => {
  beforeEach(() => configureApi({ baseUrl: '', onUnauthorized: undefined, headers: undefined, headersFor: undefined }));
  it('does not call the fetcher', async () => {
    const fetcher = vi.fn(() => Promise.resolve(1));
    const { result } = renderHook(() => useResource('/api/x', fetcher, { enabled: false }));
    await act(async () => {
      result.current.reload();
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('UI-224: ReadableStream body', () => {
  it('passes the stream through unchanged with duplex half', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })));
    vi.stubGlobal('fetch', fetchMock);
    const stream = new ReadableStream();
    await apiFetch('/api/up', { method: 'POST', body: stream });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit & { duplex?: string }])[1];
    expect(init.body).toBe(stream);
    expect(init.duplex).toBe('half');
    expect(new Headers(init.headers).has('content-type')).toBe(false);
  });
});
