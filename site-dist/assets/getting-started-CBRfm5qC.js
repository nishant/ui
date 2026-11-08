import{n as e,ot as t,r as n}from"./index-CUoDQDSp.js";import{n as r}from"./tabs-qyGekmBc.js";import{t as i}from"./code-CS6hGSDp.js";import{i as a,r as o,t as s}from"./ui-Qb4-khGb.js";import{n as c}from"./shell-mAk-BgRj.js";var l=t(),u=e();function d(){let[e,t]=(0,l.useState)(`vite`),d=c.version;return(0,u.jsxs)(`div`,{className:`space-y-10`,children:[(0,u.jsx)(s,{eyebrow:`Start`,title:`Getting started`,lead:`Install the package and Tailwind, import the CSS, put theme-init.js first in <head>, and use the components. Pick your kind of app.`}),(0,u.jsxs)(a,{id:`install`,title:`Install`,note:`The package ships built files, so there is no build step on install. ESM only, Node 20.19 or later, React 19 as an optional peer.`,children:[(0,u.jsxs)(`div`,{className:`grid gap-3`,children:[(0,u.jsx)(i,{title:`the package`,code:`npm install nish-ui`}),(0,u.jsx)(i,{title:`Tailwind 4, for nish-ui/tailwind.css (Vite)`,code:`npm install -D tailwindcss @tailwindcss/vite`}),(0,u.jsx)(i,{title:`Tailwind 4 in Next.js`,code:`npm install -D tailwindcss @tailwindcss/postcss`})]}),(0,u.jsxs)(o,{children:[(0,u.jsxs)(`p`,{children:[`Tailwind is needed only for `,(0,u.jsx)(`code`,{children:`nish-ui/tailwind.css`}),`. A static page or a Node tool that uses only the CSS files and`,` `,(0,u.jsx)(`code`,{children:`nish-ui/theme`}),` needs neither Tailwind nor React.`]}),(0,u.jsxs)(`p`,{children:[`Browsers: the latest two versions of Chrome, Edge, Firefox and Safari (Safari 16.4 or later). The CSS uses `,(0,u.jsx)(`code`,{children:`color-mix()`}),`,`,` `,(0,u.jsx)(`code`,{children:`:has()`}),`, the `,(0,u.jsx)(`code`,{children:`inert`}),` attribute and container queries, with no polyfills.`]}),(0,u.jsxs)(`p`,{children:[`On this site every import is written `,(0,u.jsx)(`code`,{children:`nish-ui`}),`, the name on npm. Some projects install the package under the scoped name`,` `,(0,u.jsx)(`code`,{children:`@nish/ui`}),` with an npm alias; every import in their code then reads `,(0,u.jsx)(`code`,{children:`@nish/ui`}),` instead:`]})]}),(0,u.jsx)(i,{keepAlias:!0,title:`optional: install under another name with an npm alias`,code:`npm install @nish/ui@npm:nish-ui`}),(0,u.jsx)(i,{keepAlias:!0,title:`package.json, pinned to an exact version`,code:`"@nish/ui": "npm:nish-ui@${d}"`}),(0,u.jsx)(i,{keepAlias:!0,title:`Fallback: without the npm registry, from a git tag`,code:`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v${d}"`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Every release tag carries the same built files. The tarball URL needs only HTTPS; `,(0,u.jsxs)(`code`,{children:[`github:nishant/ui#v`,d]}),` also works but clones over SSH when the machine has a key, and fails where GitHub does not accept it.`]})})]}),(0,u.jsx)(r,{variant:`pill`,label:`Kind of app`,value:e,onChange:e=>t(e),items:[{value:`vite`,label:`Vite + Tailwind 4`},{value:`next`,label:`Next.js`},{value:`static`,label:`Static page`},{value:`electron`,label:`Electron`}]}),e===`vite`?(0,u.jsxs)(`div`,{className:`space-y-8`,children:[(0,u.jsxs)(a,{title:`1. Import the CSS`,note:`Tokens, the Inter font, base styles and the th-* color classes, in one import after Tailwind.`,children:[(0,u.jsx)(i,{title:`src/index.css`,code:`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`code`,{children:`tailwind.css`}),` scans the package's own components for class names. To scan only the modules you use, import`,` `,(0,u.jsx)(`code`,{children:`nish-ui/tailwind-core.css`}),` instead (the same theme, no `,(0,u.jsx)(`code`,{children:`@source`}),` line) and add`,` `,(0,u.jsx)(`code`,{children:`@source '../node_modules/nish-ui/dist/esm/components/button.js';`}),` lines of your own.`]})})]}),(0,u.jsxs)(a,{title:`2. Apply the theme before first paint`,note:`The nishThemeInit plugin inlines theme-init.js at the top of <head>, so the saved theme is on <html> before anything renders. No flash of the wrong theme.`,children:[(0,u.jsx)(i,{title:`vite.config.ts`,code:`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nishThemeInit } from 'nish-ui/vite';

export default defineConfig({
  plugins: [nishThemeInit(), react(), tailwindcss()],
});`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Options for an old localStorage key, a prelude script, a CSP nonce or the charset position are on the`,` `,(0,u.jsx)(`a`,{href:n(`/components/vite-plugin`),children:`Vite plugin`}),` page.`]})})]}),(0,u.jsx)(a,{title:`3. Start the theme and mount the toaster`,children:(0,u.jsx)(i,{title:`src/main.tsx`,code:`import { createRoot } from 'react-dom/client';
import { initTheme, ThemeToggle, Toaster, Button, toast } from 'nish-ui';
import './index.css';

initTheme(); // applies the saved choice and keeps tabs and subdomains in sync

function App() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-th-line px-4 py-3">
        <h1 className="font-semibold text-th-hi">Trackers</h1>
        <ThemeToggle presets />
      </header>
      <main className="p-4">
        <Button variant="primary" onClick={() => toast.success('Saved')}>Save</Button>
      </main>
      <Toaster />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);`})}),(0,u.jsxs)(a,{title:`4. Style with roles`,children:[(0,u.jsx)(i,{title:`any component`,code:`<div className="rounded-xl border border-th-line bg-th-surface p-4">
  <p className="text-th-hi">AMD Nov 20 $180 C</p>
  <p className="text-sm text-th-hi3">2 contracts</p>
  <p className="text-th-ok">+$190.00</p>
</div>`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Never use raw palette classes like `,(0,u.jsx)(`code`,{children:`neutral-800`}),`: they do not change with the theme. Every role is on the`,` `,(0,u.jsx)(`a`,{href:n(`/color`),children:`Color`}),` page with its class.`]})})]}),(0,u.jsxs)(a,{title:`5. Lint the classes`,note:`A made-up color name after bg-th- compiles to nothing, so the element silently loses its background. The ESLint preset and the checker catch it before it ships.`,children:[(0,u.jsx)(i,{title:`eslint.config.js`,code:`import tseslint from 'typescript-eslint';
import nish from 'nish-ui/eslint';

export default [
  ...tseslint.configs.recommended,
  ...nish.configs.react, // after the TypeScript config; it adds the nish/* rules and ships no parser
];`}),(0,u.jsx)(i,{title:`package.json`,code:`{
  "scripts": {
    "th-check": "nish-th-check src"
  }
}`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`The rules reject unknown `,(0,u.jsx)(`code`,{children:`th-*`}),` classes, raw palette classes, `,(0,u.jsx)(`code`,{children:`text-white`}),` and `,(0,u.jsx)(`code`,{children:`bg-black`}),`, the legacy aliases and hand-mixed tints.`,` `,(0,u.jsx)(`code`,{children:`nish-th-check`}),` does the unknown-class check on its own for CSS, HTML and any file ESLint does not parse. Both are documented on the`,` `,(0,u.jsx)(`a`,{href:n(`/components/vite-plugin`),children:`Vite plugin and lint`}),` page. `,(0,u.jsx)(`code`,{children:`typescript-eslint`}),` supports TypeScript up to 6.0, so a project on a newer TypeScript needs `,(0,u.jsx)(`code`,{children:`typescript@~6.0`}),` beside it until that changes.`]})})]})]}):e===`next`?(0,u.jsxs)(`div`,{className:`space-y-8`,children:[(0,u.jsxs)(a,{title:`1. Import the CSS`,note:`Next.js builds CSS with PostCSS, so Tailwind comes in through @tailwindcss/postcss. The CSS import is the same.`,children:[(0,u.jsx)(i,{title:`postcss.config.mjs`,code:`export default { plugins: { '@tailwindcss/postcss': {} } };`}),(0,u.jsx)(i,{title:`app/globals.css`,code:`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`})]}),(0,u.jsxs)(a,{title:`2. Apply the theme before first paint`,note:`theme-init.js is a plain script. Copy it from the package to public/ and load it first in <head>, or inline its contents. Put suppressHydrationWarning on <html>: the script sets data-theme before React hydrates.`,children:[(0,u.jsx)(i,{title:`app/layout.tsx (a server component)`,code:`import './globals.css';
import { NishProvider, Toaster } from 'nish-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* copy node_modules/nish-ui/dist/theme-init.js to public/theme-init.js */}
        <script src="/theme-init.js" />
      </head>
      <body>
        <NishProvider>
          {children}
          <Toaster />
        </NishProvider>
      </body>
    </html>
  );
}`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Under a strict Content Security Policy, inline the file with `,(0,u.jsx)(`code`,{children:`dangerouslySetInnerHTML`}),` and its`,` `,(0,u.jsx)(`code`,{children:`nonce`}),` instead (see Content Security Policy below).`]})})]}),(0,u.jsxs)(a,{title:`3. Use components from server components`,note:`Modules that use state, effects or the browser start with "use client", so you import them anywhere. Helpers such as cn and buttonClass are plain functions a server component can call.`,children:[(0,u.jsx)(i,{title:`app/page.tsx (a server component)`,code:`import { Badge, Button, Card, ThemeToggle, cn } from 'nish-ui';

export default function Page() {
  return (
    <Card className={cn('m-4 space-y-3')}>
      <Badge tone="ok">Server rendered</Badge>
      <Button variant="primary">Save</Button>
      <ThemeToggle presets />
    </Card>
  );
}`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Event handlers cannot cross from a server component into a client one, so a button that needs `,(0,u.jsx)(`code`,{children:`onClick`}),` goes in a small file of your own that starts with `,(0,u.jsx)(`code`,{children:`"use client"`}),`. Overlays render nothing on the server and open after hydration.`]})})]})]}):e===`static`?(0,u.jsxs)(`div`,{className:`space-y-8`,children:[(0,u.jsx)(a,{title:`1. Copy the dist files`,note:`From node_modules/nish-ui/dist or a release tag. dist/files.json lists exactly what to copy.`,children:(0,u.jsx)(i,{title:`what a static site vendors`,code:c.distFiles.map(e=>`nish/${e}`).join(`
`)})}),(0,u.jsxs)(a,{title:`2. Link them`,note:`theme-init.js first, render-blocking, then the stylesheet.`,children:[(0,u.jsx)(i,{title:`index.html`,code:`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="nish/theme-init.js"><\/script>
  <link rel="stylesheet" href="nish/nish.css">
  <title>Trips</title>
</head>
<body>
  <button id="theme" type="button">Theme</button>
  <script type="module">
    import { initTheme, cycleTheme } from './nish/theme.js';
    initTheme();
    document.querySelector('#theme').addEventListener('click', cycleTheme);
  <\/script>
</body>
</html>`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Or load everything from a CDN with an exact version, for example`,` `,(0,u.jsxs)(`code`,{children:[`https://cdn.jsdelivr.net/npm/nish-ui@`,d,`/dist/nish.css`]}),`.`]})})]}),(0,u.jsxs)(a,{title:`3. Use the variables`,children:[(0,u.jsx)(i,{title:`styles`,code:`.card {
  background: var(--nish-surface);
  border: 1px solid var(--nish-line);
  border-radius: var(--nish-radius-md);
  box-shadow: var(--nish-shadow-card);
  color: var(--nish-hi);
}
.card .meta { color: var(--nish-hi3); }`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`No modules? Load `,(0,u.jsx)(`code`,{children:`nish/theme.global.js`}),` with a plain script tag and call `,(0,u.jsx)(`code`,{children:`window.nishTheme.initTheme()`}),`. The`,` `,(0,u.jsx)(`a`,{href:n(`/static-sites`),children:`Static sites`}),` page has both versions running live.`]})})]})]}):(0,u.jsxs)(`div`,{className:`space-y-8`,children:[(0,u.jsx)(a,{title:`1. Install and import the CSS`,note:`The renderer is a React + Tailwind app like any other: the install and the CSS import are the ones in the Vite tab.`,children:(0,u.jsx)(i,{title:`apps/renderer/src/index.css`,code:`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`})}),(0,u.jsx)(a,{title:`2. Inline theme-init.js`,note:`The packaged app loads from file://, where a script file can arrive late. An inline, render-blocking script cannot.`,children:(0,u.jsx)(i,{title:`apps/renderer/vite.config.ts`,code:`import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

function themeInit(): Plugin {
  return {
    name: 'theme-init',
    transformIndexHtml() {
      const shared = readFileSync(require.resolve('nish-ui/theme-init.js'), 'utf8');
      return [{ tag: 'script', children: shared, injectTo: 'head-prepend' }];
    },
  };
}`})}),(0,u.jsxs)(a,{title:`3. Storage and the window chrome`,note:`There is no shared domain in Electron, so the choice lives in localStorage only. Keep the native window in step with the scheme.`,children:[(0,u.jsx)(i,{title:`apps/renderer/src/theme.ts`,code:`import { initTheme, onThemeChange, schemeOf } from 'nish-ui';

initTheme();
onThemeChange((_choice, theme) => {
  // preload exposes ipcRenderer.send('theme', 'dark' | 'light')
  window.api.setNativeTheme(schemeOf(theme));
});`}),(0,u.jsx)(i,{title:`main process`,code:`import { ipcMain, nativeTheme } from 'electron';

ipcMain.on('theme', (_e, scheme: 'dark' | 'light') => {
  nativeTheme.themeSource = scheme; // title bar, scrollbars, native menus
});`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Offering your own themes too? Register them with `,(0,u.jsx)(`code`,{children:`registerThemes()`}),` and set the same map on`,` `,(0,u.jsx)(`code`,{children:`window.__nishExtraThemes`}),` before theme-init.js runs.`]})})]})]}),(0,u.jsxs)(a,{id:`i18n`,title:`Languages and right-to-left`,note:`Set the words, the locale and the direction once. A prop on one component still wins over the provider.`,children:[(0,u.jsx)(i,{title:`app/providers.tsx`,code:`import { NishProvider } from 'nish-ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NishProvider
      locale="de-DE"
      dir="ltr"
      strings={{ close: 'Schließen', cancel: 'Abbrechen', search: 'Suchen', copy: 'Kopieren' }}
    >
      {children}
    </NishProvider>
  );
}`}),(0,u.jsxs)(o,{children:[(0,u.jsxs)(`p`,{children:[`Every key and the components that use it are on the `,(0,u.jsx)(`a`,{href:n(`/components/provider`),children:`NishProvider`}),` page. Providers nest, and an inner one overrides the outer key by key. Outside React, `,(0,u.jsx)(`code`,{children:`setDefaultLocale('de-DE')`}),` from `,(0,u.jsx)(`code`,{children:`nish-ui/format`}),` sets the locale the formatters use (the default stays `,(0,u.jsx)(`code`,{children:`en-US`}),`), and the custom elements take `,(0,u.jsx)(`code`,{children:`configureStrings()`}),`.`]}),(0,u.jsxs)(`p`,{children:[`Layout uses logical properties (`,(0,u.jsx)(`code`,{children:`ms-`}),`, `,(0,u.jsx)(`code`,{children:`pe-`}),`, `,(0,u.jsx)(`code`,{children:`text-start`}),`), and arrow keys in Tabs, Segmented, the slider and the split panes mirror when the element's computed `,(0,u.jsx)(`code`,{children:`direction`}),` is `,(0,u.jsx)(`code`,{children:`rtl`}),`. Set `,(0,u.jsx)(`code`,{children:`dir="rtl"`}),` on`,` `,(0,u.jsx)(`code`,{children:`<html>`}),` and the whole app follows; `,(0,u.jsx)(`code`,{children:`NishProvider dir`}),` is for components that need to know without reading the DOM.`]})]})]}),(0,u.jsxs)(a,{id:`csp`,title:`Content Security Policy`,note:`theme-init.js is the only inline script the package asks for.`,children:[(0,u.jsx)(i,{title:`allow it by hash`,code:`# node_modules/nish-ui/dist/theme-init.sha256 holds the value
Content-Security-Policy: script-src 'self' 'sha256-<contents of theme-init.sha256>'`}),(0,u.jsx)(i,{title:`or by nonce, with the Vite plugin`,code:`import { nishThemeInit } from 'nish-ui/vite';

// a function runs for every page, so each response gets its own nonce
plugins: [nishThemeInit({ nonce: () => getNonce() })],`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`The hash matches the file exactly as shipped (`,(0,u.jsx)(`code`,{children:`dist/files.json`}),` carries it as `,(0,u.jsx)(`code`,{children:`themeInitHash`}),`). The components and the custom elements build their DOM without `,(0,u.jsx)(`code`,{children:`innerHTML`}),`, so a Trusted Types policy (`,(0,u.jsx)(`code`,{children:`require-trusted-types-for 'script'`}),`) passes. Fonts load from the package, and Favicon makes no third-party request unless you configure one.`]})})]}),(0,u.jsxs)(a,{id:`testing`,title:`Testing your app`,note:`Vitest works as is. Jest needs a little setup because the package is ES modules.`,children:[(0,u.jsx)(i,{title:`vitest.config.ts`,code:`import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'happy-dom' }, // or 'jsdom'
});`}),(0,u.jsx)(i,{title:`jest.config.js`,code:`module.exports = {
  testEnvironment: 'jsdom',
  // let a transform (babel-jest or @swc/jest) compile the package's ES modules
  transformIgnorePatterns: ['/node_modules/(?!nish-ui)'],
};`}),(0,u.jsx)(o,{children:(0,u.jsxs)(`p`,{children:[`Overlays portal to `,(0,u.jsx)(`code`,{children:`document.body`}),`, so query with `,(0,u.jsx)(`code`,{children:`screen`}),` rather than the render container. Components guard`,` `,(0,u.jsx)(`code`,{children:`matchMedia`}),`, `,(0,u.jsx)(`code`,{children:`ResizeObserver`}),` and storage, so no polyfills are needed. To test server output, call`,` `,(0,u.jsx)(`code`,{children:`renderToString`}),` in a Node environment: every export renders there without a DOM.`]})})]}),(0,u.jsx)(a,{id:`troubleshooting`,title:`Troubleshooting`,children:(0,u.jsxs)(o,{children:[(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`strong`,{children:`Component classes are missing (unstyled buttons).`}),` `,(0,u.jsx)(`code`,{children:`tailwind.css`}),` has an `,(0,u.jsx)(`code`,{children:`@source`}),` line for the package's `,(0,u.jsx)(`code`,{children:`dist/esm/components`}),`. If your setup resolves the package somewhere Tailwind does not follow (some pnpm or monorepo layouts), add `,(0,u.jsx)(`code`,{children:`@source '../node_modules/nish-ui/dist/esm/components';`}),` yourself.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`strong`,{children:`The page flashes the wrong theme on load.`}),` theme-init.js must run before any stylesheet and must not be `,(0,u.jsx)(`code`,{children:`async`}),`,`,` `,(0,u.jsx)(`code`,{children:`defer`}),` or a module. Inline it at the top of `,(0,u.jsx)(`code`,{children:`<head>`}),`. An app's own themes need`,` `,(0,u.jsx)(`code`,{children:`window.__nishExtraThemes`}),` set before it.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsxs)(`strong`,{children:[`React warns that `,(0,u.jsx)(`code`,{children:`data-theme`}),` differs after hydration.`]}),` Put `,(0,u.jsx)(`code`,{children:`suppressHydrationWarning`}),` on`,` `,(0,u.jsx)(`code`,{children:`<html>`}),`.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsxs)(`strong`,{children:[(0,u.jsx)(`code`,{children:`require('nish-ui')`}),` fails.`]}),` `,`The package is ES modules; `,(0,u.jsx)(`code`,{children:`require()`}),` of them works on Node 20.19+ and 22.12+. On an older Node, use `,(0,u.jsx)(`code`,{children:`import()`}),`.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`strong`,{children:`A preset chosen on another site shows as dark or light here.`}),` The page limits itself with `,(0,u.jsx)(`code`,{children:`data-nish-themes`}),`; that is the intended fallback.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`strong`,{children:`Fonts 404 on a static site after an upgrade.`}),` Font names carry a content hash. Copy every file in `,(0,u.jsx)(`code`,{children:`dist/files.json`}),`, not a fixed list.`]}),(0,u.jsxs)(`p`,{children:[(0,u.jsxs)(`strong`,{children:[(0,u.jsx)(`code`,{children:`npm install`}),` fails with "Permission denied (publickey)".`]}),` `,`A `,(0,u.jsx)(`code`,{children:`github:`}),` install met an SSH key GitHub does not accept. Install from npm, or use the fallback tarball URL above.`]})]})}),(0,u.jsx)(a,{id:`versioning`,title:`Versioning and support`,children:(0,u.jsxs)(o,{children:[(0,u.jsxs)(`p`,{children:[`Semver on the release tags, and the same version on npm. A change is `,(0,u.jsx)(`strong`,{children:`breaking`}),` when an app has to edit its code or markup to keep working or keep its look: removing or renaming a token, role, class, export, prop or file; changing a component's default; changing the cookie or storage key. A major means app code must change, a minor adds (new roles, components, props, files), a patch fixes. Color adjustments that keep every contrast check passing are minor or patch. Every release is in the `,(0,u.jsx)(`a`,{href:n(`/changelog`),children:`changelog`}),`, and a major has a migration guide (`,(0,u.jsx)(`a`,{href:n(`/migrating`),children:`moving from 2.x to 3.0`}),`; the older guide covers`,` `,(0,u.jsx)(`a`,{href:`https://github.com/nishant/ui/blob/master/docs/MIGRATING-2.0.md`,target:`_blank`,rel:`noreferrer`,children:`1.x to 2.0`}),`).`]}),(0,u.jsxs)(`p`,{children:[`A deprecated export keeps working for at least one major and is marked `,(0,u.jsx)(`code`,{children:`@deprecated`}),` in its type. Security fixes go to the latest major, and to the previous one for three months after a new major ships; see the repository's SECURITY.md.`]})]})})]})}export{d as GettingStartedPage};