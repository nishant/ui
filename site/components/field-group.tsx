import { useState } from 'react';
import { Button, Card, Checkbox, Chip, ChipGroup, Field, FieldGroup, Input } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- FieldGroup ------------------------------------------------------------------------

const MODES = ['Remote', 'Hybrid', 'On-site'];

function WorkMode({ error }: { error?: boolean }) {
  const [on, setOn] = useState<string[]>(error ? [] : ['Remote']);
  const flip = (m: string) => setOn((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m]));
  return (
    <FieldGroup
      label="Work mode"
      hint="Pick every mode you would take."
      error={error && on.length === 0 ? 'Pick at least one work mode.' : undefined}
    >
      <ChipGroup label="Work mode">
        {MODES.map((m) => (
          <Chip key={m} pressed={on.includes(m)} onClick={() => flip(m)}>
            {m}
          </Chip>
        ))}
      </ChipGroup>
    </FieldGroup>
  );
}

function Location() {
  return (
    <FieldGroup label="Preferred locations" optional hint="City and state, one at a time.">
      <div className="flex flex-wrap gap-2">
        <Input aria-label="City" placeholder="City" className="min-w-0 flex-1 basis-40" />
        <Input aria-label="State" placeholder="State" className="w-24" />
        <Button>Add</Button>
      </div>
    </FieldGroup>
  );
}

export const fieldGroup: ComponentDoc = {
  id: 'field-group',
  name: 'FieldGroup',
  exports: ['FieldGroup'],
  summary:
    'Field for a group of controls: a <fieldset> whose <legend> reads like Field\'s label, with the hint or error tied to the whole group. For chips, a city and state pair, or a column of checkboxes, where Field (one label, one control) cannot label them.',
  importLine: "import { FieldGroup } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'hint', label: 'Hint', type: 'boolean' },
    { key: 'error', label: 'Error', type: 'boolean' },
    { key: 'optional', label: 'Optional', type: 'boolean' },
  ],
  initial: { label: 'Employment type', hint: true, error: false, optional: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <FieldGroup
        label={String(a.label)}
        hint={a.hint ? 'Pick every type you would take.' : undefined}
        error={a.error ? 'Pick at least one type.' : undefined}
        optional={!!a.optional}
      >
        <div className="grid gap-1">
          <Checkbox label="Full time" defaultChecked />
          <Checkbox label="Contract" />
          <Checkbox label="Part time" />
        </div>
      </FieldGroup>
    </div>
  ),
  code: (a) =>
    jsx(
      'FieldGroup',
      {
        label: a.label,
        hint: a.hint ? 'Pick every type you would take.' : undefined,
        error: a.error ? 'Pick at least one type.' : undefined,
        optional: a.optional,
      },
      '<Checkbox label="Full time" … />',
    ),
  stories: [
    { id: 'chips', name: 'A ChipGroup', render: () => <div className="w-full max-w-sm"><WorkMode /></div> },
    { id: 'error', name: 'With an error', note: 'The error is role="alert" and tied to the fieldset.', render: () => <div className="w-full max-w-sm"><WorkMode error /></div> },
    { id: 'pair', name: 'Two inputs and a button', render: () => <div className="w-full max-w-sm"><Location /></div> },
    {
      id: 'card',
      name: 'Next to Fields, in a card',
      wide: true,
      render: () => (
        <Card className="grid w-full max-w-lg gap-4">
          <Field label="Target title">
            <Input defaultValue="Staff engineer" />
          </Field>
          <WorkMode />
          <Location />
        </Card>
      ),
    },
  ],
  usage: `import { Chip, ChipGroup, FieldGroup } from '@nish/ui';

<FieldGroup label="Work mode" hint="Pick every mode you would take." error={err}>
  <ChipGroup label="Work mode">
    {MODES.map((m) => <Chip key={m} pressed={on.includes(m)} onClick={() => toggle(m)}>{m}</Chip>)}
  </ChipGroup>
</FieldGroup>`,
  guidelines: [
    'Use Field for one control and FieldGroup for several. The legend names the group; each control still needs its own name (a ChipGroup label, an aria-label on each input).',
    'Static pages: a <fieldset class="nish-field"> with <legend class="nish-field-label"> gives the same look.',
  ],
};
