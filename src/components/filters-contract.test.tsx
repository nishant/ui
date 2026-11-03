import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, FilterSheet } from './filters';
import { NishProvider } from './provider';

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

const FR = {
  filters: 'Filtres',
  clear: 'Effacer',
  done: 'Terminé',
  clearFilters: 'Effacer les filtres',
  search: 'Rechercher',
  activeCount: (n: number) => `${n} actifs`,
};

describe('FilterBar root element', () => {
  it('puts ref, className, id and rest props on the root and merges sticky classes', () => {
    stubWidth(1200);
    const ref = { current: null as HTMLDivElement | null };
    render(
      <FilterBar ref={ref} sticky className="mine" id="bar" data-testid="bar" aria-label="Job filters">
        {controls}
      </FilterBar>,
    );
    const root = screen.getByTestId('bar');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('bar');
    expect(root.getAttribute('aria-label')).toBe('Job filters');
    expect(root.className).toContain('mine');
    expect(root.className).toContain('sticky');
    expect(root.className).toContain('--nish-z-sticky');
  });

  it('is not sticky by default', () => {
    stubWidth(1200);
    render(<FilterBar data-testid="bar">{controls}</FilterBar>);
    expect(screen.getByTestId('bar').className).not.toContain('sticky');
  });

  it('shows the summary in a polite live region', () => {
    stubWidth(1200);
    const { container } = render(<FilterBar summary="42 jobs">{controls}</FilterBar>);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe('42 jobs');
  });
});

describe('FilterBar at desktop width', () => {
  it('shows the controls inline, no Filters button, and Clear filters only with activeCount and onClear', () => {
    stubWidth(1200);
    const onClear = vi.fn();
    const { rerender } = render(
      <FilterBar activeCount={0} onClear={onClear}>
        {controls}
      </FilterBar>,
    );
    expect(screen.getByText('Open only')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Filters/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    rerender(
      <FilterBar activeCount={2} onClear={onClear}>
        {controls}
      </FilterBar>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(<FilterBar activeCount={2}>{controls}</FilterBar>);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('the search box is named by label, then placeholder, then the search string', () => {
    stubWidth(1200);
    const { rerender } = render(<FilterBar search={{ value: '', onChange() {}, label: 'Find jobs', placeholder: 'Type…' }} />);
    expect(screen.getByLabelText('Find jobs')).toBeTruthy();
    rerender(<FilterBar search={{ value: '', onChange() {}, placeholder: 'Type…' }} />);
    expect(screen.getByLabelText('Type…')).toBeTruthy();
    rerender(<FilterBar search={{ value: '', onChange() {} }} />);
    expect(screen.getByLabelText('Search')).toBeTruthy();
  });

  it('the search box reports typing', () => {
    stubWidth(1200);
    const onChange = vi.fn();
    render(<FilterBar search={{ value: '', onChange, label: 'Find' }} />);
    fireEvent.change(screen.getByLabelText('Find'), { target: { value: 'rust' } });
    expect(onChange).toHaveBeenCalledWith('rust');
  });

  it('trailing sits at the end of the row', () => {
    stubWidth(1200);
    render(<FilterBar trailing={<span>Sort</span>}>{controls}</FilterBar>);
    expect(screen.getByText('Sort').parentElement!.className).toContain('ms-auto');
  });

  it('sheetBelow lg moves the controls into the sheet at 900px', () => {
    stubWidth(900);
    render(<FilterBar sheetBelow="lg">{controls}</FilterBar>);
    expect(screen.queryByText('Open only')).toBeNull();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeTruthy();
  });

  it('no Filters button when there is nothing to filter, even on a phone', () => {
    stubWidth(360);
    render(<FilterBar trailing={<span>Sort</span>}>{false}</FilterBar>);
    expect(screen.queryByRole('button', { name: /Filters/ })).toBeNull();
    expect(screen.getByText('Sort')).toBeTruthy();
  });
});

describe('FilterBar on a phone', () => {
  it('the Filters button says it opens a dialog and tracks whether it is open', () => {
    stubWidth(360);
    render(<FilterBar>{controls}</FilterBar>);
    const btn = screen.getByRole('button', { name: 'Filters' });
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('the count badge has its own accessible text', () => {
    stubWidth(360);
    render(<FilterBar activeCount={3}>{controls}</FilterBar>);
    expect(screen.getByLabelText('3 active').textContent).toBe('3');
  });

  it('every text comes from the provider', () => {
    stubWidth(360);
    render(
      <NishProvider strings={FR}>
        <FilterBar activeCount={3} onClear={() => undefined} search={{ value: '', onChange() {} }}>
          {controls}
        </FilterBar>
      </NishProvider>,
    );
    expect(screen.getByLabelText('Rechercher')).toBeTruthy();
    expect(screen.getByLabelText('3 actifs')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Filtres/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Filtres');
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Terminé' })).toBeTruthy();
  });

  it('desktop Clear filters comes from the provider', () => {
    stubWidth(1200);
    render(
      <NishProvider strings={FR}>
        <FilterBar activeCount={1} onClear={() => undefined}>
          {controls}
        </FilterBar>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Effacer les filtres' })).toBeTruthy();
  });

  it('sheetTitle wins over the provider', () => {
    stubWidth(360);
    render(
      <NishProvider strings={FR}>
        <FilterBar sheetTitle="Mes filtres">{controls}</FilterBar>
      </NishProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtres/ }));
    expect(screen.getByRole('dialog').textContent).toContain('Mes filtres');
  });
});

describe('FilterSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <FilterSheet open={false} onClose={() => undefined}>
        {controls}
      </FilterSheet>,
    );
    expect(container.textContent).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Clear is disabled at activeCount 0 and enabled above; there is no Clear without onClear', () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <FilterSheet open onClose={() => undefined} onClear={onClear} activeCount={0}>
        {controls}
      </FilterSheet>,
    );
    expect((screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement).disabled).toBe(true);
    rerender(
      <FilterSheet open onClose={() => undefined} onClear={onClear} activeCount={1}>
        {controls}
      </FilterSheet>,
    );
    expect((screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement).disabled).toBe(false);
    rerender(
      <FilterSheet open onClose={() => undefined}>
        {controls}
      </FilterSheet>,
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('the primary button closes and takes resultLabel', () => {
    const onClose = vi.fn();
    render(
      <FilterSheet open onClose={onClose} resultLabel="Show 42 results">
        {controls}
      </FilterSheet>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show 42 results' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
