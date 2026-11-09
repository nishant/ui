/* Shared runtime state. No React, no directive: every entry and every copy of the package that
 * runs on one page reads and writes the same record, so theme state, the overlay stack and the
 * toast store exist once per page. */

declare const __NISH_UI_VERSION__: string | undefined;

let version = typeof __NISH_UI_VERSION__ === 'string' ? __NISH_UI_VERSION__ : 'dev';

/** The version of this copy: injected by the build, `dev` in source. */
export const VERSION: string = version;

interface Runtime {
  versions: Set<string>;
  slots: Record<string, unknown>;
  warned?: boolean;
}

const KEY = Symbol.for('nish-ui.runtime.v1');

function runtime(): Runtime {
  const g = globalThis as unknown as Record<symbol, Runtime | undefined>;
  return (g[KEY] ??= { versions: new Set<string>(), slots: {} });
}

/** True outside production. Bundlers replace `process.env.NODE_ENV`; where nothing does,
 *  the ReferenceError is caught and the page counts as production. */
function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

function register(rt: Runtime): void {
  rt.versions.add(version);
  if (rt.versions.size > 1 && !rt.warned && isDevelopment()) {
    rt.warned = true;
    console.warn(
      `nish-ui: two versions are loaded on this page (${[...rt.versions].join(', ')}). Overlays, toasts and theme state are shared, but mixing versions is unsupported.`,
    );
  }
}

let registered = false;

/** One record per page, shared by every entry and every copy of the package. `init` runs once per
 *  key per page; later callers (any entry, any copy) get the same object. */
export function shared<T>(key: string, init: () => T): T {
  const rt = runtime();
  if (!registered) {
    registered = true;
    register(rt);
  }
  if (!(key in rt.slots)) rt.slots[key] = init();
  return rt.slots[key] as T;
}

/** Test only: changes the version this copy reports and registers it again. Not exported from index. */
export function __setVersionForTest(next: string): void {
  version = next;
  registered = true;
  register(runtime());
}
