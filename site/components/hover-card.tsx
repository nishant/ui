import { Avatar } from '../../src';
import { HoverCard } from '../../src/components/hover-card';
import type { ComponentDoc } from './types';

// --- HoverCard (framed) -------------------------------------------------------------

type Side = 'top' | 'bottom';
type Align = 'start' | 'center' | 'end';

const linkClass = 'text-th-accent underline underline-offset-2';

function SymbolPreview() {
  return (
    <div className="grid gap-1">
      <p className="font-medium text-th-hi">Apple Inc.</p>
      <p className="text-xs text-th-hi3">NASDAQ · USD</p>
      <p className="tabular-nums">
        189.84 <span className="text-th-ok">+1.2%</span>
      </p>
    </div>
  );
}

function ProfilePreview() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Nishant Arora" size="lg" />
      <div className="grid gap-0.5">
        <p className="font-medium text-th-hi">Nishant Arora</p>
        <p className="text-xs text-th-hi3">Builds nish.software</p>
      </div>
    </div>
  );
}

function Preview({
  kind = 'symbol',
  side = 'bottom',
  align = 'center',
  openDelay = 500,
  note,
}: {
  kind?: 'symbol' | 'profile';
  side?: Side;
  align?: Align;
  openDelay?: number;
  note?: string;
}) {
  const profile = kind === 'profile';
  return (
    <div className={`flex w-full justify-center ${side === 'top' ? 'self-end' : 'self-start'}`}>
      <HoverCard
        defaultOpen
        side={side}
        align={align}
        openDelay={openDelay}
        width={260}
        content={note ? <p>{note}</p> : profile ? <ProfilePreview /> : <SymbolPreview />}
      >
        <a href={profile ? '#nishant' : '#aapl'} className={linkClass}>
          {profile ? '@nishant' : 'AAPL'}
        </a>
      </HoverCard>
    </div>
  );
}

export const hoverCard: ComponentDoc = {
  id: 'hover-card',
  name: 'HoverCard',
  exports: ['HoverCard'],
  summary:
    'A preview card that opens when the pointer rests on a link or keyboard focus stays on it: a symbol quote, a profile, a page summary. Escape closes it, and so does moving the pointer off the link and the card.',
  importLine: "import { HoverCard } from '@nish/ui';",
  controls: [
    { key: 'side', label: 'Side', type: 'select', options: ['bottom', 'top'] },
    { key: 'align', label: 'Align', type: 'select', options: ['start', 'center', 'end'] },
    { key: 'openDelay', label: 'Open delay (ms)', type: 'number', min: 0, max: 1500 },
  ],
  initial: { side: 'bottom', align: 'center', openDelay: 500 },
  render: (a) => <Preview side={a.side as Side} align={a.align as Align} openDelay={Number(a.openDelay)} />,
  code: (a) =>
    [
      '<HoverCard',
      '  content={<SymbolPreview symbol="AAPL" />}',
      ...(a.side === 'bottom' ? [] : [`  side="${a.side}"`]),
      ...(a.align === 'center' ? [] : [`  align="${a.align}"`]),
      ...(Number(a.openDelay) === 500 ? [] : [`  openDelay={${Number(a.openDelay)}}`]),
      '>',
      '  <a href="/symbols/AAPL">AAPL</a>',
      '</HoverCard>',
    ].join('\n'),
  framed: { height: 300 },
  stories: [
    { id: 'symbol', name: 'Symbol preview', render: () => <Preview /> },
    { id: 'profile', name: 'Profile', render: () => <Preview kind="profile" /> },
    { id: 'top', name: 'Above', note: 'Flips below when there is no room.', render: () => <Preview side="top" note="Opens above the link when there is room." /> },
  ],
  usage: `import { HoverCard } from '@nish/ui';

<HoverCard content={<SymbolPreview symbol="AAPL" />}>
  <a href="/symbols/AAPL">AAPL</a>
</HoverCard>`,
  guidelines: [
    'It is extra, never required: touch screens never open it (a tap follows the link), so the page the link opens must show the same information.',
    'For a short label use Tooltip. For a panel the user opens with a click and works in, use Popover.',
    "The pointer can move into the card to select text or press a link in it. Keyboard users hear the card's text with the link (aria-describedby) but cannot tab into it.",
    'One card is open at a time.',
    'It waits 500ms before opening and 300ms before closing, so sweeping the pointer across a list does not flash cards.',
  ],
};
