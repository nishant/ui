import { createRoot } from 'react-dom/client';
import './styles.css';
import { BottomNav, Button, ConfirmDialog, Modal, ThemeToggle, Toaster, toast } from '../../src';

// The React side of the parity test. ?c=<component>&... picks what to render, with the same
// names as elements.ts: toggle, sheet, dialog, toast&tone=ok|warn|loss|info|neutral, nav.
// The React twins: ThemeToggle variant="pill", Modal (a bottom sheet under 640px, a centered
// panel from 640px, like .nish-sheet), ConfirmDialog (like .nish-dialog), toast and BottomNav.
// The page sets <html data-ready> when the component is on screen and settled.

const q = new URLSearchParams(location.search);
const c = q.get('c') ?? 'toggle';
const noop = () => undefined;

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
    <path d={d} />
  </svg>
);
const HOME = svg('M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z');
const LIST = svg('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
const GEAR = svg('M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3');

// React tones -> the static tone names.
const TONES = { neutral: 'info', ok: 'success', warn: 'warn', loss: 'error', info: 'info' } as const;

function App() {
  switch (c) {
    case 'toggle':
      return (
        <div style={{ padding: 24 }}>
          <ThemeToggle variant="pill" />
        </div>
      );
    case 'sheet':
      return (
        <Modal
          title="Filters"
          onClose={noop}
          closeOnBack={false}
          footer={<Button variant="primary">Apply</Button>}
        >
          <p>Pick what to show in the list.</p>
        </Modal>
      );
    case 'dialog':
      return (
        <ConfirmDialog
          title="Discard changes?"
          body="Your edits are lost."
          confirmLabel="Discard"
          tone="primary"
          onConfirm={noop}
          onCancel={noop}
        />
      );
    case 'nav':
      return (
        <BottomNav
          items={[
            { key: 'home', label: 'Home', icon: HOME, href: '/home', active: true },
            { key: 'lists', label: 'Lists', icon: LIST, href: '/lists' },
            { key: 'settings', label: 'Settings', icon: GEAR, href: '/settings' },
          ]}
        />
      );
    default:
      return null;
  }
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <App />
    <Toaster />
  </>,
);

if (c === 'toast') {
  const tone = (q.get('tone') ?? 'neutral') as keyof typeof TONES;
  setTimeout(() => toast[TONES[tone]]('Saved to the list', { duration: 'sticky' }), 50);
}

void (async () => {
  await new Promise((r) => setTimeout(r, 300));
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
  document.documentElement.dataset.ready = '1';
})();
