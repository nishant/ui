import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { NPM_NAME, compareVersions, main, plan, publishManifest } from './npm-publish.mjs';

const base = { tag: 'v1.1.0', version: '1.1.0', distOk: true, published: ['1.0.0'] };

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

test('a package that is not on npm fails: trusted publishing cannot create it', () => {
  const d = plan({ ...base, published: null });
  assert.equal(d.action, 'fail');
  assert.match(d.reason, /not on npm/);
});

test('a new version publishes as latest with no token (trusted publishing)', () => {
  const d = plan(base);
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

test('a dry run leaves package.json byte-identical', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'npm-publish-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'dist', 'esm'), { recursive: true });
  writeFileSync(join(dir, 'dist', 'esm', 'index.js'), '');
  const text = '{"name":"@nish/ui","version":"1.1.0","scripts":{"x":"y"}}\n';
  writeFileSync(join(dir, 'package.json'), text);
  let seen = '';
  const code = await main([dir, '--tag', 'v1.1.0', '--dry-run'], {
    publishedVersions: async () => ['1.0.0'],
    runNpm: (args, cwd) => {
      seen = readFileSync(join(cwd, 'package.json'), 'utf8');
      assert.ok(args.includes('--dry-run'));
    },
  });
  assert.equal(code, 0);
  assert.match(seen, /"name": "nish-ui"/);
  assert.equal(readFileSync(join(dir, 'package.json'), 'utf8'), text);
});
