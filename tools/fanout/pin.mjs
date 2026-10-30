// Pin helpers for the ui fan-out: read and rewrite how a repo pins @nish/ui, plus the
// small semver helpers the merge policy uses.

const TAG_RE = /(?:refs\/tags\/|#)(v\d+\.\d+\.\d+)/;

/** parse("v0.7.1") -> [0, 7, 1]; anything else -> null. */
export function parse(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Numeric compare of two versions: negative, 0 or positive. Unparseable sorts lowest. */
export function compare(a, b) {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

export function major(v) {
  const p = parse(v);
  return p ? p[0] : null;
}

/** Same major and minor. False when either side does not parse. */
export function isPatch(a, b) {
  const pa = parse(a);
  const pb = parse(b);
  return !!pa && !!pb && pa[0] === pb[0] && pa[1] === pb[1];
}

/** The pin file inside a repo: ui.json for vendored repos, package.json otherwise. */
export function pinFile(kind, uiDir = '.') {
  const name = kind === 'vendored' ? 'ui.json' : 'package.json';
  return !uiDir || uiDir === '.' ? name : `${uiDir.replace(/\/+$/, '')}/${name}`;
}

/** The tag a repo is pinned to (`vX.Y.Z`), or null when there is no readable pin. */
export function pinOf(kind, text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (kind === 'vendored') {
    return typeof json?.tag === 'string' && parse(json.tag) ? json.tag : null;
  }
  const spec = json?.dependencies?.['@nish/ui'] ?? json?.devDependencies?.['@nish/ui'];
  if (typeof spec !== 'string') return null;
  const m = TAG_RE.exec(spec);
  return m ? m[1] : null;
}

/**
 * Rewrite the pin to `tag` by string replacement, so the file's formatting is kept.
 * Throws `No @nish/ui pin in <path>` when there is nothing to replace.
 */
export function rewritePin(kind, text, tag, path = kind === 'vendored' ? 'ui.json' : 'package.json') {
  const re =
    kind === 'vendored' ? /("tag"\s*:\s*")v\d+\.\d+\.\d+(")/ : /("@nish\/ui"\s*:\s*")[^"]+(")/;
  if (!re.test(text)) throw new Error(`No @nish/ui pin in ${path}`);
  const value = kind === 'vendored' ? tag : `https://codeload.github.com/nishant/ui/tar.gz/refs/tags/${tag}`;
  return text.replace(re, (_m, a, b) => `${a}${value}${b}`);
}

const clean = (d) => (d || '.').replace(/\/+$/, '').replace(/^(\.\/)+/, '') || '.';

/** Every folder of a fleet entry that pins @nish/ui: `uiDir` first, then `uiExtraDirs`. */
export function pinDirs(entry) {
  return [...new Set([entry.uiDir, ...(entry.uiExtraDirs ?? [])].map(clean))];
}

/**
 * The lowest pin across `dirs`, read with `read(path)`. A folder whose pin cannot be read
 * fails the whole read, so a half-moved repo is never reported as current.
 * @returns {{pin:string|null, pins:Record<string,string|null>, error:string|null}}
 */
export function lowestPin(kind, dirs, read) {
  const pins = {};
  for (const d of dirs) {
    const path = pinFile(kind, d);
    let pin = null;
    try {
      pin = pinOf(kind, read(path));
    } catch {
      // unreadable counts as no pin
    }
    pins[d] = pin;
    if (!pin) return { pin: null, pins, error: `Could not read the pin in ${path}` };
  }
  const pin = Object.values(pins).sort(compare)[0] ?? null;
  return { pin, pins, error: null };
}

/**
 * The folders to regenerate the lockfile in: for each pin folder, the nearest folder at or above
 * it that has the package manager's lockfile (the repo root for a workspace). With one folder,
 * or none found, the repo root, as before uiExtraDirs.
 */
export function lockDirs(kind, dirs, exists) {
  const name = kind === 'pnpm' ? 'pnpm-lock.yaml' : kind === 'npm' ? 'package-lock.json' : null;
  if (!name) return [];
  // One folder: the repo root, exactly as before uiExtraDirs existed.
  if (dirs.length <= 1) return ['.'];
  const out = [];
  for (const start of dirs) {
    let d = clean(start);
    for (;;) {
      if (exists(d === '.' ? name : `${d}/${name}`)) {
        if (!out.includes(d)) out.push(d);
        break;
      }
      if (d === '.') break;
      const i = d.lastIndexOf('/');
      d = i < 0 ? '.' : d.slice(0, i);
    }
  }
  return out.length ? out : ['.'];
}
