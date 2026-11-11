// The shipped tsconfig presets (@nish/ui/tsconfig/*.json) must parse and resolve their extends chain.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const dirs = [];
after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function show(preset) {
  const dir = mkdtempSync(join(tmpdir(), 'nish-tsconfig-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'a.ts'), 'export const a = 1;\n');
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: resolve(root, 'tsconfig', preset).split('\\').join('/'), include: ['a.ts'] }));
  return JSON.parse(execFileSync(process.execPath, [tsc, '--showConfig', '-p', dir], { encoding: 'utf8' })).compilerOptions;
}

test('base is strict and bundler-resolved', () => {
  const o = show('base.json');
  assert.equal(o.strict, true);
  assert.equal(o.moduleResolution, 'bundler');
  assert.equal(o.target, 'es2023');
});

test('react adds the DOM and react-jsx', () => {
  const o = show('react.json');
  assert.equal(o.jsx, 'react-jsx');
  assert.ok(o.lib.includes('dom'));
  assert.deepEqual(o.types, ['vite/client']);
  assert.equal(o.strict, true);
});

test('node uses NodeNext and node types', () => {
  const o = show('node.json');
  assert.equal(o.module, 'nodenext');
  assert.deepEqual(o.types, ['node']);
  // Inherited from base: a node app built with tsc on this preset emits nothing unless it sets noEmit:false and outDir.
  assert.equal(o.noEmit, true);
});
