import { useState } from 'react';
import { Inbox, type InboxItem, type InboxView } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Inbox --------------------------------------------------------------------------------

const MIN = 60_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const LONG_URL =
  'https://www.example.com/products/a-very-long-product-path/with/many/segments/and-a-query?utm_source=inbox&utm_medium=push&utm_campaign=price-drop-alert-for-the-long-url-sample';

function item(o: Partial<InboxItem> & Pick<InboxItem, 'id' | 'source' | 'title'>): InboxItem {
  return {
    kind: 'event',
    body: null,
    url: null,
    severity: 'normal',
    count: 1,
    createdAt: iso(60 * MIN),
    updatedAt: iso(5 * MIN),
    occurredAt: iso(5 * MIN),
    handledAt: null,
    handledBy: null,
    snoozedUntil: null,
    data: null,
    ...o,
  };
}

const OPEN: InboxItem[] = [
  item({ id: 1, source: 'status', kind: 'site-down', severity: 'urgent', title: 'trading.nish.software is down', body: 'No response for 3 minutes.', url: 'https://status.nish.software', updatedAt: iso(2 * MIN) }),
  item({ id: 2, source: 'trackers', kind: 'price-drop', title: 'Sony WH-1000XM6 dropped to $298', body: 'Was $349. Lowest price in 90 days.', url: 'https://www.example.com/sony', count: 3, updatedAt: iso(14 * MIN) }),
  item({
    id: 3,
    source: 'ci',
    kind: 'run-failed',
    title: 'ui: check failed on master',
    body: 'The contrast step failed in the dark theme.\nSee the run for the failing roles.\nThe previous run passed.\nThis is a fourth line, so the body is clamped and shows More.',
    url: LONG_URL,
    updatedAt: iso(50 * MIN),
    actions: [
      { id: 'rerun', label: 'Re-run', method: 'POST', target: 'http://127.0.0.1:8820/actions/rerun' },
      { id: 'open-logs', label: 'Save the logs', method: 'POST', target: 'http://127.0.0.1:8820/actions/logs' },
    ],
    lastAction: { actionId: 'rerun', ok: false, status: 500, error: null, at: iso(20 * MIN) },
  }),
  item({
    id: 4,
    source: 'job-apps',
    kind: 'new-jobs',
    severity: 'info',
    title: '12 new jobs from the latest search',
    updatedAt: iso(3 * 60 * MIN),
    actions: [{ id: 'apply-all', label: 'Queue all 12', method: 'POST', target: 'http://127.0.0.1:8830/actions/queue' }],
  }),
  item({ id: 5, source: 'trading', kind: 'exit-level', title: 'Supercalifragilisticexpialidocious'.repeat(9).slice(0, 300), updatedAt: iso(5 * 60 * MIN) }),
];
const SNOOZED: InboxItem[] = [
  item({ id: 6, source: 'trackers', kind: 'flight', title: 'AUS to SFO fell to $212', url: 'https://www.google.com/travel/flights', snoozedUntil: new Date(Date.now() + 3 * 60 * MIN).toISOString() }),
];
const HANDLED: InboxItem[] = [
  item({ id: 7, source: 'status', kind: 'site-down', title: 'start.nish.software is down', handledAt: iso(40 * MIN), handledBy: 'source' }),
  item({
    id: 8,
    source: 'ci',
    kind: 'run-failed',
    title: 'hosting: deploy failed',
    handledAt: iso(2 * 60 * MIN),
    handledBy: 'user',
    actions: [{ id: 'rerun', label: 'Re-run', method: 'POST', target: 'http://127.0.0.1:8820/actions/rerun' }],
    lastAction: { actionId: 'rerun', ok: true, status: 200, error: null, at: iso(2 * 60 * MIN) },
  }),
  item({ id: 9, source: 'job-apps', kind: 'source-health', title: 'Indeed needs sign-in', handledAt: iso(26 * 60 * MIN), handledBy: 'expired' }),
];
const SOURCES = [
  { id: 'status', open: 1 },
  { id: 'trackers', open: 1 },
  { id: 'ci', open: 1 },
  { id: 'job-apps', open: 1 },
  { id: 'trading', open: 1 },
];

function Demo({
  view: first = 'open',
  state = 'ready',
  one = false,
  mark = true,
  more = false,
  actions = true,
}: {
  view?: InboxView;
  state?: string;
  one?: boolean;
  mark?: boolean;
  more?: boolean;
  actions?: boolean;
}) {
  const [view, setView] = useState<InboxView>(first);
  const [source, setSource] = useState<string | null>(null);
  const all = view === 'open' ? OPEN : view === 'snoozed' ? SNOOZED : HANDLED;
  const items = state === 'empty' ? [] : source ? all.filter((i) => i.source === source) : all;
  return (
    <div className="w-full max-w-2xl">
      <Inbox
        items={items}
        view={view}
        onViewChange={setView}
        counts={{ open: OPEN.length, snoozed: SNOOZED.length, handled: HANDLED.length }}
        sources={one ? [{ id: 'trading', open: 1 }] : SOURCES}
        source={source}
        onSourceChange={setSource}
        onHandle={() => undefined}
        onUnhandle={() => undefined}
        onSnooze={() => undefined}
        onUnsnooze={() => undefined}
        onHandleAll={mark ? () => undefined : undefined}
        loading={state === 'loading'}
        error={state === 'error' ? 'The inbox service did not answer. It may be restarting.' : null}
        onRetry={() => undefined}
        hasMore={more}
        onLoadMore={() => undefined}
        selectedId={state === 'selected' ? 2 : null}
        onAction={actions ? () => new Promise<void>((done) => setTimeout(done, 1500)) : undefined}
      />
    </div>
  );
}

export const inbox: ComponentDoc = {
  id: 'inbox',
  name: 'Inbox',
  exports: ['Inbox'],
  summary:
    'One list for events from every app: Open, Snoozed and Handled views, a source filter, and handle, snooze and undo actions on each row. The page owns the data and the calls; Inbox renders it and reports what was picked.',
  importLine: "import { Inbox } from '@nish/ui';",
  controls: [
    { key: 'view', label: 'View', type: 'select', options: ['open', 'snoozed', 'handled'] },
    { key: 'state', label: 'State', type: 'select', options: ['ready', 'loading', 'error', 'empty', 'selected'] },
    { key: 'one', label: 'One source (no filter row)', type: 'boolean' },
    { key: 'mark', label: 'Mark all handled', type: 'boolean' },
    { key: 'more', label: 'Load more', type: 'boolean' },
    { key: 'actions', label: 'Item actions (onAction)', type: 'boolean' },
  ],
  initial: { view: 'open', state: 'ready', one: false, mark: true, more: false, actions: true },
  render: (a) => (
    <Demo key={`${a.view}-${a.state}`} view={a.view as InboxView} state={String(a.state)} one={!!a.one} mark={!!a.mark} more={!!a.more} actions={!!a.actions} />
  ),
  code: (a) =>
    jsx('Inbox', {
      items: '{items}',
      view: '{view}',
      onViewChange: '{setView}',
      counts: '{counts}',
      sources: '{sources}',
      source: '{source}',
      onSourceChange: '{setSource}',
      onHandle: '{handle}',
      onUnhandle: '{unhandle}',
      onSnooze: '{snooze}',
      onUnsnooze: '{unsnooze}',
      onHandleAll: a.mark ? '{handleAll}' : undefined,
      loading: a.state === 'loading' ? true : undefined,
      error: a.state === 'error' ? 'Could not load' : undefined,
      hasMore: a.more ? true : undefined,
      onAction: a.actions ? '{(id, actionId) => api.runAction(id, actionId)}' : undefined,
    }),
  stories: [
    { id: 'open', name: 'Open, every severity', wide: true, render: () => <Demo /> },
    { id: 'no-actions', name: 'Without onAction', note: 'Item actions show only when onAction is given.', render: () => <Demo actions={false} /> },
    { id: 'snoozed', name: 'Snoozed', render: () => <Demo view="snoozed" /> },
    { id: 'handled', name: 'Handled', render: () => <Demo view="handled" /> },
    { id: 'selected', name: 'A linked item selected', note: 'selectedId highlights the row and scrolls it into view once.', render: () => <Demo state="selected" /> },
    { id: 'loading', name: 'Loading', render: () => <Demo state="loading" /> },
    { id: 'error', name: 'Error', render: () => <Demo state="error" /> },
    { id: 'empty', name: 'Empty', render: () => <Demo state="empty" /> },
    { id: 'single', name: 'One source, load more', note: 'The source filter hides with one source or fewer.', render: () => <Demo one more mark={false} /> },
  ],
  usage: `import { Inbox } from '@nish/ui';

<Inbox
  items={data.items}
  view={view}
  onViewChange={setView}
  counts={data.counts}
  sources={data.sources}
  source={source}
  onSourceChange={setSource}
  onHandle={(id) => api.handle(id)}
  onUnhandle={(id) => api.unhandle(id)}
  onSnooze={(id, until) => api.snooze(id, until)}
  onUnsnooze={(id) => api.unsnooze(id)}
  onHandleAll={() => api.handleAll()}
  // POST /api/items/:id/actions/:actionId; refresh the item, toast item.lastAction.
  onAction={(id, actionId) => api.runAction(id, actionId)}
/>

// Producers send events with the client (no React):
import { createInboxClient } from '@nish/ui/inbox-client';
const inbox = createInboxClient({ source: 'trackers' });
await inbox.send({ kind: 'price-drop', title: 'Headphones dropped to $298', url, dedupeKey: sku });

// Buttons on the item: the inbox service POSTs an InboxActionCall to target (loopback only,
// 8 s timeout, header X-Inbox-Action: 1). Answer 2xx and the item is marked handled.
await inbox.send({
  kind: 'run-failed', title: 'ui: check failed', dedupeKey: runId,
  actions: [{ id: 'rerun', label: 'Re-run', target: 'http://127.0.0.1:8820/actions/rerun' }],
});`,
  guidelines: [
    'The component never calls a server. Wire the callbacks to your API and update the items and counts it returns.',
    'Under 480px each open row has one "Actions" menu (44px) with Mark handled and the snooze times; from 480px the two buttons sit inline.',
    'The source chips scroll sideways inside their own row on phones. The page itself never scrolls sideways.',
    'Item actions (up to 3, from the event) show as small buttons under the text in the open and snoozed views when onAction is given. While one runs it spins and the item\'s other actions are disabled; the last result shows in a muted line under them.',
    'Pass selectedId from a notification link (#/inbox?item=<id>) so the item is highlighted and scrolled into view.',
    'Colors come only from th-* roles, so every theme works in light and dark.',
  ],
};
