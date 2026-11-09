import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { focusables } from './overlay-core';
import { Tooltip } from './tooltip';

afterEach(cleanup);

function visible(root: HTMLElement) {
  // jsdom has no layout: make every element count as rendered.
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });
  return root;
}

describe('focusables', () => {
  it('skips tabindex -1, inert content and extra radios of a group', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<button id="a">a</button><button id="b" tabindex="-1">b</button>' +
      '<div inert><button id="c">c</button></div>' +
      '<input type="radio" name="g" id="r1"><input type="radio" name="g" id="r2" checked>' +
      '<input type="radio" name="h" id="s1"><input type="radio" name="h" id="s2">';
    document.body.appendChild(root);
    visible(root);
    expect(focusables(root).map((n) => n.id)).toEqual(['a', 'r2', 's1']);
    root.remove();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
  });
});

describe('Tooltip aria-describedby', () => {
  it('keeps the focusable wrapper when the focusable control is only a descendant', () => {
    render(
      <Tooltip tip="More" data-testid="t">
        <div>
          Total <a href="/x">details</a>
        </div>
      </Tooltip>,
    );
    expect(screen.getByTestId('t').getAttribute('tabindex')).toBe('0');
  });

  it('lets a lone control be the tab stop', () => {
    render(
      <Tooltip tip="More" data-testid="t">
        <button type="button">go</button>
      </Tooltip>,
    );
    expect(screen.getByTestId('t').getAttribute('tabindex')).not.toBe('0');
  });
});

