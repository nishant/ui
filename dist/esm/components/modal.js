"use client";

// src/components/modal.tsx
import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "../cn.js";
import { XIcon } from "./icons.js";
import { Button } from "./primitives.js";
import { useLatest } from "./latest.js";
import { Portal } from "./portal.js";
import { useNishStrings } from "./provider.js";
import { CLOSE_BUTTON, MODAL_SIZE, SHEET_HEIGHT_CLASS } from "./overlay-classes.js";
import { isPhoneViewport, closeVetoes, warnDev, useMergedRef, useScrollable } from "./overlay-core.js";
import { useDialog, useSheetExit, useSheetSwipe, SheetHandle } from "./overlay-dialog.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Modal({ open, ...props }) {
  if (open === false) return null;
  return /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(ModalPanel, { ...props }) });
}
function ModalPanel({
  title,
  onClose,
  onOpenChange,
  children,
  size = "md",
  footer,
  subtitle,
  placement = "center",
  header,
  hideClose = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  sheetHeight = "auto",
  dismissible = true,
  closeOnBack = true,
  canClose,
  className,
  role,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const scrimRef = useRef(null);
  const bodyRef = useRef(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const swipe = useSheetSwipe(panelRef, scrimRef, () => dismissible && !isClosing() && isPhoneViewport(), closeNow, allowClose);
  const showTitle = header === void 0 && title !== void 0 && title !== null;
  const named = showTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === "string" ? title : ariaLabel;
  useEffect(() => {
    if (!named) warnDev("nish-ui: <Modal> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.");
  }, [named]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: scrimRef,
      "data-nish-layer": "",
      "data-state": closing ? "closed" : "open",
      className: cn(
        "fixed inset-0 z-[var(--nish-z-modal,50)] flex items-end justify-center bg-th-scrim/60 sm:p-4",
        closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]",
        placement === "top" ? "sm:items-start sm:pt-[12vh]" : "sm:items-center"
      ),
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) requestClose();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ...rest,
          ref: setPanelRef,
          role: role ?? "dialog",
          "aria-modal": "true",
          "aria-labelledby": ariaLabelledBy ?? (showTitle && !ariaLabel ? titleId : void 0),
          "aria-label": ariaLabel,
          "data-state": closing ? "closed" : "open",
          tabIndex: -1,
          className: cn(
            "flex w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none",
            "rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            closing ? "max-sm:animate-[nish-sheet-out_200ms_ease-in_forwards] sm:animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)] sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]",
            "sm:max-h-[85dvh] sm:rounded-2xl sm:pb-0",
            placement === "top" && "sm:max-h-[76dvh]",
            SHEET_HEIGHT_CLASS[sheetHeight],
            MODAL_SIZE[size],
            className
          ),
          children: [
            dismissible ? /* @__PURE__ */ jsx(SheetHandle, { onClose: requestClose, swipe, className: "sm:hidden" }) : null,
            header !== void 0 ? /* @__PURE__ */ jsx("div", { className: cn("shrink-0", dismissible && "max-sm:touch-pan-x"), ...dismissible ? swipe : {}, children: header }) : /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn("flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4", dismissible && "max-sm:touch-pan-x"),
                ...dismissible ? swipe : {},
                children: [
                  /* @__PURE__ */ jsx("h2", { id: titleId, className: "min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi", children: title }),
                  hideClose ? null : /* @__PURE__ */ jsx("button", { type: "button", onClick: requestClose, "aria-label": strings.close, className: CLOSE_BUTTON, children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
                ]
              }
            ),
            subtitle ? /* @__PURE__ */ jsx("div", { className: "shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2", children: subtitle }) : null,
            /* @__PURE__ */ jsx(
              "div",
              {
                ref: bodyRef,
                tabIndex: scrollable ? 0 : void 0,
                role: scrollable && bodyLabel ? "region" : void 0,
                "aria-label": scrollable ? bodyLabel : void 0,
                className: cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2", header !== void 0 && "pt-3"),
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
function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
  open,
  onOpenChange
}) {
  const strings = useNishStrings();
  const bodyId = useId();
  const pendingRef = useLatest(pending);
  const onOpenChangeRef = useLatest(onOpenChange);
  const onCancelRef = useLatest(onCancel);
  const cancel = useCallback(() => {
    if (pendingRef.current) return;
    onCancelRef.current?.();
    onOpenChangeRef.current?.(false);
  }, [onCancelRef, onOpenChangeRef, pendingRef]);
  useEffect(() => {
    closeVetoes.set(cancel, () => pendingRef.current);
    return () => {
      closeVetoes.delete(cancel);
    };
  }, [cancel, pendingRef]);
  const danger = tone === "danger";
  const hasBody = body !== void 0 && body !== null && body !== false;
  return /* @__PURE__ */ jsx(
    Modal,
    {
      open,
      title,
      onClose: cancel,
      size: "md",
      role: "alertdialog",
      "aria-describedby": hasBody ? bodyId : void 0,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { onClick: cancel, disabled: pending, "data-autofocus": danger ? "" : void 0, children: cancelLabel ?? strings.cancel }),
        /* @__PURE__ */ jsx(Button, { variant: danger ? "danger" : "primary", loading: pending, onClick: onConfirm, "data-autofocus": danger ? void 0 : "", children: confirmLabel })
      ] }),
      children: hasBody ? /* @__PURE__ */ jsx("div", { id: bodyId, children: body }) : null
    }
  );
}
export {
  ConfirmDialog,
  Modal
};
