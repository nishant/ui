// src/components/navigate.ts
import { safeUrl } from "../url.js";
import { whenHistorySettled } from "./overlay-core.js";
function warnUnsafe(href) {
  try {
    if (process.env.NODE_ENV !== "production") console.warn(`CommandPalette: ignored an unsafe href (${href.slice(0, 40)}).`);
  } catch {
  }
}
function navigateFromLayer(rawHref) {
  const href = safeUrl(rawHref);
  if (href === null) {
    warnUnsafe(rawHref);
    return;
  }
  const inLayer = !!history.state?.nishLayer;
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
  window.setTimeout(() => whenHistorySettled(go), 0);
  window.setTimeout(go, 400);
}
export {
  navigateFromLayer,
  warnUnsafe
};
