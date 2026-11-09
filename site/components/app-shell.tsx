import { useState } from 'react';
import { AppShell, Button, Callout, IconButton } from '../../src';
import type { NavItem, PageContainerProps } from '../../src';
import { BellIcon, ChartIcon, InboxIcon, LayersIcon, PinIcon, SettingsIcon } from '../lib/icons';
import { Device } from './bottom-nav';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- AppShell -------------------------------------------------------------------------------

const ICON = 22;
const HUB = { href: '#', label: 'nish.software' } as const;
const NAV: Omit<NavItem, 'active' | 'onSelect'>[] = [
  { key: 'home', label: 'Home', icon: <ChartIcon size={ICON} />, hint: 'Overview and recent activity' },
  { key: 'jobs', label: 'Jobs', icon: <LayersIcon size={ICON} />, hint: 'Open roles you track' },
  { key: 'saved', label: 'Saved', icon: <PinIcon size={ICON} />, hint: 'Roles you kept' },
  { key: 'alerts', label: 'Alerts', icon: <BellIcon size={ICON} />, hint: 'New matches and reminders' },
  { key: 'reports', label: 'Reports', icon: <InboxIcon size={ICON} />, hint: 'Weekly summaries' },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={ICON} />, hint: 'Account and preferences' },
];

type Container = Exclude<PageContainerProps['size'], undefined>;

interface ShellDemoProps {
  container?: Container;
  loading?: boolean;
  sidebar?: boolean;
  banner?: boolean;
  signedOut?: boolean;
  brand?: boolean;
  mode?: 'header';
  pills?: boolean;
  sidebarBrand?: boolean;
  pending?: boolean;
  footer?: boolean;
}

function ShellDemo({
  container = 'default',
  loading = false,
  sidebar = false,
  banner = false,
  signedOut = false,
  brand = false,
  mode,
  pills = false,
  sidebarBrand = false,
  pending = false,
  footer = false,
}: ShellDemoProps) {
  const [active, setActive] = useState('home');
  const items = (mode === 'header' ? NAV.slice(0, 3) : NAV).map((i) => (pills && i.key === 'alerts' ? { ...i, badge: 3 } : i));
  const nav = items.map((i) => ({ ...i, active: i.key === active, onSelect: () => setActive(i.key) }));
  const current = NAV.find((i) => i.key === active);
  if (signedOut) {
    return (
      <AppShell name="Jobs" icon={<LayersIcon size={20} />} hub={HUB} homeHref="#" container="narrow">
        <h1 className="text-xl font-semibold text-th-hi">Log in</h1>
        <p className="mt-1 text-sm text-th-hi3">No nav until you are signed in: the header, banners and page only.</p>
        <Button className="mt-4">Log in</Button>
      </AppShell>
    );
  }
  return (
    <AppShell
      name="Jobs"
      icon={<LayersIcon size={20} />}
      brand={
        brand ? (
          <Button variant="ghost" size="sm" className="font-semibold">
            Ana's search
          </Button>
        ) : undefined
      }
      hub={HUB}
      homeHref="#"
      nav={pending ? [] : nav}
      navMode={mode}
      tabs={pills ? 'pill' : undefined}
      navPending={pending ? 3 : undefined}
      footer={
        footer ? (
          <footer className="mt-10 border-t border-th-line pt-4 text-xs text-th-hi3">Checked every five minutes.</footer>
        ) : undefined
      }
      loading={loading}
      container={container}
      resetKey={active}
      sidebar={
        sidebarBrand
          ? {
              storageKey: false,
              tools: <IconButton label="Search"><InboxIcon size={18} /></IconButton>,
              brand: ({ collapsed }) =>
                collapsed ? (
                  <span className="text-base font-bold tracking-tight text-th-hi">Jobs</span>
                ) : (
                  <div>
                    <span className="text-lg font-bold tracking-tight text-th-hi">Jobs</span>
                    <p className="text-xs text-th-hi3">Search tracker</p>
                  </div>
                ),
            }
          : sidebar
            ? { storageKey: false, tools: <IconButton label="Search"><InboxIcon size={18} /></IconButton> }
            : false
      }
      banner={
        banner ? (
          <Callout variant="bar" tone="info" compact>
            Markets close at 1 pm today.
          </Callout>
        ) : undefined
      }
    >
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
    {
      id: 'sidebar',
      name: 'Collapsible sidebar (1440px)',
      note: 'With sidebar, from 1024px every destination is a row in a left sidebar instead of a header tab. The button at its foot collapses it to icons, where the label becomes the tooltip; the choice is remembered in localStorage.',
      wide: true,
      render: () => (
        <Device doc="app-shell" story="sidebar" width={1440} height={460} title="AppShell with a sidebar at 1440px">
          <ShellDemo container="wide" sidebar />
        </Device>
      ),
    },
    {
      id: 'banner',
      name: 'Banner slot',
      note: 'banner sits under the ConnectionBanner in one sticky stack under the header, so the two never overlap. The stack publishes its height as --nish-banners-h.',
      render: () => (
        <Device doc="app-shell" story="banner" height={460} title="AppShell with a banner at 360px">
          <ShellDemo banner />
        </Device>
      ),
    },
    {
      id: 'signed-out',
      name: 'Signed out',
      note: 'With no nav the shell draws no tabs, rail, sidebar, bottom bar or More sheet: the frame for a sign-in page.',
      render: () => (
        <Device doc="app-shell" story="signed-out" height={460} title="AppShell signed out at 360px">
          <ShellDemo signedOut />
        </Device>
      ),
    },
    {
      id: 'brand',
      name: 'Custom brand',
      note: 'brand replaces the icon, the name and their home link, for a profile switcher or a wordmark with a subtitle.',
      render: () => (
        <Device doc="app-shell" story="brand" height={460} title="AppShell with a custom brand at 360px">
          <ShellDemo brand />
        </Device>
      ),
    },
    {
      id: 'header-tabs',
      name: 'Header tabs at every width',
      note: "navMode=\"header\" keeps two or three destinations as tabs on the header's second row at every width, with no bottom bar, rail or sidebar. The tabs scroll sideways if they ever outgrow the row.",
      render: () => (
        <Device doc="app-shell" story="header-tabs" height={460} title="AppShell with header tabs at 360px">
          <ShellDemo mode="header" />
        </Device>
      ),
    },
    {
      id: 'pills',
      name: 'Pill tabs with a badge (1440px)',
      note: "tabs=\"pill\" puts the destinations in the header row as pills from 1024px. An item's badge shows on its pill, in the rail and in the bottom bar.",
      wide: true,
      render: () => (
        <Device doc="app-shell" story="pills" width={1440} height={460} title="AppShell with pill tabs at 1440px">
          <ShellDemo container="wide" pills />
        </Device>
      ),
    },
    {
      id: 'sidebar-brand',
      name: 'Sidebar without a header (1440px)',
      note: 'sidebar.brand moves the brand to the top of the sidebar from 1024px and drops the header: the hub pill sits above the brand, the tools under it and the theme toggle at the foot. Collapsed, a slim bar above the page holds the pill and the brand.',
      wide: true,
      render: () => (
        <Device doc="app-shell" story="sidebar-brand" width={1440} height={460} title="AppShell with a sidebar brand at 1440px">
          <ShellDemo container="wide" sidebarBrand />
        </Device>
      ),
    },
    {
      id: 'pending',
      name: 'Checking sign-in (1440px)',
      note: 'navPending draws placeholder tabs while the app checks whether someone is signed in, so the header keeps its height.',
      wide: true,
      render: () => (
        <Device doc="app-shell" story="pending" width={1440} height={300} title="AppShell checking sign-in at 1440px">
          <ShellDemo container="wide" pending />
        </Device>
      ),
    },
    {
      id: 'footer',
      name: 'Footer',
      note: 'footer renders after the page in the same container, outside the main landmark.',
      render: () => (
        <Device doc="app-shell" story="footer" height={460} title="AppShell with a footer at 360px">
          <ShellDemo footer />
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
    'Use <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"> and no static <meta name="theme-color">: theme-init.js creates and updates its own from the active theme, and removes a static one at load.',
    'Pass resetKey={location.pathname}: it clears the error fallback and closes the More sheet on navigation.',
    'Keep four primary items so the bar fits the Fold\'s cover screen. With five or fewer items they all show and there is no More button.',
    'moreItems (settings, sign out) appear last in the sheet, and from 768px in a More menu in the header. Give them onSelect.',
    'Set container to false for a full-bleed page (a map, a board). The <main id="nish-main"> landmark stays, so the skip link still works.',
    'Signed out, render the same AppShell with no nav (nav={signedIn ? nav : []}), so the header and banners do not jump when someone logs in.',
    'Put app banners (a live alert, maintenance) in banner, not above the page: they stay under the header while the page scrolls, below the ConnectionBanner.',
    "The hub pill is off by default. The nish.software apps pass hub={{ href: 'https://nish.software', label: 'nish.software' }}; an outside app passes its own home site, or nothing.",
    'Landmarks: the header tabs, the rail, the sidebar nav and the BottomNav share one name (navLabel, default "Sections") because only one shows at a time. Name any extra nav on the page differently (SectionNav defaults to "On this page").',
    'moreItems without renderLink navigate with window.location.assign after safeUrl; an item whose href is javascript: or data: is not rendered (a dev warning names it).',
    'Use sidebar when there are more destinations than fit as header tabs at 1024px, or when the app needs tools beside the nav. Its tools move into the header below 1024px; its footer shows in the sidebar only. Give each item a hint: it is the tooltip in the expanded sidebar and the rail.',
    'Use navMode="header" for an app with two or three pages that fit as tabs on a 360px screen. It has no More sheet, so moreItems go in the header More menu at every width.',
    'bottomNav names the bottom bar items by key when the first four are not the right ones. Every other nav item goes in the More sheet, in nav order, before moreItems.',
    'moreMenu={false} drops the header More menu. Use it only when every moreItem is also in actions from 768px, so nothing is phone-only.',
    'fullHeight gives the page exactly the height under the header and banners, for a page that scrolls inside its own panes. The container and footer are not used.',
    'Sidebar tools and (in brand mode) actions are mounted twice, with CSS showing one, so they must not hold global key listeners, fixed ids or open state.',
    'shortLabel is the label in the rail and the bottom bar when the full one does not fit; the full label stays in the sidebar, the header and the More sheet, and is the rail tooltip when there is no hint.',
    'The More sheet loads on demand (when the page is idle, or on the first tap of More), so it costs nothing at startup.',
  ],
};
