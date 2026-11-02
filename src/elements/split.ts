import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';

export interface NishResizeDetail {
  /** Each pane's share in percent, summing to 100. */
  sizes: number[];
}

/** Keyboard step in percent of the split's length. */
const KEY_STEP = 5;
const STACK_QUERY = '(max-width: 639.98px) and (pointer: coarse)';

/** Percent shares from a list of numbers: equal when the length is wrong or a value is not a
 *  positive number, else scaled to sum to 100. */
function normalize(sizes: readonly number[] | null | undefined, count: number): number[] {
  const equal = (): number[] => Array.from({ length: count }, () => 100 / count);
  if (count === 0) return [];
  if (!sizes || sizes.length !== count) return equal();
  if (!sizes.every((s) => Number.isFinite(s) && s > 0)) return equal();
  const total = sizes.reduce((a, b) => a + b, 0);
  return sizes.map((s) => (s / total) * 100);
}

const sizesConverter = {
  fromAttribute(value: string | null): number[] | null {
    if (value == null || value.trim() === '') return null;
    const parts = value.split(',').map((p) => Number(p.trim()));
    return parts.every((n) => Number.isFinite(n)) ? parts : null;
  },
  toAttribute(value: number[] | null): string | null {
    return value && value.length ? value.map((n) => Math.round(n * 100) / 100).join(',') : null;
  },
};

interface Drag {
  pointerId: number;
  start: number;
  index: number;
  sizes: number[];
  /** Combined px length of all panes (the share base). */
  total: number;
  restore: [HTMLElement, string][];
}

/** `<nish-split orientation="row|column" sizes="50,50" min="120" storage-key>`: its children
 *  become `.nish-split-pane`s with a `.nish-split-divider` (`role=separator`) between each pair.
 *  Dragging a divider, or ArrowLeft/Right (row) and ArrowUp/Down (column) on it, resizes the
 *  two panes next to it (5% per key press, never below `min` px). Enter or a double-click on a
 *  divider resets all panes to equal shares. `sizes` is each pane's share
 *  in percent and reflects; `nish-resize` fires with `detail: { sizes }`. `storage-key` saves
 *  the sizes in localStorage (a saved list of another length is ignored). Under a coarse
 *  pointer below 640px the panes stack and the dividers hide. Iframes get `pointer-events:
 *  none` while a divider is dragged. A `<nish-split>` inside a pane nests, for 2D layouts. */
export class NishSplit extends NishElement {
  static override properties = {
    orientation: { type: String, reflect: true },
    sizes: { converter: sizesConverter, reflect: true },
    min: { type: Number },
    storageKey: { type: String, attribute: 'storage-key' },
  };

  declare orientation: 'row' | 'column';
  declare sizes: number[] | null;
  declare min: number;
  declare storageKey: string | null;

  #panes: HTMLElement[] = [];
  #dividers: HTMLElement[] = [];
  #mo: MutationObserver | null = null;
  #mq: MediaQueryList | null = null;
  #stacked = false;
  #drag: Drag | null = null;
  #waiting = false;
  #mounted = false;
  #loaded = false;

  constructor() {
    super();
    this.orientation = 'row';
    this.sizes = null;
    this.min = 120;
    this.storageKey = null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof window.matchMedia === 'function') {
      this.#mq = window.matchMedia(STACK_QUERY);
      this.#stacked = this.#mq.matches;
      this.#mq.addEventListener('change', this.#onMedia);
    }
    if (this.#mounted) {
      this.#observe();
      this.#build();
      return;
    }
    if (!this.#waiting) {
      this.#waiting = true;
      whenParsed(() => {
        this.#waiting = false;
        if (!this.isConnected) return;
        this.#mounted = true;
        this.#observe();
        this.#build();
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#mq?.removeEventListener('change', this.#onMedia);
    this.#mq = null;
    this.#mo?.disconnect();
    this.#mo = null;
    this.#endDrag();
  }

  protected override updated(changed: PropertyValues): void {
    if (!this.#mounted) return;
    if (changed.has('orientation') || changed.has('sizes') || changed.has('min')) this.#layout();
  }

  // ---- structure ----------------------------------------------------------------------

  #observe(): void {
    if (typeof MutationObserver === 'undefined') return;
    this.#mo ??= new MutationObserver(() => this.#build());
    this.#mo.observe(this, { childList: true });
  }

  /** Wrap new children in panes, drop panes that were removed, redraw the dividers. */
  #build(): void {
    if (!this.isConnected) return;
    this.#mo?.disconnect();
    const panes: HTMLElement[] = [];
    for (const node of Array.from(this.childNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.classList.contains('nish-split-divider')) {
        node.remove();
        continue;
      }
      if (node.classList.contains('nish-split-pane')) {
        panes.push(node);
        continue;
      }
      const pane = document.createElement('div');
      pane.className = 'nish-split-pane';
      this.insertBefore(pane, node);
      pane.append(node);
      panes.push(pane);
    }
    this.#panes = panes;
    this.#dividers = [];
    for (let i = 0; i < panes.length - 1; i++) {
      const d = document.createElement('div');
      d.className = 'nish-split-divider';
      d.setAttribute('role', 'separator');
      d.tabIndex = 0;
      d.style.touchAction = 'none';
      d.addEventListener('pointerdown', (e) => this.#down(e, i));
      d.addEventListener('pointermove', (e) => this.#move(e));
      d.addEventListener('pointerup', (e) => this.#up(e));
      d.addEventListener('pointercancel', (e) => this.#up(e));
      d.addEventListener('keydown', (e) => this.#key(e, i));
      d.addEventListener('dblclick', () => this.#equalize());
      this.insertBefore(d, panes[i + 1]!);
      this.#dividers.push(d);
    }
    this.#loadSaved();
    this.#layout();
    this.#mo?.observe(this, { childList: true });
  }

  #loadSaved(): void {
    if (this.#loaded || !this.storageKey || this.#panes.length === 0) return;
    this.#loaded = true;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === this.#panes.length &&
        parsed.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)
      ) {
        this.sizes = normalize(parsed as number[], this.#panes.length);
      }
    } catch {
      // Storage can be blocked or hold something else: use the attribute sizes.
    }
  }

  get #current(): number[] {
    return normalize(this.sizes, this.#panes.length);
  }

  /** Bring the inline layout and the separator attributes in step with the state. */
  #layout(): void {
    const row = this.orientation !== 'column';
    const sizes = this.#current;
    this.style.display = 'flex';
    this.style.flexDirection = this.#stacked ? 'column' : row ? 'row' : 'column';
    this.style.minWidth = '0';
    this.style.minHeight = '0';
    this.#panes.forEach((pane, i) => {
      pane.style.minWidth = '0';
      if (this.#stacked) {
        // Stacked panes keep the CSS stack height instead of shrinking to their content.
        pane.style.minHeight = 'var(--nish-split-stack-h, 16rem)';
        pane.style.flex = 'none';
      } else {
        pane.style.minHeight = '0';
        pane.style.flex = `${sizes[i]} 1 0%`;
      }
      // A pane that only holds a nested split lets it fill the pane.
      const only = pane.children.length === 1 ? pane.firstElementChild : null;
      if (only?.localName === 'nish-split') {
        pane.style.display = 'flex';
        (only as HTMLElement).style.flex = '1 1 auto';
      }
    });
    this.#dividers.forEach((d, i) => {
      d.hidden = this.#stacked;
      d.classList.toggle('nish-split-divider--v', row);
      d.classList.toggle('nish-split-divider--h', !row);
      d.setAttribute('aria-orientation', row ? 'vertical' : 'horizontal');
      d.setAttribute('aria-label', row ? 'Resize columns' : 'Resize rows');
      d.setAttribute('aria-valuenow', String(Math.round(sizes[i]!)));
      d.setAttribute('aria-valuemin', '0');
      d.setAttribute('aria-valuemax', '100');
    });
  }

  #onMedia = (e: MediaQueryListEvent): void => {
    this.#stacked = e.matches;
    this.#layout();
  };

  // ---- resizing -----------------------------------------------------------------------

  #lengthOf(pane: HTMLElement): number {
    const r = pane.getBoundingClientRect();
    return this.orientation === 'column' ? r.height : r.width;
  }

  /** Share of the pair at `index` moved by `delta` percent, kept above `minPct` each. */
  #moved(base: number[], index: number, delta: number, minPct: number): number[] {
    const pair = base[index]! + base[index + 1]!;
    const floor = Math.min(minPct, pair / 2);
    const first = Math.min(Math.max(base[index]! + delta, floor), pair - floor);
    const next = base.slice();
    next[index] = first;
    next[index + 1] = pair - first;
    return next;
  }

  #save(next: number[]): void {
    if (!this.storageKey) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      // Quota or blocked storage: the sizes still apply for this page.
    }
  }

  /** Set the sizes (updated() does the one layout) and fire `nish-resize`. Storage is written
   *  by the caller, once per gesture, not per pointermove. */
  #commit(next: number[]): void {
    this.sizes = next;
    this.dispatchEvent(new CustomEvent<NishResizeDetail>('nish-resize', { bubbles: true, detail: { sizes: next } }));
  }

  #down(e: PointerEvent, index: number): void {
    if (e.button !== 0 || this.#stacked) return;
    const d = this.#dividers[index];
    if (!d) return;
    e.preventDefault();
    d.setPointerCapture?.(e.pointerId);
    const restore: [HTMLElement, string][] = [];
    for (const frame of Array.from(this.querySelectorAll<HTMLElement>('iframe'))) {
      restore.push([frame, frame.style.pointerEvents]);
      frame.style.pointerEvents = 'none';
    }
    const total = this.#panes.reduce((n, p) => n + this.#lengthOf(p), 0);
    this.#drag = {
      pointerId: e.pointerId,
      start: this.orientation === 'column' ? e.clientY : e.clientX,
      index,
      sizes: this.#current,
      total,
      restore,
    };
    this.setAttribute('data-dragging', '');
  }

  #move(e: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== e.pointerId || drag.total <= 0) return;
    const pos = this.orientation === 'column' ? e.clientY : e.clientX;
    const delta = ((pos - drag.start) / drag.total) * 100;
    if (delta === 0) return;
    this.#commit(this.#moved(drag.sizes, drag.index, delta, (this.min / drag.total) * 100));
  }

  #up(e: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const d = this.#dividers[drag.index];
    if (d?.hasPointerCapture?.(e.pointerId)) d.releasePointerCapture(e.pointerId);
    this.#endDrag();
  }

  #endDrag(): void {
    const drag = this.#drag;
    if (!drag) return;
    this.#drag = null;
    if (this.sizes) this.#save(this.sizes);
    for (const [frame, prev] of drag.restore) frame.style.pointerEvents = prev;
    this.removeAttribute('data-dragging');
  }

  /** Reset every pane to an equal share (Enter or double-click on a divider). */
  #equalize(): void {
    if (this.#stacked || this.#panes.length < 2) return;
    const next = normalize(null, this.#panes.length);
    this.#commit(next);
    this.#save(next);
  }

  #key(e: KeyboardEvent, index: number): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.#equalize();
      return;
    }
    const row = this.orientation !== 'column';
    const dec = row ? 'ArrowLeft' : 'ArrowUp';
    const inc = row ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== dec && e.key !== inc) return;
    e.preventDefault();
    const total = this.#panes.reduce((n, p) => n + this.#lengthOf(p), 0);
    const minPct = total > 0 ? (this.min / total) * 100 : 0;
    const before = this.#current;
    const next = this.#moved(before, index, e.key === inc ? KEY_STEP : -KEY_STEP, minPct);
    if (next[index] === before[index]) return;
    this.#commit(next);
    this.#save(next);
  }
}

define('nish-split', NishSplit);
