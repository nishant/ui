// src/combobox-filter.ts
var COMBOBOX_MAX_SHOWN = 50;
var COMBOBOX_DEBOUNCE_MS = 200;
var defaultComboboxFilter = (o, q) => matchesComboboxNeedle(o.label.toLowerCase(), o.hint?.toLowerCase(), q.trim().toLowerCase());
function matchesComboboxNeedle(labelLower, hintLower, needle) {
  if (!needle) return true;
  return labelLower.includes(needle) || (hintLower?.includes(needle) ?? false);
}
export {
  COMBOBOX_DEBOUNCE_MS,
  COMBOBOX_MAX_SHOWN,
  defaultComboboxFilter,
  matchesComboboxNeedle
};
