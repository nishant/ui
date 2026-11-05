import { use, useEffect, useState } from 'react';
import { applyTheme, isThemeName, Toaster } from '../../src';
import type { ComponentDoc } from '../components/types';
import { docMeta, loadDoc } from '../lib/docs';
import type { Args } from '../lib/jsx';
import type { Route } from '../lib/router';

/** #/frame/<component>?story=…&theme=…&args=…: one story alone in its own document,
 *  for components that portal to <body> (Modal, Toast, Tooltip). The parent page
 *  sends new canvas args with postMessage. Focus is guarded before render (lib/frame-guard). */
export function FramePage({ route }: { route: Route }) {
  const id = route.segments[1];
  return id && docMeta(id) ? <FrameBody route={route} id={id} /> : null;
}

function FrameBody({ route, id }: { route: Route; id: string }) {
  const doc: ComponentDoc = use(loadDoc(id));
  const [args, setArgs] = useState<Args>(() => {
    try {
      return { ...doc.initial, ...JSON.parse(route.query.get('args') ?? '{}') };
    } catch {
      return { ...doc.initial };
    }
  });

  useEffect(() => {
    const t = route.query.get('theme');
    // Paint only, never save: a preview must not change the visitor's choice.
    if (t && isThemeName(t)) applyTheme(t);
    document.documentElement.dataset.frame = '';
  }, [route]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source === window.parent && e.data?.type === 'nish-args') setArgs(e.data.args);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  const story = doc.stories.find((s) => s.id === route.query.get('story'));
  return (
    <div className="doc-canvas flex min-h-dvh items-center justify-center p-6">
      {story ? story.render() : doc.render(args)}
      {doc.id === 'toast' ? <Toaster /> : null}
    </div>
  );
}
