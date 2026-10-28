import { RangeBar } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- RangeBar -------------------------------------------------------------------------------

const DAYS = [
  ['Wed', 52, 71, 60],
  ['Thu', 49, 68, 66],
  ['Fri', 44, 61, 47],
  ['Sat', 40, 58, 52],
] as const;

export const rangeBar: ComponentDoc = {
  id: 'range-bar',
  name: 'RangeBar',
  exports: ['RangeBar'],
  summary:
    "A thin range track with a highlighted low-to-high segment and an optional dot for the current value: a day's temperature range against the week, a price's day range inside its 52-week range. It is decorative; always print the numbers beside it.",
  importLine: "import { RangeBar } from '@nish/ui';",
  controls: [
    { key: 'low', label: 'Low', type: 'number', min: 0, max: 100 },
    { key: 'high', label: 'High', type: 'number', min: 0, max: 100 },
    { key: 'current', label: 'Current', type: 'number', min: 0, max: 100 },
    { key: 'showCurrent', label: 'Show current', type: 'boolean' },
  ],
  initial: { low: 30, high: 70, current: 55, showCurrent: true },
  render: (a) => (
    <div className="w-full max-w-sm">
      <RangeBar min={0} max={100} low={Number(a.low)} high={Number(a.high)} current={a.showCurrent ? Number(a.current) : undefined} />
    </div>
  ),
  code: (a) =>
    jsx('RangeBar', {
      min: 0,
      max: 100,
      low: Number(a.low),
      high: Number(a.high),
      current: a.showCurrent ? Number(a.current) : undefined,
    }),
  stories: [
    {
      id: 'weather',
      name: 'Daily temperature rows',
      note: 'All rows share min and max so the bars line up.',
      render: () => (
        <ul className="m-0 grid w-full list-none gap-2 p-0">
          {DAYS.map(([day, lo, hi, now]) => (
            <li key={day} className="grid grid-cols-[2.5rem_2rem_1fr_2rem] items-center gap-3 text-sm tabular-nums">
              <span className="text-th-hi">{day}</span>
              <span className="text-right text-th-hi3">{lo}°</span>
              <RangeBar min={36} max={74} low={lo} high={hi} current={day === 'Wed' ? now : undefined} />
              <span className="text-th-hi">{hi}°</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'price',
      name: 'Price within its 52-week range',
      render: () => (
        <div className="grid w-full max-w-sm gap-1">
          <RangeBar min={108} max={212} low={178.2} high={184.9} current={182.4} />
          <div className="flex justify-between text-xs tabular-nums text-th-hi3">
            <span>52w low $108</span>
            <span>52w high $212</span>
          </div>
        </div>
      ),
    },
    {
      id: 'edges',
      name: 'Edges',
      render: () => (
        <div className="grid w-full max-w-sm gap-3">
          <RangeBar min={0} max={100} low={0} high={100} current={100} />
          <RangeBar min={0} max={100} low={45} high={55} />
        </div>
      ),
    },
  ],
  usage: `import { RangeBar } from '@nish/ui';

<span>{day.low}°</span>
<RangeBar min={weekLow} max={weekHigh} low={day.low} high={day.high} />
<span>{day.high}°</span>`,
  guidelines: [
    "Give every row the same min and max, so a bar's position tells you where it sits in the whole range.",
    'The track has no text of its own. Show the low and high values as text next to it.',
    'The dot (current) is optional: use it for "now", leave it out for pure ranges.',
    "It fills its container's width; set the width on a wrapper or a grid column.",
  ],
};
