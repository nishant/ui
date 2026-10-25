import { Button, Card, EmptyState } from '../../src';
import { BellIcon, ChartIcon, InboxIcon, PlusIcon, SearchIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- EmptyState ---------------------------------------------------------------------

export const emptyState: ComponentDoc = {
  id: 'empty-state',
  name: 'EmptyState',
  exports: ['EmptyState'],
  summary: 'What a list, table or widget shows when there is nothing in it yet: a title, one line of why, and usually one action.',
  importLine: "import { EmptyState } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'detail', label: 'Detail', type: 'boolean' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'action', label: 'Action', type: 'boolean' },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { title: 'No price drops yet', detail: true, icon: true, action: true, compact: false },
  render: (a) => (
    <div className="w-full max-w-lg">
      <EmptyState
        title={String(a.title)}
        detail={a.detail ? 'Trackers check every hour. Changes show up here.' : undefined}
        icon={a.icon ? <ChartIcon /> : undefined}
        action={a.action ? <Button size="sm">Add a tracker</Button> : undefined}
        compact={!!a.compact}
      />
    </div>
  ),
  code: (a) =>
    jsx('EmptyState', {
      icon: a.icon ? '{<LineChart />}' : undefined,
      title: String(a.title),
      detail: a.detail ? 'Trackers check every hour. Changes show up here.' : undefined,
      action: a.action ? '{<Button size="sm">Add a tracker</Button>}' : undefined,
      compact: a.compact,
    }),
  stories: [
    {
      id: 'page',
      name: 'On a page',
      render: () => (
        <EmptyState
          className="w-full"
          icon={<InboxIcon />}
          title="No applications yet"
          detail="Save a job from any listing and it lands here."
          action={
            <Button size="sm" variant="primary" icon={<PlusIcon size={13} />}>
              Add a job
            </Button>
          }
        />
      ),
    },
    {
      id: 'compact',
      name: 'Compact, in a widget',
      render: () => (
        <Card padded={false} className="h-40 w-full">
          <EmptyState compact icon={<BellIcon />} title="No alerts" detail="You will see price and status alerts here." />
        </Card>
      ),
    },
    {
      id: 'bare',
      name: 'Title only',
      render: () => <EmptyState className="w-full" title="Nothing matches these filters" />,
    },
    {
      id: 'long',
      name: 'Long detail',
      render: () => (
        <EmptyState
          className="w-full"
          icon={<SearchIcon />}
          title="No listings in this area"
          detail="We searched 14 sites for 2-bedroom rentals under $2,400 within 3 miles of downtown Austin. Try widening the radius or raising the budget."
        />
      ),
    },
  ],
  usage: `import { EmptyState, Button } from '@nish/ui';
import { Inbox } from 'lucide-react';

{jobs.length === 0 ? (
  <EmptyState
    icon={<Inbox />}
    title="No applications yet"
    detail="Save a job from any listing and it lands here."
    action={<Button size="sm" onClick={openAdd}>Add a job</Button>}
  />
) : (
  <JobTable jobs={jobs} />
)}`,
  guidelines: [
    'Say what is empty, then why or what fills it. Skip the cheerful filler.',
    'Use compact inside a Card or widget; the default dashed box is for a whole page or section.',
    'For a failed load use ErrorState, not an empty state: they mean different things.',
  ],
};
