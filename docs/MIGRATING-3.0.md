# Moving from nish-ui 2.x to 3.0

3.0 removes two things that 2.x kept for compatibility. Both are found by TypeScript: after the upgrade,
`tsc --noEmit` lists every line to change. Everything else is the same as 2.1. The full list of changes is in
the [changelog](https://design.nish.software/#/changelog).

Requirements: the same as 2.x (Node 20.19 or later, React 19, Tailwind 4 if you use `tailwind.css`).

## 1. Fleet-only components have their own entry points

`Inbox`, `ServiceTokensSection`, `useServiceTokens` and `SystemCanvas`, with their helpers and types, are no
longer exported from `@nish/ui`. Import them from the entry point that has always had them (since 2.1):

| Names | Import from |
|---|---|
| `Inbox`, `DEFAULT_INBOX_LABELS`, `INBOX_SOURCE_LABELS`, `INBOX_DEFAULT_SETTINGS`, `INBOX_ACTION_HEADER`, `INBOX_ACTION_TIMEOUT_MS`, and the types `InboxProps`, `InboxLabels`, `InboxItem`, `InboxView`, `InboxSeverity`, `InboxSettings`, `InboxListResponse`, `InboxAction`, `InboxActionResult`, `InboxActionCall` | `@nish/ui/inbox` |
| `ServiceTokensSection`, `useServiceTokens`, and the types `ServiceTokensSectionProps`, `ServiceTokenView`, `ServiceTokenListResponse` | `@nish/ui/service-tokens` |
| `SystemCanvas`, `layoutSystem`, `pickLayout`, `routeEdges`, `DEFAULT_CANVAS_LABELS`, and the types `SystemCanvasProps`, `CanvasGroup`, `CanvasNode`, `CanvasEdge`, `CanvasHue`, `CanvasNodeKind`, `CanvasLayout`, `CanvasEdgeKind`, `CanvasLayoutMode`, `CanvasLabels`, `LayoutOptions`, `RoutedEdge` | `@nish/ui/system-canvas` |

```tsx
// before
import { PageHeader, ServiceTokensSection, useServiceTokens } from '@nish/ui';

// after
import { PageHeader } from '@nish/ui';
import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens';
```

Why: these components are built for the nish.software apps, and keeping them on the main entry made it about
19 KB larger. The entry points work in 2.1 too, so you can move the imports before you upgrade.

## 2. Switch: `onChange` is gone, use `onCheckedChange`

```tsx
// before
<Switch checked={on} onChange={(checked) => setOn(checked)} label="Alerts" />

// after
<Switch checked={on} onCheckedChange={setOn} label="Alerts" />
```

`onCheckedChange` gets the new value only. If you used the second argument (the click event), use `onClick`,
which runs first and can call `event.preventDefault()` to stop the toggle. `onCheckedChange` exists since 2.0, so
this change also works before you upgrade.

## Smaller changes

| What | 3.0 |
|---|---|
| Toaster | Toast cards load in a small chunk the first time a toast shows (preloaded when the browser is idle). Until it loads, or if it cannot load, a plain card shows the same title, body, action and dismiss button. Screen readers hear every toast as before. |
| Strings | Each component carries only its own default strings. `NishProvider strings`, `useNishStrings()`, `useNishConfig()` and `DEFAULT_STRINGS` are unchanged. |
| Sizes | AppShell and the main entry are smaller; the numbers are in the [3.0.0 changelog entry](https://design.nish.software/#/changelog). |

## Check your upgrade

1. Move the imports and the Switch callbacks (both work on 2.1).
2. Change the pin to `npm:nish-ui@3.0.0` and reinstall.
3. Run `tsc --noEmit` and your tests. Every removed name and every `onChange` on a Switch is a type error.

## Support

Questions or a problem with the upgrade: [open an issue](https://github.com/nishant/ui/issues).
