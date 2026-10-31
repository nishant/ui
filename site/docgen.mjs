// Props tables for the docs site, read from the TypeScript source at build time with
// the compiler API, so they cannot drift from the components. site/vite.config.ts
// serves the result as the virtual module `virtual:nish-docgen`.
import ts from 'typescript';
import { join } from 'node:path';

/** Components (and hooks/functions) the site documents. */
export const COMPONENTS = [
  'Button',
  'IconButton',
  'Card',
  'CardHeader',
  'Badge',
  'Input',
  'Textarea',
  'Checkbox',
  'Field',
  'FieldGroup',
  'Switch',
  'SearchInput',
  'Select',
  'Label',
  'Chip',
  'ChipGroup',
  'Skeleton',
  'SkeletonLines',
  'SkeletonRows',
  'Spinner',
  'EmptyState',
  'ErrorState',
  'Toaster',
  'Callout',
  'StatusDot',
  'Stat',
  'StatGrid',
  'Meter',
  'Sparkline',
  'Disclosure',
  'Kbd',
  'CopyButton',
  'PageHeader',
  'AppHeader',
  'SectionHeader',
  'KeyValueList',
  'ChartLegend',
  'TableWrap',
  'Table',
  'Th',
  'Td',
  'Tr',
  'Modal',
  'Drawer',
  'ConfirmDialog',
  'Tooltip',
  'Popover',
  'DropdownMenu',
  'MenuItem',
  'MenuSubHeader',
  'Segmented',
  'Tabs',
  'TabPanel',
  'ThemeToggle',
  'BottomNav',
  'MoreSheet',
  'NavRail',
  'ScrollRow',
  'SectionNav',
  'StickyBar',
  'StickyActionBar',
  'LoadingBar',
  'PageContainer',
  'ConnectionBanner',
  'ResponsiveTable',
  'ListRow',
  'LinkCard',
  'Favicon',
  'AsyncPanel',
  'SkeletonCard',
  'StatGridSkeleton',
  'CardListSkeleton',
  'LineChart',
  'BarChart',
  'RangeBar',
  'CommandPalette',
  'RelativeTime',
  'FlowSteps',
  'StepBar',
  'AgentNode',
  'WorkflowBoard',
  'ActivityFeed',
  'TickerText',
  'AnimatedList',
  'SystemCanvas',
  'Inbox',
  'AppShell',
  'AppErrorBoundary',
  'FilterBar',
  'FilterSheet',
  'SettingsSection',
  'SettingRow',
  'NumberField',
  'Combobox',
];
const FUNCTIONS = [
  'toast', 'dismissToast', 'useToast', 'useTheme', 'mountThemeToggle',
  'buttonClass', 'iconButtonClass', 'cardClass', 'badgeClass', 'fieldClass', 'tabClass', 'chipClass', 'menuItemClass', 'showToast', 'confirmDialog', 'mountTooltips',
  'signTone', 'toneFor', 'copyText', 'seriesColor', 'chartTheme', 'useChartTheme',
  'revealClass', 'linkClass', 'useHeightVar', 'useStuck', 'useScrollEdges', 'useScrollSpy', 'useOnline', 'useCommandHotkey',
  'usePrefersReducedMotion', 'useMediaQuery', 'useBreakpoint', 'useDocumentTitle', 'useNow', 'useLocalStorage',
  'money', 'signedMoney', 'pct', 'num', 'signed', 'bytes', 'duration', 'ago', 'date', 'time', 'dateTime', 'dateRange',
  'openSheet', 'mountHeightVar', 'mountStuck', 'mountScrollspy', 'mountChecklist',
  'apiFetch', 'configureApi', 'useResource', 'useUrlState', 'useSaveStatus', 'usePhone', 'useNarrow', 'nishThemeInit',
];
const INTERFACES = ['ThemeState', 'ToastItem', 'ToastOptions', 'SegmentedProps', 'SegmentedOption', 'TabItem', 'MountThemeToggleOptions', 'ChartTheme', 'ShowToastOptions', 'ConfirmDialogOptions', 'KeyValueItem', 'ChartLegendItem',
  'ApiFetchOptions', 'ApiConfig', 'UseResourceOptions', 'Resource', 'FilterBarProps', 'FilterSheetProps', 'UrlStateAdapter', 'SaveStatus', 'NishThemeInitOptions',
];

const fromPackage = (node) => !node.getSourceFile().fileName.includes('/node_modules/');

export function docgen(root) {
  const entries = [join(root, 'src/index.ts'), join(root, 'src/chart.ts'), join(root, 'src/format.ts'), join(root, 'src/node/vite.ts')];
  const program = ts.createProgram(entries, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const exported = new Map(
    entries.flatMap((entry) =>
      checker
        .getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)))
        .map((s) => [s.name, s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s]),
    ),
  );
  const doc = (sym) => ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();

  /** A readable type: literal unions spelled out, everything else as written. */
  function typeText(sym, at) {
    const decl = sym.declarations?.[0];
    const t = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(sym, at));
    const literal = (x) =>
      x.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral);
    if (t.isUnion() && t.types.every(literal)) {
      const parts = t.types.map((x) => checker.typeToString(x));
      const bool = parts.includes('true') && parts.includes('false');
      return [...(bool ? ['boolean'] : []), ...parts.filter((p) => !bool || (p !== 'true' && p !== 'false'))].join(' | ');
    }
    if (decl && (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) && decl.type) {
      return decl.type.getText().replace(/\s+/g, ' ');
    }
    return checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation);
  }

  /** Default values from the component's destructured first parameter. */
  function defaults(fn) {
    const out = {};
    const p = fn?.parameters?.[0];
    if (!p || !ts.isObjectBindingPattern(p.name)) return out;
    for (const el of p.name.elements) {
      if (!el.initializer) continue;
      const key = (el.propertyName ?? el.name).getText();
      out[key] = el.initializer.getText();
    }
    return out;
  }

  /** The function that implements a component: a declaration, or forwardRef(function X(…)). */
  function implementation(decl) {
    if (ts.isFunctionDeclaration(decl)) return decl;
    if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer)) {
      const arg = decl.initializer.arguments[0];
      if (arg && (ts.isFunctionExpression(arg) || ts.isArrowFunction(arg))) return arg;
    }
    return undefined;
  }

  const components = {};
  for (const name of COMPONENTS) {
    const sym = exported.get(name);
    if (!sym) throw new Error(`docgen: ${name} is not exported from src/index.ts`);
    const decl = sym.valueDeclaration ?? sym.declarations[0];
    const fn = implementation(decl);
    const ctype = checker.getTypeOfSymbolAtLocation(sym, decl);
    const sig = ctype.getCallSignatures()[0] ?? ctype.getConstructSignatures()[0];
    const param = sig?.parameters[0];
    const props = [];
    const inherits = new Set();
    if (param) {
      const propsType = checker.getTypeOfSymbolAtLocation(param, decl);
      const defs = defaults(fn);
      for (const p of propsType.getProperties()) {
        const d = p.declarations?.[0];
        if (!d || !fromPackage(d)) continue;
        props.push({
          name: p.name,
          type: typeText(p, decl),
          required: !(p.flags & ts.SymbolFlags.Optional),
          default: defs[p.name] ?? null,
          description: doc(p),
        });
      }
      // What the rest of the props come from: the props interface's `extends`, or a
      // React attribute type used directly.
      const call = ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer) ? decl.initializer : null;
      const typeNode = fn?.parameters?.[0]?.type ?? call?.typeArguments?.[1];
      if (typeNode && ts.isTypeReferenceNode(typeNode)) {
        const target = checker.getSymbolAtLocation(typeNode.typeName);
        const resolved = target && target.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(target) : target;
        const iface = resolved?.declarations?.find(ts.isInterfaceDeclaration);
        if (iface && fromPackage(iface)) {
          for (const h of iface.heritageClauses ?? []) for (const t of h.types) inherits.add(t.getText());
        } else {
          inherits.add(typeNode.getText());
        }
      }
    }
    const forwardsRef = ts.isVariableDeclaration(decl) && /^forwardRef\b/.test(decl.initializer?.getText() ?? '');
    components[name] = {
      name,
      description: doc(sym),
      file: decl.getSourceFile().fileName.slice(root.length + 1),
      props: props.sort((a, b) => Number(b.required) - Number(a.required)),
      inherits: [...inherits],
      forwardsRef,
    };
  }

  const functions = {};
  for (const name of FUNCTIONS) {
    const sym = exported.get(name);
    const decl = sym.valueDeclaration ?? sym.declarations[0];
    const type = checker.getTypeOfSymbolAtLocation(sym, decl);
    const sig = (s) => checker.signatureToString(s).replaceAll(' | undefined', '');
    const sigs = type.getCallSignatures().map((s) => `${name}${sig(s)}`);
    for (const p of type.getProperties()) {
      const pt = checker.getTypeOfSymbolAtLocation(p, decl);
      for (const s of pt.getCallSignatures()) sigs.push(`${name}.${p.name}${sig(s)}`);
    }
    functions[name] = { name, description: doc(sym), signatures: sigs };
  }

  const interfaces = {};
  for (const name of INTERFACES) {
    const sym = exported.get(name);
    const decl = sym.declarations[0];
    const type = checker.getDeclaredTypeOfSymbol(sym);
    if (ts.isTypeAliasDeclaration(decl)) {
      // A type alias (a union of literals, say) is one row: its name and what it spells out.
      interfaces[name] = {
        name,
        description: doc(sym),
        props: [{ name, type: decl.type.getText().replace(/\s+/g, ' '), required: true, default: null, description: doc(sym) }],
      };
      continue;
    }
    interfaces[name] = {
      name,
      description: doc(sym),
      props: type.getProperties().filter((p) => p.declarations?.[0] && fromPackage(p.declarations[0])).map((p) => ({
        name: p.name,
        type: typeText(p, decl),
        required: !(p.flags & ts.SymbolFlags.Optional),
        default: null,
        description: doc(p),
      })),
    };
  }

  return { components, functions, interfaces };
}
