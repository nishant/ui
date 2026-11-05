import { safeUrl } from '../url';
import { whenHistorySettled } from './overlay-core';

/** @internal Dev warning for an href that `safeUrl` refused. */
export function warnUnsafe(href: string): void {
  try {
    if (process.env.NODE_ENV !== 'production') console.warn(`CommandPalette: ignored an unsafe href (${href.slice(0, 40)}).`);
  } catch {
    // No process or no console.
  }
}

/** Navigates after the layer that is closing has dropped its own history entry. Running
 *  `history.back()` (the layer's cleanup) right after `location.assign` would cancel the
 *  navigation, so wait for that pop to finish. Call it before closing the layer. */
export function navigateFromLayer(rawHref: string): void {
  const href = safeUrl(rawHref);
  if (href === null) {
    warnUnsafe(rawHref);
    return;
  }
  const inLayer = !!(history.state as { nishLayer?: string } | null)?.nishLayer;
  if (!inLayer) {
    window.location.assign(href);
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.location.assign(href);
  };
  // The layer's cleanup issues history.back() after this call (on close), so the back is
  // not pending yet: defer one tick, then wait for the module's pending backs to settle.
  window.setTimeout(() => whenHistorySettled(go), 0);
  // Safety net only.
  window.setTimeout(go, 400);
}
