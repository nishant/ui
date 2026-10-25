#!/usr/bin/env bash
# Open a PR in each consumer repo that moves @nish/ui to <tag>.
#   scripts/bump-consumers.sh v0.2.0
# Needs gh logged in as nishant. Static sites in hosting vendor the CSS instead:
# there the PR also runs scripts/sync-ui.mjs.
set -euo pipefail
tag="${1:?usage: bump-consumers.sh vX.Y.Z}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# repo  package-dir  package-manager  base-branch
consumers=(
  "job-apps apps/web npm master"
  "trading apps/web pnpm master"
  "nishboard apps/renderer pnpm master"
  "nish.software . npm main"
  "status . npm master"
  "trackers . npm master"
)

for line in "${consumers[@]}"; do
  read -r repo dir pm base <<<"$line"
  echo "== $repo"
  gh repo clone "nishant/$repo" "$work/$repo" -- -q --depth 1 --branch "$base" || { echo "skip: cannot clone"; continue; }
  cd "$work/$repo/$dir"
  if ! grep -q '"@nish/ui"' package.json; then echo "skip: does not use @nish/ui"; cd - >/dev/null; continue; fi
  git -C "$work/$repo" checkout -q -b "ui/$tag"
  sed -i.bak -E "s#(\"@nish/ui\": \"github:nishant/ui\#)v[0-9.]+#\1$tag#" package.json && rm package.json.bak
  if [ "$pm" = pnpm ]; then pnpm install --lockfile-only --silent; else npm install --package-lock-only --ignore-scripts --silent; fi
  git -C "$work/$repo" commit -qam "Move @nish/ui to $tag"
  git -C "$work/$repo" push -q -u origin "ui/$tag"
  gh pr create --repo "nishant/$repo" --base "$base" --head "ui/$tag" \
    --title "Move @nish/ui to $tag" \
    --body "Release notes: https://github.com/nishant/ui/releases/tag/$tag"
  cd - >/dev/null
done
