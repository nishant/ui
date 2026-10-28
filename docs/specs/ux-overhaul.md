# @nish/ui v0.7.0: mobile chrome, layout contract and new components

Status: in progress · Slug: ux-overhaul · Date: 2026-10-28 · Size: large
Repos: ui (this spec, wave 1). Later waves have their own `docs/specs/ux-overhaul.md` in startpage, trading, job-apps, status, trackers, nish.software, hosting and skills.
ROADMAP: `ROADMAP.md` → "UX overhaul: mobile chrome and new components"

## Goal

A deep audit of every *.nish.software app (2026-10-28, screenshots at 360x780, 840x900 and 1440x900 in light and dark) found the same problems in nearly every app, and most of them come from the design system or from pieces each app hand-rolls. This release fixes them once, here, and adds the components the apps (and future apps) keep writing by hand. Nish uses a Galaxy Z Fold 7 for almost everything: 360px cover screen, ~840px unfolded, then desktop.

Outcomes:
1. No sticky or fixed chrome is see-through. AppHeader, PageHeader, Callout `variant="bar"` and every new bar are opaque by default; glass is opt-in.
2. A layout contract of CSS variables (`--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-bottom-inset`) that the header and bottom bars publish and that Toaster, Drawer, sticky elements and page padding read, so toasts never cover a tab bar and sticky elements stack under the header.
3. New components: BottomNav, MoreSheet, NavRail, ScrollRow, SectionNav, StickyBar, StickyActionBar, LoadingBar, PageContainer, ConnectionBanner, ResponsiveTable, ListRow, LinkCard, Favicon, AsyncPanel, SkeletonCard, StatGridSkeleton, CardListSkeleton, LineChart, BarChart, RangeBar, CommandPalette, RelativeTime; hooks useMediaQuery, useBreakpoint, useDocumentTitle, useNow, useLocalStorage, useScrollSpy, useScrollEdges; a React-free `@nish/ui/format` entry.
4. Fixes: bottom sheets swipe down to dismiss and animate out; Android back closes the top sheet; Popover never runs off-screen; Toaster moves to the top while a sheet is open on a phone and swipes away; TableWrap contains its children and shows scroll fades; Segmented and Tabs rows scroll with edge fades instead of wrapping; link buttons get 44px hit areas on touch; spinners still move under reduced motion; no Android tap flash.
5. Static (non-React) parity for the static sites (hub, mc, trips): `.nish-skeleton`, `.nish-spinner`, busy buttons, `.nish-sheet` bottom sheets, `.nish-checkbox`, `.nish-switch`, `.nish-subnav` with scrollspy, `.nish-link-card`, `.nish-sticky`, `.nish-bottom-nav`, `.nish-checklist`, plus JS helpers in `theme.js` / `theme.global.js`.
6. The docs site (design.nish.software) documents every new piece, gets a search command palette, phone-first component pages (usage first, jump chips, props as stacked rows under 640px), the full theme picker on phones, and dogfoods AppHeader and Drawer.

## Out of scope

- Adopting the new pieces in the apps (waves 2-3, separate specs per app).
- uPlot or TanStack wrappers (apps keep their own; LineChart and BarChart here are dependency-free SVG).
- A rich text editor or code editor component (the start page keeps those local in wave 2).
- An AppShell composite. BottomNav, MoreSheet and NavRail are the parts; apps compose them.

## Decisions

- Opaque by default, `glass` opt-in, everywhere. Reason: Nish flagged see-through bars twice; the audit found the same bug in 6 apps.
- Bars publish their height with a ResizeObserver to CSS variables on `<html>` and clear them on unmount or when hidden. Reason: one contract every consumer (Toaster, Drawer, page padding, sticky offsets) can read with no React context, and it works in static pages too.
- `--nish-bottom-inset` is defined once in base.css as `calc(var(--nish-bottom-nav-h, 0px) + var(--nish-bottom-bar-h, 0px))`. BottomNav writes `--nish-bottom-nav-h` (its full height including the safe area), StickyActionBar writes `--nish-bottom-bar-h`.
- Modal and Drawer `closeOnBack` defaults to true. Reason: on Android the back gesture leaving the page instead of closing the sheet was a high finding in trackers; it is what every phone user expects. Apps can pass `closeOnBack={false}`.
- DropdownMenu `sheetBelow` defaults to `false` (opt-in) so existing menus do not change shape without the app choosing it.
- Charts are dependency-free SVG with a viewBox-free responsive layout (ResizeObserver width). Reason: the start page and future apps need a small price chart without pulling uPlot.
- `@nish/ui/format` is a separate React-free entry (like `./tokens` and `./chart`) so static pages and servers can import it.
- Version 0.7.0 (minor): additive plus behavior changes listed in the changelog (opaque headers, closeOnBack, toast placement).

## Current state

- `src/components/display.tsx` (1097 lines): AppHeader at ~line 825 (props name, icon, hubHref, actions, nav, themeToggle, sticky, innerClassName, homeHref, hideNameBelow, navLabel, compactPill, className; header row is `flex min-h-14 flex-wrap ...` at ~890; background `bg-th-bg/85 backdrop-blur`), PageHeader (sticky uses top-0), Callout (CALLOUT_TONE uses `bg-th-<tone>-soft`, translucent), Stat, StatGrid, Meter, Sparkline, Disclosure, KeyValueList, ChartLegend.
- `src/components/overlay.tsx` (1230 lines): `layerStack` (line 31), `lockScroll` (46), Modal (137-260, sizes md..full, `sm:max-h-[85vh]`), Drawer (262-378, `bottomOffset`), ConfirmDialog, `useAnchoredPosition` (~497), Tooltip, FloatingTip, Popover (781-885), DropdownMenu (902-), MenuItem, `menuItemClass`.
- `src/components/toast.tsx`: Toaster (props className, offset, offsetUntil), `toast`, `useToast`, `dismissToast`.
- `src/components/table.tsx`: TableWrap (WRAP class lacks `relative`, so absolutely positioned sr-only children escape and widen the page), Table, Th, Td, Tr, `tableClass`.
- `src/components/feedback.tsx`: Skeleton, SkeletonLines, SkeletonRows, EmptyState, ErrorState, Spinner.
- `src/components/segmented.tsx`, `tabs.tsx` (Tabs size, block, hideFrom; TabPanel showFrom, keepMounted), `forms.tsx` (ChipGroup has a scroll mode), `primitives.tsx` (Button with `loading`, `buttonClass`, IconButton...), `theme-toggle.tsx` (ThemeToggle `phone?: 'compact' | 'segmented'`).
- `src/theme.ts`: theme switching plus static helpers `mountThemeToggle`, `showToast`, `confirmDialog`, `mountTooltips`; `src/theme-global.ts` builds `window.nishTheme`; `src/theme-init.js` creates one `meta[name=theme-color]` but leaves a static one an app ships.
- `src/css/base.css` (global rules incl. the reduced-motion rule that freezes spinners), `src/css/components.css` (static `.nish-*` classes, built by `scripts/build-components.mjs` into `nish-components.css`).
- `scripts/build.mjs`: tokens.css (`--nish-<role>-soft` = 14% over transparent at line 50), tailwind.css mapping `--color-th-*` (line 93-148), fonts, theme-init with baked themes. `tools/contrast.mjs` checks text roles on surfaces.
- `src/index.ts` is the single export list. `tsup.config.ts` entries index, theme, chart (+ iife theme.global). `package.json` `exports` map.
- Docs site: `site/main.tsx` (shell, header, nav, drawer), `site/pages/*` (component page at `site/pages/component.tsx`), `site/lib/*` (PropsTable in `site/lib/ui.tsx` 63-100, min-w-[560px]), `site/components/<name>.tsx` (one doc per component, registered in `site/components/index.ts`), `site/docgen.mjs` (`COMPONENTS` list read by the TypeScript compiler API), `site/static-example/`.
- Icons: `src/components/icons.tsx` (inline SVG icon components with `IconProps`).
- Checks: `npm run check` = typecheck + contrast + build. `npm run build:site`. `node tools/visual-check.mjs <config>` for screenshots (defaults to desktop, fold 840x760 touch, phone-small 360).

## Design

### Layout contract (CSS variables on `<html>`)

| Variable | Written by | Value | Read by |
|---|---|---|---|
| `--nish-header-h` | AppHeader when `sticky` (default) | measured `offsetHeight` px | PageHeader sticky top, StickyBar default top, SectionNav top, `.nish-scroll-target` scroll-margin |
| `--nish-bottom-nav-h` | BottomNav while visible (below `hideFrom`) | measured height incl. safe area | `--nish-bottom-inset`, StickyActionBar bottom, MoreSheet offset |
| `--nish-bottom-bar-h` | StickyActionBar while open | measured height | `--nish-bottom-inset` |
| `--nish-bottom-inset` | base.css only | `calc(var(--nish-bottom-nav-h, 0px) + var(--nish-bottom-bar-h, 0px))` | Toaster, `PageContainer` bottom padding, `.nish-pad-bottom-inset` |

Write with `document.documentElement.style.setProperty(name, px)`; remove with `removeProperty(name)` on unmount and whenever the element is hidden (display none / below breakpoint). One shared helper in `src/components/layout-vars.ts` (owned by T1): `useHeightVar(ref, name, enabled)` that runs a ResizeObserver and writes/removes the variable. Every component in this list uses it.

`html[data-nish-layer-open]` is set by overlay.tsx while any Modal, Drawer or ConfirmDialog is open (count > 0), removed when the last closes.

### Tokens and base (T1)

- build.mjs: for every SOFT_ROLE also emit `--nish-<role>-soft-solid: color-mix(in srgb, var(--nish-<role>) 14%, var(--nish-bg));` next to `-soft`, and Tailwind `--color-th-<role>-soft-solid`. contrast.mjs: check each text role it already checks on `-soft` also on `-soft-solid`.
- base.css additions:
  - `html { -webkit-tap-highlight-color: transparent; }`
  - `:root { --nish-page-gutter: 1rem; --nish-header-h: 0px; } @media (min-width: 640px) { :root { --nish-page-gutter: 1.5rem; } }` and `:root { --nish-bottom-inset: calc(var(--nish-bottom-nav-h, 0px) + var(--nish-bottom-bar-h, 0px)); }`
  - `html { scrollbar-gutter: stable; }` only inside `@media (hover: hover) and (pointer: fine)` (desktop scrollbars; stops the page shifting when lockScroll hides overflow).
  - `.nish-scroll-target { scroll-margin-top: calc(var(--nish-header-h, 0px) + var(--nish-sticky-extra, 0px) + 0.5rem); }`
  - `.nish-scroll-fade` (horizontal overflow fade): `mask-image` linear-gradient to transparent over 24px at the start when `[data-at-start="false"]` and at the end when `[data-at-end="false"]`; both combined with `mask-composite`. No mask when both are true or attributes are absent.
  - `.nish-no-scrollbar { scrollbar-width: none } .nish-no-scrollbar::-webkit-scrollbar { display: none }`
  - `.nish-pad-bottom-inset { padding-bottom: calc(var(--nish-bottom-inset) + env(safe-area-inset-bottom) * 0 + 1rem); }` (the nav height already includes the safe area; when no nav exists use `max(1rem, env(safe-area-inset-bottom))`): final rule `padding-bottom: max(calc(var(--nish-bottom-inset) + 1rem), calc(1rem + env(safe-area-inset-bottom)));`
  - Reduced motion: the existing global rule freezes every animation. Exempt spinners: `@media (prefers-reduced-motion: reduce) { .animate-spin, .nish-spinner { animation: nish-pulse 1.6s ease-in-out infinite !important; animation-iteration-count: infinite !important; animation-duration: 1.6s !important; } }` with `@keyframes nish-pulse { 50% { opacity: .35 } }`.
  - Keyframes used by T3/T4/T6/T10: `nish-sheet-out` (translateY(0) → translateY(100%)), `nish-fade-out` (opacity 1 → 0), `nish-toast-in-top` (translateY(-8px), opacity 0 → none), `nish-bar-in` (translateY(100%) → 0), `nish-loading-bar` (indeterminate: translateX(-100%) → translateX(250%) of a 40% wide bar). All 180-240ms except loading-bar 1.2s infinite. Check whether base.css already has sheet-in / fade-in keyframes and reuse their names.
- theme-init.js: after setting the theme-color meta, remove any other `meta[name=theme-color]` without a `media` attribute (keep metas that have `media`). The created meta gets `data-nish`.
- New file `src/components/layout-vars.ts` with `useHeightVar(ref: RefObject<HTMLElement | null>, name: string, enabled = true): void` (ResizeObserver, `setProperty(name, el.offsetHeight + 'px')`, cleanup `removeProperty`) and `useStuck(ref): boolean` (an IntersectionObserver on a 1px sentinel inserted before the element; returns true once the element is stuck; sets `data-stuck` on the element). Not exported from index by T1 (T12 exports them).

### Chrome fixes in display.tsx and primitives.tsx (T2)

AppHeader:
- Background `bg-th-bg` with `border-b border-th-line`. New prop `glass?: boolean` (default false): `bg-th-bg/80 backdrop-blur-xl` only under `supports-[backdrop-filter]:`; otherwise solid.
- When `sticky` (default true): uses `useHeightVar(ref, '--nish-header-h')`, and `useStuck` → when stuck add `shadow-[var(--nish-shadow-card)]` (data-stuck). Keep `pt-[env(safe-area-inset-top)]` and add `pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]`.
- Row becomes `flex min-h-14 flex-nowrap items-center gap-2 sm:gap-3`. The name span `min-w-0 truncate`. The `nav` slot renders in a second row below md exactly as today (scrollable via ScrollRow from T5? no: T2 cannot import T5; render nav in a `div` with `overflow-x-auto nish-no-scrollbar`), from md it stays where it is.
- Container query: wrap the row in `@container/header`; under `@max-[400px]/header` the hub pill renders compact (arrow only) automatically, as `compactPill` does now.
- New prop `overflowActions?: ReactNode`: rendered after `actions` from sm; under sm only `overflowActions` collapse into a DropdownMenu kebab (an IconButton with a 3-dot icon, aria-label "More actions") whose children are the given MenuItems. Import DropdownMenu from overlay.tsx (read-only).
PageHeader:
- `sticky` uses `top-[var(--nish-header-h,0px)]`, `z-20` (AppHeader is z-30), `bg-th-bg`, border-b only when stuck (useStuck). Prop `collapseWhenStuck?: boolean` (default true): under sm, once stuck, hide description and render the title `text-base` single line truncated (actions stay).
Callout:
- `variant="bar"` uses `bg-th-<tone>-soft-solid` (opaque). New props: `sticky?: boolean` (`sticky top-[var(--nish-header-h,0px)] z-20`), `clamp?: 1 | 2 | 3` (line-clamp on the body instead of truncate), `href?: string` and `onClick?: () => void` (the whole row becomes an `<a>` or `<button>` with `min-h-11` and a trailing chevron icon), `count?: number` (a Badge "+{count}" after the title, aria-label "{count} more").
New helper `revealClass(className?)` returning `'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'` merged with className.
primitives.tsx:
- `buttonClass({ variant: 'link' })` adds `pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']` so the hit area is 44px without moving layout. New option `inline?: boolean` that skips it (links inside prose). New export `linkClass({ tone?: 'accent' | 'muted', inline?: boolean, className? })` with the same hit area for router Links.
- Button, IconButton: add `pointer-coarse:active:scale-[0.97] transition-transform` (not when disabled).

### Overlays (T3, overlay.tsx)

- `layerStack` changes call `syncLayerAttr()`: set or remove `data-nish-layer-open` on `<html>` when the count of dialog layers (Modal, Drawer, ConfirmDialog; not Popover) goes above 0 or back to 0.
- Modal and Drawer:
  - Exit animation: keep the component mounted for 200ms after `open` turns false (internal `closing` state), playing `nish-sheet-out` on bottom sheets and `nish-fade-out` on centered dialogs and the scrim; side drawers slide out. Reduced motion: unmount immediately.
  - Swipe to dismiss (bottom sheets only: Modal below sm, Drawer `side="bottom"`): pointer events on the drag handle and the header (`touch-action: none` on the handle only). While dragging, `transform: translateY(dy)` (dy ≥ 0, rubber-band 0.3x for dy < 0). On release, close if dy > 30% of the sheet height or velocity > 0.5 px/ms; otherwise animate back over 180ms. New prop `dismissible?: boolean` (default true); when false the handle is not drawn and swipe is off. The handle gets `role="button"`, `aria-label="Close"` and closes on Enter/Space when dismissible.
  - `closeOnBack?: boolean` (default true): on open `history.pushState({ ...history.state, nishLayer: id }, '')`; a `popstate` listener closes this layer if it is the top layer and `history.state?.nishLayer !== id`. When the layer closes for any other reason and `history.state?.nishLayer === id`, call `history.back()` (guard with a flag so the popstate handler does not call onClose twice). Nested layers each push their own entry.
  - Modal: `sm:max-h-[85dvh]` (was vh); `placement="top"` uses `sm:max-h-[76dvh]`. New `sheetHeight?: 'auto' | 'tall' | 'full'` for the phone sheet: auto (content, max 92dvh), tall (`h-[92dvh]`), full (`h-dvh` with no top radius and `pt-[env(safe-area-inset-top)]`).
  - Drawer: `bottomOffset` unchanged; when `side="bottom"` and no bottomOffset, keep `pb-[env(safe-area-inset-bottom)]`.
- Popover: `useAnchoredPosition` also returns `maxHeight` = room on the chosen side minus GAP minus EDGE (8px); the panel gets `style.maxHeight` and `overflow-y-auto overscroll-contain`.
- DropdownMenu: new `sheetBelow?: 'sm' | false` (default false). When `'sm'` and the viewport is under 640px, opening renders the children inside `<Drawer side="bottom" title={sheetTitle ?? 'Menu'}>` with `role="menu"` on the list and 48px rows; selecting an item closes it. New `sheetTitle?: string`.
- `menuItemClass`: add `pointer-coarse:text-sm pointer-coarse:gap-3`.

### Toaster (T4, toast.tsx)

- Default phone position (no `offset`): `bottom: max(calc(var(--nish-bottom-inset, 0px) + 8px), calc(12px + env(safe-area-inset-bottom)))`. `offset` still overrides it.
- While `html[data-nish-layer-open]` is present and the viewport is under 640px, the stack moves to the top: `top: max(12px, env(safe-area-inset-top))`, bottom auto, new toasts use `nish-toast-in-top`. Use a CSS selector (`html[data-nish-layer-open] .nish-toaster-stack { ... }` inside `@media (max-width: 639px)`) so no React state is needed; give the stack element the class `nish-toaster-stack` and put the rule in base.css? No: T4 adds a `<style>`-free solution with Tailwind arbitrary variants on the stack: `max-sm:[html[data-nish-layer-open]_&]:top-[max(12px,env(safe-area-inset-top))] max-sm:[html[data-nish-layer-open]_&]:bottom-auto`.
- Swipe to dismiss on touch: horizontal pointer drag on a toast card (`touch-action: pan-y`), translateX following the finger with opacity fading; dismiss past 35% of width or velocity > 0.5 px/ms.
- Remove `aria-live` from the container (each card keeps `role="status"` or `role="alert"`), so screen readers announce once.

### Navigation (T5: nav.tsx new, segmented.tsx, tabs.tsx)

```ts
export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;            // 20-24px SVG, currentColor
  href?: string;              // rendered as <a> unless renderLink is given
  onSelect?: () => void;      // rendered as <button>
  active?: boolean;
  badge?: number | boolean;   // true = dot; number = count pill (99+)
  hint?: string;              // MoreSheet and NavRail tooltip
}
type RenderLink = (item: NavItem, props: { className: string; children: ReactNode; 'aria-current'?: 'page' }) => ReactElement;
```
- `BottomNav({ items, more?, trailing?, hideFrom = 'md', label = 'Sections', renderLink?, className })`: `<nav aria-label={label}>` fixed `inset-x-0 bottom-0 z-40`, `bg-th-surface border-t border-th-line`, `pb-[env(safe-area-inset-bottom)] pl/pr safe-area`. Hidden from the breakpoint (`md:hidden` / `lg:hidden`). Items are `flex-1 min-w-0` cells, each a full-height target `min-h-14`. Inside, a pill `flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] leading-tight` that is `bg-th-accent-soft text-th-accent font-medium` when active, `text-th-hi3` otherwise; the label truncates. `aria-current="page"` on the active item. Badge: dot `size-2 bg-th-loss` or count pill at the icon's top-right. `more?: { label?: 'More', icon?, active: boolean, expanded: boolean, onToggle: () => void }` renders a last button with `aria-expanded`. `trailing` renders after a 1px divider. Publishes `--nish-bottom-nav-h` with useHeightVar, enabled only while the viewport is below `hideFrom` (useMediaQuery inline: matchMedia `(max-width: 767px)` for md, `1023px` for lg).
- `MoreSheet({ open, onClose, items, title = 'More', footer?, renderLink? })`: a `Drawer side="bottom" bottomOffset="var(--nish-bottom-nav-h, 0px)"` so the BottomNav stays visible and tappable. Rows 52px: icon, label, one-line hint in hi3, active row `bg-th-accent-soft`. Selecting a row calls onSelect / navigates and closes. `footer` defaults to a row "Theme" + `<ThemeToggle phone="segmented" />`.
- `NavRail({ items, tools?, footer?, showFrom = 'md', hideFrom = 'lg', renderLink?, label })`: a `w-[72px]` column, `pl-[env(safe-area-inset-left)]`, each item `min-h-14` with the icon in a `w-14 h-8 rounded-full` pill (active `bg-th-accent-soft text-th-accent`) and an 11px label under it. Visible only between showFrom and hideFrom (`hidden md:flex lg:hidden`). Tooltip with `hint` on fine pointers only.
- `ScrollRow({ children, bleed?, fade = true, snap?, className, as = 'div', label? })`: `flex gap-2 overflow-x-auto nish-no-scrollbar` + `nish-scroll-fade` driven by `useScrollEdges(ref)` (sets data-at-start / data-at-end on scroll and resize). `bleed` adds `-mx-[var(--nish-page-gutter)] px-[var(--nish-page-gutter)]`. `snap` adds `snap-x snap-mandatory` and `snap-start` to children via a class on the container `[&>*]:snap-start`. On mount and when children change, the child with `aria-pressed="true"`, `aria-selected="true"` or `aria-current` is scrolled into view with `scrollIntoView({ inline: 'nearest', block: 'nearest' })` (behavior instant).
- `useScrollEdges(ref)`: exported hook (above).
- `useScrollSpy(ids: string[], { rootMargin = '-45% 0px -50% 0px' } = {}): string | null`: IntersectionObserver on `document.getElementById(id)` for each id, returns the id of the section currently crossing the middle band (the last one that entered); falls back to the first id at the top of the page.
- `SectionNav({ items: { id, label, icon?, count? }[], sticky = true, onSelect?, updateHash?: boolean, className })`: a ScrollRow of chips (`chipClass`, 44px on coarse) inside a `sticky top-[var(--nish-header-h,0px)] z-20 bg-th-bg border-b border-th-line py-2` bar. Active chip from useScrollSpy gets `aria-current="true"` and the pressed chip look, and is kept in view. Clicking a chip scrolls the section into view with `scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })` (sections should carry `.nish-scroll-target`; SectionNav sets `--nish-sticky-extra` to its own height on `<html>` via useHeightVar). `updateHash` sets `history.replaceState` with `#id` (only when the app does not use hash routing; the start page passes false).
- Segmented: new `overflow?: 'wrap' | 'scroll'` (default `'scroll'`): one row, `overflow-x-auto nish-no-scrollbar nish-scroll-fade`, selected option scrolled into view; `'wrap'` keeps today's wrapping. New `fullWidth?: boolean` (options `flex-1`). When `options.length === 1`, render nothing unless `showSingle` is true (new prop, default false)? No: keep rendering (changing that breaks layouts); just document it.
- Tabs: when the list overflows, apply `nish-scroll-fade` via useScrollEdges and keep the selected tab in view.

### Layout pieces (T6: layout.tsx new)

- `StickyBar({ children, top?, className, elevate = true, as = 'div' })`: `sticky z-20 bg-th-bg`, top defaults to `var(--nish-header-h, 0px)`; `-mx-[var(--nish-page-gutter)] px-[var(--nish-page-gutter)]` so its background reaches the screen edges; border-b + shadow only when stuck (useStuck). Sets `--nish-sticky-extra` to its height while mounted (useHeightVar).
- `StickyActionBar({ open, message?, primary, secondary?, className, label = 'Actions' })`: when open, `fixed inset-x-0 z-30 bottom-[var(--nish-bottom-nav-h,0px)]`, `bg-th-elevated border-t border-th-line shadow-[var(--nish-shadow-pop)]`, padding `px-4 py-3`, plus `pb-[max(0.75rem,env(safe-area-inset-bottom))]` only when `--nish-bottom-nav-h` is 0 (use `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` and note: when a BottomNav is present it sits above it, and the nav already handles the inset; use a CSS `max()` expression: `padding-bottom: max(0.75rem, calc(env(safe-area-inset-bottom) - var(--nish-bottom-nav-h, 0px)))`). Layout: message left (`text-sm text-th-hi2 truncate`), secondary + primary buttons right. From sm it is a floating pill: `sm:inset-x-auto sm:right-6 sm:bottom-6 sm:rounded-[var(--nish-radius-lg)] sm:border`. Slide up with `nish-bar-in` (none under reduced motion). `role="region" aria-label={label}`. Publishes `--nish-bottom-bar-h` while open (useHeightVar).
- `LoadingBar({ active, delayMs = 200, top?, className })`: a 2px bar fixed at `top: var(--nish-header-h, 0px)`, full width, z-40, `role="progressbar" aria-busy="true" aria-label="Loading"`. Shows only after `delayMs` of being active; the inner 40%-wide `bg-th-accent` stripe runs `nish-loading-bar`. Reduced motion: a static 40% bar.
- `PageContainer({ size = 'default', children, className, padBottom = true, as = 'main' })`: `mx-auto w-full px-[var(--nish-page-gutter)] py-6`, max width narrow 42rem, default 56rem, wide 80rem, full none. `padBottom` adds `nish-pad-bottom-inset`.
- `ConnectionBanner({ healthUrl?, intervalMs = 30000, message = "Can't reach the server", offlineMessage = "You're offline", onRetry? })`: tracks `navigator.onLine` and, if healthUrl is given, a `fetch(healthUrl, { cache: 'no-store' })` probe with exponential backoff after failures (30s → 60s → 120s max) and immediately on `online` and on `visibilitychange` to visible. When offline or the probe fails, renders an opaque `Callout variant="bar" tone="warn" sticky` with the message and a Retry button that re-probes and calls onRetry. Renders nothing when healthy. Also export `useOnline(): boolean`.

### Data display (T7: data.tsx new, table.tsx, feedback.tsx)

- table.tsx: TableWrap `relative` (fixes sr-only spans widening the page); new `fade?: boolean` (default true) edge fades via `useScrollEdges` (import from nav.tsx is not allowed in parallel; T7 implements its own 15-line scroll-edge effect inline, or imports from `layout-vars.ts` if T1 put a shared version there: T1 adds `useScrollEdges` to layout-vars.ts and T5 re-exports it); `stickyFirstColumn?: boolean` (first `th`/`td` of each row `sticky left-0 bg-inherit z-10` and an edge shadow while scrolled). Th: `align-middle`. Td: new `nowrap?: boolean`; `numeric` cells are `whitespace-nowrap tabular-nums text-right`.
- `ResponsiveTable<T>({ rows, columns, rowKey, cardsBelow = 'md', onRowClick?, rowHref?, rowTone?, sort?, onSortChange?, minWidth?, stickyHeader?, stickyFirstColumn?, loading?, empty?, error?, label, renderCard? })` with
  ```ts
  interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; sortValue?: (row: T) => string | number | null; numeric?: boolean; primary?: boolean; secondary?: boolean; hideBelow?: 'sm' | 'md' | 'lg'; width?: string }
  type Sort = { key: string; dir: 'asc' | 'desc' } | null
  ```
  From the breakpoint: Table in TableWrap, sortable `Th` (click toggles asc/desc, `aria-sort`), rows clickable (Enter/Space) when onRowClick/rowHref, `rowTone` adds a 3px left border in `th-loss`/`th-warn`/`th-ok`. Below it: a `ul` of cards (`cardClass`), each a full-width button or link `min-h-11`: `renderCard(row)` if given, else the `primary` column as the title (semibold), the `secondary` column as the subtitle (hi3), and every other column as a 2-column grid of label/value pairs (numeric values right-aligned tabular). A "Sort by" `Select` plus a direction IconButton above the cards when any column has sortValue. Sorting is internal unless `sort`/`onSortChange` are passed. loading → `SkeletonRows` (table) / `CardListSkeleton` (cards); empty → the `empty` node or `<EmptyState title="Nothing here yet" />`; error → `ErrorState` with `error.message` and `error.onRetry`.
- `ListRow({ icon?, title, subtitle?, meta?, trailing?, href?, onClick?, active?, tone?: 'danger', chevron?, dense?, external?, className, as = 'li' })`: `min-h-[52px]` (dense 44), `flex items-center gap-3 px-3 rounded-[var(--nish-radius-sm)]`, title truncate, subtitle `line-clamp-2 text-sm text-th-hi3`, meta right-aligned `text-xs text-th-hi3 tabular-nums`, chevron icon when chevron or href. The whole row is the `<a>` (external: `target="_blank" rel="noopener noreferrer"` and a small external icon) or `<button>`; focus ring; hover `bg-th-hover` (or the existing hover role); active `bg-th-accent-soft`.
- `Favicon({ url, size = 16, label? })`: an `<img>` with `src = https://www.google.com/s2/favicons?sz=${size * 2 > 32 ? 64 : 32}&domain=${hostname}` (hostname from `new URL(url)`, invalid URLs skip the image), width/height = size, `loading="lazy" decoding="async"`, rounded-sm, fade in 150ms on load. On error or invalid URL: a letter avatar span of the same box: first letter of `label ?? hostname`, uppercase, 60% font size, background picked deterministically from `--nish-chart-1..8` at 20% via a string hash, text in that chart color. `aria-hidden`.
- `LinkCard({ href, title, blurb?, icon?, accent?: 'chart-1'…'chart-8' | 'accent', meta?, status?: { tone: StatusTone; label: string }, badge?: ReactNode, disabled?, layout = 'auto', external? })`: the whole card is the `<a>` (min 44px); 'card' layout = icon tile 40px in the accent soft color, title semibold, blurb line-clamp-3, meta row; 'row' = 64px row with icon, title + blurb clamp-1, chevron; 'auto' = row under 600px (container query on the parent `@container`), card above. Hover lift (`-translate-y-0.5 shadow`) only under `(hover: hover)`. Disabled: dashed border, `aria-disabled`, not a link.
- `AsyncPanel({ status: 'loading' | 'error' | 'empty' | 'ready', skeleton?, error?: { title?, message, onRetry? }, empty?: { title, description?, action? }, children })`: renders skeleton (default `<SkeletonRows />`), ErrorState, EmptyState or children; `aria-busy` while loading.
- feedback.tsx: `SkeletonCard({ lines = 3, media?: 'square' | 'wide' | 'none', className })`, `StatGridSkeleton({ count = 4, className })` (matches StatGrid tiles), `CardListSkeleton({ count = 3, lines = 2, className })`. Spinner keeps `animate-spin` (T1 exempts it from reduced motion).

### Charts (T8: charts.tsx new, exported from the main entry)

- `LineChart({ data: { x: number; y: number | null }[] | series: { label, tone?: 'chart-1'…'chart-8' | 'ok' | 'loss' | 'accent', points: { x: number; y: number | null }[] }[], height = 200, area?: boolean, yFormat?: (v) => string, xFormat?: (v) => string, yTicks = 4, xTicks = 4, baseline?: number, tone?, label: string, loading?, empty? })`: SVG sized to its container width (ResizeObserver), padding for axes, gridlines `var(--nish-line)`, tick text `var(--nish-hi3)` 11px tabular. Gaps (null y) break the line. `area` fills under the first series with a vertical gradient of its color 20% → 0%. `baseline` draws a dashed horizontal line (e.g. previous close). Interaction: pointer move (mouse or touch drag, `touch-action: pan-y` so vertical page scroll still works) shows a vertical crosshair, a dot on each series and a tooltip box (`tooltipStyle` from chart.ts) with xFormat(x) and each series' yFormat(y); on touch the tooltip stays after lift until the next tap outside. Keyboard: the svg is focusable (`tabIndex=0`, `role="img"`, `aria-label`), Left/Right move the crosshair. An sr-only `<table>` with the data (first 200 points). `loading` renders a Skeleton of the same height; `empty` (no points) renders the given node or "No data" in hi3 centered.
- `BarChart({ data: { label: string; value: number }[], height = 140, tone = 'chart-1', valueFormat?, showValues: 'always' | 'auto' = 'auto', xTicks: 'ends' | 'all' = 'ends', label })`: SVG bars with 2px radius, zero-value stubs (2px), values shown above bars on coarse pointers or when 'always'; tap/hover selects a bar and shows "label: value" in a caption row under the chart; sr-only table.
- `RangeBar({ min, max, low, high, current?, className })`: a 6px rounded track (`bg-th-line`) with a gradient segment from `low` to `high` (`var(--nish-chart-2)` → `var(--nish-chart-5)`), and a 8px dot at `current`. For weather daily rows and price day ranges.

### Format and hooks (T9: src/format.ts new entry, src/components/hooks.tsx new)

`@nish/ui/format` (no React):
```ts
money(v: number | null | undefined, o?: { cents?: 'auto' | 'always' | 'never'; compact?: boolean; currency?: string }): string // '$1,234.56'; auto = cents only when |v| < 1000 or v has cents; compact '$12.3k'
signedMoney(v, o?): string // '+$12.30', '−$4.00' (U+2212), 'No change' when |v| < 0.005
pct(v, o?: { digits?: number; fromRatio?: boolean; signed?: boolean }): string // fromRatio default true: 0.123 → '12.3%'; signed uses '+' and '−'
num(v, o?: { digits?: number; compact?: boolean }): string
signed(v, o?: { digits?: number }): string // '+1.20' / '−0.40'
bytes(v): string // '1.2 MB'
duration(seconds: number, o?: { style?: 'short' | 'long' }): string // '6h 40m' | '6 hours 40 minutes'
ago(t: Date | number | string, o?: { now?: number; style?: 'short' | 'long' }): string // 'just now', '3m ago', 'in 2h'; long via Intl.RelativeTimeFormat
date(t, style?: 'short' | 'medium' | 'long' | 'weekday'): string // 'Oct 28' | 'Oct 28, 2026' | 'Wednesday, October 28, 2026' | 'Wed 10/28'
time(t, o?: { timeZone?: string }): string // '7:42 AM'
dateTime(t): string // 'Oct 28, 7:42 AM'
dateRange(a, b): string // 'Dec 12 – 16', 'Dec 30 – Jan 2'
```
All en-US, all return '–' (en dash) for null, undefined, NaN or an invalid date. Add the entry to tsup.config.ts (`format: 'src/format.ts'`) and package.json `exports["./format"]`.

Hooks (hooks.tsx, React):
- `useMediaQuery(query: string): boolean` via `useSyncExternalStore` (false on the server).
- `useBreakpoint(): 'base' | 'sm' | 'md' | 'lg' | 'xl'` (640/768/1024/1280).
- `useDocumentTitle(title: string | undefined, o?: { app?: string })`: sets `document.title` to `${title} · ${app}` (or app alone when title is empty); restores the previous title on unmount.
- `useNow(intervalMs = 30000): number` that ticks, pausing while the document is hidden.
- `useLocalStorage<T>(key: string, initial: T, o?: { raw?: boolean })`: returns `[value, setValue]`; JSON by default, raw string when `raw`; try/catch around every access; syncs across tabs via the `storage` event.
- `RelativeTime({ value, style = 'short', refreshMs = 30000, className })`: `<time dateTime title={dateTime(value)}>` with `ago(value)`, re-rendering on useNow.

### Static parity (T10: components.css, build-components.mjs, theme.ts, theme-global.ts)

CSS (nish-components.css):
- `.nish-skeleton` (surface-2 fill, radius, shimmer gradient; static under reduced motion), modifiers `--text` (1em tall, width from inline style), `--circle`, `--thumb` (aspect-ratio 16/10), `--card` (height 120px). `.nish-skeleton-group[aria-busy]`.
- `.nish-spinner` (16px; `--sm` 14, `--lg` 24; border spinner in currentColor, 0.8s; reduced motion pulses) and `.nish-btn[aria-busy="true"]` (keeps width, hides label with `color: transparent`, centered spinner via `::after`).
- `.nish-sheet` on `<dialog>`: under 640px a bottom sheet (full width, top radius 16px, max-height 85svh, internal scroll, `overscroll-behavior: contain`, padding-bottom env(safe-area-inset-bottom), handle via `::before`), from 640px a centered dialog max-width 32rem; `::backdrop` scrim; open/close animations. Parts `.nish-sheet-header`, `.nish-sheet-title`, `.nish-sheet-body`, `.nish-sheet-footer`.
- `.nish-checkbox` (input appearance none, 20px, radius 5, accent fill + check, focus ring, 44px hit area via the wrapping label `.nish-check-row`), `.nish-switch` (on a checkbox or `button[role=switch]`, 44x26 track, knob, reduced motion). Both honor `--accent` override.
- `.nish-subnav` (sticky top var(--nish-header-h,0), opaque bg, border-b, horizontal scroll, fade masks via data-at-start/end, links 44px with the active pill `[aria-current]`).
- `.nish-link-card`, `.nish-link-card--row`, `[data-accent]` (same look as LinkCard), `.nish-sticky` (sticky top 0, opaque `var(--nish-bg)`, border/shadow when `[data-stuck]`).
- `.nish-bottom-nav` (fixed bottom bar like BottomNav, items `.nish-bottom-nav-item` with `[aria-current="page"]` pill wrapping icon and label).
- `.nish-checklist` (44px rows, custom box, checked strike-through in hi3, `.nish-checklist-progress` header "3 of 12" with a meter).
- `.nish-toast` (the static toast) bottom: `max(calc(var(--nish-bottom-inset, 0px) + 8px), calc(16px + env(safe-area-inset-bottom)))`.
- `.nish-dialog`: `max-height: 85dvh`.
JS (theme.ts, exported in theme-global.ts too):
- `openSheet(dialog: HTMLDialogElement): () => void`: showModal, Escape and backdrop click close, swipe down on the header/handle to close on touch, focus return; returns a close function.
- `mountScrollspy(nav: HTMLElement, o?: { offset?: number }): () => void`: links `a[href^="#"]` map to sections; sets `aria-current="true"` on the active link, keeps it in view, updates data-at-start/end on the nav.
- `mountStuck(el: HTMLElement): () => void`: sentinel observer toggling `data-stuck`.
- `mountChecklist(list: HTMLElement): () => void`: persists checked state of `input[type=checkbox]` inside `li[data-id]` to localStorage under `list.dataset.store`, updates `.nish-checklist-progress` text "{done} of {total}".
- `mountHeightVar(el: HTMLElement, name: string): () => void`: the static twin of useHeightVar (e.g. a static bottom nav publishing `--nish-bottom-nav-h`).

### CommandPalette (T11: command.tsx new)

```ts
interface CommandItem { id: string; label: string; group?: string; hint?: string; keywords?: string[]; icon?: ReactNode; href?: string; external?: boolean; onSelect?: () => void }
CommandPalette({ open, onOpenChange, items: CommandItem[] | ((q: string) => CommandItem[] | Promise<CommandItem[]>), placeholder = 'Search…', emptyText = 'No results', hotkey = true, onQuery?: (q: string) => void, footer?: ReactNode, onSubmitQuery?: (q: string) => void })
```
- Under 640px it is a `Modal sheetHeight="full"`-style sheet (use Drawer side=bottom size=lg if simpler) with the input pinned on top; from 640px a centered panel 560px wide at 12vh from the top. Input 16px, autofocus, `role="combobox" aria-expanded aria-controls aria-activedescendant`; results `role="listbox"` grouped by `group` with headings; each option 44px; the match is highlighted (`<mark>` styled `bg-transparent text-th-accent font-semibold`).
- Matching: case-insensitive subsequence ("fuzzy") over label + keywords, ranked: prefix match > word-start match > substring > subsequence; ties keep input order; max 50 results.
- Keys: ↑/↓ move, Enter selects (navigates to href with `location.assign`, opens a new tab when external, or calls onSelect) and closes; Enter with no results calls `onSubmitQuery(q)` when given (the start page uses this for a web search); Escape closes. `hotkey`: Ctrl/Cmd+K and `/` (when focus is not in an input) open it.
- `useCommandHotkey(open: () => void)` exported for apps that render their own trigger.

### Exports, docs and changelog (T12, wave 2)

- `src/index.ts`: export everything above (components, types, hooks, `revealClass`, `linkClass`, `useHeightVar`, `useStuck`, `useScrollEdges`, `useScrollSpy`, `useOnline`, `useCommandHotkey`).
- `site/docgen.mjs` COMPONENTS: add every new component and hook name.
- CHANGELOG.md `## [0.7.0] - 2026-10-28` with Added / Changed / Fixed sections listing every item in this spec in the file's existing style; call out the behavior changes (opaque AppHeader and Callout bar by default, `closeOnBack` default true, toast position follows `--nish-bottom-inset` and moves to the top during a phone sheet, Segmented `overflow` default 'scroll').
- README.md: a "Layout contract" section (the table above), a "Phone chrome" recipe (AppHeader + BottomNav + MoreSheet + NavRail + Toaster with no offset), the recommended `<head>`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">` and "do not ship a static theme-color meta", and the `@nish/ui/format` entry.

### Docs pages for new components (T13)

One file per new component in `site/components/` (same shape as the existing ones, e.g. `site/components/drawer.tsx`), registered in `site/components/index.ts`: bottom-nav, more-sheet, nav-rail, scroll-row, section-nav, sticky-bar, sticky-action-bar, loading-bar, page-container, connection-banner, responsive-table, list-row, link-card, favicon, async-panel, skeleton-presets (SkeletonCard, StatGridSkeleton, CardListSkeleton), line-chart, bar-chart, range-bar, command-palette, relative-time, format (a page listing every format function with live examples), hooks (useMediaQuery, useBreakpoint, useDocumentTitle, useNow, useLocalStorage, useScrollSpy), layout-contract (the CSS variable table with a live readout of the current values), static-parity (live examples of the new static classes using the built nish-components.css, plus the JS helpers). Each page has stories at 360-friendly widths and copyable usage.

### Docs site shell (T14)

- `src/components/theme-toggle.tsx`: new `collapse?: 'sm' | 'never'` (default 'sm', today's behavior); `'never'` keeps the segmented control and presets Select at every width.
- `site/main.tsx`: header uses AppHeader (opaque) with a search trigger (a wide button "Search docs…" with a `Kbd` "Ctrl K" hint from md, an IconButton with a search icon under md) that opens CommandPalette over: every page title, component names and summaries, prop names (docgen), token names, static class names and page section headings. The phone nav drawer uses the DS `Drawer side="left"` with nav grouped by category (collapsible groups, current group open, auto-scrolled to the current item) and `<ThemeToggle presets block collapse="never" />` pinned in its footer.
- `site/pages/component.tsx`: order is header → import line with CopyButton → Usage code (collapsed to 12 lines with "Expand", Copy always visible) → a SectionNav jump row (Usage · Preview · Stories · Props · Guidelines) → Preview → Stories → Props → Guidelines.
- `site/lib/ui.tsx` PropsTable: under 640px each prop is a stacked row: name (mono semibold) + "required" badge, the type in a wrapping mono chip, "Default: x" in hi3, then the description in full. From 640px keep the table.
- Replace hand-rolled CopyButton, Switch, PageHeader and Drawer in the site with the DS components where they exist.

## Tasks

All tasks: repo ui, checkout `C:\Code\ui-ux-overhaul`. Acceptance for every task: `npm run typecheck` passes for the task's files (other tasks may still be mid-edit; if a type error is in a file you do not own, note it and move on), plus the listed checks. Implementers do not edit `src/index.ts` (T12 does); export from your own module only.

### T1 Tokens, base CSS, theme-init, layout-vars
- Owns: `scripts/build.mjs`, `tools/contrast.mjs`, `tools/contrast-rules.mjs`, `src/css/base.css`, `src/theme-init.js`, `src/components/layout-vars.ts` (new)
- Depends on: none
- Change: everything under "Tokens and base (T1)" and the layout contract helpers `useHeightVar`, `useStuck`, `useScrollEdges` in layout-vars.ts.
- Acceptance: `npm run build` succeeds; `dist/tokens.css` contains `--nish-ok-soft-solid` (and one per soft role); `dist/tailwind.css` contains `--color-th-ok-soft-solid`; `npm run contrast` passes.

### T2 Chrome fixes (AppHeader, PageHeader, Callout, buttons)
- Owns: `src/components/display.tsx`, `src/components/primitives.tsx`
- Depends on: T1 (layout-vars.ts)
- Change: "Chrome fixes in display.tsx and primitives.tsx (T2)".

### T3 Overlays
- Owns: `src/components/overlay.tsx`
- Depends on: T1
- Change: "Overlays (T3)".

### T4 Toaster
- Owns: `src/components/toast.tsx`
- Depends on: T1
- Change: "Toaster (T4)".

### T5 Navigation
- Owns: `src/components/nav.tsx` (new), `src/components/segmented.tsx`, `src/components/tabs.tsx`
- Depends on: T1, T3 (MoreSheet uses Drawer)
- Change: "Navigation (T5)". Add icons you need inline in nav.tsx (do not edit icons.tsx).

### T6 Layout pieces
- Owns: `src/components/layout.tsx` (new)
- Depends on: T1, T2 (ConnectionBanner uses Callout)
- Change: "Layout pieces (T6)".

### T7 Data display
- Owns: `src/components/data.tsx` (new), `src/components/table.tsx`, `src/components/feedback.tsx`
- Depends on: T1
- Change: "Data display (T7)". ResponsiveTable's sort Select uses `Select` from primitives (read-only).

### T8 Charts
- Owns: `src/components/charts.tsx` (new)
- Depends on: T1
- Change: "Charts (T8)". Use `seriesColor`, `CHART`, `tooltipStyle` from `src/chart.ts` (read-only).

### T9 Format entry and hooks
- Owns: `src/format.ts` (new), `src/components/hooks.tsx` (new), `tsup.config.ts`, `package.json`
- Depends on: none
- Change: "Format and hooks (T9)". Add a small self-test script `tools/format-check.mjs` (node, imports `dist/format.js` after build, asserts 20+ representative outputs, exits non-zero on mismatch) and add it to the `check` script after build: `"check": "npm run typecheck && npm run contrast && npm run build && node tools/format-check.mjs"`.
- Acceptance: `npm run build && node tools/format-check.mjs` passes.

### T10 Static parity
- Owns: `src/css/components.css`, `scripts/build-components.mjs`, `src/theme.ts`, `src/theme-global.ts`
- Depends on: T1
- Change: "Static parity (T10)".
- Acceptance: `npm run build`; `dist/nish-components.css` contains `.nish-sheet`, `.nish-checklist`, `.nish-bottom-nav`; `dist/theme.global.js` defines `openSheet`, `mountScrollspy`, `mountStuck`, `mountChecklist`, `mountHeightVar`.

### T11 CommandPalette
- Owns: `src/components/command.tsx` (new)
- Depends on: T3
- Change: "CommandPalette (T11)".

### T12 Exports, changelog, README
- Owns: `src/index.ts`, `site/docgen.mjs`, `CHANGELOG.md`, `README.md`
- Depends on: T1-T11
- Acceptance: `npm run check` passes.

### T13 Docs pages for the new components
- Owns: new files under `site/components/` listed in "Docs pages", and `site/components/index.ts`
- Depends on: T12
- Acceptance: `npm run build:site` passes; every new page renders (open it in Playwright at 360 and 1440, no console errors).

### T14 Docs site shell
- Owns: `site/main.tsx`, `site/pages/*`, `site/lib/*`, `site/styles.css`, `src/components/theme-toggle.tsx`
- Depends on: T12
- Acceptance: `npm run build:site` passes; at 360 the drawer shows the full theme picker; Ctrl+K opens search and finds "Drawer" and "--nish-header-h".

## Waves

W1: T1, T9 · W2: T2, T3, T4, T7, T8, T10 (need T1) · W3: T5, T6, T11 · W4: T12 · W5: T13, T14

## Review focus

- Every sticky or fixed surface is opaque; check by scrolling content under each at 360 in light theme.
- The CSS variable contract: values are written and removed (unmount, hidden below/above breakpoints), and Toaster/MoreSheet/StickyActionBar position correctly with and without a BottomNav.
- closeOnBack with nested layers and with a router (no double close, no stray history entries left after programmatic close).
- Swipe gestures do not block vertical page scroll and work with reduced motion.
- No new runtime dependency (only clsx and tailwind-merge stay).
- Run `node tools/visual-check.mjs tools/site-all.visual.json` (or the site config) and look at the docs pages for the new components at 360, 840 and 1440 in both themes.

## Release

`npm run release minor` from `C:\Code\ui` on master after merge (it builds, tags v0.7.0 with dist and site-dist, pushes, and runs `scripts/bump-consumers.sh`, which bumps and deploys every consumer). Bumping consumers to 0.7.0 is safe without app changes (additive plus the opaque/closeOnBack/toast behavior changes). Verify https://design.nish.software shows 0.7.0 and the new pages at 360/840/1440, light and dark.

## Open questions for the research phase

None.
