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
      note: 'Scroll the box: the header stays with a glass background.',
      wide: true,
      render: () => (
        <div className="h-48 w-full overflow-y-auto rounded-xl border border-th-line bg-th-bg px-4">
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
    'The back link is the app\'s own router Link styled with buttonClass({ variant: "link" }).',
  ],
};
