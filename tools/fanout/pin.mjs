// Pin helpers for the ui fan-out: read and rewrite how a repo pins @nish/ui, plus the
// small semver helpers the merge policy uses.

// Old pins the fan-out still reads so it can migrate them: the codeload tarball and `github:`.
const TAG_RE = /(?:refs\/tags\/|#)(v\d+\.\d+\.\d+)/;
// The pin it writes: the npm alias, so every app install is an npm download of nish-ui.
const NPM_RE = /^npm:nish-ui@[\^~]?(\d+\.\d+\.\d+)$/;

/** The package.json value for `tag` (`v1.5.0` -> `npm:nish-ui@1.5.0`). */
export const npmSpec = (tag) => `npm:nish-ui@${String(tag).replace(/^v/, '')}`;

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
  const alias = NPM_RE.exec(spec.trim());
  if (alias) return `v${alias[1]}`;
  if (spec.startsWith('npm:')) return null; // an alias to some other package
  const m = TAG_RE.exec(spec);
  return m ? m[1] : null;
}

/**
 * Rewrite the pin to `tag` by string replacement, so the file's formatting is kept.
 * Throws `No @nish/ui pin in <path>` when there is nothing to replace.
 */
export function rewritePin(kind, text, tag, path = kind === 'vendored' ? 'ui.json' : 'package.json') {
  if (kind === 'vendored') {
    const re = /("tag"\s*:\s*")v\d+\.\d+\.\d+(")/;
    if (!re.test(text)) throw new Error(`No @nish/ui pin in ${path}`);
    return text.replace(re, (_m, a, b) => `${a}${tag}${b}`);
  }
  const re = /("@nish\/ui"\s*:\s*")[^"]+(")/;
  // Only inside the top-level dependencies / devDependencies object, in the order pinOf reads them.
  for (const key of ['dependencies', 'devDependencies']) {
    const span = topLevelObjectSpan(text, key);
    if (!span) continue;
    const inner = text.slice(span[0], span[1]);
    if (!re.test(inner)) continue;
    const out = inner.replace(re, (_m, a, b) => `${a}${npmSpec(tag)}${b}`);
    return text.slice(0, span[0]) + out + text.slice(span[1]);
  }
  throw new Error(`No @nish/ui pin in ${path}`);
}

/** [start, end) of the `{...}` value of a top-level `key` in JSON text, or null. */
function topLevelObjectSpan(text, key) {
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      if (depth === 1 && text.slice(i + 1, j) === key) {
        const m = /^\s*:\s*\{/.exec(text.slice(j + 1));
        if (m) return [j + 1 + m[0].length - 1, matchBrace(text, j + 1 + m[0].length - 1)];
      }
      i = j + 1;
      continue;
    }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    i++;
  }
  return null;
}

/** Index just past the `}` that closes the `{` at `open`. */
function matchBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
  }
  return text.length;
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
 * A package-lock.json with every installed `@nish/ui` entry removed (`packages` keys ending in
 * `node_modules/@nish/ui`, and lockfile v1/v2 `dependencies` entries at any depth), or null when it
 * has none. Run before `npm install --package-lock-only`: with the old root entry still in the
 * lock, npm 10 nests the new version under each workspace (job-apps on 1.7.0) instead of hoisting
 * it, and a root config that imports @nish/ui (eslint.config.mjs) can no longer resolve it.
 */
export function dropUiLockEntries(text) {
  let lock;
  try {
    lock = JSON.parse(text);
  } catch {
    return null;
  }
  let dropped = false;
  for (const key of Object.keys(lock?.packages ?? {})) {
    if (key === 'node_modules/@nish/ui' || key.endsWith('/node_modules/@nish/ui')) {
      delete lock.packages[key];
      dropped = true;
    }
  }
  const walk = (deps) => {
    if (!deps || typeof deps !== 'object') return;
    if ('@nish/ui' in deps) {
      delete deps['@nish/ui'];
      dropped = true;
    }
    for (const d of Object.values(deps)) walk(d?.dependencies);
  };
  walk(lock?.dependencies);
  return dropped ? `${JSON.stringify(lock, null, 2)}\n` : null;
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
