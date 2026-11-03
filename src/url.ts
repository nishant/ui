/** href for user-supplied links: relative URLs, #fragments, http(s), mailto and tel pass;
 *  anything else (javascript:, data:, vbscript:, file:) returns null. Trims leading and trailing
 *  C0 controls and spaces and drops tabs and newlines the way the WHATWG URL parser does, then
 *  reads the scheme from the very string that is returned. Other Unicode whitespace (NBSP, U+FEFF,
 *  U+2028, U+3000) is not stripped by browsers, so it is kept, and a scheme hidden behind it is
 *  not a scheme there either. */
export function safeUrl(href: string | null | undefined): string | null {
  if (href == null) return null;
  // Trim C0 controls and spaces with index scans: an anchored `[...]+$` regex backtracks
  // quadratically on a long run of them.
  const raw = String(href);
  let start = 0;
  let end = raw.length;
  while (start < end && raw.charCodeAt(start) <= 0x20) start++;
  while (end > start && raw.charCodeAt(end - 1) <= 0x20) end--;
  const out = raw.slice(start, end).replace(/[\t\n\r]/g, '');
  if (out === '') return null;
  // A relative URL that begins with Unicode whitespace followed by a scheme-like word is refused:
  // some consumers trim() it before use, which would turn it into a live script URL.
  if (out !== out.trim()) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(out)) return null;
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(out);
  if (!m) return out;
  const scheme = m[1]!.toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel' ? out : null;
}
