import{o as e}from"./index-CZR_oHil.js";import{t}from"./modal-CszKkROK.js";var n=e();function r({title:e,body:r,confirmLabel:i,tone:a,pending:o,cancelLabel:s}){return(0,n.jsx)(t,{title:e,body:r,confirmLabel:i,cancelLabel:s,tone:a,pending:o,onConfirm:()=>void 0,onCancel:()=>void 0})}var i={id:`confirm-dialog`,name:`ConfirmDialog`,exports:[`ConfirmDialog`],summary:`A yes-or-no question before an action, in place of window.confirm: a small Modal with Cancel and a confirm button. For destructive actions, focus starts on Cancel.`,importLine:`import { ConfirmDialog } from '@nish/ui';`,controls:[{key:`title`,label:`Title`,type:`text`},{key:`body`,label:`Body`,type:`text`},{key:`confirmLabel`,label:`Confirm label`,type:`text`},{key:`tone`,label:`Tone`,type:`select`,options:[`danger`,`primary`]},{key:`pending`,label:`Pending`,type:`boolean`}],initial:{title:`Delete this tracker?`,body:`Its price history goes with it. This cannot be undone.`,confirmLabel:`Delete`,tone:`danger`,pending:!1},render:e=>(0,n.jsx)(r,{title:String(e.title),body:String(e.body)||void 0,confirmLabel:String(e.confirmLabel),tone:e.tone,pending:!!e.pending}),code:e=>[`{confirming ? (`,`  <ConfirmDialog`,`    title="${String(e.title)}"`,...e.body?[`    body="${String(e.body)}"`]:[],`    confirmLabel="${String(e.confirmLabel)}"`,...e.tone===`danger`?[]:[`    tone="${e.tone}"`],`    pending={remove.isPending}`,`    onConfirm={() => remove.mutate(id, { onSettled: () => setConfirming(false) })}`,`    onCancel={() => setConfirming(false)}`,`  />`,`) : null}`].join(`
`),framed:{height:300},stories:[{id:`danger`,name:`Danger`,note:`Focus starts on Cancel.`,render:()=>(0,n.jsx)(r,{title:`Delete this tracker?`,body:`Its price history goes with it. This cannot be undone.`,confirmLabel:`Delete`,tone:`danger`,pending:!1})},{id:`primary`,name:`Primary`,note:`Focus starts on the confirm button.`,render:()=>(0,n.jsx)(r,{title:`Mark 12 jobs as applied?`,body:`They move to the Applied column.`,confirmLabel:`Mark as applied`,tone:`primary`,pending:!1})},{id:`pending`,name:`Pending`,note:`A spinner on the confirm button; Cancel, Escape and the backdrop wait for it.`,render:()=>(0,n.jsx)(r,{title:`Close position?`,body:`2 AMD Nov 20 $180 calls at market.`,confirmLabel:`Close position`,tone:`danger`,pending:!0})},{id:`title-only`,name:`Title only, custom cancel`,render:()=>(0,n.jsx)(r,{title:`Discard this draft?`,confirmLabel:`Discard`,cancelLabel:`Keep editing`,tone:`danger`,pending:!1})}],usage:`import { useState } from 'react';
import { Button, ConfirmDialog } from '@nish/ui';

export function DeleteTracker({ remove }: { remove: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      {open ? (
        <ConfirmDialog
          title="Delete this tracker?"
          body="Its price history goes with it."
          confirmLabel="Delete"
          pending={pending}
          onCancel={() => setOpen(false)}
          onConfirm={async () => {
            setPending(true);
            try { await remove(); setOpen(false); } finally { setPending(false); }
          }}
        />
      ) : null}
    </>
  );
}`,guidelines:[`The dialog has role="alertdialog" and body is its description (aria-describedby), so screen readers read the question and the consequence on open.`,`Render it only while it is open, or pass open and onOpenChange; onCancel is optional when you use onOpenChange.`,`Ask a question in the title and name the action on the button ("Delete", not "OK").`,`Use it in place of window.confirm and of hand-rolled two-step remove buttons.`,`Keep the dialog open while the action runs (pending), and close it when the action settles. Toast the error if it fails.`,`Skip the question for actions that can be undone: do them, and offer Undo in a toast.`]};export{i as confirmDialog};