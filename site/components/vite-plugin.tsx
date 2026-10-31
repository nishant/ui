import { CodeBlock } from '../lib/code';
import type { ComponentDoc } from './types';

// --- Vite plugin and lint -------------------------------------------------------------------
// Node-only entries: @nish/ui/vite, @nish/ui/eslint and the nish-th-check bin. There is
// nothing to render, so the page shows the config an app writes.

const PLUGIN = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nishThemeInit } from '@nish/ui/vite';

export default defineConfig({
  plugins: [nishThemeInit(), react(), tailwindcss()],
});`;

const PLUGIN_OPTIONS = `// Splice the script right after <meta charset> (status, workflows), and migrate an old key once.
nishThemeInit({ position: 'after-charset', legacyKey: 'theme' });

// Run an app preset before theme-init (nishboard).
nishThemeInit({ prelude: "try{localStorage.setItem('nish-preset','ember')}catch(e){}" });`;

const ESLINT = `// eslint.config.js
import tseslint from 'typescript-eslint';
import nish from '@nish/ui/eslint';

export default [
  ...tseslint.configs.recommended,
  ...nish.configs.react, // after the TypeScript config: it ships rules only, no parser
  // servers and scripts: ...nish.configs.node (the core rules, no theme rules)
];`;

const RULES = `nish/no-unknown-th-class   a th-* color @nish/ui does not define (a made-up name after bg-th-)
nish/no-raw-palette        bg-red-500, text-slate-300: bypasses the theme
nish/no-white-black        text-white, bg-black: ignores the theme
nish/no-legacy-th-alias    text-th-gain, bg-th-danger, text-th-2: use th-ok, th-loss, th-hi2
nish/no-hand-mixed-tint    bg-th-accent/10: use bg-th-accent-soft
nish/no-arbitrary-text-size  text-[13px]: use the type scale`;

const CHECK = `# package.json: "th-check": "nish-th-check src"
npx nish-th-check src site          # directories or files; default: src
# exits 1 and prints file:line and the class for each unknown th-* color`;

const TSCONFIG = `// tsconfig.json: a Vite + React app
{ "extends": "@nish/ui/tsconfig/react.json", "include": ["src"] }

// a server or script: NodeNext resolution and node types
{ "extends": "@nish/ui/tsconfig/node.json", "include": ["server"] }

// base.json: strict, ES2023, Bundler resolution, isolatedModules, noEmit`;

export const vitePlugin: ComponentDoc = {
  id: 'vite-plugin',
  name: 'Vite plugin, lint and tsconfig',
  exports: [],
  source: 'src/node/vite.ts',
  summary:
    'Node-only entries for the build. @nish/ui/vite puts the theme-init script into index.html so every app sets its theme before first paint without copying the script. @nish/ui/eslint and the nish-th-check command stop made-up th-* colors and raw palette classes from reaching the page.',
  importLine: "import { nishThemeInit } from '@nish/ui/vite';",
  controls: [],
  initial: {},
  render: () => <code className="rounded-md bg-th-elevated px-2 py-1 font-mono text-xs text-th-hi2">plugins: [nishThemeInit()]</code>,
  code: () => "plugins: [nishThemeInit(), react(), tailwindcss()]",
  stories: [
    { id: 'plugin', name: 'vite.config.ts', wide: true, render: () => <CodeBlock code={PLUGIN} title="vite.config.ts" /> },
    { id: 'options', name: 'Plugin options', wide: true, render: () => <CodeBlock code={PLUGIN_OPTIONS} title="vite.config.ts" /> },
    { id: 'eslint', name: '@nish/ui/eslint', wide: true, render: () => <CodeBlock code={ESLINT} title="eslint.config.js" /> },
    { id: 'rules', name: 'The nish/* rules', wide: true, render: () => <CodeBlock code={RULES} title="rules" /> },
    { id: 'tsconfig', name: 'TypeScript presets', wide: true, render: () => <CodeBlock code={TSCONFIG} title="tsconfig.json" /> },
    { id: 'check', name: 'nish-th-check', wide: true, render: () => <CodeBlock code={CHECK} title="terminal" /> },
  ],
  usage: `${PLUGIN}

${ESLINT}`,
  guidelines: [
    'Put nishThemeInit() first in plugins, so the script is in the page before any other transform touches the HTML.',
    'The plugin and the lint preset run in Node only. They import nothing from React and have no runtime dependencies, so adding them never changes the app bundle.',
    'Put the ESLint preset after tseslint.configs.recommended. It has its own rules, so it never replaces your own no-restricted-syntax options.',
    'Run nish-th-check in the app\'s check script too: it also covers CSS and HTML files that ESLint does not parse.',
    'The checker skips node_modules, dist and *.test.* files, which hold deliberately wrong classes as fixtures.',
  ],
  api: { functions: ['nishThemeInit'], interfaces: ['NishThemeInitOptions'] },
};
