import { Card } from '../../src';
import { CopyButton } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- CopyButton ---------------------------------------------------------------------

const CMD = 'npm install https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v0.3.0';

export const copyButton: ComponentDoc = {
  id: 'copy-button',
  name: 'CopyButton',
  exports: ['CopyButton'],
  summary:
    'Copies text with one click, shows "Copied" for 1.5 seconds and announces it to screen readers. copyText() is the same copy, as a function.',
  importLine: "import { CopyButton, copyText } from '@nish/ui';",
  controls: [
    { key: 'iconOnly', label: 'Icon only', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['secondary', 'ghost', 'primary'] },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  initial: { iconOnly: false, size: 'sm', variant: 'secondary', label: 'Copy link' },
  render: (a) => (
    <CopyButton
      text="https://jobs.nish.software/j/4821"
      label={String(a.label) || undefined}
      iconOnly={!!a.iconOnly}
      size={a.size as 'sm'}
      variant={a.variant as 'secondary'}
    />
  ),
  code: (a) =>
    jsx('CopyButton', {
      text: '{url}',
      label: a.label && a.label !== 'Copy' ? a.label : undefined,
      iconOnly: a.iconOnly || undefined,
      size: a.size === 'sm' ? undefined : a.size,
      variant: a.variant === 'secondary' ? undefined : a.variant,
    }),
  api: { functions: ['copyText'], interfaces: [] },
  stories: [
    {
      id: 'variants',
      name: 'Variants and sizes',
      render: () => (
        <Row>
          <CopyButton text="hello" />
          <CopyButton text="hello" variant="ghost" />
          <CopyButton text="hello" size="md" label="Copy address" />
          <CopyButton text="hello" iconOnly />
          <CopyButton text="hello" iconOnly size="md" label="Copy address" />
        </Row>
      ),
    },
    {
      id: 'code',
      name: 'Beside a command, in a card',
      render: () => (
        <Card padded={false} className="flex w-full max-w-xl items-center gap-2 py-2 pl-3 pr-2">
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-th-hi2">{CMD}</code>
          <CopyButton text={CMD} iconOnly label="Copy install command" />
        </Card>
      ),
    },
  ],
  usage: `import { CopyButton, copyText } from '@nish/ui';

<CopyButton text={shareUrl} label="Copy link" />

// Without a button:
if (await copyText(address)) toast.success('Address copied');`,
  guidelines: [
    'Label it with what it copies when there are several on a page ("Copy address").',
    'The live region says "Copied"; do not add a toast as well.',
    'copyText falls back to a hidden textarea on http:// pages, where the Clipboard API is missing.',
  ],
};
