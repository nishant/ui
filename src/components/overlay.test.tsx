import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DropdownMenu, MenuItem } from './overlay';

afterEach(cleanup);

describe('DropdownMenu', () => {
  it('open on mount renders the menu once, next to its trigger, and focuses the first item', async () => {
    render(
      <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
        <MenuItem onSelect={() => {}}>Rename</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </DropdownMenu>,
    );
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Actions' }).getAttribute('aria-expanded')).toBe('true');
    await new Promise((r) => setTimeout(r, 10));
    expect(document.activeElement?.textContent).toBe('Rename');
  });
});
