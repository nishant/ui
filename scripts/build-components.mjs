// dist/nish-components.css: the opt-in component classes for static pages, copied from
// src/css/components.css. scripts/build.mjs calls this and lists the file in
// dist/files.json "static". The copy fails the build when a selector is not wrapped in
// :where(), because zero specificity is the promise that a site's own CSS always wins.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const COMPONENTS_CSS = 'nish-components.css';

/** Copies src/css/components.css to dist/nish-components.css after checking it. */
export function buildComponentsCss(src, dist) {
  const css = readFileSync(join(src, 'css/components.css'), 'utf8');
  const bad = unwrappedSelectors(css);
  if (bad.length) {
    throw new Error(`src/css/components.css: every selector must be wrapped in :where():\n  ${bad.join('\n  ')}`);
  }
  writeFileSync(join(dist, COMPONENTS_CSS), css);
  return COMPONENTS_CSS;
}

/** Selectors that are not a chain of :where(…) parts (combinators and ::pseudo-elements
 *  between them are fine). Keyframe steps and at-rule preludes are skipped. */
export function unwrappedSelectors(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = [];
  const stack = []; // 'keyframes' | 'at' | 'rule'
  let buf = '';
  for (const ch of text) {
    if (ch === '{') {
      const prelude = buf.trim();
      buf = '';
      if (prelude.startsWith('@')) {
        stack.push(/^@(-\w+-)?keyframes\b/.test(prelude) ? 'keyframes' : 'at');
        continue;
      }
      if (stack.at(-1) !== 'keyframes') {
        for (const sel of splitTop(prelude)) if (!isWrapped(sel)) bad.push(sel);
      }
      stack.push('rule');
    } else if (ch === '}') {
      stack.pop();
      buf = '';
    } else if (ch === ';') {
      buf = '';
    } else {
      buf += ch;
    }
  }
  return bad;
}

/** Splits a selector list on top-level commas (not the ones inside :where(…)). */
function splitTop(list) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** True when every compound in the selector is :where(…), optionally followed by a
 *  ::pseudo-element, joined by combinators. */
function isWrapped(sel) {
  let rest = sel.replace(/\s+/g, ' ').trim();
  while (rest) {
    if (!rest.startsWith(':where(')) return false;
    let depth = 0;
    let i = 0;
    for (; i < rest.length; i++) {
      if (rest[i] === '(') depth++;
      if (rest[i] === ')' && --depth === 0) break;
    }
    rest = rest.slice(i + 1);
    rest = rest.replace(/^::[\w-]+(\([^)]*\))?/, '');
    rest = rest.replace(/^\s*[>+~]?\s*/, '');
  }
  return true;
}
