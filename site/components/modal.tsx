import { useState, type ReactNode } from 'react';
import { Badge, Button, Input, Label, Modal } from '../../src';
import type { ComponentDoc } from './types';

// --- Modal (framed) -----------------------------------------------------------------

function ModalPreview({ size, footer, long, title, subtitle }: { size: 'md' | 'lg' | 'xl'; footer: boolean; long: boolean; title: string; subtitle?: ReactNode }) {
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      size={size}
      onClose={() => undefined}
      footer={
        footer ? (
          <>
            <Button>Cancel</Button>
            <Button variant="danger">Close position</Button>
          </>
        ) : undefined
      }
    >
      <p>Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.</p>
      {long ? (
        <div className="mt-4 space-y-3">
          {[
            ['Mark price', '$4.15'],
            ['Cost basis', '$3.20'],
            ['Unrealized gain', '+$190.00'],
            ['Days to expiry', '26'],
            ['Delta', '0.42'],
            ['Implied volatility', '48%'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-th-line pb-2">
              <span className="text-th-hi3">{k}</span>
              <span className="tabular-nums text-th-hi">{v}</span>
            </div>
          ))}
          <p>Market orders fill at the best available price, which can differ from the mark during fast moves.</p>
        </div>
      ) : (
        <label className="mt-4 grid gap-1.5">
          <Label>Note</Label>
          <Input placeholder="Why are you closing?" />
        </label>
      )}
    </Modal>
  );
}

export function RealModalButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Open a real one
      </Button>
      {open ? (
        <Modal
          title="Close position"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Close position
              </Button>
            </>
          }
        >
          <p>Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.</p>
          <p className="mt-3 text-th-hi3">Press Escape, click the backdrop or use a button to close. Tab stays inside the dialog.</p>
        </Modal>
      ) : null}
    </>
  );
}

export const modal: ComponentDoc = {
  id: 'modal',
  name: 'Modal',
  exports: ['Modal'],
  summary:
    'A dialog: a centered panel on wide screens and a bottom sheet under 640px. It closes on Escape and backdrop click, traps Tab, returns focus to the opener and locks page scroll.',
  importLine: "import { Modal } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'lg', 'xl'] },
    { key: 'footer', label: 'Footer', type: 'boolean' },
    { key: 'long', label: 'Long body', type: 'boolean' },
  ],
  initial: { title: 'Close position', size: 'md', footer: true, long: false },
  render: (a) => <ModalPreview size={a.size as 'md'} footer={!!a.footer} long={!!a.long} title={String(a.title)} />,
  code: (a) =>
    [
      '{open ? (',
      '  <Modal',
      `    title="${String(a.title)}"`,
      ...(a.size === 'md' ? [] : [`    size="${a.size}"`]),
      '    onClose={() => setOpen(false)}',
      ...(a.footer
        ? [
            '    footer={',
            '      <>',
            '        <Button onClick={() => setOpen(false)}>Cancel</Button>',
            '        <Button variant="danger" onClick={closePosition}>Close position</Button>',
            '      </>',
            '    }',
          ]
        : []),
      '  >',
      '    <p>Close 2 contracts of AMD Nov 20 $180 calls at market?</p>',
      '  </Modal>',
      ') : null}',
    ].join('\n'),
  framed: { height: 460 },
  stories: [
    { id: 'confirm', name: 'Confirm', render: () => <ModalPreview size="md" footer long={false} title="Close position" /> },
    { id: 'details', name: 'Long body, lg', note: 'The body scrolls; the footer stays.', render: () => <ModalPreview size="lg" footer long title="Review the order" /> },
    { id: 'plain', name: 'No footer', render: () => <ModalPreview size="md" footer={false} long={false} title="Add a note" /> },
    {
      id: 'subtitle',
      name: 'Long title, pinned subtitle',
      note: 'Titles wrap to two lines; the subtitle stays put while the body scrolls.',
      render: () => (
        <ModalPreview
          size="lg"
          footer
          long
          title="Nintendo Switch 2 Mario Kart World Bundle, Console with Joy-Con 2 and Charging Grip"
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold tabular-nums text-th-hi">$449.99</span>
              <Badge tone="ok">Lowest in 30 days</Badge>
              <span className="text-th-hi3">Best Buy · checked 12m ago</span>
            </span>
          }
        />
      ),
    },
  ],
  usage: `import { useState } from 'react';
import { Button, Modal } from '@nish/ui';

export function DeleteTracker({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      {open ? (
        <Modal
          title="Delete this tracker?"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={onDelete}>Delete</Button>
            </>
          }
        >
          Its price history goes with it.
        </Modal>
      ) : null}
    </>
  );
}`,
  guidelines: [
    'Render the Modal only while it is open; unmounting is what closes it and returns focus.',
    'Put autofocus on the field people should type in first. Otherwise the panel itself takes focus.',
    'Keep it to one decision. Long flows belong on a page.',
  ],
};
