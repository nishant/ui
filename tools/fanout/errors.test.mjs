// A repo the fan-out cannot reach, or any other error outcome, fails the job after the summary is
// written; held, checking, skipped and current outcomes do not.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { CmdError, isNoAccess } from './gh.mjs';
import { Run, exitCode, explainError, main, resultLine, tokenHint, tokenWriteHint } from './fanout.mjs';

const GRAPHQL_MISSING = "GraphQL: Could not resolve to a Repository with the name 'nishant/inbox'. (repository)";
const HINT =
  "FLEET_TOKEN cannot reach nishant/inbox: add it to the token's Repository access (github.com → Settings → Developer settings → Fine-grained tokens)";

const ok = { code: 0, stdout: '{"full_name":"x"}', stderr: '' };
const notFound = { code: 1, stdout: '{"message":"Not Found","status":"404"}', stderr: 'gh: Not Found (HTTP 404)' };

/** A Run whose GitHub calls are stubbed: `probe` answers the repo check, the rest are given. */
function stubRun({ probe = ok, uiBump, settleDeps = async () => [] } = {}) {
  const run = new Run({ dry: false, wait: 0 });
  run.say = () => {};
  run.probe = () => probe;
  run.uiBump = uiBump ?? (async () => assert.fail('uiBump must not run'));
  run.settleDeps = settleDeps;
  return run;
}

const npm = (repo) => ({ repo, ui: 'npm', uiDir: '.', uiExtraDirs: [], base: 'master', fold: true });

test('isNoAccess: GraphQL unresolved repository, REST 404 and 403', () => {
  assert.equal(isNoAccess(GRAPHQL_MISSING), true);
  assert.equal(isNoAccess('gh: Not Found (HTTP 404)'), true);
  assert.equal(isNoAccess('gh: Resource not accessible by personal access token (HTTP 403)'), true);
  assert.equal(isNoAccess(new CmdError('gh', ['pr', 'list'], { code: 1, stderr: GRAPHQL_MISSING, stdout: '' })), true);
  assert.equal(isNoAccess('gh pr create finished but the PR was not found'), false);
  assert.equal(isNoAccess('gh: Server Error (HTTP 502)'), false);
});

test('tokenHint: the exact summary text for the token case', () => {
  assert.equal(tokenHint('nishant/inbox'), HINT);
  assert.equal(resultLine({ repo: 'nishant/inbox', result: 'error', detail: tokenHint('nishant/inbox') }), `- **nishant/inbox**: error, ${HINT}`);
});

test('repo: a repo the token cannot see is one error naming the token, and fails the job', async () => {
  const run = stubRun({ probe: notFound });
  const out = await run.repo(npm('nishant/inbox'), 'v0.10.0');
  assert.deepEqual(out, [{ repo: 'nishant/inbox', result: 'error', detail: HINT }]);
  assert.equal(exitCode(out), 1);
});

test('repo: a probe that fails another way is still an error', async () => {
  const run = stubRun({ probe: { code: 1, stdout: '', stderr: 'gh: Server Error (HTTP 502)' } });
  const out = await run.repo(npm('nishant/inbox'), 'v0.10.0');
  assert.equal(out[0].result, 'error');
  assert.equal(out[0].detail, 'Could not read nishant/inbox: gh: Server Error (HTTP 502)');
  assert.equal(exitCode(out), 1);
});

test('repo: GraphQL "Could not resolve to a Repository" from a later call names the token', async () => {
  const run = stubRun({
    uiBump: async () => {
      throw new CmdError('gh', ['pr', 'list', '-R', 'nishant/inbox'], { code: 1, stderr: GRAPHQL_MISSING, stdout: '' });
    },
  });
  const out = await run.repo(npm('nishant/inbox'), 'v0.10.0');
  assert.deepEqual(out, [{ repo: 'nishant/inbox', result: 'error', detail: HINT }]);
  assert.equal(exitCode(out), 1);
});

test('repo: a 403 on a write names the token permissions and quotes GitHub', async () => {
  const msg = 'gh pr create -R nishant/inbox failed (exit 1)\npull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)';
  const run = stubRun({ uiBump: async () => ({ repo: 'nishant/inbox', result: 'error', detail: msg }) });
  const [r] = await run.repo(npm('nishant/inbox'), 'v0.10.0');
  assert.equal(r.result, 'error');
  assert.ok(r.detail.startsWith(tokenWriteHint('nishant/inbox')));
  assert.match(r.detail, /GitHub said: pull request create failed: GraphQL: Resource not accessible/);
});

test('explainError: a 404 after the probe passed is a missing file, left as it was', () => {
  const r = { repo: 'a/b', result: 'error', detail: 'gh: Not Found (HTTP 404)' };
  assert.equal(explainError(r), r);
  const held = { repo: 'a/b', result: 'held', detail: 'Merge failed: HTTP 403' };
  assert.equal(explainError(held), held);
});

test('repo: a held PR (no checks ran) is not an error and does not fail the job', async () => {
  const held = { repo: 'nishant/status', result: 'held', detail: 'No checks ran on this PR', pr: 12 };
  const run = stubRun({ uiBump: async () => held });
  const out = await run.repo(npm('nishant/status'), 'v0.10.0');
  assert.deepEqual(out, [held]);
  assert.equal(exitCode(out), 0);
});

test('exitCode: only error outcomes (or a failed revert) fail', () => {
  const outcomes = ['current', 'held', 'checking', 'skipped', 'merged', 'reverted', 'dry-run'];
  assert.equal(exitCode(outcomes.map((result) => ({ repo: 'a/b', result }))), 0);
  assert.equal(exitCode([{ repo: 'a/b', result: 'current' }, { repo: 'a/b', result: 'error' }]), 1);
  assert.equal(exitCode([], true), 1);
  assert.equal(exitCode([]), 0);
});

async function runMain(fleet, runFor) {
  const dir = mkdtempSync(join(tmpdir(), 'fanout-main-'));
  const saved = { token: process.env.GH_TOKEN, summary: process.env.GITHUB_STEP_SUMMARY, actions: process.env.GITHUB_ACTIONS };
  const log = console.log;
  try {
    writeFileSync(join(dir, 'fleet.yaml'), fleet);
    const summary = join(dir, 'summary.md');
    writeFileSync(summary, '');
    process.env.GH_TOKEN = 'test-token';
    process.env.GITHUB_STEP_SUMMARY = summary;
    process.env.GITHUB_ACTIONS = 'true';
    const printed = [];
    console.log = (line) => printed.push(String(line));
    const code = await main(['--fleet', join(dir, 'fleet.yaml'), '--tag', 'v0.10.0'], { makeRun: runFor });
    return { code, summary: readFileSync(summary, 'utf8'), printed };
  } finally {
    console.log = log;
    for (const [k, v] of [['GH_TOKEN', saved.token], ['GITHUB_STEP_SUMMARY', saved.summary], ['GITHUB_ACTIONS', saved.actions]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

test('main: an unreachable repo writes the token line to the summary, then exits 1', async () => {
  const fleet = '- repo: nishant/status\n  ui: npm\n- repo: nishant/inbox\n  ui: npm\n';
  const { code, summary, printed } = await runMain(fleet, () => {
    const run = new Run({ dry: false, wait: 0 });
    run.probe = (R) => (R === 'nishant/inbox' ? notFound : ok);
    run.uiBump = async (entry) => ({ repo: entry.repo, result: 'current', detail: 'on v0.10.0' });
    run.settleDeps = async () => [];
    return run;
  });
  assert.equal(code, 1);
  assert.equal(summary, `- **nishant/status**: current, on v0.10.0\n- **nishant/inbox**: error, ${HINT}\n`);
  assert.ok(printed.includes(`::error title=fan-out nishant/inbox::${HINT}`));
});

test('main: held and current repos exit 0', async () => {
  const fleet = '- repo: nishant/status\n  ui: npm\n- repo: nishant/trackers\n  ui: npm\n';
  const { code, summary, printed } = await runMain(fleet, () => {
    const run = new Run({ dry: false, wait: 0 });
    run.probe = () => ok;
    run.uiBump = async (entry) =>
      entry.repo === 'nishant/status'
        ? { repo: entry.repo, result: 'current', detail: 'on v0.10.0' }
        : { repo: entry.repo, result: 'held', detail: 'No checks ran on this PR', pr: 3 };
    run.settleDeps = async () => [];
    return run;
  });
  assert.equal(code, 0);
  assert.match(summary, /- \*\*nishant\/trackers\*\*: held, No checks ran on this PR \(#3\)/);
  assert.equal(printed.some((l) => l.startsWith('::error')), false);
});
