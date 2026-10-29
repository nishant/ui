# The Fold check

A reusable GitHub Actions workflow that shows what a pull request does to an app's pages on
the devices Nish uses: the Galaxy Z Fold 7 cover screen (360), unfolded (840) and a desktop
(1440), each in light and dark. Every fleet app's `ui/*` and Dependabot PRs run it; the
[fan-out](../README.md) reads its result to decide whether to merge.

## What it checks

1. Builds the PR (the merge commit) and its base branch, each on its own port (5302 and 5301),
   with fixture data and no external secrets.
2. Screenshots the pages in the app's `fold.visual.json` at `phone-small` (360), `fold` (840)
   and `desktop` (1440), light and dark, as PNG, using `tools/visual-check.mjs`. The PR's config
   is used for both sides so the pages match.
3. The Fold rules run on both builds: no sideways page scroll, console errors, touch targets
   under 44px, axe violations, and the rest of the visual-check problems.
4. `tools/fold-diff.mjs` compares the two sides:
   - A problem counts as new when the PR has it and the base does not (numbers in the text are
     ignored, so "12px" and "13px" are the same problem). Problems already on the base never
     block a PR.
   - A pixel diff per shot (`pixelmatch`, threshold 0.1) gives the percentage of the page that
     changed.
5. Posts one comment on the PR (updated in place on every push, not posted for Dependabot) and
   uploads the `fold-report` artifact (14 days): `index.html` with Base, PR and Diff side by
   side, `summary.json`, the images and the two server logs.

The job fails when the PR has any new problem, or when the PR itself does not build or serve.
If the base does not build or serve, the job carries on with `baseOk: false`: every problem
counts as new and nothing is compared.

## Inputs

| input | type | default | meaning |
|---|---|---|---|
| `config` | string | `fold.visual.json` | visual-check config, path from `working-directory` |
| `install` | string | `npm ci` | install command, run in `working-directory` on both sides |
| `serve` | string | `npm run fold:serve` | starts the app on `$FOLD_PORT` and keeps running |
| `ready-path` | string | `/` | polled (up to 300 s) until it answers |
| `node-version` | string | `22` | Node for the app |
| `postgres` | boolean | `false` | start Postgres 16 and set `DATABASE_URL` |
| `working-directory` | string | `.` | folder holding the config and `package.json` |

`serve` gets `FOLD_PORT` (5301 for the base, 5302 for the PR) and `FOLD_SIDE` (`base` or
`head`). With `postgres: true` both sides share one database server, so the serve command
must create and use its own database, `fold_<FOLD_SIDE>`.

Each repo needs:

- `fold.visual.json` at the repo root: at most 6 pages, URLs like `http://127.0.0.1:{port}/…`
  (`{port}` is replaced by `--port`), `fullPage: true`, viewports `["phone-small", "fold",
  "desktop"]`, themes `["light", "dark"]`.
- `scripts/fold-serve.mjs` and `"fold:serve": "node scripts/fold-serve.mjs"` in `package.json`:
  builds the app and serves it on `FOLD_PORT` in the foreground with fixture data. Logins use
  the test password `fold-pass`, never a real one.

## Calling it

Each consumer has two workflows. `.github/workflows/pr.yml` runs the repo's checks on every PR;
keep its steps the same as the check job in `deploy.yml`:

```yaml
name: PR
on:
  pull_request:
permissions: { contents: read }
concurrency: { group: "pr-${{ github.event.pull_request.number }}", cancel-in-progress: true }
jobs:
  check:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps: []   # the same steps as the check job in deploy.yml; keep them in step
```

`.github/workflows/fold.yml` calls this workflow. It is separate so that adding a label never
reruns the checks, and a label other than `fold` gets its own concurrency group so it never
cancels a running Fold check:

```yaml
name: Fold
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]
concurrency:
  group: fold-${{ github.event.pull_request.number }}-${{ github.event.action == 'labeled' && github.event.label.name != 'fold' && github.run_id || 'run' }}
  cancel-in-progress: true
jobs:
  fold:
    permissions: { contents: read, pull-requests: write }
    if: (github.event.action != 'labeled' || github.event.label.name == 'fold') && (startsWith(github.head_ref, 'ui/') || github.actor == 'dependabot[bot]' || contains(github.event.pull_request.labels.*.name, 'fold'))
    uses: nishant/ui/.github/workflows/fold-check.yml@master
    with: { node-version: '22' }
```

The job only runs on `ui/*` branches, Dependabot PRs, or PRs labeled `fold`, to spare the
private repos' Actions minutes. Add the `fold` label to any other PR to get the report.

## Running it locally

From a checkout of the app, with the ui repo next to it (`..\ui`):

```sh
# 1. serve the base and the PR (two checkouts or worktrees), each in its own terminal
FOLD_PORT=5301 FOLD_SIDE=base npm run fold:serve     # in the base checkout
FOLD_PORT=5302 FOLD_SIDE=head npm run fold:serve     # in the PR checkout

# 2. screenshot both with the same config
node ../ui/tools/visual-check.mjs fold.visual.json --port 5301 --png --no-fail --out fold/base
node ../ui/tools/visual-check.mjs fold.visual.json --port 5302 --png --no-fail --out fold/head

# 3. diff them; open fold-report/index.html
node ../ui/tools/fold-diff.mjs fold/base fold/head --out fold-report
```

`fold-diff` exits 1 when the PR has new problems. On PowerShell set the variables with
`$env:FOLD_PORT = '5301'; $env:FOLD_SIDE = 'base'` before `npm run fold:serve`.

## Merge limits

The Fold check only reports. The fan-out (`.github/workflows/fanout.yml`) decides, and it
merges a bump PR by itself only when the repo's checks pass, the Fold check has no new problems
and the base rendered, and the largest page change is within the limit:

| PR | limit |
|---|---|
| `@nish/ui` patch update | 1% |
| `@nish/ui` minor update | 10% |
| Dependabot dependency update | 1% |

It holds the PR (reason in the `fan-out` commit status, shown on the PR and on
https://status.nish.software/fleet) for a major release, for release notes with
`### Behavior changes`, for a missing Fold report, for new problems, for a base that did not
render, and for a page change over the limit.
