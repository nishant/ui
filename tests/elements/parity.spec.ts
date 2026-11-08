import { expect, test, type Locator, type Page } from '@playwright/test';

// Parity: the same component rendered by the React twin (react.html) and by the element or
// nish-* class markup (index.html) must look the same. For each wave 1 component and state
// (theme toggle; sheet open; dialog open; toast in each tone; bottom nav with an active item) and
// each wave 2 class and element in each state that changes its look (WAVE2_CASES: fields, switch,
// chip, tabs in every variant, open combobox, list rows, callouts, dots, ...) and each wave 3 one
// (WAVE3_CASES: tables and rows, filter bar, media thumb/row/chip, settings, split, nav rail, scroll row,
// section nav, more sheet, command palette, charts, range bar) and the wave 3 follow-ups (the pressed filter chip and the
// trailing select, the media row detail, a column split and its divider, the nav rail's tools item and footer, a bleeding
// scroll row, the settings section's actions, the command hint and empty message, the line chart tooltip, the bar chart
// readout and a dragged split divider; the ones that need a pointer state use a case's `setup` step), at 360x780 and 1440x900 (840x900 too
// where the component changes there), in light and dark:
//   - the main box has the same width and height (within 1px);
//   - the box has equal background-color, border-color (when it has a border), border-radius
//     and padding;
//   - its title or body has equal color and font-size, and its text starts at the same offset
//     inside the box (the visible padding: React draws it with wrapper divs and the nish-* classes
//     with padding on the title, so the computed padding of those nodes is not comparable).
// The box's own color and font-size are compared too (the element box sets the inherited values React's has); the text
// nodes' own values are covered by the title and body checks.
// The test fails when the element version drifts from the React one. KNOWN_GAPS is the mechanism for
// a difference that cannot be closed yet (exact values, "prop element vs react"); it is empty: a new
// difference is fixed in the CSS, never listed. Run with PARITY_VERBOSE=1 to print every difference
// with its values.

const BASE = 'http://localhost:5194';
const SIZES = [
  { name: '360', width: 360, height: 780 },
  { name: '840', width: 840, height: 900 },
  { name: '1440', width: 1440, height: 900 },
] as const;
/** The sizes every case runs at unless it says otherwise (840 is the unfolded Fold: only the cases that change there ask for it). */
const DEFAULT_RUN: readonly (typeof SIZES)[number]['name'][] = ['360', '1440'];
const SCHEMES = ['light', 'dark'] as const;

interface Part {
  box: string;
  title?: string;
  body?: string;
}
interface Case {
  name: string;
  query: string;
  react: Part;
  element: Part;
  /** Measurements left out of the comparison because the two versions draw the same look with a different
   *  structure (e.g. "box.paddingTop"). Each use says why next to the case. */
  ignore?: readonly string[];
  /** Sizes at which the component is shown (the bottom nav hides from 768px). */
  sizes?: readonly (typeof SIZES)[number]['name'][];
  /** Sizes the case runs at: 360 and 1440 by default. At a size that is run but not in `sizes`, both versions must be hidden. */
  run?: readonly (typeof SIZES)[number]['name'][];
  /** A step that puts the component in the state to measure (type into the palette, hover a chart, press a divider). It
   *  runs on both pages once the page is ready, before anything is measured. */
  setup?: (page: Page) => Promise<void>;
}

const TONES = ['neutral', 'ok', 'warn', 'loss', 'info'] as const;

const CASES: Case[] = [
  {
    name: 'theme toggle',
    query: 'c=toggle',
    react: { box: 'button[aria-label^="Theme"]' },
    element: { box: 'nish-theme-toggle button.nish-theme-btn' },
  },
  {
    name: 'sheet open',
    query: 'c=sheet',
    react: { box: '[role="dialog"]', title: '[role="dialog"] h2', body: '[role="dialog"] p' },
    element: { box: 'dialog.nish-sheet[open]', title: '.nish-sheet-title', body: '.nish-sheet-body p' },
  },
  {
    name: 'dialog open',
    query: 'c=dialog',
    react: { box: '[role="alertdialog"]', title: '[role="alertdialog"] h2', body: '[role="alertdialog"] .text-th-hi2' },
    element: { box: 'dialog.nish-dialog[open]', title: '.nish-dialog-title', body: '.nish-dialog-body' },
  },
  ...TONES.map(
    (tone): Case => ({
      name: `toast ${tone}`,
      query: `c=toast&tone=${tone}`,
      react: { box: '.pointer-events-auto', title: '.pointer-events-auto p' },
      element: { box: '.nish-toast', title: '.nish-toast-body' },
    }),
  ),
  {
    name: 'bottom nav, active item',
    query: 'c=nav',
    sizes: ['360'],
    react: { box: 'nav[aria-label="Sections"]', title: 'nav a[aria-current="page"] span.truncate' },
    element: { box: 'nav.nish-bottom-nav', title: 'nav a[aria-current="page"] > span' },
  },
];

// --- Wave 2 ---------------------------------------------------------------------------------
// react.tsx and elements.ts render the same case id in a 28rem stage. Most React components take
// className="case" and the nish-* markup carries class "case", so `.case` is often the box on both
// sides. `both` is for cases whose selectors are the same in the two pages.

const both = (box: string, rest: Omit<Part, 'box'> = {}): Pick<Case, 'react' | 'element'> => ({
  react: { box, ...rest },
  element: { box, ...rest },
});
const wave2 = (id: string, parts: Pick<Case, 'react' | 'element'>, query = '', ignore?: readonly string[]): Case => ({
  name: id.replace(/-/g, ' '),
  query: `c=${id}${query}`,
  ...parts,
  ...(ignore ? { ignore } : {}),
});
// The React switch is a transparent button around a 2px-padded track that holds the knob; .nish-switch is
// the track itself and draws the knob with a pseudo-element. Same look, so the track's padding is not compared.
const TRACK_PADDING = ['box.paddingTop', 'box.paddingRight', 'box.paddingBottom', 'box.paddingLeft'] as const;
// The React header keeps its padding on the inner row, .nish-app-header on the header itself.
const HEADER_PADDING = TRACK_PADDING;
const callout = (tone: string): Case =>
  wave2(`callout-${tone}`, {
    react: { box: '.case', title: '.case p.font-medium', body: '.case .basis-60 > div' },
    element: { box: '.case', title: '.nish-callout-title', body: '.case div > p:not(.nish-callout-title)' },
  });
const chip = (id: string, react = '#stage button', element = 'nish-chip-group button'): Case =>
  wave2(id, { react: { box: react, title: react }, element: { box: element, title: element } });
const tabs = (id: string): Case => wave2(id, both('[role="tablist"]', { title: '[role="tab"][aria-selected="true"]' }));
const seg = (id: string): Case => wave2(id, both('[role="radiogroup"]', { title: '[role="radio"][aria-checked="true"]' }));
const listRow = (id: string, body = true): Case =>
  wave2(id, {
    react: { box: '.case', title: '.case > span.min-w-0 > span:first-child', ...(body ? { body: '.case > span.min-w-0 > span:nth-child(2)' } : {}) },
    element: { box: '.case', title: '.nish-list-title', ...(body ? { body: '.nish-list-subtitle' } : {}) },
  });
const dots = ['neutral', 'accent', 'ok', 'warn', 'loss', 'info', 'xs', 'md', 'lg-halo'];
const SWITCH = {
  react: { box: '#stage button[role="switch"] > span', title: '#stage label > span.min-w-0 > span:first-child' },
  element: { box: '#stage button.nish-switch', title: '#stage label > span > span:first-child' },
};
const SWITCH_DESC = {
  react: { ...SWITCH.react, body: '#stage label > span.min-w-0 > span:nth-child(2)' },
  element: { ...SWITCH.element, body: '#stage label > span > span:nth-child(2)' },
};
const CHECK = {
  react: { box: '#stage input[type="checkbox"]', title: '#stage label span.leading-snug' },
  element: { box: '#stage input[type="checkbox"]', title: '.nish-check-text' },
};
const clear = { body: 'button[aria-label^="Clear"]' };

const WAVE2_CASES: Case[] = [
  wave2('input', both('#stage input')),
  wave2('select', both('#stage select')),
  wave2('textarea', both('#stage textarea')),
  wave2('textarea-grow', both('#stage textarea')),
  wave2('label', both('.case', { title: '.case' })),
  wave2('field', {
    react: { box: '.case', title: '.case label', body: '.case p' },
    element: { box: '.nish-field', title: 'label.nish-field-label', body: 'small.nish-hint' },
  }),
  wave2('field-error', {
    react: { box: '.case', title: '.case label', body: '.case p[role="alert"]' },
    element: { box: '.nish-field', title: 'label.nish-field-label', body: 'small.nish-error' },
  }),
  wave2('field-inline', {
    react: { box: '.case', title: '.case label', body: '.case p' },
    element: { box: '.nish-field', title: 'label.nish-field-label', body: 'small.nish-hint' },
  }),
  wave2('field-group', {
    react: { box: '.case', title: '.case legend', body: '.case > p' },
    element: { box: '.case', title: '.case legend', body: 'small.nish-hint' },
  }),
  wave2('checkbox', CHECK),
  wave2('checkbox-checked', CHECK),
  wave2('switch', SWITCH, '', TRACK_PADDING),
  wave2('switch-on', SWITCH_DESC, '', TRACK_PADDING),
  wave2('switch-sm-on', SWITCH, '', TRACK_PADDING),
  wave2('switch-start', SWITCH_DESC, '', TRACK_PADDING),
  wave2('search', both('#stage input', clear)),
  wave2('search-sm', both('#stage input', clear)),
  wave2('search-xs', both('#stage input', clear)),
  wave2('search-empty', both('#stage input')),
  wave2('search-bare', both('#stage input', clear)),
  chip('chip-off'),
  chip('chip-on'),
  chip('chip-sm'),
  chip('chip-suggestion', '#stage button', '#stage button'),
  chip('chip-tag', '#stage [role="group"] > span', '#stage .nish-chip'),
  seg('seg'),
  seg('seg-xs'),
  seg('seg-md'),
  seg('seg-block'),
  wave2('skeleton-text', both('.case')),
  wave2('skeleton-circle', both('.case')),
  // The React spinner is an svg and the nish-* one a bordered ring: these compare the box each takes.
  wave2('spinner', both('.case')),
  wave2('spinner-sm', both('.case')),
  wave2('spinner-lg', both('.case')),
  wave2('empty', both('.case', { title: '.case p', body: '.case p:nth-of-type(2)' })),
  wave2('error-state', both('.case', { title: '.case p' })),
  ...['info', 'accent', 'ok', 'warn', 'loss'].map(callout),
  ...dots.map((d) => wave2(`dot-${d}`, both('.case'))),
  wave2('stat', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('stat-ok', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('stat-inset', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('stat-sm', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('meter', both('.case')),
  wave2('meter-xs', both('.case')),
  wave2('meter-sm', both('.case')),
  wave2('meter-md', both('.case')),
  wave2('disclosure', both('.case', { title: 'summary' })),
  wave2('disclosure-open', both('.case', { title: 'summary', body: '.case > div' })),
  wave2('disclosure-card-open', both('.case', { title: 'summary', body: '.case > div' })),
  ...['tabs', 'tabs-sm', 'tabs-xs', 'tabs-block', 'tabs-pill', 'tabs-pill-sm', 'tabs-pill-xs', 'tabs-pill-block'].map(tabs),
  wave2('combobox', both('#stage input[role="combobox"]', { body: 'button[aria-label="Clear"]' })),
  wave2('combobox-sm', both('#stage input[role="combobox"]', { body: 'button[aria-label="Clear"]' })),
  wave2('combobox-open', both('ul[role="listbox"]', { title: 'li[aria-selected="true"]' }), '&open=1'),
  wave2('combobox-loading', both('ul[role="listbox"]', { title: 'li[role="presentation"]' }), '&open=1'),
  wave2('combobox-empty', both('ul[role="listbox"]', { title: 'li[role="presentation"]' }), '&open=1'),
  listRow('list-row'),
  listRow('list-row-active'),
  listRow('list-row-danger'),
  listRow('list-row-dense', false),
  listRow('list-row-compact'),
  listRow('list-row-title2'),
  listRow('list-row-plain'),
  wave2('kbd', both('.case', { title: '.case' })),
  wave2('page-header', both('.case', { title: 'h1', body: '.case p' })),
  wave2('section-header', {
    react: { box: '.case', title: 'h2', body: '.case span' },
    element: { box: '.case', title: 'h2', body: '.nish-section-header-actions > span' },
  }),
  wave2('kv', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('kv-dense', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('kv-wrap', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('kv-words', both('.case', { title: '.case dt', body: '.case dd' })),
  wave2('legend', both('.case', { title: '.case li' })),
  wave2('legend-dot', both('.case', { title: '.case li' })),
  wave2('sparkline', both('#stage svg', { title: '#stage svg path' })),
  wave2('sparkline-ok', both('#stage svg', { title: '#stage svg path' })),
  // The empty sparkline is one flat dashed line: a path with no height is never "visible" to Playwright, so only the svg is compared.
  wave2('sparkline-empty', both('#stage svg')),
  wave2(
    'app-header',
    {
      react: { box: '.case', title: '.case a:nth-of-type(2)', body: '.case a.nish-pill-link' },
      element: { box: '.case', title: '.nish-app-header-name', body: '.case a.nish-pill-link' },
    },
    '',
    HEADER_PADDING,
  ),
  wave2('app-header-nav', both('.case', { title: 'a[aria-current="page"]' }), '', HEADER_PADDING),
  wave2('copy', {
    react: { box: '#stage button', title: '#stage button' },
    element: { box: 'nish-copy-button button', title: 'nish-copy-button button' },
  }),
  wave2('copy-icon', { react: { box: '#stage button' }, element: { box: 'nish-copy-button button' } }),
  wave2(
    'copy-copied',
    {
      react: { box: '#stage button', title: '#stage button' },
      element: { box: 'nish-copy-button button', title: 'nish-copy-button button' },
    },
    '&copied=1',
  ),
];

// --- Wave 3 ---------------------------------------------------------------------------------
// The same ids in react.tsx's WAVE3 and elements.ts's WAVE3. Tables put className="case" on the wrap.

const T = {
  react: { box: '.case table', title: '.case th', body: '.case td' },
  element: { box: '.case table', title: '.case th', body: '.case td' },
};
const tableRow = (id: string): Case =>
  wave2(id, {
    react: { box: '.case tbody tr:first-child', title: '.case tbody td:first-child', body: '.case tbody td:nth-child(2)' },
    element: { box: '.case tbody tr:first-child', title: '.case tbody td:first-child', body: '.case tbody td:nth-child(2)' },
  });
const settingRowParts = {
  react: { box: '.case > div:nth-child(2) > div:first-child', title: '.case > div:nth-child(2) > div:first-child label', body: '.case > div:nth-child(2) > div:first-child p' },
  element: { box: '.nish-settings-section-body > .nish-setting-row:first-child', title: '.nish-setting-row-label', body: '.nish-setting-row-description' },
};
const settingRow = (id: string): Case => wave2(id, settingRowParts);
const sectionParts = {
  react: { box: '.case', title: '.case h2', body: '.case section > div:first-child p, .case > div:first-child p' },
  element: { box: '.case', title: '.nish-settings-section-title', body: '.nish-settings-section-description' },
};
const mediaRowParts = {
  react: { box: '.case', title: '.case > span.min-w-0 > span:first-child', body: '.case > span.min-w-0 > span:nth-child(2) > span:first-child' },
  element: { box: '.case', title: '.nish-media-row-title', body: '.nish-media-row-meta' },
};
const mediaRow = (id: string): Case => wave2(id, mediaRowParts);
const thumbCase = (id: string): Case => wave2(id, both('.case'));
const chartParts = (title: string, body?: string) => ({
  react: { box: '.case svg[role="img"], #stage svg[role="img"]', title, ...(body ? { body } : {}) },
  element: { box: 'svg[role="img"]', title, ...(body ? { body } : {}) },
});

/** Hover the middle of the chart, where both versions show their tooltip or readout. */
async function hoverChart(page: Page): Promise<void> {
  await page.locator('svg[role="img"]').first().hover();
}

const WAVE3_CASES: Case[] = [
  wave2('table', T),
  wave2('table-dense', T),
  // Tailwind mixes the stripe in oklab and the nish-* class in srgb: the same tint, written two ways (data.spec.ts checks
  // that only a zebra table is striped).
  wave2(
    'table-zebra',
    {
      react: { box: '.case tbody tr:nth-child(even)', title: '.case tbody tr:nth-child(even) td' },
      element: { box: '.case tbody tr:nth-child(even)', title: '.case tbody tr:nth-child(even) td' },
    },
    '',
    ['box.backgroundColor'],
  ),
  // The sort cell: the header with its button and arrows.
  // A header cell is transparent in React and filled with the surface in .nish-th (the wrap is that surface): same look.
  { ...wave2('table', both('.case th:nth-child(3)', { title: '.case th:nth-child(3) button' }), '', ['box.backgroundColor']), name: 'table sorted header' },
  { ...wave2('table', both('.case th:nth-child(2)', { title: '.case th:nth-child(2)' }), '', ['box.backgroundColor']), name: 'table numeric header' },
  { ...wave2('table', { react: { box: '.case td:nth-child(2)', title: '.case td:nth-child(2)' }, element: { box: '.case td:nth-child(2)', title: '.case td:nth-child(2)' } }), name: 'table numeric cell' },
  tableRow('table-tr-muted'),
  tableRow('table-tr-interactive'),
  tableRow('table-tr-ok'),
  tableRow('table-tr-warn'),
  tableRow('table-tr-loss'),
  wave2('table-wrap-sticky-first', both('.case', { title: '.case tbody td:first-child' })),
  wave2('table-wrap-sticky-header', both('.case', { title: '.case thead th' })),
  wave2('filter-bar', {
    react: { box: '.case', title: '.case input[type="search"]', body: '.case [aria-live="polite"]' },
    element: { box: 'nish-filter-bar .nish-filter-bar', title: 'nish-filter-bar input[type="search"]', body: '.nish-filter-bar-summary' },
  }),
  // Phone: the Filters button with its count. Desktop: the Clear filters button.
  { ...wave2('filter-bar', { react: { box: 'button[aria-haspopup="dialog"]', title: 'button[aria-haspopup="dialog"]' }, element: { box: '.nish-filter-btn', title: '.nish-filter-btn' } }), name: 'filter bar button', sizes: ['360'] },
  { ...wave2('filter-bar', { react: { box: '.case > div:first-child > button:not([aria-haspopup])', title: '.case > div:first-child > button:not([aria-haspopup])' }, element: { box: '.nish-filter-bar-clear', title: '.nish-filter-bar-clear' } }), name: 'filter bar clear', sizes: ['1440'] },
  thumbCase('media-thumb'),
  thumbCase('media-thumb-sm'),
  thumbCase('media-thumb-round'),
  thumbCase('media-thumb-round-sm'),
  thumbCase('media-thumb-square'),
  mediaRow('media-row'),
  mediaRow('media-row-live'),
  mediaRow('media-row-offline'),
  mediaRow('media-row-dense'),
  mediaRow('media-row-compact'),
  mediaRow('media-row-round'),
  // The element draws the Live badge from ::before on .nish-media-row-badges, so only the size of the badge is comparable.
  {
    ...wave2('media-row-live', { react: { box: '.case span.flex-col > span:first-child' }, element: { box: '.nish-media-row-badges' } }, '', [
      'box.backgroundColor',
      'box.borderColor',
      'box.borderRadius',
      'box.color',
      'box.fontSize',
      'box.paddingTop',
      'box.paddingRight',
      'box.paddingBottom',
      'box.paddingLeft',
    ]),
    name: 'media row live badge',
  },
  wave2('media-chip', both('.case', { title: '.case > span:nth-child(2)', body: '.case > span:nth-child(3)' })),
  wave2('media-chip-plain', both('.case', { title: '.case > span:nth-child(2)' })),
  // SplitStage draws absolute panes and the element flex panes: the pane boxes and the divider must agree.
  {
    ...wave2('split-row', { react: { box: '[data-split-pane="a"]' }, element: { box: 'nish-split > .nish-split-pane:first-child' } }),
    run: ['1440'],
  },
  {
    ...wave2('split-row', { react: { box: '[data-split-pane="b"]' }, element: { box: 'nish-split > .nish-split-pane:last-child' } }),
    name: 'split second pane',
    run: ['1440'],
  },
  // React's divider is a 24px hit area with a 4px accent bar inside; .nish-split-divider is the 4px gap itself with the
  // hit area drawn past it, so its own width and its offset from the pane are not compared (its height is).
  {
    ...wave2('split-row', { react: { box: '[role="separator"]' }, element: { box: '[role="separator"]' } }, '', ['box.width', 'box.borderRadius']),
    name: 'split divider',
    run: ['1440'],
  },
  {
    ...wave2('nav-rail', { react: { box: '.case', title: '.case a[aria-current="page"] span.truncate' }, element: { box: '.case', title: '.case a[aria-current="page"] > span' } }),
    sizes: ['1440'],
  },
  {
    ...wave2('nav-rail', { react: { box: '.case a[aria-current="page"]' }, element: { box: '.case a[aria-current="page"]' } }),
    name: 'nav rail item',
    sizes: ['1440'],
  },
  // The default rail shows from 768px and hides from 1024px, in both versions.
  {
    ...wave2('nav-rail-default', { react: { box: '.case', title: '.case a[aria-current="page"] span.truncate' }, element: { box: 'nish-nav-rail nav', title: 'nish-nav-rail nav a[aria-current="page"] > span' } }),
    sizes: ['840'],
    run: ['360', '840', '1440'],
  },
  wave2('scroll-row', {
    react: { box: '.case', title: '.case button[aria-pressed="true"]' },
    element: { box: 'nish-scroll-row .nish-scroll-row', title: 'nish-scroll-row button[aria-pressed="true"]' },
  }),
  // React keeps the gutter on the bleeding row inside the nav and .nish-subnav on the bar itself (a full-width bar
  // outside the padded page): the chips sit in the same place on screen, so the nav's own padding and the chip's offset
  // inside it are not compared. Height is.
  wave2(
    'section-nav',
    {
      react: { box: '.case', title: '.case [aria-current="true"]' },
      element: { box: 'nish-section-nav nav', title: 'nish-section-nav [aria-current="true"]' },
    },
    '',
    ['box.paddingLeft', 'box.paddingRight', 'title.dx'],
  ),
  // MoreSheet opens from the BottomNav, which is hidden from 768px: the phone width is the one it is drawn at (the Drawer
  // docks full width there; the element sheet is a centered modal on a desktop).
  { ...wave2('more-sheet', {
    react: { box: '[role="dialog"] li:first-child > a', title: '[role="dialog"] li:first-child span.font-medium', body: '[role="dialog"] li:first-child span.text-xs' },
    element: { box: 'dialog.nish-sheet li:first-child > a', title: 'li:first-child .nish-list-title', body: 'li:first-child .nish-list-subtitle' },
  }), run: ['360'] },
  { ...wave2('more-sheet', { react: { box: '[role="dialog"] li:nth-child(2) > a', title: '[role="dialog"] li:nth-child(2) span.font-medium' }, element: { box: 'dialog.nish-sheet li:nth-child(2) > a', title: 'li:nth-child(2) .nish-list-title' } }), name: 'more sheet current row', run: ['360'] },
  wave2('settings-section', sectionParts),
  wave2('settings-section-compact', sectionParts),
  { ...settingRow('settings-section'), name: 'settings section row' },
  { ...settingRow('settings-section-compact'), name: 'settings section compact row' },
  settingRow('setting-row-stacked'),
  settingRow('setting-row-inline'),
  { ...wave2('setting-row-status', { react: { box: '.case [role="status"]', title: '.case [role="status"]' }, element: { box: '.nish-setting-row-status', title: '.nish-setting-row-status' } }), name: 'setting row status ok' },
  { ...wave2('setting-row-error', { react: { box: '.case [role="status"]', title: '.case [role="status"]' }, element: { box: '.nish-setting-row-status', title: '.nish-setting-row-status' } }), name: 'setting row status error' },
  wave2('command', {
    react: { box: '[role="dialog"]', title: '[role="option"][aria-selected="true"]', body: '[role="group"] > div:first-child' },
    element: { box: 'dialog[open]', title: '[role="option"][aria-selected="true"]', body: '[role="group"] > div:first-child' },
  }),
  wave2('line-chart', chartParts('svg text')),
  wave2('line-chart-area', chartParts('svg text')),
  // React draws no legend (the app adds a ChartLegend); the element's own is covered by data.spec.ts.
  wave2('line-chart-multi', chartParts('svg text')),
  wave2('bar-chart', chartParts('svg text')),
  wave2('bar-chart-values', { react: { box: '.case svg[role="img"], #stage svg[role="img"]' }, element: { box: 'svg[role="img"]' } }),
  wave2('range-bar', {
    react: { box: '.case', title: '.case > div', body: '.case > span' },
    element: { box: '.case', title: '.nish-range-bar-fill', body: '.nish-range-bar-current' },
  }),
  // --- Follow-ups: more nodes of the wave 3 classes, and the states that need a pointer ---
  {
    ...wave2('filter-bar', {
      react: { box: '.case [role="group"] button[aria-pressed="true"]', title: '.case [role="group"] button[aria-pressed="true"]' },
      element: { box: '.nish-filter-bar-chips .nish-chip[aria-pressed="true"]', title: '.nish-filter-bar-chips .nish-chip[aria-pressed="true"]' },
    }),
    name: 'filter bar chip',
    sizes: ['1440'],
  },
  // Desktop only: on a phone React gives the trailing select a full row (w-full, no ms-auto wrapper) and the element keeps it at its own width.
  { ...wave2('filter-bar', { react: { box: '.case select[aria-label="View"]' }, element: { box: '.nish-filter-bar-trailing select' } }), name: 'filter bar trailing', run: ['1440'] },
  {
    ...wave2('media-row', { react: { box: '.case', body: '.case > span.min-w-0 > span:nth-child(2) > span:nth-child(2)' }, element: { box: '.case', body: '.nish-media-row-detail' } }),
    name: 'media row detail',
  },
  { ...wave2('split-column', { react: { box: '[data-split-pane="a"]' }, element: { box: 'nish-split > .nish-split-pane:first-child' } }), name: 'split column first pane', run: ['1440'] },
  // The mirror of 'split divider': React's separator is a 24px hit area and .nish-split-divider the 4px gap, so the length
  // across the split (the height here) is not compared.
  {
    ...wave2('split-column', { react: { box: '[role="separator"]' }, element: { box: '[role="separator"]' } }, '', ['box.height', 'box.borderRadius']),
    name: 'split column divider',
    run: ['1440'],
  },
  {
    ...wave2('nav-rail-tools', {
      react: { box: '.case a[href="/search"]', title: '.case a[href="/search"] span.truncate' },
      element: { box: '.nish-nav-rail-tools .nish-nav-rail-item', title: '.nish-nav-rail-tools .nish-nav-rail-item > span' },
    }),
    name: 'nav rail tools item',
    sizes: ['1440'],
  },
  {
    ...wave2('nav-rail-tools', { react: { box: '.case button[aria-label^="Theme"]' }, element: { box: '.nish-nav-rail-footer button.nish-theme-btn' } }),
    name: 'nav rail footer',
    sizes: ['1440'],
  },
  wave2('scroll-row-bleed', {
    react: { box: '.case', title: '.case button[aria-pressed="true"]' },
    element: { box: 'nish-scroll-row .nish-scroll-row', title: 'nish-scroll-row button[aria-pressed="true"]' },
  }),
  { ...wave2('settings-section', { react: { box: '.case > div:first-child button' }, element: { box: '.nish-settings-section-actions .nish-btn' } }), name: 'settings section actions' },
  {
    ...wave2('command', {
      react: { box: '[role="option"][aria-selected="true"] > span:nth-child(2)' },
      element: { box: '[role="option"][aria-selected="true"] .nish-command-item-hint' },
    }),
    name: 'command item hint',
  },
  {
    ...wave2('command', { react: { box: '[role="dialog"] [role="status"]' }, element: { box: '.nish-command-empty' } }),
    name: 'command empty',
    setup: async (page) => {
      await page.locator('input[role="combobox"]').fill('zzzz');
    },
  },
  {
    ...wave2('line-chart', { react: { box: '#stage div.pointer-events-none.absolute' }, element: { box: '.nish-chart-tooltip' } }),
    name: 'line chart tooltip',
    setup: hoverChart,
  },
  // A bar chart has no floating tooltip: it prints "label: value" under the chart, and that readout is what hover changes.
  {
    ...wave2('bar-chart', { react: { box: '#stage [aria-live="polite"]' }, element: { box: '#stage [aria-live="polite"]' } }),
    name: 'bar chart readout',
    setup: async (page) => {
      await hoverChart(page);
      await expect(page.locator('#stage [aria-live="polite"]')).not.toHaveText('');
    },
  },
  // While a divider is dragged its bar shows in the accent color: the separator itself in the element, the 4px span inside
  // the 24px hit area in React. Only that fill is compared.
  {
    ...wave2('split-row', { react: { box: '[role="separator"] > span' }, element: { box: '[role="separator"]' } }, '', [
      'box.width',
      'box.height',
      'box.borderColor',
      'box.borderRadius',
      'box.color',
      'box.fontSize',
      'box.paddingTop',
      'box.paddingRight',
      'box.paddingBottom',
      'box.paddingLeft',
    ]),
    name: 'split divider dragging',
    run: ['1440'],
    setup: async (page) => {
      const box = await page.locator('[role="separator"]').boundingBox();
      if (!box) throw new Error('no separator to drag');
      // React's bar is always accent-coloured and only fades in (opacity), so the colour compare alone cannot see the
      // drag state. Pin it on both sides: hidden before the press, shown during it.
      const reactBar = page.locator('[role="separator"] > span');
      const isReact = (await reactBar.count()) > 0;
      const elementSep = page.locator('[role="separator"]');
      if (isReact) await expect(reactBar).toHaveCSS('opacity', '0');
      else await expect(elementSep).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // The fill fades in over 150ms: wait for every transition on the page to end.
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
      if (isReact) await expect(reactBar).toHaveCSS('opacity', '1');
      else await expect(elementSep).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    },
  },
];

/** Differences that cannot be closed yet: real gaps between the nish-* CSS and the React twin, each with
 *  its exact values (`prop element vs react`, numbers rounded to whole px). A case must show exactly
 *  this set at that size and scheme: a difference that is not listed fails, and a listed one that no
 *  longer shows up fails too, so a gap cannot linger after it is closed. Empty: the nish-* CSS matches
 *  React, and a new difference is fixed in the CSS. */
type SizeName = (typeof SIZES)[number]['name'];
type Scheme = (typeof SCHEMES)[number];
type Gaps = (size: SizeName, scheme: Scheme) => string[];

const KNOWN_GAPS: Record<string, Gaps> = {};

interface Measured {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  color: string;
  fontSize: string;
  /** Where the node's first line of text starts, inside the box. */
  dx: number;
  dy: number;
}

const BOX_PROPS = ['backgroundColor', 'borderColor', 'borderRadius', 'color', 'fontSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const;
const TEXT_PROPS = ['color', 'fontSize'] as const;

async function measure(page: Page, loc: Locator, boxSel: string): Promise<Measured> {
  await expect(loc.first()).toBeVisible();
  return loc.first().evaluate((el, sel) => {
    // Where the first line of text starts inside the box (the node itself when it has no text).
    const offset = (node: Element, box: DOMRect) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      let t = walker.nextNode();
      while (t && !t.textContent?.trim()) t = walker.nextNode();
      let rect = node.getBoundingClientRect();
      if (t) {
        const range = document.createRange();
        range.selectNodeContents(t);
        rect = range.getBoundingClientRect();
      }
      return { dx: rect.left - box.left, dy: rect.top - box.top };
    };
    const r = el.getBoundingClientRect();
    const b = (document.querySelector(sel) as Element).getBoundingClientRect();
    const cs = getComputedStyle(el);
    // rounded-full is 3.4e7px and --nish-radius-pill is 999px: both are a pill. Cap at half the box.
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius), Math.min(r.width, r.height) / 2);
    return {
      width: r.width,
      height: r.height,
      backgroundColor: cs.backgroundColor,
      // A node without a border has no border color to compare (it computes to currentColor).
      borderColor: parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : 'none',
      borderRadius: `${radius}px`,
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      color: cs.color,
      fontSize: cs.fontSize,
      ...offset(el, b),
    };
  }, boxSel);
}

async function open(page: Page, file: string, query: string): Promise<void> {
  await page.goto(`${BASE}/${file}?${query}`);
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached', timeout: 15_000 });
  // The React toast shows a plain fallback card until its chunk loads; measure the full card.
  if (file === 'react.html' && query.startsWith('c=toast')) await page.locator('[data-nish-toast-fallback]').waitFor({ state: 'detached', timeout: 15_000 });
}

async function parts(page: Page, p: Part, setup?: Case['setup']): Promise<Record<string, Measured>> {
  if (setup) await setup(page);
  const out: Record<string, Measured> = { box: await measure(page, page.locator(p.box), p.box) };
  if (p.title) out.title = await measure(page, page.locator(p.title), p.box);
  if (p.body) out.body = await measure(page, page.locator(p.body), p.box);
  return out;
}

const px = (n: number): number => Math.round(n);

function compare(react: Record<string, Measured>, el: Record<string, Measured>): string[] {
  const diffs: string[] = [];
  const box = { r: react.box, e: el.box };
  if (Math.abs(box.e.width - box.r.width) > 1) diffs.push(`box.width ${px(box.e.width)} vs ${px(box.r.width)}`);
  if (Math.abs(box.e.height - box.r.height) > 1) diffs.push(`box.height ${px(box.e.height)} vs ${px(box.r.height)}`);
  for (const prop of BOX_PROPS) {
    if (box.e[prop] !== box.r[prop]) diffs.push(`box.${prop} ${box.e[prop]} vs ${box.r[prop]}`);
  }
  for (const key of ['title', 'body']) {
    if (!react[key]) continue;
    for (const prop of TEXT_PROPS) {
      if (el[key][prop] !== react[key][prop]) diffs.push(`${key}.${prop} ${el[key][prop]} vs ${react[key][prop]}`);
    }
    for (const prop of ['dx', 'dy'] as const) {
      if (Math.abs(el[key][prop] - react[key][prop]) > 1) diffs.push(`${key}.${prop} ${px(el[key][prop])} vs ${px(react[key][prop])}`);
    }
  }
  return diffs;
}

/** "title.dx 47 vs 44" -> ["title.dx", 47, 44]; null for a non-numeric diff (a color, a padding string). */
function numericGap(d: string): [string, number, number] | null {
  const m = /^(\S+) (-?\d+(?:\.\d+)?) vs (-?\d+(?:\.\d+)?)$/.exec(d);
  return m ? [m[1]!, Number(m[2]), Number(m[3])] : null;
}

/** Each measured diff, written as its listed gap when a numeric gap lands within 1px of it (text metrics
 *  differ by a pixel between the Windows and Linux fonts, the same "within 1px" the box check allows). */
function matchKnown(diffs: string[], known: string[]): string[] {
  return diffs.map((d) => {
    const g = numericGap(d);
    if (!g) return d;
    const hit = known.find((k) => {
      const n = numericGap(k);
      return n && n[0] === g[0] && Math.abs(n[1] - g[1]) <= 1 && Math.abs(n[2] - g[2]) <= 1;
    });
    return hit ?? d;
  });
}

for (const c of [...CASES, ...WAVE2_CASES, ...WAVE3_CASES]) {
  for (const size of SIZES.filter((z) => (c.run ?? DEFAULT_RUN).includes(z.name))) {
    for (const scheme of SCHEMES) {
      test(`${c.name} matches React at ${size.name}px, ${scheme}`, async ({ browser }) => {
        const ctx = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          colorScheme: scheme,
          reducedMotion: 'reduce',
          hasTouch: size.width < 700,
        });
        const page = await ctx.newPage();
        try {
          if (c.sizes && !c.sizes.includes(size.name)) {
            // Hidden from 768px in both versions.
            await open(page, 'react.html', c.query);
            await expect(page.locator(c.react.box)).toBeHidden();
            await open(page, 'index.html', c.query);
            await expect(page.locator(c.element.box)).toBeHidden();
            return;
          }
          await open(page, 'react.html', c.query);
          const react = await parts(page, c.react, c.setup);
          await open(page, 'index.html', c.query);
          const el = await parts(page, c.element, c.setup);

          const diffs = compare(react, el).filter((d) => !c.ignore?.includes(d.split(' ')[0]!));
          if (process.env.PARITY_VERBOSE) console.log(`DIFF ${c.name} ${size.name} ${scheme}\n  ${diffs.join('\n  ')}`);
          // Exactly the listed gaps: a new difference fails, and so does a listed gap that is gone.
          const known = KNOWN_GAPS[c.name]?.(size.name, scheme) ?? [];
          expect(matchKnown(diffs, known).sort(), 'the element version differs from the React one (or a known gap closed: delete it)').toEqual(known.slice().sort());
        } finally {
          await ctx.close();
        }
      });
    }
  }
}
