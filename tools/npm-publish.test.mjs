import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NPM_NAME, compareVersions, plan, publishManifest } from './npm-publish.mjs';

const base = { tag: 'v1.1.0', version: '1.1.0', distOk: true, published: ['1.0.0'], hasToken: false };

test('compareVersions orders numerically, not as strings', () => {
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('1.0.2', '1.0.10'), -1);
  assert.equal(compareVersions('2.0.0', '2.0.0'), 0);
});

test('a tag whose package.json version differs fails', () => {
  const d = plan({ ...base, tag: 'v1.2.0' });
  assert.equal(d.action, 'fail');
  assert.match(d.reason, /v1\.2\.0 has package\.json version 1\.1\.0/);
});

test('a checkout without dist/ fails', () => {
  assert.equal(plan({ ...base, distOk: false }).action, 'fail');
});

test('a version already on npm is skipped, so reruns are safe', () => {
  const d = plan({ ...base, published: ['1.0.0', '1.1.0'] });
  assert.equal(d.action, 'skip');
  assert.match(d.reason, /already on npm/);
});

test('the first publish without a token is skipped with the reason, not failed', () => {
  const d = plan({ ...base, published: null, hasToken: false });
  assert.equal(d.action, 'skip');
  assert.match(d.reason, /NPM_TOKEN is not set/);
});

test('the first publish with a token goes out as latest', () => {
  assert.deepEqual(plan({ ...base, published: null, hasToken: true }), {
    action: 'publish',
    reason: `publish ${NPM_NAME}@1.1.0 as latest`,
    distTag: 'latest',
  });
});

test('once the package exists, no token is needed (trusted publishing)', () => {
  const d = plan({ ...base, hasToken: false });
  assert.equal(d.action, 'publish');
  assert.equal(d.distTag, 'latest');
});

test('an older version than the newest on npm never takes latest', () => {
  const d = plan({ ...base, tag: 'v1.0.2', version: '1.0.2', published: ['1.1.0', '1.0.10'] });
  assert.equal(d.distTag, 'previous');
});

test('tag null trusts package.json (local dry runs)', () => {
  assert.equal(plan({ ...base, tag: null }).action, 'publish');
});

test('the manifest is renamed and loses scripts and devDependencies', () => {
  const m = publishManifest({
    name: '@nish/ui',
    version: '1.1.0',
    license: 'MIT',
    exports: { '.': './dist/index.js' },
    scripts: { build: 'x' },
    devDependencies: { vite: '^8' },
    dependencies: { clsx: '^2' },
  });
  assert.equal(m.name, NPM_NAME);
  assert.equal(m.scripts, undefined);
  assert.equal(m.devDependencies, undefined);
  assert.deepEqual(m.dependencies, { clsx: '^2' });
  assert.deepEqual(m.exports, { '.': './dist/index.js' });
});

test('an old tag without metadata gets repository (provenance needs it), homepage, bugs and license', () => {
  const m = publishManifest({ name: '@nish/ui', version: '1.0.2' });
  assert.equal(m.repository.url, 'git+https://github.com/nishant/ui.git');
  assert.equal(m.homepage, 'https://design.nish.software');
  assert.equal(m.bugs.url, 'https://github.com/nishant/ui/issues');
  assert.equal(m.license, 'MIT');
});

test('metadata a tag already has is kept', () => {
  const m = publishManifest({ name: '@nish/ui', version: '1.1.0', homepage: 'https://example.com', license: 'ISC' });
  assert.equal(m.homepage, 'https://example.com');
  assert.equal(m.license, 'ISC');
});
