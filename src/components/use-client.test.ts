import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A module that calls a hook, createContext or createPortal must start with 'use client', or a server component that renders it throws.
// service-tokens.tsx is a hook-only module (useServiceTokens) without the directive; remove it here once it has one.
const KNOWN_GAPS = new Set<string>();

describe("'use client' on hook-calling modules", () => {
  const dir = __dirname;
  const files = readdirSync(dir).filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f) && !KNOWN_GAPS.has(f));
  it.each(files)('%s', (f) => {
    const src = readFileSync(join(dir, f), 'utf8');
    const usesClientApi = /\buse[A-Z]\w*\(|\bcreateContext\(|\bcreatePortal\(/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''));
    if (usesClientApi) expect(src.trimStart().startsWith("'use client'")).toBe(true);
  });
});
