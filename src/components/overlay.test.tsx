import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConfirmDialog,
  Drawer,
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSubHeader,
  Modal,
  Popover,
  Tooltip,
  menuItemClass,
} from './overlay';
import { NishProvider } from './provider';

let reduced = true;
let phone = false;

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('reduced-motion') ? reduced : query.includes('max-width') ? phone : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

beforeEach(() => {
  reduced = true;
  phone = false;
  stubMatchMedia();
});

afterEach(() => {
  cleanup();
  restoreLayout();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
});

function fakeLayout() {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => document.body });
}
function restoreLayout() {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
}

const flush = (ms = 5) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));

function press(key: string, init: KeyboardEventInit = {}, target: Element | Document = document) {
  act(() => {
    fireEvent.keyDown(target, { key, ...init });
  });
}

describe('Modal', () => {
  it('names the dialog from its title and sets the dialog attributes', () => {
    render(<Modal title="Delete it?" onClose={() => {}}>body</Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Delete it?' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('data-state')).toBe('open');
    expect(dialog.getAttribute('tabindex')).toBe('-1');
    expect(dialog.parentElement?.hasAttribute('data-nish-layer')).toBe(true);
    expect(dialog.parentElement?.parentElement).toBe(document.body);
  });

  it('puts ref, className, id, data-* and aria-* on the dialog panel', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Modal ref={ref} title="T" className="my-panel" id="dlg" data-testid="panel" aria-describedby="x" onClose={() => {}}>
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(ref.current).toBe(dialog);
    expect(dialog.classList.contains('my-panel')).toBe(true);
    expect(dialog.id).toBe('dlg');
    expect(dialog.getAttribute('data-testid')).toBe('panel');
    expect(dialog.getAttribute('aria-describedby')).toBe('x');
  });

  it('lets aria-label win over the title as the name, and aria-labelledby replace the title id', () => {
    const { rerender } = render(
      <Modal title="Visible" aria-label="Other name" onClose={() => {}}>
        b
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Other name');
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
    rerender(
      <Modal title="Visible" aria-labelledby="mine" onClose={() => {}}>
        b
      </Modal>,
    );
    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBe('mine');
  });

  it('takes its name from aria-label when header replaces the title row', () => {
    render(
      <Modal aria-label="Palette" header={<input aria-label="Search" />} onClose={() => {}}>
        results
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Palette' })).toBeTruthy();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('renders the heading, subtitle and footer, and hides the close button with hideClose', () => {
    const { rerender } = render(
      <Modal title="Heading" subtitle="Sub" footer={<button type="button">Go</button>} onClose={() => {}}>
        body
      </Modal>,
    );
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeTruthy();
    expect(screen.getByText('Sub')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0);
    rerender(
      <Modal title="Heading" hideClose onClose={() => {}}>
        body
      </Modal>,
    );
    // Only the phone grab handle (a role=button div) remains.
    expect(document.querySelector('button[aria-label="Close"]')).toBeNull();
  });

  it('takes the close label from the provider strings', () => {
    render(
      <NishProvider strings={{ close: 'Fermer' }}>
        <Modal title="T" onClose={() => {}}>
          b
        </Modal>
      </NishProvider>,
    );
    expect(document.querySelector('button[aria-label="Fermer"]')).toBeTruthy();
    expect(document.querySelector('[role=button][aria-label="Fermer"]')).toBeTruthy();
  });

  it('calls onClose and onOpenChange(false) on Escape, the close button and a backdrop press', () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Modal title="T" onClose={onClose} onOpenChange={onOpenChange}>
        b
      </Modal>,
    );
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(document.querySelector('button[aria-label="Close"]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
    const scrim = screen.getByRole('dialog').parentElement!;
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(scrim);
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  it('plays the exit animation before closing when motion is allowed', () => {
    reduced = false;
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        b
      </Modal>,
    );
    press('Escape');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('closed');
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    // The parent kept it mounted: it shows again.
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open');
  });

  it('asks canClose first and stays open when it says no', () => {
    const onClose = vi.fn();
    const canClose = vi.fn(() => false);
    render(
      <Modal title="T" onClose={onClose} canClose={canClose}>
        b
      </Modal>,
    );
    press('Escape');
    expect(canClose).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('is controlled by open: nothing when false, and onOpenChange asks to close', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Modal open={false} title="T" onOpenChange={onOpenChange}>
        b
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Modal open title="T" onOpenChange={onOpenChange}>
        b
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(
      <Modal open={false} title="T" onOpenChange={onOpenChange}>
        b
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders nothing on the server, even when open', () => {
    expect(() => renderToString(<Modal open title="T" onClose={() => {}}>b</Modal>)).not.toThrow();
    expect(renderToString(<Modal title="T" onClose={() => {}}>b</Modal>)).toBe('');
  });

  it('portals into the provider container', () => {
    const host = document.createElement('div');
    document.body.append(host);
    render(
      <NishProvider portalContainer={host}>
        <Modal title="T" onClose={() => {}}>
          b
        </Modal>
      </NishProvider>,
    );
    expect(host.querySelector('[role=dialog]')).toBeTruthy();
    host.remove();
  });

  it('locks scroll on html and body while open and restores the old values', () => {
    document.documentElement.style.overflow = 'scroll';
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <Modal title="T" onClose={() => {}}>
        b
      </Modal>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.hasAttribute('data-nish-layer-open')).toBe(true);
    unmount();
    expect(document.documentElement.style.overflow).toBe('scroll');
    expect(document.body.style.overflow).toBe('auto');
    expect(document.documentElement.hasAttribute('data-nish-layer-open')).toBe(false);
  });

  it('makes everything else on body inert except toasts, and clears it on close', () => {
    const other = document.createElement('div');
    const keep = document.createElement('div');
    keep.setAttribute('data-nish-keep-active', '');
    document.body.append(other, keep);
    const { unmount } = render(
      <Modal title="T" onClose={() => {}}>
        b
      </Modal>,
    );
    expect(other.hasAttribute('inert')).toBe(true);
    expect(keep.hasAttribute('inert')).toBe(false);
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();
    unmount();
    expect(other.hasAttribute('inert')).toBe(false);
    other.remove();
    keep.remove();
  });

  it('moves focus into the panel, honors data-autofocus, and returns focus to the opener', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(
      <Modal title="T" onClose={() => {}}>
        <button type="button">first</button>
        <input data-autofocus aria-label="name" />
      </Modal>,
    );
    await flush();
    expect(document.activeElement).toBe(screen.getByLabelText('name'));
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('focuses the panel itself when nothing asks for focus', async () => {
    render(
      <Modal title="T" onClose={() => {}}>
        text
      </Modal>,
    );
    await flush();
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('traps Tab inside the panel (offsetParent is faked: happy-dom has no layout)', () => {
    fakeLayout();
    render(
      <Modal title="T" hideClose dismissible={false} onClose={() => {}}>
        <button type="button">one</button>
        <button type="button">two</button>
      </Modal>,
    );
    const [one, two] = [screen.getByText('one'), screen.getByText('two')];
    two.focus();
    const forward = createEvent.keyDown(document, { key: 'Tab', cancelable: true });
    act(() => void document.dispatchEvent(forward));
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(one);
    one.focus();
    const back = createEvent.keyDown(document, { key: 'Tab', shiftKey: true, cancelable: true });
    act(() => void document.dispatchEvent(back));
    expect(back.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(two);
    // Tab in the middle is left alone.
    one.focus();
    const mid = createEvent.keyDown(document, { key: 'Tab', cancelable: true });
    act(() => void document.dispatchEvent(mid));
    expect(mid.defaultPrevented).toBe(false);
    restoreLayout();
  });

  it('warns in development when the dialog has no accessible name, and not when it has one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Modal aria-label="Named" onClose={() => {}}>b</Modal>);
    cleanup();
    expect(warn).not.toHaveBeenCalled();
    render(<Modal header={<span>head</span>} onClose={() => {}}>b</Modal>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('<Modal>');
  });

  it('gives an overflowing body tabIndex 0 and a label, and no tab stop otherwise', async () => {
    const sh = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.className.includes('overflow-y-auto') ? 500 : 0;
    });
    const ch = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.className.includes('overflow-y-auto') ? 100 : 0;
    });
    render(
      <Modal title="Long list" onClose={() => {}}>
        text only
      </Modal>,
    );
    await flush();
    const body = screen.getByText('text only');
    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body.getAttribute('role')).toBe('region');
    expect(body.getAttribute('aria-label')).toBe('Long list');
    sh.mockRestore();
    ch.mockRestore();
    cleanup();
    render(
      <Modal title="Short" onClose={() => {}}>
        fits
      </Modal>,
    );
    await flush();
    expect(screen.getByText('fits').hasAttribute('tabindex')).toBe(false);
  });
});

describe('history guard', () => {
  it('installs the popstate guard with the first closeOnBack dialog and removes it with the last', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const popAdds = () => add.mock.calls.filter((c) => c[0] === 'popstate');
    const popRemoves = () => remove.mock.calls.filter((c) => c[0] === 'popstate');
    const a = render(
      <Modal title="A" onClose={() => {}}>
        a
      </Modal>,
    );
    // The guard (capture) and the dialog's own listener.
    expect(popAdds().length).toBe(2);
    expect(popAdds().some((c) => c[2] === true)).toBe(true);
    const b = render(
      <Modal title="B" onClose={() => {}}>
        b
      </Modal>,
    );
    // The second dialog adds only its own listener.
    expect(popAdds().length).toBe(3);
    b.unmount();
    expect(popRemoves().some((c) => c[2] === true)).toBe(false);
    a.unmount();
    expect(popRemoves().some((c) => c[2] === true)).toBe(true);
    expect(popRemoves().length).toBe(3);
  });

  it('adds no popstate listener for a dialog with closeOnBack={false}', () => {
    const add = vi.spyOn(window, 'addEventListener');
    render(
      <Modal title="A" closeOnBack={false} onClose={() => {}}>
        a
      </Modal>,
    );
    expect(add.mock.calls.some((c) => c[0] === 'popstate')).toBe(false);
  });

  it('pushes one history entry per dialog and closes the top dialog on Back', async () => {
    const onClose = vi.fn();
    const push = vi.spyOn(history, 'pushState');
    render(
      <Modal title="A" onClose={onClose}>
        a
      </Modal>,
    );
    await flush(10);
    expect(push).toHaveBeenCalledTimes(1);
    expect((push.mock.calls[0][0] as { nishLayer: string }).nishLayer).toMatch(/^nish-layer-/);
    // Back: the entry's state is gone.
    history.replaceState(null, '');
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('two copies of the package on one page', () => {
  async function loadCopy() {
    vi.resetModules();
    const react = await import('react');
    const dom = await import('react-dom/client');
    const mod = await import('./overlay');
    const host = document.createElement('div');
    document.body.append(host);
    const root = dom.createRoot(host);
    return {
      show: (el: (m: typeof mod, r: typeof react) => unknown) =>
        react.act(() => {
          root.render(el(mod, react) as never);
        }),
      hide: () =>
        react.act(() => {
          root.unmount();
        }),
      host,
    };
  }

  it('share one layer stack, scroll lock and inert set; the last close restores the page', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.style.overflow = 'auto';
    const closeA = vi.fn();
    const closeB = vi.fn();
    const a = await loadCopy();
    await a.show((m, r) => r.createElement(m.Modal, { title: 'From A', onClose: closeA, children: 'a' }));
    const b = await loadCopy();
    await b.show((m, r) => r.createElement(m.Modal, { title: 'From B', onClose: closeB, children: 'b' }));
    const scrimA = screen.getByRole('dialog', { name: 'From A' }).parentElement!;
    const scrimB = screen.getByRole('dialog', { name: 'From B' }).parentElement!;
    // A is under B: inert. B is not.
    expect(scrimA.hasAttribute('inert')).toBe(true);
    expect(scrimB.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    // Escape closes only the top layer, which belongs to the other copy.
    press('Escape');
    expect(closeB).toHaveBeenCalledTimes(1);
    expect(closeA).not.toHaveBeenCalled();

    // Close order: B first. The page stays locked and A comes back to life.
    await b.hide();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.hasAttribute('data-nish-layer-open')).toBe(true);
    expect(scrimA.hasAttribute('inert')).toBe(false);
    press('Escape');
    expect(closeA).toHaveBeenCalledTimes(1);

    await a.hide();
    expect(document.body.style.overflow).toBe('auto');
    expect(document.documentElement.hasAttribute('data-nish-layer-open')).toBe(false);
    expect(document.querySelectorAll('[inert]').length).toBe(0);
    a.host.remove();
    b.host.remove();
  });
});

describe('Drawer', () => {
  it('is a named dialog with ref, className and rest on the panel', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Drawer ref={ref} title="Filters" subtitle="3 active" className="mine" data-testid="d" onClose={() => {}}>
        body
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(ref.current).toBe(dialog);
    expect(dialog.classList.contains('mine')).toBe(true);
    expect(dialog.getAttribute('data-testid')).toBe('d');
    expect(screen.getByText('3 active')).toBeTruthy();
  });

  it('closes with Escape, the labelled close button and the scrim, calling onClose and onOpenChange', () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <NishProvider strings={{ close: 'Zu' }}>
        <Drawer title="D" onClose={onClose} onOpenChange={onOpenChange}>
          b
        </Drawer>
      </NishProvider>,
    );
    press('Escape');
    fireEvent.click(screen.getByRole('button', { name: 'Zu' }));
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  it('is controlled by open and renders nothing on the server', () => {
    const { rerender } = render(
      <Drawer open={false} title="D" onOpenChange={() => {}}>
        b
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Drawer open title="D" onOpenChange={() => {}}>
        b
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(renderToString(<Drawer open title="D">b</Drawer>)).toBe('');
  });

  it('uses aria-label over the title and warns when there is no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Drawer title="T" aria-label="Named" onClose={() => {}}>
        b
      </Drawer>,
    );
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Named');
    expect(screen.getByRole('dialog').hasAttribute('aria-labelledby')).toBe(false);
    cleanup();
    expect(warn).not.toHaveBeenCalled();
    render(<Drawer onClose={() => {}}>b</Drawer>);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('<Drawer>');
  });

  it('puts side, size and bottomOffset into the layout', () => {
    render(
      <Drawer title="Sheet" side="bottom" size="lg" bottomOffset="4rem" onClose={() => {}}>
        b
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-h-[92dvh]');
    expect(dialog.className).toContain('bottom-0');
    expect((dialog.parentElement as HTMLElement).style.bottom).toBe('4rem');
  });

  it('renders actions and footer', () => {
    render(
      <Drawer title="D" actions={<button type="button">act</button>} footer={<span>foot</span>} onClose={() => {}}>
        b
      </Drawer>,
    );
    expect(screen.getByRole('button', { name: 'act' })).toBeTruthy();
    expect(screen.getByText('foot')).toBeTruthy();
  });
});

describe('ConfirmDialog', () => {
  it('is an alertdialog named by its title and described by its body', () => {
    render(<ConfirmDialog title="Delete?" body="History goes too." confirmLabel="Delete" onConfirm={() => {}} onCancel={() => {}} />);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
    const described = dialog.getAttribute('aria-describedby');
    expect(described).toBeTruthy();
    expect(document.getElementById(described!)?.textContent).toBe('History goes too.');
  });

  it('has no description when there is no body', () => {
    render(<ConfirmDialog title="Sure?" confirmLabel="Yes" onConfirm={() => {}} />);
    expect(screen.getByRole('alertdialog').hasAttribute('aria-describedby')).toBe(false);
  });

  it('runs onConfirm, and cancels with the button, Escape and onOpenChange', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog title="T" confirmLabel="Do it" onConfirm={onConfirm} onCancel={onCancel} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    press('Escape');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses cancelLabel, then the provider cancel string, then Cancel', () => {
    const { rerender } = render(
      <NishProvider strings={{ cancel: 'Annuler' }}>
        <ConfirmDialog title="T" confirmLabel="Ok" onConfirm={() => {}} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ cancel: 'Annuler' }}>
        <ConfirmDialog title="T" confirmLabel="Ok" cancelLabel="Keep" onConfirm={() => {}} />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Keep' })).toBeTruthy();
  });

  it('holds Cancel, Escape and the backdrop off while pending', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="T" confirmLabel="Go" pending onConfirm={() => {}} onCancel={onCancel} />);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    press('Escape');
    fireEvent.mouseDown(screen.getByRole('alertdialog').parentElement!);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('puts first focus on Cancel for danger and on the confirm button for primary', async () => {
    const { rerender } = render(<ConfirmDialog title="T" confirmLabel="Go" onConfirm={() => {}} />);
    await flush();
    expect(document.activeElement?.textContent).toBe('Cancel');
    rerender(<ConfirmDialog title="T" tone="primary" confirmLabel="Go" onConfirm={() => {}} />);
    cleanup();
    render(<ConfirmDialog title="T" tone="primary" confirmLabel="Go" onConfirm={() => {}} />);
    await flush();
    expect(document.activeElement?.textContent).toContain('Go');
  });

  it('is controlled by open', () => {
    const { rerender } = render(<ConfirmDialog open={false} title="T" confirmLabel="Go" onConfirm={() => {}} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    rerender(<ConfirmDialog open title="T" confirmLabel="Go" onConfirm={() => {}} />);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });
});

function hover(el: Element) {
  act(() => void el.dispatchEvent(new MouseEvent('mouseenter')));
}
function unhover(el: Element) {
  act(() => void el.dispatchEvent(new MouseEvent('mouseleave')));
}

describe('Tooltip', () => {
  it('does not add a Tab stop around a single focusable child, and describes the child', () => {
    render(
      <Tooltip tip="Saves it">
        <button type="button">Save</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    const wrapper = button.parentElement!;
    expect(wrapper.hasAttribute('tabindex')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    act(() => void button.focus());
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Saves it');
    expect(button.getAttribute('aria-describedby')).toBe(tip.id);
    expect(wrapper.hasAttribute('aria-describedby')).toBe(false);
  });

  it('keeps an existing aria-describedby on the child and adds the tip id', () => {
    render(
      <Tooltip tip="tip">
        <button type="button" aria-describedby="hint">
          B
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-describedby')).toBe('hint');
    act(() => void button.focus());
    expect(button.getAttribute('aria-describedby')).toBe(`hint ${screen.getByRole('tooltip').id}`);
  });

  it('wraps non-focusable content in a focusable trigger that carries aria-describedby', () => {
    render(
      <Tooltip tip="Explains">
        <span>term</span>
      </Tooltip>,
    );
    const wrapper = screen.getByText('term').parentElement!;
    expect(wrapper.getAttribute('tabindex')).toBe('0');
    act(() => void wrapper.focus());
    expect(wrapper.getAttribute('aria-describedby')).toBe(screen.getByRole('tooltip').id);
    expect(wrapper.getAttribute('data-state')).toBe('open');
  });

  it('honors focusable={false} and focusable={true} over the default', () => {
    const { rerender } = render(
      <Tooltip tip="t" focusable={false}>
        <span>x</span>
      </Tooltip>,
    );
    expect(screen.getByText('x').parentElement!.hasAttribute('tabindex')).toBe(false);
    rerender(
      <Tooltip tip="t" focusable>
        <button type="button">y</button>
      </Tooltip>,
    );
    expect(screen.getByText('y').parentElement!.getAttribute('tabindex')).toBe('0');
  });

  it('passes ref, className and rest to the trigger wrapper', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Tooltip ref={ref} tip="t" className="mine" data-testid="trig" id="trigger-id">
        <span>x</span>
      </Tooltip>,
    );
    const wrapper = screen.getByTestId('trig');
    expect(ref.current).toBe(wrapper);
    expect(wrapper.classList.contains('mine')).toBe(true);
    expect(wrapper.id).toBe('trigger-id');
  });

  it('supports a tr trigger', () => {
    render(
      <table>
        <tbody>
          <Tooltip as="tr" tip="row tip" data-testid="row">
            <td>cell</td>
          </Tooltip>
        </tbody>
      </table>,
    );
    hover(screen.getByTestId('row'));
    expect(screen.getByRole('tooltip').textContent).toBe('row tip');
    expect(screen.getByTestId('row').tagName).toBe('TR');
  });

  it('opens on hover and closes about 100 ms after the pointer leaves', () => {
    vi.useFakeTimers();
    render(
      <Tooltip tip="hello">
        <span>t</span>
      </Tooltip>,
    );
    const wrapper = screen.getByText('t').parentElement!;
    hover(wrapper);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    unhover(wrapper);
    act(() => void vi.advanceTimersByTime(99));
    expect(screen.queryByRole('tooltip')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays open while the pointer is on the tip (WCAG 1.4.13 hoverable) and closes after leaving it', () => {
    vi.useFakeTimers();
    render(
      <Tooltip tip="hello">
        <span>t</span>
      </Tooltip>,
    );
    const wrapper = screen.getByText('t').parentElement!;
    hover(wrapper);
    const tip = screen.getByRole('tooltip');
    expect(tip.className).not.toContain('pointer-events-none');
    unhover(wrapper);
    fireEvent.pointerEnter(tip);
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.queryByRole('tooltip')).toBeTruthy();
    fireEvent.pointerLeave(tip);
    act(() => void vi.advanceTimersByTime(100));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes on Escape even when it was opened by hover, without reaching a dialog below', () => {
    const onClose = vi.fn();
    render(
      <>
        <Modal title="M" onClose={onClose}>
          <Tooltip tip="inside">
            <span>t</span>
          </Tooltip>
        </Modal>
      </>,
    );
    hover(screen.getByText('t').parentElement!);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    press('Escape', {}, screen.getByText('t'));
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on blur', () => {
    render(
      <Tooltip tip="x">
        <button type="button">b</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button');
    act(() => void button.focus());
    expect(screen.getByRole('tooltip')).toBeTruthy();
    act(() => void button.blur());
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('does not open on mouseenter right after a touch', () => {
    render(
      <Tooltip tip="x">
        <span>t</span>
      </Tooltip>,
    );
    const wrapper = screen.getByText('t').parentElement!;
    act(() => void wrapper.dispatchEvent(Object.assign(new Event('pointerenter'), { pointerType: 'touch' })));
    hover(wrapper);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders the tip inside the dialog layer it belongs to, else the provider container', () => {
    const host = document.createElement('div');
    document.body.append(host);
    render(
      <NishProvider portalContainer={host}>
        <Tooltip tip="outside">
          <span>o</span>
        </Tooltip>
        <Modal title="M" onClose={() => {}}>
          <Tooltip tip="inside">
            <span>i</span>
          </Tooltip>
        </Modal>
      </NishProvider>,
    );
    hover(screen.getByText('o').parentElement!);
    expect(host.querySelector('[role=tooltip]')?.textContent).toBe('outside');
    unhover(screen.getByText('o').parentElement!);
    hover(screen.getByText('i').parentElement!);
    const inner = [...document.querySelectorAll('[role=tooltip]')].find((t) => t.textContent === 'inside')!;
    expect(inner.closest('[data-nish-layer]')).toBeTruthy();
    host.remove();
  });

  it('renders only the trigger on the server', () => {
    const html = renderToString(
      <Tooltip tip="never">
        <span>term</span>
      </Tooltip>,
    );
    expect(html).toContain('term');
    expect(html).not.toContain('never');
  });

  it('gives the hint variant a dotted underline and keeps it inline', () => {
    render(
      <Tooltip tip="t" variant="hint">
        <span>term</span>
      </Tooltip>,
    );
    const wrapper = screen.getByText('term').parentElement!;
    expect(wrapper.className).toContain('decoration-dotted');
    expect(wrapper.className).toContain('inline');
    expect(wrapper.className).not.toContain('inline-flex');
  });
});

describe('Popover', () => {
  function Harness(props: { open?: boolean; onOpenChange?: (o: boolean, r: string) => void; dismissOnOutside?: boolean }) {
    const anchor = createRef<HTMLButtonElement>();
    return (
      <>
        <button ref={anchor} type="button">
          anchor
        </button>
        <button type="button">elsewhere</button>
        <Popover
          open={props.open ?? true}
          onOpenChange={props.onOpenChange ?? (() => {})}
          dismissOnOutside={props.dismissOnOutside}
          anchor={anchor}
          aria-label="Panel"
          className="mine"
          data-testid="pop"
        >
          <button type="button">inside</button>
        </Popover>
      </>
    );
  }

  it('is a named dialog with className and rest, and renders nothing when closed or on the server', () => {
    const { rerender } = render(<Harness />);
    const panel = screen.getByRole('dialog', { name: 'Panel' });
    expect(panel.classList.contains('mine')).toBe(true);
    expect(panel.getAttribute('data-testid')).toBe('pop');
    expect(panel.getAttribute('data-state')).toBe('open');
    rerender(<Harness open={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(renderToString(<Harness />)).not.toContain('Panel');
  });

  it('reports Escape, an outside press and Tab out with their reasons', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    press('Escape');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'outside');
    onOpenChange.mockClear();
    fireEvent.pointerDown(screen.getByText('inside'));
    fireEvent.pointerDown(screen.getByText('anchor'));
    expect(onOpenChange).not.toHaveBeenCalled();
    fakeLayout();
    screen.getByText('inside').focus();
    const tab = createEvent.keyDown(screen.getByText('inside'), { key: 'Tab', cancelable: true });
    act(() => void screen.getByText('inside').dispatchEvent(tab));
    expect(tab.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'tab');
    restoreLayout();
  });

  it('ignores outside presses with dismissOnOutside={false} but still closes on Escape', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} dismissOnOutside={false} />);
    fireEvent.pointerDown(screen.getByText('elsewhere'));
    expect(onOpenChange).not.toHaveBeenCalled();
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape');
  });

  it('portals into the provider container', () => {
    const host = document.createElement('div');
    document.body.append(host);
    render(
      <NishProvider portalContainer={host}>
        <Harness />
      </NishProvider>,
    );
    expect(host.querySelector('[role=dialog]')).toBeTruthy();
    host.remove();
  });

  it('returns focus to the anchor when it closes with focus inside', async () => {
    const { rerender } = render(<Harness />);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
    screen.getByText('inside').focus();
    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(screen.getByText('anchor'));
  });

  it('opens inside a dialog layer when the anchor is inside one, and Escape closes the popover first', () => {
    const onOpenChange = vi.fn();
    const onClose = vi.fn();
    function Inside() {
      const anchor = createRef<HTMLButtonElement>();
      return (
        <Modal title="M" onClose={onClose}>
          <button ref={anchor} type="button">
            a2
          </button>
          <Popover open onOpenChange={onOpenChange} anchor={anchor} aria-label="Nested">
            n
          </Popover>
        </Modal>
      );
    }
    render(<Inside />);
    // The popover mounts after the anchor ref is set, so render once more.
    cleanup();
    const { rerender } = render(<Inside />);
    rerender(<Inside />);
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('DropdownMenu', () => {
  const items = (
    <>
      <MenuLabel>Group</MenuLabel>
      <MenuItem onSelect={() => {}}>Rename</MenuItem>
      <MenuItem disabled>Locked</MenuItem>
      <MenuSeparator />
      <MenuItem danger>Delete</MenuItem>
    </>
  );

  it('open on mount renders the menu once, next to its trigger, and focuses the first item', async () => {
    render(
      <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
        <MenuItem onSelect={() => {}}>Rename</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </DropdownMenu>,
    );
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Actions' }).getAttribute('aria-expanded')).toBe('true');
    await flush(10);
    expect(document.activeElement?.textContent).toBe('Rename');
  });

  it('wires the trigger (haspopup, expanded, controls) and names the menu from it', () => {
    render(<DropdownMenu trigger={<button type="button">Actions</button>}>{items}</DropdownMenu>);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    fireEvent.click(trigger, { detail: 1 });
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
    expect(menu.getAttribute('aria-orientation')).toBe('vertical');
    expect(menu.getAttribute('data-state')).toBe('open');
  });

  it('prefers aria-label for the menu name, and passes ref, rest and className to the menu', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DropdownMenu
        defaultOpen
        ref={ref}
        aria-label="Widget actions"
        className="mine"
        data-testid="menu"
        trigger={<button type="button">T</button>}
      >
        {items}
      </DropdownMenu>,
    );
    const menu = screen.getByRole('menu', { name: 'Widget actions' });
    expect(ref.current).toBe(menu);
    expect(menu.classList.contains('mine')).toBe(true);
    expect(menu.getAttribute('data-testid')).toBe('menu');
    expect(menu.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('opens on ArrowDown at the first item and on ArrowUp at the last, skipping disabled rows', async () => {
    render(<DropdownMenu trigger={<button type="button">Actions</button>}>{items}</DropdownMenu>);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    press('ArrowUp', {}, trigger);
    await flush(10);
    expect(document.activeElement?.textContent).toBe('Delete');
  });

  it('moves with arrows, wraps, jumps with Home and End, and skips aria-disabled rows', async () => {
    render(<DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>{items}</DropdownMenu>);
    await flush(10);
    const menu = screen.getByRole('menu');
    expect(document.activeElement?.textContent).toBe('Rename');
    press('ArrowDown', {}, menu);
    expect(document.activeElement?.textContent).toBe('Delete');
    press('ArrowDown', {}, menu);
    expect(document.activeElement?.textContent).toBe('Rename');
    press('ArrowUp', {}, menu);
    expect(document.activeElement?.textContent).toBe('Delete');
    press('Home', {}, menu);
    expect(document.activeElement?.textContent).toBe('Rename');
    press('End', {}, menu);
    expect(document.activeElement?.textContent).toBe('Delete');
  });

  it('jumps to the next row that starts with the typed letter', async () => {
    render(
      <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
        <MenuItem>Alpha</MenuItem>
        <MenuItem>Beta</MenuItem>
        <MenuItem>Bravo</MenuItem>
        <MenuItem>Charlie</MenuItem>
      </DropdownMenu>,
    );
    await flush(10);
    const menu = screen.getByRole('menu');
    press('b', {}, menu);
    expect(document.activeElement?.textContent).toBe('Beta');
    press('b', {}, menu);
    expect(document.activeElement?.textContent).toBe('Bravo');
    press('B', {}, menu);
    expect(document.activeElement?.textContent).toBe('Beta');
    press('c', { ctrlKey: true }, menu);
    expect(document.activeElement?.textContent).toBe('Beta');
    press('z', {}, menu);
    expect(document.activeElement?.textContent).toBe('Beta');
  });

  it('closes on Escape and Tab with their reasons and returns focus to the trigger', async () => {
    const onOpenChange = vi.fn();
    render(
      <DropdownMenu defaultOpen onOpenChange={onOpenChange} trigger={<button type="button">Actions</button>}>
        {items}
      </DropdownMenu>,
    );
    await flush(10);
    press('Escape');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }), { detail: 0 });
    press('Tab', {}, screen.getByRole('menu'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'tab');
  });

  it('closes after a selection unless onSelect prevents default', async () => {
    const onSelect = vi.fn();
    const keep = vi.fn((e: Event) => e.preventDefault());
    render(
      <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
        <MenuItem onSelect={keep}>Stay</MenuItem>
        <MenuItem onSelect={onSelect}>Go</MenuItem>
        <MenuItem disabled onSelect={onSelect}>Off</MenuItem>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText('Stay'));
    expect(keep).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(screen.getByText('Off'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(screen.getByText('Go'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('is controlled by open', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DropdownMenu open={false} onOpenChange={onOpenChange} trigger={<button type="button">Actions</button>}>
        {items}
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }), { detail: 1 });
    expect(onOpenChange).toHaveBeenCalledWith(true, undefined);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <DropdownMenu open onOpenChange={onOpenChange} trigger={<button type="button">Actions</button>}>
        {items}
      </DropdownMenu>,
    );
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('renders into the provider container', () => {
    const host = document.createElement('div');
    document.body.append(host);
    render(
      <NishProvider portalContainer={host}>
        <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
          {items}
        </DropdownMenu>
      </NishProvider>,
    );
    expect(host.querySelector('[role=menu]')).toBeTruthy();
    host.remove();
  });

  it('renders no menu on the server', () => {
    const html = renderToString(
      <DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>
        {items}
      </DropdownMenu>,
    );
    expect(html).toContain('Actions');
    expect(html).not.toContain('role="menu"');
  });

  it('opens as a bottom sheet on phones with the provider menu string as its title', () => {
    phone = true;
    render(
      <NishProvider strings={{ menu: 'Menü' }}>
        <DropdownMenu defaultOpen sheetBelow="sm" trigger={<button type="button">Actions</button>}>
          {items}
        </DropdownMenu>
      </NishProvider>,
    );
    expect(screen.getByRole('dialog', { name: 'Menü' })).toBeTruthy();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('prefers sheetTitle for the sheet title', () => {
    phone = true;
    render(
      <DropdownMenu defaultOpen sheetBelow="sm" sheetTitle="Pick one" trigger={<button type="button">Actions</button>}>
        {items}
      </DropdownMenu>,
    );
    expect(screen.getByRole('dialog', { name: 'Pick one' })).toBeTruthy();
  });

  it('stays a floating panel on phones without sheetBelow', () => {
    phone = true;
    render(<DropdownMenu defaultOpen trigger={<button type="button">Actions</button>}>{items}</DropdownMenu>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('menu')).toBeTruthy();
  });
});

describe('menu rows', () => {
  it('MenuItem is a menuitem with aria-current, aria-disabled, ref, rest and its trailing slot', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <div role="menu">
        <MenuItem ref={ref} active icon={<i data-testid="ic" />} trailing={<b>⌘K</b>} data-testid="row" className="mine">
          Open
        </MenuItem>
        <MenuItem disabled>Off</MenuItem>
      </div>,
    );
    const row = screen.getByTestId('row');
    expect(ref.current).toBe(row);
    expect(row.getAttribute('role')).toBe('menuitem');
    expect(row.getAttribute('aria-current')).toBe('true');
    expect(row.classList.contains('mine')).toBe(true);
    expect(screen.getByTestId('ic')).toBeTruthy();
    expect(screen.getByText('⌘K').parentElement?.className).toContain('ms-auto');
    const off = screen.getByText('Off').closest('button')!;
    expect(off.getAttribute('aria-disabled')).toBe('true');
    expect(off.hasAttribute('data-disabled')).toBe(true);
    expect(row.hasAttribute('aria-disabled')).toBe(false);
  });

  it('calls a consumer onClick and onMouseMove too, and focuses the row on hover', () => {
    const onClick = vi.fn();
    const onMouseMove = vi.fn();
    render(
      <div role="menu">
        <MenuItem onClick={onClick} onMouseMove={onMouseMove}>
          Row
        </MenuItem>
      </div>,
    );
    const row = screen.getByText('Row').closest('button')!;
    fireEvent.mouseMove(row);
    expect(onMouseMove).toHaveBeenCalled();
    expect(document.activeElement).toBe(row);
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('menuItemClass builds the active, danger and disabled looks', () => {
    expect(menuItemClass({ active: true })).toContain('bg-th-overlay');
    expect(menuItemClass({ active: true, danger: true })).not.toContain('font-medium');
    expect(menuItemClass({ active: true, disabled: true })).not.toContain('font-medium');
    expect(menuItemClass({ danger: true })).toContain('text-th-loss');
    expect(menuItemClass({ disabled: true })).toContain('cursor-default');
    expect(menuItemClass({ className: 'extra' })).toContain('extra');
    expect(menuItemClass()).toContain('text-start');
    expect(menuItemClass()).not.toContain('text-left');
  });

  it('MenuLabel and MenuSeparator take ref, className and rest', () => {
    const labelRef = createRef<HTMLDivElement>();
    const sepRef = createRef<HTMLDivElement>();
    render(
      <>
        <MenuLabel ref={labelRef} className="lbl" data-testid="l">
          Label
        </MenuLabel>
        <MenuSeparator ref={sepRef} className="sep" data-testid="s" />
      </>,
    );
    expect(labelRef.current).toBe(screen.getByTestId('l'));
    expect(labelRef.current?.classList.contains('lbl')).toBe(true);
    expect(sepRef.current).toBe(screen.getByTestId('s'));
    expect(sepRef.current?.getAttribute('role')).toBe('separator');
  });

  it('MenuSubHeader reads Back from the provider strings and goes back on click and the mirrored arrow', () => {
    const onBack = vi.fn();
    render(
      <NishProvider strings={{ back: 'Zurück: ' }}>
        <MenuSubHeader onBack={onBack}>Move to</MenuSubHeader>
      </NishProvider>,
    );
    const header = screen.getByRole('menuitem');
    expect(header.textContent).toContain('Zurück: ');
    fireEvent.click(header);
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(header, { key: 'ArrowLeft' });
    expect(onBack).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(header, { key: 'ArrowRight' });
    expect(onBack).toHaveBeenCalledTimes(2);
    header.style.direction = 'rtl';
    fireEvent.keyDown(header, { key: 'ArrowRight' });
    expect(onBack).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(header, { key: 'ArrowLeft' });
    expect(onBack).toHaveBeenCalledTimes(3);
    expect(header.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });
});
