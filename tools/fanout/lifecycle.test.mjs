// The bump PR lifecycle (uiBump, settle, watchDeploy, hold) with every GitHub and git call stubbed.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { CmdError, redact } from './gh.mjs';
import { Run, explainError, io, prBody } from './fanout.mjs';
import { isForbidden, isNoAccess } from './gh.mjs';

process.env.FANOUT_POLL_MS = '1';

const real = { ...io };
let log;
let world;

const pkg = (tag) => JSON.stringify({ dependencies: { '@nish/ui': `npm:nish-ui@${tag.replace(/^v/, '')}` } });

/** world: { prs: {open:[], merged:[]}, head: {sha: {author,message}}, files: {ref: {path: text}}, statuses: {sha: [...]}, runs: [] } */
function install() {
  log = { closed: [], posts: [], created: 0 };
  io.git = (args) => {
    if (args[0] === 'rev-parse') return { code: 0, stdout: 'x', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  io.gh = (args) => {
    if (args[0] === 'pr' && args[1] === 'list') {
      const state = args[args.indexOf('--state') + 1];
      return { code: 0, stdout: JSON.stringify(state === 'merged' ? world.prs.merged ?? [] : world.prs.open ?? []), stderr: '' };
    }
    if (args[0] === 'pr' && args[1] === 'close') {
      log.closed.push({ number: Number(args[2]), comment: args[args.indexOf('--comment') + 1] });
      return { code: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'pr' && args[1] === 'merge') return { code: 0, stdout: '', stderr: '' };
    if (args[0] === 'pr' && args[1] === 'view') {
      return { code: 0, stdout: JSON.stringify({ number: 7, headRefOid: 'head1', mergeCommit: { oid: 'mergesha' }, title: 'Move' }), stderr: '' };
    }
    return { code: 0, stdout: '', stderr: '' };
  };
  io.api = (path, opts = {}) => {
    const m = /contents\/(.+)\?ref=(.+)$/.exec(path);
    if (m) {
      const text = world.files?.[decodeURIComponent(m[2])]?.[m[1]];
      if (text === undefined) throw new CmdError('gh', ['api', path], { code: 1, stderr: 'gh: Not Found (HTTP 404)', stdout: '' });
      return { code: 0, stdout: text, stderr: '' };
    }
    if (opts.method === 'POST') {
      log.posts.push({ path, ...opts.fields });
      return { code: 0, stdout: '{}', stderr: '' };
    }
    return { code: 0, stdout: '{}', stderr: '' };
  };
  io.apiJson = (path) => {
    let m = /commits\/([^/?]+)\/status/.exec(path);
    if (m) return { statuses: world.statuses?.[m[1]] ?? [] };
    m = /^repos\/[^/]+\/[^/]+\/commits\/([^/?]+)$/.exec(path);
    if (m) {
      const h = world.head?.[m[1]];
      return h ? { commit: { author: { name: h.author }, message: h.message } } : null;
    }
    if (/actions\/workflows\/.+\/runs/.test(path)) return { workflow_runs: world.runs ?? [] };
    throw new Error(`unstubbed apiJson ${path}`);
  };
}

beforeEach(() => {
  world = { prs: { open: [], merged: [] }, head: {}, files: {}, statuses: {}, runs: [] };
  install();
});
afterEach(() => Object.assign(io, real));

const entry = (extra = {}) => ({ repo: 'a/b', ui: 'npm', uiDir: '.', uiExtraDirs: [], base: 'master', fold: false, deploy: 'deploy.yml', ...extra });
const bumpPr = (tag, extra = {}) => ({
  number: 7,
  title: `Move @nish/ui to ${tag}`,
  headRefName: `ui/${tag}`,
  headRefOid: 'head1',
  mergeable: 'MERGEABLE',
  author: { login: 'app/github-actions' },
  createdAt: '2020-01-01T00:00:00Z',
  isCrossRepository: false,
  headRepositoryOwner: { login: 'a' },
  ...extra,
});
const FANOUT = { author: 'ui fan-out', message: 'Move @nish/ui to v1.0.1' };
const SESSION = { author: 'Nish', message: 'Adopt v1.0.1' };

function newRun(waitMin = 0) {
  const run = new Run({ dry: false, wait: waitMin, npmHas: () => true });
  run.say = () => {};
  run.tagExists = () => true;
  return run;
}

test('uiBump: a conflicting adopted PR is held with a failure status and not closed', async () => {
  world.files.master = { 'package.json': pkg('v1.0.0') };
  world.prs.open = [bumpPr('v1.0.1', { mergeable: 'CONFLICTING' })];
  world.head.head1 = SESSION;
  const run = newRun();
  run.settle = () => assert.fail('must not settle');
  run.openBumpPr = () => assert.fail('must not reopen');
  const r = await run.uiBump(entry(), 'v1.0.1');
  assert.equal(r.result, 'held');
  assert.equal(r.pr, 7);
  assert.equal(r.detail, 'Conflicts with the base: a session has to merge the base into ui/v1.0.1');
  assert.deepEqual(log.closed, []);
  assert.equal(log.posts.length, 1);
  assert.equal(log.posts[0].state, 'failure');
});

test('uiBump: a conflicting fan-out PR is closed and reopened', async () => {
  world.files.master = { 'package.json': pkg('v1.0.0') };
  world.prs.open = [bumpPr('v1.0.1', { mergeable: 'CONFLICTING' })];
  world.head.head1 = FANOUT;
  const run = newRun();
  let opened = 0;
  run.openBumpPr = () => (opened++, { pr: bumpPr('v1.0.1') });
  run.settle = async () => ({ repo: 'a/b', result: 'checking' });
  await run.uiBump(entry(), 'v1.0.1');
  assert.deepEqual(log.closed.map((c) => c.number), [7]);
  assert.equal(opened, 1);
});

test('uiBump: older-tag PRs are closed as superseded', async () => {
  world.files.master = { 'package.json': pkg('v1.0.0') };
  world.prs.open = [bumpPr('v1.0.1', { number: 5, headRefName: 'ui/v1.0.1' })];
  const run = newRun();
  run.openBumpPr = () => ({ pr: bumpPr('v1.0.2', { number: 9 }) });
  run.settle = async () => ({ repo: 'a/b', result: 'checking' });
  await run.uiBump(entry(), 'v1.0.2');
  assert.deepEqual(log.closed, [{ number: 5, comment: 'Superseded by v1.0.2.' }]);
});

test('uiBump: an adopted head missing a folder is held, not topped up or closed', async () => {
  const e = entry({ uiExtraDirs: ['site'] });
  world.files.master = { 'package.json': pkg('v1.0.0'), 'site/package.json': pkg('v1.0.0') };
  world.files.head1 = { 'package.json': pkg('v1.0.1') };
  world.prs.open = [bumpPr('v1.0.1')];
  world.head.head1 = SESSION;
  const run = newRun();
  run.topUpBumpPr = () => assert.fail('must not top up');
  const r = await run.uiBump(e, 'v1.0.1');
  assert.equal(r.result, 'held');
  assert.match(r.detail, /^ui\/v1\.0\.1 lacks Could not read the pin in site\/package\.json: merge the base into the branch/);
  assert.deepEqual(log.closed, []);
  assert.equal(log.posts[0].state, 'failure');
});

test('uiBump: an unadopted head missing a folder is closed and reopened', async () => {
  const e = entry({ uiExtraDirs: ['site'] });
  world.files.master = { 'package.json': pkg('v1.0.0'), 'site/package.json': pkg('v1.0.0') };
  world.files.head1 = { 'package.json': pkg('v1.0.1') };
  world.prs.open = [bumpPr('v1.0.1')];
  world.head.head1 = FANOUT;
  const run = newRun();
  run.openBumpPr = () => ({ pr: bumpPr('v1.0.1') });
  run.settle = async () => ({ repo: 'a/b', result: 'checking' });
  await run.uiBump(e, 'v1.0.1');
  assert.deepEqual(log.closed.map((c) => c.number), [7]);
});

function mergeRun(waitMin) {
  const run = newRun(waitMin);
  run.view = () => ({ number: 7, headRefOid: 'head1', mergeCommit: { oid: 'mergesha' }, title: 'Move', headRefName: 'ui/v1.0.1', isCrossRepository: false, headRepositoryOwner: { login: 'a' }, createdAt: '2020-01-01T00:00:00Z' });
  run.readChecks = () => ({ checks: 'success', current: null });
  run.revert = async () => {
    run.reverted = true;
    return { repo: 'a/b', result: 'reverted' };
  };
  return run;
}
const ctx = { kind: 'ui', from: 'v1.0.0', to: 'v1.0.1', behaviorChanges: false, adopted: false };
const completed = (conclusion) => [{ status: 'completed', conclusion, created_at: '2026-01-01', html_url: 'u' }];

test('settle: merge then deploy success', async () => {
  world.runs = completed('success');
  const r = await mergeRun(0).settle(entry(), bumpPr('v1.0.1'), ctx);
  assert.equal(r.result, 'merged');
  assert.equal(r.detail, 'deployed');
});

test('settle: merge then deploy failure reverts', async () => {
  for (const c of ['failure', 'timed_out', 'startup_failure']) {
    world.runs = completed(c);
    const run = mergeRun(0);
    const r = await run.settle(entry(), bumpPr('v1.0.1'), ctx);
    assert.equal(r.result, 'reverted');
    assert.equal(run.reverted, true);
  }
});

test('settle: a cancelled or skipped deploy is not reverted', async () => {
  for (const c of ['cancelled', 'skipped']) {
    world.runs = completed(c);
    const run = mergeRun(0);
    const r = await run.settle(entry(), bumpPr('v1.0.1'), ctx);
    assert.equal(r.result, 'merged');
    assert.equal(r.detail, `deploy run ${c} (not reverted)`);
    assert.equal(run.reverted, undefined);
  }
});

test('settle: with waitMin 0 the deploy is still watched; no deploy workflow says so', async () => {
  world.runs = completed('success');
  const watched = await mergeRun(0).settle(entry(), bumpPr('v1.0.1'), ctx);
  assert.notEqual(watched.detail, 'deploy not watched');
  const none = await mergeRun(0).settle(entry({ deploy: undefined }), bumpPr('v1.0.1'), ctx);
  assert.equal(none.detail, 'no deploy workflow in the catalog');
});

test('hold: an unchanged status is not posted again, a new one is', async () => {
  const run = newRun();
  run.view = () => ({ headRefOid: 'head1' });
  world.statuses.head1 = [{ context: 'fan-out', state: 'failure', description: 'Touches workflows' }];
  await run.hold(entry(), { number: 7 }, 'Touches workflows');
  assert.equal(log.posts.length, 0);
  await run.hold(entry(), { number: 7 }, 'Something else');
  assert.equal(log.posts.length, 1);
});

test('rate limit: a 403 rate limit is not a token problem and does not latch check runs', () => {
  const msg = 'gh: API rate limit exceeded for user (HTTP 403)';
  assert.equal(isForbidden({ output: msg }), false);
  assert.equal(isNoAccess(msg), false);
  const r = explainError({ repo: 'a/b', result: 'error', detail: msg });
  assert.equal(r.detail, 'GitHub rate limit; the next run retries');
  assert.equal(isForbidden({ output: 'gh: Resource not accessible (HTTP 403)' }), true);
});

test('rate limit: readChecks rethrows without latching checkRunsForbidden', () => {
  const run = newRun();
  io.apiJson = () => {
    throw new CmdError('gh', ['api'], { code: 1, stderr: 'secondary rate limit (HTTP 403)', stdout: '' });
  };
  assert.throws(() => run.readChecks('a/b', { headRefOid: 'h', createdAt: '2020-01-01T00:00:00Z' }));
  assert.equal(run.checkRunsForbidden, false);
});

test('prBody: a behavior change or major waits for a session; a patch merges by itself', () => {
  const w = (pin, tag, behaviorChanges) => prBody({ pin, tag, behaviorChanges, markdown: 'x' });
  assert.match(w('v1.0.0', 'v1.0.1', true), /After a session adopts it, it merges when the checks pass/);
  assert.match(w('v1.4.0', 'v2.0.0', false), /After a session adopts it, it merges when the checks pass/);
  assert.match(w('v1.0.0', 'v1.0.1', false), /It merges by itself when the checks pass/);
});

test('redact masks the base64 form of the token', () => {
  const saved = process.env.GH_TOKEN;
  process.env.GH_TOKEN = 'tok123';
  try {
    const b64 = Buffer.from('x-access-token:tok123').toString('base64');
    assert.equal(redact(`AUTHORIZATION: basic ${b64}`), 'AUTHORIZATION: basic ***');
  } finally {
    if (saved === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = saved;
  }
});
