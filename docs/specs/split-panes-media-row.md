# Split panes and media rows in @nish/ui

Status: in progress · Slug: split-panes-media-row · Date: 2026-11-01 · Size: large
Repos: ui (spec lives here, worktree `C:\Code\ui-split-panes`), streams (adopts both), nishboard (adopts the media row)
ROADMAP: streams `ROADMAP.md`, "Shared split panes and media rows in @nish/ui"

## Goal
Two pieces built inside streams.nish.software become shared `@nish/ui` components with docs pages, and every app that had its own copy uses them.

1. `@nish/ui/split-layout`, a React-free module holding the split-tree layout math (presets, rects, dividers, resize, add/remove, narrow layouts, validation). It is importable from Node, because streams' server validates layouts with it.
2. `SplitStage`, `SplitDividers`, `LayoutPresetPicker` and `LayoutPresetIcon` React components, each with a docs page. A live demo stage shows 1-4 colored panes with presets, resize, swap and add/remove.
3. `MediaThumb`, `MediaRow` and `MediaChip`, plus a `titleLines` option on the existing `ListRow`, with a docs page.
4. A minor release. streams then replaces `shared/layout.ts`, `Dividers`, `PresetPicker`, `PresetIcon`, `ResultRow` and its hand-made chips with the shared pieces, and nishboard replaces `EmbedSearchWidget`'s `ResultRow` and `FolderRow` with `MediaRow`. Both are live.

## Out of scope
- Drag-to-swap gestures and pick mode. They stay in streams (app logic). `SplitStage` exposes what an app needs to build them: `data-dragging` and a rect per id.
- nishboard's dashboard grid (react-grid-layout). Not a split tree; untouched.
- Any change to how streams looks or behaves. The adoption is a refactor; screenshots before and after must match.

## Decisions
- The layout math lives at `src/split-layout.ts` and builds as a standalone entry (like `format`), exported as `@nish/ui/split-layout` and re-exported from the root. Node imports it without React.
- Names are generic: "slot" stays (a leaf's index into the consumer's item list). Preset ids keep streams' ids (`single`, `side`, `stack`, `main-side`, `main-right`, `main-bottom`, `cols-3`, `rows-3`, `grid`, `cols-4`) so saved streams setups stay valid. Labels and hints are streams' current ones: Single, Slice, Stack, Main 1, Main 2, Grid, plus the hint text.
- `SplitStage` owns the flat-panes rule: it renders `items` in the given array order (the DOM order never changes), positions each one absolutely from its slot's rect, and never wraps panes in per-split elements. A consumer that reorders slots never moves a DOM node.
- `MediaRow` composes `ListRow` (no second row component). `ListRow` gains `titleLines?: 1 | 2` (default 1, so current users are unchanged).
- Minor release (new components). The release goes through `gh workflow run release.yml -R nishant/ui -f bump=minor`.
- Copy: plain, American English.

## Current state
- streams (`C:\Code\streams`):
  - `shared/layout.ts`: all the math, with tests in `shared/layout.test.ts` (copy them).
  - `ui/src/stage/Dividers.tsx`: separator handles, pointer drag with capture, arrow keys, double-click reset, a 44px hit area on coarse pointers, and `onDragChange`.
  - `ui/src/stage/PresetPicker.tsx`: a radiogroup of icon buttons with a Tooltip hint and `aria-label`, an "Equal sizes" button, an `overlay` variant, and a `pr-52` overlay inset.
  - `ui/src/stage/PresetIcon.tsx`.
  - `ui/src/stage/Stage.tsx`: measures with `useStageSize`, renders `ws.streams` in a stable order positioned from `computeRects`, sets `data-dragging`, and holds the pick/drag logic.
  - `ui/src/add/ResultRow.tsx`: thumbnail 72/96px 16:9, 2-line title, meta, detail, Live/Offline/On screen badges, 56px min.
  - Recent chips: `ui/src/shell/EmptyStage.tsx` (rounded-full, h-11, thumbnail + title).
  - Tray chips: `ui/src/shell/Tray.tsx`.
- nishboard (`C:\Code\nishboard`, pnpm, squash merges, PR title sets the release bump, CHANGELOG entry per PR): `apps/renderer/src/widgets/embed/EmbedSearchWidget.tsx` has `ResultRow` (line ~225: wide 16:9 64×36 or round 36px thumbnail, a live dot, a 2-line title in `text-2xs`, and a subtitle that may be a nested channel link) and `FolderRow` (line ~67: thumbnail or a fallback icon, title, subtitle, chevron). Rows there are dense (widget tiles).
- ui (`C:\Code\ui-split-panes`):
  - `ListRow` is in `src/components/data.tsx:406`.
  - Docs pages are `site/components/<id>.tsx`, registered in `site/components/index.ts`.
  - Unit tests are vitest (`npm run test:unit`).
  - Standalone entries are in `tsup.config.ts`, and `package.json` `exports` lists each subpath.
  - The visual page list is `tools/site-all.visual.json`, and `npm run check` is the full gate.

## Design

### `src/split-layout.ts` (React-free)
Port `streams/shared/layout.ts`, including the `hint` field on `Preset`. Export the types `LayoutNode` (`{ type: 'leaf'; slot: number } | { type: 'split'; dir: 'row' | 'col'; sizes: number[]; children: LayoutNode[] }`), `NarrowLayout`, `Preset`, `Rect` and `Divider`, plus every function streams exports today, with the same signatures and behavior. Constants: `MAX_PANES = 4` (streams' `MAX_STREAMS` becomes an alias in streams), `NARROW_MAX`, `NARROW_BREAKPOINT`. No imports.

### `SplitStage` (`src/components/split.tsx`)
```ts
interface SplitStageProps {
  /** The layout tree; null renders no panes. Leaves cover slots 0..n-1. */
  layout: LayoutNode | null;
  /** Item ids in DOM order. Keep this order stable (for example, insertion order); never sort it by slot, or panes move in the DOM and iframes reload. */
  items: string[];
  /** The item id in each slot. Ids not in slots are not rendered. */
  slots: string[];
  /** Gap between panes in px (default 4). */
  gap?: number;
  /** Shows the dividers and lets them resize the layout. */
  resizable?: boolean;
  /** Called with the new tree while a divider moves (resizeAt), and on reset (equalize that split). */
  onLayoutChange?(layout: LayoutNode): void;
  /** Renders one pane's content; the stage positions it. */
  renderPane(id: string, info: { rect: Rect; slot: number }): ReactNode;
  /** Reports the measured size (for addSlot, which needs it). */
  onSize?(size: { w: number; h: number }): void;
  /** Sets data-dragging on the stage (an app's own pane drag); dividers set it while they move. */
  dragging?: boolean;
  /** Animate position changes (default true; off under prefers-reduced-motion and while dragging). */
  animate?: boolean;
  /** Extra elements over the stage (an overlay preset bar, a drag ghost). */
  children?: ReactNode;
  className?: string;
}
```
It measures with a ResizeObserver, computes `computeRects(layout, w, h, gap)`, and renders `items.map(id => slots.includes(id) && <div key={id} data-split-pane={id} style={{position:'absolute', left, top, width, height, transition}}>{renderPane(...)}</div>)`. It also renders `SplitDividers` when `resizable` and there are 2 or more slots. Root: `relative overflow-hidden`, with `data-dragging` set while any drag is active. CSS in `src/css/components.css`: `[data-dragging] iframe { pointer-events: none }` (a cross-origin frame swallows pointer events).

### `SplitDividers`
Port streams' `Dividers.tsx` with these props: `layout`, `w`, `h`, `gap`, `onResize(next: LayoutNode)`, `onDragChange?(dragging)`, and `minPane?` (default `{ w: 160, h: 90 }`). The narrow mode in streams edits `ws.narrow.split`; the shared component stays generic by taking the tree. streams converts the narrow layout to a tree (`narrowLayout`) and reads the split back out of `sizes[0]`. Keep the a11y: `role="separator"`, `aria-orientation`, `aria-valuenow`, arrows 2%, Enter or double-click to equalize that split, 44px hit area on coarse pointers, a visible accent bar on hover or focus.

### `LayoutPresetPicker` and `LayoutPresetIcon`
`LayoutPresetPicker` props: `options: { id: string; label: string; hint: string; node: LayoutNode }[]`, `value: string | null`, `onChange(id)`, `actions?: ReactNode` (shown at the right, for example "Equal sizes"), `note?: ReactNode` (shown at lg and up), `overlay?: boolean` (translucent with blur and shadow), `className?` (for an inset like `pr-52`), and `label?` (default "Layout presets"). It renders a `ScrollRow` radiogroup, with a `Tooltip` on each option. `LayoutPresetIcon({ node, width = 56, height = 36 })` draws an SVG of the rects with `currentColor`. Also export `presetOptions(count)`, which maps `presetsFor` to options.

### Media
- `MediaThumb({ src, shape = 'wide' | 'round' | 'square', size = 'sm' | 'md', fallback?: ReactNode, alt = '' })`.
  - wide: 16:9 at 64×36 (sm) or 96×54 (md, 72×40.5 under 420px).
  - round: 36 or 48.
  - square: 36 or 48.
  - `loading="lazy"`, `referrerPolicy="no-referrer"`, and only `https:` or relative sources (anything else shows the fallback).
  - Without a src it shows `bg-th-elevated` with the fallback icon centered.
- `ListRow` gains `titleLines?: 1 | 2`. With 2, the title gets `line-clamp-2 break-words` instead of truncating.
- `MediaRow` props: `thumbnailUrl?`, `thumbShape?`, `thumbSize?` (default md; sm when dense), `fallback?`, `title`, `meta?` (subtitle line), `detail?` (a third line, quieter), `live?: boolean` (true: `Badge tone="loss"` "Live"; false: neutral "Offline"; undefined: none), `badges?: ReactNode` (extra badges after the live one), `trailing?`, `chevron?`, `dense?`, `onClick?`, `href?`, `as?`, `className?`. It renders `ListRow` with `icon={<MediaThumb/>}` and `titleLines={2}`, the subtitle as meta plus detail, and `trailing` holding the badges column. A wrapper `MediaList` is not needed: use `ul` with `grid gap-2` or the existing list styling.
- `MediaChip({ thumbnailUrl?, label, onClick, action?: string })`: a pill button 44px tall with a 16:9 thumbnail 40px wide and the label truncated (max-w-56). `action` is a second, never-truncated span ("Bring back"), as streams' tray needs.

### Docs pages
- `site/components/split-stage.tsx` covers `SplitStage`, `SplitDividers`, `LayoutPresetPicker` and `LayoutPresetIcon`. Stories:
  - a live stage with 1-4 colored panes (use hue roles `bg-th-<hue>-soft` with the slot number), add and remove buttons, the preset picker, Equal sizes, and a swap selector (two Selects and Swap) that shows the stable DOM order;
  - a narrow story at 360 using `narrowLayout`;
  - a usage note on the flat-panes rule.
- `site/components/media-row.tsx`: `MediaRow` in every variant (wide, round, fallback, live, offline, extra badge, dense, chevron, long title), `MediaChip`, and `MediaThumb` shapes. Thumbnails are local data URIs or plain role-colored boxes; no external images.
- `site/components/list-row.tsx`: add a `titleLines={2}` story.

### Security, performance
- No network, no secrets. Thumbnails accept only https or relative URLs.
- `split-layout` has no dependencies. `SplitStage` re-renders only on size or layout change, and pane content is the consumer's.

## Tasks (ui; each runs in `C:\Code\ui-split-panes`, branch split-panes-media-row)

### T1 split-layout module
- Owns: `src/split-layout.ts`, `src/split-layout.test.ts`
- Change: port as specified; copy and adapt the streams layout tests to vitest (`describe`/`it`/`expect`).
- Acceptance: `npx vitest run src/split-layout.test.ts`, `npx tsc --noEmit -p tsconfig.json`.

### T2 Split components and docs page
- Owns: `src/components/split.tsx`, `site/components/split-stage.tsx`
- Depends on: T1
- Change: build `SplitStage`, `SplitDividers`, `LayoutPresetPicker`, `LayoutPresetIcon` and `presetOptions` as specified (port the streams code), JSDoc on every prop, and the docs page. Do not register it (T4 does).
- Acceptance: `npm run typecheck`, `npx eslint src/components/split.tsx site/components/split-stage.tsx`.

### T3 Media components and docs page
- Owns: `src/components/media.tsx`, `src/components/data.tsx` (the `titleLines` prop only), `site/components/media-row.tsx`, `site/components/list-row.tsx`
- Change: `MediaThumb`, `MediaRow` and `MediaChip`, plus `ListRow` `titleLines` and the docs page and story as specified.
- Acceptance: `npm run typecheck`, eslint on the owned files.

### T4 Wiring, docs registry, release notes, checks
- Owns: `src/index.ts`, `tsup.config.ts`, `package.json` (exports only), `src/css/components.css` (the `[data-dragging] iframe` rule), `site/components/index.ts`, `tools/site-all.visual.json`, `README.md`, `CHANGELOG.md` (an `## [Unreleased]` section if the file uses one, else the next minor heading the release script expects; read `scripts/release.mjs`)
- Depends on: T1, T2, T3
- Change:
  - export everything from `src/index.ts`;
  - add the `split-layout` standalone entry and the `./split-layout` export;
  - register the two new docs pages;
  - add `split-stage` and `media-row` entries to `site-all.visual.json`;
  - add README Components rows linking `https://design.nish.software/#/components/split-stage` and `.../media-row`;
  - add a CHANGELOG entry.
  - Then run `npm run check`, start `npm run dev:site` (port 5191), and run `node tools/visual-check.mjs tools/site-all.visual.json --only split-stage,media-row,list-row` (check that the report lists shots for each). Look at the 360 and 1440 shots in both themes. Stop the dev server.
- Acceptance: `npm run check` passes, and the visual check passes with shots present.

## Adoption tasks (after the release; a second Workflow)

### A1 streams
- Repo: `C:\Code\streams`, on the fan-out's `ui/vX.Y.Z` branch if it is still open, else a new branch `shared-split-media` from master.
- Change:
  - `shared/layout.ts` becomes re-exports from `@nish/ui/split-layout`, plus `MAX_STREAMS = MAX_PANES` (keep the file so the imports elsewhere stay put). Delete `shared/layout.test.ts`, since ui now tests the module.
  - `Stage.tsx` uses `SplitStage` (keeping the pick and drag logic in streams).
  - `Dividers.tsx`, `PresetIcon.tsx` and `ResultRow.tsx` are deleted.
  - `PresetPicker.tsx` becomes a thin wrapper over `LayoutPresetPicker`.
  - Results use `MediaRow`; EmptyStage and Tray chips use `MediaChip`.
  - Behavior and look are unchanged.
- Acceptance:
  - `npm run typecheck && npm run build && npm test && npm run lint`;
  - local fixture shots (`npm run shots` against a local fixture server) with 0 problems, compared by eye with the current live look;
  - the flat-panes check: tag iframes and confirm that swap, preset change, resize and edit toggle do not reload them (the mock players are divs: tag `[data-pane]` elements and confirm they are the same nodes).

### A2 nishboard
- Repo: `C:\Code\nishboard`, on the fan-out's `ui/vX.Y.Z` branch if it is still open, else `refactor/media-row` from master.
- Change:
  - `EmbedSearchWidget`'s `ResultRow` and `FolderRow` render `MediaRow` (dense, thumbShape wide or round, a ListVideo fallback for folders with chevron, live from `item.isLive`).
  - Keep the channel subtitle link: pass a `meta` node holding the existing clickable span.
  - Add a CHANGELOG entry per the repo's format. The PR title is `refactor: shared MediaRow for embed search results` (patch).
- Acceptance: `pnpm typecheck && pnpm lint && pnpm test`, and a look at the YouTube and Twitch widgets in `pnpm dev` at a typical tile size.

## Review focus
- The flat-panes rule in `SplitStage` (DOM order from `items`, never from slots).
- `split-layout` stays React-free; `dist/split-layout.js` imports nothing.
- 44px targets and keyboard support on the dividers and picker.
- The docs pages render at 360px with no sideways scroll.
- `ListRow` default behavior is unchanged.

## Release
1. ui PR, then merge.
2. `gh workflow run release.yml -R nishant/ui -f bump=minor`, then wait for the tag.
3. The fan-out runs. Adopt in streams and nishboard as above.
4. Verify:
   - design.nish.software shows both pages;
   - streams is live with the same look (live check script);
   - the nishboard release run is green.
