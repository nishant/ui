import { cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isRtl, useIsClient, useIsoLayoutEffect } from './client';
import { NishProvider, useNishConfig, useNishStrings } from './provider';
import { DEFAULT_STRINGS } from './strings';

afterEach(cleanup);

function Probe() {
  const s = useNishStrings();
  const c = useNishConfig();
  return (
    <p data-testid="p" data-locale={c.locale ?? ''} data-dir={c.dir ?? ''}>
      {s.close}|{s.cancel}|{s.themeToggleLabel('Light', 'Dark')}
    </p>
  );
}

describe('NishProvider', () => {
  it('gives English defaults without a provider', () => {
    const got: { cfg?: ReturnType<typeof useNishConfig> } = {};
    function G() {
      const c = useNishConfig();
      useEffect(() => {
        got.cfg = c;
      });
      return <Probe />;
    }
    render(<G />);
    const cfg = got.cfg;
    expect(screen.getByTestId('p').textContent).toBe('Close|Cancel|Theme: Light. Switch to Dark');
    expect(cfg!.strings).toBe(DEFAULT_STRINGS);
    expect(cfg!.locale).toBeUndefined();
    expect(cfg!.dir).toBeUndefined();
  });

  it('overrides strings and keeps the rest', () => {
    render(
      <NishProvider strings={{ close: 'Fermer' }} locale="fr" dir="rtl">
        <Probe />
      </NishProvider>,
    );
    const p = screen.getByTestId('p');
    expect(p.textContent).toBe('Fermer|Cancel|Theme: Light. Switch to Dark');
    expect(p.dataset.locale).toBe('fr');
    expect(p.dataset.dir).toBe('rtl');
  });

  it('nests: inner overrides outer key by key, others inherit', () => {
    render(
      <NishProvider strings={{ close: 'A', cancel: 'B' }} locale="fr" dir="rtl">
        <NishProvider strings={{ cancel: 'C' }} locale="de">
          <Probe />
        </NishProvider>
      </NishProvider>,
    );
    const p = screen.getByTestId('p');
    expect(p.textContent).toBe('A|C|Theme: Light. Switch to Dark');
    expect(p.dataset.locale).toBe('de');
    expect(p.dataset.dir).toBe('rtl');
  });

  it('passes the portal container and lets null reset it', () => {
    const el = document.createElement('div');
    const got: { seen: unknown } = { seen: 'unset' };
    function Grab() {
      const c = useNishConfig().portalContainer;
      useEffect(() => {
        got.seen = c;
      });
      return null;
    }
    render(
      <NishProvider portalContainer={el}>
        <Grab />
      </NishProvider>,
    );
    expect(got.seen).toBe(el);
    cleanup();
    render(
      <NishProvider portalContainer={el}>
        <NishProvider portalContainer={null}>
          <Grab />
        </NishProvider>
      </NishProvider>,
    );
    expect(got.seen).toBeNull();
  });

  it('inner provider without portalContainer inherits the outer one', () => {
    const el = document.createElement('div');
    const got: { seen: unknown } = { seen: undefined };
    function Grab() {
      const c = useNishConfig().portalContainer;
      useEffect(() => {
        got.seen = c;
      });
      return null;
    }
    render(
      <NishProvider portalContainer={el}>
        <NishProvider locale="fr">
          <Grab />
        </NishProvider>
      </NishProvider>,
    );
    expect(got.seen).toBe(el);
  });

  it('formats strings with values', () => {
    expect(DEFAULT_STRINGS.pageLabel(3)).toBe('Page 3');
    expect(DEFAULT_STRINGS.removeTag('a')).toBe('Remove a');
    expect(DEFAULT_STRINGS.removeFile('f.txt')).toBe('Remove f.txt');
    expect(DEFAULT_STRINGS.moreCount(4)).toBe('4 more');
    expect(DEFAULT_STRINGS.themeToggleLabel('System', 'Light')).toBe('Theme: System. Switch to Light');
  });
});

describe('client helpers', () => {
  it('useIsClient is false on the server and true after mount', () => {
    function C() {
      return <span>{useIsClient() ? 'client' : 'server'}</span>;
    }
    expect(renderToString(<C />)).toContain('server');
    render(<C />);
    expect(screen.getByText('client')).toBeTruthy();
  });

  it('useIsoLayoutEffect runs an effect', () => {
    let ran = 0;
    function C() {
      useIsoLayoutEffect(() => {
        ran++;
      }, []);
      return null;
    }
    render(<C />);
    expect(ran).toBe(1);
  });

  it('isRtl reads the computed direction', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(isRtl(el)).toBe(false);
    el.style.direction = 'rtl';
    expect(isRtl(el)).toBe(true);
    expect(isRtl(null)).toBe(false);
    expect(isRtl(undefined)).toBe(false);
    el.remove();
  });
});
