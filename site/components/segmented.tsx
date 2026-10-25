import { useState } from 'react';
import { Segmented } from '../../src';
import type { ComponentDoc } from './types';

// --- Segmented ----------------------------------------------------------------------

function RangeDemo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  return (
    <Segmented
      label="Chart range"
      size={size}
      value={range}
      onChange={setRange}
      options={[
        { value: '24h', label: '24h' },
        { value: '7d', label: '7d' },
        { value: '30d', label: '30d' },
      ]}
    />
  );
}

export const segmented: ComponentDoc = {
  id: 'segmented',
  name: 'Segmented',
  exports: ['Segmented'],
  summary:
    'Two to five mutually exclusive choices side by side, such as a chart range. The selected option takes the accent tint and ring, so it reads at a glance in every theme. Arrow keys move the choice.',
  importLine: "import { Segmented } from '@nish/ui';",
  controls: [{ key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] }],
  initial: { size: 'sm' },
  render: (a) => <RangeDemo size={a.size === 'md' ? 'md' : 'sm'} />,
  code: (a) =>
    `<Segmented\n  label="Chart range"${a.size === 'md' ? "\n  size=\"md\"" : ''}\n  value={range}\n  onChange={setRange}\n  options={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }]}\n/>`,
  api: { functions: [], interfaces: ['SegmentedProps', 'SegmentedOption'] },
  stories: [
    { id: 'range', name: 'Chart range', render: () => <RangeDemo /> },
    { id: 'md', name: 'Medium', render: () => <RangeDemo size="md" /> },
    {
      id: 'card-header',
      name: 'In a card header',
      wide: true,
      render: () => (
        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-th-line bg-th-surface px-4 py-2.5">
          <p className="font-semibold text-th-hi">Response time</p>
          <RangeDemo />
        </div>
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
    'Always pass label: it names the group for screen readers.',
    'Icon-only options need ariaLabel.',
  ],
};
