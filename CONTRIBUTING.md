# Contributing to nish-ui

Thanks for helping. This package is published on npm as `nish-ui`. Using it:
[README](README.md). Component docs: https://design.nish.software. Please follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node 20.19 or later (CI uses 24).

```bash
git clone https://github.com/nishant/ui.git
cd ui
npm ci
npm run dev:site   # builds dist/, serves the docs site at http://localhost:5191
```

Repo layout and every dev command: [docs/DEVELOPING.md](docs/DEVELOPING.md).

## Checks

Run these before opening a PR. CI runs them too.

```bash
npm run check        # typecheck, contrast, build, repo checks, lint
npm run test:unit    # vitest
npm run test:tools   # node --test over tools/
npm run test:overlay # playwright
```

## Writing a component

Follow the component contract in [docs/DEVELOPING.md](docs/DEVELOPING.md): colors come from the
theme roles (`th-*` classes), never raw values; every control works with the keyboard, in light
and dark, and in forced-colors mode; strings come from `NishProvider` strings, not literals;
touch targets are at least 44 px; nothing causes horizontal page scroll at 360 px.

Each component module has a unit test file next to it that pins its contract (roles, keyboard,
props, edge cases). A bug fix starts with a test that fails because of the bug.

## Docs page rule

A new or changed component, export or token updates, in the same PR:

- its page in `site/components/<id>.tsx` (and `site/components/index.ts` for a new one),
- the README when the public surface changes.

The README is the npm page: absolute links only, no table wider than 3 short columns.

## CHANGELOG

There are no changesets. Add your entry by hand to `CHANGELOG.md` under the next version
heading (Added, Changed, Fixed or Removed). Do not bump the version in `package.json`.

## Releases

Maintainers cut releases from master with the release workflow, which tags, publishes to npm
and updates the apps. Contributors do not tag or publish.

## Pull requests

Keep a PR to one change. Fill in the checklist in the PR template. Security problems go through
[SECURITY.md](SECURITY.md), not a public issue.
