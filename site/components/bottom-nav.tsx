import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BottomNav, MoreSheet, useTheme, type NavItem } from '../../src';
import { BellIcon, ChartIcon, InboxIcon, LayersIcon, PaletteIcon, SearchIcon, SettingsIcon, ShieldIcon } from '../lib/icons';
import type { Args } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Shared helpers for the layout pages ----------------------------------------------------
// Fixed and sticky chrome (BottomNav, StickyActionBar, LoadingBar, NavRail ...) answers to the
// viewport, so it can only be shown honestly in a viewport of the right size. `Device` renders
// its children in an iframe of that size: the docs page loads this same app at
// #/frame/<doc>?...&bare=1 and the frame shows the children for real, with real media queries.

/** True inside a Device iframe (the URL carries bare=1). */
export function useBare(): boolean {
  return typeof location !== 'undefined' && /[?&]bare=1(&|$)/.test(location.hash);
}

interface DeviceProps {
  /** The id of the docs page whose story or canvas this is. */
  doc: string;
  /** The story id; leave out for the canvas (then `args` are passed to doc.render). */
  story?: string;
  args?: Args;
  /** CSS width of the viewport. Default `min(360px, 100%)`. */
  width?: number | string;
  height?: number;
  title: string;
  /** What the frame shows. Only mounted inside the frame. */
  children: ReactNode;
}

/** A viewport-sized preview: an iframe on the docs page, the real content inside the frame. */
export function Device({ doc, story, args, width = 'min(360px, 100%)', height = 460, title, children }: DeviceProps) {
  const bare = useBare();
  const { theme: globalTheme } = useTheme();
  const wrap = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(globalTheme);
  useEffect(() => {
    // The All themes view scopes a theme on an ancestor; follow it when there is one.
    const scoped = wrap.current?.closest('[data-theme]')?.getAttribute('data-theme');
    setTheme((scoped as typeof globalTheme | null) ?? globalTheme);
  }, [globalTheme]);

  if (bare) {
    return (
      <div className="-m-6 min-h-dvh min-w-0 flex-1 self-stretch bg-th-bg">
        {children}
      </div>
    );
  }
  const q = new URLSearchParams();
  if (story) q.set('story', story);
  else if (args) q.set('args', JSON.stringify(args));
  q.set('theme', theme);
  q.set('bare', '1');
  const src = `${location.href.split('#')[0]}#/frame/${doc}?${q}`;
  const fixed = typeof width === 'number';
  return (
    <div ref={wrap} className={fixed ? 'w-full max-w-full overflow-x-auto' : 'w-full'}>
      <iframe
        key={src}
        src={src}
        title={title}
        className="block shrink-0 rounded-xl border border-th-line bg-th-bg"
        style={{ width, maxWidth: fixed ? undefined : '100%', height }}
      />
    </div>
  );
}

/** Placeholder page content with the page gutter and the bottom inset, so scrolling and the
 *  bars above it have something to cover. */
export function Filler({ rows = 8, title = 'Page content' }: { rows?: number; title?: string }) {
  return (
    <div className="nish-pad-bottom-inset grid gap-3 px-[var(--nish-page-gutter)] py-4">
      <h2 className="text-lg font-semibold text-th-hi">{title}</h2>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-th-line bg-th-surface p-4">
          <p className="text-sm font-medium text-th-hi">Item {i + 1}</p>
          <p className="mt-1 text-sm text-th-hi3">Scrolls under the bars so you can see that they are opaque.</p>
        </div>
      ))}
    </div>
  );
}

const ICON = 22;
export const DEMO_ITEMS: Omit<NavItem, 'active' | 'onSelect'>[] = [
  { key: 'home', label: 'Home', icon: <ChartIcon size={ICON} />, hint: 'Overview and recent activity' },
  { key: 'trips', label: 'Trips', icon: <LayersIcon size={ICON} />, hint: 'Plans, bookings and packing' },
  { key: 'alerts', label: 'Alerts', icon: <BellIcon size={ICON} />, hint: 'Price drops and reminders' },
  { key: 'search', label: 'Search', icon: <SearchIcon size={ICON} />, hint: 'Find anything' },
  { key: 'saved', label: 'Saved', icon: <InboxIcon size={ICON} />, hint: 'Places and links you kept' },
];
export const MORE_ITEMS: Omit<NavItem, 'active' | 'onSelect'>[] = [
  { key: 'inbox', label: 'Inbox', icon: <InboxIcon size={ICON} />, hint: 'Messages from your apps' },
  { key: 'security', label: 'Security', icon: <ShieldIcon size={ICON} />, hint: 'Sign-ins and devices' },
  { key: 'appearance', label: 'Appearance', icon: <PaletteIcon size={ICON} />, hint: 'Theme and density' },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon size={ICON} />, hint: 'Account and preferences' },
];

/** The demo's items with one active and a select handler. */
export function withState(items: Omit<NavItem, 'active' | 'onSelect'>[], active: string, set: (k: string) => void): NavItem[] {
  return items.map((i) => ({ ...i, active: i.key === active, onSelect: () => set(i.key) }));
}

// --- BottomNav ------------------------------------------------------------------------------

type HideFrom = 'md' | 'lg';

function BottomNavDemo({ count = 4, badge = true, more = false, trailing = false, hideFrom = 'md' }: { count?: number; badge?: boolean; more?: boolean; trailing?: boolean; hideFrom?: HideFrom }) {
  const [active, setActive] = useState('home');
  const [sheet, setSheet] = useState(false);
  const items = withState(DEMO_ITEMS.slice(0, count), active, setActive).map((i) => (badge && i.key === 'alerts' ? { ...i, badge: 3 } : i));
  const moreActive = MORE_ITEMS.some((m) => m.key === active);
  return (
    <>
      <Filler title="Home" />
      <BottomNav
        items={items}
        hideFrom={hideFrom}
        more={more ? { active: moreActive || sheet, expanded: sheet, onToggle: () => setSheet((s) => !s) } : undefined}
        trailing={trailing ? <span className="px-3 text-xs text-th-hi3">+</span> : undefined}
      />
      <MoreSheet
        open={sheet}
        onClose={() => setSheet(false)}
        items={withState(MORE_ITEMS, active, (k) => {
          setActive(k);
          setSheet(false);
        })}
      />
    </>
  );
}

const nav = (a: Args) => ({
  count: Number(a.count),
  badge: !!a.badge,
  more: !!a.more,
  trailing: !!a.trailing,
  hideFrom: (a.hideFrom as HideFrom) ?? 'md',
});

export { BottomNavDemo };

export const bottomNav: ComponentDoc = {
  id: 'bottom-nav',
  name: 'BottomNav',
  exports: ['BottomNav'],
  summary:
    'The phone tab bar: up to five destinations pinned to the bottom of the screen, opaque, with a pill on the current one and safe-area padding. It publishes its height as --nish-bottom-nav-h so toasts, page padding and sheets clear it, and hides itself from the md breakpoint, where NavRail takes over.',
  importLine: "import { BottomNav } from '@nish/ui';",
  controls: [
    { key: 'count', label: 'Items', type: 'number', min: 2, max: 5 },
    { key: 'badge', label: 'Badge on Alerts', type: 'boolean' },
    { key: 'more', label: 'More button', type: 'boolean' },
    { key: 'trailing', label: 'Trailing slot', type: 'boolean' },
    { key: 'hideFrom', label: 'Hide from', type: 'select', options: ['md', 'lg'] },
  ],
  initial: { count: 4, badge: true, more: true, trailing: false, hideFrom: 'md' },
  render: (a) => (
    <Device doc="bottom-nav" args={a} title="BottomNav at 360px" height={480}>
      <BottomNavDemo {...nav(a)} />
    </Device>
  ),
  code: (a) =>
    [
      '<BottomNav',
      '  items={[',
      ...DEMO_ITEMS.slice(0, Number(a.count)).map((i) => `    { key: '${i.key}', label: '${i.label}', icon: <${i.label}Icon />, href: '/${i.key}', active: page === '${i.key}'${a.badge && i.key === 'alerts' ? ', badge: 3' : ''} },`),
      '  ]}',
      ...(a.more ? ['  more={{ active: moreActive, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }}'] : []),
      ...(a.trailing ? ['  trailing={<AddButton />}'] : []),
      ...(a.hideFrom === 'lg' ? ["  hideFrom=\"lg\""] : []),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'four',
      name: 'Four destinations',
      note: 'Each cell is a 56px-tall target; the current page is a tinted pill with aria-current="page".',
      render: () => (
        <Device doc="bottom-nav" story="four" title="BottomNav, four items" height={420}>
          <BottomNavDemo count={4} badge={false} />
        </Device>
      ),
    },
    {
      id: 'more',
      name: 'Five with a More sheet',
      note: 'Tap More: the sheet rises above the bar and the bar stays tappable.',
      render: () => (
        <Device doc="bottom-nav" story="more" title="BottomNav with More" height={480}>
          <BottomNavDemo count={4} badge more />
        </Device>
      ),
    },
    {
      id: 'unfolded',
      name: 'Unfolded (840px): gone',
      note: 'From md the bar hides and publishes nothing; a NavRail takes over.',
      wide: true,
      render: () => (
        <Device doc="bottom-nav" story="unfolded" width={840} height={300} title="BottomNav at 840px">
          <BottomNavDemo count={4} />
        </Device>
      ),
    },
  ],
  usage: `import { BottomNav, MoreSheet, PageContainer } from '@nish/ui';

export function Shell({ children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <AppHeader name="trips" />
      <PageContainer>{children}</PageContainer>
      <BottomNav
        items={tabs}
        more={{ active: onMorePage, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }}
      />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} items={moreItems} />
    </>
  );
}`,
  guidelines: [
    'Four or five destinations at most; put the rest behind the More button and a MoreSheet.',
    'Give PageContainer (or the class nish-pad-bottom-inset) to the page so its last row clears the bar. Do not add your own bottom padding.',
    'Pass renderLink to use your router\'s Link; the bar adds the className and aria-current for you.',
    'Do not pass Toaster an offset: it reads --nish-bottom-nav-h and sits above the bar by itself.',
    'The bar is opaque on purpose. Content scrolls under it, so a see-through bar would show text through the labels.',
  ],
};
