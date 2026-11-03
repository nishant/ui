import { VisuallyHidden } from '../../src/components/visually-hidden';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- VisuallyHidden -----------------------------------------------------------------

export const visuallyHidden: ComponentDoc = {
  id: 'visually-hidden',
  name: 'VisuallyHidden',
  exports: ['VisuallyHidden'],
  summary:
    'Content that screen readers read and sighted users do not see. It hides with inline styles, so it works without Tailwind or any stylesheet.',
  importLine: "import { VisuallyHidden } from '@nish/ui';",
  controls: [
    { key: 'as', label: 'Element', type: 'select', options: ['span', 'div'] },
    { key: 'text', label: 'Hidden text', type: 'text' },
  ],
  initial: { as: 'span', text: 'Unread messages: 3' },
  render: (a) => (
    <div className="relative flex items-center gap-2 text-sm text-th-hi2">
      <span aria-hidden="true" className="rounded-full bg-th-accent px-2 py-0.5 text-xs font-semibold text-th-on-accent">
        3
      </span>
      <VisuallyHidden as={a.as as 'span'}>{String(a.text)}</VisuallyHidden>
      <span>Messages (the badge is read as the hidden text)</span>
    </div>
  ),
  code: (a) => jsx('VisuallyHidden', { as: a.as === 'span' ? undefined : a.as }, String(a.text)),
  stories: [
    {
      id: 'icon-button',
      name: 'Name for an icon-only control',
      render: () => (
        <button
          type="button"
          className="relative inline-flex size-11 items-center justify-center rounded-lg border border-th-line-control text-th-hi"
        >
          <span aria-hidden="true">+</span>
          <VisuallyHidden>Add item</VisuallyHidden>
        </button>
      ),
    },
    {
      id: 'live',
      name: 'Live region',
      note: 'Keep the region mounted and change its text, so the update is announced.',
      render: () => (
        <p className="relative text-sm text-th-hi2">
          Save changes
          <VisuallyHidden role="status" aria-live="polite">
            Draft saved
          </VisuallyHidden>
        </p>
      ),
    },
  ],
  usage: `import { VisuallyHidden } from '@nish/ui';

<button type="button">
  <TrashIcon aria-hidden="true" />
  <VisuallyHidden>Delete draft</VisuallyHidden>
</button>`,
  guidelines: [
    'Use it for text that adds meaning a screen reader needs and the layout already shows some other way (an icon, a color, a number).',
    'Do not hide a form control or a link target with it: keyboard users would tab to something they cannot see.',
    'The element is absolutely positioned: give its parent position: relative so the 1px box cannot land somewhere odd.',
    'It takes any span or div attribute, so role="status" and aria-live work for a live region.',
  ],
};
