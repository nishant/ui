import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../cn";
import { date } from "../format";
import type {
  ServiceTokenListResponse,
  ServiceTokenRevokeResponse,
  ServiceTokenView,
} from "../service-token-types";
import { ErrorState, SkeletonRows } from "./feedback";
import { ConfirmDialog } from "./overlay";
import { Badge, Button } from "./primitives";
import { apiFetch } from "./resource";
import { SettingRow, SettingsSection } from "./settings";

// --- useServiceTokens ---------------------------------------------------------------

export interface UseServiceTokens {
  /** undefined until the first load finishes. */
  tokens: ServiceTokenView[] | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Revokes the token with this id and replaces `tokens` with the server's new list. Throws the ApiError on failure. */
  revoke: (id: string) => Promise<void>;
}

/** Loads the app's service tokens from `url` (GET) and revokes one with POST `${url}/<id>/revoke`.
 *  The server side is `mountServiceTokenRoutes` from `@nish/ui/server/hono`. */
export function useServiceTokens(
  url = "/api/service-tokens",
): UseServiceTokens {
  const [tokens, setTokens] = useState<ServiceTokenView[] | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    const ctl = new AbortController();
    apiFetch<ServiceTokenListResponse>(url, { signal: ctl.signal })
      .then((r) => {
        if (seq.current !== mine) return;
        setTokens(r.tokens);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (
          seq.current !== mine ||
          (e instanceof Error && e.name === "AbortError")
        )
          return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      });
    return () => ctl.abort();
  }, [url, nonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  const revoke = useCallback(
    async (id: string) => {
      const r = await apiFetch<ServiceTokenRevokeResponse>(
        `${url}/${encodeURIComponent(id)}/revoke`,
        // A JSON body (and so a JSON content type): some apps refuse non-JSON writes.
        { method: "POST", body: {} },
      );
      seq.current++;
      setTokens(r.tokens);
      setError(null);
      setLoading(false);
    },
    [url],
  );

  return { tokens, loading, error, reload, revoke };
}

// --- ServiceTokensSection -----------------------------------------------------------

export interface ServiceTokensSectionProps {
  /** undefined = loading. */
  tokens: ServiceTokenView[] | undefined;
  error?: string | null;
  onRetry?: () => void;
  /** Revokes the token. Reject to keep the dialog open with the error. */
  onRevoke: (id: string) => Promise<void>;
  /** Default "Service tokens". */
  title?: ReactNode;
  description?: ReactNode;
  /** Anchor id on the section. Default "service-tokens". */
  id?: string;
  className?: string;
}

const DEFAULT_DESCRIPTION =
  "Machine clients, like the nish MCP server, use these tokens to read this app. Revoking one stops it at once.";

/** A calendar date for a committed `created` value (a date or a datetime); the raw string when it does not parse. */
function when(raw: string | undefined): string {
  if (!raw) return "";
  // A bare date means that calendar day: read it as local noon so no time zone shifts it.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;
  const out = date(d, "medium");
  return out === "—" || out === "" || Number.isNaN(new Date(d).getTime())
    ? raw
    : out;
}

function sortTokens(list: ServiceTokenView[]): ServiceTokenView[] {
  return [...list].sort(
    (a, b) =>
      Number(a.revoked) - Number(b.revoked) || a.name.localeCompare(b.name),
  );
}

/** The settings block that lists an app's service tokens with a Revoke button each. */
export function ServiceTokensSection({
  tokens,
  error,
  onRetry,
  onRevoke,
  title = "Service tokens",
  description = DEFAULT_DESCRIPTION,
  id = "service-tokens",
  className,
}: ServiceTokensSectionProps) {
  const [target, setTarget] = useState<ServiceTokenView | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sorted = useMemo(
    () => (tokens ? sortTokens(tokens) : undefined),
    [tokens],
  );

  const close = () => {
    setTarget(null);
    setFailure(null);
  };

  const confirm = async () => {
    if (!target) return;
    setPending(true);
    setFailure(null);
    try {
      await onRevoke(target.id);
      if (mounted.current) close();
    } catch (e) {
      if (mounted.current)
        setFailure(
          e instanceof Error ? e.message : "Could not revoke the token.",
        );
    } finally {
      if (mounted.current) setPending(false);
    }
  };

  const errorRow =
    sorted !== undefined && error ? (
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <p
          role="alert"
          className="min-w-0 flex-1 break-words text-sm text-th-loss"
        >
          {error}
        </p>
        {onRetry ? (
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    ) : null;

  let content: ReactNode;
  if (sorted === undefined && error) {
    content = (
      <div className="grid gap-2 p-4">
        <ErrorState message={error} compact />
        {onRetry ? (
          <div className="flex justify-center">
            <Button size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : null}
      </div>
    );
  } else if (sorted === undefined) {
    content = (
      <div className="p-4">
        <SkeletonRows rows={3} height={48} label="Loading service tokens" />
      </div>
    );
  } else if (sorted.length === 0) {
    content = (
      <>
        {errorRow}
        <p className="px-4 py-6 text-sm text-th-hi3">
          No service tokens. No machine client can read this app.
        </p>
      </>
    );
  } else {
    const rows = sorted.map((t) => {
      const parts = [t.id, t.scopes.join(", "), `created ${when(t.created)}`];
      if (t.source === "env") parts.push("from SERVICE_TOKENS");
      return (
        <SettingRow
          key={`${t.id}:${t.name}:${t.created}`}
          label={
            <span className={cn("break-words", t.revoked && "text-th-hi3")}>
              {t.name}
            </span>
          }
          description={<span className="break-words">{parts.join(" · ")}</span>}
          inline
        >
          {t.revoked ? (
            <Badge
              tone="neutral"
              title={t.revokedAt ? `Revoked ${when(t.revokedAt)}` : "Revoked"}
            >
              Revoked
            </Badge>
          ) : (
            <Button
              variant="danger"
              size="sm"
              aria-label={`Revoke ${t.name}`}
              onClick={() => setTarget(t)}
            >
              Revoke
            </Button>
          )}
        </SettingRow>
      );
    });
    content = (
      <>
        {errorRow}
        {rows}
      </>
    );
  }

  return (
    <>
      <SettingsSection
        title={title}
        description={description}
        id={id}
        className={className}
      >
        {content}
      </SettingsSection>
      {target ? (
        <ConfirmDialog
          title={`Revoke ${target.name}?`}
          body={
            <>
              <p>
                Anything using this token gets &quot;Unauthorized&quot; from now
                on. This cannot be undone: to restore access, issue a new token
                with npm run tokens in nishant/mcp.
              </p>
              {failure ? (
                <p role="alert" className="mt-3 text-th-loss">
                  {failure}
                </p>
              ) : null}
            </>
          }
          confirmLabel="Revoke"
          cancelLabel="Cancel"
          tone="danger"
          pending={pending}
          onConfirm={() => void confirm()}
          onCancel={close}
        />
      ) : null}
    </>
  );
}
