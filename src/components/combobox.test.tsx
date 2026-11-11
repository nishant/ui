import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './combobox';
import { Field } from './forms';
import { NishProvider } from './provider';

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
    expect(screen.getAllByText('No matches').length).toBeGreaterThan(0);
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

  it('ignores the Enter that confirms an IME composition', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'm' } });
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input(), { key: 'Enter', keyCode: 229 });
    expect(onChange).not.toHaveBeenCalled();
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
    expect(screen.getAllByText('Searching…').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('resets a server-filtered list when the typed text is cleared by a pick', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    render(<Combobox aria-label="Find" options={OPTIONS} value={null} onChange={() => undefined} onQueryChange={onQueryChange} />);
    fireEvent.change(input(), { target: { value: 'ap' } });
    fireEvent.click(screen.getAllByRole('option')[0]);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledWith('');
    // The pending debounce for 'ap' is cancelled, so the stale query never reaches the server.
    vi.advanceTimersByTime(500);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('names the listbox by the field label, not by the input value', () => {
    render(
      <>
        <label htmlFor="sym-in">Ticker symbol</label>
        <Combobox id="sym-in" options={OPTIONS} value="AAPL" onChange={() => undefined} />
      </>,
    );
    fireEvent.click(input());
    const list = screen.getByRole('listbox');
    expect(list.getAttribute('aria-labelledby')).not.toBe('sym-in');
    expect(list.getAttribute('aria-label')).toBe('Ticker symbol');
  });

  it('announces the result count from the provider strings, a prop wins', () => {
    const { rerender } = render(
      <NishProvider strings={{ resultsCount: (n: number) => `${n} Treffer` }}>
        <Combobox aria-label="Find" options={OPTIONS} value={null} onChange={() => undefined} />
      </NishProvider>,
    );
    fireEvent.click(input());
    expect(screen.getByRole('status').textContent).toBe('4 Treffer');
    rerender(
      <NishProvider strings={{ resultsCount: (n: number) => `${n} Treffer` }}>
        <Combobox aria-label="Find" options={OPTIONS} value={null} onChange={() => undefined} resultsText={(n) => `${n} hits`} />
      </NishProvider>,
    );
    expect(screen.getByRole('status').textContent).toBe('4 hits');
  });

  it('disabled shows no clear button and does not open', () => {
    render(<Combobox aria-label="Symbol" options={OPTIONS} value="AAPL" onChange={() => undefined} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    fireEvent.click(input());
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('clears the value from the keyboard by emptying the input and pressing Enter', () => {
    const onChange = vi.fn();
    render(<Harness initial="AAPL" onChange={onChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(null, null);
    expect(input.value).toBe('');
  });

  it('clears the value when an emptied input blurs', () => {
    const onChange = vi.fn();
    render(<Harness initial="AAPL" onChange={onChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });
});

describe('Combobox contract', () => {
  it('Enter with no active option selects nothing and keeps the list open', () => {
    const onChange = vi.fn();
    render(<Harness allowCustom={false} onChange={onChange} />);
    fireEvent.click(input());
    expect(input().getAttribute('aria-activedescendant')).toBeNull();
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('a disabled option cannot be picked by click or Enter', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(input());
    fireEvent.click(screen.getByText('NVDA'));
    expect(onChange).not.toHaveBeenCalled();
    const nv = screen.getByText('NVDA').closest('[role=option]') as HTMLElement;
    expect(nv.getAttribute('aria-disabled')).toBe('true');
    fireEvent.change(input(), { target: { value: 'nvda' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allowCustom matches an existing option case-insensitively and skips disabled ones', () => {
    const onChange = vi.fn();
    render(<Harness allowCustom onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'msft' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('MSFT', OPTIONS[2]);
    fireEvent.change(input(), { target: { value: 'nvda' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('nvda', null);
  });

  it('clearing the text and pressing Enter clears the value and closes the list', () => {
    const onChange = vi.fn();
    render(<Harness initial="AAPL" onChange={onChange} />);
    fireEvent.change(input(), { target: { value: '' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(null, null);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input().value).toBe('');
  });

  it('server-filtered mode (onQueryChange, no filter) shows the options as given', () => {
    render(<Combobox aria-label="Find" options={OPTIONS} value={null} onChange={() => undefined} onQueryChange={() => undefined} />);
    fireEvent.change(input(), { target: { value: 'zzz' } });
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('a custom filter replaces the default one', () => {
    render(<Combobox aria-label="Find" options={OPTIONS} value={null} onChange={() => undefined} filter={(o, q) => o.value.startsWith(q)} />);
    fireEvent.change(input(), { target: { value: 'AM' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['AMDAdvanced Micro Devices']);
  });

  it('shows at most 50 options', () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ value: 'v' + i, label: 'Item ' + i }));
    render(<Combobox aria-label="Find" options={many} value={null} onChange={() => undefined} />);
    fireEvent.click(input());
    expect(screen.getAllByRole('option')).toHaveLength(50);
  });

  it('announces the result count, singular and plural, and the empty text', () => {
    render(<Harness />);
    const status = () => screen.getByRole('status').textContent;
    expect(status()).toBe('');
    fireEvent.click(input());
    expect(status()).toBe('4 results');
    fireEvent.change(input(), { target: { value: 'msft' } });
    expect(status()).toBe('1 result');
    fireEvent.change(input(), { target: { value: 'zzz' } });
    expect(status()).toBe('No matches');
  });

  it('scrolls the active option into view', () => {
    const spy = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = spy;
    render(<Harness />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(spy).toHaveBeenCalledWith({ block: 'nearest' });
    Element.prototype.scrollIntoView = original;
  });

  it('opening highlights the selected option', () => {
    render(<Harness initial="MSFT" />);
    fireEvent.click(input());
    const opts = screen.getAllByRole('option');
    expect(input().getAttribute('aria-activedescendant')).toBe(opts[2].id);
    expect(opts[2].getAttribute('data-state')).toBe('active');
    expect(opts[2].className).toContain('bg-th-accent-soft');
    expect(opts[0].className).not.toContain('bg-th-accent-soft');
    expect(opts[2].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowUp from the no-active state goes to the last enabled option, ArrowDown to the first', () => {
    render(<Harness />);
    fireEvent.click(input());
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    expect(input().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[2].id);
    fireEvent.keyDown(input(), { key: 'Escape' });
    fireEvent.click(input());
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(input().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);
  });

  it('Escape does not propagate while the list is open (a Modal stays open)', () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <Harness />
      </div>,
    );
    fireEvent.click(input());
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('a disabled combobox is disabled, marks data-disabled and does not open on ArrowDown', () => {
    const { container } = render(<Combobox aria-label="S" options={OPTIONS} value={null} onChange={() => undefined} disabled />);
    expect(input().disabled).toBe(true);
    expect((container.firstChild as HTMLElement).hasAttribute('data-disabled')).toBe(true);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('hovering an enabled option makes it active, a disabled one does not', () => {
    render(<Harness />);
    fireEvent.click(input());
    const opts = screen.getAllByRole('option');
    fireEvent.mouseMove(opts[1]);
    expect(input().getAttribute('aria-activedescendant')).toBe(opts[1].id);
    fireEvent.mouseMove(opts[3]);
    expect(input().getAttribute('aria-activedescendant')).toBe(opts[1].id);
  });

  it('ref goes to the input; id, rest, className and data-state to their places', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { container } = render(
      <Combobox ref={ref} id="sym" data-testid="root" className="x-cls" aria-label="S" options={OPTIONS} value={null} onChange={() => undefined} />,
    );
    expect(ref.current).toBe(input());
    expect(input().id).toBe('sym');
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('data-testid')).toBe('root');
    expect(root.className).toContain('x-cls');
    expect(root.getAttribute('data-state')).toBe('closed');
    fireEvent.click(input());
    expect(root.getAttribute('data-state')).toBe('open');
  });

  it('forwards aria-describedby, aria-invalid, invalid and required to the input', () => {
    render(<Combobox aria-label="S" aria-describedby="h" aria-invalid options={OPTIONS} value={null} onChange={() => undefined} required />);
    expect(input().getAttribute('aria-describedby')).toBe('h');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().required).toBe(true);
    expect(input().getAttribute('aria-required')).toBe('true');
    cleanup();
    render(<Combobox aria-label="S" invalid options={OPTIONS} value={null} onChange={() => undefined} />);
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('posts the selected value in a native form through a hidden input', () => {
    const { container } = render(
      <form>
        <Combobox aria-label="S" name="sym" options={OPTIONS} defaultValue="AMD" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('sym')).toBe('AMD');
    expect(new FormData(form).getAll('sym')).toHaveLength(1);
    fireEvent.change(input(), { target: { value: 'ms' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(new FormData(form).get('sym')).toBe('MSFT');
    expect(input().value).toBe('MSFT');
  });

  it('uncontrolled: defaultValue, onValueChange and form reset', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Combobox aria-label="S" name="sym" options={OPTIONS} defaultValue="AAPL" onValueChange={onValueChange} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(input().value).toBe('AAPL');
    fireEvent.click(input());
    fireEvent.click(screen.getByText('MSFT'));
    expect(onValueChange).toHaveBeenCalledWith('MSFT');
    expect(input().value).toBe('MSFT');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(new FormData(form).get('sym')).toBe('');
    fireEvent(form, new Event('reset'));
    expect(input().value).toBe('AAPL');
  });

  it('a controlled value does not change on a pick until the parent updates it', () => {
    render(<Combobox aria-label="S" options={OPTIONS} value="AAPL" onChange={() => undefined} />);
    fireEvent.click(input());
    fireEvent.click(screen.getByText('MSFT'));
    expect(input().value).toBe('AAPL');
  });

  it('re-indexes when the options change', () => {
    const { rerender } = render(<Combobox aria-label="S" options={OPTIONS} value={null} onChange={() => undefined} />);
    fireEvent.change(input(), { target: { value: 'tesla' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    rerender(<Combobox aria-label="S" options={[{ value: 'TSLA', label: 'TSLA', hint: 'Tesla' }]} value={null} onChange={() => undefined} />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('takes strings from a NishProvider and per-instance props win', () => {
    render(
      <NishProvider strings={{ noMatches: 'Nada', clear: 'Borrar', searching: 'Buscando…' }}>
        <Combobox aria-label="S" options={OPTIONS} value="AAPL" onChange={() => undefined} />
        <Combobox aria-label="T" options={OPTIONS} value="AAPL" onChange={() => undefined} clearLabel="Wipe" emptyText="None" />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wipe' })).toBeTruthy();
    const [a, b] = screen.getAllByRole('combobox');
    fireEvent.change(a, { target: { value: 'zzz' } });
    expect(screen.getAllByText('Nada').length).toBeGreaterThan(0);
    fireEvent.change(b, { target: { value: 'zzz' } });
    expect(screen.getAllByText('None').length).toBeGreaterThan(0);
  });

  it('Field wires id, aria-describedby, aria-invalid and required into the input', () => {
    render(
      <Field label="Symbol" error="Pick one" required>
        <Combobox options={OPTIONS} value={null} onChange={() => undefined} />
      </Field>,
    );
    const cb = input();
    expect(screen.getByText('Symbol').closest('label')?.getAttribute('for')).toBe(cb.id);
    expect(cb.getAttribute('aria-invalid')).toBe('true');
    expect(cb.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(cb.required).toBe(true);
  });
});
