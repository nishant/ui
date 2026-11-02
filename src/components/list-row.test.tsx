import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ListRow } from './data';

afterEach(cleanup);

describe('ListRow', () => {
  it('truncates the title by default and clamps to two lines on request', () => {
    render(
      <ul>
        <ListRow title="One" />
        <ListRow title="Two" titleLines={2} />
      </ul>,
    );
    expect(screen.getByText('One').className).toContain('truncate');
    expect(screen.getByText('Two').className).toContain('line-clamp-2');
  });
  it('lets the row shrink inside a grid', () => {
    render(<ul><ListRow title="X" /></ul>);
    expect(screen.getByText('X').closest('li')!.className).toContain('min-w-0');
  });
});
