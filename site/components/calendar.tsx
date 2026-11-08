import { useState } from 'react';
import { Calendar } from '../../src/components/calendar';
import { addDays, isoToday } from '../../src/components/calendar-classes';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Calendar ------------------------------------------------------------------------

function Controlled() {
  const [day, setDay] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <Calendar value={day} onValueChange={setDay} defaultMonth="2026-11" />
      <p className="text-xs text-th-hi3">Picked: {day ?? 'none'}</p>
    </div>
  );
}

const isWeekend = (iso: string): boolean => {
  const d = new Date(0);
  d.setUTCFullYear(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const w = d.getUTCDay();
  return w === 0 || w === 6;
};

export const calendar: ComponentDoc = {
  id: 'calendar',
  name: 'Calendar',
  exports: ['Calendar'],
  summary:
    "A month grid that picks one day. Arrow keys move by day and week, Page Up and Page Down by month (with Shift, by year), Home and End to the week's ends. Month and weekday names come from Intl in the reader's locale.",
  importLine: "import { Calendar } from '@nish/ui';",
  controls: [
    {
      key: 'captionLayout',
      label: 'Caption',
      type: 'select',
      options: ['label', 'dropdowns'],
    },
    {
      key: 'locale',
      label: 'Locale',
      type: 'select',
      options: ['en-US', 'en-GB', 'de-DE', 'ja-JP', 'ar-EG'],
    },
    { key: 'limits', label: 'Min and max', type: 'boolean' },
  ],
  initial: { captionLayout: 'label', locale: 'en-US', limits: false },
  render: (a) => {
    const today = isoToday();
    return (
      <Calendar
        key={`${a.locale}-${a.captionLayout}-${a.limits}`}
        locale={String(a.locale)}
        captionLayout={a.captionLayout === 'dropdowns' ? 'dropdowns' : 'label'}
        min={a.limits ? addDays(today, -30) : undefined}
        max={a.limits ? addDays(today, 60) : undefined}
        dir={a.locale === 'ar-EG' ? 'rtl' : undefined}
      />
    );
  },
  code: (a) =>
    jsx('Calendar', {
      locale: a.locale === 'en-US' ? undefined : a.locale,
      captionLayout: a.captionLayout === 'label' ? undefined : a.captionLayout,
      min: a.limits ? '{min}' : undefined,
      max: a.limits ? '{max}' : undefined,
    }),
  stories: [
    {
      id: 'basic',
      name: 'Basic',
      render: () => <Calendar defaultValue="2026-11-05" aria-label="Pick a day" />,
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
    {
      id: 'min-max',
      name: 'Min and max',
      note: 'Days outside the range cannot be picked, and the month buttons stop at the range.',
      render: () => <Calendar min="2026-11-03" max="2026-11-24" defaultMonth="2026-11" />,
    },
    {
      id: 'weekends',
      name: 'Weekends disabled',
      render: () => <Calendar isDateDisabled={isWeekend} defaultMonth="2026-11" />,
    },
    {
      id: 'dropdowns',
      name: 'Month and year selects',
      note: 'For far jumps such as birth dates.',
      render: () => <Calendar captionLayout="dropdowns" fromYear={1940} toYear={2030} defaultValue="1990-06-15" />,
    },
    {
      id: 'locales',
      name: 'Locales',
      wide: true,
      render: () => (
        <div className="flex flex-wrap gap-6">
          <Calendar locale="de-DE" defaultMonth="2026-11" defaultValue="2026-11-05" />
          <div dir="rtl">
            <Calendar locale="ar-EG" defaultMonth="2026-11" defaultValue="2026-11-05" />
          </div>
        </div>
      ),
    },
  ],
  usage: `import { Calendar } from '@nish/ui';

<Calendar value={day} onValueChange={setDay} min="2026-01-01" />`,
  guidelines: [
    'Use DatePicker for a form field; use Calendar on its own when the month view is the page content (a booking page, a schedule).',
    'Values are YYYY-MM-DD strings, the same as <input type="date">, so no timezone can shift the day.',
    'Disabled days stay reachable with the arrow keys and are read as unavailable; give the reason next to the calendar.',
    'The first day of the week follows the locale (Sunday in the US, Monday in most of Europe); weekStartsOn overrides it.',
    'For a span of days (a trip, a report period), use RangeCalendar.',
  ],
};
