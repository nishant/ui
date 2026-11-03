import { useState } from 'react';
import { Field } from '../../src/components/forms';
import { Radio, RadioGroup } from '../../src/components/radio-group';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- RadioGroup ----------------------------------------------------------------------

const PLANS = [
  { value: 'free', label: 'Free', description: 'One project, community support.' },
  { value: 'pro', label: 'Pro', description: 'Unlimited projects, email support.' },
  { value: 'team', label: 'Team', description: 'Shared billing and roles.' },
];

function Controlled() {
  const [plan, setPlan] = useState('pro');
  return (
    <div className="grid gap-2">
      <RadioGroup aria-label="Plan" value={plan} onValueChange={setPlan} options={PLANS} />
      <p className="text-xs text-th-hi3">Selected: {plan}</p>
    </div>
  );
}

export const radioGroup: ComponentDoc = {
  id: 'radio-group',
  name: 'RadioGroup',
  exports: ['RadioGroup', 'Radio'],
  summary:
    'One choice among a few, all visible at once. Native radio inputs, so the value posts in a form and works with react-hook-form. Arrow keys move and select (mirrored in right-to-left), and every row is a 44px target on touch screens.',
  importLine: "import { RadioGroup, Radio } from '@nish/ui';",
  controls: [
    { key: 'orientation', label: 'Orientation', type: 'select', options: ['vertical', 'horizontal'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'required', label: 'Required', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
  ],
  initial: { orientation: 'vertical', disabled: false, required: false, invalid: false },
  render: (a) => (
    <RadioGroup
      aria-label="Plan"
      defaultValue="pro"
      orientation={a.orientation as 'vertical' | 'horizontal'}
      disabled={!!a.disabled}
      required={!!a.required}
      invalid={!!a.invalid}
      options={PLANS}
    />
  ),
  code: (a) =>
    jsx('RadioGroup', {
      'aria-label': 'Plan',
      defaultValue: 'pro',
      orientation: a.orientation === 'vertical' ? undefined : a.orientation,
      disabled: a.disabled,
      required: a.required,
      invalid: a.invalid,
      options: '{plans}',
    }),
  stories: [
    { id: 'options', name: 'From options', render: () => <RadioGroup aria-label="Plan" defaultValue="free" options={PLANS} /> },
    {
      id: 'horizontal',
      name: 'Horizontal',
      render: () => (
        <RadioGroup
          aria-label="Density"
          orientation="horizontal"
          defaultValue="comfortable"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
      ),
    },
    {
      id: 'children',
      name: 'Radio children',
      note: 'Use children when a row needs its own layout, or when you register each radio with a form library.',
      render: () => (
        <RadioGroup aria-label="Delivery" defaultValue="standard">
          <Radio value="standard" label="Standard" description="3 to 5 days" />
          <Radio value="express" label="Express" description="Next day" />
          <Radio value="pickup" label="Pickup" disabled description="Unavailable here" />
        </RadioGroup>
      ),
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
    {
      id: 'field',
      name: 'In a Field',
      note: 'Field names the group and ties the hint and error to it.',
      render: () => (
        <div className="w-full max-w-sm">
          <Field label="Plan" hint="You can change it later.">
            <RadioGroup options={PLANS} />
          </Field>
        </div>
      ),
    },
    {
      id: 'invalid',
      name: 'Invalid',
      render: () => (
        <div className="w-full max-w-sm">
          <Field label="Plan" error="Choose a plan to continue.">
            <RadioGroup options={PLANS} required />
          </Field>
        </div>
      ),
    },
  ],
  usage: `import { RadioGroup, Radio } from '@nish/ui';

<RadioGroup
  aria-label="Plan"
  name="plan"
  value={plan}
  onValueChange={setPlan}
  options={[
    { value: 'free', label: 'Free', description: 'One project.' },
    { value: 'pro', label: 'Pro' },
  ]}
/>

// react-hook-form: leave value out and register each Radio
<RadioGroup aria-label="Plan">
  <Radio value="free" label="Free" {...register('plan')} />
  <Radio value="pro" label="Pro" {...register('plan')} />
</RadioGroup>`,
  guidelines: [
    'Use it for two to six choices the reader should compare. For more, use Select; for on/off, use Checkbox or Switch.',
    'Always name the group: a Field label, aria-label or aria-labelledby.',
    'Controlled use (value + onValueChange) and form-library use (register on each Radio, no value) are both supported; do not mix them.',
    'The arrow keys move and select, as in the ARIA radio group pattern; they swap left and right in right-to-left layouts.',
  ],
};
