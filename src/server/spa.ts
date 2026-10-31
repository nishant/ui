// A static single-page-app file handler on web-standard Request and Response.
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export interface SpaOptions {
  dir: string; // absolute path of the built UI, e.g. <root>/dist/public
  index?: string; // 'index.html'
  immutable?: string[]; // URL path prefixes cached for a year: ['/assets/']
  maxAge?: number; // seconds for other static files: 3600
  notBuilt?: string; // 'UI not built: run npm run build'
}

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

const text = (body: string, status: number): Response =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export function createSpaHandler(o: SpaOptions): (req: Request) => Promise<Response> {
  const dir = resolve(o.dir);
  const indexName = o.index ?? 'index.html';
  const immutable = o.immutable ?? [];
  const maxAge = o.maxAge ?? 3600;
  const notBuilt = o.notBuilt ?? 'UI not built: run npm run build';
  const indexPath = resolve(dir, indexName);

  const send = async (file: string, cache: string, head: boolean): Promise<Response> => {
    const body = head ? null : await readFile(file);
    return new Response(body, { status: 200, headers: { 'Content-Type': contentType(file), 'Cache-Control': cache } });
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
