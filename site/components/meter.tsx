import { Card } from '../../src';
import { Meter, toneFor, type MeterTone } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Meter --------------------------------------------------------------------------

const TONES: MeterTone[] = ['accent', 'ok', 'warn', 'loss', 'info'];
const SIZES = ['xs', 'sm', 'md'] as const;
const DISK = { warn: 75, loss: 90 };

export const meter: ComponentDoc = {
  id: 'meter',
  name: 'Meter',
  exports: ['Meter'],
  summary:
    'A thin bar for how full something is: disk, quota, a score, or progress. role="meter" (or progressbar) with its value, and a tone from thresholds.',
  importLine: "import { Meter, toneFor } from '@nish/ui';",
  controls: [
    { key: 'value', label: 'Value', type: 'number', min: 0, max: 100 },
    { key: 'tone', label: 'Tone', type: 'select', options: ['thresholds', ...TONES, 'chart-3'] },
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'track', label: 'Track', type: 'select', options: ['elevated', 'overlay'] },
    { key: 'showValue', label: 'Show value', type: 'boolean' },
  ],
  initial: { value: 82, tone: 'thresholds', size: 'sm', track: 'elevated', showValue: true },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Meter
        value={Number(a.value)}
        label="Disk used"
        tone={a.tone === 'thresholds' ? undefined : (a.tone as MeterTone)}
        thresholds={a.tone === 'thresholds' ? DISK : undefined}
        size={a.size as 'sm'}
        track={a.track as 'elevated'}
        showValue={!!a.showValue}
      />
    </div>
  ),
  code: (a) =>
    jsx('Meter', {
      value: Number(a.value),
      label: 'Disk used',
      tone: a.tone === 'thresholds' ? undefined : a.tone,
      thresholds: a.tone === 'thresholds' ? '{{ warn: 75, loss: 90 }}' : undefined,
      size: a.size === 'sm' ? undefined : a.size,
      track: a.track === 'elevated' ? undefined : a.track,
      showValue: a.showValue || undefined,
    }),
  api: { functions: ['toneFor'], interfaces: [] },
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <div className="grid w-full gap-3">
          {TONES.map((t, i) => (
            <Meter key={t} value={30 + i * 15} label={t} tone={t} showValue />
          ))}
        </div>
      ),
    },
    {
      id: 'thresholds',
      name: 'Thresholds',
      note: 'ok under 75, warn from 75, loss from 90.',
      render: () => (
        <div className="grid w-full gap-3">
          {[42, 80, 96].map((v) => (
            <div key={v} className="grid gap-1">
              <span className="flex justify-between text-xs text-th-hi3">
                <span>/dev/sda{v === 42 ? 1 : v === 80 ? 2 : 3}</span>
                <span className="tabular-nums">{toneFor(v, DISK)}</span>
              </span>
              <Meter value={v} label={`Disk ${v}% used`} thresholds={DISK} showValue />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <div className="grid w-full gap-3">
          {SIZES.map((s) => (
            <Meter key={s} value={64} label={`Size ${s}`} size={s} />
          ))}
        </div>
      ),
    },
    {
      id: 'chart',
      name: 'Chart colors and vertical',
      render: () => (
        <div className="flex h-24 items-end gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Meter
              key={n}
              value={20 + n * 10}
              label={`Series ${n}`}
              tone={`chart-${n}` as MeterTone}
              orientation="vertical"
              size="md"
            />
          ))}
        </div>
      ),
    },
    {
      id: 'progress',
      name: 'Progress',
      render: () => (
        <div className="grid w-full gap-1.5">
          <span className="text-xs text-th-hi3">Importing 340 of 500 listings</span>
          <Meter value={340} max={500} label="Import progress" kind="progress" showValue />
        </div>
      ),
    },
    {
      id: 'card',
      name: 'Overlay track, in a card',
      render: () => (
        <Card className="w-full max-w-sm">
          <p className="text-sm font-semibold text-th-hi">API quota</p>
          <div className="mt-3 rounded-lg bg-th-elevated p-3">
            <span className="flex justify-between text-xs text-th-hi2">
              <span>Calls today</span>
              <span className="tabular-nums">412 / 500</span>
            </span>
            <Meter value={412} max={500} label="API calls today" track="overlay" thresholds={{ warn: 400, loss: 475 }} className="mt-2" />
          </div>
        </Card>
      ),
    },

    {
      id: 'neutral',
      name: 'Neutral tone',
      note: 'A gray fill for a quantity with no status meaning (swap, a share of a total).',
      render: () => (
        <div className="grid w-full max-w-xs gap-2 text-xs text-th-hi3">
          <span>Swap 3.1 of 8 GB</span>
          <Meter value={39} label="Swap used" tone="neutral" showValue />
        </div>
      ),
    },
  ],
  usage: `import { Meter, toneFor } from '@nish/ui';

<Meter value={disk.usedPct} label="Disk used" thresholds={{ warn: 75, loss: 90 }} showValue />

// Lower is worse: loss below warn.
<Meter value={battery} label="Battery" thresholds={{ warn: 30, loss: 10 }} />`,
  guidelines: [
    'Always pass label: the bar has no text of its own.',
    'Show the number nearby (showValue, or your own text) so the reading never depends on color.',
    'Use kind="progress" for work that finishes, meter for a measurement.',
    'On an elevated box use track="overlay" so the empty part still shows.',
  ],
};
