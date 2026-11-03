import { Progress, type ProgressTone } from '../../src/components/progress';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Progress -----------------------------------------------------------------------

const TONES: ProgressTone[] = ['accent', 'ok', 'warn', 'loss', 'info', 'neutral'];
const SIZES = ['xs', 'sm', 'md', 'lg'] as const;

export const progress: ComponentDoc = {
  id: 'progress',
  name: 'Progress',
  exports: ['Progress'],
  summary:
    'A bar for work that finishes: an upload, an import, a step count. Determinate with a value, indeterminate without one. role="progressbar" with value text, a tone, four sizes and an optional visible label.',
  importLine: "import { Progress } from '@nish/ui';",
  controls: [
    { key: 'value', label: 'Value', type: 'number', min: 0, max: 100 },
    { key: 'indeterminate', label: 'Indeterminate', type: 'boolean' },
    { key: 'tone', label: 'Tone', type: 'select', options: [...TONES] },
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'showValue', label: 'Show value', type: 'boolean' },
  ],
  initial: { value: 64, indeterminate: false, tone: 'accent', size: 'sm', showValue: true },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Progress
        label="Uploading"
        value={a.indeterminate ? null : Number(a.value)}
        tone={a.tone as ProgressTone}
        size={a.size as 'sm'}
        showValue={!!a.showValue}
      />
    </div>
  ),
  code: (a) =>
    jsx('Progress', {
      label: 'Uploading',
      value: a.indeterminate ? null : Number(a.value),
      tone: a.tone === 'accent' ? undefined : a.tone,
      size: a.size === 'sm' ? undefined : a.size,
      showValue: a.showValue || undefined,
    }),
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <div className="grid w-full gap-3">
          {TONES.map((t, i) => (
            <Progress key={t} label={t} tone={t} value={25 + i * 14} showValue />
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
            <Progress key={s} aria-label={`Size ${s}`} size={s} value={60} />
          ))}
        </div>
      ),
    },
    {
      id: 'indeterminate',
      name: 'Indeterminate',
      note: 'No value: use it when you cannot tell how long it will take. It pulses, and holds still under reduced motion.',
      render: () => <Progress label="Preparing export" />,
    },
    {
      id: 'format',
      name: 'Custom value text',
      render: () => (
        <Progress label="Importing listings" value={340} max={500} showValue formatValue={(v, m) => `${v} of ${m}`} />
      ),
    },
  ],
  usage: `import { Progress } from '@nish/ui';

<Progress label="Uploading" value={done} max={total} showValue />

// Unknown duration:
<Progress label="Preparing export" />`,
  guidelines: [
    'Always give it a name: a visible label, aria-label or aria-labelledby. Without one it reads "Progress" or "Loading".',
    'Use Meter for a measurement that is not going to finish (disk used); use Progress for work that completes.',
    'Pass formatValue when a percent is the wrong reading ("340 of 500"); screen readers get the same text.',
    'In forced-colors mode the fill uses Highlight and the track gets a border, so it stays visible.',
  ],
};
