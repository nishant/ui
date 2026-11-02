// Compile-time drift check (covered by `npm run typecheck`, never bundled: nothing imports it).
// public.d.ts is hand-written and skipLibCheck hides its own errors, so the real class must be
// assignable to the declared one (so a removed or retyped member fails), and the small plain types
// must match exactly. Add a line here when you add an element or a member.
import type * as Pub from './public';
import type * as Impl from './index';
import type * as PubForms from './public-forms';
import type * as ImplForms from './forms';

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
same<Pub.ToastOptions, Impl.ToastOptions>(true);
same<Pub.ToastTone, Impl.ToastTone>(true);
same<Parameters<typeof Pub.toast>, Parameters<typeof Impl.toast>>(true);
same<ReturnType<typeof Pub.toast>, ReturnType<typeof Impl.toast>>(true);
same<Parameters<typeof Pub.define>, Parameters<typeof Impl.define>>(true);
