import { createRef } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionBanner, LoadingBar, PageContainer, StickyActionBar, StickyBar, useOnline } from './layout';
import { NishProvider } from './provider';

const root = document.documentElement;
const heightProp = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

function setHeight(px: number): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => px });
}

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  setOnline(true);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (heightProp) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', heightProp);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
  for (const name of ['--nish-sticky-extra', '--nish-bottom-bar-h']) root.style.removeProperty(name);
});

describe('StickyBar', () => {
  it('forwards ref, rest, className and style and sticks on the sticky token', () => {
    const ref = createRef<HTMLElement>();
    render(
      <StickyBar ref={ref} className="mine" id="bar" style={{ color: 'red' }} data-testid="sb" aria-label="Filters">
        content
      </StickyBar>,
    );
    const bar = screen.getByTestId('sb');
    expect(ref.current).toBe(bar);
    expect(bar.id).toBe('bar');
    expect(bar.getAttribute('aria-label')).toBe('Filters');
    expect(bar.className).toContain('mine');
    expect(bar.className).toContain('sticky');
    expect(bar.className).toContain('z-[var(--nish-z-sticky,20)]');
    expect(bar.className).toContain('border-transparent');
    expect(bar.style.top).toBe('var(--nish-header-h, 0px)');
    expect(bar.style.color).toBe('red');
    expect(bar.hasAttribute('data-nish-bar')).toBe(true);
    expect(bar.tagName).toBe('DIV');
  });

  it('takes top and as', () => {
    render(<StickyBar top="3rem" as="nav" data-testid="sb">x</StickyBar>);
    const bar = screen.getByTestId('sb');
    expect(bar.tagName).toBe('NAV');
    expect(bar.style.top).toBe('3rem');
  });

  it('publishes its height as --nish-sticky-extra and removes it on unmount', () => {
    setHeight(48);
    const { unmount } = render(<StickyBar>x</StickyBar>);
    expect(root.style.getPropertyValue('--nish-sticky-extra')).toBe('48px');
    unmount();
    expect(root.style.getPropertyValue('--nish-sticky-extra')).toBe('');
  });
});

describe('merged refs stay attached across renders', () => {
  it('StickyBar and StickyActionBar do not re-call a caller callback ref on re-render', () => {
    const calls: unknown[] = [];
    const cb = (el: HTMLElement | null) => void calls.push(el);
    const { rerender } = render(
      <>
        <StickyBar ref={cb}>x</StickyBar>
        <StickyActionBar open ref={cb} primary={<button type="button">Save</button>} />
      </>,
    );
    const before = calls.length;
    expect(before).toBe(2);
    rerender(
      <>
        <StickyBar ref={cb}>y</StickyBar>
        <StickyActionBar open ref={cb} message="changed" primary={<button type="button">Save</button>} />
      </>,
    );
    expect(calls.length).toBe(before);
  });
});

describe('StickyActionBar', () => {
  it('renders nothing and publishes no height while closed', () => {
    setHeight(60);
    const { container } = render(<StickyActionBar open={false} primary={<button type="button">Save</button>} />);
    expect(container.firstChild).toBeNull();
    expect(root.style.getPropertyValue('--nish-bottom-bar-h')).toBe('');
  });

  it('is a region named from the actions string, a provider or label, with both actions and the message', () => {
    const { rerender } = render(
      <StickyActionBar open message="3 changes" primary={<button type="button">Save</button>} secondary={<button type="button">Discard</button>} />,
    );
    const region = screen.getByRole('region', { name: 'Actions' });
    expect(region.textContent).toContain('3 changes');
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ actions: 'Boutons' }}>
        <StickyActionBar open primary={<button type="button">Save</button>} />
      </NishProvider>,
    );
    expect(screen.getByRole('region', { name: 'Boutons' })).toBeTruthy();
    rerender(<StickyActionBar open label="Form actions" primary={<button type="button">Save</button>} />);
    expect(screen.getByRole('region', { name: 'Form actions' })).toBeTruthy();
  });

  it('uses logical placement, the token z-index, the open state and print hiding; forwards ref and rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<StickyActionBar ref={ref} open className="mine" data-testid="ab" primary={<span>p</span>} />);
    const bar = screen.getByTestId('ab');
    expect(ref.current).toBe(bar);
    expect(bar.className).toContain('mine');
    expect(bar.className).toContain('sm:end-6');
    expect(bar.className).not.toContain('sm:right-6');
    expect(bar.className).toContain('z-[calc(var(--nish-z-sticky,20)+10)]');
    expect(bar.getAttribute('data-state')).toBe('open');
    expect(bar.getAttribute('data-nish-print')).toBe('hide');
    expect(bar.hasAttribute('data-nish-bar')).toBe(true);
  });

  it('publishes --nish-bottom-bar-h while open', () => {
    setHeight(64);
    const { rerender } = render(<StickyActionBar open primary={<span>p</span>} />);
    expect(root.style.getPropertyValue('--nish-bottom-bar-h')).toBe('64px');
    rerender(<StickyActionBar open={false} primary={<span>p</span>} />);
    expect(root.style.getPropertyValue('--nish-bottom-bar-h')).toBe('');
  });
});

describe('LoadingBar', () => {
  it('shows only after the delay and only while active', () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoadingBar active delayMs={300} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.getByRole('progressbar')).toBeTruthy();
    rerender(<LoadingBar active={false} delayMs={300} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('never flashes for a load shorter than the delay', () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoadingBar active />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender(<LoadingBar active={false} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('defaults the delay to 200ms', () => {
    vi.useFakeTimers();
    render(<LoadingBar active />);
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('is busy and named from the loading string, a provider or aria-label', () => {
    vi.useFakeTimers();
    const shown = (ui: React.ReactElement) => {
      const r = render(ui);
      act(() => {
        vi.advanceTimersByTime(1);
      });
      return r;
    };
    let r = shown(<LoadingBar active delayMs={0} />);
    expect(screen.getByRole('progressbar', { name: 'Loading' }).getAttribute('aria-busy')).toBe('true');
    r.unmount();
    r = shown(
      <NishProvider strings={{ loading: 'Chargement' }}>
        <LoadingBar active delayMs={0} />
      </NishProvider>,
    );
    expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeTruthy();
    r.unmount();
    shown(<LoadingBar active delayMs={0} aria-label="Route" />);
    expect(screen.getByRole('progressbar', { name: 'Route' })).toBeTruthy();
  });

  it('sits under the header on the token z-index, forwards ref and rest, and is hidden in print', () => {
    vi.useFakeTimers();
    const ref = createRef<HTMLDivElement>();
    render(<LoadingBar ref={ref} active delayMs={0} top="10px" className="mine" data-testid="lb" />);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const bar = screen.getByTestId('lb');
    expect(ref.current).toBe(bar);
    expect(bar.style.top).toBe('10px');
    expect(bar.className).toContain('mine');
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('z-[var(--nish-z-dropdown,40)]');
    expect(bar.getAttribute('data-nish-print')).toBe('hide');
    expect(bar.firstElementChild?.className).toContain('forced-colors:bg-[Highlight]');
  });

  it('renders no live region without announce', () => {
    const { container } = render(<LoadingBar active={false} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps a persistent polite live region and writes announce into it while the bar shows', () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoadingBar active={false} announce="Loading page" />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');
    rerender(<LoadingBar active announce="Loading page" />);
    // Same node as before: the region persists, so the change is announced.
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('');
    act(() => {
      vi.advanceTimersByTime(201);
    });
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('Loading page');
    rerender(<LoadingBar active={false} announce="Loading page" />);
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('');
  });
});

describe('PageContainer', () => {
  it('renders a main by default with the shared gutter and bottom inset class', () => {
    const ref = createRef<HTMLElement>();
    render(<PageContainer ref={ref} className="mine" id="page" data-testid="pc">content</PageContainer>);
    const el = screen.getByRole('main');
    expect(ref.current).toBe(el);
    expect(el.id).toBe('page');
    expect(el.getAttribute('data-testid')).toBe('pc');
    expect(el.className).toContain('mine');
    expect(el.className).toContain('max-w-4xl');
    expect(el.className).toContain('nish-pad-bottom-inset');
    expect(el.className).toContain('px-[var(--nish-page-gutter)]');
  });

  it('maps sizes, drops the bottom inset with padBottom={false} and renders `as`', () => {
    const { rerender } = render(<PageContainer size="narrow" padBottom={false} as="div" data-testid="pc">x</PageContainer>);
    const el = screen.getByTestId('pc');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('max-w-2xl');
    expect(el.className).not.toContain('nish-pad-bottom-inset');
    rerender(<PageContainer size="wide" data-testid="pc">x</PageContainer>);
    expect(screen.getByTestId('pc').className).toContain('max-w-7xl');
    rerender(<PageContainer size="full" data-testid="pc">x</PageContainer>);
    expect(screen.getByTestId('pc').className).toContain('max-w-none');
  });

  // .nish-pad-bottom-inset lives in base.css's base layer, so any padding utility on the same
  // element beats it. A `py-6` there left page content under the phone BottomNav.
  it('pads the bottom with a utility that adds --nish-bottom-inset, not one py-6 overrides', () => {
    const { rerender } = render(<PageContainer data-testid="pc">x</PageContainer>);
    const classes = screen.getByTestId('pc').className.split(/\s+/);
    expect(classes).not.toContain('py-6');
    expect(classes).toContain('pt-6');
    expect(classes).toContain('pb-[max(calc(var(--nish-bottom-inset,0px)+1rem),calc(1rem+env(safe-area-inset-bottom)))]');
    rerender(<PageContainer padBottom={false} data-testid="pc">x</PageContainer>);
    const off = screen.getByTestId('pc').className.split(/\s+/);
    expect(off).toContain('py-6');
    expect(off.some((c) => c.includes('--nish-bottom-inset'))).toBe(false);
  });

  it('lets a className bottom padding replace the default one', () => {
    render(<PageContainer className="pb-10" data-testid="pc">x</PageContainer>);
    const classes = screen.getByTestId('pc').className.split(/\s+/);
    expect(classes).toContain('pb-10');
    expect(classes.some((c) => c.startsWith('pb-[max('))).toBe(false);
  });
});

describe('useOnline', () => {
  it('follows the online and offline events', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});

describe('ConnectionBanner', () => {
  it('renders nothing while online and reachable', () => {
    const { container } = render(<ConnectionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('announces the offline message and a Retry button from strings, with rest props on the bar', () => {
    setOnline(false);
    const ref = createRef<HTMLDivElement>();
    render(<ConnectionBanner ref={ref} data-testid="cb" className="mine" />);
    const bar = screen.getByRole('status');
    expect(ref.current).toBe(bar);
    expect(bar.getAttribute('data-testid')).toBe('cb');
    expect(bar.className).toContain('mine');
    expect(bar.className).toContain('sticky');
    expect(bar.textContent).toContain("You're offline");
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('takes offline and retry texts from a provider, and props win', () => {
    setOnline(false);
    const { rerender } = render(
      <NishProvider strings={{ offline: 'Hors ligne', retry: 'Reessayer' }}>
        <ConnectionBanner />
      </NishProvider>,
    );
    expect(screen.getByRole('status').textContent).toContain('Hors ligne');
    expect(screen.getByRole('button', { name: 'Reessayer' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ offline: 'Hors ligne', retry: 'Reessayer' }}>
        <ConnectionBanner offlineMessage="Sin red" retryLabel="Otra vez" />
      </NishProvider>,
    );
    expect(screen.getByRole('status').textContent).toContain('Sin red');
    expect(screen.getByRole('button', { name: 'Otra vez' })).toBeTruthy();
  });

  it('takes the default probe-failed message from a provider, and a message prop wins', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { rerender } = render(
      <NishProvider strings={{ serverUnreachable: 'Serveur injoignable' }}>
        <ConnectionBanner healthUrl="/health" />
      </NishProvider>,
    );
    await act(async () => {});
    expect(screen.getByRole('status').textContent).toContain('Serveur injoignable');
    rerender(
      <NishProvider strings={{ serverUnreachable: 'Serveur injoignable' }}>
        <ConnectionBanner healthUrl="/health" message="Mine" />
      </NishProvider>,
    );
    expect(screen.getByRole('status').textContent).toContain('Mine');
  });

  it('shows the banner when the browser goes offline and hides it again online', () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole('status')).toBeNull();
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('probes healthUrl without caching and shows the message when it fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    render(<ConnectionBanner healthUrl="/health" message="Server down" />);
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/health');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: 'no-store' });
    expect(screen.getByRole('status').textContent).toContain('Server down');
  });

  it('treats a rejected probe as unreachable and Retry re-probes then calls onRetry', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const onRetry = vi.fn();
    render(<ConnectionBanner healthUrl="/health" onRetry={onRetry} />);
    await act(async () => {});
    expect(screen.getByRole('status').textContent).toContain("Can't reach the server");
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stays hidden when the probe succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<ConnectionBanner healthUrl="/health" />);
    await act(async () => {});
    expect(screen.queryByRole('status')).toBeNull();
  });
});
