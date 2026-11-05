import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const URL = '/tree-virtual.html';

async function open(page: Page): Promise<void> {
  await page.goto(URL);
  await expect(page.getByRole('button', { name: 'Jump to 5000' })).toBeVisible();
}

// The scroll box is the parent of the role=list element.
const box = (list: Locator): Locator => list.locator('xpath=..');
const scrollToBottom = (el: Locator) =>
  el.evaluate((n) => {
    n.scrollTop = n.scrollHeight;
  });
const frames = (page: Page) =>
  page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

test('fixed list renders a window of rows and reaches both ends', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Fixed rows' });
  expect(await list.getByRole('listitem').count()).toBeLessThan(60);
  await scrollToBottom(box(list));
  await expect(list.getByText('Row 10000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jump to 5000' }).click();
  await expect(list.getByText('Row 5000', { exact: true })).toBeInViewport();
});

test('a focused row stays mounted when scrolled far away', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Fixed rows' });
  const row3 = list.getByRole('button', { name: 'Row 3', exact: true });
  await row3.focus();
  await expect(row3).toBeFocused();
  await scrollToBottom(box(list));
  await expect(list.getByText('Row 10000', { exact: true })).toBeVisible();
  await expect(row3).toBeAttached();
  await expect(row3).toBeFocused();
});

test('measured list rows do not overlap and sit 8px apart', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Measured rows' });
  await box(list).evaluate((n) => {
    n.scrollTop = (n.scrollHeight - n.clientHeight) / 2;
  });
  await frames(page);
  await frames(page);
  await expect
    .poll(async () => {
      const boxes = await list.getByRole('listitem').evaluateAll((els) =>
        els
          .map((e) => e.getBoundingClientRect())
          .map((r) => ({ top: r.top, bottom: r.bottom }))
          .sort((a, b) => a.top - b.top),
      );
      if (boxes.length < 3) return 'few rows';
      for (let i = 1; i < boxes.length; i++) {
        const gap = boxes[i]!.top - boxes[i - 1]!.bottom;
        if (Math.abs(gap - 8) > 1) return `gap ${gap} at ${i}`;
      }
      return 'ok';
    })
    .toBe('ok');
});

test('table keyboard navigation reaches the last row', async ({ page }) => {
  await open(page);
  const table = page.getByRole('table', { name: 'Trades' });
  await expect(table).toHaveAttribute('aria-rowcount', '5001');
  const first = table.locator('tr[data-index="0"]');
  await first.scrollIntoViewIfNeeded();
  await first.click();
  await expect(page.getByTestId('clicked')).toHaveText('0');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  const last = table.locator('tr[data-index="4999"]');
  await expect(last).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('clicked')).toHaveText('4999');
  const scroller = table.locator('xpath=ancestor::div[contains(@class,"nish-scroll-fade")][1]');
  const rb = (await last.boundingBox())!;
  const sb = (await scroller.boundingBox())!;
  expect(rb.y).toBeGreaterThanOrEqual(sb.y - 1);
  expect(rb.y + rb.height).toBeLessThanOrEqual(sb.y + sb.height + 1);
});

test('tree keyboard model', async ({ page }) => {
  await open(page);
  const tree = page.getByRole('tree', { name: 'Files' });
  const src = tree.getByRole('treeitem', { name: 'src', exact: true });
  await src.focus();
  await expect(src).toBeFocused();
  await expect(src).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(src).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowRight');
  await expect(src).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(tree.getByRole('treeitem', { name: 'components', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(tree.getByRole('treeitem', { name: 'README.md', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('activated')).toHaveText('README.md');
});

test('context menu opens by pointer and keyboard', async ({ page }) => {
  await open(page);
  const area = page.getByText('Right-click here');
  await area.scrollIntoViewIfNeeded();
  const b = (await area.boundingBox())!;
  const px = b.x + 40;
  const py = b.y + 40;
  await page.mouse.click(px, py, { button: 'right' });
  const menu = page.getByRole('menu', { name: 'Actions' });
  await expect(menu).toBeVisible();
  const m = (await menu.boundingBox())!;
  const nearX = Math.abs(m.x - px) <= 12 || Math.abs(m.x + m.width - px) <= 12;
  const nearY = Math.abs(m.y - py) <= 12 || Math.abs(m.y + m.height - py) <= 12;
  expect(nearX && nearY).toBe(true);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);
  await expect(page.getByTestId('last')).not.toHaveText('');

  await area.focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(area).toBeFocused();
});

test('hover card follows WCAG 1.4.13', async ({ page }) => {
  await open(page);
  const link = page.getByRole('link', { name: 'AAPL' });
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  const text = page.getByText('Apple Inc. · NASDAQ');
  await expect(text).toBeVisible();
  await text.hover();
  await page.waitForTimeout(400);
  await expect(text).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(text).toHaveCount(0);
});

async function serious(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    // axe compares the visible text of an expanded treeitem, which includes its nested group, with
    // its name (aria-labelledby the row label, as the WAI-ARIA tree pattern asks): a known false positive.
    .map((v) => (v.id === 'label-content-name-mismatch' ? { ...v, nodes: v.nodes.filter((n) => !/^li\[data-id=/.test(n.target.join(' '))) } : v))
    .filter((v) => v.nodes.length > 0)
    .map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
}

test('axe finds nothing serious, menu closed and open', async ({ page }) => {
  await open(page);
  expect(await serious(page)).toEqual([]);
  const area = page.getByText('Right-click here');
  await area.scrollIntoViewIfNeeded();
  const b = (await area.boundingBox())!;
  await page.mouse.click(b.x + 40, b.y + 40, { button: 'right' });
  await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
  await page.waitForTimeout(300);
  expect(await serious(page)).toEqual([]);
});

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
