import { Button, buttonClass, Card } from '../../src';
import { PageHeader } from '../../src';
import { jsx } from '../lib/jsx';
import { PlusIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- PageHeader ---------------------------------------------------------------------

const backLink = buttonClass({ variant: 'link' });

export const pageHeader: ComponentDoc = {
  id: 'page-header',
  name: 'PageHeader',
  exports: ['PageHeader'],
  summary: 'The title block at the top of a page: an optional back link and eyebrow, the title, a description and actions.',
  importLine: "import { PageHeader } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'back', label: 'Back link', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'boolean' },
  ],
  initial: { title: 'Applications', description: '24 open, 3 interviews this week.', eyebrow: '', back: false, actions: true },
  render: (a) => (
    <PageHeader
      className="w-full"
      title={String(a.title)}
      description={String(a.description) || undefined}
      eyebrow={String(a.eyebrow) || undefined}
      back={a.back ? <a href="#" className={backLink}>← Jobs</a> : undefined}
      actions={
        a.actions ? (
          <>
            <Button size="sm">Export</Button>
            <Button size="sm" variant="primary" icon={<PlusIcon size={14} />}>
              Add job
            </Button>
          </>
        ) : undefined
      }
    />
  ),
  code: (a) =>
    jsx('PageHeader', {
      title: a.title,
      description: a.description || undefined,
      eyebrow: a.eyebrow || undefined,
      back: a.back ? "{<Link to=\"/\" className={buttonClass({ variant: 'link' })}>← Jobs</Link>}" : undefined,
      actions: a.actions ? '{<Button variant="primary">Add job</Button>}' : undefined,
    }),
  html: {
    height: 200,
    code: `<header class="nish-page-header">
  <div>
    <h1 class="nish-page-header-title">Applications</h1>
    <p class="nish-page-header-subtitle">24 open, 3 interviews this week.</p>
  </div>
  <div class="nish-page-header-actions">
    <button class="nish-btn nish-btn--sm">Export</button>
    <button class="nish-btn nish-btn--sm nish-btn--primary">Add job</button>
  </div>
</header>`,
  },
  stories: [
    { id: 'title', name: 'Title only', render: () => <PageHeader title="Watchlist" className="w-full" /> },
    {
      id: 'full',
      name: 'Back link, eyebrow and actions',
      wide: true,
      render: () => (
        <PageHeader
          className="w-full"
          back={<a href="#" className={backLink}>← All trackers</a>}
          eyebrow="Tracker"
          title="Sony WH-1000XM6"
          description="Lowest $328 at Best Buy, 9% under the 90-day median."
          actions={
            <>
              <Button size="sm">Edit</Button>
              <Button size="sm" variant="danger">
                Remove
              </Button>
            </>
          }
        />
      ),
    },
    {
      id: 'h2',
      name: 'As h2, in a card',
      render: () => (
        <Card className="w-full">
          <PageHeader as="h2" title="Settings" description="Applies to every device you sign in on." />
        </Card>
      ),
    },
    {
      id: 'sticky',
      name: 'Sticky',
      note: 'Scroll the box: the header stays at the top with an opaque background and a bottom border once stuck.',
      wide: true,
      render: () => (
        <div
          className="h-48 w-full overflow-y-auto rounded-xl border border-th-line bg-th-bg px-[var(--nish-page-gutter)]"
          style={{ ['--nish-header-h' as string]: '0px' }}
        >
          <PageHeader sticky title="Positions" actions={<Button size="sm">Refresh</Button>} />
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="border-b border-th-line py-2 text-sm text-th-hi2">
              Position {i + 1}
            </p>
          ))}
        </div>
      ),
    },
  ],
  usage: `import { PageHeader, Button, buttonClass } from '@nish/ui';

<PageHeader
  back={<Link to="/" className={buttonClass({ variant: 'link' })}>← Jobs</Link>}
  title={job.title}
  description={job.company}
  actions={<Button variant="primary">Apply</Button>}
/>`,
  guidelines: [
    'One PageHeader per page, as its h1. Inside a card or dialog section use as="h2".',
    'Keep actions to one primary and one or two secondary buttons; the rest go in a menu.',
    'sticky keeps the bar at the top while the page scrolls. By default (collapseWhenStuck) it shrinks once stuck below 640px: the description is hidden and the title becomes one truncated line. Pass collapseWhenStuck={false} to keep the full header.',
    'The back link is the app\'s own router Link styled with buttonClass({ variant: "link" }).',
  ],
};
