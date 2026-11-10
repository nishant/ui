import { useState } from 'react';
import { BottomNav, MoreSheet } from '../../src';
import type { Args } from '../lib/jsx';
import { DEMO_ITEMS, Device, Filler, MORE_ITEMS, withState } from './device';
import type { ComponentDoc } from './types';

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
  html: {
    height: 240,
    code: `<nish-bottom-nav label="Sections">
  <a href="/" aria-current="page">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
    <span>Home</span>
  </a>
  <a href="/trips">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>
    <span>Trips</span>
  </a>
  <a href="/settings">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
    <span>Settings</span>
  </a>
</nish-bottom-nav>`,
  },
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
  usage: `import { useState } from 'react';
import { AppHeader, BottomNav, MoreSheet, PageContainer } from '@nish/ui';

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
    'The landmark takes the NishProvider sections string; pass label to name it differently. Items whose href is not safe (javascript:, data:) are not rendered. The current item is also marked data-state="active", and drawn in the system highlight color in forced-colors mode.',
    'Four or five destinations at most; put the rest behind the More button and a MoreSheet.',
    'Give PageContainer (or the class nish-pad-bottom-inset) to the page so its last row clears the bar. Do not add your own bottom padding.',
    'Pass renderLink to use your router\'s Link; the bar adds the className and aria-current for you.',
    'Do not pass Toaster an offset: it reads --nish-bottom-nav-h and sits above the bar by itself.',
    'The bar is opaque on purpose. Content scrolls under it, so a see-through bar would show text through the labels.',
  ],
};
