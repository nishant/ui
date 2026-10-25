import { useEffect } from 'react';
import { dismissToast, toast, type ToastTone } from '../../src';
import type { ComponentDoc } from './types';

// --- Toast (framed) -----------------------------------------------------------------

type StaticToast = { tone: ToastTone; title: string; body?: string; action?: string };

/** Pushes toasts that stay put (duration 'sticky'), for static previews. */
function StaticToasts({ items }: { items: StaticToast[] }) {
  const key = JSON.stringify(items);
  useEffect(() => {
    const ids = items.map((t) =>
      toast[t.tone](t.title, {
        body: t.body,
        duration: 'sticky',
        action: t.action ? { label: t.action, onClick: () => undefined } : undefined,
      }),
    );
    return () => ids.forEach(dismissToast);
  }, [key]);
  return null;
}

export const toastDoc: ComponentDoc = {
  id: 'toast',
  name: 'Toast',
  exports: ['Toaster'],
  summary:
    'Short notices about something that just happened. Mount <Toaster /> once; call toast() from anywhere, including outside React. Errors stay until dismissed.',
  importLine: "import { Toaster, toast } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['success', 'error', 'warn', 'info'] },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
    { key: 'action', label: 'Action', type: 'text' },
  ],
  initial: { tone: 'success', title: 'Saved', body: 'Watchlist updated with 3 symbols.', action: '' },
  render: (a) => (
    <StaticToasts
      items={[{ tone: a.tone as ToastTone, title: String(a.title), body: String(a.body) || undefined, action: String(a.action) || undefined }]}
    />
  ),
  code: (a) => {
    const q = (v: unknown) => JSON.stringify(String(v)).replace(/"/g, "'");
    if (!a.action) return `toast.${a.tone}(${q(a.title)}${a.body ? `, ${q(a.body)}` : ''});`;
    const body = a.body ? `body: ${q(a.body)}, ` : '';
    return `toast.${a.tone}(${q(a.title)}, { ${body}action: { label: ${q(a.action)}, onClick: undo }, id: 'undo' });`;
  },
  framed: { height: 220 },
  api: { functions: ['toast', 'dismissToast', 'useToast'], interfaces: ['ToastOptions', 'ToastItem'] },
  stories: [
    {
      id: 'action',
      name: 'With an action',
      note: 'Undo runs, then the toast dismisses. A newer toast with the same id replaces it.',
      render: () => (
        <StaticToasts items={[{ tone: 'success', title: 'Marked as applied', body: 'Senior Frontend Engineer, Acme', action: 'Undo' }]} />
      ),
    },
    { id: 'success', name: 'Success', render: () => <StaticToasts items={[{ tone: 'success', title: 'Saved', body: 'Changes are live.' }]} /> },
    {
      id: 'error',
      name: 'Error',
      note: 'Stays until dismissed.',
      render: () => <StaticToasts items={[{ tone: 'error', title: 'Sync failed', body: 'The store returned 503. It will retry in 5 minutes.' }]} />,
    },
    { id: 'warn', name: 'Warning', render: () => <StaticToasts items={[{ tone: 'warn', title: 'Running low', body: 'Under 20 API calls left today.' }]} /> },
    { id: 'info', name: 'Info, title only', render: () => <StaticToasts items={[{ tone: 'info', title: 'New version deployed' }]} /> },
    {
      id: 'stack',
      name: 'Stack',
      note: 'Newest at the bottom; at most four.',
      render: () => (
        <StaticToasts
          items={[
            { tone: 'info', title: 'Checking 8 sites' },
            { tone: 'success', title: '7 sites are up' },
            { tone: 'error', title: 'trackers.nish.software is down', body: 'No response after 10 seconds.' },
          ]}
        />
      ),
    },
    {
      id: 'long',
      name: 'Long body',
      render: () => (
        <StaticToasts
          items={[
            {
              tone: 'warn',
              title: 'Some listings were skipped',
              body: 'Zillow rate-limited the scraper after 120 requests, so 38 listings in 78704 were not refreshed. They will be retried on the next run at 3:00 pm.',
            },
          ]}
        />
      ),
    },
  ],
  usage: `// once, at the root
import { Toaster } from '@nish/ui';
<Toaster />

// anywhere: handlers, query callbacks, plain modules
import { toast } from '@nish/ui';
toast.success('Saved', 'Watchlist updated with 3 symbols.');
toast.error('Could not save', err.message); // stays until dismissed

// One Undo slot: a newer change replaces the old toast, so a stale Undo cannot revert it.
toast.success('Archived', { action: { label: 'Undo', onClick: () => restore(id) }, id: 'undo' });

// Lift the stack above a bottom tab bar on phones.
<Toaster offset="calc(4.5rem + env(safe-area-inset-bottom))" />`,
  guidelines: [
    'Toasts confirm what just happened. Anything people must act on belongs on the page or in a Modal.',
    'Errors stay until dismissed, because a failure you did not see is one you will assume succeeded.',
    'Keep the title to a few words; put detail in the body.',
    'At most one action, and only for something to undo or follow up right now (Undo, View).',
    'Timers pause while the toast is hovered or focused, so a reader can reach the action.',
  ],
};
