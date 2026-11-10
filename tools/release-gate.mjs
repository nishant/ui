// CI gate for releases: master's ci.yml run for HEAD (or the newest commit under any [skip ci]
// commits) must have completed green. Pure functions, so they are tested without git or gh.

/** Split `git log --format=%H%x1f%B%x1e` output into { sha, message } objects, newest first. */
export function parseLog(text) {
  return text
    .split('\x1e')
    .map((rec) => rec.trim())
    .filter(Boolean)
    .map((rec) => {
      const i = rec.indexOf('\x1f');
      return i < 0 ? { sha: rec, message: '' } : { sha: rec.slice(0, i).trim(), message: rec.slice(i + 1).trim() };
    });
}

/**
 * commits: [{ sha, message }] newest first. runs: [{ headSha, status, conclusion }] from ci.yml on master.
 * Returns { ok: true, sha } or { ok: false, reason }.
 */
export function ciGate(commits, runs) {
  for (const { sha, message } of commits) {
    const mine = runs.filter((r) => r.headSha === sha);
    const s7 = sha.slice(0, 7);
    if (mine.length === 0) {
      if (/\[(skip ci|ci skip)\]/.test(message || '')) continue;
      return { ok: false, reason: `ci.yml has not run for ${s7}` };
    }
    if (mine.some((r) => r.status !== 'completed')) return { ok: false, reason: `ci.yml is still running for ${s7}` };
    // gh lists runs newest first, so the first one is the newest completed run.
    const newest = mine[0];
    if (newest.conclusion !== 'success') return { ok: false, reason: `master CI is not green for ${s7} (${newest.conclusion})` };
    return { ok: true, sha };
  }
  return { ok: false, reason: 'no ci.yml run in the last 30 commits' };
}
