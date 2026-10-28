import { useState } from 'react';
import { BottomNav, Button, Input, StickyActionBar } from '../../src';
import { DEMO_ITEMS, Device, Filler, withState } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- StickyActionBar ------------------------------------------------------------------------

function Form({ withNav = false, message = true, secondary = true, startOpen = true }: { withNav?: boolean; message?: boolean; secondary?: boolean; startOpen?: boolean }) {
  const [dirty, setDirty] = useState(startOpen);
  const [tab, setTab] = useState('home');
  return (
    <>
      <div className="nish-pad-bottom-inset px-[var(--nish-page-gutter)] py-4">
        <h2 className="mb-3 text-lg font-semibold text-th-hi">Trip details</h2>
        <div className="grid gap-3">
          <Input aria-label="Name" defaultValue="Lisbon, March" onChange={() => setDirty(true)} />
          <Input aria-label="Dates" defaultValue="Mar 12 – 16" onChange={() => setDirty(true)} />
          <Input aria-label="Notes" defaultValue="Book the tram pass" onChange={() => setDirty(true)} />
        </div>
        <Filler title="Itinerary" rows={5} />
      </div>
      {withNav ? <BottomNav items={withState(DEMO_ITEMS.slice(0, 4), tab, setTab)} /> : null}
      <StickyActionBar
        open={dirty}
        message={message ? '3 unsaved changes' : undefined}
        secondary={
          secondary ? (
            <Button variant="ghost" onClick={() => setDirty(false)}>
              Discard
            </Button>
          ) : undefined
        }
        primary={
          <Button variant="primary" onClick={() => setDirty(false)}>
            Save
          </Button>
        }
      />
    </>
  );
}

export const stickyActionBar: ComponentDoc = {
  id: 'sticky-action-bar',
  name: 'StickyActionBar',
  exports: ['StickyActionBar'],
  summary:
    'A bar fixed to the bottom of the screen for the actions of an unsaved form or a selection. It sits above a BottomNav when there is one, publishes --nish-bottom-bar-h while open so page padding and toasts clear it, slides up, and from sm floats as a pill at the bottom right.',
  importLine: "import { StickyActionBar } from '@nish/ui';",
  controls: [
    { key: 'withNav', label: 'With a BottomNav', type: 'boolean' },
    { key: 'message', label: 'Message', type: 'boolean' },
    { key: 'secondary', label: 'Secondary action', type: 'boolean' },
  ],
  initial: { withNav: false, message: true, secondary: true },
  render: (a) => (
    <Device doc="sticky-action-bar" args={a} height={460} title="StickyActionBar at 360px">
      <Form withNav={!!a.withNav} message={!!a.message} secondary={!!a.secondary} />
    </Device>
  ),
  code: (a) =>
    [
      '<StickyActionBar',
      '  open={dirty}',
      ...(a.message ? ['  message={`${changes} unsaved changes`}'] : []),
      ...(a.secondary ? ['  secondary={<Button variant="ghost" onClick={discard}>Discard</Button>}'] : []),
      '  primary={<Button variant="primary" onClick={save}>Save</Button>}',
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'form',
      name: 'Unsaved form',
      note: 'Edit a field after saving and the bar slides back up.',
      render: () => (
        <Device doc="sticky-action-bar" story="form" height={460} title="StickyActionBar on a form">
          <Form />
        </Device>
      ),
    },
    {
      id: 'nav',
      name: 'Above a BottomNav',
      note: 'The bar rests on the nav; the nav keeps the safe-area padding.',
      render: () => (
        <Device doc="sticky-action-bar" story="nav" height={460} title="StickyActionBar above a BottomNav">
          <Form withNav />
        </Device>
      ),
    },
    {
      id: 'pill',
      name: 'Wider than sm: a floating pill',
      wide: true,
      render: () => (
        <Device doc="sticky-action-bar" story="pill" width={840} height={380} title="StickyActionBar at 840px">
          <Form />
        </Device>
      ),
    },
  ],
  usage: `import { Button, StickyActionBar } from '@nish/ui';

<StickyActionBar
  open={form.isDirty}
  message={\`\${count} unsaved changes\`}
  secondary={<Button variant="ghost" onClick={form.reset}>Discard</Button>}
  primary={<Button variant="primary" loading={saving} onClick={save}>Save</Button>}
/>`,
  guidelines: [
    'Use it for the page\'s one pending decision: save or discard a form, act on a selection. Not for navigation.',
    'Closed, it renders nothing and publishes no height. PageContainer already pads for it while it is open.',
    'Primary goes last (right). Keep both buttons short; the message truncates to one line.',
    'It is opaque and has a shadow so rows scrolling under it never show through.',
  ],
};
