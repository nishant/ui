// A fake run that drives the live stories of the flow components: six plan steps and a
// workflow with four phases of agents that queue, run, finish (or fail) and log feed items.
// The whole thing restarts a few seconds after it finishes.
import { useEffect, useState } from 'react';
import type { ActivityItem, FlowStepItem, WorkflowBoardAgent, WorkflowBoardPhase } from '../../src';

export const DEMO_STEP_LABELS = ['Read the spec', 'Plan the work', 'Implement', 'Review the diff', 'Fix the findings', 'Release'];
export const DEMO_ACTIVITY = ['Reading spec.md', 'Editing server/index.ts', 'Running npm test', 'Reviewing the diff', 'Writing findings'];

const STEP_MS = 1600;
const RESTART_MS = 4000;
const TICK_MS = 250;
const FAIL_CHANCE = 1 / 8;
const PHASES: { id: string; title: string; detail: string; model: string; agents: number }[] = [
  { id: 'research', title: 'Research', detail: 'Read the code and the spec', model: 'opus', agents: 1 },
  { id: 'implement', title: 'Implement', detail: 'Build each task', model: 'sonnet', agents: 3 },
  { id: 'review', title: 'Review', detail: 'Check the result', model: 'opus', agents: 2 },
  { id: 'fix', title: 'Fix', detail: 'Apply the findings', model: 'sonnet', agents: 2 },
];

interface SimAgent {
  id: string;
  label: string;
  phase: string;
  model: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  appearAt: number;
  startAt: number;
  endAt: number;
  willFail: boolean;
  activity: string;
  nextActivityAt: number;
  announcedStart: boolean;
  announcedEnd: boolean;
}

interface Sim {
  run: number;
  startedAt: number;
  finishedAt: number | null;
  agents: SimAgent[];
  feed: ActivityItem[];
  nextId: number;
  phaseStarts: number[];
}

export interface FlowDemo {
  steps: FlowStepItem[];
  /** Plan steps finished so far. */
  done: number;
  total: number;
  /** False while the demo waits to restart. */
  running: boolean;
  phases: WorkflowBoardPhase[];
  agents: WorkflowBoardAgent[];
  items: ActivityItem[];
  now: number;
}

function secs(ms: number): string {
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

function newSim(run: number, now: number): Sim {
  return { run, startedAt: now, finishedAt: null, agents: [], feed: [], nextId: 1, phaseStarts: [] };
}

function push(sim: Sim, now: number, text: string, tone: ActivityItem['tone'], source?: string): void {
  sim.feed = [{ id: `f${sim.run}-${sim.nextId++}`, at: now, text, tone, source }, ...sim.feed].slice(0, 50);
}

function startPhase(sim: Sim, index: number, now: number): void {
  const p = PHASES[index]!;
  sim.phaseStarts[index] = now;
  for (let i = 0; i < p.agents; i++) {
    const appearAt = now + i * 220;
    const startAt = appearAt + 700;
    const dur = 2000 + Math.random() * 3000;
    sim.agents.push({
      id: `${sim.run}-${p.id}-${i + 1}`,
      label: p.agents === 1 ? p.title : `${p.title} ${i + 1}`,
      phase: p.id,
      model: p.model,
      state: 'queued',
      appearAt,
      startAt,
      endAt: startAt + dur,
      willFail: Math.random() < FAIL_CHANCE,
      activity: 'Waiting for a slot',
      nextActivityAt: startAt,
      announcedStart: false,
      announcedEnd: false,
    });
  }
  push(sim, now, `Phase ${p.title} started`, 'accent');
}

function advance(sim: Sim, now: number): void {
  const t = now - sim.startedAt;
  // Plan steps: one every STEP_MS; the feed notes each step as it begins.
  const stepIndex = Math.min(DEMO_STEP_LABELS.length - 1, Math.floor(t / STEP_MS));
  const seen = sim.feed.filter((f) => String(f.source) === 'plan').length;
  if (t >= 0 && seen <= stepIndex && t < STEP_MS * DEMO_STEP_LABELS.length) {
    push(sim, now, `Now: ${DEMO_STEP_LABELS[seen]}`, 'neutral', 'plan');
  }

  // Phases run one after another; the next starts half a second after the last agent ends.
  const started = sim.phaseStarts.length;
  if (started === 0) startPhase(sim, 0, now);
  else if (started < PHASES.length) {
    const prev = PHASES[started - 1]!.id;
    const group = sim.agents.filter((a) => a.phase === prev);
    const last = Math.max(...group.map((a) => a.endAt));
    if (group.every((a) => a.state === 'done' || a.state === 'failed') && now >= last + 500) startPhase(sim, started, now);
  }

  for (const a of sim.agents) {
    if (a.state === 'queued' && now >= a.startAt) {
      a.state = 'running';
      a.activity = DEMO_ACTIVITY[0]!;
    }
    if (a.state === 'running') {
      if (!a.announcedStart) {
        a.announcedStart = true;
        push(sim, now, `${a.label} started`, 'neutral', a.label);
      }
      if (now >= a.endAt) {
        a.state = a.willFail ? 'failed' : 'done';
        a.activity = a.willFail ? 'Stopped with an error' : 'Finished';
      } else if (now >= a.nextActivityAt) {
        a.activity = DEMO_ACTIVITY[Math.floor(Math.random() * DEMO_ACTIVITY.length)]!;
        a.nextActivityAt = now + 700 + Math.random() * 600;
      }
    }
    if ((a.state === 'done' || a.state === 'failed') && !a.announcedEnd) {
      a.announcedEnd = true;
      push(sim, now, a.state === 'done' ? `${a.label} finished` : `${a.label} failed`, a.state === 'done' ? 'ok' : 'loss', a.label);
    }
  }

  const everyPhase = sim.phaseStarts.length === PHASES.length;
  const allEnded = sim.agents.length > 0 && sim.agents.every((a) => a.state === 'done' || a.state === 'failed');
  if (sim.finishedAt == null && everyPhase && allEnded && t >= STEP_MS * DEMO_STEP_LABELS.length) {
    sim.finishedAt = now;
    push(sim, now, 'Run finished', 'ok');
  }
}

function snapshot(sim: Sim, now: number): FlowDemo {
  const total = DEMO_STEP_LABELS.length;
  const finished = sim.finishedAt != null;
  const t = now - sim.startedAt;
  const doneCount = finished ? total : Math.min(total - 1, Math.floor(t / STEP_MS));
  const steps: FlowStepItem[] = DEMO_STEP_LABELS.map((label, i) => ({
    id: `s${i + 1}`,
    label,
    status: i < doneCount ? 'done' : i === doneCount && !finished ? 'active' : 'pending',
    meta: i < doneCount ? 'Done' : undefined,
  }));
  const phases: WorkflowBoardPhase[] = PHASES.map((p) => ({ id: p.id, title: p.title, detail: p.detail, model: p.model }));
  const agents: WorkflowBoardAgent[] = sim.agents
    .filter((a) => now >= a.appearAt)
    .map((a) => ({
      id: a.id,
      label: a.label,
      phase: a.phase,
      model: a.model,
      state: a.state,
      activity: a.activity,
      meta: a.state === 'queued' ? undefined : secs((a.state === 'running' ? now : Math.min(now, a.endAt)) - a.startAt),
    }));
  return { steps, done: doneCount, total, running: !finished, phases, agents, items: sim.feed, now };
}

/** Drives a fake run on a timer. Every piece of the result changes only when the run does. */
export function useFlowDemo(): FlowDemo {
  const [view, setView] = useState<FlowDemo>(() => snapshot(newSim(0, Date.now()), Date.now()));
  useEffect(() => {
    let sim = newSim(1, Date.now());
    const tick = () => {
      const now = Date.now();
      if (sim.finishedAt != null && now - sim.finishedAt >= RESTART_MS) sim = newSim(sim.run + 1, now);
      advance(sim, now);
      setView(snapshot(sim, now));
    };
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return view;
}
