// src/server/client-ip.ts
function clientIp(get, remoteAddress, opts = {}) {
  const trust = opts.trust ?? "none";
  if (trust === "cloudflare") {
    const cf = get("cf-connecting-ip")?.trim();
    if (cf && cf.length <= 64 && !cf.includes(",")) return cf;
  }
  if (trust === "cloudflare" || trust === "proxy") {
    const xff = get("x-forwarded-for");
    if (xff) {
      const hop = xff.split(",").pop()?.trim();
      if (hop) return hop;
    }
  }
  return remoteAddress ? remoteAddress : null;
}

// src/server/cross-site.ts
var SAFE_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
function originOf(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}
function isCrossSiteWrite(method, header, opts = {}) {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  const site = header("sec-fetch-site")?.toLowerCase() || void 0;
  if (site === "same-origin" || site === "none") return false;
  const rawOrigin = header("origin") || void 0;
  if (rawOrigin === void 0) return site !== void 0;
  const origin = originOf(rawOrigin);
  if (origin === null) return true;
  for (const allowed of opts.allowedOrigins ?? []) {
    if (originOf(allowed) === origin) return false;
  }
  if (site !== void 0) return true;
  const host = header("host")?.toLowerCase();
  return host === void 0 || new URL(origin).host !== host;
}

// src/server/inbox/action.ts
import { createHash, randomBytes, timingSafeEqual } from "crypto";

// src/server/direct-call.ts
var LOOPBACK_PEERS = /* @__PURE__ */ new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
var FORBIDDEN_HEADERS = ["forwarded", "via", "x-real-ip", "true-client-ip", "cdn-loop", "origin"];
var FORBIDDEN_PREFIXES = ["x-forwarded-", "cf-"];
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
function isDirectCall(req) {
  if (!req.remoteAddress || !LOOPBACK_PEERS.has(req.remoteAddress)) return false;
  if (headerValue(req.headers, "host") !== `127.0.0.1:${req.port}`) return false;
  for (const name of headerNames(req.headers)) {
    if (FORBIDDEN_HEADERS.includes(name)) return false;
    if (FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) return false;
    if (name.startsWith("sec-fetch-") && !(name === "sec-fetch-mode" && headerValue(req.headers, name) === "cors")) return false;
  }
  return true;
}

// src/server/inbox/action.ts
var INBOX_ACTION_PATH = "/api/inbox/action";
var ACTION_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
function inboxHeader(headers) {
  if (typeof headers.get === "function") return headers.get("x-inbox-action") ?? void 0;
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "x-inbox-action") return Array.isArray(v) ? v[0] : v;
  }
  return void 0;
}
function isInboxCall(req) {
  return isDirectCall(req) && inboxHeader(req.headers) === "1";
}
function validDedupeKey(k) {
  if (typeof k !== "string" || k.length < 1 || k.length > 200) return false;
  for (let i = 0; i < k.length; i++) {
    const c = k.charCodeAt(i);
    if (c < 32 || c === 127) return false;
  }
  return true;
}
function parseInboxActionCall(body, source) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body;
  if (typeof b.itemId !== "number" || !Number.isSafeInteger(b.itemId) || b.itemId <= 0) return null;
  if (typeof b.actionId !== "string" || !ACTION_ID_RE.test(b.actionId)) return null;
  if (b.source !== source) return null;
  if (typeof b.kind !== "string") return null;
  if (b.dedupeKey !== null && !validDedupeKey(b.dedupeKey)) return null;
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
  const fold = opts.caseInsensitive ?? false;
  const a = fold ? expected.trim().toLowerCase() : expected;
  const b = fold ? provided.trim().toLowerCase() : provided;
  const ha = createHash2("sha256").update(a).digest();
  const hb = createHash2("sha256").update(b).digest();
  return timingSafeEqual2(ha, hb);
}

// src/server/spa.ts
import { createHash as createHash3 } from "crypto";
import { readFile, stat } from "fs/promises";
import { resolve, sep } from "path";
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
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
function checkSources(list) {
  const out = list ?? [];
  for (const v of out) {
    if (/[;,\r\n]/.test(v)) throw new Error(`@nish/ui/server: bad csp source: ${v}`);
  }
  return out;
}
function inlineScriptHashes(html) {
  const lower = html.toLowerCase();
  const hashes = /* @__PURE__ */ new Set();
  let i = lower.indexOf("<script");
  while (i >= 0) {
    const tagEnd = lower.indexOf(">", i);
    if (tagEnd < 0) break;
    const next = lower.charAt(i + 7);
    const isTag = next === ">" || next === "/" || /\s/.test(next);
    const close = lower.indexOf("</script", tagEnd + 1);
    if (isTag) {
      const attrs = lower.slice(i + 7, tagEnd);
      if (!/(?:^|[\s"'/])src\s*=/.test(attrs) && close >= 0) {
        const content = html.slice(tagEnd + 1, close);
        if (content.length > 0) hashes.add(`'sha256-${createHash3("sha256").update(content, "utf8").digest("base64")}'`);
      }
    }
    if (close < 0) break;
    i = lower.indexOf("<script", close);
  }
  return [...hashes];
}
function createSpaHandler(o) {
  const dir = resolve(o.dir);
  const indexName = o.index ?? "index.html";
  const immutable = o.immutable ?? [];
  const maxAge = o.maxAge ?? 3600;
  const notBuilt = o.notBuilt ?? "UI not built: run npm run build";
  const indexPath = resolve(dir, indexName);
  const safety = { ...SECURITY_HEADERS };
  if (o.frameOptions !== false) safety["X-Frame-Options"] = "SAMEORIGIN";
  const cspOpt = o.csp === "strict" ? {} : o.csp;
  const cspConnect = checkSources(cspOpt?.connect);
  const cspImg = checkSources(cspOpt?.img);
  const cspScript = checkSources(cspOpt?.script);
  const cspFrame = checkSources(cspOpt?.frameAncestors);
  const cspHeader = cspOpt?.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  const policies = /* @__PURE__ */ new Map();
  const buildPolicy = (html) => [
    "default-src 'self'",
    ["script-src", "'self'", ...inlineScriptHashes(html), ...cspScript].join(" "),
    "style-src 'self' 'unsafe-inline'",
    ["img-src", "'self'", "data:", ...cspImg].join(" "),
    ["connect-src", "'self'", ...cspConnect].join(" "),
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    ["frame-ancestors", ...cspFrame.length ? cspFrame : ["'self'"]].join(" ")
  ].join("; ");
  const text = (body, status) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", ...safety } });
  const send = async (file, cache, head) => {
    const type = contentType(file);
    const headers = { "Content-Type": type, "Cache-Control": cache, ...safety };
    if (cspOpt && type.startsWith("text/html")) {
      const mtimeMs = (await stat(file)).mtimeMs;
      const html = await readFile(file);
      let hit = policies.get(file);
      if (!hit || hit.mtimeMs !== mtimeMs) {
        hit = { mtimeMs, policy: buildPolicy(html.toString("utf8")) };
        policies.set(file, hit);
      }
      headers[cspHeader] = hit.policy;
      return new Response(head ? null : html, { status: 200, headers });
    }
    const body = head ? null : await readFile(file);
    return new Response(body, { status: 200, headers });
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
function clientIpOf(c, trust = "none") {
  return clientIp((name) => c.req.header(name), remoteAddressOf(c), { trust });
}
function limiterBucket(address) {
  let a = address.trim().toLowerCase();
  const zone = a.indexOf("%");
  if (zone >= 0) a = a.slice(0, zone);
  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(a);
  if (mapped) return mapped[1];
  if (!a.includes(":") || !/^[0-9a-f:.]+$/.test(a) || a.includes(":::")) return address;
  const halves = a.split("::");
  if (halves.length > 2) return address;
  const head = halves[0] === "" ? [] : halves[0].split(":");
  const tail = halves.length === 2 && halves[1] !== "" ? halves[1].split(":") : [];
  const groups = (list) => list.reduce((n, g) => n + (g.includes(".") ? 2 : 1), 0);
  const missing = 8 - groups(head) - groups(tail);
  if (halves.length === 2 ? missing < 1 : missing !== 0) return address;
  const full = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (full.slice(0, 4).some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return address;
  return full.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}
var NO_ADDRESS_KEY = "no-address";
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
    const ip = clientIpOf(c, o.trustProxy);
    const key = ip === null ? NO_ADDRESS_KEY : limiterBucket(ip);
    if (!o.limiter.hit(key)) return c.json(errorBody("tooMany", tooMany), 429);
    let body = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const provided = body && typeof body === "object" ? body.password : void 0;
    const expected = typeof o.password === "function" ? o.password() : o.password;
    const ok = typeof provided === "string" && provided.length <= 1024 && passwordMatches(expected, provided, { caseInsensitive: o.caseInsensitive ?? false });
    if (!ok) {
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
function crossSiteGuard(opts) {
  const message = opts?.message ?? "Cross-site request refused.";
  return async (c, next) => {
    if (isCrossSiteWrite(c.req.method, (name) => c.req.header(name), opts)) return c.json({ error: message }, 403);
    await next();
  };
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
      o.log(`inbox action ${call.actionId}: refused (no current action token)`);
      return c.json(refused, 401);
    }
    const result = await o.run(call);
    o.log(`inbox action ${call.actionId} on ${call.dedupeKey}: ${result.status}`);
    return c.json(result.body, result.status);
  });
}
function mountServiceTokenRoutes(app, o) {
  let base = o.base ?? "/api/service-tokens";
  while (base.endsWith("/")) base = base.slice(0, -1);
  const log = o.log ?? ((line) => console.log(line));
  app.get(base, (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ tokens: o.tokens.views() });
  });
  app.post(`${base}/:id/revoke`, (c) => {
    const id = c.req.param("id");
    c.header("Cache-Control", "no-store");
    if (!o.tokens.revoke(id)) return c.json({ error: "No service token with that id." }, 404);
    log(`service token ${id} revoked`);
    return c.json({ tokens: o.tokens.views() });
  });
}
export {
  NO_ADDRESS_KEY,
  clientIpOf,
  crossSiteGuard,
  endSession,
  isAuthed,
  loginHandler,
  mountInboxAction,
  mountServiceTokenRoutes,
  mountSessionRoutes,
  onErrorHandler,
  remoteAddressOf,
  requireSession,
  serveSpa,
  startSession
};
//# sourceMappingURL=hono.js.map