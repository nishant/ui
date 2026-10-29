# Workflows: live view of Claude sessions

Status: in progress · Slug: workflow-viz · Date: 2026-10-28 · Size: large
Repos: workflows (new, spec lives here), ui (`@nish/ui` components), hosting (Caddy, sites.yaml, runner), nish.software (hub tile)
ROADMAP: `ROADMAP.md` in workflows, "Live view of Claude sessions"

## Goal

https://workflows.nish.software shows every Claude Code session on the PC that is working right now. Each one is a card with a short line saying what it is doing. Opening a card shows that session's work as a live, animated flow: its plan steps, any Workflow it runs (phases with agent nodes appearing, running and finishing), background agents, and a feed of short updates. When a session finishes, its card plays a completion animation and leaves the list. Animation is a core part of the product, not polish. The visual pieces are reusable `@nish/ui` components, documented on https://design.nish.software.

1. `/` lists working sessions, updating every 2 s; new ones animate in, finished ones show "Done" and animate out.
2. `/s/<id>` shows the session's plan as an animated step flow, each workflow as an animated phase board, background agents, and an activity feed, updating every 1 s.
3. Seven new animated components ship in `@nish/ui` v0.8.0: `FlowSteps`, `StepBar`, `AgentNode`, `WorkflowBoard`, `ActivityFeed`, `TickerText`, `AnimatedList` (plus `usePrefersReducedMotion`), each with a docs page and a live simulated demo.
4. The app is password-protected (`workflowsnish`), deployed like status/trackers on port 8805, listed in hosting `sites.yaml`, with a hub tile.
5. Everything looks right at 360px, ~840px and 1440px, light and dark, and respects `prefers-reduced-motion`.

## Out of scope

- Controlling sessions (stop, send a message, approve). Read-only.
- Sessions on other machines or in the cloud. Only `CLAUDE_DIR` on the PC.
- History of finished sessions, search, stats, costs or token counts.
- Calling an LLM to write summaries. Updates are derived from the transcripts by fixed rules.
- Showing idle sessions (open but waiting for the user). "Active" means working.

## Decisions

- Data source is Claude Code's own files under `CLAUDE_DIR` (`C:\Users\nish5\.claude`): the live registry `sessions/<pid>.json`, transcripts `projects/<encoded-cwd>/<sessionId>.jsonl`, and per-session folders with subagent and workflow files. No hooks or changes to Claude Code. Why: it already has everything and needs no setup per session.
- "Working" = the registry says `busy`, or a workflow or background agent of the session is still running. Idle with nothing running = done. Why: matches the app's own busy/idle and covers a session whose turn ended while its Workflow runs in the background.
- A done session stays in the API for 20 s after it stopped (`DONE_LINGER_MS = 20000`, from the registry's `statusUpdatedAt`), so the list can play the exit. The UI shows "Done" for 2.5 s, then animates the card out. Stateless on the server.
- Live updates by polling (`/api/sessions` every 2000 ms, `/api/sessions/:id` every 1000 ms, paused while the tab is hidden), not SSE. Why: robust through the Cloudflare tunnel, trivial to cache; smoothness comes from client animation, not data rate.
- Whole app behind the password (default). Transcripts hold prompts, paths and repo names. `/health` stays open and exposes no paths.
- Public through the tunnel like trackers, not tailnet-only (default): tailnet would need a Cloudflare DNS change by Nish.
- Port 8805 (next free from 8803).
- Workflow script metadata is read with regexes, never evaluated. Why: no code execution from files.
- Animations are CSS keyframes and transitions plus the Web Animations API for FLIP moves. No animation library. Why: keeps `@nish/ui` dependency-free and the bundle small.
- Component code lives in one new file `src/components/flow.tsx` in `ui`; keyframes and the few non-Tailwind rules go in `src/css/base.css` with a `nish-flow-` prefix.
- Plan steps come from `mcp__ccd_turn__update_plan` calls (and `TodoWrite` for CLI sessions). With no plan in the current turn, the flow shows three synthetic steps: "Request", "Working", "Done".
- Page transitions use the View Transitions API when the browser has it (card title morphs into the page title), skipped under reduced motion.
- App name in the UI: "Workflows". Hub tile: name "Workflows", blurb "Live view of Claude sessions", icon a new `flow` icon, accent indigo.

## Current state

- **Registry** `CLAUDE_DIR/sessions/<pid>.json` (one per running Claude Code process; ignore `*.key` files):
  `{ pid, sessionId, cwd, startedAt, kind, entrypoint, name?, status: 'busy'|'idle', updatedAt, statusUpdatedAt, ... }` (ms timestamps). A file can outlive a crashed process: check the pid with `process.kill(pid, 0)` (throws `ESRCH` when dead; `EPERM` means alive).
- **Transcript** `CLAUDE_DIR/projects/<encoded>/<sessionId>.jsonl`, `<encoded>` = cwd with every non `[A-Za-z0-9]` character replaced by `-` (`C:\Code\trading\.claude\worktrees\x` -> `C--Code-trading--claude-worktrees-x`). Find it by scanning `projects/*/<sessionId>.jsonl` and cache the path. Append-only JSON lines, can be 30 MB; lines with images can be several MB. Relevant entries:
  - `{ type: 'user', timestamp, isSidechain, origin?: { kind: 'human' | 'task-notification' | ... }, message: { content: string | Block[] } }`. A human prompt has `origin.kind === 'human'` and text content (string, or blocks of type `text`/`image`, no `tool_result`). Tool results are `type: 'user'` with `tool_result` blocks.
  - `{ type: 'assistant', timestamp, message: { model, stop_reason: 'tool_use'|'end_turn'|..., content: Block[] } }`, blocks `text`, `thinking` (ignore), `tool_use { id, name, input }`.
  - Many other types (`attachment`, `queue-operation`, `custom-title`, `api-request*`, ...): ignore. Skip `isSidechain: true`.
- **Session folder** `CLAUDE_DIR/projects/<encoded>/<sessionId>/`:
  - `custom-title.json` `{ customTitle }`.
  - `subagents/agent-<id>.jsonl` + `agent-<id>.meta.json` `{ agentType, description, model: 'sonnet'|'opus'|..., finished?: boolean }`: background agents.
  - `workflows/scripts/<name>-<runId>.js`: written when a Workflow starts. `runId` matches `/(wf_[a-z0-9-]+)\.js$/`. The script begins with `export const meta = { name: '...', description: '...', phases: [{ title: '...', detail: '...', model: '...' }, ...] }` (a pure literal; quotes may be `'`, `"` or backticks).
  - `subagents/workflows/<runId>/agent-<id>.jsonl` + `.meta.json` `{ agentType: 'workflow-subagent', description: '<label>', workflowPhase: '<phase title>', model }`: written live while the workflow runs.
  - `workflows/<runId>.json`: written when the workflow ends. `{ runId, workflowName, summary, status: 'completed'|..., startTime, durationMs, phases, workflowProgress: [{ type: 'workflow_phase', index, title } | { type: 'workflow_agent', label, phaseTitle, agentId, model: 'claude-sonnet-5-5', state: 'done'|..., startedAt, lastToolName, lastToolSummary }] }`. Authoritative once present.
- **Template app**: `C:\Code\status` (Hono + Vite + React + `@nish/ui`, HMAC cookie login, SYSTEM task, runner deploy). Copy its shape; see `~/.claude/skills/new-site/references/app-template.md`.
- **`@nish/ui`** (`C:\Code\ui`, v0.7.1): components in `src/components/*.tsx`, exported from `src/index.ts`; keyframes in `src/css/base.css` (`nish-pulse`, `nish-rise-in`, `nish-fade-in`, ...); `StatusDot` already has `pulse`; `duration()` and `ago()` in `src/format.ts`; `useNow`, `useMediaQuery` in `src/components/hooks.tsx`; `EmptyState`, `ErrorState`, `CardListSkeleton`, `Badge` (`BadgeHue`), `Callout`, `AppHeader`, `SectionHeader`, `ConnectionBanner`, `Meter` exist. Docs pages: `site/components/<id>.tsx` registered in `site/components/index.ts` (`ComponentDoc` in `site/components/types.ts`). Checks: `npm run check`. Release: `npm run release minor` (session does it, not an agent).

## Design

### Data (server)

API types: `shared/api.ts` (committed; do not change field names). Server module interface (`server/sessions/index.ts`):

```ts
export interface SessionStore {
  list(): SessionsResponse;               // working + lingering done, newest startedAt first, max 40
  detail(id: string): SessionDetail | null; // any session with a live registry entry (working, done or idle); null otherwise
  stats(): { sessions: number; claudeDirFound: boolean };
}
export function createSessionStore(o: { claudeDir: string; now?: () => number }): SessionStore;
export const DONE_LINGER_MS = 20000;
```

Rules the store applies:

1. **Registry**: read every `sessions/*.json` (skip unparsable, skip dead pids). Re-read on each call (they are tiny).
2. **Transcript reduction** (incremental: cache per file `{ size, mtimeMs, offset, remainder, state }`; on growth read only new bytes, keep a partial last line in `remainder`; on shrink re-read from 0). Only `JSON.parse` a line if it contains `"type":"user"` or `"type":"assistant"`. State kept per transcript:
   - `turnStart` (ms) and `turnPrompt`: a human prompt starts a new turn only if an assistant entry with `stop_reason: 'end_turn'` was seen since the current turn started (or no turn yet). A `task-notification` origin prompt follows the same rule, prompt text "Background task finished".
   - `updates` of the current turn (cap 200 kept, 60 returned), plan state, recap, chapter, set of Workflow tool_use ids.
   - On a new turn: clear updates, recap, chapter; keep the plan state but mark `planTouchedThisTurn = false`.
3. **Plan**: `update_plan` = tool name `mcp__ccd_turn__update_plan`. `items` replaces the list (status `in_progress` -> `active`, `completed` -> `done`, else `pending`); `advance: true` marks the active step done and the first pending after it active; `done: [n]` marks those (1-based) done; `start: n` makes step n active (any other active step becomes pending if not done). `mcp__ccd_turn__wrap_up` marks all steps done. `TodoWrite` `{ todos: [{ content, status }] }` replaces the list the same way. `steps` is returned only if `planTouchedThisTurn`; else synthetic `[{id:'request',label:'Request',done},{id:'working',label:'Working',active},{id:'done',label:'Done',pending}]`, and when the session is done all three are `done`. Step ids: `s1`, `s2`, ... by position.
4. **Update text** (`server/sessions/describe.ts`, pure function `describeTool(name, input): { kind, text } | null`), every result trimmed to 90 chars with `…`:
   - `Bash`, `PowerShell`: `input.description`, else first 60 chars of `input.command`.
   - `Read`: `Reading <basename>`. `Edit`/`MultiEdit`: `Editing <basename>`. `Write`: `Writing <basename>`. `NotebookEdit`: `Editing <basename>`.
   - `Grep`: `Searching for "<pattern, 40 chars>"`. `Glob`: `Finding <pattern>`.
   - `Agent`/`Task`: kind `agent`, `Started agent: <description>`.
   - `Workflow`: kind `workflow`, `Started workflow <meta name>` (name from `input.script` via the meta regex, else `input.name`, else `workflow`).
   - `Skill`: `Using the <skill> skill`. `WebSearch`: `Searching the web: <query>`. `WebFetch`: `Reading <hostname>`.
   - `mcp__Claude_Browser__navigate` / `mcp__claude-in-chrome__navigate`: `Opening <hostname or url>`; `preview_start`: `Starting the preview`; any `computer` action `screenshot`: `Taking a screenshot`; other browser tools: `Checking the browser`. `browser_batch`: `Checking the browser`.
   - `mcp__ccd_turn__update_plan`: kind `plan`; with `items`: `Planned <n> steps`; otherwise `Now: <label of the active step after applying>` (null if none).
   - `mcp__ccd_session__mark_chapter`: kind `plan`, `Chapter: <title>`.
   - `mcp__ccd_turn__wrap_up`: kind `done`, `Done: <recap first sentence>`; also sets `recap = input.recap`.
   - `mcp__ccd_session__start_session`: `Started a session: <title>`.
   - `ToolSearch`, `TodoWrite` (handled as plan, no update), `ReadNotifications`, `mcp__visualize__read_me`: null (no update).
   - Any other `mcp__<server>__<tool>`: `Using <tool with _ as spaces>`; any other name: `Using <name>`.
   - Assistant `text` block: kind `text`, its first sentence (split on `/(?<=[.!?])\s/`), max 120 chars. Skip empty.
   - Human prompt: kind `prompt`, cleaned text max 140 chars.
   - Cleaning for all text: remove `<system-reminder>…</system-reminder>`, `<command-[a-z-]+>…</command-[a-z-]+>` and any other `<tag>…</tag>` wrapper lines, collapse whitespace, trim.
   - Drop an update whose text equals the previous update's text.
5. **Workflows** of a session: each `workflows/scripts/*-wf_*.js`. Meta by regex: `name`, `description` (first `name:`/`description:` string inside `meta = {`), phases = each `{ ... }` inside `phases: [ ... ]` with `title`, `detail`, `model`. Started = earliest of the script file's mtime and its first agent's first timestamp. If `workflows/<runId>.json` exists: status `completed` (or `failed` if its status is not `completed`), endedAt = `startTime + durationMs`, agents from `workflowProgress` (`workflow_agent` entries; `id` = agentId, `label`, `phase` = phaseTitle, `model` short, `state` mapped `done`->`done`, `failed`/`error`->`failed`, else `done`; `activity` = `lastToolSummary` or `Finished`). Else status `running`, agents from `subagents/workflows/<runId>/agent-*.meta.json` + their jsonl (same incremental reader): `startedAt` = first entry timestamp, `toolCalls` = count of `tool_use` blocks, `activity` = describe of the last `tool_use` (or last text block), `state` = `done` if the last assistant entry has `stop_reason: 'end_turn'` or its last tool_use is `StructuredOutput`, else `running`. A running workflow whose newest file is older than 30 min counts as `failed` (stale). Include a workflow in `detail.workflows` if it started at or after `turnStart - 5000` or is running.
6. **Background agents**: `subagents/agent-*.meta.json` (directly in `subagents/`). `state` = `done` if `finished` is true or its jsonl has not changed for 15 min, else `running`. Include if started at or after `turnStart - 5000` or running. `label` = `description`, `phase` = null.
7. **Model short name**: contains `opus` -> `opus`, `sonnet` -> `sonnet`, `haiku` -> `haiku`, `fable` -> `fable`, else the raw value.
8. **Status**: working = registry `busy` or any running workflow or background agent. Otherwise `done` if `now - doneAt < DONE_LINGER_MS` where `doneAt` = max(registry `statusUpdatedAt`, latest workflow/agent end), else not listed.
9. **Agent events in updates**: for each workflow agent, an `agent` update `<label> started` at startedAt and `<label> finished` (state done) / `<label> failed` at its end (last entry timestamp), `source` = label. Merge with transcript updates, newest first, cap 60.
10. **Summary fields**: `title` = registry `name` || `customTitle` || prompt (60 chars) || `Untitled session`. `repo`: if cwd contains `\.claude\worktrees\<x>` -> `<basename of the part before \.claude> · <x>`, else basename of cwd. `activity`: when working, the newest update text, except when the main session is idle and a workflow runs: `<workflow name> · <phase> · <n> running`; when done: `Done`. `plan` = counts from `steps` when a real plan exists, else null. `workflow` = newest workflow of the turn. `updatedAt` = newest mtime among the session's files read.
11. **Limits**: at most 40 sessions listed; never read a transcript line over 8 MB into JSON (skip it); total work per `list()` call must stay under 50 ms on the PC with ~10 sessions after the first warm read.

### HTTP (server/index.ts)

- `GET /health` (open): `{ status: 'ok', startedAt, sessions: number, claudeDirFound: boolean }`.
- `POST /api/login` `{ password }`, `POST /api/logout`, `GET /api/me` -> `{ authed: boolean }`: same as status (`auth.ts`, cookie `workflows_session`).
- `GET /api/sessions` (auth) -> `SessionsResponse`, header `Cache-Control: no-store`.
- `GET /api/sessions/:id` (auth): id must match `/^[0-9a-f-]{36}$/` else 400 `{ error: 'bad_id' }`; null from the store -> 404 `{ error: 'not_found' }`; else `SessionDetail`, `Cache-Control: no-store`.
- Any other `/api/*` -> 404 JSON. Unauthed `/api/*` (except login, me) -> 401 `{ error: 'unauthorized' }`.
- Static: `dist/public` with SPA fallback to `index.html` for non-`/api` GETs (so `/s/<id>` loads).

### `@nish/ui` components (`src/components/flow.tsx`)

All animation CSS is wrapped so it runs only under `@media (prefers-reduced-motion: no-preference)` (Tailwind `motion-safe:` or the media query in base.css). Under reduced motion every state change is instant and nothing loops, except `StatusDot pulse` (unchanged). Colors are roles only (`th-*`). Every component takes `className`.

```ts
export function usePrefersReducedMotion(): boolean; // useMediaQuery('(prefers-reduced-motion: reduce)')

export type FlowStepStatus = 'pending' | 'active' | 'done' | 'failed';
export interface FlowStepItem { id: string; label: ReactNode; status: FlowStepStatus; meta?: ReactNode }
export interface FlowStepsProps {
  steps: FlowStepItem[];
  /** auto: horizontal when the container is at least 640px wide and there are at most 8 steps; else vertical. */
  orientation?: 'auto' | 'vertical' | 'horizontal';
  /** aria-label of the list. Default "Progress". */
  label?: string;
  className?: string;
}
```
FlowSteps: `<ol aria-label>`; `aria-current="step"` on the active item; each node 28px circle; vertical rows at least 44px tall. Use a container query (`@container`) for `auto`. States: pending = `border-th-line` ring with the step number in `text-th-hi3`; active = accent ring with a rotating arc (SVG circle, `stroke-dasharray`, rotate 1.1 s linear infinite) and an expanding ripple ring (scale 1 -> 1.9, opacity .45 -> 0, 1.6 s infinite), label `font-medium text-th-hi1`; done = `bg-th-ok-fill` with a check in `text-th-on-ok`; failed = `bg-th-loss-fill` with an ×. Transitions animate only on a status change after mount (track the previous status per id in a ref): pending/active -> done draws the check (`stroke-dashoffset` 360 ms) and pops the node (scale .7 -> 1.12 -> 1, 320 ms); -> failed shakes once (300 ms). On first mount, items rise in staggered 40 ms each (max 400 ms). Connectors between nodes: a track in `bg-th-line` with an inner fill in `bg-th-ok-fill` whose `scaleX`/`scaleY` goes 0 -> 1 over 500 ms ease-out when the step before it is done; the connector leaving the active step shows a moving accent shimmer (gradient sliding 1.4 s infinite). When every step becomes done (transition, not mount), a one-time accent-to-ok sweep runs along the connectors (each fill delayed 60 ms more than the previous). Horizontal labels sit under the nodes, centered, max 2 lines (`line-clamp-2`), `meta` in `text-xs text-th-hi3`.

```ts
export interface StepBarProps { total: number; done: number; /** pulses the current segment */ active?: boolean; label?: string; className?: string }
```
StepBar: a row of `total` segments (max 12 drawn; above 12 it becomes one continuous bar) 6px tall, gap 3px, rounded. Done segments `bg-th-ok-fill` (fill animates in 400 ms), the segment at index `done` is `bg-th-accent` pulsing opacity when `active`, the rest `bg-th-line`. `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=total`, `aria-valuenow=done`, `aria-label=label ?? 'Progress'`.

```ts
export type AgentNodeState = 'queued' | 'running' | 'done' | 'failed';
export interface AgentNodeProps {
  label: string;
  state: AgentNodeState;
  /** Short model name; opus, sonnet, haiku and fable get their own badge hue. */
  model?: string | null;
  activity?: string;
  /** Right-aligned small text, e.g. elapsed time. */
  meta?: ReactNode;
  onClick?: () => void;
  className?: string;
}
```
AgentNode: rounded-xl card, `bg-th-surface`, min height 64px, padding 12px. Row 1: state icon (running: small spinner arc; done: check in a `bg-th-ok-fill` circle; failed: × in loss; queued: hollow dashed circle), label (`truncate`, `font-medium`), model `Badge` (pick four distinct existing `BadgeHue`s for opus/sonnet/haiku/fable, neutral for others), meta. Row 2: `TickerText` of `activity` in `text-xs text-th-hi3`. Running: a rotating conic-gradient border (accent comet, 2.4 s linear infinite) using `@property --nish-flow-angle` registered in base.css; where `@property` is unsupported the border is a static accent border. Queued: dashed `border-th-line`, opacity .7. Done: border `th-ok-fill` at 40% and the check badge pops (scale .6 -> 1.15 -> 1, 300 ms) on the transition. Failed: loss border, shakes once. Root is `<article aria-label="<label>: <state word>">`; with `onClick` it is a `<button type="button">` with the same label and a focus ring. State words: Queued, Running, Done, Failed.

```ts
export interface WorkflowBoardPhase { id: string; title: string; detail?: ReactNode; model?: string | null }
export interface WorkflowBoardAgent extends Omit<AgentNodeProps, 'className' | 'onClick'> { id: string; /** phase id or title */ phase: string | null }
export interface WorkflowBoardProps { phases: WorkflowBoardPhase[]; agents: WorkflowBoardAgent[]; /** aria-label. Default "Workflow". */ label?: string; className?: string }
```
WorkflowBoard: container query; at least 720px wide: phases are columns (`grid-auto-flow: column`, `grid-auto-columns: minmax(220px, 1fr)`), the board scrolls sideways inside its own box (`overflow-x-auto`) when needed, never the page; below 720px: phases stack vertically. Each phase: header with title, model badge, `<done>/<total>` and a thin bar whose width animates (500 ms); `detail` under it in `text-xs text-th-hi3`. Phase state: waiting (no agents yet) = header dimmed, body shows "Waiting" in `text-th-hi3`; active (any agent running) = header text accent and a soft accent glow pulsing on the column border (2 s infinite); done (all agents done or failed, at least one) = check before the title. Between columns (wide layout): a chevron connector; when the left phase is done or active and the right one is waiting or active, the connector shows a flowing dash animation (`stroke-dashoffset` loop 1 s). Agents are matched to a phase by `phase === id || phase === title`; unmatched agents go into a trailing phase titled "Other" that exists only when needed. Agent nodes enter with rise-in, staggered by their index in the phase (60 ms each, max 600 ms), only for agents not seen in the previous render (no stagger on first mount beyond the same rule). Agents render in the order given.

```ts
export interface ActivityItem { id: string; at: number; text: ReactNode; tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'loss'; source?: ReactNode }
export interface ActivityFeedProps { items: ActivityItem[]; /** default 50 */ max?: number; now?: number; /** default "Activity" */ label?: string; empty?: ReactNode; className?: string }
```
ActivityFeed: `<ol aria-label>`, newest first. Each item: a tone dot on a vertical timeline line, text (`break-words`, `text-sm text-th-hi2`), `source` (`text-xs text-th-hi3`) and the age via `ago(at, { now, style: 'short' })` right-aligned (`text-xs text-th-hi3`, `tabular-nums`). Items with ids not present in the previous render (never on first render) animate in: a wrapper `grid-template-rows: 0fr -> 1fr` with opacity 0 -> 1 and translateY(-6px) -> 0 over 320 ms, plus a background flash of the accent soft color fading over 1.2 s. With no items: `empty` or "No activity yet" in `text-th-hi3`.

```ts
export interface TickerTextProps { text: string; as?: 'span' | 'p' | 'div'; className?: string }
```
TickerText: one line, `overflow-hidden`, ellipsis. When `text` changes, the old text slides up and fades out (200 ms) while the new one slides in from below (260 ms). Keep both spans stacked (grid area overlap) only during the animation, then drop the old one. Initial render: no animation.

```ts
export interface AnimatedListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T, phase: 'enter' | 'idle' | 'exit') => ReactNode;
  /** How long a removed item stays to animate out. Default 420. */
  exitMs?: number;
  as?: 'ul' | 'ol' | 'div';
  className?: string;
  itemClassName?: string;
}
```
AnimatedList: keeps a removed item rendered at its last index with `data-phase="exit"` for `exitMs`, then drops it; re-adding the same key during exit cancels the exit. Items get `data-phase="enter"` for 400 ms after they first appear (not on first mount), then `idle`. Item wrapper (`li` for ul/ol, `div` otherwise): enter = opacity 0, translateY(12px), scale(.98) -> none, 380 ms ease-out; exit = opacity 1 -> 0, scale 1 -> .96, translateY -> -8px, and the wrapper's `grid-template-rows` 1fr -> 0fr (so a single-column list closes the gap), `exitMs` ease-in. Other items move to their new place with FLIP (measure rects before and after in `useLayoutEffect`, animate the delta with `element.animate`, 300 ms ease-out). Reduced motion: no enter/exit/move animation, removed items disappear at once.

Exports: add all of the above components, `usePrefersReducedMotion` and their prop types to `src/index.ts`. `CHANGELOG.md`: a `## 0.8.0` entry "Flow components: FlowSteps, StepBar, AgentNode, WorkflowBoard, ActivityFeed, TickerText, AnimatedList and usePrefersReducedMotion, for live views of multi-step work (workflows.nish.software)." README component list: add them in the same style as the others.

Docs pages (`site/components/`): `flow-steps.tsx`, `step-bar.tsx`, `agent-node.tsx`, `workflow-board.tsx`, `activity-feed.tsx`, `ticker-text.tsx`, `animated-list.tsx`, registered in `site/components/index.ts`, following an existing page (e.g. `status-dot.tsx`) for controls, stories and guidance. A shared simulator `site/components/flow-demo.ts` exports `useFlowDemo()` that drives a fake run on a timer: 6 plan steps advancing every 1.6 s; a workflow with phases Research (1 opus agent), Implement (3 sonnet agents), Review (2 opus agents), Fix (2 sonnet agents) whose agents queue, run 2-5 s with changing activity lines ("Reading spec.md", "Editing server/index.ts", "Running npm test", "Reviewing the diff", "Writing findings") and finish; one in eight agents fails; feed items for each event; the run restarts 4 s after it finishes. Each page's first story uses it ("Live" story); the others show static states (all pending, mid-run, all done, failed). Guidance text, plain wording: when to use each, and "Respects prefers-reduced-motion: no loops or movement, state changes are instant."

### App UI (`workflows/ui`)

Stack and look as in status: React 19, Tailwind 4 + `@nish/ui` (`@import 'tailwindcss'; @import '@nish/ui/tailwind.css';`), theme-init inlined by `vite.config.ts`, roles only.

- **Router** `ui/src/lib/router.ts`: `usePath()`, `navigate(path)` with `history.pushState` + `popstate`; routes `/` and `/s/:id`; anything else renders the list. `navigate` wraps the state update in `document.startViewTransition` when available and reduced motion is off.
- **Data** `ui/src/lib/api.ts`: `fetchSessions(): Promise<SessionsResponse>`, `fetchSession(id): Promise<SessionDetail | null>` (404 -> null), `login(password)`, `logout()`, `me()`; types imported from `../../../shared/api` (path from `ui/src/lib`). 401 from any call sets an `authed=false` state that shows the login page. `ui/src/lib/poll.ts`: `usePoll<T>(fn, intervalMs, deps)` -> `{ data, error, loading, stale }`; stops while `document.hidden`, refetches immediately on `visibilitychange` to visible; `stale` = last success older than 3 intervals; keeps the last good data on error.
- **Login** `ui/src/pages/Login.tsx`: copy status's login page; title "Workflows".
- **Shell** `ui/src/App.tsx`: `AppHeader` with wordmark "Workflows", `homeHref="/"`, actions `ThemeToggle` and a "Log out" text button. `ConnectionBanner` when `stale`. Document title `Workflows`, or `(<n>) Workflows` when n sessions are working.
- **List** `ui/src/pages/SessionList.tsx` at `/`:
  - Line above the grid: `StatusDot tone="accent" pulse` + "<n> sessions working" ("1 session working"); hidden when 0.
  - `AnimatedList` (`as="ul"`) of `SessionCard`, grid 1 column below 840px, 2 columns from 840px, 3 from 1280px, gap 12px.
  - The client keeps a session in the list for 2500 ms after it first sees `status: 'done'`, then removes it (exit animation); the server also drops it after 20 s.
  - Loading: `CardListSkeleton count={3}`. Error with no data: `ErrorState` with a "Retry" action. Empty: `EmptyState` title "Nothing running", detail "Sessions show up here while Claude is working."
- **Card** `ui/src/components/SessionCard.tsx`: the whole card is one `<a href="/s/<id>">` (click -> `navigate`, modifier-click falls through), `cardClass()`, padding 16px, min height 132px. Row 1: `StatusDot tone="accent" pulse` (working) or an ok check (done), title (`line-clamp-2`, `font-semibold`, style `view-transition-name: s-<id>`), elapsed `duration((now - startedAt)/1000)` (ticks each second with `useNow(1000)`, `tabular-nums`, `text-th-hi3`). Row 2: `Badge` with `repo`. Row 3: `TickerText` of `activity` (`text-sm text-th-hi2`). Row 4: with `plan`: `StepBar total done active` + "<done> of <total>" and the current step (`truncate`, `text-xs text-th-hi3`); else with `workflow`: one 8px dot per agent (running = accent pulsing, done = ok) up to 24 + "<name> · <phase>"; else a thin indeterminate shimmer bar (accent, 1.6 s loop) + "Working". Done: border turns `th-ok-fill`, the check pops, activity reads "Done". New cards (not first load) also get a 1.2 s accent glow (box-shadow fade).
- **Detail** `ui/src/pages/SessionView.tsx` at `/s/:id`:
  - Top: link "← All sessions" (`buttonClass({ variant: 'ghost', size: 'sm' })`, 44px), title `h1` (`text-xl font-semibold`, same `view-transition-name`), `Badge` repo, `StatusDot` + "Working" or "Done", elapsed.
  - Prompt card: the prompt clamped to 3 lines with a "Show all" / "Show less" toggle when longer; chapter (if any) as `text-xs text-th-hi3` "Chapter: <title>".
  - Done: `Callout tone="ok"` title "Finished", body = recap (or "This session has finished.").
  - Section "Plan": `FlowSteps` from `steps`.
  - For each workflow, newest first: `SectionHeader` title = name, meta = description + elapsed (or total duration when ended); `WorkflowBoard` with phases (`id` = title) and agents (`meta` = elapsed of the agent, `activity`).
  - Section "Agents" (only if any): grid of `AgentNode` (1 column < 640px, 2 columns up to 1280px, 3 above).
  - Section "Activity": `ActivityFeed` with `updates` mapped: `prompt` -> tone accent, `done` -> ok, `agent` failed -> loss, else neutral; `source` shown.
  - Layout: one column below 1024px (Activity last); from 1024px two columns, main 1fr and Activity 360px sticky (`top` below the header, its own scroll with `max-h-[calc(100dvh-120px)]`).
  - Loading: skeletons shaped like the sections. 404: `EmptyState` title "This session has ended", action link "All sessions". Polls every 1000 ms.
- **Screenshots** `scripts/shots.mjs`: starts the server against the mock (`CLAUDE_DIR=.mock-claude`, `COLLECT` not used), logs in, shoots `/` and the first session's `/s/<id>` at 360x780, 840x900, 1440x900 in light and dark into `shots/` (gitignored), waits 3 s on each page so animations are mid-run.

### Security

- Every `/api/*` route except `login` and `me` requires the session cookie. `/health` is open and returns no paths, titles or prompts.
- Session id validated by regex before touching the filesystem; paths are built only from the registry's own fields and `readdir` results, never from request input beyond the validated id, which is compared against registry `sessionId`s (no path join with the id).
- The server only reads under `CLAUDE_DIR`; it never writes there.
- Text from transcripts is rendered as text (React escaping); no `dangerouslySetInnerHTML`.
- Secrets: `APP_PASSWORD`, `SESSION_SECRET` in `C:\Apps\workflows\.env` only.

### Performance

- Incremental reads (above). The first read of a 30 MB transcript may take up to ~1 s once; later calls read only appended bytes.
- Responses: list under 20 KB for 10 sessions; detail under 60 KB (60 updates, agents' activity lines only).
- UI: no animation library; animations on `transform`/`opacity` only (plus the grid-rows collapse); a page with 40 agent nodes keeps 60 fps on desktop. Infinite loops pause when the tab is hidden (CSS animations do by themselves).

### Ops

- Port 8805. `.env`: `PORT=8805`, `APP_PASSWORD=workflowsnish`, `SESSION_SECRET=<generated>`, `CLAUDE_DIR=C:\Users\nish5\.claude`, `NODE_ENV=production`. Dev default `CLAUDE_DIR` = `os.homedir()/.claude`.
- Live checkout `C:\Apps\workflows`, runner label `workflows`, SYSTEM task `Workflows`, deploy on push to `master` (copy of status's `deploy.yml`, `deploy.ps1`, `tasks.ps1`, `Workflows.task.xml`, `supervise.mjs`).
- hosting: `sites.yaml` entry (`host: workflows.nish.software`, `kind: app`, `repo: nishant/workflows`, `port: 8805`, `health: /health`, `exposure: public`), Caddyfile block, `install-app-runner.yml` option, port lists in README/CLAUDE.md/OPERATIONS. Done by the session, not an agent.

## Tasks

### U1 Flow components in @nish/ui
- Repo / checkout: ui at `C:\Code\ui-workflow-viz`
- Owns: `src/components/flow.tsx` (new), `src/css/base.css`, `src/index.ts`, `CHANGELOG.md`, `README.md`
- Reads: `src/components/display.tsx`, `src/components/hooks.tsx`, `src/components/feedback.tsx`, `src/format.ts`, `src/components/primitives.tsx`, `scripts/build.mjs`, `scripts/build-components.mjs`, `tsup.config.ts`
- Depends on: none
- Change: implement every component in "@nish/ui components" exactly as specified, in `flow.tsx`; keyframes (`nish-flow-spin`, `nish-flow-ripple`, `nish-flow-draw`, `nish-flow-pop`, `nish-flow-shake`, `nish-flow-enter`, `nish-flow-exit`, `nish-flow-flash`, `nish-flow-dash`, `nish-flow-shimmer`, `nish-flow-ticker-in`, `nish-flow-ticker-out`, `nish-flow-ring`, `nish-flow-glow`), the `@property --nish-flow-angle` rule and any `.nish-flow-*` helper classes in `base.css` next to the existing keyframes, all motion inside `@media (prefers-reduced-motion: no-preference)`. Check how base.css reaches consumers (`dist/tailwind.css`) and that Tailwind classes used only in `flow.tsx` get generated for consumers the same way the existing components' classes do. Exports, CHANGELOG `## 0.8.0` (do not change `package.json` version; the release script does), README list.
- Edge cases: empty `steps`/`phases`/`agents`/`items` render nothing broken (FlowSteps with 0 steps renders an empty `<ol>`); 1 step has no connector; 30 steps in vertical; very long labels wrap (vertical) or clamp (horizontal); `done > total` in StepBar clamps; an agent whose phase matches nothing goes to "Other"; ids repeating in `AnimatedList` items: the first wins and a console warning in dev only.
- Acceptance: `npm run check` passes. `npm run dev` demo or a scratch page renders each component without console errors in light and dark.

### U2 Docs pages and live demo
- Repo / checkout: ui at `C:\Code\ui-workflow-viz`
- Owns: `site/components/flow-demo.ts` (new), `site/components/flow-steps.tsx`, `step-bar.tsx`, `agent-node.tsx`, `workflow-board.tsx`, `activity-feed.tsx`, `ticker-text.tsx`, `animated-list.tsx` (all new), `site/components/index.ts`
- Reads: `site/components/types.ts`, `site/components/status-dot.tsx`, `site/components/shared.tsx`, `site/lib/*`, `site/docgen.mjs`, `src/components/flow.tsx`
- Depends on: U1
- Change: pages and the simulator as in "Docs pages". Put the pages in the same group/category the site uses for display or data components (read `types.ts`).
- Acceptance: `npm run check` and `npm run build:site` pass; `npm run dev:site`, open each new page, the Live story animates, no console errors, 360px has no horizontal page scroll.

### W1 App scaffold and HTTP server
- Repo / checkout: workflows at `C:\Code\workflows-workflow-viz`
- Owns: `package.json`, `package-lock.json`, `tsconfig.server.json`, `tsconfig.ui.json`, `vite.config.ts`, `.gitignore`, `.env.example`, `README.md`, `CLAUDE.md`, `server/env.ts`, `server/auth.ts`, `server/index.ts`, `scripts/deploy.ps1`, `scripts/tasks.ps1`, `scripts/Workflows.task.xml`, `scripts/supervise.mjs`, `.github/workflows/deploy.yml`, and a placeholder UI: `ui/index.html`, `ui/src/main.tsx`, `ui/src/App.tsx`, `ui/src/index.css` (renders "Workflows" in an `AppHeader`; replaced by W3 later)
- Reads: everything in `C:\Code\status` (copy and rename per `~/.claude/skills/new-site/references/app-template.md`), `shared/api.ts`
- Depends on: none (codes against the `SessionStore` interface; until W2 lands, import from `./sessions/index.js`, which W2 owns)
- Change: copy status's shape; drop status-specific code (collector, db, probes, github, system, uPlot, seed). `env.ts`: `port` 8805, `claudeDir` (`CLAUDE_DIR` or `path.join(os.homedir(), '.claude')`), password, secret, production. Routes exactly as in "HTTP". `@nish/ui` pinned to `https://codeload.github.com/nishant/ui/tar.gz/refs/tags/v0.7.1` for now. Scripts: `build`, `build:server`, `build:ui`, `typecheck`, `start`, `dev` (server with `CLAUDE_DIR=.mock-claude` plus `vite`; follow status's dev setup), `mock` (`node scripts/mock-claude.mjs .mock-claude`), `test` (`npm run build:server && node --test dist/server/`), `check` (`npm run typecheck && npm test && npm run build`), `shots`. `tsconfig.server.json` must include `shared/` and compile tests (`server/**/*.test.ts`). `.gitignore` adds `.mock-claude/`, `shots/`. CLAUDE.md: status's rules adapted, with the `## Autonomy` section and the Fold 7 rule, plus "Reads Claude Code's files under CLAUDE_DIR; never writes there." README: what it does, env vars, dev with the mock, deploy.
- Edge cases: `CLAUDE_DIR` missing -> store returns empty lists and `/health` says `claudeDirFound: false`; startup must not throw.
- Acceptance: `npm install`, `npm run typecheck` (may fail only on the missing `server/sessions` module while W2 is in flight; the integrate step runs the full check), `npm run build:ui` passes.

### W2 Session store, parser and mock
- Repo / checkout: workflows at `C:\Code\workflows-workflow-viz`
- Owns: `server/sessions/` (new: `index.ts`, `registry.ts`, `jsonl.ts` (incremental reader), `transcript.ts`, `describe.ts`, `workflows.ts`, `agents.ts`, `text.ts`, and tests `*.test.ts`), `scripts/mock-claude.mjs` (new), `test/fixtures/` (new)
- Reads: `shared/api.ts`, this spec's "Data (server)", real files under `C:\Users\nish5\.claude` (read-only, for shapes; never copy real transcript content into fixtures)
- Depends on: none
- Change: implement `createSessionStore` and the rules 1-11. `scripts/mock-claude.mjs <dir> [--once]`: creates a fake CLAUDE_DIR and keeps it changing in real time: (a) a session "Trackers: price alerts" (cwd `C:\Code\trackers`) whose transcript gets a human prompt, an `update_plan` with 6 steps, then every ~3 s a tool_use (Bash with descriptions, Read, Edit) and an `advance`, ending with `wrap_up` and registry `idle` after ~45 s; (b) a session "Hub: new tile" (cwd `C:\Code\nish.software\.claude\worktrees\tile-x`) that starts a Workflow (script file with a `meta` of 4 phases: Research, Implement, Review, Fix) whose agents appear in `subagents/workflows/<runId>/` over time (1, then 3, then 2, then 2), each writing a few tool_use lines and ending with `stop_reason: 'end_turn'`, then writes `workflows/<runId>.json` and goes idle; (c) a session "Skills: dry runs" (cwd `C:\Code\skills`) that spawns 2 background agents (`subagents/agent-*.meta.json`, `finished` set at the end) and stays busy with assistant text lines. Registry files use `process.pid` for `pid` so they count as alive. Without `--once` the whole cycle restarts 10 s after the last session finishes, with new session ids. Tests (node:test) on fixtures: turn detection (mid-turn human message does not reset; prompt after `end_turn` does), plan replay (`items`, `advance`, `done`, `start`, `wrap_up`, TodoWrite), `describeTool` for every rule, incremental reader (partial last line across two appends, shrink -> re-read), workflow meta regex (single, double and backtick quotes), running vs completed workflow, status + linger (fake `now`), dead pid skipped, repo naming for worktree paths, `detail()` returns null for unknown ids.
- Edge cases: transcript missing (registry only): session listed with title from registry, activity "Starting", empty updates; unreadable JSON lines skipped; registry `name` absent; workflow script without `meta`; agent jsonl empty.
- Acceptance: `npx tsc -p tsconfig.server.json --noEmit` (once W1's config exists) and `npm test` pass; running the mock and calling `createSessionStore({ claudeDir: '.mock-claude' }).list()` from a scratch script shows the three sessions changing over time.

### W3 App UI (second wave, after @nish/ui v0.8.0 is released)
- Repo / checkout: workflows at `C:\Code\workflows-workflow-viz`
- Owns: `ui/index.html`, `ui/src/**` (replacing the placeholder), `scripts/shots.mjs`, `public/` assets if any, and the `@nish/ui` line in `package.json` + `package-lock.json` (bump to `v0.8.0`)
- Reads: `shared/api.ts`, `server/index.ts`, `C:\Code\status\ui\src\**` (patterns), `node_modules/@nish/ui/dist/index.d.ts`
- Depends on: W1, W2, U1 released
- Change: everything in "App UI".
- Acceptance: `npm run check` passes; `npm run mock` + `npm run dev`, then `npm run shots`; look at all 12 pictures: no horizontal scroll at 360px, cards and boards readable, animations mid-run visible; `hosting/docs/design-system/ds-gates.sh ui/src` exits 0.

## Waves

- Workflow A (ui): W1: U1 · W2: U2 (needs U1). Lenses: correctness, ui.
- Workflow B (workflows), in parallel with A: W1, W2 together. Lenses: correctness, security, performance.
- Session: release `@nish/ui` v0.8.0 (`npm run release minor --no-bump`; no consumer needs it yet).
- Workflow C (workflows): W3. Lenses: ui, correctness.
- Session: hosting PR and hub tile prepared while A/B/C run.

## Review focus

- Parser correctness against real transcripts (turn boundaries, plan replay, workflow running/completed), and that a working session never disappears while its workflow runs.
- Auth on every `/api` route; no path built from request input.
- Animations: they run on state transitions, not on every poll (no re-animation every second); reduced motion turns them off; no layout thrash; FLIP and exit in AnimatedList correct when items are added and removed in the same render.
- 360px: cards, FlowSteps vertical, WorkflowBoard stacked, ActivityFeed below; no horizontal page scroll.

## Release

1. ui: PR `workflow-viz` -> merge -> `npm run release minor --no-bump` from `C:\Code\ui` master (tag `v0.8.0`, design.nish.software updates from the tag via hosting).
2. workflows: create `nishant/workflows` (private), write `C:\Apps\workflows\.env`, merge the `workflow-viz` PR (deploy queues), then hosting PR merge, then install the runner (`install-app-runner` with a registration token). Verify `https://workflows.nish.software/health`, log in, screenshots at 360/840/1440 light and dark on the live site with real sessions.
3. hub tile in nish.software (`tile/workflows`), PR, merge, check the tile and its probe.

## Open questions for the research phase

None.
