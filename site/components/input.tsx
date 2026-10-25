import { Input } from '../../src';
import { SearchIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Input --------------------------------------------------------------------------

export const input: ComponentDoc = {
  id: 'input',
  name: 'Input',
  exports: ['Input'],
  summary: 'The shared text field. 16px text on phones so iOS does not zoom on focus, 44px tall on touch screens, and an invalid state.',
  importLine: "import { Input } from '@nish/ui';",
  controls: [
    { key: 'type', label: 'Type', type: 'select', options: ['text', 'email', 'number', 'search'] },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { type: 'text', placeholder: 'Company or title', invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Search" error={a.invalid ? 'Enter at least 2 characters.' : undefined} id="canvas-input-msg">
        <Input
          type={String(a.type)}
          placeholder={String(a.placeholder)}
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
      placeholder: a.placeholder || undefined,
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
      id: 'placeholder',
      name: 'Placeholder and hint',
      render: () => (
        <Field label="Price target" hint="In dollars, without the $.">
          <Input inputMode="decimal" placeholder="180.00" />
        </Field>
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
      id: 'icon',
      name: 'With a leading icon',
      render: () => (
        <div className="relative w-full">
          <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-th-hi3" />
          <Input type="search" placeholder="Search 1,204 listings" aria-label="Search listings" className="pl-9" />
        </div>
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
  usage: `import { Input, Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Price target</Label>
  <Input
    inputMode="decimal"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    invalid={!!error}
    aria-describedby="target-error"
  />
  {error ? <span id="target-error" className="text-xs text-th-loss">{error}</span> : null}
</label>`,
  guidelines: [
    'Always give the field a visible Label. Placeholders vanish as soon as someone types.',
    'With invalid, show the reason as text and tie it to the input with aria-describedby.',
    'Use inputMode for numbers ("decimal", "numeric") so phones show the right keyboard.',
  ],
};
