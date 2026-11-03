import { useState } from 'react';
import { Field } from '../../src/components/forms';
import { TagInput } from '../../src/components/tag-input';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- TagInput ------------------------------------------------------------------------

const SKILLS = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Rust', 'Go', 'Python'];

function Controlled() {
  const [tags, setTags] = useState(['React']);
  return (
    <div className="grid w-full max-w-md gap-1">
      <TagInput aria-label="Skills" value={tags} onValueChange={setTags} placeholder="Add a skill" />
      <p className="text-xs text-th-hi3">{tags.length} selected</p>
    </div>
  );
}

export const tagInput: ComponentDoc = {
  id: 'tag-input',
  name: 'TagInput',
  exports: ['TagInput'],
  summary:
    'A text box that turns what you type into removable tags. Enter and comma add, pasting a list splits it, Backspace on an empty box removes the last tag. Each tag posts as its own form value, and an optional suggestion list follows the combobox pattern.',
  importLine: "import { TagInput } from '@nish/ui';",
  controls: [
    { key: 'suggestions', label: 'Suggestions', type: 'boolean' },
    { key: 'maxTags', label: 'Max tags', type: 'number', min: 1, max: 10 },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { suggestions: true, maxTags: 5, size: 'md', disabled: false },
  render: (a) => (
    <div className="w-full max-w-md">
      <TagInput
        aria-label="Skills"
        placeholder="Add a skill"
        defaultValue={['React']}
        suggestions={a.suggestions ? SKILLS : undefined}
        maxTags={Number(a.maxTags)}
        size={a.size === 'sm' ? 'sm' : 'md'}
        disabled={!!a.disabled}
      />
    </div>
  ),
  code: (a) =>
    jsx('TagInput', {
      'aria-label': 'Skills',
      placeholder: 'Add a skill',
      suggestions: a.suggestions ? '{skills}' : undefined,
      maxTags: Number(a.maxTags),
      size: a.size === 'md' ? undefined : a.size,
      disabled: a.disabled,
    }),
  stories: [
    {
      id: 'plain',
      name: 'Plain',
      render: () => (
        <div className="w-full max-w-md">
          <TagInput aria-label="Keywords" placeholder="Type and press Enter" />
        </div>
      ),
    },
    {
      id: 'suggestions',
      name: 'With suggestions',
      note: 'Arrow keys move through the list, Enter picks. Free text is still accepted.',
      render: () => (
        <div className="w-full max-w-md pb-40">
          <TagInput aria-label="Skills" suggestions={SKILLS} defaultValue={['React']} placeholder="Add a skill" />
        </div>
      ),
    },
    {
      id: 'validate',
      name: 'Validated',
      note: 'validate returns an error message to refuse a tag; the text stays so the reader can fix it.',
      render: () => (
        <div className="w-full max-w-md">
          <TagInput
            aria-label="Invite emails"
            placeholder="name@example.com"
            validate={(t) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) ? null : 'Enter a valid email address.')}
          />
        </div>
      ),
    },
    {
      id: 'max',
      name: 'Limited',
      render: () => (
        <div className="w-full max-w-md">
          <TagInput aria-label="Top three" maxTags={3} defaultValue={['One', 'Two']} placeholder="Up to 3" />
        </div>
      ),
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-md">
          <Field label="Tags" hint="Separate with Enter or a comma.">
            <TagInput placeholder="Add a tag" />
          </Field>
        </div>
      ),
    },
  ],
  usage: `import { TagInput } from '@nish/ui';

<TagInput
  aria-label="Skills"
  name="skills"
  value={skills}
  onValueChange={setSkills}
  suggestions={['React', 'TypeScript']}
  maxTags={10}
  validate={(t) => (t.length > 24 ? 'Keep tags under 25 characters.' : null)}
/>`,
  guidelines: [
    'Use it for free-form lists of short labels (skills, keywords, emails). For a fixed set, use Chip toggles.',
    'Enter and comma add the tag; an empty Enter still submits the surrounding form.',
    'id, aria-label and aria-describedby go to the text box, so a Field label and its error reach the control.',
    'Set required for "at least one tag": the text box is required only while there are no tags.',
  ],
};
