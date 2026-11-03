import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Button, Card, CardHeader, Modal, Tabs, ThemeToggle, Toaster, toast, cn } from 'nish-ui';

function App() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('a');
  return (
    <main className={cn('mx-auto flex max-w-xl flex-col gap-4 p-4')}>
      <Card>
        <CardHeader title="Vite consumer" />
        <ThemeToggle presets />
        <Tabs
          label="Sections"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Button variant="secondary" onClick={() => toast('Saved')}>
          Toast
        </Button>
      </Card>
      {open ? (
        <Modal title="Hello" onClose={() => setOpen(false)}>
          Modal body
        </Modal>
      ) : null}
      <Toaster />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
