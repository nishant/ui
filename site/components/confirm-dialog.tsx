import { useState } from 'react';
import { Button } from '../../src';
import { ConfirmDialog } from '../../src/components/overlay';
import type { ComponentDoc } from './types';

// --- ConfirmDialog (framed) -----------------------------------------------------------

type Tone = 'danger' | 'primary';

function ConfirmPreview({
  title,
  body,
  confirmLabel,
  tone,
  pending,
  cancelLabel,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  tone: Tone;
  pending: boolean;
  cancelLabel?: string;
}) {
  return (
    <ConfirmDialog
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      pending={pending}
      onConfirm={() => undefined}
      onCancel={() => undefined}
    />
  );
}

export function RealConfirmButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Delete tracker
      </Button>
      {open ? (
        <ConfirmDialog
          title="Delete this tracker?"
          body="Its price history goes with it."
          confirmLabel="Delete"
          pending={pending}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setPending(true);
            window.setTimeout(() => {
              setPending(false);
              setOpen(false);
            }, 900);
          }}
        />
      ) : null}
    </>
  );
}

export const confirmDialog: ComponentDoc = {
  id: 'confirm-dialog',
  name: 'ConfirmDialog',
  exports: ['ConfirmDialog'],
  summary:
    'A yes-or-no question before an action, in place of window.confirm: a small Modal with Cancel and a confirm button. For destructive actions, focus starts on Cancel.',
  importLine: "import { ConfirmDialog } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
    { key: 'confirmLabel', label: 'Confirm label', type: 'text' },
    { key: 'tone', label: 'Tone', type: 'select', options: ['danger', 'primary'] },
    { key: 'pending', label: 'Pending', type: 'boolean' },
  ],
  initial: {
    title: 'Delete this tracker?',
    body: 'Its price history goes with it. This cannot be undone.',
    confirmLabel: 'Delete',
    tone: 'danger',
    pending: false,
  },
  render: (a) => (
    <ConfirmPreview
      title={String(a.title)}
      body={String(a.body) || undefined}
      confirmLabel={String(a.confirmLabel)}
      tone={a.tone as Tone}
      pending={!!a.pending}
    />
  ),
  code: (a) =>
    [
      '{confirming ? (',
      '  <ConfirmDialog',
      `    title="${String(a.title)}"`,
      ...(a.body ? [`    body="${String(a.body)}"`] : []),
      `    confirmLabel="${String(a.confirmLabel)}"`,
      ...(a.tone === 'danger' ? [] : [`    tone="${a.tone}"`]),
      '    pending={remove.isPending}',
      '    onConfirm={() => remove.mutate(id, { onSettled: () => setConfirming(false) })}',
      '    onCancel={() => setConfirming(false)}',
      '  />',
      ') : null}',
    ].join('\n'),
  framed: { height: 300 },
  stories: [
    {
      id: 'danger',
      name: 'Danger',
      note: 'Focus starts on Cancel.',
      render: () => <ConfirmPreview title="Delete this tracker?" body="Its price history goes with it. This cannot be undone." confirmLabel="Delete" tone="danger" pending={false} />,
    },
    {
      id: 'primary',
      name: 'Primary',
      note: 'Focus starts on the confirm button.',
      render: () => (
        <ConfirmPreview title="Mark 12 jobs as applied?" body="They move to the Applied column." confirmLabel="Mark as applied" tone="primary" pending={false} />
      ),
    },
    {
      id: 'pending',
      name: 'Pending',
      note: 'A spinner on the confirm button; Cancel, Escape and the backdrop wait for it.',
      render: () => <ConfirmPreview title="Close position?" body="2 AMD Nov 20 $180 calls at market." confirmLabel="Close position" tone="danger" pending />,
    },
    {
      id: 'title-only',
      name: 'Title only, custom cancel',
      render: () => <ConfirmPreview title="Discard this draft?" confirmLabel="Discard" cancelLabel="Keep editing" tone="danger" pending={false} />,
    },
  ],
  usage: `import { useState } from 'react';
import { Button, ConfirmDialog } from '@nish/ui';

export function DeleteTracker({ remove }: { remove: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      {open ? (
        <ConfirmDialog
          title="Delete this tracker?"
          body="Its price history goes with it."
          confirmLabel="Delete"
          pending={pending}
          onCancel={() => setOpen(false)}
          onConfirm={async () => {
            setPending(true);
            try { await remove(); setOpen(false); } finally { setPending(false); }
          }}
        />
      ) : null}
    </>
  );
}`,
  guidelines: [
    'Ask a question in the title and name the action on the button ("Delete", not "OK").',
    'Use it in place of window.confirm and of hand-rolled two-step remove buttons.',
    'Keep the dialog open while the action runs (pending), and close it when the action settles. Toast the error if it fails.',
    'Skip the question for actions that can be undone: do them, and offer Undo in a toast.',
  ],
};
