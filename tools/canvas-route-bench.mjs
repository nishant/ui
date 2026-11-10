// Times SystemCanvas's layout and routing on seeded random graphs. Run after `npm run build`.
// `--check` routes the 500-node graph 7 times per layout and exits 1 when the fastest of 7 runs is over the limit twice
// (the fastest run is the least noisy on a busy runner; a second measurement guards against one slow stretch).
import { chooseLayout, layoutCandidates } from '../dist/esm/components/canvas/layout.js';
import { routeEdges } from '../dist/esm/components/canvas/route.js';
import { benchGraph } from './canvas-bench-graph.mjs';

const LIMIT_MS = 60;
const check = process.argv.includes('--check');

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const fastest = (xs) => Math.min(...xs);
const time = (runs, fn) => {
  const ms = [];
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    fn();
    ms.push(performance.now() - t);
  }
  return check ? fastest(ms) : median(ms);
};
const fmt = (ms) => `${ms.toFixed(1)} ms`;

const sizes = check ? [500] : [100, 250, 500, 1000];
const runs = check ? 7 : 5;

function measure() {
  let worst = 0;
  for (const nodes of sizes) {
    const { groups, edges } = benchGraph({ nodes, seed: 1 });
    const cand = layoutCandidates(groups, edges, 'auto');
    const tCand = time(runs, () => layoutCandidates(groups, edges, 'auto'));
    const columns = cand.columns;
    const desktop = chooseLayout(cand, { w: 1440, h: 900 });
    const phone = chooseLayout(cand, { w: 360, h: 780 });
    const tCols = time(runs, () => routeEdges(columns, groups, edges));
    const tDesk = time(runs, () => routeEdges(desktop, groups, edges));
    const tPhone = time(runs, () => routeEdges(phone, groups, edges));
    worst = Math.max(worst, tCols, tDesk, tPhone);
    if (!check) {
      console.log(
        `canvas-route-bench: ${nodes} nodes, ${edges.length} edges: candidates ${fmt(tCand)}, columns ${fmt(tCols)}, desktop (bands) ${fmt(tDesk)}, phone (bands) ${fmt(tPhone)}`,
      );
    }
  }
  return worst;
}

if (check) {
  let worst = measure();
  if (worst > LIMIT_MS) worst = measure(); // one rerun before failing
  if (worst > LIMIT_MS) {
    console.error(`canvas-route-bench: routing 500 nodes took ${worst.toFixed(1)} ms at best twice (limit ${LIMIT_MS})`);
    process.exit(1);
  }
  console.log('canvas-route-bench: ok');
} else {
  measure();
}
