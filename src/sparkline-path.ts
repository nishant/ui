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

export function sparklineGeometry(
  values: readonly (number | null)[],
  width: number,
  height: number,
  min?: number,
  max?: number,
): SparklineGeometry {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  const empty = nums.length === 0;
  const lo = min ?? (empty ? 0 : Math.min(...nums));
  const hi = max ?? (empty ? 1 : Math.max(...nums));
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

  const line = (r: { x: number; y: number }[]) =>
    r.length === 1 ? `M${r[0].x},${r[0].y}h0` : r.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
  const area = (r: { x: number; y: number }[]) =>
    r.length < 2 ? '' : `${line(r)}L${r[r.length - 1].x},${height}L${r[0].x},${height}Z`;

  return { empty, lines: runs.map(line), areas: runs.map(area), baseline: `M0,${height / 2}H${width}` };
}
