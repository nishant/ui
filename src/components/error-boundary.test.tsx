import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './error-boundary';

let shouldThrow = true;
let thrown: Error = new Error('Boom');

function Bomb() {
  if (shouldThrow) throw thrown;
  return <p>All good</p>;
}

beforeEach(() => {
  shouldThrow = true;
  thrown = new Error('Boom');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AppErrorBoundary', () => {
  it('renders the default fallback and reports the error once', () => {
    const onError = vi.fn();
    render(
      <AppErrorBoundary onError={onError}>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Boom')).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBe(thrown);
  });

  it('Try again resets the boundary', () => {
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('resets when a resetKeys value changes', () => {
    function Harness() {
      const [path, setPath] = useState('/a');
      return (
        <>
          <button onClick={() => setPath('/b')}>go</button>
          <AppErrorBoundary resetKeys={[path]}>
            <Bomb />
          </AppErrorBoundary>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('alert')).toBeTruthy();
    shouldThrow = false;
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('shows the new-version copy for a chunk load error', () => {
    thrown = new Error('Failed to fetch dynamically imported module: /assets/x.js');
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('A new version is available')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeTruthy();
  });

  it('uses a custom fallback', () => {
    render(
      <AppErrorBoundary fallback={({ error }) => <p>custom {error.message}</p>}>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('custom Boom')).toBeTruthy();
  });
});
