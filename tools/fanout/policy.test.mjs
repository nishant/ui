import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeChecks, cut, decide, isAdoptedHead, limitFor } from './policy.mjs';

const okFold = { newProblems: 0, baseOk: true, maxDiffPct: 0 };
const ui = (over) => ({ kind: 'ui', from: 'v0.7.0', to: 'v0.7.1', behaviorChanges: false, checks: 'success', fold: okFold, ...over });

test('row 1: pending checks wait', () => {
  assert.deepEqual(decide(ui({ checks: 'pending' })), { action: 'wait', reason: 'Waiting for checks' });
});
test('row 2: missing checks hold', () => {
  assert.deepEqual(decide(ui({ checks: 'missing' })), { action: 'hold', reason: 'No checks ran on this PR' });
});
test('row 3: failed checks hold', () => {
  assert.deepEqual(decide(ui({ checks: 'failure' })), { action: 'hold', reason: 'Checks failed' });
});
test('row 4: major release from 1.0 holds, 0.x majors do not', () => {
  assert.equal(decide(ui({ from: 'v1.4.0', to: 'v2.0.0' })).reason, 'Major release: a session has to adopt it');
  assert.equal(decide(ui({ from: 'v0.9.0', to: 'v1.0.0' })).reason, 'Major release: a session has to adopt it');
  assert.equal(decide(ui({ from: 'v0.6.1', to: 'v0.7.0' })).action, 'merge');
});
test('row 5: behavior changes hold', () => {
  assert.deepEqual(decide(ui({ behaviorChanges: true })), {
    action: 'hold',
    reason: 'Release notes list behavior changes: a session has to adopt it',
  });
});
test('behavior changes do not hold dependency PRs', () => {
  assert.equal(decide({ kind: 'deps', behaviorChanges: true, checks: 'success', fold: okFold }).action, 'merge');
});
test('row 6: missing fold report holds', () => {
  assert.deepEqual(decide(ui({ fold: 'missing' })), { action: 'hold', reason: 'Fold report missing' });
});
test('row 7: new problems hold', () => {
  assert.equal(decide(ui({ fold: { ...okFold, newProblems: 2 } })).reason, 'Fold check: 2 new problem(s)');
});
test('row 8: base not rendered holds', () => {
  assert.equal(decide(ui({ fold: { ...okFold, baseOk: false, maxDiffPct: null } })).reason, 'Fold check could not render the base branch');
});
test('row 9: diff over the limit holds with the limit and kind', () => {
  assert.equal(
    decide(ui({ fold: { ...okFold, maxDiffPct: 1.5 } })).reason,
    'Pages changed 1.5% (limit 1% for a patch update)',
  );
  assert.equal(
    decide(ui({ from: 'v0.6.1', to: 'v0.7.0', fold: { ...okFold, maxDiffPct: 11 } })).reason,
    'Pages changed 11% (limit 10% for a minor update)',
  );
  assert.equal(
    decide({ kind: 'deps', checks: 'success', fold: { ...okFold, maxDiffPct: 2 } }).reason,
    'Pages changed 2% (limit 1% for a dependency update)',
  );
});
test('row 9: at the limit merges, null diff merges', () => {
  assert.equal(decide(ui({ fold: { ...okFold, maxDiffPct: 1 } })).action, 'merge');
  assert.equal(decide(ui({ fold: { ...okFold, maxDiffPct: null } })).action, 'merge');
});
test('row 10: otherwise merge', () => {
  assert.deepEqual(decide(ui({})), { action: 'merge', reason: 'Checks passed' });
});
test('fold null skips rules 6-9', () => {
  assert.equal(decide(ui({ fold: null })).action, 'merge');
});
test('first matching rule wins', () => {
  assert.equal(decide(ui({ checks: 'failure', behaviorChanges: true, fold: 'missing' })).reason, 'Checks failed');
  assert.equal(decide(ui({ behaviorChanges: true, fold: 'missing' })).reason.startsWith('Release notes'), true);
});
test('unparseable from counts as a minor and never as a major', () => {
  assert.equal(limitFor('ui', null, 'v0.7.1'), 10);
  assert.equal(limitFor('ui', 'main', 'v1.0.0'), 10);
  assert.equal(decide(ui({ from: null, to: 'v1.0.0' })).action, 'merge');
  assert.equal(decide(ui({ from: null, fold: { ...okFold, maxDiffPct: 5 } })).action, 'merge');
});
test('descriptions are cut to 140 characters', () => {
  const long = 'x'.repeat(300);
  assert.equal(cut(long).length, 140);
  assert.equal(cut('short'), 'short');
});

test('computeChecks: pending while any check run is not completed', () => {
  assert.equal(computeChecks({ checkRuns: [{ status: 'completed', conclusion: 'success' }, { status: 'in_progress', conclusion: null }] }), 'pending');
  assert.equal(computeChecks({ checkRuns: [{ status: 'queued', conclusion: null }] }), 'pending');
});
test('computeChecks: failure conclusions', () => {
  for (const c of ['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure']) {
    assert.equal(computeChecks({ checkRuns: [{ status: 'completed', conclusion: c }] }), 'failure', c);
  }
  assert.equal(computeChecks({ checkRuns: [{ status: 'completed', conclusion: 'skipped' }, { status: 'completed', conclusion: 'success' }] }), 'success');
});
test('computeChecks: no checks is pending when young, missing later', () => {
  assert.equal(computeChecks({ checkRuns: [], young: true }), 'pending');
  assert.equal(computeChecks({ checkRuns: [], young: false }), 'missing');
});
test('computeChecks: commit statuses count', () => {
  const done = [{ status: 'completed', conclusion: 'success' }];
  assert.equal(computeChecks({ checkRuns: done, statuses: [{ state: 'pending' }] }), 'pending');
  assert.equal(computeChecks({ checkRuns: done, statuses: [{ state: 'error' }] }), 'failure');
  assert.equal(computeChecks({ checkRuns: [], statuses: [{ state: 'success' }] }), 'success');
});
test('computeChecks fallback (check runs 403): workflow runs stand in', () => {
  const run = (over) => ({ workflow_id: 1, event: 'pull_request', status: 'completed', conclusion: 'success', created_at: '2026-10-28T10:00:00Z', ...over });
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [run()] }), 'success');
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [run({ status: 'in_progress', conclusion: null })] }), 'pending');
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [run({ conclusion: 'startup_failure' })] }), 'failure');
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [run({ conclusion: 'cancelled' })] }), 'failure');
  // a rerun that passed replaces the failed earlier run of the same workflow
  assert.equal(
    computeChecks({ checkRuns: null, workflowRuns: [run({ conclusion: 'failure' }), run({ created_at: '2026-10-28T11:00:00Z' })] }),
    'success',
  );
  // a 403 with no workflow runs is only "missing" once the PR is old, never straight away
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [], young: true }), 'pending');
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [], young: false }), 'missing');
  // statuses combine with workflow runs
  assert.equal(computeChecks({ checkRuns: null, workflowRuns: [run()], statuses: [{ state: 'failure' }] }), 'failure');
});

test('isAdoptedHead tells fan-out commits from session commits', () => {
  assert.equal(isAdoptedHead({ author: 'ui fan-out', message: 'Move @nish/ui to v0.8.0' }), false);
  assert.equal(isAdoptedHead({ author: 'Nishant Arora', message: 'Adopt v0.8.0' }), true);
  assert.equal(isAdoptedHead(null), false);
});
test('adopted behavior-changes PR merges; unadopted holds', () => {
  const base = { kind: 'ui', behaviorChanges: true, checks: 'success', fold: null };
  assert.equal(decide({ ...base, adopted: true }).action, 'merge');
  assert.equal(decide({ ...base, adopted: false }).action, 'hold');
});

test('computeChecks: a cancelled run replaced by a newer passing run of the same check does not fail', () => {
  const checkRuns = [
    { id: 1, name: 'fold / fold', status: 'completed', conclusion: 'cancelled' },
    { id: 2, name: 'check', status: 'completed', conclusion: 'success' },
    { id: 3, name: 'fold / fold', status: 'completed', conclusion: 'success' },
    { id: 4, name: 'check', status: 'completed', conclusion: 'success' },
  ];
  assert.equal(computeChecks({ checkRuns }), 'success');
});

test('computeChecks: a newer failing run of the same check still fails', () => {
  const checkRuns = [
    { id: 1, name: 'check', status: 'completed', conclusion: 'success' },
    { id: 2, name: 'check', status: 'completed', conclusion: 'failure' },
  ];
  assert.equal(computeChecks({ checkRuns }), 'failure');
});

test('computeChecks: a skipped run never hides an earlier real result', () => {
  const checkRuns = [
    { id: 1, name: 'fold / fold', status: 'completed', conclusion: 'failure' },
    { id: 2, name: 'fold / fold', status: 'completed', conclusion: 'skipped' },
  ];
  assert.equal(computeChecks({ checkRuns }), 'failure');
});
