// @vitest-environment node
// Every component export renders under renderToString in plain Node (no window, no document),
// which is what a server component or an SSR framework does. A throw, a console.error or an
// empty result fails; a component export with no entry in cases.tsx fails too.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import * as ui from '../../src';
import { Inbox } from '../../src/inbox';
import { ServiceTokensSection } from '../../src/service-tokens';
import { SystemCanvas } from '../../src/system-canvas';
import { cases, hookCases, NOT_COMPONENTS } from './cases';

// The fleet-only components live on their own subpaths since 3.0; they stay covered here.
const subpathComponents = { Inbox, ServiceTokensSection, SystemCanvas };
const componentNames = [
  ...Object.keys(ui).filter(
    (k) => /^[A-Z][a-z]/.test(k) && typeof (ui as Record<string, unknown>)[k] === 'function' && !NOT_COMPONENTS.includes(k),
  ),
  ...Object.keys(subpathComponents),
];

describe('server environment', () => {
  it('has no DOM globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });
});

/** Render nothing in the server HTML on purpose: overlays portal to document.body after mount,
 *  the rest show only once the browser reports state (online, loading, toasts). */
const EMPTY_ON_SERVER = [
  'CommandPalette',
  'ConfirmDialog',
  'ConnectionBanner',
  'Drawer',
  'FilterSheet',
  'LoadingBar',
  'Modal',
  'MoreSheet',
  'Popover',
  'Portal',
  'Toaster',
];

describe('case table', () => {
  it('covers every component export', () => {
    expect(componentNames.filter((n) => !cases[n])).toEqual([]);
  });
  it('names only components that are exported', () => {
    expect(Object.keys(cases).filter((n) => !componentNames.includes(n))).toEqual([]);
  });
});

describe('renderToString', () => {
  let errors: string[];
  let warns: string[];
  beforeEach(() => {
    errors = [];
    warns = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => void errors.push(a.map(String).join(' ')));
    vi.spyOn(console, 'warn').mockImplementation((...a) => void warns.push(a.map(String).join(' ')));
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(Object.keys(cases))('%s renders without throwing or logging', (name) => {
    const html = renderToString(cases[name]!());
    if (EMPTY_ON_SERVER.includes(name)) expect(html, `${name} should render nothing on the server`).toBe('');
    else expect(html.length, `${name} rendered nothing`).toBeGreaterThan(0);
    expect(errors, `${name} console.error`).toEqual([]);
    expect(warns, `${name} console.warn`).toEqual([]);
  });

  // What each hook returns during a server render (no window): the stable first value the client
  // also renders before hydration finishes.
  const SERVER_VALUES: Record<string, unknown> = {
    useTheme: ['system', 'dark', 'dark'],
    useLocalStorage: 'server',
    useMediaQuery: false,
    usePhone: false,
    useNarrow: false,
    useBreakpoint: 'base',
    usePrefersReducedMotion: false,
    useOnline: true,
    useUrlState: { q: '' },
    useIsClient: false,
    useNishStrings: 'Close',
  };

  it('has an expected server value for every hook probe', () => {
    expect(Object.keys(SERVER_VALUES).sort()).toEqual(Object.keys(hookCases).sort());
  });

  it.each(Object.keys(hookCases))('hook %s gives a value on the server', (name) => {
    const html = renderToString(hookCases[name]!());
    expect(html).toContain('data-hook');
    // The probe prints JSON.stringify(value) as text; React escapes the quotes.
    const printed = /<output data-hook="[^"]*">(.*)<\/output>/.exec(html)![1]!.replace(/&quot;/g, '"');
    expect(JSON.parse(printed), `${name} server value`).toEqual(SERVER_VALUES[name]);
    expect(errors).toEqual([]);
    expect(warns).toEqual([]);
  });

  it('renders the same HTML twice (no random ids or clocks leak in)', () => {
    for (const name of ['Field', 'Combobox', 'Tabs', 'RadioGroup', 'Slider', 'Accordion', 'ThemeToggle', 'RelativeTime']) {
      expect(renderToString(cases[name]!()), name).toBe(renderToString(cases[name]!()));
    }
  });

  it('renders provider children on the server', () => {
    expect(renderToString(cases.NishProvider!())).toContain('content');
  });

  it('keeps unsafe hrefs out of the server HTML', () => {
    const html = renderToString(<ui.LinkCard href="javascript:alert(1)" title="Bad" />);
    expect(html).not.toContain('javascript:');
  });

  it('runs the server-safe helpers without a DOM', () => {
    expect(ui.cn('a', false, 'b')).toBe('a b');
    expect(typeof ui.buttonClass()).toBe('string');
    expect(ui.safeUrl('javascript:x')).toBeNull();
  });
});
