import { useState } from 'react';
import { AsyncPanel, Button, Card, ListRow, Segmented } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- AsyncPanel -----------------------------------------------------------------------------

type Status = 'loading' | 'error' | 'empty' | 'ready';

function Panel({ status, custom = false }: { status: Status; custom?: boolean }) {
  return (
    <Card className="w-full" title="Recent trips" description="Synced from your calendar">
      <AsyncPanel
        status={status}
        skeleton={custom ? <p className="py-6 text-center text-sm text-th-hi3">Fetching trips…</p> : undefined}
        error={{ message: 'The trips service did not answer.', onRetry: () => undefined }}
        empty={{ title: 'No trips yet', description: 'Plan one and it shows up here.', action: <Button size="sm">Plan a trip</Button> }}
      >
        <ul className="m-0 list-none p-0">
          <ListRow title="Lisbon" subtitle="Mar 12 – 16" meta="In 4 months" />
          <ListRow title="Austin" subtitle="Nov 3 – 5" meta="In 6 days" />
        </ul>
      </AsyncPanel>
    </Card>
  );
}

function Switcher() {
  const [status, setStatus] = useState<Status>('loading');
  return (
    <div className="grid w-full gap-3">
      <Segmented
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'loading', label: 'Loading' },
          { value: 'error', label: 'Error' },
          { value: 'empty', label: 'Empty' },
          { value: 'ready', label: 'Ready' },
        ]}
      />
      <Panel status={status} />
    </div>
  );
}

export const asyncPanel: ComponentDoc = {
  id: 'async-panel',
  name: 'AsyncPanel',
  exports: ['AsyncPanel'],
  summary:
    'Loading, error, empty and ready from one status value: a skeleton while it loads (announced as busy), an ErrorState with Retry, an EmptyState with an action, or your content. Stops every data section from writing the same four-way ternary.',
  importLine: "import { AsyncPanel } from '@nish/ui';",
  controls: [
    { key: 'status', label: 'Status', type: 'select', options: ['loading', 'error', 'empty', 'ready'] },
    { key: 'custom', label: 'Custom skeleton', type: 'boolean' },
  ],
  initial: { status: 'loading', custom: false },
  render: (a) => <Panel status={a.status as Status} custom={!!a.custom} />,
  code: (a) =>
    jsx(
      'AsyncPanel',
      {
        status: '{status}',
        skeleton: a.custom ? '{<TripsSkeleton />}' : undefined,
        error: "{{ message: error?.message ?? 'Could not load', onRetry: refetch }}",
        empty: "{{ title: 'No trips yet', action: <Button>Plan a trip</Button> }}",
      },
      '\n  <TripList trips={data} />\n',
    ),
  stories: [
    { id: 'switch', name: 'All four states', note: 'Switch between them.', render: () => <Switcher /> },
    { id: 'loading', name: 'Loading', render: () => <Panel status="loading" /> },
    { id: 'error', name: 'Error with Retry', render: () => <Panel status="error" /> },
    { id: 'empty', name: 'Empty with an action', render: () => <Panel status="empty" /> },
  ],
  usage: `import { AsyncPanel } from '@nish/ui';

const status = query.isPending ? 'loading' : query.isError ? 'error' : query.data.length ? 'ready' : 'empty';

<AsyncPanel
  status={status}
  skeleton={<CardListSkeleton count={3} />}
  error={{ message: query.error?.message ?? 'Could not load trips', onRetry: query.refetch }}
  empty={{ title: 'No trips yet', action: <Button onClick={plan}>Plan a trip</Button> }}
>
  <TripList trips={query.data} />
</AsyncPanel>`,
  guidelines: [
    'Pass a skeleton that matches the content: StatGridSkeleton for stats, CardListSkeleton for cards. The default is SkeletonRows.',
    'Compute status once, with empty checked after ready data exists, so the empty state never flashes during a load.',
    'The error body says what failed and offers Retry; do not hide the previous data behind it if you still have some.',
    'It renders no card of its own: wrap it in Card or put it in a page section.',
  ],
};
