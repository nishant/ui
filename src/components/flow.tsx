import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../cn';
import { ago } from '../format';
import { useMediaQuery, useNow } from './hooks';
import { Badge, type BadgeHue } from './primitives';

// Animated components for live views of multi-step work: FlowSteps, StepBar, AgentNode,
// WorkflowBoard, ActivityFeed, TickerText and AnimatedList.
//
// Motion lives in CSS (src/css/base.css, `nish-flow-*`), inside
// `prefers-reduced-motion: no-preference`, so under reduced motion every state change is
// instant and nothing loops. Animations run on a state change, never on a re-render with
// the same data: a component remembers what it showed last and only plays what changed.

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** True while the viewer asks for reduced motion. False on the server and before hydration. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

const warned = new Set<string>();

/** Dev-only console warning, once per message. Bundlers replace `process.env.NODE_ENV`;
 *  where nothing does, the ReferenceError is caught and nothing is printed. */
function warnDev(message: string): void {
  if (warned.has(message)) return;
  try {
    if (process.env.NODE_ENV !== 'production') {
      warned.add(message);
      console.warn(message);
    }
  } catch {
    // No process or no console.
  }
}

/** Plays a one-shot effect on an element when `value` changes (never on mount): sets
 *  data-fx to the name `pick` returns, restarts the CSS animation if one was running,
 *  and clears it again. The attribute is set on the DOM directly, so a re-render with the
 *  same data cannot cut the animation short. */
function useTransitionFx<S extends string>(
  value: S,
  ref: RefObject<HTMLElement | null>,
  pick: (from: S, to: S) => string | null,
): void {
  const prev = useRef(value);
  useLayoutEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const el = ref.current;
    if (!el) return;
    el.removeAttribute('data-fx');
    const fx = pick(from, value);
    if (!fx) return;
    void el.offsetWidth;
    el.setAttribute('data-fx', fx);
    const timer = setTimeout(() => el.removeAttribute('data-fx'), 700);
    return () => {
      clearTimeout(timer);
      el.removeAttribute('data-fx');
    };
  }, [value, ref, pick]);
}

/** Ids that appeared after the first render. They stay flagged while they are in `ids`, so
 *  an item's enter animation is not cut off by the next render. With `skipFirst` the ids
 *  of the first render are never fresh. */
function useFreshIds(ids: string[], skipFirst: boolean): Set<string> {
  const known = useRef<Set<string> | null>(skipFirst ? null : new Set());
  const fresh = useRef(new Set<string>());
  if (known.current) for (const id of ids) if (!known.current.has(id)) fresh.current.add(id);
  useEffect(() => {
    const current = new Set(ids);
    known.current = current;
    for (const id of fresh.current) if (!current.has(id)) fresh.current.delete(id);
  });
  return fresh.current;
}

function CheckSvg({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={cn('nish-flow-check', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
    </svg>
  );
}

function CrossSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

// =====================================================================================
// FlowSteps
// =====================================================================================

export type FlowStepStatus = 'pending' | 'active' | 'done' | 'failed';

export interface FlowStepItem {
  id: string;
  label: ReactNode;
  status: FlowStepStatus;
  meta?: ReactNode;
}

export interface FlowStepsProps {
  steps: FlowStepItem[];
  /** auto: horizontal when the container is at least 640px wide and there are at most 8 steps; else vertical. */
  orientation?: 'auto' | 'vertical' | 'horizontal';
  /** aria-label of the list. Default "Progress". */
  label?: string;
  className?: string;
}

const NODE_STATUS: Record<FlowStepStatus, string> = {
  pending: 'border-2 border-th-line text-th-hi3',
  active: 'border-2 border-th-accent text-th-hi',
  done: 'bg-th-ok-fill text-th-on-ok',
  failed: 'bg-th-loss-fill text-th-on-loss',
};

const STEP_SR: Partial<Record<FlowStepStatus, string>> = { done: ', done', failed: ', failed' };

function pickStepFx(from: FlowStepStatus, to: FlowStepStatus): string | null {
  if (to === 'done') return 'done';
  if (to === 'failed') return 'failed';
  return from === to ? null : null;
}

function StepRow({
  step,
  index,
  last,
  sweeping,
}: {
  step: FlowStepItem;
  index: number;
  last: boolean;
  sweeping: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useTransitionFx(step.status, nodeRef, pickStepFx);
  const { status } = step;
  return (
    <li
      className="nish-flow-step nish-flow-rise"
      data-status={status}
      aria-current={status === 'active' ? 'step' : undefined}
      style={{ '--nish-flow-delay': `${Math.min(index * 40, 400)}ms` } as CSSProperties}
    >
      <span
        ref={nodeRef}
        className={cn(
          'nish-flow-node grid size-7 place-items-center rounded-full text-xs font-medium tabular-nums',
          NODE_STATUS[status],
        )}
        aria-hidden="true"
      >
        {status === 'done' ? (
          <CheckSvg size={16} />
        ) : status === 'failed' ? (
          <CrossSvg size={14} />
        ) : (
          index + 1
        )}
        {status === 'active' ? (
          <>
            <svg className="nish-flow-arc text-th-accent" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="20 62" />
            </svg>
            <span className="nish-flow-ripple" />
          </>
        ) : null}
      </span>
      <span className="nish-flow-text">
        <span
          className={cn(
            'nish-flow-label text-sm',
            status === 'active' ? 'font-medium text-th-hi' : status === 'failed' ? 'text-th-loss' : 'text-th-hi2',
          )}
        >
          {step.label}
          {STEP_SR[status] ? <span className="sr-only">{STEP_SR[status]}</span> : null}
        </span>
        {step.meta != null ? <span className="nish-flow-meta text-xs text-th-hi3">{step.meta}</span> : null}
      </span>
      {last ? null : (
        <span
          className="nish-flow-conn"
          data-on={status === 'done'}
          aria-hidden="true"
          style={sweeping ? ({ '--nish-flow-delay': `${index * 60}ms` } as CSSProperties) : undefined}
        >
          <span className="nish-flow-fill" />
          <span className="nish-flow-shimmer" />
          <span className="nish-flow-sweep" />
        </span>
      )}
    </li>
  );
}

/** A plan as a flow of steps: numbered nodes joined by connectors that fill as steps
 *  finish. The active step ripples, a finishing step draws its check, a failing one
 *  shakes, and when the last step finishes a sweep runs along the connectors. Vertical on
 *  narrow containers, horizontal from 640px (up to 8 steps). */
export function FlowSteps({ steps, orientation = 'auto', label = 'Progress', className }: FlowStepsProps) {
  const allDone = steps.length > 0 && steps.every((s) => s.status === 'done');
  const prevAll = useRef<boolean | null>(null);
  const [sweeping, setSweeping] = useState(false);
  useLayoutEffect(() => {
    const was = prevAll.current;
    prevAll.current = allDone;
    if (!allDone) {
      setSweeping(false);
      return;
    }
    if (was === false && steps.length > 1) {
      setSweeping(true);
      const timer = setTimeout(() => setSweeping(false), steps.length * 60 + 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const orient = orientation === 'auto' && steps.length > 8 ? 'vertical' : orientation;
  return (
    <div className={cn('nish-flow-steps-box', className)}>
      <ol className="nish-flow-steps" data-orient={orient} data-sweep={sweeping || undefined} aria-label={label}>
        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} index={i} last={i === steps.length - 1} sweeping={sweeping} />
        ))}
      </ol>
    </div>
  );
}

// =====================================================================================
// StepBar
// =====================================================================================

export interface StepBarProps {
  total: number;
  done: number;
  /** pulses the current segment */
  active?: boolean;
  label?: string;
  className?: string;
}

/** A compact progress bar of segments, one per step (a continuous bar above 12). Done
 *  segments fill in, the current one pulses while `active`. */
export function StepBar({ total, done, active = false, label, className }: StepBarProps) {
  const t = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const d = Number.isFinite(done) ? Math.min(t, Math.max(0, Math.floor(done))) : 0;
  const props = {
    role: 'progressbar' as const,
    'aria-valuemin': 0,
    'aria-valuemax': t,
    'aria-valuenow': d,
    'aria-label': label ?? 'Progress',
  };
  if (t > 12) {
    return (
      <div {...props} className={cn('relative h-1.5 overflow-hidden rounded-full bg-th-line', className)}>
        <div
          className="h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-[400ms]"
          style={{ width: `${(d / t) * 100}%` }}
        />
        {active && d < t ? (
          <div
            className="absolute inset-y-0 rounded-full bg-th-accent motion-safe:animate-pulse"
            style={{ left: `${(d / t) * 100}%`, width: `max(6px, ${100 / t}%)` }}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div {...props} className={cn('flex h-1.5 gap-[3px]', className)}>
      {Array.from({ length: t }, (_, i) => (
        <div key={i} className="relative h-full min-w-0 flex-1 overflow-hidden rounded-full bg-th-line">
          <div
            className={cn(
              'absolute inset-0 origin-left rounded-full bg-th-ok-fill motion-safe:transition-transform motion-safe:duration-[400ms]',
              i < d ? 'scale-x-100' : 'scale-x-0',
            )}
          />
          {i === d ? (
            <div className={cn('absolute inset-0 rounded-full bg-th-accent', active ? 'motion-safe:animate-pulse' : 'opacity-0')} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// =====================================================================================
// TickerText
// =====================================================================================

export interface TickerTextProps {
  text: string;
  as?: 'span' | 'p' | 'div';
  className?: string;
}

/** One line of text that swaps with a short slide when it changes: the old text rises and
 *  fades out while the new text comes up from below. Long text ends in an ellipsis. */
export function TickerText({ text, as = 'span', className }: TickerTextProps) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<{ text: string; prev: string | null }>({ text, prev: null });
  let cur = state;
  if (state.text !== text) {
    cur = { text, prev: reduced ? null : state.text };
    setState(cur);
  }
  const animating = cur.prev !== null;
  useEffect(() => {
    if (!animating) return;
    const timer = setTimeout(() => setState((s) => (s.prev === null ? s : { ...s, prev: null })), 300);
    return () => clearTimeout(timer);
  }, [animating, cur.text]);

  const Tag = as;
  return (
    <Tag className={cn('nish-flow-ticker grid min-w-0 overflow-hidden', className)} title={cur.text}>
      {cur.prev !== null ? (
        <span key={`prev:${cur.prev}`} className="nish-flow-ticker-out" aria-hidden="true">
          {cur.prev}
        </span>
      ) : null}
      <span key={cur.text} className={animating ? 'nish-flow-ticker-in' : undefined}>
        {cur.text}
      </span>
    </Tag>
  );
}

// =====================================================================================
// AgentNode
// =====================================================================================

export type AgentNodeState = 'queued' | 'running' | 'done' | 'failed';

export interface AgentNodeProps {
  label: string;
  state: AgentNodeState;
  /** Short model name; opus, sonnet, haiku and fable get their own badge hue. */
  model?: string | null;
  activity?: string;
  /** Right-aligned small text, e.g. elapsed time. */
  meta?: ReactNode;
  onClick?: () => void;
  className?: string;
}

const STATE_WORD: Record<AgentNodeState, string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
};

const AGENT_STATE: Record<AgentNodeState, string> = {
  queued: 'border-dashed border-th-line opacity-70',
  running: 'border-th-accent',
  done: 'border-th-ok-fill/40',
  failed: 'border-th-loss-fill',
};

const MODEL_HUE: [string, BadgeHue][] = [
  ['opus', 'violet'],
  ['sonnet', 'sky'],
  ['haiku', 'emerald'],
  ['fable', 'amber'],
];

function modelFamily(model: string): [string, BadgeHue] | undefined {
  const m = model.toLowerCase();
  return MODEL_HUE.find(([name]) => m.includes(name));
}

function ModelBadge({ model }: { model: string }) {
  const family = modelFamily(model);
  return (
    <Badge size="xs" hue={family?.[1]} className="shrink-0">
      {family ? family[0] : model}
    </Badge>
  );
}

function pickAgentFx(from: AgentNodeState, to: AgentNodeState): string | null {
  if (from === to) return null;
  if (to === 'done') return 'done';
  if (to === 'failed') return 'failed';
  return null;
}

function AgentIcon({ state }: { state: AgentNodeState }) {
  if (state === 'running') {
    return (
      <span className="nish-flow-agent-icon grid size-5 shrink-0 place-items-center text-th-accent">
        <svg className="nish-flow-agent-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (state === 'done') {
    return (
      <span className="nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok">
        <CheckSvg size={12} />
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span className="nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-loss-fill text-th-on-loss">
        <CrossSvg size={11} />
      </span>
    );
  }
  return (
    <span className="nish-flow-agent-icon grid size-5 shrink-0 place-items-center">
      <span className="size-4 rounded-full border-2 border-dashed border-th-ghost" />
    </span>
  );
}

/** One agent or task as a card: state icon, label, model badge, a live activity line.
 *  A running agent has a comet of accent circling its border; finishing pops the check;
 *  failing shakes once. Pass `onClick` to make the card a button. */
export function AgentNode({ label, state, model, activity, meta, onClick, className }: AgentNodeProps) {
  const ref = useRef<HTMLElement>(null);
  useTransitionFx(state, ref, pickAgentFx);
  const aria = `${label}: ${STATE_WORD[state]}`;
  const classes = cn(
    'nish-flow-agent block min-h-16 w-full min-w-0 rounded-xl border bg-th-surface p-3 text-left',
    AGENT_STATE[state],
    onClick &&
      'cursor-pointer transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent',
    className,
  );
  const body = (
    <>
      <span className="flex min-w-0 items-start gap-2">
        <AgentIcon state={state} />
        <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-5 text-th-hi [overflow-wrap:anywhere]">{label}</span>
        {meta != null ? <span className="shrink-0 text-xs leading-5 tabular-nums text-th-hi3">{meta}</span> : null}
      </span>
      {model || activity ? (
        <span className="mt-1.5 flex min-w-0 items-center gap-2">
          {model ? <ModelBadge model={model} /> : null}
          {activity ? <TickerText as="span" text={activity} className="min-w-0 flex-1 text-xs text-th-hi3" /> : null}
        </span>
      ) : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" ref={ref as RefObject<HTMLButtonElement | null>} className={classes} data-state={state} aria-label={aria} onClick={onClick}>
        {body}
      </button>
    );
  }
  return (
    <article ref={ref} className={classes} data-state={state} aria-label={aria}>
      {body}
    </article>
  );
}

// =====================================================================================
// WorkflowBoard
// =====================================================================================

export interface WorkflowBoardPhase {
  id: string;
  title: string;
  detail?: ReactNode;
  model?: string | null;
}

export interface WorkflowBoardAgent extends Omit<AgentNodeProps, 'className' | 'onClick'> {
  id: string;
  /** phase id or title */
  phase: string | null;
}

export interface WorkflowBoardProps {
  phases: WorkflowBoardPhase[];
  agents: WorkflowBoardAgent[];
  /** aria-label. Default "Workflow". */
  label?: string;
  className?: string;
}

type PhaseState = 'waiting' | 'pending' | 'active' | 'done';

const OTHER_ID = '__nish-flow-other__';

function phaseState(agents: WorkflowBoardAgent[]): PhaseState {
  if (agents.length === 0) return 'waiting';
  if (agents.some((a) => a.state === 'running')) return 'active';
  if (agents.every((a) => a.state === 'done' || a.state === 'failed')) return 'done';
  return 'pending';
}

function PhaseConnector({ flowing }: { flowing: boolean }) {
  return (
    <svg className="nish-flow-phase-conn" data-flow={flowing} viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="nish-flow-dashline" d="M1 6h15" strokeDasharray="3 3" />
      <path d="M16 2.5L20.5 6 16 9.5" />
    </svg>
  );
}

/** A workflow as columns of phases (stacked on narrow containers), each phase holding its
 *  agents as AgentNodes. A phase waits, glows while an agent runs and gets a check when
 *  all its agents finish; new agents rise in, staggered. */
export function WorkflowBoard({ phases, agents, label = 'Workflow', className }: WorkflowBoardProps) {
  const fresh = useFreshIds(
    agents.map((a) => a.id),
    false,
  );
  const columns = useMemo(() => {
    const byId = new Map<string, WorkflowBoardPhase>();
    const byTitle = new Map<string, WorkflowBoardPhase>();
    for (const p of phases) {
      if (!byId.has(p.id)) byId.set(p.id, p);
      if (!byTitle.has(p.title)) byTitle.set(p.title, p);
    }
    const groups = new Map<string, WorkflowBoardAgent[]>();
    const other: WorkflowBoardAgent[] = [];
    for (const a of agents) {
      const phase = a.phase === null ? undefined : (byId.get(a.phase) ?? byTitle.get(a.phase));
      if (!phase) {
        other.push(a);
        continue;
      }
      const list = groups.get(phase.id);
      if (list) list.push(a);
      else groups.set(phase.id, [a]);
    }
    const cols: { phase: WorkflowBoardPhase; agents: WorkflowBoardAgent[]; state: PhaseState }[] = phases.map((phase) => {
      const list = groups.get(phase.id) ?? [];
      return { phase, agents: list, state: phaseState(list) };
    });
    // Duplicate phase ids share one group; the later column shows the same agents once.
    const seen = new Set<string>();
    for (const c of cols) {
      if (seen.has(c.phase.id)) {
        c.agents = [];
        c.state = 'waiting';
      }
      seen.add(c.phase.id);
    }
    if (other.length) cols.push({ phase: { id: OTHER_ID, title: 'Other' }, agents: other, state: phaseState(other) });
    return cols;
  }, [phases, agents]);

  return (
    <section aria-label={label} className={cn('nish-flow-board-box', className)}>
      <div className="nish-flow-board">
        {columns.map((col, ci) => {
          const { phase, state } = col;
          const finished = col.agents.filter((a) => a.state === 'done' || a.state === 'failed').length;
          const total = col.agents.length;
          const next = columns[ci + 1];
          const flowing =
            (state === 'done' || state === 'active') &&
            next !== undefined &&
            (next.state === 'waiting' || next.state === 'pending' || next.state === 'active');
          return (
            <div
              key={phase.id}
              role="group"
              aria-label={phase.title}
              data-state={state}
              className={cn(
                'nish-flow-phase rounded-xl border bg-th-elevated/40 p-3',
                state === 'active' ? 'border-th-accent/50' : 'border-th-line',
              )}
            >
              <div className={cn('flex min-w-0 items-center gap-2', state === 'waiting' && 'opacity-60')}>
                {state === 'done' ? (
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok">
                    <CheckSvg size={10} />
                  </span>
                ) : null}
                <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', state === 'active' ? 'text-th-accent' : 'text-th-hi')}>
                  {phase.title}
                </span>
                {phase.model ? <ModelBadge model={phase.model} /> : null}
                <span className="shrink-0 text-xs tabular-nums text-th-hi3">
                  {finished}/{total}
                </span>
              </div>
              <div
                className={cn('mt-2 h-1 overflow-hidden rounded-full bg-th-line', state === 'waiting' && 'opacity-60')}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-500"
                  style={{ width: total ? `${(finished / total) * 100}%` : '0%' }}
                />
              </div>
              {phase.detail != null ? <div className="mt-2 text-xs text-th-hi3">{phase.detail}</div> : null}
              <div className="mt-3 flex min-w-0 flex-col gap-2">
                {total === 0 ? (
                  <p className="text-xs text-th-hi3">Waiting</p>
                ) : (
                  col.agents.map((a, ai) => {
                    const { id, phase: _phase, ...node } = a;
                    return (
                      <div
                        key={id}
                        className={fresh.has(id) ? 'nish-flow-rise' : undefined}
                        style={fresh.has(id) ? ({ '--nish-flow-delay': `${Math.min(ai * 60, 600)}ms` } as CSSProperties) : undefined}
                      >
                        <AgentNode {...node} />
                      </div>
                    );
                  })
                )}
              </div>
              {next ? <PhaseConnector flowing={flowing} /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =====================================================================================
// ActivityFeed
// =====================================================================================

export interface ActivityItem {
  id: string;
  at: number;
  text: ReactNode;
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'loss';
  source?: ReactNode;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  /** default 50 */
  max?: number;
  now?: number;
  /** default "Activity" */
  label?: string;
  empty?: ReactNode;
  className?: string;
}

const FEED_DOT: Record<NonNullable<ActivityItem['tone']>, string> = {
  neutral: 'bg-th-ghost',
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
};

/** A timeline of short updates, newest first. A new update opens its row, fades in and
 *  flashes the accent tint. Items present on the first render do not animate. */
export function ActivityFeed({ items, max = 50, now, label = 'Activity', empty, className }: ActivityFeedProps) {
  const internalNow = useNow(15000);
  const clock = now ?? internalNow;
  const shown = useMemo(() => [...items].sort((a, b) => b.at - a.at).slice(0, Math.max(0, max)), [items, max]);
  const fresh = useFreshIds(
    shown.map((i) => i.id),
    true,
  );
  if (shown.length === 0) {
    return <div className={cn('text-sm text-th-hi3', className)}>{empty ?? 'No activity yet'}</div>;
  }
  return (
    <ol className={cn('nish-flow-feed', className)} aria-label={label}>
      {shown.map((item) => (
        <li key={item.id} className="nish-flow-feed-item" data-fresh={fresh.has(item.id) || undefined} data-tone={item.tone ?? 'neutral'}>
          <div className="nish-flow-feed-inner">
            <div className="nish-flow-feed-row">
              <span className={cn('nish-flow-feed-dot', FEED_DOT[item.tone ?? 'neutral'])} aria-hidden="true" />
              <div className="min-w-0">
                <div className="break-words text-sm text-th-hi2">{item.text}</div>
                {item.source != null ? <div className="break-words text-xs text-th-hi3">{item.source}</div> : null}
              </div>
              <span className="pt-0.5 text-right text-xs tabular-nums text-th-hi3">{ago(item.at, { now: clock, style: 'short' })}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// =====================================================================================
// AnimatedList
// =====================================================================================

export interface AnimatedListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T, phase: 'enter' | 'idle' | 'exit') => ReactNode;
  /** How long a removed item stays to animate out. Default 420. */
  exitMs?: number;
  as?: 'ul' | 'ol' | 'div';
  className?: string;
  itemClassName?: string;
}

type ListPhase = 'enter' | 'idle' | 'exit';
interface ListEntry<T> {
  key: string;
  item: T;
  phase: ListPhase;
}
interface ListState<T> {
  src: T[];
  reduced: boolean;
  entries: ListEntry<T>[];
}

const ENTER_MS = 400;
const MOVE_MS = 300;

/** The entries to render for `items`: new keys enter, removed keys stay at their last
 *  index as "exit" (when animating), a key that comes back during its exit stops exiting.
 *  When a key repeats, the first item wins. */
function reconcile<T>(prev: ListEntry<T>[], items: T[], getKey: (item: T) => string, animate: boolean): ListEntry<T>[] {
  const prevMap = new Map(prev.map((e) => [e.key, e]));
  const seen = new Set<string>();
  const next: ListEntry<T>[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      warnDev(`AnimatedList: duplicate key "${key}"; only the first item with it is shown.`);
      continue;
    }
    seen.add(key);
    const old = prevMap.get(key);
    const phase: ListPhase = !old ? (animate ? 'enter' : 'idle') : old.phase === 'exit' ? 'idle' : old.phase;
    next.push({ key, item, phase: animate ? phase : 'idle' });
  }
  if (animate) {
    // Each exiting entry goes right after the key that preceded it in `prev`.
    prev.forEach((e, i) => {
      if (seen.has(e.key)) return;
      let at = 0;
      if (i > 0) {
        const before = prev[i - 1]!.key;
        const idx = next.findIndex((x) => x.key === before);
        at = idx === -1 ? Math.min(i, next.length) : idx + 1;
      }
      next.splice(at, 0, e.phase === 'exit' ? e : { ...e, phase: 'exit' });
    });
  }
  return next;
}

/** A list whose items animate: new ones rise in, removed ones fade and close the gap
 *  before they are dropped, and the rest slide to their new place (FLIP). The render
 *  function gets each item's phase. Under reduced motion changes are instant. */
export function AnimatedList<T>({
  items,
  getKey,
  children,
  exitMs = 420,
  as = 'ul',
  className,
  itemClassName,
}: AnimatedListProps<T>) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<ListState<T>>(() => ({
    src: items,
    reduced,
    entries: reconcile([], items, getKey, false),
  }));
  let current = state;
  if (state.src !== items || state.reduced !== reduced) {
    current = { src: items, reduced, entries: reconcile(state.entries, items, getKey, !reduced) };
    setState(current);
  }
  const entries = current.entries;

  const els = useRef(new Map<string, HTMLElement>());
  const rects = useRef(new Map<string, { x: number; y: number }>());
  const anims = useRef(new Map<string, Animation>());
  const refCbs = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const lastKeys = useRef<string | null>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Enter and exit timers: one per entry in that phase.
  useEffect(() => {
    const wanted = new Set<string>();
    for (const e of entries) {
      if (e.phase === 'idle') continue;
      const id = `${e.phase}:${e.key}`;
      wanted.add(id);
      if (timers.current.has(id)) continue;
      timers.current.set(
        id,
        setTimeout(
          () => {
            timers.current.delete(id);
            if (e.phase === 'exit') {
              // Fresh positions for the slide that follows the removal.
              const fresh = new Map<string, { x: number; y: number }>();
              els.current.forEach((el, k) => fresh.set(k, { x: el.offsetLeft, y: el.offsetTop }));
              rects.current = fresh;
            }
            setState((s) => ({
              ...s,
              entries:
                e.phase === 'exit'
                  ? s.entries.filter((x) => !(x.key === e.key && x.phase === 'exit'))
                  : s.entries.map((x) => (x.key === e.key && x.phase === 'enter' ? { ...x, phase: 'idle' as const } : x)),
            }));
          },
          e.phase === 'exit' ? exitMs : ENTER_MS,
        ),
      );
    }
    timers.current.forEach((timer, id) => {
      if (!wanted.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    });
  }, [entries, exitMs]);
  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  // FLIP: items that stayed move from their old place to the new one.
  useLayoutEffect(() => {
    const next = new Map<string, { x: number; y: number }>();
    els.current.forEach((el, k) => next.set(k, { x: el.offsetLeft, y: el.offsetTop }));
    const keyList = entries.map((e) => e.key).join('\n');
    const reordered = lastKeys.current !== null && lastKeys.current !== keyList;
    lastKeys.current = keyList;
    const live = new Set(entries.map((e) => e.key));
    anims.current.forEach((anim, k) => {
      if (!live.has(k)) {
        anim.cancel();
        anims.current.delete(k);
      }
    });
    refCbs.current.forEach((_, k) => {
      if (!live.has(k)) refCbs.current.delete(k);
    });
    // Focus inside an exiting item moves to a staying neighbour.
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active) {
      const ei = entries.findIndex((e) => e.phase === 'exit' && els.current.get(e.key)?.contains(active));
      if (ei !== -1) {
        const target = [...entries.slice(ei + 1), ...entries.slice(0, ei).reverse()].find((e) => e.phase !== 'exit');
        const focusable = target
          ? els.current.get(target.key)?.querySelector<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
          : null;
        if (focusable) focusable.focus({ preventScroll: true });
      }
    }
    if (!reduced && reordered) {
      for (const e of entries) {
        if (e.phase === 'exit') continue;
        const a = rects.current.get(e.key);
        const b = next.get(e.key);
        const el = els.current.get(e.key);
        if (!a || !b || !el || typeof el.animate !== 'function') continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const running = anims.current.get(e.key);
        if (running) {
          // Start from where the item is drawn now, not from its layout position.
          const r1 = el.getBoundingClientRect();
          running.cancel();
          anims.current.delete(e.key);
          const r2 = el.getBoundingClientRect();
          dx += r1.left - r2.left;
          dy += r1.top - r2.top;
        }
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        const anim = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: MOVE_MS,
          easing: EASE,
        });
        anims.current.set(e.key, anim);
        anim.onfinish = () => {
          if (anims.current.get(e.key) === anim) anims.current.delete(e.key);
        };
      }
    }
    rects.current = next;
  }, [entries, reduced]);

  const refFor = (key: string) => {
    let cb = refCbs.current.get(key);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (el) els.current.set(key, el);
        else els.current.delete(key);
      };
      refCbs.current.set(key, cb);
    }
    return cb;
  };
  const Root = as;
  const Item = as === 'div' ? 'div' : 'li';
  return (
    <Root className={className}>
      {entries.map((e) => (
        <Item
          key={e.key}
          ref={refFor(e.key)}
          className={cn('nish-flow-item', itemClassName)}
          data-phase={e.phase}
          aria-hidden={e.phase === 'exit' || undefined}
          inert={e.phase === 'exit' || undefined}
          style={e.phase === 'exit' ? ({ '--nish-flow-exit-ms': `${exitMs}ms` } as CSSProperties) : undefined}
        >
          <div className="nish-flow-item-inner">{children(e.item, e.phase)}</div>
        </Item>
      ))}
    </Root>
  );
}
