// Small wrappers over `gh` and `git` for the fan-out. Every error message and every line of
// output that can reach a log goes through redact(), so the token never prints.
import { spawnSync } from 'node:child_process';

export function redact(text) {
  let s = String(text ?? '');
  const token = process.env.GH_TOKEN;
  if (token) s = s.split(token).join('***');
  return s.replace(/x-access-token:[^@\s]+@/g, 'x-access-token:***@');
}

export class CmdError extends Error {
  constructor(cmd, args, result) {
    const tail = redact(`${result.stderr}\n${result.stdout}`)
      .trim()
      .split(/\r?\n/)
      .slice(-20)
      .join('\n');
    super(`${cmd} ${redact(args.join(' '))} failed (exit ${result.code})\n${tail}`);
    this.name = 'CmdError';
    this.code = result.code;
    this.output = tail;
  }
}

/** Run a command without a shell. Throws CmdError on a non-zero exit unless allowFail. */
export function run(cmd, args, { cwd, input, allowFail = false, env } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    input,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...env },
  });
  const result = {
    code: r.status ?? (r.error ? 127 : 1),
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? (r.error ? String(r.error.message) : ''),
  };
  if (result.code !== 0 && !allowFail) throw new CmdError(cmd, args, result);
  return result;
}

/** Run a shell command line with bash at `cwd`. */
export function sh(command, opts = {}) {
  return run('bash', ['-c', command], opts);
}

export function git(args, opts = {}) {
  return run('git', args, opts);
}

export function gh(args, opts = {}) {
  return run('gh', args, opts);
}

/**
 * `gh api`. `fields` are sent as string fields (-f). `raw` asks for the file body.
 * Returns stdout; use apiJson for parsed JSON.
 */
export function api(path, { method, fields, raw = false, allowFail = false } = {}) {
  const args = ['api', path];
  if (method) args.push('-X', method);
  if (raw) args.push('-H', 'Accept: application/vnd.github.raw');
  for (const [k, v] of Object.entries(fields ?? {})) args.push('-f', `${k}=${v}`);
  return gh(args, { allowFail });
}

export function apiJson(path, opts = {}) {
  return JSON.parse(api(path, opts).stdout || 'null');
}

/** True when a CmdError is GitHub saying the token may not read this (403). */
export function isForbidden(err) {
  return /HTTP 403|Resource not accessible/i.test(String(err?.output ?? err?.message ?? ''));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
