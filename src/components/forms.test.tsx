import { useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox, Chip, ChipGroup, Field, FieldGroup, SearchInput, Switch, Textarea, chipClass } from './forms';
import { chipClass as chipClassPure } from './forms-classes';
import { Input, Select } from './primitives';
import { NishProvider } from './provider';

const rtl = vi.hoisted(() => ({ on: false }));
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  isRtl: () => rtl.on,
}));

afterEach(() => {
  cleanup();
  rtl.on = false;
});

/** What react-hook-form's register() hands a control. */
function register(name: string, log: Array<[string, string]> = []) {
  return {
    name,
    onChange: (e: { target: { name: string; value: string; checked?: boolean; type?: string } }) => {
      log.push([e.target.name, e.target.type === 'checkbox' ? String(e.target.checked) : e.target.value]);
      return Promise.resolve();
    },
    onBlur: (e: { target: { name: string } }) => {
      log.push([e.target.name, 'blur']);
      return Promise.resolve();
    },
    ref: vi.fn(),
  };
}

describe('chipClass', () => {
  it('is the same function from forms and forms-classes', () => {
    expect(chipClass).toBe(chipClassPure);
  });

  it('builds the variant, size and pressed looks', () => {
    expect(chipClass()).toContain('h-8');
    expect(chipClass()).toContain('pointer-coarse:min-h-11');
    expect(chipClass()).toContain('border-th-line-control');
    expect(chipClass({ size: 'sm' })).toContain('h-7');
    expect(chipClass({ pressed: true })).toContain('bg-th-accent-soft');
    expect(chipClass({ pressed: true })).toContain('forced-colors:bg-[color:Highlight]');
    expect(chipClass({ pressed: false })).not.toContain('bg-th-accent-soft');
    expect(chipClass({ variant: 'suggestion' })).toContain('border-dashed');
    expect(chipClass({ variant: 'tag' })).not.toContain('pointer-coarse:min-h-11');
    expect(chipClass({ variant: 'tag', pressed: true })).not.toContain('bg-th-accent-soft');
    expect(chipClass({ className: 'extra' })).toContain('extra');
  });
});

describe('Textarea', () => {
  it('passes ref, className, rest, rows and aria-invalid through', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea ref={ref} className="x-cls" data-testid="t" aria-label="Notes" rows={6} invalid placeholder="Write" />);
    const ta = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(ref.current).toBe(ta);
    expect(ta.className).toContain('x-cls');
    expect(ta.getAttribute('data-testid')).toBe('t');
    expect(ta.getAttribute('rows')).toBe('6');
    expect(ta.getAttribute('aria-invalid')).toBe('true');
    expect(ta.className).toContain('placeholder:text-th-hi3');
    expect(ta.className).toContain('border-th-line-control');
    expect(ta.className).toContain('resize-y');
  });

  it('defaults to 4 rows, no aria-invalid and the sm size changes the text size', () => {
    const { rerender } = render(<Textarea aria-label="N" />);
    const ta = screen.getByLabelText('N') as HTMLTextAreaElement;
    expect(ta.getAttribute('rows')).toBe('4');
    expect(ta.hasAttribute('aria-invalid')).toBe(false);
    expect(ta.className).toContain('text-sm');
    rerender(<Textarea aria-label="N" size="sm" />);
    expect(ta.className).toContain('text-xs');
  });

  it('autoGrow sets the height from the content and stops at maxRows', () => {
    const scroll = vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    const cs = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      borderTopWidth: '1px',
      borderBottomWidth: '1px',
      lineHeight: '20px',
      fontSize: '14px',
      paddingTop: '8px',
      paddingBottom: '8px',
    } as unknown as CSSStyleDeclaration);
    const { rerender } = render(<Textarea aria-label="N" autoGrow value="a" onChange={() => undefined} />);
    const ta = screen.getByLabelText('N') as HTMLTextAreaElement;
    expect(ta.className).toContain('resize-none');
    expect(ta.style.height).toBe('202px');
    expect(ta.style.overflowY).toBe('hidden');
    rerender(<Textarea aria-label="N" autoGrow={{ maxRows: 3 }} value="ab" onChange={() => undefined} />);
    // 3 lines * 20 + 16 padding + 2 border = 78
    expect(ta.style.height).toBe('78px');
    expect(ta.style.overflowY).toBe('auto');
    cs.mockRestore();
    scroll.mockRestore();
  });

  it('calls onInput and works with a register-like object', () => {
    const log: Array<[string, string]> = [];
    const reg = register('notes', log);
    const onInput = vi.fn();
    render(<Textarea aria-label="N" {...reg} onInput={onInput} />);
    const ta = screen.getByLabelText('N') as HTMLTextAreaElement;
    expect(reg.ref).toHaveBeenCalledWith(ta);
    fireEvent.change(ta, { target: { value: 'hello' } });
    fireEvent.input(ta);
    fireEvent.blur(ta);
    expect(onInput).toHaveBeenCalled();
    expect(log).toEqual([
      ['notes', 'hello'],
      ['notes', 'blur'],
    ]);
  });

  it('posts in FormData', () => {
    const { container } = render(
      <form>
        <Textarea aria-label="N" name="notes" defaultValue="hi" />
      </form>,
    );
    expect(new FormData(container.querySelector('form') as HTMLFormElement).get('notes')).toBe('hi');
  });
});

describe('Input and Select with a register-like object', () => {
  it('Input forwards the ref and events', () => {
    const log: Array<[string, string]> = [];
    const reg = register('email', log);
    render(<Input aria-label="Email" {...reg} />);
    const el = screen.getByLabelText('Email') as HTMLInputElement;
    expect(reg.ref).toHaveBeenCalledWith(el);
    fireEvent.change(el, { target: { value: 'a@b.c' } });
    fireEvent.blur(el);
    expect(log).toEqual([
      ['email', 'a@b.c'],
      ['email', 'blur'],
    ]);
  });

  it('Select forwards the ref and events and posts in FormData', () => {
    const log: Array<[string, string]> = [];
    const reg = register('color', log);
    const { container } = render(
      <form>
        <Select aria-label="Color" {...reg} defaultValue="b">
          <option value="a">A</option>
          <option value="b">B</option>
        </Select>
      </form>,
    );
    const el = screen.getByLabelText('Color') as HTMLSelectElement;
    expect(reg.ref).toHaveBeenCalledWith(el);
    expect(new FormData(container.querySelector('form') as HTMLFormElement).get('color')).toBe('b');
    fireEvent.change(el, { target: { value: 'a' } });
    expect(log).toEqual([['color', 'a']]);
  });
});

describe('Checkbox', () => {
  it('renders a labelled native checkbox; clicking the label toggles it', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Accept' }) as HTMLInputElement;
    fireEvent.click(screen.getByText('Accept'));
    expect(box.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ref goes to the input; className goes to the row; rest goes to the input', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { container } = render(<Checkbox ref={ref} label="A" className="x-cls" data-testid="in" name="agree" value="yes" />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(ref.current).toBe(box);
    expect(box.getAttribute('data-testid')).toBe('in');
    expect(box.name).toBe('agree');
    expect((container.firstChild as HTMLElement).className).toContain('x-cls');
    expect(box.className).toContain('border-th-line-control');
    expect(box.className).toContain('forced-colors:checked:bg-[color:Highlight]');
  });

  it('the hint and trailing text describe the box and stay out of its name', () => {
    render(<Checkbox label="Accept" hint="Required to continue" trailing="$5" />);
    const box = screen.getByRole('checkbox', { name: 'Accept' });
    const described = (box.getAttribute('aria-describedby') ?? '').split(' ');
    expect(described).toHaveLength(2);
    expect(described.map((id) => document.getElementById(id)?.textContent)).toEqual(['Required to continue', '$5']);
  });

  it('keeps a caller aria-describedby and aria-label', () => {
    render(<Checkbox label="Accept" hint="h" aria-describedby="mine" aria-label="Custom" />);
    const box = screen.getByRole('checkbox', { name: 'Custom' });
    expect(box.getAttribute('aria-describedby')?.split(' ')[0]).toBe('mine');
    expect(box.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('invalid becomes aria-invalid and never reaches the DOM as an attribute', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Checkbox label="A" invalid />);
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.hasAttribute('invalid')).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('has no aria-invalid by default', () => {
    render(<Checkbox label="A" />);
    expect(screen.getByRole('checkbox').hasAttribute('aria-invalid')).toBe(false);
  });

  it('indeterminate is set through the DOM property and reflected in data-state', () => {
    const { container, rerender } = render(<Checkbox label="All" indeterminate checked={false} onChange={() => undefined} />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect((container.firstChild as HTMLElement).getAttribute('data-state')).toBe('indeterminate');
    rerender(<Checkbox label="All" checked onChange={() => undefined} />);
    expect(box.indeterminate).toBe(false);
    expect((container.firstChild as HTMLElement).getAttribute('data-state')).toBe('checked');
  });

  it('tracks data-state for an uncontrolled box and resets with its form', () => {
    const { container } = render(
      <form>
        <Checkbox label="A" name="a" defaultChecked />
      </form>,
    );
    const row = container.querySelector('label') as HTMLElement;
    expect(row.getAttribute('data-state')).toBe('checked');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(row.getAttribute('data-state')).toBe('unchecked');
    fireEvent(container.querySelector('form') as HTMLFormElement, new Event('reset'));
    expect(row.getAttribute('data-state')).toBe('checked');
  });

  it('disabled sets data-disabled and the disabled attribute', () => {
    const { container } = render(<Checkbox label="A" disabled />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
    expect((container.firstChild as HTMLElement).hasAttribute('data-disabled')).toBe(true);
    expect((container.firstChild as HTMLElement).className).toContain('opacity-50');
  });

  it('size sm uses the smaller box; trailing makes the row full width with a logical margin', () => {
    const { container } = render(<Checkbox label="A" size="sm" trailing="3" />);
    expect(screen.getByRole('checkbox').className).toContain('size-3.5');
    expect((container.firstChild as HTMLElement).className).toContain('w-full');
    expect(container.querySelector('.ms-auto')).toBeTruthy();
    cleanup();
    render(<Checkbox label="A" />);
    expect(screen.getByRole('checkbox').className).toContain('size-4');
  });

  it('a bare box (no label) is centered with a 44px target on touch', () => {
    const { container } = render(<Checkbox aria-label="Select row" />);
    expect((container.firstChild as HTMLElement).className).toContain('pointer-coarse:min-w-11');
  });

  it('posts in FormData and works with a register-like object', () => {
    const log: Array<[string, string]> = [];
    const reg = register('agree', log);
    const { container } = render(
      <form>
        <Checkbox label="A" {...reg} value="yes" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('agree')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(new FormData(form).get('agree')).toBe('yes');
    expect(log).toEqual([['agree', 'true']]);
    expect(reg.ref).toHaveBeenCalled();
  });
});

describe('Switch', () => {
  it('is a role=switch button with aria-checked and data-state', () => {
    render(<Switch checked={false} onCheckedChange={() => undefined} aria-label="Auto" />);
    const sw = screen.getByRole('switch', { name: 'Auto' });
    expect(sw.tagName).toBe('BUTTON');
    expect(sw.getAttribute('type')).toBe('button');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
  });

  it('onCheckedChange gets only the new value', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="A" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange.mock.calls[0]).toEqual([true]);
  });

  it('a removed onChange prop is not called, not put on the button, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const spy = vi.fn();
    const props = { onChange: spy } as object;
    const { rerender } = render(<Switch checked={false} {...props} aria-label="A" />);
    fireEvent.click(screen.getByRole('switch'));
    rerender(<Switch checked={false} {...props} aria-label="A" />);
    expect(spy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Switch: onChange was removed in nish-ui 3.0. Use onCheckedChange(checked).');
    warn.mockRestore();
  });

  it('a controlled switch does not flip until the parent does', () => {
    const { rerender } = render(<Switch checked onCheckedChange={() => undefined} aria-label="A" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    rerender(<Switch checked={false} onCheckedChange={() => undefined} aria-label="A" />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('an uncontrolled switch keeps its own state from defaultChecked', () => {
    const onCheckedChange = vi.fn();
    render(<Switch defaultChecked aria-label="A" onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-state')).toBe('unchecked');
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    fireEvent.click(sw);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it('onClick can prevent the toggle', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} aria-label="A" onClick={(e) => e.preventDefault()} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled does not toggle and sets data-disabled', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} aria-label="A" disabled />);
    const sw = screen.getByRole('switch') as HTMLButtonElement;
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
    expect(sw.hasAttribute('data-disabled')).toBe(true);
  });

  it('a label names the switch, a description describes it, and clicking the label toggles', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Auto refresh" description="Every minute" />);
    const sw = screen.getByRole('switch', { name: 'Auto refresh' });
    expect(document.getElementById(sw.getAttribute('aria-describedby') as string)?.textContent).toBe('Every minute');
    fireEvent.click(screen.getByText('Auto refresh'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('labelSide end puts the text after the switch, start before it', () => {
    const { container, rerender } = render(<Switch checked label="L" labelSide="end" onCheckedChange={() => undefined} />);
    const row = container.querySelector('label') as HTMLElement;
    expect(row.lastElementChild?.textContent).toBe('L');
    expect(row.className).not.toContain('justify-between');
    rerender(<Switch checked label="L" labelSide="start" onCheckedChange={() => undefined} />);
    expect(row.firstElementChild?.textContent).toBe('L');
    expect(row.className).toContain('justify-between');
  });

  it('forwards ref, id, rest and keeps className on the row when labelled', () => {
    const ref = { current: null as HTMLButtonElement | null };
    const { container } = render(<Switch ref={ref} id="sw" data-testid="x" className="x-cls" checked label="L" onCheckedChange={() => undefined} />);
    const sw = screen.getByRole('switch');
    expect(ref.current).toBe(sw);
    expect(sw.id).toBe('sw');
    expect(sw.getAttribute('data-testid')).toBe('x');
    expect((container.querySelector('label') as HTMLElement).className).toContain('x-cls');
    expect(sw.className).not.toContain('x-cls');
    cleanup();
    render(<Switch className="x-cls" checked aria-label="L" onCheckedChange={() => undefined} />);
    expect(screen.getByRole('switch').className).toContain('x-cls');
  });

  it('size sm uses the small track and travel; RTL mirrors the thumb', () => {
    const { container } = render(<Switch checked size="sm" aria-label="A" onCheckedChange={() => undefined} />);
    const track = container.querySelector('[aria-hidden=true]') as HTMLElement;
    expect(track.className).toContain('h-4 w-7');
    const thumb = track.firstElementChild as HTMLElement;
    expect(thumb.className).toContain('translate-x-3');
    expect(thumb.className).toContain('rtl:-translate-x-3');
    cleanup();
    const md = render(<Switch checked aria-label="A" onCheckedChange={() => undefined} />);
    const mdThumb = (md.container.querySelector('[aria-hidden=true]') as HTMLElement).firstElementChild as HTMLElement;
    expect(mdThumb.className).toContain('rtl:-translate-x-4');
  });

  it('draws forced-colors borders and system colors', () => {
    const { container } = render(<Switch checked aria-label="A" onCheckedChange={() => undefined} />);
    const track = container.querySelector('[aria-hidden=true]') as HTMLElement;
    expect(track.className).toContain('forced-colors:border-[color:ButtonText]');
    expect(track.className).toContain('forced-colors:bg-[color:Highlight]');
    expect(track.className).toContain('forced-color-adjust-none');
    expect((track.firstElementChild as HTMLElement).className).toContain('forced-colors:bg-[color:HighlightText]');
  });

  it('required sets aria-required', () => {
    render(<Switch checked={false} required aria-label="A" onCheckedChange={() => undefined} />);
    expect(screen.getByRole('switch').getAttribute('aria-required')).toBe('true');
  });

  describe('in a native form', () => {
    it('adds no hidden input without a name', () => {
      const { container } = render(<Switch checked aria-label="A" onCheckedChange={() => undefined} />);
      expect(container.querySelectorAll('input')).toHaveLength(0);
    });

    it('a hidden checkbox mirrors the state for FormData, value defaults to "on"', () => {
      const { container } = render(
        <form>
          <Switch name="alerts" defaultChecked={false} aria-label="A" />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      const hidden = container.querySelector('input[type=checkbox]') as HTMLInputElement;
      expect(hidden.getAttribute('aria-hidden')).toBe('true');
      expect(hidden.tabIndex).toBe(-1);
      expect(hidden.checked).toBe(false);
      expect(new FormData(form).get('alerts')).toBeNull();
      fireEvent.click(screen.getByRole('switch'));
      expect(hidden.checked).toBe(true);
      expect(new FormData(form).get('alerts')).toBe('on');
      fireEvent.click(screen.getByRole('switch'));
      expect(new FormData(form).get('alerts')).toBeNull();
    });

    it('uses a custom value, required, disabled and the form attribute', () => {
      const { container } = render(
        <>
          <form id="f1" />
          <Switch name="n" value="yes" required form="f1" checked disabled aria-label="A" onCheckedChange={() => undefined} />
        </>,
      );
      const hidden = container.querySelector('input[type=checkbox]') as HTMLInputElement;
      expect(hidden.value).toBe('yes');
      expect(hidden.required).toBe(true);
      expect(hidden.getAttribute('form')).toBe('f1');
      expect(hidden.disabled).toBe(true);
    });

    it('follows a controlled value and renders the mirror next to a labelled switch', () => {
      const { container, rerender } = render(
        <form>
          <Switch name="n" checked={false} label="L" onCheckedChange={() => undefined} />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect(new FormData(form).get('n')).toBeNull();
      rerender(
        <form>
          <Switch name="n" checked label="L" onCheckedChange={() => undefined} />
        </form>,
      );
      expect(new FormData(form).get('n')).toBe('on');
    });

    it('resets an uncontrolled switch with its form', () => {
      const { container } = render(
        <form>
          <Switch name="n" defaultChecked aria-label="A" />
        </form>,
      );
      fireEvent.click(screen.getByRole('switch'));
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
      fireEvent(container.querySelector('form') as HTMLFormElement, new Event('reset'));
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    });

    it('works through onCheckedChange with a Controller-like field', () => {
      function Controlled() {
        const [v, setV] = useState(false);
        return <Switch checked={v} onCheckedChange={setV} aria-label="A" />;
      }
      render(<Controlled />);
      fireEvent.click(screen.getByRole('switch'));
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    });
  });
});

describe('Field', () => {
  it('ties the label, hint and control together', () => {
    render(
      <Field label="Email" hint="We never share it">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input.id).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('We never share it').id);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('an error replaces the hint, is announced and sets aria-invalid', () => {
    render(
      <Field label="Email" hint="hint" error="Bad address">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(screen.queryByText('hint')).toBeNull();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Bad address');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps the control id and an existing aria-describedby; htmlFor wins', () => {
    const { rerender } = render(
      <Field label="Email" hint="h">
        <Input id="mine" aria-describedby="other" />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input.id).toBe('mine');
    expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe('other');
    rerender(
      <Field label="Email" htmlFor="forced">
        <Input id="mine" />
      </Field>,
    );
    expect(screen.getByLabelText('Email').id).toBe('forced');
  });

  it('does not put an unknown attribute on a Checkbox, a Switch or a native element', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <>
        <Field label="A" error="e">
          <Checkbox label="Box" />
        </Field>
        <Field label="B" error="e">
          <Switch checked={false} onCheckedChange={() => undefined} aria-label="sw" />
        </Field>
        <Field label="C" error="e">
          <input />
        </Field>
      </>,
    );
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('switch').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('checkbox').hasAttribute('invalid')).toBe(false);
    expect(screen.getByRole('textbox').hasAttribute('invalid')).toBe(false);
    spy.mockRestore();
  });

  it('required sets required and aria-required on the control and a hidden * marker', () => {
    const { container } = render(
      <Field label="Name" required>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText(/Name/) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    const mark = container.querySelector('[data-nish-required]') as HTMLElement;
    expect(mark.textContent).toBe('*');
    expect(mark.getAttribute('aria-hidden')).toBe('true');
  });

  it('optional shows the Optional tag unless the field is required; the tag comes from strings', () => {
    const { rerender } = render(
      <Field label="Nick" optional>
        <Input />
      </Field>,
    );
    expect(screen.getByText('Optional')).toBeTruthy();
    rerender(
      <Field label="Nick" optional required>
        <Input />
      </Field>,
    );
    expect(screen.queryByText('Optional')).toBeNull();
    cleanup();
    render(
      <NishProvider strings={{ optional: 'Opcional' }}>
        <Field label="Nick" optional>
          <Input />
        </Field>
      </NishProvider>,
    );
    expect(screen.getByText('Opcional')).toBeTruthy();
  });

  it('without required there is no marker and no required attribute', () => {
    const { container } = render(
      <Field label="Name">
        <Input />
      </Field>,
    );
    expect(container.querySelector('[data-nish-required]')).toBeNull();
    expect((screen.getByLabelText('Name') as HTMLInputElement).required).toBe(false);
  });

  it('inline layout uses a grid with the label width and puts the message in column 2', () => {
    const { container } = render(
      <Field label="Name" layout="inline" labelWidth="9rem" hint="h">
        <Input />
      </Field>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('9rem minmax(0, 1fr)');
    expect(container.querySelector('.col-start-2')?.textContent).toBe('h');
  });

  it('ref, className, style and rest go to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <Field ref={ref} label="Name" className="x-cls" style={{ color: 'red' }} data-testid="f" layout="inline">
        <Input />
      </Field>,
    );
    const root = container.firstChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root.className).toContain('x-cls');
    expect(root.getAttribute('data-testid')).toBe('f');
    expect(root.style.color).toBe('red');
    expect(root.style.gridTemplateColumns).toContain('minmax');
  });

  it('with several children it renders them untouched', () => {
    render(
      <Field label="Pair">
        <Input aria-label="a" />
        <Input aria-label="b" />
      </Field>,
    );
    expect(screen.getByLabelText('a').hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('FieldGroup', () => {
  it('is a fieldset with a legend and the hint or error describing it', () => {
    const { rerender } = render(
      <FieldGroup label="Mode" hint="Pick one">
        <input aria-label="x" />
      </FieldGroup>,
    );
    const group = screen.getByRole('group', { name: 'Mode' });
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByText('Pick one').id);
    rerender(
      <FieldGroup label="Mode" hint="Pick one" error="Required">
        <input aria-label="x" />
      </FieldGroup>,
    );
    expect(screen.queryByText('Pick one')).toBeNull();
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
  });

  it('keeps a caller aria-describedby, takes ref, className and rest, and localizes Optional', () => {
    const ref = { current: null as HTMLFieldSetElement | null };
    render(
      <NishProvider strings={{ optional: 'Opcional' }}>
        <FieldGroup ref={ref} label="Mode" optional hint="h" aria-describedby="mine" className="x-cls" data-testid="g">
          <input aria-label="x" />
        </FieldGroup>
      </NishProvider>,
    );
    const group = screen.getByRole('group');
    expect(ref.current).toBe(group);
    expect(group.className).toContain('x-cls');
    expect(group.getAttribute('data-testid')).toBe('g');
    expect(group.getAttribute('aria-describedby')?.split(' ')[0]).toBe('mine');
    expect(screen.getByText('Opcional')).toBeTruthy();
  });
});

describe('SearchInput', () => {
  it('is a type=search input with a default placeholder from strings', () => {
    render(<SearchInput value="" onChange={() => undefined} aria-label="Find" />);
    const input = screen.getByRole('searchbox', { name: 'Find' }) as HTMLInputElement;
    expect(input.type).toBe('search');
    expect(input.placeholder).toBe('Search');
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(input.autocomplete).toBe('off');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('takes placeholder and the clear label from strings, per-instance props win', () => {
    render(
      <NishProvider strings={{ search: 'Buscar', clearSearch: 'Borrar búsqueda' }}>
        <SearchInput value="x" onChange={() => undefined} aria-label="a" />
        <SearchInput value="y" onChange={() => undefined} aria-label="b" placeholder="Mine" clearLabel="Wipe" />
      </NishProvider>,
    );
    const [a, b] = screen.getAllByRole('searchbox') as HTMLInputElement[];
    expect(a.placeholder).toBe('Buscar');
    expect(b.placeholder).toBe('Mine');
    expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wipe' })).toBeTruthy();
  });

  it('typing calls onChange with the value and the event', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} aria-label="a" />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'abc' } });
    expect(onChange.mock.calls[0][0]).toBe('abc');
    expect(onChange.mock.calls[0][1].type).toBe('change');
  });

  it('Clear empties the field, calls onClear and returns focus to the input', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchInput value="abc" onChange={onChange} onClear={onClear} aria-label="a" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('', undefined);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  });

  it('Escape clears a non-empty field and stops propagation; an empty field lets it through', () => {
    const onChange = vi.fn();
    const outer = vi.fn();
    const { rerender } = render(
      <div onKeyDown={outer}>
        <SearchInput value="abc" onChange={onChange} aria-label="a" />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('', undefined);
    expect(outer).not.toHaveBeenCalled();
    rerender(
      <div onKeyDown={outer}>
        <SearchInput value="" onChange={onChange} aria-label="a" />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(outer).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('a caller onKeyDown that prevents default stops the Escape clear', () => {
    const onChange = vi.fn();
    render(<SearchInput value="abc" onChange={onChange} aria-label="a" onKeyDown={(e) => e.preventDefault()} />);
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is uncontrolled with defaultValue and posts in FormData', () => {
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <SearchInput name="q" defaultValue="cats" onChange={onChange} aria-label="a" />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('cats');
    expect(new FormData(form).get('q')).toBe('cats');
    fireEvent.change(input, { target: { value: 'dogs' } });
    expect(input.value).toBe('dogs');
    expect(onChange.mock.calls[0][0]).toBe('dogs');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    fireEvent(form, new Event('reset'));
    expect(input.value).toBe('cats');
  });

  it('a controlled field shows only its value', () => {
    render(<SearchInput value="fixed" onChange={() => undefined} aria-label="a" />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'other' } });
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('fixed');
  });

  it('disabled hides the Clear button; ref goes to the input and className to the wrapper', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { container } = render(<SearchInput ref={ref} value="x" disabled className="wrap" inputClassName="inp" onChange={() => undefined} aria-label="a" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(ref.current).toBe(screen.getByRole('searchbox'));
    expect((container.firstChild as HTMLElement).className).toContain('wrap');
    expect(screen.getByRole('searchbox').className).toContain('inp');
  });

  it('sizes and the bare variant change the classes; the icon sits at the logical start', () => {
    const { container, rerender } = render(<SearchInput value="" size="xs" onChange={() => undefined} aria-label="a" />);
    const input = screen.getByRole('searchbox');
    expect(input.className).toContain('h-7');
    expect(input.className).toContain('ps-7');
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('start-2');
    rerender(<SearchInput value="" size="sm" variant="bare" onChange={() => undefined} aria-label="a" />);
    expect(input.className).toContain('h-8');
    expect(input.className).toContain('ps-8');
    expect(input.className).toContain('bg-transparent');
    rerender(<SearchInput value="v" size="md" onChange={() => undefined} aria-label="a" />);
    expect(input.className).toContain('h-9');
    expect(input.className).toContain('pe-8');
  });
});

describe('Chip', () => {
  it('a toggle chip is a button with aria-pressed and data-state', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Chip onClick={onClick}>Open</Chip>);
    const chip = screen.getByRole('button', { name: 'Open' });
    expect(chip.getAttribute('type')).toBe('button');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(chip.getAttribute('data-state')).toBe('inactive');
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Chip pressed>Open</Chip>);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.getAttribute('data-state')).toBe('active');
    expect(chip.className).toContain('bg-th-accent-soft');
  });

  it('a suggestion chip has no aria-pressed and shows a plus unless given an icon', () => {
    const { container, rerender } = render(<Chip variant="suggestion">Add tag</Chip>);
    const chip = screen.getByRole('button');
    expect(chip.hasAttribute('aria-pressed')).toBe(false);
    expect(chip.querySelector('svg')).toBeTruthy();
    rerender(
      <Chip variant="suggestion" icon={<i data-testid="ic" />}>
        Add tag
      </Chip>,
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByTestId('ic')).toBeTruthy();
  });

  it('ref, rest and className reach the button; disabled sets data-disabled', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Chip ref={ref} className="x-cls" data-testid="c" disabled trailing={<b>3</b>}>
        A
      </Chip>,
    );
    const chip = screen.getByTestId('c') as HTMLButtonElement;
    expect(ref.current).toBe(chip);
    expect(chip.className).toContain('x-cls');
    expect(chip.disabled).toBe(true);
    expect(chip.hasAttribute('data-disabled')).toBe(true);
    expect(chip.textContent).toBe('A3');
  });

  it('a tag chip is a span with ref and rest, and an optional named remove button', () => {
    const onRemove = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    const { container } = render(
      <Chip ref={ref} variant="tag" onRemove={onRemove} data-testid="tag" className="x-cls">
        urgent
      </Chip>,
    );
    const tag = container.firstChild as HTMLElement;
    expect(tag.tagName).toBe('SPAN');
    expect(ref.current).toBe(tag);
    expect(tag.getAttribute('data-testid')).toBe('tag');
    expect(tag.className).toContain('x-cls');
    expect(tag.className).toContain('pe-1');
    fireEvent.click(screen.getByRole('button', { name: 'Remove urgent' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('a tag chip has no remove button without onRemove; sm pads less; non-string children say "Remove"', () => {
    const { container, rerender } = render(<Chip variant="tag">a</Chip>);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <Chip variant="tag" size="sm" onRemove={() => undefined}>
        <b>x</b>
      </Chip>,
    );
    expect((container.firstChild as HTMLElement).className).toContain('pe-0.5');
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
    rerender(
      <Chip variant="tag" onRemove={() => undefined} removeLabel="Drop it">
        a
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Drop it' })).toBeTruthy();
  });

  it('remove labels come from strings', () => {
    render(
      <NishProvider strings={{ removeNamed: (n) => `Quitar ${n}`, remove: 'Quitar' }}>
        <Chip variant="tag" onRemove={() => undefined}>
          alfa
        </Chip>
        <Chip variant="tag" onRemove={() => undefined}>
          <b>x</b>
        </Chip>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Quitar alfa' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quitar' })).toBeTruthy();
  });
});

describe('ChipGroup', () => {
  function Group() {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <ChipGroup ref={ref} label="Status" className="x-cls" data-testid="g">
        <Chip>One</Chip>
        <Chip disabled>Two</Chip>
        <Chip>Three</Chip>
      </ChipGroup>
    );
  }
  const chips = () => screen.getAllByRole('button') as HTMLButtonElement[];

  it('is a named group; className, rest and ref reach the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <ChipGroup ref={ref} label="Status" className="x-cls" data-testid="g" scroll>
        <Chip>One</Chip>
      </ChipGroup>,
    );
    const group = screen.getByRole('group', { name: 'Status' });
    expect(ref.current).toBe(group);
    expect(group.className).toContain('x-cls');
    expect(group.className).toContain('max-sm:overflow-x-auto');
    expect(group.getAttribute('data-testid')).toBe('g');
  });

  it('wraps by default (no scroll classes)', () => {
    render(<Group />);
    expect(screen.getByRole('group').className).toContain('flex-wrap');
    expect(screen.getByRole('group').className).not.toContain('overflow-x-auto');
  });

  it('arrow keys move focus between enabled chips, wrap, and Home/End jump', () => {
    render(<Group />);
    const group = screen.getByRole('group');
    chips()[0].focus();
    fireEvent.keyDown(chips()[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(chips()[2]);
    fireEvent.keyDown(chips()[2], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(chips()[0]);
    fireEvent.keyDown(chips()[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(chips()[2]);
    fireEvent.keyDown(chips()[2], { key: 'Home' });
    expect(document.activeElement).toBe(chips()[0]);
    fireEvent.keyDown(chips()[0], { key: 'End' });
    expect(document.activeElement).toBe(chips()[2]);
    fireEvent.keyDown(group, { key: 'ArrowRight' }); // target is the group, not a chip
    expect(document.activeElement).toBe(chips()[2]);
  });

  it('in a right-to-left layout ArrowLeft goes forward', () => {
    rtl.on = true;
    render(<Group />);
    chips()[0].focus();
    fireEvent.keyDown(chips()[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(chips()[2]);
    fireEvent.keyDown(chips()[2], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(chips()[0]);
  });

  it('ignores other keys and a prevented keydown', () => {
    const onKeyDown = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <ChipGroup label="S" onKeyDown={onKeyDown}>
        <Chip>One</Chip>
        <Chip>Two</Chip>
      </ChipGroup>,
    );
    chips()[0].focus();
    fireEvent.keyDown(chips()[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(chips()[0]);
    expect(onKeyDown).toHaveBeenCalled();
    cleanup();
    render(
      <ChipGroup label="S">
        <Chip>One</Chip>
        <Chip>Two</Chip>
      </ChipGroup>,
    );
    chips()[0].focus();
    fireEvent.keyDown(chips()[0], { key: 'a' });
    expect(document.activeElement).toBe(chips()[0]);
  });
});

describe('server rendering', () => {
  it('every control renders to a string without throwing', async () => {
    const { renderToString } = await import('react-dom/server');
    const { Combobox } = await import('./combobox');
    const { Segmented } = await import('./segmented');
    const html = renderToString(
      <form>
        <Field label="Name" required error="bad" hint="h">
          <Input />
        </Field>
        <Textarea autoGrow aria-label="t" />
        <Checkbox label="c" hint="h" trailing="1" />
        <Switch name="s" defaultChecked label="sw" />
        <SearchInput defaultValue="q" aria-label="q" />
        <ChipGroup label="g">
          <Chip pressed>a</Chip>
          <Chip variant="tag" onRemove={() => undefined}>
            b
          </Chip>
        </ChipGroup>
        <Combobox aria-label="cb" name="cb" options={[{ value: 'a', label: 'A' }]} defaultValue="a" />
        <Segmented label="seg" name="seg" options={[{ value: 'a', label: 'A' }]} defaultValue="a" />
      </form>,
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('name="cb"');
    expect(html).toContain('name="seg"');
  });
  it('gives the Field label an id of the control id plus -label', () => {
    const { container } = render(
      <Field label="Start">
        <Input id="s" />
      </Field>,
    );
    const label = container.querySelector('label#s-label') as HTMLLabelElement;
    expect(label).not.toBeNull();
    expect(label.htmlFor).toBe('s');
  });
});
