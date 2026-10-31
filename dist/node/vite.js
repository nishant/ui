// src/node/vite.ts
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
function nishThemeInit(o = {}) {
  const file = o.file ?? fileURLToPath(new URL("../theme-init.js", import.meta.url));
  if (!existsSync(file)) throw new Error(`@nish/ui/vite: theme-init.js not found at ${file}`);
  const themeInit = readFileSync(file, "utf8").trim();
  const legacy = o.legacyKey ? `try{var k=${JSON.stringify(o.legacyKey)},v=localStorage.getItem(k);if(v&&!localStorage.getItem('nish-theme')&&!/(?:^|; )nish-theme=/.test(document.cookie))localStorage.setItem('nish-theme',v)}catch(e){}` : "";
  const code = [legacy, o.prelude, themeInit].filter(Boolean).join("\n");
  if (o.position === "after-charset") {
    return {
      name: "nish-theme-init",
      transformIndexHtml: {
        order: "pre",
        handler: (html) => {
          if (!/<meta\s+charset[^>]*>/i.test(html)) throw new Error("@nish/ui/vite: no <meta charset> in index.html");
          return html.replace(/<meta\s+charset[^>]*>/i, (m) => m + "<script>" + code + "</script>");
        }
      }
    };
  }
  return {
    name: "nish-theme-init",
    transformIndexHtml: {
      order: "pre",
      handler: () => [{ tag: "script", children: code, injectTo: "head-prepend" }]
    }
  };
}
export {
  nishThemeInit
};
