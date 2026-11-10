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
export const defaultComboboxFilter = (o: ComboboxFilterOption, q: string): boolean =>
  matchesComboboxNeedle(o.label.toLowerCase(), o.hint?.toLowerCase(), q.trim().toLowerCase());

/** The one substring rule: `needle` (already trimmed and lower-cased) against a lower-cased label and hint. */
export function matchesComboboxNeedle(labelLower: string, hintLower: string | undefined, needle: string): boolean {
  if (!needle) return true;
  return labelLower.includes(needle) || (hintLower?.includes(needle) ?? false);
}
