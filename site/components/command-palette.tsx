import { useState } from 'react';
import { Button, CommandPalette, Kbd, type CommandItem } from '../../src';
import { BellIcon, ChartIcon, LayersIcon, SettingsIcon } from '../lib/icons';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- CommandPalette -------------------------------------------------------------------------

const ICON = 16;
const ITEMS: CommandItem[] = [
  { id: 'home', label: 'Home', group: 'Pages', icon: <ChartIcon size={ICON} />, hint: 'G H', href: '#/' },
  { id: 'trips', label: 'Trips', group: 'Pages', icon: <LayersIcon size={ICON} />, keywords: ['travel', 'flights'], onSelect: () => undefined },
  { id: 'alerts', label: 'Alerts', group: 'Pages', icon: <BellIcon size={ICON} />, keywords: ['notifications'], onSelect: () => undefined },
  { id: 'settings', label: 'Settings', group: 'Pages', icon: <SettingsIcon size={ICON} />, hint: 'G S', onSelect: () => undefined },
  { id: 'new-trip', label: 'New trip', group: 'Actions', hint: 'N', keywords: ['create', 'plan'], onSelect: () => undefined },
  { id: 'theme', label: 'Toggle theme', group: 'Actions', keywords: ['dark', 'light'], onSelect: () => undefined },
  { id: 'docs', label: 'Open design docs', group: 'Links', external: true, href: 'https://design.nish.software' },
];

async function remote(q: string): Promise<CommandItem[]> {
  await new Promise((r) => setTimeout(r, 250));
  return q ? ['Lisbon', 'Libson airport', 'Lima', 'Lyon'].filter((c) => c.toLowerCase().includes(q.toLowerCase())).map((c) => ({ id: c, label: c, group: 'Cities', onSelect: () => undefined })) : [];
}

function Demo({ mode = 'list' }: { mode?: 'list' | 'async' | 'submit' }) {
  const [open, setOpen] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <div className="grid gap-3 p-4">
      <p className="text-sm text-th-hi3">
        Press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> or <Kbd>/</Kbd>, or use the button.
      </p>
      <div>
        <Button onClick={() => setOpen(true)}>Search…</Button>
      </div>
      {submitted ? <p className="text-sm text-th-hi">Web search for “{submitted}”</p> : null}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={mode === 'async' ? remote : ITEMS}
        placeholder={mode === 'async' ? 'Search cities…' : 'Search pages and actions…'}
        onSubmitQuery={mode === 'submit' ? (q) => { setSubmitted(q); setOpen(false); } : undefined}
        footer={mode === 'submit' ? <p className="px-4 py-2 text-xs text-th-hi3">Enter with no match searches the web.</p> : undefined}
      />
    </div>
  );
}

export const commandPalette: ComponentDoc = {
  id: 'command-palette',
  name: 'CommandPalette',
  exports: ['CommandPalette'],
  summary:
    'A search-and-jump dialog opened with Ctrl/Cmd+K or /. A full-height sheet with the field on top under 640px, a centered 560px panel above. Fuzzy matching (prefix, word start, substring, then subsequence), grouped rows with the match highlighted, arrow keys, Enter, and a function form for dynamic or server-side search.',
  importLine: "import { CommandPalette } from '@nish/ui';",
  controls: [{ key: 'mode', label: 'Items', type: 'select', options: ['list', 'async', 'submit'] }],
  initial: { mode: 'list' },
  render: (a) => (
    <Device doc="command-palette" args={a} height={520} title="CommandPalette at 360px">
      <Demo mode={a.mode as 'list'} />
    </Device>
  ),
  code: (a) =>
    [
      '<CommandPalette',
      '  open={open}',
      '  onOpenChange={setOpen}',
      a.mode === 'async' ? '  items={(q) => searchCities(q)}' : '  items={items}',
      ...(a.mode === 'submit' ? ['  onSubmitQuery={(q) => webSearch(q)}'] : []),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'phone',
      name: 'Phone (360px)',
      note: 'A full-height sheet with the field pinned on top. Type "tr" and "set".',
      render: () => (
        <Device doc="command-palette" story="phone" height={560} title="CommandPalette on a phone">
          <Demo />
        </Device>
      ),
    },
    {
      id: 'desktop',
      name: 'Desktop (wide)',
      note: 'A centered 560px panel, 12vh from the top.',
      wide: true,
      render: () => (
        <Device doc="command-palette" story="desktop" width="100%" height={480} title="CommandPalette on desktop">
          <Demo />
        </Device>
      ),
    },
    {
      id: 'async',
      name: 'Searching a server',
      note: 'Items is a function of the query; its results show in the order returned.',
      render: () => (
        <Device doc="command-palette" story="async" height={460} title="CommandPalette with async items">
          <Demo mode="async" />
        </Device>
      ),
    },
    {
      id: 'submit',
      name: 'Enter with no match',
      note: 'Type something that matches nothing and press Enter: onSubmitQuery runs.',
      render: () => (
        <Device doc="command-palette" story="submit" height={460} title="CommandPalette with onSubmitQuery">
          <Demo mode="submit" />
        </Device>
      ),
    },
  ],
  usage: `import { CommandPalette, type CommandItem } from '@nish/ui';

const items: CommandItem[] = [
  { id: 'trips', label: 'Trips', group: 'Pages', href: '/trips', keywords: ['travel'] },
  { id: 'new', label: 'New trip', group: 'Actions', onSelect: createTrip },
];

const [open, setOpen] = useState(false);
<CommandPalette open={open} onOpenChange={setOpen} items={items} />`,
  guidelines: [
    'It opens itself on Ctrl/Cmd+K and on / when focus is not in a field. Pass hotkey={false} and use useCommandHotkey if you want your own trigger.',
    'Give every item a stable id. Group rows by what they are (Pages, Actions); rows without a group come first.',
    'On a phone there is no keyboard shortcut: show a visible search button that sets open.',
    'Keywords match below the label, so "travel" finds Trips without cluttering the label.',
    'A function for items replaces the built-in ranking: filter and order on your side.',
  ],
  api: { functions: ['useCommandHotkey'], interfaces: [] },
};
