import { Card } from '../../src';
import { Sparkline, Stat, type SparklineTone } from '../../src/components/display';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Sparkline ----------------------------------------------------------------------

const SERIES = [142, 138, 151, 160, 149, 171, 182, 176, 168, 190, 204, 198, 187, 211, 220, 214];
const GAPPY = [12, 14, 13, null, null, 16, 18, 17, null, 21, 20, 23];
const TONES: SparklineTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'accent', 'ok', 'warn', 'loss', 'info'];

export const sparkline: ComponentDoc = {
  id: 'sparkline',
  name: 'Sparkline',
  exports: ['Sparkline'],
  summary:
    'A tiny line chart with no axes, for a trend beside a number. Plain SVG, no chart library: breaks at nulls and shows a dashed line when there is no data.',
  importLine: "import { Sparkline } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: TONES },
    { key: 'fill', label: 'Fill', type: 'boolean' },
    { key: 'gaps', label: 'Gaps', type: 'boolean' },
    { key: 'height', label: 'Height', type: 'number', min: 16, max: 80 },
  ],
  initial: { tone: 'chart-1', fill: true, gaps: false, height: 28 },
  render: (a) => (
    <Sparkline
      values={a.gaps ? GAPPY : SERIES}
      label="Response time, last 16 checks, 138 to 220 ms"
      tone={a.tone as SparklineTone}
      fill={!!a.fill}
      height={Number(a.height)}
      width={200}
    />
  ),
  code: (a) =>
    jsx('Sparkline', {
      values: '{times}',
      label: 'Response time, last 16 checks',
      tone: a.tone === 'chart-1' ? undefined : a.tone,
      fill: a.fill || undefined,
      height: Number(a.height) === 28 ? undefined : Number(a.height),
    }),
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <div className="grid grid-cols-3 gap-3">
          {TONES.map((t) => (
            <span key={t} className="grid gap-1 text-xs text-th-hi3">
              <Sparkline values={SERIES} label={`${t} trend`} tone={t} width={96} />
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'fill',
      name: 'Filled',
      render: () => <Sparkline values={SERIES} label="Price, 16 days" tone="ok" fill width={200} height={40} />,
    },
    {
      id: 'gaps',
      name: 'Gaps at nulls',
      note: 'A lone point between gaps is drawn as a dot.',
      render: () => <Sparkline values={[...GAPPY, null, 19, null]} label="Checks with misses" tone="chart-2" width={200} />,
    },
    {
      id: 'empty',
      name: 'No data',
      render: () => (
        <Row className="gap-4 text-xs text-th-hi3">
          <Sparkline values={[]} label="Price history" width={120} /> No history yet
        </Row>
      ),
    },
    {
      id: 'stretch',
      name: 'Full width',
      render: () => <Sparkline values={SERIES} label="Trend" fill className="w-full" height={36} />,
    },
    {
      id: 'card',
      name: 'Beside a Stat, in a card',
      render: () => (
        <Card className="flex w-full max-w-sm items-end justify-between gap-4">
          <Stat variant="plain" label="p95 response" value="214 ms" sub="last 16 checks" />
          <Sparkline values={SERIES} label="p95 response, 138 to 220 ms" fill width={120} height={36} />
        </Card>
      ),
    },
  ],
  usage: `import { Sparkline } from '@nish/ui';

<Sparkline values={history.map((h) => h.ms ?? null)} label={\`Response time, \${min} to \${max} ms\`} fill />`,
  guidelines: [
    'Put the trend in the label ("120 to 180 ms, rising"): screen readers get no line.',
    'Always show the current number beside it; a sparkline is context, not the value.',
    'Pass min and max when several sparklines must share a scale.',
  ],
};
