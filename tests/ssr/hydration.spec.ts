// Server HTML plus hydrateRoot in Chromium: no recoverable error, no console.error (React's
// hydration mismatch warnings), and <html data-theme> set by theme-init survives hydration.
// The scenarios are in hydration-app.tsx; the server side is rendered here with renderToString
// from an esbuild bundle of the same module, the client side is bundled for the browser. Both
// bundles are built from this repo's src, so the spec tests the code being released.
// `npm run build` must run first: the page loads dist/theme-init.js, and the spec fails without it.
import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
// One folder per worker process: Playwright runs beforeAll once in every worker.
const work = resolve(root, 'node_modules/.nish-hydration', String(process.pid));
const ORIGIN = 'http://hydrate.test';

let clientJs = '';
let themeInit = '';
let renderToString: (el: never) => string;
let scenarios: Record<string, { render: () => unknown }>;

test.beforeAll(async () => {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const common = { absWorkingDir: root, bundle: true, logLevel: 'error' as const, jsx: 'automatic' as const, loader: { '.css': 'empty' as const } };
  await build({
    ...common,
    entryPoints: ['tests/ssr/hydration-client.tsx'],
    outfile: resolve(work, 'client.js'),
    format: 'esm',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  await build({
    ...common,
    entryPoints: ['tests/ssr/hydration-app.tsx'],
    outfile: resolve(work, 'server.mjs'),
    format: 'esm',
    platform: 'node',
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  });
  clientJs = readFileSync(resolve(work, 'client.js'), 'utf8');
  const themeInitPath = resolve(root, 'dist/theme-init.js');
  if (!existsSync(themeInitPath)) throw new Error('dist/theme-init.js missing: run `npm run build` before this spec');
  themeInit = readFileSync(themeInitPath, 'utf8');
  scenarios = (await import(pathToFileURL(resolve(work, 'server.mjs')).href)).scenarios;
  renderToString = (await import('react-dom/server')).renderToString;
});
test.afterAll(() => rmSync(work, { recursive: true, force: true }));

const NAMES = ['toaster', 'app-shell', 'theme-toggle', 'app-header', 'modal-open', 'local-storage', 'mixed'];

async function open(page: import('@playwright/test').Page, name: string, storage: Record<string, string>) {
  await page.addInitScript((entries) => {
    try {
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
    } catch {
      /* storage blocked */
    }
  }, storage);
  await page.route(`${ORIGIN}/**`, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/client.js') return route.fulfill({ body: clientJs, contentType: 'text/javascript' });
    const html = renderToString(scenarios[name]!.render() as never);
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>${themeInit}</script></head><body><div id="root">${html}</div><script type="module" src="/client.js"></script></body></html>`,
    });
  });
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message));
  await page.goto(`${ORIGIN}/#${name}`);
  await page.waitForFunction(() => (window as unknown as { __done?: boolean }).__done === true);
  const errors = await page.evaluate(() => (window as unknown as { __errors: string[] }).__errors);
  return [...errors, ...pageErrors];
}

for (const [label, storage] of [
  ['a first visit', {}],
  ['a returning visitor with a saved theme', { 'nish-theme': 'light', 'hydration-key': JSON.stringify('client') }],
] as const) {
  test.describe(label, () => {
    for (const name of NAMES) {
      test(`${name} hydrates without errors`, async ({ page }) => {
        expect(await open(page, name, storage)).toEqual([]);
      });
    }
  });
}

test('keeps the data-theme that theme-init set on <html>', async ({ page }) => {
  const errors = await open(page, 'theme-toggle', { 'nish-theme': 'light' });
  expect(errors).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByTestId('theme')).toContainText('light/light');
});

test('shows the stored value after hydration, not before', async ({ page }) => {
  // The server HTML has the default, not the stored value.
  expect(renderToString(scenarios['local-storage']!.render() as never)).toContain('server');
  const errors = await open(page, 'local-storage', { 'hydration-key': JSON.stringify('client') });
  expect(errors).toEqual([]);
  await expect(page.getByTestId('stored')).toHaveText('client');
});

test('renders a toast raised right after hydration', async ({ page }) => {
  const errors = await open(page, 'toaster', {});
  expect(errors).toEqual([]);
  await expect(page.getByText('Saved after hydration')).toBeVisible();
});

test('mounts a modal that is open on load only on the client', async ({ page }) => {
  const errors = await open(page, 'modal-open', {});
  expect(errors).toEqual([]);
  await expect(page.getByRole('dialog', { name: 'Open on load' })).toBeVisible();
});

test('the harness reports a real hydration mismatch', async ({ page }) => {
  const errors = await open(page, 'mismatch', {});
  expect(errors.length).toBeGreaterThan(0);
});
