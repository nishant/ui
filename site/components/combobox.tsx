import { useEffect, useRef, useState } from 'react';
import { Button, Combobox, Modal, type ComboboxOption } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Combobox -----------------------------------------------------------------------

const TICKERS: ComboboxOption[] = (
  [
    ['AAPL', 'Apple'],
    ['ABNB', 'Airbnb'],
    ['AMD', 'Advanced Micro Devices'],
    ['AMZN', 'Amazon'],
    ['ARM', 'Arm Holdings'],
    ['AVGO', 'Broadcom'],
    ['BA', 'Boeing'],
    ['COIN', 'Coinbase'],
    ['COST', 'Costco'],
    ['CRM', 'Salesforce'],
    ['DIS', 'Walt Disney'],
    ['GOOGL', 'Alphabet'],
    ['INTC', 'Intel'],
    ['JPM', 'JPMorgan Chase'],
    ['LLY', 'Eli Lilly'],
    ['META', 'Meta Platforms'],
    ['MSFT', 'Microsoft'],
    ['MU', 'Micron Technology'],
    ['NFLX', 'Netflix'],
    ['NVDA', 'Nvidia'],
    ['ORCL', 'Oracle'],
    ['PLTR', 'Palantir'],
    ['QCOM', 'Qualcomm'],
    ['SHOP', 'Shopify'],
    ['SMCI', 'Super Micro Computer'],
    ['SPY', 'SPDR S&P 500 ETF'],
    ['TSLA', 'Tesla'],
    ['TSM', 'Taiwan Semiconductor'],
    ['UBER', 'Uber'],
    ['V', 'Visa'],
  ] as const
).map(([value, hint]) => ({ value, label: value, hint }));

const TAGS: ComboboxOption[] = ['swing', 'earnings', 'income', 'hedge', 'long-term'].map((t) => ({ value: t, label: t }));

function TickerPicker({ size, disabled }: { size: 'sm' | 'md'; disabled: boolean }) {
  const [value, setValue] = useState<string | null>('AMD');
  return (
    <div className="w-full max-w-xs">
      <Field label="Symbol">
        <Combobox
          id="doc-cb-ticker"
          options={TICKERS}
          value={value}
          onChange={(v) => setValue(v)}
          placeholder="Search symbols"
          size={size}
          disabled={disabled}
        />
      </Field>
    </div>
  );
}

function TagPicker() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Field label="Strategy tag" hint="Type a new tag and press Enter to create it.">
        <Combobox id="doc-cb-tag" options={TAGS} value={value} onChange={(v) => setValue(v)} allowCustom placeholder="Pick or create" />
      </Field>
      <p className="text-xs text-th-hi3">
        Value: <span className="tabular-nums text-th-hi2">{value ?? 'none'}</span>
      </p>
    </div>
  );
}

/** A fake server: filters the tickers after a short delay. */
function AsyncPicker() {
  const [value, setValue] = useState<string | null>(null);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function search(q: string) {
    window.clearTimeout(timer.current);
    if (!q.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      const n = q.trim().toLowerCase();
      setOptions(TICKERS.filter((t) => t.label.toLowerCase().includes(n) || t.hint?.toLowerCase().includes(n)));
      setLoading(false);
    }, 700);
  }

  return (
    <div className="w-full max-w-xs">
      <Field label="Company">
        <Combobox
          id="doc-cb-async"
          options={options}
          value={value}
          onChange={(v, o) => {
            setValue(v);
            if (o) setOptions([o]);
          }}
          onQueryChange={search}
          loading={loading}
          emptyText="No companies found"
          placeholder="Type to search"
        />
      </Field>
    </div>
  );
}

function ModalStory() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add to watchlist</Button>
      {open ? (
        <Modal
          title="Add to watchlist"
          closeOnBack={false}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!value} onClick={() => setOpen(false)}>
                Add
              </Button>
            </>
          }
        >
          <div className="min-h-[20rem]">
            <Field label="Symbol" hint="Escape closes the list (and then clears typed text) before it closes the dialog.">
              <Combobox id="doc-cb-modal" options={TICKERS} value={value} onChange={(v) => setValue(v)} placeholder="Search symbols" />
            </Field>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export const combobox: ComponentDoc = {
  id: 'combobox',
  name: 'Combobox',
  exports: ['Combobox'],
  summary:
    'A type-to-filter picker for long lists: an input with a listbox under it, following the ARIA 1.2 combobox pattern. It selects from the options, or with allowCustom commits what was typed.',
  importLine: "import { Combobox } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { size: 'md', disabled: false },
  render: (a) => <TickerPicker size={a.size as 'md'} disabled={!!a.disabled} />,
  code: (a) =>
    jsx('Combobox', {
      options: '{symbols}',
      value: '{symbol}',
      onChange: '{(v) => setSymbol(v)}',
      placeholder: 'Search symbols',
      size: a.size === 'md' ? undefined : a.size,
      disabled: a.disabled,
    }),
  stories: [
    {
      id: 'ticker',
      name: 'Ticker picker',
      note: '30 symbols with hints. Typing matches the symbol or the company name; arrows, Home, End and Enter work from the keyboard.',
      render: () => <TickerPicker size="md" disabled={false} />,
    },
    {
      id: 'custom',
      name: 'Allow custom values',
      note: 'With allowCustom, Enter commits the typed text and onChange gets (text, null). Arrow to an option to pick it instead.',
      render: () => <TagPicker />,
    },
    {
      id: 'async',
      name: 'Async options',
      note: 'onQueryChange is debounced 200ms. While loading is true the list shows a "Searching…" row.',
      render: () => <AsyncPicker />,
    },
    {
      id: 'modal',
      name: 'Inside a Modal',
      note: 'The list is absolute under the input, so it scrolls with the dialog and needs no portal.',
      render: () => <ModalStory />,
    },
  ],
  usage: `import { Combobox, type ComboboxOption } from '@nish/ui';

const symbols: ComboboxOption[] = [
  { value: 'AAPL', label: 'AAPL', hint: 'Apple' },
  { value: 'AMD', label: 'AMD', hint: 'Advanced Micro Devices' },
];

<label htmlFor="symbol">Symbol</label>
<Combobox id="symbol" options={symbols} value={symbol} onChange={(v) => setSymbol(v)} />

// Create on Enter
<Combobox aria-label="Tag" options={tags} value={tag} onChange={(v) => setTag(v)} allowCustom />

// Server-side search
<Combobox
  aria-label="Company"
  options={results}
  value={company}
  onChange={(v) => setCompany(v)}
  onQueryChange={search}
  loading={pending}
/>`,
  guidelines: [
    'Give it a name: a visible <label htmlFor={id}> or an aria-label.',
    'Use a Select for fewer than about 15 fixed options (the native picker is better on phones); use a Combobox when people need to search.',
    'Escape closes the list first and only then clears the typed text; inside a Modal it does not close the dialog while the list is open.',
    'On blur the typed text resets to the selected label, so a half-typed query never looks like a value.',
    'With onQueryChange and no filter prop the options are shown as given; filter on the server.',
  ],
};
