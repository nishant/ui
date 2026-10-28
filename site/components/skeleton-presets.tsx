import { CardListSkeleton, SkeletonCard, StatGridSkeleton } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SkeletonCard, StatGridSkeleton, CardListSkeleton ---------------------------------------

type Media = 'none' | 'square' | 'wide';

export const skeletonPresets: ComponentDoc = {
  id: 'skeleton-presets',
  name: 'Skeleton presets',
  exports: ['SkeletonCard', 'StatGridSkeleton', 'CardListSkeleton'],
  summary:
    'Loading shapes that match the components they stand in for: one card with optional media, a grid of stat tiles, and a stack of cards. The same size as the real thing, so nothing jumps when data arrives. Static under reduced motion.',
  importLine: "import { SkeletonCard, StatGridSkeleton, CardListSkeleton } from '@nish/ui';",
  controls: [
    { key: 'kind', label: 'Preset', type: 'select', options: ['SkeletonCard', 'StatGridSkeleton', 'CardListSkeleton'] },
    { key: 'count', label: 'Count', type: 'number', min: 1, max: 8 },
    { key: 'lines', label: 'Lines', type: 'number', min: 1, max: 6 },
    { key: 'media', label: 'Media (SkeletonCard)', type: 'select', options: ['none', 'square', 'wide'] },
  ],
  initial: { kind: 'SkeletonCard', count: 4, lines: 3, media: 'none' },
  render: (a) => (
    <div className="w-full max-w-md">
      {a.kind === 'StatGridSkeleton' ? (
        <StatGridSkeleton count={Number(a.count)} />
      ) : a.kind === 'CardListSkeleton' ? (
        <CardListSkeleton count={Number(a.count)} lines={Number(a.lines)} />
      ) : (
        <SkeletonCard lines={Number(a.lines)} media={a.media as Media} />
      )}
    </div>
  ),
  code: (a) =>
    a.kind === 'StatGridSkeleton'
      ? jsx('StatGridSkeleton', { count: Number(a.count) === 4 ? undefined : Number(a.count) })
      : a.kind === 'CardListSkeleton'
        ? jsx('CardListSkeleton', { count: Number(a.count) === 3 ? undefined : Number(a.count), lines: Number(a.lines) === 2 ? undefined : Number(a.lines) })
        : jsx('SkeletonCard', { lines: Number(a.lines) === 3 ? undefined : Number(a.lines), media: a.media === 'none' ? undefined : a.media }),
  stories: [
    { id: 'card', name: 'SkeletonCard', render: () => <div className="w-full"><SkeletonCard /></div> },
    {
      id: 'card-media',
      name: 'SkeletonCard with media',
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <SkeletonCard media="square" lines={2} />
          <SkeletonCard media="wide" lines={2} />
        </div>
      ),
    },
    { id: 'stats', name: 'StatGridSkeleton', wide: true, render: () => <div className="w-full"><StatGridSkeleton /></div> },
    { id: 'list', name: 'CardListSkeleton', render: () => <div className="w-full"><CardListSkeleton count={3} lines={2} /></div> },
  ],
  usage: `import { CardListSkeleton, StatGridSkeleton } from '@nish/ui';

if (stats.isPending) return <StatGridSkeleton count={4} />;
if (trips.isPending) return <CardListSkeleton count={3} lines={2} />;`,
  guidelines: [
    'StatGridSkeleton uses the same 2-column, then 4-column grid as StatGrid; use the same count as your real stats.',
    'CardListSkeleton and StatGridSkeleton announce "Loading" once (role="status"); SkeletonCard is decorative, so wrap a group of them yourself.',
    'Use AsyncPanel to swap a skeleton for content, errors and empty states in one place.',
    'For text-only loading inside a card, SkeletonLines is the right size.',
  ],
};
