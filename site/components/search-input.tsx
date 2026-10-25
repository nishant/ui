import { useState } from 'react';
import { Card } from '../../src';
import { SearchInput } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SearchInput ---------------------------------------------------------------------

function Demo({ initial = '', size, variant, placeholder = 'Search jobs', disabled }: { initial?: string; size?: 'xs' | 'sm' | 'md'; variant?: 'field' | 'bare'; placeholder?: string; disabled?: boolean }) {
  const [q, setQ] = useState(initial);
  return <SearchInput value={q} onChange={setQ} size={size} variant={variant} placeholder={placeholder} aria-label={placeholder} disabled={disabled} />;
}

export const searchInput: ComponentDoc = {
  id: 'search-input',
  name: 'SearchInput',
  exports: ['SearchInput'],
  summary:
    'A search field with a leading search icon and a Clear button while it has a value. Escape clears it. type="search" with the Search key on phone keyboards.',
  importLine: "import { SearchInput } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm', 'xs'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['field', 'bare'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { size: 'md', variant: 'field', disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Demo initial="react" size={a.size as 'xs' | 'sm' | 'md'} variant={a.variant === 'bare' ? 'bare' : 'field'} disabled={!!a.disabled} />
    </div>
  ),
  code: (a) =>
    jsx('SearchInput', {
      value: '{q}',
      onChange: '{setQ}',
      size: a.size === 'md' ? undefined : a.size,
      variant: a.variant === 'field' ? undefined : a.variant,
      disabled: a.disabled,
      'aria-label': 'Search jobs',
    }),
  stories: [
    { id: 'default', name: 'Empty', render: () => <div className="w-full max-w-sm"><Demo /></div> },
    { id: 'value', name: 'With a value', note: 'Clear search appears; Escape clears too.', render: () => <div className="w-full max-w-sm"><Demo initial="staff engineer" /></div> },
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <div className="grid w-full max-w-sm gap-2">
          <Demo size="md" initial="md" />
          <Demo size="sm" initial="sm" />
          <Demo size="xs" initial="xs" />
        </div>
      ),
    },
    { id: 'disabled', name: 'Disabled', render: () => <div className="w-full max-w-sm"><Demo disabled placeholder="Search while offline" /></div> },
    {
      id: 'bare',
      name: 'Bare, in a header',
      wide: true,
      render: () => (
        <div className="flex w-full items-center gap-2 rounded-lg border border-th-line bg-th-surface px-2">
          <Demo variant="bare" placeholder="Search widgets" />
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a card toolbar',
      wide: true,
      render: () => (
        <Card className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-th-hi">Watchlist</p>
            <div className="w-full sm:w-64">
              <Demo size="sm" placeholder="Filter symbols" />
            </div>
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { SearchInput } from '@nish/ui';

const [q, setQ] = useState('');

<SearchInput value={q} onChange={setQ} aria-label="Search jobs" placeholder="Search jobs" />`,
  guidelines: [
    'Give it a name: a visible label through Field, or aria-label.',
    'onChange receives the new string (also on Clear and Escape), not the event.',
    'Escape clears a non-empty field and stops there; a second Escape reaches the dialog behind it.',
  ],
};
