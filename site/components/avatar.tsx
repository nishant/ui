import { Avatar, AvatarGroup, type AvatarSize } from '../../src/components/avatar';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Avatar -------------------------------------------------------------------------

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton'];

export const avatar: ComponentDoc = {
  id: 'avatar',
  name: 'Avatar',
  exports: ['Avatar', 'AvatarGroup'],
  summary:
    'A person or entity: their image, or initials on a color taken from a stable hash of their name. Five sizes, circle or square, an optional status dot, and AvatarGroup for an overlapping stack with a +N badge. Image URLs go through safeUrl.',
  importLine: "import { Avatar, AvatarGroup } from '@nish/ui';",
  controls: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'shape', label: 'Shape', type: 'select', options: ['circle', 'square'] },
    { key: 'status', label: 'Status', type: 'select', options: ['none', 'ok', 'warn', 'loss', 'info', 'neutral'] },
  ],
  initial: { name: 'Ada Lovelace', size: 'md', shape: 'circle', status: 'none' },
  render: (a) => (
    <Avatar
      name={String(a.name)}
      size={a.size as AvatarSize}
      shape={a.shape as 'circle'}
      status={a.status === 'none' ? undefined : (a.status as 'ok')}
    />
  ),
  code: (a) =>
    jsx('Avatar', {
      name: String(a.name),
      size: a.size === 'md' ? undefined : a.size,
      shape: a.shape === 'circle' ? undefined : a.shape,
      status: a.status === 'none' ? undefined : a.status,
    }),
  stories: [
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <div className="flex items-end gap-3">
          {SIZES.map((s) => (
            <Avatar key={s} name="Grace Hopper" size={s} />
          ))}
        </div>
      ),
    },
    {
      id: 'hues',
      name: 'Color from the name',
      note: 'The same name always gets the same hue, across pages and sessions.',
      render: () => (
        <div className="flex flex-wrap gap-2">
          {PEOPLE.map((p) => (
            <Avatar key={p} name={p} />
          ))}
        </div>
      ),
    },
    {
      id: 'shape-status',
      name: 'Square, with a status',
      render: () => (
        <div className="flex gap-3">
          <Avatar name="Build Bot" shape="square" status="ok" />
          <Avatar name="Deploy Bot" shape="square" status="warn" />
          <Avatar name="Cron Bot" shape="square" status="loss" />
        </div>
      ),
    },
    {
      id: 'fallback',
      name: 'Image that fails to load',
      note: 'A broken or unsafe src falls back to the initials.',
      render: () => (
        <div className="flex gap-3">
          <Avatar name="Ada Lovelace" src="about:invalid" />
          <Avatar name="Unsafe URL" src="javascript:alert(1)" />
        </div>
      ),
    },
    {
      id: 'group',
      name: 'AvatarGroup',
      render: () => (
        <AvatarGroup max={4} aria-label="Team members">
          {PEOPLE.map((p) => (
            <Avatar key={p} name={p} />
          ))}
        </AvatarGroup>
      ),
    },
  ],
  usage: `import { Avatar, AvatarGroup } from '@nish/ui';

<Avatar name={user.name} src={user.photoUrl} status="ok" />

<AvatarGroup max={3} size="sm" aria-label="Reviewers">
  {reviewers.map((r) => <Avatar key={r.id} name={r.name} src={r.photoUrl} />)}
</AvatarGroup>`,
  guidelines: [
    'Pass name even with an image: it is the alt text and the fallback if the image fails.',
    'The status dot is color only and hidden from screen readers; pass statusLabel ("Online") to announce it, and say the status in text nearby. It is always hidden when alt="".',
    'Next to the name in text, an avatar is decoration: pass alt="" so screen readers do not read the name twice.',
    'AvatarGroup gives children its size and shape unless they set their own; the +N badge is labeled "N more" (strings.avatarMore).',
  ],
};
