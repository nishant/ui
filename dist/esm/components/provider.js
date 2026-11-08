"use client";

// src/components/provider.tsx
import { createContext, useContext, useMemo } from "react";
import { DEFAULT_STRINGS } from "./strings.js";
import { jsx } from "react/jsx-runtime";
var EMPTY = {};
var NishContext = /* @__PURE__ */ createContext({ strings: EMPTY });
function NishProvider({ strings, locale, dir, portalContainer, children }) {
  const outer = useContext(NishContext);
  const value = useMemo(
    () => ({
      strings: strings ? { ...outer.strings, ...strings } : outer.strings,
      locale: locale ?? outer.locale,
      dir: dir ?? outer.dir,
      portalContainer: portalContainer !== void 0 ? portalContainer : outer.portalContainer
    }),
    [outer, strings, locale, dir, portalContainer]
  );
  return /* @__PURE__ */ jsx(NishContext.Provider, { value, children });
}
function useNishContext() {
  return useContext(NishContext);
}
function pick(o, groups) {
  const out = {};
  for (const key of Object.keys(o)) {
    for (const g of groups) {
      if (g && Object.hasOwn(g, key)) {
        out[key] = o[key];
        break;
      }
    }
  }
  return out;
}
function useStrings(a, b, c, d) {
  const o = useContext(NishContext).strings;
  return useMemo(
    () => o === EMPTY && !b ? a : Object.assign({}, a, b, c, d, pick(o, [a, b, c, d])),
    [a, b, c, d, o]
  );
}
function useNishConfig() {
  const ctx = useContext(NishContext);
  return useMemo(
    () => ({ ...ctx, strings: ctx.strings === EMPTY ? DEFAULT_STRINGS : { ...DEFAULT_STRINGS, ...ctx.strings } }),
    [ctx]
  );
}
function useNishStrings() {
  const o = useContext(NishContext).strings;
  return useMemo(() => o === EMPTY ? DEFAULT_STRINGS : { ...DEFAULT_STRINGS, ...o }, [o]);
}
export {
  NishProvider,
  useNishConfig,
  useNishContext,
  useNishStrings,
  useStrings
};
