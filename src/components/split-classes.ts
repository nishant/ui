// Pure helpers of split.tsx. No directive and no React, so a server component can call them.
import { presetsFor, type LayoutNode } from '../split-layout';

export interface LayoutPresetOption {
  /** The value passed to `onChange`. */
  id: string;
  /** The visible name under the icon. */
  label: string;
  /** A short explanation, shown in a tooltip and read as part of the accessible name. */
  hint: string;
  /** The layout the icon draws. */
  node: LayoutNode;
}

/** The preset options for a pane count, from `presetsFor`. */
export function presetOptions(count: 1 | 2 | 3 | 4): LayoutPresetOption[] {
  return presetsFor(count).map((p) => ({ id: p.id, label: p.label, hint: p.hint, node: p.build() }));
}
