# Lane: primitives (ds/v0.3-primitives)

Owns `src/components/primitives.tsx` plus the docs pages for Button, IconButton, Card, CardHeader (new), Badge, Input and Select.
Delete this file when the integrator has applied it.

## 1. `src/index.ts`

Replace the primitives lines with:

```ts
export { Button, IconButton, Card, CardHeader, Badge, Input, Textarea, Checkbox, Select, Label, buttonClass, iconButtonClass, cardClass, badgeClass, fieldClass } from './components/primitives';
export type { ButtonProps, IconButtonProps, CardProps, CardHeaderProps, BadgeProps, InputProps, TextareaProps, CheckboxProps, SelectProps, ButtonVariant, ButtonSize, ButtonClassOptions, IconButtonSize, IconButtonVariant, IconButtonClassOptions, CardPadding, CardElement, CardClassOptions, BadgeHue, BadgeClassOptions, FieldSize, FieldClassOptions } from './components/primitives';
```

(Textarea and Checkbox are still in primitives.tsx untouched; if the forms lane moved them to `forms.tsx`, export them from there and
delete the two blocks from primitives.tsx. `FIELD` is exported from primitives.tsx for in-package use by Textarea/forms; do NOT export it from index.)

## 2. Docs registration

- `site/components/index.ts`: `import { cardHeader } from './card-header';` and add `cardHeader` to `COMPONENT_DOCS` right after `card`.
- `site/docgen.mjs`: add `'CardHeader'` to `COMPONENTS` (after `'Card'`); add `'buttonClass', 'iconButtonClass', 'cardClass', 'badgeClass', 'fieldClass'` to `FUNCTIONS`.
- Then add `api` blocks to the pages (left out so the lane branch renders without docgen entries):
  - `site/components/button.tsx`: `api: { functions: ['buttonClass'], interfaces: [] }`
  - `site/components/icon-button.tsx`: `api: { functions: ['iconButtonClass'], interfaces: [] }`
  - `site/components/card.tsx`: `api: { functions: ['cardClass'], interfaces: [] }`
  - `site/components/badge.tsx`: `api: { functions: ['badgeClass'], interfaces: [] }`
  - `site/components/input.tsx`: `api: { functions: ['fieldClass'], interfaces: [] }`
- Optional: the docs pages import the new names from `'../../src/components/primitives'`; once index exports them, switch those imports to `'../../src'`.
- Verified locally with these registrations applied (not committed): typecheck, build:site and the visual check on every primitives page passed.

## 3. Visual configs

`tools/site-all.visual.json` (after the `card` entries):

```json
{ "name": "card-header", "url": "http://localhost:5191/#/components/card-header", "waitFor": "[data-page]" },
{ "name": "card-header-themes", "url": "http://localhost:5191/#/components/card-header/themes", "waitFor": "[data-page]" }
```

(Copy any extra keys the existing `card-themes` entry carries, e.g. its viewport/fullPage settings.)

`tools/site.visual.json`: add `{ "name": "card", "url": "http://localhost:5191/#/components/card", "waitFor": "[data-page]" }` (Card got the most new surface).

## 4. CHANGELOG (one line per addition)

- Button: `soft`, `subtle` and `link` variants, and an `xs` size (24px, 44px on touch).
- `buttonClass({ variant, size, className })`: the exact Button recipe for `<a>`, router `<Link>` and `<a download>`.
- IconButton: `xs` size (24px), `variant` (`ghost` | `subtle` | `soft`) and `tone="danger"`.
- `iconButtonClass({ size, variant, tone, active, className })`.
- Card: `padding` (`none` | `sm` | `md` | `lg`), `as` (`div` | `section` | `article` | `aside` | `li`), `variant="inset"`, and `title` / `description` / `action`, which render a CardHeader.
- `cardClass({ padding, padded, interactive, variant, className })`, for cards that are links.
- CardHeader (new): title, description, icon, action slot, heading level (`as`), `divided` for edge-to-edge cards, `titleId`.
- Badge: `hue` (the 8 hues, on `th-<hue>-soft` with `hi` text), `size="xs"`, `variant="tag"` and `dot`.
- `badgeClass({ tone, hue, size, variant, className })`.
- Input: `size` (`xs` | `sm` | `md`), `leading` and `trailing` slots, `wrapperClassName`.
- Select: `size` (`xs` | `sm` | `md`) and `selectClassName` for the inner `<select>`.
- `fieldClass({ size, invalid, className })`: the shared field recipe for one-off controls.

**Behavior changes**
- Card's `title` prop now renders a CardHeader instead of the native `title` attribute (tooltip). A titled `section`/`article`/`aside` Card gets `aria-labelledby` pointing at its heading.
- Card forwards its ref as `HTMLElement` (was `HTMLDivElement`); it still renders a `div` by default.
- Input and Select: the native `size` attribute is replaced by the `size` prop (`xs` | `sm` | `md`).
- Field padding is now `pl-*`/`pr-*` instead of `px-*` (same pixels); `className="pl-9"` keeps working, and `px-4` still overrides both sides.

## 5. README component-table rows

| Component | What it is |
|---|---|
| `Button` | Seven variants (primary, secondary, ghost, danger, soft, subtle, link), four sizes (xs–lg), loading; `buttonClass()` for links |
| `IconButton` | Icon-only button, xs/sm/md, ghost/subtle/soft, danger tone, required label; `iconButtonClass()` |
| `Card` | Surface panel: padding none/sm/md/lg, `as`, inset variant, optional header via title/description/action; `cardClass()` |
| `CardHeader` | Card header row: title, description, icon, action slot, divided |
| `Badge` | Status pill: 6 tones, 8 hues, xs/sm, pill/tag, optional dot; `badgeClass()` |
| `Input` | Text field: xs/sm/md, leading/trailing slots, invalid; `fieldClass()` for one-off controls |
| `Select` | Native select: xs/sm/md, invalid, `selectClassName` |

## 6. Needed from files this lane does not own

- **Foundation lane:** `text-2xs` / `text-3xs` (Button xs, Badge xs, Input/Select xs on desktop) and `th-<hue>-soft` (Badge `hue`).
  Until they land those classes generate nothing (Badge hues show the hue border on no tint; xs text falls back to the inherited size).
  `cn('text-th-hi', 'text-2xs')` already keeps both with tailwind-merge 3.x (checked), but keep the foundation's cn.ts extension and assertion.
- **Display lane:** Badge `dot` uses StatusDot's xs recipe inline (6px, `-fill`; neutral `ghost`, accent `accent`, hue `th-<hue>`).
  If StatusDot lands, the integrator may render `<StatusDot size="xs" tone=… />` there instead; the look is the same.
- **Forms lane:** Textarea/Checkbox should build on `FIELD` / `fieldClass` exported here rather than a copy.
- **Spec deviation:** Input's leading/trailing slots use `text-th-hi2`, not `text-th-hi3`: hi3 is only UI-safe (3:1) on `elevated`
  (the field fill), and axe failed a `$`/`min` text prefix at 4.33:1 in slate. Icons are unaffected.
