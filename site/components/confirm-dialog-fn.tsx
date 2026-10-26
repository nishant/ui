import { useState } from 'react';
import { Button } from '../../src';
import { confirmDialog, type ConfirmDialogOptions } from '../../src/theme';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- confirmDialog (static pages) --------------------------------------------------------

function Trigger({ label, opts }: { label: string; opts: ConfirmDialogOptions }) {
  const [answer, setAnswer] = useState<string>('');
  return (
    <span className="inline-flex items-center gap-3">
      <Button size="sm" onClick={async () => setAnswer((await confirmDialog(opts)) ? 'true' : 'false')}>
        {label}
      </Button>
      {answer ? <span className="text-xs text-th-hi3 tabular-nums">resolved {answer}</span> : null}
    </span>
  );
}

const SAVE: ConfirmDialogOptions = {
  title: 'Save before closing?',
  body: 'Your note has changes that are not saved yet.',
  confirmLabel: 'Save',
  cancelLabel: 'Close without saving',
};

const DELETE: ConfirmDialogOptions = {
  title: 'Delete this tile?',
  body: 'It leaves the hub for everyone. You can add it again later.',
  confirmLabel: 'Delete',
  tone: 'danger',
};

export const confirmDialogFnDoc: ComponentDoc & { source: string } = {
  id: 'confirm-dialog-fn',
  name: 'confirmDialog',
  exports: [],
  source: 'src/theme.ts',
  summary:
    'window.confirm for pages without React (the startpage, the hub, mc): a native <dialog class="nish-dialog"> opened with showModal(). It resolves true or false; the browser traps focus, Escape and a backdrop click cancel, and focus returns to the opener. Same look and focus rules as the React ConfirmDialog.',
  importLine: "import { confirmDialog } from '@nish/ui/theme';",
  controls: [{ key: 'tone', label: 'Tone', type: 'select', options: ['primary', 'danger'] }],
  initial: { tone: 'primary' },
  render: (a) => <Trigger label="Ask" opts={a.tone === 'danger' ? DELETE : SAVE} />,
  code: (a) =>
    a.tone === 'danger'
      ? `if (await confirmDialog({ title: 'Delete this tile?', body, confirmLabel: 'Delete', tone: 'danger' })) remove();`
      : `if (await confirmDialog({ title: 'Save before closing?', body, confirmLabel: 'Save', cancelLabel: 'Close without saving' })) save();`,
  api: { functions: ['confirmDialog'], interfaces: ['ConfirmDialogOptions'] },
  stories: [
    {
      id: 'kinds',
      name: 'Triggers',
      note: 'Each button opens one dialog and shows what the promise resolved to.',
      render: () => (
        <Row>
          <Trigger label="Save before closing" opts={SAVE} />
          <Trigger label="Delete (danger)" opts={DELETE} />
          <Trigger label="Title only" opts={{ title: 'Sign out of every device?', confirmLabel: 'Sign out' }} />
        </Row>
      ),
    },
  ],
  usage: `<link rel="stylesheet" href="nish/nish-components.css">
<script type="module">
  import { confirmDialog } from './nish/theme.js';
  if (await confirmDialog({ title: 'Save before closing?', confirmLabel: 'Save', cancelLabel: 'Close without saving' })) save();
</script>

<!-- Classic scripts: await window.nishTheme.confirmDialog({ … }) from theme.global.js. -->`,
  guidelines: [
    'Use it where a page called window.confirm: it is async, so await it before acting, and run the action (a save) before tearing the page or a dialog down.',
    'tone: "danger" for destructive actions: a red confirm button, and focus starts on Cancel. Without it the accent confirm button takes the first focus.',
    'Escape inside it does not reach the page: an outer framework dialog (an Angular MatDialog) stays open until you close it.',
    'Title and body are text, or a Node for markup; strings are never parsed as HTML. React apps use <ConfirmDialog> instead.',
  ],
};
