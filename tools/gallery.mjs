#!/usr/bin/env node
// Builds a before/after review page from visual-check reports.
//
//   node tools/gallery.mjs --after visual-out/jobs [--before visual-out/jobs-before] \
//     --title "Jobs restyle" --out gallery/jobs [--notes notes.md] [--fixed fixed.json]
//
// Writes <out>/index.html plus <out>/shots/{before,after}/<page>/<file>. Publish with
// the Artifact tool: file_path <out>/index.html, files = every shots/ path.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const afterDir = resolve(flag('--after'));
const beforeDir = flag('--before') ? resolve(flag('--before')) : null;
const out = resolve(flag('--out') ?? 'gallery');
const title = flag('--title') ?? 'Visual review';
const notes = flag('--notes') ? readFileSync(flag('--notes'), 'utf8') : '';
const fixed = flag('--fixed') ? JSON.parse(readFileSync(flag('--fixed'), 'utf8')) : [];

const load = (dir) => JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8'));
const after = load(afterDir);
const before = beforeDir && existsSync(join(beforeDir, 'report.json')) ? load(beforeDir) : null;

mkdirSync(join(out, 'shots'), { recursive: true });
const copy = (dir, tag, shot) => {
  if (!shot?.file) return null;
  const rel = join('shots', tag, shot.file);
  mkdirSync(join(out, rel, '..'), { recursive: true });
  cpSync(join(dir, shot.file), join(out, rel));
  return rel;
};

const key = (s) => `${s.page}|${s.viewport}|${s.theme}`;
const beforeMap = new Map((before?.shots ?? []).map((s) => [key(s), s]));
const shots = after.shots.map((s) => {
  const b = beforeMap.get(key(s));
  return {
    page: s.page,
    viewport: s.viewport,
    theme: s.theme,
    after: copy(afterDir, 'after', s),
    before: b ? copy(beforeDir, 'before', b) : null,
    problems: s.problems ?? [],
    beforeProblems: b?.problems ?? [],
  };
});
// Shots that only exist in "before" (a page that went away) still show.
for (const b of before?.shots ?? []) {
  if (!after.shots.some((s) => key(s) === key(b))) {
    shots.push({ page: b.page, viewport: b.viewport, theme: b.theme, after: null, before: copy(beforeDir, 'before', b), problems: [], beforeProblems: b.problems ?? [] });
  }
}

const data = { title, generated: after.generated, hasBefore: !!before, notes, fixed, shots };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const html = `<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Review console: a sticky filter bar over a stack of pages; each page shows its
   shots in a desktop-wide column beside a phone column, before above after. */
:root {
  --bg: #0a0b0f; --panel: #111218; --raised: #191b23; --line: #262935;
  --fg: #ececf1; --fg2: #a8aab7; --fg3: #8a8d9b; --accent: #8b93ff; --on-accent: #0a0b0f;
  --ok: #34d399; --bad: #f87171; --warn: #fbbf24;
  --sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  color-scheme: dark;
}
@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) {
  --bg: #f7f6f3; --panel: #ffffff; --raised: #f1f0ec; --line: #e2e0da;
  --fg: #17171c; --fg2: #4f515c; --fg3: #666874; --accent: #4338ca; --on-accent: #ffffff;
  --ok: #065f46; --bad: #a91b1b; --warn: #92400e; color-scheme: light; } }
:root[data-theme="light"] {
  --bg: #f7f6f3; --panel: #ffffff; --raised: #f1f0ec; --line: #e2e0da;
  --fg: #17171c; --fg2: #4f515c; --fg3: #666874; --accent: #4338ca; --on-accent: #ffffff;
  --ok: #065f46; --bad: #a91b1b; --warn: #92400e; color-scheme: light; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 14px/1.5 var(--sans); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--panel); }
.wrap { max-width: 1400px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header.top { padding-block: 28px 18px; display: grid; gap: 6px; }
h1 { margin: 0; font-size: 26px; letter-spacing: -0.015em; text-wrap: balance; }
.meta { color: var(--fg3); font-size: 13px; }
.summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.pill { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: var(--panel); border-radius: 999px; padding: 3px 10px; font-size: 12px; color: var(--fg2); font-variant-numeric: tabular-nums; }
.pill b { color: var(--fg); font-weight: 600; }
.pill.ok b { color: var(--ok); } .pill.bad b { color: var(--bad); }
.notes { margin-top: 10px; max-width: 72ch; color: var(--fg2); white-space: pre-wrap; }
.bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-block: 1px solid var(--line); }
.bar .wrap { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; padding-block: 10px; }
.group { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.group > span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg3); }
.seg { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); background: var(--raised); border-radius: 9px; padding: 2px; gap: 2px; }
.seg button { font: inherit; font-size: 12.5px; border: 0; background: transparent; color: var(--fg2); padding: 5px 10px; border-radius: 7px; cursor: pointer; min-height: 30px; }
.seg button[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
.seg button:focus-visible, a:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.toc { display: flex; flex-wrap: wrap; gap: 6px; }
.toc a { color: var(--fg2); text-decoration: none; font-size: 12.5px; border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; }
.toc a:hover { color: var(--fg); border-color: var(--fg3); }
main { display: grid; gap: 40px; padding-block: 24px 64px; }
section.page { display: grid; gap: 14px; scroll-margin-top: 80px; }
section.page > h2 { margin: 0; font-size: 18px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
section.page > h2 small { font-weight: 400; color: var(--fg3); font-size: 13px; }
.theme-block { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }
.theme-block h3 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg3); font-weight: 600; }
.row { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.row.single { grid-template-columns: minmax(0, 1fr); }
@media (max-width: 760px) { .row { grid-template-columns: minmax(0, 1fr); } }
figure { margin: 0; display: grid; gap: 6px; min-width: 0; }
figcaption { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 12px; color: var(--fg3); }
.tag { font-family: var(--mono); font-size: 11px; border-radius: 5px; padding: 1px 6px; background: var(--raised); border: 1px solid var(--line); color: var(--fg2); }
.tag.after { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.pair { display: grid; gap: 10px; }
.pair.side { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.shot { display: block; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--panel); }
.shot img { display: block; width: 100%; height: auto; }
.shot.phone { max-width: 390px; }
.missing { padding: 24px; color: var(--fg3); font-size: 12px; text-align: center; }
.probs { margin: 0; padding: 8px 10px 8px 26px; border-radius: 8px; font-size: 12px; background: color-mix(in srgb, var(--bad) 10%, transparent); color: var(--fg); border: 1px solid color-mix(in srgb, var(--bad) 30%, transparent); overflow-wrap: anywhere; }
.clean { font-size: 12px; color: var(--ok); }
.fixed { margin-top: 8px; display: grid; gap: 4px; max-width: 80ch; color: var(--fg2); }
.fixed li { overflow-wrap: anywhere; }
dialog { border: 0; padding: 0; background: transparent; max-width: 96vw; max-height: 94vh; }
dialog::backdrop { background: rgba(0,0,0,.75); }
dialog img { display: block; max-width: 96vw; max-height: 94vh; width: auto; height: auto; border-radius: 8px; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
<header class="top wrap">
  <h1 id="title"></h1>
  <div class="meta" id="meta"></div>
  <div class="summary" id="summary"></div>
  <div class="notes" id="notes" hidden></div>
  <div id="fixed-wrap" hidden><ul class="fixed" id="fixed"></ul></div>
</header>
<div class="bar"><div class="wrap">
  <div class="group" id="view-group" hidden><span>Show</span><div class="seg" id="view"></div></div>
  <div class="group"><span>Theme</span><div class="seg" id="themes"></div></div>
  <div class="group" style="min-width:0"><span>Pages</span><nav class="toc" id="toc"></nav></div>
</div></div>
<main class="wrap" id="main"></main>
<dialog id="zoom"><img alt="" id="zoom-img"></dialog>
<script>
const DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
  }
  for (const k of kids) if (k) n.append(k);
  return n;
};
const pages = [...new Set(DATA.shots.map((s) => s.page))];
const themes = [...new Set(DATA.shots.map((s) => s.theme))];
const isPhone = (v) => /phone|popout/.test(v);
let state = { view: DATA.hasBefore ? 'side' : 'after', theme: themes.length > 1 ? 'all' : themes[0] };
try { const s = JSON.parse(localStorage.getItem('gallery-state') || '{}'); if (s.view) state.view = s.view; if (s.theme) state.theme = s.theme; } catch (e) {}
if (!DATA.hasBefore) state.view = 'after';
if (state.theme !== 'all' && !themes.includes(state.theme)) state.theme = 'all';

$('title').textContent = DATA.title;
$('meta').textContent = 'Captured ' + new Date(DATA.generated).toLocaleString() + ' · ' + DATA.shots.length + ' shots';
const withProblems = DATA.shots.filter((s) => s.problems.length).length;
$('summary').append(
  el('span', { class: 'pill' }, el('b', { text: String(pages.length) }), ' pages'),
  el('span', { class: 'pill' }, el('b', { text: String(themes.length) }), ' themes'),
  el('span', { class: 'pill ' + (withProblems ? 'bad' : 'ok') }, el('b', { text: String(withProblems) }), ' shots with problems after'),
);
if (DATA.notes) { $('notes').hidden = false; $('notes').textContent = DATA.notes; }
if (DATA.fixed.length) {
  $('fixed-wrap').hidden = false;
  $('fixed').append(el('li', { class: 'meta', text: 'Fixed during review:' }), ...DATA.fixed.map((f) => el('li', { text: f })));
}

function seg(container, options, current, onPick) {
  container.replaceChildren(...options.map(([id, label]) => {
    const b = el('button', { type: 'button', 'aria-pressed': String(id === current), text: label });
    b.addEventListener('click', () => onPick(id));
    return b;
  }));
}
function save() { try { localStorage.setItem('gallery-state', JSON.stringify(state)); } catch (e) {} }

function shotFig(src, phone, label, cls) {
  const box = el('a', { class: 'shot' + (phone ? ' phone' : ''), href: src || '#', 'aria-label': 'Open full size' });
  if (src) {
    box.append(el('img', { src, alt: label, loading: 'lazy' }));
    box.addEventListener('click', (e) => { e.preventDefault(); $('zoom-img').src = src; $('zoom').showModal(); });
  } else box.append(el('div', { class: 'missing', text: 'No shot' }));
  return el('figure', {}, el('figcaption', {}, el('span', { class: 'tag ' + cls, text: cls }), label), box);
}

function cell(s) {
  const phone = isPhone(s.viewport);
  const label = s.viewport;
  const pair = el('div', { class: 'pair' + (state.view === 'side' && phone ? ' side' : '') });
  if (state.view !== 'after' && DATA.hasBefore) pair.append(shotFig(s.before, phone, label, 'before'));
  if (state.view !== 'before') pair.append(shotFig(s.after, phone, label, 'after'));
  const wrap = el('div', { style: 'display:grid;gap:8px;min-width:0' }, pair);
  if (state.view !== 'before') {
    wrap.append(s.problems.length
      ? el('ul', { class: 'probs' }, ...s.problems.map((p) => el('li', { text: p })))
      : el('div', { class: 'clean', text: 'No problems found' }));
  }
  return wrap;
}

function render() {
  seg($('view'), [['side', 'Before + after'], ['after', 'After'], ['before', 'Before']], state.view, (v) => { state.view = v; save(); render(); });
  $('view-group').hidden = !DATA.hasBefore;
  seg($('themes'), [...(themes.length > 1 ? [['all', 'All']] : []), ...themes.map((t) => [t, t[0].toUpperCase() + t.slice(1)])], state.theme, (t) => { state.theme = t; save(); render(); });
  $('toc').replaceChildren(...pages.map((p) => el('a', { href: '#' + p, text: p })));
  $('main').replaceChildren(...pages.map((p) => {
    const ps = DATA.shots.filter((s) => s.page === p);
    const probs = ps.filter((s) => s.problems.length).length;
    const sec = el('section', { class: 'page', id: p },
      el('h2', {}, p, el('small', { text: probs ? probs + ' shot(s) with problems' : 'clean' })));
    for (const t of themes) {
      if (state.theme !== 'all' && state.theme !== t) continue;
      const ts = ps.filter((s) => s.theme === t);
      if (!ts.length) continue;
      const wide = ts.filter((s) => !isPhone(s.viewport));
      const narrow = ts.filter((s) => isPhone(s.viewport));
      const row = el('div', { class: 'row' + (!wide.length || !narrow.length ? ' single' : '') });
      if (wide.length) row.append(el('div', { style: 'display:grid;gap:16px;min-width:0' }, ...wide.map(cell)));
      if (narrow.length) row.append(el('div', { style: 'display:grid;gap:16px;min-width:0' }, ...narrow.map(cell)));
      sec.append(el('div', { class: 'theme-block' }, el('h3', { text: t }), row));
    }
    return sec;
  }));
  const h = location.hash.slice(1);
  if (h && $(h)) $(h).scrollIntoView();
}
$('zoom').addEventListener('click', () => $('zoom').close());
render();
</script>
`;
writeFileSync(join(out, 'index.html'), html);

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(out, p));
  }
};
walk(join(out, 'shots'));
writeFileSync(join(out, 'files.json'), JSON.stringify(Object.fromEntries(files.map((f) => [f, join(out, f)])), null, 2));
const bytes = files.reduce((n, f) => n + statSync(join(out, f)).size, 0);
console.log(`${out}/index.html · ${files.length} images · ${(bytes / 1e6).toFixed(1)} MB (files map in files.json)`);
