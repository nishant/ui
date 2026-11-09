"use client";

// src/components/service-tokens.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { date } from "../format.js";
import { ErrorState, SkeletonRows } from "./feedback.js";
import { ConfirmDialog } from "./overlay.js";
import { Badge, Button } from "./primitives.js";
import { apiFetch } from "./resource.js";
import { useStrings } from "./provider.js";
import { TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS } from "./strings.js";
import { SettingRow, SettingsSection } from "./settings.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function useServiceTokens(url = "/api/service-tokens") {
  const strings = useStrings(TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS);
  const [tokens, setTokens] = useState(
    void 0
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);
  useEffect(() => {
    const mine = ++seq.current;
    const ctl = new AbortController();
    apiFetch(url, { signal: ctl.signal }).then((r) => {
      if (seq.current !== mine) return;
      setTokens(r.tokens);
      setLoading(false);
    }).catch((e) => {
      if (seq.current !== mine || e instanceof Error && e.name === "AbortError")
        return;
      setError(e instanceof Error ? e.message : strings.failedToLoad);
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
    async (id) => {
      const r = await apiFetch(
        `${url}/${encodeURIComponent(id)}/revoke`,
        // A JSON body (and so a JSON content type): some apps refuse non-JSON writes.
        { method: "POST", body: {} }
      );
      seq.current++;
      setTokens(r.tokens);
      setError(null);
      setLoading(false);
    },
    [url]
  );
  return { tokens, loading, error, reload, revoke };
}
function when(raw) {
  if (!raw) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;
  const out = date(d, "medium");
  return out === "\u2014" || out === "" || Number.isNaN(new Date(d).getTime()) ? raw : out;
}
function sortTokens(list) {
  return [...list].sort(
    (a, b) => Number(a.revoked) - Number(b.revoked) || a.name.localeCompare(b.name)
  );
}
function ServiceTokensSection({
  tokens,
  error,
  onRetry,
  onRevoke,
  title: titleProp,
  description: descriptionProp,
  id = "service-tokens",
  className,
  emptyMessage = "No service tokens. No machine client can read this app.",
  revokeBody,
  createdLabel = (when2) => `created ${when2}`,
  envSourceLabel = "from SERVICE_TOKENS",
  ...rest
}) {
  const strings = useStrings(TOKEN_STRINGS, STATUS_STRINGS, ERROR_STRINGS, OVERLAY_STRINGS);
  const title = titleProp ?? strings.serviceTokens;
  const description = descriptionProp ?? strings.serviceTokensIntro;
  const [target, setTarget] = useState(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const sorted = useMemo(
    () => tokens ? sortTokens(tokens) : void 0,
    [tokens]
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
          e instanceof Error ? e.message : strings.tokenRevokeFailed
        );
    } finally {
      if (mounted.current) setPending(false);
    }
  };
  const errorRow = sorted !== void 0 && error ? /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 px-4 py-2", children: [
    /* @__PURE__ */ jsx(
      "p",
      {
        role: "alert",
        className: "min-w-0 flex-1 break-words text-sm text-th-loss",
        children: error
      }
    ),
    onRetry ? /* @__PURE__ */ jsx(Button, { size: "sm", onClick: onRetry, children: strings.errorTryAgain }) : null
  ] }) : null;
  let content;
  if (sorted === void 0 && error) {
    content = /* @__PURE__ */ jsxs("div", { className: "grid gap-2 p-4", children: [
      /* @__PURE__ */ jsx(ErrorState, { message: error, compact: true }),
      onRetry ? /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(Button, { size: "sm", onClick: onRetry, children: strings.errorTryAgain }) }) : null
    ] });
  } else if (sorted === void 0) {
    content = /* @__PURE__ */ jsx("div", { className: "p-4", children: /* @__PURE__ */ jsx(SkeletonRows, { rows: 3, height: 48, label: strings.loadingServiceTokens }) });
  } else if (sorted.length === 0) {
    content = /* @__PURE__ */ jsxs(Fragment, { children: [
      errorRow,
      /* @__PURE__ */ jsx("p", { className: "px-4 py-6 text-sm text-th-hi3", children: emptyMessage })
    ] });
  } else {
    const rows = sorted.map((t) => {
      const parts = [t.id, t.scopes.join(", "), createdLabel(when(t.created))];
      if (t.source === "env") parts.push(envSourceLabel);
      return /* @__PURE__ */ jsx(
        SettingRow,
        {
          label: /* @__PURE__ */ jsx("span", { className: cn("break-words", t.revoked && "text-th-hi3"), children: t.name }),
          description: /* @__PURE__ */ jsx("span", { className: "break-words", children: parts.join(" \xB7 ") }),
          inline: true,
          children: t.revoked ? /* @__PURE__ */ jsx(
            Badge,
            {
              tone: "neutral",
              title: t.revokedAt ? strings.tokenRevokedAt(when(t.revokedAt)) : strings.tokenRevoked,
              children: strings.tokenRevoked
            }
          ) : /* @__PURE__ */ jsx(
            Button,
            {
              variant: "danger",
              size: "sm",
              "aria-label": strings.tokenRevokeNamed(t.name),
              onClick: () => setTarget(t),
              children: strings.tokenRevoke
            }
          )
        },
        `${t.id}:${t.name}:${t.created}`
      );
    });
    content = /* @__PURE__ */ jsxs(Fragment, { children: [
      errorRow,
      rows
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      SettingsSection,
      {
        ...rest,
        title,
        description,
        id,
        className,
        children: content
      }
    ),
    target ? /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        title: strings.tokenRevokeTitle(target.name),
        body: /* @__PURE__ */ jsxs(Fragment, { children: [
          revokeBody ?? /* @__PURE__ */ jsx("p", { children: 'Anything using this token gets "Unauthorized" from now on. This cannot be undone: to restore access, issue a new token with npm run tokens in nishant/mcp.' }),
          failure ? /* @__PURE__ */ jsx("p", { role: "alert", className: "mt-3 text-th-loss", children: failure }) : null
        ] }),
        confirmLabel: strings.tokenRevoke,
        cancelLabel: strings.cancel,
        tone: "danger",
        pending,
        onConfirm: () => void confirm(),
        onCancel: close
      }
    ) : null
  ] });
}
export {
  ServiceTokensSection,
  useServiceTokens
};
