import { Card, Input, Select } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Select -------------------------------------------------------------------------

export const select: ComponentDoc = {
  id: 'select',
  name: 'Select',
  exports: ['Select'],
  summary:
    'A native select with the shared field look, in the same three sizes as Input. It keeps the platform picker on phones, which beats any custom dropdown there.',
  importLine: "import { Select } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm', 'xs'] },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { size: 'md', invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Status" error={a.invalid ? 'Pick a status.' : undefined}>
        <Select defaultValue="applied" size={a.size as 'md'} invalid={!!a.invalid} disabled={!!a.disabled}>
          <option value="open">Open</option>
          <option value="applied">Applied</option>
          <option value="interview">Interviewing</option>
          <option value="closed">Closed</option>
        </Select>
      </Field>
    </div>
  ),
  code: (a) =>
    jsx(
      'Select',
      { defaultValue: 'applied', size: a.size === 'md' ? undefined : a.size, invalid: a.invalid, disabled: a.disabled },
      '\n  <option value="open">Open</option>\n  <option value="applied">Applied</option>\n',
    ).replace('>\n  \n', '>\n'),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Field label="Status">
          <Select defaultValue="applied">
            <option value="open">Open</option>
            <option value="applied">Applied</option>
            <option value="closed">Closed</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'md h-9 (default), sm h-8, xs h-7, matching Input. Phones get 16px text and 44px height.',
      wide: true,
      render: () => (
        <div className="grid w-full gap-2 sm:grid-cols-3">
          {(['md', 'sm', 'xs'] as const).map((s) => (
            <Select key={s} size={s} aria-label={`Sort (${s})`} defaultValue="recent">
              <option value="recent">Most recent ({s})</option>
              <option value="salary">Highest salary</option>
            </Select>
          ))}
        </div>
      ),
    },
    {
      id: 'select-class',
      name: 'Styling the inner select',
      note: 'className sizes the wrapper; selectClassName reaches the <select> itself (here: tabular numbers).',
      render: () => (
        <Select aria-label="Expiry" className="w-44" selectClassName="tabular-nums" defaultValue="2026-11-20">
          <option value="2026-11-20">2026-11-20</option>
          <option value="2026-12-18">2026-12-18</option>
        </Select>
      ),
    },
    {
      id: 'invalid',
      name: 'Invalid',
      render: () => (
        <Field label="Expiry" error="Pick an expiry date.">
          <Select invalid defaultValue="">
            <option value="">Choose…</option>
            <option value="2026-11-20">Nov 20, 2026</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <Field label="Region">
          <Select disabled defaultValue="us">
            <option value="us">United States</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'card',
      name: 'Filter row in a card',
      wide: true,
      render: () => (
        <Card title="Applications" padding="sm" className="w-full">
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <Field label="Search">
              <Input size="sm" placeholder="Company or title" />
            </Field>
            <Field label="Status">
              <Select size="sm" defaultValue="all">
                <option value="all">All statuses</option>
                <option value="applied">Applied</option>
              </Select>
            </Field>
            <Field label="Sort">
              <Select size="sm" defaultValue="recent">
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
              </Select>
            </Field>
          </div>
        </Card>
      ),
    },
  ],
  usage: `import { Select, Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Status</Label>
  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
    <option value="open">Open</option>
    <option value="applied">Applied</option>
    <option value="closed">Closed</option>
  </Select>
</label>

<Select size="sm" className="w-40" selectClassName="tabular-nums">…</Select>`,
  guidelines: [
    'className goes on the wrapper, so width classes (w-40) size the whole control including the chevron.',
    'Use selectClassName for the inner <select>, never [&>select]:… selectors.',
    'Match the size to the Inputs beside it (sm with sm) so a filter row lines up.',
    'For more than about 15 options, or when people need to search, use an Input with suggestions instead.',
  ],
};
