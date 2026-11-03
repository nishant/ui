// Interactive components rendered straight from a server component. Only serializable props
// cross the boundary: uncontrolled Tabs and Combobox, a nav array of plain objects.
import { AppShell, Combobox, Tabs, ThemeToggle, Toaster } from 'nish-ui';

export default function Shell() {
  return (
    <AppShell name="Consumer" nav={[{ key: 'home', label: 'Home', icon: <span aria-hidden>H</span>, href: '/', active: true }]}>
      <ThemeToggle />
      <Tabs
        label="Sections"
        defaultValue="a"
        items={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />
      <Combobox
        aria-label="Fruit"
        defaultValue="a"
        options={[
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ]}
      />
      <Toaster />
    </AppShell>
  );
}
