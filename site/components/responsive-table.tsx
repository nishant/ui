import { useState } from 'react';
import { Badge, ResponsiveTable, type Column, type Sort } from '../../src';
import { money, pct } from '../../src/format';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- ResponsiveTable ------------------------------------------------------------------------

interface Position {
  symbol: string;
  name: string;
  qty: number;
  price: number;
  day: number;
  sector: string;
  status: 'ok' | 'warn' | 'loss';
}

const ROWS: Position[] = [
  { symbol: 'NVDA', name: 'NVIDIA', qty: 40, price: 182.4, day: 0.021, sector: 'Tech', status: 'ok' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', qty: 120, price: 178.9, day: -0.012, sector: 'Tech', status: 'loss' },
  { symbol: 'XOM', name: 'Exxon Mobil', qty: 75, price: 112.3, day: 0.004, sector: 'Energy', status: 'ok' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', qty: 30, price: 158.05, day: -0.002, sector: 'Health', status: 'warn' },
  { symbol: 'JPM', name: 'JPMorgan Chase', qty: 55, price: 241.7, day: 0.009, sector: 'Finance', status: 'ok' },
];

const COLUMNS: Column<Position>[] = [
  { key: 'symbol', header: 'Symbol', primary: true, cell: (r) => <span className="font-semibold text-th-hi">{r.symbol}</span>, sortValue: (r) => r.symbol },
  { key: 'name', header: 'Name', secondary: true, hideBelow: 'lg', cell: (r) => r.name, sortValue: (r) => r.name },
  { key: 'sector', header: 'Sector', hideBelow: 'md', cell: (r) => <Badge>{r.sector}</Badge>, sortValue: (r) => r.sector },
  { key: 'qty', header: 'Shares', numeric: true, cell: (r) => r.qty, sortValue: (r) => r.qty },
  { key: 'price', header: 'Price', numeric: true, cell: (r) => money(r.price), sortValue: (r) => r.price },
  { key: 'day', header: 'Day', numeric: true, cell: (r) => <span className={r.day < 0 ? 'text-th-loss' : 'text-th-ok'}>{pct(r.day, { signed: true })}</span>, sortValue: (r) => r.day },
  { key: 'value', header: 'Value', numeric: true, cell: (r) => money(r.qty * r.price), sortValue: (r) => r.qty * r.price },
];

type Mode = 'data' | 'loading' | 'empty' | 'error';

function Demo({ mode = 'data', link = false, tone = false, sticky = false, minWidth }: { mode?: Mode; link?: boolean; tone?: boolean; sticky?: boolean; minWidth?: number }) {
  const [sort, setSort] = useState<Sort>(null);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
      <ResponsiveTable<Position>
        label="Positions"
        rows={mode === 'empty' ? [] : ROWS}
        columns={COLUMNS}
        rowKey={(r) => r.symbol}
        loading={mode === 'loading'}
        error={mode === 'error' ? { message: 'Could not load positions.', onRetry: () => undefined } : null}
        rowHref={link ? (r) => `#/components/responsive-table?open=${r.symbol}` : undefined}
        onRowClick={link ? undefined : (r) => setPicked(r.symbol)}
        rowTone={tone ? (r) => r.status : undefined}
        sort={sort}
        onSortChange={setSort}
        stickyFirstColumn={sticky}
        minWidth={minWidth}
      />
      {picked ? <p className="text-sm text-th-hi3">Opened {picked}.</p> : null}
    </div>
  );
}

export const responsiveTable: ComponentDoc = {
  id: 'responsive-table',
  name: 'ResponsiveTable',
  exports: ['ResponsiveTable'],
  summary:
    'A table on wide screens and a list of cards on phones, from one column definition. Sortable headers (and a Sort by menu in card mode), clickable or linked rows, a status edge per row, and loading, empty and error states built in. Replaces hand-rolled mobile card layouts next to desktop tables.',
  importLine: "import { ResponsiveTable } from '@nish/ui';",
  controls: [
    { key: 'mode', label: 'State', type: 'select', options: ['data', 'loading', 'empty', 'error'] },
    { key: 'link', label: 'Rows are links', type: 'boolean' },
    { key: 'tone', label: 'Status edge', type: 'boolean' },
    { key: 'sticky', label: 'Sticky first column', type: 'boolean' },
  ],
  initial: { mode: 'data', link: false, tone: true, sticky: false },
  render: (a) => <Demo mode={a.mode as Mode} link={!!a.link} tone={!!a.tone} sticky={!!a.sticky} />,
  code: (a) =>
    [
      '<ResponsiveTable',
      '  label="Positions"',
      '  rows={positions}',
      '  columns={columns}',
      '  rowKey={(r) => r.symbol}',
      ...(a.link ? ['  rowHref={(r) => `/positions/${r.symbol}`}'] : ['  onRowClick={(r) => open(r.symbol)}']),
      ...(a.tone ? ["  rowTone={(r) => (r.pnl < 0 ? 'loss' : 'ok')}"] : []),
      ...(a.sticky ? ['  stickyFirstColumn'] : []),
      ...(a.mode === 'loading' ? ['  loading'] : []),
      ...(a.mode === 'error' ? ['  error={{ message: "Could not load positions.", onRetry: refetch }}'] : []),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'phone',
      name: 'Phone: cards (360px)',
      note: 'Below md the rows are cards: the primary column is the title, the secondary the subtitle, the rest a label/value grid. A Sort by menu replaces the header.',
      render: () => (
        <Device doc="responsive-table" story="phone" height={560} title="ResponsiveTable at 360px">
          <div className="px-[var(--nish-page-gutter)] py-4">
            <Demo tone />
          </div>
        </Device>
      ),
    },
    {
      id: 'unfolded',
      name: 'Unfolded: table (840px)',
      note: 'From md a real table. The Sector column hides below md, Name below lg.',
      wide: true,
      render: () => (
        <Device doc="responsive-table" story="unfolded" width={840} height={380} title="ResponsiveTable at 840px">
          <div className="px-[var(--nish-page-gutter)] py-4">
            <Demo tone />
          </div>
        </Device>
      ),
    },
    {
      id: 'desktop',
      name: 'Desktop: every column (1280px)',
      wide: true,
      render: () => (
        <Device doc="responsive-table" story="desktop" width={1280} height={340} title="ResponsiveTable at 1280px">
          <div className="px-[var(--nish-page-gutter)] py-4">
            <Demo tone />
          </div>
        </Device>
      ),
    },
    {
      id: 'sticky',
      name: 'Sticky first column',
      note: 'With a minWidth wider than the screen, the table scrolls sideways and the symbol stays.',
      wide: true,
      render: () => (
        <Device doc="responsive-table" story="sticky" width={840} height={300} title="ResponsiveTable with a sticky first column">
          <div className="px-[var(--nish-page-gutter)] py-4">
            <Demo sticky minWidth={1000} />
          </div>
        </Device>
      ),
    },
    { id: 'loading', name: 'Loading', render: () => <Demo mode="loading" /> },
    { id: 'empty', name: 'Empty', render: () => <Demo mode="empty" /> },
    { id: 'error', name: 'Error', render: () => <Demo mode="error" /> },
  ],
  usage: `import { ResponsiveTable, type Column } from '@nish/ui';
import { money } from '@nish/ui/format';

const columns: Column<Position>[] = [
  { key: 'symbol', header: 'Symbol', primary: true, cell: (r) => r.symbol, sortValue: (r) => r.symbol },
  { key: 'name', header: 'Name', secondary: true, hideBelow: 'lg', cell: (r) => r.name },
  { key: 'price', header: 'Price', numeric: true, cell: (r) => money(r.price), sortValue: (r) => r.price },
];

<ResponsiveTable
  label="Positions"
  rows={positions}
  columns={columns}
  rowKey={(r) => r.symbol}
  rowHref={(r) => \`/positions/\${r.symbol}\`}
  loading={query.isPending}
  error={query.error ? { message: query.error.message, onRetry: query.refetch } : null}
/>`,
  guidelines: [
    'Mark one column primary and at most one secondary: that is the card\'s title and subtitle on a phone.',
    'Give numeric columns numeric: they right-align with tabular figures and never wrap.',
    'Without sort or onSortChange the table sorts itself with each column\'s sortValue; control it when the server sorts.',
    'rowTone is a 3px edge only. Say the status in a cell too; color alone is not an answer.',
    'cardsBelow moves the switch point (sm, md or lg); a table with many columns wants lg.',
  ],
};
