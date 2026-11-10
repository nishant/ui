// A strict Content-Security-Policy plus Trusted Types: the page allows only its own files and the
// theme-init inline script by its hash (dist/theme-init.sha256). The static theme APIs
// (dist/theme.js), the custom elements (dist/elements-all.js) and the CSS must load and work with
// zero violations: no inline style attribute from markup, no eval, no innerHTML sink.
// The files are served from dist/ by page.route, so this needs `npm run build` first.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '../../dist');
const built = existsSync(resolve(dist, 'theme-init.sha256')) && existsSync(resolve(dist, 'elements-all.js'));
const ORIGIN = 'http://csp.test';

const TYPES: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };

function policy(hash: string): string {
  return [
    "default-src 'none'",
    `script-src 'self' '${hash}'`,
    "style-src 'self'",
    // The elements (Lit templates) and server-rendered React markup carry style="" attributes.
    // Attributes only: no <style> element and no style-src-elem exception. A policy that also
    // sets style-src-attr 'none' is not supported by the elements bundle (documented in T22).
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    // Lit (the custom elements) creates one policy named lit-html; nothing else may.
    "require-trusted-types-for 'script'",
    'trusted-types lit-html',
  ].join('; ');
}

const PAGE = (themeInit: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>csp</title>
<script>${themeInit}</script>
<link rel="stylesheet" href="/nish.css">
<link rel="stylesheet" href="/nish-components.css">
</head>
<body>
<main>
  <h1>Strict CSP</h1>
  <button id="toggle" class="nish-btn" type="button">Theme</button>
  <button id="toast" class="nish-btn" type="button">Toast</button>
  <button id="confirm" class="nish-btn" type="button">Confirm</button>
  <button id="sheet-open" class="nish-btn" type="button">Sheet</button>
  <span class="nish-tooltip"><button class="nish-btn" type="button">Tip target</button><span class="nish-tooltip-content">Saves</span></span>
  <dialog id="sheet" class="nish-sheet" aria-label="Sheet"><p>Sheet body</p><button type="button" data-sheet-close>Close</button></dialog>
  <nish-theme-toggle id="el-toggle"></nish-theme-toggle>
  <nish-switch id="el-switch" label="Alerts"></nish-switch>
  <nish-tabs id="el-tabs" label="Sections"><button role="tab" aria-selected="true">One</button><button role="tab">Two</button></nish-tabs>
  <nish-field label="Fruit"><nish-combobox><option value="a">Apple</option><option value="b">Banana</option></nish-combobox></nish-field>
</main>
<script type="module" src="/app.js"></script>
</body>
</html>`;

const APP = `
import { mountThemeToggle, showToast, confirmDialog, mountTooltips, openSheet, setThemeChoice } from '/theme.js';
import '/elements-all.js';
mountThemeToggle(document.getElementById('toggle'));
mountTooltips();
document.getElementById('toast').addEventListener('click', () => showToast('Saved', { tone: 'ok' }));
document.getElementById('confirm').addEventListener('click', () => { window.__confirm = confirmDialog({ title: 'Sure?', confirmLabel: 'Yes' }); });
document.getElementById('sheet-open').addEventListener('click', () => openSheet(document.getElementById('sheet')));
window.__setTheme = setThemeChoice;
window.__ready = true;
`;

type W = { __csp: string[]; __ready?: boolean; __confirm: Promise<boolean>; __setTheme: (t: string) => void };

async function boot(page: Page) {
  const violations: string[] = [];
  const themeInit = readFileSync(resolve(dist, 'theme-init.js'), 'utf8');
  const hash = readFileSync(resolve(dist, 'theme-init.sha256'), 'utf8').trim();
  await page.addInitScript(() => {
    (window as unknown as W).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as W).__csp.push(`${e.violatedDirective} blocked ${e.blockedURI} ${e.sample ?? ''}`.slice(0, 300));
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Trusted Type|Refused to/i.test(m.text())) violations.push('console: ' + m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => violations.push('pageerror: ' + e.message.slice(0, 300)));
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'content-security-policy': policy(hash) };
    if (path === '/') return route.fulfill({ status: 200, contentType: 'text/html', headers, body: PAGE(themeInit) });
    if (path === '/app.js') return route.fulfill({ status: 200, contentType: 'text/javascript', headers, body: APP });
    const file = resolve(dist, '.' + path);
    if (!file.startsWith(dist) || !existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    const ext = file.slice(file.lastIndexOf('.'));
    return route.fulfill({ status: 200, contentType: TYPES[ext] ?? 'application/octet-stream', headers, body: readFileSync(file) });
  });
  await page.goto(ORIGIN + '/');
  await page.waitForFunction(() => (window as unknown as W).__ready === true);
  return {
    violations: async () => [...(await page.evaluate(() => (window as unknown as W).__csp)), ...violations],
  };
}

test.describe('strict CSP and Trusted Types', () => {
  // Locally a missing dist skips; in CI it is a failure (the build output may have moved).
  test.skip(!built && !process.env.CI, 'dist/ is not built');
  test.beforeAll(() => {
    if (!built) throw new Error('dist/theme-init.sha256 or dist/elements-all.js missing: did the build output move?');
  });

  test('theme-init runs from its hash and sets data-theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('nish-theme', 'light'));
    const csp = await boot(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await csp.violations()).toEqual([]);
  });

  test('a different inline script is blocked (the policy is really strict)', async ({ page }) => {
    const csp = await boot(page);
    await page.evaluate(() => {
      const s = document.createElement('script');
      try {
        s.textContent = 'window.__injected = 1';
        document.head.append(s);
      } catch {
        /* Trusted Types throws for the textContent sink */
      }
    });
    expect(await page.evaluate(() => (window as unknown as { __injected?: number }).__injected)).toBeUndefined();
    expect((await csp.violations()).length).toBeGreaterThan(0);
  });

  test('the static theme APIs work with zero violations', async ({ page }) => {
    const csp = await boot(page);
    await page.locator('#toggle').click();
    await page.locator('#toast').click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.locator('#confirm').click();
    await expect(page.getByRole('dialog', { name: 'Sure?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();
    expect(await page.evaluate(() => (window as unknown as W).__confirm)).toBe(true);
    await page.locator('#sheet-open').click();
    await expect(page.locator('#sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Tip target' }).focus();
    await page.evaluate(() => (window as unknown as W).__setTheme('dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await csp.violations()).toEqual([]);
  });

  test('the custom elements upgrade and respond with zero violations', async ({ page }) => {
    const csp = await boot(page);
    await page.waitForFunction(() => customElements.get('nish-switch') && customElements.get('nish-tabs') && customElements.get('nish-combobox'));
    const toggle = page.locator('nish-theme-toggle button');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const sw = page.locator('nish-switch [role=switch], nish-switch button').first();
    await expect(sw).toBeVisible();
    await sw.click();
    await page.getByRole('tab', { name: 'Two' }).click();
    await page.getByRole('combobox').first().click();
    await expect(page.getByRole('option', { name: 'Apple' })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await csp.violations()).toEqual([]);
  });
});
