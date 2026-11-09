import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DropdownMenu, MenuItem } from './menu';
import { Field } from './forms';
import { NumberField } from './settings';
import { Radio, RadioGroup } from './radio-group';
import { FileDropzone } from './file-dropzone';
import { SkeletonRows } from './feedback';
import { dismissToast, toast } from './toast';
import { shared } from '../runtime';

interface Store {
  items: Array<{ id: number; title: string; tone: string; duration: number | 'sticky'; slot?: string }>;
  timers: Map<number, unknown>;
}
dismissToast(toast('seed'));
const store = () => shared<Store>('toast', () => ({ items: [], timers: new Map() }) as unknown as Store);
const clearStore = () => {
  for (const t of [...store().items]) dismissToast(t.id);
};

beforeEach(() => {
  vi.useFakeTimers();
  clearStore();
});
afterEach(() => {
  cleanup();
  clearStore();
  vi.useRealTimers();
});

describe('UI-192 Field hint', () => {
  it('an empty hint renders nothing and leaves no dangling describedby', () => {
    const { container } = render(
      <Field label="x" hint="">
        <input />
      </Field>,
    );
    expect(container.querySelector('p')).toBeNull();
    expect(screen.getByLabelText('x').getAttribute('aria-describedby')).toBeNull();
  });
});

describe('UI-208 MenuItem disabled', () => {
  it('does not call the onClick of a disabled item', () => {
    const onClick = vi.fn();
    render(
      <DropdownMenu trigger={<button>open</button>} defaultOpen>
        <MenuItem disabled onClick={onClick}>
          Nope
        </MenuItem>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText('Nope'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('UI-232 NumberField parse', () => {
  it.each(['Infinity', '1e5', '0x10'])('refuses %s', (text) => {
    const onCommit = vi.fn();
    render(<NumberField aria-label="N" value={10} onCommit={onCommit} />);
    const input = screen.getByLabelText('N') as HTMLInputElement;
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).not.toHaveBeenCalled();
  });
  it('still takes 1,234.5', () => {
    const onCommit = vi.fn();
    render(<NumberField aria-label="N" value={10} onCommit={onCommit} />);
    const input = screen.getByLabelText('N') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1,234.5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(1234.5);
  });
});

describe('UI-223 Radio describedby', () => {
  it('joins its description id with a caller aria-describedby', () => {
    render(
      <RadioGroup aria-label="g" name="g">
        <Radio value="a" label="A" description="About A" aria-describedby="extra" />
      </RadioGroup>,
    );
    const ids = (screen.getByLabelText(/^A/).getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toContain('extra');
    expect(ids.length).toBe(2);
  });
});

describe('UI-185 FileDropzone accept', () => {
  it('accepts an empty-type .heic for image/*', () => {
    const onFilesChange = vi.fn();
    render(<FileDropzone accept="image/*" onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const f = new File(['x'], 'photo.heic', { type: '' });
    Object.defineProperty(input, 'files', { configurable: true, value: [f] });
    fireEvent.change(input);
    expect(onFilesChange).toHaveBeenCalled();
    expect(onFilesChange.mock.calls[0][0]).toHaveLength(1);
  });
});

describe('UI-183 SkeletonRows height', () => {
  const h = (rowClassName: string) => (render(<SkeletonRows rows={1} rowClassName={rowClassName} />).container.querySelector('[role="status"]')!.children[1] as HTMLElement).style.height;
  it('min-h- does not count, h- and size- do', () => {
    expect(h('min-h-4')).toBe('56px');
    cleanup();
    expect(h('md:h-4')).toBe('');
    cleanup();
    expect(h('size-4')).toBe('');
  });
});

describe('UI-243 toast duration', () => {
  const timers = () => store().timers.size;
  it('huge or infinite is sticky, bad values use the default', () => {
    toast('a', { duration: 2 ** 31 });
    expect(timers()).toBe(0);
    clearStore();
    toast('b', { duration: 0 });
    toast('c', { duration: NaN });
    expect(store().items.map((t) => t.duration)).toEqual([4000, 4000]);
    act(() => void vi.advanceTimersByTime(4001));
    expect(store().items).toHaveLength(0);
  });
});

describe('UI-244 toast.promise message throws', () => {
  it('resolves the loading toast when the success function throws', async () => {
    await toast.promise(Promise.resolve(1), {
      loading: 'Working',
      success: () => {
        throw new Error('boom');
      },
      error: 'bad',
    });
    await Promise.resolve();
    const items = store().items;
    expect(items).toHaveLength(1);
    expect(items[0].tone).toBe('error');
    expect(items[0].title).toContain('boom');
  });
});
