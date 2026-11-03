// A Modal mounted by a server component: it portals to document.body on the client and renders
// nothing on the server, so the HTML matches on hydration.
import { Modal, Toaster } from 'nish-ui';

export default function Overlay() {
  return (
    <main>
      <p>Behind the dialog</p>
      <Modal open title="Hello from the server">
        Modal body
      </Modal>
      <Toaster />
    </main>
  );
}
