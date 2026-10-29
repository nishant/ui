// @nish/ui/inbox-client: the shared inbox event types, the validator the service uses, and a
// dependency-free client that never throws and never blocks. No React; works in Node and browsers.
import type { InboxData, InboxEvent, InboxEventInput, InboxIngestAction, InboxSeverity } from './inbox-types';

export * from './inbox-types';

const SOURCE_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const KIND_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const SEVERITIES: readonly string[] = ['info', 'normal', 'urgent'];

/** Cuts text to `max` characters (code points, so never inside a surrogate pair), ending in an ellipsis. */
function cut(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max - 1).join('') + '…' : text;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validates a producer's event and applies defaults. Error strings are shown to producers as is. */
export function parseInboxEvent(input: unknown): { ok: true; value: InboxEvent } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!isPlainObject(input)) return fail('event must be an object');

  const { source, kind } = input;
  if (typeof source !== 'string' || !SOURCE_RE.test(source)) return fail('source must be lowercase letters, digits or dashes');
  if (typeof kind !== 'string' || !KIND_RE.test(kind)) return fail('kind must be lowercase letters, digits or dashes');

  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  if (!rawTitle) return fail('title is required');
  const title = cut(rawTitle, 140);

  let body: string | null = null;
  if (typeof input.body === 'string') {
    const trimmed = input.body.trim();
    body = trimmed ? cut(trimmed, 2000) : null;
  }

  let url: string | null = null;
  if (input.url !== undefined && input.url !== null) {
    const bad = 'url must be an http or https link';
    if (typeof input.url !== 'string' || input.url.length > 2000) return fail(bad);
    let parsed: URL;
    try {
      parsed = new URL(input.url);
    } catch {
      return fail(bad);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fail(bad);
    url = parsed.href;
    if (url.length > 2000) return fail(bad);
  }

  let severity: InboxSeverity = 'normal';
  if (input.severity !== undefined && input.severity !== null) {
    if (typeof input.severity !== 'string' || !SEVERITIES.includes(input.severity)) {
      return fail('severity must be info, normal or urgent');
    }
    severity = input.severity as InboxSeverity;
  }

  let dedupeKey: string | null = null;
  if (input.dedupeKey !== undefined && input.dedupeKey !== null) {
    if (typeof input.dedupeKey !== 'string' || input.dedupeKey.length < 1 || input.dedupeKey.length > 200) {
      return fail('dedupeKey must be 1-200 characters');
    }
    dedupeKey = input.dedupeKey;
  }

  const resolve = input.resolve === true;
  if (resolve && dedupeKey === null) return fail('resolve needs a dedupeKey');

  const now = Date.now();
  let occurredMs = now;
  if (input.occurredAt !== undefined && input.occurredAt !== null) {
    const bad = 'occurredAt must be an ISO date';
    if (typeof input.occurredAt !== 'string' || !ISO_RE.test(input.occurredAt)) return fail(bad);
    const ms = Date.parse(input.occurredAt);
    if (Number.isNaN(ms)) return fail(bad);
    occurredMs = Math.min(ms, now);
  }

  let data: InboxData | null = null;
  if (input.data !== undefined && input.data !== null) {
    const bad = 'data must be a flat object of strings, numbers, booleans or null';
    if (!isPlainObject(input.data)) return fail(bad);
    for (const v of Object.values(input.data)) {
      const ok = v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));
      if (!ok) return fail(bad);
    }
    if (new TextEncoder().encode(JSON.stringify(input.data)).length > 4096) return fail('data is larger than 4 KB');
    data = input.data as InboxData;
  }

  return {
    ok: true,
    value: { source, kind, title, body, url, severity, dedupeKey, resolve, occurredAt: new Date(occurredMs).toISOString(), data },
  };
}

/** Options for {@link createInboxClient}. */
export interface InboxClientOptions {
  /** Which app is sending, for example 'trackers'. Same rules as `InboxEventInput.source`. */
  source: string;
  /** Service address. Defaults to `process.env.INBOX_URL`, then 'http://127.0.0.1:8805'; 'off' disables the client. */
  url?: string;
  /** Request timeout in milliseconds. Default 3000. */
  timeoutMs?: number;
  /** Replacement for `fetch`, for tests. */
  fetch?: typeof fetch;
  /** Where messages go. Default `console.warn` with the prefix '[inbox] '. */
  log?: (message: string) => void;
}

/** The outcome of one send. The client never throws; check `ok`. */
export type InboxSendResult =
  | { ok: true; id: number | null; action: InboxIngestAction }
  | { ok: false; error: string; queued: boolean };

/** A client bound to one source. */
export interface InboxClient {
  /** Sends an event. Resolves with the result; network failures are queued and retried. */
  send(event: Omit<InboxEventInput, 'source'>): Promise<InboxSendResult>;
  /** Marks the open item with this dedupeKey handled by the source. Sends `{ kind: 'resolve', title: 'resolve', dedupeKey, resolve: true }`. */
  resolve(dedupeKey: string): Promise<InboxSendResult>;
  /** Retries the queue now; resolves when done. */
  flush(): Promise<void>;
  /** Number of queued events. */
  readonly pending: number;
}

const QUEUE_MAX = 200;
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 300_000];
const DEFAULT_URL = 'http://127.0.0.1:8805';

type Attempt =
  | { kind: 'ok'; id: number | null; action: InboxIngestAction }
  | { kind: 'rejected'; error: string }
  | { kind: 'failed'; error: string };

/** Creates a client that sends events to the inbox service without ever throwing or blocking the caller's work. */
export function createInboxClient(options: InboxClientOptions): InboxClient {
  const sourceId = options.source;
  const envUrl = typeof process !== 'undefined' ? process.env?.INBOX_URL : undefined;
  const baseUrl = (options.url ?? (envUrl || DEFAULT_URL)).trim();
  const disabled = baseUrl === 'off';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/ingest/events`;
  const timeoutMs = options.timeoutMs ?? 3000;
  const log = options.log ?? ((message: string) => console.warn(`[inbox] ${message}`));

  const queue: InboxEvent[] = [];
  const loggedInvalid = new Set<string>();
  let down = false;
  let sentSinceDown = 0;
  let lastFullLog = 0;
  let retryStep = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing: Promise<void> | null = null;

  async function attempt(event: InboxEvent): Promise<Attempt> {
    const doFetch = options.fetch ?? globalThis.fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Inbox-Client': '1' },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (res.status >= 200 && res.status < 300) {
        const first = isPlainObject(body) && Array.isArray(body.results) ? body.results[0] : undefined;
        const id = isPlainObject(first) && typeof first.id === 'number' ? first.id : null;
        const action = isPlainObject(first) && typeof first.action === 'string' ? (first.action as InboxIngestAction) : 'ignored';
        return { kind: 'ok', id, action };
      }
      if (res.status >= 400 && res.status < 500) {
        const message = isPlainObject(body) && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
        return { kind: 'rejected', error: message };
      }
      return { kind: 'failed', error: `HTTP ${res.status}` };
    } catch (err) {
      const message = controller.signal.aborted ? `timed out after ${timeoutMs} ms` : err instanceof Error ? err.message : String(err);
      return { kind: 'failed', error: message };
    } finally {
      clearTimeout(timeout);
    }
  }

  function schedule(): void {
    if (timer !== null || queue.length === 0) return;
    const delay = RETRY_DELAYS_MS[Math.min(retryStep, RETRY_DELAYS_MS.length - 1)];
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
    (timer as { unref?: () => void }).unref?.();
  }

  function enqueue(event: InboxEvent): void {
    if (queue.length >= QUEUE_MAX) {
      queue.shift();
      const now = Date.now();
      if (now - lastFullLog >= 60_000) {
        lastFullLog = now;
        log('queue full, dropped 1 event');
      }
    }
    queue.push(event);
    if (!down) {
      down = true;
      sentSinceDown = 0;
      log(`inbox unreachable, ${queue.length} queued`);
    }
    schedule();
  }

  async function drain(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    while (queue.length > 0) {
      const head = queue[0];
      const result = await attempt(head);
      if (result.kind === 'failed') {
        retryStep++;
        schedule();
        return;
      }
      if (queue[0] === head) queue.shift();
      if (result.kind === 'ok') sentSinceDown++;
    }
    retryStep = 0;
    if (down) {
      down = false;
      log(`inbox back, sent ${sentSinceDown} queued`);
      sentSinceDown = 0;
    }
  }

  function flush(): Promise<void> {
    if (!flushing) {
      flushing = drain()
        .catch(() => undefined)
        .finally(() => {
          flushing = null;
        });
    }
    return flushing;
  }

  async function send(event: Omit<InboxEventInput, 'source'>): Promise<InboxSendResult> {
    try {
      const parsed = parseInboxEvent({ ...event, source: sourceId });
      if (!parsed.ok) {
        if (!loggedInvalid.has(parsed.error)) {
          loggedInvalid.add(parsed.error);
          log(`invalid event from ${sourceId}: ${parsed.error}`);
        }
        return { ok: false, error: parsed.error, queued: false };
      }
      if (disabled) return { ok: false, error: 'disabled', queued: false };
      if (queue.length > 0) {
        enqueue(parsed.value);
        void flush();
        return { ok: false, error: 'queued behind earlier events', queued: true };
      }
      const result = await attempt(parsed.value);
      if (result.kind === 'ok') {
        return { ok: true, id: result.id, action: result.action };
      }
      if (result.kind === 'rejected') return { ok: false, error: result.error, queued: false };
      enqueue(parsed.value);
      return { ok: false, error: result.error, queued: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), queued: false };
    }
  }

  return {
    send,
    resolve: (dedupeKey) => send({ kind: 'resolve', title: 'resolve', dedupeKey, resolve: true }),
    flush,
    get pending() {
      return queue.length;
    },
  };
}
