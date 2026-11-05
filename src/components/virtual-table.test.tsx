import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Column, Sort } from './data';
import { NishProvider } from './provider';
import type { VirtualListHandle } from './virtual';
import { VirtualTable } from './virtual-table';

// happy-dom has no layout: the scroll box is 400px tall, the header 40px, the tbody sits under the header.
const BOX = 400;
const HEAD = 40;

interface Row {
  id: string;
  name: string;
  qty: number;
}

const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Name ${String(i).padStart(4, '0')}`, qty: (i * 37) % 101 }));

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name, sortValue: (r) => r.name },
  { key: 'qty', header: 'Qty', numeric: true, cell: (r) => r.qty, sortValue: (r) => r.qty },
  { key: 'btn', header: 'Action', cell: (r) => <button type="button">Go {r.id}</button> },
];
const rowKey = (r: Row) => r.id;

let restore: (() => void)[] = [];
let scrollBy: ReturnType<typeof vi.fn>;

const isScroller = (el: Element) => el.classList.contains('nish-scroll-fade');

function stubLayout() {
  const rect = HTMLElement.prototype.getBoundingClientRect;
  const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  const by = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollBy');
  scrollBy = vi.fn(function (this: HTMLElement, opts: ScrollToOptions) {
    this.scrollTop += opts.top ?? 0;
  });
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    let top = 0;
    if (this.tagName === 'TBODY') {
      const scroller = this.parentElement?.parentElement;
      top = HEAD - (scroller?.scrollTop ?? 0);
    }
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON() {} } as DOMRect;
  };
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isScroller(this) ? BOX : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === 'THEAD' ? HEAD : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, writable: true, value: scrollBy });
  restore.push(() => {
    HTMLElement.prototype.getBoundingClientRect = rect;
    if (client) Object.defineProperty(HTMLElement.prototype, 'clientHeight', client);
    if (offset) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offset);
    if (by) Object.defineProperty(HTMLElement.prototype, 'scrollBy', by);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollBy;
  });
}

beforeEach(() => {
  stubLayout();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  restore.forEach((fn) => fn());
  restore = [];
});

const bodyRows = (c: ParentNode) => Array.from(c.querySelectorAll<HTMLElement>('tbody tr[data-index]'));
const indexes = (c: ParentNode) => bodyRows(c).map((r) => Number(r.dataset.index));
const tabbable = (c: ParentNode) => bodyRows(c).filter((r) => r.tabIndex === 0).map((r) => Number(r.dataset.index));

// The stubbed scrollBy moves scrollTop; a browser would also fire the scroll event.
function flush() {
  const scroller = document.querySelector<HTMLElement>('.nish-scroll-fade');
  act(() => {
    if (scroller) fireEvent.scroll(scroller);
    vi.advanceTimersByTime(40);
  });
}

describe('VirtualTable markup', () => {
  it('passes ref, className and rest to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { getByTestId } = render(
      <VirtualTable ref={ref} id="v" data-testid="vt" className="mine" label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} height={BOX} />,
    );
    const root = getByTestId('vt');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('v');
    expect(root.className).toContain('mine');
  });

  it('sets aria-rowcount and aria-rowindex on the header and rows', () => {
    const { container, getByRole } = render(<VirtualTable label="Rows" rows={makeRows(50)} columns={columns} rowKey={rowKey} height={BOX} />);
    expect(getByRole('table').getAttribute('aria-rowcount')).toBe('51');
    expect(container.querySelector('thead tr')?.getAttribute('aria-rowindex')).toBe('1');
    const rows = bodyRows(container);
    expect(rows[0].getAttribute('aria-rowindex')).toBe('2');
    expect(rows[3].getAttribute('aria-rowindex')).toBe('5');
  });

  it('renders only the rows in range with aria-hidden spacers', () => {
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} />);
    const rows = indexes(container);
    expect(rows.length).toBeLessThan(30);
    expect(rows[0]).toBe(0);
    const spacers = container.querySelectorAll<HTMLElement>('tr[data-virtual-spacer]');
    expect(spacers).toHaveLength(1);
    expect(spacers[0].getAttribute('aria-hidden')).toBe('true');
    const cell = spacers[0].firstElementChild as HTMLElement;
    expect(cell.style.height).toBe(`${(2000 - rows.length) * 41}px`);
  });

  it('adds a top spacer after scrolling', () => {
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} />);
    const scroller = container.querySelector<HTMLElement>('.nish-scroll-fade')!;
    act(() => {
      scroller.scrollTop = 4100;
      fireEvent.scroll(scroller);
      vi.advanceTimersByTime(40);
    });
    const rows = indexes(container);
    expect(rows[0]).toBeGreaterThan(80);
    expect(rows).not.toContain(0);
    const spacers = container.querySelectorAll('tr[data-virtual-spacer]');
    expect(spacers).toHaveLength(2);
  });

  it('stripes by row index', () => {
    const { container } = render(<VirtualTable zebra label="Rows" rows={makeRows(6)} columns={columns} rowKey={rowKey} height={BOX} />);
    const rows = bodyRows(container);
    expect(rows[0].className).not.toContain('bg-th-elevated/50');
    expect(rows[1].className).toContain('bg-th-elevated/50');
    expect(rows[2].className).not.toContain('bg-th-elevated/50');
    expect(rows[3].className).toContain('bg-th-elevated/50');
  });

  it('uses 33px rows when dense', () => {
    const { container } = render(<VirtualTable dense label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} />);
    const n = indexes(container).length;
    const cell = container.querySelector<HTMLElement>('tr[data-virtual-spacer] td')!;
    expect(cell.style.height).toBe(`${(2000 - n) * 33}px`);
  });
});

describe('VirtualTable states', () => {
  it('shows skeleton rows while loading', () => {
    const { getByText, queryByRole } = render(<VirtualTable loading label="Trades" rows={makeRows(5)} columns={columns} rowKey={rowKey} />);
    expect(getByText('Loading Trades')).toBeTruthy();
    expect(queryByRole('table')).toBeNull();
  });

  it('shows the empty state or a custom empty node', () => {
    const first = render(<VirtualTable label="Rows" rows={[]} columns={columns} rowKey={rowKey} />);
    expect(first.getByText('Nothing here yet')).toBeTruthy();
    expect(first.queryByRole('table')).toBeNull();
    first.unmount();
    const second = render(<VirtualTable label="Rows" rows={[]} columns={columns} rowKey={rowKey} empty={<p>No trades</p>} />);
    expect(second.getByText('No trades')).toBeTruthy();
  });

  it('shows the error state and wins over rows', () => {
    const onRetry = vi.fn();
    const { getByRole, queryByRole } = render(
      <VirtualTable label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} error={{ message: 'Broke', onRetry }} />,
    );
    expect(getByRole('alert').textContent).toContain('Broke');
    expect(queryByRole('table')).toBeNull();
    fireEvent.click(getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('lets loading win over rows and empty', () => {
    const { queryByRole } = render(<VirtualTable loading label="Rows" rows={[]} columns={columns} rowKey={rowKey} />);
    expect(queryByRole('table')).toBeNull();
  });
});

describe('VirtualTable sorting', () => {
  it('sorts by a header click and announces it', () => {
    const rows = makeRows(10);
    const { container, getByRole } = render(
      <NishProvider strings={{ sortAnnounce: (h, d) => `SORT ${h} ${d}` }}>
        <VirtualTable label="Rows" rows={rows} columns={columns} rowKey={rowKey} height={BOX} />
      </NishProvider>,
    );
    const names = () => bodyRows(container).map((r) => r.querySelector('td')?.textContent);
    expect(names()[0]).toBe('Name 0000');
    const qtyHeader = container.querySelectorAll('th')[1];
    fireEvent.click(qtyHeader.querySelector('button')!);
    expect(qtyHeader.getAttribute('aria-sort')).toBe('ascending');
    const asc = rows.map((r) => r.qty).sort((a, b) => a - b);
    expect(bodyRows(container).map((r) => Number(r.querySelectorAll('td')[1].textContent))).toEqual(asc);
    expect(getByRole('status').textContent).toBe('SORT Qty asc');
    fireEvent.click(qtyHeader.querySelector('button')!);
    expect(qtyHeader.getAttribute('aria-sort')).toBe('descending');
    expect(getByRole('status').textContent).toBe('SORT Qty desc');
  });

  it('uses the default announcement', () => {
    const { container, getByRole } = render(<VirtualTable label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} height={BOX} />);
    fireEvent.click(container.querySelectorAll('th')[0].querySelector('button')!);
    expect(getByRole('status').textContent).toBe('Sorted by Name, ascending');
  });

  it('calls onSortChange without re-sorting when controlled', () => {
    const onSortChange = vi.fn();
    const sort: Sort = null;
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} height={BOX} sort={sort} onSortChange={onSortChange} />);
    fireEvent.click(container.querySelectorAll('th')[1].querySelector('button')!);
    expect(onSortChange).toHaveBeenCalledWith({ key: 'qty', dir: 'asc' });
    expect(indexes(container).slice(0, 3)).toEqual([0, 1, 2]);
    expect(bodyRows(container)[0].querySelector('td')?.textContent).toBe('Name 0000');
    expect(container.querySelectorAll('th')[1].getAttribute('aria-sort')).toBe('none');
  });
});

describe('VirtualTable rows', () => {
  it('has no tab stop or handlers without onRowClick', () => {
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} height={BOX} />);
    expect(bodyRows(container).every((r) => !r.hasAttribute('tabindex'))).toBe(true);
  });

  it('moves the roving tab stop with the arrow keys, End, Home and Page Down', () => {
    const onRowClick = vi.fn();
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} onRowClick={onRowClick} />);
    expect(tabbable(container)).toEqual([0]);
    const row = (i: number) => container.querySelector<HTMLElement>(`tr[data-index="${i}"]`)!;
    row(0).focus();
    fireEvent.keyDown(row(0), { key: 'ArrowDown' });
    flush();
    expect(tabbable(container)).toEqual([1]);
    expect(document.activeElement).toBe(row(1));
    expect(scrollBy).not.toHaveBeenCalled();
    fireEvent.keyDown(row(1), { key: 'ArrowUp' });
    flush();
    expect(tabbable(container)).toEqual([0]);
    fireEvent.keyDown(row(0), { key: 'PageDown' });
    flush();
    // (400 - 40) / 41 = 8 rows
    expect(tabbable(container)).toEqual([8]);
    expect(scrollBy).toHaveBeenCalled();
    fireEvent.keyDown(row(8), { key: 'End' });
    flush();
    expect(tabbable(container)).toEqual([1999]);
    expect(document.activeElement).toBe(row(1999));
    fireEvent.keyDown(row(1999), { key: 'ArrowDown' });
    flush();
    expect(tabbable(container)).toEqual([1999]);
    fireEvent.keyDown(row(1999), { key: 'Home' });
    flush();
    expect(tabbable(container)).toEqual([0]);
    expect(document.activeElement).toBe(row(0));
    expect(scrollBy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('calls onRowClick on Enter, Space and click with the row and index', () => {
    const onRowClick = vi.fn();
    const rows = makeRows(10);
    const { container } = render(<VirtualTable label="Rows" rows={rows} columns={columns} rowKey={rowKey} height={BOX} onRowClick={onRowClick} />);
    const row = (i: number) => container.querySelector<HTMLElement>(`tr[data-index="${i}"]`)!;
    fireEvent.keyDown(row(2), { key: 'Enter' });
    expect(onRowClick).toHaveBeenLastCalledWith(rows[2], 2);
    fireEvent.keyDown(row(3), { key: ' ' });
    expect(onRowClick).toHaveBeenLastCalledWith(rows[3], 3);
    fireEvent.click(row(4).querySelector('td')!);
    expect(onRowClick).toHaveBeenLastCalledWith(rows[4], 4);
    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(tabbable(container)).toEqual([4]);
  });

  it('ignores a click or key from a button inside a cell', () => {
    const onRowClick = vi.fn();
    const { container, getByText } = render(<VirtualTable label="Rows" rows={makeRows(5)} columns={columns} rowKey={rowKey} height={BOX} onRowClick={onRowClick} />);
    const button = getByText('Go r1');
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(onRowClick).not.toHaveBeenCalled();
    expect(tabbable(container)).toEqual([0]);
  });

  it('applies the row tone', () => {
    const { container } = render(
      <VirtualTable label="Rows" rows={makeRows(3)} columns={columns} rowKey={rowKey} height={BOX} rowTone={(r) => (r.id === 'r1' ? 'loss' : undefined)} />,
    );
    const rows = bodyRows(container);
    expect(rows[1].className).toContain('border-s-');
    expect(rows[0].className).not.toContain('border-s-[3px]');
  });

  it('exposes scrollToIndex through apiRef', () => {
    const api = createRef<VirtualListHandle>();
    render(<VirtualTable label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} apiRef={api} />);
    act(() => api.current!.scrollToIndex(1000, { align: 'start' }));
    expect(scrollBy).toHaveBeenCalled();
  });

  it('hides hideBelow columns in header and cells alike', () => {
    const cols: Column<Row>[] = [...columns.slice(0, 2), { key: 'x', header: 'Note', hideBelow: 'md', cell: () => 'n' }];
    const { container } = render(<VirtualTable label="Rows" rows={makeRows(2)} columns={cols} rowKey={rowKey} height={BOX} />);
    expect(container.querySelectorAll('th')[2].className).toContain('hidden md:table-cell');
    expect(container.querySelectorAll('tbody tr[data-index]')[0].querySelectorAll('td')[2].className).toContain('hidden md:table-cell');
  });
});

describe('VirtualTable server render', () => {
  it('renders the first rows to a string with no DOM', () => {
    const html = renderToString(<VirtualTable label="Rows" rows={makeRows(2000)} columns={columns} rowKey={rowKey} height={BOX} />);
    expect(html).toContain('aria-rowcount="2001"');
    expect(html).toContain('Name 0000');
    expect(html).not.toContain('Name 0100');
    expect(html).toContain('data-virtual-spacer');
  });
});
