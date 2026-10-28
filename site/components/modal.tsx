import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, Input, Label, Modal } from '../../src';
import { SearchIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- Modal (framed) -----------------------------------------------------------------

type Size = 'md' | 'lg' | 'xl' | '2xl' | 'full';

const ROWS = [
  ['Mark price', '$4.15'],
  ['Cost basis', '$3.20'],
  ['Unrealized gain', '+$190.00'],
  ['Days to expiry', '26'],
  ['Delta', '0.42'],
  ['Implied volatility', '48%'],
];

function ModalPreview({
  size,
  footer,
  long,
  title,
  subtitle,
  placement = 'center',
  hideClose = false,
}: {
  size: Size;
  footer: boolean;
  long: boolean;
  title: string;
  subtitle?: ReactNode;
  placement?: 'center' | 'top';
  hideClose?: boolean;
}) {
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      size={size}
      placement={placement}
      hideClose={hideClose}
      closeOnBack={false}
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
          {ROWS.map(([k, v]) => (
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

/** A command palette: placement="top" and a search field in place of the title row. */
function PalettePreview() {
  const [q, setQ] = useState('');
  const all = ['Open board', 'New widget', 'Switch theme', 'Search notes', 'Settings'];
  const hits = all.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal
      aria-label="Command palette"
      placement="top"
      size="lg"
      closeOnBack={false}
      onClose={() => undefined}
      header={
        <div className="flex items-center gap-2 border-b border-th-line px-4 py-3">
          <SearchIcon size={16} className="shrink-0 text-th-hi3" />
          <input
            data-autofocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command"
            aria-label="Command"
            className="min-w-0 flex-1 bg-transparent text-base text-th-hi outline-none placeholder:text-th-ghost sm:text-sm"
          />
        </div>
      }
    >
      <ul className="-mx-2 grid gap-0.5">
        {hits.map((c) => (
          <li key={c}>
            <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-th-hi2 hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11">
              {c}
            </button>
          </li>
        ))}
        {hits.length === 0 ? <li className="px-3 py-2 text-th-hi3">No commands match.</li> : null}
      </ul>
    </Modal>
  );
}

/** A wide comparison panel: 2xl, with each option in its own card. */
function ComparePreview({ size = '2xl' }: { size?: Size }) {
  const stores = [
    ['Best Buy', '$449.99', 'In stock'],
    ['Target', '$459.99', 'Ships in 2 days'],
    ['Walmart', '$449.00', 'Pickup today'],
  ];
  return (
    <Modal title="Compare prices" size={size} closeOnBack={false} onClose={() => undefined} footer={<Button variant="primary">Track all</Button>}>
      <div className="grid gap-3 sm:grid-cols-3">
        {stores.map(([name, price, note]) => (
          <Card key={name}>
            <p className="text-sm font-semibold text-th-hi">{name}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-th-hi">{price}</p>
            <p className="mt-1 text-xs text-th-hi3">{note}</p>
          </Card>
        ))}
      </div>
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
    'A dialog: a centered panel on wide screens and a bottom sheet under 640px. It closes on Escape and backdrop click, traps Tab, returns focus to the opener and locks page scroll on <html> and <body>.',
  importLine: "import { Modal } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'lg', 'xl', '2xl', 'full'] },
    { key: 'placement', label: 'Placement', type: 'select', options: ['center', 'top'] },
    { key: 'footer', label: 'Footer', type: 'boolean' },
    { key: 'long', label: 'Long body', type: 'boolean' },
    { key: 'hideClose', label: 'Hide close', type: 'boolean' },
  ],
  initial: { title: 'Close position', size: 'md', placement: 'center', footer: true, long: false, hideClose: false },
  render: (a) => (
    <ModalPreview
      size={a.size as Size}
      placement={a.placement as 'center'}
      footer={!!a.footer}
      long={!!a.long}
      hideClose={!!a.hideClose}
      title={String(a.title)}
    />
  ),
  code: (a) =>
    [
      '{open ? (',
      '  <Modal',
      `    title="${String(a.title)}"`,
      ...(a.size === 'md' ? [] : [`    size="${a.size}"`]),
      ...(a.placement === 'top' ? ['    placement="top"'] : []),
      ...(a.hideClose ? ['    hideClose'] : []),
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
    { id: 'xl', name: 'xl', render: () => <ModalPreview size="xl" footer long title="Order details" /> },
    {
      id: 'wide',
      name: '2xl, cards inside',
      note: 'Up to 1152px wide, for side-by-side comparisons.',
      render: () => <ComparePreview size="2xl" />,
    },
    { id: 'full', name: 'full', note: 'The whole screen less a 1rem margin.', render: () => <ModalPreview size="full" footer long title="Chart" /> },
    { id: 'plain', name: 'No footer', render: () => <ModalPreview size="md" footer={false} long={false} title="Add a note" /> },
    {
      id: 'palette',
      name: 'Top placement with a header',
      note: 'placement="top" and header replace the title row; aria-label names the dialog.',
      render: () => <PalettePreview />,
    },
    {
      id: 'no-close',
      name: 'Without a close button',
      note: 'hideClose: Escape and the backdrop still close it.',
      render: () => <ModalPreview size="md" footer long={false} title="Pick a board" hideClose />,
    },
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
}

// a command palette
<Modal aria-label="Command palette" placement="top" header={<SearchField />} onClose={close}>
  {results}
</Modal>`,
  guidelines: [
    'Render the Modal only while it is open; unmounting is what closes it and returns focus.',
    'Put autofocus (or data-autofocus) on the field people should type in first. Otherwise the panel itself takes focus.',
    'Keep it to one decision. Long flows belong on a page. For a yes-or-no question, use ConfirmDialog.',
    'With header, pass aria-label: the dialog has no visible title to take its name from.',
    'Page scroll is locked on both <html> and <body>, so apps that scroll the root element need no local lock.',
  ],
};
