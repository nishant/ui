import { useState } from 'react';
import docgen from 'virtual:nish-docgen';
import { CodeBlock } from '../lib/code';
import { href } from '../lib/router';
import { Tabs } from '../../src';
import { PageHeader, Prose, Section } from '../lib/ui';

type Kind = 'react' | 'static' | 'electron';

export function GettingStartedPage() {
  const [kind, setKind] = useState<Kind>('react');
  const v = `v${docgen.version}`;
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Start"
        title="Getting started"
        lead="Install the package, import the CSS, put theme-init.js first in <head>, and use the components. Pick your kind of app."
      />

      <Section title="Install" note="The package ships built files, so there is no build step on install. React is an optional peer.">
        <div className="grid gap-3">
          <CodeBlock title="npm, as @nish/ui" code={`npm install @nish/ui@npm:nish-ui`} />
          <CodeBlock title="npm, as nish-ui" code={`npm install nish-ui`} />
          <CodeBlock title="package.json, from a git tag" code={`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/${v}"`} />
        </div>
        <Prose>
          <p>
            On npm the package is <code>nish-ui</code>, published from every release tag. Installed with the alias, every import on this site works as
            written; installed as <code>nish-ui</code>, read <code>nish-ui</code> wherever it says <code>@nish/ui</code>.
          </p>
          <p>
            The nish.software apps pin the git tag, and the release fan-out keeps that pin current. The tarball URL needs only HTTPS;{' '}
            <code>github:nishant/ui#{v}</code> also works but clones over SSH when the machine has a key, and fails where GitHub does not accept it.
          </p>
        </Prose>
      </Section>

      <Tabs
        variant="pill"
        label="Kind of app"
        value={kind}
        onChange={(v) => setKind(v as Kind)}
        items={[
          { value: 'react', label: 'React + Tailwind 4' },
          { value: 'static', label: 'Static page' },
          { value: 'electron', label: 'Electron' },
        ]}
      />

      {kind === 'react' ? (
        <div className="space-y-8">
          <Section title="1. Import the CSS" note="Tokens, the Inter font, base styles and the th-* color classes, in one import after Tailwind.">
            <CodeBlock
              title="src/index.css"
              code={`@import 'tailwindcss';
@import '@nish/ui/tailwind.css';`}
            />
          </Section>
          <Section title="2. Apply the theme before first paint" note="The nishThemeInit plugin inlines theme-init.js at the top of <head>, so the saved theme is on <html> before anything renders. No flash of the wrong theme.">
            <CodeBlock
              title="vite.config.ts"
              code={`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nishThemeInit } from '@nish/ui/vite';

export default defineConfig({
  plugins: [nishThemeInit(), react(), tailwindcss()],
});`}
            />
            <Prose>
              <p>
                Options for an old localStorage key, a prelude script or the charset position are on the{' '}
                <a href={href('/components/vite-plugin')}>Vite plugin</a> page.
              </p>
            </Prose>
          </Section>
          <Section title="3. Start the theme and mount the toaster">
            <CodeBlock
              title="src/main.tsx"
              code={`import { createRoot } from 'react-dom/client';
import { initTheme, ThemeToggle, Toaster, Button, toast } from '@nish/ui';
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
import nish from '@nish/ui/eslint';

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
                <a href={href('/components/vite-plugin')}>Vite plugin and lint</a> page.
              </p>
            </Prose>
          </Section>
        </div>
      ) : kind === 'static' ? (
        <div className="space-y-8">
          <Section title="1. Copy the dist files" note="From a release tag. Hosting does this with scripts/sync-ui.mjs; dist/files.json lists exactly what to copy.">
            <CodeBlock
              title="what a static site vendors"
              code={docgen.distFiles.map((f) => `nish/${f}`).join('\n')}
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
            note="The renderer is a React + Tailwind app like any other: same install, same CSS import, same components."
          >
            <CodeBlock
              title="apps/renderer/src/index.css"
              code={`@import 'tailwindcss';
@import '@nish/ui/tailwind.css';`}
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
      const shared = readFileSync(require.resolve('@nish/ui/theme-init.js'), 'utf8');
      return [{ tag: 'script', children: shared, injectTo: 'head-prepend' }];
    },
  };
}`}
            />
          </Section>
          <Section title="3. Storage and the window chrome" note="There is no shared domain in Electron, so the choice lives in localStorage only. Keep the native window in step with the scheme.">
            <CodeBlock
              title="apps/renderer/src/theme.ts"
              code={`import { initTheme, onThemeChange, schemeOf } from '@nish/ui';

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
                <code>window.__nishExtraThemes</code> before theme-init.js runs. Nishboard does this for its presets.
              </p>
            </Prose>
          </Section>
        </div>
      )}

      <Section id="troubleshooting" title="Troubleshooting">
        <Prose>
          <p>
            <strong>Component classes are missing (unstyled buttons).</strong> <code>tailwind.css</code> has <code>@source "./"</code>, which tells Tailwind
            to scan the package's <code>dist/</code>. If your setup resolves the package somewhere Tailwind does not follow (some pnpm or monorepo layouts),
            add <code>@source '../node_modules/@nish/ui/dist';</code> (or <code>nish-ui/dist</code>) yourself.
          </p>
          <p>
            <strong>The page flashes the wrong theme on load.</strong> theme-init.js must run before any stylesheet and must not be <code>async</code>,{' '}
            <code>defer</code> or a module. Inline it at the top of <code>&lt;head&gt;</code>. An app's own themes need{' '}
            <code>window.__nishExtraThemes</code> set before it.
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
              <code>npm install</code> fails with "Permission denied (publickey)".
            </strong>{' '}
            A <code>github:</code> install met an SSH key GitHub does not accept. Install from npm or use the codeload tarball URL above.
          </p>
        </Prose>
      </Section>

      <Section id="versioning" title="Versioning">
        <Prose>
          <p>
            Semver on the release tags, and the same version on npm. A change is <strong>breaking</strong> when an app has to edit its code or markup to keep
            working or keep its look: removing or renaming a token, role, class, export, prop or file; changing a component's default; changing the cookie or
            storage key. A major means app code must change, a minor adds (new roles, components, props, files), a patch fixes. Color adjustments that keep
            every contrast check passing are minor or patch. Every release is in the <a href={href('/changelog')}>changelog</a>.
          </p>
        </Prose>
      </Section>
    </div>
  );
}
