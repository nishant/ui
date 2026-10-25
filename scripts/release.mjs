#!/usr/bin/env node
// Cut a release: npm run release <patch|minor|major|x.y.z>
//
// master never carries dist/. A release bumps the version on master, then makes a
// tag commit on top of it that adds the built dist/, so `github:nishant/ui#vX.Y.Z`
// installs ready to use with no build step, and site-dist/ (the docs site). Pushes master and the tag.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const bump = process.argv[2];
if (!bump) {
  console.error('usage: npm run release <patch|minor|major|x.y.z>');
  process.exit(2);
}
if (out('git status --porcelain')) throw new Error('working tree is not clean');
if (out('git rev-parse --abbrev-ref HEAD') !== 'master') throw new Error('release from master');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const version =
  bump === 'major' ? `${ma + 1}.0.0` : bump === 'minor' ? `${ma}.${mi + 1}.0` : bump === 'patch' ? `${ma}.${mi}.${pa + 1}` : bump;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`bad version ${version}`);
const tag = `v${version}`;
if (out(`git tag -l ${tag}`)) throw new Error(`${tag} already exists`);

sh('npm run check');

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

sh('git push -q origin master');
sh(`git push -q origin ${tag}`);
console.log(`\nReleased ${tag}. Bump consumers: scripts/bump-consumers.sh ${tag}`);
