import { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './calendar';
import { NishProvider } from './provider';

const rtl = vi.hoisted(() => ({ on: false }));
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  isRtl: () => rtl.on,
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 5, 12));
});

afterEach(() => {
  cleanup();
  rtl.on = false;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const key = (el: Element, k: string, shiftKey = false) => fireEvent.keyDown(el, { key: k, shiftKey });

describe('Calendar structure', () => {
  it('puts ref, className and rest on the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Calendar ref={ref} className="extra" data-x="1" id="cal" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current!.classList.contains('extra')).toBe(true);
    expect(ref.current!.classList.contains('inline-flex')).toBe(true);
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(ref.current!.getAttribute('id')).toBe('cal');
  });

  it('labels the grid with the month title and renders 6 body rows', () => {
    render(<Calendar />);
    const grid = screen.getByRole('grid', { name: 'November 2026' });
    expect(grid.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(grid.querySelectorAll('thead th')).toHaveLength(7);
  });

  it('marks today with aria-current', () => {
    render(<Calendar />);
    expect(day('2026-11-05').getAttribute('aria-current')).toBe('date');
    expect(day('2026-11-06').hasAttribute('aria-current')).toBe(false);
  });

  it('puts data-autofocus on the Tab stop only with autoFocus', () => {
    const { unmount } = render(<Calendar />);
    expect(document.querySelector('[data-autofocus]')).toBeNull();
    unmount();
    render(<Calendar autoFocus />);
    expect(document.querySelectorAll('[data-autofocus]')).toHaveLength(1);
    expect(day('2026-11-05').hasAttribute('data-autofocus')).toBe(true);
  });
});

describe('Calendar Tab stop', () => {
  it('is the selected day first', () => {
    render(<Calendar defaultValue="2026-11-20" />);
    expect(day('2026-11-20').getAttribute('tabindex')).toBe('0');
    expect(document.querySelectorAll('[data-date][tabindex="0"]')).toHaveLength(1);
  });

  it('is today when nothing is selected', () => {
    render(<Calendar />);
    expect(day('2026-11-05').getAttribute('tabindex')).toBe('0');
  });

  it('is the first enabled day in another month', () => {
    render(<Calendar defaultMonth="2026-03" isDateDisabled={(d) => d < '2026-03-04'} />);
    expect(day('2026-03-04').getAttribute('tabindex')).toBe('0');
    expect(day('2026-03-01').getAttribute('tabindex')).toBe('-1');
  });
});

describe('Calendar keyboard', () => {
  it('moves focus with the arrow, Home and End keys', () => {
    render(<Calendar defaultValue="2026-11-11" />);
    const start = day('2026-11-11');
    start.focus();
    key(start, 'ArrowRight');
    expect(document.activeElement).toBe(day('2026-11-12'));
    key(document.activeElement!, 'ArrowLeft');
    expect(document.activeElement).toBe(day('2026-11-11'));
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement).toBe(day('2026-11-18'));
    key(document.activeElement!, 'ArrowUp');
    expect(document.activeElement).toBe(day('2026-11-11'));
    key(document.activeElement!, 'Home');
    expect(document.activeElement).toBe(day('2026-11-08'));
    key(document.activeElement!, 'End');
    expect(document.activeElement).toBe(day('2026-11-14'));
  });

  it('PageDown from Jan 31 lands on Feb 28 and shows February', () => {
    render(<Calendar defaultValue="2026-01-31" />);
    day('2026-01-31').focus();
    key(document.activeElement!, 'PageDown');
    expect(document.activeElement).toBe(day('2026-02-28'));
    expect(screen.getByRole('grid', { name: 'February 2026' })).toBeTruthy();
  });

  it('Shift+PageUp moves back a year', () => {
    render(<Calendar defaultValue="2026-11-05" />);
    day('2026-11-05').focus();
    key(document.activeElement!, 'PageUp', true);
    expect(document.activeElement).toBe(day('2025-11-05'));
    expect(screen.getByRole('grid', { name: 'November 2025' })).toBeTruthy();
  });

  it('swaps ArrowLeft and ArrowRight in RTL', () => {
    rtl.on = true;
    render(<Calendar defaultValue="2026-11-11" />);
    day('2026-11-11').focus();
    key(document.activeElement!, 'ArrowLeft');
    expect(document.activeElement).toBe(day('2026-11-12'));
  });

  it('clamps focus at max', () => {
    render(<Calendar defaultValue="2026-11-10" max="2026-11-12" />);
    day('2026-11-10').focus();
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement).toBe(day('2026-11-12'));
  });

  it('keeps disabled days reachable', () => {
    render(<Calendar defaultValue="2026-11-10" isDateDisabled={(d) => d === '2026-11-11'} />);
    day('2026-11-10').focus();
    key(document.activeElement!, 'ArrowRight');
    expect(document.activeElement).toBe(day('2026-11-11'));
    expect(day('2026-11-11').getAttribute('aria-disabled')).toBe('true');
  });

  it('ignores other keys', () => {
    render(<Calendar />);
    day('2026-11-05').focus();
    key(document.activeElement!, 'a');
    expect(document.activeElement).toBe(day('2026-11-05'));
  });
});

describe('Calendar value', () => {
  it('selects on click in an uncontrolled calendar', () => {
    const onValueChange = vi.fn();
    render(<Calendar onValueChange={onValueChange} />);
    fireEvent.click(day('2026-11-09'));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-09');
    expect(day('2026-11-09').closest('td')!.getAttribute('aria-selected')).toBe('true');
  });

  it('selects on Enter (a native button click)', () => {
    const onValueChange = vi.fn();
    render(<Calendar onValueChange={onValueChange} />);
    day('2026-11-05').focus();
    fireEvent.click(document.activeElement!);
    expect(onValueChange).toHaveBeenCalledWith('2026-11-05');
  });

  it('does nothing on a disabled day', () => {
    const onValueChange = vi.fn();
    render(<Calendar onValueChange={onValueChange} min="2026-11-10" />);
    fireEvent.click(day('2026-11-02'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(day('2026-11-02').closest('td')!.getAttribute('aria-selected')).toBe('false');
  });

  it('follows a controlled value and does not change by itself', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Calendar value="2026-11-03" onValueChange={onValueChange} />);
    expect(day('2026-11-03').closest('td')!.getAttribute('aria-selected')).toBe('true');
    fireEvent.click(day('2026-11-09'));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-09');
    expect(day('2026-11-03').closest('td')!.getAttribute('aria-selected')).toBe('true');
    rerender(<Calendar value="2026-11-09" onValueChange={onValueChange} />);
    expect(day('2026-11-09').closest('td')!.getAttribute('aria-selected')).toBe('true');
  });

  it('works with a state-driven parent', () => {
    function Parent() {
      const [v, setV] = useState<string | null>(null);
      return <Calendar value={v} onValueChange={setV} />;
    }
    render(<Parent />);
    fireEvent.click(day('2026-11-20'));
    expect(day('2026-11-20').closest('td')!.getAttribute('aria-selected')).toBe('true');
  });
});

describe('Calendar month', () => {
  it('changes month with the buttons and reports it', () => {
    const onMonthChange = vi.fn();
    render(<Calendar onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onMonthChange).toHaveBeenCalledWith('2026-12');
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-11');
  });

  it('is controlled by month + onMonthChange', () => {
    const onMonthChange = vi.fn();
    render(<Calendar month="2026-05" onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onMonthChange).toHaveBeenCalledWith('2026-06');
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeTruthy();
  });

  it('disables previous at the min month and next at the max month', () => {
    render(<Calendar min="2026-11-03" max="2026-11-24" />);
    expect(screen.getByRole('button', { name: 'Previous month' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Next month' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('changes month and year through the selects', () => {
    const onMonthChange = vi.fn();
    render(<Calendar captionLayout="dropdowns" fromYear={2020} toYear={2030} onMonthChange={onMonthChange} />);
    fireEvent.change(screen.getByLabelText('Month'), {
      target: { value: '3' },
    });
    expect(onMonthChange).toHaveBeenCalledWith('2026-03');
    fireEvent.change(screen.getByLabelText('Year'), {
      target: { value: '2024' },
    });
    expect(onMonthChange).toHaveBeenLastCalledWith('2024-03');
    expect(screen.getByRole('grid', { name: 'March 2024' })).toBeTruthy();
  });
});

describe('Calendar strings and warnings', () => {
  it('reads button names from the provider', () => {
    render(
      <NishProvider strings={{ previousMonth: 'Zurück' }}>
        <Calendar />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeTruthy();
  });

  it('lets previousMonthLabel win over the provider', () => {
    render(
      <NishProvider strings={{ previousMonth: 'Zurück' }}>
        <Calendar previousMonthLabel="Vorher" nextMonthLabel="Weiter" />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Vorher' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy();
  });

  it('warns once about an invalid min and ignores it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Calendar min="nope" />);
    rerender(<Calendar min="nope" />);
    act(() => {});
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Calendar: "min" must be YYYY-MM-DD');
    expect(screen.getByRole('button', { name: 'Previous month' }).getAttribute('aria-disabled')).toBeNull();
  });

  it('uses the locale for names and the week start', () => {
    render(<Calendar locale="de-DE" />);
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeTruthy();
    expect(document.querySelector('thead th')!.getAttribute('abbr')).toBe('Montag');
  });

  it('does not steal focus on a later render after a no-op key', () => {
    function Host() {
      const [text, setText] = useState('');
      return (
        <div>
          <Calendar defaultValue="2026-11-01" />
          <input aria-label="other" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      );
    }
    render(<Host />);
    const sunday = screen.getByRole('grid').querySelector<HTMLElement>('[data-date="2026-11-01"]')!;
    sunday.focus();
    key(sunday, 'Home');
    key(document.activeElement!, 'Home');
    const input = screen.getByLabelText('other') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'a' } });
    expect(document.activeElement).toBe(input);
  });

  it('stays inside years 0001 to 9999', () => {
    render(<Calendar defaultValue="0001-01-01" />);
    const first = screen.getByRole('grid').querySelector<HTMLElement>('[data-date="0001-01-01"]')!;
    first.focus();
    key(first, 'ArrowLeft');
    expect(document.activeElement?.getAttribute('data-date')).toBe('0001-01-01');
    expect(screen.getByRole('grid').getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('does not pass year 9999 (PageDown and Next month)', () => {
    render(<Calendar defaultValue="9999-12-15" />);
    const day = screen.getByRole('grid').querySelector<HTMLElement>('[data-date="9999-12-15"]')!;
    day.focus();
    key(day, 'PageDown');
    expect(document.activeElement?.getAttribute('data-date')).toBe('9999-12-15');
    expect(screen.getByRole('grid').querySelectorAll('[data-date]').length).toBeGreaterThan(27);
    const next = screen.getByRole('button', { name: /next month/i });
    expect(next.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(next);
    expect(screen.getByRole('grid').querySelector('[data-date="9999-12-15"]')).toBeTruthy();
  });
});

describe('Calendar midnight and min/max dropdowns', () => {
  it('moves today past midnight', () => {
    vi.setSystemTime(new Date(2026, 10, 5, 23, 59, 50));
    render(<Calendar />);
    expect(day('2026-11-05').getAttribute('aria-current')).toBe('date');
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(day('2026-11-06').getAttribute('aria-current')).toBe('date');
    expect(day('2026-11-05').hasAttribute('aria-current')).toBe(false);
  });

  it('disables months before min and ignores a forced change', () => {
    render(<Calendar captionLayout="dropdowns" min="2026-11-03" />);
    const select = screen.getByLabelText('Month') as HTMLSelectElement;
    const opts = Array.from(select.options);
    expect(opts.slice(0, 10).every((o) => o.disabled)).toBe(true);
    expect(opts[10]!.disabled).toBe(false);
    fireEvent.change(select, { target: { value: '3' } });
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeTruthy();
  });
});
