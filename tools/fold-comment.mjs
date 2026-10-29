#!/usr/bin/env node
// Posts (or updates) the Fold check comment on a pull request.
//
//   GITHUB_TOKEN=… GITHUB_REPOSITORY=owner/name PR_NUMBER=12 ARTIFACT_URL=… \
//     node tools/fold-comment.mjs fold-report/summary.json
//
// The comment text comes from formatComment() in fold-diff.mjs. The first comment whose
// body starts with <!-- fold-check --> is updated, otherwise a new one is created. Any
// error is printed and the script still exits 0: a comment must never fail the check.
import { readFileSync } from 'node:fs';

const MARKER = '<!-- fold-check -->';

async function main() {
  const file = process.argv[2];
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, ARTIFACT_URL } = process.env;
  if (!file) throw new Error('usage: fold-comment.mjs <summary.json>');
  for (const [name, value] of Object.entries({ GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER })) {
    if (!value) throw new Error(`${name} is not set`);
  }

  const { formatComment } = await import('./fold-diff.mjs');
  const summary = JSON.parse(readFileSync(file, 'utf8'));
  const body = formatComment(summary, ARTIFACT_URL || undefined);

  const base = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
  const call = async (method, path, payload) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'nish-ui-fold-comment',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
    }
    return res.json();
  };

  const comments = await call('GET', `/issues/${PR_NUMBER}/comments?per_page=100`);
  const existing = comments.find((c) => typeof c.body === 'string' && c.body.startsWith(MARKER));
  if (existing) {
    await call('PATCH', `/issues/comments/${existing.id}`, { body });
    console.log(`Updated Fold check comment ${existing.id} on #${PR_NUMBER}`);
  } else {
    const made = await call('POST', `/issues/${PR_NUMBER}/comments`, { body });
    console.log(`Posted Fold check comment ${made.id} on #${PR_NUMBER}`);
  }
}

main().catch((err) => {
  console.error(`fold-comment: ${err.message}`);
  process.exitCode = 0;
});
