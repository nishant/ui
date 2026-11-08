"use client";

// src/components/avatar.tsx
import {
  Children,
  createContext,
  useContext,
  useState
} from "react";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { StatusDot } from "./display.js";
import { useStrings } from "./provider.js";
import { AVATAR_STRINGS } from "./strings.js";
import { HUES, avatarHueIndex, avatarInitials } from "./avatar-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var SIZE = {
  xs: "size-6 text-3xs",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl"
};
var DOT_SIZE = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };
var GroupContext = /* @__PURE__ */ createContext(null);
function Avatar({ src, name, alt, size, shape, status, className, ref, ...rest }) {
  const group = useContext(GroupContext);
  const strings = useStrings(AVATAR_STRINGS);
  const resolvedSize = size ?? group?.size ?? "md";
  const resolvedShape = shape ?? group?.shape ?? "circle";
  const url = src ? safeUrl(src) : null;
  const [failed, setFailed] = useState(null);
  const showImage = url != null && failed !== url;
  const label = alt ?? name ?? strings.avatar;
  const decorative = alt === "";
  const initials = name ? avatarInitials(name) : "";
  const rounded = resolvedShape === "circle" ? "rounded-full" : "rounded-lg";
  return /* @__PURE__ */ jsxs(
    "span",
    {
      ref,
      className: cn("relative inline-flex shrink-0 align-middle", SIZE[resolvedSize].split(" ")[0], className),
      ...rest,
      children: [
        showImage ? /* @__PURE__ */ jsx(
          "img",
          {
            src: url,
            alt: label,
            onError: () => setFailed(url),
            className: cn("size-full object-cover", rounded)
          }
        ) : /* @__PURE__ */ jsx(
          "span",
          {
            role: decorative ? void 0 : "img",
            "aria-label": decorative ? void 0 : label,
            "aria-hidden": decorative ? true : void 0,
            className: cn(
              "inline-flex size-full select-none items-center justify-center overflow-hidden font-semibold",
              "forced-colors:border forced-colors:border-[ButtonText]",
              rounded,
              SIZE[resolvedSize].split(" ")[1],
              name ? HUES[avatarHueIndex(name)] : "bg-th-elevated text-th-hi2"
            ),
            children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: initials })
          }
        ),
        status ? /* @__PURE__ */ jsx(
          StatusDot,
          {
            tone: status,
            size: DOT_SIZE[resolvedSize],
            label: status,
            className: "absolute bottom-0 end-0 ring-2 ring-th-surface forced-colors:border forced-colors:border-[ButtonText]"
          }
        ) : null
      ]
    }
  );
}
function AvatarGroup({ max, size = "md", shape = "circle", children, className, ref, ...rest }) {
  const strings = useStrings(AVATAR_STRINGS);
  const items = Children.toArray(children);
  const limit = max != null && max >= 0 ? Math.floor(max) : items.length;
  const shown = items.slice(0, limit);
  const extra = items.length - shown.length;
  return /* @__PURE__ */ jsx(GroupContext.Provider, { value: { size, shape }, children: /* @__PURE__ */ jsxs("div", { ref, role: "group", className: cn("flex items-center", className), ...rest, children: [
    shown.map((child, i) => /* @__PURE__ */ jsx("span", { className: cn("inline-flex ring-2 ring-th-surface", shape === "circle" ? "rounded-full" : "rounded-lg", i > 0 && "-ms-2"), children: child }, i)),
    extra > 0 ? /* @__PURE__ */ jsx(
      "span",
      {
        role: "img",
        "aria-label": strings.avatarMore(extra),
        className: cn(
          "-ms-2 inline-flex shrink-0 items-center justify-center bg-th-overlay font-semibold tabular-nums text-th-hi2 ring-2 ring-th-surface",
          "forced-colors:border forced-colors:border-[ButtonText]",
          shape === "circle" ? "rounded-full" : "rounded-lg",
          SIZE[size]
        ),
        children: /* @__PURE__ */ jsxs("span", { "aria-hidden": "true", children: [
          "+",
          extra
        ] })
      }
    ) : null
  ] }) });
}
export {
  Avatar,
  AvatarGroup,
  avatarHueIndex,
  avatarInitials
};
