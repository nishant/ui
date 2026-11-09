#!/usr/bin/env node
// Publish a release tag to npm as nish-ui: node tools/npm-publish.mjs <tag-checkout> [--tag vX.Y.Z] [--dry-run]
//
// Run by .github/workflows/publish.yml, which checks out the tag (it carries dist/) into its own
// folder. The repo and every tag keep the name @nish/ui, so the fan-out and the tags
// never see the npm name; only the copy published here is renamed (the @nish scope on npm is
// someone else's). Publishing is idempotent: a version already on npm is skipped.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const NPM_NAME = 'nish-ui';
const REGISTRY = 'https://registry.npmjs.org';

/** -1, 0 or 1 for two x.y.z versions (no prerelease tags here). */
export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/**
 * The manifest npm gets: renamed, with the metadata an old tag may lack, and without what only
 * this repo uses (scripts would also name files the package does not ship).
 * @param {Record<string, unknown>} pkg  the tag's package.json
 */
export function publishManifest(pkg, name = NPM_NAME) {
  const { scripts: _scripts, devDependencies: _dev, ...rest } = pkg;
  return {
    ...rest,
    name,
    license: rest.license ?? 'MIT',
    homepage: rest.homepage ?? 'https://design.nish.software',
    // Provenance checks this against the repo the workflow runs in.
    repository: rest.repository ?? { type: 'git', url: 'git+https://github.com/nishant/ui.git' },
    bugs: rest.bugs ?? { url: 'https://github.com/nishant/ui/issues' },
  };
}

/**
 * What to do with one tag.
 * @param {object} p
 * @param {string|null} p.tag        the tag asked for (vX.Y.Z), or null to trust package.json
 * @param {string} p.version         package.json version in the tag checkout
 * @param {boolean} p.distOk         dist/ is in the checkout
 * @param {string[]|null} p.published  versions on npm, or null when the package is not on npm yet
 * @returns {{action:'publish'|'skip'|'fail', reason:string, distTag?:string}}
 */
export function plan({ tag, version, distOk, published }) {
  if (tag !== null && tag !== `v${version}`) return { action: 'fail', reason: `${tag} has package.json version ${version}` };
  if (!distOk) return { action: 'fail', reason: `the checkout of v${version} has no dist/ (is it a release tag?)` };
  if (published?.includes(version)) return { action: 'skip', reason: `${NPM_NAME}@${version} is already on npm` };
  // Trusted publishing (the only auth; npm disallows tokens for nish-ui) works only on a package that exists.
  if (published === null) {
    return { action: 'fail', reason: `${NPM_NAME} is not on npm: trusted publishing needs the package to exist (docs/RELEASING.md, "npm")` };
  }
  const newest = published.reduce((m, v) => (m === null || compareVersions(v, m) > 0 ? v : m), null);
  // An older version (a backfill) must not take `latest` from a newer one.
  const distTag = newest !== null && compareVersions(version, newest) < 0 ? 'previous' : 'latest';
  return { action: 'publish', reason: `publish ${NPM_NAME}@${version} as ${distTag}`, distTag };
}

/** Versions on npm, or null when the package does not exist there yet. */
async function publishedVersions(name) {
  const res = await fetch(`${REGISTRY}/${name.replaceAll('/', '%2f')}`, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`npm registry answered ${res.status} for ${name}`);
  const doc = await res.json();
  return Object.keys(doc.versions ?? {});
}

function summary(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
}

export async function main(argv, deps = {}) {
  const getPublished = deps.publishedVersions ?? publishedVersions;
  const runNpm = deps.runNpm ?? ((a, cwd) => execFileSync('npm', a, { cwd, stdio: 'inherit' }));
  const dryRun = argv.includes('--dry-run');
  const ti = argv.indexOf('--tag');
  const tag = ti >= 0 ? argv[ti + 1] : null;
  const dir = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--tag');
  if (!dir) {
    console.error('usage: node tools/npm-publish.mjs <tag-checkout> [--tag vX.Y.Z] [--dry-run]');
    return 2;
  }
  const file = join(dir, 'package.json');
  const original = readFileSync(file, 'utf8');
  const pkg = JSON.parse(original);
  const decision = plan({
    tag,
    version: pkg.version,
    distOk: existsSync(join(dir, 'dist', 'esm', 'index.js')),
    published: await getPublished(NPM_NAME),
  });
  if (decision.action === 'fail') {
    summary(`### npm: not published\n\n${decision.reason}`);
    return 1;
  }
  if (decision.action === 'skip') {
    summary(`### npm: nothing published\n\n${decision.reason}`);
    return 0;
  }
  writeFileSync(file, JSON.stringify(publishManifest(pkg), null, 2) + '\n');
  const args = ['publish', '--access', 'public', '--ignore-scripts', '--tag', decision.distTag];
  // Provenance needs a CI identity, so a local dry run leaves the flag off.
  if (process.env.GITHUB_ACTIONS === 'true') args.push('--provenance');
  if (dryRun) args.push('--dry-run');
  try {
    runNpm(args, dir);
  } finally {
    // A dry run must not leave the renamed manifest behind.
    if (dryRun) writeFileSync(file, original);
  }
  summary(
    dryRun
      ? `### npm: dry run\n\nWould ${decision.reason}.`
      : `### npm: published\n\n[${NPM_NAME}@${pkg.version}](https://www.npmjs.com/package/${NPM_NAME}/v/${pkg.version}) (${decision.distTag}).`,
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      summary(`### npm: not published\n\n${e.message}`);
      process.exit(1);
    },
  );
}
