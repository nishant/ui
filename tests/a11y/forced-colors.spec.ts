// Forced-colors (Windows High Contrast) checks: a state shown only by a fill, a shadow or a colored
// dot must still be visible once the browser replaces author colors with the system palette.
// The assertions compare computed styles with what the system color keyword resolves to, so they
// hold for any palette Chromium emulates.
import { expect, test, type Locator, type Page } from '@playwright/test';

const A11Y = 'http://localhost:5195/index.html';

test.use({ colorScheme: 'dark' });

async function open(page: Page) {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(A11Y);
  await page.waitForSelector('main h1');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
}

/** What a CSS system color keyword computes to on this page. */
async function system(page: Page, keyword: string, property: 'color' | 'backgroundColor' = 'color') {
  return page.evaluate(
    ([k, prop]) => {
      const probe = document.createElement('div');
      probe.style.color = k as string;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return prop === 'color' ? value : value;
    },
    [keyword, property],
  );
}

const style = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);

test.describe('forced colors', () => {
  test.beforeEach(async ({ page }) => open(page));

  test('Switch: the on track is Highlight, the off track has a border, the thumb contrasts', async ({ page }) => {
    const on = page.getByRole('switch', { name: 'Notifications on' });
    const track = on.locator('> span').first();
    expect(await style(track, 'background-color')).toBe(await system(page, 'Highlight'));
    expect(await style(track, 'border-top-width')).not.toBe('0px');
    expect(await style(track.locator('> span'), 'background-color')).toBe(await system(page, 'HighlightText'));
    await on.click();
    const canvas = await system(page, 'Canvas');
    const buttonText = await system(page, 'ButtonText');
    // The fill transitions for 150ms.
    await expect.poll(() => style(track, 'background-color')).toBe(canvas);
    await expect.poll(() => style(track.locator('> span'), 'background-color')).toBe(buttonText);
  });

  test('Checkbox: checked fills with Highlight', async ({ page }) => {
    const box = page.getByRole('checkbox', { name: 'Send me the newsletter' });
    expect(await box.isChecked()).toBe(true);
    expect(await style(box, 'background-color')).toBe(await system(page, 'Highlight'));
    expect(await style(box, 'border-top-width')).not.toBe('0px');
  });

  test('Progress: bordered track and a Highlight fill', async ({ page }) => {
    const bar = page.getByRole('progressbar', { name: 'Upload' });
    expect(await style(bar, 'border-top-width')).not.toBe('0px');
    expect(await style(bar.locator('[data-part=fill]'), 'background-color')).toBe(await system(page, 'Highlight'));
  });

  test('Avatar: the initials disc and the status dot get a border', async ({ page }) => {
    const disc = page.getByRole('img', { name: /Grace Hopper/i }).first();
    expect(await style(disc, 'border-top-width')).not.toBe('0px');
    const dot = page.locator('[role=img][aria-label=Online], [aria-label=Online]').first();
    expect(await style(dot, 'border-top-width')).not.toBe('0px');
  });

  test('Slider: the thumb keeps a Highlight border', async ({ page }) => {
    const thumb = page.getByRole('slider', { name: 'Volume' });
    expect(await style(thumb, 'border-top-color')).toBe(await system(page, 'Highlight'));
  });

  test('RadioGroup: the checked radio draws its dot in Highlight', async ({ page }) => {
    const radio = page.getByRole('radio', { name: 'Medium' });
    expect(await radio.isChecked()).toBe(true);
    const ring = radio.locator('xpath=following-sibling::*[1]');
    expect(await style(ring, 'border-top-color')).toBe(await system(page, 'Highlight'));
  });

  test('Tabs: the active tab is underlined and Highlight colored', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'Overview' });
    expect(await style(tab, 'text-decoration-line')).toContain('underline');
    expect(await style(tab, 'color')).toBe(await system(page, 'Highlight'));
  });

  test('Button: a borderless variant still has a ButtonText border', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Primary' });
    expect(await style(primary, 'border-top-width')).not.toBe('0px');
    expect(await style(primary, 'border-top-color')).toBe(await system(page, 'ButtonText'));
  });

  test('a disabled button is GrayText', async ({ page }) => {
    const disabled = page.getByRole('button', { name: 'Disabled' });
    expect(await style(disabled, 'color')).toBe(await system(page, 'GrayText'));
  });

  // FIELD, Slider and TagInput pair `focus:outline-none` with `forced-colors:focus:outline-solid`: a bare
  // `outline` is dropped by tailwind-merge before `outline-2`, so the style must be named.
  test('every control shows a focus ring when tabbed to', async ({ page }) => {
    const missing: string[] = [];
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const n = document.activeElement as HTMLElement | null;
        if (!n || n === document.body) return null;
        const drawn = (e: Element) => {
          const st = getComputedStyle(e);
          return st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0;
        };
        // The ring may be on the control, a visual sibling (peer) or a wrapper (focus-within).
        const near = [n, n.nextElementSibling, n.parentElement, n.parentElement?.parentElement].filter(Boolean) as Element[];
        const ok = near.some((e) => drawn(e) && (e === n || e.matches(':has(:focus-visible)')));
        return ok ? 'ok' : (n.getAttribute('role') ?? n.tagName) + ':' + (n.getAttribute('aria-label') ?? n.id);
      });
      if (r && r !== 'ok') missing.push(r);
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  test('Combobox: the active option is Highlight on HighlightText', async ({ page }) => {
    const combo = page.getByRole('combobox', { name: 'Fruit' });
    await combo.click();
    await page.keyboard.press('ArrowDown');
    const option = page.locator('[role=option][data-state=active]').first();
    await expect(option).toBeVisible();
    expect(await style(option, 'background-color')).toBe(await system(page, 'Highlight'));
    expect(await style(option, 'color')).toBe(await system(page, 'HighlightText'));
  });
});
