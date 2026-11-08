import{n as e}from"./index-CWvyxbiH.js";import{t}from"./jsx-D_XtDQtC.js";import{n,r}from"./primitives-CEp3PU0o.js";import{n as i}from"./feedback-Dl-ZENwq.js";import{g as a,l as o,m as s,n as c,r as l}from"./icons-Cd_5fZ-t.js";var u=e(),d={id:`empty-state`,name:`EmptyState`,exports:[`EmptyState`],summary:`What a list, table or widget shows when there is nothing in it yet: a title, one line of why, and usually one action.`,importLine:`import { EmptyState } from '@nish/ui';`,controls:[{key:`title`,label:`Title`,type:`text`},{key:`detail`,label:`Detail`,type:`boolean`},{key:`icon`,label:`Icon`,type:`boolean`},{key:`action`,label:`Action`,type:`boolean`},{key:`compact`,label:`Compact`,type:`boolean`}],initial:{title:`No price drops yet`,detail:!0,icon:!0,action:!0,compact:!1},render:e=>(0,u.jsx)(`div`,{className:`w-full max-w-lg`,children:(0,u.jsx)(i,{title:String(e.title),detail:e.detail?`Trackers check every hour. Changes show up here.`:void 0,icon:e.icon?(0,u.jsx)(l,{}):void 0,action:e.action?(0,u.jsx)(n,{size:`sm`,children:`Add a tracker`}):void 0,compact:!!e.compact})}),code:e=>t(`EmptyState`,{icon:e.icon?`{<LineChart />}`:void 0,title:String(e.title),detail:e.detail?`Trackers check every hour. Changes show up here.`:void 0,action:e.action?`{<Button size="sm">Add a tracker</Button>}`:void 0,compact:e.compact}),html:{height:260,code:`<div class="nish-empty">
  <p class="nish-empty-title">No price drops yet</p>
  <p>Trackers check every hour. Changes show up here.</p>
  <button class="nish-btn nish-btn--sm">Add a tracker</button>
</div>`},stories:[{id:`page`,name:`On a page`,render:()=>(0,u.jsx)(i,{className:`w-full`,icon:(0,u.jsx)(o,{}),title:`No applications yet`,detail:`Save a job from any listing and it lands here.`,action:(0,u.jsx)(n,{size:`sm`,variant:`primary`,icon:(0,u.jsx)(s,{size:13}),children:`Add a job`})})},{id:`compact`,name:`Compact, in a widget`,render:()=>(0,u.jsx)(r,{padded:!1,className:`h-40 w-full`,children:(0,u.jsx)(i,{compact:!0,icon:(0,u.jsx)(c,{}),title:`No alerts`,detail:`You will see price and status alerts here.`})})},{id:`bare`,name:`Title only`,render:()=>(0,u.jsx)(i,{className:`w-full`,title:`Nothing matches these filters`})},{id:`long`,name:`Long detail`,render:()=>(0,u.jsx)(i,{className:`w-full`,icon:(0,u.jsx)(a,{}),title:`No listings in this area`,detail:`We searched 14 sites for 2-bedroom rentals under $2,400 within 3 miles of downtown Austin. Try widening the radius or raising the budget.`})}],usage:`import { EmptyState, Button } from '@nish/ui';
import { Inbox } from 'lucide-react';

{jobs.length === 0 ? (
  <EmptyState
    icon={<Inbox />}
    title="No applications yet"
    detail="Save a job from any listing and it lands here."
    action={<Button size="sm" onClick={openAdd}>Add a job</Button>}
  />
) : (
  <JobTable jobs={jobs} />
)}`,guidelines:[`Say what is empty, then why or what fills it. Skip the cheerful filler.`,`Use compact inside a Card or widget; the default dashed box is for a whole page or section.`,`For a failed load use ErrorState, not an empty state: they mean different things.`]};export{d as emptyState};