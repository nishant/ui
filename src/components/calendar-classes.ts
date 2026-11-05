// Pure date helpers for Calendar and DatePicker: ISO YYYY-MM-DD days, Intl names and the typed-date parser. No React.

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
  return toIso(fromDate(t));
}

function addMonthsYmd(p: Ymd, n: number): Ymd {
  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
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
  if (found.year.length <= 2) y = 2000 + y;
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
  const out: { short: string; long: string }[] = [];
  for (let i = 0; i < 7; i++) {
    // 2026-11-01 is a Sunday.
    const t = utcDate(2026, 11, 1 + ((weekStartsOn + i) % 7));
    // Some locales (ar) have no abbreviation and "short" is the full name, too wide for a 44px column.
    const sh = short.format(t);
    out.push({ short: sh.length > 3 ? narrow.format(t) : sh, long: long.format(t) });
  }
  return out;
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
