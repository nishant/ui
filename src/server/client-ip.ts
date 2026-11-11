// Which key a rate limiter should use for a request. Framework-free: pass a header getter.

/** 127.0.0.0/8, ::1 and ::ffff:127.x. Not authentication: behind Caddy every public request arrives from loopback. */
export function isLoopback(address: string | null | undefined): boolean {
  if (!address) return false;
  const a = address.trim().toLowerCase();
  return a === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a) || a.startsWith('::ffff:127.');
}

/** Which forwarding headers `clientIp` believes.
 *  - 'none' (default): none. The socket address is the client. Right when the app is reached directly.
 *  - 'proxy': the rightmost `X-Forwarded-For` hop, which the nearest proxy appended itself. Use it
 *    when exactly one proxy you control sits in front of the app and no client can reach the app
 *    except through it.
 *  - 'cloudflare': `cf-connecting-ip`, then as 'proxy'. Use it only when every request really comes
 *    through Cloudflare (the origin refuses other traffic), or the header can be forged. */
export type TrustProxy = 'none' | 'proxy' | 'cloudflare';

export interface ClientIpOptions {
  trust?: TrustProxy; // 'none'
}

/** The address a limiter should key on, or null when the request has none (no trusted header and
 *  no socket address). Callers that rate limit must still count a null request: the session
 *  routes in hono.ts put every address-less request into one shared bucket.
 *  'none' returns the socket address as is (a loopback peer too: behind a local proxy, set
 *  `trust`). 'proxy' returns the rightmost X-Forwarded-For hop, else the socket address.
 *  'cloudflare' returns cf-connecting-ip (trimmed, at most 64 chars, no comma), else as 'proxy'. */
export function clientIp(
  get: (name: string) => string | null | undefined,
  remoteAddress?: string | null,
  opts: ClientIpOptions = {},
): string | null {
  const trust = opts.trust ?? 'none';
  if (trust === 'cloudflare') {
    const cf = get('cf-connecting-ip')?.trim();
    if (cf && cf.length <= 64 && !cf.includes(',')) return cf;
  }
  if (trust === 'cloudflare' || trust === 'proxy') {
    const xff = get('x-forwarded-for');
    if (xff) {
      const hop = xff.split(',').pop()?.trim();
      if (hop) return hop;
    }
  }
  return remoteAddress ? remoteAddress : null;
}
