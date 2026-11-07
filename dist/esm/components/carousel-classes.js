// src/components/carousel-classes.ts
var CAROUSEL_MIN_INTERVAL = 2e3;
var CAROUSEL_MAX_DOTS = 7;
function nearestSlide(starts, origin) {
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < starts.length; i++) {
    const distance = Math.abs(starts[i] - origin);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}
function stepIndex(index, dir, count, loop) {
  if (count <= 0) return 0;
  const next = index + dir;
  if (loop) return (next + count) % count;
  return Math.min(Math.max(next, 0), count - 1);
}
export {
  CAROUSEL_MAX_DOTS,
  CAROUSEL_MIN_INTERVAL,
  nearestSlide,
  stepIndex
};
