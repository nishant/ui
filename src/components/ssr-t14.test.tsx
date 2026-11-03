// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Inbox } from './inbox';
import { FilterBar, FilterSheet } from './filters';
import { SystemCanvas } from './canvas/system-canvas';
import { ServiceTokensSection } from './service-tokens';
import { NumberField, SettingRow, SettingsSection } from './settings';
import { LayoutPresetPicker, SplitDividers, SplitStage, presetOptions } from './split';
import { presetsFor } from '../split-layout';
import { useResource } from './resource';
import { useUrlState } from './url-state';

// These run with no window or document at all: the server render of every component of this task.

const noop = () => undefined;

function Probe() {
  const r = useResource<string>('/api/x');
  const [state] = useUrlState({ q: 'a', page: 1, on: true, tags: ['x'] });
  return (
    <p>
      {String(r.loading)}|{state.q}|{state.page}|{String(state.on)}|{state.tags.join(',')}
    </p>
  );
}

describe('server render without a DOM', () => {
  it('has no window or document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('SettingsSection, SettingRow and NumberField', () => {
    const html = renderToString(
      <SettingsSection title="Alerts" description="d" actions={<button>Reset</button>}>
        <SettingRow label="Limit" htmlFor="limit">
          <NumberField id="limit" value={5} onCommit={noop} min={1} max={9} suffix="days" />
        </SettingRow>
        <SettingRow label="Mode" description="x" status="Saved">
          <button>Go</button>
        </SettingRow>
      </SettingsSection>,
    );
    expect(html).toContain('Alerts');
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('value="5"');
    expect(html).toContain('days');
  });

  it('ServiceTokensSection in each state', () => {
    const tokens = [
      { id: 'a', name: 'Client', scopes: ['read'], created: '2026-10-30', source: 'file' as const, revoked: false },
      { id: 'b', name: 'Old', scopes: ['read'], created: '2026-10-01', source: 'env' as const, revoked: true, revokedAt: '2026-11-01T18:00:00Z' },
    ];
    expect(renderToString(<ServiceTokensSection tokens={tokens} onRevoke={async () => {}} />)).toContain('Client');
    expect(renderToString(<ServiceTokensSection tokens={undefined} onRevoke={async () => {}} />)).toContain('Loading service tokens');
    expect(renderToString(<ServiceTokensSection tokens={undefined} error="Down" onRetry={noop} onRevoke={async () => {}} />)).toContain('Down');
    expect(renderToString(<ServiceTokensSection tokens={[]} onRevoke={async () => {}} />)).toContain('No service tokens');
  });

  it('FilterBar (closed on the server) and FilterSheet', () => {
    const html = renderToString(
      <FilterBar search={{ value: 'x', onChange: noop, label: 'Find' }} activeCount={2} onClear={noop} summary="3 results" trailing={<span>Sort</span>}>
        <button>Open only</button>
      </FilterBar>,
    );
    expect(html).toContain('3 results');
    expect(html).toContain('aria-label="Find"');
    expect(renderToString(<FilterSheet open={false} onClose={noop}>x</FilterSheet>)).toBe('');
  });

  it('SplitStage, SplitDividers and LayoutPresetPicker', () => {
    const layout = presetsFor(3)[0]!.build();
    const stage = renderToString(
      <SplitStage layout={layout} items={['a', 'b', 'c']} slots={['a', 'b', 'c']} resizable renderPane={(id) => <span>{id}</span>} />,
    );
    expect(stage).toContain('relative');
    expect(stage).not.toContain('role="separator"');
    const dividers = renderToString(<SplitDividers layout={layout} w={800} h={450} gap={4} onResize={noop} />);
    expect(dividers.match(/role="separator"/g)).toHaveLength(2);
    const picker = renderToString(<LayoutPresetPicker options={presetOptions(3)} value="cols-3" onChange={noop} />);
    expect(picker).toContain('role="radiogroup"');
    expect(picker).toContain('aria-checked="true"');
  });

  it('Inbox in each state', () => {
    const base = {
      view: 'open' as const,
      counts: { open: 1, snoozed: 0, handled: 0 },
      sources: [],
      source: null,
      onViewChange: noop,
      onSourceChange: noop,
      onHandle: noop,
      onUnhandle: noop,
      onSnooze: noop,
      onUnsnooze: noop,
    };
    const item = {
      id: 1,
      source: 'ci',
      kind: 'k',
      title: 'Build broke',
      body: 'x'.repeat(200),
      url: 'https://example.com',
      severity: 'urgent' as const,
      count: 2,
      createdAt: '2026-11-03T12:00:00.000Z',
      updatedAt: '2026-11-03T12:00:00.000Z',
      occurredAt: '2026-11-03T12:00:00.000Z',
      handledAt: null,
      handledBy: null,
      snoozedUntil: null,
      data: null,
    };
    const html = renderToString(<Inbox {...base} items={[item]} />);
    expect(html).toContain('Build broke');
    expect(html).toContain('href="https://example.com"');
    expect(renderToString(<Inbox {...base} items={[]} loading />)).toContain('Loading');
    expect(renderToString(<Inbox {...base} items={[]} error="Down" />)).toContain('Down');
    expect(renderToString(<Inbox {...base} items={[]} />)).toContain('Nothing open');
  });

  it('SystemCanvas', () => {
    const html = renderToString(
      <SystemCanvas
        groups={[
          { id: 'g', title: 'Apps', column: 0, nodes: [{ id: 'n', label: 'Web', active: true, note: 'deploying' }] },
          { id: 'h', title: 'Infra', column: 1, nodes: [{ id: 'm', label: 'DB' }] },
        ]}
        edges={[{ id: 'e', from: 'n', to: 'm' }]}
        edgeKinds={[{ id: 'k', label: 'Lines' }]}
      />,
    );
    expect(html).toContain('Web');
    expect(html).toContain('aria-label="System map"');
  });

  it('useResource and useUrlState render their defaults', () => {
    expect(renderToString(<Probe />).replace(/<!-- -->/g, '')).toContain('true|a|1|true|x');
  });
});
