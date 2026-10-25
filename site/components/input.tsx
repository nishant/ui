import { useState } from 'react';
import { Card, IconButton, Input } from '../../src';
import { fieldClass } from '../../src/components/primitives';
import { CloseIcon, SearchIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field, Row } from './shared';

// --- Input --------------------------------------------------------------------------

function ClearableSearch() {
  const [q, setQ] = useState('sony headphones');
  return (
    <Input
      type="search"
      aria-label="Search listings"
      placeholder="Search 1,204 listings"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      leading={<SearchIcon size={15} />}
      trailing={
        q ? (
          <IconButton label="Clear search" size="xs" onClick={() => setQ('')}>
            <CloseIcon size={12} />
          </IconButton>
        ) : null
      }
    />
  );
}

export const input: ComponentDoc = {
  id: 'input',
  name: 'Input',
  exports: ['Input'],
  summary:
    'The shared text field. Three sizes, leading and trailing slots, 16px text on phones so iOS does not zoom on focus, 44px tall on touch screens, and an invalid state. fieldClass() gives one-off controls the same look.',
  importLine: "import { Input } from '@nish/ui';",
  controls: [
    { key: 'type', label: 'Type', type: 'select', options: ['text', 'email', 'number', 'search'] },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm', 'xs'] },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'leading', label: 'Leading icon', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { type: 'text', size: 'md', placeholder: 'Company or title', leading: false, invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Search" error={a.invalid ? 'Enter at least 2 characters.' : undefined} id="canvas-input-msg">
        <Input
          type={String(a.type)}
          size={a.size as 'md'}
          placeholder={String(a.placeholder)}
          leading={a.leading ? <SearchIcon size={15} /> : undefined}
          invalid={!!a.invalid}
          disabled={!!a.disabled}
          aria-describedby={a.invalid ? 'canvas-input-msg' : undefined}
        />
      </Field>
    </div>
  ),
  code: (a) =>
    jsx('Input', {
      type: a.type === 'text' ? undefined : a.type,
      size: a.size === 'md' ? undefined : a.size,
      placeholder: a.placeholder || undefined,
      leading: a.leading ? '{<Search size={15} />}' : undefined,
      invalid: a.invalid,
      disabled: a.disabled,
      'aria-describedby': a.invalid ? 'search-error' : undefined,
    }),
  stories: [
    {
      id: 'label',
      name: 'With a label',
      render: () => (
        <Field label="Company">
          <Input defaultValue="Figma" />
        </Field>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'md h-9 (default), sm h-8, xs h-7. Phones always get 16px text and 44px height.',
      wide: true,
      render: () => (
        <div className="grid w-full gap-2 sm:grid-cols-3">
          <Input aria-label="Medium" placeholder="Medium" />
          <Input aria-label="Small" size="sm" placeholder="Small" />
          <Input aria-label="Extra small" size="xs" placeholder="Extra small" />
        </div>
      ),
    },
    {
      id: 'placeholder',
      name: 'Placeholder and hint',
      render: () => (
        <Field label="Price target" hint="In dollars, without the $.">
          <Input inputMode="decimal" placeholder="180.00" />
        </Field>
      ),
    },
    {
      id: 'leading',
      name: 'Leading slot',
      note: 'A search icon or a "$" prefix. It ignores clicks, so they reach the input.',
      render: () => (
        <div className="grid w-full gap-2">
          <Input type="search" placeholder="Search 1,204 listings" aria-label="Search listings" leading={<SearchIcon size={15} />} />
          <Input inputMode="decimal" defaultValue="180.00" aria-label="Price target" leading="$" />
        </div>
      ),
    },
    {
      id: 'trailing',
      name: 'Trailing slot',
      note: 'May be interactive: a clear button, or a unit suffix.',
      render: () => (
        <div className="grid w-full gap-2">
          <ClearableSearch />
          <Input inputMode="numeric" defaultValue="30" aria-label="Check every" trailing={<span className="pr-2.5 text-xs">min</span>} />
        </div>
      ),
    },
    {
      id: 'invalid',
      name: 'Invalid',
      render: () => (
        <Field label="Price target" error="Enter a number." id="story-invalid">
          <Input invalid defaultValue="abc" aria-describedby="story-invalid" />
        </Field>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <Field label="API key">
          <Input disabled defaultValue="Managed by the server" />
        </Field>
      ),
    },
    {
      id: 'field-class',
      name: 'fieldClass() on a one-off control',
      note: 'For a control Input does not cover, use the recipe instead of copying its classes.',
      render: () => (
        <Row>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-th-hi3">Follow up on</span>
            <input type="date" defaultValue="2026-11-02" className={fieldClass({ size: 'sm', className: 'w-44' })} />
          </label>
        </Row>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card title="New tracker" className="w-full max-w-md">
          <div className="grid gap-3">
            <Field label="Product URL">
              <Input type="url" placeholder="https://www.bestbuy.com/site/…" />
            </Field>
            <Field label="Alert below">
              <Input inputMode="decimal" leading="$" defaultValue="350" />
            </Field>
          </div>
        </Card>
      ),
    },
    {
      id: 'long',
      name: 'Long value',
      render: () => (
        <Field label="Feed URL">
          <Input defaultValue="https://trackers.nish.software/api/feeds/price-drops?since=2026-10-01&format=rss" />
        </Field>
      ),
    },
  ],
  usage: `import { Input, Label, fieldClass } from '@nish/ui';
import { Search } from 'lucide-react';

<label className="grid gap-1.5">
  <Label>Price target</Label>
  <Input
    inputMode="decimal"
    leading="$"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    invalid={!!error}
    aria-describedby="target-error"
  />
  {error ? <span id="target-error" className="text-xs text-th-loss">{error}</span> : null}
</label>

<Input size="sm" type="search" aria-label="Search" leading={<Search size={15} />} />

<input type="date" className={fieldClass({ size: 'sm' })} />`,
  guidelines: [
    'Always give the field a visible Label. Placeholders vanish as soon as someone types.',
    'With invalid, show the reason as text and tie it to the input with aria-describedby.',
    'Use inputMode for numbers ("decimal", "numeric") so phones show the right keyboard.',
    'Use size="sm" or "xs" in dense toolbars; phones still get 16px text and a 44px field.',
    'With leading or trailing, className stays on the <input>; wrapperClassName styles the wrapper (width, margin).',
    'For a one-off control (a date input), use fieldClass() instead of copying the field classes.',
  ],
};
