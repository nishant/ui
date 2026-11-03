'use client';
import { useRef, useState, type ComponentPropsWithoutRef, type DragEvent, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { XIcon } from './icons';
import { IconButton } from './primitives';
import { useNishStrings } from './provider';

export interface RejectedFile {
  file: File;
  /** type: not in `accept`. size: over `maxSize`. count: over `maxFiles` (or a second file when not `multiple`). */
  reason: 'type' | 'size' | 'count';
}

export interface FileDropzoneProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children' | 'defaultValue'> {
  /** What the picker offers and the zone accepts: ".pdf,image/*" (the native `accept` syntax). */
  accept?: string;
  /** Allow several files. Without it a new pick replaces the old one. */
  multiple?: boolean;
  /** Largest file in bytes. Bigger files are rejected with reason "size". */
  maxSize?: number;
  /** Most files held at once (with `multiple`). Extra files are rejected with reason "count". */
  maxFiles?: number;
  /** Called whenever the list changes, with the files now held and the files just refused. */
  onFilesChange?: (files: File[], rejected: RejectedFile[]) => void;
  /** The field name of the real `<input type="file">`, so the form posts the files. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Red border. Field sets it from its `error`. */
  invalid?: boolean;
  /** Replaces the default "Drop files here or browse" text. */
  label?: ReactNode;
  /** The bordered zone's root. `data-state` is "dragging" while files are dragged over it, else "idle".
   *  `id`, `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-invalid` go to the file
   *  input, so a Field label reaches it. */
  ref?: Ref<HTMLDivElement>;
}

/** True when a file passes a native `accept` list (extensions, `type/*`, exact types). */
function matchesAccept(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const fileName = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith('.')) return fileName.endsWith(t);
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1));
    return type === t;
  });
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Keeps the real input's FileList equal to what the zone holds, so the form posts it. */
function syncInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  try {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
  } catch {
    // No DataTransfer constructor (old WebViews): the input keeps the last native pick.
  }
}

/** A drop zone around a real `<input type="file">`: click, Enter or Space opens the picker, files
 *  can be dropped, and the held files are listed with a remove button each. */
export function FileDropzone({
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  onFilesChange,
  name,
  disabled = false,
  required = false,
  invalid = false,
  label,
  className,
  ref,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: FileDropzoneProps) {
  const strings = useNishStrings();
  const input = useRef<HTMLInputElement | null>(null);
  const depth = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true';

  const take = (incoming: File[]) => {
    const rejected: RejectedFile[] = [];
    const list: File[] = multiple ? [...files] : [];
    const cap = multiple ? (maxFiles ?? Infinity) : 1;
    let changed = false;
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
      else if (multiple && list.some((f) => sameFile(f, file))) continue;
      else if (list.length >= cap) rejected.push({ file, reason: 'count' });
      else {
        list.push(file);
        changed = true;
      }
    }
    // A single-file zone whose new pick was all refused keeps the file it had.
    const next = !multiple && list.length === 0 ? files : list;
    syncInput(input.current, next);
    if (!changed && rejected.length === 0) return;
    if (next !== files) setFiles(next);
    onFilesChange?.(next, rejected);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(input.current, next);
    onFilesChange?.(next, []);
  };

  const onDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    depth.current += 1;
    if (!disabled) setDragging(true);
  };
  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (disabled) return;
    take(Array.from(e.dataTransfer?.files ?? []));
  };

  return (
    <div
      {...rest}
      ref={ref}
      data-state={dragging ? 'dragging' : 'idle'}
      data-disabled={disabled ? '' : undefined}
      className={cn('group grid gap-2', className)}
    >
      <label
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-th-elevated px-4 py-5 text-center text-sm text-th-hi2',
          'transition-colors duration-150 hover:border-th-hi3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-th-accent/40',
          isInvalid ? 'border-th-loss' : 'border-th-line-control',
          'group-data-[state=dragging]:border-th-accent group-data-[state=dragging]:bg-th-accent-soft',
          'group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50',
          'forced-colors:border-[ButtonText] forced-colors:group-data-[state=dragging]:border-[Highlight] forced-colors:group-data-[state=dragging]:outline forced-colors:group-data-[state=dragging]:outline-2 forced-colors:group-data-[state=dragging]:outline-[Highlight]',
          'forced-colors:has-[:focus-visible]:outline forced-colors:has-[:focus-visible]:outline-2 forced-colors:has-[:focus-visible]:outline-[Highlight]',
        )}
      >
        <input
          ref={input}
          id={id}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => take(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
        <span>{label ?? strings.dropzoneLabel}</span>
        <span
          aria-hidden="true"
          className="inline-flex h-8 items-center rounded-lg border border-th-line-control px-3 text-xs font-medium text-th-hi pointer-coarse:h-11 pointer-coarse:text-sm"
        >
          {strings.browseFiles}
        </span>
      </label>
      {files.length > 0 ? (
        <ul className="grid gap-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-th-line bg-th-surface py-1 pe-1 ps-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-th-hi" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-th-hi3">{formatBytes(file.size)}</span>
              <IconButton label={strings.removeFile(file.name)} size="sm" disabled={disabled} onClick={() => removeAt(i)}>
                <XIcon size={14} />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
