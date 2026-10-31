import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField, SettingRow, SettingsSection, useSaveStatus } from './settings';

afterEach(cleanup);

function setup(props: Partial<Parameters<typeof NumberField>[0]> = {}) {
  const onCommit = vi.fn();
  render(<NumberField aria-label="Threshold" value={10} onCommit={onCommit} {...props} />);
  return { input: screen.getByLabelText('Threshold') as HTMLInputElement, onCommit };
}

describe('NumberField', () => {
  it('commits on blur only when changed', () => {
    const { input, onCommit } = setup();
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(12);
  });

  it('commits on Enter, and not again on the following blur', () => {
    const { input, onCommit } = setup();
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(15);
  });

  it('does not commit on Enter when unchanged', () => {
    const { input, onCommit } = setup();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('clamps to min and max', () => {
    const { input, onCommit } = setup({ min: 0, max: 100 });
    fireEvent.change(input, { target: { value: '250' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(100);
    expect(input.value).toBe('100');
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(0);
  });

  it('parses commas and rounds to precision', () => {
    const { input, onCommit } = setup({ precision: 1 });
    fireEvent.change(input, { target: { value: '1,234.56' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(1234.6);
  });

  it('Escape restores the value and blurs without committing', () => {
    const { input, onCommit } = setup();
    input.focus();
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('10');
    expect(document.activeElement).not.toBe(input);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ArrowUp and ArrowDown step within the clamp', () => {
    const { input } = setup({ step: 5, max: 12 });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('12');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('7');
  });

  it('restores and flags invalid input', () => {
    const { input, onCommit } = setup();
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe('10');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter a number')).toBeTruthy();
    fireEvent.change(input, { target: { value: '11' } });
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('restores the value and shows the error when the promise rejects', async () => {
    const onCommit = vi.fn(() => Promise.reject(new Error('Server said no')));
    render(<NumberField aria-label="Threshold" value={10} onCommit={onCommit} />);
    const input = screen.getByLabelText('Threshold') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '20' } });
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(input.value).toBe('10');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Server said no')).toBeTruthy();
  });

  it('shows a busy state while the promise is pending', async () => {
    let resolve!: () => void;
    const onCommit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<NumberField aria-label="Threshold" value={10} onCommit={onCommit} />);
    const input = screen.getByLabelText('Threshold');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.blur(input);
    expect(input.getAttribute('aria-busy')).toBe('true');
    await act(async () => resolve());
    expect(input.getAttribute('aria-busy')).toBeNull();
  });

  it('nullable commits null for an empty field; otherwise an empty field restores', () => {
    const a = setup({ nullable: true });
    fireEvent.change(a.input, { target: { value: '' } });
    fireEvent.blur(a.input);
    expect(a.onCommit).toHaveBeenCalledWith(null);
    cleanup();
    const b = setup();
    fireEvent.change(b.input, { target: { value: '' } });
    fireEvent.blur(b.input);
    expect(b.onCommit).not.toHaveBeenCalled();
    expect(b.input.value).toBe('10');
  });

  it('renders the suffix and follows an external value change', () => {
    const { rerender } = render(<NumberField aria-label="Pct" value={5} onCommit={() => {}} suffix="%" />);
    expect(screen.getByText('%')).toBeTruthy();
    rerender(<NumberField aria-label="Pct" value={8} onCommit={() => {}} suffix="%" />);
    expect((screen.getByLabelText('Pct') as HTMLInputElement).value).toBe('8');
  });
});

describe('SettingsSection and SettingRow', () => {
  it('labels the section by its heading and links the row label to its control', () => {
    render(
      <SettingsSection title="Scanner" description="How often it runs">
        <SettingRow label="Interval" htmlFor="iv" status="Saved" statusTone="ok">
          <input id="iv" />
        </SettingRow>
      </SettingsSection>,
    );
    expect(screen.getByRole('region', { name: 'Scanner' })).toBeTruthy();
    expect(screen.getByLabelText('Interval').id).toBe('iv');
    expect(screen.getByText('Saved').className).toContain('text-th-gain');
  });
});

function Probe({ p }: { p: Promise<unknown> }) {
  const s = useSaveStatus();
  return (
    <div>
      <button onClick={() => void s.run(p)}>go</button>
      <output>{`${s.status}|${s.label ?? ''}|${s.tone}`}</output>
    </div>
  );
}

describe('useSaveStatus', () => {
  it('goes saved then idle', async () => {
    vi.useFakeTimers();
    render(<Probe p={Promise.resolve(1)} />);
    await act(async () => {
      fireEvent.click(screen.getByText('go'));
    });
    expect(screen.getByRole('status').textContent).toBe('saved|Saved|ok');
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('status').textContent).toBe('idle||muted');
    vi.useRealTimers();
  });

  it('shows the error message for 3s', async () => {
    vi.useFakeTimers();
    render(<Probe p={Promise.reject(new Error('Nope'))} />);
    await act(async () => {
      fireEvent.click(screen.getByText('go'));
    });
    expect(screen.getByRole('status').textContent).toBe('error|Nope|error');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('status').textContent).toBe('idle||muted');
    vi.useRealTimers();
  });
});
