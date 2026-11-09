// src/components/visually-hidden.tsx
import { jsx } from "react/jsx-runtime";
var HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0
};
function VisuallyHidden({ as = "span", style, ref, ...rest }) {
  const Tag = as;
  return /* @__PURE__ */ jsx(Tag, { ref, style: { ...HIDDEN, ...style }, ...rest });
}
export {
  VisuallyHidden
};
