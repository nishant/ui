// @nish/ui/format: number, money, percent, duration and date formatting with no React,
// so static pages and servers can import it. Output is en-US unless a `locale` option or
// setDefaultLocale() says otherwise, and every function returns an en dash for null,
// undefined, NaN or an invalid date. Every Intl formatter is built once per
// (locale, options) and reused.

import { shared } from './runtime';

const DASH = '–';
const MINUS = '−';
const FALLBACK_LOCALE = 'en-US';

interface FormatState {
  locale: string;
}

const state: FormatState = /* @__PURE__ */ shared<FormatState>('format', () => ({ locale: FALLBACK_LOCALE }));

const validLocales = new Map<string, string>();

/** A locale tag Intl accepts, or en-US when it does not. */
function safeLocale(locale: string): string {
  let ok = validLocales.get(locale);
  if (ok === undefined) {
    try {
      ok = Intl.getCanonicalLocales(locale)[0] ?? FALLBACK_LOCALE;
    } catch {
      ok = FALLBACK_LOCALE;
    }
    validLocales.set(locale, ok);
  }
  return ok;
}

/** Sets the locale every formatter uses when it is not given one. Default 'en-US'. */
export function setDefaultLocale(locale: string): void {
  state.locale = safeLocale(locale);
}

/** The locale formatters use when not given one. */
export function getDefaultLocale(): string {
  return state.locale;
}

/** Options every formatter accepts. */
export interface LocaleOptions {
  /** BCP 47 tag, e.g. 'de-DE'. Default getDefaultLocale() ('en-US'). */
  locale?: string;
}

/** Options for the date formatters. */
export interface DateOptions extends LocaleOptions {
  /** IANA zone such as 'UTC'. Default the viewer's zone. A bare YYYY-MM-DD string is a calendar day and ignores it. */
  timeZone?: string;
}

function loc(o: LocaleOptions | undefined): string {
  return o?.locale ? safeLocale(o.locale) : state.locale;
}

function isEnglish(locale: string): boolean {
  return locale === 'en' || locale.startsWith('en-');
}

/** en and en-US keep the 12-hour clock and m/d weekday form; other locales use their own. */
function isUs(locale: string): boolean {
  return locale === 'en' || locale === 'en-US';
}

const formatters = new Map<string, unknown>();

function cached<T>(key: string, make: () => T): T {
  let f = formatters.get(key) as T | undefined;
  if (f === undefined) {
    f = make();
    formatters.set(key, f);
  }
  return f;
}

function nf(locale: string, min: number, max: number): Intl.NumberFormat {
  return cached(
    `n|${locale}|${min}|${max}`,
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max }),
  );
}

const zoneOk = new Map<string, boolean>();

/** The zone when Intl accepts it, else undefined (the viewer's zone). Checked once per zone. */
function safeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined;
  let ok = zoneOk.get(timeZone);
  if (ok === undefined) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone });
      ok = true;
    } catch {
      ok = false;
    }
    if (zoneOk.size >= 64) zoneOk.clear();
    zoneOk.set(timeZone, ok);
  }
  return ok ? timeZone : undefined;
}

function dtf(locale: string, key: string, options: Intl.DateTimeFormatOptions, zone?: string): Intl.DateTimeFormat {
  const timeZone = safeZone(zone);
  return cached(
    `d|${locale}|${key}|${timeZone ?? ''}`,
    () => new Intl.DateTimeFormat(locale, timeZone ? { ...options, timeZone } : options),
  );
}

function finite(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function fixed(abs: number, min: number, max: number, locale: string): string {
  return nf(locale, min, max).format(abs);
}

const COMPACT_UNITS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'k'],
];

/** Compact magnitude text for a non-negative number: 12345 → "12.3k". */
function compactAbs(abs: number, digits: number, locale: string): string {
  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const [size, suffix] = COMPACT_UNITS[i];
    if (abs < size) continue;
    // 999,950 rounds up to 1000k; show it as 1M instead.
    if (i > 0 && Number((abs / size).toFixed(digits)) >= 1000) {
      const [bigger, bigSuffix] = COMPACT_UNITS[i - 1];
      return fixed(abs / bigger, 0, digits, locale) + bigSuffix;
    }
    return fixed(abs / size, 0, digits, locale) + suffix;
  }
  return fixed(abs, 0, digits, locale);
}

function isZeroAfterRounding(v: number, digits: number): boolean {
  return Number(Math.abs(v).toFixed(digits)) === 0;
}

export interface MoneyOptions extends LocaleOptions {
  /** 'auto' (default) shows cents when |v| < 1000 or v has cents; 'always'; 'never'. */
  cents?: 'auto' | 'always' | 'never';
  /** Short form: $12.3k, $4.5M. */
  compact?: boolean;
  /** ISO 4217 code. Default USD. */
  currency?: string;
}

interface CurrencyInfo {
  symbol: string;
  digits: number;
}

const currencies = new Map<string, CurrencyInfo>();

function currencyInfo(currency: string, locale: string): CurrencyInfo {
  const key = `${locale}|${currency}`;
  let info = currencies.get(key);
  if (info === undefined) {
    try {
      const nf = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      });
      let s = nf.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
      // A code or letters ("CHF", "kr") needs a gap before the number; a sign ("$") does not.
      if (/\p{L}$/u.test(s)) s += '\u00a0';
      info = { symbol: s, digits: nf.resolvedOptions().maximumFractionDigits ?? 2 };
    } catch {
      info = { symbol: currency + ' ', digits: 2 };
    }
    currencies.set(key, info);
  }
  return info;
}

function moneyAbs(abs: number, o: MoneyOptions, locale: string): string {
  const { symbol, digits } = currencyInfo(o.currency ?? 'USD', locale);
  if (o.compact && abs >= 1000) return symbol + compactAbs(abs, 1, locale);
  const cents = o.cents ?? 'auto';
  const unit = 10 ** digits;
  const hasCents = Math.round(abs * unit) % unit !== 0;
  const showCents = digits > 0 && (cents === 'always' || (cents === 'auto' && (abs < 1000 || hasCents)));
  return symbol + (showCents ? fixed(abs, digits, digits, locale) : fixed(abs, 0, 0, locale));
}

/** Money: 1234.56 → "$1,234.56"; negatives use a true minus sign. The symbol always comes first. */
export function money(v: number | null | undefined, o: MoneyOptions = {}): string {
  if (!finite(v)) return DASH;
  const text = moneyAbs(Math.abs(v), o, loc(o));
  return v < 0 && Math.round(Math.abs(v) * 100) > 0 ? MINUS + text : text;
}

/** Signed money: "+$12.30", "−$4.00", and "No change" when |v| < 0.005. Pass `zero` for another language. */
export function signedMoney(v: number | null | undefined, o: MoneyOptions & { zero?: string } = {}): string {
  if (!finite(v)) return DASH;
  if (Math.abs(v) < 0.005) return o.zero ?? 'No change';
  return (v < 0 ? MINUS : '+') + moneyAbs(Math.abs(v), o, loc(o));
}

export interface PctOptions extends LocaleOptions {
  /** Fraction digits. Default 1. */
  digits?: number;
  /** True (default): the value is a ratio, 0.123 → "12.3%". False: it is already a percent. */
  fromRatio?: boolean;
  /** Always show + or −. */
  signed?: boolean;
}

/** Percent: 0.123 → "12.3%". */
export function pct(v: number | null | undefined, o: PctOptions = {}): string {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 1;
  const value = (o.fromRatio ?? true) ? v * 100 : v;
  const text = fixed(Math.abs(value), digits, digits, loc(o)) + '%';
  if (isZeroAfterRounding(value, digits)) return text;
  if (value < 0) return MINUS + text;
  return o.signed ? '+' + text : text;
}

export interface NumOptions extends LocaleOptions {
  /** Fixed fraction digits. Default: up to 2, trailing zeros trimmed (1 when compact). With `compact`, digits is a maximum: 12000 gives "12k", not "12.00k". */
  digits?: number;
  /** Short form: 12.3k, 4.5M. */
  compact?: boolean;
}

/** A plain number with thousands separators: 1234.5 → "1,234.5". */
export function num(v: number | null | undefined, o: NumOptions = {}): string {
  if (!finite(v)) return DASH;
  const locale = loc(o);
  const sign = v < 0 && !isZeroAfterRounding(v, o.digits ?? 2) ? MINUS : '';
  const abs = Math.abs(v);
  if (o.compact && abs >= 1000) return sign + compactAbs(abs, o.digits ?? 1, locale);
  return sign + (o.digits === undefined ? fixed(abs, 0, 2, locale) : fixed(abs, o.digits, o.digits, locale));
}

/** A number with an explicit sign: "+1.20", "−0.40". Digits default 2. */
export function signed(v: number | null | undefined, o: LocaleOptions & { digits?: number } = {}): string {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 2;
  const text = fixed(Math.abs(v), digits, digits, loc(o));
  if (isZeroAfterRounding(v, digits)) return text;
  return (v < 0 ? MINUS : '+') + text;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** File sizes in 1024 steps: 1258291 → "1.2 MB". */
export function bytes(v: number | null | undefined, o: LocaleOptions = {}): string {
  if (!finite(v)) return DASH;
  const locale = loc(o);
  let abs = Math.abs(v);
  let i = 0;
  while (abs >= 1024 && i < BYTE_UNITS.length - 1) {
    abs /= 1024;
    i++;
  }
  const text = i === 0 || abs >= 100 ? fixed(abs, 0, 0, locale) : fixed(abs, 0, 1, locale);
  const zero = Number(text.replace(/[^0-9]/g, '')) === 0;
  return (v < 0 && !zero ? MINUS : '') + text + ' ' + BYTE_UNITS[i];
}

const DURATION_PARTS: [number, string, string][] = [
  [86400, 'd', 'day'],
  [3600, 'h', 'hour'],
  [60, 'm', 'minute'],
  [1, 's', 'second'],
];

function unitFormat(locale: string, unit: string, long: boolean): Intl.NumberFormat {
  return cached(
    `u|${locale}|${unit}|${long}`,
    () => new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: long ? 'long' : 'narrow' }),
  );
}

/** A length of time from seconds, two largest units: 24000 → "6h 40m" (long: "6 hours 40 minutes"). */
export function duration(
  seconds: number | null | undefined,
  o: LocaleOptions & { style?: 'short' | 'long' } = {},
): string {
  if (!finite(seconds)) return DASH;
  const locale = loc(o);
  const english = isEnglish(locale);
  const long = o.style === 'long';
  let rest = Math.round(Math.abs(seconds));
  const sign = seconds < 0 && rest > 0 ? MINUS : '';
  const out: string[] = [];
  for (const [size, short, name] of DURATION_PARTS) {
    const n = Math.floor(rest / size);
    rest -= n * size;
    if (n > 0 && out.length < 2) {
      if (english) out.push(long ? `${n} ${name}${n === 1 ? '' : 's'}` : `${n}${short}`);
      else out.push(unitFormat(locale, name, long).format(n));
    }
  }
  if (!out.length) {
    if (english) return long ? '0 seconds' : '0s';
    return unitFormat(locale, 'second', long).format(0);
  }
  return sign + out.join(' ');
}

type DateInput = Date | number | string;

interface Moment {
  d: Date;
  /** A bare YYYY-MM-DD string: a calendar day, so no time zone applies. */
  dayOnly: boolean;
}

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Dates are local time; a bare YYYY-MM-DD is a calendar day, not UTC midnight. */
function toMoment(t: DateInput | null | undefined): Moment | null {
  if (t === null || t === undefined) return null;
  let d: Date;
  let dayOnly = false;
  if (t instanceof Date) d = t;
  else if (typeof t === 'number') d = new Date(t);
  else {
    const m = DAY_ONLY.exec(t.trim());
    dayOnly = !!m;
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  }
  return Number.isNaN(d.getTime()) ? null : { d, dayOnly };
}

function zone(m: Moment, o: DateOptions): string | undefined {
  return m.dayOnly ? undefined : o.timeZone;
}

/** Newer ICU builds put a narrow no-break space before AM/PM; use a plain space. */
function norm(s: string): string {
  return s.replace(/[\u202f\u00a0]/g, ' ');
}

export interface AgoOptions extends LocaleOptions {
  now?: number;
  style?: 'short' | 'long';
}

const AGO_UNITS: [number, Intl.RelativeTimeFormatUnit, string][] = [
  [60, 'minute', 'm'],
  [3600, 'hour', 'h'],
  [86400, 'day', 'd'],
  [86400 * 30, 'month', 'mo'],
  [86400 * 365, 'year', 'y'],
];

function rtf(locale: string, style: 'long' | 'narrow'): Intl.RelativeTimeFormat {
  return cached(`r|${locale}|${style}`, () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style }));
}

/** How long ago (or from now): "just now", "3m ago", "in 2h". Long style: "3 minutes ago". Other languages use Intl.RelativeTimeFormat. */
export function ago(t: DateInput | null | undefined, o: AgoOptions = {}): string {
  const m = toMoment(t);
  if (!m) return DASH;
  const locale = loc(o);
  const english = isEnglish(locale);
  const long = o.style === 'long';
  const diff = Math.round((m.d.getTime() - (o.now ?? Date.now())) / 1000);
  const abs = Math.abs(diff);
  if (abs < 45) return english ? 'just now' : rtf(locale, long ? 'long' : 'narrow').format(0, 'second');
  // The largest unit that fits at least once.
  let pick = AGO_UNITS[0];
  for (const u of AGO_UNITS) if (abs >= u[0]) pick = u;
  let n = Math.max(1, Math.round(abs / pick[0]));
  const next = AGO_UNITS[AGO_UNITS.indexOf(pick) + 1];
  // 12 months of 30 days is 360 days, short of the 365-day year, so count it as the year too.
  if (next && (n * pick[0] >= next[0] || (pick[1] === 'month' && n >= 12))) {
    pick = next;
    n = Math.max(1, Math.round(abs / pick[0]));
  }
  const past = diff < 0;
  if (!english) return rtf(locale, long ? 'long' : 'narrow').format(past ? -n : n, pick[1]);
  if (long) return rtf(locale, 'long').format(past ? -n : n, pick[1]);
  return past ? `${n}${pick[2]} ago` : `in ${n}${pick[2]}`;
}

const MEDIUM: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
const LONG: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
const SHORT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const WEEKDAY: Intl.DateTimeFormatOptions = { weekday: 'short' };
const NUMERIC_MD: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric' };
const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const TIME_12: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
const YMD: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };

/** Year, month and day of an instant in a zone (or the viewer's zone when none). */
function ymd(d: Date, timeZone?: string): { year: number; month: number; day: number } {
  if (!timeZone) return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  const out = { year: 0, month: 0, day: 0 };
  for (const p of dtf('en-US', 'ymd', YMD, timeZone).formatToParts(d)) {
    if (p.type === 'year' || p.type === 'month' || p.type === 'day') out[p.type] = Number(p.value);
  }
  return out;
}

type DateStyle = 'short' | 'medium' | 'long' | 'weekday';

function dateOf(m: Moment, style: DateStyle, o: DateOptions, locale: string): string {
  const tz = zone(m, o);
  switch (style) {
    case 'medium':
      return norm(dtf(locale, 'medium', MEDIUM, tz).format(m.d));
    case 'long':
      return norm(dtf(locale, 'long', LONG, tz).format(m.d));
    case 'weekday': {
      const wd = dtf(locale, 'weekday', WEEKDAY, tz).format(m.d);
      if (!isUs(locale)) return `${wd} ${dtf(locale, 'md', NUMERIC_MD, tz).format(m.d)}`;
      const p = ymd(m.d, tz);
      return `${wd} ${p.month}/${p.day}`;
    }
    default:
      return norm(dtf(locale, 'short', SHORT, tz).format(m.d));
  }
}

/** A calendar date: 'short' "Oct 28", 'medium' "Oct 28, 2026", 'long' "Wednesday, October 28, 2026", 'weekday' "Wed 10/28". */
export function date(t: DateInput | null | undefined, style: DateStyle = 'short', o: DateOptions = {}): string {
  const m = toMoment(t);
  if (!m) return DASH;
  return dateOf(m, style, o, loc(o));
}

function timeOf(m: Moment, o: DateOptions, locale: string): string {
  const us = isUs(locale);
  return norm(dtf(locale, us ? 'time12' : 'time', us ? TIME_12 : TIME, zone(m, o)).format(m.d));
}

/** Time of day: "7:42 AM". Pass timeZone for a zone other than the viewer's. */
export function time(t: DateInput | null | undefined, o: DateOptions = {}): string {
  const m = toMoment(t);
  if (!m) return DASH;
  return timeOf(m, o, loc(o));
}

/** Date and time: "Oct 28, 7:42 AM". */
export function dateTime(t: DateInput | null | undefined, o: DateOptions = {}): string {
  const m = toMoment(t);
  if (!m) return DASH;
  const locale = loc(o);
  return `${dateOf(m, 'short', o, locale)}, ${timeOf(m, o, locale)}`;
}

/** A span of days: "Dec 12 – 16", "Dec 30 – Jan 2", "Dec 30, 2026 – Jan 2, 2027". */
export function dateRange(
  a: DateInput | null | undefined,
  b: DateInput | null | undefined,
  o: DateOptions = {},
): string {
  const from = toMoment(a);
  const to = toMoment(b);
  if (!from || !to) return DASH;
  const locale = loc(o);
  const f = ymd(from.d, zone(from, o));
  const t = ymd(to.d, zone(to, o));
  if (f.year !== t.year) return `${dateOf(from, 'medium', o, locale)} – ${dateOf(to, 'medium', o, locale)}`;
  if (f.month === t.month) {
    if (f.day === t.day) return dateOf(from, 'short', o, locale);
    return `${dateOf(from, 'short', o, locale)} – ${dtf(locale, 'day', { day: 'numeric' }, zone(to, o)).format(to.d)}`;
  }
  return `${dateOf(from, 'short', o, locale)} – ${dateOf(to, 'short', o, locale)}`;
}
