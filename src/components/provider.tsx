'use client';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_STRINGS, type NishStrings } from './strings';

export type { NishStrings } from './strings';

export interface NishConfig {
  strings: NishStrings;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  /** Where Portal renders. Default document.body. */
  portalContainer?: HTMLElement | null;
}

const DEFAULT_CONFIG: NishConfig = { strings: DEFAULT_STRINGS };

const NishContext = /* @__PURE__ */ createContext<NishConfig>(DEFAULT_CONFIG);

export interface NishProviderProps {
  strings?: Partial<NishStrings>;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  portalContainer?: HTMLElement | null;
  children: ReactNode;
}

/** Sets strings, locale, direction and the portal container once for everything below it.
 *  Nests: an inner provider overrides the outer one key by key. */
export function NishProvider({ strings, locale, dir, portalContainer, children }: NishProviderProps) {
  const outer = useContext(NishContext);
  const value = useMemo<NishConfig>(
    () => ({
      strings: strings ? { ...outer.strings, ...strings } : outer.strings,
      locale: locale ?? outer.locale,
      dir: dir ?? outer.dir,
      portalContainer: portalContainer !== undefined ? portalContainer : outer.portalContainer,
    }),
    [outer, strings, locale, dir, portalContainer],
  );
  return <NishContext.Provider value={value}>{children}</NishContext.Provider>;
}

/** The current config; English defaults without a provider. */
export function useNishConfig(): NishConfig {
  return useContext(NishContext);
}

/** The current strings; English defaults without a provider. */
export function useNishStrings(): NishStrings {
  return useContext(NishContext).strings;
}
