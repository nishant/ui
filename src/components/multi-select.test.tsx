import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './multi-select';
import type { ComboboxOption } from './combobox';
import { Field } from './forms';
import { NishProvider } from './provider';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const OPTIONS: ComboboxOption[] = [
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York', disabled: true },
  { value: 'WA', label: 'Washington' },
];

const box = () => screen.getByRole('combobox');
const key = (k: string) => fireEvent.keyDown(box(), { key: k });
const status = () => screen.getByRole('status').textContent;

describe('MultiSelect', () => {
  it('passes ref, className and rest to the right elements', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { container } = render(<MultiSelect ref={ref} aria-label="S" options={OPTIONS} className="mine" data-x="1" />);
    expect(ref.current).toBe(box());
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('mine');
    expect(wrapper.getAttribute('data-x')).toBe('1');
  });

  it('opens a multiselectable listbox with the arrow keys', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} />);
    key('ArrowDown');
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    expect(box().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);
  });

  it('toggles with Enter, keeps the list open and clears the query', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} />);
    fireEvent.change(box(), { target: { value: 'tex' } });
    key('Enter');
    expect((box() as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /Texas/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: 'Remove Texas' })).toBeTruthy();
    key('Enter');
    expect(screen.getByRole('option', { name: /Texas/ }).getAttribute('aria-selected')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Remove Texas' })).toBeNull();
  });

  it('toggles on click', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} />);
    key('ArrowDown');
    fireEvent.click(screen.getByRole('option', { name: /California/ }));
    expect(screen.getByRole('button', { name: 'Remove California' })).toBeTruthy();
  });

  it('removes the last value with Backspace on an empty box', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} defaultValue={['TX', 'CA']} />);
    key('Backspace');
    expect(screen.queryByRole('button', { name: 'Remove California' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove Texas' })).toBeTruthy();
  });

  it('removes through the chip button and clears all', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} defaultValue={['TX', 'CA']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Texas' }));
    expect(screen.queryByRole('button', { name: 'Remove Texas' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.queryByRole('button', { name: 'Remove California' })).toBeNull();
  });

  it('skips disabled options with the arrows and ignores clicks on them', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect aria-label="S" options={OPTIONS} onValueChange={onValueChange} />);
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowDown');
    expect(box().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[3].id);
    fireEvent.click(screen.getByRole('option', { name: /New York/ }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('caps the picks with maxSelected and announces it', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} maxSelected={2} defaultValue={['TX', 'CA']} />);
    key('ArrowDown');
    const wa = screen.getByRole('option', { name: /Washington/ });
    expect(wa.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(wa);
    expect(status()).toBe('You can pick up to 2');
    expect(screen.queryByRole('button', { name: 'Remove Washington' })).toBeNull();
  });

  it('announces additions and removals', () => {
    render(<MultiSelect aria-label="S" options={OPTIONS} />);
    key('ArrowDown');
    key('Enter');
    expect(status()).toBe('Added Texas');
    key('Enter');
    expect(status()).toBe('Removed Texas');
  });

  it('posts one hidden input per value and is required only while empty', () => {
    const { container, rerender } = render(<MultiSelect aria-label="S" options={OPTIONS} name="states" required defaultValue={['TX', 'WA']} />);
    const hidden = [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
    expect(hidden.map((h) => [h.name, h.value])).toEqual([
      ['states', 'TX'],
      ['states', 'WA'],
    ]);
    expect((box() as HTMLInputElement).required).toBe(false);
    rerender(<MultiSelect aria-label="S" options={OPTIONS} name="states" required value={[]} />);
    expect((box() as HTMLInputElement).required).toBe(true);
  });

  it('returns to its default when the form resets', () => {
    render(
      <form>
        <MultiSelect aria-label="S" options={OPTIONS} defaultValue={['TX']} />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.queryByRole('button', { name: 'Remove Texas' })).toBeNull();
    act(() => {
      (box() as HTMLInputElement).form!.reset();
    });
    expect(screen.getByRole('button', { name: 'Remove Texas' })).toBeTruthy();
  });

  it('works controlled and passes options to onChange', () => {
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState<string[]>([]);
      return <MultiSelect aria-label="S" options={OPTIONS} value={v} onValueChange={setV} onChange={onChange} />;
    }
    render(<Harness />);
    key('ArrowDown');
    key('Enter');
    expect(onChange).toHaveBeenCalledWith(['TX'], [OPTIONS[0]]);
    expect(screen.getByRole('button', { name: 'Remove Texas' })).toBeTruthy();
  });

  it('closes with Escape without bubbling, and bubbles when closed and empty', () => {
    const parent = vi.fn();
    render(
      <div onKeyDown={parent}>
        <MultiSelect aria-label="S" options={OPTIONS} />
      </div>,
    );
    key('ArrowDown');
    parent.mockClear();
    key('Escape');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(parent).not.toHaveBeenCalled();
    key('Escape');
    expect(parent).toHaveBeenCalled();
  });

  it('debounces onQueryChange by 200 ms', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    render(<MultiSelect aria-label="S" options={OPTIONS} onQueryChange={onQueryChange} />);
    fireEvent.change(box(), { target: { value: 'te' } });
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(onQueryChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onQueryChange).toHaveBeenCalledWith('te');
  });

  it('keeps the label of a picked async option after options change', () => {
    const { rerender } = render(<MultiSelect aria-label="S" options={OPTIONS} />);
    key('ArrowDown');
    fireEvent.click(screen.getByRole('option', { name: /Texas/ }));
    rerender(<MultiSelect aria-label="S" options={[OPTIONS[1]]} />);
    expect(screen.getByRole('button', { name: 'Remove Texas' })).toBeTruthy();
  });

  it('reaches the input from a Field label', () => {
    render(
      <Field label="States">
        <MultiSelect id="ms" options={OPTIONS} />
      </Field>,
    );
    expect(screen.getByLabelText('States')).toBe(box());
  });

  it('takes strings from a provider', () => {
    render(
      <NishProvider strings={{ clearAll: 'Alles loeschen' }}>
        <MultiSelect aria-label="S" options={OPTIONS} defaultValue={['TX']} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Alles loeschen' })).toBeTruthy();
  });

  it('keeps the labels of preset values after options change', () => {
    const { rerender } = render(<MultiSelect aria-label="S" options={OPTIONS} defaultValue={['TX']} />);
    expect(screen.getByRole('button', { name: /Remove Texas/ })).toBeTruthy();
    rerender(<MultiSelect aria-label="S" options={[{ value: 'WA', label: 'Washington' }]} defaultValue={['TX']} />);
    expect(screen.getByRole('button', { name: /Remove Texas/ })).toBeTruthy();
  });

  it('renders without throwing when options repeat a selected value with different labels', () => {
    const dupes: ComboboxOption[] = [
      { value: 'TX', label: 'Texas' },
      { value: 'TX', label: 'Lone Star' },
    ];
    render(<MultiSelect aria-label="S" options={dupes} defaultValue={['TX']} />);
    expect(screen.getByRole('button', { name: /Remove Texas/ })).toBeTruthy();
  });
});

describe('MultiSelect query reset on blur', () => {
  it('tells onQueryChange the box was cleared when focus leaves', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    render(<MultiSelect aria-label="S" options={OPTIONS} onQueryChange={onQueryChange} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'tex' } });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    fireEvent.blur(input, { relatedTarget: document.body });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onQueryChange).toHaveBeenLastCalledWith('');
    vi.useRealTimers();
  });
});
