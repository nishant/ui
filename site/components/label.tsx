import { Badge, Card, Field, Input, Label } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Label --------------------------------------------------------------------------

export const label: ComponentDoc = {
  id: 'label',
  name: 'Label',
  exports: ['Label'],
  summary: 'The small uppercase label over sections of a card. For form fields, use Field.',
  importLine: "import { Label } from '@nish/ui';",
  controls: [{ key: 'text', label: 'Text', type: 'text' }],
  initial: { text: 'Price target' },
  render: (a) => <Label>{String(a.text)}</Label>,
  code: (a) => jsx('Label', {}, String(a.text)),
  html: {
    height: 120,
    code: `<label class="nish-field" style="max-width:24rem">
  <span class="nish-label">Server name</span>
  <input class="nish-input" value="Survival">
</label>`,
  },
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
  usage: `import { Field, Input, Label } from '@nish/ui';

// Form field: Field draws the sentence-case label and wires the ids.
<Field label="Email">
  <Input type="email" />
</Field>

// Section or card label: Label.
<Label>Upcoming</Label>`,
  guidelines: [
    'Label renders a span. It is for section and card labels. For a form field, use Field, which gives the control a real <label>. If you must label a control yourself, wrap both in a <label> or use htmlFor.',
    'Label takes ref and any span attribute.',
  ],
};
