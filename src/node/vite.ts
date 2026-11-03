// @nish/ui/vite: a Vite plugin that puts theme-init.js (the pre-paint theme script) into
// index.html, so every app sets data-theme before first paint without copying the script.
// Node only. Imports nothing from React, and nothing from vite (the plugin type is local,
// structurally compatible with Vite's Plugin, so this package needs no vite install).
import { createHash } from 'node:crypto';
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
  /** CSP nonce for the injected inline script: a string, or a function called when the HTML is transformed.
   *  The script tag gets `nonce="…"`. Vite transforms index.html once at build time, so in a production build
   *  the value is baked into the file and every response carries it: for a real per-response nonce pass a
   *  placeholder such as `'__NISH_CSP_NONCE__'` and have your server replace it with a fresh random value on
   *  each response. For static hosting use the `hash` property of the plugin instead. A function gives a
   *  fresh value per request only in the dev server. Default: no nonce attribute. */
  nonce?: string | (() => string);
}

/** Structurally compatible with Vite's `Plugin` for the one hook this plugin uses. */
export interface NishThemeInitPlugin {
  name: string;
  /** CSP source (`'sha256-...'` without quotes) of the exact script this plugin injects, including any
   *  prelude or legacyKey code. Differs from dist/theme-init.sha256, which covers only the file as shipped.
   *  With a `nonce` set, the nonce is what CSP checks, not this hash. */
  hash: string;
  transformIndexHtml: {
    order: 'pre';
    handler: (html: string) => string | { tag: string; attrs?: Record<string, string>; children: string; injectTo: 'head-prepend' }[];
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
  // Read per page, so a function can hand out a fresh nonce for every response.
  const nonceAttr = (): string | undefined => {
    const n = typeof o.nonce === 'function' ? o.nonce() : o.nonce;
    return n ? n : undefined;
  };
  return {
    name: 'nish-theme-init',
    hash: 'sha256-' + createHash('sha256').update(code).digest('base64'),
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => {
        const nonce = nonceAttr();
        if (position === 'head-prepend' || (position === 'auto' && !charset.test(html))) {
          return [{ tag: 'script', ...(nonce ? { attrs: { nonce } } : {}), children: code, injectTo: 'head-prepend' }];
        }
        if (!charset.test(html)) throw new Error('@nish/ui/vite: no <meta charset> in index.html');
        return html.replace(charset, (m) => m + (nonce ? `<script nonce="${escapeAttr(nonce)}">` : '<script>') + code + '</script>');
      },
    },
  };
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
