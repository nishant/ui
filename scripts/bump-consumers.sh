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
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "tag must look like v0.3.0, got $tag" >&2; exit 2; }
url="https://codeload.github.com/nishant/ui/tar.gz/refs/tags/$tag"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# repo  package-dir  kind  base-branch  pr-ci  gate
#   kind   npm | pnpm: rewrite package.json and the lockfile; arora: run sync-nish-ui.py
#   pr-ci  yes when the repo runs checks on pull requests; the merge waits for them
#   gate   run from the repo root before pushing ("-" for none). Repos without PR checks
#          build here instead, since their only check runs after the merge.
consumers=(
  "taarora/arora-home packages/arora-ui arora main yes -"
)

# The apps' CI runs Node 18/22, whose npm 10 `npm ci` rejects a lockfile written by npm 11:
# npm 11 drops optional peer entries npm 10 requires (startpage's deploy failed on exactly
# that, twice). So lockfiles are written, and the gate's `npm ci` run, with npm 10.
npm10() { npx -y npm@10 "$@"; }
export -f npm10

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

# Rewrites the "@nish/ui" dependency in package.json ($1) to $url. Prints nothing;
# the caller asks git whether the file changed.
rewrite() {
  sed -E -i.bak \
    "s~(\"@nish/ui\"[[:space:]]*:[[:space:]]*\")(github:nishant/ui#v[^\"]+|https://codeload\.github\.com/nishant/ui/tar\.gz/refs/tags/v[^\"]+)(\")~\1$url\3~" \
    "$1"
  rm -f "$1.bak"
}

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
    pkg="$root/$dir/package.json"
    if [ ! -f "$pkg" ] || ! grep -q '"@nish/ui"' "$pkg"; then
      echo "skip: $dir/package.json has no @nish/ui dependency"
      continue
    fi
    rewrite "$pkg"
    if git -C "$root" diff --quiet -- "$dir/package.json"; then
      echo "skip: already on $tag, or the @nish/ui spec is a form this script does not know:"
      grep '"@nish/ui"' "$pkg" || true
      continue
    fi
    grep '"@nish/ui"' "$pkg"
    if [ "$mode" = "--dry-run" ]; then continue; fi
    branch="ui/$tag"
    title="Move @nish/ui to $tag"
    body="Release notes: https://github.com/nishant/ui/blob/$tag/CHANGELOG.md"
    if [ "$kind" = pnpm ]; then
      (cd "$root/$dir" && pnpm install --lockfile-only --silent)
    else
      (cd "$root/$dir" && npm10 install --package-lock-only --ignore-scripts --silent)
    fi
    if [ "$gate" != "-" ] && ! (cd "$root" && bash -c "$gate"); then
      echo "skip: \`$gate\` failed on $tag; nothing pushed"
      failed+=("$repo: $gate")
      continue
    fi
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
    if ! (cd "$work/$name" && "$py" skills/merge-pr/scripts/pr_status.py "$num" --wait); then
      echo "left open: pr_status.py says no"; failed+=("$repo#$num: checks"); continue
    fi
  elif [ "$ci" = yes ]; then
    sleep 15  # let the pull_request runs register, or gh reports "no checks"
    if ! gh pr checks "$num" --repo "$repo" --watch --fail-fast >/dev/null; then
      echo "left open: checks failed"; failed+=("$repo#$num: checks"); continue
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
