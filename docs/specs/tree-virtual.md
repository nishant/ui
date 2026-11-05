# VirtualList, VirtualTable, TreeView, ContextMenu and HoverCard

Status: in progress · Slug: tree-virtual · Date: 2026-11-05 · Size: large
Repos: ui (spec lives here, `C:\Code\ui-tree-virtual`, branch `tree-virtual`), trackers (adoption only, last wave, `C:\Code\trackers-tree-virtual`, branch `tree-virtual`)
ROADMAP: `ROADMAP.md` in ui, entry "Components left out of 2.0" (this spec covers its "virtualized lists and tables, ContextMenu, HoverCard, TreeView" part; picker-carousel covers the rest)

## Goal

Five components that apps keep writing by hand or doing without: a virtualized list and table for
thousands of rows, a tree, a right-click/long-press menu and a hover preview card. Each follows the
component contract in `docs/DEVELOPING.md`, has a docs page on design.nish.software, unit tests, a
browser spec and a size budget. trackers then drops its local `VirtualList` for the shared one.

1. `VirtualList` renders only the rows near the viewport (fixed or measured heights, its own scroll box
   or the page), keeps a focused row mounted, exposes `scrollToIndex`, and reports
   `aria-setsize`/`aria-posinset`. 10,000 rows keep fewer than 60 row elements in the DOM.
2. `VirtualTable` is a virtualized table with the `ResponsiveTable` column API: sticky header, sorting,
   row tones, pinned first column, `aria-rowcount`/`aria-rowindex`, and roving-focus row navigation
   (arrows, Page Up/Down, Home, End, Enter, Space) when rows are clickable.
3. `TreeView` follows the WAI-ARIA tree view pattern: nested `role="tree"`/`treeitem`/`group`,
   single selection, controlled or uncontrolled expansion and selection, full keyboard model, RTL.
4. `ContextMenu` opens a `DropdownMenu`-style menu at the pointer on right-click, on a touch long
   press and on Shift+F10 / the Menu key, reusing `MenuItem`, `MenuLabel` and `MenuSeparator`, and
   becomes a bottom sheet under 640px.
5. `HoverCard` shows a rich preview next to a link after a hover or keyboard-focus delay, meets WCAG
   1.4.13 (dismissible, hoverable, persistent), never opens from touch.
6. Each has a docs page reachable from the docs nav (COMPONENT_DOCS), an SSR case, a size budget, an
   API-surface entry, a README mention, and passes axe with zero serious or critical issues.
7. trackers' Trip page uses `VirtualList` from `@nish/ui` and `ui/src/components/flights/VirtualList.tsx`
   is deleted.

## Out of scope

- Horizontal or grid (multi-column) virtualization, virtualized TreeView, sticky group headers inside
  VirtualList.
- TreeView multi-select, checkboxes, drag and drop, lazy-loaded children, inline rename.
- ContextMenu submenus that open to the side (MenuSubHeader in-place views still work, as in DropdownMenu).
- Keyboard entry into a HoverCard (Tab into the card), HoverCard on touch.
- Custom-element (`nish-ui/elements`) or plain-CSS (`.nish-*`) twins of these components.
- VirtualTable cards mode on phones, `rowHref` navigation (use `onRowClick` and your router).
- Editing `CHANGELOG.md` (the orchestrator writes the release entry from the bullets in "Release").
- Any other app adopting these components.

## Decisions

- **In-house virtualizer, no `@tanstack/virtual-core`.** The package has two runtime dependencies (clsx,
  tailwind-merge) and recent supply-chain hardening; virtual-core is about 4.5-5 KB gzip on its own,
  the in-house range math plus hook is about 1.5-2 KB and follows the contract (no import side effects,
  SSR-pure first render, `ref` as a prop). The math lives in a pure, separately tested module.
- **Offsets array, not a fixed-height fast path.** One `Float64Array` of row tops (count + 1) built in
  O(n) per change; 100,000 rows is 800 KB and about 1 ms. Binary search finds the first visible row.
  One code path for fixed and measured heights keeps the implementation small. (default)
- **Measured heights keyed by row key** (`itemKey`, default the index), so a re-sort does not apply one
  row's height to another. Measuring uses one `ResizeObserver` per list with React 19 ref cleanups.
- **Scroll anchoring by hand**: `overflow-anchor: none` on the scroller; when a row fully above the
  viewport changes height, the scroll position moves by the same delta, so the visible rows stay put.
- **VirtualList scrolls its own box when `height` is set, the window otherwise.** trackers' local list
  and every AppShell page scroll the window, which is what phones want (no nested scroll). (default)
- **VirtualTable always scrolls its own box** (`height`, default 480) because the sticky header and the
  sideways scroll need one scroll container. (default)
- **VirtualList positions rows absolutely** (`translateY`) inside a sized list; **VirtualTable uses
  spacer rows** (`<tr aria-hidden>` above and below) and `table-layout: fixed`, so native table layout,
  sticky header and pinned first column keep working and columns do not jump as rows mount.
- **Focus pinning.** VirtualList keeps the row that holds focus mounted wherever it is (absolute
  positioning allows a non-contiguous set). VirtualTable extends its contiguous range to include the
  focused row when it is within 100 rows of the range; farther away the row unmounts and focus moves
  to the scroll box. (default)
- **Overscan in rows**: VirtualList 6, VirtualTable 8. **Initial rows** rendered on the server and in
  the first client render: 20 (VirtualList `initialCount`), `ceil(height / rowHeight)` capped at 40
  for VirtualTable. Hydration matches because the first render reads no DOM.
- **ARIA**: VirtualList `role="list"` with `role="listitem"` rows carrying `aria-setsize` and
  `aria-posinset`; VirtualTable `aria-rowcount` on the `<table>` (rows + 1 header row) and
  `aria-rowindex` on every rendered `<tr>` (header 1, body index + 2). Spacer rows are `aria-hidden`.
- **VirtualTable reuses `Column<T>`** from `ResponsiveTable` (`primary`/`secondary` are ignored) and the
  `Table`, `TableWrap`, `Th`, `Td`, `Tr` primitives, so the look is identical.
- **VirtualTable zebra by index parity**, not `nth-child` (spacer rows would flip the stripes).
- **TreeView renders nested DOM** (`ul role="tree"` > `li role="treeitem"` > `ul role="group"`), roving
  `tabIndex` on the `li`, each item named by `aria-labelledby` pointing at its label span (so the name
  never includes the children). Disabled nodes stay focusable and expandable but cannot be selected or
  activated (WAI-ARIA APG). (default)
- **TreeView click**: a click on a row focuses, selects and activates it, and toggles a parent when
  `toggleOnSelect` (default true); the chevron only toggles. Enter = select + activate (+ toggle with
  `toggleOnSelect`), Space = select only. Arrows move focus without selecting (selection does not follow
  focus). (default)
- **TreeView node labels are strings** (`label: string`) so typeahead works; icons and counts go in
  `icon` and `trailing`. (default)
- **ContextMenu is built on the public `DropdownMenu`**, controlled, with a zero-size fixed `<span>` at
  the pointer as its trigger. That reuses the menu role, arrow keys, typeahead, MenuContext close, the
  phone sheet, the overlay stack (Escape order) and outside-press dismissal without touching
  overlay internals. Its only overlay import is `DropdownMenu` (and the `PopoverCloseReason` type).
- **ContextMenu defaults to `sheetBelow="sm"`** (bottom sheet with 48px rows under 640px), since a
  long-press menu at a fingertip is hard to use on a 360px screen. (default)
- **ContextMenu leaves the browser's menu alone** on `input`, `textarea`, `select` and
  `[contenteditable]` targets and on Shift+right-click, so copy/paste stays available. (default)
- **Long press = 500ms, cancelled by 10px of movement**; a long press that opened the menu swallows
  the click that follows (within 800ms) and the native `contextmenu` that Android fires (within 1000ms).
- **HoverCard positions with `place()` from overlay.tsx**, the lowest-level positioning helper (a pure
  function), exported with `@internal` by this spec. Its own small hook copies the update loop of
  `useAnchoredPosition` (resize, scroll, ResizeObserver). It imports nothing else from overlay.tsx.
- **HoverCard delays 500ms open / 300ms close; one card open at a time** through
  `shared('hoverCard', ...)`; z-index `var(--nish-z-tooltip, 100)`; default width 320px, never wider
  than the viewport minus 16px; trigger gets `aria-describedby` while open. (default)
- **New strings** (owned by T4): `contextMenu` ("Actions") and `sortAnnounce` (VirtualTable's live
  sort message). Inserted right after the `back` key, away from where other sessions append.
- **Size budgets** are each new import's measured gzip size rounded up to the next 0.5 KB, plus 0.5 KB,
  and must stay at or under the ceilings in "Performance". `everything from .` is re-measured and set
  the same way (it grows by about 8 KB; the 100 KB 2.0 target predates these components).
- **Version**: this is a minor (adds only). The orchestrator cuts one batched ui release.
- **trackers adoption** is in this spec because the ui-component process replaces local copies once the
  shared component ships; it is the last wave and waits for the batched release. (default)

## Current state

Baseline: ui `origin/master` at `b5be8bc` (2.0.2). Sizes measured on 2026-11-05 with the
`tools/size-check.mjs` method from a fresh `npm run build`: `everything from .` 117.06 KB (budget
117.5), `cn` 8.80, `DropdownMenu` 17.84, `DropdownMenu,MenuItem,MenuLabel,MenuSeparator,useNishStrings`
18.44, `TableWrap,Table,Th,Td,Tr,SkeletonRows,EmptyState,ErrorState` 13.26, `ResponsiveTable` 17.48,
`Tooltip` 12.66, `Popover` 12.73, `cn,useNishConfig,useNishStrings,Portal` 10.36.

- `src/components/overlay.tsx` (2,080 lines, `'use client'`): layer stack in `shared('overlay')`,
  `useDismiss` (Escape for the top layer, outside press), `useReturnFocus`, `layerHost(anchor, container)`
  = `anchor.closest('[data-nish-layer]') ?? container ?? document.body` (line 243).
  Positioning at lines 1084-1206: `type Side`, `type Align`, `interface AnchoredPosition {top,left,side,maxHeight}`,
  `GAP = 8`, `EDGE = 8`, `viewport()`, `clamp()`, **`function place(r: DOMRect, w, h, side, align, gap, rtl = false): AnchoredPosition`**
  (line 1120, not exported: flips to the opposite side when there is no room, clamps into the viewport,
  swaps start/end in RTL), `useAnchoredPosition(anchor, floating, open, side, align, gap)` (line 1155,
  layout effect, resize + capture scroll + ResizeObserver), `floatingStyle(pos, extra)` (line 1198,
  fixed position, hidden until measured). None of these are exported.
- `DropdownMenu` (line 1696): `trigger` element cloned with ref, `aria-haspopup`, `aria-expanded`,
  `aria-controls`; controlled `open` + `onOpenChange(open, reason?)`; `sheetBelow='sm'` renders a bottom
  `Drawer` under 640px (`PHONE_QUERY`); otherwise portals the `role="menu"` panel into
  `layerHost(triggerNode)` positioned by `useAnchoredPosition(trigger, menu, ..., side, align, 4)`; arrow
  keys, Home/End, typeahead, Tab closes; `useReturnFocus` calls `trigger.focus()` on close. Initial focus
  is the first item unless opened by a pointer click on the trigger. `MenuItem` closes the menu through
  the private `MenuContext` unless `onSelect` calls `preventDefault()`.
- `Tooltip` (line 1250) and `FloatingTip` (line 1401): the hover model to copy for HoverCard: native
  `mouseenter`/`mouseleave`/`focusin`/`focusout` listeners on the trigger, `touchTracker()` so a tap does
  not pin it open, `keyboardFocused()` so only keyboard focus opens it, a 100ms grace timer, Escape in a
  capture listener with `stopPropagation`, one open tip via `shared('tooltip')`.
- `src/components/overlay-classes.ts` (pure): `keyboardFocused(el)`, `touchTracker()`, `menuItemClass`,
  `MENU_ROW`, `PHONE_QUERY`.
- `src/components/table.tsx`: `TableWrap` (scroll box, `maxHeight`, `stickyHeader`, `stickyFirstColumn`,
  `minWidth`, `label`; focusable region while overflowing; merges `ref`), `Table` (`dense`, `zebra`,
  context for padding), `Th` (`sort`, `onSort`, `numeric`, `align`), `Td`, `Tr` (`tone`, `interactive`,
  `muted`). Recipes in `src/components/data-classes.ts` (`tableClass`, `tableInternals`, `sortRows`,
  `warnOnce(key, message)` which prefixes `nish-ui: ` and is silent in production, `mergeRefs`).
- `src/components/data.tsx`: `Column<T>` (key, header, cell, sortValue, numeric, primary, secondary,
  hideBelow, width), `Sort`, `ResponsiveTable` (internal sort through `sortRows`, a polite live region
  for the sort, `SkeletonRows rows={5} height={44}` while loading, `EmptyState title={t.nothingHere}`,
  `ErrorState`). `HIDE_BELOW` (line 130) is private.
- `src/components/client.ts`: `useIsClient`, `useIsoLayoutEffect`, `isRtl(el)`. `src/components/latest.ts`:
  `useLatest`. `src/runtime.ts`: `shared(key, init)`. `src/components/provider.tsx`: `useNishStrings`,
  `useNishConfig` (`portalContainer`). `src/components/display-classes.ts`: `FORCED_MARK`.
- `src/components/strings.ts`: `NishStrings` interface (`back` at line 12) and `DEFAULT_STRINGS`
  (`back: 'Back: '` at line 237). Existing keys used here: `menu`, `nothingHere`, `loadingNamed`.
- `src/index.ts`: named exports per module; the table block ends at line 131
  (`export type { TableWrapProps, ... } from './components/table';`).
- `site/components/index.ts`: one import per page and the `COMPONENT_DOCS` array; the docs nav and
  search are built from it (`site/main.tsx` line 63), so a registered page is reachable from the nav on
  every width (the phone nav is a drawer). Page shape: `site/components/types.ts` (`ComponentDoc`:
  id, name, exports, summary, importLine, controls, initial, render, code, stories, usage, guidelines,
  `framed` for portaled components, `api`). Example to copy: `site/components/popover.tsx`.
- Gates that fail on a new export without bookkeeping: `tests/ssr/cases.tsx` (every component export
  needs a case), `tools/docgen-coverage.test.ts` (every runtime export mentioned on a docs page; every
  prop declared in an exported component's props interface needs a JSDoc line, including `className`
  and `ref`; the allow-lists may only shrink), `tools/api-surface.test.mjs` (regenerate with
  `UPDATE_API_SURFACE=1` after a build), `tools/exports.test.mjs` (a root export from a `'use client'`
  module must be a component or hook; the directive must be the first line), `npm run size`.
- `tests/overlay/vite.config.ts` serves `tests/overlay/` as its root on port 5193, so a new
  `tests/overlay/tree-virtual.html` is served at `/tree-virtual.html` with no config change. Specs in
  `tests/overlay/**` also run in Firefox and WebKit in CI's `browsers` job.
- Unit tests run in happy-dom (`vitest.config.ts`, `tests/setup.ts` cleans up). happy-dom has no layout:
  `getBoundingClientRect` returns zeros and `clientHeight` is 0, so tests stub them (see
  `overlay.test.tsx` `stubMatchMedia` and its layout stubs). Coverage thresholds are global
  (statements 81, branches 79, functions 85, lines 84) and must not drop.
- trackers: `ui/src/components/flights/VirtualList.tsx` is a window-scrolled, measured list (`<ul>`
  with spacer `<li>`s, heights by key, 800px overscan). Its one use: `ui/src/pages/flights/TripPage.tsx`
  line 291, `<VirtualList className="grid gap-2 [&>li]:pb-0" label="Options" items={sorted} keyOf={(o) => o.key} estimate={96} render={renderRow} />`
  when `showAll && sorted.length > VIRTUAL_OVER` (100). trackers pins `"@nish/ui": "npm:nish-ui@2.0.2"`.

Traps found while reading:
- Git Bash heredocs eat backslashes in scripts; write files with the Write/Edit tools.
- `everything from .` is 117.06 KB against 117.5: any new root export fails `npm run size` until its
  budget is raised (T6).
- Reading `ref.current` during render fails lint (react-hooks `refs`); keep render inputs in state.
- A leftover `vite --config tests/overlay/vite.config.ts` keeps the worktree locked on Windows; stop it
  before `git worktree remove`.

## Design

### Data and types

`src/virtual-range.ts` (pure, no directive, no React import):

```ts
/** A half-open range of row indices: start included, end excluded. */
export interface VirtualRange { start: number; end: number }

/** Row tops: out[i] is the top of row i in px, out[count] the total height. `gap` px sits between
 *  rows, not after the last one. Negative sizes count as 0. */
export function buildOffsets(count: number, sizeOf: (index: number) => number, gap?: number): Float64Array;

/** The last index i with offsets[i] <= y, clamped to [0, count - 1]; -1 when count is 0. Binary search. */
export function indexAt(offsets: Float64Array, y: number): number;

/** Rows that intersect [top, bottom) (px from the list top), widened by `overscan` rows on each side.
 *  count 0: {0,0}. Window entirely above the list (bottom <= 0): {0, min(count, overscan)}.
 *  Entirely below (top >= total): {max(0, count - overscan), count}. */
export function visibleRange(offsets: Float64Array, top: number, bottom: number, overscan: number): VirtualRange;

/** Indices to render, ascending, no duplicates: the range plus `pinned` when it is a valid index
 *  outside the range (VirtualList). */
export function withPinned(range: VirtualRange, pinned: number | null, count: number): number[];

/** The range widened to include `index` when index is within `maxGap` rows of it; otherwise the range
 *  unchanged (VirtualTable keeps rows contiguous). */
export function extendRange(range: VirtualRange, index: number | null, maxGap: number, count: number): VirtualRange;

export type ScrollAlign = 'auto' | 'start' | 'center' | 'end';

/** Px to scroll (positive = down) so the row [itemTop, itemTop + itemSize) sits at `align` in the view
 *  [viewTop, viewBottom), all in the same coordinates. 'auto': 0 when the row is fully visible, else
 *  the smaller move that shows it ('start' if it is above, 'end' if below; a row taller than the view
 *  aligns its start). */
export function scrollDelta(itemTop: number, itemSize: number, viewTop: number, viewBottom: number, align: ScrollAlign): number;

/** True when both ranges have the same start and end. */
export function sameRange(a: VirtualRange, b: VirtualRange): boolean;
```

`src/components/virtual.tsx` (`'use client'`):

```ts
export interface ScrollToIndexOptions {
  /** Where the row lands: 'auto' (default) scrolls only as far as needed, or 'start', 'center', 'end'. */
  align?: ScrollAlign;
  /** 'auto' (default) jumps; 'smooth' animates. */
  behavior?: 'auto' | 'smooth';
}
export interface VirtualListHandle {
  /** Scrolls so row `index` (clamped into range) shows. */
  scrollToIndex(index: number, options?: ScrollToIndexOptions): void;
}

/** @internal Shared by VirtualList and VirtualTable; not exported from the package root. */
export interface VirtualRowsOptions {
  count: number;
  /** Fixed px, or an estimate per index (the real height replaces it when `measure`). */
  itemSize: number | ((index: number) => number);
  getKey: (index: number) => string | number;
  measure: boolean;
  gap: number;
  overscan: number;
  initialCount: number;
  /** The scrolling element; null follows the window. */
  scrollRef: RefObject<HTMLElement | null> | null;
  /** The element whose top edge is offset 0 (the list, or the tbody). */
  listRef: RefObject<HTMLElement | null>;
  /** Px at the top of the scroll box hidden under a sticky header. Default () => 0. */
  coverTop?: () => number;
  /** 'separate' (VirtualList): pinned row rendered on its own. 'contiguous' (VirtualTable): range
   *  extended to the pinned row when within 100 rows. */
  pinMode: 'separate' | 'contiguous';
  onRangeChange?: (start: number, end: number) => void;
}
export interface VirtualRows {
  /** Ascending indices to render. */
  indices: number[];
  range: VirtualRange;
  total: number;
  offsetOf: (index: number) => number;
  sizeOf: (index: number) => number;
  /** Ref callback for each rendered row when `measure` (reads `data-index`; returns a cleanup). */
  measureRef: (el: HTMLElement | null) => (() => void) | undefined;
  pin: (index: number | null) => void;
  scrollToIndex: (index: number, options?: ScrollToIndexOptions) => void;
}
export function useVirtualRows(options: VirtualRowsOptions): VirtualRows;

export interface VirtualListProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** How many rows there are. */
  count: number;
  /** Renders row `index`. Keep it stable (useCallback): only the rendered rows call it. */
  renderItem: (index: number) => ReactNode;
  /** A stable key for row `index` (the row's id). Default: the index. Measured heights are kept per key. */
  itemKey?: (index: number) => string | number;
  /** Row height in px: a number for rows that are all the same height, or a function returning each
   *  row's height (or estimate, with `measure`). Do not include `gap`. */
  itemSize: number | ((index: number) => number);
  /** Measures every rendered row and uses its real height (rows that wrap or expand). Default false. */
  measure?: boolean;
  /** Space between rows in px. Default 0. */
  gap?: number;
  /** Height of the list's own scroll box (px or any CSS length). Leave it out to scroll with the page. */
  height?: number | string;
  /** Rows rendered above and below the visible ones. Default 6. */
  overscan?: number;
  /** Rows rendered on the server and before the first measurement. Default 20. */
  initialCount?: number;
  /** Called with the rendered range (start included, end excluded) when it changes: load more when end nears count. */
  onRangeChange?: (start: number, end: number) => void;
  /** Shown instead of the list when count is 0. Default: nothing. */
  empty?: ReactNode;
  /** Receives { scrollToIndex }. */
  apiRef?: Ref<VirtualListHandle>;
  /** Accessible name of the list (role="list"). Give this or aria-labelledby. */
  'aria-label'?: string;
  /** Id of the element that names the list. */
  'aria-labelledby'?: string;
  /** Classes for the root (the scroll box when `height` is set). */
  className?: string;
  /** Classes for each row wrapper. */
  itemClassName?: string;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
}
```

`src/components/virtual-table.tsx` (`'use client'`):

```ts
export interface VirtualTableProps<T> extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** The data. */
  rows: T[];
  /** The columns, in order (the ResponsiveTable Column type; primary and secondary are ignored). Keep the array stable. */
  columns: Column<T>[];
  /** A stable key for a row. */
  rowKey: (row: T) => string;
  /** The accessible name of the table and its scroll box. */
  label: string;
  /** Height of the scroll box (px or CSS length). Default 480. The box shrinks to fit fewer rows. */
  height?: number | string;
  /** Row height in px. Default 41 (33 when dense): one line of text-sm with the cell padding and divider. */
  rowHeight?: number;
  /** Measures rendered rows and uses their real height (cells that wrap). rowHeight is then the estimate. */
  measure?: boolean;
  /** Tighter rows (6px vertical padding instead of 10px). */
  dense?: boolean;
  /** Striped rows (by row position, so they stay right while scrolling). */
  zebra?: boolean;
  /** The table's minimum width before it scrolls sideways. Default 640. */
  minWidth?: number | string;
  /** Pins the first column while the table scrolls sideways. */
  stickyFirstColumn?: boolean;
  /** The current sort, when you control it. */
  sort?: Sort;
  /** Called with the next sort. With sort or onSortChange given you sort the rows yourself; without
   *  them the table sorts by each column's sortValue. */
  onSortChange?: (sort: Sort) => void;
  /** Called with the row and its index on click, Enter or Space. Makes rows focusable with arrow-key navigation. */
  onRowClick?: (row: T, index: number) => void;
  /** A 3px edge at the start of a row: ok, warn or loss. Say the status in a cell too. */
  rowTone?: (row: T) => 'ok' | 'warn' | 'loss' | undefined;
  /** Shows skeleton rows instead of the data. */
  loading?: boolean;
  /** Shown when there are no rows. Default: the "nothingHere" string. */
  empty?: ReactNode;
  /** Shows an ErrorState instead of the data. */
  error?: { message: string; onRetry?: () => void } | null;
  /** Rows rendered above and below the visible ones. Default 8. */
  overscan?: number;
  /** Called with the rendered range when it changes. */
  onRangeChange?: (start: number, end: number) => void;
  /** Receives { scrollToIndex }. */
  apiRef?: Ref<VirtualListHandle>;
  /** Classes for the root. */
  className?: string;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
}
```

`src/components/tree-view-classes.ts` (pure; `import type { ReactNode } from 'react'` only):

```ts
export interface TreeNode {
  /** Unique in the whole tree; keys selection and expansion. */
  id: string;
  /** The row text (also what typing a letter jumps to). */
  label: string;
  /** Leading icon (16px reads best). */
  icon?: ReactNode;
  /** Right-aligned extra: a count or a badge. */
  trailing?: ReactNode;
  /** Child nodes. An empty array counts as a leaf. */
  children?: TreeNode[];
  /** Shown and focusable, but cannot be selected or activated. */
  disabled?: boolean;
}
export interface FlatTreeNode { node: TreeNode; level: number; parentId: string | null; posInSet: number; setSize: number }
/** Visible nodes in display order (children of expanded parents only). level starts at 1, posInSet at 1. */
export function visibleNodes(items: readonly TreeNode[], expanded: ReadonlySet<string>): FlatTreeNode[];
/** Map of node id to parent id (null for roots) over the whole tree. */
export function parentMap(items: readonly TreeNode[]): Map<string, string | null>;
/** Ids that appear more than once, in first-seen order. */
export function duplicateIds(items: readonly TreeNode[]): string[];
/** True when the node has at least one child. */
export function hasChildren(node: TreeNode): boolean;
/** Classes of one row. */
export function treeRowClass(options: { selected?: boolean; disabled?: boolean; className?: string }): string;
```

`src/components/tree-view.tsx` (`'use client'`, re-exports `TreeNode` type):

```ts
export interface TreeViewProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children' | 'className' | 'onSelect' | 'defaultValue'> {
  /** The root nodes. */
  items: TreeNode[];
  /** Ids of the open parents, when you control expansion. */
  expanded?: string[];
  /** Ids open on mount when uncontrolled. Default none. */
  defaultExpanded?: string[];
  /** Called with every open id after a node opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The selected id, when you control selection (null for none). */
  selected?: string | null;
  /** The id selected on mount when uncontrolled. Default none. */
  defaultSelected?: string | null;
  /** Called when a node is selected (click, Enter, Space). */
  onSelectedChange?: (id: string, node: TreeNode) => void;
  /** Called when a node is activated (click or Enter): navigate or open it here. */
  onActivate?: (node: TreeNode) => void;
  /** Whether nodes can be selected (aria-selected). Default true. false: activation only. */
  selectable?: boolean;
  /** A click or Enter on a parent also opens or closes it. Default true. false: only the chevron, the arrow keys and * do. */
  toggleOnSelect?: boolean;
  /** Accessible name of the tree. Give this or aria-labelledby. */
  'aria-label'?: string;
  /** Id of the element that names the tree. */
  'aria-labelledby'?: string;
  /** Classes for the tree (the ul). */
  className?: string;
  /** The tree element (role="tree"). */
  ref?: Ref<HTMLUListElement>;
}
```

`src/components/context-menu.tsx` (`'use client'`):

```ts
export interface ContextMenuProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
  /** The area that opens the menu: right-click, a long press on touch screens, or Shift+F10 or the Menu key while focus is inside. */
  children: ReactNode;
  /** The menu rows (MenuItem, MenuLabel, MenuSeparator), or a function of the element that was pressed,
   *  for one menu over many rows (read the row from target.closest('[data-id]')). Returning null keeps the menu closed. */
  menu: ReactNode | ((target: Element) => ReactNode);
  /** Controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Called when the menu opens or closes. When it closed itself the reason is 'escape', 'outside' or 'tab'. */
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  /** Turns the custom menu off, so the browser's own menu shows. */
  disabled?: boolean;
  /** Accessible name of the menu. Default "Actions" (the provider's contextMenu string). */
  menuLabel?: string;
  /** 'sm' (default): under 640px the menu opens as a bottom sheet with 48px rows. false: always a floating menu. */
  sheetBelow?: 'sm' | false;
  /** Title of the bottom sheet. Default "Menu" (the provider's menu string). */
  sheetTitle?: string;
  /** Milliseconds a finger rests before the menu opens. Default 500. */
  longPressMs?: number;
  /** Classes for the menu panel. */
  menuClassName?: string;
  /** Classes for the area. */
  className?: string;
  /** The area element. */
  ref?: Ref<HTMLDivElement>;
}
```

`src/components/hover-card.tsx` (`'use client'`):

```ts
export interface HoverCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'content' | 'className'> {
  /** The trigger: one element, usually a link. It keeps its own click and keyboard behavior. */
  children: ReactElement;
  /** What the card shows: a preview of where the link goes. Touch screens never open it, so show the same thing there. */
  content: ReactNode;
  /** Preferred side; flips when there is no room. Default bottom. */
  side?: 'top' | 'bottom';
  /** Which edge of the trigger the card lines up with (mirrored in right-to-left layouts). Default center. */
  align?: 'start' | 'center' | 'end';
  /** Milliseconds the pointer rests on the trigger (or keyboard focus stays) before the card opens. Default 500. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves the trigger and the card before it closes. Default 300. */
  closeDelay?: number;
  /** Controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Open on mount when uncontrolled (previews, tests). */
  defaultOpen?: boolean;
  /** Called when the card opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Card width: px or any CSS length. Default 320, never wider than the screen minus 16px. */
  width?: number | string;
  /** Classes for the card. */
  className?: string;
  /** The card element. */
  ref?: Ref<HTMLDivElement>;
}
```

New strings (`src/components/strings.ts`, T4):

```ts
/** ContextMenu: the menu's accessible name when no menuLabel is given. */
contextMenu: string;                                   // 'Actions'
/** VirtualTable: live-region message after the sort changes (dir null when cleared). */
sortAnnounce: (header: string, dir: 'asc' | 'desc' | null) => string;
// (header, dir) => (dir ? `Sorted by ${header}, ${dir === 'asc' ? 'ascending' : 'descending'}` : 'Sorting cleared')
```

### UI

All five follow the 2.0 contract: `'use client'` first line, `ref` as a prop, `...rest` on the root,
strings from `useNishStrings()`, logical utilities, z-index tokens, `data-state`, forced-colors
utilities, dev warnings through `warnOnce`, no DOM reads in render.

- **VirtualList.** Self mode (`height` set): root `div` with `style={{ height, overflowY: 'auto', overflowAnchor: 'none', overscrollBehavior: 'contain' }}`,
  `tabIndex={count > 0 ? 0 : undefined}`, classes `relative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent`.
  Window mode: root `div` with no overflow. Inside the root: `div role="list"` with the aria-label,
  `style={{ position: 'relative', height: total }}`. Each rendered row:
  `div role="listitem" data-index={i} aria-posinset={i + 1} aria-setsize={count}` with
  `style={{ position: 'absolute', top: 0, insetInlineStart: 0, width: '100%', transform: \`translateY(${offsetOf(i)}px)\`, height: measure ? undefined : sizeOf(i) }}`
  and `className={itemClassName}`, ref `measureRef` when `measure`. count 0 with `empty`: render
  `empty` inside the root instead of the list. Light and dark: the list adds no colors. 360px: rows
  take the full width; nothing scrolls sideways.
- **VirtualTable.** `loading`: `<SkeletonRows rows={5} height={44} label={t.loadingNamed(label)} />`.
  `error`: `<ErrorState message onRetry />`. No rows: `empty ?? <EmptyState title={t.nothingHere} />`.
  Otherwise: `<TableWrap ref={scrollRef} maxHeight={height} stickyHeader minWidth stickyFirstColumn label>` >
  `<Table dense aria-label={label} aria-rowcount={rows.length + 1} className="table-fixed">` >
  `<thead ref={headRef}><tr aria-rowindex={1}>` with one `Th` per column (`numeric`, `sort`,
  `onSort` when `sortValue`, `HIDE_BELOW` class, `style={{ width: c.width }}`) > `<tbody ref={bodyRef}>`
  with a top spacer, the rows, a bottom spacer. Spacer:
  `<tr aria-hidden="true" data-virtual-spacer=""><td colSpan={columns.length} style={{ height, padding: 0, border: 0 }} /></tr>`,
  rendered only when its height is above 0. Row: `Tr` with `tone`, `interactive={!!onRowClick}`,
  `data-index`, `aria-rowindex={i + 2}`, zebra class `bg-th-elevated/50` on odd indices when `zebra`,
  and with `onRowClick` also `tabIndex` (roving) and
  `focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-th-accent forced-colors:focus-visible:outline-[Highlight]`.
  Cells: `Td` with `numeric` and the `HIDE_BELOW` class. Then a `div role="status" aria-live="polite" className="sr-only"`
  with the sort announcement. 360px: the table keeps `minWidth` (640) and scrolls sideways inside its
  box (no page scroll); `stickyFirstColumn` keeps the name visible. 840px and desktop: full width.
- **TreeView.** `<ul role="tree" aria-label className="grid gap-px text-sm">`. Each node:
  `<li role="treeitem" aria-labelledby={labelId} aria-level aria-setsize aria-posinset aria-expanded={parent ? open : undefined} aria-selected={selectable ? isSelected : undefined} aria-disabled={disabled || undefined} data-state={parent ? (open ? 'open' : 'closed') : undefined} data-disabled={disabled ? '' : undefined} tabIndex={isFocusTarget ? 0 : -1}>`
  with classes `outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-th-accent`.
  Inside: the row `div` (`treeRowClass`, `style={{ paddingInlineStart: \`calc(${level - 1} * 1.25rem + 0.25rem)\` }}`),
  then, for an open parent, `<ul role="group" className="grid gap-px">` with the children. Row content:
  a toggle `span` (`aria-hidden`, `data-tree-toggle`, `inline-flex w-6 shrink-0 self-stretch items-center justify-center text-th-hi3 pointer-coarse:w-11`)
  holding the chevron for parents and nothing for leaves (same width, so labels line up); the icon in
  `inline-flex shrink-0 text-th-hi3` (`aria-hidden`); the label `span id={labelId} className="min-w-0 flex-1 truncate"`;
  the trailing `span className="ms-auto shrink-0 text-xs text-th-hi3"`. Chevron: 14px SVG path
  `m9 18 6-6-6-6`, classes `transition-transform motion-reduce:transition-none rtl:-scale-x-100` plus
  `rotate-90 rtl:-rotate-90` when open. `treeRowClass`:
  `flex min-h-8 w-full cursor-pointer select-none items-center gap-1.5 rounded-md pe-2 text-start transition-colors pointer-coarse:min-h-11`
  + selected `bg-th-accent-soft font-medium text-th-accent` + `FORCED_MARK`; else not disabled
  `text-th-hi2 hover:bg-th-overlay hover:text-th-hi`; disabled `cursor-default text-th-ghost forced-colors:text-[GrayText]`.
  360px: labels truncate; each level indents 20px. Touch: rows and the chevron target are 44px.
- **ContextMenu.** Root `div` (`...rest`, `className`, `data-state`, `[-webkit-touch-callout:none]`)
  with the children and, as its last child, the anchor:
  `<span aria-hidden="true" data-nish-context-anchor="" style={{ position: 'fixed', left: x, top: y, width: 0, height: 0, pointerEvents: 'none' }} />`
  passed as `trigger` to `<DropdownMenu open onOpenChange aria-label={menuLabel ?? t.contextMenu} sheetBelow sheetTitle className={menuClassName} align="start" side="bottom">`.
  The menu looks exactly like DropdownMenu (floating panel, `min-w-44`, max 24rem tall) and on phones
  the bottom sheet titled "Menu". Opened from code before any press (`open` true first), x/y is the
  root's start-top corner plus 8px each way.
- **HoverCard.** Trigger wrapper `<span className="inline-flex" data-state>` around the cloned child
  (child gets `aria-describedby` = card id while open, merged with its own). Card, portaled into
  `anchor.closest('[data-nish-layer]') ?? config.portalContainer ?? document.body` while open on the client:
  `<div id role-less data-side data-state="open" style={{ position: 'fixed', top, left, visibility: pos ? undefined : 'hidden', width, maxWidth: 'calc(100vw - 1rem)', maxHeight: pos?.maxHeight, zIndex: 'var(--nish-z-tooltip, 100)' }}>`
  classes `overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop animate-[nish-fade-in_120ms_ease-out] motion-reduce:animate-none`.

Docs pages (exact copy in the tasks) are reachable from the docs nav (`COMPONENT_DOCS` feeds the nav
drawer on phones and the sidebar on desktop) at 360, 840 and desktop, light and dark.

### Security

Not affected beyond normal rendering: no network, no storage, no HTML strings. `renderItem`,
`menu`, `content` and labels are React nodes (escaped). No `dangerouslySetInnerHTML`, no `eval`, no
inline event attributes; the components keep working under the strict CSP spec (styles are set
through React `style` objects, which CSP `style-src` allows for CSSOM).

### Performance

- VirtualList/VirtualTable: one `scroll` listener (passive) per list, coalesced to one range update
  per animation frame; `setRange` only when the range changes; offsets rebuilt only when count, sizes
  or measured heights change (one rebuild per frame of ResizeObserver batches). 100,000 rows must
  scroll without dropped range updates; 10,000 rows keep under 60 row elements mounted (VirtualList,
  320px box, 40px rows: 8 visible + 12 overscan = 20).
- TreeView renders only open branches; a tree of 2,000 visible nodes renders under 50ms in Chromium.
  `visibleNodes` is memoized on items and the expanded set.
- Size ceilings (gzip KB, the budget may not be set above these): VirtualList 12, VirtualTable 16.5,
  TreeView 12.5, ContextMenu 20, HoverCard 13, `everything from .` 128.

### Ops

Not affected: no env vars, ports, runners or scheduled jobs. The docs site ships with the release
tag (`site-dist/` on the tag), so design.nish.software shows these pages after the orchestrator's
batched release reaches hosting.

## Tasks

Every ui task works in `C:\Code\ui-tree-virtual` (dependencies installed with `npm ci`; run
`npm run build` once before running `tools/*` or size checks). Implementers do not commit. Never edit
any other checkout under `C:\Code`.

### T1 Virtual range math, useVirtualRows and VirtualList

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/virtual-range.ts` (new), `src/virtual-range.test.ts` (new), `src/components/virtual.tsx`
  (new), `src/components/virtual.test.tsx` (new), `site/components/virtual-list.tsx` (new)
- Reads: `src/components/client.ts`, `src/components/latest.ts`, `src/components/data-classes.ts`
  (`warnOnce`, `mergeRefs`), `src/cn.ts`, `site/components/popover.tsx`, `site/components/types.ts`
- Depends on: none
- Change:
  1. `src/virtual-range.ts`: the functions and types in "Data and types", header comment
     `// Pure math of VirtualList and VirtualTable: row offsets, the visible range and scroll targets. No directive, no React.`
     `indexAt`: binary search over `offsets[0..count-1]`. `visibleRange`: `first = indexAt(offsets, max(0, top))`,
     `last = indexAt(offsets, max(0, min(total, bottom) - 0.5))`, `start = max(0, first - overscan)`,
     `end = min(count, last + 1 + overscan)`, with the edge rules in the JSDoc. `scrollDelta`:
     `start` → `itemTop - viewTop`; `end` → `itemTop + itemSize - viewBottom`; `center` →
     `itemTop + itemSize / 2 - (viewTop + viewBottom) / 2`; `auto` → 0 if `itemTop >= viewTop && itemTop + itemSize <= viewBottom`,
     else `start` when `itemTop < viewTop || itemSize > viewBottom - viewTop`, else `end`.
  2. `src/components/virtual.tsx` starts with `'use client';`. `useVirtualRows(options)`:
     - State: `range` (`useState<VirtualRange>(() => ({ start: 0, end: Math.min(count, initialCount) }))`),
       `measured` (`useState<ReadonlyMap<string | number, number>>(() => new Map())`), `pinned`
       (`useState<number | null>(null)`). No refs read during render.
     - `offsets = useMemo(() => buildOffsets(count, (i) => measured.get(getKey(i)) ?? (typeof itemSize === 'number' ? itemSize : itemSize(i)), gap), [count, itemSize, getKey, gap, measured])`.
       `total = offsets[count]`, `offsetOf(i) = offsets[i]`, `sizeOf(i) = offsets[i + 1] - offsets[i] - (i < count - 1 ? gap : 0)`.
     - Latest values for callbacks through `useLatest({ offsets, range, getKey, coverTop, onRangeChange, count })`.
     - `update()` (inside a layout effect, not during render): `list = listRef.current`; return if null.
       `rect = list.getBoundingClientRect()`. Self: `s = scrollRef.current`, `sr = s.getBoundingClientRect()`,
       `viewTop = sr.top + (coverTop?.() ?? 0)`, `viewBottom = sr.top + s.clientHeight`. Window:
       `viewTop = coverTop?.() ?? 0`, `viewBottom = window.innerHeight`. Then
       `next = visibleRange(offsets, viewTop - rect.top, viewBottom - rect.top, overscan)`, clamped to
       `count`; `setRange(prev => sameRange(prev, next) ? prev : next)`.
     - `useIsoLayoutEffect(update, [offsets, overscan, count])` so the right rows render before paint.
     - Listeners effect: a rAF-coalesced `onScroll` (`requestAnimationFrame` id kept in the effect closure,
       cancelled on cleanup) on `scrollRef.current` (self, `{ passive: true }`) or `window` (window mode,
       `{ passive: true }` plus `resize`); a `ResizeObserver` (when defined) on the scroller and the list
       calling the same coalesced update.
     - `useEffect(() => onRangeChange?.(range.start, range.end), [range.start, range.end])` through the latest ref.
     - Measuring (`measure` true): one `ResizeObserver` created in an effect and kept in state
       (`useState<ResizeObserver | null>`), disconnected on cleanup. `measureRef = useCallback((el) => { if (!el || !ro) return; ro.observe(el); return () => ro.unobserve(el); }, [ro])`.
       The observer callback: for each entry, `index = Number(el.dataset.index)`; skip NaN;
       `size = entry.borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height`; skip when
       `size <= 0`; `key = getKey(index)` (latest); collect changes where `measured.get(key) !== size`.
       Sum `delta` of `(size - oldSize)` for changed rows whose bottom (`offsetOf(index) + oldSize`) is at
       or above the current view top in list coordinates (rows fully above the viewport), where
       `oldSize` is the latest `sizeOf(index)`. Then `setMeasured(prev => new Map with the changes)`
       and, when `delta !== 0`, `scrollRef ? scroller.scrollTop += delta : window.scrollBy(0, delta)`.
     - `indices = useMemo(() => pinMode === 'separate' ? withPinned(range, pinned, count) : (() => { const r = extendRange(range, pinned, 100, count); return Array.from({ length: r.end - r.start }, (_, k) => r.start + k); })(), [...])`.
     - `scrollToIndex(index, { align = 'auto', behavior = 'auto' } = {})`: clamp `index` to
       `[0, count - 1]` (no-op when count is 0); compute the view as in `update()`; `itemTop = list.getBoundingClientRect().top + offsetOf(index)`;
       `d = scrollDelta(itemTop, sizeOf(index), viewTop, viewBottom, align)`; when `d !== 0`,
       `scroller.scrollBy({ top: d, behavior })` or `window.scrollBy({ top: d, behavior })`. With
       `measure` and `behavior === 'auto'`, repeat the computation once on the next animation frame
       (estimates may have been replaced) and scroll the remaining delta when `Math.abs(d) > 1`.
     - Count shrink: when `pinned >= count`, set pinned to null in an effect.
  3. `VirtualList(props)`: defaults `measure = false`, `gap = 0`, `overscan = 6`, `initialCount = 20`,
     `itemKey` default `(i) => i` (module-level `const byIndex = (i: number) => i`, so it is stable).
     Root `ref` merged with an internal `rootRef` (`mergeRefs`); `listRef` on the `role="list"` div.
     `scrollRef` is `rootRef` when `height !== undefined`, else null. Focus pinning: `onFocus` (React,
     bubbles) on the list: `const row = (e.target as Element).closest('[data-index]')`; when it is inside
     the list, `pin(Number(row.dataset.index))`. `onBlur`: when `e.relatedTarget` is not inside the
     list, `pin(null)`. `useImperativeHandle(apiRef, () => ({ scrollToIndex }), [scrollToIndex])`.
     Dev warnings (`warnOnce`): `typeof itemSize === 'number' && !(itemSize > 0)` →
     key `virtual-size`, message `VirtualList: itemSize must be a positive number of pixels.`;
     neither `aria-label` nor `aria-labelledby` → key `virtual-label`, message
     `VirtualList: give the list an aria-label or aria-labelledby.` (both from an effect, not render).
     Markup and styles exactly as in "UI".
  4. `site/components/virtual-list.tsx` exporting `virtualList: ComponentDoc`. Import the component
     from `'../../src/components/virtual'` and shared pieces from `'../../src'`. Deterministic data:
     `const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'AVGO'];`
     row i: symbol `SYMBOLS[i % 10]`, quantity `((i * 37) % 500) + 1`, price `(50 + ((i * 7919) % 45000) / 100).toFixed(2)`.
     A row: `<div className="flex h-11 items-center justify-between gap-3 border-b border-th-line px-3 text-sm"><span className="font-medium text-th-hi">{symbol}</span><span className="tabular-nums text-th-hi2">{qty} @ {price}</span></div>`.
     - `id: 'virtual-list'`, `name: 'VirtualList'`, `exports: ['VirtualList']`,
       `api: { functions: [], interfaces: ['VirtualListHandle', 'ScrollToIndexOptions'] }`,
       `importLine: "import { VirtualList } from '@nish/ui';"`.
     - `summary`: `A long list that renders only the rows near the screen, so 10,000 rows scroll like 30. Fixed or measured row heights, its own scroll box or the page, the focused row stays mounted, and scrollToIndex jumps to any row.`
     - `controls`: count (number 0-100000), itemSize (number 32-80), overscan (number 0-20), measure (boolean);
       `initial: { count: 10000, itemSize: 44, overscan: 6, measure: false }`; `render` shows the list
       with `height={360}` and `aria-label="Positions"`.
     - `code(a)`: the JSX for the current args, e.g.
       `<VirtualList\n  aria-label="Positions"\n  count={10000}\n  itemSize={44}\n  height={360}\n  renderItem={(i) => <PositionRow row={rows[i]} />}\n/>` (add `overscan`/`measure` lines only when not default).
     - `stories`: `fixed` "10,000 fixed rows"; `measured` "Measured rows that wrap" (rows with 1-3 lines
       of note text by `i % 3`, `measure`, `itemSize={56}`, `gap={8}`, note `itemSize is the estimate; each rendered row is measured.`);
       `jump` "Jump to a row" (a Button "Go to row 5,000" calling `apiRef.current?.scrollToIndex(4999, { align: 'center' })`);
       `empty` "Empty" (`count={0}` with `empty={<EmptyState title="No positions" />}`).
     - `usage`:
       ```
       import { useCallback } from 'react';
       import { VirtualList } from '@nish/ui';

       export function Positions({ rows }: { rows: Position[] }) {
         const renderItem = useCallback((i: number) => <PositionRow row={rows[i]} />, [rows]);
         const itemKey = useCallback((i: number) => rows[i].id, [rows]);
         return <VirtualList aria-label="Positions" count={rows.length} itemKey={itemKey} itemSize={44} renderItem={renderItem} />;
       }
       ```
     - `guidelines` (exact):
       - `Reach for it past a few hundred rows. Below that, a plain list is simpler and browser Find sees every row.`
       - `Set itemSize to the real row height, without the gap (use gap for spacing). Rows that wrap or expand need measure; itemSize is then the estimate.`
       - `Leave out height to scroll with the page, which is best on phones. Set it for a box inside a card or a sidebar.`
       - `Rows are divs with role="listitem": render a div row inside, not ListRow (an li).`
       - `Keep renderItem, itemKey and an itemSize function stable with useCallback; a new function rebuilds every offset.`
       - `Rows off screen are not in the page: Find, the Tab order and screen readers reach the rendered rows only. Offer search or filters for long lists. Each row reports its position (aria-posinset of aria-setsize).`
       - `Use onRangeChange to load the next page when the range end nears count.`
- Edge cases: count 0 (no rows, `empty` shown, no errors); count shrinking below the range (range clamped
  on the next update, pinned cleared); `itemSize` function returning 0 or negative (counts as 0);
  `height` as a CSS string ('60vh'); window mode with the list below the fold (overscan rows at the top
  stay mounted); server render and first client render identical (rows 0..19 at their offsets);
  `ResizeObserver` undefined (no measuring, no crash); RTL (nothing mirrors; `insetInlineStart` keeps
  rows aligned).
- Acceptance:
  - `npx vitest run src/virtual-range.test.ts src/components/virtual.test.tsx` passes.
  - `src/virtual-range.test.ts` covers: `buildOffsets` with fixed sizes, a size function, a gap (no gap after the last row), count 0; `indexAt` at 0, inside a row, on a boundary, past the end, count 0; `visibleRange` mid-list with overscan, at both ends, window above and below the list, count 0; `withPinned` inside and outside the range, invalid index; `extendRange` within and beyond maxGap, null; `scrollDelta` for every align, including a row taller than the view; `sameRange`.
  - `src/components/virtual.test.tsx` (stub `getBoundingClientRect` and `clientHeight` on the root and list via `Object.defineProperty`, stub `window.innerHeight`) covers: ref and className on the root, rest passthrough (`data-testid`, `id`), role list/listitem with `aria-setsize`/`aria-posinset`, fixed rows render only the range (count 10,000, 320px box, 40px rows: at most 20 rows), scrolling (set `scrollTop`, fire `scroll`, advance rAF with fake timers) changes the rendered rows, `scrollToIndex` calls `scrollBy` with the expected delta for each align, focus pinning keeps a focused row mounted after scrolling away, `onRangeChange` fires, window mode reads `window.innerHeight`, `renderToString` output matches the first client render (hydrate without warnings), the two dev warnings.
  - `npm run typecheck` and `npx eslint src/virtual-range.ts src/components/virtual.tsx site/components/virtual-list.tsx` pass.

### T2 VirtualTable

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/components/virtual-table.tsx` (new), `src/components/virtual-table.test.tsx` (new),
  `site/components/virtual-table.tsx` (new)
- Reads: `src/components/virtual.tsx`, `src/virtual-range.ts`, `src/components/table.tsx`,
  `src/components/data.tsx` (`Column`, `Sort`, `ResponsiveTable` for the sort logic to mirror),
  `src/components/data-classes.ts` (`sortRows`, `mergeRefs`), `src/components/feedback.tsx`,
  `src/components/strings.ts`, `site/components/responsive-table.tsx`
- Depends on: T1 (useVirtualRows), T4 (`sortAnnounce` string)
- Change:
  1. `'use client'`. Imports: `useVirtualRows`, `VirtualListHandle` (type) from `./virtual`;
     `import type { Column, Sort } from './data'`; `Table, TableWrap, Td, Th, Tr` from `./table`;
     `sortRows, mergeRefs` from `./data-classes`; `SkeletonRows, EmptyState, ErrorState` from `./feedback`;
     `useNishStrings` from `./provider`; `cn` from `../cn`. Local
     `const HIDE_BELOW = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' } as const;`
  2. `VirtualTable<T>(props)`: defaults `height = 480`, `rowHeight = dense ? 33 : 41`, `measure = false`,
     `minWidth = 640`, `overscan = 8`. Sorting exactly like ResponsiveTable: `innerSort` state, `external = sort !== undefined || onSortChange !== undefined`,
     `sorted = useMemo(...)` keyed on `[rows, sortKey, sortDir, external]` using `sortRows`, `toggle(key)`
     cycles asc → desc → asc, `changeSort` sets the announcement to `t.sortAnnounce(header, dir)`.
  3. Virtual rows: `useVirtualRows({ count: sorted.length, itemSize: rowHeight, getKey: (i) => rowKey(sorted[i]!)` (memoized on `[sorted, rowKey]`),
     `measure, gap: 0, overscan, initialCount: Math.min(40, Math.ceil((typeof height === 'number' ? height : 480) / rowHeight)), scrollRef, listRef: bodyRef, coverTop: () => headRef.current?.offsetHeight ?? 0, pinMode: 'contiguous', onRangeChange })`.
     `first = indices[0] ?? 0`, `last = indices[indices.length - 1] ?? -1`; top spacer height
     `offsetOf(first)` when there are indices, bottom spacer `total - (last >= 0 ? offsetOf(last) + sizeOf(last) : 0)`.
  4. Roving focus (only with `onRowClick`): `focusIndex` state (default 0); the row with
     `tabIndex={0}` is `focusIndex` when rendered, else `indices[0]`; all others `-1`. `pin(focusIndex)`
     whenever focus is inside the tbody (onFocus/onBlur on the tbody as in T1). Keys on a row (ignored
     when `e.target !== e.currentTarget`, so buttons inside cells keep their keys): ArrowDown +1,
     ArrowUp -1, PageDown/PageUp ± `Math.max(1, Math.floor(((scroller.clientHeight - head.offsetHeight) || rowHeight) / rowHeight))`,
     Home 0, End `count - 1` (clamped), each with `preventDefault()`, then `setFocusIndex(next)`,
     `scrollToIndex(next)`, and focus the row after the commit (a `pendingFocus` ref read in a layout
     effect: `bodyRef.current?.querySelector<HTMLElement>(\`tr[data-index="${next}"]\`)?.focus({ preventScroll: true })`).
     Enter or Space: `preventDefault()`, `onRowClick(row, i)`. Click on a row (not from an
     interactive child: skip when `(e.target as Element).closest('a,button,input,select,textarea,[role=button]')` is inside the row):
     `setFocusIndex(i)`, `onRowClick(row, i)`. After a render where the focused row was removed (layout
     effect: `document.activeElement === document.body` and focus was inside the tbody before),
     focus the scroll box with `{ preventScroll: true }`.
  5. Root: `<div {...rest} ref={ref} className={className}>` holding the state views or the TableWrap and
     the live region (markup in "UI"). Rows measured with `measureRef` when `measure`.
  6. `site/components/virtual-table.tsx` exporting `virtualTable: ComponentDoc`; import from
     `'../../src/components/virtual-table'` and `'../../src'`. Data: 5,000 trades from the T1 generator plus
     side `i % 3 === 0 ? 'Sell' : 'Buy'` and a tone `i % 17 === 0 ? 'loss' : undefined`. Columns:
     Symbol (`width: '8rem'`, sortValue symbol), Side (`width: '6rem'`), Qty (numeric, sortValue),
     Price (numeric, sortValue), Note (`hideBelow: 'md'`, text `Filled at market` / `Partial fill, rest cancelled after 30 minutes` by `i % 4`).
     - `id: 'virtual-table'`, `name: 'VirtualTable'`, `exports: ['VirtualTable']`, `importLine: "import { VirtualTable } from '@nish/ui';"`.
     - `summary`: `A table of thousands of rows that renders only what is on screen, with the same columns as ResponsiveTable: a sticky header, sorting, row tones, a pinned first column, and arrow-key navigation when rows are clickable.`
     - `controls`: rows (number 0-50000), dense (boolean), zebra (boolean), stickyFirstColumn (boolean);
       `initial: { rows: 5000, dense: false, zebra: false, stickyFirstColumn: true }`; render with `height={400}` and `label="Trades"`.
     - `stories`: `default` "5,000 trades"; `dense` "Dense and striped"; `clickable` "Clickable rows" (`onRowClick` sets a line under the table: `Opened row {n}`, note `Arrow keys, Page Up/Down, Home and End move between rows; Enter opens.`);
       `measured` "Wrapping notes, measured" (`measure`, Note column always shown); `loading` "Loading"; `empty` "No rows".
     - `usage`: a `Trades` component with a module-level `const columns: Column<Trade>[] = [...]` and
       `<VirtualTable label="Trades" rows={trades} columns={columns} rowKey={(t) => t.id} height={480} stickyFirstColumn onRowClick={(t) => navigate(\`/trades/${t.id}\`)} />`.
     - `guidelines` (exact):
       - `Under a few hundred rows use ResponsiveTable, which turns into cards on phones. VirtualTable stays a table at every width and scrolls sideways inside its box on a phone; pin the first column with stickyFirstColumn.`
       - `Columns keep their width while rows come and go (fixed table layout): give narrow and wide columns a width.`
       - `Rows are 41px (33px dense). Set rowHeight when your cells are taller, or measure when they wrap.`
       - `With onRowClick, one row is in the Tab order: arrow keys, Page Up, Page Down, Home and End move between rows, and Enter or Space opens one.`
       - `Screen readers hear the full row count (aria-rowcount) and each row's position (aria-rowindex), even though only nearby rows are in the page.`
- Edge cases: rows empty (EmptyState), loading and error win over rows; sort controlled vs internal;
  `columns` changing identity does not re-sort; `rowKey` duplicates (React key warning only);
  focusIndex beyond count after rows shrink (clamp to `count - 1` in an effect); a row 150 rows away
  from the range while focused (unmounts, focus moves to the scroll box); `hideBelow` columns hidden in
  header and cells alike; RTL (`Tr` tone edge mirrors already; keys are vertical, nothing to swap).
- Acceptance:
  - `npx vitest run src/components/virtual-table.test.tsx` passes, covering: ref, className and rest on the root; `aria-rowcount` = rows + 1 and `aria-rowindex` on header and rows; only the range rendered (2,000 rows, 400px box, 41px rows) with spacer rows `aria-hidden`; internal sort by header click (order changes, `aria-sort`, announcement text from a NishProvider `strings.sortAnnounce` override); controlled sort calls `onSortChange` without re-sorting; roving focus: ArrowDown, End, Home, PageDown move `tabIndex=0` and call `scrollBy`; Enter and click call `onRowClick(row, index)`; a click on a button inside a cell does not; zebra by index; loading, empty and error views; `renderToString` works with no DOM globals used in render.
  - `npm run typecheck` and `npx eslint src/components/virtual-table.tsx site/components/virtual-table.tsx` pass.

### T3 TreeView

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/components/tree-view-classes.ts` (new), `src/components/tree-view.tsx` (new),
  `src/components/tree-view.test.tsx` (new), `site/components/tree-view.tsx` (new)
- Reads: `src/components/client.ts` (`isRtl`), `src/components/display-classes.ts` (`FORCED_MARK`),
  `src/components/data-classes.ts` (`warnOnce`), `src/cn.ts`, `src/components/accordion.tsx` (controlled/uncontrolled pattern)
- Depends on: none
- Change:
  1. `tree-view-classes.ts`: the functions in "Data and types"; `treeRowClass` uses `cn` from `../cn`
     and `FORCED_MARK` from `./display-classes`, classes exactly as in "UI".
  2. `tree-view.tsx` (`'use client'`), re-exports `type TreeNode` and `treeRowClass` is not re-exported
     from the root (internal). State: expanded (`Set<string>`; controlled from `expanded` when given,
     else internal from `defaultExpanded`), selected (controlled from `selected !== undefined`, else
     internal from `defaultSelected ?? null`), `focusedId` (`string | null`, internal). Derived:
     `flat = useMemo(() => visibleNodes(items, expandedSet), [items, expandedSet])`,
     `parents = useMemo(() => parentMap(items), [items])`. Focus target (`tabIndex=0`): `focusedId` if it
     is in `flat`; else its nearest ancestor in `flat` (walk `parents`); else the selected id if visible;
     else `flat[0]`.
  3. `setExpanded(next)`: internal update when uncontrolled, then `onExpandedChange?.([...next])`.
     `toggle(id)`, `expand(id)`, `collapse(id)`.
  4. `select(node)`: no-op when `!selectable` or `node.disabled`; internal update when uncontrolled; `onSelectedChange?.(node.id, node)`.
     `activate(node)`: no-op when disabled; `onActivate?.(node)`.
  5. Item elements in a `useRef(new Map<string, HTMLLIElement>())` filled by ref callbacks (with
     cleanup). `focusNode(id)`: `setFocusedId(id)` and `map.get(id)?.focus()` in a layout effect after
     the commit (a `pendingFocus` ref, read only in the effect).
  6. Keyboard on the tree (`onKeyDown` on the ul; act only when `e.target` is a treeitem `li`; get its
     flat entry by id from a `data-id` attribute on the li). With `rtl = isRtl(e.currentTarget)`,
     `forward = rtl ? 'ArrowLeft' : 'ArrowRight'`, `back = rtl ? 'ArrowRight' : 'ArrowLeft'`:
     - ArrowDown / ArrowUp: next / previous in `flat` (stop at the ends, no wrap).
     - forward: closed parent → expand; open parent → focus first child; leaf → nothing.
     - back: open parent → collapse; else → focus the parent (roots: nothing).
     - Home / End: first / last in `flat`.
     - Enter: `select`, `activate`, and `toggle` when it is a parent and `toggleOnSelect`.
     - Space (`' '`): `select`.
     - `*`: expand every sibling (same parent) that has children.
     - Typeahead: one printable character without Ctrl/Meta/Alt → next node in `flat` after the current
       one (wrapping) whose label starts with it, case-insensitive.
     Every handled key calls `preventDefault()`.
  7. Pointer: row `onClick` → `focusNode(id)`, `select`, `activate`, and `toggle` when parent and
     `toggleOnSelect`; the toggle span `onClick` → `e.stopPropagation()`, `focusNode(id)`, `toggle(id)`.
  8. Keep focus: track whether focus is inside the tree (`onFocus`/`onBlur` with relatedTarget); after a
     commit where focus was inside and `document.activeElement === document.body` (the focused node was
     collapsed away), focus the focus target.
  9. Dev warnings from an effect: `duplicateIds(items)` non-empty → key `tree-dup`, message
     `TreeView: node ids must be unique; "<id>" appears more than once.`; no aria-label and no
     aria-labelledby → key `tree-label`, message `TreeView: give the tree an aria-label or aria-labelledby.`
  10. `site/components/tree-view.tsx` exporting `treeView: ComponentDoc`; import from
      `'../../src/components/tree-view'` and `'../../src'`. Sample data `FILES`: `src` (children
      `components` (children `button.tsx`, `table.tsx`, `tree-view.tsx`), `index.ts`, `theme.ts`),
      `site` (children `main.tsx`), `package.json`, `README.md`; icons from `site/lib/icons` if a folder
      and file icon exist there, else none. Sample `OUTLINE` for navigation: `Portfolio` (Positions,
      Orders, History), `Research` (Watchlist, Screener (disabled)), `Settings`.
     - `id: 'tree-view'`, `name: 'TreeView'`, `exports: ['TreeView']`, `api: { functions: [], interfaces: ['TreeNode'] }`,
       `importLine: "import { TreeView } from '@nish/ui';"`.
     - `summary`: `A tree of nested items, like folders or a section outline: open and close branches, select one item, and the WAI-ARIA keyboard model (arrows, Home, End, type a letter to jump, * to open siblings).`
     - `controls`: selectable (boolean), toggleOnSelect (boolean); `initial: { selectable: true, toggleOnSelect: true }`;
       render `FILES` with `defaultExpanded={['src', 'components']}`, `defaultSelected="table.tsx"` and `aria-label="Files"` in a `max-w-xs` box.
     - `stories`: `files` "Files"; `outline` "Navigation outline" (a line below: `Activated: <label>` from onActivate, `defaultSelected="positions"`);
       `chevron-only` "Open folders with the chevron only" (`toggleOnSelect={false}`); `no-selection` "Activation only" (`selectable={false}`);
       `disabled` "A disabled node" (note `Focusable and listed, but it cannot be selected or activated.`).
     - `usage`: `<TreeView aria-label="Files" items={files} defaultExpanded={['src']} onActivate={(node) => openFile(node.id)} />` with the imports.
     - `guidelines` (exact):
       - `Every node needs an id that is unique in the whole tree; it keys selection and expansion.`
       - `A click or Enter on a parent selects it and opens or closes it. Set toggleOnSelect={false} to open folders with the chevron or the arrow keys only.`
       - `Navigate in onActivate (a click or Enter); Space only selects.`
       - `Keep labels short: each level indents 20px and long labels truncate, which matters on a 360px screen.`
       - `Give the tree an aria-label (or aria-labelledby) that says what it holds.`
       - `Rows and the chevron grow to 44px on touch screens.`
- Edge cases: empty `items` (an empty tree, no tab stop, no error); controlled `expanded` without
  `onExpandedChange` (keys do nothing visible, no crash); selected id not in the tree; focused node
  removed from `items` (focus target falls back); a parent with `children: []` is a leaf; deep nesting
  (level 10) still renders; RTL arrow swap and chevron direction.
- Acceptance:
  - `npx vitest run src/components/tree-view.test.tsx` passes, covering: ref, className, rest on the ul; roles tree/treeitem/group with aria-level, aria-setsize, aria-posinset, aria-expanded, aria-selected and the label via aria-labelledby (name excludes children); roving tabIndex (one 0); every key in step 6 including RTL (`dir="rtl"` on a wrapper and a `getComputedStyle` stub); click selects, activates and toggles; chevron click only toggles; `toggleOnSelect={false}`; `selectable={false}` renders no aria-selected; controlled and uncontrolled expanded and selected; disabled node; focus moves to the parent when its branch collapses under focus; the duplicate-id and label warnings; `visibleNodes`, `parentMap`, `duplicateIds` unit cases in the same file.
  - `npm run typecheck` and `npx eslint src/components/tree-view-classes.ts src/components/tree-view.tsx site/components/tree-view.tsx` pass.

### T4 ContextMenu and the new strings

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/components/context-menu.tsx` (new), `src/components/context-menu.test.tsx` (new),
  `site/components/context-menu.tsx` (new), `src/components/strings.ts` (two keys only)
- Reads: `src/components/overlay.tsx` (DropdownMenu, MenuItem, PopoverCloseReason), `src/components/overlay.test.tsx`
  (matchMedia and layout stubs to copy), `src/components/provider.tsx`, `site/components/dropdown-menu.tsx`
- Depends on: none
- Change:
  1. `strings.ts`: insert right after the `back` member of `NishStrings` (line 12) the two members in
     "New strings" with their JSDoc lines, and right after `back: 'Back: ',` in the defaults (line 237):
     `contextMenu: 'Actions',` and
     `sortAnnounce: (header, dir) => (dir ? \`Sorted by ${header}, ${dir === 'asc' ? 'ascending' : 'descending'}\` : 'Sorting cleared'),`.
     No other edits to the file.
  2. `context-menu.tsx` (`'use client'`). The only overlay import line:
     `import { DropdownMenu, type PopoverCloseReason } from './overlay';`. State: `openState`
     (uncontrolled), `point` (`{ x: number; y: number } | null`), `target` (`Element | null`), and a
     `returnTo` ref (`HTMLElement | null`, written in handlers and effects only). `open = openProp ?? openState`.
     `setOpen(next, reason?)`: internal update when uncontrolled; `onOpenChange?.(next, reason)`.
  3. `openAt(x, y, el)`: when `disabled`, return. Resolve the content first: `typeof menu === 'function' ? menu(el) : menu`; when it is null or false, return (the browser menu was already prevented for pointer opens; that is accepted).
     Save `returnTo`: the active element when it is inside the root, else `el.closest(FOCUSABLE)` inside
     the root, else null, where `FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'`.
     Set point, target, `lastOpen = Date.now()` (a ref) and open.
  4. Events on the root (React handlers):
     - `onContextMenu(e)`: call the user's `onContextMenu` first; return when `disabled`, `e.defaultPrevented`
       (an inner ContextMenu took it), `e.shiftKey`, or the target is inside
       `input, textarea, select, [contenteditable]:not([contenteditable="false"])`. Then `e.preventDefault()`.
       When the menu opened within the last 1000ms from a long press or the keyboard (`lastOpen`), stop
       there. Else `openAt(e.clientX, e.clientY, e.target as Element)`.
     - `onKeyDown(e)`: user handler first; `(e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu'` →
       `e.preventDefault()`; position from the focused element: `r = (document.activeElement ?? root).getBoundingClientRect()`,
       `x = isRtl(root) ? r.right : r.left`, `y = r.bottom`; `openAt(x, y, document.activeElement ?? root)`.
     - Long press: `onPointerDown(e)` with `e.pointerType !== 'mouse'` and the primary button: remember
       start point, start a `window.setTimeout(longPressMs)` that calls `openAt(start.x, start.y, e.target)`,
       sets `suppressClickUntil = Date.now() + 800` (a ref). `onPointerMove`: cancel when moved more than
       10px (`Math.hypot`). `onPointerUp` / `onPointerCancel`: cancel. Clear the timer on unmount.
     - `onClickCapture(e)`: when `Date.now() < suppressClickUntil`, `e.preventDefault()` and `e.stopPropagation()`.
  5. Render:
     ```tsx
     <div {...rest} ref={ref} data-state={open ? 'open' : 'closed'} className={cn('[-webkit-touch-callout:none]', className)} onContextMenu onKeyDown onPointerDown onPointerMove onPointerUp onPointerCancel onClickCapture>
       {children}
       <DropdownMenu
         trigger={<span aria-hidden="true" data-nish-context-anchor="" style={{ position: 'fixed', left: x, top: y, width: 0, height: 0, pointerEvents: 'none' }} />}
         open={open && content != null}
         onOpenChange={(next, reason) => setOpen(next, reason)}
         aria-label={menuLabel ?? t.contextMenu}
         sheetBelow={sheetBelow}
         sheetTitle={sheetTitle}
         className={menuClassName}
         side="bottom"
         align="start"
       >
         {content}
       </DropdownMenu>
     </div>
     ```
     where `content` is `typeof menu === 'function' ? (target ? menu(target) : null) : menu` and, before
     any press, `x`/`y` come from the root's rect start-top corner plus 8px, read in a layout effect when
     `open` becomes true with `point === null` (store into `point`). Defaults: `sheetBelow = 'sm'`, `longPressMs = 500`.
     Pass the user's handlers through: destructure `onContextMenu`, `onKeyDown`, `onPointerDown`,
     `onPointerMove`, `onPointerUp`, `onPointerCancel`, `onClickCapture` from props and call each first.
  6. Focus return: a layout effect on `open` going from true to false: when `document.activeElement` is
     null or `document.body`, `returnTo.current?.focus({ preventScroll: true })` (DropdownMenu's own
     return focus targets the zero-size span, which cannot take focus).
  7. `site/components/context-menu.tsx` exporting `contextMenu: ComponentDoc`, `framed: { height: 340 }`;
     import `ContextMenu` from `'../../src/components/context-menu'`, the rest from `'../../src'`.
     Story area: a Card with three file rows (`<div data-id="report.pdf" tabIndex={0} className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm hover:bg-th-overlay focus-visible:outline-2 focus-visible:outline-th-accent">`),
     a line under it `Last action: <name> on <file>`, and the hint `Right-click a row, press and hold on a touch screen, or focus a row and press Shift+F10.`
     Menu (function form): `MenuLabel` with the file name, `MenuItem` Open, Rename, Download, `MenuSeparator`, `MenuItem danger` Delete.
     - `id: 'context-menu'`, `name: 'ContextMenu'`, `exports: ['ContextMenu']`, `importLine: "import { ContextMenu, MenuItem } from '@nish/ui';"`.
     - `summary`: `A menu of actions for an area, opened with a right-click, a long press on touch screens, or Shift+F10 and the Menu key. It uses the DropdownMenu rows and keys, and opens as a bottom sheet on phones.`
     - `controls`: sheetBelow (select `['sm', 'off']`, mapped to false), longPressMs (number 300-1000);
       `initial: { sheetBelow: 'sm', longPressMs: 500 }`.
     - `stories`: `files` "One menu over many rows" (function form); `open` "Open" (controlled `open` true on mount, note `Opened from code it sits at the area's start-top corner.`);
       `static` "One menu for the whole area" (ReactNode form over a 160px dashed box `Right-click anywhere in this box`);
       `floating` "Floating on phones too" (`sheetBelow={false}`).
     - `usage`:
       ```
       import { ContextMenu, MenuItem, MenuSeparator } from '@nish/ui';

       <ContextMenu
         menu={(target) => {
           const id = target.closest<HTMLElement>('[data-id]')?.dataset.id;
           if (!id) return null;
           return (
             <>
               <MenuItem onSelect={() => rename(id)}>Rename</MenuItem>
               <MenuSeparator />
               <MenuItem danger onSelect={() => remove(id)}>Delete</MenuItem>
             </>
           );
         }}
       >
         <FileList />
       </ContextMenu>
       ```
     - `guidelines` (exact):
       - `A context menu is a shortcut, never the only way in: put the same actions in a visible DropdownMenu (a ⋯ button on the row) too.`
       - `Wrap a whole list in one ContextMenu and pass menu as a function: read the row from target.closest('[data-id]'). Return null to keep the browser menu closed and show nothing.`
       - `Inputs, text areas and editable text keep the browser's own menu, so copy and paste still work. Shift+right-click also shows the browser menu.`
       - `Under 640px the menu opens as a bottom sheet with 48px rows; set sheetBelow={false} to keep the floating menu.`
       - `A long press that opens the menu cancels the tap that follows it, so a row's link does not also open.`
       - `Rows are MenuItem, MenuLabel and MenuSeparator, the same as in DropdownMenu.`
- Edge cases: `disabled` (no listeners act, native menu shows); nested ContextMenus (inner wins via
  `defaultPrevented`); right-click while open on another spot (outside press closes, the new
  contextmenu opens at the new point); `menu` function returning null (nothing opens); a long press that
  moves (scroll) does not open; Android's native contextmenu after our long press is swallowed; Escape
  closes only the menu inside a Modal (DropdownMenu's layer stack); RTL keyboard open uses the focused
  element's right edge; SSR renders children and the hidden span only.
- Acceptance:
  - `npx vitest run src/components/context-menu.test.tsx src/components/provider.test.tsx` passes. The new
    test covers: ref, className, rest on the root; right-click (`fireEvent.contextMenu(row, { clientX: 40, clientY: 50 })`)
    opens a `role="menu"` named "Actions" (or a provider `strings.contextMenu` override, or `menuLabel`),
    with `preventDefault` called; the anchor span at left 40 / top 50; selecting a MenuItem closes it and
    calls `onOpenChange(false)`; Escape closes with reason 'escape'; Shift+F10 and the ContextMenu key open
    it with the first item focused; long press with fake timers (pointerType 'touch', 500ms) opens it and
    the following click is suppressed; a 20px move cancels it; inputs and Shift+right-click are left to
    the browser (`defaultPrevented` false); `disabled`; the function form receives the pressed element;
    null content keeps it closed; controlled `open`; phone viewport (matchMedia stub) renders the sheet
    (a dialog titled "Menu"); focus returns to the row after closing.
  - `npm run typecheck` and `npx eslint src/components/context-menu.tsx src/components/strings.ts site/components/context-menu.tsx` pass.

### T5 HoverCard and the `place` export

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/components/hover-card.tsx` (new), `src/components/hover-card.test.tsx` (new),
  `site/components/hover-card.tsx` (new), `src/components/overlay.tsx` (one edit, below)
- Reads: `src/components/overlay.tsx` (Tooltip, FloatingTip, useAnchoredPosition, floatingStyle),
  `src/components/overlay-classes.ts`, `src/runtime.ts`, `src/components/provider.tsx`, `src/components/client.ts`
- Depends on: none
- Change:
  1. `overlay.tsx`, the only edit: line 1120 `function place(` becomes `export function place(`, and the
     JSDoc above it gets a last line ` *  @internal Also used by hover-card.tsx; not exported from the package root.`
     Nothing else in overlay.tsx changes (the appshell-gaps session is splitting this file; see
     "Parallel sessions").
  2. `hover-card.tsx` (`'use client'`). Imports from the overlay modules, exactly:
     `import { place } from './overlay';` and `import { keyboardFocused, touchTracker } from './overlay-classes';`.
     Plus `shared` from `../runtime`, `isRtl, useIsClient, useIsoLayoutEffect` from `./client`,
     `useNishConfig` from `./provider`, `useLatest` from `./latest`, `mergeRefs`/`warnOnce` from
     `./data-classes`, `cn` from `../cn`, `createPortal` from `react-dom`.
  3. Local hook `useCardPosition(anchor, card, open, side, align)`: the same body as
     `useAnchoredPosition` (overlay.tsx lines 1155-1196) with gap 8, calling the imported `place(rect, w, h, side, align, 8, isRtl(anchor))`.
  4. `HoverCard`: defaults `side = 'bottom'`, `align = 'center'`, `openDelay = 500`, `closeDelay = 300`,
     `width = 320`. `open = openProp ?? openState` (`useState(defaultOpen ?? false)`). One timer ref.
     `show()` = clear timer, set a timer for `openDelay` that opens; `hide()` = clear timer, set a timer
     for `closeDelay` that closes; `stay()` = clear timer. Native listeners on the wrapper span
     (effect, like Tooltip): `pointerenter`/`pointerdown` feed `touchTracker`; `mouseenter` → `show()`
     unless `touch.recent()`; `mouseleave` → `hide()`; `focusin` → `show()` when
     `keyboardFocused(e.target)`; `focusout` → `hide()`; `pointerdown` from touch → close at once.
     Card `onPointerEnter` → `stay()`, `onPointerLeave` → `hide()`. Escape (document keydown, capture,
     while open) → `e.stopPropagation()`, close at once. One open card:
     `shared('hoverCard', () => ({ close: null as (() => void) | null }))`, same logic as Tooltip's
     `openTip`. Every open/close calls `onOpenChange?.(next)` (through `useLatest`) and updates the
     internal state when uncontrolled.
  5. Render: when `children` is not a single valid element, `warnOnce('hovercard-child', 'HoverCard: children must be one element, such as a link.')`
     (in an effect) and render the children alone. Otherwise the wrapper span (`ref` for listeners,
     `className="inline-flex"`, `data-state`) with `cloneElement(child, { 'aria-describedby': open ? merged : existing })`,
     and the card (markup in "UI") through `createPortal` only when `open && isClient`; `...rest` and
     `ref` (merged with the internal card ref) on the card; `className` merged last.
  6. `site/components/hover-card.tsx` exporting `hoverCard: ComponentDoc`, `framed: { height: 300 }`;
     import `HoverCard` from `'../../src/components/hover-card'`, the rest from `'../../src'`.
     Stories render with `defaultOpen` so screenshots show the card.
     - `id: 'hover-card'`, `name: 'HoverCard'`, `exports: ['HoverCard']`, `importLine: "import { HoverCard } from '@nish/ui';"`.
     - `summary`: `A preview card that opens when the pointer rests on a link or keyboard focus stays on it: a symbol quote, a profile, a page summary. Escape closes it, and so does moving the pointer off the link and the card.`
     - `controls`: side (select bottom, top), align (select start, center, end), openDelay (number 0-1500);
       `initial: { side: 'bottom', align: 'center', openDelay: 500 }`.
     - `stories`: `symbol` "Symbol preview" (link `AAPL` to `#aapl`, content: `Apple Inc.` (font-medium text-th-hi), `NASDAQ · USD`, a `Stat`-like line `189.84 +1.2%` using `toneFor`/`signTone` if handy, else plain text);
       `profile` "Profile" (an `Avatar` with `Nishant Arora` and the line `Builds nish.software`);
       `top` "Above" (`side="top"`, note `Flips below when there is no room.`).
     - `usage`:
       ```
       import { HoverCard } from '@nish/ui';

       <HoverCard content={<SymbolPreview symbol="AAPL" />}>
         <a href="/symbols/AAPL">AAPL</a>
       </HoverCard>
       ```
     - `guidelines` (exact):
       - `It is extra, never required: touch screens never open it (a tap follows the link), so the page the link opens must show the same information.`
       - `For a short label use Tooltip. For a panel the user opens with a click and works in, use Popover.`
       - `The pointer can move into the card to select text or press a link in it. Keyboard users hear the card's text with the link (aria-describedby) but cannot tab into it.`
       - `One card is open at a time.`
       - `It waits 500ms before opening and 300ms before closing, so sweeping the pointer across a list does not flash cards.`
- Edge cases: trigger unmounts while open (card unmounts, timers cleared); pointer moves trigger → card
  within closeDelay (stays open); Escape inside a Modal closes only the card; controlled `open` without
  `onOpenChange`; `defaultOpen` (SSR renders no card; opens after hydration); RTL align mirrors through
  `place`; tiny viewport (card clamps, `max-width: calc(100vw - 1rem)`).
- Acceptance:
  - `npx vitest run src/components/hover-card.test.tsx src/components/overlay.test.tsx` passes. The new test
    (fake timers) covers: ref, className, rest on the card; hover opens after openDelay, not before; leave
    closes after closeDelay; entering the card keeps it open; keyboard focus opens, pointer focus does not;
    a touch pointerdown never opens it; Escape closes and stops propagation; a second card closes the first;
    `aria-describedby` merges with the child's own while open; controlled and `defaultOpen`; the
    non-element children warning; `renderToString` renders only the trigger.
  - `npm run typecheck` and `npx eslint src/components/hover-card.tsx src/components/overlay.tsx site/components/hover-card.tsx` pass.

### T6 Wire-up: exports, registries, budgets, README

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `src/index.ts`, `site/components/index.ts`, `tests/ssr/cases.tsx`, `tools/size-budgets.json`,
  `tools/api-surface.snapshot.json`, `README.md`, `tools/site.visual.json`, `tools/site-all.visual.json`
- Reads: everything T1-T5 wrote
- Depends on: T1, T2, T3, T4, T5
- Change (additive edits only, at the anchors named, so merges with other sessions stay simple):
  1. `src/index.ts`: right after line 131 (`export type { TableWrapProps, TableProps, ThProps, TdProps, TrProps } from './components/table';`) insert:
     ```ts
     export { VirtualList } from './components/virtual';
     export type { VirtualListProps, VirtualListHandle, ScrollToIndexOptions } from './components/virtual';
     export { VirtualTable } from './components/virtual-table';
     export type { VirtualTableProps } from './components/virtual-table';
     export { TreeView } from './components/tree-view';
     export type { TreeViewProps, TreeNode } from './components/tree-view';
     export { ContextMenu } from './components/context-menu';
     export type { ContextMenuProps } from './components/context-menu';
     export { HoverCard } from './components/hover-card';
     export type { HoverCardProps } from './components/hover-card';
     ```
     `ScrollAlign` is re-exported by `virtual.tsx` as a type and added to the type line only if
     `ScrollToIndexOptions` references it in the emitted `.d.ts` (it does; add `ScrollAlign` to the first type line).
  2. `site/components/index.ts`: imports after `import { dropdownMenu } from './dropdown-menu';`:
     `import { contextMenu } from './context-menu';` and `import { hoverCard } from './hover-card';`;
     after `import { responsiveTable } from './responsive-table';`: `import { virtualList } from './virtual-list';`,
     `import { virtualTable } from './virtual-table';`, `import { treeView } from './tree-view';`.
     In `COMPONENT_DOCS`: `contextMenu, hoverCard,` right after `dropdownMenu,`; `virtualList, virtualTable, treeView,`
     right after `responsiveTable,`. Change nothing else; if the registry has become lazy (ui-leftovers),
     add the five pages in its new form instead.
  3. `tests/ssr/cases.tsx`: add, in alphabetical position among the keys:
     ```tsx
     ContextMenu: () => (
       <ui.ContextMenu menu={<ui.MenuItem>Rename</ui.MenuItem>}>
         <div>Area</div>
       </ui.ContextMenu>
     ),
     HoverCard: () => (
       <ui.HoverCard content="Apple Inc.">
         <a href="/aapl">AAPL</a>
       </ui.HoverCard>
     ),
     TreeView: () => (
       <ui.TreeView aria-label="Files" items={[{ id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }] }, { id: 'b', label: 'b.ts' }]} defaultExpanded={['src']} />
     ),
     VirtualList: () => <ui.VirtualList aria-label="Rows" count={1000} itemSize={40} height={200} renderItem={(i) => <span>Row {i}</span>} />,
     VirtualTable: () => (
       <ui.VirtualTable label="Rows" rows={[{ id: '1', n: 1 }, { id: '2', n: 2 }]} rowKey={(r) => r.id} columns={[{ key: 'n', header: 'N', cell: (r) => r.n, numeric: true }]} />
     ),
     ```
  4. `npm run build`, then measure each new import with `npm run size` after adding, right after the
     `"Combobox"` line of `tools/size-budgets.json`, these entries with a placeholder `maxKB` of the
     ceiling: `{ "name": "VirtualList", "from": "nish-ui", "import": "VirtualList", "maxKB": 12 }`,
     `VirtualTable` 16.5, `TreeView` 12.5, `ContextMenu` 20, `HoverCard` 13. Read the measured sizes from
     the `npm run size` output and set each `maxKB` to the measured size rounded up to the next 0.5,
     plus 0.5. Set `everything from .` the same way. Any measurement above its ceiling (128 for
     `everything from .`) is a failure to report, not a budget to raise.
  5. `npm run build && UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`, then commit-ready
     `tools/api-surface.snapshot.json` (only additions are expected: the five component names).
  6. `README.md` "What's in it": the Overlays line becomes
     `- **Overlays:** Modal, Drawer, ConfirmDialog, Popover, DropdownMenu, ContextMenu, Tooltip, HoverCard,`
     `  CommandPalette, Portal`; in the Data and display line add `VirtualList, VirtualTable, TreeView,`
     right after `ResponsiveTable,` (rewrap at the file's usual width).
  7. `tools/site.visual.json`: after the `"dropdown-menu"` page entry add
     `{ "name": "virtual-table", "url": "http://localhost:5191/#/components/virtual-table", "waitFor": "[data-page]", "settle": 800 }` and
     `{ "name": "tree-view", "url": "http://localhost:5191/#/components/tree-view", "waitFor": "[data-page]" }`.
     `tools/site-all.visual.json`: after the first `"dropdown-menu"` page entry add one entry per new page
     (`virtual-list`, `virtual-table`, `tree-view`, `context-menu`, `hover-card`) in the same shape, with
     `"settle": 1000` for `context-menu` and `hover-card`.
- Edge cases: a docgen gap (a prop without JSDoc) is fixed in the component file by adding the JSDoc
  line, not by allow-listing it (T6 may make that one-line edit and says so); a size ceiling miss stops
  the task with the numbers.
- Acceptance (all must pass): `npm run check`, `npm run test:unit -- --coverage` (thresholds hold),
  `npm run test:tools`, `npx vitest run tools/docgen-coverage.test.ts`, `npm run size`,
  `npx vite build --config site/vite.config.ts` then `npx vite preview --config site/vite.config.ts --port 5191`
  in the background and `node tools/visual-check.mjs tools/site.visual.json` (stop the preview server after).

### T7 Browser spec

- Repo / checkout: ui at `C:\Code\ui-tree-virtual`
- Owns: `tests/overlay/tree-virtual.html` (new), `tests/overlay/tree-virtual.tsx` (new),
  `tests/overlay/tree-virtual.spec.ts` (new)
- Reads: `tests/overlay/harness.html`, `tests/overlay/main.tsx`, `tests/overlay/overlay.spec.ts`,
  `tests/a11y/axe.spec.ts`, `playwright.config.ts`
- Depends on: T1, T2, T3, T4, T5 (imports from the component module paths, not `src/index.ts`, so it
  can run beside T6)
- Change:
  1. `tree-virtual.html`: a copy of `harness.html` with title `tree-virtual harness` and
     `src="./tree-virtual.tsx"`.
  2. `tree-virtual.tsx`: imports `./styles.css`, the five components from `../../src/components/...`,
     `Button`, `MenuItem`, `MenuSeparator` from `../../src`. Renders a `<main className="grid gap-6 p-6">` with sections
     (each an `h2` and the component):
     - "Fixed list": `<VirtualList aria-label="Fixed rows" count={10000} itemSize={40} height={320} renderItem={(i) => <div className="flex h-10 items-center px-3"><button type="button">Row {i + 1}</button></div>} apiRef={api} />` and
       `<Button onClick={() => api.current?.scrollToIndex(4999, { align: 'start' })}>Jump to 5000</Button>`.
     - "Measured list": `measure`, `itemSize={48}`, `gap={8}`, 2,000 rows whose text repeats `Line. ` `(i % 4) + 1` times with a `max-w-64` wrapper.
     - "Table": `VirtualTable label="Trades"` with 5,000 rows (`id`, `symbol` from the T1 generator, `qty`), columns Symbol and Qty (numeric, sortValue),
       `height={320}`, `onRowClick={(_, i) => setClicked(i)}`, and `<p data-testid="clicked">{clicked}</p>`.
     - "Tree": `TreeView aria-label="Files"` with the T3 `FILES` shape, `defaultExpanded={['src']}`, `onActivate={(n) => setActivated(n.label)}`, `<p data-testid="activated">`.
     - "Context menu": `ContextMenu` with ReactNode menu `Rename`, `MenuSeparator`, `Delete` (each `onSelect` sets `<p data-testid="last">`) around `<div tabIndex={0} className="grid h-32 w-64 place-items-center rounded-lg border border-th-line">Right-click here</div>`.
     - "Hover card": `<HoverCard openDelay={100} closeDelay={100} content={<p>Apple Inc. · NASDAQ</p>}><a href="#aapl">AAPL</a></HoverCard>`.
  3. `tree-virtual.spec.ts` (`const URL = '/tree-virtual.html'`), tests:
     - fixed list keeps fewer than 60 `role=listitem` in the "Fixed rows" list; scrolling the box to the
       bottom (`evaluate(el => el.scrollTop = el.scrollHeight)`) shows "Row 10000"; "Jump to 5000" shows "Row 5000" in view.
     - focus pinning: focus "Row 3", scroll the box to the bottom, the button for "Row 3" is still attached and focused.
     - measured list: after scrolling to the middle and waiting two frames, no two rows overlap (bounding boxes) and rows are 8px apart.
     - table: `aria-rowcount` is 5001; click a row, press ArrowDown 3 times and End, then Enter: `clicked` reads `4999`; the focused row is visible in the box.
     - tree: focus the first treeitem, ArrowRight/ArrowLeft open and close, ArrowDown moves, Enter on a leaf sets `activated`.
     - context menu: right-click the area at (40, 40) inside it: a `role=menu` named "Actions" appears near the click (within 12px of the pointer, or flipped above it); ArrowDown then Enter sets `last`; Shift+F10 on the focused area opens it with the first item focused; Escape closes it and focus returns to the area.
     - hover card: hover "AAPL", the card text appears; move to the card, it stays; press Escape, it closes.
     - axe: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'])`, zero serious or critical, with the context menu closed, and again with the context menu open.
     - 360px: `page.setViewportSize({ width: 360, height: 780 })`, `document.documentElement.scrollWidth <= 360`.
- Edge cases: WebKit and Firefox run this file in CI (`browsers` job): use role and text locators, no
  Chromium-only APIs; `page.mouse.click(x, y, { button: 'right' })` for the context menu.
- Acceptance: `npm run build`, then `npx playwright test tests/overlay/tree-virtual.spec.ts` (Chromium) passes, and
  with `npx playwright install firefox webkit` done once, `NISH_BROWSERS=all npx playwright test tests/overlay/tree-virtual.spec.ts --project=firefox --project=webkit` passes.
  Stop any leftover harness server afterwards.

### T8 trackers adopts VirtualList (after the release)

- Repo / checkout: trackers at `C:\Code\trackers-tree-virtual` (`git -C C:\Code\trackers fetch -q`, then
  `git -C C:\Code\trackers worktree add C:\Code\trackers-tree-virtual -b tree-virtual origin/master`)
- Owns: `ui/src/pages/flights/TripPage.tsx` (the VirtualList import and its one use only),
  `ui/src/components/flights/VirtualList.tsx` (deleted)
- Reads: trackers `CLAUDE.md`, `README.md`
- Depends on: the ui PR merged and, for the trackers PR itself, the fan-out's `ui/vX.Y.Z` bump merged in
  trackers. Before that, build against a local pack: run `npm run build` and then `npm pack` in the ui
  worktree `C:\Code\ui-tree-virtual` after T6 (never in `C:\Code\ui`), then extract the
  tarball over `C:\Code\trackers-tree-virtual\node_modules\@nish\ui` with `tar --force-local -xzf <tgz> --strip-components=1 -C <that folder>`
  (never touching package.json or package-lock.json).
- Change:
  1. Replace `import { VirtualList } from '../../components/flights/VirtualList';` with `VirtualList`
     added to the existing `@nish/ui` import in TripPage.tsx.
  2. Replace the use (line 291) with:
     ```tsx
     <VirtualList aria-label="Options" count={sorted.length} itemKey={optionKey} itemSize={96} measure gap={8} renderItem={renderOption} />
     ```
     where, next to `renderRow`, `const optionKey = useCallback((i: number) => sorted[i]!.key, [sorted]);`
     and `const renderOption = useCallback((i: number) => renderRow(sorted[i]!), [sorted, renderRow]);`
     (if `renderRow` is not stable, depend on `[sorted]` only and inline `renderRow` is acceptable because
     only the rendered rows call it; follow the file's lint rules).
  3. Delete `ui/src/components/flights/VirtualList.tsx`; grep that nothing else imports it.
- Edge cases: the non-virtual branch (`<ul className="grid gap-2">`) under 100 options is unchanged;
  window scrolling under the sticky filter bar works as before.
- Acceptance: trackers' PR checks run locally in the worktree: `npm run typecheck`, `npm run lint`,
  `npm run build` (`npm test` fails locally on Windows temp-dir cleanup per trackers' CLAUDE.md, so CI is its
  gate); `npm run shots` against `scripts/mock-server.mjs`, then look at the Trip page with "Show all"
  at 360x800, 840x900 and 1440x900 in light and dark: rows 8px apart, no overlap, no horizontal scroll.

## Waves

W1: T1, T3, T4, T5 · W2: T2 (needs T1, T4) · W3: T6, T7 (need T1-T5) · W4: T8 (needs the ui merge; its PR
needs the batched ui release and the trackers bump)

## Review focus

- Virtualization correctness: range math at the edges, scroll anchoring with measured rows (no
  jumping while scrolling up through rows that grow), focus pinning, `scrollToIndex` with estimates,
  hydration (first client render equals the server), no render-time ref reads.
- Accessibility: tree roles and names (name excludes children), `aria-rowcount`/`aria-rowindex`,
  `aria-setsize`/`aria-posinset`, roving tabIndex in the table and tree, ContextMenu focus return and
  keyboard open, HoverCard WCAG 1.4.13, axe on the harness, 44px rows on touch.
- ContextMenu: long-press timing and click suppression on a real phone-sized viewport, inputs keep the
  native menu, nested menus, inside a Modal (layer order, inert).
- UI and mobile: docs pages at 360x780, 840x900, 1440x900 in light and dark (VirtualTable scrolls
  sideways inside its box only; TreeView labels truncate; ContextMenu sheet on 360).
- Contract: `'use client'` first line, pure helpers in `*-classes.ts`/`virtual-range.ts`, JSDoc on every prop,
  strings from the provider, size budgets within the ceilings, the single overlay.tsx edit.

## CI budget

- ui is public, so its Actions minutes are free; trackers is private and counts against the shared
  3,000/month. Branch pushes trigger no CI; only `pull_request` events and master pushes do.
- One PR per repo. Open the ui PR only after every check in `ci.yml` passes locally in the worktree:
  `npm run check`, `npm run test:tools`, `npm run test:unit -- --coverage`, `npm run size`,
  `npx playwright test` (Chromium) and the Firefox/WebKit overlay run (`NISH_BROWSERS=all`), the demo and
  docs-site visual checks (`node tools/visual-check.mjs tools/demo.visual.json` and `tools/site.visual.json`
  with their servers), and `node tools/consumer-check.mjs next`, `vite` and `ts`. The Fold check and
  CodeQL run in CI only.
- Review fixes go up as one batch push, not many small pushes. No empty commits or re-runs to
  retrigger CI unless a check flaked (then one re-run). No Windows or macOS jobs exist on these paths.
- No session in this build dispatches `release.yml` (see "Release"); a ui release fans out bump PRs to
  about 13 private repos, so it is the orchestrator's single batched release.
- Estimate of GitHub-hosted minutes billed for this build: ui PR and master runs 0 (public; about 50
  free runner-minutes per run). trackers adoption: PR `check` about 7 minutes plus the master deploy's
  `check` about 7 minutes = about 15 minutes; one review-fix push adds about 7. Total about 15-25 billed
  minutes. The fan-out bump PRs are counted in the orchestrator's release, not here.

## Parallel sessions

Sessions building at the same time that touch the same repos or files:

- **appshell-gaps** (ui, then trading, job-apps, status, trackers). Owns `src/components/overlay.tsx` and
  its split, `src/components/app-shell.tsx`, `tools/size-budgets.json`.
  - This spec edits overlay.tsx in exactly one place (T5: `export` on `place`) and imports from it only
    `place` (hover-card.tsx), `DropdownMenu` and the `PopoverCloseReason` type (context-menu.tsx).
    Before merging, `git fetch` and `git merge origin/master`. If the overlay split landed first: drop
    this spec's overlay.tsx edit (take master's file), import `place` from the split's positioning module
    (add `export` to it there if the split kept it private, with the same `@internal` line), and change
    the one `DropdownMenu`/`PopoverCloseReason` import line in context-menu.tsx to the split's menu module.
    `keyboardFocused` and `touchTracker` stay imported from `./overlay-classes` unless the split moved them.
  - `tools/size-budgets.json`: this spec only inserts its five entries after the `"Combobox"` line and
    re-measures `everything from .`. Whoever merges second re-runs `npm run size` on the merged tree and
    sets `everything from .` to measured (rounded up to 0.5) plus 0.5; appshell-gaps' AppShell and
    SystemCanvas numbers are theirs. The 100 KB root target predates these components (+about 8 KB).
  - trackers: appshell-gaps changes trackers' shell; T8 touches only TripPage.tsx's VirtualList lines and
    deletes VirtualList.tsx. Merge origin/master into the trackers branch before its PR.
- **picker-carousel** (ui: DatePicker, Calendar, MultiSelect, Carousel). Shares `src/index.ts`,
  `src/components/strings.ts`, `site/components/index.ts`, `tests/ssr/cases.tsx`, `tools/size-budgets.json`,
  `tools/api-surface.snapshot.json`, `README.md`, `tools/site.visual.json`, `tools/site-all.visual.json` and the
  ROADMAP entry. This spec inserts at its own anchors (after the table exports, after `back`, after
  `dropdownMenu`/`responsiveTable`, alphabetical SSR keys). On a conflict keep both sides' additions;
  never hand-merge `tools/api-surface.snapshot.json`: take master's, rebuild, rerun
  `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`; re-measure size budgets after the merge.
- **ui-leftovers** (ui: docs-site bundle splitting, /themes iframes, SystemCanvas routing, theme.ts
  mutation score, fleet-only APIs marked internal, wave 3 elements). May change how
  `site/components/index.ts` and `site/main.tsx` load pages (lazy chunks) and the README. If its split
  landed first, register the five pages in its new form; keep README additions as above.
- No other session (fold-and-vendor, offsite-backups, life-admin-skills, tradingview-integration,
  earnings-predictor) touches ui or trackers.
- Rule for every shared file: rebase or merge `origin/master` right before opening the PR and again
  whenever the PR turns CONFLICTING; rerun the full local checks after each merge.

## Release

Never run for real by a subagent: `git push`, `gh pr create`, `gh pr merge`, `gh workflow run` (any
workflow, `release.yml` above all), `npm publish`, anything that deletes a branch, a tag or a folder. A local
`npm pack` that writes a tarball to disk (T8) is fine. The session runs these steps itself.

1. **ui.** After the Workflow, the session runs the full local checks ("CI budget"), merges
   `origin/master` (see "Parallel sessions"), then the final commit `tree-virtual: release`:
   - delete `docs/specs/tree-virtual.md` (and `docs/specs/` if empty);
   - ROADMAP.md entry **"Components left out of 2.0"**: if picker-carousel already removed its part (the
     entry no longer names DatePicker, Calendar, MultiSelect or Carousel, or is gone), delete the entry.
     Otherwise rewrite it to exactly:
     `- **Components left out of 2.0** (2026-11-03): DatePicker and Calendar, MultiSelect, Carousel. Each follows the component contract in docs/DEVELOPING.md and gets a docs page, unit tests and a size budget.`
   - if T8 is not finished in this session, add to trackers' ROADMAP (in the trackers PR, or with a
     `[skip ci]` docs commit) `- **Use @nish/ui VirtualList on the Trip page** (2026-11-05): replace ui/src/components/flights/VirtualList.tsx with VirtualList from @nish/ui (measure, gap 8, itemSize 96) once trackers is on the ui release that has it.`
   PR title `tree-virtual: VirtualList, VirtualTable, TreeView, ContextMenu, HoverCard`, body per
   `release.md` with `Spec: https://github.com/nishant/ui/blob/<spec commit sha>/docs/specs/tree-virtual.md`.
   Wait for the checks to register, then for green; `gh pr merge <n> --merge --delete-branch`; watch the
   master `ci` run to green.
2. **Tell the orchestrator** (the parent session) `ui ready for release` with: minor bump, and these
   CHANGELOG bullets for its `### Added` section:
   - `VirtualList: a virtualized list (fixed or measured row heights, its own scroll box or the page, focus pinning, scrollToIndex, aria-setsize and aria-posinset).`
   - `VirtualTable: a virtualized table with the ResponsiveTable columns, sticky header, sorting, row tones, a pinned first column, aria-rowcount and arrow-key row navigation.`
   - `TreeView: the WAI-ARIA tree view (nested groups, single selection, controlled or uncontrolled expansion, arrows, Home, End, typeahead, *).`
   - `ContextMenu: a menu at the pointer on right-click, long press or Shift+F10, built on DropdownMenu, with a bottom sheet on phones.`
   - `HoverCard: a preview card on hover or keyboard focus, with open and close delays, Escape, and no touch opening.`
   - `Strings: contextMenu and sortAnnounce.`
   Do not dispatch `release.yml`.
3. **Verify live** after the orchestrator's release reaches hosting: `curl.exe -s -o NUL -w "%{http_code}" https://design.nish.software/`
   is 200; screenshots of `#/components/virtual-list`, `virtual-table`, `tree-view`, `context-menu`,
   `hover-card` at 360x780, 840x900 and 1440x900 in light and dark (one-off Playwright script), and
   `npm view nish-ui version` equals the new tag.
4. **trackers (T8).** Build against the ui pack while waiting. Once the fan-out's `ui/vX.Y.Z` PR is
   merged in trackers: merge `origin/master` into `tree-virtual`, restore `node_modules` with `npm ci`,
   rerun trackers' checks, push, open one PR (`tree-virtual: use @nish/ui VirtualList on the Trip page`),
   wait for `check`, merge, watch `deploy.yml` to green, then `curl.exe -s https://trackers.nish.software/health`
   returns 200 and the deployed bundle no longer contains the local list (`git -c safe.directory=* -C C:\Apps\trackers rev-parse HEAD` equals origin/master).
5. Remove the worktrees once merged (stop any harness server first; check `node_modules` is not a
   junction before `git worktree remove`).

## Open questions for the research phase

- Exact default row heights in Chromium: measure a `Tr` with one line of `text-sm` in a `Table` and in a
  `Table dense` (expected 41 and 33 px); if different, use the measured values in T2's defaults and its
  docs guideline.
- Whether happy-dom's `ResizeObserver` delivers entries (if it does not, T1's measure test triggers the
  observer callback through a captured stub).
- Whether `PointerEvent` with `pointerType: 'touch'` reaches React handlers through
  `fireEvent.pointerDown` in happy-dom (if not, T4 dispatches `new PointerEvent(...)` directly).
