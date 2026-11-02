import '../../dist/nish.css';
import '../../dist/nish-components.css';
import '../../src/elements/forms';
import '../../src/elements/data';
import '../../src/elements/charts';

// The wave 3 element harness (data.html). The markup is static, so the elements upgrade the way
// they do on a plain page. Every event the elements fire is recorded in window.nishEvents, and
// <html data-ready> is set once the tags are defined and the page has settled.

declare global {
  interface Window {
    loadBundle: () => Promise<unknown>;
    loadCharts: () => Promise<unknown>;
    nishEvents: { type: string; detail?: unknown; target: string; t: number }[];
  }
}

// Second copies of the built files, to prove that defining the tags twice does not throw.
window.loadBundle = () => import('../../dist/elements-data.js');
window.loadCharts = () => import('../../dist/elements-charts.js');
window.nishEvents = [];

const HOSTS = 'nish-table-sort,nish-filter-bar,nish-split,nish-section-nav,nish-command-palette,nish-search,nish-chip-group';
for (const type of ['nish-sort', 'nish-clear', 'nish-resize', 'nish-select', 'nish-query', 'nish-close', 'nish-change']) {
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
      'nish-table-sort',
      'nish-filter-bar',
      'nish-split',
      'nish-nav-rail',
      'nish-scroll-row',
      'nish-section-nav',
      'nish-command-palette',
      'nish-line-chart',
      'nish-bar-chart',
      'nish-search',
      'nish-chip-group',
    ].map((t) => customElements.whenDefined(t)),
  );
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  document.documentElement.dataset.ready = '1';
})();
