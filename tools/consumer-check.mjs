#!/usr/bin/env node
// Installs the packed package into small consumer apps the way an outside team would, and checks
// that each one builds and runs: node tools/consumer-check.mjs [next] [vite] [ts] [--keep] [--tarball <file>]
//
//   next  tests/consumers/next: Next.js App Router. Server components use cn, buttonClass, Card,
//         Badge and Button, and render Modal, Combobox, Tabs, Toaster, ThemeToggle and AppShell
//         directly. `next build` must pass; `next start` (port 5320) must serve every page with no
//         console error, no hydration warning and working interactions.
//   vite  tests/consumers/vite: Vite + Tailwind 4 + nishThemeInit(). `vite build` must pass and the
//         preview (port 5321) must render without console errors.
//   ts    tests/consumers/ts: one file using 20+ components and every subpath, type-checked with
//         TypeScript 5.4, 5.9 and 6.0 x moduleResolution bundler and node16, strict,
//         exactOptionalPropertyTypes, skipLibCheck false.
//
// The tarball is what publish.yml would ship: the repo's files list copied to a staging folder,
// package.json renamed to nish-ui by tools/npm-publish.mjs's publishManifest(), then `npm pack`.
// Nothing is written to the repo; everything lives in a temp folder (removed unless --keep).
// Needs `npm run build` first, network access to the npm registry, and Playwright's Chromium.
/* global document -- used inside page.evaluate callbacks, which run in the browser */
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishManifest } from './npm-publish.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = join(root, 'tests/consumers');
const PORTS = { next: 5320, vite: 5321 };
const isWin = process.platform === 'win32';

// ---- small helpers -------------------------------------------------------------------

const log = (...a) => console.log('[consumer-check]', ...a);
const results = [];
const ok = (name, detail = '') => {
  results.push({ name, ok: true, detail });
  log(`ok   ${name}${detail ? ' - ' + detail : ''}`);
};
const fail = (name, detail) => {
  results.push({ name, ok: false, detail });
  console.error(`[consumer-check] FAIL ${name}: ${detail}`);
};

/** Runs a command to completion; returns { code, out }. `npm`/`npx` need a shell on Windows. */
function run(cmd, args, opts = {}) {
  const shell = isWin && /^(npm|npx)$/.test(cmd);
  const r = spawnSync(shell ? [cmd, ...args.map((a) => JSON.stringify(a))].join(' ') : cmd, shell ? [] : args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    shell,
    maxBuffer: 64 * 1024 * 1024,
    timeout: opts.timeout ?? 10 * 60_000,
  });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/** Starts a long-running Node script (not through a shell, so kill() reaches it). */
function serve(script, args, cwd, port) {
  const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, PORT: String(port), NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  return { child, output: () => out };
}

async function waitForUrl(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${url} did not come up in ${ms / 1000}s`);
}

// ---- the tarball ---------------------------------------------------------------------

function pack(work, given) {
  if (given) return resolve(given);
  if (!existsSync(join(root, 'dist/esm/index.js'))) throw new Error('dist/esm is missing: run npm run build first');
  const stage = join(work, 'stage');
  mkdirSync(stage, { recursive: true });
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  // The files list: "dist", "!dist/esm/**/*.map", "tsconfig"; npm adds package.json, README and LICENSE.
  cpSync(join(root, 'dist'), join(stage, 'dist'), { recursive: true, filter: (src) => !(src.includes(join('dist', 'esm')) && src.endsWith('.map')) });
  if (existsSync(join(root, 'tsconfig'))) cpSync(join(root, 'tsconfig'), join(stage, 'tsconfig'), { recursive: true });
  for (const f of ['README.md', 'LICENSE']) if (existsSync(join(root, f))) cpSync(join(root, f), join(stage, f));
  writeFileSync(join(stage, 'package.json'), JSON.stringify(publishManifest(pkg), null, 2));
  const r = run('npm', ['pack', '--pack-destination', work, '--ignore-scripts'], { cwd: stage });
  if (r.code !== 0) throw new Error('npm pack failed:\n' + r.out);
  const tgz = readdirSync(work).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack produced no tarball:\n' + r.out);
  return join(work, tgz);
}

/** Copies a fixture to the work folder and installs it with the tarball. */
function prepare(work, name, tarball) {
  const dir = join(work, name);
  cpSync(join(fixtures, name), dir, { recursive: true });
  const file = join(dir, 'package.json');
  const url = 'file:' + tarball.split('\\').join('/');
  writeFileSync(file, readFileSync(file, 'utf8').replace('__NISH_UI_TARBALL__', url));
  const r = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', '--prefer-offline', '--ignore-scripts'], { cwd: dir });
  if (r.code !== 0) throw new Error(`npm install failed for ${name}:\n${r.out.slice(-3000)}`);
  return dir;
}

// ---- browser checks ------------------------------------------------------------------

async function visit(browser, base, path, { saved = false, after } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: 'dark' });
  if (saved) await ctx.addInitScript(() => localStorage.setItem('nish-theme', 'light'));
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text().split('\n')[0].slice(0, 300)}`);
  });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message.slice(0, 300)));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const extra = after ? await after(page) : null;
  const theme = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  await ctx.close();
  return { problems, theme, extra };
}

async function checkNext(work, tarball, browser) {
  const dir = prepare(work, 'next', tarball);
  const nextBin = join(dir, 'node_modules/next/dist/bin/next');
  const build = run(process.execPath, [nextBin, 'build'], { cwd: dir, env: { NEXT_TELEMETRY_DISABLED: '1' } });
  if (build.code !== 0) return fail('next build', build.out.slice(-3000));
  ok('next build', 'passed');

  const app = serve(nextBin, ['start', '-p', String(PORTS.next)], dir, PORTS.next);
  const base = `http://localhost:${PORTS.next}`;
  try {
    await waitForUrl(base + '/');
    const home = await (await fetch(base + '/')).text();
    if (!/nish-|th-/.test(home) || !home.includes('Server page')) fail('next / server HTML', 'the server page did not render the Card/Button markup');
    else ok('next / server HTML', 'Card, Badge and Button are in the HTML');

    for (const saved of [false, true]) {
      const label = saved ? 'returning visitor' : 'first visit';
      for (const path of ['/', '/shell', '/overlay', '/subpaths']) {
        const v = await visit(browser, base, path, { saved });
        if (v.problems.length) fail(`next ${path} (${label})`, v.problems.join(' | '));
        else ok(`next ${path} (${label})`, 'no console errors or hydration warnings');
        if (saved && path === '/' && v.theme !== 'light') fail('next saved theme', `data-theme is ${v.theme}, expected light`);
      }
    }

    const shell = await visit(browser, base, '/shell', {
      after: async (page) => {
        const out = {};
        await page.getByRole('tab', { name: 'Beta' }).click();
        out.betaSelected = await page.getByRole('tab', { name: 'Beta' }).getAttribute('aria-selected');
        const cb = page.getByRole('combobox', { name: 'Fruit' });
        await cb.click();
        await cb.fill('ban');
        await page.waitForTimeout(150);
        out.options = await page.getByRole('option').allTextContents();
        await cb.press('Escape');
        const before = await page.evaluate(() => document.documentElement.dataset.theme);
        await page.getByRole('button', { name: /theme/i }).first().click();
        await page.waitForTimeout(150);
        out.themeChanged = before !== (await page.evaluate(() => document.documentElement.dataset.theme));
        return out;
      },
    });
    const e = shell.extra;
    if (e.betaSelected !== 'true') fail('next Tabs from a server component', 'Beta did not become selected');
    else if (!e.options.some((o) => /banana/i.test(o))) fail('next Combobox from a server component', `options after typing: ${JSON.stringify(e.options)}`);
    else if (!e.themeChanged) fail('next ThemeToggle from a server component', 'data-theme did not change on click');
    else ok('next interactions', 'Tabs, Combobox and ThemeToggle work from a server component');

    const overlay = await visit(browser, base, '/overlay', {
      after: (page) => page.getByRole('dialog', { name: 'Hello from the server' }).isVisible(),
    });
    if (overlay.extra !== true) fail('next Modal from a server component', 'the dialog is not visible');
    else ok('next Modal from a server component', 'dialog visible after hydration');

    const sub = await (await fetch(base + '/subpaths')).text();
    // Each value is in its own <span data-testid="...">; read them one by one.
    const field = (id) => {
      const m = sub.match(new RegExp(`<span[^>]*data-testid="${id}"[^>]*>(.*?)</span>`, 's'));
      return m ? m[1].split('<!-- -->').join('').trim() : null;
    };
    const got = Object.fromEntries(['money', 'pct', 'date', 'presets', 'themes', 'series'].map((id) => [id, field(id)]));
    const bad = [];
    for (const [id, want] of Object.entries({ money: '$1,234.50', pct: '12.3%', presets: '7', themes: '7', series: 'var(--nish-chart-3)' })) {
      if (got[id] !== want) bad.push(`${id} is ${JSON.stringify(got[id])}, expected ${JSON.stringify(want)}`);
    }
    if (!/^(Dec 31|Jan 1)(, 2026)?$/.test(got.date ?? '')) bad.push(`date is ${JSON.stringify(got.date)}`); // 2026-01-01 UTC, shown in the server's zone
    if (bad.length) fail('next subpaths', bad.join('; '));
    else ok('next subpaths', 'money, pct, date, PRESETS, THEMES and seriesColor render correctly in a server component');
  } finally {
    app.child.kill();
  }
  if (app.output().match(/error/i) && !/0 errors/i.test(app.output())) log('next start output had the word "error":\n' + app.output().slice(-800));
}

async function checkVite(work, tarball, browser) {
  const dir = prepare(work, 'vite', tarball);
  const viteBin = join(dir, 'node_modules/vite/bin/vite.js');
  // Vite strips types without checking them, so run the fixture's own TypeScript (strict, skipLibCheck false) first.
  const tsc = run(process.execPath, [join(dir, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--pretty', 'false'], { cwd: dir });
  if (tsc.code !== 0) return fail('vite typecheck', tsc.out.slice(-3000));
  ok('vite typecheck', 'tsc strict, skipLibCheck false');
  const build = run(process.execPath, [viteBin, 'build'], { cwd: dir });
  if (build.code !== 0) return fail('vite build', build.out.slice(-3000));
  ok('vite build', 'passed');
  const assets = readdirSync(join(dir, 'dist/assets'));
  const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, 'dist/assets', f), 'utf8')).join('');
  if (!css.includes('--color-th') && !css.includes('bg-th-')) fail('vite css', 'the built CSS has none of the nish-ui utilities');
  else ok('vite css', `${(css.length / 1024).toFixed(0)} KB of CSS with the nish-ui utilities`);
  const html = readFileSync(join(dir, 'dist/index.html'), 'utf8');
  if (!html.includes('nish-theme')) fail('vite theme-init', 'nishThemeInit() did not inject the theme script');
  else ok('vite theme-init', 'injected into index.html');

  const preview = serve(viteBin, ['preview', '--port', String(PORTS.vite), '--strictPort'], dir, PORTS.vite);
  const base = `http://localhost:${PORTS.vite}`;
  try {
    await waitForUrl(base + '/');
    const r = await visit(browser, base, '/', {
      saved: true,
      after: async (page) => {
        await page.getByRole('button', { name: 'Open modal' }).click();
        const visible = await page.getByRole('dialog', { name: 'Hello' }).isVisible();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        return { visible, closed: !(await page.getByRole('dialog').isVisible().catch(() => false)) };
      },
    });
    if (r.problems.length) fail('vite preview', r.problems.join(' | '));
    else if (!r.extra.visible || !r.extra.closed) fail('vite Modal', JSON.stringify(r.extra));
    else if (r.theme !== 'light') fail('vite saved theme', `data-theme is ${r.theme}`);
    else ok('vite preview', 'renders, Modal opens and closes, saved theme applied, no console errors');
  } finally {
    preview.child.kill();
  }
}

function checkTs(work, tarball) {
  const dir = prepare(work, 'ts', tarball);
  const rows = [];
  for (const [id, label] of [['ts54', '5.4'], ['ts59', '5.9'], ['ts60', '6.0']]) {
    for (const resolution of ['bundler', 'node16']) {
      const module = resolution === 'bundler' ? 'esnext' : 'node16';
      const cfg = join(dir, `tsconfig.${id}.${resolution}.json`);
      writeFileSync(
        cfg,
        JSON.stringify({
          compilerOptions: {
            target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module, moduleResolution: resolution, jsx: 'react-jsx',
            // hono's and @types/node's own .d.ts need TypeScript 5.7+ (Uint8Array generics), so 5.4 checks the
            // browser consumer file alone and skips the Node-side entries (vite, eslint, server).
            strict: true, exactOptionalPropertyTypes: true, skipLibCheck: false, noEmit: true, types: id === 'ts54' ? [] : ['node'], isolatedModules: true,
          },
          include: id === 'ts54' ? ['src/consumer.tsx'] : ['src'],
        }),
      );
      const r = run(process.execPath, [join(dir, 'node_modules', id, 'bin/tsc'), '-p', cfg, '--pretty', 'false'], { cwd: dir });
      const errors = r.out.split('\n').filter((l) => l.includes('error TS'));
      rows.push({ label, resolution, errors });
      const name = `ts ${label} ${resolution}`;
      if (errors.length) fail(name, `${errors.length} errors:\n  ${errors.slice(0, 8).join('\n  ')}`);
      else ok(name, 'no errors');
    }
  }
  return rows;
}

// ---- main ----------------------------------------------------------------------------

async function main(argv) {
  const keep = argv.includes('--keep');
  const ti = argv.indexOf('--tarball');
  const given = ti >= 0 ? argv[ti + 1] : null;
  const only = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--tarball');
  const want = (n) => only.length === 0 || only.includes(n);

  const work = mkdtempSync(join(tmpdir(), 'nish-consumers-'));
  log('work folder', work);
  let browser;
  try {
    const tarball = pack(work, given);
    log('tarball', tarball);
    if (want('next') || want('vite')) {
      const { chromium } = await import('playwright');
      browser = await chromium.launch();
    }
    if (want('ts')) checkTs(work, tarball);
    if (want('vite')) await checkVite(work, tarball, browser);
    if (want('next')) await checkNext(work, tarball, browser);
  } catch (e) {
    fail('consumer-check', e instanceof Error ? e.stack ?? e.message : String(e));
  } finally {
    await browser?.close();
    if (keep) log('kept', work);
    else rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
  const bad = results.filter((r) => !r.ok);
  console.log(`\n[consumer-check] ${results.length - bad.length} passed, ${bad.length} failed`);
  return bad.length === 0 ? 0 : 1;
}

main(process.argv.slice(2)).then((code) => process.exit(code));
