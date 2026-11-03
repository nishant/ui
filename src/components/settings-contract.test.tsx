import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import { NishProvider } from './provider';
import { NumberField, SettingRow, SettingsSection, useSaveStatus } from './settings';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SettingsSection', () => {
  it('puts ref, className, id and rest props on the section and names it by its heading', () => {
    const ref = { current: null as HTMLElement | null };
    render(
      <SettingsSection title="Alerts" ref={ref} className="mine" data-testid="sec" id="alerts">
        <p>row</p>
      </SettingsSection>,
    );
    const section = screen.getByTestId('sec');
    expect(section.tagName).toBe('SECTION');
    expect(ref.current).toBe(section);
    expect(section.id).toBe('alerts');
    expect(section.className).toContain('mine');
    expect(section.className).toContain('min-w-0');
    expect(screen.getByRole('region', { name: 'Alerts' })).toBe(section);
    expect(screen.getByRole('heading', { level: 2 }).id).toBe('alerts-heading');
  });

  it('compact drops the Card and uses the small heading', () => {
    const { container } = render(
      <SettingsSection title="T" description="d" compact>
        <p>row</p>
      </SettingsSection>,
    );
    expect(container.querySelector('.divide-y')).not.toBeNull();
    expect(screen.getByRole('heading').className).toContain('text-sm');
    expect(screen.getByText('d').className).toContain('text-xs');
  });

  it('shows actions beside the heading only when given', () => {
    const { rerender } = render(
      <SettingsSection title="T" actions={<button>Reset</button>}>
        x
      </SettingsSection>,
    );
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy();
    rerender(<SettingsSection title="T">x</SettingsSection>);
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });
});

describe('SettingRow', () => {
  it('puts ref, className and rest props on the row and merges classes', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <SettingRow label="Name" ref={ref} className="mine" data-testid="row">
        <button>Go</button>
      </SettingRow>,
    );
    const row = screen.getByTestId('row');
    expect(ref.current).toBe(row);
    expect(row.className).toContain('mine');
    expect(row.className).toContain('min-h-[56px]');
  });

  it('a label with htmlFor is a real label; without it the control group is named by the label', () => {
    const { rerender } = render(
      <SettingRow label="Email" htmlFor="e">
        <input id="e" />
      </SettingRow>,
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    rerender(
      <SettingRow label="Theme" description="Pick one">
        <button>Dark</button>
      </SettingRow>,
    );
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(group.getAttribute('aria-describedby')!)?.textContent).toBe('Pick one');
  });

  it('compact comes from the section and can be overridden per row', () => {
    render(
      <SettingsSection title="S" compact>
        <SettingRow label="A" data-testid="a">
          x
        </SettingRow>
        <SettingRow label="B" compact={false} data-testid="b">
          x
        </SettingRow>
      </SettingsSection>,
    );
    expect(screen.getByTestId('a').className).toContain('min-h-11');
    expect(screen.getByTestId('b').className).toContain('min-h-[56px]');
  });

  it('status is announced politely and error tone is red', () => {
    render(
      <SettingRow label="A" status="Could not save" statusTone="error">
        x
      </SettingRow>,
    );
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Could not save');
    expect(status.className).toContain('text-th-loss');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });
});

describe('useSaveStatus', () => {
  beforeEach(() => vi.useFakeTimers());

  it('goes saving, saved for 1500 ms, then idle', async () => {
    const { result } = renderHook(() => useSaveStatus());
    expect(result.current.label).toBeNull();
    let done!: () => void;
    let p!: Promise<unknown>;
    act(() => {
      p = result.current.run(new Promise<void>((r) => (done = r)));
    });
    expect(result.current.status).toBe('saving');
    expect(result.current.label).toBe('Saving…');
    await act(async () => {
      done();
      await p;
    });
    expect(result.current.status).toBe('saved');
    expect(result.current.label).toBe('Saved');
    expect(result.current.tone).toBe('ok');
    await act(async () => void (await vi.advanceTimersByTimeAsync(1499)));
    expect(result.current.status).toBe('saved');
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(result.current.status).toBe('idle');
  });

  it('an error shows its message for 3000 ms and run resolves undefined', async () => {
    const { result } = renderHook(() => useSaveStatus());
    let out: unknown = 'unset';
    await act(async () => {
      out = await result.current.run(Promise.reject(new Error('Disk full')));
    });
    expect(out).toBeUndefined();
    expect(result.current.label).toBe('Disk full');
    expect(result.current.tone).toBe('error');
    await act(async () => void (await vi.advanceTimersByTimeAsync(2999)));
    expect(result.current.status).toBe('error');
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('a non-Error rejection is shown as text; an empty error message falls back to the string', async () => {
    const { result } = renderHook(() => useSaveStatus());
    await act(async () => {
      await result.current.run(Promise.reject('plain'));
    });
    expect(result.current.label).toBe('plain');
    await act(async () => {
      await result.current.run(Promise.reject(new Error('')));
    });
    expect(result.current.label).toBe('Could not save');
  });

  it('only the newest run decides the status', async () => {
    const { result } = renderHook(() => useSaveStatus());
    let first!: () => void;
    let second!: () => void;
    let p1!: Promise<unknown>;
    let p2!: Promise<unknown>;
    act(() => {
      p1 = result.current.run(new Promise<void>((r) => (first = r)));
    });
    act(() => {
      p2 = result.current.run(new Promise<void>((r) => (second = r)));
    });
    await act(async () => {
      first();
      await p1;
    });
    expect(result.current.status).toBe('saving');
    await act(async () => {
      second();
      await p2;
    });
    expect(result.current.status).toBe('saved');
  });

  it('takes its labels from the provider', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NishProvider strings={{ saving: 'Enregistrement…', saved: 'Enregistré', saveFailed: 'Échec' }}>{children}</NishProvider>
    );
    const { result } = renderHook(() => useSaveStatus(), { wrapper });
    let done!: () => void;
    let p!: Promise<unknown>;
    act(() => {
      p = result.current.run(new Promise<void>((r) => (done = r)));
    });
    expect(result.current.label).toBe('Enregistrement…');
    await act(async () => {
      done();
      await p;
    });
    expect(result.current.label).toBe('Enregistré');
    await act(async () => {
      await result.current.run(Promise.reject(new Error('')));
    });
    expect(result.current.label).toBe('Échec');
  });

  it('does not touch state after unmount', async () => {
    const { result, unmount } = renderHook(() => useSaveStatus());
    let done!: () => void;
    let p!: Promise<unknown>;
    act(() => {
      p = result.current.run(new Promise<void>((r) => (done = r)));
    });
    unmount();
    await act(async () => {
      done();
      await p;
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('NumberField', () => {
  const setup = (props: Partial<Parameters<typeof NumberField>[0]> = {}) => {
    const onCommit = vi.fn();
    const utils = render(<NumberField value={5} onCommit={onCommit} aria-label="Limit" {...props} />);
    return { onCommit: onCommit as Mock, input: screen.getByRole('spinbutton', { name: 'Limit' }) as HTMLInputElement, ...utils };
  };
  const type = (input: HTMLInputElement, text: string) => fireEvent.change(input, { target: { value: text } });

  it('puts ref, className and rest props on the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { input } = setup({ ref, className: 'mine', 'data-testid': 'f' } as never);
    expect(ref.current).toBe(input);
    expect(input.className).toContain('mine');
    expect(input.getAttribute('data-testid')).toBe('f');
  });

  it('commits on blur and on Enter, once, only when the value changed', () => {
    const { input, onCommit } = setup();
    type(input, '7');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(7);
  });

  it('does not commit an unchanged value', () => {
    const { input, onCommit } = setup();
    fireEvent.blur(input);
    type(input, '5');
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('clamps to min and max and rounds to precision', () => {
    const { input, onCommit } = setup({ min: 1, max: 10, precision: 1 });
    type(input, '99');
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(10);
    type(input, '-3');
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(1);
    type(input, '2.26');
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(2.3);
  });

  it('accepts thousands commas and a typographic minus', () => {
    const { input, onCommit } = setup({ value: 0 });
    type(input, '1,234');
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(1234);
    type(input, '−7');
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(-7);
  });

  it('a draft that is not a number restores the value and says so (provider string)', () => {
    const { input, onCommit } = setup();
    type(input, 'abc');
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
    expect(screen.getByRole('alert').textContent).toBe('Enter a number');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('takes the not-a-number message from the provider', () => {
    render(
      <NishProvider strings={{ enterNumber: 'Saisissez un nombre' }}>
        <NumberField value={1} onCommit={() => undefined} aria-label="Q" />
      </NishProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Q' });
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toBe('Saisissez un nombre');
  });

  it('an empty field restores the value, or commits null when nullable', () => {
    const a = setup();
    type(a.input, '');
    fireEvent.blur(a.input);
    expect(a.onCommit).not.toHaveBeenCalled();
    expect(a.input.value).toBe('5');
    cleanup();
    const b = setup({ nullable: true });
    type(b.input, '');
    fireEvent.blur(b.input);
    expect(b.onCommit).toHaveBeenCalledWith(null);
  });

  it('ArrowUp and ArrowDown nudge by step within the range; Escape restores', () => {
    const { input, onCommit } = setup({ step: 0.5, min: 0, max: 6 });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('5.5');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('6');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('5.5');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('5');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('is a spinbutton with its range, value and unit announced', () => {
    const { input } = setup({ min: 1, max: 9, suffix: 'days' });
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('9');
    expect(input.getAttribute('aria-valuenow')).toBe('5');
    expect(input.getAttribute('aria-valuetext')).toBe('5 days');
    expect(screen.getByText('days')).toBeTruthy();
  });

  it('asks for the full keyboard only when negatives are allowed', () => {
    const a = setup();
    expect(a.input.getAttribute('inputmode')).toBe('decimal');
    cleanup();
    const b = setup({ min: -5 });
    expect(b.input.getAttribute('inputmode')).toBe('text');
  });

  it('a rejected onCommit restores the value and shows the error; a pending one shows a spinner', async () => {
    let reject!: (e: Error) => void;
    const onCommit = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<NumberField value={5} onCommit={onCommit} aria-label="Limit" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);
    expect(input.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Saving…');
    await act(async () => {
      reject(new Error('Server said no'));
    });
    expect(input.value).toBe('5');
    expect(screen.getByRole('alert').textContent).toBe('Server said no');
    expect(input.getAttribute('aria-busy')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
  });

  it('a synchronous throw in onCommit is shown as the error', () => {
    const { input } = setup({
      onCommit: () => {
        throw new Error('Nope');
      },
    });
    type(input, '9');
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toBe('Nope');
    expect(input.value).toBe('5');
  });

  it('follows a new value prop', () => {
    const { input, rerender, onCommit } = setup();
    rerender(<NumberField value={12} onCommit={onCommit} aria-label="Limit" />);
    expect(input.value).toBe('12');
  });
});
