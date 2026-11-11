import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';
import { NishProvider } from './provider';

afterEach(cleanup);

const TRAIL: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Guides', href: '/docs/guides' },
  { label: 'Forms', href: '/docs/guides/forms' },
  { label: 'Validation', href: '/docs/guides/forms/validation' },
  { label: 'Messages' },
];

describe('Breadcrumbs', () => {
  it('renders a labelled nav and marks the last crumb as the current page', () => {
    render(<Breadcrumbs items={TRAIL.slice(0, 3)} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    const cur = screen.getByText('Guides');
    expect(cur.getAttribute('aria-current')).toBe('page');
    expect(cur.tagName).toBe('SPAN');
    expect(screen.queryByRole('link', { name: 'Guides' })).toBeNull();
  });

  it('puts a decorative separator between crumbs only', () => {
    const { container } = render(<Breadcrumbs items={TRAIL.slice(0, 3)} />);
    const seps = container.querySelectorAll('[data-separator]');
    expect(seps.length).toBe(2);
    expect(seps[0].getAttribute('aria-hidden')).toBe('true');
    expect(seps[0].querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });

  it('accepts a custom separator', () => {
    const { container } = render(<Breadcrumbs items={TRAIL.slice(0, 2)} separator="/" />);
    expect(container.querySelector('[data-separator]')!.textContent).toBe('/');
  });

  it('sends hrefs through safeUrl: a javascript: URL is not a link', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Evil', href: 'javascript:alert(1)' },
          { label: 'Here' },
        ]}
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Evil').tagName).toBe('SPAN');
  });

  it('renders onClick-only items as buttons', () => {
    const fn = vi.fn();
    render(<Breadcrumbs items={[{ label: 'Back', onClick: fn }, { label: 'Here' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs onClick on a link', () => {
    const fn = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(<Breadcrumbs items={[{ label: 'Home', href: '/', onClick: fn }, { label: 'Here' }]} />);
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('renderLink receives the safe href and the item', () => {
    const seen: string[] = [];
    render(
      <Breadcrumbs
        items={TRAIL.slice(0, 3)}
        renderLink={(item, props) => {
          seen.push(props.href);
          return (
            <a data-router="1" {...props}>
              {item.label}
            </a>
          );
        }}
      />,
    );
    expect(seen).toEqual(['/', '/docs']);
    expect(document.querySelectorAll('[data-router]').length).toBe(2);
  });

  it('does not collapse a short trail', () => {
    render(<Breadcrumbs items={TRAIL.slice(0, 4)} collapse="always" />);
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    expect(screen.getAllByRole('listitem').length).toBe(4);
  });

  it('collapses the middle into a menu when always and over maxItems', () => {
    render(<Breadcrumbs items={TRAIL} collapse="always" />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Validation' })).toBeTruthy();
    expect(screen.getByText('Messages').getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('link', { name: 'Docs' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Guides' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Forms' })).toBeNull();
    const more = screen.getByRole('button', { name: 'More' });
    fireEvent.click(more);
    expect(screen.getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Docs', 'Guides', 'Forms']);
  });

  it('maxItems below 3 never shows more than three crumbs and the current crumb truncates in a block child', () => {
    render(<Breadcrumbs items={TRAIL} collapse="always" maxItems={2} />);
    const cur = document.querySelector('[aria-current="page"]') as HTMLElement;
    expect(cur.className).toContain('truncate');
    expect(cur.parentElement?.className).toContain('inline-flex');
    expect(document.querySelectorAll('li').length).toBeLessThanOrEqual(5);
  });

  it('maxItems sets how many crumbs stay visible', () => {
    render(<Breadcrumbs items={TRAIL} collapse="always" maxItems={3} />);
    // first, the menu, last one
    expect(screen.getAllByRole('listitem').length).toBe(3);
  });

  describe('onNavigate in the collapsed menu', () => {
    const FIVE: BreadcrumbItem[] = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C', href: '/c' },
      { label: 'D', href: '/d' },
      { label: 'E' },
    ];

    function spyAssign() {
      const original = window.location;
      const assign = vi.fn();
      Object.defineProperty(window, 'location', { configurable: true, value: { ...original, assign } });
      return { assign, restore: () => Object.defineProperty(window, 'location', { configurable: true, value: original }) };
    }

    it('calls onNavigate with the href and item instead of location.assign', () => {
      const { assign, restore } = spyAssign();
      try {
        const onNavigate = vi.fn();
        render(<Breadcrumbs items={FIVE} collapse="always" maxItems={3} onNavigate={onNavigate} />);
        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'B' }));
        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledWith('/b', FIVE[1]);
        expect(assign).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });

    it('never passes a javascript: href to onNavigate', () => {
      const { assign, restore } = spyAssign();
      try {
        const onNavigate = vi.fn();
        const items = [FIVE[0], { label: 'Evil', href: 'javascript:alert(1)' }, ...FIVE.slice(2)];
        render(<Breadcrumbs items={items} collapse="always" maxItems={3} onNavigate={onNavigate} />);
        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Evil' }));
        expect(onNavigate).not.toHaveBeenCalled();
        expect(assign).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });
  });

  it('never collapses with collapse=never', () => {
    render(<Breadcrumbs items={TRAIL} collapse="never" />);
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    expect(screen.getAllByRole('listitem').length).toBe(6);
  });

  it('collapses in auto mode only under 640px of width', () => {
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
      render(<Breadcrumbs items={TRAIL} />);
      expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
      const fire = (w: number) => act(() => cb([{ contentRect: { width: w } } as ResizeObserverEntry], {} as ResizeObserver));
      fire(639);
      expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
      fire(640);
      expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('a menu item with onClick runs it', () => {
    const fn = vi.fn();
    const items = TRAIL.map((t, i) => (i === 1 ? { ...t, onClick: fn } : t));
    render(<Breadcrumbs items={items} collapse="always" />);
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Docs' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('renders children crumbs and marks the last as current', () => {
    render(
      <Breadcrumbs>
        <a href="/">Home</a>
        <a href="/x">Here</a>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('link', { name: 'Here' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).hasAttribute('aria-current')).toBe(false);
  });

  it('takes strings from a provider and per-instance props win', () => {
    render(
      <NishProvider strings={{ breadcrumbs: 'Pfad', more: 'Mehr' }}>
        <Breadcrumbs items={TRAIL} collapse="always" />
        <Breadcrumbs items={TRAIL} collapse="always" label="Own" moreLabel="Hidden" />
      </NishProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Pfad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mehr' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Own' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hidden' })).toBeTruthy();
  });

  it('forwards ref, merges className and spreads rest', () => {
    const ref = createRef<HTMLElement>();
    render(<Breadcrumbs ref={ref} items={TRAIL.slice(0, 2)} className="mb-2" id="bc" data-x="1" />);
    expect(ref.current?.tagName).toBe('NAV');
    expect(ref.current!.className).toContain('mb-2');
    expect(ref.current!.id).toBe('bc');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
  });

  it('renders on the server', () => {
    const html = renderToString(<Breadcrumbs items={TRAIL.slice(0, 2)} />);
    expect(html).toContain('aria-current="page"');
  });
});
