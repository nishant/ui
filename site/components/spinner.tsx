import { Button, Card } from '../../src';
import { Spinner } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Spinner ------------------------------------------------------------------------

const SIZES = ['xs', 'sm', 'md', 'lg'] as const;

export const spinner: ComponentDoc = {
  id: 'spinner',
  name: 'Spinner',
  exports: ['Spinner'],
  summary:
    'A spinning loader in the current text color. With a label it announces itself (role="status"); without one it is decorative.',
  importLine: "import { Spinner } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  initial: { size: 'md', label: 'Loading jobs' },
  render: (a) => <Spinner size={a.size as 'md'} label={String(a.label) || undefined} className="text-th-hi3" />,
  code: (a) =>
    jsx('Spinner', { size: a.size === 'md' ? undefined : a.size, label: a.label || undefined, className: 'text-th-hi3' }),
  stories: [
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'xs 12px, sm 14px, md 16px, lg 24px.',
      render: () => (
        <Row className="gap-4 text-th-hi3">
          {SIZES.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 text-xs">
              <Spinner size={s} /> {s}
            </span>
          ))}
        </Row>
      ),
    },
    {
      id: 'colors',
      name: 'Takes the text color',
      render: () => (
        <Row className="gap-4">
          <Spinner className="text-th-hi3" label="Loading" />
          <Spinner className="text-th-accent" label="Loading" />
          <Spinner className="text-th-ok" label="Loading" />
        </Row>
      ),
    },
    {
      id: 'inline',
      name: 'Beside text',
      note: 'Without a label, the visible text carries the meaning.',
      render: () => (
        <p className="inline-flex items-center gap-2 text-sm text-th-hi2">
          <Spinner size="sm" className="text-th-hi3" /> Checking 8 sites…
        </p>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      render: () => (
        <Card className="flex w-full max-w-sm flex-col items-center gap-3 py-10" aria-busy="true">
          <Spinner size="lg" className="text-th-accent" label="Loading positions" />
          <p className="text-xs text-th-hi3">Loading positions</p>
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
        </Card>
      ),
    },
  ],
  usage: `import { Spinner } from '@nish/ui';

{isFetching ? <Spinner size="sm" label="Refreshing" className="text-th-hi3" /> : null}`,
  guidelines: [
    'Prefer Skeleton for content that has a known shape; use Spinner for short waits and inline refreshes.',
    'Give it a label unless visible text beside it already says what is loading.',
    'Buttons already show a spinner through loading; do not put a Spinner inside a Button.',
  ],
};
