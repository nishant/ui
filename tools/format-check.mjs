// Self-test for @nish/ui/format. Run after `npm run build`: imports dist/format.js and
// checks representative outputs. Exits non-zero on any mismatch.
import * as f from '../dist/format.js';

const M = '−';
const D = '–';
const at = (y, mo, d, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi);
const NOW = at(2026, 10, 28, 12, 0).getTime();

const cases = [
  // money
  ['money 1234.56', f.money(1234.56), '$1,234.56'],
  ['money 12', f.money(12), '$12.00'],
  ['money 1234 (auto, no cents)', f.money(1234), '$1,234'],
  ['money 1234 always', f.money(1234, { cents: 'always' }), '$1,234.00'],
  ['money 12.5 never', f.money(12.5, { cents: 'never' }), '$13'],
  ['money compact', f.money(12345, { compact: true }), '$12.3k'],
  ['money compact M', f.money(4500000, { compact: true }), '$4.5M'],
  ['money negative', f.money(-4), `${M}$4.00`],
  ['money EUR', f.money(5, { currency: 'EUR' }), '€5.00'],
  ['money null', f.money(null), D],
  ['money NaN', f.money(NaN), D],
  // signedMoney
  ['signedMoney +', f.signedMoney(12.3), '+$12.30'],
  ['signedMoney -', f.signedMoney(-4), `${M}$4.00`],
  ['signedMoney none', f.signedMoney(0.001), 'No change'],
  ['signedMoney undefined', f.signedMoney(undefined), D],
  // pct
  ['pct ratio', f.pct(0.123), '12.3%'],
  ['pct percent', f.pct(12.34, { fromRatio: false, digits: 2 }), '12.34%'],
  ['pct signed +', f.pct(0.05, { signed: true }), '+5.0%'],
  ['pct signed -', f.pct(-0.05, { signed: true }), `${M}5.0%`],
  ['pct zero', f.pct(-0.00001, { signed: true }), '0.0%'],
  ['pct null', f.pct(null), D],
  // num / signed
  ['num thousands', f.num(1234567.891), '1,234,567.89'],
  ['num digits', f.num(3, { digits: 2 }), '3.00'],
  ['num compact', f.num(12345, { compact: true }), '12.3k'],
  ['num compact rollover', f.num(999999, { compact: true }), '1M'],
  ['num negative', f.num(-5.5), `${M}5.5`],
  ['signed +', f.signed(1.2), '+1.20'],
  ['signed -', f.signed(-0.4), `${M}0.40`],
  ['signed zero', f.signed(0), '0.00'],
  // bytes
  ['bytes 0', f.bytes(0), '0 B'],
  ['bytes MB', f.bytes(1258291), '1.2 MB'],
  ['bytes KB', f.bytes(2048), '2.0 KB'.replace('.0', '')],
  ['bytes null', f.bytes(null), D],
  // duration
  ['duration short', f.duration(24000), '6h 40m'],
  ['duration long', f.duration(24000, { style: 'long' }), '6 hours 40 minutes'],
  ['duration seconds', f.duration(45), '45s'],
  ['duration hour', f.duration(3600), '1h'],
  ['duration day', f.duration(93600), '1d 2h'],
  ['duration long singular', f.duration(61, { style: 'long' }), '1 minute 1 second'],
  // ago
  ['ago just now', f.ago(NOW - 10000, { now: NOW }), 'just now'],
  ['ago minutes', f.ago(NOW - 3 * 60000, { now: NOW }), '3m ago'],
  ['ago hours future', f.ago(NOW + 2 * 3600000, { now: NOW }), 'in 2h'],
  ['ago days', f.ago(NOW - 5 * 86400000, { now: NOW }), '5d ago'],
  ['ago long', f.ago(NOW - 3 * 60000, { now: NOW, style: 'long' }), '3 minutes ago'],
  ['ago long future', f.ago(NOW + 2 * 3600000, { now: NOW, style: 'long' }), 'in 2 hours'],
  ['ago invalid', f.ago('nope'), D],
  // date / time
  ['date short', f.date(at(2026, 10, 28)), 'Oct 28'],
  ['date medium', f.date(at(2026, 10, 28), 'medium'), 'Oct 28, 2026'],
  ['date long', f.date(at(2026, 10, 28), 'long'), 'Wednesday, October 28, 2026'],
  ['date weekday', f.date(at(2026, 10, 28), 'weekday'), 'Wed 10/28'],
  ['date iso string is a local day', f.date('2026-10-28'), 'Oct 28'],
  ['date invalid', f.date('garbage'), D],
  ['date null', f.date(null), D],
  ['time am', f.time(at(2026, 10, 28, 7, 42)), '7:42 AM'],
  ['time pm', f.time(at(2026, 10, 28, 13, 5)), '1:05 PM'],
  ['time zone', f.time(Date.UTC(2026, 9, 28, 12, 0), { timeZone: 'UTC' }), '12:00 PM'],
  ['dateTime', f.dateTime(at(2026, 10, 28, 7, 42)), 'Oct 28, 7:42 AM'],
  ['dateTime invalid', f.dateTime(undefined), D],
  // dateRange
  ['dateRange same month', f.dateRange(at(2026, 12, 12), at(2026, 12, 16)), `Dec 12 ${D} 16`],
  ['dateRange across months', f.dateRange(at(2026, 12, 30), at(2027, 1, 2)), `Dec 30, 2026 ${D} Jan 2, 2027`],
  ['dateRange across months same year', f.dateRange(at(2026, 11, 30), at(2026, 12, 2)), `Nov 30 ${D} Dec 2`],
  ['dateRange same day', f.dateRange(at(2026, 12, 12), at(2026, 12, 12)), 'Dec 12'],
  ['dateRange invalid', f.dateRange(at(2026, 12, 12), 'x'), D],
];

let failed = 0;
for (const [name, got, want] of cases) {
  if (got !== want) {
    failed++;
    console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}

if (failed) {
  console.error(`format-check: ${failed} of ${cases.length} failed`);
  process.exit(1);
}
console.log(`format-check: ${cases.length} cases passed`);
