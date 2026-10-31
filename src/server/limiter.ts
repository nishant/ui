// A failure-count limiter keyed by string, bounded in size.

export interface Limiter {
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
  return {
    allowed(key, now = Date.now()) {
      const e = entries.get(key);
      if (!e || e.reset <= now) return true;
      return e.count < max;
    },
    fail(key, now = Date.now()) {
      const e = entries.get(key);
      if (!e || e.reset <= now) {
        entries.delete(key);
        entries.set(key, { count: 1, reset: now + windowMs });
      } else {
        e.count += 1;
      }
      if (entries.size > cap) {
        for (const [k, v] of entries) if (v.reset <= now) entries.delete(k);
        for (const k of entries.keys()) {
          if (entries.size <= cap) break;
          entries.delete(k);
        }
      }
    },
    reset(key) {
      entries.delete(key);
    },
    get size() {
      return entries.size;
    },
  };
}
