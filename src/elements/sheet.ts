import type { PropertyValues } from 'lit';
import { openSheet } from '../theme';
import { NishElement, define } from './base';

let seq = 0;

/** `<nish-sheet>`: a modal bottom sheet (a centered panel from 640px). Its children move into a
 *  `<dialog class="nish-sheet">` on first connect. `open` (or `.show()`) opens it through
 *  `openSheet`; `.close()` or removing `open` closes it; `[data-sheet-open="<id>"]` anywhere on
 *  the page opens the sheet with that `id`. Fires `nish-close` whenever it closes. */
export class NishSheet extends NishElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
  };

  declare open: boolean;
  declare label: string | null;

  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null = null;
  private closeSheet: (() => void) | null = null;
  private waiting = false;

  constructor() {
    super();
    this.open = false;
    this.label = null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.onTrigger);
    this.wrap();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onTrigger);
    // A removed modal never fires `close` by itself: close it so its listeners and focus clean up.
    // Clear `open` too, so a reconnect (a DOM move) does not reopen it and one close fires one event.
    if (this.dialog?.open) {
      this.open = false;
      this.dialog.close();
    }
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  private onTrigger = (e: MouseEvent): void => {
    if (!this.id || !(e.target instanceof Element)) return;
    const t = e.target.closest('[data-sheet-open]');
    if (t && t.getAttribute('data-sheet-open') === this.id) this.show();
  };

  private wrap(): void {
    if (this.dialog) {
      this.syncLabel();
      this.syncOpen();
      return;
    }
    // Parser-created elements connect before their children are parsed.
    if (document.readyState === 'loading') {
      if (!this.waiting) {
        this.waiting = true;
        document.addEventListener(
          'DOMContentLoaded',
          () => {
            this.waiting = false;
            if (this.isConnected) this.wrap();
          },
          { once: true },
        );
      }
      return;
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'nish-sheet';
    dialog.append(...Array.from(this.childNodes));
    this.append(dialog);
    dialog.addEventListener('close', this.onDialogClose);
    this.dialog = dialog;
    this.syncLabel();
    this.syncOpen();
  }

  private syncLabel(): void {
    const dialog = this.dialog;
    if (!dialog) return;
    const title = dialog.querySelector<HTMLElement>('.nish-sheet-title');
    if (title) {
      if (!title.id) title.id = `nish-sheet-title-${++seq}`;
      dialog.setAttribute('aria-labelledby', title.id);
      dialog.removeAttribute('aria-label');
    } else {
      dialog.removeAttribute('aria-labelledby');
      if (this.label) dialog.setAttribute('aria-label', this.label);
      else dialog.removeAttribute('aria-label');
    }
  }

  private syncOpen(): void {
    const dialog = this.dialog;
    if (!dialog || !this.isConnected) return;
    if (this.open && !dialog.open) {
      this.closeSheet = openSheet(dialog);
    } else if (!this.open && dialog.open) {
      this.closeSheet?.();
    }
  }

  private onDialogClose = (): void => {
    this.closeSheet = null;
    if (this.open) this.open = false;
    this.dispatchEvent(new CustomEvent('nish-close', { bubbles: true }));
  };

  protected override updated(changed: PropertyValues): void {
    if (changed.has('label')) this.syncLabel();
    if (changed.has('open')) this.syncOpen();
  }
}

define('nish-sheet', NishSheet);
