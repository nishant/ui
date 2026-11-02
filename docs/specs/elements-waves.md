# Elements waves 2 and 3, then the non-React fleet

Status: ready to build · Slug: elements-waves · Date: 2026-11-02 · Size: large
Repos: nishant/ui (spec lives here), nishant/nish.software, nishant/hosting, nishant/skills, nishant/artifacts
ROADMAP: `ROADMAP.md`, "Web components so @nish/ui works everywhere", "Close the nish-* vs React parity gaps", "`.nish-pill-link` in nish-components.css"

Stages A-C (npm by default, wave 1 elements in nish-ui 1.6.0, every artifact on the design system)
shipped under the deleted `nish-ui-everywhere` spec; this file continues it as Stages D-F, keeping
its goal numbers and the wave 1 pattern (`src/elements/`, Lit light DOM, `tests/elements`). Where
this file says "as in Stage B", read Stage B in `git show 9566074:docs/specs/nish-ui-everywhere.md`.

Stage C gaps found by session A, covered in Stage D: `.nish-callout--text` (running text in one
block), `.nish-pill-link` in nish-components.css (then the restated rule in artifacts'
`src/wrap.ts` goes, in Stage F), 44px `.nish-seg` buttons and 16px/44px `.nish-input` on coarse
pointers, `.nish-stats--4` (2 then 4 columns), a documented `light-dark()` pattern for colors that
must not flip with the theme, and `<nish-segmented>` for arrow keys.

The "Web components so @nish/ui works everywhere" ROADMAP entry is narrowed to Stages E-F in the
Stage D release PR and deleted when Stage F is live. The parity-gaps entry is closed in Stage D
(task D1) and deleted in its release PR. This spec is deleted in the PR that finishes Stage F.

## Goal (D-F)

12. `nish-ui/elements/forms` ships wave 2, and `nish-ui/elements/data` and
    `nish-ui/elements/charts` ship wave 3. Each is one self-contained file that works in plain
    HTML, any framework and Claude artifacts.
13. Every wave 2 and wave 3 docs page on design.nish.software has an HTML tab: the element's
    markup where the component needs behavior, the `nish-*` class markup where it does not.
14. Every element and every new class has a React-vs-HTML parity case that fails when the two
    drift. The wave 1 `KNOWN_GAPS` are gone: the nish-* CSS matches React.
15. React apps change nothing and never load Lit (as in Stage B).
16. The hub (nish.software), hosting's static sites (minecraft.nish.software and the demos page)
    and trip pages use the elements and classes instead of hand-rolled copies of the same pieces.

## Decisions (D-F)

- **Per-wave entry points.** The 20 KB gzip budget stays, per file. Wave 1 alone is 15.6 KB
  (Lit is about 6 KB of it), so one bundle for every wave would be 40-50 KB, and most pages use a
  handful of elements. Each file bundles its own Lit (about 6 KB per extra file, only on pages
  that load several), keeps `define()`'s skip-if-defined rule, and needs no other file:
  - `dist/elements.js` (`nish-ui/elements`): wave 1, unchanged.
  - `dist/elements-forms.js` (`nish-ui/elements/forms`): wave 2.
  - `dist/elements-data.js` (`nish-ui/elements/data`): wave 3 except charts.
  - `dist/elements-charts.js` (`nish-ui/elements/charts`): line and bar charts. Charts get their
    own file because they are the heaviest piece, and pages that need them (trip pages,
    artifacts) usually need nothing else from wave 3.
  `tools/elements-check.mjs` checks every `dist/elements*.js` against 20480 bytes gzipped, the
  no-import rule and the Lit-free React entry, and that each `dist/elements*.d.ts` compiles alone.
- **Element only where there is behavior** (as in Stage B). A piece that is only a look gets a
  `nish-*` class (new where none exists), an HTML tab and a parity case. Buttons, inputs and
  links stay native, so forms submit and links open.
- **New classes follow components.css**: every selector in `:where()`, tokens only, a usage
  comment with the markup at the top of each block, touch growth to 44px under a coarse pointer,
  and the React twin's sizes (read its Tailwind classes; 1 Tailwind unit = 4px).
- **Element shape** (as in Stage B): Lit light DOM through `NishElement`. Children the author
  wrote are moved into the rendered structure once (after parse, through `whenParsed`), never
  copied. Never `innerHTML` from attributes, data or option labels (text goes in through
  `textContent` or Lit text bindings). Attributes reflect. Events are `nish-<name>`
  CustomEvents that bubble, with the new value in `detail`; a native `change` is also fired where
  a form control would fire one. Elements that hold a value join forms through a hidden
  `<input name>` they keep in step.
- **Pure helpers are shared, not copied.** Filtering, number formatting, chart scales, the
  sparkline path and the split layout math live in plain TS modules (`src/chart.ts`,
  `src/format.ts`, `src/split-layout.ts`). An element imports them. If a helper sits inside a
  React file, move it to a plain module and import it back in the React file unchanged.
- **Not in the elements**: React-only plumbing (`useSaveStatus`, `useScrollSpy`,
  `useCommandHotkey`, `revealInRow`), `NumberField` (session B is changing it), `AppShell`,
  `LayoutPresetPicker` (specific to streams), Tabs' responsive `hideFrom`/`showFrom` panes, and
  the async-function form of `CommandPalette.items` (the element takes a list and fires
  `nish-query`).
- **The docs frame** loads every element file, so any HTML tab can use any element.
- **Stage F scope**: swap a hand-rolled piece only where an element or class now covers it; keep
  each page's content, behavior and storage keys. The minecraft site has hundreds of generated
  pages: change the shared templates, `assets/site.js`, `assets/*.css` and the generators, not
  pages one by one.

## Design (D-F)

### Usage

```html
<script src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/theme-init.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/nish.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/nish-components.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-forms.js"></script>
```

Bundlers: `import 'nish-ui/elements/forms';` (`@nish/ui/elements/forms` in fleet apps). Each file
also exports its classes. Load only the files whose tags the page uses.

### Stage D: wave 2 (`elements-forms.js`)

New or changed classes (all in `src/css/components.css`):

| Class | React twin | Markup |
|---|---|---|
| `.nish-textarea--grow` | `Textarea autoGrow` | `field-sizing: content`, min height from `rows`, no resize handle |
| `.nish-tabs` (+ `--pill`, `--sm`, `--xs`, `--block`), `.nish-tab` | `Tabs` (underline default, pill) | `<div class="nish-tabs" role="tablist"><button class="nish-tab" role="tab" aria-selected="true">…</button></div>` |
| `.nish-combobox`, `-input`, `-clear`, `-list`, `-option`, `-hint`, `-empty`, `-loading` | `Combobox` | an input with a clear button and a listbox popover under it |
| `.nish-list` (the `<ul>`), `.nish-list-row` (+ `--dense`, `--compact`, `--danger`), `-icon`, `-text`, `-title` (+ `-title--2`), `-subtitle`, `-meta`, `-trailing`, `-chevron` | `ListRow` | `<a class="nish-list-row" href>`, `<button>` or `<div>`; `aria-current` gives the active tint |
| `.nish-kbd` | `Kbd` | `<kbd class="nish-kbd">Ctrl K</kbd>` |
| `.nish-page-header`, `-title`, `-subtitle`, `-actions` | `PageHeader` | `<header class="nish-page-header">` |
| `.nish-section-header`, `-title`, `-actions` | `SectionHeader` | `<div class="nish-section-header">` |
| `.nish-kv`, `.nish-kv-row` (`dt`, `dd` inside) | `KeyValueList` | `<dl class="nish-kv"><div class="nish-kv-row"><dt>…</dt><dd>…</dd></div></dl>` |
| `.nish-legend`, `-item`, `-swatch` | `ChartLegend` | swatch color through `--c` on the item |
| `.nish-sparkline` | `Sparkline` | the svg the element draws |
| `.nish-app-header`, `-back`, `-name`, `-nav`, `-tools` | `AppHeader` | the top bar: back link, name, nav, tools slot |
| `.nish-copy-btn` (state `[data-copied]`) | `CopyButton` | a `.nish-btn` or `.nish-icon-btn` that shows "Copied" |

Classes that exist and get an HTML tab and a parity case only: `.nish-input`, `.nish-select`,
`.nish-textarea`, `.nish-label`, `.nish-field` (+ `--inline`, `fieldset.nish-field`),
`.nish-checkbox` / `.nish-check-row`, `.nish-switch`, `.nish-search`, `.nish-chip` / `.nish-chips`,
`.nish-seg`, `.nish-skeleton*`, `.nish-spinner*`, `.nish-empty`, `.nish-error-state`,
`.nish-callout*`, `.nish-dot*`, `.nish-stats` / `.nish-stat*`, `.nish-meter*`,
`details.nish-disclosure`. Where a parity case finds a difference, the CSS changes to match React
(React never changes).

Elements:

| Element | Markup it renders | Behavior and API |
|---|---|---|
| `<nish-field label hint error optional layout="inline" label-width>` | wraps its one child control in a `.nish-field` (`--inline` for `layout="inline"`; `label-width` sets `--nish-field-label-w`): `<label class="nish-field-label" for>` (+ `<span class="nish-optional">Optional</span>`), the control, `<small class="nish-hint" id>`, `<small class="nish-error" role="alert" id>` | Gives the control an id if it has none. Sets `aria-describedby` to the error id while `error` is set, else the hint id. Sets `aria-invalid="true"` on the control while `error` is set; the hint hides while an error shows. A child `<nish-combobox>` or `<nish-search>` gets the id on its inner input. Attribute changes update all of it. |
| `<nish-search value placeholder label size="xs\|sm\|md" variant="bare" name>` | `<label class="nish-search">` + search icon svg + `<input class="nish-input" type="search">` + a clear `<button class="nish-icon-btn" aria-label="Clear">` shown while there is text | `label` is the input's aria-label (default "Search"). Typing fires `input` (native, from the input) and `nish-input` (`detail: { value }`). The clear button, and Escape while there is text, empty it, fire `nish-input` and `nish-clear`, and keep focus in the input. `value` reads and writes. `name` goes on the input. |
| `<nish-switch checked disabled label description size="sm" label-side="end" name>` | a `.nish-check-row` holding `<button type="button" class="nish-switch" role="switch" aria-checked>` and the label and description text | Click, Space and Enter toggle `checked` and fire `change` and `nish-change` (`detail: { checked }`). A hidden input with `name` holds `on` while checked. `aria-labelledby` / `aria-describedby` tie the text. |
| `<nish-chip-group label scroll single>` | wraps child `<button>`s in `<div role="group" class="nish-chips" aria-label>` (+ `nish-chips--scroll`); each gets `nish-chip` and `type="button"` | Click flips `aria-pressed`; `single` keeps at most one pressed. Fires `nish-change` (`detail: { values }`, each chip's `value` attr, else its text). A child `<span class="nish-chip" data-removable>` gets a remove button ("Remove <text>") that removes the chip and fires `nish-remove` (`detail: { value }`). `values` reads and writes. |
| `<nish-combobox value placeholder label allow-custom empty-text size disabled loading name>` with child `<option value data-hint>Label</option>`s, or the `options` property (`{ value, label, hint? }[]`) | `.nish-combobox` > `input.nish-input.nish-combobox-input[role=combobox]` + clear button + `ul.nish-combobox-list[role=listbox]` > `li.nish-combobox-option[role=option]` (label + `.nish-combobox-hint`), or `.nish-combobox-empty` | The keyboard model of React `Combobox` (read `src/components/combobox.tsx`): opens on focus and typing; ArrowDown/Up, Home/End move; Enter commits; Escape closes, a second Escape clears; `aria-activedescendant`. Default filter: case-insensitive substring on label and hint, at most 50 shown. `allow-custom` commits typed text. Typing fires `nish-query` (`detail: { query }`, debounced 200 ms); `loading` shows a "Searching…" row with a `.nish-spinner`; replace `options` for server search. A commit fires `change` and `nish-change` (`detail: { value, option }`); clearing fires them with `null`. A hidden input with `name` holds the value. The list flips above the input when there is no room below. |
| `<nish-tabs label value variant="pill" size="sm\|xs" block>` with child `<button value>` tabs | moves the buttons into `div.nish-tabs[role=tablist]` (classes from the attrs, `aria-label`); each gets `nish-tab`, `role=tab`, an id and `aria-controls` | Panels are elements with `data-tab-panel="<value>"` and `data-tabs="<this id>"` anywhere in the document (or inside this element when it has no id). Each gets `role=tabpanel`, `aria-labelledby`, and `hidden` unless selected. Click and ArrowLeft/Right/Home/End select (selection follows focus, roving `tabindex`). Fires `nish-change` (`detail: { value }`). With no `value` (or one that matches no tab) the first tab is selected and `value` is set. |
| `<nish-segmented label value size="xs\|md" block overflow="wrap" name>` with child `<button value>` | moves them into `div.nish-seg[role=radiogroup][aria-label]`; each `role=radio`, `aria-checked` | Click and arrows select (roving `tabindex`), fire `nish-change` (`detail: { value }`) and `change`; `name` keeps a hidden input. `overflow` defaults to `scroll`: one row that scrolls sideways with edge fades and keeps the checked one in view (as React). |
| `<nish-copy-button value for label="Copy" copied-label="Copied" icon>` | `button.nish-btn.nish-btn--sm.nish-copy-btn` (or `nish-icon-btn` with `icon`) | Copies `value`, else the `textContent` of the element whose id is `for`, with `navigator.clipboard.writeText`. Sets `data-copied` and shows the copied label for 1.5 s, announced through an `aria-live="polite"` span. Fires `nish-copy` (`detail: { text }`). |
| `<nish-sparkline values="3,5,4,8" tone label width height>` | `svg.nish-sparkline` (`role=img`, `aria-label` from `label`), the same path and area as React `Sparkline` | `tone`, `width`, `height` take React `Sparkline`'s names and defaults. Redraws when `values` changes. Fewer than two values draws nothing. |

Wave 1 parity gaps (ROADMAP "Close the nish-* vs React parity gaps"): change the `.nish-toast`,
`dialog.nish-sheet`, `dialog.nish-dialog` and `.nish-bottom-nav` CSS until no wave 1
`KNOWN_GAPS` entry in `tests/elements/parity.spec.ts` shows up, then delete the entries (keep the
`KNOWN_GAPS` mechanism). The toast gets React's tone icon: `showToast` in `src/theme.ts` adds the
svg, with the icon paths React `toast` uses.

Edge cases (D):
- A field whose child control is added later (a framework renders it after the element): wire it
  on the next child mutation.
- A combobox with no matching options and no `allow-custom`: shows `empty-text` ("No matches").
- Segmented with a `value` not among the buttons: none is checked; Tab still reaches the first.
- Copy without clipboard permission (claude.ai frames refuse it): select the text and show
  "Press Ctrl+C" for 1.5 s.
- Elements made with `document.createElement` and filled before they are connected wrap their
  children on connect.

### Stage E: wave 3 (`elements-data.js`, `elements-charts.js`)

New classes:

| Class | React twin |
|---|---|
| `.nish-table` (+ `--dense`, `--zebra`), `th.nish-th` (+ `--num`; `[aria-sort]` with a `.nish-th-sort` button), `td.nish-td--num`, `tr.nish-tr--interactive`, `--muted`, `--ok`, `--warn`, `--loss`; `.nish-table-wrap` gains `--sticky`, `--sticky-first`, `--fade` | `Table`, `Th`, `Td`, `Tr`, `TableWrap` |
| `.nish-filter-bar`, `-search`, `-chips`, `-trailing`, `-summary`, `.nish-filter-btn` (with a count badge) | `FilterBar` |
| `.nish-media-thumb` (+ shape and size modifiers from React's `MediaThumbShape`/`MediaThumbSize`), `.nish-media-row` (+ `-title`, `-meta`, `-detail`, `-badges`, `--live`, `--dense`, `--compact`), `.nish-media-chip` | `MediaThumb`, `MediaRow`, `MediaChip` |
| `.nish-split`, `.nish-split-pane`, `.nish-split-divider` (+ `--h`, `--v`, `[data-dragging]`) | `SplitStage`, `SplitDividers` |
| `.nish-nav-rail`, `-item`, `-tools`, `-footer` | `NavRail` |
| `.nish-scroll-row` (+ `--bleed`, `--snap`; fades from `data-at-start` / `data-at-end`) | `ScrollRow` |
| `.nish-settings-section`, `-header`, `-title`, `-description`, `-actions`, `-body`; `.nish-setting-row` (+ `--stacked`, `--inline`), `-label`, `-description`, `-control`, `-status` (+ `--error`, `--ok`) | `SettingsSection`, `SettingRow` |
| `.nish-command`, `-input`, `-list`, `-group`, `-item` (`[aria-selected="true"]`), `-item-hint`, `-empty`, `-footer` | `CommandPalette` (in a top-anchored modal box, as React) |
| `.nish-chart`, `-tooltip`, `-axis`, `-grid`; `.nish-range-bar` (+ `-fill`, `-current`, `-labels`) | `LineChart`, `BarChart`, `RangeBar` |

`.nish-subnav` (the static SectionNav) and `MoreSheet` (a `<nish-sheet>` holding `.nish-list-row`
links) get HTML tabs and parity cases only. `RangeBar` is a class only (`--low`, `--high`,
`--current` as percentages on `.nish-range-bar`).

Elements (`elements-data.js` unless noted):

| Element | Behavior and API |
|---|---|
| `<nish-table-sort manual>` wrapping a `<table class="nish-table">` | Every `th[data-sort]` gets a `.nish-th-sort` button. A click sorts the `tbody` rows by that column (numeric when the column is `nish-th--num` or every key parses as a number, else `localeCompare`), cycles `aria-sort` none → ascending → descending, and fires `nish-sort` (`detail: { column, direction }`). `manual`: only fire the event (server sorting). A cell's key is its `data-value`, else its text. Blank keys sort last both ways. |
| `<nish-filter-bar active-count sheet-title="Filters" sheet-below="md\|lg" sticky>` | Lays out `.nish-filter-bar`: a child `<nish-search>` goes in the search slot, other children in the chips row, `[data-slot="trailing"]` and `[data-slot="summary"]` in theirs. Below `sheet-below` (default md) the chips row moves into a `<nish-sheet>` opened by a "Filters" `.nish-filter-btn` showing `active-count`, with "Clear" (fires `nish-clear`) and "Show results" (closes it). Children are moved, never copied, so their listeners keep working; crossing the breakpoint moves them back (closing the sheet first). |
| `<nish-split orientation="row\|column" sizes="50,50" min="120" storage-key>` with child panes | Children become `.nish-split-pane`s with a `.nish-split-divider` between each pair. Pointer drag, and arrow keys on a divider (`role=separator`, `aria-orientation`, `aria-valuenow`, step 5%), resize; `sizes` reflects, `nish-resize` fires (`detail: { sizes }`), and `storage-key` saves sizes in localStorage (try/catch; a saved value whose length does not match the pane count is ignored). Below 640px under a coarse pointer the panes stack and the dividers hide. Iframes inside get `pointer-events: none` while dragging (the existing split drag rule). Nesting `<nish-split>` gives SplitStage's 2D layouts. |
| `<nish-nav-rail label>` with child `<a>`s, plus children with `data-slot="tools"` / `"footer"` | Wraps into `nav.nish-nav-rail`; the same current-link rule as `<nish-bottom-nav>` (move that logic into `src/elements/current-link.ts`, used by both). |
| `<nish-scroll-row label bleed snap fade>` | Wraps children in `.nish-scroll-row`; sets `data-at-start` / `data-at-end` on scroll and resize; scrolls a child with `aria-current` or `aria-selected="true"` into view on connect. |
| `<nish-section-nav label sticky update-hash>` with child `<a href="#id">` | Wraps them in `nav.nish-subnav` and calls `mountScrollspy`. A click scrolls smoothly (instant under reduced motion) and, with `update-hash`, replaces the hash. Fires `nish-select` (`detail: { id }`). |
| `<nish-command-palette open hotkey placeholder empty-text>` with child `<a href data-group data-hint data-keywords>` / `<button data-group …>` items, or the `items` property (`{ id, label, group?, hint?, keywords?, href? }[]`) | Renders `.nish-command` inside a modal `<dialog>`. `hotkey` opens it on Ctrl/Cmd+K anywhere except while typing in another field. Every query word must match label, hint or keywords (case-insensitive); groups keep their order. ArrowUp/Down move, Enter follows `href` or fires `nish-select` (`detail: { id }`) and clicks a button item, Escape closes, focus returns to the opener. Typing fires `nish-query` (`detail: { query }`) for server results; set `items` to replace them. `open` reflects; `nish-close` fires on close. One dialog however often the hotkey is pressed. |
| `<nish-line-chart>` and `<nish-bar-chart>` (`elements-charts.js`) | `data` (JSON attribute or property), `label` (required, the `aria-label`), `height`, `tone`, `area`, `baseline`, `y-ticks` / `x-ticks`, `y-format` / `x-format` (`number`, `percent`, `currency:USD`, `date`, `time`, built on `src/format.ts`), bars also `show-values`. `series` (attribute or property) draws several lines with a `.nish-legend`. Same scales, ticks, colors and hover tooltip as React (`src/chart.ts`); pointer and arrow-key scrubbing; redraws on resize (ResizeObserver) and on theme change. One point: a dot, no line. Equal values: a flat line mid-height. Empty data: `.nish-empty` with the `empty` text (default "No data yet"). |

### Stage F: the non-React fleet on the elements

- **Hub** (`nishant/nish.software`, Vite + vanilla TS, pins `npm:nish-ui@X.Y.Z`): the header's
  theme button becomes `<nish-theme-toggle labelled pill>` (import `@nish/ui/elements`), and
  hand-written styles that duplicate a `nish-*` class use the class. Keep the layout, the legacy
  theme-key migration in `src/theme.ts` and the status probes.
- **hosting static sites**: `scripts/sync-ui.mjs` vendors every `elements*.js` listed in
  `files.json` into `minecraft/site/assets/nish/` and `static/demos/nish/`. minecraft.nish.software:
  the shared templates and `assets/site.js` swap their hand-rolled theme button, tabs, segmented
  switches, copy buttons, search boxes and sheets for the elements, and their CSS drops the
  copies. The demos page likewise.
- **Trip pages** (`nishant/skills`, `skills/trip-plan`): the template and
  `scripts/encrypt-trip.mjs` use `<nish-tabs>`, `<nish-section-nav>`, `<nish-copy-button>`,
  `.nish-list-row` and `.nish-kv` where the template has its own versions, and load the element
  files it uses.
- **Skills**: `skills/ui-component/SKILL.md` names the entry file a new element goes in;
  `skills/artifacts/references/site.md` and `theme-bridge.md` list the four element files.

## Tasks (D-F)

Checkouts: ui at `C:\Code\ui-elements-waves` (branch `elements-waves`; Stage E on a new branch from
master after Stage D is released). Stage F: one worktree per repo.

Every element task: read `src/elements/base.ts`, `src/elements/dialog.ts` and
`src/elements/bottom-nav.ts` for the pattern, and the React twin's source for sizes, classes and
keyboard behavior. Never change a React component's behavior or props.

### D0 Build wiring for the new entry files
- Owns: `tsup.config.ts`, `package.json` (not the lockfile), `scripts/build.mjs`, `tools/elements-check.mjs`; creates stubs `src/elements/forms.ts`, `data.ts`, `charts.ts`, `public-forms.d.ts`, `public-data.d.ts`, `public-charts.d.ts` (each `export {};` with a one-line comment; later tasks fill them)
- Depends on: none
- Change: tsup entries `elements-forms`, `elements-data`, `elements-charts` with the `elements`
  entry's options (one self-contained ESM file each, Lit bundled, minified, no splitting), and
  their `public-*.d.ts` copied to `dist/elements-forms.d.ts` etc. package.json `exports`
  `./elements/forms`, `./elements/data`, `./elements/charts` (types/import/default) and matching
  `typesVersions` keys `elements/forms`, `elements/data`, `elements/charts`. `files.json`
  `static` gets the three files. `elements-check.mjs` loops over every `dist/elements*.js` (and
  its `.d.ts`) with the existing rules and prints one ok line per file.
- Acceptance: `npm run build` and `node tools/elements-check.mjs` pass with the stubs.

### D1 Wave 2 classes and the wave 1 parity gaps
- Owns: `src/css/components.css`, `src/theme.ts` (only `showToast`'s icon)
- Depends on: none
- Change: the new classes in the Stage D table, from the React twins' Tailwind classes, and the
  wave 1 gap fixes. Check each class in the "exist" list against its React twin and align
  what differs. The `KNOWN_GAPS` entries in `tests/elements/parity.spec.ts` give the exact wave 1
  differences to remove.
- Acceptance: `npm run check` passes.

### D2 Form, copy and sparkline elements
- Owns: `src/elements/field.ts`, `search.ts`, `switch.ts`, `chip-group.ts`, `copy-button.ts`, `sparkline.ts` (new); `src/sparkline-path.ts` (new) if the path math has to leave `src/components/display.tsx` (then the only display.tsx edit is importing it back)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D3 Combobox element
- Owns: `src/elements/combobox.ts` (new); `src/combobox-filter.ts` (new) if the default filter has to leave `src/components/combobox.tsx` (imported back unchanged)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D4 Tabs and segmented elements
- Owns: `src/elements/tabs.ts`, `src/elements/segmented.ts` (new)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D5 Wave 2 entry, public types, README, CHANGELOG
- Owns: `src/elements/forms.ts`, `src/elements/public-forms.d.ts`, `src/elements/public-check.ts`, `README.md`, `CHANGELOG.md`, `docs/DEVELOPING.md` (only where it lists element files)
- Depends on: D2, D3, D4
- Change: `forms.ts` imports the nine element modules, exports their classes and `define`, and
  augments `HTMLElementTagNameMap`. `public-forms.d.ts` declares them as `HTMLElement`
  subclasses (the `public.d.ts` pattern, no lit import, its own `NishElement` declaration).
  `public-check.ts` gets a `fits` line per class. README "Without React" lists the four entry
  files in one short list. CHANGELOG `## [Unreleased]`: "`nish-ui/elements/forms`:
  `<nish-field>`, `<nish-search>`, `<nish-switch>`, `<nish-chip-group>`, `<nish-combobox>`,
  `<nish-tabs>`, `<nish-segmented>`, `<nish-copy-button>` and `<nish-sparkline>`; new classes for
  tabs, list rows, headers, key-value lists and legends; the toast, sheet, dialog and bottom nav
  classes now match React."
- Acceptance: `npm run check` (elements-forms.js under 20 KB gzipped).

### D6 Docs: forms, combobox, tabs, segmented, list row
- Owns: `site/pages/component.tsx` (the frame loads all four element files), `site/pages/static-sites.tsx` (lists the entry files), and in `site/components/`: `input.tsx`, `select.tsx`, `textarea.tsx`, `field.tsx`, `field-group.tsx`, `label.tsx`, `checkbox.tsx`, `switch.tsx`, `search-input.tsx`, `chip.tsx`, `combobox.tsx`, `tabs.tsx`, `segmented.tsx`, `list-row.tsx`
- Depends on: D1, D5
- Change: an `html` entry on each page: element markup for elements, class markup otherwise, with
  `https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/...` URLs as the existing `html` pages do.
- Acceptance: `npm run build:site`; each HTML tab renders at 360 and 1440 in light and dark.

### D7 Docs: feedback and display
- Owns, in `site/components/`: `skeleton.tsx`, `skeleton-rows.tsx`, `skeleton-presets.tsx`, `spinner.tsx`, `empty-state.tsx`, `error-state.tsx`, `callout.tsx`, `status-dot.tsx`, `stat.tsx`, `meter.tsx`, `sparkline.tsx`, `disclosure.tsx`, `kbd.tsx`, `copy-button.tsx`, `page-header.tsx`, `app-header.tsx`, `section-header.tsx`, `key-value-list.tsx`, `chart-legend.tsx`
- Depends on: D1, D5
- Acceptance: as D6.

### D8 Wave 2 parity
- Owns: `tests/elements/react.tsx`, `tests/elements/elements.ts`, `tests/elements/parity.spec.ts`
- Depends on: D1, D5
- Change: `elements.ts` also imports `src/elements/forms`. One case per element and per class in
  the Stage D tables, for each state that changes the look (checked switch, pressed chip, selected
  tab in each variant, open combobox with an active option, list row active and danger, each
  callout and dot tone, empty and error state), with the wave 1 sizes, schemes and properties.
  Delete the wave 1 `KNOWN_GAPS` entries. A new difference is fixed in the CSS, never listed.
- Acceptance: `npx playwright test tests/elements/parity.spec.ts`.

### D9 Wave 2 behavior
- Owns: `tests/elements/forms.html`, `tests/elements/forms.ts`, `tests/elements/forms.spec.ts` (new)
- Depends on: D5
- Change: a harness page with every wave 2 element, and specs for: field wiring (ids,
  `aria-describedby`, `aria-invalid`, hint hidden while an error shows, a late child); search
  clear and Escape; switch click/Space/Enter, `change`, hidden input; chip group single and
  multiple, `values`, remove; combobox keyboard (open, move, Enter, Escape twice, Home/End),
  filter, `allow-custom`, `nish-query` debounce, `loading` row, form submit value; tabs click and
  arrows, panels, `aria-controls`; segmented arrows and `change`; copy with a stubbed clipboard
  and a rejecting one; sparkline redraw. Loading `dist/elements-forms.js` a second time does not
  throw. Stop the harness server afterwards (CLAUDE.md trap).
- Acceptance: `npx playwright test tests/elements/forms.spec.ts`.

### E0 Wave 3 classes
- Owns: `src/css/components.css` · Depends on: Stage D released
- Acceptance: `npm run check`.

### E1 Table sort, filter bar, scroll row, section nav, nav rail
- Owns: `src/elements/table-sort.ts`, `filter-bar.ts`, `scroll-row.ts`, `section-nav.ts`, `nav-rail.ts`, `current-link.ts` (new), and `src/elements/bottom-nav.ts` (only to use `current-link.ts`; behavior unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`; `npx playwright test tests/elements/behavior.spec.ts` still passes.

### E2 Split and command palette
- Owns: `src/elements/split.ts`, `src/elements/command-palette.ts` (new); `src/command-filter.ts` (new) if the filter has to leave `src/components/command.tsx` (imported back unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`.

### E3 Charts
- Owns: `src/elements/line-chart.ts`, `src/elements/bar-chart.ts`, `src/elements/chart-format.ts` (new); `src/chart.ts` (scale and tick helpers moved out of `src/components/charts.tsx` if they live there, imported back unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`.

### E4 Wave 3 entries, types, README, CHANGELOG
- Owns: `src/elements/data.ts`, `src/elements/charts.ts`, `src/elements/public-data.d.ts`, `src/elements/public-charts.d.ts`, `src/elements/public-check.ts`, `README.md`, `CHANGELOG.md`
- Depends on: E1, E2, E3
- Change: as D5 for the two files. CHANGELOG `## [Unreleased]`: "`nish-ui/elements/data`:
  `<nish-table-sort>`, `<nish-filter-bar>`, `<nish-split>`, `<nish-nav-rail>`,
  `<nish-scroll-row>`, `<nish-section-nav>` and `<nish-command-palette>`;
  `nish-ui/elements/charts`: `<nish-line-chart>` and `<nish-bar-chart>`; classes for tables,
  filter bars, media rows, settings, split panes, the nav rail and the range bar."
- Acceptance: `npm run check`; both files under 20 KB gzipped.

### E5 Docs: wave 3
- Owns, in `site/components/`: `table.tsx`, `responsive-table.tsx`, `filter-bar.tsx`, `media-row.tsx`, `split-stage.tsx`, `nav-rail.tsx`, `more-sheet.tsx`, `scroll-row.tsx`, `section-nav.tsx`, `settings.tsx`, `command-palette.tsx`, `line-chart.tsx`, `bar-chart.tsx`, `range-bar.tsx`, `chart.tsx`
- Depends on: E0, E4
- Acceptance: as D6.

### E6 Wave 3 parity and behavior
- Owns: `tests/elements/react.tsx`, `tests/elements/elements.ts`, `tests/elements/parity.spec.ts`, `tests/elements/data.html`, `tests/elements/data.ts`, `tests/elements/data.spec.ts` (new)
- Depends on: E0, E4
- Change: parity cases for each Stage E class and element state; behavior specs for each element's
  API and edge cases. Loading both files twice does not throw.
- Acceptance: `npx playwright test tests/elements`.

### F1 Hub on the elements
- Repo: nishant/nish.software · Owns: `src/render/*.ts`, `src/theme.ts`, `src/main.ts`, `src/styles/*.css`, `index.html`, their tests
- Depends on: Stage E released and the hub's fan-out bump merged
- Acceptance: the repo's PR checks; screenshots at 360, 840 and 1440 in light and dark match before/after except where a piece became the shared one.

### F2 hosting static sites on the elements
- Repo: nishant/hosting · Owns: `scripts/sync-ui.mjs` and its test, `minecraft/site/_template/*`, `minecraft/site/assets/site.js`, `minecraft/site/assets/*.css`, the minecraft page generator(s), `static/demos/index.html`
- Depends on: Stage E released
- Acceptance: hosting's PR checks; the minecraft home, one guide page, one bigbuild page and the demos page at 360, 840 and 1440 in light and dark.

### F3 Trip pages and skills
- Repo: nishant/skills · Owns: `skills/trip-plan/**`, `skills/ui-component/SKILL.md`, `skills/artifacts/references/site.md`, `skills/artifacts/references/theme-bridge.md`
- Depends on: Stage E released
- Acceptance: re-encrypt one existing trip and check it at 360 and 1440 in light and dark.

## Waves (D-F)

Stage D: W1: D0, D1 · W2: D2, D3, D4 · W3: D5 · W4: D6, D7, D8, D9 · review and fix · release (minor).
Stage E (after D is released): W1: E0, E1, E2, E3 · W2: E4 · W3: E5, E6 · review and fix · release (minor).
Stage F (after E is released): F1, F2, F3.

## Review focus (D-F)

- Every element file under 20 KB gzipped and self-contained; `dist/index.js` and its chunks Lit-free.
- Light DOM moves children once, survives DOM moves and frameworks that render children late, and
  leaves no document or window listeners behind after disconnect.
- Keyboard models match React: combobox, tabs, segmented, command palette, split dividers.
- Hidden inputs keep form submission working; native `change` fires where a control would.
- No `innerHTML` from attributes, data or option labels.
- Parity: no `KNOWN_GAPS` left; cases cover every class and state in the tables.
- Docs at 360px: the HTML tabs fit with no horizontal scroll.
- Stage F: nothing lost on the hub, minecraft or trip pages (content, storage keys, theme cookie).

## Release (D-F)

- **Stage D.** Merge the ui PR. Before dispatching, `gh run list -R nishant/ui -w release` and
  `-w fanout` show nothing in progress; then `gh workflow run release.yml -R nishant/ui -f
  bump=minor`. Live: `npm view nish-ui version` equals the tag;
  `curl -sI https://cdn.jsdelivr.net/npm/nish-ui@<ver>/dist/elements-forms.js` returns 200;
  design.nish.software shows the wave 2 HTML tabs at 360 and 1440 in light and dark; a scratch
  page with the wave 2 tags works.
- **Stage E.** The same for `elements-data.js` and `elements-charts.js`.
- **Stage F.** Each repo's PR merged and deployed; nish.software, minecraft.nish.software, the
  demos page and one trip page checked live at 360 and 1440 in light and dark. Then the "Web
  components" ROADMAP entry is deleted, or narrowed to what is left.
