// src/components/split-classes.ts
import { presetsFor } from "../split-layout.js";
function presetOptions(count) {
  return presetsFor(count).map((p) => ({ id: p.id, label: p.label, hint: p.hint, node: p.build() }));
}
export {
  presetOptions
};
