import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { diffPng, diffReports, formatComment, problemKey } from './fold-diff.mjs';

const shot = (problems = [], over = {}) => ({ page: 'home', viewport: 'fold', theme: 'light', problems, ...over });
const report = (...shots) => ({ shots });

const solid = (w, h, [r, g, b, a] = [255, 255, 255, 255]) => {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }
  return PNG.sync.write(png);
};

test('problemKey replaces every number', () => {
  assert.equal(problemKey('past right edge: 12px, 1.5em'), 'past right edge: #px, #em');
});

test('identical reports have no new problems and no change', () => {
  const r = report(shot(['clipped text: a 12px']), shot([], { viewport: 'desktop' }));
  const s = diffReports(r, r, () => 0);
  assert.equal(s.baseOk, true);
  assert.equal(s.newProblems, 0);
  assert.equal(s.changedShots, 0);
  assert.equal(s.maxDiffPct, null);
  assert.equal(s.shots.length, 2);
});

test('a problem whose number changed counts as the same problem', () => {
  const s = diffReports(report(shot(['page scrolls sideways (12px wide)'])), report(shot(['page scrolls sideways (13px wide)'])));
  assert.equal(s.newProblems, 0);
  assert.deepEqual(s.shots[0].fixedProblems, []);
});

test('a new problem is reported with its original text', () => {
  const s = diffReports(report(shot()), report(shot(['console: boom 7'])));
  assert.equal(s.newProblems, 1);
  assert.deepEqual(s.shots[0].newProblems, ['console: boom 7']);
});

test('a fixed problem is listed as fixed', () => {
  const s = diffReports(report(shot(['clipped text: x'])), report(shot()));
  assert.equal(s.newProblems, 0);
  assert.deepEqual(s.shots[0].fixedProblems, ['clipped text: x']);
});

test('a missing base report makes every problem new and compares nothing', () => {
  const s = diffReports(null, report(shot(['a', 'b']), shot(['c'], { viewport: 'desktop' })), () => 5);
  assert.equal(s.baseOk, false);
  assert.equal(s.newProblems, 3);
  assert.equal(s.maxDiffPct, null);
  assert.ok(s.shots.every((x) => x.diffPct === null));
});

test('a shot missing in base has all its problems new', () => {
  const s = diffReports(report(shot([], { page: 'other' })), report(shot(['a'])));
  assert.equal(s.baseOk, true);
  assert.equal(s.newProblems, 1);
});

test('diffPct drives changedShots and maxDiffPct', () => {
  const pcts = { fold: 3.2, desktop: 0.05 };
  const s = diffReports(
    report(shot(), shot([], { viewport: 'desktop' })),
    report(shot(), shot([], { viewport: 'desktop' })),
    (b) => pcts[b.viewport],
  );
  assert.equal(s.changedShots, 1);
  assert.equal(s.maxDiffPct, 3.2);
});

test('diffPng of identical images is 0%', () => {
  const a = solid(10, 10);
  assert.equal(diffPng(a, a).diffPct, 0);
});

test('diffPng counts changed pixels', () => {
  const r = diffPng(solid(10, 10), solid(10, 10, [0, 0, 0, 255]));
  assert.equal(r.diffPct, 100);
});

test('diffPng counts padding when the sizes differ', () => {
  // 10x10 vs 10x20 white: the extra 10x10 is padding and differs, so half the 10x20 canvas.
  const r = diffPng(solid(10, 10), solid(10, 20));
  assert.equal(r.diffPct, 50);
  assert.equal(r.png.height, 20);
});

const summaryOf = (over) => ({ version: 1, baseOk: true, newProblems: 0, maxDiffPct: null, changedShots: 0, shots: [], ...over });

test('formatComment when nothing changed', () => {
  const md = formatComment(summaryOf({ shots: [{ page: 'home', viewport: 'fold', theme: 'light', diffPct: 0, newProblems: [], fixedProblems: [] }] }));
  assert.equal(
    md,
    '<!-- fold-check -->\n### Fold check\n\nNo new problems. No page changed.\n',
  );
});

test('formatComment table, sizes, cut and artifact link', () => {
  const long = 'x'.repeat(200);
  const md = formatComment(
    summaryOf({
      newProblems: 1,
      maxDiffPct: 3.2,
      changedShots: 1,
      shots: [
        { page: 'home', viewport: 'phone-small', theme: 'dark', diffPct: 3.2, newProblems: [long], fixedProblems: [] },
        { page: 'quiet', viewport: 'desktop', theme: 'light', diffPct: 0, newProblems: [], fixedProblems: [] },
      ],
    }),
    'https://example.test/report',
  );
  assert.match(md, /\*\*1 new problem\(s\)\*\* · 1 of 2 shots changed · largest change 3\.2%/);
  assert.match(md, /\| Page \| Size \| Theme \| Changed \| New problems \|/);
  assert.match(md, /\| home \| 360 \| dark \| 3\.2% \| `x{119}…` \|/);
  assert.doesNotMatch(md, /quiet/);
  assert.match(md, /\[Report with before, after and diff images\]\(https:\/\/example\.test\/report\)/);
});

test('formatComment explains a base that did not render', () => {
  const md = formatComment(summaryOf({ baseOk: false, newProblems: 1, shots: [{ page: 'a', viewport: 'fold', theme: 'light', diffPct: null, newProblems: ['p'], fixedProblems: [] }] }));
  assert.match(md, /The base branch did not render, so every problem counts as new and nothing is compared\./);
  assert.match(md, /\| a \| 840 \| light \| — \| `p` \|/);
});

test('formatComment caps the table at 20 rows, largest change first', () => {
  const shots = Array.from({ length: 25 }, (_, i) => ({ page: `p${i}`, viewport: 'fold', theme: 'light', diffPct: i + 1, newProblems: [], fixedProblems: [] }));
  const md = formatComment(summaryOf({ changedShots: 25, maxDiffPct: 25, shots }));
  const rows = md.split('\n').filter((l) => /^\| p\d+ /.test(l));
  assert.equal(rows.length, 20);
  assert.match(rows[0], /^\| p24 /);
  assert.doesNotMatch(md, /\| p0 /);
});

test('a base report whose shots all failed to load is not ok', () => {
  const dead = report(shot(['load: page.goto: net::ERR_CONNECTION_REFUSED']));
  const s = diffReports(dead, report(shot()), () => 0);
  assert.equal(s.baseOk, false);
  assert.equal(s.maxDiffPct, null);
  assert.equal(diffReports(report(shot([], { error: 'x' })), report(shot())).baseOk, false);
  assert.equal(diffReports(report(), report(shot())).baseOk, false);
  const md = formatComment(s);
  assert.match(md, /The base branch did not render/);
  assert.doesNotMatch(md, /No page changed/);
  assert.match(md, /largest change —/);
});

test('formatComment keeps a multi-line problem in one table row', () => {
  const md = formatComment(summaryOf({ newProblems: 1, shots: [{ page: 'a|b', viewport: 'fold', theme: 'light', diffPct: 0, newProblems: ['console: <div> boom\n    at x (y.js:1:2)'], fixedProblems: [] }] }));
  const row = md.split('\n').find((l) => l.startsWith('| a'));
  assert.ok(row.includes('`console: <div> boom at x (y.js:1:2)`'));
  assert.ok(row.startsWith('| a\\|b |'));
});
