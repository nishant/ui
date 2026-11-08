import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NishProvider } from './provider';
import { RangeCalendar } from './range-calendar';

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
const press = (iso: string) => fireEvent.click(day(iso));
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k });
const active = () => [...document.querySelectorAll('[data-state="active"]')].map((b) => b.getAttribute('data-date'));
const live = () => document.querySelector('[aria-live="polite"].sr-only')!.textContent;
const isWeekend = (iso: string) => {
  const w = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return w === 0 || w === 6;
};

describe('RangeCalendar structure', () => {
  it('puts ref, className and rest on the root and marks the grid multiselectable', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RangeCalendar ref={ref} className="extra" data-x="1" id="rc" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current!.classList.contains('extra')).toBe(true);
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(ref.current!.getAttribute('id')).toBe('rc');
    expect(screen.getByRole('grid').getAttribute('aria-multiselectable')).toBe('true');
  });

  it('opens on the month of an uncontrolled defaultValue', () => {
    render(<RangeCalendar defaultValue={{ from: '2027-02-10', to: '2027-02-12' }} />);
    expect(screen.getByRole('grid', { name: 'February 2027' })).toBeTruthy();
  });
});

describe('RangeCalendar picking', () => {
  it('the first press sets only the anchor and reports nothing', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar onValueChange={onValueChange} />);
    press('2026-11-05');
    expect(active()).toEqual(['2026-11-05']);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(day('2026-11-05').closest('td')!.getAttribute('aria-selected')).toBe('true');
    expect(day('2026-11-06').closest('td')!.getAttribute('aria-selected')).toBe('false');
  });

  it('the second press later reports { from, to }', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar onValueChange={onValueChange} />);
    press('2026-11-05');
    press('2026-11-09');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-05', to: '2026-11-09' });
    expect(active()).toEqual(['2026-11-05', '2026-11-09']);
    expect(day('2026-11-05').getAttribute('data-range')).toBe('start');
    expect(day('2026-11-07').getAttribute('data-range')).toBe('middle');
    expect(day('2026-11-09').getAttribute('data-range')).toBe('end');
    for (const d of ['05', '06', '07', '08', '09']) {
      expect(day(`2026-11-${d}`).closest('td')!.getAttribute('aria-selected')).toBe('true');
    }
    expect(day('2026-11-10').closest('td')!.getAttribute('aria-selected')).toBe('false');
  });

  it('an earlier second press swaps the days', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar onValueChange={onValueChange} />);
    press('2026-11-09');
    press('2026-11-05');
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-05', to: '2026-11-09' });
  });

  it('the same day twice is a one-day range', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar onValueChange={onValueChange} />);
    press('2026-11-05');
    press('2026-11-05');
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-05', to: '2026-11-05' });
    expect(active()).toEqual(['2026-11-05']);
    expect(document.querySelector('[data-range]')).toBeNull();
  });

  it('a third press starts a new range', () => {
    render(<RangeCalendar defaultValue={{ from: '2026-11-05', to: '2026-11-09' }} />);
    press('2026-11-12');
    expect(active()).toEqual(['2026-11-12']);
    expect(document.querySelector('[data-range]')).toBeNull();
  });

  it('does nothing for a disabled day as the second press', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar onValueChange={onValueChange} isDateDisabled={isWeekend} />);
    press('2026-11-05');
    press('2026-11-07');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(active()).toEqual(['2026-11-05']);
  });

  it('follows a controlled value and does not change it itself', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RangeCalendar value={{ from: '2026-11-05', to: '2026-11-07' }} onValueChange={onValueChange} />,
    );
    expect(active()).toEqual(['2026-11-05', '2026-11-07']);
    press('2026-11-10');
    press('2026-11-12');
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-10', to: '2026-11-12' });
    expect(active()).toEqual(['2026-11-05', '2026-11-07']);
    rerender(<RangeCalendar value={{ from: '2026-11-10', to: '2026-11-12' }} />);
    expect(active()).toEqual(['2026-11-10', '2026-11-12']);
    rerender(<RangeCalendar value={null} />);
    expect(active()).toEqual([]);
  });
});

describe('RangeCalendar preview', () => {
  it('hover after the first press marks the days between', () => {
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    fireEvent.pointerEnter(day('2026-11-08'), { pointerType: 'mouse' });
    expect(day('2026-11-05').hasAttribute('data-preview')).toBe(false);
    expect(day('2026-11-06').hasAttribute('data-preview')).toBe(true);
    expect(day('2026-11-06').getAttribute('data-range')).toBe('middle');
    expect(day('2026-11-08').getAttribute('data-range')).toBe('end');
    expect(day('2026-11-09').hasAttribute('data-preview')).toBe(false);
    expect(day('2026-11-08').closest('td')!.getAttribute('aria-selected')).toBe('false');
  });

  it('draws no preview for a touch pointer', () => {
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    fireEvent.pointerEnter(day('2026-11-08'), { pointerType: 'touch' });
    expect(document.querySelector('[data-preview]')).toBeNull();
  });

  it('falls back to the focused day when the pointer leaves the grid', () => {
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    day('2026-11-07').focus();
    fireEvent.pointerEnter(day('2026-11-10'), { pointerType: 'mouse' });
    expect(day('2026-11-10').hasAttribute('data-preview')).toBe(true);
    fireEvent.pointerLeave(screen.getByRole('grid'));
    expect(day('2026-11-10').hasAttribute('data-preview')).toBe(false);
    expect(day('2026-11-07').hasAttribute('data-preview')).toBe(true);
  });

  it('moves the preview with the keyboard focus', () => {
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    key(day('2026-11-05'), 'ArrowRight');
    expect(document.activeElement).toBe(day('2026-11-06'));
    expect(day('2026-11-06').hasAttribute('data-preview')).toBe(true);
    expect(day('2026-11-06').getAttribute('data-range')).toBe('end');
    key(document.activeElement!, 'ArrowRight');
    expect(day('2026-11-07').hasAttribute('data-preview')).toBe(true);
    expect(day('2026-11-06').getAttribute('data-range')).toBe('middle');
  });

  it('does not draw across a disabled day', () => {
    render(<RangeCalendar defaultMonth="2026-11" isDateDisabled={isWeekend} />);
    press('2026-11-06');
    fireEvent.pointerEnter(day('2026-11-09'), { pointerType: 'mouse' });
    expect(document.querySelector('[data-preview]')).toBeNull();
    fireEvent.pointerEnter(day('2026-11-07'), { pointerType: 'mouse' });
    expect(document.querySelector('[data-preview]')).toBeNull();
  });
});

describe('RangeCalendar Escape', () => {
  it('drops the anchor, empties the live region and stops the event', () => {
    const onDoc = vi.fn();
    document.addEventListener('keydown', onDoc);
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    expect(live()).not.toBe('');
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => {
      day('2026-11-05').dispatchEvent(ev);
    });
    expect(ev.defaultPrevented).toBe(true);
    expect(onDoc).not.toHaveBeenCalled();
    expect(active()).toEqual([]);
    expect(live()).toBe('');
    document.removeEventListener('keydown', onDoc);
  });

  it('reaches the document when there is no anchor', () => {
    const onDoc = vi.fn();
    document.addEventListener('keydown', onDoc);
    render(<RangeCalendar defaultMonth="2026-11" />);
    key(day('2026-11-05'), 'Escape');
    expect(onDoc).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', onDoc);
  });
});

describe('RangeCalendar disabled days', () => {
  it('a second press over a weekend starts a new range at that day', () => {
    const onValueChange = vi.fn();
    render(<RangeCalendar defaultMonth="2026-11" isDateDisabled={isWeekend} onValueChange={onValueChange} />);
    press('2026-11-06');
    press('2026-11-09');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(active()).toEqual(['2026-11-09']);
    expect(live()).toBe('Start date Monday, November 9, 2026. Pick the end date.');
  });

  it('allowDisabledInRange keeps the range', () => {
    const onValueChange = vi.fn();
    render(
      <RangeCalendar defaultMonth="2026-11" isDateDisabled={isWeekend} allowDisabledInRange onValueChange={onValueChange} />,
    );
    press('2026-11-06');
    press('2026-11-09');
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-06', to: '2026-11-09' });
  });
});

describe('RangeCalendar prop checks', () => {
  it('swaps a reversed value and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<RangeCalendar value={{ from: '2026-11-09', to: '2026-11-05' }} />);
    rerender(<RangeCalendar value={{ from: '2026-11-09', to: '2026-11-05' }} />);
    expect(active()).toEqual(['2026-11-05', '2026-11-09']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toBe('RangeCalendar: "value" has from after to; the days were swapped');
  });

  it('draws nothing for a malformed value and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = { from: 'x', to: 'y' };
    const { rerender } = render(<RangeCalendar value={bad} />);
    rerender(<RangeCalendar value={bad} />);
    expect(active()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toBe('RangeCalendar: "value" must be { from, to } with YYYY-MM-DD days');
  });
});

describe('RangeCalendar live region and strings', () => {
  it('announces the start and then the range', () => {
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    expect(live()).toBe('Start date Thursday, November 5, 2026. Pick the end date.');
    press('2026-11-09');
    expect(live()).toBe('Thursday, November 5, 2026 to Monday, November 9, 2026');
  });

  it('reads strings from a provider', () => {
    render(
      <NishProvider strings={{ rangeStarted: (s: string) => `Von ${s}` }}>
        <RangeCalendar defaultMonth="2026-11" />
      </NishProvider>,
    );
    press('2026-11-05');
    expect(live()).toBe('Von Thursday, November 5, 2026');
  });
});

describe('RangeCalendar RTL', () => {
  it('ArrowLeft moves to the next day', () => {
    rtl.on = true;
    render(<RangeCalendar defaultMonth="2026-11" />);
    press('2026-11-05');
    key(day('2026-11-05'), 'ArrowLeft');
    expect(document.activeElement).toBe(day('2026-11-06'));
  });
});
