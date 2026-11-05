# AppShell gaps and size budgets

Status: in progress · Slug: appshell-gaps · Date: 2026-11-05 · Size: large
Repos: nishant/ui (spec lives here, public), nishant/trading, nishant/job-apps, nishant/status, nishant/trackers (all private)
ROADMAP: `ROADMAP.md` in nishant/ui, entries "AppShell gaps that keep four apps on local shells" (2026-11-02) and "Size budgets back to the 2.0 targets" (2026-11-03)

## Goal

The shared `AppShell` gains every behavior that keeps trading, job-apps, status and trackers on their own
shells, so each app deletes its local shell and renders `@nish/ui`'s. At the same time the overlay code is
split into modules and the More sheet loads on demand, so `AppShell` and `SystemCanvas` are back under their
2.0 size targets. Everything ships as a minor of `@nish/ui` (no breaking change, every import path keeps
working).

1. `src/components/overlay.tsx` is split into `overlay-core`, `overlay-dialog`, `overlay-position`, `modal`,
   `drawer`, `tooltip`, `popover` and `menu` modules; `overlay.tsx` stays as a re-export barrel with the same
   exports as today.
2. `AppShell` loads its More sheet, and `DropdownMenu` its phone sheet, on demand; `tools/size-check.mjs`
   measures the initial chunk and fails when the AppShell initial chunk contains the Drawer, Modal or More
   sheet modules.
3. `tools/size-budgets.json`: AppShell 34, SystemCanvas 27 (the 2.0 targets); "everything from ." lowered to
   what is measured plus 0.5 (100 is not reachable in a minor; see Decisions).
4. `AppShell` gains: `navMode="header"`, `tabs="pill"`, badges on header tabs, `bottomNav`, `moreMenu`,
   `headerInnerClassName`, `containerClassName`, `footer`, `fullHeight`, `navPending`, `sidebar.brand`;
   `NavItem` gains `shortLabel`. Defaults render exactly as 2.0.2 does.
5. The docs page for AppShell on design.nish.software shows each new prop.
6. trading, job-apps, status and trackers render `@nish/ui`'s `AppShell` and delete their local shell code,
   each verified with a local Fold diff at 360, 840 and 1440 in light and dark.

## Out of scope

- No new public export names in `src/index.ts` (this spec does not edit `src/index.ts`).
- No change to what `SystemCanvas`, `Inbox` or the service-token components export, and no move of them out
  of the root entry (that is the 3.0 question in ROADMAP "Other 2.0 leftovers").
- No `useNavMemory` or route-memory API in ui: trading keeps its own (Decisions).
- No change to `AppHeader`'s props or rendering.
- No ContextMenu or HoverCard (the tree-virtual session builds them on the modules defined here).
- No change to `canvas/route.ts` or `canvas/system-canvas.tsx` (the ui-leftovers session owns SystemCanvas
  routing performance).
- No ui release dispatch by this session (the orchestrator batches it).
- No `fold` label on app PRs unless a local Fold diff cannot run (job-apps without local Postgres).

## Decisions

- Split overlay.tsx into modules and lazy-load the Drawer users; splitting alone does not shrink anything,
  because esbuild and Rollup already drop unused functions inside one module (measured 2026-11-05: `Drawer`
  alone pulls 10.5 KB minified of overlay.js; AppShell pulls 20.4 KB). What counts is a module boundary that a
  dynamic `import()` can cut at.
- Prototype on the 2.0.2 build (2026-11-05): AppShell without any Drawer code 34.37 KB, plus the
  `displayInternals` split 33.69 KB, plus the More sheet out of the static graph 33.43 KB. SystemCanvas with
  the `displayInternals` split 26.49 KB. The new AppShell props add roughly 0.3 to 0.6 KB, so 34 is reachable
  but tight.
- `displayInternals` (one object of class maps in `display-classes.ts`) becomes individual named exports: an
  object is never tree-shaken per property, so `StatusDot` in SystemCanvas's follow caption pulled every map.
  It was never exported from `src/index.ts`, so nothing public changes.
- The size check measures the initial chunk (entry plus everything it imports statically, gzipped together),
  bundled with `splitting: true`; lazy chunks are printed but not budgeted. That is the JavaScript an app
  downloads before its first render.
- Root bundle target 100 KB is not reachable in a minor: `export *` keeps every component in the initial
  chunk, and the only big removable parts (SystemCanvas about 10 KB gzip, Inbox and service tokens about
  3.5 KB) would leave the root entry, which is a breaking change. The budget becomes measured plus 0.5 and the
  ROADMAP entry is rewritten (Release).
- If AppShell measures over 34.0 after the build, the budget is measured plus 0.2 (rounded up to 0.1) and the
  rewritten ROADMAP entry names the next lever: Toaster cards loaded on demand (toast.js is 6.6 KB minified of
  AppShell). Not built now: a toast that fires while its chunk cannot load (offline after a deploy) would never
  show. (default)
- Lazy loading uses a small module cache (`lazyModule`, `useLazyModule`, `preloadWhenIdle` in
  `src/components/lazy-module.ts`), not `React.lazy`: a failed chunk load must close the sheet instead of
  throwing into an error boundary outside the page, and a later tap must retry. (default)
- The More sheet preloads when the browser is idle after mount, and again on the first tap of More, so the
  first open is normally instant. (default)
- `DropdownMenu` with `sheetBelow="sm"` preloads the Drawer on mount when the phone query matches; until the
  Drawer module has loaded, or if it fails, it opens as the floating panel. (default)
- `navMode: 'adaptive' | 'header'`, default `'adaptive'` (today's behavior). `'header'` shows the nav as tabs
  on the header's second row at every width, with no BottomNav, rail, sidebar or More sheet; `moreItems` go in
  the header More menu at every width. Status asked for exactly this. (default name)
- `tabs: 'underline' | 'pill'`, default `'underline'`. `'pill'` in adaptive mode draws the 1024px+ nav as pills
  in the header's first row, before `actions` (job-apps' layout). In header mode it only changes the tab look.
  With `sidebar` there are no header tabs, so it does nothing. (default name)
- Header tabs and pills show `item.badge` with the same dot or count the BottomNav uses. (default)
- `bottomNav?: string[]` lists item keys for the BottomNav in that order; the other nav items go to the More
  sheet in nav order, before `moreItems`. It overrides `primary`. (default name)
- `moreMenu?: boolean`, default `true`; `false` removes the header More menu (and the sidebar one), so
  `moreItems` are in the phone More sheet only. The app must then offer those actions in `actions` from 768px
  (JSDoc says so). job-apps and trackers keep their direct Log out button this way. (default)
- `headerInnerClassName` is passed to `AppHeader` `innerClassName`; `containerClassName` is merged into the
  `PageContainer`. (default names)
- `footer?: ReactNode` renders after the `<main>` landmark inside the same container, so it is a page footer
  (contentinfo) and lines up with the page. For that, `PageContainer` now wraps `<main>` instead of `<main>`
  wrapping `PageContainer`; the pixels are the same. (default)
- `fullHeight?: boolean`: `<main>` gets exactly the height under the header and banners, as a flex column
  that does not scroll; `container` and `footer` are not used. (default)
- `navPending?: number`: that many tab-sized Skeletons in the header tab row while `nav` is empty (sign-in
  being checked); adaptive mode shows them from 1024px like real tabs, header mode at every width. (default)
- `sidebar.brand?: ReactNode | ((state: { collapsed: boolean }) => ReactNode)`: from 1024px the header is
  hidden; the hub pill and the brand sit at the top of the expanded sidebar, `tools` and then `actions` in its
  tools row, the theme toggle (compact when collapsed), `sidebar.footer` and the More menu in its foot.
  Collapsed, a 44px bar above the page holds the hub pill and `brand({ collapsed: true })`. Below 1024px
  nothing changes. Trading asked for this. (default name)
- `NavItem.shortLabel?: string`: the visible label in the NavRail and the BottomNav; the full `label` stays in
  the sidebar, header tabs and More sheet, and is the rail tooltip when the item has no `hint`. (default name)
- Nav memory (trading's "links that remember each section's last URL") stays in trading: AppShell already
  takes each item's `href` per render, so trading passes `href: linkTo(n.to)`. A ui hook would need a store and
  a section matcher that no other app uses. (default)
- The sidebar's `tools` stay mounted twice (sidebar and header, one hidden by CSS), as in 2.0. A JS media
  switch would mismatch on hydration. Trading's tests change to scope queries by landmark. (default)
- The hub pill in the sidebar is the same markup as `AppHeader`'s non-compact pill, written inline in
  `app-shell.tsx` (eight lines), so `display.tsx` is not restructured. (default)
- CHANGELOG lines go under `## [Unreleased]`; the orchestrator turns that into the batched version. No
  `### Behavior changes` heading (the fan-out would hold every bump). (default)
- App adoption builds against an `npm pack` of this ui branch extracted over each app's installed
  `@nish/ui`, then rebases onto the fan-out's `ui/vX.Y.Z` bump once it lands (ship preferences, 2026-11-02
  lesson). (default)
- Fold for the app PRs runs locally (base shots before the change, head shots after, `fold-diff`), and the
  report summary goes in the PR body. No `fold` label (about 10 minutes each). job-apps needs Postgres for
  `fold:serve`: if `127.0.0.1:5432` does not answer, label that one PR `fold` once. (default)
- trading's header tool order becomes the sidebar's (Search, Inbox, Assistant, How to use) at every width;
  today the app bar has Assistant before Inbox. (default)
- trackers' header tabs gain a Home tab (the shell shows every nav item); no per-item "hide from header"
  option. (default)
- job-apps gets AppShell's default ConnectionBanner (it had none) and its error boundary. (default)

## Current state

ui (`C:\Code\ui-appshell-gaps`, 2.0.2, branch `appshell-gaps` off `origin/master` b5be8bc):

- `src/components/app-shell.tsx` (301 lines): `AppShellProps` at line 36, render at 220. The header gets
  `className="max-lg:[&>nav]:hidden"` and `nav={hasNav && !side ? desktopNav : undefined}` (tabs on the
  header's second row from lg). BottomNav takes `nav.slice(0, n)` where `n = nav.length <= 5 ? nav.length :
  primary`; the sheet is `[...overflow, ...moreItems]`. The header More menu (`DropdownMenu`) is
  `hidden md:inline-flex` with nav, `inline-flex` without. `<main>` wraps `PageContainer as="div"`.
  `sidebar.tools` render twice: `lg:hidden` in the header and in `NavSidebar`.
- `src/components/nav.tsx` (898 lines): `NavItem` (35), `RenderLink` (55), `visibleNavItems` (83),
  `useEndSide` (93), `CountBadge` (102), `layerOf`/`closeAfterRouterLink` (123-159), `renderItem` (161),
  `FOCUS` (220), `BottomNav` (226-345), `MoreSheet` (347-416, uses `Drawer`), `NavRail` (418-505, `Tooltip` per
  item with a hint), `NavSidebar` (507-605, internal, not in `src/index.ts`), then `ScrollRow`, `useScrollSpy`,
  `SectionNav`. Imports `Drawer, Tooltip` from `./overlay` and `navigateFromLayer` from `./command`.
- `src/components/overlay.tsx` (2072 lines), in order: imports (1-49, re-exports `keyboardFocused`,
  `menuItemClass`, `touchTracker` and type `MenuItemClassOptions` from `overlay-classes`); layer plumbing
  (50-325: `OverlayState`, `createState`, `ov`, guards, `isTop`, `syncLayerAttr`, `syncInert`,
  `pushInert`/`popInert`, `isPhoneViewport`, `prefersReducedMotion`, `closeVetoes`, `FOCUSABLE`,
  `focusables`, `lockScroll`, `layerHost`, `queueHistoryPush`, exported `whenHistorySettled`,
  `cancelHistoryPush`, a local `warnDev`, `setRef`, `useMergedRef`, `useScrollable`); `useDialog` (327-444);
  `useSheetExit` (445), `useSheetSwipe` (489), `SheetSwipe` (592), `SheetHandle` (596-620); Modal (621-805);
  Drawer (806-995); ConfirmDialog (996-1083); positioning (1084-1208: `Side`, `Align`, `AnchoredPosition`,
  `GAP`, `EDGE`, `OPPOSITE`, `viewport`, `clamp`, `place`, `useAnchoredPosition`, `floatingStyle`); Tooltip and
  `FloatingTip` (1209-1444); `useDismiss` (1445, uses `ov` and `isTop`), `useReturnFocus` (1484); Popover and
  `PopoverCloseReason` (1514-1635); menu (1636-2072: `MenuContext`, `ITEM_SELECTOR`, `menuItems`,
  `DropdownMenu` with a `Drawer` sheet branch at about line 1870, `MenuItem`, `MenuLabel`, `MenuSeparator`,
  `MenuSubHeader`).
- Importers of `./overlay`: app-shell, breadcrumbs (`DropdownMenu, MenuItem`), command (`Modal,
  whenHistorySettled`), display (`DropdownMenu, Tooltip`), filters (`Drawer`), flow (`Tooltip`), inbox
  (`ConfirmDialog, DropdownMenu, MenuItem, MenuLabel, MenuSeparator`), nav (`Drawer, Tooltip`), segmented
  (`FloatingTip, keyboardFocused, touchTracker`), split (`Tooltip`), overlay.test.tsx, and `src/index.ts`
  (named exports, lines 62-86).
- `src/components/display-classes.ts`: `displayInternals` object (line 154) holding `FILL`, `CALLOUT_TONE`,
  `CALLOUT_CLAMP`, `DOT_SIZE`, `HALO`, `STAT_VALUE_SIZE`, `STAT_SKELETON`, `STAT_TONE`, `GRID_BASE`,
  `GRID_MD`, `METER_FILL`, `METER_THICK`, `METER_THICK_V`, `SPARK_TONE`, `LEGEND_FILL`; destructured once in
  `display.tsx` (lines 40-52). No other user.
- `scripts/build.mjs` `buildEsm()` emits one file per module into `dist/esm`; its plugin rewrites every
  relative specifier, dynamic `import('./x')` included, to `./x.js` and adds the module to the build. A literal
  string specifier is required.
- Sizes on 2.0.2 (`npm run size`): AppShell 37.17 (budget 37.5), SystemCanvas 27.13 (27.5), everything from
  . 117.06 (117.5), Modal 14.86, Combobox 13.29, Toaster 13.15. SystemCanvas pulls no overlay code; its
  excess is `display-classes.js` (2.9 KB minified, through `StatusDot` in `canvas/follow-caption.tsx`).
- `tools/api-surface.test.mjs` fails if a runtime export disappears; `npm run check` runs size.
- Existing AppShell users: nishant/workflows (`container={false}`, `moreItems`, no sidebar). Its fan-out bump
  runs Fold, so the defaults must render pixel-identical.
- Tests: `src/components/app-shell.test.tsx` (matchMedia stubbed false; `bottomNav()` helper finds the
  `fixed` nav), `nav.test.tsx`, `overlay.test.tsx` (DropdownMenu `sheetBelow` cases at 1205 and 1217),
  `inbox.tsx` uses `sheetBelow="sm"`, `tests/overlay/*.spec.ts` (Playwright harness),
  `tests/ssr/cases.tsx`. Coverage thresholds are global (vitest.config.ts line 39).
- Docs: `site/components/app-shell.tsx` (`ShellDemo`, stories inside `Device` frames, `guidelines`);
  props tables come from `site/docgen.mjs` reading the TypeScript source.

Apps (each its own worktree `C:\Code\<repo>-appshell-gaps`, branch `appshell-gaps`, created at build time):

- trading `apps/web/src/components/layout/AppShell.tsx`: local shell. `NAV` (9 entries, `short:
  'Engines'` on Engine Compare), `MOBILE_PRIMARY` = the first four, `useNavMemory` (zustand `navMemory`),
  `sidebarCollapsed`/`toggleSidebar` in `useUiStore`, JS switch on `BELOW_LG` between a hand-built `aside`
  (brand "OTA." with subtitle "Options Analyzer", `HomeLink`, collapse button in the brand row, tools row
  Search, Inbox, Assistant, How to use, nav rows with tooltips, ThemeToggle at the foot) and an `AppHeader`
  (hub pill, "OTA.", Search, Assistant, Inbox, How to use from md); `NavRail` with short labels; banner stack
  publishing `--ota-banners-h`; content `px-gutter pt-4 md:pt-6 nish-pad-bottom-inset`; `AppErrorBoundary`
  keyed on the path; `AppCommandPalette`, lazy `HowToModal`, `ChatDrawer`. `--ota-banners-h` is also read in
  `lib/layout.ts` (`PAGE_HEADER_TOP`), `index.css` line 11 and `pages/SettingsPage.tsx` line 454. `App.tsx`
  renders `<Toaster />` itself. Tests: `AppShell.test.tsx`, e2e `e2e/specs/chrome.spec.ts` (collapse by
  button name, nav by name "Sections"). Gate: `pnpm check`, `pnpm build`, `pnpm test:e2e`.
- job-apps `apps/web/src/components/AppShell.tsx`: `AppHeader` with `name={profileLink}` (a router `Link`
  with the profile avatar), hub, `innerClassName="mx-auto w-full max-w-7xl"`, actions: pill `NavLink`s
  (lg+, Review with an accent `StatusDot` when no resume), Search, Status link with a `StatusDot`, Settings
  (md+), `ThemeToggle collapse="never"` (md+), Log out (md+); `NavRail` with 5 sections; `<main>` full height
  when the route `handle.fullHeight`; BottomNav review, search, jobs, stats + More; MoreSheet profile, System
  status, Settings, Log out; `CommandMenu`. `App.tsx` renders `<Toaster />`.
- status `ui/src/App.tsx` + `ui/src/components/Header.tsx`: `AppHeader` with tabs Status, Fleet, Settings
  on the second row at every width (logged in only), Log in / Log out in actions,
  `innerClassName="mx-auto max-w-(--nish-page-max) xl:max-w-[1360px]"`; `ConnectionBanner` with an offline
  message; `PageContainer size="full" className="max-w-(--nish-page-max) pt-0 xl:max-w-[1360px]"` holding
  `<main id="main">` and a `<footer>`; `<Toaster />`.
- trackers `ui/src/App.tsx` + `ui/src/components/Header.tsx`: pushState router (`usePath`, `go`);
  `Header` with a `NavLink` wordmark, header tabs Price watch and Flights from lg, two Skeleton tabs while
  `authed === null`, Search and Log out (md+) actions, ThemeToggle hidden below md when signed in,
  `innerClassName="mx-auto max-w-[1440px]"`; `NavRail` and `BottomNav` (Home, Price watch, Flights) labelled
  "Trackers"; MoreSheet Search, Settings, Log out; content `max-w-[1440px]` with `<main id="main">` and a
  `<footer>` (with a Settings link); `<Toaster />`. `NavLink` and `linkRenderer` from `Header.tsx` are also
  imported by `pages/Home.tsx` and `pages/flights/TripPage.tsx`.

## Design

### Module layout after the split (fixed: other sessions import these paths)

All under `src/components/`, each starting with `'use client';` (the component contract), no default exports.

| Module | Holds (moved from overlay.tsx unless noted) | Exports |
|---|---|---|
| `overlay-core.ts` | layer plumbing, lines 50-325 | `ov`, `isTop`, `syncLayerAttr`, `pushInert`, `popInert`, `acquireGuard`, `releaseGuard`, `isPhoneViewport`, `prefersReducedMotion`, `closeVetoes`, `FOCUSABLE`, `focusables`, `lockScroll`, `layerHost`, `queueHistoryPush`, `cancelHistoryPush`, `whenHistorySettled`, `warnDev`, `setRef`, `useMergedRef`, `useScrollable` (every name `@internal` except `whenHistorySettled`) |
| `overlay-dialog.tsx` | `useDialog`, `useSheetExit`, `useSheetSwipe`, `SheetSwipe`, `SheetHandle` | all five, `@internal` |
| `modal.tsx` | `ModalProps`, `Modal`, `ModalPanel` (not exported), `ConfirmDialogProps`, `ConfirmDialog` | `Modal`, `ConfirmDialog`, `ModalProps`, `ConfirmDialogProps` |
| `drawer.tsx` | `DrawerProps`, `Drawer`, `DrawerPanel` (not exported) | `Drawer`, `DrawerProps` |
| `overlay-position.ts` | `Side`, `Align`, `AnchoredPosition`, `GAP`, `EDGE`, `OPPOSITE`, `viewport`, `clamp`, `place`, `useAnchoredPosition`, `floatingStyle`, `useDismiss`, `useReturnFocus`, `PopoverCloseReason` | all of them, `@internal` except the `PopoverCloseReason` type |
| `tooltip.tsx` | `TooltipProps`, `Tooltip`, `FloatingTip`, tip constants, `openTip` | `Tooltip`, `FloatingTip`, `TooltipProps` |
| `popover.tsx` | `PopoverProps`, `Popover` | `Popover`, `PopoverProps`, and `export type { PopoverCloseReason } from './overlay-position'` |
| `menu.tsx` | `MenuContext`, `ITEM_SELECTOR`, `menuItems`, `DropdownMenuProps`, `usePhoneViewport`, `Cloned`, `DropdownMenu`, `MenuItem`(+Props), `MenuLabel`, `MenuSeparator`, `MenuSubHeader`(+Props) | the components and props types, plus `MenuContext`, `ITEM_SELECTOR`, `menuItems` marked `@internal` (for ContextMenu) |
| `lazy-module.ts` (new) | `lazyModule`, `useLazyModule`, `preloadWhenIdle` | all three, `@internal` |
| `overlay.tsx` | barrel | every name it exports on master today |

Dependency direction (no cycles): `overlay-core` ← `overlay-dialog` ← `modal`, `drawer`; `overlay-core` ←
`overlay-position` ← `tooltip`, `popover`, `menu`; `menu` loads `drawer` only through `import('./drawer')`.

Signatures kept exactly as today (tree-virtual builds on them):

```ts
// overlay-position.ts
export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';
export interface AnchoredPosition { top: number; left: number; side: Side; maxHeight: number }
export const GAP = 8;
export const EDGE = 8;
export function place(r: DOMRect, w: number, h: number, side: Side, align: Align, gap: number, rtl?: boolean): AnchoredPosition;
export function useAnchoredPosition(anchor: RefObject<HTMLElement | null>, floating: RefObject<HTMLElement | null>, open: boolean, side: Side, align: Align, gap?: number): AnchoredPosition | null;
export function floatingStyle(pos: AnchoredPosition | null, extra?: CSSProperties): CSSProperties;
export function useDismiss(open: boolean, panel: RefObject<HTMLElement | null>, anchor: RefObject<HTMLElement | null>, close: (reason: 'escape' | 'outside') => void): void;
export function useReturnFocus(open: boolean, panel: RefObject<HTMLElement | null>, anchor: RefObject<HTMLElement | null>): void;
export type PopoverCloseReason = 'escape' | 'outside' | 'tab';
```

`overlay.tsx` after the split (the whole file):

```ts
'use client';
// The overlay components live in their own modules, so an app downloads only what it renders. This
// file keeps the old import path.
export { Modal, ConfirmDialog } from './modal';
export type { ModalProps, ConfirmDialogProps } from './modal';
export { Drawer } from './drawer';
export type { DrawerProps } from './drawer';
export { Tooltip, FloatingTip } from './tooltip';
export type { TooltipProps } from './tooltip';
export { Popover } from './popover';
export type { PopoverProps, PopoverCloseReason } from './popover';
export { DropdownMenu, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader } from './menu';
export type { DropdownMenuProps, MenuItemProps, MenuSubHeaderProps } from './menu';
export { whenHistorySettled } from './overlay-core';
export { keyboardFocused, menuItemClass, touchTracker } from './overlay-classes';
export type { MenuItemClassOptions } from './overlay-classes';
```

If master's overlay.tsx exports a name not in this list (check `grep -n '^export' src/components/overlay.tsx`
before editing), add it to the barrel from its new module.

### lazy-module.ts

```ts
'use client';
import { useEffect, useState } from 'react';
import { useLatest } from './latest';

/** @internal A module loaded on first use and cached; a failed load can be retried. */
export interface LazyModule<T> {
  /** The module once it has loaded, else null. */
  current(): T | null;
  /** Starts the load, or joins the one in flight. Rejects when the chunk cannot load; the next call retries. */
  load(): Promise<T>;
}

/** @internal Wrap a literal dynamic import: `lazyModule(() => import('./more-sheet'))`. Mark the call
 *  `/* @__PURE__ *\/` at module top level so bundlers can drop it. */
export function lazyModule<T>(importer: () => Promise<T>): LazyModule<T> {
  let mod: T | null = null;
  let pending: Promise<T> | null = null;
  return {
    current: () => mod,
    load: () =>
      (pending ??= importer().then(
        (m) => (mod = m),
        (e: unknown) => {
          pending = null;
          throw e;
        },
      )),
  };
}

/** @internal The module, loading it once `when` is true. null until it has loaded. `onError` runs when the
 *  load fails (the caller closes whatever was waiting for it). */
export function useLazyModule<T>(m: LazyModule<T>, when: boolean, onError?: () => void): T | null {
  const [, rerender] = useState(0);
  const errorRef = useLatest(onError); // the newest callback, without re-running the effect
  useEffect(() => {
    if (!when || m.current()) return;
    let live = true;
    m.load().then(
      () => live && rerender((n) => n + 1),
      () => live && errorRef.current?.(),
    );
    return () => {
      live = false;
    };
  }, [m, when, errorRef]);
  return m.current();
}

/** @internal Loads the module once the browser is idle (or after 1.5 s without requestIdleCallback).
 *  Returns a cleanup that cancels the wait. Does nothing on the server. */
export function preloadWhenIdle(m: LazyModule<unknown>): () => void;
```

### AppShell props (added to `AppShellProps` and `AppShellSidebar`; JSDoc text is final)

```ts
export interface AppShellSidebar {
  // ...existing
  /** From 1024px, hides the header and puts this brand at the top of the sidebar, under the hub pill.
   *  The sidebar then also holds `actions` (after `tools`), the theme toggle and the More menu (in its foot).
   *  Collapsed, a slim bar above the page shows the hub pill and the brand. A function gets the collapsed
   *  state, for a shorter brand in the bar. Below 1024px the header is unchanged. */
  brand?: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
}

export interface AppShellProps {
  // ...existing
  /** adaptive (default): BottomNav under 768px, the rail to 1023px, then header tabs or the sidebar.
   *  header: the nav stays as tabs on the header's second row at every width, with no BottomNav, rail,
   *  sidebar or More sheet; moreItems go in the header More menu. For apps with two or three pages. */
  navMode?: 'adaptive' | 'header';
  /** The look of the header nav. underline (default): tabs on the header's second row. pill: from 1024px,
   *  pills in the header row before `actions` (header mode keeps them on the second row). */
  tabs?: 'underline' | 'pill';
  /** Keys of the BottomNav items, in order, instead of the first `primary`. The other nav items go in the
   *  More sheet, in nav order, before moreItems. Unknown keys are skipped with a dev warning. */
  bottomNav?: string[];
  /** false removes the header More menu, so moreItems are only in the phone More sheet. Then put those
   *  actions in `actions` from 768px yourself, so none is phone-only. Default true. */
  moreMenu?: boolean;
  /** Classes for the header's inner rows (AppHeader innerClassName), e.g. "mx-auto max-w-7xl". */
  headerInnerClassName?: string;
  /** Classes merged into the PageContainer (a max width, a top padding). Ignored with container={false}. */
  containerClassName?: string;
  /** After the main landmark, in the same container: the page footer. Not rendered with fullHeight. */
  footer?: ReactNode;
  /** The main element gets exactly the height under the header and banners, as a flex column that does not
   *  scroll, for a page that scrolls inside its own panes. container and footer are not used. */
  fullHeight?: boolean;
  /** While nav is empty (sign-in being checked), this many placeholder tabs in the header, so it keeps its
   *  height. Shown where tabs show: from 1024px, or at every width with navMode="header". Default 0. */
  navPending?: number;
}

// nav.tsx NavItem
  /** A shorter label for the NavRail and the BottomNav, where the cell is narrow ("Engines" for "Engine
   *  Compare"). The full label stays everywhere else and is the rail tooltip when there is no hint. */
  shortLabel?: string;
```

### AppShell render rules

- `headerMode = navMode === 'header'`. `side = headerMode ? null : <today's side>`; when `headerMode` and
  `sidebar` was given, `warnDev('nish-ui: AppShell navMode="header" ignores sidebar.')` (use the
  `warnDev` from `./display-classes`, dev only).
- `brandMode = hasNav && side?.brand != null`. `brandNode(collapsed) = typeof side.brand === 'function' ?
  side.brand({ collapsed }) : side.brand`.
- BottomNav items: `headerMode` → none. `bottomNav` given → `bottomNav.map(key => nav.find(i => i.key ===
  key))`, unknown keys skipped with `warnDev('nish-ui: AppShell bottomNav key "<key>" is not in nav.')`,
  `overflow = nav.filter(i => !bottom.includes(i))`. Otherwise today's rule.
- `sheetItems = hasNav && !headerMode ? [...overflow, ...moreItems] : []` (unchanged otherwise).
- Header nav (the `nav` prop of AppHeader): `!hasNav && navPending > 0` → `navPending` × `<Skeleton
  className="h-9 w-24 rounded-lg" />` (from `./feedback`); `hasNav && !side && (headerMode || tabs !==
  'pill')` → the tab nodes; otherwise undefined.
- Tab node for an item: class `cn(tabClass({ active, variant: tabs === 'pill' ? 'pill' : 'underline' }),
  'inline-flex', tabs === 'pill' && 'items-center')`; children `<>{item.label}<NavBadge value={item.badge}
  /></>`; link, router link or button exactly as today's `desktopNav`.
- Pills in the header row: when `hasNav && !side && !headerMode && tabs === 'pill'`, the header `actions`
  start with `<nav aria-label={navLabel} className="hidden items-center gap-1 lg:flex">{pill tab nodes}</nav>`.
- AppHeader `className`: `cn(!headerMode && 'max-lg:[&>nav]:hidden', brandMode && 'lg:hidden')`;
  `innerClassName={headerInnerClassName}`. Everything else passed as today.
- Header More menu: rendered when `moreItems.length > 0 && moreMenu !== false`; wrapper class `hasNav &&
  !headerMode ? 'hidden md:inline-flex' : 'inline-flex'`.
- Theme toggle in the header: unchanged rule (hidden below md when there is a sheet). In header mode there is
  no sheet, so it shows at every width.
- Rail: `hasNav && !headerMode` (today: `hasNav`).
- Sidebar (`hasNav && side`): `NavSidebar` gets
  - `header={brandMode && !collapsed ? <>{hubPill}{brandNode(false)}</> : undefined}`
  - `tools={brandMode ? <>{side.tools}{actions}</> : side.tools}`
  - `footer={brandMode ? <>{sidebarToggle}{side.footer}{sidebarMoreMenu}</> : side.footer}` where
    `sidebarToggle = themeToggle === false ? null : (themeToggle ?? <ThemeToggle compact={collapsed} />)` and
    `sidebarMoreMenu` is the same `DropdownMenu` as the header one with `side="top"`, rendered only when the
    header More menu is.
- `hubPill` (sidebar and slim bar): when `hub` is set and `safeUrl(hub.href)` is not null:
  `<a className="nish-pill-link" href={href} title={hub.title ?? strings.hubTitle}><span className="inline-block rtl:-scale-x-100">←</span> <span className="nish-pill-link-label">{hub.label}</span></a>`.
- Slim bar: when `brandMode && collapsed`, first child of the content column:
  `<div className="hidden h-11 items-center gap-3 border-b border-th-line px-[var(--nish-page-gutter,1rem)] lg:flex">{hubPill}{brandNode(true)}</div>`.
- Content column (`<div className="min-w-0 flex-1">`):
  - `fullHeight`: `<main id={mainId} tabIndex={-1} className={cn('flex min-h-0 flex-col overflow-hidden
    focus:outline-none h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))]
    pb-[var(--nish-bottom-inset,0px)]', brandMode && collapsed &&
    'lg:h-[calc(100dvh-var(--nish-banners-h,0px)-2.75rem)]')}>{page}</main>`; `footer` given →
    `warnDev('nish-ui: AppShell fullHeight does not render footer.')`.
  - `container === false`: `<main id tabIndex={-1} className="focus:outline-none">{page}</main>{footer}`.
  - otherwise: `<PageContainer as="div" size={container} className={containerClassName}><main id
    tabIndex={-1} className="focus:outline-none">{page}</main>{footer}</PageContainer>`.
- BottomNav and More sheet: `hasNav && !headerMode`. `more.onToggle`: `void sheetModule.load().catch(() =>
  undefined); setSheet((s) => !s)`. Sheet: `const sheetMod = useLazyModule(sheetModule, sheet, () =>
  setSheet(false))`; render `sheetMod ? <sheetMod.MoreSheet open={sheet} ... /> : null`. Preload:
  `useEffect(() => (hasSheet ? preloadWhenIdle(sheetModule) : undefined), [hasSheet])`. Module top level:
  `const sheetModule = /* @__PURE__ */ lazyModule(() => import('./more-sheet'));`.
- With no new props set, the DOM is today's except that `PageContainer` wraps `<main>` (same pixels).

### DropdownMenu phone sheet (menu.tsx)

- Top level: `const drawerModule = /* @__PURE__ */ lazyModule(() => import('./drawer'));`.
- `wantSheet = usePhoneViewport(sheetBelow === 'sm')`; `const drawer = useLazyModule(drawerModule,
  wantSheet)`; `asSheet = wantSheet && drawer != null`. Everything that read `asSheet` keeps reading it, so
  until the module loads (or when it fails) the menu is the floating panel.
- The sheet branch renders `<drawer.Drawer side="bottom" size="md" ...>` exactly as today.

### UI copy (final)

No new user-facing strings in components. Dev warnings as written above. Docs copy is in T5.

### Mobile, light and dark

- New props keep 44px targets: pills use `tabClass` (`pointer-coarse:min-h-11`); the slim bar is 44px high;
  the hub pill is `.nish-pill-link` (44px). Placeholder tabs are 36px Skeletons (not targets).
- Header mode at 360px: tabs on the second row scroll sideways inside the row (`overflow-x-auto` in
  AppHeader), never the page.
- Every color is a role class; nothing new in raw colors. Light and dark need no special handling.

### Security

Not affected beyond today: hub hrefs go through `safeUrl` (sidebar pill too); nav hrefs through
`visibleNavItems`. No new routes, no network.

### Performance

- Budgets (final in T6): AppShell 34 initial, SystemCanvas 27, everything from . measured + 0.5. AppShell's
  initial chunk must not contain `components/drawer.js`, `components/modal.js`, `components/more-sheet.js` or
  `components/overlay-dialog.js` (size-check fails otherwise).
- The More sheet chunk is fetched once, at idle or on the first tap.

### Ops

Not affected: no env vars, ports or jobs. The ui release is dispatched by the orchestrator.

## Tasks

### T1 Split overlay.tsx and the display class maps (ui)

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `src/components/overlay.tsx`, `src/components/overlay-core.ts` (new), `src/components/overlay-dialog.tsx`
  (new), `src/components/modal.tsx` (new), `src/components/drawer.tsx` (new),
  `src/components/overlay-position.ts` (new), `src/components/tooltip.tsx` (new), `src/components/popover.tsx`
  (new), `src/components/menu.tsx` (new), `src/components/lazy-module.ts` (new),
  `src/components/lazy-module.test.ts` (new), `src/components/overlay.test.tsx`, `src/components/inbox.test.tsx`
  (only if a sheet test needs `await`), `src/components/display-classes.ts`, `src/components/display.tsx`
  (import lines and the destructure only), and the single `./overlay` import line in
  `src/components/breadcrumbs.tsx`, `command.tsx`, `filters.tsx`, `flow.tsx`, `inbox.tsx`, `segmented.tsx`,
  `split.tsx`.
- Reads (does not edit): `src/components/nav.tsx`, `src/components/app-shell.tsx`, `src/index.ts`,
  `src/components/overlay-classes.ts`, `scripts/build.mjs`, `docs/DEVELOPING.md`.
- Depends on: none
- Change:
  1. Move the code of overlay.tsx into the modules in the "Module layout" table, keeping every function body
     as is. Each module imports only what it uses. Add `export` to helpers that another module now needs.
     Mark the moved internal helpers `/** @internal ... */` (keep their existing comment text after it).
  2. Write `overlay.tsx` as the barrel shown in Design.
  3. Write `lazy-module.ts` as in Design (with `preloadWhenIdle` implemented: `requestIdleCallback(cb, {
     timeout: 3000 })` and `cancelIdleCallback`, else `setTimeout(cb, 1500)`/`clearTimeout`; `cb` calls
     `m.load().catch(() => undefined)`; return a no-op when `typeof window === 'undefined'` or
     `m.current()` is set).
  4. In `menu.tsx`, load the Drawer through `drawerModule` as in "DropdownMenu phone sheet". No static import
     of `./drawer` or `./modal` anywhere in menu.tsx, tooltip.tsx, popover.tsx, overlay-position.ts.
  5. Point the importers at the new modules: breadcrumbs `./menu`; command `{ Modal } from './modal'` and `{
     whenHistorySettled } from './overlay-core'`; display `{ DropdownMenu } from './menu'`, `{ Tooltip } from
     './tooltip'`; filters `{ Drawer } from './drawer'`; flow `{ Tooltip } from './tooltip'`; inbox `{
     ConfirmDialog } from './modal'` and the menu names from `./menu`; segmented `{ FloatingTip } from
     './tooltip'`, `{ keyboardFocused, touchTracker } from './overlay-classes'`; split `{ Tooltip } from
     './tooltip'`. Do not touch nav.tsx or app-shell.tsx (T2, T4).
  6. `display-classes.ts`: delete the `displayInternals` object; add `export` to each of the 15 consts it
     held, each with `/** @internal */`. `display.tsx`: replace the destructure (lines 40-52) with named
     imports from `./display-classes`.
  7. Tests: `lazy-module.test.ts` covers: `current()` null before and the module after `load()`; two `load()`
     calls share one import; a rejected import rejects `load()` and a second `load()` calls the importer again;
     `useLazyModule` returns null, then the module after the promise resolves (render with
     `@testing-library/react`, `await waitFor`); `onError` runs on rejection; `preloadWhenIdle` calls the
     importer after `vi.advanceTimersByTime(1500)` when `requestIdleCallback` is absent and its cleanup
     cancels it. In `overlay.test.tsx`, make the two `sheetBelow` cases await the dialog (`await
     screen.findByRole('dialog')`) and add one case: with the phone query matching and the drawer import not
     yet resolved, `DropdownMenu sheetBelow="sm" defaultOpen` shows the `menu` role as a floating panel first.
     Add one barrel test: `import * as barrel from './overlay'` has the same function exports as the union of
     `./modal`, `./drawer`, `./tooltip`, `./popover`, `./menu` names listed in the barrel plus
     `whenHistorySettled`, `keyboardFocused`, `menuItemClass`, `touchTracker`.
- Edge cases: SSR (no `window`): `useLazyModule` never loads during render, so the menu is the floating panel
  and nothing throws; `defaultOpen` with `sheetBelow` on a phone: floating panel, then the sheet once loaded
  (accepted); a tooltip's `shared('tooltip')` state stays in tooltip.tsx; `closeVetoes` is shared by Modal and
  ConfirmDialog through overlay-core.
- Acceptance (in the checkout): `npm run typecheck`, `npm run lint`, `npm run test:unit -- src/components`,
  `npm run build`, `node --test tools/api-surface.test.mjs` (no removed names), `npx playwright test
  tests/overlay` (chromium). `grep -n "from './drawer'\|from './modal'" src/components/menu.tsx
  src/components/tooltip.tsx src/components/popover.tsx src/components/overlay-position.ts` prints nothing.

### T2 nav: More sheet module, shortLabel, NavSidebar header (ui)

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `src/components/nav.tsx`, `src/components/nav-items.tsx` (new), `src/components/more-sheet.tsx` (new),
  `src/components/nav.test.tsx`
- Reads: `src/components/tooltip.tsx`, `src/components/drawer.tsx`, `src/components/app-shell.tsx`
- Depends on: T1
- Change:
  1. Move `useEndSide`, `CountBadge` (renamed `NavBadge`, exported, `@internal`), `layerOf`,
     `closeAfterRouterLink`, `renderItem` (exported, `@internal`) and `FOCUS` (exported, `@internal`) into
     `nav-items.tsx`. `NavItem`, `RenderLink` and `visibleNavItems` stay in nav.tsx (public); nav-items.tsx
     imports their types from `./nav` with `import type` only (no runtime cycle).
  2. Move `MoreSheetProps` and `MoreSheet` into `more-sheet.tsx` (imports `Drawer` from `./drawer`,
     `ThemeToggle`, `renderItem`, `NavBadge`, `FOCUS` from `./nav-items`, `visibleNavItems` from `./nav`).
     nav.tsx keeps `export { MoreSheet } from './more-sheet'` and `export type { MoreSheetProps } from
     './more-sheet'` so `src/index.ts` line 140 is unchanged.
  3. nav.tsx imports `Tooltip` from `./tooltip` and nothing from `./overlay` or `./drawer`.
  4. `NavItem.shortLabel` with the JSDoc in Design. BottomNav and NavRail show `item.shortLabel ??
     item.label`. NavRail's tooltip: `item.hint ?? (item.shortLabel != null && item.shortLabel !== item.label ?
     item.label : undefined)`. MoreSheet, NavSidebar and header tabs keep `label`.
  5. `NavSidebarProps.header?: ReactNode` with JSDoc "Above the tools row, expanded only (AppShell's
     sidebar.brand)." Rendered first inside the aside when given and `!collapsed`: `<div className="mb-3 flex
     flex-col items-start gap-2 px-3">{header}</div>`.
  6. Tests in nav.test.tsx: rail and bottom bar show the short label and the sheet the full one; the rail
     tooltip is the full label when there is no hint and the hint when there is one; `NavSidebar header`
     shows expanded and not collapsed; `MoreSheet` imported from `./nav` is the same function as from
     `./more-sheet`.
- Edge cases: `shortLabel` equal to `label` gives no extra tooltip; an empty `shortLabel` string falls back to
  nothing special (renders empty; document "leave it out instead"); `header` with `collapsed` true renders
  nothing.
- Acceptance: `npm run typecheck`, `npm run lint`, `npm run test:unit -- src/components/nav`, `npm run build`,
  `node --test tools/api-surface.test.mjs`. `grep -n "overlay\|drawer" src/components/nav.tsx` shows only
  the `./tooltip` import.

### T3 Size check on the initial chunk (ui)

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `tools/size-check.mjs`, `docs/DEVELOPING.md` (the `npm run size` row and the `tools/size-check.mjs`
  row only)
- Reads: `tools/size-budgets.json`, `package.json`
- Depends on: none
- Change:
  1. For each budget row write an entry file `node_modules/.cache/nish-size/entry-<i>.mjs` (contents as
     today's stdin) and build it with esbuild: `entryPoints: [file]`, `bundle: true`, `splitting: true`,
     `format: 'esm'`, `outdir: 'node_modules/.cache/nish-size/out'`, `write: false`, `metafile: true`,
     `minify: true`, `target: 'es2022'`, `platform: 'browser'`, `treeShaking: true`, `absWorkingDir: root`,
     same externals as today. Remove the cache folder's entry files at the end (`rmSync(..., { recursive:
     true, force: true })` on `node_modules/.cache/nish-size` only).
  2. Initial set: the output whose `entryPoint` is the entry file, plus every output reachable through
     `imports` entries with `kind === 'import-statement'` that are not `external`. Lazy set: every other `.js`
     output. Initial KB = gzip level 9 of the initial outputs' contents concatenated in discovery order
     (entry first); lazy KB = the same for the lazy set (0 when empty).
  3. New optional row field `mustNotInclude: string[]`: paths relative to `dist/esm` (for example
     `"components/drawer.js"`). Fail the row with `NOT LAZY: <path>` when any input of the initial set ends with
     `dist/esm/<path>`.
  4. Output table columns: `import`, `initial KB`, `lazy KB`, `budget`. Keep the tarball line and the exit
     codes.
  5. docs/DEVELOPING.md rows: "`npm run size` | bundles each import in `tools/size-budgets.json` from
     `dist/esm` with code splitting, gzips the initial chunk (what loads before first render) and fails over
     budget or when a `mustNotInclude` module is in it; also the `npm pack --dry-run` size |" and
     "`tools/size-check.mjs` | The bundle budgets (initial chunk; lazy chunks are printed, not budgeted). |".
- Edge cases: a row with no dynamic imports has lazy 0.00; `import: '*'` still works; Windows paths: compare
  with forward slashes (`split('\\').join('/')`).
- Acceptance: `npm run build && npm run size` passes on the current budgets (numbers within 0.3 KB of today's
  single-bundle numbers for rows without lazy imports). `node tools/size-check.mjs` run twice leaves no file
  under `node_modules/.cache/nish-size`.

### T4 AppShell props (ui)

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `src/components/app-shell.tsx`, `src/components/app-shell.test.tsx`, `tests/ssr/cases.tsx` (AppShell
  cases only)
- Reads: `src/components/nav.tsx`, `nav-items.tsx`, `more-sheet.tsx`, `lazy-module.ts`, `display.tsx`,
  `feedback.tsx`, `tabs-classes.ts`, `theme-toggle.tsx`
- Depends on: T2
- Change: implement every prop and rule in "AppShell props" and "AppShell render rules", with the JSDoc text
  given. Update the component's top comment to: "The app frame: skip link, header, loading bar, connection
  banner, the NavRail (768 to 1023px), the BottomNav with a More sheet (under 768px, loaded on demand), the
  page container, an error boundary and the Toaster, all from one `nav` list. Under 768px the BottomNav
  shows, from 768px the rail, from 1024px tabs in the header or the sidebar; navMode="header" keeps header tabs
  at every width. With no nav it is the signed-out frame: header, banners and page only." Imports
  `DropdownMenu, MenuItem` from `./menu`, `BottomNav, NavRail, NavSidebar, visibleNavItems` from `./nav`,
  `NavBadge` from `./nav-items`, never `MoreSheet` statically.
- Tests (app-shell.test.tsx; make the existing sheet tests async with `findBy`): navMode header (tabs at every
  width: header has no `max-lg:[&>nav]:hidden`, no `fixed` nav, no rail, More menu wrapper `inline-flex`, a
  warning when `sidebar` is also given); tabs pill (a `navigation` named navLabel inside the header's first
  row with `rounded-lg` links, no second-row nav); a badge of 3 on a tab shows "3" named "3 new"; bottomNav
  order and sheet order, unknown key warns and is skipped; moreMenu false (no header More button, sheet still
  lists moreItems); headerInnerClassName reaches the header's inner row; containerClassName on the container;
  footer after `main`, outside it, inside the container, and after `main` with container false; fullHeight
  (main has `overflow-hidden` and `flex-col`, no container, footer not rendered with a warning); navPending 2
  with empty nav (two Skeletons in the header nav, no rail, no BottomNav); sidebar.brand (header has
  `lg:hidden`; brand function called with `{ collapsed: false }` inside the sidebar; hub pill inside the
  sidebar; a theme toggle inside the sidebar; collapsed → no brand in the sidebar and a slim bar with
  `brand({ collapsed: true })` and the pill; `actions` inside the sidebar tools row); the More sheet opens
  after `await screen.findByRole('dialog', { name: 'More' })` (the failure path is covered by T1's
  `useLazyModule` onError test); defaults: with none of the new props, the class strings of the header,
  rail and BottomNav equal 2.0.2's (assert the exact class strings of the header element, the
  rail wrapper and the BottomNav). `tests/ssr/cases.tsx`: add `AppShellHeaderMode` (navMode header, 3 items)
  and `AppShellSidebarBrand` (sidebar with brand function and hub) cases.
- Edge cases: `bottomNav` with more than 5 keys: rendered as given, `warnDev('nish-ui: AppShell bottomNav
  has more than 5 items; they do not fit a 360px screen.')`; `bottomNav={[]}` with a sheet: the bar shows only
  More; `navPending` with nav non-empty: ignored; `tabs="pill"` with `sidebar`: ignored; `sidebar.brand` with
  empty nav: no sidebar, header at every width; unsafe hub href: no pill in the sidebar or bar; `moreMenu`
  false and `navMode="header"` with moreItems: the items are unreachable, so `warnDev('nish-ui: AppShell
  moreMenu={false} with navMode="header" hides moreItems.')`.
- Acceptance: `npm run typecheck`, `npm run lint`, `npm run test:unit -- src/components/app-shell tests/ssr`,
  `npm run build`, `node tools/size-check.mjs` (AppShell row prints; may still be over budget until T6).

### T5 Docs page and CHANGELOG (ui)

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `site/components/app-shell.tsx`, `CHANGELOG.md` (the `## [Unreleased]` section only)
- Reads: `src/components/app-shell.tsx` (from T4's API in this spec), `site/components/bottom-nav.tsx`
  (`Device`), `site/components/types.ts`
- Depends on: T2 (runs beside T4; uses only the props named in this spec)
- Change:
  1. `ShellDemoProps` gains `mode?: 'header'`, `pills?: boolean`, `sidebarBrand?: boolean`, `pending?:
     boolean`, `footer?: boolean`. header: `nav` is the first 3 items, `navMode="header"`. pills:
     `tabs="pill"`, the Alerts item has `badge: 3`. sidebarBrand: `sidebar={{ storageKey: false, tools: <the
     Search IconButton already used>, brand: ({ collapsed }) => collapsed ? <span className="text-base font-bold
     tracking-tight text-th-hi">Jobs</span> : <div><span className="text-lg font-bold tracking-tight
     text-th-hi">Jobs</span><p className="text-xs text-th-hi3">Search tracker</p></div> }}`. pending: `nav={[]}`
     and `navPending={3}`. footer: `footer={<footer className="mt-10 border-t border-th-line pt-4 text-xs
     text-th-hi3">Checked every five minutes.</footer>}`.
  2. Stories (append after `brand`), each in `Device doc="app-shell"`:
     - `header-tabs`, "Header tabs at every width", 360px, height 460: "navMode="header" keeps two or three
       destinations as tabs on the header's second row at every width, with no bottom bar, rail or sidebar.
       The tabs scroll sideways if they ever outgrow the row."
     - `pills`, "Pill tabs with a badge (1440px)", width 1440, height 460, `wide: true`: "tabs="pill" puts the
       destinations in the header row as pills from 1024px. An item's badge shows on its pill, in the rail and
       in the bottom bar."
     - `sidebar-brand`, "Sidebar without a header (1440px)", width 1440, height 460, `wide: true`:
       "sidebar.brand moves the brand to the top of the sidebar from 1024px and drops the header: the hub
       pill sits above the brand, the tools under it and the theme toggle at the foot. Collapsed, a slim bar
       above the page holds the pill and the brand."
     - `pending`, "Checking sign-in (1440px)", width 1440, height 300, `wide: true`: "navPending draws
       placeholder tabs while the app checks whether someone is signed in, so the header keeps its height."
     - `footer`, "Footer", 360px, height 460: "footer renders after the page in the same container, outside the
       main landmark."
  3. Append to `guidelines`:
     - "Use navMode="header" for an app with two or three pages that fit as tabs on a 360px screen. It has no
       More sheet, so moreItems go in the header More menu at every width."
     - "bottomNav names the bottom bar items by key when the first four are not the right ones. Every other
       nav item goes in the More sheet, in nav order, before moreItems."
     - "moreMenu={false} drops the header More menu. Use it only when every moreItem is also in actions from
       768px, so nothing is phone-only."
     - "fullHeight gives the page exactly the height under the header and banners, for a page that scrolls
       inside its own panes. The container and footer are not used."
     - "shortLabel is the label in the rail and the bottom bar when the full one does not fit; the full label
       stays in the sidebar, the header and the More sheet, and is the rail tooltip when there is no hint."
     - "The More sheet loads on demand (when the page is idle, or on the first tap of More), so it costs
       nothing at startup."
  4. CHANGELOG: under `## [Unreleased]` (create it above `## [2.0.2]` if absent; if another session already
     made it, add to its subsections):
     ```
     ### Added

     - `AppShell` `navMode="header"`: the nav stays as header tabs at every width, with no bottom bar, rail or sidebar, for apps with two or three pages.
     - `AppShell` `tabs="pill"`: from 1024px the nav is pills in the header row. Header tabs and pills show each item's `badge`.
     - `AppShell` `bottomNav`: the keys of the bottom bar items, instead of the first `primary`.
     - `AppShell` `moreMenu={false}`: `moreItems` stay in the phone More sheet only, for apps that put those actions in the header themselves.
     - `AppShell` `headerInnerClassName`, `containerClassName`, `footer`, `fullHeight` and `navPending` (placeholder tabs while sign-in is checked).
     - `AppShell` `sidebar.brand`: from 1024px the brand, the hub pill, the actions and the theme toggle move into the sidebar and the header goes away.
     - `NavItem` `shortLabel`: a shorter label for the NavRail and the BottomNav.

     ### Changed

     - `AppShell` loads its More sheet on demand, and `DropdownMenu` its phone sheet, so `AppShell` is <AS> KB gzip instead of 37.2 KB and `SystemCanvas` <SC> KB instead of 27.1 KB. Import paths are unchanged.
     - The overlay components are separate modules inside the package (`modal`, `drawer`, `tooltip`, `popover`, `menu`).
     ```
     Leave `<AS>` and `<SC>` as written; T6 fills them.
- Edge cases: every story must pass the Fold rules at 360 (no sideways page scroll, 44px targets, no axe
  violations) because ui's PR runs the Fold check on the docs site.
- Acceptance: `npm run typecheck`, `npm run lint`, `npm run build:site`, then `npx vite preview --config
  site/vite.config.ts --port 5191` and `node tools/visual-check.mjs tools/site.visual.json` (no new problems);
  look at the AppShell page at 360, 840 and 1440 in light and dark.

### T6 Integrate ui: budgets, numbers, full checks, commit

- Repo / checkout: nishant/ui at `C:\Code\ui-appshell-gaps`
- Owns: `tools/size-budgets.json`, `tools/api-surface.snapshot.json` (only if new names were added),
  `CHANGELOG.md` (the two numbers). It does not edit `ROADMAP.md` (the Release step does).
- Depends on: T1, T3, T4, T5
- Change:
  1. `npm run build && npm run size`. Record AppShell, SystemCanvas and everything-from-. initial KB.
  2. `tools/size-budgets.json`: AppShell `maxKB: 34` and `mustNotInclude: ["components/drawer.js",
     "components/modal.js", "components/more-sheet.js", "components/overlay-dialog.js"]`; SystemCanvas
     `maxKB: 27`; everything from . `maxKB` = measured + 0.5 rounded up to the next 0.5; add rows `{ "name":
     "Drawer", "from": "nish-ui", "import": "Drawer", "maxKB": <measured + 0.5, rounded up to 0.5> }`, the same
     for `Tooltip`, `Popover` and `DropdownMenu`. Comment field becomes: "Gzip KB of the initial chunk
     (entry plus static imports) of an esbuild bundle with code splitting (minified, react/react-dom/jsx-runtime
     external) of the import, built from dist/esm. AppShell and SystemCanvas are at the 2.0 targets (34, 27);
     everything-from-. sits above its target (100) until the root entry drops SystemCanvas, Inbox and the
     service tokens (a 3.0 change); measured plus 0.5 so growth fails CI." Rows other sessions appended keep
     their place.
  3. If AppShell measures over 34.0 or SystemCanvas over 27.0: set that row to measured + 0.2 (rounded up to
     0.1) and note the numbers for the ROADMAP rewrite in Release. Do not start the Toaster lever.
  4. Replace `<AS>` and `<SC>` in CHANGELOG with the measured numbers (one decimal).
  5. Full checks, all must pass: `npm run check`, `npm run test:tools`, `npm run test:unit -- --coverage`,
     `npm run size`, `npx playwright install chromium` (if missing) then `npx playwright test`,
     `NISH_BROWSERS=all npx playwright test --project=firefox --project=webkit` (overlay specs; install
     firefox and webkit if missing), the demo visual check (`npx vite --config demo/vite.config.ts --port
     5190` in the background, `node tools/visual-check.mjs tools/demo.visual.json`), the site visual check
     (`npx vite build --config site/vite.config.ts`, preview on 5191, `node tools/visual-check.mjs
     tools/site.visual.json`), `node tools/consumer-check.mjs next`, `vite` and `ts`. Stop every background
     server afterwards (`tests/overlay` vite server too; CLAUDE.md trap).
  6. `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs` only if the plain run reports added names;
     never when it reports removals (fix the code instead).
  7. Commit as "appshell-gaps: shared shell props and lazy overlays" (git identity from traps.md).
  8. Make the pack for T7 to T10: `npm pack --pack-destination "$env:TEMP\appshell-gaps-pack"` (not a
     publish; the tarball stays outside the repo).
- Acceptance: every command in step 5 exits 0; `git status` clean after the commit; the tarball exists.

### T7 trading adopts AppShell

- Repo / checkout: nishant/trading at `C:\Code\trading-appshell-gaps` (branch `appshell-gaps` off
  `origin/master`)
- Owns: `apps/web/src/components/layout/AppShell.tsx`, `apps/web/src/components/layout/AppShell.test.tsx`,
  `apps/web/src/components/layout/HomeLink.tsx` (delete if nothing else imports it), `apps/web/src/lib/layout.ts`,
  `apps/web/src/index.css` (line 11 only), `apps/web/src/pages/SettingsPage.tsx` (line 454 only),
  `apps/web/CLAUDE.md` ("Shell" bullet only), `e2e/specs/chrome.spec.ts` (only if a selector breaks),
  `CHANGELOG.md` (one entry in trading's format, see `/preflight`)
- Reads: `apps/web/src/store/uiStore.ts`, `AppCommandPalette.tsx`, `App.tsx`, the extracted `@nish/ui` types
- Depends on: T6 (an `npm pack` of the ui branch)
- Change:
  1. Setup: `pnpm install --frozen-lockfile`. The pack (made once by T6's integrate step or the session, not
     a publish): in `C:\Code\ui-appshell-gaps` after `npm run build`, `npm pack --pack-destination
     "$env:TEMP\appshell-gaps-pack"` (PowerShell), which writes `nish-ui-2.0.2.tgz` outside every repo. Find the
     installed copy: `node -p "require('path').dirname(require('fs').realpathSync(require.resolve('@nish/ui/package.json',{paths:['apps/web']})))"`;
     extract over it from Git Bash: `tar -xzf "$TEMP/appshell-gaps-pack/nish-ui-2.0.2.tgz" --force-local -C
     "<dir>" --strip-components=1`. Never edit package.json or the lockfile, and never commit anything under
     `node_modules`.
  2. Base Fold shots before editing (see "Local Fold diff" below).
  3. Rewrite AppShell.tsx as a thin wrapper. Keep `NAV` (exported, same entries and order, so other sessions'
     added entries rebase cleanly), `sectionFor`, `useNavMemory`, `InboxLink`, `useLiveDesktopAlerts`,
     `renderLink`. Delete `MOBILE_PRIMARY`, `MOBILE_TABS`, `MOBILE_MORE`, `navClasses`, `toNavItem`, the
     `aside`, the `AppHeader` branch, the `NavRail`, `BottomNav`, `MoreSheet`, the banner `useHeightVar`, the
     `BELOW_LG`/`MD_UP` media queries. Render:
     ```tsx
     const HUB = { href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' };
     const wordmark = <span className="text-lg font-bold tracking-tight">OTA<span className="text-th-accent">.</span></span>;
     // in AppShell():
     const nav: NavItem[] = NAV.map((n) => ({ key: n.to, label: n.label, shortLabel: n.short, icon: <n.icon size={20} />, href: linkTo(n.to), active: section === n.to, hint: n.hint }));
     const moreItems: NavItem[] = [{ key: 'how-to', label: 'How to Use This App', hint: 'The full walkthrough and glossary.', icon: <Info size={20} />, onSelect: () => setShowHowTo(true) }];
     const tools = (
       <>
         <IconButton size="sm" onClick={() => setPaletteOpen(true)} label="Search"><Search size={18} /></IconButton>
         <InboxLink iconSize={18} />
         <IconButton size="sm" onClick={() => setChatOpen(true)} label="Open assistant"><Sparkles size={18} /></IconButton>
         <IconButton size="sm" onClick={() => setShowHowTo(true)} label="How to use this app" className="max-md:hidden"><Info size={18} /></IconButton>
       </>
     );
     return (
       <Shell
         name={<>OTA<span className="text-th-accent">.</span></>}
         hub={HUB}
         nav={nav}
         moreItems={moreItems}
         moreMenu={false}
         renderLink={renderLink}
         sidebar={{
           collapsed,
           onCollapsedChange: (next) => { if (next !== collapsed) toggleSidebar(); },
           tools,
           brand: ({ collapsed: c }) => (c ? wordmark : <div>{wordmark}<p className="text-xs text-th-hi3">Options Analyzer</p></div>),
         }}
         connection={{ healthUrl: '/health', message: "Can't reach OTA. Check that Tailscale is connected.", offlineMessage: "You're offline. Showing the last data loaded.", onRetry: () => void queryClient.refetchQueries({ type: 'active' }) }}
         banner={<LiveAlertBanner />}
         container="full"
         containerClassName="pt-4 md:pt-6"
         toaster={false}
         errorBoundary={false}
         resetKey={location.pathname}
       >
         <Suspense fallback={<Skeleton className="h-48" />}>
           <AppErrorBoundary resetKeys={[location.pathname]}><Outlet /></AppErrorBoundary>
         </Suspense>
         {paletteOpen ? <AppCommandPalette linkTo={linkTo} onClose={() => setPaletteOpen(false)} /> : null}
         {showHowTo ? <Suspense fallback={null}><HowToModal onClose={() => setShowHowTo(false)} /></Suspense> : null}
         <ChatDrawer />
       </Shell>
     );
     ```
     `Shell` is `import { AppShell as Shell } from '@nish/ui'`. If `useUiStore` has a direct setter for the
     collapsed state, use it instead of the toggle comparison.
  4. `--ota-banners-h` → `--nish-banners-h` in `lib/layout.ts` (`PAGE_HEADER_TOP`), `index.css` line 11 and
     `SettingsPage.tsx` line 454.
  5. AppShell.test.tsx: keep every existing case's intent, rewritten for the shared shell: reach every section
     from the BottomNav or the More sheet (sheet opens after `await`), the sheet closes on navigation, More is
     active on a section inside it (/lab), hub link to nish.software, Inbox opens in a new tab, Search and the
     assistant in the header below lg, the palette opens from Search, Lab after Backtest in the sheet, the
     rail lists Engines (short label), the sidebar from lg lists Engine Compare after Lab, the header element
     has `lg:hidden` (no app bar from lg), the palette from the sidebar tools row, a throwing page keeps the
     nav. Scope duplicate tools with `within(screen.getByRole('complementary', { name: 'Sidebar' }))` and
     `within(screen.getByRole('banner'))`.
  6. apps/web/CLAUDE.md "Shell" bullet becomes: "- **Shell**: `@nish/ui`'s `AppShell` with `sidebar.brand`
     (from lg the sidebar holds the hub pill, the OTA. wordmark, the tools and the theme toggle, and there is
     no app bar), `BottomNav` + More sheet below md and `NavRail` (short labels) from md to lg. The banner
     stack (ConnectionBanner + LiveAlertBanner) is sticky under the app bar and publishes its height as
     `--nish-banners-h`; a sticky `PageHeader` pins at `PAGE_HEADER_TOP` (`@/lib/layout`). The sidebar tools
     are mounted in both the sidebar and the app bar (CSS shows one); tests scope them by landmark. Section
     links remember their last URL through `useNavMemory` in `AppShell.tsx`."
  7. CHANGELOG entry (trading's `/preflight` format): "The app shell is now @nish/ui's AppShell: the sidebar
     is 16px wider, the collapse button sits at its foot beside the theme toggle, and the header spans the
     width above the rail on tablets."
- Edge cases: deep link to /lab on a phone lights More; `navMemory` keeps a section's query string through the
  shared nav (href per render); collapsed state persists through the zustand store (`storageKey` unused when
  controlled); a page that throws keeps the sidebar (error boundary inside the shell).
- Acceptance: `pnpm check`, `pnpm build`, `pnpm test:e2e` (runs `e2e/specs/chrome.spec.ts` among others),
  local Fold diff with no new problems.

### T8 job-apps adopts AppShell

- Repo / checkout: nishant/job-apps at `C:\Code\job-apps-appshell-gaps`
- Owns: `apps/web/src/components/AppShell.tsx`
- Reads: `apps/web/src/App.tsx`, `apps/web/src/components/sources.ts*`, `icons.tsx`, `CommandMenu.tsx`
- Depends on: T6
- Change:
  1. Setup as T7 step 1 with `npm ci` and `paths:['apps/web']`. Base Fold shots first (Postgres check below).
  2. Keep `SECTIONS`, `lastScreenKey`, `rememberLastScreen`, `recallLastScreen`, `logout`, `renderLink`,
     `routeSkeleton`, the queries, `useDocumentTitle`, the last-screen effect, `sectionItems`, `profileLink`.
     Delete the comment "Kept local on purpose ...", `bottomItems`, `profileItem` and the hand-built layout.
     `moreItems` becomes the three items health, settings, logout (same objects as today minus the profile
     item, which now reaches the sheet through `bottomNav`).
  3. Render:
     ```tsx
     <Shell
       name="Job Apps"
       brand={profileLink}
       hub={{ href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' }}
       nav={sectionItems}
       tabs="pill"
       bottomNav={['review', 'search', 'jobs', 'stats']}
       moreItems={moreItems}
       moreMenu={false}
       renderLink={renderLink}
       headerInnerClassName="mx-auto w-full max-w-7xl"
       actions={actions}
       themeToggle={<ThemeToggle collapse="never" />}
       container={false}
       fullHeight={!!handle?.fullHeight}
       toaster={false}
       resetKey={location.pathname}
     >
       <Suspense fallback={routeSkeleton}><Outlet /></Suspense>
       <CommandMenu open={paletteOpen} onOpenChange={setPaletteOpen} profileId={profileId!} />
     </Shell>
     ```
     `actions` is today's minus the pill `<nav>` and minus the `ThemeToggle` (the shell draws it): Search
     IconButton, Status NavLink, Settings NavLink (`hidden md:inline-flex`), Log out IconButton (`hidden
     md:inline-flex`). `sectionItems`' Review badge stays `needsResume`.
- Edge cases: `profileId` undefined during a redirect (unchanged handling); `handle.fullHeight` switches per
  route; the profile link is never nested in a home link (brand is not wrapped).
- Acceptance: the PR workflow's checks: `npm run typecheck`, `npx tsc --noEmit -p packages/worker`, `npm run
  lint`, `npm test`, `npm run build -w apps/web`; local Fold diff with no new problems (or the `fold` label
  once when Postgres is not available).

### T9 status adopts AppShell

- Repo / checkout: nishant/status at `C:\Code\status-appshell-gaps`
- Owns: `ui/src/App.tsx`, `ui/src/components/Header.tsx` (delete)
- Reads: `ui/src/components/Icon.tsx`, `ui/src/pages/*.tsx`
- Depends on: T6
- Change:
  1. Setup as T7 step 1 with `npm ci` and `paths:['.']`. Base Fold shots first.
  2. In App.tsx replace `<Header>`, `<ConnectionBanner>`, `<PageContainer>` and `<Toaster />` with one
     `AppShell` (from `@nish/ui`), keeping all state, effects and the page switch as they are:
     ```tsx
     const path = location.pathname.replace(/\/+$/, '') || '/';
     const NAV = [ { key: 'status', href: '/', label: 'Status' }, { key: 'fleet', href: '/fleet', label: 'Fleet' }, { key: 'settings', href: '/settings', label: 'Settings' } ];
     const nav: NavItem[] = authed === true ? NAV.map((n) => ({ ...n, icon: null, active: n.href === path })) : [];
     <AppShell
       name="Status"
       icon={<Icon name="pulse" size={20} />}
       homeHref="/"
       hub={{ href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' }}
       navMode="header"
       nav={nav}
       navLabel="Status"
       mainId="main"
       headerInnerClassName="mx-auto max-w-(--nish-page-max) xl:max-w-[1360px]"
       actions={<the Log in / Log out buttons from Header.tsx, unchanged>}
       connection={{ offlineMessage: "You're offline. Showing the last data.", onRetry: () => window.dispatchEvent(new Event('online')) }}
       container="full"
       containerClassName="max-w-(--nish-page-max) pt-0 xl:max-w-[1360px]"
       footer={<footer className="mt-10 border-t border-th-line pb-2 pt-4.5 text-xs text-th-hi3"><span>Checked from the PC that serves every nish.software site.</span></footer>}
     >
       {page content exactly as inside <main> today}
     </AppShell>
     ```
     Delete the "Kept local Header/main" comment and `Header.tsx`.
- Edge cases: logged out: no tabs; `authed === null`: no tabs (as today); the login sheet's back handling is
  unchanged (it is a child).
- Acceptance: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run shots` on seeded data
  (README) and look at the pictures; local Fold diff with no new problems.

### T10 trackers adopts AppShell

- Repo / checkout: nishant/trackers at `C:\Code\trackers-appshell-gaps`
- Owns: `ui/src/App.tsx`, `ui/src/components/Header.tsx` (delete), `ui/src/components/links.tsx` (new),
  `ui/src/pages/Home.tsx` and `ui/src/pages/flights/TripPage.tsx` (import line only), `scripts/shots.mjs`
  (only if a selector breaks)
- Reads: `ui/src/components/Icon.tsx`, `ui/src/components/Search.tsx`
- Depends on: T6
- Change:
  1. Setup as T7 step 1 with `npm ci` and `paths:['.']`. Base Fold shots first.
  2. Move `NavLink` and `linkRenderer` from Header.tsx to `links.tsx` unchanged; point Home.tsx and
     TripPage.tsx at `../components/links` and `../../components/links`; delete Header.tsx.
  3. App.tsx: replace `<Header>`, the `NavRail`, the content wrapper, the `BottomNav`, `MoreSheet` and
     `<Toaster />` with:
     ```tsx
     <AppShell
       name="Trackers"
       brand={<NavLink to="/" go={go} aria-label="Trackers" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-xl font-bold tracking-tight text-th-hi sm:justify-start"><Icon name="chart" size={20} className="text-th-accent" /><span className="max-sm:hidden">Trackers</span></NavLink>}
       hub={{ href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' }}
       nav={authed ? nav : []}
       navPending={authed === null ? 3 : 0}
       moreItems={authed ? moreItems : []}
       moreMenu={false}
       renderLink={renderLink}
       navLabel="Trackers"
       mainId="main"
       headerInnerClassName="mx-auto max-w-[1440px]"
       actions={authed ? (<><IconButton label="Search" onClick={() => setSearch(true)}><Icon name="search" size={18} /></IconButton><Button onClick={logout} icon={<Icon name="out" size={16} />} className="max-md:hidden">Log out</Button></>) : null}
       container="full"
       containerClassName="max-w-[1440px] pt-0 sm:pb-[calc(var(--nish-bottom-inset,0px)+2.5rem)]"
       footer={<the footer element from today, unchanged>}
       resetKey={path}
     >
       {page}
       {authed && <Search open={search} onOpenChange={setSearch} go={go} />}
     </AppShell>
     ```
     `more` state and its `setMore(false)` in `logout` go away (the shell owns the sheet; `resetKey` closes
     it on navigation).
- Edge cases: `/login` path after sign-in (`go('/')`, unchanged); a modified click on a nav link opens a new
  tab (linkRenderer, unchanged); the Settings link in the footer stays.
- Acceptance: `npm run typecheck`, `npm run lint`, `npm run build` (tests fail locally on Windows temp-dir
  cleanup per its CLAUDE.md; run `npm test` and treat only EPERM cleanup failures as known), `npm run shots`
  against `scripts/mock-server.mjs` and look at the pictures; local Fold diff with no new problems.

### Local Fold diff (T7 to T10)

From the app worktree, with the ui worktree at `C:\Code\ui-appshell-gaps` (built, Chromium installed there):

1. Before any code change (after the pack is extracted): start `fold:serve` with `FOLD_PORT=5301
   FOLD_SIDE=base` in the background (PowerShell: `$env:FOLD_PORT='5301'; $env:FOLD_SIDE='base'; npm run
   fold:serve`; trading: `pnpm fold:serve`), wait for `http://127.0.0.1:5301/`, run `node
   C:\Code\ui-appshell-gaps\tools\visual-check.mjs fold.visual.json --port 5301 --png --no-fail --out
   fold/base`, stop the server.
2. After the change: the same with `5302`, `FOLD_SIDE=head` and `--out fold/head`.
3. `node C:\Code\ui-appshell-gaps\tools\fold-diff.mjs fold/base fold/head --out fold-report`; it must exit 0
   (no new problems). Open `fold-report/index.html` and compare with "Expected visual changes". Do not commit
   `fold/` or `fold-report/` (delete them).
4. job-apps: before step 1 check that Postgres answers on `127.0.0.1:5432` (PowerShell `Test-NetConnection
   127.0.0.1 -Port 5432`, `TcpTestSucceeded`), using the default `DATABASE_URL` in `scripts/fold-serve.mjs`.
   If it does not, skip the local diff; the release step labels the PR `fold` once.

### Expected visual changes (the Fold diff should show these and nothing else)

- trading: 360 and 840: Inbox and Assistant swap in the header; the hub pill shrinks to its arrow under 480px.
  840: the header spans the full width and the rail sits under it (was: rail full height at the left).
  1440: sidebar 224px instead of 208px; active row tinted accent-soft (was elevated); the collapse button at
  the foot next to the theme toggle (was in the brand row); no divider line between brand and tools. Page
  bottom padding may differ by a few pixels.
- job-apps: 360: hub pill arrow-only under 480px; a skip link (invisible until focused). 1440: Review's
  "needs a resume" dot is the red badge dot at the pill's corner (was an accent dot); the theme toggle sits
  after Log out (was before).
- status: 360: hub pill arrow-only; the "Status" wordmark shows only its icon under 640px. Nothing else.
- trackers: 360: hub pill arrow-only. 1440: a Home tab before Price watch and Flights; three placeholder tabs
  during the sign-in check (was two). On /settings the phone More button is highlighted.

## Waves

W1: T1, T3 · W2: T2 (needs T1) · W3: T4, T5 (need T2) · W4: T6 (needs T1, T3, T4, T5) · ui PR and merge ·
W5: T7, T8, T9, T10 (need T6's pack; four repos, run in parallel) · W6: per-app rebase onto the fan-out bump,
PR, merge (release step, the session itself).

## Review focus

- Defaults pixel-identical to 2.0.2 (workflows' bump runs Fold): header classes, rail, BottomNav, the
  container now outside `<main>`.
- No static path from AppShell (or `nish-ui` root `AppShell` import) to drawer, modal, more-sheet or
  overlay-dialog: the size check's `mustNotInclude` must be real, not vacuous (break it on purpose once).
- The barrel exports exactly master's names; `tools/api-surface.test.mjs` passes without updating the
  snapshot for removals.
- Lazy loading: SSR and hydration (no import during render on the server), a failed chunk closes the sheet,
  rapid double taps on More, the More sheet's history entry (closeOnBack) still works after a lazy first open.
- Accessibility: one visible nav landmark per width; header mode tabs' `aria-current`; the sidebar brand
  mode keeps a skip link and a banner landmark below lg; badges announced ("3 new").
- The four apps at 360, 840 and 1440 in light and dark (local Fold reports), every page reachable from
  visible UI on the phone (status Settings tab, trackers Settings in More and the footer, job-apps Settings
  and Log out in More).

## CI budget

- Branch pushes trigger no CI; only `pull_request` events and master pushes do. One PR per repo, opened only
  after every check in that repo's PR workflow passes locally (the acceptance commands above are those
  checks). Review fixes are pushed as one batch per repo, not many small pushes. No empty commits or re-runs
  to retrigger unless a check flaked (then one re-run). No Windows or macOS jobs exist in these PR workflows;
  none are added.
- ui (public, free minutes): one PR, `ci` (check, browsers, consumers x3, Fold on the docs site) plus CodeQL;
  free. No release dispatch here: the orchestrator's batched ui release fans out about 13 bump PRs once for
  every ui session together (the expensive part, shared).
- App PRs, GitHub-hosted private minutes:
  - trading: `ci` (about 6 min) + `e2e` (about 10 min) on the PR; the master run skips jobs whose tree passed
    (`scripts/ci-gate.mjs`), about 2 min. About 18 min.
  - job-apps: `check` about 4 min on the PR; master `check` skipped by the passed-tree marker, about 1 min.
    About 5 min, plus about 10 if the `fold` label is needed.
  - status: about 3 + 1 min. trackers: about 4 + 1 min.
  - The fan-out bump PRs for these four repos are counted under the orchestrator's release, not here.
- Estimate for this build: about 32 GitHub-hosted minutes with no fix pushes; about 60 with one fix batch per
  app PR and the job-apps `fold` label.

## Parallel sessions

- picker-carousel (ui) and tree-virtual (ui) add components: they edit `src/index.ts`, `site/components/index.ts`,
  `README.md`, `CHANGELOG.md` `## [Unreleased]`, and append rows to `tools/size-budgets.json`. This spec owns
  `tools/size-budgets.json`'s existing rows, its comment and `tools/size-check.mjs`; other sessions only append
  new rows at the end of `imports`. `CHANGELOG.md`: everyone adds lines under `## [Unreleased]`; on a conflict
  keep both sides. This spec never edits `src/index.ts`.
- tree-virtual builds ContextMenu and HoverCard on the modules defined in "Module layout after the split":
  positioning from `src/components/overlay-position.ts` (`useAnchoredPosition`, `floatingStyle`, `place`,
  `useDismiss`, `useReturnFocus`, `Side`, `Align`, `GAP`, `EDGE`), layer plumbing from `overlay-core.ts`
  (`layerHost`, `useMergedRef`, `isTop`, `ov`), menu rows from `menu.tsx` (`MenuItem`, `MenuLabel`,
  `MenuSeparator`, `MenuContext`, `ITEM_SELECTOR`, `menuItems`), tips from `tooltip.tsx`, lazy loading from
  `lazy-module.ts`. Those paths exist only after this spec's ui PR merges: tree-virtual builds VirtualList,
  VirtualTable and TreeView first and starts ContextMenu and HoverCard after rebasing onto that merge. It never
  edits `overlay.tsx` (the barrel); a new component gets its own export line in `src/index.ts`.
- picker-carousel: DatePicker and MultiSelect may use `Popover` and `DropdownMenu`; import from `./overlay`
  (works before and after the split) or, after this merge, from `./popover` and `./menu`.
- ui-leftovers (ui): owns `src/components/canvas/*`, `site/` bundle splitting and `/themes`, `theme.ts`
  tests, internal-API marking, `src/elements`. Its SystemCanvas routing work may move the SystemCanvas size:
  whichever PR merges second re-runs `npm run size`, and a SystemCanvas over 27 is trimmed or raised in that
  PR with the reason in the budget comment. If it marks APIs internal in `README.md` or docs, keep both sides.
  ROADMAP "Other 2.0 leftovers" is its entry; this spec only rewrites its own two entries.
- tradingview-integration (trading, mcp, hosting) and earnings-predictor (trading) may add `NAV` entries and
  routes in trading's `AppShell.tsx`/`App.tsx`, and CHANGELOG entries. T7 keeps `NAV` in the same file and
  format; trading's adoption merges last (it waits for the ui release), so it rebases onto their merges and
  keeps their NAV entries. A new nav entry they add needs only `{ to, label, icon, end, hint }` (plus
  `short` for a long label).
- offsite-backups (hosting, status): may add a backup freshness view to status. T9 rewrites `ui/src/App.tsx`
  and deletes `Header.tsx`; whichever merges second rebases and keeps the other's page content and any new
  nav tab (a new tab becomes one more `NAV` entry in App.tsx).
- fold-and-vendor (artifacts, workflows, skills), life-admin-skills (skills): no shared files. workflows
  uses AppShell; its fan-out bump must show no pixel change (Review focus).
- Before merging any PR: `git fetch` and merge `origin/master` into the branch, re-run that repo's checks.

## Release

Order: ui, then the four apps (any order among them), then bookkeeping.

1. ui: final commit `appshell-gaps: release` deletes `docs/specs/appshell-gaps.md` (and `docs/specs/` if
   empty) and edits ROADMAP.md:
   - "Size budgets back to the 2.0 targets": delete it if AppShell is at 34 and SystemCanvas at 27; replace it
     with "- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is <N> KB gzip (target 100).
     Not reachable in 2.x: SystemCanvas, Inbox and the service-token components have to leave the root entry
     (SystemCanvas already has `nish-ui/system-canvas`), a 3.0 change; decide it with the fleet-only APIs item
     in "Other 2.0 leftovers"." If AppShell or SystemCanvas stayed over target, add to that entry: "AppShell is
     <A> KB (target 34); next lever: Toaster cards loaded on demand, with a fallback for a chunk that cannot
     load." and/or "SystemCanvas is <S> KB (target 27)."
   - "AppShell gaps that keep four apps on local shells": rewrite to "- **Adopt the shared AppShell in four
     apps** (2026-11-02): ui has the props since this release; trading, job-apps, status and trackers still
     render their own shells. Each app's `appshell-gaps` branch swaps it for `AppShell` and deletes the local
     one. Repos: trading, job-apps, status, trackers."
   Open the PR (title "appshell-gaps: shared shell props and lazy overlays", body per release.md with the size
   table before and after and the spec link at the spec commit), wait for checks, merge. Tell the orchestrator
   (the parent session): "ui ready for release" (minor). Never run `release.yml` here.
2. Apps (meanwhile built against the pack, W5): push each `appshell-gaps` branch (no PR yet). When the
   fan-out's `ui/vX.Y.Z` bump has merged in that repo (`git fetch` then `git log origin/master --oneline -5`
   shows it), `git merge origin/master` into the branch, reinstall (`npm ci` / `pnpm install
   --frozen-lockfile`, which drops the extracted pack), re-run the acceptance commands, then open the PR
   (title "appshell-gaps: use the shared AppShell", body with the local Fold summary and the expected
   changes), wait for checks, merge with `gh pr merge <n> --merge --delete-branch`. job-apps without the
   local diff: add the `fold` label right after opening and read its report before merging.
3. Deploys: each app deploys on its master push (`deploy.yml`; trading's `ci.yml` deploy job, which defers
   during market hours unless dispatched with `force`, never forced here). Watch with `gh run watch <id>
   --exit-status` in the background. Live checks: `curl.exe -s -o NUL -w "%{http_code}"` on
   https://status.nish.software/health, https://trackers.nish.software/health, job-apps' and trading's health
   paths from their CLAUDE.md; screenshots of each live app at 360x780, 840x900 and 1440x900 in light and dark
   with a one-off Playwright script (never `shots.mjs` against live). Sign-in pages that need a password the
   session does not have count as unverified for the signed-in views; say so.
4. Bookkeeping: after the last app merges, delete the "Adopt the shared AppShell in four apps" entry from ui's
   ROADMAP.md in a docs-only commit to ui master with `[skip ci]` (not while `release.yml` is running; check
   `gh run list -R nishant/ui --workflow release.yml --limit 1`). If an app is blocked, rewrite the entry to
   name only the apps left. Delete `$env:TEMP\appshell-gaps-pack`. Remove the worktrees (junction check
   first, traps.md).
- Commands that publish, upload, delete or release, never run for real by a subagent: `gh pr create`, `gh pr
  merge`, `gh pr edit --add-label fold`, `git push` to master, `gh workflow run release.yml`, `gh workflow run
  publish.yml`, `npm publish`, any deploy dispatch, `git worktree remove`, `rm -rf` of any folder.

## Open questions for the research phase

- Does esbuild with `splitting: true` drop `drawer.js` from AppShell's initial chunk when `src/index.ts`
  still re-exports `Drawer` through the `overlay.tsx` barrel (sideEffects on the ui package.json)? T6's
  `mustNotInclude` answers it; if not, find which static edge keeps it and cut it (a direct import somewhere).
- Does Vite 8 (Rolldown) in the apps put `more-sheet` in its own chunk when `@nish/ui` is a dependency
  (check one app's `vite build` output for a separate chunk after T7 to T10)?
- Exact gzip of AppShell after T4 (the 34.0 decision in T6).
