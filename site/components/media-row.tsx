import { useState, type ReactNode } from 'react';
import { Badge } from '../../src';
import { MediaChip, MediaRow, MediaThumb } from '../../src/components/media';
import { InboxIcon, LayersIcon, PlusIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- MediaRow, MediaChip and MediaThumb -----------------------------------------------------
// The docs load no external images: a thumbnail is a role-colored fill, which is also what
// the component shows for a missing or unsafe source.

type Hue = 'accent' | 'ok' | 'warn' | 'info';
const FILL: Record<Hue, string> = {
  accent: 'bg-th-accent-soft',
  ok: 'bg-th-ok-soft',
  warn: 'bg-th-warn-soft',
  info: 'bg-th-info-soft',
};

/** A role-colored stand-in for an image, filling the thumbnail box. */
function Fill({ hue = 'accent', icon }: { hue?: Hue; icon?: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className={`absolute inset-0 ${FILL[hue]}`} />
      {icon ? <span className="relative">{icon}</span> : null}
    </>
  );
}

const LONG_TITLE = 'A very long title that goes on and on, about how a morning stream of the whole season fit into one long broadcast';

function List({ children }: { children: ReactNode }) {
  return <ul className="m-0 grid w-full max-w-xl list-none gap-2 rounded-xl border border-th-line bg-th-surface p-1">{children}</ul>;
}

function Variants() {
  return (
    <List>
      <MediaRow fallback={<Fill />} title="Morning kickoff show" meta="Studio Channel" detail="12K watching" live onClick={() => undefined} />
      <MediaRow
        fallback={<Fill hue="info" />}
        thumbShape="round"
        title="Studio Channel"
        meta="1.2M subscribers"
        onClick={() => undefined}
      />
      <MediaRow fallback={<InboxIcon />} title="No thumbnail yet" meta="The fallback icon sits on a quiet fill" detail="Uploaded Tuesday" onClick={() => undefined} />
      <MediaRow fallback={<Fill hue="warn" />} title="Last night's replay" meta="Studio Channel" live={false} onClick={() => undefined} />
      <MediaRow
        fallback={<Fill hue="ok" />}
        title="Playing on the main screen"
        meta="Game Night"
        live
        badges={<Badge tone="accent">On screen</Badge>}
        onClick={() => undefined}
      />
      <MediaRow fallback={<LayersIcon />} thumbShape="square" title="Saved streams" meta="14 items" chevron onClick={() => undefined} />
      <MediaRow fallback={<Fill />} title={LONG_TITLE} meta="A channel with a name that is also quite long indeed" live onClick={() => undefined} />
    </List>
  );
}

function DenseList() {
  return (
    <List>
      <MediaRow dense fallback={<Fill />} title="Morning kickoff show" meta="Studio Channel" live onClick={() => undefined} />
      <MediaRow dense fallback={<Fill hue="info" />} thumbShape="round" title="Studio Channel" meta="1.2M subscribers" onClick={() => undefined} />
      <MediaRow dense fallback={<LayersIcon />} thumbShape="square" title="Saved streams" chevron onClick={() => undefined} />
    </List>
  );
}

function Chips() {
  const [log, setLog] = useState('Nothing pressed yet');
  return (
    <div className="grid w-full gap-3">
      <div className="flex flex-wrap gap-2">
        <MediaChip label="Morning kickoff show" onClick={() => setLog('Recent: Morning kickoff show')} />
        <MediaChip label="Game Night with a long name that truncates before it runs out of room" onClick={() => setLog('Recent: Game Night')} />
        <MediaChip label="Studio Channel" action="Bring back" onClick={() => setLog('Brought back: Studio Channel')} />
      </div>
      <p className="m-0 text-sm text-th-hi3" aria-live="polite">
        {log}
      </p>
    </div>
  );
}

function Thumbs() {
  return (
    <div className="grid w-full gap-4">
      {(['wide', 'round', 'square'] as const).map((shape) => (
        <div key={shape} className="flex flex-wrap items-center gap-4">
          <span className="w-16 text-sm text-th-hi3">{shape}</span>
          <MediaThumb shape={shape} size="sm" fallback={<Fill hue="accent" />} />
          <MediaThumb shape={shape} size="md" fallback={<Fill hue="info" />} />
          <MediaThumb shape={shape} size="md" fallback={<PlusIcon size={20} />} />
        </div>
      ))}
    </div>
  );
}

const LIVE_OPTIONS = ['none', 'live', 'offline'];

export const mediaRow: ComponentDoc = {
  id: 'media-row',
  name: 'MediaRow',
  exports: ['MediaRow', 'MediaChip', 'MediaThumb'],
  summary:
    'A result row for videos, channels and folders: a thumbnail, a title that wraps to two lines, a meta line and a quieter detail line, with Live, Offline and extra badges on the right. MediaChip is the pill version (a recent item, or a hidden pane to bring back), and MediaThumb is the thumbnail on its own.',
  importLine: "import { MediaRow, MediaChip, MediaThumb } from '@nish/ui';",
  controls: [
    { key: 'shape', label: 'Thumbnail', type: 'select', options: ['wide', 'round', 'square'] },
    { key: 'live', label: 'Status', type: 'select', options: LIVE_OPTIONS },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'meta', label: 'Meta', type: 'boolean' },
    { key: 'detail', label: 'Detail', type: 'boolean' },
    { key: 'dense', label: 'Dense', type: 'boolean' },
    { key: 'chevron', label: 'Chevron', type: 'boolean' },
  ],
  initial: { shape: 'wide', live: 'live', title: 'Morning kickoff show', meta: true, detail: true, dense: false, chevron: false },
  render: (a) => (
    <ul className="m-0 w-full max-w-xl list-none rounded-xl border border-th-line bg-th-surface p-1">
      <MediaRow
        thumbShape={a.shape as 'wide' | 'round' | 'square'}
        fallback={<Fill />}
        title={String(a.title)}
        meta={a.meta ? 'Studio Channel' : undefined}
        detail={a.detail ? '12K watching' : undefined}
        live={a.live === 'live' ? true : a.live === 'offline' ? false : undefined}
        dense={!!a.dense}
        chevron={a.chevron ? true : undefined}
        onClick={() => undefined}
      />
    </ul>
  ),
  code: (a) =>
    jsx('MediaRow', {
      thumbnailUrl: '{item.thumbnailUrl}',
      thumbShape: a.shape === 'wide' ? undefined : a.shape,
      title: a.title,
      meta: a.meta ? 'Studio Channel' : undefined,
      detail: a.detail ? '12K watching' : undefined,
      live: a.live === 'live' ? true : a.live === 'offline' ? false : undefined,
      dense: a.dense ? true : undefined,
      chevron: a.chevron ? true : undefined,
      onClick: '{() => add(item)}',
    }),
  stories: [
    {
      id: 'variants',
      name: 'Every variant',
      note: 'Wide and round thumbnails, the icon fallback, Live, Offline, an extra badge, a chevron and a long title.',
      render: () => <Variants />,
    },
    {
      id: 'dense',
      name: 'Dense',
      note: 'For widget tiles: a 44px row with a 64x36 thumbnail and smaller badges.',
      render: () => <DenseList />,
    },
    {
      id: 'chips',
      name: 'MediaChip',
      note: 'The action word is never truncated; the label is.',
      render: () => <Chips />,
    },
    {
      id: 'thumbs',
      name: 'MediaThumb shapes',
      note: 'Small and medium, with a colored fill and with an icon on the quiet fallback fill.',
      render: () => <Thumbs />,
    },
  ],
  usage: `import { MediaRow, MediaChip } from '@nish/ui';

<ul className="grid gap-2">
  {results.map((item) => (
    <MediaRow
      key={item.id}
      thumbnailUrl={item.thumbnailUrl}
      fallback={<VideoIcon />}
      title={item.title}
      meta={item.channel}
      detail={item.viewers}
      live={item.isLive}
      onClick={() => add(item)}
    />
  ))}
</ul>

<MediaChip thumbnailUrl={item.thumbnailUrl} label={item.title} action="Bring back" onClick={() => restore(item)} />`,
  guidelines: [
    'Thumbnails load only from https or relative URLs. Anything else (http, data, javascript) shows the fallback, and so does an image that fails to load.',
    'Titles wrap to two lines. Keep meta to one short line (a channel, an author) and put the date or count in detail.',
    'live is a three-way switch: true shows Live, false shows Offline, and leaving it out shows nothing. Use badges for anything else, such as On screen.',
    'Use dense in widget tiles; it shrinks the thumbnail and badges and keeps the 44px target.',
    'Use as="div" when the row is not inside a <ul> or <ol>. A row with no onClick or href is plain, so put no controls in it that need a keyboard.',
    'MediaChip is 44px tall and truncates its label at 14rem. Put a short action word in action rather than lengthening the label.',
  ],
};
