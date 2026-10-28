import { useEffect, useRef } from 'react';
import '../../src/css/components.css';
import { mountChecklist, mountHeightVar, mountScrollspy, mountStuck, openSheet } from '../../src/theme';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- Static parity --------------------------------------------------------------------------
// The new classes in nish-components.css and the helpers in @nish/ui/theme, used the way a
// static page (the hub, mc, trips) uses them: plain markup plus one mount call.

function Loading() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="nish-skeleton-group" aria-busy="true" style={{ display: 'grid', gap: 8 }}>
        <span className="nish-skeleton nish-skeleton--text" style={{ width: '60%' }} />
        <span className="nish-skeleton nish-skeleton--text" />
        <div className="nish-skeleton nish-skeleton--thumb" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="nish-spinner nish-spinner--sm" role="status" aria-label="Loading" />
        <span className="nish-spinner" role="status" aria-label="Loading" />
        <span className="nish-spinner nish-spinner--lg" role="status" aria-label="Loading" />
        <button type="button" className="nish-btn nish-btn--primary" aria-busy="true">
          Save
        </button>
      </div>
    </div>
  );
}

function Sheet() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="nish-btn nish-btn--primary" onClick={() => dialog.current && openSheet(dialog.current)}>
        Open the sheet
      </button>
      <dialog ref={dialog} className="nish-sheet" aria-labelledby="static-sheet-title">
        <header className="nish-sheet-header">
          <h2 className="nish-sheet-title" id="static-sheet-title">
            Filters
          </h2>
          <button type="button" className="nish-icon-btn" data-sheet-close aria-label="Close">
            ×
          </button>
        </header>
        <div className="nish-sheet-body">
          <p>A bottom sheet under 640px and a centered dialog above. Swipe the handle down, press Escape or tap the scrim to close.</p>
          <label className="nish-check-row">
            <input type="checkbox" className="nish-checkbox" defaultChecked /> Only direct flights
          </label>
          <label className="nish-check-row">
            <input type="checkbox" className="nish-checkbox" /> Free cancellation
          </label>
        </div>
        <footer className="nish-sheet-footer">
          <button type="button" className="nish-btn" data-sheet-close>
            Cancel
          </button>
          <button type="button" className="nish-btn nish-btn--primary" data-sheet-close>
            Apply
          </button>
        </footer>
      </dialog>
    </>
  );
}

function Controls() {
  return (
    <div className="grid w-full max-w-sm gap-1">
      <label className="nish-check-row">
        <input type="checkbox" className="nish-checkbox" defaultChecked /> Email me about price drops
      </label>
      <label className="nish-check-row">
        <input type="checkbox" className="nish-switch" role="switch" defaultChecked /> Push alerts
      </label>
      <label className="nish-check-row">
        <input type="checkbox" className="nish-switch" role="switch" style={{ ['--accent' as string]: 'var(--nish-ok)' }} /> Share with family
      </label>
    </div>
  );
}

function Checklist() {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => (list.current ? mountChecklist(list.current) : undefined), []);
  const items = ['Passport', 'Charger', 'Adapter', 'Swimsuit'];
  return (
    <div className="w-full max-w-sm">
      <div className="nish-checklist-progress" aria-live="polite">
        0 of {items.length}
      </div>
      <ul ref={list} className="nish-checklist" data-store="docs-static-packing">
        {items.map((it) => (
          <li key={it} data-id={it.toLowerCase()}>
            <label className="nish-check-row">
              <input type="checkbox" className="nish-checkbox" />
              <span className="nish-check-text">{it}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinkCards() {
  const dot = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
    </svg>
  );
  return (
    <div className="grid w-full gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}>
      <a className="nish-link-card" data-accent="chart-3" href="#/components/static-parity">
        <span className="nish-link-card-icon" aria-hidden="true">{dot}</span>
        <span className="nish-link-card-title">Minecraft</span>
        <span className="nish-link-card-blurb">Server status and controls.</span>
        <span className="nish-link-card-meta">Up 3 days</span>
      </a>
      <a className="nish-link-card nish-link-card--row" data-accent="chart-5" href="#/components/static-parity">
        <span className="nish-link-card-icon" aria-hidden="true">{dot}</span>
        <span className="nish-link-card-title">Trips</span>
        <span className="nish-link-card-blurb">Plans and packing.</span>
      </a>
      <div className="nish-link-card nish-link-card--row" data-accent="chart-7" aria-disabled="true">
        <span className="nish-link-card-icon" aria-hidden="true">{dot}</span>
        <span className="nish-link-card-title">Photos</span>
        <span className="nish-link-card-blurb">Coming soon.</span>
      </div>
    </div>
  );
}

const SECTIONS = ['overview', 'flights', 'hotels', 'packing'];

/** A whole static page: sticky bar, scrollspy subnav and a bottom nav, with their mount calls. */
function StaticPage() {
  const nav = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLElement>(null);
  useEffect(() => {
    const undo = [
      nav.current && mountScrollspy(nav.current),
      sticky.current && mountStuck(sticky.current),
      bottom.current && mountHeightVar(bottom.current, '--nish-bottom-nav-h'),
    ];
    return () => undo.forEach((u) => u?.());
  }, []);
  const icon = (d: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  return (
    <div>
      <div ref={sticky} className="nish-sticky" style={{ padding: '10px 16px' }}>
        <strong>Lisbon, March</strong>
      </div>
      <nav ref={nav} className="nish-subnav" aria-label="Sections" style={{ ['--nish-sticky-top' as string]: '0px' }}>
        {SECTIONS.map((s) => (
          <a key={s} href={`#${s}`} onClick={(e) => { e.preventDefault(); document.getElementById(s)?.scrollIntoView(); }}>
            {s[0].toUpperCase() + s.slice(1)}
          </a>
        ))}
      </nav>
      <div className="nish-pad-bottom-inset" style={{ padding: '0 16px' }}>
        {SECTIONS.map((s) => (
          <section key={s} id={s} className="nish-scroll-target" style={{ minHeight: '60dvh', paddingTop: 16 }}>
            <h3>{s}</h3>
            <p>Scroll: the subnav marks the section in view and the bar above gains its border.</p>
          </section>
        ))}
      </div>
      <nav ref={bottom} className="nish-bottom-nav" aria-label="Pages">
        <a className="nish-bottom-nav-item" href="#/" aria-current="page">
          {icon('M3 12 12 3l9 9M5 10v10h14V10')}
          <span>Home</span>
        </a>
        <a className="nish-bottom-nav-item" href="#/">
          {icon('M4 6h16M4 12h16M4 18h16')}
          <span>Trips</span>
        </a>
        <a className="nish-bottom-nav-item" href="#/">
          {icon('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0')}
          <span>Alerts</span>
        </a>
      </nav>
    </div>
  );
}

export const staticParity: ComponentDoc = {
  id: 'static-parity',
  name: 'Static parity',
  exports: [],
  source: 'src/css/components.css',
  summary:
    'The same new pieces for pages without React (the hub, mc, trips): skeletons, spinners and busy buttons, bottom sheets, checkboxes and switches, a scrollspy subnav, link cards, sticky bars, a bottom nav and persistent checklists. Plain markup with nish-components.css, plus small helpers from @nish/ui/theme (window.nishTheme in classic scripts).',
  importLine: "import { openSheet, mountScrollspy, mountStuck, mountChecklist, mountHeightVar } from '@nish/ui/theme';",
  controls: [],
  initial: {},
  render: () => <Loading />,
  code: () => '<span class="nish-spinner" role="status" aria-label="Loading"></span>\n<button class="nish-btn nish-btn--primary" aria-busy="true">Save</button>',
  stories: [
    { id: 'loading', name: '.nish-skeleton, .nish-spinner, busy buttons', render: () => <Loading /> },
    { id: 'sheet', name: '.nish-sheet and openSheet()', note: 'A bottom sheet on a phone, a centered dialog from 640px. Use the Theme picker above to see it in every theme.', render: () => <Sheet /> },
    { id: 'controls', name: '.nish-checkbox and .nish-switch', note: 'The label row is the 44px target. Set --accent on a control to recolor it.', render: () => <Controls /> },
    { id: 'checklist', name: '.nish-checklist and mountChecklist()', note: 'Tick items, then reload: the state is kept in localStorage.', render: () => <Checklist /> },
    { id: 'link-card', name: '.nish-link-card', wide: true, render: () => <LinkCards /> },
    {
      id: 'page',
      name: '.nish-subnav, .nish-sticky and .nish-bottom-nav',
      note: 'A whole static page at 360px. Scroll inside the preview.',
      render: () => (
        <Device doc="static-parity" story="page" height={520} title="A static page at 360px">
          <StaticPage />
        </Device>
      ),
    },
  ],
  api: { functions: ['openSheet', 'mountScrollspy', 'mountStuck', 'mountChecklist', 'mountHeightVar'], interfaces: [] },
  usage: `<link rel="stylesheet" href="nish/nish-components.css">

<nav class="nish-subnav" id="jump" aria-label="Sections">
  <a href="#flights">Flights</a><a href="#hotels">Hotels</a>
</nav>
<section id="flights" class="nish-scroll-target">…</section>

<dialog class="nish-sheet" id="filters" aria-labelledby="t">
  <header class="nish-sheet-header"><h2 class="nish-sheet-title" id="t">Filters</h2>
    <button class="nish-icon-btn" data-sheet-close aria-label="Close">×</button></header>
  <div class="nish-sheet-body">…</div>
</dialog>

<script type="module">
  import { openSheet, mountScrollspy, mountStuck, mountChecklist, mountHeightVar } from './nish/theme.js';
  mountScrollspy(document.getElementById('jump'));
  document.getElementById('open').onclick = () => openSheet(document.getElementById('filters'));
  mountHeightVar(document.querySelector('.nish-bottom-nav'), '--nish-bottom-nav-h');
</script>
<!-- Classic scripts: window.nishTheme.openSheet(...) from theme.global.js. -->`,
  guidelines: [
    'Every helper returns a function that undoes it; call it if you remove the element, or ignore it on a page that lives until navigation.',
    'Give the page class="nish-pad-bottom-inset" when it has a .nish-bottom-nav, and call mountHeightVar on the nav so toasts clear it.',
    'Sections you jump to carry class="nish-scroll-target", so they stop below the sticky header and subnav instead of under them.',
    'A busy button keeps its width and hides its label; also set disabled (or ignore clicks) while it is busy.',
    'React apps should use the components (Skeleton, Spinner, Drawer, Switch, SectionNav, LinkCard, BottomNav); the classes are for pages without React.',
  ],
};
