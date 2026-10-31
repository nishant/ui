// nish-th-check: scans source files for th-* color classes that @nish/ui does not define
// (a made-up color name after "bg-th-", say) and exits 1 when it finds any. Usage: nish-th-check [dir|file ...]
// (default: src). Node only, no dependencies, nothing from React.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { unknownThClasses } from './th-classes';

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.css', '.vue', '.svelte']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'site-dist', '.git', 'coverage']);
// Test files hold deliberately wrong classes as fixtures.
const SKIP_FILE = /[.]test[.][a-z]+$/;

function collect(path: string, out: string[]): void {
  let isDir: boolean;
  try {
    isDir = statSync(path).isDirectory();
  } catch {
    return;
  }
  if (isDir) {
    for (const name of readdirSync(path)) {
      if (!SKIP_DIRS.has(name)) collect(join(path, name), out);
    }
  } else if (EXTENSIONS.has(extname(path)) && !SKIP_FILE.test(path)) {
    out.push(path);
  }
}

function scan(files: string[]): { file: string; line: number; cls: string }[] {
  const found: { file: string; line: number; cls: string }[] = [];
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((text, i) => {
        for (const cls of unknownThClasses(text)) found.push({ file, line: i + 1, cls });
      });
  }
  return found;
}

/** Every unknown th-* class in the given files and directories, with its file and 1-based line. */
export function checkFiles(paths: string[]): { file: string; line: number; cls: string }[] {
  const files: string[] = [];
  for (const p of paths) collect(p, files);
  return scan(files);
}

function main(): void {
  const args = process.argv.slice(2);
  const files: string[] = [];
  for (const p of args.length ? args : ['src']) collect(p, files);
  const found = scan(files);
  for (const f of found) console.log(`${f.file.split('\\').join('/')}:${f.line}: unknown theme class ${f.cls}`);
  if (found.length) process.exit(1);
  console.log(`th-check: ${files.length} files, no unknown th-* classes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
