import { AgentNode, type AgentNodeState } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { useFlowDemo } from './flow-demo';

// --- AgentNode ----------------------------------------------------------------------

const STATES: AgentNodeState[] = ['queued', 'running', 'done', 'failed'];
const MODELS = ['opus', 'sonnet', 'haiku', 'fable', 'other'];
const ACTIVITY: Record<AgentNodeState, string> = {
  queued: 'Waiting for a slot',
  running: 'Editing server/index.ts',
  done: 'Finished',
  failed: 'Stopped with an error',
};

function Live() {
  const demo = useFlowDemo();
  const a = demo.agents.find((x) => x.state === 'running') ?? demo.agents[demo.agents.length - 1];
  if (!a) return <AgentNode label="Starting" state="queued" className="w-full max-w-sm" />;
  const { id: _id, phase: _phase, ...props } = a;
  return <AgentNode {...props} className="w-full max-w-sm" />;
}

export const agentNode: ComponentDoc = {
  id: 'agent-node',
  name: 'AgentNode',
  exports: ['AgentNode'],
  summary:
    'A card for one worker: a state icon, its name, a model badge and a line of what it is doing. A running one has a travelling light around its border.',
  importLine: "import { AgentNode } from '@nish/ui';",
  controls: [
    { key: 'state', label: 'State', type: 'select', options: STATES },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'model', label: 'Model', type: 'select', options: MODELS },
    { key: 'activity', label: 'Activity', type: 'text' },
    { key: 'meta', label: 'Meta', type: 'text' },
    { key: 'clickable', label: 'Clickable', type: 'boolean' },
  ],
  initial: { state: 'running', label: 'Implement 2', model: 'sonnet', activity: 'Editing server/index.ts', meta: '12s', clickable: false },
  render: (a) => (
    <AgentNode
      label={String(a.label)}
      state={a.state as AgentNodeState}
      model={a.model === 'other' ? 'custom-model' : String(a.model)}
      activity={String(a.activity) || undefined}
      meta={String(a.meta) || undefined}
      onClick={a.clickable ? () => undefined : undefined}
      className="w-full max-w-sm"
    />
  ),
  code: (a) =>
    jsx('AgentNode', {
      label: String(a.label),
      state: a.state,
      model: String(a.model),
      activity: String(a.activity) || undefined,
      meta: String(a.meta) || undefined,
      onClick: a.clickable ? '{() => open(agent)}' : undefined,
    }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'Follows one agent of a simulated run through queued, running and done or failed.',
      wide: true,
      render: () => <Live />,
    },
    ...STATES.map((s) => ({
      id: s,
      name: s[0]!.toUpperCase() + s.slice(1),
      render: () => (
        <AgentNode
          label="Review 1"
          state={s}
          model="opus"
          activity={ACTIVITY[s]}
          meta={s === 'queued' ? undefined : '8s'}
          className="w-full max-w-sm"
        />
      ),
    })),
    {
      id: 'models',
      name: 'Models',
      note: 'opus, sonnet, haiku and fable each get a badge hue; anything else is neutral.',
      wide: true,
      render: () => (
        <div className="grid w-full gap-2 sm:grid-cols-2">
          {MODELS.map((m) => (
            <AgentNode key={m} label={`Agent on ${m}`} state="done" model={m === 'other' ? 'custom-model' : m} activity="Finished" />
          ))}
        </div>
      ),
    },
  ],
  usage: `import { AgentNode } from '@nish/ui';

<AgentNode
  label={agent.label}
  state={agent.state}
  model={agent.model}
  activity={agent.activity}
  meta={elapsed}
/>`,
  guidelines: [
    'Use it for a unit of work that has its own state. Group several in a WorkflowBoard when they belong to phases.',
    'Keep activity to a short line; it truncates. It animates when the text changes.',
    'Pass onClick to make the whole card a button, for opening the details of the agent.',
    'State is also in words for screen readers: Queued, Running, Done or Failed.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
