import { useRef } from 'react';
import { Button, EmptyState } from '../../src';
import { VirtualList, type VirtualListHandle } from '../../src/components/virtual';
import type { ComponentDoc } from './types';

// --- VirtualList ----------------------------------------------------------------------

const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'AVGO'];

function position(i: number) {
  return {
    symbol: SYMBOLS[i % 10],
    qty: ((i * 37) % 500) + 1,
    price: (50 + ((i * 7919) % 45000) / 100).toFixed(2),
  };
}

function PositionRow({ index }: { index: number }) {
  const { symbol, qty, price } = position(index);
  return (
    <div className="flex h-11 items-center justify-between gap-3 border-b border-th-line px-3 text-sm">
      <span className="font-medium text-th-hi">{symbol}</span>
      <span className="tabular-nums text-th-hi2">
        {qty} @ {price}
      </span>
    </div>
  );
}

const renderPosition = (i: number) => <PositionRow index={i} />;

const NOTES = [
  'Bought on the dip.',
  'Held through earnings; trim if it passes the target price, and revisit the stop once the quarter closes.',
  'Core position. Added in three lots over two weeks, the last one after the guidance raise, so the average cost sits well below the current price and the stop stays loose.',
];

function NoteRow({ index }: { index: number }) {
  const { symbol, qty, price } = position(index);
  return (
    <div className="rounded-lg border border-th-line bg-th-elevated px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-th-hi">{symbol}</span>
        <span className="tabular-nums text-th-hi2">
          {qty} @ {price}
        </span>
      </div>
      <p className="mt-1 text-th-hi3">{NOTES[index % 3]}</p>
    </div>
  );
}

const renderNote = (i: number) => <NoteRow index={i} />;

function PositionsPreview({ count, itemSize, overscan, measure }: { count: number; itemSize: number; overscan: number; measure: boolean }) {
  return (
    <div className="w-full">
      <VirtualList
        aria-label="Positions"
        count={count}
        itemSize={itemSize}
        overscan={overscan}
        measure={measure}
        height={360}
        renderItem={renderPosition}
        className="rounded-lg border border-th-line"
      />
    </div>
  );
}

function MeasuredPreview() {
  return (
    <div className="w-full">
      <VirtualList aria-label="Positions with notes" count={2000} itemSize={56} gap={8} measure height={360} renderItem={renderNote} />
    </div>
  );
}

function JumpPreview() {
  const api = useRef<VirtualListHandle>(null);
  return (
    <div className="grid w-full gap-3">
      <div>
        <Button size="sm" onClick={() => api.current?.scrollToIndex(4999, { align: 'center' })}>
          Go to row 5,000
        </Button>
      </div>
      <VirtualList
        aria-label="Positions"
        count={10000}
        itemSize={44}
        height={300}
        apiRef={api}
        renderItem={renderPosition}
        className="rounded-lg border border-th-line"
      />
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="w-full">
      <VirtualList aria-label="Positions" count={0} itemSize={44} height={200} empty={<EmptyState title="No positions" />} renderItem={renderPosition} />
    </div>
  );
}

export const virtualList: ComponentDoc = {
  id: 'virtual-list',
  name: 'VirtualList',
  exports: ['VirtualList'],
  api: { functions: [], interfaces: ['VirtualListHandle', 'ScrollToIndexOptions'] },
  summary:
    'A long list that renders only the rows near the screen, so 10,000 rows scroll like 30. Fixed or measured row heights, its own scroll box or the page, the focused row stays mounted, and scrollToIndex jumps to any row.',
  importLine: "import { VirtualList } from '@nish/ui';",
  controls: [
    { key: 'count', label: 'Rows', type: 'number', min: 0, max: 100000 },
    { key: 'itemSize', label: 'Row height', type: 'number', min: 32, max: 80 },
    { key: 'overscan', label: 'Overscan', type: 'number', min: 0, max: 20 },
    { key: 'measure', label: 'Measure', type: 'boolean' },
  ],
  initial: { count: 10000, itemSize: 44, overscan: 6, measure: false },
  render: (a) => <PositionsPreview count={Number(a.count)} itemSize={Number(a.itemSize)} overscan={Number(a.overscan)} measure={Boolean(a.measure)} />,
  code: (a) =>
    [
      '<VirtualList',
      '  aria-label="Positions"',
      `  count={${Number(a.count)}}`,
      `  itemSize={${Number(a.itemSize)}}`,
      ...(Number(a.overscan) === 6 ? [] : [`  overscan={${Number(a.overscan)}}`]),
      ...(a.measure ? ['  measure'] : []),
      '  height={360}',
      '  renderItem={renderItem} // stable: wrap it in useCallback, as in the usage block below',
      '/>',
    ].join('\n'),
  stories: [
    { id: 'fixed', name: '10,000 fixed rows', render: () => <PositionsPreview count={10000} itemSize={44} overscan={6} measure={false} /> },
    { id: 'measured', name: 'Measured rows that wrap', note: 'itemSize is the estimate; each rendered row is measured.', render: () => <MeasuredPreview /> },
    { id: 'jump', name: 'Jump to a row', render: () => <JumpPreview /> },
    { id: 'empty', name: 'Empty', render: () => <EmptyPreview /> },
  ],
  usage: `import { useCallback } from 'react';
import { VirtualList } from '@nish/ui';

export function Positions({ rows }: { rows: Position[] }) {
  const renderItem = useCallback((i: number) => <PositionRow row={rows[i]} />, [rows]);
  const itemKey = useCallback((i: number) => rows[i].id, [rows]);
  return <VirtualList aria-label="Positions" count={rows.length} itemKey={itemKey} itemSize={44} renderItem={renderItem} />;
}`,
  guidelines: [
    'Reach for it past a few hundred rows. Below that, a plain list is simpler and browser Find sees every row.',
    'Set itemSize to the real row height, without the gap (use gap for spacing). Rows that wrap or expand need measure; itemSize is then the estimate.',
    'Leave out height to scroll with the page, which is best on phones. Set it for a box inside a card or a sidebar.',
    'Rows are divs with role="listitem": render a div row inside, not ListRow (an li).',
    'Keep renderItem, itemKey and an itemSize function stable with useCallback; a new function rebuilds every offset.',
    'Rows off screen are not in the page: Find, the Tab order and screen readers reach the rendered rows only. Offer search or filters for long lists. Each row reports its position (aria-posinset of aria-setsize).',
    'Use onRangeChange to load the next page when the range end nears count.',
    'A page-scrolling list (no height) clears the sticky header (--nish-header-h plus --nish-sticky-extra) and the bottom nav (--nish-bottom-inset) in scrollToIndex and in the band it counts as visible.',
  ],
};
