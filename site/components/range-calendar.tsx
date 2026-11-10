import { useState } from 'react';
import { RangeCalendar, type DateRange } from '../../src/components/range-calendar';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- RangeCalendar -------------------------------------------------------------------

function Controlled() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="grid gap-1">
      <RangeCalendar value={range} onValueChange={setRange} defaultMonth="2026-11" />
      <p className="text-xs text-th-hi3">Picked: {range ? `${range.from} to ${range.to}` : 'none'}</p>
    </div>
  );
}

const isWeekend = (iso: string): boolean => {
  const d = new Date(0);
  d.setUTCFullYear(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const w = d.getUTCDay();
  return w === 0 || w === 6;
};

export const rangeCalendar: ComponentDoc = {
  id: 'range-calendar',
  name: 'RangeCalendar',
  exports: ['RangeCalendar'],
  summary:
    'A month grid that picks a range of days: the first press sets the start, the second the end, and the days between light up as the pointer or focus moves. The value is { from, to } as YYYY-MM-DD strings.',
  importLine: "import { RangeCalendar } from '@nish/ui';",
  controls: [
    {
      key: 'locale',
      label: 'Locale',
      type: 'select',
      options: ['en-US', 'de-DE', 'ar-EG'],
    },
    { key: 'weekends', label: 'Weekends disabled', type: 'boolean' },
    { key: 'allowDisabled', label: 'Range may cover disabled days', type: 'boolean' },
  ],
  initial: { locale: 'en-US', weekends: false, allowDisabled: false },
  render: (a) => (
    <RangeCalendar
      key={`${a.locale}-${a.weekends}-${a.allowDisabled}`}
      locale={String(a.locale)}
      isDateDisabled={a.weekends ? isWeekend : undefined}
      allowDisabledInRange={a.allowDisabled ? true : undefined}
      dir={a.locale === 'ar-EG' ? 'rtl' : undefined}
    />
  ),
  code: (a) =>
    jsx('RangeCalendar', {
      locale: a.locale === 'en-US' ? undefined : a.locale,
      isDateDisabled: a.weekends ? '{isWeekend}' : undefined,
      allowDisabledInRange: a.allowDisabled ? true : undefined,
      dir: a.locale === 'ar-EG' ? 'rtl' : undefined,
    }),
  stories: [
    {
      id: 'basic',
      name: 'Basic',
      render: () => <RangeCalendar defaultValue={{ from: '2026-11-05', to: '2026-11-09' }} aria-label="Pick a range" />,
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
    {
      id: 'min-max',
      name: 'Min and max',
      note: 'Days outside the range cannot be picked, and the month buttons stop at the range.',
      render: () => <RangeCalendar min="2026-11-03" max="2026-11-24" defaultMonth="2026-11" />,
    },
    {
      id: 'weekends',
      name: 'Weekends disabled',
      note: 'A range cannot cover a disabled day; a second press past one starts a new range there.',
      render: () => <RangeCalendar isDateDisabled={isWeekend} defaultMonth="2026-11" />,
    },
    {
      id: 'allow-disabled',
      name: 'Ranges over weekends',
      note: 'allowDisabledInRange lets the range cover disabled days; its ends still cannot be disabled days.',
      render: () => <RangeCalendar isDateDisabled={isWeekend} allowDisabledInRange defaultMonth="2026-11" />,
    },
  ],
  usage: `import { RangeCalendar } from '@nish/ui';

<RangeCalendar value={range} onValueChange={setRange} min="2026-01-01" />`,
  guidelines: [
    'Use DateRangePicker for a form field; use RangeCalendar on its own when the month view is the page content (a booking page).',
    'The first press sets the start and the second the end. An earlier second day swaps them; the same day twice is a one-day range.',
    'Escape drops a start that has no end yet.',
    'onValueChange runs once both ends are picked; a half-picked range is never reported.',
    'Values are YYYY-MM-DD strings with no time zone, and to is included in the range.',
  ],
  api: { functions: [], interfaces: ['DateRange'] },
};
