// The docs site (design.nish.software). Built from this repo's own src and dist, so it
// always shows exactly the code being released. Plain static output: hash routes and
// relative asset URLs, so site-dist/ works served from any path.
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { docgen } from './docgen.mjs';
import { docsMeta } from './docs-meta.mjs';

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const exampleDir = join(import.meta.dirname, 'static-example');

function requireDist(): void {
  if (!existsSync(join(dist, 'theme-init.js'))) throw new Error('dist/ is missing: run `npm run build` first');
}

/** Inlines dist/theme-init.js at the top of <head>, the way every app should. */
function themeInit(): Plugin {
  return {
    name: 'nish-theme-init',
    transformIndexHtml() {
      requireDist();
      return [{ tag: 'script', children: readFileSync(join(dist, 'theme-init.js'), 'utf8'), injectTo: 'head-prepend' }];
    },
  };
}

/** virtual:nish-docgen: props tables from the TypeScript source. Only the component page and the
 *  search's props items import it, so it stays out of the shell chunk. */
function docs(): Plugin {
  const id = 'virtual:nish-docgen';
  const resolved = '\0' + id;
  return {
    name: 'nish-docgen',
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return;
      return `export default ${JSON.stringify(docgen(root))};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(join(root, 'src'))) {
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
    },
  };
}

/** virtual:nish-pkg: name, version and the static dist files. Small, so it ships eagerly. */
function pkgFacts(): Plugin {
  const id = 'virtual:nish-pkg';
  const resolved = '\0' + id;
  return {
    name: 'nish-pkg',
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return;
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
      const files = JSON.parse(readFileSync(join(dist, 'files.json'), 'utf8'));
      return `export default ${JSON.stringify({ name: pkg.name, version: pkg.version, distFiles: files.static })};`;
    },
  };
}

/** virtual:nish-docs-meta: every doc's id, name, summary, exports, framed and fleetOnly, read from
 *  the doc sources, so the nav, search and wall do not import the doc pages themselves. */
function docsMetaPlugin(): Plugin {
  const id = 'virtual:nish-docs-meta';
  const resolved = '\0' + id;
  const components = join(root, 'site', 'components');
  return {
    name: 'nish-docs-meta',
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return;
      return `export default ${JSON.stringify(docsMeta(root))};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(components)) {
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
    },
  };
}

/** Writes .site-stats.json (gzip size and links of every chunk) for tools/site-bundle-check.mjs.
 *  It goes to the repo root, never into site-dist/, which hosting mirrors in full. */
function siteStats(): Plugin {
  return {
    name: 'nish-site-stats',
    apply: 'build',
    generateBundle(_, bundle) {
      const stats: { entry: string; chunks: Record<string, { gzip: number; imports: string[]; dynamicImports: string[]; facade: string | null }> } = { entry: '', chunks: {} };
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        if (item.isEntry) stats.entry = item.fileName;
        const id = item.facadeModuleId;
        stats.chunks[item.fileName] = {
          gzip: gzipSync(item.code).length,
          imports: item.imports,
          dynamicImports: item.dynamicImports,
          facade: id ? (id.startsWith('\0') ? id : relative(root, id).split('\\').join('/')) : null,
        };
      }
      writeFileSync(join(root, '.site-stats.json'), JSON.stringify(stats, null, 2));
    },
  };
}

/** static-example/: plain HTML pages that use only the dist files a static site vendors.
 *  Served from dist in dev and copied into the build, so the iframe on the Static sites
 *  page runs the real nish.css, theme-init.js, theme.js and theme.global.js. */
function staticExample(): Plugin {
  const pages = () => readdirSync(exampleDir).filter((f) => f.endsWith('.html'));
  const vendored = () => JSON.parse(readFileSync(join(dist, 'files.json'), 'utf8')).static as string[];
  return {
    name: 'nish-static-example',
    configureServer(server) {
      server.middlewares.use('/static-example/', (req, res, next) => {
        const path = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
        let file: string | null = null;
        if (pages().includes(path)) file = join(exampleDir, path);
        else if (path.startsWith('nish/') && vendored().includes(path.slice(5))) file = join(dist, path.slice(5));
        if (!file) return next();
        const type = file.endsWith('.html')
          ? 'text/html'
          : file.endsWith('.css')
            ? 'text/css'
            : file.endsWith('.js')
              ? 'text/javascript'
              : 'font/woff2';
        res.setHeader('Content-Type', type);
        res.end(readFileSync(file));
      });
    },
    generateBundle() {
      requireDist();
      for (const f of pages()) this.emitFile({ type: 'asset', fileName: `static-example/${f}`, source: readFileSync(join(exampleDir, f)) });
      for (const f of vendored()) this.emitFile({ type: 'asset', fileName: `static-example/nish/${f}`, source: readFileSync(join(dist, f)) });
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [themeInit(), docs(), pkgFacts(), docsMetaPlugin(), staticExample(), siteStats(), react(), tailwindcss()],
  server: { port: 5191, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 5191, strictPort: true },
  build: { outDir: join(root, 'site-dist'), emptyOutDir: true, chunkSizeWarningLimit: 500 },
});
