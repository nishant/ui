// @nish/ui/vite: a Vite plugin that puts theme-init.js (the pre-paint theme script) into
// index.html, so every app sets data-theme before first paint without copying the script.
// Node only. Imports nothing from React, and nothing from vite (the plugin type is local,
// structurally compatible with Vite's Plugin, so this package needs no vite install).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface NishThemeInitOptions {
  /** Path to theme-init.js. Default: resolved from this package (../theme-init.js next to dist/node). */
  file?: string;
  /** Where the script goes. 'auto' (default): right after `<meta charset…>` when the page has one, else the
   *  first thing in <head>. 'head-prepend' is always first in <head>, which pushes a later charset past the
   *  first 1024 bytes. 'after-charset' splices it right after `<meta charset…>`; throws if the page has none. */
  position?: 'auto' | 'head-prepend' | 'after-charset';
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
  // Whole-line // comments are for readers of the source; every page would carry them in its
  // render-blocking <head> script.
  const themeInit = readFileSync(file, 'utf8').replace(/^[ \t]*\/\/.*(?:\r?\n|$)/gm, '').trim();
  const legacy = o.legacyKey
    ? `try{var k=${JSON.stringify(o.legacyKey)},v=localStorage.getItem(k);if(v&&!localStorage.getItem('nish-theme')&&!/(?:^|; )nish-theme=/.test(document.cookie))localStorage.setItem('nish-theme',v)}catch(e){}`
    : '';
  const code = [legacy, o.prelude, themeInit].filter(Boolean).join('\n');

  const position = o.position ?? 'auto';
  const charset = /<meta\s+charset[^>]*>/i;
  return {
    name: 'nish-theme-init',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => {
        if (position === 'head-prepend' || (position === 'auto' && !charset.test(html))) {
          return [{ tag: 'script', children: code, injectTo: 'head-prepend' }];
        }
        if (!charset.test(html)) throw new Error('@nish/ui/vite: no <meta charset> in index.html');
        return html.replace(charset, (m) => m + '<script>' + code + '</script>');
      },
    },
  };
}
