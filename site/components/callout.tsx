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
    { key: 'sticky', label: 'Sticky', type: 'boolean' },
    { key: 'clamp', label: 'Clamp', type: 'select', options: ['none', '1', '2', '3'] },
    { key: 'count', label: 'Count', type: 'number', min: 0, max: 99 },
  ],
  initial: { tone: 'warn', variant: 'box', title: COPY.warn.title, body: COPY.warn.body, compact: false, icon: true, action: true, sticky: false, clamp: 'none', count: 0 },
  render: (a) => (
    <Callout
      tone={a.tone as CalloutTone}
      variant={a.variant as 'box'}
      title={String(a.title) || undefined}
      compact={!!a.compact}
      sticky={!!a.sticky}
      clamp={a.clamp === 'none' ? undefined : (Number(a.clamp) as 1 | 2 | 3)}
      count={Number(a.count) > 0 ? Number(a.count) : undefined}
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
        sticky: a.sticky || undefined,
        clamp: a.clamp === 'none' ? undefined : `{${a.clamp}}`,
        count: Number(a.count) > 0 ? `{${a.count}}` : undefined,
        icon: a.icon ? undefined : '{false}',
        action: a.action ? '{<Button size="sm">Reconnect</Button>}' : undefined,
      },
      String(a.body),
    ),
  html: {
    height: 580,
    code: `<div class="nish-callout nish-callout--neutral" style="margin-bottom:8px">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></span>
  <div><p class="nish-callout-title">Read-only</p><p>This board is shared with you.</p></div>
</div>
<div class="nish-callout nish-callout--accent" style="margin-bottom:8px">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></span>
  <div><p class="nish-callout-title">New: price alerts</p><p>Get a notification when an item drops.</p></div>
</div>
<div class="nish-callout nish-callout--info" style="margin-bottom:8px">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></span>
  <div><p class="nish-callout-title">Market closed</p><p>Quotes are from the 4:00 pm close.</p></div>
</div>
<div class="nish-callout nish-callout--ok" style="margin-bottom:8px">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>
  <div><p class="nish-callout-title">All sites are up</p><p>Last checked 2 minutes ago.</p></div>
</div>
<div class="nish-callout nish-callout--warn" style="margin-bottom:8px">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg></span>
  <div><p class="nish-callout-title">Token expires soon</p><p>Reconnect to keep syncing.</p></div>
</div>
<div class="nish-callout nish-callout--loss">
  <span class="nish-callout-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg></span>
  <div><p class="nish-callout-title">Sync failed</p><p>The store returned 503.</p></div>
</div>
<div class="nish-callout nish-callout--text nish-callout--warn" style="margin-top:8px">
  Prices change <b>daily</b>; check the store before you buy.
</div>`,
  },
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
          <Callout tone="loss" variant="bar" title="Live alert" action={<Button size="sm">View</Button>} className="border-t-0">
            SPY crossed below the 50-day moving average.
          </Callout>
          <div className="bg-th-bg p-4 text-sm text-th-hi3">Page content…</div>
        </div>
      ),
    },
    {
      id: 'link',
      name: 'Link callout',
      note: 'href makes the whole row one link (44px tall, with a chevron); onClick makes it a button.',
      render: () => (
        <div className="grid w-full gap-3">
          <Callout tone="info" title="What is new" href="#callout">
            See the release notes for this version.
          </Callout>
          <Callout tone="accent" title="Open the changelog" onClick={() => {}}>
            Opens in a panel.
          </Callout>
        </div>
      ),
    },
    {
      id: 'clamp',
      name: 'Clamped body',
      note: 'clamp limits the body to 1, 2 or 3 lines with an ellipsis.',
      render: () => (
        <Callout tone="warn" title="Token expires soon" clamp={2}>
          The Schwab token expires in 2 days. Reconnect to keep syncing positions, orders and balances; until then the
          dashboard shows the last values it fetched, and alerts based on live prices are paused for this account.
        </Callout>
      ),
    },
    {
      id: 'count',
      name: 'Count badge',
      note: 'count shows a "+n" badge after the title, for "and 3 more" notices.',
      render: () => (
        <Callout tone="info" title="Sync warnings" count={3}>
          The store returned 503.
        </Callout>
      ),
    },
    {
      id: 'sticky',
      name: 'Sticky bar',
      note: 'sticky pins the bar under the app header; here the header height is 0 and the box scrolls.',
      wide: true,
      render: () => (
        <div
          className="h-48 w-full overflow-auto rounded-xl border border-th-line bg-th-bg"
          style={{ ['--nish-header-h' as string]: '0px' }}
        >
          <Callout tone="warn" variant="bar" sticky title="Scheduled maintenance" className="border-t-0">
            Tonight at 11 pm.
          </Callout>
          <div className="grid gap-3 p-4 text-sm text-th-hi3">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>Page content, row {i + 1}</p>
            ))}
          </div>
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
    'The dismiss button is named by the NishProvider dismiss string; dismissLabel overrides it for one callout. An href with an unsafe scheme (javascript:, data:) is dropped and the callout is not a link.',
    'Use the tone for meaning: info for context, ok for success, warn for something to check soon, loss for a failure.',
    'Set live only when the callout appears in response to something; a notice present on page load needs no role.',
    'One action at most. A callout with several decisions is a dialog or a section.',
    'The bar variant is for one page-level alert at a time, usually sticky under the header (sticky).',
  ],
};
