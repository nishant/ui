// src/node/vite.ts
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
  return {
    name: "nish-theme-init",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => {
        if (position === "head-prepend" || position === "auto" && !charset.test(html)) {
          return [{ tag: "script", children: code, injectTo: "head-prepend" }];
        }
        if (!charset.test(html)) throw new Error("@nish/ui/vite: no <meta charset> in index.html");
        return html.replace(charset, (m) => m + "<script>" + code + "</script>");
      }
    }
  };
}
export {
  nishThemeInit
};
