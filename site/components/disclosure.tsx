import { useState } from 'react';
import { Button, Card } from '../../src';
import { Disclosure } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Disclosure ---------------------------------------------------------------------

function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid w-full gap-2">
      <Row>
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? 'Collapse' : 'Expand'} from outside
        </Button>
      </Row>
      <Disclosure summary="Fees and limits" open={open} onOpenChange={setOpen} variant="card">
        $0.65 per contract. Up to 100 open orders.
      </Disclosure>
    </div>
  );
}

export const disclosure: ComponentDoc = {
  id: 'disclosure',
  name: 'Disclosure',
  exports: ['Disclosure'],
  summary:
    'Show more on native <details> and <summary>: keyboard, screen readers and find-in-page work without script, with a chevron that turns when open.',
  importLine: "import { Disclosure } from '@nish/ui';",
  controls: [
    { key: 'summary', label: 'Summary', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: ['plain', 'card'] },
    { key: 'defaultOpen', label: 'Default open', type: 'boolean' },
  ],
  initial: { summary: 'How is the score computed?', variant: 'card', defaultOpen: true },
  render: (a) => (
    <Disclosure
      key={String(a.defaultOpen)}
      summary={String(a.summary)}
      variant={a.variant as 'card'}
      defaultOpen={!!a.defaultOpen}
      className="w-full max-w-md"
    >
      Skills match counts 60%, seniority 25% and location 15%. Scores of 75 and up are a strong fit.
    </Disclosure>
  ),
  code: (a) =>
    jsx(
      'Disclosure',
      { summary: a.summary, variant: a.variant === 'plain' ? undefined : a.variant, defaultOpen: a.defaultOpen || undefined },
      '…',
    ),
  stories: [
    {
      id: 'plain',
      name: 'Plain',
      render: () => (
        <div className="grid w-full gap-1">
          <Disclosure summary="Show 3 older checks">
            <ul className="grid gap-1 text-xs text-th-hi3">
              <li>Oct 24, 3:00 pm: up, 41 ms</li>
              <li>Oct 24, 2:55 pm: up, 39 ms</li>
              <li>Oct 24, 2:50 pm: up, 44 ms</li>
            </ul>
          </Disclosure>
          <Disclosure summary="Raw response" defaultOpen>
            <pre className="overflow-x-auto rounded-lg bg-th-elevated p-2 font-mono text-xs text-th-hi2">{'{ "status": 200 }'}</pre>
          </Disclosure>
        </div>
      ),
    },
    {
      id: 'card',
      name: 'Card',
      render: () => (
        <div className="grid w-full gap-2">
          <Disclosure summary="Shipping" variant="card">
            Free over $35. Arrives in 2 to 4 days.
          </Disclosure>
          <Disclosure summary="Returns" variant="card" defaultOpen>
            30 days, in the original box.
          </Disclosure>
        </div>
      ),
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
    {
      id: 'in-card',
      name: 'Plain, in a card',
      render: () => (
        <Card className="w-full max-w-md">
          <p className="text-sm font-semibold text-th-hi">Senior Frontend Engineer</p>
          <p className="mt-0.5 text-xs text-th-hi3">Austin, hybrid · posted 2 days ago</p>
          <Disclosure summary="Job description" className="mt-2">
            Build the design system and the dashboards that sit on it.
          </Disclosure>
        </Card>
      ),
    },
  ],
  usage: `import { Disclosure } from '@nish/ui';

<Disclosure summary="Advanced filters" variant="card">
  <FilterForm />
</Disclosure>`,
  guidelines: [
    'For secondary detail people may want, not for primary content: collapsed text is easy to miss.',
    'The summary should say what opens ("Show 3 older checks"), not just "More".',
    'For a whole-page FAQ, stack card disclosures with gap-2.',
  ],
};
