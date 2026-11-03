# Releasing @nish/ui

How a release is cut, how it reaches every nish.software app, and how it reaches npm. For using
the package, see the [README](../README.md).

## Who consumes it

Used by:

| App | How it installs | Stack |
|---|---|---|
| nish.software (the hub) | npm alias | Vite + plain TypeScript and plain CSS (no React, no Tailwind): `nish.css`, `theme.js`; npm |
| jobs.nish.software (repo job-apps) | npm alias | React 19 + Tailwind 4 + Vite in `apps/web`, npm workspaces (`packages/worker` and `packages/api` pin it too) |
| trading.nish.software | npm alias | React 19 + Tailwind 4 + Vite in `apps/web` (`packages/server` pins it too), pnpm |
| Nishboard (desktop) | npm alias | Electron + React 19 + Tailwind 4 + Vite in `apps/renderer`, pnpm |
| status.nish.software | npm alias | React 19 + Tailwind 4 + Vite, Hono server, npm |
| trackers.nish.software | npm alias | React 19 + Tailwind 4 + Vite, Hono server, npm |
| workflows.nish.software | npm alias | React 19 + Tailwind 4 + Vite, Hono server, npm |
| start.nish.software (repo nishant.github.io) | npm alias | React 19 + Tailwind 4 + Vite, npm |
| inbox (nishant/inbox, no page of its own) | npm alias | Hono server, npm; no UI: it imports the inbox protocol from `@nish/ui/inbox-client` |
| minecraft, trips and design (nishant/hosting) | vendored dist files (plus the npm alias in `package.json`, for `@nish/ui/eslint`) | static HTML |
| nishant/mc-packs, nishant/skills | npm alias | no UI: only `@nish/ui/eslint` |
| taarora/arora-home | vendored dist files with a palette pass | another account's repo, outside the fan-out |

Every npm app pins the npm alias to an exact version, `"@nish/ui": "npm:nish-ui@X.Y.Z"`, so every app install is an npm download of `nish-ui`. The fan-out writes that form, and still reads the older codeload tarball and `github:` pins so it can migrate them. The list of repos is `fleet.yaml` in nishant/hosting.

The package keeps the name `@nish/ui` in this repo and in every tag. Only the npm copy is renamed
`nish-ui` (see "npm" below); the alias installs it under `node_modules/@nish/ui`, so every import
stays `@nish/ui/...`. Fallback without the npm registry: the tag's codeload tarball,
`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX.Y.Z"`, carries the same built files.

## Cutting a release

Releases run in CI. Merge the release's `## [x.y.z]` CHANGELOG entry to master, then:

```bash
gh workflow run release.yml -R nishant/ui -f bump=patch   # or minor, major, 1.2.3
```

The job refuses unless HEAD equals `origin/master`, pushes master before the tag, creates the GitHub
Release from the CHANGELOG entry, then dispatches `publish.yml` (npm) and `fanout.yml` itself, in that order
(a tag pushed with `GITHUB_TOKEN` does not trigger other workflows). `npm run release patch` is the local fallback with the same order.

The flow is: release, tag, npm publish, fan-out PRs, Fold check, merge policy, deploy watch and revert.

1. **Release.** The release runs `npm run check`, bumps the version on `master` and commits it, then
   makes a detached commit on top that adds the built `dist/` and `site-dist/`, tags it `vX.Y.Z` and
   pushes both. `master` never contains `dist/`; the tag does, so an install needs no build step.
   It then prints the link to the fan-out runs. Add an entry to `CHANGELOG.md` with every change;
   the docs site renders it.
2. **npm, then fan-out PRs.** `publish.yml` publishes the tag to npm as `nish-ui` first. The fan-out never
   points a bump PR at a version npm does not have: before any repo work it runs
   `npm view nish-ui@X.Y.Z version` and waits up to 15 minutes for it (none on the hourly run). Still
   missing, the repo's summary line says "nish-ui X.Y.Z is not on npm yet; the next run retries." and
   nothing is touched. Then `.github/workflows/fanout.yml` ("fan-out"), for every repo in
   `hosting/fleet.yaml` (hosting included) it opens or updates a `ui/vX.Y.Z` PR titled "Move @nish/ui to
   vX.Y.Z" within 5 minutes: it rewrites the pin, regenerates the lockfile, runs the repo's `bump`
   command, and puts the release notes in the PR body. A repo that pins @nish/ui in more than one package lists the
   others in `uiExtraDirs` (comma-separated, next to `uiDir`; job-apps: `packages/worker`): every
   folder's pin moves in the one PR, and the lockfile is regenerated once at the workspace root (or
   in each folder that has its own lockfile). A repo counts as current only when every folder is on
   the tag; an open bump PR that missed a folder gets a commit on its branch that moves it. An hourly run catches up on anything missed and
   closes bump PRs that a newer tag replaced. To run it by hand:
   `gh workflow run fanout.yml -R nishant/ui -f tag=vX.Y.Z -f repo=all` (`repo` can be one `owner/name`).
3. **Fold check.** Each bump PR (and each Dependabot PR) runs the repo's checks plus the
   [Fold check](fold-check.md): the PR and its base branch are built, screenshot at 360, 840 and
   1440 wide in light and dark, the Fold rules run on both, and a pixel diff per shot is posted as a PR
   comment and a `fold-report` artifact.
4. **Merge policy.** The fan-out merges a PR (`gh pr merge --merge --delete-branch`) when its checks
   pass, the Fold check finds no new problems and the pages changed less than the limit:

   | PR | Limit |
   |---|---|
   | ui patch (`0.7.0` to `0.7.1`) | 1% |
   | ui minor (`0.7.x` to `0.8.0`) | 10% |
   | Dependabot minor-and-patch group | 1% |

   Otherwise it holds the PR and writes the reason into a `fan-out` commit status on the PR head. The
   hold reasons are: no checks ran, checks failed, a major release (from 1.0), release notes with a
   `### Behavior changes` section, the Fold report missing, new Fold problems, the base branch could
   not be rendered, pages changed more than the limit, the PR changes `.github/workflows` (the token
   cannot merge those), or the merge itself failed. A held bump PR is adopted on its `ui/vX.Y.Z`
   branch (make the app's code changes there), and the fan-out merges it on its next run.
5. **Deploy watch and revert.** After a merge the fan-out follows the repo's deploy workflow. If the
   deploy fails it reverts the merge in a `revert/<n>` PR and merges that, and holds that tag for the
   repo until a session looks.

Each repo's matrix job writes one summary line per outcome. A held, checking, skipped or current
outcome leaves the job green; an `error` outcome (the repo cannot be reached, the pin cannot be read,
PRs cannot be listed or opened, a revert did not merge) fails the job after its summary is written,
so the run shows red. A repo the token cannot see says so plainly: "FLEET_TOKEN cannot reach
<repo>: add it to the token's Repository access".

Check https://status.nish.software/fleet (behind the status login) for what is behind: per repo, the
live and master `@nish/ui` version against the latest tag, CI state, and open bump and dependency PRs
with their `fan-out` status.

**`FLEET_TOKEN`.** The fan-out runs with one fine-grained personal access token stored as the Actions
secret `FLEET_TOKEN` in nishant/ui (the default `GITHUB_TOKEN` cannot reach other repos, and what it
opens does not trigger their checks or deploys). Owner nishant; repositories: every repo in
`hosting/fleet.yaml` and nishant/hosting itself (the plan job reads `fleet.yaml` from it); permissions:
Contents, Pull requests and Commit statuses read and write, Actions read (Metadata read is always
included). Set it with `gh secret set FLEET_TOKEN --repo nishant/ui`. Without it the run only writes
a job summary saying nothing was fanned out.

**Adding a repo to the fan-out.** Add an entry to `hosting/fleet.yaml`, then give the repo
the `PR` workflow (`.github/workflows/pr.yml`, its checks), the `Fold` workflow (`.github/workflows/fold.yml`, see [docs/fold-check.md](fold-check.md)), `fold.visual.json`,
`scripts/fold-serve.mjs` and `.github/dependabot.yml`.

**arora-home** (`taarora/arora-home`) vendors `dist/` with a colour-blind palette pass instead of
installing the package, and another account owns it, so the fan-out token cannot write to it. After a
release, run `bash scripts/bump-consumers.sh vX.Y.Z` yourself: it runs that repo's
`scripts/sync-nish-ui.py vX.Y.Z`, opens the PR, merges it after its `pr_status.py` passes (per its
CLAUDE.md) and watches the deploy. If the palette or contrast check fails on a new release, no PR is
opened and someone has to look.

**Static sites** (minecraft, trips, design) live in nishant/hosting, which is in the fan-out: its bump
PR runs `scripts/sync-ui.mjs` (it copies the vendored files from `dist/files.json` and updates their
hashes) and restamps the pages. `scripts/sync-ui.mjs --check --offline` fails CI if a vendored copy
was edited by hand.

## npm

Every release is also published to npm as **`nish-ui`** (`@nish` and `nish` on npm
belong to others). `scripts/release.mjs --ci` dispatches `.github/workflows/publish.yml`
with the new tag, after the fan-out. The workflow checks out master for its tooling and the tag
(which carries `dist/`) as the package, then runs `tools/npm-publish.mjs`, which:

1. checks the tag's `package.json` version matches the tag and that `dist/` is there;
2. skips with a job summary when that version is already on npm (reruns are safe);
3. renames the manifest to `nish-ui`, fills in `repository`, `homepage`, `bugs`
   and `license` when an old tag lacks them, and drops `scripts` and `devDependencies`;
4. runs `npm publish --access public --provenance --ignore-scripts`. A version older than
   the newest on npm goes out under the `previous` dist-tag so it never takes `latest`.

Auth is npm **trusted publishing** only (GitHub OIDC). There is no `NPM_TOKEN` secret, and the
package is set to require 2FA and disallow tokens, so a token could not publish anyway. The very
first publish (1.4.0) used a short-lived token, because npm sets a trusted publisher only on a
package that exists. Trusted publisher settings on npmjs.com (package `nish-ui` → Settings →
Trusted publishing): organization `nishant`, repository `ui`, workflow `publish.yml`, no
environment. Any failure (a version that does not match its tag, a tag without `dist/`, the
package missing from npm, a refused publish) turns the job red.

### Keeping npm in sync

- **Every release publishes.** `release.yml` dispatches `publish.yml` with the new tag; nothing
  is published by hand or from a laptop.
- **Check it.** After a release, `npm view nish-ui version` equals the newest tag
  (`git ls-remote --tags origin 'v*' | sort -t/ -k3 -V | tail -1`), and
  `npm view nish-ui dist.attestations` shows a provenance attestation. The package page is
  https://www.npmjs.com/package/nish-ui.
- **The README is the npm page.** npm shows the README of the published tag, so the README and the
  docs site change in the same PR as any component, export or token change. Keep the README short:
  absolute links only (npm does not resolve relative ones), no table wider than 3 short columns,
  detail on design.nish.software. `files` in `package.json` ships `dist` and `tsconfig`; check
  with `npm pack --dry-run` after `npm run build`.
- **The tarball contents.** `files` ships `dist` (minus `dist/esm/**/*.map`) and `tsconfig`. Besides
  the CSS, fonts and standalone JS, `dist/` has `esm/` (the preserved-modules build that bundlers
  load: one file per source module, `"use client"` kept per module), `tailwind-core.css`,
  `nish.min.css`, `nish-components.min.css`, `tokens.json`, `tokens.dtcg.json`, `theme-init.sha256`,
  `elements-all.js` and `fonts/LICENSE-Inter.txt`. `dist/files.json` lists what a static site
  vendors and carries `themeInitHash`. `npm run build` writes them all; `scripts/build.mjs` fails
  when one is missing.
- **Size checks.** `npm run size` (the last step of `npm run check`) bundles each import in
  `tools/size-budgets.json` and fails over its gzip budget, and fails when `npm pack --dry-run`
  reports an unpacked size over 2.5 MB. Lower a budget when a release shrinks an import; raising
  one needs a reason in the PR. Before a release also look at the pack list:
  `npm pack --dry-run` shows the new files and no `dist/esm` source maps.
- **The exports snapshot.** `tools/api-surface.snapshot.json` lists every runtime export per
  entry and every `.nish-*` class. After the final build, regenerate it with
  `UPDATE_API_SURFACE=1 node --test tools/api-surface.test.mjs`; a removal then shows in the diff
  and needs a major bump.
- **Major releases.** The CHANGELOG entry for a major has `### Breaking` and `### Behavior changes`
  sections, and `docs/MIGRATING-<major>.0.md` has before and after code for each. Every app's bump
  PR is held until a session adopts it (see the fan-out above), so write the app-side change for
  each fleet repo into the PR body or this file. 2.0.0: `hubHref` becomes `hub`, server-kit users
  pass `trustProxy` and keep `caseInsensitive: true` where they relied on it, Favicon and LinkCard
  users call `configureFavicons({ resolve: googleFavicon })`, `forwardRef`-typed usages get fixed.
- **A publish run fails.** Read the job summary and log
  (`gh run list -R nishant/ui -w publish.yml`, then `gh run view <id> --log-failed`). Fix the
  cause on master, then rerun for the same tag: `gh workflow run publish.yml -R nishant/ui -f tag=vX.Y.Z`
  (a version already on npm is skipped, so reruns are safe). An OIDC or 403 error means the trusted
  publisher on npmjs.com no longer matches (`nishant` / `ui` / `publish.yml`, no environment): that
  is a step for Nish (`MANUAL-STEPS.md` in nishant/skills), never a token.

To publish a tag by hand: `gh workflow run publish.yml -R nishant/ui -f tag=vX.Y.Z`.
To see what would be published without publishing: `node tools/npm-publish.mjs <tag-checkout> --dry-run`.
