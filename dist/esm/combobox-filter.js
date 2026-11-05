// src/combobox-filter.ts
var COMBOBOX_MAX_SHOWN = 50;
var COMBOBOX_DEBOUNCE_MS = 200;
var defaultComboboxFilter = (o, q) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return o.label.toLowerCase().includes(needle) || (o.hint?.toLowerCase().includes(needle) ?? false);
};
export {
  COMBOBOX_DEBOUNCE_MS,
  COMBOBOX_MAX_SHOWN,
  defaultComboboxFilter
};
