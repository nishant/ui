# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Web components so @nish/ui works everywhere** (2026-11-02, after npm default): people outside React should be able to use the whole general-purpose library, not a sample. Additive: React components never change. Elements are Lit custom elements in light DOM over the existing `nish-*` classes and `src/theme.ts` helpers, shipped as one self-contained `nish-ui/elements` bundle (artifacts load it from jsdelivr), with an HTML tab on every docs page and a React-vs-element parity test. Wave 1 (theme toggle, sheet, dialog, toast, bottom nav; button and card stay `.nish-btn`/`.nish-card`) is fully specced in [docs/specs/nish-ui-everywhere.md](docs/specs/nish-ui-everywhere.md), Stage B; Stage C then rebuilds every artifact on artifacts.nish.software on the design system. Waves 2 (forms, combobox, tabs, segmented, list row, feedback, display) and 3 (table, filters, media, split, nav, settings blocks, command palette, charts) follow the same pattern and need their own spec. React-only plumbing (hooks, `useUrlState`, resource, error boundary) and app-specific pieces (inbox client, `AppShell`) stay React-only. Repos: skills (`artifacts`, `trip-plan`, `ui-component`), artifacts (Stage C), then the non-React apps adopt it.
