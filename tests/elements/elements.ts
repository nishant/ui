import '../../dist/nish.css';
import '../../dist/nish-components.css';
import { toast } from '../../src/elements';
import '../../src/elements/forms';

// The element side of the harness. ?c=<component>&... picks what to render:
//   toggle                      <nish-theme-toggle pill>
//   sheet                       an open <nish-sheet>
//   dialog                      an open <nish-dialog>
//   toast&tone=ok|warn|loss|info|neutral
//   nav                         <nish-bottom-nav> with Home active
//   behavior                    every element with triggers, for behavior.spec.ts
//   <wave 2 case>               one of WAVE2 below, in a 28rem stage (the names of react.tsx's WAVE2);
//                               &open=1 opens the combobox, &copied=1 copies, like react.tsx
// The page sets <html data-ready> when the component is on screen and settled.

const q = new URLSearchParams(location.search);
const c = q.get('c') ?? 'behavior';
const root = document.getElementById('root') as HTMLElement;

declare global {
  interface Window {
    toast: typeof toast;
    loadBundle: () => Promise<unknown>;
    nishEvents: { type: string; detail?: unknown; target: string }[];
  }
}
window.toast = toast;
// A second copy of the bundle, to prove that defining the tags twice does not throw.
window.loadBundle = () => import('../../dist/elements.js');
window.nishEvents = [];

const HOME_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>';
const LIST_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
const GEAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';

const SHEET = `
  <nish-sheet id="filters" label="Filters" open>
    <header class="nish-sheet-header">
      <h2 class="nish-sheet-title">Filters</h2>
      <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">x</button>
    </header>
    <div class="nish-sheet-body"><p>Pick what to show in the list.</p></div>
    <footer class="nish-sheet-footer"><button type="button" class="nish-btn nish-btn--primary" data-sheet-close>Apply</button></footer>
  </nish-sheet>`;

const DIALOG = `
  <nish-dialog id="discard" open>
    <h2 class="nish-dialog-title">Discard changes?</h2>
    <div class="nish-dialog-body">Your edits are lost.</div>
    <div class="nish-dialog-actions">
      <button type="button" class="nish-btn" data-dialog-close value="cancel">Cancel</button>
      <button type="button" class="nish-btn nish-btn--primary" data-dialog-close value="discard">Discard</button>
    </div>
  </nish-dialog>`;

function nav(): string {
  return `
  <nish-bottom-nav label="Sections">
    <a href="/home">${HOME_ICON}<span>Home</span></a>
    <a href="/lists">${LIST_ICON}<span>Lists</span></a>
    <a href="/settings">${GEAR_ICON}<span>Settings</span></a>
  </nish-bottom-nav>`;
}

const BEHAVIOR = `
  <main style="padding:16px;display:flex;flex-direction:column;gap:12px;align-items:flex-start">
    <nish-theme-toggle id="tt"></nish-theme-toggle>
    <button type="button" class="nish-btn" id="open-sheet" data-sheet-open="s1">Open sheet</button>
    <button type="button" class="nish-btn" id="open-dialog" data-dialog-open="d1">Open dialog</button>
    <button type="button" class="nish-btn" id="toast-btn">Toast</button>
    <nish-sheet id="s1" label="Filters">
      <header class="nish-sheet-header">
        <h2 class="nish-sheet-title">Filters</h2>
        <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">x</button>
      </header>
      <div class="nish-sheet-body"><p>Pick what to show.</p></div>
      <footer class="nish-sheet-footer"><button type="button" class="nish-btn nish-btn--primary" id="sheet-apply" data-sheet-close>Apply</button></footer>
    </nish-sheet>
    <nish-dialog id="d1">
      <h2 class="nish-dialog-title">Discard changes?</h2>
      <div class="nish-dialog-body">Your edits are lost.</div>
      <div class="nish-dialog-actions">
        <button type="button" class="nish-btn" id="dlg-cancel" data-dialog-close value="cancel">Cancel</button>
        <button type="button" class="nish-btn nish-btn--primary" id="dlg-ok" data-dialog-close value="discard">Discard</button>
        <button type="button" class="nish-btn" id="dlg-plain" data-dialog-close>Plain</button>
      </div>
    </nish-dialog>
  </main>
  ${nav()}`;

// --- Wave 2: the nish-* class and element markup of each case in react.tsx's WAVE2 ------------

const ico = (d: string, size = 20) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="${size}" height="${size}"><path d="${d}"/></svg>`;
const FOLDER = ico('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
const CHEVRON =
  '<svg class="nish-list-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const CALLOUT_ICON = {
  ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
} as const;
const CITY_OPTIONS = `
  <option value="a" data-hint="TX">Austin</option>
  <option value="b" data-hint="MA">Boston</option>
  <option value="c" data-hint="IL">Chicago</option>`;
const TAB_BUTTONS = `
  <button value="overview">Overview</button>
  <button value="activity">Activity</button>
  <button value="settings">Settings</button>`;
const RANGE_BUTTONS = '<button value="24h">24h</button><button value="7d">7d</button><button value="30d">30d</button>';
const WRAP_URL = 'https://minecraft.nish.software/world/overworld/regions/r.0.0.mca';
const SPARK = '3,5,4,8,6,9,7';

const tabs = (attrs = '') => `<nish-tabs label="Sections" value="overview" ${attrs}>${TAB_BUTTONS}</nish-tabs>`;
const seg = (attrs = '') => `<nish-segmented label="Range" value="7d" ${attrs}>${RANGE_BUTTONS}</nish-segmented>`;
const callout = (tone: string) => {
  const icon = tone === 'ok' ? CALLOUT_ICON.ok : tone === 'warn' || tone === 'loss' ? CALLOUT_ICON.warn : CALLOUT_ICON.info;
  return `<div class="nish-callout nish-callout--${tone} case"><span class="nish-callout-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">${icon}</svg></span><div><p class="nish-callout-title">Heads up</p><p>Body text for the notice.</p></div></div>`;
};
const stat = (cls = '', valueCls = '', sub = '', list = '') =>
  `<dl class="nish-stats ${list}"><div class="nish-stat ${cls} case"><dt class="nish-stat-label">Blocks mined</dt><dd class="nish-stat-value ${valueCls}">1,284</dd>${sub ? `<dd class="nish-stat-sub">${sub}</dd>` : ''}</div></dl>`;
const meter = (cls = '') =>
  `<div class="nish-meter nish-meter--ok ${cls} case" role="meter" aria-label="Durability" aria-valuemin="0" aria-valuemax="100" aria-valuenow="64"><i style="width:64%"></i></div>`;
const listRow = (cls = '', o: { subtitle?: boolean; plain?: boolean; title?: string; current?: boolean } = {}) => {
  const title = o.title ?? 'Backups';
  const titleCls = o.title ? 'nish-list-title nish-list-title--2' : 'nish-list-title';
  const text = `<span class="nish-list-text"><span class="${titleCls}">${title}</span>${o.subtitle === false ? '' : '<span class="nish-list-subtitle">Last run 2h ago</span>'}</span>`;
  if (o.plain) return `<div class="nish-list-row ${cls} case">${text}</div>`;
  return `<a class="nish-list-row ${cls} case" href="/jobs"${o.current ? ' aria-current="true"' : ''}><span class="nish-list-icon">${FOLDER}</span>${text}<span class="nish-list-meta">12 GB</span>${CHEVRON}</a>`;
};
const kvRows = (wrap = '') =>
  `<div class="nish-kv-row"><dt>Host</dt><dd>mc.nish.software</dd></div><div class="nish-kv-row ${wrap}"><dt>Path</dt><dd>${WRAP_URL}</dd></div>`;
const legend = (cls = '') =>
  `<ul class="nish-legend ${cls} case" aria-label="Legend"><li class="nish-legend-item" style="--c: var(--nish-chart-1)"><i class="nish-legend-swatch" aria-hidden="true"></i>CPU</li><li class="nish-legend-item" style="--c: var(--nish-chart-2)"><i class="nish-legend-swatch" aria-hidden="true"></i>Memory</li></ul>`;
const dot = (cls: string) => `<span class="nish-dot ${cls} case" aria-hidden="true"></span>`;
const spinner = (cls = '') => `<span class="case" style="display:inline-flex"><span class="nish-spinner ${cls}" aria-hidden="true"></span></span>`;
const disclosure = (attrs = '', cls = '') =>
  `<details class="nish-disclosure ${cls} case" ${attrs}><summary>Sources</summary><div>Three pages and a log.</div></details>`;
const field = (attrs: string) => `<nish-field ${attrs}><input class="nish-input" type="email"></nish-field>`;
const cb = (attrs = '', options = CITY_OPTIONS) => `<nish-combobox label="City" placeholder="City" ${attrs}>${options}</nish-combobox>`;
const appHeader = (inner: string) => `<header class="nish-app-header case">${inner}</header>`;
const BACK =
  '<a class="nish-pill-link nish-app-header-back" href="https://nish.software">← <span class="nish-pill-link-label">nish.software</span></a>';

const WAVE2: Record<string, string> = {
  input: '<input class="nish-input" aria-label="Name" placeholder="Name">',
  select: '<select class="nish-select" aria-label="Sort"><option value="a">Newest</option><option value="b" selected>Oldest</option></select>',
  textarea: '<textarea class="nish-textarea" aria-label="Notes" rows="3" placeholder="Notes"></textarea>',
  'textarea-grow':
    '<textarea class="nish-textarea nish-textarea--grow" aria-label="Notes" rows="3" style="--nish-rows: 3" placeholder="Notes"></textarea>',
  label: '<span class="nish-label case">Section</span>',
  field: field('label="Email" hint="We never share it"'),
  'field-error': field('label="Email" error="Enter a valid address"'),
  'field-inline':
    '<nish-field label="Nickname" optional layout="inline" hint="Shown on your profile"><input class="nish-input" type="text"></nish-field>',
  'field-group':
    '<fieldset class="nish-field case"><legend class="nish-field-label">Work mode</legend><nish-chip-group label="Work mode"><button>Remote</button><button>Hybrid</button></nish-chip-group><small class="nish-hint">Pick one</small></fieldset>',
  checkbox: '<label class="nish-check-row"><input type="checkbox" class="nish-checkbox"><span class="nish-check-text">Email me</span></label>',
  'checkbox-checked':
    '<label class="nish-check-row"><input type="checkbox" class="nish-checkbox" checked><span class="nish-check-text">Email me</span></label>',
  switch: '<nish-switch label="Alerts"></nish-switch>',
  'switch-on': '<nish-switch label="Alerts" description="Email me when it changes" checked></nish-switch>',
  'switch-sm-on': '<nish-switch label="Alerts" size="sm" checked></nish-switch>',
  'switch-start': '<nish-switch label="Alerts" description="Email me when it changes" label-side="start" checked></nish-switch>',
  search: '<nish-search value="bike" label="Search jobs"></nish-search>',
  'search-sm': '<nish-search value="bike" label="Search jobs" size="sm"></nish-search>',
  'search-xs': '<nish-search value="bike" label="Search jobs" size="xs"></nish-search>',
  'search-empty': '<nish-search label="Search jobs"></nish-search>',
  'search-bare': '<nish-search value="bike" label="Search jobs" variant="bare"></nish-search>',
  'chip-off': '<nish-chip-group label="Status"><button>Open</button></nish-chip-group>',
  'chip-on': '<nish-chip-group label="Status"><button aria-pressed="true">Open</button></nish-chip-group>',
  'chip-sm': '<nish-chip-group label="Status"><button class="nish-chip--sm" aria-pressed="true">Open</button></nish-chip-group>',
  'chip-suggestion': `<div class="nish-chips" role="group" aria-label="Suggestions"><button type="button" class="nish-chip nish-chip--suggestion">Add tag</button></div>`,
  'chip-tag': '<nish-chip-group label="Selected"><span class="nish-chip" data-removable>Draft</span></nish-chip-group>',
  seg: seg(),
  'seg-xs': seg('size="xs"'),
  'seg-md': seg('size="md"'),
  'seg-block': seg('block'),
  'skeleton-text': '<div class="nish-skeleton nish-skeleton--text case" style="width: 40%"></div>',
  'skeleton-circle': '<div class="nish-skeleton nish-skeleton--circle case" style="width: 40px"></div>',
  spinner: spinner(),
  'spinner-sm': spinner('nish-spinner--sm'),
  'spinner-lg': spinner('nish-spinner--lg'),
  empty: '<div class="nish-empty case"><p class="nish-empty-title">No trips yet</p><p>Plan one with /trip-plan.</p></div>',
  'error-state':
    '<div class="nish-error-state case" role="alert"><p>Failed to load</p><button type="button" class="nish-btn nish-btn--sm">Retry</button></div>',
  'callout-info': callout('info'),
  'callout-accent': callout('accent'),
  'callout-ok': callout('ok'),
  'callout-warn': callout('warn'),
  'callout-loss': callout('loss'),
  'dot-neutral': dot(''),
  'dot-accent': dot('nish-dot--accent'),
  'dot-ok': dot('nish-dot--ok'),
  'dot-warn': dot('nish-dot--warn'),
  'dot-loss': dot('nish-dot--loss'),
  'dot-info': dot('nish-dot--info'),
  'dot-xs': dot('nish-dot--ok nish-dot--xs'),
  'dot-md': dot('nish-dot--ok nish-dot--md'),
  'dot-lg-halo': dot('nish-dot--ok nish-dot--lg nish-dot--halo'),
  stat: stat(),
  'stat-ok': stat('', 'nish-stat-value--ok', '+12 today'),
  'stat-inset': stat('nish-stat--tinted'),
  'stat-sm': stat('', '', '', 'nish-stats--sm'),
  meter: meter(),
  'meter-xs': meter('nish-meter--xs'),
  'meter-sm': meter('nish-meter--sm'),
  'meter-md': meter('nish-meter--md'),
  disclosure: disclosure(),
  'disclosure-open': disclosure('open'),
  'disclosure-card-open': disclosure('open', 'nish-disclosure--card'),
  tabs: tabs(),
  'tabs-sm': tabs('size="sm"'),
  'tabs-xs': tabs('size="xs"'),
  'tabs-block': tabs('block'),
  'tabs-pill': tabs('variant="pill"'),
  'tabs-pill-sm': tabs('variant="pill" size="sm"'),
  'tabs-pill-xs': tabs('variant="pill" size="xs"'),
  'tabs-pill-block': tabs('variant="pill" block'),
  combobox: cb('value="b"'),
  'combobox-sm': cb('value="b" size="sm"'),
  'combobox-open': cb('value="b"'),
  'combobox-loading': cb('loading'),
  'combobox-empty': cb('', ''),
  'list-row': listRow(),
  'list-row-active': listRow('', { current: true }),
  'list-row-danger': listRow('nish-list-row--danger'),
  'list-row-dense': listRow('nish-list-row--dense', { subtitle: false }),
  'list-row-compact': listRow('nish-list-row--compact'),
  'list-row-title2': listRow('', { title: 'A backup job with a rather long name that runs to a second line on a phone' }),
  'list-row-plain': listRow('', { plain: true }),
  kbd: '<kbd class="nish-kbd case">Ctrl K</kbd>',
  'page-header':
    '<header class="nish-page-header case"><div><h1 class="nish-page-header-title">Backups</h1><p class="nish-page-header-subtitle">Nightly copies of every site.</p></div><div class="nish-page-header-actions"><button type="button" class="nish-btn">Run now</button></div></header>',
  'section-header':
    '<div class="nish-section-header case"><h2 class="nish-section-header-title">Services</h2><div class="nish-section-header-actions"><span>3 of 12</span><button type="button" class="nish-btn nish-btn--sm">Add</button></div></div>',
  kv: `<dl class="nish-kv case">${kvRows()}</dl>`,
  'kv-dense': `<dl class="nish-kv nish-kv--dense case">${kvRows()}</dl>`,
  'kv-wrap': `<dl class="nish-kv case">${kvRows('nish-kv-row--wrap')}</dl>`,
  'kv-words':
    '<dl class="nish-kv case"><div class="nish-kv-row"><dt>Host</dt><dd>mc.nish.software</dd></div><div class="nish-kv-row nish-kv-row--words"><dt>Earnings Calendar</dt><dd>Last sync failed, retrying in a few minutes</dd></div></dl>',
  legend: legend(),
  'legend-dot': legend('nish-legend--dot'),
  sparkline: `<nish-sparkline values="${SPARK}" label="Response time"></nish-sparkline>`,
  'sparkline-ok': `<nish-sparkline values="${SPARK}" label="Response time" tone="ok"></nish-sparkline>`,
  'sparkline-empty': '<nish-sparkline values=",," label="Response time"></nish-sparkline>',
  'app-header': appHeader(
    `${BACK}<a class="nish-app-header-name" href="/">${ico('M3 3v18h18M7 15l4-4 3 3 5-6', 20)}Trackers</a><div class="nish-app-header-tools"><button type="button" class="nish-icon-btn" aria-label="Add">${ico('M5 12h14M12 5v14', 18)}</button></div>`,
  ),
  'app-header-nav': appHeader(
    `${BACK}<span class="nish-app-header-name">Trackers</span><nav class="nish-app-header-nav" aria-label="Trackers"><a class="nish-tab" href="/" aria-current="page">Overview</a><a class="nish-tab" href="/jobs">Jobs</a></nav>`,
  ),
  copy: '<nish-copy-button value="npm i nish-ui"></nish-copy-button>',
  'copy-icon': '<nish-copy-button value="npm i nish-ui" icon></nish-copy-button>',
  'copy-copied': '<nish-copy-button value="npm i nish-ui"></nish-copy-button>',
};

function markup(): string {
  switch (c) {
    case 'toggle':
      return '<div style="padding:24px"><nish-theme-toggle pill></nish-theme-toggle></div>';
    case 'sheet':
      return SHEET;
    case 'dialog':
      return DIALOG;
    case 'nav':
      return nav();
    case 'behavior':
      return BEHAVIOR;
    default:
      return c in WAVE2 ? `<div id="stage" style="box-sizing:border-box;padding:16px;max-width:28rem">${WAVE2[c]}</div>` : '';
  }
}

if (c === 'nav' || c === 'behavior') history.replaceState(null, '', `/home?${q}`);
// The React page has no body margin (Tailwind preflight): give the wave 2 stage the same room.
if (c in WAVE2) document.body.style.margin = '0';
root.innerHTML = markup();

for (const tag of ['nish-sheet', 'nish-dialog']) {
  document.addEventListener('nish-close', (e) => {
    const t = e.target as Element;
    if (t.localName === tag) window.nishEvents.push({ type: 'nish-close', detail: (e as CustomEvent).detail, target: t.id });
  });
}
document.getElementById('toast-btn')?.addEventListener('click', () => toast('Saved to the harness'));

if (c === 'toast') {
  const tone = q.get('tone') ?? 'neutral';
  toast('Saved to the list', { tone: tone as 'neutral', duration: 'sticky' });
}

// Settled: elements upgraded, fonts loaded, every animation finished.
void (async () => {
  await Promise.all(
    [
      'nish-theme-toggle',
      'nish-sheet',
      'nish-dialog',
      'nish-bottom-nav',
      'nish-field',
      'nish-search',
      'nish-switch',
      'nish-chip-group',
      'nish-combobox',
      'nish-tabs',
      'nish-segmented',
      'nish-copy-button',
      'nish-sparkline',
    ].map((t) => customElements.whenDefined(t)),
  );
  if (c === 'toast') await new Promise((r) => setTimeout(r, 150));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // The same two clicks as react.tsx: open a combobox; copy with a clipboard that accepts.
  if (q.has('open')) document.querySelector<HTMLElement>('input[role="combobox"]')?.click();
  if (q.has('copied')) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => undefined }, configurable: true });
    document.querySelector<HTMLElement>('#stage button')?.click();
  }
  await new Promise((r) => setTimeout(r, 100));
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Spinners and pulsing dots repeat forever: wait only for animations that end.
  await Promise.all(
    document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined)),
  );
  document.documentElement.dataset.ready = '1';
})();
