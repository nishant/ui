import{ct as e,o as t}from"./index-CZR_oHil.js";import{t as n}from"./nav-yuOIYpvD.js";import{t as r}from"./more-sheet-CDB0zkZf.js";import{DEMO_ITEMS as i,Device as a,Filler as o,MORE_ITEMS as s,withState as c}from"./device-DJCLbzdy.js";import{BottomNavDemo as l}from"./bottom-nav-Bb6cs43H.js";var u=e(),d=t();function f({footer:e=!0,startOpen:t=!0}){let[a,l]=(0,u.useState)(t),[f,p]=(0,u.useState)(`home`),m=c(s,f,e=>p(e));return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Settings`,rows:5}),(0,d.jsx)(n,{items:c(i.slice(0,4),f,p),more:{active:s.some(e=>e.key===f)||a,expanded:a,onToggle:()=>l(e=>!e)}}),(0,d.jsx)(r,{open:a,onClose:()=>l(!1),items:m,footer:e?void 0:(0,d.jsx)(`p`,{className:`px-5 py-3 text-xs text-th-hi3`,children:`Signed in as nish@example.com`})})]})}var p={id:`more-sheet`,name:`MoreSheet`,exports:[`MoreSheet`],summary:`The overflow sheet behind the BottomNav More button: a bottom Drawer lifted above the bar so the bar stays visible and tappable. Rows are 52px with an icon, a label and a one-line hint; a Theme row is the default footer. It swipes down to close and closes on Android back.`,importLine:`import { MoreSheet } from '@nish/ui';`,controls:[{key:`footer`,label:`Default theme footer`,type:`boolean`}],initial:{footer:!0},render:e=>(0,d.jsx)(a,{doc:`more-sheet`,args:e,height:520,title:`MoreSheet at 360px`,children:(0,d.jsx)(f,{footer:!!e.footer})}),code:e=>[`<MoreSheet`,`  open={moreOpen}`,`  onClose={() => setMoreOpen(false)}`,`  items={moreItems}`,...e.footer?[]:[`  footer={<AccountRow />}`],`/>`].join(`
`),html:{height:420,code:`<button type="button" class="nish-btn" data-sheet-open="more">Open the sheet</button>

<nish-sheet id="more" label="More">
  <header class="nish-sheet-header">
    <h2 class="nish-sheet-title">More</h2>
    <button type="button" class="nish-icon-btn" data-sheet-close aria-label="Close">×</button>
  </header>
  <nav class="nish-sheet-body" aria-label="More">
    <ul class="nish-list">
      <li><a class="nish-list-row" href="#inbox">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13v6h16v-6"/><path d="M4 13l3-8h10l3 8h-5a3 3 0 0 1-6 0z"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Inbox</span><span class="nish-list-subtitle">Messages from your apps</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#security">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Security</span><span class="nish-list-subtitle">Sign-ins and devices</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#appearance">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Appearance</span><span class="nish-list-subtitle">Theme and density</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
      <li><a class="nish-list-row" href="#settings">
        <span class="nish-list-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg></span>
        <span class="nish-list-text"><span class="nish-list-title">Settings</span><span class="nish-list-subtitle">Account and preferences</span></span>
        <svg class="nish-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </a></li>
    </ul>
  </nav>
  <footer class="nish-sheet-footer">
    <button type="button" class="nish-btn nish-btn--primary" data-sheet-close>Done</button>
  </footer>
</nish-sheet>

<script>
  document.getElementById('more').addEventListener('nish-close', () => console.log('closed'));
<\/script>`},stories:[{id:`default`,name:`Over a BottomNav`,note:`The scrim and sheet stop at the bar (bottomOffset is --nish-bottom-nav-h). Swipe the handle down to dismiss.`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`default`,height:520,title:`MoreSheet over a BottomNav`,children:(0,d.jsx)(f,{})})},{id:`footer`,name:`Custom footer`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`footer`,height:520,title:`MoreSheet with a custom footer`,children:(0,d.jsx)(f,{footer:!1})})},{id:`closed`,name:`Opened from the bar`,note:`Tap More in the bar below.`,render:()=>(0,d.jsx)(a,{doc:`more-sheet`,story:`closed`,height:420,title:`MoreSheet opened from BottomNav`,children:(0,d.jsx)(l,{count:4,badge:!1,more:!0})})}],usage:`import { BottomNav, MoreSheet, ThemeToggle } from '@nish/ui';

const [moreOpen, setMoreOpen] = useState(false);

<BottomNav items={tabs} more={{ active: false, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }} />
<MoreSheet
  open={moreOpen}
  onClose={() => setMoreOpen(false)}
  items={[
    { key: 'settings', label: 'Settings', icon: <GearIcon />, href: '/settings', hint: 'Account and preferences' },
    { key: 'help', label: 'Help', icon: <HelpIcon />, href: '/help' },
  ]}
/>`,guidelines:[`The title and the Theme row come from the NishProvider more and theme strings; title overrides the title per sheet. Items whose href is not safe are not rendered.`,`Render it next to BottomNav and drive it with the same state as the More button, so aria-expanded stays true.`,`Choosing a row runs its onSelect or follows its href and closes the sheet; you do not close it yourself.`,`Use the hint line for what the page is for, not for its name. Keep it to one line.`,`Pass renderLink to render each row's link yourself, for your router's Link. Spread the props it receives (className, children, aria-current, onClick) onto the link; replace is true inside the sheet.`,`Without a BottomNav (--nish-bottom-nav-h is 0) it is a plain bottom sheet.`]};export{p as moreSheet};