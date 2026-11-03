import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Portal } from './portal';
import { NishProvider } from './provider';

afterEach(cleanup);

describe('Portal', () => {
  it('renders nothing on the server', () => {
    expect(renderToString(<Portal>hello</Portal>)).toBe('');
  });

  it('portals into document.body by default', () => {
    const { container } = render(
      <Portal>
        <b data-testid="x">hi</b>
      </Portal>,
    );
    expect(container.querySelector('[data-testid=x]')).toBeNull();
    expect(screen.getByTestId('x').parentElement).toBe(document.body);
  });

  it('uses the container prop first', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);
    render(
      <NishProvider portalContainer={a}>
        <Portal container={b}>
          <i data-testid="x" />
        </Portal>
      </NishProvider>,
    );
    expect(screen.getByTestId('x').parentElement).toBe(b);
    a.remove();
    b.remove();
  });

  it('uses the provider container when no prop is given', () => {
    const a = document.createElement('div');
    document.body.append(a);
    render(
      <NishProvider portalContainer={a}>
        <Portal>
          <i data-testid="x" />
        </Portal>
      </NishProvider>,
    );
    expect(screen.getByTestId('x').parentElement).toBe(a);
    a.remove();
  });

  it('renders into a detached container', () => {
    const detached = document.createElement('div');
    render(
      <Portal container={detached}>
        <i data-testid="x" />
      </Portal>,
    );
    expect(detached.querySelector('[data-testid=x]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=x]')).toBeNull();
  });
});
