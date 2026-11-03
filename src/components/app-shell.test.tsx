import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';
import { SectionNav, type NavItem } from './nav';
import { NishProvider } from './provider';

const icon = createElement('svg', { 'aria-hidden': 'true' });
const item = (key: string, label: string, active = false): NavItem => ({ key, label, icon, href: `/${key}`, active });
const SIX = [item('home', 'Home', true), item('jobs', 'Jobs'), item('saved', 'Saved'), item('alerts', 'Alerts'), item('reports', 'Reports'), item('settings', 'Settings')];
const FIVE = SIX.slice(0, 5);

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// The BottomNav is the nav landmark that is a direct child of the fragment's root and has a More button.
function bottomNav(): HTMLElement {
  const navs = screen.getAllByRole('navigation', { name: 'Sections', hidden: true });
  const found = navs.find((n) => n.className.includes('fixed'));
  if (!found) throw new Error('no BottomNav');
  return found;
}

describe('AppShell', () => {
  it('renders the skip link pointing at the main landmark', () => {
    render(<AppShell name="Jobs" nav={SIX}>content</AppShell>);
    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link.getAttribute('href')).toBe('#nish-main');
    expect(link.className).toContain('nish-skip-link');
    const main = screen.getByRole('main');
    expect(main.id).toBe('nish-main');
    expect(main.textContent).toContain('content');
  });

  it('is the signed-out frame without nav: no tabs, rail, BottomNav or sheet', () => {
    render(<AppShell name="Jobs">Log in</AppShell>);
    expect(screen.queryAllByRole('navigation', { hidden: true })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'More', hidden: true })).toBeNull();
    expect(screen.getByRole('main').textContent).toBe('Log in');
  });

  it('signed out, shows moreItems in the header menu at every width', () => {
    render(<AppShell name="Jobs" moreItems={[{ key: 'help', label: 'Help', icon, onSelect: () => {} }]}>x</AppShell>);
    expect(screen.getByRole('button', { name: 'More' }).parentElement?.className).toBe('inline-flex');
  });

  it('renders the banner in the sticky stack under the header', () => {
    render(<AppShell name="Jobs" nav={SIX} connection={false} banner={<p>Market closes early</p>}>x</AppShell>);
    const banner = screen.getByText('Market closes early');
    expect(banner.parentElement?.className).toContain('sticky');
    expect(screen.getByRole('main').contains(banner)).toBe(false);
  });

  it('shows the sidebar tools in the header below 1024px', () => {
    render(<AppShell name="Jobs" nav={SIX} sidebar={{ tools: <button type="button">Search</button> }}>x</AppShell>);
    const inHeader = within(screen.getByRole('banner')).getByRole('button', { name: 'Search' });
    expect(inHeader.parentElement?.className).toContain('lg:hidden');
  });

  it('puts a custom brand in the header instead of the home link', () => {
    render(<AppShell name="Jobs" brand={<button type="button">Profile: Ana</button>} nav={SIX}>x</AppShell>);
    expect(screen.getByRole('button', { name: 'Profile: Ana' }).closest('a')).toBeNull();
    expect(screen.getByRole('banner').querySelector('a[href="/"]')).toBeNull();
  });

  it('with sidebar, lists every item in a sidebar instead of header tabs and remembers collapsing', () => {
    localStorage.removeItem('nish-sidebar-collapsed');
    const { unmount } = render(<AppShell name="Jobs" nav={SIX} sidebar>x</AppShell>);
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('navigation', { hidden: true })).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar', hidden: true });
    const side = toggle.parentElement?.parentElement as HTMLElement;
    expect(within(side).getAllByRole('link', { hidden: true }).map((a) => a.textContent)).toEqual(SIX.map((i) => i.label));
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Expand sidebar', hidden: true }).getAttribute('aria-label')).toBe('Expand sidebar');
    expect(localStorage.getItem('nish-sidebar-collapsed')).toBe('true');
    unmount();
    render(<AppShell name="Jobs" nav={SIX} sidebar>x</AppShell>);
    expect(screen.getByRole('button', { name: 'Expand sidebar', hidden: true })).toBeTruthy();
    localStorage.removeItem('nish-sidebar-collapsed');
  });

  it('a controlled sidebar reports the toggle and keeps the given state', () => {
    const changes: boolean[] = [];
    render(<AppShell name="Jobs" nav={SIX} sidebar={{ collapsed: false, onCollapsedChange: (c) => changes.push(c), storageKey: false }}>x</AppShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar', hidden: true }));
    expect(changes).toEqual([true]);
    expect(screen.getByRole('button', { name: 'Collapse sidebar', hidden: true })).toBeTruthy();
  });

  it('shows 4 items and More in the BottomNav when nav has 6', () => {
    render(<AppShell name="Jobs" nav={SIX}>x</AppShell>);
    const bar = within(bottomNav());
    expect(bar.getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Jobs', 'Saved', 'Alerts']);
    expect(bar.getByRole('button', { name: 'More' })).toBeTruthy();
  });

  it('has no More when nav has 5', () => {
    render(<AppShell name="Jobs" nav={FIVE}>x</AppShell>);
    const bar = within(bottomNav());
    expect(bar.getAllByRole('link')).toHaveLength(5);
    expect(bar.queryByRole('button', { name: 'More' })).toBeNull();
  });

  it('opens the MoreSheet with the overflow items and closes it when resetKey changes', () => {
    const { rerender } = render(<AppShell name="Jobs" nav={SIX} resetKey="/home">x</AppShell>);
    fireEvent.click(within(bottomNav()).getByRole('button', { name: 'More' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('link').map((a) => a.textContent)).toEqual(['Reports', 'Settings']);
    rerender(<AppShell name="Jobs" nav={SIX} resetKey="/reports">x</AppShell>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('puts moreItems after the overflow items in the sheet and keeps the sheet when only moreItems exist', () => {
    const out: NavItem = { key: 'out', label: 'Sign out', icon, onSelect: () => {} };
    render(<AppShell name="Jobs" nav={FIVE} moreItems={[out]}>x</AppShell>);
    act(() => {
      fireEvent.click(within(bottomNav()).getByRole('button', { name: 'More' }));
    });
    expect(within(screen.getByRole('dialog')).getByText('Sign out')).toBeTruthy();
  });

  it('shows the error fallback for a throwing page and resets on resetKey change', () => {
    const Boom = ({ on }: { on: boolean }) => {
      if (on) throw new Error('kaput');
      return <p>fine</p>;
    };
    const err = console.error;
    console.error = () => {};
    try {
      const { rerender } = render(<AppShell name="Jobs" nav={FIVE} resetKey="/a"><Boom on /></AppShell>);
      expect(within(screen.getByRole('main')).getByRole('alert').textContent).toContain('kaput');
      rerender(<AppShell name="Jobs" nav={FIVE} resetKey="/b"><Boom on={false} /></AppShell>);
      expect(screen.getByText('fine')).toBeTruthy();
    } finally {
      console.error = err;
    }
  });
});

describe('AppShell: hub pill', () => {
  it('shows no hub pill by default', () => {
    render(<AppShell name="Jobs" nav={FIVE}>x</AppShell>);
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: /nish\.software/ })).toBeNull();
    expect(document.querySelector('.nish-pill-link')).toBeNull();
  });

  it('renders the pill in the compact form when hub is given', () => {
    render(<AppShell name="Jobs" nav={FIVE} hub={{ href: 'https://nish.software', label: 'nish.software' }}>x</AppShell>);
    const pill = within(screen.getByRole('banner')).getByRole('link', { name: /nish\.software/ });
    expect(pill.getAttribute('href')).toBe('https://nish.software');
    expect(pill.className).toContain('nish-pill-link--compact');
    expect(pill.getAttribute('title')).toBe('Back to nish.software');
  });

  it('accepts a custom label and title for an outside hub', () => {
    render(<AppShell name="Jobs" hub={{ href: 'https://acme.example', label: 'Acme home', title: 'Back to Acme' }}>x</AppShell>);
    const pill = screen.getByRole('link', { name: /Acme home/ });
    expect(pill.getAttribute('title')).toBe('Back to Acme');
  });
});

describe('AppShell: landmarks', () => {
  const navNames = () => screen.getAllByRole('navigation', { hidden: true }).map((n) => n.getAttribute('aria-label'));

  it('names every app navigation "Sections" by default, and the sidebar "Sidebar"', () => {
    const { unmount } = render(<AppShell name="Jobs" nav={FIVE}>x</AppShell>);
    expect(navNames()).toEqual(['Sections', 'Sections', 'Sections']);
    unmount();
    render(<AppShell name="Jobs" nav={FIVE} sidebar>x</AppShell>);
    expect(navNames()).toEqual(['Sections', 'Sections', 'Sections']);
    expect(screen.getByRole('complementary', { name: 'Sidebar', hidden: true })).toBeTruthy();
  });

  it('uses navLabel for the header tabs, rail, sidebar nav and BottomNav', () => {
    const { unmount } = render(<AppShell name="Jobs" nav={FIVE} navLabel="Main">x</AppShell>);
    expect(navNames()).toEqual(['Main', 'Main', 'Main']);
    unmount();
    render(<AppShell name="Jobs" nav={FIVE} navLabel="Main" sidebar>x</AppShell>);
    expect(navNames()).toEqual(['Main', 'Main', 'Main']);
  });

  it('takes the landmark names from a provider', () => {
    render(
      <NishProvider strings={{ sections: 'Rubriques', sidebar: 'Barre' }}>
        <AppShell name="Jobs" nav={FIVE} sidebar>x</AppShell>
      </NishProvider>,
    );
    expect(navNames()).toEqual(['Rubriques', 'Rubriques', 'Rubriques']);
    expect(screen.getByRole('complementary', { name: 'Barre', hidden: true })).toBeTruthy();
  });

  it('keeps a SectionNav on the page distinct from the app navigation', () => {
    render(
      <AppShell name="Jobs" nav={FIVE}>
        <SectionNav items={[{ id: 'a', label: 'A' }]} />
      </AppShell>,
    );
    const names = navNames();
    expect(names.filter((n) => n === 'On this page')).toHaveLength(1);
    expect(names.filter((n) => n === 'Sections')).toHaveLength(3);
  });
});

describe('AppShell: skip link and main', () => {
  it('takes the skip link text from a provider', () => {
    render(
      <NishProvider strings={{ skipToContent: 'Aller au contenu' }}>
        <AppShell name="Jobs">x</AppShell>
      </NishProvider>,
    );
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toBeTruthy();
  });

  it('focuses the main element when the skip link is clicked, without changing the hash', () => {
    render(<AppShell name="Jobs">x</AppShell>);
    const before = location.hash;
    fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(location.hash).toBe(before);
  });

  it('supports another mainId for a second shell on the page', () => {
    render(<AppShell name="Jobs" mainId="app-two">x</AppShell>);
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#app-two');
    expect(screen.getByRole('main').id).toBe('app-two');
  });
});

describe('AppShell: moreItems', () => {
  it('does not render a moreItem with an unsafe href, in the header menu or the sheet', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad: NavItem = { key: 'evil-shell', label: 'Evil', icon, href: 'javascript:alert(1)//shell' };
    const good: NavItem = { key: 'help', label: 'Help', icon, href: '/help' };
    render(<AppShell name="Jobs" nav={FIVE} moreItems={[bad, good]}>x</AppShell>);
    fireEvent.click(screen.getAllByRole('button', { name: 'More' }).find((b) => b.getAttribute('aria-haspopup') === 'menu') as HTMLElement);
    expect(screen.queryByText('Evil')).toBeNull();
    expect(screen.getByRole('menuitem', { name: /Help/ })).toBeTruthy();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('"evil-shell"'))).toBe(true);
  });

  it('follows a safe href with a full page load when there is no onSelect', () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, assign } });
    try {
      render(<AppShell name="Jobs" moreItems={[{ key: 'help', label: 'Help', icon, href: '/help' }]}>x</AppShell>);
      fireEvent.click(screen.getByRole('button', { name: 'More' }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Help/ }));
      expect(assign).toHaveBeenCalledWith('/help');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('runs onSelect instead of navigating when both are given', () => {
    const assign = vi.fn();
    const onSelect = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, assign } });
    try {
      render(<AppShell name="Jobs" moreItems={[{ key: 'out', label: 'Sign out', icon, href: '/out', onSelect }]}>x</AppShell>);
      fireEvent.click(screen.getByRole('button', { name: 'More' }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Sign out/ }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(assign).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('names the header menu button from the more string', () => {
    render(
      <NishProvider strings={{ more: 'Plus' }}>
        <AppShell name="Jobs" moreItems={[{ key: 'help', label: 'Help', icon, onSelect: () => {} }]}>x</AppShell>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Plus' })).toBeTruthy();
  });

  it('drops a nav item with an unsafe href from every nav', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const nav = [item('home', 'Home', true), { ...item('bad', 'Bad'), href: 'data:text/html,x' }];
    render(<AppShell name="Jobs" nav={nav}>x</AppShell>);
    expect(screen.queryByText('Bad')).toBeNull();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  });
});
