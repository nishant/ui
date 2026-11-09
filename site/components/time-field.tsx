import { useState, type FormEvent } from 'react';
import { DatePicker } from '../../src/components/date-picker';
import { Field, FieldGroup } from '../../src/components/forms';
import { Button } from '../../src/components/primitives';
import { TimeField } from '../../src/components/time-field';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- TimeField ---------------------------------------------------------------------

function DateTimeDemo() {
  const [date, setDate] = useState<string | null>('2026-11-05');
  const [time, setTime] = useState<string | null>('09:30');
  return (
    <div className="grid gap-3 self-start">
      <FieldGroup label="Starts">
        <div className="flex flex-wrap gap-3">
          <Field label="Date">
            <DatePicker value={date} onValueChange={setDate} />
          </Field>
          <Field label="Time">
            <TimeField value={time} onValueChange={setTime} />
          </Field>
        </div>
      </FieldGroup>
      <p className="text-xs text-th-hi3">{date && time ? `Value: ${date}T${time}` : 'Value: none'}</p>
    </div>
  );
}

function FormDemo() {
  const [posted, setPosted] = useState('nothing yet');
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const start = new FormData(e.currentTarget).get('start');
    setPosted(typeof start === 'string' && start !== '' ? start : 'empty');
  };
  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-xs gap-3 self-start">
      <Field label="Start time">
        <TimeField name="start" defaultValue="09:30" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="primary">
          Save
        </Button>
        <p className="text-xs text-th-hi3">start = {posted}</p>
      </div>
    </form>
  );
}

export const timeField: ComponentDoc = {
  id: 'time-field',
  name: 'TimeField',
  exports: ['TimeField'],
  summary:
    'A time field: an hour box and a minute box, plus AM/PM where the locale uses it. Arrow keys step each box, typing moves on to the minutes, and the value is HH:mm in 24-hour time, like <input type="time">.',
  importLine: "import { TimeField } from '@nish/ui';",
  controls: [
    { key: 'hourCycle', label: 'Hour cycle', type: 'select', options: ['locale', '12', '24'] },
    { key: 'step', label: 'Step', type: 'select', options: ['1', '5', '15', '30'] },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
  ],
  initial: { hourCycle: 'locale', step: '1', size: 'md', disabled: false, invalid: false },
  render: (a) => (
    <TimeField
      key={`${a.hourCycle}-${a.step}-${a.size}-${a.disabled}-${a.invalid}`}
      aria-label="Start time"
      defaultValue="09:30"
      hourCycle={a.hourCycle === '12' ? 12 : a.hourCycle === '24' ? 24 : undefined}
      step={Number(a.step)}
      size={a.size === 'sm' ? 'sm' : 'md'}
      disabled={!!a.disabled}
      invalid={!!a.invalid}
    />
  ),
  code: (a) =>
    jsx('TimeField', {
      'aria-label': 'Start time',
      defaultValue: '09:30',
      hourCycle: a.hourCycle === 'locale' ? undefined : Number(a.hourCycle),
      step: a.step === '1' ? undefined : Number(a.step),
      size: a.size === 'md' ? undefined : a.size,
      disabled: a.disabled,
      invalid: a.invalid,
    }),
  stories: [
    {
      id: 'basic',
      name: 'Basic',
      render: () => <TimeField aria-label="Start time" />,
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <Field label="Start time" hint="Type it or use the arrow keys.">
          <TimeField />
        </Field>
      ),
    },
    {
      id: '24-hour',
      name: '24-hour clock',
      render: () => <TimeField aria-label="Departure" hourCycle={24} defaultValue="18:45" />,
    },
    {
      id: 'step',
      name: '15-minute steps',
      note: 'ArrowUp and ArrowDown move by 15 minutes; a typed minute is kept as typed.',
      render: () => <TimeField aria-label="Appointment" step={15} defaultValue="09:00" />,
    },
    {
      id: 'limits',
      name: 'Office hours',
      note: 'A time outside 09:00 to 17:30 marks the field invalid and is not reported.',
      render: () => <TimeField aria-label="Meeting time" min="09:00" max="17:30" defaultValue="10:00" />,
    },
    {
      id: 'date-time',
      name: 'With a date',
      render: () => <DateTimeDemo />,
    },
    {
      id: 'form',
      name: 'In a form',
      note: 'A hidden input posts the HH:mm value under name.',
      render: () => <FormDemo />,
    },
  ],
  usage: `import { TimeField } from '@nish/ui';

<TimeField aria-label="Start time" name="start" value={time} onValueChange={setTime} step={15} />`,
  guidelines: [
    'The value is HH:mm in 24-hour time with no time zone. Join it with a date as YYYY-MM-DDTHH:mm and turn that into an instant on the server, in the zone the user meant.',
    'Type 9 then 30, or 9:30. A digit that cannot start a two-digit hour moves on to the minutes; on a 12-hour clock A and P set AM and PM.',
    'ArrowUp and ArrowDown step the focused box (minutes by step), Home and End go to its first and last value.',
    'Inside a Field the label names both boxes (Start time Hour, Start time Minute); outside one, give it an aria-label.',
    'A min after max is a range that wraps past midnight: min="22:00" max="06:00" accepts 23:30 and 05:00 but not 12:00.',
  ],
};
