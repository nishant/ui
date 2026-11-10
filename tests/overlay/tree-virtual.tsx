import { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  Button,
  ContextMenu,
  HoverCard,
  MenuItem,
  MenuSeparator,
  TreeView,
  VirtualList,
  VirtualTable,
  type Column,
  type TreeNode,
  type VirtualListHandle,
} from '../../src';

const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'AVGO'];

interface Trade {
  id: string;
  symbol: string;
  qty: number;
}

const FILES: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button.tsx', label: 'button.tsx' },
          { id: 'table.tsx', label: 'table.tsx' },
          { id: 'tree-view.tsx', label: 'tree-view.tsx' },
        ],
      },
      { id: 'index.ts', label: 'index.ts' },
      { id: 'theme.ts', label: 'theme.ts' },
    ],
  },
  { id: 'site', label: 'site', children: [{ id: 'main.tsx', label: 'main.tsx' }] },
  { id: 'package.json', label: 'package.json' },
  { id: 'README.md', label: 'README.md' },
];

const columns: Column<Trade>[] = [
  { key: 'symbol', header: 'Symbol', cell: (r) => r.symbol, sortValue: (r) => r.symbol },
  { key: 'qty', header: 'Qty', numeric: true, cell: (r) => r.qty, sortValue: (r) => r.qty },
];
const rowKey = (r: Trade) => r.id;

function Harness() {
  const api = useRef<VirtualListHandle>(null);
  const [clicked, setClicked] = useState<number | null>(null);
  const [activated, setActivated] = useState('');
  const [last, setLast] = useState('');
  const rows = useMemo<Trade[]>(
    () => Array.from({ length: 5000 }, (_, i) => ({ id: `t${i}`, symbol: SYMBOLS[i % 10]!, qty: ((i * 37) % 500) + 1 })),
    [],
  );

  return (
    <main className="grid gap-6 p-6" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <section className="flex flex-col gap-2">
        <h2>Fixed list</h2>
        <VirtualList
          aria-label="Fixed rows"
          count={10000}
          itemSize={40}
          height={320}
          renderItem={(i) => (
            <div className="flex h-10 items-center px-3">
              <button type="button">Row {i + 1}</button>
            </div>
          )}
          apiRef={api}
        />
        <div>
          <Button onClick={() => api.current?.scrollToIndex(4999, { align: 'start' })}>Jump to 5000</Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Measured list</h2>
        <VirtualList
          aria-label="Measured rows"
          count={2000}
          itemSize={48}
          gap={8}
          measure
          height={320}
          renderItem={(i) => <div className="max-w-64 px-3 py-2 text-sm">{'Line. '.repeat((i % 4) + 1)}</div>}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2>Table</h2>
        <VirtualTable label="Trades" rows={rows} columns={columns} rowKey={rowKey} height={320} onRowClick={(_, i) => setClicked(i)} />
        <p data-testid="clicked">{clicked}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Tree</h2>
        <TreeView aria-label="Files" items={FILES} defaultExpanded={['src']} onActivate={(n) => setActivated(n.label)} />
        <p data-testid="activated">{activated}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Context menu</h2>
        <ContextMenu
          menu={
            <>
              <MenuItem onSelect={() => setLast('Rename')}>Rename</MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => setLast('Delete')}>Delete</MenuItem>
            </>
          }
        >
          <div tabIndex={0} className="grid h-32 w-64 place-items-center rounded-lg border border-th-line">
            Right-click here
          </div>
        </ContextMenu>
        <p data-testid="last">{last}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Hover card</h2>
        <div>
          <HoverCard openDelay={100} closeDelay={100} content={<p>Apple Inc. · NASDAQ</p>}>
            <a href="#aapl">AAPL</a>
          </HoverCard>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
