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

// src/server/inbox/action.ts
import { createHash, randomBytes, timingSafeEqual } from "crypto";
var INBOX_ACTION_PATH = "/api/inbox/action";
var LOOPBACK_PEERS = /* @__PURE__ */ new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
var FORBIDDEN_HEADERS = ["forwarded", "via", "x-real-ip", "true-client-ip", "cdn-loop", "origin"];
var FORBIDDEN_PREFIXES = ["x-forwarded-", "sec-fetch-", "cf-"];
var ACTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
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
  }
  return headerValue(req.headers, "x-inbox-action") === "1";
}
function parseInboxActionCall(body, source) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body;
  if (typeof b.itemId !== "number" || !Number.isSafeInteger(b.itemId) || b.itemId <= 0) return null;
  if (typeof b.actionId !== "string" || !ACTION_ID_RE.test(b.actionId)) return null;
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

// src/server/process.ts
function describe(err) {
  return err instanceof Error ? err.stack ?? err.message : String(err);
}
function errorResponse(err, req, log = (line) => console.error(line)) {
  log(`${req.method} ${req.path} failed: ${describe(err)}`);
  return { status: 500, body: { error: "Something went wrong." } };
}

// src/server/session.ts
import { createHmac, createHash as createHash2, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "crypto";
function passwordMatches(expected, provided, opts = {}) {
  if (typeof expected !== "string" || typeof provided !== "string" || expected === "") return false;
  const fold = opts.caseInsensitive ?? true;
  const a = fold ? expected.trim().toLowerCase() : expected;
  const b = fold ? provided.trim().toLowerCase() : provided;
  const ha = createHash2("sha256").update(a).digest();
  const hb = createHash2("sha256").update(b).digest();
  return timingSafeEqual2(ha, hb);
}

// src/server/spa.ts
import { readFile, stat } from "fs/promises";
import { resolve, sep } from "path";
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
  const dir = resolve(o.dir);
  const indexName = o.index ?? "index.html";
  const immutable = o.immutable ?? [];
  const maxAge = o.maxAge ?? 3600;
  const notBuilt = o.notBuilt ?? "UI not built: run npm run build";
  const indexPath = resolve(dir, indexName);
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
    const target = resolve(dir, "." + pathname);
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

// src/server/hono.ts
function remoteAddressOf(c) {
  const env = c.env;
  const address = env?.incoming?.socket?.remoteAddress;
  return typeof address === "string" ? address : void 0;
}
function clientIpOf(c) {
  return clientIp((name) => c.req.header(name), remoteAddressOf(c));
}
function isAuthed(c, auth) {
  return auth.isAuthed(c.req.header("cookie"));
}
function startSession(c, auth, secure) {
  c.header("Set-Cookie", auth.setCookie(secure), { append: true });
}
function endSession(c, auth) {
  c.header("Set-Cookie", auth.clearCookie(), { append: true });
}
function requireSession(auth, opts) {
  const message = opts?.message ?? "Log in to see this.";
  return async (c, next) => {
    if (!isAuthed(c, auth)) return c.json({ error: message }, 401);
    await next();
  };
}
function loginHandler(o) {
  const tooMany = o.messages?.tooMany ?? "Too many tries. Wait a minute and try again.";
  const wrong = o.messages?.wrong ?? "That password is not right.";
  const errorBody = o.errorBody ?? ((_kind, message) => ({ error: message }));
  return async (c) => {
    const key = clientIpOf(c);
    if (!o.limiter.allowed(key)) return c.json(errorBody("tooMany", tooMany), 429);
    let body = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const provided = body && typeof body === "object" ? body.password : void 0;
    const expected = typeof o.password === "function" ? o.password() : o.password;
    const ok = typeof provided === "string" && provided.length <= 1024 && passwordMatches(expected, provided, { caseInsensitive: o.caseInsensitive ?? true });
    if (!ok) {
      o.limiter.fail(key);
      const delay = o.failDelayMs ?? 0;
      if (delay > 0) await new Promise((resolve2) => setTimeout(resolve2, delay));
      return c.json(errorBody("wrong", wrong), 401);
    }
    o.limiter.reset(key);
    startSession(c, o.auth, typeof o.secure === "function" ? o.secure(c) : o.secure);
    return o.onSuccess ? o.onSuccess(c) : c.json({ authed: true });
  };
}
function mountSessionRoutes(app, o) {
  const base = o.base ?? "/api";
  app.get(`${base}/me`, (c) => c.json({ authed: isAuthed(c, o.auth) }));
  app.post(`${base}/login`, loginHandler(o));
  app.post(`${base}/logout`, (c) => {
    endSession(c, o.auth);
    return c.json({ authed: false });
  });
}
function serveSpa(o) {
  const handle = createSpaHandler(o);
  return (c) => handle(c.req.raw);
}
function onErrorHandler(log) {
  return (err, c) => {
    const withResponse = err;
    if (typeof withResponse.getResponse === "function") return withResponse.getResponse.call(err);
    const out = errorResponse(err, { method: c.req.method, path: c.req.path }, log);
    return c.json(out.body, out.status);
  };
}
function mountInboxAction(app, o) {
  const refused = o.refused ?? { error: "Log in to see this." };
  app.post(o.path ?? INBOX_ACTION_PATH, async (c) => {
    if (!isInboxCall({ headers: c.req.raw.headers, remoteAddress: remoteAddressOf(c), port: o.port })) {
      return c.json(refused, 401);
    }
    let body = null;
    try {
      body = await c.req.json();
    } catch {
      body = null;
    }
    const call = parseInboxActionCall(body, o.source);
    if (!call) return c.json({ error: `Not an inbox action from ${o.source}.` }, 400);
    if (!await o.verify(call)) {
      o.log(`inbox action ${call.actionId} on ${call.dedupeKey}: refused (no current action token)`);
      return c.json(refused, 401);
    }
    const result = await o.run(call);
    o.log(`inbox action ${call.actionId} on ${call.dedupeKey}: ${result.status}`);
    return c.json(result.body, result.status);
  });
}
export {
  clientIpOf,
  endSession,
  isAuthed,
  loginHandler,
  mountInboxAction,
  mountSessionRoutes,
  onErrorHandler,
  remoteAddressOf,
  requireSession,
  serveSpa,
  startSession
};
//# sourceMappingURL=hono.js.map