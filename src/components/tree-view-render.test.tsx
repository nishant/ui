import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeView } from './tree-view';
import { treeRowClass, type TreeNode } from './tree-view-classes';

vi.mock('./tree-view-classes', async (importOriginal) => {
  const m = await importOriginal<typeof import('./tree-view-classes')>();
  return { ...m, treeRowClass: vi.fn(m.treeRowClass) };
});

afterEach(() => {
  cleanup();
});

const ITEMS: TreeNode[] = [];
const PARENTS: string[] = [];
for (let i = 0; i < 20; i++) {
  const folders: TreeNode[] = [];
  for (let j = 0; j < 9; j++) {
    const leaves: TreeNode[] = [];
    for (let k = 0; k < 10; k++) leaves.push({ id: `r${i}-f${j}-l${k}`, label: `r${i}-f${j}-l${k}` });
    folders.push({ id: `r${i}-f${j}`, label: `r${i}-f${j}`, children: leaves });
    PARENTS.push(`r${i}-f${j}`);
  }
  ITEMS.push({ id: `r${i}`, label: `r${i}`, children: folders });
  PARENTS.push(`r${i}`);
}

const T = 30000;
const calls = () => vi.mocked(treeRowClass).mock.calls.length;
const row = (id: string) => document.querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)!;
const mount = () => render(<TreeView items={ITEMS} defaultExpanded={PARENTS} aria-label="Big" />);
const focus = (id: string) => act(() => row(id).focus());
const clear = () => vi.mocked(treeRowClass).mockClear();

describe('TreeView render counts on 2,000 open nodes', () => {
  it('mounts 2,000 rows', () => {
    clear();
    mount();
    expect(calls()).toBe(2000);
    expect(screen.getAllByRole('treeitem')).toHaveLength(2000);
  }, T);

  it('renders 2 rows per focus move', () => {
    mount();
    focus('r0');
    clear();
    fireEvent.keyDown(row('r0'), { key: 'ArrowDown' });
    expect(calls()).toBe(2);
    expect(document.activeElement).toBe(row('r0-f0'));
    let id = 'r0-f0';
    for (let n = 0; n < 5; n++) {
      clear();
      fireEvent.keyDown(row(id), { key: 'ArrowDown' });
      expect(calls()).toBe(2);
      id = document.activeElement!.getAttribute('data-id')!;
    }
  }, T);

  it('renders 1 row for Space on a focused leaf', () => {
    mount();
    focus('r0-f0-l0');
    clear();
    fireEvent.keyDown(row('r0-f0-l0'), { key: ' ' });
    expect(calls()).toBe(1);
  }, T);

  it('renders 2 rows when a click moves the selection', () => {
    mount();
    focus('r0-f0-l0');
    fireEvent.keyDown(row('r0-f0-l0'), { key: ' ' });
    clear();
    fireEvent.click(row('r1-f0-l0').firstElementChild!);
    expect(calls()).toBe(2);
  }, T);

  it('renders 1 row to collapse and 11 to expand a parent', () => {
    mount();
    focus('r0-f0');
    clear();
    fireEvent.keyDown(row('r0-f0'), { key: 'ArrowLeft' });
    expect(calls()).toBe(1);
    expect(screen.getAllByRole('treeitem')).toHaveLength(1990);
    clear();
    fireEvent.keyDown(row('r0-f0'), { key: 'ArrowRight' });
    expect(calls()).toBe(11);
    expect(screen.getAllByRole('treeitem')).toHaveLength(2000);
  }, T);
});
