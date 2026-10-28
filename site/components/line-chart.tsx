import type { ComponentProps } from 'react';
import { LineChart, type ChartTone, type LinePoint } from '../../src';
import { money, time } from '../../src/format';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- LineChart ------------------------------------------------------------------------------

/** A deterministic random walk, so the page looks the same on every load. */
function walk(n: number, start: number, step: number, seed: number, gapAt?: number[]): LinePoint[] {
  let v = start;
  let s = seed;
  const t0 = Date.UTC(2026, 9, 28, 13, 30);
  return Array.from({ length: n }, (_, i) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    v += (s / 4294967296 - 0.48) * step;
    return { x: t0 + i * 5 * 60_000, y: gapAt?.includes(i) ? null : Math.round(v * 100) / 100 };
  });
}

const PRICE = walk(78, 180, 1.4, 7);
const GAPPY = walk(78, 180, 1.4, 7, [30, 31, 32, 33]);
const OTHER = walk(78, 176, 1.2, 21);
const THIRD = walk(78, 184, 1.6, 33);
const px = (v: number) => money(v);
const tx = (v: number) => time(v, { timeZone: 'America/New_York' });

type Mode = 'data' | 'loading' | 'empty';

function Chart({ mode = 'data', ...rest }: { mode?: Mode } & Partial<ComponentProps<typeof LineChart>>) {
  return (
    <div className="w-full min-w-0">
      <LineChart label="NVDA price today" data={mode === 'empty' ? [] : PRICE} yFormat={px} xFormat={tx} loading={mode === 'loading'} {...rest} />
    </div>
  );
}

export const lineChart: ComponentDoc = {
  id: 'line-chart',
  name: 'LineChart',
  exports: ['LineChart'],
  summary:
    'A small dependency-free SVG line chart that fills its container: one or several series, gaps for missing values, an optional area and a dashed baseline. Hover, touch-drag or Left/Right keys move a crosshair with a tooltip; vertical swipes still scroll the page. A hidden table carries the data for screen readers.',
  importLine: "import { LineChart } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'ok', 'loss', 'accent'] },
    { key: 'height', label: 'Height', type: 'number', min: 100, max: 360 },
    { key: 'area', label: 'Area fill', type: 'boolean' },
    { key: 'baseline', label: 'Baseline (previous close)', type: 'boolean' },
    { key: 'gaps', label: 'Gap in the data', type: 'boolean' },
    { key: 'state', label: 'State', type: 'select', options: ['data', 'loading', 'empty'] },
  ],
  initial: { tone: 'chart-1', height: 200, area: true, baseline: true, gaps: false, state: 'data' },
  render: (a) => (
    <Chart
      mode={a.state as Mode}
      data={a.state === 'empty' ? [] : a.gaps ? GAPPY : PRICE}
      tone={a.tone as ChartTone}
      height={Number(a.height)}
      area={!!a.area}
      baseline={a.baseline ? (PRICE[0].y ?? undefined) : undefined}
    />
  ),
  code: (a) =>
    jsx('LineChart', {
      label: 'NVDA price today',
      data: '{points}',
      tone: a.tone === 'chart-1' ? undefined : a.tone,
      height: Number(a.height) === 200 ? undefined : Number(a.height),
      area: a.area ? true : undefined,
      baseline: a.baseline ? '{previousClose}' : undefined,
      yFormat: '{money}',
      xFormat: '{time}',
      loading: a.state === 'loading' ? true : undefined,
    }),
  stories: [
    { id: 'area', name: 'Price with area and baseline', render: () => <Chart area baseline={PRICE[0].y ?? undefined} /> },
    { id: 'gap', name: 'A gap breaks the line', note: 'A null y leaves a hole instead of joining across it.', render: () => <Chart data={GAPPY} tone="chart-3" /> },
    {
      id: 'multi',
      name: 'Several series',
      wide: true,
      render: () => (
        <div className="w-full min-w-0">
          <LineChart
            label="Three tickers today"
            series={[
              { label: 'NVDA', points: PRICE },
              { label: 'AMD', points: OTHER },
              { label: 'AVGO', points: THIRD, tone: 'chart-4' },
            ]}
            yFormat={px}
            xFormat={tx}
          />
        </div>
      ),
    },
    { id: 'loading', name: 'Loading', render: () => <Chart mode="loading" /> },
    { id: 'empty', name: 'Empty', render: () => <Chart mode="empty" /> },
    { id: 'short', name: 'Short', render: () => <Chart height={100} yTicks={2} xTicks={2} tone="ok" area /> },
  ],
  usage: `import { LineChart } from '@nish/ui';
import { money, time } from '@nish/ui/format';

<LineChart
  label="NVDA price today"
  data={bars.map((b) => ({ x: b.t, y: b.close }))}
  baseline={previousClose}
  area
  yFormat={money}
  xFormat={(t) => time(t)}
  loading={query.isPending}
/>`,
  guidelines: [
    'x is any number (epoch ms works); xFormat turns it into text for the axis and the tooltip heading.',
    "Always pass label: it is the chart's accessible name. The data table for screen readers is generated for you (first 200 points).",
    'Use tone for meaning (ok, loss), chart-1 to chart-8 for categories. Do not rely on red and green alone to tell series apart.',
    'For a tiny trend next to a number use Sparkline; LineChart is for a chart you read and scrub.',
    "It sizes itself to its container's width, so give the container a width and let the height prop set the plot height.",
  ],
};
