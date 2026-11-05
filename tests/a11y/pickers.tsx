// A page for the picker specs (Calendar, DatePicker, MultiSelect, Carousel). Query string:
//   ?open=datepicker|multiselect   opens that one on load
//   ?dir=rtl                       right-to-left
// The theme comes from localStorage 'nish-theme' (applyTheme), like an app.
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { applyTheme } from '../../src/theme';
import { Calendar } from '../../src/components/calendar';
import { DatePicker } from '../../src/components/date-picker';
import { MultiSelect } from '../../src/components/multi-select';
import { Carousel } from '../../src/components/carousel';
import { Field } from '../../src/components/forms';
import { Card } from '../../src/components/primitives';

const params = new URLSearchParams(location.search);
applyTheme();
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';
const open = params.get('open');

const STATES = [
  { value: 'TX', label: 'Texas' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'WA', label: 'Washington' },
  { value: 'UT', label: 'Utah' },
  { value: 'ME', label: 'Maine' },
  { value: 'NC', label: 'North Carolina' },
];

const TRIPS = ['Smoky Mountains', 'Big Bend', 'Olympic', 'Zion'];

function Page() {
  const multiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open === 'datepicker') {
      document.querySelector<HTMLButtonElement>('main button[aria-haspopup="dialog"]')?.click();
    }
    if (open === 'multiselect') {
      const input = multiRef.current;
      if (input) {
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }
    }
  }, []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-th-hi">Pickers harness</h1>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-base font-semibold text-th-hi">Calendar</h2>
        <div id="calendar-host">
          <Calendar defaultValue="2026-11-05" />
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <Field label="Due date">
          <DatePicker defaultValue="2026-11-05" />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-base font-semibold text-th-hi">States</h2>
        <MultiSelect ref={multiRef} aria-label="States" options={STATES} defaultValue={['TX']} />
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-base font-semibold text-th-hi">Trips</h2>
        <Carousel aria-label="Trips">
          {TRIPS.map((t) => (
            <Card key={t} className="p-4">
              <p className="text-sm font-semibold text-th-hi">{t}</p>
              <p className="text-sm text-th-hi2">A few days outdoors.</p>
            </Card>
          ))}
        </Carousel>
      </Card>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Page />);
