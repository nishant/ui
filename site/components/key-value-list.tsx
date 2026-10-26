import { Badge, Card, KeyValueList, StatusDot } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- KeyValueList --------------------------------------------------------------------------

const SERVICES = [
  { key: 'caddy', label: <><StatusDot tone="ok" />Caddy</>, value: <Badge tone="ok">Up</Badge> },
  { key: 'jobs', label: <><StatusDot tone="ok" />jobs</>, value: <Badge tone="ok">Up</Badge> },
  { key: 'mc', label: <><StatusDot tone="warn" />mc sync</>, value: <Badge tone="warn">Slow</Badge> },
  { key: 'trading', label: <><StatusDot tone="loss" />trading</>, value: <Badge tone="loss">Down</Badge> },
];

const RUNNER = [
  { key: 'name', label: 'Name', value: 'hosting-pc' },
  { key: 'os', label: 'OS', value: 'Windows 11' },
  { key: 'jobs', label: 'Jobs today', value: <span className="tabular-nums">14</span> },
];

const SYSTEM = [
  { key: 'version', label: 'Version', value: '2.14.0' },
  {
    key: 'db',
    label: 'Database',
    value: 'C:\\Users\\nishant\\AppData\\Local\\trading\\data\\trading-ledger.sqlite3',
    wrap: true,
  },
  { key: 'uptime', label: 'Uptime', value: <span className="tabular-nums">3d 4h</span> },
];

export const keyValueList: ComponentDoc = {
  id: 'key-value-list',
  name: 'KeyValueList',
  exports: ['KeyValueList'],
  summary:
    'Label and value rows with dividers: services and their status, runner details, vitals. Rows are 44px tall (32px dense); as="dl" renders a description list; item.wrap lets a long value wrap.',
  importLine: "import { KeyValueList } from '@nish/ui';",
  controls: [
    { key: 'dense', label: 'Dense', type: 'boolean' },
    { key: 'as', label: 'Element', type: 'select', options: ['ul', 'dl'] },
  ],
  initial: { dense: false, as: 'ul' },
  render: (a) => (
    <Card className="w-full max-w-sm">
      <KeyValueList items={a.as === 'dl' ? RUNNER : SERVICES} dense={!!a.dense} as={a.as === 'dl' ? 'dl' : 'ul'} />
    </Card>
  ),
  code: (a) => jsx('KeyValueList', { items: '{items}', dense: a.dense, as: a.as === 'ul' ? undefined : a.as }),
  api: { functions: [], interfaces: ['KeyValueItem'] },
  stories: [
    { id: 'status', name: 'Services and status', render: () => <Card className="w-full"><KeyValueList items={SERVICES} /></Card> },
    { id: 'dl', name: 'Description list (as="dl")', render: () => <Card className="w-full"><KeyValueList as="dl" items={RUNNER} /></Card> },
    { id: 'wrap', name: 'Long value that wraps (item.wrap)', render: () => <Card className="w-full max-w-sm"><KeyValueList as="dl" items={SYSTEM} /></Card> },
    { id: 'dense', name: 'Dense', render: () => <Card padding="sm" className="w-full"><KeyValueList dense items={RUNNER} /></Card> },
  ],
  usage: `import { Badge, KeyValueList, StatusDot } from '@nish/ui';

<KeyValueList
  items={services.map((s) => ({
    key: s.id,
    label: <><StatusDot tone={s.tone} />{s.name}</>,
    value: <Badge tone={s.tone}>{s.state}</Badge>,
  }))}
/>`,
  guidelines: [
    'The value sits on the right and does not shrink; keep it short (a Badge, a number, a word).',
    'For a long value with no spaces (a path, a URL, an id), set wrap on that item: the value breaks anywhere and the row grows, so it never sets the page width on a phone.',
    'Use as="dl" when every row reads "name: value"; the default list suits rows that are things (services, runners).',
    'Dense rows are 32px: use them only in mouse-first panels. The 44px default is the touch target size.',
  ],
};
