# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Date range and time picking** (2026-11-05): Calendar and DatePicker pick one day. Add a range mode (two picks, a hover preview, value { from, to }) and a time field when an app needs one.
- **TreeView re-renders every open row on each focus move** (2026-11-05, tree-virtual review): `renderNodes` builds a new element for every visible node on each keystroke. Memoize a `TreeItem` (props: node, depth, expanded, selected, focused) so only the rows whose state changed render; check with the React profiler on a 2,000-node open tree.
- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is 135.9 KB gzip (target 100; Calendar, DatePicker, MultiSelect and Carousel added 8.4 KB). Not reachable in 2.x: SystemCanvas, Inbox and the service-token components have to leave the root entry (SystemCanvas already has `nish-ui/system-canvas`), a 3.0 change (see "Other 2.0 leftovers"). AppShell is 35.0 KB (target 34); next levers: per-component string defaults (every string in `DEFAULT_STRINGS` ships with every component that reads strings; the 22 picker and carousel strings cost each of them about 0.24 KB), and Toaster cards loaded on demand, with a fallback for a chunk that cannot load.
- **Other 2.0 leftovers** (2026-11-03): a CommonJS build and React 18 support, only if an outside user asks. In 3.0, remove the `Switch` `onChange(checked, event)` signature in favor of `onCheckedChange`, and take the fleet-only names (Inbox, ServiceTokensSection, useServiceTokens, SystemCanvas and their helpers) off the root entry; they stay on `nish-ui/inbox`, `nish-ui/service-tokens` and `nish-ui/system-canvas`.
- **Docs demos lose `nish-pad-bottom-inset` to a padding utility** (2026-11-07, ui-pad-bottom): the class is in the base layer, so `py-4` beats it in `site/components/bottom-nav.tsx` and `sticky-action-bar.tsx`, and the inline `padding` in `static-parity.tsx` does too. Use `pt-4` plus `pb-[max(calc(var(--nish-bottom-inset,0px)+1rem),calc(1rem+env(safe-area-inset-bottom)))]` there, as PageContainer does since 2.1.3.
