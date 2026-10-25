import { Card } from '../../src';
import { Kbd } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Kbd ----------------------------------------------------------------------------

const SHORTCUTS: [string[], string][] = [
  [['/'], 'Search'],
  [['⌘', 'K'], 'Command palette'],
  [['J'], 'Next job'],
  [['K'], 'Previous job'],
  [['Esc'], 'Close'],
];

export const kbd: ComponentDoc = {
  id: 'kbd',
  name: 'Kbd',
  exports: ['Kbd'],
  summary: 'A keyboard key or shortcut, in the mono font on a raised key.',
  importLine: "import { Kbd } from '@nish/ui';",
  controls: [{ key: 'key', label: 'Key', type: 'text' }],
  initial: { key: '⌘K' },
  render: (a) => <Kbd>{String(a.key)}</Kbd>,
  code: (a) => jsx('Kbd', {}, String(a.key)),
  stories: [
    {
      id: 'keys',
      name: 'Keys',
      render: () => (
        <Row>
          <Kbd>/</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>←</Kbd>
        </Row>
      ),
    },
    {
      id: 'combo',
      name: 'In a sentence',
      render: () => (
        <p className="text-sm text-th-hi2">
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the palette, or <Kbd>/</Kbd> to search.
        </p>
      ),
    },
    {
      id: 'card',
      name: 'Shortcut legend, in a card',
      render: () => (
        <Card className="w-full max-w-xs">
          <p className="text-sm font-semibold text-th-hi">Keyboard shortcuts</p>
          <dl className="mt-3 grid gap-2 text-sm">
            {SHORTCUTS.map(([keys, what]) => (
              <div key={what} className="flex items-center justify-between gap-3">
                <dt className="text-th-hi2">{what}</dt>
                <dd className="flex gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ),
    },
  ],
  usage: `import { Kbd } from '@nish/ui';

<p>Press <Kbd>/</Kbd> to search.</p>`,
  guidelines: [
    'One Kbd per key; put a space between keys of a combination.',
    'Use the platform symbol people see on their keyboard (⌘ on macOS, Ctrl elsewhere).',
    'Static pages get the same look from the base kbd style in base.css.',
  ],
};
