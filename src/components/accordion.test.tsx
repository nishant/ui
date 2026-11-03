import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Accordion, AccordionItem } from './accordion';
import { NishProvider } from './provider';

afterEach(cleanup);

function items() {
  return [
    <AccordionItem key="a" value="a" title="Alpha">
      Alpha body
    </AccordionItem>,
    <AccordionItem key="b" value="b" title="Beta">
      Beta body
    </AccordionItem>,
    <AccordionItem key="c" value="c" title="Gamma" disabled>
      Gamma body
    </AccordionItem>,
    <AccordionItem key="d" value="d" title="Delta">
      Delta body
    </AccordionItem>,
  ];
}

const trigger = (name: string) => screen.getByRole('button', { name });

describe('Accordion', () => {
  it('wires the APG pattern: heading, button, aria-expanded, aria-controls, region', () => {
    render(<Accordion defaultValue="a">{items()}</Accordion>);
    const a = trigger('Alpha');
    expect(a.parentElement!.tagName).toBe('H3');
    expect(a.getAttribute('aria-expanded')).toBe('true');
    expect(trigger('Beta').getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById(a.getAttribute('aria-controls')!)!;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe(a.id);
    expect(panel.getAttribute('data-state')).toBe('open');
    expect(a.getAttribute('data-state')).toBe('open');
    const closed = document.getElementById(trigger('Beta').getAttribute('aria-controls')!)!;
    expect(closed.getAttribute('data-state')).toBe('closed');
    expect(closed.hasAttribute('inert')).toBe(true);
    expect(panel.hasAttribute('inert')).toBe(false);
  });

  it('headingLevel sets the header element', () => {
    render(<Accordion headingLevel={2}>{items()}</Accordion>);
    expect(trigger('Alpha').parentElement!.tagName).toBe('H2');
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(4);
  });

  it('single: opening one closes the other', () => {
    render(<Accordion>{items()}</Accordion>);
    fireEvent.click(trigger('Alpha'));
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger('Beta'));
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('false');
    expect(trigger('Beta').getAttribute('aria-expanded')).toBe('true');
  });

  it('single, not collapsible: the open item stays open', () => {
    const fn = vi.fn();
    render(
      <Accordion defaultValue="a" onValueChange={fn}>
        {items()}
      </Accordion>,
    );
    fireEvent.click(trigger('Alpha'));
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('true');
    expect(fn).not.toHaveBeenCalled();
  });

  it('single, collapsible: the open item closes and reports an empty value', () => {
    const fn = vi.fn();
    render(
      <Accordion defaultValue="a" collapsible onValueChange={fn}>
        {items()}
      </Accordion>,
    );
    fireEvent.click(trigger('Alpha'));
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('false');
    expect(fn).toHaveBeenCalledWith('');
    fireEvent.click(trigger('Beta'));
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('multiple: items open independently and report the list', () => {
    const fn = vi.fn();
    render(
      <Accordion type="multiple" defaultValue={['a']} onValueChange={fn}>
        {items()}
      </Accordion>,
    );
    fireEvent.click(trigger('Beta'));
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('true');
    expect(trigger('Beta').getAttribute('aria-expanded')).toBe('true');
    expect(fn).toHaveBeenLastCalledWith(['a', 'b']);
    fireEvent.click(trigger('Alpha'));
    expect(fn).toHaveBeenLastCalledWith(['b']);
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('false');
  });

  it('is controlled: value wins and only the callback fires', () => {
    const fn = vi.fn();
    const { rerender } = render(
      <Accordion value="a" onValueChange={fn}>
        {items()}
      </Accordion>,
    );
    fireEvent.click(trigger('Beta'));
    expect(fn).toHaveBeenCalledWith('b');
    expect(trigger('Beta').getAttribute('aria-expanded')).toBe('false');
    rerender(
      <Accordion value="b" onValueChange={fn}>
        {items()}
      </Accordion>,
    );
    expect(trigger('Beta').getAttribute('aria-expanded')).toBe('true');
    expect(trigger('Alpha').getAttribute('aria-expanded')).toBe('false');
  });

  it('a controlled empty string value means none open', () => {
    render(<Accordion value="">{items()}</Accordion>);
    for (const n of ['Alpha', 'Beta', 'Delta']) expect(trigger(n).getAttribute('aria-expanded')).toBe('false');
  });

  it('a disabled item cannot be toggled and carries data-disabled', () => {
    const fn = vi.fn();
    render(<Accordion onValueChange={fn}>{items()}</Accordion>);
    const g = trigger('Gamma') as HTMLButtonElement;
    expect(g.disabled).toBe(true);
    expect(g.hasAttribute('data-disabled')).toBe(true);
    fireEvent.click(g);
    expect(fn).not.toHaveBeenCalled();
  });

  it('disabled on the Accordion disables every item', () => {
    render(<Accordion disabled>{items()}</Accordion>);
    for (const b of screen.getAllByRole('button')) expect((b as HTMLButtonElement).disabled).toBe(true);
  });

  it('arrow keys move focus between headers, skip disabled ones and wrap', () => {
    render(<Accordion>{items()}</Accordion>);
    trigger('Alpha').focus();
    fireEvent.keyDown(trigger('Alpha'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('Beta'));
    fireEvent.keyDown(trigger('Beta'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('Delta'));
    fireEvent.keyDown(trigger('Delta'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trigger('Alpha'));
    fireEvent.keyDown(trigger('Alpha'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(trigger('Delta'));
    fireEvent.keyDown(trigger('Delta'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(trigger('Beta'));
  });

  it('Home and End jump to the first and last header', () => {
    render(<Accordion>{items()}</Accordion>);
    trigger('Beta').focus();
    fireEvent.keyDown(trigger('Beta'), { key: 'End' });
    expect(document.activeElement).toBe(trigger('Delta'));
    fireEvent.keyDown(trigger('Delta'), { key: 'Home' });
    expect(document.activeElement).toBe(trigger('Alpha'));
  });

  it('prevents the default of handled keys only', () => {
    render(<Accordion>{items()}</Accordion>);
    expect(fireEvent.keyDown(trigger('Alpha'), { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(trigger('Alpha'), { key: 'a' })).toBe(true);
  });

  it('animates the height with motion-reduce respected', () => {
    render(<Accordion defaultValue="a">{items()}</Accordion>);
    const open = document.getElementById(trigger('Alpha').getAttribute('aria-controls')!)!;
    const closed = document.getElementById(trigger('Beta').getAttribute('aria-controls')!)!;
    expect(open.className).toContain('grid-rows-[1fr]');
    expect(closed.className).toContain('grid-rows-[0fr]');
    expect(closed.className).toContain('invisible');
    expect(open.className).toContain('motion-reduce:transition-none');
  });

  it('labels the group from strings, and the label prop wins', () => {
    render(
      <NishProvider strings={{ accordion: 'Fragen' }}>
        <Accordion>{items()}</Accordion>
        <Accordion label="Own">{items()}</Accordion>
      </NishProvider>,
    );
    expect(screen.getByRole('group', { name: 'Fragen' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Own' })).toBeTruthy();
  });

  it('forwards refs, merges className and spreads rest on the root and the item', () => {
    const ref = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    render(
      <Accordion ref={ref} className="mt-3" id="acc" data-x="1">
        <AccordionItem ref={itemRef} value="a" title="Alpha" className="px-1" data-y="2">
          body
        </AccordionItem>
      </Accordion>,
    );
    expect(ref.current!.className).toContain('mt-3');
    expect(ref.current!.id).toBe('acc');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(itemRef.current!.className).toContain('px-1');
    expect(itemRef.current!.getAttribute('data-y')).toBe('2');
    expect(itemRef.current!.getAttribute('data-state')).toBe('closed');
  });

  it('throws when an item is used outside an Accordion', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AccordionItem value="a" title="x">y</AccordionItem>)).toThrow(/inside an Accordion/);
    err.mockRestore();
  });

  it('renders on the server', () => {
    const html = renderToString(<Accordion defaultValue="a">{items()}</Accordion>);
    expect(html).toContain('aria-expanded="true"');
  });
});
