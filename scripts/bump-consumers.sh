#!/usr/bin/env bash
# Open a PR in each consumer repo that moves @nish/ui to <tag>.
#   scripts/bump-consumers.sh v0.3.0            # clone, bump, push and open the PRs
#   scripts/bump-consumers.sh v0.3.0 --dry-run  # show each package.json change, push nothing
# Needs gh logged in as nishant. Either dependency form (github:nishant/ui#vX or
# https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX) is rewritten to the
# codeload form, which installs on the hosting PC runner (GitHub rejects its SSH key).
# Static sites in hosting vendor the CSS instead: there, move ui.json and run
# scripts/sync-ui.mjs by hand.
set -euo pipefail
tag="${1:?usage: bump-consumers.sh vX.Y.Z [--dry-run]}"
dry="${2:-}"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "tag must look like v0.3.0, got $tag" >&2; exit 2; }
url="https://codeload.github.com/nishant/ui/tar.gz/refs/tags/$tag"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# repo  package-dir  package-manager  base-branch
consumers=(
  "job-apps apps/web npm master"
  "trading apps/web pnpm master"
  "nishboard apps/renderer pnpm master"
  "nish.software . npm master"
  "status . npm master"
  "trackers . npm master"
)

# Rewrites the "@nish/ui" dependency in package.json ($1) to $url. Prints nothing;
# the caller compares the file before and after.
rewrite() {
  sed -E -i.bak \
    "s~(\"@nish/ui\"[[:space:]]*:[[:space:]]*\")(github:nishant/ui#v[^\"]+|https://codeload\.github\.com/nishant/ui/tar\.gz/refs/tags/v[^\"]+)(\")~\1$url\3~" \
    "$1"
  rm -f "$1.bak"
}

for line in "${consumers[@]}"; do
  read -r repo dir pm base <<<"$line"
  echo "== $repo"
  if ! gh repo clone "nishant/$repo" "$work/$repo" -- -q --depth 1 --branch "$base"; then
    echo "skip: cannot clone nishant/$repo ($base)"
    continue
  fi
  pkg="$work/$repo/$dir/package.json"
  if [ ! -f "$pkg" ] || ! grep -q '"@nish/ui"' "$pkg"; then
    echo "skip: $dir/package.json has no @nish/ui dependency"
    continue
  fi
  before="$(cat "$pkg")"
  rewrite "$pkg"
  if [ "$before" = "$(cat "$pkg")" ]; then
    echo "skip: already on $tag, or the @nish/ui spec is a form this script does not know:"
    grep '"@nish/ui"' "$pkg" || true
    continue
  fi
  grep '"@nish/ui"' "$pkg"
  if [ "$dry" = "--dry-run" ]; then continue; fi
  (
    cd "$work/$repo/$dir"
    git -C "$work/$repo" checkout -q -b "ui/$tag"
    if [ "$pm" = pnpm ]; then pnpm install --lockfile-only --silent; else npm install --package-lock-only --ignore-scripts --silent; fi
    git -C "$work/$repo" commit -qam "Move @nish/ui to $tag"
    git -C "$work/$repo" push -q -u origin "ui/$tag"
    gh pr create --repo "nishant/$repo" --base "$base" --head "ui/$tag" \
      --title "Move @nish/ui to $tag" \
      --body "Release notes: https://github.com/nishant/ui/releases/tag/$tag"
  )
done
