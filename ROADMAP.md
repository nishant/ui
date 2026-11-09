# Roadmap

Open work only. Delete an entry in the PR that finishes it; git history is the record.

## Ideas

- **Release the audit phase 2 fixes** (2026-11-09, audit-p2): merged to master, not released (v3.1.0 had just fanned out). Tomorrow: rename `## [Unreleased]` in CHANGELOG.md to `## [3.1.1] - <date>` in a PR, merge it, then `gh workflow run release.yml -R nishant/ui -f bump=patch`.
- **Finish the 2026-11-08 audit** (2026-11-09, audit-1108): the report is `C:\Code\.audit\2026-11-08\ui.md` on the PC (ids
  `UI-nnn`). 3.1.0 and phase 2 (audit-p2) fixed the listed high, medium and low findings; about 230 low and nit findings
  remain, plus the chunks never read because of the usage cut: `site/components/` from `accordion.tsx` on, `site/docgen*`,
  `site/pages/`, `site/public/`, `tests/` (consumers, elements, overlay) and `tools/` other than `tools/fanout/`, and the
  tests-and-CI and live-site lenses.
- **Fan-out fixes from the audit** (2026-11-09, audit-1108): UI-089: real isolation of repo-controlled commands from
  FLEET_TOKEN (a token-less job or container); the comment now says they are not isolated.
- **CI and docs drift from the audit** (2026-11-09, audit-1108): UI-009: the release job runs devDependency code with a
  `contents: write` + `actions: write` token; split the release build from the push.
- **3.1.0 review leftovers** (2026-11-09, audit-1108):
  - `configureApi` config now lives in `shared('api')`, so any nish-ui bundle on the page can change `baseUrl`; consider
    sharing only between same-version copies.
  - After a swipe dismiss, a parent that closes late (popstate, a router) can see the panel flash back.
  - The `useLocalStorage` storage listener leaks across copies.
  - Partial fixes remain in VirtualTable focus scrolling, the RTL scrollspy and `<nish-table-sort>` currency parsing.
  - `src/components/toast-lazy.test.tsx` ("moves focus from the fallback Undo button") fails under heavy local load but
    passes alone and in CI.

- **Root bundle back to 100 KB** (2026-11-05): everything from `nish-ui` is 122.1 KB gzip (target 100); 3.0 moved the fleet names off. The rest needs general components off the root (flow 5.4 KB, split 5.0, charts 4.8, Calendar and DatePicker 4.4, VirtualList and VirtualTable 4.2); decide whether that is worth a 4.0.
- **Other 2.0 leftovers** (2026-11-03): a CommonJS build and React 18 support, only if an outside user asks.
- **Docs demos lose `nish-pad-bottom-inset` to a padding utility** (2026-11-07, ui-pad-bottom): the class is in the base layer, so `py-4` beats it in `site/components/bottom-nav.tsx` and `sticky-action-bar.tsx`, and the inline `padding` in `static-parity.tsx` does too. Use `pt-4` plus `pb-[max(calc(var(--nish-bottom-inset,0px)+1rem),calc(1rem+env(safe-area-inset-bottom)))]` there, as PageContainer does since 2.1.3.
- **Range and time picker leftovers** (2026-11-07, range-picker review): (1) the docs story frame (`site/pages/frame.tsx`, `p-6`) leaves a 278px DateRangePicker at 360px, so its placeholder "MM/DD/YYYY – MM/DD/YYYY" is clipped by one character inside the input (in an app with 16px gutters it fits); try `p-3 sm:p-6` and check the Fold visual diff. (2) Calendar's and RangeCalendar's today ring is a box-shadow, so it disappears in forced colors; add a forced-colors outline for today. (3) TimeField looks up its Field label id only when `id` changes, so a Field label that mounts later is not picked up.
- **3.0 toast leftovers** (2026-11-07, ui-3 review): (1) `tests/a11y/csp.spec.ts` loads only the static files, so the strict CSP is never tested with the React Toaster's lazy `toast-card` chunk (a scratch harness showed it works): add a case that bundles a small Toaster app with esbuild `splitting: true`, fires a toast and asserts the fallback gives way to the card with no violations. (2) The fallback card skips the phone top-layer entry animation (`nish-toast-in-top`) to stay inside the Toaster budget (11.69 of 11.7 KB). (3) Focus moves from a fallback button to the card's matching button when the chunk arrives even if the user clicked away in between (no blur tracking).
