import { afterEach, describe, expect, it, vi } from 'vitest';
import { cn } from '../cn';
import {
  addDays,
  addMonths,
  addYears,
  calendarDayClass,
  calendarKeyTarget,
  clampIso,
  dateFieldParts,
  datePlaceholder,
  dayNumber,
  daysInMonth,
  expandTwoDigitYear,
  endOfWeek,
  firstDisabledIn,
  firstOfMonth,
  formatDateField,
  formatRangeField,
  fullDate,
  inRange,
  isoToday,
  monthGrid,
  monthNames,
  monthOf,
  monthTitle,
  msUntilNextMidnight,
  orderRange,
  parseDateField,
  parseIso,
  parseMonth,
  parseRangeField,
  rangePlaceholder,
  resolveLocale,
  sameRange,
  shiftMonth,
  startOfWeek,
  toIso,
  toRange,
  weekStartFor,
  weekday,
  weekdayNames,
} from './calendar-classes';

describe('iso parsing and math', () => {
  it('parseIso accepts real days only', () => {
    expect(parseIso('2026-02-29')).toBeNull();
    expect(parseIso('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 });
    expect(parseIso('2026-13-01')).toBeNull();
    expect(parseIso('0000-01-01')).toBeNull();
    expect(parseIso('2026-1-1')).toBeNull();
    expect(parseIso(null)).toBeNull();
    expect(parseIso(undefined)).toBeNull();
  });

  it('round-trips year 0042', () => {
    expect(toIso({ y: 42, m: 1, d: 5 })).toBe('0042-01-05');
    expect(parseIso('0042-01-05')).toEqual({ y: 42, m: 1, d: 5 });
    expect(addDays('0042-01-05', 1)).toBe('0042-01-06');
  });

  it('parseMonth, monthOf, firstOfMonth, shiftMonth', () => {
    expect(parseMonth('2026-11')).toEqual({ y: 2026, m: 11 });
    expect(parseMonth('2026-13')).toBeNull();
    expect(parseMonth('2026-11-05')).toBeNull();
    expect(monthOf('2026-11-05')).toBe('2026-11');
    expect(firstOfMonth('2026-11')).toBe('2026-11-01');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('daysInMonth handles leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it('addDays crosses a year end', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-11-05', 7)).toBe('2026-11-12');
  });

  it('addMonths clamps the day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('addYears clamps a leap day', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2026-11-05', -1)).toBe('2025-11-05');
  });

  it('weekday, startOfWeek, endOfWeek', () => {
    expect(weekday('2026-11-05')).toBe(4);
    expect(startOfWeek('2026-11-05', 0)).toBe('2026-11-01');
    expect(startOfWeek('2026-11-05', 1)).toBe('2026-11-02');
    expect(endOfWeek('2026-11-05', 0)).toBe('2026-11-07');
    expect(endOfWeek('2026-11-05', 1)).toBe('2026-11-08');
  });

  it('clampIso and inRange', () => {
    expect(clampIso('2026-11-05', '2026-11-10', null)).toBe('2026-11-10');
    expect(clampIso('2026-11-05', null, '2026-11-01')).toBe('2026-11-01');
    expect(clampIso('2026-11-05', '2026-11-01', '2026-11-30')).toBe('2026-11-05');
    expect(clampIso('2026-11-05')).toBe('2026-11-05');
    expect(inRange('2026-11-05', '2026-11-05', '2026-11-05')).toBe(true);
    expect(inRange('2026-11-04', '2026-11-05', null)).toBe(false);
    expect(inRange('2026-11-06', null, '2026-11-05')).toBe(false);
  });

  it('isoToday is the viewer local day', () => {
    expect(isoToday(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(isoToday(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('monthGrid', () => {
  it('has 6 rows of 7 starting on the week start', () => {
    const g = monthGrid('2026-11', 0);
    expect(g).toHaveLength(6);
    for (const row of g) expect(row).toHaveLength(7);
    expect(g[0]![0]).toBe('2026-11-01');
    expect(g[4]![1]).toBe('2026-11-30');
    expect(g[4]![2]).toBeNull();
    expect(g[5]!.every((c) => c === null)).toBe(true);
  });

  it('pads the first row for a Monday start', () => {
    const g = monthGrid('2026-11', 1);
    expect(g[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(g.flat().filter(Boolean)).toHaveLength(30);
  });

  it('returns an empty grid for a bad month', () => {
    expect(monthGrid('nope', 0).flat().every((c) => c === null)).toBe(true);
  });
});

describe('calendarKeyTarget', () => {
  const from = '2026-11-05';
  it('moves by day and week', () => {
    expect(calendarKeyTarget('ArrowRight', false, from, 0, false)).toBe('2026-11-06');
    expect(calendarKeyTarget('ArrowLeft', false, from, 0, false)).toBe('2026-11-04');
    expect(calendarKeyTarget('ArrowDown', false, from, 0, false)).toBe('2026-11-12');
    expect(calendarKeyTarget('ArrowUp', false, from, 0, false)).toBe('2026-10-29');
  });
  it('swaps left and right in RTL', () => {
    expect(calendarKeyTarget('ArrowRight', false, from, 0, true)).toBe('2026-11-04');
    expect(calendarKeyTarget('ArrowLeft', false, from, 0, true)).toBe('2026-11-06');
  });
  it('Home and End use the week start', () => {
    expect(calendarKeyTarget('Home', false, from, 0, false)).toBe('2026-11-01');
    expect(calendarKeyTarget('End', false, from, 0, false)).toBe('2026-11-07');
    expect(calendarKeyTarget('Home', false, from, 1, false)).toBe('2026-11-02');
    expect(calendarKeyTarget('End', false, from, 1, false)).toBe('2026-11-08');
  });
  it('pages by month, and by year with shift', () => {
    expect(calendarKeyTarget('PageUp', false, from, 0, false)).toBe('2026-10-05');
    expect(calendarKeyTarget('PageDown', false, from, 0, false)).toBe('2026-12-05');
    expect(calendarKeyTarget('PageUp', true, from, 0, false)).toBe('2025-11-05');
    expect(calendarKeyTarget('PageDown', true, from, 0, false)).toBe('2027-11-05');
  });
  it('returns null for other keys', () => {
    expect(calendarKeyTarget('a', false, from, 0, false)).toBeNull();
    expect(calendarKeyTarget('Enter', false, from, 0, false)).toBeNull();
  });
});

describe('locale', () => {
  it('weekStartFor', () => {
    expect(weekStartFor('en-US')).toBe(0);
    expect(weekStartFor('de-DE')).toBe(1);
    expect(weekStartFor('en-GB')).toBe(1);
    expect(weekStartFor('ar-EG')).toBe(6);
    expect(weekStartFor('pt-BR')).toBe(0);
    expect(weekStartFor('xx-invalid!!')).toBe(0);
  });

  it('resolveLocale falls back to en-US', () => {
    expect(resolveLocale('not a locale')).toBe('en-US');
    expect(resolveLocale(undefined)).toBe('en-US');
    expect(resolveLocale(null)).toBe('en-US');
    expect(resolveLocale('de-de')).toBe('de-DE');
  });
});

describe('date field', () => {
  it('dateFieldParts keeps day, month, year and literals', () => {
    const types = dateFieldParts('en-US').map((p) => p.type);
    expect(types.filter((t) => t !== 'literal')).toEqual(['month', 'day', 'year']);
    expect(dateFieldParts('ja-JP').filter((p) => p.type !== 'literal').map((p) => p.type)).toEqual([
      'year',
      'month',
      'day',
    ]);
  });

  it('formatDateField', () => {
    expect(formatDateField('2026-11-05', 'en-US')).toBe('11/05/2026');
    expect(formatDateField('2026-11-05', 'de-DE')).toBe('05.11.2026');
    expect(formatDateField('bad', 'en-US')).toBe('');
  });

  it('datePlaceholder', () => {
    const tokens = { day: 'DD', month: 'MM', year: 'YYYY' };
    expect(datePlaceholder('en-US', tokens)).toBe('MM/DD/YYYY');
    expect(datePlaceholder('de-DE', tokens)).toBe('DD.MM.YYYY');
    expect(datePlaceholder('ja-JP', tokens)).toBe('YYYY/MM/DD');
  });

  it('parseDateField reads the locale order', () => {
    expect(parseDateField('11/05/2026', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('11-5-26', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('11 5 2026', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('11,05,2026', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('05.11.2026', 'de-DE')).toBe('2026-11-05');
    expect(parseDateField('2026/11/05', 'ja-JP')).toBe('2026-11-05');
    expect(parseDateField('11052026', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('05112026', 'de-DE')).toBe('2026-11-05');
    expect(parseDateField('  11/05/2026  ', 'en-US')).toBe('2026-11-05');
  });

  it('parseDateField accepts ISO in any locale', () => {
    expect(parseDateField('2026-11-05', 'en-US')).toBe('2026-11-05');
    expect(parseDateField('2026-11-05', 'de-DE')).toBe('2026-11-05');
    expect(parseDateField('2026-02-30', 'en-US')).toBeNull();
  });

  it('parseDateField rejects anything else', () => {
    for (const bad of ['13/01/2026', '02/30/2026', 'abc', '1/2', '11/05/2026x', '', '   ', '1/2/203', '1/2/20266', '1/2/0000']) {
      expect(parseDateField(bad, 'en-US'), bad).toBeNull();
    }
  });
});

describe('names', () => {
  it('monthTitle', () => {
    expect(monthTitle('2026-11', 'en-US')).toBe('November 2026');
    expect(monthTitle('bad', 'en-US')).toBe('');
  });

  it('monthNames lists 12 long names, January first', () => {
    const names = monthNames('en-US');
    expect(names).toHaveLength(12);
    expect(names[0]).toBe('January');
    expect(names[11]).toBe('December');
  });

  it('weekdayNames starts on the given day', () => {
    expect(weekdayNames('en-US', 1)[0]!.long).toBe('Monday');
    expect(weekdayNames('en-US', 0)[0]!.long).toBe('Sunday');
    expect(weekdayNames('en-US', 1)).toHaveLength(7);
    expect(weekdayNames('en-US', 0)[0]!.short).toBe('Sun');
  });

  it('weekdayNames picks short or narrow for the whole row', () => {
    expect(weekdayNames('fr-FR', 1)[0]!.short).toBe('lun.');
    expect(weekdayNames('ar-EG', 6).every((d) => [...d.short].length === 1)).toBe(true);
    const pl = weekdayNames('pl-PL', 1).map((d) => d.short);
    const lens = new Set(pl.map((n) => n.length === 1));
    expect(lens.size).toBe(1);
  });

  it('dayNumber and fullDate', () => {
    expect(dayNumber('2026-11-05', 'en-US')).toBe('5');
    expect(fullDate('2026-11-05', 'en-US')).toBe('Thursday, November 5, 2026');
    expect(fullDate('bad', 'en-US')).toBe('');
  });
});

describe('typed field round trips', () => {
  it.each(['th-TH', 'fa-IR', 'ar-EG', 'en-US', 'de-DE', 'ja-JP'])('formats then parses in %s', (locale) => {
    const text = formatDateField('2026-11-05', locale);
    expect(text).toMatch(/2026/);
    expect(parseDateField(text, locale)).toBe('2026-11-05');
  });

  it('keeps years under 100', () => {
    const text = formatDateField('0042-01-05', 'en-US');
    expect(text).toBe('01/05/0042');
    expect(parseDateField(text, 'en-US')).toBe('0042-01-05');
  });

  it('names Gregorian months in fa-IR and th-TH', () => {
    expect(monthTitle('2026-11', 'th-TH')).toMatch(/2026/);
    expect(monthTitle('2026-11', 'fa-IR')).toMatch(/2026|۲۰۲۶/);
    expect(monthNames('fa-IR')).toHaveLength(12);
  });
});

describe('range helpers', () => {
  const r = { from: '2026-11-05', to: '2026-11-09' };
  it('orderRange', () => {
    expect(orderRange('2026-11-05', '2026-11-09')).toEqual(r);
    expect(orderRange('2026-11-09', '2026-11-05')).toEqual(r);
    expect(orderRange('2026-11-05', '2026-11-05')).toEqual({ from: '2026-11-05', to: '2026-11-05' });
  });
  it('sameRange', () => {
    expect(sameRange(null, null)).toBe(true);
    expect(sameRange(r, null)).toBe(false);
    expect(sameRange(null, r)).toBe(false);
    expect(sameRange(r, { ...r })).toBe(true);
    expect(sameRange(r, { from: r.from, to: '2026-11-10' })).toBe(false);
    expect(sameRange(r, { from: '2026-11-04', to: r.to })).toBe(false);
  });
  it('toRange', () => {
    expect(toRange({ from: '2026-11-09', to: '2026-11-05' })).toEqual(r);
    expect(toRange({ from: '2026-11-31', to: '2026-12-01' })).toBeNull();
    expect(toRange({ from: '2026-11-05' })).toBeNull();
    expect(toRange({ from: 5, to: '2026-11-05' })).toBeNull();
    expect(toRange(null)).toBeNull();
    expect(toRange(undefined)).toBeNull();
    expect(toRange('x' as never)).toBeNull();
  });
  it('firstDisabledIn', () => {
    const off = new Set(['2026-11-07', '2026-11-08']);
    expect(firstDisabledIn('2026-11-05', '2026-11-09', (d) => off.has(d))).toBe('2026-11-07');
    expect(firstDisabledIn('2026-11-05', '2026-11-06', (d) => off.has(d))).toBeNull();
    expect(firstDisabledIn('2026-11-05', '2026-11-05', () => true)).toBe('2026-11-05');
    expect(firstDisabledIn('2026-11-09', '2026-11-05', () => true)).toBeNull();
    expect(firstDisabledIn('9999-12-30', '9999-12-31', () => false)).toBeNull();
    let calls = 0;
    expect(
      firstDisabledIn('2000-01-01', '2100-01-01', () => {
        calls++;
        return false;
      }),
    ).toBeNull();
    expect(calls).toBe(3660);
  });
  it('rangePlaceholder', () => {
    expect(rangePlaceholder('en-US', { day: 'DD', month: 'MM', year: 'YYYY' })).toBe('MM/DD/YYYY \u2013 MM/DD/YYYY');
  });
  it('formatRangeField uses an en dash with spaces', () => {
    expect(formatRangeField(r, 'en-US')).toBe('11/05/2026 \u2013 11/09/2026');
  });
  it('format and parse round trip', () => {
    for (const loc of ['en-US', 'de-DE', 'ja-JP', 'ar-EG']) {
      expect(parseRangeField(formatRangeField(r, loc), loc), loc).toEqual(r);
    }
  });
  it('parseRangeField en-US', () => {
    const one = { from: '2026-11-05', to: '2026-11-05' };
    expect(parseRangeField('', 'en-US')).toBeNull();
    expect(parseRangeField('   ', 'en-US')).toBeNull();
    expect(parseRangeField('11/05/2026', 'en-US')).toEqual(one);
    expect(parseRangeField('11/09/2026 - 11/05/2026', 'en-US')).toEqual(r);
    expect(parseRangeField('2026-11-05/2026-11-09', 'en-US')).toEqual(r);
    expect(parseRangeField('2026-11-05 \u2013 2026-11-09', 'en-US')).toEqual(r);
    expect(parseRangeField('11052026 11092026', 'en-US')).toEqual(r);
    expect(parseRangeField('11/05/26 11/9/26', 'en-US')).toEqual(r);
    expect(parseRangeField('11/05/2026 to 11/09/2026', 'en-US')).toBeNull();
    expect(parseRangeField('02/30/2026 \u2013 03/01/2026', 'en-US')).toBeNull();
    expect(parseRangeField('11/05 11/09', 'en-US')).toBeNull();
    expect(parseRangeField('11/05/2026 11/09', 'en-US')).toBeNull();
    expect(parseRangeField('1 2 3 4 5', 'en-US')).toBeNull();
  });
  it('parseRangeField de-DE', () => {
    expect(parseRangeField('05.11.2026 \u2013 09.11.2026', 'de-DE')).toEqual(r);
  });
});

describe('calendarDayClass', () => {
  // Expected strings are built from the class strings Calendar 2.1 renders (calendar.tsx), not from calendarDayClass.
  const base =
    'flex size-10 items-center justify-center rounded-lg text-sm tabular-nums text-th-hi2 transition-colors pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]';
  const expected = (isSelected: boolean, isToday: boolean, isDisabled: boolean) =>
    cn(
      base,
      !isSelected && !isDisabled && 'hover:bg-th-elevated hover:text-th-hi',
      isToday &&
        !isSelected &&
        'font-semibold text-th-accent ring-1 ring-inset ring-th-accent/50 forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-[CanvasText]',
      isSelected &&
        'bg-th-accent font-semibold text-th-on-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
      isDisabled && 'cursor-not-allowed text-th-ghost line-through forced-colors:text-[GrayText]',
    );
  it('matches the 2.1 class for plain, today, selected and disabled', () => {
    expect(calendarDayClass({ filled: false, today: false, disabled: false })).toBe(expected(false, false, false));
    expect(calendarDayClass({ filled: false, today: true, disabled: false })).toBe(expected(false, true, false));
    expect(calendarDayClass({ filled: true, today: false, disabled: false })).toBe(expected(true, false, false));
    expect(calendarDayClass({ filled: false, today: false, disabled: true })).toBe(expected(false, false, true));
  });
  it('draws band ends and middles', () => {
    const start = calendarDayClass({ filled: true, today: false, disabled: false, band: 'start' });
    expect(start).toContain('rounded-e-none');
    expect(start).toContain('bg-th-accent');
    expect(calendarDayClass({ filled: true, today: false, disabled: false, band: 'end' })).toContain('rounded-s-none');
    const mid = calendarDayClass({ filled: false, today: false, disabled: false, band: 'middle' });
    expect(mid).toContain('rounded-none');
    expect(mid).toContain('bg-th-accent-soft');
    expect(mid).not.toContain('hover:bg-th-elevated');
  });
  it('strengthens the today ring inside a band only', () => {
    const inBand = calendarDayClass({ filled: false, today: true, disabled: false, band: 'middle' });
    expect(inBand.split(' ')).toContain('ring-th-accent');
    expect(inBand).not.toContain('ring-th-accent/50');
    const plain = calendarDayClass({ filled: false, today: true, disabled: false });
    expect(plain).toContain('ring-th-accent/50');
    const filledEnd = calendarDayClass({ filled: true, today: true, disabled: false, band: 'start' });
    expect(filledEnd.split(' ')).not.toContain('ring-th-accent');
  });
  it('outlines filled band ends in forced colors, and nothing else', () => {
    const outline = 'forced-colors:outline-[CanvasText]';
    expect(calendarDayClass({ filled: true, today: false, disabled: false, band: 'start' })).toContain(outline);
    expect(calendarDayClass({ filled: true, today: false, disabled: false, band: 'end' })).toContain(
      'forced-colors:outline-2 forced-colors:-outline-offset-2',
    );
    expect(calendarDayClass({ filled: false, today: false, disabled: false, band: 'middle' })).not.toContain(outline);
    expect(calendarDayClass({ filled: true, today: false, disabled: false })).not.toContain('outline');
  });
});

describe('two-digit years', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('expandTwoDigitYear uses the CLDR window', () => {
    expect(expandTwoDigitYear(99, 2026)).toBe(1999);
    expect(expandTwoDigitYear(30, 2026)).toBe(2030);
    expect(expandTwoDigitYear(45, 2026)).toBe(2045);
    expect(expandTwoDigitYear(46, 2026)).toBe(1946);
    expect(expandTwoDigitYear(0, 2026)).toBe(2000);
    expect(expandTwoDigitYear(5, 2026)).toBe(2005);
  });

  it('parseDateField applies the window to the current year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    expect(parseDateField('12/31/99', 'en-US')).toBe('1999-12-31');
    expect(parseDateField('1/2/30', 'en-US')).toBe('2030-01-02');
  });
});

describe('msUntilNextMidnight', () => {
  it('counts down to the next local midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 5, 23, 59, 30))).toBe(30000);
    expect(msUntilNextMidnight(new Date(2026, 10, 5, 0, 0, 0))).toBe(24 * 3600 * 1000);
  });
  it('lands on local midnight on a DST day', () => {
    const now = new Date(2026, 2, 8, 12);
    const at = new Date(now.getTime() + msUntilNextMidnight(now));
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual([2026, 2, 9, 0, 0]);
  });
});

describe('today ring in forced colors', () => {
  it('adds a forced-colors outline to the today cell', () => {
    expect(calendarDayClass({ filled: false, today: true, disabled: false })).toContain('forced-colors:outline');
  });
});
