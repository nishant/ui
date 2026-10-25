import { useState } from 'react';
import { Card, Segmented } from '../../src';
import type { ComponentDoc } from './types';

// --- Segmented ----------------------------------------------------------------------

type Range = '24h' | '7d' | '30d' | '1y';

function RangeDemo({ size = 'sm', block, withDisabled }: { size?: 'xs' | 'sm' | 'md'; block?: boolean; withDisabled?: boolean }) {
  const [range, setRange] = useState<Range>('7d');
  return (
    <Segmented
      label="Chart range"
      size={size}
      block={block}
      value={range}
      onChange={setRange}
      options={[
        { value: '24h', label: '24h' },
        { value: '7d', label: '7d' },
        { value: '30d', label: '30d' },
        ...(withDisabled ? [{ value: '1y' as const, label: '1y', disabled: true }] : []),
      ]}
    />
  );
}

export const segmented: ComponentDoc = {
  id: 'segmented',
  name: 'Segmented',
  exports: ['Segmented'],
  summary:
    'Two to five mutually exclusive choices side by side, such as a chart range: a radio group. The selected option takes the accent tint and ring, so it reads at a glance in every theme. Arrow keys, Home and End move the choice.',
  importLine: "import { Segmented } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'xs'] },
    { key: 'block', label: 'Block', type: 'boolean' },
    { key: 'disabled', label: 'Disabled option', type: 'boolean' },
  ],
  initial: { size: 'sm', block: false, disabled: false },
  render: (a) => (
    <div className={a.block ? 'w-full max-w-sm' : undefined}>
      <RangeDemo size={a.size as 'xs' | 'sm' | 'md'} block={!!a.block} withDisabled={!!a.disabled} />
    </div>
  ),
  code: (a) =>
    `<Segmented\n  label="Chart range"${a.size !== 'sm' ? `\n  size="${a.size}"` : ''}${a.block ? '\n  block' : ''}\n  value={range}\n  onChange={setRange}\n  options={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }${a.disabled ? ", { value: '1y', label: '1y', disabled: true }" : ''}]}\n/>`,
  api: { functions: [], interfaces: ['SegmentedProps', 'SegmentedOption'] },
  stories: [
    { id: 'range', name: 'Chart range', render: () => <RangeDemo /> },
    { id: 'md', name: 'Medium', render: () => <RangeDemo size="md" /> },
    { id: 'xs', name: 'Extra small', note: 'Dense widget headers.', render: () => <RangeDemo size="xs" /> },
    { id: 'disabled', name: 'A disabled option', note: 'Arrow keys skip it.', render: () => <RangeDemo withDisabled /> },
    { id: 'block', name: 'Block', wide: true, render: () => <div className="w-full max-w-md"><RangeDemo block /></div> },
    {
      id: 'card-header',
      name: 'In a card header',
      wide: true,
      render: () => (
        <Card className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-th-hi">Response time</p>
          <RangeDemo />
        </Card>
      ),
    },
  ],
  usage: `import { useState } from 'react';
import { Segmented } from '@nish/ui';

const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');

<Segmented
  label="Chart range"
  value={range}
  onChange={setRange}
  options={[
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ]}
/>`,
  guidelines: [
    'Use it for 2 to 5 short, mutually exclusive options that change a view. For more, or for long labels, use Select.',
    'It is a single-choice radio group. Multi-select toggles are ChipGroup and Chip.',
    'Always pass label: it names the group for screen readers.',
    'Icon-only options need ariaLabel (and a title for mouse users).',
  ],
};
