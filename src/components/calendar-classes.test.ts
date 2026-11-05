import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  calendarKeyTarget,
  clampIso,
  dateFieldParts,
  datePlaceholder,
  dayNumber,
  daysInMonth,
  endOfWeek,
  firstOfMonth,
  formatDateField,
  fullDate,
  inRange,
  isoToday,
  monthGrid,
  monthNames,
  monthOf,
  monthTitle,
  parseDateField,
  parseIso,
  parseMonth,
  resolveLocale,
  shiftMonth,
  startOfWeek,
  toIso,
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
