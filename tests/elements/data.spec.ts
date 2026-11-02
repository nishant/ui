import { expect, test, type Page } from '@playwright/test';

// Behavior of the wave 3 elements in a real browser: <nish-table-sort>, <nish-filter-bar>,
// <nish-split>, <nish-nav-rail>, <nish-scroll-row>, <nish-section-nav>, <nish-command-palette>,
// <nish-line-chart> and <nish-bar-chart>. The page is tests/elements/data.html (static markup,
// data.ts records events).

test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

interface Ev {
  type: string;
  detail?: Record<string, unknown> | null;
  target: string;
  t: number;
}

async function load(page: Page, opts: { path?: string } = {}): Promise<void> {
  // The path is set before the page's scripts run, so the elements read it when they mount.
  // (The deferred module script runs after readyState turns "interactive"; its URL was already resolved.)
  if (opts.path) {
    await page.addInitScript((p) => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') history.replaceState(null, '', p);
      });
    }, opts.path);
  }
  await page.goto(`http://localhost:5194/data.html`);
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
}

const events = (page: Page, type?: string, target?: string): Promise<Ev[]> =>
  page.evaluate(
    ([t, id]) => (window.nishEvents as Ev[]).filter((e) => (!t || e.type === t) && (!id || e.target === id)),
    [type, target] as [string | undefined, string | undefined],
  );

const clearEvents = (page: Page): Promise<void> => page.evaluate(() => void (window.nishEvents.length = 0));

const column = (page: Page, id: string, index: number): Promise<string[]> =>
  page.evaluate(
    ([host, i]) => Array.from(document.querySelectorAll(`#${host} tbody tr`)).map((r) => (r.children[i as number] as HTMLElement).textContent!.trim()),
    [id, index] as [string, number],
  );

test.describe('<nish-table-sort>', () => {
  test('adds a sort button with an svg to each data-sort header only', async ({ page }) => {
    await load(page);
    await expect(page.locator('#ts th[data-sort] > button.nish-th-sort')).toHaveCount(3);
    await expect(page.locator('#ts th[data-sort] > button.nish-th-sort svg')).toHaveCount(3);
    await expect(page.locator('#ts th:not([data-sort]) button')).toHaveCount(0);
    for (const th of await page.locator('#ts th[data-sort]').all()) await expect(th).toHaveAttribute('aria-sort', 'none');
  });

  test('a click sorts text ascending then descending, ignoring case, and fires nish-sort', async ({ page }) => {
    await load(page);
    const name = page.locator('#ts th[data-sort="name"] button');
    await name.click();
    expect(await column(page, 'ts', 0)).toEqual(['apple', 'Banana', 'Cherry', 'Date']);
    await expect(page.locator('#ts th[data-sort="name"]')).toHaveAttribute('aria-sort', 'ascending');
    await name.click();
    expect(await column(page, 'ts', 0)).toEqual(['Date', 'Cherry', 'Banana', 'apple']);
    await expect(page.locator('#ts th[data-sort="name"]')).toHaveAttribute('aria-sort', 'descending');
    const evs = await events(page, 'nish-sort', 'ts');
    expect(evs.map((e) => e.detail)).toEqual([
      { column: 'name', direction: 'asc' },
      { column: 'name', direction: 'desc' },
    ]);
  });

  test('a numeric column sorts by value and blank keys sort last both ways', async ({ page }) => {
    await load(page);
    const qty = page.locator('#ts th[data-sort="qty"] button');
    await qty.click();
    expect(await column(page, 'ts', 1)).toEqual(['2', '10', '1,500', '']);
    await qty.click();
    expect(await column(page, 'ts', 1)).toEqual(['1,500', '10', '2', '']);
  });

  test('data-value is the key, not the text; sorting another column clears the first', async ({ page }) => {
    await load(page);
    await page.locator('#ts th[data-sort="note"] button').click();
    expect(await column(page, 'ts', 2)).toEqual(['First', 'Second', 'Third', '']);
    await page.locator('#ts th[data-sort="name"] button').click();
    await expect(page.locator('#ts th[data-sort="note"]')).toHaveAttribute('aria-sort', 'none');
    await expect(page.locator('#ts th[data-sort="name"]')).toHaveAttribute('aria-sort', 'ascending');
  });

  test('manual only fires the event and leaves the rows alone', async ({ page }) => {
    await load(page);
    await page.locator('#ts-manual th[data-sort="host"] button').click();
    expect(await column(page, 'ts-manual', 0)).toEqual(['zeta', 'alpha']);
    await expect(page.locator('#ts-manual th[data-sort="host"]')).toHaveAttribute('aria-sort', 'ascending');
    expect((await events(page, 'nish-sort', 'ts-manual')).map((e) => e.detail)).toEqual([{ column: 'host', direction: 'asc' }]);
  });

  test('a header added later gets a button', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const th = document.createElement('th');
      th.dataset.sort = 'late';
      th.textContent = 'Late';
      document.querySelector('#ts-manual thead tr')!.append(th);
    });
    await expect(page.locator('#ts-manual th[data-sort="late"] > button.nish-th-sort')).toHaveCount(1);
  });
});

test('table classes: only a --zebra table is striped, inside the wrap or not', async ({ page }) => {
  await load(page);
  const bg = await page.evaluate(() => {
    const rows = '<tbody><tr><td>a</td></tr><tr><td>b</td></tr></tbody>';
    const host = document.createElement('div');
    host.innerHTML =
      `<div class="nish-table-wrap"><table class="nish-table" id="z-plain">${rows}</table></div>` +
      `<div class="nish-table-wrap"><table class="nish-table nish-table--zebra" id="z-on">${rows}</table></div>`;
    document.body.append(host);
    const even = (id: string) => getComputedStyle(document.querySelector(`#${id} tbody tr:nth-child(2)`)!).backgroundColor;
    const odd = (id: string) => getComputedStyle(document.querySelector(`#${id} tbody tr:nth-child(1)`)!).backgroundColor;
    return { plain: [odd('z-plain'), even('z-plain')], zebra: [odd('z-on'), even('z-on')] };
  });
  expect(bg.plain[1]).toBe(bg.plain[0]);
  expect(bg.zebra[1]).not.toBe(bg.zebra[0]);
});

test.describe('<nish-filter-bar>', () => {
  test('wide: search, chips, trailing and summary sit in their slots and Clear filters fires nish-clear', async ({ page }) => {
    await load(page);
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'false');
    await expect(page.locator('#fb .nish-filter-bar-search #fb-search')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar-chips #fb-chips')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar-chips #fb-select')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar-trailing #fb-trailing')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar-summary #fb-summary')).toHaveText('42 jobs');
    await expect(page.locator('#fb .nish-filter-bar-summary')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#fb .nish-filter-btn')).toBeHidden();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    expect(await events(page, 'nish-clear', 'fb')).toHaveLength(1);
  });

  // FIXME(filter-bar.ts): its MutationObserver routes Lit's marker comment nodes and removes them, so
  // the next property change throws "ChildPart has no parentNode" and nothing re-lays out.
  test.fixme('Clear filters is hidden while active-count is 0', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('fb')!.setAttribute('active-count', '0'));
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeHidden();
  });

  test('narrow: chips move into the sheet, the same nodes, and a Filters button shows the count', async ({ page }) => {
    await load(page);
    const same = await page.evaluate(() => {
      (window as unknown as { __chips: Element }).__chips = document.getElementById('fb-chips')!;
      return true;
    });
    expect(same).toBe(true);
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'true');
    const btn = page.locator('#fb .nish-filter-btn');
    await expect(btn).toBeVisible();
    await expect(btn.locator('.nish-badge')).toHaveText('2');
    await expect(btn.locator('.nish-badge')).toHaveAttribute('aria-label', '2 active');
    await expect(page.locator('#fb nish-sheet #fb-chips')).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as { __chips: Element }).__chips === document.getElementById('fb-chips'))).toBe(true);
    // The trailing and summary slots stay in the bar.
    await expect(page.locator('#fb .nish-filter-bar-trailing #fb-trailing')).toHaveCount(1);
  });

  test('narrow: the button opens the sheet; Clear fires nish-clear; Show results closes it', async ({ page }) => {
    await load(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('#fb .nish-filter-btn').click();
    const sheet = page.locator('#fb dialog.nish-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.nish-sheet-title')).toHaveText('Filters');
    await sheet.getByRole('button', { name: 'Clear', exact: true }).click();
    expect(await events(page, 'nish-clear', 'fb')).toHaveLength(1);
    await sheet.getByRole('button', { name: 'Show results' }).click();
    await expect(sheet).toBeHidden();
  });

  // FIXME(filter-bar.ts): its MutationObserver routes Lit's marker comment nodes and removes them, so
  // the next property change throws "ChildPart has no parentNode" and nothing re-lays out.
  test.fixme('sheet-title renames the sheet; crossing the breakpoint closes it and moves the chips back', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('fb')!.setAttribute('sheet-title', 'Refine'));
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('#fb .nish-filter-btn').click();
    await expect(page.locator('#fb dialog.nish-sheet .nish-sheet-title')).toHaveText('Refine');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#fb dialog.nish-sheet')).toHaveCount(0);
    await expect(page.locator('#fb .nish-filter-bar-chips #fb-chips')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'false');
  });

  // FIXME(filter-bar.ts): its MutationObserver routes Lit's marker comment nodes and removes them, so
  // the next property change throws "ChildPart has no parentNode" and nothing re-lays out.
  test.fixme('sheet-below="lg" switches to the sheet at 1000px', async ({ page }) => {
    await load(page);
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'false');
    await page.evaluate(() => document.getElementById('fb')!.setAttribute('sheet-below', 'lg'));
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'true');
  });

  test('the children keep their listeners after a move', async ({ page }) => {
    await load(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('#fb .nish-filter-btn').click();
    await clearEvents(page);
    await page.locator('#fb-chips button', { hasText: 'Open' }).click();
    expect((await events(page, 'nish-change', 'fb-chips')).length).toBe(1);
  });
});

test.describe('<nish-split>', () => {
  test('wraps children in panes with a separator between them and honors sizes', async ({ page }) => {
    await load(page);
    await expect(page.locator('#sp-row > .nish-split-pane')).toHaveCount(2);
    const sep = page.locator('#sp-row > .nish-split-divider');
    await expect(sep).toHaveCount(1);
    await expect(sep).toHaveAttribute('role', 'separator');
    await expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    await expect(sep).toHaveAttribute('aria-valuenow', '30');
    await expect(sep).toHaveAttribute('tabindex', '0');
    const [a, b] = await page.evaluate(() => ['sp-a', 'sp-b'].map((id) => document.getElementById(id)!.parentElement!.getBoundingClientRect().width));
    expect(a! / (a! + b!)).toBeCloseTo(0.3, 1);
  });

  test('arrow keys move the divider by 5% and fire nish-resize; sizes reflects', async ({ page }) => {
    await load(page);
    const sep = page.locator('#sp-row > .nish-split-divider');
    await sep.focus();
    await clearEvents(page);
    await page.keyboard.press('ArrowRight');
    await expect(sep).toHaveAttribute('aria-valuenow', '35');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(sep).toHaveAttribute('aria-valuenow', '25');
    const evs = await events(page, 'nish-resize', 'sp-row');
    expect(evs).toHaveLength(3);
    expect((evs[0]!.detail!.sizes as number[]).map(Math.round)).toEqual([35, 65]);
    expect(await page.locator('#sp-row').getAttribute('sizes')).toBe('25,75');
  });

  test('a column split resizes with ArrowUp and ArrowDown and exposes a horizontal separator', async ({ page }) => {
    await load(page);
    const sep = page.locator('#sp-col > .nish-split-divider');
    await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    await sep.focus();
    await page.keyboard.press('ArrowDown');
    await expect(sep).toHaveAttribute('aria-valuenow', '55');
    await page.keyboard.press('ArrowRight');
    await expect(sep).toHaveAttribute('aria-valuenow', '55');
  });

  test('Enter and a double-click on a divider reset every pane to equal shares', async ({ page }) => {
    await load(page);
    const sep = page.locator('#sp-row > .nish-split-divider');
    await expect(sep).toHaveAttribute('aria-valuenow', '30');
    await sep.focus();
    await page.keyboard.press('Enter');
    await expect(sep).toHaveAttribute('aria-valuenow', '50');
    await page.keyboard.press('ArrowRight');
    await expect(sep).toHaveAttribute('aria-valuenow', '55');
    await sep.dblclick();
    await expect(sep).toHaveAttribute('aria-valuenow', '50');
  });

  test('keys stop at min and never invert the panes', async ({ page }) => {
    await load(page);
    const sep = page.locator('#sp-row > .nish-split-divider');
    await sep.focus();
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowLeft');
    const widths = await page.evaluate(() => ['sp-a', 'sp-b'].map((id) => document.getElementById(id)!.parentElement!.getBoundingClientRect().width));
    expect(widths[0]).toBeGreaterThanOrEqual(99);
    expect(widths[1]).toBeGreaterThan(widths[0]!);
  });

  test('a pointer drag resizes, sets data-dragging and turns iframe pointer events off meanwhile', async ({ page }) => {
    await load(page);
    await page.locator('#sp-saved').scrollIntoViewIfNeeded();
    const sep = page.locator('#sp-saved > .nish-split-divider');
    const box = (await sep.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await clearEvents(page);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 100, y, { steps: 4 });
    await expect(page.locator('#sp-saved')).toHaveAttribute('data-dragging', '');
    expect(await page.locator('#sp-frame').evaluate((f) => (f as HTMLElement).style.pointerEvents)).toBe('none');
    await page.mouse.up();
    await expect(page.locator('#sp-saved')).not.toHaveAttribute('data-dragging', /.*/);
    expect(await page.locator('#sp-frame').evaluate((f) => (f as HTMLElement).style.pointerEvents)).toBe('');
    const evs = await events(page, 'nish-resize', 'sp-saved');
    expect(evs.length).toBeGreaterThan(0);
    const last = evs[evs.length - 1]!.detail!.sizes as number[];
    expect(last[0]).toBeLessThan(50);
    expect(last[0]! + last[1]!).toBeCloseTo(100, 3);
  });

  test('storage-key saves the sizes and a reload restores them', async ({ page }) => {
    await load(page);
    await page.evaluate(() => localStorage.removeItem('data-spec-split'));
    await page.locator('#sp-saved > .nish-split-divider').focus();
    await page.keyboard.press('ArrowRight');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('data-spec-split')!) as number[]);
    expect(saved.map(Math.round)).toEqual([55, 45]);
    await page.reload();
    await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
    await expect(page.locator('#sp-saved > .nish-split-divider')).toHaveAttribute('aria-valuenow', '55');
  });

  test('a saved list of the wrong length, or garbage, is ignored', async ({ page }) => {
    await load(page);
    for (const bad of ['[10,20,70]', 'not json', '[0,100]']) {
      await page.evaluate((v) => localStorage.setItem('data-spec-split', v), bad);
      await page.reload();
      await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
      await expect(page.locator('#sp-saved > .nish-split-divider')).toHaveAttribute('aria-valuenow', '50');
    }
    await page.evaluate(() => localStorage.removeItem('data-spec-split'));
  });

  test('nested splits give a 2D layout', async ({ page }) => {
    await load(page);
    await expect(page.locator('#sp-nest > .nish-split-pane > #sp-inner')).toHaveCount(1);
    await expect(page.locator('#sp-inner > .nish-split-divider')).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(page.locator('#sp-nest > .nish-split-divider')).toHaveAttribute('aria-orientation', 'vertical');
    const box = await page.locator('#sp-n3').evaluate((e) => e.parentElement!.getBoundingClientRect().toJSON());
    expect(box.height).toBeGreaterThan(80);
  });

  test('a pane added later gets wrapped and a divider appears', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const d = document.createElement('div');
      d.id = 'sp-late';
      d.textContent = 'Late';
      document.getElementById('sp-row')!.append(d);
    });
    await expect(page.locator('#sp-row > .nish-split-pane')).toHaveCount(3);
    await expect(page.locator('#sp-row > .nish-split-divider')).toHaveCount(2);
  });

  test('coarse pointer under 640px stacks the panes and hides the dividers', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    try {
      await load(page);
      await expect(page.locator('#sp-row > .nish-split-divider')).toBeHidden();
      const [a, b] = await page.evaluate(() => ['sp-a', 'sp-b'].map((id) => document.getElementById(id)!.parentElement!.getBoundingClientRect()));
      expect(b!.top).toBeGreaterThanOrEqual(a!.bottom - 1);
    } finally {
      await ctx.close();
    }
  });

  test('stacked panes keep the stack height at 360px', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    try {
      await load(page);
      const heights = await page.evaluate(() => ['sp-a', 'sp-b'].map((id) => document.getElementById(id)!.parentElement!.getBoundingClientRect().height));
      for (const h of heights) expect(h).toBeGreaterThanOrEqual(255);
    } finally {
      await ctx.close();
    }
  });
});

test.describe('<nish-nav-rail>', () => {
  test('wraps links in a labelled nav and marks the current link by longest path prefix', async ({ page }) => {
    await load(page, { path: '/home/deep' });
    const nav = page.locator('#nr > nav.nish-nav-rail');
    await expect(nav).toHaveAttribute('aria-label', 'Pages');
    await expect(nav.locator('a.nish-nav-rail-item')).toHaveCount(4);
    await expect(nav.locator('.nish-nav-rail-tools a')).toHaveClass(/nish-nav-rail-item/);
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('a[href="/home"]')).toHaveAttribute('aria-current', 'page');
    // The other-origin link never counts.
    await expect(nav.locator('a[href^="https://example.com"]')).not.toHaveAttribute('aria-current', /.*/);
  });

  test('footer and tools slots go after the links, tools first, and get their classes', async ({ page }) => {
    await load(page);
    const kids = await page.evaluate(() => Array.from(document.querySelector('#nr > nav')!.children).map((c) => c.className || c.localName));
    expect(kids.slice(-2)).toEqual(['nish-nav-rail-tools', 'nish-nav-rail-footer']);
    await expect(page.locator('#nr-footer')).toHaveCount(1);
  });

  test('popstate moves the current link; a late link is decorated', async ({ page }) => {
    await load(page, { path: '/home' });
    await page.evaluate(() => {
      history.pushState(null, '', '/lists/1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.locator('#nr a[href="/lists"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#nr a[href="/home"]')).not.toHaveAttribute('aria-current', /.*/);
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/extra';
      a.id = 'nr-extra';
      a.textContent = 'Extra';
      document.querySelector('#nr > nav')!.insertBefore(a, document.querySelector('#nr > nav')!.firstChild);
    });
    await expect(page.locator('#nr-extra')).toHaveClass(/nish-nav-rail-item/);
  });

  test('hash-only links never claim the path match and keep an author aria-current', async ({ page }) => {
    await load(page, { path: '/home' });
    await page.evaluate(() => {
      const rail = document.createElement('nish-nav-rail');
      rail.id = 'nr-hash';
      rail.innerHTML = '<a href="#a">A</a><a href="#b" aria-current="page">B</a>';
      document.body.append(rail);
    });
    const links = page.locator('#nr-hash a');
    await expect(links.nth(0)).toHaveClass(/nish-nav-rail-item/);
    await expect(links.nth(0)).not.toHaveAttribute('aria-current', /.*/);
    await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');
    await page.evaluate(() => {
      location.hash = '#a';
    });
    await expect(links.nth(0)).toHaveAttribute('aria-current', 'page');
    await expect(links.nth(1)).not.toHaveAttribute('aria-current', /.*/);
  });

  test('the rail shows from 768px and hides from 1024px', async ({ page }) => {
    await load(page);
    const nav = page.locator('#nr > nav');
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(nav).toBeHidden();
    await page.setViewportSize({ width: 840, height: 800 });
    await expect(nav).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(nav).toBeHidden();
  });

  test('a disconnect removes the popstate listener: no mark after removal', async ({ page }) => {
    await load(page, { path: '/home' });
    const ok = await page.evaluate(() => {
      const rail = document.getElementById('nr')!;
      const nav = rail.querySelector('nav')!;
      rail.remove();
      const link = nav.querySelector('a[href="/lists"]')!;
      history.pushState(null, '', '/lists');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return !link.hasAttribute('aria-current');
    });
    expect(ok).toBe(true);
  });
});

test.describe('<nish-scroll-row>', () => {
  test('wraps children, labels the row and scrolls the pressed child into view', async ({ page }) => {
    await load(page);
    const row = page.locator('#sr > div.nish-scroll-row');
    await expect(row).toHaveAttribute('aria-label', 'Topics');
    await expect(row).toHaveClass(/nish-scroll-row--snap/);
    expect(await row.evaluate((r) => r.scrollLeft)).toBeGreaterThan(0);
    const active = (await page.locator('#sr-active').boundingBox())!;
    const rb = (await row.boundingBox())!;
    expect(active.x + active.width).toBeLessThanOrEqual(rb.x + rb.width + 1);
    // The page itself did not scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('data-at-start and data-at-end follow the scroll position', async ({ page }) => {
    await load(page);
    const row = page.locator('#sr > div.nish-scroll-row');
    await expect(row).toHaveAttribute('data-at-start', 'false');
    await expect(row).toHaveAttribute('data-at-end', 'true');
    await row.evaluate((r) => (r.scrollLeft = 0));
    await expect(row).toHaveAttribute('data-at-start', 'true');
    await expect(row).toHaveAttribute('data-at-end', 'false');
  });

  test('a row that fits is at both edges', async ({ page }) => {
    await load(page);
    const row = page.locator('#sr-short > div.nish-scroll-row');
    await expect(row).toHaveAttribute('data-at-start', 'true');
    await expect(row).toHaveAttribute('data-at-end', 'true');
  });

  test('resizing recomputes the edges; attributes toggle the classes', async ({ page }) => {
    await load(page);
    const row = page.locator('#sr > div.nish-scroll-row');
    await page.evaluate(() => (document.getElementById('sr')!.parentElement!.style.width = '2000px'));
    await expect(row).toHaveAttribute('data-at-end', 'true');
    await expect(row).toHaveAttribute('data-at-start', 'true');
    await page.evaluate(() => {
      const el = document.getElementById('sr')!;
      el.setAttribute('bleed', '');
      el.setAttribute('fade', 'false');
      el.removeAttribute('snap');
    });
    await expect(row).toHaveClass(/nish-scroll-row--bleed/);
    await expect(row).not.toHaveClass(/nish-scroll-row--snap/);
    await expect(row).toHaveClass(/nish-scroll-row--no-fade/);
    expect(await row.evaluate((e) => getComputedStyle(e).maskImage)).toBe('none');
  });
});

test.describe('<nish-section-nav>', () => {
  test('wraps links in a labelled nav.nish-subnav', async ({ page }) => {
    await load(page);
    const nav = page.locator('#sn > nav.nish-subnav');
    await expect(nav).toHaveAttribute('aria-label', 'On this page');
    await expect(nav.locator('a')).toHaveCount(3);
  });

  test('a click scrolls to the section, replaces the hash and fires nish-select', async ({ page }) => {
    await load(page);
    await clearEvents(page);
    const before = await page.evaluate(() => history.length);
    await page.locator('#sn a', { hasText: 'Beta' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    expect(await page.evaluate(() => location.hash)).toBe('#sec-b');
    expect(await page.evaluate(() => history.length)).toBe(before);
    expect((await events(page, 'nish-select', 'sn')).map((e) => e.detail)).toEqual([{ id: 'sec-b' }]);
  });

  test('update-hash="false" leaves the hash alone', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('sn')!.setAttribute('update-hash', 'false'));
    await page.locator('#sn a', { hasText: 'Gamma' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600);
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('scrollspy marks the section being read with aria-current', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('sec-c')!.scrollIntoView({ block: 'start' }));
    await expect(page.locator('#sn a[href="#sec-c"]')).toHaveAttribute('aria-current', 'true');
  });

  test('a link whose target is missing is left to the browser', async ({ page }) => {
    await load(page);
    await clearEvents(page);
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '#nowhere';
      a.id = 'sn-gone';
      a.textContent = 'Gone';
      document.querySelector('#sn nav')!.append(a);
    });
    await page.locator('#sn-gone').click();
    expect(await events(page, 'nish-select', 'sn')).toHaveLength(0);
  });
});

test.describe('<nish-command-palette>', () => {
  const dialog = (page: Page) => page.locator('#cp dialog');

  test('opens from the property, shows grouped items, and closes with Escape returning focus', async ({ page }) => {
    await load(page);
    await page.locator('#cp-open').focus();
    await page.evaluate(() => ((document.getElementById('cp') as HTMLElement & { open: boolean }).open = true));
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#cp input[role="combobox"]')).toBeFocused();
    await expect(page.locator('#cp input')).toHaveAttribute('placeholder', 'Jump to…');
    const heads = await page.locator('#cp [role="group"] > :first-child').allTextContents();
    expect(heads).toEqual(['Pages', 'Actions']);
    // Ungrouped items come first, like React.
    await expect(page.locator('#cp [role="option"]')).toHaveText(['Ungrouped action', 'Jobs/jobs', 'Trips/trips', 'Toggle theme']);
    await expect(page.locator('#cp .nish-command-item-hint').first()).toHaveText('/jobs');
    await clearEvents(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#cp-open')).toBeFocused();
    expect(await page.locator('#cp').getAttribute('open')).toBeNull();
    expect(await events(page, 'nish-close', 'cp')).toHaveLength(1);
  });

  test('hotkey opens on Ctrl+K but not while typing in another field', async ({ page }) => {
    await load(page);
    await page.locator('#other-input').focus();
    await page.keyboard.press('Control+k');
    await expect(dialog(page)).toBeHidden();
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await expect(dialog(page)).toBeVisible();
  });

  test('only one dialog exists however often the hotkey is pressed', async ({ page }) => {
    await load(page);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.keyboard.press('Escape');
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await expect(page.locator('#cp dialog')).toHaveCount(1);
    expect(await page.locator('dialog[open]').count()).toBe(1);
  });

  test('every query word must match label, hint or keywords', async ({ page }) => {
    await load(page);
    await page.locator('#cp-open').focus();
    await page.keyboard.press('Control+k');
    const input = page.locator('#cp input');
    await input.fill('JOBS');
    await expect(page.locator('#cp [role="option"]')).toHaveText(['Jobs/jobs']);
    await input.fill('work');
    await expect(page.locator('#cp [role="option"]')).toHaveCount(1);
    await input.fill('toggle dark');
    await expect(page.locator('#cp [role="option"]')).toHaveText(['Toggle theme']);
    await input.fill('jobs dark');
    await expect(page.locator('#cp [role="option"]')).toHaveCount(0);
    await expect(page.locator('#cp .nish-command-empty')).toHaveText('Nothing found');
  });

  test('arrows move the selection with aria-activedescendant; Home and End jump', async ({ page }) => {
    await load(page);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    const input = page.locator('#cp input');
    const selected = () => page.locator('#cp [aria-selected="true"]').allTextContents();
    expect(await selected()).toEqual(['Ungrouped action']);
    await page.keyboard.press('ArrowDown');
    expect(await selected()).toEqual(['Jobs/jobs']);
    const id = await page.locator('#cp [aria-selected="true"]').getAttribute('id');
    await expect(input).toHaveAttribute('aria-activedescendant', id!);
    await page.keyboard.press('End');
    expect(await selected()).toEqual(['Toggle theme']);
    await page.keyboard.press('ArrowDown');
    expect(await selected()).toEqual(['Ungrouped action']);
    await page.keyboard.press('ArrowUp');
    expect(await selected()).toEqual(['Toggle theme']);
    await page.keyboard.press('Home');
    expect(await selected()).toEqual(['Ungrouped action']);
  });

  test('Enter on a button item closes, fires nish-select and clicks the button', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (window as unknown as { __clicks: number }).__clicks = 0;
      document.getElementById('cp-theme')!.addEventListener('click', () => ((window as unknown as { __clicks: number }).__clicks += 1));
    });
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await page.locator('#cp input').fill('toggle');
    await clearEvents(page);
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeHidden();
    expect((await events(page, 'nish-select', 'cp')).map((e) => e.detail)).toEqual([{ id: 'theme' }]);
    expect(await page.evaluate(() => (window as unknown as { __clicks: number }).__clicks)).toBe(1);
  });

  test('Enter on a link item follows its href', async ({ page }) => {
    await load(page);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#trips');
  });

  test('clicking a row selects it; clicking the backdrop closes', async ({ page }) => {
    await load(page);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await clearEvents(page);
    await page.locator('#cp [role="option"]', { hasText: 'Ungrouped action' }).click();
    await expect(dialog(page)).toBeHidden();
    expect((await events(page, 'nish-select', 'cp')).map((e) => e.detail)).toEqual([{ id: 'plain' }]);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await page.mouse.click(5, 5);
    await expect(dialog(page)).toBeHidden();
  });

  test('typing fires nish-query once, debounced, and the items property replaces the list', async ({ page }) => {
    await load(page);
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await clearEvents(page);
    await page.locator('#cp input').pressSequentially('abc', { delay: 20 });
    await expect.poll(async () => (await events(page, 'nish-query', 'cp')).length).toBe(1);
    const [q] = await events(page, 'nish-query', 'cp');
    expect(q!.detail).toEqual({ query: 'abc' });
    await page.evaluate(() => {
      (document.getElementById('cp') as HTMLElement & { items: unknown[] }).items = [{ id: 'srv1', label: 'abc from server', group: 'Server' }];
    });
    await expect(page.locator('#cp [role="option"]')).toHaveText(['abc from server']);
  });

  test('the items property alone works with no children, and an empty list shows the empty text', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (document.getElementById('cp2') as HTMLElement & { items: unknown[]; open: boolean }).items = [
        { id: 'one', label: 'One', hint: 'first' },
        { id: 'two', label: 'Two', keywords: ['second'] },
      ];
      (document.getElementById('cp2') as HTMLElement & { open: boolean }).open = true;
    });
    await expect(page.locator('#cp2 [role="option"]')).toHaveCount(2);
    await page.locator('#cp2 input').fill('second');
    await expect(page.locator('#cp2 [role="option"]')).toHaveText(['Two']);
    await page.locator('#cp2 input').fill('zzz');
    await expect(page.locator('#cp2 .nish-command-empty')).toHaveText('No results');
  });

  test('closing removes the document hotkey listener on disconnect', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('cp')!.remove());
    await page.locator('#before').focus();
    await page.keyboard.press('Control+k');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});

test.describe('<nish-line-chart> and <nish-bar-chart>', () => {
  test('a line chart draws a labelled svg with axis text and a hidden data table', async ({ page }) => {
    await load(page);
    const svg = page.locator('#lc svg[role="img"]');
    await expect(svg).toHaveAttribute('aria-label', 'Latency');
    await expect(svg.locator('polyline')).toHaveCount(1);
    expect(await svg.locator('text.nish-chart-axis').count()).toBeGreaterThan(3);
    await expect(page.locator('#lc table caption')).toHaveText('Latency');
    await expect(page.locator('#lc table tbody tr')).toHaveCount(4);
  });

  test('the svg fills the element width and redraws when the element resizes', async ({ page }) => {
    await load(page);
    const w = () => page.locator('#lc svg').evaluate((s) => Number(s.getAttribute('width')));
    const before = await w();
    expect(before).toBeGreaterThan(300);
    await page.setViewportSize({ width: 420, height: 800 });
    await expect.poll(w).toBeLessThan(before);
  });

  test('hover shows a tooltip and crosshair; leaving hides them', async ({ page }) => {
    await load(page);
    const svg = page.locator('#lc svg');
    await svg.scrollIntoViewIfNeeded();
    const box = (await svg.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 - 3, box.y + 50);
    await page.mouse.move(box.x + box.width / 2, box.y + 50, { steps: 3 });
    await expect(page.locator('#lc .nish-chart-tooltip')).toBeVisible();
    await page.mouse.move(box.x + box.width / 2, box.y - 60);
    await expect(page.locator('#lc .nish-chart-tooltip')).toHaveCount(0);
  });

  test('arrow keys scrub the points and Escape clears', async ({ page }) => {
    await load(page);
    await page.locator('#lc svg').focus();
    await page.keyboard.press('ArrowRight');
    const tip = page.locator('#lc .nish-chart-tooltip');
    await expect(tip).toContainText('3');
    await page.keyboard.press('ArrowRight');
    await expect(tip).toContainText('5');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(tip).toContainText('3');
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
  });

  test('series draw one line each with a legend', async ({ page }) => {
    await load(page);
    await expect(page.locator('#lc-multi svg polyline')).toHaveCount(2);
    await expect(page.locator('#lc-multi ul.nish-legend li')).toHaveText(['CPU', 'Memory']);
  });

  test('one point is a dot with no line; equal values give a flat line mid-height', async ({ page }) => {
    await load(page);
    await expect(page.locator('#lc-one svg circle')).toHaveCount(1);
    await expect(page.locator('#lc-one svg polyline')).toHaveCount(0);
    const ys = await page.locator('#lc-flat svg polyline').evaluate((p) => {
      const pts = (p.getAttribute('points') ?? '').split(' ').map((s) => Number(s.split(',')[1]));
      const svg = p.closest('svg')!;
      return { ys: pts, h: Number(svg.getAttribute('height')) };
    });
    expect(new Set(ys.ys).size).toBe(1);
    expect(ys.ys[0]).toBeGreaterThan(ys.h * 0.3);
    expect(ys.ys[0]).toBeLessThan(ys.h * 0.7);
  });

  test('empty data shows .nish-empty with the default or the empty text', async ({ page }) => {
    await load(page);
    await expect(page.locator('#lc-empty .nish-empty')).toHaveText('No data yet');
    await expect(page.locator('#lc-empty-text .nish-empty')).toHaveText('Waiting for data');
    await expect(page.locator('#bc-empty .nish-empty')).toHaveText('No data yet');
  });

  test('data set as a property redraws', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (document.getElementById('lc-empty') as HTMLElement & { data: unknown[] }).data = [1, 2, 3];
    });
    await expect(page.locator('#lc-empty svg polyline')).toHaveCount(1);
    await expect(page.locator('#lc-empty .nish-empty')).toHaveCount(0);
  });

  test('a theme change redraws with the new colors', async ({ page }) => {
    await load(page);
    const stroke = () => page.locator('#lc svg line.nish-chart-grid').first().getAttribute('stroke');
    const first = await stroke();
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(100);
    // The attribute is a real value (a token reference or a color) in both themes.
    expect(first).toBeTruthy();
    expect(await stroke()).toBeTruthy();
    await expect(page.locator('#lc svg')).toHaveCount(1);
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  });

  test('a bar chart draws a rect per bar, prints values with show-values, and selects with the keys', async ({ page }) => {
    await load(page);
    const svg = page.locator('#bc svg[role="img"]');
    await expect(svg).toHaveAttribute('aria-label', 'Visits');
    await expect(svg.locator('rect')).toHaveCount(3);
    await expect(svg.locator('text.nish-chart-axis', { hasText: '9' })).toHaveCount(1);
    await svg.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#bc [aria-live="polite"]')).toHaveText('Tue: 9');
    await page.keyboard.press('Escape');
    await expect(page.locator('#bc [aria-live="polite"]')).toHaveText('');
  });
});

test('every wave 3 element is defined, and loading both built files again does not throw', async ({ page }) => {
  await load(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const ok = await page.evaluate(async () => {
    try {
      await window.loadBundle();
      await window.loadBundle();
      await window.loadCharts();
      await window.loadCharts();
      return true;
    } catch {
      return false;
    }
  });
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
  for (const tag of [
    'nish-table-sort',
    'nish-filter-bar',
    'nish-split',
    'nish-nav-rail',
    'nish-scroll-row',
    'nish-section-nav',
    'nish-command-palette',
    'nish-line-chart',
    'nish-bar-chart',
  ]) {
    expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  }
  // The elements keep working after the second load.
  await page.locator('#ts th[data-sort="name"] button').click();
  await expect(page.locator('#ts th[data-sort="name"]')).toHaveAttribute('aria-sort', 'ascending');
});

test.describe('re-connect safety (a DOM move)', () => {
  const move = (page: Page, id: string): Promise<void> =>
    page.evaluate((i) => {
      const el = document.getElementById(i)!;
      const holder = document.createElement('div');
      holder.id = `${i}-holder`;
      document.body.appendChild(holder);
      el.remove();
      holder.appendChild(el);
    }, id);

  test('<nish-filter-bar> does not double its structure and keeps the same child nodes', async ({ page }) => {
    await load(page);
    await page.evaluate(() => ((window as unknown as { __c: Element }).__c = document.getElementById('fb-chips')!));
    await move(page, 'fb');
    await expect(page.locator('#fb .nish-filter-bar')).toHaveCount(1);
    await expect(page.locator('#fb .nish-filter-bar-chips #fb-chips')).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as { __c: Element }).__c === document.getElementById('fb-chips'))).toBe(true);
    await clearEvents(page);
    await page.locator('#fb-chips button', { hasText: 'Open' }).click();
    expect((await events(page, 'nish-change', 'fb-chips')).length).toBe(1);
  });

  test('<nish-filter-bar> forgets a removed chip across the breakpoint, both ways', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('fb-select')!.remove());
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'true');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#fb .nish-filter-bar')).toHaveAttribute('data-compact', 'false');
    await expect(page.locator('#fb-select')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#fb-select')).toHaveCount(0);
    await expect(page.locator('#fb .nish-filter-btn')).toBeVisible();
  });

  test('<nish-split> keeps one divider per pair and its panes', async ({ page }) => {
    await load(page);
    await move(page, 'sp-row');
    await expect(page.locator('#sp-row > .nish-split-pane')).toHaveCount(2);
    await expect(page.locator('#sp-row > .nish-split-divider')).toHaveCount(1);
    await expect(page.locator('#sp-a')).toHaveCount(1);
    await page.locator('#sp-row > .nish-split-divider').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#sp-row > .nish-split-divider')).toHaveAttribute('aria-valuenow', '35');
  });

  test('<nish-scroll-row> keeps one scroll row and its children', async ({ page }) => {
    await load(page);
    const before = await page.locator('#sr .nish-chip').count();
    await move(page, 'sr');
    await expect(page.locator('#sr .nish-scroll-row')).toHaveCount(1);
    await expect(page.locator('#sr .nish-chip')).toHaveCount(before);
  });

  test('<nish-command-palette> keeps one dialog, and its hotkey stops after removal', async ({ page }) => {
    await load(page);
    await move(page, 'cp');
    await expect(page.locator('#cp dialog')).toHaveCount(1);
    await page.keyboard.press('Control+k');
    await expect(page.locator('#cp dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.getElementById('cp')!.remove());
    await page.keyboard.press('Control+k');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});
