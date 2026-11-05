# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Components left out of 2.0** (2026-11-03): DatePicker and Calendar, MultiSelect, Carousel. Each follows the component contract in docs/DEVELOPING.md and gets a docs page, unit tests and a size budget.
- **TreeView re-renders every open row on each focus move** (2026-11-05, tree-virtual review): `renderNodes` builds a new element for every visible node on each keystroke. Memoize a `TreeItem` (props: node, depth, expanded, selected, focused) so only the rows whose state changed render; check with the React profiler on a 2,000-node open tree.
- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is 118.4 KB gzip (target 100). Not reachable in 2.x: SystemCanvas, Inbox and the service-token components have to leave the root entry (SystemCanvas already has `nish-ui/system-canvas`), a 3.0 change; decide it with the fleet-only APIs item in "Other 2.0 leftovers". AppShell is 34.7 KB (target 34); next lever: Toaster cards loaded on demand, with a fallback for a chunk that cannot load.
- **Other 2.0 leftovers** (2026-11-03): docs-site bundle splitting and fewer iframes on the /themes views; SystemCanvas routing performance at 500 nodes; a CommonJS build and React 18 support only if an outside user asks. Raise the mutation score of `src/theme.ts` (39% in 2.0; 478 mutants run in no Vitest test because the theme functions are only exercised by the build-time self-tests in scripts/build.mjs). Mark the fleet-only APIs (inbox, service tokens, SystemCanvas) as internal in the docs or move them to a subpath, so outside users know what is covered by semver. In 3.0, remove the `Switch` `onChange(checked, event)` signature in favor of `onCheckedChange`.
- **Adopt the shared AppShell in four apps** (2026-11-02): ui has the props since this release; trading, job-apps, status and trackers still render their own shells. Each app's `appshell-gaps` branch swaps it for `AppShell` and deletes the local one. Repos: trading, job-apps, status, trackers.
- **Wave 3 element follow-ups** (2026-11-02): add parity cases for the Stage E classes and states not covered yet; add touch/focus regression specs for the coarse-pointer chip width, the command input focus ring and the stacked split panes.
