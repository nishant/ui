"use client";

// src/components/media.tsx
import { useState } from "react";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { ListRow } from "./data.js";
import { Badge } from "./primitives.js";
import { useStrings } from "./provider.js";
import { MEDIA_STRINGS } from "./strings.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var THUMB_BOX = {
  wide: {
    sm: "aspect-video w-16 rounded-[var(--nish-radius-sm)]",
    md: "aspect-video w-[72px] min-[420px]:w-24 rounded-[var(--nish-radius-sm)]"
  },
  round: { sm: "size-9 rounded-full", md: "size-12 rounded-full" },
  square: { sm: "size-9 rounded-[var(--nish-radius-sm)]", md: "size-12 rounded-[var(--nish-radius-sm)]" }
};
function MediaThumb({ src, shape = "wide", size = "md", fallback, alt = "", className, ref, ...rest }) {
  const url = safeUrl(src);
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = failedUrl !== null && failedUrl === url;
  const box = cn("relative block shrink-0 overflow-hidden bg-th-elevated", THUMB_BOX[shape][size], className);
  if (url && !failed) {
    return /* @__PURE__ */ jsx("span", { ...rest, ref, className: box, children: /* @__PURE__ */ jsx(
      "img",
      {
        src: url,
        alt,
        loading: "lazy",
        decoding: "async",
        referrerPolicy: "no-referrer",
        draggable: false,
        onError: () => setFailedUrl(url),
        className: "size-full object-cover"
      }
    ) });
  }
  return /* @__PURE__ */ jsx("span", { ...rest, ref, className: cn(box, "flex items-center justify-center text-th-hi3 [&>svg]:size-5"), role: alt ? "img" : void 0, "aria-label": alt || void 0, children: fallback });
}
function MediaRow({
  thumbnailUrl,
  thumbShape = "wide",
  thumbSize,
  fallback,
  title,
  meta,
  detail,
  live,
  liveLabel,
  offlineLabel,
  badges,
  trailing,
  chevron,
  dense = false,
  compact = false,
  onClick,
  href,
  as,
  className,
  ref,
  ...rest
}) {
  const t = useStrings(MEDIA_STRINGS);
  const small = dense || compact;
  const size = thumbSize ?? (small ? "sm" : "md");
  const badgeSize = small ? "xs" : "sm";
  const hasBadges = live !== void 0 || !!badges;
  const subtitle = meta || detail ? /* @__PURE__ */ jsxs(Fragment, { children: [
    meta ? /* @__PURE__ */ jsx("span", { className: "block truncate", children: meta }) : null,
    detail ? /* @__PURE__ */ jsx("span", { className: cn("block truncate text-th-hi3", compact ? "text-3xs" : "text-xs"), children: detail }) : null
  ] }) : void 0;
  return /* @__PURE__ */ jsx(
    ListRow,
    {
      ...rest,
      ref,
      as,
      className,
      dense,
      compact,
      href,
      onClick,
      chevron,
      icon: /* @__PURE__ */ jsx(MediaThumb, { src: thumbnailUrl, shape: thumbShape, size, fallback }),
      title,
      titleLines: 2,
      subtitle,
      trailing: hasBadges || trailing ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        hasBadges ? /* @__PURE__ */ jsxs("span", { className: "flex flex-col items-end gap-1", children: [
          live === true ? /* @__PURE__ */ jsx(Badge, { tone: "loss", size: badgeSize, children: liveLabel ?? t.live }) : live === false ? /* @__PURE__ */ jsx(Badge, { tone: "neutral", size: badgeSize, children: offlineLabel ?? t.offlineBadge }) : null,
          badges
        ] }) : null,
        trailing
      ] }) : void 0
    }
  );
}
function MediaChip({ thumbnailUrl, label, onClick, action, className, ref, ...rest }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      onClick,
      className: cn(
        "inline-flex h-11 max-w-full items-center gap-2 rounded-full border border-th-line bg-th-surface py-0 ps-1 pe-4 text-sm text-th-hi",
        "transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("span", { className: "block aspect-video w-10 shrink-0 overflow-hidden rounded-[var(--nish-radius-sm)] bg-th-elevated", children: /* @__PURE__ */ jsx(MediaChipImage, { src: thumbnailUrl }) }),
        /* @__PURE__ */ jsx("span", { className: "min-w-0 max-w-56 truncate", children: label }),
        action ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-th-accent", children: action }) : null
      ]
    }
  );
}
function MediaChipImage({ src }) {
  const url = safeUrl(src);
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = failedUrl !== null && failedUrl === url;
  if (!url || failed) return null;
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: url,
      alt: "",
      loading: "lazy",
      decoding: "async",
      referrerPolicy: "no-referrer",
      draggable: false,
      onError: () => setFailedUrl(url),
      className: "size-full object-cover"
    }
  );
}
export {
  MediaChip,
  MediaRow,
  MediaThumb
};
