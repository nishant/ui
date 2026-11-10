import { useState } from 'react';
import { VirtualTable } from '../../src/components/virtual-table';
import type { Column } from '../../src';
import type { ComponentDoc } from './types';

// --- VirtualTable ---------------------------------------------------------------------------

const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'AVGO'];

interface Trade {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  qty: number;
  price: number;
  note: string;
  tone: 'loss' | undefined;
}

function makeTrades(count: number): Trade[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i}`,
    symbol: SYMBOLS[i % 10],
    side: i % 3 === 0 ? 'Sell' : 'Buy',
    qty: ((i * 37) % 500) + 1,
    price: 50 + ((i * 7919) % 45000) / 100,
    note: i % 4 === 0 ? 'Partial fill, rest cancelled after 30 minutes' : 'Filled at market',
    tone: i % 17 === 0 ? 'loss' : undefined,
  }));
}

const TRADES = makeTrades(5000);

const columns: Column<Trade>[] = [
  { key: 'symbol', header: 'Symbol', width: '8rem', cell: (t) => <span className="font-medium text-th-hi">{t.symbol}</span>, sortValue: (t) => t.symbol },
  { key: 'side', header: 'Side', width: '6rem', cell: (t) => t.side },
  { key: 'qty', header: 'Qty', numeric: true, cell: (t) => t.qty, sortValue: (t) => t.qty },
  { key: 'price', header: 'Price', numeric: true, cell: (t) => t.price.toFixed(2), sortValue: (t) => t.price },
  { key: 'note', header: 'Note', hideBelow: 'md', cell: (t) => t.note },
];

const measuredColumns: Column<Trade>[] = columns.map((c) => (c.key === 'note' ? { ...c, hideBelow: undefined } : c));

const rowKey = (t: Trade) => t.id;
const rowTone = (t: Trade) => t.tone;

function Preview({ rows, dense, zebra, stickyFirstColumn }: { rows: number; dense: boolean; zebra: boolean; stickyFirstColumn: boolean }) {
  return (
    <div className="w-full min-w-0">
      <VirtualTable
        label="Trades"
        rows={rows === 5000 ? TRADES : TRADES.slice(0, rows)}
        columns={columns}
        rowKey={rowKey}
        rowTone={rowTone}
        height={400}
        dense={dense}
        zebra={zebra}
        stickyFirstColumn={stickyFirstColumn}
      />
    </div>
  );
}

function ClickablePreview() {
  const [opened, setOpened] = useState<number | null>(null);
  return (
    <div className="grid w-full min-w-0 gap-2">
      <VirtualTable
        label="Trades"
        rows={TRADES}
        columns={columns}
        rowKey={rowKey}
        rowTone={rowTone}
        height={320}
        stickyFirstColumn
        onRowClick={(_, i) => setOpened(i + 1)}
      />
      {opened !== null ? <p className="text-sm text-th-hi3">Opened row {opened}</p> : null}
    </div>
  );
}

export const virtualTable: ComponentDoc = {
  id: 'virtual-table',
  name: 'VirtualTable',
  exports: ['VirtualTable'],
  summary:
    'A table of thousands of rows that renders only what is on screen, with the same columns as ResponsiveTable: a sticky header, sorting, row tones, a pinned first column, and arrow-key navigation when rows are clickable.',
  importLine: "import { VirtualTable } from '@nish/ui';",
  controls: [
    { key: 'rows', label: 'Rows', type: 'number', min: 0, max: 5000 },
    { key: 'dense', label: 'Dense', type: 'boolean' },
    { key: 'zebra', label: 'Zebra', type: 'boolean' },
    { key: 'stickyFirstColumn', label: 'Sticky first column', type: 'boolean' },
  ],
  initial: { rows: 5000, dense: false, zebra: false, stickyFirstColumn: true },
  render: (a) => <Preview rows={Number(a.rows)} dense={Boolean(a.dense)} zebra={Boolean(a.zebra)} stickyFirstColumn={Boolean(a.stickyFirstColumn)} />,
  code: (a) =>
    [
      '<VirtualTable',
      '  label="Trades"',
      '  rows={trades}',
      '  columns={columns}',
      '  rowKey={tradeId}',
      '  height={400}',
      ...(a.dense ? ['  dense'] : []),
      ...(a.zebra ? ['  zebra'] : []),
      ...(a.stickyFirstColumn ? ['  stickyFirstColumn'] : []),
      '/>',
    ].join('\n'),
  stories: [
    { id: 'default', name: '5,000 trades', render: () => <Preview rows={5000} dense={false} zebra={false} stickyFirstColumn /> },
    { id: 'dense', name: 'Dense and striped', render: () => <Preview rows={5000} dense zebra stickyFirstColumn={false} /> },
    {
      id: 'clickable',
      name: 'Clickable rows',
      note: 'Arrow keys, Page Up/Down, Home and End move between rows; Enter opens.',
      render: () => <ClickablePreview />,
    },
    {
      id: 'measured',
      name: 'Wrapping notes, measured',
      render: () => (
        <div className="w-full min-w-0">
          <VirtualTable label="Trades" rows={TRADES} columns={measuredColumns} rowKey={rowKey} height={320} measure />
        </div>
      ),
    },
    {
      id: 'loading',
      name: 'Loading',
      render: () => (
        <div className="w-full min-w-0">
          <VirtualTable label="Trades" rows={[]} columns={columns} rowKey={rowKey} loading />
        </div>
      ),
    },
    {
      id: 'empty',
      name: 'No rows',
      render: () => (
        <div className="w-full min-w-0">
          <VirtualTable label="Trades" rows={[]} columns={columns} rowKey={rowKey} />
        </div>
      ),
    },
  ],
  usage: `import { VirtualTable, type Column } from '@nish/ui';

const columns: Column<Trade>[] = [
  { key: 'symbol', header: 'Symbol', width: '8rem', cell: (t) => t.symbol, sortValue: (t) => t.symbol },
  { key: 'qty', header: 'Qty', numeric: true, cell: (t) => t.qty, sortValue: (t) => t.qty },
  { key: 'price', header: 'Price', numeric: true, cell: (t) => t.price.toFixed(2), sortValue: (t) => t.price },
];

const tradeId = (t: Trade) => t.id; // keep rowKey stable

export function Trades({ trades }: { trades: Trade[] }) {
  return (
    <VirtualTable
      label="Trades"
      rows={trades}
      columns={columns}
      rowKey={tradeId}
      height={480}
      stickyFirstColumn
      onRowClick={(t) => navigate(\`/trades/\${t.id}\`)}
    />
  );
}`,
  guidelines: [
    'Under a few hundred rows use ResponsiveTable, which turns into cards on phones. VirtualTable stays a table at every width and scrolls sideways inside its box on a phone; pin the first column with stickyFirstColumn.',
    'Columns keep their width while rows come and go (fixed table layout): give narrow and wide columns a width.',
    'Rows are 41px (33px dense, 44px when clickable). Fixed-height rows stay on one line. Set rowHeight when your cells are taller, or measure when they wrap.',
    'With onRowClick, one row is in the Tab order: arrow keys, Page Up, Page Down, Home and End move between rows, and Enter or Space opens one.',
    "Screen readers hear the full row count (aria-rowcount) and each row's position (aria-rowindex), even though only nearby rows are in the page.",
  ],
};
