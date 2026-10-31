# CLAUDE.md — @nish/ui

The shared tokens, themes and React components of every *.nish.software app. How the
package is built, released and consumed: [README.md](README.md). Every release:
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

- A release whose major is higher than an app's pin (0.x → 1.0.0, 1.x → 2.0.0) is held in every app
  ("Major release: a session has to adopt it"). When nothing needs to change, adopt each `ui/vX.Y.Z` PR with an
  empty commit by someone other than `ui fan-out`; the next hourly run merges it once checks pass. A newer tag
  closes older open bump PRs ("Superseded"), so adopt only the newest.
- `npx playwright test` reuses a running harness server (`reuseExistingServer` locally); a leftover
  `vite --config tests/overlay/vite.config.ts` keeps a worktree folder locked on Windows. Stop it before
  `git worktree remove`.
