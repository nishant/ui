import { Card, Skeleton, SkeletonLines } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Skeleton -----------------------------------------------------------------------

export const skeleton: ComponentDoc = {
  id: 'skeleton',
  name: 'Skeleton',
  exports: ['Skeleton', 'SkeletonLines'],
  summary: 'Shimmer placeholders for content that is loading. Skeleton is one block you size; SkeletonLines is a ready-made card body.',
  importLine: "import { Skeleton, SkeletonLines } from '@nish/ui';",
  controls: [
    { key: 'kind', label: 'Kind', type: 'select', options: ['lines', 'block', 'list'] },
    { key: 'lines', label: 'Lines', type: 'number', min: 1, max: 8 },
  ],
  initial: { kind: 'lines', lines: 3 },
  render: (a) =>
    a.kind === 'block' ? (
      <Skeleton className="h-32 w-full max-w-md rounded-xl" />
    ) : a.kind === 'list' ? (
      <div className="w-full max-w-md space-y-3">
        {Array.from({ length: Number(a.lines) }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <Card padded={false} className="w-full max-w-md">
        <SkeletonLines lines={Number(a.lines)} />
      </Card>
    ),
  code: (a) =>
    a.kind === 'block'
      ? '<Skeleton className="h-32 w-full rounded-xl" />'
      : a.kind === 'list'
        ? '<div className="flex items-center gap-3">\n  <Skeleton className="size-9 rounded-full" />\n  <Skeleton className="h-3.5 w-2/5" />\n</div>'
        : jsx('SkeletonLines', { lines: a.lines === 3 ? undefined : Number(a.lines) }),
  stories: [
    {
      id: 'lines',
      name: 'SkeletonLines in a card',
      render: () => (
        <Card padded={false} className="w-full">
          <SkeletonLines />
        </Card>
      ),
    },
    {
      id: 'chart',
      name: 'Chart placeholder',
      render: () => (
        <Card className="w-full space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </Card>
      ),
    },
    {
      id: 'rows',
      name: 'Table rows',
      wide: true,
      render: () => (
        <Card padded={false} className="w-full divide-y divide-th-line">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
        </Card>
      ),
    },
  ],
  usage: `import { Card, SkeletonLines } from '@nish/ui';

<Card padded={false}>
  {isLoading ? <SkeletonLines lines={4} /> : <JobList jobs={data} />}
</Card>`,
  guidelines: [
    'For a list or a page of cards, SkeletonRows draws full-width rounded rows and announces itself once.',
    'Match the shape of what is coming, so the page does not jump when it arrives.',
    'The shimmer stops under prefers-reduced-motion; the blocks stay.',
    'SkeletonLines sets aria-busy and an aria-label of "Loading"; a bare Skeleton is hidden from screen readers.',
  ],
};
