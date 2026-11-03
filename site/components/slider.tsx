import { useState } from 'react';
import { Field } from '../../src/components/forms';
import { Slider } from '../../src/components/slider';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Slider --------------------------------------------------------------------------

function Price() {
  const [range, setRange] = useState<[number, number]>([200, 800]);
  return (
    <div className="grid w-full max-w-sm gap-1">
      <div className="flex justify-between text-xs text-th-hi3">
        <span>Price range</span>
        <span className="tabular-nums">
          ${range[0]} to ${range[1]}
        </span>
      </div>
      <Slider aria-label="Price" min={0} max={1000} step={10} value={range} onValueChange={setRange} formatValue={(v) => `$${v}`} />
    </div>
  );
}

function Volume() {
  const [v, setV] = useState(40);
  const [saved, setSaved] = useState(40);
  return (
    <div className="grid w-full max-w-sm gap-1">
      <Slider aria-label="Volume" value={v} onValueChange={setV} onValueCommit={setSaved} />
      <p className="text-xs text-th-hi3">
        Now {v}, saved {saved}
      </p>
    </div>
  );
}

export const slider: ComponentDoc = {
  id: 'slider',
  name: 'Slider',
  exports: ['Slider'],
  summary:
    'Pick a number, or a range, by dragging. Thumbs are role="slider" with arrows, PageUp, PageDown, Home and End; pointer drag works anywhere on the track; right-to-left mirrors it. Hidden inputs post the value in a form.',
  importLine: "import { Slider } from '@nish/ui';",
  controls: [
    { key: 'range', label: 'Range', type: 'boolean' },
    { key: 'min', label: 'Min', type: 'number', min: 0, max: 50 },
    { key: 'max', label: 'Max', type: 'number', min: 60, max: 200 },
    { key: 'step', label: 'Step', type: 'number', min: 1, max: 20 },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { range: false, min: 0, max: 100, step: 1, disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Slider
        key={`${a.range}-${a.min}-${a.max}`}
        aria-label="Amount"
        min={Number(a.min)}
        max={Number(a.max)}
        step={Number(a.step)}
        disabled={!!a.disabled}
        defaultValue={a.range ? [Number(a.min) + 20, Number(a.max) - 20] : Number(a.min) + 30}
      />
    </div>
  ),
  code: (a) =>
    jsx('Slider', {
      'aria-label': 'Amount',
      min: Number(a.min) === 0 ? undefined : Number(a.min),
      max: Number(a.max) === 100 ? undefined : Number(a.max),
      step: Number(a.step) === 1 ? undefined : Number(a.step),
      disabled: a.disabled,
      defaultValue: a.range ? [Number(a.min) + 20, Number(a.max) - 20] : Number(a.min) + 30,
    }),
  stories: [
    {
      id: 'single',
      name: 'Single value',
      render: () => (
        <div className="w-full max-w-sm">
          <Slider aria-label="Brightness" defaultValue={60} />
        </div>
      ),
    },
    {
      id: 'range',
      name: 'Range',
      note: 'A pair makes two thumbs that cannot cross. A form posts both under the same name.',
      render: () => <Price />,
    },
    {
      id: 'commit',
      name: 'Save on release',
      note: 'onValueChange runs while dragging; onValueCommit once when the drag ends or a key press lands.',
      render: () => <Volume />,
    },
    {
      id: 'text',
      name: 'Spoken value',
      note: 'formatValue sets aria-valuetext, so a screen reader says "3 days" instead of "3".',
      render: () => (
        <div className="w-full max-w-sm">
          <Slider aria-label="Trial length" min={1} max={14} defaultValue={7} formatValue={(v) => `${v} ${v === 1 ? 'day' : 'days'}`} />
        </div>
      ),
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-sm">
          <Field label="Opacity" hint="Applies to the whole layer.">
            <Slider defaultValue={80} />
          </Field>
        </div>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <div className="w-full max-w-sm">
          <Slider aria-label="Locked" defaultValue={30} disabled />
        </div>
      ),
    },
  ],
  usage: `import { Slider } from '@nish/ui';

<Slider aria-label="Volume" value={volume} onValueChange={setVolume} onValueCommit={save} />

// A range, posted as two form values
<Slider aria-label="Price" name="price" min={0} max={1000} step={10} defaultValue={[200, 800]} />`,
  guidelines: [
    'Use it for an approximate value on a scale; use a number Input when the exact number matters.',
    'Name it with aria-label, aria-labelledby or a Field. A range names its thumbs "<name> Minimum" and "<name> Maximum".',
    'Show the current value in text near the slider, or pass formatValue so assistive technology hears it.',
    'Save on onValueCommit, not on every onValueChange, when a change triggers a request.',
  ],
};
