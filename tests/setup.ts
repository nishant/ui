// Shared vitest setup: unmount whatever a test rendered, reset timers and storage, so tests do
// not leak DOM, fake clocks or theme state into each other. Runs in the happy-dom project; in
// the node project (tests/ssr) there is no document and only the timer reset applies.
import { afterEach, vi } from 'vitest';

afterEach(async () => {
  vi.useRealTimers();
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* storage can be blocked */
  }
  document.body.innerHTML = '';
  const root = document.documentElement;
  // Everything applyTheme()/suspendTransitions() write on <html>; a stale data-theme-choice makes
  // initTheme skip applyTheme, so a later test would start with no theme painted.
  for (const a of ['data-theme', 'data-scheme', 'data-theme-choice', 'data-nish-theme-switching']) root.removeAttribute(a);
  root.classList.remove('dark');
  root.style.colorScheme = '';
  root.removeAttribute('style');
  try {
    localStorage.removeItem('nish-theme');
  } catch {
    /* storage can be blocked */
  }
  // theme.ts mirrors the choice into a `nish-theme` cookie (src/theme.ts storageKey()); expire it.
  try {
    document.cookie = 'nish-theme=; Max-Age=0; Path=/';
  } catch {
    /* cookies can be blocked */
  }
});
