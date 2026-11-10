// Browser checks for Calendar, DatePicker, MultiSelect and Carousel on the pickers harness
// (tests/a11y/pickers.tsx, port 5195): axe, the APG keys, RTL and the 360px phone layout.
// Needs `npm run build` first (the CSS comes from dist/).
import { expect, test, type Page } from '@playwright/test';
import { load, scan } from './helpers';

const PICKERS = 'http://localhost:5195/pickers.html';
const THEMES = ['dark', 'light', 'contrast'] as const;

const activeDate = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-date') ?? null);

test.describe('pickers: axe', () => {
  for (const theme of THEMES) {
    test(`page in ${theme}`, async ({ page }) => {
      await load(page, PICKERS, theme, 'main h1');
      expect(await scan(page)).toEqual([]);
    });
  }

  for (const open of ['datepicker', 'daterange', 'multiselect']) {
    for (const theme of ['dark', 'light'] as const) {
      test(`${open} open in ${theme}`, async ({ page }) => {
        await load(page, `${PICKERS}?open=${open}`, theme, open === 'multiselect' ? '[role=listbox]' : '[role=dialog] [data-date]');
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
    await expect(page.getByRole('button', { name: /^Change date,/ })).toBeFocused();
  });

  test('date picker closes on Escape and returns focus', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const button = page.getByRole('button', { name: /^Change date,/ });
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
    await page.locator('section[aria-label="Trips"] [role=group][tabindex="0"]').focus();
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

test.describe('pickers: behaviors', () => {
  test('modal: Escape closes only the listbox, the second closes the modal', async ({ page }) => {
    await load(page, `${PICKERS}?modal=1`, 'dark', '[role=dialog]');
    const dialog = page.getByRole('dialog', { name: 'Pickers in a modal' });
    await dialog.getByRole('combobox', { name: 'Modal states' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('date picker: Alt+ArrowDown opens the calendar and focuses a day', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    await page.getByRole('textbox', { name: 'Form date' }).focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.hasAttribute('data-date'))).toBe(true);
  });

  test('date picker: Enter on typed text commits it and does not submit the form', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    await page.getByRole('textbox', { name: 'Form date' }).focus();
    await page.keyboard.type('11/20/2026');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.body.dataset.submits ?? '0')).toBe('0');
    await expect(page.locator('#date-form input[name="when"]')).toHaveValue('2026-11-20');
  });

  test('calendar: clamps at max, month-end PageDown, disabled day is focusable but not picked', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    const lim = page.locator('#limits-host');
    await lim.locator('[data-date="2026-11-05"]').focus();
    await page.keyboard.press('PageDown');
    expect(await activeDate(page)).toBe('2026-11-24');
    await lim.locator('[data-date="2026-11-10"]').focus();
    await expect(lim.locator('[data-date="2026-11-10"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(lim.locator('[role=gridcell]:has([data-date="2026-11-10"])')).toHaveAttribute('aria-selected', 'false');
    const jan = page.locator('#jan-host');
    await jan.locator('[data-date="2026-01-31"]').focus();
    await page.keyboard.press('PageDown');
    expect(await activeDate(page)).toBe('2026-02-28');
  });

  test('carousel: pauses on hover, stop button, previous keeps focus', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    const auto = page.locator('section[aria-label="Auto trips"]');
    await auto.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(auto).toHaveAttribute('data-state', 'active');
    await auto.hover();
    await expect(auto).toHaveAttribute('data-state', 'inactive');
    await page.mouse.move(0, 0);
    await expect(auto).toHaveAttribute('data-state', 'active');
    await auto.getByRole('button', { name: 'Stop slide rotation' }).click();
    await page.mouse.move(0, 0);
    await expect(auto).toHaveAttribute('data-state', 'inactive');
    await expect(auto.getByRole('button', { name: 'Start slide rotation' })).toBeVisible();
    await expect(auto.locator('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    const prev = auto.getByRole('button', { name: 'Previous slide' });
    await prev.focus();
    await page.keyboard.press('Enter');
    await expect(prev).toBeFocused();
    await expect(auto.locator('[aria-label="1 of 4"]')).toHaveAttribute('data-state', 'active');
  });

  test('carousel: reduced motion starts stopped', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    const auto = page.locator('section[aria-label="Auto trips"]');
    await expect(auto.getByRole('button', { name: 'Start slide rotation' })).toBeVisible();
    await expect(auto).toHaveAttribute('data-state', 'inactive');
  });
});

test.describe('pickers: ranges and time', () => {
  test('range calendar: keyboard preview and commit', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const host = page.locator('#range-host');
    await host.locator('[data-date="2026-11-05"]').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    for (const d of ['06', '07', '08']) await expect(host.locator(`[data-date="2026-11-${d}"]`)).toHaveAttribute('data-preview', '');
    await page.keyboard.press('Enter');
    for (const d of ['05', '06', '07', '08']) {
      await expect(host.locator(`[role=gridcell]:has([data-date="2026-11-${d}"])`)).toHaveAttribute('aria-selected', 'true');
    }
    await expect(host.locator('[role=gridcell]:has([data-date="2026-11-09"])')).toHaveAttribute('aria-selected', 'false');
    await expect(host.locator('[aria-live=polite].sr-only')).toHaveText('Thursday, November 5, 2026 to Sunday, November 8, 2026');
  });

  test('range calendar: pointer preview, commit and swapped ends', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const host = page.locator('#range-host');
    const day = (d: string) => host.locator(`[data-date="2026-11-${d}"]`);
    await day('10').click();
    await day('13').hover();
    for (const d of ['11', '12', '13']) await expect(day(d)).toHaveAttribute('data-preview', '');
    await day('13').click();
    await expect(day('10')).toHaveAttribute('data-state', 'active');
    await expect(day('13')).toHaveAttribute('data-state', 'active');
    await expect(day('11')).toHaveAttribute('data-range', 'middle');
    await day('20').click();
    await day('15').click();
    for (const d of ['15', '16', '17', '18', '19', '20']) {
      await expect(host.locator(`[role=gridcell]:has([data-date="2026-11-${d}"])`)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('range calendar: a range cannot cross a disabled weekend', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    const host = page.locator('#range-weekends-host');
    await host.locator('[data-date="2026-11-06"]').click();
    await host.locator('[data-date="2026-11-09"]').click();
    await expect(host.locator('[data-date="2026-11-09"]')).toHaveAttribute('data-state', 'active');
    await expect(host.locator('[data-date="2026-11-06"]')).toHaveAttribute('data-state', 'inactive');
    for (const d of ['06', '07', '08']) {
      await expect(host.locator(`[role=gridcell]:has([data-date="2026-11-${d}"])`)).not.toHaveAttribute('aria-selected', 'true');
    }
  });

  test('date range picker: open, pick with the keyboard, Escape in two steps', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const button = page.getByRole('button', { name: 'Change dates, Thursday, November 5, 2026 to Monday, November 9, 2026' });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Choose dates' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-date="2026-11-05"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Trip dates' })).toHaveValue('11/05/2026 – 11/12/2026');
    const again = page.getByRole('button', { name: /^Change dates/ });
    await expect(again).toBeFocused();

    await again.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-preview]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(again).toBeFocused();
  });

  test('date range picker: a typed range commits on Enter', async ({ page }) => {
    await load(page, PICKERS, 'dark', 'main h1');
    const box = page.getByRole('textbox', { name: 'Trip dates' });
    await box.fill('');
    await box.focus();
    await page.keyboard.type('11/10/2026 - 11/12/2026');
    await page.keyboard.press('Enter');
    await expect(box).toHaveValue('11/10/2026 – 11/12/2026');
  });

  test('time field: typing moves on, reports 24-hour value, arrows step', async ({ page }) => {
    await load(page, `${PICKERS}?extra=1`, 'dark', 'main h1');
    await page.getByRole('spinbutton', { name: 'Start time Hour' }).focus();
    await page.keyboard.type('7');
    await expect(page.getByRole('spinbutton', { name: 'Start time Minute' })).toBeFocused();
    await page.keyboard.type('45');
    await page.keyboard.press('p');
    await expect(page.getByRole('spinbutton', { name: 'Start time Hour' })).toHaveValue('7');
    await expect(page.getByRole('spinbutton', { name: 'Start time Minute' })).toHaveValue('45');
    await expect(page.getByRole('combobox', { name: /Start time/ })).toHaveValue('pm');

    await page.getByRole('spinbutton', { name: 'Form time Hour' }).focus();
    await page.keyboard.type('7');
    const minute = page.getByRole('spinbutton', { name: 'Form time Minute' });
    await expect(minute).toBeFocused();
    await page.keyboard.type('45');
    await page.keyboard.press('p');
    await expect(page.locator('input[name="at"]')).toHaveValue('19:45');
    await minute.focus();
    await page.keyboard.press('ArrowUp');
    await expect(minute).toHaveValue('46');
    await expect(page.locator('input[name="at"]')).toHaveValue('19:46');
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

  test('360px: carousel dots never overlap the arrows', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await load(page, PICKERS, 'dark', 'main h1');
    const sec = page.locator('section[aria-label="Trips"]');
    const prev = (await sec.getByRole('button', { name: 'Previous slide' }).boundingBox())!;
    const next = (await sec.getByRole('button', { name: 'Next slide' }).boundingBox())!;
    const dots = sec.getByRole('group', { name: 'Choose slide' }).getByRole('button');
    const n = await dots.count();
    for (let i = 0; i < n; i++) {
      const b = (await dots.nth(i).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(prev.x + prev.width);
      expect(b.x + b.width).toBeLessThanOrEqual(next.x);
    }
  });

  test('360px: date range dialog fits, days are 44px; time field boxes are 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await load(page, `${PICKERS}?open=daterange`, 'dark', '[role=dialog] [data-date]');
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= 360)).toBe(true);
    const dialog = page.getByRole('dialog', { name: 'Choose dates' });
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    const days = dialog.locator('[data-date]');
    const n = await days.count();
    expect(n).toBeGreaterThan(27);
    for (let i = 0; i < n; i++) {
      const b = await days.nth(i).boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    for (const name of ['Start time Hour', 'Start time Minute']) {
      const b = (await page.getByRole('spinbutton', { name }).boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.width).toBeGreaterThanOrEqual(44);
    }
    const sel = (await page.getByRole('combobox', { name: /Start time/ }).boundingBox())!;
    expect(sel.height).toBeGreaterThanOrEqual(44);
  });

  test('840px: date range dialog, no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 840, height: 900 });
    await load(page, `${PICKERS}?open=daterange`, 'dark', '[role=dialog] [data-date]');
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= 840)).toBe(true);
  });

  test('840px: no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 840, height: 900 });
    await load(page, `${PICKERS}?open=datepicker`, 'dark', '[role=dialog] [data-date]');
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth <= 840)).toBe(true);
  });
});
