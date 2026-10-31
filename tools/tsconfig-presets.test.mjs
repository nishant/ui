// The shipped tsconfig presets (@nish/ui/tsconfig/*.json) must parse and resolve their extends chain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const tsc = resolve('node_modules/typescript/bin/tsc');

function show(preset) {
  const dir = mkdtempSync(join(tmpdir(), 'nish-tsconfig-'));
  writeFileSync(join(dir, 'a.ts'), 'export const a = 1;\n');
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: resolve('tsconfig', preset).split('\\').join('/'), include: ['a.ts'] }));
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
  assert.equal(o.strict, true);
});

test('node uses NodeNext and node types', () => {
  const o = show('node.json');
  assert.equal(o.module, 'nodenext');
  assert.deepEqual(o.types, ['node']);
});
