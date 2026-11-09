# Developing nish-ui

How this repo is laid out and how to run it. Using the package: [README](../README.md).
Releasing it: [RELEASING.md](RELEASING.md). Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md).
Moving from 1.x: [MIGRATING-2.0.md](MIGRATING-2.0.md).

## Checks

```bash
npm run check        # typecheck, contrast, build, format/inbox/canvas checks, th-check, lint, size
npm run test:unit    # vitest: a DOM project (happy-dom) and a node project (tests/ssr)
npm run test:tools   # node --test over tools/ (server kit, exports, API surface, npm publish)
npm run test:overlay # playwright (overlay, elements, hydration, a11y, CSP specs)
npm run size         # bundle budgets (tools/size-budgets.json) and the tarball limit
```

Other gates:

| Command | What it checks |
|---|---|
| `npm run size` | bundles each import in `tools/size-budgets.json` from `dist/esm` as one file with every `import()` left external, gzips it (the initial KB: what loads before first render; lazy targets are printed separately) and fails over budget or when a `mustNotInclude` module is in it; also the `npm pack --dry-run` size |
| `node --test tools/exports.test.mjs` | every export imports and `require()`s on Node 20.19+; `dist/esm/index.js` loads with no DOM; `"use client"` stays on the right modules |
| `node --test tools/api-surface.test.mjs` | a removed export or `.nish-*` class fails; `UPDATE_API_SURFACE=1` rewrites `tools/api-surface.snapshot.json` after a build, so removals are deliberate |
| `npx vitest run tools/docgen-coverage.test.ts` | every runtime export of `.` has a docs page or mention and every prop of an exported component has a description; today's gaps are allow-listed by name and the lists can only shrink (`NISH_DOCGEN_DUMP=1` prints them) |
| `node tools/canvas-route-bench.mjs` | routing time at 100-1000 nodes; `--check` (in `check`) fails over 60 ms at 500 nodes |
| `node tools/site-bundle-check.mjs` | JS per docs route from `.site-stats.json`; run by `build:site` |
| `npm run mutation` | Stryker on src/theme.ts, local only; installs Stryker without saving it; report in reports/mutation/. theme.ts: 77.9% on 2026-11-05 (1,010 killed, 263 survived, 23 no coverage) |
| `node tools/consumer-check.mjs` | packs the package and builds a Next.js App Router app (port 5320), a Vite + Tailwind app and a TypeScript matrix against it |
| `npx playwright test tests/a11y tests/ssr` | axe (zero serious or critical), forced colors, strict CSP with Trusted Types, hydration |
| `node tools/visual-check.mjs tools/site.visual.json` | screenshot and layout check of the docs site at 390 and 1440 px (CI runs this one; the Fold check, PRs only, runs `fold.visual.json` on its pages at 360, 840 and 1440 in light and dark) |

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
`site/components/index.ts` lists them in `COMPONENT_DOCS`. Docs load per page, each as its own chunk:
a doc's `id`, `name`, `summary`, `exports`, `framed` and `fleetOnly` must be literals, because
`site/docs-meta.mjs` reads them from the source at build time and the build fails naming the file otherwise. Write import lines and code samples as
`@nish/ui`: the site shows them as `nish-ui` (the npm name) through `nishName()` in
`site/lib/code.tsx`, and Getting started explains the alias the nish.software apps use.

## The component contract

Every component module follows these rules; reviewers check them.

1. **`'use client'`** is the first statement of any module that calls React hooks,
   `createContext`, `createPortal` or browser APIs. Pure helpers it exports (`*Class` functions,
   constants, `toneFor`, `signTone`) live in a sibling `<module>-classes.ts` with no directive and
   no React runtime import; the component module re-exports them so import paths keep working.
   A server component must be able to call every helper from `nish-ui`.
2. **`ref` is a prop** (React 19), never `forwardRef`. Props extend the root element's
   attributes and `...rest` is spread on the root, so `id`, `data-*`, `aria-*` and `style` work.
3. **No import-time side effects.** Module-level calls get `/* @__PURE__ */` (`createContext`,
   `memo`, `new Intl.*`, `extendTailwindMerge`). No listeners, timers or DOM at import.
4. **Render is pure on the server and the first client render matches it.** Nothing reads
   `window`, `document`, `localStorage` or `matchMedia` during render. Use `useIsClient`,
   `useSyncExternalStore` with a server snapshot, or effects. Portals go through `Portal`.
5. **Strings** come from `useStrings(GROUP, ...)` (internal, in `provider.tsx`) with the groups in
   `src/components/strings.ts` that hold the keys the component reads; a per-instance prop wins. A new
   string gets a typed key with a JSDoc line in `NishStrings` and a value in exactly one group (the
   completeness check fails otherwise). Never call `useNishStrings()` or read `DEFAULT_STRINGS` in a
   component: they carry every string.
6. **RTL.** Logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`,
   `border-s`, `rounded-s`), `rtl:` variants for icons that point, and arrow keys swapped when
   `isRtl(el)`.
7. **z-index** from tokens: `z-[var(--nish-z-modal,50)]` (sticky, dropdown, modal, toast, tooltip).
8. **State attributes.** Stateful roots set `data-state` (`open|closed`, `checked|unchecked|
   indeterminate`, `active|inactive`) and `data-disabled`.
9. **Forced colors.** State shown only by background, shadow or a colored dot also gets a
   `forced-colors:` utility using system colors (`Highlight`, `ButtonText`, `GrayText`).
10. **Dev warnings** for misuse, guarded by `process.env.NODE_ENV !== 'production'`.
11. **Form colors.** Borders `border-th-line-control`, placeholders `placeholder:text-th-hi3`.
12. **Tests.** `src/components/<module>.test.tsx` (vitest, testing-library, happy-dom) pins ref,
    className merge, rest passthrough, ARIA, keyboard, controlled and uncontrolled use, strings
    from a provider and RTL arrows. `tests/setup.ts` cleans up after each test. Use fake timers
    for anything timed. Tests do not depend on order.
13. **Docs page.** Update `site/components/<id>.tsx` for every prop you add, rename or change.
14. **Public API.** Export it from `src/index.ts` and list its page in `COMPONENT_DOCS`; the
    docgen-coverage and api-surface tests fail otherwise.

Shared state (theme listeners, the overlay stack, the toast store, the format locale, element
strings) goes in `shared('<key>', init)` from `src/runtime.ts`, never in a module-level variable,
so two copies of the package on one page agree.

## Repo layout

| Path | What |
|---|---|
| `src/tokens.mjs` | Every design token. Edit here; the CSS is generated. |
| `src/theme.ts`, `src/theme-init.js` | Theme switching, and the pre-paint script. |
| `src/theme-global.ts` | Entry for `dist/theme.global.js` (`window.nishTheme`). |
| `src/runtime.ts`, `src/url.ts` | The shared runtime record and `safeUrl`. |
| `src/components/` | The React components; `*-classes.ts` are the pure helpers, `strings.ts` the strings. |
| `src/elements/` | Custom elements (Lit); `all.ts` is the combined entry. |
| `src/chart.ts` | `nish-ui/chart`: chart colors and tooltip styles. |
| `src/css/` | `base.css`, `components.css` (built to `dist/nish-components.css`), `fonts.css`. |
| `src/server/`, `src/node/` | The Hono server kit, the Vite plugin, ESLint preset and `nish-th-check`. |
| `scripts/build.mjs` | Builds `dist/`: the CSS, hashed fonts, theme-init.js, tokens files and the JS via tsup. |
| `scripts/release.mjs` | The release: check, version, tag with `dist/`, push, dispatch. |
| `dist/esm/` | The preserved-modules build bundlers use: one file per source module. |
| `tools/npm-publish.mjs` | Publishes a tag to npm as `nish-ui` (run by `publish.yml`). |
| `tools/size-check.mjs` | The bundle budgets (initial chunk; lazy chunks are printed, not budgeted). |
| `tools/fanout/` | The fan-out that moves every app to a new tag (`fanout.yml`). |
| `tools/fold-diff.mjs` | The Fold check every app's PRs run: [fold-check.md](fold-check.md). |
| `tools/contrast.mjs` | The WCAG check; the pairs are in `tools/contrast-rules.mjs`. |
| `tools/visual-check.mjs` | Screenshot and layout check for any site, at 360, 840 and desktop. |
| `tests/` | Playwright specs (overlay, elements, ssr, a11y) and consumer fixtures. |
| `scripts/bump-consumers.sh` | Moves taarora/arora-home only. |
| `site/` | The docs site. |
| `demo/` | A one-page gallery for quick checks: `npm run dev`, http://localhost:5190. |
