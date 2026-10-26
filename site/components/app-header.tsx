import { IconButton, tabClass } from '../../src';
import { AppHeader } from '../../src';
import { jsx } from '../lib/jsx';
import { BellIcon, ChartIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- AppHeader ----------------------------------------------------------------------

const navLink = (active: boolean) => tabClass({ active });

const NAV = (
  <>
    {['Overview', 'Positions', 'Scans', 'Alerts'].map((n, i) => (
      <a key={n} href="#" aria-current={i === 0 ? 'page' : undefined} className={navLink(i === 0)}>
        {n}
      </a>
    ))}
  </>
);

const Bell = () => (
  <IconButton label="Notifications">
    <BellIcon size={16} />
  </IconButton>
);

export const appHeader: ComponentDoc = {
  id: 'app-header',
  name: 'AppHeader',
  exports: ['AppHeader'],
  summary:
    'The header every app shares: the "← nish.software" pill, the wordmark, actions and the theme toggle, with an optional nav row. Glass background, safe-area aware.',
  importLine: "import { AppHeader } from '@nish/ui';",
  controls: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'actions', label: 'Actions', type: 'boolean' },
    { key: 'nav', label: 'Nav row', type: 'boolean' },
    { key: 'toggle', label: 'Theme toggle', type: 'boolean' },
  ],
  initial: { name: 'trading', icon: true, actions: true, nav: true, toggle: true },
  render: (a) => (
    <div className="w-full overflow-hidden rounded-xl border border-th-line">
      <AppHeader
        sticky={false}
        name={String(a.name)}
        icon={a.icon ? <ChartIcon size={20} /> : undefined}
        actions={a.actions ? <Bell /> : undefined}
        nav={a.nav ? NAV : undefined}
        themeToggle={a.toggle ? undefined : false}
      />
      <div className="h-16 bg-th-bg" />
    </div>
  ),
  code: (a) =>
    jsx('AppHeader', {
      name: a.name,
      icon: a.icon ? '{<ChartLine />}' : undefined,
      actions: a.actions ? '{<IconButton label="Notifications"><Bell /></IconButton>}' : undefined,
      nav: a.nav ? '{<Nav />}' : undefined,
      themeToggle: a.toggle ? undefined : '{false}',
    }),
  stories: [
    {
      id: 'default',
      name: 'Name and toggle',
      wide: true,
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-th-line">
          <AppHeader sticky={false} name="status" />
        </div>
      ),
    },
    {
      id: 'full',
      name: 'Icon, actions and nav',
      wide: true,
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-th-line">
          <AppHeader sticky={false} name="trading" icon={<ChartIcon size={20} />} actions={<Bell />} nav={NAV} />
        </div>
      ),
    },
    {
      id: 'no-toggle',
      name: 'Without the toggle, centered width',
      wide: true,
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-th-line">
          <AppHeader sticky={false} name="trackers" themeToggle={false} innerClassName="mx-auto max-w-3xl" actions={<Bell />} />
        </div>
      ),
    },

    {
      id: 'home-link',
      name: 'Name links home; icon only on phones',
      note: 'homeHref makes the icon and name one 44px link. hideNameBelow="sm" keeps only the icon under 640px (the name stays for screen readers). compactPill shrinks the hub pill under 480px.',
      wide: true,
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-th-line">
          <AppHeader
            name="Status"
            icon={<ChartIcon />}
            homeHref="#/components/app-header"
            hideNameBelow="sm"
            compactPill
            sticky={false}
            navLabel="Status"
            nav={
              <>
                <a href="#/components/app-header" aria-current="page" className={tabClass({ active: true })}>
                  Services
                </a>
                <a href="#/components/app-header" className={tabClass({ active: false })}>
                  This PC
                </a>
              </>
            }
          />
        </div>
      ),
    },
  ],
  usage: `import { AppHeader } from '@nish/ui';
import { NavLink } from 'react-router';

<AppHeader
  name="trackers"
  icon={<Tag />}
  innerClassName="mx-auto max-w-[1440px]"
  nav={ROUTES.map((r) => (
    <NavLink key={r.to} to={r.to} className={({ isActive }) => tabClass({ active: isActive })}>{r.label}</NavLink>
  ))}
/>`,
  guidelines: [
    'Every app shows the hub pill at every width; do not hide it on phones.',
    'Keep actions to icon buttons; the wordmark truncates first when space runs out.',
    'Nav links use tabClass and aria-current="page", not Tabs: they navigate.',
  ],
};
