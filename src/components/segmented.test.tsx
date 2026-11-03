import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Segmented, type SegmentedOption } from './segmented';
import { Field } from './forms';

const rtl = vi.hoisted(() => ({ on: false }));
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  isRtl: () => rtl.on,
}));

afterEach(() => {
  cleanup();
  rtl.on = false;
});

const OPTIONS: SegmentedOption<string>[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d', tone: 'warn' },
  { value: '30d', label: '30d', disabled: true },
  { value: '90d', label: '90d', tone: 'loss' },
];

const radios = () => screen.getAllByRole('radio') as HTMLButtonElement[];
const checked = () => radios().map((r) => r.getAttribute('aria-checked'));

function Controlled({ onChange }: { onChange?: (v: string) => void }) {
  const [v, setV] = useState('24h');
  return (
    <Segmented
      label="Range"
      options={OPTIONS}
      value={v}
      onChange={(n) => {
        setV(n);
        onChange?.(n);
      }}
    />
  );
}

describe('Segmented', () => {
  it('is a named radiogroup of radios with aria-checked and data-state', () => {
    render(<Controlled />);
    const group = screen.getByRole('radiogroup', { name: 'Range' });
    expect(group).toBeTruthy();
    expect(checked()).toEqual(['true', 'false', 'false', 'false']);
    expect(radios().map((r) => r.getAttribute('data-state'))).toEqual(['checked', 'unchecked', 'unchecked', 'unchecked']);
    expect(radios()[2].hasAttribute('data-disabled')).toBe(true);
    expect(radios()[0].hasAttribute('data-disabled')).toBe(false);
  });

  it('roving tabindex: only the selected radio is a Tab stop; with none selected the first enabled one is', () => {
    const { rerender } = render(<Segmented label="R" options={OPTIONS} value="7d" onChange={() => undefined} />);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1]);
    rerender(<Segmented label="R" options={OPTIONS} value="nope" onChange={() => undefined} />);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(checked()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('click selects, calls onChange and onValueChange, and focuses the radio', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<Segmented label="R" options={OPTIONS} value="24h" onChange={onChange} onValueChange={onValueChange} />);
    fireEvent.click(radios()[1]);
    expect(onChange).toHaveBeenCalledWith('7d');
    expect(onValueChange).toHaveBeenCalledWith('7d');
    expect(document.activeElement).toBe(radios()[1]);
  });

  it('a disabled option cannot be picked', () => {
    const onChange = vi.fn();
    render(<Segmented label="R" options={OPTIONS} value="24h" onChange={onChange} />);
    fireEvent.click(radios()[2]);
    expect(onChange).not.toHaveBeenCalled();
    expect(radios()[2].disabled).toBe(true);
  });

  it('arrow keys move the choice and the focus, wrap and skip disabled options', () => {
    render(<Controlled />);
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(checked()[1]).toBe('true');
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(checked()[3]).toBe('true'); // skipped the disabled 30d
    expect(document.activeElement).toBe(radios()[3]);
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(checked()[0]).toBe('true'); // wrapped
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(checked()[3]).toBe('true');
    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(checked()[1]).toBe('true');
    fireEvent.keyDown(group, { key: 'Home' });
    expect(checked()[0]).toBe('true');
    fireEvent.keyDown(group, { key: 'End' });
    expect(checked()[3]).toBe('true');
  });

  it('in a right-to-left layout ArrowLeft goes forward and ArrowRight back', () => {
    rtl.on = true;
    render(<Controlled />);
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(checked()[1]).toBe('true');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(checked()[0]).toBe('true');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(checked()[3]).toBe('true');
    // Up and Down keep their meaning
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(checked()[0]).toBe('true');
  });

  it('uncontrolled: defaultValue, internal state and onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Segmented label="R" options={OPTIONS} defaultValue="7d" onValueChange={onValueChange} />);
    expect(checked()[1]).toBe('true');
    fireEvent.click(radios()[3]);
    expect(checked()).toEqual(['false', 'false', 'false', 'true']);
    expect(onValueChange).toHaveBeenCalledWith('90d');
  });

  it('a controlled value does not move until the parent updates it', () => {
    render(<Segmented label="R" options={OPTIONS} value="24h" onChange={() => undefined} />);
    fireEvent.click(radios()[1]);
    expect(checked()[0]).toBe('true');
    expect(checked()[1]).toBe('false');
  });

  it('applies the tone to the selected option only', () => {
    render(<Segmented label="R" options={OPTIONS} value="7d" onChange={() => undefined} />);
    expect(radios()[1].className).toContain('bg-th-warn-soft');
    expect(radios()[3].className).not.toContain('bg-th-loss-soft');
    expect(radios()[0].className).not.toContain('bg-th-accent-soft');
    expect(radios()[1].className).toContain('forced-colors:bg-[color:Highlight]');
  });

  it('size, block and overflow change the classes', () => {
    const { rerender } = render(<Segmented label="R" options={OPTIONS} value="24h" onChange={() => undefined} size="md" block overflow="wrap" />);
    const group = screen.getByRole('radiogroup');
    expect(radios()[0].className).toContain('h-8');
    expect(group.className).toContain('flex w-full');
    expect(group.className).not.toContain('overflow-x-auto');
    rerender(<Segmented label="R" options={OPTIONS} value="24h" onChange={() => undefined} size="xs" />);
    expect(radios()[0].className).toContain('h-6');
    expect(group.className).toContain('inline-flex');
    expect(group.className).toContain('overflow-x-auto');
    rerender(<Segmented label="R" options={OPTIONS} value="24h" onChange={() => undefined} fullWidth />);
    expect(group.className).toContain('flex w-full');
  });

  it('ref, className, id, aria and data-* go to the radiogroup', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Segmented
        ref={ref}
        label="R"
        options={OPTIONS}
        value="24h"
        onChange={() => undefined}
        className="x-cls"
        id="seg"
        data-testid="seg"
        aria-describedby="help"
        aria-invalid
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(ref.current).toBe(group);
    expect(group.className).toContain('x-cls');
    expect(group.id).toBe('seg');
    expect(group.getAttribute('data-testid')).toBe('seg');
    expect(group.getAttribute('aria-describedby')).toBe('help');
    expect(group.getAttribute('aria-invalid')).toBe('true');
  });

  it('a title is used for icon-only hints and ariaLabel names the radio', () => {
    render(<Segmented label="R" options={[{ value: 'a', label: 'A', ariaLabel: 'Alpha', title: 'The first' }]} value="a" onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: 'Alpha' }).getAttribute('title')).toBe('The first');
  });

  it('posts the selection in a native form through hidden radios', () => {
    const { container } = render(
      <form>
        <Segmented label="R" name="range" options={OPTIONS} defaultValue="7d" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('range')).toBe('7d');
    fireEvent.click(radios()[3]);
    expect(new FormData(form).get('range')).toBe('90d');
    const hidden = container.querySelectorAll('input[type=radio]');
    expect(hidden).toHaveLength(4);
    hidden.forEach((h) => {
      expect(h.getAttribute('aria-hidden')).toBe('true');
      expect((h as HTMLInputElement).tabIndex).toBe(-1);
    });
  });

  it('renders no hidden inputs without a name, and nothing is posted for an unmatched value', () => {
    const { container } = render(<Segmented label="R" options={OPTIONS} value="zzz" onChange={() => undefined} />);
    expect(container.querySelectorAll('input')).toHaveLength(0);
    cleanup();
    const r = render(
      <form>
        <Segmented label="R" name="range" options={OPTIONS} value="zzz" onChange={() => undefined} />
      </form>,
    );
    expect(new FormData(r.container.querySelector('form') as HTMLFormElement).get('range')).toBeNull();
  });

  it('required marks the group and the hidden radios', () => {
    const { container } = render(<Segmented label="R" name="range" required options={OPTIONS} defaultValue="24h" />);
    expect(screen.getByRole('radiogroup').getAttribute('aria-required')).toBe('true');
    expect((container.querySelector('input[type=radio]') as HTMLInputElement).required).toBe(true);
  });

  it('shows a tip on keyboard focus and closes it with Escape and on press', () => {
    render(<Segmented label="R" options={[{ value: 'a', label: 'A', tip: 'About A' }, { value: 'b', label: 'B' }]} value="a" onChange={() => undefined} />);
    expect(screen.queryByText('About A')).toBeNull();
    fireEvent.mouseEnter(radios()[0]);
    expect(screen.getByText('About A')).toBeTruthy();
    expect(radios()[0].getAttribute('aria-describedby')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Escape' });
    expect(screen.queryByText('About A')).toBeNull();
    fireEvent.mouseEnter(radios()[0]);
    fireEvent.pointerDown(radios()[0]);
    expect(screen.queryByText('About A')).toBeNull();
    fireEvent.mouseEnter(radios()[0]);
    fireEvent.mouseLeave(radios()[0]);
    expect(screen.queryByText('About A')).toBeNull();
  });

  it('Field wires id and aria-describedby/aria-invalid into the group', () => {
    render(
      <Field label="Range" error="Pick one">
        <Segmented label="Range" options={OPTIONS} value="24h" onChange={() => undefined} />
      </Field>,
    );
    const group = screen.getByRole('radiogroup');
    expect(screen.getByText('Range', { selector: 'label span' }).closest('label')?.getAttribute('for')).toBe(group.id);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
  });
});
