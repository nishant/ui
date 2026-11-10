// Shared by the axe and pickers specs: an axe scan (serious and critical only) and a themed page load.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ') + ' :: ' + n.html.slice(0, 120)) }));
}

export async function load(page: Page, url: string, theme: string, ready: string) {
  await page.goto(url);
  await page.waitForSelector(ready);
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t === 'light' ? 'light' : 'dark';
  }, theme);
  // Let animations (fade-in, Tooltip delay) settle so axe reads final colors.
  await page.waitForTimeout(450);
}
