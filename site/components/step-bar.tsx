import { Card, StepBar } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { useFlowDemo } from './flow-demo';

// --- StepBar ------------------------------------------------------------------------

function Live() {
  const demo = useFlowDemo();
  return (
    <div className="grid w-full max-w-md gap-2">
      <StepBar total={demo.total} done={demo.done} active={demo.running} label="Demo plan" />
      <span className="text-xs tabular-nums text-th-hi3">
        {demo.done} of {demo.total}
      </span>
    </div>
  );
}

const Box = ({ children }: { children: React.ReactNode }) => <div className="w-full max-w-xs">{children}</div>;

export const stepBar: ComponentDoc = {
  id: 'step-bar',
  name: 'StepBar',
  exports: ['StepBar'],
  summary: 'A compact row of segments for how far through a list of steps you are. The current segment can pulse.',
  importLine: "import { StepBar } from '@nish/ui';",
  controls: [
    { key: 'total', label: 'Total', type: 'number', min: 1, max: 20 },
    { key: 'done', label: 'Done', type: 'number', min: 0, max: 20 },
    { key: 'active', label: 'Active', type: 'boolean' },
  ],
  initial: { total: 6, done: 2, active: true },
  render: (a) => (
    <div className="w-full max-w-md">
      <StepBar total={Number(a.total)} done={Number(a.done)} active={!!a.active} />
    </div>
  ),
  code: (a) => jsx('StepBar', { total: Number(a.total), done: Number(a.done), active: a.active || undefined }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'A simulated run: one step every 1.6 seconds, then it starts over.',
      wide: true,
      render: () => (
        <Card className="w-full">
          <Live />
        </Card>
      ),
    },
    {
      id: 'pending',
      name: 'Nothing done',
      render: () => (
        <Box>
          <StepBar total={6} done={0} />
        </Box>
      ),
    },
    {
      id: 'mid-run',
      name: 'Mid-run',
      render: () => (
        <Box>
          <StepBar total={6} done={3} active />
        </Box>
      ),
    },
    {
      id: 'done',
      name: 'All done',
      render: () => (
        <Box>
          <StepBar total={6} done={6} />
        </Box>
      ),
    },
    {
      id: 'many',
      name: 'More than 12 steps',
      note: 'Above 12 it becomes one continuous bar.',
      render: () => (
        <Box>
          <StepBar total={20} done={7} active />
        </Box>
      ),
    },
    {
      id: 'clamp',
      name: 'Done above total',
      note: 'The count clamps to the total.',
      render: () => (
        <Box>
          <StepBar total={4} done={9} />
        </Box>
      ),
    },
  ],
  usage: `import { StepBar } from '@nish/ui';

<StepBar total={plan.length} done={plan.filter((s) => s.done).length} active={working} />`,
  guidelines: [
    'Use it where there is little room, such as a card in a list. Use FlowSteps when the step names matter.',
    'Say the numbers in text beside it ("3 of 6"). The bar is a progressbar for screen readers, but sighted people want the count.',
    'Set active only while work is running, so the current segment pulses.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
