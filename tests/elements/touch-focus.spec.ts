import { expect, test, type Browser, type Page } from '@playwright/test';

// Regression specs for three wave 3 review fixes that only show in a real browser with the right pointer:
//   - under a coarse pointer, chips, tabs and sort buttons are 44px targets and still grow to fit their label (and a
//     span chip, which is not a target, stays small);
//   - both forms of the command palette's input (the bare input and the input in a .nish-command-input row) draw no focus ring
//     when focus arrives by keyboard, while the selected option stays visibly marked;
//   - split panes stack below 640px under a coarse pointer, at every nesting depth, and unfolded (840px) they do not.
// The pages are data.html and forms.html (static markup, the same ones data.spec.ts and forms.spec.ts use).

const BASE = 'http://localhost:5194';

interface Env {
  width: number;
  height: number;
  coarse: boolean;
}
const PHONE: Env = { width: 360, height: 780, coarse: true };
const UNFOLDED: Env = { width: 840, height: 900, coarse: true };
const DESKTOP: Env = { width: 1440, height: 900, coarse: false };
const PHONE_FINE: Env = { width: 360, height: 780, coarse: false };

/** Open a page in a fresh context: a touch phone for a coarse pointer, a plain mouse browser otherwise. */
async function visit(browser: Browser, env: Env, file: string): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({
    viewport: { width: env.width, height: env.height },
    reducedMotion: 'reduce',
    ...(env.coarse ? { hasTouch: true, isMobile: true } : {}),
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${file}`);
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached', timeout: 15_000 });
  return { page, close: () => ctx.close() };
}

test.describe('44px targets under a coarse pointer', () => {
  const TARGETS = 'button.nish-chip, .nish-chip-group button, nish-chip-group button, .nish-tab, .nish-th-sort';

  for (const env of [PHONE, UNFOLDED]) {
    for (const file of ['data.html', 'forms.html']) {
      test(`chips, tabs and sort buttons are 44px targets that fit their label: ${file} at ${env.width}px`, async ({ browser }) => {
        const { page, close } = await visit(browser, env, file);
        try {
          const found = await page.evaluate((sel) => {
            return Array.from(document.querySelectorAll(sel))
              .filter((el) => el.checkVisibility() && el.getBoundingClientRect().width > 0)
              .map((el) => {
                const r = el.getBoundingClientRect();
                return { name: `${el.className} "${el.textContent?.trim()}"`, width: r.width, height: r.height, scrollWidth: el.scrollWidth };
              });
          }, TARGETS);
          expect(found.length, `${file} has targets to measure`).toBeGreaterThan(0);
          for (const t of found) {
            expect(t.width, `${t.name} width`).toBeGreaterThanOrEqual(43.5);
            expect(t.height, `${t.name} height`).toBeGreaterThanOrEqual(43.5);
            expect(t.width, `${t.name} shows its whole label`).toBeGreaterThanOrEqual(t.scrollWidth - 0.5);
          }
        } finally {
          await close();
        }
      });
    }

    test(`a span chip is not a target and keeps min-width 0 at ${env.width}px`, async ({ browser }) => {
      const { page, close } = await visit(browser, env, 'forms.html');
      try {
        const widths = await page.evaluate(() => Array.from(document.querySelectorAll('span.nish-chip')).map((el) => getComputedStyle(el).minWidth));
        expect(widths.length).toBeGreaterThan(0);
        for (const w of widths) expect(w).toBe('0px');
      } finally {
        await close();
      }
    });
  }

  test('a chip has no 44px minimum with a fine pointer at 1440px', async ({ browser }) => {
    const { page, close } = await visit(browser, DESKTOP, 'forms.html');
    try {
      const chips = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.nish-chip')).map((el) => ({
          tag: el.localName,
          minWidth: getComputedStyle(el).minWidth,
          minHeight: getComputedStyle(el).minHeight,
          height: el.getBoundingClientRect().height,
        })),
      );
      expect(chips.length).toBeGreaterThan(0);
      for (const c of chips) {
        expect(parseFloat(c.minWidth) || 0).toBeLessThan(44);
        expect(parseFloat(c.minHeight) || 0).toBeLessThan(44);
        expect(c.minHeight).not.toBe('44px');
        expect(c.height).toBeLessThan(44);
      }
      expect(chips.some((c) => c.tag === 'button'), 'a button chip is measured').toBe(true);
    } finally {
      await close();
    }
  });
});

test.describe('the command input shows no focus ring', () => {
  // outline-width is not asserted: `outline: none` leaves the computed width at 3px in Chromium; style none draws nothing.
  const ringless = (page: Page, selector: string) =>
    page.locator(selector).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, focusVisible: el.matches(':focus-visible') };
    });

  test('the palette input, reached by keyboard, has no outline and the selected option stays marked', async ({ browser }) => {
    const { page, close } = await visit(browser, DESKTOP, 'data.html');
    try {
      await page.locator('#before').focus();
      await page.keyboard.press('ControlOrMeta+k');
      const input = page.locator('#cp input[role="combobox"]');
      await expect(input).toBeFocused();
      // Tab away (to the next control in the dialog), then Shift+Tab back: the input is focused by keyboard.
      await page.keyboard.press('Tab');
      await expect(input).not.toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(input).toBeFocused();
      expect(await ringless(page, '#cp input[role="combobox"]')).toEqual({ style: 'none', focusVisible: true });
      // The current item is still visible: its background differs from the list's.
      const backgrounds = await page.evaluate(() => ({
        option: getComputedStyle(document.querySelector('#cp [role="option"][aria-selected="true"]')!).backgroundColor,
        list: getComputedStyle(document.querySelector('#cp .nish-command-list')!).backgroundColor,
      }));
      expect(backgrounds.option).not.toBe(backgrounds.list);
    } finally {
      await close();
    }
  });

  test('both hand-written input forms draw no ring when focus arrives by keyboard', async ({ browser }) => {
    const { page, close } = await visit(browser, DESKTOP, 'data.html');
    try {
      await page.evaluate(() => {
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<button type="button" id="tf-b1">first</button>' +
          '<div class="nish-command" id="tf-bare"><input class="nish-command-input" id="tf-a" aria-label="a"></div>' +
          '<button type="button" id="tf-b2">second</button>' +
          '<div class="nish-command" id="tf-row"><div class="nish-command-input"><input id="tf-b" aria-label="b"></div></div>';
        document.getElementById('root')!.prepend(wrap);
      });
      for (const [before, input] of [
        ['#tf-b1', '#tf-a'],
        ['#tf-b2', '#tf-b'],
      ] as const) {
        await page.locator(before).focus();
        await page.keyboard.press('Tab');
        await expect(page.locator(input)).toBeFocused();
        expect(await ringless(page, input), input).toEqual({ style: 'none', focusVisible: true });
      }
    } finally {
      await close();
    }
  });
});

test.describe('split panes stack under a coarse pointer below 640px', () => {
  const SPLITS = ['#sp-row', '#sp-col', '#sp-nest', '#sp-inner'];

  test('every split, nested ones too, is a column with hidden dividers and tall panes at 360px', async ({ browser }) => {
    const { page, close } = await visit(browser, PHONE, 'data.html');
    try {
      for (const id of SPLITS) {
        expect(await page.locator(id).evaluate((el) => getComputedStyle(el).flexDirection), `${id} flex-direction`).toBe('column');
        for (const divider of await page.locator(`${id} .nish-split-divider`).all()) await expect(divider, `${id} divider`).toBeHidden();
        const heights = await page.locator(`${id} > .nish-split-pane`).evaluateAll((panes) => panes.map((p) => p.getBoundingClientRect().height));
        expect(heights.length, `${id} panes`).toBeGreaterThanOrEqual(2);
        for (const h of heights) expect(h, `${id} pane height`).toBeGreaterThanOrEqual(255);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    } finally {
      await close();
    }
  });

  test('unfolded at 840px the row split stays a row with dividers and a 44px hit area', async ({ browser }) => {
    const { page, close } = await visit(browser, UNFOLDED, 'data.html');
    try {
      expect(await page.locator('#sp-row').evaluate((el) => getComputedStyle(el).flexDirection)).toBe('row');
      const divider = page.locator('#sp-row > .nish-split-divider');
      await expect(divider).toBeVisible();
      const hit = await divider.evaluate((el) => {
        const cs = getComputedStyle(el, '::before');
        return { left: cs.left, right: cs.right };
      });
      expect(hit).toEqual({ left: '-20px', right: '-20px' });
    } finally {
      await close();
    }
  });

  test('with a fine pointer at 360px the row split stays a row', async ({ browser }) => {
    const { page, close } = await visit(browser, PHONE_FINE, 'data.html');
    try {
      expect(await page.locator('#sp-row').evaluate((el) => getComputedStyle(el).flexDirection)).toBe('row');
      await expect(page.locator('#sp-row > .nish-split-divider')).toBeVisible();
    } finally {
      await close();
    }
  });
});
