# Changelog

Every release of `@nish/ui`, newest first. Versions follow semver. Before 1.0, a minor
bump (0.x.0) could require apps to change code. From 1.0.0, a major means app code must change,
a minor adds, and a patch fixes.

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
