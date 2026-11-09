import{n as e,ot as t}from"./index-DHPUmasy.js";import{s as n,u as r}from"./docs-DPQrVzhW.js";var i=t(),a=e();function o({items:e}){let t=JSON.stringify(e);return(0,i.useEffect)(()=>{let t=e.map(e=>r[e.tone](e.title,{body:e.body,duration:`sticky`,action:e.action?{label:e.action,onClick:()=>void 0}:void 0}));return()=>t.forEach(n)},[t]),null}var s={id:`toast`,name:`Toast`,exports:[`Toaster`],summary:`Short notices about something that just happened. Mount <Toaster /> once; call toast() from anywhere, including outside React. Errors stay until dismissed.`,importLine:`import { Toaster, toast } from '@nish/ui';`,controls:[{key:`tone`,label:`Tone`,type:`select`,options:[`success`,`error`,`warn`,`info`]},{key:`title`,label:`Title`,type:`text`},{key:`body`,label:`Body`,type:`text`},{key:`action`,label:`Action`,type:`text`}],initial:{tone:`success`,title:`Saved`,body:`Watchlist updated with 3 symbols.`,action:``},render:e=>(0,a.jsx)(o,{items:[{tone:e.tone,title:String(e.title),body:String(e.body)||void 0,action:String(e.action)||void 0}]}),code:e=>{let t=e=>JSON.stringify(String(e)).replace(/"/g,`'`);if(!e.action)return`toast.${e.tone}(${t(e.title)}${e.body?`, ${t(e.body)}`:``});`;let n=e.body?`body: ${t(e.body)}, `:``;return`toast.${e.tone}(${t(e.title)}, { ${n}action: { label: ${t(e.action)}, onClick: undo }, id: 'undo' });`},framed:{height:220},html:{height:240,code:`<div style="display:flex;flex-wrap:wrap;gap:8px">
  <button type="button" class="nish-btn" id="saved">Saved</button>
  <button type="button" class="nish-btn" id="warn">Running low</button>
  <button type="button" class="nish-btn" id="archive">Archive</button>
</div>

<script type="module">
  import { toast } from 'https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements.js';

  document.getElementById('saved').onclick = () => toast('Changes are live.', { tone: 'ok' });
  document.getElementById('warn').onclick = () => toast('Under 20 API calls left today.', { tone: 'warn' });
  document.getElementById('archive').onclick = () =>
    toast('Archived', { action: { label: 'Undo', onClick: () => toast('Restored') } });
<\/script>`},api:{functions:[`toast`,`dismissToast`,`useToast`],interfaces:[`ToastOptions`,`ToastItem`]},stories:[{id:`action`,name:`With an action`,note:`Undo runs, then the toast dismisses. A newer toast with the same id replaces it.`,render:()=>(0,a.jsx)(o,{items:[{tone:`success`,title:`Marked as applied`,body:`Senior Frontend Engineer, Acme`,action:`Undo`}]})},{id:`success`,name:`Success`,render:()=>(0,a.jsx)(o,{items:[{tone:`success`,title:`Saved`,body:`Changes are live.`}]})},{id:`error`,name:`Error`,note:`Stays until dismissed.`,render:()=>(0,a.jsx)(o,{items:[{tone:`error`,title:`Sync failed`,body:`The store returned 503. It will retry in 5 minutes.`}]})},{id:`warn`,name:`Warning`,render:()=>(0,a.jsx)(o,{items:[{tone:`warn`,title:`Running low`,body:`Under 20 API calls left today.`}]})},{id:`info`,name:`Info, title only`,render:()=>(0,a.jsx)(o,{items:[{tone:`info`,title:`New version deployed`}]})},{id:`stack`,name:`Stack`,note:`Newest at the bottom; at most four.`,render:()=>(0,a.jsx)(o,{items:[{tone:`info`,title:`Checking 8 sites`},{tone:`success`,title:`7 sites are up`},{tone:`error`,title:`trackers.nish.software is down`,body:`No response after 10 seconds.`}]})},{id:`long`,name:`Long body`,render:()=>(0,a.jsx)(o,{items:[{tone:`warn`,title:`Some listings were skipped`,body:`Zillow rate-limited the scraper after 120 requests, so 38 listings in 78704 were not refreshed. They will be retried on the next run at 3:00 pm.`}]})}],usage:`// once, at the root
import { Toaster } from '@nish/ui';
<Toaster />

// anywhere: handlers, query callbacks, plain modules
import { toast } from '@nish/ui';
toast.success('Saved', 'Watchlist updated with 3 symbols.');
toast.error('Could not save', err.message); // stays until dismissed

// every call returns the id
const id = toast('Syncing…', { duration: Infinity });
dismissToast(id);

// a pending toast that turns into the result
toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: (e) => 'Could not save: ' + String(e) });

// One Undo slot: a newer change replaces the old toast, so a stale Undo cannot revert it.
toast.success('Archived', { action: { label: 'Undo', onClick: () => restore(id) }, id: 'undo' });

// Lift the stack above a bottom tab bar on phones.
<Toaster offset="calc(4.5rem + env(safe-area-inset-bottom))" />`,guidelines:[`An app with a bottom tab bar passes offset (the bar height plus the safe area) and offsetUntil (where the bar hides: sm, md or lg), so a toast never covers the bar.`,`Static pages: showToast() from @nish/ui/theme (window.nishTheme.showToast) with nish-components.css gives the same toast policy.`,`Toasts confirm what just happened. Anything people must act on belongs on the page or in a Modal.`,`toast.promise(promise, { loading, success, error }) shows a sticky toast while the promise runs and swaps it for the result in the same slot. It returns the promise, so a rejection still reaches your code.`,`Sticky toasts (duration Infinity or 'sticky') and errors are never pushed out by newer ones; when more than four are on screen the oldest ordinary toast goes first.`,`The cards load on demand (a small chunk, preloaded when the browser is idle). Until it loads, or if it cannot, a plain card shows the same text, action and dismiss button.`,`The Dismiss label comes from NishProvider strings (dismiss). The Toaster renders nothing on the server.`,`Errors stay until dismissed, because a failure you did not see is one you will assume succeeded.`,`Keep the title to a few words; put detail in the body.`,`At most one action, and only for something to undo or follow up right now (Undo, View).`,`Timers pause while the toast is hovered or focused, so a reader can reach the action.`]};export{s as toastDoc};