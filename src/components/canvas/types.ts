import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

export type CanvasHue = 'indigo' | 'emerald' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';
export type CanvasNodeKind = 'ui' | 'service' | 'worker' | 'library' | 'infra' | 'data' | 'tool' | 'docs';

export interface CanvasNode {
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

export interface CanvasGroup {
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

export interface CanvasEdge {
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
export interface CanvasEdgeKind {
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
export type CanvasLayoutMode = 'columns' | 'bands' | 'auto';

/** Text of the canvas that has no key in `NishStrings`. Each one wins over its English default. */
export interface CanvasLabels {
  /** Added to the "Lines" button when kinds are hidden: "· 2 hidden". */
  hidden: (count: number) => string;
  /** Follow caption when nothing is active. */
  followIdle: string;
  /** Follow caption for one node. */
  followOne: (group: string, label: string) => string;
  /** Follow caption for several nodes. */
  followMany: (count: number) => string;
}

export const DEFAULT_CANVAS_LABELS: CanvasLabels = {
  hidden: (count) => `· ${count} hidden`,
  followIdle: 'Following · waiting for activity',
  followOne: (group, label) => `Following · ${group} › ${label}`,
  followMany: (count) => `Following ${count} active pieces`,
};

export interface SystemCanvasProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onSelect' | 'children' | 'aria-label'> {
  ref?: Ref<HTMLDivElement>;
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
  /** aria-label. Default: the `systemMap` string ("System map"). */
  label?: string;
  /** Text without a key in the provider's strings (follow caption, hidden-lines count). */
  labels?: Partial<CanvasLabels>;
  className?: string;
}
