#!/usr/bin/env node
// Visual check for any nish.software page: screenshots at desktop and phone sizes in
// each theme, plus the problems a screenshot alone hides: horizontal overflow,
// console errors, axe contrast and tap-target violations, clipped text and missing
// focus rings.
//
//   node tools/visual-check.mjs <config.json> [--out dir] [--no-fail] [--only page,page]
//
// config.json:
// {
//   "name": "jobs",
//   "pages": [{ "name": "home", "url": "http://localhost:5173/", "waitFor": "main", "setup": "js run after load" }],
//   "viewports": ["desktop", "laptop", "phone", "phone-small"],   // optional, names from VIEWPORTS
//   "themes": ["dark", "light"],                                   // optional
//   "setTheme": "localStorage.setItem('nish-theme','{theme}')",     // optional; runs before page scripts
//   "fullPage": true,
//   "ignoreConsole": ["regex", ...]                                 // optional
// }
//
// Writes <out>/<page>/<viewport>-<theme>.jpg and <out>/report.json. Exit 1 when any
// page fails, unless --no-fail (used for "before" shots).
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  'phone-small': { width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  popout: { width: 420, height: 720 },
};

const SCHEMES = { light: 'light' };
const schemeOf = (theme) => SCHEMES[theme] ?? 'dark';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const configPath = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out' && args[args.indexOf(a) - 1] !== '--only');
if (!configPath) {
  console.error('usage: visual-check.mjs <config.json> [--out dir] [--no-fail] [--only a,b]');
  process.exit(2);
}
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const outDir = resolve(flag('--out') ?? join('visual-out', config.name ?? 'site'));
const only = flag('--only')?.split(',');
const noFail = args.includes('--no-fail');
const viewports = config.viewports ?? ['desktop', 'phone'];
const themes = config.themes ?? ['dark', 'light'];
const setTheme = config.setTheme ?? "try{localStorage.setItem('nish-theme','{theme}')}catch(e){}";
const ignoreConsole = (config.ignoreConsole ?? []).map((r) => new RegExp(r));

mkdirSync(outDir, { recursive: true });

// Runs in the page. Everything a reviewer should not have to find by eye.
function inspect() {
  const vw = window.innerWidth;
  const sel = (el) => {
    if (el.id) return `#${el.id}`;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Elements that poke past the right edge, minus ones inside a horizontal scroller
  // (a scrolling table is fine; the page scrolling sideways is not).
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
    }
    return false;
  };
  const overflowing = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (overflowing.length >= 8) break;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && r.width > 0 && visible(el) && !inScroller(el) && getComputedStyle(el).position !== 'fixed') {
      overflowing.push(`${sel(el)} (right ${Math.round(r.right)} > ${vw})`);
    }
  }
  // Text cut off without an ellipsis: a single line wider than its box with overflow hidden.
  const clipped = [];
  for (const el of document.body.querySelectorAll('p,span,a,button,td,th,h1,h2,h3,h4,label,li,div')) {
    if (clipped.length >= 8) break;
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el);
    if ((s.overflowX === 'hidden' || s.overflow === 'hidden') && s.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && visible(el)) {
      clipped.push(`${sel(el)}: "${el.textContent.trim().slice(0, 40)}"`);
    }
  }
  return {
    pageOverflow: document.documentElement.scrollWidth > vw + 1,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing,
    clipped,
    dataTheme: document.documentElement.getAttribute('data-theme'),
    bg: getComputedStyle(document.body).backgroundColor,
  };
}

async function focusCheck(page) {
  const missing = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      return { ring, name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30) };
    });
    if (r && !r.ring) missing.push(r.name);
  }
  return missing;
}

const browser = await chromium.launch();
const report = { name: config.name, outDir, generated: new Date().toISOString(), shots: [] };
let failed = 0;

for (const pg of config.pages) {
  if (only && !only.includes(pg.name)) continue;
  mkdirSync(join(outDir, pg.name), { recursive: true });
  for (const vpName of pg.viewports ?? viewports) {
    const vp = VIEWPORTS[vpName];
    for (const theme of pg.themes ?? themes) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile ?? false,
        hasTouch: vp.hasTouch ?? false,
        deviceScaleFactor: vp.deviceScaleFactor ?? 1,
        colorScheme: schemeOf(theme),
        reducedMotion: 'reduce',
      });
      await ctx.addInitScript({ content: setTheme.replaceAll('{theme}', theme) });
      if (config.cookies) await ctx.addCookies(config.cookies.map((c) => ({ ...c, value: c.value.replaceAll('{theme}', theme) })));
      const page = await ctx.newPage();
      const consoleErrors = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && !ignoreConsole.some((r) => r.test(m.text()))) consoleErrors.push(m.text().slice(0, 300));
      });
      page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 300)}`));

      const shot = { page: pg.name, viewport: vpName, theme, url: pg.url };
      try {
        await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 45_000 });
        if (pg.waitFor) await page.waitForSelector(pg.waitFor, { timeout: 15_000 });
        if (pg.setup) await page.evaluate(pg.setup);
        await page.waitForTimeout(pg.settle ?? 400);

        Object.assign(shot, await page.evaluate(inspect));
        const axe = await new AxeBuilder({ page }).withRules(['color-contrast', 'target-size']).analyze();
        shot.axe = axe.violations.map((v) => ({
          rule: v.id,
          impact: v.impact,
          count: v.nodes.length,
          examples: v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')}${n.any?.[0]?.message ? ' — ' + n.any[0].message.slice(0, 160) : ''}`),
        }));
        const file = join(pg.name, `${vpName}-${theme}.jpg`);
        await page.screenshot({ path: join(outDir, file), fullPage: pg.fullPage ?? config.fullPage ?? true, type: 'jpeg', quality: 72 });
        shot.file = file;
        if (vpName === 'desktop' && theme === (pg.themes ?? themes)[0]) shot.focusMissing = await focusCheck(page);
      } catch (e) {
        shot.error = String(e.message ?? e).slice(0, 400);
      }
      shot.consoleErrors = consoleErrors;
      const contrast = shot.axe?.find((v) => v.rule === 'color-contrast');
      shot.problems = [
        shot.error && `load: ${shot.error}`,
        shot.pageOverflow && `page scrolls sideways (${shot.scrollWidth}px wide)`,
        ...(shot.overflowing ?? []).map((o) => `past right edge: ${o}`),
        ...(shot.clipped ?? []).map((c) => `clipped text: ${c}`),
        contrast && `contrast: ${contrast.count} element(s), e.g. ${contrast.examples[0]}`,
        ...consoleErrors.map((c) => `console: ${c}`),
        ...(shot.focusMissing ?? []).map((f) => `no focus ring: ${f}`),
      ].filter(Boolean);
      // target-size is reported but only fails on phones, where it matters.
      const tap = shot.axe?.find((v) => v.rule === 'target-size');
      if (tap && vp.isMobile) shot.problems.push(`small tap targets: ${tap.count}, e.g. ${tap.examples[0]}`);
      if (shot.problems.length) failed++;
      report.shots.push(shot);
      console.log(`${shot.problems.length ? 'FAIL' : 'ok  '} ${pg.name} ${vpName} ${theme}${shot.problems.length ? '\n     ' + shot.problems.join('\n     ') : ''}`);
      await ctx.close();
    }
  }
}

await browser.close();
// With --only, keep the other pages' shots from the last full run.
if (only) {
  try {
    const prev = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
    report.shots = [...prev.shots.filter((s) => !only.includes(s.page)), ...report.shots];
  } catch {
    // no previous report: this run is the report
  }
}
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.shots.length} shots, ${failed} with problems → ${outDir}`);
if (failed && !noFail) process.exit(1);
