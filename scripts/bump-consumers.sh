#!/usr/bin/env bash
# Move taarora/arora-home to <tag>: open a PR, merge it once it is green, and watch the
# deploy the merge starts. The nishant apps and hosting are moved by
# .github/workflows/fanout.yml, which starts from the tag `npm run release` pushes. This
# script is only for arora-home: another account owns it, so the fan-out token cannot write to it.
#   scripts/bump-consumers.sh v0.3.0             # bump, merge, confirm the deploy
#   scripts/bump-consumers.sh v0.3.0 --no-merge  # open the PR and stop
#   scripts/bump-consumers.sh v0.3.0 --dry-run   # show the change, push nothing
# Needs gh logged in as nishant (with write access to taarora/arora-home).
# taarora/arora-home vendors dist/ with its own palette pass instead of installing the
# package: there the bump is its scripts/sync-nish-ui.py, and the merge follows its
# CLAUDE.md rule 10 (pr_status.py, then a merge commit).
set -euo pipefail
# arora-home's pr_status.py prints arrows; Windows Python defaults to cp1252 and crashes on them.
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1
tag="${1:?usage: bump-consumers.sh vX.Y.Z [--dry-run|--no-merge]}"
mode="${2:-}"
case "$mode" in ''|--dry-run|--no-merge) ;; *) echo "unknown option $mode (use --dry-run or --no-merge)" >&2; exit 2;; esac
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "tag must look like v0.3.0, got $tag" >&2; exit 2; }
# The npm alias, as the fan-out writes it (tools/fanout/pin.mjs npmSpec).
url="npm:nish-ui@${tag#v}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# repo  package-dir  kind  base-branch  pr-ci  gate
#   kind   arora: run sync-nish-ui.py (the only kind left; the fan-out moves every other repo)
#   pr-ci  yes when the repo runs checks on pull requests; the merge waits for them
#   gate   run from the repo root before pushing ("-" for none). Repos without PR checks
#          build here instead, since their only check runs after the merge.
consumers=(
  "taarora/arora-home packages/arora-ui arora main yes -"
)

# Commit as the gh account when this machine has no git identity of its own (the hosting
# PC sets one per repo, not globally).
if [ -z "$(git config --global user.email || true)" ]; then
  read -r GIT_AUTHOR_EMAIL GIT_AUTHOR_NAME < <(gh api user -q '"\(.id)+\(.login)@users.noreply.github.com \(.name // .login)"')
  export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
fi

# A python that runs; on Windows `python3` can be the Store stub.
py=""
for p in python3 python; do
  if "$p" -c 'import sys' >/dev/null 2>&1; then py="$p"; break; fi
done

opened=()  # "repo number pr-ci branch" for each PR this run opened
failed=()

for line in "${consumers[@]}"; do
  read -r repo dir kind base ci gate <<<"$line"
  name="${repo#*/}"
  echo "== $repo"
  # autocrlf off: on Windows sed writes LF back over a CRLF checkout.
  if ! gh repo clone "$repo" "$work/$name" -- -q --depth 1 --branch "$base" -c core.autocrlf=false; then
    echo "skip: cannot clone $repo ($base)"
    failed+=("$repo: clone")
    continue
  fi
  root="$work/$name"

  if [ "$kind" = arora ]; then
    version="$root/$dir/VERSION"
    if [ "$(head -1 "$version")" = "tag $tag" ]; then echo "skip: already on $tag"; continue; fi
    head -1 "$version"
    if [ "$mode" = "--dry-run" ]; then echo "would run scripts/sync-nish-ui.py $tag"; continue; fi
    [ -n "$py" ] || { echo "skip: no python to run sync-nish-ui.py"; failed+=("$repo: no python"); continue; }
    branch="chore/packages-nish-ui-${tag//./-}"
    title="packages: move @nish/ui to $tag"
    if ! (cd "$root" && "$py" scripts/sync-nish-ui.py "$tag"); then
      echo "skip: sync-nish-ui.py $tag failed (palette or contrast check); left for a person"
      failed+=("$repo: sync-nish-ui.py")
      continue
    fi
    body="## What

\`packages/arora-ui/nish/\` is regenerated from @nish/ui $tag by \`scripts/sync-nish-ui.py\`, with the colour-blind palette pass applied.

## Why

A new @nish/ui release: https://github.com/nishant/ui/blob/$tag/CHANGELOG.md. Opened by nishant/ui \`scripts/bump-consumers.sh\`.

## Blast radius

- **Apps:** every app that loads \`/ui/\` restarts; only design-system styling changes
- **Shared code:** \`packages/arora-ui\`
- **Deploy:** the merge deploys itself

## Verified

- \`scripts/sync-nish-ui.py $tag\`: fetch, contrast and red/green checks passed
- **Not run:** the suites locally; CI runs them on this PR and the merge waits for them"
  else
    echo "skip: $repo has kind $kind; this script only moves arora-home (the fan-out moves the rest)"
    continue
  fi

  (
    cd "$root"
    git checkout -q -b "$branch"
    git add -A "$dir"
    git commit -qam "$title"
    git push -q -u origin "$branch"
  )
  pr_url="$(cd "$root" && gh pr create --repo "$repo" --base "$base" --head "$branch" --title "$title" --body "$body")"
  echo "$pr_url"
  opened+=("$repo ${pr_url##*/} $ci $branch")
done

if [ "$mode" = "--dry-run" ] || [ "$mode" = "--no-merge" ] || [ ${#opened[@]} -eq 0 ]; then
  [ ${#failed[@]} -eq 0 ] || { printf 'failed: %s\n' "${failed[@]}"; exit 1; }
  exit 0
fi

# Merge each PR once its checks pass, then watch the runs the merge commit starts.
deployed=()
for entry in "${opened[@]}"; do
  read -r repo num ci branch <<<"$entry"
  name="${repo#*/}"
  echo "== merge $repo#$num"
  if [ "$name" = arora-home ]; then
    # pr_status.py --wait passes on a PR with no checks yet: wait until GitHub lists at least one.
    for _ in $(seq 1 20); do
      [ -n "$(gh pr checks "$num" -R "$repo" 2>/dev/null)" ] && break
      sleep 15
    done
    if ! (cd "$work/$name" && "$py" skills/merge-pr/scripts/pr_status.py "$num" --wait); then
      echo "left open: pr_status.py says no"; failed+=("$repo#$num: checks"); continue
    fi
  fi
  if ! gh pr merge "$num" --repo "$repo" --merge; then
    failed+=("$repo#$num: merge"); continue
  fi
  git -C "$work/$name" push -q origin --delete "$branch" || true
  deployed+=("$repo $(gh pr view "$num" --repo "$repo" --json mergeCommit -q .mergeCommit.oid)")
done

for entry in "${deployed[@]}"; do
  read -r repo sha <<<"$entry"
  echo "== deploy $repo ${sha:0:7}"
  runs=""
  for _ in $(seq 18); do
    runs="$(gh run list --repo "$repo" --commit "$sha" --event push --json databaseId -q '.[].databaseId')"
    [ -n "$runs" ] && break
    sleep 5
  done
  [ -n "$runs" ] || { echo "no run started for $sha"; failed+=("$repo: no deploy run"); continue; }
  for id in $runs; do
    if gh run watch "$id" --repo "$repo" --exit-status >/dev/null; then
      echo "ok: $(gh run view "$id" --repo "$repo" --json workflowName,url -q '.workflowName + " " + .url')"
    else
      echo "FAILED: $(gh run view "$id" --repo "$repo" --json url -q .url)"
      failed+=("$repo: run $id")
    fi
  done
done

[ ${#failed[@]} -eq 0 ] || { printf 'failed: %s\n' "${failed[@]}"; exit 1; }
echo "All consumers on $tag."
