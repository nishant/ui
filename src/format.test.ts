import { afterEach, describe, expect, it } from 'vitest';
import {
  ago,
  bytes,
  date,
  dateRange,
  dateTime,
  duration,
  getDefaultLocale,
  money,
  num,
  pct,
  setDefaultLocale,
  signed,
  signedMoney,
  time,
} from './format';

const M = '−';
const D = '–';
const at = (y: number, mo: number, d: number, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi);
const NOW = at(2026, 10, 28, 12, 0).getTime();

afterEach(() => setDefaultLocale('en-US'));

describe('missing input', () => {
  it('returns an en dash for null, undefined and NaN from every number formatter', () => {
    for (const fn of [money, signedMoney, pct, num, signed, bytes, duration] as ((v: number | null | undefined) => string)[]) {
      expect(fn(null)).toBe(D);
      expect(fn(undefined)).toBe(D);
      expect(fn(NaN)).toBe(D);
      expect(fn(Infinity)).toBe(D);
    }
  });

  it('returns an en dash for missing or invalid dates from every date formatter', () => {
    expect(time(undefined)).toBe(D);
    expect(time('garbage')).toBe(D);
    expect(date(null)).toBe(D);
    expect(date('garbage')).toBe(D);
    expect(dateTime(undefined)).toBe(D);
    expect(dateRange(null, at(2026, 1, 1))).toBe(D);
    expect(dateRange(at(2026, 1, 1), 'x')).toBe(D);
    expect(ago(undefined)).toBe(D);
  });
});

describe('money', () => {
  it('shows cents under 1000 and none at 1000 without cents', () => {
    expect(money(999.5)).toBe('$999.50');
    expect(money(1000)).toBe('$1,000');
    expect(money(1000.5)).toBe('$1,000.50');
  });

  it('compact starts at exactly 1000', () => {
    expect(money(999.99, { compact: true })).toBe('$999.99');
    expect(money(1000, { compact: true })).toBe('$1k');
    expect(money(1_000_000, { compact: true })).toBe('$1M');
    expect(money(2_500_000_000_000, { compact: true })).toBe('$2.5T');
  });

  it('does not show a minus for a value that rounds to $0.00', () => {
    expect(money(-0.004)).toBe('$0.00');
    expect(money(-0.005)).toBe(`${M}$0.01`);
  });

  it('falls back to the code for an unknown currency', () => {
    expect(money(5, { currency: 'XXXX' })).toBe('XXXX 5.00');
  });
});

describe('signedMoney', () => {
  it('has a boundary at 0.005 and treats 0 as no change', () => {
    expect(signedMoney(0)).toBe('No change');
    expect(signedMoney(0.004)).toBe('No change');
    expect(signedMoney(0.005)).toBe('+$0.01');
    expect(signedMoney(-0.005)).toBe(`${M}$0.01`);
  });
});

describe('pct', () => {
  it('shows no sign for exactly 0 and for values that round to 0', () => {
    expect(pct(0, { signed: true })).toBe('0.0%');
    expect(pct(-0.00001, { signed: true })).toBe('0.0%');
    expect(pct(0.1234, { digits: 2 })).toBe('12.34%');
  });
});

describe('num', () => {
  it('has no minus at exactly 0 or for a tiny negative with default digits', () => {
    expect(num(0)).toBe('0');
    expect(num(-0.001)).toBe('0');
    expect(num(-0.001, { digits: 3 })).toBe(`${M}0.001`);
  });

  it('compact starts at exactly 1000 and rolls over units', () => {
    expect(num(999, { compact: true })).toBe('999');
    expect(num(1000, { compact: true })).toBe('1k');
    expect(num(1_000_000, { compact: true })).toBe('1M');
    expect(num(999_950, { compact: true })).toBe('1M');
    expect(num(2e12, { compact: true })).toBe('2T');
    expect(num(-12345, { compact: true })).toBe(`${M}12.3k`);
    expect(num(12345, { compact: true, digits: 2 })).toBe('12.35k');
  });
});

describe('signed', () => {
  it('has no sign at exactly 0', () => {
    expect(signed(0)).toBe('0.00');
    expect(signed(1.2)).toBe('+1.20');
    expect(signed(-1.2)).toBe(`${M}1.20`);
    expect(signed(3, { digits: 0 })).toBe('+3');
  });
});

describe('bytes', () => {
  it('steps at exactly 1024 and keeps whole bytes without decimals', () => {
    expect(bytes(1023)).toBe('1,023 B');
    expect(bytes(1024)).toBe('1.0 KB'.replace('.0', ''));
    expect(bytes(512)).toBe('512 B');
    expect(bytes(1536)).toBe('1.5 KB');
  });

  it('drops the decimal from 100 of a unit up', () => {
    expect(bytes(100 * 1024)).toBe('100 KB');
    expect(bytes(99.5 * 1024)).toBe('99.5 KB');
  });

  it('stops at petabytes', () => {
    expect(bytes(1024 ** 5)).toBe('1 PB');
    expect(bytes(1024 ** 6)).toBe('1,024 PB');
  });

  it('marks negatives', () => {
    expect(bytes(-2048)).toBe(`${M}2 KB`);
  });
});

describe('duration', () => {
  it('shows at most two units', () => {
    expect(duration(90061)).toBe('1d 1h');
    expect(duration(90061, { style: 'long' })).toBe('1 day 1 hour');
    expect(duration(3661)).toBe('1h 1m');
  });

  it('handles zero, negatives and values that round to zero', () => {
    expect(duration(0)).toBe('0s');
    expect(duration(0, { style: 'long' })).toBe('0 seconds');
    expect(duration(-90)).toBe(`${M}1m 30s`);
    expect(duration(-0.4)).toBe('0s');
  });

  it('pluralizes long units', () => {
    expect(duration(2 * 86400, { style: 'long' })).toBe('2 days');
    expect(duration(1, { style: 'long' })).toBe('1 second');
  });
});

describe('ago', () => {
  it('switches from just now at exactly 45 seconds', () => {
    expect(ago(NOW - 44_000, { now: NOW })).toBe('just now');
    expect(ago(NOW - 45_000, { now: NOW })).toBe('1m ago');
  });

  it('uses months and years', () => {
    expect(ago(NOW - 30 * 86400_000, { now: NOW })).toBe('1mo ago');
    expect(ago(NOW - 365 * 86400_000, { now: NOW })).toBe('1y ago');
    expect(ago(NOW + 60 * 86400_000, { now: NOW })).toBe('in 2mo');
    expect(ago(NOW - 29 * 86400_000, { now: NOW })).toBe('29d ago');
  });

  it('separates past from future', () => {
    expect(ago(NOW + 3 * 3600_000, { now: NOW })).toBe('in 3h');
    expect(ago(NOW - 3 * 3600_000, { now: NOW })).toBe('3h ago');
    expect(ago(NOW + 3 * 3600_000, { now: NOW, style: 'long' })).toBe('in 3 hours');
  });

  it('uses Intl words for other languages', () => {
    expect(ago(NOW - 180_000, { now: NOW, locale: 'fr-FR', style: 'long' })).toBe('il y a 3 minutes');
    expect(ago(NOW - 1000, { now: NOW, locale: 'de-DE', style: 'long' })).toBe('jetzt');
    expect(ago(NOW - 180_000, { now: NOW, locale: 'de-DE' })).not.toMatch(/ago/);
  });

  it('keeps English words for other English locales', () => {
    expect(ago(NOW - 180_000, { now: NOW, locale: 'en-GB' })).toBe('3m ago');
  });
});

describe('date parsing', () => {
  it('reads a bare YYYY-MM-DD as a local calendar day', () => {
    expect(date('2026-10-28')).toBe('Oct 28');
    expect(date(' 2026-10-28 ')).toBe('Oct 28');
  });

  it('does not treat other strings as date-only', () => {
    expect(date('x2026-10-28')).toBe(D);
    expect(date('2026-10-28T12:00')).toBe('Oct 28');
    expect(time('2026-10-28T07:42')).toBe('7:42 AM');
    expect(time('2026-10-28')).toBe('12:00 AM');
  });

  it('accepts epoch milliseconds', () => {
    expect(date(at(2026, 10, 28).getTime())).toBe('Oct 28');
  });
});

describe('date, time, dateTime', () => {
  it('formats every style', () => {
    const d = at(2026, 10, 28);
    expect(date(d)).toBe('Oct 28');
    expect(date(d, 'medium')).toBe('Oct 28, 2026');
    expect(date(d, 'long')).toBe('Wednesday, October 28, 2026');
    expect(date(d, 'weekday')).toBe('Wed 10/28');
  });

  it('uses a plain space before AM and PM', () => {
    expect(time(at(2026, 10, 28, 13, 5))).toBe('1:05 PM');
    expect(time(at(2026, 10, 28, 0, 0))).toBe('12:00 AM');
    expect(dateTime(at(2026, 10, 28, 7, 42))).toBe('Oct 28, 7:42 AM');
  });

  it('applies timeZone, but not to a bare calendar day', () => {
    const t = Date.UTC(2026, 9, 28, 23, 30);
    expect(time(t, { timeZone: 'UTC' })).toBe('11:30 PM');
    expect(time(t, { timeZone: 'Asia/Tokyo' })).toBe('8:30 AM');
    expect(date(t, 'short', { timeZone: 'Asia/Tokyo' })).toBe('Oct 29');
    expect(date(t, 'weekday', { timeZone: 'Asia/Tokyo' })).toBe('Thu 10/29');
    expect(dateTime(t, { timeZone: 'Asia/Tokyo' })).toBe('Oct 29, 8:30 AM');
    expect(date('2026-10-28', 'short', { timeZone: 'Pacific/Kiritimati' })).toBe('Oct 28');
  });
});

describe('dateRange', () => {
  it('collapses by month and year', () => {
    expect(dateRange(at(2026, 12, 12), at(2026, 12, 16))).toBe(`Dec 12 ${D} 16`);
    expect(dateRange(at(2026, 12, 12), at(2026, 12, 12))).toBe('Dec 12');
    expect(dateRange(at(2026, 11, 30), at(2026, 12, 2))).toBe(`Nov 30 ${D} Dec 2`);
    expect(dateRange(at(2026, 12, 30), at(2027, 1, 2))).toBe(`Dec 30, 2026 ${D} Jan 2, 2027`);
  });

  it('compares days in the given time zone', () => {
    const a = Date.UTC(2026, 11, 12, 23, 0);
    const b = Date.UTC(2026, 11, 13, 1, 0);
    expect(dateRange(a, b, { timeZone: 'UTC' })).toBe(`Dec 12 ${D} 13`);
    expect(dateRange(a, b, { timeZone: 'Asia/Tokyo' })).toBe('Dec 13');
  });
});

describe('locale', () => {
  it('defaults to en-US and keeps English output', () => {
    expect(getDefaultLocale()).toBe('en-US');
    expect(num(1234567.891)).toBe('1,234,567.89');
  });

  it('takes a locale option', () => {
    expect(num(1234.5, { locale: 'de-DE' })).toBe('1.234,5');
    expect(money(1234.56, { locale: 'de-DE' })).toBe('$1.234,56');
    expect(pct(0.123, { locale: 'de-DE' })).toBe('12,3%');
    expect(bytes(1536, { locale: 'de-DE' })).toBe('1,5 KB');
    expect(signed(1.5, { locale: 'de-DE' })).toBe('+1,50');
    expect(time(at(2026, 10, 28, 13, 5), { locale: 'de-DE' })).toBe('13:05');
    expect(date(at(2026, 10, 28), 'weekday', { locale: 'en-GB' })).toBe('Wed 28/10');
    expect(date(at(2026, 10, 28), 'long', { locale: 'es-ES' })).toMatch(/miércoles/);
  });

  it('translates duration units for other languages only', () => {
    expect(duration(24000, { locale: 'de-DE', style: 'long' })).toMatch(/Stunden/);
    expect(duration(0, { locale: 'de-DE' })).toMatch(/0/);
    expect(duration(24000, { locale: 'en-GB' })).toBe('6h 40m');
  });

  it('setDefaultLocale changes every formatter, and a bad tag falls back to en-US', () => {
    setDefaultLocale('de-DE');
    expect(getDefaultLocale()).toBe('de-DE');
    expect(num(1234.5)).toBe('1.234,5');
    expect(num(1234.5, { locale: 'en-US' })).toBe('1,234.5');
    setDefaultLocale('not a locale!');
    expect(getDefaultLocale()).toBe('en-US');
    expect(num(1234.5, { locale: '???' })).toBe('1,234.5');
  });
});

describe('formatter cache', () => {
  it('reuses Intl formatters across calls', () => {
    const NF = Intl.NumberFormat;
    let built = 0;
    Intl.NumberFormat = new Proxy(NF, {
      construct(target, args) {
        built++;
        return Reflect.construct(target, args);
      },
    });
    try {
      num(1.5, { locale: 'sv-SE', digits: 3 });
      const first = built;
      expect(first).toBeGreaterThan(0);
      for (let i = 0; i < 50; i++) num(i + 0.5, { locale: 'sv-SE', digits: 3 });
      expect(built).toBe(first);
      money(5, { currency: 'CHF' });
      const afterMoney = built;
      for (let i = 0; i < 50; i++) money(i, { currency: 'CHF' });
      expect(built).toBe(afterMoney);
    } finally {
      Intl.NumberFormat = NF;
    }
  });

  it('formats 10 000 date-times in under 100 ms', () => {
    const d = at(2026, 10, 28, 7, 42);
    dateTime(d);
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) dateTime(d);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
