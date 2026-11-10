// The docs search index: what the header's command palette searches. Pages, components and
// page section headings come straight away; prop names (from docgen), token names and static
// class names load on first open, so the shell chunk does not carry them.
import type { CommandItem } from '../../src';
import { DOCS } from './docs';
import { href } from './router';

export interface SearchPage {
  path: string;
  label: string;
}

/** Headings of the sections on each foundation page. They are not routes, so a hit opens the page. */
const SECTIONS: { path: string; page: string; headings: string[] }[] = [
  { path: '/overview', page: 'Overview', headings: ['What is in it', 'Where it works', 'Getting started in four steps', 'Seven themes, one set of components'] },
  {
    path: '/getting-started',
    page: 'Getting started',
    headings: [
      'Install',
      '1. Import the CSS',
      '2. Apply the theme before first paint',
      '3. Start the theme and mount the toaster',
      '4. Style with roles',
      '1. Copy the dist files',
      '2. Link them',
      '3. Use the variables',
      '3. Storage and the window chrome',
      'Languages and right-to-left',
      'Content Security Policy',
      'Testing your app',
      'Troubleshooting',
      'Versioning and support',
    ],
  },
  { path: '/static-sites', page: 'Static sites', headings: ['Vendoring the files', 'Link them', 'Elements', 'Live example', 'Component classes'] },
  { path: '/themes', page: 'Themes', headings: ['The themes', 'Contrast matrix', 'Choosing a theme'] },
  {
    path: '/color',
    page: 'Color',
    headings: ['Surfaces and lines', 'Text', 'Accents', 'Status', 'Fills', 'On colors', 'Scrim and inverted', 'Chart series', 'Hues', 'Using them'],
  },
  { path: '/typography', page: 'Typography', headings: ['Families', 'Scale', 'Weights and tracking', 'Numbers'] },
  { path: '/spacing', page: 'Spacing & radius', headings: ['Space', 'Radius', 'Layout'] },
  { path: '/elevation', page: 'Shadows & motion', headings: ['Shadows', 'Easing and duration'] },
  { path: '/z-index', page: 'Z-index & breakpoints', headings: ['Stacking order', 'Breakpoints'] },
];

const SKIP_PROPS = new Set(['className', 'children']);

const hasDoc = (id: string) => DOCS.some((d) => d.id === id);

/** Where a CSS variable is documented. */
export function tokenPath(name: string): string {
  if (/^--nish-(header-h|bottom-|sticky-extra|page-gutter)/.test(name)) return hasDoc('layout-contract') ? '/components/layout-contract' : '/z-index';
  if (/^--nish-z-/.test(name)) return '/z-index';
  if (/^--nish-(shadow-|ease-|dur-)/.test(name)) return '/elevation';
  if (/^--nish-(text-|font-|leading-|weight-|tracking-)/.test(name)) return '/typography';
  if (/^--nish-(space-|radius-|r-|page-max|gutter|tap-min|focus-)/.test(name)) return '/spacing';
  return '/color';
}

/** Everything that is known without reading any CSS. */
export function baseItems(pages: SearchPage[]): CommandItem[] {
  const items: CommandItem[] = [];
  // Component pages get their own, richer entries below.
  for (const p of pages.filter((x) => !x.path.startsWith('/components/'))) items.push({ id: `page:${p.path}`, label: p.label, group: 'Pages', hint: 'Page', href: href(p.path) });
  for (const d of DOCS) {
    items.push({
      id: `component:${d.id}`,
      label: d.name,
      group: 'Components',
      hint: 'Component',
      keywords: [d.summary, ...d.exports],
      href: href(`/components/${d.id}`),
    });
  }
  for (const s of SECTIONS) {
    for (const h of s.headings) items.push({ id: `section:${s.path}:${h}`, label: h, group: 'Sections', hint: s.page, href: href(s.path) });
  }
  return items;
}

/** Prop names of every documented component, from the docgen data (its own chunk, loaded on demand). */
export async function propItems(): Promise<CommandItem[]> {
  const { default: docgen } = await import('virtual:nish-docgen');
  const items: CommandItem[] = [];
  for (const d of DOCS) {
    const seen = new Set<string>();
    for (const name of d.exports) {
      for (const prop of docgen.components[name]?.props ?? []) {
        if (SKIP_PROPS.has(prop.name) || seen.has(prop.name)) continue;
        seen.add(prop.name);
        items.push({ id: `prop:${d.id}:${prop.name}`, label: prop.name, group: 'Props', hint: d.name, href: href(`/components/${d.id}`) });
      }
    }
  }
  return items;
}

const unique = (xs: Iterable<string>) => [...new Set(xs)].sort();

/** Token names and static class names, read from the built CSS. */
export async function cssItems(): Promise<CommandItem[]> {
  const [tokens, base, components] = await Promise.all([
    import('../../dist/tokens.css?raw'),
    import('../../dist/base.css?raw'),
    import('../../dist/nish-components.css?raw'),
  ]);
  const vars = unique([...(tokens.default + base.default).matchAll(/(--nish-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const classes = unique([...components.default.matchAll(/\.(nish-[a-z0-9-]+)/g)].map((m) => `.${m[1]}`));
  const staticPath = hasDoc('static-parity') ? '/components/static-parity' : '/static-sites';
  return [
    ...vars.map((v): CommandItem => ({ id: `token:${v}`, label: v, group: 'Tokens', hint: 'CSS variable', href: href(tokenPath(v)) })),
    ...classes.map((c): CommandItem => ({ id: `class:${c}`, label: c, group: 'Static classes', hint: 'Static', href: href(staticPath) })),
  ];
}
