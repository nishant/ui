# Lane: overlay (ds/v0.3-overlay)

Owned file: `src/components/overlay.tsx`. New docs pages: `site/components/drawer.tsx`, `confirm-dialog.tsx`, `popover.tsx`,
`dropdown-menu.tsx`. Extended docs pages (no other lane documents these components): `site/components/modal.tsx`, `tooltip.tsx`.

Shipped: dialog hook (internal `useDialog`: layer stack, focus in, Tab trap, Escape, focus return, html + body lock), Modal fix and
extend, Drawer, ConfirmDialog, Tooltip extend, Popover (Tier 2), DropdownMenu with MenuItem, MenuLabel, MenuSeparator, MenuSubHeader
(Tier 2), internal `useAnchoredPosition` shared by Tooltip, Popover and DropdownMenu. No static class twins: COMPONENTS.md lists none
for overlay components. Deferred: nothing.

## 1. `src/index.ts`

Replace the two overlay lines with:

```ts
export { Modal, Tooltip, Drawer, ConfirmDialog, Popover, DropdownMenu, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader } from './components/overlay';
export type { ModalProps, TooltipProps, DrawerProps, ConfirmDialogProps, PopoverProps, DropdownMenuProps, MenuItemProps, MenuSubHeaderProps } from './components/overlay';
```

After that, switch the new docs pages' imports from `'../../src/components/overlay'` to `'../../src'` (drawer, confirm-dialog,
popover, dropdown-menu). `dropdown-menu.tsx` imports `ChevronDownIcon` from `'../../src/components/icons'`; keep that (icons are not exported).

## 2. Docs registration

`site/components/index.ts`:

```ts
import { drawer } from './drawer';
import { confirmDialog } from './confirm-dialog';
import { popover } from './popover';
import { dropdownMenu } from './dropdown-menu';
// COMPONENT_DOCS: after `tooltip`
  drawer,
  confirmDialog,
  popover,
  dropdownMenu,
```

`site/docgen.mjs` `COMPONENTS`, after `'Tooltip'` (without these the component page crashes on `gen.file`):

```js
  'Drawer',
  'ConfirmDialog',
  'Popover',
  'DropdownMenu',
  'MenuItem',
  'MenuSubHeader',
```

Optional: `RealDrawerButton` (drawer.tsx) and `RealConfirmButton` (confirm-dialog.tsx) are exported like `RealModalButton`, for the
Patterns page or Getting started if the integrator wants live demos.

## 3. Visual configs

`tools/site-all.visual.json`, after the tooltip entry:

```json
{ "name": "drawer", "url": "http://localhost:5191/#/components/drawer", "waitFor": "[data-page]", "settle": 1000 },
{ "name": "confirm-dialog", "url": "http://localhost:5191/#/components/confirm-dialog", "waitFor": "[data-page]", "settle": 1000 },
{ "name": "popover", "url": "http://localhost:5191/#/components/popover", "waitFor": "[data-page]", "settle": 1000 },
{ "name": "dropdown-menu", "url": "http://localhost:5191/#/components/dropdown-menu", "waitFor": "[data-page]", "settle": 1000 }
```

`tools/site.visual.json` (the short list), after `modal`:

```json
{ "name": "dropdown-menu", "url": "http://localhost:5191/#/components/dropdown-menu", "waitFor": "[data-page]", "settle": 1000 }
```

Checked in this lane (served on 18914, desktop + phone, dark + light): the six pages and their All-themes views, 0 problems.

## 4. CHANGELOG (Unreleased / 0.3.0)

### Added
- `Drawer`: a panel from the right, left or bottom edge (`side`, `size` sm/md/lg, `subtitle`, `actions`, `footer`, `bottomOffset`), a modal dialog with the same focus trap, Escape, focus return and scroll lock as Modal.
- `ConfirmDialog`: a yes-or-no question before an action, in place of `window.confirm` (`tone` danger/primary, `pending`, `confirmLabel`, `cancelLabel`). Danger confirms start focus on Cancel.
- `Popover`: a non-modal panel anchored to an element (`open`, `onOpenChange`, `anchor`, `side`, `align`, `width`); flips and clamps, closes on Escape and outside press, returns focus to the anchor.
- `DropdownMenu` with `MenuItem` (`icon`, `trailing`, `danger`, `active`, `disabled`, `onSelect`), `MenuLabel`, `MenuSeparator` and `MenuSubHeader`: menu roles, arrow keys, Home, End, typeahead, Escape, `aria-haspopup`/`aria-expanded` on the trigger and focus return.
- Modal `size="2xl"` and `size="full"`.
- Modal `placement="top"` for command palettes and search dialogs.
- Modal `header` (replaces the title row; pass `aria-label`), `hideClose` and `aria-label`.
- Tooltip `side="left"` and `side="right"`.
- Tooltip `focusable` (default true; false keeps dense marks out of the Tab order).
- Tooltip `variant="hint"`: dotted underline and help cursor on the trigger.
- Popovers and menus opened inside a Modal or Drawer stack above it, and Escape closes the topmost layer only.

### Behavior changes
- Modal (and Drawer, ConfirmDialog) lock scroll on `<html>` as well as `<body>`, restored when the last dialog closes. Apps that carried a local root-scroll lock (job-apps `useLockRootScroll`) can drop it.
- Modal `title` is optional when `header` is given (it stays the accessible name otherwise).
- Tooltip opens on `focusin`, so a focusable child inside the trigger (a button) shows the tip too; Escape hides it.
- Tooltip position is measured before paint and kept in place on scroll and resize (shared positioning with Popover and DropdownMenu).
- Tooltip uses `z-index: var(--nish-z-tooltip)` (100, unchanged value).

## 5. README component table rows

```md
| `Modal` | Dialog; bottom sheet under 640px; sizes md to full, top placement, custom header; Escape, focus trap, focus return, html + body scroll lock | [Modal](https://design.nish.software/#/components/modal) |
| `Drawer` | Side or bottom panel with the Modal's focus trap, Escape and scroll lock | [Drawer](https://design.nish.software/#/components/drawer) |
| `ConfirmDialog` | Yes-or-no question before an action, in place of `window.confirm` | [ConfirmDialog](https://design.nish.software/#/components/confirm-dialog) |
| `Tooltip` | Hover and focus hint in a portal on any side, flipped and clamped to the screen; `hint` variant | [Tooltip](https://design.nish.software/#/components/tooltip) |
| `Popover` | Non-modal panel anchored to an element; Escape and outside press close it | [Popover](https://design.nish.software/#/components/popover) |
| `DropdownMenu` | Menu of actions behind a button, with `MenuItem`, `MenuLabel`, `MenuSeparator`, `MenuSubHeader` | [DropdownMenu](https://design.nish.software/#/components/dropdown-menu) |
```

## 6. Needed from files this lane does not own

- Foundation (`src/css/base.css`): `@keyframes nish-slide-in-right` and `nish-slide-in-left` (Drawer's side animations reference them; until
  they land the drawer simply appears without sliding). Expected shape: `from { transform: translateX(100%) }` / `translateX(-100%)` to `translateX(0)`.
- Foundation (`src/tokens.mjs` + Tailwind theme): `text-2xs` (MenuLabel, and the shortcut text in the DropdownMenu docs stories). Until
  it lands the class does nothing and MenuLabel renders at the inherited `text-xs`.
- Foundation (`src/cn.ts`): the tailwind-merge `text: ['2xs','3xs']` extension, so `cn('... text-th-hi2', 'text-2xs')` in MenuLabel keeps the color.
- Primitives: Drawer uses `IconButton` (label, default size) and ConfirmDialog uses `Button` (`variant` danger/primary, `loading`, rest props
  for `data-autofocus`). Both are unchanged APIs; any primitives extension stays compatible.
- Contrast: `text-th-hi3` on `bg-th-elevated` is 4.33:1 in slate, so panels on `elevated` (Popover, menus) use `hi2` for small text. If the
  foundation lane wants `hi3` usable on elevated, add that pair to `tools/contrast-rules.mjs`.
