import { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeightVar, useScrollEdges, useStuck } from './layout-vars';

// useHeightVar reads offsetHeight; happy-dom has no layout, so the height comes from data-h.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return Number(this.dataset.h ?? 0);
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Bar({ h, name = '--x', enabled = true }: { h: number; name?: string; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useHeightVar(ref, name, enabled);
  return <div ref={ref} data-h={h} />;
}

const value = (name = '--x') => document.documentElement.style.getPropertyValue(name);

describe('useHeightVar', () => {
  it('publishes the largest height of the bars that share a variable', () => {
    render(
      <>
        <Bar h={40} />
        <Bar h={60} />
      </>,
    );
    expect(value()).toBe('60px');
  });

  it('falls back to the other bar when the tallest unmounts, then clears when the last leaves', () => {
    const a = render(<Bar h={40} />);
    const b = render(<Bar h={60} />);
    expect(value()).toBe('60px');
    b.unmount();
    expect(value()).toBe('40px');
    a.unmount();
    expect(value()).toBe('');
  });

  it('keeps different variables apart', () => {
    render(
      <>
        <Bar h={40} name="--a" />
        <Bar h={60} name="--b" />
      </>,
    );
    expect(value('--a')).toBe('40px');
    expect(value('--b')).toBe('60px');
  });

  it('publishes nothing when disabled or when the bar measures 0', () => {
    const r = render(<Bar h={50} enabled={false} />);
    expect(value()).toBe('');
    r.unmount();
    render(<Bar h={0} />);
    expect(value()).toBe('');
  });
});

describe('useStuck', () => {
  it('returns false when disabled', () => {
    const seen: boolean[] = [];
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      seen.push(useStuck(ref, false));
      return <div ref={ref} />;
    }
    render(<Probe />);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((v) => v === false)).toBe(true);
  });
});

function Row({ dir, w = 300, cw = 100 }: { dir?: 'rtl'; w?: number; cw?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollEdges(ref);
  return <div ref={ref} data-testid="row" style={dir ? { direction: 'rtl' } : undefined} data-sw={w} data-cw={cw} />;
}

describe('useScrollEdges', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset.sw ?? 0);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset.cw ?? 0);
    });
  });

  function scrollTo(el: HTMLElement, n: number) {
    Object.defineProperty(el, 'scrollLeft', { configurable: true, value: n, writable: true });
    act(() => {
      el.dispatchEvent(new Event('scroll'));
    });
  }
  const edges = (el: HTMLElement) => [el.dataset.atStart, el.dataset.atEnd];

  it('tracks the start and end edges in LTR', () => {
    const { getByTestId } = render(<Row />);
    const el = getByTestId('row');
    expect(edges(el)).toEqual(['true', 'false']);
    scrollTo(el, 200);
    expect(edges(el)).toEqual(['false', 'true']);
    scrollTo(el, 100);
    expect(edges(el)).toEqual(['false', 'false']);
  });

  it('reports physical edges in RTL (scrollLeft runs 0 down to -max)', () => {
    const { getByTestId } = render(<Row dir="rtl" />);
    const el = getByTestId('row');
    if (getComputedStyle(el).direction !== 'rtl') {
      el.setAttribute('dir', 'rtl');
    }
    if (getComputedStyle(el).direction !== 'rtl') {
      const real = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((e: Element, p?: string | null) =>
        e === el ? ({ direction: 'rtl' } as CSSStyleDeclaration) : real(e, p),
      );
    }
    scrollTo(el, 0);
    expect(edges(el)).toEqual(['false', 'true']);
    scrollTo(el, -200);
    expect(edges(el)).toEqual(['true', 'false']);
    scrollTo(el, -100);
    expect(edges(el)).toEqual(['false', 'false']);
  });

  it('is at both edges when nothing overflows', () => {
    const { getByTestId } = render(<Row w={100} cw={100} />);
    expect(edges(getByTestId('row'))).toEqual(['true', 'true']);
  });

  it('removes its listener on unmount', () => {
    const { getByTestId, unmount } = render(<Row />);
    const el = getByTestId('row');
    unmount();
    const before = edges(el);
    scrollTo(el, 200);
    expect(edges(el)).toEqual(before);
  });
});
