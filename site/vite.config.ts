// The docs site (design.nish.software). Built from this repo's own src and dist, so it
// always shows exactly the code being released. Plain static output: hash routes and
// relative asset URLs, so site-dist/ works served from any path.
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { docgen } from './docgen.mjs';

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

/** virtual:nish-docgen: props tables from the TypeScript source, plus package facts. */
function docs(): Plugin {
  const id = 'virtual:nish-docgen';
  const resolved = '\0' + id;
  return {
    name: 'nish-docgen',
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return;
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
      const files = JSON.parse(readFileSync(join(dist, 'files.json'), 'utf8'));
      const data = { ...docgen(root), version: pkg.version, name: pkg.name, distFiles: files.static };
      return `export default ${JSON.stringify(data)};`;
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(join(root, 'src'))) {
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
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
  plugins: [themeInit(), docs(), staticExample(), react(), tailwindcss()],
  server: { port: 5191, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 5191, strictPort: true },
  build: { outDir: join(root, 'site-dist'), emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
