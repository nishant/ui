import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from './forms';
import { NishProvider } from './provider';
import { TagInput } from './tag-input';

afterEach(cleanup);

const box = () => document.querySelector('input[type="text"]') as HTMLInputElement;
const type = (text: string) => fireEvent.change(box(), { target: { value: text } });
const press = (key: string, init: Record<string, unknown> = {}) => fireEvent.keyDown(box(), { key, ...init });
const tagTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button[aria-label^="Remove"]')).map((b) => b.getAttribute('aria-label'));

describe('TagInput', () => {
  it('adds a tag on Enter and clears the box', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    type('  react ');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(['react']);
    expect(box().value).toBe('');
    expect(screen.getByText('react')).toBeTruthy();
  });

  it('adds a tag on comma and never types the comma', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    type('vue');
    const notPrevented = fireEvent.keyDown(box(), { key: ',' });
    expect(notPrevented).toBe(false);
    expect(onValueChange).toHaveBeenCalledWith(['vue']);
    const empty = fireEvent.keyDown(box(), { key: ',' });
    expect(empty).toBe(false);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('lets Enter through on an empty box (a form can submit) and blocks it when adding', () => {
    render(<TagInput aria-label="Tags" />);
    expect(fireEvent.keyDown(box(), { key: 'Enter' })).toBe(true);
    type('x');
    expect(fireEvent.keyDown(box(), { key: 'Enter' })).toBe(false);
  });

  it('ignores blank and duplicate tags', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" defaultValue={['a']} onValueChange={onValueChange} />);
    type('   ');
    press('Enter');
    type('a');
    press('Enter');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(box().value).toBe('');
  });

  it('removes the last tag with Backspace on an empty box only', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    type('x');
    press('Backspace');
    expect(onValueChange).not.toHaveBeenCalled();
    type('');
    press('Backspace');
    expect(onValueChange).toHaveBeenCalledWith(['a']);
  });

  it('removes a tag from its chip, with a label from strings', () => {
    const onValueChange = vi.fn();
    const { container } = render(<TagInput aria-label="Tags" defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    expect(tagTexts(container)).toEqual(['Remove a', 'Remove b']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove a' }));
    expect(onValueChange).toHaveBeenCalledWith(['b']);
    expect(document.activeElement).toBe(box());
  });

  it('reads the remove label from the provider', () => {
    render(
      <NishProvider strings={{ removeTag: (t) => `Retirer ${t}` }}>
        <TagInput aria-label="Tags" defaultValue={['a']} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Retirer a' })).toBeTruthy();
  });

  it('splits pasted text on commas and newlines', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    const prevented = !fireEvent.paste(box(), { clipboardData: { getData: () => 'one, two\nthree,,  ' } });
    expect(prevented).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith(['one', 'two', 'three']);
  });

  it('leaves a paste with no separator to the browser', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    const prevented = !fireEvent.paste(box(), { clipboardData: { getData: () => 'single' } });
    expect(prevented).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('stops at maxTags', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" maxTags={2} defaultValue={['a']} onValueChange={onValueChange} />);
    fireEvent.paste(box(), { clipboardData: { getData: () => 'b,c,d' } });
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
    expect(screen.getByRole('alert').textContent).toBe('You can add up to 2');
    type('e');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(box().value).toBe('e');
  });

  it('keeps pasted tags that fail validate in the text box', () => {
    render(<TagInput aria-label="Tags" validate={(t) => (t.includes('@') ? null : 'Not an email')} />);
    fireEvent.paste(box(), { clipboardData: { getData: () => 'a@b.c,nope' } });
    expect(box().value).toBe('nope');
  });

  it('does not throw on Enter when the suggestions shrink under the active index', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<TagInput aria-label="Tags" suggestions={['aa', 'ab', 'ac']} onValueChange={onValueChange} />);
    fireEvent.focus(box());
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    rerender(<TagInput aria-label="Tags" suggestions={['aa']} onValueChange={onValueChange} />);
    expect(() => press('Enter')).not.toThrow();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('refuses a tag that fails validate and shows the message', () => {
    const onValueChange = vi.fn();
    render(
      <TagInput
        aria-label="Tags"
        onValueChange={onValueChange}
        validate={(t) => (t.includes('@') ? null : 'Not an email')}
      />,
    );
    type('nope');
    press('Enter');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(box().value).toBe('nope');
    expect(screen.getByRole('alert').textContent).toBe('Not an email');
    expect(box().getAttribute('aria-invalid')).toBe('true');
    expect(box().getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    type('a@b.co');
    expect(screen.queryByRole('alert')).toBeNull();
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(['a@b.co']);
  });

  it('accepts valid tags from a paste and reports the first error', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} validate={(t) => (t.length > 2 ? 'Too long' : null)} />);
    fireEvent.paste(box(), { clipboardData: { getData: () => 'ab,abc,cd' } });
    expect(onValueChange).toHaveBeenCalledWith(['ab', 'cd']);
    expect(screen.getByRole('alert').textContent).toBe('Too long');
  });

  it('is controlled by value', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<TagInput aria-label="Tags" value={['a']} onValueChange={onValueChange} />);
    type('b');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
    expect(screen.queryByText('b', { selector: 'span' })).toBeNull();
    rerender(<TagInput aria-label="Tags" value={['a', 'b']} onValueChange={onValueChange} />);
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('works in a stateful parent', () => {
    function Parent() {
      const [tags, setTags] = useState<string[]>([]);
      return <TagInput aria-label="Tags" value={tags} onValueChange={setTags} />;
    }
    const { container } = render(<Parent />);
    type('x');
    press('Enter');
    type('y');
    press('Enter');
    expect(tagTexts(container)).toEqual(['Remove x', 'Remove y']);
  });

  it('posts one hidden input per tag', () => {
    const { container } = render(
      <form>
        <TagInput aria-label="Tags" name="skills" defaultValue={['a', 'b']} />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).getAll('skills')).toEqual(['a', 'b']);
    type('c');
    press('Enter');
    expect(new FormData(form).getAll('skills')).toEqual(['a', 'b', 'c']);
  });

  it('shows the placeholder only while there are no tags', () => {
    render(<TagInput aria-label="Tags" placeholder="Add a tag" />);
    expect(box().placeholder).toBe('Add a tag');
    cleanup();
    render(<TagInput aria-label="Tags" placeholder="Add a tag" defaultValue={['a']} />);
    expect(box().hasAttribute('placeholder')).toBe(false);
  });

  it('is inert when disabled', () => {
    const { container } = render(<TagInput aria-label="Tags" name="t" disabled defaultValue={['a']} />);
    expect(box().disabled).toBe(true);
    expect(tagTexts(container)).toEqual([]);
    expect(container.firstElementChild!.hasAttribute('data-disabled')).toBe(true);
    expect(container.querySelector('input[type=hidden]')!.hasAttribute('disabled')).toBe(true);
  });

  it('ignores keys during IME composition', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" onValueChange={onValueChange} />);
    type('にほん');
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('focuses the text box when the box is clicked', () => {
    const { container } = render(<TagInput aria-label="Tags" />);
    fireEvent.click(container.firstElementChild!);
    expect(document.activeElement).toBe(box());
  });

  it('is named, described and marked invalid by a Field', () => {
    render(
      <Field label="Skills" error="Add one">
        <TagInput />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Skills' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('requires the text box only while there are no tags', () => {
    render(<TagInput aria-label="Tags" required />);
    expect(box().required).toBe(true);
    cleanup();
    render(<TagInput aria-label="Tags" required defaultValue={['a']} />);
    expect(box().required).toBe(false);
  });

  it('passes ref, inputRef, className, id and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(<TagInput ref={ref} inputRef={inputRef} aria-label="Tags" className="mt-2" id="ti" data-x="1" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(inputRef.current).toBe(box());
    expect(box().id).toBe('ti');
  });

  it('has a forced-colors focus outline and the control border', () => {
    const { container } = render(<TagInput aria-label="Tags" />);
    expect(container.firstElementChild!.className).toContain('forced-colors:focus-within:outline-[Highlight]');
    expect(container.firstElementChild!.className).toContain('border-th-line-control');
  });

  it('renders on the server', () => {
    expect(renderToString(<TagInput aria-label="Tags" defaultValue={['a']} name="n" />)).toContain('type="hidden"');
  });
});

describe('TagInput suggestions', () => {
  const SUGGESTIONS = ['apple', 'apricot', 'banana'];

  it('opens a listbox filtered by the text, minus tags already chosen', () => {
    render(<TagInput aria-label="Tags" suggestions={SUGGESTIONS} defaultValue={['apricot']} />);
    expect(box().getAttribute('role')).toBe('combobox');
    expect(box().getAttribute('aria-expanded')).toBe('false');
    fireEvent.focus(box());
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['apple', 'banana']);
    type('ap');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['apple']);
    expect(box().getAttribute('aria-expanded')).toBe('true');
    expect(box().getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
  });

  it('moves the active option with the arrows (wrapping) and adds it with Enter', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" suggestions={SUGGESTIONS} onValueChange={onValueChange} />);
    press('ArrowDown');
    const options = () => screen.getAllByRole('option');
    expect(options()[0]!.getAttribute('aria-selected')).toBe('true');
    expect(box().getAttribute('aria-activedescendant')).toBe(options()[0]!.id);
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    expect(options()[0]!.getAttribute('aria-selected')).toBe('true');
    press('ArrowUp');
    expect(options()[2]!.getAttribute('aria-selected')).toBe('true');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(['banana']);
    expect(box().value).toBe('');
  });

  it('opens upward from ArrowUp when closed', () => {
    render(<TagInput aria-label="Tags" suggestions={SUGGESTIONS} />);
    press('ArrowUp');
    expect(screen.getAllByRole('option')[2]!.getAttribute('aria-selected')).toBe('true');
  });

  it('adds the typed text when no option is active, even if it is not a suggestion', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" suggestions={SUGGESTIONS} onValueChange={onValueChange} />);
    type('cherry');
    press('Enter');
    expect(onValueChange).toHaveBeenCalledWith(['cherry']);
  });

  it('adds an option on click', () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Tags" suggestions={SUGGESTIONS} onValueChange={onValueChange} />);
    fireEvent.focus(box());
    fireEvent.click(screen.getByRole('option', { name: 'banana' }));
    expect(onValueChange).toHaveBeenCalledWith(['banana']);
  });

  it('closes on Escape and on blur out of the field', () => {
    render(
      <>
        <TagInput aria-label="Tags" suggestions={SUGGESTIONS} />
        <button type="button">outside</button>
      </>,
    );
    fireEvent.focus(box());
    expect(screen.queryByRole('listbox')).toBeTruthy();
    const notPrevented = fireEvent.keyDown(box(), { key: 'Escape' });
    expect(notPrevented).toBe(false);
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.focus(box());
    fireEvent.blur(box(), { relatedTarget: screen.getByText('outside') });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('has no combobox role without suggestions', () => {
    render(<TagInput aria-label="Tags" />);
    expect(box().hasAttribute('role')).toBe(false);
    expect(box().hasAttribute('aria-expanded')).toBe(false);
  });
});
