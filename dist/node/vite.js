// src/node/vite.ts
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
function nishThemeInit(o = {}) {
  const file = o.file ?? fileURLToPath(new URL("../theme-init.js", import.meta.url));
  if (!existsSync(file)) throw new Error(`@nish/ui/vite: theme-init.js not found at ${file}`);
  const themeInit = readFileSync(file, "utf8").replace(/^[ \t]*\/\/.*(?:\r?\n|$)/gm, "").trim();
  const legacy = o.legacyKey ? `try{var k=${JSON.stringify(o.legacyKey)},v=localStorage.getItem(k);if(v&&!localStorage.getItem('nish-theme')&&!/(?:^|; )nish-theme=/.test(document.cookie))localStorage.setItem('nish-theme',v)}catch(e){}` : "";
  const code = [legacy, o.prelude, themeInit].filter(Boolean).join("\n");
  const position = o.position ?? "auto";
  const charset = /<meta\s+charset[^>]*>/i;
  const nonceAttr = () => {
    const n = typeof o.nonce === "function" ? o.nonce() : o.nonce;
    return n ? n : void 0;
  };
  return {
    name: "nish-theme-init",
    hash: "sha256-" + createHash("sha256").update(code).digest("base64"),
    transformIndexHtml: {
      order: "pre",
      handler: (html) => {
        const nonce = nonceAttr();
        if (position === "head-prepend" || position === "auto" && !charset.test(html)) {
          return [{ tag: "script", ...nonce ? { attrs: { nonce } } : {}, children: code, injectTo: "head-prepend" }];
        }
        if (!charset.test(html)) throw new Error("@nish/ui/vite: no <meta charset> in index.html");
        return html.replace(charset, (m) => m + (nonce ? `<script nonce="${escapeAttr(nonce)}">` : "<script>") + code + "</script>");
      }
    }
  };
}
function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
export {
  nishThemeInit
};
