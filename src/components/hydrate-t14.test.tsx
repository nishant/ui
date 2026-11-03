import { act, cleanup } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { presetsFor } from '../split-layout';
import { SystemCanvas } from './canvas/system-canvas';
import { FilterBar } from './filters';
import { Inbox } from './inbox';
import { ServiceTokensSection } from './service-tokens';
import { NumberField, SettingRow, SettingsSection } from './settings';
import { LayoutPresetPicker, SplitStage, presetOptions } from './split';
import { useResource } from './resource';
import { useUrlState } from './url-state';

// The first client render must equal the server render: React reports a mismatch with console.error.

const noop = () => undefined;

function Probe() {
  const r = useResource<string>(null);
  const [state] = useUrlState({ q: 'a', page: 1 });
  return (
    <p>
      {String(r.loading)}|{state.q}|{state.page}
    </p>
  );
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function hydrates(el: ReactElement) {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.innerHTML = renderToString(el);
  const before = container.innerHTML;
  await act(async () => {
    hydrateRoot(container, el, { onRecoverableError: (e) => errors(e) });
  });
  const messages = errors.mock.calls.map((c) => String(c[0] instanceof Error ? c[0].message : c[0]));
  container.remove();
  return { before, messages };
}

describe('first client render equals the server render', () => {
  it('settings', async () => {
    const r = await hydrates(
      <SettingsSection title="Alerts" description="d">
        <SettingRow label="Limit" htmlFor="limit">
          <NumberField id="limit" value={5} onCommit={noop} aria-label="Limit" />
        </SettingRow>
      </SettingsSection>,
    );
    expect(r.messages).toEqual([]);
  });

  it('service tokens', async () => {
    const r = await hydrates(<ServiceTokensSection tokens={undefined} onRevoke={async () => {}} />);
    expect(r.messages).toEqual([]);
  });

  it('filter bar on a phone-sized query', async () => {
    const r = await hydrates(
      <FilterBar search={{ value: '', onChange: noop, label: 'Find' }} activeCount={1}>
        <button>Open only</button>
      </FilterBar>,
    );
    expect(r.messages).toEqual([]);
  });

  it('split stage and preset picker', async () => {
    const layout = presetsFor(2)[0]!.build();
    const r = await hydrates(
      <>
        <SplitStage layout={layout} items={['a', 'b']} slots={['a', 'b']} resizable renderPane={(id) => <span>{id}</span>} />
        <LayoutPresetPicker options={presetOptions(2)} value={null} onChange={noop} />
      </>,
    );
    expect(r.messages).toEqual([]);
  });

  it('inbox', async () => {
    const r = await hydrates(
      <Inbox
        items={[]}
        view="open"
        counts={{ open: 0, snoozed: 0, handled: 0 }}
        sources={[
          { id: 'ci', open: 1 },
          { id: 'trading', open: 1 },
        ]}
        source={null}
        onViewChange={noop}
        onSourceChange={noop}
        onHandle={noop}
        onUnhandle={noop}
        onSnooze={noop}
        onUnsnooze={noop}
      />,
    );
    expect(r.messages).toEqual([]);
  });

  it('system canvas', async () => {
    const r = await hydrates(
      <SystemCanvas
        groups={[{ id: 'g', title: 'Apps', column: 0, nodes: [{ id: 'n', label: 'Web', active: true }] }]}
        edges={[]}
      />,
    );
    expect(r.messages).toEqual([]);
  });

  it('useResource and useUrlState', async () => {
    const r = await hydrates(<Probe />);
    expect(r.messages).toEqual([]);
  });
});
