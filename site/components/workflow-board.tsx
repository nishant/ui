import { Card, WorkflowBoard, type AgentNodeState, type WorkflowBoardAgent, type WorkflowBoardPhase } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { useFlowDemo } from './flow-demo';

// --- WorkflowBoard ------------------------------------------------------------------

const PHASES: WorkflowBoardPhase[] = [
  { id: 'research', title: 'Research', detail: 'Read the code and the spec', model: 'opus' },
  { id: 'implement', title: 'Implement', detail: 'Build each task', model: 'sonnet' },
  { id: 'review', title: 'Review', detail: 'Check the result', model: 'opus' },
  { id: 'fix', title: 'Fix', detail: 'Apply the findings', model: 'sonnet' },
];
const COUNTS = [1, 3, 2, 2];

/** states[phaseIndex] lists the state of each agent in that phase; a missing phase has no agents yet. */
function agents(states: AgentNodeState[][]): WorkflowBoardAgent[] {
  return states.flatMap((list, p) =>
    list.map((state, i) => ({
      id: `${PHASES[p]!.id}-${i + 1}`,
      phase: PHASES[p]!.id,
      label: COUNTS[p] === 1 ? PHASES[p]!.title : `${PHASES[p]!.title} ${i + 1}`,
      state,
      model: PHASES[p]!.model,
      activity: state === 'running' ? 'Running npm test' : state === 'done' ? 'Finished' : state === 'failed' ? 'Stopped with an error' : 'Waiting for a slot',
      meta: state === 'queued' ? undefined : `${4 + i * 2}s`,
    })),
  );
}

function Live() {
  const demo = useFlowDemo();
  return <WorkflowBoard phases={demo.phases} agents={demo.agents} label="Demo workflow" />;
}

export const workflowBoard: ComponentDoc = {
  id: 'workflow-board',
  name: 'WorkflowBoard',
  exports: ['WorkflowBoard'],
  summary:
    'The phases of a workflow as columns, with an agent card in each. Agents appear, run and finish in place, and a flowing line links the phases that are handing over.',
  importLine: "import { WorkflowBoard } from '@nish/ui';",
  controls: [
    { key: 'progress', label: 'Progress', type: 'select', options: ['waiting', 'mid-run', 'done', 'failed'] },
    { key: 'other', label: 'Agent with no phase', type: 'boolean' },
  ],
  initial: { progress: 'mid-run', other: false },
  render: (a) => {
    const by: Record<string, AgentNodeState[][]> = {
      waiting: [],
      'mid-run': [['done'], ['done', 'running', 'running'], ['queued', 'queued']],
      done: [['done'], ['done', 'done', 'done'], ['done', 'done'], ['done', 'done']],
      failed: [['done'], ['done', 'failed', 'done'], ['done', 'done'], ['running', 'queued']],
    };
    const list = agents(by[String(a.progress)] ?? []);
    if (a.other) list.push({ id: 'extra', phase: null, label: 'Cleanup', state: 'running', activity: 'Writing findings' });
    return <WorkflowBoard phases={PHASES} agents={list} className="w-full" />;
  },
  code: () => jsx('WorkflowBoard', { phases: '{phases}', agents: '{agents}' }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'A simulated workflow: four phases of agents that queue, run and finish, then it starts over.',
      wide: true,
      render: () => (
        <Card className="w-full">
          <Live />
        </Card>
      ),
    },
    {
      id: 'waiting',
      name: 'All waiting',
      note: 'Phases with no agents yet show "Waiting".',
      wide: true,
      render: () => <WorkflowBoard phases={PHASES} agents={[]} className="w-full" />,
    },
    {
      id: 'mid-run',
      name: 'Mid-run',
      wide: true,
      render: () => <WorkflowBoard phases={PHASES} agents={agents([['done'], ['done', 'running', 'running'], ['queued', 'queued']])} className="w-full" />,
    },
    {
      id: 'done',
      name: 'All done',
      wide: true,
      render: () => (
        <WorkflowBoard phases={PHASES} agents={agents([['done'], ['done', 'done', 'done'], ['done', 'done'], ['done', 'done']])} className="w-full" />
      ),
    },
    {
      id: 'failed',
      name: 'With a failure',
      wide: true,
      render: () => (
        <WorkflowBoard phases={PHASES} agents={agents([['done'], ['done', 'failed', 'done'], ['done', 'done'], ['running', 'queued']])} className="w-full" />
      ),
    },
    {
      id: 'other',
      name: 'Agent with no phase',
      note: 'An agent that matches no phase goes into a trailing "Other" column.',
      wide: true,
      render: () => (
        <WorkflowBoard
          phases={PHASES.slice(0, 2)}
          agents={[
            ...agents([['done'], ['running', 'queued', 'queued']]),
            { id: 'extra', phase: 'cleanup', label: 'Cleanup', state: 'running', activity: 'Writing findings' },
          ]}
          className="w-full"
        />
      ),
    },
  ],
  usage: `import { WorkflowBoard } from '@nish/ui';

<WorkflowBoard
  phases={run.phases.map((p) => ({ id: p.title, title: p.title, model: p.model }))}
  agents={run.agents.map((a) => ({ id: a.id, phase: a.phase, label: a.label, state: a.state, activity: a.activity }))}
/>`,
  guidelines: [
    'Use it for work split into phases that run in order, each with its own agents. One agent on its own is an AgentNode.',
    'Match agents to phases with phase (the phase id or title). Unmatched agents land in an "Other" column.',
    'From 720px wide the phases are columns and the board scrolls sideways inside its own box; below that they stack.',
    'Keep agent ids stable. A new id enters with a rise-in; a known id only changes state.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
