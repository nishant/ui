// The scenarios hydration.spec.ts renders on the server (Node) and hydrates in Chromium. The
// same module is bundled twice, once per side, so both sides build the same tree.
import type { ReactElement } from 'react';
import {
  AppHeader,
  AppShell,
  Button,
  Combobox,
  Modal,
  Tabs,
  ThemeToggle,
  Toaster,
  toast,
  useLocalStorage,
  useTheme,
} from '../../src';

const nav = [
  { key: 'home', label: 'Home', icon: <span aria-hidden>H</span>, href: '/', active: true },
  { key: 'set', label: 'Settings', icon: <span aria-hidden>S</span>, href: '/settings' },
];

function Stored() {
  const [value] = useLocalStorage('hydration-key', 'server');
  return <output data-testid="stored">{value}</output>;
}

function ThemeProbe() {
  const t = useTheme();
  return (
    <output data-testid="theme">
      {t.choice}/{t.theme}/{t.scheme}
    </output>
  );
}

export interface Scenario {
  render: () => ReactElement;
  /** Runs in the browser after hydration. */
  after?: () => void;
}

export const scenarios: Record<string, Scenario> = {
  toaster: {
    render: () => (
      <main>
        <Toaster />
        <Button>Plain</Button>
      </main>
    ),
    after: () => void toast('Saved after hydration'),
  },
  'app-shell': {
    render: () => (
      <AppShell name="Demo" nav={nav}>
        <p>Page body</p>
      </AppShell>
    ),
  },
  'theme-toggle': {
    render: () => (
      <main>
        <ThemeToggle presets />
        <ThemeProbe />
      </main>
    ),
  },
  'app-header': {
    render: () => <AppHeader name="Demo" hub={{ href: 'https://nish.software', label: 'nish.software' }} />,
  },
  'modal-open': {
    render: () => (
      <main>
        <Modal open onClose={() => {}} title="Open on load">
          Dialog body
        </Modal>
        <p>Behind the dialog</p>
      </main>
    ),
  },
  'local-storage': {
    render: () => (
      <main>
        <Stored />
      </main>
    ),
  },
  /** Deliberately wrong: proves the spec notices a mismatch. */
  mismatch: {
    render: () => <p>{typeof window === 'undefined' ? 'server' : 'client'}</p>,
  },
  mixed: {
    render: () => (
      <AppShell name="Demo" nav={nav}>
        <Toaster />
        <Tabs
          value="a"
          onChange={() => {}}
          label="Sections"
          items={[
            { value: 'a', label: 'One' },
            { value: 'b', label: 'Two' },
          ]}
        />
        <Combobox
          aria-label="Fruit"
          value="a"
          onChange={() => {}}
          options={[
            { value: 'a', label: 'Apple' },
            { value: 'b', label: 'Banana' },
          ]}
        />
        <ThemeToggle />
        <Stored />
      </AppShell>
    ),
  },
};
