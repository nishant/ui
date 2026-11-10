// Reads each docs page's id, name, summary, exports, framed and fleetOnly straight from the
// source with the TypeScript AST, so the site shell can list every page without importing any
// of them. Those properties must be literals; anything else throws and names the file.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const parse = (file) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Strips `as`, `satisfies`, `!` and parentheses around an expression. */
function unwrap(node) {
  let n = node;
  while (n && (ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isParenthesizedExpression(n) || ts.isNonNullExpression(n))) n = n.expression;
  return n;
}

function fail(file, prop) {
  throw new Error(`docs-meta: site/components/${file}: "${prop}" must be a literal`);
}

function stringOf(node, file, prop) {
  const n = unwrap(node);
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) return stringOf(n.left, file, prop) + stringOf(n.right, file, prop);
  return fail(file, prop);
}

function propsOf(obj) {
  const map = new Map();
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) map.set(p.name.text, p.initializer);
  }
  return map;
}

function readDoc(file, identifier, dir) {
  const path = join(dir, file);
  if (!existsSync(path)) throw new Error(`docs-meta: no doc file site/components/${file} (imported for ${identifier}; doc files must be .tsx)`);
  const sf = parse(path);
  let init = null;
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === identifier && d.initializer) init = d.initializer;
    }
  }
  if (!init) throw new Error(`docs-meta: ${identifier} is not exported by site/components/${file}`);
  const obj = unwrap(init);
  if (!ts.isObjectLiteralExpression(obj)) return fail(file, 'the doc object');
  const props = propsOf(obj);
  const need = (k) => {
    const v = props.get(k);
    if (!v) return fail(file, k);
    return v;
  };

  const exportsNode = unwrap(need('exports'));
  if (!ts.isArrayLiteralExpression(exportsNode)) fail(file, 'exports');
  const exportsList = exportsNode.elements.map((e) => stringOf(e, file, 'exports'));

  const meta = {
    id: stringOf(need('id'), file, 'id'),
    name: stringOf(need('name'), file, 'name'),
    summary: stringOf(need('summary'), file, 'summary'),
    exports: exportsList,
    file,
    exportName: identifier,
  };

  if (props.has('framed')) {
    const framed = unwrap(props.get('framed'));
    if (!ts.isObjectLiteralExpression(framed)) fail(file, 'framed');
    const h = propsOf(framed).get('height');
    const hn = h && unwrap(h);
    if (!hn || !ts.isNumericLiteral(hn)) fail(file, 'framed');
    meta.framed = { height: Number(hn.text) };
  }
  if (props.has('fleetOnly')) {
    const f = unwrap(props.get('fleetOnly'));
    if (f.kind === ts.SyntaxKind.TrueKeyword) meta.fleetOnly = true;
    else if (f.kind === ts.SyntaxKind.FalseKeyword) meta.fleetOnly = false;
    else fail(file, 'fleetOnly');
  }
  return meta;
}

/** Every doc listed in COMPONENT_DOCS (site/components/index.ts), in that order. */
export function docsMeta(root) {
  const dir = join(root, 'site', 'components');
  const sf = parse(join(dir, 'index.ts'));

  // identifier -> file basename, from `import { a } from './x'`
  const fileOf = new Map();
  let list = null;
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && ts.isStringLiteral(st.moduleSpecifier)) {
      const spec = st.moduleSpecifier.text;
      if (!spec.startsWith('./')) continue;
      for (const el of st.importClause.namedBindings.elements) fileOf.set(el.name.text, `${spec.slice(2)}.tsx`);
    }
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === 'COMPONENT_DOCS' && d.initializer) list = unwrap(d.initializer);
      }
    }
  }
  if (!list || !ts.isArrayLiteralExpression(list)) throw new Error('docs-meta: site/components/index.ts has no COMPONENT_DOCS array literal');

  return list.elements.map((el) => {
    const n = unwrap(el);
    if (!ts.isIdentifier(n)) throw new Error('docs-meta: site/components/index.ts: COMPONENT_DOCS must list identifiers');
    const file = fileOf.get(n.text);
    if (!file) throw new Error(`docs-meta: ${n.text} is not imported from a file in site/components/`);
    return readDoc(file, n.text, dir);
  });
}
