import { Card, Input, Select } from '../../src';
import { Field, Textarea } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Field ---------------------------------------------------------------------------

export const field: ComponentDoc = {
  id: 'field',
  name: 'Field',
  exports: ['Field'],
  summary:
    'A labelled form row: a real <label>, one control, and its hint or error. Field gives the control an id, ties the hint and error to it with aria-describedby, and marks it invalid when there is an error.',
  importLine: "import { Field } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'hint', label: 'Hint', type: 'boolean' },
    { key: 'error', label: 'Error', type: 'boolean' },
    { key: 'optional', label: 'Optional', type: 'boolean' },
    { key: 'layout', label: 'Layout', type: 'select', options: ['stack', 'inline'] },
  ],
  initial: { label: 'Email address', hint: true, error: false, optional: false, layout: 'stack' },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Field
        label={String(a.label)}
        hint={a.hint ? 'We only use it for price alerts.' : undefined}
        error={a.error ? 'Enter an email address like name@example.com.' : undefined}
        optional={!!a.optional}
        layout={a.layout === 'inline' ? 'inline' : 'stack'}
      >
        <Input type="email" placeholder="name@example.com" />
      </Field>
    </div>
  ),
  code: (a) =>
    jsx(
      'Field',
      {
        label: a.label,
        hint: a.hint ? 'We only use it for price alerts.' : undefined,
        error: a.error ? 'Enter an email address like name@example.com.' : undefined,
        optional: a.optional,
        layout: a.layout === 'stack' ? undefined : a.layout,
      },
      '<Input type="email" value={email} onChange={…} />',
    ),
  html: {
    height: 300,
    code: `<div style="display:grid;gap:16px;max-width:24rem">
  <nish-field label="Stack size" hint="Up to 64 items.">
    <input class="nish-input" type="number" value="16">
  </nish-field>
  <nish-field label="Nickname" optional error="Nicknames need at least 3 letters.">
    <input class="nish-input" value="ab">
  </nish-field>
  <nish-field label="Server" layout="inline" label-width="6rem">
    <select class="nish-select"><option>Survival</option><option>Creative</option></select>
  </nish-field>
</div>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-forms.js"></script>`,
  },
  stories: [
    { id: 'default', name: 'Default', render: () => <div className="w-full max-w-sm"><Field label="Company"><Input defaultValue="Anthropic" /></Field></div> },
    { id: 'hint', name: 'With a hint', render: () => <div className="w-full max-w-sm"><Field label="Target salary" hint="Yearly, before tax."><Input inputMode="numeric" defaultValue="180000" /></Field></div> },
    { id: 'error', name: 'With an error', render: () => <div className="w-full max-w-sm"><Field label="Max price" error="Enter a number above 0."><Input defaultValue="-4" /></Field></div> },
    { id: 'optional', name: 'Optional', render: () => <div className="w-full max-w-sm"><Field label="Notes" optional><Textarea rows={3} /></Field></div> },
    {
      id: 'inline',
      name: 'Inline layout',
      note: 'For settings panels and filters: a small label column.',
      render: () => (
        <div className="grid w-full max-w-sm gap-2">
          <Field label="Interval" layout="inline">
            <Select defaultValue="5">
              <option value="1">Every minute</option>
              <option value="5">Every 5 minutes</option>
            </Select>
          </Field>
          <Field label="Max rows" layout="inline" hint="0 shows everything.">
            <Input inputMode="numeric" defaultValue="50" />
          </Field>
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a form card',
      wide: true,
      render: () => (
        <Card className="w-full max-w-md">
          <div className="grid gap-4">
            <Field label="Job title">
              <Input defaultValue="Staff engineer" />
            </Field>
            <Field label="Location" hint="City, or Remote.">
              <Input defaultValue="Austin, TX" />
            </Field>
            <Field label="Cover letter" optional>
              <Textarea rows={3} />
            </Field>
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { Field, Input } from '@nish/ui';

<Field label="Max price" hint="In dollars." error={err}>
  <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
</Field>`,
  guidelines: [
    'One control per Field.',
    'Labels are sentence case. The uppercase Label component is for section and card labels, not form fields.',
    'Write errors as the fix ("Enter a number above 0"), not the fault ("Invalid").',
    'Field reuses an id the control already has; pass htmlFor only when the control is not its direct child.',
    "required adds required and aria-required to the control and a \"*\" after the label (hidden from screen readers). It replaces the Optional tag.",
    "Field wires id, aria-describedby, aria-invalid and aria-required into any single child: Input, Select, Textarea, SearchInput, Checkbox, Switch, Combobox and Segmented. Wrap exactly one element; a <div> around the control drops the wiring.",
    "The Optional tag text comes from NishProvider strings (optional).",
  ],
};
