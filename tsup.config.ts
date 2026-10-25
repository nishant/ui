import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts', theme: 'src/theme.ts' },
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
