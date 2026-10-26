import { Card, SkeletonRows } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SkeletonRows --------------------------------------------------------------------------

export const skeletonRows: ComponentDoc = {
  id: 'skeleton-rows',
  name: 'SkeletonRows',
  exports: ['SkeletonRows'],
  summary:
    'A column of full-width, card-shaped shimmer rows while a list or a page of cards loads, announced once as "Loading". For a card body\'s text lines, use SkeletonLines.',
  importLine: "import { SkeletonRows } from '@nish/ui';",
  controls: [
    { key: 'rows', label: 'Rows', type: 'number', min: 1, max: 8 },
    { key: 'height', label: 'Height (px)', type: 'number', min: 24, max: 120 },
    { key: 'gap', label: 'Gap', type: 'select', options: ['md', 'sm'] },
  ],
  initial: { rows: 4, height: 56, gap: 'md' },
  render: (a) => (
    <div className="w-full max-w-md">
      <SkeletonRows rows={Number(a.rows)} height={Number(a.height)} gap={a.gap === 'sm' ? 'sm' : 'md'} />
    </div>
  ),
  code: (a) =>
    jsx('SkeletonRows', {
      rows: Number(a.rows) === 5 ? undefined : Number(a.rows),
      height: Number(a.height) === 56 ? undefined : Number(a.height),
      gap: a.gap === 'md' ? undefined : a.gap,
    }),
  stories: [
    { id: 'default', name: 'Default (5 rows, 56px)', render: () => <div className="w-full"><SkeletonRows /></div> },
    { id: 'cards', name: 'Card-sized blocks', note: 'rowClassName="h-16" sizes every row with a class.', render: () => <div className="w-full"><SkeletonRows rows={3} rowClassName="h-16" /></div> },
    { id: 'dense', name: 'Dense list', render: () => <div className="w-full"><SkeletonRows rows={6} height={32} gap="sm" label="Loading trips" /></div> },
    {
      id: 'card',
      name: 'Inside a card',
      wide: true,
      render: () => (
        <Card className="w-full" title="Price watch" description="Loading your items">
          <SkeletonRows rows={3} height={44} gap="sm" label="Loading items" />
        </Card>
      ),
    },
  ],
  usage: `import { SkeletonRows } from '@nish/ui';

if (query.isPending) return <SkeletonRows rows={5} label="Loading flights" />;`,
  guidelines: [
    'Match the rows to what will replace them: the row count you expect and the height of one row.',
    'Give it a label that says what is loading when a page has more than one loading region.',
    'The shimmer stops under reduced motion, like every Skeleton.',
  ],
};
