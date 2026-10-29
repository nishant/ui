// Release notes for a bump PR, taken from the ui CHANGELOG.md.
import { compare, parse } from './pin.mjs';

/**
 * Every `## [x.y.z]` section with from < x.y.z <= to, newest first. The section heading
 * becomes `### ` and `### ` headings become `#### ` so they nest under the PR's "Release
 * notes". `from` may be null (an unparseable pin): then only `to` is taken.
 * @returns {{ markdown: string, behaviorChanges: boolean }}
 */
export function sections(text, fromVersion, toVersion) {
  const lines = String(text ?? '').split(/\r?\n/);
  const found = [];
  let cur = null;
  for (const line of lines) {
    const h = /^## \[(\d+\.\d+\.\d+)\]/.exec(line);
    if (h) {
      cur = { version: `v${h[1]}`, lines: [line] };
      found.push(cur);
    } else if (/^## /.test(line)) {
      cur = null;
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  const useRange = !!fromVersion && !!parse(fromVersion);
  const picked = found
    .filter((s) =>
      useRange
        ? compare(s.version, fromVersion) > 0 && compare(s.version, toVersion) <= 0
        : compare(s.version, toVersion) === 0,
    )
    .sort((a, b) => compare(b.version, a.version));
  if (picked.length === 0) {
    return { markdown: `No CHANGELOG entry for ${toVersion}.`, behaviorChanges: false };
  }
  const behaviorChanges = picked.some((s) => s.lines.some((l) => /^### Behavior changes\s*$/.test(l)));
  const markdown = picked
    .map((s) =>
      s.lines
        .map((l) => (l.startsWith('## ') || l.startsWith('### ') ? `#${l}` : l))
        .join('\n')
        .trim(),
    )
    .join('\n\n');
  return { markdown, behaviorChanges };
}
