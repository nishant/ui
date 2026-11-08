import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeView } from './tree-view';
import { duplicateIds, hasChildren, parentMap, treeRowClass, visibleNodes, type TreeNode } from './tree-view-classes';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ITEMS: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'components', label: 'components', children: [{ id: 'button', label: 'button.tsx', trailing: '2' }, { id: 'table', label: 'table.tsx' }] },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'site', label: 'site', children: [{ id: 'main', label: 'main.tsx' }] },
  { id: 'pkg', label: 'package.json' },
  { id: 'secret', label: 'secret.txt', disabled: true },
  { id: 'empty', label: 'empty', children: [] },
];

const item = (name: string) => screen.getByRole('treeitem', { name });
const key = (name: string, k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(item(name), { key: k, ...init });

describe('TreeView structure', () => {
  it('passes ref, className and rest to the ul', () => {
    const ref = createRef<HTMLUListElement>();
    render(<TreeView ref={ref} items={ITEMS} aria-label="Files" className="extra" data-x="1" />);
    const tree = screen.getByRole('tree', { name: 'Files' });
    expect(ref.current).toBe(tree);
    expect(tree.tagName).toBe('UL');
    expect(tree.className).toContain('extra');
    expect(tree.getAttribute('data-x')).toBe('1');
  });

  it('renders roles, levels, set sizes and expanded state', () => {
    render(<TreeView items={ITEMS} defaultExpanded={['src', 'components']} aria-label="Files" />);
    expect(screen.queryAllByRole('group')).toHaveLength(0);
    for (const li of screen.getAllByRole('treeitem')) expect(li.parentElement!.getAttribute('role')).toBe('tree');
    const src = item('src');
    expect(src.getAttribute('aria-level')).toBe('1');
    expect(src.getAttribute('aria-setsize')).toBe('5');
    expect(src.getAttribute('aria-posinset')).toBe('1');
    expect(src.getAttribute('aria-expanded')).toBe('true');
    expect(src.getAttribute('data-state')).toBe('open');
    expect(item('site').getAttribute('aria-expanded')).toBe('false');
    expect(item('site').getAttribute('data-state')).toBe('closed');
    const button = item('button.tsx');
    expect(button.getAttribute('aria-level')).toBe('3');
    expect(button.getAttribute('aria-setsize')).toBe('2');
    expect(button.getAttribute('aria-posinset')).toBe('1');
    expect(button.hasAttribute('aria-expanded')).toBe(false);
    expect(item('index.ts').getAttribute('aria-posinset')).toBe('2');
  });

  it('names each item by its label only, not its children', () => {
    render(<TreeView items={ITEMS} defaultExpanded={['src']} aria-label="Files" />);
    const src = item('src');
    const labelId = src.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)!.textContent).toBe('src');
    expect(screen.queryByRole('treeitem', { name: /components/ })?.getAttribute('aria-level')).toBe('2');
  });

  it('renders only open branches and treats an empty children array as a leaf', () => {
    render(<TreeView items={ITEMS} aria-label="Files" />);
    expect(screen.queryByText('components')).toBeNull();
    expect(item('empty').hasAttribute('aria-expanded')).toBe(false);
  });

  it('renders trailing content and deep nesting', () => {
    let node: TreeNode = { id: 'leaf', label: 'leaf' };
    for (let i = 10; i > 0; i--) node = { id: `n${i}`, label: `n${i}`, children: [node] };
    render(<TreeView items={[node]} defaultExpanded={Array.from({ length: 10 }, (_, i) => `n${i + 1}`)} aria-label="Deep" />);
    expect(item('leaf').getAttribute('aria-level')).toBe('11');
    cleanup();
    render(<TreeView items={ITEMS} defaultExpanded={['src', 'components']} aria-label="Files" />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders an empty tree with no tab stop', () => {
    render(<TreeView items={[]} aria-label="Nothing" />);
    expect(screen.getByRole('tree').children).toHaveLength(0);
  });

  it('has exactly one tab stop, the first node by default', () => {
    render(<TreeView items={ITEMS} defaultExpanded={['src']} aria-label="Files" />);
    const stops = screen.getAllByRole('treeitem').filter((li) => li.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(item('src'));
  });

  it('puts the tab stop on the selected node when focus is unset', () => {
    render(<TreeView items={ITEMS} defaultSelected="pkg" aria-label="Files" />);
    expect(item('package.json').getAttribute('tabindex')).toBe('0');
    expect(item('src').getAttribute('tabindex')).toBe('-1');
  });

  it('ignores a selected id that is not in the tree', () => {
    render(<TreeView items={ITEMS} defaultSelected="ghost" aria-label="Files" />);
    expect(item('src').getAttribute('tabindex')).toBe('0');
    expect(screen.getAllByRole('treeitem').every((li) => li.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('marks a disabled node', () => {
    render(<TreeView items={ITEMS} aria-label="Files" />);
    expect(item('secret.txt').getAttribute('aria-disabled')).toBe('true');
    expect(item('secret.txt').hasAttribute('data-disabled')).toBe(true);
  });
});

describe('TreeView keyboard', () => {
  function setup(extra: Partial<React.ComponentProps<typeof TreeView>> = {}) {
    const onActivate = vi.fn();
    const onSelectedChange = vi.fn();
    const onExpandedChange = vi.fn();
    render(<TreeView items={ITEMS} aria-label="Files" onActivate={onActivate} onSelectedChange={onSelectedChange} onExpandedChange={onExpandedChange} {...extra} />);
    return { onActivate, onSelectedChange, onExpandedChange };
  }

  it('moves with ArrowDown and ArrowUp and stops at the ends', () => {
    setup();
    item('src').focus();
    key('src', 'ArrowDown');
    expect(document.activeElement).toBe(item('site'));
    key('site', 'ArrowUp');
    expect(document.activeElement).toBe(item('src'));
    key('src', 'ArrowUp');
    expect(document.activeElement).toBe(item('src'));
    key('src', 'End');
    expect(document.activeElement).toBe(item('empty'));
    key('empty', 'ArrowDown');
    expect(document.activeElement).toBe(item('empty'));
    key('empty', 'Home');
    expect(document.activeElement).toBe(item('src'));
  });

  it('ArrowRight opens a closed parent, then enters it; ArrowLeft closes, then goes to the parent', () => {
    const { onExpandedChange } = setup();
    item('src').focus();
    key('src', 'ArrowRight');
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
    key('src', 'ArrowRight');
    expect(document.activeElement).toBe(item('components'));
    key('components', 'ArrowRight');
    key('components', 'ArrowRight');
    expect(document.activeElement).toBe(item('button.tsx'));
    key('button.tsx', 'ArrowRight');
    expect(document.activeElement).toBe(item('button.tsx'));
    key('button.tsx', 'ArrowLeft');
    expect(document.activeElement).toBe(item('components'));
    key('components', 'ArrowLeft');
    expect(item('components').getAttribute('aria-expanded')).toBe('false');
    key('components', 'ArrowLeft');
    expect(document.activeElement).toBe(item('src'));
    key('src', 'ArrowLeft');
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    key('src', 'ArrowLeft');
    expect(document.activeElement).toBe(item('src'));
  });

  it('Enter selects, activates and toggles; Space only selects', () => {
    const { onActivate, onSelectedChange } = setup();
    item('src').focus();
    key('src', 'Enter');
    expect(onSelectedChange).toHaveBeenCalledWith('src', expect.objectContaining({ id: 'src' }));
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'src' }));
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(item('src').getAttribute('aria-selected')).toBe('true');
    key('site', ' ');
    expect(onSelectedChange).toHaveBeenLastCalledWith('site', expect.objectContaining({ id: 'site' }));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(item('site').getAttribute('aria-expanded')).toBe('false');
    expect(item('site').getAttribute('aria-selected')).toBe('true');
    expect(item('src').getAttribute('aria-selected')).toBe('false');
  });

  it('Enter does not toggle with toggleOnSelect={false}', () => {
    setup({ toggleOnSelect: false });
    item('src').focus();
    key('src', 'Enter');
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    key('src', 'ArrowRight');
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
  });

  it('* opens every sibling that has children', () => {
    const { onExpandedChange } = setup();
    item('src').focus();
    key('src', '*');
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(item('site').getAttribute('aria-expanded')).toBe('true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['src', 'site']);
    key('src', '*');
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
  });

  it('typing a letter jumps to the next label that starts with it, wrapping', () => {
    setup();
    item('src').focus();
    key('src', 's');
    expect(document.activeElement).toBe(item('site'));
    key('site', 'S');
    expect(document.activeElement).toBe(item('secret.txt'));
    key('secret.txt', 's');
    expect(document.activeElement).toBe(item('src'));
    key('src', 'p');
    expect(document.activeElement).toBe(item('package.json'));
    key('package.json', 'z');
    expect(document.activeElement).toBe(item('package.json'));
  });

  it('ignores modified keys and keys it does not handle', () => {
    setup();
    item('src').focus();
    const notPrevented = fireEvent.keyDown(item('src'), { key: 's', ctrlKey: true });
    expect(notPrevented).toBe(true);
    expect(document.activeElement).toBe(item('src'));
    expect(fireEvent.keyDown(item('src'), { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(item('src'), { key: 'ArrowDown' })).toBe(false);
  });

  it('swaps the horizontal arrows in right-to-left layouts', () => {
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) =>
      el.getAttribute('role') === 'tree' ? ({ direction: 'rtl' } as CSSStyleDeclaration) : real(el, pseudo),
    );
    setup();
    item('src').focus();
    key('src', 'ArrowRight');
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    key('src', 'ArrowLeft');
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    key('src', 'ArrowLeft');
    expect(document.activeElement).toBe(item('components'));
    key('components', 'ArrowRight');
    expect(document.activeElement).toBe(item('src'));
  });

  it('ignores keys from elements that are not tree items', () => {
    render(
      <TreeView items={ITEMS} aria-label="Files" />,
    );
    const tree = screen.getByRole('tree');
    expect(fireEvent.keyDown(tree, { key: 'ArrowDown' })).toBe(true);
  });

  it('calls the consumer onKeyDown first and respects preventDefault', () => {
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault());
    render(<TreeView items={ITEMS} aria-label="Files" onKeyDown={onKeyDown} />);
    item('src').focus();
    key('src', 'ArrowRight');
    expect(onKeyDown).toHaveBeenCalled();
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('TreeView pointer', () => {
  it('a row click focuses, selects, activates and toggles', () => {
    const onActivate = vi.fn();
    const onSelectedChange = vi.fn();
    render(<TreeView items={ITEMS} aria-label="Files" onActivate={onActivate} onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByText('src'));
    expect(document.activeElement).toBe(item('src'));
    expect(item('src').getAttribute('aria-selected')).toBe('true');
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('src'));
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
  });

  it('a chevron click only toggles', () => {
    const onActivate = vi.fn();
    const onSelectedChange = vi.fn();
    render(<TreeView items={ITEMS} aria-label="Files" onActivate={onActivate} onSelectedChange={onSelectedChange} />);
    const toggle = item('src').querySelector('[data-tree-toggle]')!;
    fireEvent.click(toggle);
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(onActivate).not.toHaveBeenCalled();
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(item('src'));
    expect(item('src').getAttribute('aria-selected')).toBe('false');
  });

  it('toggleOnSelect={false} leaves the branch alone on a row click', () => {
    render(<TreeView items={ITEMS} aria-label="Files" toggleOnSelect={false} />);
    fireEvent.click(screen.getByText('src'));
    expect(item('src').getAttribute('aria-selected')).toBe('true');
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(item('src').querySelector('[data-tree-toggle]')!);
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
  });

  it('selectable={false} renders no aria-selected and still activates', () => {
    const onActivate = vi.fn();
    const onSelectedChange = vi.fn();
    render(<TreeView items={ITEMS} aria-label="Files" selectable={false} onActivate={onActivate} onSelectedChange={onSelectedChange} />);
    expect(screen.getAllByRole('treeitem').every((li) => !li.hasAttribute('aria-selected'))).toBe(true);
    fireEvent.click(screen.getByText('package.json'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).not.toHaveBeenCalled();
    key('package.json', ' ');
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('a disabled node takes focus but cannot be selected or activated', () => {
    const onActivate = vi.fn();
    const onSelectedChange = vi.fn();
    render(<TreeView items={ITEMS} aria-label="Files" onActivate={onActivate} onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByText('secret.txt'));
    expect(document.activeElement).toBe(item('secret.txt'));
    key('secret.txt', 'Enter');
    key('secret.txt', ' ');
    expect(onActivate).not.toHaveBeenCalled();
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(item('secret.txt').getAttribute('aria-selected')).toBe('false');
  });

  it('a disabled parent can still be opened', () => {
    const items: TreeNode[] = [{ id: 'd', label: 'Locked', disabled: true, children: [{ id: 'c', label: 'Child' }] }];
    render(<TreeView items={items} aria-label="Locked" />);
    fireEvent.click(item('Locked').querySelector('[data-tree-toggle]')!);
    expect(item('Locked').getAttribute('aria-expanded')).toBe('true');
  });
});

describe('TreeView state', () => {
  it('controlled expanded follows the prop and reports changes', () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(<TreeView items={ITEMS} aria-label="Files" expanded={['src']} onExpandedChange={onExpandedChange} />);
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(item('site').querySelector('[data-tree-toggle]')!);
    expect(onExpandedChange).toHaveBeenCalledWith(['src', 'site']);
    expect(item('site').getAttribute('aria-expanded')).toBe('false');
    rerender(<TreeView items={ITEMS} aria-label="Files" expanded={['src', 'site']} onExpandedChange={onExpandedChange} />);
    expect(item('site').getAttribute('aria-expanded')).toBe('true');
  });

  it('controlled expanded without onExpandedChange does nothing and does not crash', () => {
    render(<TreeView items={ITEMS} aria-label="Files" expanded={[]} />);
    item('src').focus();
    key('src', 'ArrowRight');
    fireEvent.click(screen.getByText('src'));
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
  });

  it('controlled selected follows the prop; null selects nothing', () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(<TreeView items={ITEMS} aria-label="Files" selected="pkg" onSelectedChange={onSelectedChange} />);
    expect(item('package.json').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByText('site'));
    expect(onSelectedChange).toHaveBeenCalledWith('site', expect.objectContaining({ id: 'site' }));
    expect(item('package.json').getAttribute('aria-selected')).toBe('true');
    expect(item('site').getAttribute('aria-selected')).toBe('false');
    rerender(<TreeView items={ITEMS} aria-label="Files" selected={null} onSelectedChange={onSelectedChange} />);
    expect(item('package.json').getAttribute('aria-selected')).toBe('false');
  });

  it('uncontrolled defaults apply on mount', () => {
    render(<TreeView items={ITEMS} aria-label="Files" defaultExpanded={['site']} defaultSelected="main" />);
    expect(item('main.tsx').getAttribute('aria-selected')).toBe('true');
  });

  it('works inside a stateful parent', () => {
    function Host() {
      const [sel, setSel] = useState<string | null>(null);
      return (
        <>
          <TreeView items={ITEMS} aria-label="Files" selected={sel} onSelectedChange={(id) => setSel(id)} />
          <output>{sel ?? 'none'}</output>
        </>
      );
    }
    render(<Host />);
    fireEvent.click(screen.getByText('package.json'));
    expect(screen.getByRole('status').textContent).toBe('pkg');
  });
});

describe('TreeView focus', () => {
  it('moves focus to the parent when the focused branch collapses away', () => {
    const { rerender } = render(<TreeView items={ITEMS} aria-label="Files" expanded={['src']} />);
    item('index.ts').focus();
    expect(document.activeElement).toBe(item('index.ts'));
    rerender(<TreeView items={ITEMS} aria-label="Files" expanded={[]} />);
    expect(document.activeElement).toBe(item('src'));
    expect(item('src').getAttribute('tabindex')).toBe('0');
  });

  it('falls back when the focused node is removed from items', () => {
    const { rerender } = render(<TreeView items={ITEMS} aria-label="Files" />);
    item('package.json').focus();
    rerender(<TreeView items={ITEMS.filter((n) => n.id !== 'pkg')} aria-label="Files" />);
    expect(item('src').getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(item('src'));
  });

  it('does not steal focus when focus left the tree', () => {
    const { rerender } = render(
      <>
        <button>outside</button>
        <TreeView items={ITEMS} aria-label="Files" expanded={['src']} />
      </>,
    );
    item('index.ts').focus();
    screen.getByText('outside').focus();
    rerender(
      <>
        <button>outside</button>
        <TreeView items={ITEMS} aria-label="Files" expanded={[]} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByText('outside'));
  });
});

describe('TreeView warnings', () => {
  it('warns once about duplicate ids and a missing label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <TreeView
        items={[
          { id: 'a', label: 'A' },
          { id: 'a', label: 'B' },
        ]}
      />,
    );
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages).toContain('nish-ui: TreeView: node ids must be unique; "a" appears more than once.');
    expect(messages).toContain('nish-ui: TreeView: give the tree an aria-label or aria-labelledby.');
  });
});

describe('tree-view-classes', () => {
  it('visibleNodes lists open branches with level and position', () => {
    const flat = visibleNodes(ITEMS, new Set(['src', 'components']));
    expect(flat.map((f) => f.node.id)).toEqual(['src', 'components', 'button', 'table', 'index', 'site', 'pkg', 'secret', 'empty']);
    expect(flat[2]).toMatchObject({ level: 3, parentId: 'components', posInSet: 1, setSize: 2 });
    expect(flat[0]).toMatchObject({ level: 1, parentId: null, posInSet: 1, setSize: 5 });
    expect(visibleNodes(ITEMS, new Set()).map((f) => f.node.id)).toEqual(['src', 'site', 'pkg', 'secret', 'empty']);
    expect(visibleNodes(ITEMS, new Set(['empty'])).map((f) => f.node.id)).toHaveLength(5);
    expect(visibleNodes([], new Set())).toEqual([]);
  });

  it('parentMap maps every node to its parent', () => {
    const map = parentMap(ITEMS);
    expect(map.get('src')).toBeNull();
    expect(map.get('button')).toBe('components');
    expect(map.get('main')).toBe('site');
    expect(map.size).toBe(10);
  });

  it('duplicateIds returns repeated ids once, in first-seen order', () => {
    const items: TreeNode[] = [
      { id: 'a', label: 'a', children: [{ id: 'b', label: 'b' }, { id: 'a', label: 'a2' }] },
      { id: 'b', label: 'b2' },
      { id: 'b', label: 'b3' },
    ];
    expect(duplicateIds(items)).toEqual(['a', 'b']);
    expect(duplicateIds(ITEMS)).toEqual([]);
  });

  it('hasChildren is false for undefined and empty children', () => {
    expect(hasChildren({ id: 'x', label: 'x' })).toBe(false);
    expect(hasChildren({ id: 'x', label: 'x', children: [] })).toBe(false);
    expect(hasChildren({ id: 'x', label: 'x', children: [{ id: 'y', label: 'y' }] })).toBe(true);
  });

  it('treeRowClass covers selected, disabled and plain rows', () => {
    expect(treeRowClass({ selected: true, className: 'mine' })).toContain('bg-th-accent-soft');
    expect(treeRowClass({ selected: true })).toContain('forced-colors:bg-[Highlight]');
    expect(treeRowClass({})).toContain('hover:bg-th-overlay');
    const disabled = treeRowClass({ disabled: true });
    expect(disabled).toContain('text-th-ghost');
    expect(disabled).not.toContain('hover:bg-th-overlay');
    expect(treeRowClass({ className: 'mine' })).toContain('mine');
  });
});
