// Pure date helpers for Calendar and DatePicker: ISO YYYY-MM-DD days, Intl names and the typed-date parser. No React.

import { cn } from '../cn';

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number;
}
export interface DateFieldPart {
  type: 'day' | 'month' | 'year' | 'literal';
  value: string;
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

function pad(n: number, width: number): string {
  let s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

/** A Date at 00:00 UTC. Not Date.UTC, which maps years 0-99 to 1900-1999. */
function utcDate(y: number, m: number, d: number): Date {
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  return t;
}

function fromDate(t: Date): Ymd {
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function daysInMonth(y: number, m: number): number {
  // Day 0 of the next month is the last day of this one.
  return utcDate(y, m + 1, 0).getUTCDate();
}

/** Parses YYYY-MM-DD (year 1-9999, a real day), else null. */
export function parseIso(s: string | null | undefined): Ymd | null {
  if (typeof s !== 'string') return null;
  const match = ISO_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function toIso(p: Ymd): string {
  return `${pad(p.y, 4)}-${pad(p.m, 2)}-${pad(p.d, 2)}`;
}

export function parseMonth(s: string | null | undefined): { y: number; m: number } | null {
  if (typeof s !== 'string') return null;
  const match = MONTH_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (y < 1 || m < 1 || m > 12) return null;
  return { y, m };
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function firstOfMonth(month: string): string {
  return `${month}-01`;
}

function dateOf(iso: string): Date {
  const p = parseIso(iso);
  return p ? utcDate(p.y, p.m, p.d) : new Date(NaN);
}

export function addDays(iso: string, n: number): string {
  const p = parseIso(iso);
  if (!p) return iso;
  const t = utcDate(p.y, p.m, p.d);
  t.setUTCDate(t.getUTCDate() + n);
  const q = fromDate(t);
  // Saturate: a 5-digit year would sort below 9999 as a string and blank the grid.
  if (q.y > 9999) return '9999-12-31';
  if (q.y < 1) return '0001-01-01';
  return toIso(q);
}

function addMonthsYmd(p: Ymd, n: number): Ymd {
  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  if (y > 9999) return { y: 9999, m: 12, d: p.d };
  if (y < 1) return { y: 1, m: 1, d: p.d };
  return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
}

/** The day is clamped to the target month: 2026-01-31 + 1 is 2026-02-28. */
export function addMonths(iso: string, n: number): string {
  const p = parseIso(iso);
  return p ? toIso(addMonthsYmd(p, n)) : iso;
}

/** 2024-02-29 + 1 is 2025-02-28. */
export function addYears(iso: string, n: number): string {
  return addMonths(iso, n * 12);
}

export function shiftMonth(month: string, n: number): string {
  const p = parseMonth(month);
  if (!p) return month;
  const q = addMonthsYmd({ y: p.y, m: p.m, d: 1 }, n);
  return `${pad(q.y, 4)}-${pad(q.m, 2)}`;
}

export function weekday(iso: string): WeekDay {
  return dateOf(iso).getUTCDay() as WeekDay;
}

export function startOfWeek(iso: string, weekStartsOn: WeekDay): string {
  return addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));
}

export function endOfWeek(iso: string, weekStartsOn: WeekDay): string {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}

export function clampIso(iso: string, min?: string | null, max?: string | null): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export function inRange(iso: string, min?: string | null, max?: string | null): boolean {
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}

/** Always 6 rows x 7 columns; null is an empty cell (a day outside the month). */
export function monthGrid(month: string, weekStartsOn: WeekDay): (string | null)[][] {
  const p = parseMonth(month);
  const rows: (string | null)[][] = [];
  const count = p ? daysInMonth(p.y, p.m) : 0;
  const lead = p ? (weekday(firstOfMonth(month)) - weekStartsOn + 7) % 7 : 0;
  let day = 1 - lead;
  for (let r = 0; r < 6; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(p && day >= 1 && day <= count ? `${month}-${pad(day, 2)}` : null);
      day++;
    }
    rows.push(row);
  }
  return rows;
}

/** The day an APG date-grid key moves to, or null for any other key. */
export function calendarKeyTarget(
  key: string,
  shiftKey: boolean,
  from: string,
  weekStartsOn: WeekDay,
  rtl: boolean,
): string | null {
  switch (key) {
    case 'ArrowRight':
      return addDays(from, rtl ? -1 : 1);
    case 'ArrowLeft':
      return addDays(from, rtl ? 1 : -1);
    case 'ArrowDown':
      return addDays(from, 7);
    case 'ArrowUp':
      return addDays(from, -7);
    case 'Home':
      return startOfWeek(from, weekStartsOn);
    case 'End':
      return endOfWeek(from, weekStartsOn);
    case 'PageUp':
      return shiftKey ? addYears(from, -1) : addMonths(from, -1);
    case 'PageDown':
      return shiftKey ? addYears(from, 1) : addMonths(from, 1);
    default:
      return null;
  }
}

/** The viewer's local calendar day. */
export function isoToday(now: Date = new Date()): string {
  return toIso({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

const resolved = new Map<string, string>();

/** Milliseconds from now to the next local midnight (DST-safe: built from local calendar fields). */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function resolveLocale(locale?: string | null): string {
  if (!locale) return 'en-US';
  const hit = resolved.get(locale);
  if (hit) return hit;
  let out = 'en-US';
  try {
    out = Intl.getCanonicalLocales(locale)[0] ?? 'en-US';
  } catch {
    out = 'en-US';
  }
  resolved.set(locale, out);
  return out;
}

const SUNDAY_FIRST = new Set(
  'AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
    ' ',
  ),
);
const SATURDAY_FIRST = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

/** First day of the week from a small CLDR region table (Intl.Locale#getWeekInfo is missing in Firefox). */
const weekStarts = new Map<string, WeekDay>();

export function weekStartFor(locale: string): WeekDay {
  const hit = weekStarts.get(locale);
  if (hit !== undefined) return hit;
  const v = computeWeekStart(locale);
  weekStarts.set(locale, v);
  return v;
}

function computeWeekStart(locale: string): WeekDay {
  let region = 'US';
  try {
    region = new Intl.Locale(resolveLocale(locale)).maximize().region ?? 'US';
  } catch {
    region = 'US';
  }
  if (SUNDAY_FIRST.has(region)) return 0;
  if (SATURDAY_FIRST.has(region)) return 6;
  return 1;
}

// Formatters are made on first use, never at import.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  // The grid is Gregorian, so names and titles must be too (th-TH and fa-IR default to other calendars).
  const opts: Intl.DateTimeFormatOptions = { ...options, timeZone: 'UTC', calendar: 'gregory' };
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    formatters.set(key, f);
  }
  return f;
}

// Direction marks (U+200E, U+200F, U+061C) that some locales put around the separators.
const BIDI_MARKS_RE = /[‎‏؜]/g;

const fieldParts = new Map<string, DateFieldPart[]>();

/** The locale's numeric date field order and separators, e.g. day . month . year for de-DE. */
export function dateFieldParts(locale: string): DateFieldPart[] {
  const cached = fieldParts.get(locale);
  if (cached) return cached;
  const parts = formatter(locale, { year: 'numeric', month: '2-digit', day: '2-digit', numberingSystem: 'latn' })
    .formatToParts(utcDate(2026, 12, 31))
    .map((p): DateFieldPart => {
      if (p.type === 'day' || p.type === 'month' || p.type === 'year') return { type: p.type, value: p.value };
      return { type: 'literal', value: p.value.replace(BIDI_MARKS_RE, '') };
    });
  fieldParts.set(locale, parts);
  return parts;
}

export function formatDateField(iso: string, locale: string): string {
  const p = parseIso(iso);
  if (!p) return '';
  // Padded Latin digits in the locale's order, so the text parses back to the same day (years under 100 included).
  return dateFieldParts(locale)
    .map((part) => {
      if (part.type === 'year') return String(p.y).padStart(4, '0');
      if (part.type === 'month') return String(p.m).padStart(2, '0');
      if (part.type === 'day') return String(p.d).padStart(2, '0');
      return part.value;
    })
    .join('');
}

const FIELD_JUNK_RE = /[^\d\s/.,-]/;
const ISO_FIELD_RE = /^\d{4}-\d{2}-\d{2}$/;
const DIGITS_RE = /\d+/g;

/** A 1- or 2-digit year as the CLDR rule reads it: the year in the window from 80 years before `thisYear` to 19 after it that ends in those digits. With thisYear 2026: 99 -> 1999, 30 -> 2030, 45 -> 2045, 46 -> 1946. */
export function expandTwoDigitYear(yy: number, thisYear: number = new Date().getFullYear()): number {
  let y = Math.floor(thisYear / 100) * 100 + yy;
  if (y > thisYear + 19) y -= 100;
  else if (y < thisYear - 80) y += 100;
  return y;
}

/** Parses typed text: ISO, or the locale's numeric order with / . - , or space; null when it is not a real day. */
export function parseDateField(text: string, locale: string): string | null {
  const t = text.replace(BIDI_MARKS_RE, '').trim();
  if (t === '') return null;
  if (FIELD_JUNK_RE.test(t)) return null;
  if (ISO_FIELD_RE.test(t)) {
    const p = parseIso(t);
    return p ? toIso(p) : null;
  }
  const order = dateFieldParts(locale)
    .map((p) => p.type)
    .filter((type): type is 'day' | 'month' | 'year' => type !== 'literal');
  const groups = t.match(DIGITS_RE);
  if (!groups) return null;
  let raw: string[];
  if (groups.length === 3) {
    raw = groups;
  } else if (groups.length === 1 && groups[0]!.length === 8) {
    const digits = groups[0]!;
    raw = [];
    let at = 0;
    for (const type of order) {
      const width = type === 'year' ? 4 : 2;
      raw.push(digits.slice(at, at + width));
      at += width;
    }
  } else {
    return null;
  }
  if (order.length !== 3) return null;
  const found: Record<'day' | 'month' | 'year', string> = { day: '', month: '', year: '' };
  order.forEach((type, i) => {
    found[type] = raw[i]!;
  });
  let y = Number(found.year);
  if (found.year.length === 3 || found.year.length > 4) return null;
  if (found.year.length <= 2) y = expandTwoDigitYear(y);
  const m = Number(found.month);
  const d = Number(found.day);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return toIso({ y, m, d });
}

/** 'MM/DD/YYYY' for en-US, 'DD.MM.YYYY' for de-DE, 'YYYY/MM/DD' for ja-JP. */
export function datePlaceholder(locale: string, tokens: { day: string; month: string; year: string }): string {
  return dateFieldParts(locale)
    .map((p) => (p.type === 'literal' ? p.value : tokens[p.type]))
    .join('');
}

export function monthTitle(month: string, locale: string): string {
  const p = parseMonth(month);
  if (!p) return '';
  return formatter(locale, { month: 'long', year: 'numeric' }).format(utcDate(p.y, p.m, 1));
}

/** 12 long names, January first. */
export function monthNames(locale: string): string[] {
  const f = formatter(locale, { month: 'long' });
  const names: string[] = [];
  for (let m = 1; m <= 12; m++) names.push(f.format(utcDate(2026, m, 1)));
  return names;
}

export function weekdayNames(locale: string, weekStartsOn: WeekDay): { short: string; long: string }[] {
  const short = formatter(locale, { weekday: 'short' });
  const long = formatter(locale, { weekday: 'long' });
  const narrow = formatter(locale, { weekday: 'narrow' });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(utcDate(2026, 11, 1 + ((weekStartsOn + i) % 7))); // 2026-11-01 is a Sunday.
  const shorts = days.map((t) => short.format(t));
  // Decide once for the whole row. Some locales (ar, fa, th, he, vi) have names too wide for a 44px column.
  const useNarrow = shorts.some((n) => n.length > 4);
  return days.map((t, i) => ({
    short: useNarrow ? narrow.format(t) : shorts[i]!,
    long: long.format(t),
  }));
}

export function dayNumber(iso: string, locale: string): string {
  const p = parseIso(iso);
  return p ? formatter(locale, { day: 'numeric' }).format(utcDate(p.y, p.m, p.d)) : '';
}

export function fullDate(iso: string, locale: string): string {
  const p = parseIso(iso);
  if (!p) return '';
  return formatter(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(
    utcDate(p.y, p.m, p.d),
  );
}

/** A span of days, both ends included, as YYYY-MM-DD. from is never after to. */
export interface DateRange {
  /** The first day. */
  from: string;
  /** The last day, included; equal to from for a one-day range. */
  to: string;
}

/** The two days in order: from is the earlier one. */
export function orderRange(a: string, b: string): DateRange {
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

/** True when both are null, or both have the same from and to. */
export function sameRange(a: DateRange | null, b: DateRange | null): boolean {
  return a === b || (!!a && !!b && a.from === b.from && a.to === b.to);
}

/** A range from loose input (a prop): both ends real YYYY-MM-DD days, put in order. Anything else is null. */
export function toRange(v: { from?: unknown; to?: unknown } | null | undefined): DateRange | null {
  if (!v || typeof v !== 'object') return null;
  const { from, to } = v;
  if (typeof from !== 'string' || typeof to !== 'string' || !parseIso(from) || !parseIso(to)) return null;
  return orderRange(from, to);
}

/** The first day from `from` to `to` (both included) that isDisabled returns true for, or null.
 *  Looks at most 3,660 days. */
export function firstDisabledIn(from: string, to: string, isDisabled: (iso: string) => boolean): string | null {
  let d = from;
  for (let n = 0; n < 3660 && d <= to; n++) {
    if (isDisabled(d)) return d;
    const next = addDays(d, 1);
    if (next === d) break; // 9999-12-31 saturates
    d = next;
  }
  return null;
}

/** "11/05/2026 – 11/09/2026" in the locale's numeric order (an en dash with a space each side). */
export function formatRangeField(range: DateRange, locale: string): string {
  return `${formatDateField(range.from, locale)} – ${formatDateField(range.to, locale)}`;
}

/** The locale's date pattern twice: "MM/DD/YYYY – MM/DD/YYYY". */
export function rangePlaceholder(locale: string, tokens: { day: string; month: string; year: string }): string {
  const one = datePlaceholder(locale, tokens);
  return `${one} – ${one}`;
}

const RANGE_JUNK_RE = /[^\d\s/.,\-–—]/;
const DIGIT_RUN_RE = /\d+/g;

/** Parses typed range text: two dates in the locale's numeric order or ISO, with any separator
 *  between them; one date is a one-day range. Ordered; null when it is not two real days. */
export function parseRangeField(text: string, locale: string): DateRange | null {
  const t = text.replace(BIDI_MARKS_RE, '').trim();
  if (t === '' || RANGE_JUNK_RE.test(t)) return null;
  const runs = [...t.matchAll(DIGIT_RUN_RE)];
  let a: string;
  let b: string;
  if (runs.length === 6) {
    a = t.slice(0, runs[2]!.index! + runs[2]![0].length);
    b = t.slice(runs[3]!.index!);
  } else if (runs.length === 2 && runs[0]![0].length === 8 && runs[1]![0].length === 8) {
    a = runs[0]![0];
    b = runs[1]![0];
  } else if (runs.length === 3 || (runs.length === 1 && runs[0]![0].length === 8)) {
    a = t;
    b = t;
  } else {
    return null;
  }
  const from = parseDateField(a, locale);
  const to = parseDateField(b, locale);
  return from && to ? orderRange(from, to) : null;
}

/** Where a day sits in a band of more than one day. */
export type DayBand = 'start' | 'middle' | 'end' | null;

export interface DayLook {
  /** Accent fill: Calendar's picked day, a range end, the first pick of a range. */
  filled: boolean;
  today: boolean;
  disabled: boolean;
  band?: DayBand;
}

const DAY_BASE =
  'flex size-10 items-center justify-center rounded-lg text-sm tabular-nums text-th-hi2 transition-colors pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]';

/** Classes of one day button. With band null this is exactly Calendar's 2.1 day class. */
export function calendarDayClass({ filled, today, disabled, band = null }: DayLook): string {
  return cn(
    DAY_BASE,
    !filled && !band && !disabled && 'hover:bg-th-elevated hover:text-th-hi',
    today && !filled && 'font-semibold text-th-accent ring-1 ring-inset ring-th-accent/50 forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-[CanvasText]',
    band && today && !filled && 'ring-th-accent',
    band === 'start' && 'rounded-e-none',
    band === 'end' && 'rounded-s-none',
    band === 'middle' && 'rounded-none',
    band &&
      !filled &&
      'bg-th-accent-soft font-medium text-th-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
    filled &&
      'bg-th-accent font-semibold text-th-on-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
    filled &&
      band &&
      'forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[CanvasText]',
    disabled && 'cursor-not-allowed text-th-ghost line-through forced-colors:text-[GrayText]',
  );
}
