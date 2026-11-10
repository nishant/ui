# CLAUDE.md — @nish/ui

The shared tokens, themes and React components of every *.nish.software app. How the
package is used: [README.md](README.md). Repo layout and dev commands: [docs/DEVELOPING.md](docs/DEVELOPING.md). How it is released, reaches the apps and npm (`nish-ui`): [docs/RELEASING.md](docs/RELEASING.md). Every release:
[CHANGELOG.md](CHANGELOG.md).

## Autonomy

Claude sessions build, commit, push, open and merge PRs and cut releases on their own judgment,
without asking Nish. A release runs in CI: merge the release's `## [x.y.z]` CHANGELOG entry to master, then
`gh workflow run release.yml -R nishant/ui -f bump=<patch|minor|major>`. It refuses unless HEAD is
origin/master and master's ci.yml run is green, pushes master before the tag, creates the GitHub Release and starts the fan-out
(`.github/workflows/fanout.yml`). `npm run release` is the local fallback. The fan-out moves
every app and hosting: it opens a `ui/vX.Y.Z` PR in each repo and merges it when the checks and the
Fold check pass. A held bump PR is adopted on its `ui/vX.Y.Z` branch (make the app's code changes
there); the fan-out merges it on its next run. Check https://status.nish.software/fleet for what is
behind. Only taarora/arora-home is moved by hand: `bash scripts/bump-consumers.sh vX.Y.Z`.
Work is done only when it is merged, released, adopted by the apps that need it, and confirmed
live. The rest of the rule (defaults instead of questions; stop only for credentials, account
signups or anything destructive to production data) is "Autonomy" in [`global/CLAUDE.md`](https://github.com/nishant/skills/blob/master/global/CLAUDE.md) in `nishant/skills`.

## Keeping npm in sync

The package is on npm as `nish-ui`. Every release publishes it through `publish.yml` (trusted
publishing; no tokens exist or are allowed). After a release, check `npm view nish-ui version`
equals the newest git tag. Update the README and the docs site in the same PR as any component,
export or token change: the README is the npm page, so absolute links only, no table wider than
3 short columns, detail on design.nish.software. A failed publish run: fix it and rerun
`gh workflow run publish.yml -R nishant/ui -f tag=vX.Y.Z`. Details: "Keeping npm in sync" in
[docs/RELEASING.md](docs/RELEASING.md#keeping-npm-in-sync).

## Repo rules that changed in 2.0

- Components follow the contract in [docs/DEVELOPING.md](docs/DEVELOPING.md#the-component-contract):
  `'use client'` per module, pure helpers in `*-classes.ts`, `ref` as a prop (no `forwardRef`), strings
  from `useStrings(GROUP)` (never `useNishStrings()` inside the package), shared state through `shared()` in `src/runtime.ts`.
- 3.0: the fleet-only names are only on `nish-ui/inbox`, `nish-ui/service-tokens` and
  `nish-ui/system-canvas`; `Switch` has only `onCheckedChange`.
- Bundlers load `dist/esm/` (one file per module). The standalone files at the old `dist/` paths stay for
  static pages. `npm run size` and `tools/api-surface.test.mjs` run in `check`; regenerate the snapshot
  (`UPDATE_API_SURFACE=1`) after the final build.
- Docs site samples are written as `@nish/ui` and shown as `nish-ui` by `nishName()` in `site/lib/code.tsx`.

## Target Device

Every app built on this package follows "Phones and layout" in [`global/CLAUDE.md`](https://github.com/nishant/skills/blob/master/global/CLAUDE.md) in `nishant/skills`: 360px, ~840px and
desktop, light and dark, 44px targets, no horizontal page scroll, every page reachable through
visible UI. Components must hold up the same way; `tools/visual-check.mjs` checks those sizes by
default.

## Workflows

Validate every workflow file before pushing: `npx -y @action-validator/cli@0.6.0 .github/workflows/<file>.yml`. A YAML
error (a plain `run:` value containing `: `) makes GitHub reject the whole file, so none of its triggers fire.
An empty `FLEET_TOKEN` (a `gh secret set` prompt that got no paste) also fails quietly: the fan-out's plan job
summary says "FLEET_TOKEN is not set". Re-set it and dispatch `fanout.yml` to check.
`release.yml` pushes with GITHUB_TOKEN, which does not trigger other workflows (so neither `ci` nor the
tag-push fan-out runs from it); `scripts/release.mjs --ci` dispatches `fanout.yml` itself.

## Traps

- A push to master while `release.yml` runs (another session's `[skip ci]` ROADMAP commit) fails the release
  ("HEAD is not origin/master" or a rejected `git push origin master`). Nothing lands (no version commit, no tag):
  dispatch it again once master is quiet.
- A release whose major is higher than an app's pin (0.x → 1.0.0, 1.x → 2.0.0) is held in every app
  ("Major release: a session has to adopt it"). When nothing needs to change, adopt each `ui/vX.Y.Z` PR with an
  empty commit by someone other than `ui fan-out`; the next hourly run merges it once checks pass. A newer tag
  closes older open bump PRs ("Superseded"), so adopt only the newest.
- `npx playwright test` reuses a running harness server (`reuseExistingServer` locally); a leftover
  `vite --config tests/overlay/vite.config.ts` keeps a worktree folder locked on Windows. Stop it before
  `git worktree remove`. The harness, demo and site ports (5190-5195) are fixed, so with several ui worktrees open
  a local run can test another worktree's server: run `CI=1 npx playwright test` (own server, `--strictPort`) and
  check a port is free before serving on it.
- `SystemCanvas` lives in `src/components/canvas/` (layout, route, follow, minimap, legend, node, view). The fit
  (`fitView`) and the layout pick (`chooseLayout`) share thresholds (`PHONE_K`, `SCROLL_K`): change them together, or
  a narrow canvas opens cut off mid-map. `tools/canvas-layout-check.mjs` and `canvas-route-check.mjs` cover layout and
  routing; `tools/canvas-route-bench.mjs` times routing and `route-golden.test.ts` pins its output: a routing change
  that is meant to change lines regenerates the hashes with `NISH_ROUTE_GOLDEN_PRINT=1`. Check the first view at 360
  and 840 in a browser too.
- Docs site docs are lazy chunks: `site/docs-meta.mjs` reads each doc's id, name, summary, exports, framed and fleetOnly
  from the source, so they must be literals.
- The fan-out waits 2 hours after a release for a burst to settle, so the docs site (hosting) stays on the old version that long. To check new docs pages live right away, fan out to hosting only: `gh workflow run fanout.yml -R nishant/ui -f tag=vX.Y.Z -f repo=nishant/hosting -f now=true`; leave the apps on the settle window.
- CodeQL runs on every PR (`codeql.yml`) and its alerts fail the PR check. Fix the code; dismiss a false positive only with
  a reason (`gh api -X PATCH repos/nishant/ui/code-scanning/alerts/<n> -f state=dismissed -f dismissed_reason="false positive" -f dismissed_comment=...`).
  Trim strings with index loops, not an anchored `[...]+$` regex (polynomial ReDoS).
- A new file in `dist/files.json` `static` breaks taarora/arora-home's `scripts/sync-nish-ui.py` unless it is optional there
  (`*.min.css`, `elements*.js`); a new literal red or green in vendored CSS fails its colour-blind check. Run
  `bash scripts/bump-consumers.sh vX.Y.Z` after each release and fix the sync script in arora-home when it refuses.
- Since 3.1.0 the scroll-edge attributes (`data-at-start`/`data-at-end` from `useScrollEdges`, `mountScrollspy`, tabs,
  segmented and scroll-row) mean the physical left/right edge in RTL, because the fade masks run `to right`. Anything that
  means "scrolled away from the start" (the pinned-column shadow in `STICKY_COL` and `.nish-table-wrap--sticky-first`) must
  pair `ltr:`/`rtl:` (or `:dir()`) with `data-at-start`/`data-at-end`.
- Mutation testing: StrykerJS with the vitest runner needs `disableTypeChecks: false` (its `// @ts-nocheck` header breaks the
  "use client" first-line test) and `ignoreStatic: true` (static mutants rerun every test).
