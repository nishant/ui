// A seeded random graph for the SystemCanvas routing benchmark and the golden-hash test.

/**
 * @param {{ nodes: number, edgesPerNode?: number, columns?: number, seed?: number }} o
 * @returns {{ groups: import('../src/components/canvas/types').CanvasGroup[], edges: import('../src/components/canvas/types').CanvasEdge[] }}
 */
export function benchGraph({ nodes, edgesPerNode = 1.5, columns = 8, seed = 1 }) {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const groups = [];
  const ends = [];
  let left = nodes;
  for (let i = 0; left > 0; i++) {
    const gid = `g${i}`;
    const size = Math.min(1 + Math.floor(r() * 10), left);
    left -= size;
    const list = [];
    for (let j = 0; j < size; j++) list.push({ id: `${gid}/n${j}`, label: `n${j}` });
    groups.push({ id: gid, title: gid, column: Math.floor(r() * columns), nodes: list });
    ends.push(gid, ...list.map((n) => n.id));
  }
  const edges = [];
  const count = Math.round(nodes * edgesPerNode);
  for (let i = 0; i < count; i++) {
    const from = ends[Math.floor(r() * ends.length)];
    const to = ends[Math.floor(r() * ends.length)];
    edges.push({ id: `e${i}`, from, to });
  }
  return { groups, edges };
}
