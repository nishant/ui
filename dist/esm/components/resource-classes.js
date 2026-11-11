// src/components/resource-classes.ts
import { shared } from "../runtime.js";
var ApiError = class extends Error {
  /** HTTP status; 0 = network failure or abort-by-timeout. */
  status;
  /** Parsed JSON body when the response had one, else the text, else null. */
  body;
  url;
  constructor(message, o) {
    super(message);
    this.name = "ApiError";
    this.status = o.status;
    this.body = o.body ?? null;
    this.url = o.url;
  }
  /** True for 0 (network) and 5xx: worth retrying. */
  get retryable() {
    return this.status === 0 || this.status >= 500;
  }
};
var store = shared("api", () => ({ config: {} }));
function configureApi(c) {
  store.config = { ...store.config, ...c };
}
function isRawBody(b) {
  return typeof b === "string" || typeof FormData !== "undefined" && b instanceof FormData || typeof Blob !== "undefined" && b instanceof Blob || typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams || typeof ReadableStream !== "undefined" && b instanceof ReadableStream || b instanceof ArrayBuffer || ArrayBuffer.isView(b);
}
var ERROR_CODE = /^[a-z0-9_]+$/;
function errorMessage(body, status) {
  let raw = "";
  if (body && typeof body === "object") {
    const o = body;
    if (typeof o.error === "string" && o.error) raw = o.error;
    else if (typeof o.message === "string" && o.message) raw = o.message;
  }
  if (raw && !ERROR_CODE.test(raw)) return raw;
  if (status === 401) return "Log in to continue.";
  if (raw && status === 404) return "That was not found.";
  if (raw) return "The server had a problem. Try again.";
  return `The server answered ${status}.`;
}
function excerpt(text, max = 120) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}\u2026` : flat;
}
var SCHEME = /^[a-z][a-z0-9+.-]*:/i;
function isTrustedOrigin(url) {
  const bases = [];
  if (typeof document !== "undefined" && document.baseURI) bases.push(document.baseURI);
  if (typeof location !== "undefined" && location.href) bases.push(location.href);
  for (const here of bases) {
    try {
      const target = new URL(url, here);
      if (target.origin !== "null" && target.origin === new URL(here).origin) return true;
      if (store.config.baseUrl && SCHEME.test(store.config.baseUrl) && target.origin === new URL(store.config.baseUrl).origin) return true;
      return false;
    } catch {
    }
  }
  return isRelativePath(url);
}
function isRelativePath(url) {
  let i = 0;
  while (i < url.length && (url[i] === " " || url[i] === "	")) i++;
  const rest = url.slice(i);
  if (SCHEME.test(rest)) return false;
  const a = rest[0];
  const b = rest[1];
  const isSlash = (c) => c === "/" || c === "\\";
  if (a === "\\") return false;
  if (a === "/" && isSlash(b)) return false;
  const squeezed = rest.replace(/[\t\n\r]/g, "");
  if (isSlash(squeezed[0]) && isSlash(squeezed[1])) return false;
  if (SCHEME.test(squeezed)) return false;
  return true;
}
async function apiFetch(path, o = {}) {
  const { body, timeoutMs = 15e3, nullOn404, signal: callerSignal, headers: extraHeaders, ...init } = o;
  const url = path.startsWith("/") && store.config.baseUrl ? store.config.baseUrl + path : path;
  const headers = new Headers({ accept: "application/json" });
  if (store.config.headers && (isTrustedOrigin(url) || store.config.headersFor?.(url) === true)) {
    for (const [k, v] of Object.entries(store.config.headers())) headers.set(k, v);
  }
  if (extraHeaders) new Headers(extraHeaders).forEach((v, k) => headers.set(k, v));
  let payload;
  if (body !== void 0) {
    if (isRawBody(body)) {
      payload = body;
      if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream && !("duplex" in init)) {
        init.duplex = "half";
      }
    } else {
      payload = JSON.stringify(body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, timeoutMs);
  const onCallerAbort = () => ctl.abort();
  if (callerSignal) {
    if (callerSignal.aborted) ctl.abort();
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }
  try {
    let res;
    let text;
    try {
      res = await fetch(url, { credentials: "same-origin", ...init, headers, body: payload, signal: ctl.signal });
      text = await res.text();
    } catch (e) {
      if (timedOut) throw new ApiError("The server took too long to answer.", { status: 0, url });
      if (e instanceof Error && e.name === "AbortError") throw e;
      throw new ApiError("Could not reach the server.", { status: 0, url });
    }
    const type = res.headers.get("content-type") ?? "";
    let parsed = text === "" ? null : text;
    let badJson = false;
    if (text !== "" && /json/i.test(type)) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
        badJson = true;
      }
    }
    if (!res.ok) {
      if (res.status === 404 && nullOn404) return null;
      const err = new ApiError(errorMessage(parsed, res.status), { status: res.status, body: parsed, url });
      if (res.status === 401) store.config.onUnauthorized?.(err);
      throw err;
    }
    if (res.status === 204 || text === "") return void 0;
    if (badJson) {
      const sample = excerpt(text);
      throw new ApiError(`The server answered ${res.status} with a body that is not valid JSON: ${sample}`, {
        status: res.status,
        body: sample,
        url
      });
    }
    return parsed;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}
export {
  ApiError,
  apiFetch,
  configureApi
};
