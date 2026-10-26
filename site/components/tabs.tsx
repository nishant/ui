import { useState } from 'react';
import { Card } from '../../src';
import { TabPanel, Tabs, tabClass } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Tabs ----------------------------------------------------------------------------

const ITEMS = [
  { value: 'overview', label: 'Overview' },
  { value: 'jobs', label: 'Jobs', count: 24 },
  { value: 'stats', label: 'Stats' },
  { value: 'archive', label: 'Archive', disabled: true },
];

function Demo({
  variant,
  size,
  block,
  panels = true,
  items = ITEMS,
}: {
  variant?: 'underline' | 'pill';
  size?: 'xs' | 'sm' | 'md';
  block?: boolean;
  panels?: boolean;
  items?: typeof ITEMS;
}) {
  const [tab, setTab] = useState(items[0].value);
  return (
    <div className="w-full min-w-0">
      <Tabs label="Profile sections" value={tab} onChange={setTab} items={items} variant={variant} size={size} block={block}>
        {panels
          ? items.map((t) => (
              <TabPanel key={t.value} value={t.value} className="pt-3 text-sm text-th-hi2">
                {t.label} content.
              </TabPanel>
            ))
          : null}
      </Tabs>
    </div>
  );
}

function Responsive() {
  const [tab, setTab] = useState('suggestions');
  return (
    <div className="w-full min-w-0">
      <Tabs
        label="Review panes"
        idBase="review"
        hideFrom="lg"
        controlsPanels
        value={tab}
        onChange={setTab}
        items={[
          { value: 'suggestions', label: 'Suggestions', count: 4 },
          { value: 'chat', label: 'Chat' },
        ]}
      />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <TabPanel idBase="review" value="suggestions" active={tab === 'suggestions'} showFrom="lg" className="rounded-lg border border-th-line p-3 text-sm text-th-hi2">
          Suggestions pane.
        </TabPanel>
        <TabPanel idBase="review" value="chat" active={tab === 'chat'} showFrom="lg" className="rounded-lg border border-th-line p-3 text-sm text-th-hi2">
          Chat pane.
        </TabPanel>
      </div>
    </div>
  );
}

function Sub() {
  const [tab, setTab] = useState('ups');
  return (
    <Tabs
      label="Shipping options"
      value={tab}
      onChange={setTab}
      items={[
        { value: 'ups', label: 'UPS Ground', sub: '$12 · 3 days' },
        { value: 'fedex', label: 'FedEx 2Day', sub: '$24 · 2 days' },
        { value: 'pickup', label: 'Pickup', sub: 'Free · today' },
      ]}
    />
  );
}

export const tabs: ComponentDoc = {
  id: 'tabs',
  name: 'Tabs',
  exports: ['Tabs', 'TabPanel'],
  summary:
    'Switch between panels in place. The full ARIA tabs pattern: a tablist of tabs with aria-selected and aria-controls, arrow keys, Home and End. For links that change the URL, use tabClass() on the router link.',
  importLine: "import { Tabs, TabPanel, tabClass } from '@nish/ui';",
  controls: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['underline', 'pill'] },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm', 'xs'] },
    { key: 'block', label: 'Block', type: 'boolean' },
  ],
  initial: { variant: 'underline', size: 'md', block: false },
  render: (a) => (
    <Demo variant={a.variant === 'pill' ? 'pill' : 'underline'} size={a.size === 'sm' || a.size === 'xs' ? a.size : 'md'} block={!!a.block} />
  ),
  code: (a) =>
    jsx(
      'Tabs',
      {
        label: 'Profile sections',
        value: '{tab}',
        onChange: '{setTab}',
        items: '{items}',
        variant: a.variant === 'underline' ? undefined : a.variant,
        size: a.size === 'md' ? undefined : a.size,
        block: a.block,
      },
      '<TabPanel value="overview">…</TabPanel>',
    ),
  api: { functions: ['tabClass'], interfaces: ['TabItem'] },
  stories: [
    { id: 'underline', name: 'Underline', render: () => <Demo /> },
    { id: 'pill', name: 'Pill', render: () => <Demo variant="pill" /> },
    { id: 'sm', name: 'Small', render: () => <Demo size="sm" /> },
    { id: 'pill-sm', name: 'Small pill', render: () => <Demo variant="pill" size="sm" /> },
    { id: 'sub', name: 'With a second line', render: () => <Sub /> },
    {
      id: 'nav',
      name: 'Router links (tabClass)',
      note: 'Navigation, not tabs: aria-current="page", no role="tab".',
      render: () => (
        <nav aria-label="Sections" className="flex gap-5 shadow-[inset_0_-1px_0_var(--nish-line)]">
          <a href="#/components/tabs" aria-current="page" className={tabClass({ active: true })}>
            Board
          </a>
          <a href="#/components/tabs" className={tabClass({ active: false })}>
            Calendar
          </a>
          <a href="#/components/tabs" className={tabClass({ active: false })}>
            Settings
          </a>
        </nav>
      ),
    },
    {
      id: 'card',
      name: 'In a card header',
      wide: true,
      render: () => (
        <Card className="w-full">
          <p className="mb-2 text-sm font-semibold text-th-hi">Acme Corp</p>
          <Demo size="sm" />
        </Card>
      ),
    },

    { id: 'xs', name: 'Size xs (dense widget strips)', render: () => <Demo variant="pill" size="xs" panels={false} /> },
    { id: 'xs-underline', name: 'Size xs, underline', render: () => <Demo size="xs" panels={false} /> },
    { id: 'block', name: 'Block (equal widths)', render: () => <Demo block panels={false} items={ITEMS.slice(0, 2)} /> },
    { id: 'block-pill', name: 'Block pills', render: () => <Demo variant="pill" block panels={false} items={ITEMS.slice(0, 2)} /> },
    {
      id: 'responsive',
      name: 'Tabs on phones, side by side from lg',
      note: 'hideFrom="lg" on Tabs and showFrom="lg" on each TabPanel: from 1024px every pane renders as a plain region.',
      wide: true,
      render: () => <Responsive />,
    },
  ],
  usage: `import { Tabs, TabPanel } from '@nish/ui';

const [tab, setTab] = useState('overview');

<Tabs label="Profile sections" value={tab} onChange={setTab} items={[
  { value: 'overview', label: 'Overview' },
  { value: 'jobs', label: 'Jobs', count: 24 },
]}>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="jobs">…</TabPanel>
</Tabs>`,
  guidelines: [
    'Tabs switch content in place. If the URL should change, it is navigation: use tabClass() on the router link with aria-current="page".',
    'Render the TabPanels as children of Tabs. If they must live elsewhere, give Tabs and every TabPanel the same idBase, pass active to each panel and controlsPanels to Tabs.',
    'Use the pill variant inside toolbars and the underline variant for page and card sections.',
  ],
};
