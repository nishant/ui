import { createElement, createRef } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BottomNav,
  MoreSheet,
  NavRail,
  NavSidebar,
  revealInRow,
  ScrollRow,
  SectionNav,
  useScrollSpy,
  visibleNavItems,
  type NavItem,
} from './nav';
import { NishProvider } from './provider';

const icon = createElement('svg', { 'aria-hidden': 'true' });
const item = (key: string, label: string, extra: Partial<NavItem> = {}): NavItem => ({ key, label, icon, href: `/${key}`, ...extra });

function mockMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => mockMatchMedia(false));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.style.removeProperty('--nish-bottom-nav-h');
});

describe('visibleNavItems', () => {
  it('drops items with an unsafe href, keeps buttons and safe links, and warns once per item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const list = [
      item('ok', 'Ok'),
      item('bad', 'Bad', { href: 'javascript:alert(1)' }),
      { key: 'btn', label: 'Btn', icon },
      item('mail', 'Mail', { href: 'mailto:a@b.c' }),
      item('data', 'Data', { href: 'data:text/html,x' }),
    ];
    expect(visibleNavItems(list).map((i) => i.key)).toEqual(['ok', 'btn', 'mail']);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0]?.[0])).toContain('"bad"');
  });
});

describe('BottomNav', () => {
  it('is a nav named by the sections string, a provider or label, with ref, rest and className', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<BottomNav ref={ref} items={[item('a', 'A')]} className="mine" data-testid="bn" id="bn1" />);
    const nav = screen.getByRole('navigation', { name: 'Sections', hidden: true });
    expect(ref.current).toBe(nav);
    expect(nav.id).toBe('bn1');
    expect(nav.className).toContain('mine');
    expect(nav.className).toContain('md:hidden');
    expect(nav.className).toContain('z-[var(--nish-z-dropdown,40)]');
    expect(nav.hasAttribute('data-nish-bar')).toBe(true);
    expect(nav.getAttribute('data-nish-print')).toBe('hide');
    rerender(
      <NishProvider strings={{ sections: 'Rubriques' }}>
        <BottomNav items={[item('a', 'A')]} />
      </NishProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Rubriques', hidden: true })).toBeTruthy();
    rerender(<BottomNav items={[item('a', 'A')]} label="Bottom" hideFrom="lg" />);
    const labelled = screen.getByRole('navigation', { name: 'Bottom', hidden: true });
    expect(labelled.className).toContain('lg:hidden');
    expect(labelled.className).not.toContain('md:hidden');
  });

  it('marks the current item with aria-current and data-state', () => {
    render(<BottomNav items={[item('a', 'Alpha', { active: true }), item('b', 'Beta')]} />);
    const a = screen.getByRole('link', { name: 'Alpha', hidden: true });
    const b = screen.getByRole('link', { name: 'Beta', hidden: true });
    expect(a.getAttribute('aria-current')).toBe('page');
    expect(a.getAttribute('data-state')).toBe('active');
    expect(b.getAttribute('aria-current')).toBeNull();
    expect(b.getAttribute('data-state')).toBe('inactive');
  });

  it('draws the current pill in the system highlight color in forced-colors mode', () => {
    render(<BottomNav items={[item('a', 'Alpha', { active: true }), item('b', 'Beta')]} />);
    const active = screen.getByRole('link', { name: 'Alpha', hidden: true }).firstElementChild as HTMLElement;
    const idle = screen.getByRole('link', { name: 'Beta', hidden: true }).firstElementChild as HTMLElement;
    expect(active.className).toContain('forced-colors:bg-[Highlight]');
    expect(idle.className).not.toContain('forced-colors:bg-[Highlight]');
  });

  it('renders a button for an item without href and runs onSelect', () => {
    const onSelect = vi.fn();
    render(<BottomNav items={[{ key: 'x', label: 'Do', icon, onSelect }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Do', hidden: true }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows a count pill named by the newCount string, 99+ above 99, and a hidden dot for true', () => {
    render(
      <NishProvider strings={{ newCount: (v) => `${v} nouveaux` }}>
        <BottomNav items={[item('a', 'A', { badge: 5 }), item('b', 'B', { badge: 120 }), item('c', 'C', { badge: true }), item('d', 'D', { badge: 0 })]} />
      </NishProvider>,
    );
    expect(screen.getByLabelText('5 nouveaux').textContent).toBe('5');
    expect(screen.getByLabelText('120 nouveaux').textContent).toBe('99+');
    const c = screen.getByRole('link', { name: 'C', hidden: true });
    expect(c.querySelector('[aria-hidden="true"].rounded-full')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'D', hidden: true }).querySelector('.rounded-full')).toBeNull();
  });

  it('does not render an item with an unsafe href', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<BottomNav items={[item('ok', 'Fine'), item('bad', 'Evil', { href: 'javascript:alert(1)//bn' })]} />);
    expect(screen.getAllByRole('link', { hidden: true }).map((a) => a.textContent)).toEqual(['Fine']);
  });

  it('renders the More button with the provider label, state and toggle', () => {
    const onToggle = vi.fn();
    const more = { active: false, expanded: false, onToggle };
    const { rerender } = render(
      <NishProvider strings={{ more: 'Plus' }}>
        <BottomNav items={[item('a', 'A')]} more={more} />
      </NishProvider>,
    );
    const btn = screen.getByRole('button', { name: 'Plus', hidden: true });
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('data-state')).toBe('closed');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<BottomNav items={[item('a', 'A')]} more={{ ...more, expanded: true, label: 'Extra' }} />);
    const open = screen.getByRole('button', { name: 'Extra', hidden: true });
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(open.getAttribute('data-state')).toBe('open');
  });

  it('renders trailing content after a divider', () => {
    render(<BottomNav items={[item('a', 'A')]} trailing={<button type="button">Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add', hidden: true })).toBeTruthy();
  });

  it('hands the item and a data-state to renderLink', () => {
    const renderLink = vi.fn((it: NavItem, p: { className: string; children: React.ReactNode; 'data-state'?: string }) => (
      <a href={`#${it.key}`} className={p.className} data-state={p['data-state']} data-custom="1">
        {p.children}
      </a>
    ));
    render(<BottomNav items={[item('a', 'A', { active: true })]} renderLink={renderLink} />);
    const link = screen.getByRole('link', { hidden: true });
    expect(link.getAttribute('data-custom')).toBe('1');
    expect(renderLink.mock.calls[0]?.[1]['data-state']).toBe('active');
    expect(renderLink.mock.calls[0]?.[1]).not.toHaveProperty('replace');
  });

  it('publishes its height as --nish-bottom-nav-h while the phone query matches', () => {
    mockMatchMedia(true);
    const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 56 });
    try {
      render(<BottomNav items={[item('a', 'A')]} />);
      expect(document.documentElement.style.getPropertyValue('--nish-bottom-nav-h')).toBe('56px');
    } finally {
      if (desc) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', desc);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
    }
  });

  it('publishes nothing when the bar is hidden by its breakpoint', () => {
    const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 56 });
    try {
      render(<BottomNav items={[item('a', 'A')]} />);
      expect(document.documentElement.style.getPropertyValue('--nish-bottom-nav-h')).toBe('');
    } finally {
      if (desc) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', desc);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
    }
  });
});

describe('MoreSheet', () => {
  it('renders nothing while closed', () => {
    render(<MoreSheet open={false} onClose={() => {}} items={[item('a', 'A')]} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a dialog titled from the more string with a Theme row from the theme string', () => {
    render(
      <NishProvider strings={{ more: 'Plus', theme: 'Apparence' }}>
        <MoreSheet open onClose={() => {}} items={[item('a', 'Alpha', { hint: 'First' })]} />
      </NishProvider>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Plus' });
    expect(within(dialog).getByText('Apparence')).toBeTruthy();
    expect(within(dialog).getByText('First')).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: /Alpha/ })).toBeTruthy();
  });

  it('uses the title prop and a custom footer, and does not draw the Theme row then', () => {
    render(<MoreSheet open onClose={() => {}} items={[item('a', 'A')]} title="Menu" footer={<p>Footer</p>} />);
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(dialog).getByText('Footer')).toBeTruthy();
    expect(within(dialog).queryByText('Theme')).toBeNull();
  });

  it('closes after a button row runs onSelect', () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    render(<MoreSheet open onClose={onClose} items={[{ key: 'out', label: 'Sign out', icon, onSelect }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Sign out/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes after a plain link row is clicked and marks the current row', () => {
    const onClose = vi.fn();
    render(<MoreSheet open onClose={onClose} items={[item('a', 'Alpha', { active: true })]} />);
    const link = screen.getByRole('link', { name: /Alpha/ });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.className).toContain('text-start');
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render unsafe rows', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<MoreSheet open onClose={() => {}} items={[item('ok', 'Fine'), item('bad', 'Evil', { href: 'javascript:alert(1)//sheet' })]} />);
    expect(screen.queryByText('Evil')).toBeNull();
    expect(screen.getByText('Fine')).toBeTruthy();
  });
});

describe('NavRail', () => {
  it('is a nav named by the sections string, a provider or label, with ref and rest', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<NavRail ref={ref} items={[item('a', 'A')]} className="mine" data-testid="nr" />);
    const nav = screen.getByRole('navigation', { name: 'Sections', hidden: true });
    expect(ref.current).toBe(nav);
    expect(nav.getAttribute('data-testid')).toBe('nr');
    expect(nav.className).toContain('mine');
    expect(nav.className).toContain('md:flex');
    expect(nav.className).toContain('lg:hidden');
    expect(nav.className).toContain('border-e');
    expect(nav.className).not.toContain('border-r');
    rerender(
      <NishProvider strings={{ sections: 'Rubriques' }}>
        <NavRail items={[item('a', 'A')]} />
      </NishProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Rubriques', hidden: true })).toBeTruthy();
    rerender(<NavRail items={[item('a', 'A')]} label="Rail" showFrom="lg" hideFrom={false} />);
    const labelled = screen.getByRole('navigation', { name: 'Rail', hidden: true });
    expect(labelled.className).toContain('lg:flex');
    expect(labelled.className).not.toContain('lg:hidden');
  });

  it('renders items, tools after a divider and a footer pinned to the bottom', () => {
    render(
      <NavRail
        items={[item('a', 'Alpha', { active: true }), item('b', 'Beta', { badge: 3 })]}
        tools={<button type="button">Search</button>}
        footer={<button type="button">Me</button>}
      />,
    );
    expect(screen.getByRole('link', { name: /Alpha/, hidden: true }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByLabelText('3 new')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search', hidden: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Me', hidden: true }).parentElement?.className).toContain('mt-auto');
  });

});

describe('NavSidebar', () => {
  const base = { items: [item('a', 'Alpha', { active: true }), item('b', 'Beta')], collapsed: false, onCollapsedChange: () => {} };

  it('is an aside named by the sidebar string with a nav named by the sections string', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<NavSidebar ref={ref} {...base} className="mine" data-testid="sb" />);
    const aside = screen.getByRole('complementary', { name: 'Sidebar', hidden: true });
    expect(ref.current).toBe(aside);
    expect(aside.className).toContain('mine');
    expect(aside.className).toContain('w-56');
    expect(aside.className).toContain('border-e');
    expect(aside.getAttribute('data-state')).toBe('open');
    expect(within(aside).getByRole('navigation', { name: 'Sections' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ sidebar: 'Barre', sections: 'Rubriques' }}>
        <NavSidebar {...base} />
      </NishProvider>,
    );
    const fr = screen.getByRole('complementary', { name: 'Barre', hidden: true });
    expect(within(fr).getByRole('navigation', { name: 'Rubriques' })).toBeTruthy();
    rerender(<NavSidebar {...base} aria-label="Side" label="Main" />);
    const custom = screen.getByRole('complementary', { name: 'Side', hidden: true });
    expect(within(custom).getByRole('navigation', { name: 'Main' })).toBeTruthy();
  });

  it('collapses to icons with sr-only labels and flips the button name', () => {
    const onCollapsedChange = vi.fn();
    const { rerender } = render(<NavSidebar {...base} onCollapsedChange={onCollapsedChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    rerender(<NavSidebar {...base} collapsed onCollapsedChange={onCollapsedChange} />);
    const aside = screen.getByRole('complementary', { hidden: true });
    expect(aside.className).toContain('w-16');
    expect(aside.getAttribute('data-state')).toBe('closed');
    expect(screen.getByText('Alpha').className).toBe('sr-only');
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('takes the button names from the provider strings', () => {
    render(
      <NishProvider strings={{ collapseSidebar: 'Replier', expandSidebar: 'Deplier' }}>
        <NavSidebar {...base} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Replier' })).toBeTruthy();
  });

  it('marks the current row and renders tools and the footer', () => {
    render(<NavSidebar {...base} tools={<button type="button">Find</button>} footer={<span>foot</span>} />);
    const a = screen.getByRole('link', { name: 'Alpha' });
    expect(a.getAttribute('aria-current')).toBe('page');
    expect(a.className).toContain('border-s-2');
    expect(a.className).toContain('forced-colors:bg-[Highlight]');
    expect(screen.getByRole('button', { name: 'Find' })).toBeTruthy();
    expect(screen.getByText('foot')).toBeTruthy();
  });
});

describe('ScrollRow', () => {
  it('renders the chosen element with ref, label, rest and class options', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ScrollRow ref={ref} as="ul" label="Filters" bleed snap fade={false} className="mine" data-testid="sr">
        <li>one</li>
      </ScrollRow>,
    );
    const row = screen.getByRole('list', { name: 'Filters' });
    expect(row.tagName).toBe('UL');
    expect(ref.current).toBe(row);
    expect(row.getAttribute('data-testid')).toBe('sr');
    expect(row.className).toContain('mine');
    expect(row.className).toContain('snap-x');
    expect(row.className).toContain('px-[var(--nish-page-gutter)]');
    expect(row.className).not.toContain('nish-scroll-fade');
  });

  it('fades by default and defaults to a div', () => {
    render(<ScrollRow>x</ScrollRow>);
    const row = screen.getByText('x');
    expect(row.tagName).toBe('DIV');
    expect(row.className).toContain('nish-scroll-fade');
    expect(row.className).not.toContain('snap-x');
  });

  it('scrolls the active child into view when it first appears', () => {
    const rect = (left: number, right: number) => () => ({ left, right, top: 0, bottom: 0, width: right - left, height: 0, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.id === 'child' ? rect(150, 250)() : rect(0, 100)();
    });
    render(
      <ScrollRow data-testid="row">
        <button id="child" type="button" aria-pressed="true">
          on
        </button>
      </ScrollRow>,
    );
    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId('row').scrollLeft).toBe(158);
  });
});

describe('revealInRow', () => {
  const rect = (left: number, right: number) => ({ left, right }) as DOMRect;
  const make = (scroller: [number, number], child: [number, number]) => {
    const s = document.createElement('div');
    const c = document.createElement('div');
    vi.spyOn(s, 'getBoundingClientRect').mockReturnValue(rect(...scroller));
    vi.spyOn(c, 'getBoundingClientRect').mockReturnValue(rect(...child));
    return { s, c };
  };
  it('scrolls left when the child is cut off at the start, with 8px of padding', () => {
    const { s, c } = make([0, 100], [-20, 30]);
    s.scrollLeft = 50;
    revealInRow(s, c);
    expect(s.scrollLeft).toBe(50 + -20 - 0 - 8);
  });
  it('scrolls right when the child is cut off at the end', () => {
    const { s, c } = make([0, 100], [60, 130]);
    revealInRow(s, c);
    expect(s.scrollLeft).toBe(130 - 100 + 8);
  });
  it('does nothing when the child is fully inside', () => {
    const { s, c } = make([0, 100], [20, 80]);
    s.scrollLeft = 7;
    revealInRow(s, c);
    expect(s.scrollLeft).toBe(7);
  });
});

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

describe('useScrollSpy and SectionNav', () => {
  let observers: { cb: IOCallback; observed: Element[] }[] = [];
  const RealIO = globalThis.IntersectionObserver;

  beforeEach(() => {
    observers = [];
    class FakeIO {
      cb: IOCallback;
      observed: Element[] = [];
      constructor(cb: IOCallback) {
        this.cb = cb;
        observers.push(this);
      }
      observe(el: Element) {
        this.observed.push(el);
      }
      unobserve() {}
      disconnect() {
        this.observed = [];
      }
      takeRecords() {
        return [];
      }
    }
    globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    for (const id of ['one', 'two', 'three']) {
      const el = document.createElement('section');
      el.id = id;
      el.scrollIntoView = vi.fn();
      document.body.appendChild(el);
    }
  });

  afterEach(() => {
    globalThis.IntersectionObserver = RealIO;
    for (const id of ['one', 'two', 'three']) document.getElementById(id)?.remove();
    history.replaceState(null, '', '#');
  });

  const enter = (id: string, isIntersecting = true) =>
    act(() => {
      observers.forEach((o) => o.cb([{ target: document.getElementById(id) as Element, isIntersecting }]));
    });

  it('starts at the first id, follows the last one to enter, and falls back when it leaves', () => {
    const { result } = renderHook(() => useScrollSpy(['one', 'two', 'three']));
    expect(result.current).toBe('one');
    expect(observers[0]?.observed.map((e) => e.id)).toEqual(['one', 'two', 'three']);
    enter('two');
    expect(result.current).toBe('two');
    enter('three');
    expect(result.current).toBe('three');
    enter('three', false);
    expect(result.current).toBe('two');
  });

  it('returns null for no ids and resets to the first id near the top of the page', () => {
    expect(renderHook(() => useScrollSpy([])).result.current).toBeNull();
    const { result } = renderHook(() => useScrollSpy(['one', 'two']));
    enter('two');
    expect(result.current).toBe('two');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe('one');
  });

  const sections = [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two', count: 4 },
  ];

  it('is named "On this page" by default, not the app-nav name, and takes label and ref', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<SectionNav ref={ref} items={sections} className="mine" data-testid="sn" />);
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(nav).not.toBe(screen.queryByRole('navigation', { name: 'Sections' }));
    expect(ref.current).toBe(nav);
    expect(nav.getAttribute('data-testid')).toBe('sn');
    expect(nav.className).toContain('mine');
    expect(nav.className).toContain('sticky');
    expect(nav.className).toContain('z-[var(--nish-z-sticky,20)]');
    expect(nav.style.top).toBe('var(--nish-header-h, 0px)');
    expect(nav.hasAttribute('data-nish-bar')).toBe(true);
    rerender(<SectionNav items={sections} label="Sur cette page" sticky={false} />);
    const plain = screen.getByRole('navigation', { name: 'Sur cette page' });
    expect(plain.className.split(' ')).not.toContain('sticky');
    expect(plain.hasAttribute('data-nish-bar')).toBe(false);
  });

  it('marks the section being read, with a count, 44px chips on coarse pointers and data-state', () => {
    render(<SectionNav items={sections} />);
    const one = screen.getByRole('button', { name: 'One' });
    const two = screen.getByRole('button', { name: /Two/ });
    expect(one.getAttribute('aria-current')).toBe('true');
    expect(one.getAttribute('data-state')).toBe('active');
    expect(two.getAttribute('aria-current')).toBeNull();
    expect(two.textContent).toBe('Two4');
    expect(one.className).toContain('pointer-coarse:min-h-11');
    expect(one.className).toContain('pointer-coarse:min-w-11');
    enter('two');
    expect(two.getAttribute('aria-current')).toBe('true');
    expect(one.getAttribute('aria-current')).toBeNull();
  });

  it('scrolls to the section, writes the hash, keeps the chip lit and reports the id', () => {
    const onSelect = vi.fn();
    render(<SectionNav items={sections} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    expect(document.getElementById('two')?.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    expect(location.hash).toBe('#two');
    expect(onSelect).toHaveBeenCalledWith('two');
    enter('one');
    expect(screen.getByRole('button', { name: /Two/ }).getAttribute('aria-current')).toBe('true');
  });

  it('leaves the hash alone with updateHash={false} and ignores a missing section', () => {
    const onSelect = vi.fn();
    render(<SectionNav items={[...sections, { id: 'ghost', label: 'Ghost' }]} updateHash={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    expect(location.hash).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Ghost' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('scrolls smoothly unless reduced motion is requested', () => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    render(<SectionNav items={sections} />);
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    expect(document.getElementById('two')?.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
  });

  it('releases the locked chip on a wheel event', () => {
    render(<SectionNav items={sections} />);
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    act(() => {
      window.dispatchEvent(new Event('wheel'));
    });
    expect(screen.getByRole('button', { name: 'One' }).getAttribute('aria-current')).toBe('true');
  });
});
