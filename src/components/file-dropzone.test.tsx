import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileDropzone } from './file-dropzone';
import { Field } from './forms';
import { NishProvider } from './provider';

afterEach(cleanup);

const file = (name: string, size = 10, type = 'text/plain', lastModified = 1) => {
  const f = new File(['x'.repeat(size)], name, { type, lastModified });
  return f;
};

const input = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const zone = () => input().closest('label') as HTMLElement;

function pick(files: File[]) {
  Object.defineProperty(input(), 'files', { configurable: true, value: files });
  fireEvent.change(input());
}

const drop = (files: File[]) => fireEvent.drop(zone(), { dataTransfer: { files } });

describe('FileDropzone', () => {
  it('renders a real file input inside a label with the default text and strings', () => {
    render(<FileDropzone name="docs" accept=".pdf" multiple />);
    expect(input().type).toBe('file');
    expect(input().name).toBe('docs');
    expect(input().accept).toBe('.pdf');
    expect(input().multiple).toBe(true);
    expect(screen.getByText('Drop files here or browse')).toBeTruthy();
    expect(screen.getByText('Browse files')).toBeTruthy();
    expect(screen.getByLabelText(/Drop files here/)).toBe(input());
  });

  it('takes its text from the provider and the label prop', () => {
    const { unmount } = render(
      <NishProvider strings={{ dropzoneLabel: 'Déposez', browseFiles: 'Parcourir' }}>
        <FileDropzone />
      </NishProvider>,
    );
    expect(screen.getByText('Déposez')).toBeTruthy();
    expect(screen.getByText('Parcourir')).toBeTruthy();
    unmount();
    render(<FileDropzone label="Upload a CV" />);
    expect(screen.getByText('Upload a CV')).toBeTruthy();
  });

  it('lists picked files with size and reports them', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone onFilesChange={onFilesChange} />);
    const a = file('a.txt', 2048);
    pick([a]);
    expect(onFilesChange).toHaveBeenCalledWith([a], []);
    expect(screen.getByText('a.txt')).toBeTruthy();
    expect(screen.getByText('2.0 KB')).toBeTruthy();
  });

  it('formats byte sizes', () => {
    render(<FileDropzone multiple />);
    pick([file('s', 500), file('m', 20 * 1024, 'text/plain', 2), file('g', 3 * 1024 * 1024, 'text/plain', 3), file('h', 30 * 1024 * 1024, 'text/plain', 4)]);
    expect(screen.getByText('500 B')).toBeTruthy();
    expect(screen.getByText('20 KB')).toBeTruthy();
    expect(screen.getByText('3.0 MB')).toBeTruthy();
    expect(screen.getByText('30 MB')).toBeTruthy();
  });

  it('replaces the file when not multiple, and refuses extra files with reason count', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone onFilesChange={onFilesChange} />);
    const a = file('a.txt');
    const b = file('b.txt', 10, 'text/plain', 2);
    const c = file('c.txt', 10, 'text/plain', 3);
    pick([a]);
    pick([b, c]);
    expect(onFilesChange).toHaveBeenLastCalledWith([b], [{ file: c, reason: 'count' }]);
    expect(screen.queryByText('a.txt')).toBeNull();
    expect(screen.getByText('b.txt')).toBeTruthy();
  });

  it('keeps the old file when a single replacement is all refused', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone accept="image/*" onFilesChange={onFilesChange} />);
    const img = file('a.png', 5, 'image/png');
    const txt = file('b.txt');
    pick([img]);
    pick([txt]);
    expect(onFilesChange).toHaveBeenLastCalledWith([img], [{ file: txt, reason: 'type' }]);
    expect(screen.getByText('a.png')).toBeTruthy();
  });

  it('rejects by type: extensions, wildcards and exact types, case-insensitively', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone multiple accept=".PDF, image/*, text/csv" onFilesChange={onFilesChange} />);
    const ok1 = file('Report.pdf', 5, 'application/pdf');
    const ok2 = file('p.png', 5, 'image/png', 2);
    const ok3 = file('t.csv', 5, 'text/csv', 3);
    const bad = file('x.zip', 5, 'application/zip', 4);
    const bad2 = file('v.mp4', 5, 'video/mp4', 5);
    pick([ok1, ok2, ok3, bad, bad2]);
    expect(onFilesChange).toHaveBeenCalledWith(
      [ok1, ok2, ok3],
      [
        { file: bad, reason: 'type' },
        { file: bad2, reason: 'type' },
      ],
    );
  });

  it('accepts anything without accept', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone onFilesChange={onFilesChange} />);
    const f = file('x.weird', 1, '');
    pick([f]);
    expect(onFilesChange).toHaveBeenCalledWith([f], []);
  });

  it('rejects by size: equal passes, bigger is refused', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone multiple maxSize={100} onFilesChange={onFilesChange} />);
    const edge = file('edge', 100);
    const big = file('big', 101, 'text/plain', 2);
    pick([edge, big]);
    expect(onFilesChange).toHaveBeenCalledWith([edge], [{ file: big, reason: 'size' }]);
  });

  it('caps the held files at maxFiles across picks, and ignores a repeat', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone multiple maxFiles={2} onFilesChange={onFilesChange} />);
    const a = file('a', 1, 'text/plain', 1);
    const b = file('b', 1, 'text/plain', 2);
    const c = file('c', 1, 'text/plain', 3);
    pick([a]);
    pick([b, c]);
    expect(onFilesChange).toHaveBeenLastCalledWith([a, b], [{ file: c, reason: 'count' }]);
    const calls = onFilesChange.mock.calls.length;
    pick([a]);
    expect(onFilesChange).toHaveBeenCalledTimes(calls);
  });

  it('accepts dropped files and clears the dragging state', () => {
    const onFilesChange = vi.fn();
    const { container } = render(<FileDropzone multiple onFilesChange={onFilesChange} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('data-state')).toBe('idle');
    fireEvent.dragEnter(zone());
    expect(root.getAttribute('data-state')).toBe('dragging');
    const f = file('d.txt');
    drop([f]);
    expect(root.getAttribute('data-state')).toBe('idle');
    expect(onFilesChange).toHaveBeenCalledWith([f], []);
  });

  it('stays in the dragging state across nested enter and leave events', () => {
    const { container } = render(<FileDropzone />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.dragEnter(zone());
    fireEvent.dragEnter(zone());
    fireEvent.dragLeave(zone());
    expect(root.getAttribute('data-state')).toBe('dragging');
    fireEvent.dragLeave(zone());
    expect(root.getAttribute('data-state')).toBe('idle');
  });

  it('allows the drop by cancelling dragover', () => {
    render(<FileDropzone />);
    const dataTransfer = { dropEffect: 'none' };
    const notCancelled = fireEvent.dragOver(zone(), { dataTransfer });
    expect(notCancelled).toBe(false);
  });

  it('does nothing on drop when disabled but still stops the browser opening the file', () => {
    const onFilesChange = vi.fn();
    const { container } = render(<FileDropzone disabled onFilesChange={onFilesChange} />);
    const dataTransfer = { dropEffect: 'copy', files: [file('a')] };
    expect(fireEvent.dragOver(zone(), { dataTransfer })).toBe(false);
    fireEvent.dragEnter(zone());
    expect((container.firstElementChild as HTMLElement).getAttribute('data-state')).toBe('idle');
    expect(fireEvent.drop(zone(), { dataTransfer })).toBe(false);
    expect(onFilesChange).not.toHaveBeenCalled();
    expect(input().disabled).toBe(true);
    expect((container.firstElementChild as HTMLElement).hasAttribute('data-disabled')).toBe(true);
  });

  it('removes a file from its button, with a label from strings', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone multiple onFilesChange={onFilesChange} />);
    const a = file('a.txt', 1, 'text/plain', 1);
    const b = file('b.txt', 1, 'text/plain', 2);
    pick([a, b]);
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
    expect(onFilesChange).toHaveBeenLastCalledWith([b], []);
    expect(screen.queryByText('a.txt')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
    expect(onFilesChange).toHaveBeenLastCalledWith([], []);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('reads the remove label from the provider', () => {
    render(
      <NishProvider strings={{ removeFile: (n) => `Supprimer ${n}` }}>
        <FileDropzone />
      </NishProvider>,
    );
    pick([file('a.txt')]);
    expect(screen.getByRole('button', { name: 'Supprimer a.txt' })).toBeTruthy();
  });

  it('keeps the form-posted FileList in step with the held files (where DataTransfer exists)', () => {
    const original = globalThis.DataTransfer;
    const added: File[][] = [];
    class FakeDataTransfer {
      list: File[] = [];
      items = { add: (f: File) => this.list.push(f) };
      get files() {
        added.push(this.list);
        return this.list as unknown as FileList;
      }
    }
    globalThis.DataTransfer = FakeDataTransfer as unknown as typeof DataTransfer;
    try {
      render(<FileDropzone multiple />);
      const a = file('a', 1, 'text/plain', 1);
      const b = file('b', 1, 'text/plain', 2);
      Object.defineProperty(input(), 'files', { configurable: true, writable: true, value: [a] });
      fireEvent.change(input());
      Object.defineProperty(input(), 'files', { configurable: true, writable: true, value: [b] });
      fireEvent.change(input());
      expect(Array.from(input().files!)).toEqual([a, b]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a' }));
      expect(Array.from(input().files!)).toEqual([b]);
    } finally {
      globalThis.DataTransfer = original;
    }
  });

  it('is required, invalid and described through the input', () => {
    render(<FileDropzone required invalid aria-label="Upload" aria-describedby="h" />);
    expect(input().required).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe('h');
    expect(input().getAttribute('aria-label')).toBe('Upload');
    expect(zone().className).toContain('border-th-loss');
  });

  it('is named, described and marked invalid by a Field', () => {
    render(
      <Field label="Resume" error="Attach a file">
        <FileDropzone />
      </Field>,
    );
    const el = screen.getByLabelText('Resume') as HTMLInputElement;
    expect(el).toBe(input());
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('has a visible focus ring and forced-colors styles on the zone', () => {
    render(<FileDropzone />);
    expect(zone().className).toContain('has-[:focus-visible]:ring-2');
    expect(zone().className).toContain('forced-colors:group-data-[state=dragging]:border-[Highlight]');
    expect(zone().className).toContain('border-th-line-control');
  });

  it('passes ref, className, id (to the input) and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<FileDropzone ref={ref} className="mt-2" id="fd" data-x="1" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(input().id).toBe('fd');
  });

  it('renders on the server', () => {
    expect(renderToString(<FileDropzone name="f" />)).toContain('type="file"');
  });

  it('clears the list and reports it when the form is reset', () => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <form>
        <FileDropzone multiple onFilesChange={onFilesChange} />
      </form>,
    );
    pick([file('a.txt')]);
    expect(screen.getByText('a.txt')).toBeTruthy();
    onFilesChange.mockClear();
    fireEvent.reset(container.querySelector('form')!);
    expect(screen.queryByText('a.txt')).toBeNull();
    expect(onFilesChange).toHaveBeenCalledWith([], []);
  });
});
