# DatePicker, Calendar, MultiSelect and Carousel

Status: in progress · Slug: picker-carousel · Date: 2026-11-05 · Size: large
Repos: ui (spec lives here; public repo)
ROADMAP: `ROADMAP.md`, entry "Components left out of 2.0" (2026-11-03). This spec covers DatePicker, Calendar, MultiSelect and Carousel only. The parallel session `tree-virtual` covers virtualized lists and tables, ContextMenu, HoverCard and TreeView.

## Goal

Four components that apps keep asking for, added to `@nish/ui` under the 2.0 component contract (`docs/DEVELOPING.md`, "The component contract"), each with a docs page on design.nish.software, unit tests, browser a11y checks and a size budget. Keyboard behavior follows the WAI-ARIA APG patterns exactly as written below. Dates are formatted with `Intl` only, with no date library.

Outcomes:
1. `Calendar`: a month grid (`role="grid"`) that picks one day, with APG date-grid keys, min and max, disabled days, locale month and weekday names, and the locale's first day of the week.
2. `DatePicker`: a text field that takes typed dates in the locale's numeric order or ISO, plus a calendar button that opens a `Calendar` in a `Popover`. The value is an ISO `YYYY-MM-DD` string, the same format as a native `<input type="date">`.
3. `MultiSelect`: an editable combobox with a multi-select listbox (`aria-multiselectable`). Picked values show as removable tag Chips, and it posts one hidden input per value.
4. `Carousel`: a scroll-snap carousel that follows the APG carousel pattern: a labelled region, slides as labelled groups, previous and next buttons, slide picker dots, arrow keys and optional auto-rotation with a stop button.
5. Each one has `src/components/<module>.test.tsx`, a docs page `site/components/<id>.tsx`, an SSR case, a size budget entry, a README mention, an Unreleased CHANGELOG entry, and Playwright axe and keyboard checks (`tests/a11y/pickers.spec.ts`), all passing at 360, 840 and 1280 px.
6. The PR is merged and the orchestrator is told "ui ready for release".

## Out of scope

- Date ranges, time of day, week numbers, multiple months side by side. (The release PR adds a ROADMAP entry for range and time picking.)
- Custom elements (`<nish-date-picker>` and so on) and static-page CSS classes for these four.
- Moving apps onto them. trading, job-apps and trackers use native `<input type="date">`, which works well on Android. No app has a local copy to replace, so this spec opens no app PRs.
- MultiSelect "select all", option groups, creating new options, drag to reorder chips.
- Carousel thumbnails, vertical orientation, lazy image loading, fade transitions.
- Editing `src/components/overlay.tsx`, `src/components/icons.tsx` or `ROADMAP.md` (other sessions own the first two; the release commit edits the ROADMAP).
- Dispatching `release.yml`. The orchestrator cuts one batched ui release.

## Decisions

- Value format is an ISO calendar-day string `YYYY-MM-DD` (and `YYYY-MM` for a month). It is timezone-free, matches `<input type="date">` and `nish-ui/format`'s "a bare YYYY-MM-DD string is a calendar day", and lets apps swap a native date input for DatePicker without changing data. (default)
- All date math is on `{y, m, d}` built with `Date.prototype.setUTCFullYear` and formatted with `timeZone: 'UTC'`, so DST and the viewer's zone never shift a day. `Date.UTC` is not used because it maps years 0-99 to 1900-1999. (default)
- No date library: everything needed (names, numerals, field order) comes from `Intl.DateTimeFormat` and `formatToParts`. Estimated cost is about 3 KB gzip of helpers; date-fns or dayjs plus locales would cost more and duplicate Intl. (default)
- First day of the week comes from a small CLDR region table (`weekStartFor`), not `Intl.Locale#getWeekInfo`. Firefox has no week info, and a server/client difference would change the grid's column order and break hydration. `weekStartsOn` overrides it. (default)
- "Today" is read through `useSyncExternalStore` with a `null` server snapshot, so server HTML and the first client render match. The today ring appears after hydration. (default)
- Calendar grid markup is `<table role="grid">` with `<td role="gridcell" aria-selected>` holding a `<button>` with roving `tabIndex`. This is the APG grid and react-day-picker's shape, and buttons give native activation and focus. (default)
- Days outside the shown month are empty cells, as in the APG example, and the grid always has 6 rows so the popover never changes height between months. (default)
- Disabled days (outside min/max, or `isDateDisabled`) still take focus through the arrow keys, with `aria-disabled="true"`, so keyboard movement never gets stuck. Enter and click do nothing on them. Focus never moves before `min` or after `max`; it is clamped to the bound. (default)
- DatePicker opens the Calendar in the existing non-modal `Popover` at every width, not in a modal dialog as in the APG example. Popover already handles portal, flip and clamp, Escape, outside press, Tab-out and focus return, and works inside Modal and Drawer through the layer stack. At 360 px the panel is 7 x 44 px cells + 24 px padding = 332 px, which fits. (default)
- DatePicker typed input: on blur or Enter it accepts ISO `2026-11-05`, the locale's numeric order with any of `/ . - ,` or space as separators, 2-digit years (read as 2000-2099), and 8 digits with no separators in the locale's order. Anything else marks the field invalid (`aria-invalid`, red border) and keeps the text so the reader can fix it. Field shows the message. (default)
- DatePicker uses `inputMode="numeric"`. Gboard's number pad has `-` `.` `,`, and all three are accepted as separators. (default)
- Calendar `captionLayout="dropdowns"` renders native month and year `Select`s for far jumps such as birth dates. The default is a text caption with previous/next month buttons. Shift+PageUp/PageDown cover years from the keyboard either way. (default)
- MultiSelect is built as its own component next to Combobox, not as a mode of it. It reuses `ComboboxOption`, `indexComboboxOptions`, `COMBOBOX_MAX_SHOWN`, `COMBOBOX_DEBOUNCE_MS`, `fieldClass`, `Chip variant="tag"`, `CheckIcon`, `XIcon` and `Spinner`. Changing Combobox would risk its users and its 14 KB budget. (default)
- MultiSelect keeps the list open after a pick (Enter or click toggles the active option) and clears the typed query after each toggle. Values keep the order they were picked in. (default)
- Carousel uses native horizontal scroll with CSS scroll snap (`snap-x snap-mandatory`), so touch swipe, momentum and RTL come from the browser with no gesture code. Slides are not hidden or `inert` when off screen: every slide stays reachable and is announced as "n of N". Focus entering a slide makes it current. (default)
- Carousel controls (previous, picker dots, next) sit in a row under the slides, never on top of the content, so nothing covers a slide at 360 px. With `autoPlay`, the stop/start rotation button comes first in DOM and tab order, placed in the slides' top end corner (APG). (default)
- Carousel dots show only when there are at most 7 slides (7 x 44 px = 308 px fits 360). Above 7, a "3 / 12" counter replaces them. Previous and next at either end use `aria-disabled` rather than `disabled`, so a focused button keeps focus. `loop` (default false) wraps them instead. (default)
- Carousel auto-rotation is off unless `autoPlay` (ms, at least 2000) is set. It pauses while the pointer is over the carousel, while focus is inside it, and while the page is hidden. Under `prefers-reduced-motion: reduce` it starts stopped and scrolling is instant. The region's `aria-live` is `off` while rotating and `polite` otherwise (APG). (default)
- Strings are added to `src/components/strings.ts` right after the `searching` key, in both the interface and `DEFAULT_STRINGS`, and not at the end of the file. The other ui sessions append at the end, so this placement keeps rebases conflict-free. (default)
- Icons that are not in `icons.tsx` (chevron left and right, calendar) go in a new private `src/components/picker-icons.tsx`, and Carousel draws its own four SVG paths inline. `icons.tsx` is left alone because the tree-virtual session may add chevrons there. Not exported from the root. (default)
- Every shared registry is edited by one last task (T7), and its edits are inserted next to the Combobox lines, not at file ends, so they merge cleanly with the other ui sessions. (default)
- Browser checks go in a new, separate harness page and spec (`tests/a11y/pickers.*`) instead of the shared `tests/a11y/main.tsx` and `axe.spec.ts`, so no other session's edits collide with them. (default)
- Release bump: minor (new components only, no breaking change). The orchestrator picks the final bump for the batch. (default)

## Current state

- Component contract: `docs/DEVELOPING.md` "The component contract" (14 rules). Reviewers check every rule. Key ones here: `'use client'` first line; pure helpers in a sibling file with no directive and no React import; `ref` as a prop; `...rest` on the root; no import-time side effects (module-level `new Intl.*` is forbidden, so formatters are made lazily and cached in a `Map`); render pure on the server; strings from `useNishStrings()` with a per-instance prop winning; logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`); arrow keys swapped when `isRtl(el)`; z-index from tokens; `data-state` and `data-disabled`; forced-colors utilities; dev warnings guarded by `process.env.NODE_ENV !== 'production'`; form colors `border-th-line-control`, `placeholder:text-th-hi3`.
- `src/components/combobox.tsx`: ARIA 1.2 combobox. The input has `role="combobox"`, `aria-activedescendant` and an absolute `<ul role="listbox">` under it (not portaled, `z-[var(--nish-z-dropdown,40)]`, `max-h-[min(16rem,40dvh)]`). It skips disabled options when moving, has a debounced `onQueryChange` with `loading`, a hidden input for `name`, form reset for uncontrolled use, a polite result-count status and a clear button (`tabIndex={-1}`, `onMouseDown` preventDefault). MultiSelect copies its listbox and option class strings and key handling (`step`, `edge`).
- `src/combobox-filter.ts`: `COMBOBOX_MAX_SHOWN = 50`, `COMBOBOX_DEBOUNCE_MS = 200`. `src/components/forms-classes.ts`: `setRef`, `indexComboboxOptions`, `chipClass`.
- `src/components/tag-input.tsx`: the chip-in-a-field box. MultiSelect copies its root `className` (fieldClass with `relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1`, focus-within ring, forced-colors outline), its click-to-focus handler and its Backspace-removes-last behavior.
- `src/components/forms.tsx` `Chip` (line 787): `variant="tag"` renders a `<span>` with an `IconButton` remove button (`removeLabel`, `onRemove`), `size="sm"` (28 px, 44 px on touch).
- `src/components/overlay.tsx` `Popover` (line 1549): props `open`, `onOpenChange(open, reason)`, `anchor` (RefObject), `side`, `align`, `width`, `aria-label`, `className`. Portaled with `role="dialog"`. On open it focuses `[data-autofocus],[autofocus]` inside the panel after a 0 ms timeout. Escape is handled on `document` for the top layer only. Tab past either end closes with reason `'tab'`. Focus returns to the anchor. It renders nothing on the server. The `appshell-gaps` session is splitting `overlay.tsx` (see "Parallel sessions").
- `src/components/primitives.tsx`: `Button`, `IconButton` (`label` required; sizes `2xs|xs|sm|md`; all reach 44 px under `pointer-coarse`), `Select` (native), `fieldClass({ size, invalid, className })` from `primitives-classes.ts`.
- `src/components/provider.tsx`: `useNishStrings()`, `useNishConfig()` (`locale`, `dir`, `portalContainer`). Locale resolution used elsewhere: `locale ?? config.locale ?? getDefaultLocale()` (`getDefaultLocale` from `src/format.ts`, default `en-US`).
- `src/components/client.ts`: `useIsClient`, `useIsoLayoutEffect`, `isRtl(el)`. `src/components/hooks.tsx`: `useMediaQuery(query)` (false on the server).
- `src/components/icons.tsx`: an `Svg` wrapper (24 grid, stroke 2, `aria-hidden`), with `XIcon`, `CheckIcon`, `ChevronDownIcon` and no left/right chevrons or calendar.
- Global focus ring: `:focus-visible` in `src/css/base.css` line 87. Components do not add their own.
- Color roles in use: `bg-th-accent text-th-on-accent` (selected), `bg-th-accent-soft`, `text-th-hi`, `text-th-hi2`, `text-th-hi3`, `text-th-ghost`, `border-th-line`, `border-th-line-strong`, `border-th-line-control`, `bg-th-surface`, `bg-th-elevated`, `shadow-pop`. `npm run th-check` fails on unknown `th-*` names.
- Registries that a new component must reach (all edited by T7 only): `src/index.ts`; `site/components/index.ts` `COMPONENT_DOCS`; `site/docgen.mjs` `COMPONENTS`; `tests/ssr/cases.tsx` (`tests/ssr/ssr.test.tsx` fails if a component export has no case); `tools/size-budgets.json`; `tools/api-surface.snapshot.json` (regenerated); `tools/docgen-coverage.test.ts` (every exported component's props need a JSDoc description, and its allow-lists may only shrink); `README.md` "What's in it"; `CHANGELOG.md`.
- New `src/components/*.tsx` files reach `dist/esm/components/` automatically (`scripts/build.mjs`), and `tools/exports.test.mjs` checks that `'use client'` stays the first line of their output. `package.json` `exports` needs no change: everything is exported from `.`.
- `tests/a11y/vite.config.ts` serves `tests/a11y/` as its root on port 5195, so a new `tests/a11y/pickers.html` is served at `http://localhost:5195/pickers.html` with no config change. `playwright.config.ts` starts that server.
- CI (`.github/workflows/ci.yml`, on `pull_request` and push to master): `check` (npm ci, `npm run check`, `npm run test:tools`, `npm run test:unit -- --coverage` with thresholds statements 81 / branches 79 / functions 85 / lines 84, `npm run size`, `npx playwright test`, the demo and site visual checks), `browsers` (overlay specs in Firefox and WebKit), `consumers` (next, vite, ts), `visual` (Fold check on the docs site), plus `codeql.yml`.
- Traps (ui `CLAUDE.md`): CodeQL flags polynomial regexes, so use linear regexes only (`/\d+/g`, anchored fixed-width ISO). A leftover `vite` harness server locks the worktree folder on Windows, so stop it before `git worktree remove`.

## Design

### Shared helpers: `src/components/calendar-classes.ts` (no directive, no React)

```ts
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export interface Ymd { y: number; m: number; d: number } // m is 1-12
export interface DateFieldPart { type: 'day' | 'month' | 'year' | 'literal'; value: string }

export function parseIso(s: string | null | undefined): Ymd | null;      // /^(\d{4})-(\d{2})-(\d{2})$/, year 1-9999, real day; else null
export function toIso(p: Ymd): string;                                    // '0042-01-05' (year padded to 4)
export function parseMonth(s: string | null | undefined): { y: number; m: number } | null; // /^(\d{4})-(\d{2})$/
export function monthOf(iso: string): string;                             // '2026-11-05' -> '2026-11'
export function firstOfMonth(month: string): string;                      // '2026-11' -> '2026-11-01'
export function daysInMonth(y: number, m: number): number;
export function addDays(iso: string, n: number): string;
export function addMonths(iso: string, n: number): string;               // day clamped: 2026-01-31 +1 -> 2026-02-28
export function addYears(iso: string, n: number): string;                // 2024-02-29 +1 -> 2025-02-28
export function shiftMonth(month: string, n: number): string;            // '2026-12' +1 -> '2027-01'
export function weekday(iso: string): WeekDay;
export function startOfWeek(iso: string, weekStartsOn: WeekDay): string;
export function endOfWeek(iso: string, weekStartsOn: WeekDay): string;
export function clampIso(iso: string, min?: string | null, max?: string | null): string;
export function inRange(iso: string, min?: string | null, max?: string | null): boolean;
export function monthGrid(month: string, weekStartsOn: WeekDay): (string | null)[][]; // always 6 rows x 7, null = empty cell
export function calendarKeyTarget(key: string, shiftKey: boolean, from: string, weekStartsOn: WeekDay, rtl: boolean): string | null;
export function weekStartFor(locale: string): WeekDay;
export function isoToday(now?: Date): string;                            // the viewer's local calendar day
export function resolveLocale(locale?: string | null): string;           // Intl.getCanonicalLocales in try/catch, fallback 'en-US'
export function dateFieldParts(locale: string): DateFieldPart[];         // cached
export function formatDateField(iso: string, locale: string): string;    // '11/05/2026' en-US, '05.11.2026' de-DE
export function parseDateField(text: string, locale: string): string | null;
export function datePlaceholder(locale: string, tokens: { day: string; month: string; year: string }): string; // 'MM/DD/YYYY'
export function monthTitle(month: string, locale: string): string;       // 'November 2026'
export function monthNames(locale: string): string[];                    // 12 long names, January first
export function weekdayNames(locale: string, weekStartsOn: WeekDay): { short: string; long: string }[];
export function dayNumber(iso: string, locale: string): string;          // Intl { day: 'numeric' }, so non-Latin digits work
export function fullDate(iso: string, locale: string): string;           // 'Thursday, November 5, 2026'
```

Rules:
- Make a `Date` from `Ymd` with `const t = new Date(0); t.setUTCFullYear(y, m - 1, d); return t;`. Read it back with `getUTCFullYear/Month/Date/Day`.
- Comparison is plain string comparison (`a < b`), which is correct for 4-digit ISO.
- Intl formatters are made on first use and kept in a module `Map<string, Intl.DateTimeFormat>` keyed by `locale|options-key`. Nothing is created at import. Every format call passes `timeZone: 'UTC'`.
- `calendarKeyTarget`: ArrowRight is +1 day (in RTL, -1), ArrowLeft is -1 (in RTL, +1), ArrowDown +7, ArrowUp -7, Home `startOfWeek`, End `endOfWeek`, PageUp `addMonths(-1)`, PageDown `addMonths(+1)`, Shift+PageUp `addYears(-1)`, Shift+PageDown `addYears(+1)`. Any other key returns null.
- `weekStartFor(locale)`: read `region = new Intl.Locale(resolveLocale(locale)).maximize().region` (try/catch; on failure use `'US'`). Return 0 for SUN = `AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW`, 6 for SAT = `AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY`, and 1 for everything else.
- `dateFieldParts(locale)`: `formatToParts` of 2026-12-31 with `{ year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }`. Keep only `day`, `month`, `year` and `literal` parts, mapping any other type to a literal with the same value.
- `parseDateField(text, locale)`: trim. Empty returns null. If it matches `/^\d{4}-\d{2}-\d{2}$/`, return `parseIso` (null if invalid). Otherwise take `text.match(/\d+/g)`. With exactly 3 groups, assign them in the order of the `day/month/year` parts. With exactly 1 group of 8 digits, split it in that order with widths day 2, month 2, year 4. Any other shape returns null. A year of 1-2 digits becomes 2000 + y, 3 digits returns null, 4 digits is used as is. Month must be 1-12 and day 1-`daysInMonth`. Return `toIso`. Reject any character other than digits, whitespace, `/`, `.`, `-` and `,`: if `/[^\d\s/.,-]/.test(text)` is true, return null.
- `datePlaceholder`: map the parts, replacing day/month/year with the tokens and keeping literals. en-US gives `MM/DD/YYYY`, de-DE `DD.MM.YYYY`, ja-JP `YYYY/MM/DD`.
- `isoToday(now = new Date())` uses local `getFullYear/getMonth/getDate` (the viewer's day, not UTC).

### Carousel helpers: `src/components/carousel-classes.ts` (no directive)

```ts
export const CAROUSEL_MIN_INTERVAL = 2000;
export const CAROUSEL_MAX_DOTS = 7;
/** Index of the slide whose start edge is closest to the track's start edge. */
export function nearestSlide(starts: readonly number[], origin: number): number; // -1 for an empty array; ties go to the lower index
export function stepIndex(index: number, dir: 1 | -1, count: number, loop: boolean): number; // clamps, or wraps when loop
```

### Strings (`src/components/strings.ts`, inserted right after the `searching` key in the interface and in `DEFAULT_STRINGS`)

Each one has a JSDoc line naming the component, as the other keys do.

| Key | Type | Default |
|---|---|---|
| `chooseDate` | string | `'Choose date'` |
| `changeDate` | `(date: string) => string` | `` (date) => `Change date, ${date}` `` |
| `previousMonth` | string | `'Previous month'` |
| `nextMonth` | string | `'Next month'` |
| `month` | string | `'Month'` |
| `year` | string | `'Year'` |
| `dayToken` | string | `'DD'` |
| `monthToken` | string | `'MM'` |
| `yearToken` | string | `'YYYY'` |
| `selectedCount` | `(count: number) => string` | `` (n) => `${n} selected` `` |
| `optionAdded` | `(label: string) => string` | `` (l) => `Added ${l}` `` |
| `optionRemoved` | `(label: string) => string` | `` (l) => `Removed ${l}` `` |
| `clearAll` | string | `'Clear all'` |
| `maxSelected` | `(max: number) => string` | `` (n) => `You can pick up to ${n}` `` |
| `carouselRole` | string | `'carousel'` |
| `slideRole` | string | `'slide'` |
| `slideLabel` | `(n: number, count: number) => string` | `` (n, c) => `${n} of ${c}` `` |
| `previousSlide` | string | `'Previous slide'` |
| `nextSlide` | string | `'Next slide'` |
| `goToSlide` | `(n: number) => string` | `` (n) => `Go to slide ${n}` `` |
| `slidePicker` | string | `'Choose slide'` |
| `startRotation` | string | `'Start slide rotation'` |
| `stopRotation` | string | `'Stop slide rotation'` |

### Calendar (`src/components/calendar.tsx`)

```ts
export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
  /** The picked day as YYYY-MM-DD (controlled), or null for none. */
  value?: string | null;
  /** The first picked day of an uncontrolled calendar. */
  defaultValue?: string | null;
  /** Called with the day the reader picks (YYYY-MM-DD). */
  onValueChange?: (value: string) => void;
  /** The month shown, as YYYY-MM (controlled). Pair with onMonthChange. */
  month?: string;
  /** The first month shown when uncontrolled. Default: the value's month, else this month. */
  defaultMonth?: string;
  /** Called with YYYY-MM when the shown month changes (buttons, keys, dropdowns). */
  onMonthChange?: (month: string) => void;
  /** Earliest day that can be picked (YYYY-MM-DD). */
  min?: string;
  /** Latest day that can be picked (YYYY-MM-DD). */
  max?: string;
  /** Return true to disable a day (YYYY-MM-DD), e.g. weekends. */
  isDateDisabled?: (date: string) => boolean;
  /** BCP 47 tag for month and weekday names. Default NishProvider locale, then setDefaultLocale() (en-US). */
  locale?: string;
  /** First column: 0 Sunday to 6 Saturday. Default from the locale's region. */
  weekStartsOn?: WeekDay;
  /** 'label' (default): the month name with previous and next buttons. 'dropdowns': month and year selects as well. */
  captionLayout?: 'label' | 'dropdowns';
  /** First year in the year select. Default min's year, else this year minus 100. */
  fromYear?: number;
  /** Last year in the year select. Default max's year, else this year plus 10. */
  toYear?: number;
  /** Focus the day that has the Tab stop when the calendar mounts (DatePicker sets it). */
  autoFocus?: boolean;
  /** Accessible name of the previous-month button. Default "Previous month". */
  previousMonthLabel?: string;
  /** Accessible name of the next-month button. Default "Next month". */
  nextMonthLabel?: string;
}
```

Behavior:
- `loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale())`; `ws = weekStartsOn ?? weekStartFor(loc)`. An invalid `value`, `defaultValue`, `min`, `max` or `month` string is ignored (treated as unset) with a dev warning `Calendar: "<prop>" must be YYYY-MM-DD` (or `YYYY-MM` for month).
- `today = useSyncExternalStore(noopSubscribe, () => isoToday(), () => null)`.
- Shown month: `month ?? ownMonth ?? (today ? monthOf(today) : null)`, where `ownMonth` starts at `defaultMonth ?? monthOf(value ?? defaultValue)` or null. Changing it (buttons, keys, selects) sets `ownMonth` when uncontrolled and always calls `onMonthChange`.
- When the shown month is null (server render with no value and no month), render the caption row with an empty title and a 6x7 grid of empty cells. The client fills it after hydration.
- Tab stop (`focusedDate` state, null until a key or click moves it): use `focusedDate` if it is in the shown month, else the selected value if it is in the shown month, else today if it is in the shown month, else the first day of the month that is in range and not disabled, else the first day of the month. Exactly one day button has `tabIndex={0}`, and every other has -1.
- Caption row: `<div className="flex items-center justify-between gap-1">` holding the previous IconButton (`size="sm"`, `ChevronLeftIcon` with `rtl:-scale-x-100`), the title, and the next IconButton (`ChevronRightIcon`, `rtl:-scale-x-100`). The title is `<div id={titleId} aria-live="polite" className="text-sm font-semibold text-th-hi">{monthTitle}</div>`. With `captionLayout="dropdowns"`, the title gets `sr-only`, and two `Select size="sm"` controls sit between the buttons: month (`aria-label={strings.month}`, 12 `monthNames`) and year (`aria-label={strings.year}`, `fromYear`..`toYear`, plus the shown year if it is outside that range). The previous button is `disabled` when `min` is set and the last day of the previous month is before `min`; the next button is `disabled` when the first day of the next month is after `max`.
- Grid: `<table role="grid" aria-labelledby={titleId} className="border-collapse" onKeyDown={onGridKey}>`. The thead has one row of `<th scope="col" abbr={long} className="size-10 p-0 text-center text-xs font-medium text-th-hi3 pointer-coarse:size-11">{short}</th>`. The tbody has 6 `<tr>`s. A day cell is `<td role="gridcell" aria-selected={isSelected} className="p-0">` containing:

```tsx
<button type="button" tabIndex={isTabStop ? 0 : -1} data-date={iso}
  data-autofocus={autoFocus && isTabStop ? '' : undefined}
  aria-label={fullDate(iso, loc)} aria-current={iso === today ? 'date' : undefined}
  aria-disabled={isDisabled || undefined} data-state={isSelected ? 'active' : 'inactive'}
  data-disabled={isDisabled ? '' : undefined} onClick={() => pick(iso)}
  className={cn('flex size-10 items-center justify-center rounded-lg text-sm tabular-nums text-th-hi2 transition-colors pointer-coarse:size-11',
    !isSelected && !isDisabled && 'hover:bg-th-elevated hover:text-th-hi',
    iso === today && !isSelected && 'font-semibold text-th-accent ring-1 ring-inset ring-th-accent/50',
    isSelected && 'bg-th-accent font-semibold text-th-on-accent forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:forced-color-adjust-none',
    isDisabled && 'cursor-not-allowed text-th-ghost line-through forced-colors:text-[GrayText]')}>
  {dayNumber(iso, loc)}
</button>
```

  An empty cell is `<td className="p-0" />` with a `size-10 pointer-coarse:size-11` spacer `<div aria-hidden="true" />`.
- `pick(iso)`: when the day is disabled, do nothing. Otherwise set `focusedDate`, set own value when uncontrolled, and call `onValueChange(iso)`. Picking the selected day again calls `onValueChange` again; there is no deselect.
- `onGridKey(e)`: Enter and Space are native button clicks, so leave them alone. For keys where `calendarKeyTarget(e.key, e.shiftKey, current, ws, isRtl(e.currentTarget))` returns a date: `preventDefault()`, clamp with `clampIso(target, min, max)`, set `focusedDate`, set the shown month to `monthOf(target)` when it differs, and set a `focusPending` ref. A `useIsoLayoutEffect` that runs after each render with `focusPending` set focuses `rootRef.current.querySelector('[data-date="' + focusedDate + '"]')` and clears the ref. `current` is the day that has the Tab stop.
- Escape is not handled, so it reaches the Popover's document listener.
- Root: `<div {...rest} ref={ref} className={cn('inline-flex select-none flex-col gap-2', className)}>`.

### DatePicker (`src/components/date-picker.tsx`)

```ts
export interface DatePickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
  /** The text input. The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  /** The date as YYYY-MM-DD, or null for none (controlled). */
  value?: string | null;
  /** The starting date of an uncontrolled picker. */
  defaultValue?: string | null;
  /** Called with YYYY-MM-DD, or null when the field is cleared. */
  onValueChange?: (value: string | null) => void;
  /** Earliest date that can be picked or typed (YYYY-MM-DD). */
  min?: string;
  /** Latest date that can be picked or typed (YYYY-MM-DD). */
  max?: string;
  /** Return true to disable a date in the calendar and refuse it when typed. */
  isDateDisabled?: (date: string) => boolean;
  /** BCP 47 tag for the field format and the calendar. Default NishProvider locale, then setDefaultLocale(). */
  locale?: string;
  /** First column of the calendar: 0 Sunday to 6 Saturday. Default from the locale's region. */
  weekStartsOn?: WeekDay;
  /** Passed to the Calendar: 'dropdowns' adds month and year selects (birth dates). */
  captionLayout?: 'label' | 'dropdowns';
  /** Shown while empty. Default the locale's pattern, e.g. "MM/DD/YYYY". */
  placeholder?: string;
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string;
  /** Names the field by another element's id. */
  'aria-labelledby'?: string;
  /** Ids of help or error text; reaches the input (Field sets it). */
  'aria-describedby'?: string;
  /** Reaches the input (Field sets it on error). */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the text input, so a <label htmlFor> and Field reach it. */
  id?: string;
  /** Field name for a native form: a hidden input posts YYYY-MM-DD. */
  name?: string;
  /** The id of the <form> the hidden input belongs to, when it is not an ancestor. */
  form?: string;
  /** Marks the field required. */
  required?: boolean;
  disabled?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the calendar button. Default "Choose date", or "Change date, <date>" once set. */
  calendarLabel?: string;
  className?: string;
}
```

Markup:

```tsx
<div {...rest} data-state={open ? 'open' : 'closed'} data-disabled={disabled ? '' : undefined} className={cn('relative w-full min-w-0', className)}>
  <input ref={...} id={inputId} type="text" inputMode="numeric" autoComplete="off" spellCheck={false}
    value={shown} placeholder={placeholder ?? datePlaceholder(loc, tokens)} disabled={disabled} required={required}
    aria-label aria-labelledby aria-describedby aria-invalid={isInvalid || undefined} aria-required={required || undefined}
    onChange onBlur onKeyDown className={fieldClass({ size, invalid: isInvalid, className: 'pe-11 tabular-nums' })} />
  {name != null ? <input ref={hiddenRef} type="hidden" name={name} value={value ?? ''} form={form} disabled={disabled} /> : null}
  <button ref={buttonRef} type="button" aria-label={buttonLabel} aria-haspopup="dialog" aria-expanded={open} disabled={disabled}
    onClick={() => setOpen((o) => !o)}
    className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi disabled:pointer-events-none disabled:opacity-50">
    <span className="flex size-8 items-center justify-center rounded-md hover:bg-th-elevated"><CalendarIcon size={16} /></span>
  </button>
  <Popover open={open} onOpenChange={(o) => setOpen(o)} anchor={buttonRef} align="end" aria-label={strings.chooseDate} className="p-3">
    <Calendar value={value} onValueChange={pickFromCalendar} min={min} max={max} isDateDisabled={isDateDisabled}
      locale={loc} weekStartsOn={weekStartsOn} captionLayout={captionLayout} autoFocus />
  </Popover>
</div>
```

Behavior:
- Value state: controlled or uncontrolled as in Combobox. `shown = dirty ? text : (value ? formatDateField(value, loc) : '')`.
- `commitText()` runs on blur of the input and on Enter when `dirty`. Empty text commits null (when the value was not already null). Otherwise `parseDateField`. A parsed date that is in range and not disabled is committed, clears `dirty` and clears `badText`. Anything else sets `badText = true` and keeps the text. `isInvalid = invalid || ariaInvalid true/'true' || badText`.
- Enter in the input: when `dirty`, call `preventDefault()` and `commitText()`. When not dirty, let it submit the form.
- Alt+ArrowDown in the input opens the calendar (`preventDefault`). Escape in the input while `dirty` (calendar closed) resets the text, calls `stopPropagation`, and leaves the value as it was.
- `pickFromCalendar(iso)`: commit `iso`, clear `dirty` and `badText`, and `setOpen(false)`. The Popover returns focus to the calendar button (APG: focus goes back to the button).
- `buttonLabel = calendarLabel ?? (value ? strings.changeDate(fullDate(value, loc)) : strings.chooseDate)`.
- `commit(v)`: set own value when uncontrolled, then call `onValueChange(v)`. On form reset an uncontrolled picker returns to `defaultValue`, the same listener as Combobox.
- The import of Popover: `import { Popover } from './overlay';`. See "Parallel sessions" for the change to make if Popover has moved to its own module on master by rebase time.

### MultiSelect (`src/components/multi-select.tsx`)

```ts
export interface MultiSelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
  /** The text input (the combobox element). The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  options: ComboboxOption[];
  /** The picked values, in the order they were picked (controlled). */
  value?: string[];
  /** The starting values of an uncontrolled MultiSelect. */
  defaultValue?: string[];
  /** Called with the new list of values. */
  onValueChange?: (value: string[]) => void;
  /** Called with the new values and their options. */
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  /** Filtering. Default: case-insensitive substring on label and hint; show at most 50.
   *  With onQueryChange and no filter, options are shown as given (the server filtered them). */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** No more than this many values can be picked; the rest of the options are disabled. */
  maxSelected?: number;
  /** Shown in the text box while nothing is picked. */
  placeholder?: string;
  'aria-label'?: string; 'aria-labelledby'?: string; 'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the text input. */
  id?: string;
  /** Field name for a native form: one hidden input per picked value. */
  name?: string;
  /** The id of the <form> the hidden inputs belong to. */
  form?: string;
  /** Required while nothing is picked. */
  required?: boolean;
  disabled?: boolean;
  /** Shown when nothing matches. Default "No matches". */
  emptyText?: string;
  /** Async options: called (debounced 200ms) with the query. */
  onQueryChange?: (q: string) => void;
  /** Shows a Spinner row "Searching…" while true. */
  loading?: boolean;
  /** The loading row and its announcement. Default "Searching…". */
  loadingText?: string;
  /** The polite announcement of the result count. Default "3 results" / "1 result". */
  resultsText?: (count: number) => string;
  /** md (default) or sm. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the clear-all button. Default "Clear all". */
  clearLabel?: string;
  className?: string;
}
```

Markup: the root `div` (wrapper, `...rest`, `data-state`, `data-disabled`, `data-invalid`, `relative w-full min-w-0`) contains the box. The box uses TagInput's root classes (`fieldClass({ size, invalid, className: cn('relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1 pe-11', 'focus-within:border-th-accent focus-within:ring-2 focus-within:ring-th-accent/25', 'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50', 'forced-colors:focus-within:outline-solid forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-[Highlight]') })`) and holds:
- one `<Chip variant="tag" size="sm" removeLabel={strings.removeNamed(label)} onRemove={disabled ? undefined : () => removeValue(v)}>` per value, where `label` comes from `options`, then from a `seen` map of options picked in this instance (so async results keep their labels), then from the raw value;
- the `<input role="combobox" aria-expanded aria-controls aria-autocomplete="list" aria-activedescendant aria-label aria-labelledby aria-describedby aria-invalid aria-required required={required && values.length === 0} placeholder={values.length === 0 ? placeholder : undefined} className="min-w-24 flex-1 bg-transparent py-0.5 text-th-hi outline-none placeholder:text-th-hi3">`;
- the clear-all button, shown when `values.length > 0 && !disabled`. It copies Combobox's clear button markup and classes with `aria-label={clearLabel ?? strings.clearAll}`, `tabIndex={-1}` and `absolute inset-y-0 end-0`. A click sets `[]` and focuses the input.

Outside the box: the status (`role="status" aria-live="polite" className="sr-only"`) and the listbox (Combobox's `ul` classes, `role="listbox" aria-multiselectable="true"`). Each option `li` uses Combobox's classes and has `aria-selected={picked}`. At its start it has a 16 px box: `<span aria-hidden="true" className={cn('flex size-4 shrink-0 items-center justify-center rounded border', picked ? 'border-th-accent bg-th-accent text-th-on-accent forced-colors:bg-[Highlight]' : 'border-th-line-control')}>{picked ? <CheckIcon size={12} /> : null}</span>`, then the label and the hint. Hidden inputs: one `<input type="hidden" name={name} value={v} form={form} disabled={disabled} />` per value when `name` is set.

Keys on the input:
- ArrowDown/ArrowUp open the list when it is closed (active = the first picked option in view, else the first or last enabled one), and otherwise move the active option, wrapping and skipping disabled ones. Copy `step` and `edge` from Combobox.
- Home/End: when open, the first or last enabled option (`preventDefault`).
- Enter: when open with an active option, call `toggle(option)` with `preventDefault`. The list stays open, the query clears, and the active option stays on the toggled option's index in the unfiltered view. When closed, do nothing and let the form submit.
- Escape: when open, close with `preventDefault` + `stopPropagation`. When closed with text, clear the text with `stopPropagation`. Otherwise leave it alone, so an enclosing Modal closes.
- Backspace when `text === ''`, the caret is at 0 and `values.length > 0`: `preventDefault` and remove the last value.
- Tab: close.
- A click on the box outside a chip, button or option focuses the input and opens the list. Focus on the input does not open the list on its own.
- Option: `onMouseDown` preventDefault, `onClick={() => toggle(o)}`, and `onMouseMove` sets active (as in Combobox).
- Blur leaving the wrapper (`relatedTarget` outside it) closes the list and clears the text.

`toggle(o)`: a disabled option does nothing. A picked option is removed. An unpicked one is added when `maxSelected` is unset or `values.length < maxSelected`; when the limit is reached, the status says `strings.maxSelected(maxSelected)` and nothing is added. Every change calls `onValueChange(next)` and `onChange(next, next.map(toOption))`, and the announcement is set to `optionAdded(label)` or `optionRemoved(label)`. While the limit is reached, unpicked options render with `aria-disabled` and the disabled styling.

Status text: the last announcement if one was made since the last keystroke or open, else (when open) the loading text, `emptyText`, or `resultsText(n)`, else `''`. Typing clears the announcement.

### Carousel (`src/components/carousel.tsx`)

```ts
export interface CarouselProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label'> {
  /** The root <section>. */
  ref?: Ref<HTMLElement>;
  /** Required: names the carousel ("Featured trips"). */
  'aria-label': string;
  /** One child per slide. */
  children: ReactNode;
  /** The current slide (controlled), from 0. */
  index?: number;
  /** The first slide of an uncontrolled carousel. Default 0. */
  defaultIndex?: number;
  /** Called with the new index after a button, a key, a swipe or rotation. */
  onIndexChange?: (index: number) => void;
  /** Width of each slide, any CSS length. Default "100%"; "85%" shows the next slide peeking in. */
  slideWidth?: string;
  /** Previous at the first slide goes to the last, and next at the last goes to the first. Default false. */
  loop?: boolean;
  /** Rotate every this many milliseconds (at least 2000). Off by default. */
  autoPlay?: number;
  /** Dots to pick a slide. Default: shown when there are 7 slides or fewer, a "3 / 12" counter otherwise. */
  indicators?: boolean;
  /** Names each slide for screen readers. Default "1 of 5". */
  slideLabel?: (n: number, count: number) => string;
  /** Accessible name of the previous button. Default "Previous slide". */
  previousLabel?: string;
  /** Accessible name of the next button. Default "Next slide". */
  nextLabel?: string;
  className?: string;
}
```

Markup:

```tsx
<section {...rest} ref={ref} aria-roledescription={strings.carouselRole} aria-label={ariaLabel} data-state={rotating ? 'active' : 'inactive'}
  onPointerEnter onPointerLeave onFocus onBlur className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
  <div className="relative min-w-0">
    {autoPlay ? (
      <IconButton label={playing ? strings.stopRotation : strings.startRotation} size="sm" variant="subtle" onClick={togglePlay}
        className="absolute end-2 top-2 z-[1] rounded-full shadow-pop">{playing ? <PauseIcon /> : <PlayIcon />}</IconButton>
    ) : null}
    <div ref={trackRef} tabIndex={0} aria-live={rotating ? 'off' : 'polite'} onKeyDown={onTrackKey} onScroll={onScroll}
      className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slides.map((child, i) => (
        <div key={i} role="group" aria-roledescription={strings.slideRole} aria-label={label(i + 1, count)} data-index={i}
          data-state={i === index ? 'active' : 'inactive'} onFocus={() => setFromFocus(i)}
          className="min-w-0 shrink-0 snap-start" style={{ width: slideWidth }}>{child}</div>
      ))}
    </div>
  </div>
  {count > 1 ? (
    <div className="flex items-center gap-2">
      <IconButton label={prevName} size="sm" aria-disabled={!canPrev || undefined} onClick={() => canPrev && goTo(stepIndex(index, -1, count, loop))}><ChevronStart className="rtl:-scale-x-100" /></IconButton>
      <div className="flex min-w-0 flex-1 justify-center">
        {showDots ? (
          <div role="group" aria-label={strings.slidePicker} className="flex">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={strings.goToSlide(i + 1)} aria-current={i === index ? 'true' : undefined} onClick={() => goTo(i)}
                className="flex size-8 items-center justify-center rounded-full pointer-coarse:size-11">
                <span className={cn('size-2 rounded-full transition-colors', i === index ? 'bg-th-accent forced-colors:bg-[Highlight]' : 'bg-th-line-strong forced-colors:bg-[ButtonText]')} />
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs tabular-nums text-th-hi3" aria-hidden="true">{index + 1} / {count}</span>
        )}
      </div>
      <IconButton label={nextName} size="sm" aria-disabled={!canNext || undefined} onClick={() => canNext && goTo(stepIndex(index, 1, count, loop))}><ChevronEnd className="rtl:-scale-x-100" /></IconButton>
    </div>
  ) : null}
</section>
```

Behavior:
- `slides = Children.toArray(children)` and `count = slides.length`. With 0 slides, render the section with an empty track and no controls, plus a dev warning `Carousel: no slides`. With 1 slide, there are no controls and no rotation.
- `index` is controlled or uncontrolled, clamped to `[0, count-1]`. `canPrev = loop || index > 0` and `canNext = loop || index < count - 1`. `showDots = indicators ?? count <= CAROUSEL_MAX_DOTS`.
- `goTo(i)`: set the index, call `onIndexChange(i)` when it changed, set `targetRef = i`, and call `slideEl(i).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'start' })`. `reduced = useMediaQuery('(prefers-reduced-motion: reduce)')`.
- `onScroll` (one rAF per frame): `starts` = each slide's start edge, which is `getBoundingClientRect().left` in LTR or `.right` in RTL. `origin` = the track's matching edge. `n = nearestSlide(starts, origin)`. While `targetRef` is set, ignore `n` until `n === targetRef` (then clear it) or until 700 ms have passed since `goTo`. Otherwise, when `n !== index`, set the index and call `onIndexChange(n)`.
- When a controlled `index` prop changes to a value that differs from the slide in view, scroll to it as `goTo` does, without calling `onIndexChange`.
- `setFromFocus(i)`: when focus moves into slide `i`, set the index to `i` (call `onIndexChange` when it changed) without calling `scrollIntoView`; the browser already scrolls the focused element in.
- `onTrackKey` (only when `e.target === e.currentTarget`): ArrowRight goes next and ArrowLeft goes previous, with the two swapped when `isRtl(track)`. Home goes to 0 and End to `count - 1`. Each calls `preventDefault`. Next and previous respect `loop`.
- Rotation: `playState` is `'auto' | 'on' | 'off'` and starts at `'auto'`. `playing = playState === 'on' || (playState === 'auto' && !reduced)`. `togglePlay` sets `'off'` when playing, else `'on'`. `paused` is true while the pointer is over the section, focus is inside it, or `document.visibilityState === 'hidden'` (a `visibilitychange` listener in an effect). `rotating = !!autoPlay && count > 1 && playing && !paused`. While `rotating`, a `setTimeout(max(autoPlay, CAROUSEL_MIN_INTERVAL))` is re-armed on every index change and calls `goTo(index === count - 1 ? 0 : index + 1)`; rotation always wraps. An `autoPlay` under 2000 logs a dev warning and uses 2000.
- Inline icons: four `svg` elements with `aria-hidden="true"`, `focusable="false"`, viewBox 24, stroke 2, size 16. Paths: chevron start `m15 18-6-6 6-6`, chevron end `m9 18 6-6-6-6`, pause `M8 5v14M16 5v14`, play `M7 4v16l13-8z` (filled with `fill="currentColor"`).
- The track never makes the page scroll sideways: `w-full min-w-0` on the track and the section, and slides `shrink-0` inside the track's own overflow.

### Private icons (`src/components/picker-icons.tsx`)

Same `Svg` pattern as `icons.tsx` (copy the 18-line `Svg` helper): `ChevronLeftIcon` (`m15 18-6-6 6-6`), `ChevronRightIcon` (`m9 18 6-6-6-6`), `CalendarIcon` (`<rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />`). No directive is needed, because the file uses no hooks. Not exported from `src/index.ts`.

### UI at each size

- 360 px: the Calendar is 7 x 44 px = 308 px wide inside a 332 px popover, clamped 8 px from the screen edges by Popover. DatePicker and MultiSelect are `w-full`, and chips wrap onto new lines. Carousel slides take the full width, and the controls row is 44 px tall with dots at 44 px. No horizontal page scroll.
- ~840 px and desktop: the Calendar cells are 40 px (44 px on touch). The popover sits under the button, aligned to the end. MultiSelect's list is as wide as the field.
- Light, dark and contrast: only theme roles are used. Selected uses `bg-th-accent`/`text-th-on-accent`, an existing pair already checked by `npm run contrast`. Disabled days use `text-th-ghost` with line-through, so they are not marked by color alone.

### Security, performance, ops

- Security: no network, no HTML injection (all text goes through React), and no user regexes. The parsing regexes are linear (CodeQL).
- Performance: MultiSelect filters in one pass over options lowercased once (`indexComboboxOptions`) and shows at most 50. The Calendar renders 42 cells, and its Intl formatters are cached per locale. The Carousel reads layout only in a rAF after a scroll. Size caps are under T7.
- Ops: not affected (a library release only). The docs site goes live through hosting's ui bump after the orchestrator's release.

## Tasks

All tasks run in `C:\Code\ui-picker-carousel` (branch `picker-carousel`). If `node_modules` is missing, run `npm ci` once. Implementers do not commit. Never run `release.yml`, `npm run release`, `npm publish`, `tools/npm-publish.mjs`, `gh workflow run` or `bash scripts/bump-consumers.sh`. These publish or release: never run for real by a subagent.

### T1 Strings, date helpers and private icons

- Owns: `src/components/strings.ts`, `src/components/calendar-classes.ts` (new), `src/components/calendar-classes.test.ts` (new), `src/components/picker-icons.tsx` (new)
- Reads: `src/format.ts`, `src/components/icons.tsx`, `src/components/forms-classes.ts`
- Depends on: none
- Change:
  1. `strings.ts`: insert the 23 keys from the Strings table directly after `searching: string;` in `NishStrings` (each with a JSDoc line, for example `/** DatePicker: calendar button name while empty. */`) and directly after `searching: 'Searching…',` in `DEFAULT_STRINGS`, in the table's order. Change nothing else in the file.
  2. `calendar-classes.ts`: implement every export in "Shared helpers" with the stated rules. Start the file with the comment `// Pure date helpers for Calendar and DatePicker: ISO YYYY-MM-DD days, Intl names and the typed-date parser. No React.` Use no directive and no React import.
  3. `picker-icons.tsx`: as specified.
- Edge cases (each one a test in `calendar-classes.test.ts`): `parseIso('2026-02-29')` is null and `'2024-02-29'` is valid; `addMonths('2026-01-31', 1)` gives `'2026-02-28'`; `addMonths('2026-03-31', -1)` gives `'2026-02-28'`; `addYears('2024-02-29', 1)` gives `'2025-02-28'`; `addDays` across a year end; year `0042` round-trips; `monthGrid('2026-11', 0)` has 6 rows, its first row starting `['2026-11-01', ...]`, and its last cells null; `monthGrid('2026-11', 1)` starts `[null, null, null, null, null, null, '2026-11-01']`; every `calendarKeyTarget` key, including RTL swap and Shift+PageUp; `clampIso` both ends; `weekStartFor('en-US')` is 0, `'de-DE'` 1, `'en-GB'` 1, `'ar-EG'` 6, `'pt-BR'` 0, `'xx-invalid!!'` 0 (falls back to US); `parseDateField` for `'11/05/2026'` and `'11-5-26'` in en-US (`'2026-11-05'`), `'05.11.2026'` in de-DE, `'2026/11/05'` in ja-JP, `'2026-11-05'` in any locale, `'11052026'` in en-US, and null for `'13/01/2026'`, `'02/30/2026'`, `'abc'`, `'1/2'`, `'11/05/2026x'`, `''`; `formatDateField('2026-11-05','en-US')` is `'11/05/2026'` and `'de-DE'` gives `'05.11.2026'`; `datePlaceholder('en-US', {day:'DD',month:'MM',year:'YYYY'})` is `'MM/DD/YYYY'`; `monthTitle('2026-11','en-US')` is `'November 2026'`; `weekdayNames('en-US', 1)[0].long` is `'Monday'`; `fullDate('2026-11-05','en-US')` is `'Thursday, November 5, 2026'`; `isoToday(new Date(2026, 10, 5, 23, 30))` is `'2026-11-05'`; `resolveLocale('not a locale')` is `'en-US'`.
- Acceptance: `npx vitest run src/components/calendar-classes.test.ts` passes; `npm run typecheck` passes; `npx eslint src/components/calendar-classes.ts src/components/picker-icons.tsx src/components/strings.ts` is clean.

### T2 Calendar and its docs page

- Owns: `src/components/calendar.tsx` (new), `src/components/calendar.test.tsx` (new), `site/components/calendar.tsx` (new)
- Reads: `src/components/calendar-classes.ts`, `src/components/picker-icons.tsx`, `src/components/strings.ts`, `src/components/primitives.tsx`, `src/components/provider.tsx`, `src/components/client.ts`, `src/format.ts`, `site/components/tag-input.tsx` (page pattern), `site/components/types.ts`
- Depends on: T1
- Change:
  1. Implement `Calendar` and `CalendarProps` as in Design. `'use client'` is the first line. Import `WeekDay` from `./calendar-classes` and re-export it: `export type { WeekDay } from './calendar-classes';`.
  2. Docs page `site/components/calendar.tsx` exporting `calendar: ComponentDoc` with `id: 'calendar'`, `name: 'Calendar'`, `exports: ['Calendar']`, `importLine: "import { Calendar } from '@nish/ui';"`. Import the component from `'../../src/components/calendar'`, not from `'../../src'` (T7 adds the barrel export later). Summary: `'A month grid that picks one day. Arrow keys move by day and week, Page Up and Page Down by month (with Shift, by year), Home and End to the week's ends. Month and weekday names come from Intl in the reader's locale.'` Controls: `captionLayout` select `['label','dropdowns']`, `locale` select `['en-US','en-GB','de-DE','ja-JP','ar-EG']`, `limits` boolean (min today-30, max today+60 when on). Initial: label, en-US, false. Stories: `basic` "Basic" (uncontrolled, `defaultValue` fixed at `'2026-11-05'`); `controlled` "Controlled" (shows `Picked: <value>` under it in `text-xs text-th-hi3`); `min-max` "Min and max" (min `'2026-11-03'`, max `'2026-11-24'`, `defaultMonth '2026-11'`); `weekends` "Weekends disabled" (`isDateDisabled` for Saturday and Sunday); `dropdowns` "Month and year selects" (`captionLayout="dropdowns"`, `fromYear 1940`, `toYear 2030`, `defaultValue '1990-06-15'`); `locales` "Locales" (`wide: true`, de-DE and ar-EG side by side, the ar-EG one inside `dir="rtl"`). Usage block: the `<Calendar value={day} onValueChange={setDay} min="2026-01-01" />` sample. Guidelines (final copy): `'Use DatePicker for a form field; use Calendar on its own when the month view is the page content (a booking page, a schedule).'`, `'Values are YYYY-MM-DD strings, the same as <input type="date">, so no timezone can shift the day.'`, `'Disabled days stay reachable with the arrow keys and are read as unavailable; give the reason next to the calendar.'`, `'The first day of the week follows the locale (Sunday in the US, Monday in most of Europe); weekStartsOn overrides it.'`.
- Tests (`calendar.test.tsx`, vitest + testing-library, `vi.useFakeTimers()` + `vi.setSystemTime(new Date(2026, 10, 5, 12))` where today matters): ref reaches the root; className merges; rest (`data-x`, `id`) passes through; grid has `aria-labelledby` pointing at the title text "November 2026"; 6 body rows; the Tab stop is the selected day, else today, else the first enabled day; ArrowRight/ArrowLeft/ArrowUp/ArrowDown/Home/End move focus to the right `data-date`; PageDown from `2026-01-31` focuses `2026-02-28` and the title says "February 2026"; Shift+PageUp moves back a year; in RTL (mock `isRtl` as `forms.test.tsx` does) ArrowLeft goes to the next day; focus clamps at `max`; Enter/click selects (`aria-selected="true"` on the cell, `onValueChange` called), and a disabled day does neither; uncontrolled and controlled value; controlled `month` + `onMonthChange`; prev button disabled at `min`'s month; `captionLayout="dropdowns"` changes the month through the selects; strings from `<NishProvider strings={{ previousMonth: 'Zurück' }}>` reach the button name; the `previousMonthLabel` prop wins over the provider; `aria-current="date"` on today; `autoFocus` puts `data-autofocus` on the Tab stop; an invalid `min` logs one dev warning.
- Acceptance: `npx vitest run src/components/calendar.test.tsx` passes; `npm run typecheck`; `npx eslint src/components/calendar.tsx site/components/calendar.tsx`.

### T3 DatePicker and its docs page

- Owns: `src/components/date-picker.tsx` (new), `src/components/date-picker.test.tsx` (new), `site/components/date-picker.tsx` (new)
- Reads: `src/components/calendar.tsx`, `src/components/calendar-classes.ts`, `src/components/picker-icons.tsx`, `src/components/overlay.tsx` (Popover), `src/components/combobox.tsx` (controlled, reset and hidden-input patterns), `src/components/primitives-classes.ts`, `site/components/popover.tsx` (framed page pattern)
- Depends on: T2
- Change:
  1. Implement `DatePicker` and `DatePickerProps` as in Design. `'use client'` is the first line.
  2. Docs page `site/components/date-picker.tsx` exporting `datePicker: ComponentDoc`: `id: 'date-picker'`, `name: 'DatePicker'`, `exports: ['DatePicker']`, `framed: { height: 480 }`, importing from `'../../src/components/date-picker'`. Summary: `'A date field: type the date in the reader's own format or pick it from a calendar. The value is a YYYY-MM-DD string, like a native date input, and it posts with a form.'` Controls: `size` `['md','sm']`, `captionLayout` `['label','dropdowns']`, `disabled` boolean, `invalid` boolean. Stories: `basic` "Basic"; `field` "In a Field" (`<Field label="Due date" hint="Type it or pick it.">`); `limits` "Min and max" (min `'2026-11-03'`, max `'2026-12-20'`); `birthday` "Birth date" (`captionLayout="dropdowns"`, `max` = `'2026-11-05'`, `placeholder` unset); `form` "In a form" (a `<form>` with `name="due"` and a submit Button that writes the posted `FormData` value under it). Usage: `<DatePicker aria-label="Due date" name="due" value={due} onValueChange={setDue} min="2026-01-01" />`. Guidelines: `'Typing works in the reader's numeric order (11/05/2026 in the US, 05.11.2026 in Germany) and in ISO (2026-11-05).'`, `'A date that cannot be read, or is outside min and max, marks the field invalid and keeps the text; pair it with a Field error.'`, `'The calendar button is the only Tab stop besides the text box; Alt+Down opens it from the text box.'`, `'For a date in a filter bar or a table cell, the native <input type="date"> through Input is still fine.'`.
- Tests (`date-picker.test.tsx`): ref reaches the input; className goes to the wrapper; id/aria-describedby reach the input; `Field` label reaches it (`getByLabelText`); placeholder `MM/DD/YYYY` in en-US and `DD.MM.YYYY` in de-DE; typing `11/5/2026` + blur calls `onValueChange('2026-11-05')` and shows `11/05/2026`; `13/40/2026` + blur sets `aria-invalid` and keeps the text with no call; a date after `max` is invalid; clearing + blur calls `onValueChange(null)`; Enter while dirty commits and calls `preventDefault` (form `onSubmit` not called); Escape while dirty restores the formatted value; clicking the button opens `role="dialog"` named "Choose date"; Alt+ArrowDown opens it; clicking a day in the dialog commits, closes it and focuses the button; the button name is "Change date, Thursday, November 5, 2026" once set; the hidden input posts the ISO value; form reset restores `defaultValue`; disabled disables both the input and the button; strings from a provider (`chooseDate`) reach the button name.
- Acceptance: `npx vitest run src/components/date-picker.test.tsx`; `npm run typecheck`; `npx eslint src/components/date-picker.tsx site/components/date-picker.tsx`.

### T4 MultiSelect and its docs page

- Owns: `src/components/multi-select.tsx` (new), `src/components/multi-select.test.tsx` (new), `site/components/multi-select.tsx` (new)
- Reads: `src/components/combobox.tsx`, `src/components/tag-input.tsx`, `src/components/forms.tsx` (Chip), `src/components/forms-classes.ts`, `src/combobox-filter.ts`, `src/components/strings.ts`, `site/components/combobox.tsx`
- Depends on: T1
- Change:
  1. Implement `MultiSelect` and `MultiSelectProps` as in Design. `'use client'` is the first line. Import `ComboboxOption` as a type from `./combobox`; do not redefine it.
  2. Docs page `site/components/multi-select.tsx` exporting `multiSelect: ComponentDoc`: `id: 'multi-select'`, `name: 'MultiSelect'`, `exports: ['MultiSelect']`, importing from `'../../src/components/multi-select'`. Options: 12 US states as `{ value: 'TX', label: 'Texas' }` and so on (Texas, California, New York, Florida, Washington, Oregon, Colorado, Arizona, Georgia, Illinois, Ohio, Utah). Summary: `'Pick several options from a list you can filter. Picked options show as removable tags; the list stays open so you can keep picking.'` Controls: `size` `['md','sm']`, `maxSelected` number 1-6, `disabled` boolean. Stories: `basic` "Basic" (with `pb-64` so the list shows in the page); `preset` "With values" (`defaultValue={['TX','WA']}`); `limit` "At most three" (`maxSelected={3}`); `field` "In a Field"; `async` "Server search" (`onQueryChange` filtering the states after a 400 ms `setTimeout`, with `loading`). Usage: `<MultiSelect aria-label="States" name="states" options={states} value={picked} onValueChange={setPicked} />`. Guidelines: `'Use MultiSelect for picking several items from a long or searchable list; for up to about six visible choices use Chip toggles or Checkboxes.'`, `'Enter and click add or remove the active option and keep the list open; Escape closes it; Backspace in an empty box removes the last pick.'`, `'Values keep the order they were picked in, and each posts as its own form value.'`, `'Set maxSelected to cap the picks; the remaining options turn unavailable and the limit is announced.'`.
- Tests (`multi-select.test.tsx`): ref reaches the input; className goes to the wrapper; rest passes through; `role="listbox"` has `aria-multiselectable="true"`; ArrowDown opens the list and sets `aria-activedescendant`; Enter toggles (`aria-selected` true, chip appears, list stays open, query clears); Enter again removes; clicking an option toggles; Backspace on empty removes the last chip; the chip remove button named "Remove Texas" removes it; clear-all empties; disabled options are skipped by the arrows and ignored on click; `maxSelected` disables the rest and announces "You can pick up to 2"; the status announces "Added Texas"; hidden inputs, one per value; `required` only while empty; uncontrolled form reset; controlled `value` + `onChange` gets options; Escape closes without bubbling (a parent `onKeyDown` spy is not called), and Escape when closed and empty bubbles; `onQueryChange` is debounced 200 ms (fake timers); a label is kept for a picked async option after `options` changes; strings from a provider (`clearAll`).
- Acceptance: `npx vitest run src/components/multi-select.test.tsx`; `npm run typecheck`; `npx eslint src/components/multi-select.tsx site/components/multi-select.tsx`.

### T5 Carousel and its docs page

- Owns: `src/components/carousel.tsx` (new), `src/components/carousel-classes.ts` (new), `src/components/carousel.test.tsx` (new), `site/components/carousel.tsx` (new)
- Reads: `src/components/primitives.tsx` (IconButton), `src/components/hooks.tsx` (useMediaQuery), `src/components/client.ts`, `src/components/strings.ts`, `src/components/forms.tsx` (ChipGroup's RTL arrows)
- Depends on: T1
- Change:
  1. `carousel-classes.ts` and `carousel.tsx` as in Design. `'use client'` is the first line of `carousel.tsx`. Tests import the helpers from `./carousel-classes` directly; `carousel.tsx` re-exports nothing from it, and nothing from it goes in the root barrel.
  2. Docs page `site/components/carousel.tsx` exporting `carousel: ComponentDoc`: `id: 'carousel'`, `name: 'Carousel'`, `exports: ['Carousel']`, importing from `'../../src/components/carousel'`. Slides are `Card`s (`'../../src/components/primitives'`) with a title and one line: "Smoky Mountains / Three days of trails and waterfalls.", "Big Bend / Desert canyons on the Rio Grande.", "Olympic / Rainforest, coast and glaciers.", "Zion / Slot canyons and the Narrows.", "Acadia / Granite coast and sunrise hikes." Summary: `'A row of slides you can swipe, step through with buttons or arrow keys, or jump to with the dots. It scrolls natively with scroll snap, so touch and right-to-left work without extra code.'` Controls: `slideWidth` select `['100%','85%','50%']`, `loop` boolean, `autoPlay` boolean (5000 ms when on), `indicators` boolean. Initial: 100%, false, false, true. Stories: `basic` "Basic"; `peek` "Next slide peeking" (`slideWidth="85%"`); `many` "Many slides" (12 numbered cards, counter instead of dots); `autoplay` "Auto-rotation" (`autoPlay={5000}`, note: `'Pauses on hover and focus; the button stops it for good. Off under reduced motion.'`); `controlled` "Controlled" (buttons outside showing `Slide {i + 1}`). Usage: `<Carousel aria-label="Featured trips" slideWidth="85%">{trips.map((t) => <TripCard key={t.id} trip={t} />)}</Carousel>`. Guidelines: `'Give every carousel an aria-label that says what the slides are.'`, `'Prefer a list or a grid when every item matters; a carousel hides all but one slide at a time.'`, `'Keep autoPlay off unless the slides are decorative; when on, use 5 seconds or more.'`, `'Slides stay in the Tab order, so links and buttons inside them are reachable; focusing one brings its slide into view.'`.
- Tests (`carousel.test.tsx`; stub `Element.prototype.scrollIntoView` with `vi.fn()` and mock `getBoundingClientRect` where scroll is tested): ref reaches the section; className and rest pass through; `aria-roledescription="carousel"` and the label; slides are groups named "1 of 3"; next calls `scrollIntoView` on slide 2 and sets `data-state="active"` on it; prev at the first slide has `aria-disabled="true"` and does nothing; `loop` wraps; dots: 3 buttons, `aria-current="true"` on the current one, and click goes to that slide; 8 slides show the counter text "1 / 8" and no dots; `indicators={false}` hides the dots; ArrowRight/ArrowLeft/Home/End on the track, with RTL swapped; controlled `index` + `onIndexChange`; a scroll event with mocked rects updates the index (`nearestSlide`); focus inside slide 3 makes it current; autoPlay with fake timers advances after 5000 ms and wraps at the end, pointer enter pauses it, the stop button stops it and changes its name to "Start slide rotation", and `autoPlay={500}` warns and uses 2000; reduced motion (mock `matchMedia`) starts stopped; `aria-live` is `off` while rotating and `polite` otherwise; one slide renders no controls; strings from a provider (`nextSlide`). `carousel-classes` tests: `nearestSlide` ties and empty input, `stepIndex` with and without loop.
- Acceptance: `npx vitest run src/components/carousel.test.tsx`; `npm run typecheck`; `npx eslint src/components/carousel.tsx src/components/carousel-classes.ts site/components/carousel.tsx`.

### T6 Browser checks: axe, keyboard and 360 px

- Owns: `tests/a11y/pickers.html` (new), `tests/a11y/pickers.tsx` (new), `tests/a11y/pickers.spec.ts` (new)
- Reads: `tests/a11y/index.html`, `tests/a11y/main.tsx`, `tests/a11y/axe.spec.ts` (copy `scan` and `load`), `playwright.config.ts`
- Depends on: T3, T4, T5
- Change:
  1. `pickers.html`: a copy of `tests/a11y/index.html` that loads `./pickers.tsx`, titled "Pickers harness".
  2. `pickers.tsx`: imports `./styles.css`, `applyTheme` from `'../../src/theme'`, and the four components from their own modules (`'../../src/components/calendar'` and so on, not the barrel). It applies `?dir=rtl`. Inside `<main>` it renders `<h1>Pickers harness</h1>`, then each component in a `Card` with a visible `<label>` or `aria-label`: a `Calendar` (`defaultValue="2026-11-05"`, `aria-label` unset, labelled by its title); a `DatePicker` inside `Field label="Due date"` with `defaultValue="2026-11-05"`, opened on load by `?open=datepicker` (the harness clicks the button in an effect); a `MultiSelect` (`aria-label="States"`, 6 options, `defaultValue={['TX']}`), with its list opened on load by `?open=multiselect` (focus the input and dispatch ArrowDown); and a `Carousel` (`aria-label="Trips"`) with 4 Card slides.
  3. `pickers.spec.ts` (`const PICKERS = 'http://localhost:5195/pickers.html'`):
     - axe (`scan`, zero serious/critical) for themes dark, light and contrast on load; with `?open=datepicker` and `?open=multiselect` in dark and light.
     - Calendar keys: focus the `2026-11-05` day, press ArrowRight, and check that `document.activeElement` has `data-date="2026-11-06"`. PageDown should change the title to "December 2026". Enter should set `aria-selected="true"` on the focused cell.
     - DatePicker: click "Change date, Thursday, November 5, 2026", expect the dialog "Choose date" and focus on `[data-date="2026-11-05"]`, press ArrowDown and then Enter, expect the dialog gone, the input value `11/12/2026` and focus on the calendar button. Escape with the dialog open closes it and returns focus to the button.
     - MultiSelect: focus the input, press ArrowDown and Enter, expect a new chip and the listbox still visible. Backspace twice on the empty input removes chips.
     - Carousel: click "Next slide", wait for `[aria-label="2 of 4"][data-state="active"]`. Focus the track and press End, and expect "4 of 4" active.
     - RTL (`?dir=rtl`): ArrowLeft on the calendar's focused day moves to the next day.
     - Phone: at `page.setViewportSize({ width: 360, height: 780 })` with `?open=datepicker`, expect `document.scrollingElement.scrollWidth <= 360`, the dialog's bounding box within `[0, 360]`, and every day button's box at least 44 x 44 px under `hasTouch` (use a `test.use({ hasTouch: true, isMobile: true })` describe block so `pointer-coarse` applies). At 840 x 900, expect no horizontal scroll.
- Acceptance: `npm run build`, then `npx playwright test tests/a11y/pickers.spec.ts --project=chromium` passes. Stop any leftover vite harness server afterwards.

### T7 Wire-up: registries, budgets, docs, changelog (last)

- Owns: `src/index.ts`, `site/components/index.ts`, `site/docgen.mjs`, `tests/ssr/cases.tsx`, `tools/size-budgets.json`, `tools/site.visual.json`, `tools/api-surface.snapshot.json`, `README.md`, `CHANGELOG.md`. It may also edit JSDoc comment lines only (no code) in the four component files when `docgen-coverage` reports a missing prop description.
- Reads: everything above
- Depends on: T2, T3, T4, T5 (it runs alongside T6; T6 owns none of these files)
- Change (every insertion goes at the named anchor, not at the end of the file, so it merges cleanly with the other ui sessions):
  1. `src/index.ts`, directly after the line `export type { ComboboxProps, ComboboxOption } from './components/combobox';`:

     ```ts
     export { Calendar } from './components/calendar';
     export type { CalendarProps, WeekDay } from './components/calendar';
     export { DatePicker } from './components/date-picker';
     export type { DatePickerProps } from './components/date-picker';
     export { MultiSelect } from './components/multi-select';
     export type { MultiSelectProps } from './components/multi-select';
     export { Carousel } from './components/carousel';
     export type { CarouselProps } from './components/carousel';
     ```
  2. `site/components/index.ts`: after `import { combobox } from './combobox';`, import `datePicker`, `calendar`, `multiSelect` and `carousel` from their files. In `COMPONENT_DOCS`, after `combobox,`, add `datePicker,`, `calendar,` and `multiSelect,`; after `scrollRow,`, add `carousel,`. If master has changed how pages are registered (ui-leftovers' bundle splitting, for example a lazy map), register the four the same way the `combobox` page is registered there.
  3. `site/docgen.mjs` `COMPONENTS`: after `'Combobox',`, add `'DatePicker', 'Calendar', 'MultiSelect', 'Carousel',`.
  4. `tests/ssr/cases.tsx`, in alphabetical position: `Calendar: () => <ui.Calendar defaultValue="2026-01-15" locale="en-US" />,`, `Carousel: () => (<ui.Carousel aria-label="Slides"><div>one</div><div>two</div></ui.Carousel>),`, `DatePicker: () => <ui.DatePicker aria-label="Due" defaultValue="2026-01-15" locale="en-US" name="due" />,`, `MultiSelect: () => (<ui.MultiSelect aria-label="Fruit" options={[{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }]} defaultValue={['a']} name="fruit" />),`.
  5. `tools/size-budgets.json`: after the `Combobox` entry, add four entries `{ "name": "Calendar", "from": "nish-ui", "import": "Calendar", "maxKB": X }` (and the same for DatePicker, MultiSelect and Carousel). X is the KB that `npm run size` measures plus 0.5, rounded up to the next 0.5. Hard caps: Calendar 9, DatePicker 24, MultiSelect 16, Carousel 8. If a measurement goes over its cap, stop and report it as a blocker; do not raise the cap. Raise `everything from .` only by the measured growth of the root bundle (the new measure plus 0.5, rounded up to the next 0.5). If that growth exceeds 10 KB, report it as a blocker. Edit nothing else in the file.
  6. `tools/site.visual.json`: after the `field` page object, add `{ "name": "date-picker", "url": "http://localhost:5191/#/components/date-picker", "waitFor": "[data-page]", "settle": 800 }` and `{ "name": "carousel", "url": "http://localhost:5191/#/components/carousel", "waitFor": "[data-page]" }`.
  7. `README.md` "What's in it": add `DatePicker, Calendar, MultiSelect,` after `Combobox,` in the "Actions and inputs" line (re-wrap the bullet at about 95 characters), and add `Carousel` after `ScrollRow` in "Layout and navigation".
  8. `CHANGELOG.md`: if there is no `## [Unreleased]` heading under the intro paragraph, add one above `## [2.0.2]`. Under its `### Added` (create it if missing), add these bullets:
     - `` `Calendar`: a month grid that picks one day (YYYY-MM-DD), with the WAI-ARIA date-grid keys (arrows, Home and End, Page Up and Page Down, Shift for years), min and max, disabled days, locale names and first weekday, and optional month and year selects. ``
     - `` `DatePicker`: a date field that takes the reader's numeric format or ISO, with a calendar in a Popover; posts YYYY-MM-DD like a native date input. ``
     - `` `MultiSelect`: a filterable multi-select combobox with removable tags, a list that stays open while picking, `maxSelected`, async search and one form value per pick. ``
     - `` `Carousel`: a scroll-snap carousel (WAI-ARIA carousel pattern) with previous and next buttons, slide dots, arrow keys, `loop`, and optional auto-rotation that pauses on hover and focus and respects reduced motion. ``
  9. Run `npm run build`, then `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`, and commit the regenerated `tools/api-surface.snapshot.json`.
- Edge cases: a git conflict in `api-surface.snapshot.json` after merging master is never hand-merged: take master's file, rebuild and regenerate. A conflict in `size-budgets.json` keeps both sides' entries and re-measures `everything from .` on the merged tree.
- Acceptance (the full local CI set, all of which must pass): `npm run check`; `npm run test:tools`; `npm run test:unit -- --coverage` (the thresholds hold); `npm run size`; `npx playwright test` (Chromium); `npx vitest run tools/docgen-coverage.test.ts`; the site visual check (`npx vite build --config site/vite.config.ts`, then `npx vite preview --config site/vite.config.ts --port 5191` in the background, then `node tools/visual-check.mjs tools/site.visual.json`, then stop the preview).

## Waves

W1: T1 · W2: T2, T4, T5 (each needs T1) · W3: T3 (needs T2) · W4: T6 (needs T3, T4, T5), T7 (needs T2-T5). Then the integrate step runs every T7 acceptance command plus `NISH_BROWSERS=all npx playwright test --project=firefox --project=webkit` if Firefox and WebKit are installed locally (skip if they are not; CI runs them), and `node tools/consumer-check.mjs ts`.

## Review focus

- Contract conformance in all four modules: the `'use client'` first line, no `new Intl.*` or other work at import, server render pure (no `Date.now()` or `window` in render; `today` only through the external store), `ref` and `...rest` on the stated elements, strings with per-instance props winning, logical CSS and RTL arrows, `data-state`/`data-disabled`, forced-colors utilities on selected and disabled states.
- Date correctness: month-end clamping, leap years, years under 100, week start per locale, and the parser refusing everything outside the stated grammar. CodeQL-safe regexes.
- Keyboard against the APG text in this spec: Calendar grid keys and focus movement across months, DatePicker focus return to the button, MultiSelect Escape layering inside a Modal, Carousel rotation stopping on focus.
- UI and mobile: the docs pages and `tests/a11y/pickers.html` at 360x780, 840x900 and 1440x900 in light and dark. Check the calendar popover inside the screen at 360, 44 px targets on touch, chips wrapping, no horizontal page scroll, and the carousel dots row.
- Size: each new budget is under its cap, and the root bundle growth is stated in the PR body.

## Release

1. Final commit `picker-carousel: release` on the branch:
   - delete `docs/specs/picker-carousel.md` (and `docs/specs/` if it is now empty);
   - `ROADMAP.md`: rewrite "Components left out of 2.0" so it lists only the components that are still not on master at that moment. Remove DatePicker and Calendar, MultiSelect and Carousel from it. If the tree-virtual session has already merged virtualized lists and tables, ContextMenu, HoverCard and TreeView, delete the whole entry. If some of those are still open, keep the entry's title and date and list only those, for example `- **Components left out of 2.0** (2026-11-03): virtualized lists and tables, ContextMenu, HoverCard, TreeView. Each follows the component contract in docs/DEVELOPING.md and gets a docs page, unit tests and a size budget.`;
   - `ROADMAP.md`: add under "Ideas": `- **Date range and time picking** (2026-11-05): Calendar and DatePicker pick one day. Add a range mode (two picks, a hover preview, value { from, to }) and a time field when an app needs one.`
2. `git fetch` and `git merge origin/master`, then rerun every T7 acceptance command. Regenerate the api-surface snapshot and re-measure the budgets after any merge.
3. Open one PR, `picker-carousel: DatePicker, Calendar, MultiSelect and Carousel`, only after all local checks pass. The body has a summary, tests, review rounds, the size table (each new budget and the root growth) and `Spec: https://github.com/nishant/ui/blob/<spec commit sha>/docs/specs/picker-carousel.md`. Wait for the checks to register, then `gh pr checks <n> --watch --interval 30`. Merge with `gh pr merge <n> --merge --delete-branch` only when nothing failed or is pending and `mergeStateStatus` is clean.
4. Do not dispatch `release.yml`; never run it for real from this session. Tell the orchestrator (parent session): "ui ready for release: picker-carousel merged (DatePicker, Calendar, MultiSelect, Carousel; suggested bump minor)".
5. No app adoption follows (Out of scope). After the orchestrator's release and hosting's `ui/vX.Y.Z` bump deploy, verify live: https://design.nish.software/#/components/date-picker, `/calendar`, `/multi-select` and `/carousel` at 360x780, 840x900 and 1440x900 in light and dark (the date picker opened), plus `npm view nish-ui version` equal to the newest tag. Whoever runs the check (this session if it is still open, or the orchestrator) records the result.
6. Remove the worktree after the merge (stop any vite harness server first; check `node_modules` is not a junction), and delete the local branch.

## CI budget

- `nishant/ui` is public, so its GitHub-hosted minutes are free. This spec touches no private repo, so it uses none of the 3,000-minute private allowance.
- Branch pushes trigger nothing. Only the `pull_request` events and the merge's push to master run `ci.yml` (check, browsers, consumers x3, visual) and `codeql.yml`.
- One PR, opened only after every check in `ci.yml` has passed locally (the T7 acceptance list). Review fixes are pushed as one batch, never several small pushes. No empty commits or re-runs to retrigger unless a check flaked, and then one re-run only.
- No Windows or macOS jobs exist in ui's PR workflow, and this spec adds none. No workflow file changes.
- Estimate: about 55 GitHub-hosted minutes per PR run (check ~20, browsers ~10, consumers 3 x ~6, visual ~10, CodeQL ~5) x at most 2 runs (open, one fix batch), plus ~45 for the push to master, about 155 minutes in total, all free.
- The expensive part is the ui release: its fan-out opens bump PRs in ~13 private repos. This session never releases. The orchestrator cuts one batched release after all ui sessions merge, and no app needs code changes for these components, so the bump PRs need no extra pushes.

## Parallel sessions

Sessions building in `nishant/ui` at the same time: `appshell-gaps`, `tree-virtual` and `ui-leftovers`. None of the other sessions (fold-and-vendor, offsite-backups, life-admin-skills, tradingview-integration, earnings-predictor) touch ui.

- **appshell-gaps** owns `src/components/app-shell.tsx`, `src/components/overlay.tsx` and its split, and the budget values in `tools/size-budgets.json`. This spec never edits overlay or AppShell. DatePicker imports Popover from `./overlay`. If, when you merge master before the PR, Popover is defined in another module (`git grep -n "export function Popover" origin/master -- src`), change the import in `date-picker.tsx` to that module so DatePicker stops pulling in Modal and Drawer, then re-measure. In `size-budgets.json` this spec only adds its four entries after `Combobox` and raises `everything from .` by its own measured growth. If appshell-gaps has lowered that root budget by the time we merge, re-measure on the merged tree and set root = measured + 0.5. State in the PR body how much of the root bundle these four components add, so the orchestrator can tell appshell-gaps how far the 100 KB target moved.
- **tree-virtual** adds VirtualList, VirtualTable, ContextMenu, HoverCard and TreeView, and edits the same registries: `src/index.ts`, `site/components/index.ts`, `site/docgen.mjs`, `tests/ssr/cases.tsx`, `src/components/strings.ts`, `tools/size-budgets.json`, `README.md`, `CHANGELOG.md` and the api-surface snapshot. It may also add icons to `src/components/icons.tsx`. Our insertions sit next to the Combobox lines (and our strings next to `searching`), and we never touch `icons.tsx`. Whoever merges second runs `git merge origin/master`, keeps both sides' lines in any registry conflict, regenerates the snapshot, re-measures the budgets, and reruns the full local checks. The ROADMAP entry "Components left out of 2.0" is shared: each session's release commit removes only its own components, and deletes the entry when nothing is left (see Release).
- **ui-leftovers** splits the docs-site bundle (it may change how `site/main.tsx` and `site/components/index.ts` load pages), raises `src/theme.ts` mutation coverage, marks fleet-only APIs internal (README and docs pages), and does the wave 3 element follow-ups. If the page registry shape changed on master, T7 registers our four pages the way `combobox` is registered there. README conflicts: keep both edits.
- No session may dispatch `release.yml`. When this PR is merged, report "ui ready for release" to the orchestrator and stop there.

## Open questions for the research phase

- Measure the four gzip sizes and the root growth after the first build (T7 sets the budgets from them). If DatePicker is over 24 KB because of overlay.js, check whether appshell-gaps' split has landed and import Popover from the new module.
- Confirm in Chromium that `scrollIntoView({ inline: 'start', block: 'nearest' })` on a slide does not scroll the page vertically when the carousel is fully in view (T6 covers it: page `scrollY` is unchanged after "Next slide").
