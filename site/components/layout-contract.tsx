import { useEffect, useState } from 'react';
import { BottomNav, Button, StickyActionBar } from '../../src';
import { DEMO_ITEMS, Device, Filler, withState } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- Layout contract ------------------------------------------------------------------------

const VARS: { name: string; writer: string; reader: string; value: string }[] = [
  { name: '--nish-header-h', writer: 'AppHeader (sticky)', reader: 'PageHeader, StickyBar, SectionNav, LoadingBar, .nish-scroll-target', value: 'The header\'s measured height in px' },
  { name: '--nish-bottom-nav-h', writer: 'BottomNav (while shown)', reader: '--nish-bottom-inset, StickyActionBar, MoreSheet', value: 'Its height including the safe area' },
  { name: '--nish-bottom-bar-h', writer: 'StickyActionBar (while open)', reader: '--nish-bottom-inset', value: 'Its measured height' },
  { name: '--nish-bottom-inset', writer: 'base.css (never set it)', reader: 'Toaster, PageContainer, .nish-pad-bottom-inset', value: 'bottom-nav-h + bottom-bar-h' },
  { name: '--nish-sticky-extra', writer: 'StickyBar, SectionNav', reader: '.nish-scroll-target', value: 'The sticky bar\'s height' },
  { name: '--nish-page-gutter', writer: 'base.css', reader: 'PageContainer, StickyBar, ScrollRow bleed', value: '1rem, 1.5rem from 640px' },
];

function read(name: string): string {
  if (typeof document === 'undefined') return '';
  const root = document.documentElement;
  return root.style.getPropertyValue(name).trim() || getComputedStyle(root).getPropertyValue(name).trim() || 'unset';
}

/** The live values of the contract's variables on <html>, refreshed as they change. */
export function Readout({ names = VARS.map((v) => v.name) }: { names?: string[] }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => setVals(Object.fromEntries(names.map((n) => [n, read(n)])));
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-nish-layer-open'] });
    window.addEventListener('resize', update);
    const id = setInterval(update, 500);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', update);
      clearInterval(id);
    };
  }, [names]);
  return (
    <dl className="m-0 grid w-full min-w-0 overflow-hidden rounded-xl border border-th-line bg-th-surface">
      {names.map((n) => (
        <div key={n} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-th-line px-3.5 py-2 last:border-0">
          <dt className="min-w-0 break-all font-mono text-[13px] text-th-hi3">{n}</dt>
          <dd className="m-0 font-mono text-sm font-semibold tabular-nums text-th-hi">{vals[n] || 'unset'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table() {
  return (
    <div className="grid w-full min-w-0 gap-3">
      <ul className="m-0 grid list-none gap-3 p-0 sm:hidden">
        {VARS.map((v) => (
          <li key={v.name} className="rounded-xl border border-th-line bg-th-surface p-3.5">
            <code className="break-all font-mono text-[13px] font-semibold text-th-hi">{v.name}</code>
            <p className="mt-1 text-sm text-th-hi2">{v.value}</p>
            <p className="mt-1 text-xs text-th-hi3">Written by {v.writer}</p>
            <p className="text-xs text-th-hi3">Read by {v.reader}</p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-th-line bg-th-surface sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-th-line text-xs text-th-hi3">
              <th className="px-4 py-2 font-medium">Variable</th>
              <th className="px-4 py-2 font-medium">Written by</th>
              <th className="px-4 py-2 font-medium">Value</th>
              <th className="px-4 py-2 font-medium">Read by</th>
            </tr>
          </thead>
          <tbody>
            {VARS.map((v) => (
              <tr key={v.name} className="border-b border-th-line align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] font-medium text-th-hi">{v.name}</td>
                <td className="px-4 py-2.5 text-th-hi2">{v.writer}</td>
                <td className="px-4 py-2.5 text-th-hi2">{v.value}</td>
                <td className="px-4 py-2.5 text-th-hi3">{v.reader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Publisher({ nav = true, bar = true }: { nav?: boolean; bar?: boolean }) {
  const [tab, setTab] = useState('home');
  const [open, setOpen] = useState(bar);
  return (
    <>
      <div className="px-4 pt-4">
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close the action bar' : 'Open the action bar'}
        </Button>
        <div className="mt-3">
          <Readout names={['--nish-bottom-nav-h', '--nish-bottom-bar-h', '--nish-bottom-inset']} />
        </div>
      </div>
      <Filler rows={4} title="Page" />
      {nav ? <BottomNav items={withState(DEMO_ITEMS.slice(0, 4), tab, setTab)} /> : null}
      <StickyActionBar open={open} message="2 changes" primary={<Button variant="primary" onClick={() => setOpen(false)}>Save</Button>} />
    </>
  );
}

export const layoutContract: ComponentDoc = {
  id: 'layout-contract',
  name: 'Layout contract',
  exports: [],
  source: 'src/css/base.css',
  summary:
    'The header and bottom bars publish their heights as CSS variables on <html>; Toaster, Drawer, sticky elements and page padding read them. So a toast never covers a tab bar and a sticky filter row sits exactly under the header, with no React context and no offsets passed by hand. It works in static pages too.',
  importLine: "import { useHeightVar } from '@nish/ui';",
  controls: [],
  initial: {},
  render: () => (
    <div className="grid w-full gap-2">
      <p className="text-sm text-th-hi3">Live values on this page right now:</p>
      <Readout />
    </div>
  ),
  code: () => 'const ref = useRef<HTMLElement>(null);\nuseHeightVar(ref, \'--nish-bottom-nav-h\', visible);',
  stories: [
    { id: 'table', name: 'The variables', wide: true, render: () => <Table /> },
    {
      id: 'live',
      name: 'Watch them change',
      note: 'A BottomNav publishes its height; open the action bar and the inset grows by its height.',
      render: () => (
        <Device doc="layout-contract" story="live" height={520} title="Layout variables at 360px">
          <Publisher />
        </Device>
      ),
    },
    {
      id: 'nonav',
      name: 'Without a BottomNav',
      note: '--nish-bottom-nav-h is not set (it reads as 0), so only the action bar counts.',
      render: () => (
        <Device doc="layout-contract" story="nonav" height={420} title="Layout variables without a BottomNav">
          <Publisher nav={false} />
        </Device>
      ),
    },
  ],
  api: { functions: ['useHeightVar', 'useStuck', 'useScrollEdges', 'mountHeightVar'], interfaces: [] },
  usage: `import { useHeightVar } from '@nish/ui';

// A bar you build yourself joins the contract in one line:
const ref = useRef<HTMLDivElement>(null);
useHeightVar(ref, '--nish-bottom-bar-h', open);

// And anything can read it:
.my-fab { bottom: calc(var(--nish-bottom-inset, 0px) + 16px); }
.page   { padding-bottom: var(--nish-bottom-inset, 0px); }`,
  guidelines: [
    'Components remove their variable when they unmount, hide, or fall below their breakpoint, so a stale height never lingers.',
    'Never set --nish-bottom-inset yourself: base.css defines it as the sum of the nav and bar heights.',
    'Read variables with a 0px fallback (var(--nish-header-h, 0px)) so the element works with no header on the page.',
    'The bottom nav height already includes the device safe area, so do not add env(safe-area-inset-bottom) on top of it.',
    'Static pages join with mountHeightVar(el, name) from @nish/ui/theme, the twin of useHeightVar.',
  ],
};
