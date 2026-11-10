import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ciGate, parseLog } from './release-gate.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const run = (headSha, status = 'completed', conclusion = 'success') => ({ headSha, status, conclusion });

test('green HEAD passes', () => {
  assert.deepEqual(ciGate([{ sha: A, message: 'x' }], [run(A)]), { ok: true, sha: A });
});

test('[skip ci] HEAD on top of a green commit passes on the green one', () => {
  const commits = [
    { sha: A, message: 'docs [skip ci]' },
    { sha: B, message: 'feat' },
  ];
  assert.deepEqual(ciGate(commits, [run(B)]), { ok: true, sha: B });
});

test('pending HEAD is refused', () => {
  const r = ciGate([{ sha: A, message: 'x' }], [run(A, 'in_progress', null)]);
  assert.equal(r.ok, false);
  assert.match(r.reason, /still running for aaaaaaa/);
});

test('failed HEAD is refused', () => {
  const r = ciGate([{ sha: A, message: 'x' }], [run(A, 'completed', 'failure')]);
  assert.equal(r.ok, false);
  assert.match(r.reason, /not green for aaaaaaa \(failure\)/);
});

test('HEAD with no run and no skip marker is refused', () => {
  const r = ciGate(
    [
      { sha: A, message: 'x' },
      { sha: B, message: 'y' },
    ],
    [run(B)],
  );
  assert.equal(r.ok, false);
  assert.match(r.reason, /has not run for aaaaaaa/);
});

test('[skip ci] on top of a failed commit is refused', () => {
  const commits = [
    { sha: A, message: 'chore [ci skip]' },
    { sha: B, message: 'feat' },
  ];
  const r = ciGate(commits, [run(B, 'completed', 'failure')]);
  assert.equal(r.ok, false);
  assert.match(r.reason, /not green for bbbbbbb/);
});

test('running out of commits is refused', () => {
  const r = ciGate([{ sha: A, message: '[skip ci]' }], []);
  assert.equal(r.reason, 'no ci.yml run in the last 30 commits');
});

test('parseLog round trip', () => {
  const text = `${A}\x1ffirst line\n\nbody\x1e\n${B}\x1fsecond\x1e`;
  assert.deepEqual(parseLog(text), [
    { sha: A, message: 'first line\n\nbody' },
    { sha: B, message: 'second' },
  ]);
});
