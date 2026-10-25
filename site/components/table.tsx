import { useState } from 'react';
import { Badge, Card } from '../../src';
import { Table, TableWrap, Td, Th, Tr } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Table primitives ---------------------------------------------------------------

type Row = { sym: string; qty: number; price: number; pnl: number };
const ROWS: Row[] = [
  { sym: 'AAPL', qty: 40, price: 231.42, pnl: 812.4 },
  { sym: 'MSFT', qty: 15, price: 428.1, pnl: -120.75 },
  { sym: 'NVDA', qty: 60, price: 141.88, pnl: 2310 },
  { sym: 'TSLA', qty: 10, price: 251.05, pnl: -644.2 },
  { sym: 'VTI', qty: 120, price: 288.6, pnl: 0 },
];
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + money(Math.abs(n));
const pnlClass = (n: number) => (n > 0 ? 'text-th-ok' : n < 0 ? 'text-th-loss' : 'text-th-hi3');

function Positions({ dense = false, zebra = false, tones = false }: { dense?: boolean; zebra?: boolean; tones?: boolean }) {
  return (
    <TableWrap minWidth={440} className="w-full">
      <Table dense={dense} zebra={zebra}>
        <thead>
          <tr>
            <Th>Symbol</Th>
            <Th numeric>Qty</Th>
            <Th numeric>Price</Th>
            <Th numeric>P&amp;L</Th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <Tr key={r.sym} tone={tones ? (r.pnl > 0 ? 'ok' : r.pnl < 0 ? 'loss' : undefined) : undefined}>
              <Td className="font-medium text-th-hi">{r.sym}</Td>
              <Td numeric>{r.qty}</Td>
              <Td numeric>{money(r.price)}</Td>
              <Td numeric className={pnlClass(r.pnl)}>
                {signed(r.pnl)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}

function Sortable() {
  const [sort, setSort] = useState<{ key: keyof Row; dir: 'asc' | 'desc' }>({ key: 'pnl', dir: 'desc' });
  const rows = [...ROWS].sort((a, b) => {
    const d = a[sort.key] < b[sort.key] ? -1 : a[sort.key] > b[sort.key] ? 1 : 0;
    return sort.dir === 'asc' ? d : -d;
  });
  const th = (key: keyof Row, label: string, numeric = false) => (
    <Th
      numeric={numeric}
      sort={sort.key === key ? sort.dir : false}
      onSort={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}
    >
      {label}
    </Th>
  );
  return (
    <TableWrap minWidth={440} className="w-full">
      <Table>
        <thead>
          <tr>
            {th('sym', 'Symbol')}
            {th('qty', 'Qty', true)}
            {th('price', 'Price', true)}
            {th('pnl', 'P&L', true)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.sym}>
              <Td className="font-medium text-th-hi">{r.sym}</Td>
              <Td numeric>{r.qty}</Td>
              <Td numeric>{money(r.price)}</Td>
              <Td numeric className={pnlClass(r.pnl)}>
                {signed(r.pnl)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}

export const table: ComponentDoc = {
  id: 'table',
  name: 'Table',
  exports: ['TableWrap', 'Table', 'Th', 'Td', 'Tr'],
  summary:
    'Plain <table> markup with the shared look: a scroll box, uppercase headers, tabular numbers, sortable columns with aria-sort, and status edges. tableClass has the same recipes as strings for TanStack Table.',
  importLine: "import { TableWrap, Table, Th, Td, Tr, tableClass } from '@nish/ui';",
  controls: [
    { key: 'dense', label: 'Dense', type: 'boolean' },
    { key: 'zebra', label: 'Zebra', type: 'boolean' },
    { key: 'tones', label: 'Row tones', type: 'boolean' },
  ],
  initial: { dense: false, zebra: false, tones: false },
  render: (a) => <Positions dense={!!a.dense} zebra={!!a.zebra} tones={!!a.tones} />,
  code: (a) =>
    `<TableWrap minWidth={440}>
  ${jsx('Table', { dense: a.dense || undefined, zebra: a.zebra || undefined }, '…')}
</TableWrap>`,
  api: { functions: [], interfaces: [] },
  stories: [
    { id: 'default', name: 'Default', wide: true, render: () => <Positions /> },
    { id: 'dense-zebra', name: 'Dense and zebra', wide: true, render: () => <Positions dense zebra /> },
    { id: 'sortable', name: 'Sortable', note: 'Headers are buttons; the th reports aria-sort.', wide: true, render: () => <Sortable /> },
    {
      id: 'rows',
      name: 'Row tones, muted and interactive',
      wide: true,
      render: () => (
        <TableWrap className="w-full">
          <Table>
            <thead>
              <tr>
                <Th>Site</Th>
                <Th>Status</Th>
                <Th numeric>Response</Th>
              </tr>
            </thead>
            <tbody>
              <Tr tone="ok" interactive>
                <Td>
                  <a href="#" className="font-medium text-th-hi hover:underline">
                    jobs.nish.software
                  </a>
                </Td>
                <Td>
                  <Badge tone="ok">Up</Badge>
                </Td>
                <Td numeric>41 ms</Td>
              </Tr>
              <Tr tone="warn" interactive>
                <Td>
                  <a href="#" className="font-medium text-th-hi hover:underline">
                    mc.nish.software
                  </a>
                </Td>
                <Td>
                  <Badge tone="warn">Slow</Badge>
                </Td>
                <Td numeric>612 ms</Td>
              </Tr>
              <Tr tone="loss" interactive>
                <Td>
                  <a href="#" className="font-medium text-th-hi hover:underline">
                    trackers.nish.software
                  </a>
                </Td>
                <Td>
                  <Badge tone="loss">Down</Badge>
                </Td>
                <Td numeric>timeout</Td>
              </Tr>
              <Tr muted>
                <Td>old.nish.software</Td>
                <Td>Archived</Td>
                <Td numeric>n/a</Td>
              </Tr>
            </tbody>
          </Table>
        </TableWrap>
      ),
    },
    {
      id: 'sticky',
      name: 'Sticky header',
      wide: true,
      render: () => (
        <TableWrap maxHeight={200} stickyHeader className="w-full">
          <Table dense>
            <thead>
              <tr>
                <Th>Check</Th>
                <Th numeric>Response</Th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 14 }, (_, i) => (
                <Tr key={i}>
                  <Td>Oct 24, {String(3 + Math.floor(i / 12)).padStart(1, '0')}:{String((i * 5) % 60).padStart(2, '0')} pm</Td>
                  <Td numeric>{40 + ((i * 7) % 23)} ms</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ),
    },
    {
      id: 'card',
      name: 'Edge to edge in a card',
      wide: true,
      render: () => (
        <Card padded={false} className="w-full overflow-hidden">
          <div className="border-b border-th-line px-4 py-3 text-sm font-semibold text-th-hi">Positions</div>
          <div className="overflow-x-auto">
            <Table>
              <tbody>
                {ROWS.slice(0, 3).map((r) => (
                  <Tr key={r.sym}>
                    <Td className="font-medium text-th-hi">{r.sym}</Td>
                    <Td numeric className={pnlClass(r.pnl)}>
                      {signed(r.pnl)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { TableWrap, Table, Th, Td, Tr, tableClass } from '@nish/ui';

<TableWrap minWidth={640} maxHeight="60vh" stickyHeader>
  <Table dense>
    <thead><tr><Th>Symbol</Th><Th numeric sort={dir} onSort={flip}>P&L</Th></tr></thead>
    <tbody>{rows.map((r) => <Tr key={r.id} tone={r.alert}>…</Tr>)}</tbody>
  </Table>
</TableWrap>

// TanStack Table: the same recipes as strings
<th className={cn(tableClass.th, tableClass.padY.normal, isNum && tableClass.numeric)}>`,
  guidelines: [
    'Give wide tables a minWidth so phones scroll sideways inside the box instead of squeezing columns.',
    'Number columns use numeric: right-aligned with tabular figures, header included.',
    'Row tones are an extra cue; say the status in a cell as well.',
    'An interactive row still needs a real link or button inside it for keyboard users.',
  ],
};
