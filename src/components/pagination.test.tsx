import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pagination, paginationRange } from './pagination';
import { NishProvider } from './provider';

afterEach(cleanup);

const labels = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));

describe('paginationRange', () => {
  it('lists every page when they fit', () => {
    expect(paginationRange(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(paginationRange(1, 0)).toEqual([]);
  });
  it('puts an ellipsis at the end near the start', () => {
    expect(paginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, 'dots-end', 10]);
    expect(paginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, 'dots-end', 10]);
  });
  it('puts ellipses at both ends in the middle', () => {
    expect(paginationRange(5, 10)).toEqual([1, 'dots-start', 4, 5, 6, 'dots-end', 10]);
  });
  it('puts an ellipsis at the start near the end', () => {
    expect(paginationRange(10, 10)).toEqual([1, 'dots-start', 6, 7, 8, 9, 10]);
    expect(paginationRange(7, 10)).toEqual([1, 'dots-start', 6, 7, 8, 9, 10]);
  });
  it('honors siblings and boundaries', () => {
    expect(paginationRange(10, 20, 2, 2)).toEqual([1, 2, 'dots-start', 8, 9, 10, 11, 12, 'dots-end', 19, 20]);
  });
  it('keeps the slot count constant', () => {
    const n = paginationRange(1, 50).length;
    for (let p = 1; p <= 50; p++) expect(paginationRange(p, 50).length).toBe(n);
  });
  it('clamps an out-of-range page', () => {
    expect(paginationRange(99, 10)).toEqual(paginationRange(10, 10));
    expect(paginationRange(-5, 10)).toEqual(paginationRange(1, 10));
  });
});

describe('Pagination', () => {
  it('renders a labelled nav with aria-current on the current page', () => {
    render(<Pagination pageCount={5} defaultPage={3} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
    const cur = screen.getByRole('button', { name: 'Page 3' });
    expect(cur.getAttribute('aria-current')).toBe('page');
    expect(cur.getAttribute('data-state')).toBe('active');
    expect(screen.getByRole('button', { name: 'Page 2' }).hasAttribute('aria-current')).toBe(false);
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('data-state')).toBe('inactive');
  });

  it('works uncontrolled and calls onPageChange', () => {
    const fn = vi.fn();
    render(<Pagination pageCount={5} onPageChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(fn).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Page 4' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(fn).toHaveBeenLastCalledWith(5);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(fn).toHaveBeenLastCalledWith(4);
  });

  it('does not call onPageChange for the current page', () => {
    const fn = vi.fn();
    render(<Pagination pageCount={5} defaultPage={2} onPageChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(fn).not.toHaveBeenCalled();
  });

  it('is controlled: the page prop wins and state does not move on its own', () => {
    const fn = vi.fn();
    const { rerender } = render(<Pagination pageCount={5} page={2} onPageChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(fn).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
    rerender(<Pagination pageCount={5} page={4} onPageChange={fn} />);
    expect(screen.getByRole('button', { name: 'Page 4' }).getAttribute('aria-current')).toBe('page');
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(<Pagination pageCount={3} page={1} />);
    expect((screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement).disabled).toBe(false);
    rerender(<Pagination pageCount={3} page={3} />);
    expect((screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clamps a page above pageCount', () => {
    render(<Pagination pageCount={3} page={9} />);
    expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page');
  });

  it('shows ellipses as hidden text', () => {
    const { container } = render(<Pagination pageCount={20} defaultPage={10} />);
    const dots = Array.from(container.querySelectorAll('li[aria-hidden=true]'));
    expect(dots.length).toBe(2);
    expect(dots[0].textContent).toBe('…');
  });

  it('honors siblings and boundaries', () => {
    render(<Pagination pageCount={20} defaultPage={10} siblings={2} boundaries={2} />);
    expect(labels()).toEqual([
      'Previous page', 'Page 1', 'Page 2', 'Page 8', 'Page 9', 'Page 10', 'Page 11', 'Page 12', 'Page 19', 'Page 20', 'Next page',
    ]);
  });

  it('disables everything with disabled', () => {
    render(<Pagination pageCount={4} defaultPage={2} disabled />);
    for (const b of screen.getAllByRole('button')) expect((b as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('navigation').hasAttribute('data-disabled')).toBe(true);
  });

  it('renders nothing for zero pages', () => {
    const { container } = render(<Pagination pageCount={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('size sets the control size', () => {
    const { rerender } = render(<Pagination pageCount={3} size="sm" />);
    expect(screen.getByRole('button', { name: 'Page 1' }).className).toContain('h-8');
    rerender(<Pagination pageCount={3} size="md" />);
    expect(screen.getByRole('button', { name: 'Page 1' }).className).toContain('h-9');
    expect(screen.getByRole('button', { name: 'Page 1' }).className).toContain('pointer-coarse:min-h-11');
  });

  it('renderLink renders router links with the props', () => {
    const fn = vi.fn();
    render(
      <Pagination
        pageCount={3}
        page={2}
        onPageChange={fn}
        renderLink={(p, props) => <a href={`?page=${p}`} {...props} />}
      />,
    );
    const link = screen.getByRole('link', { name: 'Page 3' });
    expect(link.getAttribute('href')).toBe('?page=3');
    expect(screen.getByRole('link', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe('?page=3');
    fireEvent.click(link);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('renderLink ignores a modified or middle click that opens a new tab', () => {
    const fn = vi.fn();
    render(<Pagination pageCount={3} page={2} onPageChange={fn} renderLink={(p, props) => <a href={`?page=${p}`} {...props} />} />);
    const link = screen.getByRole('link', { name: 'Page 3' });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { shiftKey: true });
    fireEvent.click(link, { button: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('renderLink keeps an unavailable previous as a disabled button', () => {
    render(<Pagination pageCount={3} page={1} renderLink={(p, props) => <a href={`?page=${p}`} {...props} />} />);
    expect((screen.getByRole('button', { name: 'Previous page' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('compact shows "Page 3 of 10" with previous and next only', () => {
    render(<Pagination pageCount={10} page={3} compact />);
    expect(screen.getByText('Page 3 of 10')).toBeTruthy();
    expect(labels()).toEqual(['Previous page', 'Next page']);
    expect(screen.getByRole('navigation').getAttribute('data-state')).toBe('compact');
  });

  it('compact=false keeps the list', () => {
    render(<Pagination pageCount={10} page={3} compact={false} />);
    expect(screen.queryByText('Page 3 of 10')).toBeNull();
    expect(screen.getByRole('navigation').getAttribute('data-state')).toBe('full');
  });

  it('goes compact under 400px of width and back at 400px', () => {
    let cb: ResizeObserverCallback = () => {};
    class RO {
      constructor(c: ResizeObserverCallback) {
        cb = c;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', RO);
    try {
      render(<Pagination pageCount={10} page={3} />);
      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('data-state')).toBe('full');
      const fire = (w: number) => act(() => cb([{ contentRect: { width: w } } as ResizeObserverEntry], {} as ResizeObserver));
      fire(399);
      expect(nav.getAttribute('data-state')).toBe('compact');
      fire(400);
      expect(nav.getAttribute('data-state')).toBe('full');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('takes strings from a provider and per-instance props win', () => {
    render(
      <NishProvider strings={{ previousPage: 'Zurueck', nextPage: 'Weiter', paginationLabel: 'Seiten', pageLabel: (n) => `Seite ${n}` }}>
        <Pagination pageCount={3} page={2} />
        <Pagination pageCount={3} page={2} label="Own" previousLabel="Back" nextLabel="Fwd" pageLabel={(n) => `P${n}`} />
      </NishProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Seiten' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zurueck' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Seite 2' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Own' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fwd' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'P2' })).toBeTruthy();
  });

  it('compactLabel overrides the compact text', () => {
    render(<Pagination pageCount={4} page={2} compact compactLabel={(p, c) => `${p}/${c}`} />);
    expect(screen.getByText('2/4')).toBeTruthy();
  });

  it('forwards ref, merges className and spreads rest', () => {
    const ref = createRef<HTMLElement>();
    render(<Pagination ref={ref} pageCount={3} className="mt-2" id="pg" data-x="1" />);
    expect(ref.current?.tagName).toBe('NAV');
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.className).toContain('min-w-0');
    expect(ref.current!.id).toBe('pg');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
  });

  it('renders on the server', () => {
    const html = renderToString(<Pagination pageCount={5} defaultPage={2} />);
    expect(html).toContain('aria-current="page"');
  });
});
