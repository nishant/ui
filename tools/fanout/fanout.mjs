#!/usr/bin/env node
// The ui fan-out: open (or update) a `ui/vX.Y.Z` PR in every repo listed in hosting/fleet.yaml,
// settle it (checks, Fold report, merge policy), watch the deploy and revert on failure.
//
//   node tools/fanout/fanout.mjs --fleet fleet.yaml --tag v0.7.1|latest [--repo owner/name|all]
//        [--wait <minutes>] [--dry-run]
//
// Needs GH_TOKEN (the FLEET_TOKEN secret in Actions, or `gh auth token` locally).
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sections } from './changelog.mjs';
import { parseFleet } from './fleet.mjs';
import { CmdError, api, apiJson, gh, git, isForbidden, redact, sh, sleep } from './gh.mjs';
import { compare, lockDirs, lowestPin, pinDirs, pinFile, pinOf, rewritePin } from './pin.mjs';
import { computeChecks, cut, decide, isAdoptedHead, limitFor, updateLabel } from './policy.mjs';

const UI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATUS = 'fan-out';
const POLL_MS = Number(process.env.FANOUT_POLL_MS) || 30_000;
const COMMIT_ID = ['-c', 'user.name=ui fan-out', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];

/** The PR body for a ui bump (exact copy from the spec). */
export function prBody({ pin, tag, behaviorChanges, markdown }) {
  const limit = limitFor('ui', pin, tag);
  const label = updateLabel('ui', pin, tag);
  const parts = [`Moves @nish/ui from ${pin} to ${tag}. Opened by the ui fan-out.`];
  if (behaviorChanges) {
    parts.push(
      '**Behavior changes:** this release asks apps to change code, so it will not merge by itself. Adopt it on this branch, then the fan-out merges it on its next run.',
    );
  }
  parts.push(
    `It merges by itself when the checks pass, the Fold check finds no new problems and pages change less than ${limit}% (${label} update).`,
  );
  parts.push(`## Release notes\n\n${markdown}`);
  return parts.join('\n\n');
}

/** Highest vX.Y.Z among a list of tag names, or null. */
export function latestTag(names) {
  const tags = names.map((t) => t.trim()).filter((t) => /^v\d+\.\d+\.\d+$/.test(t));
  return tags.sort((a, b) => compare(a, b)).pop() ?? null;
}

/** One markdown line for a result. */
export function resultLine(r) {
  const pr = r.pr ? ` (#${r.pr})` : '';
  return `- **${r.repo}**: ${r.result}${r.detail ? `, ${r.detail}` : ''}${pr}`;
}

function parseArgs(argv) {
  const a = { fleet: null, tag: null, repo: 'all', wait: 0, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--fleet') a.fleet = argv[++i];
    else if (k === '--tag') a.tag = argv[++i];
    else if (k === '--repo') a.repo = argv[++i] || 'all';
    else if (k === '--wait') a.wait = Number(argv[++i]);
    else if (k === '--dry-run') a.dry = true;
    else throw new Error(`Unknown argument ${k}`);
  }
  if (!a.fleet || !a.tag) throw new Error('usage: fanout.mjs --fleet <file> --tag <vX.Y.Z|latest> [--repo owner/name|all] [--wait <minutes>] [--dry-run]');
  if (!Number.isFinite(a.wait) || a.wait < 0) throw new Error('--wait needs a number of minutes');
  return a;
}

const firstLine = (s) => String(s).split(/\r?\n/).find((l) => l.trim()) ?? '';
const rawFile = (repo, path, ref) =>
  api(`repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`, { raw: true }).stdout;

function listPrs(repo, extra = []) {
  return JSON.parse(
    gh([
      'pr', 'list', '-R', repo, '--limit', '100',
      '--json', 'number,title,headRefName,headRefOid,mergeable,author,createdAt,url,isCrossRepository,headRepositoryOwner',
      ...extra,
    ]).stdout || '[]',
  );
}

/** True for a PR whose head branch lives in the repo itself (never a fork's). */
export function isSameRepoPr(repo, p) {
  return p.isCrossRepository === false && p.headRepositoryOwner?.login === repo.split('/')[0];
}

/** A bump PR: from this repo's own ui/v* branch. */
const isBumpPr = (repo, p) => isSameRepoPr(repo, p) && /^ui\/v\d+\.\d+\.\d+$/.test(p.headRefName);

/** A Dependabot PR: the Dependabot app, on its own dependabot/ branch in this repo. */
export function isDependabotPr(repo, p) {
  return (
    isSameRepoPr(repo, p) &&
    p.author?.login === 'app/dependabot' &&
    p.headRefName.startsWith('dependabot/')
  );
}

const VIEW_FIELDS =
  'number,title,headRefName,headRefOid,mergeable,author,createdAt,url,isCrossRepository,headRepositoryOwner,state,mergeCommit';

/** A light PR view; ask for the heavy fields (`files`, `comments`) only where they are used. */
function viewPr(repo, number, extra = []) {
  return JSON.parse(gh(['pr', 'view', String(number), '-R', repo, '--json', [VIEW_FIELDS, ...extra].join(',')]).stdout);
}

const tmpDir = (name) => mkdtempSync(join(tmpdir(), `fanout-${name}-`));
const cleanup = (dir) => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Windows can hold .git files briefly; the temp dir is disposable.
  }
};

// The token is never written to disk or passed in an argument: git gets it per command through
// GIT_CONFIG_* env vars, so the clone's .git/config holds a token-free URL.
function gitAuthEnv() {
  const basic = Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
  };
}

const authGit = (args, opts = {}) => git(args, { ...opts, env: { ...opts.env, ...gitAuthEnv() } });

// Repo-controlled commands (fleet.yaml bump, pnpm hooks) run without any token in their env.
const NO_TOKEN_ENV = { GH_TOKEN: undefined, GITHUB_TOKEN: undefined, GH_ENTERPRISE_TOKEN: undefined, GITHUB_ENTERPRISE_TOKEN: undefined };

function cloneBase(repo, base, dir, depth = 1) {
  authGit(['clone', '-c', 'core.autocrlf=false', '--depth', String(depth), '--branch', base, `https://github.com/${repo}.git`, dir]);
}

const LOCK_CMD = {
  npm: 'npx -y npm@10 install --package-lock-only --ignore-scripts',
  pnpm: 'corepack pnpm install --lockfile-only',
};

/**
 * Move every @nish/ui pin of `entry` (uiDir and uiExtraDirs) in the checkout at `dir` to `tag`,
 * regenerate the lockfile(s) and run the entry's bump command. A folder already on `tag` or
 * newer is left alone. `at.step` names the step that is running, for error messages.
 * @returns {string[]} the folders whose pin moved
 */
export function bumpTree(entry, dir, tag, { run = sh, at = {} } = {}) {
  const dirs = pinDirs(entry);
  const moved = [];
  for (const d of dirs) {
    const rel = pinFile(entry.ui, d);
    at.step = `pin rewrite (${rel})`;
    const text = readFileSync(join(dir, rel), 'utf8');
    if (compare(pinOf(entry.ui, text), tag) >= 0) continue;
    writeFileSync(join(dir, rel), rewritePin(entry.ui, text, tag, rel));
    moved.push(d);
  }
  const cmd = LOCK_CMD[entry.ui];
  if (cmd) {
    for (const d of lockDirs(entry.ui, dirs, (p) => existsSync(join(dir, p)))) {
      at.step = d === '.' ? cmd : `${cmd} (in ${d})`;
      run(cmd, { cwd: d === '.' ? dir : join(dir, d), env: NO_TOKEN_ENV });
    }
  }
  if (entry.bump) {
    at.step = entry.bump;
    run(entry.bump, { cwd: dir, env: NO_TOKEN_ENV });
  }
  return moved;
}

export class Run {
  constructor(args) {
    this.dry = args.dry;
    this.waitMin = args.wait;
    this.lines = [];
    this.failed = false;
    this.checkRunsForbidden = false;
    this.ui = args.uiRoot ?? UI_ROOT;
  }

  say(line) {
    console.log(line);
  }

  would(line) {
    this.say(`  would ${line}`);
  }

  // ---- ui bump ----------------------------------------------------------------------

  tagExists(tag) {
    return git(['rev-parse', '-q', '--verify', `refs/tags/${tag}`], { cwd: this.ui, allowFail: true }).code === 0;
  }

  async uiBump(entry, tag) {
    const R = entry.repo;
    if (!this.tagExists(tag)) return { repo: R, result: 'error', detail: `No tag ${tag}` };

    // The lowest pin across uiDir and uiExtraDirs: a repo is current only when every folder is.
    const base = lowestPin(entry.ui, pinDirs(entry), (path) => rawFile(R, path, entry.base));
    if (base.error) return { repo: R, result: 'error', detail: pinDirs(entry).length > 1 ? base.error : 'Could not read the pin' };
    const pin = base.pin;

    if (compare(pin, tag) >= 0) {
      const open = listPrs(R, ['--state', 'open']).filter(
        (p) => isBumpPr(R, p) && compare(p.headRefName.slice(3), pin) <= 0,
      );
      for (const p of open) {
        if (this.dry) this.would(`close #${p.number} (Already on ${pin}.)`);
        else gh(['pr', 'close', String(p.number), '-R', R, '--delete-branch', '--comment', `Already on ${pin}.`]);
      }
      return { repo: R, result: 'current', detail: `on ${pin}` };
    }

    const reverts = listPrs(R, ['--state', 'merged', '--search', `Revert "Move @nish/ui to ${tag}" in:title`]);
    if (reverts.some((p) => p.title === `Revert "Move @nish/ui to ${tag}"`)) {
      return { repo: R, result: 'held', detail: 'Reverted after a failed deploy; a session has to look' };
    }

    let open = listPrs(R, ['--state', 'open']).filter((p) => isBumpPr(R, p));
    const newer = open.find((p) => compare(p.headRefName.slice(3), tag) > 0);
    if (newer) return { repo: R, result: 'skipped', detail: `Newer bump PR #${newer.number} is open` };
    for (const p of open.filter((p) => compare(p.headRefName.slice(3), tag) < 0)) {
      if (this.dry) this.would(`close #${p.number} (Superseded by ${tag}.)`);
      else gh(['pr', 'close', String(p.number), '-R', R, '--delete-branch', '--comment', `Superseded by ${tag}.`]);
    }
    open = open.filter((p) => p.headRefName === `ui/${tag}`);
    let pr = open[0] ?? null;
    if (pr && pr.mergeable === 'CONFLICTING') {
      if (this.dry) this.would(`close #${pr.number} (The base branch moved; opening a fresh one.)`);
      else gh(['pr', 'close', String(pr.number), '-R', R, '--delete-branch', '--comment', 'The base branch moved; opening a fresh one.']);
      pr = null;
    }

    const notes = sections(git(['show', `${tag}:CHANGELOG.md`], { cwd: this.ui, allowFail: true }).stdout, pin, tag);

    let adopted = false;
    let pushedAt = null;
    if (pr) {
      const c = apiJson(`repos/${R}/commits/${pr.headRefOid}`)?.commit;
      adopted = isAdoptedHead(c ? { author: c.author?.name, message: c.message } : null);
      // A PR opened before a folder was added to uiExtraDirs (or adopted without it) moves the
      // folders it missed in a commit on top, so its head stays adopted or not as it was.
      const dirs = pinDirs(entry);
      const head = dirs.length > 1 ? lowestPin(entry.ui, dirs, (path) => rawFile(R, path, pr.headRefOid)) : null;
      const behind = head ? dirs.filter((d) => !head.pins[d] || compare(head.pins[d], tag) < 0) : [];
      if (behind.length) {
        if (this.dry) this.would(`move ${behind.join(', ')} to ${tag} on #${pr.number}`);
        else {
          const topped = this.topUpBumpPr(entry, pr, tag, pin, notes, adopted);
          if (topped.error) return { repo: R, result: 'error', detail: topped.error, pr: pr.number };
          if (topped.moved.length) {
            pushedAt = Date.now();
            // Settle only once the PR reports the new head, so the merge never matches the old one.
            for (let i = 0; i < 12 && viewPr(R, pr.number).headRefOid !== topped.sha; i++) await sleep(5_000);
          }
        }
      }
    } else {
      if (this.dry) {
        this.would(`open PR ui/${tag} in ${R}: Move @nish/ui to ${tag} (from ${pin})`);
        return { repo: R, result: 'dry-run', detail: `would open PR ui/${tag}` };
      }
      const opened = this.openBumpPr(entry, tag, pin, notes);
      if (opened.error) return { repo: R, result: 'error', detail: opened.error };
      pr = opened.pr;
    }
    return this.settle(entry, pr, { kind: 'ui', from: pin, to: tag, behaviorChanges: notes.behaviorChanges, adopted, pushedAt });
  }

  openBumpPr(entry, tag, pin, notes) {
    const R = entry.repo;
    const dir = tmpDir('bump');
    const at = { step: 'clone' };
    let step;
    try {
      cloneBase(R, entry.base, dir);
      bumpTree(entry, dir, tag, { at });
      step = 'git add';
      git(['add', '-A'], { cwd: dir });
      if (git(['diff', '--cached', '--quiet'], { cwd: dir, allowFail: true }).code === 0) {
        return { error: 'Bump changed nothing' };
      }
      step = 'git commit';
      git([...COMMIT_ID, 'commit', '-q', '-m', `Move @nish/ui to ${tag}`], { cwd: dir });
      step = 'git push';
      authGit(['push', '--force', 'origin', `HEAD:refs/heads/ui/${tag}`], { cwd: dir });
      step = 'gh pr create';
      gh(['pr', 'create', '-R', R, '--base', entry.base, '--head', `ui/${tag}`, '--title', `Move @nish/ui to ${tag}`, '--body', prBody({ pin, tag, ...notes })]);
      const pr = listPrs(R, ['--state', 'open', '--head', `ui/${tag}`])[0];
      if (!pr) return { error: 'gh pr create finished but the PR was not found' };
      return { pr };
    } catch (e) {
      const msg = e instanceof CmdError ? e.message : `${step ?? at.step}: ${redact(e.message)}`;
      return { error: msg };
    } finally {
      cleanup(dir);
    }
  }

  /** Move the folders an open bump PR missed, in one commit on its branch, and refresh its body. */
  topUpBumpPr(entry, pr, tag, pin, notes, adopted) {
    const R = entry.repo;
    const dir = tmpDir('topup');
    const at = { step: 'clone' };
    let step;
    try {
      cloneBase(R, `ui/${tag}`, dir);
      const moved = bumpTree(entry, dir, tag, { at });
      step = 'git add';
      git(['add', '-A'], { cwd: dir });
      if (git(['diff', '--cached', '--quiet'], { cwd: dir, allowFail: true }).code === 0) return { moved: [] };
      // isAdoptedHead keys on the message: keep a fan-out head a fan-out head, an adopted one adopted.
      const message = adopted ? `Pin @nish/ui ${tag} in ${moved.join(', ') || 'the lockfile'}` : `Move @nish/ui to ${tag}`;
      step = 'git commit';
      git([...COMMIT_ID, 'commit', '-q', '-m', message], { cwd: dir });
      step = 'git push';
      authGit(['push', 'origin', `HEAD:refs/heads/ui/${tag}`], { cwd: dir });
      step = 'gh pr edit';
      gh(['pr', 'edit', String(pr.number), '-R', R, '--body', prBody({ pin, tag, ...notes })]);
      this.say(`  moved ${moved.join(', ')} to ${tag} on #${pr.number}`);
      return { moved, sha: git(['rev-parse', 'HEAD'], { cwd: dir }).stdout.trim() };
    } catch (e) {
      const msg = e instanceof CmdError ? e.message : `${step ?? at.step}: ${redact(e.message)}`;
      return { error: msg };
    } finally {
      cleanup(dir);
    }
  }

  // ---- dependency PRs ---------------------------------------------------------------

  async settleDeps(entry) {
    const R = entry.repo;
    const results = [];
    const prs = listPrs(R, ['--state', 'open']).filter((p) => isDependabotPr(R, p));
    for (const p of prs) {
      if (p.mergeable === 'CONFLICTING') {
        const full = viewPr(R, p.number, ['comments']);
        if (!(full.comments ?? []).some((c) => c.body.includes('@dependabot rebase'))) {
          if (this.dry) this.would(`comment @dependabot rebase on #${p.number}`);
          else gh(['pr', 'comment', String(p.number), '-R', R, '--body', '@dependabot rebase']);
          results.push({ repo: R, result: 'skipped', detail: 'Conflicting; asked Dependabot to rebase', pr: p.number });
          continue;
        }
        results.push({ repo: R, result: 'skipped', detail: 'Conflicting; waiting for Dependabot to rebase', pr: p.number });
        continue;
      }
      const files = (viewPr(R, p.number, ['files']).files ?? []).map((f) => f.path);
      if (files.some((f) => f.startsWith('.github/workflows/'))) {
        results.push(await this.hold(entry, p, 'Touches .github/workflows: a person has to merge it'));
        continue;
      }
      results.push(await this.settle(entry, p, { kind: 'deps' }));
    }
    return results;
  }

  // ---- settle -----------------------------------------------------------------------

  setStatus(R, sha, state, description, current = null) {
    const d = cut(description);
    if (current && current.state === state && current.description === d) return;
    if (this.dry) return this.would(`set ${STATUS} status ${state}: ${d}`);
    this.post(R, sha, state, d);
  }

  post(R, sha, state, description) {
    api(`repos/${R}/statuses/${sha}`, { method: 'POST', fields: { state, context: STATUS, description } });
  }

  view(R, number) {
    return viewPr(R, number);
  }

  async hold(entry, pr, reason) {
    const sha = this.view(entry.repo, pr.number).headRefOid;
    this.setStatus(entry.repo, sha, 'failure', reason);
    return { repo: entry.repo, result: 'held', detail: reason, pr: pr.number };
  }

  /** Read checks (check runs, falling back to workflow runs on a 403) and commit statuses. */
  readChecks(R, pr, pushedAt = null) {
    const sha = pr.headRefOid;
    let checkRuns = null;
    if (!this.checkRunsForbidden) {
      try {
        checkRuns = apiJson(`repos/${R}/commits/${sha}/check-runs?per_page=100`).check_runs ?? [];
      } catch (e) {
        if (!isForbidden(e)) throw e;
        this.checkRunsForbidden = true;
      }
    }
    const combined = apiJson(`repos/${R}/commits/${sha}/status?per_page=100`);
    const all = combined?.statuses ?? [];
    const statuses = all.filter((s) => s.context !== STATUS);
    const current = all.find((s) => s.context === STATUS) ?? null;
    const workflowRuns =
      checkRuns === null ? apiJson(`repos/${R}/actions/runs?head_sha=${sha}&per_page=100`).workflow_runs ?? [] : null;
    // A fresh PR, or one the fan-out just pushed to, may not have registered its checks yet.
    const young = Date.now() - Math.max(Date.parse(pr.createdAt), pushedAt ?? 0) < 10 * 60_000;
    return { checks: computeChecks({ checkRuns, statuses, workflowRuns, young }), current };
  }

  readFold(R, sha) {
    const runs = (apiJson(`repos/${R}/actions/runs?head_sha=${sha}&event=pull_request&per_page=50`).workflow_runs ?? [])
      .slice()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    for (const run of runs) {
      const artifacts = apiJson(`repos/${R}/actions/runs/${run.id}/artifacts`).artifacts ?? [];
      const live = (n) => artifacts.some((a) => a.name === n && !a.expired);
      // The small fold-summary artifact; older runs only have the full fold-report.
      const name = live('fold-summary') ? 'fold-summary' : live('fold-report') ? 'fold-report' : null;
      if (!name) continue;
      const dir = tmpDir('fold');
      try {
        gh(['run', 'download', String(run.id), '-R', R, '-n', name, '-D', dir]);
        const found = findFile(dir, 'summary.json');
        if (found) return JSON.parse(readFileSync(found, 'utf8'));
      } catch {
        // an unreadable artifact counts as missing
      } finally {
        cleanup(dir);
      }
    }
    return 'missing';
  }

  async settle(entry, pr0, ctx) {
    const R = entry.repo;
    const started = Date.now();
    const deadline = started + this.waitMin * 60_000;
    let pr = pr0;
    let decision;
    for (;;) {
      pr = this.view(R, pr0.number);
      const { checks, current } = this.readChecks(R, pr, ctx.pushedAt);
      let fold = null;
      if (entry.fold && checks !== 'pending') fold = this.readFold(R, pr.headRefOid);
      decision = decide({ ...ctx, checks, fold });
      // Pending only while waiting, so a held or merging PR never flashes pending.
      if (decision.action === 'wait' && !this.dry) this.setStatus(R, pr.headRefOid, 'pending', 'Waiting for checks', current);
      if (decision.action !== 'wait' || Date.now() >= deadline || this.dry) {
        if (decision.action === 'hold') this.setStatus(R, pr.headRefOid, 'failure', decision.reason, current);
        break;
      }
      await sleep(POLL_MS);
    }

    if (decision.action === 'wait') return { repo: R, result: 'checking', detail: decision.reason, pr: pr.number };
    if (decision.action === 'hold') return { repo: R, result: 'held', detail: decision.reason, pr: pr.number };

    if (this.dry) {
      this.would(`merge #${pr.number} in ${R} (${decision.reason})`);
      return { repo: R, result: 'dry-run', detail: `would merge #${pr.number}`, pr: pr.number };
    }
    const own = ctx.kind === 'ui' ? isBumpPr(R, pr) : isDependabotPr(R, pr);
    if (!own) return { repo: R, result: 'held', detail: 'Not a same-repo bump or Dependabot PR', pr: pr.number };
    this.setStatus(R, pr.headRefOid, 'success', 'Merging');
    const merged = gh(
      ['pr', 'merge', String(pr.number), '-R', R, '--merge', '--delete-branch', '--match-head-commit', pr.headRefOid],
      { allowFail: true },
    );
    if (merged.code !== 0) {
      const reason = `Merge failed: ${firstLine(redact(merged.stderr || merged.stdout))}`;
      this.setStatus(R, pr.headRefOid, 'failure', reason);
      return { repo: R, result: 'held', detail: cut(reason), pr: pr.number };
    }
    if (this.waitMin <= 0) return { repo: R, result: 'merged', detail: 'deploy not watched', pr: pr.number };
    return this.watchDeploy(entry, pr);
  }

  // ---- deploy watch and revert -------------------------------------------------------

  async watchDeploy(entry, pr) {
    const R = entry.repo;
    const mergeSha = this.view(R, pr.number).mergeCommit?.oid;
    if (!mergeSha) return { repo: R, result: 'merged', detail: 'merge commit not found', pr: pr.number };
    const start = Date.now();
    const end = start + 20 * 60_000;
    const noRunBy = start + 5 * 60_000;
    for (;;) {
      const runs = apiJson(
        `repos/${R}/actions/workflows/${entry.deploy}/runs?head_sha=${mergeSha}&event=push&per_page=10`,
      ).workflow_runs ?? [];
      const run = runs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
      if (run && run.status === 'completed') {
        if (run.conclusion === 'success') return { repo: R, result: 'merged', detail: 'deployed', pr: pr.number };
        return this.revert(entry, pr, mergeSha, run.html_url);
      }
      if (!run && Date.now() >= noRunBy) {
        return { repo: R, result: 'merged', detail: `no ${entry.deploy} run found for the merge`, pr: pr.number };
      }
      if (Date.now() >= end) return { repo: R, result: 'merged', detail: 'deploy still running', pr: pr.number };
      await sleep(POLL_MS);
    }
  }

  async revert(entry, pr, mergeSha, runUrl) {
    const R = entry.repo;
    const fail = (reason) => {
      this.failed = true;
      return { repo: R, result: 'error', detail: `Deploy failed and the revert did not merge: ${reason}`, pr: pr.number };
    };
    const dir = tmpDir('revert');
    try {
      cloneBase(R, entry.base, dir, 50);
      git([...COMMIT_ID, 'revert', '-m', '1', '--no-edit', mergeSha], { cwd: dir });
      authGit(['push', '--force', 'origin', `HEAD:refs/heads/revert/${pr.number}`], { cwd: dir });
      gh([
        'pr', 'create', '-R', R, '--base', entry.base, '--head', `revert/${pr.number}`,
        '--title', `Revert "${pr.title}"`,
        '--body', `The deploy after #${pr.number} failed: ${runUrl}. Reverting to keep the site up.`,
      ]);
      const rpr = listPrs(R, ['--state', 'open', '--head', `revert/${pr.number}`])[0];
      if (!rpr) return fail('the revert PR was not found after creating it');
      const end = Date.now() + 20 * 60_000;
      let checks;
      let cur;
      for (;;) {
        cur = viewPr(R, rpr.number);
        checks = this.readChecks(R, cur).checks;
        if (checks !== 'pending' || Date.now() >= end) break;
        await sleep(POLL_MS);
      }
      if (checks === 'failure' || checks === 'pending') return fail(`revert PR #${rpr.number} checks: ${checks}`);
      gh(['pr', 'merge', String(rpr.number), '-R', R, '--merge', '--delete-branch', '--match-head-commit', cur.headRefOid]);
      return { repo: R, result: 'reverted', detail: `revert #${rpr.number} merged`, pr: pr.number };
    } catch (e) {
      return fail(firstLine(redact(e.message)));
    } finally {
      cleanup(dir);
    }
  }

  // ---- per repo ---------------------------------------------------------------------

  async repo(entry, tagArg) {
    const out = [];
    try {
      if (entry.ui !== 'none') {
        const tag = tagArg === 'latest' ? latestTag(git(['tag', '-l', 'v*'], { cwd: this.ui }).stdout.split(/\r?\n/)) : tagArg;
        if (!tag) out.push({ repo: entry.repo, result: 'error', detail: 'No tag found' });
        else {
          const r = await this.uiBump(entry, tag);
          if (r) out.push(r);
        }
      }
      out.push(...(await this.settleDeps(entry)));
    } catch (e) {
      out.push({ repo: entry.repo, result: 'error', detail: firstLine(redact(e.message)) });
      this.say(redact(e.stack ?? e.message));
    }
    return out;
  }
}

function findFile(dir, name) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      const r = findFile(p, name);
      if (r) return r;
    } else if (f === name) return p;
  }
  return null;
}

export async function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  if (!process.env.GH_TOKEN) {
    console.error('GH_TOKEN is not set');
    return 1;
  }
  const fleet = parseFleet(readFileSync(args.fleet, 'utf8'));
  const picked = args.repo === 'all' ? fleet : fleet.filter((e) => e.repo === args.repo);
  if (picked.length === 0) {
    console.error(`Unknown repo ${args.repo}: not in ${args.fleet}`);
    return 1;
  }
  const run = new Run(args);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  for (const entry of picked) {
    run.say(`${entry.repo}${args.dry ? ' (dry run)' : ''}`);
    for (const r of await run.repo(entry, args.tag)) {
      const line = resultLine(r);
      run.say(line);
      if (summary) appendFileSync(summary, `${line}\n`);
    }
  }
  return run.failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(redact(e.stack ?? e.message));
      process.exit(1);
    },
  );
}
