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
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('style');
});
