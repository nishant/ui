import { Badge, Button, Card, IconButton, Segmented } from '../../src';
import { CardHeader } from '../../src';
import { BellIcon, ChartIcon, RefreshIcon, SettingsIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { MiniTable } from './card';

// --- CardHeader ---------------------------------------------------------------------
// Registered by the integrator (see LANE.md): needs CardHeader in src/index.ts and in
// site/docgen.mjs COMPONENTS before COMPONENT_DOCS can list it.

export const cardHeader: ComponentDoc = {
  id: 'card-header',
  name: 'CardHeader',
  exports: ['CardHeader'],
  summary:
    'The header row of a card: a title, an optional description and icon, and an action slot that wraps under the title on narrow cards. Card renders one for you when you pass title.',
  importLine: "import { CardHeader } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'action', label: 'Action', type: 'select', options: ['none', 'button', 'icons', 'badge'] },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'divided', label: 'Divided', type: 'boolean' },
  ],
  initial: { title: 'Price alerts', description: '3 trackers dropped this week', action: 'button', icon: false, divided: false },
  render: (a) => {
    const action =
      a.action === 'button' ? (
        <Button size="sm" variant="soft">
          View all
        </Button>
      ) : a.action === 'icons' ? (
        <>
          <IconButton label="Refresh" size="xs">
            <RefreshIcon size={12} />
          </IconButton>
          <IconButton label="Settings" size="xs">
            <SettingsIcon size={12} />
          </IconButton>
        </>
      ) : a.action === 'badge' ? (
        <Badge tone="ok">8 up</Badge>
      ) : undefined;
    return (
      <Card padding={a.divided ? 'none' : 'md'} className="w-full max-w-md">
        <CardHeader
          title={String(a.title)}
          description={a.description ? String(a.description) : undefined}
          icon={a.icon ? <BellIcon size={16} /> : undefined}
          action={action}
          divided={!!a.divided}
        />
        <p className={a.divided ? 'px-4 py-3 text-sm text-th-hi2' : 'mt-3 text-sm text-th-hi2'}>Sony WH-1000XM6 is $48 under your target.</p>
      </Card>
    );
  },
  code: (a) =>
    jsx('CardHeader', {
      title: String(a.title),
      description: a.description ? String(a.description) : undefined,
      icon: a.icon ? '{<Bell size={16} />}' : undefined,
      action: a.action === 'none' ? undefined : a.action === 'badge' ? '{<Badge tone="ok">8 up</Badge>}' : '{…}',
      divided: a.divided,
    }),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Card className="w-full">
          <CardHeader title="Weekly digest" />
          <p className="mt-3 text-sm text-th-hi2">Every Monday at 8 am.</p>
        </Card>
      ),
    },
    {
      id: 'description-action',
      name: 'Description and action',
      render: () => (
        <Card className="w-full">
          <CardHeader
            title="Price alerts"
            description="3 trackers dropped this week"
            action={
              <Button size="sm" variant="soft">
                View all
              </Button>
            }
          />
        </Card>
      ),
    },
    {
      id: 'icon',
      name: 'With an icon',
      render: () => (
        <Card className="w-full">
          <CardHeader icon={<ChartIcon size={16} />} title="Portfolio" description="Up 2.4% today" action={<Badge tone="ok">Live</Badge>} />
        </Card>
      ),
    },
    {
      id: 'divided',
      name: 'Divided, table edge to edge',
      note: 'divided adds its own padding and a bottom border, for unpadded cards.',
      wide: true,
      render: () => (
        <Card padding="none" className="w-full overflow-hidden">
          <CardHeader
            divided
            title="Sites"
            description="Checked every minute"
            action={
              <IconButton label="Refresh sites" size="xs">
                <RefreshIcon size={12} />
              </IconButton>
            }
          />
          <MiniTable />
        </Card>
      ),
    },
    {
      id: 'wrap',
      name: 'Long title, wrapping action',
      note: 'On a narrow card the action wraps under the title instead of squeezing it.',
      render: () => (
        <Card className="w-full max-w-xs">
          <CardHeader
            title="Applications by stage, last 90 days"
            action={
              <Segmented
                label="Range"
                size="sm"
                value="90"
                onChange={() => {}}
                options={[
                  { value: '30', label: '30d' },
                  { value: '90', label: '90d' },
                ]}
              />
            }
          />
        </Card>
      ),
    },
    {
      id: 'levels',
      name: 'Heading levels',
      note: 'as="h2" (default), "h3" or "h4": match the page outline. The look stays the same.',
      render: () => (
        <Card className="w-full space-y-3">
          <CardHeader as="h3" title="Rendered as an h3" />
          <CardHeader as="h4" title="Rendered as an h4" description="Same size, lower level." />
        </Card>
      ),
    },
  ],
  usage: `import { Card, CardHeader, IconButton } from '@nish/ui';

// Card renders the header itself:
<Card title="Price alerts" description="3 dropped" action={<Button size="sm" variant="soft">View all</Button>}>…</Card>

// Or place one yourself, e.g. above a table:
<Card padding="none" className="overflow-hidden">
  <CardHeader divided title="Sites" action={<IconButton label="Refresh" size="xs"><RefreshCw size={12} /></IconButton>} />
  <table>…</table>
</Card>`,
  guidelines: [
    'Prefer Card\'s title, description and action props; use CardHeader directly when the header sits somewhere other than first.',
    'Use divided on unpadded cards so the header gets its own padding and a line under it.',
    'Pick the heading level (as) that fits the page outline: h2 under the page\'s h1, h3 inside a titled section.',
    'Keep actions small: an xs or sm button, a couple of xs IconButtons, a Badge or a small Segmented.',
  ],
};
