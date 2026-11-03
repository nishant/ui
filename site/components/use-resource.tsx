import { useEffect, useRef, useState } from 'react';
import { ApiError, Button, ErrorState, RelativeTime, Skeleton, useResource } from '../../src';
import type { ComponentDoc } from './types';

// --- useResource ----------------------------------------------------------------------------

interface Quote {
  symbol: string;
  price: number;
}

function ResourceDemo({ intervalMs, mode = 'normal' }: { intervalMs?: number; mode?: 'normal' | 'loading' | 'error' }) {
  const [fail, setFail] = useState(mode === 'error');
  const failRef = useRef(fail);
  useEffect(() => {
    failRef.current = fail;
  }, [fail]);
  const calls = useRef(0);

  const res = useResource<Quote>(
    'demo/quote',
    (signal) =>
      new Promise<Quote>((resolve, reject) => {
        const n = ++calls.current;
        if (mode === 'loading') {
          signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          return;
        }
        const id = setTimeout(() => {
          if (failRef.current) reject(new ApiError('The quote service returned 503', { status: 503, url: 'demo/quote' }));
          else resolve({ symbol: 'NISH', price: 100 + n });
        }, 900);
        signal.addEventListener('abort', () => {
          clearTimeout(id);
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    { intervalMs },
  );

  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="rounded-xl border border-th-line bg-th-surface p-4">
        {res.loading ? (
          <div className="grid gap-2" role="status" aria-label="Loading">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : res.error && res.data === undefined ? (
          <ErrorState compact message={res.error.message} onRetry={() => void res.reload()} retrying={res.refreshing} />
        ) : res.data ? (
          <div>
            <div className="font-mono text-sm text-th-hi3">{res.data.symbol}</div>
            <div className="text-2xl font-semibold tabular-nums text-th-hi">{res.data.price.toFixed(2)}</div>
            {res.error ? <p className="mt-1 text-sm text-th-loss">Refresh failed: {res.error.message}. Showing the last good value.</p> : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-th-hi3">
        <span>{res.refreshing ? 'Refreshing…' : 'Idle'}</span>
        {res.updatedAt ? (
          <span>
            Last updated <RelativeTime value={res.updatedAt} />
          </span>
        ) : null}
        {res.stale ? <span className="text-th-warn">Data may be out of date</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void res.reload()}>
          Reload
        </Button>
        <Button size="sm" variant={fail ? 'danger' : 'secondary'} aria-pressed={fail} onClick={() => setFail((v) => !v)}>
          {fail ? 'Next load fails: on' : 'Make the next load fail'}
        </Button>
      </div>
    </div>
  );
}

export const useResourceDoc: ComponentDoc = {
  id: 'use-resource',
  name: 'useResource',
  exports: [],
  source: 'src/components/resource.ts',
  summary:
    'apiFetch, ApiError and useResource: the data fetching every app rewrote. JSON in and out with a timeout and a typed error, then a hook that loads, shares one request between hooks that ask for the same key, polls while the tab is visible (backing off after errors), refetches on reconnect and on coming back to the tab, and aborts on unmount.',
  importLine: "import { apiFetch, ApiError, configureApi, useResource } from '@nish/ui';",
  controls: [],
  initial: {},
  render: () => <ResourceDemo />,
  code: () =>
    "const quote = useResource<Quote>('/api/quote', undefined, { intervalMs: 15_000 });\nif (quote.loading) return <SkeletonLines />;\nif (quote.error && !quote.data) return <ErrorState message={quote.error.message} onRetry={quote.reload} />;",
  stories: [
    { id: 'states', name: 'Loading, data, error, refreshing', render: () => <ResourceDemo /> },
    {
      id: 'polling',
      name: 'Polling every 5 seconds',
      note: 'Switch to another tab and back: polling pauses while hidden and refetches on return.',
      render: () => <ResourceDemo intervalMs={5000} />,
    },
    { id: 'loading', name: 'Loading (never resolves)', render: () => <ResourceDemo mode="loading" /> },
    { id: 'first-error', name: 'First load fails', render: () => <ResourceDemo mode="error" /> },
  ],
  api: { functions: ['apiFetch', 'configureApi', 'useResource'], interfaces: ['ApiFetchOptions', 'ApiConfig', 'UseResourceOptions', 'Resource'] },
  usage: `import { ApiError, ErrorState, SkeletonLines, apiFetch, configureApi, useResource } from '@nish/ui';

// Once, at startup (optional).
configureApi({
  onUnauthorized: () => { location.href = '/login'; },
  // Sent to same-origin URLs only; a cross-origin API must be allowed by name.
  headers: () => ({ authorization: 'Bearer ' + token() }),
  headersFor: (url) => url.startsWith('https://api.example.com/'),
});

function Positions() {
  const positions = useResource<Position[]>('/api/positions', undefined, { intervalMs: 30_000 });
  if (positions.loading) return <SkeletonLines />;
  if (positions.error && !positions.data)
    return <ErrorState message={positions.error.message} onRetry={positions.reload} />;
  return <PositionTable rows={positions.data!} stale={positions.stale} />;
}

// Writes use apiFetch directly.
await apiFetch('/api/positions', { method: 'POST', body: { symbol: 'NISH' } });`,
  guidelines: [
    'loading is true only while there is no data yet. Use refreshing for a subtle spinner on background loads, and keep showing the data.',
    'A failed refresh keeps the last good data and sets error. Show a small notice, not a blank page.',
    'apiFetch throws ApiError with status 0 for network failures ("Could not reach the server.") and timeouts ("The server took too long to answer."). Otherwise the message is the server\'s body.error or body.message sentence; a bare code such as not_found, or no message at all, becomes the shared wording: "Log in to continue." for a 401, "That was not found.", "The server had a problem. Try again." or "The server answered 503.". Show error.message as it is.',
    'The key is the request identity: change it to refetch (a filter, a page). Pass null to wait for a dependency.',
    'Two hooks that ask for the same key at the same time share one request (with the default fetcher, or the same fetcher function). The request is aborted only when the last of them lets go. reload() always starts its own request, so it is the way to ask for fresh data after a write. There is no cache: a hook that mounts later fetches again.',
    'After a failed poll the next one waits twice as long, doubling per failure up to 5 minutes, with up to 10% jitter so a fleet of tabs does not retry together. The first success returns it to intervalMs.',
    'For optimistic updates call mutate with the new value, then reload to confirm it with the server. A response that was requested before the mutate and arrives after it is dropped, so it cannot undo the update.',
    'Headers from configureApi({ headers }) go only to same-origin URLs and to the origin of baseUrl. For another origin return true from headersFor(url); headers you pass to a single apiFetch call always apply.',
    'A 2xx response that claims to be JSON but is not (an HTML error page from a proxy) throws an ApiError with that status and a short excerpt of the body, instead of resolving a string.',
  ],
};
