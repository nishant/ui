import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Run } from './fanout.mjs';

function stubbed(current) {
  const run = new Run({ dry: false, wait: 0 });
  const posts = [];
  run.view = () => ({ number: 7, headRefOid: 'abc', createdAt: '2020-01-01T00:00:00Z' });
  run.readChecks = () => ({ checks: 'failure', current });
  run.post = (R, sha, state, description) => posts.push({ state, description });
  return { run, posts };
}

test('settle: an already-held PR is held again without flashing pending', async () => {
  const { run, posts } = stubbed({ state: 'failure', description: 'Checks failed' });
  const r = await run.settle({ repo: 'a/b', fold: false }, { number: 7 }, { kind: 'deps' });
  assert.equal(r.result, 'held');
  assert.equal(posts.some((p) => p.state === 'pending'), false);
});

test('settle: a new hold posts failure once, never pending', async () => {
  const { run, posts } = stubbed(null);
  const r = await run.settle({ repo: 'a/b', fold: false }, { number: 7 }, { kind: 'deps' });
  assert.equal(r.result, 'held');
  assert.deepEqual(posts.map((p) => p.state), ['failure']);
});
