// Merge policy for fan-out PRs. Pure functions only.
import { isPatch, major } from './pin.mjs';

const FAILED = new Set(['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure']);

export const STATUS_MAX = 140;
export const cut = (s, n = STATUS_MAX) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Percentage limit for pages that change: 1 for deps and ui patches, 10 for other ui updates. */
export function limitFor(kind, from, to) {
  if (kind === 'deps') return 1;
  return isPatch(from, to) ? 1 : 10;
}

export function updateLabel(kind, from, to) {
  if (kind === 'deps') return 'dependency';
  return isPatch(from, to) ? 'patch' : 'minor';
}

/**
 * Combine check runs, commit statuses and (when check runs are unreadable) workflow runs.
 * A fine-grained token cannot read check runs (403), so the caller passes `checkRuns: null`
 * and the Actions workflow runs for the sha stand in; every check in the fleet is an
 * Actions workflow, so nothing is lost. A 403 is never treated as "missing".
 * @param {object} p
 * @param {Array<{status:string,conclusion:string|null}>|null} p.checkRuns
 * @param {Array<{state:string}>} [p.statuses]  commit statuses, `fan-out` already excluded
 * @param {Array<{status:string,conclusion:string|null,workflow_id?:number,name?:string,event?:string,created_at?:string}>|null} [p.workflowRuns]
 * @param {boolean} [p.young]  the PR is younger than 10 minutes
 * @returns {'pending'|'missing'|'failure'|'success'}
 */
/** The newest item per key, preferring any run that was not skipped over a skipped one. */
function newestBy(list, keyOf, orderOf) {
  const rank = (x) => [x.conclusion === 'skipped' ? 0 : 1, orderOf(x) ?? ''];
  const newer = (a, b) => {
    const [ra, oa] = rank(a);
    const [rb, ob] = rank(b);
    if (ra !== rb) return ra > rb;
    return typeof oa === 'number' && typeof ob === 'number' ? oa > ob : String(oa) > String(ob);
  };
  const best = new Map();
  list.forEach((x, i) => {
    const k = keyOf(x, i);
    const prev = best.get(k);
    if (!prev || newer(x, prev)) best.set(k, x);
  });
  return [...best.values()];
}

export function computeChecks({ checkRuns, statuses = [], workflowRuns = null, young = false }) {
  let items = [];
  if (checkRuns) {
    // Only the newest run of each check counts: a run cancelled because a newer one replaced it
    // (concurrency) must not fail the PR. A skipped run (a label other than `fold`) never hides
    // the result of a real one.
    items = newestBy(checkRuns, (c, i) => (c.name == null ? `#${i}` : `${c.app?.id ?? ''}|${c.name}`), (c) => c.id ?? c.started_at).map((c) => ({
      done: c.status === 'completed',
      bad: FAILED.has(c.conclusion ?? ''),
    }));
  } else if (workflowRuns) {
    // Only the newest run of each workflow and event counts (reruns replace earlier runs).
    items = newestBy(workflowRuns, (r) => `${r.workflow_id ?? r.name}|${r.event ?? ''}`, (r) => r.created_at).map((r) => ({
      done: r.status === 'completed',
      bad: FAILED.has(r.conclusion ?? ''),
    }));
  }
  for (const s of statuses) {
    items.push({ done: s.state !== 'pending', bad: s.state === 'failure' || s.state === 'error' });
  }
  if (items.some((i) => !i.done)) return 'pending';
  if (items.length === 0) return young ? 'pending' : 'missing';
  if (items.some((i) => i.bad)) return 'failure';
  return 'success';
}

/**
 * True when the PR head commit was made by a session rather than the fan-out, i.e. the held
 * bump PR has been adopted. The fan-out's own commit is `Move @nish/ui to <tag>` by `ui fan-out`.
 * @param {{author?:string|null,message?:string|null}|null|undefined} head
 */
export function isAdoptedHead(head) {
  if (!head) return false;
  const byFanout = (head.author ?? '') === 'ui fan-out' && /^Move @nish\/ui to /.test(head.message ?? '');
  return !byFanout;
}

/**
 * @param {{kind:'ui'|'deps',from?:string|null,to?:string|null,behaviorChanges?:boolean,adopted?:boolean,checks:string,fold?:null|'missing'|{newProblems:number,baseOk:boolean,maxDiffPct:number|null}}} p
 * @returns {{action:'wait'|'hold'|'merge',reason:string}}
 */
export function decide({ kind, from = null, to = null, behaviorChanges = false, adopted = false, checks, fold = null }) {
  const out = (action, reason) => ({ action, reason: cut(reason) });
  if (checks === 'pending') return out('wait', 'Waiting for checks');
  if (checks === 'missing') return out('hold', 'No checks ran on this PR');
  if (checks === 'failure') return out('hold', 'Checks failed');
  // An adopted PR (a session pushed its own commits on the branch) no longer needs a session,
  // so rules 4 and 5 are skipped; checks and the Fold check still apply.
  if (kind === 'ui' && !adopted) {
    const mt = major(to);
    const mf = major(from);
    if (mt !== null && mf !== null && mt > mf && mt >= 1) {
      return out('hold', 'Major release: a session has to adopt it');
    }
    if (behaviorChanges) return out('hold', 'Release notes list behavior changes: a session has to adopt it');
  }
  if (fold !== null && fold !== undefined) {
    if (fold === 'missing') return out('hold', 'Fold report missing');
    if (fold.newProblems > 0) return out('hold', `Fold check: ${fold.newProblems} new problem(s)`);
    if (fold.baseOk === false) return out('hold', 'Fold check could not render the base branch');
    const limit = limitFor(kind, from, to);
    if (typeof fold.maxDiffPct === 'number' && fold.maxDiffPct > limit) {
      return out(
        'hold',
        `Pages changed ${fold.maxDiffPct}% (limit ${limit}% for a ${updateLabel(kind, from, to)} update)`,
      );
    }
  }
  return out('merge', 'Checks passed');
}
