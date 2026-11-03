import { Card } from '../../src';
import { CopyButton } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- CopyButton ---------------------------------------------------------------------

const CMD = 'npm install nish-ui';

export const copyButton: ComponentDoc = {
  id: 'copy-button',
  name: 'CopyButton',
  exports: ['CopyButton'],
  summary:
    'Copies text with one click, shows "Copied" for 1.5 seconds and announces it to screen readers. Without a Clipboard API or on an insecure origin it falls back to a hidden textarea, and shows failedLabel when that fails too. copyText() is the same copy, as a function.',
  importLine: "import { CopyButton, copyText } from '@nish/ui';",
  controls: [
    { key: 'iconOnly', label: 'Icon only', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['secondary', 'ghost', 'primary'] },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'failedLabel', label: 'Failed label', type: 'text' },
  ],
  initial: { iconOnly: false, size: 'sm', variant: 'secondary', label: 'Copy link', failedLabel: 'Copy failed' },
  render: (a) => (
    <CopyButton
      text="https://jobs.nish.software/j/4821"
      label={String(a.label) || undefined}
      failedLabel={String(a.failedLabel) || undefined}
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
  html: {
    height: 120,
    code: `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
  <code id="install-cmd">npm install nish-ui</code>
  <nish-copy-button for="install-cmd"></nish-copy-button>
  <nish-copy-button value="https://jobs.nish.software/j/4821" label="Copy link" icon></nish-copy-button>
</div>`,
  },
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
    'On an insecure origin (plain http) or in a browser without the Clipboard API, CopyButton copies through a hidden textarea and execCommand. When that fails as well it shows failedLabel (default "Copy failed") for 1.5 seconds and announces it; onCopy(false) is called.',
    'Label it with what it copies when there are several on a page ("Copy address").',
    'The live region says "Copied"; do not add a toast as well.',
    'copyText falls back to a hidden textarea on http:// pages, where the Clipboard API is missing.',
  ],
};
