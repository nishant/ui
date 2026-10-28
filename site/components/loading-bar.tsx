import { useState } from 'react';
import { AppHeader, Button, LoadingBar } from '../../src';
import { Device, Filler } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- LoadingBar -----------------------------------------------------------------------------

function Demo({ delayMs = 200, startActive = true, header = true }: { delayMs?: number; startActive?: boolean; header?: boolean }) {
  const [active, setActive] = useState(startActive);
  return (
    <>
      {header ? <AppHeader name="trips" /> : null}
      <LoadingBar active={active} delayMs={delayMs} />
      <div className="px-[var(--nish-page-gutter)] pt-4">
        <Button size="sm" onClick={() => setActive((a) => !a)}>
          {active ? 'Finish loading' : 'Start loading'}
        </Button>
      </div>
      <Filler title="Route content" rows={3} />
    </>
  );
}

export const loadingBar: ComponentDoc = {
  id: 'loading-bar',
  name: 'LoadingBar',
  exports: ['LoadingBar'],
  summary:
    'A thin indeterminate progress bar fixed under the app header, for route changes and refetches. It shows only after a short delay, so quick loads never flash a bar, and with reduced motion it is a static partial bar.',
  importLine: "import { LoadingBar } from '@nish/ui';",
  controls: [
    { key: 'delayMs', label: 'Delay (ms)', type: 'number', min: 0, max: 1000 },
    { key: 'header', label: 'With AppHeader', type: 'boolean' },
  ],
  initial: { delayMs: 200, header: true },
  render: (a) => (
    <Device doc="loading-bar" args={a} height={300} title="LoadingBar at 360px">
      <Demo delayMs={Number(a.delayMs)} header={!!a.header} />
    </Device>
  ),
  code: (a) => `<LoadingBar active={isFetching}${Number(a.delayMs) === 200 ? '' : ` delayMs={${a.delayMs}}`} />`,
  stories: [
    {
      id: 'header',
      name: 'Under the header',
      note: 'It sits on the header\'s bottom edge (top: var(--nish-header-h)).',
      render: () => (
        <Device doc="loading-bar" story="header" height={300} title="LoadingBar under AppHeader">
          <Demo />
        </Device>
      ),
    },
    {
      id: 'idle',
      name: 'Idle, then start',
      note: 'Press Start: the bar appears after the 200ms delay.',
      render: () => (
        <Device doc="loading-bar" story="idle" height={300} title="LoadingBar, idle">
          <Demo startActive={false} />
        </Device>
      ),
    },
    {
      id: 'top',
      name: 'No header: top of the screen',
      render: () => (
        <Device doc="loading-bar" story="top" height={260} title="LoadingBar without a header">
          <Demo header={false} />
        </Device>
      ),
    },
  ],
  usage: `import { LoadingBar } from '@nish/ui';

const isFetching = useIsFetching() > 0;      // TanStack Query
const navigating = useNavigation().state !== 'idle'; // React Router

<LoadingBar active={isFetching || navigating} />`,
  guidelines: [
    'Mount one per app, near the root, driven by your router or data layer.',
    'It is a role="progressbar" with aria-busy; do not add a second announcement.',
    'Use a Spinner or a skeleton for loading inside a card; the bar is for the whole page.',
    'The delay is the point: under 200ms nothing shows, which avoids a flash on fast navigations.',
  ],
};
