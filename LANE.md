# Lane: display (WP-UI step 1, B1)

Branch `ds/v0.3-display`, from `origin/ds/v0.3` (docs split). Files owned and changed:
`src/components/toast.tsx`, `src/components/feedback.tsx`, new `src/components/display.tsx`,
new `src/components/table.tsx`, new `src/chart.ts`, and docs pages
`site/components/{spinner,callout,status-dot,stat,meter,sparkline,disclosure,kbd,copy-button,page-header,app-header,table,chart,toast}.tsx`.

Every Tier 1 and Tier 2 item of the lane is built. Nothing deferred.

The docs pages import from `../../src/components/display`, `../../src/components/table`,
`../../src/components/feedback` and `../../src/chart` directly, so this branch typechecks before the
exports exist. After integration they may switch to `../../src` (optional).

## 1. `src/index.ts` (append)

```ts
export { Spinner } from './components/feedback';
export type { SpinnerProps } from './components/feedback';
export type { ToastOptions, ToastAction, ToasterProps } from './components/toast';
export { Callout, StatusDot, Stat, StatGrid, signTone, Meter, toneFor, Sparkline, Disclosure, Kbd, CopyButton, copyText, PageHeader, AppHeader } from './components/display';
export type { CalloutProps, CalloutTone, StatusDotProps, StatusTone, StatProps, StatGridProps, MeterProps, MeterTone, SparklineProps, SparklineTone, DisclosureProps, CopyButtonProps, PageHeaderProps, AppHeaderProps } from './components/display';
export { TableWrap, Table, Th, Td, Tr, tableClass } from './components/table';
export type { TableWrapProps, TableProps, ThProps, TdProps, TrProps } from './components/table';
```

(`Spinner` may instead join the existing `feedback` export line.)

## 2. `@nish/ui/chart` entry (foundation-owned files)

`src/chart.ts` is its own entry, not re-exported from `src/index.ts`:

- `tsup.config.ts`, first config: `entry: { index: 'src/index.ts', theme: 'src/theme.ts', chart: 'src/chart.ts' }`.
  `chart.ts` imports `./theme` and React; with `splitting: false` it bundles its own copy of the theme
  helpers. That is safe: `useChartTheme` also watches `<html>`'s `data-theme` with a MutationObserver,
  so it updates even when the app's `applyTheme()` runs in another copy of the module.
- `package.json` exports: `"./chart": { "types": "./dist/chart.d.ts", "import": "./dist/chart.js" }`.

## 3. Docs registration (not lane-owned files)

Tested locally with exactly these changes (then reverted on this branch):

`site/components/index.ts`: imports and `COMPONENT_DOCS` entries, after `themeToggle`:

```ts
import { spinner } from './spinner';
import { callout } from './callout';
import { statusDot } from './status-dot';
import { stat } from './stat';
import { meter } from './meter';
import { sparkline } from './sparkline';
import { disclosure } from './disclosure';
import { kbd } from './kbd';
import { copyButton } from './copy-button';
import { pageHeader } from './page-header';
import { appHeader } from './app-header';
import { table } from './table';
import { chartDoc } from './chart';
// COMPONENT_DOCS += spinner, callout, statusDot, stat, meter, sparkline, disclosure, kbd,
//                   copyButton, pageHeader, appHeader, table, chartDoc
```

`site/docgen.mjs`:

```js
// COMPONENTS +=
'Spinner', 'Callout', 'StatusDot', 'Stat', 'StatGrid', 'Meter', 'Sparkline', 'Disclosure', 'Kbd',
'CopyButton', 'PageHeader', 'AppHeader', 'TableWrap', 'Table', 'Th', 'Td', 'Tr',
// FUNCTIONS +=
'signTone', 'toneFor', 'copyText', 'seriesColor', 'chartTheme', 'useChartTheme',
// INTERFACES +=
'ToastOptions', 'ChartTheme',
```

and read the chart entry as well as the main one:

```js
const entries = [join(root, 'src/index.ts'), join(root, 'src/chart.ts')];
const program = ts.createProgram(entries, { /* unchanged options */ });
const checker = program.getTypeChecker();
const exported = new Map(
  entries.flatMap((entry) =>
    checker
      .getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)))
      .map((s) => [s.name, s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s]),
  ),
);
```

`site/pages/component.tsx`: the Chart colors page has `exports: []` (functions only), so the source
link must tolerate no component:

```tsx
const gen = doc.exports.length ? docgen.components[doc.exports[0]] : undefined;
// …and wrap the `<a href={`${REPO}/blob/master/${gen.file}`}>…</a>` source link in `{gen ? (…) : null}`.
```

## 4. Visual configs

`tools/site-all.visual.json`, append (port 5191 like the rest):

```json
{ "name": "spinner", "url": "http://localhost:5191/#/components/spinner", "waitFor": "[data-page]" },
{ "name": "callout", "url": "http://localhost:5191/#/components/callout", "waitFor": "[data-page]" },
{ "name": "status-dot", "url": "http://localhost:5191/#/components/status-dot", "waitFor": "[data-page]" },
{ "name": "stat", "url": "http://localhost:5191/#/components/stat", "waitFor": "[data-page]" },
{ "name": "meter", "url": "http://localhost:5191/#/components/meter", "waitFor": "[data-page]" },
{ "name": "sparkline", "url": "http://localhost:5191/#/components/sparkline", "waitFor": "[data-page]" },
{ "name": "disclosure", "url": "http://localhost:5191/#/components/disclosure", "waitFor": "[data-page]" },
{ "name": "kbd", "url": "http://localhost:5191/#/components/kbd", "waitFor": "[data-page]" },
{ "name": "copy-button", "url": "http://localhost:5191/#/components/copy-button", "waitFor": "[data-page]" },
{ "name": "page-header", "url": "http://localhost:5191/#/components/page-header", "waitFor": "[data-page]" },
{ "name": "app-header", "url": "http://localhost:5191/#/components/app-header", "waitFor": "[data-page]" },
{ "name": "table", "url": "http://localhost:5191/#/components/table", "waitFor": "[data-page]" },
{ "name": "chart", "url": "http://localhost:5191/#/components/chart", "waitFor": "[data-page]" },
{ "name": "stat-themes", "url": "http://localhost:5191/#/components/stat/themes", "waitFor": "[data-page]", "viewports": ["desktop"] },
{ "name": "callout-themes", "url": "http://localhost:5191/#/components/callout/themes", "waitFor": "[data-page]", "viewports": ["desktop"] },
{ "name": "table-themes", "url": "http://localhost:5191/#/components/table/themes", "waitFor": "[data-page]", "viewports": ["desktop"] }
```

(The toast page entry already exists; its stories now use `duration: 'sticky'` instead of stubbing
`setTimeout`, so no settle change is needed.)

`tools/site.visual.json`, append one representative page:

```json
{ "name": "stat", "url": "http://localhost:5191/#/components/stat", "waitFor": "[data-page]" },
{ "name": "table-themes", "url": "http://localhost:5191/#/components/table/themes", "waitFor": "[data-page]", "viewports": ["desktop"] }
```

## 5. CHANGELOG lines (one per addition)

- `Spinner({ size, label })`: the shared loader in `currentColor`; with `label` it is `role="status"`.
- Toasts take options: `toast(title, { body, action, duration, id })`. `action` renders a text button that runs and dismisses; `id` replaces the toast in that slot instead of stacking; `duration` is milliseconds or `'sticky'`. `(title, body)` calls keep working.
- `Toaster({ offset })`: the stack's bottom distance on phones (clear a bottom tab bar).
- `Callout({ tone, icon, title, action, onDismiss, variant: 'box' | 'bar', compact, live })`: inline notices.
- `StatusDot({ tone, size, pulse, halo, label })`: status marks on the `-fill` roles.
- `Stat({ label, value, sub, tone, tip, size, variant, loading })` and `StatGrid({ cols })`: labelled numbers as `<dl>`.
- `signTone(n)`: ok / loss / neutral for a signed number.
- `Meter({ value, min, max, label, tone, thresholds, size, orientation, track, kind, showValue })`: `role="meter"` or `progressbar`.
- `toneFor(value, { warn, loss })`: ok / warn / loss, for higher-is-worse and lower-is-worse thresholds.
- `Sparkline({ values, label, tone, width, height, fill, min, max })`: dependency-free SVG trend, gaps at nulls.
- `Disclosure({ summary, defaultOpen, open, onOpenChange, variant })`: `<details>` with a turning chevron.
- `Kbd`: a keyboard key.
- `copyText(text)` and `CopyButton({ text, label, copiedLabel, iconOnly, size, variant, onCopy })`.
- `PageHeader({ title, description, eyebrow, back, actions, as, sticky })`.
- `AppHeader({ name, icon, hubHref, actions, nav, themeToggle, sticky, innerClassName })`: hub pill, wordmark, actions, ThemeToggle, nav row.
- Table primitives `TableWrap`, `Table`, `Th` (sort with `aria-sort`), `Td`, `Tr` (tone edge, interactive, muted), and `tableClass` strings for TanStack.
- `@nish/ui/chart`: `seriesColor(i)`, `CHART`, `tooltipStyle`, `chartTheme()`, `useChartTheme()`.

**Behavior changes**

- Toast timers pause while a toast is hovered with a mouse or holds focus, and resume (at least 1s) after.
- A toast evicted by the four-toast limit now has its timer cleared.

## 6. README component-table rows

| Component | What it is |
|---|---|
| `Spinner` | Loader in the current text color; labelled = `role="status"` |
| `Callout` | Inline tinted notice: tone, icon, title, action, dismiss, box or bar |
| `StatusDot` | Round status mark on the `-fill` roles, optional pulse and halo |
| `Stat`, `StatGrid`, `signTone` | Labelled numbers in a `<dl>` grid; tone from a signed number |
| `Meter`, `toneFor` | Thin meter or progress bar with threshold tones |
| `Sparkline` | Dependency-free SVG trend line |
| `Disclosure` | `<details>` show-more, plain or card |
| `Kbd` | Keyboard key |
| `CopyButton`, `copyText` | Copy to clipboard with a "Copied" state and live announcement |
| `PageHeader` | Page title block with back link, eyebrow, description, actions |
| `AppHeader` | Shared app header: hub pill, wordmark, actions, theme toggle, nav row |
| `TableWrap`, `Table`, `Th`, `Td`, `Tr`, `tableClass` | Table primitives and class recipes |
| `@nish/ui/chart` | `seriesColor`, `CHART`, `tooltipStyle`, `chartTheme`, `useChartTheme` |

## 7. Needed from other lanes (swap at integration)

- **Foundation:** `text-2xs` (used by `Kbd`) and the tailwind-merge `text` group in `cn.ts`, or `cn()`
  may drop `text-th-hi2` next to `text-2xs`. `.scrollbar-none` in base.css (used by `AppHeader`'s nav row).
- **Primitives:** `IconButton size="xs"` (Callout's dismiss uses `size="sm" className="size-6 rounded-md"`
  today); `Card padding="sm"` (Stat's card variant uses `padded={false} className="p-3"` today);
  `Button`/`IconButton` `xs` sizes could widen `CopyButton`'s `size` (it is `'sm' | 'md'` now, and its
  `variant` already follows `ButtonProps['variant']`). The PageHeader docs mimic
  `buttonClass({ variant: 'link' })` with a local class string; swap to `buttonClass` once it exists.
- **Forms:** the AppHeader docs mimic `tabClass({ active })` with a local string; swap once it exists.
- **Overlay:** Stat's `tip` hand-applies the hint classes on Tooltip; switch to `Tooltip variant="hint"`.
- **Icons:** `display.tsx` carries its own `CopyIcon`, `CheckIcon` and `ChevronRightIcon` to avoid
  editing the shared `icons.tsx`; the integrator may move them there.
- **Tool note:** `tools/visual-check.mjs`'s clipped-text check flags `.sr-only` text (1px box, overflow
  hidden). This lane avoids `sr-only` (Spinner and StatusDot name an `role="img"`), except CopyButton's
  live region, which only holds text for 1.5s after a click. Other lanes using `sr-only` will hit it;
  the check should skip elements whose box is 1px or that match `.sr-only`.

## 8. Checks run on this branch

`npm install`, `npm run typecheck`, `npm run build`, `npm run contrast` (784 pairs, 7 themes): all pass.
With the section 1 and 3 changes applied locally, `npm run build:site` passes and the visual check on
the lane's 14 pages (docs + all-themes views, desktop and phone, dark and light; 84 shots) reports 0 problems.
