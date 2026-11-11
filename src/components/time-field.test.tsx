import { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from './forms';
import { NishProvider } from './provider';
import { TimeField, type TimeFieldProps } from './time-field';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const boxes = () => {
  const [h, m] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
  return { h: h!, m: m! };
};
const select = () => screen.queryByRole('combobox') as HTMLSelectElement | null;
const type = (el: HTMLInputElement, v: string) => fireEvent.change(el, { target: { value: v } });
const key = (el: HTMLElement, k: string) => fireEvent.keyDown(el, { key: k });

function setup(props: Partial<TimeFieldProps> = {}) {
  const onValueChange = vi.fn();
  render(<TimeField aria-label="Start time" locale="en-US" onValueChange={onValueChange} {...props} />);
  return { onValueChange, ...boxes() };
}

describe('TimeField typing', () => {
  it('moves to the minutes after 9 on a 12-hour clock, not after 1', () => {
    const { h, m } = setup();
    h.focus();
    type(h, '1');
    expect(document.activeElement).toBe(h);
    type(h, '9');
    expect(document.activeElement).toBe(m);
  });

  it('moves on after 2 on a 12-hour clock but not on a 24-hour clock', () => {
    const a = setup();
    type(a.h, '2');
    expect(document.activeElement).toBe(a.m);
    cleanup();
    const b = setup({ hourCycle: 24 });
    b.h.focus();
    type(b.h, '2');
    expect(document.activeElement).toBe(b.h);
  });

  it('reports 09:30 and then 21:30 after p', () => {
    const { h, m, onValueChange } = setup();
    type(h, '9');
    type(m, '30');
    expect(onValueChange).toHaveBeenLastCalledWith('09:30');
    key(m, 'p');
    expect(onValueChange).toHaveBeenLastCalledWith('21:30');
    expect(select()!.value).toBe('pm');
    key(m, 'a');
    expect(onValueChange).toHaveBeenLastCalledWith('09:30');
  });

  it('reads 12 and 00 AM as 00:00', () => {
    const { h, m, onValueChange } = setup();
    type(h, '12');
    type(m, '00');
    expect(onValueChange).toHaveBeenLastCalledWith('00:00');
  });

  it('moves to the minutes on : and back on Backspace in an empty minute box', () => {
    const { h, m } = setup();
    h.focus();
    key(h, ':');
    expect(document.activeElement).toBe(m);
    key(m, 'Backspace');
    expect(document.activeElement).toBe(h);
  });

  it('selects the text on focus', () => {
    const { h } = setup({ defaultValue: '09:30' });
    const spy = vi.spyOn(h, 'select');
    fireEvent.focus(h);
    expect(spy).toHaveBeenCalled();
  });
});

describe('TimeField digit by digit', () => {
  it('keeps the typed text while typing, then pads after blur', () => {
    const { h, m, onValueChange } = setup({ defaultValue: '09:00' });
    h.focus();
    type(m, '3');
    expect(m.value).toBe('3');
    expect(onValueChange).toHaveBeenLastCalledWith('09:03');
    type(m, '30');
    expect(m.value).toBe('30');
    expect(onValueChange).toHaveBeenLastCalledWith('09:30');
    type(h, '9');
    fireEvent.blur(h);
    expect(h.value).toBe('9');
    type(m, '5');
    expect(m.value).toBe('5');
    fireEvent.blur(m);
    expect(m.value).toBe('05');
  });

  it('types an hour of 15 on a 24-hour clock with a minute set', () => {
    const { h, onValueChange } = setup({ hourCycle: 24, defaultValue: '08:20' });
    h.focus();
    type(h, '1');
    expect(h.value).toBe('1');
    expect(onValueChange).toHaveBeenLastCalledWith('01:20');
    type(h, '15');
    expect(h.value).toBe('15');
    expect(onValueChange).toHaveBeenLastCalledWith('15:20');
    fireEvent.blur(h);
    expect(h.value).toBe('15');
  });

  it('keeps PM chosen first while both boxes are empty', () => {
    const { h, m, onValueChange } = setup();
    key(h, 'p');
    expect(select()!.value).toBe('pm');
    type(h, '9');
    type(m, '30');
    expect(onValueChange).toHaveBeenLastCalledWith('21:30');
    cleanup();
    const b = setup();
    fireEvent.change(select()!, { target: { value: 'pm' } });
    type(b.h, '9');
    type(b.m, '30');
    expect(b.onValueChange).toHaveBeenLastCalledWith('21:30');
  });

  it('shows a new controlled value from the parent, focused or not', () => {
    const { rerender } = render(<TimeField aria-label="t" locale="en-US" value="09:30" />);
    const { h, m } = boxes();
    h.focus();
    type(m, '4');
    rerender(<TimeField aria-label="t" locale="en-US" value="09:30" />);
    rerender(<TimeField aria-label="t" locale="en-US" value="10:15" />);
    expect(h.value).toBe('10');
    expect(m.value).toBe('15');
  });
});

describe('TimeField stale draft', () => {
  it('a new parent value clears the invalid mark and the old draft', () => {
    const props = { 'aria-label': 't', locale: 'en-US' } as const;
    const { rerender } = render(<TimeField {...props} value="10:30" />);
    const { h, m } = boxes();
    type(h, '');
    fireEvent.blur(h);
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(h.validationMessage).toBe('Enter a valid time.');
    rerender(<TimeField {...props} value="11:00" />);
    expect(h.value).toBe('11');
    expect(m.value).toBe('00');
    expect(h.getAttribute('aria-invalid')).toBeNull();
    expect(m.getAttribute('aria-invalid')).toBeNull();
    expect(h.validationMessage).toBe('');
    // Back to the old base: the dropped draft does not return.
    rerender(<TimeField {...props} value="10:30" />);
    expect(h.value).toBe('10');
    expect(m.value).toBe('30');
    expect(h.getAttribute('aria-invalid')).toBeNull();
    expect(h.validationMessage).toBe('');
  });

  it('A to B to A does not bring back the old draft text', () => {
    const props = { 'aria-label': 't', locale: 'en-US', hourCycle: 24 } as const;
    const { rerender } = render(<TimeField {...props} value="09:30" />);
    const { h } = boxes();
    h.focus();
    type(h, '');
    expect(h.value).toBe('');
    rerender(<TimeField {...props} value="12:00" />);
    expect(h.value).toBe('12');
    rerender(<TimeField {...props} value="09:30" />);
    expect(h.value).toBe('09');
  });
});

describe('TimeField keys', () => {
  it('ArrowUp on an empty hour shows 12 AM (00 on a 24-hour clock)', () => {
    const a = setup();
    key(a.h, 'ArrowUp');
    expect(a.h.value).toBe('12');
    expect(select()!.value).toBe('am');
    cleanup();
    const b = setup({ hourCycle: 24 });
    key(b.h, 'ArrowUp');
    expect(b.h.value).toBe('00');
  });

  it('ArrowUp on 11 AM gives 12 PM', () => {
    const { h, onValueChange } = setup({ defaultValue: '11:00' });
    key(h, 'ArrowUp');
    expect(onValueChange).toHaveBeenLastCalledWith('12:00');
    expect(h.value).toBe('12');
    expect(select()!.value).toBe('pm');
  });

  it('ArrowDown on minute 00 with step 15 gives 45', () => {
    const { m, onValueChange } = setup({ defaultValue: '09:00', step: 15 });
    key(m, 'ArrowDown');
    expect(onValueChange).toHaveBeenLastCalledWith('09:45');
    expect(m.value).toBe('45');
  });

  it('Home and End go to the first and last value of each box', () => {
    const { h, m, onValueChange } = setup({ defaultValue: '09:30', hourCycle: 24 });
    key(h, 'Home');
    expect(onValueChange).toHaveBeenLastCalledWith('00:30');
    key(h, 'End');
    expect(onValueChange).toHaveBeenLastCalledWith('23:30');
    key(m, 'Home');
    expect(onValueChange).toHaveBeenLastCalledWith('23:00');
    key(m, 'End');
    expect(onValueChange).toHaveBeenLastCalledWith('23:59');
  });

  it('Home and End on a 12-hour hour box land on aria-valuemin and aria-valuemax', () => {
    const { h, onValueChange } = setup({ defaultValue: '09:30', hourCycle: 12 });
    key(h, 'Home');
    expect(h.value).toBe('1');
    expect(h.getAttribute('aria-valuemin')).toBe('1');
    expect(onValueChange).toHaveBeenLastCalledWith('01:30');
    key(h, 'End');
    expect(h.value).toBe('12');
    expect(h.getAttribute('aria-valuemax')).toBe('12');
    expect(onValueChange).toHaveBeenLastCalledWith('00:30');
  });

  it('End on the minutes follows the step', () => {
    const { m, onValueChange } = setup({ defaultValue: '09:30', step: 20 });
    key(m, 'End');
    expect(onValueChange).toHaveBeenLastCalledWith('09:40');
  });

  it('sets aria-valuenow, min and max', () => {
    const { h, m } = setup({ defaultValue: '13:05' });
    expect(h.getAttribute('aria-valuenow')).toBe('1');
    expect(h.getAttribute('aria-valuemin')).toBe('1');
    expect(h.getAttribute('aria-valuemax')).toBe('12');
    expect(m.getAttribute('aria-valuenow')).toBe('5');
    expect(m.getAttribute('aria-valuemax')).toBe('59');
  });

  it('does nothing with keys when disabled', () => {
    const { h, onValueChange } = setup({ disabled: true });
    key(h, 'ArrowUp');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('TimeField validity', () => {
  it('clearing both boxes reports null', () => {
    const { h, m, onValueChange } = setup({ defaultValue: '09:30' });
    type(h, '');
    expect(onValueChange).not.toHaveBeenCalled();
    type(m, '');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('clearing one box reports nothing and is invalid after blur, but moving between boxes is not', () => {
    const { h, m, onValueChange } = setup({ defaultValue: '09:30' });
    type(h, '');
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(h, { relatedTarget: m });
    expect(h.getAttribute('aria-invalid')).toBeNull();
    fireEvent.blur(h);
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(m.getAttribute('aria-invalid')).toBe('true');
    expect(h.validationMessage).toBe('Enter a valid time.');
    type(h, '9');
    expect(h.getAttribute('aria-invalid')).toBeNull();
    expect(h.validationMessage).toBe('');
  });

  it('a time before min reports nothing and is invalid after blur', () => {
    const { h, m, onValueChange } = setup({ min: '09:00' });
    type(h, '8');
    type(m, '00');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(h.getAttribute('aria-invalid')).toBeNull();
    fireEvent.blur(m);
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(h.validationMessage).toBe('Enter a valid time.');
  });

  it('a time after max is refused too', () => {
    const { h, m, onValueChange } = setup({ max: '17:30', hourCycle: 24 });
    type(h, '18');
    type(m, '00');
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.blur(m);
    expect(m.getAttribute('aria-invalid')).toBe('true');
  });

  it('a value outside min and max is invalid at once', () => {
    const { h } = setup({ defaultValue: '07:00', min: '09:00' });
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(h.validationMessage).toBe('Enter a valid time.');
  });

  it('Enter with an incomplete or out-of-range draft is blocked and marked invalid inside a form', () => {
    render(
      <form>
        <TimeField aria-label="t" locale="en-US" defaultValue="09:30" min="09:00" />
      </form>,
    );
    const { h, m } = boxes();
    expect(key(h, 'Enter')).toBe(true);
    type(m, '');
    expect(key(m, 'Enter')).toBe(false);
    expect(h.getAttribute('aria-invalid')).toBe('true');
    type(m, '15');
    expect(key(m, 'Enter')).toBe(true);
    type(h, '8');
    expect(key(h, 'Enter')).toBe(false);
  });

  it('invalid and aria-invalid only style', () => {
    const { h } = setup({ invalid: true });
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(h.validationMessage).toBe('');
    cleanup();
    setup({ 'aria-invalid': 'true' });
    expect(boxes().m.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('TimeField value', () => {
  it('follows a controlled value and reverts an edit the parent ignores', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<TimeField aria-label="t" locale="en-US" value="09:30" onValueChange={onValueChange} />);
    const { h, m } = boxes();
    expect(h.value).toBe('9');
    expect(m.value).toBe('30');
    key(m, 'ArrowUp');
    expect(onValueChange).toHaveBeenLastCalledWith('09:31');
    expect(m.value).toBe('30');
    rerender(<TimeField aria-label="t" locale="en-US" value="21:05" onValueChange={onValueChange} />);
    expect(h.value).toBe('9');
    expect(m.value).toBe('05');
    expect(select()!.value).toBe('pm');
    rerender(<TimeField aria-label="t" locale="en-US" value={null} onValueChange={onValueChange} />);
    expect(h.value).toBe('');
    expect(m.value).toBe('');
  });

  it('works controlled with state', () => {
    function C() {
      const [v, setV] = useState<string | null>(null);
      return (
        <>
          <TimeField aria-label="t" locale="en-US" value={v} onValueChange={setV} />
          <output>{v ?? 'none'}</output>
        </>
      );
    }
    render(<C />);
    const { h, m } = boxes();
    type(h, '7');
    type(m, '15');
    expect(screen.getByRole('status', { hidden: true }).textContent).toBe('07:15');
  });

  it('starts from an uncontrolled defaultValue', () => {
    const { h, m } = setup({ defaultValue: '14:05' });
    expect(h.value).toBe('2');
    expect(m.value).toBe('05');
    expect(select()!.value).toBe('pm');
  });

  it('warns once for a value that is not HH:mm', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./time-field');
    render(<mod.TimeField aria-label="t" value="9:30" />);
    render(<mod.TimeField aria-label="t" value="9:30" />);
    const calls = warn.mock.calls.filter((c) => String(c[0]).includes('"value" must be HH:mm'));
    expect(calls).toHaveLength(1);
    expect(boxes().h.value).toBe('');
  });

  it('names the prop in the warning, once per prop', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./time-field');
    render(<mod.TimeField aria-label="t" defaultValue="9:30" />);
    render(<mod.TimeField aria-label="t" defaultValue="9:30" />);
    render(<mod.TimeField aria-label="t" value="9:30" />);
    const msgs = warn.mock.calls.map((c) => String(c[0]));
    expect(msgs.filter((x) => x === 'TimeField: "defaultValue" must be HH:mm')).toHaveLength(1);
    expect(msgs.filter((x) => x === 'TimeField: "value" must be HH:mm')).toHaveLength(1);
  });

  it('warns once when nothing names the field', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./time-field');
    render(<mod.TimeField />);
    render(<mod.TimeField />);
    const calls = warn.mock.calls.filter((c) => String(c[0]).includes('give it a Field'));
    expect(calls).toHaveLength(1);
  });

  it('shows 00-23 and no select for de-DE', () => {
    const { h } = setup({ locale: 'de-DE', defaultValue: '09:05' });
    expect(select()).toBeNull();
    expect(h.value).toBe('09');
    expect(h.getAttribute('aria-valuemax')).toBe('23');
  });

  it('shows the locale AM and PM words', () => {
    setup({ locale: 'en-US' });
    expect([...select()!.options].map((o) => o.value)).toEqual(['am', 'pm']);
    expect([...select()!.options].map((o) => o.text)).toEqual(['AM', 'PM']);
  });

  it('changes AM and PM through the select', () => {
    const { onValueChange } = setup({ defaultValue: '09:30' });
    fireEvent.change(select()!, { target: { value: 'pm' } });
    expect(onValueChange).toHaveBeenLastCalledWith('21:30');
  });
});

describe('TimeField forms', () => {
  it('posts HH:mm in a hidden input, or an empty string', () => {
    const { container } = render(<TimeField aria-label="t" name="start" defaultValue="09:30" form="f1" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('start');
    expect(hidden.value).toBe('09:30');
    expect(hidden.getAttribute('form')).toBe('f1');
    cleanup();
    const again = render(<TimeField aria-label="t" name="start" />);
    expect((again.container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('');
  });

  it('has no hidden input without a name', () => {
    const { container } = render(<TimeField aria-label="t" />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('returns to its default on form reset', () => {
    const { container } = render(
      <form>
        <TimeField aria-label="t" locale="en-US" name="start" defaultValue="09:30" />
      </form>,
    );
    const { h, m } = boxes();
    type(h, '');
    type(m, '');
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('');
    type(h, '4');
    fireEvent.blur(h);
    act(() => {
      container.querySelector('form')!.reset();
    });
    expect(h.value).toBe('9');
    expect(m.value).toBe('30');
    expect(h.getAttribute('aria-invalid')).toBeNull();
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('09:30');
  });

  it('resets and validates through an external form named by the form prop', () => {
    render(
      <>
        <TimeField form="f1" name="at" defaultValue="09:30" aria-label="At" locale="en-US" />
        <form id="f1" data-testid="f1" />
      </>,
    );
    const f1 = screen.getByTestId('f1') as HTMLFormElement;
    const { h, m } = boxes();
    expect(h.form).toBe(f1);
    expect(m.form).toBe(f1);
    type(h, '4');
    type(m, '45');
    expect(h.value).toBe('4');
    act(() => {
      f1.reset();
    });
    expect(h.value).toBe('9');
    expect(m.value).toBe('30');
    expect(f1.checkValidity()).toBe(true);
    type(h, '');
    fireEvent.blur(h);
    expect(f1.checkValidity()).toBe(false);
  });

  it('disables both boxes, the select and the hidden input', () => {
    const { container } = render(<TimeField aria-label="t" locale="en-US" name="s" disabled />);
    const { h, m } = boxes();
    expect(h.disabled).toBe(true);
    expect(m.disabled).toBe(true);
    expect(select()!.disabled).toBe(true);
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).disabled).toBe(true);
    expect(container.firstElementChild!.hasAttribute('data-disabled')).toBe(true);
  });

  it('marks both boxes required', () => {
    const { h, m } = setup({ required: true });
    expect(h.required).toBe(true);
    expect(m.getAttribute('aria-required')).toBe('true');
  });
});

describe('TimeField names', () => {
  const resolves = (el: HTMLElement) =>
    el
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent);

  it('inside a Field the label names both boxes', () => {
    render(
      <Field label="Start time">
        <TimeField locale="en-US" />
      </Field>,
    );
    const { h, m } = boxes();
    const ids = h.getAttribute('aria-labelledby')!.split(' ');
    expect(ids[0]).toBe(`${h.id}-label`);
    expect(resolves(h)).toEqual(['Start time', 'Hour']);
    expect(resolves(m)).toEqual(['Start time', 'Minute']);
    expect(resolves(select()!)).toEqual(['Start time', 'AM/PM']);
    const group = screen.getByRole('group');
    expect(resolves(group)).toEqual(['Start time']);
    expect(screen.getByLabelText('Start time Hour')).toBe(h);
  });

  it('with aria-label a hidden span holds the name', () => {
    render(<TimeField aria-label="Start time" locale="en-US" />);
    const { h, m } = boxes();
    expect(resolves(h)).toEqual(['Start time', 'Hour']);
    expect(resolves(m)).toEqual(['Start time', 'Minute']);
    expect(screen.getByRole('group').getAttribute('aria-labelledby')).toBe(h.getAttribute('aria-labelledby')!.split(' ')[0]);
  });

  it('aria-labelledby names the group and the boxes', () => {
    render(
      <>
        <h2 id="lbl">Opens</h2>
        <TimeField aria-labelledby="lbl" />
      </>,
    );
    expect(resolves(boxes().h)).toEqual(['Opens', 'Hour']);
  });

  it('an id without a Field leaves no dangling id reference', () => {
    render(<TimeField id="solo" locale="en-US" />);
    const { h, m } = boxes();
    expect(h.id).toBe('solo');
    expect(document.getElementById('solo-label')).toBeNull();
    expect(screen.getByRole('group').hasAttribute('aria-labelledby')).toBe(false);
    expect(h.getAttribute('aria-labelledby')).not.toContain('solo-label');
    expect(m.getAttribute('aria-labelledby')).not.toContain('solo-label');
    expect(resolves(h)).toEqual(['Hour']);
    expect(resolves(select()!)).toEqual(['AM/PM']);
  });

  it('a plain label with the derived id is found', () => {
    render(
      <>
        <label id="own-label" htmlFor="own">
          Opening
        </label>
        <TimeField id="own" />
      </>,
    );
    expect(resolves(boxes().h)).toEqual(['Opening', 'Hour']);
  });

  it('a native label with an id names the boxes', () => {
    render(
      <>
        <label id="lab" htmlFor="t1">
          Closing
        </label>
        <TimeField id="t1" />
      </>,
    );
    expect(resolves(boxes().h)).toEqual(['Closing', 'Hour']);
    expect(screen.getByRole('group').getAttribute('aria-labelledby')).toBe('lab');
  });

  it('warns once when a native label has no id', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./time-field');
    render(
      <>
        <label htmlFor="t2">Closing</label>
        <mod.TimeField id="t2" />
      </>,
    );
    const msgs = warn.mock.calls.map((c) => String(c[0]));
    expect(msgs.filter((x) => x === 'TimeField: give its <label> an id, or use a Field, an aria-label or aria-labelledby.')).toHaveLength(1);
    expect(msgs.filter((x) => x.includes('give it a Field'))).toHaveLength(0);
  });

  it('an id with no label at all gets the generic warning', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./time-field');
    render(<mod.TimeField id="t3" />);
    const msgs = warn.mock.calls.map((c) => String(c[0]));
    expect(msgs.filter((x) => x === 'TimeField: give it a Field, an aria-label or aria-labelledby.')).toHaveLength(1);
  });

  it('takes the hour and minute names from a provider', () => {
    render(
      <NishProvider strings={{ hour: 'Stunde', minute: 'Minuten' }}>
        <TimeField aria-label="Start" locale="en-US" />
      </NishProvider>,
    );
    const { h, m } = boxes();
    expect(resolves(h)).toEqual(['Start', 'Stunde']);
    expect(resolves(m)).toEqual(['Start', 'Minuten']);
  });

  it('takes the AM/PM name and the invalid message from a provider', () => {
    render(
      <NishProvider strings={{ dayPeriod: 'Tageszeit', invalidTime: 'Ungültig' }}>
        <TimeField aria-label="Start" locale="en-US" defaultValue="07:00" min="09:00" />
      </NishProvider>,
    );
    expect(resolves(select()!)).toEqual(['Start', 'Tageszeit']);
    expect(boxes().h.validationMessage).toBe('Ungültig');
  });
});

describe('TimeField root', () => {
  it('the ref is the hour input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TimeField aria-label="t" ref={ref} />);
    expect(ref.current).toBe(boxes().h);
  });

  it('className and rest reach the group', () => {
    render(<TimeField aria-label="t" className="extra" data-testid="tf" style={{ margin: 3 }} />);
    const group = screen.getByTestId('tf');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.className).toContain('extra');
    expect(group.className).toContain('inline-flex');
    expect(group.style.margin).toBe('3px');
  });

  it('puts the hour and minute in a ltr span', () => {
    render(<TimeField aria-label="t" />);
    expect(boxes().h.parentElement!.getAttribute('dir')).toBe('ltr');
  });

  it('describes both boxes', () => {
    render(<TimeField aria-label="t" aria-describedby="help" />);
    const { h, m } = boxes();
    expect(h.getAttribute('aria-describedby')).toBe('help');
    expect(m.getAttribute('aria-describedby')).toBe('help');
  });

  it('calls a rest onBlur and settles', async () => {
    const onBlur = vi.fn();
    render(<TimeField aria-label="t" onBlur={onBlur} />);
    fireEvent.blur(boxes().h);
    expect(onBlur).toHaveBeenCalled();
    await act(async () => {});
  });
});

describe('TimeField modified keys and lagging parents', () => {
  it('leaves Ctrl+A and Ctrl+P to the browser on a 12-hour clock', () => {
    const { h, onValueChange } = setup({ defaultValue: '08:20' });
    expect(fireEvent.keyDown(h, { key: 'a', ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(h, { key: 'p', ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(h, { key: 'a', metaKey: true })).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps the typed hour while the parent applies the value a tick later', () => {
    vi.useFakeTimers();
    function Lagging() {
      const [v, setV] = useState<string | null>('08:20');
      return <TimeField aria-label="T" locale="de-DE" value={v} onValueChange={(n) => setTimeout(() => setV(n), 50)} />;
    }
    render(<Lagging />);
    const { h } = boxes();
    h.focus();
    type(h, '1');
    expect(h.value).toBe('1');
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(h.value).toBe('1');
    type(h, '15');
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(boxes().h.value).toBe('15');
    vi.useRealTimers();
  });

  it('accepts a time inside a reversed min and max', () => {
    const { h, m, onValueChange } = setup({ min: '22:00', max: '06:00', locale: 'de-DE' });
    type(h, '23');
    type(m, '15');
    expect(onValueChange).toHaveBeenLastCalledWith('23:15');
  });
});
