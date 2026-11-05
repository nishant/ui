# ui 2.0 leftovers: docs-site splitting, canvas routing speed, theme.ts mutation score, fleet-only subpaths, wave 3 element follow-ups

Status: in progress · Slug: ui-leftovers · Date: 2026-11-05 · Size: large
Repos: nishant/ui (PUBLIC; spec lives here). No other repo.
ROADMAP: `ROADMAP.md` entries "Other 2.0 leftovers" (2026-11-03) and "Wave 3 element follow-ups" (2026-11-02)

## Goal

Close the 2.0 leftovers that need no outside user: the docs site loads one small chunk per page instead of
one 1.56 MB script, and a framed component's "All themes" view opens 7 frames instead of 7 per story;
SystemCanvas routes a 500-node map about 20x faster with byte-identical lines; `src/theme.ts` gets real
Vitest coverage and a measured mutation score; the fleet-only APIs get their own entry points and a
"Fleet-only" label in the docs (root exports stay); and the wave 3 elements get the parity cases and
touch/focus regression specs the ROADMAP lists.

1. `#/overview` loads at most 200 KB gzip of JS (today 461 KB, one chunk); `#/frame/modal` at most 160 KB;
   `node tools/site-bundle-check.mjs` enforces the budgets after every site build.
2. `#/components/<framed id>/themes` (modal, drawer, confirm-dialog, dropdown-menu, popover, toast, tooltip)
   renders exactly 7 iframes (one story, chosen in a "Story" select), not 7 x stories (63 for Modal).
3. `routeEdges` on the 500-node / 750-edge benchmark graph: at most 15 ms median locally (today 100-150 ms),
   at most 60 ms in CI's `--check`; output for every seeded graph hashes identical to today's router.
4. `src/theme.ts`: Vitest line coverage at least 90% (today 55%); Stryker mutation score at least 65%
   (39% in 2.0), at most 40 "no coverage" mutants (478 in 2.0), measured with `npm run mutation`.
5. `nish-ui/inbox` and `nish-ui/service-tokens` exist (same values as the root exports); Inbox,
   ServiceTokensSection and SystemCanvas pages show a "Fleet-only API" callout and import from their subpaths;
   the README says what fleet-only means for semver. Nothing is removed from the root entry.
6. New parity cases for the Stage E classes and states listed in T5 pass with an empty `KNOWN_GAPS`; a new
   `tests/elements/touch-focus.spec.ts` pins the coarse-pointer chip width, the command input focus ring and
   the stacked split panes.

## Out of scope

- A CommonJS build and React 18 support (only if an outside user asks): they stay on the ROADMAP.
- Removing `Switch` `onChange(checked, event)` (3.0): stays on the ROADMAP.
- Removing the fleet-only names from the root entry (3.0): added to the ROADMAP at release.
- SystemCanvas render cost (React cards and SVG paths), `layoutCandidates` (1.5 ms at 500 nodes) and the
  `SystemCanvas` size budget. Do not edit `tools/size-budgets.json` (appshell-gaps owns it).
- `src/components/overlay.js`/`overlay.tsx`, `src/components/app-shell.tsx`, `src/index.ts`,
  `site/components/index.ts`: not edited by this spec.
- Moving fleet apps to the new subpaths (they keep root imports; nothing breaks).
- New devDependencies. Stryker is installed on demand with `--no-save` (no lockfile change).
- Element-only classes with no React twin (`.nish-table-wrap--fade`, `.nish-range-bar-labels`,
  `.nish-command-footer`): data.spec.ts already covers their behavior; no parity case is possible.

## Decisions

- Docs meta is extracted at build time from the doc source files with the TypeScript AST
  (`site/docs-meta.mjs`), not hand-kept in a second registry, so the other ui sessions keep adding docs to
  `site/components/index.ts` exactly as today. A doc property the meta needs (id, name, summary, exports,
  framed, fleetOnly) must be a literal; the build fails naming the file otherwise. (default)
- Each doc page is its own chunk through `import.meta.glob('../components/*.tsx')`; pages and the shell are
  `React.lazy` chunks; `use(promise)` + `<Suspense>` loads docs. Simpler than effect state. (default)
- The docgen data (250 KB raw) moves out of the shell: `virtual:nish-pkg` (name, version, distFiles) is
  eager, `virtual:nish-docgen` is only imported by the component page and by search's props items, which
  load when search opens (as the CSS items already do). (default)
- Bundle stats are written by a Vite plugin to `.site-stats.json` at the repo root (gitignored), never into
  `site-dist/`, because hosting mirrors every file of `site-dist/` into the public `static/design`. (default)
- The bundle check runs inside `npm run build:site` (release and the Fold check both run it), so no
  workflow file changes. (default)
- Fewer iframes = a story picker on the All-themes view of framed components (7 frames, one per theme).
  Portaled components cannot share one document (one open Tooltip per page, Modal scroll lock and
  overlay stack), so rendering them without frames is not an option. No `loading="lazy"`: full-page
  screenshots in the Fold and visual checks would show blank frames. (default)
- Router speed-up keeps the exact algorithm and output: bucket the taken segments by y, index same-port
  tracks, and generate candidate tracks lazily (stop at the first free one). A golden-hash test computed
  from today's router proves identity. A prototype of exactly this gave identical output and 5.4 ms at
  500 nodes (from 154 ms) and 23 ms at 1000 (from 837 ms) on the PC, +0.29 KB gzip. (measured)
- The CI timing check uses 60 ms at 500 nodes: about 10x the new local time, below the old local time, so
  it catches a return to the quadratic path without flaking on slower runners. (default)
- Mutation testing stays local and on demand (`npm run mutation`): Stryker on every PR would cost
  10+ minutes; theme.ts gets a per-file Vitest coverage threshold in CI instead. Global coverage
  thresholds are not raised now, because three other ui sessions add code in parallel. (default)
- The build-time self-tests in `scripts/build.mjs` stay: they test the shipped `dist/` bundles (IIFE,
  pre-paint script), which Vitest does not. The behavior they and nobody else cover moves into Vitest. (default)
- Fleet-only means: built for the nish.software apps, may change in a minor release, patches still only fix;
  the names stay on the root entry through 2.x and are slated to leave it in 3.0. No `@deprecated` JSDoc
  tag on the root names: it would strike through every fleet app's imports and could trip a
  `no-deprecated` lint rule there. The deprecation note is in the README, the docs callout and CHANGELOG. (default)
- New subpaths are `nish-ui/inbox` and `nish-ui/service-tokens` (SystemCanvas already has
  `nish-ui/system-canvas`). `nish-ui/inbox-client` (the server client, already deprecated) is untouched. (default)
- Parity cases for hover or press states (chart tooltips, a dragging split divider, the empty command list)
  use a new optional `setup` step on a case, run on both pages before measuring. (default)
- CHANGELOG: bullets go in a `## [2.1.0] - 2026-11-05` section shared with the other ui sessions of this
  batch (create it if missing, add to it if present); the orchestrator fixes the date when it releases. (default)
- Local Playwright and site preview runs set `CI=1`: `reuseExistingServer` is off then, so a busy port
  (another ui worktree's harness on 5191/5193/5194/5195) fails loudly instead of testing the other
  worktree's code. (default)

## Current state

- **Docs site** (`site/`). `site/main.tsx` imports every page and `COMPONENT_DOCS` (`site/components/index.ts`,
  ~105 docs, each `site/components/<id>.tsx`) eagerly: `npm run build:site` gives one
  `site-dist/assets/index-*.js` of 1,563 KB (460.7 KB gzip) plus 262 KB CSS. `chunkSizeWarningLimit: 1200`
  hides the warning. `virtual:nish-docgen` (`site/vite.config.ts` `docs()`, data from `site/docgen.mjs`) is
  249 KB of JSON (components 202 KB) and is imported by `main.tsx`, `lib/search.ts`, `pages/component.tsx`,
  `getting-started.tsx`, `overview.tsx`, `static-sites.tsx`. `CHANGELOG.md?raw` (65 KB) is in the same chunk.
  `COMPONENT_DOCS` users: `main.tsx` (nav, page lookup), `lib/search.ts` (`baseItems`, `hasDoc`),
  `pages/component.tsx`, `pages/frame.tsx`, `pages/wall.tsx`, `pages/overview.tsx` (count), and
  `tools/docgen-coverage.test.ts` (Vitest; keep it working). `RealModalButton` comes from
  `site/components/modal.tsx` through the index.
- Frames: `site/pages/component.tsx` `Frame` (an iframe of this same site at `#/frame/<id>?story=&theme=&args=`),
  used by `Canvas` (1), `StoryCard` (1 per story) and `AllThemes`/`StoryInTheme` (stories x 7 themes) when the
  doc has `framed` (7 docs: confirm-dialog 4 stories, drawer 7, dropdown-menu 7, modal 9, popover 8, toast 7,
  tooltip 8). `site/pages/frame.tsx` `FramePage` renders one story; `guardFrameFocus` must run before any
  overlay mounts. `ThemeColumns` and `ThemeScope` are in `site/lib/ui.tsx`. `site/pages/wall.tsx` has 7
  framed tiles. The visual configs (`tools/site.visual.json`, `fold.visual.json`) wait for `[data-page]`,
  then network idle.
- Hosting serves `site-dist/` of the tag at design.nish.software: `nishant/hosting` `scripts/sync-ui.mjs`
  mirrors every file (any names; no list to update).
- **Routing** (`src/components/canvas/route.ts`, `routeColumns`): for each corridor wire it builds
  `2 x (wires + 1)` outer candidates and sorts them, scans all of `taken` for same-port tracks, and
  `trackFree` scans all of `taken` per candidate: about O(W^2 log W) to O(W^3). Measured on the PC
  (Node 24, fresh esbuild bundle of the source): 50 nodes 2.7 ms, 200 nodes 14.8 ms, 500 nodes / 749 edges
  94-154 ms, 1000 / 1500 685-837 ms. `system-canvas.tsx` memoizes `routeEdges` on layout and visible edges
  only. `layoutCandidates`/`chooseLayout` are internal (`src/components/canvas/layout.ts`), not exported.
  `tools/canvas-route-check.mjs` is the correctness self-test (run by `npm run check`).
  `npm run size`: SystemCanvas 27.13 KB of a 27.5 KB budget.
- **theme.ts** (1,070 lines). `src/theme.test.ts` (883 lines) covers the theme functions, mountThemeToggle,
  showToast, confirmDialog, mountTooltips. Vitest coverage of theme.ts: 55% lines; uncovered are lines
  ~700-1063 (`openSheet`, `mountHeightVar`, `mountStuck`, `mountScrollspy`, `mountChecklist`) plus a few
  branches (themeLabel's capitalized fallback ~340-346, mountTooltips' Escape ~668-670). No Stryker config
  is committed; `.gitignore` already has `.stryker-tmp*/` and `reports/mutation/`. CLAUDE.md: Stryker with
  the vitest runner needs `disableTypeChecks: false` and `ignoreStatic: true`. Latest Stryker:
  `@stryker-mutator/core@10.1.1`, `@stryker-mutator/vitest-runner@10.1.1` (peer vitest >=2).
- **Fleet-only exports** in `src/index.ts`: SystemCanvas group (lines ~222-237), Inbox group (~238-243),
  ServiceTokens group (~258-260). `src/system-canvas.ts` is the `./system-canvas` entry
  (`export * from './components/canvas'`). Entries are listed in: `package.json` `exports` and
  `typesVersions`; `tsup.config.ts` (dts-only entry block: `index`, `system-canvas`); `scripts/build.mjs`
  `buildEsm` entries (line ~233) and `testEsmBuild` file list (~328); `tools/exports.test.mjs` (~57);
  `tools/api-surface.snapshot.json`; `tests/consumers/ts/src/consumer.tsx` (~45-47); README "Entry points".
- **Elements parity** (`tests/elements/parity.spec.ts`, `react.tsx` `WAVE3`, `elements.ts` `WAVE3`): cases are
  `{ name, query, react: Part, element: Part, ignore?, sizes?, run? }`, built with `wave2(id, parts, query,
  ignore)`; each runs at 360 and 1440 (840 on request) in light and dark; `KNOWN_GAPS` is `{}` and must
  stay empty. Covered Stage E: tables (dense, zebra, sorted/numeric header, numeric cell, row states,
  sticky first/header), filter bar (bar, phone button, desktop clear), media thumbs and rows (incl. live,
  offline, dense, compact, round), media chip, split row (panes, divider), nav rail (custom, default),
  scroll row, section nav, more sheet, settings (section, compact, rows, stacked, inline, status), command
  (box, selected option, group head), line and bar charts, range bar.
- **Touch/focus specs that exist** (`tests/elements/data.spec.ts`): split stacks at 390 coarse (`#sp-row`)
  and keeps 16rem panes at 360; scroll-row chips keep `width >= scrollWidth` at 360 coarse; the palette
  input has `outlineStyle: none` after a programmatic open. Missing: the `.nish-tab`/`.nish-chip`/
  `.nish-th-sort` 44px min-width rule under a coarse pointer (components.css ~3296-3310, the wave 3 review
  fix), keyboard-modality focus on both command input forms (the `!important` rule, ~4433), nested and
  column splits stacking, the 840 coarse case (no stack) and the fine-pointer 360 case.
  `tests/elements/data.html` has `#sp-row`, `#sp-col`, `#sp-nest`/`#sp-inner`, `#sp-saved` and `#cp`.

## Design

### Data and APIs

```ts
// site/docs-meta.mjs (Node, used by site/vite.config.ts and tools/docs-meta.test.ts)
export interface DocMeta {
  id: string;            // the doc's `id`
  name: string;          // the doc's `name`
  summary: string;
  exports: string[];
  framed?: { height: number };
  fleetOnly?: boolean;
  file: string;          // 'button.tsx' (basename under site/components/)
  exportName: string;    // 'button' (the identifier in COMPONENT_DOCS)
}
export function docsMeta(root: string): DocMeta[]; // in COMPONENT_DOCS order

// site/lib/docs.ts (browser)
export const DOCS: DocMeta[];
export function docMeta(id: string): DocMeta | undefined;
export function loadDoc(id: string): Promise<ComponentDoc>;      // cached: same id -> same promise
export function loadAllDocs(): Promise<ComponentDoc[]>;           // cached, DOCS order
export function loadDocModule(file: string): Promise<Record<string, unknown>>; // cached glob loader

// .site-stats.json (written by the build, read by tools/site-bundle-check.mjs)
interface SiteStats {
  entry: string; // fileName of the entry chunk
  chunks: Record<string, { gzip: number; imports: string[]; dynamicImports: string[]; facade: string | null }>;
  // facade: facadeModuleId relative to the repo root with forward slashes ('site/shell.tsx'), or null
}

// tools/canvas-bench-graph.mjs
export function benchGraph(o: { nodes: number; edgesPerNode?: number; columns?: number; seed?: number }):
  { groups: CanvasGroup[]; edges: CanvasEdge[] };
```

New package entries (package.json `exports`, same shape as `./system-canvas`):

```json
"./inbox": { "types": "./dist/inbox.d.ts", "import": "./dist/esm/inbox.js", "default": "./dist/esm/inbox.js" },
"./service-tokens": { "types": "./dist/service-tokens.d.ts", "import": "./dist/esm/service-tokens.js", "default": "./dist/esm/service-tokens.js" }
```

### UI

- Shell loading: while a page chunk loads, `<div className="flex justify-center py-24"><Spinner label="Loading page" /></div>`
  in place of the page, with no `data-page` attribute (the visual checks wait for `[data-page]`).
  Before the shell chunk itself arrives the app renders nothing (theme-init already painted the background).
- All-themes view of a framed doc: above the theme columns, a labelled native select:
  label text "Story", options = the doc's story names, default the first story. Layout:
  `<label className="grid w-full max-w-xs gap-1.5"><span className="text-sm font-medium text-th-hi">Story</span><Select ...>`.
  Each theme column shows one frame of that story. The Section note for framed docs becomes:
  "Every story in all seven themes at once. Each column is a [data-theme] container, so the components inside
  read that theme's variables. This component renders on document.body, so each theme runs the story picked
  below in its own frame." Non-framed docs are unchanged (all stories inline).
- Fleet-only callout on a doc page with `fleetOnly: true`, directly under the PageHeader:
  `<Callout tone="info" title="Fleet-only API">Built for the nish.software apps. It can change in a minor
  release, so a project outside the fleet should not depend on it. Import it from its own entry point, as in
  the import line above.</Callout>`
- Wall tile of a fleet-only doc: `<Badge tone="info">Fleet-only</Badge>` after the name in the tile header.
- Phones: the select is full width up to 20rem and inherits Select's 44px coarse-pointer height; the callout
  wraps; nothing adds width. Check 360x780, 840x900, 1440x900 in light and dark (T4 acceptance).

### Security

No routes, no secrets, no new network calls. The docs site stays static. `.site-stats.json` never ships.
nishant/ui is public: nothing written here (spec, README, CHANGELOG, PR body) names a credential.

### Performance budgets

- Site JS gzip (sum of the route's chunk closure): `/overview` <= 200 KB, `/components/button` <= 300 KB,
  `/frame/modal` <= 160 KB. Set each budget to the measured value rounded up to the next 5 KB, never above
  these caps. Biggest single chunk under 500 KB raw (`chunkSizeWarningLimit: 500`).
- `routeEdges`, 500 nodes / 750 edges: <= 15 ms median locally, `--check` fails over 60 ms; 1000 / 1500
  <= 60 ms locally (reported, not enforced). Router change adds <= 0.3 KB gzip to SystemCanvas.

### Ops

No env vars, ports, runners or jobs. New npm scripts: `mutation`. Changed: `check` (adds the route bench
check), `build:site` (adds the bundle check).

## Tasks

All tasks: checkout `C:\Code\ui-ui-leftovers` (branch `ui-leftovers`), run `npm ci` first if
`node_modules` is missing. Run Playwright and site previews with `CI=1` (Git Bash: `CI=1 npx playwright test ...`).
Never run for real by a subagent: `npm run release`, `gh workflow run release.yml|publish.yml|fanout.yml`,
`node tools/npm-publish.mjs`, `npm publish`, `git push`, `gh pr create|merge`, `bash scripts/bump-consumers.sh`.
Implementers do not commit.

### T1 SystemCanvas routing speed

- Owns: `src/components/canvas/route.ts`, `tools/canvas-bench-graph.mjs` (new),
  `tools/canvas-bench-graph.d.mts` (new), `tools/canvas-route-bench.mjs` (new),
  `src/components/canvas/route-golden.test.ts` (new)
- Reads: `src/components/canvas/layout.ts`, `tools/canvas-route-check.mjs`, `src/components/canvas/canvas-math.test.ts`
- Depends on: none
- Change:
  1. `tools/canvas-bench-graph.mjs`: `benchGraph({ nodes, edgesPerNode = 1.5, columns = 8, seed = 1 })`.
     RNG: `let s = seed >>> 0; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);`.
     Groups `g0, g1, ...`: size `1 + Math.floor(r() * 10)` capped at the nodes left, `column: Math.floor(r() * columns)`,
     `title: id`, nodes `{ id: \`${gid}/n${j}\`, label: \`n${j}\` }`. Edge ends are drawn from every group id
     and node id: `Math.round(nodes * edgesPerNode)` edges `{ id: \`e${i}\`, from, to }` (self and repeated
     edges allowed: the router must handle them). `.d.mts` declares the function with the canvas types
     imported as `import type { CanvasGroup, CanvasEdge } from '../src/components/canvas/types'`.
  2. `route-golden.test.ts` (Vitest): cases `[[20, 2, 1], [50, 1.5, 2], [120, 2, 3], [300, 1.5, 4], [500, 1.5, 5]]`
     as `[nodes, edgesPerNode, seed]`. For each: `layoutCandidates(groups, edges, 'auto')` (import from
     `./layout`), layouts = `[c.columns, ...c.bands]`, and for each layout
     `sha256(JSON.stringify(routeEdges(layout, groups, edges)))` (node:crypto, hex). Compare to a
     `GOLDEN: Record<string, string[]>` constant keyed `"<nodes>/<seed>"`. With `NISH_ROUTE_GOLDEN_PRINT=1`
     it prints the JSON of the computed hashes instead of asserting. FIRST, before touching route.ts, run
     `NISH_ROUTE_GOLDEN_PRINT=1 npx vitest run src/components/canvas/route-golden.test.ts` and paste the
     output into `GOLDEN`. Also assert that routing twice gives the same object (determinism).
  3. `route.ts` `routeColumns`, keeping every result identical:
     - `taken` also goes into `buckets: Map<number, HSeg[]>` keyed `Math.floor(h.y / TRACK_GAP)` (one
       `addTaken(h)` helper for every push). `trackFree(y, xa, xb, w)` scans only buckets
       `Math.floor((y - TRACK_GAP) / TRACK_GAP)` to `Math.floor((y + TRACK_GAP) / TRACK_GAP)`, same test inside.
     - Same-port tracks: keep `trackSeq` (count of corridor tracks taken) and
       `tracksByPort: Map<string, [y: number, seq: number][]>` with keys `'s' + srcKey` and `'d' + dstKey`;
       after taking a track push `[y, seq]` under both keys. Candidates for a wire = the two lists merged by
       `seq` ascending, first occurrence of each y kept (this equals today's scan of `taken` in order).
     - Candidates are tried lazily in today's order and the loop stops at the first `c` with
       `cardFree(c, c0, c1) && trackFree(c, xa, xb, w)`: same-port tracks, then each band (bands sorted as
       today) with its slots sorted by `near`, then the outer tracks. Outer tracks: a two-pointer merge of
       `up(i) = minY - OUTSIDE_GAP - TRACK_GAP * i` and `down(j) = maxY + OUTSIDE_GAP + TRACK_GAP * j` for
       `i, j` in `0..wires.length`, taking `up` when `near(up, down) <= 0`. Nothing free: use the last outer
       candidate emitted (today's `candidates[candidates.length - 1]`). Never build the full outer array.
     - Add a one-line comment above the candidate loop: the order is the old sorted list's order; the golden
       test pins it.
  4. `tools/canvas-route-bench.mjs` (run after `npm run build`): imports `layoutCandidates`, `chooseLayout`
     from `../dist/esm/components/canvas/layout.js` and `routeEdges` from `../dist/esm/components/canvas/route.js`,
     `benchGraph` from `./canvas-bench-graph.mjs`. Sizes `[100, 250, 500, 1000]` with seed 1. For each: median
     of 5 runs of `layoutCandidates` and of `routeEdges` on the columns layout and on
     `chooseLayout(c, { w: 1440, h: 900 })` and `chooseLayout(c, { w: 360, h: 780 })`; print one line per
     size: `canvas-route-bench: 500 nodes, 750 edges: candidates 1.4 ms, columns 5.1 ms, desktop (bands) 4.8 ms, phone (bands) 4.9 ms`.
     `--check`: only the 500-node size, 7 runs, exit 1 with
     `canvas-route-bench: routing 500 nodes took <n> ms (limit 60)` when any median is over 60 ms, else print
     `canvas-route-bench: ok`.
- Edge cases: no groups, no edges, edges with unknown ends, self edges, all edges in one column, a bands
  layout (routed transposed through `routeColumns`): all covered by the golden graphs and
  `canvas-route-check.mjs`; results must not change.
- Acceptance:
  - `npx vitest run src/components/canvas` passes (golden, canvas-math, system-canvas).
  - Identity proof: `git stash push src/components/canvas/route.ts`, rerun the golden test (passes), `git stash pop`.
  - `npm run build && node tools/canvas-route-check.mjs && node tools/canvas-route-bench.mjs && node tools/canvas-route-bench.mjs --check`:
    500-node medians <= 15 ms here.
  - `npm run size`: SystemCanvas grows by at most 0.3 KB. If it passes 27.5 KB, report the measured number
    (the orchestrator raises the budget or waits for the appshell-gaps overlay split); do not edit
    `tools/size-budgets.json`.
  - `npm run typecheck && npx eslint src/components/canvas tools/canvas-*.mjs`.

### T2 theme.ts tests and mutation score

- Owns: `src/theme-helpers.test.ts` (new), `stryker.config.mjs` (new), `vitest.config.ts`
- Reads: `src/theme.ts`, `src/theme.test.ts`, `tests/setup.ts`, `scripts/build.mjs` (`testGlobal`, `testInit`)
- Depends on: none
- Change:
  1. `src/theme-helpers.test.ts`, happy-dom, fake timers where timed, every test independent (reset
     `document.body.innerHTML`, `document.documentElement` style and attributes, localStorage, stubs with
     `vi.unstubAllGlobals()` in `afterEach`). Cover:
     - `openSheet(dialog)`: opens with `showModal` (if happy-dom lacks it, stub `HTMLDialogElement.prototype.showModal`
       and `close` in the test to toggle `open` and dispatch `close`); a second call on an open dialog returns a
       closer and does not reopen; the returned closer with reduced motion (stub `matchMedia` to match
       `(prefers-reduced-motion: reduce)`) closes at once; without reduced motion it sets `data-closing`,
       closes on `animationend` from the dialog (not from a child) or after 260 ms; `cancel` is prevented and
       closes; `keydown` Escape stops propagation; a click on the dialog outside its rect closes, inside does
       not; a click on `[data-sheet-close]` closes; focus returns to the opener on `close` when it is still
       connected; listeners are removed after close (a second `cancel` does nothing); swipe: pointerdown
       (pointerType 'touch', isPrimary, on `.nish-sheet-header`, `matchMedia('(min-width: 640px)')` false),
       pointermove sets `translateY(...)`, pointerup past 30% of the height or with velocity > 0.5 closes,
       a short drag springs back (transition set, transform cleared) and `pointercancel` never closes; a
       mouse pointerdown is ignored; at 640px and up the swipe is ignored.
     - `mountHeightVar(el, name)`: writes `${offsetHeight}px` (stub `offsetHeight` with `Object.defineProperty`),
       removes the property at height 0, rewrites on ResizeObserver callback (stub `ResizeObserver` capturing
       the callback) and on `resize` when ResizeObserver is undefined, cleanup disconnects and removes it.
     - `mountStuck(el, onChange)`: returns a no-op without IntersectionObserver; with a stubbed
       IntersectionObserver and `getBoundingClientRect`/`getComputedStyle` stubs: stuck only when
       `position: sticky`, top within 1px of the sticky `top`, and scrolled (window.scrollY > 0 or an ancestor
       scrollTop > 0); `data-stuck` toggles and `onChange` fires once per change; the observer is rebuilt
       with `rootMargin: '<-top-1>px 0px 0px 0px'` when `top` changes; cleanup removes the scroll listener,
       disconnects and clears `data-stuck`.
     - `mountScrollspy(nav, opts)`: links without a target are skipped; the first link is current at the top;
       the last section whose top passed the line becomes `aria-current="true"` and the previous loses it;
       at the bottom of the page the last link with a target is current; `offset` overrides the line;
       `height: false` does not write `--nish-sticky-extra`, default does; `data-at-start`/`data-at-end`
       follow `scrollLeft`; a click on a link activates it; a malformed `#%E0%A4%A` hash is ignored; updates
       are batched in one animation frame; cleanup cancels the frame and removes attributes and listeners.
     - `mountChecklist(list)`: restores checked ids from `localStorage[data-store]`, ignores corrupt JSON and
       a non-array, saves on change, ignores a change from a non-checkbox, writes "2 of 3" and `--p: 66.6...%`
       to the `.nish-checklist-progress` before the list, falls back to one in the parent, counts without
       `data-store`, survives throwing storage, cleanup removes the listener.
     - The uncovered branches in `src/theme.ts` lines ~336-346 (`themeLabel` for a registered non-preset
       theme: capitalized name) and ~660-670 (`mountTooltips` Escape hides open tips with
       `data-tooltip-hidden`), and every `typeof document === 'undefined'` early return reachable by
       stubbing `document` to undefined with `vi.stubGlobal`.
  2. `stryker.config.mjs`:
     ```js
     // Mutation testing of src/theme.ts, run on demand with `npm run mutation` (not in CI).
     export default {
       testRunner: 'vitest',
       plugins: ['@stryker-mutator/vitest-runner'],
       vitest: { configFile: 'vitest.config.ts', related: true },
       mutate: ['src/theme.ts'],
       coverageAnalysis: 'perTest',
       ignoreStatic: true,
       disableTypeChecks: false,
       reporters: ['clear-text', 'progress', 'json'],
       jsonReporter: { fileName: 'reports/mutation/theme.json' },
       thresholds: { high: 80, low: 65, break: null },
       tempDirName: '.stryker-tmp',
     };
     ```
  3. `vitest.config.ts`: add to `coverage.thresholds` a per-file entry `'src/theme.ts': { lines: 90, statements: 88, branches: 80, functions: 90 }`
     (use the measured values rounded down if they are lower than these, but never below lines 90), and a
     comment line: "theme.ts has its own floor (the ui-leftovers tests); raise it, never lower it."
     Leave the global thresholds as they are.
- Edge cases: tests must not leak `matchMedia`, `ResizeObserver`, `IntersectionObserver` or storage stubs into
  `src/theme.test.ts` (run the two files together and in either order).
- Acceptance:
  - `npx vitest run src/theme-helpers.test.ts src/theme.test.ts src/theme-init.test.ts --project dom --coverage --coverage.include=src/theme.ts --coverage.reporter=text`: theme.ts lines >= 90%.
  - `npm run test:unit -- --coverage` passes (global and per-file thresholds).
  - Mutation (local only, 10-30 min): `npm install --no-save --no-audit --no-fund @stryker-mutator/core@10.1.1 @stryker-mutator/vitest-runner@10.1.1 && npx stryker run stryker.config.mjs`:
    score >= 65% and <= 40 "no coverage" mutants; then `git status --porcelain package.json package-lock.json` is
    empty. Put the score, killed, survived and no-coverage counts in the task result (T3 writes them in DEVELOPING.md).
    If the score is under 65%, add tests for the surviving mutants listed in `reports/mutation/theme.json` until it is not.
  - `npm run typecheck && npx eslint src/theme-helpers.test.ts stryker.config.mjs vitest.config.ts`.

### T4 Docs site: chunks, lazy docs, fewer frames, fleet-only label

- Owns: `site/main.tsx`, `site/shell.tsx` (new), `site/vite.config.ts`, `site/env.d.ts`, `site/docs-meta.mjs` (new),
  `site/docs-meta.d.mts` (new), `site/lib/docs.ts` (new), `site/lib/frame-guard.ts` (new), `site/lib/search.ts`,
  `site/pages/component.tsx`, `site/pages/frame.tsx`, `site/pages/wall.tsx`, `site/pages/overview.tsx`,
  `site/pages/getting-started.tsx`, `site/pages/static-sites.tsx`, `site/components/types.ts`,
  `tools/site-bundle-check.mjs` (new), `tools/docs-meta.test.ts` (new), `tools/site.visual.json`, `.gitignore`
- Reads: `site/components/index.ts` (do not edit), every `site/components/*.tsx` (do not edit), `site/docgen.mjs`,
  `site/lib/ui.tsx`, `site/lib/router.ts`, `tools/visual-check.mjs`, `tools/docgen-coverage.test.ts`
- Depends on: none
- Change:
  1. `site/docs-meta.mjs` (`import ts from 'typescript'`): parse `site/components/index.ts`; map each named
     import `{ a } from './x'` to `x.tsx`; read the array literal of `export const COMPONENT_DOCS` (identifiers
     in order). For each identifier, parse its file, find the exported `const` of that name, unwrap
     `as`/`satisfies`/parentheses to an object literal, and read: `id`, `name` (string or no-substitution
     template literal), `summary` (same, or a `+` chain of them), `exports` (array of string literals),
     `framed` (object literal with numeric `height`), `fleetOnly` (`true`/`false`). Anything else throws
     `docs-meta: site/components/<file>: "<prop>" must be a literal`. Missing doc file or identifier throws
     `docs-meta: <identifier> is not exported by site/components/<file>`. `.d.mts` declares `DocMeta` and `docsMeta`.
  2. `site/vite.config.ts`: keep `themeInit`, `staticExample`, `docs()`; add plugins
     - `virtual:nish-pkg`: `export default { name, version, distFiles }` (same values as docgen has now);
     - `virtual:nish-docs-meta`: `export default <JSON of docsMeta(root)>`, invalidated in `handleHotUpdate` for
       files under `site/components/`;
     - `nish-site-stats` (`apply: 'build'`): in `generateBundle(_, bundle)` collect every chunk's
       `fileName`, gzip size (`zlib.gzipSync(code).length`), `imports`, `dynamicImports`, and `facadeModuleId`
       made relative to the repo root with `/`, mark the `isEntry` chunk, and write `.site-stats.json` at the
       repo root (not in `outDir`).
     Set `chunkSizeWarningLimit: 500`.
  3. `site/env.d.ts`: declare `virtual:nish-pkg` (`{ name: string; version: string; distFiles: string[] }`) and
     `virtual:nish-docs-meta` (`DocMeta[]`, type imported from `../site/docs-meta.mjs` declarations or restated).
  4. `site/components/types.ts`: add to `ComponentDoc`
     `/** Built for the nish.software apps only: the page shows the Fleet-only callout. */ fleetOnly?: boolean;`
  5. `site/lib/docs.ts`: as in Design. `const modules = import.meta.glob<Record<string, unknown>>('../components/*.tsx');`
     `loadDoc(id)` -> `loadDocModule(meta.file)` -> `module[meta.exportName] as ComponentDoc`; unknown id
     rejects with `Error('No doc called <id>')`. Promises cached in a `Map` so `use()` gets the same promise.
  6. `site/lib/frame-guard.ts`: move `guardFrameFocus` here from `pages/frame.tsx` unchanged.
  7. `site/main.tsx`: only `./styles.css`, `createRoot`, `lazy`/`Suspense`, `initTheme` from `'../src/theme'`,
     `guardFrameFocus`, `useRoute`. Frame: `guardFrameFocus()`, else `initTheme()` (both before render, as now).
     `const Shell = lazy(() => import('./shell'))` (default export) and
     `const FramePage = lazy(() => import('./pages/frame').then((m) => ({ default: m.FramePage })))`;
     `App` renders `<Suspense fallback={null}>` around the one it needs.
  8. `site/shell.tsx` (default export `Shell`): today's `Shell`, `NavList`, `Chevron`, `NAV`, `MARK`, `MAC`,
     `GITHUB`, `page()` moved from main.tsx, with: nav and page lookup from `DOCS`; every page component
     `lazy(() => import('./pages/<file>').then((m) => ({ default: m.<Name> })))` (Overview, GettingStarted,
     StaticSites, Changelog, Themes, ThemingApi, Color, Typography/Spacing/Elevation/ZIndex from foundations,
     Icons, Patterns, Wall, Component); the `<div data-page ...>` block wrapped in
     `<Suspense key={route.path} fallback={<PageLoading />}>`; name and version from `virtual:nish-pkg`;
     search opening loads `Promise.all([cssItems(), propItems()])` and appends both (failure: append `[]`).
  9. `site/lib/search.ts`: `baseItems` uses `DOCS` (no docgen import at top level; no Props group);
     new `export async function propItems(): Promise<CommandItem[]>` imports `virtual:nish-docgen` dynamically
     and returns today's Props items; `hasDoc` uses `DOCS`.
  10. `site/pages/overview.tsx`, `getting-started.tsx`, `static-sites.tsx`: read `version`/`distFiles` from
      `virtual:nish-pkg`; overview's count is `DOCS.length`.
  11. `site/pages/frame.tsx`: `const doc = use(loadDoc(route.segments[1]))` (unknown id: render nothing,
      catch by checking `docMeta(id)` first); rest unchanged.
  12. `site/pages/wall.tsx`: `const docs = use(loadAllDocs())`; filter on name and summary as now; fleet-only
      badge (Design, UI).
  13. `site/pages/component.tsx`: `const doc = use(loadDoc(id))`; `RealModalButton` via
      `lazy(() => loadDocModule('modal.tsx').then((m) => ({ default: m.RealModalButton as ComponentType })))`
      inside a `<Suspense fallback={null}>`; fleet-only callout (Design, UI); `AllThemes` story select for
      framed docs (Design, UI) with state `useState(doc.stories[0]?.id)`, frames
      `frameUrl(doc, { story, theme })`, `key={story + theme}`; no other behavior change. Import
      `docgen` from `virtual:nish-docgen` here (this page is its own chunk).
  14. `tools/site-bundle-check.mjs`: reads `.site-stats.json` (missing: exit 1 with
      `site-bundle-check: run the site build first (.site-stats.json is missing)`). Closure of a chunk = it
      plus its static `imports`, recursively. Route sets: `/overview` = closure(entry) + closure(facade
      `site/shell.tsx`) + closure(facade `site/pages/overview.tsx`); `/components/button` = entry + shell +
      `site/pages/component.tsx` + `site/components/button.tsx` + the chunk holding `virtual:nish-docgen`
      (facade `\0virtual:nish-docgen` or the dynamic import of component.tsx whose name contains `docgen`;
      the T4 builder picks the rule after looking at the stats); `/frame/modal` = entry +
      `site/pages/frame.tsx` + `site/components/modal.tsx`. Sum gzip per route (each chunk once), print a
      table `route  gzip KB  budget`, exit 1 when any route is over its budget (`BUDGETS` constant at the
      top, Design's caps, then lowered to measured + rounding). Print the largest raw chunk too.
  15. `tools/docs-meta.test.ts` (Vitest): `docsMeta(root)` equals `COMPONENT_DOCS.map((d) => ({ id, name,
      summary, exports, framed, fleetOnly }))` with the same order (drop undefined keys before comparing), and
      every meta `file` exists.
  16. `tools/site.visual.json`: add `{ "name": "modal-themes", "url": "http://localhost:5191/#/components/modal/themes", "waitFor": "[data-page]", "settle": 1500 }`.
  17. `.gitignore`: add `.site-stats.json`.
- Edge cases: a hash route to an unknown component shows today's "No page at ..." (meta lookup fails before
  any load); a chunk load error (offline) leaves the spinner: acceptable, no retry UI; theme switch on the
  All-themes view keeps the picked story; `#/frame/<id>` without `story` renders `doc.render(args)` as now;
  dev server (`npm run dev:site`) works and a doc edit hot-reloads.
- Acceptance:
  - `npm run build && npx vite build --config site/vite.config.ts && node tools/site-bundle-check.mjs` passes;
    paste its table in the task result (the orchestrator compares with the 460.7 KB gzip single chunk).
  - `npx vitest run tools/docs-meta.test.ts tools/docgen-coverage.test.ts`.
  - `npm run typecheck && npx eslint site tools/site-bundle-check.mjs tools/docs-meta.test.ts && npm run th-check`.
  - `CI=1 npx vite preview --config site/vite.config.ts --port 5191 --strictPort &` then
    `node tools/visual-check.mjs tools/site.visual.json` with no problems; look at the 360, 840 and 1440 shots
    of overview, modal, modal-themes, button-themes in light and dark. In a browser on that server:
    `#/components/modal/themes` has exactly 7 `iframe` elements (`document.querySelectorAll('main iframe').length`);
    changing the Story select reloads all 7 to that story; the network panel shows the page and doc chunks
    loading on navigation. Stop the preview server afterwards.

### T5 Wave 3 parity cases and touch/focus regression specs

- Owns: `tests/elements/parity.spec.ts`, `tests/elements/react.tsx`, `tests/elements/elements.ts`,
  `tests/elements/touch-focus.spec.ts` (new), `tests/elements/data.html`, `src/css/components.css`
  (only to close a parity gap the new cases find)
- Reads: `tests/elements/data.spec.ts`, `tests/elements/data.ts`, `src/components/{data,filters,media,nav,settings,command,charts}.tsx`,
  `src/elements/*.ts`, `playwright.config.ts`
- Depends on: none
- Change:
  1. `parity.spec.ts`: add `setup?: (page: Page) => Promise<void>` to `Case`, called on both pages after the
     box is found and before measuring (document it in the header comment). Header comment: list the new cases.
  2. New fixture ids (same id in `react.tsx` `WAVE3` and `elements.ts` `WAVE3`):
     - `split-column`: React `SplitStage` with a two-pane `dir: 'col'` layout (`{ type: 'split', dir: 'col', sizes: [50, 50], children: [leaf(0), leaf(1)] }`,
       same props as `split-row`), element `<nish-split orientation="column" sizes="50,50">` with the same two panes.
     - `nav-rail-tools`: React `NavRail` with `RAIL_ITEMS`, `tools` = one Search link, `footer` = a theme toggle button,
       `showFrom="sm" hideFrom={false}`; element: the markup from the components.css comment (~3982-3983):
       `.nish-nav-rail-tools` with one `.nish-nav-rail-item`, `.nish-nav-rail-footer` with a `.nish-theme-btn`.
     - `scroll-row-bleed`: `ScrollRow bleed` vs `<nish-scroll-row bleed label="Topics">`, same chips as `scroll-row`.
  3. New cases (selectors: read the rendered DOM at `http://localhost:5194/react.html?c=<id>` and
     `/index.html?c=<id>`; prefer the role or class the component documents):
     - `filter bar chip` (existing `filter-bar`, sizes 1440): the pressed chip in the chips row
       (element `.nish-filter-bar-chips .nish-chip[aria-pressed="true"]`).
     - `filter bar trailing` (`filter-bar`, sizes 1440): the trailing select (element `.nish-filter-bar-trailing select`).
     - `media row detail` (`media-row`): body = the detail line (element `.nish-media-row-detail`).
     - `split column first pane`, `split column divider` (`split-column`, run 1440; the divider ignores
       `box.height` and `box.borderRadius`, the mirror of `split divider`).
     - `nav rail tools item`, `nav rail footer` (`nav-rail-tools`, sizes 1440).
     - `scroll row bleed` (`scroll-row-bleed`, run 360 and 1440).
     - `settings section actions` (`settings-section`): the Reset button (element `.nish-settings-section-actions .nish-btn`).
     - `command item hint` (`command`): the hint of the selected option (element `[role="option"][aria-selected="true"] .nish-command-item-hint`).
     - `command empty` (`command`, setup: type `zzzz` into the palette input): the empty message (element `.nish-command-empty`).
     - `line chart tooltip`, `bar chart tooltip` (`line-chart`, `bar-chart`; setup: hover the center of the
       chart svg and wait for the tooltip): the tooltip box (element `.nish-chart-tooltip`).
     - `split divider dragging` (`split-row`, run 1440; setup: `page.mouse.move` to the divider center and
       `page.mouse.down()` without `up`): compare only `box.backgroundColor` of the visible bar (React: the
       separator's visible bar element in `SplitDividers`; element: the separator itself), `ignore` every other
       measurement.
  4. A difference these cases find is fixed in `src/css/components.css` on the element side (inside `:where()`,
     matching the file's style), never listed in `KNOWN_GAPS`. If closing it would need a React change,
     stop and report the case, the values and why.
  5. `touch-focus.spec.ts` (load pages like data.spec.ts; contexts `browser.newContext({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })`
     for coarse, plain `{ viewport }` for fine):
     - "chips, tabs and sort buttons are 44px targets under a coarse pointer": at 360x780 and 840x900 coarse,
       on `/data.html` and `/forms.html`, every visible `button.nish-chip`, `.nish-chip-group button`, `.nish-tab`,
       `.nish-th-sort` has `width >= 43.5`, `height >= 43.5` and `width >= scrollWidth - 0.5`; every
       `span.nish-chip` has computed `min-width: 0px`. At 1440x900 fine, a `.nish-chip` computed `min-width` is not `44px`.
     - "the command input shows no focus ring": open `#cp` with Ctrl+K (or the `open` property if it has no
       `hotkey`), Tab away and Shift+Tab back to the input: `outline-style: none` and `outline-width: 0px`; the
       selected option's background differs from the list's (a visible current item stays). Then inject
       `<div class="nish-command"><input class="nish-command-input" aria-label="a"></div>` and
       `<div class="nish-command"><div class="nish-command-input"><input aria-label="b"></div></div>`, focus each
       with the keyboard (Tab from a button placed before it): both `outline-style: none`.
     - "split panes stack under a coarse pointer below 640px": at 360x780 coarse: `#sp-row`, `#sp-col`,
       `#sp-nest` and `#sp-inner` have computed `flex-direction: column`, all their `.nish-split-divider` are
       hidden, each pane is >= 255px tall, and `document.documentElement.scrollWidth <= innerWidth`.
       At 840x900 coarse: `#sp-row` is `row`, its dividers are visible and the divider's `::before` has
       `left: -20px` and `right: -20px` (a 44px hit area). At 360x780 fine: `#sp-row` is `row`.
- Edge cases: every new case runs in light and dark at its sizes; a case hidden at a run size must be hidden
  in both versions (the existing rule).
- Acceptance: `npm run build`, then `CI=1 npx playwright test tests/elements` (all pass; `PARITY_VERBOSE=1`
  prints differences while working), `npm run typecheck`, `npx eslint tests/elements`, and if components.css
  changed `npm run check` (contrast, th-check, size).

### T3 Fleet-only subpaths, docs and wiring (runs last)

- Owns: `src/inbox.ts` (new), `src/service-tokens.ts` (new), `src/system-canvas.ts`, `package.json`, `tsup.config.ts`,
  `scripts/build.mjs`, `tools/exports.test.mjs`, `tools/api-surface.snapshot.json`, `tests/consumers/ts/src/consumer.tsx`,
  `site/components/inbox.tsx`, `site/components/service-tokens.tsx`, `site/components/system-canvas.tsx`,
  `README.md`, `docs/DEVELOPING.md`, `CHANGELOG.md`, `CLAUDE.md`
- Reads: `src/index.ts`, `src/components/inbox.tsx`, `src/components/service-tokens.tsx`, `src/inbox-types.ts`,
  `src/service-token-types.ts`, T1/T2/T4 results
- Depends on: T1 (bench tool), T2 (stryker config, mutation numbers), T4 (`fleetOnly` field, bundle check tool)
- Change:
  1. `src/inbox.ts`:
     ```ts
     // nish-ui/inbox: the Inbox component, its labels and the inbox data types. Fleet-only: built for the
     // nish.software apps, may change in a minor release. The same names stay on the root entry through 2.x.
     export { Inbox } from './components/inbox';
     export type { InboxProps, InboxLabels } from './components/inbox';
     export { DEFAULT_INBOX_LABELS } from './components/inbox-classes';
     export { INBOX_SOURCE_LABELS, INBOX_DEFAULT_SETTINGS, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS } from './inbox-types';
     export type { InboxItem, InboxView, InboxSeverity, InboxSettings, InboxListResponse, InboxAction, InboxActionResult, InboxActionCall } from './inbox-types';
     ```
     `src/service-tokens.ts`: the same header (service tokens), exporting `ServiceTokensSection`,
     `useServiceTokens`, types `ServiceTokensSectionProps`, `UseServiceTokens`, and `ServiceTokenView`,
     `ServiceTokenListResponse`, `ServiceTokenRevokeResponse` from `./service-token-types`.
     `src/system-canvas.ts`: add "Fleet-only: built for the nish.software apps, may change in a minor release." to its comment.
  2. `package.json`: the two `exports` entries (Design) after `./system-canvas`; `typesVersions` `inbox` ->
     `./dist/inbox.d.ts`, `service-tokens` -> `./dist/service-tokens.d.ts`; scripts: `check` gets
     `&& node tools/canvas-route-bench.mjs --check` right after `node tools/canvas-route-check.mjs`;
     `build:site` becomes `npm run build && vite build --config site/vite.config.ts && node tools/site-bundle-check.mjs`;
     new `"mutation": "npm install --no-save --no-audit --no-fund @stryker-mutator/core@10.1.1 @stryker-mutator/vitest-runner@10.1.1 && stryker run stryker.config.mjs"`.
     No dependency changes.
  3. `tsup.config.ts`: the dts-only block's entry gets `inbox: 'src/inbox.ts', 'service-tokens': 'src/service-tokens.ts'`
     (update its comment). `scripts/build.mjs`: add `'inbox', 'service-tokens'` to the `buildEsm` entries and
     `'inbox.js', 'service-tokens.js'` to the `testEsmBuild` list.
  4. `tools/exports.test.mjs`: add `./inbox`, `./service-tokens` to the dist/esm list, and a test
     "fleet-only subpaths re-export the root's values": for `./inbox`, `./service-tokens`, `./system-canvas`,
     every runtime export of the subpath is `===` the root's export of the same name.
  5. `tests/consumers/ts/src/consumer.tsx`: import `Inbox` from `nish-ui/inbox` and `ServiceTokensSection` from
     `nish-ui/service-tokens` and use each the way the file uses `SystemCanvas` (type check only).
  6. Docs pages: `inbox.tsx` `importLine: "import { Inbox } from '@nish/ui/inbox'; // also on '@nish/ui' through 2.x"`,
     `fleetOnly: true`; `service-tokens.tsx` the same with `ServiceTokensSection, useServiceTokens` and
     `'@nish/ui/service-tokens'`; `system-canvas.tsx` `"import { SystemCanvas } from '@nish/ui/system-canvas'; // also on '@nish/ui' through 2.x"`,
     `fleetOnly: true`. Usage samples in those three files import from the subpath too.
  7. `README.md`: Entry points table gains `nish-ui/inbox` ("The inbox list (fleet-only)") and
     `nish-ui/service-tokens` ("Service token settings (fleet-only)"); the `nish-ui/system-canvas` row says
     "(fleet-only)". New short section before "Bundle size":
     "## Fleet-only APIs\n\n`Inbox`, `ServiceTokensSection`, `useServiceTokens`, `SystemCanvas` and the server kit
     (`nish-ui/server`, `nish-ui/server/hono`, `nish-ui/inbox-client`) are built for the nish.software apps. They
     can change in a minor release; patches only fix. Import them from their own entry points
     (`nish-ui/inbox`, `nish-ui/service-tokens`, `nish-ui/system-canvas`); the root entry keeps them through 2.x.
     Everything else follows semver." (absolute links only; no table wider than 3 short columns.)
  8. `docs/DEVELOPING.md` Checks table rows: `node tools/canvas-route-bench.mjs` ("routing time at 100-1000
     nodes; `--check` (in `check`) fails over 60 ms at 500 nodes"), `node tools/site-bundle-check.mjs` ("JS per
     docs route from `.site-stats.json`; run by `build:site`"), `npm run mutation` ("Stryker on src/theme.ts,
     local only; installs Stryker without saving it; report in reports/mutation/"), with the T2 measured score
     ("theme.ts: <score>% on 2026-11-05"). The docs site paragraph: docs load per page; a doc's id, name,
     summary, exports, framed and fleetOnly must be literals (`site/docs-meta.mjs`).
  9. `CLAUDE.md` Traps: extend the SystemCanvas line with "`tools/canvas-route-bench.mjs` times routing and
     `route-golden.test.ts` pins its output: a routing change that is meant to change lines regenerates the
     hashes with `NISH_ROUTE_GOLDEN_PRINT=1`". Add one line: "Docs site docs are lazy chunks: `site/docs-meta.mjs`
     reads each doc's id, name, summary, exports, framed and fleetOnly from the source, so they must be literals."
  10. `CHANGELOG.md` `## [2.1.0] - 2026-11-05` (see Decisions), `### Added`: the two subpaths;
      `### Changed`: "`routeEdges` (and SystemCanvas) route large maps much faster: 500 nodes in about 5 ms
      instead of 100+ ms, with the same lines."; "Inbox, ServiceTokensSection and SystemCanvas are marked
      fleet-only in the docs; their root exports stay through 2.x." Docs-site and test changes are not listed.
  11. Rebuild and regenerate the API snapshot: `npm run build && UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`.
- Acceptance (this is also the integrate gate; every step of ci.yml):
  `npm run check && npm run test:tools && npm run test:unit -- --coverage && npm run size &&
  CI=1 npx playwright test && npm run build:site && node tools/consumer-check.mjs ts`, plus the demo and site
  visual checks from ci.yml (`CI=1 npx vite --config demo/vite.config.ts --port 5190 --strictPort &`,
  `node tools/visual-check.mjs tools/demo.visual.json`; site as in T4). `git diff --stat` shows no
  `src/index.ts`, `tools/size-budgets.json` or lockfile change.

## Waves

W1: T1, T2, T4, T5 (no shared files) · W2: T3 (needs T1, T2, T4) · then review, fix, integrate.

## Review focus

- Router identity: the golden hashes were generated from the unmodified router (rerun the golden test against
  `git show origin/master:src/components/canvas/route.ts`), the lazy candidate order equals the old sort, and
  the fallback is the same element. Bench numbers are real.
- Docs site: every page and every component page renders at 360, 840 and 1440 in light and dark; search still
  finds props, tokens and classes; frames still guard focus; no chunk or stats file leaks into `site-dist/`
  beyond the build's own assets; `docs-meta` errors are clear; the All-themes view has 7 frames.
- theme tests: no stub leaks between test files; tests assert behavior, not implementation trivia; the
  mutation numbers are from a real run.
- Subpaths: `===` identity with the root, `"use client"` on the component modules they reach, types
  resolve under `node16` and `bundler` (consumer ts matrix), README wording (public repo: no passwords).
- Parity: new cases measure the intended node in both versions (not the wrapper); CSS fixes inside `:where()`
  do not change the React-side look or any existing case.

## Release

The session runs it, not a subagent.

1. Final commit `ui-leftovers: release`: delete `docs/specs/ui-leftovers.md`; in `ROADMAP.md` delete
   "**Wave 3 element follow-ups**" and rewrite "**Other 2.0 leftovers**" to exactly:
   `- **Other 2.0 leftovers** (2026-11-03): a CommonJS build and React 18 support, only if an outside user asks. In 3.0, remove the \`Switch\` \`onChange(checked, event)\` signature in favor of \`onCheckedChange\`, and take the fleet-only names (Inbox, ServiceTokensSection, useServiceTokens, SystemCanvas and their helpers) off the root entry; they stay on \`nish-ui/inbox\`, \`nish-ui/service-tokens\` and \`nish-ui/system-canvas\`.`
   If SystemCanvas went over its size budget and the orchestrator has not resolved it, add nothing here; report it.
2. `git fetch && git merge origin/master` (other ui sessions merge in this batch), regenerate the API snapshot
   after the merge (`npm run build && UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`), keep both
   sides of README/CHANGELOG/DEVELOPING/package.json, and run the full T3 acceptance again.
3. Push, open ONE PR `ui-leftovers: docs-site chunks, faster canvas routing, theme.ts tests, fleet-only subpaths, wave 3 specs`
   with the spec link at the spec commit, wait for every check (ci check, browsers, consumers, visual/Fold,
   codeql), merge with `gh pr merge <n> --merge --delete-branch`.
4. Do NOT dispatch `release.yml`. Tell the orchestrator (parent session): "ui ready for release" with the
   merge sha, the bundle-check table, the bench numbers, the SystemCanvas size and the mutation score. The
   orchestrator cuts one batched minor (2.1.0) after all ui sessions merge.
5. Live check after the orchestrator's release reaches hosting (the hosting `ui/v2.1.0` bump moves
   `static/design`): `curl.exe -s -o NUL -w "%{http_code}" https://design.nish.software/` is 200;
   in a browser at 360x780, 840x900, 1440x900, light and dark: `#/overview` loads several `assets/*.js`
   chunks (not one 1.5 MB file), `#/components/modal/themes` has 7 iframes, `#/components/inbox` shows the
   Fleet-only callout, search finds a prop name. `npm view nish-ui@2.1.0 exports` lists `./inbox`.
   No app adoption is needed (nothing changed for consumers that import from the root).

## CI budget

- nishant/ui is public: its GitHub-hosted minutes are free and do not count against the 3,000 private minutes.
  Branch pushes trigger no CI; only the PR and the master push do.
- One PR for the whole spec, opened only after every check in ci.yml and codeql passes locally (T3 acceptance
  is that list). Review fixes are pushed as one batch. No empty commits or re-runs to retrigger, except one
  re-run for a check that flaked (say which and why in the PR).
- No workflow file changes; no new jobs; no Windows or macOS jobs. Stryker never runs in CI.
- Estimate (public, free): PR run about 60 runner-minutes (check ~15, browsers ~8, consumers 3 x ~6, Fold
  visual ~12, codeql ~6), at most 2 PR runs plus the master push (~35): about 155 free minutes. Private
  minutes from this build: 0. The batched ui release is the orchestrator's: one minor fans out to ~13 private
  repos (each a PR check plus a Fold check, roughly 15-20 private minutes per repo, ~200-260 in all), which is
  why this spec never releases on its own.

## Parallel sessions

Other sessions building in nishant/ui at the same time: appshell-gaps (AppShell, overlay.js split,
`tools/size-budgets.json`), picker-carousel (DatePicker, Calendar, MultiSelect, Carousel), tree-virtual
(VirtualList, VirtualTable, ContextMenu, HoverCard, TreeView). Each works in its own worktree and branch; no
other session in this batch touches nishant/ui.

- Ownership: this spec never edits `src/index.ts`, `site/components/index.ts`, `src/components/overlay*`,
  `src/components/app-shell.tsx`, `src/components/canvas/system-canvas.tsx` or `tools/size-budgets.json`.
  It owns `site/main.tsx`, `site/shell.tsx`, `site/vite.config.ts`, `site/pages/component.tsx`,
  `site/lib/search.ts`, `site/components/types.ts`, `src/components/canvas/route.ts`, `tests/elements/*`.
- New docs from the other sessions keep working with no change on their side, provided their doc objects
  use literal id, name, summary, exports and framed (the existing pattern). If they merge first, this
  branch's merge runs `docs-meta` over their docs; if this merges first, their rebase does. A failure names
  the file and property: make it a literal.
- Shared files merged by keeping both sides: `README.md` (they add component names to the bullet lists; this
  spec edits the Entry points table and adds "Fleet-only APIs"), `CHANGELOG.md` (one shared
  `## [2.1.0] - 2026-11-05` section), `docs/DEVELOPING.md`, `CLAUDE.md`, `package.json` (scripts and exports
  only, no dependency changes here), `tools/site.visual.json`, `src/css/components.css` (only if T5 closes a gap).
  `tools/api-surface.snapshot.json` is never hand-merged: rebuild and regenerate it after every merge of master.
- Size: this spec adds at most 0.3 KB to SystemCanvas and nothing to the root bundle. appshell-gaps owns the
  budgets; if SystemCanvas fails `npm run size` here, hand the measured number to the orchestrator.
- Ports: the four ui sessions share the harness ports (5190, 5191, 5193, 5194, 5195). Run with `CI=1`
  (`--strictPort`, no server reuse); a busy port means another session's run: wait for it, never test against it.
- Merge order is free: before merging, `git fetch && git merge origin/master`, regenerate the snapshot, rerun
  the T3 acceptance. The orchestrator releases once all four ui PRs are merged.

## Open questions for the research phase

- Does rolldown (Vite 8) give `facadeModuleId`, `imports` and `dynamicImports` on output chunks in
  `generateBundle`, and how is the `virtual:nish-docgen` chunk named (T4 step 14)?
- Does happy-dom 21 implement `HTMLDialogElement.showModal`/`close`, `IntersectionObserver` and
  `ResizeObserver` (T2 stubs what is missing)?
- Does `npm install --no-save` leave `package-lock.json` untouched with npm 11 (T2 acceptance checks it)?
- Which element in React `SplitDividers` is the visible 4px bar during a drag (T5 `split divider dragging`)?
