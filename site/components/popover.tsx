import { useRef, useState } from 'react';
import { Button, Card, Checkbox, IconButton, Select } from '../../src';
import { Popover } from '../../src';
import { SettingsIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- Popover (framed) ---------------------------------------------------------------

type Side = 'top' | 'bottom';
type Align = 'start' | 'center' | 'end';

function FilterBody() {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-th-hi2">Sort by</span>
        <Select defaultValue="change">
          <option value="change">Change</option>
          <option value="volume">Volume</option>
          <option value="symbol">Symbol</option>
        </Select>
      </label>
      <Checkbox label="Hide closed positions" defaultChecked />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost">
          Reset
        </Button>
        <Button size="sm" variant="primary">
          Apply
        </Button>
      </div>
    </div>
  );
}

/** Opens on mount (previews) and toggles from its button. */
function PopoverPreview({
  side = 'bottom',
  align = 'start',
  width = 260,
  icon = false,
  className,
  body,
}: {
  side?: Side;
  align?: Align;
  width?: number;
  icon?: boolean;
  className?: string;
  body?: 'filters' | 'note';
}) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  return (
    <div className={`flex w-full justify-center ${side === 'top' ? 'self-end' : 'self-start'}`}>
      {icon ? (
        <IconButton ref={anchor} label="View options" active={open} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <SettingsIcon size={16} />
        </IconButton>
      ) : (
        <Button ref={anchor} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Filters
        </Button>
      )}
      <Popover open={open} onOpenChange={setOpen} anchor={anchor} side={side} align={align} width={width} aria-label="Filters" className={className}>
        {body === 'note' ? (
          <p>
            <span className="font-medium text-th-hi">Market closed.</span> Prices are from Friday&apos;s close and update at 9:30 ET.
          </p>
        ) : (
          <FilterBody />
        )}
      </Popover>
    </div>
  );
}

function CardPreview() {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  return (
    <div className="w-full max-w-sm self-start">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-th-hi">Watchlist</p>
            <p className="text-xs text-th-hi3">12 symbols</p>
          </div>
          <IconButton ref={anchor} size="sm" label="Watchlist options" active={open} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <SettingsIcon size={14} />
          </IconButton>
        </div>
      </Card>
      <Popover open={open} onOpenChange={setOpen} anchor={anchor} align="end" width={240} aria-label="Watchlist options">
        <FilterBody />
      </Popover>
    </div>
  );
}

export const popover: ComponentDoc = {
  id: 'popover',
  name: 'Popover',
  exports: ['Popover'],
  summary:
    'A non-modal floating panel anchored to an element: filters, a picker, a details card. Portaled so no parent clips it, flipped and clamped to the screen, closed by Escape and a press outside, with focus back on the anchor.',
  importLine: "import { Popover } from '@nish/ui';",
  controls: [
    { key: 'side', label: 'Side', type: 'select', options: ['bottom', 'top'] },
    { key: 'align', label: 'Align', type: 'select', options: ['start', 'center', 'end'] },
    { key: 'width', label: 'Width', type: 'number', min: 160, max: 400 },
  ],
  initial: { side: 'bottom', align: 'start', width: 260 },
  render: (a) => <PopoverPreview side={a.side as Side} align={a.align as Align} width={Number(a.width)} />,
  code: (a) =>
    [
      'const anchor = useRef<HTMLButtonElement>(null);',
      'const [open, setOpen] = useState(false);',
      '',
      '<Button ref={anchor} aria-expanded={open} onClick={() => setOpen((o) => !o)}>Filters</Button>',
      '<Popover',
      '  open={open}',
      '  onOpenChange={setOpen}',
      '  anchor={anchor}',
      ...(a.side === 'bottom' ? [] : [`  side="${a.side}"`]),
      ...(a.align === 'start' ? [] : [`  align="${a.align}"`]),
      `  width={${Number(a.width)}}`,
      '  aria-label="Filters"',
      '>',
      '  <FilterForm />',
      '</Popover>',
    ].join('\n'),
  framed: { height: 340 },
  stories: [
    { id: 'default', name: 'Below, start', render: () => <PopoverPreview /> },
    { id: 'center', name: 'Centered', render: () => <PopoverPreview align="center" /> },
    { id: 'end', name: 'End, from an icon', render: () => <PopoverPreview align="end" icon /> },
    { id: 'top', name: 'Above', note: 'Flips below when there is no room.', render: () => <PopoverPreview side="top" body="note" width={240} /> },
    { id: 'note', name: 'Text only, no padding override', render: () => <PopoverPreview body="note" width={240} /> },
    { id: 'card', name: 'From a card', render: () => <CardPreview /> },
  ],
  usage: `import { useRef, useState } from 'react';
import { Button, Popover } from '@nish/ui';

export function Filters() {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button ref={anchor} aria-expanded={open} onClick={() => setOpen((o) => !o)}>Filters</Button>
      <Popover open={open} onOpenChange={setOpen} anchor={anchor} width={260} aria-label="Filters">
        <FilterForm onDone={() => setOpen(false)} />
      </Popover>
    </>
  );
}`,
  guidelines: [
    'A Popover is not modal: the page stays usable. For one decision that blocks the page, use Modal.',
    'For a list of actions use DropdownMenu, which adds menu roles and arrow keys.',
    'Give the panel an aria-label and the anchor aria-expanded.',
    'Inside a Modal or Drawer it stacks above the dialog, and Escape closes the popover first.',
    'className lands on the panel: p-0 for edge-to-edge lists, app-region-no-drag in Electron title bars.',
  ],
};
