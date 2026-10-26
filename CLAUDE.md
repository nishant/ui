# CLAUDE.md — @nish/ui

The shared tokens, themes and React components of every *.nish.software app. How the
package is built, released and consumed: [README.md](README.md). Every release:
[CHANGELOG.md](CHANGELOG.md).

## Autonomy

Claude sessions build, commit, push, open and merge PRs, cut releases (`npm run release`),
and bump consumers (`scripts/bump-consumers.sh`, then merge and deploy those PRs) on their
own judgment, without asking Nish. Work is done only when it is merged, released, adopted by
the apps that need it, and confirmed live. Pick sensible defaults instead of asking; stop for
Nish only when it is critically necessary (credentials, account signups, anything
destructive to production data).

## Target Device

Every app built on this package is reviewed on a Samsung Galaxy Z Fold 7: a narrow cover
screen (about 360–390 CSS px) and a near-square ~840px unfolded. Components, and every page
that uses them, must look right with no horizontal page scroll at 360px, ~840px and desktop
width, in light and dark, with 44px touch targets. `tools/visual-check.mjs` checks those
sizes by default.
