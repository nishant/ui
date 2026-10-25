import { useState } from 'react';
import { Card } from '../../src';
import { Chip, ChipGroup } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Chip and ChipGroup --------------------------------------------------------------

const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

function Filters({ size, scroll }: { size?: 'sm' | 'md'; scroll?: boolean }) {
  const [on, setOn] = useState<string[]>(['Applied', 'Interview']);
  const flip = (s: string) => setOn((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  return (
    <ChipGroup label="Filter by status" scroll={scroll}>
      {STATUSES.map((s) => (
        <Chip key={s} size={size} pressed={on.includes(s)} onClick={() => flip(s)}>
          {s}
        </Chip>
      ))}
    </ChipGroup>
  );
}

function Tags({ size }: { size?: 'sm' | 'md' }) {
  const [tags, setTags] = useState(['TypeScript', 'React', 'Remote']);
  return (
    <ChipGroup label="Skills">
      {tags.map((t) => (
        <Chip key={t} variant="tag" size={size} onRemove={() => setTags((xs) => xs.filter((x) => x !== t))}>
          {t}
        </Chip>
      ))}
      {tags.length < 3 ? (
        <Chip variant="suggestion" size={size} onClick={() => setTags(['TypeScript', 'React', 'Remote'])}>
          Reset
        </Chip>
      ) : null}
    </ChipGroup>
  );
}

export const chip: ComponentDoc = {
  id: 'chip',
  name: 'Chip',
  exports: ['Chip', 'ChipGroup'],
  summary:
    'Small pills for multi-select filters (toggle, aria-pressed), quick suggestions (dashed, with a leading +) and removable tags. ChipGroup names and lays out a set of them.',
  importLine: "import { Chip, ChipGroup } from '@nish/ui';",
  controls: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['toggle', 'suggestion', 'tag'] },
    { key: 'pressed', label: 'Pressed', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'label', label: 'Text', type: 'text' },
  ],
  initial: { variant: 'toggle', pressed: true, size: 'md', label: 'Remote' },
  render: (a) => (
    <Chip
      variant={a.variant as 'toggle' | 'suggestion' | 'tag'}
      pressed={!!a.pressed}
      size={a.size === 'sm' ? 'sm' : 'md'}
      onRemove={a.variant === 'tag' ? () => {} : undefined}
    >
      {String(a.label)}
    </Chip>
  ),
  code: (a) =>
    jsx(
      'Chip',
      {
        variant: a.variant === 'toggle' ? undefined : a.variant,
        pressed: a.variant === 'toggle' ? (a.pressed ? '{true}' : '{false}') : undefined,
        size: a.size === 'md' ? undefined : a.size,
        onRemove: a.variant === 'tag' ? '{() => remove(tag)}' : undefined,
        onClick: a.variant === 'tag' ? undefined : '{…}',
      },
      String(a.label),
    ),
  stories: [
    { id: 'filters', name: 'Toggle filters', render: () => <Filters /> },
    { id: 'sm', name: 'Small', render: () => <Filters size="sm" /> },
    {
      id: 'suggestion',
      name: 'Suggestions',
      render: () => (
        <ChipGroup label="Suggested searches">
          <Chip variant="suggestion">Staff engineer</Chip>
          <Chip variant="suggestion">Austin</Chip>
          <Chip variant="suggestion" size="sm">
            Remote only
          </Chip>
        </ChipGroup>
      ),
    },
    { id: 'tags', name: 'Removable tags', render: () => <Tags /> },
    { id: 'tags-sm', name: 'Small tags', render: () => <Tags size="sm" /> },
    {
      id: 'trailing',
      name: 'With a count',
      render: () => (
        <ChipGroup label="Stores">
          <Chip pressed trailing={<span className="tabular-nums">12</span>}>
            Best Buy
          </Chip>
          <Chip trailing={<span className="tabular-nums">4</span>}>Target</Chip>
          <Chip disabled>Walmart</Chip>
        </ChipGroup>
      ),
    },
    { id: 'scroll', name: 'Scrolling row on phones', note: 'scroll: one row that scrolls sideways under 640px.', wide: true, render: () => <Filters scroll /> },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card className="w-full">
          <p className="mb-3 text-sm font-semibold text-th-hi">Applications</p>
          <Filters size="sm" />
        </Card>
      ),
    },
  ],
  usage: `import { Chip, ChipGroup } from '@nish/ui';

<ChipGroup label="Filter by status">
  {STATUSES.map((s) => (
    <Chip key={s} pressed={on.includes(s)} onClick={() => toggle(s)}>
      {s}
    </Chip>
  ))}
</ChipGroup>`,
  guidelines: [
    'Chips are for multi-select filters and tags. For one choice among several, use Segmented.',
    'Always wrap a set in ChipGroup with a label, so screen readers hear what the chips filter.',
    'Tags get their remove button name from removeLabel, or "Remove <text>" when the text is a string.',
  ],
};
