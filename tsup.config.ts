import { existsSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';

// @nish/ui/chart (src/chart.ts): chart colors and tooltip styles with no chart library
// and no React. Built whenever the source exists. (The React-free @nish/ui/tokens entry
// is src/tokens.mjs copied as is by scripts/build.mjs.)
// format, chart and inbox-client stand alone (no chunk imports): hosting's static pages vendor
// dist/format.js as one file, so a shared chunk would 404 there (v1.0.0 shipped that bug).
const standalone: Record<string, string> = { format: 'src/format.ts', 'inbox-client': 'src/inbox-client.ts' };
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

const configs: Options[] = [
  {
    // The React entry on its own, with code splitting.
    entry: { index: 'src/index.ts' },
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
  { entry: { 'server/index': 'src/server/index.ts', 'server/hono': 'src/server/hono.ts' }, format: ['esm'], dts: true, sourcemap: true, target: 'node22', platform: 'node', outDir: 'dist', clean: false, splitting: false, external: ['hono', /^hono\//] },
];
if (Object.keys(nodeEntry).length) configs.push({ ...nodeBase, entry: nodeEntry });
if (existsSync('src/node/th-check.ts')) {
  configs.push({ ...nodeBase, entry: { 'node/th-check': 'src/node/th-check.ts' }, banner: { js: '#!/usr/bin/env node' } });
}

export default defineConfig(configs);
