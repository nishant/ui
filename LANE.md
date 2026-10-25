# Lane: foundation (ds/v0.3-foundation)

Files changed: `src/tokens.mjs`, `src/tokens.d.mts`, `src/cn.ts`, `src/theme.ts`, `src/theme-init.js`, `src/theme-global.ts`,
`src/css/base.css`, `scripts/build.mjs`, `tools/contrast-rules.mjs`, `package.json` (exports only), `tsup.config.ts`,
`scripts/bump-consumers.sh`. New docs pages: `site/components/mount-theme-toggle.tsx`, `prose.tsx`, `base-utilities.tsx`.

Shipped: every Foundation row of COMPONENTS.md except README "Used by" (integrator) and `nish-components.css` (static lane),
plus Tier 2 `.nish-prose`. Checks: `npm run typecheck`, `npm run contrast` (1008 pairs, was 784), `npm run build` (new
assertions: cn, tokens entry, theme-init meta cases, mountThemeToggle) all pass.

## 1. Lines to add to `src/index.ts`

`mountThemeToggle`, `MountThemeToggleOptions` and `ThemeToggleLabels` already flow through `export * from './theme'`.
Replace the tokens line:

```ts
export { THEMES, SCALE, COLOR_ROLES, SOFT_ROLES, HUE_ROLES, SHADOWS, DEFAULT_THEME } from './tokens.mjs';
```

Then change the import in `site/components/base-utilities.tsx` to take `HUE_ROLES` from `'../../src'` (it reads `src/tokens.mjs` directly until then).

## 2. Visual configs

`tools/site-all.visual.json` (pages array, same shape as the existing component entries):

```json
{ "name": "mount-theme-toggle", "url": "http://localhost:5191/#/components/mount-theme-toggle", "waitFor": "[data-page]" },
{ "name": "mount-theme-toggle-themes", "url": "http://localhost:5191/#/components/mount-theme-toggle/themes", "waitFor": "[data-page]", "viewports": ["desktop"] },
{ "name": "prose", "url": "http://localhost:5191/#/components/prose", "waitFor": "[data-page]" },
{ "name": "prose-themes", "url": "http://localhost:5191/#/components/prose/themes", "waitFor": "[data-page]", "viewports": ["desktop"] },
{ "name": "base-utilities", "url": "http://localhost:5191/#/components/base-utilities", "waitFor": "[data-page]" },
{ "name": "base-utilities-themes", "url": "http://localhost:5191/#/components/base-utilities/themes", "waitFor": "[data-page]", "viewports": ["desktop"] },
{ "name": "spacing", "url": "http://localhost:5191/#/spacing", "waitFor": "[data-page]" },
{ "name": "typography", "url": "http://localhost:5191/#/typography", "waitFor": "[data-page]" }
```

`tools/site.visual.json`: add `base-utilities` (the hue tints and small type are the most theme-sensitive new thing):

```json
{ "name": "base-utilities", "url": "http://localhost:5191/#/components/base-utilities", "waitFor": "[data-page]" }
```

All of these passed the visual check (desktop and phone, dark and light; all-themes views on desktop) with the
registrations below applied locally.

## 3. Docs registrations (files this lane does not own)

These pages document CSS and a function, so they have `exports: []` and a `source` file. Apply exactly this (tested, then reverted):

- `site/components/index.ts`: import and append to `COMPONENT_DOCS`, after `themeToggle`:
  `import { mountThemeToggleDoc } from './mount-theme-toggle'; import { prose } from './prose'; import { baseUtilities } from './base-utilities';`
  and `mountThemeToggleDoc, prose, baseUtilities,`.
- `site/components/types.ts`, in `ComponentDoc`:
  `/** The source file the page links to when it documents no component (CSS, a function). */ source?: string;`
  (then the pages can drop their `& { source: string }` type widening; optional).
- `site/pages/component.tsx`, in `ComponentPage`: replace `const gen = docgen.components[doc.exports[0]];` with
  `const file = doc.source ?? docgen.components[doc.exports[0]].file;` and use `file` in place of both `gen.file`.
  Nice to have: hide the "Props" section when `doc.exports.length === 0 && !doc.api` (it is empty on Prose and Base utilities).
- `site/docgen.mjs`: `FUNCTIONS` += `'mountThemeToggle'`; `INTERFACES` += `'MountThemeToggleOptions'`.
- `site/pages/foundations.tsx` (Foundations page, owned by nobody):
  - Typography: add `3xs` and `2xs` before `xs` in the type-size list (SCALE has `text-2xs`/`-lh`, `text-3xs`/`-lh`).
  - Spacing & radius: `RADII = ['xs', 'sm', 'card', 'md', 'lg', 'pill']` and `grid-cols-2 sm:grid-cols-6`; change the Radius note to
    "Controls rounded-lg (8px, radius-sm), cards rounded-xl (12px, radius-card), dialogs rounded-2xl (16px), pills rounded-full. Tailwind's rounded-* scale is not remapped."
- `site/pages/color.tsx` (optional): its local `HUES` can import `HUE_ROLES`, and the hue swatches can show the new `--nish-<hue>-soft`.

## 4. CHANGELOG lines (one per addition)

- Hue soft tints: `--nish-<hue>-soft` for the 8 hues (14% over transparent) and Tailwind `th-<hue>-soft`. Contrast checks hue on its tint over bg (3:1) and hi on every hue tint (4.5:1).
- `text-2xs` (11px / 1rem) and `text-3xs` (10px / 0.875rem): `--nish-text-2xs`, `--nish-text-3xs` and Tailwind `text-2xs` / `text-3xs`. `cn()` keeps a `th-*` color next to them (build assertion).
- `--nish-radius-card` (12px, what Card's `rounded-xl` is). The Foundations page lists the canonical radii.
- `HUE_ROLES` export, and `SOFT_ROLES` now lists the hues after the status roles.
- `@nish/ui/tokens`: `THEMES`, `SCALE`, `COLOR_ROLES`, `SOFT_ROLES`, `HUE_ROLES`, `SHADOWS`, `DEFAULT_THEME` as plain data with types; imports in plain Node without React.
- `mountThemeToggle(button, { labels })` in `@nish/ui/theme` and `window.nishTheme`: the one-button System → Light → Dark toggle for static pages, with a correct label for presets set on another site.
- base.css: `.nish-skip-link`, a base `kbd` style, `.scrollbar-none`, `@keyframes nish-slide-in-right` / `nish-slide-in-left` (Tailwind `animate-slide-in-right` / `animate-slide-in-left`).
- `.nish-prose` in base.css: Markdown and rich text (headings, lists, links, code, quotes, tables, task lists) on role tokens.
- `package.json` exports `./tokens`, `./chart` (built from `src/chart.ts` when it exists; display lane) and `./nish-components.css` (static lane builds the file).
- `scripts/bump-consumers.sh` writes the codeload tarball form from either dependency form, uses the hub's `master` branch, skips repos without @nish/ui cleanly, and has `--dry-run`.

**Behavior changes**
- The Tailwind base now sets the default border color (`--nish-line`) on every element and a pointer cursor on enabled `button` / `[role=button]`.
- theme-init.js sets `<meta name="theme-color">` to the resolved theme's bg before first paint (creates it when missing). Registered app themes keep the runtime path.
- `kbd` elements get a bordered key style from base.css (nish.css and tailwind.css) everywhere.

## 5. README component-table rows

| `mountThemeToggle` | `@nish/ui/theme`, `window.nishTheme` | One-button theme toggle for static pages |
| `.nish-prose` | `nish.css`, `tailwind.css` | Markdown and rich text styles |
| `.nish-skip-link`, `kbd`, `.scrollbar-none` | `nish.css`, `tailwind.css` | Base helpers |
| `@nish/ui/tokens` | plain JS | Token data for Node scripts (no React) |

## 6. Needed from files this lane does not own / notes for other lanes

- Static lane: the `.nish-theme-btn` class should size the button mountThemeToggle fills; the icons are `svg[data-icon=system|light|dark]`
  and the hidden ones carry `display="none"`, so no CSS is required for the swap. Static lane owns the `nish-components.css` build step and its `files.json` entry; the package export is already here.
- Display lane: `Kbd` can build on the base `kbd` style (it adds `text-2xs`, `px-1.5`, `text-th-hi2`). `src/chart.ts` is picked up by `tsup.config.ts` automatically; nothing to add there.
- Overlay lane: Drawer can use `animate-slide-in-right` / `animate-slide-in-left`.
- Known, not from this lane: the All components page (`#/components`, `site/pages/wall.tsx`) fails visual-check's clipped-text test on its `sr-only` spans ("Filter components" and each card name), because `sr-only` is 1px with overflow hidden. Either skip `.sr-only` in `tools/visual-check.mjs`'s clipped check or leave the wall out of the config (it is not in `site-all.visual.json` today).
