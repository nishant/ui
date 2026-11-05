// One consumer file that uses 20+ components, the hooks and every browser subpath. It is
// type-checked under several TypeScript versions and module resolutions, strict, with
// exactOptionalPropertyTypes and skipLibCheck false, so a broken .d.ts shows up here.
import { useRef, useState } from 'react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Combobox,
  Drawer,
  Field,
  Input,
  Modal,
  NishProvider,
  Pagination,
  Popover,
  RadioGroup,
  ResponsiveTable,
  Segmented,
  Select,
  Slider,
  Switch,
  Tabs,
  TagInput,
  ThemeToggle,
  Toaster,
  buttonClass,
  cn,
  toast,
  useLocalStorage,
  useMediaQuery,
  useNishStrings,
  useTheme,
  type ButtonProps,
  type Column,
  type NavItem,
} from 'nish-ui';
import { money, pct, ago } from 'nish-ui/format';
import { applyTheme, onThemeChange, type ThemeName } from 'nish-ui/theme';
import { seriesColor, useChartTheme } from 'nish-ui/chart';
import { THEMES } from 'nish-ui/tokens';
import { SystemCanvas } from 'nish-ui/system-canvas';
import { Inbox } from 'nish-ui/inbox';
import { ServiceTokensSection } from 'nish-ui/service-tokens';
import { computeRects, type LayoutNode } from 'nish-ui/split-layout';
import * as inbox from 'nish-ui/inbox-client';
import { toast as elToast } from 'nish-ui/elements';
import 'nish-ui/elements/forms';
import 'nish-ui/elements/data';
import 'nish-ui/elements/charts';
import 'nish-ui/elements/all';

type Row = { id: string; name: string; value: number };
const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
  { key: 'value', header: 'Value', cell: (r) => money(r.value), numeric: true, sortValue: (r) => r.value },
];
const nav: NavItem[] = [{ key: 'home', label: 'Home', icon: <span>H</span>, href: '/' }];

export function App() {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState('a');
  const [fruit, setFruit] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [seg, setSeg] = useState<'day' | 'week'>('day');
  const [page, setPage] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [volume, setVolume] = useState(30);
  const [q, setQ] = useState('');
  const [stored, setStored] = useLocalStorage('k', 1);
  const narrow = useMediaQuery('(max-width: 600px)');
  const { theme, setChoice } = useTheme();
  const strings = useNishStrings();
  const anchor = useRef<HTMLButtonElement>(null);
  const t: ThemeName = theme;
  const layout: LayoutNode = { type: 'leaf', slot: 0 };
  const chart = useChartTheme();
  const btn: ButtonProps = { variant: 'primary', children: 'x' };
  applyTheme();
  const off = onThemeChange(() => {});
  off();
  void [t, layout, chart, THEMES, SystemCanvas, Inbox, ServiceTokensSection, computeRects, inbox, seriesColor(0), strings.close, pct(0.1)];

  return (
    <NishProvider locale="en-US" dir="ltr" strings={{ close: 'Close' }}>
      <AppShell name="App" nav={nav}>
        <Card>
          <CardHeader title="Hello" />
          <Badge>new</Badge>
          <Button
            {...btn}
            onClick={() => {
              setOpen(true);
              setDrawer(true);
              toast.success('ok');
              elToast('x');
              setStored(stored + 1);
              setChoice('light');
            }}
          />
          <a className={cn(buttonClass({ variant: 'ghost' }), narrow && 'w-full')} href="/">
            {ago(Date.now())}
          </a>
        </Card>
        <Tabs value={tab} onChange={setTab} items={[{ value: 'a', label: 'A' }]} label="Tabs" />
        <Field label="Name">
          <Input value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Select aria-label="s">
          <option>a</option>
        </Select>
        <Switch checked={on} onChange={(c) => setOn(c)} aria-label="sw" />
        <Checkbox label="c" />
        <RadioGroup
          aria-label="Size"
          value={seg}
          onValueChange={(v) => setSeg(v as 'day' | 'week')}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />
        <Segmented
          label="Range"
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <Slider aria-label="Volume" value={volume} onValueChange={setVolume} />
        <TagInput aria-label="Tags" value={tags} onValueChange={setTags} />
        <Pagination page={page} onPageChange={setPage} pageCount={5} />
        <Combobox options={[{ value: 'a', label: 'A' }]} value={fruit} onChange={(v) => setFruit(v)} aria-label="Fruit" />
        <ResponsiveTable<Row> label="Rows" rows={[{ id: '1', name: 'a', value: 1 }]} columns={columns} rowKey={(r) => r.id} />
        <ThemeToggle presets />
        <button ref={anchor} type="button" onClick={() => setOpen((v) => !v)}>
          anchor
        </button>
        <Popover open={open} onOpenChange={setOpen} anchor={anchor} aria-label="Popover">
          body
        </Popover>
        <Modal title="Hello" onClose={() => setOpen(false)}>
          body
        </Modal>
        <Drawer open={drawer} title="Drawer" onClose={() => setDrawer(false)}>
          body
        </Drawer>
        <Toaster />
      </AppShell>
    </NishProvider>
  );
}
