// Browser checks for Calendar, DatePicker, MultiSelect and Carousel on the pickers harness
// (tests/a11y/pickers.tsx, port 5195): axe, the APG keys, RTL and the 360px phone layout.
// Needs `npm run build` first (the CSS comes from dist/).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PICKERS = 'http://localhost:5195/pickers.html';
const THEMES = ['dark', 'light', 'contrast'] as const;

async function scan(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ') + ' :: ' + n.html.slice(0, 120)) }));
}

async function load(page: Page, url: string, theme: string, ready: string) {
  await page.goto(url);
  await page.waitForSelector(ready);
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t === 'light' ? 'light' : 'dark';
  }, theme);
  // Let animations settle so axe reads final colors.
  await page.waitForTimeout(450);
}

const activeDate = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-date') ?? null);

test.describe('pickers: axe', () => {
  for (const theme of THEMES) {
    test(`page in ${theme}`, async ({ page }) => {
      await load(page, PICKERS, theme, 'main h1');
      expect(await scan(page)).toEqual([]);
    });
  }

  for (const open of ['datepicker', 'multiselect']) {
    for (const theme of ['dark', 'light'] as const) {
      test(`${open} open in ${theme}`, async ({ page }) => {
        await load(page, `${PICKERS}?open=${open}`, theme, open === 'datepicker' ? '[role=dialog] [data-date]' : '[role=listbox]');
        if (open === 'multiselect') await expect(page.getByRole('listbox')).toBeVisible();
        expect(await scan(page)).toEqual([]);
      });
    }
  }
});

test.describe('pickers: keyboard', () => {
  test('calendar arrow keys, PageDown and Enter', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const cal = page.locator('#calendar-host');
    await cal.locator('[data-date="2026-11-05"]').focus();
    await page.keyboard.press('ArrowRight');
    expect(await activeDate(page)).toBe('2026-11-06');
    await page.keyboard.press('PageDown');
    await expect(cal.getByText('December 2026', { exact: true })).toBeVisible();
    expect(await activeDate(page)).toBe('2026-12-06');
    await page.keyboard.press('Enter');
    await expect(cal.locator('[data-date="2026-12-06"]')).toHaveAttribute('data-state', 'active');
    await expect(cal.locator('[role=gridcell]:has([data-date="2026-12-06"])')).toHaveAttribute('aria-selected', 'true');
  });

  test('date picker opens, picks with the keyboard and returns focus', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const button = page.getByRole('button', { name: 'Change date, Thursday, November 5, 2026' });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Choose date' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-date="2026-11-05"]')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Due date' })).toHaveValue('11/12/2026');
    await expect(page.getByRole('button', { name: /^Change date/ })).toBeFocused();
  });

  test('date picker closes on Escape and returns focus', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const button = page.getByRole('button', { name: /^Change date/ });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Choose date' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('multi select adds a chip, stays open and removes chips with Backspace', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const input = page.getByRole('combobox', { name: 'States' });
    const chips = page.locator('main button[aria-label^="Remove "]');
    await expect(chips).toHaveCount(1);
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', /-opt-1$/);
    await page.keyboard.press('Enter');
    await expect(chips).toHaveCount(2);
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(1);
    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(0);
  });

  test('carousel next button and End key', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    await page.getByRole('button', { name: 'Next slide' }).scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await page.getByRole('button', { name: 'Next slide' }).click();
    await page.waitForSelector('[aria-label="2 of 4"][data-state="active"]');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await page.locator('section[aria-label="Trips"] [aria-live][tabindex="0"]').focus();
    await page.keyboard.press('End');
    await page.waitForSelector('[aria-label="4 of 4"][data-state="active"]');
  });

  test('RTL: ArrowLeft moves the calendar to the next day', async ({ page }) => {
    await load(page, `${PICKERS}?dir=rtl`, 'dark', 'main h1');
    await page.locator('#calendar-host [data-date="2026-11-05"]').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await activeDate(page)).toBe('2026-11-06');
  });
});

test.describe('pickers: phone', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('360px: no horizontal scroll, dialog on screen, 44px days', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await load(page, `${PICKERS}?open=datepicker`, 'dark', '[role=dialog] [data-date]');
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= 360)).toBe(true);
    const box = await page.getByRole('dialog', { name: 'Choose date' }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    const days = page.getByRole('dialog', { name: 'Choose date' }).locator('[data-date]');
    const n = await days.count();
    expect(n).toBeGreaterThan(27);
    for (let i = 0; i < n; i++) {
      const b = await days.nth(i).boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('840px: no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 840, height: 900 });
    await load(page, `${PICKERS}?open=datepicker`, 'dark', '[role=dialog] [data-date]');
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= 840)).toBe(true);
  });
});
