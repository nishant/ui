import { useEffect } from 'react';
import { AppHeader, ConnectionBanner } from '../../src';
import { Device, Filler } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- ConnectionBanner -----------------------------------------------------------------------

/** Makes the browser report offline (or online) for as long as the demo is mounted. No request
 *  is made, so the docs stay free of network errors; the banner reacts to the real events. */
function useFakeOnline(online: boolean) {
  useEffect(() => {
    const desc = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
    return () => {
      if (desc) Object.defineProperty(navigator, 'onLine', desc);
      else delete (navigator as { onLine?: boolean }).onLine;
      window.dispatchEvent(new Event(navigator.onLine ? 'online' : 'offline'));
    };
  }, [online]);
}

function Demo({ online = false, offlineMessage }: { online?: boolean; offlineMessage?: string }) {
  useFakeOnline(online);
  return (
    <>
      <AppHeader name="trips" />
      <ConnectionBanner offlineMessage={offlineMessage} />
      <Filler title="Your trips" rows={6} />
    </>
  );
}

export const connectionBanner: ComponentDoc = {
  id: 'connection-banner',
  name: 'ConnectionBanner',
  exports: ['ConnectionBanner'],
  summary:
    'A sticky warning bar for lost connectivity. It watches the browser\'s online state and, with a healthUrl, probes the server with growing back-off (and immediately when the browser comes back online or the tab becomes visible). It renders nothing while everything is reachable.',
  importLine: "import { ConnectionBanner } from '@nish/ui';",
  controls: [
    { key: 'state', label: 'Connection', type: 'select', options: ['offline', 'online'] },
    { key: 'message', label: 'Offline message', type: 'select', options: ["You're offline", 'No connection'] },
  ],
  initial: { state: 'offline', message: "You're offline" },
  render: (a) => (
    <Device doc="connection-banner" args={a} height={340} title="ConnectionBanner at 360px">
      <Demo online={a.state === 'online'} offlineMessage={String(a.message)} />
    </Device>
  ),
  code: (a) =>
    [
      '<ConnectionBanner',
      '  healthUrl="/api/health"',
      ...(a.message !== "You're offline" ? [`  offlineMessage="${a.message}"`] : []),
      '/>',
    ].join('\n'),
  stories: [
    {
      id: 'down',
      name: 'Offline',
      note: 'The preview makes the browser report offline, so the opaque warning bar sticks under the header. With a healthUrl, a failing server probe shows the message Can’t reach the server the same way.',
      render: () => (
        <Device doc="connection-banner" story="down" height={340} title="ConnectionBanner, server down">
          <Demo />
        </Device>
      ),
    },
    {
      id: 'up',
      name: 'Online: nothing',
      render: () => (
        <Device doc="connection-banner" story="up" height={260} title="ConnectionBanner, healthy">
          <Demo online />
        </Device>
      ),
    },
  ],
  usage: `import { ConnectionBanner, useOnline } from '@nish/ui';

<AppHeader name="trading" />
<ConnectionBanner healthUrl="/api/health" onRetry={() => queryClient.invalidateQueries()} />

// Elsewhere: disable actions while offline.
const online = useOnline();`,
  guidelines: [
    'Put it right under AppHeader. It is sticky and opaque, so it stays in view while content scrolls beneath.',
    'Point healthUrl at a cheap same-origin endpoint that returns 2xx. Any non-2xx or network error counts as unreachable.',
    'Probes slow down after failures (30s, 60s, then 120s) and restart as soon as the device is back online.',
    'Browser offline shows offlineMessage ("You\'re offline") and needs no healthUrl at all.',
  ],
  api: { functions: ['useOnline'], interfaces: [] },
};
