import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from './forms';
import { NishProvider } from './provider';
import { Slider } from './slider';

afterEach(cleanup);

const thumbs = () => screen.getAllByRole('slider');

/** Gives the track a 200px box at x=100 so pointer positions map to values. */
function sizeTrack(container: HTMLElement) {
  const track = container.querySelector('[data-thumb]')!.parentElement as HTMLElement;
  track.getBoundingClientRect = () => ({ left: 100, right: 300, width: 200, top: 0, bottom: 6, height: 6, x: 100, y: 0, toJSON() {} }) as DOMRect;
  return track;
}

describe('Slider (single)', () => {
  it('is a slider with min, max, now and a label', () => {
    render(<Slider aria-label="Volume" defaultValue={30} />);
    const t = screen.getByRole('slider', { name: 'Volume' });
    expect(t.getAttribute('aria-valuemin')).toBe('0');
    expect(t.getAttribute('aria-valuemax')).toBe('100');
    expect(t.getAttribute('aria-valuenow')).toBe('30');
    expect(t.getAttribute('aria-orientation')).toBe('horizontal');
    expect(t.getAttribute('tabindex')).toBe('0');
    expect(t.style.insetInlineStart).toBe('30%');
  });

  it('defaults to min and respects custom min, max and step', () => {
    render(<Slider aria-label="v" min={10} max={20} step={5} />);
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('10');
    expect(thumbs()[0]!.getAttribute('aria-valuemax')).toBe('20');
  });

  it('uses formatValue for aria-valuetext', () => {
    render(<Slider aria-label="Price" defaultValue={40} formatValue={(v) => `$${v}`} />);
    expect(thumbs()[0]!.getAttribute('aria-valuetext')).toBe('$40');
  });

  it('moves with arrows, PageUp/PageDown, Home and End and reports change and commit', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<Slider aria-label="v" defaultValue={50} step={2} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    const t = thumbs()[0]!;
    fireEvent.keyDown(t, { key: 'ArrowRight' });
    expect(t.getAttribute('aria-valuenow')).toBe('52');
    fireEvent.keyDown(t, { key: 'ArrowUp' });
    expect(t.getAttribute('aria-valuenow')).toBe('54');
    fireEvent.keyDown(t, { key: 'ArrowLeft' });
    fireEvent.keyDown(t, { key: 'ArrowDown' });
    expect(t.getAttribute('aria-valuenow')).toBe('50');
    fireEvent.keyDown(t, { key: 'PageUp' });
    expect(t.getAttribute('aria-valuenow')).toBe('70');
    fireEvent.keyDown(t, { key: 'PageDown' });
    expect(t.getAttribute('aria-valuenow')).toBe('50');
    fireEvent.keyDown(t, { key: 'Home' });
    expect(t.getAttribute('aria-valuenow')).toBe('0');
    fireEvent.keyDown(t, { key: 'End' });
    expect(t.getAttribute('aria-valuenow')).toBe('100');
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    expect(onValueCommit).toHaveBeenLastCalledWith(100);
    expect(onValueCommit).toHaveBeenCalledTimes(onValueChange.mock.calls.length);
  });

  it('stops at the ends without reporting a change', () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="v" defaultValue={100} onValueChange={onValueChange} />);
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' });
    fireEvent.keyDown(thumbs()[0]!, { key: 'End' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ignores unrelated and modified keys', () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="v" defaultValue={5} onValueChange={onValueChange} />);
    fireEvent.keyDown(thumbs()[0]!, { key: 'a' });
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight', ctrlKey: true });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('rounds float steps without noise', () => {
    render(<Slider aria-label="v" defaultValue={0} step={0.1} max={1} />);
    for (let i = 0; i < 3; i++) fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('0.3');
  });

  it('is controlled by value', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Slider aria-label="v" value={20} onValueChange={onValueChange} />);
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith(21);
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('20');
    rerender(<Slider aria-label="v" value={21} onValueChange={onValueChange} />);
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('21');
  });

  it('reverses the horizontal arrows in right-to-left', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Slider aria-label="v" defaultValue={50} />
      </div>,
    );
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('49');
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowLeft' });
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowLeft' });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('51');
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowUp' });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('52');
  });

  it('cancels the pointerdown default so the browser does not move focus off the thumb', () => {
    const { container } = render(<Slider aria-label="v" defaultValue={0} />);
    sizeTrack(container);
    const root = container.firstElementChild as HTMLElement;
    const notCancelled = fireEvent.pointerDown(root, { clientX: 150, button: 0, pointerId: 1 });
    expect(notCancelled).toBe(false);
  });

  it('drags: pointer down sets the value, move follows, up commits', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { container } = render(
      <Slider aria-label="v" defaultValue={0} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    );
    sizeTrack(container);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(root, { clientX: 150, button: 0, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('25');
    expect(root.hasAttribute('data-dragging')).toBe(true);
    expect(document.activeElement).toBe(thumbs()[0]);
    fireEvent.pointerMove(root, { clientX: 250, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('75');
    fireEvent.pointerMove(root, { clientX: 900, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('100');
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(root, { pointerId: 1 });
    expect(onValueCommit).toHaveBeenCalledWith(100);
    expect(root.hasAttribute('data-dragging')).toBe(false);
    fireEvent.pointerMove(root, { clientX: 120, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('100');
  });

  it('mirrors the pointer position in right-to-left', () => {
    const { container } = render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Slider aria-label="v" defaultValue={0} />
      </div>,
    );
    sizeTrack(container);
    fireEvent.pointerDown(container.firstElementChild!.firstElementChild as HTMLElement, { clientX: 150, button: 0, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('75');
  });

  it('ignores non-primary buttons and a zero-width track', () => {
    const { container } = render(<Slider aria-label="v" defaultValue={10} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(root, { clientX: 150, button: 2, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('10');
    fireEvent.pointerDown(root, { clientX: 150, button: 0, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('0');
  });

  it('is inert when disabled', () => {
    const onValueChange = vi.fn();
    const { container } = render(<Slider aria-label="v" defaultValue={10} disabled name="v" onValueChange={onValueChange} />);
    sizeTrack(container);
    const t = thumbs()[0]!;
    expect(t.hasAttribute('tabindex')).toBe(false);
    expect(t.getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(t, { key: 'ArrowRight' });
    fireEvent.pointerDown(container.firstElementChild as HTMLElement, { clientX: 250, button: 0, pointerId: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect((container.firstElementChild as HTMLElement).hasAttribute('data-disabled')).toBe(true);
    expect(container.querySelector('input[type=hidden]')!.hasAttribute('disabled')).toBe(true);
  });

  it('posts the value in FormData', () => {
    const { container } = render(
      <form>
        <Slider aria-label="v" name="volume" defaultValue={42} />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('volume')).toBe('42');
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' });
    expect(new FormData(form).get('volume')).toBe('43');
  });

  it('clamps an out-of-range value', () => {
    render(<Slider aria-label="v" value={500} />);
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('100');
  });

  it('fills from the start to the value', () => {
    const { container } = render(<Slider aria-label="v" defaultValue={40} />);
    const fill = container.querySelector('[aria-hidden=true]') as HTMLElement;
    expect(fill.style.insetInlineStart).toBe('0%');
    expect(fill.style.width).toBe('40%');
  });

  it('merges ref, className, id and data attributes on the root, and keeps user pointer handlers', () => {
    const ref = createRef<HTMLDivElement>();
    const onPointerDown = vi.fn();
    const { container } = render(
      <Slider ref={ref} aria-label="v" className="mt-2" id="sl" data-x="1" onPointerDown={onPointerDown} />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.id).toBe('sl');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    fireEvent.pointerDown(ref.current!, { button: 0, pointerId: 1 });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it('passes aria-labelledby and aria-describedby to the thumb', () => {
    render(
      <>
        <span id="lbl">Brightness</span>
        <span id="hint">Hint</span>
        <Slider aria-labelledby="lbl" aria-describedby="hint" />
      </>,
    );
    const t = screen.getByRole('slider', { name: 'Brightness' });
    expect(t.getAttribute('aria-describedby')).toBe('hint');
  });

  it('is named by a Field label and marked invalid on error', () => {
    const { container } = render(
      <Field label="Volume" error="Too loud">
        <Slider defaultValue={90} />
      </Field>,
    );
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
    expect(container.querySelector('[data-invalid]')).toBeTruthy();
    expect(screen.getByRole('slider').getAttribute('aria-describedby')).toBeTruthy();
  });

  it('has forced-colors styles', () => {
    const { container } = render(<Slider aria-label="v" />);
    expect(thumbs()[0]!.className).toContain('forced-colors:border-[Highlight]');
    expect(container.innerHTML).toContain('forced-colors:bg-[Highlight]');
  });

  it('works inside a stateful parent', () => {
    function Parent() {
      const [v, setV] = useState(10);
      return (
        <>
          <Slider aria-label="v" value={v} onValueChange={setV} />
          <output>{v}</output>
        </>
      );
    }
    render(<Parent />);
    fireEvent.keyDown(thumbs()[0]!, { key: 'End' });
    expect(screen.getByText('100')).toBeTruthy();
  });
});

describe('Slider (range)', () => {
  it('drags the high thumb when both thumbs are stacked at min', () => {
    const { container } = render(<Slider aria-label="r" defaultValue={[0, 0]} min={0} max={100} />);
    sizeTrack(container);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(root, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(root, { clientX: 200, pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('0');
    expect(Number(thumbs()[1]!.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });

  it('renders two thumbs named Minimum and Maximum', () => {
    render(<Slider aria-label="Price" defaultValue={[20, 80]} />);
    expect(thumbs()).toHaveLength(2);
    expect(screen.getByRole('slider', { name: 'Price Minimum' }).getAttribute('aria-valuenow')).toBe('20');
    expect(screen.getByRole('slider', { name: 'Price Maximum' }).getAttribute('aria-valuenow')).toBe('80');
  });

  it('bounds each thumb by the other', () => {
    render(<Slider aria-label="r" defaultValue={[20, 80]} />);
    expect(thumbs()[0]!.getAttribute('aria-valuemax')).toBe('80');
    expect(thumbs()[1]!.getAttribute('aria-valuemin')).toBe('20');
    expect(thumbs()[0]!.getAttribute('aria-valuemin')).toBe('0');
    expect(thumbs()[1]!.getAttribute('aria-valuemax')).toBe('100');
  });

  it('keeps thumbs from crossing', () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="r" defaultValue={[20, 80]} onValueChange={onValueChange} />);
    fireEvent.keyDown(thumbs()[0]!, { key: 'End' });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('80');
    expect(onValueChange).toHaveBeenLastCalledWith([80, 80]);
    fireEvent.keyDown(thumbs()[1]!, { key: 'Home' });
    expect(thumbs()[1]!.getAttribute('aria-valuenow')).toBe('80');
  });

  it('sorts a reversed pair', () => {
    render(<Slider aria-label="r" value={[70, 30]} />);
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('30');
    expect(thumbs()[1]!.getAttribute('aria-valuenow')).toBe('70');
  });

  it('reports a pair on change and commit', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(<Slider aria-label="r" defaultValue={[10, 90]} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
    fireEvent.keyDown(thumbs()[1]!, { key: 'ArrowLeft' });
    expect(onValueChange).toHaveBeenCalledWith([10, 89]);
    expect(onValueCommit).toHaveBeenCalledWith([10, 89]);
  });

  it('picks the nearest thumb for a pointer press', () => {
    const { container } = render(<Slider aria-label="r" defaultValue={[20, 80]} />);
    sizeTrack(container);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(root, { clientX: 140, button: 0, pointerId: 1 }); // 20%: first thumb
    fireEvent.pointerUp(root, { pointerId: 1 });
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('20');
    fireEvent.pointerDown(root, { clientX: 220, button: 0, pointerId: 1 }); // 60%: nearer the second
    expect(thumbs()[1]!.getAttribute('aria-valuenow')).toBe('60');
    fireEvent.pointerUp(root, { pointerId: 1 });
    fireEvent.pointerDown(root, { clientX: 110, button: 0, pointerId: 1 }); // 5%: below the first
    expect(thumbs()[0]!.getAttribute('aria-valuenow')).toBe('5');
    fireEvent.pointerUp(root, { pointerId: 1 });
    fireEvent.pointerDown(root, { clientX: 300, button: 0, pointerId: 1 }); // 100%: above the second
    expect(thumbs()[1]!.getAttribute('aria-valuenow')).toBe('100');
  });

  it('fills between the thumbs', () => {
    const { container } = render(<Slider aria-label="r" defaultValue={[25, 75]} />);
    const fill = container.querySelector('[aria-hidden=true]') as HTMLElement;
    expect(fill.style.insetInlineStart).toBe('25%');
    expect(fill.style.width).toBe('50%');
  });

  it('posts both values under the same name', () => {
    const { container } = render(
      <form>
        <Slider aria-label="r" name="price" defaultValue={[20, 80]} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('price')).toEqual(['20', '80']);
  });

  it('takes thumb labels from the provider', () => {
    render(
      <NishProvider strings={{ sliderMin: 'Min', sliderMax: 'Max' }}>
        <Slider defaultValue={[1, 2]} />
      </NishProvider>,
    );
    expect(screen.getByRole('slider', { name: 'Min' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Max' })).toBeTruthy();
  });

  it('names thumbs from aria-labelledby plus their own label', () => {
    render(
      <>
        <span id="lbl">Price</span>
        <Slider aria-labelledby="lbl" defaultValue={[1, 2]} />
      </>,
    );
    expect(screen.getByRole('slider', { name: 'Price Minimum' })).toBeTruthy();
  });

  it('formatValue gets the thumb index', () => {
    render(<Slider aria-label="r" defaultValue={[1, 2]} formatValue={(v, i) => `${i}:${v}`} />);
    expect(thumbs()[0]!.getAttribute('aria-valuetext')).toBe('0:1');
    expect(thumbs()[1]!.getAttribute('aria-valuetext')).toBe('1:2');
  });

  it('commits once when a drag ends', () => {
    const onValueCommit = vi.fn();
    const { container } = render(<Slider aria-label="r" defaultValue={[20, 80]} onValueCommit={onValueCommit} />);
    sizeTrack(container);
    const root = container.firstElementChild as HTMLElement;
    act(() => {
      fireEvent.pointerDown(root, { clientX: 160, button: 0, pointerId: 1 });
      fireEvent.pointerMove(root, { clientX: 180, pointerId: 1 });
      fireEvent.pointerUp(root, { pointerId: 1 });
    });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith([40, 80]);
    fireEvent.pointerCancel(root, { pointerId: 1 });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });
});

describe('Slider (server)', () => {
  it('renders on the server', () => {
    const html = renderToString(<Slider aria-label="v" defaultValue={[1, 2]} name="n" />);
    expect(html).toContain('role="slider"');
    expect(html).toContain('type="hidden"');
  });
});
