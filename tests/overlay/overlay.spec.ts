import { expect, test, type Locator, type Page } from '@playwright/test';

const URL = '/harness.html';

async function open(page: Page): Promise<void> {
  await page.goto(URL);
  await expect(page.getByRole('button', { name: 'Open modal' })).toBeVisible();
}

const modal = (page: Page): Locator => page.getByRole('dialog', { name: 'Harness modal' });
const nested = (page: Page): Locator => page.getByRole('alertdialog', { name: 'Nested question?' }).or(page.getByRole('dialog', { name: 'Nested question?' }));

async function openModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(modal(page)).toBeVisible();
}

async function openNested(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open nested confirm' }).click();
  await expect(nested(page)).toBeVisible();
}

test('Escape closes only the top layer', async ({ page }) => {
  await open(page);
  await openModal(page);
  await openNested(page);
  await page.keyboard.press('Escape');
  await expect(nested(page)).toHaveCount(0);
  await expect(modal(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal(page)).toHaveCount(0);
});

test('closing the modal and its nested confirm in one update restores focus and clears inert', async ({ page }) => {
  await open(page);
  await openModal(page);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reads an untyped history.state inside the page
  await expect.poll(() => page.evaluate(() => !!(history.state as any)?.nishLayer)).toBe(true);
  await openNested(page);
  await nested(page).getByRole('button', { name: 'Discard' }).click();
  await expect(nested(page)).toHaveCount(0);
  await expect(modal(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open modal' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.querySelectorAll('body [inert]').length)).toBe(0);
});

test('Escape in an open DropdownMenu closes the menu only', async ({ page }) => {
  await open(page);
  await openModal(page);
  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(modal(page)).toBeVisible();
});

test('focus is trapped inside the dialog', async ({ page }) => {
  await open(page);
  await openModal(page);
  const dialog = modal(page);
  const focusables = dialog.locator('button:visible, input:visible, [tabindex]:not([tabindex="-1"]):visible, a[href]:visible');
  const insideDialog = () => dialog.evaluate((el) => el.contains(document.activeElement));

  // Last focusable: Tab wraps to the first.
  await focusables.last().focus();
  await page.keyboard.press('Tab');
  expect(await insideDialog()).toBe(true);
  expect(await focusables.first().evaluate((el) => el === document.activeElement)).toBe(true);

  // First focusable: Shift+Tab wraps to the last.
  await focusables.first().focus();
  await page.keyboard.press('Shift+Tab');
  expect(await insideDialog()).toBe(true);
  expect(await focusables.last().evaluate((el) => el === document.activeElement)).toBe(true);

  // Many Tabs in both directions never leave the dialog.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await insideDialog()).toBe(true);
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await insideDialog()).toBe(true);
  }
});

test('closing the modal returns focus to its opener', async ({ page }) => {
  await open(page);
  const opener = page.getByRole('button', { name: 'Open modal' });

  await openModal(page);
  await page.keyboard.press('Escape');
  await expect(modal(page)).toHaveCount(0);
  await expect(opener).toBeFocused();

  await openModal(page);
  await modal(page).getByRole('button', { name: 'Close' }).click();
  await expect(modal(page)).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('Back closes the top layer and leaves history as it was', async ({ page }) => {
  // A real entry before the harness: Firefox replaces the initial about:blank instead of keeping it.
  await page.goto(URL + '?before');
  await open(page);
  const url = page.url();
  const lengthBefore = await page.evaluate(() => history.length);

  await openModal(page);
  await expect.poll(() => page.evaluate(() => history.length)).toBeGreaterThan(lengthBefore);
  await page.goBack();
  await expect(modal(page)).toHaveCount(0);
  expect(page.url()).toBe(url);

  // The page's own entry is intact: the next Back leaves the harness for the entry before it.
  await page.goBack();
  expect(page.url()).not.toBe(url);

  // With a nested confirm, Back closes only the confirm.
  await open(page);
  await openModal(page);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reads an untyped history.state inside the page
  await expect.poll(() => page.evaluate(() => !!(history.state as any)?.nishLayer)).toBe(true);
  const lengthModal = await page.evaluate(() => history.length);
  await openNested(page);
  await expect.poll(() => page.evaluate(() => history.length)).toBeGreaterThan(lengthModal);
  await page.goBack();
  await expect(nested(page)).toHaveCount(0);
  await expect(modal(page)).toBeVisible();
  expect(page.url()).toBe(url);
});

test('content behind an open dialog is inert, the toast region is not', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Toast' }).click();
  await openModal(page);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Open modal');
        return !!btn?.closest('[inert]');
      }),
    )
    .toBe(true);

  const toastRegionInert = await page.evaluate(() => {
    const region = document.querySelector('[role=status][aria-live=polite]');
    return !!region?.closest('[inert]');
  });
  expect(toastRegionInert).toBe(false);

  await page.keyboard.press('Escape');
  await expect(modal(page)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.querySelectorAll('body [inert]').length)).toBe(0);
  await expect.poll(() => page.evaluate(() => [...document.body.children].some((el) => el.hasAttribute('inert')))).toBe(false);
});

test('Drawer: Escape closes it and focus returns', async ({ page }) => {
  await open(page);
  const opener = page.getByRole('button', { name: 'Open drawer' });
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Harness drawer' });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('a toast is announced in the polite live region', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Toast' }).click();
  await expect(page.locator('[role=status][aria-live=polite]').filter({ hasText: 'Saved to the harness' })).toHaveCount(1);
});

test('Tooltip: hover, focus and Escape, with no extra Tab stop and a tip the pointer can reach', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: 'Hover target' });
  const tip = page.getByRole('tooltip');

  // The button is the only tab stop: the wrapper has no tabindex, and the button describes itself with the tip.
  expect(await button.evaluate((el) => el.parentElement?.hasAttribute('tabindex'))).toBe(false);

  await button.hover();
  await expect(tip).toHaveText('Saves your work');
  await expect(button).toHaveAttribute('aria-describedby', (await tip.getAttribute('id')) ?? '');

  // Escape dismisses a hover-opened tip.
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);

  // The pointer can travel onto the tip without it closing.
  await page.mouse.move(0, 0);
  await button.hover();
  await expect(tip).toBeVisible();
  const box = (await tip.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  await page.waitForTimeout(300);
  await expect(tip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tip).toHaveCount(0);

  // Keyboard focus shows it, blur hides it.
  await page.mouse.move(0, 0);
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
});

test('DropdownMenu: arrows, Home, End, typeahead that skips disabled rows, and Escape returns focus', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Fruit' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Fruit menu' });
  await expect(menu).toBeVisible();
  const focused = () => page.evaluate(() => document.activeElement?.textContent);
  await expect.poll(focused).toBe('Apple');
  await page.keyboard.press('ArrowDown');
  await expect.poll(focused).toBe('Banana');
  // The disabled row is skipped.
  await page.keyboard.press('ArrowDown');
  await expect.poll(focused).toBe('Blueberry');
  await page.keyboard.press('End');
  await expect.poll(focused).toBe('Cherry');
  await page.keyboard.press('ArrowDown');
  await expect.poll(focused).toBe('Apple');
  await page.keyboard.press('ArrowUp');
  await expect.poll(focused).toBe('Cherry');
  await page.keyboard.press('Home');
  await expect.poll(focused).toBe('Apple');
  // Typeahead: b, b cycles Banana then Blueberry; the disabled Blocked row is never the target.
  await page.keyboard.press('b');
  await expect.poll(focused).toBe('Banana');
  await page.keyboard.press('b');
  await expect.poll(focused).toBe('Blueberry');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('Popover flips above its anchor when there is no room below', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Flip anchor' }).click();
  const panel = page.getByRole('dialog', { name: 'Flip panel' });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-side', 'top');
  const anchorBox = (await page.getByRole('button', { name: 'Flip anchor' }).boundingBox())!;
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(anchorBox.y);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});

test('the lazily loaded More sheet closes on Back and leaves the URL as it was', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(URL + '?before');
  await page.goto(URL + '?shell');
  const url = page.url();
  // The first tap on More loads the sheet chunk; the sheet still opens from that one tap.
  await page.getByRole('button', { name: /more/i }).first().click();
  const sheet = page.getByRole('dialog', { name: 'More' });
  await expect(sheet).toBeVisible();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reads an untyped history.state inside the page
  await expect.poll(() => page.evaluate(() => !!(history.state as any)?.nishLayer)).toBe(true);
  await page.goBack();
  await expect(sheet).toHaveCount(0);
  expect(page.url()).toBe(url);
});
