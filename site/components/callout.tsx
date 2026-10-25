import { useState } from 'react';
import { Button, Card } from '../../src';
import { Callout, type CalloutTone } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Callout ------------------------------------------------------------------------

const TONES: CalloutTone[] = ['neutral', 'accent', 'info', 'ok', 'warn', 'loss'];

const COPY: Record<CalloutTone, { title: string; body: string }> = {
  neutral: { title: 'Read-only', body: 'This board is shared with you. Ask the owner to edit it.' },
  accent: { title: 'New: price alerts', body: 'Get a notification when a tracked item drops below your target.' },
  info: { title: 'Market closed', body: 'Quotes are from the 4:00 pm close and refresh at 9:30 am.' },
  ok: { title: 'All sites are up', body: 'Last checked 2 minutes ago.' },
  warn: { title: 'Token expires soon', body: 'The Schwab token expires in 2 days. Reconnect to keep syncing.' },
  loss: { title: 'Sync failed', body: 'The store returned 503. It will retry in 5 minutes.' },
};

function Dismissable() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Callout tone="accent" title="Tip" onDismiss={() => setOpen(false)} className="w-full">
      Press / to search from anywhere.
    </Callout>
  ) : (
    <Button size="sm" onClick={() => setOpen(true)}>
      Show the tip again
    </Button>
  );
}

export const callout: ComponentDoc = {
  id: 'callout',
  name: 'Callout',
  exports: ['Callout'],
  summary:
    'An inline notice: a tinted box with an icon, an optional title, text and an action. For things on the page; toasts are for things that just happened.',
  importLine: "import { Callout } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: TONES },
    { key: 'variant', label: 'Variant', type: 'select', options: ['box', 'bar'] },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
    { key: 'compact', label: 'Compact', type: 'boolean' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'action', label: 'Action', type: 'boolean' },
  ],
  initial: { tone: 'warn', variant: 'box', title: COPY.warn.title, body: COPY.warn.body, compact: false, icon: true, action: true },
  render: (a) => (
    <Callout
      tone={a.tone as CalloutTone}
      variant={a.variant as 'box'}
      title={String(a.title) || undefined}
      compact={!!a.compact}
      icon={a.icon ? undefined : false}
      action={a.action ? <Button size="sm">Reconnect</Button> : undefined}
      className="w-full max-w-xl"
    >
      {String(a.body)}
    </Callout>
  ),
  code: (a) =>
    jsx(
      'Callout',
      {
        tone: a.tone === 'info' ? undefined : a.tone,
        variant: a.variant === 'box' ? undefined : a.variant,
        title: a.title || undefined,
        compact: a.compact || undefined,
        icon: a.icon ? undefined : '{false}',
        action: a.action ? '{<Button size="sm">Reconnect</Button>}' : undefined,
      },
      String(a.body),
    ),
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      wide: true,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-2">
          {TONES.map((t) => (
            <Callout key={t} tone={t} title={COPY[t].title}>
              {COPY[t].body}
            </Callout>
          ))}
        </div>
      ),
    },
    {
      id: 'body-only',
      name: 'Body only, no icon',
      render: () => (
        <div className="grid w-full gap-3">
          <Callout tone="info">Prices include tax but not shipping.</Callout>
          <Callout tone="neutral" icon={false}>
            Imported from LinkedIn on Oct 21.
          </Callout>
        </div>
      ),
    },
    {
      id: 'compact',
      name: 'Compact',
      render: () => (
        <div className="grid w-full gap-2">
          <Callout tone="warn" compact>
            3 listings could not be refreshed.
          </Callout>
          <Callout tone="loss" compact title="Offline">
            Showing cached data.
          </Callout>
        </div>
      ),
    },
    {
      id: 'action',
      name: 'With an action and dismiss',
      render: () => (
        <div className="grid w-full gap-3">
          <Callout tone="warn" title={COPY.warn.title} action={<Button size="sm">Reconnect</Button>}>
            {COPY.warn.body}
          </Callout>
          <Dismissable />
        </div>
      ),
    },
    {
      id: 'bar',
      name: 'Bar',
      note: 'Full width with square corners, for a sticky page-level alert.',
      wide: true,
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-th-line">
          <Callout tone="loss" variant="bar" live title="Live alert" action={<Button size="sm">View</Button>} className="border-t-0">
            SPY crossed below the 50-day moving average.
          </Callout>
          <div className="bg-th-bg p-4 text-sm text-th-hi3">Page content…</div>
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      render: () => (
        <Card className="w-full max-w-md">
          <h3 className="text-sm font-semibold text-th-hi">Brokerage</h3>
          <p className="mt-1 text-xs text-th-hi3">Schwab, account ending 4821</p>
          <Callout tone="ok" compact className="mt-3">
            Connected. Positions sync every 5 minutes.
          </Callout>
        </Card>
      ),
    },
  ],
  usage: `import { Callout } from '@nish/ui';

<Callout tone="warn" title="Token expires soon" action={<Button size="sm">Reconnect</Button>}>
  The Schwab token expires in 2 days.
</Callout>

// Appears after something fails: announce it.
{error ? <Callout tone="loss" live>{error.message}</Callout> : null}`,
  guidelines: [
    'Use the tone for meaning: info for context, ok for success, warn for something to check soon, loss for a failure.',
    'Set live only when the callout appears in response to something; a notice present on page load needs no role.',
    'One action at most. A callout with several decisions is a dialog or a section.',
    'The bar variant is for one page-level alert at a time, usually sticky under the header.',
  ],
};
