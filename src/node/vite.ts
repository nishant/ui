// @nish/ui/vite: a Vite plugin that puts theme-init.js (the pre-paint theme script) into
// index.html, so every app sets data-theme before first paint without copying the script.
// Node only. Imports nothing from React, and nothing from vite (the plugin type is local,
// structurally compatible with Vite's Plugin, so this package needs no vite install).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface NishThemeInitOptions {
  /** Path to theme-init.js. Default: resolved from this package (../theme-init.js next to dist/node). */
  file?: string;
  /** Where the script goes. 'head-prepend' (default) is the first thing in <head>. 'after-charset' splices it
   *  right after `<meta charset…>` (the charset must stay in the first 1024 bytes); throws if the page has none. */
  position?: 'head-prepend' | 'after-charset';
  /** JS run before theme-init in the same script (nishboard sets app presets this way). */
  prelude?: string;
  /** An old localStorage key (e.g. 'theme') whose value is copied to 'nish-theme' once, when there is no
   *  nish-theme cookie or localStorage value yet. Runs before theme-init. */
  legacyKey?: string;
}

/** Structurally compatible with Vite's `Plugin` for the one hook this plugin uses. */
export interface NishThemeInitPlugin {
  name: string;
  transformIndexHtml: {
    order: 'pre';
    handler: (html: string) => string | { tag: string; children: string; injectTo: 'head-prepend' }[];
  };
}

/** Adds the theme-init script to index.html. Usage: `plugins: [nishThemeInit(), react(), tailwindcss()]`. */
export function nishThemeInit(o: NishThemeInitOptions = {}): NishThemeInitPlugin {
  const file = o.file ?? fileURLToPath(new URL('../theme-init.js', import.meta.url));
  if (!existsSync(file)) throw new Error(`@nish/ui/vite: theme-init.js not found at ${file}`);
  const themeInit = readFileSync(file, 'utf8').trim();
  const legacy = o.legacyKey
    ? `try{var k=${JSON.stringify(o.legacyKey)},v=localStorage.getItem(k);if(v&&!localStorage.getItem('nish-theme')&&!/(?:^|; )nish-theme=/.test(document.cookie))localStorage.setItem('nish-theme',v)}catch(e){}`
    : '';
  const code = [legacy, o.prelude, themeInit].filter(Boolean).join('\n');

  if (o.position === 'after-charset') {
    return {
      name: 'nish-theme-init',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => {
          if (!/<meta\s+charset[^>]*>/i.test(html)) throw new Error('@nish/ui/vite: no <meta charset> in index.html');
          return html.replace(/<meta\s+charset[^>]*>/i, (m) => m + '<script>' + code + '</script>');
        },
      },
    };
  }
  return {
    name: 'nish-theme-init',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{ tag: 'script', children: code, injectTo: 'head-prepend' }],
    },
  };
}
