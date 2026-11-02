import { expect, test, type Locator, type Page } from '@playwright/test';

// Parity: the same component rendered by the React twin (react.html) and by the element or
// nish-* class markup (index.html) must look the same. For each wave 1 component and state
// (theme toggle; sheet open; dialog open; toast in each tone; bottom nav with an active item) and
// each wave 2 class and element in each state that changes its look (WAVE2_CASES: fields, switch,
// chip, tabs in every variant, open combobox, list rows, callouts, dots, ...), at 360x780 and
// 1440x900, in light and dark:
//   - the main box has the same width and height (within 1px);
//   - the box has equal background-color, border-color (when it has a border), border-radius
//     and padding;
//   - its title or body has equal color and font-size, and its text starts at the same offset
//     inside the box (the visible padding: React draws it with wrapper divs and the nish-* classes
//     with padding on the title, so the computed padding of those nodes is not comparable).
// The box's own color and font-size are not compared: a React box inherits them and its text
// nodes set them, which the title and body checks cover.
// The test fails when the element version drifts from the React one. KNOWN_GAPS is the mechanism for
// a difference that cannot be closed yet (exact values, "prop element vs react"); it is empty: a new
// difference is fixed in the CSS, never listed. Run with PARITY_VERBOSE=1 to print every difference
// with its values.

const BASE = 'http://localhost:5194';
const SIZES = [
  { name: '360', width: 360, height: 780 },
  { name: '1440', width: 1440, height: 900 },
] as const;
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
    react: { box: '[role="dialog"]', title: '[role="dialog"] h2', body: '[role="dialog"] .text-th-hi2' },
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

const BOX_PROPS = ['backgroundColor', 'borderColor', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const;
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
}

async function parts(page: Page, p: Part): Promise<Record<string, Measured>> {
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

for (const c of [...CASES, ...WAVE2_CASES]) {
  for (const size of SIZES) {
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
          const react = await parts(page, c.react);
          await open(page, 'index.html', c.query);
          const el = await parts(page, c.element);

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
