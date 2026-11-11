'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
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
import { useStrings } from "./provider";
import { TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS } from "./strings";
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
  const strings = useStrings(TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS);
  const [tokens, setTokens] = useState<ServiceTokenView[] | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The url the tokens, error and loading flag above belong to: after a url change they are stale until the new load lands.
  const [ownerUrl, setOwnerUrl] = useState(url);
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);
  const ownerRef = useRef(url);

  useEffect(() => {
    const mine = ++seq.current;
    const ctl = new AbortController();
    apiFetch<ServiceTokenListResponse>(url, { signal: ctl.signal })
      .then((r) => {
        if (seq.current !== mine) return;
        ownerRef.current = url;
        setOwnerUrl(url);
        setTokens(r.tokens);
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (
          seq.current !== mine ||
          (e instanceof Error && e.name === "AbortError")
        )
          return;
        // A failed load for a new url must not keep the old url's list; a failed reload of the same url does.
        if (ownerRef.current !== url) setTokens(undefined);
        ownerRef.current = url;
        setOwnerUrl(url);
        setError(e instanceof Error ? e.message : strings.failedToLoad);
        setLoading(false);
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the fallback text is read when a load fails; a new string must not refetch
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
      ownerRef.current = url;
      setOwnerUrl(url);
      setTokens(r.tokens);
      setError(null);
      setLoading(false);
    },
    [url],
  );

  // After a url change, show the new url's loading state instead of the old url's list or error.
  if (ownerUrl !== url) return { tokens: undefined, loading: true, error: null, reload, revoke };
  return { tokens, loading, error, reload, revoke };
}

// --- ServiceTokensSection -----------------------------------------------------------

export interface ServiceTokensSectionProps
  extends Omit<ComponentPropsWithRef<"section">, "title" | "children"> {
  /** undefined = loading. */
  tokens: ServiceTokenView[] | undefined;
  error?: string | null;
  onRetry?: () => void;
  /** Revokes the token. Reject to keep the dialog open with the error. */
  onRevoke: (id: string) => Promise<void>;
  /** Default: the `serviceTokens` string ("Service tokens"). */
  title?: ReactNode;
  /** Default: the `serviceTokensIntro` string. */
  description?: ReactNode;
  /** Anchor id on the section. Default "service-tokens". */
  id?: string;
  className?: string;
  /** Shown when the list is empty. Default: the `tokenEmpty` string ("No service tokens. No machine client can read this app."). */
  emptyMessage?: ReactNode;
  /** The body of the revoke confirmation. Default: the `tokenRevokeBody` string, which explains that the token stops working and cannot be restored. */
  revokeBody?: ReactNode;
  /** The "created <date>" part of a token's description. Default: the `tokenCreated` string ("created <when>"). */
  createdLabel?: (when: string) => string;
  /** Added to the description of a token that comes from the SERVICE_TOKENS environment variable. Default: the `tokenFromEnv` string ("from SERVICE_TOKENS"). */
  envSourceLabel?: string;
}

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
  title: titleProp,
  description: descriptionProp,
  id = "service-tokens",
  className,
  emptyMessage,
  revokeBody,
  createdLabel,
  envSourceLabel,
  ...rest
}: ServiceTokensSectionProps) {
  const strings = useStrings(TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS);
  const title = titleProp ?? strings.serviceTokens;
  const description = descriptionProp ?? strings.serviceTokensIntro;
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
          e instanceof Error ? e.message : strings.tokenRevokeFailed,
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
            {strings.errorTryAgain}
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
              {strings.errorTryAgain}
            </Button>
          </div>
        ) : null}
      </div>
    );
  } else if (sorted === undefined) {
    content = (
      <div className="p-4">
        <SkeletonRows rows={3} height={48} label={strings.loadingServiceTokens} />
      </div>
    );
  } else if (sorted.length === 0) {
    content = (
      <>
        {errorRow}
        <p className="px-4 py-6 text-sm text-th-hi3">{emptyMessage ?? strings.tokenEmpty}</p>
      </>
    );
  } else {
    const rows = sorted.map((t) => {
      const parts = [t.id, t.scopes.join(", "), (createdLabel ?? strings.tokenCreated)(when(t.created))];
      if (t.source === "env") parts.push(envSourceLabel ?? strings.tokenFromEnv);
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
              title={
                t.revokedAt
                  ? strings.tokenRevokedAt(when(t.revokedAt))
                  : strings.tokenRevoked
              }
            >
              {strings.tokenRevoked}
            </Badge>
          ) : (
            <Button
              variant="danger"
              size="sm"
              aria-label={strings.tokenRevokeNamed(t.name)}
              onClick={() => setTarget(t)}
            >
              {strings.tokenRevoke}
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
        {...rest}
        title={title}
        description={description}
        id={id}
        className={className}
      >
        {content}
      </SettingsSection>
      {target ? (
        <ConfirmDialog
          title={strings.tokenRevokeTitle(target.name)}
          body={
            <>
              {revokeBody ?? <p>{strings.tokenRevokeBody}</p>}
              {failure ? (
                <p role="alert" className="mt-3 text-th-loss">
                  {failure}
                </p>
              ) : null}
            </>
          }
          confirmLabel={strings.tokenRevoke}
          cancelLabel={strings.cancel}
          tone="danger"
          pending={pending}
          onConfirm={() => void confirm()}
          onCancel={close}
        />
      ) : null}
    </>
  );
}
