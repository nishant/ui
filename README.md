# nish-ui

Design tokens, seven themes, flash-free theme switching and accessible React 19 components,
built for Tailwind 4 and usable from plain CSS and static HTML. It is the design system
behind every `*.nish.software` app.

**See every component and token live, in every theme: [design.nish.software](https://design.nish.software)**

[![npm](https://img.shields.io/npm/v/nish-ui)](https://www.npmjs.com/package/nish-ui)
[![license](https://img.shields.io/npm/l/nish-ui)](https://github.com/nishant/ui/blob/master/LICENSE)

## Install

```bash
npm install nish-ui
```

React and react-dom are optional peers (19 or later), so a static site or a Node tool that
only uses the CSS and `nish-ui/theme` never gets React. The package ships built files, with
no install or build step.

The docs site and the nish.software apps write the package as `@nish/ui`. To use their
examples exactly as written, install it under that name with an npm alias:

```bash
npm install @nish/ui@npm:nish-ui
```

The nish.software apps pin that alias to an exact version,
`"@nish/ui": "npm:nish-ui@X.Y.Z"`. The release fan-out keeps the pin current, so the version is
never written by hand.

### Fallback: without the npm registry

Every release tag carries the same built files, so a machine that cannot reach npm can pin the
tag's tarball, which needs only HTTPS:
`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX.Y.Z"`.

## Usage

### React + Tailwind 4

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

A classic-script build (`theme.global.js`, `window.nishTheme`) covers pages that cannot use
modules. See [Static sites](https://design.nish.software/#/static-sites).

## Theming

Seven themes: `dark` (the default), `light`, and the presets `slate`, `terminal`, `mocha`,
`ocean` and `contrast`. Each preset is dark or light, so a page limited to those two shows
the one it is based on.

- **Before first paint.** `theme-init.js` puts the saved theme on `<html>` before anything
  renders, then the page follows the OS when the choice is `system`.
- **Across subdomains.** The choice is saved to `localStorage` and, on nish.software or the
  domain named by `<html data-nish-domain="example.com">`, to a cookie on that domain, so
  picking Mocha on one app opens its sibling apps in Mocha too.
- **Scoped.** `<div data-theme="light" data-scheme="light">` themes one subtree.
- **Your own themes.** `registerThemes({ rose: 'dark' })` plus `[data-theme='rose']` CSS.
- **Canvas and charts.** `readToken('chart-1')` and `onThemeChange()`, or `nish-ui/chart`.

Every role and its value in each theme: [Color](https://design.nish.software/#/color) and
[Themes](https://design.nish.software/#/themes).

## What's in it

More than 60 components, each with live stories, props and guidelines on the
[docs site](https://design.nish.software/#/components):

- **Actions and inputs:** Button, IconButton, Input, Textarea, Select, Combobox, Checkbox,
  Switch, Segmented, Chip, SearchInput, Field
- **Feedback:** Toast, Callout, Spinner, Skeleton, EmptyState, ErrorState, StatusDot, Meter
- **Overlays:** Modal, Drawer, ConfirmDialog, Popover, DropdownMenu, Tooltip
- **Settings:** SettingsSection, SettingRow, NumberField, ServiceTokensSection (list and revoke
  service tokens)
- **Layout and navigation:** AppShell (bottom bar, rail and a collapsible sidebar), AppHeader, BottomNav, NavRail, MoreSheet, Tabs,
  PageHeader, Card, Table, FilterBar, SplitStage
- **Data and motion:** Stat, Sparkline, MediaRow, ActivityFeed, WorkflowBoard, SystemCanvas,
  AnimatedList

Entry points:

| Import | What |
|---|---|
| `nish-ui` | React components, hooks, theme functions |
| `nish-ui/tailwind.css` | Tailwind 4 theme and base styles |
| `nish-ui/nish.css` | The same without Tailwind |
| `nish-ui/theme` | Theme switching, React-free |
| `nish-ui/format` | Money, percent, date formatters |
| `nish-ui/chart` | Chart colors for any library |
| `nish-ui/vite` | The theme-init Vite plugin |
| `nish-ui/eslint` | Lint rules for theme classes |

Also `nish-ui/tokens` (token data for Node), `nish-ui/tsconfig/*` (strict presets), the
`nish-th-check` CLI, and `nish-ui/server`, `nish-ui/server/hono` and `nish-ui/inbox-client`
(the nish.software apps' login and inbox kit, which other projects can ignore).
Details: [Vite plugin and lint](https://design.nish.software/#/components/vite-plugin).

## Accessibility

- Every theme passes WCAG contrast (4.5:1 text, 3:1 graphics), checked in CI and shown as a
  matrix on [Themes](https://design.nish.software/#/themes).
- Controls grow to 44px tap targets on touch screens and stay compact under a mouse.
- Visible focus rings, focus traps in dialogs, live regions for toasts, and reduced motion
  respected everywhere.
- Every component is checked at 360px, 840px and desktop widths, in light and dark.

## Links

- Docs and live components: [design.nish.software](https://design.nish.software)
- Changelog: [CHANGELOG.md](https://github.com/nishant/ui/blob/master/CHANGELOG.md)
- Releasing (CI, the app fan-out, npm): [docs/RELEASING.md](https://github.com/nishant/ui/blob/master/docs/RELEASING.md)
- Working on this repo: [docs/DEVELOPING.md](https://github.com/nishant/ui/blob/master/docs/DEVELOPING.md)
- Troubleshooting and versioning: [Getting started](https://design.nish.software/#/getting-started)
- Issues: [github.com/nishant/ui/issues](https://github.com/nishant/ui/issues)

MIT licensed.
