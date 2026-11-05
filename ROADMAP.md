# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Date range and time picking** (2026-11-05): Calendar and DatePicker pick one day. Add a range mode (two picks, a hover preview, value { from, to }) and a time field when an app needs one.
- **TreeView re-renders every open row on each focus move** (2026-11-05, tree-virtual review): `renderNodes` builds a new element for every visible node on each keystroke. Memoize a `TreeItem` (props: node, depth, expanded, selected, focused) so only the rows whose state changed render; check with the React profiler on a 2,000-node open tree.
- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is 135.9 KB gzip (target 100; Calendar, DatePicker, MultiSelect and Carousel added 8.4 KB). Not reachable in 2.x: SystemCanvas, Inbox and the service-token components have to leave the root entry (SystemCanvas already has `nish-ui/system-canvas`), a 3.0 change (see "Other 2.0 leftovers"). AppShell is 35.0 KB (target 34); next levers: per-component string defaults (every string in `DEFAULT_STRINGS` ships with every component that reads strings; the 22 picker and carousel strings cost each of them about 0.24 KB), and Toaster cards loaded on demand, with a fallback for a chunk that cannot load.
- **Other 2.0 leftovers** (2026-11-03): a CommonJS build and React 18 support, only if an outside user asks. In 3.0, remove the `Switch` `onChange(checked, event)` signature in favor of `onCheckedChange`, and take the fleet-only names (Inbox, ServiceTokensSection, useServiceTokens, SystemCanvas and their helpers) off the root entry; they stay on `nish-ui/inbox`, `nish-ui/service-tokens` and `nish-ui/system-canvas`.
- **Adopt the shared AppShell in four apps** (2026-11-02): ui has the props since this release; trading, job-apps, status and trackers still render their own shells. Each app's `appshell-gaps` branch swaps it for `AppShell` and deletes the local one. Repos: trading, job-apps, status, trackers.
