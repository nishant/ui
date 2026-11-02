# nish-ui everywhere: npm by default, then web components

Status: ready to build · Slug: nish-ui-everywhere · Date: 2026-11-02 · Size: large
Repos: nishant/ui (spec lives here), nishant/status, nishant/skills, nishant/artifacts; Stage F also nishant/nish.software and nishant/hosting
ROADMAP: `ROADMAP.md`, "npm is the default install" and "Web components so @nish/ui works everywhere"

Three stages, each its own PR(s) and release. Stage A must be live (every app installs from npm)
before Stage B starts. Stage C (rebuild every artifact on artifacts.nish.software on the design
system) starts once Stage B is released.

## Goal

People outside nish.software can install the design system from npm and use it in any stack,
not only React. Today every release is already on npm as `nish-ui`, but no app installs it from
there. Outside React there are only CSS classes and imperative helpers.

1. Every fleet app pins `"@nish/ui": "npm:nish-ui@X.Y.Z"`, and the fan-out keeps it that way.
2. A release never bumps an app to a version that is not on npm yet.
3. status.nish.software/fleet reads the new pin and shows every app as current.
4. The README, docs/RELEASING.md, design.nish.software and the new-site template lead with npm.
5. `nish-ui/elements` ships `<nish-theme-toggle>`, `<nish-sheet>`, `<nish-dialog>`,
   `<nish-bottom-nav>` and `toast()`, which work in plain HTML, any framework and Claude artifacts.
6. React apps change nothing and never load Lit.
7. Each of those components has an HTML tab on its design.nish.software page, and a parity test
   fails when the element version differs from the React one.
8. The `artifacts` and `trip-plan` skills can use the elements.
9. Every artifact on artifacts.nish.software (ballot-2026, hosting-box, kpot, poker,
   popcorn-roll, sn640-guide) is rebuilt on the design system, on claude.ai and in the hosted
   copy. All color, type, spacing and radius come from `--nish-*` tokens and `nish-*` classes,
   and every interactive piece that wave 1 covers uses the elements. No page keeps its own palette
   or a `theme.css` bridge.
10. Each rebuilt artifact keeps its content, its behavior and its saved data (storage keys and
    `window.claude` use) exactly.
11. The artifacts.nish.software index page and top bar use the design system too: link cards,
    `<nish-theme-toggle>`, and no hand-rolled copies of `nish-*` styles in `src/wrap.ts`.

## Out of scope

- Angular, Vue or Svelte wrappers. Custom elements already work in those frameworks.
- Changing any React component, prop or export.
- `@lit/react` wrappers. React users keep the React components.
- Server-side rendering of elements.
- Elements for wave 2 (forms, combobox, tabs, segmented, list row, feedback, display) and wave 3
  (table, filters, media, split, nav, settings, command palette, charts) in Stages A-C. Stages D-F
  at the end of this file cover them.
- Moving taarora/arora-home off its vendored copy.
- Changing what an artifact says or does: ballot races and candidates, commands in sn640-guide,
  prices, poker math and the popcorn genre list stay exactly as they are. Stage C is a visual and
  structural rebuild only.
- Trip pages on trips.nish.software (B5 covers their theme button only).

## Decisions

- The npm pin is an alias, `"@nish/ui": "npm:nish-ui@X.Y.Z"`, exact version, no caret. Every
  import (`@nish/ui`, `@nish/ui/tailwind.css`, ...) keeps working, and the fan-out stays the only
  thing that moves versions.
- The codeload tarball stays documented as a fallback. The fan-out still reads old codeload and
  `github:` pins so it can migrate them.
- npm publish runs before the fan-out, and the fan-out refuses to bump to a version npm does not
  have yet. The next hourly run retries.
- Elements are thin custom elements over what already exists: the `nish-*` classes in
  `src/css/components.css` (the look) and the helpers in `src/theme.ts` (`mountThemeToggle`,
  `openSheet`, `showToast`). There is one implementation of look and behavior for static pages
  and elements. React keeps its own Tailwind markup, and the parity test guards the gap.
- Elements use Lit 3 with light DOM (`createRenderRoot() { return this; }`), so the
  zero-specificity `nish-*` classes and the page's own CSS apply. Lit gives later waves (combobox,
  table) templating and reactive attributes without each component inventing its own.
- Button, card and the other static pieces get no element. A custom-element button breaks form
  submission, and `.nish-btn` and `.nish-card` already exist. Their docs pages get the HTML tab
  showing the class.
- `dist/elements.js` is one self-contained ESM file with Lit bundled in and no shared chunks,
  because static sites vendor single files (the v1.0.0 lesson in `tsup.config.ts`). Lit is a
  devDependency, so the published package has no runtime dependency on it.
- Elements never inject CSS. Pages link `nish.css` (or `tokens.css` + `fonts.css`) and
  `nish-components.css`, as static pages do now.
- Tag prefix `nish-`, events prefixed `nish-` (default).
- Size budget: `dist/elements.js` at most 20 KB gzipped (default).
- Artifacts are rebuilt on claude.ai and re-imported, never by editing `source.html`
  (artifacts' CLAUDE.md rule). Each is republished to its own URL, so the link is kept.
- A rebuilt artifact runs on its own in claude.ai. It inlines `tokens.css` and
  `nish-components.css` in `<style data-nish-ui>` blocks (claude.ai allows stylesheets only from
  Google Fonts), loads Inter from Google Fonts, loads `elements.js` from
  `cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements.js`, and declares
  `<meta name="nish-ui" content="X.Y.Z">`. With no `data-theme` set, tokens.css follows the OS, so
  light and dark work in claude.ai without extra code.
- The hosted copy always uses the site's current design system, not the version the artifact
  inlined. When `src/wrap.ts` sees `<meta name="nish-ui">`, it drops the `<style data-nish-ui>`
  blocks and the jsdelivr elements script, and uses the vendored, cache-stamped `/nish/` files
  instead. That keeps hosted pages first-party (no CDN) and current.
- One artifact per task, run by the orchestrating session itself, not by Workflow subagents,
  because each needs the Artifact tool and the `artifact-design` skill. Run them in the order of
  the C tasks; each is republished and re-imported before the next starts.
- An element or class missing from wave 1 (a tab strip, a segmented control) is built from
  `nish-*` classes and tokens inside the artifact, and noted for wave 2. It never gets a private
  palette.

## Current state

- **Package.** `package.json` name `@nish/ui`, version 1.4.1. `tools/npm-publish.mjs` renames it
  to `nish-ui` on publish (`.github/workflows/publish.yml`, trusted publishing, no tokens).
  `npm view nish-ui version` = 1.4.1.
- **Pins.** Every fleet app has `"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/vX.Y.Z"`.
  This is written by `tools/fanout/pin.mjs` `rewritePin()` (line ~64) and read by `pinOf()`
  (`TAG_RE`, line 4). `scripts/bump-consumers.sh` (lines 19 and 55) does the same by hand.
  `tools/fanout/fanout.mjs` line ~183 regenerates lockfiles (`npm install --package-lock-only`,
  `corepack pnpm install --lockfile-only`). Tests are in `tools/fanout/pin.test.mjs` and
  `fanout.test.mjs`. Fleet kinds are `npm | pnpm | vendored | none` (`tools/fanout/fleet.mjs`).
- **Release order.** `scripts/release.mjs` lines 79-87 dispatch `fanout.yml` and then
  `publish.yml`, so bump PRs can point at a version that is not on npm yet.
- **status.** `status/server/fleet.ts` line 122 has its own `TAG_RE` and `pinOf()` (line 147),
  tested in `status/server/fleet.test.ts`. An npm alias pin reads as "no pin".
- **Docs naming the codeload pin.** `README.md` (Install, around line 17-40, already shows
  `npm install nish-ui` and the alias `@nish/ui@npm:nish-ui`), `docs/RELEASING.md` line 24,
  `site/pages/getting-started.tsx`, `site/components/copy-button.tsx`, `docs/adoption/COMPONENTS.md`,
  and `skills/new-site/references/app-template.md` in nishant/skills.
- **Static layer to build on.** `src/css/components.css` (built to `dist/nish-components.css`,
  every selector in `:where()`) has `.nish-theme-btn`, `.nish-sheet*`, `.nish-dialog*`,
  `.nish-toast*`, `.nish-bottom-nav`/`-item`, `.nish-btn`, `.nish-card` and more. `src/theme.ts`
  (the `@nish/ui/theme` entry, also `dist/theme.global.js` as `window.nishTheme`) has
  `mountThemeToggle(button, {labels, showLabel})` (line 250), `showToast(content, opts)`
  (line 316), `confirmDialog(opts)` (line 427), `openSheet(dialog)` (line 548) and
  `mountHeightVar(el, name)` (line 671).
- **Build.** `scripts/build.mjs` runs tsup (`tsup.config.ts`), then writes the CSS and
  `dist/files.json` (`static: [...]`, line 178, the list hosting's sync-ui vendors).
- **Docs site.** `site/components/*.tsx` export a `ComponentDoc` (`site/components/types.ts`),
  and pages render in `site/pages/component.tsx`. Static usage lives in
  `site/pages/static-sites.tsx` and `site/static-example/index.html`. Existing pages:
  `button.tsx`, `card.tsx`, `bottom-nav.tsx`, `mount-theme-toggle.tsx`, plus the sheet, dialog
  and toast pages (find them by `id` in `site/components/index.ts`).
- **Tests.** Playwright (`playwright.config.ts`) with a Vite harness in `tests/overlay/`. Trap:
  stop a leftover harness server before `git worktree remove` (CLAUDE.md).
- **Artifacts.** A claude.ai artifact may load scripts from `cdn.jsdelivr.net/npm/`, but
  stylesheets only from Google Fonts, so CSS must be inlined.
  `skills/artifacts/references/theme-bridge.md` wraps hosted copies with `tokens.css`,
  `fonts.css` and `nish-components.css`. trip-plan injects `nish.css`, `nish-components.css` and
  `mountThemeToggle` (`skills/trip-plan/scripts/encrypt-trip.mjs` line ~44).
- **artifacts.nish.software** (`C:\Code\artifacts`, push to master deploys).
  - `pages/<slug>/` holds `page.json` (artifact URL, version, sha256, `protected`),
    `source.html` (the export, never hand-edited) and an optional `theme.css`.
  - `src/wrap.ts` adds theme init, the `nish-*` stylesheet links, the top bar and the theme
    button. It hand-copies `.nish-pill-link` and `.nish-theme-btn` rules into a string (lines
    9-23) and mounts the button with `window.nishTheme` (line 29).
  - `src/nish.ts` vendors `STAMPED` files (line 6) into `dist/nish/`.
  - `src/index-page.ts` and `src/styles/index.css` are the listing.
  - Tests: `src/*.test.ts` (vitest). Imports go through `npm run import`, wrapped by the
    `artifacts` skill.
  - The pages today:

    | Page | Size | Notes |
    |---|---|---|
    | ballot-2026 | 72 KB | protected; uses localStorage and `window.claude.use` |
    | hosting-box | 22 KB | guide |
    | kpot | 5 KB | guide |
    | poker | 20 KB | tool; localStorage and `window.claude.use` |
    | popcorn-roll | 23 KB | tool; localStorage and `window.claude.use` |
    | sn640-guide | 40 KB | guide with commands |

## Design

### Stage A: npm is the default install

Pin format: `npm:nish-ui@1.5.0` (no `v`). Tags stay `v1.5.0`. The fan-out converts between them.

```js
// tools/fanout/pin.mjs
const TAG_RE = /(?:refs\/tags\/|#)(v\d+\.\d+\.\d+)/;      // codeload, github:
const NPM_RE = /^npm:nish-ui@(\d+\.\d+\.\d+)$/;            // npm alias
// pinOf: NPM_RE match -> `v${m[1]}`, else TAG_RE as today.
// rewritePin('npm' | 'pnpm', text, 'v1.5.0') writes "npm:nish-ui@1.5.0".
```

npm wait: before opening bump PRs for `tag`, the fan-out's plan step runs
`npm view nish-ui@<X.Y.Z> version`. A missing version writes the job summary line
"nish-ui X.Y.Z is not on npm yet; the next run retries." and exits 0 without touching any repo.

Security: no tokens added. Publish stays trusted publishing. Performance: not affected.
UI: not affected. Ops: none.

### Stage B: `nish-ui/elements` (wave 1)

Usage on any page:

```html
<script src="https://cdn.jsdelivr.net/npm/nish-ui@1.6.0/dist/theme-init.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@1.6.0/dist/nish.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@1.6.0/dist/nish-components.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@1.6.0/dist/elements.js"></script>
```

Or with a bundler: `import 'nish-ui/elements';` (or `@nish/ui/elements` in fleet apps), plus
`import { toast } from 'nish-ui/elements';`.

Elements (all light DOM; attributes reflect; each is registered only if the tag is not already
defined):

| Element | Markup | Behavior |
|---|---|---|
| `<nish-theme-toggle>` | renders one `<button class="nish-theme-btn">`; attr `labelled` adds `nish-theme-btn--labelled`; attr `pill` adds `nish-theme-btn--pill` | `mountThemeToggle(button, { showLabel: labelled, labels })`. `label-system`, `label-light` and `label-dark` attrs fill `labels`. Cleanup on disconnect. |
| `<nish-sheet>` | wraps its children in `<dialog class="nish-sheet">` on first connect (children moved in, not copied). Attr `label` sets `aria-label` when no `.nish-sheet-title` is inside. | `open` attr or `.show()` calls `openSheet(dialog)`. `.close()` or removing `open` closes it. Any `[data-sheet-open="<id>"]` on the page opens the sheet with that `id`. Fires `nish-close` when closed, by any path. |
| `<nish-dialog>` | same wrapping into `<dialog class="nish-dialog">` | `open`/`.show()` uses `showModal()`. Escape and a backdrop click close it, `[data-dialog-close]` inside closes it, and focus returns to the opener. `[data-dialog-open="<id>"]` opens it. Fires `nish-close` with `detail: { value }`, where value is the `value` attr of the button that closed it, or `''`. |
| `<nish-bottom-nav>` | wraps child `<a>` in `<nav class="nish-bottom-nav" aria-label>` (attr `label`, default "Sections"); each `<a>` gets `nish-bottom-nav-item`; attr `lg` adds `nish-bottom-nav--lg` | Sets `aria-current="page"` on the link whose pathname is the longest prefix of `location.pathname` (`/` matches only `/`), and updates it on `popstate`. Calls `mountHeightVar(nav, '--nish-bottom-nav-h')`. |
| `toast(content, opts)` | function export | Re-export of `showToast` (same options). |

Element types: `src/elements/index.ts` augments `HTMLElementTagNameMap` for the four tags.

Edge cases:
- A tag already defined by another copy: skip `customElements.define`, no throw.
- An element created before the bundle loads upgrades normally (the `open` attr present at
  upgrade opens it).
- Removing an open `<nish-sheet>` or `<nish-dialog>` from the DOM closes it and runs cleanup.
- Reduced motion: as `openSheet` already handles.
- No `theme-init.js` on the page: the toggle still works (theme.ts falls back to localStorage).

UI: elements render the existing classes, so 360px, ~840px and desktop in light and dark behave
like the static classes. Check every story at 360x780, 840x900 and 1440x900 in light and dark.
Copy: none new besides the default `aria-label` "Sections".

Docs: `ComponentDoc` gains

```ts
/** The same component without React: the element or nish-* class markup. Shown as an
 *  "HTML" tab next to the React code, and rendered live in an iframe that loads
 *  nish.css, nish-components.css and elements.js. */
html?: { code: string; height?: number };
```

`site/pages/component.tsx` shows React/HTML tabs above the code block when `html` is set. The
default tab is React, and the choice is remembered in localStorage under `nish-docs-code-tab`.
The live frame uses the site's own built `dist` files (the same way `site/static-example` gets
them). Pages with `html`: theme toggle, sheet, dialog, toast, bottom nav (element markup), and
button and card (`.nish-btn`, `.nish-card` markup). `site/pages/static-sites.tsx` gets an
"Elements" section with the usage snippet above and the CDN note: "In a Claude artifact, inline
the CSS and load elements.js from jsdelivr; artifacts only allow stylesheets from Google Fonts."
The README gets one short "Without React" section with the snippet and a link to that page.

Parity test: for each wave-1 component and state (theme toggle; sheet open; dialog open; toast
shown in each tone; bottom nav with an active item), render the React version and the element
version in the harness at 360x780 and 1440x900, in light and dark. Assert that the main box's
width and height match within 1px, and that `background-color`, `border-color`, `border-radius`,
`color`, `font-size` and `padding` are equal on the box and its title or body.

Security: elements never set `innerHTML` from attributes. `toast` keeps showToast's "text is
never parsed as HTML". Performance: 20 KB gzip budget, enforced. Nothing runs until an element
connects. Ops: `elements.js` is added to `dist/files.json` `static`, so hosting's sync-ui
vendors it on the next sync.

### Stage C: artifacts rebuilt on the design system

The head of every rebuilt artifact, in this order:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="nish-ui" content="X.Y.Z">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap">
<style data-nish-ui="tokens">/* dist/tokens.css of nish-ui X.Y.Z, verbatim */</style>
<style data-nish-ui="components">/* dist/nish-components.css of nish-ui X.Y.Z, verbatim */</style>
<style>/* page layout only: grid, max-width, gaps. No colors, fonts or radii that are not var(--nish-*) */</style>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements.js"></script>
```

Rules for each rebuild:
- **Colors and type.** Every color is a `--nish-*` role. Text is `--nish-hi`, `--nish-hi2` or
  `--nish-hi3`; surfaces are `--nish-bg`, `--nish-surface` or `--nish-elevated`; status is
  `--nish-ok`, `--nish-warn`, `--nish-loss` or `--nish-info`. The font is `--nish-font-sans`,
  and `--nish-font-mono` for commands and numbers.
- **Components.** Buttons are `.nish-btn`, cards `.nish-card`, inputs `.nish-input` /
  `.nish-select` / `.nish-field`, stats `.nish-stats`, callouts `.nish-callout`, tables
  `.nish-table-wrap`, badges `.nish-badge`, empty states `.nish-empty`.
- **Interactive pieces.** Modals use `<nish-dialog>` or `<nish-sheet>`, notices use `toast()`, and
  a theme switch, if the page has one, is `<nish-theme-toggle>`.
- **Same content and behavior.** Every string, number, list and link of the old version is kept.
  So are storage keys (diff the localStorage keys and `window.claude.use` calls before and
  after: they must match) and the protected flag.
- **Layout.** 360px, ~840px and desktop, light and dark, no horizontal scroll, 44px targets. In
  claude.ai the page follows the OS theme.
- **Publish and import.** Publish with the Artifact tool to the URL in `page.json` (read it first).
  Re-import with `npm run import -- <slug> --html <saved file> --artifact <url> --version <id>`
  through the `artifacts` skill, then delete `pages/<slug>/theme.css`.

Hosted wrap (`src/wrap.ts`):
- The top bar becomes `<nav class="artifacts-bar"><a class="nish-pill-link" href="/">← Artifacts</a><nish-theme-toggle pill></nish-theme-toggle></nav>`.
  The hand-copied `.nish-pill-link` and `.nish-theme-btn` rules and the `window.nishTheme` mount
  script go. Only the bar's own layout rule (`.artifacts-bar`) stays.
- `elements.js` joins `STAMPED` in `src/nish.ts` and loads as `<script type="module" src="/nish/elements.js?v=...">`.
- For a source with `<meta name="nish-ui">`: remove every `<style data-nish-ui>` and any
  `<script>` whose src matches `cdn.jsdelivr.net/npm/nish-ui@*/dist/elements.js`, and link the
  vendored `tokens.css`, `fonts.css` and `nish-components.css` instead. No `theme.css` is applied.
  The Google Fonts link stays harmlessly, or it can be removed since `fonts.css` serves Inter.
- Old-style sources (no meta) keep today's behavior, so a page that is mid-rebuild still works.

Index (`src/index-page.ts`, `src/styles/index.css`): each page is a `.nish-link-card` (title,
blurb, kind badge `.nish-badge`), the header has `<nish-theme-toggle pill>`, and `index.css`
keeps only layout.

Security: protected pages stay encrypted exactly as before, because wrap runs before encryption.
No secrets are involved. Performance: one fewer stylesheet on hosted pages (no theme bridge), and
`elements.js` is cached by stamp. Ops: none new, a push to master deploys.

## Tasks

Checkouts: Stage A at `C:\Code\ui-npm-default` (branch `npm-default`), status at
`C:\Code\status-npm-default`, skills at `C:\Code\skills-npm-default`. Stage B at
`C:\Code\ui-elements` (branch `elements-wave-1`), skills at `C:\Code\skills-elements`.

### A1 Fan-out writes and reads the npm alias
- Repo / checkout: ui at `C:\Code\ui-npm-default`
- Owns: `tools/fanout/pin.mjs`, `tools/fanout/pin.test.mjs`, `tools/fanout/fanout.test.mjs`, `scripts/bump-consumers.sh`
- Reads: `tools/fanout/fanout.mjs`, `tools/fanout/fleet.mjs`
- Depends on: none
- Change:
  1. `pinOf('npm'|'pnpm', text)`: `NPM_RE` first (returns `v` + version), then `TAG_RE`.
  2. `rewritePin('npm'|'pnpm', ...)` writes `npm:nish-ui@${tag.slice(1)}`. Vendored is unchanged.
     The replace regex still matches any existing value (codeload, `github:`, alias).
  3. `bump-consumers.sh`: write `npm:nish-ui@${tag#v}`, and match all three old forms in the sed.
  4. Update the tests that expect codeload output. Add tests: `pinOf` on the alias,
     `rewritePin` migrating codeload to alias, `github:` to alias, and alias to alias, keeping
     formatting (tabs, spacing).
- Edge cases: `npm:nish-ui@^1.5.0` (caret) reads as `v1.5.0` and is rewritten exact. An alias to
  another package (`npm:other@1.0.0`) returns null.
- Acceptance: `npm run test:tools` passes.

### A2 Publish before the fan-out, and the fan-out waits for npm
- Repo / checkout: ui at `C:\Code\ui-npm-default`
- Owns: `scripts/release.mjs`, `tools/fanout/fanout.mjs`
- Depends on: A1
- Change:
  1. `release.mjs --ci`: dispatch `publish.yml` first, then `fanout.yml`, with the same error
     messages and fallbacks, reordered. Update the header comment (lines 12-15).
  2. `fanout.mjs` plan step: before any repo work for `tag`, check npm with
     `execFileSync('npm', ['view', \`nish-ui@${v}\`, 'version'])` (no token). Not found: write
     the summary line from Design and return. This applies to kinds `npm` and `pnpm`;
     `vendored` repos don't need npm. Make the npm lookup injectable so tests stub it.
  3. Add a test: tag not on npm means no repo is touched and the summary has the line.
- Edge cases: npm unreachable (exit code other than E404): treat as "not yet" and retry next run.
- Acceptance: `npm run test:tools` passes. Validate the workflows with
  `npx -y @action-validator/cli@0.6.0 .github/workflows/fanout.yml` (and `release.yml`,
  `publish.yml` if touched).

### A3 status reads the npm alias
- Repo / checkout: status at `C:\Code\status-npm-default`
- Owns: `server/fleet.ts`, `server/fleet.test.ts`
- Depends on: none
- Change: mirror A1's `pinOf` (alias first, then `TAG_RE`). Add tests for the alias and the caret alias.
- Acceptance: the status repo's test command (read `package.json`) passes, plus its typecheck.

### A4 Docs lead with npm
- Repo / checkout: ui at `C:\Code\ui-npm-default`, skills at `C:\Code\skills-npm-default`
- Owns: `README.md`, `docs/RELEASING.md`, `docs/adoption/COMPONENTS.md`, `site/pages/getting-started.tsx`, `site/components/copy-button.tsx`, `CHANGELOG.md`; in skills, `skills/new-site/references/app-template.md`
- Depends on: none
- Change:
  1. Fleet apps pin `"@nish/ui": "npm:nish-ui@X.Y.Z"`. Outside users run `npm install nish-ui`.
     Codeload moves under "Fallback: without the npm registry".
  2. RELEASING.md: line 24 gets the new pin, and the flow lists publish before fan-out, plus the
     npm wait.
  3. CHANGELOG `## [Unreleased]` → "Fan-out pins apps to npm (`npm:nish-ui@X.Y.Z`); publish runs
     before the fan-out."
  4. In the README, keep absolute links and no table wider than 3 short columns (CLAUDE.md).
- Acceptance: `npm run check` in ui. Grep shows codeload only in fallback sections.

### B0 Element base and build wiring
- Repo / checkout: ui at `C:\Code\ui-elements`
- Owns: `src/elements/base.ts` (new), `tsup.config.ts`, `package.json`, `package-lock.json`, `scripts/build.mjs`, `tools/elements-check.mjs` (new)
- Depends on: Stage A live
- Change:
  1. `npm i -D lit@3`.
  2. `base.ts`: `export class NishElement extends LitElement { createRenderRoot() { return this; } }`
     and `export function define(tag: string, ctor: CustomElementConstructor) { if (!customElements.get(tag)) customElements.define(tag, ctor); }`.
  3. tsup: a new config, entry `{ elements: 'src/elements/index.ts' }`, ESM, `splitting: false`,
     `noExternal: ['lit', /^@lit\//]`, `minify: true`, dts, target es2022.
  4. package.json exports `"./elements": { "types": "./dist/elements.d.ts", "import": "./dist/elements.js", "default": "./dist/elements.js" }` and `typesVersions` `elements`.
  5. build.mjs: add `'elements.js'` to `files.json` `static`.
  6. `tools/elements-check.mjs`: fail if gzip of `dist/elements.js` > 20480 bytes, if
     `dist/elements.js` has an `import` statement (it must be self-contained), or if any
     `dist/index.js` / `dist/chunk-*.js` contains `lit-html` or `LitElement`. Add it to the
     `check` script after `npm run build`.
- Acceptance: `npm run check` passes (B3 adds `src/elements/index.ts`; until then B0 tests with a stub index that B3 replaces).

### B1 Theme toggle and bottom nav elements
- Repo / checkout: ui at `C:\Code\ui-elements`
- Owns: `src/elements/theme-toggle.ts`, `src/elements/bottom-nav.ts` (new)
- Depends on: B0
- Change: as in the Design table. Each file exports its class and calls `define()` at module
  level. Use `mountThemeToggle` and `mountHeightVar` from `../theme`.
- Acceptance: typecheck passes. Parity and behavior tests in B4.

### B2 Sheet and dialog elements, toast export
- Repo / checkout: ui at `C:\Code\ui-elements`
- Owns: `src/elements/sheet.ts`, `src/elements/dialog.ts`, `src/elements/toast.ts` (new)
- Depends on: B0
- Change: as in the Design table. The sheet uses `openSheet`. The dialog follows the same
  open/close/focus-return pattern on `.nish-dialog`. `toast.ts`: `export { showToast as toast } from '../theme';` and its options type.
- Edge cases: the Design list.
- Acceptance: typecheck passes. Behavior tests in B4.

### B3 Entry, docs and README
- Repo / checkout: ui at `C:\Code\ui-elements`
- Owns: `src/elements/index.ts`, `site/components/types.ts`, `site/pages/component.tsx`, `site/pages/static-sites.tsx`, the docs files for button, card, bottom nav, theme toggle, sheet, dialog and toast in `site/components/`, `README.md`, `CHANGELOG.md`
- Depends on: B1, B2
- Change: `index.ts` imports the four element modules, re-exports `toast`, and declares the
  `HTMLElementTagNameMap` entries. Then the docs as in Design. CHANGELOG `## [Unreleased]` →
  "`nish-ui/elements`: `<nish-theme-toggle>`, `<nish-sheet>`, `<nish-dialog>`, `<nish-bottom-nav>` and `toast()` for pages without React."
- Acceptance: `npm run check` and `npm run build:site` pass. The HTML tab renders live at 360,
  840 and 1440 in light and dark (`npm run visual`).

### B4 Parity and behavior tests
- Repo / checkout: ui at `C:\Code\ui-elements`
- Owns: `tests/elements/` (new: harness `vite.config.ts`, `index.html`, `react.tsx`, `parity.spec.ts`, `behavior.spec.ts`), `playwright.config.ts`
- Depends on: B3
- Change: the parity test from Design. Behavior tests: the toggle cycles system → light → dark
  and updates `aria-label`. Sheet and dialog: `open` attr, the `data-*-open` triggers, Escape,
  backdrop click, `nish-close` (with the dialog's `value`), and focus returns to the opener.
  Bottom nav: `aria-current` on load and after `history.pushState` + `popstate`. Defining the
  bundle twice does not throw.
- Acceptance: `npx playwright test tests/elements` passes. Stop the harness server afterwards (trap).

### B5 Skills use the elements
- Repo / checkout: skills at `C:\Code\skills-elements`
- Owns: `skills/artifacts/references/theme-bridge.md`, `skills/artifacts/references/site.md`, `skills/trip-plan/scripts/encrypt-trip.mjs`, `skills/trip-plan/references/scheme.md`, `skills/ui-component/SKILL.md`
- Depends on: Stage B released
- Change:
  1. Artifacts and trip pages that need a theme toggle, sheet, dialog, toast or bottom nav use the
     elements: hosted copies load `elements.js` from the vendored `nish/` folder, and claude.ai
     artifacts load it from `cdn.jsdelivr.net/npm/nish-ui@<version>/dist/elements.js` with the CSS inlined.
  2. trip-plan's theme button becomes `<nish-theme-toggle pill>` with the same `.nish-glass` placement.
  3. ui-component: every new interactive component also gets an element, and every docs page an
     `html` entry.
- Acceptance: re-encrypt one existing trip with the script and check the toggle works at 360 and
  1440 in light and dark.

### C0 Hosted wrap and index on the design system
- Repo / checkout: artifacts at `C:\Code\artifacts-ds` (branch `design-system`)
- Owns: `src/wrap.ts`, `src/wrap.test.ts`, `src/nish.ts`, `src/index-page.ts`, `src/index-page.test.ts`, `src/styles/index.css`, `package.json`, `package-lock.json`
- Depends on: Stage B released (`@nish/ui` pinned to it by the fan-out)
- Change: as in the Stage C "Hosted wrap" and "Index" design.
- Edge cases: a source with the meta but no `data-nish-ui` blocks; a source with both the meta
  and a `theme.css` (ignore theme.css); a protected page (wrap, then encrypt as today).
- Acceptance: `npm test`, `npm run lint` and `ARTIFACTS_DEV=1 npm run build` pass. Add tests:
  meta strips the inline blocks and the CDN script; no meta keeps the current output; the bar
  has `<nish-theme-toggle pill>`. `npm run preview` checked at 360, 840 and 1440, in light and dark.
- Ship this PR before C1.

### C1-C6 Rebuild each artifact
One task per page, in this order (small first, protected last): C1 kpot, C2 hosting-box,
C3 sn640-guide, C4 poker, C5 popcorn-roll, C6 ballot-2026.
- Run by: the orchestrating session (Artifact tool, `artifact-design` and `artifacts` skills).
  Not a Workflow subagent.
- Owns: the artifact at the `artifact` URL in `pages/<slug>/page.json`, plus
  `pages/<slug>/source.html`, `page.json` and the deletion of `theme.css`, via the import script.
- Depends on: C0 live
- Change: read the artifact, rebuild it per the Stage C rules, publish it to the same URL, then
  re-import it and open a PR (or one PR per two pages).
- Acceptance:
  - Before/after checklist in the PR body: every heading and section present, localStorage keys
    equal, `window.claude.use` calls equal.
  - Screenshots at 360, 840 and 1440 in light and dark, both in claude.ai and on
    `npm run preview`.
  - `grep -E '#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(' ` over the page's own `<style>` (not the
    `data-nish-ui` blocks) finds no color literals.
  - `npm test` and `ARTIFACTS_DEV=1 npm run build` pass.
- Edge cases:
  - **ballot-2026 (protected):** the import keeps `--protected`; check the lock page and that the
    decrypted page renders.
  - **poker:** the numbers stay `--nish-font-mono` with tabular figures.
  - **sn640-guide:** commands stay copyable as plain text.

## Waves

Stage A: W1: A1, A3, A4 · W2: A2 (needs A1) · then release A.
Stage B (after A is live): W1: B0 · W2: B1, B2 · W3: B3 · W4: B4 · then release B · then B5.
Stage C (after B is released and B5 merged): C0 (PR, deploy) · then C1 to C6 one at a time.

## Review focus

- Pin migration on real files: every form in today's fleet (`npm` and `pnpm`, workspace
  `uiDir`/`uiExtraDirs`) migrates in one bump, and status reads them.
- Release order: no path where a bump PR lands before npm has the version.
- `dist/index.js` and its chunks never pull in Lit. The `elements.js` budget.
- Elements: light DOM moves children correctly, there are no leaks on disconnect, and focus
  return and Escape work.
- Docs at 360px: the React/HTML tabs fit with no horizontal scroll.
- Artifacts: nothing lost in a rebuild (content, storage keys, the protected flag), no color
  literals left, and hosted copies serving the vendored files rather than jsdelivr.

## Release

- **Stage A.** Merge the ui PR and the status PR, and deploy status first. Then a minor release
  (`gh workflow run release.yml -R nishant/ui -f bump=minor`). Watch `publish.yml`, then the
  fan-out. Live means `npm view nish-ui version` equals the tag, every fleet app's
  `package.json` has `npm:nish-ui@X.Y.Z`, and https://status.nish.software/fleet shows none
  behind. Merge the skills PR (new-site template).
- **Stage B.** Merge the ui PR, then a minor release. Live means:
  - `curl -sI https://cdn.jsdelivr.net/npm/nish-ui@<ver>/dist/elements.js` returns 200;
  - design.nish.software shows the HTML tabs on the seven pages at 360 and 1440, in light and dark;
  - a scratch HTML page with the four tags works.

  Then B5 and its skills PR.
- **Stage C.** C0 merged and deployed (`deploy.yml` green; https://artifacts.nish.software shows
  the new bar and index). Then each C page is republished, re-imported, merged and deployed. Live
  means:
  - https://artifacts.nish.software/<slug>/ renders on the design system at 360 and 1440, in light
    and dark, with no requests to jsdelivr (check the network panel);
  - the claude.ai artifact renders on its own in both OS themes.

  After C6 the last PR deletes this spec (in nishant/ui) and narrows the ROADMAP entries to waves
  2 and 3.

## Open questions for the research phase

- Does `@nish/ui/vite` (`src/node/vite.ts`) or the Tailwind `@source` setup refer to the
  package by name or path in a way the `npm:` alias breaks? Check one app after `npm i` with the
  alias.
- How does `site/static-example` reach the built `dist` files in dev and in `build:site`? Use
  the same route for the HTML tab's frame.
- Does any fleet repo run `npm ci` against a registry mirror or offline cache that lacks `nish-ui`?

---

# Stages D-F: elements waves 2 and 3, then the non-React fleet

Added 2026-11-02 by session Q. Status: ready to build. Stage B (wave 1, nish-ui 1.6.0) is
released. The "Web components so @nish/ui works everywhere" ROADMAP entry is narrowed or deleted
when Stage F is live. The "Close the nish-* vs React parity gaps" entry is closed in Stage D
(task D1) and deleted in the Stage D release PR. This file stays until session A deletes it
after its last Stage C page; Stage D-F PRs do not delete it.

## Goal (D-F)

12. `nish-ui/elements/forms` ships wave 2, and `nish-ui/elements/data` and
    `nish-ui/elements/charts` ship wave 3. Each is one self-contained file that works in plain
    HTML, any framework and Claude artifacts.
13. Every wave 2 and wave 3 docs page on design.nish.software has an HTML tab: the element's
    markup where the component needs behavior, the `nish-*` class markup where it does not.
14. Every element and every new class has a React-vs-HTML parity case that fails when the two
    drift. The wave 1 `KNOWN_GAPS` are gone: the nish-* CSS matches React.
15. React apps change nothing and never load Lit (as in Stage B).
16. The hub (nish.software), hosting's static sites (minecraft.nish.software and the demos page)
    and trip pages use the elements and classes instead of hand-rolled copies of the same pieces.

## Decisions (D-F)

- **Per-wave entry points.** The 20 KB gzip budget stays, per file. Wave 1 alone is 15.6 KB
  (Lit is about 6 KB of it), so one bundle for every wave would be 40-50 KB, and most pages use a
  handful of elements. Each file bundles its own Lit (about 6 KB per extra file, only on pages
  that load several), keeps `define()`'s skip-if-defined rule, and needs no other file:
  - `dist/elements.js` (`nish-ui/elements`): wave 1, unchanged.
  - `dist/elements-forms.js` (`nish-ui/elements/forms`): wave 2.
  - `dist/elements-data.js` (`nish-ui/elements/data`): wave 3 except charts.
  - `dist/elements-charts.js` (`nish-ui/elements/charts`): line and bar charts. Charts get their
    own file because they are the heaviest piece, and pages that need them (trip pages,
    artifacts) usually need nothing else from wave 3.
  `tools/elements-check.mjs` checks every `dist/elements*.js` against 20480 bytes gzipped, the
  no-import rule and the Lit-free React entry, and that each `dist/elements*.d.ts` compiles alone.
- **Element only where there is behavior** (as in Stage B). A piece that is only a look gets a
  `nish-*` class (new where none exists), an HTML tab and a parity case. Buttons, inputs and
  links stay native, so forms submit and links open.
- **New classes follow components.css**: every selector in `:where()`, tokens only, a usage
  comment with the markup at the top of each block, touch growth to 44px under a coarse pointer,
  and the React twin's sizes (read its Tailwind classes; 1 Tailwind unit = 4px).
- **Element shape** (as in Stage B): Lit light DOM through `NishElement`. Children the author
  wrote are moved into the rendered structure once (after parse, through `whenParsed`), never
  copied. Never `innerHTML` from attributes, data or option labels (text goes in through
  `textContent` or Lit text bindings). Attributes reflect. Events are `nish-<name>`
  CustomEvents that bubble, with the new value in `detail`; a native `change` is also fired where
  a form control would fire one. Elements that hold a value join forms through a hidden
  `<input name>` they keep in step.
- **Pure helpers are shared, not copied.** Filtering, number formatting, chart scales, the
  sparkline path and the split layout math live in plain TS modules (`src/chart.ts`,
  `src/format.ts`, `src/split-layout.ts`). An element imports them. If a helper sits inside a
  React file, move it to a plain module and import it back in the React file unchanged.
- **Not in the elements**: React-only plumbing (`useSaveStatus`, `useScrollSpy`,
  `useCommandHotkey`, `revealInRow`), `NumberField` (session B is changing it), `AppShell`,
  `LayoutPresetPicker` (specific to streams), Tabs' responsive `hideFrom`/`showFrom` panes, and
  the async-function form of `CommandPalette.items` (the element takes a list and fires
  `nish-query`).
- **The docs frame** loads every element file, so any HTML tab can use any element.
- **Stage F scope**: swap a hand-rolled piece only where an element or class now covers it; keep
  each page's content, behavior and storage keys. The minecraft site has hundreds of generated
  pages: change the shared templates, `assets/site.js`, `assets/*.css` and the generators, not
  pages one by one.

## Design (D-F)

### Usage

```html
<script src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/theme-init.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/nish.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/nish-components.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-forms.js"></script>
```

Bundlers: `import 'nish-ui/elements/forms';` (`@nish/ui/elements/forms` in fleet apps). Each file
also exports its classes. Load only the files whose tags the page uses.

### Stage D: wave 2 (`elements-forms.js`)

New or changed classes (all in `src/css/components.css`):

| Class | React twin | Markup |
|---|---|---|
| `.nish-textarea--grow` | `Textarea autoGrow` | `field-sizing: content`, min height from `rows`, no resize handle |
| `.nish-tabs` (+ `--pill`, `--sm`, `--xs`, `--block`), `.nish-tab` | `Tabs` (underline default, pill) | `<div class="nish-tabs" role="tablist"><button class="nish-tab" role="tab" aria-selected="true">…</button></div>` |
| `.nish-combobox`, `-input`, `-clear`, `-list`, `-option`, `-hint`, `-empty`, `-loading` | `Combobox` | an input with a clear button and a listbox popover under it |
| `.nish-list` (the `<ul>`), `.nish-list-row` (+ `--dense`, `--compact`, `--danger`), `-icon`, `-text`, `-title` (+ `-title--2`), `-subtitle`, `-meta`, `-trailing`, `-chevron` | `ListRow` | `<a class="nish-list-row" href>`, `<button>` or `<div>`; `aria-current` gives the active tint |
| `.nish-kbd` | `Kbd` | `<kbd class="nish-kbd">Ctrl K</kbd>` |
| `.nish-page-header`, `-title`, `-subtitle`, `-actions` | `PageHeader` | `<header class="nish-page-header">` |
| `.nish-section-header`, `-title`, `-actions` | `SectionHeader` | `<div class="nish-section-header">` |
| `.nish-kv`, `.nish-kv-row` (`dt`, `dd` inside) | `KeyValueList` | `<dl class="nish-kv"><div class="nish-kv-row"><dt>…</dt><dd>…</dd></div></dl>` |
| `.nish-legend`, `-item`, `-swatch` | `ChartLegend` | swatch color through `--c` on the item |
| `.nish-sparkline` | `Sparkline` | the svg the element draws |
| `.nish-app-header`, `-back`, `-name`, `-nav`, `-tools` | `AppHeader` | the top bar: back link, name, nav, tools slot |
| `.nish-copy-btn` (state `[data-copied]`) | `CopyButton` | a `.nish-btn` or `.nish-icon-btn` that shows "Copied" |

Classes that exist and get an HTML tab and a parity case only: `.nish-input`, `.nish-select`,
`.nish-textarea`, `.nish-label`, `.nish-field` (+ `--inline`, `fieldset.nish-field`),
`.nish-checkbox` / `.nish-check-row`, `.nish-switch`, `.nish-search`, `.nish-chip` / `.nish-chips`,
`.nish-seg`, `.nish-skeleton*`, `.nish-spinner*`, `.nish-empty`, `.nish-error-state`,
`.nish-callout*`, `.nish-dot*`, `.nish-stats` / `.nish-stat*`, `.nish-meter*`,
`details.nish-disclosure`. Where a parity case finds a difference, the CSS changes to match React
(React never changes).

Elements:

| Element | Markup it renders | Behavior and API |
|---|---|---|
| `<nish-field label hint error optional layout="inline" label-width>` | wraps its one child control in a `.nish-field` (`--inline` for `layout="inline"`; `label-width` sets `--nish-field-label-w`): `<label class="nish-field-label" for>` (+ `<span class="nish-optional">Optional</span>`), the control, `<small class="nish-hint" id>`, `<small class="nish-error" role="alert" id>` | Gives the control an id if it has none. Sets `aria-describedby` to the error id while `error` is set, else the hint id. Sets `aria-invalid="true"` on the control while `error` is set; the hint hides while an error shows. A child `<nish-combobox>` or `<nish-search>` gets the id on its inner input. Attribute changes update all of it. |
| `<nish-search value placeholder label size="xs\|sm\|md" variant="bare" name>` | `<label class="nish-search">` + search icon svg + `<input class="nish-input" type="search">` + a clear `<button class="nish-icon-btn" aria-label="Clear">` shown while there is text | `label` is the input's aria-label (default "Search"). Typing fires `input` (native, from the input) and `nish-input` (`detail: { value }`). The clear button, and Escape while there is text, empty it, fire `nish-input` and `nish-clear`, and keep focus in the input. `value` reads and writes. `name` goes on the input. |
| `<nish-switch checked disabled label description size="sm" label-side="end" name>` | a `.nish-check-row` holding `<button type="button" class="nish-switch" role="switch" aria-checked>` and the label and description text | Click, Space and Enter toggle `checked` and fire `change` and `nish-change` (`detail: { checked }`). A hidden input with `name` holds `on` while checked. `aria-labelledby` / `aria-describedby` tie the text. |
| `<nish-chip-group label scroll single>` | wraps child `<button>`s in `<div role="group" class="nish-chips" aria-label>` (+ `nish-chips--scroll`); each gets `nish-chip` and `type="button"` | Click flips `aria-pressed`; `single` keeps at most one pressed. Fires `nish-change` (`detail: { values }`, each chip's `value` attr, else its text). A child `<span class="nish-chip" data-removable>` gets a remove button ("Remove <text>") that removes the chip and fires `nish-remove` (`detail: { value }`). `values` reads and writes. |
| `<nish-combobox value placeholder label allow-custom empty-text size disabled loading name>` with child `<option value data-hint>Label</option>`s, or the `options` property (`{ value, label, hint? }[]`) | `.nish-combobox` > `input.nish-input.nish-combobox-input[role=combobox]` + clear button + `ul.nish-combobox-list[role=listbox]` > `li.nish-combobox-option[role=option]` (label + `.nish-combobox-hint`), or `.nish-combobox-empty` | The keyboard model of React `Combobox` (read `src/components/combobox.tsx`): opens on focus and typing; ArrowDown/Up, Home/End move; Enter commits; Escape closes, a second Escape clears; `aria-activedescendant`. Default filter: case-insensitive substring on label and hint, at most 50 shown. `allow-custom` commits typed text. Typing fires `nish-query` (`detail: { query }`, debounced 200 ms); `loading` shows a "Searching…" row with a `.nish-spinner`; replace `options` for server search. A commit fires `change` and `nish-change` (`detail: { value, option }`); clearing fires them with `null`. A hidden input with `name` holds the value. The list flips above the input when there is no room below. |
| `<nish-tabs label value variant="pill" size="sm\|xs" block>` with child `<button value>` tabs | moves the buttons into `div.nish-tabs[role=tablist]` (classes from the attrs, `aria-label`); each gets `nish-tab`, `role=tab`, an id and `aria-controls` | Panels are elements with `data-tab-panel="<value>"` and `data-tabs="<this id>"` anywhere in the document (or inside this element when it has no id). Each gets `role=tabpanel`, `aria-labelledby`, and `hidden` unless selected. Click and ArrowLeft/Right/Home/End select (selection follows focus, roving `tabindex`). Fires `nish-change` (`detail: { value }`). With no `value` (or one that matches no tab) the first tab is selected and `value` is set. |
| `<nish-segmented label value size="xs\|md" block overflow="wrap" name>` with child `<button value>` | moves them into `div.nish-seg[role=radiogroup][aria-label]`; each `role=radio`, `aria-checked` | Click and arrows select (roving `tabindex`), fire `nish-change` (`detail: { value }`) and `change`; `name` keeps a hidden input. `overflow` defaults to `scroll`: one row that scrolls sideways with edge fades and keeps the checked one in view (as React). |
| `<nish-copy-button value for label="Copy" copied-label="Copied" icon>` | `button.nish-btn.nish-btn--sm.nish-copy-btn` (or `nish-icon-btn` with `icon`) | Copies `value`, else the `textContent` of the element whose id is `for`, with `navigator.clipboard.writeText`. Sets `data-copied` and shows the copied label for 1.5 s, announced through an `aria-live="polite"` span. Fires `nish-copy` (`detail: { text }`). |
| `<nish-sparkline values="3,5,4,8" tone label width height>` | `svg.nish-sparkline` (`role=img`, `aria-label` from `label`), the same path and area as React `Sparkline` | `tone`, `width`, `height` take React `Sparkline`'s names and defaults. Redraws when `values` changes. Fewer than two values draws nothing. |

Wave 1 parity gaps (ROADMAP "Close the nish-* vs React parity gaps"): change the `.nish-toast`,
`dialog.nish-sheet`, `dialog.nish-dialog` and `.nish-bottom-nav` CSS until no wave 1
`KNOWN_GAPS` entry in `tests/elements/parity.spec.ts` shows up, then delete the entries (keep the
`KNOWN_GAPS` mechanism). The toast gets React's tone icon: `showToast` in `src/theme.ts` adds the
svg, with the icon paths React `toast` uses.

Edge cases (D):
- A field whose child control is added later (a framework renders it after the element): wire it
  on the next child mutation.
- A combobox with no matching options and no `allow-custom`: shows `empty-text` ("No matches").
- Segmented with a `value` not among the buttons: none is checked; Tab still reaches the first.
- Copy without clipboard permission (claude.ai frames refuse it): select the text and show
  "Press Ctrl+C" for 1.5 s.
- Elements made with `document.createElement` and filled before they are connected wrap their
  children on connect.

### Stage E: wave 3 (`elements-data.js`, `elements-charts.js`)

New classes:

| Class | React twin |
|---|---|
| `.nish-table` (+ `--dense`, `--zebra`), `th.nish-th` (+ `--num`; `[aria-sort]` with a `.nish-th-sort` button), `td.nish-td--num`, `tr.nish-tr--interactive`, `--muted`, `--ok`, `--warn`, `--loss`; `.nish-table-wrap` gains `--sticky`, `--sticky-first`, `--fade` | `Table`, `Th`, `Td`, `Tr`, `TableWrap` |
| `.nish-filter-bar`, `-search`, `-chips`, `-trailing`, `-summary`, `.nish-filter-btn` (with a count badge) | `FilterBar` |
| `.nish-media-thumb` (+ shape and size modifiers from React's `MediaThumbShape`/`MediaThumbSize`), `.nish-media-row` (+ `-title`, `-meta`, `-detail`, `-badges`, `--live`, `--dense`, `--compact`), `.nish-media-chip` | `MediaThumb`, `MediaRow`, `MediaChip` |
| `.nish-split`, `.nish-split-pane`, `.nish-split-divider` (+ `--h`, `--v`, `[data-dragging]`) | `SplitStage`, `SplitDividers` |
| `.nish-nav-rail`, `-item`, `-tools`, `-footer` | `NavRail` |
| `.nish-scroll-row` (+ `--bleed`, `--snap`; fades from `data-at-start` / `data-at-end`) | `ScrollRow` |
| `.nish-settings-section`, `-header`, `-title`, `-description`, `-actions`, `-body`; `.nish-setting-row` (+ `--stacked`, `--inline`), `-label`, `-description`, `-control`, `-status` (+ `--error`, `--ok`) | `SettingsSection`, `SettingRow` |
| `.nish-command`, `-input`, `-list`, `-group`, `-item` (`[aria-selected="true"]`), `-item-hint`, `-empty`, `-footer` | `CommandPalette` (in a top-anchored modal box, as React) |
| `.nish-chart`, `-tooltip`, `-axis`, `-grid`; `.nish-range-bar` (+ `-fill`, `-current`, `-labels`) | `LineChart`, `BarChart`, `RangeBar` |

`.nish-subnav` (the static SectionNav) and `MoreSheet` (a `<nish-sheet>` holding `.nish-list-row`
links) get HTML tabs and parity cases only. `RangeBar` is a class only (`--low`, `--high`,
`--current` as percentages on `.nish-range-bar`).

Elements (`elements-data.js` unless noted):

| Element | Behavior and API |
|---|---|
| `<nish-table-sort manual>` wrapping a `<table class="nish-table">` | Every `th[data-sort]` gets a `.nish-th-sort` button. A click sorts the `tbody` rows by that column (numeric when the column is `nish-th--num` or every key parses as a number, else `localeCompare`), cycles `aria-sort` none → ascending → descending, and fires `nish-sort` (`detail: { column, direction }`). `manual`: only fire the event (server sorting). A cell's key is its `data-value`, else its text. Blank keys sort last both ways. |
| `<nish-filter-bar active-count sheet-title="Filters" sheet-below="md\|lg" sticky>` | Lays out `.nish-filter-bar`: a child `<nish-search>` goes in the search slot, other children in the chips row, `[data-slot="trailing"]` and `[data-slot="summary"]` in theirs. Below `sheet-below` (default md) the chips row moves into a `<nish-sheet>` opened by a "Filters" `.nish-filter-btn` showing `active-count`, with "Clear" (fires `nish-clear`) and "Show results" (closes it). Children are moved, never copied, so their listeners keep working; crossing the breakpoint moves them back (closing the sheet first). |
| `<nish-split orientation="row\|column" sizes="50,50" min="120" storage-key>` with child panes | Children become `.nish-split-pane`s with a `.nish-split-divider` between each pair. Pointer drag, and arrow keys on a divider (`role=separator`, `aria-orientation`, `aria-valuenow`, step 5%), resize; `sizes` reflects, `nish-resize` fires (`detail: { sizes }`), and `storage-key` saves sizes in localStorage (try/catch; a saved value whose length does not match the pane count is ignored). Below 640px under a coarse pointer the panes stack and the dividers hide. Iframes inside get `pointer-events: none` while dragging (the existing split drag rule). Nesting `<nish-split>` gives SplitStage's 2D layouts. |
| `<nish-nav-rail label>` with child `<a>`s, plus children with `data-slot="tools"` / `"footer"` | Wraps into `nav.nish-nav-rail`; the same current-link rule as `<nish-bottom-nav>` (move that logic into `src/elements/current-link.ts`, used by both). |
| `<nish-scroll-row label bleed snap fade>` | Wraps children in `.nish-scroll-row`; sets `data-at-start` / `data-at-end` on scroll and resize; scrolls a child with `aria-current` or `aria-selected="true"` into view on connect. |
| `<nish-section-nav label sticky update-hash>` with child `<a href="#id">` | Wraps them in `nav.nish-subnav` and calls `mountScrollspy`. A click scrolls smoothly (instant under reduced motion) and, with `update-hash`, replaces the hash. Fires `nish-select` (`detail: { id }`). |
| `<nish-command-palette open hotkey placeholder empty-text>` with child `<a href data-group data-hint data-keywords>` / `<button data-group …>` items, or the `items` property (`{ id, label, group?, hint?, keywords?, href? }[]`) | Renders `.nish-command` inside a modal `<dialog>`. `hotkey` opens it on Ctrl/Cmd+K anywhere except while typing in another field. Every query word must match label, hint or keywords (case-insensitive); groups keep their order. ArrowUp/Down move, Enter follows `href` or fires `nish-select` (`detail: { id }`) and clicks a button item, Escape closes, focus returns to the opener. Typing fires `nish-query` (`detail: { query }`) for server results; set `items` to replace them. `open` reflects; `nish-close` fires on close. One dialog however often the hotkey is pressed. |
| `<nish-line-chart>` and `<nish-bar-chart>` (`elements-charts.js`) | `data` (JSON attribute or property), `label` (required, the `aria-label`), `height`, `tone`, `area`, `baseline`, `y-ticks` / `x-ticks`, `y-format` / `x-format` (`number`, `percent`, `currency:USD`, `date`, `time`, built on `src/format.ts`), bars also `show-values`. `series` (attribute or property) draws several lines with a `.nish-legend`. Same scales, ticks, colors and hover tooltip as React (`src/chart.ts`); pointer and arrow-key scrubbing; redraws on resize (ResizeObserver) and on theme change. One point: a dot, no line. Equal values: a flat line mid-height. Empty data: `.nish-empty` with the `empty` text (default "No data yet"). |

### Stage F: the non-React fleet on the elements

- **Hub** (`nishant/nish.software`, Vite + vanilla TS, pins `npm:nish-ui@X.Y.Z`): the header's
  theme button becomes `<nish-theme-toggle labelled pill>` (import `@nish/ui/elements`), and
  hand-written styles that duplicate a `nish-*` class use the class. Keep the layout, the legacy
  theme-key migration in `src/theme.ts` and the status probes.
- **hosting static sites**: `scripts/sync-ui.mjs` vendors every `elements*.js` listed in
  `files.json` into `minecraft/site/assets/nish/` and `static/demos/nish/`. minecraft.nish.software:
  the shared templates and `assets/site.js` swap their hand-rolled theme button, tabs, segmented
  switches, copy buttons, search boxes and sheets for the elements, and their CSS drops the
  copies. The demos page likewise.
- **Trip pages** (`nishant/skills`, `skills/trip-plan`): the template and
  `scripts/encrypt-trip.mjs` use `<nish-tabs>`, `<nish-section-nav>`, `<nish-copy-button>`,
  `.nish-list-row` and `.nish-kv` where the template has its own versions, and load the element
  files it uses.
- **Skills**: `skills/ui-component/SKILL.md` names the entry file a new element goes in;
  `skills/artifacts/references/site.md` and `theme-bridge.md` list the four element files.

## Tasks (D-F)

Checkouts: ui at `C:\Code\ui-elements-waves` (branch `elements-waves`; Stage E on a new branch from
master after Stage D is released). Stage F: one worktree per repo.

Every element task: read `src/elements/base.ts`, `src/elements/dialog.ts` and
`src/elements/bottom-nav.ts` for the pattern, and the React twin's source for sizes, classes and
keyboard behavior. Never change a React component's behavior or props.

### D0 Build wiring for the new entry files
- Owns: `tsup.config.ts`, `package.json` (not the lockfile), `scripts/build.mjs`, `tools/elements-check.mjs`; creates stubs `src/elements/forms.ts`, `data.ts`, `charts.ts`, `public-forms.d.ts`, `public-data.d.ts`, `public-charts.d.ts` (each `export {};` with a one-line comment; later tasks fill them)
- Depends on: none
- Change: tsup entries `elements-forms`, `elements-data`, `elements-charts` with the `elements`
  entry's options (one self-contained ESM file each, Lit bundled, minified, no splitting), and
  their `public-*.d.ts` copied to `dist/elements-forms.d.ts` etc. package.json `exports`
  `./elements/forms`, `./elements/data`, `./elements/charts` (types/import/default) and matching
  `typesVersions` keys `elements/forms`, `elements/data`, `elements/charts`. `files.json`
  `static` gets the three files. `elements-check.mjs` loops over every `dist/elements*.js` (and
  its `.d.ts`) with the existing rules and prints one ok line per file.
- Acceptance: `npm run build` and `node tools/elements-check.mjs` pass with the stubs.

### D1 Wave 2 classes and the wave 1 parity gaps
- Owns: `src/css/components.css`, `src/theme.ts` (only `showToast`'s icon)
- Depends on: none
- Change: the new classes in the Stage D table, from the React twins' Tailwind classes, and the
  wave 1 gap fixes. Check each class in the "exist" list against its React twin and align
  what differs. The `KNOWN_GAPS` entries in `tests/elements/parity.spec.ts` give the exact wave 1
  differences to remove.
- Acceptance: `npm run check` passes.

### D2 Form, copy and sparkline elements
- Owns: `src/elements/field.ts`, `search.ts`, `switch.ts`, `chip-group.ts`, `copy-button.ts`, `sparkline.ts` (new); `src/sparkline-path.ts` (new) if the path math has to leave `src/components/display.tsx` (then the only display.tsx edit is importing it back)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D3 Combobox element
- Owns: `src/elements/combobox.ts` (new); `src/combobox-filter.ts` (new) if the default filter has to leave `src/components/combobox.tsx` (imported back unchanged)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D4 Tabs and segmented elements
- Owns: `src/elements/tabs.ts`, `src/elements/segmented.ts` (new)
- Depends on: D0
- Acceptance: `npm run typecheck`.

### D5 Wave 2 entry, public types, README, CHANGELOG
- Owns: `src/elements/forms.ts`, `src/elements/public-forms.d.ts`, `src/elements/public-check.ts`, `README.md`, `CHANGELOG.md`, `docs/DEVELOPING.md` (only where it lists element files)
- Depends on: D2, D3, D4
- Change: `forms.ts` imports the nine element modules, exports their classes and `define`, and
  augments `HTMLElementTagNameMap`. `public-forms.d.ts` declares them as `HTMLElement`
  subclasses (the `public.d.ts` pattern, no lit import, its own `NishElement` declaration).
  `public-check.ts` gets a `fits` line per class. README "Without React" lists the four entry
  files in one short list. CHANGELOG `## [Unreleased]`: "`nish-ui/elements/forms`:
  `<nish-field>`, `<nish-search>`, `<nish-switch>`, `<nish-chip-group>`, `<nish-combobox>`,
  `<nish-tabs>`, `<nish-segmented>`, `<nish-copy-button>` and `<nish-sparkline>`; new classes for
  tabs, list rows, headers, key-value lists and legends; the toast, sheet, dialog and bottom nav
  classes now match React."
- Acceptance: `npm run check` (elements-forms.js under 20 KB gzipped).

### D6 Docs: forms, combobox, tabs, segmented, list row
- Owns: `site/pages/component.tsx` (the frame loads all four element files), `site/pages/static-sites.tsx` (lists the entry files), and in `site/components/`: `input.tsx`, `select.tsx`, `textarea.tsx`, `field.tsx`, `field-group.tsx`, `label.tsx`, `checkbox.tsx`, `switch.tsx`, `search-input.tsx`, `chip.tsx`, `combobox.tsx`, `tabs.tsx`, `segmented.tsx`, `list-row.tsx`
- Depends on: D1, D5
- Change: an `html` entry on each page: element markup for elements, class markup otherwise, with
  `https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/...` URLs as the existing `html` pages do.
- Acceptance: `npm run build:site`; each HTML tab renders at 360 and 1440 in light and dark.

### D7 Docs: feedback and display
- Owns, in `site/components/`: `skeleton.tsx`, `skeleton-rows.tsx`, `skeleton-presets.tsx`, `spinner.tsx`, `empty-state.tsx`, `error-state.tsx`, `callout.tsx`, `status-dot.tsx`, `stat.tsx`, `meter.tsx`, `sparkline.tsx`, `disclosure.tsx`, `kbd.tsx`, `copy-button.tsx`, `page-header.tsx`, `app-header.tsx`, `section-header.tsx`, `key-value-list.tsx`, `chart-legend.tsx`
- Depends on: D1, D5
- Acceptance: as D6.

### D8 Wave 2 parity
- Owns: `tests/elements/react.tsx`, `tests/elements/elements.ts`, `tests/elements/parity.spec.ts`
- Depends on: D1, D5
- Change: `elements.ts` also imports `src/elements/forms`. One case per element and per class in
  the Stage D tables, for each state that changes the look (checked switch, pressed chip, selected
  tab in each variant, open combobox with an active option, list row active and danger, each
  callout and dot tone, empty and error state), with the wave 1 sizes, schemes and properties.
  Delete the wave 1 `KNOWN_GAPS` entries. A new difference is fixed in the CSS, never listed.
- Acceptance: `npx playwright test tests/elements/parity.spec.ts`.

### D9 Wave 2 behavior
- Owns: `tests/elements/forms.html`, `tests/elements/forms.ts`, `tests/elements/forms.spec.ts` (new)
- Depends on: D5
- Change: a harness page with every wave 2 element, and specs for: field wiring (ids,
  `aria-describedby`, `aria-invalid`, hint hidden while an error shows, a late child); search
  clear and Escape; switch click/Space/Enter, `change`, hidden input; chip group single and
  multiple, `values`, remove; combobox keyboard (open, move, Enter, Escape twice, Home/End),
  filter, `allow-custom`, `nish-query` debounce, `loading` row, form submit value; tabs click and
  arrows, panels, `aria-controls`; segmented arrows and `change`; copy with a stubbed clipboard
  and a rejecting one; sparkline redraw. Loading `dist/elements-forms.js` a second time does not
  throw. Stop the harness server afterwards (CLAUDE.md trap).
- Acceptance: `npx playwright test tests/elements/forms.spec.ts`.

### E0 Wave 3 classes
- Owns: `src/css/components.css` · Depends on: Stage D released
- Acceptance: `npm run check`.

### E1 Table sort, filter bar, scroll row, section nav, nav rail
- Owns: `src/elements/table-sort.ts`, `filter-bar.ts`, `scroll-row.ts`, `section-nav.ts`, `nav-rail.ts`, `current-link.ts` (new), and `src/elements/bottom-nav.ts` (only to use `current-link.ts`; behavior unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`; `npx playwright test tests/elements/behavior.spec.ts` still passes.

### E2 Split and command palette
- Owns: `src/elements/split.ts`, `src/elements/command-palette.ts` (new); `src/command-filter.ts` (new) if the filter has to leave `src/components/command.tsx` (imported back unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`.

### E3 Charts
- Owns: `src/elements/line-chart.ts`, `src/elements/bar-chart.ts`, `src/elements/chart-format.ts` (new); `src/chart.ts` (scale and tick helpers moved out of `src/components/charts.tsx` if they live there, imported back unchanged)
- Depends on: Stage D released
- Acceptance: `npm run typecheck`.

### E4 Wave 3 entries, types, README, CHANGELOG
- Owns: `src/elements/data.ts`, `src/elements/charts.ts`, `src/elements/public-data.d.ts`, `src/elements/public-charts.d.ts`, `src/elements/public-check.ts`, `README.md`, `CHANGELOG.md`
- Depends on: E1, E2, E3
- Change: as D5 for the two files. CHANGELOG `## [Unreleased]`: "`nish-ui/elements/data`:
  `<nish-table-sort>`, `<nish-filter-bar>`, `<nish-split>`, `<nish-nav-rail>`,
  `<nish-scroll-row>`, `<nish-section-nav>` and `<nish-command-palette>`;
  `nish-ui/elements/charts`: `<nish-line-chart>` and `<nish-bar-chart>`; classes for tables,
  filter bars, media rows, settings, split panes, the nav rail and the range bar."
- Acceptance: `npm run check`; both files under 20 KB gzipped.

### E5 Docs: wave 3
- Owns, in `site/components/`: `table.tsx`, `responsive-table.tsx`, `filter-bar.tsx`, `media-row.tsx`, `split-stage.tsx`, `nav-rail.tsx`, `more-sheet.tsx`, `scroll-row.tsx`, `section-nav.tsx`, `settings.tsx`, `command-palette.tsx`, `line-chart.tsx`, `bar-chart.tsx`, `range-bar.tsx`, `chart.tsx`
- Depends on: E0, E4
- Acceptance: as D6.

### E6 Wave 3 parity and behavior
- Owns: `tests/elements/react.tsx`, `tests/elements/elements.ts`, `tests/elements/parity.spec.ts`, `tests/elements/data.html`, `tests/elements/data.ts`, `tests/elements/data.spec.ts` (new)
- Depends on: E0, E4
- Change: parity cases for each Stage E class and element state; behavior specs for each element's
  API and edge cases. Loading both files twice does not throw.
- Acceptance: `npx playwright test tests/elements`.

### F1 Hub on the elements
- Repo: nishant/nish.software · Owns: `src/render/*.ts`, `src/theme.ts`, `src/main.ts`, `src/styles/*.css`, `index.html`, their tests
- Depends on: Stage E released and the hub's fan-out bump merged
- Acceptance: the repo's PR checks; screenshots at 360, 840 and 1440 in light and dark match before/after except where a piece became the shared one.

### F2 hosting static sites on the elements
- Repo: nishant/hosting · Owns: `scripts/sync-ui.mjs` and its test, `minecraft/site/_template/*`, `minecraft/site/assets/site.js`, `minecraft/site/assets/*.css`, the minecraft page generator(s), `static/demos/index.html`
- Depends on: Stage E released
- Acceptance: hosting's PR checks; the minecraft home, one guide page, one bigbuild page and the demos page at 360, 840 and 1440 in light and dark.

### F3 Trip pages and skills
- Repo: nishant/skills · Owns: `skills/trip-plan/**`, `skills/ui-component/SKILL.md`, `skills/artifacts/references/site.md`, `skills/artifacts/references/theme-bridge.md`
- Depends on: Stage E released
- Acceptance: re-encrypt one existing trip and check it at 360 and 1440 in light and dark.

## Waves (D-F)

Stage D: W1: D0, D1 · W2: D2, D3, D4 · W3: D5 · W4: D6, D7, D8, D9 · review and fix · release (minor).
Stage E (after D is released): W1: E0, E1, E2, E3 · W2: E4 · W3: E5, E6 · review and fix · release (minor).
Stage F (after E is released): F1, F2, F3.

## Review focus (D-F)

- Every element file under 20 KB gzipped and self-contained; `dist/index.js` and its chunks Lit-free.
- Light DOM moves children once, survives DOM moves and frameworks that render children late, and
  leaves no document or window listeners behind after disconnect.
- Keyboard models match React: combobox, tabs, segmented, command palette, split dividers.
- Hidden inputs keep form submission working; native `change` fires where a control would.
- No `innerHTML` from attributes, data or option labels.
- Parity: no `KNOWN_GAPS` left; cases cover every class and state in the tables.
- Docs at 360px: the HTML tabs fit with no horizontal scroll.
- Stage F: nothing lost on the hub, minecraft or trip pages (content, storage keys, theme cookie).

## Release (D-F)

- **Stage D.** Merge the ui PR. Before dispatching, `gh run list -R nishant/ui -w release` and
  `-w fanout` show nothing in progress; then `gh workflow run release.yml -R nishant/ui -f
  bump=minor`. Live: `npm view nish-ui version` equals the tag;
  `curl -sI https://cdn.jsdelivr.net/npm/nish-ui@<ver>/dist/elements-forms.js` returns 200;
  design.nish.software shows the wave 2 HTML tabs at 360 and 1440 in light and dark; a scratch
  page with the wave 2 tags works.
- **Stage E.** The same for `elements-data.js` and `elements-charts.js`.
- **Stage F.** Each repo's PR merged and deployed; nish.software, minecraft.nish.software, the
  demos page and one trip page checked live at 360 and 1440 in light and dark. Then the "Web
  components" ROADMAP entry is deleted, or narrowed to what is left.
