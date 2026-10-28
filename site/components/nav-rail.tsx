import { useState } from 'react';
import { IconButton, NavRail, ThemeToggle } from '../../src';
import { SettingsIcon } from '../lib/icons';
import { DEMO_ITEMS, Device, Filler, withState } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- NavRail --------------------------------------------------------------------------------

type HideFrom = 'lg' | 'xl' | 'none';

function RailDemo({ count = 4, tools = true, footer = false, hideFrom = 'lg' }: { count?: number; tools?: boolean; footer?: boolean; hideFrom?: HideFrom }) {
  const [active, setActive] = useState('home');
  return (
    <div className="flex min-h-dvh">
      <NavRail
        items={withState(DEMO_ITEMS.slice(0, count), active, setActive).map((i) => (i.key === 'alerts' ? { ...i, badge: 3 } : i))}
        tools={
          tools ? (
            <IconButton label="Settings">
              <SettingsIcon size={18} />
            </IconButton>
          ) : undefined
        }
        footer={footer ? <ThemeToggle /> : undefined}
        hideFrom={hideFrom === 'none' ? false : hideFrom}
      />
      <div className="min-w-0 flex-1">
        <Filler title="Home" rows={6} />
      </div>
    </div>
  );
}

export const navRail: ComponentDoc = {
  id: 'nav-rail',
  name: 'NavRail',
  exports: ['NavRail'],
  summary:
    'A 72px icon rail for the unfolded and tablet range between the phone BottomNav and a full sidebar. Each destination is an icon in a pill over an 11px label; the hint shows as a tooltip on mouse hover and keyboard focus. Visible from md up to (not including) lg by default.',
  importLine: "import { NavRail } from '@nish/ui';",
  controls: [
    { key: 'count', label: 'Items', type: 'number', min: 2, max: 5 },
    { key: 'tools', label: 'Tools group', type: 'boolean' },
    { key: 'footer', label: 'Footer slot', type: 'boolean' },
    { key: 'hideFrom', label: 'Hide from', type: 'select', options: ['lg', 'xl', 'none'] },
  ],
  initial: { count: 4, tools: true, footer: false, hideFrom: 'lg' },
  render: (a) => (
    <Device doc="nav-rail" args={a} width={840} height={420} title="NavRail at 840px">
      <RailDemo count={Number(a.count)} tools={!!a.tools} footer={!!a.footer} hideFrom={a.hideFrom as HideFrom} />
    </Device>
  ),
  code: (a) =>
    [
      '<NavRail',
      '  items={items}',
      ...(a.tools ? ['  tools={<IconButton label="Settings"><GearIcon /></IconButton>}'] : []),
      ...(a.footer ? ['  footer={<ThemeToggle />}'] : []),
      ...(a.hideFrom === 'xl' ? ['  hideFrom="xl"'] : a.hideFrom === 'none' ? ['  hideFrom={false}'] : []),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'unfolded',
      name: 'Unfolded (840px)',
      note: 'The preview is 840px wide: scroll it sideways on a phone.',
      wide: true,
      render: () => (
        <Device doc="nav-rail" story="unfolded" width={840} height={420} title="NavRail at 840px">
          <RailDemo />
        </Device>
      ),
    },
    {
      id: 'phone',
      name: 'Phone (360px): hidden',
      note: 'Below md the rail is display:none; BottomNav is the phone chrome.',
      render: () => (
        <Device doc="nav-rail" story="phone" height={300} title="NavRail at 360px">
          <RailDemo />
        </Device>
      ),
    },
    {
      id: 'desktop',
      name: 'Desktop (1100px), kept',
      note: 'From lg a sidebar of your own usually takes over and the rail hides. hideFrom={false} keeps it.',
      wide: true,
      render: () => (
        <Device doc="nav-rail" story="desktop" width={1100} height={300} title="NavRail at 1100px">
          <RailDemo hideFrom="none" />
        </Device>
      ),
    },
  ],
  usage: `import { BottomNav, NavRail } from '@nish/ui';

// The same items feed both: the rail shows between md and lg, the bar below md.
<NavRail items={items} tools={<SearchButton />} footer={<ThemeToggle />} />
<BottomNav items={items} />`,
  guidelines: [
    'Reuse the exact items array of BottomNav so the two never drift apart.',
    'The rail is a flex column of fixed width: put it beside your content in a flex row, not over it.',
    'Hints show on fine pointers only; on touch the labels already say what each item is.',
    'Below md and from lg it is display:none, so it can stay mounted at every width.',
  ],
};
