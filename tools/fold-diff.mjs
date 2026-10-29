// Fold diff: compares two visual-check runs (base branch vs pull request) and writes a report.
//
//   node tools/fold-diff.mjs <baseDir> <headDir> --out <dir> [--summary <file>]
//
// Each dir holds the report.json and the PNG screenshots of one `visual-check --png` run.
// Writes <out>/summary.json, <out>/index.html (base, PR and diff images side by side) and
// <out>/{base,head,diff}/... images. --summary appends the markdown comment to a file (used
// with $GITHUB_STEP_SUMMARY). Exit 1 when the PR has a problem the base did not, exit 2 when
// there is no head report. A missing or unreadable base report is not an error: every
// problem then counts as new and nothing is compared.
import { copyFileSync, existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const CHANGED_PCT = 0.1; // a shot counts as changed above this percentage
const MAX_ROWS = 20;
const PAD = [255, 0, 255, 255]; // padding is opaque magenta so it never matches page content

const VIEWPORT_WIDTHS = { desktop: 1440, laptop: 1280, phone: 390, 'phone-small': 360, fold: 840 };

const widthOf = (viewport) => VIEWPORT_WIDTHS[viewport] ?? viewport;

/** Problem text with every number replaced by `#`, so "12px" and "13px" are the same problem. */
export const problemKey = (s) => String(s).replace(/\d+(\.\d+)?/g, '#');

const shotKey = (s) => `${s.page}|${s.viewport}|${s.theme}`;

/**
 * Compare two reports. Pure: no files. `pixel(baseShot, headShot)` is optional and returns the
 * diff percentage for a pair of shots (or null); without it every diffPct is null.
 * `base` may be null (base did not render).
 */
export function diffReports(base, head, pixel) {
  const baseOk = Boolean(base && Array.isArray(base.shots));
  const baseShots = new Map(baseOk ? base.shots.map((s) => [shotKey(s), s]) : []);
  const shots = [];
  let newProblems = 0;
  let changedShots = 0;
  let maxDiffPct = null;
  for (const h of head.shots ?? []) {
    const b = baseShots.get(shotKey(h));
    const headProblems = h.problems ?? [];
    const baseProblems = b?.problems ?? [];
    const baseKeys = new Set(baseProblems.map(problemKey));
    const headKeys = new Set(headProblems.map(problemKey));
    const added = headProblems.filter((p) => !baseKeys.has(problemKey(p)));
    const fixed = baseProblems.filter((p) => !headKeys.has(problemKey(p)));
    const diffPct = baseOk && b && pixel ? pixel(b, h) : null;
    shots.push({
      page: h.page,
      viewport: h.viewport,
      theme: h.theme,
      diffPct,
      newProblems: added,
      fixedProblems: fixed,
    });
    newProblems += added.length;
    if (diffPct !== null) {
      if (diffPct > CHANGED_PCT) changedShots++;
      if (diffPct > 0 && (maxDiffPct === null || diffPct > maxDiffPct)) maxDiffPct = diffPct;
    }
  }
  return { version: 1, baseOk, newProblems, maxDiffPct, changedShots, shots };
}

const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const byDiffDesc = (a, b) => (b.diffPct ?? -1) - (a.diffPct ?? -1);

/** The pull request comment (markdown). */
export function formatComment(summary, artifactUrl) {
  const lines = [
    '<!-- fold-check -->',
    '### Fold check',
    '',
    `**${summary.newProblems} new problem(s)** · ${summary.changedShots} of ${summary.shots.length} shots changed · largest change ${summary.maxDiffPct ?? 0}%`,
    '',
  ];
  if (!summary.baseOk) {
    lines.push('The base branch did not render, so every problem counts as new and nothing is compared.', '');
  }
  const rows = summary.shots
    .filter((s) => (s.diffPct ?? 0) > CHANGED_PCT || s.newProblems.length > 0)
    .sort(byDiffDesc)
    .slice(0, MAX_ROWS);
  if (rows.length === 0) {
    if (summary.newProblems === 0 && summary.changedShots === 0) lines.push('No new problems. No page changed.', '');
  } else {
    lines.push('| Page | Size | Theme | Changed | New problems |', '|---|---|---|---|---|');
    for (const s of rows) {
      const changed = s.diffPct !== null && s.diffPct > 0 ? `${s.diffPct}%` : '—';
      const probs = s.newProblems.length ? s.newProblems.map((p) => cut(p, 120).replace(/\|/g, '\\|')).join('<br>') : '—';
      lines.push(`| ${s.page} | ${widthOf(s.viewport)} | ${s.theme} | ${changed} | ${probs} |`);
    }
    lines.push('');
  }
  if (artifactUrl) lines.push(`[Report with before, after and diff images](${artifactUrl})`, '');
  return lines.join('\n');
}

const fill = (png) => {
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = PAD[0];
    png.data[i + 1] = PAD[1];
    png.data[i + 2] = PAD[2];
    png.data[i + 3] = PAD[3];
  }
};

/** Copy `src` onto a w x h canvas; the area outside `src` is padding. */
const pad = (src, w, h) => {
  const out = new PNG({ width: w, height: h });
  fill(out);
  PNG.bitblt(src, out, 0, 0, src.width, src.height, 0, 0);
  return out;
};

/** Pixel diff of two PNG buffers. Padding to the larger size counts as different. */
export function diffPng(baseBuf, headBuf) {
  const a = PNG.sync.read(baseBuf);
  const b = PNG.sync.read(headBuf);
  const w = Math.max(a.width, b.width);
  const h = Math.max(a.height, b.height);
  const pa = a.width === w && a.height === h ? a : pad(a, w, h);
  const pb = b.width === w && b.height === h ? b : pad(b, w, h);
  const out = new PNG({ width: w, height: h });
  const diffPixels = pixelmatch(pa.data, pb.data, out.data, w, h, { threshold: 0.1, includeAA: false });
  const diffPct = Math.round((diffPixels / (w * h)) * 100 * 100) / 100;
  return { diffPct, diffPixels, png: out };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderIndex(summary, images) {
  const rows = [...summary.shots].sort((a, b) => {
    if (a.diffPct === null && b.diffPct !== null) return -1;
    if (b.diffPct === null && a.diffPct !== null) return 1;
    return byDiffDesc(a, b);
  });
  const cards = rows
    .map((s) => {
      const im = images.get(shotKey(s)) ?? {};
      const img = (label, src) =>
        src
          ? `<figure><figcaption>${label}</figcaption><img src="${esc(src)}" loading="lazy"></figure>`
          : `<figure><figcaption>${label}</figcaption><p>none</p></figure>`;
      const probs = s.newProblems.length ? `<ul>${s.newProblems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '';
      return `<section><h2>${esc(s.page)} · ${esc(widthOf(s.viewport))} · ${esc(s.theme)} · ${s.diffPct === null ? 'not compared' : s.diffPct + '% changed'}</h2>${probs}<div class="grid">${img('Base', im.base)}${img('PR', im.head)}${img('Diff', im.diff)}</div></section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fold check</title>
<style>
body{font:16px/1.4 system-ui,sans-serif;margin:0;padding:16px;background:#fff;color:#111}
h1{font-size:1.25rem}h2{font-size:1rem;margin:0 0 8px}
section{margin:0 0 24px;padding-bottom:16px;border-bottom:1px solid #ccc}
ul{margin:0 0 8px;padding-left:20px;color:#b00020}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
figure{margin:0;min-width:0}figcaption{font-weight:600;margin-bottom:4px}
img{width:100%;height:auto;border:1px solid #ccc}
@media(max-width:700px){.grid{grid-template-columns:1fr}}
</style></head><body>
<h1>Fold check: ${summary.newProblems} new problem(s), ${summary.changedShots} of ${summary.shots.length} shots changed</h1>
${summary.baseOk ? '' : '<p>The base branch did not render, so every problem counts as new and nothing is compared.</p>'}
${cards}
</body></html>
`;
}

function readReport(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8'));
  } catch {
    return null;
  }
}

const urlPath = (rel) => rel.split(/[\\/]/).map(encodeURIComponent).join('/');

function main(argv) {
  const args = argv.slice(2);
  const pos = [];
  let out = null;
  let summaryFile = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') out = args[++i];
    else if (args[i] === '--summary') summaryFile = args[++i];
    else pos.push(args[i]);
  }
  if (pos.length !== 2 || !out) {
    console.error('usage: fold-diff.mjs <baseDir> <headDir> --out <dir> [--summary <file>]');
    return 2;
  }
  const [baseDir, headDir] = pos;
  const headReport = readReport(headDir);
  if (!headReport) {
    console.log('no head report');
    return 2;
  }
  const baseReport = readReport(baseDir);
  const images = new Map();
  const imagesOf = (shot) => {
    const k = shotKey(shot);
    if (!images.has(k)) images.set(k, {});
    return images.get(k);
  };
  const copy = (kind, dir, rel) => {
    const dest = join(out, kind, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(dir, rel), dest);
    return `${kind}/${urlPath(rel)}`;
  };
  const usable = (dir, shot) => Boolean(shot.file && shot.file.endsWith('.png') && existsSync(join(dir, shot.file)));
  const pixel = (b, h) => {
    if (!usable(baseDir, b) || !usable(headDir, h)) return null;
    const im = imagesOf(h);
    im.base = copy('base', baseDir, b.file);
    im.head = copy('head', headDir, h.file);
    const { diffPct, png } = diffPng(readFileSync(join(baseDir, b.file)), readFileSync(join(headDir, h.file)));
    if (diffPct > 0) {
      const rel = join(h.page, `${h.viewport}-${h.theme}.png`);
      const dest = join(out, 'diff', rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, PNG.sync.write(png));
      im.diff = `diff/${urlPath(rel)}`;
    }
    return diffPct;
  };
  mkdirSync(out, { recursive: true });
  const summary = diffReports(baseReport, headReport, pixel);
  // Head images with nothing to compare against still go in the report.
  for (const h of headReport.shots ?? []) {
    const im = imagesOf(h);
    if (!im.head && h.file && existsSync(join(headDir, h.file))) im.head = copy('head', headDir, h.file);
  }
  writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(out, 'index.html'), renderIndex(summary, images));
  if (summaryFile) appendFileSync(summaryFile, formatComment(summary) + '\n');
  console.log(`${summary.newProblems} new problem(s), ${summary.changedShots} of ${summary.shots.length} shots changed → ${out}`);
  return summary.newProblems > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main(process.argv));
