# @nish/ui

The shared theme for every `*.nish.software` app and site: design tokens, seven themes,
theme switching that follows one choice across subdomains, and the small React
components every app ended up writing for itself.

Docs, live components in every theme, and the contrast matrix: **https://design.nish.software**

Used by:

| App | How it installs | Stack |
|---|---|---|
| nish.software (the hub) | codeload tarball | Vite + plain TypeScript and plain CSS (no React, no Tailwind): `nish.css`, `theme.js` |
| jobs.nish.software | codeload tarball | React + Tailwind 4 |
| trading.nish.software | codeload tarball | React + Tailwind 4, pnpm |
| Nishboard (desktop) | codeload tarball | Electron + React + Tailwind 4, pnpm |
| status.nish.software | codeload tarball | React + Tailwind 4 |
| trackers.nish.software | codeload tarball | React + Tailwind 4 |
| start.nish.software (repo nishant.github.io) | codeload tarball | Angular 16 + Angular Material, themed through the `--nish-*` roles (CSS consumer) |
| minecraft, trips and design (nishant/hosting) | vendored dist files | static HTML |
| taarora/arora-home | vendored dist files with a palette pass | another account's repo, outside the fan-out |

Every npm app pins the codeload tarball (`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX.Y.Z"`), which needs only HTTPS. The fan-out writes that form. The list of repos is `fleet.yaml` in nishant/hosting.

## Install

Releases are git tags whose commit includes the built `dist/`, so installs need no build
step.

```bash
npm install github:nishant/ui#v0.1.2
pnpm add github:nishant/ui#v0.1.2
```

`github:` specs clone over SSH when the machine has a key and fall back to HTTPS when it has
none. A machine with an SSH key that GitHub does not accept (CI runners, the hosting PC)
fails instead. Use the tarball URL there, which only needs HTTPS:

```json
"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v0.1.2"
```

React and react-dom are optional peers (React 19 or later). Static sites and tools that
only use the CSS and `@nish/ui/theme` do not get React installed.

## Quick start: React + Tailwind 4

```css
/* src/index.css */
@import 'tailwindcss';
@import '@nish/ui/tailwind.css';
```

Inline `theme-init.js` at the top of `<head>` so the saved theme is on `<html>` before the
first paint:

```ts
// vite.config.ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

function nishThemeInit(): Plugin {
  const code = readFileSync(require.resolve('@nish/ui/theme-init.js'), 'utf8');
  return {
    name: 'nish-theme-init',
    transformIndexHtml: () => [{ tag: 'script', children: code, injectTo: 'head-prepend' }],
  };
}
// plugins: [nishThemeInit(), react(), tailwindcss()]
```

```tsx
import { initTheme, ThemeToggle, Toaster, Button, toast } from '@nish/ui';

initTheme(); // once, before render

<ThemeToggle presets />   {/* in the header */}
<Toaster />               {/* once, at the root */}
<Button variant="primary" onClick={() => toast.success('Saved')}>Save</Button>
```

## Quick start: static HTML

Copy the files listed in `dist/files.json` from a tag (`nish.css`, `nish-components.css`,
`theme-init.js`, `theme.js`, `theme.global.js` and `fonts/*`). hosting does this with
`scripts/sync-ui.mjs`. Then:

```html
<head>
  <script src="nish/theme-init.js"></script>
  <link rel="stylesheet" href="nish/nish.css">
  <!-- optional: .nish-btn, .nish-card, .nish-badge and the other component classes -->
  <link rel="stylesheet" href="nish/nish-components.css">
</head>
<body>
  <button id="theme" type="button" class="nish-theme-btn"></button>
  <script type="module">
    import { initTheme, mountThemeToggle } from './nish/theme.js';
    initTheme();
    // Fills the button with the System, Light and Dark icons, keeps its label right, cycles on click.
    mountThemeToggle(document.querySelector('#theme'));
  </script>
</body>
```

Pages that cannot use modules load the classic-script build instead. It defines
`window.nishTheme` with `initTheme`, `setThemeChoice`, `cycleTheme`, `onThemeChange`,
`readToken`, `registerThemes`, `getThemeChoice` and `mountThemeToggle`:

```html
<script src="nish/theme.global.js"></script>
<script>
  nishTheme.initTheme();
  nishTheme.mountThemeToggle(document.querySelector('#theme'));
</script>
```

Style with the variables: `background: var(--nish-surface); color: var(--nish-hi2);`.
Font files have content-hashed names (`inter-latin-wght-normal.<hash>.woff2`), so the
folder they live in can be served with a one-year immutable cache.

## Quick start: Electron

The renderer is a React + Tailwind app: same install, same CSS import. Two differences:

- Inline `theme-init.js` (the Vite plugin above). The packaged app loads from `file://`,
  where only an inline, render-blocking script is guaranteed to run before the first paint.
- There is no shared domain, so the choice lives in `localStorage` only. Keep the native
  window chrome in step from the renderer:

```ts
import { initTheme, onThemeChange, schemeOf } from '@nish/ui';
initTheme();
onThemeChange((_choice, theme) => window.api.setNativeTheme(schemeOf(theme)));
// main process: ipcMain.on('theme', (_e, s) => (nativeTheme.themeSource = s));
```

## Themes

`dark` (the default), `light`, and the presets `slate`, `terminal`, `mocha`, `ocean` and
`contrast` (high contrast). Each preset declares whether it is dark or light, so a page
limited to light and dark (`<html data-nish-themes="dark light">`) shows the one it is
based on.

The choice (`system` or a theme name) is shared across subdomains:

- `setThemeChoice()` writes a `nish-theme` cookie on `.nish.software`
  (`Path=/; Max-Age=31536000; SameSite=Lax; Secure`) and the same value to `localStorage`.
- `theme-init.js` reads the cookie first, then `localStorage` (the only store on localhost
  and in Electron), then follows the OS.
- `theme.ts` re-applies the choice when another tab saves one, when the OS scheme flips
  (for `system`), and when a tab comes back into view after another subdomain changed the
  cookie.

So picking Mocha on jobs.nish.software opens trading.nish.software in Mocha too.

A theme can also be scoped to part of a page: `<div data-theme="light" data-scheme="light">`
gets that theme's colors, tints and shadows for its subtree. The docs site's all-themes
views work this way. Tailwind's `dark:` variant matches when any ancestor has
`data-scheme="dark"`, so inside a light container on a dark page it still applies; use
roles instead of `dark:` in scoped content.

## Color roles

Pick colors by role, never by hue. Each role is a CSS variable and a Tailwind color
(`bg-`, `text-`, `border-`, `ring-`, `fill-`, `stroke-` all work, as do opacity
modifiers like `bg-th-surface/50`). Never use raw palette classes such as `neutral-800`:
they do not change with the theme.

| Role | Purpose | Tailwind | CSS variable |
|---|---|---|---|
| bg | Page background | `bg-th-bg` | `--nish-bg` |
| surface | Cards, panels, table bodies | `bg-th-surface` | `--nish-surface` |
| elevated | Popovers, hovered rows, inputs, raised things inside cards | `bg-th-elevated` | `--nish-elevated` |
| overlay | Deepest layer: chips inside raised things, skeleton sheen | `bg-th-overlay` | `--nish-overlay` |
| line | Borders and dividers | `border-th-line` | `--nish-line` |
| line-strong | Input borders, outlines that are not the accent | `border-th-line-strong` | `--nish-line-strong` |
| hi | Primary text | `text-th-hi` | `--nish-hi` |
| hi2 | Secondary text | `text-th-hi2` | `--nish-hi2` |
| hi3 | Tertiary text, labels | `text-th-hi3` | `--nish-hi3` |
| ghost | Placeholders, disabled text, decorative icons (not body text) | `text-th-ghost` | `--nish-ghost` |
| accent | Links, primary buttons, active nav, focus ring | `text-th-accent`, `bg-th-accent` | `--nish-accent` |
| accent2 | Second accent for paired highlights | `text-th-accent2` | `--nish-accent2` |
| ok / loss / warn / info | Status text: success, errors, warnings, notices | `text-th-ok` | `--nish-ok` |
| *-soft | A role at 14% for badges, banners, selected rows (accent, ok, loss, warn, info) | `bg-th-ok-soft` | `--nish-ok-soft` |
| *-fill | Status colors for bars, meters, dots and chart lines (brighter than the text versions in light themes) | `bg-th-ok-fill` | `--nish-ok-fill` |
| on-accent | Text and icons on an accent fill | `text-th-on-accent` | `--nish-on-accent` |
| on-accent2 | Text and icons on an accent2 fill | `text-th-on-accent2` | `--nish-on-accent2` |
| on-ok / on-loss / on-warn / on-info | Text and icons on the matching `-fill` (on-loss also on `loss`, for danger buttons) | `text-th-on-ok` | `--nish-on-ok` |
| scrim | Modal and drawer backdrop tone | `bg-th-scrim/60` | `--nish-scrim` |
| invert-bg / invert-text | Inverted pill: a today marker, an active segment | `bg-th-invert-bg` | `--nish-invert-bg` |
| chart-1 … chart-8 | Categorical chart series; neighbors never share a hue family | `stroke-th-chart-1` | `--nish-chart-1` |
| emerald, indigo, amber, lime, rose, sky, violet, teal | Hues for tags and tile accents, when a color has no meaning | `text-th-rose` | `--nish-rose` |

Aliases kept for older apps: `th-gain` (ok), `th-danger` (loss), `th-2` (hi2), `th-3`
(hi3), `th-bar` (surface), `th-focus`.

Every value per theme, live, is on the [Color page](https://design.nish.software/#/color).

## Layout contract

Bars publish their height to CSS variables on `<html>` (a ResizeObserver; the variable is removed when the bar unmounts or is hidden). Everything else reads the variables, so no React context is needed, and static pages use the same contract through `mountHeightVar`.

| Variable | Written by | Value | Read by |
|---|---|---|---|
| `--nish-header-h` | AppHeader when `sticky` (default) | measured height in px | PageHeader sticky top, StickyBar default top, SectionNav top, `.nish-scroll-target` scroll margin |
| `--nish-bottom-nav-h` | BottomNav while visible (below `hideFrom`) | measured height, safe area included | `--nish-bottom-inset`, StickyActionBar, MoreSheet |
| `--nish-bottom-bar-h` | StickyActionBar while open | measured height | `--nish-bottom-inset` |
| `--nish-bottom-inset` | base.css only | `calc(var(--nish-bottom-nav-h, 0px) + var(--nish-bottom-bar-h, 0px))` | Toaster, PageContainer bottom padding, `.nish-pad-bottom-inset` |
| `--nish-sticky-extra` | SectionNav and StickyBar when sticky | measured height | `.nish-scroll-target` scroll margin |
| `--nish-page-gutter` | base.css (1rem, 1.5rem from 640px) | side padding | AppHeader, PageHeader, PageContainer |

`html[data-nish-layer-open]` is set while any Modal, Drawer or ConfirmDialog is open; Toaster uses it to move to the top on phones. A custom bar publishes its height with `useHeightVar(ref, '--nish-bottom-bar-h')`; a sticky element can use `useStuck(ref)` for a stuck shadow, and a scroller `useScrollEdges(ref)` with `.nish-scroll-fade` for edge fades.

## Phone chrome

A header on top, a tab bar at the bottom on phones, a rail on wide screens and a "More" sheet for the rest. Toaster needs no `offset`: it sits above the tab bar through `--nish-bottom-inset`.

```tsx
import { AppHeader, BottomNav, MoreSheet, NavRail, PageContainer, Toaster } from '@nish/ui';

const [more, setMore] = useState(false);

<AppHeader name="Trackers" hubHref="https://nish.software" actions={<Search />} />
<NavRail items={primary} />                       {/* md and up */}
<PageContainer>{children}</PageContainer>         {/* pads for the bottom inset */}
<BottomNav                                        {/* below md */}
  items={primary}
  more={{ active: false, expanded: more, onToggle: () => setMore((v) => !v) }}
/>
<MoreSheet open={more} onClose={() => setMore(false)} items={secondary} />
<Toaster />                                       {/* no offset */}
```

`items` are `NavItem`s (`key`, `label`, `icon`, `href` or `onSelect`, `active`, `badge`). Pass `renderLink` to use your router's Link.

Use this viewport meta in `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
```

Do not ship a static `<meta name="theme-color">`: `theme-init.js` creates and updates its own from the active theme, and removes any static one at load.

## Formatting: `@nish/ui/format`

A React-free entry for money, percentages, numbers, bytes, durations and dates: `money`, `signedMoney`, `pct`, `num`, `signed`, `bytes`, `duration`, `ago`, `date`, `time`, `dateTime`, `dateRange`. Each returns an en dash for null, undefined, NaN and invalid dates, and works in static pages and on servers. It is not re-exported from `@nish/ui`.

```ts
import { money, pct, ago } from '@nish/ui/format';

money(1234.5);                    // "$1,234.50"
pct(0.0312, { fromRatio: true }); // "3.1%"
ago(Date.now() - 3 * 60_000);     // "3m"
```

## Components

| Component | What it is | Docs |
|---|---|---|
| `Button`, `buttonClass()` | The standard action: primary, secondary, ghost, danger, soft, subtle and link; xs to lg; loading; `buttonClass()` for links | [Button](https://design.nish.software/#/components/button) |
| `IconButton`, `iconButtonClass()` | Icon-only button, 2xs/xs/sm/md, ghost/subtle/soft, danger tone; the required label is its accessible name and title | [IconButton](https://design.nish.software/#/components/icon-button) |
| `Card`, `cardClass()` | Surface panel: padding none/sm/md/lg, `as`, inset variant, optional header via title/description/action | [Card](https://design.nish.software/#/components/card) |
| `CardHeader` | Card header row: title, description, icon, action slot, divided | [CardHeader](https://design.nish.software/#/components/card-header) |
| `Badge`, `badgeClass()` | Status pill: 6 tones plus on-accent, 8 hues, xs/sm, pill or tag, optional dot | [Badge](https://design.nish.software/#/components/badge) |
| `Input`, `fieldClass()` | Text field: xs/sm/md, leading/trailing slots, invalid; 16px text and 44px on touch | [Input](https://design.nish.software/#/components/input) |
| `Textarea` | Multi-line text with the field look; sm/md, `autoGrow` | [Textarea](https://design.nish.software/#/components/textarea) |
| `Checkbox` | A checkbox with its label and hint, indeterminate, trailing slot; the whole row is the tap target | [Checkbox](https://design.nish.software/#/components/checkbox) |
| `Field` | Label, one control and its hint or error, wired for screen readers | [Field](https://design.nish.software/#/components/field) |
| `FieldGroup` | Field for a group of controls: a fieldset and legend, hint and error tied to the group | [FieldGroup](https://design.nish.software/#/components/field-group) |
| `Switch` | On/off setting that applies at once (`role="switch"`), with label and description | [Switch](https://design.nish.software/#/components/switch) |
| `SearchInput` | Search field with icon, Clear button and Escape to clear | [SearchInput](https://design.nish.software/#/components/search-input) |
| `Select` | Native select with the field look, xs/sm/md; keeps the platform picker on phones | [Select](https://design.nish.software/#/components/select) |
| `Label` | Small uppercase label for fields and card sections | [Label](https://design.nish.software/#/components/label) |
| `Skeleton`, `SkeletonLines` | Shimmer placeholders: one sized block, or a ready-made card body | [Skeleton](https://design.nish.software/#/components/skeleton) |
| `SkeletonRows` | A loading column of full-width rounded rows for lists and card pages | [SkeletonRows](https://design.nish.software/#/components/skeleton-rows) |
| `Spinner` | Loader in the current text color; with a label it is `role="status"` | [Spinner](https://design.nish.software/#/components/spinner) |
| `EmptyState` | What an empty list or widget shows: title, one line of why, an action | [EmptyState](https://design.nish.software/#/components/empty-state) |
| `ErrorState` | A failed load, announced to screen readers, with an optional Retry | [ErrorState](https://design.nish.software/#/components/error-state) |
| `Toaster`, `toast()` | Toast stack; `toast.success/error/warn/info` from anywhere, with body, action, duration and slot id; `offset` and `offsetUntil` clear a bottom tab bar | [Toast](https://design.nish.software/#/components/toast) |
| `Callout` | Inline tinted notice: tone, icon, title, action, dismiss, box or bar | [Callout](https://design.nish.software/#/components/callout) |
| `StatusDot` | Round status mark on the `-fill` roles, optional pulse and halo | [StatusDot](https://design.nish.software/#/components/status-dot) |
| `Stat`, `StatGrid`, `signTone()` | Labelled numbers in a `<dl>` grid; tone from a signed number | [Stat](https://design.nish.software/#/components/stat) |
| `Meter`, `toneFor()` | Thin meter or progress bar with threshold tones, or a neutral fill | [Meter](https://design.nish.software/#/components/meter) |
| `Sparkline` | Dependency-free SVG trend line | [Sparkline](https://design.nish.software/#/components/sparkline) |
| `Disclosure` | `<details>` show-more, plain or card | [Disclosure](https://design.nish.software/#/components/disclosure) |
| `Kbd` | Keyboard key | [Kbd](https://design.nish.software/#/components/kbd) |
| `CopyButton`, `copyText()` | Copy to clipboard with a "Copied" state and a live announcement | [CopyButton](https://design.nish.software/#/components/copy-button) |
| `PageHeader` | Page title block with back link, eyebrow, description and actions | [PageHeader](https://design.nish.software/#/components/page-header) |
| `AppHeader` | Shared app header: hub pill, wordmark (optionally a home link, icon only on phones), actions, theme toggle, named nav row | [AppHeader](https://design.nish.software/#/components/app-header) |
| `SectionHeader` | A section's heading row inside a page, with meta and an action | [SectionHeader](https://design.nish.software/#/components/section-header) |
| `KeyValueList` | Label and value rows with dividers, as a list or a `<dl>` | [KeyValueList](https://design.nish.software/#/components/key-value-list) |
| `ChartLegend` | The key for multi-series charts: a color mark and a name per series | [ChartLegend](https://design.nish.software/#/components/chart-legend) |
| `TableWrap`, `Table`, `Th`, `Td`, `Tr`, `tableClass` | Table primitives (sticky header, sort, tone edge) and class recipes for TanStack | [Table](https://design.nish.software/#/components/table) |
| `Modal` | Dialog; bottom sheet under 640px; sizes md to full, top placement, custom header; Escape, focus trap, focus return, html and body scroll lock | [Modal](https://design.nish.software/#/components/modal) |
| `Drawer` | Side or bottom panel with the Modal's focus trap, Escape and scroll lock | [Drawer](https://design.nish.software/#/components/drawer) |
| `ConfirmDialog` | Yes-or-no question before an action, in place of `window.confirm` | [ConfirmDialog](https://design.nish.software/#/components/confirm-dialog) |
| `Tooltip` | Hover and focus hint in a portal on any side, flipped and clamped to the screen; `hint` variant | [Tooltip](https://design.nish.software/#/components/tooltip) |
| `Popover`, `menuItemClass()` | Non-modal panel anchored to an element; Escape and outside press close it (with the reason; `dismissOnOutside`); `menuItemClass()` for menu-looking rows inside it | [Popover](https://design.nish.software/#/components/popover) |
| `DropdownMenu` | Menu of actions behind a button, with `MenuItem`, `MenuLabel`, `MenuSeparator`, `MenuSubHeader` | [DropdownMenu](https://design.nish.software/#/components/dropdown-menu) |
| `Segmented` | Two to five mutually exclusive choices side by side (xs to md, block, disabled options, per-option tip and tone) | [Segmented](https://design.nish.software/#/components/segmented) |
| `Chip`, `ChipGroup`, `chipClass()` | Multi-select filter chips, suggestions and removable tags; `chipClass()` for links | [Chip](https://design.nish.software/#/components/chip) |
| `Tabs`, `TabPanel`, `tabClass()` | ARIA tabs (underline or pill, xs to md, block, responsive panes); `tabClass()` for router links | [Tabs](https://design.nish.software/#/components/tabs) |
| `ThemeToggle`, `useTheme()` | System / Light / Dark control with labels, compact mode, a pill variant and an optional preset picker | [ThemeToggle](https://design.nish.software/#/components/theme-toggle) |
| `mountThemeToggle()` | `@nish/ui/theme` and `window.nishTheme`: the one-button theme toggle for static pages, optionally with the word | [mountThemeToggle](https://design.nish.software/#/components/mount-theme-toggle) |
| `showToast()` | `@nish/ui/theme` and `window.nishTheme`: one toast for static pages, with the React toast's timer policy | [showToast](https://design.nish.software/#/components/show-toast) |
| `@nish/ui/chart` | `seriesColor`, `CHART`, `tooltipStyle`, `chartTheme`, `useChartTheme` for any chart library | [Chart colors](https://design.nish.software/#/components/chart) |
| `@nish/ui/tokens` | Token data for Node scripts, with no React import | [Color](https://design.nish.software/#/color) |
| `.nish-prose` | Markdown and rich text styles (nish.css, tailwind.css) | [Prose](https://design.nish.software/#/components/prose) |
| `.nish-skip-link`, `kbd`, `.scrollbar-none` | Base helpers (nish.css, tailwind.css) | [Base utilities](https://design.nish.software/#/components/base-utilities) |
| `nish-components.css` | Static component classes for pages without React: `.nish-btn`, `.nish-card`, `.nish-badge`, fields, `.nish-seg`, `.nish-chip`, `.nish-callout`, `.nish-stats`, `.nish-table-wrap`, `.nish-meter`, `.nish-disclosure`, `.nish-dot`, `.nish-search`, `.nish-theme-btn` (and `--pill`, `--labelled`), `.nish-toast`, `.nish-glass`, empty and error states. Link it after `nish.css`. | [Static sites](https://design.nish.software/#/static-sites) |

Also exported: `cn()` (clsx plus a tailwind-merge that knows the `th-*` colors), the theme
functions, and `THEMES`, `SCALE`, `COLOR_ROLES`, `SOFT_ROLES`, `HUE_ROLES`, `SHADOWS`, `PRESETS`.

## An app's own themes: registerThemes

Shared themes cover most apps. To offer more, style them with `[data-theme='<id>']`
blocks that set every `--nish-*` color role, then register them so the theme logic accepts
the names and knows whether each is dark or light:

```html
<!-- before theme-init.js, so the first paint knows them -->
<script>window.__nishExtraThemes = { rose: 'dark', paper: 'light' };</script>
```

```ts
import { registerThemes, initTheme } from '@nish/ui';
registerThemes({ rose: 'dark', paper: 'light' });
initTheme();
```

A registered theme saves to the same cookie. Other apps that do not know the name fall
back to their default, so pick ids that will not collide with future shared themes.

## Reading tokens in canvas and charts

Canvas, SVG libraries and chart code cannot use classes. Read the current value and
redraw when the theme changes:

```ts
import { readToken, onThemeChange } from '@nish/ui';

const colors = () => ({
  series: Array.from({ length: 8 }, (_, i) => readToken(`chart-${i + 1}`)),
  grid: readToken('line'),
  text: readToken('hi3'),
});
const off = onThemeChange(() => chart.update(colors()));
```

`readToken(name)` returns the value on `<html>` (for example `#8b93ff`). Breakpoints and
other non-color tokens are in `SCALE` (`SCALE['bp-md']`).

## Accessibility guarantees

- **Contrast.** `tools/contrast.mjs` (run by `npm run check`, CI and every release) checks
  every theme: body text at 4.5:1 on bg, surface and elevated; status and accent text at
  4.5:1 on bg, surface and their own soft tint; every `on-*` color at 4.5:1 on its fill;
  placeholders, chart series, fills and hues at 3:1. The docs site's
  [Themes page](https://design.nish.software/#/themes) shows the same pairs as a matrix.
- **Target device: Samsung Galaxy Z Fold 7.** Every app built on this package is reviewed
  on it. The cover screen is narrow (about 360–390 CSS px), and unfolded it is a near-square
  ~840px. Components, and every page that uses them, must look right with no horizontal page
  scroll at 360px, at ~840px and at desktop width, in light and dark. `visual-check.mjs`
  checks exactly those sizes by default (`phone-small`, `fold`, `desktop`).
- **Tap targets.** Buttons, icon buttons, fields and toggles grow to 44px on touch screens
  (`pointer-coarse:`) and stay compact under a mouse.
- **Tips on touch.** Tooltip and Segmented `tip` open on mouse hover and keyboard focus, never
  on a tap of the control they explain, so a tip never stays pinned over a phone screen. A
  hint term (the trigger itself) still opens on a tap.
- **Focus.** base.css gives every element a visible `:focus-visible` ring in the accent
  color. Modal traps Tab and returns focus to the opener; Tooltip triggers are focusable.
- **Reduced motion.** Under `prefers-reduced-motion`, base.css cuts animations and
  transitions to 1ms and the skeleton shimmer stops.
- **Semantics.** ErrorState is `role="alert"`, toasts are a live region, IconButton requires
  a label, Modal is `role="dialog"` with `aria-modal` and a labelled title.

`tools/visual-check.mjs` screenshots any site at desktop and phone sizes in each theme and
fails on sideways scrolling, clipped text, axe contrast and tap-target violations, console
errors, missing focus rings and empty screenshots.

## Releasing

```bash
npm run release patch      # or minor, major, 1.2.3
```

The flow is: release, tag, fan-out PRs, Fold check, merge policy, deploy watch and revert.

1. **Release.** `npm run release` runs `npm run check`, bumps the version on `master` and commits it, then
   makes a detached commit on top that adds the built `dist/` and `site-dist/`, tags it `vX.Y.Z` and
   pushes both. `master` never contains `dist/`; the tag does, so an install needs no build step.
   It then prints the link to the fan-out runs. Add an entry to `CHANGELOG.md` with every change;
   the docs site renders it.
2. **Fan-out PRs.** The tag push starts `.github/workflows/fanout.yml` ("fan-out"). For every repo in
   `hosting/fleet.yaml` (hosting included) it opens or updates a `ui/vX.Y.Z` PR titled "Move @nish/ui to
   vX.Y.Z" within 5 minutes: it rewrites the pin, regenerates the lockfile, runs the repo's `bump`
   command, and puts the release notes in the PR body. An hourly run catches up on anything missed and
   closes bump PRs that a newer tag replaced. To run it by hand:
   `gh workflow run fanout.yml -R nishant/ui -f tag=vX.Y.Z -f repo=all` (`repo` can be one `owner/name`).
3. **Fold check.** Each bump PR (and each Dependabot PR) runs the repo's checks plus the
   [Fold check](docs/fold-check.md): the PR and its base branch are built, screenshot at 360, 840 and
   1440 wide in light and dark, the Fold rules run on both, and a pixel diff per shot is posted as a PR
   comment and a `fold-report` artifact.
4. **Merge policy.** The fan-out merges a PR (`gh pr merge --merge --delete-branch`) when its checks
   pass, the Fold check finds no new problems and the pages changed less than the limit:

   | PR | Limit |
   |---|---|
   | ui patch (`0.7.0` to `0.7.1`) | 1% |
   | ui minor (`0.7.x` to `0.8.0`) | 10% |
   | Dependabot minor-and-patch group | 1% |

   Otherwise it holds the PR and writes the reason into a `fan-out` commit status on the PR head. The
   hold reasons are: no checks ran, checks failed, a major release (from 1.0), release notes with a
   `### Behavior changes` section, the Fold report missing, new Fold problems, the base branch could
   not be rendered, pages changed more than the limit, the PR changes `.github/workflows` (the token
   cannot merge those), or the merge itself failed. A held bump PR is adopted on its `ui/vX.Y.Z`
   branch (make the app's code changes there), and the fan-out merges it on its next run.
5. **Deploy watch and revert.** After a merge the fan-out follows the repo's deploy workflow. If the
   deploy fails it reverts the merge in a `revert/<n>` PR and merges that, and holds that tag for the
   repo until a session looks.

Check https://status.nish.software/fleet (behind the status login) for what is behind: per repo, the
live and master `@nish/ui` version against the latest tag, CI state, and open bump and dependency PRs
with their `fan-out` status.

**`FLEET_TOKEN`.** The fan-out runs with one fine-grained personal access token stored as the Actions
secret `FLEET_TOKEN` in nishant/ui (the default `GITHUB_TOKEN` cannot reach other repos, and what it
opens does not trigger their checks or deploys). Owner nishant; repositories: every repo in
`hosting/fleet.yaml` and nishant/hosting itself (the plan job reads `fleet.yaml` from it); permissions:
Contents, Pull requests and Commit statuses read and write, Actions read (Metadata read is always
included). Set it with `gh secret set FLEET_TOKEN --repo nishant/ui`. Without it the run only writes
a job summary saying nothing was fanned out.

**Adding a repo to the fan-out.** Add an entry to `hosting/fleet.yaml`, then give the repo
the `PR` workflow (`.github/workflows/pr.yml`, its checks), the `Fold` workflow (`.github/workflows/fold.yml`, see [docs/fold-check.md](docs/fold-check.md)), `fold.visual.json`,
`scripts/fold-serve.mjs` and `.github/dependabot.yml`.

**arora-home** (`taarora/arora-home`) vendors `dist/` with a colour-blind palette pass instead of
installing the package, and another account owns it, so the fan-out token cannot write to it. After a
release, run `bash scripts/bump-consumers.sh vX.Y.Z` yourself: it runs that repo's
`scripts/sync-nish-ui.py vX.Y.Z`, opens the PR, merges it after its `pr_status.py` passes (per its
CLAUDE.md) and watches the deploy. If the palette or contrast check fails on a new release, no PR is
opened and someone has to look.

**Static sites** (minecraft, trips, design) live in nishant/hosting, which is in the fan-out: its bump
PR runs `scripts/sync-ui.mjs` (it copies the vendored files from `dist/files.json` and updates their
hashes) and restamps the pages. `scripts/sync-ui.mjs --check --offline` fails CI if a vendored copy
was edited by hand.

## The docs site

The site at https://design.nish.software is built from this repo's own `src` and `dist`, so it
always shows exactly the code being released.

```bash
npm run dev:site      # builds dist/, then serves the site at http://localhost:5191
npm run build:site    # builds dist/, then the static site into site-dist/
npm run preview:site  # serves site-dist/ at http://localhost:5191
```

`site-dist/` is plain static files with hash routes and relative asset URLs, so it works
served from any path. Props tables are generated from the TypeScript source at build time
(`site/docgen.mjs`), so add JSDoc to a prop and it shows up there. Component pages,
stories and controls live in `site/components/<id>.tsx`, one file per component;
`site/components/index.ts` lists them in `COMPONENT_DOCS`.

## Repo layout

| Path | What |
|---|---|
| `src/tokens.mjs` | Every design token. Edit here; the CSS is generated. |
| `src/theme.ts`, `src/theme-init.js` | Theme switching, and the pre-paint script. |
| `src/theme-global.ts` | Entry for `dist/theme.global.js` (`window.nishTheme`). |
| `src/components/` | The React components. |
| `src/chart.ts` | `@nish/ui/chart`: chart colors and tooltip styles for any chart library. |
| `src/css/` | `base.css` (page defaults, focus ring, scrollbars, reduced motion, prose, kbd, skip link), `components.css` (the static `nish-*` classes, built to `dist/nish-components.css`) and `fonts.css`. |
| `scripts/build.mjs` | Builds `dist/`: tokens.css, tailwind.css, nish.css, hashed fonts, theme-init.js, the JS via tsup, and tests theme-init.js and theme.global.js. |
| `scripts/release.mjs` | `npm run release`: check, version, tag with `dist/`, push. |
| `scripts/bump-consumers.sh` | Moves taarora/arora-home only; the fan-out moves every other repo. |
| `.github/workflows/fanout.yml`, `tools/fanout/` | The fan-out: opens, settles and merges the bump PRs in every repo of `hosting/fleet.yaml`. |
| `.github/workflows/fold-check.yml`, `tools/fold-diff.mjs`, `tools/fold-comment.mjs` | The Fold check every app's PRs run: [docs/fold-check.md](docs/fold-check.md). |
| `site/` | The docs site. |
| `demo/` | A single-page gallery for quick checks: `npm run dev`, http://localhost:5190. |
| `tools/contrast.mjs`, `tools/contrast-rules.mjs` | The WCAG check and the pairs it enforces. |
| `tools/visual-check.mjs` | Screenshot and layout check for any site. Configs: `demo.visual.json`, `site.visual.json` (CI), `site-all.visual.json` (every docs page). |
| `tools/gallery.mjs` | Turns visual-check runs into a before/after review page. |
| `CHANGELOG.md` | Every release. |

## Troubleshooting

**Component classes are missing (unstyled buttons).** `tailwind.css` has `@source "./"`,
which tells Tailwind to scan the package's `dist/` for the classes the components use.
If your setup resolves the package somewhere Tailwind does not follow (some pnpm or
monorepo layouts), add the path yourself:

```css
@source '../node_modules/@nish/ui/dist';
```

**`npm install` fails with "Permission denied (publickey)".** The machine has an SSH key
GitHub does not accept for this repo. Use the codeload tarball URL from Install, or
`git config --global url."https://github.com/".insteadOf git@github.com:`.

**The page flashes the wrong theme on load.** `theme-init.js` must run before any
stylesheet and must not be `async`, `defer` or a module. Inline it at the top of `<head>`
(or load it render-blocking). If the app registers its own themes,
`window.__nishExtraThemes` must be set before it.

**A preset chosen on another site shows as dark or light here.** The page limits itself
with `data-nish-themes`; that is the intended fallback.

**Fonts 404 on a static site after an upgrade.** Font names now carry a hash. Copy every
file in `dist/files.json`, not a fixed list.

## Versioning

Semver on the git tags. A change is **breaking** when an app has to edit its code or
markup to keep working or keep its look: removing or renaming a token, role, class,
export, prop or file; changing a component's default; changing the cookie or storage key.
Before 1.0 a breaking change bumps the minor (0.2.0); after, the major. New roles,
components, props and files, and color adjustments that keep every contrast check passing,
are minor or patch. Record every change in `CHANGELOG.md`.
