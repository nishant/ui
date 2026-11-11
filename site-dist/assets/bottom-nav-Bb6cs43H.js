import{ct as e,o as t}from"./index-CZR_oHil.js";import{t as n}from"./nav-yuOIYpvD.js";import{t as r}from"./more-sheet-CDB0zkZf.js";import{DEMO_ITEMS as i,Device as a,Filler as o,MORE_ITEMS as s,withState as c}from"./device-DJCLbzdy.js";var l=e(),u=t();function d({count:e=4,badge:t=!0,more:a=!1,trailing:d=!1,hideFrom:f=`md`}){let[p,m]=(0,l.useState)(`home`),[h,g]=(0,l.useState)(!1),_=c(i.slice(0,e),p,m).map(e=>t&&e.key===`alerts`?{...e,badge:3}:e),v=s.some(e=>e.key===p);return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(o,{title:`Home`}),(0,u.jsx)(n,{items:_,hideFrom:f,more:a?{active:v||h,expanded:h,onToggle:()=>g(e=>!e)}:void 0,trailing:d?(0,u.jsx)(`span`,{className:`px-3 text-xs text-th-hi3`,children:`+`}):void 0}),(0,u.jsx)(r,{open:h,onClose:()=>g(!1),items:c(s,p,e=>{m(e),g(!1)})})]})}var f=e=>({count:Number(e.count),badge:!!e.badge,more:!!e.more,trailing:!!e.trailing,hideFrom:e.hideFrom??`md`}),p={id:`bottom-nav`,name:`BottomNav`,exports:[`BottomNav`],summary:`The phone tab bar: up to five destinations pinned to the bottom of the screen, opaque, with a pill on the current one and safe-area padding. It publishes its height as --nish-bottom-nav-h so toasts, page padding and sheets clear it, and hides itself from the md breakpoint, where NavRail takes over.`,importLine:`import { BottomNav } from '@nish/ui';`,controls:[{key:`count`,label:`Items`,type:`number`,min:2,max:5},{key:`badge`,label:`Badge on Alerts`,type:`boolean`},{key:`more`,label:`More button`,type:`boolean`},{key:`trailing`,label:`Trailing slot`,type:`boolean`},{key:`hideFrom`,label:`Hide from`,type:`select`,options:[`md`,`lg`]}],initial:{count:4,badge:!0,more:!0,trailing:!1,hideFrom:`md`},render:e=>(0,u.jsx)(a,{doc:`bottom-nav`,args:e,title:`BottomNav at 360px`,height:480,children:(0,u.jsx)(d,{...f(e)})}),code:e=>[`<BottomNav`,`  items={[`,...i.slice(0,Number(e.count)).map(t=>`    { key: '${t.key}', label: '${t.label}', icon: <${t.label}Icon />, href: '/${t.key}', active: page === '${t.key}'${e.badge&&t.key===`alerts`?`, badge: 3`:``} },`),`  ]}`,...e.more?[`  more={{ active: moreActive, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }}`]:[],...e.trailing?[`  trailing={<AddButton />}`]:[],...e.hideFrom===`lg`?[`  hideFrom="lg"`]:[],`/>`].join(`
`),html:{height:240,code:`<nish-bottom-nav label="Sections">
  <a href="/" aria-current="page">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
    <span>Home</span>
  </a>
  <a href="/trips">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>
    <span>Trips</span>
  </a>
  <a href="/settings">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
    <span>Settings</span>
  </a>
</nish-bottom-nav>`},stories:[{id:`four`,name:`Four destinations`,note:`Each cell is a 56px-tall target; the current page is a tinted pill with aria-current="page".`,render:()=>(0,u.jsx)(a,{doc:`bottom-nav`,story:`four`,title:`BottomNav, four items`,height:420,children:(0,u.jsx)(d,{count:4,badge:!1})})},{id:`more`,name:`Five with a More sheet`,note:`Tap More: the sheet rises above the bar and the bar stays tappable.`,render:()=>(0,u.jsx)(a,{doc:`bottom-nav`,story:`more`,title:`BottomNav with More`,height:480,children:(0,u.jsx)(d,{count:4,badge:!0,more:!0})})},{id:`unfolded`,name:`Unfolded (840px): gone`,note:`From md the bar hides and publishes nothing; a NavRail takes over.`,wide:!0,render:()=>(0,u.jsx)(a,{doc:`bottom-nav`,story:`unfolded`,width:840,height:300,title:`BottomNav at 840px`,children:(0,u.jsx)(d,{count:4})})}],usage:`import { useState } from 'react';
import { AppHeader, BottomNav, MoreSheet, PageContainer } from '@nish/ui';

export function Shell({ children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <AppHeader name="trips" />
      <PageContainer>{children}</PageContainer>
      <BottomNav
        items={tabs}
        more={{ active: onMorePage, expanded: moreOpen, onToggle: () => setMoreOpen((o) => !o) }}
      />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} items={moreItems} />
    </>
  );
}`,guidelines:[`The landmark takes the NishProvider sections string; pass label to name it differently. Items whose href is not safe (javascript:, data:) are not rendered. The current item is also marked data-state="active", and drawn in the system highlight color in forced-colors mode.`,`Four or five destinations at most; put the rest behind the More button and a MoreSheet.`,`Give PageContainer (or the class nish-pad-bottom-inset) to the page so its last row clears the bar. Do not add your own bottom padding.`,`Pass renderLink to use your router's Link; the bar adds the className and aria-current for you.`,`Do not pass Toaster an offset: it reads --nish-bottom-nav-h and sits above the bar by itself.`,`The bar is opaque on purpose. Content scrolls under it, so a see-through bar would show text through the labels.`]};export{d as BottomNavDemo,p as bottomNav};