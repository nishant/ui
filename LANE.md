# Lane: forms (ds/v0.3-forms)

Owns `src/components/forms.tsx` (new), `src/components/segmented.tsx`, `src/components/tabs.tsx` (new),
`src/components/theme-toggle.tsx`, and the docs pages `site/components/{textarea,checkbox,segmented,theme-toggle,switch,field,search-input,chip,tabs}.tsx`.
Delete this file when the integrator has applied it.

Verified locally with every registration below applied (not committed): `npm run typecheck`, `npm run build`, `npm run contrast`,
`vite build --config site/vite.config.ts` and the visual check on all nine lane pages plus their `/themes` views
(desktop and phone, dark and light): 54 shots, 0 problems.

## 1. `src/index.ts`

Textarea and Checkbox now live in `forms.tsx`. Remove them from the primitives export lines, then add:

```ts
export { Textarea, Checkbox, Switch, Field, SearchInput, Chip, ChipGroup } from './components/forms';
export type { TextareaProps, CheckboxProps, SwitchProps, FieldProps, SearchInputProps, ChipProps, ChipGroupProps } from './components/forms';
export { Tabs, TabPanel, tabClass } from './components/tabs';
export type { TabsProps, TabPanelProps, TabItem } from './components/tabs';
```

(`Segmented`, `SegmentedProps`, `SegmentedOption`, `ThemeToggle`, `ThemeToggleProps`, `useTheme`, `ThemeState` keep their existing lines.)

## 2. Needed from files this lane does not own

- **`src/components/primitives.tsx` (primitives lane):** delete the old `Textarea`/`TextareaProps` and `Checkbox`/`CheckboxProps`
  blocks (and the now-unused `TextareaHTMLAttributes` import). The forms versions replace them and keep every v0.2.4 prop.
- **`forms.tsx` local `FIELD` string:** a copy of primitives' private FIELD so this branch builds alone. After merging primitives, replace it
  with the shared recipe: `import { FIELD } from './primitives'` (primitives exports it for in-package use), or `fieldClass({ size })`.
- **SearchInput** uses today's `Input` with size and padding via `className`, and `IconButton size="sm"` shrunk to 24px with `size-6`. After merging
  primitives, switch to `Input size={size} leading={<SearchIcon/>} trailing={…}` and `IconButton size="xs"`, and drop the hand padding. Same for
  Chip's tag remove button (`IconButton size="xs"`).
- **Tabs `count`** renders `<Badge className="px-1.5 leading-4">`; switch to `<Badge size="xs">` once primitives lands.
- **`text-2xs` (Segmented `xs`, SearchInput `xs`) and `scrollbar-none` (Tabs, ChipGroup `scroll`)** come from the foundation lane. Size classes are
  placed before color classes, so even before the `cn.ts` fix tailwind-merge keeps the color.
- **`src/components/icons.tsx`:** forms.tsx carries four private icons (Search, Plus, Check, Minus). Optionally move them into icons.tsx.
- **`site/docgen.mjs`:** add `'Switch', 'Field', 'SearchInput', 'Chip', 'ChipGroup', 'Tabs', 'TabPanel'` to `COMPONENTS` (after `'ThemeToggle'`);
  add `'tabClass'` to `FUNCTIONS`; add `'TabItem'` to `INTERFACES`.
- **Static twins (`src/css/components.css`, static lane):** `.nish-seg` (Segmented), `.nish-chip` (Chip, `[aria-pressed=true]`, `--suggestion`),
  `.nish-field` / `.nish-hint` / `.nish-error` (Field), `.nish-textarea` (Textarea) are the static lane's per COMPONENTS.md. Recipes to mirror:
  - `.nish-chip`: pill, 1px `--nish-line-strong` border, `--nish-hi2` text, 32px tall, 0 12px padding, 14px/500; pressed: border
    `color-mix(in srgb, var(--nish-accent) 60%, transparent)`, `--nish-accent-soft` background, `--nish-accent` text; `--suggestion`: dashed border, `--nish-hi3`.
  - `.nish-seg`: `--nish-elevated` box, 1px `--nish-line` border, 8px radius, 2px padding; selected child: `--nish-accent-soft` fill, `--nish-accent` text,
    1px inset ring at 40% accent; children 28px tall, 12px/500.
  - `.nish-field`: grid, 6px gap; label 14px/500 `--nish-hi`; `.nish-hint` 12px `--nish-hi3`; `.nish-error` 12px `--nish-loss`.

## 3. Docs registration (`site/components/index.ts`)

```ts
import { switchDoc } from './switch';
import { field } from './field';
import { searchInput } from './search-input';
import { chip } from './chip';
import { tabs } from './tabs';
```

Add to `COMPONENT_DOCS` after `themeToggle`: `switchDoc, field, searchInput, chip, tabs`. (Suggested grouping: put `field`, `switchDoc`, `searchInput`
after `checkbox`, and `chip`, `tabs` after `segmented`.)

The docs pages import new names from `'../../src/components/forms'` and `'../../src/components/tabs'`; once index exports them, switch those imports to `'../../src'`.

## 4. Visual configs

`tools/site-all.visual.json`, with the other component pages:

```json
{ "name": "switch", "url": "http://localhost:5191/#/components/switch", "waitFor": "[data-page]" },
{ "name": "field", "url": "http://localhost:5191/#/components/field", "waitFor": "[data-page]" },
{ "name": "search-input", "url": "http://localhost:5191/#/components/search-input", "waitFor": "[data-page]" },
{ "name": "chip", "url": "http://localhost:5191/#/components/chip", "waitFor": "[data-page]" },
{ "name": "tabs", "url": "http://localhost:5191/#/components/tabs", "waitFor": "[data-page]" },
```

and with the `-themes` entries:

```json
{ "name": "switch-themes", "url": "http://localhost:5191/#/components/switch/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "field-themes", "url": "http://localhost:5191/#/components/field/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "search-input-themes", "url": "http://localhost:5191/#/components/search-input/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "chip-themes", "url": "http://localhost:5191/#/components/chip/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "tabs-themes", "url": "http://localhost:5191/#/components/tabs/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "textarea-themes", "url": "http://localhost:5191/#/components/textarea/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 },
{ "name": "checkbox-themes", "url": "http://localhost:5191/#/components/checkbox/themes", "waitFor": "[data-page]", "viewports": ["desktop"], "settle": 1200 }
```

(Skip any `-themes` entry the file already has.)

`tools/site.visual.json`: add `{ "name": "field", "url": "http://localhost:5191/#/components/field", "waitFor": "[data-page]" }` and
`{ "name": "tabs", "url": "http://localhost:5191/#/components/tabs", "waitFor": "[data-page]" }`.

## 5. CHANGELOG (one line per addition)

- Textarea: `size` (`sm` | `md`) and `autoGrow` (`true` or `{ maxRows }`); `rows` stays the minimum height.
- Checkbox: `indeterminate`, `trailing` slot, `size` (`sm` | `md`); `label` is optional when the box has an `aria-label`.
- Switch (new): `<button role="switch" aria-checked>` with `label`, `description`, `size`, `labelSide`; the label is tied by `aria-labelledby`.
- Field (new): label, one control, hint and error, wired with `id`, `aria-describedby` and `invalid`/`aria-invalid`; `optional`, `layout="inline"`, `labelWidth`.
- SearchInput (new): leading search icon, Clear button, Escape clears, `size` (`xs` | `sm` | `md`), `variant="bare"`; `onChange` receives the string.
- Chip (new): `toggle` (`aria-pressed`), `suggestion` and removable `tag` variants, `icon`, `trailing`, `size`.
- ChipGroup (new): a labelled `role="group"` of Chips that wraps, or scrolls sideways on phones with `scroll`.
- Segmented: `size="xs"`, `block`, per-option `disabled` (skipped by the arrow keys) and `title`, Home and End keys.
- Tabs and TabPanel (new): the ARIA tabs pattern with `underline` and `pill` variants, `size`, `count`, `sub`, disabled tabs, arrow keys, Home and End.
- `tabClass({ active, variant, size, className })`: the tab look for router links (`aria-current="page"`).
- ThemeToggle: built on Segmented; `labels`, `block`, `size` (`sm` | `md`) and `compact` (one button that cycles System, Light, Dark).

**Behavior changes**
- Segmented: arrow keys now move focus along with the selection (before, the choice moved but focus stayed on the old option), and Home/End work.
- Checkbox: the box is drawn from theme roles (`appearance: none`, `line-strong` border, accent fill with an `on-accent` check) instead of the
  native box with `accent-color`, so the unchecked border reads in light themes.
- ThemeToggle: segments are 44px on touch (were 40px), idle icons use `hi2` (were `hi3`), and the segments use Segmented's roving tabindex
  (one Tab stop instead of three).

## 6. README component table rows

| Component | What it is |
|---|---|
| `Switch` | On/off setting that applies at once (`role="switch"`), with label and description |
| `Field` | Label + one control + hint/error, wired for screen readers |
| `SearchInput` | Search field with icon, Clear button and Escape to clear |
| `Chip`, `ChipGroup` | Multi-select filter chips, suggestions and removable tags |
| `Tabs`, `TabPanel`, `tabClass` | ARIA tabs (underline or pill); `tabClass` for router links |

(Update the existing rows: Textarea `autoGrow`/`size`; Checkbox `indeterminate`/`trailing`; Segmented `xs`/`block`; ThemeToggle `labels`/`compact`.)

## 7. Decisions and deviations

- Field's "Optional" tag uses `text-th-hi3`, not `text-th-ghost` as COMPONENTS.md says: `ghost` is 3:1 and fails axe contrast for text.
- Tabs: `TabPanel` reads `idBase` and the selected value from context when it is a child of `Tabs`; panels rendered elsewhere take `idBase` and `active`,
  and `Tabs controlsPanels` then adds `aria-controls` (left off otherwise, since a dangling `aria-controls` fails axe).
- Switch adds `labelSide` (`start` default, settings-row layout).
- SearchInput's `onChange(value, event?)` receives the string so Clear and Escape can call it too.
- Tier 2 has no items in this lane (Popover and DropdownMenu are overlay; the rest are display, foundation or static).
