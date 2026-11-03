/* Pure helpers of the overlay components: class strings and focus/pointer helpers. No directive
 * and no React runtime import, so a server component can import them. overlay.tsx re-exports
 * them, so existing import paths keep working. */
import { cn } from '../cn';

/** Base classes of one menu row (MenuItem, MenuSubHeader, menuItemClass). */
export const MENU_ROW =
  'flex w-full select-none items-center gap-2 px-3 py-1.5 text-start text-xs outline-none transition-colors pointer-coarse:min-h-11 pointer-coarse:gap-3 pointer-coarse:text-sm forced-colors:focus:outline-solid forced-colors:focus:outline-2 forced-colors:focus:-outline-offset-2';

export interface MenuItemClassOptions {
  /** The current choice: the highlighted look (set aria-current on the row too). */
  active?: boolean;
  /** A destructive action: loss-colored text and hover. */
  danger?: boolean;
  /** The disabled look (set disabled or aria-disabled on the row too). */
  disabled?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<MenuItem>` renders, for menu-looking rows that are not in a
 *  DropdownMenu: tabbable buttons in a Popover panel that also holds IconButtons,
 *  inputs or color pickers. The rows keep their own roles (plain buttons, Tab order);
 *  hover and keyboard focus get the same highlight as MenuItem. */
export function menuItemClass({ active = false, danger = false, disabled = false, className }: MenuItemClassOptions = {}): string {
  return cn(
    MENU_ROW,
    disabled
      ? 'cursor-default text-th-ghost forced-colors:text-[GrayText]'
      : danger
        ? 'text-th-loss hover:bg-th-loss-soft focus-visible:bg-th-loss-soft'
        : 'text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus-visible:bg-th-overlay focus-visible:text-th-hi',
    active && !disabled && !danger && 'bg-th-overlay font-medium text-th-hi forced-colors:underline',
    className,
  );
}

/** True when focus on `el` came from the keyboard (`:focus-visible`), false when a
 *  pointer put it there. A focus event on an element that is not actually focused
 *  (a synthetic event in a test) counts as keyboard. Internal to the package. */
export function keyboardFocused(el: Element): boolean {
  if (typeof document !== 'undefined' && document.activeElement !== el) return true;
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** Phones fire mouseenter after a tap, which would pin a hover tip open with no
 *  mouseleave ever coming. Feed pointerenter/pointerdown to `onPointer`; `recent()`
 *  says whether the last pointer was a finger. Internal to the package. */
export function touchTracker(): {
  onPointer: (e: { pointerType: string }) => void;
  recent: () => boolean;
} {
  let touch = false;
  return {
    onPointer: (e) => {
      touch = e.pointerType === 'touch';
    },
    recent: () => touch,
  };
}

export const SHEET_EXIT_MS = 200;
export const PHONE_QUERY = '(max-width: 639px)';

/** The close button of a Modal title row. */
export const CLOSE_BUTTON =
  '-me-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:min-w-11';

export const SHEET_HEIGHT_CLASS = {
  auto: 'max-h-[92dvh]',
  tall: 'max-h-[92dvh] max-sm:h-[92dvh]',
  full: 'max-h-dvh max-sm:h-dvh max-sm:rounded-t-none max-sm:pt-[env(safe-area-inset-top)]',
} as const;

export const MODAL_SIZE = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-3xl',
  '2xl': 'sm:max-w-6xl',
  full: 'sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]',
} as const;

export const DRAWER_WIDTH = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
} as const;
export const DRAWER_SHEET_HEIGHT = {
  sm: 'max-h-[50dvh]',
  md: 'max-h-[70dvh]',
  lg: 'max-h-[92dvh]',
} as const;
