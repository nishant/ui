// Process-level safety nets for a long-running server: crash logging and graceful shutdown.

export interface ProcessHandlerOptions {
  name: string;
  log?: (line: string) => void; // default: console.error(`[${iso}] ${name}: ${line}`)
  server?: { close(cb?: (err?: Error) => void): unknown; closeAllConnections?: () => void };
  onShutdown?: () => void | Promise<void>;
  graceMs?: number; // 5000
  exit?: (code: number) => void; // default process.exit, for tests
}

type Handle = { shutdown(signal: string): Promise<void> };
let installed: Handle | null = null;

function describe(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err);
}

/** Installs once per process (a second call returns the first handle):
 *  - unhandledRejection: log `unhandled rejection: <stack or String(reason)>`, keep running.
 *  - uncaughtException: log `uncaught exception: <stack>`, then exit(1) (the supervisor restarts).
 *  - SIGINT, SIGTERM: shutdown(signal). Not SIGBREAK: a task stop sends CTRL+BREAK and the
 *    supervisor reads the child's 0xC000013A exit as "stopping"; a graceful exit 0 would be restarted.
 *  shutdown: runs once; logs `got <signal>, shutting down`; server.close(); closeAllConnections?.();
 *  awaits onShutdown (errors logged as `shutdown hook failed: <msg>`); exit(0). A graceMs timer
 *  (unref'd) logs `forced exit after <graceMs> ms` and exits 0 if that has not finished. */
export function installProcessHandlers(o: ProcessHandlerOptions): Handle {
  if (installed) return installed;
  const log = o.log ?? ((line: string) => console.error(`[${new Date().toISOString()}] ${o.name}: ${line}`));
  const exit = o.exit ?? ((code: number) => process.exit(code));
  const graceMs = o.graceMs ?? 5000;
  let shuttingDown: Promise<void> | null = null;

  const shutdown = (signal: string): Promise<void> => {
    if (shuttingDown) return shuttingDown;
    shuttingDown = (async () => {
      log(`got ${signal}, shutting down`);
      const timer = setTimeout(() => {
        log(`forced exit after ${graceMs} ms`);
        exit(0);
      }, graceMs);
      timer.unref();
      try {
        o.server?.close();
        o.server?.closeAllConnections?.();
      } catch (err) {
        log(`shutdown hook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      try {
        await o.onShutdown?.();
      } catch (err) {
        log(`shutdown hook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      clearTimeout(timer);
      exit(0);
    })();
    return shuttingDown;
  };

  process.on('unhandledRejection', (reason) => {
    log(`unhandled rejection: ${describe(reason)}`);
  });
  process.on('uncaughtException', (err) => {
    log(`uncaught exception: ${describe(err)}`);
    exit(1);
  });
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  installed = { shutdown };
  return installed;
}

/** For any framework's error hook: logs `<method> <path> failed: <stack>` and returns the generic
 *  body. Never puts err.message in the response. */
export function errorResponse(
  err: unknown,
  req: { method: string; path: string },
  log: (line: string) => void = (line) => console.error(line),
): { status: 500; body: { error: string } } {
  log(`${req.method} ${req.path} failed: ${describe(err)}`);
  return { status: 500, body: { error: 'Something went wrong.' } };
}
