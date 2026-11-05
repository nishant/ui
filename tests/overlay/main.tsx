import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AppShell, Button, ConfirmDialog, Drawer, DropdownMenu, MenuItem, Modal, Popover, Toaster, Tooltip, toast } from '../../src';

function Harness() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [nested, setNested] = useState(false);
  const [popover, setPopover] = useState(false);
  const popoverAnchor = useRef<HTMLButtonElement>(null);
  const flipAnchor = useRef<HTMLButtonElement>(null);
  const [flip, setFlip] = useState(false);

  return (
    <main className="flex flex-col items-start gap-3 p-6">
      <Button onClick={() => setModal(true)}>Open modal</Button>
      <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      <Button onClick={() => setConfirm(true)}>Open confirm</Button>
      <Button onClick={() => toast('Saved to the harness')}>Toast</Button>
      <Tooltip tip="Saves your work">
        <Button>Hover target</Button>
      </Tooltip>
      <DropdownMenu trigger={<Button>Fruit</Button>} aria-label="Fruit menu">
        <MenuItem>Apple</MenuItem>
        <MenuItem>Banana</MenuItem>
        <MenuItem disabled>Blocked</MenuItem>
        <MenuItem>Blueberry</MenuItem>
        <MenuItem>Cherry</MenuItem>
      </DropdownMenu>
      <div className="fixed bottom-2 left-2">
        <Button ref={flipAnchor} onClick={() => setFlip((v) => !v)}>
          Flip anchor
        </Button>
      </div>
      <Popover open={flip} onOpenChange={setFlip} anchor={flipAnchor} aria-label="Flip panel">
        <div className="h-40 w-40 text-sm text-th-hi">Tall panel</div>
      </Popover>

      {modal && (
        <Modal title="Harness modal" onClose={() => setModal(false)}>
          <div className="flex flex-col items-start gap-3">
            <input aria-label="Name" className="rounded-lg border border-th-line bg-th-surface px-3 py-2 text-th-hi" />
            <Button onClick={() => setNested(true)}>Open nested confirm</Button>
            <DropdownMenu trigger={<Button>Actions</Button>} aria-label="Actions menu">
              <MenuItem>First action</MenuItem>
              <MenuItem>Second action</MenuItem>
            </DropdownMenu>
            <Button ref={popoverAnchor} onClick={() => setPopover((v) => !v)}>
              Details
            </Button>
            <Popover open={popover} onOpenChange={setPopover} anchor={popoverAnchor} aria-label="Details">
              <p className="text-sm text-th-hi">Popover content</p>
            </Popover>
          </div>
        </Modal>
      )}

      {nested && (
        <ConfirmDialog
          title="Nested question?"
          confirmLabel="Confirm nested"
          tone="primary"
          body={
            <Button
              onClick={() => {
                setNested(false);
                setModal(false);
              }}
            >
              Discard
            </Button>
          }
          onConfirm={() => setNested(false)}
          onCancel={() => setNested(false)}
        />
      )}

      {confirm && (
        <ConfirmDialog title="Top-level question?" confirmLabel="Confirm" onConfirm={() => setConfirm(false)} onCancel={() => setConfirm(false)} />
      )}

      {drawer && (
        <Drawer title="Harness drawer" onClose={() => setDrawer(false)}>
          <p className="text-th-hi">Drawer body</p>
        </Drawer>
      )}

      <Toaster />
    </main>
  );
}

// `?shell`: an AppShell with six sections, so the specs can open the lazily loaded More sheet on the phone bottom bar.
const sections = ['Home', 'Jobs', 'Saved', 'Alerts', 'Reports', 'Settings'].map((label, i) => ({
  key: label.toLowerCase(),
  label,
  icon: <svg aria-hidden="true" width="20" height="20" />,
  href: `#${label.toLowerCase()}`,
  active: i === 0,
}));

const params = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(
  params.has('shell') ? (
    <AppShell name="Shell" nav={sections} toaster={false}>
      <p>Shell page</p>
    </AppShell>
  ) : (
    <Harness />
  ),
);
