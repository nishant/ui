# App building blocks and guardrails (@nish/ui 1.0.0)

Status: in progress · Slug: app-blocks · Date: 2026-10-31 · Size: large
Repos: ui (spec lives here). Checkout: `C:\Code\ui-app-blocks`, branch `app-blocks` from `origin/master`.
ROADMAP: `ROADMAP.md`, "App building blocks and guardrails (1.0.0)"

## Goal

Every nish.software app rebuilds the same app-level plumbing (shell, data fetching, error boundary,
theme-init plugin, filter bar, settings rows, breakpoints) and has drifted. This adds those blocks to
@nish/ui, each with a docs page on design.nish.software, adds guardrails that stop silent theme-class
typos and overlay regressions, moves releases to CI, and cuts **1.0.0**. Apps adopt the blocks later
(wave 2), not here.

Outcomes (each checkable):
1. `AppShell` composes AppHeader, NavRail, BottomNav + MoreSheet, PageContainer, Toaster, ConnectionBanner,
   LoadingBar and a skip link, from one `nav` list. Docs page `#/components/app-shell`.
2. `apiFetch`, `ApiError` and `useResource` (pauses while the tab is hidden, refetches on reconnect and on
   becoming visible, optional polling, abort on unmount). Docs page `#/components/use-resource`.
3. `AppErrorBoundary` with a themed fallback and reset. Docs page `#/components/app-error-boundary`.
4. `nishThemeInit()` Vite plugin from the new subpath `@nish/ui/vite`. Docs page `#/components/vite-plugin`.
5. `FilterBar`, `FilterSheet` and `useUrlState`. Docs page `#/components/filter-bar`.
6. `SettingsSection`, `SettingRow`, `NumberField` (saves on blur/Enter). Docs page `#/components/settings`.
7. `Combobox` (ARIA 1.2 combobox + listbox). Docs page `#/components/combobox`.
8. `BREAKPOINTS`, `PHONE_QUERY`, `NARROW_QUERY`, `usePhone()`, `useNarrow()`. Documented on the hooks page.
9. Icon decision (lucide-react for apps, ui inlines its own) documented on a new Foundations page `#/icons`
   and in README.
10. `@nish/ui/eslint` flat-config preset (plugin `nish`, folds in trading's theme lock-in rules) and a
    `nish-th-check` CLI; ui's own `npm run check` runs the checker over `src site demo`; `bg-th-hover` in
    `nav.tsx` fixed.
11. Playwright overlay interaction specs: Escape order, focus trap and return, Android/browser back. Run in CI.
12. `tailwind.css` `@source` scans only shipped component JS (no `.map`, no `.d.ts`, no node-only files);
    the React entry builds in its own tsup config with `splitting: true`.
13. Toasts announced through persistent live regions; content behind an open Modal/Drawer/ConfirmDialog is
    `inert`.
14. Releases run from `.github/workflows/release.yml` (workflow_dispatch): HEAD must equal origin/master,
    master is pushed before the tag, a GitHub Release is created, the fan-out is dispatched.
15. README "Used by" table matches `hosting/fleet.yaml` reality. CHANGELOG has a `[1.0.0]` entry.
16. v1.0.0 released; fan-out bump PRs opened.

## Out of scope

- Adopting any of these in apps (wave 2). No edits outside the ui repo.
- `src/inbox-client.ts`, `src/inbox-types.ts` (owned by the server-kit session) and `tools/fanout/**`
  (server-kit extends the fan-out for @nish/server).
- `text-th-hi1` in workflows, `bg-th-surface-2` in startpage (their sessions).
- LoginCard / PasswordGate (not approved in this wave).
- Any change to theme tokens or colors.

## Decisions

- One release, 1.0.0, with everything. Wave 2 treats any v1.x tag as "landed", so no partial 1.0.0.
- 1.0.0 is a major only by semver policy (the fan-out's major hold starts working); there are no
  breaking API removals. `bg-th-hover` was never a defined class, so replacing it is a fix.
- Icons: apps use `lucide-react` (^1, already in trading, startpage, nishboard); @nish/ui never depends on an
  icon package and keeps inlining the few icons its components need, drawn on lucide's 24px grid, 2px
  stroke, so they match. Why: per-icon ESM tree-shaking, a large maintained set, MIT, no release of ui
  needed for a new icon, and three apps already use it. Sizes: 16px inline with text, 20px in buttons and
  IconButtons, 20–24px in nav (`NavItem.icon`).
- Node-only entries (`@nish/ui/vite`, `@nish/ui/eslint`, the `nish-th-check` bin) build to `dist/node/`,
  `platform: 'node'`, and are excluded from Tailwind's scan. They import nothing from React.
- The ESLint preset is a plugin with its own rules (not `no-restricted-syntax`), so it never clobbers an
  app's own `no-restricted-syntax` options (flat config replaces rule options rather than merging). It ships
  no parser; apps put it after `tseslint.configs.recommended`. It has no runtime dependencies.
- Unit tests: add `vitest` + `happy-dom` + `@testing-library/react` (devDependencies) and `npm run test:unit`
  for the new hooks and the ESLint rules. Overlay interaction specs use `@playwright/test` against a small
  Vite harness (the docs site renders overlays in iframes, where history handling is disabled on purpose).
- `useUrlState` defaults to `location.search` + `history.replaceState` (no router dependency) and takes an
  optional adapter so apps on React Router can pass `useSearchParams`-backed get/set.
- `useResource` treats HTTP 401 as an error with `status: 401` and calls an optional global
  `onUnauthorized` (set once via `configureApi`), default: none. (default)
- `inert` is applied to `document.body` children other than the top dialog's portal and anything marked
  `data-nish-keep-active` (the Toaster). Elements already `inert` before are left as they were.
- Release job uses `GITHUB_TOKEN` (`contents: write`, `actions: write`). A tag pushed with GITHUB_TOKEN does
  not trigger other workflows, so the job dispatches `fanout.yml` with `tag=vX.Y.Z` explicitly.
- `scripts/release.mjs` stays usable locally but now pushes master first, and refuses unless HEAD equals
  `origin/master` after a fetch.

## Current state (from research)

Across the apps (survey 2026-10-31): job-apps and trading rebuild an AppShell (react-router 7 / 6) with
NavRail + BottomNav(4 + More) + MoreSheet (profile, status, log out via onSelect) + desktop header tabs
(`tabClass`, `hidden lg:flex`); trackers/workflows use a tiny pushState router and a hand-written
`renderLink`; status uses plain `<a>` tabs. No app uses `LoadingBar` or `.nish-skip-link`. Fetch helpers:
status/trackers/workflows `api<T>()` + `ApiError(message, status)`, network error → status 0, message from
`body.error`; workflows adds a 10s timeout, `nullOn404`, 401 → authed store; job-apps/trading redirect on 401.
Polling: status `useLoad` (pauses hidden, refetch on visible/online, `updatedAt`), workflows `usePoll`
(`stale` after 3 missed intervals). Theme-init plugins: head-prepend tag (trackers, startpage, job-apps,
trading), splice after `<meta charset>` with a legacy `theme` → `nish-theme` migration (status, workflows),
nishboard prepends an app prelude. URL filters: trading `useUrlState(key)` via `useSearchParams` replace,
job-apps repeated keys (`loc`) — so arrays are written as repeated keys (values like "Austin, TX" contain
commas). job-apps' filter panel is a sheet below lg. Settings: trading NumberField saves on blur with a
1.5s "Saved"; nishboard save state machine (saved 2s, error 3s). Breakpoints everywhere are Tailwind's
640/768/1024/1280. Icons: lucide-react in trading/startpage (^0.577) and nishboard (^1.61); hand-made sets
in trackers, status, job-apps.

- Exports: `src/index.ts` (explicit named exports, grouped by file). Subpaths in `package.json#exports`.
  Build: `scripts/build.mjs` runs `npx tsup` (config `tsup.config.ts`: one ESM config for index/theme/format/
  inbox-client/chart with `splitting: false`, one IIFE for theme.global), then writes CSS. It ends with
  self-tests (`testInit`, `testGlobal`, `testTokensEntry`, `testCn`) that throw on failure.
- `dist/tailwind.css` is generated in `scripts/build.mjs` (the `tailwindCss` array) and contains
  `@source "./";`, which scans all of dist (including `.map` with `sourcesContent`, `.d.ts`).
- Tailwind colors: `th-<name>` for every COLOR_ROLE, `<soft>-soft`, `<soft>-soft-solid`, plus aliases
  `gain`, `danger`, `2`, `3`, `bar`, `focus` (the `twColors` array in build.mjs).
- `bg-th-hover` (undefined) in `src/components/nav.tsx:311` (MoreSheet row) and `:397` (BottomNav pill
  `group-hover:bg-th-hover`). The hover role is `elevated` ("popovers, hovered rows" in `src/tokens.mjs`).
- Breakpoints: `src/components/hooks.tsx` has a private `BREAKPOINTS` list and `useBreakpoint()`;
  `overlay.tsx` has `PHONE_QUERY = '(max-width: 639px)'`; `DropdownMenu` has its own `usePhoneViewport`.
- Overlays (`src/components/overlay.tsx`): one `layerStack`; `useDialog(panelRef, onClose, closeOnBack)`
  pushes a history entry per dialog (`nishLayer` state) and closes on popstate; dialogs portal a scrim
  `<div data-nish-layer>` into `document.body`; `dialogCount`/`syncLayerAttr()` mark
  `html[data-nish-layer-open]`. Focus trap in `useDialog`; focus returns to the opener on close.
- Toaster (`src/components/toast.tsx:197`) portals a container to body; each `ToastCard` has
  `role={tone==='error' ? 'alert' : 'status'}` on a node that is inserted with its text (not reliably
  announced: a live region must exist before its content changes).
- Nav (`src/components/nav.tsx`): `NavItem { key,label,icon,href?,onSelect?,active?,badge?,hint? }`,
  `RenderLink`, `BottomNav { items, more?, trailing?, hideFrom='md', label, renderLink }`,
  `MoreSheet { open,onClose,items,title,footer,renderLink }`, `NavRail { items,tools,footer,showFrom='md',
  hideFrom='lg'|false, label, renderLink }`. `AppHeader` (`display.tsx:920`) takes name, icon, hubHref,
  actions, nav, themeToggle, sticky, innerClassName, homeHref, hideNameBelow, navLabel, compactPill, glass.
  `PageContainer { size, padBottom=true, as='main' }`, `ConnectionBanner { healthUrl, intervalMs, ... }`,
  `LoadingBar { active }` in `layout.tsx`. `tabClass` in `tabs.tsx`. `useOnline()` in `layout.tsx`.
- Docs site: hash routes. Component pages are `ComponentDoc` objects (`site/components/types.ts`), one file
  per page in `site/components/<id>.tsx`, registered in `site/components/index.ts` (`COMPONENT_DOCS`).
  Props tables come from `site/docgen.mjs` (`COMPONENTS` list of export names, read from the TS source).
  Phone-sized previews use `Device` from `site/components/bottom-nav.tsx`; fixed/portaled components set
  `framed: { height }`. Site nav groups live in `site/main.tsx` (`NAV`, `page()`).
  `tools/site.visual.json` lists pages the CI visual check screenshots.
- Releases: `scripts/release.mjs` (runs `npm run check`, bumps, commits, builds a detached tag commit with
  `dist` and `site-dist`, then pushes master and the tag). No GitHub Release objects exist (tags only).
  The tag push triggers `.github/workflows/fanout.yml`, which also has `workflow_dispatch` with input `tag`.
  hosting serves design.nish.software from the tag's `site-dist` (synced by the fan-out's hosting bump).
- CI: `.github/workflows/ci.yml` (Node 24): `npm ci`, `npm run check`, `npm run test:tools`, Playwright
  chromium install, demo + site visual checks.
- `tsconfig.json` includes `src`, `demo`, `site` (noEmit, strict, `noUnusedLocals`).

## Design

### Breakpoints (T4, `src/components/hooks.tsx`)

```ts
/** Tailwind's breakpoints, in px. Phone = below sm; narrow = below md (cover screen and small tablets). */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;
export const PHONE_QUERY = '(max-width: 639.98px)';
export const NARROW_QUERY = '(max-width: 767.98px)';
/** True below 640px (the Fold's cover screen, any phone held upright). */
export function usePhone(): boolean { return useMediaQuery(PHONE_QUERY); }
/** True below 768px: where BottomNav shows and NavRail hides. */
export function useNarrow(): boolean { return useMediaQuery(NARROW_QUERY); }
```
The private list used by `useBreakpoint` is rebuilt from `BREAKPOINTS` (same behavior).

### apiFetch / ApiError / useResource (T4, new `src/components/resource.ts`)

```ts
export class ApiError extends Error {
  readonly status: number;        // HTTP status; 0 = network failure or abort-by-timeout
  readonly body: unknown;         // parsed JSON body when the response had one, else the text, else null
  readonly url: string;
  constructor(message: string, o: { status: number; body?: unknown; url: string });
  /** True for 0 (network) and 5xx: worth retrying. */
  get retryable(): boolean;
}
export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Serialized as JSON with content-type application/json. A string/FormData/Blob is sent as is. */
  body?: unknown;
  /** Aborts and throws ApiError(status 0, message "Request timed out") after this many ms (covers the body read too). Default 15000. */
  timeoutMs?: number;
  /** Resolve null instead of throwing on 404. */
  nullOn404?: boolean;
}
export interface ApiConfig {
  /** Prefixed to relative paths that start with "/". Default "". */
  baseUrl?: string;
  /** Called (once per response) for any 401 before the error is thrown. */
  onUnauthorized?: (err: ApiError) => void;
  /** Extra headers on every request (an auth token for an Electron app). */
  headers?: () => Record<string, string>;
}
export function configureApi(c: ApiConfig): void;     // merges into a module-level config
export async function apiFetch<T = unknown>(path: string, o?: ApiFetchOptions): Promise<T>;
```
apiFetch: `credentials: 'same-origin'` default, `accept: application/json`; on 2xx returns parsed JSON
(204 or empty body → `undefined as T`; non-JSON content-type → text). On non-2xx: message is
`body.error` or `body.message` when the JSON body has a string there, else `"<status> <statusText>"`,
else `"Request failed"`. Network TypeError → `ApiError("Can't reach the server", { status: 0 })`.
An AbortError from the caller's own `signal` is rethrown unchanged (callers check `signal.aborted`).

```ts
export interface UseResourceOptions<T> {
  /** Poll every N ms while the tab is visible. Off by default. */
  intervalMs?: number;
  /** false skips fetching (dependent queries). Default true. */
  enabled?: boolean;
  /** Refetch when the tab becomes visible again after being hidden ≥ this many ms. Default 30000; 0 = always; false = never. */
  refetchOnVisible?: number | false;
  /** Refetch when the browser comes back online. Default true. */
  refetchOnReconnect?: boolean;
  /** Seed data shown before the first load finishes. */
  initialData?: T;
  /** Keep the previous key's data while a new key loads. Default true. */
  keepPrevious?: boolean;
}
export interface Resource<T> {
  data: T | undefined;
  error: ApiError | Error | undefined;   // cleared by the next successful load
  /** True only while there is no data yet. */
  loading: boolean;
  /** True during any fetch, including background refreshes. */
  refreshing: boolean;
  /** When data last loaded successfully (ms epoch), or undefined. */
  updatedAt: number | undefined;
  /** With intervalMs: true when the last success is older than 3 intervals (show a "data may be out of date" hint). Always false without intervalMs. */
  stale: boolean;
  /** Refetch now. Resolves when done; never rejects. */
  reload: () => Promise<void>;
  /** Replace data locally (optimistic update). A function gets the previous data. */
  mutate: (next: T | ((prev: T | undefined) => T)) => void;
}
/** key: a string identifying the request (the URL); null disables. fetcher defaults to apiFetch(key, { signal }). */
export function useResource<T>(key: string | null, fetcher?: (signal: AbortSignal) => Promise<T>, o?: UseResourceOptions<T>): Resource<T>;
```
Behavior: one in-flight request per hook; a new fetch aborts the previous; unmount aborts. Polling uses a
timeout chain (next tick scheduled after the previous fetch settles), skipped while `document.hidden`;
on `visibilitychange` to visible: refetch if hidden ≥ `refetchOnVisible` ms or a poll was skipped while
hidden. `online` event → refetch (if `refetchOnReconnect`). Key change → fetch the new key; with
`keepPrevious` the old data stays (loading stays false) until the new data or error arrives. A fetch that
errors keeps the last good data. `fetcher` is read through a ref (an inline arrow does not refetch every render).
No global cache, no dedupe across hooks (keep it small).

### AppErrorBoundary (T4, new `src/components/error-boundary.tsx`)

```ts
export interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the default fallback. */
  fallback?: (o: { error: Error; reset: () => void }) => ReactNode;
  /** Called once per caught error (send to a log endpoint). */
  onError?: (error: Error, info: { componentStack?: string | null }) => void;
  /** When any value changes, a shown error resets (pass [location.pathname] to reset on navigation). */
  resetKeys?: unknown[];
}
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, { error: Error | null }>;
```
Default fallback: a centered `Card` (max-w-md, `mx-auto my-16`) with `role="alert"`, heading
"Something went wrong" (text-lg font-semibold text-th-hi), the message in `text-sm text-th-hi2`
(`error.message`, truncated to 300 chars), a `<details>` "Details" with the stack in a mono `pre`
(text-xs, max-h-48 overflow-auto), and two buttons: primary "Try again" (reset) and secondary
"Reload page" (`location.reload()`). Works with no Toaster or theme context. An error whose `name` is
`ChunkLoadError` or whose message matches `/Failed to fetch dynamically imported module|Importing a module script failed/`
shows "A new version is available" + "Reload page" as primary instead (stale deploy after a release).

### nishThemeInit Vite plugin (T1, new `src/node/vite.ts`, subpath `@nish/ui/vite`)

```ts
import type { Plugin } from 'vite';  // type-only; vite is NOT a dependency (types erased)
export interface NishThemeInitOptions {
  /** Path to theme-init.js. Default: resolved from this package (../theme-init.js next to dist/node). */
  file?: string;
  /** Where the script goes. 'head-prepend' (default) is the first thing in <head>. 'after-charset' splices it
   *  right after `<meta charset…>` (the charset must stay in the first 1024 bytes); throws if the page has none. */
  position?: 'head-prepend' | 'after-charset';
  /** JS run before theme-init in the same script (nishboard sets app presets this way). */
  prelude?: string;
  /** An old localStorage key (e.g. 'theme') whose value is copied to 'nish-theme' once, when there is no
   *  nish-theme cookie or localStorage value yet. Runs before theme-init. */
  legacyKey?: string;
}
export function nishThemeInit(o?: NishThemeInitOptions): Plugin;
```
Reads `dist/theme-init.js` once (relative to `import.meta.url`: `new URL('../theme-init.js', import.meta.url)`),
`.trim()`s it, builds `code = [legacy migration snippet if legacyKey, prelude, themeInit].join('\n')`.
'head-prepend': returns `{ name: 'nish-theme-init', transformIndexHtml: { order: 'pre', handler: () => [{ tag: 'script',
children: code, injectTo: 'head-prepend' }] } }`. 'after-charset': `handler: (html) => html.replace(/<meta\s+charset[^>]*>/i, m => m + '<script>' + code + '</script>')`,
throwing "@nish/ui/vite: no <meta charset> in index.html" when it does not match. The legacy snippet:
`try{var k=<JSON legacyKey>,v=localStorage.getItem(k);if(v&&!localStorage.getItem('nish-theme')&&!/(?:^|; )nish-theme=/.test(document.cookie))localStorage.setItem('nish-theme',v)}catch(e){}`.
Throws a clear error at plugin creation if the file is
missing ("@nish/ui/vite: theme-init.js not found at <path>"). Usage: `plugins: [nishThemeInit(), react(), tailwindcss()]`.
Since vite is only a type import, write the return type as a local structural interface compatible with
Vite's `Plugin` (so the d.ts does not need `vite` installed): `{ name: string; transformIndexHtml: { order: 'pre'; handler: (html: string) => string | { tag: string; children: string; injectTo: 'head-prepend' }[] } }`.

### FilterBar / FilterSheet / useUrlState (T5)

`src/components/url-state.ts`:
```ts
export interface UrlStateAdapter {
  get(): URLSearchParams;
  set(next: URLSearchParams): void;            // replace, not push
  subscribe(onChange: () => void): () => void;
}
export const locationAdapter: UrlStateAdapter;  // location.search + history.replaceState (keeps hash and history.state) + popstate + a 'nish:urlstate' window event fired after set
type Shape = Record<string, string | string[] | number | boolean>;
/** Typed URL query state. Values equal to the default are omitted from the URL. */
export function useUrlState<S extends Shape>(defaults: S, o?: { adapter?: UrlStateAdapter; prefix?: string }):
  [S, (patch: Partial<S> | ((prev: S) => Partial<S>)) => void, () => void /* reset to defaults */];
```
Parsing by the default's type: string → as is; number → `Number()`, NaN → default; boolean → `'1'|'true'`
true, `'0'|'false'` false; string[] → `getAll(key)` (repeated keys; also accepts one comma-separated value).
Writing: arrays as repeated keys, booleans as `1`/`0`, keys with default values deleted. `prefix` namespaces
keys (`prefix: 'j'` → `j.q`). Unknown keys in the URL are preserved. Snapshot is memoized by the query
string so `useSyncExternalStore` stays stable.

`src/components/filters.tsx`:
```ts
export interface FilterBarProps {
  /** Search box value and change handler. Leave out for no search box. */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string };
  /** The filter controls (Chips, Selects, Segmented). Shown inline from md up; behind the Filters button below md. */
  children?: ReactNode;
  /** How many filters differ from their defaults: shown as a count on the Filters button. */
  activeCount?: number;
  /** Shows "Clear" when activeCount > 0 (inline from md, in the sheet footer below md). */
  onClear?: () => void;
  /** Right-aligned extras that stay visible at every width (a sort Select, a view toggle). */
  trailing?: ReactNode;
  /** Sticks under the header (top: var(--nish-header-h)). Default false. */
  sticky?: boolean;
  /** Title of the phone sheet. Default "Filters". */
  sheetTitle?: string;
  /** Below this breakpoint the children move into the FilterSheet. Default 'md' (768); 'lg' (1024) for wide filter sets. */
  sheetBelow?: 'md' | 'lg';
  /** Result count line under the bar, e.g. "42 jobs". */
  summary?: ReactNode;
  className?: string;
}
export function FilterBar(p: FilterBarProps): JSX.Element;
export interface FilterSheetProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; onClear?: () => void; activeCount?: number; resultLabel?: string /* "Show 42 results" button text; default "Done" */ }
export function FilterSheet(p: FilterSheetProps): JSX.Element | null;   // a bottom Drawer (side="bottom") with footer [Clear (ghost, if onClear)] [primary resultLabel → onClose]
```
Layout: one row, `flex flex-wrap items-center gap-2`. Below md (`useNarrow()`): SearchInput grows
(`min-w-0 flex-1`), then a Filters `Button` (variant secondary, size md, 44px tall, a funnel icon inlined,
label "Filters", and when `activeCount > 0` a count `Badge` "2"), then `trailing`; children render only in
the FilterSheet. From md up: search (`w-full max-w-xs`), children inline, Clear (`Button variant="ghost"`
"Clear filters") when `activeCount > 0 && onClear`, `trailing` pushed right (`ml-auto`). `sticky`:
`sticky top-[var(--nish-header-h,0px)] z-20 bg-th-bg py-2` with a bottom border. `summary` renders under
the row in `text-sm text-th-hi3`, `aria-live="polite"`. No horizontal scroll at 360px with a search, a
Filters button and one trailing Select. Filter state is the app's; examples show `useUrlState`.

### Settings blocks (T6, new `src/components/settings.tsx`)

```ts
export interface SettingsSectionProps { title: ReactNode; description?: ReactNode; id?: string; /** Right side of the heading (a Reset button). */ actions?: ReactNode; children: ReactNode; className?: string }
export function SettingsSection(p): JSX.Element;
// <section aria-labelledby> → h2 (text-base font-semibold text-th-hi) + description (text-sm text-th-hi3),
// then a Card (padding none) whose children are rows separated by `divide-y divide-th-line`.

export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** The control (Switch, Select, NumberField, Button). */
  children: ReactNode;
  /** id of the control, so the label is a <label htmlFor>. */
  htmlFor?: string;
  /** Stack the control under the label at every width (wide controls, textareas). Default: side by side from sm up, stacked below. */
  stacked?: boolean;
  /** A muted status after the control: "Saved", "Saving…", or an error (tone="error" → text-th-loss). */
  status?: ReactNode;
  statusTone?: 'muted' | 'error' | 'ok';
  className?: string;
}
export function SettingRow(p): JSX.Element;
// px-4 py-3, min-h-[56px]. sm+: grid grid-cols-[1fr_auto] gap-4 items-center; label column: label (text-sm font-medium text-th-hi) + description (text-sm text-th-hi3).
// Below sm (and when stacked): flex-col gap-2, control full width (w-full on the wrapper).
// Prop `inline?: boolean` (default false): keep the control at the end of the label row at every width (Switch, Checkbox).

export interface NumberFieldProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'defaultValue'> {
  value: number | null;
  /** Called on blur and on Enter with the parsed, clamped value, only when it differs from `value`. May return a promise: the field shows a spinner state and, on rejection, restores the old value and sets aria-invalid with the error message under it. */
  onCommit: (next: number | null) => void | Promise<void>;
  min?: number; max?: number; step?: number;
  /** Allow an empty field (commits null). Default false: an empty field restores the value. */
  nullable?: boolean;
  /** Unit text after the input ("%", "days"). */
  suffix?: ReactNode;
  /** Decimal places kept when committing. Default: as typed. */
  precision?: number;
}
export function NumberField(p): JSX.Element;
```
```ts
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
/** Tracks one save: run(promise) → 'saving' → 'saved' for 1500ms (or 'error' for 3000ms, with the message) → 'idle'.
 *  `label` is the text for SettingRow.status: "Saving…", "Saved", the error message, or null. Rethrows nothing. */
export function useSaveStatus(): { status: SaveStatus; error: string | null; label: string | null; tone: 'muted' | 'ok' | 'error'; run: <T>(p: Promise<T>) => Promise<T | undefined> };
```
NumberField: `<Input type="text" inputMode="decimal">` (no spinner arrows; mobile numeric keypad),
local draft string; Escape restores and blurs; ArrowUp/ArrowDown step by `step` (default 1) clamped;
on commit parse (`Number(draft.replace(/,/g, ''))`), NaN → restore value + `aria-invalid` flash for this
render with message "Enter a number"; clamp to min/max; round to precision. Width `w-28` default
(className overrides); font-size 16px on phones (Input already does this — verify). `suffix` sits in a
flex wrapper after the input, `text-sm text-th-hi3`.

### Combobox (T7, new `src/components/combobox.tsx`)

```ts
export interface ComboboxOption { value: string; label: string; hint?: string; disabled?: boolean }
export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null, option: ComboboxOption | null) => void;
  /** Filtering. Default: case-insensitive substring on label and hint; show at most 50. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Allow committing typed text that matches no option (creates); onChange gets (text, null). */
  allowCustom?: boolean;
  placeholder?: string;
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string;
  id?: string;
  disabled?: boolean;
  /** Shown when nothing matches. Default "No matches". */
  emptyText?: string;
  /** Async options: called (debounced 200ms) with the query; while pending show a Spinner row "Searching…". */
  onQueryChange?: (q: string) => void;
  loading?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}
export function Combobox(p): JSX.Element;
```
ARIA 1.2: `input role="combobox" aria-expanded aria-controls={listId} aria-autocomplete="list"
aria-activedescendant`; listbox `ul role="listbox"` with `li role="option" aria-selected id`. Keyboard:
ArrowDown/ArrowUp open and move (wrap), Home/End within the list when open, Enter selects the active
option (or custom text when `allowCustom`), Escape closes (second Escape clears the query back to the
selected label), Tab selects nothing and closes. Mouse: `onMouseDown` preventDefault on options, click
selects. Typing opens. On blur: query resets to the selected option's label (or the custom value).
A clear button (XIcon, 32px visual / 44px hit area via padding, `aria-label="Clear"`) shows when value
is set and not disabled. List: absolutely positioned under the input (`absolute left-0 right-0 top-full
mt-1 z-40 max-h-64 overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop`), options
`min-h-11 px-3 text-sm`, active option `bg-th-accent-soft text-th-hi`, selected shows CheckIcon. It
must also work inside a Modal/Drawer (no portal needed: absolute inside the dialog's scroll area; when
the panel scrolls the list goes with it). Uses `fieldClass` from primitives for the input look.

### AppShell (T3, new `src/components/app-shell.tsx`)

```ts
export interface AppShellProps {
  /** App name (wordmark) and icon for the header. */
  name: ReactNode;
  icon?: ReactNode;
  /** Home link on the icon and name. Default "/". */
  homeHref?: string;
  hubHref?: string;
  /** Every destination, in order. All show in the rail and the desktop header nav; the BottomNav shows the first `primary` and puts the rest in a MoreSheet. */
  nav: NavItem[];
  /** How many items the BottomNav shows before "More". Default 4; when nav.length <= 5 all fit and there is no More. */
  primary?: number;
  /** Extra MoreSheet-only items (settings, sign out) shown after the overflow nav items. */
  moreItems?: NavItem[];
  renderLink?: RenderLink;
  /** Header buttons before the theme toggle. */
  actions?: ReactNode;
  /** Replaces the header's ThemeToggle; false hides it. */
  themeToggle?: ReactNode | false;
  /** Pinned to the bottom of the NavRail. */
  railFooter?: ReactNode;
  /** Shows the top LoadingBar. */
  loading?: boolean;
  /** Passed to ConnectionBanner; false hides the banner. Default {} (browser online state only). */
  connection?: ConnectionBannerProps | false;
  /** PageContainer size, or false to render children with no container (full-bleed pages). Default 'default'. */
  container?: PageContainerProps['size'] | false;
  /** Toaster props, or false when the app renders its own. Default {}. */
  toaster?: ToasterProps | false;
  /** Wraps the page in AppErrorBoundary (reset on resetKey change). Default true. */
  errorBoundary?: boolean;
  /** Changes reset the error boundary and close the MoreSheet (pass the pathname). */
  resetKey?: string;
  children: ReactNode;
}
export function AppShell(p: AppShellProps): JSX.Element;
```
Structure:
```
<a href="#nish-main" class="sr-only focus:not-sr-only ...">Skip to content</a>
<AppHeader name icon homeHref hubHref actions themeToggle hideNameBelow="sm" (only if icon) compactPill
           nav={<desktop nav: tab links for every nav item, className lg:flex hidden>} navLabel="Sections" />
<LoadingBar active={!!loading} />
{connection !== false && <ConnectionBanner {...connection} />}
<div class="md:flex">
  <NavRail items={nav} showFrom="md" hideFrom="lg" footer={railFooter} renderLink />
  <div class="min-w-0 flex-1">
    {container === false ? <main id="nish-main" tabIndex={-1}>…</main>
                         : <PageContainer size={container} id="nish-main" tabIndex={-1}>…</PageContainer>}
  </div>
</div>
<BottomNav items={nav.slice(0, n)} more={overflow.length ? {...} : undefined} renderLink />
<MoreSheet open onClose items={[...overflow, ...moreItems]} renderLink />
{toaster !== false && <Toaster {...toaster} />}
```
The skip link uses the existing `.nish-skip-link` class from `src/css/base.css` (read it). The NavRail
wrapper is sticky under the header: `sticky top-[var(--nish-header-h,0px)] h-[calc(100dvh-var(--nish-header-h,0px))] self-start`
(check what NavRail already does in nav.tsx and do not double it). When there is a MoreSheet (overflow or
`moreItems`), the header's theme toggle is hidden below md (`max-md:hidden` on its wrapper; MoreSheet's default
footer is a Theme row); otherwise it shows at every width.
Where `n = nav.length <= 5 ? nav.length : primary` and `overflow = nav.slice(n)`. More is `active` when
an overflow or moreItems item is active. MoreSheet closes when `resetKey` changes. The desktop header nav
renders each item with `tabClass` (from tabs.tsx) via `renderLink` (or `<a>`), `aria-current="page"` on
the active one, visible only from lg (`hidden lg:flex`), so: <768 BottomNav, 768–1023 NavRail,
≥1024 header tabs. `moreItems` show from lg in the header `actions`? No: from md up they are not in the
rail or tabs, so put them in a `DropdownMenu` behind a MoreIcon `IconButton` (`aria-label="More"`) in the
header actions, shown `hidden md:inline-flex`, only when `moreItems.length`. PageContainer must accept
`id` and `tabIndex` (it already spreads? check `layout.tsx`; if it does not, render
`<PageContainer as="div">` inside `<main id tabIndex>`; do not edit layout.tsx).

### ESLint preset and th-class checker (T2)

`src/node/th-classes.ts` (shared core, no deps):
```ts
export const TH_COLOR_NAMES: ReadonlySet<string>;  // from src/th-colors.mjs (T1)
/** Every th-* class token in a string that names a color th does not define: ['bg-th-hover', ...]. */
export function unknownThClasses(text: string): string[];
```
Matching: tokens of the form `(<variant>:)*!?(-)?<utility>-th-<name>(/<opacity>)?` where utility is one of
`bg text border border-x border-y border-t border-r border-b border-l border-s border-e ring ring-offset
outline divide decoration fill stroke from via to shadow inset-shadow inset-ring accent caret placeholder`,
and `var(--color-th-<name>)`. Regex sketch:
`/(?:^|[\s"'`{(,])(?:[a-z0-9-]+:|\[[^\]]+\]:)*!?-?(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|divide|decoration|fill|stroke|from|via|to|shadow|inset-shadow|inset-ring|accent|caret|placeholder)-th-([a-z0-9-]+?)(?:\/[\w.[\]%-]+)?(?=$|[\s"'`}),;])/g`
plus `/--color-th-([a-z0-9-]+)/g`. Report the whole token. A name is known if it is in TH_COLOR_NAMES.

`src/node/eslint.ts` — default export a flat-config array; named exports `plugin` and `rules`:
- `nish/no-unknown-th-class`: every string Literal and TemplateElement (`quasi.value.cooked`) passed to
  `unknownThClasses`; message `Unknown theme class "{{cls}}": th-{{name}} is not a @nish/ui color. Use one of th-hi, th-hi2, th-elevated, … (design.nish.software/#/color).`
- `nish/no-raw-palette`: trading's raw palette regex (`(bg|text|border|ring|fill|stroke|outline|divide|decoration|from|to|via)-(slate|gray|…|rose)-\d`), message "Raw palette classes bypass the theme. Use a th-* role (text-th-hi2, bg-th-ok-soft, …)."
- `nish/no-white-black`: `(bg|text|border)-(white|black)` → "text-white / bg-black ignore the theme. Use th-on-* on solid fills, or a surface role."
- `nish/no-legacy-th-alias`: `-th-(gain|danger|2|3|bar|focus)` → "Legacy th-* alias. Gains are th-ok, danger is th-loss, th-2/th-3 are th-hi2/th-hi3."
- `nish/no-hand-mixed-tint`: `bg-th-(accent|ok|loss|warn|info)/(5|10|15)` → "Hand-mixed tint. Use bg-th-<role>-soft (and border-th-<role>/30 on it)."
- `nish/no-arbitrary-text-size`: `text-\[\d+(px|rem)\]` → "Arbitrary font size. Use the scale, including text-2xs (11px) and text-3xs (10px)."
Each rule's `meta: { type: 'problem', docs: { description, url: 'https://design.nish.software/#/getting-started' }, schema: [] }`.
Default export: `[{ name: 'nish/recommended', files: ['**/*.{js,jsx,ts,tsx,mjs}'], plugins: { nish: plugin }, rules: { 'nish/<each>': 'error' } }]`.
Regexes use the same `(^|[\s:])` lead as trading so `hover:bg-red-500` matches.

`src/node/th-check.ts` — CLI (bin `nish-th-check`, `#!/usr/bin/env node`): args = dirs/files (default
`src`); walks `.ts .tsx .js .jsx .mjs .html .css .vue .svelte` files, skipping `node_modules`, `dist`,
`site-dist`, `.git`, `coverage`; for each line prints `path:line: unknown theme class bg-th-hover` and
exits 1 if any, else prints `th-check: N files, no unknown th-* classes` and exits 0. Also exported
`checkFiles(paths: string[]): { file: string; line: number; cls: string }[]` for tests.

### Overlay a11y (T8, `overlay.tsx`, `toast.tsx`)

inert: in `overlay.tsx` add a module-level `dialogPortals: HTMLElement[]` (scrim elements, oldest first).
`useDialog` gets the scrim element (`panelRef.current.closest('[data-nish-layer]')`) and calls
`pushInert(scrim)` on open, `popInert(scrim)` on close. `syncInert()` makes every `document.body` child
that is not the top scrim, does not contain it, and has no `data-nish-keep-active` attribute `inert`
(set the `inert` property and attribute); it records elements it set in a WeakSet/Set so it only
un-inerts what it set; when no dialog is open it un-inerts all it set. Lower dialogs' scrims become inert
under a top one. Popover/DropdownMenu/Tooltip are not dialogs (unchanged). Floating panels opened inside a
dialog portal into that dialog (existing `layerHost`), so they are not inerted. The Toaster's portal root
gets `data-nish-keep-active` (T8 owns toast.tsx). Sync runs on each push/pop over the body children present
at that moment (no MutationObserver): each new dialog re-syncs, and non-dialog floating panels opened from
inside a dialog portal into it (layerHost).

Toast live regions: the Toaster renders, in the same portal, two visually hidden (`sr-only`) live regions
that are always mounted: `<div role="status" aria-live="polite" aria-atomic="true">` and
`<div role="alert" aria-live="assertive" aria-atomic="true">`. When a toast is added, after 100ms its text
(`title` + ". " + `description` when present) is written to the polite region (assertive for `error`
tone), replacing the previous text; the region is cleared 5s later. Visible ToastCards drop their own
`role`/`aria-live` (they keep `aria-hidden` off, so screen-reader users can still navigate to action
buttons). Toast action buttons keep working while a dialog is open (keep-active).

### Overlay interaction specs (T9, Playwright)

`tests/overlay/harness.html`, `tests/overlay/main.tsx`, `tests/overlay/vite.config.ts` (port 5193,
tailwind + react plugins, imports from `../../src`), `tests/overlay/overlay.spec.ts`,
`playwright.config.ts` (testDir `tests`, `webServer: { command: 'npx vite --config tests/overlay/vite.config.ts --port 5193 --strictPort', url: 'http://localhost:5193', reuseExistingServer: !process.env.CI }`, chromium only, `use.viewport` 1280x800).
Harness page: buttons "Open modal", "Open drawer", "Open confirm"; the modal contains a text input,
a "Open nested confirm" button, a `DropdownMenu` with 2 items, and a `Popover`; a "Toast" button.
Specs (each a `test()`):
1. Escape closes only the top layer: modal → nested confirm → Escape closes confirm, modal stays; Escape
   again closes modal.
2. Escape in an open DropdownMenu inside the modal closes the menu only.
3. Focus trap: with the modal open, Tab from the last focusable goes to the first; Shift+Tab from the
   first goes to the last; focus never lands outside the dialog.
4. Focus return: closing the modal (Escape, close button) returns focus to "Open modal".
5. Back closes the top layer: open modal → `page.goBack()` → modal closed, URL unchanged, and a second
   `goBack()` leaves the page history as before opening (history length check via `history.length`
   recorded before). Open modal + nested confirm → goBack closes only the confirm.
6. inert: while the modal is open, the "Open modal" button has `inert`, the toast region does not; after
   close nothing in body has `inert`.
7. Drawer: Escape closes, focus returns.
8. Toast live region: clicking "Toast" puts the text into `[role=status][aria-live=polite]` within 1s.

### Release from CI (T10)

`.github/workflows/release.yml`:
```yaml
name: release
on:
  workflow_dispatch:
    inputs:
      bump: { description: 'patch, minor, major or x.y.z', required: true, default: patch, type: string }
permissions: { contents: write, actions: write }
concurrency: { group: release, cancel-in-progress: false }
jobs:
  release:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - name: Git identity
        run: |
          git config user.name "ui release"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
      - name: Release
        env:
          GH_TOKEN: ${{ github.token }}
          BUMP: ${{ inputs.bump }}
        run: node scripts/release.mjs "$BUMP" --ci
```
`scripts/release.mjs` changes: `git fetch origin master --tags`; refuse unless `git rev-parse HEAD` equals
`git rev-parse origin/master` ("HEAD is not origin/master: pull or push first"); refuse unless
CHANGELOG.md has a `## [<version>]` heading ("CHANGELOG.md has no [x.y.z] entry"); in CI mode
(`--ci`) also run `npm run test:tools` and `npm run test:unit` after `npm run check`; push master
(`git push origin master`) BEFORE creating the tag commit and tag; then build site, tag commit, tag,
`git push origin <tag>`; then, when `--ci` or `GH_TOKEN` is set: `gh release create <tag> --title <tag>
--notes-file <tmp>` where the notes are the CHANGELOG section for that version (text between its heading
and the next `## [`), and `gh workflow run fanout.yml -f tag=<tag>` (needed because GITHUB_TOKEN tag pushes
do not trigger workflows; when run locally with a personal token the tag push already triggers it, so
skip the dispatch when not `--ci`). Ordering on failure: if the master push fails, nothing was tagged.
CLAUDE.md "Autonomy": a release is `gh workflow run release.yml -R nishant/ui -f bump=<patch|minor|major>`
(after the release's CHANGELOG entry is merged to master); `npm run release` remains a local fallback.

## Tasks

All tasks work in `C:\Code\ui-app-blocks`. **Imports in new docs pages:** import new components from their
source module (`../../src/components/app-shell`), not from `../../src` (T11 wires `src/index.ts` last).
Every new component file follows the house style: a top doc comment, JSDoc on every prop, `cn()` for
classes, `th-*` colors only, 44px touch targets, works at 360px, light and dark. Tasks must not run
`npm install`; T1 adds every dependency first.

### T1 Packaging, build, Vite plugin
- Owns: `package.json`, `package-lock.json`, `tsup.config.ts`, `scripts/build.mjs`, `src/th-colors.mjs` (new),
  `src/th-colors.d.mts` (new), `src/node/vite.ts` (new), `vitest.config.ts` (new).
- Depends on: none
- Change:
  1. `npm install -D vitest@^4 happy-dom @testing-library/react @playwright/test@<same as playwright> eslint@^9`
     (match `playwright`'s installed version for `@playwright/test`).
  2. Move the `twColors` list out of build.mjs into `src/th-colors.mjs`: `export const TH_COLORS = [[name, role], …]`
     (computed from tokens.mjs exactly as today) and `export const TH_COLOR_NAMES = TH_COLORS.map(([n]) => n)`.
     Hand-write `src/th-colors.d.mts`. build.mjs imports it.
  3. `tsup.config.ts` becomes three configs: (a) React/browser ESM: entries `index`, `format`, `chart` (if
     exists), `inbox-client`, with `splitting: true`, `dts: true`, `sourcemap: true`, external react; (b)
     `theme` alone, `splitting: false` (static sites vendor dist/theme.js as one file); (c) node: entries
     `node/vite: src/node/vite.ts`, `node/eslint: src/node/eslint.ts`, `node/th-check: src/node/th-check.ts`
     — each added only `if (existsSync(...))` (T2 creates the last two) — `platform: 'node'`, `target: 'node20'`,
     `dts: true`, `sourcemap: false`, `splitting: false`, `outDir: 'dist'`, banner `#!/usr/bin/env node` only for
     th-check (use a separate config object for th-check with `banner: { js: '#!/usr/bin/env node' }`); keep the IIFE config.
     All configs `clean: false` (build.mjs clears dist).
  4. build.mjs: `@source "./";` → `@source "./*.js";` plus `@source not "./theme.global.js";` and ensure node
     files under `dist/node/` and `.map`/`.d.ts` are not scanned (verify with the research note on Tailwind 4
     `@source` glob semantics; if `*` is recursive, add `@source not "./node";`). Add a build self-test
     `testSourceScan()`: assert tailwind.css contains no `@source "./";`.
  5. Add a build self-test `testVitePlugin()`: import `dist/node/vite.js`, call `nishThemeInit()`, call
     `transformIndexHtml.handler()`, assert one tag with `children` equal to dist/theme-init.js content and
     `injectTo: 'head-prepend'`.
  6. `package.json`: version stays 0.10.0 (T11 sets 1.0.0); exports add
     `"./vite": { "types": "./dist/node/vite.d.ts", "import": "./dist/node/vite.js" }`,
     `"./eslint": { "types": "./dist/node/eslint.d.ts", "import": "./dist/node/eslint.js" }`;
     `"bin": { "nish-th-check": "./dist/node/th-check.js" }`; `typesVersions` add `vite`, `eslint`;
     scripts: `"test:unit": "vitest run"`, `"test:overlay": "playwright test"`,
     `"th-check": "node dist/node/th-check.js src site demo"`, and append `&& npm run th-check` to `check`
     (after build). `"engines": { "node": ">=20" }`.
  7. `vitest.config.ts`: `environment: 'happy-dom'`, `include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts']`.
     `src/node/vite.ts` per Design.
- Acceptance: `npm run typecheck`; `npm run build` passes (with T2 files absent, the node eslint/th-check
  entries are skipped); `ls dist/node/vite.js dist/chunk-*.js` (chunks may be absent if nothing is shared —
  fine); `npx vitest run --passWithNoTests` exits 0.

### T2 ESLint preset, th checker, nav fix
- Owns: `src/node/th-classes.ts`, `src/node/eslint.ts`, `src/node/th-check.ts`, `src/node/eslint.test.ts`,
  `src/node/th-classes.test.ts` (all new), `src/components/nav.tsx` (only the two `bg-th-hover` → `bg-th-elevated`).
- Depends on: T1
- Change: per Design "ESLint preset and th-class checker". Tests (vitest, `// @vitest-environment node`):
  th-classes: `bg-th-hover` reported; `bg-th-elevated`, `hover:bg-th-accent-soft/50`, `text-th-hi2`,
  `border-th-line-strong`, `var(--color-th-accent)` not reported; `text-th-hi1` reported; `bg-th-surface-2`
  reported; non-class prose "the th-hover state" not reported. ESLint: use `RuleTester` from `eslint`
  (languageOptions `{ ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } }`)
  with valid/invalid cases for each of the 6 rules incl. a JSX `className="..."` and a template literal.
  After `npm run build`, run `node dist/node/th-check.js src site demo`; fix any unknown classes it finds in
  `site/` or `demo/` files that no other task owns (list them in notes); `src/components/nav.tsx` fix.
- Acceptance: `npm run build && npm run th-check && npx vitest run src/node`.

### T3 AppShell
- Owns: `src/components/app-shell.tsx`, `site/components/app-shell.tsx` (new docs page, export `appShell: ComponentDoc`).
- Reads: nav.tsx, display.tsx (AppHeader), layout.tsx, toast.tsx, tabs.tsx, overlay.tsx (DropdownMenu), `site/components/bottom-nav.tsx` (`Device`).
- Depends on: T4 (AppErrorBoundary, useNarrow)
- Change: per Design "AppShell". Docs page: `framed` is not used; render inside `Device` at 360 (BottomNav +
  More), and stories at 840 (rail) and 1440 (header tabs) like page-container.tsx does. Demo nav: 6 items
  (Home, Jobs, Saved, Alerts, Reports, Settings) with icons from `site/lib/icons.tsx`, a state-held active
  key, `renderLink` omitted (onSelect). Usage text shows a React Router `renderLink` example:
  `renderLink={(item, p) => <NavLink to={item.href!} {...p} />}`. Guidelines: one AppShell per app at the
  root inside the router; pass `resetKey={location.pathname}`; keep 4 primary items for the cover screen.
- Acceptance: `npm run typecheck`. Add `src/components/app-shell.test.tsx` (also owned; vitest + testing-library,
  stub matchMedia): renders the skip link, BottomNav with 4 items + More when nav has 6, no More when nav has 5,
  More opens the MoreSheet with the overflow items, `resetKey` change closes it. (T11 registers the docs page and
  runs the visual check.)

### T4 Data hooks, error boundary, breakpoints
- Owns: `src/components/resource.ts`, `src/components/resource.test.tsx`, `src/components/error-boundary.tsx`,
  `src/components/error-boundary.test.tsx`, `src/components/hooks.tsx`, `src/components/hooks.test.tsx`,
  `site/components/use-resource.tsx` (export `useResourceDoc`), `site/components/app-error-boundary.tsx`
  (export `appErrorBoundary`), `site/components/hooks.tsx` (add usePhone/useNarrow readouts + BREAKPOINTS table).
- Depends on: T1 (vitest installed)
- Change: per Design. Tests: apiFetch (mock `globalThis.fetch`): JSON 2xx, 204, non-2xx with `{error}`,
  network failure → status 0, timeout, onUnauthorized called on 401, JSON body serialization; useResource
  (renderHook from @testing-library/react, fake timers): first load sets loading→false+data; error keeps old
  data; key change aborts the previous fetch; `intervalMs` polls; no poll while `document.hidden` (stub
  `Object.defineProperty(document, 'hidden')` + dispatch visibilitychange) and refetch on becoming visible;
  `online` event refetches; `reload()` resolves; unmount aborts. AppErrorBoundary: renders fallback on throw,
  "Try again" resets, `resetKeys` change resets, chunk error copy. hooks: usePhone/useNarrow with a
  matchMedia stub. Docs pages: use-resource page demonstrates a fake fetcher (`new Promise` with setTimeout,
  a toggle to make it fail) showing loading/data/error/refreshing states with `Skeleton`, `ErrorState`
  (onRetry=reload) and a "Last updated" `RelativeTime`; error boundary page has a "Throw" button inside a
  boundary showing the default fallback.
- Acceptance: `npm run typecheck && npx vitest run src/components`.

### T5 Filters and URL state
- Owns: `src/components/url-state.ts`, `src/components/url-state.test.ts`, `src/components/filters.tsx`,
  `src/components/filters.test.tsx`, `site/components/filter-bar.tsx` (export `filterBar`).
- Depends on: T1, T4 (`useNarrow`)
- Change: per Design. Tests: parse/serialize each type, defaults omitted, prefix, unknown keys preserved,
  hash and history.state preserved by locationAdapter, popstate updates; FilterBar renders the Filters
  button with count below md and inline children from md (stub matchMedia). Docs page: a jobs-style list
  of 12 fake rows filtered live by search + status Chips + a sort Select, `useUrlState` with a
  memory adapter (the docs site uses hash routing, so `locationAdapter` would fight it: build a tiny
  in-memory adapter in the page), shown in a `Device` at 360 and a wide story at 1024.
- Acceptance: `npm run typecheck && npx vitest run src/components/url-state src/components/filters`.

### T6 Settings blocks
- Owns: `src/components/settings.tsx`, `src/components/settings.test.tsx`, `site/components/settings.tsx` (export `settingsDoc`).
- Depends on: T1
- Change: per Design. Tests: NumberField commits on blur and Enter only when changed, clamps, Escape
  restores, invalid input restores + aria-invalid + "Enter a number", rejected promise restores and shows
  the error, nullable. Docs page: a "Scanner" section with a Switch row (inline), a Select row, a
  NumberField row with suffix "%" and a fake async save (status "Saving…" → "Saved"), and a stacked
  Textarea row; plus a second section "Danger zone" with a danger Button row.
- Acceptance: `npm run typecheck && npx vitest run src/components/settings`.

### T7 Combobox
- Owns: `src/components/combobox.tsx`, `src/components/combobox.test.tsx`, `site/components/combobox.tsx` (export `combobox`).
- Depends on: T1
- Change: per Design. Tests: typing filters and opens; ArrowDown/Enter selects and calls onChange;
  Escape closes then clears; aria-activedescendant follows; allowCustom commits text; blur restores label;
  clear button. Docs page: a ticker picker (30 fake symbols with hints), an allowCustom tag example, an
  async example with `loading`, and a story inside a Modal (framed not needed: a Button opening a Modal).
- Acceptance: `npm run typecheck && npx vitest run src/components/combobox`.

### T8 Overlay a11y: inert and toast live regions
- Owns: `src/components/overlay.tsx`, `src/components/toast.tsx`.
- Depends on: none
- Change: per Design "Overlay a11y". Do not change any public prop. Keep Strict Mode double-mount safe
  (pushInert/popInert idempotent per scrim). `PHONE_QUERY` stays local (T4 owns hooks.tsx; do not import
  from it to avoid churn).
- Acceptance: `npm run typecheck && npm run build`; T9's specs cover behavior.

### T9 Overlay interaction specs + CI
- Owns: `tests/overlay/**` (new), `playwright.config.ts` (new), `.github/workflows/ci.yml`.
- Depends on: T1, T8
- Change: per Design "Overlay interaction specs". ci.yml: after `npm run test:tools` add
  `- run: npm run test:unit`; after the Playwright install add `- name: Overlay interaction specs` /
  `run: npx playwright test`. Upload `test-results` with the visual-out artifact on failure (add the path).
  Keep `run:` values free of `: ` on plain scalars (use `|` blocks). The session validates workflow files
  with action-validator after the Workflow; do not run it yourself.
- Acceptance: `npx playwright test` passes locally (all 8 specs).

### T10 Release from CI
- Owns: `.github/workflows/release.yml` (new), `scripts/release.mjs`, `CLAUDE.md`, `tools/changelog-section.mjs` (new),
  `tools/changelog-section.test.mjs` (new).
- Depends on: none
- Change: per Design "Release from CI". Keep the local path working. The pure helper
  `changelogSection(text, version): string | null` (the section body, trimmed, or null when there is no
  `## [version]` heading) lives in `tools/changelog-section.mjs`, imported by release.mjs; its node:test file is
  picked up by the existing `test:tools` glob. Tests: finds a middle section, the last section, returns null for a
  missing version, does not match `1.0.0` against `[1.0.0-rc]` or `[11.0.0]`. CLAUDE.md: update the Autonomy
  paragraph's release sentence as in Design, and add under Workflows: "release.yml pushes with GITHUB_TOKEN, which
  does not trigger other workflows; it dispatches fanout.yml itself."
- Acceptance: `node --test tools/changelog-section.test.mjs`; `node scripts/release.mjs` with no args prints
  usage; parse release.yml as YAML.

### T11 Wire-up, docs registry, README, CHANGELOG (last)
- Owns: `src/index.ts`, `site/components/index.ts`, `site/docgen.mjs`, `site/main.tsx`, `site/pages/icons.tsx` (new),
  `site/components/vite-plugin.tsx` (new), `site/pages/getting-started.tsx`, `tools/site.visual.json`, `README.md`,
  `CHANGELOG.md`, `ROADMAP.md`, and the import lines (only) of the new docs pages from T3–T7.
- Depends on: T1–T10
- Change:
  1. `src/index.ts`: export every new public name and type from T3–T8 (named exports, grouped like the
     file): AppShell, AppShellProps; apiFetch, ApiError, configureApi, useResource, ApiConfig, ApiFetchOptions,
     UseResourceOptions, Resource; AppErrorBoundary, AppErrorBoundaryProps; FilterBar, FilterSheet, useUrlState,
     locationAdapter, FilterBarProps, FilterSheetProps, UrlStateAdapter; SettingsSection, SettingRow,
     NumberField, useSaveStatus, SaveStatus + props types; Combobox, ComboboxProps, ComboboxOption; BREAKPOINTS, PHONE_QUERY,
     NARROW_QUERY, usePhone, useNarrow.
  2. Docs pages: switch their imports of new components to `../../src`, register them in `COMPONENT_DOCS`
     (after `pageContainer`: appShell; after `asyncPanel`: useResourceDoc, appErrorBoundary; after `searchInput`:
     filterBar, combobox; after `fieldGroup`: settingsDoc), add the new component names to `site/docgen.mjs`
     `COMPONENTS` and functions (`apiFetch`, `useResource`, `useUrlState`, `nishThemeInit`, `usePhone`,
     `useNarrow`, `configureApi`) wherever docgen lists functions.
  3. A `vite-plugin` ComponentDoc page (`site/components/vite-plugin.tsx`, also owned) documenting
     `@nish/ui/vite` and `@nish/ui/eslint` + `nish-th-check` (usage blocks, `source` set, no live preview
     beyond a code block). Register after `staticParity`.
  4. `site/pages/icons.tsx`: Foundations page "Icons" with the decision and why (Decisions section), sizes,
     a grid of the icons ui exports, and the `lucide-react` usage snippet. Add `{ path: '/icons', label: 'Icons' }`
     to Foundations in `site/main.tsx` and a `case 'icons'` route.
  5. `site/pages/getting-started.tsx`: replace the hand-written nishThemeInit plugin snippet with
     `import { nishThemeInit } from '@nish/ui/vite'`; add an ESLint section.
  6. `tools/site.visual.json`: add pages app-shell, filter-bar, settings, combobox, use-resource, icons.
  7. README: replace the hand-written plugin in Quick start with `@nish/ui/vite`; add "Lint" (eslint
     preset + th-check) and "Icons" sections; fix "Used by": add workflows.nish.software (React + Tailwind 4),
     inbox (its server imports the inbox protocol), and correct start.nish.software's stack: read
     `C:\Code\hosting\fleet.yaml` and each listed repo's `package.json` under `C:\Code\<repo>` (read only) and
     write the real stack (framework, Tailwind or not, npm/pnpm) for exactly the repos fleet.yaml lists, plus the
     hosting static pages and arora-home rows that are there today.
  8. CHANGELOG: a `## [1.0.0] - 2026-10-31` entry (Added / Changed / Fixed), with a "1.0" note: from here a
     major means app code must change; minors add; patches fix. Update the intro sentence accordingly.
  9. ROADMAP.md: add the entry (see top) as not done (struck through at release).
- Acceptance: `npm run check && npm run test:unit && npm run test:tools`; `npm run build:site`; visual check:
  `npx vite preview --config site/vite.config.ts --port 5191 &` then `node tools/visual-check.mjs tools/site.visual.json`.

## Waves

W1: T1, T8, T10 · W2: T2, T4, T6, T7, T9 (T9 needs T8) · W3: T3, T5 (need T4) · W4: T11

## Review focus

- The overlay changes (inert sync with stacked dialogs and Strict Mode; toast announcements) — regressions
  here hit every app.
- useResource timer/visibility/abort logic and stale-closure bugs.
- AppShell at 360/840/1440, light and dark: no horizontal scroll, 44px targets, every nav item reachable.
- The `@source` change: an app's CSS must still contain every class the components use (build an app-like
  fixture: the demo and docs site both compile through dist/tailwind.css — check a component class like
  `bg-th-accent-soft` is present in the built site CSS).
- release.mjs ordering and the workflow's permissions.
- Package exports resolve: `node -e "import('@nish/ui/vite')"`-style checks from a temp consumer.

## Release

1. PR `app-blocks: building blocks, guardrails, 1.0.0` → CI green → merge.
2. `gh workflow run release.yml -R nishant/ui -f bump=major` on master (1.0.0). Watch it. Verify: tag
   `v1.0.0`, `gh release list -R nishant/ui` shows it, `fanout.yml` run started, bump PRs opened.
3. Verify design.nish.software shows the new pages once hosting's bump PR merges and deploys
   (`#/components/app-shell`, `#/icons`).

## Open questions for the research phase

- Tailwind CSS 4.x `@source` glob semantics: does `@source "./*.js"` match only top-level files of the CSS
  file's directory or recurse? Is `@source not "<path>"` supported in the installed version (check
  `node_modules/tailwindcss/package.json` version and its docs/changelog)? What does the default auto-detection
  do with a path under node_modules?
- tsup 9 with `splitting: true` for ESM: chunk naming and whether `dts` works per entry in the same config.
