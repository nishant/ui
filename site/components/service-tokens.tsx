import { useState } from "react";
import { ServiceTokensSection } from "../../src/components/service-tokens";
import type { ServiceTokenView } from "../../src/service-token-types";
import type { ComponentDoc } from "./types";

const SEED: ServiceTokenView[] = [
  {
    id: "mcp",
    name: "nish MCP",
    scopes: ["read"],
    created: "2026-10-30",
    source: "file",
    revoked: false,
  },
  {
    id: "mcp-handle",
    name: "nish MCP (handle)",
    scopes: ["read", "inbox:handle"],
    created: "2026-10-30",
    source: "file",
    revoked: false,
  },
  {
    id: "old-script",
    name: "Old script",
    scopes: ["read"],
    created: "2026-09-12",
    source: "file",
    revoked: true,
    revokedAt: "2026-10-31T16:20:00Z",
  },
  {
    id: "ci-probe",
    name: "CI probe",
    scopes: ["read"],
    created: "2026-10-02T09:00:00Z",
    source: "env",
    revoked: false,
  },
];

const delay = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(
      () =>
        fail ? reject(new Error("Could not reach the server")) : resolve(),
      ms,
    ),
  );

function RevokeDemo({ failRevoke = false }: { failRevoke?: boolean }) {
  const [tokens, setTokens] = useState(SEED);
  return (
    <div className="w-full">
      <ServiceTokensSection
        tokens={tokens}
        onRevoke={async (id) => {
          await delay(700, failRevoke);
          setTokens((list) =>
            list.map((t) =>
              t.id === id
                ? { ...t, revoked: true, revokedAt: new Date().toISOString() }
                : t,
            ),
          );
        }}
      />
    </div>
  );
}

export const serviceTokensDoc: ComponentDoc = {
  id: "service-tokens",
  name: "ServiceTokensSection",
  exports: ["ServiceTokensSection"],
  summary:
    "The settings block that lists the service tokens an app accepts (the bearer tokens the nish MCP server uses) with a Revoke button on each. Revoking asks first, takes effect at once and cannot be undone.",
  importLine:
    "import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens';",
  fleetOnly: true,
  controls: [{ key: "failRevoke", label: "Make revoke fail", type: "boolean" }],
  initial: { failRevoke: false },
  render: (a) => (
    <RevokeDemo key={String(a.failRevoke)} failRevoke={!!a.failRevoke} />
  ),
  code: () =>
    [
      "const t = useServiceTokens();",
      "<ServiceTokensSection tokens={t.tokens} error={t.error} onRetry={t.reload} onRevoke={t.revoke} />",
    ].join("\n"),
  stories: [
    {
      id: "tokens",
      name: "Active, revoked and env tokens",
      note: "Active tokens come first, by name; a revoked one shows a Revoked badge. Revoke asks first, then runs a fake 700 ms request.",
      wide: true,
      render: () => <RevokeDemo />,
    },
    {
      id: "empty",
      name: "No tokens",
      render: () => (
        <div className="w-full">
          <ServiceTokensSection tokens={[]} onRevoke={() => delay(0)} />
        </div>
      ),
    },
    {
      id: "loading",
      name: "Loading",
      render: () => (
        <div className="w-full">
          <ServiceTokensSection tokens={undefined} onRevoke={() => delay(0)} />
        </div>
      ),
    },
    {
      id: "error",
      name: "Load error",
      render: () => (
        <div className="w-full">
          <ServiceTokensSection
            tokens={undefined}
            error="Can't reach the server"
            onRetry={() => undefined}
            onRevoke={() => delay(0)}
          />
        </div>
      ),
    },
    {
      id: "revoke-fails",
      name: "A revoke that fails",
      note: "The dialog stays open and shows the error under the text.",
      render: () => <RevokeDemo failRevoke />,
    },
  ],
  usage: `// Server (Hono): revocations live in the app's data dir, the committed file stays the seed.
const tokens = loadManagedServiceTokens({
  file: path.join(root, 'service-tokens.json'),
  env: process.env.SERVICE_TOKENS,
  revocations: path.join(dataDir, 'service-token-revocations.json'),
});
app.use('/api/v1/*', serviceGuard(tokens));          // checkServiceRequest as before
app.use('/api/service-tokens/*', requireSession(auth));
mountServiceTokenRoutes(app, { tokens });

// Client: the settings page
import { ServiceTokensSection, useServiceTokens } from '@nish/ui/service-tokens';
const t = useServiceTokens();
<ServiceTokensSection tokens={t.tokens} error={t.error} onRetry={t.reload} onRevoke={t.revoke} />`,
  guidelines: [
    "Guard service routes with isDirectCall (@nish/ui/server), the shared direct-call-on-this-PC check that also tests the socket peer. checkServiceRequest takes remoteAddress (hono: remoteAddressOf(c)) to check the peer too; isDirectLoopback is deprecated because it checks headers only.",
    "Put it on the app's settings page; the server routes must sit behind the app's login and its cross-site write guard.",
    "Revoking is final: a revoked token stays revoked, and access comes back with a new token from npm run tokens in nishant/mcp.",
    "Pass useServiceTokens() straight in. With your own state, make onRevoke reject on failure so the dialog stays open with the error.",
    "The block never sees a token or its hash, only the id, name, scopes and dates the server chose to show.",
    "Titles, button names and the confirmation title come from <NishProvider strings> (serviceTokens, serviceTokensIntro, tokenRevoke and the other token* keys). The empty line, the confirmation body, \"created <date>\" and \"from SERVICE_TOKENS\" have no key: set emptyMessage, revokeBody, createdLabel and envSourceLabel per instance. The block takes ref, className and every attribute of its section.",
  ],
  api: {
    functions: ["useServiceTokens"],
    interfaces: ["ServiceTokensSectionProps"],
  },
};
