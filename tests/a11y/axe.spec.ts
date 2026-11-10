// axe-core over the pages the repo already serves: the a11y harness (a broad set of components,
// every overlay opened in turn, light/dark/contrast, LTR and RTL), the overlay harness and the
// custom-elements pages. Zero serious or critical violations. Needs `npm run build` first
// (the CSS comes from dist/).
import { expect, test } from '@playwright/test';
import { load, scan } from './helpers';

const A11Y = 'http://localhost:5195/index.html';
const OVERLAY = 'http://localhost:5193/harness.html';
const ELEMENTS = 'http://localhost:5194';
const THEMES = ['dark', 'light', 'contrast'] as const;

test.describe('a11y harness', () => {
  for (const theme of THEMES) {
    test(`page in ${theme}`, async ({ page }) => {
      await load(page, A11Y, theme, 'main h1');
      expect(await scan(page)).toEqual([]);
    });
  }

  for (const open of ['modal', 'drawer', 'confirm', 'popover', 'command']) {
    for (const theme of ['dark', 'light'] as const) {
      test(`${open} open in ${theme}`, async ({ page }) => {
        await load(page, `${A11Y}?open=${open}`, theme, '[role=dialog], [data-nish-layer], [role=listbox]');
        expect(await scan(page)).toEqual([]);
      });
    }
  }

  test('menu, tooltip and toast in light', async ({ page }) => {
    await load(page, A11Y, 'light', 'main h1');
    await page.getByRole('button', { name: 'Fruit menu' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Hover target' }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    expect(await scan(page)).toEqual([]);
    await page.getByRole('button', { name: 'Toast' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('right-to-left', async ({ page }) => {
    await load(page, `${A11Y}?dir=rtl`, 'dark', 'main h1');
    expect(await scan(page)).toEqual([]);
  });

  test('phone width (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await load(page, A11Y, 'dark', 'main h1');
    expect(await scan(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test.describe('overlay harness', () => {
  for (const theme of THEMES) {
    test(`closed in ${theme}`, async ({ page }) => {
      await load(page, OVERLAY, theme, 'main');
      expect(await scan(page)).toEqual([]);
    });
  }
  for (const [button, role] of [
    ['Open modal', 'dialog'],
    ['Open drawer', 'dialog'],
    ['Open confirm', 'alertdialog'],
  ] as const) {
    test(`${button} opened`, async ({ page }) => {
      await load(page, OVERLAY, 'dark', 'main');
      await page.getByRole('button', { name: button }).click();
      await expect(page.getByRole(role).first()).toBeVisible();
      await page.waitForTimeout(300);
      expect(await scan(page)).toEqual([]);
    });
  }
});

test.describe('custom elements pages', () => {
  for (const [name, path, ready] of [
    ['elements', '/index.html', 'body'],
    ['forms', '/forms.html', 'body'],
    ['data', '/data.html', 'body'],
    ['react twins', '/react.html', 'body'],
  ] as const) {
    for (const theme of ['dark', 'light'] as const) {
      test(`${name} in ${theme}`, async ({ page }) => {
        await load(page, ELEMENTS + path, theme, ready);
        await page.waitForFunction(() => !document.querySelector(':not(:defined)'));
        expect(await scan(page)).toEqual([]);
      });
    }
  }
});

test.describe('the scan itself', () => {
  test('renders the harness and reports a planted violation', async ({ page }) => {
    await load(page, A11Y, 'light', 'main h1');
    expect(await page.getByRole('button').count()).toBeGreaterThan(15);
    await page.evaluate(() => {
      const img = document.createElement('img');
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      document.querySelector('main')!.append(img);
    });
    const found = await scan(page);
    expect(found.map((v) => v.id)).toContain('image-alt');
  });
});
