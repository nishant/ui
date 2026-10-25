import { useState } from 'react';
import { Badge, Button, Card, IconButton } from '../../src';
import { Drawer } from '../../src';
import { SettingsIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- Drawer (framed) ----------------------------------------------------------------

type Side = 'right' | 'left' | 'bottom';
type Size = 'sm' | 'md' | 'lg';

const NOTES = [
  ['AMD crossed $180', 'Price alert · 2m ago', 'ok'],
  ['Order filled: 10 NVDA', 'Orders · 14m ago', 'accent'],
  ['Scan finished with 4 hits', 'Scanner · 1h ago', 'info'],
  ['Feed reconnecting', 'System · 3h ago', 'warn'],
] as const;

function NotificationList({ inCards = false }: { inCards?: boolean }) {
  return (
    <ul className="grid gap-2">
      {NOTES.map(([title, meta, tone]) =>
        inCards ? (
          <li key={title}>
            <Card padded={false} className="p-3">
              <p className="text-sm font-medium text-th-hi">{title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-th-hi3">
                <Badge tone={tone}>{tone}</Badge>
                {meta}
              </p>
            </Card>
          </li>
        ) : (
          <li key={title} className="border-b border-th-line pb-2 last:border-0">
            <p className="text-sm font-medium text-th-hi">{title}</p>
            <p className="mt-0.5 text-xs text-th-hi3">{meta}</p>
          </li>
        ),
      )}
    </ul>
  );
}

function DrawerPreview({
  side,
  size,
  footer,
  actions,
  inCards,
  title = 'Notifications',
}: {
  side: Side;
  size: Size;
  footer: boolean;
  actions: boolean;
  inCards?: boolean;
  title?: string;
}) {
  return (
    <Drawer
      title={title}
      subtitle="4 unread"
      side={side}
      size={size}
      onClose={() => undefined}
      actions={
        actions ? (
          <IconButton label="Notification settings">
            <SettingsIcon size={16} />
          </IconButton>
        ) : undefined
      }
      footer={
        footer ? (
          <>
            <Button variant="ghost">Mute for an hour</Button>
            <Button variant="primary">Mark all read</Button>
          </>
        ) : undefined
      }
    >
      <NotificationList inCards={inCards} />
    </Drawer>
  );
}

function MoreSheet() {
  return (
    <Drawer title="More" side="bottom" size="sm" bottomOffset="4rem" onClose={() => undefined}>
      <nav aria-label="More pages" className="-mx-2 grid gap-0.5">
        {['Scanner', 'Journal', 'Settings', 'Help'].map((p) => (
          <a key={p} href="#/components/drawer" className="rounded-lg px-3 py-2 text-sm text-th-hi2 hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11">
            {p}
          </a>
        ))}
      </nav>
    </Drawer>
  );
}

export function RealDrawerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Open a real one
      </Button>
      {open ? (
        <Drawer title="Notifications" subtitle="4 unread" onClose={() => setOpen(false)}>
          <NotificationList />
        </Drawer>
      ) : null}
    </>
  );
}

export const drawer: ComponentDoc = {
  id: 'drawer',
  name: 'Drawer',
  exports: ['Drawer'],
  summary:
    'A panel that slides in from an edge (notifications, an assistant, filters, a phone "More" sheet). It is a modal dialog like Modal: it traps Tab, closes on Escape and a scrim click, returns focus and locks page scroll.',
  importLine: "import { Drawer } from '@nish/ui';",
  controls: [
    { key: 'side', label: 'Side', type: 'select', options: ['right', 'left', 'bottom'] },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
    { key: 'actions', label: 'Header actions', type: 'boolean' },
    { key: 'footer', label: 'Footer', type: 'boolean' },
  ],
  initial: { side: 'right', size: 'md', actions: true, footer: true },
  render: (a) => <DrawerPreview side={a.side as Side} size={a.size as Size} actions={!!a.actions} footer={!!a.footer} />,
  code: (a) =>
    [
      '{open ? (',
      '  <Drawer',
      '    title="Notifications"',
      '    subtitle="4 unread"',
      ...(a.side === 'right' ? [] : [`    side="${a.side}"`]),
      ...(a.size === 'md' ? [] : [`    size="${a.size}"`]),
      ...(a.actions ? ['    actions={<IconButton label="Notification settings"><SettingsIcon /></IconButton>}'] : []),
      ...(a.footer ? ['    footer={<Button variant="primary" onClick={markAllRead}>Mark all read</Button>}'] : []),
      '    onClose={() => setOpen(false)}',
      '  >',
      '    <NotificationList />',
      '  </Drawer>',
      ') : null}',
    ].join('\n'),
  framed: { height: 480 },
  stories: [
    { id: 'right', name: 'Right, md', render: () => <DrawerPreview side="right" size="md" actions footer /> },
    { id: 'right-sm', name: 'Right, sm, no footer', render: () => <DrawerPreview side="right" size="sm" actions={false} footer={false} /> },
    { id: 'right-lg', name: 'Right, lg', note: 'Wide panels: an assistant, a compare view.', render: () => <DrawerPreview side="right" size="lg" actions footer title="Assistant" /> },
    { id: 'left', name: 'Left', render: () => <DrawerPreview side="left" size="sm" actions={false} footer={false} title="Filters" /> },
    { id: 'bottom', name: 'Bottom sheet', render: () => <DrawerPreview side="bottom" size="md" actions={false} footer /> },
    {
      id: 'bottom-offset',
      name: 'Bottom sheet above a tab bar',
      note: 'bottomOffset lifts the sheet (and its scrim) above the app’s bottom navigation.',
      render: () => <MoreSheet />,
    },
    { id: 'cards', name: 'Cards inside', render: () => <DrawerPreview side="right" size="md" actions footer inCards /> },
  ],
  usage: `import { useState } from 'react';
import { Drawer, IconButton } from '@nish/ui';

export function Notifications() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton label="Notifications" onClick={() => setOpen(true)}><BellIcon /></IconButton>
      {open ? (
        <Drawer title="Notifications" subtitle="4 unread" onClose={() => setOpen(false)}>
          <NotificationList />
        </Drawer>
      ) : null}
    </>
  );
}`,
  guidelines: [
    'Render the Drawer only while it is open, like Modal; unmounting closes it and returns focus to the opener.',
    'Use a Drawer for a side task that keeps the page in view (notifications, filters, details). Use a Modal for one decision.',
    'Under 640px side drawers take the full width. On phones with a bottom tab bar, use side="bottom" with bottomOffset.',
    'Header actions are IconButtons with labels; the close button is always there.',
  ],
};
