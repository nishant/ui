import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtualList, type VirtualListHandle } from './virtual';

// happy-dom has no layout: the box is 320px tall, the list sits at the box's scroll offset.
const BOX = 320;

let restore: (() => void)[] = [];

function stubLayout() {
  const rect = HTMLElement.prototype.getBoundingClientRect;
  const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    let top = 0;
    if (this.getAttribute('role') === 'list') {
      const root = this.parentElement;
      top = root && root.style.overflowY === 'auto' ? -root.scrollTop : -window.scrollY;
    }
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON() {} } as DOMRect;
  };
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.style.overflowY === 'auto' ? BOX : 0;
    },
  });
  restore.push(() => {
    HTMLElement.prototype.getBoundingClientRect = rect;
    if (client) Object.defineProperty(HTMLElement.prototype, 'clientHeight', client);
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

const renderRow = (i: number) => <span>row {i}</span>;
const indexes = (c: ParentNode) => Array.from(c.querySelectorAll<HTMLElement>('[role="listitem"]')).map((el) => Number(el.dataset.index));

function scrollTo(el: HTMLElement, top: number) {
  act(() => {
    el.scrollTop = top;
    fireEvent.scroll(el);
    vi.advanceTimersByTime(40);
  });
}

describe('VirtualList markup', () => {
  it('passes ref, className and rest to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { getByTestId } = render(
      <VirtualList ref={ref} id="v" data-testid="vl" className="mine" aria-label="Rows" count={5} itemSize={40} height={BOX} renderItem={renderRow} />,
    );
    const root = getByTestId('vl');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('v');
    expect(root.className).toContain('mine');
    expect(root.style.overflowY).toBe('auto');
    expect(root.style.height).toBe('320px');
    expect(root.tabIndex).toBe(0);
  });

  it('gives the list and rows their roles and positions', () => {
    const { container, getByRole } = render(<VirtualList aria-label="Rows" count={50} itemSize={40} height={BOX} renderItem={renderRow} />);
    const list = getByRole('list');
    expect(list.getAttribute('aria-label')).toBe('Rows');
    expect(list.style.height).toBe('2000px');
    const rows = container.querySelectorAll('[role="listitem"]');
    const third = rows[2] as HTMLElement;
    expect(third.getAttribute('aria-posinset')).toBe('3');
    expect(third.getAttribute('aria-setsize')).toBe('50');
    expect(third.style.transform).toBe('translateY(80px)');
    expect(third.style.height).toBe('40px');
  });

  it('applies itemClassName to rows and gap to offsets', () => {
    const { container } = render(<VirtualList aria-label="Rows" count={5} itemSize={40} gap={10} itemClassName="row" height={BOX} renderItem={renderRow} />);
    const second = container.querySelectorAll<HTMLElement>('[role="listitem"]')[1];
    expect(second.className).toBe('row');
    expect(second.style.transform).toBe('translateY(50px)');
  });

  it('shows empty instead of the list when count is 0', () => {
    const { queryByRole, getByText } = render(<VirtualList aria-label="Rows" count={0} itemSize={40} empty={<p>Nothing</p>} renderItem={renderRow} />);
    expect(getByText('Nothing')).toBeTruthy();
    expect(queryByRole('list')).toBeNull();
  });

  it('renders a list with no rows for count 0 without empty', () => {
    const { getByRole, getByTestId } = render(<VirtualList data-testid="vl" aria-label="Rows" count={0} itemSize={40} height={BOX} renderItem={renderRow} />);
    expect(indexes(document.body)).toEqual([]);
    expect(getByRole('list').style.height).toBe('0px');
    expect(getByTestId('vl').hasAttribute('tabindex')).toBe(false);
  });

  it('counts a function itemSize that returns 0 or less as 0', () => {
    const { getByRole } = render(<VirtualList aria-label="Rows" count={3} itemSize={(i) => (i === 0 ? -5 : 0)} height={BOX} renderItem={renderRow} />);
    expect(getByRole('list').style.height).toBe('0px');
  });
});

describe('VirtualList windowing', () => {
  it('renders only the rows near the box', () => {
    const { container } = render(<VirtualList aria-label="Rows" count={10000} itemSize={40} height={BOX} renderItem={renderRow} />);
    const rows = indexes(container);
    expect(rows.length).toBeLessThanOrEqual(20);
    expect(rows[0]).toBe(0);
    expect(container.querySelector('[role="list"]')?.getAttribute('style')).toContain('height: 400000px');
  });

  it('changes the rendered rows when the box scrolls', () => {
    const { container, getByTestId } = render(<VirtualList data-testid="vl" aria-label="Rows" count={10000} itemSize={40} height={BOX} renderItem={renderRow} />);
    scrollTo(getByTestId('vl'), 4000);
    const rows = indexes(container);
    expect(rows.length).toBeLessThanOrEqual(20);
    expect(rows[0]).toBe(94);
    expect(rows).toContain(100);
    expect(rows).not.toContain(0);
  });

  it('reads window.innerHeight when no height is set', () => {
    vi.stubGlobal('innerHeight', 200);
    const { container } = render(<VirtualList aria-label="Rows" count={1000} itemSize={40} renderItem={renderRow} />);
    expect(indexes(container)).toEqual(Array.from({ length: 11 }, (_, i) => i));
    expect(container.firstElementChild?.getAttribute('style') ?? '').not.toContain('overflow');
  });

  it('clamps the range when the count shrinks', () => {
    const { container, rerender } = render(<VirtualList aria-label="Rows" count={100} itemSize={40} height={BOX} renderItem={renderRow} />);
    rerender(<VirtualList aria-label="Rows" count={3} itemSize={40} height={BOX} renderItem={renderRow} />);
    expect(indexes(container)).toEqual([0, 1, 2]);
  });

  it('reports the rendered range', () => {
    const onRangeChange = vi.fn();
    const { getByTestId } = render(
      <VirtualList data-testid="vl" aria-label="Rows" count={10000} itemSize={40} height={BOX} onRangeChange={onRangeChange} renderItem={renderRow} />,
    );
    expect(onRangeChange).toHaveBeenLastCalledWith(0, 14);
    scrollTo(getByTestId('vl'), 4000);
    expect(onRangeChange).toHaveBeenLastCalledWith(94, 114);
  });
});

describe('VirtualList scrollToIndex', () => {
  function setup(extra: Record<string, unknown> = {}) {
    const api = createRef<VirtualListHandle>();
    const utils = render(<VirtualList data-testid="vl" aria-label="Rows" count={10000} itemSize={40} height={BOX} apiRef={api} renderItem={renderRow} {...extra} />);
    const root = utils.getByTestId('vl');
    const scrollBy = vi.fn();
    root.scrollBy = scrollBy as unknown as typeof root.scrollBy;
    return { api, root, scrollBy };
  }

  it('aligns start, center and end', () => {
    const { api, scrollBy } = setup();
    act(() => api.current?.scrollToIndex(500, { align: 'start' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 20000, behavior: 'auto' });
    act(() => api.current?.scrollToIndex(500, { align: 'center', behavior: 'smooth' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 19860, behavior: 'smooth' });
    act(() => api.current?.scrollToIndex(500, { align: 'end' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 19720, behavior: 'auto' });
  });

  it('auto scrolls only as far as needed and not at all for a visible row', () => {
    const { api, scrollBy } = setup();
    act(() => api.current?.scrollToIndex(2));
    expect(scrollBy).not.toHaveBeenCalled();
    act(() => api.current?.scrollToIndex(500));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 19720, behavior: 'auto' });
  });

  it('clamps the index', () => {
    const { api, scrollBy } = setup();
    act(() => api.current?.scrollToIndex(99999, { align: 'start' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 9999 * 40, behavior: 'auto' });
    act(() => api.current?.scrollToIndex(-5, { align: 'end' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 40 - BOX, behavior: 'auto' });
  });

  it('scrolls the window without a height', () => {
    vi.stubGlobal('innerHeight', 200);
    const api = createRef<VirtualListHandle>();
    render(<VirtualList aria-label="Rows" count={1000} itemSize={40} apiRef={api} renderItem={renderRow} />);
    const scrollBy = vi.fn();
    vi.stubGlobal('scrollBy', scrollBy);
    act(() => api.current?.scrollToIndex(100, { align: 'start' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 4000, behavior: 'auto' });
  });

  it('does nothing for an empty list', () => {
    const { api, scrollBy } = setup({ count: 0 });
    act(() => api.current?.scrollToIndex(0));
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

describe('VirtualList focus', () => {
  it('keeps the focused row mounted after scrolling away, and drops it on blur', () => {
    const { container, getByTestId } = render(
      <VirtualList
        data-testid="vl"
        aria-label="Rows"
        count={1000}
        itemSize={40}
        height={BOX}
        renderItem={(i) => <button type="button">act {i}</button>}
      />,
    );
    const button = container.querySelector('button') as HTMLButtonElement;
    act(() => button.focus());
    scrollTo(getByTestId('vl'), 8000);
    const rows = indexes(container);
    expect(rows[0]).toBe(0);
    expect(rows).toContain(200);
    expect(rows.length).toBeLessThanOrEqual(21);
    act(() => button.blur());
    expect(indexes(container)).not.toContain(0);
  });
});

describe('VirtualList measuring', () => {
  class FakeRO {
    static instances: FakeRO[] = [];
    observed = new Set<Element>();
    constructor(public cb: ResizeObserverCallback) {
      FakeRO.instances.push(this);
    }
    observe(el: Element) {
      this.observed.add(el);
    }
    unobserve(el: Element) {
      this.observed.delete(el);
    }
    disconnect() {
      this.observed.clear();
    }
  }

  function measurer() {
    return FakeRO.instances.find((ro) => Array.from(ro.observed).some((el) => (el as HTMLElement).dataset.index !== undefined));
  }
  const entry = (el: Element, size: number) => ({ target: el, borderBoxSize: [{ blockSize: size, inlineSize: 0 }] }) as unknown as ResizeObserverEntry;

  beforeEach(() => {
    FakeRO.instances = [];
    vi.stubGlobal('ResizeObserver', FakeRO);
  });

  it('uses a measured height for the next rows, keyed by itemKey', () => {
    const { container } = render(<VirtualList aria-label="Rows" count={100} itemSize={40} measure height={BOX} itemKey={(i) => `k${i}`} renderItem={renderRow} />);
    const ro = measurer();
    expect(ro).toBeTruthy();
    const rows = container.querySelectorAll<HTMLElement>('[role="listitem"]');
    expect(rows[0].style.height).toBe('');
    act(() => ro?.cb([entry(rows[0], 80)], ro as unknown as ResizeObserver));
    const after = container.querySelectorAll<HTMLElement>('[role="listitem"]');
    expect(after[1].style.transform).toBe('translateY(80px)');
    expect(after[2].style.transform).toBe('translateY(120px)');
  });

  it('moves the scroll position when a row above the view changes height', () => {
    const { container, getByTestId } = render(<VirtualList data-testid="vl" aria-label="Rows" count={1000} itemSize={40} measure height={BOX} renderItem={renderRow} />);
    const root = getByTestId('vl');
    scrollTo(root, 2000);
    const ro = measurer();
    const above = container.querySelector<HTMLElement>('[data-index="46"]') as HTMLElement;
    act(() => ro?.cb([entry(above, 60)], ro as unknown as ResizeObserver));
    expect(root.scrollTop).toBe(2020);
    const visible = container.querySelector<HTMLElement>('[data-index="55"]') as HTMLElement;
    act(() => ro?.cb([entry(visible, 70)], ro as unknown as ResizeObserver));
    expect(root.scrollTop).toBe(2020);
  });

  it('ignores zero sizes and rows without an index', () => {
    const { container } = render(<VirtualList aria-label="Rows" count={10} itemSize={40} measure height={BOX} renderItem={renderRow} />);
    const ro = measurer();
    const row = container.querySelector<HTMLElement>('[data-index="0"]') as HTMLElement;
    const stray = document.createElement('div');
    act(() => ro?.cb([entry(row, 0), entry(stray, 50)], ro as unknown as ResizeObserver));
    expect(container.querySelector<HTMLElement>('[data-index="1"]')?.style.transform).toBe('translateY(40px)');
  });

  it('re-aims after the estimates are replaced when scrolling to a measured row', () => {
    const api = createRef<VirtualListHandle>();
    const { getByTestId } = render(<VirtualList data-testid="vl" aria-label="Rows" count={1000} itemSize={40} measure height={BOX} apiRef={api} renderItem={renderRow} />);
    const scrollBy = vi.fn();
    (getByTestId('vl') as HTMLElement).scrollBy = scrollBy as never;
    act(() => api.current?.scrollToIndex(100, { align: 'start' }));
    expect(scrollBy).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(40);
    });
    // The fake box did not move, so the second aim asks for the same distance again.
    expect(scrollBy).toHaveBeenCalledTimes(2);
  });

  it('does not crash without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = render(<VirtualList aria-label="Rows" count={10} itemSize={40} measure height={BOX} renderItem={renderRow} />);
    expect(indexes(container).length).toBe(10);
  });
});

describe('VirtualList server render', () => {
  const list = <VirtualList aria-label="Rows" count={1000} itemSize={40} height={BOX} renderItem={renderRow} />;

  it('renders the first 20 rows at their offsets on the server', () => {
    const html = renderToString(list);
    expect((html.match(/role="listitem"/g) ?? []).length).toBe(20);
    expect(html).toContain('translateY(760px)');
  });

  it('hydrates the server markup without warnings', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(list);
    const recoverable: unknown[] = [];
    act(() => {
      hydrateRoot(container, list, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('VirtualList dev warnings', () => {
  it('warns about a bad itemSize', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<VirtualList aria-label="Rows" count={3} itemSize={0} height={BOX} renderItem={renderRow} />);
    expect(warn).toHaveBeenCalledWith('nish-ui: VirtualList: itemSize must be a positive number of pixels.');
  });

  it('warns about a missing name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<VirtualList count={3} itemSize={40} height={BOX} renderItem={renderRow} />);
    expect(warn).toHaveBeenCalledWith('nish-ui: VirtualList: give the list an aria-label or aria-labelledby.');
  });
});
