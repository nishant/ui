# Fleet fan-out: automatic @nish/ui bumps, Fold-checked PRs and a fleet board

Status: in progress · Slug: fleet-fanout · Date: 2026-10-28 · Size: large
Repos: nishant/ui (spec lives here), nishant/hosting, nishant/status, nishant/nish.software,
nishant/nishant.github.io (local folder `startpage`), nishant/trackers, nishant/job-apps,
nishant/trading, nishant/nishboard, nishant/skills
ROADMAP: `ROADMAP.md` in nishant/ui, entry "Fleet fan-out"

## Goal

Today a new @nish/ui tag reaches the apps only when someone runs `scripts/bump-consumers.sh`
on the PC. That script is blocked there by the auto-mode classifier, it skips hosting, it
never looks at the pages, and it is why the apps sit on v0.7.0 while v0.7.1 is out and ~28
stale worktrees are left in `C:\Code`. This replaces it with one control plane: a GitHub
Actions fan-out in ui, a fleet list in hosting, a Fold check every app's PRs run, and a fleet
board in the status app.

Outcomes:
1. Pushing a `vX.Y.Z` tag to nishant/ui opens (or updates) a `ui/vX.Y.Z` PR in every repo in
   `hosting/fleet.yaml`, hosting included, within 5 minutes. An hourly run catches up on
   anything missed.
2. Each of those PRs runs the repo's checks plus the Fold check: the PR build and the base
   branch build are screenshot at 360, 840 and 1440 wide in light and dark, the Fold rules run
   on both, and a pixel diff per shot is posted as a PR comment and a downloadable report.
3. The fan-out merges a bump PR by itself when its checks pass, the Fold check finds no new
   problems and the pages changed less than the limit (1% for a patch, 10% for a minor). It
   holds the PR, with the reason in a `fan-out` commit status, when the release notes list
   behavior changes or any rule fails. After merging it watches the deploy, and reverts the
   merge if the deploy fails.
4. Dependabot opens one grouped minor-and-patch PR per repo per week. The same settle step
   merges it when green (dependency PRs use the 1% limit). This is the old `dep-sweep` idea.
5. https://status.nish.software/fleet (behind the status login) shows, per repo: the live and
   master @nish/ui version against the latest tag, the master CI state, merged-but-not-deployed
   commits, certificate expiry, 30-day uptime, open bump and dependency PRs with their state,
   and extra worktrees. This covers the old `whats-live` and `deploy-check` ideas.
6. `node scripts/tidy.mjs` in hosting lists, and with `--apply` removes, merged and clean
   worktrees under `C:\Code` (the old `tidy` idea). All fleet repos delete merged branches on
   GitHub.
7. Docs describe the new flow: ui README and CLAUDE.md, hosting docs, the ship and new-site
   skills. The five absorbed skill ideas are marked done in nishant/skills `ROADMAP.md`.

## Out of scope

- taarora/arora-home. It is owned by another account, so a token of Nish's account cannot
  write to it. It stays on `scripts/bump-consumers.sh`, run by a person.
- Moving `npm run release` itself into Actions. Releases are still cut by a person; the
  fan-out starts from the tag push.
- Showing running Claude sessions on the board (the status app cannot see them).
- Dependabot for GitHub Actions versions (merging workflow file changes needs a token with
  the Workflows permission; not worth it).
- Major dependency updates. Dependabot is told to ignore them.
- The trip-plan templates in nishant/skills that are stamped from hosting `ui.json`.
- Any change to Cloudflare, the firewall, `tailscale serve`, scheduled tasks or runners.

## Decisions

- **The fan-out runs in nishant/ui on GitHub's `ubuntu-latest` runners**, not on the PC. The
  PC runners run as SYSTEM with no GitHub credentials, and Linux avoids the Git Bash `tar`
  trap in hosting `scripts/sync-ui.mjs`. ui is public, so its Actions minutes are free.
- **One fine-grained token, `FLEET_TOKEN`, stored as an Actions secret in nishant/ui.** PRs
  opened and merged with the default `GITHUB_TOKEN` would not trigger the other repos' PR
  checks or deploys, and it cannot reach other repos at all. mc-packs' `HOSTING_TOKEN` is the
  precedent, including degrading to a job summary when the secret is missing. Creating it is
  Nish's step.
- **The fleet list is `hosting/fleet.yaml`, one entry per repo**, next to `sites.yaml` (one
  entry per host). nishboard has no host and hosting serves three, so the two lists cannot be
  one file. Flat `key: value` entries so the existing minimal parsers handle it.
- **The diff baseline is the PR's base branch built and rendered the same way, not the live
  URL.** (default; the idea said "against the live site") Live pages have changing data,
  logins (trackers, jobs, trading) and trading is tailnet-only, unreachable from GitHub's
  runners. The base branch is what is deployed (every merge deploys; the board flags when it
  is not), and rendering both on the same fixture data makes the diff show only what the
  library changed.
- **The Fold check fails only on problems that are new in the PR**, so a pre-existing problem
  in an app does not block every bump.
- **Merge policy lives in the fan-out, not in the Fold check.** The check reports; the fan-out
  knows the version jump and the release notes. Limits: patch 1%, minor 10%, dependency 1%.
  Majors (from 1.0) and any release whose CHANGELOG section has `### Behavior changes` are
  held: per the ui README those need code changes in the app.
- **The fan-out merges itself (`gh pr merge --merge --delete-branch`)**; GitHub auto-merge is
  off everywhere and the private repos cannot have required checks (no Pro). Merge commits
  match every repo's convention.
- **The hold reason is a commit status `fan-out` on the PR head**, so it shows on the PR and
  the board can read it without parsing comments. No labels are created.
- **Every fleet repo gets a `PR` workflow** (copy of its deploy check job, plus the Fold job).
  Trading and nishboard already have PR CI; trading gets the Fold job added to `ci.yml`,
  nishboard gets nothing (it is an Electron app, not viewed on the phone: `fold: no`).
- **The Fold job runs only on `ui/*` branches, Dependabot PRs, or PRs labeled `fold`**, to
  keep Actions minutes on the private repos (2,000 a month) for what needs it.
- **The board lives in the status app at `/fleet`, behind its existing login.** It already
  reads `sites.yaml`, probes uptime and calls the GitHub API. It shows private repo names and
  PRs, so it is not public.
- **Deployed sha and pin come from the live checkout on the PC** (`C:\Apps\<name>`), which the
  status app (SYSTEM) can read. No app's `/health` exposes a sha, and this needs no change in
  the apps.
- **tidy is a script in hosting that only deletes with `--apply`**, and never touches a dirty
  worktree or a folder that is not a git worktree. Folder deletion outside worktrees stays a
  person's job (hosting hard rule).
- **`bump-consumers.sh` keeps only arora-home**; `release.mjs` stops calling it and prints the
  fan-out run link instead. (default)
- **Every fleet repo gets `delete_branch_on_merge: true` and Dependabot security updates**,
  set by the release session with `gh api`. (default)
- Dependabot runs Mondays 06:00 America/Chicago, one `minor-and-patch` group per directory,
  at most 3 open PRs. (default)

## Current state

Read the GitHub copies: most local main checkouts in `C:\Code` are 13-60 commits behind.
Build in fresh worktrees off `origin/master` (every repo's default branch is `master`).

### ui (nishant/ui, public)
- `scripts/release.mjs`: guards, `npm run check`, bumps `package.json`, commits
  "Release vX.Y.Z" on master, builds `dist` + `site-dist` onto a detached "vX.Y.Z build"
  commit, tags it (annotated), pushes master then the tag (lines 45-46), then runs
  `bash scripts/bump-consumers.sh vX.Y.Z` unless `--no-bump` (lines 49-60).
- `scripts/bump-consumers.sh`: hardcoded consumer table (lines 26-41); rewrites the pin with
  sed (`rewrite()`, lines 64-69); npm lockfiles with `npx -y npm@10 install --package-lock-only
  --ignore-scripts` (npm 10 because the apps' CI npm rejects npm 11 lockfiles, lines 43-47);
  pnpm with `pnpm install --lockfile-only`; startpage also runs `npm run deploy` and commits
  `docs/`; opens `ui/vX.Y.Z` PRs titled "Move @nish/ui to vX.Y.Z" with body "Release notes:
  …/blob/vX/CHANGELOG.md"; merges `--merge`; watches the deploy for 90 s. Skips hosting
  (lines 14-15). Under `set -e` several failing commands abort the run instead of being
  recorded, so re-runs after a half-done run fail.
- `tools/visual-check.mjs` (325 lines): config `{name, pages[{name,url,waitFor,setup,settle,
  fullPage,viewports,themes,ignoreConsole}], viewports, themes, setTheme, fullPage, maxHeight,
  ignoreConsole, cookies}`; viewports at lines 33-42 (`desktop` 1440x900, `fold` 840x760,
  `phone-small` 360x740, and others); writes `<out>/<page>/<viewport>-<theme>.jpg` (JPEG
  q72, line ~262) and `<out>/report.json` (`{name,outDir,generated,shots[]}`; each shot has
  `page, viewport, theme, url, file, bytes, problems: string[]`, plus `error`, `note`, `axe`).
  Problems are strings, built at lines ~288-302. Exit 1 on any problem unless `--no-fail`.
  No baseline diff. Each shot gets a fresh browser context (line ~187).
- `tools/gallery.mjs`: a before/after HTML page for a person; not used here.
- `.github/workflows/ci.yml`: push to master and pull_request, `ubuntu-latest`, Node 24,
  `npm ci`, `npm run check`, Playwright, visual checks of demo and docs site.
- Playwright `^1.64.1` and `@axe-core/playwright ^4.14.0` are devDependencies. `npm run check`
  = typecheck + contrast + build + format-check.
- CHANGELOG sections are `## [x.y.z] - date` with `### Added/Changed/Fixed`, and breaking
  changes under `### Behavior changes` (see 0.7.0). Before 1.0 a breaking change bumps the minor.
- Tags: v0.7.1 (docs only) is the latest; every npm/pnpm consumer is on v0.7.0, hosting on v0.7.1.

### hosting (nishant/hosting, private)
- `sites.yaml`: 10 hosts, flat entries (`host, kind, repo, port, health, path, exposure`).
- `ui.json`: `{repo, tag, files{}, site{}}`; `scripts/sync-ui.mjs` moves the vendored copies
  in `minecraft/site/assets/nish/`, `static/trips/nish/` and `static/design/` to `tag`;
  afterwards `cd minecraft && node tools/stamp.mjs` restamps `?v=` links. `sync-ui.mjs
  --check --offline` verifies the hashes.
- `.github/workflows/deploy.yml`: push to master + dispatch, `[self-hosted, windows, hosting]`,
  runs `scripts/deploy.ps1`. No PR checks exist. `minecraft/tools/check-site.mjs` is the
  pre-push check (Playwright); `minecraft/tools/check-live.mjs` the post-deploy one.
- Script conventions: `.ps1` ASCII-only; Node scripts are ESM `.mjs`.

### status (nishant/status, private, https://status.nish.software, port 8803)
- Hono 4 server (`server/index.ts`), routes under `/api/private/*` are behind `requireAuth`
  (line 98). SPA with no router: `ui/src/App.tsx` always shows `StatusView`, adds `PcView`
  when authed; `/login` opens the Login modal (App.tsx:11-17). Server falls back to
  `index.html` for any path.
- SQLite via `node:sqlite` (`server/db.ts`, `CREATE TABLE IF NOT EXISTS` at start, no
  migrations). Collector `server/collector.ts`: every `CHECK_INTERVAL_MIN` (5) re-reads
  `SITES_FILE` (default `C:\Apps\hosting\sites.yaml`), probes, writes `checks`/`incidents`,
  takes a PC snapshot (`server/system.ts`, PowerShell). `COLLECT=0` disables probing.
- `server/sites.ts:18-35`: the flat yaml parser to copy for fleet.yaml.
- `server/github.ts:20-57`: `GITHUB_TOKEN` (fine-grained, today Actions read), latest run per
  repo, 10-minute cache. No token: panel hidden (`githubConfigured`).
- `server/queries.ts:38-77`: uptime windows per host (24h/7d/30d).
- UI: `useLoad(fn, deps, everyMs)` in `ui/src/lib/hooks.ts`; API types mirrored by hand in
  `ui/src/lib/api.ts`; local pills `Pill`, `StatePill`, `TonePill` in
  `ui/src/components/Status.tsx`. @nish/ui components in use: AppHeader, PageContainer,
  SectionHeader, Card, Callout, ResponsiveTable, AsyncPanel, Stat, StatGrid, StatGridSkeleton,
  Skeleton, Badge, StatusDot, Disclosure, RelativeTime, EmptyState, ErrorState, Modal.
- `scripts/seed.mjs` writes `shots-data/` (gitignored); `scripts/shots.mjs` screenshots views
  at 360x800, 840x900, 1440x900 light and dark against `--base`, failing on sideways scroll,
  console errors, targets under 44px. Seeded run: `PORT=18813 DATA_DIR=shots-data
  SITES_FILE=shots-data/sites.yaml COLLECT=0`.
- No tests. `deploy.yml`: push to master only, `check` job on ubuntu (Node 22: `npm ci`,
  `typecheck`, `build`), then deploy on `[self-hosted, windows, status]`.

### Consumers (GitHub master, 2026-10-28)

| Repo | Pin file | PM | Live checkout | Hosts | Deploy workflow | PR CI today | Login |
|---|---|---|---|---|---|---|---|
| nishant/nish.software | `package.json` | npm | `C:\Apps\nish.software` | nish.software | deploy.yml | none | none |
| nishant/nishant.github.io | `package.json` (+ `server/`) | npm | `C:\Apps\startpage` | start.nish.software | deploy.yml | none | none |
| nishant/status | `package.json` | npm | `C:\Apps\status` | status.nish.software | deploy.yml | none | `APP_PASSWORD` |
| nishant/trackers | `package.json` | npm | `C:\Apps\trackers` | trackers.nish.software | deploy.yml | none | `APP_PASSWORD` |
| nishant/job-apps | `apps/web/package.json` (root lockfile, workspaces) | npm | `C:\Apps\job-apps` | jobs.nish.software | deploy.yml | none | `SITE_PASSWORD` |
| nishant/trading | `apps/web/package.json` (root pnpm-lock) | pnpm 10.33 | `C:\Apps\trading` | trading.nish.software (tailnet) | ci.yml | ci.yml on PRs | `APP_PASSWORD` |
| nishant/nishboard | `apps/renderer/package.json` | pnpm 11.3 | none (Electron, releases) | none | release.yml | ci.yml on PRs | none |
| nishant/hosting | `ui.json` | vendored | `C:\Apps\hosting` | minecraft, trips, design .nish.software | deploy.yml | none | none |

- All repos: `allow_auto_merge: false`, `delete_branch_on_merge: false`. Branch protection is
  unavailable on the private ones; nishboard requires a PR with 0 approvals.
- startpage serves the committed `docs/` bundle; a bump must rebuild and commit `docs/`.
- Visual tooling to reuse: nish.software `tools/hub.visual.json` (ui's visual-check);
  trackers `scripts/mock-server.mjs` (built UI + seeded data, port `MOCK_PORT`, any non-empty
  password); trading `e2e/harness/server.ts` (seeded harness on 7439, `E2E_PASSWORD` in
  `e2e/harness/constants.ts`); status seed + `COLLECT=0`.
- The live sha of each app is `git -c safe.directory=* -C C:\Apps\<name> rev-parse HEAD`
  (SYSTEM owns those checkouts).

## Design

### The fleet list: `hosting/fleet.yaml`

```yaml
# Every repo the ui fan-out and the fleet board know about, one entry per repo.
# sites.yaml lists hosts; this lists repos. Keep both in step when adding an app.
#
#   ui:       npm | pnpm | vendored | none   how the repo pins @nish/ui
#   uiDir:    folder (from the repo root) holding package.json (npm, pnpm) or ui.json (vendored)
#   bump:     extra shell command run at the repo root after the pin and lockfile change
#   live:     live checkout on the PC, or none (then the latest GitHub release counts as deployed)
#   checkout: folder name under C:\Code (default: the repo name)
#   hosts:    comma-separated hosts from sites.yaml that this repo serves
#   deploy:   workflow file whose run on the base branch is the deploy
#   fold:     yes | no   whether its PRs run the Fold check

- repo: nishant/nish.software
  name: Hub
  base: master
  ui: npm
  uiDir: .
  live: C:\Apps\nish.software
  hosts: nish.software
  deploy: deploy.yml
  fold: yes
```

The full list, in this order:

| repo | name | ui | uiDir | bump | live | checkout | hosts | deploy | fold |
|---|---|---|---|---|---|---|---|---|---|
| nishant/nish.software | Hub | npm | . | | C:\Apps\nish.software | | nish.software | deploy.yml | yes |
| nishant/nishant.github.io | Startpage | npm | . | `npx -y npm@10 ci && npm run deploy` | C:\Apps\startpage | startpage | start.nish.software | deploy.yml | yes |
| nishant/status | Status | npm | . | | C:\Apps\status | | status.nish.software | deploy.yml | yes |
| nishant/trackers | Trackers | npm | . | | C:\Apps\trackers | | trackers.nish.software | deploy.yml | yes |
| nishant/job-apps | Jobs | npm | apps/web | | C:\Apps\job-apps | | jobs.nish.software | deploy.yml | yes |
| nishant/trading | Trading | pnpm | apps/web | | C:\Apps\trading | | trading.nish.software | ci.yml | yes |
| nishant/nishboard | Nishboard | pnpm | apps/renderer | | none | | | release.yml | no |
| nishant/hosting | Hosting | vendored | . | `node scripts/sync-ui.mjs && cd minecraft && npm ci && node tools/stamp.mjs` | C:\Apps\hosting | | minecraft.nish.software, trips.nish.software, design.nish.software | deploy.yml | yes |

Parsed type (both parsers produce this; empty or missing values become the defaults shown):

```ts
type FleetRepo = {
  repo: string;            // "nishant/status"
  name: string;            // default: repo name
  base: string;            // default "master"
  ui: 'npm' | 'pnpm' | 'vendored' | 'none';   // default "none"
  uiDir: string;           // default "."
  bump: string | null;
  live: string | null;     // "none" -> null
  checkout: string;        // default: repo name after the slash
  hosts: string[];         // split on ",", trimmed, empty removed
  deploy: string;          // default "deploy.yml"
  fold: boolean;           // "yes" -> true, anything else false
};
```

Parser rules (same as `status/server/sites.ts`): strip `#` comments (a `#` preceded by
whitespace or at line start), `- key: value` starts an entry, an indented `key: value` adds to
it, values are trimmed, entries without `repo` are dropped, unknown keys are ignored.

### Pin helpers (shared rules, implemented in ui `tools/fanout/pin.mjs` and status `server/fleet.ts`)

- npm/pnpm pin: the value of `dependencies["@nish/ui"]` or `devDependencies["@nish/ui"]` in
  `<uiDir>/package.json`. Its tag is the first match of `/(?:refs\/tags\/|#)(v\d+\.\d+\.\d+)/`;
  no match -> `null`.
- vendored pin: `tag` in `<uiDir>/ui.json`.
- Rewrite (ui only): replace the whole spec value with
  `https://codeload.github.com/nishant/ui/tar.gz/refs/tags/<tag>`, by string replacement on
  `/("@nish\/ui"\s*:\s*")[^"]+(")/` so the file's formatting is kept. Vendored: replace
  `/("tag"\s*:\s*")v\d+\.\d+\.\d+(")/`. No match: error `No @nish/ui pin in <path>`.
- Semver: `parse("v0.7.1") -> [0,7,1]`, compare numerically. `isPatch(a,b)` = same major and
  minor.

### The Fold check

**visual-check additions** (ui `tools/visual-check.mjs`, backwards compatible):
- `--port N`: every `{port}` in a page `url` and in `login.url` becomes `N`. A config with
  `{port}` and no `--port` exits 2 with `config uses {port}; pass --port`.
- `--png`: screenshots are PNG (`<viewport>-<theme>.png`, no `quality`). Default stays JPEG.
- Config `login: { url, body }`: after cookies are added and before `newPage`, run
  `await ctx.request.post(url, { data: body })` (the context shares its cookie jar). A non-2xx
  answer sets `shot.error = "login failed: <status>"`. A page with `"login": false` skips it.
- Page `mask: ["css selector", …]`: passed to every `page.screenshot` call (both paths) as
  `mask: sel.map((s) => page.locator(s))`, `maskColor: '#ff00ff'`. For live data that differs
  between two runs (times, reachability dots).
- Update the header comment to document the four additions.

**`tools/fold-diff.mjs <baseDir> <headDir> --out <dir> [--summary <file>]`** (new):
1. Read `<baseDir>/report.json` and `<headDir>/report.json`. A missing or unreadable base
   report means `baseOk = false`. A missing head report: print `no head report` and exit 2.
2. Match shots by `page|viewport|theme`.
3. Problem keys: each problem string with every number replaced by `#`
   (`s.replace(/\d+(\.\d+)?/g, '#')`). `newProblems` = head keys not in the matching base
   shot's keys (all head problems when `baseOk` is false or the shot is missing in base).
   `fixedProblems` = base keys not in head.
4. Pixel diff (`pngjs` + `pixelmatch`, threshold 0.1, `includeAA: false`) when both shots have
   a PNG file: pad both to the larger width and height (padding counts as different),
   `diffPct = round(diffPixels / (w*h) * 100, 2)`. Write `<out>/diff/<page>/<viewport>-<theme>.png`
   when `diffPct > 0`. No base shot or no file: `diffPct = null`.
5. Copy base and head images into `<out>/base/…` and `<out>/head/…` (same relative paths) and
   write `<out>/index.html`: a plain page, one row per shot sorted by `diffPct` descending
   (nulls first), three images side by side (Base, PR, Diff) at `width:100%` in a 3-column
   grid, with the page, viewport, theme, diff percentage and new problems as text above. No
   external assets. It must be readable on a phone (grid collapses to one column under 700px).
6. Write `<out>/summary.json`:
   ```ts
   type FoldSummary = {
     version: 1;
     baseOk: boolean;
     newProblems: number;            // total over shots
     maxDiffPct: number | null;      // null when !baseOk or no shot has a diff
     changedShots: number;           // shots with diffPct > 0.1
     shots: {
       page: string; viewport: string; theme: string;
       diffPct: number | null;
       newProblems: string[];        // the original head strings, not the keys
       fixedProblems: string[];
     }[];
   };
   ```
7. `--summary <file>`: append the markdown from `formatComment(summary)` (below) to it (used
   with `$GITHUB_STEP_SUMMARY`).
8. Exit 1 when `newProblems > 0`, else 0.
- Export `diffReports(base, head)` (pure, no files) and `formatComment(summary, artifactUrl?)`
  for tests and for `fold-comment.mjs`.

`formatComment` markdown (exact copy):

```
<!-- fold-check -->
### Fold check

**{newProblems} new problem(s)** · {changedShots} of {total} shots changed · largest change {maxDiffPct}%
```
then, when `!baseOk`: `The base branch did not render, so every problem counts as new and nothing is compared.`
then a table of at most 20 shots with `diffPct > 0.1` or new problems, sorted by diff:
`| Page | Size | Theme | Changed | New problems |` with Size as `360`, `840`, `1440` (from the
viewport width), Changed as `3.2%` or `—`, New problems joined with `<br>` (each cut to 120
chars) or `—`. Then `[Report with before, after and diff images]({artifactUrl})` when given.
When nothing changed and nothing is new: the heading plus `No new problems. No page changed.`

**`tools/fold-comment.mjs <summary.json>`** (new): builds the comment with `formatComment`
and upserts it on the PR: `GET /repos/{GITHUB_REPOSITORY}/issues/{PR}/comments?per_page=100`,
PATCH the first whose body starts with `<!-- fold-check -->`, else POST. Env: `GITHUB_TOKEN`,
`GITHUB_REPOSITORY`, `PR_NUMBER`, `ARTIFACT_URL`. Uses `fetch`, no dependencies. Any API
error: print it and exit 0 (a comment must never fail the check).

**Reusable workflow `nishant/ui/.github/workflows/fold-check.yml`** (`on: workflow_call`):

Inputs:

| input | type | default | meaning |
|---|---|---|---|
| config | string | `fold.visual.json` | visual-check config, path from `working-directory` |
| install | string | `npm ci` | install command |
| serve | string | `npm run fold:serve` | starts the app on `$FOLD_PORT` and keeps running |
| ready-path | string | `/` | polled until it answers |
| node-version | string | `22` | |
| postgres | boolean | false | start Postgres 16 and set `DATABASE_URL` |
| working-directory | string | `.` | |

Job `fold`, `runs-on: ubuntu-latest`, `timeout-minutes: 30`,
`permissions: { contents: read, pull-requests: write }`. Steps:
1. `actions/checkout@v4` into `head` (default ref = the PR merge commit).
2. `actions/checkout@v4` into `base` with `ref: ${{ github.event.pull_request.base.sha }}`.
3. `actions/checkout@v4` of `nishant/ui` at `master` into `.fold-ui`.
4. `actions/setup-node@v4` with `node-version` input; `corepack enable`.
5. If `postgres`: `docker run -d --name fold-pg -p 5432:5432 -e POSTGRES_PASSWORD=fold -e
   POSTGRES_DB=fold postgres:16` and wait for `pg_isready` (loop 30 × 1 s);
   `echo "DATABASE_URL=postgres://postgres:fold@127.0.0.1:5432/fold" >> $GITHUB_ENV`.
   Base and head share the database only if their serve commands use the same name; the
   serve command of a repo that needs a database must create `fold_<FOLD_SIDE>` itself.
6. `cd .fold-ui && npm ci --ignore-scripts && npx playwright install --with-deps chromium`.
7. Base: `cd base/<wd> && <install>`, then start `FOLD_PORT=5301 FOLD_SIDE=base <serve>` in
   the background with output to `$RUNNER_TEMP/fold-base.log`. `continue-on-error: true`.
8. Head: same with `head`, port 5302, `fold-head.log`. Not continue-on-error.
9. Wait for `http://127.0.0.1:5302<ready-path>` up to 300 s (`npx -y wait-on@8`); failing
   here fails the job. Then wait for 5301 the same way with `continue-on-error: true`.
10. `node .fold-ui/tools/visual-check.mjs head/<wd>/<config> --port 5301 --png --no-fail --out fold/base`
    (`continue-on-error: true`; the head's config is used for both sides so pages match).
11. Same with `--port 5302 --out fold/head`.
12. `node .fold-ui/tools/fold-diff.mjs fold/base fold/head --out fold-report --summary "$GITHUB_STEP_SUMMARY"`
    with `id: diff`; copy both logs into `fold-report/logs/`.
13. `actions/upload-artifact@v4`, `name: fold-report`, `path: fold-report`, `retention-days: 14`,
    `if: always()`; step id `upload` (its `artifact-url` output is the link).
14. `if: always() && github.actor != 'dependabot[bot]'`: `node .fold-ui/tools/fold-comment.mjs
    fold-report/summary.json` with `GITHUB_TOKEN: ${{ github.token }}`, `PR_NUMBER`,
    `ARTIFACT_URL: ${{ steps.upload.outputs.artifact-url }}`.
15. The job's result is the result of step 12 (it exits 1 on new problems).

**Per-repo Fold config** (each repo, `fold.visual.json` at the repo root unless noted):
- Viewports `["phone-small", "fold", "desktop"]`, themes `["light", "dark"]`, `fullPage: true`,
  at most 6 pages (36 shots a side). URLs use `http://127.0.0.1:{port}/…` (hosting uses
  `*.localhost:{port}`, which Chromium resolves to loopback).
- `scripts/fold-serve.mjs`: builds the app and serves it on `process.env.FOLD_PORT` (default
  the repo's usual preview port) with fixture data and no external secrets, and keeps running
  in the foreground. `package.json` gets `"fold:serve": "node scripts/fold-serve.mjs"`.
  Cross-platform (works from PowerShell for local runs): spawn with `shell: true`, forward
  signals, exit with the child's code.
- Logins use fixed test passwords set by fold-serve (`fold-pass`) and secrets
  (`fold-secret-0123456789abcdef0123456789abcdef`), never real ones.

### The fan-out (`nishant/ui`, `tools/fanout/`, `.github/workflows/fanout.yml`)

**Workflow `fanout.yml`:**

```yaml
name: fan-out
on:
  push:
    tags: ['v*.*.*']
  schedule:
    - cron: '17 * * * *'
  workflow_dispatch:
    inputs:
      tag: { description: 'Tag to fan out, or latest', default: latest, type: string }
      repo: { description: 'One repo (owner/name), or all', default: all, type: string }
permissions: { contents: read }
jobs:
  plan:    # ubuntu-latest; outputs `matrix`
  fanout:  # needs plan; if: needs.plan.outputs.matrix != '[]'
```

- `plan`: if `secrets.FLEET_TOKEN` is empty, write this job summary and set `matrix=[]`:
  `FLEET_TOKEN is not set, so nothing was fanned out. Create a fine-grained token (owner
  nishant; repositories: the ones in hosting/fleet.yaml; Contents, Pull requests and Commit
  statuses read and write, Actions read) and run: gh secret set FLEET_TOKEN --repo nishant/ui`.
  Otherwise fetch the list with `gh api repos/nishant/hosting/contents/fleet.yaml -H
  "Accept: application/vnd.github.raw" > fleet.yaml` and run `node tools/fanout/fleet.mjs
  fleet.yaml --matrix --repo <input or all> >> $GITHUB_OUTPUT` (prints `matrix=[{"repo":…},…]`).
- `fanout`: matrix `${{ fromJSON(needs.plan.outputs.matrix) }}`, `fail-fast: false`,
  `max-parallel: 8`, `timeout-minutes: 90`, job-level `concurrency: { group:
  fanout-${{ matrix.repo }}, cancel-in-progress: false }`. Steps: checkout ui with
  `fetch-depth: 0` (tags and CHANGELOG); setup-node 24; `corepack enable`; fetch fleet.yaml as
  above; `git config --global user.name "ui fan-out"` and `user.email
  "41898282+github-actions[bot]@users.noreply.github.com"`; run
  `node tools/fanout/fanout.mjs --fleet fleet.yaml --repo ${{ matrix.repo }} --tag <T> --wait <W>`
  with `GH_TOKEN: ${{ secrets.FLEET_TOKEN }}`, where `T` = `github.ref_name` on a tag push,
  the input on dispatch, `latest` on schedule, and `W` = 60 on push and dispatch, 0 on schedule.

**`tools/fanout/fanout.mjs`** CLI: `--fleet <file> --tag <vX.Y.Z|latest> [--repo owner/name|all]
[--wait <minutes>] [--dry-run]`. Uses `gh` and `git` with `GH_TOKEN`. `--dry-run` reads
everything and prints each action it would take (`would open PR`, `would merge #12`, …)
without pushing, commenting, setting statuses, merging or reverting. Runs one repo at a time
when `--repo all` (local use). Writes one markdown line per result to `$GITHUB_STEP_SUMMARY`
when set, and prints the same to stdout. Exit 1 only on an unexpected error or a failed revert.

`latest` = the highest `vX.Y.Z` from `git tag -l "v*"` in the ui checkout.

For each repo: `ui !== 'none'` -> `uiBump(entry, tag)`; then `settleDeps(entry)`.

`uiBump(entry, tag)`:
1. Read the pin on `base` (`gh api repos/R/contents/<uiDir>/<package.json|ui.json>?ref=<base>
   -H "Accept: application/vnd.github.raw"`). Unreadable: result `error`, `Could not read the pin`.
2. Pin ≥ tag: close every open PR whose head starts with `ui/v` with comment `Already on <pin>.`
   and `--delete-branch`; result `current`.
3. A merged PR titled `Revert "Move @nish/ui to <tag>"` exists (`gh pr list --state merged
   --search "in:title \"Revert \\\"Move @nish/ui to <tag>\""`): result `held`, `Reverted after
   a failed deploy; a session has to look`. Stop.
4. List open PRs with heads `ui/v*`. Any with a version above `tag`: result `skipped`,
   `Newer bump PR #<n> is open`. Any below `tag`: close with comment `Superseded by <tag>.` and
   `--delete-branch`.
5. Open PR with head `ui/<tag>` that GitHub reports `mergeable: CONFLICTING`: close it with
   comment `The base branch moved; opening a fresh one.` and `--delete-branch`, then treat as
   no PR.
6. No PR: clone `https://x-access-token:<GH_TOKEN>@github.com/R.git` with `--depth 1 --branch
   <base> -c core.autocrlf=false` into a temp dir; apply the pin rewrite; lockfile (npm: `npx -y
   npm@10 install --package-lock-only --ignore-scripts` at the repo root; pnpm: `corepack pnpm
   install --lockfile-only` at the root; vendored: none); run `bump` with `bash -c` at the root
   when set; `git add -A`; nothing staged -> result `error`, `Bump changed nothing`; commit
   `Move @nish/ui to <tag>`; `git push --force origin HEAD:refs/heads/ui/<tag>`; `gh pr create`
   with title `Move @nish/ui to <tag>` and the body below. A failing command: result `error`
   with the command and the last 20 lines of its output; nothing is pushed.
7. `settle(entry, pr, { kind: 'ui', from: pin, to: tag, behaviorChanges })`.

PR body (exact):

```
Moves @nish/ui from {pin} to {tag}. Opened by the ui fan-out.

{when behaviorChanges:}**Behavior changes:** this release asks apps to change code, so it will not merge by itself. Adopt it on this branch, then the fan-out merges it on its next run.

It merges by itself when the checks pass, the Fold check finds no new problems and pages change less than {limit}% ({patch|minor} update).

## Release notes

{the CHANGELOG sections for every version above {pin} up to {tag}, newest first, with ### headings turned into ####}
```

Release notes come from `git show <tag>:CHANGELOG.md` in the ui checkout:
`tools/fanout/changelog.mjs` exports `sections(text, fromVersion, toVersion)` -> `{ markdown,
behaviorChanges }`, taking each `## [x.y.z]` section with `from < x.y.z <= to`;
`behaviorChanges` is true when any of them contains a line `### Behavior changes`. No section
found: `markdown = "No CHANGELOG entry for <tag>."`, `behaviorChanges = false`.

`settleDeps(entry)`: every open PR authored by `app/dependabot`:
`settle(entry, pr, { kind: 'deps' })`. If it is `CONFLICTING` and has no comment from the
token's user containing `@dependabot rebase`, comment `@dependabot rebase` and skip it.

`settle(entry, pr, ctx)`:
1. Set the `fan-out` status on the head sha to `pending`, `Waiting for checks` (skip if
   already pending with the same description).
2. Poll every 30 s until the deadline (`--wait` minutes from start; 0 = one look):
   check runs (`GET /repos/R/commits/<sha>/check-runs?per_page=100`) plus commit statuses
   other than `fan-out`. `checks` = `pending` while any is queued or in progress, or none
   exist and the PR is younger than 10 minutes; `missing` when none exist after that;
   `failure` when any concluded `failure`, `cancelled`, `timed_out` or `action_required`;
   else `success`.
3. When `entry.fold` and checks are not pending: the newest `pull_request` workflow run for
   the head sha (`GET /repos/R/actions/runs?head_sha=<sha>&event=pull_request`) with an
   artifact named `fold-report`: `gh run download <id> -R R -n fold-report -D <tmp>`, read
   `summary.json`. None: `fold = 'missing'`. `entry.fold` false: `fold = null`.
4. `decide()` (below). `wait`: leave the status pending, result `checking`. `hold`: status
   `failure` with the reason, result `held`. `merge`: status `success`, `Merging`, then
   `gh pr merge <n> -R R --merge --delete-branch`; a failed merge: status `failure`,
   `Merge failed: <first line of error>`, result `held`.
5. After a merge with `--wait` > 0: find the run of `entry.deploy` on the merge commit
   (`GET /repos/R/actions/workflows/<deploy>/runs?head_sha=<mergeSha>&event=push`), polling
   for up to 20 minutes. `success`: result `merged`, `deployed`. Still running at the
   deadline: result `merged`, `deploy still running`. `failure`: revert (below).
6. Revert: clone the base at the latest commit, `git revert -m 1 --no-edit <mergeSha>`, push
   `revert/<n>`, open a PR titled `Revert "<original title>"` with body `The deploy after
   #<n> failed: <run url>. Reverting to keep the site up.`, wait up to 20 minutes for its
   checks (Fold ignored), merge with `--merge --delete-branch`. Result `reverted`. Any failure
   in this step: result `error`, `Deploy failed and the revert did not merge: <reason>`, and
   the process exits 1 so the run is red.

`tools/fanout/policy.mjs` exports `decide({ kind, from, to, behaviorChanges, checks, fold })`,
pure, first matching rule wins:

| # | When | Action | Reason (exact) |
|---|---|---|---|
| 1 | checks = pending | wait | `Waiting for checks` |
| 2 | checks = missing | hold | `No checks ran on this PR` |
| 3 | checks = failure | hold | `Checks failed` |
| 4 | kind ui, major(to) > major(from), major(to) ≥ 1 | hold | `Major release: a session has to adopt it` |
| 5 | kind ui, behaviorChanges | hold | `Release notes list behavior changes: a session has to adopt it` |
| 6 | fold = 'missing' | hold | `Fold report missing` |
| 7 | fold.newProblems > 0 | hold | `Fold check: {n} new problem(s)` |
| 8 | fold.baseOk = false | hold | `Fold check could not render the base branch` |
| 9 | fold.maxDiffPct > limit | hold | `Pages changed {x}% (limit {limit}% for a {patch|minor|dependency} update)` |
| 10 | otherwise | merge | `Checks passed` |

`limit` = 1 for `deps` and for ui patches (`isPatch(from, to)`), 10 for other ui updates. An
unparseable `from` counts as a minor. `fold = null` skips rules 6-9. Descriptions are cut to
140 characters.

`fanout-${{ matrix.repo }}` concurrency means a tag push and the hourly run never work on the
same repo at once. Every step is idempotent: re-running converges on the same PRs.

### The fleet board (status app)

**Server** — new env (in `server/env.ts`): `FLEET_FILE` (default `C:\Apps\hosting\fleet.yaml`),
`CODE_DIR` (default `C:\Code`), `FLEET_FIXTURE` (path to a JSON `FleetResponse`; when set,
`/api/private/fleet` returns it with `generatedAt` set to now and no GitHub or git calls are
made), `SYSTEM_SNAPSHOT` (`off` skips the PowerShell PC snapshot; used on Linux by fold-serve).

`GET /api/private/fleet` -> `FleetResponse` (behind `requireAuth`, under `/api/private/`):

```ts
type TlsInfo = { validTo: string | null; daysLeft: number | null; issuer: string | null;
  checkedAt: string; error: string | null; state: 'ok' | 'warn' | 'bad' };
type FleetPr = { number: number; title: string; url: string; kind: 'ui' | 'deps';
  state: 'checking' | 'held' | 'ready' | 'failing'; reason: string | null; openedAt: string };
type FleetRow = {
  repo: string; name: string; url: string;                       // https://github.com/<repo>
  hosts: { host: string; state: 'up' | 'failing' | 'down' | 'unknown'; up30d: number | null; tls: TlsInfo | null }[];
  ui: { live: string | null; master: string | null } | null;     // null when ui is none
  deployed: { sha: string; at: string | null } | null;
  master: { sha: string; at: string | null } | null;
  undeployed: { count: number; oldestAt: string | null } | null; // null when unknown
  ci: { state: 'passing' | 'failing' | 'running' | 'unknown'; url: string | null; at: string | null };
  prs: FleetPr[];                                                // ui/* and dependabot PRs only
  otherPrs: number;                                              // other open PRs
  worktrees: number | null;                                      // extra worktrees in CODE_DIR\<checkout>
  errors: string[];                                              // e.g. "GitHub: 403 on pull requests"
};
type FleetResponse = {
  generatedAt: string;
  githubConfigured: boolean;
  fleetError: string | null;                                     // fleet.yaml unreadable
  latestUi: { tag: string; at: string | null } | null;
  rows: FleetRow[];
  totals: { behind: number; prs: number; held: number; undeployed: number; failingCi: number; tlsWarn: number; worktrees: number };
};
```

How each field is filled (`server/fleet.ts`), refreshed by a collector every 5 minutes and
served from memory (the route never calls GitHub itself):
- `latestUi`: `GET /repos/nishant/ui/tags?per_page=30`, highest semver; `at` from
  `GET /repos/nishant/ui/commits/<sha>` `commit.committer.date`.
- `deployed`: `live` set -> `git -c safe.directory=* -C <live> log -1 --format=%H%n%cI`
  (`execFile`, 5 s timeout). `live` null -> `GET /repos/R/releases/latest`, its tag's commit
  via `GET /repos/R/commits/<tag_name>`.
- `master`: `GET /repos/R/commits/<base>`.
- `undeployed`: equal shas -> `{count: 0, oldestAt: null}`; else `GET
  /repos/R/compare/<deployed>...<master>` -> `ahead_by` and the first commit's committer date.
- `ui.live`: pin from `<live>/<uiDir>/package.json` or `ui.json` on disk (`live` null: from the
  release tag via contents API). `ui.master`: contents API on `base`.
- `ci`: `GET /repos/R/actions/workflows/<deploy>/runs?branch=<base>&per_page=1`; `in_progress`
  or `queued` -> running; conclusion `success` -> passing; `failure`, `cancelled`, `timed_out`
  -> failing; none -> unknown.
- `prs`: `GET /repos/R/pulls?state=open&per_page=50`; `kind ui` = head ref starts with `ui/v`,
  `deps` = user login `dependabot[bot]`; others count into `otherPrs`. `state` from the
  `fan-out` status on the head (`GET /repos/R/commits/<sha>/status`): `pending` -> checking,
  `failure` -> held (reason = its description), `success` -> ready; no `fan-out` status ->
  `checking`.
- `hosts`: state and 30-day uptime from the existing collector state and `queries.ts`; `tls`
  from the `tls` table.
- `worktrees`: `git -c safe.directory=* -C <CODE_DIR>\<checkout> worktree list --porcelain`,
  count of `worktree ` lines minus 1; folder missing -> null.
- `totals.behind`: rows whose `ui.live` is below `latestUi.tag`.
- GitHub calls go through one helper in `server/github.ts` (shared with the deploy panel):
  `Authorization: Bearer GITHUB_TOKEN`, `X-GitHub-Api-Version: 2022-11-28`, 10 s timeout.
  A 401/403/404 adds `GitHub: <status> on <what>` to that row's `errors` and leaves the field
  null; it never throws. No token: `githubConfigured: false`, only local fields are filled.
- Budget: about 8 calls per repo per round (≈ 65 per 5 minutes, well under 5,000 an hour).
  Payload under 30 KB.

**TLS** (`server/tls.ts`): every 6 hours and once at start, for every host in `sites.yaml`:
`tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 5000 })`,
read `getPeerCertificate()`; `error` = `socket.authorizationError` when not authorized, or the
connection error. `state`: `bad` when error or `daysLeft < 3`, `warn` when `< 14`, else `ok`.
Table `tls(host TEXT PRIMARY KEY, checked INTEGER, valid_to INTEGER, issuer TEXT, error TEXT)`
in `openDb`, upserted. Tailnet hosts work the same (their A record is the tailnet IP and the
PC is on the tailnet).

**UI** (`/fleet`):
- `App.tsx`: if `location.pathname === '/fleet'`, render `FleetView` instead of `StatusView`
  and `PcView`; when not authed, open the Login modal and render `FleetView` after login. The
  `/login` handling stays. `Header.tsx`: when authed, two links in the header, `Status` (`/`)
  and `Fleet` (`/fleet`), the current one marked `aria-current="page"`; plain `<a>` with full
  page loads is fine. Each is at least 44px tall.
- `useDocumentTitle('Fleet')`. Poll `/api/private/fleet` with `useLoad` every 60 s.
- Loading: `StatGridSkeleton` and three `Skeleton` rows. Fetch error: `ErrorState` with title
  `Could not load the fleet` and a `Try again` button. `fleetError`: `ErrorState` titled
  `Could not read fleet.yaml` with the message.
- `githubConfigured: false`: `Callout` (warning) `GitHub token not set. Add GITHUB_TOKEN to
  C:\Apps\status\.env with read access to Contents, Pull requests, Commit statuses and Actions
  on the fleet repos.`
- `SectionHeader` `Fleet` with `Updated <RelativeTime generatedAt>`.
- `StatGrid` of six `Stat`s: `Latest @nish/ui` (tag, hint `released <date>`), `Apps behind`,
  `Bump PRs` (hint `{held} held` when held > 0), `Not deployed` (commits), `CI failing`,
  `Certificates` (hint `expiring soon`, the warn+bad count). Values in warning tone when > 0.
- When any PR is held: `Callout` (warning) titled `{n} PR(s) need a look`, one `ListRow` per
  held PR: `{App} #{number}` linking to the PR, the reason under it.
- `ResponsiveTable` of rows, columns (header copy exact):
  - `App`: name, and the hosts as small links (`https://<host>`); nishboard shows `Desktop app`.
  - `@nish/ui`: live tag as a `Badge` (warning tone when below latest); when master differs,
    a second line `master {tag}`; `—` for `ui: none`.
  - `CI`: `StatePill` `passing` / `failing` / `running` / `unknown`, linking to the run.
  - `Not deployed`: `0`, or `{count} commits` with `oldest {relative}` under it; warning tone
    when the oldest is over 30 minutes old.
  - `Certificates`: the lowest `daysLeft` over the row's hosts as `{n} days`, tone by worst
    state, `error` text in its title attribute; `—` without hosts.
  - `Uptime 30d`: the lowest `up30d` over the hosts with `pct()`; `—` without hosts.
  - `PRs`: one `Badge` per PR, `#{n} {ui {tag}|deps} · {checking|held|ready|failing}`, tone by
    state, linking to it, with `+{otherPrs} other` after them when > 0; `None` when empty.
  - Row `errors` show as a small muted line under the App cell.
  - Default sort: rows with problems first (held PR, failing CI, warn/bad TLS, undeployed > 0,
    behind), then by name.
- `Disclosure` titled `Worktrees ({totals.worktrees})`: one line per repo with worktrees > 0,
  `{App}: {n}`, then `Remove the merged ones with: node scripts/tidy.mjs --apply (in
  C:\Code\hosting).`
- 360px: the table must render as the stacked card layout `ResponsiveTable` uses at narrow
  widths (research question 8), no sideways scroll; badges wrap. 840px and 1440px: table.
  Light and dark through the existing tokens only.

**Seed and shots**: `scripts/seed.mjs` also writes `shots-data/fleet.json`, a `FleetResponse`
with all 8 fleet repos and these cases: trading held (`Release notes list behavior changes: a
session has to adopt it`), status checking, job-apps with CI failing, startpage 3 undeployed
commits (oldest 2 hours ago), hosting a certificate with 9 days left, nishboard with no hosts,
a row with `errors: ["GitHub: 403 on pull requests"]`, 3 extra worktrees on ui-like rows.
`scripts/shots.mjs` gets a `fleet` view (logged in, `/fleet`) and the seeded run sets
`FLEET_FIXTURE=shots-data/fleet.json`.

### Security
- `/api/private/fleet` is behind `requireAuth`; nothing new is public. The board shows private
  repo names and PR titles, so it must stay behind the login.
- `FLEET_TOKEN` lives only as an Actions secret in nishant/ui; scripts read it from `GH_TOKEN`
  and never print it (clone URLs with the token are never logged: run git with output
  captured and redact `x-access-token:[^@]+@` before printing).
- The fan-out only pushes `ui/*` and `revert/*` branches and only merges PRs it opened or
  Dependabot's. It never pushes to a base branch.
- PR workflows run on GitHub's runners, never on the PC's SYSTEM runners, so dependency code
  from Dependabot PRs never runs on the PC.
- Fixture passwords and secrets in fold-serve are test values; real `.env` files are never read.
- The status app runs `git` read-only with `execFile` (no shell) on paths from fleet.yaml;
  validate that `live` and `checkout` match `/^[A-Za-z]:\\[\w .\\-]+$/` and
  `/^[\w.-]+$/` before use, otherwise add `Bad path in fleet.yaml` to the row errors.

### Performance
- Fold job: about 36 shots a side at most, 30-minute timeout. Base and head build in parallel
  in the background.
- Fleet collector: about 65 GitHub calls and 16 local git calls every 5 minutes, all in
  parallel per repo with a 10 s timeout; the route serves from memory.
- No change to `/api/public`.

### Mobile
- The board: 360, 840 and 1440 in light and dark, 44px targets, no sideways scroll (checked
  by `npm run shots`). The Fold report page collapses to one column under 700px.
- The Fold check itself enforces the same rules for every app.

### Ops
- New secret: `FLEET_TOKEN` in nishant/ui (Nish).
- Status `.env`: the existing `GITHUB_TOKEN` needs Contents, Pull requests and Commit statuses
  read (it has Actions read) on all fleet repos, nishboard and hosting included (Nish).
- No new ports, tasks, runners or Caddy changes.
- Repo settings (release session): `gh api -X PATCH repos/<r> -f delete_branch_on_merge=true`
  and `gh api -X PUT repos/<r>/automated-security-fixes` (after `PUT repos/<r>/vulnerability-alerts`)
  for every fleet repo.

## Tasks

Every task works in a fresh worktree: `git -C C:\Code\<folder> fetch` then
`git -C C:\Code\<folder> worktree add C:\Code\<folder>-fleet-fanout -b fleet-fanout origin/master`
(the ui one already exists). Commit with
`-c user.name="Nishant Arora" -c user.email="15331971+nishant@users.noreply.github.com"`.

### T1 visual-check additions
- Repo / checkout: ui at `C:\Code\ui-fleet-fanout`
- Owns: `tools/visual-check.mjs`
- Depends on: none
- Change: add `--port`, `--png`, `login`, page `mask` and page `login: false` exactly as in
  Design › The Fold check; update the header comment. Keep the argument parsing working with
  the new flags (the current `configPath` finder must skip values of `--port`).
- Edge cases: `--port` without a value -> exit 2; `login` with a page `login: false`; `mask`
  selector matching nothing (Playwright masks nothing, no error); `--png` with `maxHeight` clip.
- Acceptance: `npm run check`; `node tools/visual-check.mjs tools/site.visual.json` still works
  against `vite preview` (as ci.yml does); a temp config using `{port}`, `--png` and `mask`
  writes `.png` files with the masked area magenta.

### T2 fold-diff and tool tests
- Repo / checkout: ui at `C:\Code\ui-fleet-fanout`
- Owns: `tools/fold-diff.mjs` (new), `tools/fold-diff.test.mjs` (new), `package.json`,
  `package-lock.json`, `.github/workflows/ci.yml`
- Depends on: none
- Change: implement fold-diff as in Design. Add devDependencies `pixelmatch` (^7) and `pngjs`
  (^7). Add script `"test:tools": "node --test tools/*.test.mjs tools/fanout/*.test.mjs"`
  and a ci.yml step `npm run test:tools` after `npm run check`.
- Tests (`node:test`): `diffReports` with identical reports (0 new, 0%), a new problem whose
  number changed in base ("12px" vs "13px" counts as the same), a fixed problem, a missing base
  report (`baseOk false`, all problems new), different image sizes (padding counted),
  `formatComment` for the nothing-changed copy and the 20-row cap. Build tiny PNGs in the test
  with pngjs.
- Acceptance: `npm run check && npm run test:tools`.

### T3 Fold check workflow and comment
- Repo / checkout: ui at `C:\Code\ui-fleet-fanout`
- Owns: `.github/workflows/fold-check.yml` (new), `tools/fold-comment.mjs` (new),
  `docs/fold-check.md` (new)
- Reads: `tools/visual-check.mjs`, `tools/fold-diff.mjs` (interfaces from the spec)
- Depends on: none (interfaces fixed by the spec)
- Change: the workflow and comment script as in Design. `docs/fold-check.md`: what it checks,
  the inputs table, a caller example (the `PR` workflow below), how to run it locally (two
  `fold:serve` processes on 5301/5302, the two visual-check commands, fold-diff), and the
  merge limits.
- Caller example to put in the doc (every consumer copies it):
  ```yaml
  name: PR
  on:
    pull_request:
      types: [opened, synchronize, reopened, labeled]
  permissions: { contents: read, pull-requests: write }
  concurrency: { group: pr-${{ github.event.pull_request.number }}, cancel-in-progress: true }
  jobs:
    check:
      runs-on: ubuntu-latest
      steps: []   # the same steps as the check job in deploy.yml; keep them in step
    fold:
      if: startsWith(github.head_ref, 'ui/') || github.actor == 'dependabot[bot]' || contains(github.event.pull_request.labels.*.name, 'fold')
      uses: nishant/ui/.github/workflows/fold-check.yml@master
      with: { node-version: '22' }
  ```
- Edge cases: base fails to install or serve (job continues, `baseOk false`); head fails to
  serve (job fails with the head log in the artifact); Dependabot PR (no comment).
- Acceptance: `npx -y @action-validator/cli@0.6.0 .github/workflows/fold-check.yml` passes (or
  `actionlint` if available); `node --check tools/fold-comment.mjs`; the real run happens in
  the release on a consumer PR.

### T4 fan-out
- Repo / checkout: ui at `C:\Code\ui-fleet-fanout`
- Owns: `tools/fanout/fanout.mjs`, `tools/fanout/fleet.mjs`, `tools/fanout/pin.mjs`,
  `tools/fanout/changelog.mjs`, `tools/fanout/policy.mjs`, `tools/fanout/gh.mjs` (small
  wrappers over `gh api` / `git` with redaction), `tools/fanout/*.test.mjs` (new), and
  `.github/workflows/fanout.yml` (new)
- Depends on: none
- Change: everything in Design › The fan-out. `fleet.mjs` exports `parseFleet(text)` and
  runs as a CLI with `--matrix [--repo R]`, printing `matrix=<json array of {repo}>` for
  entries matching `--repo` (all when `all`); an unknown `--repo` prints `matrix=[]` and an
  error on stderr.
- Tests: `policy.test.mjs` (every row of the decide table, the 140-char cut, unparseable
  `from`), `changelog.test.mjs` (single version, skipped versions 0.6.1 -> 0.7.1 against the
  real CHANGELOG.md, behavior changes detection, no section), `pin.test.mjs` (codeload,
  `github:` and `#v` forms, devDependencies, vendored, formatting kept, no pin),
  `fleet.test.mjs` (defaults, comments, `none`, hosts list, unknown keys).
- Edge cases: listed in `uiBump` and `settle`. Also: `GH_TOKEN` missing -> exit 1 with
  `GH_TOKEN is not set`; a tag that does not exist in ui -> result `error`, `No tag <tag>`.
- Acceptance: `npm run test:tools`; with the session's own login,
  `GH_TOKEN=$(gh auth token) node tools/fanout/fanout.mjs --fleet ../hosting-fleet-fanout/fleet.yaml --tag v0.7.1 --repo all --dry-run`
  prints one planned action per repo and changes nothing.

### T5 release script and ui docs
- Repo / checkout: ui at `C:\Code\ui-fleet-fanout`
- Owns: `scripts/release.mjs`, `scripts/bump-consumers.sh`, `README.md`, `CLAUDE.md`
- Depends on: none
- Change:
  1. `release.mjs`: drop the `bump-consumers.sh` call and `--no-bump`; after the tag push
     print `Pushed vX.Y.Z. The fan-out opens the bump PRs: https://github.com/nishant/ui/actions/workflows/fanout.yml`
     and `arora-home is not in the fan-out: bash scripts/bump-consumers.sh vX.Y.Z`.
  2. `bump-consumers.sh`: the consumer table keeps only the `taarora/arora-home` line; the
     header comment says the nishant apps and hosting are moved by `.github/workflows/fanout.yml`.
  3. README: rewrite the release and consumer sections: release -> tag -> fan-out PRs ->
     Fold check -> merge policy (the limits and the hold reasons) -> deploy watch and revert;
     `FLEET_TOKEN` and its permissions; adding a repo means a `hosting/fleet.yaml` entry plus
     the `PR` workflow, `fold.visual.json`, `scripts/fold-serve.mjs` and `.github/dependabot.yml`;
     link `docs/fold-check.md` and https://status.nish.software/fleet. Fix the "Used by" table
     (every app pins the codeload tarball). Remove the hosting "by hand" bump steps.
  4. CLAUDE.md Autonomy: a release is `npm run release` (Nish runs it on the PC if the
     classifier blocks it); the fan-out moves every app; a held bump PR is adopted on its
     `ui/vX.Y.Z` branch and the fan-out merges it on its next run; check /fleet for what is
     behind.
- Acceptance: `npm run check`; `node --check scripts/release.mjs`; `bash -n scripts/bump-consumers.sh`.

### T6 fleet list, tidy and hosting docs
- Repo / checkout: hosting at `C:\Code\hosting-fleet-fanout`
- Owns: `fleet.yaml` (new), `scripts/tidy.mjs` (new), `sites.yaml` (header comment only),
  `CLAUDE.md`, `README.md`, `docs/OPERATIONS.md`
- Depends on: none
- Change:
  1. `fleet.yaml` exactly as in Design.
  2. `sites.yaml` header: one line `# Repos (versions, deploys, the ui fan-out) are listed in fleet.yaml.`
  3. `scripts/tidy.mjs` (Node, ESM, no dependencies, runs from PowerShell or Git Bash on the
     PC): `node scripts/tidy.mjs [--apply] [--remote] [--code C:\Code]`. For every folder
     directly in the code dir that has a `.git` directory (a main checkout):
     `git fetch --prune -q`; default branch from `git symbolic-ref refs/remotes/origin/HEAD`
     (fallback `master`); for each extra worktree from `git worktree list --porcelain`:
     `dirty` = `git -C <wt> status --porcelain` not empty; `merged` = its HEAD is an ancestor
     of `origin/<default>` (`git merge-base --is-ancestor`), or `gh pr list -R <owner/repo>
     --head <branch> --state merged --json number` is not empty (squash merges). Print a table
     `repo | worktree | branch | state` with state `merged, clean` / `dirty: kept` /
     `not merged: kept`. With `--apply`, run `git worktree remove <wt>` and `git branch -D
     <branch>` for merged and clean ones only. With `--remote` (needs `--apply`), delete remote
     branches merged into `origin/<default>` (`git branch -r --merged`, excluding the default
     and `HEAD`) with `git push origin --delete`. Also list, never delete: folders named
     `<repo>-<anything>` that are not worktrees (`not a worktree: delete by hand if unused`),
     and files in `docs/specs/` on `origin/<default>` (`leftover spec`). `gh` missing: skip the
     squash check and say so.
  4. CLAUDE.md: "Keep `sites.yaml` and `Caddyfile` in step" gains "and add a `fleet.yaml`
     entry for every new repo"; a short "Fleet" paragraph: what fleet.yaml is for, that the ui
     fan-out reads it from GitHub, that status reads it from `C:\Apps\hosting`.
  5. README: list `fleet.yaml` in the file overview; the ui bump is now a fan-out PR (remove
     the by-hand steps, keep `sync-ui.mjs` documented as what the fan-out runs).
  6. OPERATIONS.md: "Fleet and fan-out" section: the flow, where to look (/fleet, the
     `fan-out` status on a PR, the fan-out runs), how to re-run (`gh workflow run fanout.yml
     -R nishant/ui -f repo=nishant/hosting`), and tidy usage. "Adding a site" gains the
     fleet.yaml, PR workflow, Fold config and dependabot steps.
- Edge cases: tidy on a worktree whose folder is gone (`prunable` in porcelain) -> run
  `git worktree prune` under `--apply`; a main checkout with no `origin` -> skipped with a note.
- Acceptance: `node scripts/tidy.mjs` (dry run) on the PC lists the ~28 known stale worktrees
  and deletes nothing; `node -e "…"` parse of fleet.yaml with ui's `parseFleet` (after T4) gives
  8 entries.

### T7 hosting PR checks and Fold config
- Repo / checkout: hosting at `C:\Code\hosting-fleet-fanout`
- Owns: `.github/workflows/pr.yml` (new), `.github/dependabot.yml` (new),
  `scripts/fold-serve.mjs` (new), `fold.visual.json` (new)
- Depends on: none
- Change:
  1. `pr.yml` from the caller example. `check` job on ubuntu-latest, Node 24:
     `node scripts/sync-ui.mjs --check --offline`, then `cd minecraft && npm ci && npx
     playwright install --with-deps chromium && node tools/check-site.mjs`. The fold job
     `with: { install: 'cd minecraft && npm ci', serve: 'node scripts/fold-serve.mjs',
     node-version: '24' }`.
  2. `fold-serve.mjs`: one `node:http` static server on `FOLD_PORT` (default 5300) routing by
     the `Host` header: `design.localhost` -> `static/design`, `trips.localhost` ->
     `static/trips`, `minecraft.localhost` -> `minecraft/site`, anything else -> `200 ok`
     (the readiness probe). Directory requests serve `index.html`; content types for html,
     css, js, json, svg, png, jpg, webp, woff2, mcpack; paths are resolved and rejected if
     they leave the root. No build step.
  3. `fold.visual.json`: pages `design-home` (`http://design.localhost:{port}/`),
     `trips-home` (`http://trips.localhost:{port}/`), `minecraft-home`
     (`http://minecraft.localhost:{port}/`), `minecraft-realm` (`/realm/`, `maxHeight` 16000),
     and one big-build page and one design-site component page picked in research question 7.
  4. `dependabot.yml`: npm in `/minecraft`, the schedule and group from Decisions, ignore
     semver-major.
- Acceptance: locally `$env:FOLD_PORT=5301; node scripts/fold-serve.mjs` and in another shell
  `node C:\Code\ui-fleet-fanout\tools\visual-check.mjs fold.visual.json --port 5301 --png --no-fail --out $env:TEMP\fold-h`
  writes all shots; `pr.yml` validates.

### T8 status server: fleet, TLS and fixture
- Repo / checkout: status at `C:\Code\status-fleet-fanout`
- Owns: `server/fleet.ts` (new), `server/fleet.test.ts` (new), `server/tls.ts` (new),
  `server/github.ts`, `server/db.ts`, `server/collector.ts`, `server/index.ts`,
  `server/env.ts`, `server/system.ts` (the `SYSTEM_SNAPSHOT` switch only), `package.json`,
  `package-lock.json`, `tsconfig.server.json` (if tests need including), `.env.example`
- Depends on: none
- Change: everything in Design › The fleet board › Server and TLS. Export the types from
  `server/fleet.ts`. Add scripts `"test": "npm run build:server && node --test dist/server/*.test.js"`
  and `"fold:serve": "node scripts/fold-serve.mjs"` (the script itself is T10's). `.env.example`
  gains `FLEET_FILE`, `CODE_DIR` with comments and the token permissions line.
- Tests (`node:test`, compiled by tsc): `parseFleet` (same cases as ui), `pinOf` (package.json
  and ui.json forms), `tlsState` (days thresholds, error), `undeployed` when shas are equal,
  path validation.
- Edge cases: fleet.yaml missing (`fleetError`, rows empty, the rest of the app unaffected);
  a live folder missing (`deployed: null`, row error `Live checkout not found`); GitHub 403 on
  one endpoint (row error, other fields filled); no token; TLS connect timeout (`state: bad`,
  error `timeout`).
- Acceptance: `npm run typecheck && npm run build && npm test`; seeded run with
  `FLEET_FIXTURE` answers `/api/private/fleet` after login and 401 without.

### T9 status UI: the board, seed and shots
- Repo / checkout: status at `C:\Code\status-fleet-fanout`
- Owns: `ui/src/pages/FleetView.tsx` (new), `ui/src/App.tsx`, `ui/src/components/Header.tsx`,
  `ui/src/lib/api.ts`, `scripts/seed.mjs`, `scripts/shots.mjs`, `README.md`
- Reads: `server/fleet.ts` types (mirror them in `api.ts`)
- Depends on: none (types fixed by the spec)
- Change: everything in Design › The fleet board › UI and Seed and shots. README: the Fleet
  page, the new env vars, the token permissions, the seeded run with `FLEET_FIXTURE`.
- Edge cases: empty rows; a 40-character app name; 6 PR badges on one row; all states at once;
  logged out on `/fleet`.
- Acceptance: `npm run typecheck && npm run build`; `npm run seed`, start the seeded server
  (README "Rendering check" plus `FLEET_FIXTURE=shots-data/fleet.json`), `npm run shots --
  --only fleet,public,logged-in` with zero problems; look at the 360 and 840 pictures.

### T10 status PR checks and Fold config
- Repo / checkout: status at `C:\Code\status-fleet-fanout`
- Owns: `.github/workflows/pr.yml` (new), `.github/dependabot.yml` (new),
  `scripts/fold-serve.mjs` (new), `fold.visual.json` (new)
- Depends on: T8 for the `fold:serve` script entry and `SYSTEM_SNAPSHOT`
- Change: `pr.yml` with the deploy.yml check steps (Node 22: `npm ci`, `typecheck`, `build`)
  plus `npm test`. `fold-serve.mjs`: `npm run build`, `npm run seed`, then start
  `node dist/server/index.js` with `PORT=FOLD_PORT` (default 18813), `DATA_DIR=shots-data`,
  `SITES_FILE=shots-data/sites.yaml`, `COLLECT=0`, `SYSTEM_SNAPSHOT=off`,
  `FLEET_FIXTURE=shots-data/fleet.json`, `APP_PASSWORD=fold-pass`, the fixture
  `SESSION_SECRET`. `fold.visual.json`: `login` = `POST http://127.0.0.1:{port}/api/login`
  body `{"password":"fold-pass"}`; pages `public` (`/`, `login: false`), `logged-in` (`/`),
  `fleet` (`/fleet`). Mask relative-time elements if they differ between runs (find the
  `RelativeTime` output element). Dependabot: npm at `/`.
- Acceptance: run fold-serve locally on 5301 and visual-check against it: all shots written.

### T11 nish.software PR checks and Fold config
- Repo / checkout: nish.software at `C:\Code\nish.software-fleet-fanout`
- Owns: `.github/workflows/pr.yml`, `.github/dependabot.yml`, `scripts/fold-serve.mjs`,
  `fold.visual.json`, `package.json` (script only)
- Depends on: none
- Change: `pr.yml` check = Node 24 `npm ci`, `npm run typecheck`, `npm run build`; fold with
  `node-version: '24'`. fold-serve: `npm run build`, then `vite preview --host 127.0.0.1
  --strictPort --port <FOLD_PORT|4173>`. Config: page `home` (`/`, `waitFor: "main"`), mask
  the tile reachability dots (research question 6). Dependabot npm `/`.
- Acceptance: local fold-serve + visual-check writes 6 shots.

### T12 startpage PR checks and Fold config
- Repo / checkout: nishant.github.io at `C:\Code\startpage-fleet-fanout`
- Owns: `.github/workflows/pr.yml`, `.github/dependabot.yml`, `scripts/fold-serve.mjs`,
  `fold.visual.json`, `package.json` (script only)
- Depends on: none
- Change: `pr.yml` check = the deploy.yml check steps (Node 22: `npm ci`, typecheck,
  `npm test`, `vite build --outDir /tmp/build`, `server/` `npm ci` and typecheck). fold-serve:
  `vite build --outDir .fold-dist` then `vite preview --outDir .fold-dist --host 127.0.0.1
  --strictPort --port <FOLD_PORT|4174>` (add `.fold-dist` to `.gitignore`). Config: page
  `home`; `ignoreConsole` for failed `/api/` and trading watchlist requests; mask the weather
  and watchlist widgets (research question 5). Dependabot npm `/` and `/server`.
- Acceptance: local fold-serve + visual-check writes the shots with no console problems.

### T13 trackers PR checks and Fold config
- Repo / checkout: trackers at `C:\Code\trackers-fleet-fanout`
- Owns: `.github/workflows/pr.yml`, `.github/dependabot.yml`, `scripts/fold-serve.mjs`,
  `fold.visual.json`, `package.json` (script only)
- Depends on: none
- Change: `pr.yml` check = the deploy.yml check steps (Node 22: `npm ci`, typecheck, build,
  Playwright install, `npm test`, `npx tsx scripts/test-pricewatch.ts`). fold-serve:
  `npm run build` then `node scripts/mock-server.mjs` with `MOCK_PORT=FOLD_PORT`. Config:
  `login` against the mock (research question 4) with `fold-pass`; up to 6 pages from the
  views `scripts/shots.mjs` covers. Dependabot npm `/`.
- Acceptance: local fold-serve + visual-check writes all shots.

### T14 job-apps PR checks and Fold config
- Repo / checkout: job-apps at `C:\Code\job-apps-fleet-fanout`
- Owns: `.github/workflows/pr.yml`, `.github/dependabot.yml`, `scripts/fold-serve.mjs`,
  `fold.visual.json`, `package.json` (script only)
- Depends on: none
- Change: `pr.yml` check = the deploy.yml check steps (Node 24: `npm ci`, typecheck, `tsc -p
  packages/worker`, `npm run build -w apps/web`); fold with `postgres: true`,
  `node-version: '24'`. fold-serve, per research question 1: create database
  `fold_<FOLD_SIDE>` on `DATABASE_URL`, migrate, seed, build the web app and start the API
  serving it on `FOLD_PORT`, with `SITE_PASSWORD=fold-pass` and a fixture `AUTH_SECRET`.
  Config: `login` = `POST /api/auth/login`; pages: the main list, one job detail, settings
  (or the closest three from research). Dependabot npm `/`.
- Acceptance: with a local Postgres or Docker, fold-serve + visual-check writes all shots.
  If the PC has neither, the first real run is the release check.

### T15 trading Fold job
- Repo / checkout: trading at `C:\Code\trading-fleet-fanout`
- Owns: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `scripts/fold-serve.mjs`,
  `fold.visual.json`, root `package.json` (script only)
- Depends on: none
- Change: `ci.yml` pull_request trigger gains `types: [opened, synchronize, reopened,
  labeled]`; add the `fold` job (same `if:`) with `install: 'corepack enable && pnpm install
  --frozen-lockfile'`, `serve: 'pnpm fold:serve'`, the repo's Node version; the job must not
  run on push. fold-serve starts the e2e harness server (research question 2) on `FOLD_PORT`
  with its seeded data and `E2E_PASSWORD`. Config: `login` per the harness; pages: dashboard,
  one ticker, positions (or the closest three). Dependabot npm `/`.
- Acceptance: `pnpm check` unaffected; local fold-serve + visual-check writes all shots.

### T16 nishboard Dependabot
- Repo / checkout: nishboard at `C:\Code\nishboard-fleet-fanout`
- Owns: `.github/dependabot.yml`
- Depends on: none
- Change: npm at `/`, same schedule and group, ignore semver-major. Note: its release.yml reads
  the semver bump from the merge subject; merge commits give a patch release, which is right
  for dependency and @nish/ui bumps.
- Acceptance: the file validates (GitHub shows it under Insights › Dependency graph ›
  Dependabot after merge).

### T17 skills docs
- Repo / checkout: skills at `C:\Code\skills-fleet-fanout`
- Owns: `ROADMAP.md`, `skills/ship/references/release.md`, `skills/new-site/SKILL.md`
  (and the new-site reference file that lists the files a new repo gets, if separate)
- Depends on: none
- Change: `release.md`: the PR-checks line becomes "Every fleet repo runs a `PR` workflow on
  pull requests; @nish/ui bumps are opened and merged by the ui fan-out, so never hand-bump a
  consumer; look at https://status.nish.software/fleet after a release." new-site: a new repo
  also gets a `hosting/fleet.yaml` entry, the `PR` workflow (link ui `docs/fold-check.md`),
  `fold.visual.json`, `scripts/fold-serve.mjs` and `.github/dependabot.yml`. ROADMAP: leave
  the five ideas as they are in this task; the release session strikes `deploy-check`,
  `fold-check`, `whats-live`, `tidy` and `dep-sweep` with `Done <date>, absorbed into the ui
  fleet fan-out (nishant/ui#<PR>).`
- Acceptance: the files read correctly; no other skill files change.

## Waves

Every task is independent of the others' code (interfaces are fixed above), so all build in
wave 1, split across three Workflows run side by side:
- Workflow A (ui): T1, T2, T3, T4, T5
- Workflow B (hosting + status): T6, T7, T8, T9, then T10 (needs T8)
- Workflow C (apps + skills): T11, T12, T13, T14, T15, T16, T17

Each Workflow integrates per repo (full checks, one commit per repo on `fleet-fanout`).

## Review focus

- The fan-out's idempotency and failure paths: a re-run after every possible half-done state,
  the conflicting-PR path, the revert path, and that it never pushes a base branch.
- Token handling: no token in logs (clone URLs), `FLEET_TOKEN` only in ui's secrets.
- `decide()` against the table, and that Fold `newProblems` really ignores number changes.
- The Fold workflow on a real PR: base and head on separate ports, the base-failure path, the
  artifact link in the comment, Dependabot PRs skipping the comment.
- `/api/private/fleet` behind auth; path validation in fleet.ts; the collector never blocking
  `/api/public`.
- The board at 360 (stacked rows, badges wrapping), 840 and 1440, light and dark.
- tidy never removing a dirty or unmerged worktree.

## Release

Order, each merged (merge commit), deployed and verified before the next:
1. **ui**: PR `fleet-fanout` -> CI green -> merge. No package release is needed: the tools and
   workflows are used from `master`. Verify `gh workflow view fanout.yml -R nishant/ui` exists
   and a dispatch with no `FLEET_TOKEN` writes the "not set" summary.
2. **hosting**: PR -> merge -> deploy green -> `cd minecraft && node tools/check-live.mjs`.
   `C:\Apps\hosting\fleet.yaml` exists.
3. **status**: PR -> merge -> deploy green -> `https://status.nish.software/health` answers
   with a new `startedAt`; `/api/private/fleet` answers 401 without a session; `logs\app.log`
   in `C:\Apps\status` shows no fleet or TLS errors other than missing token permissions.
4. **apps** (nish.software, startpage, trackers, job-apps, trading, nishboard) and **skills**:
   one PR each -> merge -> deploy green -> health URL. Do not add the `fold` label to these
   rollout PRs (their base has no `fold:serve` yet).
5. Repo settings for every fleet repo (Design › Ops).
6. **End-to-end**: fan out v0.7.1 (docs-only, so every app should merge on its own):
   with `FLEET_TOKEN` set, `gh workflow run fanout.yml -R nishant/ui -f tag=v0.7.1`; without
   it, from the ui worktree `GH_TOKEN=$(gh auth token) node tools/fanout/fanout.mjs --fleet
   ../hosting-fleet-fanout/fleet.yaml --tag v0.7.1 --repo all --wait 60`. Expect 8 PRs (7 apps
   + hosting), each with a Fold comment, merged and deployed; nishboard gets a patch release.
   Any held PR: read the reason, fix the cause (a real new problem or a flaky diff that needs a
   `mask`), and re-run for that repo.
7. Verify /fleet live: every row on v0.7.1, CI passing, 0 not deployed. If the session cannot
   log in, the seeded shots plus the API 401 check stand in, and Nish looks next time.
8. Mark the ROADMAP entry done, strike the five skills ideas, delete this spec in the ui PR
   that completes it (or a follow-up docs commit with `[skip ci]` if the ui PR is already
   merged), and run `node scripts/tidy.mjs --apply` in hosting to clear the stale worktrees,
   including these `*-fleet-fanout` ones once merged.

Nish's steps (report them; never block on them): create `FLEET_TOKEN` and
`gh secret set FLEET_TOKEN --repo nishant/ui`; widen the status app's `GITHUB_TOKEN` to
Contents, Pull requests and Commit statuses read on every fleet repo.

## Open questions for the research phase

1. job-apps: the exact commands and env vars to migrate, seed and run the API serving the
   built web app against `DATABASE_URL` (and whether the API serves `apps/web/dist` itself),
   the login request body, and three representative routes.
2. trading: how to start `e2e/harness/server.ts` standalone on a chosen port (env var or arg),
   whether it serves the built web app, the login request it expects, and three routes.
3. status: does `node dist/server/index.js` boot on Linux with `COLLECT=0` once
   `SYSTEM_SNAPSHOT=off` skips `system.ts`, or does anything else call PowerShell?
4. trackers: the mock server's login endpoint and body, and the views `scripts/shots.mjs` covers.
5. startpage: selectors of the weather and watchlist widgets, and which requests fail with no
   server (for `ignoreConsole`).
6. nish.software: the selector of the tile reachability dots.
7. hosting: a design-site component page URL (hash or path) and a big-build slug with a
   moderate page height, for `fold.visual.json`.
8. @nish/ui `ResponsiveTable`: how it renders under ~640px (stacked cards or sideways scroll)
   and which prop sets the card title, so the board meets the 360px rule.
9. GitHub: confirm a fine-grained token with Contents + Pull requests write can merge a PR
   that changes no workflow files, and that Actions read is enough for `gh run download`.
