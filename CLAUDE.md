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
Work is done only when it is merged, released, adopted by
the apps that need it, and confirmed live. Pick sensible defaults instead of asking; stop for
Nish only when it is critically necessary (credentials, account signups, anything
destructive to production data).

## Target Device

Every app built on this package is reviewed on a Samsung Galaxy Z Fold 7: a narrow cover
screen (about 360–390 CSS px) and a near-square ~840px unfolded. Components, and every page
that uses them, must look right with no horizontal page scroll at 360px, ~840px and desktop
width, in light and dark, with 44px touch targets. `tools/visual-check.mjs` checks those
sizes by default.

Every page must also be reachable on the phone through a visible UI element (BottomNav,
MoreSheet, a menu, or a link on another page), never only by typing its URL: no desktop-only
nav entries, and no page that tells a phone user to open it on a desktop.

## Workflows

Validate every workflow file before pushing: `npx -y @action-validator/cli@0.6.0 .github/workflows/<file>.yml`. A YAML
error (a plain `run:` value containing `: `) makes GitHub reject the whole file, so none of its triggers fire.
An empty `FLEET_TOKEN` (a `gh secret set` prompt that got no paste) also fails quietly: the fan-out's plan job
summary says "FLEET_TOKEN is not set". Re-set it and dispatch `fanout.yml` to check.
`release.yml` pushes with GITHUB_TOKEN, which does not trigger other workflows (so neither `ci` nor the
tag-push fan-out runs from it); `scripts/release.mjs --ci` dispatches `fanout.yml` itself.
