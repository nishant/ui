// A failure-count limiter keyed by string, bounded in size.

export interface Limiter {
  /** Counts one attempt for key and says whether it may go ahead: true for the first `max`
   *  attempts inside the current window, false after. Synchronous, so check it before any
   *  `await` and parallel requests cannot all pass. A new key when the limiter is full of locked
   *  keys gets false. */
  hit(key: string, now?: number): boolean;
  /** False once `max` failures happened inside the current window for key. */
  allowed(key: string, now?: number): boolean;
  /** Records a failure. A missing or expired entry restarts at 1 with reset = now + windowMs. */
  fail(key: string, now?: number): void;
  reset(key: string): void;
  readonly size: number;
}

export function createLimiter(o: { max?: number; windowMs?: number; cap?: number } = {}): Limiter {
  const max = o.max ?? 10;
  const windowMs = o.windowMs ?? 60_000;
  const cap = o.cap ?? 10_000;
  const entries = new Map<string, { count: number; reset: number }>();

  /** Makes room for one new key: expired entries go first, then the oldest live entries that are
   *  not locked (count below max). A locked key is never evicted. False when still full. */
  const makeRoom = (now: number): boolean => {
    if (entries.size < cap) return true;
    for (const [k, v] of entries) if (v.reset <= now) entries.delete(k);
    for (const [k, v] of entries) {
      if (entries.size < cap) break;
      if (v.count < max) entries.delete(k);
    }
    return entries.size < cap;
  };

  /** The live entry for key, or a fresh one (null when there is no room). */
  const touch = (key: string, now: number): { count: number; reset: number } | null => {
    const e = entries.get(key);
    if (e && e.reset > now) return e;
    entries.delete(key);
    if (!makeRoom(now)) return null;
    const fresh = { count: 0, reset: now + windowMs };
    entries.set(key, fresh);
    return fresh;
  };

  return {
    hit(key, now = Date.now()) {
      const e = touch(key, now);
      if (!e) return false;
      e.count += 1;
      return e.count <= max;
    },
    allowed(key, now = Date.now()) {
      const e = entries.get(key);
      if (!e || e.reset <= now) return true;
      return e.count < max;
    },
    fail(key, now = Date.now()) {
      const e = touch(key, now);
      if (e) e.count += 1;
    },
    reset(key) {
      entries.delete(key);
    },
    get size() {
      return entries.size;
    },
  };
}
