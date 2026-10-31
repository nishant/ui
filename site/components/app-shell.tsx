import { useState } from 'react';
import { AppShell } from '../../src';
import type { NavItem, PageContainerProps } from '../../src';
import { BellIcon, ChartIcon, InboxIcon, LayersIcon, PinIcon, SettingsIcon } from '../lib/icons';
import { Device } from './bottom-nav';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- AppShell -------------------------------------------------------------------------------

const ICON = 22;
const NAV: Omit<NavItem, 'active' | 'onSelect'>[] = [
  { key: 'home', label: 'Home', icon: <ChartIcon size={ICON} />, hint: 'Overview and recent activity' },
  { key: 'jobs', label: 'Jobs', icon: <LayersIcon size={ICON} />, hint: 'Open roles you track' },
  { key: 'saved', label: 'Saved', icon: <PinIcon size={ICON} />, hint: 'Roles you kept' },
  { key: 'alerts', label: 'Alerts', icon: <BellIcon size={ICON} />, hint: 'New matches and reminders' },
  { key: 'reports', label: 'Reports', icon: <InboxIcon size={ICON} />, hint: 'Weekly summaries' },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={ICON} />, hint: 'Account and preferences' },
];

type Container = Exclude<PageContainerProps['size'], undefined>;

function ShellDemo({ container = 'default', loading = false }: { container?: Container; loading?: boolean }) {
  const [active, setActive] = useState('home');
  const nav = NAV.map((i) => ({ ...i, active: i.key === active, onSelect: () => setActive(i.key) }));
  const current = NAV.find((i) => i.key === active);
  return (
    <AppShell name="Jobs" icon={<LayersIcon size={20} />} hubHref="#" homeHref="#" nav={nav} loading={loading} container={container} resetKey={active}>
      <h1 className="text-xl font-semibold text-th-hi">{current?.label}</h1>
      <p className="mt-1 text-sm text-th-hi3">The shell stays; this column is the page. Pick another destination to see the active state follow.</p>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl border border-th-line bg-th-surface p-4 text-sm text-th-hi2">
            Row {i + 1}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const appShell: ComponentDoc = {
  id: 'app-shell',
  name: 'AppShell',
  exports: ['AppShell'],
  summary:
    'The frame every app needs, from one nav list: a skip link, AppHeader, LoadingBar, ConnectionBanner, NavRail, BottomNav with a More sheet, PageContainer, an error boundary and the Toaster. Under 768px the bottom bar shows, from 768px the rail, from 1024px tabs in the header.',
  importLine: "import { AppShell } from '@nish/ui';",
  controls: [
    { key: 'container', label: 'Container', type: 'select', options: ['narrow', 'default', 'wide', 'full'] },
    { key: 'loading', label: 'Loading bar', type: 'boolean' },
  ],
  initial: { container: 'default', loading: false },
  render: (a) => (
    <Device doc="app-shell" args={a} height={560} title="AppShell at 360px">
      <ShellDemo container={a.container as Container} loading={!!a.loading} />
    </Device>
  ),
  code: (a) =>
    jsx(
      'AppShell',
      {
        name: 'Jobs',
        nav: '{nav}',
        container: a.container === 'default' ? undefined : a.container,
        loading: a.loading ? '{isFetching}' : undefined,
        resetKey: '{location.pathname}',
      },
      '\n  <Routes />\n',
    ),
  stories: [
    {
      id: 'rail',
      name: 'Navigation rail (840px)',
      note: 'From 768px the BottomNav gives way to a 72px rail that stays under the header.',
      wide: true,
      render: () => (
        <Device doc="app-shell" story="rail" width={840} height={460} title="AppShell at 840px">
          <ShellDemo />
        </Device>
      ),
    },
    {
      id: 'tabs',
      name: 'Header tabs (1440px)',
      note: 'From 1024px every destination is a tab in the header and the rail is gone.',
      wide: true,
      render: () => (
        <Device doc="app-shell" story="tabs" width={1440} height={460} title="AppShell at 1440px">
          <ShellDemo container="wide" />
        </Device>
      ),
    },
  ],
  usage: `import { AppShell } from '@nish/ui';
import { NavLink, Outlet, useLocation } from 'react-router';

const nav = [
  { key: 'home', label: 'Home', icon: <HomeIcon />, href: '/' },
  { key: 'jobs', label: 'Jobs', icon: <BriefcaseIcon />, href: '/jobs' },
  // ...
];

function Root() {
  const { pathname } = useLocation();
  return (
    <AppShell
      name="Jobs"
      icon={<BriefcaseIcon />}
      nav={nav.map((i) => ({ ...i, active: i.href === pathname }))}
      renderLink={(item, p) => <NavLink to={item.href!} {...p} />}
      resetKey={pathname}
    >
      <Outlet />
    </AppShell>
  );
}`,
  guidelines: [
    'One AppShell per app, at the root inside the router. Do not nest it or add your own AppHeader, BottomNav or Toaster beside it.',
    'Pass resetKey={location.pathname}: it clears the error fallback and closes the More sheet on navigation.',
    'Keep four primary items so the bar fits the Fold\'s cover screen. With five or fewer items they all show and there is no More button.',
    'moreItems (settings, sign out) appear last in the sheet, and from 768px in a More menu in the header. Give them onSelect.',
    'Set container to false for a full-bleed page (a map, a board). The <main id="nish-main"> landmark stays, so the skip link still works.',
  ],
};
