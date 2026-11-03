import { Separator } from '../../src/components/separator';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

export const separator: ComponentDoc = {
  id: 'separator',
  name: 'Separator',
  exports: ['Separator'],
  summary:
    'A thin rule between groups of content, horizontal or vertical, with an optional centered label. Decorative by default (role none); pass decorative={false} for a real role="separator".',
  importLine: "import { Separator } from '@nish/ui';",
  controls: [
    { key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] },
    { key: 'decorative', label: 'Decorative', type: 'boolean' },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  initial: { orientation: 'horizontal', decorative: true, label: '' },
  render: (a) =>
    a.orientation === 'vertical' ? (
      <div className="flex h-8 items-center gap-3 text-sm text-th-hi2">
        Inbox
        <Separator orientation="vertical" decorative={!!a.decorative} />
        Sent
      </div>
    ) : (
      <div className="w-full max-w-sm text-sm text-th-hi2">
        Sign in with email
        <Separator className="my-3" decorative={!!a.decorative} label={a.label ? String(a.label) : undefined} />
        Continue with a passkey
      </div>
    ),
  code: (a) =>
    jsx('Separator', {
      orientation: a.orientation === 'vertical' ? 'vertical' : undefined,
      decorative: a.decorative ? undefined : '{false}',
      label: a.label ? String(a.label) : undefined,
    }),
  stories: [
    {
      id: 'horizontal',
      name: 'Horizontal',
      render: () => (
        <div className="w-full text-sm text-th-hi2">
          Above
          <Separator className="my-3" />
          Below
        </div>
      ),
    },
    {
      id: 'label',
      name: 'With a label',
      render: () => (
        <div className="w-full text-sm text-th-hi2">
          <Separator label="or" />
        </div>
      ),
    },
    {
      id: 'vertical',
      name: 'Vertical in a toolbar',
      render: () => (
        <div className="flex h-8 items-center gap-3 text-sm text-th-hi2">
          Edit
          <Separator orientation="vertical" />
          Share
          <Separator orientation="vertical" />
          Delete
        </div>
      ),
    },
  ],
  usage: `import { Separator } from '@nish/ui';

<Separator />
<Separator label="or" />
<Separator orientation="vertical" className="h-5" />
<Separator decorative={false} />  // role="separator" for assistive technology`,
  guidelines: [
    'Leave it decorative unless the rule divides regions a screen reader user should hear about; most rules only repeat spacing.',
    'A vertical separator stretches to the height of its flex row; give it a height in a block context.',
    'The label shows only on horizontal separators.',
    'In forced-colors mode the rule is drawn in CanvasText so it stays visible.',
  ],
};
