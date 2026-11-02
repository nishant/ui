/** The current-link rule shared by `<nish-bottom-nav>` and `<nish-nav-rail>`: among the
 *  same-origin links that are direct children of `nav`, the one whose path is the longest prefix
 *  of `location.pathname` gets `aria-current="page"` (`/` matches only `/`). It is kept current on
 *  `popstate` and whenever links are added or removed. With no path match (srcdoc frames,
 *  hash-routed sites) an author-set `aria-current` is left alone; only the mark this function set
 *  itself is undone. `decorate` runs on every link each time (to add a class). Returns a function
 *  that removes the listener and observer. */
export function mountCurrentLink(nav: HTMLElement, decorate?: (a: HTMLAnchorElement) => void): () => void {
  let auto: HTMLAnchorElement | null = null;
  const links = (): HTMLAnchorElement[] => Array.from(nav.querySelectorAll<HTMLAnchorElement>(':scope > a'));

  const mark = (): void => {
    const path = location.pathname;
    let best: HTMLAnchorElement | null = null;
    let bestLen = -1;
    for (const a of links()) {
      decorate?.(a);
      if (!a.getAttribute('href')) continue;
      let url: URL;
      try {
        url = new URL(a.getAttribute('href') as string, location.href);
      } catch {
        continue;
      }
      if (url.origin !== location.origin) continue;
      const base = url.pathname;
      const hit = base === '/' ? path === '/' : path === base || path.startsWith(base.endsWith('/') ? base : `${base}/`);
      if (hit && base.length > bestLen) {
        best = a;
        bestLen = base.length;
      }
    }
    if (!best) {
      auto?.removeAttribute('aria-current');
      auto = null;
      return;
    }
    for (const a of links()) a.removeAttribute('aria-current');
    best.setAttribute('aria-current', 'page');
    auto = best;
  };

  const observer = new MutationObserver(() => {
    observer.disconnect();
    mark();
    observer.observe(nav, { childList: true });
  });
  mark();
  window.addEventListener('popstate', mark);
  observer.observe(nav, { childList: true });
  return () => {
    window.removeEventListener('popstate', mark);
    observer.disconnect();
  };
}
