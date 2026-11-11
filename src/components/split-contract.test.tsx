import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutNode } from '../split-layout';
import { presetsFor } from '../split-layout';
import { NishProvider } from './provider';
import { LayoutPresetIcon, LayoutPresetPicker, SplitDividers, SplitStage, presetOptions } from './split';

const leaf = (slot: number): LayoutNode => ({ type: 'leaf', slot });
const two = (dir: 'row' | 'col', a = 0.5): LayoutNode => ({ type: 'split', dir, sizes: [a, 1 - a], children: [leaf(0), leaf(1)] });
const three: LayoutNode = {
  type: 'split',
  dir: 'row',
  sizes: [0.25, 0.25, 0.5],
  children: [leaf(0), leaf(1), leaf(2)],
};

const frame = (node: React.ReactNode) => <div style={{ position: 'relative' }}>{node}</div>;
const sizesOf = (n: LayoutNode): number[] => (n.type === 'split' ? n.sizes : []);

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 450 });
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
  HTMLElement.prototype.hasPointerCapture = () => true;
});
afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
});

describe('SplitDividers accessibility', () => {
  it('in a split of three, each divider reports where it sits', () => {
    render(frame(<SplitDividers layout={three} w={800} h={450} gap={4} onResize={() => {}} />));
    expect(screen.getAllByRole('separator').map((d) => d.getAttribute('aria-valuenow'))).toEqual(['25', '50']);
  });

  it('each divider reports its position as a percentage with a text value', () => {
    render(frame(<SplitDividers layout={two('row', 0.4)} w={800} h={450} gap={4} onResize={() => {}} />));
    const sep = screen.getByRole('separator');
    expect(sep.getAttribute('aria-valuenow')).toBe('40');
    expect(sep.getAttribute('aria-valuetext')).toBe('40%');
    expect(sep.getAttribute('aria-valuemin')).toBe('0');
    expect(sep.getAttribute('aria-valuemax')).toBe('100');
    expect(sep.getAttribute('aria-orientation')).toBe('vertical');
    expect(sep.tabIndex).toBe(0);
  });

  it('a column split is a horizontal separator named for rows', () => {
    render(frame(<SplitDividers layout={two('col')} w={800} h={450} gap={4} onResize={() => {}} />));
    const sep = screen.getByRole('separator');
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
    expect(sep.getAttribute('aria-label')).toBe('Resize rows');
  });

  it('a lone divider keeps the plain name; several in one direction are numbered', () => {
    const { rerender } = render(frame(<SplitDividers layout={two('row')} w={800} h={450} gap={4} onResize={() => {}} />));
    expect(screen.getByRole('separator').getAttribute('aria-label')).toBe('Resize columns');
    rerender(frame(<SplitDividers layout={three} w={800} h={450} gap={4} onResize={() => {}} />));
    const names = screen.getAllByRole('separator').map((s) => s.getAttribute('aria-label'));
    expect(names).toEqual(['Resize columns 1', 'Resize columns 2']);
    expect(new Set(names).size).toBe(names.length);
  });

  it('a row split with a column split inside has different names for the two directions', () => {
    const nested: LayoutNode = {
      type: 'split',
      dir: 'row',
      sizes: [0.5, 0.5],
      children: [leaf(0), { type: 'split', dir: 'col', sizes: [0.5, 0.5], children: [leaf(1), leaf(2)] }],
    };
    render(frame(<SplitDividers layout={nested} w={800} h={450} gap={4} onResize={() => {}} />));
    const names = screen.getAllByRole('separator').map((s) => s.getAttribute('aria-label'));
    expect(names.sort()).toEqual(['Resize columns', 'Resize rows']);
  });

  it('names come from the provider', () => {
    render(
      <NishProvider strings={{ resizeColumns: 'Redimensionner les colonnes', resizeRows: 'Redimensionner les lignes' }}>
        {frame(<SplitDividers layout={three} w={800} h={450} gap={4} onResize={() => {}} />)}
      </NishProvider>,
    );
    expect(screen.getAllByRole('separator')[1]!.getAttribute('aria-label')).toBe('Redimensionner les colonnes 2');
  });

  it('aria-controls lists the panes on both sides when paneId is given, and is absent otherwise', () => {
    const { rerender } = render(
      frame(<SplitDividers layout={three} w={800} h={450} gap={4} onResize={() => {}} paneId={(slot) => `pane-${slot}`} />),
    );
    const [a, b] = screen.getAllByRole('separator');
    expect(a!.getAttribute('aria-controls')).toBe('pane-0 pane-1');
    expect(b!.getAttribute('aria-controls')).toBe('pane-1 pane-2');
    rerender(frame(<SplitDividers layout={three} w={800} h={450} gap={4} onResize={() => {}} />));
    expect(screen.getAllByRole('separator')[0]!.hasAttribute('aria-controls')).toBe(false);
  });

  it('aria-controls includes every pane of a nested side', () => {
    const nested: LayoutNode = {
      type: 'split',
      dir: 'row',
      sizes: [0.5, 0.5],
      children: [leaf(0), { type: 'split', dir: 'col', sizes: [0.5, 0.5], children: [leaf(1), leaf(2)] }],
    };
    render(frame(<SplitDividers layout={nested} w={800} h={450} gap={4} onResize={() => {}} paneId={(s) => `p${s}`} />));
    const rowSep = screen.getAllByRole('separator').find((s) => s.getAttribute('aria-orientation') === 'vertical')!;
    expect(rowSep.getAttribute('aria-controls')).toBe('p0 p1 p2');
  });

  it('SplitStage gives its panes ids and each divider points at real elements', () => {
    const layout = presetsFor(2)[0]!.build();
    const { container } = render(
      <SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} resizable renderPane={(id) => <span>{id}</span>} />,
    );
    const sep = screen.getByRole('separator');
    const ids = sep.getAttribute('aria-controls')!.split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(container.querySelector(`#${CSS.escape(id)}`)).not.toBeNull();
  });
});

describe('SplitDividers keyboard', () => {
  const press = (layout: LayoutNode, key: string, extra: Partial<React.ComponentProps<typeof SplitDividers>> = {}) => {
    const onResize = vi.fn();
    render(frame(<SplitDividers layout={layout} w={800} h={450} gap={4} onResize={onResize} {...extra} />));
    const event = fireEvent.keyDown(screen.getAllByRole('separator')[0]!, { key });
    return { onResize, event };
  };

  it('ArrowRight grows the first pane by 2% and ArrowLeft shrinks it (columns)', () => {
    const grow = press(two('row'), 'ArrowRight').onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(grow)[0]).toBeCloseTo(0.52, 2);
    cleanup();
    const shrink = press(two('row'), 'ArrowLeft').onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(shrink)[0]).toBeCloseTo(0.48, 2);
  });

  it('ArrowDown and ArrowUp move a row divider', () => {
    expect(sizesOf(press(two('col'), 'ArrowDown').onResize.mock.calls[0]![0])[0]).toBeCloseTo(0.52, 2);
    cleanup();
    expect(sizesOf(press(two('col'), 'ArrowUp').onResize.mock.calls[0]![0])[0]).toBeCloseTo(0.48, 2);
  });

  it('vertical arrows do nothing to a column divider and horizontal ones nothing to a row divider', () => {
    expect(press(two('row'), 'ArrowDown').onResize).not.toHaveBeenCalled();
    cleanup();
    expect(press(two('col'), 'ArrowRight').onResize).not.toHaveBeenCalled();
  });

  it('prevents the default of the keys it handles and leaves other keys alone', () => {
    expect(press(two('row'), 'ArrowRight').event).toBe(false);
    cleanup();
    expect(press(two('row'), 'a').event).toBe(true);
    cleanup();
    expect(press(two('row'), 'a').onResize).not.toHaveBeenCalled();
  });

  it('Home moves the first pane to its smallest and End to its largest', () => {
    const min = press(two('row'), 'Home').onResize.mock.calls[0]![0] as LayoutNode;
    // The minimum pane width is 160px of the 796px of pane room.
    expect(sizesOf(min)[0]).toBeCloseTo(160 / 796, 2);
    cleanup();
    const max = press(two('row'), 'End').onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(max)[1]).toBeCloseTo(160 / 796, 2);
    expect(sizesOf(max)[0]! + sizesOf(max)[1]!).toBeCloseTo(1, 5);
  });

  it('Home respects minPane, capped at half of an equal share so the divider can always move', () => {
    const wide = press(two('row'), 'Home', { minPane: { w: 300, h: 90 } }).onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(wide)[0]).toBeCloseTo(0.25, 2);
    cleanup();
    const small = press(two('row'), 'Home', { minPane: { w: 100, h: 90 } }).onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(small)[0]).toBeCloseTo(100 / 796, 2);
  });

  it('Home and End on a row divider use the height minimum', () => {
    const min = press(two('col'), 'Home').onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(min)[0]).toBeCloseTo(90 / 446, 2);
  });

  it('Enter and a double-click reset that split to equal sizes', () => {
    const onResize = vi.fn();
    render(frame(<SplitDividers layout={two('row', 0.3)} w={800} h={450} gap={4} onResize={onResize} />));
    const sep = screen.getByRole('separator');
    fireEvent.keyDown(sep, { key: 'Enter' });
    fireEvent.doubleClick(sep);
    expect(onResize).toHaveBeenCalledTimes(2);
    for (const call of onResize.mock.calls) expect(sizesOf(call[0] as LayoutNode)).toEqual([0.5, 0.5]);
  });

  it('a mirrored area swaps the horizontal arrows', () => {
    const grow = press(two('row'), 'ArrowLeft', { rtl: true }).onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(grow)[0]).toBeCloseTo(0.52, 2);
    cleanup();
    const shrink = press(two('row'), 'ArrowRight', { rtl: true }).onResize.mock.calls[0]![0] as LayoutNode;
    expect(sizesOf(shrink)[0]).toBeCloseTo(0.48, 2);
    cleanup();
    expect(sizesOf(press(two('col'), 'ArrowDown', { rtl: true }).onResize.mock.calls[0]![0])[0]).toBeCloseTo(0.52, 2);
  });
});

describe('SplitDividers pointer and layout', () => {
  it('a drag to the right grows the first pane; mirrored, it shrinks', () => {
    const run = (rtl: boolean) => {
      const onResize = vi.fn();
      const { unmount } = render(frame(<SplitDividers layout={two('row')} w={800} h={450} gap={4} onResize={onResize} rtl={rtl} />));
      const sep = screen.getByRole('separator');
      fireEvent.pointerDown(sep, { button: 0, pointerId: 1, clientX: 400, clientY: 100 });
      fireEvent.pointerMove(sep, { pointerId: 1, clientX: 440, clientY: 100 });
      fireEvent.pointerUp(sep, { pointerId: 1, clientX: 440, clientY: 100 });
      unmount();
      return sizesOf(onResize.mock.calls.at(-1)![0] as LayoutNode)[0]!;
    };
    expect(run(false)).toBeGreaterThan(0.5);
    expect(run(true)).toBeLessThan(0.5);
  });

  it('ignores other pointers, other buttons and a move with no drag', () => {
    const onResize = vi.fn();
    const onDragChange = vi.fn();
    render(frame(<SplitDividers layout={two('row')} w={800} h={450} gap={4} onResize={onResize} onDragChange={onDragChange} />));
    const sep = screen.getByRole('separator');
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 500, clientY: 100 });
    fireEvent.pointerDown(sep, { button: 2, pointerId: 1, clientX: 400, clientY: 100 });
    expect(onDragChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(sep, { button: 0, pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerMove(sep, { pointerId: 2, clientX: 500, clientY: 100 });
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 400, clientY: 100 });
    expect(onResize).not.toHaveBeenCalled();
    fireEvent.pointerUp(sep, { pointerId: 2 });
    expect(onDragChange).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(sep, { pointerId: 1 });
    expect(onDragChange).toHaveBeenLastCalledWith(false);
  });

  it('a mirrored divider sits at the mirrored position', () => {
    const left = (rtl: boolean) => {
      const { unmount } = render(frame(<SplitDividers layout={two('row', 0.25)} w={800} h={450} gap={4} onResize={() => {}} rtl={rtl} />));
      const v = parseFloat(screen.getByRole('separator').style.left);
      unmount();
      return v;
    };
    const normal = left(false);
    const mirrored = left(true);
    // Each left is the divider's x minus 10 (a 24px hit area around a 4px gap); mirroring maps x to w - x - 4.
    expect(normal + mirrored).toBeCloseTo(800 - 4 - 20, 0);
    expect(mirrored).toBeGreaterThan(normal);
  });

  it('the hit area is 24px, and 44px on a coarse pointer', () => {
    const width = () => {
      const { unmount } = render(frame(<SplitDividers layout={two('row')} w={800} h={450} gap={4} onResize={() => {}} />));
      const v = parseFloat(screen.getByRole('separator').style.width);
      unmount();
      return v;
    };
    expect(width()).toBe(24);
    window.matchMedia = ((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    expect(width()).toBe(44);
  });
});

describe('SplitStage root element', () => {
  it('puts ref, className, id and rest props on the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <SplitStage ref={ref} className="mine" id="stage" data-testid="stage" layout={null} items={[]} slots={[]} renderPane={() => null} />,
    );
    const root = screen.getByTestId('stage');
    expect(container.firstElementChild).toBe(root);
    expect(ref.current).toBe(root);
    expect(root.id).toBe('stage');
    expect(root.className).toContain('mine');
    expect(root.className).toContain('relative');
  });

  it('a function ref gets the element too', () => {
    const calls: Array<HTMLDivElement | null> = [];
    const { unmount } = render(<SplitStage ref={(n) => void calls.push(n)} layout={null} items={[]} slots={[]} renderPane={() => null} />);
    expect(calls[0]).toBeInstanceOf(HTMLDivElement);
    unmount();
    expect(calls.at(-1)).toBeNull();
  });

  it('renders no panes without a layout and reports the measured size', () => {
    const onSize = vi.fn();
    const { container } = render(<SplitStage layout={null} items={['a']} slots={['a']} renderPane={() => <i />} onSize={onSize} />);
    expect(container.querySelectorAll('[data-split-pane]')).toHaveLength(0);
    expect(onSize).toHaveBeenLastCalledWith({ w: 800, h: 450 });
    expect(onSize).not.toHaveBeenCalledWith({ w: 0, h: 0 });
  });

  it('skips items that are not in a slot', () => {
    const { container } = render(
      <SplitStage layout={presetsFor(2)[0]!.build()} items={['a', 'b', 'c']} slots={['a', 'b']} renderPane={(id) => <span>{id}</span>} />,
    );
    expect([...container.querySelectorAll<HTMLElement>('[data-split-pane]')].map((n) => n.dataset.splitPane)).toEqual(['a', 'b']);
  });

  it('shows dividers only when resizable with more than one slot', () => {
    const layout = presetsFor(2)[0]!.build();
    const { rerender } = render(<SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} renderPane={() => null} />);
    expect(screen.queryAllByRole('separator')).toHaveLength(0);
    rerender(<SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} renderPane={() => null} resizable />);
    expect(screen.getAllByRole('separator')).toHaveLength(1);
    rerender(<SplitStage layout={{ type: 'leaf', slot: 0 }} items={['a']} slots={['a']} renderPane={() => null} resizable />);
    expect(screen.queryAllByRole('separator')).toHaveLength(0);
  });

  it('forwards a divider move to onLayoutChange', () => {
    const onLayoutChange = vi.fn();
    render(
      <SplitStage layout={presetsFor(2)[0]!.build()} items={['a', 'b']} slots={['a', 'b']} renderPane={() => null} resizable onLayoutChange={onLayoutChange} />,
    );
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('data-dragging is set by the dragging prop', () => {
    const { container } = render(<SplitStage layout={null} items={[]} slots={[]} renderPane={() => null} dragging />);
    expect(container.firstElementChild!.hasAttribute('data-dragging')).toBe(true);
  });

  it('panes animate unless animate is false, a drag is on, or motion is reduced', () => {
    const layout = presetsFor(2)[0]!.build();
    const transition = (props: object) => {
      const { container, unmount } = render(<SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} renderPane={() => null} {...props} />);
      const v = container.querySelector<HTMLElement>('[data-split-pane]')!.style.transition;
      unmount();
      return v;
    };
    expect(transition({})).toContain('180ms');
    expect(transition({ animate: false })).toBe('none');
    expect(transition({ dragging: true })).toBe('none');
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    expect(transition({})).toBe('none');
  });

  it('mirrors pane positions in a right-to-left area', () => {
    const layout = presetsFor(2)[0]!.build();
    const { container } = render(
      <div style={{ direction: 'rtl' }}>
        <SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} renderPane={() => null} />
      </div>,
    );
    const panes = [...container.querySelectorAll<HTMLElement>('[data-split-pane]')];
    const [a, b] = panes.map((p) => parseFloat(p.style.left));
    // Pane a is the first slot: it sits at the right edge when mirrored.
    expect(a!).toBeGreaterThan(b!);
    expect(parseFloat(panes[0]!.style.left) + parseFloat(panes[0]!.style.width)).toBeCloseTo(800, 0);
  });
});

describe('LayoutPresetIcon', () => {
  it('is decorative, takes svg props and ref, and draws one rect per pane', () => {
    const ref = { current: null as SVGSVGElement | null };
    const { container } = render(
      <LayoutPresetIcon node={presetsFor(3)[0]!.build()} ref={ref} className="mine" data-testid="icon" width={30} height={20} />,
    );
    const svg = screen.getByTestId('icon');
    expect(ref.current).toBe(svg);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('class')).toBe('mine');
    expect(svg.getAttribute('viewBox')).toBe('0 0 30 20');
    expect(container.querySelectorAll('rect')).toHaveLength(3);
  });
});

describe('LayoutPresetPicker contract', () => {
  const options = presetOptions(3).slice(0, 3);

  it('puts ref, className and rest props on the bar', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<LayoutPresetPicker options={options} value={null} onChange={() => {}} ref={ref} className="mine" data-testid="bar" />);
    const bar = screen.getByTestId('bar');
    expect(ref.current).toBe(bar);
    expect(bar.className).toContain('mine');
  });

  it('names the group from the label, then the provider string', () => {
    const { rerender } = render(<LayoutPresetPicker options={options} value={null} onChange={() => {}} />);
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Layout presets');
    rerender(<LayoutPresetPicker options={options} value={null} onChange={() => {}} label="Disposition" />);
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Disposition');
    rerender(
      <NishProvider strings={{ layoutPresets: 'Dispositions' }}>
        <LayoutPresetPicker options={options} value={null} onChange={() => {}} />
      </NishProvider>,
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Dispositions');
  });

  it('marks the chosen option with aria-checked and data-state', () => {
    render(<LayoutPresetPicker options={options} value={options[1]!.id} onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios.map((r) => r.getAttribute('data-state'))).toEqual(['unchecked', 'checked', 'unchecked']);
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('names each radio with its label and hint', () => {
    render(<LayoutPresetPicker options={options} value={null} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')[0]!.getAttribute('aria-label')).toBe(`${options[0]!.label}: ${options[0]!.hint}`);
  });

  it('arrow keys move and wrap; Home and End jump; up and down work too', () => {
    const onChange = vi.fn();
    const { rerender } = render(<LayoutPresetPicker options={options} value={options[2]!.id} onChange={onChange} />);
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(options[0]!.id);
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(options[0]!.id);
    rerender(<LayoutPresetPicker options={options} value={options[0]!.id} onChange={onChange} />);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(options[2]!.id);
    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(options[2]!.id);
    fireEvent.keyDown(group, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(options[2]!.id);
    fireEvent.keyDown(group, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(options[0]!.id);
    onChange.mockClear();
    fireEvent.keyDown(group, { key: 'x' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves focus to the option it selects', () => {
    render(<LayoutPresetPicker options={options} value={options[0]!.id} onChange={() => {}} />);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });
    expect(document.activeElement).toBe(screen.getAllByRole('radio')[2]);
  });

  it('in a right-to-left page ArrowLeft goes to the next option', () => {
    const onChange = vi.fn();
    render(
      <div style={{ direction: 'rtl' }}>
        <LayoutPresetPicker options={options} value={options[0]!.id} onChange={onChange} />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(options[1]!.id);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(options[2]!.id);
  });

  it('clicking an option selects it', () => {
    const onChange = vi.fn();
    render(<LayoutPresetPicker options={options} value={null} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('radio')[1]!);
    expect(onChange).toHaveBeenCalledWith(options[1]!.id);
  });

  it('shows actions always and the note only from lg', () => {
    render(<LayoutPresetPicker options={options} value={null} onChange={() => {}} actions={<button>Equal</button>} note="Drag the lines" />);
    expect(screen.getByRole('button', { name: 'Equal' })).toBeTruthy();
    expect(screen.getByText('Drag the lines').className).toContain('lg:block');
  });

  it('does nothing on a key press with no options', () => {
    const onChange = vi.fn();
    render(<LayoutPresetPicker options={[]} value={null} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
