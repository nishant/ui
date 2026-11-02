import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { presetsFor } from '../split-layout';
import { LayoutPresetPicker, SplitDividers, SplitStage, presetOptions } from './split';

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
  HTMLElement.prototype.hasPointerCapture = () => false;
});
afterEach(() => {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
});

const presets = presetsFor(3);
const items = ['a', 'b', 'c'];

describe('SplitStage', () => {
  it('keeps DOM nodes and order across a slot swap and preset change', () => {
    const pane = (id: string) => <span>{id}</span>;
    const first = presets[0]!.build();
    const { container, rerender } = render(
      <SplitStage layout={first} items={items} slots={['a', 'b', 'c']} renderPane={pane} />,
    );
    const before = [...container.querySelectorAll<HTMLElement>('[data-split-pane]')];
    expect(before.map((n) => n.dataset.splitPane)).toEqual(items);
    const leftA = before[0]!.style.left + before[0]!.style.top;
    rerender(
      <SplitStage layout={presets[1]!.build()} items={items} slots={['c', 'b', 'a']} renderPane={pane} />,
    );
    const after = [...container.querySelectorAll<HTMLElement>('[data-split-pane]')];
    expect(after).toHaveLength(3);
    after.forEach((n, i) => expect(n).toBe(before[i]));
    expect(after[0]!.style.left + after[0]!.style.top).not.toBe(leftA);
  });

  it('clears data-dragging when the dividers unmount mid-drag', () => {
    const layout = presets[0]!.build();
    const props = { layout, items, renderPane: (id: string) => <span>{id}</span> };
    const { container, rerender } = render(
      <SplitStage {...props} slots={items} resizable onLayoutChange={() => {}} />,
    );
    const sep = screen.getAllByRole('separator')[0]!;
    fireEvent.pointerDown(sep, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    expect(container.firstElementChild!.hasAttribute('data-dragging')).toBe(true);
    rerender(<SplitStage {...props} slots={items} resizable={false} />);
    expect(container.firstElementChild!.hasAttribute('data-dragging')).toBe(false);
  });
});

describe('SplitDividers', () => {
  it('reports the end of a drag on unmount', () => {
    const onDragChange = vi.fn();
    const { unmount } = render(
      <div style={{ position: 'relative' }}>
        <SplitDividers layout={presets[0]!.build()} w={800} h={450} gap={4} onResize={() => {}} onDragChange={onDragChange} />
      </div>,
    );
    fireEvent.pointerDown(screen.getAllByRole('separator')[0]!, { button: 0, pointerId: 1 });
    unmount();
    expect(onDragChange).toHaveBeenLastCalledWith(false);
  });
});

describe('LayoutPresetPicker', () => {
  it('uses a roving tabindex and arrow keys', () => {
    const options = presetOptions(3);
    const onChange = vi.fn();
    render(<LayoutPresetPicker options={options} value={options[0]!.id} onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.tabIndex)).toEqual(radios.map((_, i) => (i === 0 ? 0 : -1)));
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(options[1]!.id);
  });
});
