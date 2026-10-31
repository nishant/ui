import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Button, ConfirmDialog, Drawer, DropdownMenu, MenuItem, Modal, Popover, Toaster, toast } from '../../src';

function Harness() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [nested, setNested] = useState(false);
  const [popover, setPopover] = useState(false);
  const popoverAnchor = useRef<HTMLButtonElement>(null);

  return (
    <main className="flex flex-col items-start gap-3 p-6">
      <Button onClick={() => setModal(true)}>Open modal</Button>
      <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      <Button onClick={() => setConfirm(true)}>Open confirm</Button>
      <Button onClick={() => toast('Saved to the harness')}>Toast</Button>

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

createRoot(document.getElementById('root')!).render(<Harness />);
