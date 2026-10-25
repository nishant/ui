import { useEffect, useState } from 'react';
import { applyTheme, isThemeName, Toaster } from '../../src';
import { COMPONENT_DOCS } from '../components';
import type { Args } from '../lib/jsx';
import type { Route } from '../lib/router';

/** A preview frame must not pull focus out of the page around it (Modal focuses its
 *  panel on mount). Focus calls go through only once someone is using the frame. */
export function guardFrameFocus(): void {
  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (this: HTMLElement, opts?: FocusOptions) {
    if (document.hasFocus()) focus.call(this, opts);
  };
}

/** #/frame/<component>?story=…&theme=…&args=…: one story alone in its own document,
 *  for components that portal to <body> (Modal, Toast, Tooltip). The parent page
 *  sends new canvas args with postMessage. */
export function FramePage({ route }: { route: Route }) {
  const doc = COMPONENT_DOCS.find((d) => d.id === route.segments[1]);
  const [args, setArgs] = useState<Args>(() => {
    try {
      return { ...doc?.initial, ...JSON.parse(route.query.get('args') ?? '{}') };
    } catch {
      return { ...doc?.initial };
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

  if (!doc) return null;
  const story = doc.stories.find((s) => s.id === route.query.get('story'));
  return (
    <main className="doc-canvas flex min-h-dvh items-center justify-center p-6">
      {story ? story.render() : doc.render(args)}
      {doc.id === 'toast' ? <Toaster /> : null}
    </main>
  );
}
