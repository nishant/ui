import { existsSync } from 'node:fs';
import { defineConfig } from 'tsup';

// @nish/ui/chart (src/chart.ts): chart colors and tooltip styles with no chart library
// and no React. Built whenever the source exists. (The React-free @nish/ui/tokens entry
// is src/tokens.mjs copied as is by scripts/build.mjs.)
const entry: Record<string, string> = { index: 'src/index.ts', theme: 'src/theme.ts', format: 'src/format.ts', 'inbox-client': 'src/inbox-client.ts' };
if (existsSync('src/chart.ts')) entry.chart = 'src/chart.ts';

export default defineConfig([
  {
    entry,
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outDir: 'dist',
    clean: false,
    // theme.js must stand alone: static sites vendor that one file with no chunks.
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
]);
