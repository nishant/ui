import * as react from 'react';
import { ReactNode } from 'react';

type CanvasHue = 'indigo' | 'emerald' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';
type CanvasNodeKind = 'ui' | 'service' | 'worker' | 'library' | 'infra' | 'data' | 'tool' | 'docs';
interface CanvasNode {
    id: string;
    label: string;
    kind?: CanvasNodeKind;
    detail?: string;
    /** 0..1 afterglow */
    heat?: number;
    /** live work here now */
    active?: boolean;
    /** When the newest activity here happened, ms. Follow mode visits the newest first. */
    activeAt?: number;
    /** shown under an active node, max ~48 chars */
    note?: string;
    /** sessions/agents here */
    count?: number;
}
interface CanvasGroup {
    id: string;
    title: string;
    subtitle?: string;
    hue?: CanvasHue;
    /** Left-to-right layer in the "columns" layout; also orders groups inside a band. */
    column: number;
    /** Top-to-bottom band in the "bands" layout. Default: `column`. */
    band?: number;
    badge?: ReactNode;
    nodes: CanvasNode[];
}
interface CanvasEdge {
    id: string;
    /** node or group id */
    from: string;
    /** node or group id */
    to: string;
    /** Overrides the kind's line style with a dashed line. */
    dashed?: boolean;
    label?: string;
    /** A `CanvasEdgeKind` id: sets the line style and which legend toggle shows or hides it. */
    kind?: string;
}
/** One entry of the line legend. */
interface CanvasEdgeKind {
    id: string;
    /** Legend text ("Traffic", "Deploys"). */
    label: string;
    /** Default "solid". */
    line?: 'solid' | 'dashed' | 'dotted';
    /** Hidden until the viewer turns it on in the legend. */
    hidden?: boolean;
}
/** "columns": layers left to right. "bands": bands top to bottom, each wrapping its groups into
 *  rows. "auto": whichever shows the map biggest in the current viewport. */
type CanvasLayoutMode = 'columns' | 'bands' | 'auto';
interface SystemCanvasProps {
    groups: CanvasGroup[];
    edges: CanvasEdge[];
    /** Faint titles above each column ("Edge", "Infra", "Apps", ...), by column index. */
    columns?: string[];
    /** Titles of the bands in the "bands" layout, by band index. Falls back to `columns`. */
    bands?: string[];
    /** Default "auto". */
    layout?: CanvasLayoutMode;
    /** The line legend. Edges whose kind is hidden are left out of the layout and routing. */
    edgeKinds?: CanvasEdgeKind[];
    /** Follow mode: the view flies to where work is happening. Controlled when set. */
    follow?: boolean;
    onFollowChange?: (on: boolean) => void;
    /** Overview map in a corner on viewports 600 px wide or more. Default true. */
    minimap?: boolean;
    selected?: string | null;
    onSelect?: (id: string, type: 'node' | 'group') => void;
    /** CSS height of the viewport. Default "100%". */
    height?: string;
    /** aria-label. Default "System map". */
    label?: string;
    className?: string;
}

/** A pannable, zoomable graph-paper canvas of grouped nodes joined by edges. Nodes with
 *  `active` pulse in their group's hue, edges into them flow, and `heat` leaves a fading
 *  glow behind. Drag or scroll to pan, ctrl+scroll or pinch to zoom, arrow keys, `+`, `-`
 *  and `0` from the keyboard. */
declare function SystemCanvas({ groups, edges, columns, bands, layout: layoutMode, edgeKinds, follow, onFollowChange, minimap, selected, onSelect, height, label, className, }: SystemCanvasProps): react.JSX.Element;

interface CanvasLayout {
    mode: "columns" | "bands";
    width: number;
    height: number;
    /** World px above y = 0 taken by the headers: 36 in "columns" (titles sit above the cards), 0 in "bands" (titles sit inside). */
    titleRoom: number;
    /** Top-left of each column's ("columns") or band's ("bands") title, world px; `index` is the column or band value. */
    headers: {
        index: number;
        x: number;
        y: number;
    }[];
    groups: Record<string, {
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
    nodes: Record<string, {
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
}
/** Where every group and node sits, in world units (px at zoom 1). Pure and deterministic.
 *
 *  "columns" (default): columns are the distinct `column` values in ascending order, groups
 *  stack in the order given, nodes sit in a 2-column grid inside their group (1 column for a
 *  group of one), and each column is centered against the tallest. The first sub-column starts
 *  60 px in and `width` includes 60 px after the last, which is room for the edge lanes
 *  outside the cards.
 *
 *  "bands": bands are the distinct `band ?? column` values in ascending order, stacked top to
 *  bottom; each band wraps its groups (by `column`, then input order) into rows no wider than
 *  `width`. The gaps between rows grow with the number of edge ends that need lanes there. */
interface LayoutOptions {
    /** Default "columns". */
    mode?: "columns" | "bands";
    /** "bands" only: the widest a row of groups may get, world px (at least one group per row). */
    width?: number;
    /** "bands" only: used to size the gaps between rows for the edge lanes. */
    edges?: CanvasEdge[];
    columnGap?: number;
    rowGap?: number;
}
declare function layoutSystem(groups: CanvasGroup[], o?: LayoutOptions): CanvasLayout;
/** The layout to show in a viewport of `viewport` px. "columns" and "bands" use that mode;
 *  "auto" picks whichever candidate shows the map biggest. Pure and deterministic. */
declare function pickLayout(groups: CanvasGroup[], edges: CanvasEdge[], viewport: {
    w: number;
    h: number;
}, mode?: CanvasLayoutMode): CanvasLayout;

interface RoutedEdge {
    id: string;
    /** The corners of the line, source port first. Every segment is horizontal or vertical. */
    points: [number, number][];
    /** The same line as an SVG path with rounded corners; also valid for CSS `offset-path`. */
    d: string;
    /** Direction of travel of the last segment: "right" in "columns", "down" in "bands". */
    dir: 'right' | 'down';
}
/** Routes every edge as an orthogonal line (horizontal and vertical segments, rounded corners)
 *  from the right border of its source card to the left border of its target card. A node
 *  attaches at its own center height, a group at its card's middle. Group boxes are clustered
 *  into sub-columns by x; the gaps between them (and 60 px outside the first and last) are
 *  channels, where vertical lanes run: one lane per source port (edges from a port share a
 *  trunk) and one per target port (edges into a port merge). An edge to a sub-column further
 *  right than the next travels along a horizontal corridor free of cards; backward edges and
 *  edges inside one sub-column do the same, mirrored. Two edges share a line only at a shared
 *  source or target port. Pure and deterministic; the result is keyed by edge id and skips
 *  edges with an unknown end. In a "bands" layout the same router runs on the transposed layout
 *  (x and y swapped) and the points are swapped back: lines leave the bottom border of the
 *  source card and enter the top border of the target card, and `dir` is "down". */
declare function routeEdges(layout: CanvasLayout, groups: CanvasGroup[], edges: CanvasEdge[]): Record<string, RoutedEdge>;

export { SystemCanvas, layoutSystem, pickLayout, routeEdges };
export type { CanvasEdge, CanvasEdgeKind, CanvasGroup, CanvasHue, CanvasLayout, CanvasLayoutMode, CanvasNode, CanvasNodeKind, LayoutOptions, RoutedEdge, SystemCanvasProps };
