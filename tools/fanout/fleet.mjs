#!/usr/bin/env node
// Parser for hosting/fleet.yaml (flat `- key: value` entries) and the --matrix CLI the
// fan-out workflow uses.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const UI_KINDS = ['npm', 'pnpm', 'vendored', 'none'];

function stripComment(line) {
  const m = /(^|\s)#/.exec(line);
  return m ? line.slice(0, m.index) : line;
}

function unquote(v) {
  return v.length >= 2 && /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

/** @returns {Array<{repo:string,name:string,base:string,ui:string,uiDir:string,bump:string|null,live:string|null,checkout:string,hosts:string[],deploy:string,fold:boolean}>} */
export function parseFleet(text) {
  const raw = [];
  let cur = null;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = stripComment(rawLine).trimEnd();
    if (!line.trim()) continue;
    const start = /^\s*-\s+([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (start) {
      cur = { [start[1]]: unquote(start[2].trim()) };
      raw.push(cur);
      continue;
    }
    const kv = /^\s+([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kv && cur) cur[kv[1]] = unquote(kv[2].trim());
  }
  return raw
    .filter((e) => e.repo)
    .map((e) => {
      const live = e.live && e.live.toLowerCase() !== 'none' ? e.live : null;
      const ui = UI_KINDS.includes(e.ui) ? e.ui : 'none';
      return {
        repo: e.repo,
        name: e.name || e.repo.split('/').pop(),
        base: e.base || 'master',
        ui,
        uiDir: e.uiDir || '.',
        bump: e.bump || null,
        live,
        checkout: e.checkout || e.repo.split('/').pop(),
        hosts: (e.hosts || '')
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean),
        deploy: e.deploy || 'deploy.yml',
        fold: (e.fold || '').toLowerCase() === 'yes',
      };
    });
}

function main(argv) {
  const ri = argv.indexOf('--repo');
  const file = argv.find((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1));
  if (!file) {
    console.error('usage: fleet.mjs <fleet.yaml> [--matrix] [--repo owner/name|all]');
    return 2;
  }
  const repo = ri >= 0 ? argv[ri + 1] || 'all' : 'all';
  const fleet = parseFleet(readFileSync(file, 'utf8'));
  const picked = repo === 'all' ? fleet : fleet.filter((e) => e.repo === repo);
  if (repo !== 'all' && picked.length === 0) console.error(`Unknown repo ${repo}: not in ${file}`);
  if (argv.includes('--matrix')) {
    console.log(`matrix=${JSON.stringify(picked.map((e) => ({ repo: e.repo })))}`);
  } else {
    console.log(JSON.stringify(picked, null, 2));
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
