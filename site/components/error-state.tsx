import { Card, ErrorState, toast } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ErrorState ---------------------------------------------------------------------

export const errorState: ComponentDoc = {
  id: 'error-state',
  name: 'ErrorState',
  exports: ['ErrorState'],
  summary: 'A failed load with an optional Retry. It is a live region (role="alert"), so screen readers announce it when it appears.',
  importLine: "import { ErrorState } from '@nish/ui';",
  controls: [
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'retry', label: 'onRetry', type: 'boolean' },
    { key: 'retrying', label: 'Retrying', type: 'boolean' },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { message: 'Could not reach the API. Check that the server is running.', retry: true, retrying: false, compact: false },
  render: (a) => (
    <div className="w-full max-w-lg">
      <ErrorState message={String(a.message)} onRetry={a.retry ? () => toast.info('Retrying') : undefined} retrying={!!a.retrying} compact={!!a.compact} />
    </div>
  ),
  code: (a) =>
    jsx('ErrorState', {
      message: String(a.message),
      onRetry: a.retry ? '{refetch}' : undefined,
      retrying: a.retrying ? '{isFetching}' : undefined,
      compact: a.compact,
    }),
  stories: [
    { id: 'default', name: 'Default message', render: () => <ErrorState className="w-full" /> },
    {
      id: 'retry',
      name: 'With Retry',
      render: () => <ErrorState className="w-full" message="Could not load positions. The broker API returned 503." onRetry={() => undefined} />,
    },
    {
      id: 'retrying',
      name: 'Retrying',
      render: () => <ErrorState className="w-full" message="Could not load positions. The broker API returned 503." onRetry={() => undefined} retrying />,
    },
    {
      id: 'compact',
      name: 'Compact, in a widget',
      render: () => (
        <Card padded={false} className="h-40 w-full">
          <ErrorState compact message="Weather is unavailable right now." onRetry={() => undefined} />
        </Card>
      ),
    },
  ],
  usage: `import { ErrorState, SkeletonLines } from '@nish/ui';

if (query.isLoading) return <SkeletonLines />;
if (query.isError)
  return (
    <ErrorState
      message={\`Could not load positions: \${query.error.message}\`}
      onRetry={() => query.refetch()}
      retrying={query.isFetching}
    />
  );`,
  guidelines: [
    'Say what failed and, when you know, what to do. "Failed to load" is the fallback, not the goal.',
    'Pass onRetry whenever trying again can help; pass retrying so the button shows progress.',
  ],
};
