// Browser entry for hydration.spec.ts: hydrates the scenario named in the URL hash and records
// every recoverable error and every console.error (React reports mismatches through both).
import { hydrateRoot } from 'react-dom/client';
import { scenarios } from './hydration-app';

declare global {
  interface Window {
    __done?: boolean;
    __errors?: string[];
  }
}

const errors: string[] = [];
window.__errors = errors;
const original = console.error;
console.error = (...args: unknown[]) => {
  errors.push('console.error: ' + args.map(String).join(' ').slice(0, 500));
  original(...args);
};

const name = location.hash.slice(1);
const scenario = scenarios[name];
if (!scenario) {
  errors.push(`unknown scenario ${name}`);
  window.__done = true;
} else {
  const root = hydrateRoot(document.getElementById('root')!, scenario.render(), {
    onRecoverableError: (e) => errors.push('recoverable: ' + (e instanceof Error ? e.message : String(e)).slice(0, 500)),
  });
  // Two frames: hydration, then the effects and the post-hydration re-render.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      scenario.after?.();
      window.__done = true;
    }),
  );
  (window as unknown as { __root: typeof root }).__root = root;
}
