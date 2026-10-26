import { Card, ChartLegend, Sparkline, type ChartLegendItem } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ChartLegend ---------------------------------------------------------------------------

const SERIES: ChartLegendItem[] = [
  { label: 'CPU', tone: 'chart-1' },
  { label: 'Memory', tone: 'chart-2' },
  { label: 'Disk', tone: 'chart-3' },
  { label: 'Network', tone: 'chart-4' },
];

const ALL: ChartLegendItem[] = Array.from({ length: 8 }, (_, i) => ({ label: `Series ${i + 1}`, tone: `chart-${i + 1}` as ChartLegendItem['tone'] }));

const wave = (k: number) => Array.from({ length: 24 }, (_, i) => 40 + 25 * Math.sin((i + k * 3) / 3) + k * 4);

export const chartLegend: ComponentDoc = {
  id: 'chart-legend',
  name: 'ChartLegend',
  exports: ['ChartLegend'],
  summary:
    'The key for a multi-series chart. uPlot and other canvas charts draw no legend of their own, so this lists each series as a color mark (a short line, or a dot) and its name.',
  importLine: "import { ChartLegend } from '@nish/ui';",
  controls: [{ key: 'marker', label: 'Marker', type: 'select', options: ['line', 'dot'] }],
  initial: { marker: 'line' },
  render: (a) => <ChartLegend items={SERIES} marker={a.marker === 'dot' ? 'dot' : 'line'} />,
  code: (a) => jsx('ChartLegend', { items: "{[{ label: 'CPU', tone: 'chart-1' }, …]}", marker: a.marker === 'line' ? undefined : a.marker }),
  api: { functions: [], interfaces: ['ChartLegendItem'] },
  stories: [
    { id: 'line', name: 'Line markers', render: () => <ChartLegend items={SERIES} /> },
    { id: 'dot', name: 'Dot markers', render: () => <ChartLegend marker="dot" items={[{ label: 'Up', tone: 'ok' }, { label: 'Slow', tone: 'warn' }, { label: 'Down', tone: 'loss' }]} /> },
    { id: 'all', name: 'All eight chart colors', wide: true, render: () => <ChartLegend items={ALL} /> },
    {
      id: 'card',
      name: 'Over a chart, in a card',
      wide: true,
      render: () => (
        <Card className="w-full" title="This PC" description="Last 24 hours">
          <ChartLegend items={SERIES.slice(0, 2)} className="mb-2" />
          <div className="relative h-16">
            <Sparkline values={wave(0)} label="CPU" tone="chart-1" height={64} min={0} max={100} className="absolute inset-0 w-full" />
            <Sparkline values={wave(1)} label="Memory" tone="chart-2" height={64} min={0} max={100} className="absolute inset-0 w-full" />
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { ChartLegend, seriesColor } from '@nish/ui';

// The chart draws series i in var(--nish-chart-{i+1}); the legend uses the same roles.
<ChartLegend items={[{ label: 'CPU', tone: 'chart-1' }, { label: 'Memory', tone: 'chart-2' }]} />`,
  guidelines: [
    'Give each series the same tone the chart draws it in (seriesColor(i) is chart-(i+1)).',
    'The marks are decorative; the names carry the meaning, so keep them short and visible.',
    'Status tones (ok, warn, loss) use the -fill marks, like StatusDot.',
  ],
};
