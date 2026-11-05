import type { CanvasGroup, CanvasEdge } from '../src/components/canvas/types';

export function benchGraph(o: { nodes: number; edgesPerNode?: number; columns?: number; seed?: number }): {
  groups: CanvasGroup[];
  edges: CanvasEdge[];
};
