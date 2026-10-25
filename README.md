# @nish/ui

The shared theme and React components for every `*.nish.software` app and site: one set of
design tokens, light and dark (plus presets), theme switching that follows one choice across
subdomains, and the small components every app ended up writing for itself.

| Path | What |
|---|---|
| `src/tokens.mjs` | **Every design token.** Colors per theme, type, spacing, radii, motion, z-index. Edit here; the CSS is generated. |
| `src/theme.ts` | Theme switching: `getThemeChoice`, `setThemeChoice`, `applyTheme`, `onThemeChange`, `cycleTheme`, `readToken`. |
| `src/theme-init.js` | Applies the saved theme before first paint. Inline or load it in `<head>` on every page. |
| `src/components/` | `Button`, `IconButton`, `Card`, `Badge`, `Input`, `Select`, `Label`, `Skeleton`, `SkeletonLines`, `EmptyState`, `ErrorState`, `Toaster` + `toast()`, `Modal`, `Tooltip`, `ThemeToggle` + `useTheme()`. |
| `src/css/` | `base.css` (page defaults, focus ring, scrollbars, reduced motion) and `fonts.css` (Inter Variable, self-hosted). |
| `demo/` | Gallery of every token and component in every theme. `npm run dev`, then http://localhost:5190. |
| `tools/contrast.mjs` | WCAG check of every theme, including colored text on its own tint. Runs in CI and before every release. |
| `tools/visual-check.mjs` | Screenshots any site at desktop and phone sizes in each theme and reports overflow, clipped text, contrast, tap targets, console errors and focus rings. |
| `tools/gallery.mjs` | Turns visual-check runs into a before/after review page. |
| `scripts/release.mjs` | `npm run release patch` builds, tags and pushes. |
| `scripts/bump-consumers.sh` | Opens a PR in each consumer repo moving it to a new tag. |

## Themes

`dark` (default), `light`, and the presets `slate`, `terminal`, `mocha`, `ocean`, `contrast`.
Each preset declares whether it is dark or light, so a page limited to light and dark
(`<html data-nish-themes="dark light">`) shows the matching one.

The choice is stored in a `nish-theme` cookie on `.nish.software`, so it is the same on
every subdomain, and in `localStorage` (the only store on localhost and in Electron).

## Use it in a React app (Tailwind 4)

```bash
npm install github:nishant/ui#v0.1.0
```

```css
/* src/index.css */
@import 'tailwindcss';
@import '@nish/ui/tailwind.css';
```

```html
<!-- index.html, in <head>, before any stylesheet -->
<script src="/node_modules/@nish/ui/dist/theme-init.js"></script>
```

Better: inline it so it costs no request. In Vite, a `transformIndexHtml` plugin can read
`node_modules/@nish/ui/dist/theme-init.js` and put it in a `<script>` at the top of `<head>`.
The build tests this script against a stub document, so a broken copy never ships.

React and react-dom are optional peers: static sites that only use the CSS and
`@nish/ui/theme` do not get React installed.

```tsx
import { Button, Toaster, toast, ThemeToggle, initTheme } from '@nish/ui';
initTheme();
// <ThemeToggle presets /> in the header, <Toaster /> once at the root
```

For bars, meters and chart lines use the fill versions of the status colors
(`bg-th-ok-fill`, `bg-th-warn-fill`, `stroke-[var(--nish-loss-fill)]`): in light themes they are
brighter than the text-safe `th-ok`/`th-warn`, which look muddy as large fills.

### An app's own themes

Shared themes cover most apps. To offer extra ones, style them with `[data-theme='<id>']`
blocks that set every `--nish-*` color, then register them so the theme logic accepts the
names:

```html
<script>window.__nishExtraThemes = { rose: 'dark', paper: 'light' };</script>
<!-- then theme-init.js -->
```

```ts
import { registerThemes, initTheme } from '@nish/ui';
registerThemes({ rose: 'dark', paper: 'light' });
initTheme();
```

Colors are Tailwind classes named by role: `bg-th-bg`, `bg-th-surface`, `bg-th-elevated`,
`border-th-line`, `text-th-hi`, `text-th-hi2`, `text-th-hi3`, `text-th-ghost`, `bg-th-accent`
`text-th-on-accent`, `text-th-ok`, `text-th-loss`, `text-th-warn`, `text-th-info`, each status
color with a `-soft` tint (`bg-th-ok-soft`). Opacity modifiers work: `bg-th-surface/50`.
`dark:` follows the active theme, not the OS. Never use raw palette classes (`neutral-800`).

## Use it on a static page

Copy `dist/nish.css`, `dist/fonts/`, `dist/theme-init.js` and `dist/theme.js` from a tag
(hosting does this with `scripts/sync-ui.mjs`), then:

```html
<script src="nish/theme-init.js"></script>
<link rel="stylesheet" href="nish/nish.css">
<script type="module">
  import { initTheme, cycleTheme } from './nish/theme.js';
  initTheme();
  document.querySelector('#theme').addEventListener('click', cycleTheme);
</script>
```

Read colors as `var(--nish-surface)`, `var(--nish-hi2)` and so on. Canvas code reads them
with `readToken('chart-1')`.

## Release

```bash
npm run release patch      # or minor, major, 1.2.3
scripts/bump-consumers.sh v0.1.1
```

`master` never contains `dist/`. The release script commits the version bump to `master`,
then makes a tag commit with `dist/` added, so a git install needs no build step.
