// The published types of nish-ui/elements (copied to dist/elements.d.ts by tsup.config.ts).
// Hand-written so the package never imports 'lit' (a devDependency) and every element stays an
// HTMLElement for consumers. Keep it in step with the classes in this folder.

/** Base of every nish-ui element (light DOM). */
export declare class NishElement extends HTMLElement {
  readonly updateComplete: Promise<boolean>;
  requestUpdate(): void;
}

/** Register a custom element unless the tag is already defined. */
export declare function define(tag: string, ctor: CustomElementConstructor): void;

export declare class NishThemeToggle extends NishElement {
  labelled: boolean;
  pill: boolean;
  labelSystem: string | undefined;
  labelLight: string | undefined;
  labelDark: string | undefined;
}

export declare class NishSheet extends NishElement {
  open: boolean;
  label: string | null;
  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null;
  show(): void;
  close(): void;
}

export declare class NishDialog extends NishElement {
  open: boolean;
  label: string | null;
  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null;
  show(): void;
  close(value?: string): void;
}

export declare class NishBottomNav extends NishElement {
  label: string;
  lg: boolean;
}

export type ToastTone = 'neutral' | 'ok' | 'warn' | 'loss' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before it hides itself, or 'sticky'. Default 6000. */
  duration?: number | 'sticky';
  action?: { label: string; href?: string; onClick?: () => void };
  dismissLabel?: string;
}

/** Show a toast. Returns a function that hides it now. Needs nish-components.css. */
export declare function toast(content: string | Node, opts?: ToastOptions): () => void;

declare global {
  interface HTMLElementTagNameMap {
    'nish-theme-toggle': NishThemeToggle;
    'nish-sheet': NishSheet;
    'nish-dialog': NishDialog;
    'nish-bottom-nav': NishBottomNav;
  }
}
