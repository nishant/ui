import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AsyncPanel,
  Favicon,
  LinkCard,
  ListRow,
  ResponsiveTable,
  configureFavicons,
  googleFavicon,
  type Column,
  type Sort,
} from './data';
import { chartNumber, compareValues, decimateMinMax, hostnameOf, mergeRefs, sortRows, warnOnce } from './data-classes';
import { NishProvider } from './provider';

let width = 1200;

beforeEach(() => {
  width = 1200;
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    return {
      get matches() {
        return min ? width >= Number(min[1]) : false;
      },
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
  }) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  configureFavicons({ resolve: null });
  vi.restoreAllMocks();
});

interface Item {
  id: string;
  name: string;
  qty: number | null;
}
const ITEMS: Item[] = [
  { id: 'a', name: 'item10', qty: 5 },
  { id: 'b', name: 'Item2', qty: null },
  { id: 'c', name: 'item1', qty: 20 },
  { id: 'd', name: 'Item3', qty: 1 },
];

const cols = (sortName?: (r: Item) => string | number | null, sortQty?: (r: Item) => string | number | null): Column<Item>[] => [
  { key: 'name', header: 'Name', primary: true, cell: (r) => r.name, sortValue: sortName ?? ((r) => r.name) },
  { key: 'qty', header: 'Qty', numeric: true, cell: (r) => (r.qty === null ? '-' : r.qty), sortValue: sortQty ?? ((r) => r.qty) },
];

const COLS = cols();

function names(): string[] {
  return screen.getAllByRole('row').slice(1).map((r) => r.querySelector('td')?.textContent ?? '');
}

function renderTable(props: Partial<React.ComponentProps<typeof ResponsiveTable<Item>>> = {}) {
  return render(<ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={(r) => r.id} {...props} />);
}

describe('compare and sort helpers', () => {
  it('orders numbers, strings (numeric aware, case blind) and nulls', () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
    expect(compareValues(2, 1)).toBeGreaterThan(0);
    expect(compareValues(3, 3)).toBe(0);
    expect(compareValues('item2', 'item10')).toBeLessThan(0);
    expect(compareValues('ABC', 'abc')).toBe(0);
    expect(compareValues('a', 'b')).toBeLessThan(0);
    expect(compareValues(null, 1)).toBeGreaterThan(0);
    expect(compareValues(1, null)).toBeLessThan(0);
    expect(compareValues(null, null)).toBe(0);
    expect(compareValues(10, '9')).toBeGreaterThan(0);
  });
  it('sortRows computes each key once, keeps nulls last and ties stable', () => {
    const get = vi.fn((r: Item) => r.qty);
    const asc = sortRows(ITEMS, get, 'asc').map((r) => r.id);
    expect(get).toHaveBeenCalledTimes(ITEMS.length);
    expect(asc).toEqual(['d', 'a', 'c', 'b']);
    expect(sortRows(ITEMS, (r) => r.qty, 'desc').map((r) => r.id)).toEqual(['c', 'a', 'd', 'b']);
    expect(sortRows(ITEMS, () => 1, 'asc').map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(sortRows(ITEMS, () => 1, 'desc').map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(ITEMS.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('hostnameOf reads hosts with or without a scheme', () => {
    expect(hostnameOf('https://github.com/x')).toBe('github.com');
    expect(hostnameOf('github.com')).toBe('github.com');
    expect(hostnameOf('https://')).toBeNull();
    expect(hostnameOf('://')).toBeNull();
  });
  it('mergeRefs sets object and callback refs and clears them', () => {
    const obj = createRef<HTMLElement>();
    const fn = vi.fn();
    const merged = mergeRefs<HTMLElement>(obj, fn, undefined, null);
    const el = document.createElement('i');
    merged(el);
    expect(obj.current).toBe(el);
    expect(fn).toHaveBeenCalledWith(el);
    merged(null);
    expect(obj.current).toBeNull();
    expect(fn).toHaveBeenLastCalledWith(null);
  });
  it('chartNumber groups from 1000 and rounds smaller values to two decimals', () => {
    expect(chartNumber(1234567)).toBe('1,234,567');
    expect(chartNumber(999.999)).toBe('1000');
    expect(chartNumber(1.005)).toBe('1');
    expect(chartNumber(0.126)).toBe('0.13');
    expect(chartNumber(-0.001)).toBe('0');
    expect(chartNumber(1500, 'de-DE')).toBe('1.500');
    expect(chartNumber(1.5, 'de-DE')).toBe('1,5');
  });
});

describe('decimateMinMax', () => {
  const pts = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => ({ x: i, y: f(i) }));
  it('returns short runs unchanged (as a copy)', () => {
    const p = pts(10, (i) => i);
    const out = decimateMinMax(p, 0, 9, 10);
    expect(out).toEqual(p);
    expect(out).not.toBe(p);
  });
  it('keeps at most two points per bucket and the extremes of each', () => {
    const p = pts(10000, (i) => (i === 5000 ? 1000 : i === 7000 ? -500 : 0));
    const out = decimateMinMax(p, 0, 9999, 100);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.some((q) => q.y === 1000)).toBe(true);
    expect(out.some((q) => q.y === -500)).toBe(true);
    for (let i = 1; i < out.length; i++) expect(out[i].x).toBeGreaterThanOrEqual(out[i - 1].x);
  });
  it('orders the pair of a bucket by x', () => {
    const p = [...pts(4, () => 0), { x: 4, y: 9 }, { x: 5, y: -9 }, ...pts(4, () => 0).map((q) => ({ x: q.x + 6, y: 0 }))];
    const out = decimateMinMax(p, 0, 9, 1);
    expect(out).toEqual([
      { x: 5, y: -9 },
      { x: 4, y: 9 },
    ].sort((a, b) => a.x - b.x));
  });
});

describe('ResponsiveTable sorting', () => {
  it('sorts by clicking a header: ascending, then descending, nulls last both ways', () => {
    renderTable();
    expect(names()).toEqual(['item10', 'Item2', 'item1', 'Item3']);
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(names()).toEqual(['item1', 'Item2', 'Item3', 'item10']);
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(names()).toEqual(['item10', 'Item3', 'Item2', 'item1']);
    fireEvent.click(screen.getByRole('button', { name: 'Qty' }));
    expect(names()).toEqual(['Item3', 'item10', 'item1', 'Item2']);
    fireEvent.click(screen.getByRole('button', { name: 'Qty' }));
    expect(names()).toEqual(['item1', 'item10', 'Item3', 'Item2']);
  });
  it('sets aria-sort on the sorted column only', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    const [name, qty] = screen.getAllByRole('columnheader');
    expect(name.getAttribute('aria-sort')).toBe('ascending');
    expect(qty.getAttribute('aria-sort')).toBe('none');
  });
  it('computes sort keys once per row per sort', () => {
    const name = vi.fn((r: Item) => r.name);
    const c = cols(name);
    renderTable({ columns: c });
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(name).toHaveBeenCalledTimes(ITEMS.length);
  });
  it('does not sort again when only the columns identity changes', () => {
    const name = vi.fn((r: Item) => r.name);
    const rows = ITEMS;
    const keyOf = (r: Item) => r.id;
    const { rerender } = render(<ResponsiveTable<Item> label="Items" rows={rows} columns={cols(name)} rowKey={keyOf} />);
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    const calls = name.mock.calls.length;
    expect(calls).toBe(ITEMS.length);
    rerender(<ResponsiveTable<Item> label="Items" rows={rows} columns={cols(name)} rowKey={keyOf} />);
    rerender(<ResponsiveTable<Item> label="Items" rows={rows} columns={cols(name)} rowKey={keyOf} />);
    expect(name).toHaveBeenCalledTimes(calls);
    expect(names()).toEqual(['item1', 'Item2', 'Item3', 'item10']);
  });
  it('sorts again when the rows change', () => {
    const { rerender } = renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    rerender(
      <ResponsiveTable<Item> label="Items" rows={[...ITEMS, { id: 'e', name: 'Aaa', qty: 0 }]} columns={COLS} rowKey={(r) => r.id} />,
    );
    expect(names()[0]).toBe('Aaa');
  });
  it('leaves the order to you when the sort is controlled', () => {
    const onSortChange = vi.fn();
    renderTable({ sort: { key: 'name', dir: 'asc' }, onSortChange });
    expect(names()).toEqual(['item10', 'Item2', 'item1', 'Item3']);
    expect(screen.getAllByRole('columnheader')[0].getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'desc' });
    fireEvent.click(screen.getByRole('button', { name: 'Qty' }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'qty', dir: 'asc' });
  });
  it('ignores a sort key with no sortValue', () => {
    const c: Column<Item>[] = [{ key: 'name', header: 'Name', cell: (r) => r.name }];
    renderTable({ columns: c, sort: null, onSortChange: () => undefined });
    expect(screen.queryByRole('button', { name: 'Name' })).toBeNull();
  });
  it('announces a sort change in a polite live region', () => {
    renderTable();
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(region.textContent).toBe('Sorted by Name, ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(region.textContent).toBe('Sorted by Name, descending');
  });
  it('lets sortText replace the announcement', () => {
    renderTable({ sortText: { announce: (h, d) => `${h}/${d}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Qty' }));
    expect(screen.getByRole('status').textContent).toBe('Qty/asc');
  });
});

describe('ResponsiveTable states and strings', () => {
  it('shows the empty text from the strings, or your own', () => {
    const { rerender } = renderTable({ rows: [] });
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    rerender(<ResponsiveTable<Item> label="Items" rows={[]} columns={COLS} rowKey={(r) => r.id} empty={<p>No items</p>} />);
    expect(screen.getByText('No items')).toBeTruthy();
  });
  it('reads strings from the provider', () => {
    render(
      <NishProvider strings={{ nothingHere: 'Rien ici', loadingNamed: (l) => `Chargement ${l}` }}>
        <ResponsiveTable<Item> label="Items" rows={[]} columns={COLS} rowKey={(r) => r.id} />
        <ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={(r) => r.id} loading />
      </NishProvider>,
    );
    expect(screen.getByText('Rien ici')).toBeTruthy();
    expect(screen.getByText('Chargement Items')).toBeTruthy();
  });
  it('shows an error with a retry', () => {
    const onRetry = vi.fn();
    renderTable({ error: { message: 'Boom', onRetry } });
    expect(screen.getByText('Boom')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('names the table and gives its scroll box the same name', () => {
    renderTable();
    expect(screen.getByRole('table', { name: 'Items' })).toBeTruthy();
  });
  it('forwards ref, className and rest to the root', () => {
    const ref = createRef<HTMLDivElement>();
    renderTable({ ref, className: 'extra', 'data-testid': 'root', id: 'rt' } as never);
    const root = screen.getByTestId('root');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('extra');
    expect(root.id).toBe('rt');
  });
  it('hides columns below their breakpoint and applies width, tone and numeric classes', () => {
    const c: Column<Item>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, hideBelow: 'lg', width: '8rem' },
      { key: 'qty', header: 'Qty', numeric: true, cell: (r) => r.qty },
    ];
    renderTable({ columns: c, rowTone: (r) => (r.id === 'a' ? 'ok' : undefined) });
    expect(screen.getAllByRole('columnheader')[0].className).toContain('lg:table-cell');
    expect((screen.getAllByRole('columnheader')[0] as HTMLElement).style.width).toBe('8rem');
    expect(screen.getAllByRole('cell')[1].className).toContain('text-end');
    expect(screen.getAllByRole('row')[1].className).toContain('--nish-ok-fill');
    expect(screen.getAllByRole('row')[2].className).not.toContain('--nish-ok-fill');
  });
  it('renders the table at wide widths and cards at narrow ones', () => {
    const { unmount } = renderTable();
    expect(screen.getByRole('table')).toBeTruthy();
    unmount();
    width = 400;
    renderTable();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('list', { name: 'Items' })).toBeTruthy();
  });
});

describe('ResponsiveTable rows', () => {
  it('calls onRowClick for a click, Enter and Space, and makes rows focusable', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    const row = screen.getAllByRole('row')[1];
    expect(row.getAttribute('tabindex')).toBe('0');
    fireEvent.click(row);
    expect(onRowClick).toHaveBeenLastCalledWith(ITEMS[0]);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    fireEvent.keyDown(row, { key: 'a' });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });
  it('is not interactive without a handler', () => {
    renderTable();
    expect(screen.getAllByRole('row')[1].getAttribute('tabindex')).toBeNull();
  });
  it('ignores clicks that land on a control inside the row', () => {
    const onRowClick = vi.fn();
    const c: Column<Item>[] = [{ key: 'name', header: 'Name', cell: (r) => <button type="button">{r.name}</button> }];
    renderTable({ columns: c, onRowClick });
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
  it('ignores keys pressed inside a control in the row', () => {
    const onRowClick = vi.fn();
    const c: Column<Item>[] = [{ key: 'name', header: 'Name', cell: (r) => <button type="button">{r.name}</button> }];
    renderTable({ columns: c, onRowClick });
    fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'Enter' });
    expect(onRowClick).not.toHaveBeenCalled();
  });
  it('hands a safe rowHref to onNavigate, and never to onRowClick', () => {
    const onNavigate = vi.fn();
    const onRowClick = vi.fn();
    renderTable({ rowHref: (r) => `/items/${r.id}`, onNavigate, onRowClick });
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(onNavigate).toHaveBeenCalledWith('/items/a');
    expect(onRowClick).not.toHaveBeenCalled();
  });
  it('opens a modified click in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const onNavigate = vi.fn();
    renderTable({ rowHref: (r) => `/items/${r.id}`, onNavigate });
    fireEvent.click(screen.getAllByRole('row')[1], { ctrlKey: true });
    fireEvent.click(screen.getAllByRole('row')[1], { metaKey: true });
    fireEvent.click(screen.getAllByRole('row')[1], { shiftKey: true });
    expect(open).toHaveBeenCalledTimes(3);
    expect(open).toHaveBeenCalledWith('/items/a', '_blank', 'noopener');
    expect(onNavigate).not.toHaveBeenCalled();
  });
  it.each(['javascript:alert(1)', '  JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x', 'vbscript:x'])(
    'does not navigate to the unsafe rowHref %j',
    (href) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const onNavigate = vi.fn();
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      renderTable({ rowHref: () => href, onNavigate });
      fireEvent.click(screen.getAllByRole('row')[1]);
      fireEvent.click(screen.getAllByRole('row')[1], { ctrlKey: true });
      fireEvent.keyDown(screen.getAllByRole('row')[1], { key: 'Enter' });
      expect(onNavigate).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
      warn.mockRestore();
    },
  );
  it('does not render the cells of unchanged rows again when the parent re-renders', () => {
    const cell = vi.fn((r: Item) => r.name);
    const c: Column<Item>[] = [{ key: 'name', header: 'Name', cell }];
    const keyOf = (r: Item) => r.id;
    const onRowClick = () => undefined;
    const { rerender } = render(<ResponsiveTable<Item> label="Items" rows={ITEMS} columns={c} rowKey={keyOf} onRowClick={onRowClick} />);
    const first = cell.mock.calls.length;
    expect(first).toBeGreaterThanOrEqual(ITEMS.length);
    rerender(<ResponsiveTable<Item> label="Items" rows={ITEMS} columns={c} rowKey={keyOf} onRowClick={() => undefined} />);
    expect(cell).toHaveBeenCalledTimes(first);
  });
  it('calls the newest onRowClick without rendering the rows again', () => {
    const a = vi.fn();
    const b = vi.fn();
    const keyOf = (r: Item) => r.id;
    const { rerender } = render(<ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={keyOf} onRowClick={a} />);
    rerender(<ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={keyOf} onRowClick={b} />);
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe('warnOnce', () => {
  it('warns once per key outside production and never in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    warnOnce('test-key', 'hello');
    warnOnce('test-key', 'hello');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('nish-ui: hello');
    vi.stubEnv('NODE_ENV', 'production');
    warnOnce('test-key-2', 'quiet');
    expect(warn).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});

describe('ResponsiveTable cards', () => {
  beforeEach(() => {
    width = 400;
  });
  const cardList = () => within(screen.getByRole('list', { name: 'Items' }));

  it('shows the primary column as the title and the rest as label/value pairs', () => {
    renderTable();
    const first = cardList().getAllByRole('listitem')[0];
    expect(first.textContent).toContain('item10');
    expect(first.textContent).toContain('Qty');
    expect(first.textContent).toContain('5');
  });
  it('makes cards links, buttons or plain boxes', () => {
    const onRowClick = vi.fn();
    const { unmount } = renderTable({ rowHref: (r) => `/i/${r.id}` });
    expect(cardList().getAllByRole('link')[0].getAttribute('href')).toBe('/i/a');
    unmount();
    renderTable({ onRowClick });
    fireEvent.click(cardList().getAllByRole('button')[1]);
    expect(onRowClick).toHaveBeenCalledWith(ITEMS[1]);
    cleanup();
    renderTable();
    expect(cardList().queryAllByRole('link')).toHaveLength(0);
    expect(cardList().queryAllByRole('button')).toHaveLength(0);
  });
  it('does not make a link of an unsafe rowHref', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderTable({ rowHref: () => 'javascript:alert(1)' });
    expect(cardList().queryAllByRole('link')).toHaveLength(0);
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });
  it('falls back to onRowClick when the rowHref is unsafe', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onRowClick = vi.fn();
    renderTable({ rowHref: () => 'javascript:alert(1)', onRowClick });
    fireEvent.click(cardList().getAllByRole('button')[0]);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
  it('draws the tone edge at the start', () => {
    renderTable({ rowTone: () => 'loss' });
    expect(cardList().getAllByRole('listitem')[0].firstElementChild?.className).toContain('border-s-[var(--nish-loss-fill)]');
  });
  it('uses renderCard when given', () => {
    renderTable({ renderCard: (r) => <b>card {r.id}</b> });
    expect(screen.getByText('card a')).toBeTruthy();
  });
  it('sorts with the select and the direction button, and says so', () => {
    renderTable();
    const select = screen.getByLabelText('Sort by') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(within(select).getByText('Default')).toBeTruthy();
    const dir = screen.getByRole('button', { name: 'Sorted ascending, switch to descending' }) as HTMLButtonElement;
    expect(dir.disabled).toBe(true);
    fireEvent.change(select, { target: { value: 'name' } });
    expect(cardList().getAllByRole('listitem')[0].textContent).toContain('item1');
    expect(screen.getByRole('status').textContent).toBe('Sorted by Name, ascending');
    fireEvent.click(screen.getByRole('button', { name: 'Sorted ascending, switch to descending' }));
    expect(cardList().getAllByRole('listitem')[0].textContent).toContain('item10');
    expect(screen.getByRole('button', { name: 'Sorted descending, switch to ascending' })).toBeTruthy();
    fireEvent.change(select, { target: { value: '' } });
    expect(screen.getByRole('status').textContent).toBe('Sorting cleared');
  });
  it('translates the sort controls through the provider and sortText', () => {
    render(
      <NishProvider strings={{ sortBy: 'Trier par', sortDefault: 'Défaut' }}>
        <ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={(r) => r.id} sortText={{ toggle: (d) => `dir ${d}` }} />
      </NishProvider>,
    );
    expect(screen.getByLabelText('Trier par')).toBeTruthy();
    expect(screen.getByText('Défaut')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'dir null' })).toBeTruthy();
  });
  it('has no sort menu without sortable columns', () => {
    renderTable({ columns: [{ key: 'name', header: 'Name', cell: (r) => r.name }] });
    expect(screen.queryByLabelText('Sort by')).toBeNull();
  });
  it('follows a controlled sort', () => {
    const sort: Sort = { key: 'qty', dir: 'desc' };
    renderTable({ sort, onSortChange: () => undefined });
    expect((screen.getByLabelText('Sort by') as HTMLSelectElement).value).toBe('qty');
    expect(screen.getByRole('button', { name: 'Sorted descending, switch to ascending' })).toBeTruthy();
  });
});

describe('ListRow', () => {
  const wrap = (ui: ReactNode) => render(<ul>{ui}</ul>);
  it('forwards ref and rest to the wrapper and keeps className on the row', () => {
    const ref = createRef<HTMLElement>();
    wrap(<ListRow ref={ref} title="T" className="row-x" data-testid="li" id="l1" />);
    const li = screen.getByTestId('li');
    expect(ref.current).toBe(li);
    expect(li.tagName).toBe('LI');
    expect(li.id).toBe('l1');
    expect(li.className).toContain('min-w-0');
    expect(li.firstElementChild?.className).toContain('row-x');
  });
  it('renders a div wrapper on request', () => {
    render(<ListRow as="div" title="T" data-testid="d" />);
    expect(screen.getByTestId('d').tagName).toBe('DIV');
  });
  it('is a link with a chevron, a button, or a plain row', () => {
    wrap(
      <>
        <ListRow title="Link" href="/a" />
        <ListRow title="Button" onClick={() => undefined} />
        <ListRow title="Plain" />
      </>,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/a');
    expect(link.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeNull();
    expect(screen.getByText('Plain').closest('li')!.querySelector('a,button')).toBeNull();
  });
  it('shows the chevron on a button when asked, and hides it on a link when not', () => {
    wrap(
      <>
        <ListRow title="B" onClick={() => undefined} chevron />
        <ListRow title="L" href="/x" chevron={false} />
      </>,
    );
    expect(screen.getByRole('button').querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('link').querySelector('svg')).toBeNull();
  });
  it.each(['javascript:alert(1)', ' javascript:alert(1)', 'data:text/html,x'])('does not link to %j', (href) => {
    wrap(<ListRow title="T" href={href} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(document.querySelector('[href^="javascript"]')).toBeNull();
  });
  it('falls back to the button when the href is unsafe', () => {
    const onClick = vi.fn();
    wrap(<ListRow title="T" href="javascript:alert(1)" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('opens an external link in a new tab with no opener', () => {
    wrap(<ListRow title="T" href="https://example.com" external chevron />);
    const a = screen.getByRole('link');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.querySelectorAll('svg')).toHaveLength(1);
  });
  it('marks the active row with aria-current and a forced-colors outline', () => {
    wrap(<ListRow title="T" href="/x" active subtitle="S" meta="M" />);
    const a = screen.getByRole('link');
    expect(a.getAttribute('aria-current')).toBe('true');
    expect(a.className).toContain('forced-colors:outline');
    expect(screen.getByText('S').className).toContain('text-th-hi2');
    expect(screen.getByText('M').className).toContain('text-th-hi2');
    expect(screen.getByText('M').className).toContain('text-end');
  });
  it('is quiet when inactive', () => {
    wrap(<ListRow title="T" href="/x" subtitle="S" meta="M" />);
    expect(screen.getByRole('link').getAttribute('aria-current')).toBeNull();
    expect(screen.getByText('S').className).toContain('text-th-hi3');
    expect(screen.getByRole('link').className).toContain('text-start');
  });
  it('sizes: default 52px, dense and compact 44px', () => {
    wrap(
      <>
        <ListRow title="a" href="/a" />
        <ListRow title="b" href="/b" dense />
        <ListRow title="c" href="/c" compact subtitle="s" />
      </>,
    );
    const [a, b, c] = screen.getAllByRole('link');
    expect(a.className).toContain('min-h-[52px]');
    expect(b.className).toContain('min-h-11');
    expect(c.className).toContain('min-h-11');
    expect(c.className).toContain('py-1.5');
    expect(screen.getByText('c').className).toContain('text-2xs');
    expect(screen.getByText('s').className).toContain('text-3xs');
  });
  it('turns the title red for danger and clamps two lines', () => {
    wrap(<ListRow title="T" tone="danger" titleLines={2} />);
    expect(screen.getByText('T').className).toContain('text-th-loss');
    expect(screen.getByText('T').className).toContain('line-clamp-2');
  });
  it('shows icon, trailing and meta', () => {
    wrap(<ListRow title="T" icon={<i data-testid="ic" />} trailing={<b data-testid="tr" />} meta="M" />);
    expect(screen.getByTestId('ic')).toBeTruthy();
    expect(screen.getByTestId('tr')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
  });
});

describe('Favicon', () => {
  const imgs = () => document.querySelectorAll('img');

  it('makes no image request by default and shows a letter avatar', () => {
    const { container } = render(<Favicon url="https://github.com" />);
    expect(imgs()).toHaveLength(0);
    expect(container.textContent).toBe('G');
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
  it('uses the label for the letter and picks a stable chart color', () => {
    const { container, rerender } = render(<Favicon url="https://github.com" label="Wikipedia" size={20} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.textContent).toBe('W');
    expect(el.style.width).toBe('20px');
    expect(el.style.height).toBe('20px');
    expect(el.style.fontSize).toBe('12px');
    const color = el.style.color;
    expect(color).toMatch(/^var\(--nish-chart-[1-8]\)$/);
    rerender(<Favicon url="https://github.com" label="Wikipedia" size={20} />);
    expect((container.firstElementChild as HTMLElement).style.color).toBe(color);
  });
  it('falls back to ? and skips www', () => {
    const { container, rerender } = render(<Favicon url="https://www.mozilla.org" />);
    expect(container.textContent).toBe('M');
    rerender(<Favicon url="://" />);
    expect(container.textContent).toBe('?');
  });
  it('loads a src you give, lazily, without a referrer', () => {
    render(<Favicon url="https://github.com" src="https://cdn.example/g.png" size={24} />);
    const img = imgs()[0];
    expect(img.getAttribute('src')).toBe('https://cdn.example/g.png');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('width')).toBe('24');
    expect(img.getAttribute('height')).toBe('24');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(img.className).toContain('opacity-0');
    fireEvent.load(img);
    expect(imgs()[0].className).toContain('opacity-100');
  });
  it('falls back to the letter when the image fails', () => {
    const { container } = render(<Favicon url="https://github.com" src="https://cdn.example/g.png" />);
    fireEvent.error(imgs()[0]);
    expect(imgs()).toHaveLength(0);
    expect(container.textContent).toBe('G');
  });
  it('tries again when the src changes after a failure', () => {
    const { rerender } = render(<Favicon url="https://github.com" src="https://cdn.example/a.png" />);
    fireEvent.error(imgs()[0]);
    expect(imgs()).toHaveLength(0);
    rerender(<Favicon url="https://github.com" src="https://cdn.example/b.png" />);
    expect(imgs()[0].getAttribute('src')).toBe('https://cdn.example/b.png');
  });
  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', ' vbscript:x', ''])('ignores the unsafe src %j', (src) => {
    const { container } = render(<Favicon url="https://github.com" src={src} />);
    expect(imgs()).toHaveLength(0);
    expect(container.textContent).toBe('G');
  });
  it('asks a resolve prop with the host and size', () => {
    const resolve = vi.fn((host: string, size: number) => `https://icons.example/${host}/${size}.png`);
    render(<Favicon url="https://github.com/a/b?q=1" size={20} resolve={resolve} />);
    expect(resolve).toHaveBeenCalledWith('github.com', 20);
    expect(imgs()[0].getAttribute('src')).toBe('https://icons.example/github.com/20.png');
  });
  it('shows the letter when resolve returns null or an unsafe URL', () => {
    const { rerender, container } = render(<Favicon url="https://github.com" resolve={() => null} />);
    expect(imgs()).toHaveLength(0);
    rerender(<Favicon url="https://github.com" resolve={() => 'javascript:alert(1)'} />);
    expect(imgs()).toHaveLength(0);
    expect(container.textContent).toBe('G');
  });
  it('uses the configured resolver, and googleFavicon asks Google only when configured', () => {
    configureFavicons({ resolve: googleFavicon });
    render(<Favicon url="https://github.com/x" size={16} />);
    expect(imgs()[0].getAttribute('src')).toBe('https://www.google.com/s2/favicons?sz=32&domain=github.com');
    cleanup();
    render(<Favicon url="https://github.com/x" size={24} />);
    expect(imgs()[0].getAttribute('src')).toBe('https://www.google.com/s2/favicons?sz=64&domain=github.com');
    cleanup();
    configureFavicons({ resolve: null });
    render(<Favicon url="https://github.com/x" />);
    expect(imgs()).toHaveLength(0);
  });
  it('lets resolve win over the configured resolver and src win over both', () => {
    configureFavicons({ resolve: googleFavicon });
    render(<Favicon url="https://github.com" resolve={() => 'https://own.example/i.png'} />);
    expect(imgs()[0].getAttribute('src')).toBe('https://own.example/i.png');
    cleanup();
    render(<Favicon url="https://github.com" src="/local.png" resolve={() => 'https://own.example/i.png'} />);
    expect(imgs()[0].getAttribute('src')).toBe('/local.png');
  });
  it('googleFavicon encodes the host and picks 32 or 64', () => {
    expect(googleFavicon('a b.example', 16)).toBe('https://www.google.com/s2/favicons?sz=32&domain=a%20b.example');
    expect(googleFavicon('x', 16)).toContain('sz=32');
    expect(googleFavicon('x', 17)).toContain('sz=64');
  });
  it('forwards ref, className, style and rest on both the avatar and the image', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<Favicon url="https://github.com" ref={ref} className="extra" data-testid="f" style={{ margin: 3 }} />);
    expect(ref.current).toBe(screen.getByTestId('f'));
    expect(ref.current?.tagName).toBe('SPAN');
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.style.margin).toBe('3px');
    rerender(<Favicon url="https://github.com" src="/a.png" ref={ref} className="extra" data-testid="f" style={{ margin: 3 }} />);
    expect(ref.current?.tagName).toBe('IMG');
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.style.margin).toBe('3px');
  });
});

describe('LinkCard', () => {
  it('is an anchor to a safe href, and a row until its parent is wide', () => {
    render(<LinkCard href="/a" title="Alpha" blurb="First" />);
    const a = screen.getByRole('link', { name: /Alpha/ });
    expect(a.getAttribute('href')).toBe('/a');
    expect(a.className).toContain('min-h-16');
    expect(a.className).toContain('text-start');
  });
  it('lays out as a card on request', () => {
    render(<LinkCard href="/a" title="Alpha" layout="card" meta="meta" status={{ tone: 'ok', label: 'Up' }} />);
    expect(screen.getByRole('link').className).toContain('flex-col');
    expect(screen.getByText('meta')).toBeTruthy();
    expect(screen.getByText('Up')).toBeTruthy();
  });
  it('stays a row when forced, even with a wide parent', () => {
    render(<LinkCard href="/a" title="Alpha" layout="row" />);
    expect(screen.getByRole('link').className).not.toContain('flex-col');
  });
  it('turns wide when the parent is 600px or more', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(700);
    render(<LinkCard href="/a" title="Alpha" />);
    expect(screen.getByRole('link').className).toContain('flex-col');
  });
  it('stays a row below 600px', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(599);
    render(<LinkCard href="/a" title="Alpha" />);
    expect(screen.getByRole('link').className).not.toContain('flex-col');
  });
  it.each(['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x'])('is not a link for %j', (href) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<LinkCard href={href} title="Alpha" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(document.querySelector('a')).toBeNull();
    expect(screen.getByText('Alpha').closest('[aria-disabled="true"]')).not.toBeNull();
  });
  it('is not a link when disabled', () => {
    render(<LinkCard href="/a" title="Alpha" disabled />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Alpha').closest('[aria-disabled]')?.className).toContain('border-dashed');
  });
  it('opens external links in a new tab with no opener', () => {
    render(<LinkCard href="https://example.com" title="Alpha" external />);
    const a = screen.getByRole('link');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('shows an icon tile with the accent color', () => {
    render(<LinkCard href="/a" title="Alpha" icon={<svg data-testid="ic" />} accent="chart-3" />);
    const tile = screen.getByTestId('ic').parentElement as HTMLElement;
    expect(tile.getAttribute('aria-hidden')).toBe('true');
    expect(tile.style.color).toBe('var(--nish-chart-3)');
  });
  it('shows a Favicon in the tile on request, using the configured resolver', () => {
    render(<LinkCard href="https://github.com/x" title="GitHub" favicon />);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByRole('link').textContent).toContain('G');
    cleanup();
    configureFavicons({ resolve: googleFavicon });
    render(<LinkCard href="https://github.com/x" title="GitHub" favicon />);
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('domain=github.com');
    expect(img.getAttribute('width')).toBe('20');
  });
  it('prefers an icon you give over the favicon', () => {
    render(<LinkCard href="/a" title="Alpha" favicon icon={<svg data-testid="ic" />} />);
    expect(screen.getByTestId('ic')).toBeTruthy();
  });
  it('forwards ref, className and rest on the anchor and on the unavailable box', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<LinkCard ref={ref} href="/a" title="A" className="extra" data-testid="lc" />);
    expect(ref.current).toBe(screen.getByTestId('lc'));
    expect(ref.current?.tagName).toBe('A');
    expect(ref.current?.className).toContain('extra');
    rerender(<LinkCard ref={ref} href="/a" title="A" disabled className="extra" data-testid="lc" />);
    expect(ref.current?.tagName).toBe('SPAN');
    expect(ref.current?.className).toContain('extra');
  });
});

describe('AsyncPanel', () => {
  it('shows the loading skeleton and marks itself busy', () => {
    render(<AsyncPanel status="loading" data-testid="p" />);
    expect(screen.getByTestId('p').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('shows your skeleton instead', () => {
    render(<AsyncPanel status="loading" skeleton={<i>wait</i>} />);
    expect(screen.getByText('wait')).toBeTruthy();
  });
  it('shows the children when ready, and is not busy', () => {
    render(
      <AsyncPanel status="ready" data-testid="p">
        <p>done</p>
      </AsyncPanel>,
    );
    expect(screen.getByText('done')).toBeTruthy();
    expect(screen.getByTestId('p').getAttribute('aria-busy')).toBeNull();
  });
  it('shows the error with an optional title and a retry', () => {
    const onRetry = vi.fn();
    render(<AsyncPanel status="error" error={{ title: 'Oops', message: 'Bad', onRetry }} />);
    expect(screen.getByText('Oops: Bad')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('uses the failedToLoad and nothingHere strings, from a provider too', () => {
    const { rerender } = render(<AsyncPanel status="error" />);
    expect(screen.getByText('Failed to load')).toBeTruthy();
    rerender(<AsyncPanel status="empty" />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    rerender(
      <NishProvider strings={{ failedToLoad: 'Échec', nothingHere: 'Rien' }}>
        <AsyncPanel status="error" />
        <AsyncPanel status="empty" />
      </NishProvider>,
    );
    expect(screen.getByText('Échec')).toBeTruthy();
    expect(screen.getByText('Rien')).toBeTruthy();
  });
  it('shows your empty state with a description and action', () => {
    render(<AsyncPanel status="empty" empty={{ title: 'None', description: 'Add one', action: <button>Add</button> }} />);
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('Add one')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<AsyncPanel ref={ref} status="ready" className="extra" data-testid="p" id="ap" />);
    expect(ref.current).toBe(screen.getByTestId('p'));
    expect(ref.current?.className).toBe('extra');
    expect(ref.current?.id).toBe('ap');
  });
});

describe('server rendering', () => {
  it('renders every data component to a string without throwing', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <>
        <ResponsiveTable<Item> label="Items" rows={ITEMS} columns={COLS} rowKey={(r) => r.id} onRowClick={() => undefined} />
        <ul>
          <ListRow title="Row" href="/x" />
        </ul>
        <Favicon url="https://github.com" />
        <LinkCard href="/x" title="Card" favicon />
        <AsyncPanel status="empty" />
      </>,
    );
    expect(html).toContain('Row');
    expect(html).toContain('Card');
    expect(html).not.toContain('<img');
  });
});
