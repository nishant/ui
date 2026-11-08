import { cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isRtl, useIsClient, useIsoLayoutEffect } from './client';
import { NishProvider, useNishConfig, useNishContext, useNishStrings, useStrings } from './provider';
import { DEFAULT_STRINGS, SHELL_STRINGS, STATUS_STRINGS } from './strings';

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

describe('useStrings', () => {
  function Grab<T>({ use, into }: { use: () => T; into: { v?: T; n: number } }) {
    into.v = use();
    into.n++;
    return null;
  }

  it('does not copy inherited-name overrides such as toString or constructor', () => {
    const got: { v?: typeof SHELL_STRINGS; n: number } = { n: 0 };
    const bad = { toString: () => 'x', constructor: 'y', more: 'Plus' } as never;
    render(
      <NishProvider strings={bad}>
        <Grab use={() => useStrings(SHELL_STRINGS)} into={got} />
      </NishProvider>,
    );
    expect(Object.hasOwn(got.v!, 'toString')).toBe(false);
    expect(Object.hasOwn(got.v!, 'constructor')).toBe(false);
    expect(got.v!.more).toBe('Plus');
  });

  it('returns the group itself without a provider', () => {
    const got: { v?: typeof SHELL_STRINGS; n: number } = { n: 0 };
    render(<Grab use={() => useStrings(SHELL_STRINGS)} into={got} />);
    expect(got.v).toBe(SHELL_STRINGS);
  });

  it('keeps several groups stable across renders without a provider', () => {
    const got: { v?: unknown; n: number } = { n: 0 };
    const use = () => useStrings(SHELL_STRINGS, STATUS_STRINGS);
    const { rerender } = render(<Grab use={use} into={got} />);
    const first = got.v;
    rerender(<Grab use={use} into={got} />);
    expect(got.n).toBe(2);
    expect(got.v).toBe(first);
    expect(got.v).toMatchObject({ more: 'More', loading: 'Loading' });
  });

  it('applies only the overrides whose key is in a passed group', () => {
    const got: { v?: Record<string, unknown>; n: number } = { n: 0 };
    render(
      <NishProvider strings={{ more: 'Plus', close: 'X' }}>
        <Grab use={() => useStrings(SHELL_STRINGS) as Record<string, unknown>} into={got} />
      </NishProvider>,
    );
    expect(got.v!.more).toBe('Plus');
    expect(got.v!.sections).toBe('Sections');
    expect('close' in got.v!).toBe(false);
    expect(Object.keys(got.v!).sort()).toEqual(Object.keys(SHELL_STRINGS).sort());
  });

  it('nests key by key and overrides function strings', () => {
    const got: { v?: { more: string; sections: string; hubTitle: string }; n: number } = { n: 0 };
    render(
      <NishProvider strings={{ more: 'A', sections: 'B' }}>
        <NishProvider strings={{ sections: 'C' }}>
          <Grab use={() => useStrings(SHELL_STRINGS)} into={got} />
        </NishProvider>
      </NishProvider>,
    );
    expect(got.v!.more).toBe('A');
    expect(got.v!.sections).toBe('C');
    expect(got.v!.hubTitle).toBe('Back to nish.software');
    cleanup();
    const f: { v?: { newCount: (v: string | number) => string }; n: number } = { n: 0 };
    render(
      <NishProvider strings={{ newCount: (v) => `${v} nouveaux` }}>
        <Grab use={() => useStrings(SHELL_STRINGS)} into={f} />
      </NishProvider>,
    );
    expect(f.v!.newCount(2)).toBe('2 nouveaux');
  });

  it('strings={undefined} passes the outer overrides through (same identity)', () => {
    const seen: unknown[] = [];
    function Spy() {
      seen.push(useNishContext().strings);
      return null;
    }
    render(
      <NishProvider strings={{ more: 'Plus' }}>
        <Spy />
        <NishProvider strings={undefined}>
          <Spy />
        </NishProvider>
      </NishProvider>,
    );
    expect(seen).toHaveLength(2);
    expect(seen[1]).toBe(seen[0]);
  });

  it('the public hooks still return every key with overrides applied', () => {
    const got: { s?: ReturnType<typeof useNishStrings>; c?: ReturnType<typeof useNishConfig> } = {};
    const collect = (s: ReturnType<typeof useNishStrings>, c: ReturnType<typeof useNishConfig>) => {
      got.s = s;
      got.c = c;
    };
    function Both() {
      collect(useNishStrings(), useNishConfig());
      return null;
    }
    render(
      <NishProvider strings={{ more: 'Plus', hour: 'Heure' }} locale="fr">
        <Both />
      </NishProvider>,
    );
    expect(Object.keys(got.s!).sort()).toEqual(Object.keys(DEFAULT_STRINGS).sort());
    expect(got.s!.more).toBe('Plus');
    expect(got.s!.hour).toBe('Heure');
    expect(got.s!.close).toBe('Close');
    expect(Object.keys(got.c!.strings).sort()).toEqual(Object.keys(DEFAULT_STRINGS).sort());
    expect(got.c!.strings.more).toBe('Plus');
    expect(got.c!.locale).toBe('fr');
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
