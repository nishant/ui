import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemsOf } from './visual-problems.mjs';

const ok = { file: 'x.jpg', bytes: 100 };
const d = { isMobile: false };

test('clean shot has no problems', () => {
  assert.deepEqual(problemsOf(ok, d), []);
});

test('page overflow', () => {
  assert.deepEqual(problemsOf({ ...ok, pageOverflow: true, scrollWidth: 412 }, d), ['page scrolls sideways (412px wide)']);
});

test('list rules map to prefixes', () => {
  const p = problemsOf({ ...ok, overflowing: ['a'], clipped: ['b'], innerScrollers: ['c'], consoleErrors: ['e'], focusMissing: ['f'] }, d);
  assert.deepEqual(p, ['past right edge: a', 'app scroller scrolls sideways: c', 'clipped text: b', 'console: e', 'no focus ring: f']);
});

test('contrast', () => {
  const axe = [{ rule: 'color-contrast', count: 3, examples: ['<example>'] }];
  assert.deepEqual(problemsOf({ ...ok, axe }, d), ['contrast: 3 element(s), e.g. <example>']);
});

test('target-size only on mobile', () => {
  const axe = [{ rule: 'target-size', count: 2, examples: ['<a>'] }];
  assert.deepEqual(problemsOf({ ...ok, axe }, { isMobile: true }), ['small tap targets: 2, e.g. <a>']);
  assert.deepEqual(problemsOf({ ...ok, axe }, d), []);
});

test('screenshot empty or missing', () => {
  assert.deepEqual(problemsOf({ file: 'x.jpg', bytes: 0 }, d), ['screenshot x.jpg is empty']);
  assert.deepEqual(problemsOf({ file: 'x.jpg', bytes: -1 }, d), ['screenshot x.jpg is missing']);
});

test('no screenshot and load error', () => {
  assert.deepEqual(problemsOf({}, d), ['no screenshot taken']);
  assert.deepEqual(problemsOf({ error: 'boom' }, d), ['load: boom']);
});

test('ordering matches the original', () => {
  const shot = {
    error: 'e', pageOverflow: true, scrollWidth: 500, overflowing: ['o'], innerScrollers: ['i'], clipped: ['c'],
    axe: [{ rule: 'color-contrast', count: 1, examples: ['x'] }, { rule: 'target-size', count: 1, examples: ['t'] }],
    consoleErrors: ['k'], focusMissing: ['f'], file: 'x.jpg', bytes: 0,
  };
  assert.deepEqual(problemsOf(shot, { isMobile: true }), [
    'load: e', 'page scrolls sideways (500px wide)', 'past right edge: o', 'app scroller scrolls sideways: i',
    'clipped text: c', 'contrast: 1 element(s), e.g. x', 'console: k', 'no focus ring: f',
    'screenshot x.jpg is empty', 'small tap targets: 1, e.g. t',
  ]);
});
