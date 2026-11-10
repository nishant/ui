import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTheme, type NavItem } from '../../src';
import { BellIcon, ChartIcon, InboxIcon, LayersIcon, PaletteIcon, SearchIcon, SettingsIcon, ShieldIcon } from '../lib/icons';
import type { Args } from '../lib/jsx';

// Phone-frame preview helpers several docs pages share.
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
    <div
      ref={wrap}
      className={fixed ? 'w-full max-w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-th-accent' : 'w-full'}
      {...(fixed ? { tabIndex: 0, role: 'region', 'aria-label': title || 'Device preview' } : {})}
    >
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
