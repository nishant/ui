import { useState } from 'react';
import { TreeView } from '../../src';
import type { TreeNode } from '../../src/components/tree-view';
import type { ComponentDoc } from './types';

// --- TreeView -----------------------------------------------------------------------

const FILES: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button.tsx', label: 'button.tsx' },
          { id: 'table.tsx', label: 'table.tsx' },
          { id: 'tree-view.tsx', label: 'tree-view.tsx' },
        ],
      },
      { id: 'index.ts', label: 'index.ts' },
      { id: 'theme.ts', label: 'theme.ts' },
    ],
  },
  { id: 'site', label: 'site', children: [{ id: 'main.tsx', label: 'main.tsx' }] },
  { id: 'package.json', label: 'package.json' },
  { id: 'README.md', label: 'README.md' },
];

const OUTLINE: TreeNode[] = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    children: [
      { id: 'positions', label: 'Positions' },
      { id: 'orders', label: 'Orders' },
      { id: 'history', label: 'History' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    children: [
      { id: 'watchlist', label: 'Watchlist' },
      { id: 'screener', label: 'Screener', disabled: true },
    ],
  },
  { id: 'settings', label: 'Settings' },
];

function Outline() {
  const [last, setLast] = useState('nothing yet');
  return (
    <div className="w-full max-w-xs">
      <TreeView items={OUTLINE} defaultExpanded={['portfolio']} defaultSelected="positions" aria-label="Sections" onActivate={(node) => setLast(node.label)} />
      <p className="mt-3 text-xs text-th-hi3">Activated: {last}</p>
    </div>
  );
}

export const treeView: ComponentDoc = {
  id: 'tree-view',
  name: 'TreeView',
  exports: ['TreeView'],
  api: { functions: [], interfaces: ['TreeNode'] },
  summary:
    'A tree of nested items, like folders or a section outline: open and close branches, select one item, and the WAI-ARIA keyboard model (arrows, Home, End, type a letter to jump, * to open siblings).',
  importLine: "import { TreeView } from '@nish/ui';",
  controls: [
    { key: 'selectable', label: 'Selectable', type: 'boolean' },
    { key: 'toggleOnSelect', label: 'Toggle on select', type: 'boolean' },
  ],
  initial: { selectable: true, toggleOnSelect: true },
  render: (a) => (
    <div className="w-full max-w-xs">
      <TreeView
        items={FILES}
        defaultExpanded={['src', 'components']}
        defaultSelected="table.tsx"
        aria-label="Files"
        selectable={a.selectable as boolean}
        toggleOnSelect={a.toggleOnSelect as boolean}
      />
    </div>
  ),
  code: (a) =>
    [
      '<TreeView',
      '  items={files}',
      "  defaultExpanded={['src', 'components']}",
      '  defaultSelected="table.tsx"',
      '  aria-label="Files"',
      ...(a.selectable ? [] : ['  selectable={false}']),
      ...(a.toggleOnSelect ? [] : ['  toggleOnSelect={false}']),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'files',
      name: 'Files',
      render: () => (
        <div className="w-full max-w-xs">
          <TreeView items={FILES} defaultExpanded={['src', 'components']} defaultSelected="table.tsx" aria-label="Files" />
        </div>
      ),
    },
    { id: 'outline', name: 'Navigation outline', render: () => <Outline /> },
    {
      id: 'chevron-only',
      name: 'Open folders with the chevron only',
      render: () => (
        <div className="w-full max-w-xs">
          <TreeView items={FILES} defaultExpanded={['src']} toggleOnSelect={false} aria-label="Files" />
        </div>
      ),
    },
    {
      id: 'no-selection',
      name: 'Activation only',
      render: () => (
        <div className="w-full max-w-xs">
          <TreeView items={OUTLINE} defaultExpanded={['portfolio', 'research']} selectable={false} aria-label="Sections" />
        </div>
      ),
    },
    {
      id: 'disabled',
      name: 'A disabled node',
      note: 'Focusable and listed, but it cannot be selected or activated.',
      render: () => (
        <div className="w-full max-w-xs">
          <TreeView items={OUTLINE} defaultExpanded={['research']} aria-label="Sections" />
        </div>
      ),
    },
  ],
  usage: `import { TreeView } from '@nish/ui';

const files = [
  { id: 'src', label: 'src', children: [{ id: 'index.ts', label: 'index.ts' }] },
  { id: 'package.json', label: 'package.json' },
];

export function FileTree() {
  return <TreeView aria-label="Files" items={files} defaultExpanded={['src']} onActivate={(node) => openFile(node.id)} />;
}`,
  guidelines: [
    'Every node needs an id that is unique in the whole tree; it keys selection and expansion.',
    'A click or Enter on a parent selects it and opens or closes it. Set toggleOnSelect={false} to open folders with the chevron or the arrow keys only.',
    'Navigate in onActivate (a click or Enter); Space only selects.',
    'Keep labels short: each level indents 20px and long labels truncate, which matters on a 360px screen.',
    'Give the tree an aria-label (or aria-labelledby) that says what it holds.',
    'Rows and the chevron grow to 44px on touch screens.',
  ],
};
