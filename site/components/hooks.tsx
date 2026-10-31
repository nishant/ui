import { useState } from 'react';
import { BREAKPOINTS, Button, NARROW_QUERY, PHONE_QUERY, useBreakpoint, useDocumentTitle, useLocalStorage, useMediaQuery, useNarrow, useNow, usePhone, useScrollSpy } from '../../src';
import { ago, time } from '../../src/format';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- Hooks ----------------------------------------------------------------------------------

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-th-line bg-th-surface px-3.5 py-2.5">
      <span className="font-mono text-[13px] text-th-hi3">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums text-th-hi">{value}</span>
    </div>
  );
}

function Media() {
  const coarse = useMediaQuery('(pointer: coarse)');
  const dark = useMediaQuery('(prefers-color-scheme: dark)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const bp = useBreakpoint();
  const phone = usePhone();
  const narrow = useNarrow();
  return (
    <div className="grid w-full max-w-md gap-2">
      <Readout label="useBreakpoint()" value={`'${bp}'`} />
      <Readout label="usePhone()" value={String(phone)} />
      <Readout label="useNarrow()" value={String(narrow)} />
      <Readout label="useMediaQuery('(pointer: coarse)')" value={String(coarse)} />
      <Readout label="useMediaQuery('(prefers-color-scheme: dark)')" value={String(dark)} />
      <Readout label="useMediaQuery('(prefers-reduced-motion: reduce)')" value={String(reduced)} />
      <p className="text-sm text-th-hi3">Resize the window or turn the phone: the values follow.</p>
    </div>
  );
}

function Breakpoints() {
  return (
    <div className="grid w-full max-w-md gap-2">
      {Object.entries(BREAKPOINTS).map(([name, px]) => (
        <Readout key={name} label={`BREAKPOINTS.${name}`} value={`${px}px`} />
      ))}
      <Readout label="PHONE_QUERY" value={PHONE_QUERY} />
      <Readout label="NARROW_QUERY" value={NARROW_QUERY} />
      <p className="text-sm text-th-hi3">Phone is below sm (the Fold's cover screen). Narrow is below md, where BottomNav shows and NavRail hides.</p>
    </div>
  );
}

function Now() {
  const now = useNow(1000);
  const [opened] = useState(() => Date.now());
  return (
    <div className="grid w-full max-w-md gap-2">
      <Readout label="useNow(1000)" value={time(now)} />
      <Readout label="ago(opened, { now })" value={ago(opened, { now })} />
      <p className="text-sm text-th-hi3">It ticks every second and pauses while this tab is in the background.</p>
    </div>
  );
}

function Stored() {
  const [count, setCount] = useLocalStorage<number>('nish-docs-hook-demo', 0);
  const [name, setName] = useLocalStorage('nish-docs-hook-demo-name', '', { raw: true });
  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setCount((c) => c + 1)}>
          Add one
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCount(0)}>
          Reset
        </Button>
        <span className="font-mono text-sm tabular-nums text-th-hi">count = {count}</span>
      </div>
      <input
        aria-label="Name (saved as a raw string)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type a name"
        className="min-h-9 rounded-lg border border-th-line bg-th-surface px-3 text-sm text-th-hi pointer-coarse:min-h-11 pointer-coarse:text-base"
      />
      <p className="text-sm text-th-hi3">Reload the page, or open it in a second tab: both values stay and sync.</p>
    </div>
  );
}

function TitleDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid w-full max-w-md gap-2">
      <Button size="sm" onClick={() => setOn((v) => !v)}>
        {on ? 'Unmount the title hook' : 'Set the title to "Inbox (3) · mail"'}
      </Button>
      {on ? <TitleSetter /> : null}
      <p className="text-sm text-th-hi3">Watch the browser tab. When the hook unmounts the previous title comes back.</p>
    </div>
  );
}
function TitleSetter() {
  useDocumentTitle('Inbox (3)', { app: 'mail' });
  return null;
}

const SECTIONS = ['intro', 'prices', 'orders', 'journal'];
function Spy() {
  const active = useScrollSpy(SECTIONS);
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-th-line bg-th-bg px-4 py-2 font-mono text-sm text-th-hi">useScrollSpy(ids) = {JSON.stringify(active)}</div>
      {SECTIONS.map((id) => (
        <section key={id} id={id} className="min-h-[70dvh] px-4 py-6">
          <h3 className="text-base font-semibold text-th-hi">{id}</h3>
          <p className="mt-1 text-sm text-th-hi3">Scroll: the id that crosses the middle of the screen is the active one.</p>
        </section>
      ))}
    </div>
  );
}

export const hooks: ComponentDoc = {
  id: 'hooks',
  name: 'Hooks',
  exports: [],
  source: 'src/components/hooks.tsx',
  summary:
    'Small hooks every app was copying: media queries and breakpoints without a resize listener, the document title with cleanup, a ticking clock that sleeps in background tabs, localStorage state that never throws and syncs across tabs, and a scroll spy for jump navigation.',
  importLine: "import { useMediaQuery, useBreakpoint, usePhone, useNarrow, BREAKPOINTS, useDocumentTitle, useNow, useLocalStorage, useScrollSpy } from '@nish/ui';",
  controls: [],
  initial: {},
  render: () => <Media />,
  code: () => "const bp = useBreakpoint(); // 'base' | 'sm' | 'md' | 'lg' | 'xl'\nconst coarse = useMediaQuery('(pointer: coarse)');",
  stories: [
    { id: 'media', name: 'useMediaQuery, useBreakpoint', render: () => <Media /> },
    { id: 'breakpoints', name: 'BREAKPOINTS, PHONE_QUERY, NARROW_QUERY', render: () => <Breakpoints /> },
    { id: 'now', name: 'useNow', render: () => <Now /> },
    { id: 'storage', name: 'useLocalStorage', render: () => <Stored /> },
    { id: 'title', name: 'useDocumentTitle', render: () => <TitleDemo /> },
    {
      id: 'spy',
      name: 'useScrollSpy',
      note: 'Scroll inside the preview.',
      render: () => (
        <Device doc="hooks" story="spy" height={340} title="useScrollSpy at 360px">
          <Spy />
        </Device>
      ),
    },
  ],
  api: { functions: ['useMediaQuery', 'useBreakpoint', 'usePhone', 'useNarrow', 'useDocumentTitle', 'useNow', 'useLocalStorage', 'useScrollSpy'], interfaces: [] },
  usage: `import { useDocumentTitle, useLocalStorage, useMediaQuery, useNarrow, useNow, usePhone } from '@nish/ui';

const isPhone = usePhone();                              // under 640px
const isNarrow = useNarrow();                            // under 768px: BottomNav shows
const hover = useMediaQuery('(hover: hover)');
const [density, setDensity] = useLocalStorage('density', 'comfortable', { raw: true });
const now = useNow(60_000);                              // re-render once a minute

useDocumentTitle(unread ? \`Inbox (\${unread})\` : 'Inbox', { app: 'mail' });`,
  guidelines: [
    'usePhone is true below 640px and useNarrow below 768px, using BREAKPOINTS so they agree with Tailwind. Use them instead of a private matchMedia string.',
    'Prefer CSS (Tailwind breakpoints, pointer-coarse:) for layout. Use the hooks when behavior changes, such as rendering a sheet instead of a menu.',
    'useMediaQuery and useBreakpoint are false and "base" on the server and on the first render, then update. Do not branch the markup of server-rendered pages on them.',
    'useLocalStorage never throws: private mode, a full quota and bad JSON all fall back to the initial value. Keep it for per-device conveniences, not for data that must survive.',
    'useDocumentTitle restores the previous title on unmount, so nested routes can each set their own.',
    'useScrollSpy expects the sections to exist by the time it runs; SectionNav wraps it with the chips.',
  ],
};
