import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './error-boundary';
import { NishProvider } from './provider';

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

  it('shows the message and stack outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    thrown.stack = 'Error: Boom\n    at Bomb (bomb.tsx:1:1)';
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Boom')).toBeTruthy();
    expect(screen.getByText('Details')).toBeTruthy();
    expect(screen.getByText(/at Bomb/)).toBeTruthy();
    vi.unstubAllEnvs();
  });

  it('hides the message and stack in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    thrown = new Error('secret internal detail');
    thrown.stack = 'Error: secret internal detail\n    at Secret (secret.tsx:1:1)';
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('An unexpected error occurred.')).toBeTruthy();
    expect(screen.queryByText(/secret internal detail/)).toBeNull();
    expect(screen.queryByText('Details')).toBeNull();
    expect(screen.queryByText(/at Secret/)).toBeNull();
    vi.unstubAllEnvs();
  });

  it('showDetails shows them in production, and showDetails={false} hides them in development', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { unmount } = render(
      <AppErrorBoundary showDetails>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('Boom')).toBeTruthy();
    unmount();
    vi.stubEnv('NODE_ENV', 'development');
    render(
      <AppErrorBoundary showDetails={false}>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.queryByText('Boom')).toBeNull();
    vi.unstubAllEnvs();
  });

  it('shows the generic body for an error with an empty message in development', () => {
    thrown = new Error('');
    render(
      <AppErrorBoundary showDetails>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('An unexpected error occurred.')).toBeTruthy();
  });

  it('truncates a very long message to 300 characters', () => {
    thrown = new Error('x'.repeat(400));
    render(
      <AppErrorBoundary showDetails>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('x'.repeat(300) + '…')).toBeTruthy();
  });

  it('chunk errors offer only Reload page and never show the message', () => {
    thrown = new Error('Importing a module script failed.');
    render(
      <AppErrorBoundary showDetails>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByText('Reload the page to get the latest version.')).toBeTruthy();
  });

  it('a ChunkLoadError by name counts as a stale version', () => {
    thrown = new Error('x');
    thrown.name = 'ChunkLoadError';
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('A new version is available')).toBeTruthy();
  });

  it('Reload page calls location.reload', () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('wraps a thrown non-Error value', () => {
    function Throws(): never {
      throw 'plain string';
    }
    const onError = vi.fn();
    render(
      <AppErrorBoundary onError={onError} showDetails>
        <Throws />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('plain string')).toBeTruthy();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('does not reset when resetKeys stay equal, and reports componentStack to onError', () => {
    const onError = vi.fn();
    const { rerender } = render(
      <AppErrorBoundary resetKeys={['a']} onError={onError}>
        <Bomb />
      </AppErrorBoundary>,
    );
    shouldThrow = false;
    rerender(
      <AppErrorBoundary resetKeys={['a']} onError={onError}>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(typeof onError.mock.calls[0][1].componentStack).toBe('string');
    rerender(
      <AppErrorBoundary resetKeys={['a', 'b']} onError={onError}>
        <Bomb />
      </AppErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('takes its words from a provider', () => {
    render(
      <NishProvider strings={{ errorTitle: 'Oups', errorTryAgain: 'Encore', errorReload: 'Recharger' }}>
        <AppErrorBoundary>
          <Bomb />
        </AppErrorBoundary>
      </NishProvider>,
    );
    expect(screen.getByText('Oups')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Encore' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeTruthy();
  });

  it('a custom fallback gets reset', () => {
    render(
      <AppErrorBoundary fallback={({ reset }) => <button onClick={reset}>again</button>}>
        <Bomb />
      </AppErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByText('again'));
    expect(screen.getByText('All good')).toBeTruthy();
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
