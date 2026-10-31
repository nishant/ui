// ui lints itself with its own preset, loaded from source (ESLint loads this file through jiti),
// so `npm run lint` needs no build.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import nish from './src/node/eslint.ts';

const REACT_FILES = ['src/components/**/*.{ts,tsx}', 'site/**/*.{ts,tsx,js,jsx,mjs}', 'demo/**/*.{ts,tsx}'];
const NODE_FILES = ['src/node/**', 'src/server/**', 'tools/**', 'scripts/**', 'tests/**', '*.config.ts'];

/** Re-scope each preset entry to `files`. */
const scoped = (configs: typeof nish.configs.react, files: string[], globalSet: Record<string, boolean | 'readonly' | 'writable' | 'off'>) =>
  configs.map((c) => ({
    ...c,
    files,
    languageOptions: { globals: globalSet },
  }));

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'site-dist/**',
      '.demo-dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'visual-out/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // A leading underscore marks a binding that is only there to leave it out of a rest object or a signature.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: REACT_FILES,
  },
  ...scoped(nish.configs.react, REACT_FILES, globals.browser),
  ...scoped(nish.configs.node, NODE_FILES, globals.node),
  {
    // TODO(standards): 36 hits at adoption (flow, overlay, resource, url-state, hooks, ...): refs read in render
    // for latest-value patterns. Fixing each means restructuring hooks in a published library.
    files: REACT_FILES,
    rules: { 'react-hooks/refs': 'warn' },
  },
  {
    // theme-init.js is a template the build fills in (__THEMES__, __BG__, __DEFAULT__) and inlines as
    // one tiny pre-paint script: browser globals, and its empty catches stay as shipped.
    files: ['src/theme-init.js'],
    languageOptions: {
      globals: { ...globals.browser, __THEMES__: 'readonly', __BG__: 'readonly', __DEFAULT__: 'readonly' },
    },
    rules: { 'no-empty': 'off', '@typescript-eslint/no-unused-vars': 'off' },
  },
  {
    // tools/visual-check.mjs passes functions to page.evaluate(), which run in the browser.
    files: ['tools/visual-check.mjs'],
    languageOptions: { globals: globals.browser },
  },
  {
    // The docs site uses 13px code and 15px prose sizes that the type scale does not have.
    files: ['site/**'],
    rules: { 'nish/no-arbitrary-text-size': 'off' },
  },
  {
    // Files that legitimately name raw classes and tokens: the rules' own tests and the class
    // table (th-classes.ts) contain deliberately wrong class strings as fixtures and definitions.
    files: [
      'src/node/eslint.test.ts',
      'src/node/th-classes.test.ts',
      'src/node/th-classes.ts',
      'src/node/eslint.ts',
      'site/components/vite-plugin.tsx', // prints the rules' example classes (bg-red-500, text-[13px]) as documentation text
    ],
    rules: Object.fromEntries(Object.keys(nish.rules).map((id) => [`nish/${id}`, 'off'])),
  },
);
