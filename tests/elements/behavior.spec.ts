import { expect, test, type Page } from '@playwright/test';

// Behavior of the wave 1 elements, driven in a real browser: the theme toggle cycle, <nish-sheet>
// and <nish-dialog> (open attribute, data-*-open triggers, Escape, backdrop click, nish-close,
// focus return), <nish-bottom-nav> (aria-current on load and after history.pushState + popstate),
// toast(), and defining the bundle twice. The page is tests/elements/index.html?c=behavior.

test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

interface CloseEvent {
  type: string;
  detail?: { value?: string } | null;
  target: string;
}

async function load(page: Page, query = 'c=behavior'): Promise<void> {
  await page.goto(`http://localhost:5194/index.html?${query}`);
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
}

const events = (page: Page): Promise<CloseEvent[]> => page.evaluate(() => window.nishEvents as CloseEvent[]);

test.describe('<nish-theme-toggle>', () => {
  test('cycles system, light, dark and updates aria-label', async ({ page }) => {
    await load(page);
    const btn = page.locator('#tt button.nish-theme-btn');
    await expect(btn).toHaveAttribute('aria-label', 'Theme: System. Switch to Light');
    await expect(btn).toHaveAttribute('data-choice', 'system');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Theme: Light. Switch to Dark');
    await expect(btn).toHaveAttribute('data-choice', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Theme: Dark. Switch to System');
    await expect(btn).toHaveAttribute('data-choice', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Theme: System. Switch to Light');
    await expect(btn).toHaveAttribute('data-choice', 'system');
  });

  test('renders one button and the labelled, pill and label-* attributes', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const el = document.createElement('nish-theme-toggle');
      el.id = 'tt2';
      el.setAttribute('labelled', '');
      el.setAttribute('pill', '');
      el.setAttribute('label-system', 'Auto');
      document.getElementById('root')?.append(el);
    });
    const btn = page.locator('#tt2 button');
    await expect(page.locator('#tt2 button')).toHaveCount(1);
    await expect(btn).toHaveClass(/nish-theme-btn--labelled/);
    await expect(btn).toHaveClass(/nish-theme-btn--pill/);
    await expect(btn).toHaveAttribute('aria-label', 'Theme: Auto. Switch to Light');
    await expect(btn.locator('[data-theme-word]')).toHaveText('Auto');
  });

  test('attributes set right after append() are applied', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const el = document.createElement('nish-theme-toggle');
      el.id = 'tt4';
      document.getElementById('root')?.append(el);
      el.setAttribute('labelled', '');
      el.setAttribute('pill', '');
    });
    const btn = page.locator('#tt4 button');
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveClass(/nish-theme-btn--labelled/);
    await expect(btn).toHaveClass(/nish-theme-btn--pill/);
    await expect(btn.locator('[data-theme-word]')).toHaveCount(1);
  });

  test('a removed toggle stops listening to clicks and theme changes', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (window as unknown as { oldBtn: Element }).oldBtn = document.querySelector('#tt button') as Element;
      document.getElementById('tt')?.remove();
    });
    await page.evaluate(() => {
      const el = document.createElement('nish-theme-toggle');
      el.id = 'tt5';
      document.getElementById('root')?.append(el);
    });
    await page.locator('#tt5 button').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // The removed button did not follow the change, and clicking it no longer cycles the theme.
    const old = await page.evaluate(() => {
      const b = (window as unknown as { oldBtn: HTMLElement }).oldBtn;
      const choice = b.dataset.choice;
      b.click();
      return { choice, connected: b.isConnected, theme: document.documentElement.dataset.theme };
    });
    expect(old).toEqual({ choice: 'system', connected: false, theme: 'light' });
  });

  test('is removed cleanly on disconnect', async ({ page }) => {
    await load(page);
    await page.evaluate(() => document.getElementById('tt')?.remove());
    // The cycle keeps working for a toggle that is still on the page.
    await page.evaluate(() => {
      const el = document.createElement('nish-theme-toggle');
      el.id = 'tt3';
      document.getElementById('root')?.append(el);
    });
    await page.locator('#tt3 button').click();
    await expect(page.locator('#tt3 button')).toHaveAttribute('data-choice', 'light');
  });
});

test.describe('<nish-sheet>', () => {
  test('wraps its children in dialog.nish-sheet and opens from the open attribute', async ({ page }) => {
    await load(page);
    const dialog = page.locator('#s1 > dialog.nish-sheet');
    await expect(dialog).toHaveCount(1);
    await expect(dialog.locator('.nish-sheet-title')).toHaveText('Filters');
    await expect(dialog).not.toHaveAttribute('open', '');
    await page.evaluate(() => document.getElementById('s1')?.setAttribute('open', ''));
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
    await page.evaluate(() => document.getElementById('s1')?.removeAttribute('open'));
    await expect(dialog).toBeHidden();
    // nish-close comes from the dialog's close event, a task after it is hidden: poll.
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: null, target: 's1' }]);
  });

  test('opens in .show() and closes in .close()', async ({ page }) => {
    await load(page);
    const dialog = page.locator('#s1 > dialog');
    await page.evaluate(() => (document.getElementById('s1') as unknown as { show(): void }).show());
    await expect(dialog).toBeVisible();
    await expect(page.locator('#s1')).toHaveAttribute('open', '');
    await page.evaluate(() => (document.getElementById('s1') as unknown as { close(): void }).close());
    await expect(dialog).toBeHidden();
    await expect(page.locator('#s1')).not.toHaveAttribute('open', '');
  });

  test.describe('with motion', () => {
    test.use({ reducedMotion: 'no-preference' });
    test('show() during the close animation reopens the sheet instead of being dropped', async ({ page }) => {
      await load(page);
      const dialog = page.locator('#s1 > dialog');
      await page.evaluate(() => (document.getElementById('s1') as unknown as { show(): void }).show());
      await expect(dialog).toBeVisible();
      await page.evaluate(() => {
        const s = document.getElementById('s1') as unknown as { close(): void; show(): void };
        s.close();
        s.show(); // inside the 260 ms close animation
      });
      await page.waitForTimeout(500);
      await expect(page.locator('#s1')).toHaveAttribute('open', '');
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((d) => (d as HTMLDialogElement).open)).toBe(true);
    });
  });

  test('a document that has the open attribute at load shows the sheet', async ({ page }) => {
    await load(page, 'c=sheet');
    await expect(page.locator('dialog.nish-sheet')).toBeVisible();
    await expect(page.locator('dialog.nish-sheet')).toHaveAttribute('aria-labelledby', /.+/);
  });

  test('label sets aria-label when there is no title', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const s = document.createElement('nish-sheet');
      s.setAttribute('label', 'Quick actions');
      s.innerHTML = '<div class="nish-sheet-body">Body only</div>';
      document.getElementById('root')?.append(s);
    });
    await expect(page.locator('nish-sheet[label="Quick actions"] > dialog')).toHaveAttribute('aria-label', 'Quick actions');
  });

  test('data-sheet-open opens it, Escape closes it and focus returns to the opener', async ({ page }) => {
    await load(page);
    const opener = page.locator('#open-sheet');
    await opener.click();
    await expect(page.locator('#s1 > dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#s1 > dialog')).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('#s1')).not.toHaveAttribute('open', '');
    // nish-close comes from the dialog's close event, a task after it is hidden: poll.
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: null, target: 's1' }]);
  });

  test('a backdrop click closes it', async ({ page }) => {
    await load(page);
    await page.locator('#open-sheet').click();
    await expect(page.locator('#s1 > dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.locator('#s1 > dialog')).toBeHidden();
    await expect(page.locator('#open-sheet')).toBeFocused();
    await expect.poll(async () => (await events(page)).map((e) => e.target)).toEqual(['s1']);
  });

  test('[data-sheet-close] closes it and a click inside does not', async ({ page }) => {
    await load(page);
    await page.locator('#open-sheet').click();
    await page.locator('#s1 .nish-sheet-body p').click();
    await expect(page.locator('#s1 > dialog')).toBeVisible();
    await page.locator('#sheet-apply').click();
    await expect(page.locator('#s1 > dialog')).toBeHidden();
    await expect(page.locator('#open-sheet')).toBeFocused();
  });

  test('removing an open sheet closes it', async ({ page }) => {
    await load(page, 'c=sheet');
    await expect(page.locator('dialog.nish-sheet')).toBeVisible();
    await page.evaluate(() => document.querySelector('nish-sheet')?.remove());
    await expect(page.locator('dialog')).toHaveCount(0);
    // The page is not left inert or locked.
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  });

  test('moving an open sheet to another parent closes it once', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const np = document.createElement('div');
      np.id = 'newparent';
      document.body.append(np);
      document.getElementById('s1')?.setAttribute('open', '');
    });
    await expect(page.locator('#s1 > dialog')).toBeVisible();
    await page.evaluate(() => document.getElementById('newparent')?.append(document.getElementById('s1') as Element));
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: null, target: 's1' }]);
    const state = await page.evaluate(() => {
      const h = document.getElementById('s1') as unknown as { open: boolean; dialog: HTMLDialogElement };
      return { open: h.open, dialogOpen: h.dialog.open };
    });
    expect(state).toEqual({ open: false, dialogOpen: false });
  });
});

test.describe('<nish-dialog>', () => {
  test('wraps its children in dialog.nish-dialog and opens from the open attribute', async ({ page }) => {
    await load(page);
    const dialog = page.locator('#d1 > dialog.nish-dialog');
    await expect(dialog).toHaveCount(1);
    await expect(dialog).not.toHaveAttribute('open', '');
    await page.evaluate(() => document.getElementById('d1')?.setAttribute('open', ''));
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
    await expect(dialog).toHaveAttribute('aria-describedby', /.+/);
    await page.evaluate(() => document.getElementById('d1')?.removeAttribute('open'));
    await expect(dialog).toBeHidden();
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: { value: '' }, target: 'd1' }]);
  });

  test('is modal: the page behind it is inert', async ({ page }) => {
    await load(page);
    await page.locator('#open-dialog').click();
    const open = await page.evaluate(() => (document.querySelector('#d1 > dialog') as HTMLDialogElement).matches(':modal'));
    expect(open).toBe(true);
  });

  test('data-dialog-open opens it, Escape closes it with an empty value and focus returns', async ({ page }) => {
    await load(page);
    const opener = page.locator('#open-dialog');
    await opener.click();
    await expect(page.locator('#d1 > dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#d1 > dialog')).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('#d1')).not.toHaveAttribute('open', '');
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: { value: '' }, target: 'd1' }]);
  });

  test('a backdrop click closes it with an empty value', async ({ page }) => {
    await load(page);
    await page.locator('#open-dialog').click();
    await expect(page.locator('#d1 > dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.locator('#d1 > dialog')).toBeHidden();
    await expect(page.locator('#open-dialog')).toBeFocused();
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: { value: '' }, target: 'd1' }]);
  });

  test('a click inside does not close it', async ({ page }) => {
    await load(page);
    await page.locator('#open-dialog').click();
    await page.locator('#d1 .nish-dialog-body').click();
    await expect(page.locator('#d1 > dialog')).toBeVisible();
  });

  test('[data-dialog-close] closes it and nish-close carries the button value', async ({ page }) => {
    await load(page);
    await page.locator('#open-dialog').click();
    await page.locator('#dlg-ok').click();
    await expect(page.locator('#d1 > dialog')).toBeHidden();
    await expect(page.locator('#open-dialog')).toBeFocused();

    await page.locator('#open-dialog').click();
    await page.locator('#dlg-cancel').click();
    await expect(page.locator('#d1 > dialog')).toBeHidden();

    await page.locator('#open-dialog').click();
    await page.locator('#dlg-plain').click();
    await expect(page.locator('#d1 > dialog')).toBeHidden();

    await expect.poll(async () => (await events(page)).map((e) => e.detail?.value)).toEqual(['discard', 'cancel', '']);
  });

  test('a document that has the open attribute at load shows the dialog', async ({ page }) => {
    await load(page, 'c=dialog');
    await expect(page.locator('dialog.nish-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.nish-dialog')).toBeHidden();
  });

  test('removing an open dialog closes it', async ({ page }) => {
    await load(page, 'c=dialog');
    await expect(page.locator('dialog.nish-dialog')).toBeVisible();
    await page.evaluate(() => document.querySelector('nish-dialog')?.remove());
    await expect(page.locator('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.querySelector(':modal'))).toBeNull();
  });

  test('moving an open dialog to another parent closes it once', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const np = document.createElement('div');
      np.id = 'newparent';
      document.body.append(np);
      document.getElementById('d1')?.setAttribute('open', '');
    });
    await expect(page.locator('#d1 > dialog')).toBeVisible();
    await page.evaluate(() => document.getElementById('newparent')?.append(document.getElementById('d1') as Element));
    await expect.poll(() => events(page)).toEqual([{ type: 'nish-close', detail: { value: '' }, target: 'd1' }]);
    const state = await page.evaluate(() => {
      const h = document.getElementById('d1') as unknown as { open: boolean; dialog: HTMLDialogElement };
      return { open: h.open, dialogOpen: h.dialog.open };
    });
    expect(state).toEqual({ open: false, dialogOpen: false });
  });
});

test.describe('<nish-bottom-nav>', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  const current = (page: Page): Promise<string | null> =>
    page.evaluate(() => document.querySelector('nish-bottom-nav a[aria-current="page"]')?.getAttribute('href') ?? null);

  test('wraps its links in nav.nish-bottom-nav and marks the current one on load', async ({ page }) => {
    await load(page);
    const nav = page.locator('nish-bottom-nav > nav.nish-bottom-nav');
    await expect(nav).toHaveAttribute('aria-label', 'Sections');
    await expect(nav.locator('a.nish-bottom-nav-item')).toHaveCount(3);
    expect(await current(page)).toBe('/home');
    await expect(page.locator('nish-bottom-nav a[aria-current="page"]')).toHaveCount(1);
  });

  test('follows history.pushState and popstate', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      history.pushState(null, '', '/lists');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBe('/lists');
    await page.evaluate(() => {
      history.pushState(null, '', '/settings/profile');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBe('/settings');
    // Back: the real popstate.
    await page.goBack();
    await expect.poll(() => current(page)).toBe('/lists');
    await page.goBack();
    await expect.poll(() => current(page)).toBe('/home');
  });

  test('no link is current when no path matches', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      history.pushState(null, '', '/elsewhere');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBeNull();
  });

  test('"/" matches only "/", and the longest prefix wins', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const nav = document.querySelector('nish-bottom-nav nav') as HTMLElement;
      nav.insertAdjacentHTML('afterbegin', '<a href="/">Root</a>');
      nav.insertAdjacentHTML('beforeend', '<a href="/home/deep">Deep</a>');
      history.pushState(null, '', '/home/deeper');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    // /home/deeper is under /home, not under /home/deep ("deeper" is not a path segment of it).
    await expect.poll(() => current(page)).toBe('/home');
    await page.evaluate(() => {
      history.pushState(null, '', '/home/deep/x');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBe('/home/deep');
    await page.evaluate(() => {
      history.pushState(null, '', '/');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBe('/');
    await page.evaluate(() => {
      history.pushState(null, '', '/nowhere');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect.poll(() => current(page)).toBeNull();
  });

  test('writes its height to --nish-bottom-nav-h', async ({ page }) => {
    await load(page);
    const h = await page.evaluate(() => document.documentElement.style.getPropertyValue('--nish-bottom-nav-h'));
    const height = await page.evaluate(() => (document.querySelector('nav.nish-bottom-nav') as HTMLElement).offsetHeight);
    expect(height).toBeGreaterThan(0);
    expect(h).toBe(`${height}px`);
  });

  test('removing it clears --nish-bottom-nav-h and stops following popstate', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page);
    const hasVar = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--nish-bottom-nav-h') !== '');
    expect(await hasVar()).toBe(true);
    const host = await page.evaluate(() => {
      const el = document.querySelector('nish-bottom-nav') as HTMLElement;
      (window as unknown as { oldLinks: Element[] }).oldLinks = [...el.querySelectorAll('a')];
      el.remove();
      history.pushState(null, '', '/lists');
      dispatchEvent(new PopStateEvent('popstate'));
      return true;
    });
    expect(host).toBe(true);
    expect(await hasVar()).toBe(false);
    const marked = await page.evaluate(() =>
      (window as unknown as { oldLinks: Element[] }).oldLinks.filter((a) => a.hasAttribute('aria-current')).map((a) => a.getAttribute('href')),
    );
    // Only the link that was current when it was removed keeps its mark; /lists did not get one.
    expect(marked).not.toContain('/lists');
    expect(errors).toEqual([]);
  });

  test('label and lg attributes', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const el = document.querySelector('nish-bottom-nav') as HTMLElement;
      el.setAttribute('label', 'Main');
      el.setAttribute('lg', '');
    });
    const nav = page.locator('nish-bottom-nav > nav');
    await expect(nav).toHaveAttribute('aria-label', 'Main');
    await expect(nav).toHaveClass(/nish-bottom-nav--lg/);
  });
});

test.describe('toast()', () => {
  test('shows one toast in a polite status region', async ({ page }) => {
    await load(page);
    await page.locator('#toast-btn').click();
    const toast = page.locator('.nish-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Saved to the harness');
    await expect(page.locator('.nish-toast-region')).toHaveAttribute('role', 'status');
    await expect(page.locator('.nish-toast-region')).toHaveAttribute('aria-live', 'polite');
    await toast.getByRole('button', { name: 'Dismiss' }).click();
    await expect(toast).toHaveCount(0);
  });

  test('text is never parsed as HTML, and a tone sets the class', async ({ page }) => {
    await load(page);
    await page.evaluate(() => window.toast('<img src=x onerror="window.__xss=1">', { tone: 'warn', duration: 'sticky' }));
    const toast = page.locator('.nish-toast');
    await expect(toast).toHaveClass(/nish-toast--warn/);
    await expect(toast.locator('img')).toHaveCount(0);
    await expect(toast).toContainText('<img src=x');
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});

test.describe('upgrade', () => {
  // Markup that exists before the bundle loads: the parser creates plain HTMLElements and the
  // bundle upgrades them. The page and the built bundle are served by routes, so nothing in the
  // harness imports the elements first.
  const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>upgrade</title>
<link rel="stylesheet" href="/upgrade.css"></head><body>
<nish-sheet id="us" open><h2 class="nish-sheet-title">Early sheet</h2><div class="nish-sheet-body"><button id="child" type="button">Child</button></div></nish-sheet>
<nish-dialog id="ud" open><h2 class="nish-dialog-title">Early dialog</h2><div class="nish-dialog-body">Body</div></nish-dialog>
<script type="module">
  window.before = { sheet: customElements.get('nish-sheet') === undefined, dialog: customElements.get('nish-dialog') === undefined };
  const child = document.getElementById('child');
  window.child = child;
  child.expando = 'kept';
  window.clicks = 0;
  child.addEventListener('click', () => { window.clicks += 1; });
  await import('/upgrade.js');
  await customElements.whenDefined('nish-sheet');
  await customElements.whenDefined('nish-dialog');
  document.documentElement.dataset.ready = '1';
</script></body></html>`;

  async function loadUpgrade(page: Page): Promise<void> {
    const fs = await import('node:fs');
    const dist = (f: string) => fs.readFileSync(new URL(`../../dist/${f}`, import.meta.url));
    await page.route('**/upgrade.html', (r) => r.fulfill({ contentType: 'text/html', body: PAGE }));
    await page.route('**/upgrade.js', (r) => r.fulfill({ contentType: 'text/javascript', body: dist('elements.js') }));
    await page.route('**/upgrade.css', (r) =>
      r.fulfill({ contentType: 'text/css', body: Buffer.concat([dist('nish.css'), Buffer.from('\n'), dist('nish-components.css')]) }),
    );
    await page.goto('http://localhost:5194/upgrade.html');
    await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
  }

  test('elements that exist before the bundle loads upgrade and show their open state', async ({ page }) => {
    await loadUpgrade(page);
    expect(await page.evaluate(() => (window as unknown as { before: unknown }).before)).toEqual({ sheet: true, dialog: true });
    await expect(page.locator('#us > dialog.nish-sheet')).toBeVisible();
    await expect(page.locator('#ud > dialog.nish-dialog')).toBeVisible();
    await expect(page.locator('#us > dialog')).toHaveAttribute('aria-labelledby', /.+/);
    await expect(page.locator('#ud > dialog')).toHaveAttribute('aria-labelledby', /.+/);
  });

  test('light DOM children are moved into the dialog, not copied', async ({ page }) => {
    await loadUpgrade(page);
    const r = await page.evaluate(() => {
      const w = window as unknown as { child: HTMLElement & { expando?: string }; clicks: number };
      const now = document.getElementById('child') as HTMLElement & { expando?: string };
      const inside = now.closest('dialog') !== null && now.parentElement?.closest('nish-sheet')?.id === 'us';
      now.click();
      return { same: now === w.child, expando: now.expando, inside, count: document.querySelectorAll('#child').length, clicks: w.clicks };
    });
    expect(r).toEqual({ same: true, expando: 'kept', inside: true, count: 1, clicks: 1 });
  });
});

test.describe('the bundle', () => {
  test('defining the tags a second time does not throw or replace them', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page);
    const before = await page.evaluate(() => ['nish-theme-toggle', 'nish-sheet', 'nish-dialog', 'nish-bottom-nav'].map((t) => customElements.get(t)?.name));
    const threw = await page.evaluate(async () => {
      try {
        await window.loadBundle();
        return null;
      } catch (e) {
        return String(e);
      }
    });
    expect(threw).toBeNull();
    const same = await page.evaluate(
      (names) => ['nish-theme-toggle', 'nish-sheet', 'nish-dialog', 'nish-bottom-nav'].map((t) => customElements.get(t)?.name === names.shift()),
      [...before],
    );
    expect(same).toEqual([true, true, true, true]);
    expect(errors).toEqual([]);
  });
});
