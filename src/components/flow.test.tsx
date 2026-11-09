import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ActivityFeed,
  AgentNode,
  AnimatedList,
  FlowSteps,
  StepBar,
  TickerText,
  WorkflowBoard,
  usePrefersReducedMotion,
  type FlowStepItem,
} from './flow';
import { NishProvider } from './provider';

let reduced = false;

beforeEach(() => {
  reduced = false;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePrefersReducedMotion', () => {
  it('follows the media query', () => {
    const first = renderHook(() => usePrefersReducedMotion());
    expect(first.result.current).toBe(false);
    first.unmount();
    reduced = true;
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------
describe('FlowSteps', () => {
  const steps: FlowStepItem[] = [
    { id: 'a', label: 'Plan', status: 'done' },
    { id: 'b', label: 'Build', status: 'active', meta: '2 of 5' },
    { id: 'c', label: 'Ship', status: 'pending' },
    { id: 'd', label: 'Verify', status: 'failed' },
  ];

  it('is a list named Progress with one item per step; the active step is current', () => {
    render(<FlowSteps steps={steps} />);
    const list = screen.getByRole('list', { name: 'Progress' });
    expect(list.querySelectorAll('li')).toHaveLength(4);
    const items = list.querySelectorAll('li');
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[0].hasAttribute('aria-current')).toBe(false);
    expect(items[0].getAttribute('data-status')).toBe('done');
    expect(screen.getByText('2 of 5')).toBeTruthy();
  });

  it('done and failed steps carry hidden status words; pending and active do not', () => {
    render(<FlowSteps steps={steps} />);
    expect(screen.getByText(', done').className).toContain('sr-only');
    expect(screen.getByText(', failed').className).toContain('sr-only');
    expect(screen.getAllByText(/^, /)).toHaveLength(2);
  });

  it('statusLabels, label and the provider string are used', () => {
    const { rerender } = render(
      <NishProvider strings={{ progress: 'Avancement' }}>
        <FlowSteps steps={steps} statusLabels={{ done: ', fait', failed: ', echec' }} />
      </NishProvider>,
    );
    expect(screen.getByRole('list', { name: 'Avancement' })).toBeTruthy();
    expect(screen.getByText(', fait')).toBeTruthy();
    expect(screen.getByText(', echec')).toBeTruthy();
    rerender(
      <NishProvider strings={{ progress: 'Avancement' }}>
        <FlowSteps steps={steps} label="Plan steps" />
      </NishProvider>,
    );
    expect(screen.getByRole('list', { name: 'Plan steps' })).toBeTruthy();
  });

  it('takes ref, className and rest on the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<FlowSteps ref={ref} steps={steps} className="mt-2" data-x="f" id="fs" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.getAttribute('data-x')).toBe('f');
    expect(ref.current!.id).toBe('fs');
  });

  it('auto orientation goes vertical above 8 steps; an explicit one wins', () => {
    const many: FlowStepItem[] = Array.from({ length: 9 }, (_, i) => ({ id: String(i), label: 'S' + i, status: 'pending' }));
    const { rerender } = render(<FlowSteps steps={many} />);
    expect(screen.getByRole('list').getAttribute('data-orient')).toBe('vertical');
    rerender(<FlowSteps steps={many.slice(0, 8)} />);
    expect(screen.getByRole('list').getAttribute('data-orient')).toBe('auto');
    rerender(<FlowSteps steps={many} orientation="horizontal" />);
    expect(screen.getByRole('list').getAttribute('data-orient')).toBe('horizontal');
  });

  it('sweeps along the connectors when the last step finishes, then stops', () => {
    vi.useFakeTimers();
    const run = (last: FlowStepItem['status']): FlowStepItem[] => [
      { id: 'a', label: 'A', status: 'done' },
      { id: 'b', label: 'B', status: last },
    ];
    const { rerender } = render(<FlowSteps steps={run('active')} />);
    expect(screen.getByRole('list').hasAttribute('data-sweep')).toBe(false);
    rerender(<FlowSteps steps={run('done')} />);
    expect(screen.getByRole('list').getAttribute('data-sweep')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(2 * 60 + 1000 + 10);
    });
    expect(screen.getByRole('list').hasAttribute('data-sweep')).toBe(false);
  });

  it('does not sweep when everything was already done on mount', () => {
    render(<FlowSteps steps={[{ id: 'a', label: 'A', status: 'done' }, { id: 'b', label: 'B', status: 'done' }]} />);
    expect(screen.getByRole('list').hasAttribute('data-sweep')).toBe(false);
  });

  it('a step that finishes gets a data-fx flash that clears after 700ms; mount does not', () => {
    vi.useFakeTimers();
    const mk = (s: FlowStepItem['status']): FlowStepItem[] => [{ id: 'a', label: 'A', status: s }];
    const { container, rerender } = render(<FlowSteps steps={mk('active')} />);
    const node = () => container.querySelector('.nish-flow-node') as HTMLElement;
    expect(node().hasAttribute('data-fx')).toBe(false);
    rerender(<FlowSteps steps={mk('done')} />);
    expect(node().getAttribute('data-fx')).toBe('done');
    act(() => {
      vi.advanceTimersByTime(710);
    });
    expect(node().hasAttribute('data-fx')).toBe(false);
    rerender(<FlowSteps steps={mk('failed')} />);
    expect(node().getAttribute('data-fx')).toBe('failed');
  });

  it('a step moving to a non-final status plays no flash', () => {
    const mk = (s: FlowStepItem['status']): FlowStepItem[] => [{ id: 'a', label: 'A', status: s }];
    const { container, rerender } = render(<FlowSteps steps={mk('pending')} />);
    rerender(<FlowSteps steps={mk('active')} />);
    expect((container.querySelector('.nish-flow-node') as HTMLElement).hasAttribute('data-fx')).toBe(false);
  });

  it('a string label gets its full text as a tooltip wrapper; a node label does not', () => {
    const { container } = render(
      <FlowSteps
        steps={[
          { id: 'a', label: 'Plain text', status: 'pending' },
          { id: 'b', label: <b>Rich</b>, status: 'pending' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.nish-flow-label-tip')).toHaveLength(1);
  });

  it('the last step has no connector', () => {
    const { container } = render(<FlowSteps steps={steps} />);
    expect(container.querySelectorAll('.nish-flow-conn')).toHaveLength(3);
    expect(container.querySelectorAll('.nish-flow-conn')[0].getAttribute('data-on')).toBe('true');
    expect(container.querySelectorAll('.nish-flow-conn')[1].getAttribute('data-on')).toBe('false');
  });
});

// ---------------------------------------------------------------------------------------
describe('StepBar', () => {
  it('is a progressbar with min, max, now and the default name', () => {
    render(<StepBar total={5} done={2} />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('5');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
  });

  it('draws one segment per step up to 12 and one continuous bar above', () => {
    const { container, rerender } = render(<StepBar total={12} done={1} />);
    expect(screen.getByRole('progressbar').children).toHaveLength(12);
    rerender(<StepBar total={13} done={1} />);
    expect(screen.getByRole('progressbar').children).toHaveLength(1);
    expect(container.querySelector<HTMLElement>('[style*="width"]')!.style.width).toMatch(/^7\.69/);
  });

  it('clamps done into 0..total and survives NaN and Infinity', () => {
    const { rerender } = render(<StepBar total={4} done={9} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('4');
    rerender(<StepBar total={4} done={-3} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    rerender(<StepBar total={Number.NaN} done={Number.NaN} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('0');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    rerender(<StepBar total={Infinity} done={1} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('0');
    rerender(<StepBar total={3.9} done={1.9} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('3');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('done segments are filled and the current one pulses only while active', () => {
    const { container, rerender } = render(<StepBar total={3} done={1} active />);
    const fills = () => Array.from(container.querySelectorAll('.origin-left')).map((el) => el.className.includes('scale-x-100'));
    expect(fills()).toEqual([true, false, false]);
    expect(container.querySelectorAll('.motion-safe\\:animate-pulse')).toHaveLength(1);
    rerender(<StepBar total={3} done={1} />);
    expect(container.querySelectorAll('.motion-safe\\:animate-pulse')).toHaveLength(0);
    rerender(<StepBar total={3} done={3} active />);
    expect(container.querySelectorAll('.motion-safe\\:animate-pulse')).toHaveLength(0);
  });

  it('the continuous bar shows the pulse marker only while active and not complete', () => {
    const { container, rerender } = render(<StepBar total={20} done={5} active />);
    expect(container.querySelectorAll('.absolute')).toHaveLength(1);
    rerender(<StepBar total={20} done={20} active />);
    expect(container.querySelectorAll('.absolute')).toHaveLength(0);
    rerender(<StepBar total={20} done={5} />);
    expect(container.querySelectorAll('.absolute')).toHaveLength(0);
  });

  it('label, provider string, ref and rest', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <NishProvider strings={{ progress: 'Avance' }}>
        <StepBar ref={ref} total={2} done={1} id="sb" data-x="s" className="mt-1" />
      </NishProvider>,
    );
    expect(screen.getByRole('progressbar', { name: 'Avance' })).toBe(ref.current);
    expect(ref.current!.id).toBe('sb');
    expect(ref.current!.getAttribute('data-x')).toBe('s');
    expect(ref.current!.className).toContain('mt-1');
    rerender(<StepBar total={2} done={1} label="Steps" />);
    expect(screen.getByRole('progressbar', { name: 'Steps' })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------------------
describe('TickerText', () => {
  it('renders the text with a title and as the chosen tag', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<TickerText ref={ref} text="Reading files" as="p" data-x="t" className="text-xs" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('P');
    expect(ref.current).toBe(el);
    expect(el.title).toBe('Reading files');
    expect(el.getAttribute('data-x')).toBe('t');
    expect(el.className).toContain('text-xs');
    expect(screen.getByText('Reading files').className).toBe('');
  });

  it('a change keeps the old text out for 300ms then drops it', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<TickerText text="one" />);
    rerender(<TickerText text="two" />);
    expect(container.querySelector('.nish-flow-ticker-out')!.textContent).toBe('one');
    expect(container.querySelector('.nish-flow-ticker-out')!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('two').className).toBe('nish-flow-ticker-in');
    act(() => {
      vi.advanceTimersByTime(310);
    });
    expect(container.querySelector('.nish-flow-ticker-out')).toBeNull();
    expect(screen.getByText('two').className).toBe('');
  });

  it('under reduced motion the swap is instant', () => {
    reduced = true;
    const { container, rerender } = render(<TickerText text="one" />);
    rerender(<TickerText text="two" />);
    expect(container.querySelector('.nish-flow-ticker-out')).toBeNull();
    expect(screen.getByText('two')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------------------
describe('AgentNode', () => {
  it('is an article named "label: State" with data-state', () => {
    const ref = createRef<HTMLElement>();
    render(<AgentNode ref={ref} label="Researcher" state="running" data-x="a" className="mt-1" id="ag" />);
    const el = screen.getByRole('article', { name: 'Researcher: Running' });
    expect(ref.current).toBe(el);
    expect(el.getAttribute('data-state')).toBe('running');
    expect(el.getAttribute('data-x')).toBe('a');
    expect(el.id).toBe('ag');
    expect(el.className).toContain('mt-1');
    expect(el.className).toContain('text-start');
  });

  it.each([
    ['queued', 'Queued'],
    ['running', 'Running'],
    ['done', 'Done'],
    ['failed', 'Failed'],
  ] as const)('state %s reads %s', (state, word) => {
    render(<AgentNode label="X" state={state} />);
    expect(screen.getByLabelText(`X: ${word}`)).toBeTruthy();
  });

  it('stateLabels translate the state word', () => {
    render(<AgentNode label="X" state="done" stateLabels={{ done: 'Termine' }} />);
    expect(screen.getByLabelText('X: Termine')).toBeTruthy();
  });

  it('with onClick it is a button that calls it and takes rest props', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLElement>();
    render(<AgentNode ref={ref} label="X" state="queued" onClick={onClick} data-x="b" />);
    const btn = screen.getByRole('button', { name: 'X: Queued' });
    expect(ref.current).toBe(btn);
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('data-x')).toBe('b');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows meta, the model family badge and the activity ticker', () => {
    render(<AgentNode label="X" state="running" model="claude-opus-4" meta="12s" activity="Reading" />);
    expect(screen.getByText('12s')).toBeTruthy();
    expect(screen.getByText('opus')).toBeTruthy();
    expect(screen.getByText('Reading').closest('.nish-flow-ticker')).not.toBeNull();
  });

  it('an unknown model shows its own name; no model and no activity renders no second row', () => {
    const { container, rerender } = render(<AgentNode label="X" state="running" model="gpt-x" />);
    expect(screen.getByText('gpt-x')).toBeTruthy();
    rerender(<AgentNode label="X" state="running" />);
    expect(container.querySelector('.mt-1\\.5')).toBeNull();
  });

  it.each(['opus', 'sonnet', 'haiku', 'fable'])('recognises the %s family case-insensitively', (name) => {
    render(<AgentNode label="X" state="queued" model={`Claude-${name.toUpperCase()}-1`} />);
    expect(screen.getByText(name)).toBeTruthy();
  });

  it('finishing or failing plays a flash; other moves do not', () => {
    const { rerender } = render(<AgentNode label="X" state="queued" />);
    const el = () => screen.getByLabelText(/^X:/);
    rerender(<AgentNode label="X" state="running" />);
    expect(el().hasAttribute('data-fx')).toBe(false);
    rerender(<AgentNode label="X" state="done" />);
    expect(el().getAttribute('data-fx')).toBe('done');
    rerender(<AgentNode label="X" state="failed" />);
    expect(el().getAttribute('data-fx')).toBe('failed');
  });
});

// ---------------------------------------------------------------------------------------
describe('WorkflowBoard', () => {
  const phases = [
    { id: 'p1', title: 'Plan' },
    { id: 'p2', title: 'Build', detail: 'two at a time', model: 'sonnet' },
  ];

  it('groups agents by phase id or title and counts finished/total', () => {
    render(
      <WorkflowBoard
        phases={phases}
        agents={[
          { id: 'a', label: 'A', state: 'done', phase: 'p1' },
          { id: 'b', label: 'B', state: 'running', phase: 'Build' },
          { id: 'c', label: 'C', state: 'failed', phase: 'p2' },
        ]}
      />,
    );
    const plan = screen.getByRole('group', { name: 'Plan' });
    const build = screen.getByRole('group', { name: 'Build' });
    expect(plan.getAttribute('data-state')).toBe('done');
    expect(build.getAttribute('data-state')).toBe('active');
    expect(plan.textContent).toContain('1/1');
    expect(build.textContent).toContain('1/2');
    expect(build.textContent).toContain('two at a time');
    expect(build.querySelectorAll('article')).toHaveLength(2);
    expect(plan.querySelectorAll('article')).toHaveLength(1);
    expect(screen.getByText('sonnet')).toBeTruthy();
  });

  it('an empty phase waits; its text can be renamed and comes from the provider', () => {
    const { rerender } = render(<WorkflowBoard phases={phases} agents={[]} />);
    expect(screen.getByRole('group', { name: 'Plan' }).getAttribute('data-state')).toBe('waiting');
    expect(screen.getAllByText('Waiting')).toHaveLength(2);
    expect(screen.getAllByText('0/0')).toHaveLength(2);
    rerender(
      <NishProvider strings={{ waiting: 'Attente', workflow: 'Flux' }}>
        <WorkflowBoard phases={phases} agents={[]} />
      </NishProvider>,
    );
    expect(screen.getAllByText('Attente')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Flux' })).toBeTruthy();
    rerender(<WorkflowBoard phases={phases} agents={[]} waitingLabel="Idle" label="Board" />);
    expect(screen.getAllByText('Idle')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Board' })).toBeTruthy();
  });

  it('agents with no matching phase land in an Other column (renameable)', () => {
    const { rerender } = render(
      <WorkflowBoard
        phases={phases}
        agents={[
          { id: 'a', label: 'A', state: 'queued', phase: null },
          { id: 'b', label: 'B', state: 'queued', phase: 'nope' },
        ]}
      />,
    );
    const other = screen.getByRole('group', { name: 'Other' });
    expect(other.querySelectorAll('article')).toHaveLength(2);
    expect(other.getAttribute('data-state')).toBe('pending');
    rerender(
      <WorkflowBoard phases={phases} otherLabel="Divers" agents={[{ id: 'a', label: 'A', state: 'queued', phase: null }]} />,
    );
    expect(screen.getByRole('group', { name: 'Divers' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Other' })).toBeNull();
  });

  it('no Other column when every agent has a phase', () => {
    render(<WorkflowBoard phases={phases} agents={[{ id: 'a', label: 'A', state: 'queued', phase: 'p1' }]} />);
    expect(screen.queryByRole('group', { name: 'Other' })).toBeNull();
  });

  it('duplicate phase ids show their agents once', () => {
    render(
      <WorkflowBoard
        phases={[
          { id: 'p', title: 'First' },
          { id: 'p', title: 'Second' },
        ]}
        agents={[{ id: 'a', label: 'A', state: 'queued', phase: 'p' }]}
      />,
    );
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('a phase whose agents are all queued is pending', () => {
    render(<WorkflowBoard phases={phases} agents={[{ id: 'a', label: 'A', state: 'queued', phase: 'p1' }]} />);
    expect(screen.getByRole('group', { name: 'Plan' }).getAttribute('data-state')).toBe('pending');
  });

  it('only new agents rise in after the first render', () => {
    const base = [{ id: 'a', label: 'A', state: 'queued' as const, phase: 'p1' }];
    const { container, rerender } = render(<WorkflowBoard phases={phases} agents={base} />);
    expect(container.querySelectorAll('.nish-flow-rise')).toHaveLength(1);
    rerender(<WorkflowBoard phases={phases} agents={[...base, { id: 'b', label: 'B', state: 'queued', phase: 'p1' }]} />);
    expect(container.querySelectorAll('.nish-flow-rise')).toHaveLength(2);
  });

  it('ref, className and rest on the section', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<WorkflowBoard ref={ref} phases={phases} agents={[]} className="mt-3" data-x="w" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-3');
    expect(ref.current!.getAttribute('data-x')).toBe('w');
  });
});

// ---------------------------------------------------------------------------------------
describe('ActivityFeed', () => {
  const NOW = 1_700_000_000_000;
  const items = [
    { id: 'old', at: NOW - 3_600_000, text: 'Older' },
    { id: 'new', at: NOW - 5_000, text: 'Newer', tone: 'ok' as const, source: 'worker-1' },
  ];

  it('formats ages with the provider locale', () => {
    render(
      <NishProvider locale="de-DE">
        <ActivityFeed items={items} now={NOW} />
      </NishProvider>,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[1].textContent).not.toContain('ago');
  });

  it('lists newest first with relative ages, source and tone', () => {
    render(<ActivityFeed items={items} now={NOW} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].textContent).toContain('Newer');
    expect(rows[1].textContent).toContain('Older');
    expect(rows[0].textContent).toContain('worker-1');
    expect(rows[0].getAttribute('data-tone')).toBe('ok');
    expect(rows[1].getAttribute('data-tone')).toBe('neutral');
    expect(rows[0].textContent).toMatch(/5s|now/);
    expect(rows[1].textContent).toMatch(/1h/);
  });

  it('caps the list at max', () => {
    render(<ActivityFeed items={items} now={NOW} max={1} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Newer')).toBeTruthy();
  });

  it('max of 0 or less shows the empty text', () => {
    render(<ActivityFeed items={items} now={NOW} max={-2} />);
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  it('the empty state uses the provider string, and empty overrides it', () => {
    const { rerender } = render(
      <NishProvider strings={{ noActivity: 'Rien' }}>
        <ActivityFeed items={[]} />
      </NishProvider>,
    );
    expect(screen.getByText('Rien')).toBeTruthy();
    rerender(<ActivityFeed items={[]} empty={<em>Quiet</em>} />);
    expect(screen.getByText('Quiet')).toBeTruthy();
  });

  it('the list is named Activity by default, by the provider or by label', () => {
    const { rerender } = render(<ActivityFeed items={items} now={NOW} />);
    expect(screen.getByRole('list', { name: 'Activity' })).toBeTruthy();
    rerender(
      <NishProvider strings={{ activity: 'Journal' }}>
        <ActivityFeed items={items} now={NOW} />
      </NishProvider>,
    );
    expect(screen.getByRole('list', { name: 'Journal' })).toBeTruthy();
    rerender(<ActivityFeed items={items} now={NOW} label="Events" />);
    expect(screen.getByRole('list', { name: 'Events' })).toBeTruthy();
  });

  it('first-render items are not fresh; an item added later is', () => {
    const { rerender } = render(<ActivityFeed items={items} now={NOW} />);
    expect(document.querySelectorAll('[data-fresh]')).toHaveLength(0);
    rerender(<ActivityFeed items={[...items, { id: 'x', at: NOW, text: 'Brand new' }]} now={NOW} />);
    const fresh = document.querySelectorAll('[data-fresh]');
    expect(fresh).toHaveLength(1);
    expect(fresh[0].textContent).toContain('Brand new');
  });

  it('ref, className and rest land on the list (and on the empty div when empty)', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<ActivityFeed ref={ref} items={items} now={NOW} className="mt-2" data-x="f" />);
    expect(ref.current!.tagName).toBe('OL');
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.getAttribute('data-x')).toBe('f');
    rerender(<ActivityFeed ref={ref} items={[]} className="mt-2" data-x="f" />);
    expect(ref.current!.tagName).toBe('DIV');
    expect(ref.current!.getAttribute('data-x')).toBe('f');
  });
});

// ---------------------------------------------------------------------------------------
describe('AnimatedList', () => {
  const positions = new Map<string, number>();
  const log: string[] = [];
  let animateCalls: { key: string; keyframes: unknown }[] = [];
  let cancelled: string[] = [];

  beforeEach(() => {
    positions.clear();
    log.length = 0;
    animateCalls = [];
    cancelled = [];
    const keyOf = (el: Element) => (el.textContent ?? '').trim();
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', { configurable: true, get() { return positions.get(keyOf(this)) ?? 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', { configurable: true, get() { return 0; } });
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      log.push('rect');
      const top = positions.get(keyOf(this)) ?? 0;
      return { top, bottom: top + 40, left: 0, right: 100, width: 100, height: 40, x: 0, y: top } as DOMRect;
    };
    HTMLElement.prototype.animate = function (this: HTMLElement, keyframes: unknown) {
      const key = keyOf(this);
      animateCalls.push({ key, keyframes });
      return {
        cancel: () => {
          log.push('cancel');
          cancelled.push(key);
        },
        onfinish: null,
      } as unknown as Animation;
    };
  });
  afterEach(() => {
    delete (HTMLElement.prototype as { offsetTop?: number }).offsetTop;
    delete (HTMLElement.prototype as { offsetLeft?: number }).offsetLeft;
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  const List = ({ keys, exitMs }: { keys: string[]; exitMs?: number }) => (
    <AnimatedList items={keys} getKey={(k) => k} exitMs={exitMs}>
      {(k, phase) => <span data-phase-of={phase}>{k}</span>}
    </AnimatedList>
  );
  const layout = (keys: string[]) => keys.forEach((k, i) => positions.set(k, i * 40));

  it('renders a ul of li items; ref, className, itemClassName and rest', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <AnimatedList ref={ref} items={['a', 'b']} getKey={(k) => k} className="space-y-1" itemClassName="py-1" data-x="l" id="al">
        {(k) => k}
      </AnimatedList>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.tagName).toBe('UL');
    expect(ref.current!.className).toBe('space-y-1');
    expect(ref.current!.getAttribute('data-x')).toBe('l');
    expect(ref.current!.id).toBe('al');
    const lis = container.querySelectorAll('li');
    expect(lis).toHaveLength(2);
    expect(lis[0].className).toContain('nish-flow-item');
    expect(lis[0].className).toContain('py-1');
  });

  it('as="ol" and as="div" change the root and the item tags', () => {
    const { container, rerender } = render(
      <AnimatedList as="ol" items={['a']} getKey={(k) => k}>
        {(k) => k}
      </AnimatedList>,
    );
    expect(container.firstElementChild!.tagName).toBe('OL');
    expect(container.querySelector('li')).not.toBeNull();
    rerender(
      <AnimatedList as="div" items={['a']} getKey={(k) => k}>
        {(k) => k}
      </AnimatedList>,
    );
    expect(container.firstElementChild!.tagName).toBe('DIV');
    expect(container.querySelector('li')).toBeNull();
    expect(container.querySelector('.nish-flow-item')!.tagName).toBe('DIV');
  });

  it('first render is idle; a new key enters then settles to idle after 400ms', () => {
    vi.useFakeTimers();
    layout(['a', 'b']);
    const { container, rerender } = render(<List keys={['a']} />);
    expect(container.querySelector('li')!.getAttribute('data-phase')).toBe('idle');
    layout(['a', 'b']);
    rerender(<List keys={['a', 'b']} />);
    const phases = () => Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-phase'));
    expect(phases()).toEqual(['idle', 'enter']);
    expect(container.querySelectorAll('span')[1].getAttribute('data-phase-of')).toBe('enter');
    act(() => {
      vi.advanceTimersByTime(410);
    });
    expect(phases()).toEqual(['idle', 'idle']);
  });

  it('a removed key exits in place (aria-hidden, inert, --nish-flow-exit-ms) and is dropped after exitMs', () => {
    vi.useFakeTimers();
    layout(['a', 'b', 'c']);
    const { container, rerender } = render(<List keys={['a', 'b', 'c']} exitMs={500} />);
    rerender(<List keys={['a', 'c']} exitMs={500} />);
    const lis = () => Array.from(container.querySelectorAll('li'));
    expect(lis().map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
    const b = lis()[1];
    expect(b.getAttribute('data-phase')).toBe('exit');
    expect(b.getAttribute('aria-hidden')).toBe('true');
    expect(b.hasAttribute('inert')).toBe(true);
    expect(b.style.getPropertyValue('--nish-flow-exit-ms')).toBe('500ms');
    expect(lis()[0].hasAttribute('aria-hidden')).toBe(false);
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(lis()).toHaveLength(3);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(lis().map((li) => li.textContent)).toEqual(['a', 'c']);
  });

  it('several removals keep their places and consecutive removals stay in order', () => {
    layout(['a', 'b', 'c', 'd', 'e']);
    const { container, rerender } = render(<List keys={['a', 'b', 'c', 'd', 'e']} />);
    rerender(<List keys={['a', 'd']} />);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-phase'))).toEqual(['idle', 'exit', 'exit', 'idle', 'exit']);
  });

  it('removing the first item keeps it first', () => {
    layout(['a', 'b']);
    const { container, rerender } = render(<List keys={['a', 'b']} />);
    rerender(<List keys={['b']} />);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['a', 'b']);
    expect(container.querySelector('li')!.getAttribute('data-phase')).toBe('exit');
  });

  it('a key that returns during its exit stops exiting', () => {
    layout(['a', 'b']);
    const { container, rerender } = render(<List keys={['a', 'b']} />);
    rerender(<List keys={['a']} />);
    rerender(<List keys={['a', 'b']} />);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-phase'))).toEqual(['idle', 'idle']);
  });

  it('a duplicate key shows the first item once and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<List keys={['dup', 'dup', 'ok']} />);
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('duplicate key "dup"');
  });

  it('under reduced motion changes are instant: no enter, no exit, no slide', () => {
    reduced = true;
    layout(['a', 'b']);
    const { container, rerender } = render(<List keys={['a', 'b']} />);
    layout(['c', 'a']);
    rerender(<List keys={['c', 'a']} />);
    expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['c', 'a']);
    expect(Array.from(container.querySelectorAll('li')).every((li) => li.getAttribute('data-phase') === 'idle')).toBe(true);
    expect(animateCalls).toHaveLength(0);
  });

  it('a reorder slides the items that moved, from their old place', () => {
    layout(['a', 'b', 'c']);
    const { rerender } = render(<List keys={['a', 'b', 'c']} />);
    layout(['c', 'a', 'b']);
    rerender(<List keys={['c', 'a', 'b']} />);
    const byKey = Object.fromEntries(animateCalls.map((c) => [c.key, c.keyframes as { transform: string }[]]));
    expect(Object.keys(byKey).sort()).toEqual(['a', 'b', 'c']);
    expect(byKey.c[0].transform).toBe('translate(0px, 80px)');
    expect(byKey.a[0].transform).toBe('translate(0px, -40px)');
    expect(byKey.c[1].transform).toBe('none');
  });

  it('an item that did not move is not animated', () => {
    layout(['a', 'b']);
    const { rerender } = render(<List keys={['a', 'b']} />);
    layout(['a', 'b', 'c']);
    rerender(<List keys={['a', 'b', 'c']} />);
    expect(animateCalls).toHaveLength(0);
  });

  it('the first render never animates', () => {
    layout(['a', 'b', 'c']);
    render(<List keys={['a', 'b', 'c']} />);
    expect(animateCalls).toHaveLength(0);
  });

  it('a prepend reads every rect once, in one batch, before it touches any animation', () => {
    const keys = Array.from({ length: 10 }, (_, i) => 'k' + i);
    layout(keys);
    const { rerender } = render(<List keys={keys} />);
    const next = ['new', ...keys];
    layout(next);
    log.length = 0;
    rerender(<List keys={next} />);
    // 10 items moved down by one row: one rect read each, no cancels (nothing was running).
    expect(log.filter((l) => l === 'rect')).toHaveLength(10);
    expect(log.filter((l) => l === 'cancel')).toHaveLength(0);
    expect(animateCalls).toHaveLength(10);
  });

  it('interrupting running slides reads all rects, cancels all, then reads all again (2 batches, not 2 per item)', () => {
    const keys = Array.from({ length: 6 }, (_, i) => 'k' + i);
    layout(keys);
    const { rerender } = render(<List keys={keys} />);
    const once = ['n1', ...keys];
    layout(once);
    rerender(<List keys={once} />);
    expect(animateCalls).toHaveLength(6);
    // The six slides are still running when the next prepend arrives.
    const twice = ['n2', ...once];
    layout(twice);
    log.length = 0;
    rerender(<List keys={twice} />);
    const firstCancel = log.indexOf('cancel');
    const lastCancel = log.lastIndexOf('cancel');
    expect(log.filter((l) => l === 'cancel')).toHaveLength(6);
    expect(log.slice(0, firstCancel).every((l) => l === 'rect')).toBe(true);
    // Seven items move (the six running ones and the one that just arrived): one drawn rect each.
    expect(log.slice(0, firstCancel)).toHaveLength(7);
    expect(log.slice(firstCancel, lastCancel + 1).every((l) => l === 'cancel')).toBe(true);
    expect(log.slice(lastCancel + 1).every((l) => l === 'rect')).toBe(true);
    expect(log.slice(lastCancel + 1)).toHaveLength(6);
    expect(cancelled.sort()).toEqual([...keys].sort());
  });

  it('starts at most 50 slides per update', () => {
    vi.stubGlobal('innerHeight', 1_000_000);
    const keys = Array.from({ length: 80 }, (_, i) => 'k' + i);
    layout(keys);
    const { rerender } = render(<List keys={keys} />);
    const next = ['new', ...keys];
    layout(next);
    rerender(<List keys={next} />);
    expect(animateCalls).toHaveLength(50);
    // The first 50 in list order are the ones that animate.
    expect(animateCalls.map((c) => c.key)).toEqual(keys.slice(0, 50));
  });

  it('animates only items on screen', () => {
    vi.stubGlobal('innerHeight', 200);
    vi.stubGlobal('innerWidth', 400);
    const keys = Array.from({ length: 40 }, (_, i) => 'k' + i);
    layout(keys);
    const { rerender } = render(<List keys={keys} />);
    const next = ['new', ...keys];
    layout(next);
    rerender(<List keys={next} />);
    // Rows are 40px; only those starting within the 200px viewport slide.
    expect(animateCalls.length).toBeGreaterThan(0);
    expect(animateCalls.length).toBeLessThanOrEqual(7);
    expect(animateCalls.some((c) => c.key === 'k39')).toBe(false);
  });

  it('removing the focused item moves focus to a staying neighbour', () => {
    function Row({ k }: { k: string }) {
      return <button>{k}</button>;
    }
    const keysOf = (ks: string[]) => (
      <AnimatedList items={ks} getKey={(k) => k}>
        {(k) => <Row k={k} />}
      </AnimatedList>
    );
    layout(['a', 'b', 'c']);
    const { rerender } = render(keysOf(['a', 'b', 'c']));
    screen.getByText('b').focus();
    expect(document.activeElement).toBe(screen.getByText('b'));
    rerender(keysOf(['a', 'c']));
    expect(document.activeElement).toBe(screen.getByText('c'));
  });

  it('unmount clears pending timers', () => {
    vi.useFakeTimers();
    layout(['a', 'b']);
    const { rerender, unmount } = render(<List keys={['a']} />);
    rerender(<List keys={['a', 'b']} />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a ref callback is not re-run for items that did not change', () => {
    layout(['a', 'b']);
    const { container, rerender } = render(<List keys={['a', 'b']} />);
    const first = container.querySelectorAll('li')[0];
    rerender(<List keys={['a', 'b']} exitMs={900} />);
    expect(container.querySelectorAll('li')[0]).toBe(first);
  });
});
