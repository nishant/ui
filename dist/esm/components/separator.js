// src/components/separator.tsx
import { cn } from "../cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
var LINE = "bg-th-line forced-colors:bg-[CanvasText]";
function Separator({ orientation = "horizontal", decorative = true, label, className, ref, ...rest }) {
  const a11y = decorative ? { role: "none" } : { role: "separator", "aria-orientation": orientation };
  const hasLabel = label != null && label !== false && label !== "" && orientation === "horizontal";
  if (hasLabel) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        "data-orientation": orientation,
        ...a11y,
        ...rest,
        ref,
        className: cn("flex w-full items-center gap-3 text-xs text-th-hi3", className),
        children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: cn("h-px flex-1", LINE) }),
          /* @__PURE__ */ jsx("span", { className: "shrink-0", children: label }),
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: cn("h-px flex-1", LINE) })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-orientation": orientation,
      ...a11y,
      ...rest,
      ref,
      className: cn("shrink-0", LINE, orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch", className)
    }
  );
}
export {
  Separator
};
