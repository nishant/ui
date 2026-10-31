import type { ComponentType, SVGProps } from 'react';
import { BellIcon, Button, Card, CheckIcon, ClockIcon, IconButton, MoreIcon, SettingsIcon } from '../../src';
import { CodeBlock } from '../lib/code';
import { PageHeader, Prose, Section } from '../lib/ui';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const UI_ICONS: { name: string; Icon: IconComponent }[] = [
  { name: 'CheckIcon', Icon: CheckIcon },
  { name: 'ClockIcon', Icon: ClockIcon },
  { name: 'MoreIcon', Icon: MoreIcon },
  { name: 'BellIcon', Icon: BellIcon },
  { name: 'SettingsIcon', Icon: SettingsIcon },
];

const SIZES = [
  { px: 16, where: 'Inline with text, in a Badge or a menu row.' },
  { px: 20, where: 'Inside a Button or an IconButton.' },
  { px: 24, where: 'Navigation: NavItem.icon in the NavRail and BottomNav (20 to 24).' },
];

const USAGE = `// package.json: "lucide-react": "^1"
import { Bell, Settings } from 'lucide-react';
import { Button, IconButton } from '@nish/ui';

<Button variant="primary" icon={<Bell size={20} />}>Alerts</Button>
<IconButton label="Settings"><Settings size={20} /></IconButton>

// Navigation items take the same icons at 20 to 24px:
const nav = [{ key: 'alerts', label: 'Alerts', icon: <Bell size={22} />, href: '/alerts' }];`;

export function IconsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Icons"
        lead="Apps use lucide-react. @nish/ui never depends on an icon package: it inlines the few icons its own components need, drawn on lucide's grid so the two sets sit side by side."
      />

      <Section title="The decision">
        <Prose>
          <ul>
            <li>
              <strong>Apps use <code>lucide-react</code> (^1).</strong> It tree-shakes per icon, has a large maintained set, is MIT licensed, and trading, startpage and nishboard already use it.
            </li>
            <li>
              <strong>@nish/ui inlines its own.</strong> The few icons a component needs (the close X, the check, the chevron) are SVGs in the package, drawn on lucide&apos;s 24px grid with a 2px stroke, round caps and joins. That keeps the package free of an icon dependency, so an app is never pinned to one lucide version, and a new icon in an app needs no release of ui.
            </li>
            <li>
              <strong>One style.</strong> Stroke icons that take <code>currentColor</code>, so they follow the theme with no extra classes. Do not mix in filled or two-tone sets.
            </li>
          </ul>
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

      <Section title="Icons @nish/ui exports" note="The icons its components use that apps can also import. Anything else comes from lucide-react.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
        <CodeBlock title="lucide-react with @nish/ui" code={USAGE} />
      </Section>
    </div>
  );
}
