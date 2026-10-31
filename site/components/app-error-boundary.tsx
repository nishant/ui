import { useState } from 'react';
import { AppErrorBoundary, Button } from '../../src';
import type { ComponentDoc } from './types';

// --- AppErrorBoundary -----------------------------------------------------------------------

function Panel({ message }: { message: string }) {
  const [thrown, setThrown] = useState(false);
  if (thrown) throw new Error(message);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="danger" onClick={() => setThrown(true)}>
        Throw
      </Button>
      <span className="text-sm text-th-hi3">Everything renders. Press Throw to break this panel.</span>
    </div>
  );
}

function Demo({ message = 'Could not render the portfolio chart.' }: { message?: string }) {
  return (
    <div className="w-full max-w-lg">
      <AppErrorBoundary>
        <Panel message={message} />
      </AppErrorBoundary>
    </div>
  );
}

export const appErrorBoundary: ComponentDoc = {
  id: 'app-error-boundary',
  name: 'AppErrorBoundary',
  exports: ['AppErrorBoundary'],
  source: 'src/components/error-boundary.tsx',
  summary:
    'Catches a render error below it and shows a themed fallback with Try again and Reload page, instead of a white screen. It needs no Toaster and no theme context, so it can wrap the whole app. A failed dynamic import after a release shows a "new version" message.',
  importLine: "import { AppErrorBoundary } from '@nish/ui';",
  controls: [],
  initial: {},
  render: () => <Demo />,
  code: () => '<AppErrorBoundary resetKeys={[location.pathname]} onError={(e) => report(e)}>\n  <Routes />\n</AppErrorBoundary>',
  stories: [
    { id: 'default', name: 'Default fallback', render: () => <Demo /> },
    {
      id: 'chunk',
      name: 'Stale deploy (failed dynamic import)',
      render: () => <Demo message="Failed to fetch dynamically imported module: /assets/Settings-3f2a.js" />,
    },
  ],
  usage: `import { AppErrorBoundary } from '@nish/ui';

<AppErrorBoundary
  resetKeys={[location.pathname]}               // leaving the page clears the error
  onError={(error, info) => navigator.sendBeacon('/api/log', JSON.stringify({ message: error.message, stack: info.componentStack }))}
>
  <Routes />
</AppErrorBoundary>

// Your own fallback:
<AppErrorBoundary fallback={({ error, reset }) => <MyFallback error={error} onRetry={reset} />}>`,
  guidelines: [
    'Put one around the whole app (outside the router if you can) and one around each widget that can fail on its own, so one bad chart does not take the page down.',
    'Error boundaries catch errors while rendering, not in event handlers or async code. Those go to ErrorState or a toast.',
    'Pass resetKeys={[location.pathname]} so navigating away from a broken page recovers without a reload.',
    'onError is called once per caught error: send it to your log endpoint there.',
  ],
};
