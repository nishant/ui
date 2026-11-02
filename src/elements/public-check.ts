// Compile-time drift check (covered by `npm run typecheck`, never bundled: nothing imports it).
// public.d.ts is hand-written and skipLibCheck hides its own errors, so the real class must be
// assignable to the declared one (so a removed or retyped member fails), and the small plain types
// must match exactly. Add a line here when you add an element or a member.
import type * as Pub from './public';
import type * as Impl from './index';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const fits = <Real, Pub>(_ok: [Real] extends [Pub] ? true : never): void => {};
const same = <A, B>(_ok: Same<A, B>): void => {};

fits<Impl.NishThemeToggle, Pub.NishThemeToggle>(true);
fits<Impl.NishSheet, Pub.NishSheet>(true);
fits<Impl.NishDialog, Pub.NishDialog>(true);
fits<Impl.NishBottomNav, Pub.NishBottomNav>(true);
same<Pub.ToastOptions, Impl.ToastOptions>(true);
same<Pub.ToastTone, Impl.ToastTone>(true);
same<Parameters<typeof Pub.toast>, Parameters<typeof Impl.toast>>(true);
same<ReturnType<typeof Pub.toast>, ReturnType<typeof Impl.toast>>(true);
same<Parameters<typeof Pub.define>, Parameters<typeof Impl.define>>(true);
