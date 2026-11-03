import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NishProvider } from '../provider';
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
    expect(screen.getByRole('status').textContent).toContain('Suit · Apps › Web');
    vi.useRealTimers();
  });

  it('the follow caption has its default English text and a readable note color', () => {
    vi.useFakeTimers();
    render(canvas({ follow: true }));
    act(() => void vi.advanceTimersByTime(0));
    expect(screen.getByRole('status').textContent).toContain('Following · Apps › Web');
    expect(document.querySelector('[role="status"] .text-th-hi3')).not.toBeNull();
    expect(document.querySelector('[role="status"] .text-th-ghost')).toBeNull();
    vi.useRealTimers();
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

  it('shows how many kinds are hidden, opens a menu and toggles a kind', () => {
    render(canvas({ edgeKinds: kinds }));
    const button = screen.getByRole('button', { name: /Lines/ });
    expect(button.textContent).toContain('· 1 hidden');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    const menu = screen.getByRole('menu', { name: 'Lines' });
    const items = within(menu).getAllByRole('menuitemcheckbox');
    expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    fireEvent.click(items[1]!);
    expect(screen.getByRole('button', { name: /Lines/ }).textContent).not.toContain('hidden');
  });

  it('Escape closes the menu and returns focus to the button', () => {
    render(canvas({ edgeKinds: kinds }));
    fireEvent.click(screen.getByRole('button', { name: /Lines/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('the label and the hidden count come from the provider and labels', () => {
    render(
      <NishProvider strings={{ canvasLines: 'Lignes' }}>{canvas({ edgeKinds: kinds, labels: { hidden: (n) => `· ${n} masquée` } })}</NishProvider>,
    );
    const button = screen.getByRole('button', { name: /Lignes/ });
    expect(button.textContent).toContain('· 1 masquée');
    fireEvent.click(button);
    expect(screen.getByRole('menu', { name: 'Lignes' })).toBeTruthy();
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
