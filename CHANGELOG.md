# Changelog

Every release of `@nish/ui`, newest first. Versions follow semver: before 1.0, a minor
bump (0.x.0) may require apps to change code; a patch (0.1.x) never does.

## [0.2.0] - 2026-10-25

### Added

- `on-accent2`, `on-ok`, `on-loss`, `on-warn` and `on-info` colors for text and icons on solid
  fills, as `--nish-on-*` variables and `text-th-on-*` classes. Each clears 4.5:1 on its fill
  in every theme, and `tools/contrast.mjs` checks them.
- `dist/theme.global.js`: the theme API as a classic script for pages that cannot use modules.
  It sets `window.nishTheme = { initTheme, setThemeChoice, cycleTheme, onThemeChange, readToken, registerThemes, getThemeChoice }`.
  Exported as `@nish/ui/theme.global.js`; the build tests it.
- `dist/files.json`: the files a static site vendors, with the current font file names.
- A theme can be scoped to part of a page: `<div data-theme="light" data-scheme="light">`
  gets that theme's colors, soft tints and shadows for its subtree.
- The docs site at design.nish.software (`npm run dev:site`, `npm run build:site`), built from
  this repo's source, with generated props tables, every component in every theme and a
  contrast matrix.
- `CHANGELOG.md`.

### Changed

- The light theme's chart series are brighter: each is the most vivid shade of its hue that
  still clears 3:1 on bg, surface and elevated (chart-3 was `#b45309`, a rust brown, and is now
  `#c96d06`). The order and hue families are the same. Charts in light mode will look
  different.
- Font files in `dist/fonts/` have content-hashed names
  (`inter-latin-wght-normal.<hash>.woff2`), and `fonts.css` and `nish.css` reference them, so
  static sites can cache them for a year. **Static sites that copy fonts by name must copy the
  new names**: read them from `dist/files.json` (hosting's `scripts/sync-ui.mjs` lists the old
  names and needs that change before it moves to this release).
- Danger buttons use `text-th-on-loss` instead of `text-th-on-accent`. Same colors in every
  shared theme today.
- Soft tints, shadows and `--nish-focus` are declared on every `[data-theme]` element as well as
  `:root`. Nothing changes for html-level theming.
- `tools/contrast.mjs` also requires every chart color to clear 3:1 on elevated. The pairs it
  checks moved to `tools/contrast-rules.mjs`, shared with the docs site.
- `tools/visual-check.mjs` clips full-page shots at 16,000px (`maxHeight` in the config) and notes
  it on the shot. Pages taller than 65,535px used to produce empty JPEGs that still passed; a
  shot whose file is empty or missing now fails.

## [0.1.2] - 2026-10-25

### Added

- Fill colors for bars, meters and chart lines: `ok-fill`, `loss-fill`, `warn-fill` and
  `info-fill` (`bg-th-ok-fill`). In light themes they are brighter than the text-safe status
  colors, which look muddy as large fills; dark themes use the same color for both.
- `registerThemes()` and `window.__nishExtraThemes` for themes an app defines itself. The theme
  logic and theme-init.js accept the registered names and know whether each is dark or light.

### Fixed

- A disabled `Button` reads as disabled in every theme: a flat, quiet fill and faint text
  instead of a dimmed copy of the enabled color.

## [0.1.1] - 2026-10-25

### Fixed

- `theme-init.js` in v0.1.0 kept its `__THEMES__` placeholder and threw on load, so the saved
  theme never applied before first paint. The build now fills it in and runs the script against
  a stub document with nine cases (cookie, localStorage, OS light, unknown names, limited
  themes, extra themes) before writing it.

### Changed

- React and react-dom are optional peer dependencies, so static sites and tools that only use
  the CSS and `@nish/ui/theme` do not get React installed.

## [0.1.0] - 2026-10-25

The first release.

- Design tokens in `src/tokens.mjs`: color roles for seven themes (dark, light, slate,
  terminal, mocha, ocean, contrast), soft tints, chart series and hues, plus type, spacing,
  radii, shadows, motion, z-index and breakpoints. The build turns them into `--nish-*` CSS
  variables and `th-*` Tailwind classes.
- Theme switching: `theme-init.js` before first paint, and `getThemeChoice`, `setThemeChoice`,
  `applyTheme`, `onThemeChange`, `cycleTheme` and `readToken`. The choice is shared across
  subdomains through a `nish-theme` cookie on `.nish.software`.
- Components: `Button`, `IconButton`, `Card`, `Badge`, `Input`, `Select`, `Label`, `Skeleton`,
  `SkeletonLines`, `EmptyState`, `ErrorState`, `Toaster` with `toast()`, `Modal`, `Tooltip` and
  `ThemeToggle` with `useTheme()`.
- `nish.css` for static pages, and the self-hosted Inter Variable font.
- `tools/contrast.mjs` (WCAG check of every theme), `tools/visual-check.mjs` (screenshots and
  layout, contrast, tap-target and focus checks), `tools/gallery.mjs`, the release script and
  `scripts/bump-consumers.sh`.
