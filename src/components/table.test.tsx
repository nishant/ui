import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Table, TableWrap, Td, Th, Tr, tableClass } from './table';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function table(ui: React.ReactNode) {
  return render(
    <TableWrap>
      <Table>
        <thead>
          <tr>{ui}</tr>
        </thead>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>
    </TableWrap>,
  );
}

describe('tableClass', () => {
  it('uses logical alignment and tokens', () => {
    expect(tableClass.th).toContain('text-start');
    expect(tableClass.th).not.toContain('text-left');
    expect(tableClass.numeric).toContain('text-end');
    expect(tableClass.sticky).toContain('z-[var(--nish-z-sticky,1)]');
    expect(tableClass.tone.ok).toContain('--nish-ok-fill');
    expect(tableClass.tone.warn).toContain('--nish-warn-fill');
    expect(tableClass.tone.loss).toContain('--nish-loss-fill');
    expect(tableClass.tone.ok).toContain('rtl:');
    expect(tableClass.tone.ok).toContain('forced-colors:');
    expect(tableClass.padY).toEqual({ normal: 'py-2.5', dense: 'py-1.5' });
  });
});

describe('TableWrap', () => {
  it('forwards ref, className, style and rest props', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TableWrap ref={ref} className="extra" data-testid="w" id="w1" style={{ color: 'red' }} />);
    const el = screen.getByTestId('w');
    expect(ref.current).toBe(el);
    expect(el.id).toBe('w1');
    expect(el.className).toContain('extra');
    expect(el.className).toContain('overflow-auto');
    expect(el.style.color).toBe('red');
  });
  it('sets the min width variable and the max height', () => {
    const { rerender } = render(<TableWrap data-testid="w" minWidth={640} maxHeight={300} />);
    const el = screen.getByTestId('w');
    expect(el.style.getPropertyValue('--nish-table-min')).toBe('640px');
    expect(el.style.maxHeight).toBe('300px');
    expect(el.className).toContain('[&>table]:min-w-[var(--nish-table-min)]');
    rerender(<TableWrap data-testid="w" minWidth="40rem" />);
    expect(screen.getByTestId('w').style.getPropertyValue('--nish-table-min')).toBe('40rem');
  });
  it('adds the fade, sticky header and sticky column classes only on request', () => {
    const { rerender } = render(<TableWrap data-testid="w" />);
    expect(screen.getByTestId('w').className).toContain('nish-scroll-fade');
    expect(screen.getByTestId('w').className).not.toContain('sticky');
    rerender(<TableWrap data-testid="w" fade={false} stickyHeader stickyFirstColumn />);
    const cls = screen.getByTestId('w').className;
    expect(cls).not.toContain('nish-scroll-fade');
    expect(cls).toContain('[&_thead_th]:sticky');
    expect(cls).toContain('[&_tr>:first-child]:start-0');
    expect(screen.getByTestId('w').style.getPropertyValue('--nish-fade-start')).toBe('');
    rerender(<TableWrap data-testid="w" stickyFirstColumn />);
    expect(screen.getByTestId('w').style.getPropertyValue('--nish-fade-start')).toBe('#000');
  });
  it('is not focusable while the table fits', () => {
    render(<TableWrap data-testid="w" label="Orders" />);
    const el = screen.getByTestId('w');
    expect(el.getAttribute('tabindex')).toBeNull();
    expect(el.getAttribute('role')).toBeNull();
  });
  it('becomes a focusable labelled region while the table overflows', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    render(<TableWrap data-testid="w" label="Orders" />);
    const el = screen.getByTestId('w');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Orders');
  });
  it('takes the name from aria-label and skips the region role without one', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const { unmount } = render(<TableWrap data-testid="w" aria-label="Named" />);
    expect(screen.getByTestId('w').getAttribute('role')).toBe('region');
    unmount();
    render(<TableWrap data-testid="w" />);
    expect(screen.getByTestId('w').getAttribute('tabindex')).toBe('0');
    expect(screen.getByTestId('w').getAttribute('role')).toBeNull();
  });
});

describe('Table', () => {
  it('forwards ref and rest, merges className, and stripes on request', () => {
    const ref = createRef<HTMLTableElement>();
    render(<Table ref={ref} className="extra" zebra data-testid="t" aria-label="T" />);
    const el = screen.getByTestId('t');
    expect(ref.current).toBe(el);
    expect(el.className).toContain('extra');
    expect(el.className).toContain('tabular-nums');
    expect(el.className).toContain('nth-child(even)');
    expect(el.getAttribute('aria-label')).toBe('T');
  });
  it('dense rows use the tighter padding in th and td', () => {
    render(
      <Table dense>
        <thead>
          <tr>
            <Th>H</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>C</Td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByText('H').className).toContain('py-1.5');
    expect(screen.getByText('C').className).toContain('py-1.5');
  });
  it('normal rows use the roomier padding', () => {
    table(<Th>H</Th>);
    expect(screen.getByText('H').className).toContain('py-2.5');
  });
});

describe('Th', () => {
  it('has scope col and no aria-sort when it does not sort', () => {
    table(<Th>Name</Th>);
    const th = screen.getByText('Name');
    expect(th.getAttribute('scope')).toBe('col');
    expect(th.getAttribute('aria-sort')).toBeNull();
    expect(th.querySelector('button')).toBeNull();
  });
  it('lets scope be overridden', () => {
    table(<Th scope="row">Name</Th>);
    expect(screen.getByText('Name').getAttribute('scope')).toBe('row');
  });
  it.each([
    ['asc', 'ascending'],
    ['desc', 'descending'],
  ] as const)('reports aria-sort for %s', (sort, label) => {
    table(<Th sort={sort}>Name</Th>);
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe(label);
  });
  it('reports none for a sortable column that is not sorted', () => {
    table(<Th sort={false}>Name</Th>);
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('none');
  });
  it('shows a sort button that calls onSort', () => {
    const onSort = vi.fn();
    table(<Th onSort={onSort}>Name</Th>);
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('none');
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });
  it('highlights the sorted header button', () => {
    table(<Th sort="asc" onSort={() => undefined}>Name</Th>);
    expect(screen.getByRole('button').className).toContain('text-th-hi');
  });
  it('aligns with logical classes', () => {
    table(
      <>
        <Th>A</Th>
        <Th numeric>B</Th>
        <Th align="center">C</Th>
        <Th align="right">D</Th>
        <Th numeric align="left">
          E
        </Th>
      </>,
    );
    expect(screen.getByText('A').className).toContain('text-start');
    expect(screen.getByText('B').className).toContain('text-end');
    expect(screen.getByText('B').className).toContain('tabular-nums');
    expect(screen.getByText('C').className).toContain('text-center');
    expect(screen.getByText('D').className).toContain('text-end');
    expect(screen.getByText('E').className).toContain('text-start');
  });
  it('reverses a right-aligned sort button so the mark stays on the outside', () => {
    table(<Th numeric onSort={() => undefined}>N</Th>);
    expect(screen.getByRole('button').className).toContain('flex-row-reverse');
  });
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLTableCellElement>();
    table(
      <Th ref={ref} className="extra" data-testid="th">
        H
      </Th>,
    );
    expect(ref.current).toBe(screen.getByTestId('th'));
    expect(ref.current?.className).toContain('extra');
  });
});

describe('Td', () => {
  it('aligns and keeps numbers on one line', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td>A</Td>
            <Td numeric>B</Td>
            <Td align="center" nowrap>
              C
            </Td>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByText('A').className).toContain('text-start');
    expect(screen.getByText('A').className).not.toContain('whitespace-nowrap');
    expect(screen.getByText('B').className).toContain('text-end');
    expect(screen.getByText('B').className).toContain('whitespace-nowrap');
    expect(screen.getByText('C').className).toContain('text-center');
    expect(screen.getByText('C').className).toContain('whitespace-nowrap');
  });
  it('forwards ref, className, colSpan and data attributes', () => {
    const ref = createRef<HTMLTableCellElement>();
    render(
      <table>
        <tbody>
          <tr>
            <Td ref={ref} className="extra" colSpan={2} data-x="1">
              C
            </Td>
          </tr>
        </tbody>
      </table>,
    );
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.getAttribute('colspan')).toBe('2');
    expect(ref.current?.getAttribute('data-x')).toBe('1');
  });
});

describe('Tr', () => {
  const row = (props: React.ComponentProps<typeof Tr>) =>
    render(
      <table>
        <tbody>
          <Tr data-testid="r" {...props}>
            <td>x</td>
          </Tr>
        </tbody>
      </table>,
    ).getByTestId('r');
  it('has a divider and nothing else by default', () => {
    const r = row({});
    expect(r.className).toContain('border-b');
    expect(r.className).not.toContain('cursor-pointer');
    expect(r.className).not.toContain('shadow-');
  });
  it('is interactive, muted and toned on request', () => {
    expect(row({ interactive: true }).className).toContain('cursor-pointer');
    cleanup();
    expect(row({ muted: true }).className).toContain('text-th-hi3');
    cleanup();
    expect(row({ tone: 'loss' }).className).toContain('--nish-loss-fill');
    cleanup();
    expect(row({ tone: 'warn' }).className).toContain('--nish-warn-fill');
  });
  it('forwards ref, onClick and className', () => {
    const ref = createRef<HTMLTableRowElement>();
    const onClick = vi.fn();
    const r = row({ ref, onClick, className: 'extra' });
    fireEvent.click(r);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(r);
    expect(r.className).toContain('extra');
  });
});

describe('row tone in forced colors', () => {
  it('draws the forced-colors edge on a row-header (th) first cell too', () => {
    const { container } = render(
      <table>
        <tbody>
          <Tr tone="warn">
            <th scope="row">h</th>
          </Tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector('tr')?.className).toContain('forced-colors:[&>th:first-child]:border-s-[3px]');
  });
});

describe('TableWrap overflow watching', () => {
  it('observes a child that replaces the first one', async () => {
    const seen: Element[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(el: Element) { seen.push(el); }
        disconnect() {}
        unobserve() {}
      },
    );
    const { rerender, container } = render(<TableWrap label="T"><div key="a" data-k="a" /></TableWrap>);
    rerender(<TableWrap label="T"><div key="b" data-k="b" /></TableWrap>);
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toContain(container.querySelector('[data-k="b"]'));
    vi.unstubAllGlobals();
  });
});
