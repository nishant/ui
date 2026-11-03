import { useState } from 'react';
import { FileDropzone, type RejectedFile } from '../../src/components/file-dropzone';
import { Field } from '../../src/components/forms';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- FileDropzone --------------------------------------------------------------------

function WithRejections() {
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  return (
    <div className="grid w-full max-w-md gap-2">
      <FileDropzone
        aria-label="Photos"
        multiple
        accept="image/*"
        maxSize={2 * 1024 * 1024}
        maxFiles={3}
        onFilesChange={(_files, bad) => setRejected(bad)}
      />
      {rejected.length > 0 ? (
        <ul role="status" className="text-xs text-th-loss">
          {rejected.map((r, i) => (
            <li key={i}>
              {r.file.name}: {r.reason === 'type' ? 'not an image' : r.reason === 'size' ? 'over 2 MB' : 'only 3 photos'}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const fileDropzone: ComponentDoc = {
  id: 'file-dropzone',
  name: 'FileDropzone',
  exports: ['FileDropzone'],
  summary:
    'A drop zone around a real file input. Click, Enter or Space opens the picker, files can be dropped, and the held files are listed with a remove button each. It checks type, size and count and tells you what it refused; the form still posts the files.',
  importLine: "import { FileDropzone } from '@nish/ui';",
  controls: [
    { key: 'multiple', label: 'Multiple', type: 'boolean' },
    { key: 'accept', label: 'Accept', type: 'select', options: ['any', 'image/*', '.pdf', '.csv,.xlsx'] },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
  ],
  initial: { multiple: true, accept: 'any', disabled: false, invalid: false },
  render: (a) => (
    <div className="w-full max-w-md">
      <FileDropzone
        aria-label="Files"
        multiple={!!a.multiple}
        accept={a.accept === 'any' ? undefined : String(a.accept)}
        disabled={!!a.disabled}
        invalid={!!a.invalid}
      />
    </div>
  ),
  code: (a) =>
    jsx('FileDropzone', {
      'aria-label': 'Files',
      multiple: a.multiple,
      accept: a.accept === 'any' ? undefined : a.accept,
      disabled: a.disabled,
      invalid: a.invalid,
    }),
  stories: [
    {
      id: 'single',
      name: 'One file',
      render: () => (
        <div className="w-full max-w-md">
          <FileDropzone aria-label="Resume" accept=".pdf" label="Drop your resume (PDF) here or browse" />
        </div>
      ),
    },
    {
      id: 'rejections',
      name: 'Limits and refusals',
      note: 'onFilesChange(files, rejected) reports each refused file with a reason: type, size or count.',
      render: () => <WithRejections />,
    },
    {
      id: 'field',
      name: 'In a Field',
      render: () => (
        <div className="w-full max-w-md">
          <Field label="Attachments" hint="PDF or images, up to 10 MB each.">
            <FileDropzone multiple accept=".pdf,image/*" maxSize={10 * 1024 * 1024} />
          </Field>
        </div>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <div className="w-full max-w-md">
          <FileDropzone aria-label="Locked" disabled />
        </div>
      ),
    },
  ],
  usage: `import { FileDropzone } from '@nish/ui';

<FileDropzone
  name="attachments"
  aria-label="Attachments"
  multiple
  accept=".pdf,image/*"
  maxSize={10 * 1024 * 1024}
  maxFiles={5}
  onFilesChange={(files, rejected) => {
    setFiles(files);
    setProblems(rejected);
  }}
/>`,
  guidelines: [
    'It is a real <input type="file"> inside a label, so keyboard and screen reader users get the native picker. The visible button is decoration.',
    'Check type and size on the server too: accept and maxSize are conveniences, not security.',
    'Show the refused files from onFilesChange yourself; the zone lists only what it holds.',
    'Dropped files are copied into the input where the browser allows it, so a native form posts them.',
  ],
};
