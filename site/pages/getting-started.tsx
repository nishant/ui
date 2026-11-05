import { useState } from 'react';
import pkg from 'virtual:nish-pkg';
import { CodeBlock } from '../lib/code';
import { href } from '../lib/router';
import { Tabs } from '../../src';
import { PageHeader, Prose, Section } from '../lib/ui';

type Kind = 'vite' | 'next' | 'static' | 'electron';

export function GettingStartedPage() {
  const [kind, setKind] = useState<Kind>('vite');
  const v = pkg.version;
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Start"
        title="Getting started"
        lead="Install the package and Tailwind, import the CSS, put theme-init.js first in <head>, and use the components. Pick your kind of app."
      />

      <Section id="install" title="Install" note="The package ships built files, so there is no build step on install. ESM only, Node 20.19 or later, React 19 as an optional peer.">
        <div className="grid gap-3">
          <CodeBlock title="the package" code={`npm install nish-ui`} />
          <CodeBlock title="Tailwind 4, for nish-ui/tailwind.css (Vite)" code={`npm install -D tailwindcss @tailwindcss/vite`} />
          <CodeBlock title="Tailwind 4 in Next.js" code={`npm install -D tailwindcss @tailwindcss/postcss`} />
        </div>
        <Prose>
          <p>
            Tailwind is needed only for <code>nish-ui/tailwind.css</code>. A static page or a Node tool that uses only the CSS files and{' '}
            <code>nish-ui/theme</code> needs neither Tailwind nor React.
          </p>
          <p>
            Browsers: the latest two versions of Chrome, Edge, Firefox and Safari (Safari 16.4 or later). The CSS uses <code>color-mix()</code>,{' '}
            <code>:has()</code>, the <code>inert</code> attribute and container queries, with no polyfills.
          </p>
          <p>
            On this site every import is written <code>nish-ui</code>, the name on npm. Some projects install the package under the scoped name{' '}
            <code>@nish/ui</code> with an npm alias; every import in their code then reads <code>@nish/ui</code> instead:
          </p>
        </Prose>
        <CodeBlock keepAlias title="optional: install under another name with an npm alias" code={`npm install @nish/ui@npm:nish-ui`} />
        <CodeBlock keepAlias title="package.json, pinned to an exact version" code={`"@nish/ui": "npm:nish-ui@${v}"`} />
        <CodeBlock
          keepAlias
          title="Fallback: without the npm registry, from a git tag"
          code={`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v${v}"`}
        />
        <Prose>
          <p>
            Every release tag carries the same built files. The tarball URL needs only HTTPS; <code>github:nishant/ui#v{v}</code> also works but
            clones over SSH when the machine has a key, and fails where GitHub does not accept it.
          </p>
        </Prose>
      </Section>

      <Tabs
        variant="pill"
        label="Kind of app"
        value={kind}
        onChange={(next) => setKind(next as Kind)}
        items={[
          { value: 'vite', label: 'Vite + Tailwind 4' },
          { value: 'next', label: 'Next.js' },
          { value: 'static', label: 'Static page' },
          { value: 'electron', label: 'Electron' },
        ]}
      />

      {kind === 'vite' ? (
        <div className="space-y-8">
          <Section title="1. Import the CSS" note="Tokens, the Inter font, base styles and the th-* color classes, in one import after Tailwind.">
            <CodeBlock
              title="src/index.css"
              code={`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`}
            />
            <Prose>
              <p>
                <code>tailwind.css</code> scans the package&apos;s own components for class names. To scan only the modules you use, import{' '}
                <code>nish-ui/tailwind-core.css</code> instead (the same theme, no <code>@source</code> line) and add{' '}
                <code>@source &apos;../node_modules/nish-ui/dist/esm/components/button.js&apos;;</code> lines of your own.
              </p>
            </Prose>
          </Section>
          <Section title="2. Apply the theme before first paint" note="The nishThemeInit plugin inlines theme-init.js at the top of <head>, so the saved theme is on <html> before anything renders. No flash of the wrong theme.">
            <CodeBlock
              title="vite.config.ts"
              code={`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nishThemeInit } from 'nish-ui/vite';

export default defineConfig({
  plugins: [nishThemeInit(), react(), tailwindcss()],
});`}
            />
            <Prose>
              <p>
                Options for an old localStorage key, a prelude script, a CSP nonce or the charset position are on the{' '}
                <a href={href('/components/vite-plugin')}>Vite plugin</a> page.
              </p>
            </Prose>
          </Section>
          <Section title="3. Start the theme and mount the toaster">
            <CodeBlock
              title="src/main.tsx"
              code={`import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(<App />);`}
            />
          </Section>
          <Section title="4. Style with roles">
            <CodeBlock
              title="any component"
              code={`<div className="rounded-xl border border-th-line bg-th-surface p-4">
  <p className="text-th-hi">AMD Nov 20 $180 C</p>
  <p className="text-sm text-th-hi3">2 contracts</p>
  <p className="text-th-ok">+$190.00</p>
</div>`}
            />
            <Prose>
              <p>
                Never use raw palette classes like <code>neutral-800</code>: they do not change with the theme. Every role is on the{' '}
                <a href={href('/color')}>Color</a> page with its class.
              </p>
            </Prose>
          </Section>
          <Section
            title="5. Lint the classes"
            note="A made-up color name after bg-th- compiles to nothing, so the element silently loses its background. The ESLint preset and the checker catch it before it ships."
          >
            <CodeBlock
              title="eslint.config.js"
              code={`import tseslint from 'typescript-eslint';
import nish from 'nish-ui/eslint';

export default [
  ...tseslint.configs.recommended,
  ...nish.configs.react, // after the TypeScript config; it adds the nish/* rules and ships no parser
];`}
            />
            <CodeBlock
              title="package.json"
              code={`{
  "scripts": {
    "th-check": "nish-th-check src"
  }
}`}
            />
            <Prose>
              <p>
                The rules reject unknown <code>th-*</code> classes, raw palette classes, <code>text-white</code> and <code>bg-black</code>, the legacy aliases and hand-mixed tints.{' '}
                <code>nish-th-check</code> does the unknown-class check on its own for CSS, HTML and any file ESLint does not parse. Both are documented on the{' '}
                <a href={href('/components/vite-plugin')}>Vite plugin and lint</a> page. <code>typescript-eslint</code> supports TypeScript up to 6.0, so a project on a newer
                TypeScript needs <code>typescript@~6.0</code> beside it until that changes.
              </p>
            </Prose>
          </Section>
        </div>
      ) : kind === 'next' ? (
        <div className="space-y-8">
          <Section
            title="1. Import the CSS"
            note="Next.js builds CSS with PostCSS, so Tailwind comes in through @tailwindcss/postcss. The CSS import is the same."
          >
            <CodeBlock
              title="postcss.config.mjs"
              code={`export default { plugins: { '@tailwindcss/postcss': {} } };`}
            />
            <CodeBlock
              title="app/globals.css"
              code={`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`}
            />
          </Section>
          <Section
            title="2. Apply the theme before first paint"
            note="theme-init.js is a plain script. Copy it from the package to public/ and load it first in <head>, or inline its contents. Put suppressHydrationWarning on <html>: the script sets data-theme before React hydrates."
          >
            <CodeBlock
              title="app/layout.tsx (a server component)"
              code={`import './globals.css';
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
}`}
            />
            <Prose>
              <p>
                Under a strict Content Security Policy, inline the file with <code>dangerouslySetInnerHTML</code> and its{' '}
                <code>nonce</code> instead (see Content Security Policy below).
              </p>
            </Prose>
          </Section>
          <Section
            title="3. Use components from server components"
            note="Modules that use state, effects or the browser start with &quot;use client&quot;, so you import them anywhere. Helpers such as cn and buttonClass are plain functions a server component can call."
          >
            <CodeBlock
              title="app/page.tsx (a server component)"
              code={`import { Badge, Button, Card, ThemeToggle, cn } from 'nish-ui';

export default function Page() {
  return (
    <Card className={cn('m-4 space-y-3')}>
      <Badge tone="ok">Server rendered</Badge>
      <Button variant="primary">Save</Button>
      <ThemeToggle presets />
    </Card>
  );
}`}
            />
            <Prose>
              <p>
                Event handlers cannot cross from a server component into a client one, so a button that needs <code>onClick</code> goes in a small file of
                your own that starts with <code>&quot;use client&quot;</code>. Overlays render nothing on the server and open after hydration.
              </p>
            </Prose>
          </Section>
        </div>
      ) : kind === 'static' ? (
        <div className="space-y-8">
          <Section title="1. Copy the dist files" note="From node_modules/nish-ui/dist or a release tag. dist/files.json lists exactly what to copy.">
            <CodeBlock
              title="what a static site vendors"
              code={pkg.distFiles.map((f) => `nish/${f}`).join('\n')}
            />
          </Section>
          <Section title="2. Link them" note="theme-init.js first, render-blocking, then the stylesheet.">
            <CodeBlock
              title="index.html"
              code={`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="nish/theme-init.js"></script>
  <link rel="stylesheet" href="nish/nish.css">
  <title>Trips</title>
</head>
<body>
  <button id="theme" type="button">Theme</button>
  <script type="module">
    import { initTheme, cycleTheme } from './nish/theme.js';
    initTheme();
    document.querySelector('#theme').addEventListener('click', cycleTheme);
  </script>
</body>
</html>`}
            />
            <Prose>
              <p>
                Or load everything from a CDN with an exact version, for example{' '}
                <code>https://cdn.jsdelivr.net/npm/nish-ui@{v}/dist/nish.css</code>.
              </p>
            </Prose>
          </Section>
          <Section title="3. Use the variables">
            <CodeBlock
              title="styles"
              code={`.card {
  background: var(--nish-surface);
  border: 1px solid var(--nish-line);
  border-radius: var(--nish-radius-md);
  box-shadow: var(--nish-shadow-card);
  color: var(--nish-hi);
}
.card .meta { color: var(--nish-hi3); }`}
            />
            <Prose>
              <p>
                No modules? Load <code>nish/theme.global.js</code> with a plain script tag and call <code>window.nishTheme.initTheme()</code>. The{' '}
                <a href={href('/static-sites')}>Static sites</a> page has both versions running live.
              </p>
            </Prose>
          </Section>
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="1. Install and import the CSS"
            note="The renderer is a React + Tailwind app like any other: the install and the CSS import are the ones in the Vite tab."
          >
            <CodeBlock
              title="apps/renderer/src/index.css"
              code={`@import 'tailwindcss';
@import 'nish-ui/tailwind.css';`}
            />
          </Section>
          <Section
            title="2. Inline theme-init.js"
            note="The packaged app loads from file://, where a script file can arrive late. An inline, render-blocking script cannot."
          >
            <CodeBlock
              title="apps/renderer/vite.config.ts"
              code={`import { readFileSync } from 'node:fs';
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
}`}
            />
          </Section>
          <Section title="3. Storage and the window chrome" note="There is no shared domain in Electron, so the choice lives in localStorage only. Keep the native window in step with the scheme.">
            <CodeBlock
              title="apps/renderer/src/theme.ts"
              code={`import { initTheme, onThemeChange, schemeOf } from 'nish-ui';

initTheme();
onThemeChange((_choice, theme) => {
  // preload exposes ipcRenderer.send('theme', 'dark' | 'light')
  window.api.setNativeTheme(schemeOf(theme));
});`}
            />
            <CodeBlock
              title="main process"
              code={`import { ipcMain, nativeTheme } from 'electron';

ipcMain.on('theme', (_e, scheme: 'dark' | 'light') => {
  nativeTheme.themeSource = scheme; // title bar, scrollbars, native menus
});`}
            />
            <Prose>
              <p>
                Offering your own themes too? Register them with <code>registerThemes()</code> and set the same map on{' '}
                <code>window.__nishExtraThemes</code> before theme-init.js runs.
              </p>
            </Prose>
          </Section>
        </div>
      )}

      <Section id="i18n" title="Languages and right-to-left" note="Set the words, the locale and the direction once. A prop on one component still wins over the provider.">
        <CodeBlock
          title="app/providers.tsx"
          code={`import { NishProvider } from 'nish-ui';

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
}`}
        />
        <Prose>
          <p>
            Every key and the components that use it are on the <a href={href('/components/provider')}>NishProvider</a> page. Providers nest, and an inner one
            overrides the outer key by key. Outside React, <code>setDefaultLocale(&apos;de-DE&apos;)</code> from <code>nish-ui/format</code> sets the locale the
            formatters use (the default stays <code>en-US</code>), and the custom elements take <code>configureStrings()</code>.
          </p>
          <p>
            Layout uses logical properties (<code>ms-</code>, <code>pe-</code>, <code>text-start</code>), and arrow keys in Tabs, Segmented, the slider and
            the split panes mirror when the element&apos;s computed <code>direction</code> is <code>rtl</code>. Set <code>dir=&quot;rtl&quot;</code> on{' '}
            <code>&lt;html&gt;</code> and the whole app follows; <code>NishProvider dir</code> is for components that need to know without reading the DOM.
          </p>
        </Prose>
      </Section>

      <Section id="csp" title="Content Security Policy" note="theme-init.js is the only inline script the package asks for.">
        <CodeBlock
          title="allow it by hash"
          code={`# node_modules/nish-ui/dist/theme-init.sha256 holds the value
Content-Security-Policy: script-src 'self' 'sha256-<contents of theme-init.sha256>'`}
        />
        <CodeBlock
          title="or by nonce, with the Vite plugin"
          code={`import { nishThemeInit } from 'nish-ui/vite';

// a function runs for every page, so each response gets its own nonce
plugins: [nishThemeInit({ nonce: () => getNonce() })],`}
        />
        <Prose>
          <p>
            The hash matches the file exactly as shipped (<code>dist/files.json</code> carries it as <code>themeInitHash</code>). The components and the
            custom elements build their DOM without <code>innerHTML</code>, so a Trusted Types policy
            (<code>require-trusted-types-for &apos;script&apos;</code>) passes. Fonts load from the package, and Favicon makes no third-party request unless
            you configure one.
          </p>
        </Prose>
      </Section>

      <Section id="testing" title="Testing your app" note="Vitest works as is. Jest needs a little setup because the package is ES modules.">
        <CodeBlock
          title="vitest.config.ts"
          code={`import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'happy-dom' }, // or 'jsdom'
});`}
        />
        <CodeBlock
          title="jest.config.js"
          code={`module.exports = {
  testEnvironment: 'jsdom',
  // let a transform (babel-jest or @swc/jest) compile the package's ES modules
  transformIgnorePatterns: ['/node_modules/(?!nish-ui)'],
};`}
        />
        <Prose>
          <p>
            Overlays portal to <code>document.body</code>, so query with <code>screen</code> rather than the render container. Components guard{' '}
            <code>matchMedia</code>, <code>ResizeObserver</code> and storage, so no polyfills are needed. To test server output, call{' '}
            <code>renderToString</code> in a Node environment: every export renders there without a DOM.
          </p>
        </Prose>
      </Section>

      <Section id="troubleshooting" title="Troubleshooting">
        <Prose>
          <p>
            <strong>Component classes are missing (unstyled buttons).</strong> <code>tailwind.css</code> has an <code>@source</code> line for the
            package&apos;s <code>dist/esm/components</code>. If your setup resolves the package somewhere Tailwind does not follow (some pnpm or monorepo
            layouts), add <code>@source &apos;../node_modules/nish-ui/dist/esm/components&apos;;</code> yourself.
          </p>
          <p>
            <strong>The page flashes the wrong theme on load.</strong> theme-init.js must run before any stylesheet and must not be <code>async</code>,{' '}
            <code>defer</code> or a module. Inline it at the top of <code>&lt;head&gt;</code>. An app&apos;s own themes need{' '}
            <code>window.__nishExtraThemes</code> set before it.
          </p>
          <p>
            <strong>React warns that <code>data-theme</code> differs after hydration.</strong> Put <code>suppressHydrationWarning</code> on{' '}
            <code>&lt;html&gt;</code>.
          </p>
          <p>
            <strong>
              <code>require(&apos;nish-ui&apos;)</code> fails.
            </strong>{' '}
            The package is ES modules; <code>require()</code> of them works on Node 20.19+ and 22.12+. On an older Node, use <code>import()</code>.
          </p>
          <p>
            <strong>A preset chosen on another site shows as dark or light here.</strong> The page limits itself with <code>data-nish-themes</code>; that is
            the intended fallback.
          </p>
          <p>
            <strong>Fonts 404 on a static site after an upgrade.</strong> Font names carry a content hash. Copy every file in <code>dist/files.json</code>,
            not a fixed list.
          </p>
          <p>
            <strong>
              <code>npm install</code> fails with &quot;Permission denied (publickey)&quot;.
            </strong>{' '}
            A <code>github:</code> install met an SSH key GitHub does not accept. Install from npm, or use the fallback tarball URL above.
          </p>
        </Prose>
      </Section>

      <Section id="versioning" title="Versioning and support">
        <Prose>
          <p>
            Semver on the release tags, and the same version on npm. A change is <strong>breaking</strong> when an app has to edit its code or markup to keep
            working or keep its look: removing or renaming a token, role, class, export, prop or file; changing a component&apos;s default; changing the cookie or
            storage key. A major means app code must change, a minor adds (new roles, components, props, files), a patch fixes. Color adjustments that keep
            every contrast check passing are minor or patch. Every release is in the <a href={href('/changelog')}>changelog</a>, and a major has a migration
            guide (<a href="https://github.com/nishant/ui/blob/master/docs/MIGRATING-2.0.md" target="_blank" rel="noreferrer">moving from 1.x to 2.0</a>).
          </p>
          <p>
            A deprecated export keeps working for at least one major and is marked <code>@deprecated</code> in its type. Security fixes go to the latest
            major, and to the previous one for three months after a new major ships; see the repository&apos;s SECURITY.md.
          </p>
        </Prose>
      </Section>
    </div>
  );
}
