// Compile-time drift check (covered by `npm run typecheck`, never bundled: nothing imports it).
// public.d.ts is hand-written and skipLibCheck hides its own errors, so the real class must be
// assignable to the declared one (so a removed or retyped member fails), and the small plain types
// must match exactly. Add a line here when you add an element or a member.
import type * as Pub from './public';
import type * as Impl from './index';
import type * as PubForms from './public-forms';
import type * as ImplForms from './forms';
import type * as PubData from './public-data';
import type * as ImplData from './data';
import type * as PubCharts from './public-charts';
import type * as ImplCharts from './charts';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const fits = <Real, Pub>(_ok: [Real] extends [Pub] ? true : never): void => {};
const same = <A, B>(_ok: Same<A, B>): void => {};

fits<Impl.NishThemeToggle, Pub.NishThemeToggle>(true);
fits<Impl.NishSheet, Pub.NishSheet>(true);
fits<Impl.NishDialog, Pub.NishDialog>(true);
fits<Impl.NishBottomNav, Pub.NishBottomNav>(true);
fits<ImplForms.NishField, PubForms.NishField>(true);
fits<ImplForms.NishSearch, PubForms.NishSearch>(true);
fits<ImplForms.NishSwitch, PubForms.NishSwitch>(true);
fits<ImplForms.NishChipGroup, PubForms.NishChipGroup>(true);
fits<ImplForms.NishCombobox, PubForms.NishCombobox>(true);
fits<ImplForms.NishTabs, PubForms.NishTabs>(true);
fits<ImplForms.NishSegmented, PubForms.NishSegmented>(true);
fits<ImplForms.NishCopyButton, PubForms.NishCopyButton>(true);
fits<ImplForms.NishSparkline, PubForms.NishSparkline>(true);
same<PubForms.NishComboboxOption, ImplForms.NishComboboxOption>(true);
same<PubForms.NishComboboxChangeDetail, ImplForms.NishComboboxChangeDetail>(true);
same<Parameters<typeof PubForms.define>, Parameters<typeof ImplForms.define>>(true);
fits<ImplData.NishTableSort, PubData.NishTableSort>(true);
fits<ImplData.NishFilterBar, PubData.NishFilterBar>(true);
fits<ImplData.NishSplit, PubData.NishSplit>(true);
fits<ImplData.NishNavRail, PubData.NishNavRail>(true);
fits<ImplData.NishScrollRow, PubData.NishScrollRow>(true);
fits<ImplData.NishSectionNav, PubData.NishSectionNav>(true);
fits<ImplData.NishCommandPalette, PubData.NishCommandPalette>(true);
fits<ImplCharts.NishLineChart, PubCharts.NishLineChart>(true);
fits<ImplCharts.NishBarChart, PubCharts.NishBarChart>(true);
same<PubData.NishCommandItem, ImplData.NishCommandItem>(true);
same<PubData.NishCommandSelectDetail, ImplData.NishCommandSelectDetail>(true);
same<PubData.NishResizeDetail, ImplData.NishResizeDetail>(true);
same<Parameters<typeof PubData.define>, Parameters<typeof ImplData.define>>(true);
same<Parameters<typeof PubCharts.define>, Parameters<typeof ImplCharts.define>>(true);
same<Pub.ToastOptions, Impl.ToastOptions>(true);
same<Pub.ToastTone, Impl.ToastTone>(true);
same<Parameters<typeof Pub.toast>, Parameters<typeof Impl.toast>>(true);
same<ReturnType<typeof Pub.toast>, ReturnType<typeof Impl.toast>>(true);
same<Parameters<typeof Pub.define>, Parameters<typeof Impl.define>>(true);
same<Parameters<typeof Pub.configureStrings>, Parameters<typeof Impl.configureStrings>>(true);
same<Parameters<typeof PubForms.configureStrings>, Parameters<typeof ImplForms.configureStrings>>(true);
same<Parameters<typeof PubData.configureStrings>, Parameters<typeof ImplData.configureStrings>>(true);
same<Parameters<typeof PubCharts.configureStrings>, Parameters<typeof ImplCharts.configureStrings>>(true);
same<Pub.NishElementStrings, Impl.NishElementStrings>(true);
same<PubForms.NishElementStrings, ImplForms.NishElementStrings>(true);
same<PubData.NishElementStrings, ImplData.NishElementStrings>(true);
same<PubCharts.NishElementStrings, ImplCharts.NishElementStrings>(true);
