import '../../dist/nish.css';
import '../../dist/nish-components.css';
import '../../src/elements/forms';

// The wave 2 element harness (forms.html). The markup is static, so the elements upgrade the way
// they do on a plain page. Every event the elements fire is recorded in window.nishEvents, and
// <html data-ready> is set once the tags are defined and the page has settled.

declare global {
  interface Window {
    loadBundle: () => Promise<unknown>;
    nishEvents: { type: string; detail?: unknown; target: string; t: number }[];
  }
}

// A second copy of the built file, to prove that defining the tags twice does not throw.
window.loadBundle = () => import('../../dist/elements-forms.js');
window.nishEvents = [];

const HOSTS = 'nish-search,nish-switch,nish-chip-group,nish-combobox,nish-tabs,nish-segmented,nish-copy-button';
for (const type of ['input', 'change', 'nish-input', 'nish-clear', 'nish-change', 'nish-remove', 'nish-query', 'nish-copy']) {
  document.addEventListener(type, (e) => {
    const host = (e.target as Element).closest(HOSTS);
    window.nishEvents.push({
      type,
      detail: (e as CustomEvent).detail,
      target: host?.id ?? (e.target as Element).id ?? '',
      t: performance.now(),
    });
  });
}

void (async () => {
  await Promise.all(
    [
      'nish-field',
      'nish-search',
      'nish-switch',
      'nish-chip-group',
      'nish-combobox',
      'nish-tabs',
      'nish-segmented',
      'nish-copy-button',
      'nish-sparkline',
    ].map((t) => customElements.whenDefined(t)),
  );
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  document.documentElement.dataset.ready = '1';
})();
