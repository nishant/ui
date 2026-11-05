import { useEffect, useRef, useState } from 'react';
import { MultiSelect } from '../../src/components/multi-select';
import type { ComboboxOption } from '../../src/components/combobox';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- MultiSelect --------------------------------------------------------------------

const STATES: ComboboxOption[] = [
  ['TX', 'Texas'],
  ['CA', 'California'],
  ['NY', 'New York'],
  ['FL', 'Florida'],
  ['WA', 'Washington'],
  ['OR', 'Oregon'],
  ['CO', 'Colorado'],
  ['AZ', 'Arizona'],
  ['GA', 'Georgia'],
  ['IL', 'Illinois'],
  ['OH', 'Ohio'],
  ['UT', 'Utah'],
].map(([value, label]) => ({ value, label }));

function Playground({ size, maxSelected, disabled }: { size: 'sm' | 'md'; maxSelected?: number; disabled: boolean }) {
  const [value, setValue] = useState<string[]>(['TX']);
  return (
    <div className="w-full max-w-sm pb-64">
      <MultiSelect
        aria-label="States"
        options={STATES}
        value={value}
        onValueChange={setValue}
        placeholder="Search states"
        size={size}
        maxSelected={maxSelected}
        disabled={disabled}
      />
    </div>
  );
}

/** A fake server: filters the states after a short delay. */
function AsyncPicker() {
  const [value, setValue] = useState<string[]>([]);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function search(q: string) {
    window.clearTimeout(timer.current);
    if (!q.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      const n = q.trim().toLowerCase();
      setOptions(STATES.filter((s) => s.label.toLowerCase().includes(n)));
      setLoading(false);
    }, 400);
  }

  return (
    <div className="w-full max-w-sm pb-64">
      <MultiSelect
        aria-label="States"
        options={options}
        value={value}
        onValueChange={setValue}
        onQueryChange={search}
        loading={loading}
        emptyText="No states found"
        placeholder="Type to search"
      />
    </div>
  );
}

export const multiSelect: ComponentDoc = {
  id: 'multi-select',
  name: 'MultiSelect',
  exports: ['MultiSelect'],
  summary:
    'Pick several options from a list you can filter. Picked options show as removable tags; the list stays open so you can keep picking.',
  importLine: "import { MultiSelect } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'maxSelected', label: 'Max selected', type: 'number', min: 1, max: 6 },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { size: 'md', maxSelected: 6, disabled: false },
  render: (a) => <Playground size={a.size as 'md'} maxSelected={Number(a.maxSelected)} disabled={!!a.disabled} />,
  code: (a) =>
    jsx('MultiSelect', {
      'aria-label': 'States',
      options: '{states}',
      value: '{picked}',
      onValueChange: '{setPicked}',
      maxSelected: a.maxSelected === 6 ? undefined : a.maxSelected,
      size: a.size === 'md' ? undefined : a.size,
      disabled: a.disabled,
    }),
  stories: [
    {
      id: 'basic',
      name: 'Basic',
      note: 'Click the box or press the down arrow to open the list. Enter or click adds or removes the active option.',
      render: () => (
        <div className="w-full max-w-sm pb-64">
          <MultiSelect aria-label="States" options={STATES} placeholder="Search states" />
        </div>
      ),
    },
    {
      id: 'preset',
      name: 'With values',
      render: () => (
        <div className="w-full max-w-sm">
          <MultiSelect aria-label="Visited states" options={STATES} defaultValue={['TX', 'WA']} />
        </div>
      ),
    },
    {
      id: 'limit',
      name: 'At most three',
      note: 'After three picks the other options turn unavailable and the limit is announced.',
      render: () => (
        <div className="w-full max-w-sm pb-64">
          <MultiSelect aria-label="Favorite states" options={STATES} maxSelected={3} defaultValue={['CO', 'UT']} />
        </div>
      ),
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-sm">
          <Field label="States you have visited" hint="Pick as many as you like.">
            <MultiSelect id="doc-ms-field" options={STATES} placeholder="Search states" />
          </Field>
        </div>
      ),
    },
    {
      id: 'async',
      name: 'Server search',
      note: 'onQueryChange is debounced 200ms. Picked options keep their labels when the results change.',
      render: () => <AsyncPicker />,
    },
  ],
  usage: `import { MultiSelect, type ComboboxOption } from '@nish/ui';

const states: ComboboxOption[] = [
  { value: 'TX', label: 'Texas' },
  { value: 'WA', label: 'Washington' },
];

<MultiSelect aria-label="States" name="states" options={states} value={picked} onValueChange={setPicked} />

// At most three picks
<MultiSelect aria-label="States" options={states} maxSelected={3} />

// Server-side search
<MultiSelect
  aria-label="States"
  options={results}
  value={picked}
  onValueChange={setPicked}
  onQueryChange={search}
  loading={pending}
/>`,
  guidelines: [
    'Use MultiSelect for picking several items from a long or searchable list; for up to about six visible choices use Chip toggles or Checkboxes.',
    'Enter and click add or remove the active option and keep the list open; Escape closes it; Backspace in an empty box removes the last pick.',
    'Values keep the order they were picked in, and each posts as its own form value.',
    'Set maxSelected to cap the picks; the remaining options turn unavailable and the limit is announced.',
  ],
};
