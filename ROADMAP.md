# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **AppShell gaps that keep four apps on local shells** (2026-11-02, found adopting 1.7.0): trading wants the lg+ layout without a header (brand, wordmark subtitle and tools in the sidebar), short rail labels per item and nav links that remember each section's last URL; job-apps wants pill tabs with a badge, an explicit list of bottom-bar items instead of the first N, a full-height page and a header `innerClassName`; status wants header tabs at every width instead of the bottom bar and rail (two items); trackers wants placeholder tabs while auth is unknown, a footer slot and a header width. Each app then deletes its own shell. Repos: ui, then trading, job-apps, status, trackers.
- **Drop artifacts' restated `.nish-pill-link` rule** (2026-11-02, Stage C follow-up): the pill is in `nish-components.css` from the wave 2 release. Once nishant/artifacts pins that version, delete the restated pill rule in its `src/wrap.ts`. Stage F of [docs/specs/elements-waves.md](docs/specs/elements-waves.md).
- **Web components so @nish/ui works everywhere** (2026-11-02): waves 1 (`nish-ui/elements`) and 2 (`nish-ui/elements/forms`) have shipped. Left: wave 3 (`nish-ui/elements/data` and `nish-ui/elements/charts`: table sort, filter bar, split, nav rail, scroll row, section nav, command palette, charts, and classes for tables, media, settings and the range bar), then the non-React fleet pages (the hub, minecraft.nish.software, the demos page and trip pages) on the elements. Spec: Stages E and F of [docs/specs/elements-waves.md](docs/specs/elements-waves.md).
