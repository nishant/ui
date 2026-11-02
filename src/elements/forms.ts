// nish-ui/elements/forms: the wave 2 custom elements, for pages without React.
// Importing this file registers <nish-field>, <nish-search>, <nish-switch>, <nish-chip-group>,
// <nish-combobox>, <nish-tabs>, <nish-segmented>, <nish-copy-button> and <nish-sparkline>
// (a tag that is already defined is skipped). Self-contained: it needs no other element file.
import { NishChipGroup } from './chip-group';
import { NishCombobox } from './combobox';
import { NishCopyButton } from './copy-button';
import { NishField } from './field';
import { NishSearch } from './search';
import { NishSegmented } from './segmented';
import { NishSparkline } from './sparkline';
import { NishSwitch } from './switch';
import { NishTabs } from './tabs';

export { NishElement, define } from './base';
export {
  NishChipGroup,
  NishCombobox,
  NishCopyButton,
  NishField,
  NishSearch,
  NishSegmented,
  NishSparkline,
  NishSwitch,
  NishTabs,
};
export type { NishComboboxChangeDetail, NishComboboxOption } from './combobox';

declare global {
  interface HTMLElementTagNameMap {
    'nish-field': NishField;
    'nish-search': NishSearch;
    'nish-switch': NishSwitch;
    'nish-chip-group': NishChipGroup;
    'nish-combobox': NishCombobox;
    'nish-tabs': NishTabs;
    'nish-segmented': NishSegmented;
    'nish-copy-button': NishCopyButton;
    'nish-sparkline': NishSparkline;
  }
}
