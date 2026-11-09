import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Accordion, AccordionItem } from './accordion';
import { Calendar } from './calendar';
import { AppHeader, ChartLegend, Meter } from './display';
import { WorkflowBoard } from './flow';
import { Inbox, type InboxProps } from './inbox';
import { TabPanel, Tabs } from './tabs';

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const dupKeyErrors = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.filter((c: unknown[]) => String(c[0]).includes('same key') || String(c.join(' ')).includes('same key'));

describe('audit P2 display fixes', () => {
  it('UI-209: vertical Meter with showValue keeps className on the bar', () => {
    render(<Meter label="M" value={50} orientation="vertical" showValue className="h-40" />);
    expect(screen.getByRole('meter').className).toContain('h-40');
  });

  it('UI-179: ChartLegend tolerates duplicate labels', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ChartLegend
        items={[
          { label: 'Same', tone: 'accent' },
          { label: 'Same', tone: 'accent' },
        ] as never}
      />,
    );
    expect(dupKeyErrors(spy)).toHaveLength(0);
  });

  it('UI-178/134: hub pill arrow is hidden from the accessible name', () => {
    render(<AppHeader name="Jobs" themeToggle={false} hub={{ href: 'https://nish.software', label: 'nish.software' }} />);
    expect(screen.getByRole('link', { name: 'nish.software' })).toBeTruthy();
  });

  it('UI-129: Accordion ids resolve for a value with spaces', () => {
    render(
      <Accordion defaultValue="two words">
        <AccordionItem value="two words" title="Two">
          Body
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Two' });
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!);
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(screen.getByRole('region', { name: 'Two' })).toBe(panel);
  });

  it('UI-239: Tabs ids are valid for a value with spaces', () => {
    render(
      <Tabs label="S" value="two words" items={[{ value: 'two words', label: 'Two' }]}>
        <TabPanel value="two words">Body</TabPanel>
      </Tabs>,
    );
    const tab = screen.getByRole('tab', { name: 'Two' });
    expect(tab.id).not.toMatch(/\s/);
    const panel = document.getElementById(tab.getAttribute('aria-controls')!);
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('UI-189: WorkflowBoard tolerates duplicate phase ids', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WorkflowBoard
        phases={[
          { id: 'p', title: 'One' },
          { id: 'p', title: 'Two' },
        ]}
        agents={[]}
      />,
    );
    expect(dupKeyErrors(spy)).toHaveLength(0);
  });

  it('UI-202: an undefined label override keeps the default', () => {
    const props: InboxProps = {
      items: [],
      view: 'open',
      counts: { open: 0, snoozed: 0, handled: 0 },
      sources: [],
      source: null,
      onViewChange: vi.fn(),
      onSourceChange: vi.fn(),
      onHandle: vi.fn(),
      onUnhandle: vi.fn(),
      onSnooze: vi.fn(),
      onUnsnooze: vi.fn(),
      labels: { unsnooze: undefined } as never,
    };
    expect(() => render(<Inbox {...props} />)).not.toThrow();
  });

  it('UI-137: an invalid controlled month behaves as uncontrolled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 12));
    render(<Calendar month="bogus" />);
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeTruthy();
  });
});
