# @nish/ui 2.0: production hardening for outside teams

Status: in progress · Slug: prod-hardening · Date: 2026-11-03 · Size: large
Repos: ui (spec lives here); after the release, every repo in hosting's `fleet.yaml` adopts 2.0.0
ROADMAP: ui `ROADMAP.md`, "2.0: production hardening"

## Goal

A measured audit (8 dimensions, 122 findings, each serious one re-checked by a skeptic) found
that `nish-ui` works well inside the owner's Vite apps but is not ready for many outside teams:
it cannot be imported from a React Server Component, it breaks SSR/hydration, it does not
tree-shake (every import costs at least 17.4 KB gzip), theme state is duplicated across entries
and across copies, `require()` fails, it is English-only and LTR-only, forms do not post, several
a11y and security defaults are wrong, and the tests barely pin behavior (mutation scores of 1 to
6% on most components). This release fixes those, adds the components most apps need, and
documents the package for people outside the fleet. It is a major release (2.0.0) because some
defaults change.

Outcomes (each is checked by a named test or command):

1. `import { cn, Button, Card } from 'nish-ui'` works in a Next.js App Router server component,
   and interactive components render from server components (`"use client"` per module).
2. Every exported component renders under `renderToString` in Node without throwing, and
   hydrates with no hydration warnings (Toaster, ThemeToggle, useTheme, useLocalStorage, overlays).
3. Tree-shaking works: `cn` and `Button` cost at most 10 KB gzip each with esbuild, `useMediaQuery`
   under 1 KB; budgets are enforced in `npm run check`.
4. One theme state, overlay stack and toast store per page, shared by every entry (`.`, `/theme`,
   `/chart`) and by every copy of the package.
5. `require()` and `import()` work for every JS export on Node 20.19+.
6. Strings, locale and direction are configurable once (`<NishProvider>`), with per-instance
   props; RTL layouts and arrow keys mirror.
7. Switch, Combobox, Segmented and the new controls post in native forms and work with
   react-hook-form; Field wiring reaches every control.
8. Accessibility: forced-colors support, form-control contrast at 3:1 / placeholders 4.5:1 in
   every theme, Tooltip meets WCAG 1.4.13 with no extra Tab stop, loading states are announced,
   an axe gate runs in CI.
9. Security defaults are safe: `javascript:` URLs never navigate, the login limiter cannot be
   raced, client IPs are not spoofable by default, passwords match exactly by default, no
   third-party favicon request by default, the hub pill is opt-in.
10. Performance: cached Intl formatters, collator-based table sort that ignores `columns`
    identity, AnimatedList layout reads batched, shared media-query listeners.
11. New components: RadioGroup, Slider, TagInput, FileDropzone, Pagination, Breadcrumbs,
    Accordion, Separator, Avatar (+ AvatarGroup), Progress, VisuallyHidden, Portal, NishProvider.
12. Tests: one unit test file per component module that pins its contract and kills the
    mutation-test survivors listed in the audit; SSR, hydration, multi-copy, require, Next.js
    consumer, TypeScript consumer and size checks run in CI.
13. Docs: README (the npm page), Getting started for npm users, frameworks (Next.js, SSR, Jest,
    CSP), i18n/RTL, a 2.0 migration guide, CONTRIBUTING/SECURITY/CODE_OF_CONDUCT, a browser
    support statement, the CHANGELOG entry, and docs-site pages for every new or changed API.

## Out of scope

DatePicker/Calendar, MultiSelect, virtualized lists/tables, ContextMenu, HoverCard, TreeView,
Carousel (ROADMAP entries). A CommonJS build (the package stays ESM-only; `require(esm)` covers
CJS callers). React 18 support. Renaming the npm package or the repo. Branch/tag protection
settings on GitHub (owner's call). Docs-site bundle splitting and the /themes iframe count.
SystemCanvas routing performance at 500 nodes. Changing the default `closeOnBack` of overlays.

## Decisions

- 2.0.0 major. Breaking: AppHeader/AppShell `hubHref` replaced by `hub` (default off);
  server `passwordMatches`/`loginHandler` exact match by default; `clientIp` trusts no proxy
  header by default; Favicon makes no third-party request by default; components use `ref` as a
  prop (no `forwardRef`; React 19 is already the peer); form-control border and placeholder
  colors change; plain-CSS files are in cascade layers; `engines.node >=20.19`. Everything else
  is additive.
- Formatters keep `en-US` as the default output (no silent change for the fleet) and gain a
  `locale` option plus `setDefaultLocale()`; `<NishProvider locale>` feeds RelativeTime and charts.
- `closeOnBack` stays `true` by default (phone back button closes sheets); documented for router users.
- Bundler-facing JS is built as preserved modules into `dist/esm/` (one file per source module,
  `.js` extensions, `"use client"` kept per module, `/* @__PURE__ */` kept). The standalone
  single files at the old paths (`dist/theme.js`, `format.js`, `chart.js`, `split-layout.js`,
  `inbox-client.js`, `elements*.js`, `theme.global.js`, `theme-init.js`) stay for static pages
  and CDNs, unchanged in behavior. `package.json` exports point bundlers at `dist/esm/`.
- Shared runtime state lives on `globalThis[Symbol.for('nish-ui.runtime.v1')]`, keyed by
  feature, so every entry and every copy shares it; a dev-only warning names two different versions.
- Types stay bundled (`dist/index.d.ts` etc.); source maps are dropped for `dist/esm/` (the code
  is unminified and one file per module) and kept for the minified files.
- Tailwind: `dist/tailwind.css` scans `dist/esm/components/**` only; new `dist/tailwind-core.css`
  has no `@source` so apps can scan only the modules they use (documented).
- Strings: English defaults in one typed `NishStrings` object; `<NishProvider strings>` sets them
  once; per-instance props win. Custom elements get `configureStrings()`.
- Docs site shows `nish-ui` in import lines (the real npm name); Getting started explains the
  `@nish/ui` alias the fleet uses.
- Forms: Switch keeps `onChange(checked, event)` for 2.x (fleet code) and adds `onCheckedChange`,
  `name`, `value`, `defaultChecked`, `required` and a hidden native checkbox; react-hook-form users
  use `Controller` or `onCheckedChange` (documented). Removing the old signature is a 3.0 item.
- New color role `line-control` (Tailwind `th-line-control`) for form-control borders, at least
  3:1 against `surface` and `elevated` in every theme; placeholders use `hi3`, raised to 4.5:1 on
  `elevated` and `overlay` in every theme.
- A visual pixel gate (fold-check) runs on this repo's PRs.

## Current state

Read the audit reports; they hold the evidence, file:line references and the exact surviving
mutants. AUDIT = `C:/Users/nish5/AppData/Local/Temp/claude/C--Code/26ccb138-f2b0-4ccb-a0c5-0cf709b0815e/scratchpad/audit`.

- `AUDIT/bundle.md`: build layout, per-export sizes, the preserved-modules prototype
  (`AUDIT/bundle/bench/build-protos.mjs`), Tailwind scan numbers, tarball breakdown.
- `AUDIT/compat.md`: Next.js 16 fixture (`AUDIT/compat/`), SSR/hydration harness
  (`AUDIT/compat/ssr/cases.mjs`), TypeScript matrix, Node require results.
- `AUDIT/perf.md`: benchmark harness (`AUDIT/perf/bench/`), numbers, slow paths with file:line.
- `AUDIT/mutation.md`: coverage per file, mutation score per file, section 3b lists surviving
  mutants per file (each becomes a test).
- `AUDIT/a11y.md`: axe results, APG keyboard deviations per component, forced-colors, RTL,
  targets, live regions.
- `AUDIT/api.md`: contract deviations per component (1.4), forms (2), every hard-coded string
  with file:line (3.2), RTL counts (4), CSS architecture (5), coupling (6), gaps (7).
- `AUDIT/docs.md`, `AUDIT/security.md`, `AUDIT/critic.md`: docs, npm sync, security proofs
  (`AUDIT/security/consumer/xss-run.mjs`, `AUDIT/security/server/login-run.mjs`), CSP, multi-copy.
- `AUDIT/result.json`: every finding with evidence and recommendation.

Repo facts: `tsup.config.ts` builds 9 passes; `scripts/build.mjs` generates CSS, theme-init,
tailwind.css, files.json and runs build self-tests; `src/index.ts` re-exports everything and
imports SystemCanvas from `./system-canvas.js`; the docs site is `site/` (component pages in
`site/components/<id>.tsx`, registry `site/components/index.ts`, props from `site/docgen.mjs`);
unit tests are vitest + happy-dom (`src/**/*.test.ts(x)`, `tools/**/*.test.ts`); tool tests are
`node --test tools/*.test.mjs`; Playwright specs in `tests/overlay` (port 5193) and
`tests/elements` (port 5194) import from `src` through Vite.

## Design

### Shared runtime and provider (T2 builds; everyone uses)

```ts
// src/runtime.ts (no 'use client'; no React)
declare const __NISH_UI_VERSION__: string | undefined;
export const VERSION: string; // __NISH_UI_VERSION__ when defined (build), else 'dev'
/** One record per page, shared by every entry and every copy of the package. */
export function shared<T>(key: string, init: () => T): T;
// globalThis[Symbol.for('nish-ui.runtime.v1')] ??= { versions: Set<string>, slots: Record<string, unknown> }
// On first call per copy, adds VERSION to versions; if versions.size > 1 and not production
// (globalThis.process?.env?.NODE_ENV !== 'production'), console.warn once:
// "nish-ui: two versions are loaded on this page (1.9.0, 2.0.0). Overlays, toasts and theme
//  state are shared, but mixing versions is unsupported."
```

```ts
// src/url.ts (no React)
/** href for user-supplied links: relative URLs, #fragments, http(s), mailto and tel pass;
 *  anything else (javascript:, data:, vbscript:, file:) returns null. Strips ASCII control
 *  characters and whitespace the way browsers do before reading the scheme. */
export function safeUrl(href: string | null | undefined): string | null;
```

```tsx
// src/components/client.ts ('use client')
export function useIsClient(): boolean; // useSyncExternalStore(noop, () => true, () => false)
export const useIsoLayoutEffect: typeof useLayoutEffect;
export function isRtl(el: Element | null | undefined): boolean; // getComputedStyle(el).direction === 'rtl', false on server
// src/components/strings.ts (no directive): NishStrings interface + DEFAULT_STRINGS (English)
// src/components/provider.tsx ('use client')
export interface NishConfig {
  strings: NishStrings; locale?: string; dir?: 'ltr' | 'rtl';
  portalContainer?: HTMLElement | null; // default document.body
}
export function NishProvider(props: { strings?: Partial<NishStrings>; locale?: string; dir?: 'ltr' | 'rtl';
  portalContainer?: HTMLElement | null; children: ReactNode }): JSX.Element; // nests: inner overrides outer
export function useNishConfig(): NishConfig; // defaults without a provider
export function useNishStrings(): NishStrings;
// src/components/portal.tsx ('use client')
export function Portal(props: { children: ReactNode; container?: HTMLElement | null }): ReactPortal | null;
// renders null on the server and in the first client render (useIsClient), then createPortal
// into container ?? config.portalContainer ?? document.body
```

`NishStrings` has one camelCase key per string in `AUDIT/api.md` section 3.2 (and the canvas,
settings, service-tokens, error-boundary and theme-toggle strings), with a JSDoc line naming
the components that use it. Strings with a value (`Theme: {theme}. Switch to {next}`) are
functions: `themeToggleLabel: (current: string, next: string) => string`. Wave-2 owners read
`src/components/strings.ts` and use those keys; a string they find with no key gets a
per-instance prop with an inline English default and a line in their notes.

### Component contract (every wave-2 task applies it to its modules)

1. A module that calls React hooks, `createContext`, `createPortal` or uses browser APIs starts
   with `'use client';`. Pure helpers it exports (`*Class` functions, constants, `toneFor`,
   `signTone`, etc.) move to a sibling `<module>-classes.ts` (no directive, no React runtime
   import), and the component module re-exports them so existing import paths keep working.
2. No `forwardRef`: components take `ref` as a prop (React 19) and put it on their root or
   primary DOM element. Props extend the root element's attributes
   (`Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | ...>` as needed) and spread `...rest` on
   the root, so `id`, `data-*`, `aria-*`, `style` work. List any component where that is not
   possible in your notes.
3. Module-level calls get `/* @__PURE__ */` (`createContext`, `memo`, `Object.assign`, `new Intl.*`,
   `extendTailwindMerge`). No import-time side effects (listeners, timers, DOM).
4. Nothing reads `window`, `document`, `localStorage` or `matchMedia` during render; the first
   client render equals the server render (use `useIsClient`, `useSyncExternalStore` with a
   server snapshot, or effects). Portals go through `Portal` / `useNishConfig().portalContainer`.
5. User-facing strings come from `useNishStrings()`; a per-instance prop wins when given.
6. RTL: logical utilities (`ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e/
   rounded-s/rounded-e`, `rtl:` variants for translations and icons that point), arrow keys
   swapped when `isRtl(el)`.
7. z-index from tokens: `z-[var(--nish-z-sticky)]`, `--nish-z-dropdown`, `--nish-z-modal`,
   `--nish-z-toast`, `--nish-z-tooltip` (with the current number as the fallback, e.g.
   `z-[var(--nish-z-modal,50)]`).
8. Stateful roots set `data-state` (`open|closed`, `checked|unchecked|indeterminate`,
   `active|inactive`) and `data-disabled` when disabled.
9. Forced colors: any state shown only by background, box-shadow or a colored dot also gets a
   `forced-colors:` utility (border, outline, `forced-color-adjust-none` with system colors
   `Highlight`/`HighlightText`/`ButtonText`/`GrayText`/`CanvasText`).
10. Dev warnings (`process.env.NODE_ENV !== 'production'` guarded) for misuse named in the task.
11. Form borders use `border-th-line-control` (added by T5); placeholders `placeholder:text-th-hi3`.
12. Tests: `src/components/<module>.test.tsx` (vitest + @testing-library/react + happy-dom)
    pinning: ref, className merge, rest passthrough, ARIA, keyboard, controlled and uncontrolled
    use, strings from a provider, RTL arrows where relevant, and every surviving mutant listed for
    the module in `AUDIT/mutation.md` 3b. Call `cleanup()` after each test (or rely on the
    vitest globals setup T21 adds; until then call it). Fake timers for anything timed.
13. Update the docs-site pages of your components (`site/components/<id>.tsx`) for every prop you
    add, rename or change: controls, a story where useful, and guidance text. Write import lines
    as `@nish/ui` there (T22 maps them to `nish-ui` centrally).
14. Do not edit `src/index.ts`, `site/components/index.ts`, `package.json`, `tsup.config.ts`,
    `scripts/*`, or another task's files. Do not run `npm run build`, `npm run check` or anything
    that rewrites `dist/` (other agents run tests at the same time); run `npx vitest run <your
    files>`, `npx tsc --noEmit` (judge only errors in your files) and `npx eslint <your files>`.

### Data, security, performance, ops

- No data or migrations. No new routes in this repo; server-kit changes are library defaults.
- Security changes listed per task (T4 server, safeUrl sinks in T9-T13/T15, Trusted Types in
  T6/T15, CSP nonce in T1).
- Performance budgets: `tools/size-budgets.json` (T1), interaction numbers in T8/T10/T12 tests.
- Ops: no ports, env vars or runners change. CI gets new steps (T21).

## Tasks

Checkout for every task: `C:\Code\ui-prod-hardening` (branch `prod-hardening`).

### T1 Build, packaging and size budgets (wave 1)
- Owns: `tsup.config.ts`, `scripts/build.mjs`, `scripts/build-components.mjs`, `package.json`,
  `src/node/vite.ts`, `src/elements/all.ts` (new), `tools/size-check.mjs` (new),
  `tools/size-budgets.json` (new), `tools/exports.test.mjs` (new), `src/index.ts` (only the
  SystemCanvas import line, if the build needs it), `.gitignore`.
- Change:
  1. Add a preserved-modules ESM build of `src/index.ts`, `src/theme.ts`, `src/chart.ts`,
     `src/format.ts`, `src/split-layout.ts`, `src/inbox-client.ts`, `src/system-canvas.ts`
     into `dist/esm/` mirroring `src/` (e.g. `dist/esm/components/primitives.js`). Requirements:
     relative imports rewritten to `.js`; `react`, `react-dom`, `react/jsx-runtime`, `clsx`,
     `tailwind-merge` external; JSX automatic; target es2022; a source file whose first
     statement is `'use client'` produces an output file whose first line is `"use client";`
     (verify; prepend in a post-step if the tool drops it); `/* @__PURE__ */` comments kept; no
     source maps. `src/tokens.mjs` is copied to `dist/esm/tokens.mjs` (and stays at
     `dist/tokens.js`). Look at `AUDIT/bundle/bench/build-protos.mjs` for the working prototype.
     esbuild (bundle: true per file with an onResolve plugin that marks relative imports external
     and appends `.js`) or Rollup `preserveModules` are both fine; pick one, document it in a
     comment.
  2. Define `__NISH_UI_VERSION__` (package.json version) in every JS build.
  3. Keep the standalone builds at their current paths (`dist/theme.js`, `format.js`,
     `chart.js`, `split-layout.js`, `inbox-client.js`, `theme.global.js`, `elements*.js`,
     `system-canvas.js` may go away: check `files.json` and hosting's vendored list in
     `AUDIT/bundle.md`; keep it if anything vendors it) and their `.d.ts` files. Add
     `dist/elements-all.js` from `src/elements/all.ts` (`import './index'; import './forms';
     import './data'; import './charts'; export * from './index';` plus the other entries' named
     exports) so a page using every element loads one Lit.
  4. `package.json`: exports for `.`, `./theme`, `./chart`, `./format`, `./split-layout`,
     `./inbox-client`, `./system-canvas`, `./tokens` point `import` and `default` at
     `dist/esm/...` with `types` first; every JS export gets `default`; add `./elements/all`,
     `./tailwind-core.css`, `./tokens.json`, `./tokens.dtcg.json`, `./theme-init.sha256`;
     `typesVersions` covers every JS subpath; `sideEffects` lists the CSS, elements files,
     theme-init.js and theme.global.js only; `engines.node` `>=20.19`; `files` excludes
     `dist/esm/**/*.map`; version stays 1.9.0 (the release bumps it).
  5. `scripts/build.mjs`: `tailwind.css` scans `@source "./esm/components";` (plus
     `@source "./esm/system-canvas.js"` if canvas classes live there) and nothing else; emit
     `tailwind-core.css` = tailwind.css without any `@source` line; update `testSourceScan` to the
     new layout. Emit `nish.min.css` and `nish-components.min.css` (lightningcss, already a
     dependency of Tailwind) and list them in files.json. Emit `theme-init.sha256`
     (`sha256-<base64>` of theme-init.js) and add `themeInitHash` to files.json. Emit
     `tokens.json` (THEMES, SCALE, roles) and `tokens.dtcg.json` (W3C Design Tokens format:
     `{ "color": { "<theme>": { "<role>": { "$type": "color", "$value": "#..." } } }, ... }`).
     Copy `node_modules/@fontsource-variable/inter/LICENSE` to `dist/fonts/LICENSE-Inter.txt`.
     The build's self-tests must pass for the new layout.
  6. `src/node/vite.ts`: `nishThemeInit({ nonce })` option: a string or `() => string`; when
     given, the injected script tag gets `nonce`. Unit test in `src/node/vite.test.ts` (new).
  7. `tools/size-check.mjs` + `tools/size-budgets.json`: bundle each listed import from
     `dist/esm` with esbuild (minify, react/react-dom/jsx-runtime external) and gzip; fail when a
     budget is exceeded; print a table. Budgets (KB gzip): `cn` 10, `Button` 11, `Card` 11,
     `Modal` 15, `Toaster` 14, `Combobox` 14, `AppShell` 34, `useMediaQuery` 1.5, `THEMES` 3,
     `SystemCanvas` 27, everything from `.` 100, `nish-ui/theme` 12, `nish-ui/format` 4. Also
     tarball unpacked size under 2.5 MB (`npm pack --dry-run --json`). Add `"size": "node
     tools/size-check.mjs"` to scripts and run it at the end of `check`. Wave-2 work shrinks these;
     the integrate step tightens them later, so pick budgets that the current code passes once
     PURE/preserved modules land and note the measured numbers.
  8. `tools/exports.test.mjs` (node --test): for every JS subpath in exports, `import()` works and
     `createRequire(...)(subpath)` works (Node 20.19+); every exports entry has `types` (where JS)
     and `default`; `dist/esm/index.js` imports in plain Node without touching `window`/`document`
     (run with no DOM globals); a `'use client'` source module's output starts with `"use client";`.
  9. Add the new tools to `check` / `test:tools` as appropriate; keep `npm run check` green.
- Acceptance: `npm run check`, `npm run test:tools`, `npm run size` pass; `npm pack --dry-run`
  shows the new files and no esm maps; record the size table in your notes.

### T2 Runtime, provider, portal, safeUrl, strings (wave 1)
- Owns (new): `src/runtime.ts`, `src/url.ts`, `src/components/client.ts`,
  `src/components/strings.ts`, `src/components/provider.tsx`, `src/components/portal.tsx`,
  `src/runtime.test.ts`, `src/url.test.ts`, `src/components/provider.test.tsx`,
  `src/components/portal.test.tsx`.
- Change: exactly the APIs in Design > "Shared runtime and provider". `NishStrings` keys cover
  every string in `AUDIT/api.md` 3.2 plus SystemCanvas, settings, service-tokens,
  error-boundary, theme-toggle, ResponsiveTable, Pagination (`previousPage`, `nextPage`,
  `pageLabel: (n) => string`, `paginationLabel`), Breadcrumbs (`breadcrumbs`), TagInput
  (`removeTag: (tag) => string`), FileDropzone (`dropzoneLabel`, `browseFiles`, `removeFile: (name) => string`),
  Avatar, Slider and Accordion where they need one. `shared()` must work when two separately
  bundled copies run on one page (test: load the module twice with `vi.resetModules()` and
  check both get the same object, and the version warning fires once when VERSION differs —
  stub via a test-only `__setVersionForTest`, not exported from index).
- Edge cases: `safeUrl('  JaVaScRiPt:alert(1)')` null; `'java\tscript:x'` null; `'//evil.com'`
  passes (protocol-relative http); `'/a?b#c'`, `'#top'`, `'mailto:a@b'`, `'tel:+1'`,
  `'https://x'` pass; `''`/null/undefined null. Portal with a container that is detached renders
  into it anyway. Provider nesting merges strings.
- Acceptance: `npx vitest run src/runtime.test.ts src/url.test.ts src/components/provider.test.tsx src/components/portal.test.tsx`; `npx tsc --noEmit` clean for these files.

### T3 Repo hygiene and supply chain (wave 1)
- Owns (new unless noted): `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor
  Covenant 2.1, contact: GitHub private vulnerability reporting / issues),
  `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`,
  `.github/ISSUE_TEMPLATE/config.yml`, `.github/pull_request_template.md`,
  `.github/dependabot.yml` (new or edit: npm weekly, grouped minor+patch, github-actions
  weekly), `.github/workflows/codeql.yml` (javascript-typescript, on push to master + PR +
  weekly; actions pinned by SHA like ci.yml; minimal permissions), `.github/workflows/release.yml`
  and `.github/workflows/publish.yml` (only: minimal `permissions` per job and SHA pins if any
  are missing; no logic change).
- Change: CONTRIBUTING covers setup, checks, the component contract (link docs/DEVELOPING.md),
  changesets-free CHANGELOG rule, docs-page rule, and that releases are cut by maintainers.
  SECURITY says supported versions (latest 2.x; 1.x security fixes for 3 months), how to report
  (GitHub private vulnerability reporting), and response time. Never run `npx -y @action-validator`
  (the session validates YAML).
- Acceptance: files exist; YAML parses (`node -e "require('yaml')"` is not available: use
  `npx js-yaml <file>` only if installed, else read carefully); no secrets.

### T4 Server kit security (wave 1)
- Owns: `src/server/**`, `tools/server-hono.test.mjs`, `tools/server-kit.test.mjs`,
  `tools/server-service-tokens.test.mjs`, new `tools/server-security.test.mjs`.
- Change (see `AUDIT/security.md` and `AUDIT/security/server/login-run.mjs`):
  1. Limiter: add `hit(key): boolean` that counts the attempt and returns whether it is allowed,
     atomically before any `await`; `loginHandler` calls it first and calls `reset(key)` on
     success. Expired entries are evicted before live ones; a locked key is never evicted (when
     full of locked keys, `hit` returns false for new keys).
  2. `clientIp(get, remote, { trust = 'none' })`: `'none'` uses only the socket address;
     `'proxy'` uses the rightmost `X-Forwarded-For` hop (falls back to socket); `'cloudflare'`
     uses `cf-connecting-ip`, then behaves as `'proxy'`. No address at all returns `null`, and the
     limiter treats null as "no rate-limit key" for that request only when `trust` is `'none'` and
     there is no socket (document it) — otherwise per-key. `mountSessionRoutes` and every helper
     that calls clientIp take `trustProxy?: 'none' | 'proxy' | 'cloudflare'` (default `'none'`).
  3. `passwordMatches` and `loginHandler`: `caseInsensitive` defaults to `false`, no trimming
     unless `caseInsensitive: true` (which keeps today's fold+trim).
  4. Session secret: throw at setup when shorter than 32 bytes, with a clear message.
  5. SPA handler: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
     strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` unless the caller passes
     `frameOptions: false`.
  6. Tests: 100 parallel bad logins give at most `max` 401s; spoofed headers ignored by default;
     case/trim; secret length; headers; process.ts lifecycle survivors from `AUDIT/mutation.md`.
- Acceptance: `npm run test:tools` green; `npx tsc --noEmit` clean for src/server.

### T5 Tokens, CSS, contrast, forced colors, print, layers (wave 1)
- Owns: `src/tokens.mjs`, `src/tokens.d.mts`, `src/th-colors.mjs`, `tools/contrast-rules.mjs`,
  `tools/contrast-rules.d.mts`, `src/css/base.css`, `src/css/components.css`, `src/css/fonts.css`.
- Change:
  1. New color role `line-control` in every theme (`--nish-line-control`, Tailwind
     `th-line-control`), at least 3:1 against `surface` and `elevated` (contrast rules added).
  2. Raise `hi3` where it is under 4.5:1 on `elevated` or `overlay` (light, slate, mocha) and
     add those pairs plus `hi3` on `elevated` (placeholder) to the contrast rules.
  3. Replace the THEMES mutation loop in tokens.mjs with a pure expression (no top-level
     statements that mutate exports).
  4. base.css: `@media (forced-colors: active)` block for attribute-driven states:
     `[aria-selected=true], [aria-pressed=true], [aria-current]:not([aria-current=false]),
     [role=radio][aria-checked=true], [role=tab][aria-selected=true]` get a visible
     `outline: 2px solid Highlight` (or `border-color: Highlight`), `[aria-disabled=true],
     :disabled` get `color: GrayText`, `:focus-visible` uses `Highlight`, and the `.nish-*`
     components in components.css that draw state with backgrounds (switch, checkbox, meter,
     status dot, segmented, chips, tabs, menu items) get system-color rules. Use the a11y
     report's list.
  5. `@media print`: force the light theme tokens on `:root` and `[data-theme]`, white
     background, no shadows, hide `[data-nish-print=hide]`, fixed bars static.
  6. `html[data-nish-theme-switching] *, ...::before, ...::after { transition: none !important }`
     (T6 sets the attribute for one frame during a switch).
  7. Cascade layers for the plain-CSS path: base.css rules inside `@layer nish.base`,
     components.css inside `@layer nish.components` (keep `:where()`), tokens stay unlayered
     custom properties. tailwind.css keeps importing base.css with `layer(base)`: make sure the
     nested layer still lands in Tailwind's base (check the generated CSS of a Tailwind build;
     if `@layer nish.base` inside `layer(base)` misbehaves, have the plain-CSS layering happen in
     the nish.css/nish-components.css assembly instead and tell T1 in your notes).
  8. Physical properties in the CSS become logical (`margin-inline-*`, `padding-inline-*`,
     `inset-inline-*`, `text-align: start/end`, `border-inline-*`).
  9. `.animate-spin` reduced-motion override and `.scrollbar-none`: keep behavior but scope the
     override to `.nish-spin`/`[data-nish-spin]` and keep `.animate-spin` working (do not
     override Tailwind's utility with !important globally).
- Acceptance: `npm run contrast` passes (`node tools/contrast.mjs`), `node tools/elements-check.mjs`
  and the component-CSS build checks pass when T1 next builds (do not run build yourself; run
  `node scripts/build-components.mjs`-style checks only if they write nowhere shared — otherwise
  leave to integrate). List every token value you changed with old/new contrast in notes.

### T6 Theme runtime (wave 2, needs T2, T5)
- Owns: `src/theme.ts`, `src/theme-init.js`, `src/theme-global.ts`, `src/chart.ts`,
  `src/components/theme-toggle.tsx`, `src/theme.test.ts` (edit), new `src/theme-init.test.ts`,
  new `src/components/theme-toggle.test.tsx`, `site/components/theme-toggle.tsx`,
  `site/components/mount-theme-toggle.tsx`, `site/components/show-toast.tsx`,
  `site/components/confirm-dialog-fn.tsx`, `site/components/mount-tooltips.tsx`.
- Change: theme listeners and the registered-themes registry live in `shared('theme', ...)`, so
  `.`, `/theme`, `/chart` and two copies share them (chart.ts drops its MutationObserver
  workaround if it no longer needs it); `useTheme` uses `useSyncExternalStore` with server
  snapshot `{ choice: 'system', theme: DEFAULT_THEME }`; on mount, if `<html>` has no
  `data-theme`, re-apply the stored theme (hydration wipe defence). `setThemeChoice`/`cycleTheme`
  validate names (unknown → ignored with a dev warning) and never throw when storage or
  cookies throw (sandboxed iframe). `theme-init.js` ignores prototype keys (`hasOwnProperty`),
  survives throwing storage, does not delete host `theme-color` metas that have a `media`
  attribute or `data-nish-keep`. Storage key configurable: `<html data-nish-storage-key="x">`
  read by theme-init and theme.ts (default `nish-theme`). Theme switch sets
  `data-nish-theme-switching` on `<html>` for one frame. Replace every `innerHTML` in theme.ts
  (mountThemeToggle, showToast, confirmDialog, mountTooltips) with DOM built via
  `createElementNS` so Trusted Types pages work; showToast's action `href` goes through
  `safeUrl` (dropped when null). Strings in these imperative APIs accept an options object
  override and default to `DEFAULT_STRINGS`. ThemeToggle labels from `useNishStrings()`.
  Tests: kill the theme.ts/theme-init survivors in `AUDIT/mutation.md`; cross-entry listener
  test; storage-throws test; proto-key test; hydration test (renderToString then hydrateRoot
  with a stored theme, no recoverable errors).
- Acceptance: `npx vitest run src/theme.test.ts src/theme-init.test.ts src/components/theme-toggle.test.tsx`.

### T7 Formatters and hooks (wave 2, needs T2)
- Owns: `src/format.ts`, `src/format.test.ts` (new or edit), `src/components/hooks.tsx`,
  `src/components/hooks.test.tsx`, `src/components/layout-vars.ts`, new
  `src/components/hooks-classes.ts` (BREAKPOINTS, PHONE_QUERY, NARROW_QUERY), `tools/format-check.mjs`,
  `site/components/format.tsx`, `site/components/hooks.tsx`, `site/components/relative-time.tsx`.
- Change: cache every Intl formatter by (locale, options) key; `currencySymbol` cached per
  code; every formatter takes optional `locale` and date formatters take `timeZone`;
  `setDefaultLocale(locale)` / `getDefaultLocale()` (default `'en-US'`, so output is unchanged);
  relative words come from `Intl.RelativeTimeFormat` when `locale` is not English, English
  output byte-identical to today. `RelativeTime` gets `locale` (default
  `useNishConfig().locale ?? getDefaultLocale()`). `useMediaQuery` shares one MediaQueryList +
  listener per query string across components (useSyncExternalStore, server snapshot `false`),
  never calls matchMedia during render. `useLocalStorage` on useSyncExternalStore with server
  snapshot = initial, tolerant of corrupted JSON (returns initial, dev warning) and storage
  throwing; cross-tab sync via `storage` events. Tests for every survivor listed for format.ts
  and hooks.tsx; a micro-benchmark test: 10 000 `dateTime` calls under 100 ms.
- Acceptance: `npx vitest run src/format.test.ts src/components/hooks.test.tsx`; `node tools/format-check.mjs`.

### T8 Primitives (wave 2, needs T2, T5)
- Owns: `src/components/primitives.tsx`, `src/components/icons.tsx`, `src/cn.ts`, new
  `src/components/primitives-classes.ts`, new `src/components/primitives.test.tsx`,
  `site/components/{button,icon-button,card,card-header,badge,input,select,label}.tsx`.
- Change: the contract; `buttonClass`, `iconButtonClass`, `cardClass`, `badgeClass`,
  `fieldClass`, `linkClass`, `revealClass` and their size/variant tables move to
  primitives-classes.ts; `cn.ts` gets `/* @__PURE__ */` on `extendTailwindMerge` and no
  directive; inputs use `border-th-line-control` and `placeholder:text-th-hi3`; Input
  leading/trailing and the Select chevron use logical positions; IconButton `2xs` keeps a 24px
  hit area on fine pointers; dev warning when IconButton has no `label`. Destructive alias:
  `Button variant="danger"` stays; IconButton keeps `tone="danger"` (note the naming split in
  docs, no rename). Tests: loading → disabled + aria-busy, IconButton aria-pressed, Card padded/
  inset, refs, rest, and the primitives survivors.
- Acceptance: `npx vitest run src/components/primitives.test.tsx`.

### T9 Forms, Segmented, Combobox (wave 2, needs T2, T5)
- Owns: `src/components/forms.tsx`, `src/components/segmented.tsx`, `src/components/combobox.tsx`,
  new `src/components/forms-classes.ts`, new `src/components/forms.test.tsx`, new
  `src/components/segmented.test.tsx`, `src/components/combobox.test.tsx`,
  `site/components/{textarea,checkbox,field,field-group,switch,search-input,chip,segmented,combobox}.tsx`.
- Change: the contract, plus (see `AUDIT/api.md` 2): Switch: `name`, `value` (default `'on'`),
  `defaultChecked`, `required`, `form`, `onCheckedChange(checked)`, a visually hidden native
  checkbox that mirrors state for FormData (not focusable, `aria-hidden`), `data-state`,
  `forced-colors:` border on the track and `ButtonText`/`Highlight` thumb, thumb uses
  `rtl:-translate-x-4`; Checkbox: destructure `invalid` → `aria-invalid`, hint/trailing outside
  the label's accessible name (aria-describedby), forced-colors check visible; Field: does not
  spread `invalid` onto children that do not accept it (pass `aria-invalid`), supports
  `required` (adds `aria-required`/`required` and a visual marker from strings), wires
  `id`/`aria-describedby`/`aria-invalid` into Combobox and Segmented; Combobox: `name`,
  `required`, `form`, `defaultValue`, `onValueChange`, `id`/`aria-describedby`/`aria-invalid`
  forwarded to its input, hidden input carrying the value, one filtering pass per keystroke with
  pre-lowercased labels (memoized on options); Segmented: `name` + hidden radio inputs or a
  hidden input, `defaultValue`, `onValueChange`, RTL arrow keys, `data-state`; SearchInput:
  `defaultValue`, strings; Chip/ChipGroup: strings, RTL arrows. Tests: react-hook-form is not
  a dependency — test with native `FormData(form)` and with a register-like object
  (`{ name, onChange: (e) => ..., onBlur, ref }`) for Input/Textarea/Checkbox/Select, and
  `onCheckedChange` for Switch; every survivor listed for forms/segmented/combobox.
- Acceptance: `npx vitest run src/components/forms.test.tsx src/components/segmented.test.tsx src/components/combobox.test.tsx`.

### T10 Overlays and toasts (wave 2, needs T2)
- Owns: `src/components/overlay.tsx`, `src/components/toast.tsx`, new
  `src/components/overlay-classes.ts`, `src/components/overlay.test.tsx` (edit), new
  `src/components/toast.test.tsx`, `tests/overlay/**`,
  `site/components/{modal,drawer,confirm-dialog,popover,dropdown-menu,tooltip,toast}.tsx`.
- Change: the contract, plus: overlay stack state (dialogPortals, inerted, lockCount,
  savedOverflow, layer stack, pendingBacks) and the toast store live in `shared('overlay', ...)`
  / `shared('toast', ...)`; the popstate guard installs lazily on the first dialog with
  `closeOnBack` and is removed when none remain; Modal, Drawer and ConfirmDialog accept
  `open?: boolean` + `onOpenChange?(open)` (when `open` is given they are controlled; when
  omitted, mounted = open as today) and render via `Portal` (nothing on the server);
  ConfirmDialog is `role="alertdialog"` with `aria-describedby` on its message; Popover,
  DropdownMenu, Tooltip use the configured portal container; Tooltip: when its child is a
  single focusable element, clone it with `aria-describedby` and do not add a wrapper tab stop
  (`focusable` defaults to false then); Escape closes a hover-opened tip (document listener
  while open); the pointer can move onto the tip (no `pointer-events-none`, close with ~100 ms
  grace after leaving both); Toaster: no render-time `typeof document` (useIsClient), z from
  token, sticky (duration Infinity) and error toasts are not evicted by newer ones (evict the
  oldest non-sticky), `toast()` returns the id, `toast.promise(promise, {loading, success,
  error})` added; scrollable bodies get `tabIndex={0}` + a label when they overflow; strings.
  Dev warning: Modal/Drawer with neither `title` nor `aria-label`/`aria-labelledby`.
  Tests: toast store (fake timers), live-region queue, sticky eviction, Tooltip a11y, controlled
  open, SSR (renderToString of open Modal returns markup without throwing), the multi-copy stack
  test (`vi.resetModules()` twice, two Modals from different copies, close order, overflow and
  inert restored only after the last), every overlay/toast survivor; extend
  `tests/overlay/overlay.spec.ts` for Tooltip hover/focus/Escape, menu arrows/typeahead, Popover
  flip.
- Acceptance: `npx vitest run src/components/overlay.test.tsx src/components/toast.test.tsx`;
  `npx playwright test tests/overlay`.

### T11 Data, tables, charts, media (wave 2, needs T2)
- Owns: `src/components/data.tsx`, `src/components/table.tsx`, `src/components/charts.tsx`,
  `src/components/media.tsx`, new `src/components/data-classes.ts`, new
  `src/components/data.test.tsx`, new `src/components/table.test.tsx`, new
  `src/components/charts.test.tsx`, `src/components/media.test.tsx` (edit),
  `src/components/list-row.test.tsx` (edit, if it exists),
  `site/components/{responsive-table,table,list-row,favicon,link-card,async-panel,line-chart,bar-chart,range-bar,media-row}.tsx`.
- Change: the contract, plus: module-level `Intl.Collator(undefined, {numeric: true,
  sensitivity: 'base'})` for string sort; sort memo keyed on `[rows, sortKey, dir, external]`
  with columns read through a ref; sort keys computed once per sort; rows memoized
  (`memo` row component with stable props); sort changes announced in a polite live region
  (strings); `rowHref` through `safeUrl`; scrollable table wrapper focusable with a label when it
  overflows; Favicon: `src?: string`, `resolve?: (host: string, size: number) => string | null`,
  module-level `configureFavicons({ resolve })`, exported `googleFavicon` resolver; default
  resolver returns null (letter avatar, no request); `referrerPolicy="no-referrer"` and
  `loading="lazy"`; LinkCard uses Favicon's config and safeUrl; MediaThumb uses `safeUrl` from
  `src/url.ts` (delete its local safeSrc); charts: memoize paths on data/size (not hover),
  decimate LineChart/Sparkline to at most 2 points per pixel column (min/max per bucket),
  `locale` prop for axis numbers (default `useNishConfig().locale`, else en-US), RTL-aware
  arrow keys where charts handle keys. Tests: sort correctness + "re-render with new columns
  identity does not call sortValue", Favicon makes no request by default, safeUrl on rowHref,
  decimation keeps extremes, survivors.
- Acceptance: `npx vitest run src/components/data.test.tsx src/components/table.test.tsx src/components/charts.test.tsx src/components/media.test.tsx`.

### T12 App shell, header, nav, layout, display (wave 2, needs T2, T5)
- Owns: `src/components/display.tsx`, `src/components/app-shell.tsx`, `src/components/nav.tsx`,
  `src/components/layout.tsx`, new `src/components/display-classes.ts`, new
  `src/components/display.test.tsx`, new `src/components/nav.test.tsx`, new
  `src/components/layout.test.tsx`, `src/components/app-shell.test.tsx` (edit),
  `site/components/{app-header,app-shell,callout,status-dot,stat,meter,sparkline,disclosure,kbd,copy-button,page-header,section-header,key-value-list,chart-legend,bottom-nav,more-sheet,nav-rail,scroll-row,section-nav,sticky-bar,sticky-action-bar,loading-bar,page-container,connection-banner}.tsx`.
- Change: the contract, plus: AppHeader/AppShell `hub?: { href: string; label: ReactNode;
  title?: string } | false` (default `false`, no pill); remove `hubHref` (types and code); the
  pill renders exactly as today when `hub` is given (compact rules unchanged); docs page text
  "Every app shows the hub pill" becomes guidance for the nish.software fleet plus how outside
  apps use `hub`; landmark labels unique and from strings (BottomNav, NavRail, sidebar,
  SectionNav, AppHeader tabs nav gets a label); AppShell `moreItems` without `renderLink`
  navigate via `safeUrl` (unsafe items not rendered, dev warning); Meter/StatusDot visible in
  forced colors; LoadingBar `announce?: string` written to a persistent polite region;
  StickyBar/StickyActionBar/BottomNav/LoadingBar/AppHeader z from tokens; CopyButton handles a
  missing clipboard API and insecure context (falls back to a textarea + execCommand, then shows
  the failure string); SectionNav items 44px on coarse pointers; Callout dismiss label from
  strings. Tests: hub off by default, hub on renders the link, landmark labels, CopyButton
  fallback, LoadingBar announce, survivors.
- Acceptance: `npx vitest run src/components/display.test.tsx src/components/nav.test.tsx src/components/layout.test.tsx src/components/app-shell.test.tsx`.

### T13 Feedback, flow, command palette, tabs, error boundary (wave 2, needs T2)
- Owns: `src/components/feedback.tsx`, `src/components/flow.tsx`, `src/components/command.tsx`,
  `src/components/tabs.tsx`, `src/components/error-boundary.tsx`,
  `src/components/error-boundary.test.tsx` (edit), new `src/components/feedback.test.tsx`,
  new `src/components/flow.test.tsx`, new `src/components/command.test.tsx`, new
  `src/components/tabs.test.tsx`, new `src/components/tabs-classes.ts`,
  `site/components/{spinner,skeleton,skeleton-rows,skeleton-presets,empty-state,error-state,flow-steps,step-bar,agent-node,workflow-board,activity-feed,ticker-text,animated-list,command-palette,tabs,app-error-boundary}.tsx`.
- Change: the contract, plus: Spinner/Skeleton presets put the label as visually hidden text
  inside a `role="status"` region (SkeletonLines gets the role or drops the aria-label);
  AnimatedList: read all rects in one batch before cancelling running animations (2 layouts per
  update, not 2 per item), animate only items intersecting the viewport and at most the first 50,
  Map-based reconcile, stable ref callbacks; CommandPalette: `safeUrl` for item hrefs and
  `window.open`, empty state outside `role="listbox"` (status text), one filter pass with
  pre-lowercased keywords, strings; `navigateFromLayer` uses safeUrl; Tabs: RTL arrows, 44px on
  coarse pointers, `tabClass` → tabs-classes.ts, `defaultValue`/`onValueChange` (keep current
  props as aliases if renaming), `data-state`; AppErrorBoundary: default fallback shows the
  message and stack only when `process.env.NODE_ENV !== 'production'` or `showDetails` is true;
  strings. Tests: survivors, AnimatedList layout-count test (mock getBoundingClientRect counts),
  palette safeUrl, tabs keyboard + RTL, loading announcement.
- Acceptance: `npx vitest run src/components/feedback.test.tsx src/components/flow.test.tsx src/components/command.test.tsx src/components/tabs.test.tsx src/components/error-boundary.test.tsx`.

### T14 Settings, tokens UI, filters, split, inbox, resource, URL state, canvas (wave 2, needs T2)
- Owns: `src/components/settings.tsx`, `src/components/service-tokens.tsx`,
  `src/components/filters.tsx`, `src/components/split.tsx`, `src/components/inbox.tsx`,
  `src/components/resource.ts`, `src/components/url-state.ts`, `src/components/canvas/**`,
  `src/system-canvas.ts`, `src/split-layout.ts`, `src/inbox-types.ts`,
  `src/service-token-types.ts`, and their existing tests (`settings`, `service-tokens`,
  `filters`, `split`, `resource`, `url-state`, `split-layout`, canvas tests),
  `site/components/{settings,service-tokens,filter-bar,split-stage,inbox,use-resource,system-canvas}.tsx`.
- Change: the contract, plus: `apiFetch` sends `configureApi` headers only to same-origin URLs
  unless `configureApi({ headersFor: (url) => boolean })` allows it; JSON parse errors become an
  `ApiError` with the status and a short body excerpt; useResource dedupes concurrent identical
  keys, polling backs off (x2 up to 5 min) with jitter after errors, `mutate` is not overwritten
  by an older in-flight response, aborts on unmount; useUrlState tolerant of malformed params;
  SplitDividers: `aria-controls`, Home/End, unique names, `aria-valuetext`, RTL;
  split.test.tsx calls cleanup (order-independent); canvas: `'use client'` where needed, zoom
  labels from strings, node accessible names contain the visible text, muted text without
  opacity tricks that fail contrast; isValidLayout and layout math survivors; settings strings.
- Acceptance: `npx vitest run src/components src/split-layout.test.ts --dir src/components` limited
  to your files (list them), plus `node tools/canvas-layout-check.mjs` and
  `node tools/canvas-route-check.mjs`.

### T15 Custom elements (wave 2, needs T2)
- Owns: `src/elements/**` except `src/elements/all.ts` (T1), `tests/elements/**`,
  `tools/elements-check.mjs`.
- Change: replace every `innerHTML` / `unsafeHTML` with DOM built through `createElementNS` or
  Lit templates (Trusted Types safe); `<nish-command-palette>` hrefs through `safeUrl` (import
  `../url`); `configureStrings(partial)` exported from each entry (one shared store via
  `shared('element-strings', ...)`) and used for every user-facing string; `chart-format.ts`
  caches Intl formatters; RTL arrows in segmented/tabs/chip-group/split; pick up late children in
  `<nish-nav-rail>`, `<nish-section-nav>` and `<nish-table-sort>` as `<nish-scroll-row>` does
  (ROADMAP "Wave 3 element follow-ups"), with specs. Update `public*.d.ts` for new exports.
- Acceptance: `npx playwright test tests/elements`; `node tools/elements-check.mjs` (needs a
  build: if it reads dist, leave it to integrate and say so).

### T16 New form components (wave 2, needs T2, T5)
- Owns (new): `src/components/radio-group.tsx`, `src/components/slider.tsx`,
  `src/components/tag-input.tsx`, `src/components/file-dropzone.tsx`, their `*.test.tsx`,
  `site/components/{radio-group,slider,tag-input,file-dropzone}.tsx`.
- Change (follow the contract and the existing visual language: fieldClass sizes, th-* roles,
  44px coarse targets):
  - `RadioGroup` (+ `Radio`): props `value`/`defaultValue`/`onValueChange`, `name`, `options?:
    {value, label, description?, disabled?}[]` or `<Radio>` children, `orientation`
    (`vertical` default), `disabled`, `required`, `invalid`; native `<input type="radio">`s
    (posts in FormData, works with register), APG radio group keyboard (arrows move and select,
    RTL aware), descriptions via aria-describedby; works inside `Field`.
  - `Slider`: `value`/`defaultValue`/`onValueChange`/`onValueCommit`, `min` 0, `max` 100,
    `step` 1, `name`, a range (`[number, number]`) mode with two thumbs, `disabled`,
    `aria-label`/`aria-labelledby`, `formatValue` for `aria-valuetext`; role=slider thumbs with
    arrows/PageUp/PageDown/Home/End, pointer drag, RTL mirrored, hidden input(s) for FormData.
  - `TagInput`: `value`/`defaultValue`/`onValueChange` (string[]), `name` (one hidden input per
    tag), `placeholder`, `maxTags`, `validate?(tag) => string | null`, separators Enter and
    comma, paste splits, Backspace on empty removes last, each tag a removable Chip with a
    label from strings; `suggestions?: string[]` shows a listbox (combobox pattern).
  - `FileDropzone`: `accept`, `multiple`, `maxSize` (bytes), `maxFiles`, `onFilesChange(files,
    rejected)` where rejected has `{file, reason: 'type' | 'size' | 'count'}`, `name` (a real
    `<input type=file>` so the form posts), keyboard and click open the picker, drag-over state
    (`data-state="dragging"`), file list with remove buttons, `disabled`.
- Acceptance: `npx vitest run` on the four test files (keyboard, FormData, controlled and
  uncontrolled, RTL, a11y attributes).

### T17 New navigation and structure components (wave 2, needs T2)
- Owns (new): `src/components/pagination.tsx`, `src/components/breadcrumbs.tsx`,
  `src/components/accordion.tsx`, `src/components/separator.tsx`, their `*.test.tsx`,
  `site/components/{pagination,breadcrumbs,accordion,separator}.tsx`.
- Change:
  - `Pagination`: `page` (1-based)/`defaultPage`/`onPageChange`, `pageCount`, `siblings` 1,
    `boundaries` 1, ellipses, previous/next with strings, `renderLink?(page, props)` for
    router links, `size`, `nav` with `aria-label` from strings and `aria-current="page"`;
    compact "Page 3 of 10" + prev/next under 400px container width.
  - `Breadcrumbs`: `items: {label, href?, onClick?}[]` or children, `renderLink`, separator
    (chevron, mirrored in RTL), last item `aria-current="page"`, collapses middle items into a
    `…` DropdownMenu when more than `maxItems` (default 4) on narrow widths; hrefs through
    `safeUrl`.
  - `Accordion` (+ `AccordionItem`): `type: 'single' | 'multiple'`, `value`/`defaultValue`/
    `onValueChange`, `collapsible` (single), APG accordion (button in heading level `headingLevel`
    default 3, `aria-expanded`, `aria-controls`, region), arrow Up/Down/Home/End between
    headers, `data-state`, reduced-motion aware height animation.
  - `Separator`: `orientation`, `decorative` (role none) else `role="separator"` with
    `aria-orientation`, optional `label` centered.
- Acceptance: `npx vitest run` on the four test files.

### T18 New display primitives (wave 2, needs T2)
- Owns (new): `src/components/avatar.tsx`, `src/components/progress.tsx`,
  `src/components/visually-hidden.tsx`, their `*.test.tsx`,
  `site/components/{avatar,progress,visually-hidden,portal,provider}.tsx`.
- Change:
  - `Avatar`: `src` (through `safeUrl`), `name` (initials fallback, color from a stable hash
    of the name over the 8 hue roles), `size` `xs|sm|md|lg|xl`, `shape` `circle|square`,
    `status?: StatusTone` dot; image error → initials; `alt` defaults to name. `AvatarGroup`:
    `max`, overflow "+N" with an accessible label.
  - `Progress`: determinate `value`/`max` (`role="progressbar"`, `aria-valuenow`/min/max,
    `aria-valuetext` via `formatValue`), indeterminate when `value` is null, `tone`, `size`,
    optional visible label; forced-colors fill visible.
  - `VisuallyHidden`: renders children hidden but readable (`as` span/div), works without
    Tailwind (inline style).
  - Docs pages for these three, plus `portal.tsx` and `provider.tsx` docs pages describing
    T2's Portal and NishProvider (strings, locale, dir, portalContainer), with the full
    `NishStrings` key list rendered from `DEFAULT_STRINGS`.
- Acceptance: `npx vitest run` on the three test files.

### T19 Exports, docs registry and docgen coverage (wave 3, needs T1-T18)
- Owns: `src/index.ts`, `site/components/index.ts`, `tools/docgen-coverage.test.ts`,
  new `tools/api-surface.test.mjs`, new `tools/api-surface.snapshot.json`.
- Change: export every new public API (provider, strings type, Portal, useIsClient, safeUrl,
  isRtl, configureFavicons, googleFavicon, setDefaultLocale/getDefaultLocale from `/format` and
  `.`, the new components and their prop types, `toast.promise` types); re-export the moved
  `*Class` helpers; `SystemCanvas` from `./system-canvas` normally. Add every new docs page to
  COMPONENT_DOCS in the right group. docgen-coverage: fail when a runtime export of `.` has no
  docs page or section mention, and when a prop of an exported component lacks a JSDoc
  description (allow-list today's gaps by name so the test passes, and log the count).
  api-surface: snapshot the sorted list of runtime exports per entry and the `.nish-*` class
  names in `dist/nish-components.css`; fail on a removal unless the snapshot is updated in the
  same change (so removals are deliberate).
- Acceptance: `npx tsc --noEmit` clean; `npm run check` green; `npm run test:unit`;
  `npm run test:tools`.

### T20 SSR, hydration, multi-copy, consumer and a11y test suites (wave 3, needs T19)
- Owns (new unless noted): `vitest.config.ts` (edit: projects for happy-dom and node,
  coverage thresholds at today's level + 5 points, `setupFiles` with cleanup),
  `tests/setup.ts`, `tests/ssr/ssr.test.tsx` (node environment: renderToString every component
  export with minimal props from a table; fail on throw or console.error),
  `tests/ssr/hydration.spec.ts` (Playwright: server HTML + hydrateRoot for Toaster, AppShell,
  ThemeToggle, AppHeader, Modal open, useLocalStorage, with a stored theme; assert no
  `onRecoverableError` and `<html data-theme>` kept), `tests/ssr/multicopy.test.ts` (import
  `dist/esm/index.js` twice via different query strings; theme listener, toast and modal stack
  shared), `tests/consumers/` (fixtures + `tools/consumer-check.mjs`: `npm pack` into a temp dir,
  then (a) a Next.js App Router app with a server component using `cn`, `buttonClass`, `Card`,
  `Badge`, `Button` and a page rendering Modal/Combobox/Tabs/Toaster/ThemeToggle/AppShell from a
  server component — `next build` must pass and `next start` pages must have no hydration
  errors (port 5320); (b) a Vite + Tailwind 4 app build; (c) a TypeScript matrix: 5.4, 5.9 and
  6.0 × moduleResolution bundler/node16, strict, exactOptionalPropertyTypes, skipLibCheck false
  over a consumer file using 20 components and the subpaths), `tests/a11y/axe.spec.ts` (axe on
  the overlay harness and element pages, light/dark/contrast; zero serious/critical),
  `tests/a11y/forced-colors.spec.ts` (computed-style checks from T5/T9/T12 work),
  `tests/a11y/csp.spec.ts` (strict CSP + Trusted Types page loading theme-init via the hash,
  elements and the static theme APIs: zero violations), `playwright.config.ts` (edit: add the
  new specs; a `firefox` and `webkit` project for the overlay specs if the browsers install),
  `package.json` scripts are T1's — add needed scripts through your notes; the integrate step
  adds them.
- Acceptance: each suite runs locally and passes; record runtimes.

### T21 CI (wave 3, needs T20)
- Owns: `.github/workflows/ci.yml`.
- Change: add steps/jobs: `npm run size`; the SSR/multicopy vitest projects (already in
  test:unit); a `consumers` job running `node tools/consumer-check.mjs` (Next, Vite, TS matrix);
  playwright a11y/hydration/csp specs (already in `npx playwright test` if the config includes
  them); a `visual` job on `pull_request` that calls `./.github/workflows/fold-check.yml` (read it:
  it needs inputs) comparing base and head over the docs site, failing on new problems; upload
  artifacts. Keep action SHA pins; minimal permissions.
- Acceptance: YAML parses; the session validates it with action-validator.

### T22 Documentation (wave 3, needs T19)
- Owns: `README.md`, `CHANGELOG.md` (a `## [2.0.0] - unreleased` entry with `### Breaking`,
  `### Behavior changes`, `### Added`, `### Fixed`, `### Performance`), new
  `docs/MIGRATING-2.0.md`, `docs/DEVELOPING.md` (component contract section, new tools),
  `docs/RELEASING.md` (new files, size check, tarball), `CLAUDE.md` (only the repo-layout/traps
  facts that changed), `site/pages/**`, `site/lib/**`, `site/main.tsx`, `site/styles.css`,
  `site/components/shared.tsx`, `site/components/static-*.tsx`, `site/components/base-utilities.tsx`,
  `site/components/layout-contract.tsx`, `site/components/vite-plugin.tsx`, `ROADMAP.md`.
- Change: README as the npm page (absolute links only, no table wider than 3 short columns):
  install with npm, ESM-only and Node 20.19+, React 19 peer, browser support (latest 2
  Chrome/Edge/Firefox/Safari; Safari 16.4+; needs `color-mix`, `:has`, `inert`, container
  queries), Tailwind and plain CSS, Next.js App Router quick start, SSR notes, Jest (use
  Vitest or `transformIgnorePatterns`), CSP (hash file, nonce option), i18n/RTL via NishProvider,
  bundle sizes from `npm run size`, the full component list (new ones included), entry table
  complete, honest testing claims (what CI checks). Getting started rewritten for npm users
  (install Tailwind, then nish-ui), with Frameworks (Next.js app router: theme-init in
  `app/layout.tsx` via an inline script from `nish-ui/theme-init.js` contents or
  `<script src>`, `suppressHydrationWarning` on `<html>`; Vite; plain HTML), i18n & RTL, CSP,
  Testing (Jest/Vitest) sections; a "Theming API" reference page listing every export of
  `nish-ui/theme` and the constants. The docs site shows `nish-ui` in every import line and code
  sample (map `@nish/ui` → `nish-ui` centrally in `site/pages/component.tsx` and `site/lib/code.tsx`),
  with one note about the alias. Fix the small defects in `AUDIT/docs.md` (360px overflow,
  `href="#"` demos, source links to master → the release tag) and the docs-site chrome axe
  failures in `AUDIT/a11y.md`. Migration guide: every breaking change with before/after code
  (hub, server defaults, favicon, forwardRef → ref, colors, layers, engines). Remove the internal
  fleet language from public docs pages (keep it in docs/RELEASING.md). ROADMAP: replace the
  2.0 entry with what is left (Out of scope list) and keep the two existing entries (drop the
  element follow-ups part T15 finished).
- Acceptance: `npm run build:site` builds; `node tools/visual-check.mjs tools/site.visual.json`
  against a preview on port 5191 passes (start and stop it yourself).

## Waves

W1: T1, T2, T3, T4, T5 · W2: T6-T18 (each needs T2; T6, T8, T9, T12, T16 also need T5) ·
W3: T19 (needs all of W1-W2), T20 and T22 (need T19), T21 (needs T20).

## Review focus

- Next.js server components and SSR: run the consumer check yourself; hydration warnings.
- Tree-shaking numbers from `npm run size`, and that `"use client"` is on exactly the modules
  that need it (a helper used from a server component must not be in a client module).
- Shared runtime: two copies, stacked modals, theme listeners across entries.
- Security: every safeUrl sink, server defaults, Trusted Types.
- UI: 360/840/1440 light and dark on the docs site, especially form controls (new border role),
  forced colors, RTL story pages, new components.
- Tests actually assert behavior (no snapshot-only tests), and do not depend on order.

## Release

ui only: CHANGELOG `## [2.0.0]` merged to master, then
`gh workflow run release.yml -R nishant/ui -f bump=major` (session runs it after merge, never an
agent). Check `npm view nish-ui version` = 2.0.0 with provenance. Then the fan-out opens
`ui/v2.0.0` PRs (held as major) in every fleet repo; the session adopts each: AppHeader/AppShell
users pass `hub={{ href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' }}`,
server-kit users pass `trustProxy: 'cloudflare'` and keep `caseInsensitive: true` where they
relied on the default, Favicon/LinkCard users call `configureFavicons({ resolve: googleFavicon })`,
`forwardRef`-typed usages of the package's components get fixed; repos with no change get an
empty adoption commit. Verify design.nish.software shows 2.0.0 and the live apps load.

## Open questions for the research phase

None; measured facts are in the audit reports.
