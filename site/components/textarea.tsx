import { useState } from 'react';
import { Card } from '../../src';
import { Field, Textarea } from '../../src/components/forms';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Textarea ------------------------------------------------------------------------

function Composer() {
  const [text, setText] = useState('Ask about this job.\nSecond line grows the box.');
  return (
    <Textarea
      aria-label="Message"
      rows={1}
      autoGrow={{ maxRows: 5 }}
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Ask about this job"
    />
  );
}

export const textarea: ComponentDoc = {
  id: 'textarea',
  name: 'Textarea',
  exports: ['Textarea'],
  summary:
    'Multi-line text with the shared field look: 16px text on phones so iOS does not zoom, vertical resize, an invalid state, a small size, and autoGrow for composers.',
  importLine: "import { Textarea } from '@nish/ui';",
  controls: [
    { key: 'rows', label: 'Rows', type: 'select', options: ['3', '4', '6'] },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'autoGrow', label: 'Auto grow', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { rows: '4', size: 'md', autoGrow: false, invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Field label="Notes" error={a.invalid ? 'Keep it under 500 characters.' : undefined}>
        <Textarea
          rows={Number(a.rows)}
          size={a.size === 'sm' ? 'sm' : 'md'}
          autoGrow={!!a.autoGrow}
          disabled={!!a.disabled}
          placeholder="Why this trade, what would make you close it"
        />
      </Field>
    </div>
  ),
  code: (a) =>
    jsx('Textarea', {
      rows: a.rows === '4' ? undefined : Number(a.rows),
      size: a.size === 'md' ? undefined : a.size,
      autoGrow: a.autoGrow,
      invalid: a.invalid,
      disabled: a.disabled,
    }),
  stories: [
    { id: 'label', name: 'With a label', render: () => <div className="w-full max-w-sm"><Field label="Paste a resume"><Textarea rows={3} defaultValue="Senior engineer, 8 years of TypeScript and React." /></Field></div> },
    { id: 'invalid', name: 'Invalid', render: () => <div className="w-full max-w-sm"><Field label="Notes" error="Keep it under 500 characters."><Textarea defaultValue="Too long" /></Field></div> },
    { id: 'sm', name: 'Small', render: () => <div className="w-full max-w-sm"><Field label="Comment"><Textarea size="sm" rows={3} defaultValue="Dense panels use the small size." /></Field></div> },
    { id: 'autogrow', name: 'Auto grow (max 5 rows)', note: 'Type to grow it; past five lines it scrolls.', render: () => <div className="w-full max-w-sm"><Composer /></div> },
    { id: 'disabled', name: 'Disabled', render: () => <div className="w-full max-w-sm"><Textarea aria-label="Import log" disabled defaultValue="Read only while the import runs." /></div> },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card className="w-full max-w-md">
          <Field label="Trade notes" hint="Only you can see these.">
            <Textarea rows={3} defaultValue="Sold half at the 50-day line." />
          </Field>
        </Card>
      ),
    },
  ],
  usage: `import { Field, Textarea } from '@nish/ui';

<Field label="Notes">
  <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
</Field>

// A chat composer that grows up to five lines
<Textarea aria-label="Message" rows={1} autoGrow={{ maxRows: 5 }} value={msg} onChange={…} />`,
  guidelines: [
    'Pair it with a label (Field does it); a placeholder is not a label.',
    'For errors, use Field error: it sets invalid and ties the message with aria-describedby.',
    'autoGrow uses rows as the minimum height and turns off the manual resize handle.',
  ],
};
