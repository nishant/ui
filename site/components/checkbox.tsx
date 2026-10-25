import { useState } from 'react';
import { Card } from '../../src';
import { Checkbox } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Checkbox ------------------------------------------------------------------------

const ROWS = ['Acme Corp', 'Globex', 'Initech'];

function SelectAll() {
  const [picked, setPicked] = useState<string[]>(['Globex']);
  const all = picked.length === ROWS.length;
  return (
    <div className="grid gap-1">
      <Checkbox
        label="Select all"
        checked={all}
        indeterminate={picked.length > 0 && !all}
        onChange={() => setPicked(all ? [] : ROWS)}
      />
      {ROWS.map((r) => (
        <Checkbox
          key={r}
          className="pl-6"
          label={r}
          checked={picked.includes(r)}
          onChange={() => setPicked((xs) => (xs.includes(r) ? xs.filter((x) => x !== r) : [...xs, r]))}
        />
      ))}
    </div>
  );
}

export const checkbox: ComponentDoc = {
  id: 'checkbox',
  name: 'Checkbox',
  exports: ['Checkbox'],
  summary:
    'A checkbox with its label, an optional hint and a trailing slot. The box is drawn from theme roles, supports the indeterminate state, and the whole row is a 44px tap target on touch screens.',
  importLine: "import { Checkbox } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'hint', label: 'Hint', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'indeterminate', label: 'Indeterminate', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { label: 'Email me when the price drops', hint: true, size: 'md', indeterminate: false, disabled: false },
  render: (a) => (
    <Checkbox
      label={String(a.label)}
      hint={a.hint ? 'At most one email a day per item.' : undefined}
      size={a.size === 'sm' ? 'sm' : 'md'}
      indeterminate={!!a.indeterminate}
      disabled={!!a.disabled}
      defaultChecked
    />
  ),
  code: (a) =>
    jsx('Checkbox', {
      label: a.label,
      hint: a.hint ? 'At most one email a day per item.' : undefined,
      size: a.size === 'md' ? undefined : a.size,
      indeterminate: a.indeterminate,
      disabled: a.disabled,
      defaultChecked: true,
    }),
  stories: [
    { id: 'plain', name: 'Plain', render: () => <Checkbox label="Hide YouTube Shorts" /> },
    { id: 'checked', name: 'Checked, with a hint', render: () => <Checkbox label="Only stores with a problem" hint="Hides the 14 stores that read fine." defaultChecked /> },
    { id: 'sm', name: 'Small', render: () => <Checkbox size="sm" label="Show closed positions" defaultChecked /> },
    { id: 'indeterminate', name: 'Select all (indeterminate)', render: () => <SelectAll /> },
    {
      id: 'trailing',
      name: 'With a trailing value',
      render: () => (
        <div className="grid w-full max-w-xs gap-1">
          <Checkbox label="Best Buy" trailing="from $212" defaultChecked />
          <Checkbox label="Amazon" trailing="from $219" />
        </div>
      ),
    },
    { id: 'no-label', name: 'No visible label', note: 'Table row selection: pass aria-label.', render: () => <Checkbox aria-label="Select Acme Corp" defaultChecked /> },
    {
      id: 'group',
      name: 'A group',
      render: () => (
        <fieldset className="grid gap-1">
          <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3">Stores</legend>
          <Checkbox label="Best Buy" defaultChecked />
          <Checkbox label="Amazon" defaultChecked />
          <Checkbox label="Target" />
          <Checkbox label="Walmart" disabled hint="Blocks automated checks." />
        </fieldset>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card className="w-full max-w-md">
          <p className="mb-2 text-sm font-semibold text-th-hi">Alerts</p>
          <div className="grid gap-1">
            <Checkbox label="Price drops" hint="At most one email a day per item." defaultChecked />
            <Checkbox label="Back in stock" />
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { Checkbox } from '@nish/ui';

<Checkbox
  label="Email me when the price drops"
  hint="At most one email a day per item."
  checked={notify}
  onChange={(e) => setNotify(e.target.checked)}
/>

// Select all
<Checkbox label="Select all" checked={all} indeterminate={some && !all} onChange={toggleAll} />`,
  guidelines: [
    'Use it for independent on/off choices inside a form. For a setting that applies at once, use Switch; for one choice among several, Segmented or Select.',
    'Group related boxes in a fieldset with a legend.',
    'A box without a visible label (a table row) needs aria-label.',
  ],
};
