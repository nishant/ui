# Roadmap

## Ideas

- ~~**UX overhaul: mobile chrome and new components** (2026-10-28): opaque sticky chrome, a layout contract of CSS variables, phone navigation (BottomNav, MoreSheet, NavRail), data, chart and layout components, format helpers and static parity, from a full UI audit of every nish.software app.~~ Done 2026-10-28, v0.7.0 (spec: `git show 67c9c42:docs/specs/ux-overhaul.md`).
- ~~**Fleet fan-out** (2026-10-28): a new @nish/ui tag opens a bump PR in every app and hosting, each PR runs the Fold check with visual diffs and merges itself when green, Dependabot PRs go the same way, and status.nish.software/fleet shows each app's version, CI, undeployed commits, certificates and uptime. Repos: hosting, status, every app, skills.~~ Done 2026-10-29, nishant/ui#19 (spec: `git show 48f0d30:docs/specs/fleet-fanout.md`).
