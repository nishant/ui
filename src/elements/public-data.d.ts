// The published types of nish-ui/elements/data (copied to dist/elements-data.d.ts by
// tsup.config.ts). Hand-written so the package never imports 'lit' (a devDependency) and every
// element stays an HTMLElement for consumers. Keep it in step with the classes in this folder.

/** Base of every nish-ui element (light DOM). */
export declare class NishElement extends HTMLElement {
  readonly updateComplete: Promise<boolean>;
  requestUpdate(): void;
}

/** Register a custom element unless the tag is already defined. */
export declare function define(tag: string, ctor: CustomElementConstructor): void;

export interface NishResizeDetail {
  /** Each pane's share in percent, summing to 100. */
  sizes: number[];
}

export interface NishCommandItem {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string[];
  href?: string;
}

export interface NishCommandSelectDetail {
  id: string;
}

export declare class NishTableSort extends NishElement {
  /** Only fire `nish-sort` (the server sorts); the rows are not reordered. */
  manual: boolean;
}

export declare class NishFilterBar extends NishElement {
  activeCount: number;
  sheetTitle: string;
  /** `md` (default) or `lg`: the width below which the filters move into a sheet. */
  sheetBelow: 'md' | 'lg';
  sticky: boolean;
}

export declare class NishSplit extends NishElement {
  /** `row` (default) or `column`. */
  orientation: 'row' | 'column';
  /** Each pane's share in percent; the attribute is a comma list: `50,50`. */
  sizes: number[] | null;
  /** Smallest pane length in pixels. */
  min: number;
  storageKey: string | null;
}

export declare class NishNavRail extends NishElement {
  label: string;
}

export declare class NishScrollRow extends NishElement {
  label: string;
  bleed: boolean;
  snap: boolean;
  /** On by default; `fade="false"` turns the edge fades off. */
  fade: boolean;
}

export declare class NishSectionNav extends NishElement {
  label: string;
  /** On by default; `sticky="false"` turns it off. */
  sticky: boolean;
  /** On by default; `update-hash="false"` leaves the URL alone. */
  updateHash: boolean;
}

export declare class NishCommandPalette extends NishElement {
  open: boolean;
  hotkey: boolean;
  placeholder: string;
  emptyText: string;
  items: NishCommandItem[];
  show(): void;
  close(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'nish-table-sort': NishTableSort;
    'nish-filter-bar': NishFilterBar;
    'nish-split': NishSplit;
    'nish-nav-rail': NishNavRail;
    'nish-scroll-row': NishScrollRow;
    'nish-section-nav': NishSectionNav;
    'nish-command-palette': NishCommandPalette;
  }
}
