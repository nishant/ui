// src/sparkline-path.ts
function decimateMinMax(points, xMin, xMax, buckets) {
  const span = xMax - xMin || 1;
  const out = [];
  let b = -1;
  let lo = points[0];
  let hi = points[0];
  const flush = () => {
    if (lo === hi) out.push(lo);
    else if (lo.x <= hi.x) out.push(lo, hi);
    else out.push(hi, lo);
  };
  for (const p of points) {
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor((p.x - xMin) / span * buckets)));
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
function sparklineGeometry(values, width, height, min, max) {
  const nums = values.filter((v) => v != null && Number.isFinite(v));
  const empty = nums.length === 0;
  let numLo = Infinity;
  let numHi = -Infinity;
  for (const n of nums) {
    if (n < numLo) numLo = n;
    if (n > numHi) numHi = n;
  }
  const lo = min ?? (empty ? 0 : numLo);
  const hi = max ?? (empty ? 1 : numHi);
  const pad = 2;
  const x = (i) => values.length <= 1 ? width / 2 : i / (values.length - 1) * width;
  const y = (v) => hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad);
  const runs = [];
  let run = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ x: x(i), y: y(v) });
  });
  if (run.length) runs.push(run);
  const buckets = Math.max(1, Math.floor(width));
  for (let r = 0; r < runs.length; r++) if (runs[r].length > buckets * 2) runs[r] = decimateMinMax(runs[r], 0, width, buckets);
  const line = (r) => r.length === 1 ? `M${r[0].x},${r[0].y}h0` : r.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("");
  const area = (r) => r.length < 2 ? "" : `${line(r)}L${r[r.length - 1].x},${height}L${r[0].x},${height}Z`;
  return { empty, lines: runs.map(line), areas: runs.map(area), baseline: `M0,${height / 2}H${width}` };
}
export {
  sparklineGeometry
};
