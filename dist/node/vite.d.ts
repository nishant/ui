interface NishThemeInitOptions {
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
interface NishThemeInitPlugin {
    name: string;
    transformIndexHtml: {
        order: 'pre';
        handler: (html: string) => string | {
            tag: string;
            children: string;
            injectTo: 'head-prepend';
        }[];
    };
}
/** Adds the theme-init script to index.html. Usage: `plugins: [nishThemeInit(), react(), tailwindcss()]`. */
declare function nishThemeInit(o?: NishThemeInitOptions): NishThemeInitPlugin;

export { nishThemeInit };
export type { NishThemeInitOptions, NishThemeInitPlugin };
