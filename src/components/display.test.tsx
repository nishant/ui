import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppHeader,
  Callout,
  ChartLegend,
  CopyButton,
  copyText,
  Disclosure,
  Kbd,
  KeyValueList,
  Meter,
  PageHeader,
  SectionHeader,
  signTone,
  Sparkline,
  Stat,
  StatGrid,
  StatusDot,
  toneFor,
} from './display';
import { signTone as pureSignTone, toneFor as pureToneFor } from './display-classes';
import { NishProvider } from './provider';

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
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('signTone and toneFor', () => {
  it('re-export the pure helpers', () => {
    expect(signTone).toBe(pureSignTone);
    expect(toneFor).toBe(pureToneFor);
  });
  it('signTone maps sign to tone and nothing to neutral', () => {
    expect(signTone(3)).toBe('ok');
    expect(signTone(-0.1)).toBe('loss');
    expect(signTone(0)).toBe('neutral');
    expect(signTone(null)).toBe('neutral');
    expect(signTone(undefined)).toBe('neutral');
    expect(signTone(Number.NaN)).toBe('neutral');
  });
  it('toneFor treats higher as worse when loss >= warn', () => {
    const t = { warn: 75, loss: 90 };
    expect(toneFor(74, t)).toBe('ok');
    expect(toneFor(75, t)).toBe('warn');
    expect(toneFor(89, t)).toBe('warn');
    expect(toneFor(90, t)).toBe('loss');
  });
  it('toneFor treats lower as worse when loss < warn', () => {
    const t = { warn: 30, loss: 10 };
    expect(toneFor(31, t)).toBe('ok');
    expect(toneFor(30, t)).toBe('warn');
    expect(toneFor(11, t)).toBe('warn');
    expect(toneFor(10, t)).toBe('loss');
  });
});

describe('Callout', () => {
  it('forwards ref, merges className and passes rest props to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Callout ref={ref} className="extra" data-testid="c" id="note" aria-describedby="x">
        Body
      </Callout>,
    );
    const root = screen.getByTestId('c');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('note');
    expect(root.getAttribute('aria-describedby')).toBe('x');
    expect(root.className).toContain('extra');
    expect(root.className).toContain('border');
  });

  it('announces only when live: alert for loss, status otherwise', () => {
    const { rerender } = render(<Callout tone="loss" live>Down</Callout>);
    expect(screen.getByRole('alert').textContent).toContain('Down');
    rerender(<Callout tone="info" live>Heads up</Callout>);
    expect(screen.getByRole('status').textContent).toContain('Heads up');
    rerender(<Callout tone="info">Quiet</Callout>);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('names the dismiss button from strings, a provider or the dismissLabel prop', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Callout onDismiss={onDismiss}>x</Callout>);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    rerender(
      <NishProvider strings={{ dismiss: 'Fermer' }}>
        <Callout onDismiss={onDismiss}>x</Callout>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ dismiss: 'Fermer' }}>
        <Callout onDismiss={onDismiss} dismissLabel="Cerrar">x</Callout>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  });

  it('labels the count badge from the moreCount string', () => {
    render(
      <NishProvider strings={{ moreCount: (n) => `${n} de plus` }}>
        <Callout title="Errors" count={3}>x</Callout>
      </NishProvider>,
    );
    expect(screen.getByLabelText('3 de plus').textContent).toBe('+3');
  });

  it('renders a link for a safe href and drops an unsafe one with a dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Callout href="/status">See status</Callout>);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/status');
    rerender(<Callout href="javascript:alert(1)//callout">Nope</Callout>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Nope')).toBeTruthy();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('Callout dropped an unsafe href');
  });

  it('renders a button when only onClick is given', () => {
    const onClick = vi.fn();
    render(<Callout onClick={onClick}>Go</Callout>);
    fireEvent.click(screen.getByRole('button', { name: /Go/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('clamps the body, sticks under the header with the sticky token and marks itself as a bar for print', () => {
    render(<Callout clamp={2} sticky variant="bar" data-testid="c">Long</Callout>);
    const root = screen.getByTestId('c');
    expect(root.className).toContain('sticky');
    expect(root.className).toContain('z-[var(--nish-z-sticky,20)]');
    expect(root.hasAttribute('data-nish-bar')).toBe(true);
    expect(screen.getByText('Long').className).toContain('line-clamp-2');
    expect(root.className).toContain('rounded-none');
  });

  it('hides the icon with icon={false}', () => {
    const { container } = render(<Callout icon={false}>x</Callout>);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('StatusDot', () => {
  it('is an image with a name when labelled, hidden otherwise', () => {
    const { rerender } = render(<StatusDot tone="ok" label="Up" />);
    expect(screen.getByRole('img', { name: 'Up' })).toBeTruthy();
    rerender(<StatusDot tone="ok" data-testid="d" />);
    const dot = screen.getByTestId('d');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(dot.getAttribute('role')).toBeNull();
  });

  it('applies tone, size, halo and pulse classes and passes ref and rest', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<StatusDot ref={ref} tone="loss" size="lg" halo pulse className="mine" data-testid="d" />);
    const dot = screen.getByTestId('d');
    expect(ref.current).toBe(dot);
    expect(dot.className).toContain('bg-th-loss-fill');
    expect(dot.className).toContain('size-3.5');
    expect(dot.className).toContain('ring-th-loss-fill/25');
    expect(dot.className).toContain('motion-safe:animate-pulse');
    expect(dot.className).toContain('mine');
  });

  it('stays visible in forced colors', () => {
    render(<StatusDot tone="warn" data-testid="d" />);
    const cls = screen.getByTestId('d').className;
    expect(cls).toContain('forced-colors:bg-[Highlight]');
    expect(cls).toContain('forced-colors:forced-color-adjust-none');
  });
});

describe('Stat and StatGrid', () => {
  it('renders its own dl with the label, value and sub', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<Stat ref={ref} label="Uptime" value="99.9%" sub="30 days" tone="ok" data-testid="s" />);
    expect(container.querySelector('dl')).not.toBeNull();
    expect(screen.getByText('Uptime').tagName).toBe('DT');
    const value = screen.getByText('99.9%');
    expect(value.tagName).toBe('DD');
    expect(value.className).toContain('text-th-ok');
    expect(screen.getByText('30 days').tagName).toBe('DD');
    expect(ref.current).toBe(screen.getByTestId('s'));
  });

  it('shows skeletons and aria-busy instead of the value while loading', () => {
    const { container } = render(<Stat label="Open" value="42" loading />);
    expect(screen.queryByText('42')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('renders the plain and inset variants on a dl root with the ref', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<Stat ref={ref} variant="inset" label="A" value="1" className="x" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DL');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('bg-th-elevated');
    expect(root.className).toContain('x');
  });

  it('inside a StatGrid each stat is a div of dt and dd in one dl', () => {
    const { container } = render(
      <StatGrid cols={{ base: 3, md: 6 }} data-testid="g" className="mine">
        <Stat label="A" value="1" variant="plain" />
        <Stat label="B" value="2" variant="plain" />
      </StatGrid>,
    );
    expect(container.querySelectorAll('dl')).toHaveLength(1);
    const grid = screen.getByTestId('g');
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).toContain('md:grid-cols-6');
    expect(grid.className).toContain('mine');
    expect(grid.children[0]?.tagName).toBe('DIV');
  });

  it('defaults StatGrid to 2 columns and 4 from md', () => {
    render(<StatGrid data-testid="g"><Stat label="A" value="1" /></StatGrid>);
    expect(screen.getByTestId('g').className).toContain('grid-cols-2');
    expect(screen.getByTestId('g').className).toContain('md:grid-cols-4');
  });
});

describe('Meter', () => {
  it('exposes the ARIA meter with a clamped value and percent text', () => {
    render(<Meter label="Disk" value={150} />);
    const m = screen.getByRole('meter', { name: 'Disk' });
    expect(m.getAttribute('aria-valuemin')).toBe('0');
    expect(m.getAttribute('aria-valuemax')).toBe('100');
    expect(m.getAttribute('aria-valuenow')).toBe('100');
    expect(m.getAttribute('aria-valuetext')).toBe('100%');
  });

  it('uses the progressbar role for kind="progress" and scales a custom range', () => {
    render(<Meter label="Upload" kind="progress" value={5} min={0} max={20} />);
    const m = screen.getByRole('progressbar', { name: 'Upload' });
    expect(m.getAttribute('aria-valuetext')).toBe('25%');
    expect((m.firstElementChild as HTMLElement).style.width).toBe('25%');
  });

  it('picks the tone from thresholds unless tone is given', () => {
    const { rerender } = render(<Meter label="Disk" value={95} thresholds={{ warn: 75, loss: 90 }} />);
    expect(screen.getByRole('meter').getAttribute('data-tone')).toBe('loss');
    expect((screen.getByRole('meter').firstElementChild as HTMLElement).className).toContain('bg-th-loss-fill');
    rerender(<Meter label="Disk" value={95} thresholds={{ warn: 75, loss: 90 }} tone="ok" />);
    expect(screen.getByRole('meter').getAttribute('data-tone')).toBe('ok');
    rerender(<Meter label="Disk" value={10} />);
    expect(screen.getByRole('meter').getAttribute('data-tone')).toBe('accent');
  });

  it('guards a zero-width range', () => {
    render(<Meter label="Flat" value={3} min={3} max={3} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('0%');
  });

  it('fills a vertical meter by height', () => {
    render(<Meter label="Level" value={40} orientation="vertical" size="md" />);
    const m = screen.getByRole('meter');
    expect((m.firstElementChild as HTMLElement).style.height).toBe('40%');
    expect(m.className).toContain('w-2.5');
  });

  it('puts className on the wrapper row with showValue and ref/rest on the bar', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Meter ref={ref} label="Q" value={33.4} showValue className="wrap" id="meter-q" />);
    const bar = screen.getByRole('meter');
    expect(ref.current).toBe(bar);
    expect(bar.id).toBe('meter-q');
    expect(bar.className).not.toContain('wrap');
    expect((container.firstElementChild as HTMLElement).className).toContain('wrap');
    expect(screen.getByText('33%').getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the fill visible in forced colors', () => {
    render(<Meter label="Q" value={50} />);
    const bar = screen.getByRole('meter');
    expect(bar.className).toContain('forced-colors:border');
    expect((bar.firstElementChild as HTMLElement).className).toContain('forced-colors:bg-[Highlight]');
  });
});

describe('Sparkline', () => {
  it('draws one line per run and breaks at nulls', () => {
    const { container } = render(<Sparkline label="Latency" values={[1, 2, null, 3, 4]} />);
    expect(screen.getByRole('img', { name: 'Latency' })).toBeTruthy();
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('names an empty chart from the noDataNamed string', () => {
    render(
      <NishProvider strings={{ noDataNamed: (l) => `${l}: aucune donnee` }}>
        <Sparkline label="Latency" values={[]} />
      </NishProvider>,
    );
    expect(screen.getByRole('img', { name: 'Latency: aucune donnee' })).toBeTruthy();
  });

  it('forwards ref, size and rest props and merges className', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Sparkline ref={ref} label="L" values={[1, 2]} width={80} height={20} className="w-full" data-testid="sp" />);
    const svg = screen.getByTestId('sp');
    expect(ref.current).toBe(svg);
    expect(svg.getAttribute('width')).toBe('80');
    expect(svg.getAttribute('viewBox')).toBe('0 0 80 20');
    expect(svg.getAttribute('class')).toContain('w-full');
    expect(svg.getAttribute('class')).toContain('text-th-chart-1');
  });

  it('adds area paths with fill', () => {
    const { container } = render(<Sparkline label="L" values={[1, 3, 2]} fill />);
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });
});

describe('Disclosure', () => {
  it('starts closed or open and reflects it in data-state', () => {
    const { unmount } = render(<Disclosure summary="More" data-testid="d">Body</Disclosure>);
    expect(screen.getByTestId('d').getAttribute('data-state')).toBe('closed');
    expect((screen.getByTestId('d') as HTMLDetailsElement).open).toBe(false);
    unmount();
    render(<Disclosure summary="More" defaultOpen data-testid="d">Body</Disclosure>);
    expect(screen.getByTestId('d').getAttribute('data-state')).toBe('open');
    expect((screen.getByTestId('d') as HTMLDetailsElement).open).toBe(true);
  });

  it('tracks the element state on toggle and calls onOpenChange', () => {
    const onOpenChange = vi.fn();
    render(<Disclosure summary="More" onOpenChange={onOpenChange} data-testid="d">Body</Disclosure>);
    const el = screen.getByTestId('d') as HTMLDetailsElement;
    el.open = true;
    fireEvent(el, new Event('toggle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(el.getAttribute('data-state')).toBe('open');
  });

  it('is controlled by open: ignores its own toggles for data-state', () => {
    const onOpenChange = vi.fn();
    render(<Disclosure summary="More" open={false} onOpenChange={onOpenChange} data-testid="d">Body</Disclosure>);
    const el = screen.getByTestId('d') as HTMLDetailsElement;
    el.open = true;
    fireEvent(el, new Event('toggle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(el.getAttribute('data-state')).toBe('closed');
  });

  it('does not report the toggle caused by its own write of open', () => {
    const onOpenChange = vi.fn();
    render(<Disclosure summary="More" open onOpenChange={onOpenChange} data-testid="d">Body</Disclosure>);
    fireEvent(screen.getByTestId('d'), new Event('toggle'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('forwards ref and className, with a card variant', () => {
    const ref = createRef<HTMLDetailsElement>();
    render(<Disclosure ref={ref} summary="More" variant="card" className="mine" data-testid="d">Body</Disclosure>);
    expect(ref.current).toBe(screen.getByTestId('d'));
    expect(ref.current?.className).toContain('mine');
    expect(ref.current?.className).toContain('rounded-xl');
  });
});

describe('Kbd', () => {
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref} className="mine" title="Command K">⌘K</Kbd>);
    const el = screen.getByTitle('Command K');
    expect(el.tagName).toBe('KBD');
    expect(ref.current).toBe(el);
    expect(el.className).toContain('mine');
  });
});

type ClipboardStub = { writeText: ReturnType<typeof vi.fn> };

function setClipboard(clip: ClipboardStub | undefined, secure: boolean): void {
  Object.defineProperty(navigator, 'clipboard', { value: clip, configurable: true });
  Object.defineProperty(window, 'isSecureContext', { value: secure, configurable: true });
}

function setExec(result: boolean | 'throw'): ReturnType<typeof vi.fn> {
  const fn = vi.fn(() => {
    if (result === 'throw') throw new Error('blocked');
    return result;
  });
  (document as unknown as { execCommand: unknown }).execCommand = fn;
  return fn;
}

describe('copyText', () => {
  it('uses the Clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText }, true);
    expect(await copyText('abc')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('abc');
  });

  it('falls back to a textarea and execCommand when the API is missing', async () => {
    setClipboard(undefined, true);
    const exec = setExec(true);
    expect(await copyText('abc')).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back in an insecure context even when the API object exists', async () => {
    const writeText = vi.fn();
    setClipboard({ writeText }, false);
    setExec(true);
    expect(await copyText('abc')).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back when the API rejects, and reports false when the fallback fails or throws', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) }, true);
    const exec = setExec(true);
    expect(await copyText('abc')).toBe(true);
    expect(exec).toHaveBeenCalledTimes(1);
    setExec(false);
    expect(await copyText('abc')).toBe(false);
    setExec('throw');
    expect(await copyText('abc')).toBe(false);
  });

  it('returns focus to the element that had it and leaves no textarea behind', async () => {
    setClipboard(undefined, false);
    setExec(true);
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    await copyText('abc');
    expect(document.activeElement).toBe(btn);
    expect(document.querySelector('textarea')).toBeNull();
    btn.remove();
  });
});

describe('CopyButton', () => {
  it('copies, shows Copied for 1.5s and announces it', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText }, true);
    const onCopy = vi.fn();
    render(<CopyButton text="hello" onCopy={onCopy} />);
    expect(screen.getByRole('button').textContent).toBe('Copy');
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(onCopy).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button').textContent).toBe('Copied');
    expect(screen.getByRole('status').textContent).toBe('Copied');
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(screen.getByRole('button').textContent).toBe('Copied');
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.getByRole('button').textContent).toBe('Copy');
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('works without a Clipboard API through the textarea fallback', async () => {
    setClipboard(undefined, false);
    const exec = setExec(true);
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(exec).toHaveBeenCalledWith('copy');
    expect(screen.getByRole('button').textContent).toBe('Copied');
  });

  it('shows the failure string when nothing works and calls onCopy(false)', async () => {
    vi.useFakeTimers();
    setClipboard(undefined, false);
    setExec(false);
    const onCopy = vi.fn();
    render(<CopyButton text="hello" onCopy={onCopy} failedLabel="Could not copy" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(onCopy).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button').textContent).toBe('Could not copy');
    expect(screen.getByRole('status').textContent).toBe('Could not copy');
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole('button').textContent).toBe('Copy');
  });

  it('defaults the failure string to "Copy failed"', async () => {
    setClipboard(undefined, false);
    setExec('throw');
    render(<CopyButton text="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('status').textContent).toBe('Copy failed');
  });

  it('takes its labels from a provider, and a prop wins', () => {
    const { rerender } = render(
      <NishProvider strings={{ copy: 'Copier', copied: 'Copie' }}>
        <CopyButton text="x" />
      </NishProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('Copier');
    rerender(
      <NishProvider strings={{ copy: 'Copier' }}>
        <CopyButton text="x" label="Copier le lien" />
      </NishProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('Copier le lien');
  });

  it('is named by its label when iconOnly, forwards ref, rest and className', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CopyButton ref={ref} text="x" iconOnly label="Copy address" className="mine" data-testid="cb" id="cb1" />);
    const btn = screen.getByRole('button', { name: 'Copy address' });
    expect(ref.current).toBe(btn);
    expect(btn.id).toBe('cb1');
    expect(btn.className).toContain('mine');
    expect(btn.getAttribute('data-state')).toBe('idle');
  });
});

describe('PageHeader', () => {
  it('renders the title as h1 (h2 with as), description, eyebrow, back and actions', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(
      <PageHeader ref={ref} title="Jobs" description="Open roles" eyebrow="Search" back={<a href="/">Back</a>} actions={<button type="button">New</button>} data-testid="ph" />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Jobs' })).toBeTruthy();
    expect(screen.getByText('Open roles')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy();
    expect(ref.current).toBe(screen.getByTestId('ph'));
    rerender(<PageHeader title="Jobs" as="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });

  it('sticks under the app header with the sticky token', () => {
    render(<PageHeader title="Jobs" sticky className="mine" data-testid="ph" />);
    const el = screen.getByTestId('ph');
    expect(el.className).toContain('sticky');
    expect(el.className).toContain('z-[var(--nish-z-sticky,20)]');
    expect(el.className).toContain('mine');
    expect(el.hasAttribute('data-nish-bar')).toBe(true);
  });

  it('is not a print bar when not sticky', () => {
    render(<PageHeader title="Jobs" data-testid="ph" />);
    expect(screen.getByTestId('ph').hasAttribute('data-nish-bar')).toBe(false);
  });
});

describe('AppHeader', () => {
  it('shows no hub pill by default', () => {
    const { container } = render(<AppHeader name="Jobs" themeToggle={false} />);
    expect(container.querySelector('.nish-pill-link')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders the hub pill as today when hub is given', () => {
    render(<AppHeader name="Jobs" themeToggle={false} hub={{ href: 'https://nish.software', label: 'nish.software' }} />);
    const pill = screen.getByRole('link');
    expect(pill.getAttribute('href')).toBe('https://nish.software');
    expect(pill.className).toContain('nish-pill-link');
    expect(pill.textContent).toBe('← nish.software');
    expect(pill.getAttribute('title')).toBe('Back to nish.software');
    expect(pill.className).toContain('@max-[400px]/header:min-w-11');
  });

  it('takes the hub title from the hub, then the provider', () => {
    const { rerender } = render(<AppHeader name="Jobs" themeToggle={false} hub={{ href: '/', label: 'Acme', title: 'Go to Acme' }} />);
    expect(screen.getByRole('link').getAttribute('title')).toBe('Go to Acme');
    rerender(
      <NishProvider strings={{ hubTitle: 'Retour' }}>
        <AppHeader name="Jobs" themeToggle={false} hub={{ href: '/', label: 'Acme' }} />
      </NishProvider>,
    );
    expect(screen.getByRole('link').getAttribute('title')).toBe('Retour');
  });

  it('shrinks the pill to its arrow with compactPill', () => {
    render(<AppHeader name="Jobs" themeToggle={false} compactPill hub={{ href: '/', label: 'Acme' }} />);
    const pill = screen.getByRole('link');
    expect(pill.className).toContain('nish-pill-link--compact');
    expect(pill.querySelector('.nish-pill-link-label')?.textContent).toBe('Acme');
  });

  it('hides the pill and warns when the hub href is unsafe', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<AppHeader name="Jobs" themeToggle={false} hub={{ href: 'javascript:void(0)//hub', label: 'Evil' }} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(String(warn.mock.calls[0]?.[0])).toContain('hub pill');
  });

  it('links the name home, or renders a brand node without a link', () => {
    const { rerender } = render(<AppHeader name="Jobs" themeToggle={false} homeHref="/" icon={<svg />} hideNameBelow="sm" />);
    const home = screen.getByRole('link', { name: 'Jobs' });
    expect(home.getAttribute('href')).toBe('/');
    expect(home.className).toContain('min-h-11');
    rerender(<AppHeader name="Jobs" themeToggle={false} homeHref="/" brand={<button type="button">Ana</button>} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ana' })).toBeTruthy();
    expect(screen.getByText('Jobs').className).toContain('sr-only');
  });

  it('names the tabs nav from the sections string, a provider or navLabel', () => {
    const nav = <a href="/a">A</a>;
    const { rerender } = render(<AppHeader name="Jobs" themeToggle={false} nav={nav} />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ sections: 'Rubriques' }}>
        <AppHeader name="Jobs" themeToggle={false} nav={nav} />
      </NishProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Rubriques' })).toBeTruthy();
    rerender(<AppHeader name="Jobs" themeToggle={false} nav={nav} navLabel="Trackers" />);
    expect(screen.getByRole('navigation', { name: 'Trackers' })).toBeTruthy();
  });

  it('forwards ref and rest, is sticky on the token and a print bar, and merges className', () => {
    const ref = createRef<HTMLElement>();
    render(<AppHeader ref={ref} name="Jobs" themeToggle={false} className="mine" data-testid="h" />);
    const el = screen.getByRole('banner');
    expect(ref.current).toBe(el);
    expect(el.getAttribute('data-testid')).toBe('h');
    expect(el.className).toContain('mine');
    expect(el.className).toContain('sticky');
    expect(el.className).toContain('z-[calc(var(--nish-z-sticky,20)+10)]');
    expect(el.hasAttribute('data-nish-bar')).toBe(true);
  });

  it('is not sticky and not a print bar with sticky={false}', () => {
    render(<AppHeader name="Jobs" themeToggle={false} sticky={false} />);
    const el = screen.getByRole('banner');
    expect(el.className).not.toContain('sticky');
    expect(el.hasAttribute('data-nish-bar')).toBe(false);
  });

  it('renders the overflow kebab with the moreActions string and the actions slot', () => {
    render(
      <NishProvider strings={{ moreActions: 'Plus' }}>
        <AppHeader name="Jobs" themeToggle={false} actions={<button type="button">Act</button>} overflowActions={<span>item</span>} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Plus' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Act' })).toBeTruthy();
  });

  it('renders the default theme toggle unless themeToggle is false or a node', () => {
    const { rerender } = render(<AppHeader name="Jobs" />);
    const withToggle = within(screen.getByRole('banner')).getAllByRole('button').length;
    expect(withToggle).toBeGreaterThan(0);
    rerender(<AppHeader name="Jobs" themeToggle={false} />);
    expect(within(screen.getByRole('banner')).queryAllByRole('button')).toHaveLength(0);
    rerender(<AppHeader name="Jobs" themeToggle={<button type="button">Mine</button>} />);
    expect(screen.getByRole('button', { name: 'Mine' })).toBeTruthy();
  });
});

describe('SectionHeader', () => {
  it('puts id on the heading, and ref, className and rest on the row', () => {
    const ref = createRef<HTMLDivElement>();
    render(<SectionHeader ref={ref} id="sec" title="Positions" meta="3 of 12" action={<button type="button">Add</button>} className="mine" data-testid="sh" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Positions' }).id).toBe('sec');
    expect(ref.current).toBe(screen.getByTestId('sh'));
    expect(ref.current?.id).toBe('');
    expect(ref.current?.className).toContain('mine');
    expect(screen.getByText('3 of 12')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });

  it('honors the heading level and omits the right side without meta or action', () => {
    const { container } = render(<SectionHeader title="T" as="h3" />);
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});

describe('KeyValueList', () => {
  const items = [
    { key: 'a', label: 'Disk', value: '80%' },
    { key: 'b', label: 'Path', value: '/var/lib/x', wrap: true as const },
    { key: 'c', label: 'Status', value: 'Degraded after a restart', wrap: 'words' as const },
  ];

  it('renders a ul of rows by default with ref and rest', () => {
    const ref = createRef<HTMLElement>();
    render(<KeyValueList ref={ref} items={items} className="mine" aria-label="Vitals" />);
    const list = screen.getByRole('list', { name: 'Vitals' });
    expect(ref.current).toBe(list);
    expect(list.className).toContain('mine');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.className).toContain('min-h-11');
    expect(rows[1]?.className).toContain('py-2');
    expect(rows[0]?.className).not.toContain('py-2');
  });

  it('uses 32px rows when dense', () => {
    render(<KeyValueList items={items} dense />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]?.className).toContain('min-h-8');
    expect(rows[1]?.className).toContain('py-1');
  });

  it('wraps long values anywhere and prose at words', () => {
    render(<KeyValueList items={items} />);
    expect(screen.getByText('/var/lib/x').className).toContain('break-all');
    expect(screen.getByText('Status').className).toContain('max-w-[calc(60%_-_0.75rem)]');
    expect(screen.getByText('Degraded after a restart').className).toContain('flex-1');
    expect(screen.getByText('80%').className).toContain('shrink-0');
  });

  it('renders a dl with dt and dd pairs for as="dl"', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<KeyValueList ref={ref} items={items} as="dl" />);
    expect(container.querySelector('dl')).toBe(ref.current);
    expect(container.querySelectorAll('dt')).toHaveLength(3);
    expect(container.querySelectorAll('dd')).toHaveLength(3);
    expect(container.querySelector('dd')?.className).toContain('text-end');
  });
});

describe('ChartLegend', () => {
  const items = [
    { label: 'CPU', tone: 'chart-1' as const },
    { label: 'Disk', tone: 'loss' as const },
  ];

  it('names the list from the legend string, a provider or label', () => {
    const { rerender } = render(<ChartLegend items={items} />);
    expect(screen.getByRole('list', { name: 'Legend' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ legend: 'Legende' }}>
        <ChartLegend items={items} />
      </NishProvider>,
    );
    expect(screen.getByRole('list', { name: 'Legende' })).toBeTruthy();
    rerender(<ChartLegend items={items} label="Series" />);
    expect(screen.getByRole('list', { name: 'Series' })).toBeTruthy();
  });

  it('draws line or dot marks in the tone fill and forwards ref and rest', () => {
    const ref = createRef<HTMLUListElement>();
    const { container, rerender } = render(<ChartLegend ref={ref} items={items} className="mine" data-testid="lg" />);
    expect(ref.current).toBe(screen.getByTestId('lg'));
    expect(ref.current?.className).toContain('mine');
    const marks = container.querySelectorAll('i');
    expect(marks[0]?.className).toContain('bg-th-chart-1');
    expect(marks[0]?.className).toContain('h-0.75');
    expect(marks[1]?.className).toContain('bg-th-loss-fill');
    expect(marks[0]?.getAttribute('aria-hidden')).toBe('true');
    rerender(<ChartLegend items={items} marker="dot" />);
    expect(container.querySelector('i')?.className).toContain('rounded-full');
  });
});
