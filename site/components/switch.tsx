import { useState } from 'react';
import { Card } from '../../src';
import { Switch } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Switch --------------------------------------------------------------------------

function Demo({ label, description, size, labelSide, disabled, initial = true }: { label?: string; description?: string; size?: 'sm' | 'md'; labelSide?: 'start' | 'end'; disabled?: boolean; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={on}
      onChange={setOn}
      label={label}
      description={description}
      size={size}
      labelSide={labelSide}
      disabled={disabled}
      aria-label={label ? undefined : 'Auto refresh'}
    />
  );
}

export const switchDoc: ComponentDoc = {
  id: 'switch',
  name: 'Switch',
  exports: ['Switch'],
  summary:
    'An on/off setting that applies at once. A button with role="switch" and aria-checked; a visible label is tied to it with aria-labelledby, and clicking the label toggles it too.',
  importLine: "import { Switch } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'description', label: 'Description', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'labelSide', label: 'Label side', type: 'select', options: ['start', 'end'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { label: 'Auto refresh', description: true, size: 'md', labelSide: 'start', disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Demo
        label={String(a.label) || undefined}
        description={a.description ? 'Reloads every widget each minute.' : undefined}
        size={a.size === 'sm' ? 'sm' : 'md'}
        labelSide={a.labelSide === 'end' ? 'end' : 'start'}
        disabled={!!a.disabled}
      />
    </div>
  ),
  code: (a) =>
    jsx('Switch', {
      checked: '{on}',
      onChange: '{setOn}',
      label: a.label || undefined,
      description: a.description ? 'Reloads every widget each minute.' : undefined,
      size: a.size === 'md' ? undefined : a.size,
      labelSide: a.labelSide === 'start' ? undefined : a.labelSide,
      disabled: a.disabled,
    }),
  stories: [
    { id: 'default', name: 'Default', render: () => <Demo label="Auto refresh" /> },
    { id: 'off', name: 'Off', render: () => <Demo label="Show weekends" initial={false} /> },
    { id: 'description', name: 'With a description', render: () => <div className="w-full max-w-sm"><Demo label="Compact rows" description="Fits more jobs on a screen." /></div> },
    { id: 'sm', name: 'Small', render: () => <Demo label="Seconds" size="sm" /> },
    { id: 'end', name: 'Label after the switch', render: () => <Demo label="Notify me" labelSide="end" /> },
    { id: 'bare', name: 'No visible label', note: 'Pass aria-label (or aria-labelledby) instead.', render: () => <Demo /> },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <div className="grid gap-2">
          <Demo label="Sync to Drive" disabled />
          <Demo label="Beta widgets" disabled initial={false} />
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a settings card',
      wide: true,
      render: () => (
        <Card className="w-full max-w-md">
          <p className="mb-3 text-sm font-semibold text-th-hi">Dashboard</p>
          <div className="grid gap-3">
            <Demo label="Auto refresh" description="Reloads every widget each minute." />
            <Demo label="Show seconds on clocks" initial={false} />
            <Demo label="Start with Windows" description="Opens the dashboard when you sign in." />
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { Switch } from '@nish/ui';

const [auto, setAuto] = useState(true);

<Switch
  label="Auto refresh"
  description="Reloads every widget each minute."
  checked={auto}
  onChange={setAuto}
/>`,
  guidelines: [
    'Use a Switch for a setting that takes effect immediately. Inside a form that waits for Save, use a Checkbox.',
    'Name it: pass label, or aria-label / aria-labelledby when the label lives elsewhere in the row.',
    'Write the label as the setting ("Auto refresh"), not as an action ("Turn on auto refresh").',
  ],
};
