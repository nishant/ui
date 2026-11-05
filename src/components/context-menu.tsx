"use client";
import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../cn";
import { isRtl, useIsoLayoutEffect } from "./client";
import { mergeRefs } from "./data-classes";
import { DropdownMenu, type PopoverCloseReason } from "./overlay";
import { useNishStrings } from "./provider";

export interface ContextMenuProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "className"
> {
  /** The area that opens the menu: right-click, a long press on touch screens, or Shift+F10 or the Menu key while focus is inside. */
  children: ReactNode;
  /** The menu rows (MenuItem, MenuLabel, MenuSeparator), or a function of the element that was pressed,
   *  for one menu over many rows (read the row from target.closest('[data-id]')). Returning null keeps the menu closed. */
  menu: ReactNode | ((target: Element) => ReactNode);
  /** Controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Called when the menu opens or closes. When it closed itself the reason is 'escape', 'outside' or 'tab'. */
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  /** Turns the custom menu off, so the browser's own menu shows. */
  disabled?: boolean;
  /** Accessible name of the menu. Default "Actions" (the provider's contextMenu string). */
  menuLabel?: string;
  /** 'sm' (default): under 640px the menu opens as a bottom sheet with 48px rows. false: always a floating menu. */
  sheetBelow?: "sm" | false;
  /** Title of the bottom sheet. Default "Menu" (the provider's menu string). */
  sheetTitle?: string;
  /** Milliseconds a finger rests before the menu opens. Default 500. */
  longPressMs?: number;
  /** Classes for the menu panel. */
  menuClassName?: string;
  /** Classes for the area. */
  className?: string;
  /** The area element. */
  ref?: Ref<HTMLDivElement>;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const NATIVE_MENU_TARGETS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const MOVE_CANCELS_PRESS = 10;
const SWALLOW_CLICK_MS = 800;
const SWALLOW_NATIVE_MENU_MS = 1000;

interface Point {
  x: number;
  y: number;
}

/** A menu of actions for an area, opened by right-click, a touch long press, or Shift+F10 / the Menu key. */
export function ContextMenu({
  children,
  menu,
  open: openProp,
  onOpenChange,
  disabled,
  menuLabel,
  sheetBelow = "sm",
  sheetTitle,
  longPressMs = 500,
  menuClassName,
  className,
  ref,
  onContextMenu,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...rest
}: ContextMenuProps) {
  const t = useNishStrings();
  const [openState, setOpenState] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  const [target, setTarget] = useState<Element | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const lastOpen = useRef(0);
  const suppressClickUntil = useRef(0);
  const pressTimer = useRef<number | undefined>(undefined);
  const pressStart = useRef<Point | null>(null);
  const wasOpen = useRef(false);

  const open = openProp ?? openState;

  const setOpen = (next: boolean, reason?: PopoverCloseReason) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next, reason);
  };

  const cancelPress = () => {
    window.clearTimeout(pressTimer.current);
    pressTimer.current = undefined;
    pressStart.current = null;
  };

  // Only events from the area's own DOM count: the menu is portaled but still bubbles through React.
  const inside = (e: { currentTarget: Element; target: EventTarget }) =>
    e.currentTarget.contains(e.target as Node);

  const openAt = (
    x: number,
    y: number,
    el: Element,
    swallowNative: boolean,
  ): boolean => {
    if (disabled) return false;
    const content = typeof menu === "function" ? menu(el) : menu;
    if (content == null || content === false) return false;
    const root = rootRef.current;
    const active = document.activeElement;
    const focusable =
      active && root?.contains(active) ? active : el.closest(FOCUSABLE);
    returnTo.current = (
      focusable && root?.contains(focusable) ? focusable : null
    ) as HTMLElement | null;
    setPoint({ x, y });
    setTarget(el);
    if (swallowNative) lastOpen.current = Date.now();
    setOpen(true);
    return true;
  };

  const handleContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    onContextMenu?.(e);
    if (disabled || e.defaultPrevented || !inside(e)) return;
    const el = e.target as Element;
    if (e.shiftKey || el.closest(NATIVE_MENU_TARGETS)) return;
    e.preventDefault();
    if (Date.now() - lastOpen.current < SWALLOW_NATIVE_MENU_MS) return;
    openAt(e.clientX, e.clientY, el, false);
  };

  const handleKeyDown: NonNullable<ContextMenuProps["onKeyDown"]> = (e) => {
    onKeyDown?.(e);
    if (disabled || e.defaultPrevented || !inside(e)) return;
    if (!((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu")) return;
    e.preventDefault();
    const root = e.currentTarget;
    const from = document.activeElement ?? root;
    const r = from.getBoundingClientRect();
    openAt(isRtl(root) ? r.right : r.left, r.bottom, from, true);
  };

  const handlePointerDown: NonNullable<ContextMenuProps["onPointerDown"]> = (
    e,
  ) => {
    onPointerDown?.(e);
    if (disabled || !inside(e) || e.pointerType === "mouse" || e.button !== 0)
      return;
    cancelPress();
    const start = { x: e.clientX, y: e.clientY };
    const el = e.target as Element;
    pressStart.current = start;
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = undefined;
      pressStart.current = null;
      // Only a long press that opened the menu swallows the click that follows.
      if (openAt(start.x, start.y, el, true))
        suppressClickUntil.current = Date.now() + SWALLOW_CLICK_MS;
    }, longPressMs);
  };

  const handlePointerMove: NonNullable<ContextMenuProps["onPointerMove"]> = (
    e,
  ) => {
    onPointerMove?.(e);
    const start = pressStart.current;
    if (
      start &&
      Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_CANCELS_PRESS
    )
      cancelPress();
  };

  const handlePointerUp: NonNullable<ContextMenuProps["onPointerUp"]> = (e) => {
    onPointerUp?.(e);
    cancelPress();
  };

  const handlePointerCancel: NonNullable<
    ContextMenuProps["onPointerCancel"]
  > = (e) => {
    onPointerCancel?.(e);
    cancelPress();
  };

  const handleClickCapture: NonNullable<ContextMenuProps["onClickCapture"]> = (
    e,
  ) => {
    onClickCapture?.(e);
    if (Date.now() < suppressClickUntil.current && inside(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useIsoLayoutEffect(() => () => window.clearTimeout(pressTimer.current), []);

  // Opened from code before any press: sit at the area's start-top corner, 8px in.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || point !== null || !root) return;
    const r = root.getBoundingClientRect();
    setPoint({ x: isRtl(root) ? r.right - 8 : r.left + 8, y: r.top + 8 });
  }, [open, point]);

  // Closed: forget the spot, and put focus back on the row that had it (the anchor span cannot take focus).
  useIsoLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    setPoint(null);
    setTarget(null);
    const active = document.activeElement;
    if (
      !active ||
      active === document.body ||
      active.hasAttribute("data-nish-context-anchor")
    )
      returnTo.current?.focus({ preventScroll: true });
  }, [open]);

  const content =
    typeof menu === "function" ? (target ? menu(target) : null) : menu;
  const shown = open && content != null && content !== false;

  return (
    <div
      {...rest}
      ref={mergeRefs(ref, rootRef)}
      data-state={open ? "open" : "closed"}
      className={cn("[-webkit-touch-callout:none]", className)}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
    >
      {children}
      <DropdownMenu
        // Keyed by the spot so each open measures a fresh anchor already at that point
        // (the anchor moves without any ResizeObserver event, e.g. with reduced motion).
        key={point ? `${point.x},${point.y}` : "none"}
        trigger={
          <span
            aria-hidden="true"
            data-nish-context-anchor=""
            style={{
              position: "fixed",
              left: point?.x ?? 0,
              top: point?.y ?? 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
          />
        }
        open={shown && point !== null}
        onOpenChange={(next, reason) => setOpen(next, reason)}
        aria-label={menuLabel ?? t.contextMenu}
        sheetBelow={sheetBelow}
        sheetTitle={sheetTitle}
        className={menuClassName}
        side="bottom"
        align="start"
      >
        {content}
      </DropdownMenu>
    </div>
  );
}
