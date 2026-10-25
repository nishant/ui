import { Input, Select } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Field } from './shared';

// --- Select -------------------------------------------------------------------------

export const select: ComponentDoc = {
  id: 'select',
  name: 'Select',
  exports: ['Select'],
  summary: 'A native select with the shared field look. It keeps the platform picker on phones, which beats any custom dropdown there.',
  importLine: "import { Select } from '@nish/ui';",
  controls: [
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Status" error={a.invalid ? 'Pick a status.' : undefined}>
        <Select defaultValue="applied" invalid={!!a.invalid} disabled={!!a.disabled}>
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
      { defaultValue: 'applied', invalid: a.invalid, disabled: a.disabled },
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
      id: 'filters',
      name: 'Filter row',
      wide: true,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-3">
          <Field label="Search">
            <Input placeholder="Company or title" />
          </Field>
          <Field label="Status">
            <Select defaultValue="all">
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
            </Select>
          </Field>
          <Field label="Sort">
            <Select defaultValue="recent">
              <option value="recent">Most recent</option>
              <option value="salary">Highest salary</option>
            </Select>
          </Field>
        </div>
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
</label>`,
  guidelines: [
    'className goes on the wrapper, so width classes (w-40) size the whole control including the chevron.',
    'For more than about 15 options, or when people need to search, use an Input with suggestions instead.',
  ],
};
