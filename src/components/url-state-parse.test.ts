import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const DEFAULTS = { q: 'dflt', page: 1, onlyOpen: true, tags: [] as string[] };
const read = (search: string, defaults: Record<string, string | number | boolean | string[]> = DEFAULTS, o = {}) =>
  renderHook(() => useUrlState(defaults, { adapter: memoryAdapter(search), ...o })).result.current[0];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useUrlState: malformed and edge values', () => {
  it('a missing key gives the default; a present empty string key gives the empty string', () => {
    expect(read('').q).toBe('dflt');
    expect(read('q=').q).toBe('');
  });

  it('numbers: junk, empty, whitespace, Infinity and NaN fall back; negatives and decimals parse', () => {
    expect(read('page=abc').page).toBe(1);
    expect(read('page=').page).toBe(1);
    expect(read('page=%20%20').page).toBe(1);
    expect(read('page=Infinity').page).toBe(1);
    expect(read('page=-Infinity').page).toBe(1);
    expect(read('page=NaN').page).toBe(1);
    expect(read('page=-4').page).toBe(-4);
    expect(read('page=2.5').page).toBe(2.5);
    expect(read('page=0').page).toBe(0);
    expect(read('page=%202%20').page).toBe(2);
  });

  it('booleans: only 1/true and 0/false count; anything else keeps the default (true here)', () => {
    expect(read('onlyOpen=1').onlyOpen).toBe(true);
    expect(read('onlyOpen=true').onlyOpen).toBe(true);
    expect(read('onlyOpen=0').onlyOpen).toBe(false);
    expect(read('onlyOpen=false').onlyOpen).toBe(false);
    expect(read('onlyOpen=yes').onlyOpen).toBe(true);
    expect(read('onlyOpen=').onlyOpen).toBe(true);
    expect(read('onlyOpen=TRUE').onlyOpen).toBe(true);
  });

  it('a boolean default of false stays false for junk and turns true for 1', () => {
    expect(read('f=maybe', { f: false }).f).toBe(false);
    expect(read('f=1', { f: false }).f).toBe(true);
  });

  it('survives broken percent escapes and odd characters', () => {
    expect(read('q=%E0%A4%A&page=%ZZ').q).toBeTypeOf('string');
    expect(read('q=%E0%A4%A&page=%ZZ').page).toBe(1);
    expect(read('q=a%26b%3Dc').q).toBe('a&b=c');
    expect(read('q=%F0%9F%98%80').q).toBe('😀');
  });

  it('a repeated scalar key reads the first value', () => {
    expect(read('q=one&q=two').q).toBe('one');
  });

  it('arrays: repeated keys as written, empty entries dropped, a lone comma value kept whole', () => {
    expect(read('tags=a&tags=&tags=b').tags).toEqual(['a', 'b']);
    expect(read('tags=').tags).toEqual([]);
    expect(read('tags=a,b').tags).toEqual(['a,b']);
  });

  it('comma mode splits one value on commas and drops empty parts', () => {
    expect(read('tags=a,,b', DEFAULTS, { comma: true }).tags).toEqual(['a', 'b']);
    expect(read('tags=a&tags=b,c', DEFAULTS, { comma: true }).tags).toEqual(['a', 'b,c']);
    expect(read('tags=solo', DEFAULTS, { comma: true }).tags).toEqual(['solo']);
  });

  it('a key that is not in the defaults is never read or written', () => {
    const a = memoryAdapter('utm=1');
    const { result } = renderHook(() => useUrlState(DEFAULTS, { adapter: a }));
    expect(Object.keys(result.current[0]).sort()).toEqual(['onlyOpen', 'page', 'q', 'tags']);
    act(() => (result.current[1] as (p: Record<string, unknown>) => void)({ nope: 'x', q: 'y' }));
    expect(new URLSearchParams(a.search()).has('nope')).toBe(false);
    expect(new URLSearchParams(a.search()).get('q')).toBe('y');
  });

  it('an array equal to the default is omitted; one that differs in length or order is written', () => {
    const d = { tags: ['a', 'b'] };
    const a = memoryAdapter();
    const { result } = renderHook(() => useUrlState(d, { adapter: a }));
    act(() => result.current[1]({ tags: ['a', 'b'] }));
    expect(a.search()).toBe('');
    act(() => result.current[1]({ tags: ['b', 'a'] }));
    expect(new URLSearchParams(a.search()).getAll('tags')).toEqual(['b', 'a']);
    act(() => result.current[1]({ tags: ['a'] }));
    expect(new URLSearchParams(a.search()).getAll('tags')).toEqual(['a']);
  });

  it('an empty array is written as an empty key when the default is not empty', () => {
    const a = memoryAdapter();
    const { result } = renderHook(() => useUrlState({ tags: ['x'] }, { adapter: a }));
    act(() => result.current[1]({ tags: [] }));
    expect(a.search()).toBe('tags=');
    expect(result.current[0].tags).toEqual([]);
  });

  it('a lone comma value in comma mode gets an empty marker key so it is not split on read', () => {
    const a = memoryAdapter();
    const { result } = renderHook(() => useUrlState({ tags: [] as string[] }, { adapter: a, comma: ['tags'] }));
    act(() => result.current[1]({ tags: ['Austin, TX'] }));
    expect(new URLSearchParams(a.search()).getAll('tags')).toEqual(['Austin, TX', '']);
    expect(result.current[0].tags).toEqual(['Austin, TX']);
  });

  it('an inline defaults object does not re-parse or change the returned state identity', () => {
    const a = memoryAdapter('q=a');
    const { result, rerender } = renderHook(() => useUrlState({ q: '' }, { adapter: a }));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });
});

describe('locationAdapter outside a browser or with a refusing history', () => {
  it('replaceState that throws leaves the state alone and does not notify', () => {
    const spy = vi.spyOn(history, 'replaceState').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    let calls = 0;
    const off = locationAdapter.subscribe(() => calls++);
    expect(() => locationAdapter.set(new URLSearchParams('a=1'))).not.toThrow();
    expect(calls).toBe(0);
    off();
    spy.mockRestore();
  });

  it('get returns the query of the page', () => {
    history.replaceState(null, '', '/x?a=1&b=2');
    expect(locationAdapter.get().get('b')).toBe('2');
  });

  it('with no window, get is empty, set does nothing and subscribe returns a no-op', () => {
    vi.stubGlobal('location', undefined);
    vi.stubGlobal('history', undefined);
    vi.stubGlobal('window', undefined);
    try {
      expect(locationAdapter.get().toString()).toBe('');
      expect(() => locationAdapter.set(new URLSearchParams('a=1'))).not.toThrow();
      const off = locationAdapter.subscribe(() => undefined);
      expect(typeof off).toBe('function');
      expect(() => off()).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
