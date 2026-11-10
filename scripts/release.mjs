#!/usr/bin/env node
// Cut a release: node scripts/release.mjs <patch|minor|major|x.y.z> [--ci]
//
// Normally run by .github/workflows/release.yml (workflow_dispatch, with --ci). It still works
// from a clean local master as a fallback. In CI it requires a green ci.yml run on master HEAD
// (skipping [skip ci] commits). Third-party checks and builds run without GH_TOKEN; only the
// git pushes and the gh calls get it.
//
// master never carries dist/. A release bumps the version on master, then makes a
// tag commit on top of it that adds the built dist/, so `github:nishant/ui#vX.Y.Z`
// installs ready to use with no build step, and site-dist/ (the docs site).
// Order: all local work (bump, site build, tag commit, tag) happens before any push, then master
// is pushed before the tag, so a failed build pushes nothing and a failed push leaves no orphan tag.
// Then the tag, a GitHub Release with the CHANGELOG section, and (in CI) the npm publish,
// .github/workflows/publish.yml, then the fan-out: a tag pushed with GITHUB_TOKEN does not
// trigger other workflows, so --ci dispatches .github/workflows/fanout.yml itself. A local tag
// push triggers it on its own. Apps pin npm:nish-ui@X.Y.Z, so the fan-out waits until npm has
// the version (up to 15 minutes; the hourly run retries after that). Bump PRs open once releases
// have settled for FANOUT_QUIET_MIN (120) minutes, from an hourly run, or right away with
// `gh workflow run fanout.yml -R nishant/ui -f tag=<tag> -f now=true`.
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changelogSection } from '../tools/changelog-section.mjs';
import { compare } from '../tools/fanout/pin.mjs';
import { ciGate, parseLog } from '../tools/release-gate.mjs';

// Commands that run repo code (checks, tests, builds) never see the write token.
const SAFE_ENV = { ...process.env };
delete SAFE_ENV.GH_TOKEN;
delete SAFE_ENV.GITHUB_TOKEN;
const sh = (cmd, env = SAFE_ENV) => execSync(cmd, { stdio: 'inherit', env });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const args = process.argv.slice(2);
const ci = args.includes('--ci');
// Push with explicit auth in CI so the token reaches git only for the push; locally use the credential helper.
const push = (ref) => {
  const env =
    ci && process.env.GH_TOKEN
      ? {
          ...SAFE_ENV,
          GIT_CONFIG_COUNT: '1',
          GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
          GIT_CONFIG_VALUE_0: 'AUTHORIZATION: basic ' + Buffer.from('x-access-token:' + process.env.GH_TOKEN).toString('base64'),
        }
      : process.env;
  execFileSync('git', ['push', '-q', 'origin', ref], { stdio: 'inherit', env });
};
const bump = args.find((a) => !a.startsWith('--'));
if (!bump) {
  console.error('usage: node scripts/release.mjs <patch|minor|major|x.y.z> [--ci]');
  process.exit(2);
}
if (out('git status --porcelain')) throw new Error('working tree is not clean');
if (out('git rev-parse --abbrev-ref HEAD') !== 'master') throw new Error('release from master');
sh('git fetch -q origin master --tags');
if (out('git rev-parse HEAD') !== out('git rev-parse origin/master')) {
  throw new Error('HEAD is not origin/master: pull or push first');
}
if (ci || process.env.GH_TOKEN) {
  // master's ci.yml run for HEAD (or the newest commit under [skip ci] commits) must be green.
  try {
    const log = execFileSync('git', ['log', '-n', '30', '--format=%H%x1f%B%x1e'], { encoding: 'utf8' });
    const runs = JSON.parse(
      execFileSync('gh', ['run', 'list', '-w', 'ci.yml', '-b', 'master', '-e', 'push', '-L', '50', '--json', 'headSha,status,conclusion'], { encoding: 'utf8' }),
    );
    const gate = ciGate(parseLog(log), runs);
    if (!gate.ok) throw new Error(gate.reason);
  } catch (e) {
    if (ci) throw e;
    console.warn(`warning: ${e.message} (not blocking a local release)`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const version =
  bump === 'major' ? `${ma + 1}.0.0` : bump === 'minor' ? `${ma}.${mi + 1}.0` : bump === 'patch' ? `${ma}.${mi}.${pa + 1}` : bump;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`bad version ${version}`);
if (compare(`v${version}`, `v${pkg.version}`) <= 0) throw new Error(`${version} is not higher than ${pkg.version}`);
const tag = `v${version}`;
if (out(`git tag -l ${tag}`)) throw new Error(`${tag} already exists`);
const notes = changelogSection(readFileSync('CHANGELOG.md', 'utf8'), version);
if (notes === null) throw new Error(`CHANGELOG.md has no [${version}] entry: merge one to master first`);

sh('npm run check');
if (ci) {
  sh('npm run test:tools');
  sh('npm run test:unit');
}

pkg.version = version;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
sh('npm install --package-lock-only --ignore-scripts --silent');
sh(`git commit -qam "Release ${tag}"`);

// Tag commit: master + dist/ + the built docs site, detached so master stays
// source-only. hosting serves site-dist/ at design.nish.software from the tag.
sh('npm run build:site');
sh('git checkout -q --detach');
sh('git add -f dist site-dist');
sh(`git commit -qm "${tag} build"`);
sh(`git tag -a ${tag} -m "${tag}"`);
sh('git checkout -q master');
// Everything fallible and local is done; only now push, master first so a failed push leaves no orphan tag.
push('master');
push(tag);
console.log(`\nPushed ${tag}.`);

if (ci || process.env.GH_TOKEN) {
  const file = join(mkdtempSync(join(tmpdir(), 'ui-release-')), 'notes.md');
  writeFileSync(file, notes || `Release ${tag}.`);
  execFileSync('gh', ['release', 'create', tag, '--title', tag, '--notes-file', file, '--verify-tag'], { stdio: 'inherit' });
}
if (ci) {
  // npm (nish-ui) before the fan-out: apps pin npm:nish-ui@X.Y.Z, and the fan-out waits for npm
  // to have the version. The tag is out either way, so a failed dispatch turns the run red
  // without undoing anything; rerun it by hand.
  try {
    execFileSync('gh', ['workflow', 'run', 'publish.yml', '--ref', 'master', '-f', `tag=${tag}`], { stdio: 'inherit' });
    console.log('Dispatched the npm publish.');
  } catch {
    console.error(`Could not dispatch the npm publish: gh workflow run publish.yml -R nishant/ui -f tag=${tag}`);
    process.exitCode = 1;
  }
  execFileSync('gh', ['workflow', 'run', 'fanout.yml', '--ref', 'master', '-f', `tag=${tag}`], { stdio: 'inherit' });
  console.log(
    `Dispatched the fan-out: bump PRs open once releases have settled for FANOUT_QUIET_MIN (120) minutes, from an hourly run, or right away with: gh workflow run fanout.yml -R nishant/ui -f tag=${tag} -f now=true`,
  );
} else {
  console.log(`This local path does not publish to npm. Publish it: gh workflow run publish.yml -R nishant/ui -f tag=${tag}`);
}
console.log(`Bump PRs: https://github.com/nishant/ui/actions/workflows/fanout.yml (see the fan-out note above for timing)`);
console.log(`arora-home is not in the fan-out: bash scripts/bump-consumers.sh ${tag}`);
