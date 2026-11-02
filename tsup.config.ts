import { existsSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';

// @nish/ui/chart (src/chart.ts): chart colors and tooltip styles with no chart library
// and no React. Built whenever the source exists. (The React-free @nish/ui/tokens entry
// is src/tokens.mjs copied as is by scripts/build.mjs.)
// format, chart, split-layout and inbox-client stand alone (no chunk imports): hosting's static pages vendor
// dist/format.js as one file, so a shared chunk would 404 there (v1.0.0 shipped that bug).
const standalone: Record<string, string> = { format: 'src/format.ts', 'inbox-client': 'src/inbox-client.ts', 'split-layout': 'src/split-layout.ts' };
if (existsSync('src/chart.ts')) standalone.chart = 'src/chart.ts';

// Node-only entries (Vite plugin, ESLint preset, th-check CLI) build to dist/node/.
// They import nothing from React and Tailwind does not scan them. Each is built only when
// its source exists.
const nodeBase: Options = {
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  dts: true,
  sourcemap: false,
  splitting: false,
  outDir: 'dist',
  clean: false,
};
const nodeEntry: Record<string, string> = {};
if (existsSync('src/node/vite.ts')) nodeEntry['node/vite'] = 'src/node/vite.ts';
if (existsSync('src/node/eslint.ts')) nodeEntry['node/eslint'] = 'src/node/eslint.ts';

// One self-contained ESM file with Lit bundled in and no shared chunks, because static sites vendor single files.
// Types are hand-written (public*.d.ts) so dist/elements*.d.ts never imports lit.
function elementsConfig(name: string, entry: string, types: string): Options {
  return {
    entry: { [name]: entry },
    format: ['esm'],
    dts: false,
    onSuccess: async () => {
      const { copyFileSync } = await import('node:fs');
      copyFileSync(types, `dist/${name}.d.ts`);
    },
    sourcemap: true,
    target: 'es2022',
    noExternal: ['lit', /^@lit\//],
    minify: true,
    outDir: 'dist',
    clean: false,
    splitting: false,
  };
}

const configs: Options[] = [
  {
    // The main entry. SystemCanvas is imported from './system-canvas.js', which stays external here and is
    // built on its own below, so a bundler can tree-shake the canvas out of apps that do not render it.
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime', './system-canvas.js'],
    outDir: 'dist',
    clean: false,
    splitting: true,
  },
  {
    // @nish/ui/system-canvas: one self-contained module (no shared chunks with index), so the canvas
    // never lands in a chunk that the rest of the component set needs.
    entry: { 'system-canvas': 'src/system-canvas.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outDir: 'dist',
    clean: false,
    splitting: false,
  },
  {
    // theme.js and the small entries must stand alone: static sites vendor them as single files.
    entry: { theme: 'src/theme.ts', ...standalone },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outDir: 'dist',
    clean: false,
    splitting: false,
  },
  {
    // dist/theme.global.js: an IIFE that sets window.nishTheme, for classic scripts.
    entry: { theme: 'src/theme-global.ts' },
    format: ['iife'],
    globalName: 'nishTheme',
    dts: false,
    sourcemap: true,
    target: 'es2017',
    outDir: 'dist',
    clean: false,
  },
  elementsConfig('elements', 'src/elements/index.ts', 'src/elements/public.d.ts'),
  // Wave 2 and 3 entries: each is its own self-contained file (own Lit copy), so a page loads only what it uses.
  elementsConfig('elements-forms', 'src/elements/forms.ts', 'src/elements/public-forms.d.ts'),
  elementsConfig('elements-data', 'src/elements/data.ts', 'src/elements/public-data.d.ts'),
  elementsConfig('elements-charts', 'src/elements/charts.ts', 'src/elements/public-charts.d.ts'),
  { entry: { 'server/index': 'src/server/index.ts', 'server/hono': 'src/server/hono.ts' }, format: ['esm'], dts: true, sourcemap: true, target: 'node22', platform: 'node', outDir: 'dist', clean: false, splitting: false, external: ['hono', /^hono\//] },
];
if (Object.keys(nodeEntry).length) configs.push({ ...nodeBase, entry: nodeEntry });
if (existsSync('src/node/th-check.ts')) {
  configs.push({ ...nodeBase, entry: { 'node/th-check': 'src/node/th-check.ts' }, banner: { js: '#!/usr/bin/env node' } });
}

export default defineConfig(configs);
