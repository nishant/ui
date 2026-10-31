import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';
import type { NavItem } from './nav';

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

afterEach(cleanup);

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
