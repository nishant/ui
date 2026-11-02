# Developing @nish/ui

How this repo is laid out and how to run it. Using the package: [README](../README.md).
Releasing it: [RELEASING.md](RELEASING.md).

## Checks

```bash
npm run check        # typecheck, contrast, build, format/inbox/canvas checks, th-check, lint
npm run test:unit    # vitest
npm run test:tools   # node --test over tools/
npm run test:overlay # playwright
```

## The docs site

The site at https://design.nish.software is built from this repo's own `src` and `dist`, so it
always shows exactly the code being released.

```bash
npm run dev:site      # builds dist/, then serves the site at http://localhost:5191
npm run build:site    # builds dist/, then the static site into site-dist/
npm run preview:site  # serves site-dist/ at http://localhost:5191
```

`site-dist/` is plain static files with hash routes and relative asset URLs, so it works
served from any path. Props tables are generated from the TypeScript source at build time
(`site/docgen.mjs`), so add JSDoc to a prop and it shows up there. Component pages,
stories and controls live in `site/components/<id>.tsx`, one file per component;
`site/components/index.ts` lists them in `COMPONENT_DOCS`.

## Repo layout

| Path | What |
|---|---|
| `src/tokens.mjs` | Every design token. Edit here; the CSS is generated. |
| `src/theme.ts`, `src/theme-init.js` | Theme switching, and the pre-paint script. |
| `src/theme-global.ts` | Entry for `dist/theme.global.js` (`window.nishTheme`). |
| `src/components/` | The React components. |
| `src/chart.ts` | `@nish/ui/chart`: chart colors and tooltip styles. |
| `src/css/` | `base.css`, `components.css` (built to `dist/nish-components.css`), `fonts.css`. |
| `scripts/build.mjs` | Builds `dist/`: the CSS, hashed fonts, theme-init.js and the JS via tsup. |
| `scripts/release.mjs` | The release: check, version, tag with `dist/`, push, dispatch. |
| `tools/npm-publish.mjs` | Publishes a tag to npm as `nish-ui` (run by `publish.yml`). |
| `tools/fanout/` | The fan-out that moves every app to a new tag (`fanout.yml`). |
| `tools/fold-diff.mjs` | The Fold check every app's PRs run: [fold-check.md](fold-check.md). |
| `tools/contrast.mjs` | The WCAG check; the pairs are in `tools/contrast-rules.mjs`. |
| `tools/visual-check.mjs` | Screenshot and layout check for any site, at 360, 840 and desktop. |
| `scripts/bump-consumers.sh` | Moves taarora/arora-home only. |
| `site/` | The docs site. |
| `demo/` | A one-page gallery for quick checks: `npm run dev`, http://localhost:5190. |
