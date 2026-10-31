import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './combobox';

afterEach(cleanup);

const OPTIONS: ComboboxOption[] = [
  { value: 'AAPL', label: 'AAPL', hint: 'Apple' },
  { value: 'AMD', label: 'AMD', hint: 'Advanced Micro Devices' },
  { value: 'MSFT', label: 'MSFT', hint: 'Microsoft' },
  { value: 'NVDA', label: 'NVDA', hint: 'Nvidia', disabled: true },
];

function Harness({
  initial = null,
  allowCustom = false,
  onChange,
}: {
  initial?: string | null;
  allowCustom?: boolean;
  onChange?: (v: string | null, o: ComboboxOption | null) => void;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <>
      <Combobox
        aria-label="Symbol"
        options={OPTIONS}
        value={value}
        allowCustom={allowCustom}
        onChange={(v, o) => {
          setValue(v);
          onChange?.(v, o);
        }}
      />
      <button type="button">after</button>
    </>
  );
}

const input = () => screen.getByRole('combobox') as HTMLInputElement;

describe('Combobox', () => {
  it('typing opens the list and filters on label and hint', () => {
    render(<Harness />);
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.change(input(), { target: { value: 'soft' } });
    expect(input().getAttribute('aria-expanded')).toBe('true');
    const opts = screen.getAllByRole('option');
    expect(opts.map((o) => o.textContent)).toEqual(['MSFTMicrosoft']);
    fireEvent.change(input(), { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No matches')).toBeTruthy();
  });

  it('ArrowDown then Enter selects and calls onChange', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('AAPL', OPTIONS[0]);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input().value).toBe('AAPL');
  });

  it('aria-activedescendant follows the arrows, wraps and skips disabled options', () => {
    render(<Harness />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    const idOf = () => input().getAttribute('aria-activedescendant');
    const optionId = (i: number) => screen.getAllByRole('option')[i].id;
    expect(idOf()).toBe(optionId(0));
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(idOf()).toBe(optionId(1));
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(idOf()).toBe(optionId(2));
    // NVDA is disabled, so the next stop wraps to the first.
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(idOf()).toBe(optionId(0));
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(idOf()).toBe(optionId(2));
    fireEvent.keyDown(input(), { key: 'Home' });
    expect(idOf()).toBe(optionId(0));
    fireEvent.keyDown(input(), { key: 'End' });
    expect(idOf()).toBe(optionId(2));
    expect(screen.getAllByRole('option')[2].getAttribute('aria-selected')).toBe('false');
  });

  it('typing arms the first match for Enter', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'm' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('AMD', OPTIONS[1]);
  });

  it('clicking an option selects it', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(input());
    fireEvent.click(screen.getByText('MSFT'));
    expect(onChange).toHaveBeenCalledWith('MSFT', OPTIONS[2]);
  });

  it('Escape closes the list, a second Escape restores the selected label', () => {
    render(<Harness initial="AMD" />);
    fireEvent.change(input(), { target: { value: 'ms' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input().value).toBe('ms');
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(input().value).toBe('AMD');
  });

  it('allowCustom commits typed text with a null option', () => {
    const onChange = vi.fn();
    render(<Harness allowCustom onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'swing' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('swing', null);
    expect(input().value).toBe('swing');
  });

  it('without allowCustom, Enter on text that matches nothing selects nothing', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'zzz' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('blur restores the selected label and closes', () => {
    render(<Harness initial="AAPL" />);
    fireEvent.change(input(), { target: { value: 'xx' } });
    expect(input().value).toBe('xx');
    fireEvent.blur(input());
    expect(input().value).toBe('AAPL');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Tab closes without selecting', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'Tab' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the clear button resets the value', () => {
    const onChange = vi.fn();
    render(<Harness initial="MSFT" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null, null);
    expect(input().value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('shows a Searching row while loading and debounces onQueryChange', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    render(<Combobox aria-label="Find" options={[]} value={null} onChange={() => undefined} onQueryChange={onQueryChange} loading />);
    fireEvent.change(input(), { target: { value: 'a' } });
    fireEvent.change(input(), { target: { value: 'ab' } });
    expect(onQueryChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith('ab');
    expect(screen.getByText('Searching…')).toBeTruthy();
    vi.useRealTimers();
  });

  it('disabled shows no clear button and does not open', () => {
    render(<Combobox aria-label="Symbol" options={OPTIONS} value="AAPL" onChange={() => undefined} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    fireEvent.click(input());
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
