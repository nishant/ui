// The one shared "direct call to this app on this PC" check. Framework-free.
export type HeaderBag = Headers | Record<string, string | string[] | undefined>;

const LOOPBACK_PEERS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const FORBIDDEN_HEADERS = ['forwarded', 'via', 'x-real-ip', 'true-client-ip', 'cdn-loop', 'origin'];
const FORBIDDEN_PREFIXES = ['x-forwarded-', 'cf-'];

function headerNames(headers: HeaderBag): string[] {
  if (typeof (headers as Headers).forEach === 'function' && typeof (headers as Headers).get === 'function') {
    const names: string[] = [];
    (headers as Headers).forEach((_v, k) => names.push(k.toLowerCase()));
    return names;
  }
  return Object.entries(headers as Record<string, string | string[] | undefined>)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k.toLowerCase());
}

function headerValue(headers: HeaderBag, name: string): string | undefined {
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined;
  for (const [k, v] of Object.entries(headers as Record<string, string | string[] | undefined>)) {
    if (k.toLowerCase() === name) return Array.isArray(v) ? v[0] : v;
  }
  return undefined;
}

/** The one shared "direct call to this app on this PC" check. True only when every rule holds:
 *  remoteAddress is 127.0.0.1, ::1 or ::ffff:127.0.0.1; header host === `127.0.0.1:${port}`;
 *  none of these headers is present: forwarded, via, x-real-ip, true-client-ip, cdn-loop, origin, and any name
 *  starting with x-forwarded- or cf-; no sec-fetch-* header (site, dest, user: browsers only) except
 *  sec-fetch-mode with the exact value 'cors', which Node's own fetch (undici) always sends.
 *  Header names compared lowercase; Headers and Node IncomingHttpHeaders both accepted. */
export function isDirectCall(req: { headers: HeaderBag; remoteAddress: string | null | undefined; port: number }): boolean {
  if (!req.remoteAddress || !LOOPBACK_PEERS.has(req.remoteAddress)) return false;
  if (headerValue(req.headers, 'host') !== `127.0.0.1:${req.port}`) return false;
  for (const name of headerNames(req.headers)) {
    if (FORBIDDEN_HEADERS.includes(name)) return false;
    if (FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) return false;
    if (name.startsWith('sec-fetch-') && !(name === 'sec-fetch-mode' && headerValue(req.headers, name) === 'cors')) return false;
  }
  return true;
}
