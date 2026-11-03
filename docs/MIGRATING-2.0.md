# Moving from nish-ui 1.x to 2.0

2.0 is a major release because some defaults changed. Everything not listed here is additive. Do
the steps in order; each has the before and after. The full list of changes is in the
[CHANGELOG](../CHANGELOG.md).

Requirements: Node 20.19 or later, React 19, Tailwind 4 (if you use `tailwind.css`).

## 1. Node 20.19

`engines.node` is `>=20.19`. Older Node 20 releases cannot `require()` an ES module, which the
package relies on for CommonJS callers. Upgrade Node (20 itself is end of life; use 22 or 24).

## 2. The hub pill is opt-in: `hubHref` becomes `hub`

`AppHeader` and `AppShell` no longer show a "back to the hub" pill unless you ask. `hubHref` is
removed.

```tsx
// before
<AppShell name="Trackers" hubHref="https://nish.software" ... />

// after: no pill (outside apps: nothing to change)
<AppShell name="Trackers" ... />

// after: the same pill as before
<AppShell
  name="Trackers"
  hub={{ href: 'https://nish.software', label: 'nish.software', title: 'Back to nish.software' }}
  ...
/>
```

`hub={false}` is the default. `label` takes any node.

## 3. Server kit defaults

`nish-ui/server` and `nish-ui/server/hono`.

**Passwords match exactly.** `passwordMatches` and `loginHandler` no longer ignore case or trim
spaces.

```ts
// before: "Hunter2 " matched "hunter2"
loginHandler({ password, ... });

// after: opt back in only if your users relied on it
loginHandler({ password, caseInsensitive: true, ... });
```

**No proxy header is trusted.** The client address for rate limiting is the socket address. Behind
a proxy every request would share one address, so say which proxy you run behind:

```ts
// before: X-Forwarded-For and CF-Connecting-IP were read from any client
loginHandler({ ... });

// after
loginHandler({ ..., trustProxy: 'cloudflare' }); // or 'proxy' (rightmost X-Forwarded-For hop)
// mountSessionRoutes takes the same trustProxy option
```

`clientIp(get, remote, { trust })` takes the same three values (`'none'` by default).

**Session secrets of 32 bytes or more.** A shorter secret throws at setup. Generate one with
`openssl rand -base64 48`.

**Security headers on the SPA handler.** `X-Content-Type-Options`, `Referrer-Policy` and
`X-Frame-Options: SAMEORIGIN` are sent. Pass `frameOptions: false` if your app is embedded in
another origin's frame.

The login limiter gained `hit(key)`, which counts an attempt and says whether it is allowed in
one step. If you wrote your own login route, call `hit` before you check the password (before any `await`) and
`reset(key)` after a success, instead of `allowed` then `fail`.

## 4. Favicon makes no third-party request

`Favicon` and `LinkCard` used to ask Google's favicon service for every host. They now draw a
letter avatar and request nothing. To get the icons back, choose a resolver once at startup:

```tsx
import { configureFavicons, googleFavicon } from 'nish-ui';

configureFavicons({ resolve: googleFavicon });
// or your own: (host, size) => `https://icons.example.com/${host}?s=${size}` (return null for none)
```

A single `Favicon` can also take `src` or its own `resolve`.

## 5. `forwardRef` is gone: `ref` is a prop

Components take `ref` like any prop (React 19). JSX does not change:

```tsx
const ref = useRef<HTMLButtonElement>(null);
<Button ref={ref}>Save</Button>
```

Code that referred to the components as `forwardRef` exotic components breaks type checking:

```ts
// before
type ButtonRef = React.ComponentRef<typeof Button>;
const Wrapped = forwardRef<HTMLButtonElement, Props>((p, ref) => <Button ref={ref} {...p} />);

// after
type ButtonRef = HTMLButtonElement;
function Wrapped({ ref, ...p }: Props & { ref?: React.Ref<HTMLButtonElement> }) {
  return <Button ref={ref} {...p} />;
}
```

Props now extend the root element's attributes, so `id`, `data-*`, `aria-*` and `style` pass
through everywhere.

## 6. Form-control colors

Inputs, selects, textareas, checkboxes, comboboxes and the new controls use a new color role,
`line-control` (class `border-th-line-control`, variable `--nish-line-control`), at least 3:1
against the surface they sit on, and placeholders use `text-th-hi3` (4.5:1 on `elevated`
and `overlay`). Borders are darker in light themes and lighter in dark ones. A few `hi3` values
changed to reach 4.5:1 on elevated surfaces (light, slate, mocha).

If you drew your own fields next to the package's, switch them so they match:

```tsx
// before
<input className="border border-th-line-strong bg-th-elevated placeholder:text-th-ghost" />

// after
<input className="border border-th-line-control bg-th-elevated placeholder:text-th-hi3" />
```

Screenshot tests of forms need new baselines.

## 7. Plain CSS is in cascade layers

`nish.css` and `nish-components.css` put their rules in `@layer nish.base` and
`@layer nish.components`. Custom properties stay unlayered. Your own unlayered CSS now beats the
package's regardless of specificity. If you relied on beating a `nish-*` rule with a more
specific selector it still works; if you declared your own layers, order them:

```css
@layer reset, nish, app;
@import 'nish-ui/nish.css';
@import 'nish-ui/nish-components.css';
```

Tailwind users are not affected: `tailwind.css` keeps the base styles in Tailwind's `base` layer.

## 8. Tailwind scan and file layout

`nish-ui/tailwind.css` scans `dist/esm/components` (not all of `dist`), so classes you wrote in
your own app are no longer matched against the package's files. Nothing to change unless you
added `@source` lines that pointed into the package. To scan fewer modules, import
`nish-ui/tailwind-core.css` and add `@source` lines for the modules you use.

Bundlers now load `dist/esm/*` (one file per module). Deep imports from `nish-ui/dist/...` are
not supported; import the documented entry points. The standalone files at the old paths
(`dist/theme.js`, `format.js`, `chart.js`, `elements*.js`, `theme.global.js`, `theme-init.js`)
stay for static pages.

## 9. Smaller behavior changes worth a look

| Area | What changed | What to do |
|---|---|---|
| Tooltip | No wrapper Tab stop around a single focusable child; the child gets `aria-describedby` | Remove tests that Tab twice |
| ConfirmDialog | `role="alertdialog"` | Update role queries |
| AppErrorBoundary | Default fallback hides message and stack in production | Pass `showDetails` to keep them |
| apiFetch | `configureApi` headers go to same-origin URLs only | Add `headersFor` for other origins |
| Switch | Posts in forms, `onCheckedChange` added | `onChange(checked, event)` still works |
| Landmarks | Unique `aria-label`s on every nav | Pass your own `label` if you had two |
| Hydration | Overlays render nothing on the server | None |

## New in 2.0 that you may want

- `<NishProvider strings locale dir portalContainer>` for translations, formatting locale,
  direction and where overlays portal to. See the README.
- RadioGroup, Slider, TagInput, FileDropzone, Pagination, Breadcrumbs, Accordion, Separator, Avatar,
  Progress, VisuallyHidden and Portal.
- Server components: import from `nish-ui` in a Next.js server component.
- `nishThemeInit({ nonce })` and `nish-ui/theme-init.sha256` for a strict Content Security Policy.

## Check your upgrade

1. `npm install nish-ui@2` and a clean install.
2. `tsc --noEmit`: the `hubHref`, `forwardRef` and removed-prop errors point at the code to change.
3. Search for `hubHref`, `forwardRef<` around package components, `caseInsensitive`, `Favicon`
   and `LinkCard`.
4. Load the app in light and dark and look at the forms.
5. In a proxied server, log in from two addresses and confirm each has its own rate limit.

## Support

Security fixes for the latest 1.x continue for three months after 2.0.0. See
[SECURITY.md](../SECURITY.md).
