#!/usr/bin/env node
// Cut a release: node scripts/release.mjs <patch|minor|major|x.y.z> [--ci]
//
// Normally run by .github/workflows/release.yml (workflow_dispatch, with --ci). It still works
// from a clean local master as a fallback.
//
// master never carries dist/. A release bumps the version on master, then makes a
// tag commit on top of it that adds the built dist/, so `github:nishant/ui#vX.Y.Z`
// installs ready to use with no build step, and site-dist/ (the docs site).
// Order: all local work (bump, site build, tag commit, tag) happens before any push, then master
// is pushed before the tag, so a failed build pushes nothing and a failed push leaves no orphan tag.
// Then the tag, a GitHub Release with the CHANGELOG section, and (in CI) the fan-out:
// a tag pushed with GITHUB_TOKEN does not trigger other workflows, so --ci dispatches
// .github/workflows/fanout.yml itself. A local tag push triggers it on its own.
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changelogSection } from '../tools/changelog-section.mjs';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const args = process.argv.slice(2);
const ci = args.includes('--ci');
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

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const version =
  bump === 'major' ? `${ma + 1}.0.0` : bump === 'minor' ? `${ma}.${mi + 1}.0` : bump === 'patch' ? `${ma}.${mi}.${pa + 1}` : bump;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`bad version ${version}`);
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
sh('git push -q origin master');
sh(`git push -q origin ${tag}`);
console.log(`\nPushed ${tag}.`);

if (ci || process.env.GH_TOKEN) {
  const file = join(mkdtempSync(join(tmpdir(), 'ui-release-')), 'notes.md');
  writeFileSync(file, notes || `Release ${tag}.`);
  execFileSync('gh', ['release', 'create', tag, '--title', tag, '--notes-file', file, '--verify-tag'], { stdio: 'inherit' });
}
if (ci) {
  execFileSync('gh', ['workflow', 'run', 'fanout.yml', '--ref', 'master', '-f', `tag=${tag}`], { stdio: 'inherit' });
  console.log('Dispatched the fan-out.');
}
console.log(`The fan-out opens the bump PRs: https://github.com/nishant/ui/actions/workflows/fanout.yml`);
console.log(`arora-home is not in the fan-out: bash scripts/bump-consumers.sh ${tag}`);
