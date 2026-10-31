// Loading an app's .env and reading numbers from the environment.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

/** Folder `up` levels above the directory of `importMetaUrl` (dist/server/env.js, up 2 = repo root). */
export function appRoot(importMetaUrl: string, up: number = 2): string {
  let dir = dirname(fileURLToPath(importMetaUrl));
  for (let i = 0; i < up; i++) dir = dirname(dir);
  return dir;
}

/** Reads <root>/<file> (default '.env') when it exists, parsed with node:util parseEnv; sets only keys
 *  not already in process.env (the environment wins). Then throws
 *  Error(`${missing.join(' and ')} must be set - see .env.example`) when any `required` key is
 *  empty or unset. Returns the absolute path it read, or null. */
export function loadAppEnv(o: { root: string; file?: string; required?: string[] }): string | null {
  const path = resolve(o.root, o.file ?? '.env');
  let read: string | null = null;
  if (existsSync(path)) {
    const parsed = parseEnv(readFileSync(path, 'utf8'));
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v;
    }
    read = path;
  }
  const missing = (o.required ?? []).filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`${missing.join(' and ')} must be set - see .env.example`);
  return read;
}

/** Positive finite number from an env string, else fallback. */
export function envNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
