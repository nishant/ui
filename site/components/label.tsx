import { Badge, Card, Input, Label } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Label --------------------------------------------------------------------------

export const label: ComponentDoc = {
  id: 'label',
  name: 'Label',
  exports: ['Label'],
  summary: 'The small uppercase label above fields and over sections of a card.',
  importLine: "import { Label } from '@nish/ui';",
  controls: [{ key: 'text', label: 'Text', type: 'text' }],
  initial: { text: 'Price target' },
  render: (a) => <Label>{String(a.text)}</Label>,
  code: (a) => jsx('Label', {}, String(a.text)),
  stories: [
    {
      id: 'field',
      name: 'Field label',
      render: () => (
        <Field label="Email">
          <Input type="email" defaultValue="me@nish.software" />
        </Field>
      ),
    },
    {
      id: 'section',
      name: 'Section heading in a card',
      render: () => (
        <Card className="w-full space-y-2">
          <Label>Upcoming</Label>
          <p className="text-sm text-th-hi">Interview with Linear, Thursday 2 pm</p>
          <p className="text-sm text-th-hi">Offer call with Vercel, Friday 11 am</p>
        </Card>
      ),
    },
    {
      id: 'count',
      name: 'With a count',
      render: () => (
        <div className="flex items-center gap-2">
          <Label>Watchlist</Label>
          <Badge>14</Badge>
        </div>
      ),
    },
  ],
  usage: `import { Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Email</Label>
  <Input type="email" />
</label>`,
  guidelines: [
    'Label renders a span. Wrap the Label and the field in a <label> element (or use htmlFor on your own label) so clicking it focuses the field.',
  ],
};
