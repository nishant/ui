import { useState } from 'react';
import { Button, NumberField, SettingRow, SettingsSection, Select, Switch, Textarea, useSaveStatus } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Settings blocks ------------------------------------------------------------------
// Registered by the integrator: needs the settings exports in src/index.ts and the names in
// site/docgen.mjs COMPONENTS before COMPONENT_DOCS can list it.

const fakeSave = (fail = false) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (fail ? reject(new Error('Could not reach the server')) : resolve()), 700));

function ScannerDemo({ withStatus = true, failSave = false }: { withStatus?: boolean; failSave?: boolean }) {
  const [auto, setAuto] = useState(true);
  const [cadence, setCadence] = useState('15');
  const [drop, setDrop] = useState<number | null>(5);
  const [notes, setNotes] = useState('Skip refurbished listings.');
  const save = useSaveStatus();
  return (
    <div className="w-full space-y-6">
      <SettingsSection title="Scanner" description="How often prices are checked and when you hear about it.">
        <SettingRow label="Scan automatically" description="Check every tracker on a schedule." htmlFor="demo-auto" inline>
          <Switch id="demo-auto" aria-label="Scan automatically" checked={auto} onCheckedChange={setAuto} />
        </SettingRow>
        <SettingRow label="Check every" htmlFor="demo-cadence">
          <Select id="demo-cadence" value={cadence} onChange={(e) => setCadence(e.target.value)} disabled={!auto} className="sm:w-40">
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="60">1 hour</option>
          </Select>
        </SettingRow>
        <SettingRow
          label="Alert on a drop of"
          description="Notify me when a price falls by at least this much."
          htmlFor="demo-drop"
          status={withStatus ? save.label : undefined}
          statusTone={save.tone}
        >
          <NumberField
            id="demo-drop"
            value={drop}
            min={0}
            max={100}
            precision={1}
            suffix="%"
            onCommit={async (n) => {
              await save.run(fakeSave(failSave));
              if (!failSave) setDrop(n);
              else throw new Error('Could not reach the server');
            }}
          />
        </SettingRow>
        <SettingRow label="Notes" description="Shown next to every alert." htmlFor="demo-notes" stacked>
          <Textarea id="demo-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full" />
        </SettingRow>
      </SettingsSection>
      <SettingsSection title="Danger zone" description="These cannot be undone.">
        <SettingRow label="Delete all trackers" description="Removes every tracker and its price history.">
          <Button variant="danger">Delete everything</Button>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

export const settingsDoc: ComponentDoc = {
  id: 'settings',
  name: 'Settings',
  exports: ['SettingsSection', 'SettingRow', 'NumberField'],
  summary:
    'The settings page blocks: a titled section that holds rows, a row that pairs a label with any control, and a number field that saves when you leave it. Rows sit side by side from 640px and stack below.',
  importLine: "import { SettingsSection, SettingRow, NumberField, useSaveStatus } from '@nish/ui';",
  controls: [
    { key: 'status', label: 'Show save status', type: 'boolean' },
    { key: 'failSave', label: 'Make saves fail', type: 'boolean' },
  ],
  initial: { status: true, failSave: false },
  render: (a) => <ScannerDemo key={String(a.failSave)} withStatus={!!a.status} failSave={!!a.failSave} />,
  code: (a) =>
    [
      jsx('SettingsSection', { title: 'Scanner', description: 'How often prices are checked.' }, '…'),
      jsx(
        'SettingRow',
        { label: 'Alert on a drop of', htmlFor: 'drop', status: a.status ? '{save.label}' : undefined, statusTone: a.status ? '{save.tone}' : undefined },
        '<NumberField id="drop" value={drop} suffix="%" onCommit={…} />',
      ),
    ].join('\n'),
  html: {
    height: 360,
    code: `<section class="nish-settings-section" aria-labelledby="notify">
  <div class="nish-settings-section-header">
    <div>
      <h2 class="nish-settings-section-title" id="notify">Notifications</h2>
      <p class="nish-settings-section-description">Where alerts go.</p>
    </div>
  </div>
  <div class="nish-settings-section-body">
    <div class="nish-setting-row nish-setting-row--inline">
      <div>
        <label class="nish-setting-row-label" for="push">Push</label>
        <p class="nish-setting-row-description">On this phone.</p>
      </div>
      <div class="nish-setting-row-control">
        <button type="button" class="nish-switch" role="switch" aria-checked="true" id="push"></button>
        <span class="nish-setting-row-status nish-setting-row-status--ok" role="status">Saved</span>
      </div>
    </div>
    <div class="nish-setting-row">
      <div>
        <label class="nish-setting-row-label" for="digest">Digest</label>
        <p class="nish-setting-row-description">How often the summary email arrives.</p>
      </div>
      <div class="nish-setting-row-control">
        <select class="nish-select" id="digest"><option>Daily</option><option>Weekly</option></select>
      </div>
    </div>
  </div>
</section>
<script>
  document.getElementById('push').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
    e.currentTarget.setAttribute('aria-checked', String(on));
  });
</script>`,
  },
  stories: [
    {
      id: 'scanner',
      name: 'Switch, Select, NumberField and Textarea rows',
      note: 'The Switch row is inline (the control stays at the end of the label row on a phone); the Textarea row is stacked.',
      wide: true,
      render: () => <ScannerDemo />,
    },
    {
      id: 'failing',
      name: 'A save that fails',
      note: 'The field restores the old value and shows the error under it; the row status shows it for three seconds.',
      render: () => (
        <SettingsSection title="Alerts" className="w-full">
          <FailingRow />
        </SettingsSection>
      ),
    },
    {
      id: 'compact',
      name: 'Compact, for a modal or a sheet',
      note: 'compact drops the Card and tightens the rows: a small heading, 44px rows with the label beside the control at every width.',
      render: () => <CompactDemo />,
    },
    {
      id: 'negative',
      name: 'NumberField with negatives',
      note: 'A field whose min is below zero opens the full keyboard on phones, since the iOS decimal keypad has no minus key. It is a spinbutton: screen readers hear its range and its value with the suffix.',
      render: () => <NegativeDemo />,
    },
    {
      id: 'actions',
      name: 'Section with actions',
      render: () => (
        <SettingsSection
          title="Display"
          description="Applies on this device."
          className="w-full"
          actions={
            <Button size="sm" variant="ghost">
              Reset
            </Button>
          }
        >
          <SettingRow label="Compact rows" inline>
            <Switch aria-label="Compact rows" checked={false} onCheckedChange={() => {}} />
          </SettingRow>
        </SettingsSection>
      ),
    },
  ],
  usage: `import { SettingsSection, SettingRow, NumberField, useSaveStatus, Switch } from '@nish/ui';

function Alerts({ settings, patch }) {
  const save = useSaveStatus();
  return (
    <SettingsSection title="Alerts" description="When to tell you.">
      <SettingRow label="Email me" htmlFor="email" inline>
        <Switch id="email" aria-label="Email me" checked={settings.email} onCheckedChange={(v) => patch({ email: v })} />
      </SettingRow>
      <SettingRow label="Drop threshold" htmlFor="drop" status={save.label} statusTone={save.tone}>
        <NumberField
          id="drop"
          value={settings.drop}
          min={0}
          max={100}
          suffix="%"
          onCommit={(n) => save.run(patch({ drop: n }))}
        />
      </SettingRow>
    </SettingsSection>
  );
}`,
  guidelines: [
    'One SettingsSection per topic, with a short title; put destructive rows in their own "Danger zone" section last.',
    'Pass htmlFor so the label is a real label for the control. A Switch with no visible label of its own needs aria-label.',
    'Use inline for Switch and Checkbox rows so the control stays at the end of the label row on a phone; use stacked for textareas and other wide controls.',
    'NumberField saves on blur and Enter, so there is no Save button. Return the promise from onCommit so the field shows a spinner and restores the old value if the save fails.',
    'NumberField clamps to min and max. Give a field that can go negative a min below zero, so phones show a keyboard with a minus key. Arrow keys step by step.',
    'Use compact inside a Modal, Drawer or side panel, where a Card inside the surface would be a box in a box.',
    'Feed useSaveStatus().label and .tone into a row status, so the result is announced politely and not only shown.',
    'SettingsSection, SettingRow and NumberField take ref, id, className and every other attribute of their root element (section, div, input); NumberField passes them to its input. useSaveStatus, NumberField\'s "Enter a number" and its saving spinner use the saving, saved, saveFailed and enterNumber strings of <NishProvider>.',
  ],
  api: { functions: ['useSaveStatus'], interfaces: ['SaveStatus'] },
};

function FailingRow() {
  const save = useSaveStatus();
  return (
    <SettingRow label="Alert on a drop of" htmlFor="fail-drop" status={save.label} statusTone={save.tone}>
      <NumberField
        id="fail-drop"
        value={5}
        min={0}
        max={100}
        suffix="%"
        onCommit={async () => {
          await save.run(fakeSave(true));
          throw new Error('Could not reach the server');
        }}
      />
    </SettingRow>
  );
}

function CompactDemo() {
  const [sound, setSound] = useState(true);
  const [snooze, setSnooze] = useState<number | null>(10);
  return (
    <div className="w-full max-w-sm rounded-xl border border-th-line bg-th-elevated p-4">
      <SettingsSection title="Alerts" description="On this device." compact>
        <SettingRow label="Sound" htmlFor="compact-sound">
          <Switch id="compact-sound" aria-label="Sound" checked={sound} onCheckedChange={setSound} />
        </SettingRow>
        <SettingRow label="Snooze for" htmlFor="compact-snooze">
          <NumberField id="compact-snooze" value={snooze} min={1} max={120} suffix="min" onCommit={setSnooze} />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function NegativeDemo() {
  const [offset, setOffset] = useState<number | null>(-2);
  return (
    <SettingsSection title="Clock" className="w-full">
      <SettingRow label="Offset from market time" description="Between -12 and 12 hours." htmlFor="neg-offset">
        <NumberField id="neg-offset" value={offset} min={-12} max={12} suffix="h" onCommit={setOffset} />
      </SettingRow>
    </SettingsSection>
  );
}
