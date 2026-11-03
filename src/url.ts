/** href for user-supplied links: relative URLs, #fragments, http(s), mailto and tel pass;
 *  anything else (javascript:, data:, vbscript:, file:) returns null. Strips ASCII control
 *  characters and whitespace the way browsers do before reading the scheme. */
export function safeUrl(href: string | null | undefined): string | null {
  if (href == null) return null;
  // Browsers drop tabs and newlines anywhere in a URL and trim leading/trailing C0 controls and spaces.
  // eslint-disable-next-line no-control-regex
  const cleaned = String(href).replace(/[\u0000- \u007f]+/g, '');
  if (cleaned === '') return null;
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
  if (!m) return String(href).trim();
  const scheme = m[1]!.toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel' ? String(href).trim() : null;
}
