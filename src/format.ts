// @nish/ui/format: number, money, percent, duration and date formatting with no React,
// so static pages and servers can import it. Everything is en-US, and every function
// returns an en dash for null, undefined, NaN or an invalid date.

const DASH = '–';
const MINUS = '−';

function finite(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function fixed(abs: number, min: number, max: number): string {
  return abs.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
}

const COMPACT_UNITS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'k'],
];

/** Compact magnitude text for a non-negative number: 12345 → "12.3k". */
function compactAbs(abs: number, digits: number): string {
  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const [size, suffix] = COMPACT_UNITS[i];
    if (abs < size) continue;
    // 999,950 rounds up to 1000k; show it as 1M instead.
    if (i > 0 && Number((abs / size).toFixed(digits)) >= 1000) {
      const [bigger, bigSuffix] = COMPACT_UNITS[i - 1];
      return fixed(abs / bigger, 0, digits) + bigSuffix;
    }
    return fixed(abs / size, 0, digits) + suffix;
  }
  return fixed(abs, 0, digits);
}

function isZeroAfterRounding(v: number, digits: number): boolean {
  return Number(Math.abs(v).toFixed(digits)) === 0;
}

export interface MoneyOptions {
  /** 'auto' (default) shows cents when |v| < 1000 or v has cents; 'always'; 'never'. */
  cents?: 'auto' | 'always' | 'never';
  /** Short form: $12.3k, $4.5M. */
  compact?: boolean;
  /** ISO 4217 code. Default USD. */
  currency?: string;
}

function currencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency + ' ';
  }
}

function moneyAbs(abs: number, o: MoneyOptions): string {
  const symbol = currencySymbol(o.currency ?? 'USD');
  if (o.compact && abs >= 1000) return symbol + compactAbs(abs, 1);
  const cents = o.cents ?? 'auto';
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const showCents = cents === 'always' || (cents === 'auto' && (abs < 1000 || hasCents));
  return symbol + (showCents ? fixed(abs, 2, 2) : fixed(abs, 0, 0));
}

/** Money: 1234.56 → "$1,234.56"; negatives use a true minus sign. */
export function money(v: number | null | undefined, o: MoneyOptions = {}): string {
  if (!finite(v)) return DASH;
  const text = moneyAbs(Math.abs(v), o);
  return v < 0 && Math.round(Math.abs(v) * 100) > 0 ? MINUS + text : text;
}

/** Signed money: "+$12.30", "−$4.00", and "No change" when |v| < 0.005. */
export function signedMoney(v: number | null | undefined, o: MoneyOptions = {}): string {
  if (!finite(v)) return DASH;
  if (Math.abs(v) < 0.005) return 'No change';
  return (v < 0 ? MINUS : '+') + moneyAbs(Math.abs(v), o);
}

export interface PctOptions {
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
  const text = fixed(Math.abs(value), digits, digits) + '%';
  if (isZeroAfterRounding(value, digits)) return text;
  if (value < 0) return MINUS + text;
  return o.signed ? '+' + text : text;
}

export interface NumOptions {
  /** Fixed fraction digits. Default: up to 2, trailing zeros trimmed (1 when compact). */
  digits?: number;
  /** Short form: 12.3k, 4.5M. */
  compact?: boolean;
}

/** A plain number with thousands separators: 1234.5 → "1,234.5". */
export function num(v: number | null | undefined, o: NumOptions = {}): string {
  if (!finite(v)) return DASH;
  const sign = v < 0 && !isZeroAfterRounding(v, o.digits ?? 2) ? MINUS : '';
  const abs = Math.abs(v);
  if (o.compact && abs >= 1000) return sign + compactAbs(abs, o.digits ?? 1);
  return sign + (o.digits === undefined ? fixed(abs, 0, 2) : fixed(abs, o.digits, o.digits));
}

/** A number with an explicit sign: "+1.20", "−0.40". Digits default 2. */
export function signed(v: number | null | undefined, o: { digits?: number } = {}): string {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 2;
  const text = fixed(Math.abs(v), digits, digits);
  if (isZeroAfterRounding(v, digits)) return text;
  return (v < 0 ? MINUS : '+') + text;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** File sizes in 1024 steps: 1258291 → "1.2 MB". */
export function bytes(v: number | null | undefined): string {
  if (!finite(v)) return DASH;
  let abs = Math.abs(v);
  let i = 0;
  while (abs >= 1024 && i < BYTE_UNITS.length - 1) {
    abs /= 1024;
    i++;
  }
  const text = i === 0 || abs >= 100 ? fixed(abs, 0, 0) : fixed(abs, 0, 1);
  return (v < 0 ? MINUS : '') + text + ' ' + BYTE_UNITS[i];
}

/** A length of time from seconds, two largest units: 24000 → "6h 40m" (long: "6 hours 40 minutes"). */
export function duration(seconds: number | null | undefined, o: { style?: 'short' | 'long' } = {}): string {
  if (!finite(seconds)) return DASH;
  const long = o.style === 'long';
  let rest = Math.round(Math.abs(seconds));
  const sign = seconds < 0 && rest > 0 ? MINUS : '';
  const parts: [number, string, string][] = [
    [86400, 'd', 'day'],
    [3600, 'h', 'hour'],
    [60, 'm', 'minute'],
    [1, 's', 'second'],
  ];
  const out: string[] = [];
  for (const [size, short, name] of parts) {
    const n = Math.floor(rest / size);
    rest -= n * size;
    if (n > 0 && out.length < 2) out.push(long ? `${n} ${name}${n === 1 ? '' : 's'}` : `${n}${short}`);
  }
  if (!out.length) return long ? '0 seconds' : '0s';
  return sign + out.join(' ');
}

type DateInput = Date | number | string;

/** Dates are local time; a bare YYYY-MM-DD is a calendar day, not UTC midnight. */
function toDate(t: DateInput | null | undefined): Date | null {
  if (t === null || t === undefined) return null;
  let d: Date;
  if (t instanceof Date) d = t;
  else if (typeof t === 'number') d = new Date(t);
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/** How long ago (or from now): "just now", "3m ago", "in 2h". Long style: "3 minutes ago". */
export function ago(t: DateInput | null | undefined, o: { now?: number; style?: 'short' | 'long' } = {}): string {
  const d = toDate(t);
  if (!d) return DASH;
  const diff = Math.round((d.getTime() - (o.now ?? Date.now())) / 1000);
  const abs = Math.abs(diff);
  if (abs < 45) return 'just now';
  const units: [number, Intl.RelativeTimeFormatUnit, string][] = [
    [60, 'minute', 'm'],
    [3600, 'hour', 'h'],
    [86400, 'day', 'd'],
    [86400 * 30, 'month', 'mo'],
    [86400 * 365, 'year', 'y'],
  ];
  // The largest unit that fits at least once.
  let pick = units[0];
  for (const u of units) if (abs >= u[0]) pick = u;
  const n = Math.max(1, Math.round(abs / pick[0]));
  const past = diff < 0;
  if (o.style === 'long') return rtf.format(past ? -n : n, pick[1]);
  return past ? `${n}${pick[2]} ago` : `in ${n}${pick[2]}`;
}

/** Newer ICU builds put a narrow no-break space before AM/PM; use a plain space. */
function norm(s: string): string {
  // eslint-disable-next-line no-irregular-whitespace -- the class holds literal U+202F and U+00A0 characters
  return s.replace(/[  ]/g, ' ');
}

/** A calendar date: 'short' "Oct 28", 'medium' "Oct 28, 2026", 'long' "Wednesday, October 28, 2026", 'weekday' "Wed 10/28". */
export function date(t: DateInput | null | undefined, style: 'short' | 'medium' | 'long' | 'weekday' = 'short'): string {
  const d = toDate(t);
  if (!d) return DASH;
  switch (style) {
    case 'medium':
      return norm(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    case 'long':
      return norm(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    case 'weekday':
      return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`;
    default:
      return norm(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
}

/** Time of day: "7:42 AM". Pass timeZone for a zone other than the viewer's. */
export function time(t: DateInput | null | undefined, o: { timeZone?: string } = {}): string {
  const d = toDate(t);
  if (!d) return DASH;
  return norm(
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: o.timeZone }),
  );
}

/** Date and time: "Oct 28, 7:42 AM". */
export function dateTime(t: DateInput | null | undefined): string {
  const d = toDate(t);
  if (!d) return DASH;
  return `${date(d, 'short')}, ${time(d)}`;
}

/** A span of days: "Dec 12 – 16", "Dec 30 – Jan 2", "Dec 30, 2026 – Jan 2, 2027". */
export function dateRange(a: DateInput | null | undefined, b: DateInput | null | undefined): string {
  const from = toDate(a);
  const to = toDate(b);
  if (!from || !to) return DASH;
  if (from.getFullYear() !== to.getFullYear()) return `${date(from, 'medium')} – ${date(to, 'medium')}`;
  if (from.getMonth() === to.getMonth()) {
    if (from.getDate() === to.getDate()) return date(from, 'short');
    return `${date(from, 'short')} – ${to.getDate()}`;
  }
  return `${date(from, 'short')} – ${date(to, 'short')}`;
}
