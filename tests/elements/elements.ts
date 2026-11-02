import '../../dist/nish.css';
import '../../dist/nish-components.css';
import { toast } from '../../src/elements';

// The element side of the harness. ?c=<component>&... picks what to render:
//   toggle                      <nish-theme-toggle pill>
//   sheet                       an open <nish-sheet>
//   dialog                      an open <nish-dialog>
//   toast&tone=ok|warn|loss|info|neutral
//   nav                         <nish-bottom-nav> with Home active
//   behavior                    every element with triggers, for behavior.spec.ts
// The page sets <html data-ready> when the component is on screen and settled.

const q = new URLSearchParams(location.search);
const c = q.get('c') ?? 'behavior';
const root = document.getElementById('root') as HTMLElement;

declare global {
  interface Window {
    toast: typeof toast;
    loadBundle: () => Promise<unknown>;
    nishEvents: { type: string; detail?: unknown; target: string }[];
  }
}
window.toast = toast;
// A second copy of the bundle, to prove that defining the tags twice does not throw.
window.loadBundle = () => import('../../dist/elements.js');
window.nishEvents = [];

const HOME_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>';
const LIST_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
const GEAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';

const SHEET = `
  <nish-sheet id="filters" label="Filters" open>
    <header class="nish-sheet-header">
      <h2 class="nish-sheet-title">Filters</h2>
      <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">x</button>
    </header>
    <div class="nish-sheet-body"><p>Pick what to show in the list.</p></div>
    <footer class="nish-sheet-footer"><button type="button" class="nish-btn nish-btn--primary" data-sheet-close>Apply</button></footer>
  </nish-sheet>`;

const DIALOG = `
  <nish-dialog id="discard" open>
    <h2 class="nish-dialog-title">Discard changes?</h2>
    <div class="nish-dialog-body">Your edits are lost.</div>
    <div class="nish-dialog-actions">
      <button type="button" class="nish-btn" data-dialog-close value="cancel">Cancel</button>
      <button type="button" class="nish-btn nish-btn--primary" data-dialog-close value="discard">Discard</button>
    </div>
  </nish-dialog>`;

function nav(): string {
  return `
  <nish-bottom-nav label="Sections">
    <a href="/home">${HOME_ICON}<span>Home</span></a>
    <a href="/lists">${LIST_ICON}<span>Lists</span></a>
    <a href="/settings">${GEAR_ICON}<span>Settings</span></a>
  </nish-bottom-nav>`;
}

const BEHAVIOR = `
  <main style="padding:16px;display:flex;flex-direction:column;gap:12px;align-items:flex-start">
    <nish-theme-toggle id="tt"></nish-theme-toggle>
    <button type="button" class="nish-btn" id="open-sheet" data-sheet-open="s1">Open sheet</button>
    <button type="button" class="nish-btn" id="open-dialog" data-dialog-open="d1">Open dialog</button>
    <button type="button" class="nish-btn" id="toast-btn">Toast</button>
    <nish-sheet id="s1" label="Filters">
      <header class="nish-sheet-header">
        <h2 class="nish-sheet-title">Filters</h2>
        <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">x</button>
      </header>
      <div class="nish-sheet-body"><p>Pick what to show.</p></div>
      <footer class="nish-sheet-footer"><button type="button" class="nish-btn nish-btn--primary" id="sheet-apply" data-sheet-close>Apply</button></footer>
    </nish-sheet>
    <nish-dialog id="d1">
      <h2 class="nish-dialog-title">Discard changes?</h2>
      <div class="nish-dialog-body">Your edits are lost.</div>
      <div class="nish-dialog-actions">
        <button type="button" class="nish-btn" id="dlg-cancel" data-dialog-close value="cancel">Cancel</button>
        <button type="button" class="nish-btn nish-btn--primary" id="dlg-ok" data-dialog-close value="discard">Discard</button>
        <button type="button" class="nish-btn" id="dlg-plain" data-dialog-close>Plain</button>
      </div>
    </nish-dialog>
  </main>
  ${nav()}`;

function markup(): string {
  switch (c) {
    case 'toggle':
      return '<div style="padding:24px"><nish-theme-toggle pill></nish-theme-toggle></div>';
    case 'sheet':
      return SHEET;
    case 'dialog':
      return DIALOG;
    case 'nav':
      return nav();
    case 'behavior':
      return BEHAVIOR;
    default:
      return '';
  }
}

if (c === 'nav' || c === 'behavior') history.replaceState(null, '', `/home?${q}`);
root.innerHTML = markup();

for (const tag of ['nish-sheet', 'nish-dialog']) {
  document.addEventListener('nish-close', (e) => {
    const t = e.target as Element;
    if (t.localName === tag) window.nishEvents.push({ type: 'nish-close', detail: (e as CustomEvent).detail, target: t.id });
  });
}
document.getElementById('toast-btn')?.addEventListener('click', () => toast('Saved to the harness'));

if (c === 'toast') {
  const tone = q.get('tone') ?? 'neutral';
  toast('Saved to the list', { tone: tone as 'neutral', duration: 'sticky' });
}

// Settled: elements upgraded, fonts loaded, every animation finished.
void (async () => {
  await Promise.all(
    ['nish-theme-toggle', 'nish-sheet', 'nish-dialog', 'nish-bottom-nav'].map((t) => customElements.whenDefined(t)),
  );
  if (c === 'toast') await new Promise((r) => setTimeout(r, 150));
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
  document.documentElement.dataset.ready = '1';
})();
