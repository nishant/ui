"use client";

// src/components/provider.tsx
import { createContext, useContext, useMemo } from "react";
import { DEFAULT_STRINGS } from "./strings.js";
import { jsx } from "react/jsx-runtime";
var DEFAULT_CONFIG = { strings: DEFAULT_STRINGS };
var NishContext = /* @__PURE__ */ createContext(DEFAULT_CONFIG);
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
function useNishConfig() {
  return useContext(NishContext);
}
function useNishStrings() {
  return useContext(NishContext).strings;
}
export {
  NishProvider,
  useNishConfig,
  useNishStrings
};
