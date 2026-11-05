'use client';
import { useState, type ReactNode, type RefObject } from 'react';
import { safeUrl } from '../url';
import { isRtl, useIsoLayoutEffect } from './client';
import { navigateFromLayer } from './command';
import { useNishConfig, useNishStrings } from './provider';
import type { NavItem, RenderLink } from './nav';

/** @internal The tooltip side that points away from the nav toward the page: right, or left in RTL. The
 *  provider's `dir` wins; without one the element's computed direction decides. */
export function useEndSide(ref: RefObject<HTMLElement | null>): 'left' | 'right' {
  const dir = useNishConfig().dir;
  const [rtl, setRtl] = useState(dir === 'rtl');
  useIsoLayoutEffect(() => {
    setRtl(dir ? dir === 'rtl' : isRtl(ref.current));
  }, [dir, ref]);
  return rtl ? 'left' : 'right';
}

/** @internal The dot or count pill drawn on a nav icon. */
export function NavBadge({ value }: { value: number | boolean | undefined }) {
  const strings = useNishStrings();
  if (value === undefined || value === false || value === 0) return null;
  if (value === true) {
    return (
      <span
        aria-hidden="true"
        className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-th-loss ring-2 ring-th-surface forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]"
      />
    );
  }
  return (
    <span
      aria-label={strings.newCount(value)}
      className="absolute -end-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-th-loss px-1 text-3xs font-semibold leading-none tabular-nums text-th-on-loss ring-2 ring-th-surface forced-colors:border forced-colors:border-[CanvasText]"
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

const layerOf = (): string | undefined => (history.state as { nishLayer?: string } | null)?.nishLayer;

/** Closes a closeOnBack sheet after a renderLink row was clicked. Closing drops the sheet's
 *  history entry with history.back(); a router that navigates asynchronously (React Router's
 *  data routers) would then write its entry before that back lands, and the back would undo
 *  the navigation. So when the router took the click (default prevented), wait until it has
 *  replaced the sheet's entry, after which closing issues no back. A click the browser
 *  handles itself (a plain anchor, a new-tab click) closes at once, as before. */
function closeAfterRouterLink(onAfter: () => void): void {
  const layer = layerOf();
  if (typeof window === 'undefined' || !layer) {
    onAfter();
    return;
  }
  let decided = false;
  const decide = (routerTookIt: boolean) => {
    if (decided) return;
    decided = true;
    window.removeEventListener('click', onWindowClick);
    if (!routerTookIt) {
      onAfter();
      return;
    }
    const t0 = Date.now();
    const wait = () => {
      if (layerOf() !== layer || Date.now() - t0 > 3000) onAfter();
      else window.setTimeout(wait, 16);
    };
    wait();
  };
  // Runs for this same click once it bubbles past the router's handler (React's root).
  const onWindowClick = (e: Event) => decide(e.defaultPrevented);
  window.addEventListener('click', onWindowClick);
  // Propagation stopped before window: assume a router.
  window.setTimeout(() => decide(true), 0);
}

/** @internal An item as a link or a button, with the caller's look. */
export function renderItem(item: NavItem, className: string, children: ReactNode, renderLink: RenderLink | undefined, onAfter?: () => void): ReactNode {
  const current = item.active ? ('page' as const) : undefined;
  const state = item.active ? ('active' as const) : ('inactive' as const);
  if (item.href != null) {
    const href = safeUrl(item.href);
    if (href === null) return null;
    if (renderLink) {
      return renderLink(item, {
        className,
        children,
        'aria-current': current,
        'data-state': state,
        ...(onAfter ? { replace: true } : {}),
        onClick: () => {
          item.onSelect?.();
          if (onAfter) closeAfterRouterLink(onAfter);
        },
      });
    }
    return (
      <a
        href={href}
        className={className}
        aria-current={current}
        data-state={state}
        onClick={(e) => {
          item.onSelect?.();
          const inLayer = !!(history.state as { nishLayer?: string } | null)?.nishLayer;
          const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
          if (onAfter && inLayer && plain) {
            // Closing the sheet runs history.back(), which would race the default navigation.
            e.preventDefault();
            onAfter();
            navigateFromLayer(href);
            return;
          }
          onAfter?.();
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-current={current}
      data-state={state}
      onClick={() => {
        item.onSelect?.();
        onAfter?.();
      }}
    >
      {children}
    </button>
  );
}

/** @internal */
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent';
