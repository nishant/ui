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
        lead="Install a release tag, import the CSS, put theme-init.js first in <head>, and use the components. Pick your kind of app."
      />

      <Section title="Install" note="Releases are git tags with the built dist/ committed, so there is no build step on install.">
        <div className="grid gap-3">
          <CodeBlock title="npm" code={`npm install github:nishant/ui#${v}`} />
          <CodeBlock title="pnpm" code={`pnpm add github:nishant/ui#${v}`} />
          <CodeBlock
            title="package.json, without SSH (CI runners, the hosting PC)"
            code={`"@nish/ui": "https://codeload.github.com/nishant/ui/tar.gz/refs/tags/${v}"`}
          />
        </div>
        <Prose>
          <p>
            <code>github:</code> installs clone over SSH when a key is set up and fall back to HTTPS otherwise. If a machine has an SSH key GitHub does not
            accept, the install fails; the tarball URL above needs only HTTPS.
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
  ...nish, // after the TypeScript config; it adds the nish/* rules and ships no parser
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
    </div>
  );
}
