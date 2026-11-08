# Date ranges, a time field and a faster TreeView

Status: in progress · Slug: range-picker · Date: 2026-11-07 · Size: medium
Repos: nishant/ui (public; spec lives here), checkout `C:\Code\ui-range-picker`, branch `range-picker`
ROADMAP: `ROADMAP.md` "Ideas": **Date range and time picking** and **TreeView re-renders every open row on each focus move** (the release PR deletes both and rewrites the numbers in **Root bundle back to 100 KB**)

## Goal

Apps can pick a span of days (a trip, a report period) and a time of day with the same look, keys and
44px touch targets as `Calendar` and `DatePicker`, and `TreeView` stays fast on big open trees. Ships as
2.2.0, a minor: nothing that exists today changes its props, its values or its behavior.

1. `RangeCalendar`: a month grid that picks `{ from, to }` with two presses, a hover (and keyboard focus)
   preview of the band, a swap when the second day is earlier, a one-day range on the same day twice,
   Escape to drop a half-picked range, and min, max and disabled days like `Calendar`.
2. `DateRangePicker`: a typed range field (both dates in the reader's numeric order or ISO) with a
   `RangeCalendar` in a Popover; the value is `{ from, to }` and it posts `from/to` with a form.
3. `TimeField`: an hour box and a minute box (plus AM/PM where the locale uses it) with spinbutton keys,
   auto-advance while typing, 44px boxes on touch, value `HH:mm` (24-hour) like `<input type="time">`.
4. `Calendar` and `DatePicker` keep their API and render the same markup and classes as 2.1.1; their
   existing test files pass without edits.
5. `TreeView`: a focus move on a fully open 2,000-node tree renders exactly 2 rows (the old and the new
   Tab stop), checked by a render-count test.
6. Every new component has a docs page on design.nish.software, a props table with every prop described,
   SSR and hydration cases, axe-clean browser specs at 360, 840 and 1280 px, and size budgets.

## Out of scope

- A `mode` prop on `Calendar` or `DatePicker` (range lives in its own components, see Decisions).
- Two months side by side, range presets ("Last 7 days"), minimum or maximum range length, a clear button.
- Seconds, time zones, `Date` objects, a combined DateTimePicker component, a time dropdown list,
  overnight time windows (min later than max).
- Lit custom elements (`src/elements`) for any of these.
- TreeView virtualization, and per-component string defaults (the separate "Root bundle" ROADMAP item).
- Adopting the new components in any app (no app needs them today; the fan-out bump PRs need no code).

## Decisions

- **Range is two new components, `RangeCalendar` and `DateRangePicker`, not a `mode` prop.** The value types
  differ (`string` vs `{ from, to }`), so separate prop types keep docgen tables and TypeScript simple, and an
  app that imports `Calendar` or `DatePicker` pays nothing for range code (the root bundle is already over its
  100 KB target). Precedent: React Aria's `RangeCalendar`/`DateRangePicker`.
- **`Calendar`'s body moves into an internal `CalendarBase`** (`src/components/calendar-base.tsx`, not exported
  from `src/index.ts`) that both `Calendar` and `RangeCalendar` wrap, so the grid, keys, captions and focus logic
  exist once. `Calendar`'s output stays byte-for-byte the same; its tests are the guard.
- **`onValueChange` of `RangeCalendar` fires only with a complete range.** The first press is internal state (the
  "anchor"); a half range is never reported, so form values are never half-filled.
- **Second press earlier than the first swaps** (`from` is the earlier day). **Same day twice** is a one-day range
  (`from === to`). (default)
- **A range may not contain a disabled day** (`isDateDisabled`) unless `allowDisabledInRange` is set; a second press
  that would cover one starts a new range at that day, and the preview does not draw across one. Precedent: React
  Aria `allowsNonContiguousRanges` (default false). Days outside `min`/`max` can never be inside a range whose ends
  are inside it, so only `isDateDisabled` is scanned, at most 3,660 days.
- **`DateRangePicker` is one text input**, "11/05/2026 – 11/09/2026" (en dash with spaces), not two. One input works
  inside `Field` with no labeling tricks, fits 360px, and needs one hidden input. Parsing splits on digit runs, so
  any separator works (`–`, `-`, `/`, a space).
- **The form value of `DateRangePicker` is an ISO 8601 interval**, `2026-11-05/2026-11-09`, in one hidden input
  under `name`; empty string when there is no range.
- **`TimeField` is two `<input role="spinbutton">` boxes plus a native `Select` for AM/PM**, not a single text box
  and not a native `<input type="time">` (whose look and 12/24-hour choice the browser owns). The value is
  `HH:mm` in 24-hour time; the 12/24-hour display comes from the locale (`Intl` `hourCycle`), `hourCycle` overrides.
- **TimeField commits on every complete, valid edit** (like a native time input fires `input`), not on blur; an
  incomplete or impossible entry is only marked invalid when focus leaves the field.
- **`Field`'s `<label>` gets `id="<controlId>-label"`.** It is the only change to existing markup (one attribute),
  and it lets a multi-box control (`TimeField`) name each box "<label> Hour" / "<label> Minute" through
  `aria-labelledby`. Without a `Field`, `aria-label` or `aria-labelledby` on `TimeField` does the same.
- **TreeView renders its visible rows as one flat list** (`<ul role="tree">` with `<li role="treeitem">` siblings),
  keyed by id, each a memoized `TreeItem` with only primitive or stable props (node, level, posinset, setsize,
  open, selected, isTarget, labelId and three stable callbacks). Today's nested `<ul role="group">` lists make every
  open parent re-render on each key (its `children` prop is a new array), which is why a focus move costs every
  open branch. WAI-ARIA allows a flat tree when every item has `aria-level`, `aria-setsize` and `aria-posinset`,
  which TreeView already sets; indentation already comes from `paddingInlineStart`, so it looks the same. The
  nested `role="group"` lists disappear from the DOM; the CHANGELOG says so under "Changed". This also prepares
  TreeView for virtualization. Rejected: an external store with per-row `useSyncExternalStore` (needs a second
  commit per key and breaks the focus-restore effect when a branch collapses).
- **New strings (9) go in `DEFAULT_STRINGS`** like every other string (component contract rule 5). Each costs about
  0.011 KB gzip in every component that reads strings; 9 keep the tight rows (Modal, VirtualTable, HoverCard,
  SystemCanvas, AppShell have 0.19 to 0.26 KB headroom) inside budget.
- **Exports from the root entry**, like every other component. Expected gzip cost of the "everything from ." row:
  about +3.5 KB (136.27 to about 139.8). Expected rows: RangeCalendar about 16.5, DateRangePicker about 20.6,
  TimeField about 11.5, Calendar and DatePicker within 0.15 of today (15.72, 19.31), TreeView no higher (11.76).
- **Values carry no time zone** (default, unchanged from Calendar): days are `YYYY-MM-DD`, times `HH:mm`. "Today" is
  the viewer's local day, as in Calendar. An app joins date and time as `YYYY-MM-DDTHH:mm` and turns it into an
  instant on its server with the zone the user meant (DST gaps are the app's call).
- **No changes to `fold.visual.json`** (the Fold check builds the base branch too, which has no pages for the new
  components); the new pages go into `tools/site.visual.json`.

## Current state

- `src/components/calendar.tsx` (339 lines): `Calendar` with `CalendarProps`. One function holds: locale (`resolveLocale(locale ?? config.locale ?? getDefaultLocale())`), week start, prop checks with a dev warning (`check`, module `warned` Set, message `Calendar: "<prop>" must be YYYY-MM-DD`), value state, shown month state, `today` via `useSyncExternalStore` (server snapshot null), Tab stop choice (focused day, then selected, then today, then first enabled day), the layout effect that moves focus after a key, `onGridKey` (APG keys through `calendarKeyTarget`, clamped to min/max), the caption (IconButtons, optional month and year `Select`s), and the `<table role="grid">`. Day cells: `<td role="gridcell" aria-selected>` holding a `<button data-date tabIndex aria-label={fullDate} aria-current data-state data-disabled aria-disabled>`. Cell size `size-10`, on touch `pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]` (44px, narrower only on a very small screen).
- `src/components/calendar-classes.ts`: pure helpers (no directive): `parseIso`, `toIso`, `addDays`, `monthOf`, `inRange`, `clampIso`, `monthGrid`, `calendarKeyTarget`, `isoToday`, `resolveLocale`, `weekStartFor`, `dateFieldParts`, `formatDateField`, `parseDateField`, `datePlaceholder`, `monthTitle`, `monthNames`, `weekdayNames`, `dayNumber`, `fullDate`, and the private `BIDI_MARKS_RE`. Formatters are cached in Maps, made on first use. Tests: `calendar-classes.test.ts`.
- `src/components/date-picker.tsx` (275 lines): `DatePicker`; the pattern `DateRangePicker` copies: text input with `fieldClass`, `dirty`/`text`/`badText` state, `commitText` on blur and Enter, `setCustomValidity(strings.invalidDate)`, form reset listener, Alt+ArrowDown opens, Escape reverts dirty text (`stopPropagation`), hidden input under `name`, calendar button (`aria-haspopup="dialog"`, `aria-expanded`), `Popover` (`align="end"`, `className="p-3"`, `aria-label={strings.chooseDate}`) holding `<Calendar autoFocus>`.
- `src/components/popover.tsx` / `overlay-position.ts`: Escape closes the top layer through a bubbling `document` `keydown` listener, so a React `e.stopPropagation()` inside the panel keeps it open. Focus returns to the anchor on close. Focus goes to `[data-autofocus]` on open.
- `src/components/strings.ts`: `NishStrings` (typed keys, a JSDoc line each) and `DEFAULT_STRINGS`. Calendar and DatePicker keys: `invalidDate`, `chooseDate`, `changeDate`, `previousMonth`, `nextMonth`, `month`, `year`, `dayToken`, `monthToken`, `yearToken`.
- `src/components/forms.tsx` `Field` (line 495): clones its one child with `id`, `aria-describedby`, `aria-invalid`, `required`; renders `<label htmlFor={controlId}>` (line 535). `FieldGroup` (line 609) is a fieldset with a legend.
- `src/components/primitives.tsx` `Select` (line 444): native select in a `<span class="relative inline-flex w-full min-w-0">`, `size` xs/sm/md, rest goes to the `<select>`. `fieldClass` (`primitives-classes.ts` line 345): md `h-9`, sm `h-8`, both `pointer-coarse:min-h-11` and `pointer-coarse:text-base`.
- `src/components/tree-view.tsx` (411 lines): `TreeItem` is already `memo`, but `renderNodes` recurses and passes each open parent a new `children` array, so every open parent re-renders on every focus move. `visibleNodes` (tree-view-classes.ts) already returns the flat visible list with `level`, `parentId`, `posInSet`, `setSize`. `treeRowClass` is called once per `TreeItem` render (the render-count probe).
- Tests that pin the TreeView DOM: `src/components/tree-view.test.tsx` line 43 expects 2 `role="group"` elements.
- Size: `tools/size-budgets.json`, checked by `npm run size` (in `npm run check` and in CI). Measured on this branch's base (2026-11-07): everything from . 136.27 (budget 136.5), Calendar 15.72 (16.5), DatePicker 19.31 (20), TreeView 11.76 (12), Modal 15.17 (15.4), VirtualTable 16.71 (16.9), HoverCard 13.10 (13.3), SystemCanvas 27.00 (27.2), AppShell 35.04 (35.3), DropdownMenu 14.29 (14.5). Tarball 2.31 MB of 2.5 MB.
- Docs site: one page per component in `site/components/<id>.tsx` (`ComponentDoc` in `site/components/types.ts`), listed in `COMPONENT_DOCS` (`site/components/index.ts`); `id`, `name`, `summary`, `exports`, `framed` must be literals (`site/docs-meta.mjs`). Props tables come from `site/docgen.mjs`, which only documents names in its `COMPONENTS` array (line 8) and `INTERFACES` (line 148). `tools/docgen-coverage.test.ts` fails when a root export has no docs mention or a prop has no JSDoc. Code samples are written as `@nish/ui`.
- `tests/ssr/cases.tsx`: every component export needs a case (SSR test and the Chromium hydration spec use it).
- `tests/a11y/pickers.tsx` + `pickers.spec.ts` (port 5195): the browser specs for Calendar and DatePicker (axe in dark, light and contrast; APG keys; RTL; 360px dialog and 44px days; 840px no scroll). Needs `npm run build` first.
- CI (`.github/workflows/ci.yml`, no `pr.yml` in this repo): `check` job (`npm run check`, `npm run test:tools`, `npm run test:unit -- --coverage` with thresholds statements 81 / branches 79 / functions 85 / lines 84, `npm run size`, Chromium `npx playwright test`, demo and site visual checks), `browsers` job (overlay specs in Firefox and WebKit, includes `tests/overlay/tree-virtual.spec.ts`), `consumers` job (`node tools/consumer-check.mjs next|vite|ts`), `visual` (Fold check of the docs site), plus `codeql.yml`.

## Design

### Shared types and strings

```ts
// src/components/calendar-classes.ts
/** A span of days, both ends included, as YYYY-MM-DD. from is never after to. */
export interface DateRange {
  /** The first day. */
  from: string;
  /** The last day, included; equal to from for a one-day range. */
  to: string;
}
```

New `NishStrings` keys (JSDoc line in the interface, value in `DEFAULT_STRINGS`, in this order after `yearToken`):

| Key | JSDoc | Default |
|---|---|---|
| `chooseDates: string` | DateRangePicker: calendar button name while empty, and the popover name. | `'Choose dates'` |
| `changeDates: (range: string) => string` | DateRangePicker: calendar button name once a range is set. | ``(range) => `Change dates, ${range}` `` |
| `dateRange: (from: string, to: string) => string` | RangeCalendar, DateRangePicker: two dates read as a range. | ``(from, to) => `${from} to ${to}` `` |
| `rangeStarted: (start: string) => string` | RangeCalendar: live-region text after the first day is picked. | ``(start) => `Start date ${start}. Pick the end date.` `` |
| `invalidDateRange: string` | DateRangePicker: custom validity message for text that is not a range. | `'Enter a valid date range.'` |
| `hour: string` | TimeField: name of the hour box. | `'Hour'` |
| `minute: string` | TimeField: name of the minute box. | `'Minute'` |
| `dayPeriod: string` | TimeField: name of the AM/PM select. | `'AM/PM'` |
| `invalidTime: string` | TimeField: custom validity message for a time that is incomplete or not allowed. | `'Enter a valid time.'` |

### RangeCalendar UI

Same caption, grid, cell size and keys as Calendar. Day looks (from `calendarDayClass`):
- Committed range, more than one day: `from` filled (accent) with its end-side corners square (`rounded-e-none`), `to` filled with start-side corners square (`rounded-s-none`), days between `rounded-none bg-th-accent-soft font-medium text-th-accent` (a continuous band; the table has no cell gaps). Forced colors: Highlight background on every band day.
- Committed one-day range: that day filled, round, like Calendar's selected day.
- Picking (anchor set): the anchor filled; the preview band from the anchor to the hovered day (mouse or pen; touch has no hover) or else the focused day, in the soft band style, with `data-preview` on every band day except the anchor. No preview when the target is disabled or the band would cover a disabled day (anchor alone).
- ARIA: `<table role="grid" aria-multiselectable="true">`; `aria-selected="true"` on every committed day's gridcell; while picking, only the anchor's. A visually hidden `<p aria-live="polite">` says `rangeStarted(fullDate(anchor))` after the first press and `dateRange(fullDate(from), fullDate(to))` after the second, and is emptied by Escape.
- Attributes for tests and styling on each day button: `data-state="active"` when filled, `data-range="start|middle|end"` inside a band of more than one day, `data-preview` on preview days.
- 360px, 840px, desktop: identical width to Calendar (7 x 44px on touch). Light and dark: tokens only.

### DateRangePicker UI

Like DatePicker: one text input (`fieldClass`, `pe-11 tabular-nums`), the calendar button at the end (44px wide), Popover with `RangeCalendar autoFocus`. Display: `formatRangeField(value, loc)`, e.g. `11/05/2026 – 11/09/2026` (U+2013 with a space each side). Placeholder: `MM/DD/YYYY – MM/DD/YYYY` (the locale's `datePlaceholder` twice). The popover stays open after the first day and closes after the second; Escape with a half range drops the half range and keeps the popover open; a second Escape closes it and focus returns to the button. At 360px the text and placeholder fit a 296px field (measured estimate 266 and 286px with `text-base`); longer text scrolls inside the input, never the page.

### TimeField UI

`[hour] : [minute] [AM/PM]` in one row: each box `w-12` (48px) and on touch `pointer-coarse:w-14` (56px), both 44px tall on touch through `fieldClass`; centered tabular digits; placeholder `--`. The hour, colon and minute sit in a `dir="ltr"` span so RTL pages keep `9:30` order; the AM/PM `Select` follows in document order. 12-hour display: hour `1`-`12` unpadded, minutes `00`-`59`; 24-hour: hour `00`-`23`. About 230px wide, fits 360px.

### Security

Not affected: no routes, no network, no `dangerouslySetInnerHTML`. Typed text only goes through the digit parsers. Regexes are anchored character classes with no nested quantifiers (CodeQL polynomial-ReDoS rule in CLAUDE.md: no `[...]+$` trims; use `trim()`).

### Performance

- Size budgets as in Decisions. Range and time code live only in their own modules and in `calendar-classes.ts` / `time-field-classes.ts` exports that `Calendar` and `DatePicker` do not import (esbuild drops unused exports).
- RangeCalendar recomputes the band per render with at most one `firstDisabledIn` scan (bounded at 3,660 days) and only when `isDateDisabled` is set.
- TreeView: one focus move renders exactly 2 `TreeItem`s on a fully open 2,000-node tree; Space renders 1; expanding a closed parent with 10 children renders 11.

### Ops

None. No env vars, ports or hosting changes. Released as 2.2.0 through `release.yml` (see Release).

## Tasks

All tasks work in `C:\Code\ui-range-picker` (branch `range-picker`), in one shared checkout with other agents editing other files at the same time. Run `npm ci` only if `node_modules` is missing. Typecheck with `npx tsc --noEmit`; errors in files you do not own that come from another task in progress are not yours: list them in your notes and go on. Never run `npm run release`, `gh workflow run ...`, `npm publish`, `node tools/npm-publish.mjs` or `bash scripts/bump-consumers.sh`. Follow the component contract in `docs/DEVELOPING.md` ("The component contract"): `'use client'` first in modules with hooks, pure helpers in `*-classes.ts` with no directive and no React runtime import, `ref` as a prop, `...rest` on the root, strings from `useNishStrings()` (a prop wins), logical utilities for RTL, `data-state`/`data-disabled`, forced-colors utilities, dev warnings behind `process.env.NODE_ENV !== 'production'`, JSDoc on every prop (the docs props table and `tools/docgen-coverage.test.ts` read it). Tests use vitest + testing-library (happy-dom), fake timers with `vi.setSystemTime(new Date(2026, 10, 5, 12))` wherever "today" matters, like `calendar.test.tsx`.

### T0 Pure helpers, strings and the Field label id

- Owns: `src/components/strings.ts`, `src/components/calendar-classes.ts`, `src/components/calendar-classes.test.ts`, `src/components/time-field-classes.ts` (new), `src/components/time-field-classes.test.ts` (new), `src/components/forms.tsx`, `src/components/forms.test.tsx`
- Reads: `src/components/date-picker.tsx`, `src/components/calendar.tsx`, `src/components/tree-view-classes.ts` (cn import pattern)
- Depends on: none
- Change:
  1. `strings.ts`: add the 9 keys from "Shared types and strings" to `NishStrings` (after `yearToken`, with the JSDoc lines from the table) and to `DEFAULT_STRINGS` (after `yearToken: 'YYYY'`), exactly as in the table.
  2. `forms.tsx`, `Field`: on the `<label htmlFor={controlId}>` (line 535) add `id={`${controlId}-label`}`. Nothing else in the file changes.
  3. `calendar-classes.ts`: add `import { cn } from '../cn';` and these exports (keep every existing export unchanged):
     ```ts
     export interface DateRange { from: string; to: string } // with the JSDoc from "Shared types and strings"

     /** The two days in order: from is the earlier one. */
     export function orderRange(a: string, b: string): DateRange {
       return a <= b ? { from: a, to: b } : { from: b, to: a };
     }

     /** True when both are null, or both have the same from and to. */
     export function sameRange(a: DateRange | null, b: DateRange | null): boolean {
       return a === b || (!!a && !!b && a.from === b.from && a.to === b.to);
     }

     /** A range from loose input (a prop): both ends real YYYY-MM-DD days, put in order. Anything else is null. */
     export function toRange(v: { from?: unknown; to?: unknown } | null | undefined): DateRange | null {
       if (!v || typeof v !== 'object') return null;
       const { from, to } = v;
       if (typeof from !== 'string' || typeof to !== 'string' || !parseIso(from) || !parseIso(to)) return null;
       return orderRange(from, to);
     }

     /** The first day from `from` to `to` (both included) that isDisabled returns true for, or null.
      *  Looks at most 3,660 days. */
     export function firstDisabledIn(from: string, to: string, isDisabled: (iso: string) => boolean): string | null {
       let d = from;
       for (let n = 0; n < 3660 && d <= to; n++) {
         if (isDisabled(d)) return d;
         const next = addDays(d, 1);
         if (next === d) break; // 9999-12-31 saturates
         d = next;
       }
       return null;
     }

     /** "11/05/2026 – 11/09/2026" in the locale's numeric order (an en dash with a space each side). */
     export function formatRangeField(range: DateRange, locale: string): string {
       return `${formatDateField(range.from, locale)} – ${formatDateField(range.to, locale)}`;
     }

     /** The locale's date pattern twice: "MM/DD/YYYY – MM/DD/YYYY". */
     export function rangePlaceholder(locale: string, tokens: { day: string; month: string; year: string }): string {
       const one = datePlaceholder(locale, tokens);
       return `${one} – ${one}`;
     }

     const RANGE_JUNK_RE = /[^\d\s/.,\-–—]/;
     const DIGIT_RUN_RE = /\d+/g;

     /** Parses typed range text: two dates in the locale's numeric order or ISO, with any separator
      *  between them; one date is a one-day range. Ordered; null when it is not two real days. */
     export function parseRangeField(text: string, locale: string): DateRange | null {
       const t = text.replace(BIDI_MARKS_RE, '').trim();
       if (t === '' || RANGE_JUNK_RE.test(t)) return null;
       const runs = [...t.matchAll(DIGIT_RUN_RE)];
       let a: string;
       let b: string;
       if (runs.length === 6) {
         a = t.slice(0, runs[2]!.index! + runs[2]![0].length);
         b = t.slice(runs[3]!.index!);
       } else if (runs.length === 2 && runs[0]![0].length === 8 && runs[1]![0].length === 8) {
         a = runs[0]![0];
         b = runs[1]![0];
       } else if (runs.length === 3 || (runs.length === 1 && runs[0]![0].length === 8)) {
         a = t;
         b = t;
       } else {
         return null;
       }
       const from = parseDateField(a, locale);
       const to = parseDateField(b, locale);
       return from && to ? orderRange(from, to) : null;
     }

     /** Where a day sits in a band of more than one day. */
     export type DayBand = 'start' | 'middle' | 'end' | null;

     export interface DayLook {
       /** Accent fill: Calendar's picked day, a range end, the first pick of a range. */
       filled: boolean;
       today: boolean;
       disabled: boolean;
       band?: DayBand;
     }

     const DAY_BASE =
       'flex size-10 items-center justify-center rounded-lg text-sm tabular-nums text-th-hi2 transition-colors pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]';

     /** Classes of one day button. With band null this is exactly Calendar's 2.1 day class. */
     export function calendarDayClass({ filled, today, disabled, band = null }: DayLook): string {
       return cn(
         DAY_BASE,
         !filled && !band && !disabled && 'hover:bg-th-elevated hover:text-th-hi',
         today && !filled && 'font-semibold text-th-accent ring-1 ring-inset ring-th-accent/50',
         band === 'start' && 'rounded-e-none',
         band === 'end' && 'rounded-s-none',
         band === 'middle' && 'rounded-none',
         band &&
           !filled &&
           'bg-th-accent-soft font-medium text-th-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
         filled &&
           'bg-th-accent font-semibold text-th-on-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
         disabled && 'cursor-not-allowed text-th-ghost line-through forced-colors:text-[GrayText]',
       );
     }
     ```
     Note: `matchAll` on a module-level `/g` regex is safe (it clones the regex).
  4. `time-field-classes.ts` (new, first line a comment, no directive, no React):
     ```ts
     // Pure helpers of TimeField: HH:mm values, the locale's 12/24-hour clock and day-period names, stepping. No React.
     export type HourCycle = 12 | 24;
     /** One edit state of the three boxes: hour text, minute text, and PM (12-hour clock only). */
     export interface TimeDraft { h: string; m: string; pm: boolean }

     const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
     const pad2 = (n: number): string => String(n).padStart(2, '0');

     /** Parses HH:mm (00:00 to 23:59), else null. */
     export function parseTime(s: string | null | undefined): { h: number; m: number } | null
     /** "09:05". */
     export function toTime(h: number, m: number): string            // `${pad2(h)}:${pad2(m)}`
     /** False when min or max is a valid HH:mm and t is outside it (string compare). Invalid limits are ignored. */
     export function inTimeRange(t: string, min?: string | null, max?: string | null): boolean
     /** 12 for locales whose clock is h11/h12 (en-US), else 24 (de-DE, en-GB, ja-JP). Cached per locale. */
     export function hourCycleFor(locale: string): HourCycle
       // new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }).resolvedOptions():
       // o.hourCycle ? (o.hourCycle === 'h11' || o.hourCycle === 'h12') : o.hour12 === true; in try/catch, 24 on error.
     /** The locale's AM and PM words, e.g. ['AM', 'PM'], ['午前', '午後']. Cached per locale. */
     export function dayPeriodNames(locale: string): [string, string]
       // new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true, timeZone: 'UTC' }).formatToParts(new Date(Date.UTC(2026, 0, 1, 1)))
       // and (... 13): the part with type 'dayPeriod'; fallback 'AM' / 'PM'; try/catch to the fallback.
     /** 0 -> 12 AM, 12 -> 12 PM, 13 -> 1 PM. */
     export function to12(h: number): { hour: number; pm: boolean }  // hour: h % 12 === 0 ? 12 : h % 12; pm: h >= 12
     /** 12 AM -> 0, 12 PM -> 12. */
     export function from12(hour: number, pm: boolean): number       // (hour % 12) + (pm ? 12 : 0)
     /** An integer from 1 to 60; anything else (undefined, NaN, 0, 90) is clamped, NaN and undefined give 1. */
     export function normalizeStep(step?: number): number              // Number.isFinite(step) ? Math.min(60, Math.max(1, Math.floor(step!))) : 1
     /** The last minute a step reaches: floor(59 / step) * step. */
     export function lastMinute(step: number): number
     /** The next hour in 24-hour terms, wrapping 23 -> 0; from empty, up gives 0 and down 23. */
     export function stepHour(h: number | null, dir: 1 | -1): number  // h === null ? (dir > 0 ? 0 : 23) : (h + dir + 24) % 24
     /** The next multiple of step above (or below) m, wrapping within the hour without changing it. */
     export function stepMinute(m: number | null, dir: 1 | -1, step: number): number
       // m === null: dir > 0 ? 0 : lastMinute(step)
       // up:   n = (Math.floor(m / step) + 1) * step; n > 59 ? 0 : n
       // down: n = Math.ceil(m / step) * step - step;  n < 0 ? lastMinute(step) : n
     /** The hour box text for a 24-hour hour: "09" on a 24-hour clock, "9" on a 12-hour clock. */
     export function hourText(h: number, cycle: HourCycle): string    // cycle === 24 ? pad2(h) : String(to12(h).hour)
     /** The boxes for a value: empty boxes and AM for null. */
     export function draftFromTime(t: string | null, cycle: HourCycle): TimeDraft
       // p = parseTime(t); !p -> { h: '', m: '', pm: false }; else { h: hourText(p.h, cycle), m: pad2(p.m), pm: p.h >= 12 }
     /** HH:mm for complete valid boxes, null for two empty boxes, undefined for anything else (one empty, not digits,
      *  hour outside 0-23 or 1-12, minute outside 0-59). */
     export function draftTime(d: TimeDraft, cycle: HourCycle): string | null | undefined
       // d.h === '' && d.m === '' -> null; d.h === '' || d.m === '' -> undefined; /^\d{1,2}$/ on both else undefined;
       // hn, mn = Number(...); cycle 24: 0 <= hn <= 23, cycle 12: 1 <= hn <= 12; 0 <= mn <= 59 else undefined;
       // toTime(cycle === 12 ? from12(hn, d.pm) : hn, mn)
     /** True when the typed hour text is final, so focus moves to the minutes: two digits, or one digit that
      *  cannot start a two-digit hour (3-9 on a 24-hour clock, 2-9 on a 12-hour clock). */
     export function hourAdvances(text: string, cycle: HourCycle): boolean
       // const max = cycle === 24 ? 23 : 12; return text.length >= 2 || (text.length === 1 && Number(text) * 10 > max)
     ```
     Caches are module Maps, filled on first use (no `Intl` at import).
- Edge cases: `parseRangeField('', loc)` null; `'11/05/2026'` gives `{ from: '2026-11-05', to: '2026-11-05' }`; `'11/09/2026 - 11/05/2026'` gives the ordered range; `'2026-11-05/2026-11-09'`, `'2026-11-05 – 2026-11-09'`, `'11052026 11092026'`, `'11/05/26 11/9/26'` all parse in en-US; `'05.11.2026 – 09.11.2026'` in de-DE; `'11/05/2026 to 11/09/2026'` is null (letters); `'02/30/2026 – 03/01/2026'` null; 4 or 5 digit runs null. `firstDisabledIn('9999-12-30', '9999-12-31', () => false)` returns null without looping forever. `toRange({ from: '2026-11-09', to: '2026-11-05' })` returns the ordered range; `toRange({ from: '2026-11-31', to: '2026-12-01' })` null. `draftTime({ h: '0', m: '30', pm: false }, 12)` undefined; `({ h: '12', m: '00', pm: false }, 12)` `'00:00'`; `({ h: '12', m: '00', pm: true }, 12)` `'12:00'`; `({ h: '24', m: '00' }, 24)` undefined. `stepMinute(7, 1, 15)` 15, `stepMinute(7, -1, 15)` 0, `stepMinute(0, -1, 15)` 45, `stepMinute(45, 1, 15)` 0, `stepMinute(59, 1, 1)` 0, `stepMinute(null, -1, 7)` 56. `hourCycleFor('en-US')` 12, `('de-DE')` 24, `('en-GB')` 24, `('not a locale!!')` 24.
- Acceptance:
  - `npx vitest run src/components/calendar-classes.test.ts src/components/time-field-classes.test.ts src/components/forms.test.tsx src/components/calendar.test.tsx src/components/date-picker.test.tsx src/components/provider.test.tsx` passes.
  - New tests in `calendar-classes.test.ts`: every edge case above for `orderRange`, `sameRange`, `toRange`, `firstDisabledIn` (finds the first disabled day, null when none, the 9999 stop), `formatRangeField` + `parseRangeField` round trip for en-US, de-DE, ja-JP and ar-EG on `{ from: '2026-11-05', to: '2026-11-09' }`, `rangePlaceholder('en-US', ...)` is `'MM/DD/YYYY – MM/DD/YYYY'`, and `calendarDayClass({ filled, today, disabled })` with band unset equals the 2.1 string for the four combinations Calendar renders (plain, today, selected, disabled); the test builds each expected string with its own `cn(...)` call holding the class strings copied from `calendar.tsx` lines 319-326, never by calling `calendarDayClass`.
  - New `time-field-classes.test.ts`: every edge case above plus `parseTime` (`'09:05'`, `'23:59'` ok; `'24:00'`, `'9:05'`, `'09:60'`, `null` null), `inTimeRange` (inside, below min, above max, invalid min ignored), `dayPeriodNames('en-US')` `['AM', 'PM']`, `to12`/`from12` round trip for 0-23, `hourAdvances` for `'1'`, `'2'`, `'3'` on both clocks, `normalizeStep` for `undefined`, `0`, `15`, `90`, `NaN`.
  - New test in `forms.test.tsx`: `<Field label="Start"><Input id="s" /></Field>` renders `label#s-label` whose `htmlFor` is `s`.
  - `npx tsc --noEmit` has no errors in owned files.

### T1 CalendarBase, Calendar on top of it, and RangeCalendar

- Owns: `src/components/calendar-base.tsx` (new), `src/components/calendar.tsx`, `src/components/range-calendar.tsx` (new), `src/components/range-calendar.test.tsx` (new), `site/components/range-calendar.tsx` (new)
- Reads (does not edit): `src/components/calendar.test.tsx`, `src/components/calendar.hydration.test.tsx`, `src/components/date-picker.tsx`, `site/components/calendar.tsx`, `site/components/types.ts`, `site/lib/jsx.ts`
- Depends on: T0
- Change:
  1. `calendar-base.tsx` (`'use client'`): export
     ```ts
     /** Props Calendar and RangeCalendar share. */
     export interface CalendarSharedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
       ref?: Ref<HTMLDivElement>; month?: string; defaultMonth?: string; onMonthChange?: (month: string) => void;
       min?: string; max?: string; isDateDisabled?: (date: string) => boolean; locale?: string; weekStartsOn?: WeekDay;
       captionLayout?: 'label' | 'dropdowns'; fromYear?: number; toYear?: number; autoFocus?: boolean;
       previousMonthLabel?: string; nextMonthLabel?: string;
     }
     ```
     moving each prop's JSDoc line from `CalendarProps` unchanged (they are the docs props table text). Then:
     ```ts
     /** @internal How CalendarBase draws one day. */
     export interface CalendarDayLook { filled: boolean; band: DayBand; ariaSelected: boolean; preview?: boolean }
     /** @internal */
     export interface CalendarBaseProps extends CalendarSharedProps {
       componentName: 'Calendar' | 'RangeCalendar';          // prefix of dev warnings
       initialMonth: string | null;                           // month used when uncontrolled and no defaultMonth (read once, at mount)
       focusPreference: string | null;                        // the Tab stop after the focused day: Calendar's value, RangeCalendar's anchor or from
       dayLook: (iso: string) => CalendarDayLook;
       onPick: (iso: string) => void;                         // enabled days only
       onDayFocus?: (iso: string) => void;
       onDayHover?: (iso: string | null) => void;
       onGridKeyDown?: (e: KeyboardEvent<HTMLTableElement>) => void; // runs first; base skips its keys when e.defaultPrevented
       multiselectable?: boolean;
       children?: ReactNode;                                  // rendered after the table
     }
     /** @internal The dev-warning prop check: v when it is YYYY-MM-DD (or YYYY-MM), else null and one warning per component and prop. */
     export function checkIso(component: string, prop: string, v: string | null | undefined, isMonth = false): string | null
     export function CalendarBase(props: CalendarBaseProps)
     ```
     (`DayBand` and `calendarDayClass` come from `./calendar-classes`.)
     `checkIso` is today's `check` moved to module level, keyed `${component}:${prop}` in the module `warned` Set, message exactly `${component}: "${prop}" must be YYYY-MM-DD` (or `YYYY-MM`).
     `CalendarBase`'s body is `Calendar`'s body today (`calendar.tsx` lines 103-338) with exactly these changes:
     - no `value`/`defaultValue`/`onValueChange`/`controlled`/`ownValue`/`selected`; `ownMonth` starts as `defaultMonthIso ?? initialMonth`;
     - the Tab stop uses `focusPreference` where it used `selected`;
     - `pick(iso)`: `if (disabled(iso)) return; setFocusedDate(iso); onPick(iso);`
     - `onGridKey` starts with `onGridKeyDown?.(e); if (e.defaultPrevented) return;`
     - each day: `const look = dayLook(iso)`; `<td role="gridcell" aria-selected={look.ariaSelected}>`; the button gets `data-state={look.filled ? 'active' : 'inactive'}`, `data-range={look.band ?? undefined}`, `data-preview={look.preview ? '' : undefined}`, `className={calendarDayClass({ filled: look.filled, band: look.band, today: iso === today, disabled: isDisabled })}`, `onFocus={onDayFocus ? () => onDayFocus(iso) : undefined}`, `onPointerEnter={onDayHover ? (e) => { if (e.pointerType !== 'touch') onDayHover(iso); } : undefined}`;
     - the table gets `aria-multiselectable={multiselectable || undefined}` and `onPointerLeave={onDayHover ? () => onDayHover(null) : undefined}`; `{children}` follows the table inside the root.
     Every other attribute, class and order stays as it is.
  2. `calendar.tsx`: `CalendarProps extends CalendarSharedProps` and keeps `value`, `defaultValue`, `onValueChange` with today's JSDoc. `Calendar` validates `value` and `defaultValue` with `checkIso('Calendar', ...)`, keeps `own` state (`useState(defaultIso)`), `selected = controlled ? valueIso : own`, and returns `<CalendarBase {...rest} componentName="Calendar" initialMonth={selected ? monthOf(selected) : null} focusPreference={selected} dayLook={(iso) => ({ filled: iso === selected, band: null, ariaSelected: iso === selected })} onPick={(iso) => { if (!controlled) setOwn(iso); onValueChange?.(iso); }} />`. Keep the component's JSDoc and `export type { WeekDay }`.
  3. `range-calendar.tsx` (`'use client'`):
     ```ts
     export type { DateRange, WeekDay } from './calendar-classes';
     export interface RangeCalendarProps extends CalendarSharedProps {
       /** The picked range as { from, to } in YYYY-MM-DD (controlled), or null for none. */
       value?: DateRange | null;
       /** The first range of an uncontrolled calendar. */
       defaultValue?: DateRange | null;
       /** Called with { from, to } once the second day is picked; from is never after to. A half-picked range is not reported. */
       onValueChange?: (value: DateRange) => void;
       /** Let a range cover days isDateDisabled returns true for (weekends inside a vacation). Default false: a second press that would cover one starts a new range there. */
       allowDisabledInRange?: boolean;
     }
     /** A month grid that picks a range of days: the first press sets the start, the second the end, and the days
      *  between light up as the pointer or focus moves. Same keys as Calendar; Escape drops a start with no end. */
     export function RangeCalendar(props: RangeCalendarProps)
     ```
     Behavior:
     - `loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale())` (same as Calendar).
     - Prop check: `checkRange(prop, v)`: `undefined`/`null` gives null; `toRange(v)` null gives null plus one dev warning `RangeCalendar: "${prop}" must be { from, to } with YYYY-MM-DD days`; `v.from > v.to` gives the ordered range plus one dev warning `RangeCalendar: "${prop}" has from after to; the days were swapped`. Warn once per prop (module Set).
     - State: `own` (from `defaultValue`), `anchor: string | null`, `hover: string | null`, `focusDay: string | null`, `status: string` (live-region text). `range = value !== undefined ? checkRange('value', value) : own`.
     - `off(iso)`: outside valid `min`/`max` (ignore invalid ones like Calendar) or `isDateDisabled?.(iso) === true`. `blocks(r)`: `!allowDisabledInRange && !!isDateDisabled && firstDisabledIn(r.from, r.to, isDateDisabled) !== null`.
     - Band: no anchor: `range`. Anchor: `target = hover ?? focusDay ?? anchor`, `r = orderRange(anchor, target)`, band = `off(target) || blocks(r) ? { from: anchor, to: anchor } : r`.
     - `dayLook(iso)`: outside the band (or no band) `{ filled: false, band: null, ariaSelected: false }`. Inside: `single = band.from === band.to`; `filled = anchor ? iso === anchor : iso === band.from || iso === band.to`; `band: single ? null : iso === band.from ? 'start' : iso === band.to ? 'end' : 'middle'`; `ariaSelected: anchor ? iso === anchor : true`; `preview: !!anchor && iso !== anchor`.
     - `onPick(iso)`: no anchor: `setAnchor(iso)`, `setStatus(strings.rangeStarted(fullDate(iso, loc)))`. Anchor: `r = orderRange(anchor, iso)`; `blocks(r)`: `setAnchor(iso)` and the `rangeStarted` status for iso; else `setAnchor(null)`, `setHover(null)`, uncontrolled `setOwn(r)`, `setStatus(strings.dateRange(fullDate(r.from, loc), fullDate(r.to, loc)))`, `onValueChange?.(r)`.
     - `onGridKeyDown(e)`: `e.key === 'Escape' && anchor !== null`: `e.preventDefault(); e.stopPropagation();` then clear anchor, hover and status. Other keys: nothing (base handles them).
     - Render: `<CalendarBase {...shared} componentName="RangeCalendar" initialMonth={range ? monthOf(range.from) : null} focusPreference={anchor ?? range?.from ?? null} dayLook={...} onPick={...} onDayFocus={setFocusDay} onDayHover={setHover} onGridKeyDown={...} multiselectable><p aria-live="polite" className="sr-only">{status}</p></CalendarBase>`.
  4. `site/components/range-calendar.tsx`: `export const rangeCalendar: ComponentDoc` with literal `id: 'range-calendar'`, `name: 'RangeCalendar'`, `exports: ['RangeCalendar']`, `api: { functions: [], interfaces: ['DateRange'] }`, `importLine: "import { RangeCalendar } from '@nish/ui';"`, summary `A month grid that picks a range of days: the first press sets the start, the second the end, and the days between light up as the pointer or focus moves. The value is { from, to } as YYYY-MM-DD strings.` Controls: `locale` select (`en-US`, `de-DE`, `ar-EG`, ar-EG rendered with `dir="rtl"`), `weekends` boolean (label `Weekends disabled`), `allowDisabled` boolean (label `Range may cover disabled days`); `initial: { locale: 'en-US', weekends: false, allowDisabled: false }`; render keyed on the args like `calendar.tsx`; `code` with `jsx('RangeCalendar', ...)` leaving defaults out. Stories: `basic` "Basic" (`defaultValue={{ from: '2026-11-05', to: '2026-11-09' }}`), `controlled` "Controlled" (state, `defaultMonth="2026-11"`, a line `Picked: 2026-11-05 to 2026-11-09` or `Picked: none`, text-xs text-th-hi3), `min-max` "Min and max" (`min="2026-11-03" max="2026-11-24" defaultMonth="2026-11"`, note `Days outside the range cannot be picked, and the month buttons stop at the range.`), `weekends` "Weekends disabled" (note `A range cannot cover a disabled day; a second press past one starts a new range there.`), `allow-disabled` "Ranges over weekends" (`allowDisabledInRange`, weekends disabled, note `allowDisabledInRange lets the range cover disabled days; its ends still cannot be disabled days.`). Usage: `import { RangeCalendar } from '@nish/ui';\n\n<RangeCalendar value={range} onValueChange={setRange} min="2026-01-01" />`. Guidelines, exactly:
     - `Use DateRangePicker for a form field; use RangeCalendar on its own when the month view is the page content (a booking page).`
     - `The first press sets the start and the second the end. An earlier second day swaps them; the same day twice is a one-day range.`
     - `Escape drops a start that has no end yet.`
     - `onValueChange runs once both ends are picked; a half-picked range is never reported.`
     - `Values are YYYY-MM-DD strings with no time zone, and to is included in the range.`
     The weekend helper is the same `isWeekend` as `site/components/calendar.tsx` (copy it into this file).
- Edge cases (each a test in `range-calendar.test.tsx`): first press sets `data-state="active"` on the anchor only and no `onValueChange`; second press later calls `onValueChange({ from, to })`; second press earlier swaps; the same day twice gives `{ from: d, to: d }` and no `data-range`; hover (`fireEvent.pointerEnter(day, { pointerType: 'mouse' })`) after the first press marks days between with `data-preview` and `data-range="middle"`; `pointerType: 'touch'` draws no preview; `pointerLeave` on the grid falls back to the focused day; ArrowRight after the first press moves the preview with focus; Escape after the first press clears the anchor, empties the live region, calls `preventDefault` and does not reach a `document` keydown listener; Escape with no anchor reaches it; weekends disabled: Fri 2026-11-06 then Mon 2026-11-09 makes 11-09 the new anchor (no `onValueChange`); with `allowDisabledInRange` the same presses give the range; a disabled day as the second press does nothing; controlled `value` follows the prop and the grid shows `aria-selected="true"` on every day from `from` to `to`; uncontrolled `defaultValue` opens on its month; `value={{ from: '2026-11-09', to: '2026-11-05' }}` warns once and draws 05-09; `value={{ from: 'x', to: 'y' }}` warns once and draws nothing; the live region reads `Start date Thursday, November 5, 2026. Pick the end date.` then `Thursday, November 5, 2026 to Monday, November 9, 2026`; strings from a `NishProvider` override (`rangeStarted`); the grid has `aria-multiselectable="true"`; `ref`, `className` and rest reach the root; RTL ArrowLeft (mock `./client` `isRtl` like `calendar.test.tsx`).
- Acceptance:
  - `npx vitest run src/components/calendar.test.tsx src/components/calendar.hydration.test.tsx src/components/date-picker.test.tsx src/components/range-calendar.test.tsx src/components/calendar-classes.test.ts` passes, with `calendar.test.tsx`, `calendar.hydration.test.tsx` and `date-picker.test.tsx` unedited.
  - `npx tsc --noEmit` has no errors in owned files.

### T2 TimeField

- Owns: `src/components/time-field.tsx` (new), `src/components/time-field.test.tsx` (new), `site/components/time-field.tsx` (new)
- Reads: `src/components/date-picker.tsx` (pattern: id, validity, form reset, hidden input), `src/components/primitives.tsx` (`Select`), `src/components/primitives-classes.ts` (`fieldClass`), `src/components/forms-classes.ts` (`setRef`), `site/components/date-picker.tsx`
- Depends on: T0
- Change: `time-field.tsx` (`'use client'`):
  ```ts
  export type { HourCycle } from './time-field-classes';
  export interface TimeFieldProps extends Omit<HTMLAttributes<HTMLDivElement>,
    'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
    /** The hour box. The remaining div attributes go to the group. */
    ref?: Ref<HTMLInputElement>;
    /** The time as HH:mm in 24-hour time, or null for none (controlled). */
    value?: string | null;
    /** The starting time of an uncontrolled field. */
    defaultValue?: string | null;
    /** Called with HH:mm when both boxes hold a valid time inside min and max, or null when both are emptied. */
    onValueChange?: (value: string | null) => void;
    /** Earliest allowed time (HH:mm). An earlier time marks the field invalid and is not reported. */
    min?: string;
    /** Latest allowed time (HH:mm). */
    max?: string;
    /** Minutes per ArrowUp or ArrowDown on the minute box, 1 to 60. Default 1. Typed minutes are kept as typed. */
    step?: number;
    /** 12 shows 1-12 and an AM/PM select, 24 shows 00-23. Default from the locale (12 in en-US, 24 in de-DE). */
    hourCycle?: 12 | 24;
    /** BCP 47 tag for the clock and the AM/PM words. Default NishProvider locale, then setDefaultLocale(). */
    locale?: string;
    /** Accessible name when there is no Field or visible label; each box is named "<name> Hour", "<name> Minute". */
    'aria-label'?: string;
    /** Names the field by another element's id. */
    'aria-labelledby'?: string;
    /** Ids of help or error text; reaches both boxes (Field sets it). */
    'aria-describedby'?: string;
    /** Reaches both boxes (Field sets it on error). */
    'aria-invalid'?: boolean | 'true' | 'false';
    /** Same as aria-invalid="true". */
    invalid?: boolean;
    /** The id of the hour box, so a <label htmlFor> and Field reach it. */
    id?: string;
    /** Field name for a native form: a hidden input posts HH:mm, or an empty string. */
    name?: string;
    /** The id of the <form> the hidden input belongs to, when it is not an ancestor. */
    form?: string;
    /** Marks both boxes required. */
    required?: boolean;
    /** Turns off both boxes and the AM/PM select. */
    disabled?: boolean;
    /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
    size?: 'sm' | 'md';
    /** Extra classes for the group. */
    className?: string;
  }
  /** A time field: an hour box and a minute box (and AM/PM where the locale uses it). Arrow keys step the focused
   *  box, typing moves on to the minutes, and the value is HH:mm in 24-hour time, like <input type="time">. */
  export function TimeField(props: TimeFieldProps)
  ```
  Behavior, exactly:
  1. `loc` as in DatePicker; `cycle = hourCycle ?? hourCycleFor(loc)`; `st = normalizeStep(step)`; `[am, pm] = dayPeriodNames(loc)`; `minT = parseTime(min) ? min : null`, same for max.
  2. Ids: `auto = useId().replace(/[^a-zA-Z0-9_-]/g, '')`; `inputId = id ?? `nish-tf-${auto}``; hidden name spans `nish-tf-${auto}-name` (only when `aria-label` is given, text = aria-label), `-h` (`strings.hour`), `-m` (`strings.minute`), `-p` (`strings.dayPeriod`), each `<span id=... hidden>`. `src = ariaLabelledBy ?? (ariaLabel != null ? nameId : id != null ? `${id}-label` : undefined)` (the `-label` id is the one Field puts on its label). Group: `role="group" aria-labelledby={src}`. Hour: `aria-labelledby={[src, hId].filter(Boolean).join(' ')}`; minute: same with `mId`; select: same with `pId`. Dev warning once when none of `id`, `aria-label`, `aria-labelledby` is given: `TimeField: give it a Field, an aria-label or aria-labelledby.`
  3. Value: controlled when `value !== undefined`; a value that `parseTime` rejects counts as null and warns once `TimeField: "value" must be HH:mm` (same for `defaultValue`). `own` state from `defaultValue`.
  4. Edit state: `draft: TimeDraft | null` (null shows the value), `bad: boolean`. `shown = draft ?? draftFromTime(value, cycle)`.
  5. `update(next: TimeDraft)`: `const t = draftTime(next, cycle)`. `t === null`: commit null if value is not null, `setDraft(null)`, `setBad(false)`. `t` a string and `inTimeRange(t, minT, maxT)`: commit t if it differs from value, `setDraft(null)`, `setBad(false)`. Otherwise `setDraft(next)` (nothing reported). `commit(v)`: uncontrolled `setOwn(v)`, then `onValueChange?.(v)`.
  6. Hour box `onChange`: `d = e.target.value.replace(/\D/g, '').slice(0, 2)`; `update({ ...shown, h: d })`; when `hourAdvances(d, cycle)`, focus the minute box and select its text. Minute box `onChange`: same filter, `update({ ...shown, m: d })`, no advance.
  7. `onFocus` of either box: `e.currentTarget.select()`.
  8. `onKeyDown` of either box (skip when `disabled`):
     - ArrowUp / ArrowDown (`dir` 1 / -1), `preventDefault`. Hour: current 24-hour hour from `shown` (`hn = Number(shown.h)`; when `shown.h` is empty or out of range for the clock, null; on a 12-hour clock `from12(hn, shown.pm)`), `next = stepHour(cur, dir)`, `update({ ...shown, h: hourText(next, cycle), pm: next >= 12 })`. Minute: `cur` = `Number(shown.m)` when 0-59 else null, `update({ ...shown, m: pad2(stepMinute(cur, dir, st)) })`.
     - Home: hour to 0 (`update({ ...shown, h: hourText(0, cycle), pm: false })`), minute to `'00'`. End: hour to 23 (`pm: true`), minute to `pad2(lastMinute(st))`. `preventDefault`.
     - On a 12-hour clock `a`/`A` sets `pm: false`, `p`/`P` sets `pm: true` (`update`, `preventDefault`).
     - Hour box only: `:` or `.` moves focus to the minute box (`preventDefault`).
     - Minute box only: Backspace when the minute text is empty moves focus to the hour box (`preventDefault`).
  9. AM/PM `Select` (only on a 12-hour clock): `value={shown.pm ? 'pm' : 'am'}`, two options `<option value="am">{am}</option>` and `<option value="pm">{pm}</option>` (the words from `dayPeriodNames`), `onChange` `update({ ...shown, pm: e.target.value === 'pm' })`, `size` passed through, `disabled`, `className="w-auto shrink-0"`.
  10. Group `onBlur`: when `e.relatedTarget` is inside the group, return. Else `t = draftTime(shown, cycle)`; `setBad(draft !== null && (t === undefined || (t !== null && !inTimeRange(t, minT, maxT))))`.
  11. `outside = value !== null && !inTimeRange(value, minT, maxT)`; `isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true' || bad || outside`. Effect on `[bad, outside, strings.invalidTime]`: hour box `setCustomValidity(bad || outside ? strings.invalidTime : '')` (the `invalid` and `aria-invalid` props only style, like DatePicker's).
  12. Form reset (uncontrolled), copied from DatePicker: back to `defaultValue`, `draft` null, `bad` false.
  13. Markup (root gets `{...rest}`, `data-disabled`, `className={cn('inline-flex items-center gap-2', className)}`): the hidden name spans, then `<span dir="ltr" className="inline-flex items-center gap-1">` with the hour `<input>`, `<span aria-hidden="true" className="text-th-hi3">:</span>`, the minute `<input>`; then the Select; then `name != null` ? `<input type="hidden" name={name} value={value ?? ''} form={form} disabled={disabled} />`.
     Both boxes: `type="text" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} role="spinbutton" placeholder="--"`, `value`, `disabled`, `required`, `aria-required={required || undefined}`, `aria-describedby`, `aria-invalid={isInvalid || undefined}`, `className={fieldClass({ size, invalid: isInvalid, className: 'w-12 ps-0 pe-0 text-center tabular-nums pointer-coarse:w-14' })}`. Hour: `id={inputId}`, `ref` (through `setRef`), `aria-valuemin={cycle === 12 ? 1 : 0}`, `aria-valuemax={cycle === 12 ? 12 : 23}`, `aria-valuenow` = the number when `shown.h` is a valid hour for the clock, else undefined. Minute: `aria-valuemin={0} aria-valuemax={59}`, `aria-valuenow` when 0-59.
  `site/components/time-field.tsx`: `export const timeField: ComponentDoc`, literal `id: 'time-field'`, `name: 'TimeField'`, `exports: ['TimeField']`, `importLine: "import { TimeField } from '@nish/ui';"`, summary `A time field: an hour box and a minute box, plus AM/PM where the locale uses it. Arrow keys step each box, typing moves on to the minutes, and the value is HH:mm in 24-hour time, like <input type="time">.` Controls: `hourCycle` select (`locale`, `12`, `24`), `step` select (`1`, `5`, `15`, `30`), `size` select (`md`, `sm`), `disabled` and `invalid` booleans; render `<TimeField aria-label="Start time" defaultValue="09:30" ...>` keyed on the args; code via `jsx('TimeField', ...)` leaving defaults out. Stories: `basic` "Basic" (`aria-label="Start time"`), `field` "In a Field" (`<Field label="Start time" hint="Type it or use the arrow keys."><TimeField /></Field>`), `24-hour` "24-hour clock" (`hourCycle={24} defaultValue="18:45"`), `step` "15-minute steps" (`step={15}`, note `ArrowUp and ArrowDown move by 15 minutes; a typed minute is kept as typed.`), `limits` "Office hours" (`min="09:00" max="17:30"`, note `A time outside 09:00 to 17:30 marks the field invalid and is not reported.`), `date-time` "With a date" (a `FieldGroup label="Starts"` holding `Field label="Date"` + `DatePicker` and `Field label="Time"` + `TimeField` in a `flex flex-wrap gap-3`, and a line `Value: 2026-11-05T09:30` built as `${date}T${time}` or `Value: none`), `form` "In a form" (a form with `name="start"` that shows the posted value, like the date-picker `FormDemo`). Usage: `import { TimeField } from '@nish/ui';\n\n<TimeField aria-label="Start time" name="start" value={time} onValueChange={setTime} step={15} />`. Guidelines, exactly:
  - `The value is HH:mm in 24-hour time with no time zone. Join it with a date as YYYY-MM-DDTHH:mm and turn that into an instant on the server, in the zone the user meant.`
  - `Type 9 then 30, or 9:30. A digit that cannot start a two-digit hour moves on to the minutes; on a 12-hour clock A and P set AM and PM.`
  - `ArrowUp and ArrowDown step the focused box (minutes by step), Home and End go to its first and last value.`
  - `Inside a Field the label names both boxes (Start time Hour, Start time Minute); outside one, give it an aria-label.`
- Edge cases (each a test in `time-field.test.tsx`, locale `en-US` unless noted): typing `9` in the hour box moves focus to the minutes (12-hour), `1` does not; `2` moves on 12-hour, not on 24-hour (`hourCycle={24}`); typing `9`, `30` with AM calls `onValueChange('09:30')`; `p` then gives `'21:30'`; ArrowUp on an empty hour gives `12` AM shown (`00` on 24-hour); ArrowUp on 11 AM gives 12 PM; ArrowDown on minute `00` with `step={15}` gives `45`; Home/End on both boxes; clearing both boxes calls `onValueChange(null)`; clearing one box reports nothing and marks the field invalid on blur (`aria-invalid="true"` and `validationMessage` `Enter a valid time.`), focus moving between the boxes does not; `12` + `00` AM is `'00:00'`; `min="09:00"`: typing 08:00 reports nothing and is invalid after blur; controlled `value` follows the prop and an edit the parent ignores reverts; uncontrolled `defaultValue`; invalid `value="9:30"` warns once; `de-DE` shows no select and `00`-`23`; `name` posts `HH:mm` in a hidden input and `''` when empty; form reset; `disabled` turns off all three controls; inside `<Field label="Start time">` the hour box's `aria-labelledby` is `<id>-label <hour span id>` and `document.getElementById` of each id resolves (label text `Start time`, span text `Hour`); with `aria-label="Start time"` the hidden span holds it; `ref` is the hour input; `className` and rest reach the group; strings from a `NishProvider` (`hour`, `minute`).
- Acceptance: `npx vitest run src/components/time-field.test.tsx src/components/time-field-classes.test.ts` passes; `npx tsc --noEmit` has no errors in owned files.

### T3 DateRangePicker

- Owns: `src/components/date-range-picker.tsx` (new), `src/components/date-range-picker.test.tsx` (new), `site/components/date-range-picker.tsx` (new)
- Reads: `src/components/date-picker.tsx`, `src/components/date-picker.test.tsx`, `src/components/range-calendar.tsx`, `site/components/date-picker.tsx`
- Depends on: T0, T1
- Change: copy `date-picker.tsx`'s structure into `date-range-picker.tsx` (`'use client'`) with these differences and nothing else:
  - `DateRangePickerProps`: same props and JSDoc as `DatePickerProps`, except `value?: DateRange | null` ("The range as { from, to } in YYYY-MM-DD, or null for none (controlled)."), `defaultValue?: DateRange | null` ("The starting range of an uncontrolled picker."), `onValueChange?: (value: DateRange | null) => void` ("Called with { from, to }, or null when the field is cleared."), `isDateDisabled` JSDoc "Return true to disable a date in the calendar and refuse a typed range that ends on or covers it.", `placeholder` JSDoc "Shown while empty. Default the locale's pattern twice, e.g. "MM/DD/YYYY – MM/DD/YYYY".", `name` JSDoc "Field name for a native form: a hidden input posts from/to (2026-11-05/2026-11-09), or an empty string.", `calendarLabel` JSDoc "Accessible name of the calendar button. Default "Choose dates", or "Change dates, <from> to <to>" once set.", plus `allowDisabledInRange?: boolean` with RangeCalendar's JSDoc. Export `export type { DateRange } from './calendar-classes';`.
  - Ids `nish-drp-${autoId}`. Value check: `toRange` on `value`/`defaultValue` (invalid counts as null, no warning: DatePicker does not warn either). Equality through `sameRange`.
  - Display: `dirty ? text : value ? formatRangeField(value, loc) : ''`. Placeholder default `rangePlaceholder(loc, { day: strings.dayToken, month: strings.monthToken, year: strings.yearToken })`.
  - `commitText`: empty text commits null (when value is not null). Else `r = parseRangeField(text, loc)`; accepted when `r` and both ends `inRange(.., min, max)` and neither end `isDateDisabled` and `(allowDisabledInRange || !isDateDisabled || firstDisabledIn(r.from, r.to, isDateDisabled) === null)`; accepted commits `r` when `!sameRange(r, value)`. Otherwise `badText`. Custom validity text `strings.invalidDateRange`.
  - Hidden input value: `value ? `${value.from}/${value.to}` : ''`.
  - Button label: `calendarLabel ?? (value ? strings.changeDates(strings.dateRange(fullDate(value.from, loc), fullDate(value.to, loc))) : strings.chooseDates)`.
  - Popover `aria-label={strings.chooseDates}` holding `<RangeCalendar value={value} onValueChange={pickFromCalendar} min={minProp} max={maxProp} isDateDisabled={isDateDisabled} allowDisabledInRange={allowDisabledInRange} locale={loc} weekStartsOn={weekStartsOn} captionLayout={captionLayout} autoFocus />`. `pickFromCalendar(r)` commits, clears dirty and bad text and closes, like DatePicker.
  - Component JSDoc: `A date range field: type both dates in the reader's own numeric order (or ISO), or pick them from a RangeCalendar in a Popover. The value is { from, to } as YYYY-MM-DD strings. ref, id, aria-*, name and required belong to the input; className and other attributes go to the wrapper.`
  `site/components/date-range-picker.tsx`: `export const dateRangePicker: ComponentDoc`, literal `id: 'date-range-picker'`, `name: 'DateRangePicker'`, `exports: ['DateRangePicker']`, `framed: { height: 620 }`, `importLine: "import { DateRangePicker } from '@nish/ui';"`, summary `A date range field: type both dates in the reader's own format or pick them from a range calendar. The value is { from, to } as YYYY-MM-DD strings, and it posts as one from/to value.` Controls and render like `site/components/date-picker.tsx` (`size`, `captionLayout`, `disabled`, `invalid`; `aria-label="Trip dates"`, `defaultValue={{ from: '2026-11-05', to: '2026-11-09' }}`). Stories: `basic` "Basic" (`aria-label="Trip dates"`), `field` "In a Field" (`<Field label="Trip dates" hint="Type them or pick them."><DateRangePicker /></Field>`), `limits` "Min and max" (`aria-label="Stay" min="2026-11-03" max="2026-12-20"`, note `Dates outside the range are disabled in the calendar and refused when typed.`), `weekdays` "Weekdays only" (weekends disabled, note `A range that covers a weekend day is refused unless allowDisabledInRange is set.`), `form` "In a form" (`name="trip"`, shows `trip = 2026-11-05/2026-11-09` or `trip = empty` after submit, like the date-picker `FormDemo`). Usage: `import { DateRangePicker } from '@nish/ui';\n\n<DateRangePicker aria-label="Trip dates" name="trip" value={trip} onValueChange={setTrip} />`. Guidelines, exactly:
  - `Type both dates in the reader's numeric order with any separator between them: 11/05/2026 – 11/09/2026, 11/05/2026 11/09/2026 or 2026-11-05/2026-11-09. One date is a one-day range.`
  - `A range that cannot be read, falls outside min and max, or covers a disabled day marks the field invalid and keeps the text; pair it with a Field error.`
  - `With name, a hidden input posts from/to (an ISO 8601 interval), for example 2026-11-05/2026-11-09; split it on the slash on the server.`
  - `The popover closes when the second day is picked. Escape first drops a half-picked range, then closes the popover.`
- Edge cases (tests in `date-range-picker.test.tsx`, mirroring `date-picker.test.tsx`'s structure and mocks): typed `11/05/2026 – 11/09/2026` + blur commits the range; `11/09/2026 - 11/05/2026` commits it ordered; one date commits a one-day range; Enter commits and does not submit a form; unreadable text keeps the text, sets `aria-invalid` and `validationMessage` `Enter a valid date range.`; outside min/max refused; covering a disabled day refused, accepted with `allowDisabledInRange`; an end on a disabled day refused even with `allowDisabledInRange`; empty text commits null; Escape reverts dirty text; controlled and uncontrolled; `name` posts `2026-11-05/2026-11-09` and `''`; form reset; button label `Choose dates` then `Change dates, Thursday, November 5, 2026 to Monday, November 9, 2026`; Alt+ArrowDown opens the popover; two presses in the open calendar commit and close it; one press keeps it open; `disabled`; `id`, `aria-*` and `ref` on the input, `className` and rest on the wrapper; strings from a `NishProvider`; `de-DE` formats `05.11.2026 – 09.11.2026`.
- Acceptance: `npx vitest run src/components/date-range-picker.test.tsx src/components/range-calendar.test.tsx` passes; `npx tsc --noEmit` has no errors in owned files.

### T4 TreeView flat rows

- Owns: `src/components/tree-view.tsx`, `src/components/tree-view.test.tsx`, `src/components/tree-view-render.test.tsx` (new)
- Reads: `src/components/tree-view-classes.ts`, `tests/overlay/tree-virtual.spec.ts`, `tests/overlay/tree-virtual.tsx`
- Depends on: none
- Change:
  1. `TreeItem`: drop the `children` prop and the nested `{open ? <ul role="group"> ... </ul> : null}`; everything else in it stays (same `li`, attributes, classes, row div, chevron span, label span).
  2. `TreeView`: delete `renderNodes`; render `<ul ...>{flat.map((f) => { const open = hasChildren(f.node) && expandedSet.has(f.node.id); return <TreeItem key={f.node.id} node={f.node} level={f.level} posinset={f.posInSet} setsize={f.setSize} open={open} selectable={selectable} selected={selectedId === f.node.id} isTarget={f.node.id === targetId} labelId={`${uid}-${encodeURIComponent(f.node.id)}`} itemRef={itemRef} onRowClick={onRowClick} onToggle={onToggle} />; })}</ul>`. Replace the comment above it with: `// Rows are one flat list (aria-level, aria-setsize and aria-posinset carry the structure), so a focus move re-renders only the two rows whose isTarget changed.`
  3. Keyboard, focus, the focus-restore layout effect, warnings and props stay as they are.
  4. `tree-view.test.tsx` line 43: replace `expect(screen.getAllByRole('group')).toHaveLength(2);` with `expect(screen.queryAllByRole('group')).toHaveLength(0);` and add `for (const li of screen.getAllByRole('treeitem')) expect(li.parentElement!.getAttribute('role')).toBe('tree');`. No other test changes.
  5. `tree-view-render.test.tsx` (new): `vi.mock('./tree-view-classes', async (importOriginal) => { const m = await importOriginal<typeof import('./tree-view-classes')>(); return { ...m, treeRowClass: vi.fn(m.treeRowClass) }; })`; build a tree of 20 roots x 9 folders x 10 leaves (2,000 nodes; ids `r<i>`, `r<i>-f<j>`, `r<i>-f<j>-l<k>`, labels the same), all 200 parents in `defaultExpanded`. Each test mounts its own tree (timeout 30000 each); "calls" means `treeRowClass` calls after `vi.mocked(treeRowClass).mockClear()`, and a row is focused with `act(() => row.focus())` before clearing:
     - mount renders 2,000 rows (2,000 calls, 2,000 treeitems);
     - focus `r0`, clear, ArrowDown: exactly 2 calls (focus moves to `r0-f0`);
     - then 5 more ArrowDown presses, clearing before each: 2 calls per press;
     - focus `r0-f0-l0`, clear, Space: exactly 1 call;
     - focus `r0-f0-l0`, Space (selects it), clear, click the row div of leaf `r1-f0-l0`: exactly 2 calls (the old Tab stop and selection, and the new one);
     - focus `r0-f0`, clear, ArrowLeft: 1 call and 1,990 treeitems; clear, ArrowRight: 11 calls and 2,000 treeitems.
- Edge cases: the existing focus tests (branch collapsed under focus, focused node removed) keep passing; a closed branch's children are not in the DOM; keys stay stable so React moves no rows on a focus move.
- Acceptance: `npx vitest run src/components/tree-view.test.tsx src/components/tree-view-render.test.tsx` passes; `npx tsc --noEmit` has no errors in owned files. Then `npm run build` and `CI=1 npx playwright test tests/overlay/tree-virtual.spec.ts` (first check ports 5193-5195 are free with `netstat -ano | grep -E ':519[3-5] '`; if one is taken, report it instead of running) passes unedited.

### T5 Wiring, docs registry, budgets and API snapshot

- Owns: `src/index.ts`, `site/components/index.ts`, `site/docgen.mjs`, `site/components/calendar.tsx`, `site/components/date-picker.tsx`, `tests/ssr/cases.tsx`, `README.md`, `tools/site.visual.json`, `tools/size-budgets.json`, `tools/api-surface.snapshot.json`
- Reads: everything T0-T4 wrote
- Depends on: T0, T1, T2, T3, T4
- Change:
  1. `src/index.ts`, after the DatePicker lines (277-278): `export { RangeCalendar } from './components/range-calendar';`, `export type { RangeCalendarProps, DateRange } from './components/range-calendar';`, `export { DateRangePicker } from './components/date-range-picker';`, `export type { DateRangePickerProps } from './components/date-range-picker';`, `export { TimeField } from './components/time-field';`, `export type { TimeFieldProps, HourCycle } from './components/time-field';`.
  2. `site/components/index.ts`: import `rangeCalendar`, `dateRangePicker`, `timeField`; in `COMPONENT_DOCS` put `dateRangePicker` right after `datePicker`, `rangeCalendar` right after `calendar`, `timeField` right after `rangeCalendar`.
  3. `site/docgen.mjs`: add `'DateRangePicker'`, `'RangeCalendar'`, `'TimeField'` to `COMPONENTS` after `'Calendar'`; add `'DateRange'` to `INTERFACES`.
  4. `site/components/calendar.tsx` guidelines: append `For a span of days (a trip, a report period), use RangeCalendar.` `site/components/date-picker.tsx` guidelines: append `For a start and an end date use DateRangePicker; for a time of day next to the date, TimeField.`
  5. `tests/ssr/cases.tsx` (alphabetical like the rest): `DateRangePicker: () => <ui.DateRangePicker aria-label="Trip" defaultValue={{ from: '2026-01-15', to: '2026-01-18' }} locale="en-US" name="trip" />`, `RangeCalendar: () => <ui.RangeCalendar aria-label="Trip" defaultValue={{ from: '2026-01-15', to: '2026-01-18' }} locale="en-US" />`, `TimeField: () => <ui.TimeField aria-label="Start" defaultValue="09:30" locale="en-US" name="start" />`.
  6. `README.md` line 262-263: the list becomes `..., Combobox, DatePicker, DateRangePicker, Calendar, RangeCalendar, TimeField, MultiSelect, ...` (rewrap to the file's width).
  7. `tools/site.visual.json`: after the `date-picker` page add `{ "name": "date-range-picker", "url": "http://localhost:5191/#/components/date-range-picker", "waitFor": "[data-page]", "settle": 800 }`, `{ "name": "range-calendar", "url": "http://localhost:5191/#/components/range-calendar", "waitFor": "[data-page]" }`, `{ "name": "time-field", "url": "http://localhost:5191/#/components/time-field", "waitFor": "[data-page]" }`.
  8. `npm run build`, then `npm run size`. In `tools/size-budgets.json` add rows after DatePicker: `RangeCalendar`, `DateRangePicker`, `TimeField` (each `"from": "nish-ui"`, `"import"` the name), `maxKB` = measured + 0.5 rounded up to 0.1. Any existing row now over budget: measured + 0.2 rounded up to 0.1; "everything from .": measured + 0.5 rounded up to 0.1. Append to the `comment`: `RangeCalendar, DateRangePicker and TimeField (2.2.0) are measured plus 0.5 and add <X> KB to everything-from-. (136.27 to <Y>); their 9 strings move every row that loads the strings by about 0.1 KB.` with the measured numbers. If everything-from-. grew by more than 4.5 KB, or Calendar or DatePicker by more than 0.3 KB, or TreeView grew at all, do not raise those budgets: return blocked with the `npm run size` table.
  9. `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs` after the build; the snapshot diff must only add `DateRangePicker`, `RangeCalendar`, `TimeField` (no removals).
- Acceptance: `npm run check`, `npm run test:tools` and `npx vitest run tools/docgen-coverage.test.ts tests/ssr` pass; `node --test tools/api-surface.test.mjs` passes; `git diff tools/api-surface.snapshot.json` shows additions only.

### T6 Browser specs for the new pickers

- Owns: `tests/a11y/pickers.tsx`, `tests/a11y/pickers.spec.ts`
- Reads: `src/components/range-calendar.tsx`, `src/components/date-range-picker.tsx`, `src/components/time-field.tsx`
- Depends on: T5 (it builds `dist/`, which the harness CSS needs; two builds in one checkout at once collide)
- Change:
  1. `pickers.tsx`: update the header comment (`?open=daterange` too). Import the three components from `../../src/components/...`. After the DatePicker card add: a card `<h2>Range calendar</h2>` with `<div id="range-host"><RangeCalendar defaultMonth="2026-11" /></div>`; a card with `<Field label="Trip dates"><DateRangePicker defaultValue={{ from: '2026-11-05', to: '2026-11-09' }} /></Field>`; a card with `<Field label="Start time"><TimeField defaultValue="09:30" locale="en-US" /></Field>`. In the `extra` block add `<div id="range-weekends-host"><RangeCalendar defaultMonth="2026-11" isDateDisabled={weekend} /></div>` (weekend = Saturday or Sunday, UTC weekday math like `site/components/calendar.tsx`) and, inside `#date-form`, `<Field label="Form time"><TimeField name="at" locale="en-US" /></Field>`. `open === 'daterange'` clicks `main button[aria-label^="Change dates"]` on load.
  2. `pickers.spec.ts`, new tests (keep every existing test):
     - axe: `daterange open in dark` and `in light` (`?open=daterange`, ready selector `[role=dialog] [data-date]`), zero serious or critical; the existing page scans now include the new cards.
     - keyboard: on `#range-host`, focus `2026-11-05`, Enter, ArrowRight 3 times: 11-06..11-08 have `data-preview`; Enter: gridcells 11-05..11-08 have `aria-selected="true"`, 11-09 `false`, and the live region (`#range-host [aria-live=polite].sr-only`) reads `Thursday, November 5, 2026 to Sunday, November 8, 2026`.
     - pointer: click 11-10, hover 11-13: 11-11..11-13 `data-preview`; click 11-13: 11-10 and 11-13 `data-state="active"`, 11-11 `data-range="middle"`. Then click 11-20 and 11-15: selected 11-15..11-20 (swap).
     - weekends: on `#range-weekends-host` (`?extra=1`) click 11-06 then 11-09: 11-09 is `data-state="active"`, 11-06 `inactive`, no gridcell between has `aria-selected="true"`.
     - date range picker: the button named `Change dates, Thursday, November 5, 2026 to Monday, November 9, 2026` opens the dialog `Choose dates` with focus on `[data-date="2026-11-05"]`; Enter on 11-05, ArrowDown, Enter (11-12): the dialog closes, the textbox `Trip dates` has value `11/05/2026 – 11/12/2026`, focus is on the button. Again: open, Enter on a day, Escape: dialog still visible, no `[data-preview]`; Escape: hidden, focus on the button. Typing `11/10/2026 - 11/12/2026` and Enter in the textbox shows `11/10/2026 – 11/12/2026`.
     - time field: focus the box named `Start time Hour`, type `7`: focus is on `Start time Minute`; type `45`, press `p`; `?extra=1` form box `Form time Hour`: type `7`, `45`, `p` and the hidden `input[name="at"]` is `19:45`; ArrowUp on the minute box makes it `46`.
     - phone (360x780, hasTouch, isMobile): `?open=daterange` has no horizontal scroll, the dialog inside 0..360 and every day button at least 44x44; on the plain page each TimeField box and the AM/PM select are at least 44px tall and the boxes at least 44px wide. 840x900: `?open=daterange` has no horizontal scroll.
- Acceptance: ports 5193-5195 free (`netstat -ano | grep -E ':519[3-5] '` prints nothing; otherwise report it), then `CI=1 npx playwright test tests/a11y/pickers.spec.ts` passes.

## Waves

W1: T0, T4 · W2: T1, T2 (need T0) · W3: T3 (needs T0, T1) · W4: T5 (needs T0-T4) · W5: T6 (needs T5).

No file is owned by two tasks. `strings.ts`, `calendar-classes.ts` and `forms.tsx` are T0's; the registries (`src/index.ts`, `site/components/index.ts`, `site/docgen.mjs`, `tests/ssr/cases.tsx`, budgets, snapshot, README) are T5's.

## Review focus

- `Calendar` and `DatePicker` unchanged: same markup and classes (diff `npm run build` output of a rendered Calendar against 2.1.1 if in doubt), `calendar.test.tsx`, `calendar.hydration.test.tsx` and `date-picker.test.tsx` untouched and green, no new bytes beyond 0.3 KB in their size rows.
- RangeCalendar state machine: anchor, swap, same day, disabled-day restart, preview from hover vs focus, Escape (and that it does not close the Popover while an anchor is set), controlled value with an anchor pending, ARIA (`aria-selected`, `aria-multiselectable`, live region text).
- DateRangePicker parsing across locales (en-US, de-DE, ja-JP, ar-EG) and separators; the hidden `from/to` value.
- TimeField labeling (`aria-labelledby` resolves inside Field and with `aria-label`), auto-advance, 12-hour edge cases (12 AM, 12 PM), invalid-on-blur only, `setCustomValidity`, 44px boxes on touch, RTL order.
- TreeView flat render: exactly 2 renders per focus move, focus restore when a focused branch collapses, ARIA levels and sizes, the docs page at 360px.
- UI lens: docs pages `#/components/range-calendar`, `#/components/date-range-picker` (open the popover), `#/components/time-field`, `#/components/tree-view` at 360x780, 840x900, 1440x900 in light and dark; band colors and today ring in every theme (light, dark, contrast); forced colors on the band.
- Size: `npm run size` numbers against the Decisions estimates.

## Release

1. Final commit on the branch: delete this spec, delete the two ROADMAP "Ideas" entries (**Date range and time picking**, **TreeView re-renders every open row on each focus move**), and rewrite **Root bundle back to 100 KB** with the new measured everything-from-. number and "RangeCalendar, DateRangePicker and TimeField added <X> KB in 2.2.0".
2. PR `range-picker` to master with a link to the spec commit; wait until checks are listed, then for `check`, `browsers`, `consumers (next, vite, ts)`, `visual` (Fold) and `codeql` to pass; merge commit.
3. On master: commit the `## [2.2.0] - <date>` CHANGELOG entry (`[skip ci]`). Added: `RangeCalendar`, `DateRangePicker`, `TimeField`, the `DateRange` and `HourCycle` types, the strings `chooseDates`, `changeDates`, `dateRange`, `rangeStarted`, `invalidDateRange`, `hour`, `minute`, `dayPeriod`, `invalidTime`. Changed: `TreeView` renders its visible rows as one flat list of treeitems (aria-level, aria-setsize and aria-posinset unchanged; the nested `role="group"` lists are gone) and a focus move re-renders only the two rows that change; `Field`'s label has `id="<control id>-label"`.
4. `gh workflow run release.yml -R nishant/ui -f bump=minor` (never run by implementers). Check `git ls-remote --tags origin v2.2.0`, `npm view nish-ui version` is `2.2.0`, and the fan-out opens `ui/v2.2.0` PRs (one release, so one fan-out round of Actions minutes). Run `bash scripts/bump-consumers.sh v2.2.0` for taarora/arora-home.
5. Live: after hosting's `ui/v2.2.0` bump deploys, https://design.nish.software/#/components/range-calendar, `#/components/date-range-picker`, `#/components/time-field` and `#/components/tree-view` load; screenshot them at 360, 840 and 1440 in light and dark.

Outward commands (never run by implementers, fixers or the integrate step): `gh workflow run release.yml`, `gh workflow run publish.yml`, `gh workflow run fanout.yml`, `npm run release`, `npm publish`, `node tools/npm-publish.mjs`, `bash scripts/bump-consumers.sh`.

## Open questions for the research phase

- Does axe-core 4.x (`aria-valid-attr-value`) pass an `aria-labelledby` that lists one id that does not exist next to ids that do (TimeField's `<id>-label` when `id` is given without a Field)? If it fails, TimeField must include `<id>-label` only when `document.getElementById` finds it, checked in a layout effect into state.
- Do Chromium, Firefox and WebKit report `Intl.DateTimeFormat('en-US', { hour: 'numeric' }).resolvedOptions().hourCycle` as `h12` and `de-DE` as `h23`, and Node 24's ICU the same, so the server and the first client render agree?
