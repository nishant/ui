# nish-ui

Design tokens, seven themes, flash-free theme switching and accessible React 19 components,
built for Tailwind 4 and usable from plain CSS and static HTML. Works in Vite, Next.js (App
Router and server components), plain HTML and anything that renders React 19.

**See every component and token live, in every theme: [design.nish.software](https://design.nish.software)**

[![npm](https://img.shields.io/npm/v/nish-ui)](https://www.npmjs.com/package/nish-ui)
[![license](https://img.shields.io/npm/l/nish-ui)](https://github.com/nishant/ui/blob/master/LICENSE)

## Install

```bash
npm install nish-ui
npm install -D tailwindcss @tailwindcss/vite   # for the React + Tailwind path (Next.js: @tailwindcss/postcss)
```

- **ESM only.** Node 20.19 or later. `import` works everywhere; `require('nish-ui')` works on
  Node 20.19+ and 22.12+ (they load ES modules from `require`).
- **React 19** (and react-dom) are optional peers, so a static site or a Node tool that only
  uses the CSS and `nish-ui/theme` never gets React. Tailwind 4 is needed only for
  `nish-ui/tailwind.css`.
- The package ships built files: no install or build step. Types are bundled.

Browser support: the latest two versions of Chrome, Edge, Firefox and Safari (Safari 16.4 or
later). The CSS needs `color-mix()`, `:has()`, the `inert` attribute and container queries.
Older browsers get no polyfills.

## Usage

### React + Tailwind 4 (Vite)

```css
/* src/index.css */
@import 'tailwindcss';
@import 'nish-ui/tailwind.css';
```

```ts
// vite.config.ts: inlines theme-init.js at the top of <head>, so there is no flash of the wrong theme
import { nishThemeInit } from 'nish-ui/vite';
// plugins: [nishThemeInit(), react(), tailwindcss()]
```

```tsx
import { initTheme, ThemeToggle, Toaster, Button, toast } from 'nish-ui';

initTheme(); // once, before render

<ThemeToggle presets />
<Toaster />
<Button variant="primary" onClick={() => toast.success('Saved')}>Save</Button>
```

Style with color roles, never raw palette classes: `bg-th-surface text-th-hi border-th-line`.
They change with the theme. [Getting started](https://design.nish.software/#/getting-started)
covers the full setup, Electron included.

`nish-ui/tailwind.css` scans the package's own components for class names. An app that wants
Tailwind to scan only the modules it uses imports `nish-ui/tailwind-core.css` (same theme, no
`@source` line) and adds its own `@source` lines for `node_modules/nish-ui/dist/esm/components/<module>.js`.

### Next.js (App Router)

Every component module that uses state, effects or browser APIs starts with `"use client"`,
so you import components straight into a server component. `cn`, `buttonClass`, `Card`,
`Badge` and the other pure helpers also work there.

```tsx
// app/layout.tsx
import 'nish-ui/tailwind.css'; // after @import 'tailwindcss' in your global CSS, or import both there
import { NishProvider, Toaster } from 'nish-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: theme-init.js sets data-theme on <html> before React hydrates
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" /> {/* copy node_modules/nish-ui/dist/theme-init.js to public/ */}
      </head>
      <body>
        <NishProvider>
          {children}
          <Toaster />
        </NishProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx: a server component
import { Button, Card, cn } from 'nish-ui';

export default function Page() {
  return (
    <Card className={cn('m-4')}>
      <Button variant="primary">Server-rendered button</Button>
    </Card>
  );
}
```

Plain Tailwind in Next.js is `@import 'tailwindcss'; @import 'nish-ui/tailwind.css';` in
`app/globals.css` with `@tailwindcss/postcss`. Instead of `<script src>` you can inline the file's
contents with `dangerouslySetInnerHTML`; see Content Security Policy below for the hash.

### Server rendering

- Every export renders under `renderToString` in Node without touching `window` or `document`,
  and the first client render equals the server render, so hydration does not warn.
- Overlays (Modal, Drawer, ConfirmDialog, Popover) render nothing on the server and portal into
  `document.body` (or `<NishProvider portalContainer>`) after hydration.
- Put `suppressHydrationWarning` on `<html>`: `theme-init.js` writes `data-theme`,
  `data-scheme` and `style="color-scheme"` before React runs.
- Theme state, the overlay stack and the toast store live on `globalThis`, so every entry
  (`nish-ui`, `nish-ui/theme`, `nish-ui/chart`) and every copy of the package on a page share one.

### Plain CSS and static HTML

Copy the files listed in `dist/files.json` (CSS, `theme-init.js`, `theme.js` and the fonts),
then:

```html
<head>
  <script src="nish/theme-init.js"></script>
  <link rel="stylesheet" href="nish/nish.css">
  <link rel="stylesheet" href="nish/nish-components.css"> <!-- optional: .nish-btn, .nish-card, ... -->
</head>
<body>
  <button id="theme" type="button" class="nish-theme-btn"></button>
  <script type="module">
    import { initTheme, mountThemeToggle } from './nish/theme.js';
    initTheme();
    mountThemeToggle(document.querySelector('#theme'));
  </script>
</body>
```

```css
.panel { background: var(--nish-surface); color: var(--nish-hi2); }
```

The plain CSS is in cascade layers (`nish.base`, `nish.components`), so your own unlayered rules
win without specificity fights. `nish.min.css` and `nish-components.min.css` are the minified
copies. A classic-script build (`theme.global.js`, `window.nishTheme`) covers pages that cannot
use modules. See [Static sites](https://design.nish.software/#/static-sites).

### Without React

`nish-ui/elements` is one self-contained file (about 20 KB gzipped at most) with custom
elements for pages that have no React: `<nish-theme-toggle>`, `<nish-sheet>`,
`<nish-dialog>`, `<nish-bottom-nav>` and `toast()`. They work in plain HTML, any framework
and Claude artifacts. They use the same `nish-*` classes as above, so link the stylesheets too.

```html
<script src="https://cdn.jsdelivr.net/npm/nish-ui@2/dist/theme-init.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@2/dist/nish.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@2/dist/nish-components.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@2/dist/elements.js"></script>

<nish-theme-toggle pill></nish-theme-toggle>
```

With a bundler: `import 'nish-ui/elements';` and `import { toast } from 'nish-ui/elements';`.
Pin an exact version (`nish-ui@2.0.0`) in production.

Each entry file is self-contained, so load only the ones whose tags the page uses:

- `elements.js` (`nish-ui/elements`): `<nish-theme-toggle>`, `<nish-sheet>`, `<nish-dialog>`,
  `<nish-bottom-nav>` and `toast()`.
- `elements-forms.js` (`nish-ui/elements/forms`): `<nish-field>`, `<nish-search>`,
  `<nish-switch>`, `<nish-chip-group>`, `<nish-combobox>`, `<nish-tabs>`, `<nish-segmented>`,
  `<nish-copy-button>` and `<nish-sparkline>`.
- `elements-data.js` (`nish-ui/elements/data`): `<nish-table-sort>`, `<nish-filter-bar>`,
  `<nish-split>`, `<nish-nav-rail>`, `<nish-scroll-row>`, `<nish-section-nav>` and
  `<nish-command-palette>`.
- `elements-charts.js` (`nish-ui/elements/charts`): `<nish-line-chart>` and `<nish-bar-chart>`.
- `elements-all.js` (`nish-ui/elements/all`): all four in one file with one copy of Lit, for a
  page that uses elements from several of them.

Words the elements print come from `configureStrings({ ... })`, exported by every entry.
Most component pages on the docs site have an HTML tab with the markup, running live. More in
[Static sites](https://design.nish.software/#/static-sites).

## Theming

Seven themes: `dark` (the default), `light`, and the presets `slate`, `terminal`, `mocha`,
`ocean` and `contrast`. Each preset is dark or light, so a page limited to those two shows
the one it is based on.

- **Before first paint.** `theme-init.js` puts the saved theme on `<html>` before anything
  renders, then the page follows the OS when the choice is `system`.
- **Across subdomains.** The choice is saved to `localStorage` and, on the domain named by
  `<html data-nish-domain="example.com">`, to a cookie on that domain, so picking Mocha on one
  app opens its sibling apps in Mocha too. `data-nish-storage-key="x"` renames the key.
- **Scoped.** `<div data-theme="light" data-scheme="light">` themes one subtree.
- **Your own themes.** `registerThemes({ rose: 'dark' })` plus `[data-theme='rose']` CSS.
- **Canvas and charts.** `readToken('chart-1')` and `onThemeChange()`, or `nish-ui/chart`.
- **Tokens as data.** `nish-ui/tokens`, `nish-ui/tokens.json` and the W3C Design Tokens file
  `nish-ui/tokens.dtcg.json`.

Every role and its value in each theme: [Color](https://design.nish.software/#/color) and
[Themes](https://design.nish.software/#/themes). Every theme function:
[Theming API](https://design.nish.software/#/theming-api).

## Content Security Policy

`theme-init.js` is the only inline script the package asks for. Allow it with a hash, or with a
nonce:

- Hash: `nish-ui/theme-init.sha256` holds `sha256-...` for the shipped `theme-init.js`. Put it
  in `script-src 'sha256-...'` when you inline the file exactly as shipped. The hash is also in
  `dist/files.json` as `themeInitHash`.
  `theme-init.sha256` covers only the file as shipped. The Vite plugin changes the script (comments
  removed, optional prelude and legacyKey code), so for Vite use the plugin's `hash` property
  (`nishThemeInit().hash`) instead.
- Nonce: `nishThemeInit({ nonce: '__NISH_CSP_NONCE__' })` in `nish-ui/vite` writes that placeholder
  into the injected tag at build time; have your server replace it with a fresh random value on every
  response. Vite runs the transform once per build, so a fixed real nonce (or a function) is baked into
  the file and gives no protection outside the dev server. In other setups give your own
  `<script nonce>` the file's contents.
- The components set no inline styles that need `style-src 'unsafe-inline'` beyond CSS custom
  properties on elements, and build their DOM without `innerHTML`, so a Trusted Types policy
  (`require-trusted-types-for 'script'`) passes.
- Fonts are served from the package (`nish-ui/fonts/*`), and Favicon makes no third-party
  request unless you configure one.

## Languages and right-to-left

```tsx
import { NishProvider } from 'nish-ui';

<NishProvider locale="de-DE" dir="ltr" strings={{ close: 'Schließen', cancel: 'Abbrechen', search: 'Suchen' }}>
  <App />
</NishProvider>
```

- `strings` replaces any of the English defaults (`DEFAULT_STRINGS` lists every key with the
  components that use it); a prop on one component still wins. Providers nest.
- `locale` feeds `RelativeTime` and chart axes. `setDefaultLocale('de-DE')` from `nish-ui/format`
  sets it for the formatters outside React (default `en-US`, so output is unchanged until you ask).
- Layout uses logical properties and arrow keys mirror when the element's computed `direction`
  is `rtl`. Set `dir="rtl"` on `<html>` (or any ancestor) and everything follows.

## Testing your app

- **Vitest** (recommended): works as is. Use the `happy-dom` or `jsdom` environment.
- **Jest** does not load ES modules from `node_modules` by default. Either run it with
  `--experimental-vm-modules`, or add `transformIgnorePatterns: ['/node_modules/(?!nish-ui)']`
  with a transform for `.js` files (babel-jest or `@swc/jest`).
- No setup is needed for `matchMedia`, `ResizeObserver` or storage; the components guard their use.
- Overlays portal to `document.body`; query with `screen`, not `container`.

## What's in it

More than 100 components, each with live stories, props and guidelines on the
[docs site](https://design.nish.software/#/components):

- **Actions and inputs:** Button, IconButton, Input, Textarea, Select, Combobox, DatePicker,
  Calendar, MultiSelect, Checkbox, Switch, RadioGroup, Slider, TagInput, FileDropzone,
  NumberField, Segmented, Chip, SearchInput, Field, FieldGroup, Label
- **Feedback:** Toast, Callout, Spinner, Skeleton, Progress, EmptyState, ErrorState, StatusDot,
  Meter, LoadingBar, ConnectionBanner, AppErrorBoundary
- **Overlays:** Modal, Drawer, ConfirmDialog, Popover, DropdownMenu, ContextMenu, Tooltip, HoverCard,
  CommandPalette, Portal
- **Settings:** SettingsSection, SettingRow, ServiceTokensSection (list and revoke service
  tokens)
- **Layout and navigation:** AppShell (bottom bar, rail and a collapsible sidebar), AppHeader,
  BottomNav, NavRail, MoreSheet, SectionNav, Tabs, Pagination, Breadcrumbs, Accordion,
  Disclosure, PageHeader, PageContainer, SectionHeader, Card, Separator, StickyBar,
  StickyActionBar, ScrollRow, Carousel
- **Data and display:** Table, ResponsiveTable, VirtualList, VirtualTable, TreeView, FilterBar, Stat, Badge, Avatar, AvatarGroup,
  Kbd, KeyValueList, ListRow, LinkCard, Favicon, RelativeTime, CopyButton, LineChart, BarChart,
  Sparkline, ChartLegend, RangeBar, MediaRow, ActivityFeed, Inbox, VisuallyHidden
- **Flow and canvas:** SplitStage, WorkflowBoard, StepBar, FlowSteps, AgentNode, AnimatedList,
  TickerText, SystemCanvas
- **Runtime:** NishProvider (strings, locale, direction, portal container), hooks such as
  `useMediaQuery`, `useLocalStorage`, `useUrlState` and `useResource`

Entry points:

| Import | What |
|---|---|
| `nish-ui` | React components, hooks, theme functions |
| `nish-ui/tailwind.css` | Tailwind 4 theme, base styles, component scan |
| `nish-ui/tailwind-core.css` | The same without the component scan |
| `nish-ui/nish.css` | The theme and base styles without Tailwind |
| `nish-ui/nish-components.css` | `.nish-btn`, `.nish-card` and the other classes |
| `nish-ui/theme` | Theme switching and static-page helpers, React-free |
| `nish-ui/format` | Money, percent, date formatters (locale-aware) |
| `nish-ui/chart` | Chart colors for any library |
| `nish-ui/tokens` | Token data for Node and build tools |
| `nish-ui/tokens.json` | The same as JSON, and `tokens.dtcg.json` for design tools |
| `nish-ui/system-canvas` | The node-and-edge canvas component (fleet-only) |
| `nish-ui/inbox` | The inbox list (fleet-only) |
| `nish-ui/service-tokens` | Service token settings (fleet-only) |
| `nish-ui/split-layout` | Split-pane layout math, React-free |
| `nish-ui/elements` | Custom elements; also `/forms`, `/data`, `/charts`, `/all` |
| `nish-ui/vite` | The theme-init Vite plugin |
| `nish-ui/eslint` | Lint rules for theme classes |

Also `nish-ui/theme-init.js` and `theme-init.sha256`, `nish-ui/theme.global.js`,
`nish-ui/fonts/*`, `nish-ui/tsconfig/*` (strict presets), the `nish-th-check` CLI, and
`nish-ui/server`, `nish-ui/server/hono` and `nish-ui/inbox-client` (a login, session and inbox
kit for Hono servers; other projects can ignore it).
Details: [Vite plugin and lint](https://design.nish.software/#/components/vite-plugin).

## Fleet-only APIs

`Inbox`, `ServiceTokensSection`, `useServiceTokens`, `SystemCanvas` and the server kit
(`nish-ui/server`, `nish-ui/server/hono`, `nish-ui/inbox-client`) are built for the nish.software apps. They
can change in a minor release; patches only fix. Import them from their own entry points
(`nish-ui/inbox`, `nish-ui/service-tokens`, `nish-ui/system-canvas`); the root entry keeps them through 2.x.
Everything else follows semver.

## Bundle size

Measured with esbuild (minified, React external) from `dist/esm` on every pull request by
`npm run size`, which fails the build when a budget is passed:

| Import | Gzip |
|---|---|
| `cn` | under 10 KB |
| `Button` | under 11 KB |
| `useMediaQuery` | under 1.5 KB |
| `nish-ui/theme` | under 12 KB |
| `nish-ui/format` | under 4 KB |

The JavaScript is one file per source module with `/* @__PURE__ */` annotations and a
`sideEffects` list, so an import costs what it uses. The budgets are in
`tools/size-budgets.json`; the whole package is checked against a 2.5 MB tarball limit.

## Accessibility

- Every theme passes WCAG contrast (4.5:1 text, 3:1 graphics and form-control borders), checked
  in CI and shown as a matrix on [Themes](https://design.nish.software/#/themes).
- Controls grow to 44px tap targets on touch screens and stay compact under a mouse.
- Visible focus rings, focus traps in dialogs, live regions for toasts and loading states,
  forced-colors (Windows High Contrast) rules and reduced motion respected everywhere.
- Tooltip follows WCAG 1.4.13: it opens on focus and hover, closes with Escape and can be
  hovered, with no extra Tab stop.

## What CI checks

Every pull request runs: typecheck, lint, the WCAG contrast check over every theme, the unit
tests (Vitest, in a DOM and in plain Node with no DOM, including server rendering of every
export and two copies of the package on one page), Playwright specs for overlays, custom
elements, hydration, Content Security Policy and Trusted Types, an axe accessibility scan with
zero serious or critical findings, a consumer build in Next.js (App Router), Vite and a
TypeScript matrix (5.4, 5.9 and 6.0 with `bundler` and `node16` resolution), the bundle size
budgets, a screenshot check of the docs site at 360, 840 and 1440 px in light and dark, and an
exports snapshot that fails when a public name or `.nish-*` class disappears. Releases publish to
npm with provenance. The docs site is checked at 360, 840 and 1440 px; not every component is
checked in every theme on every pull request.

## Links

- Docs and live components: [design.nish.software](https://design.nish.software)
- Changelog: [CHANGELOG.md](https://github.com/nishant/ui/blob/master/CHANGELOG.md)
- Moving from 1.x: [docs/MIGRATING-2.0.md](https://github.com/nishant/ui/blob/master/docs/MIGRATING-2.0.md)
- Contributing: [CONTRIBUTING.md](https://github.com/nishant/ui/blob/master/CONTRIBUTING.md)
- Security: [SECURITY.md](https://github.com/nishant/ui/blob/master/SECURITY.md)
- Working on this repo: [docs/DEVELOPING.md](https://github.com/nishant/ui/blob/master/docs/DEVELOPING.md)
- Releasing: [docs/RELEASING.md](https://github.com/nishant/ui/blob/master/docs/RELEASING.md)
- Troubleshooting and versioning: [Getting started](https://design.nish.software/#/getting-started)
- Issues: [github.com/nishant/ui/issues](https://github.com/nishant/ui/issues)

MIT licensed.
