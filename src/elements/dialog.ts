import type { PropertyValues } from 'lit';
import { NishElement, define } from './base';

let seq = 0;

/** `<nish-dialog>`: a modal dialog. Its children move into a `<dialog class="nish-dialog">` on
 *  first connect. `open` (or `.show()`) calls `showModal()`. Escape, a backdrop click and any
 *  `[data-dialog-close]` inside close it, and focus returns to the opener.
 *  `[data-dialog-open="<id>"]` anywhere on the page opens the dialog with that `id`. Fires
 *  `nish-close` with `detail: { value }`, the `value` attribute of the button that closed it,
 *  or `''`. */
export class NishDialog extends NishElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
  };

  declare open: boolean;
  declare label: string | null;

  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null = null;
  private opener: HTMLElement | null = null;
  private value = '';
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
    // A removed modal never fires `close` by itself: close it so state and focus clean up.
    // Clear `open` too, so a reconnect (a DOM move) does not reopen it and one close fires one event.
    if (this.dialog?.open) {
      this.value = '';
      this.open = false;
      this.dialog.close();
    }
  }

  show(): void {
    this.open = true;
  }

  close(value = ''): void {
    if (this.dialog?.open) this.value = value;
    this.open = false;
  }

  private onTrigger = (e: MouseEvent): void => {
    if (!this.id || !(e.target instanceof Element)) return;
    const t = e.target.closest('[data-dialog-open]');
    if (t && t.getAttribute('data-dialog-open') === this.id) this.show();
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
    dialog.className = 'nish-dialog';
    dialog.append(...Array.from(this.childNodes));
    this.append(dialog);
    dialog.addEventListener('click', this.onDialogClick);
    dialog.addEventListener('keydown', this.onKey);
    dialog.addEventListener('cancel', this.onCancel);
    dialog.addEventListener('close', this.onDialogClose);
    this.dialog = dialog;
    this.syncLabel();
    this.syncOpen();
  }

  private syncLabel(): void {
    const dialog = this.dialog;
    if (!dialog) return;
    const title = dialog.querySelector<HTMLElement>('.nish-dialog-title');
    const body = dialog.querySelector<HTMLElement>('.nish-dialog-body');
    if (title) {
      if (!title.id) title.id = `nish-dialog-title-${++seq}`;
      dialog.setAttribute('aria-labelledby', title.id);
      dialog.removeAttribute('aria-label');
    } else {
      dialog.removeAttribute('aria-labelledby');
      if (this.label) dialog.setAttribute('aria-label', this.label);
      else dialog.removeAttribute('aria-label');
    }
    if (body) {
      if (!body.id) body.id = `nish-dialog-body-${++seq}`;
      dialog.setAttribute('aria-describedby', body.id);
    } else {
      dialog.removeAttribute('aria-describedby');
    }
  }

  private syncOpen(): void {
    const dialog = this.dialog;
    if (!dialog || !this.isConnected) return;
    if (this.open && !dialog.open) {
      this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.returnValue = '';
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  private onDialogClick = (e: MouseEvent): void => {
    const dialog = this.dialog;
    if (!dialog) return;
    if (e.target === dialog) {
      // A press on the backdrop targets the dialog itself, outside its box.
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) this.close();
      return;
    }
    if (e.target instanceof Element) {
      const btn = e.target.closest('[data-dialog-close]');
      if (btn && btn.closest('dialog') === dialog) this.close(btn.getAttribute('value') ?? '');
    }
  };

  private onKey = (e: KeyboardEvent): void => {
    // Keep Escape from an outer framework dialog; the cancel event does the closing.
    if (e.key === 'Escape') e.stopPropagation();
  };

  private onCancel = (e: Event): void => {
    e.preventDefault();
    this.close();
  };

  private onDialogClose = (): void => {
    // A `<form method="dialog">` submit button closes with the native return value.
    const value = this.value || this.dialog?.returnValue || '';
    this.value = '';
    if (this.open) this.open = false;
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) opener.focus();
    this.dispatchEvent(new CustomEvent('nish-close', { bubbles: true, detail: { value } }));
  };

  protected override updated(changed: PropertyValues): void {
    if (changed.has('label')) this.syncLabel();
    if (changed.has('open')) this.syncOpen();
  }
}

define('nish-dialog', NishDialog);
