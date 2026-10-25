# Lane: static (ds/v0.3-static)

What the integrator applies when merging this lane into `ds/v0.3`. Delete this file after integration.

## Files this lane changed

- `src/css/components.css` (new): every class in COMPONENTS.md "Static component classes", all `:where()` wrapped.
- `scripts/build-components.mjs` (new): copies it to `dist/nish-components.css` and fails the build if a selector is not `:where()` wrapped.
- `scripts/build.mjs` (foundation's file, 3 small hunks): imports `buildComponentsCss`, calls it after `nish.css`, adds `nish-components.css` to `dist/files.json` "static". Resolve any conflict by keeping both sides.
- `site/static-example/index.html`, `classic.html`: rebuilt on the classes, with a `.nish-theme-btn`.
- `site/pages/static-sites.tsx`: links `nish-components.css`, mentions `mountThemeToggle`, new "Component classes" section (React vs static, and All themes). The example iframe is now 720px tall.
- `site/components/static-classes.tsx` (new): the stories (`STATIC_STORIES`). It is not a `ComponentDoc`, so it is **not** registered in `COMPONENT_DOCS`. It imports `src/css/components.css` for the docs site.

## src/index.ts

Nothing. This lane adds no JS exports.

## package.json exports (foundation owns package.json)

```json
"./nish-components.css": "./dist/nish-components.css",
```

## Visual configs

`tools/site-all.visual.json` and `tools/site.visual.json`: the existing `static-sites` page covers the "React vs static" view. Add the all-themes view and the example pages:

```json
{ "name": "static-sites-themes", "url": "http://localhost:5191/#/static-sites", "waitFor": "[data-page]", "settle": 800, "viewports": ["desktop"],
  "setup": "[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent==='All themes')?.click()" },
{ "name": "static-example", "url": "http://localhost:5191/static-example/index.html", "waitFor": "main" },
{ "name": "static-example-classic", "url": "http://localhost:5191/static-example/classic.html", "waitFor": "main" }
```

The first goes in both files. The two example pages go in `site-all.visual.json`. If the integrator moves the site's local `Tabs` to the shared `Tabs`, keep the `setup` matching the "All themes" tab.

## Docs registration

None. The page is reached from the existing "Static sites" nav item.

## CHANGELOG

Additions:
- `@nish/ui/nish-components.css`: opt-in component classes for static pages (`.nish-btn`, `.nish-icon-btn`, `.nish-card`, `.nish-badge`, `.nish-input`/`.nish-select`/`.nish-textarea`, `.nish-label`, `.nish-field`, `.nish-seg`, `.nish-chip`, `.nish-callout`, `.nish-stats`/`.nish-stat`, `.nish-table-wrap`, `.nish-meter`, `.nish-disclosure`, `.nish-empty`, `.nish-error-state`, `.nish-theme-btn`), every selector wrapped in `:where()`. Listed in `dist/files.json` "static", so hosting's `sync-ui.mjs` vendors it.
- `.nish-search` (SearchInput twin) and `.nish-dot` (StatusDot twin) in `nish-components.css`: the hub and mc need both.
- `.nish-badge` hue modifiers (`--emerald` … `--teal`) mirroring Badge `hue`.
- Docs: the Static sites page shows every class beside its React component and in every theme; the static example is rebuilt on the classes.

Behavior changes: none (the stylesheet is opt-in; `nish.css` is unchanged).

## README component table rows

| `nish-components.css` | Static component classes (`.nish-btn`, `.nish-card`, `.nish-badge`, fields, `.nish-seg`, `.nish-chip`, `.nish-callout`, `.nish-stats`, `.nish-table-wrap`, `.nish-meter`, `.nish-disclosure`, `.nish-dot`, `.nish-search`, `.nish-theme-btn`, empty and error states) for pages without React. Link it after `nish.css`. |

## Needed from other lanes

- **Foundation, `mountThemeToggle`:** `.nish-theme-btn` expects the button to hold one SVG per choice, each with `data-icon="system" | "light" | "dark"`, and the button to carry `data-choice` (the saved choice, which can be a preset name). CSS shows the matching icon; for a preset it shows the icon of the page's `data-scheme`. If foundation renders a single swapped SVG instead, it still works (an SVG without `data-icon` is never hidden).
- **Foundation, `window.nishTheme` / `theme.js`:** the static examples call `mountThemeToggle` when it exists and fall back to a small inline copy otherwise. After foundation lands, delete the `fallbackToggle` function and its `else` branch in both `site/static-example/*.html`.
- **Foundation, tokens:** the CSS uses `--nish-radius-card`, `--nish-text-2xs`, `--nish-text-3xs` and `--nish-<hue>-soft` with fallbacks (12px, 0.6875rem, 0.625rem, a 14% mix), so it works before and after those tokens land. No change needed; optionally drop the fallbacks after integration.
- **Foundation, base.css:** `.nish-search` relies on the base `kbd` style for its `/` hint. `.nish-prose` (Tier 2) belongs in base.css, not here.
- **Integrator:** React twins on the Static sites page exist only for components in this branch (Button, IconButton, Card, Badge, Input/Select/Textarea, Segmented, EmptyState/ErrorState). After merging the other lanes, add a `react` render to the stories in `site/components/static-classes.tsx` for Field, SearchInput, Chip, Callout, Stat/StatGrid, TableWrap, Meter, Disclosure, StatusDot and compact ThemeToggle (one optional field per story).
- **Hosting (B3):** add `nish-components.css` to the `LINK` regex in `scripts/sync-ui.mjs`.

## Checks run on this branch

`npm run typecheck`, `npm run build` (includes the `:where()` check), `npm run contrast` (784 pairs, 7 themes), `vite build` of the site, and the visual check on the static-sites page (React vs static and all themes) and both static examples, desktop and phone, dark and light: 14 shots, 0 problems.
