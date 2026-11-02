// Pure helpers shared by the React Combobox and the <nish-combobox> element.

export interface ComboboxFilterOption {
  label: string;
  hint?: string;
}

/** Most options shown at once. */
export const COMBOBOX_MAX_SHOWN = 50;
/** Delay before a typed query is reported to the page. */
export const COMBOBOX_DEBOUNCE_MS = 200;

/** Case-insensitive substring match on label and hint; an empty query matches everything. */
export const defaultComboboxFilter = (o: ComboboxFilterOption, q: string): boolean => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return o.label.toLowerCase().includes(needle) || (o.hint?.toLowerCase().includes(needle) ?? false);
};
