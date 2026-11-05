import { useState } from 'react';
import { Carousel } from '../../src/components/carousel';
import { Button, Card } from '../../src/components/primitives';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Carousel -------------------------------------------------------------------------

const TRIPS = [
  { title: 'Smoky Mountains', line: 'Three days of trails and waterfalls.' },
  { title: 'Big Bend', line: 'Desert canyons on the Rio Grande.' },
  { title: 'Olympic', line: 'Rainforest, coast and glaciers.' },
  { title: 'Zion', line: 'Slot canyons and the Narrows.' },
  { title: 'Acadia', line: 'Granite coast and sunrise hikes.' },
];

function TripCard({ title, line }: { title: string; line: string }) {
  return (
    <Card className="h-full">
      <p className="text-sm font-semibold text-th-hi">{title}</p>
      <p className="mt-1 text-sm text-th-hi3">{line}</p>
    </Card>
  );
}

function Trips({ label = 'Featured trips', ...props }: Omit<Parameters<typeof Carousel>[0], 'aria-label' | 'children'> & { label?: string }) {
  return (
    <div className="w-full min-w-0 max-w-md">
      <Carousel aria-label={label} {...props}>
        {TRIPS.map((t) => (
          <TripCard key={t.title} {...t} />
        ))}
      </Carousel>
    </div>
  );
}

function Many() {
  return (
    <div className="w-full min-w-0 max-w-md">
      <Carousel aria-label="Numbered slides">
        {Array.from({ length: 12 }, (_, i) => (
          <Card key={i}>
            <p className="text-sm font-semibold text-th-hi">Slide {i + 1}</p>
            <p className="mt-1 text-sm text-th-hi3">More than seven slides show a counter instead of dots.</p>
          </Card>
        ))}
      </Carousel>
    </div>
  );
}

function Controlled() {
  const [i, setI] = useState(0);
  return (
    <div className="grid w-full min-w-0 max-w-md gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setI(0)}>
          First
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setI(TRIPS.length - 1)}>
          Last
        </Button>
        <p className="text-xs tabular-nums text-th-hi3">Slide {i + 1}</p>
      </div>
      <Trips label="Controlled trips" index={i} onIndexChange={setI} />
    </div>
  );
}

export const carousel: ComponentDoc = {
  id: 'carousel',
  name: 'Carousel',
  exports: ['Carousel'],
  summary:
    'A row of slides you can swipe, step through with buttons or arrow keys, or jump to with the dots. It scrolls natively with scroll snap, so touch and right-to-left work without extra code.',
  importLine: "import { Carousel } from '@nish/ui';",
  controls: [
    { key: 'slideWidth', label: 'Slide width', type: 'select', options: ['100%', '85%', '50%'] },
    { key: 'loop', label: 'Loop', type: 'boolean' },
    { key: 'autoPlay', label: 'Auto-rotate', type: 'boolean' },
    { key: 'indicators', label: 'Dots', type: 'boolean' },
  ],
  initial: { slideWidth: '100%', loop: false, autoPlay: false, indicators: true },
  render: (a) => (
    <Trips
      key={`${a.slideWidth}-${a.autoPlay}`}
      slideWidth={String(a.slideWidth)}
      loop={!!a.loop}
      autoPlay={a.autoPlay ? 5000 : undefined}
      indicators={!!a.indicators}
    />
  ),
  code: (a) =>
    jsx(
      'Carousel',
      {
        'aria-label': 'Featured trips',
        slideWidth: a.slideWidth === '100%' ? undefined : a.slideWidth,
        loop: a.loop,
        autoPlay: a.autoPlay ? 5000 : undefined,
        indicators: a.indicators ? undefined : false,
      },
      '{trips.map((t) => <TripCard key={t.id} trip={t} />)}',
    ),
  stories: [
    { id: 'basic', name: 'Basic', render: () => <Trips /> },
    { id: 'peek', name: 'Next slide peeking', render: () => <Trips label="Peeking trips" slideWidth="85%" /> },
    { id: 'many', name: 'Many slides', render: () => <Many /> },
    {
      id: 'autoplay',
      name: 'Auto-rotation',
      note: 'Pauses on hover and focus; the button stops it for good. Off under reduced motion.',
      render: () => <Trips label="Rotating trips" autoPlay={5000} />,
    },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
  ],
  usage: `import { Carousel } from '@nish/ui';

<Carousel aria-label="Featured trips" slideWidth="85%">
  {trips.map((t) => <TripCard key={t.id} trip={t} />)}
</Carousel>`,
  guidelines: [
    'Give every carousel an aria-label that says what the slides are.',
    'Prefer a list or a grid when every item matters; a carousel hides all but one slide at a time.',
    'Keep autoPlay off unless the slides are decorative; when on, use 5 seconds or more.',
    'Slides stay in the Tab order, so links and buttons inside them are reachable; focusing one brings its slide into view.',
  ],
};
