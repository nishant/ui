// Refuses state-changing requests a browser sends from another origin. Node or edge, no framework types.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface CrossSiteOptions {
  /** Origins besides the request's own that may send writes, like 'https://start.nish.software'. */
  allowedOrigins?: Iterable<string>;
}

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

/** True when a POST, PUT, PATCH or DELETE (any method but GET, HEAD and OPTIONS) came from a page on
 *  another origin. Another *.nish.software subdomain counts: SameSite=Lax session cookies ride along
 *  from those, so the cookie alone does not stop them.
 *  - `Sec-Fetch-Site: same-origin` or `none` passes; `same-site` or `cross-site` passes only with an
 *    Origin in allowedOrigins.
 *  - No Sec-Fetch-Site (an older browser): an Origin must match the Host header or allowedOrigins.
 *  - Neither header: not a browser page (curl, a server, the inbox and MCP callers), so it passes. */
export function isCrossSiteWrite(
  method: string,
  header: (name: string) => string | null | undefined,
  opts: CrossSiteOptions = {},
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  const site = header('sec-fetch-site')?.toLowerCase() || undefined;
  if (site === 'same-origin' || site === 'none') return false;
  const rawOrigin = header('origin') || undefined;
  if (rawOrigin === undefined) return site !== undefined;
  const origin = originOf(rawOrigin);
  if (origin === null) return true;
  for (const allowed of opts.allowedOrigins ?? []) {
    if (originOf(allowed) === origin) return false;
  }
  if (site !== undefined) return true;
  const host = header('host')?.toLowerCase();
  return host === undefined || new URL(origin).host !== host;
}
