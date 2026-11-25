"use client";

// src/components/nav-items.tsx
import { useState } from "react";
import { safeUrl } from "../url.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { navigateFromLayer } from "./navigate.js";
import { warnDev } from "./display-classes.js";
import { useStrings, useNishContext } from "./provider.js";
import { SHELL_STRINGS } from "./strings.js";
import { jsx } from "react/jsx-runtime";
function useEndSide(ref) {
  const dir = useNishContext().dir;
  const [rtl, setRtl] = useState(dir === "rtl");
  useIsoLayoutEffect(() => {
    setRtl(dir ? dir === "rtl" : isRtl(ref.current));
  }, [dir, ref]);
  return rtl ? "left" : "right";
}
function NavBadge({ value }) {
  const strings = useStrings(SHELL_STRINGS);
  if (value === void 0 || value === false || value === 0) return null;
  if (value === true) {
    return /* @__PURE__ */ jsx(
      "span",
      {
        "aria-hidden": "true",
        className: "absolute -end-0.5 -top-0.5 size-2 rounded-full bg-th-loss ring-2 ring-th-surface forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]"
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "span",
    {
      "aria-label": strings.newCount(value),
      className: "absolute -end-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-th-loss px-1 text-3xs font-semibold leading-none tabular-nums text-th-on-loss ring-2 ring-th-surface forced-colors:border forced-colors:border-[CanvasText]",
      children: value > 99 ? "99+" : value
    }
  );
}
var layerOf = () => history.state?.nishLayer;
function closeAfterRouterLink(onAfter) {
  const layer = layerOf();
  if (typeof window === "undefined" || !layer) {
    onAfter();
    return;
  }
  let decided = false;
  const decide = (routerTookIt) => {
    if (decided) return;
    decided = true;
    window.removeEventListener("click", onWindowClick);
    if (!routerTookIt) {
      onAfter();
      return;
    }
    const t0 = Date.now();
    const wait = () => {
      if (layerOf() !== layer || Date.now() - t0 > 3e3) onAfter();
      else window.setTimeout(wait, 16);
    };
    wait();
  };
  const onWindowClick = (e) => decide(e.defaultPrevented);
  window.addEventListener("click", onWindowClick);
  window.setTimeout(() => decide(true), 0);
}
function renderItem(item, className, children, renderLink, onAfter) {
  const current = item.active ? "page" : void 0;
  const state = item.active ? "active" : "inactive";
  if (item.href != null) {
    const href = safeUrl(item.href);
    if (href === null) return null;
    if (renderLink) {
      return renderLink(item, {
        className,
        children,
        "aria-current": current,
        "data-state": state,
        ...onAfter ? { replace: true } : {},
        onClick: () => {
          item.onSelect?.();
          if (onAfter) closeAfterRouterLink(onAfter);
        }
      });
    }
    return /* @__PURE__ */ jsx(
      "a",
      {
        href,
        className,
        "aria-current": current,
        "data-state": state,
        onClick: (e) => {
          item.onSelect?.();
          const inLayer = !!history.state?.nishLayer;
          const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
          if (onAfter && inLayer && plain) {
            e.preventDefault();
            onAfter();
            navigateFromLayer(href);
            return;
          }
          onAfter?.();
        },
        children
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className,
      "aria-current": current,
      "data-state": state,
      onClick: () => {
        item.onSelect?.();
        onAfter?.();
      },
      children
    }
  );
}
var FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent";
function visibleNavItems(items) {
  return items.filter((item) => {
    if (item.href == null || safeUrl(item.href) !== null) return true;
    warnDev(`nish-ui: nav item "${item.key}" was not rendered because its href is not safe (${item.href.slice(0, 40)}).`);
    return false;
  });
}
export {
  FOCUS,
  NavBadge,
  renderItem,
  useEndSide,
  visibleNavItems
};
