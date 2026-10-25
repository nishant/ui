import { Badge, Card } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Card ---------------------------------------------------------------------------

const ROWS = [
  ['jobs.nish.software', 'Job search', 'ok', '41 ms'],
  ['trading.nish.software', 'Options ideas', 'ok', '88 ms'],
  ['mc.nish.software', 'Minecraft guides', 'warn', '612 ms'],
  ['trackers.nish.software', 'Price trackers', 'loss', 'timeout'],
] as const;

function MiniTable() {
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
                <Badge tone={s}>{s === 'ok' ? 'Up' : s === 'warn' ? 'Slow' : 'Down'}</Badge>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-th-hi2">{ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const card: ComponentDoc = {
  id: 'card',
  name: 'Card',
  exports: ['Card'],
  summary: 'The surface everything sits on: widgets, tables, forms. A border, the surface color and the card shadow, with optional padding and hover.',
  importLine: "import { Card } from '@nish/ui';",
  controls: [
    { key: 'content', label: 'Content', type: 'select', options: ['text', 'table', 'stat'] },
    { key: 'padded', label: 'Padded', type: 'boolean' },
    { key: 'interactive', label: 'Interactive', type: 'boolean' },
  ],
  initial: { content: 'text', padded: true, interactive: false },
  render: (a) => (
    <Card padded={!!a.padded} interactive={!!a.interactive} className="w-full max-w-md">
      {a.content === 'table' ? (
        <MiniTable />
      ) : a.content === 'stat' ? (
        <div className={a.padded ? '' : 'p-4'}>
          <p className="text-xs text-th-hi3">Open applications</p>
          <p className="text-3xl font-semibold tabular-nums text-th-hi">24</p>
          <p className="text-xs text-th-ok">+5 this week</p>
        </div>
      ) : (
        <div className={a.padded ? 'space-y-1' : 'space-y-1 p-4'}>
          <p className="font-semibold text-th-hi">Weekly digest</p>
          <p className="text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches, and the trackers that dropped in price.</p>
        </div>
      )}
    </Card>
  ),
  code: (a) => jsx('Card', { padded: a.padded ? undefined : '{false}', interactive: a.interactive }, a.content === 'table' ? '…table…' : '…'),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Card className="w-full">
          <p className="font-semibold text-th-hi">Weekly digest</p>
          <p className="mt-1 text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches.</p>
        </Card>
      ),
    },
    {
      id: 'interactive',
      name: 'Interactive',
      note: 'For cards that are links. Hover lifts the border and the fill.',
      render: () => (
        <a href="#/components/card" className="block w-full rounded-xl">
          <Card interactive className="w-full">
            <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">jobs.nish.software</p>
            <p className="mt-1 font-semibold text-th-hi">Job search</p>
            <p className="text-sm text-th-hi2">24 open applications, 3 interviews this week.</p>
          </Card>
        </a>
      ),
    },
    {
      id: 'table',
      name: 'Unpadded, table edge to edge',
      wide: true,
      render: () => (
        <Card padded={false} className="w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-th-line px-4 py-3">
            <p className="font-semibold text-th-hi">Sites</p>
            <Badge tone="ok">8 up</Badge>
          </div>
          <MiniTable />
        </Card>
      ),
    },
    {
      id: 'stats',
      name: 'Stat tiles',
      wide: true,
      render: () => (
        <Card padded={false} className="grid w-full grid-cols-2 gap-px overflow-hidden bg-th-line sm:grid-cols-4">
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
  ],
  usage: `import { Card, Badge } from '@nish/ui';

<Card padded={false} className="overflow-hidden">
  <div className="flex items-center justify-between border-b border-th-line px-4 py-3">
    <h2 className="font-semibold text-th-hi">Sites</h2>
    <Badge tone="ok">8 up</Badge>
  </div>
  <table className="w-full text-sm">…</table>
</Card>`,
  guidelines: [
    'Turn padding off (padded={false}) for tables and lists that run edge to edge, and pad the header yourself.',
    'Raised things inside a card use bg-th-elevated; the deepest layer (chips inside those) uses bg-th-overlay.',
    'Use interactive only when the whole card is a link or a button.',
  ],
};
