import { useState } from 'react';
import { BottomNav, MoreSheet } from '../../src';
import { BottomNavDemo, DEMO_ITEMS, Device, Filler, MORE_ITEMS, withState } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- MoreSheet ------------------------------------------------------------------------------

function SheetDemo({ footer = true, startOpen = true }: { footer?: boolean; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [active, setActive] = useState('home');
  const items = withState(MORE_ITEMS, active, (k) => setActive(k));
  return (
    <>
      <Filler title="Settings" rows={5} />
      <BottomNav
        items={withState(DEMO_ITEMS.slice(0, 4), active, setActive)}
        more={{ active: MORE_ITEMS.some((m) => m.key === active) || open, expanded: open, onToggle: () => setOpen((o) => !o) }}
      />
      <MoreSheet
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        footer={footer ? undefined : <p className="px-5 py-3 text-xs text-th-hi3">Signed in as nish@example.com</p>}
      />
    </>
  );
}

export const moreSheet: ComponentDoc = {
  id: 'more-sheet',
  name: 'MoreSheet',
  exports: ['MoreSheet'],
  summary:
    'The overflow sheet behind the BottomNav More button: a bottom Drawer lifted above the bar so the bar stays visible and tappable. Rows are 52px with an icon, a label and a one-line hint; a Theme row is the default footer. It swipes down to close and closes on Android back.',
  importLine: "import { MoreSheet } from '@nish/ui';",
  controls: [{ key: 'footer', label: 'Default theme footer', type: 'boolean' }],
  initial: { footer: true },
  render: (a) => (
    <Device doc="more-sheet" args={a} height={520} title="MoreSheet at 360px">
      <SheetDemo footer={!!a.footer} />
    </Device>
  ),
  code: (a) =>
    [
      '<MoreSheet',
      '  open={moreOpen}',
      '  onClose={() => setMoreOpen(false)}',
      '  items={moreItems}',
      ...(a.footer ? [] : ['  footer={<AccountRow />}']),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'default',
      name: 'Over a BottomNav',
      note: 'The scrim and sheet stop at the bar (bottomOffset is --nish-bottom-nav-h). Swipe the handle down to dismiss.',
      render: () => (
        <Device doc="more-sheet" story="default" height={520} title="MoreSheet over a BottomNav">
          <SheetDemo />
        </Device>
      ),
    },
    {
      id: 'footer',
      name: 'Custom footer',
      render: () => (
        <Device doc="more-sheet" story="footer" height={520} title="MoreSheet with a custom footer">
          <SheetDemo footer={false} />
        </Device>
      ),
    },
    {
      id: 'closed',
      name: 'Opened from the bar',
      note: 'Tap More in the bar below.',
      render: () => (
        <Device doc="more-sheet" story="closed" height={420} title="MoreSheet opened from BottomNav">
          <BottomNavDemo count={4} badge={false} more />
        </Device>
      ),
    },
  ],
  usage: `import { BottomNav, MoreSheet, ThemeToggle } from '@nish/ui';

const [moreOpen, setMoreOpen] = useState(false);

<BottomNav items={tabs} more={{ active: false, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }} />
<MoreSheet
  open={moreOpen}
  onClose={() => setMoreOpen(false)}
  items={[
    { key: 'settings', label: 'Settings', icon: <GearIcon />, href: '/settings', hint: 'Account and preferences' },
    { key: 'help', label: 'Help', icon: <HelpIcon />, href: '/help' },
  ]}
/>`,
  guidelines: [
    'Render it next to BottomNav and drive it with the same state as the More button, so aria-expanded stays true.',
    'Choosing a row runs its onSelect or follows its href and closes the sheet; you do not close it yourself.',
    'Use the hint line for what the page is for, not for its name. Keep it to one line.',
    'Without a BottomNav (--nish-bottom-nav-h is 0) it is a plain bottom sheet.',
  ],
};
