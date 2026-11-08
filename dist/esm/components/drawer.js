"use client";

// src/components/drawer.tsx
import { useEffect, useId, useRef } from "react";
import { cn } from "../cn.js";
import { XIcon } from "./icons.js";
import { IconButton } from "./primitives.js";
import { Portal } from "./portal.js";
import { useStrings } from "./provider.js";
import { OVERLAY_STRINGS } from "./strings.js";
import { DRAWER_SHEET_HEIGHT, DRAWER_WIDTH } from "./overlay-classes.js";
import { warnDev, useMergedRef, useScrollable } from "./overlay-core.js";
import { useDialog, useSheetExit, useSheetSwipe, SheetHandle } from "./overlay-dialog.js";
import { jsx, jsxs } from "react/jsx-runtime";
function Drawer({ open, ...props }) {
  if (open === false) return null;
  return /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(DrawerPanel, { ...props }) });
}
function DrawerPanel({
  title,
  subtitle,
  onClose,
  onOpenChange,
  side = "right",
  size = "md",
  actions,
  footer,
  bottomOffset,
  dismissible = true,
  closeOnBack = true,
  canClose,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  ref,
  ...rest
}) {
  const strings = useStrings(OVERLAY_STRINGS);
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const scrimRef = useRef(null);
  const bodyRef = useRef(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const bottom = side === "bottom";
  const swipe = useSheetSwipe(panelRef, scrimRef, () => bottom && dismissible && !isClosing(), closeNow, allowClose);
  const swipeHeader = bottom && dismissible;
  const hasTitle = title !== void 0 && title !== null;
  const named = hasTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === "string" ? title : ariaLabel;
  useEffect(() => {
    if (!named) warnDev("nish-ui: <Drawer> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.");
  }, [named]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: scrimRef,
      "data-nish-layer": "",
      "data-state": closing ? "closed" : "open",
      className: cn(
        "fixed inset-0 z-[var(--nish-z-modal,50)] bg-th-scrim/50",
        closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]"
      ),
      style: bottom && bottomOffset ? { bottom: bottomOffset } : void 0,
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) requestClose();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ...rest,
          ref: setPanelRef,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": ariaLabelledBy ?? (ariaLabel || !hasTitle ? void 0 : titleId),
          "aria-label": ariaLabel,
          "data-state": closing ? "closed" : "open",
          tabIndex: -1,
          className: cn(
            "absolute flex flex-col border-th-line bg-th-surface shadow-modal outline-none",
            bottom ? cn(
              "inset-x-0 bottom-0 rounded-t-2xl border-t",
              closing ? "animate-[nish-sheet-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)]",
              bottomOffset ? "" : "pb-[env(safe-area-inset-bottom)]",
              DRAWER_SHEET_HEIGHT[size]
            ) : cn(
              "inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
              DRAWER_WIDTH[size],
              side === "right" ? cn(
                "right-0 border-l pr-[env(safe-area-inset-right)]",
                closing ? "translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]"
              ) : cn(
                "left-0 border-r pl-[env(safe-area-inset-left)]",
                closing ? "-translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]"
              )
            ),
            className
          ),
          children: [
            swipeHeader ? /* @__PURE__ */ jsx(SheetHandle, { onClose: requestClose, swipe }) : bottom ? /* @__PURE__ */ jsx("div", { className: "h-3 shrink-0", "aria-hidden": "true" }) : null,
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn("flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3", swipeHeader && "touch-pan-x"),
                ...swipeHeader ? swipe : {},
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 pt-1", children: [
                    hasTitle ? /* @__PURE__ */ jsx("h2", { id: titleId, className: "line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi", children: title }) : null,
                    subtitle ? /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-xs text-th-hi3", children: subtitle }) : null
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "-me-1.5 flex shrink-0 items-center gap-1", children: [
                    actions,
                    /* @__PURE__ */ jsx(IconButton, { label: strings.close, onClick: requestClose, children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                ref: bodyRef,
                tabIndex: scrollable ? 0 : void 0,
                role: scrollable && bodyLabel ? "region" : void 0,
                "aria-label": scrollable ? bodyLabel : void 0,
                className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2",
                children
              }
            ),
            footer ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
          ]
        }
      )
    }
  );
}
export {
  Drawer
};
