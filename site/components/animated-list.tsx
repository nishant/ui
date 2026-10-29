import { useEffect, useRef, useState } from 'react';
import { AnimatedList, Button, Card } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- AnimatedList -------------------------------------------------------------------

const NAMES = ['trackers', 'status', 'jobs', 'trading', 'mc', 'skills', 'hub', 'docs'];

interface Row {
  id: string;
  name: string;
}

function Item({ row, onRemove }: { row: Row; phase?: string; onRemove?: () => void }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="min-w-0 flex-1 truncate text-sm text-th-hi">{row.name}.nish.software</span>
      {onRemove ? (
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    </Card>
  );
}

function Playground({ exitMs, as }: { exitMs: number; as: 'ul' | 'ol' | 'div' }) {
  const next = useRef(4);
  const [rows, setRows] = useState<Row[]>(() => NAMES.slice(0, 3).map((name, i) => ({ id: `r${i}`, name })));
  const add = () => {
    const n = next.current++;
    setRows((r) => [{ id: `r${n}`, name: NAMES[n % NAMES.length]! }, ...r]);
  };
  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={add}>
          Add to the top
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setRows((r) => r.slice(0, -1))} disabled={!rows.length}>
          Remove the last
        </Button>
      </div>
      <AnimatedList items={rows} getKey={(r) => r.id} exitMs={exitMs} as={as} className="grid gap-2">
        {(row, phase) => <Item row={row} phase={phase} onRemove={() => setRows((r) => r.filter((x) => x.id !== row.id))} />}
      </AnimatedList>
    </div>
  );
}

function Live() {
  const next = useRef(4);
  const [rows, setRows] = useState<Row[]>(() => NAMES.slice(0, 3).map((name, i) => ({ id: `r${i}`, name })));
  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((r) => {
        if (r.length >= 5 || (r.length > 2 && Math.random() < 0.45)) {
          const at = Math.floor(Math.random() * r.length);
          return r.filter((_, i) => i !== at);
        }
        const n = next.current++;
        return [...r.slice(0, 1), { id: `r${n}`, name: NAMES[n % NAMES.length]! }, ...r.slice(1)];
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);
  return (
    <AnimatedList items={rows} getKey={(r) => r.id} as="ul" className="grid w-full max-w-md gap-2">
      {(row) => <Item row={row} />}
    </AnimatedList>
  );
}

export const animatedList: ComponentDoc = {
  id: 'animated-list',
  name: 'AnimatedList',
  exports: ['AnimatedList'],
  summary:
    'A list whose items rise in when added, fade and close up when removed, and glide to their new place when others move.',
  importLine: "import { AnimatedList } from '@nish/ui';",
  controls: [
    { key: 'as', label: 'Element', type: 'select', options: ['ul', 'ol', 'div'] },
    { key: 'exitMs', label: 'Exit time (ms)', type: 'number', min: 0, max: 2000 },
  ],
  initial: { as: 'ul', exitMs: 420 },
  render: (a) => <Playground exitMs={Number(a.exitMs)} as={a.as as 'ul'} />,
  code: (a) =>
    jsx(
      'AnimatedList',
      { items: '{items}', getKey: '{(item) => item.id}', as: a.as === 'div' ? undefined : a.as, exitMs: Number(a.exitMs) === 420 ? undefined : Number(a.exitMs) },
      '{(item) => <Row item={item} />}',
    ),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'Items are added and removed every 1.5 seconds. The neighbours move aside smoothly.',
      wide: true,
      render: () => <Live />,
    },
    {
      id: 'static',
      name: 'Still',
      note: 'The first render never animates.',
      render: () => (
        <AnimatedList items={NAMES.slice(0, 3).map((name) => ({ id: name, name }))} getKey={(r) => r.id} as="ul" className="grid w-full max-w-sm gap-2">
          {(row) => <Item row={row} />}
        </AnimatedList>
      ),
    },
    {
      id: 'slow',
      name: 'Slow exit',
      note: 'exitMs keeps a removed item on screen longer.',
      render: () => <Playground exitMs={1200} as="div" />,
    },
  ],
  usage: `import { AnimatedList } from '@nish/ui';

<AnimatedList items={sessions} getKey={(s) => s.id} as="ul" className="grid gap-3">
  {(s, phase) => <SessionCard session={s} entering={phase === 'enter'} />}
</AnimatedList>`,
  guidelines: [
    'Use it where items come and go while someone watches, such as a list of running jobs.',
    'getKey must return a unique, stable key. If two items share one, the first wins.',
    'The render function gets the phase: enter, idle or exit. Use it for extra styling, not to change the content.',
    'Do not animate a list people sort or filter by hand; changes they cause should be instant.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
