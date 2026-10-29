import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { redact } from './gh.mjs';
import { latestTag, prBody, resultLine } from './fanout.mjs';

test('prBody: patch, no behavior changes', () => {
  const body = prBody({ pin: 'v0.7.0', tag: 'v0.7.1', behaviorChanges: false, markdown: '### [0.7.1]\n\nDocs.' });
  assert.equal(
    body,
    'Moves @nish/ui from v0.7.0 to v0.7.1. Opened by the ui fan-out.\n\n' +
      'It merges by itself when the checks pass, the Fold check finds no new problems and pages change less than 1% (patch update).\n\n' +
      '## Release notes\n\n### [0.7.1]\n\nDocs.',
  );
});

test('prBody: minor with behavior changes', () => {
  const body = prBody({ pin: 'v0.6.1', tag: 'v0.7.0', behaviorChanges: true, markdown: 'x' });
  assert.match(body, /\*\*Behavior changes:\*\* this release asks apps to change code, so it will not merge by itself\. Adopt it on this branch, then the fan-out merges it on its next run\./);
  assert.match(body, /less than 10% \(minor update\)/);
});

test('latestTag picks the highest version', () => {
  assert.equal(latestTag(['v0.9.0', 'v0.10.0', 'v0.2.1', 'junk', '']), 'v0.10.0');
  assert.equal(latestTag([]), null);
});

test('resultLine', () => {
  assert.equal(resultLine({ repo: 'a/b', result: 'merged', detail: 'deployed', pr: 4 }), '- **a/b**: merged, deployed (#4)');
  assert.equal(resultLine({ repo: 'a/b', result: 'current' }), '- **a/b**: current');
});

test('redact removes the token and clone credentials', () => {
  process.env.GH_TOKEN = 'ghp_secret123';
  assert.equal(redact('failed with ghp_secret123 here'), 'failed with *** here');
  assert.equal(redact('https://x-access-token:abc@github.com/a/b.git'), 'https://x-access-token:***@github.com/a/b.git');
});

test('CLI: missing GH_TOKEN exits 1 with a message', () => {
  const cli = new URL('./fanout.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const env = { ...process.env };
  delete env.GH_TOKEN;
  const r = spawnSync(process.execPath, [cli, '--fleet', 'nope.yaml', '--tag', 'latest'], { encoding: 'utf8', env });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /GH_TOKEN is not set/);
});
