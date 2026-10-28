import { useState } from 'react';
import { Chip, ScrollRow, SearchInput, StickyBar } from '../../src';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- StickyBar ------------------------------------------------------------------------------

function Page({ elevate = true, top }: { elevate?: boolean; top?: string }) {
  const [q, setQ] = useState('');
  return (
    <div className="px-[var(--nish-page-gutter)] pt-4">
      <h2 className="text-lg font-semibold text-th-hi">Watchlist</h2>
      <StickyBar elevate={elevate} top={top} className="py-2">
        <SearchInput aria-label="Filter watchlist" placeholder="Filter…" value={q} onChange={setQ} />
        <ScrollRow className="mt-2" label="Sectors">
          {['All', 'Tech', 'Energy', 'Health', 'Finance'].map((t, i) => (
            <Chip key={t} pressed={i === 0} className="shrink-0">
              {t}
            </Chip>
          ))}
        </ScrollRow>
      </StickyBar>
      <ul className="mt-3 grid gap-2">
        {Array.from({ length: 16 }, (_, i) => (
          <li key={i} className="rounded-xl border border-th-line bg-th-surface p-4 text-sm text-th-hi2">
            Row {i + 1}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const stickyBar: ComponentDoc = {
  id: 'sticky-bar',
  name: 'StickyBar',
  exports: ['StickyBar'],
  summary:
    'A toolbar that sticks under the app header while the page scrolls: filters, a search field, a SectionNav. Always opaque, with a background that reaches the screen edges through the page gutter, and a border and shadow only once it is stuck. It publishes its height as --nish-sticky-extra.',
  importLine: "import { StickyBar } from '@nish/ui';",
  controls: [
    { key: 'elevate', label: 'Shadow when stuck', type: 'boolean' },
    { key: 'top', label: 'Top offset', type: 'select', options: ['header', '0px', '3rem'] },
  ],
  initial: { elevate: true, top: 'header' },
  render: (a) => (
    <Device doc="sticky-bar" args={a} height={400} title="StickyBar at 360px">
      <Page elevate={!!a.elevate} top={a.top === 'header' ? undefined : String(a.top)} />
    </Device>
  ),
  code: (a) =>
    [
      `<StickyBar${a.elevate ? '' : ' elevate={false}'}${a.top === 'header' ? '' : ` top="${a.top}"`}>`,
      '  <SearchInput aria-label="Filter" value={q} onChange={setQ} />',
      '  <ScrollRow>{chips}</ScrollRow>',
      '</StickyBar>',
    ].join('\n'),
  stories: [
    {
      id: 'filters',
      name: 'Filters that stay',
      note: 'Scroll the preview: the bar keeps its opaque background over the rows and gains a shadow.',
      render: () => (
        <Device doc="sticky-bar" story="filters" height={400} title="StickyBar with filters">
          <Page />
        </Device>
      ),
    },
    {
      id: 'flat',
      name: 'Without elevation',
      render: () => (
        <Device doc="sticky-bar" story="flat" height={400} title="StickyBar without a shadow">
          <Page elevate={false} />
        </Device>
      ),
    },
  ],
  usage: `import { StickyBar } from '@nish/ui';

<AppHeader name="trading" />
<PageContainer>
  <StickyBar className="py-2">
    <SearchInput aria-label="Filter" value={q} onChange={setQ} />
  </StickyBar>
  <List />
</PageContainer>`,
  guidelines: [
    'Put it inside PageContainer (or any element with the page gutter): it bleeds into the gutter with a negative margin.',
    'It sticks under AppHeader by reading --nish-header-h; pass top only to stack under something else.',
    'Do not nest it in an overflow:hidden or overflow:auto ancestor: sticky then sticks to that box instead of the page.',
    'Keep it short. A tall bar eats the phone screen; two compact rows at most.',
  ],
};
