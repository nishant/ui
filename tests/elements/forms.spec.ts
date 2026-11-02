import { expect, test, type Locator, type Page } from '@playwright/test';

// Behavior of the wave 2 elements in a real browser: <nish-field>, <nish-search>, <nish-switch>,
// <nish-chip-group>, <nish-combobox>, <nish-tabs>, <nish-segmented>, <nish-copy-button> and
// <nish-sparkline>. The page is tests/elements/forms.html (static markup, forms.ts records events).

test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

interface Ev {
  type: string;
  detail?: Record<string, unknown> | null;
  target: string;
  t: number;
}

async function load(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __copied: string[]; __clipFail: boolean };
    w.__copied = [];
    w.__clipFail = false;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (w.__clipFail) throw new Error('denied');
          w.__copied.push(text);
        },
      },
    });
  });
  await page.goto('http://localhost:5194/forms.html');
  await page.locator('html[data-ready="1"]').waitFor({ state: 'attached' });
}

const events = (page: Page, type?: string, target?: string): Promise<Ev[]> =>
  page.evaluate(
    ([t, id]) => (window.nishEvents as Ev[]).filter((e) => (!t || e.type === t) && (!id || e.target === id)),
    [type, target] as [string | undefined, string | undefined],
  );

const clearEvents = (page: Page): Promise<void> => page.evaluate(() => void (window.nishEvents.length = 0));

const formEntries = (page: Page): Promise<[string, string][]> =>
  page.evaluate(() => Array.from(new FormData(document.getElementById('form') as HTMLFormElement).entries()) as [string, string][]);

test.describe('<nish-field>', () => {
  test('wires id, label for, hint and aria-describedby', async ({ page }) => {
    await load(page);
    const input = page.locator('#f-hint input');
    const label = page.locator('#f-hint label.nish-field-label');
    const id = await input.getAttribute('id');
    expect(id).toBeTruthy();
    await expect(label).toHaveText('Email');
    await expect(label).toHaveAttribute('for', id!);
    await expect(page.locator('#f-hint > div.nish-field')).toHaveCount(1);
    const hint = page.locator('#f-hint small.nish-hint');
    await expect(hint).toHaveText('We never share it');
    await expect(input).toHaveAttribute('aria-describedby', (await hint.getAttribute('id'))!);
    await expect(input).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('an error replaces the hint, sets aria-invalid and goes away again', async ({ page }) => {
    await load(page);
    const input = page.locator('#f-hint input');
    await page.evaluate(() => document.getElementById('f-hint')?.setAttribute('error', 'Enter a valid email'));
    const error = page.locator('#f-hint small.nish-error');
    await expect(error).toHaveText('Enter a valid email');
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(page.locator('#f-hint small.nish-hint')).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', (await error.getAttribute('id'))!);

    await page.evaluate(() => document.getElementById('f-hint')?.removeAttribute('error'));
    await expect(page.locator('#f-hint small.nish-error')).toHaveCount(0);
    await expect(page.locator('#f-hint small.nish-hint')).toHaveText('We never share it');
    await expect(input).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(input).toHaveAttribute('aria-describedby', (await page.locator('#f-hint small.nish-hint').getAttribute('id'))!);
  });

  test('keeps an existing id and describedby, adds Optional and the inline layout', async ({ page }) => {
    await load(page);
    const input = page.locator('#nick');
    await expect(input).toHaveAttribute('id', 'nick');
    await expect(page.locator('#f-opt label.nish-field-label')).toHaveAttribute('for', 'nick');
    await expect(page.locator('#f-opt .nish-optional')).toHaveText('Optional');
    await expect(page.locator('#f-opt > div.nish-field')).toHaveClass(/nish-field--inline/);
    expect(await page.locator('#f-opt > div.nish-field').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--nish-field-label-w'))).toBe('7rem');
    // Without a hint the author's describedby stays as it was.
    await expect(input).toHaveAttribute('aria-describedby', 'nick-note');
    await page.evaluate(() => document.getElementById('f-opt')?.setAttribute('error', 'Too long'));
    const errorId = (await page.locator('#f-opt small.nish-error').getAttribute('id'))!;
    await expect(input).toHaveAttribute('aria-describedby', `nick-note ${errorId}`);
  });

  test('a child nish-combobox or nish-search gets the id on its inner input', async ({ page }) => {
    await load(page);
    for (const [field, host] of [
      ['f-cb', 'cb-field'],
      ['f-search', 's-field'],
    ]) {
      const input = page.locator(`#${host} input`).first();
      await expect(input).toHaveAttribute('id', /.+/);
      const id = (await input.getAttribute('id'))!;
      await expect(page.locator(`#${field} label.nish-field-label`)).toHaveAttribute('for', id);
    }
    const cbInput = page.locator('#cb-field input[role="combobox"]');
    await expect(cbInput).toHaveAttribute('aria-describedby', (await page.locator('#f-cb small.nish-hint').getAttribute('id'))!);
    await page.evaluate(() => document.getElementById('f-cb')?.setAttribute('error', 'Required'));
    await expect(cbInput).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#f-cb label.nish-field-label').click();
    await expect(cbInput).toBeFocused();
  });

  test('wires a control that is added after the field is connected', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const field = document.createElement('nish-field');
      field.id = 'late';
      field.setAttribute('label', 'Late');
      field.setAttribute('hint', 'Added later');
      document.getElementById('root')?.append(field);
      setTimeout(() => {
        const input = document.createElement('input');
        input.className = 'nish-input';
        field.append(input);
      }, 100);
    });
    const input = page.locator('#late input');
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('id', /.+/);
    const id = (await input.getAttribute('id'))!;
    await expect(page.locator('#late label.nish-field-label')).toHaveAttribute('for', id);
    await expect(input).toHaveAttribute('aria-describedby', /.+/);
    await expect(page.locator('#late small.nish-hint')).toHaveText('Added later');
  });

  test('wraps children that were added before the element was connected', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const field = document.createElement('nish-field');
      field.id = 'pre';
      field.setAttribute('label', 'Pre');
      const input = document.createElement('input');
      input.className = 'nish-input';
      field.append(input);
      document.getElementById('root')?.append(field);
    });
    await expect(page.locator('#pre > div.nish-field > input')).toHaveCount(1);
    await expect(page.locator('#pre label.nish-field-label')).toHaveAttribute('for', (await page.locator('#pre input').getAttribute('id'))!);
  });
});

test.describe('<nish-search>', () => {
  test('typing fires input and nish-input; Clear empties it and keeps focus', async ({ page }) => {
    await load(page);
    const input = page.locator('#s1 input');
    await expect(input).toHaveAttribute('aria-label', 'Search');
    await expect(input).toHaveAttribute('placeholder', 'Search jobs');
    await expect(input).toHaveAttribute('name', 'q');
    await expect(page.locator('#s1 button[aria-label="Clear"]')).toHaveCount(0);

    await input.click();
    await page.keyboard.type('abc');
    expect(await page.evaluate(() => (document.getElementById('s1') as HTMLElement & { value: string }).value)).toBe('abc');
    const nishInputs = await events(page, 'nish-input', 's1');
    expect(nishInputs.map((e) => e.detail?.value)).toEqual(['a', 'ab', 'abc']);
    expect((await events(page, 'input')).length).toBeGreaterThanOrEqual(3);

    await clearEvents(page);
    const clear = page.locator('#s1 button[aria-label="Clear"]');
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(clear).toHaveCount(0);
    expect((await events(page, 'nish-input', 's1')).map((e) => e.detail?.value)).toEqual(['']);
    expect(await events(page, 'nish-clear', 's1')).toHaveLength(1);
  });

  test('Escape clears while there is text and does nothing when empty', async ({ page }) => {
    await load(page);
    const input = page.locator('#s1 input');
    await input.click();
    await page.keyboard.type('xy');
    await clearEvents(page);
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    expect(await events(page, 'nish-clear', 's1')).toHaveLength(1);
    await page.keyboard.press('Escape');
    expect(await events(page, 'nish-clear', 's1')).toHaveLength(1);
  });

  test('the value property reads and writes, and the label attribute names the input', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const s = document.getElementById('s1') as HTMLElement & { value: string };
      s.value = 'written';
      s.setAttribute('label', 'Search jobs');
    });
    await expect(page.locator('#s1 input')).toHaveValue('written');
    await expect(page.locator('#s1 input')).toHaveAttribute('aria-label', 'Search jobs');
    await expect(page.locator('#s1 button[aria-label="Clear"]')).toBeVisible();
    expect(await formEntries(page)).toContainEqual(['q', 'written']);
  });
});

test.describe('<nish-switch>', () => {
  test('click toggles checked, fires change and nish-change, and drives the hidden input', async ({ page }) => {
    await load(page);
    const sw = page.locator('#sw1');
    const button = sw.locator('button[role="switch"]');
    await expect(button).toHaveAttribute('aria-checked', 'false');
    await expect(button).toHaveAttribute('aria-labelledby', /.+/);
    await expect(button).toHaveAttribute('aria-describedby', /.+/);
    expect((await formEntries(page)).some(([k]) => k === 'alerts')).toBe(false);

    await button.click();
    await expect(button).toHaveAttribute('aria-checked', 'true');
    await expect(sw).toHaveAttribute('checked', '');
    expect(await events(page, 'change', 'sw1')).toHaveLength(1);
    expect((await events(page, 'nish-change', 'sw1'))[0].detail).toEqual({ checked: true });
    expect(await formEntries(page)).toContainEqual(['alerts', 'on']);

    await button.click();
    await expect(button).toHaveAttribute('aria-checked', 'false');
    await expect(sw).not.toHaveAttribute('checked', /.*/);
    expect((await events(page, 'nish-change', 'sw1')).map((e) => e.detail?.checked)).toEqual([true, false]);
    expect((await formEntries(page)).some(([k]) => k === 'alerts')).toBe(false);
  });

  test('Space and Enter toggle it', async ({ page }) => {
    await load(page);
    const button = page.locator('#sw1 button[role="switch"]');
    await button.focus();
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-checked', 'false');
    expect(await events(page, 'nish-change', 'sw1')).toHaveLength(2);
  });

  test('the label text toggles it, a disabled switch does not, and the checked attribute works', async ({ page }) => {
    await load(page);
    await page.locator('#sw1').getByText('Alerts', { exact: true }).click();
    await expect(page.locator('#sw1 button')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#sw2 button')).toBeDisabled();
    await page.locator('#sw2').getByText('Locked').click({ force: true });
    await expect(page.locator('#sw2 button')).toHaveAttribute('aria-checked', 'false');
    expect(await events(page, 'nish-change', 'sw2')).toHaveLength(0);
    await page.evaluate(() => document.getElementById('sw2')?.setAttribute('checked', ''));
    await expect(page.locator('#sw2 button')).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('<nish-chip-group>', () => {
  test('wraps the buttons in a labelled group and toggles them independently', async ({ page }) => {
    await load(page);
    const group = page.locator('#cg-multi > div.nish-chips');
    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('aria-label', 'Status');
    const chips = group.locator('button.nish-chip');
    await expect(chips).toHaveCount(3);
    await expect(chips.first()).toHaveAttribute('type', 'button');
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'false');

    await chips.nth(0).click();
    await chips.nth(1).click();
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    // The value attribute wins; a chip without one reports its text.
    expect((await events(page, 'nish-change', 'cg-multi')).pop()?.detail).toEqual({ values: ['open', 'Closed'] });
    await chips.nth(0).click();
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'false');
    expect((await events(page, 'nish-change', 'cg-multi')).pop()?.detail).toEqual({ values: ['Closed'] });
  });

  test('single keeps at most one pressed', async ({ page }) => {
    await load(page);
    const chips = page.locator('#cg-single button.nish-chip');
    await chips.nth(0).click();
    await chips.nth(2).click();
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(chips.nth(2)).toHaveAttribute('aria-pressed', 'true');
    expect((await events(page, 'nish-change', 'cg-single')).pop()?.detail).toEqual({ values: ['month'] });
    await chips.nth(2).click();
    expect((await events(page, 'nish-change', 'cg-single')).pop()?.detail).toEqual({ values: [] });
  });

  test('the values property reads and writes', async ({ page }) => {
    await load(page);
    const read = (id: string): Promise<string[]> =>
      page.evaluate((i) => (document.getElementById(i) as HTMLElement & { values: string[] }).values, id);
    await page.evaluate(() => {
      (document.getElementById('cg-multi') as HTMLElement & { values: string[] }).values = ['all', 'Closed'];
      (document.getElementById('cg-single') as HTMLElement & { values: string[] }).values = ['day', 'week'];
    });
    expect(await read('cg-multi')).toEqual(['Closed', 'all']);
    await expect(page.locator('#cg-multi button').nth(2)).toHaveAttribute('aria-pressed', 'true');
    expect(await read('cg-single')).toEqual(['day']);
    await page.evaluate(() => {
      (document.getElementById('cg-multi') as HTMLElement & { values: string[] }).values = [];
    });
    expect(await read('cg-multi')).toEqual([]);
  });

  test('a removable chip gets a remove button that removes it and fires nish-remove', async ({ page }) => {
    await load(page);
    const remove = page.getByRole('button', { name: 'Remove Draft' });
    await expect(remove).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Remove Review' })).toHaveCount(1);
    await remove.click();
    await expect(page.locator('#cg-remove .nish-chip')).toHaveCount(1);
    await expect(page.locator('#cg-remove')).not.toContainText('Draft');
    expect((await events(page, 'nish-remove', 'cg-remove'))[0].detail).toEqual({ value: 'Draft' });
  });
});

test.describe('<nish-combobox>', () => {
  const list = (page: Page, id = 'cb1'): Locator => page.locator(`#${id} ul[role="listbox"]`);
  const options = (page: Page, id = 'cb1'): Locator => page.locator(`#${id} li[role="option"]`);
  const input = (page: Page, id = 'cb1'): Locator => page.locator(`#${id} input[role="combobox"]`);

  test('renders from child options, opens on focus and names the list', async ({ page }) => {
    await load(page);
    await expect(page.locator('#cb1 > option')).toHaveCount(0);
    await expect(list(page)).toHaveCount(0);
    await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(input(page)).toHaveAttribute('aria-label', 'Fruit');
    await input(page).click();
    await expect(list(page)).toBeVisible();
    await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(input(page)).toHaveAttribute('aria-controls', (await list(page).getAttribute('id'))!);
    await expect(options(page)).toHaveCount(5);
    await expect(options(page).nth(2).locator('.nish-combobox-hint')).toHaveText('red');
  });

  test('ArrowDown/Up, Home/End move the active option and Enter commits it', async ({ page }) => {
    await load(page);
    const cb = input(page);
    await cb.click();
    const active = async (): Promise<string | null> => {
      const id = await cb.getAttribute('aria-activedescendant');
      return id ? page.locator(`[id="${id}"]`).textContent() : null;
    };
    expect(await active()).toBeNull();
    await page.keyboard.press('ArrowDown');
    expect(await active()).toContain('Apple');
    await page.keyboard.press('ArrowDown');
    expect(await active()).toContain('Banana');
    await page.keyboard.press('End');
    expect(await active()).toContain('Elderberry');
    await page.keyboard.press('ArrowDown');
    expect(await active()).toContain('Apple');
    await page.keyboard.press('ArrowUp');
    expect(await active()).toContain('Elderberry');
    await page.keyboard.press('Home');
    expect(await active()).toContain('Apple');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await clearEvents(page);
    await page.keyboard.press('Enter');

    await expect(list(page)).toHaveCount(0);
    await expect(cb).toHaveValue('Cherry');
    await expect(cb).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#cb1')).toHaveAttribute('value', 'cherry');
    expect(await events(page, 'change', 'cb1')).toHaveLength(1);
    const change = await events(page, 'nish-change', 'cb1');
    expect(change).toHaveLength(1);
    expect(change[0].detail).toMatchObject({ value: 'cherry', option: { value: 'cherry', label: 'Cherry', hint: 'red' } });
    await expect(page.locator('#cb1 button[aria-label="Clear"]')).toBeVisible();
  });

  test('Escape closes the list; a second Escape drops the typed text', async ({ page }) => {
    await load(page);
    const cb = input(page, 'cb3');
    await cb.click();
    await page.keyboard.type('gr');
    await expect(options(page, 'cb3')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(list(page, 'cb3')).toHaveCount(0);
    await expect(cb).toHaveValue('gr');
    await page.keyboard.press('Escape');
    await expect(cb).toHaveValue('');
    expect(await events(page, 'nish-change', 'cb3')).toHaveLength(0);
  });

  test('an Escape that closes the list does not reach the page behind', async ({ page }) => {
    await load(page);
    await input(page).click();
    await page.evaluate(() => {
      const w = window as unknown as { escSeen: number };
      w.escSeen = 0;
      document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') w.escSeen++;
      });
    });
    await page.keyboard.press('Escape');
    await expect(list(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { escSeen: number }).escSeen)).toBe(0);
  });

  test('typing filters on label and hint, case-insensitively; no match shows empty-text', async ({ page }) => {
    await load(page);
    const cb = input(page);
    await cb.click();
    await page.keyboard.type('AN');
    await expect(options(page)).toHaveText(['Banana']);
    await cb.fill('');
    await page.keyboard.type('red');
    await expect(options(page)).toHaveText(['Cherryred']);
    await cb.fill('zzz');
    await expect(options(page)).toHaveCount(0);
    await expect(page.locator('#cb1 .nish-combobox-empty')).toHaveText('No matches');

    const custom = input(page, 'cb2');
    await custom.click();
    await page.keyboard.type('zzz');
    await expect(page.locator('#cb2 .nish-combobox-empty')).toHaveText('Nothing here');
  });

  test('without allow-custom Enter commits the first match; text that matches nothing is dropped on blur', async ({ page }) => {
    await load(page);
    const cb = input(page, 'cb3');
    await cb.click();
    await page.keyboard.type('bl');
    await page.keyboard.press('Enter');
    await expect(cb).toHaveValue('Blue');
    await expect(page.locator('#cb3')).toHaveAttribute('value', 'blue');

    await cb.fill('qqq');
    await page.locator('#root').click({ position: { x: 5, y: 5 } });
    await expect(cb).toHaveValue('Blue');
    await expect(page.locator('#cb3')).toHaveAttribute('value', 'blue');
  });

  test('allow-custom commits the typed text', async ({ page }) => {
    await load(page);
    const cb = input(page, 'cb2');
    await cb.click();
    await page.keyboard.type('Kiwi');
    await page.keyboard.press('Enter');
    await expect(page.locator('#cb2')).toHaveAttribute('value', 'Kiwi');
    const change = (await events(page, 'nish-change', 'cb2'))[0];
    expect(change.detail).toEqual({ value: 'Kiwi', option: null });

    // Typed text equal to an option label commits that option.
    await cb.fill('blue');
    await page.keyboard.press('Enter');
    expect((await events(page, 'nish-change', 'cb2')).pop()?.detail).toMatchObject({ value: 'blue', option: { label: 'Blue' } });
  });

  test('Clear and an emptied input commit null', async ({ page }) => {
    await load(page);
    const cb = input(page);
    await cb.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#cb1')).toHaveAttribute('value', 'apple');
    await clearEvents(page);
    await page.locator('#cb1 button[aria-label="Clear"]').click();
    await expect(cb).toHaveValue('');
    await expect(cb).toBeFocused();
    expect(await events(page, 'change', 'cb1')).toHaveLength(1);
    expect((await events(page, 'nish-change', 'cb1'))[0].detail).toEqual({ value: null, option: null });

    await cb.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await clearEvents(page);
    await cb.fill('');
    await page.keyboard.press('Enter');
    expect((await events(page, 'nish-change', 'cb1'))[0].detail).toEqual({ value: null, option: null });
  });

  test('nish-query is debounced to one event with the last text', async ({ page }) => {
    await load(page);
    await input(page).click();
    await clearEvents(page);
    await page.keyboard.type('che', { delay: 20 });
    expect(await events(page, 'nish-query', 'cb1')).toHaveLength(0);
    await expect.poll(async () => (await events(page, 'nish-query', 'cb1')).length, { timeout: 2000 }).toBe(1);
    const [q] = await events(page, 'nish-query', 'cb1');
    expect(q.detail).toEqual({ query: 'che' });
    await page.waitForTimeout(400);
    expect(await events(page, 'nish-query', 'cb1')).toHaveLength(1);
  });

  test('loading shows a Searching row with a spinner; the options property replaces the list', async ({ page }) => {
    await load(page);
    await input(page).click();
    await page.keyboard.type('x');
    await page.evaluate(() => {
      const cb = document.getElementById('cb1') as HTMLElement & { loading: boolean; filter: unknown };
      cb.filter = () => true;
      cb.loading = true;
    });
    const row = page.locator('#cb1 .nish-combobox-loading');
    await expect(row).toHaveText('Searching…');
    await expect(row.locator('.nish-spinner')).toHaveCount(1);
    await expect(page.locator('#cb1')).toHaveAttribute('loading', '');
    await page.evaluate(() => {
      const cb = document.getElementById('cb1') as HTMLElement & { options: unknown[]; loading: boolean };
      cb.options = [{ value: 'fig', label: 'Fig <b>1</b>' }];
      cb.loading = false;
    });
    await expect(row).toHaveCount(0);
    await expect(options(page)).toHaveText(['Fig <b>1</b>']);
    // Option labels go in as text, never as markup.
    await expect(options(page).locator('b')).toHaveCount(0);
  });

  test('a form submits the chosen value under name', async ({ page }) => {
    await load(page);
    expect(await formEntries(page)).toContainEqual(['fruit', '']);
    await input(page).click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    expect(await formEntries(page)).toContainEqual(['fruit', 'elder']);
  });

  test('a mouse click picks an option; disabled turns it off', async ({ page }) => {
    await load(page);
    await input(page).click();
    await options(page).nth(3).click();
    await expect(input(page)).toHaveValue('Date');
    await page.evaluate(() => document.getElementById('cb1')?.setAttribute('disabled', ''));
    await expect(input(page)).toBeDisabled();
    await expect(page.locator('#cb1 button[aria-label="Clear"]')).toHaveAttribute('hidden', '');
  });
});

test.describe('<nish-tabs>', () => {
  const tab = (page: Page, v: string): Locator => page.locator('#tb1 [role="tab"]').nth(['a', 'b', 'c'].indexOf(v));
  const panel = (page: Page, v: string): Locator => page.locator(`[data-tab-panel="${v}"]`);

  test('moves the buttons into a tablist and selects the first tab', async ({ page }) => {
    await load(page);
    const listEl = page.locator('#tb1 > div.nish-tabs');
    await expect(listEl).toHaveAttribute('role', 'tablist');
    await expect(listEl).toHaveAttribute('aria-label', 'Sections');
    await expect(page.locator('#tb1 [role="tab"]')).toHaveCount(3);
    await expect(page.locator('#tb1')).toHaveAttribute('value', 'a');
    await expect(tab(page, 'a')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'a')).toHaveAttribute('tabindex', '0');
    await expect(tab(page, 'b')).toHaveAttribute('tabindex', '-1');
    await expect(tab(page, 'a')).toHaveClass(/nish-tab\b/);
    await expect(panel(page, 'a')).toBeVisible();
    await expect(panel(page, 'b')).toBeHidden();
    await expect(panel(page, 'c')).toBeHidden();
  });

  test('links tabs and panels with ids, aria-controls and aria-labelledby', async ({ page }) => {
    await load(page);
    for (const v of ['a', 'b', 'c']) {
      const t = tab(page, v);
      const p = panel(page, v);
      await expect(t).toHaveAttribute('id', /.+/);
      await expect(p).toHaveAttribute('role', 'tabpanel');
      await expect(t).toHaveAttribute('aria-controls', (await p.getAttribute('id'))!);
      await expect(p).toHaveAttribute('aria-labelledby', (await t.getAttribute('id'))!);
    }
  });

  test('click selects, shows the panel and fires nish-change once', async ({ page }) => {
    await load(page);
    await tab(page, 'b').click();
    await expect(tab(page, 'b')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'a')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#tb1')).toHaveAttribute('value', 'b');
    await expect(panel(page, 'b')).toBeVisible();
    await expect(panel(page, 'a')).toBeHidden();
    await tab(page, 'b').click();
    const changes = await events(page, 'nish-change', 'tb1');
    expect(changes.map((e) => e.detail)).toEqual([{ value: 'b' }]);
  });

  test('arrows, Home and End move selection with focus and wrap', async ({ page }) => {
    await load(page);
    await tab(page, 'a').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'b')).toBeFocused();
    await expect(tab(page, 'b')).toHaveAttribute('aria-selected', 'true');
    await expect(panel(page, 'b')).toBeVisible();
    await page.keyboard.press('End');
    await expect(tab(page, 'c')).toBeFocused();
    await expect(tab(page, 'c')).toHaveAttribute('tabindex', '0');
    await expect(tab(page, 'b')).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'a')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(tab(page, 'c')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tab(page, 'a')).toBeFocused();
    expect((await events(page, 'nish-change', 'tb1')).map((e) => e.detail?.value)).toEqual(['b', 'c', 'a', 'c', 'a']);
  });

  test('a value that matches no tab falls back to the first; variants become classes', async ({ page }) => {
    await load(page);
    await expect(page.locator('#tb2')).toHaveAttribute('value', 'x');
    await expect(page.locator('#tb2 [role="tab"]').first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tb2 > div.nish-tabs')).toHaveClass(/nish-tabs--pill/);
    await expect(page.locator('#tb2 > div.nish-tabs')).toHaveClass(/nish-tabs--sm/);
    await page.evaluate(() => {
      const t = document.getElementById('tb2') as HTMLElement & { block: boolean; value: string };
      t.block = true;
      t.value = 'y';
    });
    await expect(page.locator('#tb2 > div.nish-tabs')).toHaveClass(/nish-tabs--block/);
    await expect(page.locator('#tb2 [role="tab"]').nth(1)).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('<nish-segmented>', () => {
  const radio = (page: Page, id: string, i: number): Locator => page.locator(`#${id} [role="radio"]`).nth(i);

  test('renders a radiogroup with the value checked and a roving tabindex', async ({ page }) => {
    await load(page);
    const group = page.locator('#sg1 > div.nish-seg');
    await expect(group).toHaveAttribute('role', 'radiogroup');
    await expect(group).toHaveAttribute('aria-label', 'Size');
    await expect(radio(page, 'sg1', 1)).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, 'sg1', 0)).toHaveAttribute('aria-checked', 'false');
    await expect(radio(page, 'sg1', 1)).toHaveAttribute('tabindex', '0');
    await expect(radio(page, 'sg1', 0)).toHaveAttribute('tabindex', '-1');
    expect(await formEntries(page)).toContainEqual(['size', 'm']);
  });

  test('click and arrows select, fire change and nish-change, and update the hidden input', async ({ page }) => {
    await load(page);
    await radio(page, 'sg1', 1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'sg1', 2)).toBeFocused();
    await expect(radio(page, 'sg1', 2)).toHaveAttribute('aria-checked', 'true');
    expect(await formEntries(page)).toContainEqual(['size', 'l']);
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'sg1', 0)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(radio(page, 'sg1', 2)).toBeFocused();
    await radio(page, 'sg1', 0).click();
    await expect(radio(page, 'sg1', 0)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#sg1')).toHaveAttribute('value', 's');
    expect((await events(page, 'nish-change', 'sg1')).map((e) => e.detail?.value)).toEqual(['l', 's', 'l', 's']);
    expect(await events(page, 'change', 'sg1')).toHaveLength(4);
    // Clicking the checked option again changes nothing.
    await radio(page, 'sg1', 0).click();
    expect(await events(page, 'change', 'sg1')).toHaveLength(4);
  });

  test('a value that matches no button checks none, and Tab still reaches the first', async ({ page }) => {
    await load(page);
    await expect(radio(page, 'sg2', 0)).toHaveAttribute('aria-checked', 'false');
    await expect(radio(page, 'sg2', 1)).toHaveAttribute('aria-checked', 'false');
    await expect(radio(page, 'sg2', 0)).toHaveAttribute('tabindex', '0');
    await expect(radio(page, 'sg2', 1)).toHaveAttribute('tabindex', '-1');
    await radio(page, 'sg2', 0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'sg2', 1)).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('<nish-copy-button>', () => {
  const copied = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);

  test('copies value, shows Copied for a moment and announces it', async ({ page }) => {
    await load(page);
    const btn = page.locator('#cp1 button');
    await expect(btn).toHaveText('Copy');
    await expect(btn).toHaveClass(/nish-copy-btn/);
    await btn.click();
    expect(await copied(page)).toEqual(['npm i nish-ui']);
    await expect(btn).toHaveText('Copied');
    await expect(btn).toHaveAttribute('data-copied', '');
    await expect(page.locator('#cp1 [role="status"]')).toHaveText('Copied');
    expect((await events(page, 'nish-copy', 'cp1'))[0].detail).toEqual({ text: 'npm i nish-ui' });
    await expect(btn).toHaveText('Copy', { timeout: 4000 });
    await expect(btn).not.toHaveAttribute('data-copied', /.*/);
    await expect(page.locator('#cp1 [role="status"]')).toHaveText('');
  });

  test('for copies the text of another element; labels are attributes', async ({ page }) => {
    await load(page);
    const btn = page.locator('#cp2 button');
    await expect(btn).toHaveText('Copy command');
    await btn.click();
    expect(await copied(page)).toEqual(['from the page']);
    await expect(btn).toHaveText('Done');
  });

  test('icon mode is a labelled icon button', async ({ page }) => {
    await load(page);
    const btn = page.locator('#cp3 button');
    await expect(btn).toHaveClass(/nish-icon-btn/);
    await expect(btn).toHaveAttribute('aria-label', 'Copy');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-label', 'Copied');
    expect(await copied(page)).toEqual(['icon text']);
  });

  test('a rejecting clipboard does not claim success', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      (window as unknown as { __clipFail: boolean }).__clipFail = true;
      document.execCommand = () => false;
    });
    const btn = page.locator('#cp1 button');
    await btn.click();
    await page.waitForTimeout(200);
    await expect(btn).toHaveText('Copy');
    await expect(btn).not.toHaveAttribute('data-copied', /.*/);
    expect(await copied(page)).toEqual([]);
    expect(await events(page, 'nish-copy', 'cp1')).toHaveLength(0);
  });
});

test.describe('<nish-sparkline>', () => {
  test('draws an accessible svg and redraws when values change', async ({ page }) => {
    await load(page);
    const svg = page.locator('#sp1 svg.nish-sparkline');
    await expect(svg).toHaveAttribute('role', 'img');
    await expect(svg).toHaveAttribute('aria-label', 'Response time');
    await expect(svg).toHaveAttribute('width', '120');
    await expect(svg).toHaveAttribute('height', '28');
    const path = svg.locator('path').first();
    const before = await path.getAttribute('d');
    expect(before).toBeTruthy();

    await page.evaluate(() => document.getElementById('sp1')?.setAttribute('values', '9,1,9,1,5'));
    await expect.poll(() => path.getAttribute('d')).not.toBe(before);
    const mid = await path.getAttribute('d');

    await page.evaluate(() => {
      (document.getElementById('sp1') as HTMLElement & { values: number[] }).values = [1, 2, 3];
    });
    await expect.poll(() => path.getAttribute('d')).not.toBe(mid);

    await page.evaluate(() => {
      const el = document.getElementById('sp1') as HTMLElement;
      el.setAttribute('width', '200');
      el.setAttribute('tone', 'ok');
    });
    await expect(svg).toHaveAttribute('width', '200');
    await expect(svg).toHaveAttribute('style', /--nish-ok-fill/);
  });

  test('fewer than two values draws nothing', async ({ page }) => {
    await load(page);
    await expect(page.locator('#sp2 svg')).toHaveCount(0);
    await page.evaluate(() => document.getElementById('sp1')?.setAttribute('values', '5'));
    await expect(page.locator('#sp1 svg')).toHaveCount(0);
    await page.evaluate(() => document.getElementById('sp2')?.setAttribute('values', '1,2'));
    await expect(page.locator('#sp2 svg')).toHaveCount(1);
  });
});

test('loading the built elements-forms.js a second time does not throw', async ({ page }) => {
  await load(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const ok = await page.evaluate(async () => {
    try {
      await window.loadBundle();
      return true;
    } catch {
      return false;
    }
  });
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
  for (const tag of ['nish-field', 'nish-search', 'nish-switch', 'nish-chip-group', 'nish-combobox', 'nish-tabs', 'nish-segmented', 'nish-copy-button', 'nish-sparkline']) {
    expect(await page.evaluate((t) => !!customElements.get(t), tag)).toBe(true);
  }
  // Elements keep working after the second load.
  await page.locator('#sw1 button').click();
  await expect(page.locator('#sw1 button')).toHaveAttribute('aria-checked', 'true');
});
