import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TabPanel, Tabs, tabClass, type TabItem } from './tabs';
import { tabClass as classesTabClass } from './tabs-classes';

const ITEMS: TabItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', count: 3 },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta', sub: 'second line' },
];

beforeEach(() => {
  // happy-dom has no layout; the strip's scroll helpers only need these to exist.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Controlled(props: { onValueChange?: (v: string) => void; onChange?: (v: string) => void }) {
  const [v, setV] = useState('a');
  return (
    <Tabs
      label="Sections"
      value={v}
      items={ITEMS}
      onValueChange={(x) => {
        setV(x);
        props.onValueChange?.(x);
      }}
      onChange={props.onChange}
    />
  );
}

const tab = (name: string) => screen.getByRole('tab', { name: new RegExp(name) });

describe('tabClass', () => {
  it('is re-exported from tabs and lives in tabs-classes', () => {
    expect(tabClass).toBe(classesTabClass);
  });

  it('underline: active gets the accent border, inactive is transparent', () => {
    expect(tabClass({ active: true })).toContain('border-th-accent');
    expect(tabClass({ active: false })).toContain('border-transparent');
    expect(tabClass({ active: false })).toContain('h-10');
  });

  it('pill: active gets the elevated background', () => {
    const on = tabClass({ active: true, variant: 'pill' });
    expect(on).toContain('bg-th-elevated');
    expect(on).toContain('rounded-lg');
    expect(on).not.toContain('border-b-2');
    expect(tabClass({ active: false, variant: 'pill' })).toContain('hover:bg-th-elevated/60');
  });

  it('sizes set text and height', () => {
    expect(tabClass({ active: true, size: 'xs' })).toContain('text-2xs');
    expect(tabClass({ active: true, size: 'xs' })).toContain('h-7');
    expect(tabClass({ active: true, size: 'sm' })).toContain('text-xs');
    expect(tabClass({ active: true, size: 'sm', variant: 'pill' })).toContain('h-7 px-2.5');
    expect(tabClass({ active: true })).toContain('text-sm');
  });

  it('is 44px on coarse pointers and marks the selected tab in forced colors', () => {
    expect(tabClass({ active: false })).toContain('pointer-coarse:min-h-11');
    expect(tabClass({ active: false })).toContain('pointer-coarse:min-w-11');
    expect(tabClass({ active: true })).toContain('forced-colors:');
    expect(tabClass({ active: false })).not.toContain('forced-colors:');
  });

  it('block fills its share and className merges last', () => {
    expect(tabClass({ active: false, block: true })).toContain('flex-1');
    expect(tabClass({ active: false })).not.toContain('flex-1');
    expect(tabClass({ active: false, className: 'h-auto' })).toContain('h-auto');
    expect(tabClass({ active: false, className: 'h-auto' })).not.toContain('h-10');
  });
});

describe('Tabs ARIA and props', () => {
  it('renders a tablist with tabs, aria-selected, roving tabindex and data-state', () => {
    render(<Tabs label="Sections" value="b" items={ITEMS} />);
    const list = screen.getByRole('tablist', { name: 'Sections' });
    expect(list).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('false');
    expect(tab('Beta').getAttribute('data-state')).toBe('active');
    expect(tab('Alpha').getAttribute('data-state')).toBe('inactive');
    expect(tab('Beta').tabIndex).toBe(0);
    expect(tab('Alpha').tabIndex).toBe(-1);
    expect(tab('Delta').tabIndex).toBe(-1);
  });

  it('disabled tabs are disabled with data-disabled; others have none', () => {
    render(<Tabs label="Sections" value="a" items={ITEMS} />);
    const gamma = tab('Gamma') as HTMLButtonElement;
    expect(gamma.disabled).toBe(true);
    expect(gamma.hasAttribute('data-disabled')).toBe(true);
    expect(tab('Alpha').hasAttribute('data-disabled')).toBe(false);
  });

  it('the first enabled tab is the tab stop when the value matches nothing or a disabled tab', () => {
    const { rerender } = render(<Tabs label="Sections" value="zzz" items={ITEMS} />);
    expect(tab('Alpha').tabIndex).toBe(0);
    rerender(<Tabs label="Sections" value="c" items={ITEMS} />);
    expect(tab('Alpha').tabIndex).toBe(0);
    expect(tab('Gamma').tabIndex).toBe(-1);
  });

  it('shows a count badge and a second line', () => {
    render(<Tabs label="Sections" value="a" items={ITEMS} />);
    expect(tab('Beta').textContent).toContain('3');
    expect(tab('Delta').textContent).toContain('second line');
    expect(tab('Delta').className).toContain('h-auto');
    expect(tab('Alpha').className).not.toContain('h-auto');
  });

  it('takes ref on the tab list, className on it, and rest props', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Tabs ref={ref} label="Sections" value="a" items={ITEMS} className="px-4" id="my-tabs" data-x="t" style={{ marginTop: 4 }} />);
    const list = screen.getByRole('tablist');
    expect(ref.current).toBe(list);
    expect(list.className).toContain('px-4');
    expect(list.id).toBe('my-tabs');
    expect(list.getAttribute('data-x')).toBe('t');
    expect(list.style.marginTop).toBe('4px');
  });

  it('variant and block change the list classes', () => {
    const { rerender } = render(<Tabs label="S" value="a" items={ITEMS} />);
    expect(screen.getByRole('tablist').className).toContain('gap-5');
    rerender(<Tabs label="S" value="a" items={ITEMS} block />);
    expect(screen.getByRole('tablist').className).toContain('w-full');
    expect(screen.getByRole('tablist').className).toContain('gap-1');
    rerender(<Tabs label="S" value="a" items={ITEMS} variant="pill" />);
    expect(screen.getByRole('tablist').className).not.toContain('gap-5');
  });

  it('tab ids use idBase and aria-controls only when panels are linked', () => {
    const { rerender } = render(<Tabs label="S" value="a" items={ITEMS} idBase="x" />);
    expect(tab('Alpha').id).toBe('x-tab-a');
    expect(tab('Alpha').hasAttribute('aria-controls')).toBe(false);
    rerender(<Tabs label="S" value="a" items={ITEMS} idBase="x" controlsPanels />);
    expect(tab('Alpha').getAttribute('aria-controls')).toBe('x-panel-a');
  });

  it('children link the panels automatically', () => {
    render(
      <Tabs label="S" value="a" items={ITEMS} idBase="y">
        <TabPanel value="a">A body</TabPanel>
      </Tabs>,
    );
    expect(tab('Alpha').getAttribute('aria-controls')).toBe('y-panel-a');
  });
});

describe('Tabs selection', () => {
  it('click selects (controlled) and calls onValueChange and the onChange alias', () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} onChange={onChange} />);
    fireEvent.click(tab('Beta'));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(onChange).toHaveBeenCalledWith('b');
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
  });

  it('a controlled Tabs does not change on its own', () => {
    const onValueChange = vi.fn();
    render(<Tabs label="S" value="a" items={ITEMS} onValueChange={onValueChange} />);
    fireEvent.click(tab('Beta'));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('uncontrolled: defaultValue picks the first tab and clicks move it', () => {
    const onValueChange = vi.fn();
    render(<Tabs label="S" defaultValue="b" items={ITEMS} onValueChange={onValueChange} />);
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tab('Delta'));
    expect(tab('Delta').getAttribute('aria-selected')).toBe('true');
    expect(tab('Beta').getAttribute('aria-selected')).toBe('false');
    expect(onValueChange).toHaveBeenCalledWith('d');
  });

  it('uncontrolled without defaultValue starts on the first enabled tab', () => {
    render(<Tabs label="S" items={[{ value: 'x', label: 'X', disabled: true }, ...ITEMS]} />);
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('clicking a disabled tab does nothing', () => {
    const onValueChange = vi.fn();
    render(<Tabs label="S" value="a" items={ITEMS} onValueChange={onValueChange} />);
    fireEvent.click(tab('Gamma'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Tabs keyboard', () => {
  const press = (key: string) => fireEvent.keyDown(screen.getByRole('tablist'), { key });

  it('ArrowRight moves to the next enabled tab (skipping disabled), selects and focuses it', () => {
    render(<Controlled />);
    tab('Alpha').focus();
    press('ArrowRight');
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tab('Beta'));
    press('ArrowRight');
    expect(tab('Delta').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tab('Delta'));
  });

  it('wraps around at both ends', () => {
    render(<Controlled />);
    tab('Alpha').focus();
    press('ArrowLeft');
    expect(tab('Delta').getAttribute('aria-selected')).toBe('true');
    press('ArrowRight');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('Home and End go to the first and last enabled tab', () => {
    render(<Controlled />);
    tab('Alpha').focus();
    press('End');
    expect(tab('Delta').getAttribute('aria-selected')).toBe('true');
    press('Home');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('arrow keys are prevented; other keys are left alone', () => {
    render(<Controlled />);
    tab('Alpha').focus();
    const list = screen.getByRole('tablist');
    expect(fireEvent.keyDown(list, { key: 'ArrowRight' })).toBe(false);
    expect(fireEvent.keyDown(list, { key: 'Home' })).toBe(false);
    expect(fireEvent.keyDown(list, { key: 'End' })).toBe(false);
    expect(fireEvent.keyDown(list, { key: 'a' })).toBe(true);
  });

  it('in a right-to-left layout the arrows swap', () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Controlled />
      </div>,
    );
    expect(getComputedStyle(screen.getByRole('tablist')).direction).toBe('rtl');
    tab('Alpha').focus();
    press('ArrowLeft');
    expect(tab('Beta').getAttribute('aria-selected')).toBe('true');
    press('ArrowRight');
    expect(tab('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('a caller onKeyDown runs first and can stop the default handling', () => {
    const onKeyDown = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const onValueChange = vi.fn();
    render(<Tabs label="S" value="a" items={ITEMS} onKeyDown={onKeyDown} onValueChange={onValueChange} />);
    tab('Alpha').focus();
    press('ArrowRight');
    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('with every tab disabled the keys do nothing', () => {
    const onValueChange = vi.fn();
    render(<Tabs label="S" value="a" onValueChange={onValueChange} items={[{ value: 'a', label: 'A', disabled: true }]} />);
    press('ArrowRight');
    press('Home');
    press('End');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('TabPanel', () => {
  it('renders role=tabpanel labelled by its tab, only the selected panel shows', () => {
    render(
      <Tabs label="S" value="a" items={ITEMS} idBase="p">
        <TabPanel value="a">A body</TabPanel>
        <TabPanel value="b">B body</TabPanel>
      </Tabs>,
    );
    const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    expect(panels[0].id).toBe('p-panel-a');
    expect(panels[0].getAttribute('aria-labelledby')).toBe('p-tab-a');
    expect(panels[0].hidden).toBe(false);
    expect(panels[0].getAttribute('data-state')).toBe('active');
    expect(panels[1].hidden).toBe(true);
    expect(panels[1].getAttribute('data-state')).toBe('inactive');
    expect(screen.getByText('A body')).toBeTruthy();
    expect(screen.queryByText('B body')).toBeNull();
    expect(panels[0].tabIndex).toBe(0);
  });

  it('keepMounted keeps the content of a hidden panel', () => {
    render(
      <Tabs label="S" value="a" items={ITEMS}>
        <TabPanel value="b" keepMounted>
          kept
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('kept')).toBeTruthy();
    expect(document.querySelector<HTMLElement>('[role="tabpanel"]')!.hidden).toBe(true);
  });

  it('follows an uncontrolled selection', () => {
    render(
      <Tabs label="S" defaultValue="a" items={ITEMS}>
        <TabPanel value="a">A body</TabPanel>
        <TabPanel value="b">B body</TabPanel>
      </Tabs>,
    );
    fireEvent.click(tab('Beta'));
    expect(screen.getByText('B body')).toBeTruthy();
    expect(screen.queryByText('A body')).toBeNull();
  });

  it('takes ref, className and rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tabs label="S" value="a" items={ITEMS}>
        <TabPanel ref={ref} value="a" className="pt-3" data-x="p" aria-live="polite">
          body
        </TabPanel>
      </Tabs>,
    );
    expect(ref.current).toBe(screen.getByRole('tabpanel'));
    expect(ref.current!.className).toContain('pt-3');
    expect(ref.current!.getAttribute('data-x')).toBe('p');
    expect(ref.current!.getAttribute('aria-live')).toBe('polite');
    expect(ref.current!.getAttribute('role')).toBe('tabpanel');
  });

  it('outside its Tabs it uses idBase and active', () => {
    render(
      <>
        <Tabs label="S" value="b" items={ITEMS} idBase="z" controlsPanels />
        <TabPanel idBase="z" value="b" active>
          B body
        </TabPanel>
        <TabPanel idBase="z" value="a" active={false}>
          A body
        </TabPanel>
      </>,
    );
    expect(tab('Beta').getAttribute('aria-controls')).toBe('z-panel-b');
    expect(document.getElementById('z-panel-b')!.hidden).toBe(false);
    expect(document.getElementById('z-panel-a')!.hidden).toBe(true);
    expect(screen.getByText('B body')).toBeTruthy();
  });
});

describe('Tabs hideFrom / showFrom', () => {
  function stubMedia(matches: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }

  it('below the breakpoint the list renders and panels are tabpanels', () => {
    stubMedia(false);
    render(
      <Tabs label="S" value="a" items={ITEMS} hideFrom="lg">
        <TabPanel value="a" showFrom="lg">
          A
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.getByRole('tabpanel')).toBeTruthy();
  });

  it('from the breakpoint the list is gone and panels are plain regions that never hide', () => {
    stubMedia(true);
    render(
      <Tabs label="S" value="a" items={ITEMS} hideFrom="md">
        <TabPanel value="a" showFrom="md" className="c1">
          A
        </TabPanel>
        <TabPanel value="b" showFrom="md" data-x="y">
          B
        </TabPanel>
      </Tabs>,
    );
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.getByText('A').className).toBe('c1');
    expect(screen.getByText('B').getAttribute('data-x')).toBe('y');
    expect((screen.getByText('B') as HTMLElement).hidden).toBe(false);
  });

  it('without children, hideFrom removes the lone list', () => {
    stubMedia(true);
    render(<Tabs label="S" value="a" items={ITEMS} hideFrom="lg" />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('reacts to the media query changing', () => {
    let listener: () => void = () => {};
    let matches = false;
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_: string, l: () => void) => {
        listener = l;
      },
      removeEventListener: () => {},
    }));
    render(<Tabs label="S" value="a" items={ITEMS} hideFrom="md" />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    act(() => {
      matches = true;
      listener();
    });
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
