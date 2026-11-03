import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BREAKPOINTS,
  NARROW_QUERY,
  PHONE_QUERY,
  RelativeTime,
  useBreakpoint,
  useDocumentTitle,
  useLocalStorage,
  useMediaQuery,
  useNarrow,
  useNow,
  usePhone,
} from './hooks';
import { NishProvider } from './provider';

let width = 1200;
let listeners = new Map<string, Set<() => void>>();
let matchMediaCalls = 0;

function matches(q: string): boolean {
  const max = /max-width:\s*([\d.]+)px/.exec(q);
  if (max) return width <= Number(max[1]);
  const min = /min-width:\s*([\d.]+)px/.exec(q);
  return min ? width >= Number(min[1]) : false;
}

function listenerCount(): number {
  let n = 0;
  listeners.forEach((s) => (n += s.size));
  return n;
}

beforeEach(() => {
  listeners = new Map();
  matchMediaCalls = 0;
  window.matchMedia = ((query: string) => {
    matchMediaCalls++;
    return {
      get matches() {
        return matches(query);
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)!.add(fn);
      },
      removeEventListener: (_: string, fn: () => void) => listeners.get(query)?.delete(fn),
    };
  }) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  width = 1200;
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function resize(w: number) {
  width = w;
  act(() => listeners.forEach((set) => set.forEach((fn) => fn())));
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

  it('useBreakpoint returns the largest reached breakpoint at every edge', () => {
    width = 360;
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('base');
    resize(640);
    expect(result.current).toBe('sm');
    resize(767);
    expect(result.current).toBe('sm');
    resize(840);
    expect(result.current).toBe('md');
    resize(1024);
    expect(result.current).toBe('lg');
    resize(1300);
    expect(result.current).toBe('xl');
  });

  it('useBreakpoint removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useBreakpoint());
    expect(listenerCount()).toBeGreaterThan(0);
    unmount();
    expect(listenerCount()).toBe(0);
  });
});

describe('useMediaQuery', () => {
  it('follows the query', () => {
    width = 500;
    const { result } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(true);
    resize(700);
    expect(result.current).toBe(false);
  });

  it('shares one MediaQueryList and one listener per query', () => {
    width = 500;
    const q = '(max-width: 600px)';
    const a = renderHook(() => useMediaQuery(q));
    const b = renderHook(() => useMediaQuery(q));
    const c = renderHook(() => useMediaQuery(q));
    expect(matchMediaCalls).toBe(1);
    expect(listeners.get(q)?.size).toBe(1);
    resize(700);
    expect([a, b, c].map((h) => h.result.current)).toEqual([false, false, false]);
    a.unmount();
    expect(listeners.get(q)?.size).toBe(1);
    b.unmount();
    c.unmount();
    expect(listeners.get(q)?.size).toBe(0);
  });

  it('removes the listener on unmount and works again after remount', () => {
    const q = '(max-width: 600px)';
    const first = renderHook(() => useMediaQuery(q));
    first.unmount();
    expect(listenerCount()).toBe(0);
    width = 400;
    const second = renderHook(() => useMediaQuery(q));
    expect(second.result.current).toBe(true);
    expect(listeners.get(q)?.size).toBe(1);
  });

  it('does not call matchMedia during render', () => {
    const calls: number[] = [];
    function Probe() {
      const before = matchMediaCalls;
      useMediaQuery('(max-width: 600px)');
      calls.push(matchMediaCalls - before);
      return null;
    }
    render(<Probe />);
    expect(calls[0]).toBe(0);
  });

  it('is false on the server and in the first hydration render', () => {
    width = 300;
    function Probe() {
      return <span>{String(useMediaQuery('(max-width: 600px)'))}</span>;
    }
    expect(renderToString(<Probe />)).toContain('false');
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe />);
    document.body.appendChild(container);
    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    act(() => {
      root = hydrateRoot(container, <Probe />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe('true');
    act(() => root.unmount());
    container.remove();
  });

  it('is false without matchMedia', () => {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    const { result } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(false);
    const bp = renderHook(() => useBreakpoint());
    expect(bp.result.current).toBe('base');
  });
});

describe('useDocumentTitle', () => {
  it('sets "title · app" and restores on unmount', () => {
    document.title = 'before';
    const { unmount } = renderHook(() => useDocumentTitle('Inbox', { app: 'mail' }));
    expect(document.title).toBe('Inbox · mail');
    unmount();
    expect(document.title).toBe('before');
  });

  it('handles title only, app only and neither', () => {
    document.title = 'before';
    renderHook(() => useDocumentTitle('Only'));
    expect(document.title).toBe('Only');
    cleanup();
    renderHook(() => useDocumentTitle(undefined, { app: 'App' }));
    expect(document.title).toBe('App');
    cleanup();
    document.title = 'keep';
    renderHook(() => useDocumentTitle(undefined));
    expect(document.title).toBe('keep');
  });
});

describe('useNow', () => {
  it('ticks on the interval and stops on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    const { result, unmount } = renderHook(() => useNow(1000));
    const start = result.current;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current - start).toBe(3000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses while the tab is hidden and refreshes when it returns', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    const vis = vi.spyOn(document, 'visibilityState', 'get');
    const { result } = renderHook(() => useNow(1000));
    const start = result.current;
    vis.mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(Date.now() + 60_000);
    vis.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current - start).toBe(60_000);
    expect(vi.getTimerCount()).toBe(1);
  });
});

describe('useLocalStorage', () => {
  it('returns the initial value, then writes JSON', () => {
    const { result } = renderHook(() => useLocalStorage('k', { n: 1 }));
    expect(result.current[0]).toEqual({ n: 1 });
    act(() => result.current[1]({ n: 2 }));
    expect(result.current[0]).toEqual({ n: 2 });
    expect(window.localStorage.getItem('k')).toBe('{"n":2}');
  });

  it('reads an existing value', () => {
    window.localStorage.setItem('k', '5');
    const { result } = renderHook(() => useLocalStorage('k', 0));
    expect(result.current[0]).toBe(5);
  });

  it('supports the functional updater', () => {
    const { result } = renderHook(() => useLocalStorage('k', 1));
    act(() => result.current[1]((n) => n + 1));
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(3);
  });

  it('stores the raw string with { raw: true }', () => {
    window.localStorage.setItem('k', 'hello');
    const { result } = renderHook(() => useLocalStorage('k', '', { raw: true }));
    expect(result.current[0]).toBe('hello');
    act(() => result.current[1]('world'));
    expect(window.localStorage.getItem('k')).toBe('world');
  });

  it('keeps the same object identity until the stored text changes', () => {
    window.localStorage.setItem('k', '{"a":1}');
    const { result, rerender } = renderHook(() => useLocalStorage('k', { a: 0 }));
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
  });

  it('returns the initial value for corrupted JSON and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem('bad', '{oops');
    const { result } = renderHook(() => useLocalStorage('bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"bad"');
  });

  it('falls back to the initial value when reads throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useLocalStorage('k', 7));
    expect(result.current[0]).toBe(7);
  });

  it('keeps the value in memory when writes throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useLocalStorage('mem', 1));
    act(() => result.current[1](9));
    expect(result.current[0]).toBe(9);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(10);
  });

  it('syncs two hooks on the same key in one tab', () => {
    const a = renderHook(() => useLocalStorage('shared', 'x', { raw: true }));
    const b = renderHook(() => useLocalStorage('shared', 'x', { raw: true }));
    act(() => a.result.current[1]('y'));
    expect(b.result.current[0]).toBe('y');
    expect(a.result.current[0]).toBe('y');
  });

  it('does not notify other keys', () => {
    let renders = 0;
    renderHook(() => {
      renders++;
      return useLocalStorage('one', 0);
    });
    const other = renderHook(() => useLocalStorage('two', 0));
    const before = renders;
    act(() => other.result.current[1](4));
    expect(renders).toBe(before);
  });

  it('follows storage events from another tab, including clear', () => {
    const { result } = renderHook(() => useLocalStorage('tab', 'init', { raw: true }));
    act(() => {
      window.localStorage.setItem('tab', 'other');
      window.dispatchEvent(new StorageEvent('storage', { key: 'tab', newValue: 'other' }));
    });
    expect(result.current[0]).toBe('other');
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(result.current[0]).toBe('init');
  });

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage('mine', 'a', { raw: true }));
    act(() => {
      window.localStorage.setItem('theirs', 'b');
      window.dispatchEvent(new StorageEvent('storage', { key: 'theirs' }));
    });
    expect(result.current[0]).toBe('a');
  });

  it('removes the window listener when the last hook unmounts', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const a = renderHook(() => useLocalStorage('l', 0));
    const b = renderHook(() => useLocalStorage('m', 0));
    expect(add.mock.calls.filter((c) => c[0] === 'storage')).toHaveLength(1);
    a.unmount();
    expect(remove.mock.calls.filter((c) => c[0] === 'storage')).toHaveLength(0);
    b.unmount();
    expect(remove.mock.calls.filter((c) => c[0] === 'storage')).toHaveLength(1);
  });

  it('server render uses the initial value and hydrates without errors', () => {
    window.localStorage.setItem('hy', '"stored"');
    function Probe() {
      const [v] = useLocalStorage('hy', 'initial');
      return <span>{v}</span>;
    }
    const html = renderToString(<Probe />);
    expect(html).toContain('initial');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    act(() => {
      root = hydrateRoot(container, <Probe />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe('stored');
    act(() => root.unmount());
    container.remove();
  });
});

describe('RelativeTime', () => {
  const base = new Date('2026-10-28T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(base);
  });

  it('renders a <time> with the iso dateTime, title and short text', () => {
    render(<RelativeTime value={base - 180_000} />);
    const el = screen.getByText('3m ago');
    expect(el.tagName).toBe('TIME');
    expect(el.getAttribute('datetime')).toBe(new Date(base - 180_000).toISOString());
    expect(el.getAttribute('title')).toMatch(/Oct 28/);
    expect(el.className).toContain('tabular-nums');
  });

  it('supports the long style', () => {
    render(<RelativeTime value={base - 180_000} style="long" />);
    expect(screen.getByText('3 minutes ago')).toBeTruthy();
  });

  it('shows an en dash and no dateTime for an invalid value', () => {
    render(<RelativeTime value="nope" />);
    const el = screen.getByText('–');
    expect(el.getAttribute('datetime')).toBeNull();
  });

  it('merges className, forwards ref and passes rest props', () => {
    const ref = createRef<HTMLTimeElement>();
    render(<RelativeTime ref={ref} value={base} className="extra" data-x="1" id="t" aria-label="when" />);
    expect(ref.current?.tagName).toBe('TIME');
    expect(ref.current?.className).toBe('tabular-nums extra');
    expect(ref.current?.getAttribute('data-x')).toBe('1');
    expect(ref.current?.id).toBe('t');
    expect(ref.current?.getAttribute('aria-label')).toBe('when');
  });

  it('updates every refreshMs', () => {
    render(<RelativeTime value={base} refreshMs={10_000} />);
    expect(screen.getByText('just now')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('1m ago')).toBeTruthy();
  });

  it('uses the locale prop, then the provider locale, then en-US', () => {
    const { rerender } = render(<RelativeTime value={base - 180_000} style="long" locale="fr-FR" />);
    expect(screen.getByText('il y a 3 minutes')).toBeTruthy();
    rerender(
      <NishProvider locale="de-DE">
        <RelativeTime value={base - 180_000} style="long" />
      </NishProvider>,
    );
    expect(screen.getByText('vor 3 Minuten')).toBeTruthy();
    rerender(
      <NishProvider locale="de-DE">
        <RelativeTime value={base - 180_000} style="long" locale="en-US" />
      </NishProvider>,
    );
    expect(screen.getByText('3 minutes ago')).toBeTruthy();
  });
});
