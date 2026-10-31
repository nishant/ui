import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BREAKPOINTS, NARROW_QUERY, PHONE_QUERY, useBreakpoint, useNarrow, usePhone } from './hooks';

let width = 1200;
const listeners = new Set<() => void>();

function matches(q: string): boolean {
  const max = /max-width:\s*([\d.]+)px/.exec(q);
  if (max) return width <= Number(max[1]);
  const min = /min-width:\s*([\d.]+)px/.exec(q);
  return min ? width >= Number(min[1]) : false;
}

beforeEach(() => {
  listeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches(query);
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  width = 1200;
});

function resize(w: number) {
  width = w;
  act(() => listeners.forEach((fn) => fn()));
}

describe('breakpoints', () => {
  it('exposes the Tailwind widths and queries', () => {
    expect(BREAKPOINTS).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 });
    expect(PHONE_QUERY).toBe('(max-width: 639.98px)');
    expect(NARROW_QUERY).toBe('(max-width: 767.98px)');
  });

  it('usePhone is true below 640px only', () => {
    width = 360;
    const { result } = renderHook(() => usePhone());
    expect(result.current).toBe(true);
    resize(640);
    expect(result.current).toBe(false);
  });

  it('useNarrow is true below 768px only', () => {
    width = 700;
    const { result } = renderHook(() => useNarrow());
    expect(result.current).toBe(true);
    resize(768);
    expect(result.current).toBe(false);
  });

  it('useBreakpoint still returns the largest reached breakpoint', () => {
    width = 360;
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('base');
    resize(840);
    expect(result.current).toBe('md');
    resize(1300);
    expect(result.current).toBe('xl');
  });
});
