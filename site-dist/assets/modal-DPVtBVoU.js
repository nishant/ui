import{N as e,n as t}from"./index-hOL6WPiH.js";import{n,o as r,r as i,s as a,t as o}from"./primitives-DRXRgoF9.js";import{n as s}from"./modal-CraqvfnW.js";import{g as c}from"./icons-Blbu8VGM.js";var l=e(),u=t(),d=[[`Mark price`,`$4.15`],[`Cost basis`,`$3.20`],[`Unrealized gain`,`+$190.00`],[`Days to expiry`,`26`],[`Delta`,`0.42`],[`Implied volatility`,`48%`]];function f({size:e,footer:t,long:i,title:o,subtitle:c,placement:l=`center`,hideClose:f=!1}){return(0,u.jsxs)(s,{title:o,subtitle:c,size:e,placement:l,hideClose:f,closeOnBack:!1,onClose:()=>void 0,footer:t?(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(n,{children:`Cancel`}),(0,u.jsx)(n,{variant:`danger`,children:`Close position`})]}):void 0,children:[(0,u.jsx)(`p`,{children:`Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.`}),i?(0,u.jsxs)(`div`,{className:`mt-4 space-y-3`,children:[d.map(([e,t])=>(0,u.jsxs)(`div`,{className:`flex justify-between border-b border-th-line pb-2`,children:[(0,u.jsx)(`span`,{className:`text-th-hi3`,children:e}),(0,u.jsx)(`span`,{className:`tabular-nums text-th-hi`,children:t})]},e)),(0,u.jsx)(`p`,{children:`Market orders fill at the best available price, which can differ from the mark during fast moves.`})]}):(0,u.jsxs)(`label`,{className:`mt-4 grid gap-1.5`,children:[(0,u.jsx)(a,{children:`Note`}),(0,u.jsx)(r,{placeholder:`Why are you closing?`})]})]})}function p(){let[e,t]=(0,l.useState)(``),n=[`Open board`,`New widget`,`Switch theme`,`Search notes`,`Settings`].filter(t=>t.toLowerCase().includes(e.toLowerCase()));return(0,u.jsx)(s,{"aria-label":`Command palette`,placement:`top`,size:`lg`,closeOnBack:!1,onClose:()=>void 0,header:(0,u.jsxs)(`div`,{className:`flex items-center gap-2 border-b border-th-line px-4 py-3`,children:[(0,u.jsx)(c,{size:16,className:`shrink-0 text-th-hi3`}),(0,u.jsx)(`input`,{"data-autofocus":!0,value:e,onChange:e=>t(e.target.value),placeholder:`Type a command`,"aria-label":`Command`,className:`min-w-0 flex-1 bg-transparent text-base text-th-hi outline-none placeholder:text-th-ghost sm:text-sm`})]}),children:(0,u.jsxs)(`ul`,{className:`-mx-2 grid gap-0.5`,children:[n.map(e=>(0,u.jsx)(`li`,{children:(0,u.jsx)(`button`,{type:`button`,className:`w-full rounded-lg px-3 py-2 text-left text-sm text-th-hi2 hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11`,children:e})},e)),n.length===0?(0,u.jsx)(`li`,{className:`px-3 py-2 text-th-hi3`,children:`No commands match.`}):null]})})}function m({size:e=`2xl`}){return(0,u.jsx)(s,{title:`Compare prices`,size:e,closeOnBack:!1,onClose:()=>void 0,footer:(0,u.jsx)(n,{variant:`primary`,children:`Track all`}),children:(0,u.jsx)(`div`,{className:`grid gap-3 sm:grid-cols-3`,children:[[`Best Buy`,`$449.99`,`In stock`],[`Target`,`$459.99`,`Ships in 2 days`],[`Walmart`,`$449.00`,`Pickup today`]].map(([e,t,n])=>(0,u.jsxs)(i,{children:[(0,u.jsx)(`p`,{className:`text-sm font-semibold text-th-hi`,children:e}),(0,u.jsx)(`p`,{className:`mt-1 text-xl font-semibold tabular-nums text-th-hi`,children:t}),(0,u.jsx)(`p`,{className:`mt-1 text-xs text-th-hi3`,children:n})]},e))})})}function h(){let[e,t]=(0,l.useState)(!1);return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(n,{size:`sm`,onClick:()=>t(!0),children:`Open a real one`}),e?(0,u.jsxs)(s,{title:`Close position`,onClose:()=>t(!1),footer:(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(n,{onClick:()=>t(!1),children:`Cancel`}),(0,u.jsx)(n,{variant:`danger`,onClick:()=>t(!1),children:`Close position`})]}),children:[(0,u.jsx)(`p`,{children:`Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.`}),(0,u.jsx)(`p`,{className:`mt-3 text-th-hi3`,children:`Press Escape, click the backdrop or use a button to close. Tab stays inside the dialog.`})]}):null]})}var g={id:`modal`,name:`Modal`,exports:[`Modal`],summary:`A dialog: a centered panel on wide screens and a bottom sheet under 640px. It closes on Escape and backdrop click, traps Tab, returns focus to the opener and locks page scroll on <html> and <body>.`,importLine:`import { Modal } from '@nish/ui';`,controls:[{key:`title`,label:`Title`,type:`text`},{key:`size`,label:`Size`,type:`select`,options:[`md`,`lg`,`xl`,`2xl`,`full`]},{key:`placement`,label:`Placement`,type:`select`,options:[`center`,`top`]},{key:`footer`,label:`Footer`,type:`boolean`},{key:`long`,label:`Long body`,type:`boolean`},{key:`hideClose`,label:`Hide close`,type:`boolean`}],initial:{title:`Close position`,size:`md`,placement:`center`,footer:!0,long:!1,hideClose:!1},render:e=>(0,u.jsx)(f,{size:e.size,placement:e.placement,footer:!!e.footer,long:!!e.long,hideClose:!!e.hideClose,title:String(e.title)}),code:e=>[`{open ? (`,`  <Modal`,`    title="${String(e.title)}"`,...e.size===`md`?[]:[`    size="${e.size}"`],...e.placement===`top`?[`    placement="top"`]:[],...e.hideClose?[`    hideClose`]:[],`    onClose={() => setOpen(false)}`,...e.footer?[`    footer={`,`      <>`,`        <Button onClick={() => setOpen(false)}>Cancel</Button>`,`        <Button variant="danger" onClick={closePosition}>Close position</Button>`,`      </>`,`    }`]:[],`  >`,`    <p>Close 2 contracts of AMD Nov 20 $180 calls at market?</p>`,`  </Modal>`,`) : null}`].join(`
`),framed:{height:460},html:{height:360,code:`<button type="button" class="nish-btn" data-dialog-open="close-position">Close position</button>

<nish-dialog id="close-position">
  <h2 class="nish-dialog-title">Close position</h2>
  <div class="nish-dialog-body">Close 2 contracts of AMD Nov 20 $180 calls at market?</div>
  <div class="nish-dialog-actions">
    <button type="button" class="nish-btn" data-dialog-close value="cancel">Cancel</button>
    <button type="button" class="nish-btn nish-btn--danger" data-dialog-close value="close">Close position</button>
  </div>
</nish-dialog>

<script>
  document.getElementById('close-position').addEventListener('nish-close', (e) => {
    if (e.detail.value === 'close') console.log('closing the position');
  });
<\/script>`},stories:[{id:`confirm`,name:`Confirm`,render:()=>(0,u.jsx)(f,{size:`md`,footer:!0,long:!1,title:`Close position`})},{id:`details`,name:`Long body, lg`,note:`The body scrolls; the footer stays.`,render:()=>(0,u.jsx)(f,{size:`lg`,footer:!0,long:!0,title:`Review the order`})},{id:`xl`,name:`xl`,render:()=>(0,u.jsx)(f,{size:`xl`,footer:!0,long:!0,title:`Order details`})},{id:`wide`,name:`2xl, cards inside`,note:`Up to 1152px wide, for side-by-side comparisons.`,render:()=>(0,u.jsx)(m,{size:`2xl`})},{id:`full`,name:`full`,note:`The whole screen less a 1rem margin.`,render:()=>(0,u.jsx)(f,{size:`full`,footer:!0,long:!0,title:`Chart`})},{id:`plain`,name:`No footer`,render:()=>(0,u.jsx)(f,{size:`md`,footer:!1,long:!1,title:`Add a note`})},{id:`palette`,name:`Top placement with a header`,note:`placement="top" and header replace the title row; aria-label names the dialog.`,render:()=>(0,u.jsx)(p,{})},{id:`no-close`,name:`Without a close button`,note:`hideClose: Escape and the backdrop still close it.`,render:()=>(0,u.jsx)(f,{size:`md`,footer:!0,long:!1,title:`Pick a board`,hideClose:!0})},{id:`subtitle`,name:`Long title, pinned subtitle`,note:`Titles wrap to two lines; the subtitle stays put while the body scrolls.`,render:()=>(0,u.jsx)(f,{size:`lg`,footer:!0,long:!0,title:`Nintendo Switch 2 Mario Kart World Bundle, Console with Joy-Con 2 and Charging Grip`,subtitle:(0,u.jsxs)(`span`,{className:`flex flex-wrap items-center gap-x-3 gap-y-1`,children:[(0,u.jsx)(`span`,{className:`font-semibold tabular-nums text-th-hi`,children:`$449.99`}),(0,u.jsx)(o,{tone:`ok`,children:`Lowest in 30 days`}),(0,u.jsx)(`span`,{className:`text-th-hi3`,children:`Best Buy · checked 12m ago`})]})})}],usage:`import { useState } from 'react';
import { Button, Modal } from '@nish/ui';

export function DeleteTracker({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      {open ? (
        <Modal
          title="Delete this tracker?"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={onDelete}>Delete</Button>
            </>
          }
        >
          Its price history goes with it.
        </Modal>
      ) : null}
    </>
  );
}

// controlled: no conditional rendering
<Modal open={open} onOpenChange={setOpen} title="Settings">…</Modal>

// a command palette
<Modal aria-label="Command palette" placement="top" header={<SearchField />} onClose={close}>
  {results}
</Modal>`,guidelines:[`Render the Modal only while it is open, or pass open and onOpenChange to control it: unmounting (or open={false}) is what closes it and returns focus to the opener.`,`Put autofocus (or data-autofocus) on the field people should type in first. Otherwise the panel itself takes focus.`,`Keep it to one decision. Long flows belong on a page. For a yes-or-no question, use ConfirmDialog.`,`With header, pass aria-label: the dialog has no visible title to take its name from.`,`Give every Modal a name: a title, or aria-label / aria-labelledby when you pass header. In development a Modal without one logs a warning.`,`Modal renders through a Portal: nothing on the server, and into the NishProvider portalContainer when you set one. A body that overflows becomes a focusable region so keyboard users can scroll it.`,`Page scroll is locked on both <html> and <body>, so apps that scroll the root element need no local lock.`]};export{h as RealModalButton,g as modal};