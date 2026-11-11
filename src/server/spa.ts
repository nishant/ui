// A static single-page-app file handler on web-standard Request and Response.
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export interface SpaOptions {
  dir: string; // absolute path of the built UI, e.g. <root>/dist/public
  index?: string; // 'index.html'
  immutable?: string[]; // URL path prefixes cached for a year: ['/assets/']
  maxAge?: number; // seconds for other static files: 3600
  notBuilt?: string; // 'UI not built: run npm run build'
  /** Sends `X-Frame-Options: SAMEORIGIN` unless false (for an app that is meant to be framed). */
  frameOptions?: false;
  /** Sends a Content-Security-Policy on HTML answers. Off by default. 'strict' or an object builds
   *  default-src 'self'; script-src 'self' <sha256 of every inline <script> in the HTML>; style-src 'self' 'unsafe-inline'; img-src 'self' data: <img>; connect-src 'self' <connect>; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' (or <frameAncestors>).
   *  reportOnly sends Content-Security-Policy-Report-Only instead, to try a policy first. */
  csp?: 'strict' | { connect?: string[]; img?: string[]; script?: string[]; frameAncestors?: string[]; reportOnly?: boolean };
}

/** Sent on every answer. */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  woff: 'font/woff',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml',
};

function contentType(file: string): string {
  const dot = file.lastIndexOf('.');
  const ext = dot < 0 ? '' : file.slice(dot + 1).toLowerCase();
  return TYPES[ext] ?? 'application/octet-stream';
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

type CspOptions = { connect?: string[]; img?: string[]; script?: string[]; frameAncestors?: string[]; reportOnly?: boolean };

function checkSources(list: string[] | undefined): string[] {
  const out = list ?? [];
  for (const v of out) {
    if (/[;,\r\n]/.test(v)) throw new Error(`@nish/ui/server: bad csp source: ${v}`);
  }
  return out;
}

/** 'sha256-...' source for the content of every inline <script> (no src attribute) in the HTML. */
function inlineScriptHashes(html: string): string[] {
  const lower = html.toLowerCase();
  const hashes = new Set<string>();
  let i = lower.indexOf('<script');
  while (i >= 0) {
    const tagEnd = lower.indexOf('>', i);
    if (tagEnd < 0) break;
    const next = lower.charAt(i + 7);
    const isTag = next === '>' || next === '/' || /\s/.test(next);
    const close = lower.indexOf('</script', tagEnd + 1);
    if (isTag) {
      const attrs = lower.slice(i + 7, tagEnd);
      if (!/(?:^|[\s"'/])src\s*=/.test(attrs) && close >= 0) {
        const content = html.slice(tagEnd + 1, close);
        if (content.length > 0) hashes.add(`'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`);
      }
    }
    if (close < 0) break;
    i = lower.indexOf('<script', close);
  }
  return [...hashes];
}

/**
 * Serves a built single-page app: files under `dir`, the index for any other extensionless path.
 *
 * `csp` adds a Content-Security-Policy to HTML answers only. Every inline script in the HTML being
 * served is hashed automatically, so the theme-init script that nishThemeInit() injects into the
 * built index.html is allowed without copying its hash. An app that uses the nonce placeholder
 * setup (`__NISH_CSP_NONCE__`) should leave `csp` off and send its own header.
 */
export function createSpaHandler(o: SpaOptions): (req: Request) => Promise<Response> {
  const dir = resolve(o.dir);
  const indexName = o.index ?? 'index.html';
  const immutable = o.immutable ?? [];
  const maxAge = o.maxAge ?? 3600;
  const notBuilt = o.notBuilt ?? 'UI not built: run npm run build';
  const indexPath = resolve(dir, indexName);
  const safety: Record<string, string> = { ...SECURITY_HEADERS };
  if (o.frameOptions !== false) safety['X-Frame-Options'] = 'SAMEORIGIN';

  const cspOpt: CspOptions | undefined = o.csp === 'strict' ? {} : o.csp;
  const cspConnect = checkSources(cspOpt?.connect);
  const cspImg = checkSources(cspOpt?.img);
  const cspScript = checkSources(cspOpt?.script);
  const cspFrame = checkSources(cspOpt?.frameAncestors);
  const cspHeader = cspOpt?.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  const policies = new Map<string, { mtimeMs: number; policy: string }>();

  const buildPolicy = (html: string): string =>
    [
      "default-src 'self'",
      ['script-src', "'self'", ...inlineScriptHashes(html), ...cspScript].join(' '),
      "style-src 'self' 'unsafe-inline'",
      ['img-src', "'self'", 'data:', ...cspImg].join(' '),
      ['connect-src', "'self'", ...cspConnect].join(' '),
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      ['frame-ancestors', ...(cspFrame.length ? cspFrame : ["'self'"])].join(' '),
    ].join('; ');

  const text = (body: string, status: number): Response =>
    new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...safety } });

  const send = async (file: string, cache: string, head: boolean): Promise<Response> => {
    const type = contentType(file);
    const headers: Record<string, string> = { 'Content-Type': type, 'Cache-Control': cache, ...safety };
    if (cspOpt && type.startsWith('text/html')) {
      const mtimeMs = (await stat(file)).mtimeMs;
      const html = await readFile(file);
      let hit = policies.get(file);
      if (!hit || hit.mtimeMs !== mtimeMs) {
        hit = { mtimeMs, policy: buildPolicy(html.toString('utf8')) };
        policies.set(file, hit);
      }
      headers[cspHeader] = hit.policy;
      return new Response(head ? null : html, { status: 200, headers });
    }
    const body = head ? null : await readFile(file);
    return new Response(body, { status: 200, headers });
  };

  return async (req) => {
    const head = req.method === 'HEAD';
    if (req.method !== 'GET' && !head) return text('Not found.', 404);

    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url).pathname);
    } catch {
      return text('Bad request.', 400);
    }
    if (pathname.includes('\0') || pathname.includes('\\')) return text('Not found.', 404);
    const segments = pathname.split('/');
    if (segments.some((s) => s.startsWith('.') && s !== '.well-known')) return text('Not found.', 404);
    // NTFS aliases: 8.3 short names (ENV~1) and stream suffixes (name:$DATA) would bypass the dotfile rule.
    if (segments.some((s) => /~[0-9]|:/.test(s))) return text('Not found.', 404);

    const target = resolve(dir, '.' + pathname);
    if (target !== dir && !target.startsWith(dir + sep)) return text('Not found.', 404);

    if (target !== dir && (await isFile(target))) {
      let cache = `public, max-age=${maxAge}`;
      if (immutable.some((p) => pathname.startsWith(p))) cache = 'public, max-age=31536000, immutable';
      else if (target === indexPath) cache = 'no-cache';
      return send(target, cache, head);
    }

    if (/\.[A-Za-z0-9]{1,8}$/.test(segments[segments.length - 1] ?? '')) return text('Not found.', 404);

    if (!(await isFile(indexPath))) return text(notBuilt, 503);
    return send(indexPath, 'no-cache', head);
  };
}
