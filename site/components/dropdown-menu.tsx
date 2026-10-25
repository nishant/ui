import { useState } from 'react';
import { Button, Card, IconButton } from '../../src';
import { ChevronDownIcon } from '../../src/components/icons';
import { DropdownMenu, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader } from '../../src/components/overlay';
import { CopyIcon, DownloadIcon, MenuIcon, PinIcon, SettingsIcon, TrashIcon } from '../lib/icons';
import type { ComponentDoc } from './types';

// --- DropdownMenu (framed) ------------------------------------------------------------

type Align = 'start' | 'center' | 'end';
type Side = 'top' | 'bottom';

const kbd = (k: string) => <span className="font-mono text-2xs">{k}</span>;

function ActionItems({ icons = true, danger = true }: { icons?: boolean; danger?: boolean }) {
  return (
    <>
      <MenuItem icon={icons ? <PinIcon size={14} /> : undefined} trailing={kbd('P')}>
        Pin to top
      </MenuItem>
      <MenuItem icon={icons ? <CopyIcon size={14} /> : undefined} trailing={kbd('D')}>
        Duplicate
      </MenuItem>
      <MenuItem icon={icons ? <DownloadIcon size={14} /> : undefined}>Export as CSV</MenuItem>
      <MenuItem icon={icons ? <SettingsIcon size={14} /> : undefined} disabled>
        Settings (admins only)
      </MenuItem>
      {danger ? (
        <>
          <MenuSeparator />
          <MenuItem icon={icons ? <TrashIcon size={14} /> : undefined} danger>
            Delete widget
          </MenuItem>
        </>
      ) : null}
    </>
  );
}

function MenuPreview({ align = 'start', side = 'bottom', icon = false }: { align?: Align; side?: Side; icon?: boolean }) {
  return (
    <div className={`flex w-full justify-center ${side === 'top' ? 'self-end' : 'self-start'}`}>
      <DropdownMenu
        defaultOpen
        align={align}
        side={side}
        trigger={
          icon ? (
            <IconButton label="Widget actions">
              <MenuIcon size={16} />
            </IconButton>
          ) : (
            <Button>
              Actions <ChevronDownIcon size={14} />
            </Button>
          )
        }
      >
        <ActionItems />
      </DropdownMenu>
    </div>
  );
}

function SortPreview() {
  const [sort, setSort] = useState('change');
  const options = [
    ['change', 'Change'],
    ['volume', 'Volume'],
    ['symbol', 'Symbol'],
  ];
  return (
    <div className="flex w-full justify-center self-start">
      <DropdownMenu
        defaultOpen
        trigger={
          <Button size="sm">
            Sort: {options.find((o) => o[0] === sort)?.[1]} <ChevronDownIcon size={14} />
          </Button>
        }
      >
        <MenuLabel>Sort by</MenuLabel>
        {options.map(([v, l]) => (
          <MenuItem key={v} active={sort === v} onSelect={() => setSort(v)}>
            {l}
          </MenuItem>
        ))}
      </DropdownMenu>
    </div>
  );
}

function SubmenuPreview() {
  const [view, setView] = useState<'root' | 'move'>('move');
  return (
    <div className="flex w-full justify-center self-start">
      <DropdownMenu
        defaultOpen
        onOpenChange={(o) => !o && setView('root')}
        trigger={
          <Button>
            Card <ChevronDownIcon size={14} />
          </Button>
        }
      >
        {view === 'root' ? (
          <>
            <MenuItem
              trailing={<span aria-hidden="true">›</span>}
              onSelect={(e) => {
                e.preventDefault();
                setView('move');
              }}
            >
              Move to board
            </MenuItem>
            <MenuItem>Rename</MenuItem>
          </>
        ) : (
          <>
            <MenuSubHeader onBack={() => setView('root')}>Move to board</MenuSubHeader>
            <MenuItem active>Home</MenuItem>
            <MenuItem>Trading</MenuItem>
            <MenuItem>Reading list</MenuItem>
          </>
        )}
      </DropdownMenu>
    </div>
  );
}

function CardPreview() {
  return (
    <div className="w-full max-w-sm self-start">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-th-hi">Spotify</p>
            <p className="text-xs text-th-hi3">Now playing</p>
          </div>
          <DropdownMenu
            defaultOpen
            align="end"
            trigger={
              <IconButton size="sm" label="Widget actions">
                <MenuIcon size={14} />
              </IconButton>
            }
          >
            <ActionItems icons={false} />
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}

export const dropdownMenu: ComponentDoc = {
  id: 'dropdown-menu',
  name: 'DropdownMenu',
  exports: ['DropdownMenu', 'MenuItem', 'MenuSubHeader'],
  summary:
    'A menu of actions behind a button, with menu roles, arrow keys, Home, End, typeahead and Escape, and focus back on the trigger when it closes. MenuLabel, MenuSeparator and MenuSubHeader structure longer menus.',
  importLine: "import { DropdownMenu, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader } from '@nish/ui';",
  controls: [
    { key: 'align', label: 'Align', type: 'select', options: ['start', 'center', 'end'] },
    { key: 'side', label: 'Side', type: 'select', options: ['bottom', 'top'] },
    { key: 'icon', label: 'Icon trigger', type: 'boolean' },
  ],
  initial: { align: 'start', side: 'bottom', icon: false },
  render: (a) => <MenuPreview align={a.align as Align} side={a.side as Side} icon={!!a.icon} />,
  code: (a) =>
    [
      '<DropdownMenu',
      ...(a.align === 'start' ? [] : [`  align="${a.align}"`]),
      ...(a.side === 'bottom' ? [] : [`  side="${a.side}"`]),
      a.icon
        ? '  trigger={<IconButton label="Widget actions"><MenuIcon /></IconButton>}'
        : '  trigger={<Button>Actions <ChevronDownIcon /></Button>}',
      '>',
      '  <MenuItem icon={<PinIcon />} onSelect={pin}>Pin to top</MenuItem>',
      '  <MenuItem icon={<CopyIcon />} onSelect={duplicate}>Duplicate</MenuItem>',
      '  <MenuSeparator />',
      '  <MenuItem icon={<TrashIcon />} danger onSelect={remove}>Delete widget</MenuItem>',
      '</DropdownMenu>',
    ].join('\n'),
  framed: { height: 320 },
  stories: [
    { id: 'default', name: 'Actions', render: () => <MenuPreview /> },
    { id: 'end', name: 'End, from an icon', render: () => <MenuPreview align="end" icon /> },
    { id: 'center', name: 'Centered', render: () => <MenuPreview align="center" /> },
    { id: 'top', name: 'Above', note: 'Flips below when there is no room.', render: () => <MenuPreview side="top" /> },
    { id: 'label', name: 'Label and current choice', note: 'active marks the current sort.', render: () => <SortPreview /> },
    {
      id: 'submenu',
      name: 'Submenu in place',
      note: 'onSelect calls preventDefault to keep the menu open; MenuSubHeader goes back (also on ArrowLeft).',
      render: () => <SubmenuPreview />,
    },
    { id: 'card', name: 'From a card', render: () => <CardPreview /> },
  ],
  usage: `import { DropdownMenu, IconButton, MenuItem, MenuSeparator } from '@nish/ui';

<DropdownMenu
  align="end"
  trigger={<IconButton label="Widget actions"><MoreIcon /></IconButton>}
>
  <MenuItem icon={<PinIcon />} onSelect={pin}>Pin to top</MenuItem>
  <MenuItem icon={<CopyIcon />} trailing={<Kbd>D</Kbd>} onSelect={duplicate}>Duplicate</MenuItem>
  <MenuSeparator />
  <MenuItem icon={<TrashIcon />} danger onSelect={() => setConfirming(true)}>Delete widget</MenuItem>
</DropdownMenu>`,
  guidelines: [
    'Menus hold actions. To pick one value from a few, use Segmented or a Select; for a form in a panel, use Popover.',
    'The trigger is a Button or IconButton; DropdownMenu adds aria-haspopup, aria-expanded and the keys.',
    'A destructive item opens a ConfirmDialog rather than acting at once.',
    'To show a submenu, swap the rows in place and start them with MenuSubHeader. Call event.preventDefault() in onSelect to keep the menu open.',
  ],
};
