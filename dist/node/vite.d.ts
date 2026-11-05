interface NishThemeInitOptions {
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
interface NishThemeInitPlugin {
    name: string;
    /** CSP source (`'sha256-...'` without quotes) of the exact script this plugin injects, including any
     *  prelude or legacyKey code. Differs from dist/theme-init.sha256, which covers only the file as shipped.
     *  With a `nonce` set, the nonce is what CSP checks, not this hash. */
    hash: string;
    transformIndexHtml: {
        order: 'pre';
        handler: (html: string) => string | {
            tag: string;
            attrs?: Record<string, string>;
            children: string;
            injectTo: 'head-prepend';
        }[];
    };
}
/** Adds the theme-init script to index.html. Usage: `plugins: [nishThemeInit(), react(), tailwindcss()]`. */
declare function nishThemeInit(o?: NishThemeInitOptions): NishThemeInitPlugin;

export { nishThemeInit };
export type { NishThemeInitOptions, NishThemeInitPlugin };
