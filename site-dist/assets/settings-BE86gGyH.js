import{N as e,n as t}from"./index-BUruvXdh.js";import{t as n}from"./jsx-D_XtDQtC.js";import{c as r,n as i}from"./primitives-BpetIy_G.js";import{c as a,s as o}from"./forms-B25RpCY-.js";import{i as s,n as c,r as l,t as u}from"./settings-CtovusXT.js";var d=e(),f=t(),p=(e=!1)=>new Promise((t,n)=>setTimeout(()=>e?n(Error(`Could not reach the server`)):t(),700));function m({withStatus:e=!0,failSave:t=!1}){let[n,m]=(0,d.useState)(!0),[h,g]=(0,d.useState)(`15`),[_,v]=(0,d.useState)(5),[y,b]=(0,d.useState)(`Skip refurbished listings.`),x=s();return(0,f.jsxs)(`div`,{className:`w-full space-y-6`,children:[(0,f.jsxs)(l,{title:`Scanner`,description:`How often prices are checked and when you hear about it.`,children:[(0,f.jsx)(c,{label:`Scan automatically`,description:`Check every tracker on a schedule.`,htmlFor:`demo-auto`,inline:!0,children:(0,f.jsx)(o,{id:`demo-auto`,"aria-label":`Scan automatically`,checked:n,onChange:m})}),(0,f.jsx)(c,{label:`Check every`,htmlFor:`demo-cadence`,children:(0,f.jsxs)(r,{id:`demo-cadence`,value:h,onChange:e=>g(e.target.value),disabled:!n,className:`sm:w-40`,children:[(0,f.jsx)(`option`,{value:`5`,children:`5 minutes`}),(0,f.jsx)(`option`,{value:`15`,children:`15 minutes`}),(0,f.jsx)(`option`,{value:`60`,children:`1 hour`})]})}),(0,f.jsx)(c,{label:`Alert on a drop of`,description:`Notify me when a price falls by at least this much.`,htmlFor:`demo-drop`,status:e?x.label:void 0,statusTone:x.tone,children:(0,f.jsx)(u,{id:`demo-drop`,value:_,min:0,max:100,precision:1,suffix:`%`,onCommit:async e=>{if(await x.run(p(t)),!t)v(e);else throw Error(`Could not reach the server`)}})}),(0,f.jsx)(c,{label:`Notes`,description:`Shown next to every alert.`,htmlFor:`demo-notes`,stacked:!0,children:(0,f.jsx)(a,{id:`demo-notes`,rows:3,value:y,onChange:e=>b(e.target.value),className:`w-full`})})]}),(0,f.jsx)(l,{title:`Danger zone`,description:`These cannot be undone.`,children:(0,f.jsx)(c,{label:`Delete all trackers`,description:`Removes every tracker and its price history.`,children:(0,f.jsx)(i,{variant:`danger`,children:`Delete everything`})})})]})}var h={id:`settings`,name:`Settings`,exports:[`SettingsSection`,`SettingRow`,`NumberField`],summary:`The settings page blocks: a titled section that holds rows, a row that pairs a label with any control, and a number field that saves when you leave it. Rows sit side by side from 640px and stack below.`,importLine:`import { SettingsSection, SettingRow, NumberField, useSaveStatus } from '@nish/ui';`,controls:[{key:`status`,label:`Show save status`,type:`boolean`},{key:`failSave`,label:`Make saves fail`,type:`boolean`}],initial:{status:!0,failSave:!1},render:e=>(0,f.jsx)(m,{withStatus:!!e.status,failSave:!!e.failSave},String(e.failSave)),code:e=>[n(`SettingsSection`,{title:`Scanner`,description:`How often prices are checked.`},`…`),n(`SettingRow`,{label:`Alert on a drop of`,htmlFor:`drop`,status:e.status?`{save.label}`:void 0,statusTone:e.status?`{save.tone}`:void 0},`<NumberField id="drop" value={drop} suffix="%" onCommit={…} />`)].join(`
`),html:{height:360,code:`<section class="nish-settings-section" aria-labelledby="notify">
  <div class="nish-settings-section-header">
    <div>
      <h2 class="nish-settings-section-title" id="notify">Notifications</h2>
      <p class="nish-settings-section-description">Where alerts go.</p>
    </div>
  </div>
  <div class="nish-settings-section-body">
    <div class="nish-setting-row nish-setting-row--inline">
      <div>
        <label class="nish-setting-row-label" for="push">Push</label>
        <p class="nish-setting-row-description">On this phone.</p>
      </div>
      <div class="nish-setting-row-control">
        <button type="button" class="nish-switch" role="switch" aria-checked="true" id="push"></button>
        <span class="nish-setting-row-status nish-setting-row-status--ok" role="status">Saved</span>
      </div>
    </div>
    <div class="nish-setting-row">
      <div>
        <label class="nish-setting-row-label" for="digest">Digest</label>
        <p class="nish-setting-row-description">How often the summary email arrives.</p>
      </div>
      <div class="nish-setting-row-control">
        <select class="nish-select" id="digest"><option>Daily</option><option>Weekly</option></select>
      </div>
    </div>
  </div>
</section>
<script>
  document.getElementById('push').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
    e.currentTarget.setAttribute('aria-checked', String(on));
  });
<\/script>`},stories:[{id:`scanner`,name:`Switch, Select, NumberField and Textarea rows`,note:`The Switch row is inline (the control stays at the end of the label row on a phone); the Textarea row is stacked.`,wide:!0,render:()=>(0,f.jsx)(m,{})},{id:`failing`,name:`A save that fails`,note:`The field restores the old value and shows the error under it; the row status shows it for three seconds.`,render:()=>(0,f.jsx)(l,{title:`Alerts`,className:`w-full`,children:(0,f.jsx)(g,{})})},{id:`compact`,name:`Compact, for a modal or a sheet`,note:`compact drops the Card and tightens the rows: a small heading, 44px rows with the label beside the control at every width.`,render:()=>(0,f.jsx)(_,{})},{id:`negative`,name:`NumberField with negatives`,note:`A field whose min is below zero opens the full keyboard on phones, since the iOS decimal keypad has no minus key. It is a spinbutton: screen readers hear its range and its value with the suffix.`,render:()=>(0,f.jsx)(v,{})},{id:`actions`,name:`Section with actions`,render:()=>(0,f.jsx)(l,{title:`Display`,description:`Applies on this device.`,className:`w-full`,actions:(0,f.jsx)(i,{size:`sm`,variant:`ghost`,children:`Reset`}),children:(0,f.jsx)(c,{label:`Compact rows`,inline:!0,children:(0,f.jsx)(o,{"aria-label":`Compact rows`,checked:!1,onChange:()=>{}})})})}],usage:`import { SettingsSection, SettingRow, NumberField, useSaveStatus, Switch } from '@nish/ui';

function Alerts({ settings, patch }) {
  const save = useSaveStatus();
  return (
    <SettingsSection title="Alerts" description="When to tell you.">
      <SettingRow label="Email me" htmlFor="email" inline>
        <Switch id="email" aria-label="Email me" checked={settings.email} onChange={(v) => patch({ email: v })} />
      </SettingRow>
      <SettingRow label="Drop threshold" htmlFor="drop" status={save.label} statusTone={save.tone}>
        <NumberField
          id="drop"
          value={settings.drop}
          min={0}
          max={100}
          suffix="%"
          onCommit={(n) => save.run(patch({ drop: n }))}
        />
      </SettingRow>
    </SettingsSection>
  );
}`,guidelines:[`One SettingsSection per topic, with a short title; put destructive rows in their own "Danger zone" section last.`,`Pass htmlFor so the label is a real label for the control. A Switch with no visible label of its own needs aria-label.`,`Use inline for Switch and Checkbox rows so the control stays at the end of the label row on a phone; use stacked for textareas and other wide controls.`,`NumberField saves on blur and Enter, so there is no Save button. Return the promise from onCommit so the field shows a spinner and restores the old value if the save fails.`,`NumberField clamps to min and max. Give a field that can go negative a min below zero, so phones show a keyboard with a minus key. Arrow keys step by step.`,`Use compact inside a Modal, Drawer or side panel, where a Card inside the surface would be a box in a box.`,`Feed useSaveStatus().label and .tone into a row status, so the result is announced politely and not only shown.`,`SettingsSection, SettingRow and NumberField take ref, id, className and every other attribute of their root element (section, div, input); NumberField passes them to its input. useSaveStatus, NumberField's "Enter a number" and its saving spinner use the saving, saved, saveFailed and enterNumber strings of <NishProvider>.`],api:{functions:[`useSaveStatus`],interfaces:[`SaveStatus`]}};function g(){let e=s();return(0,f.jsx)(c,{label:`Alert on a drop of`,htmlFor:`fail-drop`,status:e.label,statusTone:e.tone,children:(0,f.jsx)(u,{id:`fail-drop`,value:5,min:0,max:100,suffix:`%`,onCommit:async()=>{throw await e.run(p(!0)),Error(`Could not reach the server`)}})})}function _(){let[e,t]=(0,d.useState)(!0),[n,r]=(0,d.useState)(10);return(0,f.jsx)(`div`,{className:`w-full max-w-sm rounded-xl border border-th-line bg-th-elevated p-4`,children:(0,f.jsxs)(l,{title:`Alerts`,description:`On this device.`,compact:!0,children:[(0,f.jsx)(c,{label:`Sound`,htmlFor:`compact-sound`,children:(0,f.jsx)(o,{id:`compact-sound`,"aria-label":`Sound`,checked:e,onChange:t})}),(0,f.jsx)(c,{label:`Snooze for`,htmlFor:`compact-snooze`,children:(0,f.jsx)(u,{id:`compact-snooze`,value:n,min:1,max:120,suffix:`min`,onCommit:r})})]})})}function v(){let[e,t]=(0,d.useState)(-2);return(0,f.jsx)(l,{title:`Clock`,className:`w-full`,children:(0,f.jsx)(c,{label:`Offset from market time`,description:`Between -12 and 12 hours.`,htmlFor:`neg-offset`,children:(0,f.jsx)(u,{id:`neg-offset`,value:e,min:-12,max:12,suffix:`h`,onCommit:t})})})}export{h as settingsDoc};