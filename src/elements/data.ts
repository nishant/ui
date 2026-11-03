// nish-ui/elements/data: the wave 3 custom elements except charts, for pages without React.
// Importing this file registers <nish-table-sort>, <nish-filter-bar>, <nish-split>, <nish-nav-rail>,
// <nish-scroll-row>, <nish-section-nav> and <nish-command-palette> (a tag that is already defined
// is skipped). Self-contained: it needs no other element file.
import { NishCommandPalette } from './command-palette';
import { NishFilterBar } from './filter-bar';
import { NishNavRail } from './nav-rail';
import { NishScrollRow } from './scroll-row';
import { NishSectionNav } from './section-nav';
import { NishSplit } from './split';
import { NishTableSort } from './table-sort';

export { NishElement, define } from './base';
export { configureStrings } from './strings';
export type { NishElementStrings } from './strings';
export {
  NishCommandPalette,
  NishFilterBar,
  NishNavRail,
  NishScrollRow,
  NishSectionNav,
  NishSplit,
  NishTableSort,
};
export type { NishCommandItem, NishCommandSelectDetail } from './command-palette';
export type { NishResizeDetail } from './split';

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
