# Changelog

Every release of `@nish/ui`, newest first. Versions follow semver. Before 1.0, a minor
bump (0.x.0) could require apps to change code. From 1.0.0, a major means app code must change,
a minor adds, and a patch fixes.

## [3.2.0] - 2026-11-11

### Added

- `serveSpa` / `createSpaHandler` `csp` option: `'strict'` (or `{ connect, img, script, frameAncestors, reportOnly }`) sends a Content-Security-Policy on HTML answers, with a sha256 for every inline script in the built index.html, so the theme-init script is allowed without copying its hash. Off by default.
- `isDirectCall({ headers, remoteAddress, port })` in `@nish/ui/server`, the one check for a direct call to the app on this PC (loopback peer, Host 127.0.0.1:<port>, no proxy, Origin or browser fetch headers). `isInboxCall` uses it. `checkServiceRequest` takes an optional `remoteAddress` and then also requires a loopback peer; pass `remoteAddressOf(c)`. `isDirectLoopback` is deprecated.

### Fixed

- Login rate limiter: when the table is full of locked keys, the oldest locked key is evicted instead of refusing every new client, so flooding it no longer locks everyone out.
- Inbox actions: `parseInboxActionCall` refuses a dedupeKey over 200 characters or with control characters, and a refused call no longer logs its dedupeKey.
- Link buttons (React `LINK_HIT` and static `.nish-btn--link`) reach a 44px touch target, not 40px.
- The standalone static files (`theme.js`, `theme.global.js`, `format.js`, ...) no longer end in a `sourceMappingURL` comment for a map that is never shipped.
- Fold check: the `node-version` input defaults to 24; the docs template pins a release tag and Node 24; re-runs on the same base reuse cached base screenshots instead of rebuilding the base branch.
- `IconButton`: `active={false}` now sets `aria-pressed="false"`, so an off toggle is announced as a toggle.
- `Button` (xs, sm, md), `Chip` and `Breadcrumbs` links reach 44px wide on touch screens, not just 44px tall.
- Static `.nish-btn--link` gets a 44px touch hit area, matching the React link `Button`.
- `WorkflowBoard` / `AgentNode`: queued cards and waiting phases no longer dim text with opacity, so it keeps 4.5:1 contrast.
- `seriesColor()` returns chart-1 for `NaN` / `Infinity` instead of `var(--nish-chart-NaN)`.
- `Field` / `FieldGroup`: `hint=''` or `hint={false}` no longer renders an empty hint or points `aria-describedby` at it.
- `MenuItem`: a disabled item no longer runs its `onClick`.
- `Meter`: a vertical meter with `showValue` keeps its `className`.
- `NumberField`: refuses `Infinity`, exponent and hex input.
- `Radio`: keeps a caller's `aria-describedby` when it has a description.
- `FileDropzone`: accepts files with an empty MIME type by their extension.
- `SkeletonRows`: height detection fixed.
- Toasts: a duration over 2^31-1 ms stays sticky instead of firing at once, and `toast.promise` always resolves its loading toast.
- `Calendar`: with an invalid controlled month, the arrows can still navigate.
- `WorkflowBoard`: duplicate phase ids no longer break the board.
- `ChartLegend`: duplicate labels no longer collide.
- The hub pill's arrow is hidden from screen readers.
- `Accordion` and `Tabs`: ids work for values that contain spaces.
- `Inbox`: labels with `undefined` overrides keep their defaults.
- `useUrlState`: works with class-based adapters.
- `useResource`: `reload()` respects `enabled`.
- `apiFetch`: sends a `ReadableStream` body as is.
- `format` time and date helpers: an invalid `timeZone` shows an en dash instead of throwing; `ago()` moves to the next unit at 60 minutes, 24 hours and 12 months.
- `chartNumber`: groups values that round to 1000 (`1000`, not `1000.0`).
- `mergeRefs`: clears object refs on detach.
- `narrowLayout`: a `NaN` split no longer breaks the layout.
- `<nish-sparkline>`: `values=null` no longer throws.
- The mixed-version warning is silent in production builds.
- Static `.nish-stats--4` switches to four columns at 768px, matching React `StatGrid`.
- The release job installs with `--ignore-scripts`, keeps no git credentials after checkout, runs checks and builds without the write token, and refuses unless master's `ci.yml` run for HEAD is green.
- The Fold report comment is only reused when the github-actions bot posted it.

### Docs

- The inbox-client contract says that action secrets go only in `data.actionToken` and that /ingest trusts every local caller, so action routes must verify the token.
- Docs site: scrollable tables, device frames and demo rows are keyboard-focusable regions; wrong or stale samples, guidelines and stories corrected on about 60 component pages; the Default column reads destructured defaults inside the component body; frames load lazily; `<meta charset>` stays in the first 1024 bytes.
- Tests and tooling: new unit tests for the combobox and command filters, `useHeightVar` and overlay placement; many weak browser, SSR and consumer assertions tightened; a missing `dist/` fails in CI instead of skipping; the canvas routing time gate retries once before failing.
- Docs site: the web app manifest is `manifest.json`, so any static host serves it as JSON (it had no content type). `useScrollEdges` has unit tests for LTR, RTL, no overflow and unmount.
- Combobox, MultiSelect and the docs site share one substring-match helper and one command-palette result cap; `NavRail` item classes come from one function used by the parity harness.
- Docs site: the bottom nav, More sheet and callout moved into smaller device and callout modules; Playwright starts its own harness servers (no reuse), and the visual-check, canvas-layout, contrast and inbox-client tools report problems through one shared helper.
- `FilterBar` in a server-rendered app shows the inline row until hydration; render it client-only.

## [3.1.0] - 2026-11-09

Fixes from the 2026-11-08 audit.

### Fixed

- `<nish-bottom-nav>` and `<nish-nav-rail>`: `href="#"` and query-only links no longer take the current-page mark from the real current link.
- `<nish-chip-group>`: removing a chip with the keyboard now moves focus to the next chip instead of dropping it to the page.
- `useScrollEdges`: in a right-to-left scroller `data-at-start` / `data-at-end` now mean the physical left / right edge (as the fade masks read them); the pinned-column shadow on tables follows the logical start edge in both directions.
- `<nish-copy-button>`: when the clipboard is blocked, the text now stays selected until it is copied or focus leaves (up to 15 s, was 1.5 s), and the prompt says Cmd+C on Mac.
- `TagInput`: at `maxTags` a typed or pasted tag now stays in the box with a "You can add up to N" message instead of vanishing; pressing Enter after the suggestions list shrank no longer throws; pasted tags that fail `validate` stay in the text box so they can be fixed.
- `FileDropzone`: clears its file list (and calls `onFilesChange([], [])`) when its form is reset, including React 19's reset after a form action.
- `FilterBar`: the filter sheet no longer reopens by itself after the screen is unfolded and folded again.
- `ActivityFeed`: times follow the `NishProvider` locale.
- `Textarea` with `autoGrow`: re-measures when its width changes (fold, rotate, sidebar) and after a form reset, so wrapped text is no longer cut off.
- `Switch`: inside a `Field` it keeps the field's error/hint in `aria-describedby` alongside its own description, and keeps a caller's `aria-labelledby`.
- `BarChart`: no longer crashes when its data shrinks while a bar is selected.
- `LineChart`: y-axis labels are no longer clipped in right-to-left layouts, and the tooltip stays inside the chart, so it no longer causes horizontal page scroll on narrow screens.
- `Combobox`: ignores the Enter that confirms an IME composition (CJK input).
- `ResponsiveTable`: announces sorts through the provider's `sortAnnounce` string, so translated apps no longer hear English.
- `apiFetch`: no longer sends your `configureApi` auth headers to another site when a path starts with a backslash, a tab or a space (for example `'/\\host'`).
- `useResource`: no longer reports loading forever when the server answers 204 or an empty body.
- `NumberField`: no longer resets to an old value or loses its pending state when an earlier save fails after a newer one was started.
- `Slider`: clicking the track with a mouse keeps focus on the thumb, so arrow keys work straight away.
- `<nish-table-sort>`: sorts numbers written by `nish-ui/format` correctly (negative signs, the en-dash placeholder, and units like "12 GB").
- `<nish-sheet>`: reopening during its close animation now reopens it instead of being dropped.
- `<nish-switch>`: takes its accessible name from `aria-label` when it has no label, and shows `description` without a label.
- `<nish-tabs>` and `<nish-segmented>`: scroll-edge fades are correct on right-to-left pages; `<nish-tabs>` gives every tab and panel a unique id, including tabs labelled in non-ASCII scripts.
- `<nish-theme-toggle>`: the label sentence can now be translated with `configureStrings`.
- `<nish-section-nav>`: the default landmark label is "On this page" (new `onThisPage` string), and a clicked link stays current until the user scrolls, like React `SectionNav`.
- `<nish-chip-group scroll>`: chips scroll sideways on a phone instead of wrapping.
- `<nish-search>`: the browser's own clear button no longer shows next to the component's.
- `MoreSheet`: the bottom bar stays tappable while the sheet is open, so More closes it and the other tabs work.
- `MultiSelect`: leaving the field clears the search and tells `onQueryChange('')`, so async options are no longer stuck on the old results.
- Dialogs: Tab no longer escapes the dialog when the last control is `tabindex=-1`, inert (a closed Accordion) or an unchecked radio.
- `ConfirmDialog`: swiping down while its action is pending springs back instead of leaving an invisible modal; a sheet the parent keeps open after a swipe reappears.
- `TimeField`: `min`/`max` may wrap past midnight (min 22:00, max 06:00), Ctrl/Cmd+A and Ctrl+P are no longer taken over on a 12-hour clock, and a two-digit hour can be typed when the parent updates the value a tick later.
- `Tooltip`: `aria-describedby` goes on the focusable wrapper unless the focusable control is the tooltip's direct child.
- `useUrlState`: `patch({ key: undefined })` clears the key instead of writing "undefined" into the URL.
- `Avatar`: the status dot is hidden from screen readers unless you pass the new `statusLabel` (it used to announce the raw 'ok' or 'loss'), and always when `alt=""`.
- `AppShell`: documented that sidebar `tools` and brand-mode `actions` are mounted twice.
- `money()`: uses each currency's own decimals (JPY shows no cents) and puts a space between a letter symbol and the number (CHF 5.00).
- `nish-th-check`: runs when started through the npm bin symlink on Linux and macOS (it used to print nothing and pass).
- Login rate limiter: treats every address in an IPv6 /64 (and `::ffff:a.b.c.d`) as one client, so rotating addresses no longer dodges the limit.
- Inbox client: no longer retries the queue on every new send during an outage; it waits for its backoff and Retry-After.
- Service tokens: an unreadable revocation file no longer brings revoked tokens back; hashes still readable stay revoked and a corrupt (unparseable) file with none stops startup, while valid JSON without hashes (`[]`, `{}`) is set aside with a warning.
- `Carousel`: scrolls only its own track (rotation, controlled index and `defaultIndex` no longer pull the page back to it) and pauses `autoPlay` while off-screen.
- `SystemCanvas`: the Lines legend is a plain disclosure of switches instead of an incomplete ARIA menu, and Ctrl+= / Ctrl+- / Ctrl+0 browser zoom keys are no longer swallowed.
- Sticky tables: a pinned first column no longer paints the first body cells over the pinned corner header.
- Forced colors (Windows High Contrast): keyboard focus shows on chart svgs, split dividers, the selected tab, `SystemCanvas` legend controls and `Callout` links and buttons.
- `Progress`: no longer crashes when rendered from a server component (it now has `'use client'`).
- `ServiceTokensSection`: its hook module now has `'use client'` too.
- `Pagination`: router links no longer change the page or call `onPageChange` on Ctrl/Cmd/Shift/middle-click that opens a new tab.
- `Popover`: open on mount inside a dialog, it goes straight into the dialog's layer and keeps repositioning when its content grows.
- `Input` with a trailing slot: keeps more end padding on touch screens so text no longer runs under a touch-sized `IconButton`.
- `DatePicker` and `DateRangePicker`: with the `form` prop they take part in that form's validation and reset, not only its submitted value.
- `AppHeader`: inline overflow actions no longer steal keyboard focus when the mouse moves over them; `MenuItem` outside a menu is a plain tabbable button.
- `VirtualTable`: row click ignores clicks on labels, summaries and `role=link` elements inside a cell, like `ResponsiveTable`; tabbing into a scrolled table lands on the first row in view, and focus scrolling clears the sticky header.
- `VirtualList`: page-scrolling `scrollToIndex` accounts for the sticky app header and the bottom nav; switching windows or tabs no longer drops keyboard focus from a virtualized row that was scrolled out of view.
- `Tabs`, `SubNav`, `Segmented`, `Table` and `ScrollRow`: scroll fades show the right start and end edges in right-to-left layouts.
- Section nav (`mountScrollspy`): scrolls the current section's chip fully into view even when the nav is not at the left edge of its column, and returns a `lock(id)` function that holds a clicked link current.
- `AgentNode`, `FlowSteps`, `ResponsiveTable`: their spoken words and sort-direction label come from `NishProvider` strings instead of fixed English.
- `Inbox`: times follow the `NishProvider` locale and "today" is judged against a clock shared by server and client, so renders no longer differ around midnight.
- Two copies of the package on one page now share the `configureApi` config, favicon resolver, `useLocalStorage` subscribers and sticky height variables.
- `nish-ui/chart`: `dist/chart.js` is built from the pure values only, so a static page that vendors it no longer hits a bare `react` import.
- Docs: the README CDN snippet points at nish-ui@3, the `ChartLegend` sample no longer imports a name the root entry does not export, the hooks page says when the real value is returned (first render in a client-rendered app, server value only while hydrating), and the CSP nonce sample uses a per-response placeholder instead of a function.

### Added

- `NishStrings.maxTags: (max: number) => string` (new `FIELD_STRINGS` key, default "You can add up to {max}"); `TagInput` uses it.
- `NishStrings.agentQueued`, `agentRunning`, `agentDone`, `agentFailed`, `stepDone`, `stepFailed` and `sortToggle` (defaults are the English words they replace).
- `NishElementStrings.themeToggleLabel?: (current: string, next: string) => string` and `themeElsewhere?: string` (optional keys, defaults are the English sentence and "set on another site"), and `onThisPage: string` ("On this page").
- `<nish-switch aria-label>` attribute (property `ariaName`) names the inner button when there is no label.
- `Avatar` prop `statusLabel?: string`: the accessible name of the status dot. Behavior change: the dot is no longer labeled with the tone key.
- `TimeField`: `min` after `max` now means a range that wraps past midnight (an input that used to reject every time).
- `SystemCanvas` lists its connections as visually hidden text so screen readers can learn what links to what.
- `shared('api')` runtime slot holding the `configureApi` config (internal, no export change).
- Tailwind class `pointer-coarse:pe-12` on `Input` with `trailing` (no new exports, props or CSS variables).
- New test file `src/components/use-client.test.ts` fails when a hook-calling module lacks `'use client'`.

## [3.0.0] - 2026-11-07

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
- `AppShell` is 33.6 KB gzip instead of 35.2; `Toaster` 11.7 instead of 13.5; everything from `nish-ui`
  122.1 instead of 140.9.

## [2.2.0] - 2026-11-07

### Added

- `RangeCalendar`: a month grid that picks a range of days as `{ from, to }` (YYYY-MM-DD). The first press sets the start, the second the end (an earlier second day swaps them, the same day twice is a one-day range), the days between light up as the pointer or focus moves, and Escape drops a start with no end. A range cannot cover an `isDateDisabled` day unless `allowDisabledInRange` is set. Same keys, captions and 44px touch days as `Calendar`.
- `DateRangePicker`: one text field for both dates ("11/05/2026 – 11/09/2026" in the reader's numeric order, any separator, or ISO) with a `RangeCalendar` in a Popover. With `name`, a hidden input posts `from/to` (an ISO 8601 interval such as `2026-11-05/2026-11-09`).
- `TimeField`: an hour box and a minute box (plus AM/PM where the locale uses a 12-hour clock, or `hourCycle`), value `HH:mm` in 24-hour time like `<input type="time">`. Arrow keys step each box (`step` for minutes), typing moves on to the minutes, `min`/`max` mark the field invalid, 44px boxes on touch. Inside a `Field` the label names both boxes.
- The `DateRange` and `HourCycle` types, and the strings `chooseDates`, `changeDates`, `dateRange`, `rangeStarted`, `invalidDateRange`, `hour`, `minute`, `dayPeriod` and `invalidTime`.

### Changed

- `TreeView` renders its visible rows as one flat list of treeitems (aria-level, aria-setsize and aria-posinset unchanged; the nested `role="group"` lists are gone), and a focus move re-renders only the two rows that change.
- `Field`'s label has `id="<control id>-label"`.
- `Calendar` and `DatePicker` are 0.5 KB gzip larger (a shared calendar core and the new strings); their props, markup and behavior are unchanged.

## [2.1.3] - 2026-11-07

### Fixed

- `PageContainer` `padBottom` (on by default, and in every `AppShell` page) works again: the bottom padding is now a utility that adds `--nish-bottom-inset`, so the last row of a page clears the phone BottomNav and an open StickyActionBar. Before, the container's `py-6` beat `.nish-pad-bottom-inset`, which is in the base layer, and the page ended under the nav. The bottom padding is 1rem plus the bars' height (1rem on desktop, was 1.5rem); `padBottom={false}` keeps `py-6`. Apps can drop their own `pb-[max(calc(var(--nish-bottom-inset)+1rem),…)]` workaround in `containerClassName`.

## [2.1.2] - 2026-11-07

### Changed

- The docs site header (design.nish.software) shows the art-palette mark from the new app icon instead of the old "N". No package changes.

## [2.1.1] - 2026-11-07

### Changed

- The docs site (design.nish.software) has the new Midnight Line app icon: favicon, apple-touch icon and the phone app icons, with a separate maskable icon. No package changes.

## [2.1.0] - 2026-11-05

### Added

- `AppShell` `navMode="header"`: the nav stays as header tabs at every width, with no bottom bar, rail or sidebar, for apps with two or three pages.
- `AppShell` `tabs="pill"`: from 1024px the nav is pills in the header row. Header tabs and pills show each item's `badge`.
- `AppShell` `bottomNav`: the keys of the bottom bar items, instead of the first `primary`.
- `AppShell` `moreMenu={false}`: `moreItems` stay in the phone More sheet only, for apps that put those actions in the header themselves.
- `AppShell` `headerInnerClassName`, `containerClassName`, `footer`, `fullHeight` and `navPending` (placeholder tabs while sign-in is checked).
- `AppShell` `sidebar.brand`: from 1024px the brand, the hub pill, the actions and the theme toggle move into the sidebar and the header goes away.
- `NavItem` `shortLabel`: a shorter label for the NavRail and the BottomNav.
- `nish-ui/inbox` and `nish-ui/service-tokens` entry points with the same values as the root exports (`Inbox`, `ServiceTokensSection`, `useServiceTokens` and their types).
- The rest of the package's inlined icons are exported from the root: `XIcon`, `CheckCircleIcon`, `AlertTriangleIcon`, `InfoIcon`, `RotateIcon`, `LoaderIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon`, `ChevronDownIcon`, `PanelLeftCloseIcon` and `PanelLeftOpenIcon`. lucide-react is the official icon set for apps; the Icons page on design.nish.software has the sizes, the standard icon for each common action and the rule for a new glyph.
- `Calendar`: a month grid that picks one day (YYYY-MM-DD), with the WAI-ARIA date-grid keys (arrows, Home and End, Page Up and Page Down, Shift for years), min and max, disabled days, locale names and first weekday, and optional month and year selects.
- `DatePicker`: a date field that takes the reader's numeric format or ISO, with a calendar in a Popover; posts YYYY-MM-DD like a native date input.
- `MultiSelect`: a filterable multi-select combobox with removable tags, a list that stays open while picking, `maxSelected`, async search and one form value per pick.
- `ChevronLeftIcon`, `ChevronRightIcon`, `CalendarIcon`, `PauseIcon` and `PlayIcon`: the inlined icons the new components draw, exported like the rest.
- `Carousel`: a scroll-snap carousel (WAI-ARIA carousel pattern) with previous and next buttons, slide dots, arrow keys, `loop`, and optional auto-rotation that pauses on hover and focus and respects reduced motion.

### Changed

- `AppShell` loads its More sheet on demand, and `DropdownMenu` its phone sheet, so `AppShell` is 34.8 KB gzip instead of 37.2 KB and `SystemCanvas` 26.5 KB instead of 27.1 KB. Import paths are unchanged.
- The overlay components are separate modules inside the package (`modal`, `drawer`, `tooltip`, `popover`, `menu`).
- `routeEdges` (and SystemCanvas) route large maps much faster: 500 nodes about 20x faster (about 5-15 ms instead of 100+ ms), with the same lines.
- Inbox, ServiceTokensSection and SystemCanvas are marked fleet-only in the docs; their root exports stay through 2.x.

### Fixed

- `openSheet` on a dialog that is already open returns a closer that closes it. Before, calling that closer threw a ReferenceError.

## [2.0.2] - 2026-11-03

### Fixed

- `useMediaQuery`, `usePhone`, `useNarrow` and `useBreakpoint` return the real value in the first render of a client-rendered app. In 2.0.0 and 2.0.1 they returned `false` (or `base`) until after the first commit, so a value read once, such as `<Disclosure defaultOpen={!isPhone}>`, came out wrong on phones. Server rendering and hydration still start from `false`.

## [2.0.1] - 2026-11-03

### Fixed

- `Tooltip`: at most one tip is open on a page. Since 2.0 a tip stays open for a moment after the pointer leaves (so the pointer can reach it); moving straight onto another trigger showed two tips until that moment passed. Opening a tip now closes the open one at once.

## [2.0.0] - 2026-11-03

The production-hardening release: server components, SSR, tree-shaking, one shared runtime, strings, locale and direction, forms that post, accessibility and safer defaults. Moving from 1.x: [docs/MIGRATING-2.0.md](docs/MIGRATING-2.0.md).

### Breaking

- `AppHeader` and `AppShell` `hubHref` is replaced by `hub`: `{ href, label, title? }`, or `false`. The "← nish.software" pill is off by default; pass `hub` to show it.
- Server kit defaults (`nish-ui/server`, `nish-ui/server/hono`): `passwordMatches` and `loginHandler` compare exactly (no case folding, no trimming) unless `caseInsensitive: true`; `clientIp` and every helper that calls it trust no proxy header unless `trustProxy: 'proxy' | 'cloudflare'` is given; a session secret shorter than 32 bytes throws at setup.
- `Favicon` and `LinkCard` make no third-party request by default (a letter avatar shows). Call `configureFavicons({ resolve: googleFavicon })` for the old behavior.
- Components take `ref` as a prop instead of using `forwardRef`. Code that types a ref to a package component through `ForwardRefExoticComponent` or `ComponentRef<typeof X>` needs a change.
- Form-control borders use the new `line-control` role and placeholders use `hi3` (raised to 4.5:1), so inputs, selects, textareas, checkboxes and comboboxes look different in every theme.
- The plain-CSS files are in cascade layers (`nish.base`, `nish.components`). Unlayered rules in your own CSS now beat the package's; rules in an earlier layer than yours no longer do.
- `engines.node` is `>=20.19`. The package stays ESM-only; `require()` works through Node's `require(esm)`.
- `dist/tailwind.css` scans `dist/esm/components` only (not all of `dist`).

### Behavior changes

- Formatters keep `en-US` output but take `locale` (and `timeZone` for dates); `setDefaultLocale()` changes the default.
- `Tooltip` around a single focusable child adds `aria-describedby` to that child and no longer adds a Tab stop (`focusable` defaults to false then); it closes on Escape and stays open while the pointer is on it.
- `ConfirmDialog` is `role="alertdialog"` and its message is the description.
- The default `AppErrorBoundary` fallback shows the message and stack only outside production or with `showDetails`.
- `apiFetch` sends `configureApi` headers only to same-origin URLs unless `configureApi({ headersFor })` allows the URL; a response that is not JSON becomes an `ApiError`.
- `toast()` returns the toast id. Sticky and error toasts are not evicted by newer ones.
- `Switch` posts in forms (`name`, `value`, `defaultChecked`, `required`, `form`) and has `onCheckedChange(checked)`; `onChange(checked, event)` still works. `Combobox` and `Segmented` post through hidden inputs.
- `closeOnBack` stays `true` for overlays.
- Landmark labels are unique (`BottomNav`, `NavRail`, the sidebar, `SectionNav` and the `AppHeader` tabs each have their own).
- `rowHref`, `CommandPalette` hrefs, `MoreSheet` items, `showToast` actions and element hrefs go through `safeUrl`: a `javascript:` or `data:` URL never navigates.

### Added

- `NishProvider`, `useNishConfig`, `useNishStrings`, `DEFAULT_STRINGS` and the `NishStrings` type: translate every string, set locale and direction, and choose the portal container once. `configureStrings()` does the same for custom elements.
- New components: `RadioGroup` and `Radio`, `Slider` (single and range), `TagInput`, `FileDropzone`, `Pagination`, `Breadcrumbs`, `Accordion` and `AccordionItem`, `Separator`, `Avatar` and `AvatarGroup`, `Progress`, `VisuallyHidden` and `Portal`.
- `Modal`, `Drawer` and `ConfirmDialog` take `open` and `onOpenChange`; `toast.promise(promise, { loading, success, error })`.
- `safeUrl`, `useIsClient`, `useIsoLayoutEffect`, `isRtl`, `setDefaultLocale`, `getDefaultLocale`, `configureFavicons`, `googleFavicon`, `VERSION`, `paginationRange`, `avatarInitials` and `avatarHueIndex`.
- `"use client"` on exactly the modules that need it; pure helpers (`buttonClass`, `cardClass`, `tabClass`, `chipClass`, `tableClass`, `apiFetch`, `BREAKPOINTS` and the rest) come from `-classes` modules a server component can call.
- Preserved-modules build in `dist/esm/` with `/* @__PURE__ */` annotations, a `sideEffects` list and `default` conditions on every export. New files: `elements/all`, `tailwind-core.css`, `nish.min.css`, `nish-components.min.css`, `tokens.json`, `tokens.dtcg.json`, `theme-init.sha256`.
- `nishThemeInit({ nonce })` for a Content Security Policy nonce.
- `Switch`, `Checkbox`, `Field`, `Combobox`, `Segmented` and `SearchInput` work in native forms and with react-hook-form (`register` or `Controller`); `Field` wires `id`, `aria-describedby`, `aria-invalid` and `required` into every control.
- Forced-colors (Windows High Contrast) rules for state shown by color, a print stylesheet, and `data-state` and `data-disabled` on stateful roots.
- `LoadingBar` `announce`; `Tabs` `defaultValue` and `onValueChange`; `Favicon` `src` and `resolve`; `limiter.hit()`; `trustProxy` and `frameOptions` on the server kit; `<html data-nish-storage-key>` for the theme key.
- A shared runtime on `globalThis[Symbol.for('nish-ui.runtime.v1')]`: one theme state, overlay stack and toast store per page, shared by every entry and every copy. A development warning names two versions on one page.
- Docs: README rewritten for npm users, Getting started with Frameworks, i18n and RTL, CSP and Testing sections, a Theming API page, the 2.0 migration guide, CONTRIBUTING, SECURITY and CODE_OF_CONDUCT, a browser support statement, and a docs page for every new or changed API.
- Tests and gates: one unit-test file per component module, server rendering of every export, hydration, two-copy, `require()`, Next.js, Vite and TypeScript consumer builds, axe, forced-colors and CSP specs, size budgets (`npm run size`) and an exports snapshot (`tools/api-surface.test.mjs`).

### Fixed

- `Toaster`, `ThemeToggle`, `useTheme`, `useLocalStorage` and the overlays no longer cause hydration mismatches or throw during server rendering; `<html data-theme>` survives hydration.
- Theme functions no longer throw when storage or cookies throw (sandboxed iframes) and ignore unknown theme names; `theme-init.js` ignores prototype keys and keeps host `theme-color` metas that have `media` or `data-nish-keep`.
- The login limiter could be raced by parallel requests; `hit()` counts the attempt before any `await`.
- `javascript:` URLs reached links in table rows, the command palette, toast actions, more-sheet items, media thumbnails and custom elements.
- Arrow keys in `Tabs`, `Segmented`, `ChipGroup`, split dividers and charts now mirror in right-to-left layouts.
- `Checkbox` hint and trailing content no longer join its accessible name; `invalid` sets `aria-invalid`.
- `SkeletonLines` and `Spinner` announce through a `role="status"` region; the `CommandPalette` empty state is outside the listbox; scrollable table and modal bodies are keyboard-focusable.
- `SystemCanvas` node names contain their visible text; text roles that failed contrast in `WorkflowBoard`, `AgentNode` and the canvas pass.
- Docs site: the search button name, focusable code blocks, nested `<main>`, heading order, `href="#"` demo links, 360px overflow, and source links that pointed at master now point at the release tag.
- Theme switching no longer fades half the page: transitions are off for one frame (`data-nish-theme-switching`).

### Performance

- Intl formatters are cached by locale and options; `currencySymbol` is cached per currency.
- `Table` sorts with a shared `Intl.Collator`, ignores `columns` identity, and memoizes rows; sort keys are computed once per sort.
- `LineChart` and `Sparkline` decimate to two points per pixel column and memoize paths; hovering no longer rebuilds them.
- `AnimatedList` reads layout once per update and animates only visible items (at most 50).
- `useMediaQuery` shares one listener per query; `useLocalStorage` and `useMediaQuery` use `useSyncExternalStore`.
- `cn` and `Button` cost under 10 and 11 KB gzip (down from 17.4 KB for any import); `npm run size` enforces the budgets.

## [1.9.0] - 2026-11-02

### Added

- `nish-ui/elements/data`: `<nish-table-sort>`, `<nish-filter-bar>`, `<nish-split>`, `<nish-nav-rail>`, `<nish-scroll-row>`, `<nish-section-nav>` and `<nish-command-palette>`; `nish-ui/elements/charts`: `<nish-line-chart>` and `<nish-bar-chart>`; classes for tables, filter bars, media rows, settings, split panes, the nav rail and the range bar.

## [1.8.0] - 2026-11-02

### Added

- `nish-ui/elements/forms`: `<nish-field>`, `<nish-search>`, `<nish-switch>`, `<nish-chip-group>`, `<nish-combobox>`, `<nish-tabs>`, `<nish-segmented>`, `<nish-copy-button>` and `<nish-sparkline>`; new classes for tabs, list rows, headers, key-value lists and legends; the toast, sheet, dialog and bottom nav classes now match React.
- `.nish-callout--text` (running text in one block), `.nish-stats--4` (two, then four columns from 640px), and `.nish-pill-link` in nish-components.css, so pages without nish.css get it.

## [1.7.0] - 2026-11-02

### Added

- `AppShell` `sidebar`: from 1024px the nav is a left sidebar of icon and label rows instead of header tabs. It collapses to icons (the label becomes the tooltip) from a button at its foot, remembers the choice in localStorage (`storageKey`), can be controlled (`collapsed`, `onCollapsedChange`) and takes `tools` above the nav (shown in the header below 1024px) and a `footer`.
- `AppShell` `banner`: app banners in one sticky stack under the header, below the ConnectionBanner, so the two never overlap. The stack publishes its height as `--nish-banners-h`, and the rail and sidebar stick below it.
- `AppShell` without `nav` (now optional) is the signed-out frame: no tabs, rail, sidebar, bottom bar or More sheet. Its `moreItems` stay in the header menu at every width.
- `AppShell` and `AppHeader` `brand`: your own node in place of the icon, the name and their home link (a profile switcher, a wordmark with a subtitle). The name stays for screen readers.
- `NumberField` is a spinbutton (`role="spinbutton"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` with a text `suffix`, "10 min"). When `min` is below zero it asks phones for the full keyboard, since the iOS decimal keypad has no minus key, and it reads a typographic minus (−).
- `SettingsSection` and `SettingRow` `compact`: no Card, a small heading and 44px rows with the label beside the control at every width, for modals, sheets and side panels. Rows in a compact section are compact by default.
- `useUrlState` `comma`: `true` or a list of keys also reads a single `?tags=a,b` as two values, for links written in the older comma form.

### Changed

- `useUrlState` keeps a single list value whole, so `?loc=Austin%2C+TX` reads as `['Austin, TX']`. A single comma value used to be split; pass `comma` for the keys whose old links need that.
- `apiFetch` errors use the wording the apps share: "Could not reach the server.", "The server took too long to answer.", "Log in to continue." (401), "That was not found." (a 404 code), "The server had a problem. Try again." (any other bare code such as `server_error`) and "The server answered 503." when the response has no message. A sentence from the server in `error` or `message` is still shown as it is.
- ui lints with `react-hooks/refs` as an error: latest-value refs are written in a layout effect instead of during render (overlays, menus, useResource, useLocalStorage, useCommandHotkey, the command palette and the flow components). Behavior is unchanged, except that a `DropdownMenu` open on mount now renders straight into its trigger's layer.

## [1.6.0] - 2026-11-02

### Added

- `nish-ui/elements`: `<nish-theme-toggle>`, `<nish-sheet>`, `<nish-dialog>`, `<nish-bottom-nav>` and `toast()` for pages without React.

## [1.5.0] - 2026-11-02

### Added

- `isCrossSiteWrite()` in `@nish/ui/server` and `crossSiteGuard()` in `@nish/ui/server/hono`: refuse a POST, PUT, PATCH or DELETE that a page on another origin sent, including another *.nish.software subdomain (SameSite=Lax cookies still ride along from those). Fetch metadata decides, with an Origin-against-Host fallback for older browsers; requests without either header (servers, the inbox and MCP callers) pass. `allowedOrigins` lets named origins through. Mount it first: `app.use('*', crossSiteGuard())`.
- `ServiceTokensSection` and `useServiceTokens`: the settings block that lists the service tokens an app accepts, with a Revoke button on each (the confirm dialog says a revoked token cannot be restored). It has loading, empty and error states, and a docs page on design.nish.software.
- `@nish/ui/server`: `loadManagedServiceTokens` and `jsonRevocationStore`. Revocations are kept by the token's sha256 in one small JSON file in the app's data dir, so they take effect at once and survive restarts and deploys; `service-tokens.json` and `SERVICE_TOKENS` stay the seed. A revoked token gets 401 from `checkServiceRequest`.
- `@nish/ui/server/hono`: `mountServiceTokenRoutes` (GET the list, POST to revoke), for the app's settings page.
- Types `ServiceTokenView` and `ServiceTokenListResponse`.

### Changed

- Fan-out pins apps to npm (`npm:nish-ui@X.Y.Z`); publish runs before the fan-out, and the fan-out waits until npm has the version. A vendored repo's `package.json` pin (hosting's, for `@nish/ui/eslint`) moves with its `ui.json`. The README, docs/RELEASING.md and the Getting started page lead with npm; the codeload tarball is the fallback without the npm registry.

## [1.4.1] - 2026-11-02

### Changed

- The README is rewritten for GitHub and npm: `npm install nish-ui` first, short React, Tailwind, plain CSS and theming examples, an entry-point overview, and links to design.nish.software for the detail. Every link is absolute, so the npm page works too. The repo layout and dev commands moved to `docs/DEVELOPING.md`.
- The docs site's Getting started page installs from npm (as `nish-ui`, or as `@nish/ui` through an npm alias) and gains Troubleshooting and Versioning sections. The Themes page covers `data-nish-domain`, the Inbox page the item action rules, and the AppShell page the viewport and theme-color meta.
- npm publishing uses trusted publishing only: `publish.yml` no longer reads an `NPM_TOKEN`, and `tools/npm-publish.mjs` fails (instead of skipping) when the package is not on npm. The package description and keywords are written for npm search.

## [1.4.0] - 2026-11-02

### Added

- `MediaRow` and `ListRow` `compact`: a dense row with an 11px title and 10px subtitle, meta and detail, for widget tiles that use small type (Nishboard). It keeps the small thumbnail, the xs badges and the 44px row. The MediaRow docs page has a Compact story and control.

## [1.3.0] - 2026-11-02

### Added

- `SplitStage`, `SplitDividers`, `LayoutPresetPicker`, `LayoutPresetIcon` and `presetOptions()`: up to four panes in a split layout. The stage renders panes in the order you give, positions each one from its slot's rectangle, and never wraps them, so reordering slots never moves a DOM node or reloads an iframe. Dividers resize by pointer or arrow keys, and Enter or a double click equalizes that split.
- `@nish/ui/split-layout` (also re-exported from the root): the React-free split-tree math (presets, rectangles, dividers, resize, add and remove, narrow layouts, validation), safe to import from Node.
- `MediaRow`, `MediaChip` and `MediaThumb`: a row with a thumbnail, a two-line title, meta and detail lines and Live/Offline badges; a pill chip; and the thumbnail alone. Thumbnails load only from https or relative URLs.
- `ListRow` `titleLines={2}` lets the title wrap to two lines. The default stays one line.
- `[data-dragging] iframe` turns off pointer events on frames while a split drag is active.

### Fixed

- `ListRow`: an active row's subtitle and meta use `text-th-hi2`, so they keep 4.5:1 contrast on the accent tint in light themes.

## [1.2.2] - 2026-11-02

### Changed

- The npm name is now **`nish-ui`** (`npm install nish-ui`) instead of `@nish-software/ui`, which was never published. `npm install @nish/ui@npm:nish-ui` still installs it under the name the docs use. Nothing changes for the apps: the repo, the tags and the codeload pins keep `@nish/ui`.

## [1.2.1] - 2026-11-02

### Fixed

- `SystemCanvas`: a recently worked-on node's afterglow is drawn by the rounded card. Before, it was a square-cornered shadow on the card's wrapper, and its border tint never showed.

## [1.2.0] - 2026-11-02

### Added

- Published to npm as **`@nish-software/ui`** (the `@nish` scope on npm belongs to someone else). `npm install @nish/ui@npm:@nish-software/ui` installs it under the usual name, so every import in the docs works as written. The repo, the tags and the codeload pins keep the name `@nish/ui`, so nothing changes for the apps. Every release publishes through `.github/workflows/publish.yml` (npm trusted publishing, with provenance), dispatched by the release job; see `docs/RELEASING.md`.
- `<html data-nish-domain="example.com">`: shares the theme choice in a `nish-theme` cookie across another site's subdomains, the way nish.software does. It counts only on that domain and its subdomains. Without it nothing changes: nish.software hosts share on `.nish.software`, other hosts use `localStorage`.
- `LICENSE` (MIT, as `package.json` already said), plus `author`, `homepage`, `repository`, `bugs` and `keywords` in `package.json`.

### Changed

- The README is for people using the package: it starts with install (npm, codeload, git). The list of apps, the release flow, the fan-out and its merge policy moved to `docs/RELEASING.md`.
## [1.1.0] - 2026-11-01

### Added

- `SystemCanvas` bands layout: bands stacked top to bottom, each wrapping its groups into rows, with lines leaving a card's bottom border and entering the next card's top border. `layout="auto"` picks whichever of bands (and how many groups per row) or columns shows the map biggest in the current viewport, and re-picks on resize with the cards sliding to their places. `pickLayout()` is exported.
- Edge kinds (`edgeKinds`, `CanvasEdge.kind`) with a line legend: solid, dashed or dotted lines that can be shown or hidden. Hidden kinds are left out of layout and routing. Every edge ends in an arrowhead.
- Focus highlight: hovering or selecting a node or group highlights its lines and the cards at their other ends and dims the rest.
- Level of detail: below 60% zoom, card details hide and titles and labels grow.
- Follow mode (`follow`, `onFollowChange`, `CanvasNode.activeAt`): flies the camera to active nodes, with a caption saying what it follows. Any manual pan or zoom turns it off.
- Minimap (`minimap`) on viewports 600 px wide or more: click or drag to move the view.
- Double-click or double-tap a group header to zoom to that group; selecting something off screen brings it into view.
- `@nish/ui/system-canvas`: the canvas, `layoutSystem`, `pickLayout`, `routeEdges` and their types as a subpath export. It builds as one self-contained module that `index.js` imports, so a bundler can tree-shake the canvas out of an app that does not render it (or load it in a lazy chunk).

### Changed

- `SystemCanvas` defaults to `layout="auto"`. Pass `layout="columns"` for the old look.
- `AppHeader`: the nav row has 24 px between links instead of 4 px.

## [1.0.2] - 2026-10-31

### Fixed

- `@nish/ui/vite`: `nishThemeInit()` now defaults to `position: 'auto'`, which puts the script right after `<meta charset>` when the page has one. Before, the default prepended about 2.6 KB to `<head>` and pushed the charset past the first 1024 bytes, where HTML requires it. `head-prepend` and `after-charset` still do what they say.
- `@nish/ui/vite`: whole-line `//` comments in theme-init.js are no longer inlined into every page's render-blocking script.
- `@nish/ui/eslint`: `nish/no-legacy-th-alias` no longer flags `th-focus`, which is the focus ring role (`--nish-focus`), not a legacy alias.

### Changed

- ESLint runs over ui itself with its own `@nish/ui/eslint` preset (`npm run lint`, part of `npm run check`).
- `BottomNav` and `MoreSheet` use the `text-2xs` and `text-3xs` scale classes instead of `text-[11px]` and `text-[10px]` (same sizes).

## [1.0.1] - 2026-10-31

### Fixed

- `dist/format.js`, `dist/chart.js` and `dist/inbox-client.js` stand alone again. In 1.0.0 they imported a shared chunk, so a static site that vendors `format.js` as one file (hosting's trips, demos and minecraft pages) got a 404. Only the React entry (`index.js`) uses code splitting now, and the build fails if a vendorable file imports a chunk.
- `@nish/ui/server`: the inbox action guard accepts `sec-fetch-mode: cors`, which Node's fetch always sends, so inbox item buttons work. It still refuses browser requests (`sec-fetch-site`, `sec-fetch-dest`, `sec-fetch-user`).

## [1.0.0] - 2026-10-31

1.0: the API is stable. From here a major release means app code must change, a minor adds, and a patch fixes. This release is a major only by that policy: nothing was removed or renamed, so no app has to change code to move to it.

### Added

- `AppShell`: the app frame from one `nav` list. AppHeader with desktop tabs and a More menu, NavRail on tablets, BottomNav with a MoreSheet on phones, PageContainer, Toaster, ConnectionBanner, LoadingBar and a skip link to `#nish-main`.
- `apiFetch`, `ApiError`, `configureApi` and `useResource`. Network failures are status 0, the message comes from the body's `error`, a 401 calls the optional global `onUnauthorized`. `useResource` pauses while the tab is hidden, refetches on reconnect and when the tab becomes visible, can poll, and aborts on unmount.
- `AppErrorBoundary`: a themed fallback with reset, and a "Reload page" action for a failed lazy chunk.
- `@nish/ui/vite`: the `nishThemeInit()` Vite plugin that puts theme-init.js into index.html (head-prepend or after `<meta charset>`, an optional prelude and a legacy storage key migration). Node only.
- `FilterBar`, `FilterSheet` and `useUrlState` (with `locationAdapter` and an adapter type for React Router). Filters collapse into a Filters button and a bottom sheet when narrow; arrays are written as repeated query keys.
- `SettingsSection`, `SettingRow`, `NumberField` (saves on blur and Enter) and `useSaveStatus`.
- `Combobox`: an ARIA 1.2 combobox with a listbox, local or async options and optional custom values.
- `BREAKPOINTS`, `PHONE_QUERY`, `NARROW_QUERY`, `usePhone()` and `useNarrow()`, so apps stop writing their own media query strings.
- `@nish/ui/eslint`: `nish.configs.react` (also `recommended`) and `nish.configs.node`, flat-config arrays to spread after `tseslint.configs.recommended`. `react` has the core rules (`no-var`, `prefer-const`, `eqeqeq` smart, `no-empty` with no empty `catch`) plus the plugin `nish` with six rules for unknown `th-*` classes, raw palette classes, `text-white` and `bg-black`, legacy aliases, hand-mixed tints and arbitrary font sizes. And the `nish-th-check` command, which fails on unknown `th-*` classes in any source file. ui's own `npm run check` runs it over `src site demo`.
- `@nish/ui/tsconfig/base.json`, `react.json` (Vite + React) and `node.json` (NodeNext): shared compiler presets, used as `"extends": "@nish/ui/tsconfig/react.json"`.
- `@nish/ui/server`: React-free server code for every app: v1 session tokens (the existing format, so logins survive), cookie helpers and `passwordMatches`, `clientIp` (cf-connecting-ip, then the rightmost non-loopback X-Forwarded-For), a size-capped limiter, `loadAppEnv` and `installProcessHandlers`, an SPA handler, the inbox action guard and action tokens, service tokens, and the inbox client and types (moved here). Node only.
- `@nish/ui/server/hono`: Hono adapters: session routes, `requireSession`, `serveSpa`, `onErrorHandler` and `mountInboxAction`. `hono` is an optional peer.
- Docs: pages for every block above, a Vite plugin and lint page, and a Foundations page (`#/icons`) that records the icon decision: apps use `lucide-react`, and ui keeps inlining the few icons it needs on lucide's grid.
- Tests: vitest with happy-dom and Testing Library (`npm run test:unit`), and Playwright specs for overlays (Escape order, focus trap and return, Android and browser Back) that run in CI.

### Changed

- Toasts are announced through two persistent live regions (polite, and assertive for errors) instead of a role on each card, so screen readers announce them reliably.
- While a Modal, Drawer or ConfirmDialog is open, everything behind it is `inert`. The Toaster stays active, and elements that were already inert are left as they were.
- `tailwind.css` scans only the shipped component JavaScript (`@source`), not source maps or declaration files, and the React entry builds with code splitting.
- Releases run from CI: `gh workflow run release.yml -R nishant/ui -f bump=<patch|minor|major>`. HEAD must equal origin/master, master is pushed before the tag, a GitHub Release is created from this file, and the fan-out is dispatched. `npm run release` follows the same order.
- The README "Used by" table matches `hosting/fleet.yaml`: workflows and inbox are listed, and start.nish.software is React and Tailwind.

### Deprecated

- `@nish/ui/inbox-client` and the inbox types exported from `@nish/ui`: import them from `@nish/ui/server`. The old paths re-export the new ones and keep working.

### Fixed

- Inbox client: sends are serial, a 429 is retried after its Retry-After, it stays off in dev checkouts started from an npm script without `INBOX_URL`, and `workflows` has a source label.
- `bg-th-hover`, which was never a defined class, in the MoreSheet rows and the BottomNav pill hover. Both now use `bg-th-elevated`.

## [0.10.0] - 2026-10-30

### Added

- Inbox item actions. `InboxEventInput.actions` takes up to 3 `{ id, label, method: 'POST', target }` buttons. The target must be `http://127.0.0.1:<port>/…`. `parseInboxEvent` validates them (new error strings for each rule) and `inbox-client` sends them. New exports: `InboxAction`, `InboxActionResult`, `InboxActionCall`, `INBOX_ACTION_HEADER`, `INBOX_ACTION_TIMEOUT_MS` and `isInboxActionTarget` (from `@nish/ui/inbox-client`).
- `InboxEvent.actions` (`InboxAction[] | null`), and the optional `InboxItem.actions` and `InboxItem.lastAction`.
- `<Inbox onAction>`: each item's actions render as buttons in the open and snoozed views. A button spins while its promise is pending, and the item's other actions are disabled meanwhile. The last result shows in a muted line under them.

### Changed

- `parseInboxEvent` now returns `actions` on every event (null when none). Services on 0.9.x ignore the field, so producers can send actions before the inbox service is updated.

## [0.9.2] - 2026-10-29

### Fixed

- Docs site (design.nish.software): a web app manifest and icons, so installing it on a phone gives a full-screen app instead of a shortcut inside the browser frame. The package itself is unchanged.

## [0.9.1] - 2026-10-29

### Fixed

- FlowSteps: a text step label that is cut to two lines shows its full text in a Tooltip (hover on desktop, tap on a phone, keyboard focus).

## [0.9.0] - 2026-10-29

### Added

- Flow components: FlowSteps, StepBar, AgentNode, WorkflowBoard, ActivityFeed, TickerText, AnimatedList and usePrefersReducedMotion, for live views of multi-step work (workflows.nish.software). Motion is CSS-only and plays only when the viewer has not asked for reduced motion.
- SystemCanvas: a pannable, zoomable graph-paper canvas of grouped nodes and edges that light up where work is happening.

## [0.8.0] - 2026-10-28

### Added

- Inbox component, five icons (`CheckIcon`, `ClockIcon`, `MoreIcon`, `BellIcon`, `SettingsIcon`),
  and `@nish/ui/inbox-client` with the shared event types: apps send events to the local inbox
  service instead of their own webhooks. Apps that import the client on the server list
  `@nish/ui` under `dependencies`.

## [0.7.1] - 2026-10-28

Docs site only; no change to the package.

### Fixed

- Docs site header: a gap between the package name and its version.

### Changed

- Docs site and examples: the Minecraft site is minecraft.nish.software (was mc.nish.software).

## [0.7.0] - 2026-10-28

Mobile chrome, a layout contract and the components every app kept hand-rolling. Reviewed on the Galaxy Z Fold 7 (360px, ~840px, desktop). Several defaults change; see "Behavior changes".

### Behavior changes

- AppHeader, PageHeader and Callout `variant="bar"` are opaque by default (`bg-th-bg`, `bg-th-<tone>-soft-solid`). The old translucent blur is opt-in with `AppHeader glass`.
- Modal, Drawer and ConfirmDialog `closeOnBack` defaults to true: each pushes a history entry so Android back closes the top sheet. Pass `closeOnBack={false}` to opt out.
- Toaster: the default bottom offset follows `--nish-bottom-inset`, so toasts sit above a BottomNav or StickyActionBar with no `offset`. While a Modal, Drawer or ConfirmDialog is open under 640px, the stack moves to the top of the screen.
- Segmented `overflow` defaults to `'scroll'`: a long row scrolls with edge fades instead of wrapping. Pass `overflow="wrap"` for the old behavior. Tabs strips also scroll with fades.
- Modal and Drawer now exit with an animation: `onClose` is called about 200ms after the close request (immediately under reduced motion). The drag handle is a focusable `role="button"` and is no longer drawn at sm and up.
- `theme-init.js` removes a static `<meta name="theme-color">` an app ships and manages its own. Do not ship one.
- Modal `max-h` uses `dvh`; `.nish-dialog` max-height is `85dvh` at every width.
- Menu items and MenuSubHeader get `pointer-coarse:text-sm pointer-coarse:gap-3`.
- Table: `TableWrap` is `relative`; `numeric` cells are `whitespace-nowrap tabular-nums text-right`; `Th` is `align-middle`.

### Added

- Layout contract: CSS variables on `<html>` (`--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-bottom-inset`, `--nish-sticky-extra`, `--nish-page-gutter`) written by the bars and read by Toaster, sticky elements and page padding. `html[data-nish-layer-open]` is set while a Modal, Drawer or ConfirmDialog is open.
- `useHeightVar(ref, name, enabled?)`, `useStuck(ref)` and `useScrollEdges(ref)` hooks.
- base.css: `.nish-scroll-target`, `.nish-scroll-fade`, `.nish-no-scrollbar`, `.nish-pad-bottom-inset`, `-webkit-tap-highlight-color: transparent`, `scrollbar-gutter: stable` on fine pointers, and the keyframes `nish-sheet-out`, `nish-fade-out`, `nish-toast-in-top`, `nish-bar-in`, `nish-loading-bar`, `nish-pulse`.
- Tokens: `--nish-<role>-soft-solid` and Tailwind `th-<role>-soft-solid` (the soft tint over the page background, opaque). The contrast check covers soft text roles on it.
- Navigation: `BottomNav`, `MoreSheet`, `NavRail`, `ScrollRow`, `SectionNav`, `useScrollSpy`, and the `NavItem` and `RenderLink` types.
- Layout: `StickyBar`, `StickyActionBar`, `LoadingBar`, `PageContainer`, `ConnectionBanner`, `useOnline`.
- Data: `ResponsiveTable` (table from md, cards below), `ListRow`, `Favicon`, `LinkCard`, `AsyncPanel`; `SkeletonCard`, `StatGridSkeleton`, `CardListSkeleton`.
- Charts (dependency-free SVG): `LineChart`, `BarChart`, `RangeBar`.
- `CommandPalette` and `useCommandHotkey` (Ctrl/Cmd+K and `/`).
- `@nish/ui/format`, a React-free entry: `money`, `signedMoney`, `pct`, `num`, `signed`, `bytes`, `duration`, `ago`, `date`, `time`, `dateTime`, `dateRange`. It is not re-exported from the main entry.
- Hooks and `RelativeTime`: `useMediaQuery`, `useBreakpoint`, `useDocumentTitle`, `useNow`, `useLocalStorage`.
- `revealClass()` and `linkClass()` helpers; `buttonClass` and `Button` take `inline` (link variant, skips the 44px touch area).
- AppHeader: `glass`, `overflowActions` (a "More actions" menu under sm). PageHeader: `collapseWhenStuck`. Callout: `sticky`, `clamp`, `href`, `onClick`, `count`.
- Modal: `sheetHeight` (`'auto' | 'tall' | 'full'`), `dismissible`, `closeOnBack`. Drawer: `dismissible`, `closeOnBack`. Modal and Drawer: `canClose` (return false to refuse a close from X, Escape, scrim, swipe or back, with no exit animation). DropdownMenu: `sheetBelow` and `sheetTitle` (opt-in bottom-sheet menu under 640px).
- Segmented: `overflow` and `fullWidth`. TableWrap: `fade` and `stickyFirstColumn`. Td: `nowrap`.
- Static parity (nish-components.css): `.nish-skeleton` shapes, `.nish-spinner`, busy `.nish-btn`, `.nish-sheet`, `.nish-check-row`, `.nish-checkbox`, `.nish-switch`, `.nish-subnav`, `.nish-link-card`, `.nish-sticky`, `.nish-bottom-nav`, `.nish-checklist`.
- `@nish/ui/theme` and `window.nishTheme`: `openSheet(dialog)`, `mountHeightVar(el, name)`, `mountStuck(el)`, `mountScrollspy(nav, options?)`, `mountChecklist(list)`.

### Changed

- Sticky chrome stacks under the header: PageHeader (`z-20`) and sticky Callouts sit at `--nish-header-h`; AppHeader is `z-30`, keeps one row (`flex-nowrap`) and collapses the hub pill to its arrow below 400px of header width.
- Bottom sheets swipe down to dismiss (30% of the height or 0.5 px/ms) and animate out. Toasts swipe sideways to dismiss.
- Popover and DropdownMenu panels are clamped to the room on screen and scroll inside it; the flip decision uses the panel's natural height.
- Link buttons get a 44px hit area on touch; buttons press-scale on touch.
- `.nish-toast` bottom follows `--nish-bottom-inset`.
- `npm run check` also runs `tools/format-check.mjs`.

### Fixed

- Spinners keep moving under `prefers-reduced-motion` (a slow pulse instead of a freeze).
- TableWrap contains absolutely positioned children, so a wide table no longer widens the page.
- No grey tap flash on Android.
- `scrollbar-gutter: stable` stops the page shifting when a dialog locks scroll on desktop.
- A router link inside a sheet (MoreSheet `renderLink`, CommandPalette) lands on the new page with no dead history entry, also with async routers.
- `useStuck` and `mountStuck` report stuck only for a `position: sticky` element resting at its sticky top after a scroll.
- Toasts sit 20px from the bottom with no bottom bar, above the BottomNav when one shows, and above an open StickyActionBar.

## [0.6.1] - 2026-10-26

### Fixed

- Segmented option `tip`: opens on mouse hover and on keyboard focus (`:focus-visible`) only, and closes on any press. On a phone a tap focused the radio and fired an emulated mouseenter, so the tip stayed pinned over the page after the choice was made.
- Tooltip: a focusable child inside the trigger (a button, a chip) opens the tip on keyboard focus only, and a press on it closes the tip. The emulated mouseenter after a tap no longer opens it either. A trigger that is itself the focus stop (a `hint` term, a badge) still opens on a tap, which is the only way to read it on a phone.
- Recharts charts (base.css, so every app gets it): a tap or click no longer draws a thick focus box round the plot. `.recharts-wrapper` drops the outline on pointer focus and shows a 1px accent ring on keyboard focus. The tooltip cursor (Recharts' `#ccc` slab or line) becomes a faint `hi3` tint (bars) or `line-strong` (lines).

### Changed

- The Samsung Galaxy Z Fold 7 is the target device for every app (README, Accessibility guarantees): no horizontal page scroll at 360px (cover screen), ~840px (unfolded) or desktop. `tools/visual-check.mjs` gains a `fold` viewport (840×760, touch) and now defaults to `desktop`, `fold` and `phone-small` (360px) instead of `desktop` and `phone` (390px).

## [0.6.0] - 2026-10-26

### Changed

- ThemeToggle: below 640px the segmented toggle now renders as the compact cycling button, so phone headers (AppHeader, app shells) keep the hub pill, actions and theme on one row instead of wrapping a 140px three-segment group onto a second line. New `phone?: 'compact' | 'segmented'` (default `'compact'`); `phone="segmented"` restores the old behavior. `block` toggles stay segmented at every width. The docs site header drops its own two-toggle workaround.

## [0.5.3] - 2026-10-25

### Fixed

- KeyValueItem `wrap: 'words'` now wraps labels first: the label keeps its one-line width up to 60% of the row (`shrink-0 max-w-[calc(60%-0.75rem)]`) and the value fills the rest, at least 40% (`min-w-0 flex-1 text-right`). In 0.5.2 the value took up to 60% and the label only what was left, so a flex shrink of a pixel or two put a two-word label such as "Earnings Calendar" on two lines at 360px. Rows, padding and the `overflow-wrap: anywhere` fallback are unchanged.

## [0.5.2] - 2026-10-25

Gap round 3: the last gaps the apps reported after 0.5.0. Additive.

### Added

- KeyValueItem `wrap: 'words'` (and `'anywhere'`, the same as `true`): for prose values, both cells shrink and wrap at word breaks, the label `min-w-0 flex-1`, the value at most 60% of the row (`min-w-0 max-w-[60%] text-right`); a word splits only when it alone is wider than its cell. The row stays at least 44px (32px dense) and grows when the text wraps. Both the `ul` and `dl` forms.
- `confirmDialog({ title, body?, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone? }): Promise<boolean>` in `@nish/ui/theme` and `window.nishTheme`: `window.confirm` for static pages, on a native `<dialog class="nish-dialog">` opened with `showModal()`. Escape and a backdrop click cancel (Escape does not reach the page's own key handlers), focus returns to the opener, 44px buttons on touch; `tone: 'danger'` gives a red confirm button and starts focus on Cancel, as the React ConfirmDialog does. New `.nish-dialog`, `.nish-dialog-title`, `.nish-dialog-body`, `.nish-dialog-actions` in nish-components.css.
- `.nish-tooltip` with a `.nish-tooltip-content` child (`role="tooltip"`, linked by `aria-describedby`): a CSS-only tooltip that shows on hover and keyboard focus, with the React Tooltip's look; `--bottom`, `--start`, `--end` placements. `mountTooltips(root?)` in `@nish/ui/theme` and `window.nishTheme` adds Escape to hide it (and links a tip without an id).

## [0.5.1] - 2026-10-25

Docs site only; the package is unchanged.

### Fixed

- design.nish.software header on phones: below 640px the logo shows without the name and version (they were squeezed to "@…" next to the "← nish.software" link), and below 360px the logo hides so the theme switch never overlaps it.

## [0.5.0] - 2026-10-25

Gap round 2: the one wrapper the apps still needed after adopting 0.4.0. Additive.

### Added

- KeyValueItem `wrap`: a long value (a path, a URL, an id with no spaces) wraps with `break-all` instead of setting the row's width; the label keeps its width and the row grows past 44px (32px dense). Both the `ul` and `dl` forms of `KeyValueList`.

## [0.4.0] - 2026-10-25

Gap round 1: the pieces the apps still covered with local wrappers after adopting 0.3.0 (jobs, trading, Nishboard, the hub, the trip skill, mc and trips, status, trackers), so they can delete them. Additive, apart from the behavior change listed at the end.

### Added

Primitives and forms
- Badge `tone="on-accent"` (and `badgeClass({ tone: 'on-accent' })`, `.nish-badge--on-accent`): a small label inside a solid accent fill, such as a "Direct" tag in a primary Apply button. The contrast check covers on-accent on its 20% tint over accent.
- IconButton `size="2xs"` (20px, `rounded`, 44px on touch) and `iconButtonClass({ size: '2xs' })`, `.nish-icon-btn--2xs`: row-level reveal actions and 22px title bars.
- `chipClass({ pressed, variant, size, className })`: the exact Chip recipe for router links and anchors that look like chips (links take `aria-current`). Chip now calls it.
- `FieldGroup({ label, hint, error, optional })`: Field for a group of controls, a `<fieldset>` with a `<legend>` styled like Field's label and the hint or error tied by `aria-describedby`. Static: `fieldset.nish-field` with `legend.nish-field-label`.
- Segmented option `tip`: a tooltip that opens on hover and on keyboard focus of the radio itself, with `aria-describedby` while shown. The radio stays the only Tab stop.
- Segmented option `tone` (`accent` | `warn` | `loss`): the selected look in that tone, for a choice that must read as a warning while it is on.
- Tabs `size="xs"` (pill `h-6 px-2 text-2xs`, underline `h-7 text-2xs`, 44px on touch) and `tabClass({ size: 'xs' })`.
- Tabs `block`: the tab list fills its container with equal-width tabs (`tabClass({ block })`).
- Tabs `hideFrom` and TabPanel `showFrom` (`md` | `lg`): responsive panes. Below the breakpoint, ARIA tabs; from it, the tab list is not rendered and every panel renders as a plain region side by side (a matchMedia hook, since Tailwind preflight's `[hidden]` rule is `!important`).
- TabPanel `keepMounted`: keeps a hidden panel's content mounted.

Overlays
- Popover `onOpenChange(open, reason)`: the second argument says why it closed (`'escape'`, `'outside'` or `'tab'`). DropdownMenu passes the same reason when it closes itself. Type `PopoverCloseReason`.
- Popover `dismissOnOutside` (default true): false keeps the panel open on outside presses (an editor whose targets sit outside it); Escape and Tab out still close it.
- `menuItemClass({ active, danger, disabled, className })`: MenuItem's row look for tabbable buttons in a Popover that also holds IconButtons, inputs or color pickers. MenuItem now calls it.

Display and feedback
- Toaster `offsetUntil` (`sm` | `md` | `lg`): where `offset` stops applying, to match the breakpoint where an app's bottom tab bar hides.
- Meter `tone="neutral"` (`bg-th-hi3`) and `.nish-meter--neutral`: a quantity with no status meaning.
- `SkeletonRows({ rows, height, gap, label, className, rowClassName })`: a `role="status"` column of full-width rounded-xl shimmer rows for lists and pages of cards.
- `SectionHeader({ title, id, as, meta, action })`: the heading row of a section inside a page.
- `KeyValueList({ items, dense, as })`: label and value rows with dividers, 44px tall (32px dense), as a list or a `<dl>`.
- `ChartLegend({ items, marker, label })`: the key for multi-series canvas charts, a color mark (line or dot) and a name per series.
- AppHeader `homeHref` (the icon and name become one 44px link home), `hideNameBelow="sm"` (icon only on phones, the name stays for screen readers), `navLabel` (names the nav landmark) and `compactPill` (the hub pill shrinks to its arrow under 480px).
- ThemeToggle `variant="pill"`: one cycling button in a 44px pill with a line-strong border, to sit next to the hub pill; with `labels` it shows the current choice as a word.

Static pages (`@nish/ui/theme`, nish.css, nish-components.css)
- `showToast(content, { tone, duration, action, dismissLabel })` in `@nish/ui/theme` and `window.nishTheme`: one `.nish-toast` in a single polite live region, with the React toast's policy (the timer pauses on hover and focus). Text is never parsed as HTML; pass a Node for markup. Returns a function that hides it.
- `.nish-toast` with `.nish-toast-body`, `.nish-toast-action`, `.nish-toast-close` and tone modifiers `--ok`, `--warn`, `--loss`, `--info`.
- `mountThemeToggle(button, { showLabel: true })`: adds a `<span data-theme-word aria-hidden="true">` with the current choice (System, Light, Dark, or a preset's name) and keeps it in sync. `aria-label` and `title` are unchanged.
- `.nish-theme-btn--pill` (44px pill on every pointer, line-strong border) and `.nish-theme-btn--labelled` (the pill with the word), to sit next to `.nish-pill-link`.
- `.nish-glass`: a see-through fill (`bg` at 60% with a 4px backdrop blur) for controls scoped dark over a photo or gradient.
- `.nish-pill-link--compact` with `.nish-pill-link-label`: under 480px only the arrow shows, in a 44px circle, and the words stay for screen readers; `data-compact="always"` keeps it compact at every width.

### Fixed
- `.nish-pill-link` sets `font-family: var(--nish-font-sans)`, so the pill looks the same on pages with a serif body.

### Behavior changes
- Input, Select, SearchInput, Textarea and `fieldClass()`: the 16px text that stops iOS zooming now applies on touch screens (`pointer-coarse:text-base`) instead of under 640px. A narrow window driven by a mouse (Nishboard's popouts) keeps the size's own text; phones are unchanged. Static `.nish-input`, `.nish-select` and `.nish-textarea` follow the same rule.

## [0.3.0] - 2026-10-25

The adoption release: every piece the apps had each built for themselves (from an audit of jobs, trading, Nishboard, the hub, status, trackers, mc and trips), so they can delete their local copies. Additive, apart from the behavior changes listed at the end.

### Added

Foundation
- Hue soft tints: `--nish-<hue>-soft` for the 8 hues (14% over transparent) and Tailwind `bg-th-<hue>-soft`. The contrast check covers each hue on its tint over bg, surface and elevated (3:1) and `hi` on every hue tint (4.5:1).
- `text-2xs` (11px / 1rem) and `text-3xs` (10px / 0.875rem): `--nish-text-2xs`, `--nish-text-3xs` and Tailwind `text-2xs` / `text-3xs`. `cn()` keeps a `th-*` color next to them (a build assertion checks it).
- `--nish-radius-card` (12px, what Card's `rounded-xl` is). The Foundations page lists the canonical radii: controls `rounded-lg`, cards `rounded-xl`, dialogs `rounded-2xl`, pills `rounded-full`.
- `HUE_ROLES` export; `SOFT_ROLES` now lists the hues after the status roles. `SOFT_ROLES` and `SHADOWS` are exported from the main entry too.
- `@nish/ui/tokens`: `THEMES`, `SCALE`, `COLOR_ROLES`, `SOFT_ROLES`, `HUE_ROLES`, `SHADOWS`, `DEFAULT_THEME` as plain data with types. It imports nothing, so it loads in plain Node without React.
- `mountThemeToggle(button, { labels })` in `@nish/ui/theme` and `window.nishTheme`: the one-button System, Light, Dark toggle for static pages, with a correct label for a preset set on another site. It returns a cleanup.
- base.css: `.nish-skip-link`, a base `kbd` style, `.scrollbar-none`, and `@keyframes nish-slide-in-right` / `nish-slide-in-left` (Tailwind `animate-slide-in-right` / `animate-slide-in-left`).
- `.nish-prose` in base.css: Markdown and rich text (headings, lists, links, code, quotes, tables, task lists) on role tokens.
- `package.json` exports `./tokens`, `./chart` and `./nish-components.css`.
- `scripts/bump-consumers.sh` writes the codeload tarball form from either dependency form, uses the hub's `master` branch, skips repos without @nish/ui cleanly, and has `--dry-run`.

Primitives
- Button: `soft`, `subtle` and `link` variants, and an `xs` size (24px, 44px on touch).
- `buttonClass({ variant, size, className })`: the exact Button recipe for `<a>`, router `<Link>` and `<a download>`.
- IconButton: `xs` size (24px), `variant` (`ghost` | `subtle` | `soft`) and `tone="danger"`.
- `iconButtonClass({ size, variant, tone, active, className })`.
- Card: `padding` (`none` | `sm` | `md` | `lg`), `as` (`div` | `section` | `article` | `aside` | `li`), `variant="inset"`, and `title` / `description` / `action`, which render a CardHeader.
- `cardClass({ padding, padded, interactive, variant, className })`, for cards that are links.
- `CardHeader`: title, description, icon, action slot, heading level (`as`), `divided` for edge-to-edge cards, `titleId`.
- Badge: `hue` (the 8 hues, on `th-<hue>-soft` with `hi` text), `size="xs"`, `variant="tag"` and `dot`.
- `badgeClass({ tone, hue, size, variant, className })`.
- Input: `size` (`xs` | `sm` | `md`), `leading` and `trailing` slots, `wrapperClassName`.
- Select: `size` (`xs` | `sm` | `md`) and `selectClassName` for the inner `<select>`.
- `fieldClass({ size, invalid, className })`: the shared field recipe for one-off controls.

Forms
- Textarea: `size` (`sm` | `md`) and `autoGrow` (`true` or `{ maxRows }`); `rows` stays the minimum height.
- Checkbox: `indeterminate`, `trailing` slot, `size` (`sm` | `md`); `label` is optional when the box has an `aria-label`.
- `Switch`: `<button role="switch" aria-checked>` with `label`, `description`, `size` and `labelSide`; the label is tied by `aria-labelledby`.
- `Field`: label, one control, hint and error, wired with `id`, `aria-describedby` and `invalid` / `aria-invalid`; `optional`, `layout="inline"`, `labelWidth`.
- `SearchInput`: leading search icon, Clear button, Escape clears, `size` (`xs` | `sm` | `md`), `variant="bare"`; `onChange` receives the string.
- `Chip`: `toggle` (`aria-pressed`), `suggestion` and removable `tag` variants, `icon`, `trailing`, `size`.
- `ChipGroup`: a labelled `role="group"` of Chips that wraps, or scrolls sideways on phones with `scroll`.
- Segmented: `size="xs"`, `block`, per-option `disabled` (skipped by the arrow keys) and `title`, and the Home and End keys.
- `Tabs` and `TabPanel`: the ARIA tabs pattern with `underline` and `pill` variants, `size`, `count`, `sub`, disabled tabs, arrow keys, Home and End.
- `tabClass({ active, variant, size, className })`: the tab look for router links (`aria-current="page"`).
- ThemeToggle: built on Segmented; `labels`, `block`, `size` (`sm` | `md`) and `compact` (one button that cycles System, Light, Dark).

Overlays
- `Drawer`: a panel from the right, left or bottom edge (`side`, `size` sm/md/lg, `subtitle`, `actions`, `footer`, `bottomOffset`), with the same focus trap, Escape, focus return and scroll lock as Modal.
- `ConfirmDialog`: a yes-or-no question before an action, in place of `window.confirm` (`tone` danger/primary, `pending`, `confirmLabel`, `cancelLabel`). Danger confirms start focus on Cancel.
- `Popover`: a non-modal panel anchored to an element (`open`, `onOpenChange`, `anchor`, `side`, `align`, `width`); flips and clamps, closes on Escape and outside press, returns focus to the anchor.
- `DropdownMenu` with `MenuItem` (`icon`, `trailing`, `danger`, `active`, `disabled`, `onSelect`), `MenuLabel`, `MenuSeparator` and `MenuSubHeader`: menu roles, arrow keys, Home, End, typeahead, Escape, `aria-haspopup` / `aria-expanded` on the trigger, focus return.
- Modal `size="2xl"` and `size="full"`.
- Modal `placement="top"` for command palettes and search dialogs.
- Modal `header` (replaces the title row; pass `aria-label`), `hideClose` and `aria-label`.
- Tooltip `side="left"` and `side="right"`.
- Tooltip `focusable` (default true; false keeps dense marks out of the Tab order).
- Tooltip `variant="hint"`: dotted underline and help cursor on the trigger.
- Popovers and menus opened inside a Modal or Drawer stack above it, and Escape closes only the topmost layer.

Display and feedback
- `Spinner({ size, label })`: the shared loader in `currentColor`; with `label` it is `role="status"`.
- Toasts take options: `toast(title, { body, action, duration, id })`. `action` renders a text button that runs and dismisses; `id` replaces the toast in that slot instead of stacking; `duration` is milliseconds or `'sticky'`. `(title, body)` calls keep working.
- `Toaster({ offset })`: the stack's bottom distance on phones (clear a bottom tab bar).
- `Callout({ tone, icon, title, action, onDismiss, variant, compact, live })`: inline notices, `box` or `bar`.
- `StatusDot({ tone, size, pulse, halo, label })`: status marks on the `-fill` roles.
- `Stat({ label, value, sub, tone, tip, size, variant, loading })` and `StatGrid({ cols })`: labelled numbers as a `<dl>`.
- `signTone(n)`: ok, loss or neutral for a signed number.
- `Meter({ value, min, max, label, tone, thresholds, size, orientation, track, kind, showValue })`: `role="meter"` or `progressbar`.
- `toneFor(value, { warn, loss })`: ok, warn or loss, for higher-is-worse and lower-is-worse thresholds.
- `Sparkline({ values, label, tone, width, height, fill, min, max })`: a dependency-free SVG trend with gaps at nulls.
- `Disclosure({ summary, defaultOpen, open, onOpenChange, variant })`: `<details>` with a turning chevron.
- `Kbd`: a keyboard key.
- `copyText(text)` and `CopyButton({ text, label, copiedLabel, iconOnly, size, variant, onCopy })`: copy with a "Copied" state announced to screen readers.
- `PageHeader({ title, description, eyebrow, back, actions, as, sticky })`.
- `AppHeader({ name, icon, hubHref, actions, nav, themeToggle, sticky, innerClassName })`: hub pill, wordmark, actions, ThemeToggle and a nav row.
- Table primitives `TableWrap`, `Table`, `Th` (sort with `aria-sort`), `Td`, `Tr` (tone edge, interactive, muted), and `tableClass` strings for TanStack renderers.
- `@nish/ui/chart`: `seriesColor(i)`, `CHART`, `tooltipStyle`, `chartTheme()` and `useChartTheme()`, with no chart-library dependency.

Static sites
- `@nish/ui/nish-components.css`: opt-in component classes for pages without React (`.nish-btn`, `.nish-icon-btn`, `.nish-card`, `.nish-badge`, `.nish-input` / `.nish-select` / `.nish-textarea`, `.nish-label`, `.nish-field`, `.nish-seg`, `.nish-chip`, `.nish-callout`, `.nish-stats` / `.nish-stat`, `.nish-table-wrap`, `.nish-meter`, `.nish-disclosure`, `.nish-empty`, `.nish-error-state`, `.nish-theme-btn`). Every selector is wrapped in `:where()`, so a site's own CSS wins. Listed in `dist/files.json` "static", so hosting's `sync-ui.mjs` vendors it.
- `.nish-search` (the SearchInput twin) and `.nish-dot` (the StatusDot twin) in `nish-components.css`.
- `.nish-badge` hue modifiers (`--emerald` … `--teal`), mirroring Badge `hue`.

Docs site and tools
- A page for every new component, each with stories for every variant and size, an in-a-card story and the All themes view; new pages for mountThemeToggle, Prose, Base utilities and Chart colors.
- The Static sites page shows every `nish-*` class beside its React component and in every theme; the static example is rebuilt on the classes and uses `mountThemeToggle`.
- The docs site uses the shared `Tabs`, `tabClass` and `Badge` instead of its own local tabs and pill.
- `tools/visual-check.mjs` skips visually hidden text (`.sr-only`, 1px boxes, text clipped to nothing) in its clipped-text check.
- `tools/visual-check.mjs` waits for `load` and then for the network to go quiet. When Playwright never reports networkidle (seen on All themes pages with about 50 preview frames), it settles on its own check, every frame loaded and no request in flight for a second, and notes it on the shot.
- The visual configs cover every new page, the All components page, the Static sites All themes view and both static examples.

### Behavior changes
- Modal (and Drawer, ConfirmDialog) lock scroll on `<html>` as well as `<body>`, restored when the last dialog closes. Apps with a local root-scroll lock (job-apps `useLockRootScroll`) can drop it.
- The Tailwind base now sets the default border color (`--nish-line`) on every element and a pointer cursor on enabled `button` and `[role=button]`.
- theme-init.js sets `<meta name="theme-color">` to the resolved theme's bg before first paint (and creates the tag when it is missing). Registered app themes keep the runtime path.
- `kbd` elements get a bordered key style from base.css (nish.css and tailwind.css) everywhere.
- Card's `title` prop renders a CardHeader instead of the native `title` attribute (tooltip). A titled `section`, `article` or `aside` Card gets `aria-labelledby` pointing at its heading.
- Card forwards its ref as `HTMLElement` (was `HTMLDivElement`); it still renders a `div` by default.
- Input and Select: the native `size` attribute is replaced by the `size` prop (`xs` | `sm` | `md`).
- Field padding is now `pl-*` / `pr-*` instead of `px-*` (same pixels); `className="pl-9"` keeps working and `px-4` still overrides both sides.
- Segmented: arrow keys move focus along with the selection (before, the choice moved but focus stayed behind), and Home and End work.
- Checkbox: the box is drawn from theme roles (`appearance: none`, `line-strong` border, accent fill with an `on-accent` check) instead of the native box with `accent-color`, so the unchecked border reads in light themes.
- ThemeToggle: segments are 44px on touch (were 40px), idle icons use `hi2` (were `hi3`), and the segments use Segmented's roving tabindex (one Tab stop instead of three).
- Modal `title` is optional when `header` is given (it stays the accessible name otherwise).
- Tooltip opens on `focusin`, so a focusable child inside the trigger shows the tip too, and Escape hides it. Its position is measured before paint and follows scroll and resize (shared with Popover and DropdownMenu). It uses `z-index: var(--nish-z-tooltip)` (100, the same value).
- Toast timers pause while a toast is hovered with a mouse or holds focus, and resume (at least 1s) after. A toast pushed out by the four-toast limit has its timer cleared.

## [0.2.6] - 2026-10-25

### Added
- `.nish-pill-link` in base.css (so in nish.css and tailwind.css): the "← nish.software" pill link every subdomain shows at the top left of its header. 44px tall, theme colors, one class instead of a copy per site.
- Docs site: the header shows "← nish.software" before the site name on every page.

## [0.2.5] - 2026-10-25

### Added
- Docs site: an **All components** page that shows every component rendered together with its name (and a filter), so you do not have to step through them with Next. Framed components (Toast, Modal, Tooltip) render in their own frames.

## [0.2.4] - 2026-10-25

### Added
- `Textarea`: multi-line text with the shared field look (16px on phones, vertical resize, invalid state).
- `Checkbox`: a checkbox with its label and an optional hint; the whole row toggles it and is a 44px tap target on touch screens.
- `Modal` `subtitle`: a summary pinned under the title while the body scrolls (price, status, timestamps).
- `Skeleton` `style`, for sizes known only at runtime.

### Changed
- `Modal` titles wrap to two lines instead of cutting off after one, so long names (products, positions) stay readable.

### Fixed
- The toast's Dismiss button is 44px on touch screens (it was 30px).

## [0.2.3] - 2026-10-25

### Fixed
- `Segmented` with no option selected (the value is outside its options, as when an app's own preset theme is active) kept every option out of the Tab order, so the group was mouse-only. The first option now takes the Tab stop, and arrow keys start from the ends.

## [0.2.2] - 2026-10-25

### Added
- `Segmented`: two to five mutually exclusive choices side by side (a chart range), as an accessible radio group with arrow-key movement and 44px touch targets. Status and trackers had each grown a local one.

### Changed
- The selected option in `ThemeToggle` (and `Segmented`) takes the accent tint and ring instead of a white chip, which was hard to pick out on the light theme's off-white track.

### Fixed
- `Modal`'s close button is 44px on touch screens, matching every other control (it was 36px).

## [0.2.1] - 2026-10-25

### Fixed
- `Modal` lets React's `autoFocus` win: it only picks a focus target after React has run, and it also honors `data-autofocus`. Before, the panel always took focus, so dialog inputs with `autoFocus` never got it.
- `Modal` stacking: only the top modal answers Escape and traps Tab, so a confirm dialog over an editor closes on its own.
- `tools/visual-check.mjs` reports sideways overflow inside apps that scroll in `<main>` (a vertically scrolling container no longer counts as a legitimate horizontal scroller), and flags such a container that itself scrolls sideways.

## [0.2.0] - 2026-10-25

### Added

- `on-accent2`, `on-ok`, `on-loss`, `on-warn` and `on-info` colors for text and icons on solid
  fills, as `--nish-on-*` variables and `text-th-on-*` classes. Each clears 4.5:1 on its fill
  in every theme, and `tools/contrast.mjs` checks them.
- `dist/theme.global.js`: the theme API as a classic script for pages that cannot use modules.
  It sets `window.nishTheme = { initTheme, setThemeChoice, cycleTheme, onThemeChange, readToken, registerThemes, getThemeChoice }`.
  Exported as `@nish/ui/theme.global.js`; the build tests it.
- `dist/files.json`: the files a static site vendors, with the current font file names.
- A theme can be scoped to part of a page: `<div data-theme="light" data-scheme="light">`
  gets that theme's colors, soft tints and shadows for its subtree.
- The docs site at design.nish.software (`npm run dev:site`, `npm run build:site`), built from
  this repo's source, with generated props tables, every component in every theme and a
  contrast matrix.
- `CHANGELOG.md`.

### Changed

- The light theme's chart series are brighter: each is the most vivid shade of its hue that
  still clears 3:1 on bg, surface and elevated (chart-3 was `#b45309`, a rust brown, and is now
  `#c96d06`). The order and hue families are the same. Charts in light mode will look
  different.
- Font files in `dist/fonts/` have content-hashed names
  (`inter-latin-wght-normal.<hash>.woff2`), and `fonts.css` and `nish.css` reference them, so
  static sites can cache them for a year. **Static sites that copy fonts by name must copy the
  new names**: read them from `dist/files.json` (hosting's `scripts/sync-ui.mjs` lists the old
  names and needs that change before it moves to this release).
- Danger buttons use `text-th-on-loss` instead of `text-th-on-accent`. Same colors in every
  shared theme today.
- Soft tints, shadows and `--nish-focus` are declared on every `[data-theme]` element as well as
  `:root`. Nothing changes for html-level theming.
- `tools/contrast.mjs` also requires every chart color to clear 3:1 on elevated. The pairs it
  checks moved to `tools/contrast-rules.mjs`, shared with the docs site.
- `tools/visual-check.mjs` clips full-page shots at 16,000px (`maxHeight` in the config) and notes
  it on the shot. Pages taller than 65,535px used to produce empty JPEGs that still passed; a
  shot whose file is empty or missing now fails.

## [0.1.2] - 2026-10-25

### Added

- Fill colors for bars, meters and chart lines: `ok-fill`, `loss-fill`, `warn-fill` and
  `info-fill` (`bg-th-ok-fill`). In light themes they are brighter than the text-safe status
  colors, which look muddy as large fills; dark themes use the same color for both.
- `registerThemes()` and `window.__nishExtraThemes` for themes an app defines itself. The theme
  logic and theme-init.js accept the registered names and know whether each is dark or light.

### Fixed

- A disabled `Button` reads as disabled in every theme: a flat, quiet fill and faint text
  instead of a dimmed copy of the enabled color.

## [0.1.1] - 2026-10-25

### Fixed

- `theme-init.js` in v0.1.0 kept its `__THEMES__` placeholder and threw on load, so the saved
  theme never applied before first paint. The build now fills it in and runs the script against
  a stub document with nine cases (cookie, localStorage, OS light, unknown names, limited
  themes, extra themes) before writing it.

### Changed

- React and react-dom are optional peer dependencies, so static sites and tools that only use
  the CSS and `@nish/ui/theme` do not get React installed.

## [0.1.0] - 2026-10-25

The first release.

- Design tokens in `src/tokens.mjs`: color roles for seven themes (dark, light, slate,
  terminal, mocha, ocean, contrast), soft tints, chart series and hues, plus type, spacing,
  radii, shadows, motion, z-index and breakpoints. The build turns them into `--nish-*` CSS
  variables and `th-*` Tailwind classes.
- Theme switching: `theme-init.js` before first paint, and `getThemeChoice`, `setThemeChoice`,
  `applyTheme`, `onThemeChange`, `cycleTheme` and `readToken`. The choice is shared across
  subdomains through a `nish-theme` cookie on `.nish.software`.
- Components: `Button`, `IconButton`, `Card`, `Badge`, `Input`, `Select`, `Label`, `Skeleton`,
  `SkeletonLines`, `EmptyState`, `ErrorState`, `Toaster` with `toast()`, `Modal`, `Tooltip` and
  `ThemeToggle` with `useTheme()`.
- `nish.css` for static pages, and the self-hosted Inter Variable font.
- `tools/contrast.mjs` (WCAG check of every theme), `tools/visual-check.mjs` (screenshots and
  layout, contrast, tap-target and focus checks), `tools/gallery.mjs`, the release script and
  `scripts/bump-consumers.sh`.
