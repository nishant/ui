# CLAUDE.md — @nish/ui

The shared tokens, themes and React components of every *.nish.software app. How the
package is used: [README.md](README.md). Repo layout and dev commands: [docs/DEVELOPING.md](docs/DEVELOPING.md). How it is released, reaches the apps and npm (`nish-ui`): [docs/RELEASING.md](docs/RELEASING.md). Every release:
[CHANGELOG.md](CHANGELOG.md).

## Autonomy

Claude sessions build, commit, push, open and merge PRs and cut releases on their own judgment,
without asking Nish. A release runs in CI: merge the release's `## [x.y.z]` CHANGELOG entry to master, then
`gh workflow run release.yml -R nishant/ui -f bump=<patch|minor|major>`. It refuses unless HEAD is
origin/master, pushes master before the tag, creates the GitHub Release and starts the fan-out
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
  `git worktree remove`.
- `SystemCanvas` lives in `src/components/canvas/` (layout, route, follow, minimap, legend, node, view). The fit
  (`fitView`) and the layout pick (`chooseLayout`) share thresholds (`PHONE_K`, `SCROLL_K`): change them together, or
  a narrow canvas opens cut off mid-map. `tools/canvas-layout-check.mjs` and `canvas-route-check.mjs` cover layout and
  routing; check the first view at 360 and 840 in a browser too.
