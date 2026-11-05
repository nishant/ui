// A page for the picker specs (Calendar, DatePicker, MultiSelect, Carousel). Query string:
//   ?open=datepicker|multiselect   opens that one on load
//   ?dir=rtl                       right-to-left
//   ?modal=1                       a MultiSelect and a DatePicker inside an open Modal
//   ?extra=1                       limits calendar, month-end calendar, form, auto-play carousel
// The theme comes from localStorage 'nish-theme' (applyTheme), like an app.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { applyTheme } from '../../src/theme';
import { Calendar } from '../../src/components/calendar';
import { DatePicker } from '../../src/components/date-picker';
import { MultiSelect } from '../../src/components/multi-select';
import { Carousel } from '../../src/components/carousel';
import { Field } from '../../src/components/forms';
import { Card } from '../../src/components/primitives';
import { Modal } from '../../src/components/overlay';

const params = new URLSearchParams(location.search);
applyTheme();
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';
const open = params.get('open');
const modal = params.get('modal') === '1';
const extra = params.get('extra') === '1';

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
  const [modalOpen, setModalOpen] = useState(modal);
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

      {extra && (
        <>
          <Card className="flex flex-col gap-3 p-4">
            <div id="limits-host">
              <Calendar
                defaultValue="2026-11-05"
                min="2026-11-03"
                max="2026-11-24"
                isDateDisabled={(d) => d === '2026-11-10'}
              />
            </div>
            <div id="jan-host">
              <Calendar defaultValue="2026-01-31" />
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <form
              id="date-form"
              onSubmit={(e) => {
                e.preventDefault();
                document.body.dataset.submits = String(Number(document.body.dataset.submits ?? '0') + 1);
              }}
            >
              <Field label="Form date">
                <DatePicker name="when" />
              </Field>
              <button type="submit">Save</button>
            </form>
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <Carousel aria-label="Auto trips" autoPlay={600000}>
              {TRIPS.map((t) => (
                <Card key={t} className="p-4">
                  <p className="text-sm font-semibold text-th-hi">{t}</p>
                </Card>
              ))}
            </Carousel>
          </Card>
        </>
      )}

      {modalOpen && (
        <Modal title="Pickers in a modal" onClose={() => setModalOpen(false)}>
          <div className="flex flex-col gap-3">
            <MultiSelect aria-label="Modal states" options={STATES} defaultValue={[]} />
            <Field label="Modal date">
              <DatePicker />
            </Field>
          </div>
        </Modal>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Page />);
