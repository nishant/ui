import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changelogSection } from './changelog-section.mjs';

const LOG = [
  '# Changelog',
  '',
  'Intro.',
  '',
  '## [11.0.0] - 2027-01-01',
  '',
  '- eleven',
  '',
  '## [1.0.0-rc] - 2026-10-30',
  '',
  '- rc',
  '',
  '## [1.0.0] - 2026-10-31',
  '',
  '### Added',
  '',
  '- one',
  '',
  '## [0.10.0] - 2026-10-30',
  '',
  '- ten',
  '',
].join('\n');

test('a middle section, without its heading', () => {
  assert.equal(changelogSection(LOG, '1.0.0'), '### Added\n\n- one');
});

test('the last section runs to the end', () => {
  assert.equal(changelogSection(LOG, '0.10.0'), '- ten');
});

test('a missing version is null', () => {
  assert.equal(changelogSection(LOG, '2.0.0'), null);
});

test('does not match a prerelease or a longer version', () => {
  assert.equal(changelogSection(LOG.replace('## [1.0.0] - 2026-10-31', '## [1.0.1] - x'), '1.0.0'), null);
  assert.equal(changelogSection(LOG, '1.0.0-rc'), '- rc');
  assert.equal(changelogSection('## [11.0.0]\n\n- x', '1.0.0'), null);
});

test('CRLF files', () => {
  assert.equal(changelogSection(LOG.replace(/\n/g, '\r\n'), '1.0.0'), '### Added\n\n- one');
});
