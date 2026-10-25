import { Textarea } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Textarea ------------------------------------------------------------------------

export const textarea: ComponentDoc = {
  id: 'textarea',
  name: 'Textarea',
  exports: ['Textarea'],
  summary: 'Multi-line text with the shared field look: 16px text on phones so iOS does not zoom, vertical resize, and an invalid state.',
  importLine: "import { Textarea } from '@nish/ui';",
  controls: [
    { key: 'rows', label: 'Rows', type: 'select', options: ['3', '4', '6'] },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { rows: '4', invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Field label="Notes" error={a.invalid ? 'Keep it under 500 characters.' : undefined} id="canvas-textarea-msg">
        <Textarea
          rows={Number(a.rows)}
          invalid={!!a.invalid}
          disabled={!!a.disabled}
          placeholder="Why this trade, what would make you close it"
          aria-describedby={a.invalid ? 'canvas-textarea-msg' : undefined}
        />
      </Field>
    </div>
  ),
  code: (a) => jsx('Textarea', { rows: a.rows === '4' ? undefined : Number(a.rows), invalid: a.invalid, disabled: a.disabled }),
  stories: [
    { id: 'label', name: 'With a label', render: () => <div className="w-full max-w-sm"><Field label="Paste a resume"><Textarea rows={3} defaultValue="Senior engineer, 8 years of TypeScript and React." /></Field></div> },
    { id: 'invalid', name: 'Invalid', render: () => <div className="w-full max-w-sm"><Field label="Notes" error="Keep it under 500 characters." id="story-textarea-err"><Textarea invalid aria-describedby="story-textarea-err" defaultValue="Too long" /></Field></div> },
    { id: 'disabled', name: 'Disabled', render: () => <div className="w-full max-w-sm"><Textarea disabled defaultValue="Read only while the import runs." /></div> },
  ],
  usage: `import { Label, Textarea } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Notes</Label>
  <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
</label>`,
  guidelines: [
    'Pair it with a Label; a placeholder is not a label.',
    'For errors, set invalid and point aria-describedby at the message.',
  ],
};
