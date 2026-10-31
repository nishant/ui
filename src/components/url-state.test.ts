import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { locationAdapter, useUrlState, type UrlStateAdapter } from './url-state';

function memoryAdapter(initial = ''): UrlStateAdapter & { search(): string } {
  let params = new URLSearchParams(initial);
  const listeners = new Set<() => void>();
  return {
    get: () => new URLSearchParams(params),
    set(next) {
      params = new URLSearchParams(next);
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    search: () => params.toString(),
  };
}

const DEFAULTS = { q: '', page: 1, onlyOpen: false, tags: [] as string[] };

afterEach(cleanup);

describe('useUrlState with a memory adapter', () => {
  it('returns defaults for an empty URL', () => {
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: memoryAdapter() }));
    expect(result.current[0]).toEqual(DEFAULTS);
  });

  it('parses each type', () => {
    const a = memoryAdapter('q=rust&page=3&onlyOpen=1&tags=a&tags=b');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    expect(result.current[0]).toEqual({ q: 'rust', page: 3, onlyOpen: true, tags: ['a', 'b'] });
  });

  it('accepts a comma-separated array, true/false booleans and falls back on bad numbers', () => {
    const a = memoryAdapter('tags=a,b,c&onlyOpen=true&page=abc');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    expect(result.current[0]).toEqual({ q: '', page: 1, onlyOpen: true, tags: ['a', 'b', 'c'] });
    const b = memoryAdapter('onlyOpen=maybe&page=');
    const r2 = renderHook(() => useUrlState(DEFAULTS, { adapter: b }));
    expect(r2.result.current[0].onlyOpen).toBe(false);
    expect(r2.result.current[0].page).toBe(1);
  });

  it('round-trips array values that contain a comma', () => {
    const a = memoryAdapter();
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    act(() => result.current[1]({ tags: ['Austin, TX'] }));
    expect(result.current[0].tags).toEqual(['Austin, TX']);
    act(() => result.current[1]({ tags: ['Austin, TX', 'Remote'] }));
    expect(result.current[0].tags).toEqual(['Austin, TX', 'Remote']);
  });

  it('serializes each type: arrays as repeated keys, booleans as 1/0', () => {
    const a = memoryAdapter();
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    act(() => result.current[1]({ q: 'x y', page: 2, onlyOpen: true, tags: ['a', 'b'] }));
    const p = new URLSearchParams(a.search());
    expect(p.get('q')).toBe('x y');
    expect(p.get('page')).toBe('2');
    expect(p.get('onlyOpen')).toBe('1');
    expect(p.getAll('tags')).toEqual(['a', 'b']);
    expect(result.current[0]).toEqual({ q: 'x y', page: 2, onlyOpen: true, tags: ['a', 'b'] });
  });

  it('omits values equal to the default', () => {
    const a = memoryAdapter('q=x&page=2&onlyOpen=1&tags=a');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    act(() => result.current[1]({ q: '', page: 1, onlyOpen: false, tags: [] }));
    expect(a.search()).toBe('');
  });

  it('keeps an explicitly empty value when the default is not empty', () => {
    const a = memoryAdapter();
    const d = { status: ['open'], sort: 'new' };
    const { result } = renderHook(() => useUrlState(d, { adapter: a }));
    act(() => result.current[1]({ status: [], sort: '' }));
    expect(result.current[0]).toEqual({ status: [], sort: '' });
  });

  it('applies a functional patch to the latest state', () => {
    const a = memoryAdapter('page=2');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    act(() => {
      result.current[1]((prev) => ({ page: prev.page + 1 }));
      result.current[1]((prev) => ({ page: prev.page + 1 }));
    });
    expect(result.current[0].page).toBe(4);
  });

  it('namespaces keys with prefix and leaves other keys alone', () => {
    const a = memoryAdapter('q=other&k.q=old');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a, prefix: 'k' }));
    expect(result.current[0].q).toBe('old');
    act(() => result.current[1]({ q: 'new' }));
    const p = new URLSearchParams(a.search());
    expect(p.get('k.q')).toBe('new');
    expect(p.get('q')).toBe('other');
  });

  it('preserves unknown keys', () => {
    const a = memoryAdapter('utm=1&q=a');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    act(() => result.current[1]({ q: 'b' }));
    expect(new URLSearchParams(a.search()).get('utm')).toBe('1');
    act(() => result.current[2]());
    expect(a.search()).toBe('utm=1');
    expect(result.current[0]).toEqual(DEFAULTS);
  });

  it('keeps the snapshot stable between renders', () => {
    const a = memoryAdapter('q=a');
    const { result, rerender } = renderHook(() => useUrlState({ q: '', page: 1 }, { adapter: a }));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });
});

describe('locationAdapter', () => {
  beforeEach(() => {
    history.replaceState({ keep: 'me' }, '', '/jobs?utm=1#/section');
  });

  it('writes the query with replaceState, keeping the hash and history.state', () => {
    const { result } = renderHook(() => useUrlState(DEFAULTS));
    const length = history.length;
    act(() => result.current[1]({ q: 'rust' }));
    expect(location.search).toBe('?utm=1&q=rust');
    expect(location.hash).toBe('#/section');
    expect(location.pathname).toBe('/jobs');
    expect(history.state).toEqual({ keep: 'me' });
    expect(history.length).toBe(length);
    expect(result.current[0].q).toBe('rust');
  });

  it('removes the question mark when the query empties', () => {
    history.replaceState(null, '', '/jobs?q=a#/x');
    const { result } = renderHook(() => useUrlState(DEFAULTS));
    act(() => result.current[2]());
    expect(location.search).toBe('');
    expect(location.pathname + location.hash).toBe('/jobs#/x');
  });

  it('follows popstate', () => {
    const { result } = renderHook(() => useUrlState(DEFAULTS));
    expect(result.current[0].q).toBe('');
    act(() => {
      history.replaceState(null, '', '/jobs?q=back');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current[0].q).toBe('back');
  });

  it('notifies subscribers after set and stops after unsubscribe', () => {
    let calls = 0;
    const off = locationAdapter.subscribe(() => calls++);
    locationAdapter.set(new URLSearchParams('a=1'));
    expect(calls).toBe(1);
    off();
    locationAdapter.set(new URLSearchParams('a=2'));
    expect(calls).toBe(1);
  });
});
