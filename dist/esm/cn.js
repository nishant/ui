// src/cn.ts
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
var twMerge = /* @__PURE__ */ extendTailwindMerge({
  extend: {
    theme: {
      text: ["2xs", "3xs"]
    },
    classGroups: {
      shadow: [{ shadow: ["card", "pop", "modal"] }]
    }
  }
});
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export {
  cn
};
