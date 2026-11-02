type LayoutNode = {
    type: "leaf";
    slot: number;
} | {
    type: "split";
    dir: "row" | "col";
    sizes: number[];
    children: LayoutNode[];
};
/** A narrow-screen layout: one or two panes, split along `dir` ('auto' picks by aspect). */
interface NarrowLayout {
    dir: "auto" | "row" | "col";
    /** Share of the first pane, 0.2 to 0.8. */
    split: number;
}
declare const MAX_PANES = 4;
declare const NARROW_MAX = 2;
declare const NARROW_BREAKPOINT = 640;
interface Preset {
    id: string;
    /** Short name shown under the icon. */
    label: string;
    /** Longer description for the tooltip and screen readers. */
    hint: string;
    build: () => LayoutNode;
}
interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface Divider {
    path: number[];
    index: number;
    dir: "row" | "col";
    x: number;
    y: number;
    w: number;
    h: number;
}
declare function presetsFor(count: 1 | 2 | 3 | 4): Preset[];
declare function defaultPreset(count: 1 | 2 | 3 | 4, aspect: number): string;
declare function countLeaves(node: LayoutNode | null): number;
declare function computeRects(node: LayoutNode, w: number, h: number, gap: number): Rect[];
declare function computeDividers(node: LayoutNode, w: number, h: number, gap: number): Divider[];
declare function resizeAt(node: LayoutNode, path: number[], index: number, deltaPx: number, w: number, h: number, gap: number, minPx?: {
    w: number;
    h: number;
}): LayoutNode;
declare function equalize(node: LayoutNode): LayoutNode;
declare function removeSlot(node: LayoutNode, slot: number): LayoutNode | null;
declare function addSlot(node: LayoutNode | null, w: number, h: number, gap: number): LayoutNode;
declare function swapSlots(slots: string[], a: number, b: number): string[];
declare function narrowLayout(count: 1 | 2, n: NarrowLayout, aspect: number): LayoutNode;
declare function isValidLayout(node: LayoutNode | null, count: number): boolean;

export { MAX_PANES, NARROW_BREAKPOINT, NARROW_MAX, addSlot, computeDividers, computeRects, countLeaves, defaultPreset, equalize, isValidLayout, narrowLayout, presetsFor, removeSlot, resizeAt, swapSlots };
export type { Divider, LayoutNode, NarrowLayout, Preset, Rect };
