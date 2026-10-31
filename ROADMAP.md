# Roadmap

## Ideas

- ~~**UX overhaul: mobile chrome and new components** (2026-10-28): opaque sticky chrome, a layout contract of CSS variables, phone navigation (BottomNav, MoreSheet, NavRail), data, chart and layout components, format helpers and static parity, from a full UI audit of every nish.software app.~~ Done 2026-10-28, v0.7.0 (spec: `git show 67c9c42:docs/specs/ux-overhaul.md`).
- ~~**Fleet fan-out** (2026-10-28): a new @nish/ui tag opens a bump PR in every app and hosting, each PR runs the Fold check with visual diffs and merges itself when green, Dependabot PRs go the same way, and status.nish.software/fleet shows each app's version, CI, undeployed commits, certificates and uptime. Repos: hosting, status, every app, skills.~~ Done 2026-10-29, nishant/ui#19 (spec: `git show 48f0d30:docs/specs/fleet-fanout.md`).
- ~~**App building blocks and guardrails (1.0.0)** (2026-10-31): AppShell, useResource/apiFetch/ApiError, AppErrorBoundary, `@nish/ui/vite` nishThemeInit, FilterBar/FilterSheet/useUrlState, settings blocks, Combobox, breakpoint helpers, one icon decision; an `@nish/ui/eslint` preset and th-* class checker, overlay interaction specs, toast live regions and `inert` behind dialogs, releases from CI, and 1.0.0. Audit 2026-10-31 items 13 (ui side) and 14.~~ Done 2026-10-31, nishant/ui#31, v1.0.0 (spec: `git show 93e735a:docs/specs/app-blocks.md`).
