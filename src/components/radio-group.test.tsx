import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from './forms';
import { Radio, RadioGroup } from './radio-group';

afterEach(cleanup);

const OPTIONS = [
  { value: 'a', label: 'Alpha', description: 'First' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta' },
];

const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];

describe('RadioGroup', () => {
  it('renders a radiogroup of native radios from options', () => {
    render(<RadioGroup aria-label="Pick" options={OPTIONS} />);
    const group = screen.getByRole('radiogroup', { name: 'Pick' });
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expect(radios().map((r) => r.type)).toEqual(['radio', 'radio', 'radio', 'radio']);
    expect(radios().map((r) => r.value)).toEqual(['a', 'b', 'c', 'd']);
    expect(radios()[2]!.disabled).toBe(true);
  });

  it('renders Radio children', () => {
    render(
      <RadioGroup aria-label="Pick">
        <Radio value="x" label="X" />
        <Radio value="y" label="Y" />
      </RadioGroup>,
    );
    expect(radios()).toHaveLength(2);
    expect(screen.getByLabelText('X')).toBeTruthy();
  });

  it('shares one generated name, or uses the name prop', () => {
    const { rerender } = render(<RadioGroup aria-label="p" options={OPTIONS} />);
    const generated = radios()[0]!.name;
    expect(generated).toBeTruthy();
    expect(new Set(radios().map((r) => r.name)).size).toBe(1);
    rerender(<RadioGroup aria-label="p" name="plan" options={OPTIONS} />);
    expect(radios().every((r) => r.name === 'plan')).toBe(true);
  });

  it('works uncontrolled: defaultValue checks one, clicking changes and reports', () => {
    const onValueChange = vi.fn();
    render(<RadioGroup aria-label="p" defaultValue="b" options={OPTIONS} onValueChange={onValueChange} />);
    expect(radios()[1]!.checked).toBe(true);
    fireEvent.click(radios()[0]!);
    expect(radios()[0]!.checked).toBe(true);
    expect(radios()[1]!.checked).toBe(false);
    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(screen.getByText('Alpha').closest('label')!.getAttribute('data-state')).toBe('checked');
    expect(screen.getByText('Beta').closest('label')!.getAttribute('data-state')).toBe('unchecked');
  });

  it('works controlled: the value prop decides, a click only reports', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<RadioGroup aria-label="p" value="a" options={OPTIONS} onValueChange={onValueChange} />);
    expect(radios()[0]!.checked).toBe(true);
    fireEvent.click(radios()[1]!);
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(radios()[0]!.checked).toBe(true);
    rerender(<RadioGroup aria-label="p" value="b" options={OPTIONS} onValueChange={onValueChange} />);
    expect(radios()[1]!.checked).toBe(true);
  });

  it('posts the selected value in FormData', () => {
    const { container } = render(
      <form>
        <RadioGroup aria-label="p" name="plan" defaultValue="d" options={OPTIONS} />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('plan')).toBe('d');
    fireEvent.click(radios()[0]!);
    expect(new FormData(form).get('plan')).toBe('a');
  });

  it('does not post disabled radios', () => {
    const { container } = render(
      <form>
        <RadioGroup aria-label="p" name="plan" disabled defaultValue="a" options={OPTIONS} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('plan')).toBeNull();
    expect(screen.getByRole('radiogroup').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('radiogroup').hasAttribute('data-disabled')).toBe(true);
  });

  it('moves and selects with the arrow keys, skipping disabled radios and wrapping', () => {
    const onValueChange = vi.fn();
    render(<RadioGroup aria-label="p" defaultValue="a" options={OPTIONS} onValueChange={onValueChange} />);
    radios()[0]!.focus();
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(radios()[1]);
    expect(radios()[1]!.checked).toBe(true);
    fireEvent.keyDown(radios()[1]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios()[3]);
    fireEvent.keyDown(radios()[3]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(radios()[0]);
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(radios()[3]);
    fireEvent.keyDown(radios()[3]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(radios()[1]);
    expect(onValueChange).toHaveBeenLastCalledWith('b');
  });

  it('ignores other keys and modified arrows', () => {
    const onValueChange = vi.fn();
    render(<RadioGroup aria-label="p" defaultValue="a" options={OPTIONS} onValueChange={onValueChange} />);
    fireEvent.keyDown(radios()[0]!, { key: 'Home' });
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowDown', ctrlKey: true });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('mirrors left and right in right-to-left', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <RadioGroup aria-label="p" defaultValue="a" options={OPTIONS} orientation="horizontal" />
      </div>,
    );
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(radios()[1]);
    fireEvent.keyDown(radios()[1]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios()[0]);
  });

  it('wires descriptions with aria-describedby', () => {
    render(<RadioGroup aria-label="p" options={OPTIONS} />);
    const first = radios()[0]!;
    const id = first.getAttribute('aria-describedby')!;
    expect(document.getElementById(id)!.textContent).toBe('First');
    expect(radios()[1]!.hasAttribute('aria-describedby')).toBe(false);
  });

  it('sets required, invalid and orientation', () => {
    render(<RadioGroup aria-label="p" options={OPTIONS} required invalid orientation="horizontal" />);
    const g = screen.getByRole('radiogroup');
    expect(g.getAttribute('aria-required')).toBe('true');
    expect(g.getAttribute('aria-invalid')).toBe('true');
    expect(g.getAttribute('data-orientation')).toBe('horizontal');
    expect(g.className).toContain('flex-row');
    expect(radios()[0]!.required).toBe(true);
  });

  it('takes aria-invalid as invalid', () => {
    render(<RadioGroup aria-label="p" aria-invalid options={OPTIONS} />);
    expect(screen.getByRole('radiogroup').getAttribute('aria-invalid')).toBe('true');
  });

  it('lets a Radio opt out of the group: disabled radios stay disabled', () => {
    render(
      <RadioGroup aria-label="p">
        <Radio value="x" label="X" disabled />
        <Radio value="y" label="Y" />
      </RadioGroup>,
    );
    expect(radios()[0]!.disabled).toBe(true);
    expect(radios()[1]!.disabled).toBe(false);
  });

  it('is named and described by a Field', () => {
    render(
      <Field label="Plan" hint="Pick one" error="Choose a plan">
        <RadioGroup options={OPTIONS} />
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(group.getAttribute('aria-describedby')!)!.textContent).toBe('Choose a plan');
  });

  it('accepts a react-hook-form style register on a Radio (ref, name, onChange)', () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLInputElement>();
    render(
      <RadioGroup aria-label="p">
        <Radio value="x" label="X" name="fld" ref={ref} onChange={onChange} />
      </RadioGroup>,
    );
    expect(ref.current).toBe(radios()[0]);
    expect(radios()[0]!.name).toBe('fld');
    fireEvent.click(radios()[0]!);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('passes ref, className, id and data attributes to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RadioGroup ref={ref} aria-label="p" className="mt-2" id="rg" data-x="1" options={OPTIONS} />);
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.id).toBe('rg');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
  });

  it('works as a standalone Radio outside a group', () => {
    render(<Radio value="z" label="Z" name="solo" />);
    expect(screen.getByLabelText('Z')).toBeTruthy();
    expect(radios()[0]!.name).toBe('solo');
  });

  it('has forced-colors styles on the drawn circle', () => {
    render(<RadioGroup aria-label="p" options={OPTIONS} />);
    const circle = radios()[0]!.nextElementSibling as HTMLElement;
    expect(circle.className).toContain('forced-colors:peer-checked:border-[Highlight]');
    expect(circle.className).toContain('border-th-line-control');
  });

  it('renders on the server', () => {
    const html = renderToString(<RadioGroup aria-label="p" defaultValue="a" options={OPTIONS} />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('type="radio"');
  });
});
