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

interface NishContextValue {
  /** Only what a NishProvider set; components merge it over their own defaults. */
  strings: Partial<NishStrings>;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  portalContainer?: HTMLElement | null;
}

const EMPTY: Partial<NishStrings> = {};

const NishContext = /* @__PURE__ */ createContext<NishContextValue>({ strings: EMPTY });

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
  const value = useMemo<NishContextValue>(
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

/** @internal The provider's raw context: strings holds only the overrides a NishProvider set (no defaults).
 *  Read locale, dir and portalContainer from it; read strings through `useStrings`. */
export function useNishContext(): NishContextValue {
  return useContext(NishContext);
}

/** The override values for the keys that appear in one of the groups. */
function pick(o: Partial<NishStrings>, groups: readonly (Partial<NishStrings> | undefined)[]): Partial<NishStrings> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(o)) {
    for (const g of groups) {
      if (g && key in g) {
        out[key] = (o as Record<string, unknown>)[key];
        break;
      }
    }
  }
  return out as Partial<NishStrings>;
}

/** @internal The strings of the groups a component reads, with provider overrides applied. Pass the
 *  module-level `*_STRINGS` constants from `./strings`, never an object built in a component: the result is
 *  memoized on the groups' identity, so a group created on every render makes a new result every render.
 *  Without a provider override and with one group it returns that group itself. The result has exactly the keys
 *  of the groups; an override for any other key is ignored (`useNishStrings` still sees it). */
export function useStrings<A extends Partial<NishStrings>>(a: A): A;
export function useStrings<A extends Partial<NishStrings>, B extends Partial<NishStrings>>(a: A, b: B): A & B;
export function useStrings<A extends Partial<NishStrings>, B extends Partial<NishStrings>, C extends Partial<NishStrings>>(
  a: A,
  b: B,
  c: C,
): A & B & C;
export function useStrings<
  A extends Partial<NishStrings>,
  B extends Partial<NishStrings>,
  C extends Partial<NishStrings>,
  D extends Partial<NishStrings>,
>(a: A, b: B, c: C, d: D): A & B & C & D;
export function useStrings(
  a: Partial<NishStrings>,
  b?: Partial<NishStrings>,
  c?: Partial<NishStrings>,
  d?: Partial<NishStrings>,
): Partial<NishStrings> {
  const o = useContext(NishContext).strings;
  return useMemo(
    () => (o === EMPTY && !b ? a : Object.assign({}, a, b, c, d, pick(o, [a, b, c, d]))),
    [a, b, c, d, o],
  );
}

/** The current config; English defaults without a provider. */
export function useNishConfig(): NishConfig {
  const ctx = useContext(NishContext);
  return useMemo<NishConfig>(
    () => ({ ...ctx, strings: ctx.strings === EMPTY ? DEFAULT_STRINGS : { ...DEFAULT_STRINGS, ...ctx.strings } }),
    [ctx],
  );
}

/** The current strings; English defaults without a provider. */
export function useNishStrings(): NishStrings {
  const o = useContext(NishContext).strings;
  return useMemo<NishStrings>(() => (o === EMPTY ? DEFAULT_STRINGS : { ...DEFAULT_STRINGS, ...o }), [o]);
}
