import { BarChart, type ChartTone } from '../../src';
import { money, num } from '../../src/format';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- BarChart -------------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SPEND = [1240, 980, 1710, 860, 1330, 2100, 1480, 0, 1950, 1120, 1640, 2480];
const PNL = [320, -180, 540, 90, -260, 410, 0, 220, -90, 380];
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const data = (labels: string[], values: number[]) => labels.map((label, i) => ({ label, value: values[i] }));
const compact = (v: number) => money(v, { compact: true });

export const barChart: ComponentDoc = {
  id: 'bar-chart',
  name: 'BarChart',
  exports: ['BarChart'],
  summary:
    'A small dependency-free SVG bar chart that fills its container. Hover, tap or Left/Right keys select a bar and show "label: value" under the chart; touch screens print each value above its bar. Zero values keep a 2px stub so the slot is not lost. A hidden table carries the data for screen readers.',
  importLine: "import { BarChart } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'ok', 'loss', 'accent'] },
    { key: 'height', label: 'Height', type: 'number', min: 80, max: 300 },
    { key: 'showValues', label: 'Values', type: 'select', options: ['auto', 'always'] },
    { key: 'xTicks', label: 'Labels', type: 'select', options: ['ends', 'all'] },
  ],
  initial: { tone: 'chart-1', height: 140, showValues: 'auto', xTicks: 'ends' },
  render: (a) => (
    <div className="w-full min-w-0">
      <BarChart
        label="Spend by month"
        data={data(MONTHS, SPEND)}
        tone={a.tone as ChartTone}
        height={Number(a.height)}
        showValues={a.showValues as 'auto'}
        xTicks={a.xTicks as 'ends'}
        valueFormat={compact}
      />
    </div>
  ),
  code: (a) =>
    jsx('BarChart', {
      label: 'Spend by month',
      data: '{months}',
      tone: a.tone === 'chart-1' ? undefined : a.tone,
      height: Number(a.height) === 140 ? undefined : Number(a.height),
      showValues: a.showValues === 'auto' ? undefined : a.showValues,
      xTicks: a.xTicks === 'ends' ? undefined : a.xTicks,
      valueFormat: '{(v) => money(v, { compact: true })}',
    }),
  stories: [
    {
      id: 'months',
      name: 'Twelve bars, labels at the ends',
      note: 'August is zero and keeps its stub.',
      render: () => (
        <div className="w-full min-w-0">
          <BarChart label="Spend by month" data={data(MONTHS, SPEND)} valueFormat={compact} />
        </div>
      ),
    },
    {
      id: 'week',
      name: 'All labels, values always',
      render: () => (
        <div className="w-full min-w-0">
          <BarChart label="Steps this week" data={data(WEEK, [7400, 9100, 6200, 11200, 8800, 13500, 5200])} xTicks="all" showValues="always" tone="chart-3" valueFormat={(v) => num(v, { compact: true })} />
        </div>
      ),
    },
    {
      id: 'pnl',
      name: 'Gains and losses',
      render: () => (
        <div className="w-full min-w-0">
          <BarChart label="Daily P&L" data={data(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], PNL)} tone="ok" valueFormat={(v) => money(v)} />
        </div>
      ),
    },
  ],
  usage: `import { BarChart } from '@nish/ui';
import { money } from '@nish/ui/format';

<BarChart
  label="Spend by month"
  data={months.map((m) => ({ label: m.name, value: m.total }))}
  valueFormat={(v) => money(v, { compact: true })}
/>`,
  guidelines: [
    'Keep it to roughly 7 to 14 bars on a phone. More than that, aggregate or switch to LineChart.',
    'xTicks="ends" labels the first and last bar; use "all" for 7 or fewer short labels such as weekdays.',
    'Pass valueFormat so the caption, the value labels and the screen reader table all show the same units.',
    "Always pass label, the chart's accessible name.",
  ],
};
