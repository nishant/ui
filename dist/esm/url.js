// src/url.ts
function safeUrl(href) {
  if (href == null) return null;
  const raw = String(href);
  let start = 0;
  let end = raw.length;
  while (start < end && raw.charCodeAt(start) <= 32) start++;
  while (end > start && raw.charCodeAt(end - 1) <= 32) end--;
  const out = raw.slice(start, end).replace(/[\t\n\r]/g, "");
  if (out === "") return null;
  if (out !== out.trim()) return null;
  if (/[\u0000-\u001f\u007f]/.test(out)) return null;
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(out);
  if (!m) return out;
  const scheme = m[1].toLowerCase();
  return scheme === "http" || scheme === "https" || scheme === "mailto" || scheme === "tel" ? out : null;
}
export {
  safeUrl
};
