import { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DateRange } from './calendar-classes';
import { DateRangePicker } from './date-range-picker';
import { Field } from './forms';
import { NishProvider } from './provider';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 5));
  });

const NOV: DateRange = { from: '2026-11-05', to: '2026-11-09' };
const NOV_TEXT = '11/05/2026 – 11/09/2026';
const NOV_LABEL = 'Change dates, Thursday, November 5, 2026 to Monday, November 9, 2026';

const input = () => screen.getByRole('textbox') as HTMLInputElement;
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const typeAndBlur = (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.blur(input());
};
const isWeekend = (iso: string) => {
  const w = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return w === 0 || w === 6;
};

function Controlled({
  onValueChange,
  initial = null,
  ...props
}: {
  onValueChange?: (v: DateRange | null) => void;
  initial?: DateRange | null;
  min?: string;
  max?: string;
  isDateDisabled?: (d: string) => boolean;
  allowDisabledInRange?: boolean;
}) {
  const [v, setV] = useState<DateRange | null>(initial);
  return (
    <DateRangePicker
      aria-label="Trip"
      value={v}
      onValueChange={(next) => {
        setV(next);
        onValueChange?.(next);
      }}
      locale="en-US"
      {...props}
    />
  );
}

describe('DateRangePicker structure', () => {
  it('puts ref on the input, className and rest on the wrapper', () => {
    const ref = createRef<HTMLInputElement>();
    render(<DateRangePicker ref={ref} aria-label="Trip" className="extra" data-x="1" locale="en-US" />);
    expect(ref.current).toBe(input());
    const wrapper = input().parentElement!;
    expect(wrapper.classList.contains('extra')).toBe(true);
    expect(wrapper.getAttribute('data-x')).toBe('1');
    expect(wrapper.getAttribute('data-state')).toBe('closed');
  });

  it('passes id and aria-describedby to the input', () => {
    render(
      <>
        <DateRangePicker id="trip" aria-describedby="help" aria-label="Trip" />
        <p id="help">Help</p>
      </>,
    );
    expect(input().id).toBe('trip');
    expect(input().getAttribute('aria-describedby')).toBe('help');
  });

  it('is reached by a Field label', () => {
    render(
      <Field label="Trip dates">
        <DateRangePicker locale="en-US" />
      </Field>,
    );
    expect(screen.getByLabelText('Trip dates')).toBe(input());
  });

  it('shows the locale pattern twice as the placeholder', () => {
    const { unmount } = render(<DateRangePicker aria-label="a" locale="en-US" />);
    expect(input().placeholder).toBe('MM/DD/YYYY – MM/DD/YYYY');
    unmount();
    render(<DateRangePicker aria-label="a" locale="de-DE" />);
    expect(input().placeholder).toBe('DD.MM.YYYY – DD.MM.YYYY');
  });

  it('disables both the input and the button', () => {
    render(<DateRangePicker aria-label="Trip" disabled />);
    expect(input().disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Choose dates' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('formats a range in de-DE', () => {
    render(<DateRangePicker aria-label="Trip" locale="de-DE" defaultValue={NOV} />);
    expect(input().value).toBe('05.11.2026 – 09.11.2026');
  });
});

describe('DateRangePicker typing', () => {
  it('commits a typed range on blur and formats it', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur(NOV_TEXT);
    expect(spy).toHaveBeenCalledWith(NOV);
    expect(input().value).toBe(NOV_TEXT);
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('commits a range typed in the wrong order, ordered', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur('11/09/2026 - 11/05/2026');
    expect(spy).toHaveBeenCalledWith(NOV);
    expect(input().value).toBe(NOV_TEXT);
  });

  it('commits one date as a one-day range', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur('11/05/2026');
    expect(spy).toHaveBeenCalledWith({ from: '2026-11-05', to: '2026-11-05' });
    expect(input().value).toBe('11/05/2026 – 11/05/2026');
  });

  it('does not report an unchanged range', () => {
    const spy = vi.fn();
    render(<Controlled initial={NOV} onValueChange={spy} />);
    typeAndBlur('2026-11-05/2026-11-09');
    expect(spy).not.toHaveBeenCalled();
    expect(input().value).toBe(NOV_TEXT);
  });

  it('marks an unreadable range invalid, keeps the text and sets the validity message', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur('13/40/2026 – nope');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().value).toBe('13/40/2026 – nope');
    expect(input().validationMessage).toBe('Enter a valid date range.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses a range outside min and max', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} min="2026-11-03" max="2026-12-01" />);
    typeAndBlur('11/05/2026 – 12/02/2026');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    typeAndBlur('11/02/2026 – 11/05/2026');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(spy).not.toHaveBeenCalled();
    typeAndBlur('11/03/2026 – 12/01/2026');
    expect(spy).toHaveBeenCalledWith({ from: '2026-11-03', to: '2026-12-01' });
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('refuses a range that covers a disabled day, unless allowDisabledInRange', () => {
    const spy = vi.fn();
    const disabled = (d: string) => d === '2026-11-07';
    const { unmount } = render(<Controlled onValueChange={spy} isDateDisabled={disabled} />);
    typeAndBlur(NOV_TEXT);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(spy).not.toHaveBeenCalled();
    unmount();
    render(<Controlled onValueChange={spy} isDateDisabled={disabled} allowDisabledInRange />);
    typeAndBlur(NOV_TEXT);
    expect(spy).toHaveBeenCalledWith(NOV);
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('refuses an end on a disabled day even with allowDisabledInRange', () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} isDateDisabled={(d) => d === '2026-11-09'} allowDisabledInRange />);
    typeAndBlur(NOV_TEXT);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    typeAndBlur('11/09/2026 – 11/12/2026');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(spy).not.toHaveBeenCalled();
  });

  it('clears with null when the text is emptied', () => {
    const spy = vi.fn();
    render(<Controlled initial={NOV} onValueChange={spy} />);
    expect(input().value).toBe(NOV_TEXT);
    typeAndBlur('');
    expect(spy).toHaveBeenCalledWith(null);
    expect(input().value).toBe('');
  });

  it('commits on Enter while dirty and keeps the form from submitting', () => {
    const spy = vi.fn();
    const submit = vi.fn();
    render(
      <form onSubmit={submit}>
        <Controlled onValueChange={spy} />
      </form>,
    );
    fireEvent.change(input(), { target: { value: NOV_TEXT } });
    const notPrevented = fireEvent.keyDown(input(), { key: 'Enter' });
    expect(notPrevented).toBe(false);
    expect(spy).toHaveBeenCalledWith(NOV);
    expect(submit).not.toHaveBeenCalled();
  });

  it('lets Enter through when the text is not dirty', () => {
    render(<Controlled initial={NOV} />);
    expect(fireEvent.keyDown(input(), { key: 'Enter' })).toBe(true);
  });

  it('restores the formatted value on Escape while dirty', () => {
    const parent = vi.fn();
    render(
      <div onKeyDown={parent}>
        <Controlled initial={NOV} />
      </div>,
    );
    fireEvent.change(input(), { target: { value: 'garbage' } });
    expect(input().value).toBe('garbage');
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(input().value).toBe(NOV_TEXT);
    expect(parent).not.toHaveBeenCalled();
  });
});

describe('DateRangePicker controlled and uncontrolled', () => {
  it('uncontrolled keeps its own value and reports changes', () => {
    const spy = vi.fn();
    render(<DateRangePicker aria-label="Trip" locale="en-US" defaultValue={NOV} onValueChange={spy} />);
    expect(input().value).toBe(NOV_TEXT);
    typeAndBlur('12/01/2026 – 12/03/2026');
    expect(spy).toHaveBeenCalledWith({ from: '2026-12-01', to: '2026-12-03' });
    expect(input().value).toBe('12/01/2026 – 12/03/2026');
  });

  it('controlled follows value and does not change by itself', () => {
    const spy = vi.fn();
    const { rerender } = render(<DateRangePicker aria-label="Trip" locale="en-US" value={NOV} onValueChange={spy} />);
    typeAndBlur('12/01/2026 – 12/03/2026');
    expect(spy).toHaveBeenCalledWith({ from: '2026-12-01', to: '2026-12-03' });
    rerender(
      <DateRangePicker
        aria-label="Trip"
        locale="en-US"
        value={{ from: '2026-12-01', to: '2026-12-03' }}
        onValueChange={spy}
      />,
    );
    expect(input().value).toBe('12/01/2026 – 12/03/2026');
  });

  it('treats an invalid value as none', () => {
    render(<DateRangePicker aria-label="Trip" locale="en-US" value={{ from: 'x', to: '2026-11-09' }} />);
    expect(input().value).toBe('');
  });
});

describe('DateRangePicker calendar', () => {
  it('opens a dialog named Choose dates from the button', async () => {
    render(<Controlled />);
    const button = screen.getByRole('button', { name: 'Choose dates' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    await settle();
    expect(screen.getByRole('dialog', { name: 'Choose dates' })).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('opens with Alt+ArrowDown from the input', async () => {
    render(<Controlled />);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(input(), { key: 'ArrowDown', altKey: true });
    await settle();
    expect(screen.getByRole('dialog', { name: 'Choose dates' })).toBeTruthy();
  });

  it('commits after two presses, closes and focuses the button', async () => {
    const spy = vi.fn();
    render(<Controlled initial={NOV} onValueChange={spy} />);
    const button = screen.getByRole('button', { name: NOV_LABEL });
    fireEvent.click(button);
    await settle();
    fireEvent.click(day('2026-11-12'));
    await settle();
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(spy).not.toHaveBeenCalled();
    fireEvent.click(day('2026-11-14'));
    await settle();
    expect(spy).toHaveBeenCalledWith({ from: '2026-11-12', to: '2026-11-14' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(input().value).toBe('11/12/2026 – 11/14/2026');
    expect(document.activeElement).toBe(button);
  });

  it('keeps the popover open after one press', async () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose dates' }));
    await settle();
    fireEvent.click(day('2026-11-12'));
    await settle();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('Escape drops a half range and keeps the popover open; a second Escape closes it', async () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    const button = screen.getByRole('button', { name: 'Choose dates' });
    fireEvent.click(button);
    await settle();
    fireEvent.click(day('2026-11-12'));
    await settle();
    expect(day('2026-11-12').getAttribute('data-state')).toBe('active');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await settle();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(day('2026-11-12').getAttribute('data-state')).not.toBe('active');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not let a press cover a disabled day in the calendar', async () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} isDateDisabled={(d) => isWeekend(d)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose dates' }));
    await settle();
    fireEvent.click(day('2026-11-05'));
    fireEvent.click(day('2026-11-12'));
    await settle();
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('lets calendarLabel win over the default name', () => {
    render(<DateRangePicker aria-label="Trip" calendarLabel="Pick days" />);
    expect(screen.getByRole('button', { name: 'Pick days' })).toBeTruthy();
  });

  it('names the button after the range once set', () => {
    render(<Controlled initial={NOV} />);
    expect(screen.getByRole('button', { name: NOV_LABEL })).toBeTruthy();
  });

  it('takes strings from a provider', async () => {
    render(
      <NishProvider
        strings={{
          chooseDates: 'Tage wählen',
          changeDates: (r) => `Tage ändern, ${r}`,
          dateRange: (a, b) => `${a} bis ${b}`,
          invalidDateRange: 'Ungültiger Zeitraum.',
        }}
      >
        <DateRangePicker aria-label="Trip" locale="en-US" />
        <DateRangePicker aria-label="Trip 2" locale="en-US" defaultValue={NOV} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Tage wählen' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Tage ändern, Thursday, November 5, 2026 bis Monday, November 9, 2026' }),
    ).toBeTruthy();
    const first = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(first, { target: { value: 'x' } });
    fireEvent.blur(first);
    expect(first.validationMessage).toBe('Ungültiger Zeitraum.');
    fireEvent.click(screen.getByRole('button', { name: 'Tage wählen' }));
    await settle();
    expect(screen.getByRole('dialog', { name: 'Tage wählen' })).toBeTruthy();
  });

  it('takes the placeholder tokens from a provider', () => {
    render(
      <NishProvider strings={{ dayToken: 'TT', monthToken: 'MM', yearToken: 'JJJJ' }}>
        <DateRangePicker aria-label="Trip" locale="de-DE" />
      </NishProvider>,
    );
    expect(input().placeholder).toBe('TT.MM.JJJJ – TT.MM.JJJJ');
  });
});

describe('DateRangePicker form use', () => {
  it('posts an ISO interval in a hidden input, or an empty string', () => {
    const { container, unmount } = render(
      <form>
        <DateRangePicker aria-label="Trip" name="trip" defaultValue={NOV} />
      </form>,
    );
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="trip"]')!;
    expect(hidden.value).toBe('2026-11-05/2026-11-09');
    expect(new FormData(container.querySelector('form')!).get('trip')).toBe('2026-11-05/2026-11-09');
    unmount();
    const again = render(
      <form>
        <DateRangePicker aria-label="Trip" name="trip" />
      </form>,
    );
    expect(new FormData(again.container.querySelector('form')!).get('trip')).toBe('');
  });

  it('refuses to submit while the typed text is unreadable', () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Trip" name="trip" locale="en-US" defaultValue={NOV} />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(form.checkValidity()).toBe(true);
    typeAndBlur('13/40/2026');
    expect(form.checkValidity()).toBe(false);
    typeAndBlur('12/25/2026 – 12/27/2026');
    expect(form.checkValidity()).toBe(true);
  });

  it('posts nothing extra without a name', () => {
    const { container } = render(<DateRangePicker aria-label="Trip" />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('returns to defaultValue when the form resets', () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Trip" name="trip" locale="en-US" defaultValue={NOV} />
      </form>,
    );
    typeAndBlur('12/25/2026 – 12/27/2026');
    expect(input().value).toBe('12/25/2026 – 12/27/2026');
    act(() => {
      container.querySelector('form')!.dispatchEvent(new Event('reset'));
    });
    expect(input().value).toBe(NOV_TEXT);
  });

  it('marks the input required', () => {
    render(<DateRangePicker aria-label="Trip" required />);
    expect(input().required).toBe(true);
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('honors invalid and aria-invalid from outside', () => {
    const { unmount } = render(<DateRangePicker aria-label="Trip" invalid />);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    unmount();
    render(<DateRangePicker aria-label="Trip" aria-invalid="true" />);
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });
});
