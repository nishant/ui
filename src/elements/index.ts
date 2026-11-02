// nish-ui/elements: the wave 1 custom elements and toast(), for pages without React.
// Importing this file registers <nish-theme-toggle>, <nish-sheet>, <nish-dialog> and
// <nish-bottom-nav> (a tag that is already defined is skipped).
import { NishBottomNav } from './bottom-nav';
import { NishDialog } from './dialog';
import { NishSheet } from './sheet';
import { NishThemeToggle } from './theme-toggle';

export { NishElement, define } from './base';
export { NishBottomNav, NishDialog, NishSheet, NishThemeToggle };
export { toast } from './toast';
export type { ToastOptions, ToastTone } from './toast';

declare global {
  interface HTMLElementTagNameMap {
    'nish-theme-toggle': NishThemeToggle;
    'nish-sheet': NishSheet;
    'nish-dialog': NishDialog;
    'nish-bottom-nav': NishBottomNav;
  }
}
