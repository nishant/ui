import { Checkbox } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Checkbox ------------------------------------------------------------------------

export const checkbox: ComponentDoc = {
  id: 'checkbox',
  name: 'Checkbox',
  exports: ['Checkbox'],
  summary: 'A checkbox with its label and an optional hint. The whole row toggles it, and it is a 44px tap target on touch screens.',
  importLine: "import { Checkbox } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'hint', label: 'Hint', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { label: 'Email me when the price drops', hint: true, disabled: false },
  render: (a) => (
    <Checkbox
      label={String(a.label)}
      hint={a.hint ? 'At most one email a day per item.' : undefined}
      disabled={!!a.disabled}
      defaultChecked
    />
  ),
  code: (a) => jsx('Checkbox', { label: a.label, hint: a.hint ? 'At most one email a day per item.' : undefined, disabled: a.disabled, defaultChecked: true }),
  stories: [
    { id: 'plain', name: 'Plain', render: () => <Checkbox label="Hide YouTube Shorts" /> },
    { id: 'checked', name: 'Checked, with a hint', render: () => <Checkbox label="Only stores with a problem" hint="Hides the 14 stores that read fine." defaultChecked /> },
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
  ],
  usage: `import { Checkbox } from '@nish/ui';

<Checkbox
  label="Email me when the price drops"
  hint="At most one email a day per item."
  checked={notify}
  onChange={(e) => setNotify(e.target.checked)}
/>`,
  guidelines: [
    'Use it for independent on/off choices. For one choice among several, use Segmented or Select.',
    'Group related boxes in a fieldset with a legend.',
  ],
};
