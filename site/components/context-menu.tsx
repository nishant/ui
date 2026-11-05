import { useState, type ReactNode } from 'react';
import { Card, MenuItem, MenuLabel, MenuSeparator } from '../../src';
import { ContextMenu } from '../../src/components/context-menu';
import type { ComponentDoc } from './types';

// --- ContextMenu (framed) -------------------------------------------------------------

const FILES = ['report.pdf', 'budget.xlsx', 'notes.md'];

type Sheet = 'sm' | false;

function FilesPreview({ sheetBelow = 'sm', longPressMs = 500, open }: { sheetBelow?: Sheet; longPressMs?: number; open?: boolean }) {
  const [last, setLast] = useState('none yet');
  const act = (name: string, file: string) => setLast(`${name} on ${file}`);
  return (
    <div className="w-full max-w-sm self-start">
      <Card>
        <ContextMenu
          sheetBelow={sheetBelow}
          longPressMs={longPressMs}
          open={open}
          menu={(target) => {
            const file = target.closest<HTMLElement>('[data-id]')?.dataset.id;
            if (!file) return null;
            return (
              <>
                <MenuLabel>{file}</MenuLabel>
                <MenuItem onSelect={() => act('Open', file)}>Open</MenuItem>
                <MenuItem onSelect={() => act('Rename', file)}>Rename</MenuItem>
                <MenuItem onSelect={() => act('Download', file)}>Download</MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={() => act('Delete', file)}>
                  Delete
                </MenuItem>
              </>
            );
          }}
        >
          {FILES.map((file) => (
            <div
              key={file}
              data-id={file}
              tabIndex={0}
              className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm hover:bg-th-overlay focus-visible:outline-2 focus-visible:outline-th-accent"
            >
              {file}
            </div>
          ))}
        </ContextMenu>
        <p className="mt-3 text-xs text-th-hi3">Last action: {last}</p>
        <p className="mt-1 text-xs text-th-hi3">Right-click a row, press and hold on a touch screen, or focus a row and press Shift+F10.</p>
      </Card>
    </div>
  );
}

function BoxPreview({ sheetBelow = 'sm', open }: { sheetBelow?: Sheet; open?: boolean }) {
  const [last, setLast] = useState('none yet');
  const items: ReactNode = (
    <>
      <MenuItem onSelect={() => setLast('Refresh')}>Refresh</MenuItem>
      <MenuItem onSelect={() => setLast('Copy link')}>Copy link</MenuItem>
      <MenuSeparator />
      <MenuItem danger onSelect={() => setLast('Clear')}>
        Clear
      </MenuItem>
    </>
  );
  return (
    <div className="w-full max-w-sm self-start">
      <ContextMenu
        menu={items}
        open={open}
        sheetBelow={sheetBelow}
        className="grid h-40 place-items-center rounded-lg border border-dashed border-th-line text-sm text-th-hi3"
      >
        Right-click anywhere in this box
      </ContextMenu>
      <p className="mt-2 text-xs text-th-hi3">Last action: {last}</p>
    </div>
  );
}

const sheetOf = (v: unknown): Sheet => (v === 'off' ? false : 'sm');

export const contextMenu: ComponentDoc = {
  id: 'context-menu',
  name: 'ContextMenu',
  exports: ['ContextMenu'],
  summary:
    'A menu of actions for an area, opened with a right-click, a long press on touch screens, or Shift+F10 and the Menu key. It uses the DropdownMenu rows and keys, and opens as a bottom sheet on phones.',
  importLine: "import { ContextMenu, MenuItem } from '@nish/ui';",
  controls: [
    {
      key: 'sheetBelow',
      label: 'Sheet below 640px',
      type: 'select',
      options: ['sm', 'off'],
    },
    {
      key: 'longPressMs',
      label: 'Long press (ms)',
      type: 'number',
      min: 300,
      max: 1000,
    },
  ],
  // The frame is narrower than 640px, so "sm" would open the phone sheet here; start floating to show the desktop look.
  initial: { sheetBelow: 'off', longPressMs: 500 },
  render: (a) => <FilesPreview sheetBelow={sheetOf(a.sheetBelow)} longPressMs={Number(a.longPressMs) || 500} />,
  code: (a) =>
    [
      '<ContextMenu',
      ...(a.sheetBelow === 'off' ? ['  sheetBelow={false}'] : []),
      ...(Number(a.longPressMs) === 500 ? [] : [`  longPressMs={${Number(a.longPressMs)}}`]),
      '  menu={(target) => {',
      "    const id = target.closest('[data-id]')?.dataset.id;",
      '    if (!id) return null;',
      '    return <MenuItem onSelect={() => rename(id)}>Rename</MenuItem>;',
      '  }}',
      '>',
      '  <FileList />',
      '</ContextMenu>',
    ].join('\n'),
  framed: { height: 340 },
  stories: [
    {
      id: 'files',
      name: 'One menu over many rows',
      render: () => <FilesPreview />,
    },
    {
      id: 'open',
      name: 'Open',
      note: "Opened from code it sits at the area's start-top corner.",
      render: () => <BoxPreview open />,
    },
    {
      id: 'static',
      name: 'One menu for the whole area',
      render: () => <BoxPreview />,
    },
    {
      id: 'floating',
      name: 'Floating on phones too',
      render: () => <BoxPreview sheetBelow={false} />,
    },
  ],
  usage: `import { ContextMenu, MenuItem, MenuSeparator } from '@nish/ui';

<ContextMenu
  menu={(target) => {
    const id = target.closest<HTMLElement>('[data-id]')?.dataset.id;
    if (!id) return null;
    return (
      <>
        <MenuItem onSelect={() => rename(id)}>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem danger onSelect={() => remove(id)}>Delete</MenuItem>
      </>
    );
  }}
>
  <FileList />
</ContextMenu>`,
  guidelines: [
    'A context menu is a shortcut, never the only way in: put the same actions in a visible DropdownMenu (a ⋯ button on the row) too.',
    "Wrap a whole list in one ContextMenu and pass menu as a function: read the row from target.closest('[data-id]'). Return null to keep the browser menu closed and show nothing.",
    "Inputs, text areas and editable text keep the browser's own menu, so copy and paste still work. Shift+right-click also shows the browser menu.",
    'Under 640px the menu opens as a bottom sheet with 48px rows; set sheetBelow={false} to keep the floating menu.',
    "A long press that opens the menu cancels the tap that follows it, so a row's link does not also open.",
    'Rows are MenuItem, MenuLabel and MenuSeparator, the same as in DropdownMenu.',
  ],
};
