import { useState, type FormEvent } from 'react';
import { DateRangePicker } from '../../src/components/date-range-picker';
import { Field } from '../../src/components/forms';
import { Button } from '../../src/components/primitives';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- DateRangePicker (framed) --------------------------------------------------------

function FormDemo() {
  const [posted, setPosted] = useState('nothing yet');
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trip = new FormData(e.currentTarget).get('trip');
    setPosted(typeof trip === 'string' && trip !== '' ? trip : 'empty');
  };
  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-xs gap-3 self-start">
      <Field label="Trip dates">
        <DateRangePicker name="trip" defaultValue={{ from: '2026-11-05', to: '2026-11-09' }} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="primary">
          Save
        </Button>
        <p className="text-xs text-th-hi3">trip = {posted}</p>
      </div>
    </form>
  );
}

const isWeekend = (iso: string) => {
  const w = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return w === 0 || w === 6;
};

export const dateRangePicker: ComponentDoc = {
  id: 'date-range-picker',
  name: 'DateRangePicker',
  exports: ['DateRangePicker'],
  summary:
    "A date range field: type both dates in the reader's own format or pick them from a range calendar. The value is { from, to } as YYYY-MM-DD strings, and it posts as one from/to value.",
  importLine: "import { DateRangePicker } from '@nish/ui';",
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
      <DateRangePicker
        aria-label="Trip dates"
        defaultValue={{ from: '2026-11-05', to: '2026-11-09' }}
        size={a.size === 'sm' ? 'sm' : 'md'}
        captionLayout={a.captionLayout === 'dropdowns' ? 'dropdowns' : 'label'}
        disabled={!!a.disabled}
        invalid={!!a.invalid}
      />
    </div>
  ),
  code: (a) =>
    jsx('DateRangePicker', {
      'aria-label': 'Trip dates',
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
          <DateRangePicker aria-label="Trip dates" />
        </div>
      ),
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <Field label="Trip dates" hint="Type them or pick them.">
            <DateRangePicker />
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
          <DateRangePicker aria-label="Stay" min="2026-11-03" max="2026-12-20" />
        </div>
      ),
    },
    {
      id: 'weekdays',
      name: 'Weekdays only',
      note: 'A range that covers a weekend day is refused unless allowDisabledInRange is set.',
      render: () => (
        <div className="w-full max-w-xs self-start">
          <DateRangePicker aria-label="Working days" isDateDisabled={isWeekend} />
        </div>
      ),
    },
    {
      id: 'form',
      name: 'In a form',
      note: 'A hidden input posts the range as from/to under name.',
      render: () => <FormDemo />,
    },
  ],
  usage: `import { DateRangePicker } from '@nish/ui';

<DateRangePicker aria-label="Trip dates" name="trip" value={trip} onValueChange={setTrip} />`,
  guidelines: [
    "Type both dates in the reader's numeric order with any separator between them: 11/05/2026 – 11/09/2026, 11/05/2026 11/09/2026 or 2026-11-05/2026-11-09. One date is a one-day range.",
    'A range that cannot be read, falls outside min and max, or covers a disabled day marks the field invalid and keeps the text; pair it with a Field error.',
    'With name, a hidden input posts from/to (an ISO 8601 interval), for example 2026-11-05/2026-11-09; split it on the slash on the server.',
    'The popover closes when the second day is picked. Escape first drops a half-picked range, then closes the popover.',
  ],
};
