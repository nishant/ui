// A broad page of components for the a11y specs. Query string:
//   ?open=modal|drawer|confirm|menu|popover|command   opens that overlay on load
//   ?dir=rtl                                          right-to-left
// The theme comes from localStorage 'nish-theme' (applyTheme), like an app.
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { applyTheme } from '../../src/theme';
import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Badge,
  BellIcon,
  Breadcrumbs,
  Button,
  Callout,
  Card,
  Checkbox,
  Chip,
  ChipGroup,
  CommandPalette,
  ConfirmDialog,
  Combobox,
  Drawer,
  DropdownMenu,
  Field,
  FileDropzone,
  IconButton,
  Input,
  Meter,
  MenuItem,
  Modal,
  NumberField,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  ResponsiveTable,
  Segmented,
  Select,
  Separator,
  Slider,
  Spinner,
  StatusDot,
  Switch,
  Table,
  Tabs,
  TagInput,
  Textarea,
  ThemeToggle,
  Toaster,
  Tooltip,
  Td,
  Th,
  Tr,
  toast,
} from '../../src';

const params = new URLSearchParams(location.search);
applyTheme();
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';
const open = params.get('open');

function Page() {
  const [tab, setTab] = useState('a');
  const [seg, setSeg] = useState('a');
  const [fruit, setFruit] = useState('a');
  const [on, setOn] = useState(true);
  const [num, setNum] = useState(3);
  const [page, setPage] = useState(3);
  const anchor = useRef<HTMLButtonElement>(null);
  const [modal, setModal] = useState(open === 'modal');
  const [drawer, setDrawer] = useState(open === 'drawer');
  const [confirm, setConfirm] = useState(open === 'confirm');
  const [popover, setPopover] = useState(open === 'popover');
  const [command, setCommand] = useState(open === 'command');

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-th-hi">Accessibility harness</h1>
      <header className="flex flex-wrap items-center gap-2" aria-label="Actions">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
        <Button loading>Saving</Button>
        <IconButton label="Notifications">
          <BellIcon />
        </IconButton>
        <ThemeToggle presets />
        <Tooltip tip="Saves your work">
          <Button>Hover target</Button>
        </Tooltip>
        <DropdownMenu trigger={<Button>Fruit menu</Button>} aria-label="Fruit menu">
          <MenuItem>Apple</MenuItem>
          <MenuItem>Banana</MenuItem>
        </DropdownMenu>
        <Button ref={anchor} onClick={() => setPopover((v) => !v)}>
          Popover
        </Button>
        <Button onClick={() => setModal(true)}>Open modal</Button>
        <Button onClick={() => setDrawer(true)}>Open drawer</Button>
        <Button onClick={() => toast('Saved')}>Toast</Button>
      </header>

      <Card className="flex flex-col gap-4 p-4">
        <Field label="Name" hint="As on your card">
          <Input placeholder="Ada Lovelace" />
        </Field>
        <Field label="Email" error="Enter a valid address">
          <Input type="email" defaultValue="nope" />
        </Field>
        <Field label="Notes">
          <Textarea placeholder="Anything else" />
        </Field>
        <Field label="Plan">
          <Select defaultValue="b">
            <option value="a">Free</option>
            <option value="b">Pro</option>
          </Select>
        </Field>
        <Combobox
          aria-label="Fruit"
          value={fruit}
          onChange={(v) => setFruit(v ?? "")}
          options={[
            { value: 'a', label: 'Apple' },
            { value: 'b', label: 'Banana' },
          ]}
        />
        <NumberField aria-label="Count" value={num} onCommit={(v) => setNum(v ?? 0)} />
        <Checkbox label="Send me the newsletter" defaultChecked />
        <Switch checked={on} onChange={setOn} aria-label="Notifications on" />
        <RadioGroup
          aria-label="Size"
          defaultValue="m"
          options={[
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large', disabled: true },
          ]}
        />
        <Slider aria-label="Volume" defaultValue={40} />
        <Slider aria-label="Price range" defaultValue={[20, 70]} />
        <TagInput aria-label="Tags" defaultValue={['design', 'a11y']} />
        <FileDropzone name="files" />
        <Segmented
          label="View"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'a', label: 'List' },
            { value: 'b', label: 'Grid' },
          ]}
        />
        <ChipGroup label="Filters">
          <Chip pressed>Active</Chip>
          <Chip>Archived</Chip>
        </ChipGroup>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        label="Sections"
        items={[
          { value: 'a', label: 'Overview' },
          { value: 'b', label: 'Details' },
        ]}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Page' },
        ]}
      />
      <Pagination page={page} onPageChange={setPage} pageCount={12} />
      <Accordion type="single" defaultValue="a" label="FAQ">
        <AccordionItem value="a" title="What is it?">
          A design system.
        </AccordionItem>
        <AccordionItem value="b" title="Does it work offline?">
          Yes.
        </AccordionItem>
      </Accordion>
      <Separator label="or" />
      <div className="flex items-center gap-3">
        <AvatarGroup max={3}>
          <Avatar name="Ada Lovelace" status="ok" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Edsger Dijkstra" />
        </AvatarGroup>
        <Badge>New</Badge>
        <StatusDot tone="ok" label="Healthy" />
        <Spinner />
      </div>
      <Progress value={60} aria-label="Upload" />
      <Progress aria-label="Working" />
      <Meter value={0.4} label="Disk" />
      <Callout>Heads up: this is a callout.</Callout>
      <ResponsiveTable
        label="People"
        rows={[
          { id: '1', name: 'Ada', role: 'Engineer' },
          { id: '2', name: 'Grace', role: 'Admiral' },
        ]}
        rowKey={(r: { id: string }) => r.id}
        columns={[
          { key: 'name', header: 'Name', cell: (r: { name: string }) => r.name },
          { key: 'role', header: 'Role', cell: (r: { role: string }) => r.role },
        ]}
      />
      <Table aria-label="Plain table">
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Score</Th>
          </tr>
        </thead>
        <tbody>
          <Tr>
            <Td>Ada</Td>
            <Td>10</Td>
          </Tr>
        </tbody>
      </Table>

      <Toaster />
      <Popover open={popover} onOpenChange={setPopover} anchor={anchor} aria-label="Details">
        <div className="p-3 text-sm text-th-hi">Popover content</div>
      </Popover>
      <Modal open={modal} onClose={() => setModal(false)} title="Edit profile">
        <p className="text-th-hi2">Dialog body</p>
        <Button onClick={() => setModal(false)}>Done</Button>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters">
        <p className="text-th-hi2">Drawer body</p>
      </Drawer>
      <ConfirmDialog
        open={confirm}
        title="Delete project?"
        confirmLabel="Delete"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
      <CommandPalette open={command} onOpenChange={setCommand} items={[{ id: '1', label: 'Open settings' }]} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Page />);
