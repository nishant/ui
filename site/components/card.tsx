import { Badge, Button, Card, IconButton } from '../../src';
import { cardClass } from '../../src';
import { RefreshIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Card ---------------------------------------------------------------------------

const ROWS = [
  ['jobs.nish.software', 'Job search', 'ok', '41 ms'],
  ['trading.nish.software', 'Options ideas', 'ok', '88 ms'],
  ['mc.nish.software', 'Minecraft guides', 'warn', '612 ms'],
  ['trackers.nish.software', 'Price trackers', 'loss', 'timeout'],
] as const;

export function MiniTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-th-line bg-th-elevated/50 text-left text-xs text-th-hi3">
            <th className="px-4 py-2 font-medium">Host</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Response</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([host, , s, ms]) => (
            <tr key={host} className="border-b border-th-line last:border-0">
              <td className="px-4 py-2.5 font-medium text-th-hi">{host}</td>
              <td className="px-4 py-2.5">
                <Badge tone={s} dot>
                  {s === 'ok' ? 'Up' : s === 'warn' ? 'Slow' : 'Down'}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-th-hi2">{ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Digest = () => (
  <>
    <p className="font-semibold text-th-hi">Weekly digest</p>
    <p className="mt-1 text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches.</p>
  </>
);

export const card: ComponentDoc = {
  id: 'card',
  name: 'Card',
  exports: ['Card'],
  summary:
    'The surface everything sits on: widgets, tables, forms. A border, the surface color and the card shadow, with four paddings, an inset variant, an optional header and cardClass() for cards that are links.',
  importLine: "import { Card } from '@nish/ui';",
  controls: [
    { key: 'content', label: 'Content', type: 'select', options: ['text', 'table', 'stat'] },
    { key: 'padding', label: 'Padding', type: 'select', options: ['none', 'sm', 'md', 'lg'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['surface', 'inset'] },
    { key: 'header', label: 'Header', type: 'boolean' },
    { key: 'interactive', label: 'Interactive', type: 'boolean' },
  ],
  initial: { content: 'text', padding: 'md', variant: 'surface', header: false, interactive: false },
  render: (a) => {
    const none = a.padding === 'none';
    return (
      <Card
        padding={a.padding as 'md'}
        variant={a.variant as 'surface'}
        interactive={!!a.interactive}
        title={a.header ? 'Sites' : undefined}
        description={a.header ? '10 hosts, checked every minute' : undefined}
        action={a.header ? <Badge tone="ok">8 up</Badge> : undefined}
        className="w-full max-w-md"
      >
        {a.content === 'table' ? (
          <MiniTable />
        ) : a.content === 'stat' ? (
          <div className={none ? 'p-4' : ''}>
            <p className="text-xs text-th-hi3">Open applications</p>
            <p className="text-3xl font-semibold tabular-nums text-th-hi">24</p>
            <p className="text-xs text-th-ok">+5 this week</p>
          </div>
        ) : (
          <div className={none ? 'space-y-1 p-4' : 'space-y-1'}>
            <p className="font-semibold text-th-hi">Weekly digest</p>
            <p className="text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches, and the trackers that dropped in price.</p>
          </div>
        )}
      </Card>
    );
  },
  code: (a) =>
    jsx(
      'Card',
      {
        padding: a.padding === 'md' ? undefined : a.padding,
        variant: a.variant === 'surface' ? undefined : a.variant,
        interactive: a.interactive,
        title: a.header ? 'Sites' : undefined,
        description: a.header ? '10 hosts, checked every minute' : undefined,
        action: a.header ? '{<Badge tone="ok">8 up</Badge>}' : undefined,
      },
      a.content === 'table' ? '…table…' : '…',
    ),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Card className="w-full">
          <Digest />
        </Card>
      ),
    },
    {
      id: 'padding',
      name: 'Padding',
      note: 'sm p-3, md p-4 (p-5 from 640px; the default), lg p-6. Use the prop, not className="p-3".',
      wide: true,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {(['sm', 'md', 'lg'] as const).map((p) => (
            <Card key={p} padding={p}>
              <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">padding="{p}"</p>
              <p className="mt-1 text-sm text-th-hi2">24 open applications.</p>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'header',
      name: 'With a header',
      note: 'title, description and action render a CardHeader first.',
      render: () => (
        <Card
          as="section"
          title="Price alerts"
          description="3 trackers dropped this week"
          action={
            <Button size="sm" variant="soft">
              View all
            </Button>
          }
          className="w-full"
        >
          <p className="text-sm text-th-hi2">Sony WH-1000XM6 is $48 under your target at Best Buy.</p>
        </Card>
      ),
    },
    {
      id: 'inset',
      name: 'Inset, inside a card',
      note: 'variant="inset": elevated fill, no border color, no shadow, rounded-lg.',
      render: () => (
        <Card title="Today" className="w-full">
          <div className="grid gap-2 sm:grid-cols-2">
            <Card variant="inset" padding="sm">
              <p className="text-xs text-th-hi2">Applied</p>
              <p className="text-xl font-semibold tabular-nums text-th-hi">3</p>
            </Card>
            <Card variant="inset" padding="sm">
              <p className="text-xs text-th-hi2">Interviews</p>
              <p className="text-xl font-semibold tabular-nums text-th-hi">1</p>
            </Card>
          </div>
        </Card>
      ),
    },
    {
      id: 'interactive',
      name: 'Interactive, cardClass() on a link',
      note: 'For cards that are links: put cardClass({ interactive: true }) on the <a> or <Link> itself.',
      render: () => (
        <a href="#/components/card" className={cardClass({ interactive: true, className: 'block w-full' })}>
          <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">jobs.nish.software</p>
          <p className="mt-1 font-semibold text-th-hi">Job search</p>
          <p className="text-sm text-th-hi2">24 open applications, 3 interviews this week.</p>
        </a>
      ),
    },
    {
      id: 'table',
      name: 'Unpadded, table edge to edge',
      note: 'With padding="none" the header is divided: its own padding and a bottom border.',
      wide: true,
      render: () => (
        <Card
          padding="none"
          title="Sites"
          action={
            <>
              <Badge tone="ok">8 up</Badge>
              <IconButton label="Refresh sites" size="xs">
                <RefreshIcon size={12} />
              </IconButton>
            </>
          }
          className="w-full overflow-hidden"
        >
          <MiniTable />
        </Card>
      ),
    },
    {
      id: 'stats',
      name: 'Stat tiles',
      wide: true,
      render: () => (
        <Card padding="none" className="grid w-full grid-cols-2 gap-px overflow-hidden bg-th-line sm:grid-cols-4">
          {[
            ['Up', '8', 'text-th-ok'],
            ['Slow', '1', 'text-th-warn'],
            ['Down', '1', 'text-th-loss'],
            ['p95', '212 ms', 'text-th-hi'],
          ].map(([k, v, c]) => (
            <div key={k} className="bg-th-surface px-4 py-3">
              <p className="text-xs text-th-hi3">{k}</p>
              <p className={`text-2xl font-semibold tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </Card>
      ),
    },
    {
      id: 'list',
      name: 'As list items',
      note: 'as="li" inside a <ul>, so the list keeps its semantics.',
      render: () => (
        <ul className="grid w-full gap-2">
          {['Linear: product engineer', 'Vercel: design engineer'].map((t) => (
            <Card key={t} as="li" padding="sm">
              <p className="text-sm font-medium text-th-hi">{t}</p>
            </Card>
          ))}
        </ul>
      ),
    },
  ],
  api: { functions: ['cardClass'], interfaces: [] },
  usage: `import { Card, Badge, cardClass } from '@nish/ui';

<Card padding="none" title="Sites" action={<Badge tone="ok">8 up</Badge>} className="overflow-hidden">
  <table className="w-full text-sm">…</table>
</Card>

<Card as="section" title="Price alerts" description="3 dropped this week">…</Card>

<Link to="/jobs" className={cardClass({ interactive: true })}>…</Link>`,
  guidelines: [
    'Pick padding with the prop (sm, md, lg, none). className="p-3" keeps md\'s sm:p-5 and looks wrong on desktop.',
    'Use padding="none" for tables and lists that run edge to edge; a title then renders a divided header with its own padding.',
    'Inside a card, use variant="inset" for boxes; the deepest layer (chips inside those) uses bg-th-overlay. Secondary text on an inset box is hi2 (hi3 is not text-safe on elevated).',
    'Use interactive only when the whole card is a link or a button. For a link, put cardClass({ interactive: true }) on the <a> or <Link>.',
    'Card\'s title prop renders a header, not a native tooltip. With as="section" or "article" the region is labelled by it.',
  ],
};
