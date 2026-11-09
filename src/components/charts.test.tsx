import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarChart, LineChart, RangeBar } from './charts';
import { NishProvider } from './provider';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 400,
    bottom: 200,
    width: 400,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const line = (n: number, f: (i: number) => number | null = (i) => i) => Array.from({ length: n }, (_, i) => ({ x: i, y: f(i) }));
const svg = (c: HTMLElement) => c.querySelector('svg') as SVGSVGElement;
const tip = (c: HTMLElement) => c.querySelector('.pointer-events-none.absolute') as HTMLElement | null;

describe('LineChart', () => {
  it('draws a labelled chart with a polyline and a data table for screen readers', () => {
    const { container } = render(<LineChart label="Sales" data={line(5, (i) => i * 10)} xFormat={(x) => `d${x}`} />);
    expect(svg(container).getAttribute('role')).toBe('img');
    expect(svg(container).getAttribute('aria-label')).toBe('Sales');
    expect(svg(container).getAttribute('tabindex')).toBe('0');
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
    expect(container.querySelector('caption')!.textContent).toBe('Sales');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(container.querySelector('tbody th')!.textContent).toBe('d0');
    expect(container.querySelector('tbody td')!.textContent).toBe('0');
  });
  it('shows nothing but the table until it is measured', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(0);
    const { container } = render(<LineChart label="Sales" data={line(3)} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('table')).not.toBeNull();
  });
  it('shows a skeleton while loading', () => {
    const { container } = render(<LineChart label="Sales" data={line(3)} loading height={120} className="extra" />);
    expect(container.querySelector('svg')).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.height).toBe('120px');
    expect((container.firstElementChild as HTMLElement).className).toContain('extra');
  });
  it('says "no data" with a name, from the strings or your own text', () => {
    const { container, rerender } = render(<LineChart label="Sales" data={[]} height={90} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Sales: no data');
    expect(el.textContent).toBe('No data');
    expect(el.style.height).toBe('90px');
    rerender(<LineChart label="Sales" data={[]} empty="Nothing yet" />);
    expect(container.textContent).toBe('Nothing yet');
    rerender(
      <NishProvider strings={{ noData: 'Aucune donnée', noDataNamed: (l) => `${l} : aucune donnée` }}>
        <LineChart label="Ventes" />
      </NishProvider>,
    );
    expect(container.textContent).toBe('Aucune donnée');
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-label')).toBe('Ventes : aucune donnée');
  });
  it('treats all-null points as no data', () => {
    const { container } = render(<LineChart label="S" data={line(3, () => null)} />);
    expect(container.firstElementChild!.getAttribute('aria-label')).toBe('S: no data');
  });
  it('breaks the line at a gap and draws a lone point as a dot', () => {
    const { container } = render(<LineChart label="S" data={[{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: null }, { x: 3, y: 5 }]} />);
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
    expect(container.querySelectorAll('svg circle')).toHaveLength(1);
  });
  it('draws several series with their labels in the table', () => {
    const { container } = render(
      <LineChart label="S" series={[{ label: 'A', points: line(3) }, { label: 'B', tone: 'loss', points: line(3, (i) => 2 - i) }]} />,
    );
    const lines = container.querySelectorAll('polyline');
    expect(lines).toHaveLength(2);
    expect(lines[0].getAttribute('stroke')).toBe('var(--nish-chart-1)');
    expect(lines[1].getAttribute('stroke')).toBe('var(--nish-loss-fill)');
    expect([...container.querySelectorAll('thead th')].map((t) => t.textContent)).toEqual(['x', 'A', 'B']);
  });
  it.each([
    ['accent', 'var(--nish-accent)'],
    ['ok', 'var(--nish-ok-fill)'],
    ['chart-4', 'var(--nish-chart-4)'],
  ] as const)('colors the single series with tone %s', (tone, color) => {
    const { container } = render(<LineChart label="S" data={line(3)} tone={tone} />);
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe(color);
  });
  it('draws a baseline and an area fill on request', () => {
    const { container } = render(<LineChart label="S" data={line(4)} baseline={2} area />);
    expect(container.querySelector('line[stroke-dasharray]')).not.toBeNull();
    expect(container.querySelectorAll('polygon')).toHaveLength(1);
    expect(container.querySelector('linearGradient, lineargradient')).not.toBeNull();
    const { container: plain } = render(<LineChart label="S" data={line(4)} />);
    expect(plain.querySelector('line[stroke-dasharray]')).toBeNull();
    expect(plain.querySelector('polygon')).toBeNull();
  });
  it('formats axis numbers in the locale prop, the provider locale, else en-US', () => {
    const data = line(3, (i) => 1500 * (i + 1));
    const cell = (c: HTMLElement) => c.querySelector('tbody td')!.textContent;
    expect(cell(render(<LineChart label="S" data={data} />).container)).toBe('1,500');
    cleanup();
    expect(cell(render(<LineChart label="S" data={data} locale="de-DE" />).container)).toBe('1.500');
    cleanup();
    expect(
      cell(
        render(
          <NishProvider locale="de-DE">
            <LineChart label="S" data={data} />
          </NishProvider>,
        ).container,
      ),
    ).toBe('1.500');
    cleanup();
    expect(
      cell(
        render(
          <NishProvider locale="de-DE">
            <LineChart label="S" data={data} locale="en-US" />
          </NishProvider>,
        ).container,
      ),
    ).toBe('1,500');
  });
  it('uses yFormat and xFormat when given', () => {
    const { container } = render(<LineChart label="S" data={line(3)} yFormat={(v) => `$${v}`} xFormat={(v) => `t${v}`} />);
    expect(container.querySelector('tbody td')!.textContent).toBe('$0');
    expect(container.querySelector('tbody th')!.textContent).toBe('t0');
    expect(container.querySelector('text')!.textContent).toMatch(/^\$/);
  });
  it('lists at most 200 rows in the table', () => {
    const { container } = render(<LineChart label="S" data={line(500)} />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(200);
  });

  describe('crosshair', () => {
    const open = (extra = {}) => {
      const r = render(<LineChart label="S" data={line(5, (i) => i * 10)} xFormat={(x) => `x${x}`} {...extra} />);
      return r.container;
    };
    it('moves with the arrow keys and shows a tooltip', () => {
      const c = open();
      expect(tip(c)).toBeNull();
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(tip(c)!.textContent).toContain('x0');
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(tip(c)!.textContent).toContain('x1');
      fireEvent.keyDown(svg(c), { key: 'ArrowLeft' });
      fireEvent.keyDown(svg(c), { key: 'ArrowLeft' });
      fireEvent.keyDown(svg(c), { key: 'ArrowLeft' });
      expect(tip(c)!.textContent).toContain('x0');
      fireEvent.keyDown(svg(c), { key: 'Escape' });
      expect(tip(c)).toBeNull();
    });
    it('starts at the last point with the left arrow and stops at the ends', () => {
      const c = open();
      fireEvent.keyDown(svg(c), { key: 'ArrowLeft' });
      expect(tip(c)!.textContent).toContain('x4');
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(tip(c)!.textContent).toContain('x4');
    });
    it('clears a keyboard tooltip on blur', () => {
      const c = open();
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      fireEvent.blur(svg(c));
      expect(tip(c)).toBeNull();
    });
    it('keeps a pointer tooltip on blur, and follows the pointer', () => {
      const c = open();
      fireEvent.pointerDown(svg(c), { clientX: 0 });
      expect(tip(c)!.textContent).toContain('x0');
      fireEvent.blur(svg(c));
      expect(tip(c)).not.toBeNull();
      fireEvent.pointerMove(svg(c), { clientX: 400 });
      expect(tip(c)!.textContent).toContain('x4');
    });
    it('hides on mouse leave but not on touch leave', () => {
      const c = open();
      fireEvent.pointerDown(svg(c), { clientX: 0 });
      fireEvent.pointerLeave(svg(c), { pointerType: 'touch' });
      expect(tip(c)).not.toBeNull();
      fireEvent.pointerLeave(svg(c), { pointerType: 'mouse' });
      expect(tip(c)).toBeNull();
    });
    it('clears when the next pointer lands outside', () => {
      const c = open();
      fireEvent.pointerDown(svg(c), { clientX: 0 });
      fireEvent.pointerDown(document.body);
      expect(tip(c)).toBeNull();
    });
    it('shows every series value in the tooltip, with labels', () => {
      const { container } = render(
        <LineChart label="S" series={[{ label: 'Alpha', points: line(3) }, { label: 'Beta', points: line(3, (i) => i * 2) }]} />,
      );
      fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
      expect(tip(container)!.textContent).toContain('Alpha');
      expect(tip(container)!.textContent).toContain('Beta');
    });
  });

  describe('right to left', () => {
    const rtl = (ui: React.ReactNode) => render(<NishProvider dir="rtl">{ui}</NishProvider>).container;
    it('swaps the arrow keys', () => {
      const c = rtl(<LineChart label="S" data={line(5)} xFormat={(x) => `x${x}`} />);
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(tip(c)!.textContent).toContain('x4');
      fireEvent.keyDown(svg(c), { key: 'ArrowLeft' });
      expect(tip(c)!.textContent).toContain('x4');
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(tip(c)!.textContent).toContain('x3');
    });
    it('mirrors the plot: the first point is at the right', () => {
      const ltr = render(<LineChart label="S" data={line(3)} />).container;
      const first = (c: HTMLElement) => c.querySelector('polyline')!.getAttribute('points')!.split(' ')[0].split(',').map(Number)[0];
      const left = first(ltr);
      cleanup();
      const right = first(rtl(<LineChart label="S" data={line(3)} />));
      expect(right).toBeGreaterThan(left);
    });
    it('maps the pointer the other way', () => {
      const c = rtl(<LineChart label="S" data={line(5)} xFormat={(x) => `x${x}`} />);
      fireEvent.pointerDown(svg(c), { clientX: 0 });
      expect(tip(c)!.textContent).toContain('x4');
    });
    it('keeps the y labels inside the chart', () => {
      const c = rtl(<LineChart label="S" data={line(5, (i) => i * 1000)} />);
      const labels = [...c.querySelectorAll('svg text')].filter((t) => t.getAttribute('text-anchor') === 'start' && t.getAttribute('dominant-baseline') === 'middle');
      expect(labels.length).toBeGreaterThan(0);
      for (const t of labels) expect(Number(t.getAttribute('x')) + (t.textContent ?? '').length * 6.6).toBeLessThanOrEqual(400);
    });
    it('reads the direction from the element when the provider has none', () => {
      const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ direction: 'rtl' } as CSSStyleDeclaration);
      const { container } = render(<LineChart label="S" data={line(5)} xFormat={(x) => `x${x}`} />);
      fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
      expect(tip(container)!.textContent).toContain('x4');
      spy.mockRestore();
    });
  });

  describe('decimation and memoizing', () => {
    it('keeps a spike in a long series and caps the points at two per pixel column', () => {
      const data = line(5000, (i) => (i === 2500 ? 1000 : 0));
      const { container } = render(<LineChart label="S" data={data} />);
      const pts = container.querySelector('polyline')!.getAttribute('points')!.split(' ');
      expect(pts.length).toBeLessThan(5000);
      expect(pts.length).toBeLessThanOrEqual(2 * 400);
      const ys = pts.map((p) => Number(p.split(',')[1]));
      expect(Math.min(...ys)).toBeLessThan(20);
    });
    it('keeps a dip too', () => {
      const data = line(5000, (i) => (i === 100 ? -1000 : 5));
      const { container } = render(<LineChart label="S" data={data} height={200} />);
      const ys = container.querySelector('polyline')!.getAttribute('points')!.split(' ').map((p) => Number(p.split(',')[1]));
      expect(Math.max(...ys)).toBeGreaterThan(165);
    });
    it('does not decimate a short series', () => {
      const { container } = render(<LineChart label="S" data={line(50)} />);
      expect(container.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(50);
    });
    it('does not sort or rebuild the data when only the hover moves', () => {
      const data = line(300, (i) => Math.sin(i));
      const { container } = render(<LineChart label="S" data={data} />);
      const sort = vi.spyOn(Array.prototype, 'sort');
      const before = container.querySelector('polyline')!.getAttribute('points');
      fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
      fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
      expect(sort).not.toHaveBeenCalled();
      expect(container.querySelector('polyline')!.getAttribute('points')).toBe(before);
    });
  });

  it('forwards ref, className, style and rest to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<LineChart ref={ref} label="S" data={line(3)} className="extra" data-testid="lc" style={{ margin: 2 }} />);
    expect(ref.current).toBe(screen.getByTestId('lc'));
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.style.margin).toBe('2px');
    expect(ref.current?.style.height).toBe('200px');
  });
  it('forwards ref and rest on the empty state too', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LineChart ref={ref} label="S" data={[]} data-testid="lc" />);
    expect(ref.current).toBe(screen.getByTestId('lc'));
  });
});

describe('BarChart', () => {
  const data = [
    { label: 'a', value: 1 },
    { label: 'b', value: 3 },
    { label: 'c', value: -2 },
  ];
  const status = (c: HTMLElement) => c.querySelector('[aria-live="polite"]')!.textContent;

  it('draws a bar per entry with a name and a table', () => {
    const { container } = render(<BarChart label="Counts" data={data} />);
    expect(svg(container).getAttribute('aria-label')).toBe('Counts');
    expect(container.querySelectorAll('svg rect')).toHaveLength(3);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(container.querySelector('caption')!.textContent).toBe('Counts');
    expect([...container.querySelectorAll('tbody td')].map((t) => t.textContent)).toEqual(['1', '3', '-2']);
  });
  it('labels the ends by default and every bar on request', () => {
    const { container, rerender } = render(<BarChart label="C" data={data} />);
    const labels = () => [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(labels()).toEqual(['a', 'c']);
    rerender(<BarChart label="C" data={data} xTicks="all" />);
    expect(labels()).toEqual(['a', 'b', 'c']);
  });
  it('prints values with showValues always, not otherwise', () => {
    const { container, rerender } = render(<BarChart label="C" data={data} />);
    expect([...container.querySelectorAll('svg text')].map((t) => t.textContent)).not.toContain('3');
    rerender(<BarChart label="C" data={data} showValues="always" />);
    expect([...container.querySelectorAll('svg text')].map((t) => t.textContent)).toEqual(expect.arrayContaining(['1', '3', '-2']));
  });
  it('prints values on touch screens when they fit', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} })) as never;
    const { container } = render(<BarChart label="C" data={data} />);
    expect([...container.querySelectorAll('svg text')].map((t) => t.textContent)).toEqual(expect.arrayContaining(['3']));
  });
  it('selects with the arrow keys and announces label and value', () => {
    const { container } = render(<BarChart label="C" data={data} valueFormat={(v) => `${v}!`} />);
    expect(status(container)).toBe('');
    fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
    expect(status(container)).toBe('a: 1!');
    fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
    expect(status(container)).toBe('b: 3!');
    fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
    fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
    expect(status(container)).toBe('c: -2!');
    fireEvent.keyDown(svg(container), { key: 'ArrowLeft' });
    expect(status(container)).toBe('b: 3!');
    fireEvent.keyDown(svg(container), { key: 'Escape' });
    expect(status(container)).toBe('');
  });
  it('starts at the last bar with the left arrow', () => {
    const { container } = render(<BarChart label="C" data={data} />);
    fireEvent.keyDown(svg(container), { key: 'ArrowLeft' });
    expect(status(container)).toBe('c: -2');
  });
  it('selects with the pointer and clears on mouse leave', () => {
    const { container } = render(<BarChart label="C" data={data} />);
    fireEvent.pointerDown(svg(container), { clientX: 399 });
    expect(status(container)).toBe('c: -2');
    fireEvent.pointerMove(svg(container), { clientX: 0, pointerType: 'mouse' });
    expect(status(container)).toBe('a: 1');
    fireEvent.pointerLeave(svg(container), { pointerType: 'touch' });
    expect(status(container)).toBe('a: 1');
    fireEvent.pointerLeave(svg(container), { pointerType: 'mouse' });
    expect(status(container)).toBe('');
  });
  it('ignores a touch move without a pressed button', () => {
    const { container } = render(<BarChart label="C" data={data} />);
    fireEvent.pointerMove(svg(container), { clientX: 0, pointerType: 'touch', buttons: 0 });
    expect(status(container)).toBe('');
    fireEvent.pointerMove(svg(container), { clientX: 0, pointerType: 'touch', buttons: 1 });
    expect(status(container)).toBe('a: 1');
  });
  it('dims the other bars while one is selected', () => {
    const { container } = render(<BarChart label="C" data={data} />);
    fireEvent.keyDown(svg(container), { key: 'ArrowRight' });
    const opacities = [...container.querySelectorAll('svg rect')].map((r) => r.getAttribute('opacity'));
    expect(opacities).toEqual(['1', '0.55', '0.55']);
  });
  it('treats non-finite values as zero', () => {
    const { container } = render(<BarChart label="C" data={[{ label: 'a', value: Number.NaN }, { label: 'b', value: 2 }]} />);
    expect([...container.querySelectorAll('tbody td')].map((t) => t.textContent)).toEqual(['0', '2']);
  });
  it('colors bars by tone', () => {
    const { container } = render(<BarChart label="C" data={data} tone="loss" />);
    expect(container.querySelector('rect')!.getAttribute('fill')).toBe('var(--nish-loss-fill)');
  });
  it('says "no data" with a name, from the strings or your own text', () => {
    const { container, rerender } = render(<BarChart label="C" data={[]} height={50} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('C: no data');
    expect(el.textContent).toBe('No data');
    expect(el.style.height).toBe('50px');
    rerender(<BarChart label="C" data={[]} empty="None" />);
    expect(container.textContent).toBe('None');
    rerender(
      <NishProvider strings={{ noData: 'Vide', noDataNamed: (l) => `${l} vide` }}>
        <BarChart label="C" data={[]} />
      </NishProvider>,
    );
    expect(container.textContent).toBe('Vide');
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-label')).toBe('C vide');
  });
  it('formats values in the locale', () => {
    const big = [{ label: 'a', value: 12345 }];
    expect(render(<BarChart label="C" data={big} />).container.querySelector('tbody td')!.textContent).toBe('12,345');
    cleanup();
    expect(render(<BarChart label="C" data={big} locale="de-DE" />).container.querySelector('tbody td')!.textContent).toBe('12.345');
  });
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<BarChart ref={ref} label="C" data={data} className="extra" data-testid="bc" />);
    expect(ref.current).toBe(screen.getByTestId('bc'));
    expect(ref.current?.className).toContain('extra');
  });

  it('survives data shrinking under a selected bar', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ label: `d${i}`, value: i + 1 }));
    const { container, rerender } = render(<BarChart label="C" data={many} />);
    fireEvent.keyDown(svg(container), { key: 'ArrowLeft' });
    expect(status(container)).toBe('d9: 10');
    rerender(<BarChart label="C" data={many.slice(0, 3)} />);
    expect(status(container)).toBe('');
  });

  describe('right to left', () => {
    const rtl = (ui: React.ReactNode) => render(<NishProvider dir="rtl">{ui}</NishProvider>).container;
    it('puts the first bar at the right and swaps the arrow keys', () => {
      const c = rtl(<BarChart label="C" data={data} />);
      const xs = [...c.querySelectorAll('svg rect')].map((r) => Number(r.getAttribute('x')));
      expect(xs[0]).toBeGreaterThan(xs[2]);
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(status(c)).toBe('c: -2');
      fireEvent.keyDown(svg(c), { key: 'ArrowRight' });
      expect(status(c)).toBe('b: 3');
    });
    it('maps the pointer the other way and moves the end labels', () => {
      const c = rtl(<BarChart label="C" data={data} />);
      fireEvent.pointerDown(svg(c), { clientX: 399 });
      expect(status(c)).toBe('a: 1');
      const texts = [...c.querySelectorAll('svg text')].slice(-2);
      expect(texts[0].textContent).toBe('a');
      expect(texts[0].getAttribute('text-anchor')).toBe('end');
      expect(texts[1].getAttribute('text-anchor')).toBe('start');
    });
  });
});

describe('RangeBar', () => {
  it('names the range, the current value and the bounds', () => {
    render(<RangeBar min={0} max={1000} low={100} high={1500} current={250} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Range 100 to 1,500, current 250, within 0 to 1,000');
  });
  it('leaves out the current value when there is none', () => {
    render(<RangeBar min={0} max={10} low={1} high={2} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Range 1 to 2, within 0 to 10');
  });
  it('uses your label, and the locale for numbers', () => {
    const { rerender } = render(<RangeBar min={0} max={10} low={1} high={2} label="Tagesbereich" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Tagesbereich');
    rerender(<RangeBar min={0} max={10} low={1.5} high={2} locale="de-DE" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('1,5');
    rerender(
      <NishProvider locale="de-DE">
        <RangeBar min={0} max={10} low={1.5} high={2} />
      </NishProvider>,
    );
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('1,5');
  });
  const parts = (c: HTMLElement) => {
    const root = c.firstElementChild as HTMLElement;
    return { root, seg: root.firstElementChild as HTMLElement, dot: root.querySelector('span') as HTMLElement | null };
  };
  const css = (el: HTMLElement) => el.getAttribute('style') ?? '';
  it('positions the segment and the dot from the start edge', () => {
    const { seg, dot } = parts(render(<RangeBar min={0} max={100} low={20} high={60} current={40} />).container);
    expect(css(seg)).toContain('inset-inline-start: 20%');
    expect(css(seg)).toContain('width: 40%');
    expect(css(dot!)).toContain('inset-inline-start: 40%');
  });
  it('keeps a minimum segment width and clamps the dot to the track', () => {
    const { seg, dot } = parts(render(<RangeBar min={0} max={100} low={50} high={50} current={500} />).container);
    expect(css(seg)).toContain('width: 1%');
    expect(css(dot!)).toContain('inset-inline-start: 100%');
  });
  it('orders low and high', () => {
    const { seg } = parts(render(<RangeBar min={0} max={100} low={60} high={20} />).container);
    expect(css(seg)).toContain('inset-inline-start: 20%');
    expect(css(seg)).toContain('width: 40%');
  });
  it('has no dot without a current value', () => {
    expect(parts(render(<RangeBar min={0} max={100} low={1} high={2} />).container).dot).toBeNull();
  });
  it('handles an empty span', () => {
    const { seg } = parts(render(<RangeBar min={5} max={5} low={5} high={5} current={5} />).container);
    expect(css(seg)).toContain('inset-inline-start: 0%');
  });
  it('mirrors and shows in forced colors', () => {
    const { root, seg, dot } = parts(render(<RangeBar min={0} max={1} low={0} high={1} current={0.5} />).container);
    expect(seg.className).toContain('rtl:bg-gradient-to-l');
    expect(seg.className).toContain('forced-colors:bg-[color:Highlight]');
    expect(dot!.className).toContain('rtl:translate-x-1/2');
    expect(root.className).toContain('forced-colors:bg-[color:GrayText]');
  });
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RangeBar ref={ref} min={0} max={1} low={0} high={1} className="extra" data-testid="rb" />);
    expect(ref.current).toBe(screen.getByTestId('rb'));
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.className).toContain('rounded-full');
  });
});

describe('server rendering', () => {
  it('renders the charts to a string without throwing', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <>
        <LineChart label="L" data={line(5)} />
        <BarChart label="B" data={[{ label: 'a', value: 1 }]} />
        <RangeBar min={0} max={1} low={0} high={1} />
        <LineChart label="E" data={[]} />
      </>,
    );
    expect(html).toContain('<table');
    expect(html).toContain('Range 0 to 1');
    expect(html).toContain('E: no data');
  });
});
