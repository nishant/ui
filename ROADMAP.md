# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **2.0: production hardening** (2026-11-03): the audit of nish-ui for outside teams (RSC/SSR, tree-shaking, shared runtime, i18n/RTL, forms, a11y, security defaults, new components, tests, docs). Spec: docs/specs/prod-hardening.md.

- **AppShell gaps that keep four apps on local shells** (2026-11-02, found adopting 1.7.0): trading wants the lg+ layout without a header (brand, wordmark subtitle and tools in the sidebar), short rail labels per item and nav links that remember each section's last URL; job-apps wants pill tabs with a badge, an explicit list of bottom-bar items instead of the first N, a full-height page and a header `innerClassName`; status wants header tabs at every width instead of the bottom bar and rail (two items); trackers wants placeholder tabs while auth is unknown, a footer slot and a header width. Each app then deletes its own shell. Repos: ui, then trading, job-apps, status, trackers.
- **Wave 3 element follow-ups** (2026-11-02): `<nish-nav-rail>`, `<nish-section-nav>` and `<nish-table-sort>` should pick up children a framework renders after mount (as `<nish-scroll-row>` does), with specs; add parity cases for the Stage E classes and states not covered yet; add touch/focus regression specs for the coarse-pointer chip width, the command input focus ring and the stacked split panes.
