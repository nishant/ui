import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NishProvider } from '../provider';
import type { FollowStep, FollowTarget } from './follow';
import { FollowCaption } from './follow-caption';
import { SystemCanvas } from './system-canvas';
import type { CanvasEdge, CanvasGroup } from './types';

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const groups: CanvasGroup[] = [
  {
    id: 'edge',
    title: 'Hosting',
    column: 0,
    nodes: [
      { id: 'caddy', label: 'Caddy', detail: 'Reverse proxy', kind: 'infra' },
      { id: 'dns', label: 'DNS', count: 3 },
    ],
  },
  {
    id: 'apps',
    title: 'Apps',
    column: 1,
    hue: 'emerald',
    nodes: [{ id: 'web', label: 'Web', active: true, note: 'deploying', activeAt: 10 }],
  },
];
const edges: CanvasEdge[] = [
  { id: 'e1', from: 'caddy', to: 'web', kind: 'traffic', label: 'proxy' },
  { id: 'e2', from: 'dns', to: 'caddy', kind: 'deploy' },
];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 900,
    bottom: 600,
    width: 900,
    height: 600,
    toJSON() {},
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const canvas = (props: Partial<React.ComponentProps<typeof SystemCanvas>> = {}) => (
  <SystemCanvas groups={groups} edges={edges} height="600px" {...props} />
);

describe('SystemCanvas root', () => {
  it('puts ref, className, id, style and rest props on the viewport', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(canvas({ ref, className: 'mine', id: 'map', 'data-testid': 'cv', style: { color: 'red' } } as Partial<React.ComponentProps<typeof SystemCanvas>>));
    const root = screen.getByTestId('cv');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('map');
    expect(root.className).toContain('nish-canvas');
    expect(root.className).toContain('mine');
    expect(root.style.height).toBe('600px');
    expect(root.style.color).toBe('red');
    expect(root.getAttribute('role')).toBe('application');
    expect(root.tabIndex).toBe(0);
  });

  it('a function ref is called with the element', () => {
    const calls: Array<HTMLDivElement | null> = [];
    const { unmount } = render(canvas({ ref: (n) => void calls.push(n) }));
    expect(calls[0]).toBeInstanceOf(HTMLDivElement);
    unmount();
    expect(calls.at(-1)).toBeNull();
  });

  it('the role description comes from the provider, defaulting to "canvas"', () => {
    const { rerender } = render(canvas());
    expect(screen.getByRole('application').getAttribute('aria-roledescription')).toBe('canvas');
    rerender(<NishProvider strings={{ canvasRole: 'carte' }}>{canvas()}</NishProvider>);
    expect(screen.getByRole('application').getAttribute('aria-roledescription')).toBe('carte');
  });

  it('a third finger that lifts the first pair does not make the zoom jump', () => {
    const { container } = render(canvas());
    const vp = screen.getByRole('application');
    const world = container.querySelector('.nish-canvas-world') as HTMLElement;
    const scale = () => parseFloat(world.style.transform.split("scale(")[1] ?? "");
    const ev = (type: string, id: number, x: number, y: number) =>
      fireEvent(vp, new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', bubbles: true }));
    ev('pointerdown', 1, 100, 100);
    ev('pointerdown', 2, 200, 100);
    // A no-op move writes the pinch's own scale to the world layer.
    ev('pointermove', 2, 200, 100);
    const before = scale();
    expect(before).toBeGreaterThan(0);
    ev('pointerdown', 3, 400, 400);
    ev('pointerup', 2, 200, 100);
    // The pair is now fingers 1 and 3, 424px apart; against the old 100px baseline that would zoom about 4x.
    ev('pointermove', 3, 400, 401);
    expect(Math.abs(scale() / before - 1)).toBeLessThan(0.05);
  });

  it('the name comes from label, then the provider, then "System map"', () => {
    const { rerender } = render(canvas());
    expect(screen.getByRole('application').getAttribute('aria-label')).toBe('System map');
    rerender(canvas({ label: 'Fleet' }));
    expect(screen.getByRole('application').getAttribute('aria-label')).toBe('Fleet');
    rerender(<NishProvider strings={{ systemMap: 'Carte du système' }}>{canvas()}</NishProvider>);
    expect(screen.getByRole('application').getAttribute('aria-label')).toBe('Carte du système');
  });
});

describe('SystemCanvas content', () => {
  it('draws a button per group head and node', () => {
    render(canvas());
    expect(screen.getAllByRole('button', { name: /Caddy|DNS|Web/ }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('Hosting')).toBeTruthy();
    expect(screen.getByText('Apps')).toBeTruthy();
  });

  it('a node name contains the text the card shows, then its group', () => {
    render(canvas());
    const caddy = document.querySelector('[data-canvas-id="caddy"]')!;
    const name = caddy.getAttribute('aria-label')!;
    expect(name).toBe('Caddy Reverse proxy, Hosting');
    expect(caddy.textContent).toContain('Caddy');
    expect(caddy.textContent).toContain('Reverse proxy');
  });

  it('an active node with a note names the note and says it is live; a count is part of the name', () => {
    render(canvas());
    expect(document.querySelector('[data-canvas-id="web"]')!.getAttribute('aria-label')).toBe('Web deploying, Apps, Live');
    expect(document.querySelector('[data-canvas-id="dns"]')!.getAttribute('aria-label')).toBe('DNS 3, Hosting');
  });

  it('the live word comes from the provider', () => {
    render(<NishProvider strings={{ live: 'En direct' }}>{canvas()}</NishProvider>);
    expect(document.querySelector('[data-canvas-id="web"]')!.getAttribute('aria-label')).toBe('Web deploying, Apps, En direct');
  });

  it('selecting a node or a group head reports its id and type', () => {
    const onSelect = vi.fn();
    render(canvas({ onSelect }));
    fireEvent.click(document.querySelector('[data-canvas-id="caddy"]')!);
    expect(onSelect).toHaveBeenLastCalledWith('caddy', 'node');
    fireEvent.click(document.querySelector('.nish-canvas-head[data-canvas-id="apps"]')!);
    expect(onSelect).toHaveBeenLastCalledWith('apps', 'group');
  });

  it('the selected node and group are pressed', () => {
    render(canvas({ selected: 'caddy' }));
    expect(document.querySelector('[data-canvas-id="caddy"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-canvas-id="dns"]')!.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows column titles in the columns layout', () => {
    render(canvas({ layout: 'columns', columns: ['Edge', 'Apps layer'] }));
    expect(screen.getByText('Edge')).toBeTruthy();
    expect(screen.getByText('Apps layer')).toBeTruthy();
  });
});

describe('SystemCanvas controls', () => {
  it('has zoom out, zoom in and fit buttons of at least 44px, named from the provider', () => {
    const { rerender } = render(canvas());
    for (const name of ['Zoom out', 'Zoom in', 'Fit to screen']) {
      const b = screen.getByRole('button', { name });
      expect(b.className).toContain('size-11');
    }
    rerender(
      <NishProvider strings={{ zoomOut: 'Réduire', zoomIn: 'Agrandir', fitToScreen: 'Ajuster', followActivity: 'Suivre' }}>{canvas()}</NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Réduire' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Agrandir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajuster' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Suivre' })).toBeTruthy();
  });

  it('Follow activity shows only when some node has an active flag, and toggles', () => {
    const onFollowChange = vi.fn();
    const { rerender } = render(canvas({ onFollowChange }));
    const f = screen.getByRole('button', { name: 'Follow activity' });
    expect(f.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(f);
    expect(onFollowChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Follow activity' }).getAttribute('aria-pressed')).toBe('true');
    const plain: CanvasGroup[] = [{ id: 'g', title: 'G', column: 0, nodes: [{ id: 'n', label: 'N' }] }];
    rerender(<SystemCanvas groups={plain} edges={[]} />);
    expect(screen.queryByRole('button', { name: 'Follow activity' })).toBeNull();
  });

  it('controlled follow ignores clicks for its own state but reports them', () => {
    const onFollowChange = vi.fn();
    render(canvas({ follow: false, onFollowChange }));
    fireEvent.click(screen.getByRole('button', { name: 'Follow activity' }));
    expect(onFollowChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Follow activity' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('the follow caption says what it is looking at, in the labels given', () => {
    vi.useFakeTimers();
    render(
      canvas({
        follow: true,
        labels: { followOne: (g, l) => `Suit · ${g} › ${l}` },
      }),
    );
    act(() => void vi.advanceTimersByTime(0));
    expect(document.querySelector('[data-follow-caption]')!.textContent).toContain('Suit · Apps › Web');
    vi.useRealTimers();
  });

  it('the follow caption has its default English text and a readable note color', () => {
    vi.useFakeTimers();
    render(canvas({ follow: true }));
    act(() => void vi.advanceTimersByTime(0));
    const pill = document.querySelector('[data-follow-caption]')!;
    expect(pill.textContent).toContain('Following · Apps › Web');
    expect(pill.querySelector('.text-th-hi3')).not.toBeNull();
    expect(pill.querySelector('.text-th-ghost')).toBeNull();
    expect(pill.getAttribute('role')).toBeNull();
    expect(pill.getAttribute('aria-live')).toBeNull();
    vi.useRealTimers();
  });

  it('the follow caption announces only mode changes, not each target in a cycle', () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    const target = (id: string, label: string): FollowTarget => ({ id, label, group: 'Apps', box, at: 0 });
    const view = { x: 0, y: 0, k: 1 };
    const one = (t: FollowTarget): FollowStep => ({ mode: 'one', targets: [t], view });
    const labels = { followOne: (g: string, l: string) => `Suit ${g} ${l}`, followIdle: 'Nothing active' } as React.ComponentProps<typeof FollowCaption>['labels'];
    const region = () => screen.getByRole('status');
    const pill = () => document.querySelector('[data-follow-caption]');
    const { rerender } = render(<FollowCaption step={null} labels={labels} />);
    expect(region().textContent).toBe('');
    expect(pill()).toBeNull();
    rerender(<FollowCaption step={one(target('a', 'Web'))} labels={labels} />);
    expect(region().textContent).toBe('Suit Apps Web');
    expect(pill()!.textContent).toContain('Suit Apps Web');
    rerender(<FollowCaption step={one(target('b', 'API'))} labels={labels} />);
    expect(pill()!.textContent).toContain('Suit Apps API');
    expect(region().textContent).toBe('Suit Apps Web');
    rerender(<FollowCaption step={{ mode: 'idle', targets: [], view }} labels={labels} />);
    expect(region().textContent).toBe('Nothing active');
    rerender(<FollowCaption step={null} labels={labels} />);
    expect(region().textContent).toBe('');
  });

  it('the + and - keys zoom, 0 fits, arrows pan', () => {
    // Reduced motion: the view jumps to its target instead of easing there.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    render(canvas());
    const root = screen.getByRole('application');
    const zoom = () => root.querySelector('.nish-canvas-zoom')!.textContent;
    const before = zoom();
    fireEvent.keyDown(root, { key: '+' });
    const zoomedIn = Number.parseInt(zoom()!, 10);
    expect(zoomedIn).toBeGreaterThan(Number.parseInt(before!, 10));
    fireEvent.keyDown(root, { key: '-' });
    fireEvent.keyDown(root, { key: '-' });
    expect(Number.parseInt(zoom()!, 10)).toBeLessThan(Number.parseInt(before!, 10));
    fireEvent.keyDown(root, { key: '0' });
    expect(zoom()).toBe(before);
    const world = root.querySelector<HTMLElement>('.nish-canvas-world')!;
    const x0 = /translate3d\(([-\d.]+)px/.exec(world.style.transform)![1];
    fireEvent.keyDown(root, { key: 'ArrowLeft' });
    const x1 = /translate3d\(([-\d.]+)px/.exec(world.style.transform)![1];
    expect(Number(x1) - Number(x0)).toBe(48);
  });

  it('leaves Ctrl+= / Ctrl+- / Ctrl+0 to the browser page zoom', () => {
    render(canvas());
    const root = screen.getByRole('application');
    const zoom = () => root.querySelector('.nish-canvas-zoom')!.textContent;
    const before = zoom();
    for (const key of ['=', '+', '-', '0']) {
      expect(fireEvent.keyDown(root, { key, ctrlKey: true })).toBe(true);
    }
    expect(zoom()).toBe(before);
  });

  it('lists the connections as text for assistive technology', () => {
    render(canvas());
    const items = Array.from(screen.getByRole('application').querySelectorAll('ul > li')).map((li) => li.textContent);
    expect(items).toContain('Caddy → Web (proxy)');
  });
});

describe('SystemCanvas line legend', () => {
  const kinds = [
    { id: 'traffic', label: 'Traffic' },
    { id: 'deploy', label: 'Deploys', line: 'dashed' as const, hidden: true },
  ];

  it('is absent without kinds', () => {
    render(canvas());
    expect(screen.queryByRole('button', { name: /Lines/ })).toBeNull();
  });

  it('shows how many kinds are hidden, opens a panel and toggles a kind', () => {
    render(canvas({ edgeKinds: kinds }));
    const button = screen.getByRole('button', { name: /Lines/ });
    expect(button.textContent).toContain('· 1 hidden');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    const menu = screen.getByRole('group', { name: 'Lines' });
    const items = within(menu).getAllByRole('switch');
    expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    fireEvent.click(items[1]!);
    expect(screen.getByRole('button', { name: /Lines/ }).textContent).not.toContain('hidden');
  });

  it('Escape closes the panel and returns focus to the button', () => {
    render(canvas({ edgeKinds: kinds }));
    fireEvent.click(screen.getByRole('button', { name: /Lines/ }));
    // Put focus inside the menu first, so the assertion proves it moved back to the button.
    const first = within(screen.getByRole('group', { name: 'Lines' })).getAllByRole('switch')[0]!;
    first.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Lines' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Lines/ }));
  });

  it('the label and the hidden count come from the provider and labels', () => {
    render(
      <NishProvider strings={{ canvasLines: 'Lignes' }}>{canvas({ edgeKinds: kinds, labels: { hidden: (n) => `· ${n} masquée` } })}</NishProvider>,
    );
    const button = screen.getByRole('button', { name: /Lignes/ });
    expect(button.textContent).toContain('· 1 masquée');
    fireEvent.click(button);
    expect(screen.getByRole('group', { name: 'Lignes' })).toBeTruthy();
  });

  it('keeps the legend at the start corner so it follows the reading direction', () => {
    render(canvas({ edgeKinds: kinds }));
    const root = screen.getByRole('button', { name: /Lines/ }).parentElement!;
    expect(root.className).toContain('start-3');
    expect(root.className).not.toContain('left-3');
  });
});

describe('SystemCanvas on the server', () => {
  it('renders to a string without touching the DOM and starts with the same markup', () => {
    const html = renderToString(canvas({ edgeKinds: [{ id: 'traffic', label: 'Traffic' }] }));
    expect(html).toContain('nish-canvas');
    expect(html).toContain('Zoom in');
    expect(html).toContain('Caddy');
  });

  it('hydrates the server markup without a mismatch', async () => {
    const el = canvas({ edgeKinds: [{ id: 'traffic', label: 'Traffic' }] });
    const container = document.createElement('div');
    container.innerHTML = renderToString(el);
    document.body.appendChild(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, el);
    });
    const hydration = errors.mock.calls.filter((c) => /hydrat|did not match|mismatch/i.test(String(c[0])));
    expect(hydration).toEqual([]);
    expect(container.querySelector('.nish-canvas')).not.toBeNull();
    act(() => root?.unmount());
    container.remove();
  });
});

describe('client directives', () => {
  const read = (f: string) => readFileSync(`src/components/canvas/${f}`, 'utf8');
  it.each(['system-canvas.tsx', 'follow.ts', 'follow-caption.tsx', 'legend.tsx', 'minimap.tsx', 'node.tsx'])('%s starts with "use client"', (f) => {
    expect(read(f).trimStart().startsWith("'use client';")).toBe(true);
  });
  it.each(['layout.ts', 'route.ts', 'view.ts', 'types.ts', 'icons.tsx'])('%s has no directive and no hooks', (f) => {
    const src = read(f);
    expect(src).not.toMatch(/^'use client'/);
    expect(src).not.toMatch(/\buse(State|Effect|Ref|Memo|Callback|LayoutEffect)\(/);
  });
});
