# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **1.0 block follow-ups from the app adoption** (2026-11-01, standards-adoption): `AppShell` gets a collapsible lg+ sidebar, a banner slot, a logged-out mode without nav and a custom header name; `NumberField` gets a real spinbutton (role, arrows) and allows negatives when `min` permits; settings blocks get a compact variant; `apiFetch` error wording matches status and workflows; `useUrlState` stops splitting comma values like "Austin, TX"; `cn()` keeps custom text sizes such as trackers' `text-body-sm`; the design site's own theme script moves after the charset.
- **Clear the `react-hooks/refs` warnings** (2026-10-31): ui lints itself now (`npm run lint`); 36 hits of `react-hooks/refs` (refs read or written during render in flow, overlay, resource, url-state, hooks, command, nav, segmented, canvas) are set to "warn" in `eslint.config.ts` (`TODO(standards)`). Fix them by moving the latest-value refs into effects, then make the rule an error.
