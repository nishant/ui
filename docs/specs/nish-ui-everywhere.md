# nish-ui everywhere: npm by default, then web components

Status: ready to build · Slug: nish-ui-everywhere · Date: 2026-11-02 · Size: large
Repos: nishant/ui (spec lives here), nishant/status, nishant/skills, nishant/artifacts
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
  (table, filters, media, split, nav, settings, command palette, charts). They stay a ROADMAP
  entry with their own spec.
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
