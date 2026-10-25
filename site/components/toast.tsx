import { useEffect } from 'react';
import { dismissToast, toast, type ToastTone } from '../../src';
import type { ComponentDoc } from './types';

// --- Toast (framed) -----------------------------------------------------------------

/** Pushes toasts that stay put, for static previews. toast() schedules its own
 *  dismissal with setTimeout; inside a preview frame that timer is skipped. */
function StaticToasts({ items }: { items: { tone: ToastTone; title: string; body?: string }[] }) {
  const key = JSON.stringify(items);
  useEffect(() => {
    const realTimeout = window.setTimeout;
    window.setTimeout = ((() => 0) as unknown) as typeof window.setTimeout;
    const ids = items.map((t) => toast[t.tone](t.title, t.body));
    window.setTimeout = realTimeout;
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
  ],
  initial: { tone: 'success', title: 'Saved', body: 'Watchlist updated with 3 symbols.' },
  render: (a) => <StaticToasts items={[{ tone: a.tone as ToastTone, title: String(a.title), body: String(a.body) || undefined }]} />,
  code: (a) => `toast.${a.tone}(${JSON.stringify(String(a.title)).replace(/"/g, "'")}${a.body ? `, ${JSON.stringify(String(a.body)).replace(/"/g, "'")}` : ''});`,
  framed: { height: 220 },
  api: { functions: ['toast', 'dismissToast', 'useToast'], interfaces: ['ToastItem'] },
  stories: [
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
toast.error('Could not save', err.message); // stays until dismissed`,
  guidelines: [
    'Toasts confirm what just happened. Anything people must act on belongs on the page or in a Modal.',
    'Errors stay until dismissed, because a failure you did not see is one you will assume succeeded.',
    'Keep the title to a few words; put detail in the body.',
  ],
};
