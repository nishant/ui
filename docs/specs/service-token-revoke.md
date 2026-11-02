# Service tokens: list and revoke

Status: in progress · Slug: service-token-revoke · Date: 2026-11-02 · Size: large
Repos: nishant/ui (spec lives here); later wave: inbox, nishant.github.io (startpage), status,
trackers, workflows, job-apps, trading
ROADMAP: nishant/mcp `ROADMAP.md` "`nish` MCP follow-ups", entry "A token list (and revoke) in each
app's settings page"

## Goal
Every app that accepts service tokens (the bearer tokens the nish MCP server uses on `/api/v1`)
shows them on its settings page with a Revoke button. Revoking takes effect at once and survives
restarts and deploys, without a git push: revocations live in the app's own state, and the
committed `service-tokens.json` (plus `SERVICE_TOKENS`) stays the seed.

1. `@nish/ui/server` exports `loadManagedServiceTokens` and `jsonRevocationStore`; a revoked
   token gets 401 from `checkServiceRequest`.
2. `@nish/ui/server/hono` exports `mountServiceTokenRoutes` (GET list, POST revoke).
3. `@nish/ui` exports the `ServiceTokensSection` block and the `useServiceTokens` hook, with a
   docs page on design.nish.software.
4. (Wave 2, after the ui release) each app adopts them on its settings page.

## Out of scope
- Minting tokens from the UI (raw tokens are minted by `npm run tokens` in nishant/mcp and
  stored only on the PC).
- Un-revoking. A revoked token stays revoked; access comes back with a new token
  (`npm run tokens -- --apps <app> --rotate` in nishant/mcp, then commit the printed entry).
- Changing `checkServiceRequest`'s loopback rules.

## Decisions
- Revocations are keyed by the token's sha256, not by id: `npm run tokens -- --rotate` can reuse
  an id, and a new token under the same id must not be born revoked. The API addresses tokens by
  id; revoking an id revokes every current entry with that id.
- State is one small JSON file per app, `service-token-revocations.json` in the app's data dir
  (the dir its database lives in; every app keeps it across deploys). Same code for Hono, Fastify,
  sqlite and Postgres apps. Atomic write (temp file + rename).
- No restore/un-revoke (see Out of scope); the confirm dialog says so.
- Block in its own file `src/components/service-tokens.tsx` built from `SettingsSection` and
  `SettingRow`, so it sits with the other settings blocks; session B is editing
  `src/components/settings.tsx` (compact variant) at the same time, so do not touch that file.
  If `SettingsSection` has a `compact` prop when you build, forward a `compact?: boolean` prop.
- The shared view type lives in `src/service-token-types.ts` (types only) so the client and
  `@nish/ui/server` share it without pulling node code into the client bundle.

## Current state
- `src/server/service-tokens.ts`: `ServiceTokenEntry`, `loadServiceTokens({ file, env })` (reads
  once, merges file then env), `createServiceTokens(entries)` (hash map; `verify(authorization,
  scope)` -> `{ ok, entry } | { ok: false, status: 401 | 403 }`; `list()` without hashes),
  `checkServiceRequest(get, { tokens, scope, port })`, `isDirectLoopback`. Re-exported by
  `src/server/index.ts`.
- `src/server/hono.ts`: Hono helpers (`requireSession`, `mountSessionRoutes`,
  `mountInboxAction` is the pattern for a mount helper with a JSDoc contract).
- `src/components/settings.tsx`: `SettingsSection` (title, description, id, actions, children),
  `SettingRow` (label, description, children, htmlFor, stacked, inline, status, statusTone).
- `src/components/overlay.tsx:784` `ConfirmDialog`; `src/components/primitives` `Button`, `Badge`;
  `src/components/feedback` `SkeletonRows`, `ErrorState`, `EmptyState`;
  `src/components/resource` `apiFetch`, `ApiError`; `src/components/hooks` relative time helpers.
- Apps today: `server/service-guard.ts` in inbox, status, trackers, workflows calls
  `loadServiceTokens({ file: <root>/service-tokens.json, env: process.env.SERVICE_TOKENS })`;
  job-apps `packages/api/src/serviceGuard.ts`; trading `packages/server/src/auth/serviceToken.ts`
  (Fastify).

## Design

### Shared type (`src/service-token-types.ts`)
```ts
/** A service token as the settings page sees it: never the hash. */
export interface ServiceTokenView {
  id: string;
  name: string;
  scopes: string[];
  created: string;            // as committed (ISO date or datetime)
  source: 'file' | 'env';     // service-tokens.json or SERVICE_TOKENS
  revoked: boolean;
  revokedAt?: string;         // ISO datetime
}
export interface ServiceTokenListResponse { tokens: ServiceTokenView[] }
export interface ServiceTokenRevokeResponse { tokens: ServiceTokenView[] }
```

### Server (`src/server/service-tokens.ts`, additions; existing exports unchanged)
```ts
export interface RevokedToken { sha256: string; id: string; at: string }
export interface RevocationStore { load(): RevokedToken[]; save(list: RevokedToken[]): void }

/** JSON file store: missing file = []; invalid JSON or shape = console.warn once + [];
 *  save writes `<file>.tmp` then renames, creating the directory. File shape:
 *  { "version": 1, "revoked": RevokedToken[] }. */
export function jsonRevocationStore(file: string): RevocationStore;

export interface ManagedServiceTokens extends ServiceTokens {
  /** Every entry (file first, then env) with its revoked state. */
  views(): ServiceTokenView[];
  /** Revokes every current entry with this id. Returns false when no entry has it.
   *  Idempotent: an already revoked entry keeps its first `at`. */
  revoke(id: string): boolean;
}

export function loadManagedServiceTokens(o: {
  file?: string; env?: string;
  revocations: RevocationStore | string;   // a string is a path for jsonRevocationStore
  now?: () => Date;
}): ManagedServiceTokens;
```
- Build on the existing parsing: refactor `loadServiceTokens` so both share one reader that also
  records each entry's `source`. `loadServiceTokens` keeps its signature and behavior.
- `verify` returns `{ ok: false, status: 401 }` for a revoked hash (same as unknown; do not leak
  that it was revoked). Revoked hashes are a `Set` updated in memory on `revoke` and saved.
- Revocations whose hash is no longer in the seed are kept in the file (harmless, a few bytes)
  but not listed.
- `list()` (inherited) keeps returning every entry without hashes.

### Hono (`src/server/hono.ts`)
```ts
export interface ServiceTokenRouteOptions {
  tokens: ManagedServiceTokens;
  base?: string;                 // default '/api/service-tokens'
  log?: (line: string) => void;  // default console.log
}
/** GET <base> -> 200 { tokens: views() } with Cache-Control: no-store.
 *  POST <base>/:id/revoke -> 200 { tokens: views() } after revoke, logs
 *  `service token <id> revoked`; 404 { error: 'No service token with that id.' } when unknown.
 *  Mount behind the app's login (requireSession) and its cross-site write guard. */
export function mountServiceTokenRoutes<E extends Env>(app: Hono<E>, o: ServiceTokenRouteOptions): void;
```
`:id` is URL-decoded by Hono; ids are compared exactly.

### Client hook (`src/components/service-tokens.tsx`)
```ts
export function useServiceTokens(url = '/api/service-tokens'): {
  tokens: ServiceTokenView[] | undefined; loading: boolean; error: string | null;
  reload(): void; revoke(id: string): Promise<void>;   // POST `${url}/${encodeURIComponent(id)}/revoke`
};
```
Use `apiFetch` (so the app's `configureApi` base and error wording apply). `revoke` replaces
`tokens` with the response's list; on failure it throws the `ApiError` (the block shows it).

### Block (`src/components/service-tokens.tsx`)
```ts
export interface ServiceTokensSectionProps {
  tokens: ServiceTokenView[] | undefined;   // undefined = loading
  error?: string | null;
  onRetry?: () => void;
  onRevoke: (id: string) => Promise<void>;
  title?: ReactNode;          // default 'Service tokens'
  description?: ReactNode;    // default below
  id?: string;                // forwarded to SettingsSection (anchor), default 'service-tokens'
  className?: string;
}
```
- Default description: `Machine clients, like the nish MCP server, use these tokens to read this
  app. Revoking one stops it at once.`
- Loading: `SkeletonRows` (3 rows) inside the section. Error with no tokens: `ErrorState` with
  the message and a `Try again` button calling `onRetry` (when given).
- Empty: one muted line `No service tokens. No machine client can read this app.`
- One `SettingRow` per token, sorted active first, then revoked; within each by `name`:
  - label: the token's `name`;
  - description: `<id> · <scopes joined with ", "> · created <date>` (date via the existing
    date/relative-time helper; fall back to the raw string), plus ` · from SERVICE_TOKENS` when
    `source === 'env'`;
  - control, active: `Button` variant `danger`, size small, text `Revoke`, `aria-label`
    `Revoke <name>`, min 44px touch target on coarse pointers (the library's usual
    `pointer-coarse:` sizing);
  - control, revoked: `Badge` (muted/neutral tone) `Revoked` with `title` = `Revoked <date>`,
    and the row text muted.
- Revoke opens `ConfirmDialog`: title `Revoke <name>?`, body `Anything using this token gets
  "Unauthorized" from now on. This cannot be undone: to restore access, issue a new token with
  npm run tokens in nishant/mcp.`, confirm `Revoke` (danger), cancel `Cancel`. While pending the
  dialog shows its busy state (ConfirmDialog's own pending support); on error the dialog stays
  open and shows the error text (or, if ConfirmDialog cannot show it, close and show the message
  under the row with `statusTone="error"`).
- Layout: rows stack at 360px (label and description wrap, the button stays visible, no
  horizontal scroll); color roles only (`th-*`), no hex; works in light and dark.

### Exports
`src/index.ts`: `ServiceTokensSection`, `useServiceTokens`, types `ServiceTokensSectionProps`,
`ServiceTokenView`, `ServiceTokenListResponse`. `src/server/index.ts` already re-exports
`./service-tokens`; also `export type { ServiceTokenView } from '../service-token-types'` if
`service-tokens.ts` does not already re-export it.

### Docs
- `site/components/service-tokens.tsx` (`id: 'service-tokens'`, group with Settings): demos with
  fake data: two active tokens (`mcp` "nish MCP" scopes `read`; `mcp-handle` "nish MCP (handle)"
  scopes `read, inbox:handle`), one revoked, one from env; plus empty, loading and error states;
  the Revoke flow works against a fake promise (700 ms). A "Server" code sample showing:
  ```ts
  const tokens = loadManagedServiceTokens({
    file: path.join(root, 'service-tokens.json'),
    env: process.env.SERVICE_TOKENS,
    revocations: path.join(dataDir, 'service-token-revocations.json'),
  });
  app.use('/api/v1/*', serviceGuard(tokens));          // checkServiceRequest as before
  app.use('/api/service-tokens/*', requireSession(auth));
  mountServiceTokenRoutes(app, { tokens });
  ```
  and the client `const t = useServiceTokens(); <ServiceTokensSection tokens={t.tokens} error={t.error} onRetry={t.reload} onRevoke={t.revoke} />`.
- Registered in `site/components/index.ts` `COMPONENT_DOCS`, the names in `site/docgen.mjs`
  `COMPONENTS` (if that list exists), `tools/site-all.visual.json`, a README Components row, and a
  CHANGELOG entry in the repo's usual style (do not cut a version: no version bump, no tag).

## Tasks

### T1 Server side
- Checkout: `C:\Code\ui-service-tokens`
- Owns: `src/service-token-types.ts` (new), `src/server/service-tokens.ts`, `src/server/hono.ts`,
  their test files (new or existing, next to the repo's other server tests; vitest).
- Depends on: none
- Tests: revoke makes `verify` 401 and `checkServiceRequest` 401; revoke persists (new
  `loadManagedServiceTokens` over the same file sees it revoked); same id re-minted with a new
  hash is active; unknown id -> false; idempotent `at`; missing/invalid revocation file -> no
  crash; env entries have `source: 'env'`; `loadServiceTokens` unchanged; Hono routes GET/POST/404
  via `app.request`.
- Acceptance: `npm run typecheck`, `npm run test:unit` pass.

### T2 Block, hook and docs page
- Owns: `src/components/service-tokens.tsx` (new), its test (new),
  `site/components/service-tokens.tsx` (new)
- Reads: `src/service-token-types.ts` from T1 (create nothing there; if T1 is not done yet, import
  the type path anyway, T1 runs in parallel and owns that file)
- Depends on: none (import the type from `../service-token-types`)
- Tests: renders rows sorted, Revoke opens dialog, confirm calls `onRevoke`, revoked shows badge,
  empty, loading and error states; hook calls the right URLs (mock fetch).
- Acceptance: `npm run typecheck`, `npm run test:unit` pass.

### T3 Wire-up (runs last)
- Owns: `src/index.ts`, `src/server/index.ts`, `site/components/index.ts`, `site/docgen.mjs`,
  `tools/site-all.visual.json`, `README.md`, `CHANGELOG.md`
- Depends on: T1, T2
- Then run the full checks, `npm run dev:site` on a free port and `node tools/visual-check.mjs
  --only service-tokens` (or the repo's documented visual check) at 360, 840 and 1440 in light and
  dark; look at the pictures; stop the server.
- Acceptance: `npm run check && npm run test:tools && npm run test:unit` pass.

## Wave 2: app adoption (after the ui release reaches the apps; the orchestrator writes these
tasks into a follow-up section of this spec then)
Per app: build the store with `loadManagedServiceTokens` (revocations file in the app's data
dir), keep the existing guard behavior, mount the routes behind the app's login, and render
`ServiceTokensSection` on its settings page (creating a minimal Settings page reachable from the
phone nav where the app has none). inbox has no UI of its own: its section goes on the startpage
Inbox page's settings, through the startpage proxy.

## Waves
W1: T1, T2 · W2: T3 (needs T1, T2)
