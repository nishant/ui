import { existsSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';

// @nish/ui/chart (src/chart.ts): chart colors and tooltip styles with no chart library
// and no React. Built whenever the source exists. (The React-free @nish/ui/tokens entry
// is src/tokens.mjs copied as is by scripts/build.mjs.)
const entry: Record<string, string> = { index: 'src/index.ts', format: 'src/format.ts', 'inbox-client': 'src/inbox-client.ts' };
if (existsSync('src/chart.ts')) entry.chart = 'src/chart.ts';

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

const configs: Options[] = [
  {
    // React/browser ESM. Chunks are shared between entries (splitting) so code used by
    // more than one entry is bundled once.
    entry,
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outDir: 'dist',
    clean: false,
    splitting: true,
  },
  {
    // theme.js must stand alone: static sites vendor that one file with no chunks.
    entry: { theme: 'src/theme.ts' },
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
];
if (Object.keys(nodeEntry).length) configs.push({ ...nodeBase, entry: nodeEntry });
if (existsSync('src/node/th-check.ts')) {
  configs.push({ ...nodeBase, entry: { 'node/th-check': 'src/node/th-check.ts' }, banner: { js: '#!/usr/bin/env node' } });
}

export default defineConfig(configs);
