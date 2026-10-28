import { useState, type ComponentProps } from 'react';
import { Chip, ScrollRow } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ScrollRow ------------------------------------------------------------------------------

const TAGS = ['All', 'Flights', 'Hotels', 'Cars', 'Trains', 'Cruises', 'Activities', 'Restaurants', 'Insurance', 'Visas'];

function Chips({ initial = 'Hotels', ...rest }: { initial?: string } & Omit<ComponentProps<typeof ScrollRow>, 'children'>) {
  const [sel, setSel] = useState(initial);
  return (
    <div className="w-full min-w-0">
      <ScrollRow {...rest}>
        {TAGS.map((t) => (
          <Chip key={t} pressed={sel === t} onClick={() => setSel(t)} className="shrink-0">
            {t}
          </Chip>
        ))}
      </ScrollRow>
    </div>
  );
}

export const scrollRow: ComponentDoc = {
  id: 'scroll-row',
  name: 'ScrollRow',
  exports: ['ScrollRow'],
  summary:
    'One horizontally scrolling row (filter chips, tabs, tags) with no scrollbar and soft fades on the edges that have more. The pressed, selected or current child is scrolled into view when it changes, without ever moving the page.',
  importLine: "import { ScrollRow } from '@nish/ui';",
  controls: [
    { key: 'fade', label: 'Edge fades', type: 'boolean' },
    { key: 'snap', label: 'Snap', type: 'boolean' },
    { key: 'initial', label: 'Pressed chip', type: 'select', options: TAGS },
  ],
  initial: { fade: true, snap: false, initial: 'Cruises' },
  render: (a) => <Chips key={String(a.initial)} fade={!!a.fade} snap={!!a.snap} initial={String(a.initial)} label="Categories" />,
  code: (a) =>
    jsx(
      'ScrollRow',
      { label: 'Categories', fade: a.fade ? undefined : '{false}', snap: a.snap ? true : undefined },
      '\n  {tags.map((t) => <Chip key={t} pressed={t === tag} onClick={() => setTag(t)}>{t}</Chip>)}\n',
    ),
  stories: [
    { id: 'chips', name: 'Chips', note: 'Narrow the window: the row scrolls instead of wrapping.', render: () => <Chips initial="Visas" label="Categories" /> },
    { id: 'nofade', name: 'No fades', render: () => <Chips fade={false} label="Categories" /> },
    {
      id: 'bleed',
      name: 'Bleed to the screen edges',
      note: 'Inside a page with the shared gutter, bleed lets the row run edge to edge while its first chip still lines up with the content.',
      render: () => (
        <div className="w-full overflow-hidden rounded-lg border border-th-line py-3">
          <div className="px-[var(--nish-page-gutter)] pb-2 text-sm text-th-hi3">Page content</div>
          <Chips bleed label="Categories" initial="Hotels" />
        </div>
      ),
    },
    { id: 'snap', name: 'Snap to chips', render: () => <Chips snap label="Categories" initial="Cars" /> },
  ],
  usage: `import { Chip, ScrollRow } from '@nish/ui';

<ScrollRow label="Categories" bleed>
  {tags.map((t) => (
    <Chip key={t} pressed={t === tag} onClick={() => setTag(t)}>{t}</Chip>
  ))}
</ScrollRow>`,
  guidelines: [
    'Children must not shrink: give chips shrink-0 so the row overflows instead of squeezing labels.',
    'Mark the current child with aria-pressed, aria-selected or aria-current; ScrollRow brings it into view.',
    'Segmented and Tabs already scroll with fades. Use ScrollRow for your own chip rows, filter bars and link lists.',
    'as="ul" or as="nav" gives the row the right landmark; pass label to name it.',
  ],
};
