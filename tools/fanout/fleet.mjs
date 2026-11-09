#!/usr/bin/env node
// Reads the fleet from hosting's generated catalog.json and runs the --matrix CLI the
// fan-out workflow uses.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const UI_KINDS = ['npm', 'pnpm', 'vendored', 'none'];

const str = (v) => (typeof v === 'string' ? v : '');

const strList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);

/**
 * The fleet from hosting's generated catalog.json: every repo with `fleet: true`.
 * @param {unknown} json the parsed catalog (or its text)
 * @returns {Array<{repo:string,name:string,base:string,ui:string,uiDir:string,uiExtraDirs:string[],bump:string|null,live:string|null,checkout:string,hosts:string[],deploy:string,fold:boolean}>}
 */
export function fleetFromCatalog(json) {
  const catalog = typeof json === 'string' ? JSON.parse(json) : json;
  const repos = Array.isArray(catalog?.repos) ? catalog.repos : [];
  return repos
    .filter((e) => e && e.fleet === true && typeof e.repo === 'string' && e.repo)
    .map((e) => {
      const short = e.repo.split('/').pop();
      const live = typeof e.live === 'string' && e.live && e.live.toLowerCase() !== 'none' ? e.live : null;
      return {
        repo: e.repo,
        name: str(e.name) || short,
        base: str(e.base) || 'master',
        ui: UI_KINDS.includes(e.ui) ? e.ui : 'none',
        uiDir: str(e.uiDir) || '.',
        // More folders that pin @nish/ui the same way (a worker or server package in the same repo).
        uiExtraDirs: strList(e.uiExtraDirs),
        bump: str(e.bump) || null,
        live,
        checkout: str(e.id) || short,
        hosts: strList(e.hosts),
        deploy: str(e.deploy) || 'deploy.yml',
        fold: e.fold === true,
      };
    });
}

function main(argv) {
  const ri = argv.indexOf('--repo');
  const file = argv.find((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1));
  if (!file) {
    console.error('usage: fleet.mjs <catalog.json> [--matrix] [--repo owner/name|all]');
    return 2;
  }
  const repo = ri >= 0 ? argv[ri + 1] || 'all' : 'all';
  const fleet = fleetFromCatalog(readFileSync(file, 'utf8'));
  const picked = repo === 'all' ? fleet : fleet.filter((e) => e.repo === repo);
  const unknown = repo !== 'all' && picked.length === 0;
  if (unknown) console.error(`Unknown repo ${repo}: not in ${file}`);
  if (argv.includes('--matrix')) {
    console.log(`matrix=${JSON.stringify(picked.map((e) => ({ repo: e.repo })))}`);
  } else {
    console.log(JSON.stringify(picked, null, 2));
  }
  return unknown ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
