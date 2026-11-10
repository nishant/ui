import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { initTheme } from '../src/theme';
import { PageErrorBoundary } from './lib/error-boundary';
import { guardFrameFocus } from './lib/frame-guard';
import { useRoute } from './lib/router';

const isFrame = location.hash.startsWith('#/frame/');
// A frame paints the theme it is given; the site itself follows the saved choice.
if (isFrame) guardFrameFocus();
else initTheme();

// The shell and the frame page are chunks of their own; each docs page is another one inside them.
const Shell = lazy(() => import('./shell'));
const FramePage = lazy(() => import('./pages/frame').then((m) => ({ default: m.FramePage })));

function App() {
  const route = useRoute();
  return (
    <PageErrorBoundary resetKey={route.path}>
      <Suspense fallback={null}>{route.segments[0] === 'frame' ? <FramePage route={route} /> : <Shell />}</Suspense>
    </PageErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
