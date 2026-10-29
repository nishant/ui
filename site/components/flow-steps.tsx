import { Card, FlowSteps, type FlowStepItem, type FlowStepStatus } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { DEMO_STEP_LABELS, useFlowDemo } from './flow-demo';

// --- FlowSteps ----------------------------------------------------------------------

function build(count: number, active: number, failed = false, labels = DEMO_STEP_LABELS): FlowStepItem[] {
  return Array.from({ length: count }, (_, i) => {
    let status: FlowStepStatus = i < active ? 'done' : i === active ? 'active' : 'pending';
    if (failed && i === active) status = 'failed';
    return { id: `s${i + 1}`, label: labels[i % labels.length]!, status };
  });
}

function Live({ orientation }: { orientation: 'auto' | 'vertical' | 'horizontal' }) {
  const demo = useFlowDemo();
  return <FlowSteps steps={demo.steps} orientation={orientation} label="Demo plan" className="w-full" />;
}

const LONG = [
  'Read the whole specification and every file it points to before changing anything',
  'Write the plan',
  'Build it',
  'Check it twice, then once more for the narrow screen',
];

export const flowSteps: ComponentDoc = {
  id: 'flow-steps',
  name: 'FlowSteps',
  exports: ['FlowSteps'],
  summary:
    'An animated list of steps joined by connectors: the active step spins and ripples, a finished step draws its check, and the line fills behind it.',
  importLine: "import { FlowSteps } from '@nish/ui';",
  controls: [
    { key: 'orientation', label: 'Orientation', type: 'select', options: ['auto', 'vertical', 'horizontal'] },
    { key: 'count', label: 'Steps', type: 'number', min: 1, max: 12 },
    { key: 'active', label: 'Active step (past the end = all done)', type: 'number', min: 0, max: 12 },
    { key: 'failed', label: 'Active step failed', type: 'boolean' },
  ],
  initial: { orientation: 'auto', count: 6, active: 2, failed: false },
  render: (a) => (
    <FlowSteps
      steps={build(Number(a.count), Number(a.active), !!a.failed)}
      orientation={a.orientation as 'auto'}
      className="w-full"
    />
  ),
  code: (a) =>
    jsx('FlowSteps', {
      steps: '{steps}',
      orientation: a.orientation === 'auto' ? undefined : a.orientation,
    }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'A simulated run: one step every 1.6 seconds, then it starts over.',
      wide: true,
      render: () => (
        <Card className="w-full">
          <Live orientation="auto" />
        </Card>
      ),
    },
    {
      id: 'pending',
      name: 'All pending',
      render: () => <FlowSteps steps={build(5, -1)} orientation="vertical" className="w-full max-w-sm" />,
    },
    {
      id: 'mid-run',
      name: 'Mid-run',
      render: () => <FlowSteps steps={build(5, 2)} orientation="vertical" className="w-full max-w-sm" />,
    },
    {
      id: 'done',
      name: 'All done',
      render: () => <FlowSteps steps={build(5, 5)} orientation="vertical" className="w-full max-w-sm" />,
    },
    {
      id: 'failed',
      name: 'Failed',
      render: () => <FlowSteps steps={build(5, 3, true)} orientation="vertical" className="w-full max-w-sm" />,
    },
    {
      id: 'horizontal',
      name: 'Horizontal',
      note: 'Labels sit under the nodes and clamp to two lines.',
      wide: true,
      render: () => <FlowSteps steps={build(4, 1, false, LONG)} orientation="horizontal" className="w-full" />,
    },
    {
      id: 'long',
      name: 'Long labels, vertical',
      note: 'Long labels wrap; each row stays at least 44px tall.',
      render: () => <FlowSteps steps={build(4, 1, false, LONG)} orientation="vertical" className="w-full max-w-sm" />,
    },
  ],
  usage: `import { FlowSteps } from '@nish/ui';

<FlowSteps
  label="Plan"
  steps={plan.map((s) => ({ id: s.id, label: s.text, status: s.status }))}
/>`,
  guidelines: [
    'Use it for the steps of one piece of work that moves forward over time. For a plain count, use StepBar.',
    'Keep ids stable between updates. Animations play when an id changes status, so a new id replays them.',
    'auto lays the steps out sideways when the box is at least 640px wide and there are at most 8 steps; otherwise they stack.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
