import { Badge, Button, Card, SectionHeader, buttonClass } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SectionHeader -----------------------------------------------------------------------

export const sectionHeader: ComponentDoc = {
  id: 'section-header',
  name: 'SectionHeader',
  exports: ['SectionHeader'],
  summary:
    'The heading row of a section inside a page: an h2 (or h1, h3) with quiet meta text and an action on the right. Smaller than PageHeader, larger than CardHeader.',
  importLine: "import { SectionHeader } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'meta', label: 'Meta', type: 'boolean' },
    { key: 'action', label: 'Action', type: 'boolean' },
    { key: 'as', label: 'Heading', type: 'select', options: ['h2', 'h3', 'h1'] },
  ],
  initial: { title: 'Services', meta: true, action: false, as: 'h2' },
  render: (a) => (
    <div className="w-full max-w-lg">
      <SectionHeader
        title={String(a.title)}
        as={a.as as 'h1' | 'h2' | 'h3'}
        meta={a.meta ? 'Updated 2 min ago' : undefined}
        action={a.action ? <Button size="sm">Refresh</Button> : undefined}
      />
    </div>
  ),
  code: (a) =>
    jsx('SectionHeader', {
      title: a.title,
      as: a.as === 'h2' ? undefined : a.as,
      meta: a.meta ? 'Updated 2 min ago' : undefined,
      action: a.action ? '{<Button size="sm">Refresh</Button>}' : undefined,
    }),
  stories: [
    { id: 'title', name: 'Title only', render: () => <div className="w-full"><SectionHeader title="Runners" /></div> },
    { id: 'meta', name: 'With meta', render: () => <div className="w-full"><SectionHeader title="Services" meta="8 of 9 up" /></div> },
    {
      id: 'action',
      name: 'With meta and an action',
      render: () => (
        <div className="w-full">
          <SectionHeader
            title="Price drops"
            meta={<Badge tone="ok">3 new</Badge>}
            action={
              <a href="#/components/section-header" className={buttonClass({ variant: 'link', size: 'sm' })}>
                See all
              </a>
            }
          />
        </div>
      ),
    },
    {
      id: 'page',
      name: 'Over a section of cards',
      wide: true,
      render: () => (
        <section aria-labelledby="sh-demo" className="w-full">
          <SectionHeader id="sh-demo" title="This PC" meta="Updated just now" action={<Button size="sm">Refresh</Button>} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Card padding="sm" className="text-sm text-th-hi2">CPU 12%</Card>
            <Card padding="sm" className="text-sm text-th-hi2">Memory 41%</Card>
          </div>
        </section>
      ),
    },
  ],
  usage: `import { SectionHeader } from '@nish/ui';

<section aria-labelledby="services">
  <SectionHeader id="services" title="Services" meta="Updated 2 min ago" />
  …
</section>`,
  guidelines: [
    'One per page section. The page itself takes PageHeader; a card takes CardHeader.',
    'Give it an id and point the section at it with aria-labelledby, so the region has a name.',
    'meta is quiet text (hi3); keep live counts and states in a Badge.',
  ],
};
