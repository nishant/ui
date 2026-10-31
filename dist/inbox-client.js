// src/server/inbox/types.ts
var INBOX_ACTION_HEADER = "X-Inbox-Action";
var INBOX_ACTION_TIMEOUT_MS = 8e3;
var INBOX_DEFAULT_SETTINGS = {
  timezone: "America/Chicago",
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  digest: { enabled: true, time: "08:00" },
  mutedSources: []
};
var INBOX_SOURCE_LABELS = {
  trading: "Trading",
  trackers: "Trackers",
  "job-apps": "Jobs",
  status: "Status",
  ci: "CI",
  "mc-packs": "Packs",
  workflows: "Workflows"
};

// src/server/inbox/client.ts
var SOURCE_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
var KIND_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
var ISO_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
var SEVERITIES = ["info", "normal", "urgent"];
var ACTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
var ACTIONS_MAX = 3;
function cut(text, max) {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max - 1).join("") + "\u2026" : text;
}
function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isInboxActionTarget(target) {
  if (typeof target !== "string" || target.length > 2e3) return false;
  let u;
  try {
    u = new URL(target);
  } catch {
    return false;
  }
  return u.protocol === "http:" && u.hostname === "127.0.0.1" && u.port !== "" && u.username === "" && u.password === "" && u.hash === "" && !target.includes("#") && u.href.length <= 2e3;
}
function parseActions(input) {
  const fail = (error) => ({ ok: false, error });
  if (input === void 0 || input === null) return { ok: true, value: null };
  if (!Array.isArray(input) || input.length > ACTIONS_MAX) return fail(`actions must be a list of at most ${ACTIONS_MAX}`);
  const out = [];
  for (const a of input) {
    if (!isPlainObject(a)) return fail(`actions must be a list of at most ${ACTIONS_MAX}`);
    if (typeof a.id !== "string" || !ACTION_ID_RE.test(a.id)) return fail("action id must be lowercase letters, digits or dashes");
    if (out.some((o) => o.id === a.id)) return fail("action ids must be unique");
    const label = typeof a.label === "string" ? a.label.trim() : "";
    if (!label) return fail("action label is required");
    if (a.method !== void 0 && a.method !== "POST") return fail("action method must be 'POST'");
    if (!isInboxActionTarget(a.target)) return fail("action target must be http://127.0.0.1:<port>/\u2026");
    out.push({ id: a.id, label: cut(label, 40), method: "POST", target: new URL(a.target).href });
  }
  return { ok: true, value: out.length ? out : null };
}
function parseInboxEvent(input) {
  const fail = (error) => ({ ok: false, error });
  if (!isPlainObject(input)) return fail("event must be an object");
  const { source, kind } = input;
  if (typeof source !== "string" || !SOURCE_RE.test(source)) return fail("source must be lowercase letters, digits or dashes");
  if (typeof kind !== "string" || !KIND_RE.test(kind)) return fail("kind must be lowercase letters, digits or dashes");
  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (!rawTitle) return fail("title is required");
  const title = cut(rawTitle, 140);
  let body = null;
  if (typeof input.body === "string") {
    const trimmed = input.body.trim();
    body = trimmed ? cut(trimmed, 2e3) : null;
  }
  let url = null;
  if (input.url !== void 0 && input.url !== null) {
    const bad = "url must be an http or https link";
    if (typeof input.url !== "string" || input.url.length > 2e3) return fail(bad);
    let parsed;
    try {
      parsed = new URL(input.url);
    } catch {
      return fail(bad);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fail(bad);
    url = parsed.href;
    if (url.length > 2e3) return fail(bad);
  }
  let severity = "normal";
  if (input.severity !== void 0 && input.severity !== null) {
    if (typeof input.severity !== "string" || !SEVERITIES.includes(input.severity)) {
      return fail("severity must be info, normal or urgent");
    }
    severity = input.severity;
  }
  let dedupeKey = null;
  if (input.dedupeKey !== void 0 && input.dedupeKey !== null) {
    if (typeof input.dedupeKey !== "string" || input.dedupeKey.length < 1 || input.dedupeKey.length > 200) {
      return fail("dedupeKey must be 1-200 characters");
    }
    dedupeKey = input.dedupeKey;
  }
  const resolve = input.resolve === true;
  if (resolve && dedupeKey === null) return fail("resolve needs a dedupeKey");
  const now = Date.now();
  let occurredMs = now;
  if (input.occurredAt !== void 0 && input.occurredAt !== null) {
    const bad = "occurredAt must be an ISO date";
    if (typeof input.occurredAt !== "string" || !ISO_RE.test(input.occurredAt)) return fail(bad);
    const ms = Date.parse(input.occurredAt);
    if (Number.isNaN(ms)) return fail(bad);
    occurredMs = Math.min(ms, now);
  }
  let data = null;
  if (input.data !== void 0 && input.data !== null) {
    const bad = "data must be a flat object of strings, numbers, booleans or null";
    if (!isPlainObject(input.data)) return fail(bad);
    for (const v of Object.values(input.data)) {
      const ok = v === null || typeof v === "string" || typeof v === "boolean" || typeof v === "number" && Number.isFinite(v);
      if (!ok) return fail(bad);
    }
    if (new TextEncoder().encode(JSON.stringify(input.data)).length > 4096) return fail("data is larger than 4 KB");
    data = input.data;
  }
  const actions = parseActions(input.actions);
  if (!actions.ok) return actions;
  return {
    ok: true,
    value: {
      source,
      kind,
      title,
      body,
      url,
      severity,
      dedupeKey,
      resolve,
      occurredAt: new Date(occurredMs).toISOString(),
      data,
      actions: actions.value
    }
  };
}
var QUEUE_MAX = 200;
var RETRY_DELAYS_MS = [3e4, 6e4, 12e4, 3e5];
var DEFAULT_URL = "http://127.0.0.1:8805";
function createInboxClient(options) {
  const sourceId = options.source;
  const env = typeof process !== "undefined" ? process.env : void 0;
  const envUrl = env?.INBOX_URL;
  const devOff = options.url === void 0 && !envUrl && !!env?.npm_lifecycle_event && env?.NODE_ENV !== "production";
  const baseUrl = (options.url ?? (envUrl || DEFAULT_URL)).trim();
  const disabled = baseUrl === "off" || devOff;
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/ingest/events`;
  const timeoutMs = options.timeoutMs ?? 3e3;
  const log = options.log ?? ((message) => console.warn(`[inbox] ${message}`));
  if (devOff) log("off outside production; set INBOX_URL to send");
  const queue = [];
  const loggedInvalid = /* @__PURE__ */ new Set();
  let down = false;
  let sentSinceDown = 0;
  let lastFullLog = 0;
  let retryStep = 0;
  let timer = null;
  let flushing = null;
  let retryAfterMs = 0;
  let chain = Promise.resolve();
  function serial(fn) {
    const run = chain.then(fn, fn);
    chain = run.catch(() => void 0);
    return run;
  }
  async function attempt(event) {
    const doFetch = options.fetch ?? globalThis.fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Inbox-Client": "1" },
        body: JSON.stringify(event),
        signal: controller.signal
      });
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (res.status >= 200 && res.status < 300) {
        const first = isPlainObject(body) && Array.isArray(body.results) ? body.results[0] : void 0;
        const id = isPlainObject(first) && typeof first.id === "number" ? first.id : null;
        const action = isPlainObject(first) && typeof first.action === "string" ? first.action : "ignored";
        return { kind: "ok", id, action };
      }
      if (res.status === 429) {
        const ra = Number(res.headers?.get?.("retry-after"));
        return { kind: "failed", error: "HTTP 429", retryAfterMs: Number.isFinite(ra) && ra > 0 ? Math.min(ra, 3600) * 1e3 : void 0 };
      }
      if (res.status >= 400 && res.status < 500) {
        const message = isPlainObject(body) && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        return { kind: "rejected", error: message };
      }
      return { kind: "failed", error: `HTTP ${res.status}` };
    } catch (err) {
      const message = controller.signal.aborted ? `timed out after ${timeoutMs} ms` : err instanceof Error ? err.message : String(err);
      return { kind: "failed", error: message };
    } finally {
      clearTimeout(timeout);
    }
  }
  function schedule() {
    if (timer !== null || queue.length === 0) return;
    const delay = Math.max(RETRY_DELAYS_MS[Math.min(retryStep, RETRY_DELAYS_MS.length - 1)], retryAfterMs);
    retryAfterMs = 0;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
    timer.unref?.();
  }
  function enqueue(event) {
    if (queue.length >= QUEUE_MAX) {
      queue.shift();
      const now = Date.now();
      if (now - lastFullLog >= 6e4) {
        lastFullLog = now;
        log("queue full, dropped 1 event");
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
  async function drain() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    while (queue.length > 0) {
      const head = queue[0];
      const result = await attempt(head);
      if (result.kind === "failed") {
        retryStep++;
        retryAfterMs = result.retryAfterMs ?? 0;
        schedule();
        return;
      }
      if (queue[0] === head) queue.shift();
      if (result.kind === "ok") sentSinceDown++;
    }
    retryStep = 0;
    if (down) {
      down = false;
      log(`inbox back, sent ${sentSinceDown} queued`);
      sentSinceDown = 0;
    }
  }
  function flush() {
    if (!flushing) {
      flushing = serial(drain).catch(() => void 0).finally(() => {
        flushing = null;
      });
    }
    return flushing;
  }
  async function sendNow(event) {
    try {
      const parsed = parseInboxEvent({ ...event, source: sourceId });
      if (!parsed.ok) {
        if (!loggedInvalid.has(parsed.error)) {
          loggedInvalid.add(parsed.error);
          log(`invalid event from ${sourceId}: ${parsed.error}`);
        }
        return { ok: false, error: parsed.error, queued: false };
      }
      if (disabled) return { ok: false, error: "disabled", queued: false };
      if (queue.length > 0) {
        enqueue(parsed.value);
        void flush();
        return { ok: false, error: "queued behind earlier events", queued: true };
      }
      const result = await attempt(parsed.value);
      if (result.kind === "ok") {
        return { ok: true, id: result.id, action: result.action };
      }
      if (result.kind === "rejected") return { ok: false, error: result.error, queued: false };
      retryAfterMs = result.retryAfterMs ?? 0;
      enqueue(parsed.value);
      return { ok: false, error: result.error, queued: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), queued: false };
    }
  }
  const send = (event) => serial(() => sendNow(event));
  return {
    send,
    resolve: (dedupeKey) => send({ kind: "resolve", title: "resolve", dedupeKey, resolve: true }),
    flush,
    get pending() {
      return queue.length;
    }
  };
}
export {
  INBOX_ACTION_HEADER,
  INBOX_ACTION_TIMEOUT_MS,
  INBOX_DEFAULT_SETTINGS,
  INBOX_SOURCE_LABELS,
  createInboxClient,
  isInboxActionTarget,
  parseInboxEvent
};
//# sourceMappingURL=inbox-client.js.map