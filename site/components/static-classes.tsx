// Stories for nish-components.css, the static component classes. Each story is the
// exact HTML a static page writes (rendered as-is and shown as code), plus the React
// component it mirrors where that component is in this build. The Static sites page
// (site/pages/static-sites.tsx) shows them side by side and in every theme.
import { useId, useState, type ReactNode } from 'react';
import '../../src/css/components.css';
import {
  Badge,
  Button,
  Callout,
  Card,
  Chip,
  ChipGroup,
  Disclosure,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Label,
  Meter,
  SearchInput,
  Segmented,
  Select,
  Stat,
  StatGrid,
  StatusDot,
  Table,
  TableWrap,
  Td,
  Textarea,
  Th,
  ThemeToggle,
  Tr,
} from '../../src';
import { RefreshIcon, SettingsIcon, TrashIcon } from '../lib/icons';
import { Row } from './shared';

export interface StaticStory {
  /** Unique id; also the anchor on the Static sites page. */
  id: string;
  /** The class (or classes) the story shows. */
  cls: string;
  /** The React component this recipe mirrors. */
  mirrors: string;
  name: string;
  note?: string;
  /** The markup. `{id}` is replaced per render, so ids stay unique when a story is
   *  rendered once per theme. */
  html: string;
  /** The React twin, when the component is in this build. */
  react?: () => ReactNode;
}

const svg = (d: string, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const REFRESH = '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>';
const GEAR =
  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>';
const TRASH = '<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>';
const SEARCH = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>';
const THEME_ICONS =
  `<svg data-icon="system" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg>` +
  `<svg data-icon="light" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/></svg>` +
  `<svg data-icon="dark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/></svg>`;

const ROW = 'style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"';
const STACK = 'style="display:grid;gap:12px;width:100%"';

function SearchTwin() {
  const [q, setQ] = useState('');
  return <SearchInput value={q} onChange={setQ} aria-label="Search guides" placeholder="Search guides" />;
}

export const STATIC_STORIES: StaticStory[] = [
  {
    id: 'btn-variants',
    cls: '.nish-btn',
    mirrors: 'Button',
    name: 'Button variants',
    note: 'Secondary is the default. Works on <a> as well as <button>.',
    html: `<div ${ROW}>
  <button type="button" class="nish-btn nish-btn--primary">Save</button>
  <button type="button" class="nish-btn">Cancel</button>
  <button type="button" class="nish-btn nish-btn--soft">Follow</button>
  <button type="button" class="nish-btn nish-btn--subtle">Filter</button>
  <button type="button" class="nish-btn nish-btn--ghost">Skip</button>
  <button type="button" class="nish-btn nish-btn--danger">Delete</button>
  <a class="nish-btn nish-btn--link" href="#/static-sites">View all</a>
</div>`,
    react: () => (
      <Row>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="danger">Delete</Button>
      </Row>
    ),
  },
  {
    id: 'btn-sizes',
    cls: '.nish-btn--xs / --sm / --lg',
    mirrors: 'Button size',
    name: 'Button sizes and states',
    note: 'Every size but link grows to 44px under a coarse pointer. aria-pressed="true" is the selected look.',
    html: `<div ${ROW}>
  <button type="button" class="nish-btn nish-btn--xs">Extra small</button>
  <button type="button" class="nish-btn nish-btn--sm">${svg(REFRESH, 12)}Small</button>
  <button type="button" class="nish-btn">${svg(REFRESH, 14)}Medium</button>
  <button type="button" class="nish-btn nish-btn--lg nish-btn--primary">Large</button>
  <button type="button" class="nish-btn" aria-pressed="true">Pressed</button>
  <button type="button" class="nish-btn nish-btn--primary" disabled>Disabled</button>
</div>`,
    react: () => (
      <Row>
        <Button size="sm" icon={<RefreshIcon size={12} />}>
          Small
        </Button>
        <Button icon={<RefreshIcon size={14} />}>Medium</Button>
        <Button size="lg" variant="primary">
          Large
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Row>
    ),
  },
  {
    id: 'icon-btn',
    cls: '.nish-icon-btn',
    mirrors: 'IconButton',
    name: 'Icon buttons',
    note: 'Always give it aria-label (and title). --sm 28px, --xs 24px, --2xs 20px, --round for circles.',
    html: `<div ${ROW}>
  <button type="button" class="nish-icon-btn" aria-label="Refresh" title="Refresh">${svg(REFRESH)}</button>
  <button type="button" class="nish-icon-btn" aria-label="Settings" title="Settings" aria-pressed="true">${svg(GEAR)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--sm" aria-label="Delete" title="Delete">${svg(TRASH, 14)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--xs" aria-label="Delete" title="Delete">${svg(TRASH, 12)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--2xs" aria-label="Delete" title="Delete">${svg(TRASH, 12)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--round" aria-label="Refresh" title="Refresh">${svg(REFRESH)}</button>
</div>`,
    react: () => (
      <Row>
        <IconButton label="Refresh">
          <RefreshIcon />
        </IconButton>
        <IconButton label="Settings" active>
          <SettingsIcon />
        </IconButton>
        <IconButton label="Delete" size="sm">
          <TrashIcon size={14} />
        </IconButton>
      </Row>
    ),
  },
  {
    id: 'theme-btn',
    cls: '.nish-theme-btn',
    mirrors: 'ThemeToggle compact',
    name: 'Theme button',
    note: 'The button mountThemeToggle(button) fills with three icons; data-choice picks the one shown. Here: system, light, dark.',
    html: `<div ${ROW}>
  <button type="button" class="nish-theme-btn" data-choice="system" aria-label="Theme: System. Switch to Light" title="Theme: System. Switch to Light">${THEME_ICONS}</button>
  <button type="button" class="nish-theme-btn" data-choice="light" aria-label="Theme: Light. Switch to Dark" title="Theme: Light. Switch to Dark">${THEME_ICONS}</button>
  <button type="button" class="nish-theme-btn" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${THEME_ICONS}</button>
</div>`,
    react: () => <ThemeToggle compact />,
  },
  {
    id: 'card',
    cls: '.nish-card',
    mirrors: 'Card',
    name: 'Cards',
    note: '--padded adds the padding, --interactive the hover (for <a> cards), --inset a raised box inside a card.',
    html: `<div ${STACK}>
  <section class="nish-card nish-card--padded">
    <p class="nish-label" style="margin:0 0 6px">Trip</p>
    <p style="margin:0;font-size:14px;color:var(--nish-hi2)">Three nights in Gatlinburg.</p>
    <div class="nish-card nish-card--inset" style="margin-top:12px;padding:10px 12px;font-size:14px">Cabin confirmed</div>
  </section>
  <a class="nish-card nish-card--padded nish-card--interactive" href="#/static-sites">An interactive card (a link)</a>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Card>
          <Label>Trip</Label>
          <p className="mt-1.5 text-sm text-th-hi2">Three nights in Gatlinburg.</p>
        </Card>
        <Card interactive>An interactive card</Card>
      </div>
    ),
  },
  {
    id: 'badge',
    cls: '.nish-badge',
    mirrors: 'Badge',
    name: 'Badges',
    note: 'Tones on their soft tint; --solid uses the fill with on-* text; --tag and --xs for dense labels; hue modifiers keep hi text.',
    html: `<div ${STACK}>
  <div ${ROW}>
    <span class="nish-badge">Draft</span>
    <span class="nish-badge nish-badge--accent">Pinned</span>
    <span class="nish-badge nish-badge--ok">Booked</span>
    <span class="nish-badge nish-badge--loss">Closed</span>
    <span class="nish-badge nish-badge--warn">Pending</span>
    <span class="nish-badge nish-badge--info">New</span>
  </div>
  <div ${ROW}>
    <span class="nish-badge nish-badge--solid">Today</span>
    <span class="nish-badge nish-badge--solid nish-badge--accent">3</span>
    <span class="nish-badge nish-badge--solid nish-badge--loss">12</span>
    <span class="nish-badge nish-badge--tag nish-badge--info">Beta</span>
    <span class="nish-badge nish-badge--xs nish-badge--ok">xs</span>
  </div>
  <div ${ROW}>
    <span class="nish-badge nish-badge--emerald">Emerald</span>
    <span class="nish-badge nish-badge--indigo">Indigo</span>
    <span class="nish-badge nish-badge--amber">Amber</span>
    <span class="nish-badge nish-badge--rose">Rose</span>
    <span class="nish-badge nish-badge--sky">Sky</span>
    <span class="nish-badge nish-badge--violet">Violet</span>
    <span class="nish-badge nish-badge--teal">Teal</span>
    <span class="nish-badge nish-badge--lime">Lime</span>
  </div>
</div>`,
    react: () => (
      <Row>
        <Badge>Draft</Badge>
        <Badge tone="accent">Pinned</Badge>
        <Badge tone="ok">Booked</Badge>
        <Badge tone="loss">Closed</Badge>
        <Badge tone="warn">Pending</Badge>
        <Badge tone="info">New</Badge>
      </Row>
    ),
  },
  {
    id: 'fields',
    cls: '.nish-input / .nish-select / .nish-textarea',
    mirrors: 'Input, Select, Textarea',
    name: 'Fields',
    note: 'aria-invalid="true" turns the border red. 16px text on phones and touch screens, 44px tall on touch.',
    html: `<div ${STACK}>
  <input class="nish-input" aria-label="Name" placeholder="Grotto Falls">
  <input class="nish-input" aria-label="Stack size" value="65" aria-invalid="true">
  <select class="nish-select" aria-label="Mode"><option>Survival</option><option>Creative</option></select>
  <textarea class="nish-textarea" aria-label="Notes" rows="2" placeholder="Notes"></textarea>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Input aria-label="Name" placeholder="Grotto Falls" />
        <Input aria-label="Stack size" defaultValue="65" invalid />
        <Select aria-label="Mode">
          <option>Survival</option>
          <option>Creative</option>
        </Select>
        <Textarea aria-label="Notes" rows={2} placeholder="Notes" />
      </div>
    ),
  },
  {
    id: 'field',
    cls: '.nish-field / .nish-label',
    mirrors: 'Field, Label',
    name: 'Field with hint and error',
    note: 'A <label class="nish-field"> holds the label, the control and a hint or error tied by aria-describedby. --inline puts the label beside it.',
    html: `<div ${STACK}>
  <label class="nish-field">
    <span class="nish-field-label">Blocks per row <span class="nish-optional">Optional</span></span>
    <input class="nish-input" inputmode="numeric" value="16" aria-describedby="{id}-hint">
    <small class="nish-hint" id="{id}-hint">Up to 64.</small>
  </label>
  <label class="nish-field">
    <span class="nish-field-label">Stack size</span>
    <input class="nish-input" value="65" aria-invalid="true" aria-describedby="{id}-err">
    <small class="nish-error" id="{id}-err" role="alert">A stack holds at most 64.</small>
  </label>
  <label class="nish-field nish-field--inline">
    <span class="nish-field-label">Seed</span>
    <input class="nish-input" value="-4172144997902289642">
  </label>
  <span class="nish-label">Section label</span>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Field label="Blocks per row" hint="Up to 64." optional>
          <Input inputMode="numeric" defaultValue="16" />
        </Field>
        <Field label="Stack size" error="A stack holds at most 64.">
          <Input defaultValue="65" />
        </Field>
      </div>
    ),
  },
  {
    id: 'search',
    cls: '.nish-search',
    mirrors: 'SearchInput',
    name: 'Search',
    note: 'A leading icon, and an optional trailing kbd hint or clear button. --bare drops the box for header search bars.',
    html: `<div ${STACK}>
  <label class="nish-search">${svg(SEARCH)}<input class="nish-input" type="search" enterkeyhint="search" aria-label="Search guides" placeholder="Search guides"><kbd>/</kbd></label>
  <label class="nish-search nish-search--bare">${svg(SEARCH)}<input class="nish-input" type="search" aria-label="Search" placeholder="Bare search"></label>
</div>`,
    react: () => <SearchTwin />,
  },
  {
    id: 'seg',
    cls: '.nish-seg',
    mirrors: 'Segmented',
    name: 'Segmented',
    note: 'Children are button[aria-pressed] (role="group") or [role=radio][aria-checked] (role="radiogroup"). --joined and --pills are the two other looks.',
    html: `<div ${STACK}>
  <div class="nish-seg" role="group" aria-label="Range">
    <button type="button" aria-pressed="false">1D</button><button type="button" aria-pressed="true">1W</button><button type="button" aria-pressed="false">1M</button><button type="button" aria-pressed="false">1Y</button>
  </div>
  <div class="nish-seg nish-seg--joined" role="group" aria-label="Mode">
    <button type="button" aria-pressed="true">Survival</button><button type="button" aria-pressed="false">Creative</button><button type="button" aria-pressed="false">Hardcore</button>
  </div>
  <div class="nish-seg nish-seg--pills" role="group" aria-label="Section">
    <button type="button" aria-pressed="true">All</button><button type="button" aria-pressed="false">Builds</button><button type="button" aria-pressed="false">Redstone</button>
  </div>
</div>`,
    react: () => (
      <Segmented
        label="Range"
        value="1w"
        onChange={() => {}}
        options={[
          { value: '1d', label: '1D' },
          { value: '1w', label: '1W' },
          { value: '1m', label: '1M' },
          { value: '1y', label: '1Y' },
        ]}
      />
    ),
  },
  {
    id: 'chip',
    cls: '.nish-chip',
    mirrors: 'Chip, ChipGroup',
    name: 'Chips',
    note: 'Multi-select filters: each chip toggles aria-pressed on its own. --suggestion adds a leading +; --sm is denser.',
    html: `<div class="nish-chips" role="group" aria-label="Ores">
  <button type="button" class="nish-chip" aria-pressed="true">Iron</button>
  <button type="button" class="nish-chip" aria-pressed="false">Gold</button>
  <button type="button" class="nish-chip" aria-pressed="true">Diamond</button>
  <button type="button" class="nish-chip nish-chip--suggestion">Ancient debris</button>
  <button type="button" class="nish-chip nish-chip--sm" aria-pressed="false">Small</button>
</div>`,
    react: () => (
      <ChipGroup label="Ores">
        <Chip pressed>Iron</Chip>
        <Chip>Gold</Chip>
        <Chip pressed>Diamond</Chip>
        <Chip variant="suggestion">Ancient debris</Chip>
      </ChipGroup>
    ),
  },
  {
    id: 'callout',
    cls: '.nish-callout',
    mirrors: 'Callout',
    name: 'Callouts',
    note: 'Neutral by default; --info, --ok, --warn, --loss, --accent tint the box. The icon square is the tone fill with on-* text.',
    html: `<div ${STACK}>
  <div class="nish-callout"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p>Neutral: a plain aside.</p></div></div>
  <div class="nish-callout nish-callout--info"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p class="nish-callout-title">Java only</p><p>Bedrock spawns these differently.</p></div></div>
  <div class="nish-callout nish-callout--ok"><span class="nish-callout-icon" aria-hidden="true">✓</span><div><p>Saved. The realm restarts in a minute.</p></div></div>
  <div class="nish-callout nish-callout--warn"><span class="nish-callout-icon" aria-hidden="true">!</span><div><p>Back up the world first.</p></div></div>
  <div class="nish-callout nish-callout--loss"><span class="nish-callout-icon" aria-hidden="true">!</span><div><p>This deletes the chunk.</p></div></div>
  <div class="nish-callout nish-callout--accent"><span class="nish-callout-icon" aria-hidden="true">★</span><div><p>New in 1.21.</p></div></div>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Callout tone="info" title="Java only">Bedrock spawns these differently.</Callout>
        <Callout tone="warn">Back up the world first.</Callout>
      </div>
    ),
  },
  {
    id: 'stats',
    cls: '.nish-stats > .nish-stat',
    mirrors: 'StatGrid, Stat',
    name: 'Stats',
    note: 'A <dl> grid that fits as many as the width allows. --tinted for a raised fill, --sm for dense rows; value tones --ok, --loss, --warn.',
    html: `<div ${STACK}>
  <dl class="nish-stats">
    <div class="nish-stat"><dt class="nish-stat-label">Blocks</dt><dd class="nish-stat-value">1,284</dd><dd class="nish-stat-sub">20 stacks</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Change</dt><dd class="nish-stat-value nish-stat-value--ok">+4.2%</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Drawdown</dt><dd class="nish-stat-value nish-stat-value--loss">−1.8%</dd></div>
  </dl>
  <dl class="nish-stats nish-stats--tinted nish-stats--sm">
    <div class="nish-stat"><dt class="nish-stat-label">XP</dt><dd class="nish-stat-value">1,395</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Levels</dt><dd class="nish-stat-value">30</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Time</dt><dd class="nish-stat-value nish-stat-value--warn">12 min</dd></div>
  </dl>
</div>`,
    react: () => (
      <StatGrid cols={{ base: 3, md: 3 }} className="w-full">
        <Stat label="Blocks" value="1,284" sub="20 stacks" />
        <Stat label="Change" value="+4.2%" tone="ok" />
        <Stat label="Drawdown" value="−1.8%" tone="loss" />
      </StatGrid>
    ),
  },
  {
    id: 'table',
    cls: '.nish-table-wrap',
    mirrors: 'TableWrap, Table',
    name: 'Table',
    note: 'A scroll box with zebra rows and a quiet caps header; .num cells align right. --sticky keeps the header in view (cap with --nish-table-max-h).',
    html: `<div class="nish-table-wrap nish-table-wrap--sticky" style="--nish-table-max-h:11rem">
  <table>
    <thead><tr><th>Item</th><th>Source</th><th class="num">Per hour</th></tr></thead>
    <tbody>
      <tr><td>Iron</td><td>Golem farm</td><td class="num">1,620</td></tr>
      <tr><td>Gold</td><td>Piglin farm</td><td class="num">4,800</td></tr>
      <tr><td>XP</td><td>Enderman farm</td><td class="num">12,000</td></tr>
      <tr><td>Bamboo</td><td>Observer farm</td><td class="num">9,200</td></tr>
      <tr><td>Kelp</td><td>Zero-tick</td><td class="num">3,100</td></tr>
    </tbody>
  </table>
</div>`,
    react: () => (
      <TableWrap className="w-full">
        <Table zebra>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Source</Th>
              <Th numeric>Per hour</Th>
            </tr>
          </thead>
          <tbody>
            <Tr>
              <Td>Iron</Td>
              <Td>Golem farm</Td>
              <Td numeric>1,620</Td>
            </Tr>
            <Tr>
              <Td>Gold</Td>
              <Td>Piglin farm</Td>
              <Td numeric>4,800</Td>
            </Tr>
          </tbody>
        </Table>
      </TableWrap>
    ),
  },
  {
    id: 'meter',
    cls: '.nish-meter',
    mirrors: 'Meter',
    name: 'Meters',
    note: 'A track holding an <i> whose width (or --value) is the amount. Tones use the -fill roles; --sm 4px, default 8px, --lg 12px.',
    html: `<div ${STACK}>
  <div class="nish-meter" role="meter" aria-label="Accent" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><i style="width:40%"></i></div>
  <div class="nish-meter nish-meter--ok nish-meter--sm" role="meter" aria-label="Durability" aria-valuemin="0" aria-valuemax="100" aria-valuenow="82" style="--value:82%"><i></i></div>
  <div class="nish-meter nish-meter--warn" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="71"><i style="width:71%"></i></div>
  <div class="nish-meter nish-meter--loss nish-meter--lg" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="93"><i style="width:93%"></i></div>
  <div class="nish-meter nish-meter--info" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25"><i style="width:25%"></i></div>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Meter label="Accent" value={40} />
        <Meter label="Durability" value={82} tone="ok" size="sm" />
        <Meter label="Disk" value={71} tone="warn" />
      </div>
    ),
  },
  {
    id: 'disclosure',
    cls: 'details.nish-disclosure',
    mirrors: 'Disclosure',
    name: 'Disclosure',
    note: 'Native <details> with a chevron that turns. --card boxes it.',
    html: `<div ${STACK}>
  <details class="nish-disclosure" open><summary>Sources</summary><p>Minecraft Wiki, tested on Bedrock 1.21.</p></details>
  <details class="nish-disclosure nish-disclosure--card"><summary>What you need</summary><p>Two stacks of glass and a hopper.</p></details>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <Disclosure summary="Sources" defaultOpen>
          Minecraft Wiki, tested on Bedrock 1.21.
        </Disclosure>
        <Disclosure summary="What you need" variant="card">
          Two stacks of glass and a hopper.
        </Disclosure>
      </div>
    ),
  },
  {
    id: 'dot',
    cls: '.nish-dot',
    mirrors: 'StatusDot',
    name: 'Status dots',
    note: 'Always beside visible text (or with a visually hidden label). --xs 6, default 8, --md 10, --lg 14; --halo and --pulse.',
    html: `<div ${ROW}>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--ok" aria-hidden="true"></span>Up</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--warn nish-dot--md" aria-hidden="true"></span>Slow</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--loss nish-dot--halo" aria-hidden="true"></span>Down</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--info nish-dot--xs" aria-hidden="true"></span>Info</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--accent nish-dot--lg nish-dot--pulse" aria-hidden="true"></span>Live</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot" aria-hidden="true"></span>Unknown</span>
</div>`,
    react: () => (
      <Row>
        <span className="inline-flex items-center gap-1.5 text-sm text-th-hi"><StatusDot tone="ok" />Up</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-th-hi"><StatusDot tone="warn" size="md" />Slow</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-th-hi"><StatusDot tone="loss" halo />Down</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-th-hi"><StatusDot tone="accent" size="lg" pulse />Live</span>
      </Row>
    ),
  },
  {
    id: 'empty',
    cls: '.nish-empty / .nish-error-state',
    mirrors: 'EmptyState, ErrorState',
    name: 'Empty and error states',
    html: `<div ${STACK}>
  <div class="nish-empty"><p class="nish-empty-title">No trips yet</p><p>Plan one and it shows up here.</p></div>
  <div class="nish-error-state" role="alert"><p>Failed to load the realm status.</p><button type="button" class="nish-btn nish-btn--sm">Retry</button></div>
</div>`,
    react: () => (
      <div className="grid w-full gap-3">
        <EmptyState title="No trips yet" detail="Plan one and it shows up here." />
        <ErrorState message="Failed to load the realm status." onRetry={() => {}} />
      </div>
    ),
  },
  {
    id: 'theme-btn-pill',
    cls: '.nish-theme-btn--pill / --labelled',
    mirrors: 'ThemeToggle variant="pill"',
    name: 'Theme button as a pill',
    note: 'Next to .nish-pill-link in a top bar: 44px on every pointer, the same pill border. --labelled shows the word mountThemeToggle(button, { showLabel: true }) adds.',
    html: `<div ${ROW}>
  <a class="nish-pill-link" href="#/static-sites" title="Back to nish.software">&larr; nish.software</a>
  <button type="button" class="nish-theme-btn nish-theme-btn--pill" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${THEME_ICONS}</button>
  <button type="button" class="nish-theme-btn nish-theme-btn--labelled" data-choice="light" aria-label="Theme: Light. Switch to Dark" title="Theme: Light. Switch to Dark">${THEME_ICONS}<span data-theme-word aria-hidden="true">Light</span></button>
</div>`,
    react: () => (
      <Row>
        <ThemeToggle variant="pill" />
        <ThemeToggle variant="pill" labels />
      </Row>
    ),
  },
  {
    id: 'pill-link-compact',
    cls: '.nish-pill-link--compact',
    mirrors: 'AppHeader compactPill',
    name: 'Compact hub pill',
    note: 'Under 480px only the arrow shows, in a 44px circle; the words stay for screen readers. data-compact="always" (second pill) keeps it compact at every width.',
    html: `<div ${ROW}>
  <a class="nish-pill-link nish-pill-link--compact" href="#/static-sites" title="Back to nish.software">&larr; <span class="nish-pill-link-label">nish.software</span></a>
  <a class="nish-pill-link nish-pill-link--compact" data-compact="always" href="#/static-sites" title="Back to nish.software">&larr; <span class="nish-pill-link-label">nish.software</span></a>
  <span style="font-family:Georgia,serif">Serif page text</span>
</div>`,
  },
  {
    id: 'badge-on-accent',
    cls: '.nish-badge--on-accent',
    mirrors: 'Badge tone="on-accent"',
    name: 'Badge on a solid accent fill',
    html: `<div ${ROW}>
  <a class="nish-btn nish-btn--primary" href="#/static-sites">Apply <span class="nish-badge nish-badge--on-accent nish-badge--tag nish-badge--xs">Direct</span></a>
</div>`,
    react: () => (
      <Button variant="primary">
        Apply
        <Badge tone="on-accent" size="xs" variant="tag">
          Direct
        </Badge>
      </Button>
    ),
  },
  {
    id: 'meter-neutral',
    cls: '.nish-meter--neutral',
    mirrors: 'Meter tone="neutral"',
    name: 'Neutral meter',
    html: `<div ${STACK}>
  <div class="nish-meter nish-meter--neutral" role="meter" aria-label="Swap used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="39"><i style="width:39%"></i></div>
</div>`,
    react: () => <Meter value={39} label="Swap used" tone="neutral" />,
  },
  {
    id: 'toast',
    cls: '.nish-toast',
    mirrors: 'Toaster',
    name: 'Toast',
    note: 'What showToast() renders (fixed at the bottom center; shown in place here). Tone modifiers tint the border: --ok, --warn, --loss, --info.',
    html: `<div ${STACK}>
  <div class="nish-toast nish-toast--warn" style="position:static;width:100%;animation:none"><p class="nish-toast-body"><strong>mc.nish.software</strong> is not reachable from here. You can still <a href="#/static-sites">open it anyway</a>.</p><button type="button" class="nish-toast-close" aria-label="Dismiss">${svg('<path d="M18 6 6 18M6 6l12 12"/>', 14)}</button></div>
  <div class="nish-toast nish-toast--ok" style="position:static;width:100%;animation:none"><p class="nish-toast-body">Tile hidden.</p><button type="button" class="nish-toast-action">Undo</button><button type="button" class="nish-toast-close" aria-label="Dismiss">${svg('<path d="M18 6 6 18M6 6l12 12"/>', 14)}</button></div>
</div>`,
  },
  {
    id: 'glass',
    cls: '.nish-glass',
    mirrors: 'bg-th-bg/60 backdrop-blur-sm',
    name: 'Glass over imagery',
    note: 'Controls scoped dark (data-theme="dark" data-scheme="dark") over a hero: .nish-glass lets the gradient show through.',
    html: `<div style="width:100%;padding:16px;border-radius:12px;background:linear-gradient(135deg,var(--nish-indigo),var(--nish-teal))">
  <div data-theme="dark" data-scheme="dark" ${ROW}>
    <a class="nish-pill-link nish-glass" href="#/static-sites" title="Back to nish.software">&larr; nish.software</a>
    <button type="button" class="nish-theme-btn nish-theme-btn--pill nish-glass" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${THEME_ICONS}</button>
  </div>
</div>`,
  },
  {
    id: 'in-a-card',
    cls: 'all of them',
    mirrors: 'a calculator panel',
    name: 'In a card',
    note: 'The classes together, the way a calculator page uses them.',
    html: `<section class="nish-card nish-card--padded" style="display:grid;gap:14px;width:100%">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
    <h3 style="margin:0;font-size:14px;font-weight:600">Stack calculator</h3>
    <span class="nish-badge nish-badge--accent">Bedrock</span>
  </div>
  <div class="nish-seg" role="group" aria-label="Unit"><button type="button" aria-pressed="true">Items</button><button type="button" aria-pressed="false">Stacks</button></div>
  <label class="nish-field"><span class="nish-field-label">Items</span><input class="nish-input" inputmode="numeric" value="1284"></label>
  <dl class="nish-stats nish-stats--tinted nish-stats--sm">
    <div class="nish-stat"><dt class="nish-stat-label">Stacks</dt><dd class="nish-stat-value">20</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Left over</dt><dd class="nish-stat-value">4</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Shulkers</dt><dd class="nish-stat-value">0.74</dd></div>
  </dl>
  <div class="nish-meter nish-meter--ok" role="meter" aria-label="Shulker box filled" aria-valuemin="0" aria-valuemax="27" aria-valuenow="20"><i style="width:74%"></i></div>
  <div class="nish-callout nish-callout--info"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p>Ender pearls and snowballs stack to 16.</p></div></div>
  <div style="display:flex;gap:8px"><button type="button" class="nish-btn nish-btn--primary">Copy result</button><button type="button" class="nish-btn nish-btn--ghost">Reset</button></div>
</section>`,
  },
];

/** Renders a story's markup as-is (it is this repo's own static HTML). */
export function StaticHtml({ story, className }: { story: StaticStory; className?: string }) {
  // A suffix per mount keeps ids unique across the all-themes columns.
  const uid = `${story.id}-${useId().replace(/[^\w-]/g, '')}`;
  return <div className={className} dangerouslySetInnerHTML={{ __html: story.html.replaceAll('{id}', uid) }} />;
}

/** The markup as a reader copies it (with a readable id). */
export const storyCode = (story: StaticStory) => story.html.replaceAll('{id}', story.id);
