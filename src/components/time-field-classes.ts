// Pure helpers of TimeField: HH:mm values, the locale's 12/24-hour clock and day-period names, stepping. No React.
export type HourCycle = 12 | 24;
/** One edit state of the three boxes: hour text, minute text, and PM (12-hour clock only). */
export interface TimeDraft {
  h: string;
  m: string;
  pm: boolean;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DIGITS_RE = /^\d{1,2}$/;
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Parses HH:mm (00:00 to 23:59), else null. */
export function parseTime(s: string | null | undefined): { h: number; m: number } | null {
  if (typeof s !== 'string') return null;
  const x = TIME_RE.exec(s);
  return x ? { h: Number(x[1]), m: Number(x[2]) } : null;
}

/** "09:05". */
export function toTime(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}`;
}

/** False when min or max is a valid HH:mm and t is outside it (string compare). Invalid limits are ignored. */
export function inTimeRange(t: string, min?: string | null, max?: string | null): boolean {
  const lo = parseTime(min) ? min! : null;
  const hi = parseTime(max) ? max! : null;
  // min after max is a range that wraps past midnight, as on <input type="time">.
  if (lo !== null && hi !== null && lo > hi) return t >= lo || t <= hi;
  if (lo !== null && t < lo) return false;
  if (hi !== null && t > hi) return false;
  return true;
}

const cycles = new Map<string, HourCycle>();
/** 12 for locales whose clock is h11/h12 (en-US), else 24 (de-DE, en-GB, ja-JP). Cached per locale. */
export function hourCycleFor(locale: string): HourCycle {
  const hit = cycles.get(locale);
  if (hit) return hit;
  let c: HourCycle = 24;
  try {
    const o = new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }).resolvedOptions();
    const twelve = o.hourCycle ? o.hourCycle === 'h11' || o.hourCycle === 'h12' : o.hour12 === true;
    c = twelve ? 12 : 24;
  } catch {
    c = 24;
  }
  cycles.set(locale, c);
  return c;
}

const periods = new Map<string, [string, string]>();
/** The locale's AM and PM words, e.g. ['AM', 'PM'], ['午前', '午後']. Cached per locale. */
export function dayPeriodNames(locale: string): [string, string] {
  const hit = periods.get(locale);
  if (hit) return hit;
  let r: [string, string] = ['AM', 'PM'];
  try {
    const f = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true, timeZone: 'UTC' });
    const word = (h: number): string | undefined =>
      f.formatToParts(new Date(Date.UTC(2026, 0, 1, h))).find((p) => p.type === 'dayPeriod')?.value;
    r = [word(1) || 'AM', word(13) || 'PM'];
  } catch {
    r = ['AM', 'PM'];
  }
  periods.set(locale, r);
  return r;
}

/** 0 -> 12 AM, 12 -> 12 PM, 13 -> 1 PM. */
export function to12(h: number): { hour: number; pm: boolean } {
  return { hour: h % 12 === 0 ? 12 : h % 12, pm: h >= 12 };
}

/** 12 AM -> 0, 12 PM -> 12. */
export function from12(hour: number, pm: boolean): number {
  return (hour % 12) + (pm ? 12 : 0);
}

/** An integer from 1 to 60; anything else (undefined, NaN, 0, 90) is clamped, NaN and undefined give 1. */
export function normalizeStep(step?: number): number {
  return Number.isFinite(step) ? Math.min(60, Math.max(1, Math.floor(step!))) : 1;
}

/** The last minute a step reaches: floor(59 / step) * step. */
export function lastMinute(step: number): number {
  return Math.floor(59 / step) * step;
}

/** The next hour in 24-hour terms, wrapping 23 -> 0; from empty, up gives 0 and down 23. */
export function stepHour(h: number | null, dir: 1 | -1): number {
  return h === null ? (dir > 0 ? 0 : 23) : (h + dir + 24) % 24;
}

/** The next multiple of step above (or below) m, wrapping within the hour without changing it. */
export function stepMinute(m: number | null, dir: 1 | -1, step: number): number {
  if (m === null) return dir > 0 ? 0 : lastMinute(step);
  if (dir > 0) {
    const n = (Math.floor(m / step) + 1) * step;
    return n > 59 ? 0 : n;
  }
  const n = Math.ceil(m / step) * step - step;
  return n < 0 ? lastMinute(step) : n;
}

/** The hour box text for a 24-hour hour: "09" on a 24-hour clock, "9" on a 12-hour clock. */
export function hourText(h: number, cycle: HourCycle): string {
  return cycle === 24 ? pad2(h) : String(to12(h).hour);
}

/** The boxes for a value: empty boxes and AM for null. */
export function draftFromTime(t: string | null, cycle: HourCycle): TimeDraft {
  const p = parseTime(t);
  if (!p) return { h: '', m: '', pm: false };
  return { h: hourText(p.h, cycle), m: pad2(p.m), pm: p.h >= 12 };
}

/** HH:mm for complete valid boxes, null for two empty boxes, undefined for anything else (one empty, not digits,
 *  hour outside 0-23 or 1-12, minute outside 0-59). */
export function draftTime(d: TimeDraft, cycle: HourCycle): string | null | undefined {
  if (d.h === '' && d.m === '') return null;
  if (d.h === '' || d.m === '') return undefined;
  if (!DIGITS_RE.test(d.h) || !DIGITS_RE.test(d.m)) return undefined;
  const hn = Number(d.h);
  const mn = Number(d.m);
  if (cycle === 24 ? hn > 23 : hn < 1 || hn > 12) return undefined;
  if (mn > 59) return undefined;
  return toTime(cycle === 12 ? from12(hn, d.pm) : hn, mn);
}

/** True when the typed hour text is final, so focus moves to the minutes: two digits, or one digit that
 *  cannot start a two-digit hour (3-9 on a 24-hour clock, 2-9 on a 12-hour clock). */
export function hourAdvances(text: string, cycle: HourCycle): boolean {
  const max = cycle === 24 ? 23 : 12;
  return text.length >= 2 || (text.length === 1 && Number(text) * 10 > max);
}
