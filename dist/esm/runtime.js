// src/runtime.ts
var version = true ? "2.0.0" : "dev";
var VERSION = version;
var KEY = /* @__PURE__ */ Symbol.for("nish-ui.runtime.v1");
function runtime() {
  const g = globalThis;
  return g[KEY] ??= { versions: /* @__PURE__ */ new Set(), slots: {} };
}
function register(rt) {
  rt.versions.add(version);
  if (rt.versions.size > 1 && !rt.warned && globalThis.process?.env?.NODE_ENV !== "production") {
    rt.warned = true;
    console.warn(
      `nish-ui: two versions are loaded on this page (${[...rt.versions].join(", ")}). Overlays, toasts and theme state are shared, but mixing versions is unsupported.`
    );
  }
}
var registered = false;
function shared(key, init) {
  const rt = runtime();
  if (!registered) {
    registered = true;
    register(rt);
  }
  if (!(key in rt.slots)) rt.slots[key] = init();
  return rt.slots[key];
}
function __setVersionForTest(next) {
  version = next;
  registered = true;
  register(runtime());
}
export {
  VERSION,
  __setVersionForTest,
  shared
};
