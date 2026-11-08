'use client';
import { cloneElement, createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactElement, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import { isRtl } from './client';
import { useMediaQuery } from './hooks';
import { useLatest } from './latest';
import { lazyModule, useLazyModule } from './lazy-module';
import { useStrings, useNishContext } from './provider';
import { OVERLAY_STRINGS } from './strings';
import { MENU_ROW, PHONE_QUERY, menuItemClass } from './overlay-classes';
import { layerHost, setRef, useMergedRef } from './overlay-core';
import { useAnchoredPosition, floatingStyle, useDismiss, useReturnFocus, type PopoverCloseReason } from './overlay-position';

// ---------------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------------

interface MenuContextValue {
  close: () => void;
}

/** @internal */
export const MenuContext = /* @__PURE__ */ createContext<MenuContextValue | null>(null);

const drawerModule = /* @__PURE__ */ lazyModule(() => import('./drawer'));

/** @internal */
export const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

/** @internal */
export function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

export interface DropdownMenuProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'onChange'> {
  /** The button that opens the menu (a Button or IconButton). It gets aria-haspopup,
   *  aria-expanded and aria-controls, opens on click, and on ArrowDown / ArrowUp. */
  trigger: ReactElement;
  /** Which edge of the trigger the menu lines up with (mirrored in right-to-left
   *  layouts). Default start. */
  align?: 'start' | 'center' | 'end';
  /** Preferred side; flips when there is no room. Default bottom. */
  side?: 'top' | 'bottom';
  /** MenuItem, MenuLabel, MenuSeparator and MenuSubHeader rows. */
  children: ReactNode;
  /** Controlled open state (optional; the menu manages it otherwise). */
  open?: boolean;
  /** Called whenever the menu opens or closes. When the menu closed itself, the second
   *  argument says why: 'escape', 'outside' or 'tab' (undefined after a selection or a
   *  trigger click). */
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  /** Opens on mount when uncontrolled (previews, tests). */
  defaultOpen?: boolean;
  /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
  'aria-label'?: string;
  /** `'sm'`: under 640px the menu opens as a bottom sheet with 48px rows instead of a
   *  floating panel. Default false (always a floating panel). */
  sheetBelow?: 'sm' | false;
  /** Title of the bottom sheet when `sheetBelow` is set. Default "Menu" (the provider's
   *  `menu` string). */
  sheetTitle?: string;
  /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
  className?: string;
  /** The menu panel (role="menu"). */
  ref?: Ref<HTMLDivElement>;
}

/** True while the viewport is under 640px (live). False on the server and during hydration. */
function usePhoneViewport(enabled: boolean): boolean {
  const phone = useMediaQuery(PHONE_QUERY);
  return enabled && phone;
}

/** Renders `element` with `props` merged over its own. A component rather than a
 *  cloneElement call in the parent's render, so the handlers passed in stay event
 *  handlers (react-hooks/refs treats a function handed to a call in render as run there). */
function Cloned({ element, ...props }: { element: ReactNode } & Record<string, unknown>) {
  return cloneElement(element as ReactElement<Record<string, unknown>>, props);
}

/** A menu of actions behind a button: role="menu" with arrow keys, Home and End,
 *  Escape, Tab to leave, and focus back on the trigger when it closes. */
export function DropdownMenu({
  trigger,
  align = 'start',
  side = 'bottom',
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  'aria-label': ariaLabel,
  sheetBelow = false,
  sheetTitle,
  className,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}: DropdownMenuProps) {
  const strings = useStrings(OVERLAY_STRINGS);
  const config = useNishContext();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  // The trigger node is a ref for the positioning and focus hooks (set before their layout
  // effects run) and state for render, which picks the portal host from it.
  const triggerRef = useRef<HTMLElement | null>(null);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const triggerPropRef = (trigger.props as { ref?: Ref<HTMLElement> }).ref;
  const attachTrigger = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      setTriggerNode(node);
      setRef(triggerPropRef, node);
    },
    [triggerPropRef],
  );
  // The menu renders once the trigger is known, so a menu open on mount portals straight
  // into the trigger's layer instead of moving there (and remounting) a render later.
  const shown = open && triggerNode != null;
  const [menuRef, setMenuRef] = useMergedRef<HTMLDivElement>(ref);
  const menuId = useId();
  const triggerId = useId();
  // Which item takes focus when the menu opens.
  const initial = useRef<'first' | 'last' | 'menu'>('first');
  const wantSheet = usePhoneViewport(sheetBelow === 'sm');
  // The Drawer loads on demand; until it has (or if it fails) the menu is the floating panel.
  const drawer = useLazyModule(drawerModule, wantSheet);
  const asSheet = wantSheet && drawer != null;
  const pos = useAnchoredPosition(triggerRef, menuRef, shown && !asSheet, side, align, 4);

  const onOpenChangeRef = useLatest(onOpenChange);
  const setOpen = useCallback(
    (next: boolean, reason?: PopoverCloseReason) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [onOpenChangeRef, openProp],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const dismiss = useCallback((reason: PopoverCloseReason) => setOpen(false, reason), [setOpen]);
  // As a sheet, the Drawer owns Escape, the scrim and the back gesture.
  useDismiss(shown && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(shown, menuRef, triggerRef);

  // Focus in on open, and again whenever the focused row disappears (a submenu view
  // replaced the rows), so focus is never lost to <body>.
  useEffect(() => {
    if (!shown) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusInitial = () => {
      const items = menuItems(menu);
      const target = initial.current === 'last' ? items[items.length - 1] : initial.current === 'menu' ? menu : items[0];
      (target ?? menu).focus();
    };
    const t = window.setTimeout(focusInitial, 0);
    const mo = new MutationObserver(() => {
      if (!menu.contains(document.activeElement) && (document.activeElement === document.body || !document.activeElement)) {
        initial.current = 'first';
        focusInitial();
      }
    });
    mo.observe(menu, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [shown, asSheet, menuRef]);

  function openWith(where: 'first' | 'last' | 'menu') {
    initial.current = where;
    setOpen(true);
  }

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    userKeyDown?.(e);
    const items = menuItems(menuRef.current);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case 'ArrowDown':
        return go(i + 1);
      case 'ArrowUp':
        return go(i < 0 ? items.length - 1 : i - 1);
      case 'Home':
        return go(0);
      case 'End':
        return go(items.length - 1);
      case 'Tab':
        e.preventDefault();
        dismiss('tab');
        return;
      default:
        // Typeahead: the first key jumps to the next row starting with that letter.
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          const hit = order.find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(k));
          if (hit) {
            e.preventDefault();
            hit.focus();
          }
        }
    }
  }

  const tp = trigger.props as {
    ref?: Ref<HTMLElement>;
    id?: string;
    onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
    onKeyDown?: (e: ReactKeyboardEvent<HTMLElement>) => void;
  };
  const triggerEl = (
    <Cloned
      element={trigger}
      ref={attachTrigger}
      id={tp.id ?? triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={(e: ReactMouseEvent<HTMLElement>) => {
        tp.onClick?.(e);
        if (e.defaultPrevented) return;
        if (open) close();
        // A pointer click focuses the menu itself, so arrow keys start from the top.
        else openWith(e.detail === 0 ? 'first' : 'menu');
      }}
      onKeyDown={(e: ReactKeyboardEvent<HTMLElement>) => {
        tp.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openWith(e.key === 'ArrowDown' ? 'first' : 'last');
        }
      }}
    />
  );

  const menuProps = {
    ...rest,
    ref: setMenuRef,
    id: menuId,
    role: 'menu',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabel ? undefined : (tp.id ?? triggerId),
    'aria-orientation': 'vertical' as const,
    'data-state': 'open',
    tabIndex: -1,
    onKeyDown: onMenuKeyDown,
  };

  return (
    <>
      {triggerEl}
      {open && asSheet ? (
        <MenuContext.Provider value={{ close }}>
          <drawer.Drawer side="bottom" size="md" title={sheetTitle ?? strings.menu} onClose={close}>
            <div
              {...menuProps}
              style={style}
              className={cn(
                '-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm',
                className,
              )}
            >
              {children}
            </div>
          </drawer.Drawer>
        </MenuContext.Provider>
      ) : shown ? (
        createPortal(
          <MenuContext.Provider value={{ close }}>
            <div
              {...menuProps}
              data-side={pos?.side}
              style={floatingStyle(pos, {
                ...style,
                maxHeight: pos ? Math.min(pos.maxHeight, 384) : undefined,
                zIndex: 'var(--nish-z-dropdown, 40)',
              })}
              className={cn(
                'max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain',
                'rounded-lg border border-th-line bg-th-elevated py-1 shadow-pop outline-none animate-[nish-fade-in_120ms_ease-out]',
                className,
              )}
            >
              {children}
            </div>
          </MenuContext.Provider>,
          layerHost(triggerNode, config.portalContainer),
        )
      ) : null}
    </>
  );
}

export interface MenuItemProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onSelect' | 'children' | 'className' | 'type' | 'role'> {
  /** Leading icon (14px reads best). */
  icon?: ReactNode;
  /** Right-aligned extra: a shortcut (Kbd), a count or a chevron. */
  trailing?: ReactNode;
  /** A destructive action: loss-colored text and hover. */
  danger?: boolean;
  /** Marks the current choice (the selected sort, the open board) with the
   *  highlighted look. */
  active?: boolean;
  /** Shown but not selectable; arrow keys skip it. */
  disabled?: boolean;
  /** Runs on click, Enter and Space, then the menu closes. Call
   *  `event.preventDefault()` to keep it open (e.g. to switch to a submenu view). */
  onSelect?: (event: Event) => void;
  /** Classes for the row. */
  className?: string;
  children: ReactNode;
  /** The row's button. */
  ref?: Ref<HTMLButtonElement>;
}

/** One action in a DropdownMenu. */
export function MenuItem({
  icon,
  trailing,
  danger = false,
  active = false,
  disabled = false,
  onSelect,
  className,
  children,
  ref,
  onClick,
  onMouseMove,
  ...rest
}: MenuItemProps) {
  const ctx = useContext(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event('nish-menu-select', { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      aria-current={active || undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) select();
      }}
      onMouseMove={(e) => {
        onMouseMove?.(e);
        // Hover moves the keyboard position too, as in native menus.
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      }}
      // In a menu, focus follows the pointer and the arrow keys, so plain :focus (not
      // only :focus-visible) shows the highlight.
      className={menuItemClass({
        active,
        danger,
        disabled,
        className: cn(!disabled && (danger ? 'focus:bg-th-loss-soft' : 'focus:bg-th-overlay focus:text-th-hi'), className),
      })}
    >
      {icon ? <span className={cn('inline-flex shrink-0', danger || disabled ? '' : 'text-th-hi3')}>{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className={cn('ms-auto inline-flex shrink-0 items-center', disabled ? '' : 'text-th-hi2')}>{trailing}</span> : null}
    </button>
  );
}

/** A small heading over a group of MenuItems. Not focusable. */
export function MenuLabel({
  children,
  className,
  ref,
  ...rest
}: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role'> & {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...rest}
      ref={ref}
      role="presentation"
      className={cn('px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2', className)}
    >
      {children}
    </div>
  );
}

/** A thin line between groups of MenuItems. */
export function MenuSeparator({
  className,
  ref,
  ...rest
}: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role' | 'children'> & {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return <div {...rest} ref={ref} role="separator" className={cn('my-1 h-px bg-th-line forced-colors:bg-[CanvasText]', className)} />;
}

export interface MenuSubHeaderProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'className' | 'type' | 'role'> {
  /** Goes back to the parent view (also on ArrowLeft, ArrowRight in right-to-left
   *  layouts). The menu stays open. */
  onBack: () => void;
  /** The submenu's title. */
  children: ReactNode;
  className?: string;
  /** The header's button. */
  ref?: Ref<HTMLButtonElement>;
}

/** The first row of a submenu view shown in place: a back arrow and the view's title. */
export function MenuSubHeader({ onBack, children, className, ref, onKeyDown, ...rest }: MenuSubHeaderProps) {
  const strings = useStrings(OVERLAY_STRINGS);
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onBack}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === (isRtl(e.currentTarget) ? 'ArrowRight' : 'ArrowLeft')) {
          e.preventDefault();
          onBack();
        }
      }}
      className={cn(MENU_ROW, 'mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay', className)}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-th-hi3 rtl:-scale-x-100"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="sr-only">{strings.back}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
