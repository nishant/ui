# @nish/ui: components to add and extend (adoption round 1)

Status: **spec, not yet built.** Written 2026-10-25 from an audit of every app and site that uses
@nish/ui v0.2.1: jobs, trading, Nishboard, the hub, status, trackers, mc, trips and the trip-plan
skill. Each app had hand-rolled the same pieces. This file is the source of truth for the **APIs and
looks** of what @nish/ui adds next, so the apps can delete their local copies.

The cross-repo rollout plan (which app changes what, gates, order, checks) lives in the private
`nishant/hosting` repo at `docs/design-system/SPEC.md`. It links here for every API.

## How to read this

- **Tier 1** ships in the next release (expected **v0.3.0**, a minor: additive, plus behavior fixes
  noted below). **Tier 2** ships in the same release if it is ready, otherwise in the one after.
  **Tier 3** stays local in apps for now and is listed so nobody builds it twice.
- "Evidence" counts hand-rolled call sites across apps at audit time. Rough counts, but they set
  the priority.
- Every class recipe uses roles only (`th-*`, `--nish-*`). Inside this package a hand mix such as
  `bg-th-accent/20` is allowed for hover and active states. Apps must not do it (they use `*-soft`).
- Every interactive control grows to 44px on touch (`pointer-coarse:min-h-11` and/or `min-w-11`)
  and stays compact under a mouse. That is the existing rule; new components keep it.
- Every new export gets: JSDoc on each prop (docgen reads it), a docs-site page with stories in the
  all-themes view, an entry in `tools/site-all.visual.json`, and a CHANGELOG line.
- **Keep one recipe per look.** Where a component also needs a class form (links, router
  `NavLink`s, static pages), export a `*Class()` function and have the component call it.

## Already in flight (do not redo)

As of 2026-10-25 04:40 CDT another session had **uncommitted** work in the ui checkout:
- `src/components/segmented.tsx`: `Segmented<T>({ label, options: {value,label,ariaLabel?}[], value, onChange, size: 'sm'|'md', className })`,
  a radiogroup with roving tabindex and arrow keys. The selected option is `bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40`.
- ThemeToggle's selected segment gets the same accent look.
- The Modal close button becomes 44px on touch (`pointer-coarse:min-h-11 pointer-coarse:min-w-11`).
- A docs page for Segmented and entries in `tools/site-all.visual.json`.

Whoever builds this spec must first check `git log origin/master` and the tags. If that work has
landed, build on it. If it has not, include it unchanged and extend it as specified below.

---

## Tier 1

### Foundation (tokens, CSS, build)

| Item | Change | Why (evidence) |
|---|---|---|
| Hue soft tints | `--nish-<hue>-soft` for the 8 hues (`color-mix(in srgb, var(--nish-<hue>) 14%, transparent)`), declared with the other soft tints on `:root,[data-theme]`. Tailwind: `th-<hue>-soft`. Contrast rules: hue on its own soft over bg, surface and elevated ≥ 3:1 (marks); `hi` on hue-soft ≥ 4.5:1. | Hub tile icons, trackers store badges, trip calendar dots hand-mix 14% today |
| Small type | SCALE `text-2xs` 0.6875rem (11px) with line-height 1rem, and `text-3xs` 0.625rem (10px) with line-height 0.875rem. Tailwind `@theme`: `--text-2xs`, `--text-2xs--line-height`, the same for `3xs`. **Also extend tailwind-merge in `src/cn.ts`** with `theme: { text: ['2xs', '3xs'] }`. Without it, `cn('text-th-hi', 'text-2xs')` may drop the color because tailwind-merge reads `text-2xs` as a color. Add a unit check in the build. | Nishboard has 289 arbitrary `text-[10px]`/`text-[11px]`; jobs 11; trading ~20 |
| Card radius token | SCALE `radius-card: 12px` (what `Card` uses via `rounded-xl`). Document the canonical radii on the Foundations page: controls `rounded-lg` (8px = `radius-sm`), cards `rounded-xl` (12px = `radius-card`), dialogs `rounded-2xl` (16px), pills `rounded-full`. Do **not** remap Tailwind's `rounded-*` scale. | Card's 12px matches no token today; static sites cannot match it |
| Tailwind base defaults | In `tailwind.css`, inside `@layer base`: `*, ::before, ::after, ::backdrop, ::file-selector-button { border-color: var(--nish-line); }` and `button:not(:disabled), [role='button']:not([aria-disabled='true']) { cursor: pointer; }`. | trading and Nishboard each carry both rules locally (Tailwind 4 dropped the gray default and the pointer cursor) |
| Pre-paint `theme-color` | `theme-init.js` also sets `<meta name="theme-color">` to the resolved theme's `bg`. The build bakes a `{ theme: bgHex }` map, the same way it bakes `THEMES`. Extra (registered) themes keep the runtime path. Add cases to the build's `testInit`. | Hub hardcodes a dark meta, status has none, trading's stays dark for light users |
| Utilities in base.css | `.scrollbar-none` (hide scrollbars, keep scrolling); `.nish-skip-link` (visually hidden until focused, `z-index: var(--nish-z-tooltip)`); a base `kbd` style (`font-family: var(--nish-font-mono)`, `font-size: .85em`, 1px `--nish-line-strong` border, `--nish-elevated` background, `border-radius: var(--nish-radius-xs)`, padding `0 .35em`); `@keyframes nish-slide-in-right`, `nish-slide-in-left` for Drawer. | Nishboard, the hub, mc |
| React-free tokens entry | New export `@nish/ui/tokens` → `THEMES`, `SCALE`, `COLOR_ROLES`, `SOFT_ROLES`, `SHADOWS`, `DEFAULT_THEME` (plain data, no React import). Add it to `package.json` exports and the tsup or copy step, with types. | Nishboard's plain-Node theme generator hardcodes copies of ui's hex values because the main entry pulls in React |
| `mountThemeToggle` (static) | In `src/theme.ts` and `window.nishTheme`: `mountThemeToggle(button: HTMLElement, opts?: { labels?: Partial<Record<'system'\|'light'\|'dark', string>> }): () => void`. It fills the button with the three icons (system, light, dark; same SVGs as ThemeToggle), sets `data-choice`. It keeps `aria-label` and `title` correct: "Theme: Light. Switch to Dark". For a preset saved on another site: "Theme: Mocha (set on another site). Switch to System". It computes the next choice exactly as `cycleTheme()` does, cycles on click, follows `onThemeChange`, and returns a cleanup. | mc and trips contain the same toggle code; the hub's copy has a wrong label with presets |
| `nish-components.css` (static) | See "Static component classes" below. | mc, trips, the hub, trip gates, ui's own static example |
| `bump-consumers.sh` | Rewrite either dependency form (`github:nishant/ui#vX` or `https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX`) to the **codeload form** (works on the hosting PC runner, whose SSH key GitHub rejects). Fix the hub's base branch (`master`, not `main`). Skip a repo cleanly when it has no `@nish/ui` dependency. | status uses codeload and the script's sed never matches it; the hub's base branch is wrong |
| README "Used by" | Correct the install column (status and trackers use the codeload tarball; trackers is not on @nish/ui until its migration lands). | Drift |

### Button (extend)

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'subtle' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export function buttonClass(o?: { variant?: ButtonVariant; size?: ButtonSize; className?: string }): string;
```

- `soft`: `bg-th-accent-soft text-th-accent hover:bg-th-accent/20 active:bg-th-accent/25`. Replaces "accent outline" buttons (trading 5, jobs 5, Nishboard 3).
- `subtle`: `bg-th-elevated text-th-hi hover:bg-th-overlay`. A filled quiet button for dense toolbars and chips on a surface (Nishboard's default look; Nishboard would otherwise get outlined `secondary` everywhere).
- `link`: `h-auto p-0 font-medium text-th-accent underline-offset-2 hover:underline`, no min height and no touch growth (it sits inline in text). Replaces link-styled buttons (trading 9, Nishboard 7, jobs' `LINK`).
- `xs`: `h-6 gap-1 px-2 text-2xs pointer-coarse:min-h-11`.
- `buttonClass()` returns exactly what `<Button>` renders, minus the `disabled:` styles. Use it on `<a>`, router `<Link>` and `<a download>`: jobs has 17 such links, trackers 5, status and the hub 1 to 3. `Button` itself calls `buttonClass()`.
- Behavior is unchanged: default `type="button"`, `loading` shows a spinner and disables.

### IconButton (extend)

```ts
interface IconButtonProps { label: string; size?: 'xs' | 'sm' | 'md'; active?: boolean;
  variant?: 'ghost' | 'subtle' | 'soft'; tone?: 'neutral' | 'danger' }
export function iconButtonClass(o?: {...}): string;
```

- `xs`: `size-6 rounded-md` (Nishboard's 22px header actions: 33 sites through one wrapper).
- `variant="subtle"`: `bg-th-elevated text-th-hi hover:bg-th-overlay`. `soft`: `bg-th-accent-soft text-th-accent`.
- `tone="danger"`: hover and active `text-th-loss bg-th-loss-soft` (delete and remove actions).
- `title` stays equal to `label`, so tests that query by title keep working (Nishboard's Launcher test relies on it).

### Card (extend) and CardHeader (new)

```ts
interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';   // sm p-3, md p-4 sm:p-5 (default), lg p-6
  padded?: boolean;                          // kept: false === padding="none"
  interactive?: boolean;
  variant?: 'surface' | 'inset';             // inset: bg-th-elevated, no border color, no shadow, rounded-lg
  title?: ReactNode; description?: ReactNode; action?: ReactNode;   // renders <CardHeader> first
}
export function cardClass(o?: {...}): string;  // for <Link className={cardClass({ interactive: true })}>
export function CardHeader(p: { title: ReactNode; description?: ReactNode; action?: ReactNode;
  icon?: ReactNode; as?: 'h2' | 'h3' | 'h4'; divided?: boolean; className?: string }): JSX.Element;
```

- `padding` fixes a real trap: `<Card className="p-3">` keeps `sm:p-5`, because tailwind-merge only drops the base `p-4`.
- CardHeader: `flex flex-wrap items-center justify-between gap-x-3 gap-y-2`. Title is `text-sm font-semibold text-th-hi`, description `text-xs text-th-hi3`. `divided` adds `border-b border-th-line px-4 py-3` for edge-to-edge cards (tables, widgets). It replaces status `Panel` (9), trackers `.panel__head` (12), Nishboard sub-headers (~6), jobs card headers (5).

### Badge (extend)

```ts
interface BadgeProps { tone?: 'neutral'|'accent'|'ok'|'loss'|'warn'|'info';
  hue?: 'emerald'|'indigo'|'amber'|'lime'|'rose'|'sky'|'violet'|'teal';   // overrides tone
  size?: 'xs' | 'sm'; variant?: 'pill' | 'tag'; dot?: boolean }
```

- `hue`: `border-th-<hue>/30 bg-th-<hue>-soft text-th-hi`, with a `th-<hue>` dot when `dot`. Text stays `hi`, so contrast holds in every theme. Used for trackers' store and category colors (16 stores on 8 hues).
- `size="xs"`: `px-1.5 text-3xs leading-4`.
- `variant="tag"`: `rounded-sm border-transparent font-semibold uppercase tracking-wide` (about 20 tag-shaped labels in trading).
- `dot`: a leading `StatusDot` (size xs) in the tone's `-fill`. It replaces status `Pill` (15 sites) and similar.

### Input and Select (extend)

```ts
interface InputProps { invalid?: boolean; size?: 'xs' | 'sm' | 'md'; leading?: ReactNode; trailing?: ReactNode }
interface SelectProps { invalid?: boolean; size?: 'xs' | 'sm' | 'md'; selectClassName?: string }
export function fieldClass(o?: { size?: ...; invalid?: boolean }): string;   // the FIELD recipe, exported
```

- Heights: md `h-9` (today), sm `h-8 text-base sm:text-xs`, xs `h-7 text-base sm:text-2xs`. Phones always get 16px, so iOS does not zoom.
- `leading` and `trailing`: Input renders a `relative inline-flex w-full` wrapper. Padding moves to `pl-8`/`pr-8`. The leading slot is `pointer-events-none text-th-hi3`; the trailing slot may be interactive (clear button, unit suffix). Used for `$` prefixes (trading, trackers) and search icons.
- `selectClassName` targets the inner `<select>`. Today `className` lands on the wrapper span and apps reach in with `[&>select]:…` (jobs, Nishboard).
- `fieldClass()` exists so an app's one-off control (such as a date input) never copies the private `FIELD` string again (jobs did).

### Textarea (new)

`Textarea({ invalid, size?: 'sm'|'md', autoGrow?: boolean | { maxRows: number }, ...textareaProps })`,
forwardRef. Same field look, `px-3 py-2 text-base sm:text-sm` (sm: `px-2.5 py-1.5 sm:text-xs`).
`autoGrow` resizes to content up to `maxRows`. Evidence: jobs 5, trackers 1, trading 1, Nishboard 1.

### Checkbox (new)

`Checkbox({ checked, onChange, indeterminate?, label?, hint?, trailing?, size?: 'sm'|'md', disabled })`.
It is a real `<input type="checkbox">` (`appearance-none size-4 rounded border border-th-line-strong bg-th-elevated`,
checked `bg-th-accent border-th-accent` with a check icon in `text-th-on-accent`; `indeterminate` is set through the ref and draws a dash).
`label` and `hint` render inside a `<label>` with `pointer-coarse:min-h-11`, so the whole row is the hit area. `trailing` is a right-aligned slot
(trackers' "from $212"). Evidence: jobs 5 (incl. select-all), trackers 8, trading 3, Nishboard 2 (one is a fake button).

### Switch (new)

`Switch({ checked, onChange, label?, description?, size?: 'sm'|'md', disabled, 'aria-labelledby'? })`:
a `<button role="switch" aria-checked>`. Track `h-5 w-9 rounded-full bg-th-line-strong`, on `bg-th-accent`. Knob
`size-4 rounded-full bg-th-surface shadow-card`, on `bg-th-on-accent`. No `dark:` variants. A visible label is
linked by `aria-labelledby` (Nishboard's 13 switches have no accessible name today). Evidence: Nishboard 13, trading 1.

### Field (new)

```ts
Field({ label, hint?, error?, optional?, htmlFor?, layout?: 'stack' | 'inline', labelWidth?: string, children })
```

- It renders a real `<label>`. When the single child has no `id`, Field injects one (useId) with cloneElement, together with
  `aria-describedby` (hint and error ids) and `invalid` / `aria-invalid` when `error` is set.
- Stack label: sentence case, `text-sm font-medium text-th-hi`. It is not the uppercase `Label`, which stays for section and card labels.
  Inline: label `text-xs text-th-hi3`, `labelWidth` default `7rem`, hint indented under the control.
- Error: `text-xs text-th-loss` with `role="alert"`. Hint: `text-xs text-th-hi3`. Optional: an "Optional" tag in `text-th-ghost`.
- Evidence: jobs ~30 labels in 4 styles, trackers 30, trading ~20, Nishboard ~20, status 1. Almost none tie hints and errors to the input today.

### SearchInput (new)

`SearchInput({ value, onChange, onClear?, size?, variant?: 'field' | 'bare', placeholder, 'aria-label', ...inputProps })`:
an Input with a leading search icon and a trailing clear IconButton (xs, label "Clear search") while it has a value. Escape clears.
`type="search"`, `enterKeyHint="search"`. `bare` drops the border and background for search bars inside headers.
Evidence: Nishboard 4, trading 3, trackers 1, the mc hub (static).

### Segmented (finish and extend the in-flight one)

```ts
Segmented<T extends string>({ label, options: { value: T; label: ReactNode; ariaLabel?: string; disabled?: boolean }[],
  value, onChange, size?: 'xs' | 'sm' | 'md', block?: boolean, className })
```

- Keep `role="radiogroup"` with `role="radio"` and `aria-checked`, roving tabindex, arrows, Home and End. It is for **single-choice value pickers**.
  Multi-select toggles are `ChipGroup` (below), not Segmented.
- `block`: full width, with equal flex children. `xs` for Nishboard (`h-6 px-2 text-2xs`). `disabled` options are skipped by the arrow keys.
- Touch: each segment gets `pointer-coarse:min-h-11 pointer-coarse:min-w-11`. status's local copy is 40px.
- The selected class keeps `text-th-accent`. trading's E2E specs assert `toHaveClass(/th-accent/)`; they must move from
  `getByRole('button')` to `getByRole('radio')`, which the trading work package covers.
- Evidence: trading 19 groups, Nishboard 9 implementations (~16 instances), trackers 4, jobs 4, status 2.

### Tabs (new)

```ts
Tabs({ value, onChange, items: { value: string; label: ReactNode; count?: number; sub?: ReactNode; disabled?: boolean }[],
  label: string, variant?: 'underline' | 'pill', size?: 'sm' | 'md', idBase?: string })
TabPanel({ value, children })                          // gets role="tabpanel", aria-labelledby; hidden when not selected
export function tabClass(o: { active: boolean; variant?: 'underline' | 'pill' }): string   // for nav links with aria-current
```

- This is the full ARIA tabs pattern: `role="tablist"`, `tab` with `aria-selected` and `aria-controls`, arrows, Home and End.
- Underline: active `text-th-hi` with a 2px `th-accent` bar; idle `text-th-hi3 hover:text-th-hi`.
  Pill: active `bg-th-elevated text-th-hi`. `count` renders as a `Badge size="xs"`. `sub` is a second line (trackers' "price · duration").
- Router navigation is not tabs: use `<NavLink className={tabClass({ active })} aria-current="page">`.
- Evidence: jobs 2 (no arrow keys), trackers 2 (incl. header nav), Nishboard 3, the docs site's own `Tabs`.

### Chip and ChipGroup (new)

```ts
Chip({ pressed?, onRemove?, removeLabel?, variant?: 'toggle' | 'suggestion' | 'tag', icon?, trailing?, size?: 'sm' | 'md', ...buttonProps })
ChipGroup({ label: string, children, scroll?: boolean, className })
```

- `toggle` is a `<button aria-pressed>`: `rounded-full border h-8 px-3 text-sm` (sm `h-7 px-2.5 text-xs`), with `pointer-coarse:min-h-11`.
  Pressed: `border-th-accent/60 bg-th-accent-soft text-th-accent`. Idle: `border-th-line-strong text-th-hi2 hover:bg-th-elevated`.
- `suggestion`: dashed border, `text-th-hi3`, leading "+". `tag`: a `<span>` with a trailing remove IconButton (xs, label from `removeLabel`).
- ChipGroup: `role="group"` with `aria-label`, `flex flex-wrap gap-2`. `scroll` makes it one horizontally scrolling row on phones.
- Multi-select filter groups use ChipGroup plus Chip. Evidence: jobs ~20, trackers 11, trading's multi-select scan filters, Nishboard 2.

### Callout (new)

```ts
Callout({ tone?: 'neutral'|'accent'|'info'|'ok'|'warn'|'loss', icon?: ReactNode | false, title?, children, action?,
  onDismiss?, variant?: 'box' | 'bar', compact?: boolean, live?: boolean })
```

- Box: `rounded-xl border px-4 py-3 text-sm`. Tones: `border-th-<t>/30 bg-th-<t>-soft`; neutral is `border-th-line bg-th-elevated`.
  The icon is `text-th-<t>`, the title `font-medium text-th-hi`, the body `text-th-hi2`.
- `bar`: full width, square corners, for a sticky page-level alert (trading's live alert banner).
- The default icon depends on the tone (info and accent: Info; ok: CheckCircle; warn and loss: AlertTriangle). `icon={false}` hides it.
- `onDismiss` adds an IconButton (xs, label "Dismiss"). `live` sets `role="alert"` for loss and `role="status"` for the others; without `live` there is no role.
- Evidence: trading ~12, jobs 6, trackers 11 notices plus 6 tinted boxes, Nishboard ~7, status 2, mc 207 `.note` (static).

### StatusDot (new)

`StatusDot({ tone: 'ok'|'warn'|'loss'|'info'|'accent'|'neutral', size?: 'xs'|'sm'|'md'|'lg', pulse?, halo?, label? })`.
Sizes are 6, 8, 10 and 14px. Fills: `bg-th-<t>-fill`; neutral `bg-th-ghost`, accent `bg-th-accent`. `pulse` animates the opacity
(respects reduced motion). `halo` draws `ring-4 ring-th-<t>-fill/25`. With `label` it renders a visually hidden text; without one it is `aria-hidden`
(always pair it with visible text then). Evidence: jobs 7 (header status is color-only today), status 2 plus Pill, Nishboard 5, the hub 9.

### Stat and StatGrid (new), plus signTone

```ts
Stat({ label, value, sub?, tone?: 'ok'|'loss'|'warn'|'neutral', tip?: ReactNode, size?: 'sm'|'md'|'lg',
  variant?: 'card' | 'inset' | 'plain', loading?: boolean })
StatGrid({ cols?: { base?: 1|2|3|4; md?: 2|3|4|5|6 }, children })
export function signTone(n: number | null | undefined): 'ok' | 'loss' | 'neutral'
```

- Label `text-xs text-th-hi3` (a dotted-underline Tooltip when `tip` is set). Value `font-semibold tabular-nums tracking-tight text-th-hi`,
  `[overflow-wrap:anywhere]`; sm `text-base`, md `text-xl`, lg `text-2xl`. `tone` colors the value. `sub` is `text-xs text-th-hi3`.
- card: `Card padding="sm"`. inset: `rounded-lg bg-th-elevated p-3`. plain: no box.
- StatGrid renders a `<dl>`, and Stat renders `<div><dt/><dd/></div>` inside it. A standalone Stat renders its own `<dl>`.
- `loading` shows Skeleton bars of the same size.
- Evidence: trading 6 local implementations (~40 uses) and 33 `n >= 0 ? gain : loss` ternaries; status 7; trackers 10; jobs 5; mc 94 pages (static).

### Meter (new), plus toneFor

```ts
Meter({ value, min?: 0, max?: 100, label: string, tone?: 'accent'|'ok'|'warn'|'loss'|'info'|`chart-${1|2|3|4|5|6|7|8}`,
  thresholds?: { warn: number; loss: number }, size?: 'xs'|'sm'|'md', orientation?: 'horizontal'|'vertical',
  track?: 'elevated'|'overlay', kind?: 'meter'|'progress', showValue?: boolean, className })
export function toneFor(value: number, t: { warn: number; loss: number }): 'ok' | 'warn' | 'loss'
```

- Track `rounded-full bg-th-elevated` (use `overlay` on elevated surfaces). Fill `bg-th-<tone>-fill`, or `bg-th-accent` / `bg-th-chart-n`, with a width transition.
- `role="meter"` (or `progressbar` for `kind="progress"`) with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-label`.
- `thresholds` picks the tone (ok, then warn, then loss) when `tone` is not given.
- Evidence: Nishboard 6 implementations (~12), status 1, jobs 2, trading 2, mc 13 (static).

### Spinner (new)

`Spinner({ size?: 'xs'|'sm'|'md'|'lg', label?: string, className })`: the existing `LoaderIcon` with `animate-spin` in `currentColor`.
With `label` it is `role="status"` and has a visually hidden label. Evidence: jobs 5 hand-rolled border spinners, trackers 1.

### Modal (fix and extend)

```ts
interface ModalProps { title: ReactNode; onClose; children; footer?; className?;
  size?: 'md' | 'lg' | 'xl' | '2xl' | 'full';     // 2xl: sm:max-w-6xl; full: sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)]
  subtitle?: ReactNode;                             // text-xs text-th-hi3 under the title
  wrapTitle?: boolean;                              // title wraps (break-words) instead of truncating
  placement?: 'center' | 'top';                     // top: sm:items-start sm:pt-[12vh] (command palettes, search)
  header?: ReactNode;                               // replaces the title row; then 'aria-label' is required
  hideClose?: boolean; 'aria-label'?: string }
```

- **Fix: lock scroll on both `<html>` and `<body>`** (save and restore both inline overflow values). jobs scrolls `<html>`, and its list scrolls under the
  sheet today (it carries a local `useLockRootScroll` for this).
- Fix (in flight): close button 44px on touch.
- Extract the dialog internals (stack membership, focus in, Tab trap, Escape, focus return, scroll lock) into one internal hook
  shared by Modal, Drawer and ConfirmDialog. Only the top dialog in the stack answers keys.
- Evidence: jobs (html lock, long titles), trackers (long product titles, 1100px compare panel), Nishboard (palette and search dialogs: `placement="top"` plus `header`).

### Drawer (new)

```ts
Drawer({ title, subtitle?, onClose, side?: 'right' | 'left' | 'bottom', size?: 'sm' | 'md' | 'lg',
  actions?: ReactNode, footer?: ReactNode, bottomOffset?: string, 'aria-label'?, children, className })
```

- It uses the same dialog hook as Modal (stack, trap, Escape, focus return, html and body lock) and is `role="dialog" aria-modal="true"`.
- Right and left: `inset-y-0 w-full` with `max-w-sm` (sm), `max-w-md` (md) or `max-w-2xl` (lg), full width under 640px, `nish-safe-area`, a slide-in animation.
  Bottom: a sheet like Modal's phone layout; `bottomOffset` lifts it above an app's bottom tab bar.
- Scrim `bg-th-scrim/50`; panel `bg-th-surface border-th-line shadow-modal`. Header: title, subtitle, `actions` slot and a close IconButton. `footer` is pinned to the bottom.
- Evidence: trading 3 (notifications, assistant, phone "More" sheet; none trap focus or lock scroll), trackers 6 side drawers.

### ConfirmDialog (new)

`ConfirmDialog({ title, body?, confirmLabel, cancelLabel?: 'Cancel', tone?: 'danger' | 'primary', pending?: boolean, onConfirm, onCancel })`:
a Modal (md) with a footer holding Cancel (secondary) and the confirm button (`danger` or `primary`, `loading={pending}`).
For `danger`, focus starts on Cancel. Evidence: Nishboard 4, trading 3, jobs 2 (`window.confirm`), trackers 3 two-step removes.

### Toast (extend)

```ts
toast(title: string, bodyOrOptions?: string | ToastOptions): number     // same for toast.success / error / warn / info
interface ToastOptions { body?: string; action?: { label: string; onClick: () => void }; duration?: number | 'sticky'; id?: string }
Toaster({ className?, offset?: string })   // offset: bottom distance on phones, e.g. 'calc(4.5rem + env(safe-area-inset-bottom))'
```

- `action` renders a text button (`text-th-accent font-medium`, 44px on touch). Clicking it runs `onClick` and then dismisses.
- `id` replaces the existing toast with that id instead of stacking. This is jobs' one-slot Undo, so a stale Undo cannot revert a newer change.
- Timers pause while the toast is hovered or holds focus. Errors stay sticky (unchanged). `(title, body)` calls keep working.
- Evidence: jobs (Undo, "Mark as applied", bulk results), the hub (warning with a link), trading.

### Tooltip (extend)

`side?: 'top' | 'bottom' | 'left' | 'right'` (trading's collapsed sidebar needs `right`); `focusable?: boolean` (default `true`;
set `false` for dense marks such as 60 chart bars, where the value must also be reachable another way); `variant?: 'default' | 'hint'`
(`hint` gives the trigger `underline decoration-dotted decoration-th-hi3 underline-offset-2 cursor-help`; trading has 34 such triggers).

### ThemeToggle (extend)

`ThemeToggle({ presets?, labels?: boolean, block?: boolean, size?: 'sm' | 'md', compact?: boolean })`. It is built on `Segmented`.
`labels` shows "System", "Light" and "Dark" text (Nishboard's local switch exists only for that). `block` is full width. `compact` renders one
IconButton that cycles system, light, dark, shows the current icon and is labelled "Theme: X. Switch to Y" (trading's collapsed sidebar).

---

## Tier 2

| Component | API | Evidence |
|---|---|---|
| **Popover** | `Popover({ open, onOpenChange, anchor: RefObject<HTMLElement>, side?: 'top'\|'bottom', align?: 'start'\|'center'\|'end', width?, className, children })`: portal, position shared with Tooltip (extract `useAnchoredPosition`), flip and clamp, Escape and outside click close, focus returns to the anchor. Panel `rounded-lg border border-th-line bg-th-elevated shadow-pop`, `z-index: var(--nish-z-dropdown)`. `className` goes on the panel (Electron apps add `app-region-no-drag`). | Nishboard 2 popovers plus a slash menu |
| **DropdownMenu** | `DropdownMenu({ trigger: ReactElement, align?, side?, children })`, `MenuItem({ icon?, trailing?, danger?, active?, disabled?, onSelect })`, `MenuLabel`, `MenuSeparator`, `MenuSubHeader({ onBack, children })`. `role="menu"`/`menuitem`, arrows, Home and End, Escape, `aria-haspopup` and `aria-expanded` on the trigger, focus return. Row: `flex w-full items-center gap-2 px-3 py-1.5 text-xs`, active `bg-th-overlay text-th-hi`. | Nishboard 4 menus, none with Escape or roles |
| **Table primitives** | `TableWrap({ minWidth?, maxHeight?, stickyHeader?, className })` (scroll box `overflow-auto rounded-xl border border-th-line bg-th-surface`), `Table({ dense?, zebra? })` (`w-full text-sm tabular-nums`), `Th({ align?, numeric?, sort?: 'asc'\|'desc'\|false, onSort? })` (`text-xs font-medium uppercase tracking-wider text-th-hi3`, sort button with `aria-sort`), `Td({ align?, numeric? })`, `Tr({ tone?: 'ok'\|'warn'\|'loss', interactive?, muted? })` (tone draws an inset 3px `-fill` edge). Also `tableClass` strings for TanStack renderers. No TanStack dependency. | trading 14 tables in 3 header styles, jobs 1, status 3, trackers 2 (shared TanStack wrapper), mc 535 (static) |
| **Disclosure** | `Disclosure({ summary, children, defaultOpen?, open?, onOpenChange?, variant?: 'plain'\|'card' })` on `<details>`/`<summary>` with a rotating chevron. | trading 6, trackers 5, Nishboard 3, jobs 2, mc ~520 (static) |
| **Sparkline** | `Sparkline({ values: (number\|null)[], label, tone?: 'chart-1'…\|'accent'\|'ok'…, width?, height?: 28, fill?: boolean, min?, max?, className })`: SVG with no dependency, breaks at nulls, `vector-effect: non-scaling-stroke`, `role="img"`, an empty state. | status and trackers (same code), Nishboard 4 (via Recharts) |
| **`@nish/ui/chart`** | `seriesColor(i)` → `var(--nish-chart-${i % 8 + 1})`; `CHART = { grid, axis, zero, text }` as `var()` strings; `tooltipStyle` (bg elevated, border line-strong, `var(--nish-radius-sm)`, `var(--nish-shadow-pop)`, hi text, 12px); `chartTheme()` → resolved hex via `readToken` for canvas libraries (uPlot); `useChartTheme()` re-renders on theme change. No chart-library dependency. | trading `lib/chart`, Nishboard `tk()`, status and trackers uPlot wrappers |
| **PageHeader** | `PageHeader({ title, description?, eyebrow?, back?: ReactNode, actions?, as?: 'h1'\|'h2', sticky?: boolean })`. Title `text-2xl font-semibold tracking-tight text-th-hi`, description `text-sm text-th-hi2`. `back` takes the app's own `<Link className={buttonClass({ variant: 'link' })}>`. | jobs 7 plus 5 back links, trading 6 (sticky), trackers 3 |
| **AppHeader** | `AppHeader({ name, icon?, hubHref?: 'https://nish.software', actions?, nav?, themeToggle?: ReactNode \| false, sticky?: true })`: the "← nish.software" pill (hidden under 480px, 44px), wordmark (icon in accent, `text-xl font-bold tracking-tight`), right slot with actions and ThemeToggle, an optional `nav` row (links with `tabClass`). Glass: `bg-th-bg/85 backdrop-blur border-b border-th-line`, safe-area top. | status and trackers share the same header markup; jobs and the hub are close |
| **CopyButton** and **copyText** | `copyText(text): Promise<boolean>` (Clipboard API with a textarea fallback); `CopyButton({ text, label?: 'Copy', copiedLabel?: 'Copied', iconOnly?, size?, variant? })`: shows the copied state for 1.5s and announces it through a polite live region. | mc 13 (static), Nishboard 2, jobs 1, trading 1 |
| **Kbd** | `Kbd({ children })`: `rounded border border-th-line-strong bg-th-elevated px-1.5 font-mono text-2xs text-th-hi2`. | Nishboard palette, jobs legend, mc |
| **`.nish-prose`** | Markdown and rich text styles in base.css (headings, lists, code, tables, task lists, links) on roles and radius tokens. | Nishboard `.md-render`, jobs `.jd`, trading chat markdown |

## Tier 3 (stay local; listed to avoid duplicates)

RadioGroup with dot radios (trackers 1), Slider (Nishboard 5), TagInput (jobs 3), Avatar (jobs 3, Nishboard 2),
ConfirmButton (trackers' two-step remove; prefer ConfirmDialog), Timeline (trackers 2), CommandDialog (Nishboard; becomes
Modal `placement="top"` + `header`), Dropzone, BottomNav/AppShell, `deriveTheme(base)` for apps with custom themes (Nishboard,
trading), an `on-<hue>` role. Revisit when a second app needs one.

---

## Static component classes: `nish-components.css`

Static sites (mc, trips, trip gates, the hub, ui's own static example) cannot use React. They hand-roll the same button, card, badge,
field, callout, stat, table and meter today. mc copies a 22-line calculator block onto 54 pages, and trips and mc carry the same theme toggle.
Ship one opt-in stylesheet:

- Source `src/css/components.css`, copied to `dist/nish-components.css`, exported as `@nish/ui/nish-components.css`, and **listed in
  `dist/files.json` "static"** so hosting's `sync-ui.mjs` vendors it.
- Every selector is wrapped in `:where()` (zero specificity), so a site's own CSS always wins. Classes are opt-in, so nothing changes until a page uses them.
- Recipes mirror the React components (same sizes, roles and touch rule as `@media (pointer: coarse)`). Docs page: a side-by-side
  "React vs static" story for each class, and the static example rebuilt on these classes.

| Class | Mirrors | Variants |
|---|---|---|
| `.nish-btn` | Button | `--primary` `--secondary` (default) `--ghost` `--danger` `--soft` `--subtle` `--link`; `--xs` `--sm` `--lg`; `[aria-pressed=true]`; `:disabled`; works on `<a>` |
| `.nish-icon-btn` | IconButton | `--sm` `--xs` `--round` |
| `.nish-card` | Card | `--padded` `--interactive` `--inset` |
| `.nish-badge` | Badge | `--neutral` `--accent` `--ok` `--loss` `--warn` `--info` `--solid` `--tag` `--xs` |
| `.nish-input` `.nish-select` `.nish-textarea` | Input, Select, Textarea | `[aria-invalid=true]`; 16px and 44px under `pointer: coarse` |
| `.nish-label`, `.nish-field` (`.nish-hint`, `.nish-error`) | Label, Field | |
| `.nish-seg` | Segmented | `--joined` `--pills`; children `button[aria-pressed]` or `[role=radio][aria-checked]` |
| `.nish-chip` | Chip | `[aria-pressed=true]`, `--suggestion` |
| `.nish-callout` | Callout | `--info` `--ok` `--warn` `--loss` `--accent`; icon square uses `-fill` plus `on-*` |
| `.nish-stats` > `.nish-stat` (`.nish-stat-value`, `.nish-stat-label`) | StatGrid, Stat | `--tinted` `--sm` |
| `.nish-table-wrap` | TableWrap | `--sticky`; zebra rows; `.num` right-aligned |
| `.nish-meter` > `i` | Meter | `--sm` `--lg`; `--ok` `--warn` `--loss` `--info` |
| `.nish-disclosure` | Disclosure | `--card` |
| `.nish-empty`, `.nish-error-state` | EmptyState, ErrorState | |
| `.nish-pill-link` | AppHeader hub link | `--on-dark` (for dark bands) |
| `.nish-theme-btn` | the button `mountThemeToggle` fills | icon swap through `[data-choice]` |

---

## Build order inside this repo

To let several people (or agents) work in parallel without editing the same file:

1. **Docs split (first, alone):** move each `ComponentDoc` out of `site/components.tsx` into `site/components/<id>.tsx`, with an
   index that builds `COMPONENT_DOCS`. Behavior is unchanged; run `npm run build:site` and the visual check. After this, each new component adds its own file.
2. **In parallel, by file ownership:**
   - *Foundation:* `src/tokens.mjs`, `scripts/build.mjs`, `src/css/base.css`, `src/cn.ts`, `src/theme.ts`, `src/theme-init.js`, `src/theme-global.ts`, `tools/contrast-rules.mjs`, `package.json` exports, `tsup.config.ts`, `scripts/bump-consumers.sh`.
   - *Primitives:* `src/components/primitives.tsx` (Button, IconButton, Card, CardHeader, Badge, Input, Select, Label, the `*Class()` exports).
   - *Forms:* new `src/components/forms.tsx` (Textarea, Checkbox, Switch, Field, SearchInput, Chip, ChipGroup), `segmented.tsx`, new `tabs.tsx`, `theme-toggle.tsx`.
   - *Overlay:* `src/components/overlay.tsx` (dialog hook, Modal, Drawer, ConfirmDialog, Tooltip, Popover, DropdownMenu).
   - *Display:* `toast.tsx`, `feedback.tsx` (Spinner), new `display.tsx` (Callout, StatusDot, Stat, StatGrid, signTone, Meter, toneFor, Sparkline, Disclosure, Kbd, CopyButton, copyText, PageHeader, AppHeader), new `table.tsx`, new `src/chart.ts`.
   - *Static:* `src/css/components.css`, its build step, `site/static-example/*`, `site/pages/static-sites.tsx`.
   Each lane writes its own docs pages (`site/components/<id>.tsx`) and lists the new exports and visual-config entries it needs.
3. **Integration (alone):** `src/index.ts` exports, docs registration, `tools/site-all.visual.json` and `tools/site.visual.json`, `CHANGELOG.md`,
   the README component table, the docs site moved onto its own shared pieces (the site's local `Tabs` and `Pill` become `Tabs` and `Badge`),
   then `npm run check`, `npm run build:site`, the visual check in every theme, and `npm run release minor`.

## Acceptance for the release

- `npm run check` passes: typecheck, contrast for every theme including the new hue-soft and on-* pairs, build, testInit cases for the meta theme-color.
- The visual check passes on `tools/site-all.visual.json` in every theme (desktop and phone), with no axe contrast, tap-target, focus-ring or overflow failures.
- Every new prop has JSDoc. Every component has a docs page with stories, guidance and a props table.
- `dist/files.json` lists `nish-components.css`. `@nish/ui/tokens` imports in plain Node without React installed.
- `cn('text-th-hi', 'text-2xs')` keeps both classes (add a build-time assertion).
- CHANGELOG: one entry per addition, with **Behavior changes** called out: Modal locks `<html>` as well; the Tailwind base now sets the default border color and pointer cursor; theme-init sets the meta theme-color.
