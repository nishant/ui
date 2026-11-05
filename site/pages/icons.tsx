import type { ComponentType, SVGProps } from 'react';
import {
  AlertTriangleIcon,
  BellIcon,
  Button,
  CalendarIcon,
  Card,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  IconButton,
  InfoIcon,
  LoaderIcon,
  MonitorIcon,
  MoonIcon,
  MoreIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PauseIcon,
  PlayIcon,
  RotateIcon,
  SettingsIcon,
  SunIcon,
  XIcon,
} from '../../src';
import { CodeBlock } from '../lib/code';
import { PageHeader, Prose, Section } from '../lib/ui';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const UI_ICONS: { name: string; Icon: IconComponent }[] = [
  { name: 'XIcon', Icon: XIcon },
  { name: 'CheckIcon', Icon: CheckIcon },
  { name: 'CheckCircleIcon', Icon: CheckCircleIcon },
  { name: 'AlertTriangleIcon', Icon: AlertTriangleIcon },
  { name: 'InfoIcon', Icon: InfoIcon },
  { name: 'RotateIcon', Icon: RotateIcon },
  { name: 'LoaderIcon', Icon: LoaderIcon },
  { name: 'SunIcon', Icon: SunIcon },
  { name: 'MoonIcon', Icon: MoonIcon },
  { name: 'MonitorIcon', Icon: MonitorIcon },
  { name: 'ChevronDownIcon', Icon: ChevronDownIcon },
  { name: 'ClockIcon', Icon: ClockIcon },
  { name: 'MoreIcon', Icon: MoreIcon },
  { name: 'BellIcon', Icon: BellIcon },
  { name: 'SettingsIcon', Icon: SettingsIcon },
  { name: 'PanelLeftCloseIcon', Icon: PanelLeftCloseIcon },
  { name: 'PanelLeftOpenIcon', Icon: PanelLeftOpenIcon },
  { name: 'ChevronLeftIcon', Icon: ChevronLeftIcon },
  { name: 'ChevronRightIcon', Icon: ChevronRightIcon },
  { name: 'CalendarIcon', Icon: CalendarIcon },
  { name: 'PauseIcon', Icon: PauseIcon },
  { name: 'PlayIcon', Icon: PlayIcon },
];

const SIZES = [
  { px: 16, where: 'Inline with text, in a Badge or a menu row.' },
  { px: 20, where: 'Inside a Button or an IconButton.' },
  { px: 24, where: 'Navigation: NavItem.icon in the NavRail and the BottomNav.' },
];

/** The one icon to use for each common action, so the same action looks the same in every app. */
const ACTIONS: [action: string, lucide: string, note?: string][] = [
  ['Delete', 'Trash2'],
  ['Refresh', 'RefreshCw'],
  ['Edit', 'Pencil'],
  ['Close, dismiss', 'X', 'nish-ui: XIcon'],
  ['Settings', 'Settings', 'nish-ui: SettingsIcon'],
  ['Search', 'Search'],
  ['External link', 'ExternalLink'],
  ['Add, new', 'Plus'],
  ['More actions', 'Ellipsis', 'MoreHorizontal in older lucide; nish-ui: MoreIcon'],
  ['Copy', 'Copy'],
  ['Download, export', 'Download'],
  ['Upload, import', 'Upload'],
  ['Filter', 'Funnel', 'Filter in older lucide'],
  ['Sort', 'ArrowUpDown'],
  ['Back', 'ArrowLeft'],
  ['Expand, collapse', 'ChevronDown', 'rotated 180° when open; nish-ui: ChevronDownIcon'],
];

const USAGE = `// package.json: "lucide-react": "^1"
import { Bell, Settings, Trash2 } from 'lucide-react';
import { Button, IconButton } from 'nish-ui';

<Button variant="primary" icon={<Bell size={20} />}>Alerts</Button>
<IconButton label="Settings"><Settings size={20} /></IconButton>
<IconButton label="Delete"><Trash2 size={20} /></IconButton>

// Navigation items take 24px icons:
const nav = [{ key: 'alerts', label: 'Alerts', icon: <Bell size={24} />, href: '/alerts' }];`;

const GLYPH = `// src/components/icons.tsx: a new glyph uses the shared Svg wrapper,
// which sets viewBox="0 0 24 24", stroke="currentColor", strokeWidth 2,
// round caps and joins, and aria-hidden.
export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 17v5M9 10.76V6h6v4.76l2 3.24H7z" />
  </Svg>
);`;

export function IconsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Icons"
        lead="Use lucide-react for UI icons. nish-ui never depends on an icon package: it inlines the few icons its own components need, drawn on lucide's grid so the two sets sit side by side."
      />

      <Section title="The rule">
        <Prose>
          <p>
            <strong>Apps use <code>lucide-react</code> (^1) for every UI icon.</strong> It tree-shakes per icon, has a large maintained set and is MIT licensed. Do not add another icon set.
          </p>
          <p>
            <strong>nish-ui inlines its own.</strong> The icons a component needs (the close X, the check, the chevron) are SVGs in the package, drawn on lucide&apos;s 24px grid. That keeps the package free of an icon dependency, so an app is never pinned to one lucide version, and a new icon in an app needs no release of ui.
          </p>
          <p>
            <strong>One style.</strong> Stroke icons that take <code>currentColor</code>, so they follow the theme with no extra classes. Do not mix in filled or two-tone sets.
          </p>
        </Prose>
      </Section>

      <Section title="Sizes" note="Pass size, not width and height classes. The stroke stays 2px at every size.">
        <div className="grid gap-3 sm:grid-cols-3">
          {SIZES.map((s) => (
            <Card key={s.px} className="space-y-3">
              <div className="flex items-center gap-3 text-th-hi">
                <BellIcon size={s.px} />
                <SettingsIcon size={s.px} />
                <CheckIcon size={s.px} />
              </div>
              <p className="font-mono text-sm text-th-hi">{s.px}px</p>
              <p className="text-sm text-th-hi2">{s.where}</p>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="primary" icon={<BellIcon size={20} />}>
            Alerts
          </Button>
          <IconButton label="Settings">
            <SettingsIcon size={20} />
          </IconButton>
        </div>
      </Section>

      <Section title="Standard actions" note="Use these for the common actions, so delete or refresh looks the same in every app. Names are lucide-react exports.">
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-th-line text-left text-xs uppercase tracking-wide text-th-hi2">
                <th scope="col" className="px-4 py-2.5 font-medium">Action</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Icon</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map(([action, lucide, note]) => (
                <tr key={action} className="border-b border-th-line last:border-0">
                  <td className="px-4 py-2.5 align-top text-th-hi">{action}</td>
                  <td className="px-4 py-2.5 align-top">
                    <code className="font-mono text-th-hi">{lucide}</code>
                    {note && <span className="block text-xs text-th-hi2">{note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="A glyph lucide does not have" note="Rare: look in lucide first.">
        <Prose>
          <p>
            Draw it on the same grid: a 24px viewBox, a 2px stroke, round caps and joins, no fill, <code>currentColor</code>. Add it to nish-ui&apos;s <code>src/components/icons.tsx</code> and export it from the root, so every app shares one copy. Never start a parallel icon set in an app.
          </p>
        </Prose>
        <CodeBlock title="A new glyph in icons.tsx" code={GLYPH} />
      </Section>

      <Section title="Icons nish-ui exports" note="The icons its components use, which apps can also import. Anything else comes from lucide-react.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {UI_ICONS.map(({ name, Icon }) => (
            <Card key={name} className="flex flex-col items-center gap-3 text-center">
              <span className="text-th-hi">
                <Icon size={24} />
              </span>
              <code className="font-mono text-xs text-th-hi2 [overflow-wrap:anywhere]">{name}</code>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="In an app">
        <CodeBlock title="lucide-react with nish-ui" code={USAGE} />
      </Section>
    </div>
  );
}
