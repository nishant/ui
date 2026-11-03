/** The path math of a sparkline, shared by React `Sparkline` and `<nish-sparkline>`. */

export interface SparklineGeometry {
  /** True when the series has no finite number. */
  empty: boolean;
  /** One path per unbroken run; a single point becomes a zero-length dot (`M x,y h0`). */
  lines: string[];
  /** The area under each run, parallel to `lines`; '' for a run of one point. */
  areas: string[];
  /** The flat dashed line drawn when there is no data. */
  baseline: string;
}

/** Keeps the lowest and highest y of each of `buckets` pixel columns, in x order (a copy of
 *  decimateMinMax in components/data-classes.ts, so the elements bundle does not import it). */
function decimateMinMax(points: { x: number; y: number }[], xMin: number, xMax: number, buckets: number): { x: number; y: number }[] {
  const span = xMax - xMin || 1;
  const out: { x: number; y: number }[] = [];
  let b = -1;
  let lo = points[0];
  let hi = points[0];
  const flush = () => {
    if (lo === hi) out.push(lo);
    else if (lo.x <= hi.x) out.push(lo, hi);
    else out.push(hi, lo);
  };
  for (const p of points) {
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor(((p.x - xMin) / span) * buckets)));
    if (idx !== b) {
      if (b >= 0) flush();
      b = idx;
      lo = p;
      hi = p;
    } else {
      if (p.y < lo.y) lo = p;
      if (p.y > hi.y) hi = p;
    }
  }
  flush();
  return out;
}

export function sparklineGeometry(
  values: readonly (number | null)[],
  width: number,
  height: number,
  min?: number,
  max?: number,
): SparklineGeometry {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  const empty = nums.length === 0;
  // A plain loop: Math.min(...nums) throws RangeError on hundreds of thousands of values.
  let numLo = Infinity;
  let numHi = -Infinity;
  for (const n of nums) {
    if (n < numLo) numLo = n;
    if (n > numHi) numHi = n;
  }
  const lo = min ?? (empty ? 0 : numLo);
  const hi = max ?? (empty ? 1 : numHi);
  const pad = 2; // keep the stroke inside the box at the extremes
  const x = (i: number) => (values.length <= 1 ? width / 2 : (i / (values.length - 1)) * width);
  const y = (v: number) => (hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad));

  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ x: x(i), y: y(v) });
  });
  if (run.length) runs.push(run);
  // At most two points per pixel column: a long series would otherwise emit one path command per value.
  const buckets = Math.max(1, Math.floor(width));
  for (let r = 0; r < runs.length; r++) if (runs[r].length > buckets * 2) runs[r] = decimateMinMax(runs[r], 0, width, buckets);

  const line = (r: { x: number; y: number }[]) =>
    r.length === 1 ? `M${r[0].x},${r[0].y}h0` : r.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
  const area = (r: { x: number; y: number }[]) =>
    r.length < 2 ? '' : `${line(r)}L${r[r.length - 1].x},${height}L${r[0].x},${height}Z`;

  return { empty, lines: runs.map(line), areas: runs.map(area), baseline: `M0,${height / 2}H${width}` };
}
