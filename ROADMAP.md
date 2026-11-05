# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Components left out of 2.0** (2026-11-03): DatePicker and Calendar, MultiSelect, Carousel. Each follows the component contract in docs/DEVELOPING.md and gets a docs page, unit tests and a size budget.
- **TreeView re-renders every open row on each focus move** (2026-11-05, tree-virtual review): `renderNodes` builds a new element for every visible node on each keystroke. Memoize a `TreeItem` (props: node, depth, expanded, selected, focused) so only the rows whose state changed render; check with the React profiler on a 2,000-node open tree.
- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is 127.5 KB gzip (target 100). Not reachable in 2.x: SystemCanvas, Inbox and the service-token components have to leave the root entry (SystemCanvas already has `nish-ui/system-canvas`), a 3.0 change (see "Other 2.0 leftovers"). AppShell is 34.7 KB (target 34); next lever: Toaster cards loaded on demand, with a fallback for a chunk that cannot load.
- **Other 2.0 leftovers** (2026-11-03): a CommonJS build and React 18 support, only if an outside user asks. In 3.0, remove the `Switch` `onChange(checked, event)` signature in favor of `onCheckedChange`, and take the fleet-only names (Inbox, ServiceTokensSection, useServiceTokens, SystemCanvas and their helpers) off the root entry; they stay on `nish-ui/inbox`, `nish-ui/service-tokens` and `nish-ui/system-canvas`.
- **Adopt the shared AppShell in four apps** (2026-11-02): ui has the props since this release; trading, job-apps, status and trackers still render their own shells. Each app's `appshell-gaps` branch swaps it for `AppShell` and deletes the local one. Repos: trading, job-apps, status, trackers.
