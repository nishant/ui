import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// The elements strings module as Vite serves it (the harness root is tests/elements, so /@fs/).
const STRINGS = '/@fs/' + resolve(import.meta.dirname, '../../src/elements/strings.ts').replace(/\\/g, '/').replace(/^\//, '');

// Production-hardening behavior of the custom elements in a real browser: right-to-left arrow keys,
// late children, configureStrings, and the command palette's refusal of script URLs. The page is
// tests/elements/data.html (it loads the forms, data and charts entries from src).

test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

async function load(page: Page): Promise<void> {
  await page.goto('http://localhost:5194/data.html');
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
}

/** Put markup in a fresh container at the end of the body (the elements upgrade and mount as they
 *  would after a framework renders them). */
async function add(page: Page, html: string, attrs: Record<string, string> = {}): Promise<void> {
  await page.evaluate(
    ([markup, a]) => {
      const box = document.createElement('div');
      box.id = 'box';
      for (const [k, v] of Object.entries(a)) box.setAttribute(k, v);
      box.innerHTML = markup;
      document.body.append(box);
    },
    [html, attrs] as [string, Record<string, string>],
  );
}

const active = (page: Page): Promise<string> => page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? '');

test.describe('right-to-left arrow keys', () => {
  const TABS = '<nish-tabs label="T" value="one"><button value="one">One</button><button value="two">Two</button><button value="three">Three</button></nish-tabs>';
  const SEG = '<nish-segmented label="S" value="one"><button value="one">One</button><button value="two">Two</button><button value="three">Three</button></nish-segmented>';

  test('tabs: ArrowRight goes forward in LTR, ArrowLeft goes forward in RTL', async ({ page }) => {
    await load(page);
    await add(page, TABS);
    await page.locator('#box button[role="tab"]').first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await active(page)).toBe('Two');
    await page.keyboard.press('ArrowLeft');
    expect(await active(page)).toBe('One');
    await page.evaluate(() => document.getElementById('box')!.remove());

    await add(page, TABS, { dir: 'rtl' });
    await page.locator('#box button[role="tab"]').first().focus();
    await page.keyboard.press('ArrowLeft');
    expect(await active(page)).toBe('Two');
    await page.keyboard.press('ArrowRight');
    expect(await active(page)).toBe('One');
    await page.keyboard.press('ArrowRight');
    expect(await active(page)).toBe('Three');
    await expect(page.locator('#box nish-tabs')).toHaveAttribute('value', 'three');
  });

  test('segmented: horizontal arrows mirror in RTL, vertical arrows do not', async ({ page }) => {
    await load(page);
    await add(page, SEG, { dir: 'rtl' });
    await page.locator('#box button[role="radio"]').first().focus();
    await page.keyboard.press('ArrowLeft');
    expect(await active(page)).toBe('Two');
    await page.keyboard.press('ArrowRight');
    expect(await active(page)).toBe('One');
    await page.keyboard.press('ArrowDown');
    expect(await active(page)).toBe('Two');
    await page.keyboard.press('ArrowUp');
    expect(await active(page)).toBe('One');
    await page.evaluate(() => document.getElementById('box')!.remove());

    await add(page, SEG);
    await page.locator('#box button[role="radio"]').first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await active(page)).toBe('Two');
  });

  test('split: in RTL ArrowLeft grows the first pane and a drag to the left grows it', async ({ page }) => {
    await load(page);
    await add(page, '<nish-split id="hsp" sizes="50,50" style="height:200px"><div>A</div><div>B</div></nish-split>', { dir: 'rtl', style: 'width:600px' });
    const divider = page.locator('#hsp .nish-split-divider');
    await divider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(divider).toHaveAttribute('aria-valuenow', '55');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(divider).toHaveAttribute('aria-valuenow', '45');
    await page.keyboard.press('Enter');
    await expect(divider).toHaveAttribute('aria-valuenow', '50');

    const box = (await divider.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 60, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    const grown = Number(await divider.getAttribute('aria-valuenow'));
    expect(grown).toBeGreaterThan(55);
  });

  test('split: LTR keys are unchanged', async ({ page }) => {
    await load(page);
    await add(page, '<nish-split id="hsp" sizes="50,50" style="height:200px"><div>A</div><div>B</div></nish-split>', { style: 'width:600px' });
    const divider = page.locator('#hsp .nish-split-divider');
    await divider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(divider).toHaveAttribute('aria-valuenow', '55');
  });
});

test.describe('late children', () => {
  test('nav-rail takes a link, a tools slot and a footer slot added after mount', async ({ page }) => {
    await load(page);
    await add(page, '<nish-nav-rail id="hnr"><a href="/one">One</a></nish-nav-rail>');
    await expect(page.locator('#hnr > nav.nish-nav-rail > a')).toHaveCount(1);
    await page.evaluate(() => {
      const rail = document.getElementById('hnr')!;
      const footer = document.createElement('div');
      footer.setAttribute('data-slot', 'footer');
      footer.innerHTML = '<a href="/settings">Settings</a>';
      const tools = document.createElement('div');
      tools.setAttribute('data-slot', 'tools');
      tools.innerHTML = '<a href="/tool">Tool</a>';
      const link = document.createElement('a');
      link.href = '/two';
      link.textContent = 'Two';
      rail.append(footer, link, tools);
    });
    const kids = page.locator('#hnr > nav > *');
    await expect(kids).toHaveCount(4);
    expect(await kids.evaluateAll((els) => els.map((e) => e.getAttribute('data-slot') ?? e.textContent))).toEqual(['One', 'Two', 'tools', 'footer']);
    await expect(page.locator('#hnr a')).toHaveCount(4);
    for (const a of await page.locator('#hnr a').all()) await expect(a).toHaveClass(/nish-nav-rail-item/);
    await expect(page.locator('#hnr [data-slot="tools"]')).toHaveClass(/nish-nav-rail-tools/);
    await expect(page.locator('#hnr [data-slot="footer"]')).toHaveClass(/nish-nav-rail-footer/);
    expect(await page.locator('#hnr > nav').getAttribute('aria-label')).toBe('Sections');
  });

  test('section-nav takes links added to the host after mount and spies on them', async ({ page }) => {
    await load(page);
    await add(
      page,
      '<div style="height:300px"></div><nish-section-nav id="hsn" sticky="false" update-hash="false"><a href="#late-a">A</a></nish-section-nav><section id="late-a" style="height:900px">A</section><section id="late-b" style="height:900px">B</section>',
    );
    await expect(page.locator('#hsn > nav.nish-subnav > a')).toHaveCount(1);
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '#late-b';
      a.textContent = 'B';
      document.getElementById('hsn')!.append(a);
    });
    await expect(page.locator('#hsn > nav.nish-subnav > a')).toHaveCount(2);
    await page.locator('#hsn a', { hasText: 'B' }).click();
    await expect(page.locator('#hsn a', { hasText: 'B' })).toHaveAttribute('aria-current', 'true');
    expect(await page.evaluate(() => document.querySelectorAll('#hsn > a').length)).toBe(0);
  });

  test('table-sort decorates a table and a header row added after mount', async ({ page }) => {
    await load(page);
    await add(page, '<nish-table-sort id="hlt"></nish-table-sort>');
    await page.evaluate(() => {
      const host = document.getElementById('hlt')!;
      host.innerHTML =
        '<table class="nish-table"><thead><tr><th data-sort="name">Name</th></tr></thead><tbody><tr><td>b</td></tr><tr><td>a</td></tr><tr><td>c</td></tr></tbody></table>';
    });
    await expect(page.locator('#hlt th[data-sort="name"] > button.nish-th-sort')).toHaveCount(1);
    await page.locator('#hlt th button').click();
    expect(await page.locator('#hlt tbody td').allTextContents()).toEqual(['a', 'b', 'c']);
    await page.evaluate(() => {
      const tr = document.querySelector('#hlt thead tr')!;
      const th = document.createElement('th');
      th.setAttribute('data-sort', 'extra');
      th.textContent = 'Extra';
      tr.append(th);
    });
    await expect(page.locator('#hlt th[data-sort="extra"] > button.nish-th-sort')).toHaveCount(1);
    // the earlier header was not wrapped twice
    await expect(page.locator('#hlt th[data-sort="name"] button')).toHaveCount(1);
    await expect(page.locator('#hlt th[data-sort="name"]')).toHaveAttribute('aria-sort', 'ascending');
  });
});

test.describe('configureStrings', () => {
  test('words change for elements already on the page and for later ones; attributes win', async ({ page }) => {
    await load(page);
    await add(
      page,
      '<nish-search id="hs1"></nish-search><nish-search id="hs2" placeholder="Mine"></nish-search><nish-nav-rail id="hbn"><a href="/x">X</a></nish-nav-rail><nish-copy-button id="hcb" value="x"></nish-copy-button>',
    );
    await expect(page.locator('#hs1 input')).toHaveAttribute('placeholder', 'Search');
    await page.evaluate(async (path) => {
      const mod = await import(path);
      mod.configureStrings({ search: 'Buscar', sections: 'Secciones', copy: 'Copiar' });
    }, STRINGS);
    await expect(page.locator('#hs1 input')).toHaveAttribute('placeholder', 'Buscar');
    await expect(page.locator('#hs2 input')).toHaveAttribute('placeholder', 'Mine');
    await expect(page.locator('#hbn nav')).toHaveAttribute('aria-label', 'Secciones');
    await expect(page.locator('#hcb button')).toContainText('Copiar');
    await page.evaluate(() => {
      const el = document.createElement('nish-search');
      el.id = 'hs3';
      document.getElementById('box')!.append(el);
    });
    await expect(page.locator('#hs3 input')).toHaveAttribute('placeholder', 'Buscar');
  });

  test('a line chart with no data uses the configured empty text', async ({ page }) => {
    await load(page);
    await page.evaluate(async (path) => {
      const mod = await import(path);
      mod.configureStrings({ noDataYet: 'Sin datos', noDataNamed: (l: string) => `${l}: sin datos` });
    }, STRINGS);
    await add(page, '<nish-line-chart label="Latencia"></nish-line-chart>');
    const empty = page.locator('#box .nish-empty');
    await expect(empty).toHaveText('Sin datos');
    await expect(empty).toHaveAttribute('aria-label', 'Latencia: sin datos');
  });
});

test.describe('command palette URLs', () => {
  test('an item with a script URL is never followed; a safe one is', async ({ page }) => {
    await load(page);
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'warning') warnings.push(m.text());
    });
    await page.evaluate(() => {
      (window as unknown as { pwned: number }).pwned = 0;
      const cp = document.createElement('nish-command-palette') as HTMLElement & { items: unknown[] };
      cp.id = 'hcp';
      cp.items = [
        { id: 'bad', label: 'Bad link', href: 'javascript:window.pwned=1' },
        { id: 'sneaky', label: 'Sneaky link', href: ' \tJaVa\nScRiPt:window.pwned=2' },
        { id: 'ok', label: 'Hash link', href: '#hardening-ok' },
      ];
      document.body.append(cp);
    });
    await page.evaluate(() => (document.getElementById('hcp') as unknown as { show(): void }).show());
    const input = page.locator('#hcp input');
    await input.fill('Bad');
    await page.keyboard.press('Enter');
    await page.evaluate(() => (document.getElementById('hcp') as unknown as { show(): void }).show());
    await input.fill('Sneaky');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as { pwned: number }).pwned)).toBe(0);
    expect(warnings.some((w) => w.includes('unsafe href'))).toBe(true);
    await page.evaluate(() => (document.getElementById('hcp') as unknown as { show(): void }).show());
    await input.fill('Hash');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#hardening-ok');
  });

  test('a child anchor with a script URL is not clicked', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (window as unknown as { pwned: number }).pwned = 0;
      const cp = document.createElement('nish-command-palette');
      cp.id = 'hcp2';
      cp.innerHTML = '<a href="javascript:window.pwned=3" data-id="js">Script anchor</a><a href="#child-ok">Child anchor</a>';
      document.body.append(cp);
    });
    await page.evaluate(() => (document.getElementById('hcp2') as unknown as { show(): void }).show());
    const input = page.locator('#hcp2 input');
    await input.fill('Script');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as { pwned: number }).pwned)).toBe(0);
    await page.evaluate(() => (document.getElementById('hcp2') as unknown as { show(): void }).show());
    await input.fill('Child');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#child-ok');
  });
});

test.describe('Trusted Types', () => {
  test('chip-group and filter-bar mount on a page that blocks innerHTML strings', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Trusted Types is Chromium-only');
    // Enforce Trusted Types with a real CSP header so every string-to-HTML sink reaches the default policy.
    // The policy records the string instead of throwing; Lit's own parsing goes through 'lit-html', which the CSP allows by name.
    await page.route('**/data.html', async (route) => {
      const res = await route.fetch();
      await route.fulfill({
        response: res,
        headers: { ...res.headers(), 'content-security-policy': "require-trusted-types-for 'script'; trusted-types default lit-html" },
      });
    });
    await page.addInitScript(() => {
      const tt = (window as unknown as { trustedTypes?: { createPolicy(n: string, o: object): unknown } }).trustedTypes;
      (window as unknown as { ttErrors: string[] }).ttErrors = [];
      tt?.createPolicy('default', {
        createHTML: (s: string) => {
          (window as unknown as { ttErrors: string[] }).ttErrors.push(s);
          return s;
        },
      });
    });
    await load(page);
    await add(page, '<nish-chip-group id="hcg"><span class="nish-chip" data-removable>Open</span></nish-chip-group>');
    await expect(page.locator('#hcg [data-nish-remove] svg path')).toHaveCount(1);
    await add(page, '<nish-filter-bar id="hfb" active-count="1"><button type="button">One</button></nish-filter-bar>');
    await expect(page.locator('#hfb .nish-filter-bar')).toHaveCount(1);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('#hfb .nish-filter-btn svg')).toHaveCount(1);
    // Enforcement is live: a plain innerHTML write must reach the default policy.
    await page.evaluate(() => {
      document.createElement('div').innerHTML = '<b>probe</b>';
    });
    const sinks = await page.evaluate(() => (window as unknown as { ttErrors: string[] }).ttErrors);
    expect(sinks).toContain('<b>probe</b>');
    // Only Lit templates (the page's own markup) may reach createHTML; none of ours is an <svg> icon string.
    expect(sinks.filter((s) => s.includes('M18 6 6 18') || s.includes('M22 3H2'))).toEqual([]);
  });
});
