import { useState } from 'react';
import { BottomNav, MoreSheet } from '../../src';
import { BottomNavDemo } from './bottom-nav';
import { DEMO_ITEMS, Device, Filler, MORE_ITEMS, withState } from './device';
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
  html: {
    height: 420,
    // The static version is the generic <nish-sheet> holding a .nish-list of links; the React
    // MoreSheet adds the BottomNav offset and the Theme row that the static sheet does not have.
    code: `<button type="button" class="nish-btn" data-sheet-open="more">Open the sheet</button>

<nish-sheet id="more" label="More">
  <header class="nish-sheet-header">
    <h2 class="nish-sheet-title">More</h2>
    <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">×</button>
  </header>
  <nav class="nish-sheet-body" aria-label="More">
    <ul class="nish-list">
      <li><a class="nish-list-row" href="#inbox">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13v6h16v-6"/><path d="M4 13l3-8h10l3 8h-5a3 3 0 0 1-6 0z"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Inbox</span><span class="nish-list-subtitle">Messages from your apps</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#security">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Security</span><span class="nish-list-subtitle">Sign-ins and devices</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#appearance">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Appearance</span><span class="nish-list-subtitle">Theme and density</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#settings">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Settings</span><span class="nish-list-subtitle">Account and preferences</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
    </ul>
  </nav>
  <footer class="nish-sheet-footer">
    <button type="button" class="nish-btn nish-btn--primary" data-sheet-close>Done</button>
  </footer>
</nish-sheet>

<script>
  document.getElementById('more').addEventListener('nish-close', () => console.log('closed'));
</script>`,
  },
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
    'The title and the Theme row come from the NishProvider more and theme strings; title overrides the title per sheet. Items whose href is not safe are not rendered.',
    'Render it next to BottomNav and drive it with the same state as the More button, so aria-expanded stays true.',
    'Choosing a row runs its onSelect or follows its href and closes the sheet; you do not close it yourself.',
    'Use the hint line for what the page is for, not for its name. Keep it to one line.',
    "Pass renderLink to render each row's link yourself, for your router's Link. Spread the props it receives (className, children, aria-current, onClick) onto the link; replace is true inside the sheet.",
    'Without a BottomNav (--nish-bottom-nav-h is 0) it is a plain bottom sheet.',
  ],
};
