import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
  SkeletonLines,
  SkeletonRows,
  Spinner,
  StatGridSkeleton,
} from './feedback';
import { NishProvider } from './provider';

afterEach(cleanup);

describe('Skeleton', () => {
  it('is a decorative block that takes ref, className, style and rest', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Skeleton ref={ref} className="h-4 w-8" style={{ height: 12 }} data-x="1" id="sk" />);
    const el = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(el);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('nish-skeleton');
    expect(el.className).toContain('h-4 w-8');
    expect(el.style.height).toBe('12px');
    expect(el.getAttribute('data-x')).toBe('1');
    expect(el.id).toBe('sk');
  });
});

describe('loading regions announce through hidden text inside role=status', () => {
  it('SkeletonRows: label is sr-only text in the status region, not an aria-label', () => {
    const ref = createRef<HTMLDivElement>();
    render(<SkeletonRows ref={ref} rows={3} label="Loading jobs" data-x="r" />);
    const region = screen.getByRole('status');
    expect(ref.current).toBe(region);
    expect(region.getAttribute('aria-label')).toBeNull();
    expect(region.getAttribute('data-x')).toBe('r');
    const text = screen.getByText('Loading jobs');
    expect(text.className).toContain('sr-only');
    expect(region.contains(text)).toBe(true);
    expect(region.querySelectorAll('.nish-skeleton')).toHaveLength(3);
  });

  it('SkeletonRows: default label, height, gap and className', () => {
    const { container } = render(<SkeletonRows rows={2} height={40} gap="sm" className="p-2" />);
    const region = screen.getByRole('status');
    expect(screen.getByText('Loading').className).toContain('sr-only');
    expect(region.className).toContain('gap-1.5');
    expect(region.className).toContain('p-2');
    const rows = container.querySelectorAll<HTMLElement>('.nish-skeleton');
    expect(rows[0].style.height).toBe('40px');
    expect(rows[0].className).toContain('rounded-xl');
  });

  it('SkeletonRows: md gap by default, and an h- rowClassName replaces the inline height', () => {
    const { container } = render(<SkeletonRows rows={1} rowClassName="h-16 rounded-lg" />);
    expect(screen.getByRole('status').className).toContain('gap-2.5');
    const row = container.querySelector<HTMLElement>('.nish-skeleton')!;
    expect(row.style.height).toBe('');
    expect(row.className).toContain('h-16');
  });

  it('SkeletonRows: a rowClassName without h- keeps the inline height', () => {
    const { container } = render(<SkeletonRows rows={1} rowClassName="rounded-lg" height="3rem" />);
    expect(container.querySelector<HTMLElement>('.nish-skeleton')!.style.height).toBe('3rem');
  });

  it('SkeletonLines has the status role and no aria-label or aria-busy', () => {
    render(<SkeletonLines lines={2} label="Loading card" />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-label')).toBeNull();
    expect(region.getAttribute('aria-busy')).toBeNull();
    expect(region.textContent).toBe('Loading card');
    expect(region.querySelectorAll('.nish-skeleton')).toHaveLength(3);
  });

  it('StatGridSkeleton and CardListSkeleton announce once each', () => {
    render(
      <>
        <StatGridSkeleton count={3} label="Loading stats" />
        <CardListSkeleton count={2} label="Loading cards" />
      </>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('Loading stats').className).toContain('sr-only');
    expect(screen.getByText('Loading cards').className).toContain('sr-only');
  });

  it('presets default to the provider loading string', () => {
    render(
      <NishProvider strings={{ loading: 'Chargement' }}>
        <StatGridSkeleton />
        <CardListSkeleton />
        <SkeletonLines />
        <SkeletonRows />
      </NishProvider>,
    );
    expect(screen.getAllByText('Chargement')).toHaveLength(4);
  });

  it('SkeletonCard is decorative and honors media', () => {
    const { container, rerender } = render(<SkeletonCard media="square" lines={2} />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.size-24')).not.toBeNull();
    rerender(<SkeletonCard media="wide" />);
    expect(container.querySelector('.aspect-video')).not.toBeNull();
    rerender(<SkeletonCard />);
    expect(container.querySelector('.aspect-video')).toBeNull();
    expect(container.querySelector('.size-24')).toBeNull();
  });

  it('CardListSkeleton renders count cards with the given lines', () => {
    const { container } = render(<CardListSkeleton count={2} lines={1} />);
    // Per card: a title bar and one line.
    expect(container.querySelectorAll('.nish-skeleton')).toHaveLength(4);
  });
});

describe('Spinner', () => {
  it('without a label is decorative', () => {
    const { container } = render(<Spinner />);
    expect(screen.queryByRole('status')).toBeNull();
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });

  it('with a label is a status region with the label as hidden text', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} label="Loading jobs" className="text-th-accent" data-x="s" />);
    const region = screen.getByRole('status');
    expect(ref.current).toBe(region);
    expect(region.className).toContain('text-th-accent');
    expect(region.getAttribute('data-x')).toBe('s');
    expect(screen.getByText('Loading jobs').className).toContain('sr-only');
    expect(region.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('size maps to pixels', () => {
    const { container, rerender } = render(<Spinner size="xs" />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('12');
    rerender(<Spinner size="sm" />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('14');
    rerender(<Spinner />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('16');
    rerender(<Spinner size="lg" />);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('24');
  });
});

describe('EmptyState', () => {
  it('shows title, detail, action and icon; takes ref and rest', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <EmptyState ref={ref} icon={<svg data-testid="ic" />} title="No drops" detail="Add a tracker" action={<button>Add</button>} data-x="e" className="mt-2" />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(screen.getByText('No drops')).toBeTruthy();
    expect(screen.getByText('Add a tracker')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
    expect(screen.getByTestId('ic')).toBeTruthy();
    expect(ref.current!.getAttribute('data-x')).toBe('e');
    expect(ref.current!.className).toContain('border-dashed');
    expect(ref.current!.className).toContain('mt-2');
  });

  it('compact drops the dashed box and uses the small title', () => {
    const { container } = render(<EmptyState title="Nothing" compact />);
    expect((container.firstElementChild as HTMLElement).className).not.toContain('border-dashed');
    expect(screen.getByText('Nothing').className).toContain('text-xs');
  });

  it('omits optional parts', () => {
    const { container } = render(<EmptyState title="Nothing" />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(screen.getByText('Nothing').className).toContain('text-sm');
  });
});

describe('ErrorState', () => {
  it('is an alert with the default message and no Retry without onRetry', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ErrorState ref={ref} data-x="x" />);
    const el = screen.getByRole('alert');
    expect(ref.current).toBe(el);
    expect(el.getAttribute('data-x')).toBe('x');
    expect(screen.getByText('Failed to load')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Retry calls onRetry and is aria-disabled while retrying', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState message="Boom" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<ErrorState message="Boom" onRetry={onRetry} retrying />);
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('Retry keeps focus while retrying', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState onRetry={onRetry} />);
    screen.getByRole('button', { name: 'Retry' }).focus();
    rerender(<ErrorState onRetry={onRetry} retrying />);
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(document.activeElement).toBe(retry);
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(retry);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('message and retry text come from the provider; props win', () => {
    const { rerender } = render(
      <NishProvider strings={{ failedToLoad: 'Echec', retry: 'Reessayer' }}>
        <ErrorState onRetry={() => {}} />
      </NishProvider>,
    );
    expect(screen.getByText('Echec')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reessayer' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ failedToLoad: 'Echec', retry: 'Reessayer' }}>
        <ErrorState message="Custom" retryLabel="Again" onRetry={() => {}} />
      </NishProvider>,
    );
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Again' })).toBeTruthy();
  });

  it('compact uses the small text', () => {
    render(<ErrorState message="Boom" compact />);
    expect(screen.getByText('Boom').className).toContain('text-xs');
  });
});
