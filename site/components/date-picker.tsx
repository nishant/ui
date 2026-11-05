import { useState, type FormEvent } from 'react';
import { DatePicker } from '../../src/components/date-picker';
import { Field } from '../../src/components/forms';
import { Button } from '../../src/components/primitives';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- DatePicker (framed) -------------------------------------------------------------

function FormDemo() {
  const [posted, setPosted] = useState('nothing yet');
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const due = new FormData(e.currentTarget).get('due');
    setPosted(typeof due === 'string' && due !== '' ? due : 'empty');
  };
  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-xs gap-3 self-start">
      <Field label="Due date">
        <DatePicker name="due" defaultValue="2026-11-05" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="primary">
          Save
        </Button>
        <p className="text-xs text-th-hi3">due = {posted}</p>
      </div>
    </form>
  );
}

export const datePicker: ComponentDoc = {
  id: 'date-picker',
  name: 'DatePicker',
  exports: ['DatePicker'],
  summary:
    "A date field: type the date in the reader's own format or pick it from a calendar. The value is a YYYY-MM-DD string, like a native date input, and it posts with a form.",
  importLine: "import { DatePicker } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    {
      key: 'captionLayout',
      label: 'Caption',
      type: 'select',
      options: ['label', 'dropdowns'],
    },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
  ],
  initial: {
    size: 'md',
    captionLayout: 'label',
    disabled: false,
    invalid: false,
  },
  render: (a) => (
    <div className="w-full max-w-xs self-start">
      <DatePicker
        aria-label="Due date"
        defaultValue="2026-11-05"
        size={a.size === 'sm' ? 'sm' : 'md'}
        captionLayout={a.captionLayout === 'dropdowns' ? 'dropdowns' : 'label'}
        disabled={!!a.disabled}
        invalid={!!a.invalid}
      />
    </div>
  ),
  code: (a) =>
    jsx('DatePicker', {
      'aria-label': 'Due date',
      size: a.size === 'md' ? undefined : a.size,
      captionLayout: a.captionLayout === 'label' ? undefined : a.captionLayout,
      disabled: a.disabled,
      invalid: a.invalid,
    }),
  framed: { height: 620 },
  stories: [
    {
      id: 'basic',
      name: 'Basic',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <DatePicker aria-label="Due date" />
        </div>
      ),
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <Field label="Due date" hint="Type it or pick it.">
            <DatePicker />
          </Field>
        </div>
      ),
    },
    {
      id: 'limits',
      name: 'Min and max',
      note: 'Dates outside the range are disabled in the calendar and refused when typed.',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <DatePicker aria-label="Delivery date" min="2026-11-03" max="2026-12-20" />
        </div>
      ),
    },
    {
      id: 'birthday',
      name: 'Birth date',
      note: 'Month and year selects for far jumps.',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <DatePicker aria-label="Birth date" captionLayout="dropdowns" max="2026-11-05" />
        </div>
      ),
    },
    {
      id: 'form',
      name: 'In a form',
      note: 'A hidden input posts the YYYY-MM-DD value under name.',
      render: () => <FormDemo />,
    },
  ],
  usage: `import { DatePicker } from '@nish/ui';

<DatePicker aria-label="Due date" name="due" value={due} onValueChange={setDue} min="2026-01-01" />`,
  guidelines: [
    "Typing works in the reader's numeric order (11/05/2026 in the US, 05.11.2026 in Germany) and in ISO (2026-11-05).",
    'A date that cannot be read, or is outside min and max, marks the field invalid and keeps the text; pair it with a Field error.',
    'The calendar button is the only Tab stop besides the text box; Alt+Down opens it from the text box.',
    'For a date in a filter bar or a table cell, the native <input type="date"> through Input is still fine.',
  ],
};
