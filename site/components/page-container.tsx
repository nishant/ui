import { BottomNav, PageContainer } from '../../src';
import { DEMO_ITEMS, Device, withState } from './bottom-nav';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- PageContainer --------------------------------------------------------------------------

type Size = 'narrow' | 'default' | 'wide' | 'full';

function Content({ size = 'default', padBottom = true, nav = false }: { size?: Size; padBottom?: boolean; nav?: boolean }) {
  return (
    <>
      <PageContainer size={size} padBottom={padBottom} className="bg-th-surface/40 outline outline-1 -outline-offset-1 outline-dashed outline-th-line-strong">
        <h2 className="text-lg font-semibold text-th-hi">Page content</h2>
        <p className="mt-1 text-sm text-th-hi3">The dashed box is the container: side gutter, vertical padding and a max width of {size}.</p>
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-xl border border-th-line bg-th-surface p-4 text-sm text-th-hi2">
              Row {i + 1}
            </div>
          ))}
          <div className="rounded-xl border border-th-accent bg-th-accent-soft p-4 text-sm font-medium text-th-hi">Last row: it clears the bar below</div>
        </div>
      </PageContainer>
      {nav ? <BottomNav items={withState(DEMO_ITEMS.slice(0, 4), 'home', () => undefined)} /> : null}
    </>
  );
}

export const pageContainer: ComponentDoc = {
  id: 'page-container',
  name: 'PageContainer',
  exports: ['PageContainer'],
  summary:
    'The content column of a page: centered, with the shared side gutter (--nish-page-gutter), vertical padding and bottom padding that keeps the last row clear of a BottomNav and a StickyActionBar. Four widths from a reading column to full bleed.',
  importLine: "import { PageContainer } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['narrow', 'default', 'wide', 'full'] },
    { key: 'padBottom', label: 'Pad for bottom bars', type: 'boolean' },
    { key: 'nav', label: 'With a BottomNav', type: 'boolean' },
  ],
  initial: { size: 'default', padBottom: true, nav: true },
  render: (a) => (
    <Device doc="page-container" args={a} height={460} title="PageContainer at 360px">
      <Content size={a.size as Size} padBottom={!!a.padBottom} nav={!!a.nav} />
    </Device>
  ),
  code: (a) => jsx('PageContainer', { size: a.size === 'default' ? undefined : a.size, padBottom: a.padBottom ? undefined : '{false}' }, '\n  <Dashboard />\n'),
  stories: [
    {
      id: 'padded',
      name: 'Clears a BottomNav',
      note: 'Scroll to the end: the highlighted row stops above the bar.',
      render: () => (
        <Device doc="page-container" story="padded" height={460} title="PageContainer with a BottomNav">
          <Content nav />
        </Device>
      ),
    },
    {
      id: 'narrow',
      name: 'Narrow reading column (840px)',
      note: 'narrow is 42rem, default 56rem, wide 80rem.',
      wide: true,
      render: () => (
        <Device doc="page-container" story="narrow" width={840} height={360} title="PageContainer narrow at 840px">
          <Content size="narrow" />
        </Device>
      ),
    },
    {
      id: 'wide',
      name: 'Wide (1440px)',
      wide: true,
      render: () => (
        <Device doc="page-container" story="wide" width={1440} height={340} title="PageContainer wide at 1440px">
          <Content size="wide" />
        </Device>
      ),
    },
  ],
  usage: `import { PageContainer } from '@nish/ui';

<AppHeader name="trips" />
<PageContainer size="wide">
  <Routes />
</PageContainer>
<BottomNav items={tabs} />`,
  guidelines: [
    'One per page, as the <main> landmark (as="main" is the default). Pass as="div" when the layout already has one.',
    'padBottom adds the class nish-pad-bottom-inset: the larger of the bottom bars\' height plus 1rem, or the device safe area plus 1rem.',
    'Full-bleed children (a map, a table) can use negative margins of the gutter, -mx-[var(--nish-page-gutter)].',
    'Do not set your own horizontal padding on the page: use the gutter variable so every element lines up.',
  ],
};
