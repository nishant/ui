import { ago, bytes, date, dateRange, dateTime, duration, money, num, pct, signed, signedMoney, time } from '../../src/format';
import type { ComponentDoc } from './types';

// --- @nish/ui/format ------------------------------------------------------------------------
// Every example shows the call and what it returns right now, computed live from the real
// functions in src/format.ts.

const NOW = Date.UTC(2026, 9, 28, 14, 42, 0);
const D = (iso: string) => new Date(`${iso}T12:00:00`);

type Example = [call: string, result: string];

const GROUPS: { id: string; name: string; note?: string; rows: Example[] }[] = [
  {
    id: 'money',
    name: 'money, signedMoney',
    note: 'Cents show under $1,000 or when the value has cents; compact abbreviates. Negative uses the real minus sign.',
    rows: [
      ['money(1234.56)', money(1234.56)],
      ['money(1234)', money(1234)],
      ['money(0.5)', money(0.5)],
      ['money(1234.56, { cents: "never" })', money(1234.56, { cents: 'never' })],
      ['money(1234, { cents: "always" })', money(1234, { cents: 'always' })],
      ['money(12345, { compact: true })', money(12345, { compact: true })],
      ['money(1250000, { compact: true })', money(1250000, { compact: true })],
      ['money(99, { currency: "EUR" })', money(99, { currency: 'EUR' })],
      ['signedMoney(12.3)', signedMoney(12.3)],
      ['signedMoney(-4)', signedMoney(-4)],
      ['signedMoney(0.001)', signedMoney(0.001)],
      ['money(null)', money(null)],
    ],
  },
  {
    id: 'pct',
    name: 'pct',
    note: 'A ratio by default (0.123 is 12.3%); pass fromRatio: false for values already in percent.',
    rows: [
      ['pct(0.123)', pct(0.123)],
      ['pct(0.123, { digits: 0 })', pct(0.123, { digits: 0 })],
      ['pct(0.0214, { signed: true })', pct(0.0214, { signed: true })],
      ['pct(-0.0214, { signed: true })', pct(-0.0214, { signed: true })],
      ['pct(12.5, { fromRatio: false })', pct(12.5, { fromRatio: false })],
      ['pct(NaN)', pct(NaN)],
    ],
  },
  {
    id: 'num',
    name: 'num, signed, bytes',
    rows: [
      ['num(1234567)', num(1234567)],
      ['num(1234567, { compact: true })', num(1234567, { compact: true })],
      ['num(3.14159, { digits: 2 })', num(3.14159, { digits: 2 })],
      ['signed(1.2)', signed(1.2)],
      ['signed(-0.4)', signed(-0.4)],
      ['bytes(1234567)', bytes(1234567)],
      ['bytes(512)', bytes(512)],
      ['bytes(undefined)', bytes(undefined)],
    ],
  },
  {
    id: 'duration',
    name: 'duration',
    rows: [
      ['duration(24000)', duration(24000)],
      ['duration(24000, { style: "long" })', duration(24000, { style: 'long' })],
      ['duration(95)', duration(95)],
      ['duration(45)', duration(45)],
    ],
  },
  {
    id: 'ago',
    name: 'ago',
    note: 'Pass now to make output stable (tests, server rendering). Future moments read "in 2h".',
    rows: [
      ['ago(now - 20s)', ago(NOW - 20_000, { now: NOW })],
      ['ago(now - 3m)', ago(NOW - 180_000, { now: NOW })],
      ['ago(now - 5h)', ago(NOW - 5 * 3600_000, { now: NOW })],
      ['ago(now - 3d)', ago(NOW - 3 * 86400_000, { now: NOW })],
      ['ago(now + 2h)', ago(NOW + 2 * 3600_000, { now: NOW })],
      ['ago(now - 3m, { style: "long" })', ago(NOW - 180_000, { now: NOW, style: 'long' })],
      ['ago("not a date")', ago('not a date')],
    ],
  },
  {
    id: 'date',
    name: 'date, time, dateTime, dateRange',
    rows: [
      ['date(d)', date(D('2026-10-28'))],
      ['date(d, "medium")', date(D('2026-10-28'), 'medium')],
      ['date(d, "long")', date(D('2026-10-28'), 'long')],
      ['date(d, "weekday")', date(D('2026-10-28'), 'weekday')],
      ['time(d)', time(new Date('2026-10-28T07:42:00'))],
      ['dateTime(d)', dateTime(new Date('2026-10-28T07:42:00'))],
      ['dateRange("2026-12-12", "2026-12-16")', dateRange(D('2026-12-12'), D('2026-12-16'))],
      ['dateRange("2026-12-30", "2027-01-02")', dateRange(D('2026-12-30'), D('2027-01-02'))],
      ['date(undefined)', date(undefined)],
    ],
  },
];

function Examples({ ids }: { ids?: string[] }) {
  const groups = ids ? GROUPS.filter((g) => ids.includes(g.id)) : GROUPS;
  return (
    <div className="grid w-full min-w-0 gap-4">
      {groups.map((g) => (
        <section key={g.id} className="min-w-0 overflow-hidden rounded-xl border border-th-line bg-th-surface">
          <h3 className="border-b border-th-line px-3.5 py-2 font-mono text-sm font-semibold text-th-hi">{g.name}</h3>
          {g.note ? <p className="px-3.5 pt-2 text-sm text-th-hi3">{g.note}</p> : null}
          <dl className="m-0 grid">
            {g.rows.map(([call, out]) => (
              <div key={call} className="grid gap-x-4 gap-y-0.5 border-b border-th-line px-3.5 py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
                <dt className="min-w-0 break-words font-mono text-[13px] text-th-hi3">{call}</dt>
                <dd className="m-0 font-mono text-sm font-medium tabular-nums text-th-hi">{out}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Try({ fn, value }: { fn: string; value: string }) {
  const n = Number(value);
  const out: Record<string, string> = {
    money: money(n),
    signedMoney: signedMoney(n),
    pct: pct(n),
    num: num(n),
    signed: signed(n),
    bytes: bytes(n),
    duration: duration(n),
    // eslint-disable-next-line react-hooks/purity -- docs demo shows the current time on purpose
    ago: ago(Date.now() - n * 1000),
  };
  return (
    <div className="grid w-full max-w-md gap-1 rounded-xl border border-th-line bg-th-surface p-4">
      <code className="break-words font-mono text-[13px] text-th-hi3">
        {fn}({value === '' ? '' : Number.isNaN(n) ? JSON.stringify(value) : n})
      </code>
      <p className="m-0 font-mono text-2xl font-semibold tabular-nums text-th-hi">{out[fn]}</p>
    </div>
  );
}

export const format: ComponentDoc = {
  id: 'format',
  name: 'Format functions',
  exports: [],
  source: 'src/format.ts',
  summary:
    'Twelve React-free functions for money, percentages, numbers, durations and dates, in one en-US style across every app. Import them from @nish/ui/format, a separate entry that static pages and servers can use without React. Missing or invalid input becomes an en dash, never "NaN" or "undefined".',
  importLine: "import { money, pct, ago, date } from '@nish/ui/format';",
  controls: [
    { key: 'fn', label: 'Function', type: 'select', options: ['money', 'signedMoney', 'pct', 'num', 'signed', 'bytes', 'duration', 'ago'] },
    { key: 'value', label: 'Value (seconds for ago)', type: 'text' },
  ],
  initial: { fn: 'money', value: '1234.5' },
  render: (a) => <Try fn={String(a.fn)} value={String(a.value)} />,
  code: (a) => `${a.fn}(${a.value})`,
  stories: GROUPS.map((g) => ({
    id: g.id,
    name: g.name,
    wide: true,
    render: () => <Examples ids={[g.id]} />,
  })),
  api: { functions: ['money', 'signedMoney', 'pct', 'num', 'signed', 'bytes', 'duration', 'ago', 'date', 'time', 'dateTime', 'dateRange'], interfaces: [] },
  usage: `import { money, signedMoney, pct, ago, dateRange } from '@nish/ui/format';

money(1234.56);                    // "$1,234.56"
signedMoney(-4);                   // "−$4.00"
pct(0.0214, { signed: true });     // "+2.1%"
ago(Date.now() - 180_000);         // "3m ago"
dateRange(depart, ret);            // "Dec 12 – 16"

// Static pages, no bundler:
// import { money } from './nish/format.js';`,
  guidelines: [
    'Use these everywhere a number or date reaches the screen, so Trading, Trips and the hub agree on how $1,234.56 and "3m ago" look.',
    'They return an en dash for null, undefined, NaN or an invalid date. Do not guard calls with your own fallback text.',
    'Negative and signed values use the real minus sign (U+2212), which aligns with the plus sign in tabular columns.',
    'Output is en-US on purpose. Pass timeZone to time() for a place other than the viewer\'s.',
    'For a live "3m ago" in React use RelativeTime, which wraps ago() in a <time> element.',
  ],
};
