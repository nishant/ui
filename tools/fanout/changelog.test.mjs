import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sections } from './changelog.mjs';

const real = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');

const sample = `# Changelog

## [0.3.0] - 2026-01-03

### Behavior changes

- Something breaks.

## [0.2.1] - 2026-01-02

### Fixed

- A bug.

## [0.2.0] - 2026-01-01

### Added

- A thing.
`;

test('single version', () => {
  const r = sections(sample, 'v0.2.0', 'v0.2.1');
  assert.match(r.markdown, /^### \[0\.2\.1\] - 2026-01-02/);
  assert.match(r.markdown, /#### Fixed/);
  assert.doesNotMatch(r.markdown, /0\.2\.0|0\.3\.0/);
  assert.equal(r.behaviorChanges, false);
});

test('skipped versions come newest first and include the upper bound only', () => {
  const r = sections(sample, 'v0.2.0', 'v0.3.0');
  assert.ok(r.markdown.indexOf('[0.3.0]') < r.markdown.indexOf('[0.2.1]'));
  assert.doesNotMatch(r.markdown, /\[0\.2\.0\]/);
  assert.equal(r.behaviorChanges, true);
});

test('real CHANGELOG 0.6.1 -> 0.7.1 spans 0.7.0 and 0.7.1 and flags behavior changes', () => {
  const r = sections(real, 'v0.6.1', 'v0.7.1');
  assert.ok(r.markdown.indexOf('[0.7.1]') < r.markdown.indexOf('[0.7.0]'));
  assert.doesNotMatch(r.markdown, /\[0\.6\.1\]/);
  assert.equal(r.behaviorChanges, true);
  assert.match(r.markdown, /#### Behavior changes/);
});

test('real CHANGELOG 0.7.0 -> 0.7.1 has no behavior changes', () => {
  const r = sections(real, 'v0.7.0', 'v0.7.1');
  assert.equal(r.behaviorChanges, false);
  assert.match(r.markdown, /\[0\.7\.1\]/);
});

test('no section for the tag', () => {
  assert.deepEqual(sections(sample, 'v0.3.0', 'v0.4.0'), { markdown: 'No CHANGELOG entry for v0.4.0.', behaviorChanges: false });
  assert.deepEqual(sections('', 'v0.1.0', 'v0.2.0'), { markdown: 'No CHANGELOG entry for v0.2.0.', behaviorChanges: false });
});

test('unparseable from takes only the target version', () => {
  const r = sections(sample, null, 'v0.2.1');
  assert.match(r.markdown, /\[0\.2\.1\]/);
  assert.doesNotMatch(r.markdown, /\[0\.3\.0\]|\[0\.2\.0\]/);
});
