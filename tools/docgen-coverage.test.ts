import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import ts from 'typescript';
import { docgen } from '../site/docgen.mjs';
import { COMPONENT_DOCS } from '../site/components/index';

const root = resolve(__dirname, '..');

// A docs page that names something docgen does not know crashes or loses its props table.
describe('docs pages vs docgen', () => {
  const data = docgen(root) as {
    components: Record<string, unknown>;
    functions: Record<string, unknown>;
    interfaces: Record<string, unknown>;
  };

  it('every api name exists in docgen', () => {
    const missing: string[] = [];
    for (const doc of COMPONENT_DOCS) {
      for (const n of doc.api?.functions ?? []) if (!data.functions[n]) missing.push(`${doc.id}: function ${n}`);
      for (const n of doc.api?.interfaces ?? []) if (!data.interfaces[n]) missing.push(`${doc.id}: interface ${n}`);
    }
    expect(missing).toEqual([]);
  }, 60000);

  it('every documented component export has a docgen entry (props table and source link)', () => {
    const missing: string[] = [];
    for (const doc of COMPONENT_DOCS) {
      for (const n of doc.exports) if (/^[A-Z]/.test(n) && !data.components[n] && !data.functions[n] && !data.interfaces[n]) missing.push(`${doc.id}: ${n}`);
    }
    expect(missing).toEqual([]);
  }, 60000);

  it('split-stage and media-row exports have props tables', () => {
    for (const id of ['split-stage', 'media-row']) {
      const doc = COMPONENT_DOCS.find((d) => d.id === id)!;
      for (const n of doc.exports) expect(data.components[n], `${id}: ${n}`).toBeTruthy();
    }
  }, 60000);
});

it('docs page ids are unique and every page documents an export, an api name or a source', () => {
  const ids = COMPONENT_DOCS.map((d) => d.id);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  for (const d of COMPONENT_DOCS) {
    const n = d.exports.length + (d.api?.functions.length ?? 0) + (d.api?.interfaces.length ?? 0) + (d.source ? 1 : 0);
    expect(n, d.id).toBeGreaterThan(0);
  }
});

// Runtime exports of `.` with no docs-site mention today. A new export must be mentioned on a docs
// page (its name in a page's source: exports, api, usage, guidelines or a story); do not add here.
const UNDOCUMENTED_EXPORTS = new Set<string>([
  'VERSION', 'useIsClient', 'useIsoLayoutEffect', 'isRtl', 'THEMES',
  'COLOR_ROLES', 'SOFT_ROLES', 'SHADOWS', 'DEFAULT_THEME', 'revealClass',
  'navigateFromLayer', 'usePrefersReducedMotion', 'DEFAULT_CANVAS_LABELS', 'DEFAULT_INBOX_LABELS',
  'INBOX_SOURCE_LABELS', 'INBOX_DEFAULT_SETTINGS', 'INBOX_ACTION_HEADER', 'INBOX_ACTION_TIMEOUT_MS', 'CheckIcon',
  'ClockIcon', 'paginationRange', 'avatarInitials', 'avatarHueIndex', 'registerThemes',
  'isThemeName', 'getThemeChoice', 'resolveTheme', 'schemeOf', 'applyTheme',
  'readToken', 'TOGGLE_ORDER', 'countLeaves', 'computeRects', 'computeDividers',
  'resizeAt', 'NARROW_MAX', 'NARROW_BREAKPOINT',
]);

// Props of exported components that have no JSDoc description today, as "Component.prop". New props
// must be documented; do not add to this list.
const UNDESCRIBED_PROPS = new Set<string>([
  'NishProvider.strings', 'NishProvider.locale', 'NishProvider.dir', 'NishProvider.portalContainer',
  'NishProvider.children', 'Portal.children', 'ChipGroup.children', 'Tabs.items',
  'TabPanel.children', 'TabPanel.ref', 'Skeleton.ref', 'SkeletonLines.className',
  'SkeletonLines.ref', 'SkeletonRows.ref', 'EmptyState.className', 'EmptyState.ref',
  'ErrorState.className', 'ErrorState.ref', 'Spinner.ref', 'Tooltip.className',
  'Popover.children', 'MenuItem.children', 'MenuLabel.className', 'MenuLabel.ref',
  'MenuSeparator.className', 'MenuSeparator.ref', 'MenuSubHeader.className', 'KeyValueList.items',
  'ChartLegend.items', 'ThemeToggle.className', 'Segmented.options', 'Segmented.fullWidth',
  'Segmented.className', 'SkeletonCard.className', 'SkeletonCard.ref', 'StatGridSkeleton.className',
  'StatGridSkeleton.ref', 'CardListSkeleton.className', 'CardListSkeleton.ref', 'MoreSheet.open',
  'MoreSheet.items', 'MoreSheet.renderLink', 'NavRail.items', 'NavRail.renderLink',
  'ScrollRow.children', 'SectionNav.items', 'PageContainer.children', 'ResponsiveTable.className',
  'ResponsiveTable.ref', 'Favicon.ref', 'LinkCard.className', 'LinkCard.ref',
  'AsyncPanel.className', 'AsyncPanel.ref', 'LineChart.className', 'LineChart.ref',
  'BarChart.className', 'BarChart.ref', 'RangeBar.className', 'RangeBar.ref',
  'RelativeTime.ref', 'FlowSteps.steps', 'FlowSteps.className', 'FlowSteps.ref',
  'StepBar.total', 'StepBar.done', 'StepBar.className', 'StepBar.ref',
  'AgentNode.label', 'AgentNode.state', 'AgentNode.activity', 'AgentNode.onClick',
  'AgentNode.className', 'WorkflowBoard.phases', 'WorkflowBoard.agents', 'WorkflowBoard.className',
  'WorkflowBoard.ref', 'ActivityFeed.items', 'ActivityFeed.now', 'ActivityFeed.className',
  'TickerText.text', 'TickerText.as', 'TickerText.className', 'TickerText.ref',
  'AnimatedList.items', 'AnimatedList.getKey', 'AnimatedList.children', 'AnimatedList.as',
  'AnimatedList.className', 'AnimatedList.itemClassName', 'SystemCanvas.ref', 'SystemCanvas.groups',
  'SystemCanvas.edges', 'SystemCanvas.onFollowChange', 'SystemCanvas.selected', 'SystemCanvas.onSelect',
  'SystemCanvas.className', 'Inbox.ref', 'AppShell.icon', 'AppShell.renderLink',
  'AppShell.children', 'AppErrorBoundary.children', 'FilterBar.className', 'FilterSheet.open',
  'FilterSheet.onClose', 'FilterSheet.children', 'SettingsSection.title', 'SettingsSection.description',
  'SettingsSection.id', 'SettingsSection.children', 'SettingsSection.className', 'SettingRow.label',
  'SettingRow.description', 'SettingRow.statusTone', 'SettingRow.className', 'NumberField.ref',
  'NumberField.value', 'NumberField.min', 'NumberField.max', 'NumberField.step',
  'ServiceTokensSection.error', 'ServiceTokensSection.onRetry', 'ServiceTokensSection.className', 'Combobox.options',
  'Combobox.placeholder', 'Combobox.disabled', 'Combobox.loading', 'Combobox.className',
  'CheckIcon.size', 'ClockIcon.size', 'MoreIcon.size', 'BellIcon.size',
  'SettingsIcon.size', 'SplitStage.className', 'LayoutPresetIcon.className', 'MediaThumb.className',
  'MediaThumb.ref', 'MediaRow.className', 'MediaChip.className', 'MediaChip.ref',
  'TagInput.disabled', 'FileDropzone.disabled', 'FileDropzone.required', 'Pagination.ref',
  'Breadcrumbs.ref', 'Accordion.ref', 'AccordionItem.ref', 'Separator.ref',
]);

function programOf() {
  const program = ts.createProgram([join(root, 'src/index.ts')], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const entry = checker.getSymbolAtLocation(program.getSourceFile(join(root, 'src/index.ts'))!)!;
  const exports = checker.getExportsOfModule(entry).map((s) => ({
    name: s.name,
    sym: s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s,
  }));
  return { checker, exports };
}

describe('docs coverage of the `.` entry', () => {
  const { checker, exports } = programOf();
  const runtime = exports.filter((e) => e.sym.flags & ts.SymbolFlags.Value);

  it('every runtime export has a docs mention', () => {
    const dir = join(root, 'site/components');
    const text = readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    const missing = runtime.map((e) => e.name).filter((n) => !new RegExp(`\\b${n}\\b`).test(text));
    const fresh = missing.filter((n) => !UNDOCUMENTED_EXPORTS.has(n));
    if (process.env.NISH_DOCGEN_DUMP) console.log(JSON.stringify(missing));
    console.log(`docgen-coverage: ${missing.length} of ${runtime.length} runtime exports lack a docs mention (allow-listed: ${UNDOCUMENTED_EXPORTS.size})`);
    expect(fresh, 'document these exports on a docs page').toEqual([]);
    expect([...UNDOCUMENTED_EXPORTS].filter((n) => !missing.includes(n)), 'remove from the allow-list').toEqual([]);
  }, 120000);

  it('every prop of an exported component has a description', () => {
    const gaps: string[] = [];
    for (const { name, sym } of runtime) {
      if (!/^[A-Z]/.test(name)) continue;
      const decl = sym.valueDeclaration ?? sym.declarations?.[0];
      if (!decl) continue;
      const type = checker.getTypeOfSymbolAtLocation(sym, decl);
      const param = type.getCallSignatures()[0]?.parameters[0];
      if (!param) continue;
      const props = checker.getTypeOfSymbolAtLocation(param, decl);
      for (const p of props.getProperties()) {
        const d = p.declarations?.[0];
        if (!d || d.getSourceFile().fileName.includes('/node_modules/')) continue;
        if (!ts.displayPartsToString(p.getDocumentationComment(checker)).trim()) gaps.push(`${name}.${p.name}`);
      }
    }
    const fresh = gaps.filter((g) => !UNDESCRIBED_PROPS.has(g));
    if (process.env.NISH_DOCGEN_DUMP) console.log(JSON.stringify(gaps));
    console.log(`docgen-coverage: ${gaps.length} component props lack a description (allow-listed: ${UNDESCRIBED_PROPS.size})`);
    expect(fresh, 'add a JSDoc description to these props').toEqual([]);
    expect([...UNDESCRIBED_PROPS].filter((g) => !gaps.includes(g)), 'remove from the allow-list').toEqual([]);
  }, 120000);
});
