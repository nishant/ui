"use client";

// src/components/error-boundary.tsx
import { Component } from "react";
import { Button, Card } from "./primitives.js";
import { useStrings } from "./provider.js";
import { ERROR_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var CHUNK_MESSAGE = /Failed to fetch dynamically imported module|Importing a module script failed/;
function isChunkError(e) {
  return e.name === "ChunkLoadError" || CHUNK_MESSAGE.test(e.message);
}
function changed(a = [], b = []) {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}
function isDevelopment() {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
var useErrorStrings = () => useStrings(ERROR_STRINGS);
var Boundary = class extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
  componentDidCatch(error, info) {
    this.props.onError?.(error instanceof Error ? error : new Error(String(error)), { componentStack: info.componentStack });
  }
  componentDidUpdate(prev) {
    if (this.state.error && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }
  reset = () => {
    this.setState({ error: null });
  };
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });
    const s = this.props.strings;
    const details = this.props.showDetails ?? isDevelopment();
    const stale = isChunkError(error);
    const message = error.message.length > 300 ? `${error.message.slice(0, 300)}\u2026` : error.message;
    return /* @__PURE__ */ jsxs(Card, { role: "alert", className: "mx-auto my-16 max-w-md", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-th-hi", children: stale ? s.errorStaleTitle : s.errorTitle }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 break-words text-sm text-th-hi2", children: stale ? s.errorStaleBody : details ? message || s.errorBody : s.errorBody }),
      details && error.stack ? /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsx("summary", { className: "inline-flex min-h-11 cursor-pointer items-center text-sm text-th-hi3", children: s.errorDetails }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-48 overflow-auto rounded-lg bg-th-elevated p-2 font-mono text-xs text-th-hi2", children: error.stack })
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
        stale ? null : /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: this.reset, children: s.errorTryAgain }),
        /* @__PURE__ */ jsx(Button, { variant: stale ? "primary" : "secondary", onClick: () => location.reload(), children: s.errorReload })
      ] })
    ] });
  }
};
function AppErrorBoundary(props) {
  const strings = useErrorStrings();
  return /* @__PURE__ */ jsx(Boundary, { ...props, strings });
}
export {
  AppErrorBoundary
};
