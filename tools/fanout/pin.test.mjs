import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, isPatch, major, parse, pinFile, pinOf, rewritePin } from './pin.mjs';

const pkg = (spec, section = 'dependencies') =>
  `{\n  "name": "app",\n  "${section}": {\n    "@nish/ui": "${spec}",\n    "react": "^19.0.0"\n  }\n}\n`;

test('pinOf: codeload tarball', () => {
  assert.equal(pinOf('npm', pkg('https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v0.7.0')), 'v0.7.0');
});
test('pinOf: github: and #v forms', () => {
  assert.equal(pinOf('npm', pkg('github:nishant/ui#v0.6.1')), 'v0.6.1');
  assert.equal(pinOf('pnpm', pkg('git+https://github.com/nishant/ui.git#v0.5.3')), 'v0.5.3');
});
test('pinOf: devDependencies', () => {
  assert.equal(pinOf('npm', pkg('github:nishant/ui#v0.7.0', 'devDependencies')), 'v0.7.0');
});
test('pinOf: vendored ui.json', () => {
  assert.equal(pinOf('vendored', '{ "tag": "v0.7.1", "files": [] }'), 'v0.7.1');
  assert.equal(pinOf('vendored', '{ "tag": "main" }'), null);
});
test('pinOf: no pin, no tag in the spec, bad json', () => {
  assert.equal(pinOf('npm', '{ "dependencies": { "react": "1" } }'), null);
  assert.equal(pinOf('npm', pkg('file:../ui')), null);
  assert.equal(pinOf('npm', 'not json'), null);
});

test('rewritePin keeps formatting and rewrites the whole spec to the codeload tarball', () => {
  const before = pkg('github:nishant/ui#v0.7.0');
  const after = rewritePin('npm', before, 'v0.7.1');
  assert.equal(
    after,
    before.replace('github:nishant/ui#v0.7.0', 'https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v0.7.1'),
  );
  const tabs = '{\n\t"dependencies": {\n\t\t"@nish/ui" :   "github:nishant/ui#v0.7.0"\n\t}\n}';
  assert.match(rewritePin('npm', tabs, 'v0.7.1'), /"@nish\/ui" :   "https:\/\/codeload\.github\.com\/nishant\/ui\/tar\.gz\/refs\/tags\/v0\.7\.1"/);
});
test('rewritePin: vendored and devDependencies', () => {
  assert.equal(rewritePin('vendored', '{\n  "tag": "v0.7.0",\n  "x": 1\n}', 'v0.7.1'), '{\n  "tag": "v0.7.1",\n  "x": 1\n}');
  assert.match(rewritePin('npm', pkg('github:nishant/ui#v0.7.0', 'devDependencies'), 'v0.8.0'), /refs\/tags\/v0\.8\.0/);
});
test('rewritePin: no pin throws with the path', () => {
  assert.throws(() => rewritePin('npm', '{}', 'v0.7.1', 'apps/web/package.json'), /No @nish\/ui pin in apps\/web\/package\.json/);
  assert.throws(() => rewritePin('vendored', '{}', 'v0.7.1', 'ui.json'), /No @nish\/ui pin in ui\.json/);
});

test('pinFile', () => {
  assert.equal(pinFile('npm', '.'), 'package.json');
  assert.equal(pinFile('pnpm', 'apps/web'), 'apps/web/package.json');
  assert.equal(pinFile('vendored', '.'), 'ui.json');
});

test('semver helpers', () => {
  assert.deepEqual(parse('v0.7.1'), [0, 7, 1]);
  assert.equal(parse('main'), null);
  assert.ok(compare('v0.10.0', 'v0.9.9') > 0);
  assert.equal(compare('v1.2.3', 'v1.2.3'), 0);
  assert.equal(isPatch('v0.7.0', 'v0.7.1'), true);
  assert.equal(isPatch('v0.6.1', 'v0.7.0'), false);
  assert.equal(isPatch(null, 'v0.7.0'), false);
  assert.equal(major('v2.0.0'), 2);
});
