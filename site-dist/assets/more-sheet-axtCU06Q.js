import{n as e,ot as t}from"./index-CUoDQDSp.js";import{t as n}from"./nav-CbWg9dkX.js";import{BottomNavDemo as r,DEMO_ITEMS as i,Device as a,Filler as o,MORE_ITEMS as s,t as c,withState as l}from"./bottom-nav-CDtjRvYt.js";var u=t(),d=e();function f({footer:e=!0,startOpen:t=!0}){let[r,a]=(0,u.useState)(t),[f,p]=(0,u.useState)(`home`),m=l(s,f,e=>p(e));return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Settings`,rows:5}),(0,d.jsx)(n,{items:l(i.slice(0,4),f,p),more:{active:s.some(e=>e.key===f)||r,expanded:r,onToggle:()=>a(e=>!e)}}),(0,d.jsx)(c,{open:r,onClose:()=>a(!1),items:m,footer:e?void 0:(0,d.jsx)(`p`,{className:`px-5 py-3 text-xs text-th-hi3`,children:`Signed in as nish@example.com`})})]})}var p={id:`more-sheet`,name:`MoreSheet`,exports:[`MoreSheet`],summary:`The overflow sheet behind the BottomNav More button: a bottom Drawer lifted above the bar so the bar stays visible and tappable. Rows are 52px with an icon, a label and a one-line hint; a Theme row is the default footer. It swipes down to close and closes on Android back.`,importLine:`import { MoreSheet } from '@nish/ui';`,controls:[{key:`footer`,label:`Default theme footer`,type:`boolean`}],initial:{footer:!0},render:e=>(0,d.jsx)(a,{doc:`more-sheet`,args:e,height:520,title:`MoreSheet at 360px`,children:(0,d.jsx)(f,{footer:!!e.footer})}),code:e=>[`<MoreSheet`,`  open={moreOpen}`,`  onClose={() => setMoreOpen(false)}`,`  items={moreItems}`,...e.footer?[]:[`  footer={<AccountRow />}`],`/>`].join(`
`),html:{height:360,code:`<button type="button" class="nish-btn" data-sheet-open="more">Open the sheet</button>

<nish-sheet id="more" label="More">
  <header class="nish-sheet-header">
    <h2 class="nish-sheet-title">More</h2>
    <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">×</button>
  </header>
  <div class="nish-sheet-body">
    <p>A bottom sheet under 640px, a centered panel from 640px. Swipe down, press Escape or tap the backdrop to close it.</p>
  </div>
  <footer class="nish-sheet-footer">
    <button type="button" class="nish-btn nish-btn--primary" data-sheet-close>Done</button>
  </footer>
</nish-sheet>

<script>
  document.getElementById('more').addEventListener('nish-close', () => console.log('closed'));
<\/script>`},stories:[{id:`default`,name:`Over a BottomNav`,note:`The scrim and sheet stop at the bar (bottomOffset is --nish-bottom-nav-h). Swipe the handle down to dismiss.`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`default`,height:520,title:`MoreSheet over a BottomNav`,children:(0,d.jsx)(f,{})})},{id:`footer`,name:`Custom footer`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`footer`,height:520,title:`MoreSheet with a custom footer`,children:(0,d.jsx)(f,{footer:!1})})},{id:`closed`,name:`Opened from the bar`,note:`Tap More in the bar below.`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`closed`,height:420,title:`MoreSheet opened from BottomNav`,children:(0,d.jsx)(r,{count:4,badge:!1,more:!0})})}],usage:`import { BottomNav, MoreSheet, ThemeToggle } from '@nish/ui';

const [moreOpen, setMoreOpen] = useState(false);

<BottomNav items={tabs} more={{ active: false, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }} />
<MoreSheet
  open={moreOpen}
  onClose={() => setMoreOpen(false)}
  items={[
    { key: 'settings', label: 'Settings', icon: <GearIcon />, href: '/settings', hint: 'Account and preferences' },
    { key: 'help', label: 'Help', icon: <HelpIcon />, href: '/help' },
  ]}
/>`,guidelines:[`The title and the Theme row come from the NishProvider more and theme strings; title overrides the title per sheet. Items whose href is not safe are not rendered.`,`Render it next to BottomNav and drive it with the same state as the More button, so aria-expanded stays true.`,`Choosing a row runs its onSelect or follows its href and closes the sheet; you do not close it yourself.`,`Use the hint line for what the page is for, not for its name. Keep it to one line.`,`Without a BottomNav (--nish-bottom-nav-h is 0) it is a plain bottom sheet.`]};export{p as moreSheet};