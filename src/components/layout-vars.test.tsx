import { useRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeightVar, useStuck } from './layout-vars';

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
