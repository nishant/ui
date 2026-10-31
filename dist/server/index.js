// src/server/session.ts
import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
var SESSION_DAYS = 30;
var COOKIE_NAME_RE = /^[A-Za-z0-9_-]+$/;
var NONCE_RE = /^[0-9a-f]{24}$/;
var HEX_RE = /^[0-9a-f]+$/;
function equalStrings(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function createSessionToken(secret, now = Date.now(), days = SESSION_DAYS) {
  if (secret === "") throw new Error("session secret is empty");
  const expires = Math.floor(now / 1e3) + Math.round(days * 86400);
  const body = `v1.${expires}.${randomBytes(12).toString("hex")}`;
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifySessionToken(secret, token, opts = {}) {
  if (!secret || !token || typeof token !== "string") return false;
  const now = opts.now ?? Date.now();
  const parts = token.split(".");
  let signed;
  let sig;
  let encoding;
  if (parts.length === 4 && parts[0] === "v1" && NONCE_RE.test(parts[2])) {
    signed = parts.slice(0, 3).join(".");
    sig = parts[3];
    encoding = "base64url";
  } else if (opts.legacyHex && (parts.length === 3 && parts[0] === "v1" || parts.length === 4 && parts[0] === "v2")) {
    signed = parts.slice(0, -1).join(".");
    sig = parts[parts.length - 1];
    encoding = "hex";
    if (!HEX_RE.test(sig)) return false;
  } else {
    return false;
  }
  const expires = Number(parts[1]);
  if (!parts[1] || !Number.isFinite(expires) || expires * 1e3 <= now) return false;
  const expected = createHmac("sha256", secret).update(signed).digest(encoding);
  return equalStrings(expected, sig);
}
function passwordMatches(expected, provided, opts = {}) {
  if (typeof expected !== "string" || typeof provided !== "string" || expected === "") return false;
  const fold = opts.caseInsensitive ?? true;
  const a = fold ? expected.trim().toLowerCase() : expected;
  const b = fold ? provided.trim().toLowerCase() : provided;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
function readCookie(header, name) {
  if (!header) return void 0;
  for (const piece of header.split(";")) {
    const part = piece.trim();
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return void 0;
}
function createSessionAuth(o) {
  if (!COOKIE_NAME_RE.test(o.cookieName)) throw new Error(`invalid cookie name: ${o.cookieName}`);
  const days = o.days ?? SESSION_DAYS;
  const secret = () => typeof o.secret === "function" ? o.secret() : o.secret;
  const auth = {
    cookieName: o.cookieName,
    days,
    issue: (now) => createSessionToken(secret(), now, days),
    verify: (token, now) => verifySessionToken(secret(), token, { now, legacyHex: o.legacyHex }),
    isAuthed: (header, now) => auth.verify(readCookie(header, o.cookieName), now),
    setCookie: (secure, now) => `${o.cookieName}=${auth.issue(now)}; Max-Age=${Math.round(days * 86400)}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
    clearCookie: () => `${o.cookieName}=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
  };
  return auth;
}

// src/server/client-ip.ts
function isLoopback(address) {
  if (!address) return false;
  const a = address.trim().toLowerCase();
  return a === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a) || a.startsWith("::ffff:127.");
}
function clientIp(get, remoteAddress) {
  const cf = get("cf-connecting-ip")?.trim();
  if (cf && cf.length <= 64 && !cf.includes(",")) return cf;
  const xff = get("x-forwarded-for");
  if (xff) {
    const entries = xff.split(",").map((e) => e.trim());
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i] !== "" && !isLoopback(entries[i])) return entries[i];
    }
  }
  if (remoteAddress && !isLoopback(remoteAddress)) return remoteAddress;
  return "local";
}

// src/server/limiter.ts
function createLimiter(o = {}) {
  const max = o.max ?? 10;
  const windowMs = o.windowMs ?? 6e4;
  const cap = o.cap ?? 1e4;
  const entries = /* @__PURE__ */ new Map();
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
    }
  };
}

// src/server/env.ts
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { parseEnv } from "util";
function appRoot(importMetaUrl, up = 2) {
  let dir = dirname(fileURLToPath(importMetaUrl));
  for (let i = 0; i < up; i++) dir = dirname(dir);
  return dir;
}
function loadAppEnv(o) {
  const path = resolve(o.root, o.file ?? ".env");
  let read = null;
  if (existsSync(path)) {
    const parsed = parseEnv(readFileSync(path, "utf8"));
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === void 0) process.env[k] = v;
    }
    read = path;
  }
  const missing = (o.required ?? []).filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`${missing.join(" and ")} must be set - see .env.example`);
  return read;
}
function envNumber(value, fallback) {
  if (value === void 0 || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// src/server/process.ts
var installed = null;
function describe(err) {
  return err instanceof Error ? err.stack ?? err.message : String(err);
}
function installProcessHandlers(o) {
  if (installed) return installed;
  const log = o.log ?? ((line) => console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${o.name}: ${line}`));
  const exit = o.exit ?? ((code) => process.exit(code));
  const graceMs = o.graceMs ?? 5e3;
  let shuttingDown = null;
  const shutdown = (signal) => {
    if (shuttingDown) return shuttingDown;
    shuttingDown = (async () => {
      log(`got ${signal}, shutting down`);
      const timer = setTimeout(() => {
        log(`forced exit after ${graceMs} ms`);
        exit(0);
      }, graceMs);
      timer.unref();
      try {
        o.server?.close();
        o.server?.closeAllConnections?.();
      } catch (err) {
        log(`shutdown hook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      try {
        await o.onShutdown?.();
      } catch (err) {
        log(`shutdown hook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      clearTimeout(timer);
      exit(0);
    })();
    return shuttingDown;
  };
  process.on("unhandledRejection", (reason) => {
    log(`unhandled rejection: ${describe(reason)}`);
  });
  process.on("uncaughtException", (err) => {
    log(`uncaught exception: ${describe(err)}`);
    exit(1);
  });
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  installed = { shutdown };
  return installed;
}
function errorResponse(err, req, log = (line) => console.error(line)) {
  log(`${req.method} ${req.path} failed: ${describe(err)}`);
  return { status: 500, body: { error: "Something went wrong." } };
}

// src/server/spa.ts
import { readFile, stat } from "fs/promises";
import { resolve as resolve2, sep } from "path";
var TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  webmanifest: "application/manifest+json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
  woff2: "font/woff2",
  woff: "font/woff",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml"
};
function contentType(file) {
  const dot = file.lastIndexOf(".");
  const ext = dot < 0 ? "" : file.slice(dot + 1).toLowerCase();
  return TYPES[ext] ?? "application/octet-stream";
}
async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
var text = (body, status) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
function createSpaHandler(o) {
  const dir = resolve2(o.dir);
  const indexName = o.index ?? "index.html";
  const immutable = o.immutable ?? [];
  const maxAge = o.maxAge ?? 3600;
  const notBuilt = o.notBuilt ?? "UI not built: run npm run build";
  const indexPath = resolve2(dir, indexName);
  const send = async (file, cache, head) => {
    const body = head ? null : await readFile(file);
    return new Response(body, { status: 200, headers: { "Content-Type": contentType(file), "Cache-Control": cache } });
  };
  return async (req) => {
    const head = req.method === "HEAD";
    if (req.method !== "GET" && !head) return text("Not found.", 404);
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url).pathname);
    } catch {
      return text("Bad request.", 400);
    }
    if (pathname.includes("\0") || pathname.includes("\\")) return text("Not found.", 404);
    const segments = pathname.split("/");
    if (segments.some((s) => s.startsWith(".") && s !== ".well-known")) return text("Not found.", 404);
    if (segments.some((s) => /~[0-9]|:/.test(s))) return text("Not found.", 404);
    const target = resolve2(dir, "." + pathname);
    if (target !== dir && !target.startsWith(dir + sep)) return text("Not found.", 404);
    if (target !== dir && await isFile(target)) {
      let cache = `public, max-age=${maxAge}`;
      if (immutable.some((p) => pathname.startsWith(p))) cache = "public, max-age=31536000, immutable";
      else if (target === indexPath) cache = "no-cache";
      return send(target, cache, head);
    }
    if (/\.[A-Za-z0-9]{1,8}$/.test(segments[segments.length - 1] ?? "")) return text("Not found.", 404);
    if (!await isFile(indexPath)) return text(notBuilt, 503);
    return send(indexPath, "no-cache", head);
  };
}

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
function cut(text2, max) {
  const chars = [...text2];
  return chars.length > max ? chars.slice(0, max - 1).join("") + "\u2026" : text2;
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
  const resolve3 = input.resolve === true;
  if (resolve3 && dedupeKey === null) return fail("resolve needs a dedupeKey");
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
      resolve: resolve3,
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

// src/server/inbox/action.ts
import { createHash as createHash2, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "crypto";
var INBOX_ACTION_PATH = "/api/inbox/action";
var ACTION_TOKEN_FIELD = "actionToken";
var inboxActionTarget = (port, path) => `http://127.0.0.1:${port}${path ?? INBOX_ACTION_PATH}`;
var LOOPBACK_PEERS = /* @__PURE__ */ new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
var FORBIDDEN_HEADERS = ["forwarded", "via", "x-real-ip", "true-client-ip", "cdn-loop", "origin"];
var FORBIDDEN_PREFIXES = ["x-forwarded-", "cf-"];
var ACTION_ID_RE2 = /^[a-z0-9][a-z0-9-]{0,31}$/;
var HASH_RE = /^[0-9a-f]{64}$/;
function headerNames(headers) {
  if (typeof headers.forEach === "function" && typeof headers.get === "function") {
    const names = [];
    headers.forEach((_v, k) => names.push(k.toLowerCase()));
    return names;
  }
  return Object.entries(headers).filter(([, v]) => v !== void 0).map(([k]) => k.toLowerCase());
}
function headerValue(headers, name) {
  if (typeof headers.get === "function") return headers.get(name) ?? void 0;
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === name) return Array.isArray(v) ? v[0] : v;
  }
  return void 0;
}
function isInboxCall(req) {
  if (!req.remoteAddress || !LOOPBACK_PEERS.has(req.remoteAddress)) return false;
  if (headerValue(req.headers, "host") !== `127.0.0.1:${req.port}`) return false;
  for (const name of headerNames(req.headers)) {
    if (FORBIDDEN_HEADERS.includes(name)) return false;
    if (FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) return false;
    if (name.startsWith("sec-fetch-") && !(name === "sec-fetch-mode" && headerValue(req.headers, name) === "cors")) return false;
  }
  return headerValue(req.headers, "x-inbox-action") === "1";
}
function parseInboxActionCall(body, source) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body;
  if (typeof b.itemId !== "number" || !Number.isSafeInteger(b.itemId) || b.itemId <= 0) return null;
  if (typeof b.actionId !== "string" || !ACTION_ID_RE2.test(b.actionId)) return null;
  if (b.source !== source) return null;
  if (typeof b.kind !== "string") return null;
  if (b.dedupeKey !== null && typeof b.dedupeKey !== "string") return null;
  const data = b.data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  return {
    itemId: b.itemId,
    actionId: b.actionId,
    source,
    kind: b.kind,
    dedupeKey: b.dedupeKey,
    data
  };
}
function newActionToken() {
  return randomBytes2(32).toString("base64url");
}
function hashActionToken(token) {
  return createHash2("sha256").update(token, "utf8").digest("hex");
}
function actionTokenMatches(token, storedHash) {
  if (typeof token !== "string" || token.length < 1 || token.length > 128) return false;
  if (typeof storedHash !== "string" || !HASH_RE.test(storedHash)) return false;
  return timingSafeEqual2(Buffer.from(hashActionToken(token), "hex"), Buffer.from(storedHash, "hex"));
}
function inboxAction(id, label, target) {
  if (!isInboxActionTarget(target)) throw new Error(`not an inbox action target: ${target}`);
  return { id, label, method: "POST", target };
}

// src/server/service-tokens.ts
import { createHash as createHash3, randomBytes as randomBytes3, timingSafeEqual as timingSafeEqual3 } from "crypto";
import { readFileSync as readFileSync2 } from "fs";
var TOKEN_RE = /^nish_[a-z][a-z0-9-]*_[A-Za-z0-9_-]{43}$/;
var HEX_RE2 = /^[0-9a-f]{64}$/;
var hashServiceToken = (token) => createHash3("sha256").update(token, "utf8").digest("hex");
function mintServiceToken(app) {
  if (!/^[a-z][a-z0-9-]*$/.test(app)) throw new Error(`bad app name: ${app}`);
  const token = `nish_${app}_${randomBytes3(32).toString("base64url")}`;
  return { token, sha256: hashServiceToken(token) };
}
function parseEntries(raw, where) {
  if (!Array.isArray(raw)) {
    console.warn(`[service-tokens] ${where}: expected a JSON array, ignored`);
    return [];
  }
  const out = [];
  for (const e of raw) {
    const ok = e && typeof e === "object" && typeof e.id === "string" && e.id.length > 0 && typeof e.name === "string" && Array.isArray(e.scopes) && e.scopes.every((s) => typeof s === "string") && typeof e.sha256 === "string" && HEX_RE2.test(e.sha256) && typeof e.created === "string";
    if (!ok) {
      console.warn(`[service-tokens] ${where}: skipped an invalid entry${e && typeof e.id === "string" ? ` (${e.id})` : ""}`);
      continue;
    }
    out.push({ id: e.id, name: e.name, scopes: [...e.scopes], sha256: e.sha256, created: e.created });
  }
  return out;
}
function loadServiceTokens(o = {}) {
  const entries = [];
  if (o.file) {
    let text2 = null;
    try {
      text2 = readFileSync2(o.file, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") console.warn(`[service-tokens] ${o.file}: ${err.message}`);
    }
    if (text2 !== null) {
      try {
        entries.push(...parseEntries(JSON.parse(text2), o.file));
      } catch {
        console.warn(`[service-tokens] ${o.file}: not valid JSON, ignored`);
      }
    }
  }
  if (o.env && o.env.trim()) {
    try {
      entries.push(...parseEntries(JSON.parse(o.env), "SERVICE_TOKENS"));
    } catch {
      console.warn("[service-tokens] SERVICE_TOKENS: not valid JSON, ignored");
    }
  }
  return createServiceTokens(entries);
}
function createServiceTokens(entries) {
  const byHash = /* @__PURE__ */ new Map();
  for (const e of entries) byHash.set(e.sha256, e);
  return {
    verify(authorization, scope) {
      const m = /^Bearer ([^\s]+)$/.exec(authorization ?? "");
      if (!m || !TOKEN_RE.test(m[1])) return { ok: false, status: 401 };
      const hash = hashServiceToken(m[1]);
      const entry = byHash.get(hash);
      if (!entry || !timingSafeEqual3(Buffer.from(entry.sha256, "hex"), Buffer.from(hash, "hex"))) return { ok: false, status: 401 };
      if (!entry.scopes.includes(scope)) return { ok: false, status: 403 };
      return { ok: true, entry };
    },
    list: () => entries.map(({ sha256: _h, ...rest }) => rest)
  };
}
var PROXY_HEADERS = ["x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "forwarded", "cf-connecting-ip", "cf-ray", "x-real-ip"];
function isDirectLoopback(get, port) {
  const host = (get("host") ?? "").toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}` && host !== `[::1]:${port}`) return false;
  if (get("origin") !== void 0) return false;
  return PROXY_HEADERS.every((h) => get(h) === void 0);
}
function checkServiceRequest(get, o) {
  if (!isDirectLoopback(get, o.port)) return { status: 403, error: "Forbidden" };
  const r = o.tokens.verify(get("authorization"), o.scope);
  if (!r.ok) return { status: r.status, error: r.status === 401 ? "Unauthorized" : "Forbidden" };
  return null;
}
export {
  ACTION_TOKEN_FIELD,
  INBOX_ACTION_HEADER,
  INBOX_ACTION_PATH,
  INBOX_ACTION_TIMEOUT_MS,
  INBOX_DEFAULT_SETTINGS,
  INBOX_SOURCE_LABELS,
  SESSION_DAYS,
  actionTokenMatches,
  appRoot,
  checkServiceRequest,
  clientIp,
  createInboxClient,
  createLimiter,
  createServiceTokens,
  createSessionAuth,
  createSessionToken,
  createSpaHandler,
  envNumber,
  errorResponse,
  hashActionToken,
  hashServiceToken,
  inboxAction,
  inboxActionTarget,
  installProcessHandlers,
  isDirectLoopback,
  isInboxActionTarget,
  isInboxCall,
  isLoopback,
  loadAppEnv,
  loadServiceTokens,
  mintServiceToken,
  newActionToken,
  parseInboxActionCall,
  parseInboxEvent,
  passwordMatches,
  readCookie,
  verifySessionToken
};
//# sourceMappingURL=index.js.map