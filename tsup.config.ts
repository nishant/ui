import { existsSync } from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';

// Every standalone JS build gets the package version (scripts/build.mjs defines the same name for dist/esm).
const NISH_UI_VERSION: string = JSON.parse(readFileSync('package.json', 'utf8')).version;
const define = { __NISH_UI_VERSION__: JSON.stringify(NISH_UI_VERSION) };

// The bundler-facing JS (index, system-canvas and every module under src/) is built by scripts/build.mjs into
// dist/esm/ as one file per source module. tsup only writes its types here (dts only), plus the standalone
// single files static pages and CDNs vendor.

// @nish/ui/chart: chart colors and tooltip styles with no chart library. dist/chart.js is the standalone file
// for static pages and is built from src/chart-values.ts alone (no React, no bare imports, because a page cannot
// resolve `react`); useChartTheme lives in the bundler build (dist/esm/chart.js), and dist/chart.d.ts is
// generated from src/chart.ts so the types still list it. (The React-free @nish/ui/tokens entry
// is src/tokens.mjs copied as is by scripts/build.mjs.)
// format, chart, split-layout and inbox-client stand alone (no chunk imports): hosting's static pages vendor
// dist/format.js as one file, so a shared chunk would 404 there (v1.0.0 shipped that bug).
const standalone: Record<string, string> = { format: 'src/format.ts', 'inbox-client': 'src/inbox-client.ts', 'split-layout': 'src/split-layout.ts' };

// Node-only entries (Vite plugin, ESLint preset, th-check CLI) build to dist/node/.
// They import nothing from React and Tailwind does not scan them. Each is built only when
// its source exists.
const nodeBase: Options = {
  define,
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
    define,
    onSuccess: async () => {
      const { copyFileSync } = await import('node:fs');
      if (name === 'elements-all') writeFileSync(`dist/${name}.d.ts`, elementsAllTypes());
      else copyFileSync(types, `dist/${name}.d.ts`);
    },
    // No source map: these minified files are mostly Lit, and their maps (2 MB with elements-all) would push the tarball past its size budget.
    sourcemap: false,
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
    // Types of the main entry and of the system-canvas, inbox and service-tokens entries. Their JS is the
    // preserved-modules build in dist/esm.
    entry: {
      index: 'src/index.ts',
      'system-canvas': 'src/system-canvas.ts',
      inbox: 'src/inbox.ts',
      'service-tokens': 'src/service-tokens.ts',
      ...(existsSync('src/chart.ts') ? { chart: 'src/chart.ts' } : {}),
    },
    format: ['esm'],
    dts: { only: true },
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
    define,
    sourcemap: true,
    target: 'es2022',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    outDir: 'dist',
    clean: false,
    splitting: false,
  },
  ...(existsSync('src/chart-values.ts')
    ? [
        {
          // dist/chart.js: the pure values only, so it has no React import. Its types come from the dts-only config above.
          entry: { chart: 'src/chart-values.ts' },
          format: ['esm'],
          dts: false,
          define,
          sourcemap: true,
          target: 'es2022',
          outDir: 'dist',
          clean: false,
          splitting: false,
        } satisfies Options,
      ]
    : []),
  {
    // dist/theme.global.js: an IIFE that sets window.nishTheme, for classic scripts.
    entry: { theme: 'src/theme-global.ts' },
    format: ['iife'],
    globalName: 'nishTheme',
    dts: false,
    define,
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
  // Every element in one file (one Lit copy) for a page that uses them all. Its types are generated from the four hand-written ones.
  elementsConfig('elements-all', 'src/elements/all.ts', 'src/elements/public.d.ts'),
  { entry: { 'server/index': 'src/server/index.ts', 'server/hono': 'src/server/hono.ts' }, format: ['esm'], dts: true, define, sourcemap: true, target: 'node22', platform: 'node', outDir: 'dist', clean: false, splitting: false, external: ['hono', /^hono\//] },
];
if (Object.keys(nodeEntry).length) configs.push({ ...nodeBase, entry: nodeEntry });
if (existsSync('src/node/th-check.ts')) {
  configs.push({ ...nodeBase, entry: { 'node/th-check': 'src/node/th-check.ts' }, banner: { js: '#!/usr/bin/env node' } });
}

export default defineConfig(configs);

/** dist/elements-all.d.ts: the union of the four hand-written public*.d.ts files, re-exported from the files they
 *  are copied to (a name that several entries declare, such as NishElement, is exported once, from the first). */
function elementsAllTypes(): string {
  const sources: [string, string][] = [
    ['src/elements/public.d.ts', './elements.js'],
    ['src/elements/public-forms.d.ts', './elements-forms.js'],
    ['src/elements/public-data.d.ts', './elements-data.js'],
    ['src/elements/public-charts.d.ts', './elements-charts.js'],
  ];
  const seen = new Set<string>();
  const lines = ['// nish-ui/elements/all: generated by tsup.config.ts from the four public*.d.ts files.'];
  for (const [file, from] of sources) {
    const values: string[] = [];
    const types: string[] = [];
    for (const m of readFileSync(file, 'utf8').matchAll(/^export (declare )?(class|function|const|interface|type|enum)\s+(\w+)/gm)) {
      const name = m[3];
      if (seen.has(name)) continue;
      seen.add(name);
      (['class', 'function', 'const', 'enum'].includes(m[2]) ? values : types).push(name);
    }
    if (values.length) lines.push(`export { ${values.join(', ')} } from '${from}';`);
    if (types.length) lines.push(`export type { ${types.join(', ')} } from '${from}';`);
  }
  return lines.join('\n') + '\n';
}
