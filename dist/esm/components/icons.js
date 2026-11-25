// src/components/icons.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Svg({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
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
var XIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M18 6 6 18M6 6l12 12" }) });
var CheckCircleIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "m9 12 2 2 4-4" })
] });
var AlertTriangleIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
  /* @__PURE__ */ jsx("path", { d: "M12 9v4M12 17h.01" })
] });
var InfoIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "M12 16v-4M12 8h.01" })
] });
var RotateIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }),
  /* @__PURE__ */ jsx("path", { d: "M21 3v5h-5" })
] });
var LoaderIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-6.22-8.56" }) });
var SunIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "4" }),
  /* @__PURE__ */ jsx("path", { d: "M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41" })
] });
var MoonIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" }) });
var MonitorIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M8 21h8M12 17v4" })
] });
var ChevronDownIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) });
var CheckIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) });
var ClockIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "M12 6v6l4 2" })
] });
var MoreIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1" }),
  /* @__PURE__ */ jsx("circle", { cx: "19", cy: "12", r: "1" }),
  /* @__PURE__ */ jsx("circle", { cx: "5", cy: "12", r: "1" })
] });
var BellIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }),
  /* @__PURE__ */ jsx("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })
] });
var SettingsIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" })
] });
var PanelLeftCloseIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M9 3v18" }),
  /* @__PURE__ */ jsx("path", { d: "m16 15-3-3 3-3" })
] });
var PanelLeftOpenIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M9 3v18" }),
  /* @__PURE__ */ jsx("path", { d: "m14 9 3 3-3 3" })
] });
var ChevronLeftIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m15 18-6-6 6-6" }) });
var ChevronRightIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) });
var CalendarIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M8 2v4M16 2v4" }),
  /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M3 10h18" })
] });
var PauseIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { x: "14", y: "4", width: "4", height: "16", rx: "1" }),
  /* @__PURE__ */ jsx("rect", { x: "6", y: "4", width: "4", height: "16", rx: "1" })
] });
var PlayIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("polygon", { points: "6 3 20 12 6 21 6 3" }) });
export {
  AlertTriangleIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InfoIcon,
  LoaderIcon,
  MonitorIcon,
  MoonIcon,
  MoreIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PauseIcon,
  PlayIcon,
  RotateIcon,
  SettingsIcon,
  SunIcon,
  XIcon
};
