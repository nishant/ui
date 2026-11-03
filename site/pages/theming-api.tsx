import { CodeBlock } from '../lib/code';
import { href } from '../lib/router';
import { PageHeader, Prose, Section } from '../lib/ui';

interface Entry {
  name: string;
  signature: string;
  text: string;
}

const CHOICE = 'ThemeChoice = ThemeName | "system"';

const STATE: Entry[] = [
  {
    name: 'initTheme',
    signature: 'initTheme(): ThemeName',
    text: 'For pages without a framework: applies the saved choice now and starts syncing (the OS scheme, other tabs, other subdomains). Call it once. React apps call it before render.',
  },
  {
    name: 'getThemeChoice',
    signature: `getThemeChoice(): ThemeChoice  // ${CHOICE}`,
    text: 'The saved choice, read from the shared cookie, then localStorage. "system" when nothing valid is saved or storage is blocked.',
  },
  {
    name: 'setThemeChoice',
    signature: 'setThemeChoice(choice: ThemeChoice): ThemeName',
    text: 'Saves a choice everywhere it can be read back (localStorage, plus a cookie on the shared domain) and applies it. An unknown name is ignored with a development warning. Never throws when storage or cookies do (a sandboxed iframe).',
  },
  {
    name: 'applyTheme',
    signature: 'applyTheme(choice?: ThemeChoice): ThemeName',
    text: 'Paints a choice onto <html> (data-theme, data-scheme, data-theme-choice, color-scheme, the theme-color meta) without saving it. Previews use this. Transitions are off for one frame during a switch (data-nish-theme-switching).',
  },
  {
    name: 'resolveTheme',
    signature: 'resolveTheme(choice?: ThemeChoice): ThemeName',
    text: 'What a choice renders as on this page: "system" becomes light or dark by the OS, and a theme the page does not allow (data-nish-themes) becomes the one it is based on.',
  },
  {
    name: 'cycleTheme',
    signature: 'cycleTheme(): ThemeChoice',
    text: 'Steps system, light, dark and back (TOGGLE_ORDER), saves it and returns the new choice. A preset saved elsewhere steps to "system".',
  },
  {
    name: 'onThemeChange',
    signature: 'onThemeChange((choice: ThemeChoice, theme: ThemeName) => void): () => void',
    text: 'Subscribes to every change, including the OS flipping and another tab saving a choice. Returns the unsubscribe function. The listeners are shared by every entry and every copy of the package on the page.',
  },
  {
    name: 'registerThemes',
    signature: "registerThemes(themes: Record<string, 'dark' | 'light'>): void",
    text: "Teaches the theme logic your own themes and their scheme. Style them with [data-theme='<name>'] blocks that set the --nish-* variables, and set the same map on window.__nishExtraThemes before theme-init.js runs so the first paint knows them.",
  },
  {
    name: 'isThemeName',
    signature: 'isThemeName(v: unknown): v is ThemeName',
    text: 'True for the seven shared themes and the ones you registered. Prototype keys such as "toString" are not themes.',
  },
  {
    name: 'schemeOf',
    signature: "schemeOf(theme: ThemeName): 'dark' | 'light'",
    text: 'The scheme a theme is based on. Unknown names are "dark".',
  },
  {
    name: 'readToken',
    signature: 'readToken(name: string): string',
    text: "The current value of --nish-<name> on <html>, trimmed. readToken('chart-1') gives a canvas chart its color. Browser only.",
  },
];

const STATIC: Entry[] = [
  {
    name: 'mountThemeToggle',
    signature: 'mountThemeToggle(button: HTMLElement, opts?: MountThemeToggleOptions): () => void',
    text: 'Turns a button into the one-button toggle: icon, label ("Theme: Light. Switch to Dark") and click handling. Options: labels, strings, elsewhereLabel, showLabel. Returns a cleanup function.',
  },
  {
    name: 'showToast',
    signature: 'showToast(content: string | Node, opts?: ShowToastOptions): () => void',
    text: 'One toast on a static page, in a single polite live region. Options: tone, duration (milliseconds or "sticky"), action ({ label, href?, onClick? }; an unsafe href drops the action), dismissLabel, strings. Text is never parsed as HTML. Returns a function that hides it.',
  },
  {
    name: 'confirmDialog',
    signature: 'confirmDialog(opts: ConfirmDialogOptions): Promise<boolean>',
    text: 'A yes-or-no question in place of window.confirm, in a native <dialog>. Options: title, body, confirmLabel, cancelLabel, tone ("danger" starts focus on Cancel), strings. Resolves true on confirm, false on Cancel, Escape or a backdrop click.',
  },
  {
    name: 'mountTooltips',
    signature: 'mountTooltips(root?: Document | HTMLElement): () => void',
    text: 'Adds Escape-to-dismiss to .nish-tooltip triggers and links each tip to its trigger with aria-describedby.',
  },
  {
    name: 'openSheet',
    signature: 'openSheet(dialog: HTMLDialogElement): () => void',
    text: 'Opens a <dialog class="nish-sheet"> as a modal bottom sheet with swipe-to-close, Escape and focus return. Returns a function that closes it.',
  },
  {
    name: 'mountScrollspy',
    signature: 'mountScrollspy(nav: HTMLElement, opts?: { offset?: number; height?: boolean }): () => void',
    text: 'Scrollspy for a .nish-subnav: the link whose section is current gets aria-current, and the nav publishes its height as --nish-sticky-extra.',
  },
  {
    name: 'mountStuck',
    signature: 'mountStuck(el: HTMLElement, onChange?: (stuck: boolean) => void): () => void',
    text: 'Toggles data-stuck on a position: sticky element while it is stuck to its top.',
  },
  {
    name: 'mountChecklist',
    signature: 'mountChecklist(list: HTMLElement): () => void',
    text: 'Persists a checklist (li[data-id] with a checkbox) in localStorage under list.dataset.store and keeps its progress text and meter current.',
  },
  {
    name: 'mountHeightVar',
    signature: 'mountHeightVar(el: HTMLElement, name: string): () => void',
    text: "Publishes an element's height as a CSS variable on <html>, the static twin of useHeightVar.",
  },
];

const CONSTANTS: Entry[] = [
  {
    name: 'THEMES',
    signature: "THEMES: Record<ThemeId, { label: string; scheme: 'dark' | 'light'; colors: Record<Role, string> }>",
    text: 'Every shared theme (dark, light, slate, terminal, mocha, ocean, contrast) with the value of each color role. The source of the generated CSS.',
  },
  {
    name: 'DEFAULT_THEME',
    signature: "DEFAULT_THEME: 'dark'",
    text: 'The theme a "system" choice falls back to when the OS does not prefer light, and the server render of useTheme.',
  },
  {
    name: 'PRESETS',
    signature: 'PRESETS: ThemePreset[]  // { id, label, scheme, colors }',
    text: 'THEMES as a list, for building a theme picker.',
  },
  {
    name: 'TOGGLE_ORDER',
    signature: 'TOGGLE_ORDER: ThemeChoice[]  // ["system", "light", "dark"]',
    text: 'The order the one-button toggle steps through.',
  },
  {
    name: 'COLOR_ROLES, HUE_ROLES, SOFT_ROLES',
    signature: 'COLOR_ROLES: string[]; HUE_ROLES: string[]; SOFT_ROLES: string[]',
    text: 'The role names: every color role, the eight hue roles (emerald, indigo, amber, lime, rose, sky, violet, teal) and the roles that also have a -soft tint.',
  },
  {
    name: 'SCALE, SHADOWS',
    signature: 'SCALE: { ... }; SHADOWS: { ... }',
    text: 'The type, spacing, radius, motion, z-index, breakpoint and layout scale, and the shadow tokens, as data. Shown on the Typography, Spacing, Shadows and Z-index pages.',
  },
];

const HTML_ATTRS: [string, string][] = [
  ['data-theme', 'Set by the theme code on <html> or on any element to theme its subtree.'],
  ['data-scheme', 'dark or light; set beside data-theme so native controls and dark: variants follow.'],
  ['data-nish-themes', 'On <html>: a space-separated list that limits the themes the page allows ("dark light").'],
  ['data-nish-domain', 'On <html>: the domain the choice cookie is shared on ("example.com").'],
  ['data-nish-storage-key', 'On <html>: the storage and cookie name (letters, digits, - and _). Default nish-theme.'],
  ['data-nish-keep', 'On a <meta name="theme-color">: the theme code leaves it alone, as it does one that has a media attribute.'],
  ['data-nish-theme-switching', 'Set on <html> for one frame during a switch; nish.css turns transitions off while it is there.'],
];

function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <ul className="grid gap-4">
      {entries.map((e) => (
        <li key={e.name} className="min-w-0 space-y-2 rounded-xl border border-th-line bg-th-surface p-4">
          <h3 className="font-mono text-sm font-semibold text-th-hi [overflow-wrap:anywhere]">{e.name}</h3>
          <CodeBlock code={e.signature} title="Signature" keepAlias />
          <p className="max-w-2xl text-sm leading-relaxed text-th-hi2">{e.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function ThemingApiPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Foundations"
        title="Theming API"
        lead="Every export of nish-ui/theme and the theme constants. The functions have no React in them, so static pages, servers and build tools can import them."
      />

      <Section id="import" title="Where they come from">
        <CodeBlock
          title="the same functions from either entry"
          code={`import { initTheme, setThemeChoice, onThemeChange } from 'nish-ui/theme'; // no React
import { THEMES, PRESETS } from 'nish-ui';                                    // also from the root`}
        />
        <Prose>
          <p>
            Theme listeners and registered themes live once per page, shared by every entry (<code>nish-ui</code>, <code>nish-ui/theme</code>,{' '}
            <code>nish-ui/chart</code>) and by every copy of the package, so a toggle built from one entry updates a chart built from another. The token
            data alone is <code>nish-ui/tokens</code>, <code>nish-ui/tokens.json</code> and the W3C Design Tokens file <code>nish-ui/tokens.dtcg.json</code>.
            For React, <code>useTheme()</code> and <code>ThemeToggle</code> sit on top of these; see <a href={href('/components/theme-toggle')}>ThemeToggle</a>.
          </p>
        </Prose>
      </Section>

      <Section id="state" title="Reading and changing the theme" note="A choice is a theme name or 'system'. The page shows the resolved theme.">
        <EntryList entries={STATE} />
      </Section>

      <Section id="static" title="Helpers for pages without a framework" note="Each returns a function that undoes what it set up. They need nish-components.css where they draw UI.">
        <EntryList entries={STATIC} />
        <Prose>
          <p>
            <code>theme.global.js</code> exposes initTheme, setThemeChoice, cycleTheme, onThemeChange, readToken, registerThemes, getThemeChoice and the helpers
            above as <code>window.nishTheme</code> for pages that cannot load modules.
          </p>
        </Prose>
      </Section>

      <Section id="constants" title="Constants">
        <EntryList entries={CONSTANTS} />
      </Section>

      <Section id="attributes" title="Attributes on the page" note="The theme code and theme-init.js read and write these.">
        <ul className="grid gap-2">
          {HTML_ATTRS.map(([name, text]) => (
            <li key={name} className="min-w-0 rounded-xl border border-th-line bg-th-surface px-4 py-3">
              <code className="font-mono text-sm font-semibold text-th-hi [overflow-wrap:anywhere]">{name}</code>
              <p className="mt-1 text-sm text-th-hi2">{text}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
