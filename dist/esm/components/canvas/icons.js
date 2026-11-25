// src/components/canvas/icons.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Svg({ children, ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children
    }
  );
}
var KIND_ICON = {
  ui: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M3 9h18" })
  ] }),
  service: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx("rect", { x: "3", y: "14", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M7 6.5h.01M7 17.5h.01" })
  ] }),
  worker: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" })
  ] }),
  library: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    /* @__PURE__ */ jsx("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ] }),
  infra: /* @__PURE__ */ jsx("path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }),
  data: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
    /* @__PURE__ */ jsx("path", { d: "M3 5v14a9 3 0 0 0 18 0V5" }),
    /* @__PURE__ */ jsx("path", { d: "M3 12a9 3 0 0 0 18 0" })
  ] }),
  tool: /* @__PURE__ */ jsx("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }),
  docs: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    /* @__PURE__ */ jsx("path", { d: "M14 2v6h6M8 13h8M8 17h5" })
  ] })
};
var PlusIcon = () => /* @__PURE__ */ jsx(Svg, { children: /* @__PURE__ */ jsx("path", { d: "M12 5v14M5 12h14" }) });
var MinusIcon = () => /* @__PURE__ */ jsx(Svg, { children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) });
var FitIcon = () => /* @__PURE__ */ jsxs(Svg, { children: [
  /* @__PURE__ */ jsx("path", { d: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" }),
  /* @__PURE__ */ jsx("rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" })
] });
var FollowIcon = () => /* @__PURE__ */ jsxs(Svg, { children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "7" }),
  /* @__PURE__ */ jsx("path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3" }),
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1.5", fill: "currentColor" })
] });
export {
  FitIcon,
  FollowIcon,
  KIND_ICON,
  MinusIcon,
  PlusIcon,
  Svg
};
