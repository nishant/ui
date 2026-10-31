// Which key a rate limiter should use for a request. Framework-free: pass a header getter.

/** 127.0.0.0/8, ::1 and ::ffff:127.x. */
export function isLoopback(address: string | null | undefined): boolean {
  if (!address) return false;
  const a = address.trim().toLowerCase();
  return a === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a) || a.startsWith('::ffff:127.');
}

/** The key a limiter should use for this request. cf-connecting-ip (trimmed, at most 64 chars,
 *  no comma) first; else the rightmost X-Forwarded-For entry that is not loopback (127.0.0.0/8,
 *  ::1, ::ffff:127.x) and not empty; else remoteAddress when it is not loopback; else 'local'. */
export function clientIp(get: (name: string) => string | null | undefined, remoteAddress?: string | null): string {
  const cf = get('cf-connecting-ip')?.trim();
  if (cf && cf.length <= 64 && !cf.includes(',')) return cf;
  const xff = get('x-forwarded-for');
  if (xff) {
    const entries = xff.split(',').map((e) => e.trim());
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i] !== '' && !isLoopback(entries[i])) return entries[i];
    }
  }
  if (remoteAddress && !isLoopback(remoteAddress)) return remoteAddress;
  return 'local';
}
