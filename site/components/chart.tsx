import { Card } from '../../src';
import { CHART, seriesColor, tooltipStyle, useChartTheme } from '../../src/chart';
import type { ComponentDoc } from './types';

// --- @nish/ui/chart -----------------------------------------------------------------

const DATA = [
  [12, 18, 9],
  [15, 14, 11],
  [9, 20, 14],
  [17, 16, 10],
  [21, 12, 15],
];
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

/** A tiny grouped bar chart drawn with the var() strings, so it follows the theme with
 *  no redraw. */
function Bars({ series = 3 }: { series?: number }) {
  const W = 320;
  const H = 140;
  const pad = { l: 24, b: 20, t: 8 };
  const max = 24;
  const groupW = (W - pad.l) / DATA.length;
  const barW = (groupW - 12) / series;
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="Applications by month and source">
      {[0, 8, 16, 24].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W} y1={y(v)} y2={y(v)} stroke={v === 0 ? CHART.zero : CHART.grid} strokeWidth={1} />
          <text x={pad.l - 4} y={y(v) + 3} textAnchor="end" fontSize={9} fill={CHART.text}>
            {v}
          </text>
        </g>
      ))}
      {DATA.map((g, i) => (
        <g key={i}>
          {g.slice(0, series).map((v, s) => (
            <rect
              key={s}
              x={pad.l + i * groupW + 6 + s * barW}
              y={y(v)}
              width={barW - 2}
              height={y(0) - y(v)}
              rx={2}
              fill={seriesColor(s)}
            />
          ))}
          <text x={pad.l + i * groupW + groupW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill={CHART.text}>
            {MONTHS[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Resolved() {
  const t = useChartTheme();
  return (
    <div className="grid w-full gap-2 text-xs">
      <div className="flex flex-wrap gap-1.5">
        {t.series.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 font-mono text-th-hi3">
            <span className="size-3 rounded-sm" style={{ background: c }} aria-hidden="true" />
            {c || '…'}
          </span>
        ))}
      </div>
      <p className="font-mono text-th-hi3">
        grid {t.grid} · axis {t.axis} · text {t.text}
      </p>
    </div>
  );
}

export const chartDoc: ComponentDoc = {
  id: 'chart',
  name: 'Chart colors',
  exports: [],
  summary:
    '@nish/ui/chart: theme colors for charts with no chart library. var() strings for SVG and CSS charts, resolved values and a hook for canvas charts.',
  importLine: "import { seriesColor, CHART, tooltipStyle, chartTheme, useChartTheme } from '@nish/ui/chart';",
  controls: [{ key: 'series', label: 'Series', type: 'number', min: 1, max: 3 }],
  initial: { series: 3 },
  render: (a) => <Bars series={Number(a.series)} />,
  code: () => `<rect fill={seriesColor(i)} />
<line stroke={CHART.grid} />
<Tooltip contentStyle={tooltipStyle} /> // Recharts`,
  api: { functions: ['seriesColor', 'chartTheme', 'useChartTheme'], interfaces: ['ChartTheme'] },
  stories: [
    { id: 'bars', name: 'SVG with var() strings', render: () => <Bars /> },
    { id: 'resolved', name: 'Resolved for canvas (useChartTheme)', note: 'Re-renders on a theme change.', render: () => <Resolved /> },
    {
      id: 'tooltip',
      name: 'tooltipStyle',
      render: () => (
        <div style={tooltipStyle} className="px-2.5 py-1.5">
          <p className="font-medium">Sep</p>
          <p className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: seriesColor(0) }} aria-hidden="true" />
            LinkedIn: 17
          </p>
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      render: () => (
        <Card className="w-full max-w-md">
          <p className="text-sm font-semibold text-th-hi">Applications by source</p>
          <div className="mt-3">
            <Bars />
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { seriesColor, CHART, tooltipStyle, useChartTheme } from '@nish/ui/chart';

// Recharts / SVG: var() strings follow the theme on their own.
<Line stroke={seriesColor(0)} />
<CartesianGrid stroke={CHART.grid} />
<Tooltip contentStyle={tooltipStyle} />

// uPlot / canvas: resolved colors, redraw when they change.
const t = useChartTheme();
useEffect(() => plot.setSeries(0, { stroke: t.series[0] }), [t]);`,
  guidelines: [
    'Series colors come from seriesColor(i), never a hand-picked hex.',
    'Status meaning (up/down bars, alerts) uses the -fill roles (t.ok, t.loss), not chart colors.',
    'Canvas charts must redraw on a theme change: use useChartTheme or onThemeChange.',
  ],
};
