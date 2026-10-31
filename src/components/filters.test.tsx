import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, FilterSheet } from './filters';

function stubWidth(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const matches = (max ? width <= Number(max[1]) : true) && (min ? width >= Number(min[1]) : true);
    return { matches, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const controls = <button type="button">Open only</button>;

describe('FilterBar', () => {
  describe('below md', () => {
    beforeEach(() => stubWidth(360));

    it('shows a Filters button with the count and hides the children', () => {
      render(
        <FilterBar search={{ value: '', onChange() {}, label: 'Search jobs' }} activeCount={2}>
          {controls}
        </FilterBar>,
      );
      const btn = screen.getByRole('button', { name: /Filters/ });
      expect(btn.textContent).toContain('2');
      expect(screen.queryByText('Open only')).toBeNull();
      expect(screen.getByLabelText('Search jobs')).toBeTruthy();
    });

    it('omits the count at zero and keeps trailing visible', () => {
      render(
        <FilterBar trailing={<span>Sort</span>} activeCount={0}>
          {controls}
        </FilterBar>,
      );
      expect(screen.getByRole('button', { name: 'Filters' }).textContent).toBe('Filters');
      expect(screen.getByText('Sort')).toBeTruthy();
    });

    it('opens the sheet with the children, Clear and Done', () => {
      const onClear = vi.fn();
      render(
        <FilterBar activeCount={1} onClear={onClear} sheetTitle="Job filters">
          {controls}
        </FilterBar>,
      );
      fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Job filters')).toBeTruthy();
      expect(screen.getByText('Open only')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(onClear).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    });

    it('uses the sheet below lg when sheetBelow is lg', () => {
      stubWidth(900);
      render(<FilterBar sheetBelow="lg">{controls}</FilterBar>);
      expect(screen.getByRole('button', { name: 'Filters' })).toBeTruthy();
      expect(screen.queryByText('Open only')).toBeNull();
    });
  });

  describe('from md', () => {
    beforeEach(() => stubWidth(1024));

    it('renders children inline with no Filters button', () => {
      render(<FilterBar search={{ value: '', onChange() {} }}>{controls}</FilterBar>);
      expect(screen.getByText('Open only')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /^Filters/ })).toBeNull();
    });

    it('shows Clear filters only with active filters and a handler', () => {
      const onClear = vi.fn();
      const { rerender } = render(
        <FilterBar activeCount={0} onClear={onClear}>
          {controls}
        </FilterBar>,
      );
      expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
      rerender(
        <FilterBar activeCount={2} onClear={onClear}>
          {controls}
        </FilterBar>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('renders the summary as a polite live region and sticky classes', () => {
      const { container } = render(
        <FilterBar sticky summary="42 jobs">
          {controls}
        </FilterBar>,
      );
      expect(screen.getByText('42 jobs').getAttribute('aria-live')).toBe('polite');
      expect((container.firstElementChild as HTMLElement).className).toContain('sticky');
    });
  });
});

describe('FilterSheet', () => {
  beforeEach(() => stubWidth(360));

  it('renders nothing when closed', () => {
    render(
      <FilterSheet open={false} onClose={() => {}}>
        body
      </FilterSheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uses the result label and closes from the primary button', () => {
    const onClose = vi.fn();
    render(
      <FilterSheet open onClose={onClose} resultLabel="Show 42 results">
        body
      </FilterSheet>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show 42 results' }));
    expect(onClose).toHaveBeenCalled();
  });
});
