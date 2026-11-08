# @nish/ui 3.0

Status: in progress · Slug: ui-3 · Date: 2026-11-07 · Size: large
Repos: nishant/ui (spec lives here), nishant/nishant.github.io (startpage), nishant/status, nishant/trackers,
nishant/workflows, nishant/job-apps, nishant/trading, nishant/nishboard, nishant/streams; adoption only (no code):
nishant/nish.software, nishant/artifacts, nishant/inbox, nishant/mc-packs, nishant/skills, nishant/hosting,
taarora/arora-home (by hand).
ROADMAP: `ROADMAP.md` in ui, entries "Root bundle back to 100 KB" and "Other 2.0 leftovers" (3.0 part only).

## Goal

3.0 makes the root entry lighter and drops the last 2.x compatibility shims. Apps import the fleet-only
components from their own entry points, the AppShell gets back under its 34 KB target, and `Switch` has one
callback. It ships as exactly one release (3.0.0), because every ui release opens a bump PR in every app and
costs Actions minutes.

1. `nish-ui` (the root entry) no longer exports Inbox, ServiceTokensSection, useServiceTokens, SystemCanvas
   and their helpers and types. They stay on `nish-ui/inbox`, `nish-ui/service-tokens` and
   `nish-ui/system-canvas` (which gains `DEFAULT_CANVAS_LABELS`).
2. Every component reads only the string defaults it uses (per-component string groups), so a component no
   longer carries all 138 strings.
3. The Toaster loads its toast cards on demand and shows a plain card while the chunk loads or when it cannot load.
4. `npm run size`: AppShell at most 34.0 KB gzip (2.1.1: 35.04); everything from `nish-ui` about 117.7 KB
   (2.1.1: 136.27). 100 KB is not reached; see Decisions for what it would take.
5. `Switch` has no `onChange(checked, event)` prop; `onCheckedChange(checked)` is the only callback, and a
   leftover `onChange` is a type error.
6. A migration guide: `docs/MIGRATING-3.0.md`, shown on design.nish.software at `#/migrating`, linked from the
   3.0.0 CHANGELOG entry and from Getting started.
7. Every app's default branch builds on 2.x and on 3.0 before 3.0 is released (prep PRs), and every app is on
   3.0.0, deployed and green after it.

## Out of scope

- A CommonJS build and React 18 support. ROADMAP keeps the sentence "a CommonJS build and React 18 support,
  only if an outside user asks".
- Moving general components (flow, split, charts, media, calendar...) off the root entry to reach 100 KB.
- Replacing tailwind-merge (about 8 KB gzip in every import, the floor of every size row).
- `PageContainer` `padBottom` (sibling bugfix session) and Calendar/DatePicker range and time modes (sibling
  `range-picker` session). This work starts in ui only after both are merged.
- Doc mentions of `Switch onChange` in hosting's `docs/design-system/audits/*.md` (history; left as is).
- A 2.x release that deprecates the root exports first (it would be a second fan-out).

## Decisions

- **Prep PRs first, then one release.** Each app moves its imports to the subpaths and its Switches to
  `onCheckedChange` in a normal PR against 2.1.x (the subpaths and `onCheckedChange` exist since 2.1.0 and 2.0.0).
  Then the fan-out's held 3.0.0 bump PRs need no code, only an adoption commit. Why: no default branch ever
  imports a removed name, and the held window after the release is short. Cost: about 8 extra PR runs and
  8 deploys (startpage and nishboard are public, so free); estimate about 120 private-runner minutes on top of a
  normal release (status, trackers, workflows, job-apps, trading, streams: one PR run plus one deploy each).
- **App prep can start at once; ui work waits.** The prep PRs touch only app files and work on 2.1.0, so they
  run in wave 1 now. The ui tasks start only after `range-picker` and the `PageContainer padBottom` bugfix are
  merged to ui master (both edit ui files this spec also edits: strings, calendar, date-picker, layout).
- **The 100 KB root target is not reachable in 3.0.** Measured on 2.1.1 (`npm run size` method): the root is
  136.27 KB; without the fleet names 117.52 KB. The string and Toaster changes do not shrink the root (every
  component is in it once anyway). The rest would mean moving general components off the root. Measured
  savings on top of the fleet move: flow 5.4 KB, split 5.0, forms extras (RadioGroup, Slider, TagInput,
  FileDropzone) 5.1, charts 4.8, Calendar+DatePicker 4.4, VirtualList+VirtualTable 4.2. Even flow + split +
  media + charts together end at 101.2 KB, and charts and split are used by six apps. No app pays the root
  number (every app bundles with Vite and tree-shakes; the per-import rows are what they load), so 3.0 stops at
  the fleet move and the budget becomes measured + 0.5. The release commit rewrites the ROADMAP entry to say this.
- **AppShell target 34 is reached by both levers together.** Measured on a patched copy of 2.1.1's dist:
  per-component strings alone 33.89, lazy toast cards alone 34.22, both 33.07 (with exact key lists; the
  groups below pull about 9 extra keys, so expect about 33.2). One lever alone is too close to 34.
- **String groups live in `src/components/strings.ts`** as named exported constants, one per component family,
  every key in exactly one group. `DEFAULT_STRINGS` (still exported, same value) is assembled from them with a
  `/* @__PURE__ */ Object.assign`, so a bundle that uses only some groups drops the rest. Components call a new
  internal hook `useStrings(GROUP, ...)`, typed so that reading a key outside the passed groups is a type error.
  Why one file: no new modules for 26 small objects, and esbuild and Rollup drop unused top-level constants.
- **Public string API unchanged.** `NishProvider strings`, `useNishStrings()`, `useNishConfig()` and
  `DEFAULT_STRINGS` keep their types and values. Only internal callers move to `useStrings` and a new internal
  `useNishContext()` (locale, dir, portal container, raw overrides).
- **Toast fallback** is a plain card (title, body, action, dismiss) shown while the card chunk loads and for the
  rest of the page's life when it fails to load. The live regions already announce every toast, so the text is
  never lost. The chunk is preloaded when the browser is idle, so the fallback is rarely seen.
- **Switch keeps `'onChange'` in its `Omit<ButtonHTMLAttributes, ...>`** so a leftover `onChange` fails
  typecheck instead of silently becoming the native button `onChange` (three app handlers take no arguments
  and would still compile and never fire). At runtime an `onChange` from untyped code is dropped (never
  spread onto the button) and warns once in development.
- **Migration guide is one Markdown file** (`docs/MIGRATING-3.0.md`) rendered on the docs site by the existing
  Markdown renderer, extended with fenced code blocks. One source for GitHub, the site and the CHANGELOG link.
- **Fan-out:** after the release, dispatch the fan-out with `now=true` once npm shows 3.0.0, instead of waiting
  the 2-hour settle, when no other ui release is pending (default). Why: there is exactly one release, and the
  settle only guards against bursts. Adopt each `ui/v3.0.0` PR with an empty commit within a minute of it
  opening, so the app's `cancel-in-progress` PR workflow drops the first run.
- **Branch names:** `ui-3` in every repo (never `ui/...`: the Fold check and the fan-out treat `ui/` branches as
  bump PRs).
- (default) The docs-site route is `#/migrating`, nav label "Moving to 3.0", in the Start group after Changelog.
- (default) `skills/new-site/references/app-template.md` gets its two prose mentions updated in a docs-only
  `[skip ci]` commit during bookkeeping, not a Workflow task.

## Current state

**Entry points.** `src/index.ts` re-exports everything. Lines to remove (2.1.1 line numbers):
`export { SystemCanvas, layoutSystem, pickLayout, routeEdges } from './system-canvas';` and the next 15 lines
(`DEFAULT_CANVAS_LABELS` and the canvas types), the `Inbox` block (`Inbox`, `DEFAULT_INBOX_LABELS`, `InboxProps`,
`InboxLabels`, `INBOX_SOURCE_LABELS`, `INBOX_DEFAULT_SETTINGS`, `INBOX_ACTION_HEADER`, `INBOX_ACTION_TIMEOUT_MS`,
the inbox data types), and `ServiceTokensSection`, `useServiceTokens`, `ServiceTokensSectionProps`,
`ServiceTokenView`, `ServiceTokenListResponse`. The subpath entries are `src/inbox.ts`, `src/service-tokens.ts`
(both say "The same names stay on the root entry through 2.x") and `src/system-canvas.ts`
(`export * from './components/canvas'`; `components/canvas/index.ts` does not export `DEFAULT_CANVAS_LABELS`,
which lives in `components/canvas/types.ts`). `package.json` `exports` and `typesVersions` already list all three
subpaths; `scripts/build.mjs` already builds them.

**Root importers of the moved names inside ui:** `site/components/inbox.tsx:2`, `site/components/system-canvas.tsx:2`
(also `Badge`), `tests/ssr/cases.tsx` (`ui.Inbox` ~:233, `ui.ServiceTokensSection` ~:365, `ui.SystemCanvas` ~:397,
via `import * as ui from '../../src'`; `tests/ssr/ssr.test.tsx` derives component names from the root),
`tools/canvas-layout-check.mjs:8` and `tools/canvas-route-check.mjs:9` (`../dist/esm/index.js`), `site/docgen.mjs`
(`entries` ~:155 holds only index, chart, format, node/vite; `COMPONENTS` lists SystemCanvas, Inbox,
ServiceTokensSection; `FUNCTIONS` useServiceTokens; `INTERFACES` ServiceTokensSectionProps),
`tools/docgen-coverage.test.ts` (allow-lists `UNDOCUMENTED_EXPORTS` ~:57-58 and `UNDESCRIBED_PROPS` ~:90-98 hold
canvas, inbox and token names, with a stale-entry check), `tools/exports.test.mjs:84-95` (asserts the fleet
subpaths re-export the root's values: fails by design in 3.0), `tools/api-surface.snapshot.json` (root list),
`tools/size-budgets.json` (SystemCanvas row `"from": "nish-ui"`). `tests/consumers/ts/src/consumer.tsx:45-47`
already uses the subpaths. Sample strings "also on '@nish/ui' through 2.x": `site/components/inbox.tsx:136`,
`site/components/service-tokens.tsx:83` (and its stale comment :6-8), `site/components/system-canvas.tsx:178` and :250.
`README.md:316` "the root entry keeps them through 2.x".

**Strings.** `src/components/strings.ts`: the `NishStrings` interface (138 keys, each with a JSDoc line) and one
`DEFAULT_STRINGS` object. `src/components/provider.tsx`: `NishContext` holds `{ strings: NishStrings, locale,
dir, portalContainer }` with `DEFAULT_STRINGS` as the default; `NishProvider` merges `{ ...outer.strings,
...strings }`; `useNishConfig()` and `useNishStrings()` read it. Because every component calls `useNishStrings()`,
every component bundle carries all of `DEFAULT_STRINGS` (about 1.5 KB gzip). `src/theme.ts` (the React-free
`nish-ui/theme` entry) reads `DEFAULT_STRINGS.themeSystem/themeLight/themeDark/themeToggleLabel/dismiss`.
Internal `useNishConfig()` callers (for locale, dir or portal container): calendar, charts (4x), date-picker,
hooks, hover-card, menu, nav-items, popover, portal, tooltip. Key usage per module (from the source; `hubLabel`
is read by no component, keep it):

| module | keys |
|---|---|
| accordion | accordion |
| app-shell | sections, loading, more, hubTitle, skipToContent |
| avatar | avatar, avatarMore |
| breadcrumbs | more, breadcrumbs |
| calendar | previousMonth, nextMonth, month, year |
| canvas/legend, canvas/system-canvas | canvasLines; systemMap, zoomOut, zoomIn, fitToScreen, followActivity |
| canvas/node | live |
| carousel | carouselRole, slideRole, slideLabel, previousSlide, nextSlide, goToSlide, slidePicker, startRotation, stopRotation |
| charts | noData, noDataNamed |
| combobox | noMatches, searching, clear |
| command | searchPlaceholder, noResults, results, search, close |
| context-menu | contextMenu |
| data | nothingHere, loadingNamed, sortBy, sortDefault, failedToLoad |
| date-picker | invalidDate, chooseDate, changeDate, dayToken, monthToken, yearToken |
| display | moreCount, dismiss, noDataNamed, copy, copied, hubTitle, moreActions, sections, legend |
| drawer, overlay-dialog | close |
| error-boundary | errorStaleTitle, errorStaleBody, errorTitle, errorBody, errorDetails, errorTryAgain, errorReload |
| feedback | loading, failedToLoad, retry |
| file-dropzone | dropzoneLabel, browseFiles, removeFile |
| filters | filters, clearFilters, done, activeCount, clear, search |
| flow | progress, workflow, activity, other, waiting, noActivity |
| forms | optional, search, clearSearch, remove, removeNamed |
| inbox | inbox* (9), more, loading, retry, cancel |
| layout | actions, loading, retry, offline |
| media | live, offlineBadge |
| menu | menu, back |
| modal | close, cancel |
| more-sheet | more, theme |
| multi-select | noMatches, searching, optionAdded, optionRemoved, maxSelected, removeNamed, clearAll |
| nav, nav-items | sections, more, sidebar, expandSidebar, collapseSidebar; newCount |
| pagination | previousPage, nextPage, pageLabel, paginationLabel |
| progress | progress, progressIndeterminate |
| service-tokens | token* (9 incl. serviceTokens, serviceTokensIntro, loadingServiceTokens), failedToLoad, errorTryAgain, cancel |
| settings | saving, saved, saveFailed, enterNumber |
| slider | sliderMin, sliderMax |
| split | resizeColumns, resizeRows, layoutPresets |
| tag-input | removeTag |
| theme-toggle | theme, themeSystem, themeLight, themeDark, themeToggleLabel, themePreset, themePresetPlaceholder |
| toast (ToastCard) | dismiss |
| virtual-table | sortAnnounce, retry, loadingNamed, nothingHere |

The `range-picker` branch (not on origin yet on 2026-11-07; its worktree `C:\Code\ui-range-picker` had no changes)
will add keys to `NishStrings` for range and time modes, read by calendar and date-picker (and maybe a new
time-field module). T3 covers whatever keys exist on master when it starts.

**Toaster.** `src/components/toast.tsx` (525 lines, `'use client'`) holds the store (`shared('toast')`, timers,
`push`, `toast`, `dismissToast`, pause/resume), `Toaster` (portal, two live regions, `list.map(ToastCard)`), and
`ToastCard` (tone icons `TONE`, swipe-to-dismiss, hover and focus pause, action and dismiss buttons). AppShell
renders `<Toaster {...toaster} />` unless `toaster={false}`, so the whole card ships with AppShell.
`src/components/lazy-module.ts` has `lazyModule`, `useLazyModule(m, when, onError)` and `preloadWhenIdle(m)`, already
used by AppShell for the More sheet (`app-shell-lazy.test.tsx` shows how a failing chunk is tested).
`tests/elements/parity.spec.ts` compares the React toast (page `tests/elements/react.tsx`, toast fired at 50 ms)
with the custom element; `tests/overlay/overlay.spec.ts` checks the live region and inertness only.

**Switch.** `src/components/forms.tsx` ~:278-371: `SwitchProps` omits `'onChange'` from the button attributes,
declares `onChange?: (checked, event) => void` ("Kept for 2.x") and `onCheckedChange?`, and the click handler calls
both. Callers in ui still passing `onChange`: `src/components/forms.test.tsx` (test "keeps onChange(checked,
event)" ~:290-298 and about 20 more), `tests/ssr/cases.tsx:368,395`, `tests/elements/react.tsx:178-181`,
`tests/a11y/main.tsx:137`, `tests/consumers/ts/src/consumer.tsx:116`, `site/pages/component.tsx:135`,
`site/components/list-row.tsx:100`, `site/components/settings.tsx:23,171,184` (inside a usage string), `:238`,
`site/components/switch.tsx:14,54` and the guideline at `:121`, `docs/adoption/COMPONENTS.md:155`.

**Size tooling.** `tools/size-check.mjs` bundles each row of `tools/size-budgets.json` from `dist/esm` with esbuild
(minified, React external, every `import()` left external), gzips it (level 9) and fails over budget or when a
`mustNotInclude` module contributes bytes. Its `subpath` map lacks `nish-ui/inbox` and `nish-ui/service-tokens`.
2.1.1 baseline (`npm run size`, this worktree, 2026-11-07):

| row | KB | budget | row | KB | budget |
|---|---|---|---|---|---|
| cn | 8.80 | 10 | ContextMenu | 15.47 | 19.5 |
| Button | 9.79 | 10 | HoverCard | 13.10 | 13.3 |
| Card | 9.53 | 11 | AppShell | 35.04 | 35.3 |
| Modal | 15.17 | 15.4 | useMediaQuery | 0.55 | 1 |
| Toaster | 13.44 | 14 | THEMES | 1.59 | 3 |
| Combobox | 13.57 | 14 | SystemCanvas | 27.00 | 27.2 |
| Calendar | 15.72 | 16.5 | Drawer | 15.67 | 16 |
| DatePicker | 19.31 | 20 | Tooltip | 12.99 | 13.5 |
| MultiSelect | 15.22 | 16 | Popover | 12.99 | 13.5 |
| Carousel | 14.13 | 15 | DropdownMenu | 14.29 | 14.5 |
| VirtualList | 11.72 | 12 | everything from . | 136.27 | 136.5 |
| VirtualTable | 16.71 | 16.9 | nish-ui/theme | 9.73 | 10 |
| TreeView | 11.76 | 12 | nish-ui/format | 2.68 | 4 |

Subpaths measured the same way: `Inbox` from `nish-ui/inbox` 28.16, `ServiceTokensSection` from
`nish-ui/service-tokens` 20.14, `SystemCanvas` from `nish-ui/system-canvas` 27.01.

**Docs site.** Hash routes in `site/shell.tsx` (lazy page imports ~:10-24, `NAV` ~:44-72, `page()` switch
~:76-111). `site/pages/changelog.tsx` renders `CHANGELOG.md?raw` with `renderMarkdown` from `site/lib/markdown.tsx`
(headings, paragraphs, one-level lists, inline code, bold, links; no code fences). `site/lib/code.tsx` `CodeBlock`
shows code with a copy button and rewrites `@nish/ui` to `nish-ui`. `site/pages/getting-started.tsx:500-501`
links the 2.0 guide on GitHub. `tools/site-all.visual.json` lists site pages for the visual check.

**Release and fan-out** (`docs/RELEASING.md`, `scripts/release.mjs`, `tools/fanout/*`): `release.yml` with
`bump=major` refuses unless HEAD is origin/master and CHANGELOG has a `## [3.0.0]` heading on master; it runs
`npm run check`, `test:tools`, `test:unit`, commits "Release v3.0.0", builds the tag commit, pushes master then the
tag, creates the GitHub Release, dispatches `publish.yml` and `fanout.yml`. The fan-out opens nothing for 120
minutes after a tag unless dispatched with `now=true`; it then opens `ui/v3.0.0` in each fleet repo (changing
`package.json` pins in `uiDir` and `uiExtraDirs`, the lockfile, hosting's `ui.json` plus `scripts/sync-ui.mjs`),
holds a major until the PR head commit is not the fan-out's own ("Major release: a session has to adopt it"),
then merges when checks and the Fold check pass. An adopted PR that turns CONFLICTING is closed and reopened
unadopted; a newer tag supersedes it. taarora/arora-home is moved by hand with `scripts/bump-consumers.sh`.

**Consumers** (main checkouts on master, 2026-11-07; pins 2.1.0, hosting 2.1.1). Root imports of moved names and
Switch `onChange` usages are listed per repo in tasks A1-A8. No consumer uses `DEFAULT_STRINGS`, `NishStrings`,
`useNishStrings`, `NishProvider` or a `strings` prop, deep `dist/` paths, mocks of `@nish/ui` or dynamic imports of
it. No consumer handler uses the Switch event argument.

## Design

### Root entry and subpaths (T1)

`src/index.ts` loses the lines in "Current state". Nothing else leaves the root. `src/system-canvas.ts` becomes:

```ts
// nish-ui/system-canvas: the SystemCanvas and its layout and routing helpers on their own, so an app can load
// the canvas in a lazy chunk without pulling the rest of the component set into it.
// Fleet-only: built for the nish.software apps, may change in a minor release.
export * from './components/canvas';
export { DEFAULT_CANVAS_LABELS } from './components/canvas/types';
```

`src/inbox.ts` and `src/service-tokens.ts`: replace "The same names stay on the root entry through 2.x." with
"Since 3.0 this is the only entry point for these names." Values and types unchanged.

### Strings (T3)

`src/components/strings.ts` keeps the `NishStrings` interface as it is (plus any keys range-picker added) and adds
the groups. Every key belongs to exactly one group. Each group is declared as

```ts
/** @internal Defaults for AppShell, AppHeader, BottomNav, NavRail, MoreSheet, Breadcrumbs, Inbox. */
export const SHELL_STRINGS = {
  sections: 'Sections',
  more: 'More',
  // ...
} satisfies Partial<NishStrings>;
```

with the exact values from today's `DEFAULT_STRINGS` (copy them, do not retype). Then

```ts
export const DEFAULT_STRINGS: NishStrings = /* @__PURE__ */ Object.assign(
  {},
  OVERLAY_STRINGS, SHELL_STRINGS, STATUS_STRINGS, /* ...every group... */
) as NishStrings;
```

plus a compile-time completeness check right below it (no runtime cost, a type error names any missing key):

```ts
type AllGroups = typeof OVERLAY_STRINGS & typeof SHELL_STRINGS /* & ...every group */;
// A key of NishStrings that no group defines makes this `never`-keyed type non-empty and fails to compile.
const _complete: Record<Exclude<keyof NishStrings, keyof AllGroups>, never> = {};
void _complete;
```

The groups (138 keys today):

| group | keys |
|---|---|
| `OVERLAY_STRINGS` | close, cancel, menu, back, contextMenu |
| `SHELL_STRINGS` | sections, more, hubTitle, hubLabel, moreActions, skipToContent, sidebar, expandSidebar, collapseSidebar, newCount |
| `STATUS_STRINGS` | loading, failedToLoad, retry, nothingHere, loadingNamed, offline, actions |
| `THEME_STRINGS` | theme, themeSystem, themeLight, themeDark, themeToggleLabel, themePreset, themePresetPlaceholder |
| `ERROR_STRINGS` | errorStaleTitle, errorStaleBody, errorTitle, errorBody, errorDetails, errorTryAgain, errorReload |
| `DISPLAY_STRINGS` | dismiss, moreCount, copy, copied, legend, noData, noDataNamed |
| `FIELD_STRINGS` | optional, search, clearSearch, remove, removeNamed, clear, noMatches, searching, removeTag |
| `FILTER_STRINGS` | filters, clearFilters, done, activeCount |
| `PICKER_STRINGS` | invalidDate, chooseDate, changeDate, previousMonth, nextMonth, month, year, dayToken, monthToken, yearToken, and every key range-picker added for Calendar or DatePicker |
| `MULTI_SELECT_STRINGS` | optionAdded, optionRemoved, clearAll, maxSelected |
| `CAROUSEL_STRINGS` | carouselRole, slideRole, slideLabel, previousSlide, nextSlide, goToSlide, slidePicker, startRotation, stopRotation |
| `COMMAND_STRINGS` | searchPlaceholder, noResults, results |
| `TABLE_STRINGS` | sortAnnounce, sortBy, sortDefault |
| `SETTINGS_STRINGS` | saving, saved, saveFailed, enterNumber |
| `SPLIT_STRINGS` | resizeColumns, resizeRows, layoutPresets |
| `MEDIA_STRINGS` | live, offlineBadge |
| `PROGRESS_STRINGS` | progress, progressIndeterminate |
| `FLOW_STRINGS` | workflow, activity, other, waiting, noActivity |
| `CANVAS_STRINGS` | systemMap, zoomOut, zoomIn, fitToScreen, followActivity, canvasLines |
| `TOKEN_STRINGS` | serviceTokens, serviceTokensIntro, loadingServiceTokens, tokenRevoke, tokenRevoked, tokenRevokedAt, tokenRevokeNamed, tokenRevokeTitle, tokenRevokeFailed |
| `INBOX_STRINGS` | inboxMarkHandled, inboxSnooze, inboxActions, inboxViews, inboxOpen, inboxSnoozed, inboxHandled, inboxFilterBySource, inboxHappened |
| `PAGING_STRINGS` | previousPage, nextPage, pageLabel, paginationLabel, breadcrumbs |
| `FILE_STRINGS` | dropzoneLabel, browseFiles, removeFile |
| `AVATAR_STRINGS` | avatar, avatarMore |
| `SLIDER_STRINGS` | sliderMin, sliderMax |
| `ACCORDION_STRINGS` | accordion |

Range-picker keys: a key read only by Calendar or DatePicker goes in `PICKER_STRINGS`. A key read by a new
module range-picker added (for example a time field) goes in a new `TIME_STRINGS` group if that module reads no
picker key, else in `PICKER_STRINGS`. A key read by several families goes in the group of the family listed first
in the table above among those that read it.

`src/components/provider.tsx`:

```ts
interface NishContextValue {
  /** Only what a NishProvider set; components merge it over their own defaults. */
  strings: Partial<NishStrings>;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  portalContainer?: HTMLElement | null;
}
const EMPTY: Partial<NishStrings> = {};
const NishContext = /* @__PURE__ */ createContext<NishContextValue>({ strings: EMPTY });
```

- `NishProvider` merges `strings ? { ...outer.strings, ...strings } : outer.strings` (outer is the overrides, not
  the full defaults); props and nesting behave as today.
- `export function useNishContext(): NishContextValue` — `@internal`, not exported from `src/index.ts`.
- `export function useStrings(a, b?, c?, d?)` — `@internal`, not exported from `src/index.ts`. Overloads:

```ts
export function useStrings<A extends Partial<NishStrings>>(a: A): A;
export function useStrings<A extends Partial<NishStrings>, B extends Partial<NishStrings>>(a: A, b: B): A & B;
export function useStrings<A extends Partial<NishStrings>, B extends Partial<NishStrings>, C extends Partial<NishStrings>>(a: A, b: B, c: C): A & B & C;
export function useStrings<A extends Partial<NishStrings>, B extends Partial<NishStrings>, C extends Partial<NishStrings>, D extends Partial<NishStrings>>(a: A, b: B, c: C, d: D): A & B & C & D;
```

  Body: `const o = useContext(NishContext).strings;` then
  `return useMemo(() => (o === EMPTY && !b ? a : Object.assign({}, a, b, c, d, pick(o, a, b, c, d))), [a, b, c, d, o]);`
  where `pick` copies only the override keys present in one of the groups (so the returned object has exactly the
  group keys). Groups must be module constants (stable identity); say so in the JSDoc.
- `useNishStrings()` (public) returns `useMemo(() => ({ ...DEFAULT_STRINGS, ...o }), [o])` typed `NishStrings`.
- `useNishConfig()` (public) returns the context with `strings` merged the same way, memoized on the context value.
  Both keep their JSDoc and types. Only these two public hooks import `DEFAULT_STRINGS`.

Every module under `src/` except `provider.tsx`, `strings.ts` and `src/index.ts` stops importing `useNishStrings`,
`useNishConfig` and `DEFAULT_STRINGS`. String readers call `useStrings(...)` with the groups that hold the keys they
read (e.g. app-shell: `useStrings(SHELL_STRINGS, STATUS_STRINGS)`; inbox: `useStrings(INBOX_STRINGS, SHELL_STRINGS,
STATUS_STRINGS, OVERLAY_STRINGS)`; service-tokens: `useStrings(TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS,
OVERLAY_STRINGS)`). Locale, dir and portal readers call `useNishContext()`. A prop that used the type
`ReturnType<typeof useNishStrings>` (inbox.tsx ~:108) becomes the `useStrings` return type of that module.
`src/theme.ts` imports `THEME_STRINGS` and `DISPLAY_STRINGS` instead of `DEFAULT_STRINGS` (keep its comment's
point: read them inside the function, not at module scope).

Behavior is identical: same English defaults, a provider override still wins, a per-instance prop still wins
over both.

### Toaster on demand (T4)

- New `src/components/toast-store.ts` (`'use client'`): moves out of toast.tsx the store, timers, `push`,
  `toast`, `useToast`, `dismissToast`, `pauseTimer`, `resumeTimer` (now exported, `@internal`), `useToasts`
  (exported, `@internal`) and the types `ToastTone`, `ToastAction`, `ToastOptions`, `ToastItem`,
  `ToastPromiseMessages`. Code moves unchanged.
- New `src/components/toast-card.tsx` (`'use client'`): `ToastCard`, `TONE`, the swipe constants, unchanged, plus
  `useStrings(DISPLAY_STRINGS)` for `dismiss`. Imports from `./toast-store`, never from `./toast`.
- `src/components/toast.tsx` keeps `Toaster`, `ToasterProps`, `DESKTOP_BOTTOM` and re-exports everything it exports
  today (`export { toast, useToast, dismissToast } from './toast-store'` and the types), so `src/index.ts` needs no
  change. Adds:

```tsx
const cardModule = /* @__PURE__ */ lazyModule(() => import('./toast-card'));
// in Toaster:
const [failed, setFailed] = useState(false);
useEffect(() => preloadWhenIdle(cardModule), []);
const card = useLazyModule(cardModule, list.length > 0 && !failed, () => setFailed(true));
const Card = card?.ToastCard;
// in the list:
{list.map((t) => (Card ? <Card key={t.id} t={t} /> : <ToastFallback key={t.id} t={t} />))}
```

- `ToastFallback({ t })` in toast.tsx: `<div data-nish-toast-fallback="" className="pointer-events-auto flex w-full
  max-w-md items-start gap-2.5 rounded-xl border border-th-line-strong bg-th-elevated px-3.5 py-3 shadow-pop">`
  with `<p className="text-sm font-medium leading-snug text-th-hi">{t.title}</p>`, the body line as in ToastCard,
  the action button (runs `t.action.onClick()` then `dismissToast(t.id)`) and a dismiss button with
  `aria-label={strings.dismiss}` (`useStrings(DISPLAY_STRINGS)`) and `<XIcon size={14} />`, both with the
  ToastCard's button classes (44px targets on touch). No tone icon, no swipe, no pause on hover; the store's timers
  still dismiss it.
- Edge cases: a toast before the chunk arrives shows the fallback, which becomes the full card when it loads (same
  key; the card remounts). A failed load keeps the fallback for the page's life (no retry loop). Server render
  and the first client render are unchanged (Portal renders nothing). `toaster={false}` in AppShell loads
  nothing. Two Toasters share one module and one load.

### Switch (T2)

`SwitchProps`: delete the `onChange` member and its JSDoc; keep `'onChange'` in the `Omit<...>` list. Change the
`onCheckedChange` JSDoc to: "Called with the new value when the switch is clicked or toggled with Space or Enter.
Use it with react-hook-form's Controller (`onCheckedChange={field.onChange}`). Need the click event? Use `onClick`."
In `Switch`: stop destructuring `onChange`; take it out of `rest` before spreading
(`const { onChange: removedOnChange, ...buttonRest } = rest as typeof rest & { onChange?: unknown };`), spread
`buttonRest` on the button, and when `removedOnChange !== undefined` call
`warnDev('Switch: onChange was removed in nish-ui 3.0. Use onCheckedChange(checked).')` (from
`./display-classes`) in an effect. The click handler calls only `onCheckedChange?.(next)`.

### Migration guide and docs site (T5)

`docs/MIGRATING-3.0.md`, exact structure and copy (code samples written with `@nish/ui`; the site shows
`nish-ui`):

````markdown
# Moving from nish-ui 2.x to 3.0

3.0 removes two things that 2.x kept for compatibility. Both are found by TypeScript: after the upgrade,
`tsc --noEmit` lists every line to change. Everything else is the same as 2.1. The full list of changes is in
the [changelog](https://design.nish.software/#/changelog).

Requirements: the same as 2.x (Node 20.19 or later, React 19, Tailwind 4 if you use `tailwind.css`).

## 1. Fleet-only components have their own entry points

`Inbox`, `ServiceTokensSection`, `useServiceTokens` and `SystemCanvas`, with their helpers and types, are no
longer exported from `@nish/ui`. Import them from the entry point that has always had them (since 2.1):

| Names | Import from |
|---|---|
| `Inbox`, `DEFAULT_INBOX_LABELS`, `INBOX_SOURCE_LABELS`, `INBOX_DEFAULT_SETTINGS`, `INBOX_ACTION_HEADER`, `INBOX_ACTION_TIMEOUT_MS`, and the types `InboxProps`, `InboxLabels`, `InboxItem`, `InboxView`, `InboxSeverity`, `InboxSettings`, `InboxListResponse`, `InboxAction`, `InboxActionResult`, `InboxActionCall` | `@nish/ui/inbox` |
| `ServiceTokensSection`, `useServiceTokens`, and the types `ServiceTokensSectionProps`, `ServiceTokenView`, `ServiceTokenListResponse` | `@nish/ui/service-tokens` |
| `SystemCanvas`, `layoutSystem`, `pickLayout`, `routeEdges`, `DEFAULT_CANVAS_LABELS`, and the types `SystemCanvasProps`, `CanvasGroup`, `CanvasNode`, `CanvasEdge`, `CanvasHue`, `CanvasNodeKind`, `CanvasLayout`, `CanvasEdgeKind`, `CanvasLayoutMode`, `CanvasLabels`, `LayoutOptions`, `RoutedEdge` | `@nish/ui/system-canvas` |

```tsx
// before
import { PageHeader, ServiceTokensSection, useServiceTokens } from '@nish/ui';

// after
import { PageHeader } from '@nish/ui';
import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens';
```

Why: these components are built for the nish.software apps, and keeping them on the main entry made it about
19 KB larger. The entry points work in 2.1 too, so you can move the imports before you upgrade.

## 2. Switch: `onChange` is gone, use `onCheckedChange`

```tsx
// before
<Switch checked={on} onChange={(checked) => setOn(checked)} label="Alerts" />

// after
<Switch checked={on} onCheckedChange={setOn} label="Alerts" />
```

`onCheckedChange` gets the new value only. If you used the second argument (the click event), use `onClick`,
which runs first and can call `event.preventDefault()` to stop the toggle. `onCheckedChange` exists since 2.0, so
this change also works before you upgrade.

## Smaller changes

| What | 3.0 |
|---|---|
| Toaster | Toast cards load in a small chunk the first time a toast shows (preloaded when the browser is idle). Until it loads, or if it cannot load, a plain card shows the same title, body, action and dismiss button. Screen readers hear every toast as before. |
| Strings | Each component carries only its own default strings. `NishProvider strings`, `useNishStrings()`, `useNishConfig()` and `DEFAULT_STRINGS` are unchanged. |
| Sizes | AppShell and the main entry are smaller; the numbers are in the [3.0.0 changelog entry](https://design.nish.software/#/changelog). |

## Check your upgrade

1. Move the imports and the Switch callbacks (both work on 2.1).
2. Change the pin to `npm:nish-ui@3.0.0` and reinstall.
3. Run `tsc --noEmit` and your tests. Every removed name and every `onChange` on a Switch is a type error.

## Support

Questions or a problem with the upgrade: [open an issue](https://github.com/nishant/ui/issues).
````

Docs site:
- `site/lib/markdown.tsx`: fenced code blocks. A line matching ```` /^```(\w*)\s*$/ ```` starts a block (flush the
  paragraph and the list first), lines up to the next ```` /^```\s*$/ ```` are its text, and the block renders as
  `<CodeBlock key={k++} code={text} title={lang || undefined} />` from `./code`. Also tables: consecutive lines
  starting with `|` form a table (second line is the `|---|` separator, skipped); render
  `<div className="overflow-x-auto"><table className="w-full text-left text-sm">` with `th`/`td` cells
  (`inline()` each cell, `border-b border-th-line py-2 pe-3 align-top`). The wrapper scrolls on its own, so the
  page never scrolls sideways at 360px. CHANGELOG has neither, so the Changelog page renders as before.
- New `site/pages/migrating.tsx`: `MigratingPage` imports `../../docs/MIGRATING-3.0.md?raw`, calls
  `renderMarkdown`, renders `<PageHeader eyebrow="Start" title="Moving to 3.0" lead="What to change in an app
  that uses nish-ui 2.x. TypeScript finds every line." />`, then `intro` in a `doc-prose` div, then each section as
  `<section className="space-y-3"><h2 className="text-xl font-semibold tracking-tight text-th-hi">{heading}</h2>
  <div className="doc-prose space-y-3 text-[15px] leading-relaxed text-th-hi2">{body}</div></section>`, the root
  element carrying whatever `data-page` contract the other pages use (copy it from `changelog.tsx`'s caller).
- `site/shell.tsx`: lazy import `MigratingPage`; NAV Start group gets `{ path: '/migrating', label: 'Moving to 3.0' }`
  after Changelog; `page()` gets `case 'migrating': return { title: 'Moving to 3.0', node: <MigratingPage /> };`.
- `site/pages/getting-started.tsx` versioning paragraph: the link text becomes "moving from 2.x to 3.0" with
  `href={href('/migrating')}` (no `target`), followed by "; the older guide covers 1.x to 2.0" linking the existing
  GitHub URL of `MIGRATING-2.0.md`.
- `tools/site-all.visual.json`: add `{ "name": "migrating", "url": "http://localhost:5191/#/migrating", "waitFor": "[data-page]" }` after changelog.

Docs text:
- `README.md` "Fleet-only APIs": replace "; the root entry keeps them through 2.x." with ". Since 3.0 the root entry
  does not export them." In the "Bundle size" section add a row `| \`AppShell\` | under 34 KB |`. Add one line under
  the entry-point table: "Moving from 2.x: [the 3.0 guide](https://design.nish.software/#/migrating)." (absolute
  link: the README is the npm page).
- `docs/DEVELOPING.md` contract item 5 becomes: "**Strings** come from `useStrings(GROUP, ...)` (internal, in
  `provider.tsx`) with the groups in `src/components/strings.ts` that hold the keys the component reads; a
  per-instance prop wins. A new string gets a typed key with a JSDoc line in `NishStrings` and a value in exactly
  one group (the completeness check fails otherwise). Never call `useNishStrings()` or read `DEFAULT_STRINGS` in a
  component: they carry every string."
- `CLAUDE.md` (ui) "Repo rules that changed in 2.0": change "strings from `useNishStrings()`" to "strings from
  `useStrings(GROUP)` (never `useNishStrings()` inside the package)". Add under it one bullet: "3.0: the fleet-only
  names are only on `nish-ui/inbox`, `nish-ui/service-tokens` and `nish-ui/system-canvas`; `Switch` has only
  `onCheckedChange`."
- `docs/RELEASING.md` ~:180-185 "Major releases": after the 2.0.0 sentence add "3.0.0: apps import Inbox, service
  tokens and SystemCanvas names from their subpaths and use `Switch onCheckedChange`; both work on 2.1, so the
  apps moved first (prep PRs) and each 3.0.0 bump PR needed only an adoption commit."

## Tasks

ui checkout: `C:\Code\ui-ui-3`, branch `ui-3`. **Before any ui task starts**, the integrator (or the session)
runs `git -C C:\Code\ui-ui-3 fetch -q` and `git -C C:\Code\ui-ui-3 merge origin/master`, after confirming on
origin/master that range-picker and the `PageContainer padBottom` fix are merged (`git log origin/master --oneline -30`
names both merges). Line numbers above are from 2.1.1; find the code by name if they moved.

App checkouts: `C:\Code\<folder>-ui-3`, branch `ui-3`, from `origin/master`, created with
`git -C C:\Code\<folder> fetch -q` and `git -C C:\Code\<folder> worktree add C:\Code\<folder>-ui-3 -b ui-3 origin/master`.
Install with the repo's own command (`npm ci`, or `pnpm install --frozen-lockfile` for trading and nishboard).
Never touch `package.json` pins or lockfiles in an app.

Implementers do not commit. Never run anything in "outward" (see Release).

### T1 Fleet names off the root entry
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/index.ts`, `src/system-canvas.ts`, `src/inbox.ts`, `src/service-tokens.ts`, `tools/exports.test.mjs`,
  `tests/ssr/cases.tsx`, `tests/ssr/ssr.test.tsx`, `site/components/inbox.tsx`, `site/components/system-canvas.tsx`,
  `site/components/service-tokens.tsx`, `site/docgen.mjs`, `tools/docgen-coverage.test.ts`,
  `tools/canvas-layout-check.mjs`, `tools/canvas-route-check.mjs`
- Reads: `src/components/canvas/index.ts`, `src/components/canvas/types.ts`, `package.json`, `scripts/build.mjs`
- Depends on: none (starts after the master merge above)
- Change:
  1. `src/index.ts`: delete the SystemCanvas, canvas-types, Inbox and service-token export lines (Current state).
  2. `src/system-canvas.ts`, `src/inbox.ts`, `src/service-tokens.ts`: as in Design.
  3. `tools/exports.test.mjs`: replace the test "fleet-only subpaths re-export the root's values" with "fleet-only
     names are only on their subpaths": import `dist/esm/index.js` and each of `dist/esm/inbox.js`,
     `dist/esm/service-tokens.js`, `dist/esm/system-canvas.js`; assert every runtime name of each subpath is
     absent from the root, and that `system-canvas` exports `DEFAULT_CANVAS_LABELS`, `SystemCanvas`,
     `layoutSystem`, `pickLayout`, `routeEdges`, `inbox` exports `Inbox` and `INBOX_SOURCE_LABELS`,
     `service-tokens` exports `ServiceTokensSection` and `useServiceTokens`.
  4. `tests/ssr/cases.tsx`: import `Inbox` from `../../src/inbox`, `ServiceTokensSection` (and anything else it
     uses from that family) from `../../src/service-tokens`, `SystemCanvas` from `../../src/system-canvas`, and use
     them instead of `ui.Inbox`, `ui.ServiceTokensSection`, `ui.SystemCanvas`. Also change the two Switch usages
     (~:368, :395) from `onChange` to `onCheckedChange`. `tests/ssr/ssr.test.tsx`: if it derives the component list
     from the root (`Object.keys(ui)`), add the three subpath components to that list so they stay covered.
  5. Site docs: `site/components/inbox.tsx:2` imports from `../../src/inbox`; `site/components/system-canvas.tsx:2`
     keeps `Badge` from `../../src` and imports the canvas names from `../../src/system-canvas`. Sample strings and
     comments that say "also on '@nish/ui' through 2.x" (inbox.tsx ~:136, service-tokens.tsx ~:83 and :6-8,
     system-canvas.tsx ~:178 and :250) are deleted; each `importLine` shows only the subpath import.
  6. `site/docgen.mjs`: add `src/inbox.ts`, `src/service-tokens.ts`, `src/system-canvas.ts` to `entries` so the
     COMPONENTS/FUNCTIONS/INTERFACES names still resolve.
  7. `tools/docgen-coverage.test.ts`: it reads only `src/index.ts`; remove the canvas, inbox and service-token names
     from `UNDOCUMENTED_EXPORTS` and `UNDESCRIBED_PROPS` that its stale check now reports (run it to see which).
  8. `tools/canvas-layout-check.mjs` and `tools/canvas-route-check.mjs`: import from `../dist/esm/system-canvas.js`.
- Edge cases: a type-only name (e.g. `RoutedEdge`) must still be importable from `nish-ui/system-canvas` (it is,
  through `components/canvas/index.ts`; check `dist/system-canvas.d.ts` after the build). Nothing else may leave the
  root: compare `Object.keys(await import('./dist/esm/index.js'))` before and after; the only difference is the 13
  runtime names `SystemCanvas, layoutSystem, pickLayout, routeEdges, DEFAULT_CANVAS_LABELS, Inbox,
  DEFAULT_INBOX_LABELS, INBOX_SOURCE_LABELS, INBOX_DEFAULT_SETTINGS, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS,
  ServiceTokensSection, useServiceTokens`.
- Acceptance: `npm run typecheck`, `npm run build`, `node --test tools/exports.test.mjs`,
  `node tools/canvas-layout-check.mjs`, `node tools/canvas-route-check.mjs`,
  `npx vitest run tests/ssr tools/docgen-coverage.test.ts tools/docs-meta.test.ts` pass.
  `tools/api-surface.test.mjs` fails on the removals until T6 regenerates the snapshot; that is expected here.

### T3 String groups and the internal hooks
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/components/strings.ts`, `src/components/provider.tsx`, `src/components/provider.test.tsx`,
  `src/components/strings.test.ts` (new), `src/theme.ts`
- Reads: every module listed in T3b/T3c (to place range-picker keys), `site/components/provider.tsx`
- Depends on: none (starts after the master merge above)
- Change: Design, "Strings": the groups (every key of `NishStrings` on master, including range-picker's), the
  assembled `DEFAULT_STRINGS` with the completeness check, the context holding overrides only, `useNishContext`,
  `useStrings` with its overloads, the public `useNishStrings` and `useNishConfig` merging over `DEFAULT_STRINGS`,
  and `src/theme.ts` on `THEME_STRINGS`/`DISPLAY_STRINGS`.
  `src/components/strings.test.ts` (vitest) asserts: (a) the group key sets are pairwise disjoint (import every
  exported `*_STRINGS` constant with `import * as S from './strings'`); (b) their union equals
  `Object.keys(DEFAULT_STRINGS)`; (c) `DEFAULT_STRINGS` deep-equals a frozen copy of today's values for five sample
  keys (`close: 'Close'`, `more: 'More'`, `loading: 'Loading'`, `themeToggleLabel('Light','Dark') ===
  'Theme: Light. Switch to Dark'`, `inboxHappened(3) === 'Happened 3 times'`); (d) no file under `src/` other than
  `provider.tsx`, `strings.ts`, `index.ts` and `*.test.*` contains `useNishStrings(`, `useNishConfig(` or
  `DEFAULT_STRINGS` (read the files with `fs`; this one fails until T3b, T3c, T2 and T4 are done, so mark it
  `it.todo` here and T6 turns it on; say so in your notes). `provider.test.tsx` adds: `useStrings(SHELL_STRINGS)`
  without a provider returns `SHELL_STRINGS` itself; with `<NishProvider strings={{ more: 'Plus', close: 'X' }}>`
  returns `more: 'Plus'` and has no `close` key; nested providers override key by key; `useNishStrings()` and
  `useNishConfig().strings` still return all keys with overrides applied.
- Edge cases: an override for a key that is in none of the passed groups is ignored by `useStrings` (but seen by
  `useNishStrings`). `NishProvider` with `strings={undefined}` passes the outer overrides through unchanged (same
  object identity, so `useStrings` memo holds). A function-valued string (e.g. `slideLabel`) overrides like any other.
- Acceptance: `npm run typecheck` passes for `strings.ts`, `provider.tsx` and `theme.ts` (other modules still
  compile because the public hooks keep their types), `npx vitest run src/components/provider.test.tsx
  src/components/strings.test.ts src/theme.test.ts src/theme-helpers.test.ts` pass.

### T3b Components a-f on useStrings
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/components/accordion.tsx`, `app-shell.tsx`, `avatar.tsx`, `breadcrumbs.tsx`, `calendar.tsx`,
  `canvas/legend.tsx`, `canvas/node.tsx`, `canvas/system-canvas.tsx`, `carousel.tsx`, `charts.tsx`, `combobox.tsx`,
  `command.tsx`, `context-menu.tsx`, `data.tsx`, `date-picker.tsx`, `display.tsx`, `drawer.tsx`,
  `error-boundary.tsx`, `feedback.tsx`, `file-dropzone.tsx`, `filters.tsx` (all under `src/components/`), and any
  other module under `src/components/` whose file name starts with a-f that calls `useNishStrings` or
  `useNishConfig` on master (for example one range-picker added), except `forms.tsx`.
- Reads: `src/components/strings.ts`, `src/components/provider.tsx` (from T3)
- Depends on: T3
- Change: in each owned module replace `useNishStrings()` with `useStrings(<groups that hold the keys it reads>)`
  (key table in Current state, group table in Design) and `useNishConfig()` with `useNishContext()`. Keep the local
  variable names (`strings`, `s`, `t`) so the rest of each file is untouched. Remove now-unused imports.
- Edge cases: a module that reads a key from a group it did not pass fails typecheck: add the group, never cast.
  At most 4 groups per call; if a module needs 5, it is wrong, re-check the table.
- Acceptance: `npm run typecheck` (errors only in files owned by T3c, T2 or T4 are allowed at this point; none in
  owned files), `npm run lint -- src/components`, `npx vitest run` for each owned module's test file
  (`src/components/<name>.test.tsx` where it exists, plus `app-shell-lazy.test.tsx`, `calendar.hydration.test.tsx`,
  `hydrate-t14.test.tsx`, `ssr-t14.test.tsx`) pass.

### T3c Components g-z on useStrings
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/components/hooks.tsx`, `hover-card.tsx`, `inbox.tsx`, `layout.tsx`, `media.tsx`, `menu.tsx`, `modal.tsx`,
  `more-sheet.tsx`, `multi-select.tsx`, `nav-items.tsx`, `nav.tsx`, `overlay-dialog.tsx`, `pagination.tsx`,
  `popover.tsx`, `portal.tsx`, `progress.tsx`, `service-tokens.tsx`, `settings.tsx`, `slider.tsx`, `split.tsx`,
  `tag-input.tsx`, `theme-toggle.tsx`, `tooltip.tsx`, `virtual-table.tsx`, `flow.tsx` (all under `src/components/`),
  and any other module under `src/components/` whose name starts with g-z that calls `useNishStrings` or
  `useNishConfig` on master, except `toast.tsx`.
- Reads, Depends on, Change, Edge cases: as T3b. `inbox.tsx` ~:108 prop typed `ReturnType<typeof useNishStrings>`
  becomes `ReturnType<typeof useInboxStrings>` where `const useInboxStrings = () => useStrings(INBOX_STRINGS,
  SHELL_STRINGS, STATUS_STRINGS, OVERLAY_STRINGS)` is a module-level helper in inbox.tsx.
- Acceptance: as T3b, with this task's test files (`layout.test.tsx` must still pass after the padBottom fix's
  tests, `inbox.test.tsx`, `service-tokens.test.tsx`, `nav.test.tsx`, `overlay.test.tsx`, `virtual-table.test.tsx`,
  `settings.test.tsx`, `split.test.tsx`, ...).

### T2 Switch onCheckedChange only
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/components/forms.tsx`, `src/components/forms.test.tsx`, `site/components/switch.tsx`,
  `site/components/settings.tsx`, `site/components/list-row.tsx`, `site/pages/component.tsx`, `tests/a11y/main.tsx`,
  `tests/consumers/ts/src/consumer.tsx`, `docs/adoption/COMPONENTS.md`
- Reads: `src/components/display-classes.ts` (`warnDev`), `src/components/strings.ts`, `provider.tsx`
- Depends on: T3 (forms.tsx also moves to `useStrings(FIELD_STRINGS)` here)
- Change:
  1. `forms.tsx`: Design, "Switch". Also replace its `useNishStrings()` calls with `useStrings(FIELD_STRINGS)`.
  2. `forms.test.tsx`: every Switch test uses `onCheckedChange`. Replace "keeps onChange(checked, event)" with two
     tests: "onCheckedChange gets only the new value" and "a removed onChange prop is not called, not put on the
     button, and warns once" (render with `{...({ onChange: spy } as object)}`, click, expect `spy` not called and
     `console.warn` called once with the message in Design, twice-rendered still once).
  3. `site/components/switch.tsx`: the demo (~:14, :54) uses `onCheckedChange={setOn}`; the guideline at ~:121
     becomes: "onCheckedChange(checked) is the only callback. Need the click event? Use onClick, which runs first
     and can preventDefault the toggle. With react-hook-form use Controller: `<Controller name=\"alerts\"
     render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label=\"Alerts\" />} />`;
     register() cannot drive a Switch."
  4. `onChange` -> `onCheckedChange` on every Switch in `site/components/settings.tsx` (:23, :171, the usage string
     :184, :238), `site/components/list-row.tsx:100`, `site/pages/component.tsx:135`, `tests/a11y/main.tsx:137`,
     `tests/consumers/ts/src/consumer.tsx:116`.
  5. `docs/adoption/COMPONENTS.md:155`: the signature reads `Switch({ checked, onCheckedChange, ... })`.
- Edge cases: `site/pages/component.tsx:135` passes a prop-table `onChange` handler of type `(v: unknown) => void`
  or similar: wrap it if the types differ (`onCheckedChange={(v) => onChange(v)}`). Other components' `onChange`
  (SearchInput, Checkbox, Select...) are not touched.
- Acceptance: `npm run typecheck` shows no error in owned files; `npx vitest run src/components/forms.test.tsx`;
  `git grep -nE "<Switch[^>]*onChange=" -- src site tests docs` prints nothing (multi-line usages: also check
  `git grep -n -A4 "<Switch" -- site tests | grep "onChange="` prints only `onCheckedChange` lines).

### T4 Toaster cards on demand
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `src/components/toast.tsx`, `src/components/toast-store.ts` (new), `src/components/toast-card.tsx` (new),
  `src/components/toast.test.tsx`, `src/components/toast-lazy.test.tsx` (new), `tests/elements/react.tsx`,
  `tests/elements/parity.spec.ts`, `site/components/toast.tsx`
- Reads: `src/components/lazy-module.ts`, `src/components/app-shell-lazy.test.tsx` (pattern for a failing chunk),
  `src/components/strings.ts`, `provider.tsx`
- Depends on: T3
- Change:
  1. Design, "Toaster on demand".
  2. `toast.test.tsx`: tests that look at the card (tone icon, swipe, hover pause, action, dismiss) first wait for the
     full card (`await waitFor(() => expect(document.querySelector('[data-nish-toast-fallback]')).toBeNull())` after
     the toast shows). Tests of the store (`toast()`, limits, slots, `toast.promise`, timers) stay as they are.
  3. `toast-lazy.test.tsx`: mock `./toast-card` so its import rejects (as `app-shell-lazy.test.tsx` does for the
     More sheet); render `<Toaster />`, call `toast.success('Saved', { action: { label: 'Undo', onClick } })`;
     expect the fallback card with "Saved", an "Undo" button that calls `onClick` and removes the toast, and a
     "Dismiss" button that removes it; a second toast also renders as a fallback, and the import is not retried
     (the mock factory ran once).
  4. `tests/elements/react.tsx`: Switch rows ~:178-181 use `onCheckedChange={noop}` (this file is owned here, not by
     T2). The toast scene keeps firing at 50 ms. `tests/elements/parity.spec.ts`: for the React toast, wait until no
     `[data-nish-toast-fallback]` is in the page before measuring.
  5. `site/components/toast.tsx`: add a guideline: "The cards load on demand (a small chunk, preloaded when the
     browser is idle). Until it loads, or if it cannot, a plain card shows the same text, action and dismiss
     button."
- Edge cases: Design, "Toaster on demand". Also: `toast()` called before any Toaster mounts still queues (store
  unchanged); unmounting the Toaster while the chunk loads must not set state after unmount (`useLazyModule`
  already guards with `live`).
- Acceptance: `npm run typecheck` (no error in owned files), `npx vitest run src/components/toast.test.tsx
  src/components/toast-lazy.test.tsx src/components/app-shell.test.tsx src/components/app-shell-lazy.test.tsx`,
  `npm run build` then `CI=1 npx playwright test tests/elements tests/overlay` pass.

### T5 Migration guide and docs
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `docs/MIGRATING-3.0.md` (new), `site/pages/migrating.tsx` (new), `site/shell.tsx`, `site/lib/markdown.tsx`,
  `site/pages/getting-started.tsx`, `tools/site-all.visual.json`, `README.md`, `docs/DEVELOPING.md`, `CLAUDE.md`,
  `docs/RELEASING.md`
- Reads: `site/pages/changelog.tsx`, `site/lib/code.tsx`, `site/lib/ui.tsx`, `docs/MIGRATING-2.0.md`
- Depends on: none (starts after the master merge above)
- Change: Design, "Migration guide and docs site" and "Docs text", copy exactly as written there.
- Edge cases: the guide's tables at 360px scroll inside their wrapper, not the page; a fenced block with no language
  has no title; `nishName()` turns `@nish/ui` into `nish-ui` in the shown code (intended); the Changelog page is
  unchanged (no fences or tables in CHANGELOG.md today; check after T6 adds the 3.0.0 entry, which has none either).
- Acceptance: `npm run typecheck`, `npx vitest run tools/docs-meta.test.ts`, `npm run build:site` (includes
  `tools/site-bundle-check.mjs`) pass; with `npx vite preview --config site/vite.config.ts --port 5191 --strictPort`
  running (check the port is free first), `#/migrating` renders the five sections and two tables; screenshots at
  360x780, 840x900, 1440x900 in light and dark show no horizontal page scroll
  (`document.documentElement.scrollWidth <= innerWidth`) and the nav item is reachable on the phone (the Drawer menu
  lists "Moving to 3.0"). Stop the preview server afterwards.

### T6 Wiring: budgets, snapshot, changelog (last in ui)
- Repo / checkout: ui at `C:\Code\ui-ui-3`
- Owns: `tools/size-budgets.json`, `tools/size-check.mjs`, `tools/api-surface.snapshot.json`, `CHANGELOG.md`, and
  `src/components/strings.test.ts` once T3 is done (one test only)
- Reads: everything
- Depends on: T1, T2, T3, T3b, T3c, T4, T5
- Change:
  1. Turn on the `it.todo` "no component reads DEFAULT_STRINGS" test from T3 (it now must pass; edit only that test
     in `strings.test.ts`, which T3 has finished with).
  2. `tools/size-check.mjs`: add `'nish-ui/inbox': 'inbox.js'` and `'nish-ui/service-tokens': 'service-tokens.js'`
     to `subpath`.
  3. `npm run build`, then measure (`npm run size`). Budgets: SystemCanvas row becomes `"from":
     "nish-ui/system-canvas"`; add rows `Inbox` from `nish-ui/inbox` and `ServiceTokensSection` from
     `nish-ui/service-tokens`; AppShell `maxKB` 34 and add `"components/toast-card.js"` to its `mustNotInclude`;
     "everything from ." = measured + 0.5 rounded up to 0.1; every other row whose value dropped by 0.2 KB or more
     gets measured + 0.2 rounded up to 0.1; no row's budget goes up except where noted. Rewrite the `comment` to
     describe 3.0: fleet names on their subpaths, per-component strings, Toaster cards lazy, the AppShell target met,
     and why "everything from ." is not 100 (the general components; numbers from Decisions).
  4. `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs` after the final build; the snapshot diff removes
     exactly the 13 names from `"."` and adds nothing else to `"."`.
  5. Check `dist/files.json`: its `static` list must not gain files (taarora/arora-home's sync script breaks on a new
     static file). The new `dist/esm/components/toast-card.js` is not static; if anything new appears in `static`,
     report it.
  6. `CHANGELOG.md`: a new top entry (copy, filled with the measured numbers):

```markdown
## [3.0.0] - <release date>

Two things 2.x kept for compatibility are gone, and the main entry and AppShell are smaller. TypeScript finds every
line an app has to change. Moving from 2.x: [the 3.0 guide](https://design.nish.software/#/migrating)
([on GitHub](https://github.com/nishant/ui/blob/master/docs/MIGRATING-3.0.md)).

### Breaking

- `Inbox`, `ServiceTokensSection`, `useServiceTokens`, `SystemCanvas` and their helpers and types are no longer
  exported from `nish-ui`. Import them from `nish-ui/inbox`, `nish-ui/service-tokens` and `nish-ui/system-canvas`
  (there since 2.1).
- `Switch` has no `onChange(checked, event)`; use `onCheckedChange(checked)` (there since 2.0), and `onClick` if you
  need the event.

### Behavior changes

- `Toaster` loads its cards on demand, preloaded when the browser is idle. Until the chunk loads, or if it cannot
  load, a plain card shows the same title, body, action and dismiss button.

### Added

- `nish-ui/system-canvas` exports `DEFAULT_CANVAS_LABELS`.
- design.nish.software has the migration guide ("Moving to 3.0").

### Performance

- Each component carries only its own default strings instead of all of them.
- `AppShell` is <measured> KB gzip instead of 35.0; `Toaster` <measured> instead of 13.4; everything from `nish-ui`
  <measured> instead of 136.3.
```

     The date is filled by the session on release day if it differs; `release.mjs` only needs the `## [3.0.0]`
     heading.
  7. Run the full ui checks (Workflow `checks`, below) and fix small breakages in any file; report each repair.
- Acceptance: the full ui checks pass; `npm run size` shows AppShell <= 33.8 (0.2 under its 34 budget), "everything
  from ." <= 118.5, Toaster <= 12.8, `nish-ui/theme` <= 9.73, no row above its 2.1.1 value except the three new
  subpath rows; `AppShell` has no `components/toast-card.js` bytes. If AppShell is above 33.8, report the top inputs
  (`metafile`) and which string groups it pulls; do not raise the budget.

### A1 startpage (nishant/nishant.github.io)
- Repo / checkout: `C:\Code\startpage-ui-3`
- Owns: `src/features/inbox/NotificationSettings.tsx`, `src/features/inbox/ServiceTokens.tsx`,
  `src/features/inbox/api.ts`, `src/features/inbox/labels.ts`, `src/pages/Inbox.tsx`
- Depends on: none (wave 1, does not wait for the ui merges)
- Change:
  1. `NotificationSettings.tsx` import block (lines 1-13): move `INBOX_DEFAULT_SETTINGS` and `type InboxSeverity` to a
     new `import { INBOX_DEFAULT_SETTINGS, type InboxSeverity } from '@nish/ui/inbox';`; the rest stays on `@nish/ui`.
     Switches at ~:397 and ~:426: `onChange=` -> `onCheckedChange=`.
  2. `ServiceTokens.tsx:1`: `from '@nish/ui/service-tokens'`.
  3. `api.ts:1`: `from '@nish/ui/inbox'`.
  4. `labels.ts:1`: `from '@nish/ui/inbox'`.
  5. `pages/Inbox.tsx` import block (lines 1-17): move `Inbox`, `type InboxItem`, `type InboxView` to
     `import { Inbox, type InboxItem, type InboxView } from '@nish/ui/inbox';`.
- Acceptance: the fleet check script (below) prints nothing; `npm ci && node scripts/app-kit/check.mjs && npm run lint
  --if-present && npm run typecheck && npm test && npx vite build --outDir <scratch dir>`; then in `server/`:
  `npm ci && npm run typecheck`. Never run `npm run deploy`.

### A2 status
- Checkout: `C:\Code\status-ui-3`. Owns: `ui/src/pages/Settings.tsx`.
- Change: line 1 becomes `import { PageHeader, useDocumentTitle } from '@nish/ui';` and
  `import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens';`.
- Acceptance: fleet check script prints nothing; `npm ci`, `node scripts/app-kit/check.mjs`, `npm run typecheck`,
  `npm run build`, `npm test`, `npm run lint`.

### A3 trackers
- Checkout: `C:\Code\trackers-ui-3`. Owns: `ui/src/pages/Settings.tsx`, `ui/src/components/pricewatch/SortFilterSheet.tsx`.
- Change: Settings.tsx line 1 split as in A2. SortFilterSheet.tsx ~:94 `onChange={setGroup}` -> `onCheckedChange={setGroup}`.
- Acceptance: fleet check script prints nothing; `npm ci`, `node scripts/app-kit/check.mjs`, `npm run typecheck`,
  `npm run lint`, `npm run build`, `npm test`, `npx tsx scripts/test-pricewatch.ts` (with the env its `pr.yml`
  `check-env` sets; it needs Playwright Chromium). Do not touch `App.tsx` (the padBottom session edits it).

### A4 workflows
- Checkout: `C:\Code\workflows-ui-3`. Owns: `ui/src/pages/SettingsView.tsx`.
- Change: line 1 `from '@nish/ui/service-tokens'`. (`SystemView.tsx` already uses `@nish/ui/system-canvas`.)
- Acceptance: fleet check script prints nothing; `npm ci`, `node scripts/app-kit/check.mjs`, `npm run typecheck`,
  `npm test`, `npm run build`.

### A5 job-apps
- Checkout: `C:\Code\job-apps-ui-3`. Owns: `apps/web/src/screens/Settings.tsx`.
- Change: line 1 (no semicolons in this repo) becomes `import { PageContainer, PageHeader } from '@nish/ui'` and
  `import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens'`.
- Acceptance: fleet check script prints nothing; `npm ci`, `node scripts/app-kit/check.mjs`, `npm run typecheck`,
  `npx tsc --noEmit -p packages/worker`, `npm run lint`, `npm test`, `npm run build -w apps/web`.

### A6 trading
- Checkout: `C:\Code\trading-ui-3`. Owns: `apps/web/src/components/settings/ServiceTokensSection.tsx`,
  `apps/web/src/pages/SettingsPage.tsx`, `apps/web/src/components/settings/AiSection.tsx`.
- Change: ServiceTokensSection.tsx:1 `from '@nish/ui/service-tokens'` (keep the `as SharedServiceTokensSection`
  alias). `onChange=` -> `onCheckedChange=` on the Switches at SettingsPage.tsx ~:206, ~:246, ~:678, ~:699 and
  AiSection.tsx ~:59. Do not touch `components/layout/AppShell.tsx` (the padBottom session edits it).
- Acceptance: fleet check script prints nothing; `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`.

### A7 nishboard
- Checkout: `C:\Code\nishboard-ui-3`. Owns: `apps/renderer/src/widgets/inbox/InboxWidget.tsx`,
  `apps/renderer/src/components/SettingsModal.tsx`, `apps/renderer/src/components/settings/AlertsPanel.tsx`.
- Change: InboxWidget.tsx line 4 keeps `Button, EmptyState, toast` on `@nish/ui` and moves `INBOX_SOURCE_LABELS, Inbox`
  to `@nish/ui/inbox`; line 5 `import type { InboxAction, InboxItem } from '@nish/ui/inbox';` (line 3's
  `Inbox as InboxIcon` is lucide-react: leave it). `onChange=` -> `onCheckedChange=` on the Switches at
  SettingsModal.tsx ~:328, :375, :524, :537, :545, :620, :633, :641 and AlertsPanel.tsx ~:54.
- Acceptance: fleet check script prints nothing; `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`,
  `pnpm test`, `pnpm build`.

### A8 streams
- Checkout: `C:\Code\streams-ui-3`. Owns: `ui/src/shell/SettingsModal.tsx`.
- Change: `onChange=` -> `onCheckedChange=` on the Switches at ~:28 and ~:30.
- Acceptance: fleet check script prints nothing; `npm ci`, `node scripts/app-kit/check.mjs`, `npm run typecheck`,
  `npm run build`, `npm test`, `npm run lint`.

**Fleet check script** (save to your scratch directory, never into a repo; run `node <path> <checkout>`). It must
print nothing:

```js
// Lists bare '@nish/ui' imports of names 3.0 removes, and Switches that still pass onChange.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = process.argv[2];
const MOVED = new Set(['SystemCanvas','layoutSystem','pickLayout','routeEdges','DEFAULT_CANVAS_LABELS','SystemCanvasProps','CanvasGroup','CanvasNode','CanvasEdge','CanvasHue','CanvasNodeKind','CanvasLayout','CanvasEdgeKind','CanvasLayoutMode','CanvasLabels','LayoutOptions','RoutedEdge','Inbox','DEFAULT_INBOX_LABELS','INBOX_SOURCE_LABELS','INBOX_DEFAULT_SETTINGS','INBOX_ACTION_HEADER','INBOX_ACTION_TIMEOUT_MS','InboxProps','InboxLabels','InboxItem','InboxView','InboxSeverity','InboxSettings','InboxListResponse','InboxAction','InboxActionResult','InboxActionCall','ServiceTokensSection','useServiceTokens','ServiceTokensSectionProps','ServiceTokenView','ServiceTokenListResponse']);
const files = execFileSync('git', ['-C', dir, 'ls-files', '*.ts', '*.tsx'], { encoding: 'utf8' }).split('\n').filter(Boolean);
for (const f of files) {
  const src = readFileSync(`${dir}/${f}`, 'utf8');
  for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"](?:@nish\/ui|nish-ui)['"]/g)) {
    const names = m[1].split(',').map((s) => s.replace(/\btype\s+/, '').trim().split(/\s+as\s+/)[0]).filter(Boolean);
    const bad = names.filter((n) => MOVED.has(n));
    if (bad.length) console.log(`${f}: ${bad.join(', ')} from the root`);
  }
  for (const m of src.matchAll(/<Switch\b[^>]*?\bonChange=/gs)) console.log(`${f}: Switch onChange at offset ${m.index}`);
}
```

## Waves

- W0 (gate, not a task): range-picker and the PageContainer padBottom fix merged to ui master; merge origin/master
  into `ui-3`. App tasks do not wait for W0.
- W1: A1-A8 (each in its own repo) · T1, T3, T5 (ui; disjoint files)
- W2: T3b, T3c, T2, T4 (need T3; disjoint files)
- W3: T6 (needs every ui task)

Each app repo is integrated and committed on its own (`ui-3: move to subpath imports and onCheckedChange`) as soon
as its task finishes; ui is integrated after T6.

## Review focus

- Exactly 13 runtime names leave the root; nothing else does (api-surface diff); every type the guide lists still
  resolves from its subpath (`dist/*.d.ts`).
- Strings: every key in one group, values byte-identical to 2.1.1, provider overrides still applied in every
  component (spot-check AppShell, Modal, Inbox, DatePicker with a provider), no component left calling
  `useNishStrings`/`useNishConfig`, `useStrings` memo stable (no new object per render without a provider).
- Toast fallback: Undo works in the fallback, no double dismissal, no swipe state leak when the card replaces the
  fallback, live regions unchanged, 44px targets on the fallback buttons, CSP (`tests/a11y/csp.spec.ts`) still
  passes with the new chunk.
- Switch: a leftover `onChange` is a type error in TS and dropped plus warned at runtime in JS.
- Size: AppShell, Toaster and the root rows meet the numbers in T6; `mustNotInclude` holds.
- Migration page at 360x780, 840x900, 1440x900, light and dark: no horizontal page scroll, tables scroll in place,
  code blocks copyable, reachable from the phone nav drawer.
- App PRs: only the listed lines changed; no pin or lockfile changes; behavior identical (each Switch still toggles
  its setting).

## Release

Outward (never run for real by any Workflow agent; the session runs the real ones, once, in this order):
`gh workflow run release.yml`, `npm run release`, `node scripts/release.mjs`, `gh workflow run publish.yml`,
`node tools/npm-publish.mjs`, `npm publish`, `gh release create`, `git tag`, `git push --tags`,
`gh workflow run fanout.yml`, `node tools/fanout/fanout.mjs`, `bash scripts/bump-consumers.sh`, `gh pr merge`,
`git push` to any default branch, `npm run deploy` (startpage), `node scripts/sync-ui.mjs` without `--check`
(hosting), `gh workflow run` of any repo.

Order (the session, after the Workflow returns):

1. **App prep PRs** (A1-A8), one per repo, title `ui-3: move to subpath imports and onCheckedChange`, body linking
   this spec at the spec commit. Merge each when its checks pass (merge commit), watch its deploy to green, check
   health (`https://start.nish.software/health`, `https://status.nish.software/health`,
   `https://trackers.nish.software/health`, `https://workflows.nish.software/health`,
   `https://jobs.nish.software/api/healthz`, `https://streams.nish.software/health`; trading is tailnet-only: its
   green deploy run is the check; nishboard: its CI on master is the check). These can merge before W0 ends.
2. **Fleet gate.** After all eight are merged: `git -C C:\Code\<folder> fetch -q` for every fleet repo and run the
   fleet check script against a fresh `git worktree add --detach <scratch> origin/master` of each (or
   `git -C <repo> grep` on `origin/master`); it prints nothing for every repo. Then `npm pack` the finished
   `ui-3` branch and, per the 2026-11-02 lesson in ship's `preferences.md`, extract it over each app worktree's
   installed `@nish/ui` (`tar --force-local`, never touching package.json or lockfiles) and run that app's typecheck;
   all pass. Remove the scratch worktrees (junction check first).
3. **ui PR.** `git merge origin/master` into `ui-3` (after W0), full checks, final commit `ui-3: release` that deletes
   this spec, deletes the "Other 2.0 leftovers" 3.0 sentence (keep "a CommonJS build and React 18 support, only if
   an outside user asks" as the entry), and rewrites "Root bundle back to 100 KB" to only what is left: "everything
   from `nish-ui` is <measured> KB (target 100); 3.0 moved the fleet names off. The rest needs general components off
   the root (flow 5.4 KB, split 5.0, charts 4.8, Calendar and DatePicker 4.4, VirtualList and VirtualTable 4.2);
   decide whether that is worth a 4.0." Fill the CHANGELOG date. PR, checks (ci, codeql, Fold), merge commit.
4. **Release, once.** Confirm master is quiet (no open ui PR about to merge, no running `release.yml`), then
   `gh workflow run release.yml -R nishant/ui -f bump=major`. Wait for `git ls-remote --tags origin v3.0.0`, the
   publish run, and `npm view nish-ui version` = 3.0.0. A "HEAD is not origin/master" failure: dispatch again once
   master is quiet (nothing landed).
5. **Fan-out.** If no other ui release is pending, `gh workflow run fanout.yml -R nishant/ui -f tag=v3.0.0 -f now=true`
   (default); otherwise wait for the first hourly run after the 2-hour settle. It opens `ui/v3.0.0` in the 14 fleet
   repos (nish.software, startpage, status, trackers, workflows, artifacts, streams, job-apps, trading, inbox,
   nishboard, mc-packs, skills, hosting), all held as a major.
6. **Adopt.** For each, as soon as its PR is open: fetch `ui/v3.0.0`, add an empty commit
   `Adopt @nish/ui 3.0.0 (imports moved in <prep PR link or "no code changes needed">)` with the Nishant identity,
   push (no force). If a bump PR's checks fail, fix on `ui/v3.0.0` (that commit is the adoption). If a PR turns
   CONFLICTING the fan-out reopens it unadopted: adopt the new one. Once checks pass, dispatch
   `fanout.yml -f tag=v3.0.0 -f now=true` again (it merges, watches deploys, reverts a failed deploy), or wait for
   the hourly run.
7. **arora-home**: from `C:\Code\ui` on master, `bash scripts/bump-consumers.sh v3.0.0`; fix its sync script if it
   refuses (`CLAUDE.md` trap).
8. **Verify live**: https://status.nish.software/fleet shows every repo on 3.0.0 and green; each health URL from
   step 1 returns 200; https://design.nish.software/#/migrating renders (hosting's bump ran `sync-ui.mjs`) at 360,
   840 and 1440, light and dark; `npm view nish-ui version` is 3.0.0.
9. **Bookkeeping**: docs-only `[skip ci]` commit in skills: `skills/new-site/references/app-template.md` ~:76 and
   ~:122 name `nish-ui/system-canvas` and `nish-ui/inbox` as where `SystemCanvas`, `Inbox` and `INBOX_SOURCE_LABELS`
   come from. Remove the `*-ui-3` worktrees (junction check first).

Workflow args:
- `checkouts`: ui `C:/Code/ui-ui-3`, startpage `C:/Code/startpage-ui-3`, status `C:/Code/status-ui-3`, trackers
  `C:/Code/trackers-ui-3`, workflows `C:/Code/workflows-ui-3`, job-apps `C:/Code/job-apps-ui-3`, trading
  `C:/Code/trading-ui-3`, nishboard `C:/Code/nishboard-ui-3`, streams `C:/Code/streams-ui-3`; `base`: `origin/master`
  for each (ui: origin/master after the W0 merge).
- `checks` (every command each repo's PR workflow runs):
  - ui: `npm ci && npm run check && npm run test:tools && npm run test:unit -- --coverage && npm run size && CI=1 npx playwright test && npm run build && node tools/consumer-check.mjs ts && node tools/consumer-check.mjs vite && node tools/consumer-check.mjs next`,
    plus the two visual checks as in `ci.yml` (demo on port 5190 with `tools/demo.visual.json`; site build and
    preview on 5191 with `tools/site.visual.json`), and Firefox and WebKit with `NISH_BROWSERS=all npx playwright
    test --project=firefox --project=webkit`. CodeQL and the Fold check run only in CI.
  - startpage: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npm test && npx vite build --outDir <scratch> && cd server && npm ci && npm run typecheck`
  - status: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npm run build && npm test && npm run lint`
  - trackers: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npm run lint && npm run build && npm test && npx tsx scripts/test-pricewatch.ts` (env from `pr.yml` `check-env`)
  - workflows: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npm test && npm run build`
  - job-apps: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npx tsc --noEmit -p packages/worker && npm run lint && npm test && npm run build -w apps/web`
  - trading: `pnpm install --frozen-lockfile && pnpm check && pnpm build`
  - nishboard: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build`
  - streams: `npm ci && node scripts/app-kit/check.mjs && npm run lint --if-present && npm run typecheck && npm run build && npm test && npm run lint`
- `outward`: the list at the top of this section.
- `tasks`: T1, T3, T5, A1-A8 (deps none); T3b, T3c, T2, T4 (deps T3); T6 (deps T1, T2, T3, T3b, T3c, T4, T5).
- `lenses`: correctness (spec conformance, api surface, strings parity), performance (size rows, memo stability,
  lazy chunk), ui (migration page and toast fallback at 360/840/1440, light and dark), security (CSP with the new
  chunk, no new `dangerouslySetInnerHTML` in the Markdown renderer).
- `research`: [].

## Open questions for the research phase

None. Sizes were measured on 2.1.1 (Decisions); T6 measures the final numbers.
