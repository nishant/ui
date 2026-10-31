// One release's notes from CHANGELOG.md, for the GitHub Release that scripts/release.mjs creates.

/**
 * The body of the `## [version]` section (the lines up to the next `## ` heading), trimmed,
 * or null when CHANGELOG.md has no heading for exactly that version.
 * @param {string} text
 * @param {string} version x.y.z, without a leading v
 * @returns {string | null}
 */
export function changelogSection(text, version) {
  const lines = String(text ?? '').split(/\r?\n/);
  const want = `## [${version}]`;
  const start = lines.findIndex((l) => l === want || l.startsWith(`${want} `));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n').trim();
}
